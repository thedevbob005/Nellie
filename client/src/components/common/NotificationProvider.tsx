// Notification Provider Component
import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import NotificationService, { InAppNotification } from '../../services/NotificationService';
import NotificationBanner from './NotificationBanner';

interface NotificationContextType {
  notifications: InAppNotification[];
  unreadCount: number;
  showNotification: (notification: Omit<InAppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [currentBanner, setCurrentBanner] = useState<InAppNotification | null>(null);
  const [bannerQueue, setBannerQueue] = useState<InAppNotification[]>([]);
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    // Initialize notification service
    initializeNotifications();

    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      
      // Check for new notifications to show in banner
      const latestNotification = newNotifications[0];
      if (latestNotification && latestNotification.showInApp && !latestNotification.isRead) {
        showBanner(latestNotification);
      }
    });

    return () => {
      unsubscribe();
      notificationService.cleanup();
    };
  }, []);

  useEffect(() => {
    // Process banner queue
    if (!isBannerVisible && bannerQueue.length > 0) {
      const nextBanner = bannerQueue[0];
      setBannerQueue(prev => prev.slice(1));
      setCurrentBanner(nextBanner);
      setIsBannerVisible(true);
    }
  }, [isBannerVisible, bannerQueue]);

  const initializeNotifications = async () => {
    try {
      const token = await notificationService.initialize();
      if (token) {
        console.log('Push token:', token);
        // Here you would typically send the token to your backend
      }
      
      // Load existing notifications
      const existingNotifications = notificationService.getInAppNotifications();
      setNotifications(existingNotifications);

      // Demo: Send some test notifications after a delay
      setTimeout(() => {
        sendDemoNotifications();
      }, 3000);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  const sendDemoNotifications = () => {
    // Demo approval notification
    notificationService.notifyPostApproval(
      'Social Media Strategy Post',
      true,
      'Great content! Added to publishing queue.'
    );

    // Demo publishing notification after 5 seconds
    setTimeout(() => {
      notificationService.notifyPostPublished(
        'Social Media Strategy Post',
        'Facebook',
        true
      );
    }, 5000);

    // Demo system notification after 10 seconds
    setTimeout(() => {
      notificationService.notifySystemUpdate(
        'New Feature Available',
        'Enhanced media upload is now available! Upload multiple files with progress tracking.',
        'normal'
      );
    }, 10000);
  };

  const showBanner = (notification: InAppNotification) => {
    if (isBannerVisible) {
      // Add to queue if banner is already showing
      setBannerQueue(prev => [...prev, notification]);
    } else {
      // Show immediately
      setCurrentBanner(notification);
      setIsBannerVisible(true);
    }
  };

  const handleBannerDismiss = () => {
    setIsBannerVisible(false);
    setCurrentBanner(null);
  };

  const handleBannerPress = () => {
    if (currentBanner) {
      // Handle navigation based on notification type
      handleNotificationNavigation(currentBanner);
    }
  };

  const handleNotificationNavigation = (notification: InAppNotification) => {
    // This would typically use navigation service
    console.log('Navigate for notification:', notification.type, notification.data);
  };

  const showNotification = (notification: Omit<InAppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const fullNotification: InAppNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    notificationService.addInAppNotification(fullNotification);
  };

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const clearAll = () => {
    notificationService.clearAllNotifications();
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount: getUnreadCount(),
    showNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      <View style={styles.container}>
        {children}
        
        {/* Notification Banner Overlay */}
        <NotificationBanner
          visible={isBannerVisible}
          notification={currentBanner}
          onDismiss={handleBannerDismiss}
          onPress={handleBannerPress}
          position="top"
        />
      </View>
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default NotificationProvider; 