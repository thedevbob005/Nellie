<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class CreatePosts extends BaseMigration
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
        $table = $this->table('posts');
        $table->addColumn('client_id', 'integer', [
            'null' => false,
        ]);
        $table->addColumn('created_by', 'integer', [
            'null' => false,
        ]);
        $table->addColumn('title', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => true,
        ]);
        $table->addColumn('content', 'text', [
            'null' => false,
        ]);
        $table->addColumn('platform_specific_data', 'json', [
            'default' => null,
            'null' => true,
        ]);
        $table->addColumn('status', 'string', [
            'default' => 'draft',
            'limit' => 50,
            'null' => false,
        ]);
        $table->addColumn('scheduled_at', 'timestamp', [
            'default' => null,
            'null' => true,
        ]);
        $table->addColumn('published_at', 'timestamp', [
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
        $table->addColumn('is_recurring', 'boolean', [
            'default' => false,
            'null' => false,
        ]);
        $table->addColumn('recurring_pattern', 'string', [
            'default' => null,
            'limit' => 100,
            'null' => true,
        ]);

        // Add foreign keys
        $table->addForeignKey('client_id', 'clients', 'id', ['delete' => 'CASCADE']);
        $table->addForeignKey('created_by', 'users', 'id', ['delete' => 'RESTRICT']);

        // Add indexes
        $table->addIndex(['client_id', 'status'], ['name' => 'idx_client_status']);
        $table->addIndex(['scheduled_at'], ['name' => 'idx_scheduled_at']);
        $table->addIndex(['created_by'], ['name' => 'idx_created_by']);
        $table->addIndex(['status', 'scheduled_at'], ['name' => 'idx_status_scheduled']);

        $table->create();
    }
}
