# Authentication API

## Overview

The Nellie Authentication API handles user authentication, registration, password management, and JWT token operations. All authentication endpoints return JWT tokens for subsequent API access.

## Base URL
```
/api/auth
```

## Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | User login | No |
| POST | `/register` | User registration | No |
| POST | `/logout` | User logout | Yes |
| POST | `/refresh` | Refresh JWT token | Yes |
| GET | `/me` | Get current user info | Yes |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| PUT | `/change-password` | Change password | Yes |

---

## POST `/api/auth/login`

Authenticate user and receive JWT tokens.

### Request

**Headers:**
```http
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User email address |
| `password` | string | Yes | User password |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@company.com",
    "password": "securePassword123"
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "manager@company.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "manager",
      "organization_id": 1,
      "organization_name": "Acme Digital Agency",
      "last_login": "2024-01-15T10:30:00Z"
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 86400
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

**Invalid Credentials (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Account Disabled (403):**
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_DISABLED",
    "message": "Organization account is disabled"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email and password are required",
    "details": {
      "email": ["Email is required"],
      "password": ["Password is required"]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## POST `/api/auth/register`

Register a new user and organization.

### Request

**Headers:**
```http
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User email address |
| `password` | string | Yes | User password (min 8 characters) |
| `first_name` | string | Yes | User first name |
| `last_name` | string | Yes | User last name |
| `organization_name` | string | Yes | Organization name |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@company.com",
    "password": "securePassword123",
    "first_name": "Jane",
    "last_name": "Smith",
    "organization_name": "Smith Digital Marketing"
  }'
```

### Response

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 2,
      "email": "newuser@company.com",
      "first_name": "Jane",
      "last_name": "Smith",
      "role": "manager",
      "organization_id": 2,
      "organization_name": "Smith Digital Marketing"
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 86400
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

**Email Already Exists (400):**
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email address is already registered"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Please provide a valid email address"],
      "password": ["Password must be at least 8 characters long"],
      "first_name": ["First name is required"],
      "last_name": ["Last name is required"],
      "organization_name": ["Organization name is required"]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## POST `/api/auth/logout`

Logout current user and invalidate tokens.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/auth/logout \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json"
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## POST `/api/auth/refresh`

Refresh access token using refresh token.

### Request

**Headers:**
```http
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `refresh_token` | string | Yes | Valid refresh token |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 86400
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Invalid or expired refresh token"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## GET `/api/auth/me`

Get current authenticated user information.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Example Request:**
```bash
curl -X GET https://your-domain.com/api/auth/me \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "manager@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "manager",
    "organization_id": 1,
    "organization_name": "Acme Digital Agency",
    "last_login": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "is_active": true,
    "permissions": [
      "users.manage",
      "clients.manage",
      "posts.approve",
      "analytics.view_all"
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## POST `/api/auth/forgot-password`

Request password reset email.

### Request

**Headers:**
```http
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User email address |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@company.com"
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset instructions sent to your email",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Note:** For security reasons, this endpoint returns success even if the email doesn't exist.

---

## POST `/api/auth/reset-password`

Reset password using reset token.

### Request

**Headers:**
```http
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | Password reset token from email |
| `password` | string | Yes | New password (min 8 characters) |
| `confirm_password` | string | Yes | Password confirmation |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456",
    "password": "newSecurePassword123",
    "confirm_password": "newSecurePassword123"
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

**Invalid Token (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_RESET_TOKEN",
    "message": "Invalid or expired reset token"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Password Mismatch (400):**
```json
{
  "success": false,
  "error": {
    "code": "PASSWORD_MISMATCH",
    "message": "Password confirmation does not match"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## PUT `/api/auth/profile`

Update user profile information.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `first_name` | string | No | User first name |
| `last_name` | string | No | User last name |
| `email` | string | No | User email address |

**Example Request:**
```bash
curl -X PUT https://your-domain.com/api/auth/profile \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@company.com"
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "email": "john.doe@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "manager",
    "organization_id": 1,
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## PUT `/api/auth/change-password`

Change user password.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `current_password` | string | Yes | Current password |
| `new_password` | string | Yes | New password (min 8 characters) |
| `confirm_password` | string | Yes | Password confirmation |

**Example Request:**
```bash
curl -X PUT https://your-domain.com/api/auth/change-password \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "oldPassword123",
    "new_password": "newSecurePassword123",
    "confirm_password": "newSecurePassword123"
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

**Incorrect Current Password (400):**
```json
{
  "success": false,
  "error": {
    "code": "INCORRECT_PASSWORD",
    "message": "Current password is incorrect"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## JWT Token Structure

JWT tokens contain the following payload:

```json
{
  "sub": 1,
  "email": "manager@company.com",
  "role": "manager",
  "organization_id": 1,
  "iat": 1640995200,
  "exp": 1641081600
}
```

**Payload Fields:**
- `sub`: User ID
- `email`: User email
- `role`: User role (manager/designer)
- `organization_id`: Organization ID
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp

## Security Considerations

1. **Token Storage**: Store tokens securely in your application
2. **Token Expiry**: Access tokens expire in 24 hours, refresh tokens in 7 days
3. **HTTPS Only**: Always use HTTPS in production
4. **Rate Limiting**: Authentication endpoints are rate limited
5. **Password Policy**: Minimum 8 characters required

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Invalid email or password |
| `EMAIL_EXISTS` | Email address already registered |
| `ACCOUNT_DISABLED` | User or organization account disabled |
| `INVALID_REFRESH_TOKEN` | Invalid or expired refresh token |
| `INVALID_RESET_TOKEN` | Invalid or expired password reset token |
| `PASSWORD_MISMATCH` | Password confirmation doesn't match |
| `INCORRECT_PASSWORD` | Current password is incorrect |
| `VALIDATION_ERROR` | Input validation failed | 