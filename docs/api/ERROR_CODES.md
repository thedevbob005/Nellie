# Error Codes & Troubleshooting

## Overview

This document provides comprehensive information about error codes, error response formats, and troubleshooting guides for the Nellie API.

## Error Response Format

All API errors follow a consistent JSON response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details (optional)
    },
    "trace_id": "unique-trace-identifier"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## HTTP Status Codes

| Status Code | Meaning | Description |
|-------------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Invalid or missing authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 502 | Bad Gateway | External service unavailable |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## Authentication Errors

### INVALID_CREDENTIALS (401)
**Cause**: Invalid email or password during login
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```
**Solution**: Verify email and password are correct

### TOKEN_EXPIRED (401)
**Cause**: JWT access token has expired
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Access token has expired"
  }
}
```
**Solution**: Use refresh token to get new access token

### INVALID_TOKEN (401)
**Cause**: Malformed or invalid JWT token
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid authentication token"
  }
}
```
**Solution**: Check token format and ensure Bearer prefix

### TOKEN_MISSING (401)
**Cause**: No authentication token provided
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_MISSING",
    "message": "Authentication token required"
  }
}
```
**Solution**: Include Authorization header with Bearer token

### ACCOUNT_DISABLED (403)
**Cause**: User or organization account is disabled
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_DISABLED",
    "message": "Account is disabled"
  }
}
```
**Solution**: Contact administrator to reactivate account

### INVALID_REFRESH_TOKEN (401)
**Cause**: Refresh token is invalid or expired
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Invalid or expired refresh token"
  }
}
```
**Solution**: Login again to obtain new tokens

---

## Authorization Errors

### INSUFFICIENT_PERMISSIONS (403)
**Cause**: User lacks required permissions for operation
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Insufficient permissions for this operation",
    "details": {
      "required_role": "manager",
      "current_role": "designer"
    }
  }
}
```
**Solution**: Request manager to perform operation or check user permissions

### ACCESS_DENIED (403)
**Cause**: User doesn't have access to specific resource
```json
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "Access denied to this resource"
  }
}
```
**Solution**: Verify resource ownership or assignment

---

## Validation Errors

### VALIDATION_ERROR (400)
**Cause**: Input validation failed
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required", "Invalid email format"],
      "password": ["Password must be at least 8 characters"],
      "first_name": ["First name is required"]
    }
  }
}
```
**Solution**: Fix validation errors in request data

### MISSING_REQUIRED_FIELD (400)
**Cause**: Required field not provided
```json
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_FIELD",
    "message": "Required field missing",
    "details": {
      "field": "client_id"
    }
  }
}
```
**Solution**: Provide all required fields

### INVALID_FORMAT (400)
**Cause**: Field format is incorrect
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FORMAT",
    "message": "Invalid field format",
    "details": {
      "field": "scheduled_at",
      "expected_format": "ISO 8601 date string",
      "provided": "2024-15-01"
    }
  }
}
```
**Solution**: Use correct format for the field

---

## Resource Errors

### RESOURCE_NOT_FOUND (404)
**Cause**: Requested resource doesn't exist
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```
**Solution**: Verify resource ID is correct and exists

### RESOURCE_CONFLICT (409)
**Cause**: Resource conflict (e.g., duplicate email)
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email address already exists"
  }
}
```
**Solution**: Use different unique identifier

### RESOURCE_IN_USE (400)
**Cause**: Cannot delete resource that's in use
```json
{
  "success": false,
  "error": {
    "code": "CLIENT_HAS_ACTIVE_POSTS",
    "message": "Cannot delete client with active posts",
    "details": {
      "active_posts_count": 15
    }
  }
}
```
**Solution**: Remove dependencies before deletion

---

## Post Management Errors

### INVALID_POST_STATUS (400)
**Cause**: Operation not allowed for current post status
```json
{
  "success": false,
  "error": {
    "code": "INVALID_POST_STATUS",
    "message": "Cannot submit published post for approval",
    "details": {
      "current_status": "published",
      "allowed_statuses": ["draft"]
    }
  }
}
```
**Solution**: Check post status before operation

### CONTENT_TOO_LONG (400)
**Cause**: Content exceeds platform character limits
```json
{
  "success": false,
  "error": {
    "code": "CONTENT_TOO_LONG",
    "message": "Content exceeds platform limits",
    "details": {
      "platform": "twitter",
      "max_length": 280,
      "current_length": 345
    }
  }
}
```
**Solution**: Reduce content length for platform

### SCHEDULE_IN_PAST (400)
**Cause**: Attempting to schedule post in the past
```json
{
  "success": false,
  "error": {
    "code": "SCHEDULE_IN_PAST",
    "message": "Cannot schedule posts in the past",
    "details": {
      "scheduled_time": "2024-01-10T10:00:00Z",
      "current_time": "2024-01-15T10:30:00Z"
    }
  }
}
```
**Solution**: Use future date and time

### PLATFORM_NOT_CONNECTED (400)
**Cause**: Social media account not connected for client
```json
{
  "success": false,
  "error": {
    "code": "PLATFORM_NOT_CONNECTED",
    "message": "Instagram account not connected for this client",
    "details": {
      "platform": "instagram",
      "client_id": 1
    }
  }
}
```
**Solution**: Connect social media account first

---

## Media Upload Errors

### FILE_TOO_LARGE (400)
**Cause**: Uploaded file exceeds size limit
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds limit",
    "details": {
      "max_size": "10MB",
      "file_size": "15MB",
      "filename": "large-image.jpg"
    }
  }
}
```
**Solution**: Reduce file size or use compression

