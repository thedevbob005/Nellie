<?php
declare(strict_types=1);

namespace App\Service;

use Cake\Core\Configure;
use Exception;

/**
 * LinkedIn Platform Service
 *
 * Handles LinkedIn API v2 integration for OAuth, posting, and analytics
 * Supports both personal profiles and company pages
 */
class LinkedInService extends AbstractSocialMediaService
{
    private const API_BASE_URL = 'https://api.linkedin.com/v2';
    private const AUTH_BASE_URL = 'https://www.linkedin.com/oauth/v2';

    /**
     * Get platform name
     *
     * @return string Platform name
     */
    public function getPlatformName(): string
    {
        return 'linkedin';
    }

    /**
     * Get platform-specific configuration
     *
     * @return array Configuration data
     */
    protected function getConfig(): array
    {
        return Configure::read('SocialMedia.LinkedIn', [
            'client_id' => '',
            'client_secret' => '',
            'redirect_uri' => 'http://localhost:3000/oauth/linkedin/callback'
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
            throw new Exception('LinkedIn Client ID not configured');
        }

        $state = $this->generateState($clientId);
        $scope = 'r_basicprofile,r_organization_social,w_member_social,w_organization_social,rw_organization_admin';

        $params = [
            'response_type' => 'code',
            'client_id' => $this->config['client_id'],
            'redirect_uri' => $this->config['redirect_uri'],
            'state' => $state,
            'scope' => $scope
        ];

        return self::AUTH_BASE_URL . '/authorization?' . http_build_query($params);
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
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $this->config['redirect_uri'],
            'client_id' => $this->config['client_id'],
            'client_secret' => $this->config['client_secret']
        ];

        $headers = [
            'Content-Type' => 'application/x-www-form-urlencoded',
            'Accept' => 'application/json'
        ];

        $tokenResponse = $this->makeRequest('POST', self::AUTH_BASE_URL . '/accessToken', [
            'headers' => $headers,
            'data' => $tokenData
        ]);

        if (!isset($tokenResponse['access_token'])) {
            throw new Exception('Failed to obtain access token from LinkedIn');
        }

        $accessToken = $tokenResponse['access_token'];

        // Get user profile information
        $profileResponse = $this->makeRequest('GET', self::API_BASE_URL . '/people/~', [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken
            ],
            'query' => [
                'projection' => '(id,firstName,lastName,profilePicture(displayImage~:playableStreams),headline)'
            ]
        ]);

        if (!isset($profileResponse['id'])) {
            throw new Exception('Failed to get user profile from LinkedIn');
        }

