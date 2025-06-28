import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'testing' | 'warning' | 'unknown';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  platform: string;
  accountName?: string;
  lastChecked?: string;
  onTest?: () => void;
  onRefresh?: () => void;
  compact?: boolean;
  animated?: boolean;
}

const STATUS_CONFIG = {
  connected: {
    color: '#4CAF50',
    icon: 'check-circle',
    text: 'Connected',
    bgColor: '#e8f5e8',
  },
  disconnected: {
    color: '#9E9E9E',
    icon: 'radio-button-unchecked',
    text: 'Disconnected',
    bgColor: '#f5f5f5',
  },
  error: {
    color: '#f44336',
    icon: 'error',
    text: 'Error',
    bgColor: '#ffebee',
  },
  testing: {
    color: '#2196F3',
    icon: 'sync',
    text: 'Testing...',
    bgColor: '#e3f2fd',
  },
  warning: {
    color: '#ff9800',
    icon: 'warning',
    text: 'Warning',
    bgColor: '#fff3e0',
  },
  unknown: {
    color: '#666',
    icon: 'help',
    text: 'Unknown',
    bgColor: '#f5f5f5',
  },
};

const PLATFORM_NAMES = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  threads: 'Threads',
};

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  status,
  platform,
  accountName,
  lastChecked,
  onTest,
  onRefresh,
  compact = false,
  animated = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const config = STATUS_CONFIG[status];
  const platformName = PLATFORM_NAMES[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);

  useEffect(() => {
    if (!animated) return;

    // Pulse animation for testing status
    if (status === 'testing') {
      const pulseAnimation = Animated.loop(
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
        ])
      );
      pulseAnimation.start();

      // Rotate animation for testing icon
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      return () => {
        pulseAnimation.stop();
        rotateAnimation.stop();
      };
    } else {
      // Reset animations
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [status, animated, pulseAnim, rotateAnim]);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusMessage = (): string => {
    switch (status) {
      case 'connected':
        return lastChecked ? `Last checked ${formatTimeAgo(lastChecked)}` : 'Connection verified';
      case 'disconnected':
        return 'Not connected to platform';
      case 'error':
        return 'Connection failed - check account settings';
      case 'testing':
        return 'Checking connection status...';
      case 'warning':
        return 'Connection issues detected';
      case 'unknown':
        return 'Connection status unknown';
      default:
        return '';
    }
  };

  const handlePress = () => {
    if (status === 'error' || status === 'warning') {
      Alert.alert(
        'Connection Issue',
        `There's an issue with your ${platformName} connection. Would you like to test the connection or refresh the token?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Test Connection', onPress: onTest },
          { text: 'Refresh Token', onPress: onRefresh },
        ]
      );
    } else if (onTest) {
      onTest();
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, { backgroundColor: config.bgColor }]}
        onPress={handlePress}
        disabled={status === 'testing'}
      >
        <Animated.View
          style={[
            styles.compactIcon,
            animated && status === 'testing' && {
              transform: [
                {
                  scale: pulseAnim,
                },
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Icon name={config.icon} size={16} color={config.color} />
        </Animated.View>
        <Text style={[styles.compactText, { color: config.color }]}>
          {config.text}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.bgColor, opacity: fadeAnim },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        disabled={status === 'testing'}
      >
        <View style={styles.header}>
          <View style={styles.platformInfo}>
            <Animated.View
              style={[
                styles.iconContainer,
                animated && status === 'testing' && {
                  transform: [
                    {
                      scale: pulseAnim,
                    },
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Icon name={config.icon} size={20} color={config.color} />
            </Animated.View>
            
            <View style={styles.textContainer}>
              <Text style={styles.platformName}>{platformName}</Text>
              {accountName && (
                <Text style={styles.accountName}>{accountName}</Text>
              )}
            </View>
          </View>

          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.text}
            </Text>
          </View>
        </View>

        <Text style={styles.statusMessage}>{getStatusMessage()}</Text>

        {(status === 'error' || status === 'warning') && (onTest || onRefresh) && (
          <View style={styles.actions}>
            {onTest && (
              <TouchableOpacity
                style={[styles.actionButton, styles.testButton]}
                onPress={onTest}
              >
                <Icon name="wifi-tethering" size={16} color="#2196F3" />
                <Text style={[styles.actionText, { color: '#2196F3' }]}>
                  Test
                </Text>
              </TouchableOpacity>
            )}
            
            {onRefresh && (
              <TouchableOpacity
                style={[styles.actionButton, styles.refreshButton]}
                onPress={onRefresh}
              >
                <Icon name="refresh" size={16} color="#ff9800" />
                <Text style={[styles.actionText, { color: '#ff9800' }]}>
                  Refresh
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  platformName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  accountName: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
  },
  testButton: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  refreshButton: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
  },
  compactIcon: {
    marginRight: 4,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ConnectionStatusIndicator; 