### INVALID_FILE_TYPE (400)
**Cause**: Unsupported file format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "File type not supported",
    "details": {
      "supported_types": ["jpg", "png", "gif", "mp4"],
      "provided_type": "bmp"
    }
  }
}
```
**Solution**: Convert to supported file format

### MEDIA_PROCESSING_FAILED (500)
**Cause**: Server failed to process media file
```json
{
  "success": false,
  "error": {
    "code": "MEDIA_PROCESSING_FAILED",
    "message": "Failed to process media file",
    "details": {
      "filename": "video.mp4",
      "processing_error": "Invalid video codec"
    }
  }
}
```
**Solution**: Try different file or contact support

---

## Rate Limiting Errors

### RATE_LIMIT_EXCEEDED (429)
**Cause**: Too many requests in time window
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 1000,
      "window": "1 hour",
      "reset_time": "2024-01-15T11:30:00Z"
    }
  }
}
```
**Solution**: Wait for rate limit reset or reduce request frequency

---

## External Service Errors

### SOCIAL_MEDIA_API_ERROR (502)
**Cause**: External social media platform API error
```json
{
  "success": false,
  "error": {
    "code": "FACEBOOK_API_ERROR",
    "message": "Facebook API is temporarily unavailable",
    "details": {
      "platform": "facebook",
      "external_error": "Service temporarily unavailable",
      "retry_after": 300
    }
  }
}
```
**Solution**: Retry after specified time or check platform status

### OAUTH_ERROR (400)
**Cause**: OAuth authentication failed
```json
{
  "success": false,
  "error": {
    "code": "OAUTH_ERROR",
    "message": "OAuth authentication failed",
    "details": {
      "platform": "instagram",
      "error": "invalid_grant",
      "description": "Authorization code expired"
    }
  }
}
```
**Solution**: Re-authenticate with social media platform

---

## Server Errors

### INTERNAL_SERVER_ERROR (500)
**Cause**: Unexpected server error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "trace_id": "abc123def456"
  }
}
```
**Solution**: Report trace_id to support team

### DATABASE_ERROR (500)
**Cause**: Database connection or query error
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Database temporarily unavailable"
  }
}
```
**Solution**: Retry request or contact support

### SERVICE_UNAVAILABLE (503)
**Cause**: Service temporarily unavailable
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service temporarily unavailable for maintenance"
  }
}
```
**Solution**: Wait for maintenance to complete

---

## Complete Error Code Reference

### Authentication & Authorization
| Code | Status | Description |
|------|--------|-------------|
| `INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `INVALID_TOKEN` | 401 | Malformed JWT token |
| `TOKEN_MISSING` | 401 | Authentication token required |
| `ACCOUNT_DISABLED` | 403 | Account is disabled |
| `INSUFFICIENT_PERMISSIONS` | 403 | Insufficient permissions |
| `ACCESS_DENIED` | 403 | Access denied to resource |
| `INVALID_REFRESH_TOKEN` | 401 | Invalid refresh token |

### Validation & Input
| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `MISSING_REQUIRED_FIELD` | 400 | Required field missing |
| `INVALID_FORMAT` | 400 | Invalid field format |
| `CONTENT_TOO_LONG` | 400 | Content exceeds limits |
| `INVALID_FILE_TYPE` | 400 | Unsupported file type |
| `FILE_TOO_LARGE` | 400 | File size exceeds limit |

