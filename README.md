# Nellie
A Social Media Management Software

## Project Overview

Nellie is a free, self-hosted social media management platform designed for content creators, small businesses, and small digital marketing agencies. Built with CakePHP and React Native, it provides comprehensive social media management across Facebook, Instagram, X (Twitter), YouTube, Threads, and LinkedIn.

## 📋 Project Planning

### Architecture & Design
- **[Project Overview](planning/PROJECT_OVERVIEW.md)** - Complete project vision, features, and specifications
- **[System Architecture](planning/SYSTEM_ARCHITECTURE.md)** - Technical architecture and component design
- **[Database Design](planning/DATABASE_DESIGN.md)** - Database schema and relationships

### Development Guides
- **[User Workflows](planning/USER_WORKFLOWS.md)** - User journeys and process flows
- **[API Integrations](planning/API_INTEGRATIONS.md)** - Social media platform integrations
- **[Development Setup](planning/DEVELOPMENT_SETUP.md)** - Installation and development guide

## 🚀 Key Features

- **Multi-Client Management**: Handle up to 15-16 clients
- **Team Collaboration**: Manager/Designer role-based workflows
- **Content Approval**: Built-in approval system with feedback
- **Cross-Platform Publishing**: Facebook, Instagram, X, YouTube, Threads, LinkedIn
- **Analytics & Reporting**: Basic engagement metrics and reporting
- **Scheduling & Automation**: Smart scheduling with best time recommendations
- **Self-Hosted**: Free, no subscription required

## 🛠️ Technology Stack

### Server
- **Framework**: CakePHP (Latest)
- **Database**: MySQL 8.0 / MariaDB
- **PHP**: 8.4
- **Security**: Prepared statements, OAuth 2.0
- **Timezone**: IST (Indian Standard Time)

### Client
- **Framework**: React Native
- **Platforms**: Windows Desktop, Android Mobile
- **State Management**: Redux/Context API
- **Networking**: Axios with token management

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│  React Native   │    │   CakePHP API   │    │  Social Media    │
│   (Windows +    │◄──►│     Server      │◄──►│   Platforms      │
│    Android)     │    │                 │    │(FB,IG,X,YT,TH,LI)│
└─────────────────┘    └─────────────────┘    └──────────────────┘
                               │
                       ┌───────▼───────┐
                       │  MySQL 8.0    │
                       │   Database    │
                       └───────────────┘
```

## 🎯 Target Users

- **Content Creators**: Individual influencers managing personal brands
- **Small Businesses**: Local businesses handling social media in-house
- **Digital Agencies**: Small agencies managing multiple client accounts

## 📱 User Roles

### Manager (Admin)
- Create and manage clients
- Approve/reject content with feedback
- View comprehensive analytics
- Manage team assignments
- System administration

### Designer (Employee)
- Create posts for assigned clients
- Submit content for approval
- View basic analytics
- Collaborate on shared calendar

## 🔄 Content Workflow

1. **Designer creates content** → Submit for approval
2. **Manager reviews** → Approve/Request changes/Reject
3. **Approved content** → Added to publishing queue
4. **Automated publishing** → Posts published on schedule
5. **Analytics collection** → Performance data gathered

## 🚀 Getting Started

1. **Read the Planning Documents**: Start with [Project Overview](planning/PROJECT_OVERVIEW.md)
2. **Setup Development Environment**: Follow [Development Setup](planning/DEVELOPMENT_SETUP.md)
3. **Understand Workflows**: Review [User Workflows](planning/USER_WORKFLOWS.md)
4. **Configure APIs**: Set up social media integrations per [API Integrations](planning/API_INTEGRATIONS.md)

## 📞 Support

For questions, issues, or contributions:
- Check the planning documents in the `/planning` folder
- Create GitHub issues for bugs or feature requests
- Use GitHub discussions for general questions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The MIT License allows you to:
- ✅ Use the software for any purpose
- ✅ Modify and distribute the software
- ✅ Use it in commercial projects
- ✅ Include it in proprietary software

---

**Nellie** - Empowering small agencies and creators with professional social media management tools.
