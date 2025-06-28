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
 * Analytics Sync Command
 *
 * Automated analytics synchronization from social media platforms
 * Runs via cron job to collect performance data
 */
class AnalyticsSyncCommand extends Command
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
            ->setDescription('Sync analytics data from social media platforms')
            ->addOption('platform', [
                'help' => 'Sync analytics for specific platform only',
                'short' => 'p'
            ])
            ->addOption('client-id', [
                'help' => 'Sync analytics for specific client only',
                'short' => 'c'
            ])
            ->addOption('days', [
                'help' => 'Number of days back to sync (default: 7)',
                'short' => 'd',
                'default' => 7
            ])
            ->addOption('force', [
                'help' => 'Force sync even if recently synced',
                'boolean' => true,
                'short' => 'f'
            ])
            ->addOption('limit', [
                'help' => 'Maximum number of posts to process',
                'short' => 'l',
                'default' => 100
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
        $platform = $args->getOption('platform');
        $clientId = $args->getOption('client-id');
        $days = (int)$args->getOption('days');
        $isForce = $args->getOption('force');
        $limit = (int)$args->getOption('limit');
        $isVerbose = $args->getOption('verbose');

        $io->out('<info>Starting Analytics Sync...</info>');
        $io->out('Time: ' . date('Y-m-d H:i:s'));

        if ($platform) {
            $io->out("Platform filter: {$platform}");
        }
        if ($clientId) {
            $io->out("Client filter: {$clientId}");
        }
        $io->out("Syncing last {$days} days");

        try {
            // Get published posts that need analytics sync
            $posts = $this->getPostsForSync($platform, $clientId, $days, $limit, $isForce);

            if (empty($posts)) {
                $io->out('<success>No posts need analytics sync at this time.</success>');
                return static::CODE_SUCCESS;
            }

            $io->out("Found " . count($posts) . " post platforms to sync");

            // Process analytics sync
            $results = [
                'total' => count($posts),
                'successful' => 0,
                'failed' => 0,
                'skipped' => 0,
                'errors' => []
            ];

            foreach ($posts as $postPlatform) {
                $syncResult = $this->syncPostAnalytics($postPlatform, $isForce, $isVerbose, $io);

                switch ($syncResult['status']) {
                    case 'success':
                        $results['successful']++;
                        break;
                    case 'failed':
                        $results['failed']++;
                        $results['errors'][] = $syncResult;
                        break;
                    case 'skipped':
                        $results['skipped']++;
                        break;
                }
            }

            // Output summary
            $this->outputSummary($results, $startTime, $io);

            // Log results
            $this->logResults($results);

            return $results['failed'] > 0 ? static::CODE_ERROR : static::CODE_SUCCESS;

        } catch (\Exception $e) {
            $io->error("Fatal error during analytics sync: " . $e->getMessage());
            Log::error("Analytics Sync Command failed: " . $e->getMessage());
            return static::CODE_ERROR;
        }
    }

    /**
     * Get post platforms that need analytics sync
     *
     * @param string|null $platform Platform filter
     * @param string|null $clientId Client ID filter
     * @param int $days Days back to consider
     * @param int $limit Limit number of posts
     * @param bool $isForce Force sync
     * @return array Post platforms
     */
    private function getPostsForSync(?string $platform, ?string $clientId, int $days, int $limit, bool $isForce): array
    {
        $postPlatformsTable = TableRegistry::getTableLocator()->get('PostPlatforms');

        $cutoffDate = (new DateTime())->subDays($days);

        $conditions = [
            'PostPlatforms.status' => 'published',
            'PostPlatforms.published_at >=' => $cutoffDate,
            'PostPlatforms.platform_post_id IS NOT' => null
        ];

        if ($platform) {
            $conditions['SocialAccounts.platform'] = $platform;
        }

        if ($clientId) {
            $conditions['Posts.client_id'] = $clientId;
        }

        $query = $postPlatformsTable->find()
            ->contain([
                'Posts' => ['fields' => ['id', 'title', 'client_id']],
                'SocialAccounts' => ['fields' => ['id', 'platform', 'account_name', 'access_token']]
            ])
            ->where($conditions)
            ->order(['PostPlatforms.published_at' => 'DESC'])
            ->limit($limit);

        // If not forcing, exclude recently synced posts
        if (!$isForce) {
            $recentSyncCutoff = (new DateTime())->subHours(1);
            $query->leftJoinWith('Analytics', function ($q) use ($recentSyncCutoff) {
                return $q->where(['Analytics.recorded_at >' => $recentSyncCutoff]);
            })
            ->where(['Analytics.id IS' => null]);
        }

        return $query->toArray();
    }

    /**
     * Sync analytics for a single post platform
     *
     * @param object $postPlatform Post platform entity
     * @param bool $isForce Force sync
     * @param bool $isVerbose Verbose output
     * @param \Cake\Console\ConsoleIo $io Console IO
     * @return array Sync result
     */
    private function syncPostAnalytics($postPlatform, bool $isForce, bool $isVerbose, ConsoleIo $io): array
    {
        $platform = $postPlatform->social_account->platform;
        $postTitle = $postPlatform->post->title ?: 'Untitled';
        $accountName = $postPlatform->social_account->account_name;

        if ($isVerbose) {
            $io->out("  Syncing {$platform} - {$accountName}: {$postTitle}");
        }

        try {
            // Check if we should skip this sync
            if (!$isForce && $this->isRecentlySynced($postPlatform->id)) {
                if ($isVerbose) {
                    $io->out("    <warning>Skipped (recently synced)</warning>");
                }
                return [
                    'status' => 'skipped',
                    'post_platform_id' => $postPlatform->id,
                    'reason' => 'Recently synced',
                    'platform' => $platform
                ];
            }

            // Get the service
            $service = $this->getSocialMediaService($platform);

            // Fetch analytics data
            $analyticsData = $service->getPostAnalytics(
                $postPlatform->social_account->access_token,
                $postPlatform->platform_post_id
            );

            // Save analytics data
            $this->saveAnalyticsData($postPlatform->id, $analyticsData);

            if ($isVerbose) {
                $engagement = ($analyticsData['likes'] ?? 0) + ($analyticsData['comments'] ?? 0) + ($analyticsData['shares'] ?? 0);
                $io->out("    <success>✓ Synced - Engagement: {$engagement}, Reach: " . ($analyticsData['reach'] ?? 0) . "</success>");
            }

            return [
                'status' => 'success',
                'post_platform_id' => $postPlatform->id,
                'platform' => $platform,
                'analytics' => $analyticsData
            ];

        } catch (\Exception $e) {
            if ($isVerbose) {
                $io->error("    ✗ Failed: " . $e->getMessage());
            }

            Log::error("Analytics sync failed for post platform {$postPlatform->id} ({$platform}): " . $e->getMessage());

            return [
                'status' => 'failed',
                'post_platform_id' => $postPlatform->id,
                'platform' => $platform,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get social media service for platform
     *
     * @param string $platform Platform name
     * @return object Service instance
     */
    private function getSocialMediaService(string $platform): object
    {
        $serviceClass = 'App\\Service\\' . ucfirst($platform) . 'Service';

        if (!class_exists($serviceClass)) {
            throw new \Exception("Service not found for platform: {$platform}");
        }

        return new $serviceClass();
    }

    /**
     * Check if post platform was recently synced
     *
     * @param int $postPlatformId Post platform ID
     * @return bool True if recently synced
     */
    private function isRecentlySynced(int $postPlatformId): bool
    {
        $analyticsTable = TableRegistry::getTableLocator()->get('Analytics');

        $lastSync = $analyticsTable->find()
            ->where(['post_platform_id' => $postPlatformId])
            ->order(['recorded_at' => 'DESC'])
            ->first();

        if (!$lastSync) {
            return false;
        }

        $hoursSinceSync = $lastSync->recorded_at->diffInHours(new DateTime());
        return $hoursSinceSync < 1; // Consider recent if synced within last hour
    }

    /**
     * Save analytics data to database
     *
     * @param int $postPlatformId Post platform ID
     * @param array $analyticsData Analytics data
     * @return void
     */
    private function saveAnalyticsData(int $postPlatformId, array $analyticsData): void
    {
        $analyticsTable = TableRegistry::getTableLocator()->get('Analytics');

        $analytics = $analyticsTable->newEntity([
            'post_platform_id' => $postPlatformId,
            'likes' => $analyticsData['likes'] ?? 0,
            'comments' => $analyticsData['comments'] ?? 0,
            'shares' => $analyticsData['shares'] ?? 0,
            'reach' => $analyticsData['reach'] ?? 0,
            'impressions' => $analyticsData['impressions'] ?? 0,
            'clicks' => $analyticsData['clicks'] ?? 0,
            'saves' => $analyticsData['saves'] ?? 0,
            'video_views' => $analyticsData['video_views'] ?? 0,
            'platform_data' => json_encode($analyticsData['platform_data'] ?? []),
            'recorded_at' => new DateTime()
        ]);

        $analyticsTable->save($analytics);
    }

    /**
     * Output sync summary
     *
     * @param array $results Sync results
     * @param float $startTime Start time
     * @param \Cake\Console\ConsoleIo $io Console IO
     * @return void
     */
    private function outputSummary(array $results, float $startTime, ConsoleIo $io): void
    {
        $duration = round(microtime(true) - $startTime, 2);

        $io->out('');
        $io->out('<info>===== ANALYTICS SYNC SUMMARY =====</info>');
        $io->out("Execution time: {$duration} seconds");
        $io->out("Total posts processed: {$results['total']}");
        $io->out("<success>Successfully synced: {$results['successful']}</success>");

        if ($results['failed'] > 0) {
            $io->out("<error>Failed to sync: {$results['failed']}</error>");
        }

        if ($results['skipped'] > 0) {
            $io->out("<warning>Skipped: {$results['skipped']}</warning>");
        }

        // Show errors if any
        if (!empty($results['errors'])) {
            $io->out('');
            $io->out('<error>Errors encountered:</error>');
            foreach ($results['errors'] as $error) {
                $io->out("  Platform #{$error['post_platform_id']} ({$error['platform']}): {$error['error']}");
            }
        }

        $io->out('');
    }

    /**
     * Log sync results
     *
     * @param array $results Sync results
     * @return void
     */
    private function logResults(array $results): void
    {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'results' => $results
        ];

        $level = $results['failed'] > 0 ? 'error' : 'info';
        $message = sprintf(
            "Analytics Sync completed: %d total, %d successful, %d failed, %d skipped",
            $results['total'],
            $results['successful'],
            $results['failed'],
            $results['skipped']
        );

        Log::write($level, $message, ['analytics_sync' => $logData]);
    }
}
