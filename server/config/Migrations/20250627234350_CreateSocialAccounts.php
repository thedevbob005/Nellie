<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class CreateSocialAccounts extends BaseMigration
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
        $table = $this->table('social_accounts');
        $table->addColumn('client_id', 'integer', [
            'default' => null,
            'limit' => 11,
            'null' => false,
        ]);
        $table->addColumn('platform', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => false,
        ]);
        $table->addColumn('account_id', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => false,
        ]);
        $table->addColumn('account_name', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => false,
        ]);
        $table->addColumn('access_token', 'text', [
            'default' => null,
            'null' => false,
        ]);
        $table->addColumn('refresh_token', 'text', [
            'default' => null,
            'null' => false,
        ]);
        $table->addColumn('token_expires_at', 'datetime', [
            'default' => null,
            'null' => false,
        ]);
        $table->addColumn('account_data', 'json', [
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
            'client_id',
        
            ], [
            'name' => 'BY_CLIENT_ID',
            'unique' => false,
        ]);
        $table->create();
    }
}
