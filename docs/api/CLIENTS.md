# Clients API

## Overview

The Clients API provides endpoints for managing client accounts within the Nellie platform. Clients represent the businesses or individuals whose social media presence you're managing.

## Base URL
```
/api/clients
```

## Authorization

All endpoints require:
- Valid JWT token
- Access level varies by user role

## Endpoints Summary

| Method | Endpoint | Description | Manager | Designer |
|--------|----------|-------------|---------|----------|
| GET | `/` | List clients | All | Assigned only |
| GET | `/{id}` | Get client details | All | Assigned only |
| POST | `/` | Create client | Yes | No |
| PUT | `/{id}` | Update client | Yes | No |
| DELETE | `/{id}` | Delete client | Yes | No |
| GET | `/{id}/stats` | Get client statistics | All | Assigned only |

---

## GET `/api/clients`

Retrieve list of clients based on user permissions.

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
| `sort` | string | No | Sort field (default: name) |
| `order` | string | No | Sort order: asc\|desc (default: asc) |
| `status` | string | No | Filter by status: active\|inactive |
| `search` | string | No | Search in name, email, and website |
| `assigned_only` | boolean | No | Show only assigned clients (for managers) |

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/clients?page=1&limit=10&status=active&search=tech" \
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
      "name": "Acme Corporation",
      "email": "contact@acme.com",
      "phone": "+1-555-123-4567",
      "website": "https://acme.com",
      "description": "Leading technology solutions provider",
      "logo_url": "https://your-domain.com/media/clients/1/logo.jpg",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-10T15:30:00Z",
      "stats": {
        "total_posts": 156,
        "published_posts": 142,
        "pending_posts": 8,
        "scheduled_posts": 6,
        "social_accounts": 5,
        "avg_engagement": 4.2
      },
      "social_accounts": [
        {
          "platform": "facebook",
          "account_name": "Acme Corp",
          "is_connected": true,
          "last_sync": "2024-01-15T09:00:00Z"
        },
        {
          "platform": "instagram",
          "account_name": "@acmecorp",
          "is_connected": true,
          "last_sync": "2024-01-15T09:00:00Z"
        },
        {
          "platform": "twitter",
          "account_name": "@AcmeCorp",
          "is_connected": true,
          "last_sync": "2024-01-15T09:00:00Z"
        }
      ],
      "assigned_users": [
        {
          "id": 2,
          "name": "Jane Smith",
          "role": "designer"
        }
      ]
    },
    {
      "id": 2,
      "name": "Tech Startup Inc",
      "email": "hello@techstartup.com",
      "phone": "+1-555-987-6543",
      "website": "https://techstartup.com",
      "description": "Innovative software solutions for modern businesses",
      "logo_url": "https://your-domain.com/media/clients/2/logo.jpg",
      "is_active": true,
      "created_at": "2024-01-05T00:00:00Z",
      "updated_at": "2024-01-12T10:15:00Z",
      "stats": {
        "total_posts": 89,
        "published_posts": 78,
        "pending_posts": 5,
        "scheduled_posts": 6,
        "social_accounts": 4,
        "avg_engagement": 5.8
      },
      "social_accounts": [
        {
          "platform": "linkedin",
          "account_name": "Tech Startup Inc",
          "is_connected": true,
          "last_sync": "2024-01-15T08:30:00Z"
        },
        {
          "platform": "twitter",
          "account_name": "@TechStartupInc",
          "is_connected": true,
          "last_sync": "2024-01-15T08:30:00Z"
        }
      ],
      "assigned_users": [
        {
          "id": 3,
          "name": "Bob Wilson",
          "role": "designer"
        }
      ]
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

---

## GET `/api/clients/{id}`

Get detailed information about a specific client.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Client ID |

**Example Request:**
```bash
curl -X GET https://your-domain.com/api/clients/1 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-555-123-4567",
    "website": "https://acme.com",
    "description": "Leading technology solutions provider specializing in enterprise software and cloud infrastructure.",
    "logo_url": "https://your-domain.com/media/clients/1/logo.jpg",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-10T15:30:00Z",
    "organization_id": 1,
    "social_accounts": [
      {
        "id": 1,
        "platform": "facebook",
        "account_id": "123456789",
        "account_name": "Acme Corp",
        "is_connected": true,
        "is_active": true,
        "last_sync": "2024-01-15T09:00:00Z",
        "followers_count": 15420,
        "posts_count": 89
      },
      {
        "id": 2,
        "platform": "instagram",
        "account_id": "acmecorp",
        "account_name": "@acmecorp",
        "is_connected": true,
        "is_active": true,
        "last_sync": "2024-01-15T09:00:00Z",
        "followers_count": 8750,
        "posts_count": 124
      },
      {
        "id": 3,
        "platform": "twitter",
        "account_id": "AcmeCorp",
        "account_name": "@AcmeCorp",
        "is_connected": true,
        "is_active": true,
        "last_sync": "2024-01-15T09:00:00Z",
        "followers_count": 12300,
        "posts_count": 67
      }
    ],
    "assigned_users": [
      {
        "id": 2,
        "email": "jane.smith@agency.com",
        "name": "Jane Smith",
        "role": "designer",
        "assigned_at": "2024-01-05T00:00:00Z"
      }
    ],
    "stats": {
      "total_posts": 156,
      "published_posts": 142,
      "pending_posts": 8,
      "scheduled_posts": 6,
      "draft_posts": 0,
      "rejected_posts": 4,
      "social_accounts": 3,
      "total_followers": 36470,
      "avg_engagement": 4.2,
      "posts_this_month": 23,
      "posts_this_week": 6,
      "last_post_published": "2024-01-14T16:30:00Z"
    },
    "recent_posts": [
      {
        "id": 45,
        "title": "New Product Launch",
        "content": "Exciting news! We're launching our new cloud platform...",
        "status": "published",
        "scheduled_at": "2024-01-14T16:30:00Z",
        "created_by": "Jane Smith",
        "platforms": ["facebook", "instagram", "twitter"]
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "CLIENT_NOT_FOUND",
    "message": "Client not found or access denied"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## POST `/api/clients`

Create a new client (Manager only).

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Client name |
| `email` | string | No | Client email address |
| `phone` | string | No | Client phone number |
| `website` | string | No | Client website URL |
| `description` | string | No | Client description |
| `logo` | file | No | Client logo (multipart/form-data) |
| `is_active` | boolean | No | Client status (default: true) |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/clients \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fashion Boutique Ltd",
    "email": "info@fashionboutique.com",
    "phone": "+1-555-456-7890",
    "website": "https://fashionboutique.com",
    "description": "Premium fashion retailer specializing in contemporary women\'s clothing and accessories.",
    "is_active": true
  }'
```

### Response

**Success Response (201):**
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "id": 3,
    "name": "Fashion Boutique Ltd",
    "email": "info@fashionboutique.com",
    "phone": "+1-555-456-7890",
    "website": "https://fashionboutique.com",
    "description": "Premium fashion retailer specializing in contemporary women's clothing and accessories.",
    "logo_url": null,
    "is_active": true,
    "organization_id": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "social_accounts": [],
    "assigned_users": [],
    "stats": {
      "total_posts": 0,
      "published_posts": 0,
      "pending_posts": 0,
      "scheduled_posts": 0,
      "social_accounts": 0,
      "avg_engagement": 0
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

**Insufficient Permissions (403):**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Manager role required to create clients"
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
      "name": ["Client name is required"],
      "email": ["Please provide a valid email address"],
      "website": ["Please provide a valid URL"]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## PUT `/api/clients/{id}`

Update an existing client (Manager only).

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Client ID |

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | No | Client name |
| `email` | string | No | Client email address |
| `phone` | string | No | Client phone number |
| `website` | string | No | Client website URL |
| `description` | string | No | Client description |
| `is_active` | boolean | No | Client status |

**Example Request:**
```bash
curl -X PUT https://your-domain.com/api/clients/3 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fashion Boutique Limited",
    "description": "Premium fashion retailer specializing in contemporary women\'s clothing, accessories, and seasonal collections.",
    "phone": "+1-555-456-7890",
    "is_active": true
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Client updated successfully",
  "data": {
    "id": 3,
    "name": "Fashion Boutique Limited",
    "email": "info@fashionboutique.com",
    "phone": "+1-555-456-7890",
    "website": "https://fashionboutique.com",
    "description": "Premium fashion retailer specializing in contemporary women's clothing, accessories, and seasonal collections.",
    "logo_url": null,
    "is_active": true,
    "organization_id": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

---

## DELETE `/api/clients/{id}`

Delete a client (Manager only).

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Client ID |

**Example Request:**
```bash
curl -X DELETE https://your-domain.com/api/clients/3 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Client deleted successfully",
  "timestamp": "2024-01-15T11:00:00Z"
}
```

**Error Responses:**

**Client Has Active Posts (400):**
```json
{
  "success": false,
  "error": {
    "code": "CLIENT_HAS_ACTIVE_POSTS",
    "message": "Cannot delete client with active posts. Please remove or reassign posts first."
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

**Client Has Social Accounts (400):**
```json
{
  "success": false,
  "error": {
    "code": "CLIENT_HAS_SOCIAL_ACCOUNTS",
    "message": "Cannot delete client with connected social accounts. Please disconnect accounts first."
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

---

## GET `/api/clients/{id}/stats`

Get detailed statistics for a specific client.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Client ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | Time period: 7d\|30d\|90d\|1y (default: 30d) |
| `platforms` | string | No | Comma-separated platforms to include |

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/clients/1/stats?period=30d&platforms=facebook,instagram" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "client_id": 1,
    "client_name": "Acme Corporation",
    "period": "30d",
    "summary": {
      "total_posts": 23,
      "published_posts": 21,
      "pending_posts": 2,
      "scheduled_posts": 4,
      "total_engagement": 2840,
      "avg_engagement_rate": 4.2,
      "total_reach": 45600,
      "total_impressions": 128400,
      "followers_gained": 156,
      "best_performing_platform": "instagram"
    },
    "by_platform": {
      "facebook": {
        "posts": 8,
        "likes": 642,
        "comments": 89,
        "shares": 34,
        "reach": 15200,
        "impressions": 42100,
        "engagement_rate": 3.8
      },
      "instagram": {
        "posts": 12,
        "likes": 1205,
        "comments": 167,
        "shares": 45,
        "reach": 22400,
        "impressions": 58900,
        "engagement_rate": 5.1
      },
      "twitter": {
        "posts": 3,
        "likes": 387,
        "comments": 23,
        "shares": 67,
        "reach": 8000,
        "impressions": 27400,
        "engagement_rate": 3.2
      }
    },
    "top_posts": [
      {
        "id": 45,
        "title": "New Product Launch",
        "platform": "instagram",
        "published_at": "2024-01-14T16:30:00Z",
        "engagement": {
          "likes": 234,
          "comments": 45,
          "shares": 12,
          "total": 291
        },
        "reach": 5600,
        "impressions": 12400
      },
      {
        "id": 43,
        "title": "Behind the Scenes",
        "platform": "facebook",
        "published_at": "2024-01-12T14:15:00Z",
        "engagement": {
          "likes": 189,
          "comments": 34,
          "shares": 23,
          "total": 246
        },
        "reach": 4200,
        "impressions": 9800
      }
    ],
    "engagement_trend": [
      {
        "date": "2024-01-01",
        "posts": 1,
        "engagement": 156
      },
      {
        "date": "2024-01-02", 
        "posts": 0,
        "engagement": 0
      },
      {
        "date": "2024-01-03",
        "posts": 2,
        "engagement": 234
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Client Logo Upload

To upload a client logo, use multipart/form-data:

```bash
curl -X POST https://your-domain.com/api/clients \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -F "name=Fashion Boutique Ltd" \
  -F "email=info@fashionboutique.com" \
  -F "logo=@/path/to/logo.jpg"
```

**Logo Requirements:**
- Format: JPG, PNG, or GIF
- Max size: 5MB
- Recommended dimensions: 400x400px
- Aspect ratio: Square (1:1) recommended

## Access Control

### Manager Access
- Full CRUD operations on all clients
- Can assign/unassign users to clients
- Can view statistics for all clients

### Designer Access
- Read-only access to assigned clients only
- Can view basic statistics for assigned clients
- Cannot create, update, or delete clients

## Client Statistics Explained

### Engagement Metrics
- **Likes**: Total likes across all platforms
- **Comments**: Total comments/replies
- **Shares**: Total shares/retweets/reposts
- **Engagement Rate**: (Total Engagement / Total Impressions) × 100

### Reach & Impressions
- **Reach**: Unique users who saw the content
- **Impressions**: Total number of times content was displayed

### Platform Performance
- Statistics are calculated per platform
- Aggregated into client-level metrics
- Historical trends available for analysis

## Error Codes

| Code | Description |
|------|-------------|
| `CLIENT_NOT_FOUND` | Client doesn't exist or access denied |
| `INSUFFICIENT_PERMISSIONS` | Manager role required |
| `CLIENT_HAS_ACTIVE_POSTS` | Cannot delete client with posts |
| `CLIENT_HAS_SOCIAL_ACCOUNTS` | Cannot delete client with connected accounts |
| `INVALID_LOGO_FORMAT` | Logo file format not supported |
| `LOGO_TOO_LARGE` | Logo file exceeds size limit |
| `VALIDATION_ERROR` | Input validation failed |

## Best Practices

1. **Client Organization**: Use clear, descriptive names and maintain updated contact information
2. **Logo Management**: Use high-quality square logos for best display across platforms
3. **User Assignment**: Regularly review and update designer-client assignments
4. **Status Management**: Use active/inactive status rather than deletion to preserve historical data
5. **Statistics Monitoring**: Regularly review client performance metrics to optimize content strategy 