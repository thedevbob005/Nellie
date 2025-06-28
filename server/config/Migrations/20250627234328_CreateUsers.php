<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class CreateUsers extends BaseMigration
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
        $table = $this->table('users');
        $table->addColumn('organization_id', 'integer', [
            'default' => null,
            'limit' => 11,
            'null' => false,
        ]);
        $table->addColumn('email', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => false,
        ]);
        $table->addColumn('password_hash', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => false,
        ]);
        $table->addColumn('first_name', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => false,
        ]);
        $table->addColumn('last_name', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => false,
        ]);
        $table->addColumn('role', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => false,
        ]);
        $table->addColumn('last_login', 'datetime', [
            'default' => null,
            'null' => false,
        ]);
        $table->addColumn('created', 'datetime', [
            'default' => null,
            'null' => false,
        ]);
        $table->addColumn('updated', 'datetime', [
            'default' => null,
            'null' => false,
        ]);
        $table->addColumn('is_active', 'boolean', [
            'default' => null,
            'null' => false,
        ]);
        $table->addIndex([
            'organization_id',
        
            ], [
            'name' => 'BY_ORGANIZATION_ID',
            'unique' => false,
        ]);
        $table->addIndex([
            'first_name',
        
            ], [
            'name' => 'BY_FIRST_NAME',
            'unique' => false,
        ]);
        $table->addIndex([
            'last_name',
        
            ], [
            'name' => 'BY_LAST_NAME',
            'unique' => false,
        ]);
        $table->create();
    }
}
