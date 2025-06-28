# Posts API

## Overview

The Posts API handles content creation, management, approval workflow, publishing, and scheduling across multiple social media platforms. This is the core content management system of Nellie.

## Base URL
```
/api/posts
```

## Authorization

All endpoints require valid JWT token. Access varies by user role and post ownership.

## Post Workflow States

```
draft → pending_approval → approved → scheduled → published
  ↓              ↓           ↓
cancelled    rejected    cancelled
```

## Endpoints Summary

| Method | Endpoint | Description | Manager | Designer |
|--------|----------|-------------|---------|----------|
| GET | `/` | List posts | All | Own + Assigned |
| GET | `/{id}` | Get post details | All | Own + Assigned |
| POST | `/` | Create post | Yes | Yes |
| PUT | `/{id}` | Update post | All | Own (if draft) |
| DELETE | `/{id}` | Delete post | All | Own (if draft) |
| POST | `/{id}/submit` | Submit for approval | No | Yes |
| POST | `/{id}/approve` | Approve post | Yes | No |
| POST | `/{id}/reject` | Reject post | Yes | No |
| POST | `/{id}/publish` | Publish immediately | Yes | No |
| POST | `/{id}/schedule` | Schedule post | Yes | Yes |
| GET | `/queue` | Get publishing queue | Yes | Assigned |
| POST | `/process-queue` | Process publishing queue | System | System |
| POST | `/optimize-content` | Optimize content | Yes | Yes |
| GET | `/best-times` | Get best posting times | Yes | Yes |

---

## GET `/api/posts`

Retrieve list of posts based on user permissions and filters.

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
| `status` | string | No | Filter by status |
| `client_id` | integer | No | Filter by client |
| `platform` | string | No | Filter by platform |
| `created_by` | integer | No | Filter by creator |
| `date_from` | string | No | Filter from date (ISO 8601) |
| `date_to` | string | No | Filter to date (ISO 8601) |
| `search` | string | No | Search in title and content |

