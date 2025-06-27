# Database Design

## Overview
Nellie uses MySQL 8.0/MariaDB as the primary database with a well-structured relational design optimized for social media management workflows. All database interactions use prepared statements for security.

## Entity Relationship Diagram
The ERD above shows the complete database structure with all entities and their relationships.

## Core Tables

### Organizations
The root entity representing agencies or businesses using Nellie.

```sql
CREATE TABLE organizations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);
```

### Users
System users with role-based access (Manager/Designer).

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('manager', 'designer') NOT NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_organization_email (organization_id, email),
    INDEX idx_role (role),
    INDEX idx_last_login (last_login)
);
```

### Clients
Clients managed by the organization.

```sql
CREATE TABLE clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    description TEXT,
    logo_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_organization_active (organization_id, is_active),
    INDEX idx_name (name)
);
```

### Social Accounts
Social media accounts linked to clients.

```sql
CREATE TABLE social_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    platform ENUM('facebook', 'instagram', 'twitter', 'youtube', 'threads', 'linkedin') NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP NULL,
    account_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE KEY unique_account (client_id, platform, account_id),
    INDEX idx_client_platform (client_id, platform),
    INDEX idx_token_expires (token_expires_at)
);
```

### Posts
Content posts created by designers.

```sql
CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    created_by INT NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    platform_specific_data JSON,
    status ENUM('draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed', 'cancelled') DEFAULT 'draft',
    scheduled_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern VARCHAR(100),
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_client_status (client_id, status),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_created_by (created_by),
    INDEX idx_status_scheduled (status, scheduled_at)
);
```

## Relationship Explanations

### Organization → Users → Clients
- Each organization can have multiple users (managers and designers)
- Each organization can manage multiple clients
- Users are scoped to their organization

### Client → Social Accounts → Posts
- Each client can have multiple social media accounts
- Posts are created for specific clients
- Posts can be published to multiple social accounts

### Approval Workflow
- Posts require approval from managers before publishing
- The `post_approvals` table tracks the approval process
- Feedback can be provided for content modifications

### Analytics Tracking
- Analytics are tied to specific post-platform combinations
- Data is collected after posts are published
- Historical analytics data is preserved

## Indexing Strategy

### Primary Indexes
- All foreign keys are indexed for join performance
- Composite indexes for common query patterns
- Status and date-based filtering indexes

### Query Optimization
- `posts` table indexed on `(client_id, status)` for dashboard queries
- `social_accounts` indexed on `(client_id, platform)` for account management
- `analytics` indexed on `post_platform_id` and `recorded_at` for reporting

## Data Integrity

### Constraints
- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate social accounts
- Check constraints for enum values

### Cascading Rules
- Organization deletion cascades to users and clients
- Client deletion cascades to related posts and accounts
- User deletion restricted if they have created posts

## Security Considerations

### Sensitive Data
- Access tokens encrypted at application level
- Password hashes using bcrypt
- Personal information properly secured

### Audit Trail
- `system_logs` table tracks all data modifications
- User actions logged with IP and timestamp
- Data change history maintained