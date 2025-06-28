// Comprehensive Notification Service
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'approval' | 'publishing' | 'system' | 'reminder';
  data?: {
    postId?: string;
    userId?: string;
    clientId?: string;
    action?: string;
  };
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high';
}

export interface InAppNotification extends NotificationData {
  duration?: number; // in milliseconds
  showInApp: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;
  private inAppNotifications: InAppNotification[] = [];
  private listeners: ((notifications: InAppNotification[]) => void)[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  constructor() {
    this.setupNotificationHandler();
  }

  // Setup notification handling configuration
  private setupNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const notificationData = notification.request.content.data as any;
        
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          priority: this.getPriority(notificationData?.priority || 'normal'),
        };
      },
    });
  }

  private getPriority(priority: string): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'high':
        return Notifications.AndroidNotificationPriority.HIGH;
      case 'low':
        return Notifications.AndroidNotificationPriority.LOW;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  // Initialize push notifications
  async initialize(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications');
        return null;
      }

      // Get push token
      this.expoPushToken = await this.getExpoPushToken();
      
      // Setup listeners
      this.setupListeners();

      // Load stored notifications
      await this.loadStoredNotifications();

      return this.expoPushToken;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  private async getExpoPushToken(): Promise<string> {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    
    if (!projectId) {
      throw new Error('Project ID not found');
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  }

  private setupListeners() {
    // Listener for when a notification is received while app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        this.handleReceivedNotification(notification);
      }
    );

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        this.handleNotificationResponse(response);
      }
    );
  }

  private handleReceivedNotification(notification: Notifications.Notification) {
    const { title, body, data } = notification.request.content;
    
    const inAppNotification: InAppNotification = {
      id: notification.request.identifier,
      title: title || 'New Notification',
      body: body || '',
      type: (data as any)?.type || 'system',
      data: data as any,
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: (data as any)?.priority || 'normal',
      duration: this.getNotificationDuration((data as any)?.type),
      showInApp: true,
    };

    this.addInAppNotification(inAppNotification);
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { data } = response.notification.request.content;
    
    // Handle navigation based on notification type
    this.handleNotificationNavigation(data as any);
  }

  private handleNotificationNavigation(data: any) {
    if (!data) return;

    switch (data.type) {
      case 'approval':
        // Navigate to approval screen
        console.log('Navigate to approval screen', data);
        break;
      case 'publishing':
        // Navigate to post details
        console.log('Navigate to post details', data);
        break;
      case 'system':
        // Navigate to dashboard
        console.log('Navigate to dashboard', data);
        break;
      default:
        console.log('Unknown notification type', data);
    }
  }

  private getNotificationDuration(type: string): number {
    switch (type) {
      case 'approval':
        return 8000; // 8 seconds
      case 'publishing':
        return 6000; // 6 seconds
      case 'system':
        return 4000; // 4 seconds
      default:
        return 5000; // 5 seconds
    }
  }

  // Send local notification
  async sendLocalNotification(notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'>) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            ...notification.data,
            type: notification.type,
            priority: notification.priority,
          },
          priority: this.getPriority(notification.priority),
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      return null;
    }
  }

  // Add in-app notification
  addInAppNotification(notification: InAppNotification) {
    this.inAppNotifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.inAppNotifications.length > 50) {
      this.inAppNotifications = this.inAppNotifications.slice(0, 50);
    }

    this.saveNotifications();
    this.notifyListeners();
  }

  // Create and show notification for post approval
  async notifyPostApproval(postTitle: string, isApproved: boolean, feedback?: string) {
    const notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'> = {
      title: isApproved ? 'Post Approved' : 'Post Needs Changes',
      body: isApproved 
        ? `"${postTitle}" has been approved and added to the publishing queue.`
        : `"${postTitle}" needs changes. ${feedback ? `Feedback: ${feedback}` : ''}`,
      type: 'approval',
      priority: isApproved ? 'normal' : 'high',
      data: {
        action: isApproved ? 'approved' : 'rejected',
      },
    };

    await this.sendLocalNotification(notification);
    
    const inAppNotification: InAppNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      isRead: false,
      duration: 8000,
      showInApp: true,
    };

    this.addInAppNotification(inAppNotification);
  }

  // Create and show notification for post publishing
  async notifyPostPublished(postTitle: string, platform: string, success: boolean, error?: string) {
    const notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'> = {
      title: success ? 'Post Published' : 'Publishing Failed',
      body: success 
        ? `"${postTitle}" has been successfully published to ${platform}.`
        : `Failed to publish "${postTitle}" to ${platform}. ${error || 'Please try again.'}`,
      type: 'publishing',
      priority: success ? 'normal' : 'high',
      data: {
        platform,
        action: success ? 'published' : 'failed',
      },
    };

    await this.sendLocalNotification(notification);
    
    const inAppNotification: InAppNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      isRead: false,
      duration: 6000,
      showInApp: true,
    };

    this.addInAppNotification(inAppNotification);
  }

  // Create system notification
  async notifySystemUpdate(title: string, message: string, priority: 'low' | 'normal' | 'high' = 'normal') {
    const notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'> = {
      title,
      body: message,
      type: 'system',
      priority,
      data: {
        action: 'system_update',
      },
    };

    await this.sendLocalNotification(notification);
    
    const inAppNotification: InAppNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      isRead: false,
      duration: 5000,
      showInApp: true,
    };

    this.addInAppNotification(inAppNotification);
  }

  // Create reminder notification
  async scheduleReminder(title: string, message: string, scheduledTime: Date) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: {
            type: 'reminder',
            priority: 'normal',
          },
        },
        trigger: scheduledTime,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return null;
    }
  }

  // Get all in-app notifications
  getInAppNotifications(): InAppNotification[] {
    return this.inAppNotifications;
  }

  // Mark notification as read
  markAsRead(notificationId: string) {
    this.inAppNotifications = this.inAppNotifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    );
    
    this.saveNotifications();
    this.notifyListeners();
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.inAppNotifications = this.inAppNotifications.map(notification => ({
      ...notification,
      isRead: true,
    }));
    
    this.saveNotifications();
    this.notifyListeners();
  }

  // Remove notification
  removeNotification(notificationId: string) {
    this.inAppNotifications = this.inAppNotifications.filter(
      notification => notification.id !== notificationId
    );
    
    this.saveNotifications();
    this.notifyListeners();
  }

  // Clear all notifications
  clearAllNotifications() {
    this.inAppNotifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  // Get unread notification count
  getUnreadCount(): number {
    return this.inAppNotifications.filter(notification => !notification.isRead).length;
  }

  // Subscribe to notification updates
  subscribe(listener: (notifications: InAppNotification[]) => void) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.inAppNotifications);
    });
  }

  // Save notifications to storage
  private async saveNotifications() {
    try {
      await AsyncStorage.setItem(
        'nellie_notifications',
        JSON.stringify(this.inAppNotifications)
      );
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // Load notifications from storage
  private async loadStoredNotifications() {
    try {
      const stored = await AsyncStorage.getItem('nellie_notifications');
      if (stored) {
        this.inAppNotifications = JSON.parse(stored);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  // Cleanup listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Get push token for server registration
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Update badge count
  async updateBadgeCount() {
    const unreadCount = this.getUnreadCount();
    await Notifications.setBadgeCountAsync(unreadCount);
  }

  // Cancel scheduled notification
  async cancelScheduledNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Cancel all scheduled notifications
  async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }
}

export default NotificationService; 