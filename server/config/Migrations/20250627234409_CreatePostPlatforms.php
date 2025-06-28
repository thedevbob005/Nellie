<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class CreatePostPlatforms extends BaseMigration
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
        $table = $this->table('post_platforms');
        $table->addColumn('post_id', 'integer', [
            'null' => false,
        ]);
        $table->addColumn('social_account_id', 'integer', [
            'null' => false,
        ]);
        $table->addColumn('platform', 'string', [
            'null' => false,
            'limit' => 50,
        ]);
        $table->addColumn('platform_post_id', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => true,
        ]);
        $table->addColumn('published_at', 'timestamp', [
            'default' => null,
            'null' => true,
        ]);
        $table->addColumn('status', 'string', [
            'default' => 'pending',
            'limit' => 50,
            'null' => false,
        ]);
        $table->addColumn('error_message', 'text', [
            'default' => null,
            'null' => true,
        ]);
        $table->addColumn('created_at', 'timestamp', [
            'default' => 'CURRENT_TIMESTAMP',
            'null' => false,
        ]);
        $table->addColumn('updated_at', 'timestamp', [
            'default' => 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'null' => false,
        ]);

        // Add foreign keys
        $table->addForeignKey('post_id', 'posts', 'id', ['delete' => 'CASCADE']);
        $table->addForeignKey('social_account_id', 'social_accounts', 'id', ['delete' => 'CASCADE']);

        // Add indexes
        $table->addIndex(['post_id'], ['name' => 'idx_post_id']);
        $table->addIndex(['social_account_id'], ['name' => 'idx_social_account_id']);
        $table->addIndex(['platform'], ['name' => 'idx_platform']);
        $table->addIndex(['status'], ['name' => 'idx_status']);

        $table->create();
    }
}
