<?php
declare(strict_types=1);

namespace App\Test\TestCase\Controller;

use App\Controller\PostsController;
use Cake\TestSuite\IntegrationTestTrait;
use Cake\TestSuite\TestCase;

/**
 * App\Controller\PostsController Test Case
 *
 * @uses \App\Controller\PostsController
 */
class PostsControllerTest extends TestCase
{
    use IntegrationTestTrait;

    /**
     * Fixtures
     *
     * @var list<string>
     */
    protected array $fixtures = [
        'app.Posts',
        'app.Clients',
        'app.Users',
        'app.MediaFiles',
        'app.PostApprovals',
        'app.PostPlatforms',
    ];
}
