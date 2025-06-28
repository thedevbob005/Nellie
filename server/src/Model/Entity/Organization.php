<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * Organization Entity
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $timezone
 * @property \Cake\I18n\DateTime $created_at
 * @property \Cake\I18n\DateTime $updated_at
 * @property bool $is_active
 *
 * @property \App\Model\Entity\Client[] $clients
 * @property \App\Model\Entity\User[] $users
 */
class Organization extends Entity
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
        'name' => true,
        'email' => true,
        'timezone' => true,
        'created_at' => true,
        'updated_at' => true,
        'is_active' => true,
        'clients' => true,
        'users' => true,
    ];
}
