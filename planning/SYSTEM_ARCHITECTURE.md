# System Architecture

## Overview
Nellie follows a client-server architecture with a CakePHP backend API and React Native frontend applications. The system is designed for self-hosting with support for shared hosting environments.

## High-Level Architecture
The architecture diagram above shows the main components and their relationships in the Nellie system.

## Core Components

### Client Applications
- **Windows Desktop**: React Native application for desktop management
- **Android Mobile**: React Native mobile app for on-the-go management
- **Shared Features**: Both clients share the same codebase and API integration

### Server Infrastructure
- **CakePHP API Server**: RESTful API built with CakePHP framework
- **MySQL Database**: Primary data storage for all application data
- **File Storage**: Local server storage for media files and assets
- **Cron Jobs**: Scheduled tasks for automated posting and analytics updates

### Core Services
- **Authentication Service**: User login, session management, role-based access
- **Content Management Service**: CRUD operations for posts, media, and content
- **Scheduling Service**: Queue management and post scheduling logic
- **Publishing Service**: Social media API integration and automated posting
- **Analytics Service**: Data collection and reporting from social platforms
- **Notification Service**: Real-time updates and system notifications

## Deployment Architecture
The deployment diagram above shows how Nellie can be deployed in a shared hosting environment.

### Hosting Requirements
- **Web Server**: Apache or Nginx with PHP support
- **PHP Version**: 8.4 with required extensions
- **Database**: MySQL 8.0 or MariaDB equivalent
- **Storage**: Sufficient disk space for media files
- **Cron Jobs**: Manual setup support for scheduled tasks

### Cron Job Schedule
- **Post Publisher**: Every 5 minutes (publishes scheduled posts)
- **Analytics Sync**: Every hour (fetches latest metrics)
- **Cleanup Tasks**: Daily (removes expired tokens, old logs)
- **Best Time Analysis**: Weekly (analyzes optimal posting times)

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Secure API authentication
- **Role-Based Access**: Manager and Designer roles
- **Session Management**: Secure session handling
- **Password Security**: Bcrypt hashing

### API Security
- **OAuth 2.0**: Social media platform authentication
- **Rate Limiting**: API call throttling
- **Input Validation**: SQL injection prevention
- **HTTPS Only**: Encrypted communication

### Data Protection
- **Prepared Statements**: MySQL injection prevention
- **File Upload Security**: Media file validation
- **Access Control**: User data isolation
- **Audit Logging**: Activity tracking

## API Structure

### Core API Endpoints
- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Clients**: `/api/clients/*`
- **Posts**: `/api/posts/*`
- **Schedule**: `/api/schedule/*`
- **Analytics**: `/api/analytics/*`
- **Media**: `/api/media/*`

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Performance Considerations

### Database Optimization
- **Indexing**: Proper database indexing strategy
- **Query Optimization**: Efficient SQL queries
- **Connection Pooling**: Database connection management
- **Caching**: Query result caching

### File Storage
- **Media Optimization**: Image/video compression
- **Storage Structure**: Organized file directory structure
- **Cleanup Processes**: Automated file cleanup
- **Backup Strategy**: Regular data backups

### Scalability
- **Concurrent Users**: Optimized for 15-20 concurrent users
- **Client Limit**: Maximum 15-16 clients per instance
- **Post Volume**: Optimized for daily posting frequency
- **Database Size**: Efficient data management for long-term storage 