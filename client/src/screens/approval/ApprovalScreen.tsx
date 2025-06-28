// Approval Screen Component - Comprehensive Approval Workflow
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Avatar,
  Badge,
  Surface,
  Portal,
  Dialog,
  Paragraph,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';

// Demo data for pending approvals
const DEMO_PENDING_POSTS = [
  {
    id: 1,
    clientName: 'TechStartup Inc',
    clientLogo: null,
    createdBy: 'Sarah Johnson',
    createdByAvatar: null,
    title: 'Product Launch Announcement',
    content: '🚀 Exciting news! Our revolutionary AI-powered productivity tool is finally here! Join thousands of early users who are already boosting their efficiency by 300%. Get started with our free trial today! #ProductLaunch #AI #Productivity #Innovation',
    platforms: ['facebook', 'instagram', 'linkedin'],
    scheduledAt: '2024-01-15T10:00:00Z',
    mediaFiles: ['product-launch-hero.jpg', 'feature-showcase.mp4'],
    submittedAt: '2024-01-14T09:30:00Z',
    priority: 'high',
    contentType: 'promotional',
    estimatedReach: 25000,
    tags: ['product-launch', 'ai', 'productivity'],
  },
  {
    id: 2,
    clientName: 'Local Coffee Shop',
    clientLogo: null,
    createdBy: 'Mike Chen',
    createdByAvatar: null,
    title: 'Weekend Special Offer',
    content: '☕ Weekend vibes call for special treats! This Saturday & Sunday, enjoy 20% off all our artisan coffee blends and freshly baked pastries. Perfect weather for our outdoor seating! See you soon! ☀️ #WeekendSpecial #CoffeeLovers #LocalBusiness',
    platforms: ['facebook', 'instagram'],
    scheduledAt: '2024-01-13T08:00:00Z',
    mediaFiles: ['coffee-special.jpg'],
    submittedAt: '2024-01-12T16:45:00Z',
    priority: 'medium',
    contentType: 'promotional',
    estimatedReach: 5000,
    tags: ['weekend-special', 'coffee', 'local-business'],
  },
  {
    id: 3,
    clientName: 'Fitness Studio',
    clientLogo: null,
    createdBy: 'Emma Davis',
    createdByAvatar: null,
    title: 'New Year Fitness Challenge',
    content: '💪 Ready to crush your 2024 fitness goals? Join our 30-Day New Year Challenge starting Monday! Professional trainers, personalized meal plans, and an amazing community to support you. Limited spots available - sign up now! #NewYearNewYou #FitnessChallenge #HealthyLifestyle',
    platforms: ['instagram', 'facebook', 'threads'],
    scheduledAt: '2024-01-08T07:00:00Z',
    mediaFiles: ['fitness-challenge.jpg', 'trainer-intro.mp4'],
    submittedAt: '2024-01-07T14:20:00Z',
    priority: 'high',
    contentType: 'engagement',
    estimatedReach: 15000,
    tags: ['fitness-challenge', 'new-year', 'health'],
  },
  {
    id: 4,
    clientName: 'Fashion Boutique',
    clientLogo: null,
    createdBy: 'Lisa Park',
    createdByAvatar: null,
    title: 'Spring Collection Preview',
    content: '🌸 Spring is calling and our new collection is answering! Discover flowing fabrics, vibrant colors, and timeless elegance. From casual chic to evening glamour, find your perfect spring look. Pre-order now with 15% early bird discount! #SpringFashion #NewCollection #Style',
    platforms: ['instagram', 'facebook', 'pinterest'],
    scheduledAt: '2024-01-20T11:00:00Z',
    mediaFiles: ['spring-collection-1.jpg', 'spring-collection-2.jpg', 'lookbook.pdf'],
    submittedAt: '2024-01-14T11:15:00Z',
    priority: 'medium',
    contentType: 'promotional',
    estimatedReach: 12000,
    tags: ['spring-collection', 'fashion', 'style'],
  },
];

const DEMO_RECENT_APPROVALS = [
  {
    id: 5,
    clientName: 'Tech Startup Inc',
    title: 'Team Hiring Post',
    status: 'approved',
    approvedAt: '2024-01-12T10:30:00Z',
    approvedBy: 'You',
    publishedAt: '2024-01-12T15:00:00Z',
    platforms: ['linkedin'],
  },
  {
    id: 6,
    clientName: 'Local Coffee Shop',
    title: 'Monday Motivation Quote',
    status: 'rejected',
    rejectedAt: '2024-01-11T09:15:00Z',
    rejectedBy: 'You',
    reason: 'Quote needs to be more brand-aligned and include coffee reference',
    platforms: ['instagram', 'facebook'],
  },
  {
    id: 7,
    clientName: 'Fitness Studio',
    title: 'Member Success Story',
    status: 'changes_requested',
    requestedAt: '2024-01-10T14:20:00Z',
    requestedBy: 'You',
    feedback: 'Great content! Please add before/after photos and get member consent form signed.',
    platforms: ['instagram', 'facebook'],
  },
];