**Available Statuses:**
- `draft` - Post being created
- `pending_approval` - Submitted for manager review
- `approved` - Approved and ready for scheduling
- `scheduled` - Scheduled for future publishing
- `published` - Successfully published
- `failed` - Publishing failed
- `cancelled` - Cancelled by user
- `rejected` - Rejected by manager

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/posts?status=pending_approval&client_id=1&page=1&limit=10" \
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
      "title": "New Product Launch Announcement",
      "content": "We're excited to announce the launch of our revolutionary new cloud platform! 🚀\n\nKey features:\n✅ 99.9% uptime guarantee\n✅ Advanced security\n✅ Seamless integration\n\nLearn more: https://acme.com/new-platform\n\n#TechInnovation #CloudComputing #ProductLaunch",
      "status": "pending_approval",
      "client_id": 1,
      "client_name": "Acme Corporation",
      "created_by": 2,
      "created_by_name": "Jane Smith",
      "scheduled_at": "2024-01-20T14:00:00Z",
      "published_at": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T11:00:00Z",
      "platforms": [
        {
          "platform": "facebook",
          "status": "pending",
          "platform_specific": {
            "post_type": "text_with_link",
            "link_preview": true
          }
        },
        {
          "platform": "instagram",
          "status": "pending",
          "platform_specific": {
            "post_type": "carousel",
            "hashtags": "#TechInnovation #CloudComputing #ProductLaunch"
          }
        },
        {
          "platform": "linkedin",
          "status": "pending",
          "platform_specific": {
            "post_type": "article",
            "target_audience": "technology_professionals"
          }
        }
      ],
      "media_files": [
        {
          "id": 1,
          "type": "image",
          "url": "https://your-domain.com/media/posts/1/hero-image.jpg",
          "filename": "hero-image.jpg",
          "size": 1024000,
          "dimensions": {
            "width": 1920,
            "height": 1080
          }
        }
      ],
      "approval": {
        "status": "pending",
        "submitted_at": "2024-01-15T11:00:00Z",
        "feedback": null,
        "approved_by": null,
        "approved_at": null
      },
      "stats": {
        "estimated_reach": 15000,
        "engagement_prediction": "high",
        "best_time_score": 85
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 67,
    "items_per_page": 25,
    "has_next": true,
    "has_prev": false
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

---

## GET `/api/posts/{id}`

Get detailed information about a specific post.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Post ID |

**Example Request:**
```bash
curl -X GET https://your-domain.com/api/posts/1 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "New Product Launch Announcement",
    "content": "We're excited to announce the launch of our revolutionary new cloud platform! 🚀\n\nKey features:\n✅ 99.9% uptime guarantee\n✅ Advanced security\n✅ Seamless integration\n\nLearn more: https://acme.com/new-platform\n\n#TechInnovation #CloudComputing #ProductLaunch",
    "status": "pending_approval",
    "client_id": 1,
    "client": {
      "id": 1,
      "name": "Acme Corporation",
      "logo_url": "https://your-domain.com/media/clients/1/logo.jpg"
    },
    "created_by": 2,
    "creator": {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane.smith@agency.com",
      "role": "designer"
    },
    "scheduled_at": "2024-01-20T14:00:00Z",
    "published_at": null,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:00:00Z",
    "is_recurring": false,
    "recurring_pattern": null,
    "platforms": [
      {
        "id": 1,
        "platform": "facebook",
        "status": "pending",
        "post_id": null,
        "published_at": null,
        "error_message": null,
        "platform_specific": {
          "post_type": "text_with_link",
          "link_preview": true,
          "target_audience": "all",
          "boost_eligible": true
        },
        "metrics": null
      },
      {
        "id": 2,
        "platform": "instagram",
        "status": "pending",
        "post_id": null,
        "published_at": null,
        "error_message": null,
        "platform_specific": {
          "post_type": "carousel",
          "hashtags": "#TechInnovation #CloudComputing #ProductLaunch",
          "location": null,
          "alt_text": "New cloud platform announcement with feature highlights"
        },
        "metrics": null
      }
    ],
    "media_files": [
      {
        "id": 1,
        "type": "image",
        "url": "https://your-domain.com/media/posts/1/hero-image.jpg",
        "thumbnail_url": "https://your-domain.com/media/posts/1/hero-image-thumb.jpg",
        "filename": "hero-image.jpg",
        "original_filename": "product-launch-hero.jpg",
        "mime_type": "image/jpeg",
        "size": 1024000,
        "dimensions": {
          "width": 1920,
          "height": 1080
        },
        "uploaded_at": "2024-01-15T10:45:00Z"
      }
    ],
    "approval": {
      "status": "pending",
      "submitted_at": "2024-01-15T11:00:00Z",
      "feedback": null,
      "approved_by": null,
      "approved_at": null,
      "rejection_reason": null,
      "approval_history": [
        {
          "action": "submitted",
          "performed_by": "Jane Smith",
          "performed_at": "2024-01-15T11:00:00Z",
          "notes": "Ready for review - targeting tech professionals"
        }
      ]
    },
    "analytics": {
      "estimated_reach": 15000,
      "engagement_prediction": "high",
      "best_time_score": 85,
      "hashtag_effectiveness": 78,
      "content_sentiment": "positive",
      "readability_score": 82
    },
    "version_history": [
      {
        "version": 1,
        "created_at": "2024-01-15T10:30:00Z",
        "changes": "Initial creation",
        "created_by": "Jane Smith"
      },
      {
        "version": 2,
        "created_at": "2024-01-15T10:45:00Z",
        "changes": "Added media file and platform-specific settings",
        "created_by": "Jane Smith"
      }
    ]
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

---

## POST `/api/posts`

Create a new post.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Post title |
| `content` | string | Yes | Post content |
| `client_id` | integer | Yes | Client ID |
| `platforms` | array | Yes | Target platforms |
| `scheduled_at` | string | No | Schedule date (ISO 8601) |
| `media_files` | array | No | Array of media file IDs |
| `platform_specific` | object | No | Platform-specific settings |
| `is_recurring` | boolean | No | Recurring post flag |
| `recurring_pattern` | string | No | Recurring pattern |

**Platform Options:**
- `facebook`
- `instagram`
- `twitter`
- `linkedin`
- `youtube`
- `threads`

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/posts \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekend Motivation",
    "content": "Start your weekend with positive energy! 💪\n\nRemember: Every small step counts toward your bigger goals.\n\n#WeekendMotivation #Success #Mindset",
    "client_id": 1,
    "platforms": ["facebook", "instagram", "twitter"],
    "scheduled_at": "2024-01-20T09:00:00Z",
    "media_files": [15, 16],
    "platform_specific": {
      "instagram": {
        "post_type": "carousel",
        "hashtags": "#WeekendMotivation #Success #Mindset #Inspiration",
        "location": "New York, NY"
      },
      "facebook": {
        "post_type": "text_with_media",
        "target_audience": "engaged_users"
      },
      "twitter": {
        "thread_mode": false
      }
    }
  }'
```

### Response

**Success Response (201):**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": 25,
    "title": "Weekend Motivation",
    "content": "Start your weekend with positive energy! 💪\n\nRemember: Every small step counts toward your bigger goals.\n\n#WeekendMotivation #Success #Mindset",
    "status": "draft",
    "client_id": 1,
    "client_name": "Acme Corporation",
    "created_by": 2,
    "created_by_name": "Jane Smith",
    "scheduled_at": "2024-01-20T09:00:00Z",
    "created_at": "2024-01-15T12:30:00Z",
    "updated_at": "2024-01-15T12:30:00Z",
    "platforms": [
      {
        "platform": "facebook",
        "status": "pending",
        "platform_specific": {
          "post_type": "text_with_media",
          "target_audience": "engaged_users"
        }
      },
      {
        "platform": "instagram", 
        "status": "pending",
        "platform_specific": {
          "post_type": "carousel",
          "hashtags": "#WeekendMotivation #Success #Mindset #Inspiration",
          "location": "New York, NY"
        }
      },
      {
        "platform": "twitter",
        "status": "pending",
        "platform_specific": {
          "thread_mode": false
        }
      }
    ],
    "media_files": [
      {
        "id": 15,
        "url": "https://your-domain.com/media/posts/25/motivation-quote.jpg"
      },
      {
        "id": 16,
        "url": "https://your-domain.com/media/posts/25/success-graphic.jpg"
      }
    ]
  },
  "timestamp": "2024-01-15T12:30:00Z"
}
```

---

## POST `/api/posts/{id}/submit`

Submit a post for manager approval (Designer only).

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Post ID |

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notes` | string | No | Submission notes for manager |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/posts/25/submit \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Targeting weekend audience with motivational content. Scheduled for Saturday morning peak engagement time."
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Post submitted for approval",
  "data": {
    "id": 25,
    "status": "pending_approval",
    "approval": {
      "status": "pending",
      "submitted_at": "2024-01-15T12:45:00Z",
      "submission_notes": "Targeting weekend audience with motivational content. Scheduled for Saturday morning peak engagement time."
    }
  },
  "timestamp": "2024-01-15T12:45:00Z"
}
```

**Error Responses:**

**Post Not in Draft Status (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_POST_STATUS",
    "message": "Only draft posts can be submitted for approval"
  },
  "timestamp": "2024-01-15T12:45:00Z"
}
```

