<?php
declare(strict_types=1);

namespace App\Console\Command;

use Cake\Console\Arguments;
use Cake\Console\Command;
use Cake\Console\ConsoleIo;
use Cake\I18n\DateTime;
use Cake\ORM\TableRegistry;
use Cake\Log\Log;

/**
 * Post Publisher Command
 *
 * Automated publishing system for scheduled posts
 * Runs via cron job to publish posts at their scheduled times
 */
class PostPublisherCommand extends Command
{
    /**
     * Build option parser
     *
     * @param \Cake\Console\ConsoleOptionParser $parser The parser to define the expected arguments and options
     * @return \Cake\Console\ConsoleOptionParser
     */
    protected function buildOptionParser($parser): object
    {
        $parser
            ->setDescription('Automated post publishing system for scheduled posts')
            ->addOption('dry-run', [
                'help' => 'Show what would be published without actually publishing',
                'boolean' => true,
                'short' => 'd'
            ])
            ->addOption('force', [
                'help' => 'Force publish posts even if there are warnings',
                'boolean' => true,
                'short' => 'f'
            ])
            ->addOption('client-id', [
                'help' => 'Publish posts for specific client only',
                'short' => 'c'
            ])
            ->addOption('platform', [
                'help' => 'Publish to specific platform only',
                'short' => 'p'
            ])
            ->addOption('limit', [
                'help' => 'Maximum number of posts to process',
                'short' => 'l',
                'default' => 50
            ])
            ->addOption('verbose', [
                'help' => 'Enable verbose output',
                'boolean' => true,
                'short' => 'v'
            ]);

        return $parser;
    }

    /**
     * Execute the command
     *
     * @param \Cake\Console\Arguments $args The command arguments
     * @param \Cake\Console\ConsoleIo $io The console io
     * @return int|null
     */
    public function execute(Arguments $args, ConsoleIo $io): ?int
    {
        $startTime = microtime(true);
        $isDryRun = $args->getOption('dry-run');
        $isForce = $args->getOption('force');
        $clientId = $args->getOption('client-id');
        $platform = $args->getOption('platform');
        $limit = (int)$args->getOption('limit');
        $isVerbose = $args->getOption('verbose');

        $io->out('<info>Starting Post Publisher...</info>');
        $io->out('Time: ' . date('Y-m-d H:i:s'));

        if ($isDryRun) {
            $io->out('<warning>DRY RUN MODE - No posts will be actually published</warning>');
        }

        try {
            // Get scheduled posts ready for publishing
            $readyPosts = $this->getScheduledPosts($clientId, $platform, $limit);

            if (empty($readyPosts)) {
                $io->out('<success>No posts scheduled for publishing at this time.</success>');
                return static::CODE_SUCCESS;
            }

            $io->out("Found {count} posts ready for publishing", ['count' => count($readyPosts)]);

            // Process each post
            $results = [
                'total' => count($readyPosts),
                'successful' => 0,
                'failed' => 0,
                'skipped' => 0,
                'errors' => []
            ];

            foreach ($readyPosts as $post) {
                $postResult = $this->publishPost($post, $isDryRun, $isForce, $isVerbose, $io);

                switch ($postResult['status']) {
                    case 'success':
                        $results['successful']++;
                        break;
                    case 'failed':
                        $results['failed']++;
                        $results['errors'][] = $postResult;
                        break;
                    case 'skipped':
                        $results['skipped']++;
                        break;
                }
            }

            // Output summary
            $this->outputSummary($results, $startTime, $io);

            // Log results
            $this->logResults($results, $isDryRun);

            return $results['failed'] > 0 ? static::CODE_ERROR : static::CODE_SUCCESS;

        } catch (\Exception $e) {
            $io->error("Fatal error during publishing: " . $e->getMessage());
            Log::error("Post Publisher Command failed: " . $e->getMessage());
            return static::CODE_ERROR;
        }
    }

