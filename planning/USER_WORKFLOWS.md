# User Workflows

## Overview
Nellie has two primary user roles with distinct workflows: **Managers** (admins) and **Designers** (employees). This document outlines the key workflows and user journeys within the system.

## User Roles & Permissions

### Manager (Admin)
- Create and manage clients
- Assign clients to designers
- Approve/reject post content
- Provide feedback on posts
- Manage organization settings
- View all analytics and reports
- Manage user accounts

### Designer (Employee)
- Create posts for assigned clients
- Upload media files
- Schedule posts (pending approval)
- View feedback from managers
- Modify posts based on feedback
- View basic analytics for their posts

## Content Creation & Approval Workflow
The flowchart above illustrates the complete content creation and approval process from initial post creation to final publication.

### Key Workflow Steps

1. **Content Creation** (Designer)
   - Create new post with content and media
   - Select target social media platforms
   - Set scheduling date and time
   - Submit for manager approval

2. **Content Review** (Manager)
   - Review submitted content
   - Approve, request changes, or reject
   - Provide detailed feedback if changes needed

3. **Content Publishing** (Automated)
   - Approved posts added to publishing queue
   - Cron jobs check for scheduled posts
   - Automatic publication to social platforms
   - Error handling and notifications

## Client Management Workflow
The flowchart above shows how managers set up new clients and connect their social media accounts.

### Client Setup Process

1. **Client Profile Creation**
   - Enter basic client information
   - Upload client logo and branding
   - Save client profile

2. **Social Media Integration**
   - Connect client's social media accounts (Facebook, Instagram, X, YouTube, Threads, LinkedIn)
   - OAuth authentication for each platform
   - Store secure access tokens
   - Verify account connections

3. **Team Assignment**
   - Assign client to specific designers
   - Set appropriate permission levels
   - Enable collaborative content management

## Analytics & Reporting Workflow
The flowchart above demonstrates how analytics data is collected, processed, and presented to users.

### Analytics Process

1. **Data Collection** (Automated)
   - Hourly cron job fetches metrics from social platforms
   - Platform-specific API calls for each published post
   - Metrics stored in normalized database format

2. **Report Generation**
   - Managers can view comprehensive analytics dashboard
   - Filter by client, date range, and platform
   - Export reports in PDF or CSV format

3. **Designer Access**
   - Limited analytics access for assigned clients only
   - Basic performance metrics for created posts
   - Focus on content performance insights

## Calendar Management Workflow

### Shared Calendar Features
- **Calendar View**: Visual representation of scheduled posts
- **Team Collaboration**: Multiple users can view the same calendar
- **Drag & Drop**: Easy rescheduling of approved posts
- **Filter Options**: View by client, platform, or user
- **Conflict Detection**: Identify scheduling conflicts across platforms

### Calendar Interactions
1. **Manager Calendar Access**
   - View all clients and posts
   - Modify any scheduled post
   - Approve scheduling changes
   - Resolve scheduling conflicts

2. **Designer Calendar Access**
   - View assigned clients only
   - See own posts and team posts
   - Request scheduling changes
   - Cannot directly modify approved posts

## System Administration Workflows

### User Management
1. **Add New User**
   - Manager creates user account
   - Assign role (Manager/Designer)
   - Set initial permissions
   - Send login credentials

2. **Client Assignment Management**
   - Assign/unassign clients to designers
   - Modify permission levels
   - Track assignment history

### System Maintenance
1. **Token Management**
   - Monitor OAuth token expiration
   - Automatic token refresh where possible
   - Alert when manual re-authentication needed

2. **Error Handling**
   - Failed post notifications
   - API rate limit management
   - System health monitoring

## Key User Journeys

### Daily Designer Workflow
1. Log in to system
2. Check assigned clients
3. Review calendar for upcoming posts
4. Create new posts for clients
5. Respond to manager feedback
6. Monitor post performance

### Daily Manager Workflow
1. Log in to system
2. Review pending approvals
3. Check system notifications
4. Review analytics dashboard
5. Provide feedback to designers
6. Manage client relationships

### Weekly Manager Tasks
1. Review overall performance metrics
2. Generate client reports
3. Plan content strategies
4. Manage user accounts
5. System maintenance checks 