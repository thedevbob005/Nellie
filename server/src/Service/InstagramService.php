<?php
declare(strict_types=1);

namespace App\Service;

use Cake\Core\Configure;
use Exception;

/**
 * Instagram Platform Service
 *
 * Handles Instagram API integration for OAuth, posting, and analytics
 * Uses Instagram Graph API (business accounts) for content management
 */
class InstagramService extends AbstractSocialMediaService
{
    private const GRAPH_API_VERSION = 'v18.0';
    private const BASE_URL = 'https://graph.facebook.com';
    private const INSTAGRAM_BASE_URL = 'https://graph.instagram.com';

    /**
     * Get platform name
     *
     * @return string Platform name
     */
    public function getPlatformName(): string
    {
        return 'instagram';
    }

    /**
     * Get platform-specific configuration
     *
     * @return array Configuration data
     */
    protected function getConfig(): array
    {
        return Configure::read('SocialMedia.Instagram', [
            'app_id' => '',
            'app_secret' => '',
            'redirect_uri' => 'http://localhost:3000/oauth/instagram/callback'
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
            throw new Exception('Instagram App ID not configured');
        }

        $state = $this->generateState($clientId);
        $scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';

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

        // Get user's Facebook pages with Instagram accounts
        $pagesResponse = $this->makeRequest('GET', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . '/me/accounts', [
            'query' => [
                'access_token' => $userAccessToken,
                'fields' => 'id,name,access_token,instagram_business_account{id,name,username,profile_picture_url}'
            ]
        ]);

        if (empty($pagesResponse['data'])) {
            throw new Exception('No Facebook pages found for this account');
        }

        // Find a page with Instagram business account
        $instagramAccount = null;
        $pageAccessToken = null;

        foreach ($pagesResponse['data'] as $page) {
            if (isset($page['instagram_business_account'])) {
                $instagramAccount = $page['instagram_business_account'];
                $pageAccessToken = $page['access_token'];
                break;
            }
        }

        if (!$instagramAccount) {
            throw new Exception('No Instagram business account found. Please connect an Instagram business account to your Facebook page.');
        }

        // Get long-lived access token for Instagram
        $longLivedTokenResponse = $this->makeRequest('GET', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . '/oauth/access_token', [
            'query' => [
                'grant_type' => 'fb_exchange_token',
                'client_id' => $this->config['app_id'],
                'client_secret' => $this->config['app_secret'],
                'fb_exchange_token' => $pageAccessToken
            ]
        ]);

        $longLivedToken = $longLivedTokenResponse['access_token'] ?? $pageAccessToken;

        return [
            'account_id' => $instagramAccount['id'],
            'account_name' => '@' . ($instagramAccount['username'] ?? $instagramAccount['name']),
            'access_token' => $longLivedToken,
            'refresh_token' => null, // Instagram uses long-lived tokens
            'expires_at' => null, // Long-lived tokens expire in 60 days but we'll handle renewal
            'account_data' => [
                'instagram_account_id' => $instagramAccount['id'],
                'username' => $instagramAccount['username'] ?? null,
                'name' => $instagramAccount['name'] ?? null,
                'profile_picture_url' => $instagramAccount['profile_picture_url'] ?? null,
                'page_access_token' => $pageAccessToken,
                'user_access_token' => $userAccessToken
            ]
        ];
    }

    /**
     * Refresh access token using refresh token
     *
     * @param string $refreshToken Refresh token (not used for Instagram)
     * @return array New token data
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        // Instagram uses long-lived tokens that need to be refreshed differently
        throw new Exception('Instagram tokens should be refreshed using the long-lived token renewal process');
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
                    'fields' => 'id,name,username'
                ]
            ]);

            return isset($response['id']);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Publish content to Instagram
     *
     * @param string $accessToken Access token
     * @param array $content Content data
     * @param array $options Platform-specific options
     * @return array Publication result
     */
    public function publishContent(string $accessToken, array $content, array $options = []): array
    {
        if (!$this->checkRateLimit('post')) {
            throw new Exception('Rate limit exceeded for posting');
        }

        $instagramAccountId = $options['instagram_account_id'] ?? null;
        if (!$instagramAccountId) {
            throw new Exception('Instagram account ID is required for posting');
        }

        if (empty($content['media'])) {
            throw new Exception('Instagram posts require at least one media file');
        }

        // Instagram requires media to be posted as containers first
        if (count($content['media']) === 1) {
            return $this->publishSingleMediaPost($accessToken, $instagramAccountId, $content, $options);
        } else {
            return $this->publishCarouselPost($accessToken, $instagramAccountId, $content, $options);
        }
    }

    /**
     * Publish single media post to Instagram
     *
     * @param string $accessToken Access token
     * @param string $instagramAccountId Instagram account ID
     * @param array $content Content data
     * @param array $options Platform-specific options
     * @return array Publication result
     */
    private function publishSingleMediaPost(string $accessToken, string $instagramAccountId, array $content, array $options = []): array
    {
        $mediaFile = $content['media'][0];
        $isVideo = in_array($mediaFile['type'], ['video', 'mp4', 'mov']);

        // Step 1: Create media container
        $containerData = [
            'access_token' => $accessToken,
            'image_url' => $mediaFile['url'] ?? null,
            'video_url' => $isVideo ? ($mediaFile['url'] ?? null) : null,
            'media_type' => $isVideo ? 'VIDEO' : 'IMAGE',
        ];

        if (!empty($content['text'])) {
            $containerData['caption'] = $content['text'];
        }

        if (!empty($options['location_id'])) {
            $containerData['location_id'] = $options['location_id'];
        }

        $containerResponse = $this->makeRequest('POST', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$instagramAccountId}/media", [
            'data' => $containerData
        ]);

