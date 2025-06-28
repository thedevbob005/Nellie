<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Authentication\PasswordHasher\DefaultPasswordHasher;
use Cake\ORM\Entity;

/**
 * User Entity
 *
 * @property int $id
 * @property int $organization_id
 * @property string $email
 * @property string $password_hash
 * @property string $first_name
 * @property string $last_name
 * @property string $role
 * @property \Cake\I18n\DateTime|null $last_login
 * @property \Cake\I18n\DateTime $created
 * @property \Cake\I18n\DateTime $updated
 * @property bool $is_active
 *
 * @property \App\Model\Entity\Organization $organization
 * @property \App\Model\Entity\SystemLog[] $system_logs
 */
class User extends Entity
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
        'email' => true,
        'password' => true,
        'first_name' => true,
        'last_name' => true,
        'role' => true,
        'last_login' => true,
        'is_active' => true,
        'organization' => true,
        'system_logs' => true,
    ];

    /**
     * Fields that are excluded from JSON versions of the entity.
     *
     * @var array<string>
     */
    protected array $_hidden = [
        'password_hash',
        'password',
    ];

    /**
     * Automatically hash the password when it is changed.
     *
     * @param string $password The password to hash
     * @return string|null
     */
    protected function _setPassword(string $password): ?string
    {
        if (strlen($password) > 0) {
            $hasher = new DefaultPasswordHasher();
            return $hasher->hash($password);
        }

        return null;
    }

    /**
     * Get the user's full name
     *
     * @return string
     */
    protected function _getFullName(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    /**
     * Check if user is a manager
     *
     * @return bool
     */
    public function isManager(): bool
    {
        return $this->role === 'manager';
    }

    /**
     * Check if user is a designer
     *
     * @return bool
     */
    public function isDesigner(): bool
    {
        return $this->role === 'designer';
    }

    /**
     * Check if user can manage organizations
     *
     * @return bool
     */
    public function canManageOrganization(): bool
    {
        return $this->isManager();
    }

    /**
     * Check if user can approve posts
     *
     * @return bool
     */
    public function canApprovePosts(): bool
    {
        return $this->isManager();
    }

    /**
     * Verify a password against the stored hash
     *
     * @param string $password The password to verify
     * @return bool
     */
    public function checkPassword(string $password): bool
    {
        $hasher = new DefaultPasswordHasher();
        return $hasher->check($password, $this->password_hash);
    }
}
