import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ScheduledPost {
  id: number;
  title: string;
  content: string;
  client_id: number;
  platforms: string[];
  scheduled_at: string;
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  is_recurring?: boolean;
}

interface PublishingQueueCardProps {
  posts: ScheduledPost[];
  onViewQueue: () => void;
  onEditPost: (postId: number) => void;
}

const PublishingQueueCard: React.FC<PublishingQueueCardProps> = ({
  posts,
  onViewQueue,
  onEditPost,
}) => {
  const getPlatformIcon = (platform: string): string => {
    const icons = {
      facebook: 'facebook',
      instagram: 'camera-alt',
      twitter: 'chat',
      linkedin: 'business',
      youtube: 'play-arrow',
      threads: 'forum',
    };
    return icons[platform as keyof typeof icons] || 'public';
  };

  const getPlatformColor = (platform: string): string => {
    const colors = {
      facebook: '#1877F2',
      instagram: '#E4405F',
      twitter: '#1DA1F2',
      linkedin: '#0A66C2',
      youtube: '#FF0000',
      threads: '#000000',
    };
    return colors[platform as keyof typeof colors] || '#666';
  };

  const formatTimeUntilPosting = (scheduledAt: string): string => {
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    const diffInMinutes = Math.floor((scheduledDate.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 0) {
      return 'Past due';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / (24 * 60));
      return `${days}d`;
    }
  };

  const getUrgencyColor = (scheduledAt: string): string => {
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    const diffInHours = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 0) return '#f44336'; // Past due - red
    if (diffInHours < 1) return '#FF9800'; // Less than 1 hour - orange
    if (diffInHours < 24) return '#2196F3'; // Less than 24 hours - blue
    return '#4CAF50'; // More than 24 hours - green
  };

  const truncateContent = (content: string, maxLength: number = 60): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const renderQueueItem = ({ item, index }: { item: ScheduledPost; index: number }) => {
    const timeUntil = formatTimeUntilPosting(item.scheduled_at);
    const urgencyColor = getUrgencyColor(item.scheduled_at);
    
    return (
      <TouchableOpacity
        style={styles.queueItem}
        onPress={() => onEditPost(item.id)}
      >
        <View style={styles.queueItemLeft}>
          <View style={[styles.urgencyIndicator, { backgroundColor: urgencyColor }]}>
            <Text style={styles.timeUntilText}>{timeUntil}</Text>
          </View>
          
          <View style={styles.postInfo}>
            <Text style={styles.postTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.postContent} numberOfLines={2}>
              {truncateContent(item.content)}
            </Text>
            
            <View style={styles.postMeta}>
              <Text style={styles.scheduledTime}>
                {new Date(item.scheduled_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              {item.is_recurring && (
                <View style={styles.recurringBadge}>
                  <Icon name="refresh" size={10} color="#FF9800" />
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.queueItemRight}>
          <View style={styles.platformsPreview}>
            {item.platforms.slice(0, 3).map((platform, platformIndex) => (
              <View
                key={platformIndex}
                style={[
                  styles.platformPreviewIcon,
                  { backgroundColor: getPlatformColor(platform) }
                ]}
              >
                <Icon
                  name={getPlatformIcon(platform)}
                  size={10}
                  color="#fff"
                />
              </View>
            ))}
            {item.platforms.length > 3 && (
              <Text style={styles.morePlatforms}>+{item.platforms.length - 3}</Text>
            )}
          </View>
          
          <Icon name="chevron-right" size={16} color="#999" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Icon name="schedule" size={20} color="#2196F3" />
        <Text style={styles.headerTitle}>Publishing Queue</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{posts.length}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.viewAllButton} onPress={onViewQueue}>
        <Text style={styles.viewAllText}>View All</Text>
        <Icon name="arrow-forward" size={16} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="schedule-send" size={48} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No posts in queue</Text>
      <Text style={styles.emptyStateText}>
        Schedule some posts to see them here
      </Text>
    </View>
  );

  if (posts.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderQueueItem}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      
      <View style={styles.footer}>
        <View style={styles.queueStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{posts.length}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          
          <View style={styles.statSeparator} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {posts.filter(p => {
                const diffInHours = (new Date(p.scheduled_at).getTime() - new Date().getTime()) / (1000 * 60 * 60);
                return diffInHours < 24;
              }).length}
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          
          <View style={styles.statSeparator} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {posts.filter(p => p.is_recurring).length}
            </Text>
            <Text style={styles.statLabel}>Recurring</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  countBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginRight: 4,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  queueItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgencyIndicator: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  timeUntilText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  postInfo: {
    flex: 1,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  postContent: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 4,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduledTime: {
    fontSize: 11,
    color: '#999',
  },
  recurringBadge: {
    marginLeft: 6,
    padding: 2,
  },
  queueItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  platformPreviewIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -4,
  },
  morePlatforms: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  queueStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
});

export default PublishingQueueCard; 