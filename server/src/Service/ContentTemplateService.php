<?php
declare(strict_types=1);

namespace App\Service;

use Cake\ORM\TableRegistry;
use Cake\I18n\DateTime;

/**
 * Content Template Service
 *
 * Provides platform-specific content optimization, templates, and suggestions
 * Handles content formatting, hashtag generation, and best practices
 */
class ContentTemplateService
{
    private array $platformLimits = [
        'facebook' => ['text' => 63206, 'hashtags' => 30],
        'instagram' => ['text' => 2200, 'hashtags' => 30],
        'twitter' => ['text' => 280, 'hashtags' => 10],
        'linkedin' => ['text' => 3000, 'hashtags' => 10],
        'youtube' => ['text' => 5000, 'hashtags' => 15],
        'threads' => ['text' => 500, 'hashtags' => 10]
    ];

    private array $platformFeatures = [
        'facebook' => ['links', 'media', 'emojis', 'mentions', 'hashtags'],
        'instagram' => ['media', 'stories', 'reels', 'emojis', 'hashtags'],
        'twitter' => ['threads', 'media', 'polls', 'emojis', 'hashtags'],
        'linkedin' => ['articles', 'media', 'professional', 'hashtags'],
        'youtube' => ['videos', 'descriptions', 'thumbnails', 'hashtags'],
        'threads' => ['text', 'media', 'replies', 'emojis', 'hashtags']
    ];

    /**
     * Get platform-specific content templates
     *
     * @param string $platform Platform name
     * @param string $category Template category
     * @return array Templates
     */
    public function getTemplates(string $platform, string $category = 'general'): array
    {
        $templates = [
            'facebook' => [
                'general' => [
                    'announcement' => [
                        'title' => 'Announcement Template',
                        'content' => "🎉 Exciting news! {announcement}\n\n{details}\n\n{call_to_action}",
                        'placeholders' => ['announcement', 'details', 'call_to_action'],
                        'hashtags' => ['#announcement', '#news', '#exciting']
                    ],
                    'product_showcase' => [
                        'title' => 'Product Showcase',
                        'content' => "✨ Introducing {product_name}!\n\n{description}\n\n🌟 Key features:\n{features}\n\n{call_to_action}",
                        'placeholders' => ['product_name', 'description', 'features', 'call_to_action'],
                        'hashtags' => ['#product', '#launch', '#innovation']
                    ],
                    'behind_the_scenes' => [
                        'title' => 'Behind the Scenes',
                        'content' => "👀 Behind the scenes at {company}...\n\n{story}\n\n{team_mention}",
                        'placeholders' => ['company', 'story', 'team_mention'],
                        'hashtags' => ['#behindthescenes', '#team', '#company']
                    ]
                ],
                'promotional' => [
                    'sale' => [
                        'title' => 'Sale Announcement',
                        'content' => "🛍️ SALE ALERT! {discount}% OFF {product_category}!\n\n⏰ Limited time: {duration}\n\n🔗 Shop now: {link}",
                        'placeholders' => ['discount', 'product_category', 'duration', 'link'],
                        'hashtags' => ['#sale', '#discount', '#shopping']
                    ]
                ]
            ],
            'instagram' => [
                'general' => [
                    'lifestyle' => [
                        'title' => 'Lifestyle Post',
                        'content' => "{caption}\n\n✨ {inspiration}\n\n{hashtags}",
                        'placeholders' => ['caption', 'inspiration'],
                        'hashtags' => ['#lifestyle', '#inspiration', '#daily', '#moments']
                    ],
                    'product_photo' => [
                        'title' => 'Product Photography',
                        'content' => "{product_name} 📸\n\n{description}\n\n{call_to_action}\n\n{hashtags}",
                        'placeholders' => ['product_name', 'description', 'call_to_action'],
                        'hashtags' => ['#product', '#photography', '#style']
                    ]
                ]
            ],
            'twitter' => [
                'general' => [
                    'quick_tip' => [
                        'title' => 'Quick Tip',
                        'content' => "💡 Quick tip: {tip}\n\n{hashtags}",
                        'placeholders' => ['tip'],
                        'hashtags' => ['#tip', '#advice', '#quicktip']
                    ],
                    'thread_starter' => [
                        'title' => 'Thread Starter',
                        'content' => "🧵 Thread: {topic}\n\n{first_point} (1/{total_points})",
                        'placeholders' => ['topic', 'first_point', 'total_points'],
                        'hashtags' => ['#thread', '#insights']
                    ]
                ]
            ],
            'linkedin' => [
                'professional' => [
                    'industry_insight' => [
                        'title' => 'Industry Insight',
                        'content' => "🔍 Industry Insight: {headline}\n\n{analysis}\n\nKey takeaways:\n{takeaways}\n\nWhat are your thoughts? {hashtags}",
                        'placeholders' => ['headline', 'analysis', 'takeaways'],
                        'hashtags' => ['#industry', '#insights', '#professional']
                    ],
                    'career_advice' => [
                        'title' => 'Career Advice',
                        'content' => "🚀 Career tip: {advice}\n\n{explanation}\n\n{call_to_action}\n\n{hashtags}",
                        'placeholders' => ['advice', 'explanation', 'call_to_action'],
                        'hashtags' => ['#career', '#advice', '#professional']
                    ]
                ]
            ],
            'youtube' => [
                'video' => [
                    'tutorial' => [
                        'title' => 'Tutorial Video',
                        'content' => "🎥 New Tutorial: {title}\n\nIn this video, you'll learn:\n{learning_points}\n\n⏰ Timestamps:\n{timestamps}\n\n{call_to_action}",
                        'placeholders' => ['title', 'learning_points', 'timestamps', 'call_to_action'],
                        'hashtags' => ['#tutorial', '#howto', '#education']
                    ]
                ]
            ],
            'threads' => [
                'general' => [
                    'opinion' => [
                        'title' => 'Opinion Post',
                        'content' => "💭 Hot take: {opinion}\n\n{reasoning}\n\nWhat do you think?",
                        'placeholders' => ['opinion', 'reasoning'],
                        'hashtags' => ['#opinion', '#hottake', '#discussion']
                    ]
                ]
            ]
        ];

        return $templates[$platform][$category] ?? [];
    }

