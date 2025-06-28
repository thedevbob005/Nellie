// Calendar Screen Component
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState } from '../../store';
import { Client } from '../../types';
import CalendarGrid from '../../components/calendar/CalendarGrid';
import PostCard from '../../components/calendar/PostCard';
import SchedulePostModal from '../../components/calendar/SchedulePostModal';
import PublishingQueueCard from '../../components/calendar/PublishingQueueCard';
import BestTimesCard from '../../components/calendar/BestTimesCard';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ErrorBoundary from '../../components/common/ErrorBoundary';

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

interface CalendarScreenProps {
  navigation: any;
  route?: {
    params?: {
      clientId?: number;
      selectedDate?: string;
    };
  };
}

const DEMO_SCHEDULED_POSTS: ScheduledPost[] = [
  {
    id: 1,
    title: 'Morning motivation post',
    content: 'Start your day with positivity! ✨ Remember that every small step counts towards your goals.',
    client_id: 1,
    platforms: ['facebook', 'instagram'],
    scheduled_at: '2024-01-22T09:00:00Z',
    status: 'scheduled',
    is_recurring: true,
    recurring_pattern: 'daily',
    created_by: 1,
    created_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 2,
    title: 'Product showcase',
    content: 'Check out our latest product features! 🚀 Available now in our store.',
    client_id: 1,
    platforms: ['instagram', 'twitter'],
    scheduled_at: '2024-01-22T14:30:00Z',
    status: 'scheduled',
    media_files: ['product_image.jpg'],
    created_by: 1,
    created_at: '2024-01-20T11:00:00Z',
  },
  {
    id: 3,
    title: 'Weekend tips',
    content: 'Make the most of your weekend with these productivity tips! 💪',
    client_id: 2,
    platforms: ['linkedin', 'facebook'],
    scheduled_at: '2024-01-23T10:00:00Z',
    status: 'scheduled',
    created_by: 1,
    created_at: '2024-01-20T12:00:00Z',
  },
];