---

## POST `/api/posts/{id}/approve`

Approve a pending post (Manager only).

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Post ID |

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `feedback` | string | No | Approval feedback |
| `auto_publish` | boolean | No | Publish immediately (default: false) |
| `modify_schedule` | boolean | No | Allow schedule modification |
| `new_scheduled_at` | string | No | New schedule time (ISO 8601) |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/posts/25/approve \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "feedback": "Great content! Perfect timing for weekend motivation. Approved.",
    "auto_publish": false
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Post approved successfully",
  "data": {
    "id": 25,
    "status": "approved",
    "approval": {
      "status": "approved",
      "approved_by": 1,
      "approved_by_name": "John Manager",
      "approved_at": "2024-01-15T13:00:00Z",
      "feedback": "Great content! Perfect timing for weekend motivation. Approved."
    },
    "next_action": "scheduled",
    "scheduled_at": "2024-01-20T09:00:00Z"
  },
  "timestamp": "2024-01-15T13:00:00Z"
}
```

---

## POST `/api/posts/{id}/reject`

Reject a pending post with feedback (Manager only).

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Post ID |

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reason` | string | Yes | Rejection reason |
| `feedback` | string | Yes | Detailed feedback |
| `allow_resubmission` | boolean | No | Allow resubmission (default: true) |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/posts/25/reject \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "content_needs_improvement",
    "feedback": "Please revise the content to be more specific about the product benefits. Also, consider adding a stronger call-to-action and reduce hashtag usage on Twitter.",
    "allow_resubmission": true
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Post rejected with feedback",
  "data": {
    "id": 25,
    "status": "rejected",
    "approval": {
      "status": "rejected",
      "rejected_by": 1,
      "rejected_by_name": "John Manager",
      "rejected_at": "2024-01-15T13:00:00Z",
      "rejection_reason": "content_needs_improvement",
      "feedback": "Please revise the content to be more specific about the product benefits. Also, consider adding a stronger call-to-action and reduce hashtag usage on Twitter.",
      "allow_resubmission": true
    }
  },
  "timestamp": "2024-01-15T13:00:00Z"
}
```

---

## GET `/api/posts/queue`

Get the publishing queue with scheduled posts.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: scheduled\|processing\|failed |
| `platform` | string | No | Filter by platform |
| `date_from` | string | No | Filter from date (ISO 8601) |
| `date_to` | string | No | Filter to date (ISO 8601) |
| `limit` | integer | No | Limit results (default: 50) |

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/posts/queue?status=scheduled&date_to=2024-01-25T23:59:59Z" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "queue_stats": {
      "total_scheduled": 15,
      "next_24_hours": 8,
      "failed_posts": 2,
      "processing": 0
    },
    "upcoming": [
      {
        "post_id": 25,
        "title": "Weekend Motivation",
        "client_name": "Acme Corporation",
        "scheduled_at": "2024-01-20T09:00:00Z",
        "platforms": ["facebook", "instagram", "twitter"],
        "status": "scheduled",
        "time_until_publish": "4 days, 21 hours",
        "estimated_reach": 12500
      },
      {
        "post_id": 26,
        "title": "Product Update Tuesday",
        "client_name": "Tech Startup Inc",
        "scheduled_at": "2024-01-16T14:30:00Z",
        "platforms": ["linkedin", "twitter"],
        "status": "scheduled",
        "time_until_publish": "1 day, 2 hours",
        "estimated_reach": 8700
      }
    ],
    "failed": [
      {
        "post_id": 23,
        "title": "Holiday Sale Announcement",
        "client_name": "Fashion Boutique",
        "scheduled_at": "2024-01-15T10:00:00Z",
        "platforms": ["instagram"],
        "status": "failed",
        "error": "Instagram API rate limit exceeded",
        "retry_attempts": 3,
        "next_retry": "2024-01-15T14:00:00Z"
      }
    ]
  },
  "timestamp": "2024-01-15T13:00:00Z"
}
```

