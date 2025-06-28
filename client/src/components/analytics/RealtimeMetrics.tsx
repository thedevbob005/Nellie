import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface RealtimeData {
  activeUsers: number;
  postsToday: number;
  engagementToday: number;
  trending: string[];
}

interface RealtimeMetricsProps {
  data: RealtimeData;
  onRefresh?: () => void;
}

const RealtimeMetrics: React.FC<RealtimeMetricsProps> = ({
  data,
  onRefresh,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Pulse animation for "Live" indicator
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, [pulseAnim]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          <Animated.View 
            style={[
              styles.liveDot,
              { transform: [{ scale: pulseAnim }] }
            ]}
          />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        
        <Text style={styles.title}>Real-time Metrics</Text>
        
        <TouchableOpacity
          style={[styles.refreshButton, isRefreshing && styles.refreshing]}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <Icon 
            name="refresh" 
            size={20} 
            color="#2196F3"
            style={isRefreshing ? styles.spinning : undefined}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Icon name="people" size={20} color="#4CAF50" />
          </View>
          <View style={styles.metricInfo}>
            <Text style={styles.metricValue}>{formatNumber(data.activeUsers)}</Text>
            <Text style={styles.metricLabel}>Active Users</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Icon name="today" size={20} color="#2196F3" />
          </View>
          <View style={styles.metricInfo}>
            <Text style={styles.metricValue}>{data.postsToday}</Text>
            <Text style={styles.metricLabel}>Posts Today</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Icon name="favorite" size={20} color="#E91E63" />
          </View>
          <View style={styles.metricInfo}>
            <Text style={styles.metricValue}>{formatNumber(data.engagementToday)}</Text>
            <Text style={styles.metricLabel}>Engagement Today</Text>
          </View>
        </View>
      </View>

      {data.trending.length > 0 && (
        <View style={styles.trendingSection}>
          <View style={styles.trendingHeader}>
            <Icon name="trending-up" size={18} color="#FF9800" />
            <Text style={styles.trendingTitle}>Trending Now</Text>
          </View>
          
          <View style={styles.trendingTags}>
            {data.trending.map((tag, index) => (
              <View key={index} style={styles.trendingTag}>
                <Text style={styles.trendingTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Icon name="access-time" size={12} color="#999" />
        <Text style={styles.footerText}>
          Updated {new Date().toLocaleTimeString()}
        </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 4,
  },
  refreshing: {
    opacity: 0.6,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  metricsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricInfo: {
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  metricLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  trendingSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  trendingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  trendingTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  trendingTagText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  footerText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
});

export default RealtimeMetrics; 