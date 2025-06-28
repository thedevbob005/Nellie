<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class CreateClients extends BaseMigration
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
        $table = $this->table('clients');
        $table->addColumn('organization_id', 'integer', [
            'default' => null,
            'limit' => 11,
            'null' => false,
        ]);
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
        $table->addColumn('phone', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => false,
        ]);
        $table->addColumn('website', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => false,
        ]);
        $table->addColumn('description', 'text', [
            'default' => null,
            'null' => false,
        ]);
        $table->addColumn('logo_path', 'string', [
            'default' => null,
            'limit' => 255,
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
            'phone',
        
            ], [
            'name' => 'BY_PHONE',
            'unique' => false,
        ]);
        $table->addIndex([
            'logo_path',
        
            ], [
            'name' => 'BY_LOGO_PATH',
            'unique' => false,
        ]);
        $table->create();
    }
}
