// Notification Center Component
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Searchbar,
  FAB,
  Chip,
  IconButton,
  Button,
  Surface,
  Portal,
  Modal,
  Menu,
  Divider,
  Badge,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import NotificationService, { InAppNotification } from '../../services/NotificationService';

interface NotificationCenterProps {
  visible?: boolean;
  onClose?: () => void;
  onNotificationPress?: (notification: InAppNotification) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  visible = true,
  onClose,
  onNotificationPress,
}) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<InAppNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'approval' | 'publishing' | 'system'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<InAppNotification | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchQuery, selectedFilter]);

  const loadNotifications = () => {
    const allNotifications = notificationService.getInAppNotifications();
    setNotifications(allNotifications);
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    // Apply type filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'unread') {
        filtered = filtered.filter(n => !n.isRead);
      } else {
        filtered = filtered.filter(n => n.type === selectedFilter);
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.body.toLowerCase().includes(query)
      );
    }

    setFilteredNotifications(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: InAppNotification) => {
    // Mark as read
    if (!notification.isRead) {
      notificationService.markAsRead(notification.id);
    }

    if (onNotificationPress) {
      onNotificationPress(notification);
    } else {
      setSelectedNotification(notification);
      setIsDetailModalVisible(true);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => notificationService.removeNotification(notificationId),
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => notificationService.clearAllNotifications(),
        },
      ]
    );
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

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE');
    } else {
      return format(date, 'MMM dd');
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  const getFilteredCount = (filter: string) => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead).length;
      case 'approval':
        return notifications.filter(n => n.type === 'approval').length;
      case 'publishing':
        return notifications.filter(n => n.type === 'publishing').length;
      case 'system':
        return notifications.filter(n => n.type === 'system').length;
      default:
        return notifications.length;
    }
  };

  const renderNotificationItem = ({ item }: { item: InAppNotification }) => (
    <TouchableOpacity onPress={() => handleNotificationPress(item)}>
      <Card style={[
        styles.notificationCard,
        !item.isRead && styles.unreadCard,
      ]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={getNotificationIcon(item.type) as any}
                size={24}
                color={getNotificationColor(item.type, item.priority)}
              />
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            
            <View style={styles.textContainer}>
              <Text style={[
                styles.notificationTitle,
                !item.isRead && styles.unreadText,
              ]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.notificationBody} numberOfLines={3}>
                {item.body}
              </Text>
              
              <View style={styles.metaContainer}>
                <Text style={styles.timeText}>
                  {formatNotificationTime(item.timestamp)}
                </Text>
                
                {item.priority === 'high' && (
                  <Chip mode="outlined" style={styles.priorityChip} textStyle={styles.priorityText}>
                    High Priority
                  </Chip>
                )}
                
                <Chip mode="outlined" style={styles.typeChip}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Chip>
              </View>
            </View>
            
            <Menu
              visible={false}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => {
                    // Handle menu toggle
                  }}
                />
              }
            >
              {!item.isRead && (
                <Menu.Item
                  onPress={() => handleMarkAsRead(item.id)}
                  title="Mark as Read"
                />
              )}
              <Menu.Item
                onPress={() => handleDeleteNotification(item.id)}
                title="Delete"
                titleStyle={{ color: '#ef4444' }}
              />
            </Menu>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedFilter !== 'all'
          ? 'No notifications match your current filters'
          : 'You\'re all caught up! New notifications will appear here.'
        }
      </Text>
    </View>
  );

  const renderFilterChips = () => (
    <View style={styles.filtersContainer}>
      {[
        { key: 'all', label: 'All' },
        { key: 'unread', label: 'Unread' },
        { key: 'approval', label: 'Approvals' },
        { key: 'publishing', label: 'Publishing' },
        { key: 'system', label: 'System' },
      ].map((filter) => (
        <TouchableOpacity
          key={filter.key}
          onPress={() => setSelectedFilter(filter.key as any)}
        >
          <Chip
            mode={selectedFilter === filter.key ? 'flat' : 'outlined'}
            style={[
              styles.filterChip,
              selectedFilter === filter.key && styles.activeFilterChip,
            ]}
            textStyle={[
              styles.filterChipText,
              selectedFilter === filter.key && styles.activeFilterChipText,
            ]}
          >
            {filter.label} ({getFilteredCount(filter.key)})
          </Chip>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {getUnreadCount() > 0 && (
            <Badge style={styles.headerBadge}>
              {getUnreadCount()}
            </Badge>
          )}
        </View>
        
        <View style={styles.headerActions}>
          {getUnreadCount() > 0 && (
            <Button mode="text" onPress={handleMarkAllAsRead}>
              Mark All Read
            </Button>
          )}
          
          <Menu
            visible={isMenuVisible}
            onDismiss={() => setIsMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setIsMenuVisible(true)}
              />
            }
          >
            <Menu.Item onPress={handleClearAll} title="Clear All" />
            <Menu.Item onPress={onRefresh} title="Refresh" />
          </Menu>
          
          {onClose && (
            <IconButton icon="close" onPress={onClose} />
          )}
        </View>
      </Surface>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search notifications..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Filters */}
      {renderFilterChips()}

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Notification Detail Modal */}
      <Portal>
        <Modal
          visible={isDetailModalVisible}
          onDismiss={() => setIsDetailModalVisible(false)}
          contentContainerStyle={styles.detailModal}
        >
          {selectedNotification && (
            <View>
              <Text style={styles.detailTitle}>
                {selectedNotification.title}
              </Text>
              
              <Text style={styles.detailBody}>
                {selectedNotification.body}
              </Text>
              
              <View style={styles.detailMeta}>
                <Text style={styles.detailMetaText}>
                  Type: {selectedNotification.type.charAt(0).toUpperCase() + selectedNotification.type.slice(1)}
                </Text>
                <Text style={styles.detailMetaText}>
                  Time: {format(new Date(selectedNotification.timestamp), 'PPpp')}
                </Text>
                {selectedNotification.priority === 'high' && (
                  <Text style={[styles.detailMetaText, { color: '#ef4444' }]}>
                    Priority: High
                  </Text>
                )}
              </View>
              
              <Button
                mode="contained"
                onPress={() => setIsDetailModalVisible(false)}
                style={styles.detailCloseButton}
              >
                Close
              </Button>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  headerBadge: {
    backgroundColor: '#ef4444',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    paddingTop: 0,
  },
  searchbar: {
    elevation: 2,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterChip: {
    backgroundColor: '#6366f1',
  },
  filterChipText: {
    fontSize: 12,
  },
  activeFilterChipText: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  cardContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 8,
  },
  priorityChip: {
    height: 24,
    marginRight: 8,
    borderColor: '#ef4444',
  },
  priorityText: {
    fontSize: 10,
    color: '#ef4444',
  },
  typeChip: {
    height: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  detailModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailBody: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  detailMeta: {
    marginBottom: 20,
  },
  detailMetaText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  detailCloseButton: {
    backgroundColor: '#6366f1',
  },
});

export default NotificationCenter; 