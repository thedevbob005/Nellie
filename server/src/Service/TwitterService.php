<?php
declare(strict_types=1);

namespace App\Service;

use Cake\Core\Configure;
use Exception;

/**
 * Twitter (X) Platform Service
 *
 * Handles Twitter API v2 integration for OAuth 2.0, posting, and analytics
 */
class TwitterService extends AbstractSocialMediaService
{
    private const API_BASE_URL = 'https://api.twitter.com/2';
    private const UPLOAD_BASE_URL = 'https://upload.twitter.com/1.1';
    private const OAUTH_BASE_URL = 'https://twitter.com/i/oauth2';

    /**
     * Get platform name
     *
     * @return string Platform name
     */
    public function getPlatformName(): string
    {
        return 'twitter';
    }

    /**
     * Get platform-specific configuration
     *
     * @return array Configuration data
     */
    protected function getConfig(): array
    {
        return Configure::read('SocialMedia.Twitter', [
            'client_id' => '',
            'client_secret' => '',
            'redirect_uri' => 'http://localhost:3000/oauth/twitter/callback'
        ]);
    }

    /**
     * Get authorization URL for OAuth 2.0 flow
     *
     * @param string $clientId Client ID for state parameter
     * @return string Authorization URL
     */
    public function getAuthorizationUrl(string $clientId): string
    {
        if (empty($this->config['client_id'])) {
            throw new Exception('Twitter Client ID not configured');
        }

        $state = $this->generateState($clientId);
        $codeChallenge = $this->generateCodeChallenge();

        // Store code verifier in session/cache for later use
        $this->storeCodeVerifier($state, $codeChallenge['verifier']);

        $scope = 'tweet.read tweet.write users.read offline.access';

        $params = [
            'response_type' => 'code',
            'client_id' => $this->config['client_id'],
            'redirect_uri' => $this->config['redirect_uri'],
            'scope' => $scope,
            'state' => $state,
            'code_challenge' => $codeChallenge['challenge'],
            'code_challenge_method' => 'S256'
        ];

        return self::OAUTH_BASE_URL . '/authorize?' . http_build_query($params);
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
        $codeVerifier = $this->getCodeVerifier($state);

        if (!$codeVerifier) {
            throw new Exception('Code verifier not found for OAuth state');
        }

        // Exchange code for access token
        $tokenData = [
            'code' => $code,
            'grant_type' => 'authorization_code',
            'client_id' => $this->config['client_id'],
            'redirect_uri' => $this->config['redirect_uri'],
            'code_verifier' => $codeVerifier
        ];

        $headers = [
            'Content-Type' => 'application/x-www-form-urlencoded',
            'Authorization' => 'Basic ' . base64_encode($this->config['client_id'] . ':' . $this->config['client_secret'])
        ];

        $tokenResponse = $this->makeRequest('POST', self::OAUTH_BASE_URL . '/token', [
            'headers' => $headers,
            'data' => $tokenData
        ]);

        if (!isset($tokenResponse['access_token'])) {
            throw new Exception('Failed to obtain access token from Twitter');
        }

        // Get user information
        $userResponse = $this->makeRequest('GET', self::API_BASE_URL . '/users/me', [
            'headers' => [
                'Authorization' => 'Bearer ' . $tokenResponse['access_token']
            ],
            'query' => [
                'user.fields' => 'id,name,username,profile_image_url,public_metrics'
            ]
        ]);

        if (!isset($userResponse['data'])) {
            throw new Exception('Failed to get user data from Twitter');
        }

        $user = $userResponse['data'];

        return [
            'account_id' => $user['id'],
            'account_name' => '@' . $user['username'],
            'access_token' => $tokenResponse['access_token'],
            'refresh_token' => $tokenResponse['refresh_token'] ?? null,
            'expires_at' => isset($tokenResponse['expires_in']) ?
                date('Y-m-d H:i:s', time() + $tokenResponse['expires_in']) : null,
            'account_data' => [
                'user_id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['name'],
                'profile_image_url' => $user['profile_image_url'] ?? null,
                'followers_count' => $user['public_metrics']['followers_count'] ?? 0,
                'following_count' => $user['public_metrics']['following_count'] ?? 0,
                'tweet_count' => $user['public_metrics']['tweet_count'] ?? 0
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
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token',
            'client_id' => $this->config['client_id']
        ];

        $headers = [
            'Content-Type' => 'application/x-www-form-urlencoded',
            'Authorization' => 'Basic ' . base64_encode($this->config['client_id'] . ':' . $this->config['client_secret'])
        ];

        $response = $this->makeRequest('POST', self::OAUTH_BASE_URL . '/token', [
            'headers' => $headers,
            'data' => $tokenData
        ]);

        if (!isset($response['access_token'])) {
            throw new Exception('Failed to refresh Twitter access token');
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
            $response = $this->makeRequest('GET', self::API_BASE_URL . '/users/me', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken
                ]
            ]);

            return isset($response['data']['id']);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Publish content to Twitter
     *
     * @param string $accessToken Access token
     * @param array $content Content data
     * @param array $options Platform-specific options
     * @return array Publication result
     */
    public function publishContent(string $accessToken, array $content, array $options = []): array
    {
        if (!$this->checkRateLimit('tweet')) {
            throw new Exception('Rate limit exceeded for tweeting');
        }

        $headers = [
            'Authorization' => 'Bearer ' . $accessToken,
            'Content-Type' => 'application/json'
        ];

        // Handle thread posting
        if (isset($options['thread']) && $options['thread']) {
            return $this->publishThread($accessToken, $content, $options);
        }

        // Single tweet
        $tweetData = [];

        if (!empty($content['text'])) {
            $tweetData['text'] = $this->truncateText($content['text'], 280);
        }

        // Handle media uploads
        if (!empty($content['media'])) {
            $mediaIds = [];
            foreach ($content['media'] as $mediaFile) {
                if (isset($mediaFile['path'])) {
                    $uploadResult = $this->uploadMedia($accessToken, $mediaFile['path']);
                    $mediaIds[] = $uploadResult['media_id'];
                }
            }

            if (!empty($mediaIds)) {
                $tweetData['media'] = ['media_ids' => $mediaIds];
            }
        }

        // Handle reply to specific tweet
        if (!empty($options['in_reply_to_tweet_id'])) {
            $tweetData['reply'] = ['in_reply_to_tweet_id' => $options['in_reply_to_tweet_id']];
        }

        // Handle quote tweet
        if (!empty($options['quote_tweet_id'])) {
            $tweetData['quote_tweet_id'] = $options['quote_tweet_id'];
        }

        $response = $this->makeRequest('POST', self::API_BASE_URL . '/tweets', [
            'headers' => $headers,
            'json' => $tweetData
        ]);

        if (!isset($response['data']['id'])) {
            throw new Exception('Failed to publish tweet');
        }

        return [
            'platform_post_id' => $response['data']['id'],
            'status' => 'published',
            'published_at' => date('Y-m-d H:i:s'),
            'platform_data' => [
                'tweet_id' => $response['data']['id'],
                'text' => $response['data']['text'] ?? $content['text'],
                'response' => $response
            ]
        ];
    }

    /**
     * Publish thread to Twitter
     *
     * @param string $accessToken Access token
     * @param array $content Content data
     * @param array $options Platform-specific options
     * @return array Publication result
     */
    private function publishThread(string $accessToken, array $content, array $options = []): array
    {
        $threadTexts = $this->splitTextIntoThread($content['text'] ?? '');
        $publishedTweets = [];
        $replyToTweetId = null;

        $headers = [
            'Authorization' => 'Bearer ' . $accessToken,
            'Content-Type' => 'application/json'
        ];

        foreach ($threadTexts as $index => $tweetText) {
            $tweetData = ['text' => $tweetText];

            // First tweet can have media
            if ($index === 0 && !empty($content['media'])) {
                $mediaIds = [];
                foreach ($content['media'] as $mediaFile) {
                    if (isset($mediaFile['path'])) {
                        $uploadResult = $this->uploadMedia($accessToken, $mediaFile['path']);
                        $mediaIds[] = $uploadResult['media_id'];
                    }
                }

                if (!empty($mediaIds)) {
                    $tweetData['media'] = ['media_ids' => $mediaIds];
                }
            }

            // Reply to previous tweet in thread
            if ($replyToTweetId) {
                $tweetData['reply'] = ['in_reply_to_tweet_id' => $replyToTweetId];
            }

            $response = $this->makeRequest('POST', self::API_BASE_URL . '/tweets', [
                'headers' => $headers,
                'json' => $tweetData
            ]);

            if (!isset($response['data']['id'])) {
                throw new Exception("Failed to publish tweet #{$index} in thread");
            }

            $publishedTweets[] = $response['data'];
            $replyToTweetId = $response['data']['id'];

            // Small delay between tweets to avoid rate limits
            if ($index < count($threadTexts) - 1) {
                sleep(1);
            }
        }

        return [
            'platform_post_id' => $publishedTweets[0]['id'], // First tweet ID
            'status' => 'published',
            'published_at' => date('Y-m-d H:i:s'),
            'platform_data' => [
                'thread_tweets' => $publishedTweets,
                'thread_count' => count($publishedTweets),
                'main_tweet_id' => $publishedTweets[0]['id']
            ]
        ];
    }

    /**
     * Upload media file to Twitter
     *
     * @param string $accessToken Access token
     * @param string $filePath Local file path
     * @param array $options Upload options
     * @return array Upload result with media ID
     */
    public function uploadMedia(string $accessToken, string $filePath, array $options = []): array
    {
        if (!file_exists($filePath)) {
            throw new Exception('Media file not found: ' . $filePath);
        }

        $this->validateFile($filePath);

        $fileSize = filesize($filePath);
        $mimeType = mime_content_type($filePath);
        $mediaCategory = $this->getMediaCategory($mimeType);

        // For larger files, use chunked upload
        if ($fileSize > 5 * 1024 * 1024) { // 5MB
            return $this->uploadMediaChunked($accessToken, $filePath, $mediaCategory);
        }

        // Simple upload for smaller files
        $headers = [
            'Authorization' => 'Bearer ' . $accessToken
        ];

        $response = $this->makeRequest('POST', self::UPLOAD_BASE_URL . '/media/upload.json', [
            'headers' => $headers,
            'multipart' => [
                [
                    'name' => 'media',
                    'contents' => fopen($filePath, 'r'),
                    'filename' => basename($filePath)
                ],
                [
                    'name' => 'media_category',
                    'contents' => $mediaCategory
                ]
            ]
        ]);

        if (!isset($response['media_id_string'])) {
            throw new Exception('Failed to upload media to Twitter');
        }

        return [
            'media_id' => $response['media_id_string'],
            'size' => $fileSize,
            'type' => $mimeType,
            'expires_after_secs' => $response['expires_after_secs'] ?? null
        ];
    }

    /**
     * Get analytics for a published tweet
     *
     * @param string $accessToken Access token
     * @param string $tweetId Tweet ID
     * @return array Analytics data
     */
    public function getPostAnalytics(string $accessToken, string $tweetId): array
    {
        if (!$this->checkRateLimit('analytics')) {
            throw new Exception('Rate limit exceeded for analytics');
        }

        $headers = [
            'Authorization' => 'Bearer ' . $accessToken
        ];

        // Get tweet data with public metrics
        $response = $this->makeRequest('GET', self::API_BASE_URL . "/tweets/{$tweetId}", [
            'headers' => $headers,
            'query' => [
                'tweet.fields' => 'created_at,public_metrics,context_annotations,attachments',
                'user.fields' => 'username,name',
                'expansions' => 'author_id'
            ]
        ]);

        if (!isset($response['data'])) {
            throw new Exception('Tweet not found or access denied');
        }

        $tweet = $response['data'];
        $metrics = $tweet['public_metrics'] ?? [];

        return [
            'post_id' => $tweetId,
            'text' => $tweet['text'] ?? null,
            'created_at' => $tweet['created_at'] ?? null,
            'retweet_count' => $metrics['retweet_count'] ?? 0,
            'like_count' => $metrics['like_count'] ?? 0,
            'reply_count' => $metrics['reply_count'] ?? 0,
            'quote_count' => $metrics['quote_count'] ?? 0,
            'bookmark_count' => $metrics['bookmark_count'] ?? 0,
            'impression_count' => $metrics['impression_count'] ?? 0,
            'collected_at' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Split text into thread tweets
     *
     * @param string $text Full text
     * @return array Array of tweet texts
     */
    private function splitTextIntoThread(string $text): array
    {
        if (strlen($text) <= 280) {
            return [$text];
        }

        $tweets = [];
        $sentences = preg_split('/(?<=[.!?])\s+/', $text);
        $currentTweet = '';

        foreach ($sentences as $sentence) {
            $testTweet = $currentTweet . ($currentTweet ? ' ' : '') . $sentence;

            if (strlen($testTweet) <= 270) { // Leave room for thread numbering
                $currentTweet = $testTweet;
            } else {
                if ($currentTweet) {
                    $tweets[] = $currentTweet;
                    $currentTweet = $sentence;
                } else {
                    // Sentence is too long, split it
                    $words = explode(' ', $sentence);
                    $chunk = '';
                    foreach ($words as $word) {
                        $testChunk = $chunk . ($chunk ? ' ' : '') . $word;
                        if (strlen($testChunk) <= 270) {
                            $chunk = $testChunk;
                        } else {
                            if ($chunk) {
                                $tweets[] = $chunk;
                                $chunk = $word;
                            } else {
                                $tweets[] = substr($word, 0, 270);
                                $chunk = substr($word, 270);
                            }
                        }
                    }
                    $currentTweet = $chunk;
                }
            }
        }

        if ($currentTweet) {
            $tweets[] = $currentTweet;
        }

        // Add thread numbering
        if (count($tweets) > 1) {
            foreach ($tweets as $index => &$tweet) {
                $threadNumber = ($index + 1) . '/' . count($tweets);
                $tweet = $tweet . " {$threadNumber}";
            }
        }

        return $tweets;
    }

    /**
     * Generate PKCE code challenge and verifier
     *
     * @return array Challenge and verifier
     */
    private function generateCodeChallenge(): array
    {
        $verifier = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');

        return [
            'verifier' => $verifier,
            'challenge' => $challenge
        ];
    }

    /**
     * Store code verifier for OAuth flow
     *
     * @param string $state OAuth state
     * @param string $verifier Code verifier
     */
    private function storeCodeVerifier(string $state, string $verifier): void
    {
        // In production, store in cache/session
        // For now, we'll use a simple file-based approach
        $tempFile = sys_get_temp_dir() . '/twitter_oauth_' . $state;
        file_put_contents($tempFile, $verifier);
    }

    /**
     * Get code verifier for OAuth flow
     *
     * @param string $state OAuth state
     * @return string|null Code verifier
     */
    private function getCodeVerifier(string $state): ?string
    {
        $tempFile = sys_get_temp_dir() . '/twitter_oauth_' . $state;
        if (file_exists($tempFile)) {
            $verifier = file_get_contents($tempFile);
            unlink($tempFile); // Clean up
            return $verifier;
        }
        return null;
    }

    /**
     * Get media category for Twitter upload
     *
     * @param string $mimeType MIME type
     * @return string Media category
     */
    private function getMediaCategory(string $mimeType): string
    {
        if (strpos($mimeType, 'image/') === 0) {
            return 'tweet_image';
        } elseif (strpos($mimeType, 'video/') === 0) {
            return 'tweet_video';
        } elseif (strpos($mimeType, 'image/gif') === 0) {
            return 'tweet_gif';
        }

        return 'tweet_image'; // Default
    }

    /**
     * Truncate text to Twitter character limit
     *
     * @param string $text Original text
     * @param int $limit Character limit
     * @return string Truncated text
     */
    private function truncateText(string $text, int $limit = 280): string
    {
        if (strlen($text) <= $limit) {
            return $text;
        }

        return substr($text, 0, $limit - 3) . '...';
    }

    /**
     * Upload large media files using chunked upload
     *
     * @param string $accessToken Access token
     * @param string $filePath File path
     * @param string $mediaCategory Media category
     * @return array Upload result
     */
    private function uploadMediaChunked(string $accessToken, string $filePath, string $mediaCategory): array
    {
        $fileSize = filesize($filePath);
        $headers = ['Authorization' => 'Bearer ' . $accessToken];

        // Initialize upload
        $initResponse = $this->makeRequest('POST', self::UPLOAD_BASE_URL . '/media/upload.json', [
            'headers' => $headers,
            'data' => [
                'command' => 'INIT',
                'total_bytes' => $fileSize,
                'media_type' => mime_content_type($filePath),
                'media_category' => $mediaCategory
            ]
        ]);

        if (!isset($initResponse['media_id_string'])) {
            throw new Exception('Failed to initialize chunked upload');
        }

        $mediaId = $initResponse['media_id_string'];
        $chunkSize = 5 * 1024 * 1024; // 5MB chunks
        $segmentIndex = 0;

        // Upload chunks
        $handle = fopen($filePath, 'rb');
        while (!feof($handle)) {
            $chunk = fread($handle, $chunkSize);

            $this->makeRequest('POST', self::UPLOAD_BASE_URL . '/media/upload.json', [
                'headers' => $headers,
                'multipart' => [
                    ['name' => 'command', 'contents' => 'APPEND'],
                    ['name' => 'media_id', 'contents' => $mediaId],
                    ['name' => 'segment_index', 'contents' => $segmentIndex],
                    ['name' => 'media', 'contents' => $chunk]
                ]
            ]);

            $segmentIndex++;
        }
        fclose($handle);

        // Finalize upload
        $finalizeResponse = $this->makeRequest('POST', self::UPLOAD_BASE_URL . '/media/upload.json', [
            'headers' => $headers,
            'data' => [
                'command' => 'FINALIZE',
                'media_id' => $mediaId
            ]
        ]);

        return [
            'media_id' => $mediaId,
            'size' => $fileSize,
            'type' => mime_content_type($filePath),
            'processing_info' => $finalizeResponse['processing_info'] ?? null
        ];
    }

    /**
     * Get Twitter-specific rate limits
     *
     * @return array Rate limit information
     */
    public function getRateLimits(): array
    {
        return [
            'tweet' => ['limit' => 300, 'window' => 900], // 300 tweets per 15 minutes
            'upload' => ['limit' => 300, 'window' => 900], // 300 uploads per 15 minutes
            'analytics' => ['limit' => 75, 'window' => 900], // 75 requests per 15 minutes
        ];
    }
}
