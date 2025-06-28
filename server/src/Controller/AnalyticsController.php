<?php
declare(strict_types=1);

namespace App\Controller;

use Cake\Http\Response;
use Cake\I18n\DateTime;
use Cake\Core\Configure;

/**
 * Analytics Controller
 *
 * Handles social media analytics collection, processing, and reporting
 * Provides dashboard metrics and performance insights
 */
class AnalyticsController extends AppController
{
    /**
     * Initialize method
     *
     * @return void
     */
    public function initialize(): void
    {
        parent::initialize();
    }

    /**
     * Get dashboard analytics overview
     *
     * @return \Cake\Http\Response
     */
    public function dashboard(): Response
    {
        $this->request->allowMethod('get');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $dateRange = $this->request->getQuery('range', '30d');
        $clientId = $this->request->getQuery('client_id');

        // Get user's accessible clients
        $clientIds = $this->getUserClientIds($currentUser);

        if ($clientId && !in_array($clientId, $clientIds)) {
            return $this->apiError('Access denied to this client', 403);
        }

        $filterClientIds = $clientId ? [$clientId] : $clientIds;

        // Get analytics data
        $analytics = [
            'overview' => $this->getOverviewMetrics($filterClientIds, $dateRange),
            'platforms' => $this->getPlatformMetrics($filterClientIds, $dateRange),
            'posts' => $this->getPostPerformance($filterClientIds, $dateRange),
            'trends' => $this->getTrendData($filterClientIds, $dateRange),
            'top_content' => $this->getTopPerformingContent($filterClientIds, $dateRange)
        ];

        return $this->apiSuccess($analytics, 'Analytics dashboard data retrieved successfully');
    }

    /**
     * Get detailed client analytics
     *
     * @param int $clientId Client ID
     * @return \Cake\Http\Response
     */
    public function client(int $clientId): Response
    {
        $this->request->allowMethod('get');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        // Verify client access
        if (!in_array($clientId, $this->getUserClientIds($currentUser))) {
            return $this->apiError('Access denied to this client', 403);
        }

        $dateRange = $this->request->getQuery('range', '30d');

        $analytics = [
            'client_info' => $this->getClientInfo($clientId),
            'overview' => $this->getOverviewMetrics([$clientId], $dateRange),
            'platforms' => $this->getPlatformMetrics([$clientId], $dateRange),
            'posting_frequency' => $this->getPostingFrequency($clientId, $dateRange),
            'engagement_trends' => $this->getEngagementTrends($clientId, $dateRange),
            'best_times' => $this->getBestPostingTimes($clientId),
            'content_performance' => $this->getContentPerformance($clientId, $dateRange),
            'platform_comparison' => $this->getPlatformComparison($clientId, $dateRange)
        ];

        return $this->apiSuccess($analytics, 'Client analytics retrieved successfully');
    }

    /**
     * Get platform-specific analytics
     *
     * @return \Cake\Http\Response
     */
    public function platform(): Response
    {
        $this->request->allowMethod('get');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $platform = $this->request->getQuery('platform');
        $clientId = $this->request->getQuery('client_id');
        $dateRange = $this->request->getQuery('range', '30d');

        if (!$platform) {
            return $this->apiError('Platform parameter is required', 400);
        }

        $clientIds = $this->getUserClientIds($currentUser);

        if ($clientId && !in_array($clientId, $clientIds)) {
            return $this->apiError('Access denied to this client', 403);
        }

        $filterClientIds = $clientId ? [$clientId] : $clientIds;

        $analytics = [
            'platform' => $platform,
            'metrics' => $this->getPlatformSpecificMetrics($platform, $filterClientIds, $dateRange),
            'posts' => $this->getPlatformPosts($platform, $filterClientIds, $dateRange),
            'audience' => $this->getPlatformAudience($platform, $filterClientIds),
            'optimal_times' => $this->getPlatformOptimalTimes($platform, $filterClientIds)
        ];

        return $this->apiSuccess($analytics, 'Platform analytics retrieved successfully');
    }