interface ApprovalScreenProps {}

const ApprovalScreen: React.FC<ApprovalScreenProps> = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'recent'>('pending');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);
  
  // Mock API calls
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleApprovePost = (postId: number) => {
    Alert.alert(
      'Approve Post',
      'Are you sure you want to approve this post for publishing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => {
            // Mock approval API call
            Alert.alert('Success', 'Post approved successfully!');
          },
        },
      ]
    );
  };

  const handleRejectPost = (postId: number) => {
    setSelectedPost(DEMO_PENDING_POSTS.find(p => p.id === postId));
    setIsReviewModalVisible(true);
  };

  const handleRequestChanges = (postId: number) => {
    setSelectedPost(DEMO_PENDING_POSTS.find(p => p.id === postId));
    setIsReviewModalVisible(true);
  };

  const submitReview = (action: 'reject' | 'changes') => {
    if (!feedback.trim()) {
      Alert.alert('Error', 'Please provide feedback for your decision.');
      return;
    }

    setIsLoading(true);
    
    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      setIsReviewModalVisible(false);
      setFeedback('');
      setSelectedPost(null);
      
      const actionText = action === 'reject' ? 'rejected' : 'changes requested for';
      Alert.alert('Success', `Post ${actionText} successfully!`);
    }, 1000);
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      facebook: 'logo-facebook',
      instagram: 'logo-instagram',
      twitter: 'logo-twitter',
      linkedin: 'logo-linkedin',
      youtube: 'logo-youtube',
      threads: 'chatbox-ellipses',
    };
    return icons[platform as keyof typeof icons] || 'globe';
  };

  const getPlatformColor = (platform: string) => {
    const colors = {
      facebook: '#1877f2',
      instagram: '#E4405F',
      twitter: '#1da1f2',
      linkedin: '#0077b5',
      youtube: '#ff0000',
      threads: '#000000',
    };
    return colors[platform as keyof typeof colors] || '#666';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981',
    };
    return colors[priority as keyof typeof colors] || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const renderPendingPost = (post: any) => (
    <Card key={post.id} style={styles.postCard}>
      <Card.Content>
        {/* Header */}
        <View style={styles.postHeader}>
          <View style={styles.clientInfo}>
            <Avatar.Icon size={40} icon="domain" style={styles.clientAvatar} />
            <View style={styles.clientDetails}>
              <Text style={styles.clientName}>{post.clientName}</Text>
              <Text style={styles.createdBy}>by {post.createdBy}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Chip 
              mode="outlined" 
              style={[styles.priorityChip, { borderColor: getPriorityColor(post.priority) }]}
              textStyle={{ color: getPriorityColor(post.priority), fontSize: 12 }}
            >
              {post.priority.toUpperCase()}
            </Chip>
            <Text style={styles.submittedTime}>{formatDate(post.submittedAt)}</Text>
          </View>
        </View>

        {/* Content Preview */}
        <View style={styles.contentSection}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postContent} numberOfLines={3}>
            {post.content}
          </Text>
          
          {/* Platforms */}
          <View style={styles.platformsRow}>
            {post.platforms.map((platform: string) => (
              <View key={platform} style={styles.platformChip}>
                <Ionicons 
                  name={getPlatformIcon(platform) as any} 
                  size={16} 
                  color={getPlatformColor(platform)} 
                />
                <Text style={[styles.platformText, { color: getPlatformColor(platform) }]}>
                  {platform}
                </Text>
              </View>
            ))}
          </View>

          {/* Media Files */}
          {post.mediaFiles.length > 0 && (
            <View style={styles.mediaSection}>
              <Text style={styles.mediaLabel}>Media: </Text>
              <Text style={styles.mediaCount}>{post.mediaFiles.length} files</Text>
            </View>
          )}

          {/* Scheduling Info */}
          <View style={styles.scheduleSection}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.scheduleText}>
              Scheduled: {new Date(post.scheduledAt).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprovePost(post.id)}
            icon="check"
          >
            Approve
          </Button>
          <Button
            mode="outlined"
            style={[styles.actionButton, styles.changesButton]}
            onPress={() => handleRequestChanges(post.id)}
            icon="pencil"
          >
            Changes
          </Button>
          <Button
            mode="outlined"
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectPost(post.id)}
            icon="close"
          >
            Reject
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderRecentApproval = (approval: any) => (
    <Card key={approval.id} style={styles.recentCard}>
      <Card.Content>
        <View style={styles.recentHeader}>
          <View style={styles.recentInfo}>
            <Text style={styles.recentClient}>{approval.clientName}</Text>
            <Text style={styles.recentTitle}>{approval.title}</Text>
          </View>
          <Chip 
            mode="flat"
            style={[
              styles.statusChip,
              approval.status === 'approved' && styles.approvedChip,
              approval.status === 'rejected' && styles.rejectedChip,
              approval.status === 'changes_requested' && styles.changesChip,
            ]}
            textStyle={[
              styles.statusText,
              approval.status === 'approved' && styles.approvedText,
              approval.status === 'rejected' && styles.rejectedText,
              approval.status === 'changes_requested' && styles.changesText,
            ]}
          >
            {approval.status.replace('_', ' ').toUpperCase()}
          </Chip>
        </View>
        
        {approval.reason && (
          <Text style={styles.reasonText}>Reason: {approval.reason}</Text>
        )}
        {approval.feedback && (
          <Text style={styles.feedbackText}>Feedback: {approval.feedback}</Text>
        )}
        
        <Text style={styles.recentTime}>
          {formatDate(approval.approvedAt || approval.rejectedAt || approval.requestedAt)}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <Surface style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{DEMO_PENDING_POSTS.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>95%</Text>
          <Text style={styles.statLabel}>Approval Rate</Text>
        </View>
      </Surface>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending Approval
          </Text>
          <Badge style={styles.badge}>{DEMO_PENDING_POSTS.length}</Badge>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
            Recent Activity
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'pending' ? (
          DEMO_PENDING_POSTS.length > 0 ? (
            DEMO_PENDING_POSTS.map(renderPendingPost)
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#10b981" />
                <Text style={styles.emptyTitle}>All Caught Up!</Text>
                <Text style={styles.emptySubtitle}>
                  No posts pending approval at the moment.
                </Text>
              </Card.Content>
            </Card>
          )
        ) : (
          DEMO_RECENT_APPROVALS.map(renderRecentApproval)
        )}
      </ScrollView>

      {/* Review Modal */}
      <Portal>
        <Dialog visible={isReviewModalVisible} onDismiss={() => setIsReviewModalVisible(false)}>
          <Dialog.Title>Review Post</Dialog.Title>
          <Dialog.Content>
            {selectedPost && (
              <>
                <Paragraph style={styles.reviewPostTitle}>{selectedPost.title}</Paragraph>
                <Paragraph style={styles.reviewPostClient}>by {selectedPost.createdBy} for {selectedPost.clientName}</Paragraph>
                
                <Divider style={styles.reviewDivider} />
                
                <Text style={styles.feedbackLabel}>Feedback/Reason:</Text>
                <TextInput
                  style={styles.feedbackInput}
                  multiline
                  numberOfLines={4}
                  value={feedback}
                  onChangeText={setFeedback}
                  placeholder="Provide feedback or reason for your decision..."
                  textAlignVertical="top"
                />
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsReviewModalVisible(false)}>Cancel</Button>
            <Button 
              onPress={() => submitReview('changes')}
              loading={isLoading}
              disabled={isLoading}
            >
              Request Changes
            </Button>
            <Button 
              onPress={() => submitReview('reject')}
              loading={isLoading}
              disabled={isLoading}
              textColor="#ef4444"
            >
              Reject
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  badge: {
    marginLeft: 8,
    backgroundColor: '#ef4444',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  postCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    backgroundColor: '#e0e7ff',
  },
  clientDetails: {
    marginLeft: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  createdBy: {
    fontSize: 12,
    color: '#6b7280',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  priorityChip: {
    marginBottom: 4,
  },
  submittedTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  contentSection: {
    marginBottom: 16,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  platformsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  platformText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  mediaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  mediaCount: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  scheduleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  changesButton: {
    borderColor: '#f59e0b',
  },
  rejectButton: {
    borderColor: '#ef4444',
  },
  recentCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recentInfo: {
    flex: 1,
  },
  recentClient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  recentTitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusChip: {
    paddingHorizontal: 8,
  },
  approvedChip: {
    backgroundColor: '#d1fae5',
  },
  rejectedChip: {
    backgroundColor: '#fee2e2',
  },
  changesChip: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  approvedText: {
    color: '#10b981',
  },
  rejectedText: {
    color: '#ef4444',
  },
  changesText: {
    color: '#f59e0b',
  },
  reasonText: {
    fontSize: 12,
    color: '#ef4444',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 12,
    color: '#f59e0b',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  recentTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyCard: {
    marginTop: 40,
    borderRadius: 12,
    elevation: 1,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  reviewPostTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  reviewPostClient: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  reviewDivider: {
    marginVertical: 16,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
});

export default ApprovalScreen; 