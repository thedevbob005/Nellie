// In-App Notification Banner Component
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  Button,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationService, { InAppNotification } from '../../services/NotificationService';

const { width: screenWidth } = Dimensions.get('window');

interface NotificationBannerProps {
  visible: boolean;
  notification: InAppNotification | null;
  onDismiss: () => void;
  onPress?: () => void;
  position?: 'top' | 'bottom';
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  visible,
  notification,
  onDismiss,
  onPress,
  position = 'top',
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(false);
  const dismissTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible && notification) {
      show();
    } else {
      hide();
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, [visible, notification]);

  const show = () => {
    setIsVisible(true);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after duration
    if (notification?.duration) {
      dismissTimer.current = setTimeout(() => {
        hide();
      }, notification.duration);
    }
  };

  const hide = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss();
    });

    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
    hide();
  };

  const handleDismiss = () => {
    if (notification) {
      NotificationService.getInstance().markAsRead(notification.id);
    }
    hide();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return 'checkmark-circle';
      case 'publishing':
        return 'cloud-upload';
      case 'system':
        return 'information-circle';
      case 'reminder':
        return 'alarm';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return '#ef4444';
    
    switch (type) {
      case 'approval':
        return '#10b981';
      case 'publishing':
        return '#6366f1';
      case 'system':
        return '#f59e0b';
      case 'reminder':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const getSlideTransform = () => {
    const translateY = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: position === 'top' ? [-100, 0] : [100, 0],
    });

    return {
      transform: [{ translateY }],
      opacity: opacityAnim,
    };
  };

  const getTopPosition = () => {
    if (position === 'top') {
      return Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;
    }
    return undefined;
  };

  const getBottomPosition = () => {
    if (position === 'bottom') {
      return insets.bottom + 20;
    }
    return undefined;
  };

  if (!isVisible || !notification) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        getSlideTransform(),
        {
          top: getTopPosition(),
          bottom: getBottomPosition(),
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={styles.touchable}
      >
        <Surface style={[
          styles.banner,
          {
            borderLeftColor: getNotificationColor(notification.type, notification.priority),
          },
        ]}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={getNotificationIcon(notification.type) as any}
                size={24}
                color={getNotificationColor(notification.type, notification.priority)}
              />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {notification.title}
              </Text>
              <Text style={styles.body} numberOfLines={3}>
                {notification.body}
              </Text>
              
              {notification.data?.action && (
                <View style={styles.actionContainer}>
                  <Text style={styles.actionText}>
                    {notification.data.action.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            
            <IconButton
              icon="close"
              size={20}
              onPress={handleDismiss}
              style={styles.closeButton}
            />
          </View>
          
          {/* Priority indicator */}
          {notification.priority === 'high' && (
            <View style={[styles.priorityIndicator, { backgroundColor: '#ef4444' }]} />
          )}
        </Surface>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default NotificationBanner;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  touchable: {
    borderRadius: 12,
  },
  banner: {
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderLeftWidth: 4,
    backgroundColor: '#ffffff',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  closeButton: {
    margin: 0,
    marginTop: -4,
  },
  priorityIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}); 