<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * PostApproval Entity
 *
 * @property int $id
 * @property int $post_id
 * @property int $approved_by
 * @property string $status
 * @property string|null $feedback
 * @property \Cake\I18n\DateTime|null $approved_at
 * @property \Cake\I18n\DateTime $created_at
 * @property \Cake\I18n\DateTime $updated_at
 *
 * @property \App\Model\Entity\Post $post
 */
class PostApproval extends Entity
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
        'approved_by' => true,
        'status' => true,
        'feedback' => true,
        'approved_at' => true,
        'created_at' => true,
        'updated_at' => true,
        'post' => true,
    ];
}
