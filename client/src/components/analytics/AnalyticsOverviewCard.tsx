import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface OverviewData {
  totalPosts: number;
  totalEngagement: number;
  avgEngagementRate: number;
  totalReach: number;
  totalImpressions: number;
  followerGrowth: number;
}

interface AnalyticsOverviewCardProps {
  data: OverviewData;
  dateRange: string;
}

const AnalyticsOverviewCard: React.FC<AnalyticsOverviewCardProps> = ({
  data,
  dateRange,
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number): string => {
    return growth >= 0 ? '#4CAF50' : '#f44336';
  };

  const getGrowthIcon = (growth: number): string => {
    return growth >= 0 ? 'trending-up' : 'trending-down';
  };

  const renderMetricCard = (
    title: string,
    value: string,
    growth?: number,
    icon?: string,
    color?: string
  ) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        {icon && (
          <View style={[styles.metricIcon, { backgroundColor: color || '#2196F3' }]}>
            <Icon name={icon} size={20} color="#fff" />
          </View>
        )}
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      
      <Text style={styles.metricValue}>{value}</Text>
      
      {growth !== undefined && (
        <View style={styles.growthContainer}>
          <Icon
            name={getGrowthIcon(growth)}
            size={16}
            color={getGrowthColor(growth)}
          />
          <Text style={[styles.growthText, { color: getGrowthColor(growth) }]}>
            {formatPercentage(growth)}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Overview</Text>
        <Text style={styles.dateRange}>{dateRange}</Text>
      </View>

      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Total Posts',
          data.totalPosts.toString(),
          undefined,
          'article',
          '#2196F3'
        )}
        
        {renderMetricCard(
          'Total Engagement',
          formatNumber(data.totalEngagement),
          undefined,
          'favorite',
          '#E91E63'
        )}
        
        {renderMetricCard(
          'Avg. Engagement Rate',
          `${data.avgEngagementRate.toFixed(1)}%`,
          undefined,
          'show-chart',
          '#FF9800'
        )}
        
        {renderMetricCard(
          'Total Reach',
          formatNumber(data.totalReach),
          data.followerGrowth,
          'visibility',
          '#4CAF50'
        )}
        
        {renderMetricCard(
          'Total Impressions',
          formatNumber(data.totalImpressions),
          undefined,
          'remove-red-eye',
          '#9C27B0'
        )}
        
        {renderMetricCard(
          'Follower Growth',
          formatPercentage(data.followerGrowth),
          data.followerGrowth,
          'person-add',
          '#607D8B'
        )}
      </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 14,
    color: '#666',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  metricCard: {
    width: '50%',
    padding: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default AnalyticsOverviewCard; 