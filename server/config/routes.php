<?php
/**
 * Routes configuration.
 *
 * In this file, you set up routes to your controllers and their actions.
 * Routes are very important mechanism that allows you to freely connect
 * different URLs to chosen controllers and their actions (functions).
 *
 * It's loaded within the context of `Application::routes()` method which
 * receives a `RouteBuilder` instance `$routes` as method argument.
 *
 * CakePHP(tm) : Rapid Development Framework (https://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 * @link          https://cakephp.org CakePHP(tm) Project
 * @license       https://opensource.org/licenses/mit-license.php MIT License
 */

use Cake\Routing\Route\DashedRoute;
use Cake\Routing\RouteBuilder;

/*
 * This file is loaded in the context of the `Application` class.
 * So you can use `$this` to reference the application class instance
 * if required.
 */
return function (RouteBuilder $routes): void {
    /*
     * The default class to use for all routes
     *
     * The following route classes are supplied with CakePHP and are appropriate
     * to set as the default:
     *
     * - Route
     * - InflectedRoute
     * - DashedRoute
     *
     * If no call is made to `Router::defaultRouteClass()`, the class used is
     * `Route` (`Cake\Routing\Route\Route`)
     *
     * Note that `Route` does not do any inflections on URLs which will result in
     * inconsistently cased URLs when used with `{plugin}`, `{controller}` and
     * `{action}` markers.
     */
    $routes->setRouteClass(DashedRoute::class);

    $routes->scope('/', function (RouteBuilder $builder): void {
        /*
         * Here, we are connecting '/' (base path) to a controller called 'Pages',
         * its action called 'display', and we pass a param to select the view file
         * to use (in this case, templates/Pages/home.php)...
         */
        $builder->connect('/', ['controller' => 'Pages', 'action' => 'display', 'home']);

        /*
         * ...and connect the rest of 'Pages' controller's URLs.
         */
        $builder->connect('/pages/*', 'Pages::display');

        /*
         * Connect catchall routes for all controllers.
         *
         * The `fallbacks` method is a shortcut for
         *
         * ```
         * $builder->connect('/{controller}', ['action' => 'index']);
         * $builder->connect('/{controller}/{action}/*', []);
         * ```
         *
         * It is NOT recommended to use fallback routes after your initial prototyping phase!
         * See https://book.cakephp.org/5/en/development/routing.html#fallbacks-method for more information
         */
        $builder->fallbacks();
    });

    /*
     * API Routes
     * RESTful API endpoints for the Nellie social media management system
     */
    $routes->scope('/api', function (RouteBuilder $builder): void {
        // Parse JSON and XML extensions
        $builder->setExtensions(['json', 'xml']);

        // Authentication routes
        $builder->scope('/auth', function (RouteBuilder $builder): void {
            $builder->post('/login', ['controller' => 'Auth', 'action' => 'login']);
            $builder->post('/register', ['controller' => 'Auth', 'action' => 'register']);
            $builder->post('/logout', ['controller' => 'Auth', 'action' => 'logout']);
            $builder->post('/refresh', ['controller' => 'Auth', 'action' => 'refresh']);
            $builder->get('/me', ['controller' => 'Auth', 'action' => 'me']);
            $builder->post('/forgot-password', ['controller' => 'Auth', 'action' => 'forgotPassword']);
            $builder->post('/reset-password', ['controller' => 'Auth', 'action' => 'resetPassword']);
            $builder->get('/profile', ['controller' => 'Auth', 'action' => 'profile']);
            $builder->put('/profile', ['controller' => 'Auth', 'action' => 'updateProfile']);
            $builder->patch('/profile', ['controller' => 'Auth', 'action' => 'updateProfile']);
            $builder->put('/change-password', ['controller' => 'Auth', 'action' => 'changePassword']);
            $builder->patch('/change-password', ['controller' => 'Auth', 'action' => 'changePassword']);
            $builder->get('/unauthorized', ['controller' => 'Auth', 'action' => 'unauthorized']);
        });

        // User management routes (managers only)
        $builder->scope('/users', function (RouteBuilder $builder): void {
            $builder->get('/', ['controller' => 'Users', 'action' => 'index']);
            $builder->get('/{id}', ['controller' => 'Users', 'action' => 'view'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->post('/', ['controller' => 'Users', 'action' => 'add']);
            $builder->put('/{id}', ['controller' => 'Users', 'action' => 'edit'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->patch('/{id}', ['controller' => 'Users', 'action' => 'edit'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->delete('/{id}', ['controller' => 'Users', 'action' => 'delete'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->post('/{id}/reset-password', ['controller' => 'Users', 'action' => 'resetPassword'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
        });

        // Client management routes
        $builder->scope('/clients', function (RouteBuilder $builder): void {
            $builder->get('/', ['controller' => 'Clients', 'action' => 'index']);
            $builder->get('/{id}', ['controller' => 'Clients', 'action' => 'view'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->post('/', ['controller' => 'Clients', 'action' => 'add']);
            $builder->put('/{id}', ['controller' => 'Clients', 'action' => 'edit'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->patch('/{id}', ['controller' => 'Clients', 'action' => 'edit'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->delete('/{id}', ['controller' => 'Clients', 'action' => 'delete'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->get('/{id}/stats', ['controller' => 'Clients', 'action' => 'stats'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
        });

        // Social media account routes
        $builder->scope('/social-accounts', function (RouteBuilder $builder): void {
            $builder->get('/', ['controller' => 'SocialAccounts', 'action' => 'index']);
            $builder->get('/{id}', ['controller' => 'SocialAccounts', 'action' => 'view'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->post('/', ['controller' => 'SocialAccounts', 'action' => 'add']);
            $builder->put('/{id}', ['controller' => 'SocialAccounts', 'action' => 'edit'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->delete('/{id}', ['controller' => 'SocialAccounts', 'action' => 'delete'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->post('/{id}/refresh-token', ['controller' => 'SocialAccounts', 'action' => 'refreshToken'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->get('/{id}/test-connection', ['controller' => 'SocialAccounts', 'action' => 'testConnection'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
        });

        // OAuth routes for social media platforms
        $builder->scope('/oauth', function (RouteBuilder $builder): void {
            $builder->post('/init', ['controller' => 'SocialAccounts', 'action' => 'oauthInit']);
            $builder->get('/callback', ['controller' => 'SocialAccounts', 'action' => 'oauthCallback']);
        });

        // Post management routes
        $builder->scope('/posts', function (RouteBuilder $builder): void {
            $builder->get('/', ['controller' => 'Posts', 'action' => 'index']);
            $builder->get('/{id}', ['controller' => 'Posts', 'action' => 'view'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->post('/', ['controller' => 'Posts', 'action' => 'add']);
            $builder->put('/{id}', ['controller' => 'Posts', 'action' => 'edit'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->patch('/{id}', ['controller' => 'Posts', 'action' => 'edit'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->delete('/{id}', ['controller' => 'Posts', 'action' => 'delete'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->post('/{id}/submit', ['controller' => 'Posts', 'action' => 'submit'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->post('/{id}/approve', ['controller' => 'Posts', 'action' => 'approve'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->post('/{id}/reject', ['controller' => 'Posts', 'action' => 'reject'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);

            // Publishing integration routes
            $builder->post('/{id}/publish', ['controller' => 'Posts', 'action' => 'publish'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->post('/{id}/schedule', ['controller' => 'Posts', 'action' => 'schedule'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->get('/queue', ['controller' => 'Posts', 'action' => 'queue']);
            $builder->post('/process-queue', ['controller' => 'Posts', 'action' => 'processQueue']);
            $builder->post('/optimize-content', ['controller' => 'Posts', 'action' => 'optimizeContent']);
            $builder->get('/best-times', ['controller' => 'Posts', 'action' => 'getBestTimes']);
        });

        // Analytics routes
        $builder->scope('/analytics', function (RouteBuilder $builder): void {
            $builder->get('/dashboard', ['controller' => 'Analytics', 'action' => 'dashboard']);
            $builder->get('/client/{id}', ['controller' => 'Analytics', 'action' => 'client'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->get('/platform', ['controller' => 'Analytics', 'action' => 'platform']);
            $builder->post('/sync', ['controller' => 'Analytics', 'action' => 'sync']);
            $builder->get('/realtime', ['controller' => 'Analytics', 'action' => 'realtime']);
            $builder->post('/export', ['controller' => 'Analytics', 'action' => 'export']);
        });

        // Dashboard and analytics routes
        $builder->scope('/dashboard', function (RouteBuilder $builder): void {
            $builder->get('/', ['controller' => 'Dashboard', 'action' => 'index']);
            $builder->get('/stats', ['controller' => 'Dashboard', 'action' => 'stats']);
            $builder->get('/recent-posts', ['controller' => 'Dashboard', 'action' => 'recentPosts']);
            $builder->get('/pending-approvals', ['controller' => 'Dashboard', 'action' => 'pendingApprovals']);
        });

        // Media management routes
        $builder->scope('/media', function (RouteBuilder $builder): void {
            $builder->get('/', ['controller' => 'Media', 'action' => 'index']);
            $builder->get('/{id}', ['controller' => 'Media', 'action' => 'view'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->post('/upload', ['controller' => 'Media', 'action' => 'upload']);
            $builder->delete('/{id}', ['controller' => 'Media', 'action' => 'delete'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
        });

        // Analytics routes
        $builder->scope('/analytics', function (RouteBuilder $builder): void {
            $builder->get('/', ['controller' => 'Analytics', 'action' => 'index']);
            $builder->get('/posts/{id}', ['controller' => 'Analytics', 'action' => 'postAnalytics'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->get('/clients/{id}', ['controller' => 'Analytics', 'action' => 'clientAnalytics'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
        });

        // Calendar routes
        $builder->scope('/calendar', function (RouteBuilder $builder): void {
            $builder->get('/', ['controller' => 'Calendar', 'action' => 'index']);
            $builder->get('/posts', ['controller' => 'Calendar', 'action' => 'posts']);
            $builder->put('/posts/{id}/reschedule', ['controller' => 'Calendar', 'action' => 'reschedule'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
        });

        // Media file upload routes
        $builder->scope('/media', function (RouteBuilder $builder): void {
            $builder->post('/upload', ['controller' => 'Media', 'action' => 'upload']);
            $builder->get('/{id}', ['controller' => 'Media', 'action' => 'view'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
            $builder->delete('/{id}', ['controller' => 'Media', 'action' => 'delete'])
                ->setPatterns(['id' => '\d+'])
                ->setPass(['id']);
        });
    });
};
