<?php
declare(strict_types=1);

namespace App\Controller;

use Cake\Http\Exception\BadRequestException;
use Cake\Http\Exception\NotFoundException;
use Cake\ORM\TableRegistry;
use Cake\Log\Log;

/**
 * SocialAccounts Controller
 *
 * Handles social media account connections, OAuth flows, and account management
 *
 * @property \App\Model\Table\SocialAccountsTable $SocialAccounts
 */
class SocialAccountsController extends AppController
{
    public function initialize(): void
    {
        parent::initialize();
    }

    /**
     * Index method - List social accounts for a client
     *
     * @return \Cake\Http\Response|null|void Renders view
     */
    public function index()
    {
        $clientId = $this->request->getQuery('client_id');
        $organizationId = $this->getCurrentUser()['organization_id'];

        $socialAccountsTable = $this->fetchTable('SocialAccounts');

        $query = $socialAccountsTable->find()
            ->contain(['Clients'])
            ->where(['Clients.organization_id' => $organizationId]);

        if ($clientId) {
            $query->where(['SocialAccounts.client_id' => $clientId]);
        }

        $socialAccounts = $query->all();

        return $this->apiSuccess([
            'social_accounts' => $socialAccounts,
            'total' => $socialAccounts->count()
        ]);
    }

    /**
     * View method - Get details of a specific social account
     *
     * @param string|null $id Social Account id.
     * @return \Cake\Http\Response|null|void Renders view
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $organizationId = $this->getCurrentUser()['organization_id'];
        $socialAccountsTable = $this->fetchTable('SocialAccounts');

        $socialAccount = $socialAccountsTable->get($id, [
            'contain' => ['Clients'],
            'conditions' => ['Clients.organization_id' => $organizationId]
        ]);

        return $this->apiSuccess(['social_account' => $socialAccount]);
    }

    /**
     * Add method - Create new social account connection
     *
     * @return \Cake\Http\Response|null|void Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $data = $this->request->getData();
        $organizationId = $this->getCurrentUser()['organization_id'];

        $clientsTable = $this->fetchTable('Clients');
        $socialAccountsTable = $this->fetchTable('SocialAccounts');

        // Validate client belongs to organization
        $client = $clientsTable->get($data['client_id']);
        if ($client->organization_id !== $organizationId) {
            throw new BadRequestException('Invalid client');
        }

        // Check if account already exists
        $existing = $socialAccountsTable->find()
            ->where([
                'client_id' => $data['client_id'],
                'platform' => $data['platform'],
                'account_id' => $data['account_id']
            ])
            ->first();

        if ($existing) {
            return $this->apiError('Social account already exists for this client', 400);
        }

        $socialAccount = $socialAccountsTable->newEntity($data, [
            'fields' => [
                'client_id', 'platform', 'account_id', 'account_name',
                'access_token', 'refresh_token', 'token_expires_at', 'account_data'
            ]
        ]);

        if ($socialAccountsTable->save($socialAccount)) {
            $socialAccount = $socialAccountsTable->get($socialAccount->id, [
                'contain' => ['Clients']
            ]);
            return $this->apiSuccess([
                'social_account' => $socialAccount,
                'message' => 'Social account connected successfully'
            ]);
        }

        return $this->apiError('Failed to connect social account', 400, $socialAccount->getErrors());
    }

    /**
     * Edit method - Update social account details
     *
     * @param string|null $id Social Account id.
     * @return \Cake\Http\Response|null|void Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $organizationId = $this->getCurrentUser()['organization_id'];
        $data = $this->request->getData();
        $socialAccountsTable = $this->fetchTable('SocialAccounts');

        $socialAccount = $socialAccountsTable->get($id, [
            'contain' => ['Clients'],
            'conditions' => ['Clients.organization_id' => $organizationId]
        ]);

        $socialAccount = $socialAccountsTable->patchEntity($socialAccount, $data, [
            'fields' => [
                'account_name', 'access_token', 'refresh_token',
                'token_expires_at', 'account_data', 'is_active'
            ]
        ]);

        if ($socialAccountsTable->save($socialAccount)) {
            return $this->apiSuccess([
                'social_account' => $socialAccount,
                'message' => 'Social account updated successfully'
            ]);
        }

        return $this->apiError('Failed to update social account', 400, $socialAccount->getErrors());
    }

    /**
     * Delete method - Remove social account connection
     *
     * @param string|null $id Social Account id.
     * @return \Cake\Http\Response|null|void Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $organizationId = $this->getCurrentUser()['organization_id'];
        $socialAccountsTable = $this->fetchTable('SocialAccounts');

        $socialAccount = $socialAccountsTable->get($id, [
            'contain' => ['Clients'],
            'conditions' => ['Clients.organization_id' => $organizationId]
        ]);

        if ($socialAccountsTable->delete($socialAccount)) {
            return $this->apiSuccess(['message' => 'Social account disconnected successfully']);
        }

        return $this->apiError('Failed to disconnect social account', 400);
    }

    /**
     * OAuth initialization - Start OAuth flow for a platform
     *
     * @return \Cake\Http\Response|null|void
     */
    public function oauthInit()
    {
        $data = $this->request->getData();
        $platform = $data['platform'] ?? null;
        $clientId = $data['client_id'] ?? null;

        if (!$platform || !$clientId) {
            return $this->apiError('Platform and client_id are required', 400);
        }

        $organizationId = $this->getCurrentUser()['organization_id'];
        $clientsTable = $this->fetchTable('Clients');

        // Validate client belongs to organization
        $client = $clientsTable->get($clientId);
        if ($client->organization_id !== $organizationId) {
            throw new BadRequestException('Invalid client');
        }

        try {
            $socialMediaService = $this->getSocialMediaService($platform);
            $authUrl = $socialMediaService->getAuthorizationUrl($clientId);

            return $this->apiSuccess([
                'auth_url' => $authUrl,
                'platform' => $platform,
                'client_id' => $clientId
            ]);
        } catch (\Exception $e) {
            Log::error('OAuth initialization failed: ' . $e->getMessage());
            return $this->apiError('Failed to initialize OAuth', 500);
        }
    }

