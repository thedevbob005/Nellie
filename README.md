# Nellie
A Comprehensive Social Media Management Platform

## Project Overview

Nellie is a **free, self-hosted** social media management platform designed for content creators, small businesses, and small digital marketing agencies. Built with **CakePHP 5.1** and **React Native**, it provides comprehensive social media management across **Facebook, Instagram, X (Twitter), YouTube, Threads, and LinkedIn**.

## ✨ Key Features

### 🎯 **Complete Social Media Management**
- **Multi-Platform Publishing**: Facebook, Instagram, X, YouTube, Threads, LinkedIn
- **Content Scheduling**: Smart scheduling with best time recommendations
- **Approval Workflow**: Built-in manager approval system with feedback
- **Analytics Dashboard**: Real-time engagement metrics and reporting
- **Media Management**: Advanced file upload with progress tracking

### 👥 **Team Collaboration**
- **Role-Based Access**: Manager/Designer workflows with permissions
- **Client Management**: Handle up to 15-16 clients efficiently
- **User Management**: Comprehensive team administration
- **Real-Time Notifications**: Push and in-app notifications

### 📊 **Advanced Analytics**
- **Performance Metrics**: Likes, shares, comments, reach, impressions
- **Platform Analytics**: Platform-specific insights and trends
- **Client Reporting**: Detailed performance reports
- **Engagement Tracking**: Real-time metrics and predictions

### 🔧 **Technical Excellence**
- **Self-Hosted**: Complete control, no subscription fees
- **JWT Authentication**: Secure API access with refresh tokens
- **OAuth Integration**: Seamless social media platform connections
- **RESTful API**: Comprehensive API for custom integrations

## 🛠️ Technology Stack

### **Backend (Server)**
- **Framework**: CakePHP 5.1
- **Database**: MySQL 8.0 / MariaDB 10.6+
- **PHP**: 8.4+
- **Authentication**: JWT with refresh tokens
- **API Style**: RESTful with JSON responses
- **Security**: OAuth 2.0, prepared statements, CORS support

### **Frontend (Client)**
- **Framework**: React Native
- **Platforms**: Windows Desktop, Android Mobile
- **State Management**: Redux with TypeScript
- **UI Library**: React Native Paper (Material Design)
- **Networking**: Axios with interceptors

### **External Integrations**
- **Facebook/Instagram**: Graph API v18.0+
- **X (Twitter)**: API v2 with OAuth 2.0
- **YouTube**: Google API v3
- **LinkedIn**: Marketing API v2
- **Threads**: Meta Threads API

## 🏗️ System Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌──────────────────────┐
│   React Native     │    │    CakePHP 5.1      │    │   Social Media       │
│   Client Apps      │◄──►│    API Server       │◄──►│    Platforms         │
│ (Windows/Android)   │    │   + JWT Auth        │    │ (FB,IG,X,YT,TH,LI)  │
└─────────────────────┘    └─────────────────────┘    └──────────────────────┘
                                       │
                           ┌───────────▼───────────┐
                           │     MySQL 8.0        │
                           │   Database Server     │
                           │  + Migration System   │
                           └───────────────────────┘
```

## 🚀 Quick Installation

### Prerequisites
- **PHP 8.4+** with extensions (curl, gd, intl, json, mbstring, mysql, xml, zip)
- **MySQL 8.0+** or MariaDB 10.6+
- **Composer** for PHP dependencies
- **Web Server** (Apache/Nginx)
- **SSL Certificate** (required for production)

### 1. Download & Setup

```bash
# Clone the repository
git clone https://github.com/your-org/nellie.git
cd nellie

# Install server dependencies
cd server
composer install --optimize-autoloader --no-dev
```

### 2. Database Configuration

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE nellie_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Create user
mysql -u root -p -e "CREATE USER 'nellie_user'@'localhost' IDENTIFIED BY 'your_password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON nellie_db.* TO 'nellie_user'@'localhost';"

# Run migrations
bin/cake migrations migrate
bin/cake migrations seed
```

### 3. Environment Setup

```bash
# Copy configuration template
cp config/app_local.example.php config/app_local.php

# Edit configuration with your settings
nano config/app_local.php
```

### 4. Web Server Configuration

**Apache Virtual Host:**
```apache
<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /var/www/nellie/server/webroot
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    <Directory /var/www/nellie/server/webroot>
        AllowOverride All
        Require all granted
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>
</VirtualHost>
```

### 5. Cron Jobs Setup

```bash
# Add to crontab (crontab -e)
*/5 * * * * cd /var/www/nellie/server && bin/cake post_publisher
0 * * * * cd /var/www/nellie/server && bin/cake analytics_sync
0 2 * * * cd /var/www/nellie/server && bin/cake cleanup
```

## 📚 Documentation

### **📖 Complete API Documentation**
- **[API Overview](docs/api/INDEX.md)** - Getting started with the API
- **[Authentication](docs/api/AUTHENTICATION.md)** - JWT authentication and user management
- **[Users](docs/api/USERS.md)** - Team and user management endpoints
- **[Clients](docs/api/CLIENTS.md)** - Client account management
- **[Posts](docs/api/POSTS.md)** - Content creation, approval, and publishing
- **[Social Accounts](docs/api/SOCIAL_ACCOUNTS.md)** - Social media platform integration
- **[Analytics](docs/api/ANALYTICS.md)** - Performance metrics and reporting
- **[Media](docs/api/MEDIA.md)** - File upload and media management
- **[Calendar](docs/api/CALENDAR.md)** - Content calendar and scheduling
- **[Error Codes](docs/api/ERROR_CODES.md)** - Error handling and troubleshooting
- **[Installation Guide](docs/api/INSTALLATION.md)** - Complete setup and deployment

