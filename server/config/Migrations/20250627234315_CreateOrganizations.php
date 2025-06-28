<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class CreateOrganizations extends BaseMigration
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
        $table = $this->table('organizations');
        $table->addColumn('name', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => false,
        ]);
        $table->addColumn('email', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => false,
        ]);
        $table->addColumn('timezone', 'string', [
            'default' => 'Asia/Kolkata',
            'limit' => 50,
            'null' => false,
        ]);
        $table->addColumn('created_at', 'timestamp', [
            'default' => 'CURRENT_TIMESTAMP',
            'null' => false,
        ]);
        $table->addColumn('updated_at', 'timestamp', [
            'default' => 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'null' => false,
        ]);
        $table->addColumn('is_active', 'boolean', [
            'default' => true,
            'null' => false,
        ]);

        // Add indexes
        $table->addIndex(['email'], ['unique' => true, 'name' => 'idx_email']);
        $table->addIndex(['created_at'], ['name' => 'idx_created_at']);

        $table->create();
    }
}
