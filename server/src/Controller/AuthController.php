<?php
declare(strict_types=1);

namespace App\Controller;

use Cake\Datasource\Exception\RecordNotFoundException;
use Cake\Event\EventInterface;
use Cake\Http\Exception\BadRequestException;
use Cake\Http\Exception\UnauthorizedException;
use Cake\Http\Exception\ForbiddenException;
use Cake\Http\Response;
use Cake\Mailer\MailerAwareTrait;
use Cake\Utility\Security;
use Cake\Validation\Validator;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

/**
 * Authentication Controller
 *
 * Handles user authentication, registration, password reset,
 * and JWT token management for the Nellie platform.
 */
class AuthController extends AppController
{
    use MailerAwareTrait;

    /**
     * JWT Secret Key
     */
    private const JWT_SECRET = 'nellie_jwt_secret_key_2024'; // Should be in environment config

    /**
     * JWT Algorithm
     */
    private const JWT_ALGORITHM = 'HS256';

    /**
     * Token expiration time (24 hours)
     */
    private const TOKEN_EXPIRY = 86400;

    /**
     * Refresh token expiration (7 days)
     */
    private const REFRESH_TOKEN_EXPIRY = 604800;

    /**
     * Initialize method
     */
    public function initialize(): void
    {
        parent::initialize();

        // Allow CORS for authentication endpoints
        $this->response = $this->response->withHeader('Access-Control-Allow-Origin', '*');
        $this->response = $this->response->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $this->response = $this->response->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // Models will be loaded on demand using fetchTable()
    }

    /**
     * Handle OPTIONS requests for CORS
     */
    public function beforeFilter(EventInterface $event): ?Response
    {
        $result = parent::beforeFilter($event);

        if ($this->request->is('options')) {
            return $this->response;
        }

        return $result;
    }