    /**
     * Optimize content for specific platform
     *
     * @param string $content Original content
     * @param string $platform Target platform
     * @param array $options Optimization options
     * @return array Optimized content
     */
    public function optimizeContent(string $content, string $platform, array $options = []): array
    {
        $optimization = [
            'original_content' => $content,
            'platform' => $platform,
            'optimized_content' => $content,
            'warnings' => [],
            'suggestions' => [],
            'hashtags' => [],
            'truncated' => false,
            'thread_parts' => null
        ];

        // Platform-specific optimizations
        switch ($platform) {
            case 'twitter':
                $optimization = $this->optimizeForTwitter($content, $options, $optimization);
                break;
            case 'instagram':
                $optimization = $this->optimizeForInstagram($content, $options, $optimization);
                break;
            case 'linkedin':
                $optimization = $this->optimizeForLinkedIn($content, $options, $optimization);
                break;
            case 'facebook':
                $optimization = $this->optimizeForFacebook($content, $options, $optimization);
                break;
            case 'youtube':
                $optimization = $this->optimizeForYoutube($content, $options, $optimization);
                break;
            case 'threads':
                $optimization = $this->optimizeForThreads($content, $options, $optimization);
                break;
        }

        // General optimizations
        $optimization = $this->applyGeneralOptimizations($optimization, $options);

        return $optimization;
    }

    /**
     * Generate platform-specific hashtags
     *
     * @param string $content Content text
     * @param string $platform Platform name
     * @param array $options Generation options
     * @return array Generated hashtags
     */
    public function generateHashtags(string $content, string $platform, array $options = []): array
    {
        $maxHashtags = $this->platformLimits[$platform]['hashtags'] ?? 10;
        $limit = min($options['limit'] ?? $maxHashtags, $maxHashtags);

        // Extract keywords from content
        $keywords = $this->extractKeywords($content);

        // Get trending hashtags for platform
        $trending = $this->getTrendingHashtags($platform);

        // Generate contextual hashtags
        $contextual = $this->generateContextualHashtags($content, $platform);

        // Combine and rank hashtags
        $allHashtags = array_merge($contextual, $trending);
        $rankedHashtags = $this->rankHashtags($allHashtags, $keywords, $platform);

        return array_slice($rankedHashtags, 0, $limit);
    }

    /**
     * Get content suggestions based on platform and performance data
     *
     * @param string $platform Platform name
     * @param int $clientId Client ID
     * @param array $options Suggestion options
     * @return array Content suggestions
     */
    public function getContentSuggestions(string $platform, int $clientId, array $options = []): array
    {
        $suggestions = [];

        // Analyze top performing content
        $topContent = $this->analyzeTopPerformingContent($platform, $clientId);

        // Get trending topics
        $trendingTopics = $this->getTrendingTopics($platform);

        // Platform-specific suggestions
        $platformSuggestions = $this->getPlatformSpecificSuggestions($platform, $clientId);

        return [
            'performance_based' => $topContent,
            'trending' => $trendingTopics,
            'platform_specific' => $platformSuggestions,
            'templates' => $this->getPopularTemplates($platform),
            'optimal_times' => $this->getOptimalPostingTimes($platform, $clientId)
        ];
    }

