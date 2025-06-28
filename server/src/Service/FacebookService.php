<?php
declare(strict_types=1);

namespace App\Service;

use Cake\Core\Configure;
use Exception;

/**
 * Facebook Platform Service
 *
 * Handles Facebook API integration for OAuth, posting, and analytics
 */
class FacebookService extends AbstractSocialMediaService
{
    private const GRAPH_API_VERSION = 'v18.0';
    private const BASE_URL = 'https://graph.facebook.com';

    /**
     * Get platform name
     *
     * @return string Platform name
     */
    public function getPlatformName(): string
    {
        return 'facebook';
    }

    /**
     * Get platform-specific configuration
     *
     * @return array Configuration data
     */
    protected function getConfig(): array
    {
        return Configure::read('SocialMedia.Facebook', [
            'app_id' => '',
            'app_secret' => '',
            'redirect_uri' => 'http://localhost:3000/oauth/facebook/callback'
        ]);
    }

    /**
     * Get authorization URL for OAuth flow
     *
     * @param string $clientId Client ID for state parameter
     * @return string Authorization URL
     */
    public function getAuthorizationUrl(string $clientId): string
    {
        if (empty($this->config['app_id'])) {
            throw new Exception('Facebook App ID not configured');
        }

        $state = $this->generateState($clientId);
        $scope = 'pages_manage_posts,pages_read_engagement,pages_show_list,publish_to_groups';

        $params = [
            'client_id' => $this->config['app_id'],
            'redirect_uri' => $this->config['redirect_uri'],
            'scope' => $scope,
            'response_type' => 'code',
            'state' => $state
        ];

        return 'https://www.facebook.com/v' . self::GRAPH_API_VERSION . '/dialog/oauth?' . http_build_query($params);
    }

    /**
     * Handle OAuth callback and exchange code for access token
     *
     * @param string $code Authorization code
     * @param string $state State parameter
     * @param string $clientId Client ID
     * @return array Account data including tokens
     */
    public function handleCallback(string $code, string $state, string $clientId): array
    {
        $this->validateState($state, $clientId);

        // Exchange code for access token
        $tokenResponse = $this->makeRequest('GET', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . '/oauth/access_token', [
            'query' => [
                'client_id' => $this->config['app_id'],
                'client_secret' => $this->config['app_secret'],
                'redirect_uri' => $this->config['redirect_uri'],
                'code' => $code
            ]
        ]);

        if (!isset($tokenResponse['access_token'])) {
            throw new Exception('Failed to obtain access token');
        }

        $userAccessToken = $tokenResponse['access_token'];

        // Get user's pages
        $pagesResponse = $this->makeRequest('GET', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . '/me/accounts', [
            'query' => [
                'access_token' => $userAccessToken,
                'fields' => 'id,name,access_token,category,tasks'
            ]
        ]);

        if (empty($pagesResponse['data'])) {
            throw new Exception('No Facebook pages found for this account');
        }

        // For now, use the first page (in production, let user choose)
        $page = $pagesResponse['data'][0];

        // Check if page has required permissions
        if (!in_array('MANAGE', $page['tasks'] ?? [])) {
            throw new Exception('Insufficient permissions for this Facebook page');
        }

        return [
            'account_id' => $page['id'],
            'account_name' => $page['name'],
            'access_token' => $page['access_token'], // Page access token
            'refresh_token' => null, // Facebook page tokens don't expire
            'expires_at' => null,
            'account_data' => [
                'page_id' => $page['id'],
                'page_name' => $page['name'],
                'page_category' => $page['category'] ?? null,
                'user_access_token' => $userAccessToken
            ]
        ];
    }

