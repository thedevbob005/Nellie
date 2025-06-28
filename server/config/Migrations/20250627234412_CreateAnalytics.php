<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class CreateAnalytics extends BaseMigration
{
    /**
     * Change Method.
     *
     * More information on this method is available here:
     * https://book.cakephp.org/migrations/4/en/migrations.html#the-change-method
     * @return void
     */
    public function change(): void
    {
        $table = $this->table('analytics');
        $table->addColumn('post_platform_id', 'integer', [
            'null' => false,
        ]);
        $table->addColumn('platform', 'string', [
            'null' => false,
            'limit' => 50,
        ]);
        $table->addColumn('likes', 'integer', [
            'default' => 0,
            'null' => false,
        ]);
        $table->addColumn('comments', 'integer', [
            'default' => 0,
            'null' => false,
        ]);
        $table->addColumn('shares', 'integer', [
            'default' => 0,
            'null' => false,
        ]);
        $table->addColumn('views', 'integer', [
            'default' => 0,
            'null' => false,
        ]);
        $table->addColumn('impressions', 'integer', [
            'default' => 0,
            'null' => false,
        ]);
        $table->addColumn('reach', 'integer', [
            'default' => 0,
            'null' => false,
        ]);
        $table->addColumn('clicks', 'integer', [
            'default' => 0,
            'null' => false,
        ]);
        $table->addColumn('engagement_rate', 'decimal', [
            'precision' => 5,
            'scale' => 2,
            'default' => 0.00,
            'null' => false,
        ]);
        $table->addColumn('platform_data', 'json', [
            'default' => null,
            'null' => true, // Store platform-specific metrics
        ]);
        $table->addColumn('recorded_at', 'timestamp', [
            'null' => false,
        ]);
        $table->addColumn('created_at', 'timestamp', [
            'default' => 'CURRENT_TIMESTAMP',
            'null' => false,
        ]);

        // Add foreign keys
        $table->addForeignKey('post_platform_id', 'post_platforms', 'id', ['delete' => 'CASCADE']);

        // Add indexes
        $table->addIndex(['post_platform_id'], ['name' => 'idx_post_platform_id']);
        $table->addIndex(['platform'], ['name' => 'idx_platform']);
        $table->addIndex(['recorded_at'], ['name' => 'idx_recorded_at']);
        $table->addIndex(['post_platform_id', 'recorded_at'], ['name' => 'idx_post_platform_recorded']);

        $table->create();
    }
}