    /**
     * Validate content for platform requirements
     *
     * @param string $content Content text
     * @param string $platform Platform name
     * @param array $media Media files
     * @return array Validation result
     */
    public function validateContent(string $content, string $platform, array $media = []): array
    {
        $validation = [
            'valid' => true,
            'errors' => [],
            'warnings' => [],
            'requirements_met' => []
        ];

        // Check character limits
        $limit = $this->platformLimits[$platform]['text'] ?? 1000;
        if (strlen($content) > $limit) {
            $validation['errors'][] = "Content exceeds {$limit} character limit for {$platform}";
            $validation['valid'] = false;
        }

        // Platform-specific validations
        switch ($platform) {
            case 'instagram':
                if (empty($media)) {
                    $validation['errors'][] = 'Instagram posts require at least one media file';
                    $validation['valid'] = false;
                }
                break;

            case 'youtube':
                $hasVideo = false;
                foreach ($media as $file) {
                    if (isset($file['type']) && strpos($file['type'], 'video') !== false) {
                        $hasVideo = true;
                        break;
                    }
                }
                if (!$hasVideo) {
                    $validation['errors'][] = 'YouTube posts require video content';
                    $validation['valid'] = false;
                }
                break;
        }

        // Check for best practices
        $this->addBestPracticeWarnings($content, $platform, $validation);

        return $validation;
    }

    // Private helper methods

    /**
     * Optimize content for Twitter
     */
    private function optimizeForTwitter(string $content, array $options, array $optimization): array
    {
        if (strlen($content) > 280) {
            if ($options['create_thread'] ?? true) {
                $optimization['thread_parts'] = $this->createTwitterThread($content);
                $optimization['suggestions'][] = 'Content split into Twitter thread';
            } else {
                $optimization['optimized_content'] = substr($content, 0, 277) . '...';
                $optimization['truncated'] = true;
                $optimization['warnings'][] = 'Content truncated to fit Twitter limit';
            }
        }

        return $optimization;
    }

    /**
     * Optimize content for Instagram
     */
    private function optimizeForInstagram(string $content, array $options, array $optimization): array
    {
        // Add hashtags if missing
        if (strpos($content, '#') === false) {
            $hashtags = $this->generateHashtags($content, 'instagram', ['limit' => 10]);
            $optimization['hashtags'] = $hashtags;
            $optimization['optimized_content'] = $content . "\n\n" . implode(' ', $hashtags);
            $optimization['suggestions'][] = 'Added relevant hashtags for better discovery';
        }

        // Suggest emojis
        $optimization = $this->suggestEmojis($optimization, 'instagram');

        return $optimization;
    }

    /**
     * Optimize content for LinkedIn
     */
    private function optimizeForLinkedIn(string $content, array $options, array $optimization): array
    {
        // Professional tone check
        if ($this->hasInformalLanguage($content)) {
            $optimization['warnings'][] = 'Content may be too informal for LinkedIn';
            $optimization['suggestions'][] = 'Consider using more professional language';
        }

        // Add call-to-action if missing
        if (!$this->hasCallToAction($content)) {
            $optimization['suggestions'][] = 'Consider adding a call-to-action to encourage engagement';
        }

        return $optimization;
    }

    /**
     * Optimize content for Facebook
     */
    private function optimizeForFacebook(string $content, array $options, array $optimization): array
    {
        // Facebook prefers shorter posts for better engagement
        if (strlen($content) > 500) {
            $optimization['warnings'][] = 'Shorter posts typically perform better on Facebook';
        }

        return $optimization;
    }

    /**
     * Optimize content for YouTube
     */
    private function optimizeForYoutube(string $content, array $options, array $optimization): array
    {
        // Add timestamps if missing
        if (!$this->hasTimestamps($content)) {
            $optimization['suggestions'][] = 'Consider adding timestamps for better viewer experience';
        }

        return $optimization;
    }

    /**
     * Optimize content for Threads
     */
    private function optimizeForThreads(string $content, array $options, array $optimization): array
    {
        if (strlen($content) > 500) {
            $optimization['optimized_content'] = substr($content, 0, 497) . '...';
            $optimization['truncated'] = true;
            $optimization['warnings'][] = 'Content truncated to fit Threads limit';
        }

        return $optimization;
    }

    /**
     * Apply general optimizations
     */
    private function applyGeneralOptimizations(array $optimization, array $options): array
    {
        $content = $optimization['optimized_content'];

        // Fix common formatting issues
        $content = $this->fixFormatting($content);

        // Suggest improvements
        if (!$this->hasEmojis($content) && ($options['suggest_emojis'] ?? true)) {
            $optimization['suggestions'][] = 'Consider adding emojis to make content more engaging';
        }

        $optimization['optimized_content'] = $content;
        return $optimization;
    }

