<?php
declare(strict_types=1);

/**
 * CakePHP(tm) : Rapid Development Framework (https://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 * @link      https://cakephp.org CakePHP(tm) Project
 * @since     0.2.9
 * @license   https://opensource.org/licenses/mit-license.php MIT License
 */
namespace App\Controller;

use Authentication\AuthenticationService;
use Authentication\AuthenticationServiceInterface;
use Authentication\AuthenticationServiceProviderInterface;
use Authentication\Middleware\AuthenticationMiddleware;
use Cake\Controller\Controller;
use Cake\Event\EventInterface;
use Cake\Http\Response;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Application Controller
 *
 * Add your application-wide methods in the class below, your controllers
 * will inherit them.
 *
 * @link https://book.cakephp.org/5/en/controllers.html#the-app-controller
 */
class AppController extends Controller implements AuthenticationServiceProviderInterface
{
    /**
     * Initialization hook method.
     *
     * Use this method to add common initialization code like loading components.
     *
     * e.g. `$this->loadComponent('FormProtection');`
     *
     * @return void
     */
    public function initialize(): void
    {
        parent::initialize();

        $this->loadComponent('Flash');
        $this->loadComponent('Authentication.Authentication');

        // Enable CORS for API
        $this->response = $this->response->withHeader('Access-Control-Allow-Origin', '*')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->withHeader('Content-Type', 'application/json');
    }

    /**
     * Before filter callback.
     *
     * @param \Cake\Event\EventInterface $event The beforeFilter event.
     * @return \Cake\Http\Response|null|void
     */
    public function beforeFilter(EventInterface $event)
    {
        parent::beforeFilter($event);

        // Handle preflight OPTIONS requests
        if ($this->request->is('options')) {
            return $this->response;
        }

        // Set authentication configuration
        $this->Authentication->setConfig('unauthenticatedRedirect', false);
        $this->Authentication->allowUnauthenticated(['login', 'register']);
    }

    /**
     * Returns a service provider instance.
     *
     * @param \Psr\Http\Message\ServerRequestInterface $request Request
     * @return \Authentication\AuthenticationServiceInterface
     */
    public function getAuthenticationService(ServerRequestInterface $request): AuthenticationServiceInterface
    {
        $authenticationService = new AuthenticationService([
            'unauthenticatedRedirect' => '/api/auth/unauthorized',
            'queryParam' => 'redirect',
        ]);

        // Load identifiers, ensure we check email and password fields
        $authenticationService->loadIdentifier('Authentication.Password', [
            'fields' => [
                'username' => 'email',
                'password' => 'password_hash',
            ],
            'finder' => 'auth',
        ]);

        // Load the authenticators, you want session first
        $authenticationService->loadAuthenticator('Authentication.Session');
        // Configure form data authenticator to pick email and password
        $authenticationService->loadAuthenticator('Authentication.Form', [
            'fields' => [
                'username' => 'email',
                'password' => 'password',
            ],
            'loginUrl' => '/api/auth/login',
        ]);

        // Load JWT authenticator for API access
        $authenticationService->loadAuthenticator('Authentication.Jwt', [
            'returnPayload' => false,
        ]);

        return $authenticationService;
    }

    /**
     * Standard API success response
     *
     * @param mixed $data Response data
     * @param string $message Success message
     * @param int $status HTTP status code
     * @return \Cake\Http\Response
     */
    protected function apiSuccess($data = null, string $message = 'Success', int $status = 200): Response
    {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        return $this->response
            ->withType('application/json')
            ->withStringBody(json_encode($response))
            ->withStatus($status);
    }

    /**
     * Standard API error response
     *
     * @param string $message Error message
     * @param int $status HTTP status code
     * @param mixed $errors Detailed error information
     * @return \Cake\Http\Response
     */
    protected function apiError(string $message = 'An error occurred', int $status = 400, $errors = null): Response
    {
        $response = [
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ];

        return $this->response
            ->withType('application/json')
            ->withStringBody(json_encode($response))
            ->withStatus($status);
    }

    /**
     * Get the current authenticated user
     *
     * @return \App\Model\Entity\User|null
     */
    protected function getCurrentUser()
    {
        return $this->Authentication->getIdentity();
    }

    /**
     * Check if user has required role
     *
     * @param string $requiredRole
     * @return bool
     */
    protected function hasRole(string $requiredRole): bool
    {
        $user = $this->getCurrentUser();
        return $user && $user->role === $requiredRole;
    }

    /**
     * Require manager role
     *
     * @return bool
     */
    protected function requireManager(): bool
    {
        if (!$this->hasRole('manager')) {
            $this->apiError('Access denied. Manager role required.', 403);
            return false;
        }
        return true;
    }
}
