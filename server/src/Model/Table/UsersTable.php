<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query\SelectQuery;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * Users Model
 *
 * @property \App\Model\Table\OrganizationsTable&\Cake\ORM\Association\BelongsTo $Organizations
 * @property \App\Model\Table\SystemLogsTable&\Cake\ORM\Association\HasMany $SystemLogs
 *
 * @method \App\Model\Entity\User newEmptyEntity()
 * @method \App\Model\Entity\User newEntity(array $data, array $options = [])
 * @method array<\App\Model\Entity\User> newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\User get(mixed $primaryKey, array|string $finder = 'all', \Psr\SimpleCache\CacheInterface|string|null $cache = null, \Closure|string|null $cacheKey = null, mixed ...$args)
 * @method \App\Model\Entity\User findOrCreate($search, ?callable $callback = null, array $options = [])
 * @method \App\Model\Entity\User patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method array<\App\Model\Entity\User> patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\User|false save(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method \App\Model\Entity\User saveOrFail(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method iterable<\App\Model\Entity\User>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\User>|false saveMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\User>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\User> saveManyOrFail(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\User>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\User>|false deleteMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\User>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\User> deleteManyOrFail(iterable $entities, array $options = [])
 *
 * @mixin \Cake\ORM\Behavior\TimestampBehavior
 */
class UsersTable extends Table
{
    /**
     * Initialize method
     *
     * @param array<string, mixed> $config The configuration for the Table.
     * @return void
     */
    public function initialize(array $config): void
    {
        parent::initialize($config);

        $this->setTable('users');
        $this->setDisplayField('email');
        $this->setPrimaryKey('id');

        $this->addBehavior('Timestamp', [
            'events' => [
                'Model.beforeSave' => [
                    'created_at' => 'new',
                    'updated_at' => 'always'
                ]
            ]
        ]);

        $this->belongsTo('Organizations', [
            'foreignKey' => 'organization_id',
            'joinType' => 'INNER',
        ]);
        $this->hasMany('SystemLogs', [
            'foreignKey' => 'user_id',
        ]);
        $this->hasMany('Posts', [
            'foreignKey' => 'created_by',
        ]);
        $this->hasMany('PostApprovals', [
            'foreignKey' => 'approved_by',
        ]);
    }

    /**
     * Default validation rules.
     *
     * @param \Cake\Validation\Validator $validator Validator instance.
     * @return \Cake\Validation\Validator
     */
    public function validationDefault(Validator $validator): Validator
    {
        $validator
            ->integer('organization_id')
            ->notEmptyString('organization_id')
            ->add('organization_id', 'valid', ['rule' => 'numeric']);

        $validator
            ->email('email')
            ->requirePresence('email', 'create')
            ->notEmptyString('email')
            ->maxLength('email', 255);

        $validator
            ->scalar('password')
            ->minLength('password', 8, 'Password must be at least 8 characters long')
            ->requirePresence('password', 'create')
            ->notEmptyString('password')
            ->add('password', 'complexity', [
                'rule' => function ($value) {
                    // Password must contain at least one uppercase, one lowercase, one number
                    return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/', $value);
                },
                'message' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            ]);

        $validator
            ->scalar('first_name')
            ->maxLength('first_name', 100)
            ->requirePresence('first_name', 'create')
            ->notEmptyString('first_name');

        $validator
            ->scalar('last_name')
            ->maxLength('last_name', 100)
            ->requirePresence('last_name', 'create')
            ->notEmptyString('last_name');

        $validator
            ->scalar('role')
            ->requirePresence('role', 'create')
            ->notEmptyString('role')
            ->inList('role', ['manager', 'designer'], 'Role must be either manager or designer');

        $validator
            ->dateTime('last_login')
            ->allowEmptyDateTime('last_login');

        $validator
            ->boolean('is_active')
            ->notEmptyString('is_active');

        return $validator;
    }

    /**
     * Password validation rules for password changes.
     *
     * @param \Cake\Validation\Validator $validator Validator instance.
     * @return \Cake\Validation\Validator
     */
    public function validationPasswordChange(Validator $validator): Validator
    {
        $validator = $this->validationDefault($validator);

        $validator
            ->remove('first_name')
            ->remove('last_name')
            ->remove('email')
            ->remove('role')
            ->remove('organization_id');

        return $validator;
    }

    /**
     * Returns a rules checker object that will be used for validating
     * application integrity.
     *
     * @param \Cake\ORM\RulesChecker $rules The rules object to be modified.
     * @return \Cake\ORM\RulesChecker
     */
    public function buildRules(RulesChecker $rules): RulesChecker
    {
        $rules->add($rules->isUnique(['email']), ['errorField' => 'email']);
        $rules->add($rules->existsIn(['organization_id'], 'Organizations'), ['errorField' => 'organization_id']);

        return $rules;
    }

    /**
     * Find user by email for authentication
     *
     * @param \Cake\ORM\Query\SelectQuery $query
     * @param array $options
     * @return \Cake\ORM\Query\SelectQuery
     */
    public function findAuth(SelectQuery $query, array $options): SelectQuery
    {
        return $query
            ->select(['id', 'email', 'password_hash', 'first_name', 'last_name', 'role', 'organization_id', 'is_active'])
            ->where(['is_active' => true])
            ->contain(['Organizations' => function ($q) {
                return $q->select(['id', 'name', 'is_active'])
                    ->where(['is_active' => true]);
            }]);
    }

    /**
     * Find active users for an organization
     *
     * @param \Cake\ORM\Query\SelectQuery $query
     * @param array $options
     * @return \Cake\ORM\Query\SelectQuery
     */
    public function findByOrganization(SelectQuery $query, array $options): SelectQuery
    {
        return $query
            ->where([
                'organization_id' => $options['organization_id'],
                'is_active' => true
            ])
            ->order(['created_at' => 'DESC']);
    }

    /**
     * Update user's last login timestamp
     *
     * @param int $userId
     * @return int Number of affected rows
     */
    public function updateLastLogin(int $userId): int
    {
        return $this->updateAll(
            ['last_login' => new \DateTime()],
            ['id' => $userId]
        );
    }
}
