import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Searchbar,
  Chip,
  Avatar,
  Menu,
  Divider,
  Portal,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { AppDispatch, RootState } from '../../store';
import {
  fetchPosts,
  deletePost,
  approvePost,
  rejectPost,
  setFilters,
  clearFilters,
  selectPosts,
  selectPostsLoading,
  selectPostsError,
  selectPostsPagination,
  selectPostsFilters,
  Post,
  PostFilters,
} from '../../store/slices/postsSlice';
import { selectClients } from '../../store/slices/clientsSlice';
import { selectUser } from '../../store/slices/authSlice';

const PostsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  // Redux state
  const posts = useSelector(selectPosts);
  const loading = useSelector(selectPostsLoading);
  const error = useSelector(selectPostsError);
  const pagination = useSelector(selectPostsPagination);
  const filters = useSelector(selectPostsFilters);
  const clients = useSelector(selectClients);
  const user = useSelector(selectUser);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Load posts on mount and when filters change
  useEffect(() => {
    loadPosts();
  }, [filters]);

  const loadPosts = useCallback(async () => {
    try {
      await dispatch(fetchPosts(filters)).unwrap();
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }, [dispatch, filters]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, [loadPosts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search logic if needed
  };

  const handleFilterStatus = (status: string) => {
    dispatch(setFilters({ 
      ...filters, 
      status: filters.status === status ? undefined : status,
      page: 1 
    }));
    setFilterMenuVisible(false);
  };

  const handleFilterClient = (clientId: number) => {
    dispatch(setFilters({ 
      ...filters, 
      client_id: filters.client_id === clientId ? undefined : clientId,
      page: 1 
    }));
  };

  const clearAllFilters = () => {
    dispatch(clearFilters());
    setSearchQuery('');
  };

  const handleCreatePost = () => {
    navigation.navigate('CreatePost' as never);
  };

  const handlePostPress = (post: Post) => {
    navigation.navigate('PostDetail' as never, { postId: post.id } as never);
  };

  const handlePostAction = (post: Post, action: string) => {
    setSelectedPost(post);
    setActionMenuVisible(false);

    switch (action) {
      case 'edit':
        navigation.navigate('EditPost' as never, { postId: post.id } as never);
        break;
      case 'approve':
        setApprovalModalVisible(true);
        break;
      case 'reject':
        setRejectionModalVisible(true);
        break;
      case 'delete':
        handleDeletePost(post);
        break;
    }
  };

  const handleDeletePost = (post: Post) => {
    Alert.alert(
      'Delete Post',
      `Are you sure you want to delete "${post.title || 'this post'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deletePost(post.id)).unwrap();
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleApprovePost = async () => {
    if (!selectedPost) return;

    try {
      await dispatch(approvePost({ postId: selectedPost.id, feedback })).unwrap();
      setApprovalModalVisible(false);
      setFeedback('');
      setSelectedPost(null);
      Alert.alert('Success', 'Post approved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve post');
    }
  };

  const handleRejectPost = async () => {
    if (!selectedPost || !feedback.trim()) {
      Alert.alert('Error', 'Feedback is required when rejecting a post');
      return;
    }

    try {
      await dispatch(rejectPost({ postId: selectedPost.id, feedback })).unwrap();
      setRejectionModalVisible(false);
      setFeedback('');
      setSelectedPost(null);
      Alert.alert('Success', 'Post rejected with feedback');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject post');
    }
  };

  const getStatusColor = (status: Post['status']) => {
    const colors = {
      draft: '#6c757d',
      pending_approval: '#ffc107',
      approved: '#28a745',
      scheduled: '#17a2b8',
      published: '#007bff',
      failed: '#dc3545',
      cancelled: '#6c757d',
    };
    return colors[status] || '#6c757d';
  };

  const getStatusLabel = (status: Post['status']) => {
    const labels = {
      draft: 'Draft',
      pending_approval: 'Pending',
      approved: 'Approved',
      scheduled: 'Scheduled',
      published: 'Published',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const canEditPost = (post: Post) => {
    return post.created_by.id === user?.id || user?.role === 'manager';
  };

  const canApprovePost = (post: Post) => {
    return user?.role === 'manager' && post.status === 'pending_approval';
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <Card style={styles.postCard} onPress={() => handlePostPress(item)}>
      <Card.Content>
        <View style={styles.postHeader}>
          <View style={styles.clientInfo}>
            <Avatar.Image 
              size={32} 
              source={
                item.client.logo_path 
                  ? { uri: item.client.logo_path }
                  : undefined
              }
              style={styles.clientAvatar}
            />
            <View>
              <Title style={styles.clientName}>{item.client.name}</Title>
              <Paragraph style={styles.authorName}>
                by {item.created_by.name}
              </Paragraph>
            </View>
          </View>
          
          <View style={styles.postActions}>
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
              textStyle={styles.statusText}
            >
              {getStatusLabel(item.status)}
            </Chip>
            
            <Menu
              visible={actionMenuVisible && selectedPost?.id === item.id}
              onDismiss={() => setActionMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  onPress={() => {
                    setSelectedPost(item);
                    setActionMenuVisible(true);
                  }}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                </TouchableOpacity>
              }
            >
              {canEditPost(item) && item.status === 'draft' && (
                <Menu.Item 
                  title="Edit" 
                  onPress={() => handlePostAction(item, 'edit')}
                  leadingIcon="pencil"
                />
              )}
              {canApprovePost(item) && (
                <>
                  <Menu.Item 
                    title="Approve" 
                    onPress={() => handlePostAction(item, 'approve')}
                    leadingIcon="check"
                  />
                  <Menu.Item 
                    title="Reject" 
                    onPress={() => handlePostAction(item, 'reject')}
                    leadingIcon="close"
                  />
                </>
              )}
              {canEditPost(item) && item.status !== 'published' && (
                <>
                  <Divider />
                  <Menu.Item 
                    title="Delete" 
                    onPress={() => handlePostAction(item, 'delete')}
                    leadingIcon="delete"
                  />
                </>
              )}
            </Menu>
          </View>
        </View>

        <Paragraph style={styles.postContent} numberOfLines={3}>
          {item.content}
        </Paragraph>

        <View style={styles.postMeta}>
          <View style={styles.platforms}>
            {item.platforms.map((platform, index) => (
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
          
          <View style={styles.postInfo}>
            {item.media_files.length > 0 && (
              <View style={styles.mediaInfo}>
                <Ionicons name="image" size={16} color="#666" />
                <Text style={styles.mediaCount}>{item.media_files.length}</Text>
              </View>
            )}
            
            <Text style={styles.dateText}>
              {item.scheduled_at 
                ? `Scheduled: ${format(new Date(item.scheduled_at), 'MMM dd, HH:mm')}`
                : format(new Date(item.created), 'MMM dd, yyyy')
              }
            </Text>
          </View>
        </View>

        {item.approval?.feedback && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>Feedback:</Text>
            <Text style={styles.feedbackText}>{item.approval.feedback}</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#ccc" />
      <Title style={styles.emptyTitle}>No posts found</Title>
      <Paragraph style={styles.emptyText}>
        {Object.keys(filters).length > 0
          ? 'Try adjusting your filters or create a new post.'
          : 'Start by creating your first post.'}
      </Paragraph>
      {Object.keys(filters).length > 0 && (
        <Button mode="outlined" onPress={clearAllFilters} style={styles.clearFiltersButton}>
          Clear Filters
        </Button>
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.activeFilters}>
        {filters.status && (
          <Chip 
            style={styles.activeFilter}
            onClose={() => handleFilterStatus(filters.status!)}
            closeIcon="close"
          >
            Status: {getStatusLabel(filters.status as Post['status'])}
          </Chip>
        )}
        {filters.client_id && (
          <Chip 
            style={styles.activeFilter}
            onClose={() => handleFilterClient(filters.client_id!)}
            closeIcon="close"
          >
            Client: {clients.find(c => c.id === filters.client_id)?.name}
          </Chip>
        )}
      </View>
      
      <Menu
        visible={filterMenuVisible}
        onDismiss={() => setFilterMenuVisible(false)}
        anchor={
          <Button 
            mode="outlined" 
            onPress={() => setFilterMenuVisible(true)}
            icon="filter"
            compact
          >
            Filter
          </Button>
        }
      >
        <Menu.Item title="All Posts" onPress={() => handleFilterStatus('')} />
        <Divider />
        <Menu.Item title="Draft" onPress={() => handleFilterStatus('draft')} />
        <Menu.Item title="Pending" onPress={() => handleFilterStatus('pending_approval')} />
        <Menu.Item title="Approved" onPress={() => handleFilterStatus('approved')} />
        <Menu.Item title="Scheduled" onPress={() => handleFilterStatus('scheduled')} />
        <Menu.Item title="Published" onPress={() => handleFilterStatus('published')} />
      </Menu>
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadPosts}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search posts..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      {renderFilters()}

      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleCreatePost}
        label="New Post"
      />

      {/* Approval Modal */}
      <Portal>
        <Modal 
          visible={approvalModalVisible} 
          onDismiss={() => setApprovalModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title>Approve Post</Title>
          <Paragraph>
            Are you sure you want to approve "{selectedPost?.title || selectedPost?.content.substring(0, 50) + '...'}"?
          </Paragraph>
          
          <TextInput
            label="Feedback (Optional)"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={3}
            style={styles.feedbackInput}
          />
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setApprovalModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleApprovePost}
              style={styles.modalButton}
            >
              Approve
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Rejection Modal */}
      <Portal>
        <Modal 
          visible={rejectionModalVisible} 
          onDismiss={() => setRejectionModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title>Reject Post</Title>
          <Paragraph>
            Please provide feedback for why this post is being rejected:
          </Paragraph>
          
          <TextInput
            label="Feedback (Required)"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={4}
            style={styles.feedbackInput}
            error={!feedback.trim()}
          />
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setRejectionModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleRejectPost}
              style={styles.modalButton}
              disabled={!feedback.trim()}
            >
              Reject
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  activeFilters: {
    flexDirection: 'row',
    flex: 1,
  },
  activeFilter: {
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  postCard: {
    marginBottom: 12,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    marginRight: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  authorName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 0,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postContent: {
    marginBottom: 12,
    lineHeight: 20,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  platforms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  platformChip: {
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: '#e3f2fd',
  },
  platformText: {
    fontSize: 10,
    color: '#1976d2',
  },
  postInfo: {
    alignItems: 'flex-end',
  },
  mediaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mediaCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  feedbackContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 12,
    color: '#856404',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 16,
  },
  clearFiltersButton: {
    marginTop: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 8,
  },
  feedbackInput: {
    marginVertical: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    marginLeft: 8,
  },
});

export default PostsScreen; 