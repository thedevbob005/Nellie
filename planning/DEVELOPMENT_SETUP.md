# Development Setup Guide

## Prerequisites

### System Requirements
- **PHP**: 8.4 or higher
- **Composer**: Latest version
- **Node.js**: 18.x or higher (for React Native)
- **MySQL**: 8.0 or MariaDB equivalent
- **Git**: Latest version
- **Web Server**: Apache or Nginx

### Development Tools
- **IDE**: VS Code, PhpStorm, or similar
- **Database Client**: phpMyAdmin, MySQL Workbench, or similar
- **API Testing**: Postman or Insomnia
- **Version Control**: Git with GitHub/GitLab

## Server Setup (CakePHP Backend)

### 1. Clone Repository
```bash
git clone https://github.com/your-org/nellie.git
cd nellie/server
```

### 2. Install Dependencies
```bash
composer install
```

### 3. Environment Configuration
```bash
cp config/app_local.example.php config/app_local.php
```

Edit `config/app_local.php`:
```php
<?php
return [
    'debug' => true,
    'Security' => [
        'salt' => 'your-security-salt-here',
    ],
    'Datasources' => [
        'default' => [
            'host' => 'localhost',
            'username' => 'nellie_user',
            'password' => 'your_password',
            'database' => 'nellie_db',
            'timezone' => 'Asia/Kolkata',
        ],
    ],
    'SocialMedia' => [
        'Facebook' => [
            'app_id' => 'your_facebook_app_id',
            'app_secret' => 'your_facebook_app_secret',
        ],
        'Instagram' => [
            'app_id' => 'your_instagram_app_id',
            'app_secret' => 'your_instagram_app_secret',
        ],
        'Twitter' => [
            'consumer_key' => 'your_twitter_consumer_key',
            'consumer_secret' => 'your_twitter_consumer_secret',
        ],
        'YouTube' => [
            'client_id' => 'your_google_client_id',
            'client_secret' => 'your_google_client_secret',
        ],
        'Threads' => [
            'app_id' => 'your_threads_app_id',
            'app_secret' => 'your_threads_app_secret',
        ],
        'LinkedIn' => [
            'client_id' => 'your_linkedin_client_id',
            'client_secret' => 'your_linkedin_client_secret',
        ],
    ],
];
```

### 4. Database Setup
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE nellie_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Create user
mysql -u root -p -e "CREATE USER 'nellie_user'@'localhost' IDENTIFIED BY 'your_password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON nellie_db.* TO 'nellie_user'@'localhost';"

# Run migrations
bin/cake migrations migrate
```

### 5. Seed Database (Optional)
```bash
bin/cake migrations seed
```

### 6. Set File Permissions
```bash
chmod -R 755 webroot/
chmod -R 755 logs/
chmod -R 755 tmp/
```

### 7. Start Development Server
```bash
bin/cake server -p 8080
```

## Client Setup (React Native)

### 1. Navigate to Client Directory
```bash
cd ../client
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env`:
```
API_BASE_URL=http://localhost:8080/api
ENVIRONMENT=development
```

### 4. Platform-Specific Setup

#### For Windows Development
```bash
# Install Windows dependencies
npm install --global windows-build-tools
```

#### For Android Development
```bash
# Ensure Android SDK is installed
npx react-native doctor
```

### 5. Start Development
```bash
# For Windows
npm run windows

# For Android
npm run android