    /**
     * Refresh access token using refresh token
     *
     * @param string $refreshToken Refresh token
     * @return array New token data
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        // Facebook page access tokens don't expire, so no refresh needed
        throw new Exception('Facebook page access tokens do not expire');
    }

    /**
     * Test if access token is valid
     *
     * @param string $accessToken Access token to test
     * @return bool True if valid, false otherwise
     */
    public function testConnection(string $accessToken): bool
    {
        try {
            $response = $this->makeRequest('GET', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . '/me', [
                'query' => [
                    'access_token' => $accessToken,
                    'fields' => 'id,name'
                ]
            ]);

            return isset($response['id']);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Publish content to Facebook
     *
     * @param string $accessToken Page access token
     * @param array $content Content data
     * @param array $options Platform-specific options
     * @return array Publication result
     */
    public function publishContent(string $accessToken, array $content, array $options = []): array
    {
        if (!$this->checkRateLimit('post')) {
            throw new Exception('Rate limit exceeded for posting');
        }

        $pageId = $options['page_id'] ?? null;
        if (!$pageId) {
            throw new Exception('Page ID is required for Facebook posting');
        }

        $postData = [
            'access_token' => $accessToken
        ];

        // Add content based on type
        if (!empty($content['text'])) {
            $postData['message'] = $content['text'];
        }

        if (!empty($content['link'])) {
            $postData['link'] = $content['link'];
        }

        // Handle scheduled posting
        if (!empty($options['scheduled_time'])) {
            $scheduledTime = strtotime($options['scheduled_time']);
            if ($scheduledTime > time()) {
                $postData['scheduled_publish_time'] = $scheduledTime;
                $postData['published'] = 'false';
            }
        }

        // Post to Facebook
        $endpoint = self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$pageId}/feed";

        if (!empty($content['media'])) {
            // Handle media posts differently
            return $this->publishMediaPost($accessToken, $pageId, $content, $options);
        }

        $response = $this->makeRequest('POST', $endpoint, [
            'data' => $postData
        ]);

        if (!isset($response['id'])) {
            throw new Exception('Failed to publish post to Facebook');
        }

        return [
            'platform_post_id' => $response['id'],
            'status' => 'published',
            'published_at' => date('Y-m-d H:i:s'),
            'platform_data' => $response
        ];
    }

    /**
     * Publish media post to Facebook
     *
     * @param string $accessToken Page access token
     * @param string $pageId Page ID
     * @param array $content Content data
     * @param array $options Platform-specific options
     * @return array Publication result
     */
    private function publishMediaPost(string $accessToken, string $pageId, array $content, array $options = []): array
    {
        $mediaIds = [];

        // Upload media files first
        foreach ($content['media'] as $mediaFile) {
            $mediaResult = $this->uploadMedia($accessToken, $mediaFile['path'], [
                'page_id' => $pageId,
                'type' => $mediaFile['type']
            ]);
            $mediaIds[] = $mediaResult['media_id'];
        }

        $postData = [
            'access_token' => $accessToken,
            'attached_media' => json_encode(array_map(function($id) {
                return ['media_fbid' => $id];
            }, $mediaIds))
        ];

        if (!empty($content['text'])) {
            $postData['message'] = $content['text'];
        }

        // Handle scheduled posting
        if (!empty($options['scheduled_time'])) {
            $scheduledTime = strtotime($options['scheduled_time']);
            if ($scheduledTime > time()) {
                $postData['scheduled_publish_time'] = $scheduledTime;
                $postData['published'] = 'false';
            }
        }

        $endpoint = self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$pageId}/feed";
        $response = $this->makeRequest('POST', $endpoint, [
            'data' => $postData
        ]);

        if (!isset($response['id'])) {
            throw new Exception('Failed to publish media post to Facebook');
        }

        return [
            'platform_post_id' => $response['id'],
            'status' => 'published',
            'published_at' => date('Y-m-d H:i:s'),
            'platform_data' => $response,
            'media_ids' => $mediaIds
        ];
    }

