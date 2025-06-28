import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
  media_files?: string[];
  is_recurring?: boolean;
  recurring_pattern?: string;
  created_by: number;
  created_at: string;
}

interface PostCardProps {
  post: ScheduledPost;
  clientName: string;
  onEdit: () => void;
  onDelete: () => void;
  onPublishNow: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  clientName,
  onEdit,
  onDelete,
  onPublishNow,
}) => {
  const getPlatformConfig = (platform: string) => {
    const configs = {
      facebook: {
        color: '#1877F2',
        icon: 'facebook',
        name: 'Facebook',
      },
      instagram: {
        color: '#E4405F',
        icon: 'camera-alt',
        name: 'Instagram',
      },
      twitter: {
        color: '#1DA1F2',
        icon: 'chat',
        name: 'X',
      },
      linkedin: {
        color: '#0A66C2',
        icon: 'business',
        name: 'LinkedIn',
      },
      youtube: {
        color: '#FF0000',
        icon: 'play-arrow',
        name: 'YouTube',
      },
      threads: {
        color: '#000000',
        icon: 'forum',
        name: 'Threads',
      },
    };
    return configs[platform as keyof typeof configs] || {
      color: '#666',
      icon: 'public',
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
    };
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          color: '#2196F3',
          icon: 'schedule',
          text: 'Scheduled',
        };
      case 'published':
        return {
          color: '#4CAF50',
          icon: 'check-circle',
          text: 'Published',
        };
      case 'failed':
        return {
          color: '#f44336',
          icon: 'error',
          text: 'Failed',
        };
      case 'draft':
        return {
          color: '#FF9800',
          icon: 'draft',
          text: 'Draft',
        };
      default:
        return {
          color: '#999',
          icon: 'help',
          text: 'Unknown',
        };
    }
  };

  const formatScheduledTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    } else if (diffDays > 0 && diffDays < 7) {
      return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  const truncateContent = (content: string, maxLength: number = 120): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleMoreActions = () => {
    Alert.alert(
      'Post Actions',
      'Choose an action:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: onEdit },
        { text: 'Duplicate', onPress: () => {} },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const statusConfig = getStatusConfig(post.status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
            <Icon name={statusConfig.icon} size={12} color="#fff" />
            <Text style={styles.statusText}>{statusConfig.text}</Text>
          </View>
          
          {post.is_recurring && (
            <View style={styles.recurringBadge}>
              <Icon name="refresh" size={12} color="#FF9800" />
              <Text style={styles.recurringText}>Recurring</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity style={styles.moreButton} onPress={handleMoreActions}>
          <Icon name="more-vert" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.clientName}>{clientName}</Text>
        </View>
        
        <Text style={styles.postContent}>
          {truncateContent(post.content)}
        </Text>
        
        {post.media_files && post.media_files.length > 0 && (
          <View style={styles.mediaIndicator}>
            <Icon name="photo" size={16} color="#666" />
            <Text style={styles.mediaText}>
              {post.media_files.length} media file{post.media_files.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.timeInfo}>
            <Icon name="schedule" size={16} color="#666" />
            <Text style={styles.scheduledTime}>
              {formatScheduledTime(post.scheduled_at)}
            </Text>
          </View>
          
          <View style={styles.platforms}>
            {post.platforms.map((platform, index) => {
              const config = getPlatformConfig(platform);
              return (
                <View
                  key={index}
                  style={[styles.platformIcon, { backgroundColor: config.color }]}
                >
                  <Icon name={config.icon} size={12} color="#fff" />
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Icon name="edit" size={16} color="#2196F3" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          
          {post.status === 'scheduled' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.publishButton]}
              onPress={onPublishNow}
            >
              <Icon name="send" size={16} color="#4CAF50" />
              <Text style={[styles.actionText, { color: '#4CAF50' }]}>
                Publish Now
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
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
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
  },
  recurringText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FF9800',
    marginLeft: 4,
  },
  moreButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  contentHeader: {
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  mediaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  mediaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerLeft: {
    flex: 1,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduledTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  platforms: {
    flexDirection: 'row',
    gap: 4,
  },
  platformIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  publishButton: {
    backgroundColor: '#E8F5E8',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2196F3',
    marginLeft: 4,
  },
});

export default PostCard; 