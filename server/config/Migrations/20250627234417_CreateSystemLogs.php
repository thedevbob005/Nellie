<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class CreateSystemLogs extends BaseMigration
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
        $table = $this->table('system_logs');
        $table->addColumn('user_id', 'integer', [
            'default' => null,
            'null' => true,
        ]);
        $table->addColumn('action', 'string', [
            'null' => false,
            'limit' => 100,
        ]);
        $table->addColumn('entity_type', 'string', [
            'null' => false,
            'limit' => 50, // posts, clients, users, etc.
        ]);
        $table->addColumn('entity_id', 'integer', [
            'default' => null,
            'null' => true,
        ]);
        $table->addColumn('description', 'text', [
            'null' => false,
        ]);
        $table->addColumn('ip_address', 'string', [
            'default' => null,
            'limit' => 45, // IPv6 support
            'null' => true,
        ]);
        $table->addColumn('user_agent', 'text', [
            'default' => null,
            'null' => true,
        ]);
        $table->addColumn('data', 'json', [
            'default' => null,
            'null' => true, // Additional data for the action
        ]);
        $table->addColumn('created_at', 'timestamp', [
            'default' => 'CURRENT_TIMESTAMP',
            'null' => false,
        ]);

        // Add foreign keys
        $table->addForeignKey('user_id', 'users', 'id', ['delete' => 'SET_NULL']);

        // Add indexes
        $table->addIndex(['user_id'], ['name' => 'idx_user_id']);
        $table->addIndex(['action'], ['name' => 'idx_action']);
        $table->addIndex(['entity_type'], ['name' => 'idx_entity_type']);
        $table->addIndex(['entity_id'], ['name' => 'idx_entity_id']);
        $table->addIndex(['created_at'], ['name' => 'idx_created_at']);
        $table->addIndex(['entity_type', 'entity_id'], ['name' => 'idx_entity_type_id']);

        $table->create();
    }
}