    /**
     * OAuth callback - Handle OAuth callback from social media platforms
     *
     * @return \Cake\Http\Response|null|void
     */
    public function oauthCallback()
    {
        $platform = $this->request->getQuery('platform');
        $clientId = $this->request->getQuery('client_id');
        $code = $this->request->getQuery('code');
        $state = $this->request->getQuery('state');

        if (!$platform || !$clientId || !$code) {
            return $this->apiError('Missing required parameters', 400);
        }

        $organizationId = $this->getCurrentUser()['organization_id'];
        $socialAccountsTable = $this->fetchTable('SocialAccounts');

        try {
            $socialMediaService = $this->getSocialMediaService($platform);
            $accountData = $socialMediaService->handleCallback($code, $state, $clientId);

            // Check if account already exists
            $existing = $socialAccountsTable->find()
                ->where([
                    'client_id' => $clientId,
                    'platform' => $platform,
                    'account_id' => $accountData['account_id']
                ])
                ->first();

            if ($existing) {
                // Update existing account
                $socialAccount = $socialAccountsTable->patchEntity($existing, [
                    'access_token' => $accountData['access_token'],
                    'refresh_token' => $accountData['refresh_token'] ?? null,
                    'token_expires_at' => $accountData['expires_at'] ?? null,
                    'account_data' => $accountData['account_data'] ?? null,
                    'is_active' => true
                ]);
            } else {
                // Create new account
                $socialAccount = $socialAccountsTable->newEntity([
                    'client_id' => $clientId,
                    'platform' => $platform,
                    'account_id' => $accountData['account_id'],
                    'account_name' => $accountData['account_name'],
                    'access_token' => $accountData['access_token'],
                    'refresh_token' => $accountData['refresh_token'] ?? null,
                    'token_expires_at' => $accountData['expires_at'] ?? null,
                    'account_data' => $accountData['account_data'] ?? null,
                    'is_active' => true
                ]);
            }

            if ($socialAccountsTable->save($socialAccount)) {
                return $this->apiSuccess([
                    'social_account' => $socialAccount,
                    'message' => 'Social account connected successfully'
                ]);
            }

            return $this->apiError('Failed to save social account', 400);
        } catch (\Exception $e) {
            Log::error('OAuth callback failed: ' . $e->getMessage());
            return $this->apiError('Failed to connect social account', 500);
        }
    }

