# Social Accounts API

## Overview

The Social Accounts API manages social media platform connections for clients, handles OAuth authentication flows, and maintains platform-specific settings and tokens.

## Base URL
```
/api/social-accounts
/api/oauth
```

## Supported Platforms

- **Facebook** - Pages and profiles
- **Instagram** - Business accounts
- **Twitter/X** - Personal and business accounts
- **LinkedIn** - Personal profiles and company pages
- **YouTube** - Channels
- **Threads** - Personal and creator accounts

## Endpoints Summary

| Method | Endpoint | Description | Manager | Designer |
|--------|----------|-------------|---------|----------|
| GET | `/social-accounts` | List social accounts | All | Assigned clients |
| GET | `/social-accounts/{id}` | Get account details | All | Assigned clients |
| POST | `/social-accounts` | Add social account | Yes | No |
| PUT | `/social-accounts/{id}` | Update account | Yes | No |
| DELETE | `/social-accounts/{id}` | Remove account | Yes | No |
| POST | `/social-accounts/{id}/refresh-token` | Refresh OAuth token | Yes | No |
| GET | `/social-accounts/{id}/test-connection` | Test connection | Yes | No |
| POST | `/oauth/init` | Initialize OAuth flow | Yes | No |
| GET | `/oauth/callback` | OAuth callback handler | System | System |

---

## GET `/api/social-accounts`

