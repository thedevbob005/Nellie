<?php
declare(strict_types=1);

namespace App\Service;

use Cake\Core\Configure;
use Cake\Http\Client;
use Cake\Log\Log;
use Exception;

/**
 * Abstract base class for Social Media Platform Services
 *
 * Provides common functionality and utilities for all platform services
 */
abstract class AbstractSocialMediaService implements SocialMediaServiceInterface
{
    protected Client $httpClient;
    protected array $config;
    protected string $platformName;

    public function __construct()
    {
        $this->httpClient = new Client([
            'timeout' => 30,
            'headers' => [
                'User-Agent' => 'Nellie-SocialMedia-Manager/1.0'
            ]
        ]);

        $this->config = $this->getConfig();
        $this->platformName = $this->getPlatformName();
    }

    /**
     * Get platform-specific configuration
     *
     * @return array Configuration data
     */
    abstract protected function getConfig(): array;

    /**
     * Make HTTP request with error handling and logging
     *
     * @param string $method HTTP method
     * @param string $url Request URL
     * @param array $options Request options
     * @return array Response data
     * @throws Exception On request failure
     */
    protected function makeRequest(string $method, string $url, array $options = []): array
    {
        $startTime = microtime(true);

        try {
            Log::debug("Making {$method} request to {$url}", [
                'platform' => $this->platformName,
                'options' => $this->sanitizeLogOptions($options)
            ]);

            $response = $this->httpClient->{strtolower($method)}($url, [], $options);
            $duration = microtime(true) - $startTime;

            $statusCode = $response->getStatusCode();
            $responseData = $response->getJson();

            Log::debug("Request completed", [
                'platform' => $this->platformName,
                'status_code' => $statusCode,
                'duration' => round($duration, 3),
                'url' => $url
            ]);

            if ($statusCode >= 400) {
                throw new Exception("HTTP {$statusCode}: " . ($responseData['error']['message'] ?? 'Unknown error'));
            }

            return $responseData;
        } catch (Exception $e) {
            $duration = microtime(true) - $startTime;

            Log::error("Request failed", [
                'platform' => $this->platformName,
                'error' => $e->getMessage(),
                'duration' => round($duration, 3),
                'url' => $url
            ]);

            throw $e;
        }
    }

    /**
     * Generate state parameter for OAuth flow
     *
     * @param string $clientId Client ID
     * @return string State parameter
     */
    protected function generateState(string $clientId): string
    {
        return base64_encode(json_encode([
            'client_id' => $clientId,
            'timestamp' => time(),
            'platform' => $this->platformName,
            'nonce' => bin2hex(random_bytes(16))
        ]));
    }

    /**
     * Validate and decode state parameter
     *
     * @param string $state State parameter
     * @param string $expectedClientId Expected client ID
     * @return bool True if valid
     * @throws Exception If state is invalid
     */
    protected function validateState(string $state, string $expectedClientId): bool
    {
        try {
            $decoded = json_decode(base64_decode($state), true);

            if (!$decoded || !isset($decoded['client_id'], $decoded['timestamp'], $decoded['platform'])) {
                throw new Exception('Invalid state format');
            }

            if ($decoded['client_id'] !== $expectedClientId) {
                throw new Exception('State client ID mismatch');
            }

            if ($decoded['platform'] !== $this->platformName) {
                throw new Exception('State platform mismatch');
            }

            // Check if state is not older than 1 hour
            if (time() - $decoded['timestamp'] > 3600) {
                throw new Exception('State expired');
            }

            return true;
        } catch (Exception $e) {
            Log::warning("State validation failed", [
                'platform' => $this->platformName,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Sanitize options for logging (remove sensitive data)
     *
     * @param array $options Request options
     * @return array Sanitized options
     */
    protected function sanitizeLogOptions(array $options): array
    {
        $sanitized = $options;

        // Remove sensitive data from logs
        $sensitiveKeys = ['access_token', 'client_secret', 'password', 'token'];

        foreach ($sensitiveKeys as $key) {
            if (isset($sanitized[$key])) {
                $sanitized[$key] = '[REDACTED]';
            }

            if (isset($sanitized['headers'])) {
                foreach ($sanitiveKeys as $headerKey) {
                    if (isset($sanitized['headers'][$headerKey])) {
                        $sanitized['headers'][$headerKey] = '[REDACTED]';
                    }
                }
            }

            if (isset($sanitized['data'])) {
                foreach ($sensitiveKeys as $dataKey) {
                    if (isset($sanitized['data'][$dataKey])) {
                        $sanitized['data'][$dataKey] = '[REDACTED]';
                    }
                }
            }
        }

        return $sanitized;
    }

    /**
     * Format timestamp for platform API
     *
     * @param string|\DateTime $timestamp Timestamp
     * @return string Formatted timestamp
     */
    protected function formatTimestamp($timestamp): string
    {
        if ($timestamp instanceof \DateTime) {
            return $timestamp->format('c');
        }

        return date('c', is_numeric($timestamp) ? $timestamp : strtotime($timestamp));
    }

    /**
     * Validate file for upload
     *
     * @param string $filePath File path
     * @param array $allowedTypes Allowed MIME types
     * @param int $maxSize Maximum file size in bytes
     * @return bool True if valid
     * @throws Exception If file is invalid
     */
    protected function validateFile(string $filePath, array $allowedTypes = [], int $maxSize = 0): bool
    {
        if (!file_exists($filePath)) {
            throw new Exception("File not found: {$filePath}");
        }

        if (!is_readable($filePath)) {
            throw new Exception("File not readable: {$filePath}");
        }

        $fileSize = filesize($filePath);
        if ($maxSize > 0 && $fileSize > $maxSize) {
            throw new Exception("File too large: {$fileSize} bytes (max: {$maxSize})");
        }

        if (!empty($allowedTypes)) {
            $mimeType = mime_content_type($filePath);
            if (!in_array($mimeType, $allowedTypes)) {
                throw new Exception("Invalid file type: {$mimeType}");
            }
        }

        return true;
    }

    /**
     * Check if rate limit allows request
     *
     * @param string $endpoint Endpoint identifier
     * @return bool True if request allowed
     */
    protected function checkRateLimit(string $endpoint): bool
    {
        // Basic rate limiting implementation
        // This can be enhanced with Redis or database storage
        $cacheKey = "rate_limit_{$this->platformName}_{$endpoint}";
        $limits = $this->getRateLimits();

        if (!isset($limits[$endpoint])) {
            return true;
        }

        // For now, just log the rate limit check
        Log::debug("Rate limit check", [
            'platform' => $this->platformName,
            'endpoint' => $endpoint
        ]);

        return true;
    }

    /**
     * Handle platform-specific errors
     *
     * @param array $errorData Error response data
     * @return Exception Appropriate exception
     */
    protected function handleError(array $errorData): Exception
    {
        $message = $errorData['message'] ?? $errorData['error'] ?? 'Unknown error';
        $code = $errorData['code'] ?? 0;

        Log::error("Platform error", [
            'platform' => $this->platformName,
            'error' => $errorData
        ]);

        return new Exception("{$this->platformName} API Error: {$message}", $code);
    }

    /**
     * Default rate limits - override in specific services
     *
     * @return array Rate limit information
     */
    public function getRateLimits(): array
    {
        return [
            'post' => ['limit' => 100, 'window' => 3600], // 100 per hour
            'upload' => ['limit' => 50, 'window' => 3600], // 50 per hour
            'analytics' => ['limit' => 200, 'window' => 3600], // 200 per hour
        ];
    }
}
