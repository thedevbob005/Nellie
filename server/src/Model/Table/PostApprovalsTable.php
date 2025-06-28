<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query\SelectQuery;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * PostApprovals Model
 *
 * @property \App\Model\Table\PostsTable&\Cake\ORM\Association\BelongsTo $Posts
 *
 * @method \App\Model\Entity\PostApproval newEmptyEntity()
 * @method \App\Model\Entity\PostApproval newEntity(array $data, array $options = [])
 * @method array<\App\Model\Entity\PostApproval> newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\PostApproval get(mixed $primaryKey, array|string $finder = 'all', \Psr\SimpleCache\CacheInterface|string|null $cache = null, \Closure|string|null $cacheKey = null, mixed ...$args)
 * @method \App\Model\Entity\PostApproval findOrCreate($search, ?callable $callback = null, array $options = [])
 * @method \App\Model\Entity\PostApproval patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method array<\App\Model\Entity\PostApproval> patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\PostApproval|false save(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method \App\Model\Entity\PostApproval saveOrFail(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method iterable<\App\Model\Entity\PostApproval>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\PostApproval>|false saveMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\PostApproval>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\PostApproval> saveManyOrFail(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\PostApproval>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\PostApproval>|false deleteMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\PostApproval>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\PostApproval> deleteManyOrFail(iterable $entities, array $options = [])
 */
class PostApprovalsTable extends Table
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

        $this->setTable('post_approvals');
        $this->setDisplayField('status');
        $this->setPrimaryKey('id');

        $this->belongsTo('Posts', [
            'foreignKey' => 'post_id',
            'joinType' => 'INNER',
        ]);
    }
}
