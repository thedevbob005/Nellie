<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * UsersFixture
 */
class UsersFixture extends TestFixture
{
    /**
     * Init method
     *
     * @return void
     */
    public function init(): void
    {
        $this->records = [
            [
                'id' => 1,
                'organization_id' => 1,
                'email' => 'Lorem ipsum dolor sit amet',
                'password_hash' => 'Lorem ipsum dolor sit amet',
                'first_name' => 'Lorem ipsum dolor sit amet',
                'last_name' => 'Lorem ipsum dolor sit amet',
                'role' => 'Lorem ipsum dolor sit amet',
                'last_login' => '2025-06-28 01:43:20',
                'created' => '2025-06-28 01:43:20',
                'updated' => '2025-06-28 01:43:20',
                'is_active' => 1,
            ],
        ];
        parent::init();
    }
}