---

## POST `/api/posts/optimize-content`

Optimize post content for better engagement.

### Request

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | Original content |
| `platforms` | array | Yes | Target platforms |
| `client_id` | integer | Yes | Client ID |
| `optimization_type` | string | No | Type: hashtags\|engagement\|readability\|all |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/posts/optimize-content \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "We are launching a new product next week. It has many great features.",
    "platforms": ["facebook", "instagram", "twitter"],
    "client_id": 1,
    "optimization_type": "all"
  }'
```

### Response

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "original_content": "We are launching a new product next week. It has many great features.",
    "optimized_content": "🚀 Exciting news! We're launching our revolutionary new product next week!\n\nKey highlights:\n✨ Advanced features you'll love\n📈 Enhanced performance\n🎯 Built for your success\n\nStay tuned for the big reveal! 👀\n\n#ProductLaunch #Innovation #TechNews",
    "improvements": [
      {
        "type": "engagement",
        "description": "Added emojis and bullet points for better visual appeal",
        "impact": "high"
      },
      {
        "type": "hashtags",
        "description": "Added relevant hashtags for discoverability",
        "impact": "medium"
      },
      {
        "type": "readability",
        "description": "Restructured content with clear formatting",
        "impact": "high"
      }
    ],
    "platform_variations": {
      "facebook": {
        "content": "🚀 Exciting news! We're launching our revolutionary new product next week!\n\nKey highlights:\n✨ Advanced features you'll love\n📈 Enhanced performance\n🎯 Built for your success\n\nStay tuned for the big reveal! 👀\n\n#ProductLaunch #Innovation",
        "character_count": 234
      },
      "instagram": {
        "content": "🚀 Exciting news! We're launching our revolutionary new product next week!\n\nKey highlights:\n✨ Advanced features you'll love\n📈 Enhanced performance  \n🎯 Built for your success\n\nStay tuned for the big reveal! 👀\n\n#ProductLaunch #Innovation #TechNews #NewProduct #ComingSoon",
        "character_count": 267
      },
      "twitter": {
        "content": "🚀 Exciting news! We're launching our revolutionary new product next week!\n\nKey highlights:\n✨ Advanced features\n📈 Enhanced performance\n🎯 Built for success\n\nStay tuned! 👀\n\n#ProductLaunch #Innovation",
        "character_count": 192
      }
    },
    "analytics_prediction": {
      "engagement_score": 87,
      "readability_score": 92,
      "sentiment": "positive",
      "estimated_reach_improvement": "35%"
    }
  },
  "timestamp": "2024-01-15T13:15:00Z"
}
```

