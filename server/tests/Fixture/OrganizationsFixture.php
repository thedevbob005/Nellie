<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * OrganizationsFixture
 */
class OrganizationsFixture extends TestFixture
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
                'name' => 'Lorem ipsum dolor sit amet',
                'email' => 'Lorem ipsum dolor sit amet',
                'timezone' => 'Lorem ipsum dolor sit amet',
                'created_at' => 1751074998,
                'updated_at' => 1751074998,
                'is_active' => 1,
            ],
        ];
        parent::init();
    }
}