### Resource Management
| Code | Status | Description |
|------|--------|-------------|
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `CLIENT_NOT_FOUND` | 404 | Client doesn't exist |
| `POST_NOT_FOUND` | 404 | Post doesn't exist |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `CLIENT_HAS_ACTIVE_POSTS` | 400 | Client has active posts |
| `USER_HAS_ACTIVE_POSTS` | 400 | User has active posts |

### Post & Content Management
| Code | Status | Description |
|------|--------|-------------|
| `INVALID_POST_STATUS` | 400 | Invalid post status for operation |
| `SCHEDULE_IN_PAST` | 400 | Cannot schedule in past |
| `PLATFORM_NOT_CONNECTED` | 400 | Social account not connected |
| `DUPLICATE_CONTENT` | 400 | Similar content recently posted |
| `MEDIA_LIMIT_EXCEEDED` | 400 | Too many media files |

### External Services
| Code | Status | Description |
|------|--------|-------------|
| `FACEBOOK_API_ERROR` | 502 | Facebook API error |
| `INSTAGRAM_API_ERROR` | 502 | Instagram API error |
| `TWITTER_API_ERROR` | 502 | Twitter API error |
| `LINKEDIN_API_ERROR` | 502 | LinkedIn API error |
| `OAUTH_ERROR` | 400 | OAuth authentication failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |

### System Errors
| Code | Status | Description |
|------|--------|-------------|
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
| `DATABASE_ERROR` | 500 | Database error |
| `SERVICE_UNAVAILABLE` | 503 | Service unavailable |
| `MEDIA_PROCESSING_FAILED` | 500 | Media processing failed |

---

## Troubleshooting Guide

### Common Issues

#### 1. Authentication Problems
**Symptoms**: Getting 401 errors
**Solutions**:
- Verify JWT token is included in Authorization header
- Check token format: `Bearer {token}`
- Refresh expired tokens
- Re-authenticate if refresh token is invalid

#### 2. Permission Denied
**Symptoms**: Getting 403 errors
**Solutions**:
- Verify user role has required permissions
- Check if user is assigned to client (for designers)
- Ensure account is active

#### 3. Validation Failures
**Symptoms**: Getting 400 errors with validation details
**Solutions**:
- Check all required fields are provided
- Verify field formats (dates, emails, URLs)
- Ensure field lengths don't exceed limits

#### 4. Social Media Integration Issues
**Symptoms**: Platform connection or publishing failures
**Solutions**:
- Re-authenticate with social media platform
- Check platform API status
- Verify account permissions
- Retry after rate limit reset

#### 5. File Upload Problems
**Symptoms**: Media upload failures
**Solutions**:
- Check file size and format requirements
- Ensure stable internet connection
- Try uploading smaller files
- Verify file is not corrupted

### Best Practices for Error Handling

1. **Always Check Response Status**: Check HTTP status code and success field
2. **Use Error Codes**: Implement specific handling for different error codes
3. **Display User-Friendly Messages**: Show meaningful messages to users
4. **Implement Retry Logic**: For transient errors (5xx, rate limits)
5. **Log Error Details**: Include trace_id for support requests
6. **Graceful Degradation**: Provide fallback functionality when possible

### Sample Error Handling Code

```javascript
// JavaScript/TypeScript example
async function handleApiRequest(apiCall) {
  try {
    const response = await apiCall();
    
    if (!response.success) {
      switch (response.error.code) {
        case 'TOKEN_EXPIRED':
          await refreshToken();
          return handleApiRequest(apiCall); // Retry
          
        case 'RATE_LIMIT_EXCEEDED':
          const retryAfter = response.error.details.reset_time;
          await wait(retryAfter);
          return handleApiRequest(apiCall); // Retry
          
        case 'VALIDATION_ERROR':
          displayValidationErrors(response.error.details);
          break;
          
        default:
          displayGenericError(response.error.message);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    displayGenericError('Network error occurred');
  }
}
```

### Getting Support

If you encounter errors not covered in this documentation:

1. **Check Error Code**: Reference this documentation
2. **Include Trace ID**: Provide trace_id from error response
3. **Describe Context**: What operation were you performing?
4. **Include Request Details**: Headers, payload (sanitized)
5. **Check API Status**: Visit status.nellie.app for service status

**Contact Support**:
- Email: api-support@nellie.app
- GitHub Issues: [Report Bug](https://github.com/your-org/nellie/issues)
- Documentation: [API Docs](https://docs.nellie.app) 