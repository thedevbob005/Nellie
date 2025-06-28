<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * MediaFilesFixture
 */
class MediaFilesFixture extends TestFixture
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
                'filename' => 'Lorem ipsum dolor sit amet',
                'original_filename' => 'Lorem ipsum dolor sit amet',
                'file_path' => 'Lorem ipsum dolor sit amet',
                'file_type' => 'Lorem ipsum dolor sit amet',
                'file_size' => 1,
                'mime_type' => 'Lorem ipsum dolor sit amet',
                'media_type' => 'Lorem ipsum dolor sit amet',
                'dimensions' => 'Lorem ipsum dolor ',
                'created_at' => 1751087892,
                'updated_at' => 1751087892,
            ],
        ];
        parent::init();
    }
}
