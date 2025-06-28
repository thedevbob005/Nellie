import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState } from '../../store';
import { Client } from '../../types';
import AnalyticsOverviewCard from '../../components/analytics/AnalyticsOverviewCard';
import PlatformMetricsCard from '../../components/analytics/PlatformMetricsCard';
import EngagementChart from '../../components/analytics/EngagementChart';
import TopPostsCard from '../../components/analytics/TopPostsCard';
import RealtimeMetrics from '../../components/analytics/RealtimeMetrics';
import DateRangePicker from '../../components/analytics/DateRangePicker';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ErrorBoundary from '../../components/common/ErrorBoundary';

interface AnalyticsDashboardScreenProps {
  navigation: any;
  route?: {
    params?: {
      clientId?: number;
    };
  };
}

interface AnalyticsData {
  overview: {
    totalPosts: number;
    totalEngagement: number;
    avgEngagementRate: number;
    totalReach: number;
    totalImpressions: number;
    followerGrowth: number;
  };
  platformMetrics: {
    platform: string;
    posts: number;
    engagement: number;
    reach: number;
    engagementRate: number;
    growth: number;
  }[];
  engagementTrend: {
    date: string;
    likes: number;
    comments: number;
    shares: number;
    total: number;
  }[];
  topPosts: {
    id: number;
    content: string;
    platform: string;
    engagement: number;
    reach: number;
    posted_at: string;
  }[];
  realtimeMetrics: {
    activeUsers: number;
    postsToday: number;
    engagementToday: number;
    trending: string[];
  };
}

const DEMO_ANALYTICS: AnalyticsData = {
  overview: {
    totalPosts: 156,
    totalEngagement: 12580,
    avgEngagementRate: 4.2,
    totalReach: 89540,
    totalImpressions: 234560,
    followerGrowth: 8.7,
  },
  platformMetrics: [
    {
      platform: 'facebook',
      posts: 45,
      engagement: 4250,
      reach: 28500,
      engagementRate: 3.8,
      growth: 5.2,
    },
    {
      platform: 'instagram',
      posts: 62,
      engagement: 6890,
      reach: 35200,
      engagementRate: 5.1,
      growth: 12.3,
    },
    {
      platform: 'twitter',
      posts: 28,
      engagement: 980,
      reach: 15600,
      engagementRate: 2.1,
      growth: -2.1,
    },
    {
      platform: 'linkedin',
      posts: 21,
      engagement: 440,
      reach: 10240,
      engagementRate: 6.8,
      growth: 15.4,
    },
  ],
  engagementTrend: [
    { date: '2024-01-15', likes: 450, comments: 89, shares: 23, total: 562 },
    { date: '2024-01-16', likes: 520, comments: 95, shares: 31, total: 646 },
    { date: '2024-01-17', likes: 380, comments: 67, shares: 18, total: 465 },
    { date: '2024-01-18', likes: 690, comments: 124, shares: 45, total: 859 },
    { date: '2024-01-19', likes: 590, comments: 108, shares: 38, total: 736 },
    { date: '2024-01-20', likes: 720, comments: 145, shares: 52, total: 917 },
    { date: '2024-01-21', likes: 650, comments: 132, shares: 41, total: 823 },
  ],
  topPosts: [
    {
      id: 1,
      content: 'Exciting news! Our new product launch is here...',
      platform: 'instagram',
      engagement: 1250,
      reach: 8900,
      posted_at: '2024-01-20T14:30:00Z',
    },
    {
      id: 2,
      content: 'Behind the scenes: How we built our amazing team...',
      platform: 'linkedin',
      engagement: 890,
      reach: 5600,
      posted_at: '2024-01-19T10:15:00Z',
    },
    {
      id: 3,
      content: 'Customer success story: Amazing results with...',
      platform: 'facebook',
      engagement: 720,
      reach: 4200,
      posted_at: '2024-01-18T16:45:00Z',
    },
  ],
  realtimeMetrics: {
    activeUsers: 1247,
    postsToday: 8,
    engagementToday: 432,
    trending: ['#ProductLaunch', '#TeamWork', '#Innovation', '#Growth'],
  },
};

