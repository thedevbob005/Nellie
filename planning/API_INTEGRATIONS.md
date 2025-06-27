# API Integrations

## Overview
Nellie integrates with multiple social media platforms to provide seamless content publishing and analytics. Each platform has its own API requirements, authentication methods, and rate limits.

## Platform-Specific Integrations

### Facebook Integration

#### API Details
- **API Version**: Facebook Graph API v18.0+
- **Authentication**: OAuth 2.0
- **Required Permissions**: 
  - `pages_manage_posts`
  - `pages_read_engagement` 
  - `pages_show_list`
  - `publish_to_groups` (if needed)

#### Supported Content Types
- **Text Posts**: Plain text updates
- **Image Posts**: Single or multiple images
- **Video Posts**: MP4, MOV formats
- **Link Posts**: URL previews with custom text

#### Publishing Flow
1. **Authentication**: OAuth flow to get user access token
2. **Page Token Exchange**: Convert user token to page access token
3. **Content Upload**: Upload media files (if applicable)
4. **Post Creation**: Create post with content and media
5. **Scheduling**: Set `scheduled_publish_time` for future posts

#### Analytics Available
- Likes, Comments, Shares
- Reach and Impressions
- Click-through rates (for link posts)
- Video view statistics

### Instagram Integration

#### API Details
- **API Version**: Instagram Basic Display API + Instagram Graph API
- **Authentication**: OAuth 2.0 (Facebook-based)
- **Required Permissions**:
  - `instagram_basic`
  - `instagram_content_publish`
  - `pages_show_list`

#### Supported Content Types
- **Photo Posts**: Single images, carousels
- **Video Posts**: MP4 format, up to 60 seconds
- **Stories**: Images and videos (24-hour expiration)
- **Reels**: Short-form videos with music/effects

#### Publishing Flow
1. **Authentication**: Facebook OAuth with Instagram permissions
2. **Account Selection**: Choose Instagram business account
3. **Media Upload**: Upload images/videos to Instagram
4. **Container Creation**: Create media container
5. **Publication**: Publish container to Instagram feed

#### Analytics Available
- Likes, Comments, Saves
- Reach and Impressions
- Profile visits
- Story completion rates

### X (Twitter) Integration

#### API Details
- **API Version**: X API v2
- **Authentication**: OAuth 2.0
- **Required Scopes**:
  - `tweet.read`
  - `tweet.write`
  - `users.read`
  - `offline.access`

#### Supported Content Types
- **Text Tweets**: Up to 280 characters
- **Media Tweets**: Images, videos, GIFs
- **Thread Tweets**: Connected tweet sequences
- **Quote Tweets**: Tweets with quoted content

#### Publishing Flow
1. **Authentication**: OAuth 2.0 flow
2. **Media Upload**: Upload images/videos (if applicable)
3. **Tweet Creation**: Create tweet with text and media
4. **Thread Handling**: Link tweets for thread posts

#### Analytics Available
- Likes, Retweets, Replies
- Impressions and Engagements
- Profile clicks
- Link clicks

### YouTube Integration

#### API Details
- **API Version**: YouTube Data API v3
- **Authentication**: OAuth 2.0 (Google-based)
- **Required Scopes**:
  - `https://www.googleapis.com/auth/youtube.upload`
  - `https://www.googleapis.com/auth/youtube`
  - `https://www.googleapis.com/auth/youtube.readonly`

#### Supported Content Types
- **Video Uploads**: MP4, MOV, AVI formats
- **Community Posts**: Text, images, polls (for eligible channels)
- **Shorts**: Vertical videos under 60 seconds
- **Live Streams**: Scheduled live broadcasts

#### Publishing Flow
1. **Authentication**: Google OAuth flow
2. **Video Upload**: Chunked upload for large files
3. **Metadata Setup**: Title, description, tags, thumbnail
4. **Privacy Settings**: Public, unlisted, private
5. **Publishing**: Immediate or scheduled publication

#### Analytics Available
- Views, Likes, Dislikes
- Comments and Shares
- Watch time and retention
- Subscriber growth

### Threads Integration

#### API Details
- **API Version**: Threads API v1.0 (Meta Platform)
- **Authentication**: OAuth 2.0 (Facebook-based)
- **Required Permissions**:
  - `threads_basic`
  - `threads_content_publish`
  - `threads_manage_insights`
  - `pages_show_list`

#### Supported Content Types
- **Text Posts**: Up to 500 characters
- **Media Posts**: Images and videos with text
- **Reply Posts**: Responses to other threads
- **Quote Posts**: Posts with quoted content

#### Publishing Flow
1. **Authentication**: Facebook OAuth with Threads permissions
2. **Account Selection**: Choose Threads professional account
3. **Content Preparation**: Format text and upload media
4. **Post Creation**: Create thread post with content
5. **Publishing**: Immediate or scheduled publication

#### Analytics Available
- Likes, Replies, Reposts
- Views and Impressions
- Profile visits
- Follower growth

### LinkedIn Integration

#### API Details
- **API Version**: LinkedIn Marketing API v2
- **Authentication**: OAuth 2.0
- **Required Scopes**:
  - `w_member_social`
  - `r_basicprofile`
  - `r_organization_social`
  - `w_organization_social`
  - `rw_organization_admin`

#### Supported Content Types
- **Text Posts**: Professional updates and thoughts
- **Media Posts**: Images, videos, and documents
- **Article Posts**: Long-form content publishing
- **Company Updates**: Posts on behalf of company pages
- **Event Posts**: Professional events and announcements

