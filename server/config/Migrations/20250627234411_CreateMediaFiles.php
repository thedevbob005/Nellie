<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class CreateMediaFiles extends BaseMigration
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
        $table = $this->table('media_files');
        $table->addColumn('post_id', 'integer', [
            'null' => false,
        ]);
        $table->addColumn('filename', 'string', [
            'null' => false,
            'limit' => 255,
        ]);
        $table->addColumn('original_filename', 'string', [
            'null' => false,
            'limit' => 255,
        ]);
        $table->addColumn('file_path', 'string', [
            'null' => false,
            'limit' => 500,
        ]);
        $table->addColumn('file_type', 'string', [
            'null' => false,
            'limit' => 50,
        ]);
        $table->addColumn('file_size', 'integer', [
            'null' => false,
        ]);
        $table->addColumn('mime_type', 'string', [
            'null' => false,
            'limit' => 100,
        ]);
        $table->addColumn('media_type', 'string', [
            'null' => false,
            'limit' => 50, // image, video, document
        ]);
        $table->addColumn('dimensions', 'string', [
            'default' => null,
            'limit' => 20, // WIDTHxHEIGHT for images/videos
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

        // Add indexes
        $table->addIndex(['post_id'], ['name' => 'idx_post_id']);
        $table->addIndex(['file_type'], ['name' => 'idx_file_type']);
        $table->addIndex(['media_type'], ['name' => 'idx_media_type']);

        $table->create();
    }
}
