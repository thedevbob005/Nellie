<?php
declare(strict_types=1);

namespace App\Controller;

use Cake\Http\Response;

/**
 * Users Controller
 *
 * Handles user management operations (CRUD for team members)
 * Only accessible by managers
 */
class UsersController extends AppController
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
     * Get all users in the organization
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

        if (!$this->requireManager()) {
            return $this->response;
        }

        $usersTable = $this->fetchTable('Users');

        $users = $usersTable->find('byOrganization', [
                'organization_id' => $currentUser->organization_id
            ])
            ->select(['id', 'email', 'first_name', 'last_name', 'role', 'last_login', 'created_at', 'is_active'])
            ->toArray();

        $userData = [];
        foreach ($users as $user) {
            $userData[] = [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $user->first_name . ' ' . $user->last_name,
                'role' => $user->role,
                'last_login' => $user->last_login,
                'created_at' => $user->created_at,
                'is_active' => $user->is_active,
            ];
        }

        return $this->apiSuccess($userData, 'Users retrieved successfully');
    }

    /**
     * Get a specific user
     *
     * @param int $id User ID
     * @return \Cake\Http\Response
     */
    public function view(int $id): Response
    {
        $this->request->allowMethod('get');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        if (!$this->requireManager()) {
            return $this->response;
        }

        $usersTable = $this->fetchTable('Users');

        try {
            $user = $usersTable->get($id, [
                'conditions' => ['organization_id' => $currentUser->organization_id],
                'contain' => ['Organizations']
            ]);
        } catch (\Exception $e) {
            return $this->apiError('User not found', 404);
        }

        $userData = [
            'id' => $user->id,
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => $user->full_name,
            'role' => $user->role,
            'last_login' => $user->last_login,
            'created_at' => $user->created_at,
            'is_active' => $user->is_active,
            'organization' => [
                'id' => $user->organization->id,
                'name' => $user->organization->name,
            ],
        ];

        return $this->apiSuccess($userData, 'User retrieved successfully');
    }

    /**
     * Create a new user (team member)
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

        if (!$this->requireManager()) {
            return $this->response;
        }

        $usersTable = $this->fetchTable('Users');
        $data = $this->request->getData();

        // Validate required fields
        $requiredFields = ['email', 'password', 'first_name', 'last_name', 'role'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return $this->apiError("Field '{$field}' is required", 400);
            }
        }

        // Validate role
        if (!in_array($data['role'], ['manager', 'designer'])) {
            return $this->apiError('Role must be either manager or designer', 400);
        }

        // Add organization_id from current user
        $data['organization_id'] = $currentUser->organization_id;
        $data['is_active'] = true;

        $user = $usersTable->newEntity($data);

        if ($usersTable->save($user)) {
            $userData = [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $user->full_name,
                'role' => $user->role,
                'created_at' => $user->created_at,
                'is_active' => $user->is_active,
            ];

            return $this->apiSuccess($userData, 'User created successfully', 201);
        }

        return $this->apiError('Failed to create user', 400, $user->getErrors());
    }

    /**
     * Update a user
     *
     * @param int $id User ID
     * @return \Cake\Http\Response
     */
    public function edit(int $id): Response
    {
        $this->request->allowMethod(['put', 'patch']);

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        if (!$this->requireManager()) {
            return $this->response;
        }

        $usersTable = $this->fetchTable('Users');

        try {
            $user = $usersTable->get($id, [
                'conditions' => ['organization_id' => $currentUser->organization_id]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('User not found', 404);
        }

        // Prevent editing own account through this endpoint
        if ($user->id === $currentUser->id) {
            return $this->apiError('Use profile update endpoint to edit your own account', 400);
        }

        $data = $this->request->getData();

        // Only allow updating certain fields
        $allowedFields = ['first_name', 'last_name', 'email', 'role', 'is_active'];
        $updateData = array_intersect_key($data, array_flip($allowedFields));

        // Validate role if provided
        if (isset($updateData['role']) && !in_array($updateData['role'], ['manager', 'designer'])) {
            return $this->apiError('Role must be either manager or designer', 400);
        }

        $user = $usersTable->patchEntity($user, $updateData);

        if ($usersTable->save($user)) {
            $userData = [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $user->full_name,
                'role' => $user->role,
                'is_active' => $user->is_active,
            ];

            return $this->apiSuccess($userData, 'User updated successfully');
        }

        return $this->apiError('Failed to update user', 400, $user->getErrors());
    }

    /**
     * Delete a user (soft delete by setting is_active = false)
     *
     * @param int $id User ID
     * @return \Cake\Http\Response
     */
    public function delete(int $id): Response
    {
        $this->request->allowMethod('delete');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        if (!$this->requireManager()) {
            return $this->response;
        }

        $usersTable = $this->fetchTable('Users');

        try {
            $user = $usersTable->get($id, [
                'conditions' => ['organization_id' => $currentUser->organization_id]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('User not found', 404);
        }

        // Prevent deleting own account
        if ($user->id === $currentUser->id) {
            return $this->apiError('Cannot delete your own account', 400);
        }

        // Soft delete by setting is_active = false
        $user->is_active = false;

        if ($usersTable->save($user)) {
            return $this->apiSuccess(null, 'User deactivated successfully');
        }

        return $this->apiError('Failed to deactivate user', 400);
    }

    /**
     * Reset user password (generates new temporary password)
     *
     * @param int $id User ID
     * @return \Cake\Http\Response
     */
    public function resetPassword(int $id): Response
    {
        $this->request->allowMethod('post');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        if (!$this->requireManager()) {
            return $this->response;
        }

        $usersTable = $this->fetchTable('Users');

        try {
            $user = $usersTable->get($id, [
                'conditions' => ['organization_id' => $currentUser->organization_id]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('User not found', 404);
        }

        // Generate temporary password
        $tempPassword = $this->generateTempPassword();

        $user = $usersTable->patchEntity($user, [
            'password' => $tempPassword
        ], ['validate' => 'passwordChange']);

        if ($usersTable->save($user)) {
            $responseData = [
                'temporary_password' => $tempPassword,
                'message' => 'Please share this temporary password securely with the user. They should change it immediately after login.'
            ];

            return $this->apiSuccess($responseData, 'Password reset successfully');
        }

        return $this->apiError('Failed to reset password', 400, $user->getErrors());
    }

    /**
     * Generate a temporary password
     *
     * @return string
     */
    private function generateTempPassword(): string
    {
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
        $password = '';

        // Ensure at least one uppercase, one lowercase, one number
        $password .= chr(rand(65, 90)); // Uppercase
        $password .= chr(rand(97, 122)); // Lowercase
        $password .= chr(rand(48, 57)); // Number
        $password .= $characters[rand(62, 65)]; // Special character

        // Add 8 more random characters
        for ($i = 0; $i < 8; $i++) {
            $password .= $characters[rand(0, strlen($characters) - 1)];
        }

        return str_shuffle($password);
    }
}
