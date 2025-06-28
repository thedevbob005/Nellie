# Users API

## Overview

The Users API provides endpoints for managing team members within an organization. Only users with `manager` role can access these endpoints for creating, updating, and managing other users.

## Base URL
```
/api/users
```

## Authorization

All endpoints require:
- Valid JWT token
- `manager` role

## Endpoints Summary

| Method | Endpoint | Description | Manager Only |
|--------|----------|-------------|--------------|
| GET | `/` | List all users | Yes |
| GET | `/{id}` | Get user details | Yes |
| POST | `/` | Create new user | Yes |
| PUT | `/{id}` | Update user | Yes |
| DELETE | `/{id}` | Delete user | Yes |
| POST | `/{id}/reset-password` | Reset user password | Yes |

---

## GET `/api/users`

Retrieve list of all users in the organization.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 25, max: 100) |
| `sort` | string | No | Sort field (default: created_at) |
| `order` | string | No | Sort order: asc\|desc (default: desc) |
| `role` | string | No | Filter by role: manager\|designer |
| `status` | string | No | Filter by status: active\|inactive |
| `search` | string | No | Search in name and email |

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/users?page=1&limit=10&role=designer&search=john" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "manager@company.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "manager",
      "is_active": true,
      "last_login": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "stats": {
        "posts_created": 25,
        "clients_assigned": 5,
        "approval_rate": 95.5
      }
    },
    {
      "id": 2,
      "email": "designer@company.com",
      "first_name": "Jane",
      "last_name": "Smith",
      "role": "designer",
      "is_active": true,
      "last_login": "2024-01-14T15:20:00Z",
      "created_at": "2024-01-05T00:00:00Z",
      "updated_at": "2024-01-14T15:20:00Z",
      "assigned_clients": [
        {
          "id": 1,
          "name": "Acme Corporation"
        },
        {
          "id": 3,
          "name": "Tech Startup Inc"
        }
      ],
      "stats": {
        "posts_created": 142,
        "posts_approved": 135,
        "posts_pending": 7,
        "approval_rate": 95.1
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 2,
    "items_per_page": 10,
    "has_next": false,
    "has_prev": false
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Manager role required"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## GET `/api/users/{id}`

Get detailed information about a specific user.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User ID |

**Example Request:**
```bash
curl -X GET https://your-domain.com/api/users/2 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "designer@company.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "designer",
    "is_active": true,
    "last_login": "2024-01-14T15:20:00Z",
    "created_at": "2024-01-05T00:00:00Z",
    "updated_at": "2024-01-14T15:20:00Z",
    "organization_id": 1,
    "assigned_clients": [
      {
        "id": 1,
        "name": "Acme Corporation",
        "is_active": true,
        "assigned_at": "2024-01-05T00:00:00Z"
      },
      {
        "id": 3,
        "name": "Tech Startup Inc",
        "is_active": true,
        "assigned_at": "2024-01-10T00:00:00Z"
      }
    ],
    "stats": {
      "posts_created": 142,
      "posts_approved": 135,
      "posts_rejected": 3,
      "posts_pending": 7,
      "approval_rate": 95.1,
      "avg_approval_time": "2.5 hours",
      "last_post_created": "2024-01-14T12:00:00Z"
    },
    "activity": {
      "login_count": 45,
      "last_activity": "2024-01-14T15:20:00Z",
      "posts_this_month": 23,
      "posts_this_week": 8
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## POST `/api/users`

Create a new user in the organization.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User email address |
| `password` | string | Yes | User password (min 8 characters) |
| `first_name` | string | Yes | User first name |
| `last_name` | string | Yes | User last name |
| `role` | string | Yes | User role: manager\|designer |
| `is_active` | boolean | No | Account status (default: true) |
| `assigned_clients` | array | No | Array of client IDs (for designers only) |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/users \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newdesigner@company.com",
    "password": "securePassword123",
    "first_name": "Bob",
    "last_name": "Wilson",
    "role": "designer",
    "is_active": true,
    "assigned_clients": [1, 3, 5]
  }'
```

### Response

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 3,
    "email": "newdesigner@company.com",
    "first_name": "Bob",
    "last_name": "Wilson",
    "role": "designer",
    "is_active": true,
    "organization_id": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "assigned_clients": [
      {
        "id": 1,
        "name": "Acme Corporation"
      },
      {
        "id": 3,
        "name": "Tech Startup Inc"
      },
      {
        "id": 5,
        "name": "Local Business Co"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

**Email Exists (400):**
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email address is already in use"
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
      "role": ["Role must be manager or designer"]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## PUT `/api/users/{id}`

Update an existing user.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User ID |

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | No | User email address |
| `first_name` | string | No | User first name |
| `last_name` | string | No | User last name |
| `role` | string | No | User role: manager\|designer |
| `is_active` | boolean | No | Account status |
| `assigned_clients` | array | No | Array of client IDs (for designers only) |
| `password` | string | No | New password (if changing) |

**Example Request:**
```bash
curl -X PUT https://your-domain.com/api/users/3 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Robert",
    "last_name": "Wilson",
    "is_active": true,
    "assigned_clients": [1, 3, 5, 7]
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 3,
    "email": "newdesigner@company.com",
    "first_name": "Robert",
    "last_name": "Wilson",
    "role": "designer",
    "is_active": true,
    "organization_id": 1,
    "updated_at": "2024-01-15T11:00:00Z",
    "assigned_clients": [
      {
        "id": 1,
        "name": "Acme Corporation"
      },
      {
        "id": 3,
        "name": "Tech Startup Inc"
      },
      {
        "id": 5,
        "name": "Local Business Co"
      },
      {
        "id": 7,
        "name": "Fashion Boutique"
      }
    ]
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

---

## DELETE `/api/users/{id}`

Delete a user from the organization.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User ID |

**Example Request:**
```bash
curl -X DELETE https://your-domain.com/api/users/3 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "timestamp": "2024-01-15T11:00:00Z"
}
```

**Error Responses:**

**User Not Found (404):**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

**Cannot Delete Self (400):**
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_DELETE_SELF",
    "message": "You cannot delete your own account"
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

**Has Active Posts (400):**
```json
{
  "success": false,
  "error": {
    "code": "USER_HAS_ACTIVE_POSTS",
    "message": "Cannot delete user with active posts. Please reassign or remove posts first."
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

---

## POST `/api/users/{id}/reset-password`

Reset password for a specific user.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User ID |

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `password` | string | Yes | New password (min 8 characters) |
| `notify_user` | boolean | No | Send email notification (default: true) |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/users/3/reset-password \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "password": "newSecurePassword123",
    "notify_user": true
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. User has been notified via email.",
  "timestamp": "2024-01-15T11:00:00Z"
}
```

## User Roles & Permissions

### Manager Role Permissions
- Create, read, update, delete users
- Manage client assignments
- Approve/reject posts
- View all analytics
- Manage organization settings

### Designer Role Permissions
- Create and edit own posts
- View assigned clients only
- View basic analytics for own posts
- Update own profile

## Client Assignment Rules

1. **Managers**: Have access to all clients automatically
2. **Designers**: Only have access to specifically assigned clients
3. **Assignment Changes**: Take effect immediately
4. **Reassignment**: Posts created for a client remain with original designer

## User Statistics

The API provides comprehensive statistics for each user:

### Manager Statistics
- Total users managed
- Total clients
- Posts approved/rejected this month
- Average approval time
- System usage metrics

### Designer Statistics
- Posts created (total/monthly/weekly)
- Approval rate
- Average time to approval
- Assigned clients count
- Recent activity

## Error Codes

| Code | Description |
|------|-------------|
| `INSUFFICIENT_PERMISSIONS` | Manager role required |
| `USER_NOT_FOUND` | User ID doesn't exist |
| `EMAIL_EXISTS` | Email already in use |
| `CANNOT_DELETE_SELF` | Cannot delete own account |
| `USER_HAS_ACTIVE_POSTS` | User has pending posts |
| `INVALID_CLIENT_ASSIGNMENT` | Client doesn't exist or not accessible |
| `VALIDATION_ERROR` | Input validation failed |

## Best Practices

1. **Role Assignment**: Carefully consider role assignments as they determine access levels
2. **Client Assignment**: Regularly review designer-client assignments
3. **Password Security**: Use strong passwords and consider password policies
4. **User Deactivation**: Prefer deactivating users over deletion to maintain data integrity
5. **Audit Trail**: Monitor user creation and modification activities 