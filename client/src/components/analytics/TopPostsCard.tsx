import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TopPost {
  id: number;
  content: string;
  platform: string;
  engagement: number;
  reach: number;
  posted_at: string;
}

interface TopPostsCardProps {
  posts: TopPost[];
  onViewPost?: (postId: number) => void;
}

const TopPostsCard: React.FC<TopPostsCardProps> = ({
  posts,
  onViewPost,
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

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const truncateContent = (content: string, maxLength: number = 80): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const renderPostItem = ({ item, index }: { item: TopPost; index: number }) => {
    const config = getPlatformConfig(item.platform);
    
    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => onViewPost?.(item.id)}
      >
        <View style={styles.postHeader}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{index + 1}</Text>
          </View>
          
          <View style={[styles.platformIcon, { backgroundColor: config.color }]}>
            <Icon name={config.icon} size={16} color="#fff" />
          </View>
          
          <View style={styles.postInfo}>
            <Text style={styles.platformName}>{config.name}</Text>
            <Text style={styles.postDate}>{formatDate(item.posted_at)}</Text>
          </View>
          
          <TouchableOpacity style={styles.viewButton}>
            <Icon name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.postContent}>
          {truncateContent(item.content)}
        </Text>

        <View style={styles.postMetrics}>
          <View style={styles.metric}>
            <Icon name="favorite" size={16} color="#E91E63" />
            <Text style={styles.metricText}>
              {formatNumber(item.engagement)}
            </Text>
            <Text style={styles.metricLabel}>Engagement</Text>
          </View>
          
          <View style={styles.metricSeparator} />
          
          <View style={styles.metric}>
            <Icon name="visibility" size={16} color="#4CAF50" />
            <Text style={styles.metricText}>
              {formatNumber(item.reach)}
            </Text>
            <Text style={styles.metricLabel}>Reach</Text>
          </View>
          
          <View style={styles.metricSeparator} />
          
          <View style={styles.metric}>
            <Icon name="show-chart" size={16} color="#FF9800" />
            <Text style={styles.metricText}>
              {((item.engagement / item.reach) * 100).toFixed(1)}%
            </Text>
            <Text style={styles.metricLabel}>Rate</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="star" size={20} color="#FF9800" />
          <Text style={styles.title}>Top Performing Posts</Text>
        </View>
        
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Icon name="arrow-forward" size={16} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {posts.length > 0 ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPostItem}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon name="insert-chart" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No posts data available</Text>
          <Text style={styles.emptyStateSubtext}>
            Start creating posts to see analytics
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
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
  postItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  platformIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  postInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  postDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  viewButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  postMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 8,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  metricSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default TopPostsCard; 