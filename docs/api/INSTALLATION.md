# Installation & Setup Guide

## Overview

This guide provides step-by-step instructions for installing and configuring the Nellie social media management platform on your server.

## System Requirements

### Server Requirements
- **Operating System**: Linux (Ubuntu 20.04+ recommended), Windows Server, or macOS
- **Web Server**: Apache 2.4+ or Nginx 1.18+
- **PHP**: 8.4+
- **Database**: MySQL 8.0+ or MariaDB 10.6+
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 50GB minimum, 100GB+ recommended for media files
- **SSL Certificate**: Required for production (Let's Encrypt recommended)

### PHP Extensions Required
```bash
php-curl
php-gd
php-intl
php-json
php-mbstring
php-mysql
php-xml
php-zip
php-fileinfo
php-openssl
```

### Node.js (for client development)
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher

---

## Quick Start

### 1. Download & Extract

```bash
# Download the latest release
wget https://github.com/your-org/nellie/archive/v1.0.0.tar.gz
tar -xzf v1.0.0.tar.gz
cd nellie-1.0.0
```

### 2. Install Dependencies

```bash
# Server dependencies
cd server
composer install --optimize-autoloader --no-dev

# Client dependencies (if developing)
cd ../client
npm install
```

### 3. Configure Environment

```bash
# Copy configuration template
cp server/config/app_local.example.php server/config/app_local.php

# Edit configuration
nano server/config/app_local.php
```

### 4. Database Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE nellie_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
cd server
bin/cake migrations migrate
bin/cake migrations seed
```

### 5. Set Permissions

```bash
chmod -R 755 server/webroot/
chmod -R 755 server/logs/
chmod -R 755 server/tmp/
chown -R www-data:www-data server/
```

---

## Detailed Installation

### Step 1: Server Setup

#### Ubuntu/Debian Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y apache2 mysql-server php8.4 php8.4-fpm \
  php8.4-mysql php8.4-curl php8.4-gd php8.4-intl \
  php8.4-json php8.4-mbstring php8.4-xml php8.4-zip \
  php8.4-fileinfo composer git unzip

# Enable Apache modules
sudo a2enmod rewrite ssl headers php8.4

# Start services
sudo systemctl start apache2 mysql
sudo systemctl enable apache2 mysql
```

#### CentOS/RHEL Setup

```bash
# Install EPEL repository
sudo yum install -y epel-release

# Install packages
sudo yum install -y httpd mysql-server php php-fpm \
  php-mysql php-curl php-gd php-intl php-json \
  php-mbstring php-xml php-zip composer git

# Start services
sudo systemctl start httpd mysqld
sudo systemctl enable httpd mysqld
```

### Step 2: Database Configuration

#### MySQL Setup

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE nellie_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'nellie_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON nellie_db.* TO 'nellie_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### Step 3: Application Configuration

#### Server Configuration

Create and edit `server/config/app_local.php`:

```php
<?php
return [
    'debug' => false, // Set to true for development

    /*
     * Security salt for encryption
     * Generate with: bin/cake generate_salt
     */
    'Security' => [
        'salt' => 'your-unique-security-salt-here-make-it-long-and-random',
    ],

    /*
     * Database configuration
     */
    'Datasources' => [
        'default' => [
            'host' => 'localhost',
            'username' => 'nellie_user',
            'password' => 'your_secure_password',
            'database' => 'nellie_db',
            'timezone' => 'Asia/Kolkata', // Adjust as needed
            'encoding' => 'utf8mb4',
            'url' => env('DATABASE_URL', null),
        ],
    ],

    /*
     * Email configuration
     */
    'EmailTransport' => [
        'default' => [
            'className' => 'Smtp',
            'host' => 'your-smtp-server.com',
            'port' => 587,
            'username' => 'your-email@domain.com',
            'password' => 'your-email-password',
            'tls' => true,
        ],
    ],

    /*
     * Social Media API Configuration
     */
    'SocialMedia' => [
        'Facebook' => [
            'app_id' => 'your_facebook_app_id',
            'app_secret' => 'your_facebook_app_secret',
            'redirect_uri' => 'https://your-domain.com/api/oauth/callback',
        ],
        'Instagram' => [
            'app_id' => 'your_instagram_app_id',
            'app_secret' => 'your_instagram_app_secret',
            'redirect_uri' => 'https://your-domain.com/api/oauth/callback',
        ],
        'Twitter' => [
            'consumer_key' => 'your_twitter_consumer_key',
            'consumer_secret' => 'your_twitter_consumer_secret',
            'redirect_uri' => 'https://your-domain.com/api/oauth/callback',
        ],
        'YouTube' => [
            'client_id' => 'your_google_client_id',
            'client_secret' => 'your_google_client_secret',
            'redirect_uri' => 'https://your-domain.com/api/oauth/callback',
        ],
        'Threads' => [
            'app_id' => 'your_threads_app_id',
            'app_secret' => 'your_threads_app_secret',
            'redirect_uri' => 'https://your-domain.com/api/oauth/callback',
        ],
        'LinkedIn' => [
            'client_id' => 'your_linkedin_client_id',
            'client_secret' => 'your_linkedin_client_secret',
            'redirect_uri' => 'https://your-domain.com/api/oauth/callback',
        ],
    ],

    /*
     * Application settings
     */
    'App' => [
        'fullBaseUrl' => 'https://your-domain.com',
        'encoding' => 'UTF-8',
        'defaultLocale' => 'en_US',
        'timezone' => 'Asia/Kolkata',
    ],

    /*
     * File upload settings
     */
    'Upload' => [
        'maxFileSize' => '50MB',
        'allowedTypes' => ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'],
        'path' => ROOT . DS . 'webroot' . DS . 'uploads' . DS,
    ],
];
```

#### Environment Variables (Optional)

Create `.env` file for sensitive configuration:

```bash
# Database
DATABASE_URL="mysql://nellie_user:password@localhost/nellie_db"

# Social Media APIs
FACEBOOK_APP_ID="your_facebook_app_id"
FACEBOOK_APP_SECRET="your_facebook_app_secret"
INSTAGRAM_APP_ID="your_instagram_app_id"
INSTAGRAM_APP_SECRET="your_instagram_app_secret"
TWITTER_CONSUMER_KEY="your_twitter_consumer_key"
TWITTER_CONSUMER_SECRET="your_twitter_consumer_secret"

# Email
SMTP_HOST="your-smtp-server.com"
SMTP_USERNAME="your-email@domain.com"
SMTP_PASSWORD="your-email-password"

# Application
APP_FULL_BASE_URL="https://your-domain.com"
SECURITY_SALT="your-unique-security-salt"
```

### Step 4: Web Server Configuration

#### Apache Configuration

Create `/etc/apache2/sites-available/nellie.conf`:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/nellie/server/webroot
    
    # Redirect to HTTPS
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /var/www/nellie/server/webroot
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    
    # Directory settings
    <Directory /var/www/nellie/server/webroot>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # CakePHP rewrite rules
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    
    # Log files
    ErrorLog ${APACHE_LOG_DIR}/nellie_error.log
    CustomLog ${APACHE_LOG_DIR}/nellie_access.log combined
</VirtualHost>
```

Enable the site:
```bash
sudo a2ensite nellie
sudo a2dissite 000-default
sudo systemctl reload apache2
```

#### Nginx Configuration

Create `/etc/nginx/sites-available/nellie`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    root /var/www/nellie/server/webroot;
    index index.php;
    
    # SSL configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    
    # File upload limits
    client_max_body_size 50M;
    
    # CakePHP configuration
    location / {
        try_files $uri $uri/ /index.php?$args;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ /(config|logs|tmp) {
        deny all;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/nellie /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Database Migrations

```bash
cd /var/www/nellie/server

# Run database migrations
bin/cake migrations migrate

# Seed initial data (optional)
bin/cake migrations seed

# Create initial admin user
bin/cake create_admin_user
# Follow prompts to create admin account
```

---

## Social Media API Setup

### Facebook & Instagram

1. Visit [Facebook Developers](https://developers.facebook.com/)
2. Create new app or use existing
3. Add "Facebook Login" and "Instagram Basic Display" products
4. Configure OAuth redirect URI: `https://your-domain.com/api/oauth/callback`
5. Get App ID and App Secret from app dashboard
6. Add to configuration file

**Required Permissions:**
- Facebook: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`
- Instagram: `instagram_basic`, `instagram_content_publish`

### X (Twitter)

1. Visit [X Developer Portal](https://developer.twitter.com/)
2. Create new project and app
3. Generate API keys and Bearer token
4. Configure OAuth 2.0 settings
5. Set callback URL: `https://your-domain.com/api/oauth/callback`

**Required Scopes:**
- `tweet.read`, `tweet.write`, `users.read`, `offline.access`

### YouTube (Google)

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Configure authorized redirect URIs
6. Set up consent screen

**Required Scopes:**
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube`

### LinkedIn

1. Visit [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Create new application
3. Add "Share on LinkedIn" and "Marketing API" products
4. Configure OAuth 2.0 redirect URLs
5. Get Client ID and Client Secret

**Required Scopes:**
- `w_member_social`, `r_basicprofile`, `r_organization_social`

### Threads (Meta)

1. Use same Facebook app as Facebook/Instagram
2. Add Threads API product to your app
3. Configure OAuth redirect URIs
4. May require additional approval from Meta

---

## Cron Jobs Setup

Set up automated tasks for posting and analytics:

```bash
# Edit crontab
crontab -e

# Add these entries:
# Post publisher (every 5 minutes)
*/5 * * * * cd /var/www/nellie/server && bin/cake post_publisher

# Analytics sync (every hour)
0 * * * * cd /var/www/nellie/server && bin/cake analytics_sync

# Cleanup tasks (daily at 2 AM)
0 2 * * * cd /var/www/nellie/server && bin/cake cleanup

# Best time analysis (weekly on Sunday at 3 AM)
0 3 * * 0 cd /var/www/nellie/server && bin/cake best_time_analysis

# Token refresh (daily at 1 AM)
0 1 * * * cd /var/www/nellie/server && bin/cake refresh_tokens
```

---

## SSL Certificate Setup

### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache

# Get certificate (Apache)
sudo certbot --apache -d your-domain.com

# Get certificate (Nginx)
sudo certbot --nginx -d your-domain.com

# Auto-renewal (should be configured automatically)
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Using Custom Certificate

1. Purchase SSL certificate from CA
2. Upload certificate files to server
3. Configure web server with certificate paths
4. Test SSL configuration

---

## Performance Optimization

### PHP Configuration

Edit `/etc/php/8.4/apache2/php.ini` or `/etc/php/8.4/fpm/php.ini`:

```ini
# Memory and execution
memory_limit = 512M
max_execution_time = 300
max_input_time = 300

# File uploads
upload_max_filesize = 50M
post_max_size = 50M
max_file_uploads = 20

# Sessions
session.gc_maxlifetime = 7200

# OPcache (recommended)
opcache.enable = 1
opcache.memory_consumption = 256
opcache.max_accelerated_files = 4000
opcache.revalidate_freq = 60
```

### MySQL Optimization

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# InnoDB settings
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2

# Query cache
query_cache_type = 1
query_cache_size = 128M

# Connection settings
max_connections = 200
wait_timeout = 300
```

### Apache/Nginx Optimization

**Apache** - Enable mod_pagespeed and mod_deflate:
```bash
sudo a2enmod deflate expires headers
```

**Nginx** - Enable gzip compression in config:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

---

## Security Considerations

### File Permissions

```bash
# Set correct ownership
sudo chown -R www-data:www-data /var/www/nellie/

# Set directory permissions
find /var/www/nellie/ -type d -exec chmod 755 {} \;

# Set file permissions
find /var/www/nellie/ -type f -exec chmod 644 {} \;

# Executable files
chmod +x /var/www/nellie/server/bin/cake
```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Or specific SSH port
sudo ufw allow your-ssh-port/tcp
```

### Database Security

```bash
# Create backup user
mysql -u root -p
```

```sql
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'backup_password';
GRANT SELECT, LOCK TABLES ON nellie_db.* TO 'backup_user'@'localhost';
```

---

## Backup & Maintenance

### Database Backup Script

Create `/usr/local/bin/backup-nellie.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/nellie"
DATE=$(date +%Y%m%d_%H%M%S)
DB_USER="backup_user"
DB_PASS="backup_password"
DB_NAME="nellie_db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/nellie/server/webroot/uploads/

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Make executable and add to cron:
```bash
chmod +x /usr/local/bin/backup-nellie.sh

# Add to crontab
0 3 * * * /usr/local/bin/backup-nellie.sh
```

### Log Rotation

Create `/etc/logrotate.d/nellie`:

```
/var/www/nellie/server/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        systemctl reload apache2
    endscript
}
```

---

## Troubleshooting

### Common Issues

#### Permission Errors
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/nellie/
sudo chmod -R 755 /var/www/nellie/server/webroot/
sudo chmod -R 755 /var/www/nellie/server/logs/
sudo chmod -R 755 /var/www/nellie/server/tmp/
```

#### Database Connection Issues
```bash
# Test database connection
mysql -u nellie_user -p nellie_db

# Check MySQL service
sudo systemctl status mysql
sudo systemctl restart mysql
```

#### Web Server Issues
```bash
# Check Apache logs
sudo tail -f /var/log/apache2/error.log

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo apache2ctl configtest
sudo nginx -t
```

#### PHP Errors
```bash
# Check PHP logs
sudo tail -f /var/log/php8.4-fpm.log

# Test PHP
php -v
php -m | grep -i mysql
```

### Health Check Script

Create `/usr/local/bin/nellie-health.sh`:

```bash
#!/bin/bash

echo "=== Nellie Health Check ==="

# Check web server
if systemctl is-active --quiet apache2; then
    echo "✓ Apache is running"
else
    echo "✗ Apache is not running"
fi

# Check database
if systemctl is-active --quiet mysql; then
    echo "✓ MySQL is running"
else
    echo "✗ MySQL is not running"
fi

# Check database connection
if mysql -u nellie_user -p'your_password' -e "SELECT 1" nellie_db &>/dev/null; then
    echo "✓ Database connection successful"
else
    echo "✗ Database connection failed"
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo "✓ Disk usage: $DISK_USAGE%"
else
    echo "⚠ Disk usage high: $DISK_USAGE%"
fi

# Check SSL certificate
if openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "✓ SSL certificate is valid"
else
    echo "✗ SSL certificate issue"
fi
```

---

## Support & Resources

### Getting Help

1. **Documentation**: Check [API Documentation](https://docs.nellie.app)
2. **GitHub Issues**: [Report Issues](https://github.com/your-org/nellie/issues)
3. **Community Forum**: [Discussions](https://github.com/your-org/nellie/discussions)
4. **Email Support**: support@nellie.app

### Useful Commands

```bash
# Clear application cache
cd /var/www/nellie/server
bin/cake cache clear_all

# Check system status
bin/cake health_check

# Update database schema
bin/cake migrations migrate

# Generate security salt
bin/cake generate_salt

# Test social media connections
bin/cake test_social_connections
```

### Monitoring

Consider setting up monitoring with:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Server monitoring**: New Relic, DataDog
- **Log monitoring**: ELK Stack, Splunk
- **Performance monitoring**: APM tools

This completes the comprehensive installation guide for Nellie. Follow these steps carefully and refer to the troubleshooting section if you encounter any issues. 