    /**
     * Get posts scheduled for publishing
     *
     * @param string|null $clientId Client ID filter
     * @param string|null $platform Platform filter
     * @param int $limit Limit number of posts
     * @return array Scheduled posts
     */
    private function getScheduledPosts(?string $clientId, ?string $platform, int $limit): array
    {
        $postsTable = TableRegistry::getTableLocator()->get('Posts');

        $now = new DateTime();
        $conditions = [
            'Posts.status' => 'scheduled',
            'Posts.scheduled_at <=' => $now
        ];

        if ($clientId) {
            $conditions['Posts.client_id'] = $clientId;
        }

        $query = $postsTable->find()
            ->where($conditions)
            ->contain([
                'Clients' => ['fields' => ['id', 'name']],
                'PostPlatforms' => [
                    'SocialAccounts' => ['fields' => ['id', 'platform', 'account_name', 'access_token', 'account_data']]
                ],
                'MediaFiles'
            ])
            ->order(['Posts.scheduled_at' => 'ASC'])
            ->limit($limit);

        if ($platform) {
            $query->matching('PostPlatforms.SocialAccounts', function ($q) use ($platform) {
                return $q->where(['SocialAccounts.platform' => $platform]);
            });
        }

        return $query->toArray();
    }

    /**
     * Publish a single post
     *
     * @param object $post Post entity
     * @param bool $isDryRun Dry run mode
     * @param bool $isForce Force publishing
     * @param bool $isVerbose Verbose output
     * @param \Cake\Console\ConsoleIo $io Console IO
     * @return array Publishing result
     */
    private function publishPost($post, bool $isDryRun, bool $isForce, bool $isVerbose, ConsoleIo $io): array
    {
        $postId = $post->id;
        $clientName = $post->client->name;
        $title = $post->title ?: 'Untitled Post';

        $io->out("Processing Post #{$postId}: {$title} (Client: {$clientName})");

        if ($isVerbose) {
            $io->out("  Scheduled: " . $post->scheduled_at->format('Y-m-d H:i:s'));
            $io->out("  Platforms: " . count($post->post_platforms));
        }

        try {
            // Pre-publishing validations
            $validationResult = $this->validatePost($post, $isForce);
            if (!$validationResult['valid']) {
                return [
                    'status' => 'skipped',
                    'post_id' => $postId,
                    'reason' => $validationResult['reason'],
                    'client' => $clientName
                ];
            }

            if ($isDryRun) {
                $io->out("  <info>[DRY RUN] Would publish to " . count($post->post_platforms) . " platforms</info>");
                return [
                    'status' => 'success',
                    'post_id' => $postId,
                    'dry_run' => true,
                    'platforms' => count($post->post_platforms)
                ];
            }

            // Actual publishing
            $publishResults = [];
            $hasFailures = false;

            foreach ($post->post_platforms as $platform) {
                try {
                    if ($isVerbose) {
                        $io->out("    Publishing to {$platform->social_account->platform}...");
                    }

                    $result = $this->publishToPlatform($post, $platform);
                    $publishResults[] = [
                        'platform' => $platform->social_account->platform,
                        'account_name' => $platform->social_account->account_name,
                        'status' => 'success',
                        'platform_post_id' => $result['platform_post_id']
                    ];

                    $this->updatePlatformPublishedData($platform->id, $result);

                    if ($isVerbose) {
                        $io->out("    <success>✓ Published to {$platform->social_account->platform}</success>");
                    }

                } catch (\Exception $e) {
                    $hasFailures = true;
                    $publishResults[] = [
                        'platform' => $platform->social_account->platform,
                        'account_name' => $platform->social_account->account_name,
                        'status' => 'failed',
                        'error' => $e->getMessage()
                    ];

                    $io->error("    ✗ Failed to publish to {$platform->social_account->platform}: " . $e->getMessage());
                    Log::error("Publishing failed for post {$postId} on {$platform->social_account->platform}: " . $e->getMessage());
                }
            }

            // Update post status
            $this->updatePostStatus($post, $hasFailures);

            $status = $hasFailures ? 'partial' : 'success';
            $io->out("  <success>✓ Post published with status: {$status}</success>");

            return [
                'status' => $hasFailures ? 'failed' : 'success',
                'post_id' => $postId,
                'client' => $clientName,
                'platforms' => $publishResults,
                'partial_success' => $hasFailures && !empty(array_filter($publishResults, fn($r) => $r['status'] === 'success'))
            ];

        } catch (\Exception $e) {
            $io->error("  ✗ Publishing failed: " . $e->getMessage());
            Log::error("Post publishing failed for post {$postId}: " . $e->getMessage());

            return [
                'status' => 'failed',
                'post_id' => $postId,
                'client' => $clientName,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Validate post before publishing
     *
     * @param object $post Post entity
     * @param bool $isForce Force publishing
     * @return array Validation result
     */
    private function validatePost($post, bool $isForce): array
    {
        // Check if post has platforms
        if (empty($post->post_platforms)) {
            return [
                'valid' => false,
                'reason' => 'No social media platforms configured'
            ];
        }

        // Check if all accounts have valid tokens
        foreach ($post->post_platforms as $platform) {
            if (empty($platform->social_account->access_token)) {
                if (!$isForce) {
                    return [
                        'valid' => false,
                        'reason' => "Missing access token for {$platform->social_account->platform}"
                    ];
                }
            }

            // Check token expiration
            if ($platform->social_account->token_expires_at &&
                $platform->social_account->token_expires_at <= new DateTime()) {
                if (!$isForce) {
                    return [
                        'valid' => false,
                        'reason' => "Expired token for {$platform->social_account->platform}"
                    ];
                }
            }
        }

        // Platform-specific validations
        foreach ($post->post_platforms as $platform) {
            $platformValidation = $this->validatePlatformRequirements($post, $platform);
            if (!$platformValidation['valid'] && !$isForce) {
                return $platformValidation;
            }
        }

        return ['valid' => true];
    }

    /**
     * Validate platform-specific requirements
     *
     * @param object $post Post entity
     * @param object $platform Platform entity
     * @return array Validation result
     */
    private function validatePlatformRequirements($post, $platform): array
    {
        $platformName = $platform->social_account->platform;

        switch ($platformName) {
            case 'instagram':
                if (empty($post->media_files)) {
                    return [
                        'valid' => false,
                        'reason' => 'Instagram posts require at least one media file'
                    ];
                }
                break;

            case 'youtube':
                $hasVideo = false;
                foreach ($post->media_files as $media) {
                    if (strpos($media->file_type, 'video') !== false) {
                        $hasVideo = true;
                        break;
                    }
                }
                if (!$hasVideo) {
                    return [
                        'valid' => false,
                        'reason' => 'YouTube posts require video content'
                    ];
                }
                break;

            case 'twitter':
                if (strlen($post->content) > 280) {
                    // This is OK, we'll create a thread
                }
                break;
        }

        return ['valid' => true];
    }

    /**
     * Publish to specific platform
     *
     * @param object $post Post entity
     * @param object $platform Platform entity
     * @return array Publishing result
     */
    private function publishToPlatform($post, $platform): array
    {
        $serviceClass = 'App\\Service\\' . ucfirst($platform->social_account->platform) . 'Service';

        if (!class_exists($serviceClass)) {
            throw new \Exception("Service not found for platform: {$platform->social_account->platform}");
        }

        $service = new $serviceClass();

        // Prepare content
        $content = $this->prepareContentForPlatform($post, $platform->social_account->platform);

        // Platform-specific options
        $options = $this->getPlatformSpecificOptions($post, $platform->social_account);

        // Publish
        return $service->publishContent($platform->social_account->access_token, $content, $options);
    }

    /**
     * Prepare content for platform
     *
     * @param object $post Post entity
     * @param string $platform Platform name
     * @return array Formatted content
     */
    private function prepareContentForPlatform($post, string $platform): array
    {
        $content = [
            'text' => $post->content,
            'title' => $post->title
        ];

        // Add media files
        if (!empty($post->media_files)) {
            $content['media'] = [];
            foreach ($post->media_files as $media) {
                $content['media'][] = [
                    'path' => WWW_ROOT . $media->file_path,
                    'type' => $media->file_type,
                    'url' => $this->getMediaUrl($media->file_path)
                ];
            }
        }

        return $content;
    }

    /**
     * Get platform-specific options
     *
     * @param object $post Post entity
     * @param object $socialAccount Social account entity
     * @return array Platform options
     */
    private function getPlatformSpecificOptions($post, $socialAccount): array
    {
        $options = [];

        // Get platform-specific data from post
        $platformData = json_decode($post->platform_specific_data ?? '{}', true);
        $platformOptions = $platformData[$socialAccount->platform] ?? [];

        // Add account-specific data
        $accountData = json_decode($socialAccount->account_data ?? '{}', true);

        switch ($socialAccount->platform) {
            case 'instagram':
                $options['instagram_account_id'] = $accountData['instagram_account_id'] ?? null;
                break;
            case 'facebook':
                $options['page_id'] = $accountData['page_id'] ?? null;
                break;
            case 'linkedin':
                $options['person_id'] = $accountData['person_id'] ?? null;
                $options['organization_id'] = $platformOptions['organization_id'] ?? null;
                break;
        }

        return array_merge($options, $platformOptions);
    }

    /**
     * Update platform with published data
     *
     * @param int $platformId Platform ID
     * @param array $publishResult Publishing result
     * @return void
     */
    private function updatePlatformPublishedData(int $platformId, array $publishResult): void
    {
        $postPlatformsTable = TableRegistry::getTableLocator()->get('PostPlatforms');

        $platform = $postPlatformsTable->get($platformId);
        $platform->platform_post_id = $publishResult['platform_post_id'];
        $platform->published_at = new DateTime($publishResult['published_at']);
        $platform->platform_data = json_encode($publishResult['platform_data'] ?? []);
        $platform->status = 'published';

        $postPlatformsTable->save($platform);
    }

    /**
     * Update post status after publishing
     *
     * @param object $post Post entity
     * @param bool $hasFailures Whether there were failures
     * @return void
     */
    private function updatePostStatus($post, bool $hasFailures): void
    {
        $postsTable = TableRegistry::getTableLocator()->get('Posts');

        $post->status = $hasFailures ? 'partially_published' : 'published';
        $post->published_at = new DateTime();

        $postsTable->save($post);
    }

    /**
     * Output publishing summary
     *
     * @param array $results Publishing results
     * @param float $startTime Start time
     * @param \Cake\Console\ConsoleIo $io Console IO
     * @return void
     */
    private function outputSummary(array $results, float $startTime, ConsoleIo $io): void
    {
        $duration = round(microtime(true) - $startTime, 2);

        $io->out('');
        $io->out('<info>===== PUBLISHING SUMMARY =====</info>');
        $io->out("Execution time: {$duration} seconds");
        $io->out("Total posts processed: {$results['total']}");
        $io->out("<success>Successfully published: {$results['successful']}</success>");

        if ($results['failed'] > 0) {
            $io->out("<error>Failed to publish: {$results['failed']}</error>");
        }

        if ($results['skipped'] > 0) {
            $io->out("<warning>Skipped: {$results['skipped']}</warning>");
        }

        // Show errors if any
        if (!empty($results['errors'])) {
            $io->out('');
            $io->out('<error>Errors encountered:</error>');
            foreach ($results['errors'] as $error) {
                $io->out("  Post #{$error['post_id']}: {$error['error'] ?? $error['reason']}");
            }
        }

        $io->out('');
    }

    /**
     * Log publishing results
     *
     * @param array $results Publishing results
     * @param bool $isDryRun Whether this was a dry run
     * @return void
     */
    private function logResults(array $results, bool $isDryRun): void
    {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'dry_run' => $isDryRun,
            'results' => $results
        ];

        $level = $results['failed'] > 0 ? 'error' : 'info';
        $message = sprintf(
            "Post Publisher %s: %d total, %d successful, %d failed, %d skipped",
            $isDryRun ? '[DRY RUN]' : 'completed',
            $results['total'],
            $results['successful'],
            $results['failed'],
            $results['skipped']
        );

        Log::write($level, $message, ['publisher' => $logData]);
    }

    /**
     * Get media URL
     *
     * @param string $filePath File path
     * @return string Public URL
     */
    private function getMediaUrl(string $filePath): string
    {
        // This should match your media URL configuration
        return 'http://localhost:8080/media/' . $filePath;
    }
}
