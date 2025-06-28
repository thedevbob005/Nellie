<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query\SelectQuery;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * PostPlatforms Model
 *
 * @property \App\Model\Table\PostsTable&\Cake\ORM\Association\BelongsTo $Posts
 * @property \App\Model\Table\SocialAccountsTable&\Cake\ORM\Association\BelongsTo $SocialAccounts
 * @property \App\Model\Table\AnalyticsTable&\Cake\ORM\Association\HasMany $Analytics
 *
 * @method \App\Model\Entity\PostPlatform newEmptyEntity()
 * @method \App\Model\Entity\PostPlatform newEntity(array $data, array $options = [])
 * @method array<\App\Model\Entity\PostPlatform> newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\PostPlatform get(mixed $primaryKey, array|string $finder = 'all', \Psr\SimpleCache\CacheInterface|string|null $cache = null, \Closure|string|null $cacheKey = null, mixed ...$args)
 * @method \App\Model\Entity\PostPlatform findOrCreate($search, ?callable $callback = null, array $options = [])
 * @method \App\Model\Entity\PostPlatform patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method array<\App\Model\Entity\PostPlatform> patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\PostPlatform|false save(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method \App\Model\Entity\PostPlatform saveOrFail(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method iterable<\App\Model\Entity\PostPlatform>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\PostPlatform>|false saveMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\PostPlatform>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\PostPlatform> saveManyOrFail(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\PostPlatform>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\PostPlatform>|false deleteMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\PostPlatform>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\PostPlatform> deleteManyOrFail(iterable $entities, array $options = [])
 */
class PostPlatformsTable extends Table
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

        $this->setTable('post_platforms');
        $this->setDisplayField('platform');
        $this->setPrimaryKey('id');

        $this->belongsTo('Posts', [
            'foreignKey' => 'post_id',
            'joinType' => 'INNER',
        ]);
        $this->belongsTo('SocialAccounts', [
            'foreignKey' => 'social_account_id',
            'joinType' => 'INNER',
        ]);
        $this->hasMany('Analytics', [
            'foreignKey' => 'post_platform_id',
        ]);
    }
}