#### Publishing Flow
1. **Authentication**: LinkedIn OAuth 2.0 flow
2. **Profile/Company Selection**: Choose personal or company account
3. **Content Creation**: Format professional content
4. **Media Upload**: Upload professional images/videos/documents
5. **Publishing**: Immediate or scheduled publication
6. **Targeting**: Audience targeting options (for company posts)

#### Analytics Available
- Likes, Comments, Shares
- Views and Impressions
- Click-through rates
- Follower demographics
- Engagement rates
- Professional industry insights

## Authentication Flows
The sequence diagram above illustrates the complete OAuth authentication and content publishing process.

### OAuth Implementation Details

#### Token Management
- **Access Tokens**: Short-lived tokens for API access
- **Refresh Tokens**: Long-lived tokens for token renewal
- **Token Storage**: Encrypted storage in database
- **Token Refresh**: Automatic renewal before expiration

#### Security Considerations
- **HTTPS Only**: All API communications over secure connections
- **State Parameter**: CSRF protection during OAuth flow
- **Token Encryption**: Sensitive tokens encrypted at rest
- **Scope Limitation**: Request minimum required permissions

## Rate Limiting & API Quotas

### Platform-Specific Limits

#### Facebook/Instagram
- **App-Level**: 200 calls per hour per user
- **Page-Level**: Various limits based on page size
- **Bulk Operations**: Special limits for batch requests
- **Marketing API**: Higher limits for business accounts

#### X (Twitter)
- **Tweet Creation**: 300 tweets per 15-minute window
- **Media Upload**: 4 images or 1 video per tweet
- **User Lookup**: 900 requests per 15-minute window
- **Timeline Access**: 1,500 requests per 15-minute window

#### YouTube
- **Upload Quota**: 10,000 units per day
- **Video Upload**: 6 uploads per day for verified accounts
- **API Requests**: 10,000 quota units per day
- **Concurrent Uploads**: 6 concurrent uploads maximum

#### Threads
- **Post Creation**: 250 posts per day per user
- **Media Upload**: 10 images or 1 video per post
- **API Requests**: 200 calls per hour per user
- **Rate Limit Window**: 1 hour rolling window

#### LinkedIn
- **Post Creation**: 150 posts per day per user
- **API Requests**: 500 calls per day per application
- **Media Upload**: 100 MB per file, max 20 files per post
- **Rate Limit Window**: 24 hour rolling window
- **Company Page Posts**: Additional limits based on page size

### Rate Limiting Strategy
1. **Request Tracking**: Monitor API usage per platform
2. **Queue Management**: Prioritize urgent requests
3. **Exponential Backoff**: Handle rate limit responses
4. **Load Distribution**: Spread requests across time
5. **Error Recovery**: Retry failed requests appropriately

## Error Handling

### Common Error Scenarios

#### Authentication Errors
- **Invalid Token**: Token expired or revoked
- **Insufficient Permissions**: Missing required scopes
- **Account Disabled**: User account suspended
- **App Suspended**: Developer app suspended

#### Content Errors
- **Content Policy Violation**: Post violates platform rules
- **Media Format Error**: Unsupported file format/size
- **Character Limit**: Text exceeds platform limits
- **Duplicate Content**: Identical post recently published

#### System Errors
- **Network Timeout**: API request timeout
- **Server Error**: Platform API temporarily unavailable
- **Rate Limit Exceeded**: Too many requests
- **Maintenance Mode**: Platform under maintenance

### Error Recovery Process
1. **Error Classification**: Categorize error type
2. **Retry Logic**: Implement appropriate retry strategy
3. **User Notification**: Inform users of failures
4. **Manual Intervention**: Flag issues requiring attention
5. **Logging**: Record all errors for analysis

## Best Practices

### Content Optimization
- **Platform-Specific Formatting**: Optimize content per platform
- **Media Optimization**: Compress images/videos appropriately
- **Hashtag Strategy**: Platform-appropriate hashtag usage
- **Character Limits**: Respect platform text limitations

### Scheduling Optimization
- **Time Zone Handling**: Respect user's target audience timezone
- **Best Time Analysis**: Analyze optimal posting times
- **Frequency Management**: Avoid spam-like posting patterns
- **Platform Algorithms**: Consider platform algorithm preferences

### Data Management
- **Analytics Aggregation**: Combine data from multiple sources
- **Data Retention**: Implement appropriate data retention policies
- **Privacy Compliance**: Respect user privacy settings
- **Backup Strategy**: Regular backup of critical data

## Implementation Checklist

### Development Phase
- [ ] Set up developer accounts for all platforms
- [ ] Implement OAuth flows for each platform
- [ ] Create API wrapper classes for each service
- [ ] Implement token refresh mechanisms
- [ ] Add comprehensive error handling
- [ ] Create rate limiting system
- [ ] Implement content validation
- [ ] Add analytics data collection
- [ ] Create scheduling system
- [ ] Implement media upload handling

### Testing Phase
- [ ] Test authentication flows
- [ ] Verify content publishing
- [ ] Test error scenarios
- [ ] Validate analytics collection
- [ ] Test rate limiting
- [ ] Verify media uploads
- [ ] Test scheduling accuracy
- [ ] Validate token refresh
- [ ] Test multi-platform posting
- [ ] Verify data synchronization

### Production Phase
- [ ] Monitor API usage quotas
- [ ] Set up error alerting
- [ ] Implement logging systems
- [ ] Create backup procedures
- [ ] Monitor performance metrics
- [ ] Regular security audits
- [ ] Platform API updates monitoring
- [ ] User feedback collection
- [ ] Continuous optimization
- [ ] Documentation maintenance 