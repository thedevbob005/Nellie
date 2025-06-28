<?php
declare(strict_types=1);

namespace App\Controller;

use Cake\Http\Response;
use Cake\Validation\Validator;
use Cake\I18n\DateTime;
use Cake\Core\Configure;

/**
 * Posts Controller
 *
 * Handles CRUD operations for social media posts with approval workflow
 * Supports content creation, scheduling, and publishing automation
 */
class PostsController extends AppController
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
     * Get all posts with filtering options
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

        $postsTable = $this->fetchTable('Posts');

        // Build query with conditions
        $conditions = ['Posts.client_id IN' => $this->getUserClientIds($currentUser)];

        // Filter by status
        $status = $this->request->getQuery('status');
        if ($status) {
            $conditions['Posts.status'] = $status;
        }

        // Filter by client
        $clientId = $this->request->getQuery('client_id');
        if ($clientId) {
            $conditions['Posts.client_id'] = $clientId;
        }

        // Filter by date range
        $startDate = $this->request->getQuery('start_date');
        $endDate = $this->request->getQuery('end_date');
        if ($startDate) {
            $conditions['Posts.created >='] = $startDate;
        }
        if ($endDate) {
            $conditions['Posts.created <='] = $endDate . ' 23:59:59';
        }

        $query = $postsTable->find()
            ->where($conditions)
            ->contain([
                'Clients' => ['fields' => ['id', 'name', 'logo_path']],
                'Users' => ['fields' => ['id', 'first_name', 'last_name']],
                'PostPlatforms' => [
                    'SocialAccounts' => ['fields' => ['id', 'platform', 'account_name']]
                ],
                'MediaFiles' => ['fields' => ['id', 'file_path', 'file_type', 'file_size']],
                'PostApprovals' => [
                    'conditions' => ['PostApprovals.is_active' => true],
                    'Users' => ['fields' => ['id', 'first_name', 'last_name']]
                ]
            ])
            ->order(['Posts.created' => 'DESC']);

        // Add pagination
        $page = (int)$this->request->getQuery('page', 1);
        $limit = min((int)$this->request->getQuery('limit', 20), 50);

        $posts = $query->limit($limit)->offset(($page - 1) * $limit)->toArray();
        $total = $query->count();

        // Format response data
        $postData = [];
        foreach ($posts as $post) {
            $platforms = [];
            foreach ($post->post_platforms as $platform) {
                $platforms[] = [
                    'platform' => $platform->social_account->platform,
                    'account_name' => $platform->social_account->account_name,
                ];
            }

            $mediaFiles = [];
            foreach ($post->media_files as $media) {
                $mediaFiles[] = [
                    'id' => $media->id,
                    'file_path' => $media->file_path,
                    'file_type' => $media->file_type,
                    'file_size' => $media->file_size,
                ];
            }

            $latestApproval = null;
            if (!empty($post->post_approvals)) {
                $approval = $post->post_approvals[0];
                $latestApproval = [
                    'status' => $approval->status,
                    'feedback' => $approval->feedback,
                    'approved_by' => $approval->user ? $approval->user->first_name . ' ' . $approval->user->last_name : null,
                    'approved_at' => $approval->created,
                ];
            }

            $postData[] = [
                'id' => $post->id,
                'title' => $post->title,
                'content' => $post->content,
                'status' => $post->status,
                'scheduled_at' => $post->scheduled_at,
                'published_at' => $post->published_at,
                'created' => $post->created,
                'updated' => $post->updated,
                'client' => [
                    'id' => $post->client->id,
                    'name' => $post->client->name,
                    'logo_path' => $post->client->logo_path,
                ],
                'created_by' => [
                    'id' => $post->user->id,
                    'name' => $post->user->first_name . ' ' . $post->user->last_name,
                ],
                'platforms' => $platforms,
                'media_files' => $mediaFiles,
                'approval' => $latestApproval,
                'is_recurring' => $post->is_recurring,
                'recurring_pattern' => $post->recurring_pattern,
            ];
        }

        $response = [
            'posts' => $postData,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit),
            ],
            'filters' => [
                'status' => $status,
                'client_id' => $clientId,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ];

        return $this->apiSuccess($response, 'Posts retrieved successfully');
    }

    /**
     * Get a specific post
     *
     * @param int $id Post ID
     * @return \Cake\Http\Response
     */
    public function view(int $id): Response
    {
        $this->request->allowMethod('get');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $postsTable = $this->fetchTable('Posts');

        try {
            $post = $postsTable->get($id, [
                'conditions' => ['Posts.client_id IN' => $this->getUserClientIds($currentUser)],
                'contain' => [
                    'Clients',
                    'Users',
                    'PostPlatforms' => [
                        'SocialAccounts' => ['fields' => ['id', 'platform', 'account_name']]
                    ],
                    'MediaFiles',
                    'PostApprovals' => [
                        'Users' => ['fields' => ['id', 'first_name', 'last_name']],
                        'order' => ['PostApprovals.created' => 'DESC']
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Post not found', 404);
        }

        // Format detailed response
        $platforms = [];
        foreach ($post->post_platforms as $platform) {
            $platforms[] = [
                'social_account_id' => $platform->social_account->id,
                'platform' => $platform->social_account->platform,
                'account_name' => $platform->social_account->account_name,
                'platform_specific_data' => $platform->platform_specific_data,
            ];
        }

        $mediaFiles = [];
        foreach ($post->media_files as $media) {
            $mediaFiles[] = [
                'id' => $media->id,
                'file_path' => $media->file_path,
                'file_type' => $media->file_type,
                'file_size' => $media->file_size,
                'file_name' => $media->file_name,
                'created' => $media->created,
            ];
        }

        $approvalHistory = [];
        foreach ($post->post_approvals as $approval) {
            $approvalHistory[] = [
                'id' => $approval->id,
                'status' => $approval->status,
                'feedback' => $approval->feedback,
                'approved_by' => $approval->user ? $approval->user->first_name . ' ' . $approval->user->last_name : null,
                'created' => $approval->created,
                'is_active' => $approval->is_active,
            ];
        }

        $postData = [
            'id' => $post->id,
            'title' => $post->title,
            'content' => $post->content,
            'platform_specific_data' => $post->platform_specific_data,
            'status' => $post->status,
            'scheduled_at' => $post->scheduled_at,
            'published_at' => $post->published_at,
            'created' => $post->created,
            'updated' => $post->updated,
            'client' => [
                'id' => $post->client->id,
                'name' => $post->client->name,
                'logo_path' => $post->client->logo_path,
            ],
            'created_by' => [
                'id' => $post->user->id,
                'name' => $post->user->first_name . ' ' . $post->user->last_name,
            ],
            'platforms' => $platforms,
            'media_files' => $mediaFiles,
            'approval_history' => $approvalHistory,
            'is_recurring' => $post->is_recurring,
            'recurring_pattern' => $post->recurring_pattern,
        ];

        return $this->apiSuccess($postData, 'Post retrieved successfully');
    }

    /**
     * Create a new post
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

        $data = $this->request->getData();

        // Validate required fields
        $validator = new Validator();
        $validator
            ->requirePresence('client_id', 'create')
            ->integer('client_id', 'Client ID must be an integer')
            ->requirePresence('content', 'create')
            ->notEmptyString('content', 'Post content is required')
            ->maxLength('content', 2000, 'Content must be less than 2000 characters')
            ->maxLength('title', 255, 'Title must be less than 255 characters')
            ->requirePresence('social_account_ids', 'create')
            ->add('social_account_ids', 'isArray', [
                'rule' => function ($value) {
                    return is_array($value) && !empty($value);
                },
                'message' => 'At least one social media platform must be selected'
            ]);

        // Validate scheduled date if provided
        if (!empty($data['scheduled_at'])) {
            $validator->dateTime('scheduled_at', ['Y-m-d H:i:s', 'Y-m-d\\TH:i:s\\Z'], 'Invalid date format');
        }

        $errors = $validator->validate($data);
        if (!empty($errors)) {
            return $this->apiError('Validation failed', 400, $errors);
        }

        // Verify client access
        $clientIds = $this->getUserClientIds($currentUser);
        if (!in_array((int)$data['client_id'], $clientIds)) {
            return $this->apiError('Access denied to this client', 403);
        }

        // Verify social accounts belong to client
        $socialAccountsTable = $this->fetchTable('SocialAccounts');
        $validAccounts = $socialAccountsTable->find()
            ->where([
                'id IN' => $data['social_account_ids'],
                'client_id' => $data['client_id'],
                'is_active' => true
            ])
            ->count();

        if ($validAccounts !== count($data['social_account_ids'])) {
            return $this->apiError('Invalid social media accounts selected', 400);
        }

        $postsTable = $this->fetchTable('Posts');

        // Start transaction
        $connection = $postsTable->getConnection();
        $connection->transactional(function () use ($postsTable, $data, $currentUser, &$postId) {
            // Create post
            $postData = [
                'client_id' => $data['client_id'],
                'created_by' => $currentUser->id,
                'title' => $data['title'] ?? '',
                'content' => $data['content'],
                'platform_specific_data' => !empty($data['platform_specific_data']) ? json_encode($data['platform_specific_data']) : null,
                'status' => 'draft',
                'is_recurring' => !empty($data['is_recurring']),
                'recurring_pattern' => $data['recurring_pattern'] ?? null,
            ];

            // Set scheduled time if provided
            if (!empty($data['scheduled_at'])) {
                $postData['scheduled_at'] = new DateTime($data['scheduled_at']);
                $postData['status'] = 'pending_approval'; // Auto-submit for approval if scheduled
            }

            $post = $postsTable->newEntity($postData);
            if (!$postsTable->save($post)) {
                throw new \Exception('Failed to create post');
            }

            $postId = $post->id;

            // Create post-platform associations
            $postPlatformsTable = $this->fetchTable('PostPlatforms');
            foreach ($data['social_account_ids'] as $socialAccountId) {
                $platformData = [
                    'post_id' => $postId,
                    'social_account_id' => $socialAccountId,
                    'status' => 'pending',
                    'platform_specific_data' => !empty($data['platform_data'][$socialAccountId])
                        ? json_encode($data['platform_data'][$socialAccountId])
                        : null,
                ];

                $postPlatform = $postPlatformsTable->newEntity($platformData);
                if (!$postPlatformsTable->save($postPlatform)) {
                    throw new \Exception('Failed to create platform association');
                }
            }

            // Handle media file uploads
            if (!empty($data['media_files'])) {
                $this->attachMediaFiles($postId, $data['media_files']);
            }
        });

        // Fetch the created post with associations
        $post = $postsTable->get($postId, [
            'contain' => [
                'Clients' => ['fields' => ['id', 'name']],
                'PostPlatforms' => [
                    'SocialAccounts' => ['fields' => ['id', 'platform', 'account_name']]
                ],
                'MediaFiles' => ['fields' => ['id', 'file_path', 'file_type']]
            ]
        ]);

        $response = [
            'id' => $post->id,
            'title' => $post->title,
            'content' => $post->content,
            'status' => $post->status,
            'scheduled_at' => $post->scheduled_at,
            'client' => [
                'id' => $post->client->id,
                'name' => $post->client->name,
            ],
            'platforms' => array_map(function ($platform) {
                return [
                    'platform' => $platform->social_account->platform,
                    'account_name' => $platform->social_account->account_name,
                ];
            }, $post->post_platforms),
            'media_files_count' => count($post->media_files),
        ];

        return $this->apiSuccess($response, 'Post created successfully', 201);
    }

    /**
     * Update a post
     *
     * @param int $id Post ID
     * @return \Cake\Http\Response
     */
    public function edit(int $id): Response
    {
        $this->request->allowMethod(['put', 'patch']);

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $postsTable = $this->fetchTable('Posts');

        try {
            $post = $postsTable->get($id, [
                'conditions' => ['Posts.client_id IN' => $this->getUserClientIds($currentUser)]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Post not found', 404);
        }

        // Check permissions - only creators can edit drafts, managers can edit any
        if ($post->status !== 'draft' && !$currentUser->isManager() && $post->created_by !== $currentUser->id) {
            return $this->apiError('Cannot edit post after submission', 403);
        }

        $data = $this->request->getData();

        // Validate fields
        $validator = new Validator();
        $validator
            ->maxLength('title', 255, 'Title must be less than 255 characters')
            ->maxLength('content', 2000, 'Content must be less than 2000 characters');

        if (!empty($data['scheduled_at'])) {
            $validator->dateTime('scheduled_at', ['Y-m-d H:i:s', 'Y-m-d\\TH:i:s\\Z'], 'Invalid date format');
        }

        $errors = $validator->validate($data);
        if (!empty($errors)) {
            return $this->apiError('Validation failed', 400, $errors);
        }

        // Update allowed fields
        $allowedFields = ['title', 'content', 'scheduled_at', 'platform_specific_data', 'is_recurring', 'recurring_pattern'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'scheduled_at' && !empty($data[$field])) {
                    $post->$field = new DateTime($data[$field]);
                } elseif ($field === 'platform_specific_data' && !empty($data[$field])) {
                    $post->$field = json_encode($data[$field]);
                } else {
                    $post->$field = $data[$field];
                }
            }
        }

        if ($postsTable->save($post)) {
            // Update platform associations if provided
            if (!empty($data['social_account_ids'])) {
                $this->updatePostPlatforms($id, $data['social_account_ids'], $data['platform_data'] ?? []);
            }

            // Handle media file updates
            if (isset($data['media_files'])) {
                $this->updateMediaFiles($id, $data['media_files']);
            }

            return $this->apiSuccess([
                'id' => $post->id,
                'status' => $post->status,
                'updated' => $post->updated,
            ], 'Post updated successfully');
        }

        return $this->apiError('Failed to update post', 400, $post->getErrors());
    }

    /**
     * Submit post for approval
     *
     * @param int $id Post ID
     * @return \Cake\Http\Response
     */
    public function submit(int $id): Response
    {
        $this->request->allowMethod('post');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $postsTable = $this->fetchTable('Posts');

        try {
            $post = $postsTable->get($id, [
                'conditions' => ['Posts.client_id IN' => $this->getUserClientIds($currentUser)]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Post not found', 404);
        }

        // Only drafts can be submitted
        if ($post->status !== 'draft') {
            return $this->apiError('Only draft posts can be submitted for approval', 400);
        }

        // Check if post has required content
        if (empty($post->content)) {
            return $this->apiError('Post content is required before submission', 400);
        }

        // Check if post has platforms selected
        $postPlatformsTable = $this->fetchTable('PostPlatforms');
        $platformCount = $postPlatformsTable->find()
            ->where(['post_id' => $id])
            ->count();

        if ($platformCount === 0) {
            return $this->apiError('At least one social media platform must be selected', 400);
        }

        // Update post status
        $post->status = 'pending_approval';
        if ($postsTable->save($post)) {
            return $this->apiSuccess([
                'id' => $post->id,
                'status' => $post->status,
            ], 'Post submitted for approval successfully');
        }

        return $this->apiError('Failed to submit post', 400);
    }

    /**
     * Approve a post (managers only)
     *
     * @param int $id Post ID
     * @return \Cake\Http\Response
     */
    public function approve(int $id): Response
    {
        $this->request->allowMethod('post');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        // Only managers can approve posts
        if (!$currentUser->isManager()) {
            return $this->apiError('Only managers can approve posts', 403);
        }

        $data = $this->request->getData();

        $postsTable = $this->fetchTable('Posts');

        try {
            $post = $postsTable->get($id, [
                'conditions' => ['Posts.client_id IN' => $this->getUserClientIds($currentUser)]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Post not found', 404);
        }

        // Only pending posts can be approved
        if ($post->status !== 'pending_approval') {
            return $this->apiError('Only pending posts can be approved', 400);
        }

        $connection = $postsTable->getConnection();
        $connection->transactional(function () use ($post, $postsTable, $currentUser, $data) {
            // Update post status
            $newStatus = 'approved';
            if ($post->scheduled_at) {
                $newStatus = 'scheduled';
            }

            $post->status = $newStatus;
            $postsTable->save($post);

            // Create approval record
            $approvalsTable = $this->fetchTable('PostApprovals');
            $approval = $approvalsTable->newEntity([
                'post_id' => $post->id,
                'approved_by' => $currentUser->id,
                'status' => 'approved',
                'feedback' => $data['feedback'] ?? null,
                'is_active' => true,
            ]);
            $approvalsTable->save($approval);
        });

        return $this->apiSuccess([
            'id' => $post->id,
            'status' => $post->status,
        ], 'Post approved successfully');
    }

    /**
     * Reject a post (managers only)
     *
     * @param int $id Post ID
     * @return \Cake\Http\Response
     */
    public function reject(int $id): Response
    {
        $this->request->allowMethod('post');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        // Only managers can reject posts
        if (!$currentUser->isManager()) {
            return $this->apiError('Only managers can reject posts', 403);
        }

        $data = $this->request->getData();

        // Feedback is required for rejection
        if (empty($data['feedback'])) {
            return $this->apiError('Feedback is required when rejecting a post', 400);
        }

        $postsTable = $this->fetchTable('Posts');

        try {
            $post = $postsTable->get($id, [
                'conditions' => ['Posts.client_id IN' => $this->getUserClientIds($currentUser)]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Post not found', 404);
        }

        // Only pending posts can be rejected
        if ($post->status !== 'pending_approval') {
            return $this->apiError('Only pending posts can be rejected', 400);
        }

        $connection = $postsTable->getConnection();
        $connection->transactional(function () use ($post, $postsTable, $currentUser, $data) {
            // Update post status back to draft
            $post->status = 'draft';
            $postsTable->save($post);

            // Create rejection record
            $approvalsTable = $this->fetchTable('PostApprovals');
            $approval = $approvalsTable->newEntity([
                'post_id' => $post->id,
                'approved_by' => $currentUser->id,
                'status' => 'rejected',
                'feedback' => $data['feedback'],
                'is_active' => true,
            ]);
            $approvalsTable->save($approval);
        });

        return $this->apiSuccess([
            'id' => $post->id,
            'status' => $post->status,
            'feedback' => $data['feedback'],
        ], 'Post rejected with feedback');
    }

    /**
     * Delete a post
     *
     * @param int $id Post ID
     * @return \Cake\Http\Response
     */
    public function delete(int $id): Response
    {
        $this->request->allowMethod('delete');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $postsTable = $this->fetchTable('Posts');

        try {
            $post = $postsTable->get($id, [
                'conditions' => ['Posts.client_id IN' => $this->getUserClientIds($currentUser)]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Post not found', 404);
        }

        // Check permissions
        if (!$currentUser->isManager() && $post->created_by !== $currentUser->id) {
            return $this->apiError('Permission denied', 403);
        }

        // Cannot delete published posts
        if ($post->status === 'published') {
            return $this->apiError('Cannot delete published posts', 400);
        }

        if ($postsTable->delete($post)) {
            return $this->apiSuccess(null, 'Post deleted successfully');
        }

        return $this->apiError('Failed to delete post', 400);
    }

    /**
     * Get client IDs accessible to the current user
     *
     * @param object $user Current user
     * @return array Client IDs
     */
    private function getUserClientIds($user): array
    {
        $clientsTable = $this->fetchTable('Clients');

        $query = $clientsTable->find()
            ->where([
                'organization_id' => $user->organization_id,
                'is_active' => true
            ])
            ->select(['id']);

        // For now, return all client IDs for the organization
        // TODO: Implement designer-specific client assignments

        $clients = $query->toArray();
        return array_column($clients, 'id');
    }

    /**
     * Update post platform associations
     *
     * @param int $postId Post ID
     * @param array $socialAccountIds Social account IDs
     * @param array $platformData Platform-specific data
     * @return void
     */
    private function updatePostPlatforms(int $postId, array $socialAccountIds, array $platformData = []): void
    {
        $postPlatformsTable = $this->fetchTable('PostPlatforms');

        // Delete existing associations
        $postPlatformsTable->deleteAll(['post_id' => $postId]);

        // Create new associations
        foreach ($socialAccountIds as $socialAccountId) {
            $platformEntityData = [
                'post_id' => $postId,
                'social_account_id' => $socialAccountId,
                'status' => 'pending',
                'platform_specific_data' => !empty($platformData[$socialAccountId])
                    ? json_encode($platformData[$socialAccountId])
                    : null,
            ];

            $postPlatform = $postPlatformsTable->newEntity($platformEntityData);
            $postPlatformsTable->save($postPlatform);
        }
    }

    /**
     * Attach media files to a post
     *
     * @param int $postId Post ID
     * @param array $mediaFiles Media file data
     * @return void
     */
    private function attachMediaFiles(int $postId, array $mediaFiles): void
    {
        $mediaTable = $this->fetchTable('MediaFiles');

        foreach ($mediaFiles as $fileData) {
            if (!empty($fileData['id'])) {
                // Link existing media file
                $media = $mediaTable->get($fileData['id']);
                $media->post_id = $postId;
                $mediaTable->save($media);
            }
        }
    }

    /**
     * Update media files for a post
     *
     * @param int $postId Post ID
     * @param array $mediaFiles Media file data
     * @return void
     */
    private function updateMediaFiles(int $postId, array $mediaFiles): void
    {
        $mediaTable = $this->fetchTable('MediaFiles');

        // Get current media files
        $currentFilesQuery = $mediaTable->find()
            ->where(['post_id' => $postId])
            ->select(['id'])
            ->toArray();
        $currentFiles = array_column($currentFilesQuery, 'id');

        $newFileIds = [];
        foreach ($mediaFiles as $fileData) {
            if (!empty($fileData['id'])) {
                $newFileIds[] = $fileData['id'];
            }
        }

        // Remove unlinked files
        $filesToRemove = array_diff($currentFiles, $newFileIds);
        if (!empty($filesToRemove)) {
            $mediaTable->updateAll(
                ['post_id' => null],
                ['id IN' => $filesToRemove]
            );
        }

        // Add new files
        $this->attachMediaFiles($postId, $mediaFiles);
    }

    /**
     * Publish a post to social media platforms
     *
     * @param int $id Post ID
     * @return \Cake\Http\Response
     */
    public function publish(int $id): Response
    {
        $this->request->allowMethod('post');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $postsTable = $this->fetchTable('Posts');

        try {
            $post = $postsTable->get($id, [
                'conditions' => ['Posts.client_id IN' => $this->getUserClientIds($currentUser)],
                'contain' => [
                    'Clients',
                    'PostPlatforms' => [
                        'SocialAccounts'
                    ],
                    'MediaFiles'
                ]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Post not found', 404);
        }

        // Check if post is approved
        if ($post->status !== 'approved') {
            return $this->apiError('Post must be approved before publishing', 400);
        }

        $publishResults = [];
        $hasFailures = false;

        // Process each platform
        foreach ($post->post_platforms as $platform) {
            try {
                $result = $this->publishToSocialPlatform($post, $platform->social_account);
                $publishResults[] = [
                    'platform' => $platform->social_account->platform,
                    'account_name' => $platform->social_account->account_name,
                    'status' => 'success',
                    'platform_post_id' => $result['platform_post_id'],
                    'published_at' => $result['published_at']
                ];

                // Update platform with published data
                $this->updatePlatformPublishedData($platform->id, $result);

            } catch (\Exception $e) {
                $hasFailures = true;
                $publishResults[] = [
                    'platform' => $platform->social_account->platform,
                    'account_name' => $platform->social_account->account_name,
                    'status' => 'failed',
                    'error' => $e->getMessage()
                ];

                // Log the error
                $this->log("Publishing failed for post {$id} on {$platform->social_account->platform}: " . $e->getMessage(), 'error');
            }
        }

        // Update post status
        $newStatus = $hasFailures ? 'partially_published' : 'published';
        $post->status = $newStatus;
        $post->published_at = new DateTime();
        $postsTable->save($post);

        return $this->apiSuccess([
            'post_id' => $id,
            'status' => $newStatus,
            'publish_results' => $publishResults
        ], 'Post publishing completed');
    }

    /**
     * Schedule a post for future publishing
     *
     * @param int $id Post ID
     * @return \Cake\Http\Response
     */
    public function schedule(int $id): Response
    {
        $this->request->allowMethod('post');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $scheduledAt = $this->request->getData('scheduled_at');
        if (!$scheduledAt) {
            return $this->apiError('scheduled_at is required', 400);
        }

        $postsTable = $this->fetchTable('Posts');

        try {
            $post = $postsTable->get($id, [
                'conditions' => ['Posts.client_id IN' => $this->getUserClientIds($currentUser)]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Post not found', 404);
        }

        // Validate scheduled time is in the future
        $scheduledDateTime = new DateTime($scheduledAt);
        if ($scheduledDateTime <= new DateTime()) {
            return $this->apiError('Scheduled time must be in the future', 400);
        }

        // Check if post is approved
        if ($post->status !== 'approved') {
            return $this->apiError('Post must be approved before scheduling', 400);
        }

        $post->status = 'scheduled';
        $post->scheduled_at = $scheduledDateTime;

        if ($postsTable->save($post)) {
            return $this->apiSuccess([
                'post_id' => $id,
                'status' => 'scheduled',
                'scheduled_at' => $post->scheduled_at
            ], 'Post scheduled successfully');
        }

        return $this->apiError('Failed to schedule post', 500);
    }

    /**
     * Get publishing queue
     *
     * @return \Cake\Http\Response
     */
    public function queue(): Response
    {
        $this->request->allowMethod('get');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $postsTable = $this->fetchTable('Posts');

        // Get scheduled posts ready for publishing
        $now = new DateTime();
        $scheduledPosts = $postsTable->find()
            ->where([
                'Posts.status' => 'scheduled',
                'Posts.scheduled_at <=' => $now,
                'Posts.client_id IN' => $this->getUserClientIds($currentUser)
            ])
            ->contain([
                'Clients' => ['fields' => ['id', 'name']],
                'PostPlatforms' => [
                    'SocialAccounts' => ['fields' => ['id', 'platform', 'account_name']]
                ]
            ])
            ->order(['Posts.scheduled_at' => 'ASC'])
            ->toArray();

        // Get upcoming scheduled posts
        $upcomingPosts = $postsTable->find()
            ->where([
                'Posts.status' => 'scheduled',
                'Posts.scheduled_at >' => $now,
                'Posts.client_id IN' => $this->getUserClientIds($currentUser)
            ])
            ->contain([
                'Clients' => ['fields' => ['id', 'name']],
                'PostPlatforms' => [
                    'SocialAccounts' => ['fields' => ['id', 'platform', 'account_name']]
                ]
            ])
            ->order(['Posts.scheduled_at' => 'ASC'])
            ->limit(50)
            ->toArray();

        return $this->apiSuccess([
            'ready_to_publish' => $this->formatQueuePosts($scheduledPosts),
            'upcoming_scheduled' => $this->formatQueuePosts($upcomingPosts),
            'total_ready' => count($scheduledPosts),
            'total_upcoming' => count($upcomingPosts)
        ], 'Publishing queue retrieved successfully');
    }

    /**
     * Process publishing queue (for cron job)
     *
     * @return \Cake\Http\Response
     */
    public function processQueue(): Response
    {
        $this->request->allowMethod('post');

        // This endpoint should be protected and only accessible by cron jobs
        $authKey = $this->request->getHeaderLine('X-Cron-Auth');
        $expectedKey = Configure::read('Cron.auth_key', 'default-cron-key');

        if ($authKey !== $expectedKey) {
            return $this->apiError('Unauthorized', 401);
        }

        $postsTable = $this->fetchTable('Posts');

        // Get posts ready for publishing
        $now = new DateTime();
        $readyPosts = $postsTable->find()
            ->where([
                'Posts.status' => 'scheduled',
                'Posts.scheduled_at <=' => $now
            ])
            ->contain([
                'PostPlatforms' => [
                    'SocialAccounts'
                ],
                'MediaFiles'
            ])
            ->toArray();

        $processedCount = 0;
        $failedCount = 0;
        $results = [];

        foreach ($readyPosts as $post) {
            try {
                $this->publishPostAutomatically($post);
                $processedCount++;
                $results[] = [
                    'post_id' => $post->id,
                    'status' => 'success'
                ];
            } catch (\Exception $e) {
                $failedCount++;
                $results[] = [
                    'post_id' => $post->id,
                    'status' => 'failed',
                    'error' => $e->getMessage()
                ];

                $this->log("Automatic publishing failed for post {$post->id}: " . $e->getMessage(), 'error');
            }
        }

        return $this->apiSuccess([
            'processed' => $processedCount,
            'failed' => $failedCount,
            'total' => count($readyPosts),
            'results' => $results
        ], 'Publishing queue processed');
    }

    /**
     * Optimize content for specific platform
     *
     * @return \Cake\Http\Response
     */
    public function optimizeContent(): Response
    {
        $this->request->allowMethod('post');

        $content = $this->request->getData('content');
        $platform = $this->request->getData('platform');

        if (!$content || !$platform) {
            return $this->apiError('Content and platform are required', 400);
        }

        $optimizedContent = $this->optimizeContentForPlatform($content, $platform);

        return $this->apiSuccess([
            'original_content' => $content,
            'platform' => $platform,
            'optimized_content' => $optimizedContent
        ], 'Content optimized successfully');
    }

    /**
     * Get best posting times for platforms
     *
     * @return \Cake\Http\Response
     */
    public function getBestTimes(): Response
    {
        $this->request->allowMethod('get');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $clientId = $this->request->getQuery('client_id');
        if (!$clientId) {
            return $this->apiError('client_id is required', 400);
        }

        // Verify user has access to this client
        if (!in_array($clientId, $this->getUserClientIds($currentUser))) {
            return $this->apiError('Access denied to this client', 403);
        }

        $bestTimes = $this->calculateBestPostingTimes($clientId);

        return $this->apiSuccess($bestTimes, 'Best posting times retrieved successfully');
    }

    /**
     * Publish post to a specific social media platform
     *
     * @param object $post Post entity
     * @param object $socialAccount Social account entity
     * @return array Publishing result
     */
    private function publishToSocialPlatform($post, $socialAccount): array
    {
        // Get the appropriate service
        $service = $this->getSocialMediaService($socialAccount->platform);

        // Prepare content for publishing
        $content = $this->prepareContentForPlatform($post, $socialAccount->platform);

        // Platform-specific options
        $options = $this->getPlatformSpecificOptions($post, $socialAccount);

        // Publish to platform
        $result = $service->publishContent($socialAccount->access_token, $content, $options);

        return $result;
    }

    /**
     * Publish post automatically (for scheduled publishing)
     *
     * @param object $post Post entity
     * @return void
     */
    private function publishPostAutomatically($post): void
    {
        $publishResults = [];
        $hasFailures = false;

        foreach ($post->post_platforms as $platform) {
            try {
                $result = $this->publishToSocialPlatform($post, $platform->social_account);
                $this->updatePlatformPublishedData($platform->id, $result);
            } catch (\Exception $e) {
                $hasFailures = true;
                $this->log("Auto-publishing failed for post {$post->id} on {$platform->social_account->platform}: " . $e->getMessage(), 'error');
            }
        }

        // Update post status
        $postsTable = $this->fetchTable('Posts');
        $post->status = $hasFailures ? 'partially_published' : 'published';
        $post->published_at = new DateTime();
        $postsTable->save($post);
    }

    /**
     * Get social media service for platform
     *
     * @param string $platform Platform name
     * @return object Service instance
     */
    private function getSocialMediaService(string $platform): object
    {
        $serviceClass = 'App\\Service\\' . ucfirst($platform) . 'Service';

        if (!class_exists($serviceClass)) {
            throw new \Exception("Service not found for platform: {$platform}");
        }

        return new $serviceClass();
    }

    /**
     * Prepare content for specific platform
     *
     * @param object $post Post entity
     * @param string $platform Platform name
     * @return array Formatted content
     */
    private function prepareContentForPlatform($post, string $platform): array
    {
        $content = [
            'text' => $post->content,
            'title' => $post->title
        ];

        // Add media files
        if (!empty($post->media_files)) {
            $content['media'] = [];
            foreach ($post->media_files as $media) {
                $content['media'][] = [
                    'path' => WWW_ROOT . $media->file_path,
                    'type' => $media->file_type,
                    'url' => $this->getMediaUrl($media->file_path)
                ];
            }
        }

        // Platform-specific content optimization
        $content = $this->optimizeContentForPlatform($content, $platform);

        return $content;
    }

    /**
     * Get platform-specific publishing options
     *
     * @param object $post Post entity
     * @param object $socialAccount Social account entity
     * @return array Platform options
     */
    private function getPlatformSpecificOptions($post, $socialAccount): array
    {
        $options = [];

        // Get platform-specific data from post
        $platformData = json_decode($post->platform_specific_data ?? '{}', true);
        $platformOptions = $platformData[$socialAccount->platform] ?? [];

        // Add account-specific data
        $accountData = json_decode($socialAccount->account_data ?? '{}', true);

        switch ($socialAccount->platform) {
            case 'instagram':
                $options['instagram_account_id'] = $accountData['instagram_account_id'] ?? null;
                break;

            case 'facebook':
                $options['page_id'] = $accountData['page_id'] ?? null;
                break;

            case 'linkedin':
                $options['person_id'] = $accountData['person_id'] ?? null;
                $options['organization_id'] = $platformOptions['organization_id'] ?? null;
                break;

            case 'twitter':
                $options['thread'] = $platformOptions['create_thread'] ?? false;
                break;

            case 'youtube':
                $options['privacy'] = $platformOptions['privacy'] ?? 'private';
                $options['category_id'] = $platformOptions['category_id'] ?? '22';
                break;
        }

        return array_merge($options, $platformOptions);
    }

    /**
     * Update platform with published data
     *
     * @param int $platformId Platform ID
     * @param array $publishResult Publishing result
     * @return void
     */
    private function updatePlatformPublishedData(int $platformId, array $publishResult): void
    {
        $postPlatformsTable = $this->fetchTable('PostPlatforms');

        $platform = $postPlatformsTable->get($platformId);
        $platform->platform_post_id = $publishResult['platform_post_id'];
        $platform->published_at = new DateTime($publishResult['published_at']);
        $platform->platform_data = json_encode($publishResult['platform_data'] ?? []);

        $postPlatformsTable->save($platform);
    }

    /**
     * Optimize content for specific platform
     *
     * @param array|string $content Content to optimize
     * @param string $platform Platform name
     * @return array|string Optimized content
     */
    private function optimizeContentForPlatform($content, string $platform)
    {
        if (is_string($content)) {
            return $this->optimizeTextForPlatform($content, $platform);
        }

        $optimized = $content;

        // Optimize text content
        if (isset($content['text'])) {
            $optimized['text'] = $this->optimizeTextForPlatform($content['text'], $platform);
        }

        // Platform-specific optimizations
        switch ($platform) {
            case 'twitter':
                // Add thread creation if content is too long
                if (strlen($optimized['text']) > 280) {
                    $optimized['create_thread'] = true;
                }
                break;

            case 'instagram':
                // Ensure we have media for Instagram
                if (empty($content['media'])) {
                    throw new \Exception('Instagram posts require at least one media file');
                }
                break;

            case 'linkedin':
                // Professional tone suggestions could be added here
                break;

            case 'youtube':
                // Ensure we have video content
                if (empty($content['media']) || !$this->hasVideoContent($content['media'])) {
                    throw new \Exception('YouTube posts require video content');
                }
                break;
        }

        return $optimized;
    }

    /**
     * Optimize text for specific platform
     *
     * @param string $text Original text
     * @param string $platform Platform name
     * @return string Optimized text
     */
    private function optimizeTextForPlatform(string $text, string $platform): string
    {
        switch ($platform) {
            case 'twitter':
                // Truncate to Twitter limit
                return strlen($text) > 280 ? substr($text, 0, 277) . '...' : $text;

            case 'threads':
                // Truncate to Threads limit
                return strlen($text) > 500 ? substr($text, 0, 497) . '...' : $text;

            case 'instagram':
                // Add hashtags at the end if not present
                if (strpos($text, '#') === false) {
                    $text .= $this->generateHashtags($text);
                }
                return $text;

            case 'linkedin':
                // Professional formatting
                return $this->formatForLinkedIn($text);

            default:
                return $text;
        }
    }

    /**
     * Generate hashtags for content
     *
     * @param string $text Content text
     * @return string Hashtags
     */
    private function generateHashtags(string $text): string
    {
        // Simple hashtag generation based on common keywords
        $keywords = ['social', 'media', 'content', 'marketing', 'business'];
        $hashtags = [];

        foreach ($keywords as $keyword) {
            if (stripos($text, $keyword) !== false) {
                $hashtags[] = '#' . $keyword;
            }
        }

        return empty($hashtags) ? '' : "\n\n" . implode(' ', array_slice($hashtags, 0, 3));
    }

    /**
     * Format content for LinkedIn
     *
     * @param string $text Original text
     * @return string Formatted text
     */
    private function formatForLinkedIn(string $text): string
    {
        // Add professional formatting
        return $text;
    }

    /**
     * Check if media contains video content
     *
     * @param array $media Media files
     * @return bool True if has video
     */
    private function hasVideoContent(array $media): bool
    {
        foreach ($media as $file) {
            if (isset($file['type']) && strpos($file['type'], 'video') !== false) {
                return true;
            }
        }
        return false;
    }

    /**
     * Format posts for queue display
     *
     * @param array $posts Posts array
     * @return array Formatted posts
     */
    private function formatQueuePosts(array $posts): array
    {
        $formatted = [];

        foreach ($posts as $post) {
            $platforms = [];
            foreach ($post->post_platforms as $platform) {
                $platforms[] = [
                    'platform' => $platform->social_account->platform,
                    'account_name' => $platform->social_account->account_name
                ];
            }

            $formatted[] = [
                'id' => $post->id,
                'title' => $post->title,
                'content' => substr($post->content, 0, 100) . (strlen($post->content) > 100 ? '...' : ''),
                'scheduled_at' => $post->scheduled_at,
                'client' => [
                    'id' => $post->client->id,
                    'name' => $post->client->name
                ],
                'platforms' => $platforms
            ];
        }

        return $formatted;
    }

    /**
     * Calculate best posting times for a client
     *
     * @param int $clientId Client ID
     * @return array Best times data
     */
    private function calculateBestPostingTimes(int $clientId): array
    {
        // This would analyze historical performance data
        // For now, return default optimal times
        return [
            'facebook' => [
                'weekdays' => ['09:00', '13:00', '15:00'],
                'weekends' => ['10:00', '14:00']
            ],
            'instagram' => [
                'weekdays' => ['11:00', '14:00', '17:00'],
                'weekends' => ['11:00', '16:00']
            ],
            'twitter' => [
                'weekdays' => ['08:00', '12:00', '17:00', '19:00'],
                'weekends' => ['09:00', '15:00']
            ],
            'linkedin' => [
                'weekdays' => ['08:00', '12:00', '17:00'],
                'weekends' => []
            ],
            'youtube' => [
                'weekdays' => ['14:00', '19:00'],
                'weekends' => ['15:00', '20:00']
            ],
            'threads' => [
                'weekdays' => ['09:00', '13:00', '18:00'],
                'weekends' => ['11:00', '16:00']
            ]
        ];
    }

    /**
     * Get public URL for media file
     *
     * @param string $filePath File path
     * @return string Public URL
     */
    private function getMediaUrl(string $filePath): string
    {
        $baseUrl = Configure::read('App.baseUrl', 'http://localhost:8080');
        return $baseUrl . '/media/' . $filePath;
    }
}
