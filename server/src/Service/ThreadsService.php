<?php
declare(strict_types=1);

namespace App\Service;

use Cake\Core\Configure;
use Exception;

/**
 * Threads Platform Service
 *
 * Handles Meta Threads API integration for OAuth, posting, and analytics
 * Uses the Threads API v1.0 (Meta Platform)
 */
class ThreadsService extends AbstractSocialMediaService
{
    private const API_BASE_URL = 'https://graph.threads.net/v1.0';
    private const AUTH_BASE_URL = 'https://threads.net/oauth/authorize';
    private const TOKEN_URL = 'https://graph.threads.net/oauth/access_token';

    /**
     * Get platform name
     *
     * @return string Platform name
     */
    public function getPlatformName(): string
    {
        return 'threads';
    }

    /**
     * Get platform-specific configuration
     *
     * @return array Configuration data
     */
    protected function getConfig(): array
    {
        return Configure::read('SocialMedia.Threads', [
            'app_id' => '',
            'app_secret' => '',
            'redirect_uri' => 'http://localhost:3000/oauth/threads/callback'
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
            throw new Exception('Threads App ID not configured');
        }

        $state = $this->generateState($clientId);
        $scope = 'threads_basic,threads_content_publish,threads_manage_insights';

        $params = [
            'client_id' => $this->config['app_id'],
            'redirect_uri' => $this->config['redirect_uri'],
            'scope' => $scope,
            'response_type' => 'code',
            'state' => $state
        ];

        return self::AUTH_BASE_URL . '?' . http_build_query($params);
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
        $tokenData = [
            'client_id' => $this->config['app_id'],
            'client_secret' => $this->config['app_secret'],
            'grant_type' => 'authorization_code',
            'redirect_uri' => $this->config['redirect_uri'],
            'code' => $code
        ];

        $headers = [
            'Content-Type' => 'application/x-www-form-urlencoded'
        ];

        $tokenResponse = $this->makeRequest('POST', self::TOKEN_URL, [
            'headers' => $headers,
            'data' => $tokenData
        ]);

        if (!isset($tokenResponse['access_token'])) {
            throw new Exception('Failed to obtain access token from Threads');
        }

        $accessToken = $tokenResponse['access_token'];

        // Get user profile information
        $userResponse = $this->makeRequest('GET', self::API_BASE_URL . '/me', [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken
            ],
            'query' => [
                'fields' => 'id,username,name,threads_profile_picture_url,threads_biography'
            ]
        ]);

        if (!isset($userResponse['id'])) {
            throw new Exception('Failed to get user profile from Threads');
        }

        return [
            'account_id' => $userResponse['id'],
            'account_name' => '@' . ($userResponse['username'] ?? $userResponse['name']),
            'access_token' => $accessToken,
            'refresh_token' => $tokenResponse['refresh_token'] ?? null,
            'expires_at' => isset($tokenResponse['expires_in']) ?
                date('Y-m-d H:i:s', time() + $tokenResponse['expires_in']) : null,
            'account_data' => [
                'user_id' => $userResponse['id'],
                'username' => $userResponse['username'] ?? null,
                'name' => $userResponse['name'] ?? null,
                'biography' => $userResponse['threads_biography'] ?? null,
                'profile_picture_url' => $userResponse['threads_profile_picture_url'] ?? null
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
        if (empty($refreshToken)) {
            throw new Exception('Refresh token is required');
        }

        $tokenData = [
            'client_id' => $this->config['app_id'],
            'client_secret' => $this->config['app_secret'],
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken
        ];

        $headers = [
            'Content-Type' => 'application/x-www-form-urlencoded'
        ];

        $response = $this->makeRequest('POST', self::TOKEN_URL, [
            'headers' => $headers,
            'data' => $tokenData
        ]);

        if (!isset($response['access_token'])) {
            throw new Exception('Failed to refresh Threads access token');
        }

        return [
            'access_token' => $response['access_token'],
            'refresh_token' => $response['refresh_token'] ?? $refreshToken,
            'expires_at' => isset($response['expires_in']) ?
                date('Y-m-d H:i:s', time() + $response['expires_in']) : null
        ];
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
            $response = $this->makeRequest('GET', self::API_BASE_URL . '/me', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken
                ],
                'query' => [
                    'fields' => 'id'
                ]
            ]);

            return isset($response['id']);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Publish content to Threads
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

        $headers = [
            'Authorization' => 'Bearer ' . $accessToken,
            'Content-Type' => 'application/json'
        ];

        // Prepare post data
        $postData = [
            'media_type' => 'TEXT'
        ];

        // Add text content (max 500 characters)
        if (!empty($content['text'])) {
            $postData['text'] = $this->truncateText($content['text'], 500);
        }

        // Handle media content
        if (!empty($content['media'])) {
            $mediaFile = $content['media'][0]; // Threads supports single media per post

            if ($this->isImageFile($mediaFile['path'])) {
                $postData['media_type'] = 'IMAGE';
                $postData['image_url'] = $this->getPublicMediaUrl($mediaFile['path']);
            } elseif ($this->isVideoFile($mediaFile['path'])) {
                $postData['media_type'] = 'VIDEO';
                $postData['video_url'] = $this->getPublicMediaUrl($mediaFile['path']);
            }
        }

        // Handle reply functionality
        if (!empty($options['reply_to_id'])) {
            $postData['reply_to_id'] = $options['reply_to_id'];
        }

        // Handle quote post functionality
        if (!empty($options['quote_post_id'])) {
            $postData['quote_post_id'] = $options['quote_post_id'];
        }

        // Step 1: Create media container
        $containerResponse = $this->makeRequest('POST', self::API_BASE_URL . '/me/threads', [
            'headers' => $headers,
            'json' => $postData
        ]);

        if (!isset($containerResponse['id'])) {
            throw new Exception('Failed to create Threads media container');
        }

        $containerId = $containerResponse['id'];

        // Step 2: Publish the container
        $publishData = [
            'creation_id' => $containerId
        ];

        $publishResponse = $this->makeRequest('POST', self::API_BASE_URL . '/me/threads_publish', [
            'headers' => $headers,
            'json' => $publishData
        ]);

        if (!isset($publishResponse['id'])) {
            throw new Exception('Failed to publish Threads post');
        }

        return [
            'platform_post_id' => $publishResponse['id'],
            'status' => 'published',
            'published_at' => date('Y-m-d H:i:s'),
            'platform_data' => [
                'thread_id' => $publishResponse['id'],
                'container_id' => $containerId,
                'media_type' => $postData['media_type'],
                'response' => $publishResponse
            ]
        ];
    }

