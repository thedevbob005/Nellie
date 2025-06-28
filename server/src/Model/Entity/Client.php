<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * Client Entity
 *
 * @property int $id
 * @property int $organization_id
 * @property string $name
 * @property string $email
 * @property string $phone
 * @property string $website
 * @property string $description
 * @property string $logo_path
 * @property \Cake\I18n\DateTime $created
 * @property \Cake\I18n\DateTime $updated
 * @property bool $is_active
 *
 * @property \App\Model\Entity\Organization $organization
 * @property \App\Model\Entity\Post[] $posts
 * @property \App\Model\Entity\SocialAccount[] $social_accounts
 */
class Client extends Entity
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
        'organization_id' => true,
        'name' => true,
        'email' => true,
        'phone' => true,
        'website' => true,
        'description' => true,
        'logo_path' => true,
        'created' => true,
        'updated' => true,
        'is_active' => true,
        'organization' => true,
        'posts' => true,
        'social_accounts' => true,
    ];
}