    /**
     * Sync analytics data from social platforms
     *
     * @return \Cake\Http\Response
     */
    public function sync(): Response
    {
        $this->request->allowMethod('post');

        // This endpoint should be protected for cron jobs or admin use
        $authKey = $this->request->getHeaderLine('X-Cron-Auth');
        $expectedKey = Configure::read('Cron.auth_key', 'default-cron-key');

        if ($authKey !== $expectedKey) {
            // Allow authenticated users to trigger sync manually
            $currentUser = $this->getCurrentUser();
            if (!$currentUser || !$currentUser->isManager()) {
                return $this->apiError('Unauthorized', 401);
            }
        }

        $clientIds = $this->request->getData('client_ids', []);
        $forceSync = $this->request->getData('force', false);

        try {
            $results = $this->syncAnalyticsData($clientIds, $forceSync);

            return $this->apiSuccess($results, 'Analytics sync completed');
        } catch (\Exception $e) {
            $this->log("Analytics sync failed: " . $e->getMessage(), 'error');
            return $this->apiError('Analytics sync failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get real-time metrics for live dashboard
     *
     * @return \Cake\Http\Response
     */
    public function realtime(): Response
    {
        $this->request->allowMethod('get');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $clientIds = $this->getUserClientIds($currentUser);

        // Get recent activity (last 24 hours)
        $realtimeData = [
            'recent_posts' => $this->getRecentPosts($clientIds),
            'live_engagement' => $this->getLiveEngagement($clientIds),
            'trending_content' => $this->getTrendingContent($clientIds),
            'platform_status' => $this->getPlatformStatus($clientIds),
            'notifications' => $this->getAnalyticsNotifications($clientIds)
        ];

        return $this->apiSuccess($realtimeData, 'Real-time analytics retrieved successfully');
    }

    /**
     * Export analytics report
     *
     * @return \Cake\Http\Response
     */
    public function export(): Response
    {
        $this->request->allowMethod('post');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $reportData = $this->request->getData();
        $clientIds = $reportData['client_ids'] ?? $this->getUserClientIds($currentUser);
        $format = $reportData['format'] ?? 'pdf';
        $dateRange = $reportData['date_range'] ?? '30d';

        // Verify client access
        foreach ($clientIds as $clientId) {
            if (!in_array($clientId, $this->getUserClientIds($currentUser))) {
                return $this->apiError('Access denied to one or more clients', 403);
            }
        }

        try {
            $reportPath = $this->generateAnalyticsReport($clientIds, $dateRange, $format);

            return $this->apiSuccess([
                'report_path' => $reportPath,
                'download_url' => $this->getReportDownloadUrl($reportPath),
                'format' => $format,
                'generated_at' => new DateTime()
            ], 'Report generated successfully');
        } catch (\Exception $e) {
            $this->log("Report generation failed: " . $e->getMessage(), 'error');
            return $this->apiError('Report generation failed', 500);
        }
    }

    // Private helper methods

    /**
     * Get overview metrics
     *
     * @param array $clientIds Client IDs
     * @param string $dateRange Date range
     * @return array Overview metrics
     */
    private function getOverviewMetrics(array $clientIds, string $dateRange): array
    {
        $analyticsTable = $this->fetchTable('Analytics');

        $dateConditions = $this->getDateRangeConditions($dateRange);

        $metrics = $analyticsTable->find()
            ->innerJoinWith('PostPlatforms.Posts')
            ->where([
                'Posts.client_id IN' => $clientIds,
                'Analytics.recorded_at >=' => $dateConditions['start'],
                'Analytics.recorded_at <=' => $dateConditions['end']
            ])
            ->select([
                'total_likes' => $analyticsTable->find()->func()->sum('Analytics.likes'),
                'total_comments' => $analyticsTable->find()->func()->sum('Analytics.comments'),
                'total_shares' => $analyticsTable->find()->func()->sum('Analytics.shares'),
                'total_reach' => $analyticsTable->find()->func()->sum('Analytics.reach'),
                'total_impressions' => $analyticsTable->find()->func()->sum('Analytics.impressions'),
                'total_clicks' => $analyticsTable->find()->func()->sum('Analytics.clicks')
            ])
            ->first();

        $postsTable = $this->fetchTable('Posts');
        $totalPosts = $postsTable->find()
            ->where([
                'client_id IN' => $clientIds,
                'status' => 'published',
                'published_at >=' => $dateConditions['start'],
                'published_at <=' => $dateConditions['end']
            ])
            ->count();

        return [
            'total_posts' => $totalPosts,
            'total_likes' => $metrics->total_likes ?? 0,
            'total_comments' => $metrics->total_comments ?? 0,
            'total_shares' => $metrics->total_shares ?? 0,
            'total_reach' => $metrics->total_reach ?? 0,
            'total_impressions' => $metrics->total_impressions ?? 0,
            'total_clicks' => $metrics->total_clicks ?? 0,
            'engagement_rate' => $this->calculateEngagementRate($metrics),
            'average_reach_per_post' => $totalPosts > 0 ? round(($metrics->total_reach ?? 0) / $totalPosts, 2) : 0
        ];
    }

    /**
     * Get platform-specific metrics
     *
     * @param array $clientIds Client IDs
     * @param string $dateRange Date range
     * @return array Platform metrics
     */
    private function getPlatformMetrics(array $clientIds, string $dateRange): array
    {
        $socialAccountsTable = $this->fetchTable('SocialAccounts');
        $analyticsTable = $this->fetchTable('Analytics');

        $platforms = ['facebook', 'instagram', 'twitter', 'youtube', 'threads', 'linkedin'];
        $dateConditions = $this->getDateRangeConditions($dateRange);

        $platformMetrics = [];

        foreach ($platforms as $platform) {
            $accountsCount = $socialAccountsTable->find()
                ->where([
                    'client_id IN' => $clientIds,
                    'platform' => $platform,
                    'is_active' => true
                ])
                ->count();

            if ($accountsCount > 0) {
                $metrics = $analyticsTable->find()
                    ->innerJoinWith('PostPlatforms.Posts')
                    ->innerJoinWith('PostPlatforms.SocialAccounts')
                    ->where([
                        'Posts.client_id IN' => $clientIds,
                        'SocialAccounts.platform' => $platform,
                        'Analytics.recorded_at >=' => $dateConditions['start'],
                        'Analytics.recorded_at <=' => $dateConditions['end']
                    ])
                    ->select([
                        'total_posts' => $analyticsTable->find()->func()->count('DISTINCT PostPlatforms.post_id'),
                        'total_likes' => $analyticsTable->find()->func()->sum('Analytics.likes'),
                        'total_comments' => $analyticsTable->find()->func()->sum('Analytics.comments'),
                        'total_shares' => $analyticsTable->find()->func()->sum('Analytics.shares'),
                        'total_reach' => $analyticsTable->find()->func()->sum('Analytics.reach'),
                        'total_impressions' => $analyticsTable->find()->func()->sum('Analytics.impressions')
                    ])
                    ->first();

                $platformMetrics[$platform] = [
                    'accounts_count' => $accountsCount,
                    'posts_count' => $metrics->total_posts ?? 0,
                    'likes' => $metrics->total_likes ?? 0,
                    'comments' => $metrics->total_comments ?? 0,
                    'shares' => $metrics->total_shares ?? 0,
                    'reach' => $metrics->total_reach ?? 0,
                    'impressions' => $metrics->total_impressions ?? 0,
                    'engagement_rate' => $this->calculateEngagementRate($metrics)
                ];
            }
        }

        return $platformMetrics;
    }

    /**
     * Get post performance data
     *
     * @param array $clientIds Client IDs
     * @param string $dateRange Date range
     * @return array Post performance
     */
    private function getPostPerformance(array $clientIds, string $dateRange): array
    {
        $postsTable = $this->fetchTable('Posts');
        $dateConditions = $this->getDateRangeConditions($dateRange);

        $posts = $postsTable->find()
            ->contain([
                'PostPlatforms' => [
                    'Analytics' => [
                        'conditions' => [
                            'Analytics.recorded_at >=' => $dateConditions['start'],
                            'Analytics.recorded_at <=' => $dateConditions['end']
                        ]
                    ],
                    'SocialAccounts'
                ],
                'Clients'
            ])
            ->where([
                'Posts.client_id IN' => $clientIds,
                'Posts.status' => 'published',
                'Posts.published_at >=' => $dateConditions['start'],
                'Posts.published_at <=' => $dateConditions['end']
            ])
            ->order(['Posts.published_at' => 'DESC'])
            ->limit(20)
            ->toArray();

        $performanceData = [];
        foreach ($posts as $post) {
            $totalEngagement = 0;
            $totalReach = 0;
            $platforms = [];

            foreach ($post->post_platforms as $platform) {
                if (!empty($platform->analytics)) {
                    $analytics = end($platform->analytics); // Get latest analytics
                    $engagement = ($analytics->likes ?? 0) + ($analytics->comments ?? 0) + ($analytics->shares ?? 0);
                    $totalEngagement += $engagement;
                    $totalReach += $analytics->reach ?? 0;

                    $platforms[] = [
                        'platform' => $platform->social_account->platform,
                        'engagement' => $engagement,
                        'reach' => $analytics->reach ?? 0
                    ];
                }
            }

            $performanceData[] = [
                'post_id' => $post->id,
                'title' => $post->title,
                'content_preview' => substr($post->content, 0, 100) . '...',
                'published_at' => $post->published_at,
                'client_name' => $post->client->name,
                'total_engagement' => $totalEngagement,
                'total_reach' => $totalReach,
                'engagement_rate' => $totalReach > 0 ? round(($totalEngagement / $totalReach) * 100, 2) : 0,
                'platforms' => $platforms
            ];
        }

        return $performanceData;
    }

    /**
     * Get trend data for charts
     *
     * @param array $clientIds Client IDs
     * @param string $dateRange Date range
     * @return array Trend data
     */
    private function getTrendData(array $clientIds, string $dateRange): array
    {
        $analyticsTable = $this->fetchTable('Analytics');
        $dateConditions = $this->getDateRangeConditions($dateRange);

        // Get daily aggregated data
        $trendData = $analyticsTable->find()
            ->innerJoinWith('PostPlatforms.Posts')
            ->where([
                'Posts.client_id IN' => $clientIds,
                'Analytics.recorded_at >=' => $dateConditions['start'],
                'Analytics.recorded_at <=' => $dateConditions['end']
            ])
            ->select([
                'date' => $analyticsTable->find()->func()->date_format(['Analytics.recorded_at' => 'identifier', "'%Y-%m-%d'" => 'literal']),
                'total_engagement' => $analyticsTable->find()->func()->sum(
                    'Analytics.likes + Analytics.comments + Analytics.shares'
                ),
                'total_reach' => $analyticsTable->find()->func()->sum('Analytics.reach'),
                'total_impressions' => $analyticsTable->find()->func()->sum('Analytics.impressions')
            ])
            ->groupBy('date')
            ->orderBy('date')
            ->toArray();

        return $trendData;
    }

    /**
     * Get top performing content
     *
     * @param array $clientIds Client IDs
     * @param string $dateRange Date range
     * @return array Top content
     */
    private function getTopPerformingContent(array $clientIds, string $dateRange): array
    {
        // Implementation similar to getPostPerformance but sorted by engagement
        $performanceData = $this->getPostPerformance($clientIds, $dateRange);

        // Sort by engagement rate
        usort($performanceData, function($a, $b) {
            return $b['engagement_rate'] <=> $a['engagement_rate'];
        });

        return array_slice($performanceData, 0, 10);
    }

    /**
     * Sync analytics data from social platforms
     *
     * @param array $clientIds Client IDs (empty for all)
     * @param bool $forceSync Force sync even if recently synced
     * @return array Sync results
     */
    private function syncAnalyticsData(array $clientIds = [], bool $forceSync = false): array
    {
        $postPlatformsTable = $this->fetchTable('PostPlatforms');

        $conditions = ['status' => 'published'];
        if (!empty($clientIds)) {
            $conditions['Posts.client_id IN'] = $clientIds;
        }

        $publishedPosts = $postPlatformsTable->find()
            ->contain(['Posts', 'SocialAccounts'])
            ->innerJoinWith('Posts', function($q) {
                return $q->where(['Posts.status' => 'published']);
            })
            ->where($conditions)
            ->toArray();

        $syncResults = [
            'total_processed' => 0,
            'successful' => 0,
            'failed' => 0,
            'skipped' => 0,
            'errors' => []
        ];

        foreach ($publishedPosts as $postPlatform) {
            try {
                $syncResults['total_processed']++;

                // Check if we need to sync (skip if recently synced and not forced)
                if (!$forceSync && $this->isRecentlySynced($postPlatform->id)) {
                    $syncResults['skipped']++;
                    continue;
                }

                $service = $this->getSocialMediaService($postPlatform->social_account->platform);
                $analyticsData = $service->getPostAnalytics(
                    $postPlatform->social_account->access_token,
                    $postPlatform->platform_post_id
                );

                $this->saveAnalyticsData($postPlatform->id, $analyticsData);
                $syncResults['successful']++;

            } catch (\Exception $e) {
                $syncResults['failed']++;
                $syncResults['errors'][] = [
                    'post_platform_id' => $postPlatform->id,
                    'platform' => $postPlatform->social_account->platform,
                    'error' => $e->getMessage()
                ];

                $this->log("Analytics sync failed for post platform {$postPlatform->id}: " . $e->getMessage(), 'error');
            }
        }

        return $syncResults;
    }

    /**
     * Calculate engagement rate
     *
     * @param object $metrics Metrics object
     * @return float Engagement rate
     */
    private function calculateEngagementRate($metrics): float
    {
        if (!$metrics || empty($metrics->total_impressions)) {
            return 0.0;
        }

        $engagement = ($metrics->total_likes ?? 0) + ($metrics->total_comments ?? 0) + ($metrics->total_shares ?? 0);
        return round(($engagement / $metrics->total_impressions) * 100, 2);
    }

    /**
     * Get date range conditions
     *
     * @param string $range Date range
     * @return array Date conditions
     */
    private function getDateRangeConditions(string $range): array
    {
        $now = new DateTime();

        switch ($range) {
            case '7d':
                $start = $now->subDays(7);
                break;
            case '30d':
                $start = $now->subDays(30);
                break;
            case '90d':
                $start = $now->subDays(90);
                break;
            case '1y':
                $start = $now->subYear(1);
                break;
            default:
                $start = $now->subDays(30);
        }

        return [
            'start' => $start,
            'end' => new DateTime()
        ];
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
        $analyticsTable = $this->fetchTable('Analytics');

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
     * Save analytics data
     *
     * @param int $postPlatformId Post platform ID
     * @param array $analyticsData Analytics data
     * @return void
     */
    private function saveAnalyticsData(int $postPlatformId, array $analyticsData): void
    {
        $analyticsTable = $this->fetchTable('Analytics');

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
     * Get user's accessible client IDs
     *
     * @param object $user User object
     * @return array Client IDs
     */
    private function getUserClientIds($user): array
    {
        $clientsTable = $this->fetchTable('Clients');

        $query = $clientsTable->find()
            ->where([
                'organization_id' => $user->organization_id,
                'is_active' => true
            ])
            ->select(['id']);

        // TODO: Implement designer-specific client assignments

        $clients = $query->toArray();
        return array_column($clients, 'id');
    }

    // Additional helper methods for specific analytics features would be implemented here
    // These are placeholders for the complete implementation

    private function getClientInfo(int $clientId): array
    {
        $clientsTable = $this->fetchTable('Clients');
        $client = $clientsTable->get($clientId);

        return [
            'id' => $client->id,
            'name' => $client->name,
            'email' => $client->email,
            'website' => $client->website
        ];
    }

    private function getPostingFrequency(int $clientId, string $dateRange): array
    {
        // Implementation for posting frequency analysis
        return [];
    }

    private function getEngagementTrends(int $clientId, string $dateRange): array
    {
        // Implementation for engagement trend analysis
        return [];
    }

    private function getBestPostingTimes(int $clientId): array
    {
        // Implementation for optimal posting time analysis
        return [];
    }

    private function getContentPerformance(int $clientId, string $dateRange): array
    {
        // Implementation for content performance analysis
        return [];
    }

    private function getPlatformComparison(int $clientId, string $dateRange): array
    {
        // Implementation for platform comparison analysis
        return [];
    }

    private function getPlatformSpecificMetrics(string $platform, array $clientIds, string $dateRange): array
    {
        // Implementation for platform-specific metrics
        return [];
    }

    private function getPlatformPosts(string $platform, array $clientIds, string $dateRange): array
    {
        // Implementation for platform-specific posts
        return [];
    }

    private function getPlatformAudience(string $platform, array $clientIds): array
    {
        // Implementation for platform audience analysis
        return [];
    }

    private function getPlatformOptimalTimes(string $platform, array $clientIds): array
    {
        // Implementation for platform optimal times
        return [];
    }

    private function getRecentPosts(array $clientIds): array
    {
        // Implementation for recent posts data
        return [];
    }

    private function getLiveEngagement(array $clientIds): array
    {
        // Implementation for live engagement data
        return [];
    }

    private function getTrendingContent(array $clientIds): array
    {
        // Implementation for trending content
        return [];
    }

    private function getPlatformStatus(array $clientIds): array
    {
        // Implementation for platform status
        return [];
    }

    private function getAnalyticsNotifications(array $clientIds): array
    {
        // Implementation for analytics notifications
        return [];
    }

    private function generateAnalyticsReport(array $clientIds, string $dateRange, string $format): string
    {
        // Implementation for report generation
        return '';
    }

    private function getReportDownloadUrl(string $reportPath): string
    {
        // Implementation for report download URL
        return '';
    }
}