    /**
     * Upload media file to Facebook
     *
     * @param string $accessToken Page access token
     * @param string $filePath Local file path
     * @param array $options Upload options
     * @return array Upload result with media ID
     */
    public function uploadMedia(string $accessToken, string $filePath, array $options = []): array
    {
        $pageId = $options['page_id'] ?? null;
        if (!$pageId) {
            throw new Exception('Page ID is required for media upload');
        }

        $mediaType = $options['type'] ?? 'image';
        $allowedTypes = [
            'image' => ['image/jpeg', 'image/png', 'image/gif'],
            'video' => ['video/mp4', 'video/mov', 'video/avi']
        ];

        $maxSizes = [
            'image' => 4 * 1024 * 1024, // 4MB
            'video' => 100 * 1024 * 1024 // 100MB
        ];

        $this->validateFile($filePath, $allowedTypes[$mediaType] ?? [], $maxSizes[$mediaType] ?? 0);

        $endpoint = self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$pageId}/photos";
        if ($mediaType === 'video') {
            $endpoint = self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$pageId}/videos";
        }

        $response = $this->makeRequest('POST', $endpoint, [
            'data' => [
                'access_token' => $accessToken,
                'published' => 'false' // Upload but don't publish
            ],
            'files' => [
                'source' => $filePath
            ]
        ]);

        if (!isset($response['id'])) {
            throw new Exception('Failed to upload media to Facebook');
        }

        return [
            'media_id' => $response['id'],
            'media_type' => $mediaType,
            'upload_time' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Get analytics for a published post
     *
     * @param string $accessToken Page access token
     * @param string $postId Facebook post ID
     * @return array Analytics data
     */
    public function getPostAnalytics(string $accessToken, string $postId): array
    {
        if (!$this->checkRateLimit('analytics')) {
            throw new Exception('Rate limit exceeded for analytics');
        }

        $insights = [
            'post_impressions',
            'post_reach',
            'post_engaged_users',
            'post_clicks',
            'post_reactions_like_total',
            'post_reactions_love_total',
            'post_reactions_wow_total',
            'post_reactions_haha_total',
            'post_reactions_sorry_total',
            'post_reactions_anger_total'
        ];

        $response = $this->makeRequest('GET', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$postId}/insights", [
            'query' => [
                'access_token' => $accessToken,
                'metric' => implode(',', $insights)
            ]
        ]);

        $analytics = [];
        if (isset($response['data'])) {
            foreach ($response['data'] as $metric) {
                $analytics[$metric['name']] = $metric['values'][0]['value'] ?? 0;
            }
        }

        // Get basic post data
        $postResponse = $this->makeRequest('GET', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$postId}", [
            'query' => [
                'access_token' => $accessToken,
                'fields' => 'created_time,message,permalink_url,shares'
            ]
        ]);

        return [
            'post_id' => $postId,
            'created_time' => $postResponse['created_time'] ?? null,
            'message' => $postResponse['message'] ?? null,
            'permalink_url' => $postResponse['permalink_url'] ?? null,
            'shares_count' => $postResponse['shares']['count'] ?? 0,
            'impressions' => $analytics['post_impressions'] ?? 0,
            'reach' => $analytics['post_reach'] ?? 0,
            'engaged_users' => $analytics['post_engaged_users'] ?? 0,
            'clicks' => $analytics['post_clicks'] ?? 0,
            'reactions' => [
                'like' => $analytics['post_reactions_like_total'] ?? 0,
                'love' => $analytics['post_reactions_love_total'] ?? 0,
                'wow' => $analytics['post_reactions_wow_total'] ?? 0,
                'haha' => $analytics['post_reactions_haha_total'] ?? 0,
                'sorry' => $analytics['post_reactions_sorry_total'] ?? 0,
                'anger' => $analytics['post_reactions_anger_total'] ?? 0
            ],
            'total_reactions' => array_sum($analytics),
            'collected_at' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Get Facebook-specific rate limits
     *
     * @return array Rate limit information
     */
    public function getRateLimits(): array
    {
        return [
            'post' => ['limit' => 25, 'window' => 3600], // 25 posts per hour
            'upload' => ['limit' => 10, 'window' => 3600], // 10 uploads per hour
            'analytics' => ['limit' => 200, 'window' => 3600], // 200 requests per hour
        ];
    }
}