    /**
     * Create Twitter thread from long content
     */
    private function createTwitterThread(string $content): array
    {
        $maxLength = 270; // Leave room for thread numbering
        $sentences = preg_split('/(?<=[.!?])\s+/', $content);
        $threads = [];
        $currentThread = '';
        $threadNumber = 1;

        foreach ($sentences as $sentence) {
            if (strlen($currentThread . ' ' . $sentence) > $maxLength) {
                if (!empty($currentThread)) {
                    $threads[] = $currentThread . " ({$threadNumber}/?)";
                    $threadNumber++;
                    $currentThread = $sentence;
                } else {
                    // Single sentence is too long, split it
                    $threads[] = substr($sentence, 0, $maxLength - 10) . "... ({$threadNumber}/?)";
                    $threadNumber++;
                    $currentThread = substr($sentence, $maxLength - 10);
                }
            } else {
                $currentThread .= (empty($currentThread) ? '' : ' ') . $sentence;
            }
        }

        if (!empty($currentThread)) {
            $threads[] = $currentThread . " ({$threadNumber}/?)";
        }

        // Update thread numbering with total count
        $totalThreads = count($threads);
        for ($i = 0; $i < $totalThreads; $i++) {
            $threads[$i] = str_replace('/?)', "/{$totalThreads})", $threads[$i]);
        }

        return $threads;
    }

    /**
     * Extract keywords from content
     */
    private function extractKeywords(string $content): array
    {
        // Simple keyword extraction
        $words = str_word_count(strtolower($content), 1);
        $stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];
        $keywords = array_filter($words, function($word) use ($stopWords) {
            return strlen($word) > 3 && !in_array($word, $stopWords);
        });

        return array_unique($keywords);
    }

    /**
     * Get trending hashtags for platform
     */
    private function getTrendingHashtags(string $platform): array
    {
        // This would typically fetch from an API or database
        // For now, return some common hashtags by platform
        $trending = [
            'general' => ['#trending', '#viral', '#popular'],
            'instagram' => ['#insta', '#photooftheday', '#instagood'],
            'twitter' => ['#trending', '#breaking', '#news'],
            'linkedin' => ['#professional', '#business', '#industry'],
            'facebook' => ['#community', '#social', '#share'],
            'youtube' => ['#video', '#content', '#creator'],
            'threads' => ['#threads', '#meta', '#social']
        ];

        return array_merge($trending['general'], $trending[$platform] ?? []);
    }

    /**
     * Generate contextual hashtags based on content
     */
    private function generateContextualHashtags(string $content, string $platform): array
    {
        $keywords = $this->extractKeywords($content);
        $hashtags = [];

        foreach ($keywords as $keyword) {
            $hashtags[] = '#' . $keyword;

            // Add variations
            $hashtags[] = '#' . $keyword . 's'; // Plural
            $hashtags[] = '#' . ucfirst($keyword); // Capitalized
        }

        return array_unique($hashtags);
    }

    /**
     * Rank hashtags by relevance and popularity
     */
    private function rankHashtags(array $hashtags, array $keywords, string $platform): array
    {
        // Simple ranking based on keyword presence
        $scored = [];

        foreach ($hashtags as $hashtag) {
            $score = 0;
            $hashtagWord = ltrim($hashtag, '#');

            if (in_array(strtolower($hashtagWord), $keywords)) {
                $score += 10;
            }

            $scored[] = ['hashtag' => $hashtag, 'score' => $score];
        }

        // Sort by score
        usort($scored, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        return array_column($scored, 'hashtag');
    }

    // Additional helper methods would be implemented here...
    private function analyzeTopPerformingContent(string $platform, int $clientId): array { return []; }
    private function getTrendingTopics(string $platform): array { return []; }
    private function getPlatformSpecificSuggestions(string $platform, int $clientId): array { return []; }
    private function getPopularTemplates(string $platform): array { return []; }
    private function getOptimalPostingTimes(string $platform, int $clientId): array { return []; }
    private function addBestPracticeWarnings(string $content, string $platform, array &$validation): void {}
    private function suggestEmojis(array $optimization, string $platform): array { return $optimization; }
    private function hasInformalLanguage(string $content): bool { return false; }
    private function hasCallToAction(string $content): bool { return false; }
    private function hasTimestamps(string $content): bool { return false; }
    private function fixFormatting(string $content): string { return $content; }
    private function hasEmojis(string $content): bool { return preg_match('/[\x{1F600}-\x{1F64F}]/u', $content) > 0; }
}
