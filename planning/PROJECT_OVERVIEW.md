# Nellie - Social Media Management Software
## Project Overview

Nellie is a free, self-hosted social media management platform designed for content creators, small businesses, and small digital marketing agencies. It provides a comprehensive solution for managing multiple clients' social media presence across various platforms.

## Target Audience
- **Content Creators**: Individual influencers and content creators
- **Small Businesses**: Local businesses managing their own social presence
- **Small Digital Marketing Agencies**: Agencies managing up to 15-16 clients

## Core Features

### 1. Content Management
- **Content Types**: Text posts, images, videos, stories, reels
- **Content Scheduling**: Schedule posts across multiple social platforms
- **Content Publishing**: Automated posting at scheduled times
- **Content Calendar**: Visual calendar interface for managing scheduled content

### 2. Client Management
- **Multi-Client Support**: Manage multiple clients from a single dashboard
- **Platform Flexibility**: Each client can have different social platform combinations
- **Client Assignment**: Assign specific clients to designers/employees

### 3. Team Collaboration
- **Role-Based Access**: Managers (admins) and Designers (employees)
- **Shared Calendar**: Collaborative calendar view between team members
- **Content Approval Workflow**: Admin approval required for all posts
- **Feedback System**: Admins can provide feedback for content modifications

### 4. Analytics & Reporting
- **Basic Engagement Metrics**: Track likes, shares, comments, and reach
- **Platform-Specific Analytics**: Individual metrics for each social platform
- **Client Reporting**: Generate reports for client performance

### 5. Scheduling & Automation
- **Best Time Recommendations**: Suggest optimal posting times
- **Recurring Posts**: Set up repeating content schedules
- **Queue Management**: Manage posting queues for each platform
- **Automatic Posting**: Posts are automatically published at scheduled times

## Technical Specifications

### Server Stack
- **Framework**: CakePHP (Latest Version)
- **Database**: MySQL 8.0 / MariaDB
- **PHP Version**: 8.4 (Latest features and performance)
- **Database Security**: MySQL prepared statement emulation
- **Timezone**: IST (Indian Standard Time)
- **Hosting**: Self-hosted with manual cronjob support
- **File Storage**: Local server storage

### Client Applications
- **Framework**: React Native
- **Platforms**: Windows Desktop, Android Mobile
- **Network**: Online-only (no offline capabilities)

### Social Media Integrations
- **Facebook**: Pages, Posts, Stories
- **Instagram**: Posts, Stories, Reels
- **X (Twitter)**: Tweets, Media posts
- **YouTube**: Video uploads, Community posts
- **Threads**: Text posts, Media posts, Replies
- **LinkedIn**: Posts, Articles, Company page updates

## Business Model
- **Cost**: Completely free
- **Hosting**: Self-hosted solution
- **Licensing**: MIT License (Open Source)
- **Scalability**: Designed for small to medium usage (15-16 clients max)

## Key Differentiators
1. **Free & Self-Hosted**: No subscription fees or third-party dependencies
2. **Agency-Focused**: Built specifically for small agencies with approval workflows
3. **Simple Setup**: Manual cronjob support for shared hosting environments
4. **Team Collaboration**: Designed for multi-user team environments
5. **Content Approval**: Built-in approval workflow for quality control 