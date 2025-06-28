<?php
declare(strict_types=1);

namespace App\Controller;

use Cake\Http\Response;
use Cake\Validation\Validator;

/**
 * Clients Controller
 *
 * Handles CRUD operations for social media clients
 * Accessible by both managers and designers (with different permissions)
 */
class ClientsController extends AppController
{
    /**
     * Initialize method
     *
     * @return void
     */
    public function initialize(): void
    {
        parent::initialize();
    }

    /**
     * Get all clients for the organization
     *
     * @return \Cake\Http\Response
     */
    public function index(): Response
    {
        $this->request->allowMethod('get');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $clientsTable = $this->fetchTable('Clients');

        $query = $clientsTable->find()
            ->where(['organization_id' => $currentUser->organization_id, 'is_active' => true])
            ->contain(['SocialAccounts' => function ($q) {
                return $q->select(['id', 'client_id', 'platform', 'account_name', 'is_active'])
                    ->where(['is_active' => true]);
            }])
            ->order(['created_at' => 'DESC']);

        // Add pagination
        $page = (int)$this->request->getQuery('page', 1);
        $limit = min((int)$this->request->getQuery('limit', 20), 50); // Max 50 per page

        $clients = $query->limit($limit)->offset(($page - 1) * $limit)->toArray();
        $total = $query->count();

        $clientData = [];
        foreach ($clients as $client) {
            $socialAccountsCount = [];
            foreach ($client->social_accounts as $account) {
                $platform = $account->platform;
                $socialAccountsCount[$platform] = ($socialAccountsCount[$platform] ?? 0) + 1;
            }

            $clientData[] = [
                'id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'website' => $client->website,
                'description' => $client->description,
                'logo_path' => $client->logo_path,
                'created_at' => $client->created_at,
                'updated_at' => $client->updated_at,
                'social_accounts_count' => count($client->social_accounts),
                'platforms' => array_keys($socialAccountsCount),
                'social_accounts' => $client->social_accounts,
            ];
        }

        $response = [
            'clients' => $clientData,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit),
            ],
        ];

        return $this->apiSuccess($response, 'Clients retrieved successfully');
    }

    /**
     * Get a specific client
     *
     * @param int $id Client ID
     * @return \Cake\Http\Response
     */
    public function view(int $id): Response
    {
        $this->request->allowMethod('get');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $clientsTable = $this->fetchTable('Clients');

        try {
            $client = $clientsTable->get($id, [
                'conditions' => [
                    'organization_id' => $currentUser->organization_id,
                    'is_active' => true
                ],
                'contain' => [
                    'SocialAccounts' => function ($q) {
                        return $q->where(['is_active' => true])
                            ->order(['platform' => 'ASC']);
                    },
                    'Posts' => function ($q) {
                        return $q->select(['id', 'client_id', 'title', 'status', 'scheduled_at', 'created_at'])
                            ->where(['Posts.created_at >=' => date('Y-m-d', strtotime('-30 days'))])
                            ->order(['created_at' => 'DESC'])
                            ->limit(10);
                    }
                ]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Client not found', 404);
        }

        // Calculate client statistics
        $postsTable = $this->fetchTable('Posts');
        $stats = [
            'total_posts' => $postsTable->find()
                ->where(['client_id' => $id])
                ->count(),
            'published_posts' => $postsTable->find()
                ->where(['client_id' => $id, 'status' => 'published'])
                ->count(),
            'scheduled_posts' => $postsTable->find()
                ->where(['client_id' => $id, 'status' => 'scheduled'])
                ->count(),
            'pending_approval' => $postsTable->find()
                ->where(['client_id' => $id, 'status' => 'pending_approval'])
                ->count(),
        ];

        $clientData = [
            'id' => $client->id,
            'name' => $client->name,
            'email' => $client->email,
            'phone' => $client->phone,
            'website' => $client->website,
            'description' => $client->description,
            'logo_path' => $client->logo_path,
            'created_at' => $client->created_at,
            'updated_at' => $client->updated_at,
            'social_accounts' => $client->social_accounts,
            'recent_posts' => $client->posts,
            'statistics' => $stats,
        ];

        return $this->apiSuccess($clientData, 'Client retrieved successfully');
    }

    /**
     * Create a new client
     *
     * @return \Cake\Http\Response
     */
    public function add(): Response
    {
        $this->request->allowMethod('post');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        // Only managers can create clients
        if (!$this->requireManager()) {
            return $this->response;
        }

        $clientsTable = $this->fetchTable('Clients');
        $data = $this->request->getData();

        // Validate required fields
        $validator = new Validator();
        $validator
            ->requirePresence('name', 'create')
            ->notEmptyString('name', 'Client name is required')
            ->maxLength('name', 255)
            ->add('email', 'valid', [
                'rule' => 'email',
                'message' => 'Please enter a valid email address',
                'allowEmpty' => true
            ])
            ->maxLength('email', 255)
            ->maxLength('phone', 20)
            ->add('website', 'valid', [
                'rule' => 'url',
                'message' => 'Please enter a valid website URL',
                'allowEmpty' => true
            ])
            ->maxLength('website', 255)
            ->maxLength('description', 1000);

        $errors = $validator->validate($data);
        if (!empty($errors)) {
            return $this->apiError('Validation failed', 400, $errors);
        }

        // Check organization client limit
        $clientCount = $clientsTable->find()
            ->where(['organization_id' => $currentUser->organization_id, 'is_active' => true])
            ->count();

        $maxClients = 16; // From config
        if ($clientCount >= $maxClients) {
            return $this->apiError("Maximum client limit reached. You can have up to {$maxClients} clients.", 400);
        }

        // Add organization_id and default values
        $data['organization_id'] = $currentUser->organization_id;
        $data['is_active'] = true;

        // Handle logo upload if provided
        if (!empty($data['logo'])) {
            $logoPath = $this->handleLogoUpload($data['logo']);
            if ($logoPath) {
                $data['logo_path'] = $logoPath;
            }
            unset($data['logo']);
        }

        $client = $clientsTable->newEntity($data);

        if ($clientsTable->save($client)) {
            $clientData = [
                'id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'website' => $client->website,
                'description' => $client->description,
                'logo_path' => $client->logo_path,
                'created_at' => $client->created_at,
                'social_accounts' => [],
            ];

            return $this->apiSuccess($clientData, 'Client created successfully', 201);
        }

        return $this->apiError('Failed to create client', 400, $client->getErrors());
    }

    /**
     * Update a client
     *
     * @param int $id Client ID
     * @return \Cake\Http\Response
     */
    public function edit(int $id): Response
    {
        $this->request->allowMethod(['put', 'patch']);

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        // Only managers can edit clients
        if (!$this->requireManager()) {
            return $this->response;
        }

        $clientsTable = $this->fetchTable('Clients');

        try {
            $client = $clientsTable->get($id, [
                'conditions' => [
                    'organization_id' => $currentUser->organization_id,
                    'is_active' => true
                ]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Client not found', 404);
        }

        $data = $this->request->getData();

        // Validate fields
        $validator = new Validator();
        $validator
            ->notEmptyString('name', 'Client name is required')
            ->maxLength('name', 255)
            ->add('email', 'valid', [
                'rule' => 'email',
                'message' => 'Please enter a valid email address',
                'allowEmpty' => true
            ])
            ->maxLength('email', 255)
            ->maxLength('phone', 20)
            ->add('website', 'valid', [
                'rule' => 'url',
                'message' => 'Please enter a valid website URL',
                'allowEmpty' => true
            ])
            ->maxLength('website', 255)
            ->maxLength('description', 1000);

        $errors = $validator->validate($data);
        if (!empty($errors)) {
            return $this->apiError('Validation failed', 400, $errors);
        }

        // Handle logo upload if provided
        if (!empty($data['logo'])) {
            $logoPath = $this->handleLogoUpload($data['logo']);
            if ($logoPath) {
                // Delete old logo if exists
                if ($client->logo_path) {
                    $this->deleteFile($client->logo_path);
                }
                $data['logo_path'] = $logoPath;
            }
            unset($data['logo']);
        }

        $client = $clientsTable->patchEntity($client, $data);

        if ($clientsTable->save($client)) {
            $clientData = [
                'id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'website' => $client->website,
                'description' => $client->description,
                'logo_path' => $client->logo_path,
                'updated_at' => $client->updated_at,
            ];

            return $this->apiSuccess($clientData, 'Client updated successfully');
        }

        return $this->apiError('Failed to update client', 400, $client->getErrors());
    }

    /**
     * Delete a client (soft delete)
     *
     * @param int $id Client ID
     * @return \Cake\Http\Response
     */
    public function delete(int $id): Response
    {
        $this->request->allowMethod('delete');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        // Only managers can delete clients
        if (!$this->requireManager()) {
            return $this->response;
        }

        $clientsTable = $this->fetchTable('Clients');

        try {
            $client = $clientsTable->get($id, [
                'conditions' => [
                    'organization_id' => $currentUser->organization_id,
                    'is_active' => true
                ]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Client not found', 404);
        }

        // Check if client has active posts
        $postsTable = $this->fetchTable('Posts');
        $activePosts = $postsTable->find()
            ->where([
                'client_id' => $id,
                'status IN' => ['pending_approval', 'approved', 'scheduled']
            ])
            ->count();

        if ($activePosts > 0) {
            return $this->apiError(
                'Cannot delete client with active posts. Please complete or cancel all pending and scheduled posts first.',
                400
            );
        }

        // Soft delete by setting is_active = false
        $client->is_active = false;

        if ($clientsTable->save($client)) {
            // Also deactivate social accounts
            $socialAccountsTable = $this->fetchTable('SocialAccounts');
            $socialAccountsTable->updateAll(
                ['is_active' => false],
                ['client_id' => $id]
            );

            return $this->apiSuccess(null, 'Client deleted successfully');
        }

        return $this->apiError('Failed to delete client', 400);
    }

    /**
     * Get client statistics and analytics
     *
     * @param int $id Client ID
     * @return \Cake\Http\Response
     */
    public function stats(int $id): Response
    {
        $this->request->allowMethod('get');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $clientsTable = $this->fetchTable('Clients');

        try {
            $client = $clientsTable->get($id, [
                'conditions' => [
                    'organization_id' => $currentUser->organization_id,
                    'is_active' => true
                ]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Client not found', 404);
        }

        $postsTable = $this->fetchTable('Posts');
        $analyticsTable = $this->fetchTable('Analytics');

        // Get date range
        $startDate = $this->request->getQuery('start_date', date('Y-m-d', strtotime('-30 days')));
        $endDate = $this->request->getQuery('end_date', date('Y-m-d'));

        // Post statistics
        $postStats = [
            'total' => $postsTable->find()->where(['client_id' => $id])->count(),
            'published' => $postsTable->find()->where(['client_id' => $id, 'status' => 'published'])->count(),
            'scheduled' => $postsTable->find()->where(['client_id' => $id, 'status' => 'scheduled'])->count(),
            'pending' => $postsTable->find()->where(['client_id' => $id, 'status' => 'pending_approval'])->count(),
            'draft' => $postsTable->find()->where(['client_id' => $id, 'status' => 'draft'])->count(),
        ];

        // Recent activity
        $recentPosts = $postsTable->find()
            ->where([
                'client_id' => $id,
                'created_at >=' => $startDate,
                'created_at <=' => $endDate . ' 23:59:59'
            ])
            ->select(['id', 'title', 'status', 'scheduled_at', 'published_at', 'created_at'])
            ->order(['created_at' => 'DESC'])
            ->limit(10)
            ->toArray();

        // Platform breakdown
        $socialAccountsTable = $this->fetchTable('SocialAccounts');
        $platforms = $socialAccountsTable->find()
            ->where(['client_id' => $id, 'is_active' => true])
            ->select(['platform'])
            ->distinct(['platform'])
            ->toArray();

        $stats = [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
            ],
            'posts' => $postStats,
            'recent_activity' => $recentPosts,
            'platforms' => array_map(function ($p) {
                return $p->platform;
            }, $platforms),
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
        ];

        return $this->apiSuccess($stats, 'Client statistics retrieved successfully');
    }

    /**
     * Handle logo file upload
     *
     * @param array $file Uploaded file data
     * @return string|null File path or null if failed
     */
    private function handleLogoUpload($file): ?string
    {
        if (empty($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return null;
        }

        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            return null;
        }

        // Validate file size (max 2MB)
        if ($file['size'] > 2 * 1024 * 1024) {
            return null;
        }

        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'client_logo_' . uniqid() . '.' . $extension;

        // Create upload directory if it doesn't exist
        $uploadDir = WWW_ROOT . 'uploads' . DS . 'client_logos' . DS;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $targetPath = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            return 'uploads/client_logos/' . $filename;
        }

        return null;
    }

    /**
     * Delete a file from the server
     *
     * @param string $filePath File path relative to webroot
     * @return bool
     */
    private function deleteFile(string $filePath): bool
    {
        $fullPath = WWW_ROOT . $filePath;
        if (file_exists($fullPath)) {
            return unlink($fullPath);
        }
        return false;
    }
}
