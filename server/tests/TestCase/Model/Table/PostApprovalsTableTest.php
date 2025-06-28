<?php
declare(strict_types=1);

namespace App\Test\TestCase\Model\Table;

use App\Model\Table\PostApprovalsTable;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\PostApprovalsTable Test Case
 */
class PostApprovalsTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\PostApprovalsTable
     */
    protected $PostApprovals;

    /**
     * Fixtures
     *
     * @var list<string>
     */
    protected array $fixtures = [
        'app.PostApprovals',
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
        $config = $this->getTableLocator()->exists('PostApprovals') ? [] : ['className' => PostApprovalsTable::class];
        $this->PostApprovals = $this->getTableLocator()->get('PostApprovals', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    protected function tearDown(): void
    {
        unset($this->PostApprovals);

        parent::tearDown();
    }
}