const AnalyticsDashboardScreen: React.FC<AnalyticsDashboardScreenProps> = ({
  navigation,
  route,
}) => {
  const dispatch = useDispatch();
  const { clients } = useSelector((state: RootState) => state.clients);

  const [selectedClient, setSelectedClient] = useState<number | null>(
    route?.params?.clientId || null
  );
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(DEMO_ANALYTICS);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  useFocusEffect(
    useCallback(() => {
      loadAnalyticsData();
    }, [selectedClient, dateRange])
  );

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would call the analytics API
      // await dispatch(fetchAnalyticsDashboard({ 
      //   client_id: selectedClient,
      //   start_date: dateRange.startDate.toISOString(),
      //   end_date: dateRange.endDate.toISOString()
      // }));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalyticsData(DEMO_ANALYTICS);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const handleExportReport = () => {
    Alert.alert(
      'Export Report',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PDF', onPress: () => exportReport('pdf') },
        { text: 'CSV', onPress: () => exportReport('csv') },
        { text: 'Excel', onPress: () => exportReport('excel') },
      ]
    );
  };

  const exportReport = (format: string) => {
    Alert.alert(
      'Export Started',
      `Generating ${format.toUpperCase()} report. You'll receive a notification when it's ready.`,
      [{ text: 'OK' }]
    );
  };

  const getClientName = (clientId: number): string => {
    const client = clients.find((c: Client) => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const formatDateRange = (): string => {
    const start = dateRange.startDate.toLocaleDateString();
    const end = dateRange.endDate.toLocaleDateString();
    return `${start} - ${end}`;
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
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        {selectedClient && (
          <Text style={styles.headerSubtitle}>
            {getClientName(selectedClient)}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.exportButton}
        onPress={handleExportReport}
      >
        <Icon name="file-download" size={24} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );

  const renderControls = () => (
    <View style={styles.controls}>
      <DateRangePicker
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onDateRangeChange={setDateRange}
      />
      
      <View style={styles.viewModeToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'overview' && styles.toggleButtonActive
          ]}
          onPress={() => setViewMode('overview')}
        >
          <Text style={[
            styles.toggleButtonText,
            viewMode === 'overview' && styles.toggleButtonTextActive
          ]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'detailed' && styles.toggleButtonActive
          ]}
          onPress={() => setViewMode('detailed')}
        >
          <Text style={[
            styles.toggleButtonText,
            viewMode === 'detailed' && styles.toggleButtonTextActive
          ]}>
            Detailed
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOverviewMode = () => (
    <>
      <AnalyticsOverviewCard
        data={analyticsData.overview}
        dateRange={formatDateRange()}
      />
      
      <RealtimeMetrics
        data={analyticsData.realtimeMetrics}
        onRefresh={handleRefresh}
      />
      
      <View style={styles.platformMetricsGrid}>
        {analyticsData.platformMetrics.map((platform) => (
          <PlatformMetricsCard
            key={platform.platform}
            data={platform}
            compact={true}
          />
        ))}
      </View>
      
      <EngagementChart
        data={analyticsData.engagementTrend}
        title="Engagement Trend"
        height={200}
      />
    </>
  );

  const renderDetailedMode = () => (
    <>
      <View style={styles.detailedMetrics}>
        {analyticsData.platformMetrics.map((platform) => (
          <PlatformMetricsCard
            key={platform.platform}
            data={platform}
            compact={false}
          />
        ))}
      </View>
      
      <EngagementChart
        data={analyticsData.engagementTrend}
        title="Detailed Engagement Analysis"
        height={300}
        showDetails={true}
      />
      
      <TopPostsCard
        posts={analyticsData.topPosts}
        onViewPost={(postId) => {
          navigation.navigate('PostDetail', { postId });
        }}
      />
    </>
  );

  if (isLoading && !analyticsData.overview.totalPosts) {
    return <LoadingOverlay message="Loading analytics..." />;
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
          {viewMode === 'overview' ? renderOverviewMode() : renderDetailedMode()}
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Data updated {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </ScrollView>
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
  exportButton: {
    padding: 8,
  },
  controls: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    marginTop: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#2196F3',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  platformMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 16,
    gap: 12,
  },
  detailedMetrics: {
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default AnalyticsDashboardScreen; 