    /**
     * User Login
     *
     * Authenticates user credentials and returns JWT tokens
     */
    public function login(): Response
    {
        $this->request->allowMethod(['post']);

        try {
            $data = $this->request->getData();

            // Validate required fields
            if (empty($data['email']) || empty($data['password'])) {
                throw new BadRequestException('Email and password are required');
            }

            // Find user by email
            $usersTable = $this->fetchTable('Users');
            $user = $usersTable->find()
                ->contain(['Organizations'])
                ->where(['Users.email' => $data['email'], 'Users.is_active' => true])
                ->first();

            if (!$user) {
                throw new UnauthorizedException('Invalid credentials');
            }

            // Verify password
            if (!password_verify($data['password'], $user->password_hash)) {
                throw new UnauthorizedException('Invalid credentials');
            }

            // Check if organization is active
            if (!$user->organization->is_active) {
                throw new ForbiddenException('Organization account is disabled');
            }

            // Generate JWT tokens
            $accessToken = $this->generateAccessToken($user);
            $refreshToken = $this->generateRefreshToken($user);

            // Update last login
            $user->last_login = new \DateTime();
            $usersTable->save($user);

            // Prepare user data for response (exclude sensitive info)
            $userData = [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'role' => $user->role,
                'organization_id' => $user->organization_id,
                'organization_name' => $user->organization->name,
                'last_login' => $user->last_login,
            ];

            return $this->response
                ->withType('application/json')
                ->withStringBody(json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'data' => [
                        'user' => $userData,
                        'access_token' => $accessToken,
                        'refresh_token' => $refreshToken,
                        'token_type' => 'Bearer',
                        'expires_in' => self::TOKEN_EXPIRY,
                    ],
                    'timestamp' => date('c'),
                ]));

        } catch (Exception $e) {
            return $this->response
                ->withStatus($e instanceof UnauthorizedException ? 401 : 400)
                ->withType('application/json')
                ->withStringBody(json_encode([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'timestamp' => date('c'),
                ]));
        }
    }

    /**
     * User Registration
     *
     * Creates new user account and organization
     */
    public function register(): Response
    {
        $this->request->allowMethod(['post']);

        try {
            $data = $this->request->getData();

            // Validate input data
            $validator = new Validator();
            $validator
                ->requirePresence(['email', 'password', 'first_name', 'last_name', 'organization_name'])
                ->email('email', false, 'Please provide a valid email address')
                ->minLength('password', 8, 'Password must be at least 8 characters long')
                ->notEmptyString('first_name', 'First name is required')
                ->notEmptyString('last_name', 'Last name is required')
                ->notEmptyString('organization_name', 'Organization name is required');

            $errors = $validator->validate($data);
            if (!empty($errors)) {
                throw new BadRequestException('Validation failed: ' . json_encode($errors));
            }

            // Check if email already exists
            $usersTable = $this->fetchTable('Users');
            $existingUser = $usersTable->find()
                ->where(['email' => $data['email']])
                ->first();

            if ($existingUser) {
                throw new BadRequestException('Email address is already registered');
            }

            // Start database transaction
            $organizationsTable = $this->fetchTable('Organizations');
            $connection = $usersTable->getConnection();
            $connection->begin();

            try {
                // Create organization
                $organization = $organizationsTable->newEntity([
                    'name' => $data['organization_name'],
                    'email' => $data['email'],
                    'timezone' => $data['timezone'] ?? 'Asia/Kolkata',
                ]);

                if (!$organizationsTable->save($organization)) {
                    throw new Exception('Failed to create organization');
                }

                // Create user
                $user = $usersTable->newEntity([
                    'organization_id' => $organization->id,
                    'email' => $data['email'],
                    'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'role' => 'manager', // First user is always a manager
                ]);

                if (!$usersTable->save($user)) {
                    throw new Exception('Failed to create user account');
                }

                // Commit transaction
                $connection->commit();

                // Generate tokens for immediate login
                $accessToken = $this->generateAccessToken($user);
                $refreshToken = $this->generateRefreshToken($user);

                // Prepare response data
                $userData = [
                    'id' => $user->id,
                    'email' => $user->email,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'role' => $user->role,
                    'organization_id' => $user->organization_id,
                    'organization_name' => $organization->name,
                ];

                return $this->response
                    ->withStatus(201)
                    ->withType('application/json')
                    ->withStringBody(json_encode([
                        'success' => true,
                        'message' => 'Account created successfully',
                        'data' => [
                            'user' => $userData,
                            'access_token' => $accessToken,
                            'refresh_token' => $refreshToken,
                            'token_type' => 'Bearer',
                            'expires_in' => self::TOKEN_EXPIRY,
                        ],
                        'timestamp' => date('c'),
                    ]));

            } catch (Exception $e) {
                $connection->rollback();
                throw $e;
            }

        } catch (Exception $e) {
            return $this->response
                ->withStatus(400)
                ->withType('application/json')
                ->withStringBody(json_encode([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'timestamp' => date('c'),
                ]));
        }
    }

    /**
     * Refresh Access Token
     *
     * Generates new access token using refresh token
     */
    public function refresh(): Response
    {
        $this->request->allowMethod(['post']);

        try {
            $data = $this->request->getData();

            if (empty($data['refresh_token'])) {
                throw new BadRequestException('Refresh token is required');
            }

            // Decode refresh token
            try {
                $decoded = JWT::decode($data['refresh_token'], new Key(self::JWT_SECRET, self::JWT_ALGORITHM));
            } catch (Exception $e) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Find user
            $usersTable = $this->fetchTable('Users');
            $user = $usersTable->find()
                ->contain(['Organizations'])
                ->where(['Users.id' => $decoded->user_id, 'Users.is_active' => true])
                ->first();

            if (!$user) {
                throw new UnauthorizedException('User not found');
            }

            // Generate new access token
            $accessToken = $this->generateAccessToken($user);

            return $this->response
                ->withType('application/json')
                ->withStringBody(json_encode([
                    'success' => true,
                    'message' => 'Token refreshed successfully',
                    'data' => [
                        'access_token' => $accessToken,
                        'token_type' => 'Bearer',
                        'expires_in' => self::TOKEN_EXPIRY,
                    ],
                    'timestamp' => date('c'),
                ]));

        } catch (Exception $e) {
            return $this->response
                ->withStatus($e instanceof UnauthorizedException ? 401 : 400)
                ->withType('application/json')
                ->withStringBody(json_encode([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'timestamp' => date('c'),
                ]));
        }
    }

    /**
     * User Logout
     *
     * Invalidates user session (client-side token removal)
     */
    public function logout(): Response
    {
        // Note: With JWT, logout is typically handled client-side by removing the token
        // For server-side logout, you would need to maintain a blacklist of tokens

        return $this->response
            ->withType('application/json')
            ->withStringBody(json_encode([
                'success' => true,
                'message' => 'Logged out successfully',
                'timestamp' => date('c'),
            ]));
    }

    /**
     * Get Current User
     *
     * Returns current authenticated user information
     */
    public function me(): Response
    {
        try {
            // Extract token from Authorization header
            $authHeader = $this->request->getHeaderLine('Authorization');
            if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
                throw new UnauthorizedException('Authorization token required');
            }

            $token = substr($authHeader, 7);

            // Decode token
            try {
                $decoded = JWT::decode($token, new Key(self::JWT_SECRET, self::JWT_ALGORITHM));
            } catch (Exception $e) {
                throw new UnauthorizedException('Invalid or expired token');
            }

            // Find user
            $usersTable = $this->fetchTable('Users');
            $user = $usersTable->find()
                ->contain(['Organizations'])
                ->where(['Users.id' => $decoded->user_id, 'Users.is_active' => true])
                ->first();

            if (!$user) {
                throw new UnauthorizedException('User not found');
            }

            // Prepare user data
            $userData = [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'role' => $user->role,
                'organization_id' => $user->organization_id,
                'organization_name' => $user->organization->name,
                'last_login' => $user->last_login,
            ];

            return $this->response
                ->withType('application/json')
                ->withStringBody(json_encode([
                    'success' => true,
                    'data' => ['user' => $userData],
                    'timestamp' => date('c'),
                ]));

        } catch (Exception $e) {
            return $this->response
                ->withStatus($e instanceof UnauthorizedException ? 401 : 400)
                ->withType('application/json')
                ->withStringBody(json_encode([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'timestamp' => date('c'),
                ]));
        }
    }

    /**
     * Request Password Reset
     *
     * Sends password reset email to user
     */
    public function forgotPassword(): Response
    {
        $this->request->allowMethod(['post']);

        try {
            $data = $this->request->getData();

            if (empty($data['email'])) {
                throw new BadRequestException('Email address is required');
            }

            // Find user
            $usersTable = $this->fetchTable('Users');
            $user = $usersTable->find()
                ->where(['email' => $data['email'], 'is_active' => true])
                ->first();

            if (!$user) {
                // For security, always return success even if email doesn't exist
                return $this->response
                    ->withType('application/json')
                    ->withStringBody(json_encode([
                        'success' => true,
                        'message' => 'If the email exists, a password reset link has been sent',
                        'timestamp' => date('c'),
                    ]));
            }

            // Generate reset token (valid for 1 hour)
            $resetToken = bin2hex(random_bytes(32));
            $resetExpiry = new \DateTime('+1 hour');

            // Store reset token in user record (you might want a separate table for this)
            $user->password_reset_token = $resetToken;
            $user->password_reset_expires = $resetExpiry;
            $usersTable->save($user);

            // Send reset email (implement based on your mailer configuration)
            try {
                $this->getMailer('User')->send('passwordReset', [$user, $resetToken]);
            } catch (Exception $e) {
                // Log email error but don't expose to user
                error_log('Password reset email failed: ' . $e->getMessage());
            }

            return $this->response
                ->withType('application/json')
                ->withStringBody(json_encode([
                    'success' => true,
                    'message' => 'If the email exists, a password reset link has been sent',
                    'timestamp' => date('c'),
                ]));

        } catch (Exception $e) {
            return $this->response
                ->withStatus(400)
                ->withType('application/json')
                ->withStringBody(json_encode([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'timestamp' => date('c'),
                ]));
        }
    }

    /**
     * Reset Password
     *
     * Resets user password using reset token
     */
    public function resetPassword(): Response
    {
        $this->request->allowMethod(['post']);

        try {
            $data = $this->request->getData();

            if (empty($data['token']) || empty($data['password'])) {
                throw new BadRequestException('Reset token and new password are required');
            }

            if (strlen($data['password']) < 8) {
                throw new BadRequestException('Password must be at least 8 characters long');
            }

            // Find user by reset token
            $usersTable = $this->fetchTable('Users');
            $user = $usersTable->find()
                ->where([
                    'password_reset_token' => $data['token'],
                    'password_reset_expires >=' => new \DateTime(),
                    'is_active' => true
                ])
                ->first();

            if (!$user) {
                throw new BadRequestException('Invalid or expired reset token');
            }

            // Update password and clear reset token
            $user->password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
            $user->password_reset_token = null;
            $user->password_reset_expires = null;

            if (!$usersTable->save($user)) {
                throw new Exception('Failed to update password');
            }

            return $this->response
                ->withType('application/json')
                ->withStringBody(json_encode([
                    'success' => true,
                    'message' => 'Password reset successfully',
                    'timestamp' => date('c'),
                ]));

        } catch (Exception $e) {
            return $this->response
                ->withStatus(400)
                ->withType('application/json')
                ->withStringBody(json_encode([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'timestamp' => date('c'),
                ]));
        }
    }

    /**
     * Generate JWT Access Token
     */
    private function generateAccessToken($user): string
    {
        $payload = [
            'iss' => 'nellie-app',
            'aud' => 'nellie-users',
            'iat' => time(),
            'exp' => time() + self::TOKEN_EXPIRY,
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'organization_id' => $user->organization_id,
        ];

        return JWT::encode($payload, self::JWT_SECRET, self::JWT_ALGORITHM);
    }

    /**
     * Generate JWT Refresh Token
     */
    private function generateRefreshToken($user): string
    {
        $payload = [
            'iss' => 'nellie-app',
            'aud' => 'nellie-refresh',
            'iat' => time(),
            'exp' => time() + self::REFRESH_TOKEN_EXPIRY,
            'user_id' => $user->id,
            'type' => 'refresh',
        ];

        return JWT::encode($payload, self::JWT_SECRET, self::JWT_ALGORITHM);
    }

    /**
     * Validate JWT Token (utility method)
     */
    public function validateToken(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key(self::JWT_SECRET, self::JWT_ALGORITHM));
            return (array) $decoded;
        } catch (Exception $e) {
            return null;
        }
    }
}
