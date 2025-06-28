import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Chip,
  List,
  Divider,
  IconButton,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { AppDispatch, RootState } from '../../store';
import { selectUser } from '../../store/slices/authSlice';
import { 
  fetchClients, 
  selectClients, 
  selectClientsLoading 
} from '../../store/slices/clientsSlice';
import {
  fetchPosts,
  selectPosts,
  selectPostsLoading,
  selectPendingApprovals,
  selectScheduledPosts,
} from '../../store/slices/postsSlice';
import apiService from '../../services/api';

interface DashboardStats {
  totalClients: number;
  totalPosts: number;
  pendingApprovals: number;
  scheduledPosts: number;
  publishedThisWeek: number;
  engagement: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
  };
}

interface RecentPost {
  id: number;
  title?: string;
  content: string;
  status: string;
  client: {
    id: number;
    name: string;
    logo_path?: string;
  };
  created: string;
  platforms: Array<{
    platform: string;
    account_name: string;
  }>;
}

const DashboardScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const screenWidth = Dimensions.get('window').width;

  // Redux state
  const user = useSelector(selectUser);
  const clients = useSelector(selectClients);
  const clientsLoading = useSelector(selectClientsLoading);
  const posts = useSelector(selectPosts);
  const postsLoading = useSelector(selectPostsLoading);
  const pendingApprovals = useSelector(selectPendingApprovals);
  const scheduledPosts = useSelector(selectScheduledPosts);

  // Local state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load basic data
      await Promise.all([
        dispatch(fetchClients()).unwrap(),
        dispatch(fetchPosts({ limit: 5 })).unwrap(),
      ]);

      // Load dashboard stats (mock data for now)
      const mockStats: DashboardStats = {
        totalClients: clients.length,
        totalPosts: posts.length,
        pendingApprovals: pendingApprovals.length,
        scheduledPosts: scheduledPosts.length,
        publishedThisWeek: posts.filter(p => p.status === 'published').length,
        engagement: {
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
        },
      };
      setStats(mockStats);

      // Set recent posts
      setRecentPosts(posts.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [dispatch, clients.length, posts.length, pendingApprovals.length, scheduledPosts.length]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  const getStatusColor = (status: string) => {
    const colors = {
      draft: '#6c757d',
      pending_approval: '#ffc107',
      approved: '#28a745',
      scheduled: '#17a2b8',
      published: '#007bff',
      failed: '#dc3545',
      cancelled: '#6c757d',
    };
    return colors[status as keyof typeof colors] || '#6c757d';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'Draft',
      pending_approval: 'Pending',
      approved: 'Approved',
      scheduled: 'Scheduled',
      published: 'Published',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const renderStatsCard = (title: string, value: number, icon: string, color: string, onPress?: () => void) => (
    <Surface style={[styles.statsCard, { borderLeftColor: color }]} elevation={2}>
      <TouchableOpacity style={styles.statsContent} onPress={onPress} disabled={!onPress}>
        <View style={styles.statsInfo}>
          <Title style={styles.statsValue}>{value}</Title>
          <Paragraph style={styles.statsTitle}>{title}</Paragraph>
        </View>
        <Ionicons name={icon as any} size={32} color={color} />
      </TouchableOpacity>
    </Surface>
  );

  const renderRecentPost = (post: RecentPost) => (
    <View key={post.id} style={styles.recentPostItem}>
      <View style={styles.postHeader}>
        <Avatar.Image
          size={24}
          source={
            post.client.logo_path
              ? { uri: post.client.logo_path }
              : undefined
          }
        />
        <View style={styles.postInfo}>
          <Paragraph style={styles.clientName}>{post.client.name}</Paragraph>
          <Paragraph style={styles.postDate}>
            {format(new Date(post.created), 'MMM dd, HH:mm')}
          </Paragraph>
        </View>
        <Chip
          style={[styles.statusChip, { backgroundColor: getStatusColor(post.status) }]}
          textStyle={styles.statusText}
          compact
        >
          {getStatusLabel(post.status)}
        </Chip>
      </View>
      
      <Paragraph style={styles.postContent} numberOfLines={2}>
        {post.content}
      </Paragraph>
      
      <View style={styles.platformsContainer}>
        {post.platforms.map((platform, index) => (
          <Chip
            key={index}
            style={styles.platformChip}
            textStyle={styles.platformText}
            compact
          >
            {platform.platform}
          </Chip>
        ))}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Paragraph style={styles.loadingText}>Loading dashboard...</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Section */}
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Title style={styles.welcomeTitle}>
            Welcome back, {user?.first_name}! 👋
          </Title>
          <Paragraph style={styles.welcomeSubtitle}>
            Here's what's happening with your social media management
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Quick Stats */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            {renderStatsCard(
              'Total Clients',
              stats.totalClients,
              'people',
              '#1976d2',
              () => navigation.navigate('Clients' as never)
            )}
            {renderStatsCard(
              'Total Posts',
              stats.totalPosts,
              'document-text',
              '#388e3c',
              () => navigation.navigate('Posts' as never)
            )}
          </View>
          
          <View style={styles.statsRow}>
            {renderStatsCard(
              'Pending Approvals',
              stats.pendingApprovals,
              'time',
              '#f57c00',
              user?.role === 'manager' 
                ? () => navigation.navigate('Approval' as never)
                : undefined
            )}
            {renderStatsCard(
              'Scheduled Posts',
              stats.scheduledPosts,
              'calendar',
              '#7b1fa2',
              () => navigation.navigate('Calendar' as never)
            )}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title style={styles.actionsTitle}>Quick Actions</Title>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('CreatePost' as never)}
              style={[styles.actionButton, { backgroundColor: '#1976d2' }]}
              contentStyle={styles.actionButtonContent}
              icon="plus"
            >
              New Post
            </Button>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Clients' as never)}
              style={[styles.actionButton, { backgroundColor: '#388e3c' }]}
              contentStyle={styles.actionButtonContent}
              icon="account-plus"
            >
              Add Client
            </Button>
          </View>
          
          {user?.role === 'manager' && pendingApprovals.length > 0 && (
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Approval' as never)}
              style={styles.approvalButton}
              contentStyle={styles.actionButtonContent}
              icon="check-circle"
            >
              Review {pendingApprovals.length} Pending Posts
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Recent Posts */}
      <Card style={styles.recentCard}>
        <Card.Content>
          <View style={styles.recentHeader}>
            <Title style={styles.recentTitle}>Recent Posts</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Posts' as never)}
              compact
            >
              View All
            </Button>
          </View>
          
          {recentPosts.length > 0 ? (
            recentPosts.map((post, index) => (
              <View key={post.id}>
                {renderRecentPost(post)}
                {index < recentPosts.length - 1 && <Divider style={styles.divider} />}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Paragraph style={styles.emptyText}>No recent posts</Paragraph>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('CreatePost' as never)}
                style={styles.createButton}
              >
                Create Your First Post
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Recent Clients */}
      <Card style={[styles.recentCard, styles.lastCard]}>
        <Card.Content>
          <View style={styles.recentHeader}>
            <Title style={styles.recentTitle}>Your Clients</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Clients' as never)}
              compact
            >
              View All
            </Button>
          </View>
          
          {clients.length > 0 ? (
            clients.slice(0, 5).map((client, index) => (
              <List.Item
                key={client.id}
                title={client.name}
                description={client.email || 'No email'}
                left={(props) => (
                  <Avatar.Image
                    {...props}
                    size={40}
                    source={
                      client.logo_path
                        ? { uri: client.logo_path }
                        : undefined
                    }
                  />
                )}
                right={(props) => (
                  <IconButton
                    {...props}
                    icon="chevron-right"
                    onPress={() =>
                      navigation.navigate('ClientDetail' as never, { clientId: client.id } as never)
                    }
                  />
                )}
                onPress={() =>
                  navigation.navigate('ClientDetail' as never, { clientId: client.id } as never)
                }
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Paragraph style={styles.emptyText}>No clients yet</Paragraph>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Clients' as never)}
                style={styles.createButton}
              >
                Add Your First Client
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  role: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  actionButton: {
    marginTop: 8,
  },
  postItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  postInfo: {
    flex: 1,
    marginRight: 12,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  postContent: {
    fontSize: 12,
    color: '#64748b',
  },
  chipText: {
    fontSize: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
  },
});

export default DashboardScreen; 