    /**
     * Refresh token for a social account
     *
     * @param string|null $id Social Account id.
     * @return \Cake\Http\Response|null|void
     */
    public function refreshToken($id = null)
    {
        $organizationId = $this->getCurrentUser()['organization_id'];
        $socialAccountsTable = $this->fetchTable('SocialAccounts');

        $socialAccount = $socialAccountsTable->get($id, [
            'contain' => ['Clients'],
            'conditions' => ['Clients.organization_id' => $organizationId]
        ]);

        if (!$socialAccount->refresh_token) {
            return $this->apiError('No refresh token available', 400);
        }

        try {
            $socialMediaService = $this->getSocialMediaService($socialAccount->platform);
            $newTokenData = $socialMediaService->refreshAccessToken($socialAccount->refresh_token);

            $socialAccount = $socialAccountsTable->patchEntity($socialAccount, [
                'access_token' => $newTokenData['access_token'],
                'token_expires_at' => $newTokenData['expires_at'] ?? null,
                'refresh_token' => $newTokenData['refresh_token'] ?? $socialAccount->refresh_token
            ]);

            if ($socialAccountsTable->save($socialAccount)) {
                return $this->apiSuccess([
                    'social_account' => $socialAccount,
                    'message' => 'Token refreshed successfully'
                ]);
            }

            return $this->apiError('Failed to save refreshed token', 400);
        } catch (\Exception $e) {
            Log::error('Token refresh failed: ' . $e->getMessage());
            return $this->apiError('Failed to refresh token', 500);
        }
    }

    /**
     * Test connection to a social media account
     *
     * @param string|null $id Social Account id.
     * @return \Cake\Http\Response|null|void
     */
    public function testConnection($id = null)
    {
        $organizationId = $this->getCurrentUser()['organization_id'];
        $socialAccountsTable = $this->fetchTable('SocialAccounts');

        $socialAccount = $socialAccountsTable->get($id, [
            'contain' => ['Clients'],
            'conditions' => ['Clients.organization_id' => $organizationId]
        ]);

        try {
            $socialMediaService = $this->getSocialMediaService($socialAccount->platform);
            $isValid = $socialMediaService->testConnection($socialAccount->access_token);

            return $this->apiSuccess([
                'is_valid' => $isValid,
                'platform' => $socialAccount->platform,
                'account_name' => $socialAccount->account_name,
                'message' => $isValid ? 'Connection is valid' : 'Connection failed'
            ]);
        } catch (\Exception $e) {
            Log::error('Connection test failed: ' . $e->getMessage());
            return $this->apiError('Failed to test connection', 500);
        }
    }

    /**
     * Get social media service instance for a platform
     *
     * @param string $platform Platform name
     * @return mixed Service instance
     * @throws \Exception When platform is not supported
     */
    private function getSocialMediaService(string $platform)
    {
        $services = [
            'facebook' => '\App\Service\FacebookService',
            'instagram' => '\App\Service\InstagramService',
            'twitter' => '\App\Service\TwitterService',
            'youtube' => '\App\Service\YouTubeService',
            'threads' => '\App\Service\ThreadsService',
            'linkedin' => '\App\Service\LinkedInService'
        ];

        if (!isset($services[$platform])) {
            throw new \Exception("Unsupported platform: {$platform}");
        }

        $serviceClass = $services[$platform];
        return new $serviceClass();
    }
}