    /**
     * Upload media file to Threads (requires public URL)
     *
     * @param string $accessToken Access token
     * @param string $filePath Local file path
     * @param array $options Upload options
     * @return array Upload result with media URL
     */
    public function uploadMedia(string $accessToken, string $filePath, array $options = []): array
    {
        if (!file_exists($filePath)) {
            throw new Exception('Media file not found: ' . $filePath);
        }

        $this->validateFile($filePath);

        // Threads API requires media to be accessible via public URL
        // In production, you would upload to your CDN/storage first
        $publicUrl = $this->getPublicMediaUrl($filePath);

        return [
            'media_url' => $publicUrl,
            'file_size' => filesize($filePath),
            'mime_type' => mime_content_type($filePath),
            'is_image' => $this->isImageFile($filePath),
            'is_video' => $this->isVideoFile($filePath)
        ];
    }

    /**
     * Get analytics for a published post
     *
     * @param string $accessToken Access token
     * @param string $postId Threads post ID
     * @return array Analytics data
     */
    public function getPostAnalytics(string $accessToken, string $postId): array
    {
        if (!$this->checkRateLimit('analytics')) {
            throw new Exception('Rate limit exceeded for analytics');
        }

        $headers = [
            'Authorization' => 'Bearer ' . $accessToken
        ];

        // Get post information
        $postResponse = $this->makeRequest('GET', self::API_BASE_URL . "/{$postId}", [
            'headers' => $headers,
            'query' => [
                'fields' => 'id,media_type,text,timestamp,username,permalink'
            ]
        ]);

        // Get post insights
        $insights = [
            'likes',
            'replies',
            'reposts',
            'quotes',
            'views'
        ];

        $insightsResponse = $this->makeRequest('GET', self::API_BASE_URL . "/{$postId}/insights", [
            'headers' => $headers,
            'query' => [
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
            'media_type' => $postResponse['media_type'] ?? null,
            'text' => $postResponse['text'] ?? null,
            'timestamp' => $postResponse['timestamp'] ?? null,
            'username' => $postResponse['username'] ?? null,
            'permalink' => $postResponse['permalink'] ?? null,
            'likes' => $analytics['likes'] ?? 0,
            'replies' => $analytics['replies'] ?? 0,
            'reposts' => $analytics['reposts'] ?? 0,
            'quotes' => $analytics['quotes'] ?? 0,
            'views' => $analytics['views'] ?? 0,
            'engagement_rate' => $this->calculateEngagementRate($analytics, $analytics['views'] ?? 0),
            'collected_at' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Create a reply to an existing thread
     *
     * @param string $accessToken Access token
     * @param string $threadId Thread ID to reply to
     * @param array $content Reply content
     * @param array $options Reply options
     * @return array Reply result
     */
    public function createReply(string $accessToken, string $threadId, array $content, array $options = []): array
    {
        $options['reply_to_id'] = $threadId;
        return $this->publishContent($accessToken, $content, $options);
    }

    /**
     * Create a quote post
     *
     * @param string $accessToken Access token
     * @param string $threadId Thread ID to quote
     * @param array $content Quote content
     * @param array $options Quote options
     * @return array Quote result
     */
    public function createQuotePost(string $accessToken, string $threadId, array $content, array $options = []): array
    {
        $options['quote_post_id'] = $threadId;
        return $this->publishContent($accessToken, $content, $options);
    }

    /**
     * Get public URL for media file
     *
     * @param string $filePath Local file path
     * @return string Public URL
     */
    private function getPublicMediaUrl(string $filePath): string
    {
        // In production, upload to your CDN/storage and return the public URL
        // For development, you might use a local server or temporary hosting

        $baseUrl = 'https://your-domain.com/media/'; // Configure this
        $filename = basename($filePath);

        return $baseUrl . $filename;
    }

    /**
     * Check if file is an image
     *
     * @param string $filePath File path
     * @return bool True if image file
     */
    private function isImageFile(string $filePath): bool
    {
        $mimeType = mime_content_type($filePath);
        return strpos($mimeType, 'image/') === 0;
    }

    /**
     * Check if file is a video
     *
     * @param string $filePath File path
     * @return bool True if video file
     */
    private function isVideoFile(string $filePath): bool
    {
        $mimeType = mime_content_type($filePath);
        return strpos($mimeType, 'video/') === 0;
    }

    /**
     * Truncate text to Threads character limit
     *
     * @param string $text Original text
     * @param int $limit Character limit
     * @return string Truncated text
     */
    private function truncateText(string $text, int $limit = 500): string
    {
        if (strlen($text) <= $limit) {
            return $text;
        }

        return substr($text, 0, $limit - 3) . '...';
    }

    /**
     * Calculate engagement rate
     *
     * @param array $analytics Analytics data
     * @param int $views View count
     * @return float Engagement rate percentage
     */
    private function calculateEngagementRate(array $analytics, int $views): float
    {
        if ($views === 0) {
            return 0.0;
        }

        $totalEngagements = ($analytics['likes'] ?? 0) +
                          ($analytics['replies'] ?? 0) +
                          ($analytics['reposts'] ?? 0) +
                          ($analytics['quotes'] ?? 0);

        return round(($totalEngagements / $views) * 100, 2);
    }

    /**
     * Get Threads-specific rate limits
     *
     * @return array Rate limit information
     */
    public function getRateLimits(): array
    {
        return [
            'post' => ['limit' => 250, 'window' => 86400], // 250 posts per day
            'upload' => ['limit' => 100, 'window' => 3600], // 100 uploads per hour
            'analytics' => ['limit' => 200, 'window' => 3600], // 200 requests per hour
        ];
    }
}
