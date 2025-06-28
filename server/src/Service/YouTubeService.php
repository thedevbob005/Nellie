<?php
declare(strict_types=1);

namespace App\Service;

use Cake\Core\Configure;
use Exception;

/**
 * YouTube Platform Service
 *
 * Handles YouTube Data API v3 integration for OAuth, video uploads, and analytics
 * Supports video uploads, community posts, and channel management
 */
class YouTubeService extends AbstractSocialMediaService
{
    private const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
    private const UPLOAD_BASE_URL = 'https://www.googleapis.com/upload/youtube/v3';
    private const AUTH_BASE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    /**
     * Get platform name
     *
     * @return string Platform name
     */
    public function getPlatformName(): string
    {
        return 'youtube';
    }

    /**
     * Get platform-specific configuration
     *
     * @return array Configuration data
     */
    protected function getConfig(): array
    {
        return Configure::read('SocialMedia.YouTube', [
            'client_id' => '',
            'client_secret' => '',
            'redirect_uri' => 'http://localhost:3000/oauth/youtube/callback'
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
        if (empty($this->config['client_id'])) {
            throw new Exception('YouTube Client ID not configured');
        }

        $state = $this->generateState($clientId);
        $scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.readonly';

        $params = [
            'client_id' => $this->config['client_id'],
            'redirect_uri' => $this->config['redirect_uri'],
            'scope' => $scope,
            'response_type' => 'code',
            'access_type' => 'offline',
            'state' => $state,
            'prompt' => 'consent'
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
            'code' => $code,
            'client_id' => $this->config['client_id'],
            'client_secret' => $this->config['client_secret'],
            'redirect_uri' => $this->config['redirect_uri'],
            'grant_type' => 'authorization_code'
        ];

        $headers = [
            'Content-Type' => 'application/x-www-form-urlencoded'
        ];

        $tokenResponse = $this->makeRequest('POST', self::TOKEN_URL, [
            'headers' => $headers,
            'data' => $tokenData
        ]);

        if (!isset($tokenResponse['access_token'])) {
            throw new Exception('Failed to obtain access token from Google');
        }

        $accessToken = $tokenResponse['access_token'];

        // Get channel information
        $channelResponse = $this->makeRequest('GET', self::API_BASE_URL . '/channels', [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken
            ],
            'query' => [
                'part' => 'id,snippet,statistics,brandingSettings',
                'mine' => 'true'
            ]
        ]);

        if (empty($channelResponse['items'])) {
            throw new Exception('No YouTube channel found for this account');
        }

        $channel = $channelResponse['items'][0];
        $snippet = $channel['snippet'];
        $statistics = $channel['statistics'] ?? [];

        return [
            'account_id' => $channel['id'],
            'account_name' => $snippet['title'],
            'access_token' => $accessToken,
            'refresh_token' => $tokenResponse['refresh_token'] ?? null,
            'expires_at' => isset($tokenResponse['expires_in']) ?
                date('Y-m-d H:i:s', time() + $tokenResponse['expires_in']) : null,
            'account_data' => [
                'channel_id' => $channel['id'],
                'title' => $snippet['title'],
                'description' => $snippet['description'] ?? null,
                'thumbnail_url' => $snippet['thumbnails']['high']['url'] ?? null,
                'subscriber_count' => $statistics['subscriberCount'] ?? 0,
                'video_count' => $statistics['videoCount'] ?? 0,
                'view_count' => $statistics['viewCount'] ?? 0,
                'country' => $snippet['country'] ?? null,
                'published_at' => $snippet['publishedAt'] ?? null
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
            'client_id' => $this->config['client_id'],
            'client_secret' => $this->config['client_secret'],
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token'
        ];

        $headers = [
            'Content-Type' => 'application/x-www-form-urlencoded'
        ];

        $response = $this->makeRequest('POST', self::TOKEN_URL, [
            'headers' => $headers,
            'data' => $tokenData
        ]);

        if (!isset($response['access_token'])) {
            throw new Exception('Failed to refresh YouTube access token');
        }

        return [
            'access_token' => $response['access_token'],
            'refresh_token' => $refreshToken, // Google doesn't always return new refresh token
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
            $response = $this->makeRequest('GET', self::API_BASE_URL . '/channels', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken
                ],
                'query' => [
                    'part' => 'id',
                    'mine' => 'true'
                ]
            ]);

            return !empty($response['items']);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Publish content to YouTube
     *
     * @param string $accessToken Access token
     * @param array $content Content data
     * @param array $options Platform-specific options
     * @return array Publication result
     */
    public function publishContent(string $accessToken, array $content, array $options = []): array
    {
        if (!$this->checkRateLimit('upload')) {
            throw new Exception('Rate limit exceeded for video uploads');
        }

        // YouTube primarily handles video uploads
        if (empty($content['media']) || !isset($content['media'][0]['path'])) {
            throw new Exception('YouTube posts require a video file');
        }

        $videoFile = $content['media'][0];

        if (!$this->isVideoFile($videoFile['path'])) {
            throw new Exception('YouTube only supports video file uploads');
        }

        return $this->uploadVideo($accessToken, $videoFile['path'], $content, $options);
    }

    /**
     * Upload video to YouTube
     *
     * @param string $accessToken Access token
     * @param string $videoPath Video file path
     * @param array $content Content data
     * @param array $options Upload options
     * @return array Upload result
     */
    private function uploadVideo(string $accessToken, string $videoPath, array $content, array $options = []): array
    {
        if (!file_exists($videoPath)) {
            throw new Exception('Video file not found: ' . $videoPath);
        }

        $this->validateFile($videoPath);

        // Prepare video metadata
        $snippet = [
            'title' => $content['title'] ?? 'Untitled Video',
            'description' => $content['text'] ?? '',
            'tags' => $this->extractTags($content['text'] ?? ''),
            'categoryId' => $options['category_id'] ?? '22', // People & Blogs
            'defaultLanguage' => $options['language'] ?? 'en'
        ];

        $status = [
            'privacyStatus' => $options['privacy'] ?? 'private',
            'selfDeclaredMadeForKids' => $options['made_for_kids'] ?? false
        ];

        if (isset($options['publish_at'])) {
            $status['publishAt'] = date('c', strtotime($options['publish_at']));
        }

        $videoData = [
            'snippet' => $snippet,
            'status' => $status
        ];

        $headers = [
            'Authorization' => 'Bearer ' . $accessToken,
            'Content-Type' => 'application/json'
        ];

        // For files larger than 5MB, use resumable upload
        $fileSize = filesize($videoPath);
        if ($fileSize > 5 * 1024 * 1024) {
            return $this->uploadVideoResumable($accessToken, $videoPath, $videoData);
        }

        // Simple upload for smaller files
        $response = $this->makeRequest('POST', self::UPLOAD_BASE_URL . '/videos', [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken
            ],
            'query' => [
                'part' => 'snippet,status'
            ],
            'multipart' => [
                [
                    'name' => 'metadata',
                    'contents' => json_encode($videoData),
                    'headers' => ['Content-Type' => 'application/json']
                ],
                [
                    'name' => 'media',
                    'contents' => fopen($videoPath, 'r'),
                    'filename' => basename($videoPath)
                ]
            ]
        ]);

        if (!isset($response['id'])) {
            throw new Exception('Failed to upload video to YouTube');
        }

        return [
            'platform_post_id' => $response['id'],
            'status' => 'published',
            'published_at' => date('Y-m-d H:i:s'),
            'platform_data' => [
                'video_id' => $response['id'],
                'privacy_status' => $response['status']['privacyStatus'] ?? 'private',
                'upload_status' => $response['status']['uploadStatus'] ?? 'uploaded',
                'response' => $response
            ]
        ];
    }

    /**
     * Upload large video using resumable upload
     *
     * @param string $accessToken Access token
     * @param string $videoPath Video file path
     * @param array $videoData Video metadata
     * @return array Upload result
     */
    private function uploadVideoResumable(string $accessToken, string $videoPath, array $videoData): array
    {
        $fileSize = filesize($videoPath);

        // Step 1: Initiate resumable upload
        $headers = [
            'Authorization' => 'Bearer ' . $accessToken,
            'Content-Type' => 'application/json',
            'X-Upload-Content-Length' => $fileSize,
            'X-Upload-Content-Type' => mime_content_type($videoPath)
        ];

        $response = $this->makeRequest('POST', self::UPLOAD_BASE_URL . '/videos?uploadType=resumable&part=snippet,status', [
            'headers' => $headers,
            'json' => $videoData
        ]);

        $uploadUrl = $response['headers']['Location'] ?? null;
        if (!$uploadUrl) {
            throw new Exception('Failed to initiate resumable upload');
        }

        // Step 2: Upload video in chunks
        $chunkSize = 8 * 1024 * 1024; // 8MB chunks
        $handle = fopen($videoPath, 'rb');
        $uploadedBytes = 0;

        while (!feof($handle)) {
            $chunk = fread($handle, $chunkSize);
            $chunkLength = strlen($chunk);

            $rangeStart = $uploadedBytes;
            $rangeEnd = $uploadedBytes + $chunkLength - 1;

            $chunkHeaders = [
                'Content-Length' => $chunkLength,
                'Content-Range' => "bytes {$rangeStart}-{$rangeEnd}/{$fileSize}"
            ];

            $chunkResponse = $this->makeRequest('PUT', $uploadUrl, [
                'headers' => $chunkHeaders,
                'body' => $chunk
            ]);

            $uploadedBytes += $chunkLength;

            // Check if upload is complete
            if (isset($chunkResponse['id'])) {
                fclose($handle);

                return [
                    'platform_post_id' => $chunkResponse['id'],
                    'status' => 'published',
                    'published_at' => date('Y-m-d H:i:s'),
                    'platform_data' => [
                        'video_id' => $chunkResponse['id'],
                        'privacy_status' => $chunkResponse['status']['privacyStatus'] ?? 'private',
                        'upload_status' => $chunkResponse['status']['uploadStatus'] ?? 'uploaded',
                        'response' => $chunkResponse
                    ]
                ];
            }
        }

        fclose($handle);
        throw new Exception('Resumable upload failed to complete');
    }

    /**
     * Upload media file to YouTube (alias for video upload)
     *
     * @param string $accessToken Access token
     * @param string $filePath Local file path
     * @param array $options Upload options
     * @return array Upload result with video ID
     */
    public function uploadMedia(string $accessToken, string $filePath, array $options = []): array
    {
        $content = [
            'title' => $options['title'] ?? 'Untitled Video',
            'text' => $options['description'] ?? '',
            'media' => [['path' => $filePath]]
        ];

        return $this->uploadVideo($accessToken, $filePath, $content, $options);
    }

    /**
     * Get analytics for a published video
     *
     * @param string $accessToken Access token
     * @param string $videoId YouTube video ID
     * @return array Analytics data
     */
    public function getPostAnalytics(string $accessToken, string $videoId): array
    {
        if (!$this->checkRateLimit('analytics')) {
            throw new Exception('Rate limit exceeded for analytics');
        }

        $headers = [
            'Authorization' => 'Bearer ' . $accessToken
        ];

        // Get video statistics
        $videoResponse = $this->makeRequest('GET', self::API_BASE_URL . '/videos', [
            'headers' => $headers,
            'query' => [
                'part' => 'statistics,snippet',
                'id' => $videoId
            ]
        ]);

        if (empty($videoResponse['items'])) {
            throw new Exception('Video not found or access denied');
        }

        $video = $videoResponse['items'][0];
        $statistics = $video['statistics'] ?? [];
        $snippet = $video['snippet'] ?? [];

        // Get detailed analytics (requires YouTube Analytics API)
        try {
            $analyticsResponse = $this->makeRequest('GET', 'https://youtubeanalytics.googleapis.com/v2/reports', [
                'headers' => $headers,
                'query' => [
                    'ids' => 'channel==MINE',
                    'startDate' => date('Y-m-d', strtotime('-30 days')),
                    'endDate' => date('Y-m-d'),
                    'metrics' => 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained',
                    'filters' => "video=={$videoId}"
                ]
            ]);

            $detailedStats = $analyticsResponse['rows'][0] ?? [];
        } catch (Exception $e) {
            $detailedStats = [];
        }

        return [
            'post_id' => $videoId,
            'title' => $snippet['title'] ?? null,
            'published_at' => $snippet['publishedAt'] ?? null,
            'view_count' => (int)($statistics['viewCount'] ?? 0),
            'like_count' => (int)($statistics['likeCount'] ?? 0),
            'dislike_count' => (int)($statistics['dislikeCount'] ?? 0),
            'comment_count' => (int)($statistics['commentCount'] ?? 0),
            'favorite_count' => (int)($statistics['favoriteCount'] ?? 0),
            'watch_time_minutes' => (int)($detailedStats[1] ?? 0),
            'average_view_duration' => (int)($detailedStats[2] ?? 0),
            'subscribers_gained' => (int)($detailedStats[3] ?? 0),
            'collected_at' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Extract hashtags from video description
     *
     * @param string $text Video description
     * @return array Array of tags
     */
    private function extractTags(string $text): array
    {
        preg_match_all('/#([a-zA-Z0-9_]+)/', $text, $matches);
        $tags = array_unique($matches[1] ?? []);

        // Limit to 500 characters total and max 15 tags
        $totalLength = 0;
        $limitedTags = [];

        foreach ($tags as $tag) {
            if (count($limitedTags) >= 15) break;
            if ($totalLength + strlen($tag) + 1 > 500) break;

            $limitedTags[] = $tag;
            $totalLength += strlen($tag) + 1; // +1 for comma
        }

        return $limitedTags;
    }

    /**
     * Check if file is a video file
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
     * Create community post (for eligible channels)
     *
     * @param string $accessToken Access token
     * @param array $content Content data
     * @param array $options Post options
     * @return array Post result
     */
    public function createCommunityPost(string $accessToken, array $content, array $options = []): array
    {
        // Community posts require special permissions and channel eligibility
        throw new Exception('Community posts require YouTube Partner Program membership and additional API access');
    }

    /**
     * Get YouTube-specific rate limits
     *
     * @return array Rate limit information
     */
    public function getRateLimits(): array
    {
        return [
            'upload' => ['limit' => 6, 'window' => 86400], // 6 uploads per day for unverified channels
            'analytics' => ['limit' => 10000, 'window' => 86400], // 10,000 quota units per day
            'api' => ['limit' => 10000, 'window' => 86400], // General API quota
        ];
    }
}