# Metro bundler (in separate terminal)
npm start
```

## Social Media API Setup

### Facebook/Instagram
1. Visit [Facebook Developers](https://developers.facebook.com/)
2. Create new app
3. Add Facebook Login and Instagram Basic Display products
4. Configure OAuth redirect URIs
5. Get App ID and App Secret

### X (Twitter)
1. Visit [X Developer Portal](https://developer.twitter.com/)
2. Create new project and app
3. Generate API keys and tokens
4. Configure OAuth 2.0 settings
5. Set callback URLs

### YouTube (Google)
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Configure consent screen

### Threads (Meta)
1. Visit [Meta for Developers](https://developers.facebook.com/)
2. Create or use existing app
3. Add Threads API product
4. Configure OAuth redirect URIs
5. Get App ID and App Secret
6. Request Threads API access (may require approval)

### LinkedIn
1. Visit [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Create new application
3. Add required products (Marketing API, Share on LinkedIn)
4. Configure OAuth 2.0 redirect URLs
5. Get Client ID and Client Secret
6. Request API access and verify your application
7. Complete LinkedIn Partner Program requirements (if applicable)

## Development Workflow

### Code Structure

#### Server (CakePHP)
```
server/
├── config/          # Configuration files
│   ├── Controller/  # API controllers
│   ├── Model/       # Database models
│   ├── Service/     # Business logic services
│   └── Utility/     # Helper utilities
├── tests/           # Unit and integration tests
└── webroot/         # Public files and uploads
```

#### Client (React Native)
```
client/
├── src/
│   ├── components/  # Reusable UI components
│   ├── screens/     # App screens
│   ├── services/    # API services
│   ├── store/       # State management
│   └── utils/       # Helper utilities
├── android/         # Android-specific code
└── windows/         # Windows-specific code
```

### Database Migrations
```bash
# Create new migration
bin/cake bake migration CreatePostsTable

# Run migrations
bin/cake migrations migrate

# Rollback migration
bin/cake migrations rollback
```

### Running Tests
```bash
# Server tests
cd server
vendor/bin/phpunit

# Client tests
cd client
npm test
```

### Code Quality Tools

#### PHP (Server)
```bash
# PHP CodeSniffer
vendor/bin/phpcs src/

# PHP Mess Detector
vendor/bin/phpmd src/ text cleancode,codesize,controversial,design,naming,unusedcode

# PHPStan
vendor/bin/phpstan analyse src/
```

#### JavaScript (Client)
```bash
# ESLint
npm run lint

# Prettier
npm run format
```

## Cron Jobs Setup

### Development Environment
Add to your crontab (`crontab -e`):
```bash
# Post publisher (every 5 minutes)
*/5 * * * * cd /path/to/nellie/server && bin/cake post_publisher

# Analytics sync (every hour)
0 * * * * cd /path/to/nellie/server && bin/cake analytics_sync

# Cleanup tasks (daily at 2 AM)
0 2 * * * cd /path/to/nellie/server && bin/cake cleanup

# Best time analysis (weekly on Sunday at 3 AM)
0 3 * * 0 cd /path/to/nellie/server && bin/cake best_time_analysis
```

## Debugging

### Server Debugging
```php
// Enable debug mode in config/app_local.php
'debug' => true,

// Use CakePHP's debug function
debug($variable);

// Log debugging information
$this->log('Debug message', 'debug');
```

### Client Debugging
```javascript
// React Native Debugger
npm install -g react-native-debugger

// Console logging
console.log('Debug information:', data);

// Network debugging
// Use Flipper or React Native Debugger
```

### Database Debugging
```bash
# Enable query logging in config/app_local.php
'Datasources' => [
    'default' => [
        'log' => true,
        // ... other config
    ],
],

# View logs
tail -f logs/queries.log
```

## Performance Optimization

### Server Optimization
- Enable OPcache in PHP
- Use Redis for session storage
- Implement database query caching
- Optimize database indexes
- Use CDN for static assets

### Client Optimization
- Implement lazy loading
- Use FlatList for large datasets
- Optimize images and media
- Implement proper state management
- Use React.memo for component optimization

## Security Checklist

### Server Security
- [ ] Enable HTTPS in production
- [ ] Implement CSRF protection
- [ ] Validate all input data
- [ ] Use prepared statements
- [ ] Encrypt sensitive data
- [ ] Implement rate limiting
- [ ] Keep dependencies updated
- [ ] Configure proper file permissions

### Client Security
- [ ] Validate API responses
- [ ] Implement proper authentication
- [ ] Secure local storage
- [ ] Use HTTPS for API calls
- [ ] Implement certificate pinning
- [ ] Obfuscate sensitive code
- [ ] Regular security audits

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check MySQL service
sudo systemctl status mysql

# Test connection
mysql -u nellie_user -p nellie_db
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R www-data:www-data /path/to/nellie/server
chmod -R 755 webroot/ logs/ tmp/
```

#### React Native Issues
```bash
# Clear cache
npx react-native start --reset-cache

# Rebuild
cd android && ./gradlew clean && cd ..
npm run android
```

## Getting Help

- **Planning Documents**: Check the `/planning` folder
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Wiki**: Check project wiki for additional resources 