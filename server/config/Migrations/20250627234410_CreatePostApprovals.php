<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class CreatePostApprovals extends BaseMigration
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
        $table = $this->table('post_approvals');
        $table->addColumn('post_id', 'integer', [
            'null' => false,
        ]);
        $table->addColumn('approved_by', 'integer', [
            'null' => false,
        ]);
        $table->addColumn('status', 'string', [
            'null' => false,
            'limit' => 50,
        ]);
        $table->addColumn('feedback', 'text', [
            'default' => null,
            'null' => true,
        ]);
        $table->addColumn('approved_at', 'timestamp', [
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
        $table->addForeignKey('approved_by', 'users', 'id', ['delete' => 'RESTRICT']);

        // Add indexes
        $table->addIndex(['post_id'], ['name' => 'idx_post_id']);
        $table->addIndex(['approved_by'], ['name' => 'idx_approved_by']);
        $table->addIndex(['status'], ['name' => 'idx_status']);
        $table->addIndex(['approved_at'], ['name' => 'idx_approved_at']);

        $table->create();
    }
}