### **📋 Project Planning**
- **[Project Overview](planning/PROJECT_OVERVIEW.md)** - Complete project vision and specifications
- **[System Architecture](planning/SYSTEM_ARCHITECTURE.md)** - Technical architecture and design
- **[Database Design](planning/DATABASE_DESIGN.md)** - Database schema and relationships
- **[User Workflows](planning/USER_WORKFLOWS.md)** - User journeys and process flows
- **[API Integrations](planning/API_INTEGRATIONS.md)** - Social media platform integrations
- **[Development Setup](planning/DEVELOPMENT_SETUP.md)** - Development environment guide

## 🎯 User Roles & Workflow

### **👨‍💼 Manager (Admin)**
- ✅ Create and manage clients
- ✅ Approve/reject content with feedback
- ✅ View comprehensive analytics
- ✅ Manage team and user assignments
- ✅ System administration and settings

### **🎨 Designer (Employee)**
- ✅ Create posts for assigned clients
- ✅ Submit content for approval
- ✅ View basic analytics for own posts
- ✅ Collaborate on shared calendar
- ✅ Upload and manage media files

### **🔄 Content Workflow**
1. **Designer creates content** → Submit for approval
2. **Manager reviews** → Approve/Request changes/Reject with feedback
3. **Approved content** → Added to publishing queue
4. **Automated publishing** → Posts published on schedule via cron jobs
5. **Analytics collection** → Performance data gathered and reported

## 🔗 API Endpoints Overview

### **Authentication**
```bash
POST /api/auth/login          # User login with JWT
POST /api/auth/register       # User registration
POST /api/auth/refresh        # Token refresh
GET  /api/auth/me             # Current user info
```

### **Content Management**
```bash
GET    /api/posts             # List posts with filters
POST   /api/posts             # Create new post
PUT    /api/posts/{id}        # Update post
POST   /api/posts/{id}/submit # Submit for approval
POST   /api/posts/{id}/approve # Approve post (manager)
```

### **Client Management**
```bash
GET    /api/clients           # List clients
POST   /api/clients           # Create client
GET    /api/clients/{id}/stats # Client analytics
```

### **Social Media Integration**
```bash
GET    /api/social-accounts   # List connected accounts
POST   /api/oauth/init        # Initialize OAuth flow
GET    /api/oauth/callback    # OAuth callback handler
```

## 🔒 Security Features

- **JWT Authentication**: Secure API access with access/refresh tokens
- **Role-Based Access**: Granular permissions for managers and designers
- **OAuth 2.0 Integration**: Secure social media platform connections
- **HTTPS Enforcement**: SSL/TLS encryption for all communications
- **Input Validation**: Comprehensive data validation and sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Support**: Proper cross-origin resource sharing configuration

## 📊 Analytics & Reporting

### **Real-Time Metrics**
- Engagement rates (likes, comments, shares)
- Reach and impressions across platforms
- Follower growth and demographics
- Post performance comparisons

### **Advanced Analytics**
- Platform-specific insights
- Best posting time analysis
- Content performance trends
- Client performance reports
- ROI tracking and optimization

## 🌐 Supported Social Media Platforms

| Platform | Features | API Version |
|----------|----------|-------------|
| **Facebook** | Posts, Stories, Pages | Graph API v18.0+ |
| **Instagram** | Feed, Stories, Reels | Graph API v18.0+ |
| **X (Twitter)** | Tweets, Media, Threads | API v2 |
| **LinkedIn** | Posts, Articles, Company | Marketing API v2 |
| **YouTube** | Videos, Community Posts | Data API v3 |
| **Threads** | Posts, Replies | Threads API v1.0 |

## 💡 Getting Started

### **For Developers**
1. 📖 Start with [API Documentation](docs/api/INDEX.md)
2. 🔧 Follow [Installation Guide](docs/api/INSTALLATION.md)
3. 🎯 Review [User Workflows](planning/USER_WORKFLOWS.md)
4. 🔌 Configure [API Integrations](planning/API_INTEGRATIONS.md)

### **For End Users**
1. 📋 Read [Project Overview](planning/PROJECT_OVERVIEW.md)
2. 👥 Understand [User Workflows](planning/USER_WORKFLOWS.md)
3. 🚀 Follow setup instructions from your system administrator
4. 📱 Download and configure the client applications

## 📞 Support & Community

### **Get Help**
- 📚 **Documentation**: [Complete API Docs](docs/api/INDEX.md)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-org/nellie/issues)
- 💬 **Discussions**: [Community Forum](https://github.com/your-org/nellie/discussions)
- 📧 **Email Support**: support@nellie.app

### **Contribute**
- 🍴 Fork the repository
- 🔧 Create feature branches
- 📝 Submit pull requests
- 📖 Improve documentation
- 🧪 Add test coverage

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### **MIT License Benefits:**
- ✅ **Free to use** for any purpose
- ✅ **Modify and distribute** the software
- ✅ **Commercial use** allowed
- ✅ **Private use** permitted
- ✅ **No warranty** but with liability limitations

---

## 🎉 **Ready to Get Started?**

**Nellie** provides enterprise-grade social media management capabilities completely free and self-hosted. Perfect for agencies, businesses, and creators who want full control over their social media operations.

👉 **[Start with the Installation Guide](docs/api/INSTALLATION.md)**

---

**Nellie** - Empowering agencies and creators with professional social media management tools.
