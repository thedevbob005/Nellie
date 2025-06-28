<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * PostPlatformsFixture
 */
class PostPlatformsFixture extends TestFixture
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
                'post_id' => 1,
                'social_account_id' => 1,
                'platform' => 'Lorem ipsum dolor sit amet',
                'platform_post_id' => 'Lorem ipsum dolor sit amet',
                'published_at' => 1751087881,
                'status' => 'Lorem ipsum dolor sit amet',
                'error_message' => 'Lorem ipsum dolor sit amet, aliquet feugiat. Convallis morbi fringilla gravida, phasellus feugiat dapibus velit nunc, pulvinar eget sollicitudin venenatis cum nullam, vivamus ut a sed, mollitia lectus. Nulla vestibulum massa neque ut et, id hendrerit sit, feugiat in taciti enim proin nibh, tempor dignissim, rhoncus duis vestibulum nunc mattis convallis.',
                'created_at' => 1751087881,
                'updated_at' => 1751087881,
            ],
        ];
        parent::init();
    }
}
