<?php
declare(strict_types=1);

namespace App\Test\TestCase\Model\Table;

use App\Model\Table\MediaFilesTable;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\MediaFilesTable Test Case
 */
class MediaFilesTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\MediaFilesTable
     */
    protected $MediaFiles;

    /**
     * Fixtures
     *
     * @var list<string>
     */
    protected array $fixtures = [
        'app.MediaFiles',
        'app.Posts',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();
        $config = $this->getTableLocator()->exists('MediaFiles') ? [] : ['className' => MediaFilesTable::class];
        $this->MediaFiles = $this->getTableLocator()->get('MediaFiles', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    protected function tearDown(): void
    {
        unset($this->MediaFiles);

        parent::tearDown();
    }
}
