<?php
declare(strict_types=1);

namespace App\Service;

/**
 * Interface for Social Media Platform Services
 *
 * Defines the contract that all social media platform services must implement
 */
interface SocialMediaServiceInterface
{
    /**
     * Get authorization URL for OAuth flow
     *
     * @param string $clientId Client ID for state parameter
     * @return string Authorization URL
     */
    public function getAuthorizationUrl(string $clientId): string;

    /**
     * Handle OAuth callback and exchange code for access token
     *
     * @param string $code Authorization code
     * @param string $state State parameter
     * @param string $clientId Client ID
     * @return array Account data including tokens
     */
    public function handleCallback(string $code, string $state, string $clientId): array;

    /**
     * Refresh access token using refresh token
     *
     * @param string $refreshToken Refresh token
     * @return array New token data
     */
    public function refreshAccessToken(string $refreshToken): array;

    /**
     * Test if access token is valid
     *
     * @param string $accessToken Access token to test
     * @return bool True if valid, false otherwise
     */
    public function testConnection(string $accessToken): bool;

    /**
     * Publish content to the platform
     *
     * @param string $accessToken Access token
     * @param array $content Content data
     * @param array $options Platform-specific options
     * @return array Publication result
     */
    public function publishContent(string $accessToken, array $content, array $options = []): array;

    /**
     * Get analytics for a published post
     *
     * @param string $accessToken Access token
     * @param string $postId Platform-specific post ID
     * @return array Analytics data
     */
    public function getPostAnalytics(string $accessToken, string $postId): array;

    /**
     * Upload media file to the platform
     *
     * @param string $accessToken Access token
     * @param string $filePath Local file path
     * @param array $options Upload options
     * @return array Upload result with media ID
     */
    public function uploadMedia(string $accessToken, string $filePath, array $options = []): array;

    /**
     * Get platform-specific rate limits
     *
     * @return array Rate limit information
     */
    public function getRateLimits(): array;

    /**
     * Get platform name
     *
     * @return string Platform name
     */
    public function getPlatformName(): string;
}
