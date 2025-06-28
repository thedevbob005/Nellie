<?php
declare(strict_types=1);

namespace App\Test\TestCase\Model\Table;

use App\Model\Table\PostPlatformsTable;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\PostPlatformsTable Test Case
 */
class PostPlatformsTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\PostPlatformsTable
     */
    protected $PostPlatforms;

    /**
     * Fixtures
     *
     * @var list<string>
     */
    protected array $fixtures = [
        'app.PostPlatforms',
        'app.Posts',
        'app.SocialAccounts',
        'app.Analytics',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();
        $config = $this->getTableLocator()->exists('PostPlatforms') ? [] : ['className' => PostPlatformsTable::class];
        $this->PostPlatforms = $this->getTableLocator()->get('PostPlatforms', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    protected function tearDown(): void
    {
        unset($this->PostPlatforms);

        parent::tearDown();
    }
}
