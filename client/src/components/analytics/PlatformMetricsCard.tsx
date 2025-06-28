import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface PlatformData {
  platform: string;
  posts: number;
  engagement: number;
  reach: number;
  engagementRate: number;
  growth: number;
}

interface PlatformMetricsCardProps {
  data: PlatformData;
  compact?: boolean;
  onPress?: () => void;
}

const PlatformMetricsCard: React.FC<PlatformMetricsCardProps> = ({
  data,
  compact = false,
  onPress,
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
        name: 'X (Twitter)',
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

  const formatPercentage = (num: number): string => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number): string => {
    return growth >= 0 ? '#4CAF50' : '#f44336';
  };

  const config = getPlatformConfig(data.platform);

  const renderCompactView = () => (
    <TouchableOpacity
      style={[styles.compactCard, { borderLeftColor: config.color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.compactHeader}>
        <View style={[styles.platformIcon, { backgroundColor: config.color }]}>
          <Icon name={config.icon} size={16} color="#fff" />
        </View>
        <Text style={styles.platformName}>{config.name}</Text>
        <View style={styles.growthBadge}>
          <Text style={[styles.growthText, { color: getGrowthColor(data.growth) }]}>
            {formatPercentage(data.growth)}
          </Text>
        </View>
      </View>
      
      <View style={styles.compactMetrics}>
        <View style={styles.compactMetric}>
          <Text style={styles.compactMetricValue}>{data.posts}</Text>
          <Text style={styles.compactMetricLabel}>Posts</Text>
        </View>
        <View style={styles.compactMetric}>
          <Text style={styles.compactMetricValue}>{formatNumber(data.engagement)}</Text>
          <Text style={styles.compactMetricLabel}>Engagement</Text>
        </View>
        <View style={styles.compactMetric}>
          <Text style={styles.compactMetricValue}>{data.engagementRate.toFixed(1)}%</Text>
          <Text style={styles.compactMetricLabel}>Rate</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDetailedView = () => (
    <TouchableOpacity
      style={styles.detailedCard}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.detailedHeader}>
        <View style={[styles.platformIconLarge, { backgroundColor: config.color }]}>
          <Icon name={config.icon} size={24} color="#fff" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.platformNameLarge}>{config.name}</Text>
          <View style={styles.growthContainer}>
            <Icon
              name={data.growth >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={getGrowthColor(data.growth)}
            />
            <Text style={[styles.growthTextLarge, { color: getGrowthColor(data.growth) }]}>
              {formatPercentage(data.growth)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.detailedMetrics}>
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{data.posts}</Text>
            <Text style={styles.metricLabel}>Total Posts</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{formatNumber(data.engagement)}</Text>
            <Text style={styles.metricLabel}>Engagement</Text>
          </View>
        </View>
        
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{formatNumber(data.reach)}</Text>
            <Text style={styles.metricLabel}>Reach</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{data.engagementRate.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Engagement Rate</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return compact ? renderCompactView() : renderDetailedView();
};

const styles = StyleSheet.create({
  compactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: '48%',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  growthBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  growthText: {
    fontSize: 10,
    fontWeight: '600',
  },
  compactMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactMetric: {
    alignItems: 'center',
  },
  compactMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  compactMetricLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  detailedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  platformIconLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  platformNameLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthTextLarge: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailedMetrics: {
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default PlatformMetricsCard; 