# Nellie API Documentation

## 📋 Overview

Nellie is a comprehensive social media management platform providing RESTful API endpoints for managing clients, posts, social media accounts, analytics, and team collaboration. This documentation provides detailed information for developers integrating with the Nellie platform.

## 🏗️ Architecture

The Nellie API is built using:
- **Framework**: CakePHP 5.1
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: MySQL 8.0
- **Response Format**: JSON
- **API Style**: RESTful

## 🔗 Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:8080/api
```

## 🔐 Authentication

All API endpoints (except authentication routes) require a valid JWT token in the Authorization header:

```http
Authorization: Bearer {your_jwt_token}
```

## 📚 API Documentation Sections

### Core Authentication
- **[Authentication](AUTHENTICATION.md)** - User authentication, registration, password management
  - Login/Logout
  - Registration
  - Password Reset
  - Token Management
  - User Profile

### User & Team Management
- **[Users](USERS.md)** - User management and team administration
  - User CRUD Operations
  - Role Management (Manager/Designer)
  - Team Assignment
  - User Statistics

### Client Management
- **[Clients](CLIENTS.md)** - Client account management
  - Client CRUD Operations
  - Client Statistics
  - Client Assignment to Users

### Content Management
- **[Posts](POSTS.md)** - Content creation, approval, and publishing
  - Post CRUD Operations
  - Approval Workflow
  - Publishing & Scheduling
  - Content Optimization
  - Queue Management

### Social Media Integration
- **[Social Accounts](SOCIAL_ACCOUNTS.md)** - Social media platform management
  - Account Connection
  - OAuth Flow Management
  - Platform-Specific Operations
  - Token Refresh

### Analytics & Reporting
- **[Analytics](ANALYTICS.md)** - Performance metrics and reporting
  - Dashboard Analytics
  - Client Analytics
  - Platform Analytics
  - Real-time Metrics
  - Data Export

### Media Management
- **[Media](MEDIA.md)** - File upload and media management
  - File Upload
  - Media Library
  - File Processing
  - Media Optimization

### Calendar & Scheduling
- **[Calendar](CALENDAR.md)** - Content calendar and scheduling
  - Calendar View
  - Post Scheduling
  - Calendar Management
  - Best Time Analysis

### Error Handling
- **[Error Codes](ERROR_CODES.md)** - Error codes and troubleshooting
  - HTTP Status Codes
  - Error Response Format
  - Common Error Scenarios
  - Troubleshooting Guide

### Setup & Installation
- **[Installation](INSTALLATION.md)** - Complete setup guide
  - Server Requirements
  - Installation Steps
  - Configuration
  - Social Media API Setup

## 🚀 Quick Start

### 1. Authentication

```bash
# Login to get JWT token
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@yourcompany.com",
    "password": "your_password"
  }'
```

### 2. Create a Client

```bash
# Create a new client
curl -X POST https://your-domain.com/api/clients \
  -H "Authorization: Bearer {your_jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "website": "https://acme.com"
  }'
```

### 3. Create a Post

```bash
# Create a new post
curl -X POST https://your-domain.com/api/posts \
  -H "Authorization: Bearer {your_jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "title": "New Product Launch",
    "content": "Exciting news! We're launching our new product.",
    "platforms": ["facebook", "instagram", "twitter"],
    "scheduled_at": "2024-12-31T10:00:00Z"
  }'
```

## 📝 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required"]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔄 Pagination

List endpoints support pagination with the following parameters:

```bash
GET /api/posts?page=1&limit=25&sort=created_at&order=desc
```

**Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 25, max: 100)
- `sort` (string): Sort field (default: created_at)
- `order` (string): Sort order - asc|desc (default: desc)

**Response includes pagination metadata:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_items": 250,
    "items_per_page": 25,
    "has_next": true,
    "has_prev": false
  }
}
```

## 🔍 Filtering & Search

Most list endpoints support filtering and search:

```bash
GET /api/posts?client_id=1&status=published&search=product&platform=facebook
```

## 🕐 Rate Limiting

API requests are rate limited to prevent abuse:

- **Authentication**: 60 requests per minute
- **General API**: 1000 requests per hour
- **Media Upload**: 100 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 🌐 CORS Support

The API supports Cross-Origin Resource Sharing (CORS) for web applications:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## 📱 SDK & Libraries

### Official SDKs
- **JavaScript/TypeScript**: `@nellie/api-client`
- **PHP**: `nellie/php-sdk`
- **React Native**: Built-in client implementation

### Community SDKs
- **Python**: `python-nellie-api`
- **Ruby**: `nellie-ruby`
- **Go**: `go-nellie-client`

## 📞 Support & Resources

- **Documentation**: [API Documentation](https://docs.nellie.app)
- **GitHub**: [Source Code](https://github.com/your-org/nellie)
- **Issues**: [Bug Reports](https://github.com/your-org/nellie/issues)
- **Discussions**: [Community Forum](https://github.com/your-org/nellie/discussions)
- **Changelog**: [API Changes](CHANGELOG.md)

## 📜 License

This API documentation is licensed under the MIT License. See [LICENSE](../../LICENSE) for details.

---

**Getting Started**: Begin with [Authentication](AUTHENTICATION.md) to set up API access, then explore specific endpoints based on your use case. 