        if (!isset($containerResponse['id'])) {
            throw new Exception('Failed to create Instagram media container');
        }

        $containerId = $containerResponse['id'];

        // Step 2: Wait for container to be ready (for videos)
        if ($isVideo) {
            $this->waitForContainerReady($accessToken, $containerId);
        }

        // Step 3: Publish the container
        $publishResponse = $this->makeRequest('POST', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$instagramAccountId}/media_publish", [
            'data' => [
                'access_token' => $accessToken,
                'creation_id' => $containerId
            ]
        ]);

        if (!isset($publishResponse['id'])) {
            throw new Exception('Failed to publish Instagram post');
        }

        return [
            'platform_post_id' => $publishResponse['id'],
            'status' => 'published',
            'published_at' => date('Y-m-d H:i:s'),
            'platform_data' => [
                'container_id' => $containerId,
                'publish_response' => $publishResponse
            ]
        ];
    }

    /**
     * Publish carousel post to Instagram
     *
     * @param string $accessToken Access token
     * @param string $instagramAccountId Instagram account ID
     * @param array $content Content data
     * @param array $options Platform-specific options
     * @return array Publication result
     */
    private function publishCarouselPost(string $accessToken, string $instagramAccountId, array $content, array $options = []): array
    {
        $containerIds = [];

        // Step 1: Create containers for each media item
        foreach ($content['media'] as $mediaFile) {
            $isVideo = in_array($mediaFile['type'], ['video', 'mp4', 'mov']);

            $containerData = [
                'access_token' => $accessToken,
                'image_url' => $mediaFile['url'] ?? null,
                'video_url' => $isVideo ? ($mediaFile['url'] ?? null) : null,
                'media_type' => $isVideo ? 'VIDEO' : 'IMAGE',
                'is_carousel_item' => 'true'
            ];

            $containerResponse = $this->makeRequest('POST', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$instagramAccountId}/media", [
                'data' => $containerData
            ]);

            if (!isset($containerResponse['id'])) {
                throw new Exception('Failed to create Instagram carousel container');
            }

            $containerIds[] = $containerResponse['id'];
        }

        // Step 2: Create carousel container
        $carouselData = [
            'access_token' => $accessToken,
            'media_type' => 'CAROUSEL',
            'children' => implode(',', $containerIds)
        ];

        if (!empty($content['text'])) {
            $carouselData['caption'] = $content['text'];
        }

        if (!empty($options['location_id'])) {
            $carouselData['location_id'] = $options['location_id'];
        }

        $carouselResponse = $this->makeRequest('POST', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$instagramAccountId}/media", [
            'data' => $carouselData
        ]);

        if (!isset($carouselResponse['id'])) {
            throw new Exception('Failed to create Instagram carousel');
        }

        $carouselId = $carouselResponse['id'];

        // Step 3: Publish the carousel
        $publishResponse = $this->makeRequest('POST', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$instagramAccountId}/media_publish", [
            'data' => [
                'access_token' => $accessToken,
                'creation_id' => $carouselId
            ]
        ]);

        if (!isset($publishResponse['id'])) {
            throw new Exception('Failed to publish Instagram carousel');
        }

        return [
            'platform_post_id' => $publishResponse['id'],
            'status' => 'published',
            'published_at' => date('Y-m-d H:i:s'),
            'platform_data' => [
                'carousel_id' => $carouselId,
                'container_ids' => $containerIds,
                'publish_response' => $publishResponse
            ]
        ];
    }

    /**
     * Wait for video container to be ready
     *
     * @param string $accessToken Access token
     * @param string $containerId Container ID
     * @param int $maxAttempts Maximum attempts
     */
    private function waitForContainerReady(string $accessToken, string $containerId, int $maxAttempts = 10): void
    {
        for ($i = 0; $i < $maxAttempts; $i++) {
            $statusResponse = $this->makeRequest('GET', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$containerId}", [
                'query' => [
                    'access_token' => $accessToken,
                    'fields' => 'status_code'
                ]
            ]);

            $statusCode = $statusResponse['status_code'] ?? 'UNKNOWN';

            if ($statusCode === 'FINISHED') {
                return;
            } elseif ($statusCode === 'ERROR') {
                throw new Exception('Instagram video processing failed');
            }

            // Wait 2 seconds before checking again
            sleep(2);
        }

        throw new Exception('Instagram video processing timeout');
    }

    /**
     * Upload media file to Instagram (for URL-based uploads)
     *
     * @param string $accessToken Access token
     * @param string $filePath Local file path
     * @param array $options Upload options
     * @return array Upload result with media URL
     */
    public function uploadMedia(string $accessToken, string $filePath, array $options = []): array
    {
        // Instagram Graph API requires media to be accessible via URL
        // This method would typically upload to a CDN first
        throw new Exception('Instagram media must be uploaded to a publicly accessible URL first');
    }

    /**
     * Get analytics for a published post
     *
     * @param string $accessToken Access token
     * @param string $postId Instagram media ID
     * @return array Analytics data
     */
    public function getPostAnalytics(string $accessToken, string $postId): array
    {
        if (!$this->checkRateLimit('analytics')) {
            throw new Exception('Rate limit exceeded for analytics');
        }

        // Get basic media information
        $mediaResponse = $this->makeRequest('GET', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$postId}", [
            'query' => [
                'access_token' => $accessToken,
                'fields' => 'id,caption,media_type,media_url,permalink,timestamp,username'
            ]
        ]);

        // Get insights (analytics) for the media
        $insights = [
            'impressions',
            'reach',
            'engagement',
            'likes',
            'comments',
            'saves',
            'shares'
        ];

        $insightsResponse = $this->makeRequest('GET', self::BASE_URL . '/v' . self::GRAPH_API_VERSION . "/{$postId}/insights", [
            'query' => [
                'access_token' => $accessToken,
                'metric' => implode(',', $insights)
            ]
        ]);

        $analytics = [];
        if (isset($insightsResponse['data'])) {
            foreach ($insightsResponse['data'] as $metric) {
                $analytics[$metric['name']] = $metric['values'][0]['value'] ?? 0;
            }
        }

        return [
            'post_id' => $postId,
            'media_type' => $mediaResponse['media_type'] ?? null,
            'caption' => $mediaResponse['caption'] ?? null,
            'permalink' => $mediaResponse['permalink'] ?? null,
            'timestamp' => $mediaResponse['timestamp'] ?? null,
            'username' => $mediaResponse['username'] ?? null,
            'impressions' => $analytics['impressions'] ?? 0,
            'reach' => $analytics['reach'] ?? 0,
            'engagement' => $analytics['engagement'] ?? 0,
            'likes' => $analytics['likes'] ?? 0,
            'comments' => $analytics['comments'] ?? 0,
            'saves' => $analytics['saves'] ?? 0,
            'shares' => $analytics['shares'] ?? 0,
            'collected_at' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Get Instagram-specific rate limits
     *
     * @return array Rate limit information
     */
    public function getRateLimits(): array
    {
        return [
            'post' => ['limit' => 25, 'window' => 86400], // 25 posts per day
            'upload' => ['limit' => 50, 'window' => 3600], // 50 uploads per hour
            'analytics' => ['limit' => 200, 'window' => 3600], // 200 requests per hour
        ];
    }
}
