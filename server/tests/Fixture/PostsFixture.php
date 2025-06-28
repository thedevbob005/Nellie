<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * PostsFixture
 */
class PostsFixture extends TestFixture
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
                'client_id' => 1,
                'created_by' => 1,
                'title' => 'Lorem ipsum dolor sit amet',
                'content' => 'Lorem ipsum dolor sit amet, aliquet feugiat. Convallis morbi fringilla gravida, phasellus feugiat dapibus velit nunc, pulvinar eget sollicitudin venenatis cum nullam, vivamus ut a sed, mollitia lectus. Nulla vestibulum massa neque ut et, id hendrerit sit, feugiat in taciti enim proin nibh, tempor dignissim, rhoncus duis vestibulum nunc mattis convallis.',
                'platform_specific_data' => '',
                'status' => 'Lorem ipsum dolor sit amet',
                'scheduled_at' => 1751087783,
                'published_at' => 1751087783,
                'created_at' => 1751087783,
                'updated_at' => 1751087783,
                'is_recurring' => 1,
                'recurring_pattern' => 'Lorem ipsum dolor sit amet',
            ],
        ];
        parent::init();
    }
}