        // Get organization access if available
        $organizationsResponse = $this->makeRequest('GET', self::API_BASE_URL . '/organizationAcls', [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken
            ],
            'query' => [
                'q' => 'roleAssignee',
                'role' => 'ADMINISTRATOR',
                'projection' => '(elements*(organization~(id,name,logo)))'
            ]
        ]);

        $organizations = [];
        if (isset($organizationsResponse['elements'])) {
            foreach ($organizationsResponse['elements'] as $element) {
                if (isset($element['organization~'])) {
                    $org = $element['organization~'];
                    $organizations[] = [
                        'id' => $org['id'],
                        'name' => $org['name']['localized'] ?? $org['name'],
                        'logo' => $org['logo'] ?? null
                    ];
                }
            }
        }

        $firstName = $profileResponse['firstName']['localized'] ?? '';
        $lastName = $profileResponse['lastName']['localized'] ?? '';
        $displayName = trim($firstName . ' ' . $lastName);

        return [
            'account_id' => $profileResponse['id'],
            'account_name' => $displayName,
            'access_token' => $accessToken,
            'refresh_token' => $tokenResponse['refresh_token'] ?? null,
            'expires_at' => isset($tokenResponse['expires_in']) ?
                date('Y-m-d H:i:s', time() + $tokenResponse['expires_in']) : null,
            'account_data' => [
                'person_id' => $profileResponse['id'],
                'first_name' => $firstName,
                'last_name' => $lastName,
                'headline' => $profileResponse['headline']['localized'] ?? null,
                'profile_picture' => $this->extractProfilePicture($profileResponse),
                'organizations' => $organizations,
                'is_personal' => true
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
            throw new Exception('LinkedIn does not provide refresh tokens, re-authorization required');
        }

        $tokenData = [
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
            'client_id' => $this->config['client_id'],
            'client_secret' => $this->config['client_secret']
        ];

        $headers = [
            'Content-Type' => 'application/x-www-form-urlencoded'
        ];

        $response = $this->makeRequest('POST', self::AUTH_BASE_URL . '/accessToken', [
            'headers' => $headers,
            'data' => $tokenData
        ]);

        if (!isset($response['access_token'])) {
            throw new Exception('Failed to refresh LinkedIn access token');
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
            $response = $this->makeRequest('GET', self::API_BASE_URL . '/people/~', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken
                ],
                'query' => [
                    'projection' => '(id)'
                ]
            ]);

            return isset($response['id']);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Publish content to LinkedIn
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
            'Content-Type' => 'application/json',
            'X-Restli-Protocol-Version' => '2.0.0'
        ];

        // Determine if posting to organization or personal profile
        $authorUrn = $this->getAuthorUrn($options);

        // Prepare post content
        $postData = [
            'author' => $authorUrn,
            'lifecycleState' => 'PUBLISHED',
            'specificContent' => [
                'com.linkedin.ugc.ShareContent' => [
                    'shareCommentary' => [
                        'text' => $content['text'] ?? ''
                    ],
                    'shareMediaCategory' => 'NONE'
                ]
            ],
            'visibility' => [
                'com.linkedin.ugc.MemberNetworkVisibility' => 'PUBLIC'
            ]
        ];

        // Handle media content
        if (!empty($content['media'])) {
            $media = $this->processMediaForPost($accessToken, $content['media'], $authorUrn);
            $postData['specificContent']['com.linkedin.ugc.ShareContent']['shareMediaCategory'] = 'IMAGE';
            $postData['specificContent']['com.linkedin.ugc.ShareContent']['media'] = $media;
        }

        // Handle article links
        if (!empty($content['link_url'])) {
            $postData['specificContent']['com.linkedin.ugc.ShareContent']['shareMediaCategory'] = 'ARTICLE';
            $postData['specificContent']['com.linkedin.ugc.ShareContent']['media'] = [
                [
                    'status' => 'READY',
                    'originalUrl' => $content['link_url'],
                    'title' => [
                        'text' => $content['link_title'] ?? ''
                    ],
                    'description' => [
                        'text' => $content['link_description'] ?? ''
                    ]
                ]
            ];
        }

        $response = $this->makeRequest('POST', self::API_BASE_URL . '/ugcPosts', [
            'headers' => $headers,
            'json' => $postData
        ]);

        if (!isset($response['id'])) {
            throw new Exception('Failed to publish LinkedIn post');
        }

        return [
            'platform_post_id' => $response['id'],
            'status' => 'published',
            'published_at' => date('Y-m-d H:i:s'),
            'platform_data' => [
                'ugc_post_id' => $response['id'],
                'author_urn' => $authorUrn,
                'response' => $response
            ]
        ];
    }

    /**
     * Upload media file to LinkedIn
     *
     * @param string $accessToken Access token
     * @param string $filePath Local file path
     * @param array $options Upload options
     * @return array Upload result with media URN
     */
    public function uploadMedia(string $accessToken, string $filePath, array $options = []): array
    {
        if (!file_exists($filePath)) {
            throw new Exception('Media file not found: ' . $filePath);
        }

        $this->validateFile($filePath);

        $headers = [
            'Authorization' => 'Bearer ' . $accessToken,
            'Content-Type' => 'application/json'
        ];

        $authorUrn = $this->getAuthorUrn($options);

        // Step 1: Register upload
        $registerData = [
            'registerUploadRequest' => [
                'recipes' => ['urn:li:digitalmediaRecipe:feedshare-image'],
                'owner' => $authorUrn,
                'serviceRelationships' => [
                    [
                        'relationshipType' => 'OWNER',
                        'identifier' => 'urn:li:userGeneratedContent'
                    ]
                ]
            ]
        ];

        $registerResponse = $this->makeRequest('POST', self::API_BASE_URL . '/assets?action=registerUpload', [
            'headers' => $headers,
            'json' => $registerData
        ]);

        if (!isset($registerResponse['value']['uploadMechanism'])) {
            throw new Exception('Failed to register LinkedIn media upload');
        }

        $uploadUrl = $registerResponse['value']['uploadMechanism']['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']['uploadUrl'];
        $asset = $registerResponse['value']['asset'];

        // Step 2: Upload the file
        $fileHeaders = [
            'Authorization' => 'Bearer ' . $accessToken
        ];

        $uploadResponse = $this->makeRequest('POST', $uploadUrl, [
            'headers' => $fileHeaders,
            'multipart' => [
                [
                    'name' => 'fileupload',
                    'contents' => fopen($filePath, 'r'),
                    'filename' => basename($filePath)
                ]
            ]
        ]);

        // Step 3: Check upload status
        $checkHeaders = [
            'Authorization' => 'Bearer ' . $accessToken
        ];

        $statusResponse = $this->makeRequest('GET', self::API_BASE_URL . '/assets/' . urlencode($asset), [
            'headers' => $checkHeaders
        ]);

        return [
            'media_urn' => $asset,
            'status' => $statusResponse['recipes'][0]['status'] ?? 'PROCESSING',
            'upload_url' => $uploadUrl,
            'file_size' => filesize($filePath),
            'mime_type' => mime_content_type($filePath)
        ];
    }

    /**
     * Get analytics for a published post
     *
     * @param string $accessToken Access token
     * @param string $postId LinkedIn UGC post ID
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

        // Get post insights
        $statsResponse = $this->makeRequest('GET', self::API_BASE_URL . '/socialMetadata/' . urlencode($postId), [
            'headers' => $headers
        ]);

        // Get detailed metrics if available (requires additional permissions)
        $detailsResponse = $this->makeRequest('GET', self::API_BASE_URL . '/socialActions/' . urlencode($postId), [
            'headers' => $headers
        ]);

        $likes = $statsResponse['totalSocialActivityCounts']['numLikes'] ?? 0;
        $comments = $statsResponse['totalSocialActivityCounts']['numComments'] ?? 0;
        $shares = $statsResponse['totalSocialActivityCounts']['numShares'] ?? 0;

        return [
            'post_id' => $postId,
            'likes' => $likes,
            'comments' => $comments,
            'shares' => $shares,
            'clicks' => $detailsResponse['clickCount'] ?? 0,
            'impressions' => $detailsResponse['impressionCount'] ?? 0,
            'engagement_rate' => $likes + $comments + $shares > 0 ?
                round((($likes + $comments + $shares) / max(1, $detailsResponse['impressionCount'] ?? 1)) * 100, 2) : 0,
            'collected_at' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Extract profile picture URL from LinkedIn profile response
     *
     * @param array $profileData Profile data from LinkedIn API
     * @return string|null Profile picture URL
     */
    private function extractProfilePicture(array $profileData): ?string
    {
        if (!isset($profileData['profilePicture']['displayImage~']['elements'])) {
            return null;
        }

        $elements = $profileData['profilePicture']['displayImage~']['elements'];

        // Find the best quality image
        foreach ($elements as $element) {
            if (isset($element['identifiers'][0]['identifier'])) {
                return $element['identifiers'][0]['identifier'];
            }
        }

        return null;
    }

    /**
     * Get author URN for posting
     *
     * @param array $options Post options
     * @return string Author URN
     */
    private function getAuthorUrn(array $options): string
    {
        if (isset($options['organization_id'])) {
            return 'urn:li:organization:' . $options['organization_id'];
        }

        if (isset($options['person_id'])) {
            return 'urn:li:person:' . $options['person_id'];
        }

        throw new Exception('Either person_id or organization_id must be specified for LinkedIn posting');
    }

    /**
     * Process media files for LinkedIn post
     *
     * @param string $accessToken Access token
     * @param array $mediaFiles Media files array
     * @param string $authorUrn Author URN
     * @return array Processed media data
     */
    private function processMediaForPost(string $accessToken, array $mediaFiles, string $authorUrn): array
    {
        $media = [];

        foreach ($mediaFiles as $mediaFile) {
            if (isset($mediaFile['path'])) {
                $uploadResult = $this->uploadMedia($accessToken, $mediaFile['path'], [
                    'author_urn' => $authorUrn
                ]);

                $media[] = [
                    'status' => 'READY',
                    'media' => $uploadResult['media_urn'],
                    'title' => [
                        'text' => $mediaFile['title'] ?? ''
                    ],
                    'description' => [
                        'text' => $mediaFile['description'] ?? ''
                    ]
                ];
            }
        }

        return $media;
    }

    /**
     * Get LinkedIn-specific rate limits
     *
     * @return array Rate limit information
     */
    public function getRateLimits(): array
    {
        return [
            'post' => ['limit' => 150, 'window' => 86400], // 150 posts per day
            'upload' => ['limit' => 100, 'window' => 3600], // 100 uploads per hour
            'analytics' => ['limit' => 500, 'window' => 86400], // 500 requests per day
        ];
    }
}