## Platform-Specific Settings

### Facebook
```json
{
  "post_type": "text_with_media|link|video",
  "target_audience": "all|engaged_users|recent_visitors",
  "link_preview": true,
  "boost_eligible": false
}
```

### Instagram
```json
{
  "post_type": "feed|story|reel|carousel",
  "hashtags": "#example #hashtags",
  "location": "City, State",
  "alt_text": "Alternative text for accessibility",
  "hide_like_count": false
}
```

### Twitter
```json
{
  "thread_mode": false,
  "reply_settings": "everyone|mentioned|followers",
  "schedule_tweets": true
}
```

### LinkedIn
```json
{
  "post_type": "text|article|video",
  "target_audience": "all|connections|industry",
  "mention_company": true
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `POST_NOT_FOUND` | Post doesn't exist or access denied |
| `INVALID_POST_STATUS` | Operation not allowed for current status |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions for operation |
| `CLIENT_NOT_ASSIGNED` | Designer not assigned to client |
| `SCHEDULE_IN_PAST` | Cannot schedule posts in the past |
| `PLATFORM_NOT_CONNECTED` | Social account not connected |
| `CONTENT_TOO_LONG` | Content exceeds platform limits |
| `MEDIA_LIMIT_EXCEEDED` | Too many media files for platform |
| `DUPLICATE_CONTENT` | Similar content recently posted |

## Best Practices

1. **Content Quality**: Use the content optimization endpoint for better engagement
2. **Scheduling**: Schedule posts during optimal times using `/best-times` endpoint
3. **Approval Workflow**: Always submit for approval before publishing
4. **Platform Optimization**: Customize content for each platform's requirements
5. **Media Management**: Optimize images and videos for platform specifications
6. **Error Handling**: Monitor publishing queue for failed posts and retry logic 