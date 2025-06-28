<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query\SelectQuery;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * MediaFiles Model
 *
 * @property \App\Model\Table\PostsTable&\Cake\ORM\Association\BelongsTo $Posts
 *
 * @method \App\Model\Entity\MediaFile newEmptyEntity()
 * @method \App\Model\Entity\MediaFile newEntity(array $data, array $options = [])
 * @method array<\App\Model\Entity\MediaFile> newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\MediaFile get(mixed $primaryKey, array|string $finder = 'all', \Psr\SimpleCache\CacheInterface|string|null $cache = null, \Closure|string|null $cacheKey = null, mixed ...$args)
 * @method \App\Model\Entity\MediaFile findOrCreate($search, ?callable $callback = null, array $options = [])
 * @method \App\Model\Entity\MediaFile patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method array<\App\Model\Entity\MediaFile> patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\MediaFile|false save(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method \App\Model\Entity\MediaFile saveOrFail(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method iterable<\App\Model\Entity\MediaFile>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\MediaFile>|false saveMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\MediaFile>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\MediaFile> saveManyOrFail(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\MediaFile>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\MediaFile>|false deleteMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\MediaFile>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\MediaFile> deleteManyOrFail(iterable $entities, array $options = [])
 */
class MediaFilesTable extends Table
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

        $this->setTable('media_files');
        $this->setDisplayField('filename');
        $this->setPrimaryKey('id');

        $this->belongsTo('Posts', [
            'foreignKey' => 'post_id',
            'joinType' => 'INNER',
        ]);
    }
}
