<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * Post Entity
 *
 * @property int $id
 * @property int $client_id
 * @property int $created_by
 * @property string|null $title
 * @property string $content
 * @property array|null $platform_specific_data
 * @property string $status
 * @property \Cake\I18n\DateTime|null $scheduled_at
 * @property \Cake\I18n\DateTime|null $published_at
 * @property \Cake\I18n\DateTime $created_at
 * @property \Cake\I18n\DateTime $updated_at
 * @property bool $is_recurring
 * @property string|null $recurring_pattern
 *
 * @property \App\Model\Entity\Client $client
 * @property \App\Model\Entity\MediaFile[] $media_files
 * @property \App\Model\Entity\PostApproval[] $post_approvals
 * @property \App\Model\Entity\PostPlatform[] $post_platforms
 */
class Post extends Entity
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
        'client_id' => true,
        'created_by' => true,
        'title' => true,
        'content' => true,
        'platform_specific_data' => true,
        'status' => true,
        'scheduled_at' => true,
        'published_at' => true,
        'created_at' => true,
        'updated_at' => true,
        'is_recurring' => true,
        'recurring_pattern' => true,
        'client' => true,
        'media_files' => true,
        'post_approvals' => true,
        'post_platforms' => true,
    ];
}
