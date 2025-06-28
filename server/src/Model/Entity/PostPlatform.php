<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * PostPlatform Entity
 *
 * @property int $id
 * @property int $post_id
 * @property int $social_account_id
 * @property string $platform
 * @property string|null $platform_post_id
 * @property \Cake\I18n\DateTime|null $published_at
 * @property string $status
 * @property string|null $error_message
 * @property \Cake\I18n\DateTime $created_at
 * @property \Cake\I18n\DateTime $updated_at
 *
 * @property \App\Model\Entity\Post $post
 * @property \App\Model\Entity\SocialAccount $social_account
 * @property \App\Model\Entity\Analytic[] $analytics
 */
class PostPlatform extends Entity
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
        'social_account_id' => true,
        'platform' => true,
        'platform_post_id' => true,
        'published_at' => true,
        'status' => true,
        'error_message' => true,
        'created_at' => true,
        'updated_at' => true,
        'post' => true,
        'social_account' => true,
        'analytics' => true,
    ];
}
