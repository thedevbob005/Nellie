<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * MediaFile Entity
 *
 * @property int $id
 * @property int $post_id
 * @property string $filename
 * @property string $original_filename
 * @property string $file_path
 * @property string $file_type
 * @property int $file_size
 * @property string $mime_type
 * @property string $media_type
 * @property string|null $dimensions
 * @property \Cake\I18n\DateTime $created_at
 * @property \Cake\I18n\DateTime $updated_at
 *
 * @property \App\Model\Entity\Post $post
 */
class MediaFile extends Entity
{
    /**
     * Fields that can be mass assigned using newEntity() or patchEntity().
     *
     * Note that when '*' is set to true, this allows all unspecified fields to
     * be mass assigned. For security purposes, it is advised to set '*' to false
     * (or remove it), and explicitly make individual fields accessible as needed.
     *
     * @var array<string, bool>
     */
    protected array $_accessible = [
        'post_id' => true,
        'filename' => true,
        'original_filename' => true,
        'file_path' => true,
        'file_type' => true,
        'file_size' => true,
        'mime_type' => true,
        'media_type' => true,
        'dimensions' => true,
        'created_at' => true,
        'updated_at' => true,
        'post' => true,
    ];
}