Retrieve list of social media accounts based on user permissions.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client_id` | integer | No | Filter by client |
| `platform` | string | No | Filter by platform |
| `status` | string | No | Filter by status: active\|inactive\|error |
| `connected` | boolean | No | Filter by connection status |

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/social-accounts?client_id=1&platform=facebook" \
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
      "client_id": 1,
      "client_name": "Acme Corporation",
      "platform": "facebook",
      "account_id": "123456789012345",
      "account_name": "Acme Corp Official",
      "account_username": "acmecorp",
      "account_url": "https://facebook.com/acmecorp",
      "is_connected": true,
      "is_active": true,
      "connection_status": "connected",
      "last_sync": "2024-01-15T09:00:00Z",
      "token_expires_at": "2024-03-15T09:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T09:00:00Z",
      "account_data": {
        "followers_count": 15420,
        "following_count": 1250,
        "posts_count": 342,
        "account_type": "business",
        "verification_status": "verified",
        "profile_image": "https://facebook.com/profile_image.jpg",
        "cover_image": "https://facebook.com/cover_image.jpg"
      },
      "permissions": [
        "pages_manage_posts",
        "pages_read_engagement",
        "pages_show_list"
      ],
      "platform_features": {
        "supports_scheduling": true,
        "supports_stories": true,
        "supports_video": true,
        "max_post_length": 63206,
        "max_media_count": 10
      }
    },
    {
      "id": 2,
      "client_id": 1,
      "client_name": "Acme Corporation",
      "platform": "instagram",
      "account_id": "acmecorp",
      "account_name": "Acme Corporation",
      "account_username": "acmecorp",
      "account_url": "https://instagram.com/acmecorp",
      "is_connected": true,
      "is_active": true,
      "connection_status": "connected",
      "last_sync": "2024-01-15T09:15:00Z",
      "token_expires_at": "2024-03-15T09:15:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T09:15:00Z",
      "account_data": {
        "followers_count": 8750,
        "following_count": 890,
        "posts_count": 156,
        "account_type": "business",
        "verification_status": "unverified",
        "profile_image": "https://instagram.com/profile_image.jpg",
        "bio": "Leading technology solutions provider. Building the future of cloud computing. 🚀"
      },
      "permissions": [
        "instagram_basic",
        "instagram_content_publish"
      ],
      "platform_features": {
        "supports_scheduling": true,
        "supports_stories": true,
        "supports_reels": true,
        "max_post_length": 2200,
        "max_media_count": 10
      }
    }
  ],
  "summary": {
    "total_accounts": 5,
    "connected_accounts": 4,
    "platforms": ["facebook", "instagram", "twitter", "linkedin"],
    "expiring_tokens": 1
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## GET `/api/social-accounts/{id}`

Get detailed information about a specific social media account.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Social account ID |

**Example Request:**
```bash
curl -X GET https://your-domain.com/api/social-accounts/1 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "client_id": 1,
    "client": {
      "id": 1,
      "name": "Acme Corporation",
      "logo_url": "https://your-domain.com/media/clients/1/logo.jpg"
    },
    "platform": "facebook",
    "account_id": "123456789012345",
    "account_name": "Acme Corp Official",
    "account_username": "acmecorp",
    "account_url": "https://facebook.com/acmecorp",
    "is_connected": true,
    "is_active": true,
    "connection_status": "connected",
    "last_sync": "2024-01-15T09:00:00Z",
    "token_expires_at": "2024-03-15T09:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T09:00:00Z",
    "account_data": {
      "followers_count": 15420,
      "following_count": 1250,
      "posts_count": 342,
      "account_type": "business",
      "verification_status": "verified",
      "profile_image": "https://facebook.com/profile_image.jpg",
      "cover_image": "https://facebook.com/cover_image.jpg",
      "description": "Leading technology solutions provider specializing in enterprise software and cloud infrastructure.",
      "website": "https://acme.com",
      "location": "San Francisco, CA",
      "founded": "2010"
    },
    "permissions": [
      "pages_manage_posts",
      "pages_read_engagement",
      "pages_show_list",
      "publish_to_groups"
    ],
    "platform_features": {
      "supports_scheduling": true,
      "supports_stories": true,
      "supports_video": true,
      "supports_live": true,
      "max_post_length": 63206,
      "max_media_count": 10,
      "supported_media_types": ["image", "video", "gif"],
      "video_max_duration": 14400,
      "image_max_size": "10MB"
    },
    "recent_activity": {
      "posts_published": 15,
      "last_post_date": "2024-01-14T16:30:00Z",
      "engagement_rate": 4.2,
      "avg_reach": 12500
    },
    "connection_health": {
      "status": "healthy",
      "last_error": null,
      "consecutive_failures": 0,
      "rate_limit_status": "normal",
      "token_validity": "valid"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## POST `/api/oauth/init`

Initialize OAuth authentication flow for connecting a social media account.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `platform` | string | Yes | Platform name |
| `client_id` | integer | Yes | Client ID to connect account to |
| `account_type` | string | No | Account type (page\|profile\|business) |
| `redirect_url` | string | No | Custom redirect URL |

**Platform Values:**
- `facebook`
- `instagram`
- `twitter`
- `linkedin`
- `youtube`
- `threads`

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/oauth/init \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "facebook",
    "client_id": 1,
    "account_type": "page"
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "auth_url": "https://www.facebook.com/v18.0/dialog/oauth?client_id=123456789&redirect_uri=https%3A%2F%2Fyour-domain.com%2Fapi%2Foauth%2Fcallback&scope=pages_manage_posts%2Cpages_read_engagement&response_type=code&state=abc123def456",
    "state": "abc123def456",
    "expires_in": 600,
    "platform": "facebook",
    "client_id": 1,
    "required_permissions": [
      "pages_manage_posts",
      "pages_read_engagement",
      "pages_show_list"
    ],
    "instructions": "Click the authorization URL to connect your Facebook account. You will be redirected back to complete the connection."
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## GET `/api/oauth/callback`

OAuth callback endpoint (handled automatically by the system).

### Request

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Authorization code from platform |
| `state` | string | Yes | State parameter for security |
| `error` | string | No | Error code if authorization failed |

### Response

**Success Response (302):**
Redirects to client application with success/error status.

**Success Redirect:**
```
https://your-client-app.com/social-accounts?status=success&platform=facebook&account_id=123456789
```

**Error Redirect:**
```
https://your-client-app.com/social-accounts?status=error&error=access_denied&platform=facebook
```

---

## POST `/api/social-accounts/{id}/refresh-token`

Refresh OAuth token for a social media account.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Social account ID |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/social-accounts/1/refresh-token \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json"
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "id": 1,
    "platform": "facebook",
    "account_name": "Acme Corp Official",
    "token_expires_at": "2024-05-15T09:00:00Z",
    "connection_status": "connected",
    "last_sync": "2024-01-15T11:00:00Z"
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_REFRESH_FAILED",
    "message": "Failed to refresh token. Re-authentication required.",
    "details": {
      "platform_error": "invalid_grant",
      "requires_reauth": true
    }
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

---

## GET `/api/social-accounts/{id}/test-connection`

Test the connection status of a social media account.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Social account ID |

**Example Request:**
```bash
curl -X GET https://your-domain.com/api/social-accounts/1/test-connection \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "account_id": 1,
    "platform": "facebook",
    "connection_status": "connected",
    "test_results": {
      "authentication": {
        "status": "success",
        "token_valid": true,
        "token_expires_at": "2024-03-15T09:00:00Z"
      },
      "permissions": {
        "status": "success",
        "granted_permissions": [
          "pages_manage_posts",
          "pages_read_engagement",
          "pages_show_list"
        ],
        "missing_permissions": []
      },
      "api_access": {
        "status": "success",
        "can_read_profile": true,
        "can_publish_posts": true,
        "can_access_insights": true
      },
      "rate_limits": {
        "status": "normal",
        "remaining_calls": 890,
        "reset_time": "2024-01-15T12:00:00Z"
      }
    },
    "account_info": {
      "account_name": "Acme Corp Official",
      "followers_count": 15420,
      "verification_status": "verified",
      "last_post_date": "2024-01-14T16:30:00Z"
    }
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "CONNECTION_TEST_FAILED",
    "message": "Connection test failed",
    "details": {
      "authentication": {
        "status": "failed",
        "token_valid": false,
        "error": "Token expired"
      },
      "permissions": {
        "status": "partial",
        "missing_permissions": ["pages_manage_posts"]
      },
      "requires_action": "re_authentication"
    }
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

---

## DELETE `/api/social-accounts/{id}`

Remove a social media account connection.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Social account ID |

**Example Request:**
```bash
curl -X DELETE https://your-domain.com/api/social-accounts/1 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Social account disconnected successfully",
  "data": {
    "id": 1,
    "platform": "facebook",
    "account_name": "Acme Corp Official",
    "client_name": "Acme Corporation",
    "disconnected_at": "2024-01-15T11:30:00Z"
  },
  "timestamp": "2024-01-15T11:30:00Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_HAS_SCHEDULED_POSTS",
    "message": "Cannot disconnect account with scheduled posts",
    "details": {
      "scheduled_posts_count": 5,
      "next_scheduled_post": "2024-01-20T09:00:00Z"
    }
  },
  "timestamp": "2024-01-15T11:30:00Z"
}
```

---

## Platform-Specific Details

### Facebook
**OAuth Scopes:**
- `pages_manage_posts` - Publish posts to pages
- `pages_read_engagement` - Read page insights
- `pages_show_list` - Access user's pages

**Features:**
- Page posts, photos, videos
- Stories (24-hour posts)
- Scheduling support
- Analytics and insights

### Instagram
**OAuth Scopes:**
- `instagram_basic` - Basic profile access
- `instagram_content_publish` - Publish content

**Features:**
- Feed posts (single images, carousels)
- Stories and Reels
- IGTV videos
- Hashtag and location tagging

### Twitter/X
**OAuth Scopes:**
- `tweet.read` - Read tweets
- `tweet.write` - Create tweets
- `users.read` - Read user information
- `offline.access` - Refresh tokens

**Features:**
- Regular tweets (280 characters)
- Media tweets (images, videos, GIFs)
- Thread creation
- Reply and quote tweets

### LinkedIn
**OAuth Scopes:**
- `w_member_social` - Share content
- `r_basicprofile` - Basic profile access
- `r_organization_social` - Company page access

**Features:**
- Personal posts and articles
- Company page posts
- Professional targeting
- Document sharing

### YouTube
**OAuth Scopes:**
- `youtube.upload` - Upload videos
- `youtube` - Manage channel
- `youtube.readonly` - Read channel data

**Features:**
- Video uploads
- Community posts (for eligible channels)
- Shorts (vertical videos)
- Live streaming

## Error Codes

| Code | Description |
|------|-------------|
| `SOCIAL_ACCOUNT_NOT_FOUND` | Account doesn't exist or access denied |
| `PLATFORM_NOT_SUPPORTED` | Platform not supported |
| `OAUTH_ERROR` | OAuth authentication failed |
| `TOKEN_EXPIRED` | Access token expired |
| `TOKEN_REFRESH_FAILED` | Failed to refresh token |
| `INSUFFICIENT_PERMISSIONS` | Missing required permissions |
| `CONNECTION_TEST_FAILED` | Connection test failed |
| `ACCOUNT_HAS_SCHEDULED_POSTS` | Cannot disconnect with scheduled posts |
| `RATE_LIMIT_EXCEEDED` | Platform rate limit exceeded |
| `PLATFORM_API_ERROR` | External platform API error |

## Best Practices

1. **Token Management**: Monitor token expiration and refresh proactively
2. **Permission Checks**: Verify permissions before attempting operations
3. **Error Handling**: Implement robust error handling for platform APIs
4. **Rate Limiting**: Respect platform rate limits to avoid blocks
5. **Regular Testing**: Periodically test connections to catch issues early
6. **User Communication**: Inform users when re-authentication is required 