const CalendarScreen: React.FC<CalendarScreenProps> = ({
  navigation,
  route,
}) => {
  const dispatch = useDispatch();
  const { clients } = useSelector((state: RootState) => state.clients);

  const [selectedClient, setSelectedClient] = useState<number | null>(
    route?.params?.clientId || null
  );
  const [selectedDate, setSelectedDate] = useState<Date>(
    route?.params?.selectedDate ? new Date(route?.params?.selectedDate) : new Date()
  );
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(DEMO_SCHEDULED_POSTS);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useFocusEffect(
    useCallback(() => {
      loadScheduledPosts();
    }, [selectedClient, selectedDate, filterStatus])
  );

  const loadScheduledPosts = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would call the API
      // await dispatch(fetchScheduledPosts({
      //   client_id: selectedClient,
      //   start_date: getMonthStart(selectedDate).toISOString(),
      //   end_date: getMonthEnd(selectedDate).toISOString(),
      //   status: filterStatus
      // }));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter demo data based on selected client
      let filteredPosts = DEMO_SCHEDULED_POSTS;
      if (selectedClient) {
        filteredPosts = DEMO_SCHEDULED_POSTS.filter(post => post.client_id === selectedClient);
      }
      
      setScheduledPosts(filteredPosts);
    } catch (error) {
      console.error('Failed to load scheduled posts:', error);
      Alert.alert('Error', 'Failed to load scheduled posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadScheduledPosts();
    setRefreshing(false);
  };

  const getClientName = (clientId: number): string => {
    const client = clients.find((c: Client) => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getPostsForDate = (date: Date): ScheduledPost[] => {
    const dateString = date.toDateString();
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduled_at);
      return postDate.toDateString() === dateString;
    });
  };

  const getUpcomingPosts = (): ScheduledPost[] => {
    const now = new Date();
    return scheduledPosts
      .filter(post => new Date(post.scheduled_at) > now && post.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, 5);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePostEdit = (postId: number) => {
    navigation.navigate('EditPost', { postId });
  };

  const handlePostDelete = (postId: number) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this scheduled post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setScheduledPosts(prev => prev.filter(post => post.id !== postId));
          },
        },
      ]
    );
  };

  const handlePublishNow = (postId: number) => {
    Alert.alert(
      'Publish Now',
      'Are you sure you want to publish this post immediately?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: () => {
            setScheduledPosts(prev =>
              prev.map(post =>
                post.id === postId
                  ? { ...post, status: 'published' as const }
                  : post
              )
            );
            Alert.alert('Success', 'Post published successfully!');
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Content Calendar</Text>
        {selectedClient && (
          <Text style={styles.headerSubtitle}>
            {getClientName(selectedClient)}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowScheduleModal(true)}
      >
        <Icon name="add" size={24} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );

  const renderControls = () => (
    <View style={styles.controls}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterButtons}
      >
        {['all', 'scheduled', 'published', 'failed'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === status && styles.filterButtonTextActive
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.viewModeToggle}>
        {['month', 'week', 'day'].map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.viewModeButton,
              viewMode === mode && styles.viewModeButtonActive
            ]}
            onPress={() => setViewMode(mode as any)}
          >
            <Text style={[
              styles.viewModeButtonText,
              viewMode === mode && styles.viewModeButtonTextActive
            ]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCalendarView = () => (
    <CalendarGrid
      selectedDate={selectedDate}
      onDateSelect={handleDateSelect}
      scheduledPosts={scheduledPosts}
      viewMode={viewMode}
    />
  );

  const renderSelectedDatePosts = () => {
    const postsForDate = getPostsForDate(selectedDate);
    
    if (postsForDate.length === 0) {
      return (
        <View style={styles.emptyDateState}>
          <Icon name="event-note" size={48} color="#ccc" />
          <Text style={styles.emptyDateText}>No posts scheduled for this date</Text>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => setShowScheduleModal(true)}
          >
            <Icon name="add-circle" size={20} color="#2196F3" />
            <Text style={styles.scheduleButtonText}>Schedule a Post</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.postsSection}>
        <Text style={styles.sectionTitle}>
          Posts for {selectedDate.toLocaleDateString()}
        </Text>
        {postsForDate.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            clientName={getClientName(post.client_id)}
            onEdit={() => handlePostEdit(post.id)}
            onDelete={() => handlePostDelete(post.id)}
            onPublishNow={() => handlePublishNow(post.id)}
          />
        ))}
      </View>
    );
  };

  const renderUpcomingQueue = () => {
    const upcomingPosts = getUpcomingPosts();
    
    if (upcomingPosts.length === 0) {
      return null;
    }

    return (
      <PublishingQueueCard
        posts={upcomingPosts}
        onViewQueue={() => navigation.navigate('PublishingQueue')}
        onEditPost={handlePostEdit}
      />
    );
  };

  const renderBestTimes = () => (
    <BestTimesCard
      clientId={selectedClient}
      onScheduleAtBestTime={(time) => {
        const bestTimeDate = new Date(selectedDate);
        bestTimeDate.setHours(time.hour, time.minute, 0, 0);
        setSelectedDate(bestTimeDate);
        setShowScheduleModal(true);
      }}
    />
  );

  if (isLoading && scheduledPosts.length === 0) {
    return <LoadingOverlay message="Loading calendar..." />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderControls()}
        
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderCalendarView()}
          {renderSelectedDatePosts()}
          {renderUpcomingQueue()}
          {renderBestTimes()}
        </ScrollView>

        <SchedulePostModal
          visible={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          initialDate={selectedDate}
          clientId={selectedClient}
          onPostScheduled={(post) => {
            setScheduledPosts(prev => [...prev, post]);
            setShowScheduleModal(false);
          }}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
  controls: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButtons: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 16,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: '#2196F3',
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  viewModeButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  postsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyDateState: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyDateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 16,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2196F3',
    marginLeft: 6,
  },
});

export default CalendarScreen; 