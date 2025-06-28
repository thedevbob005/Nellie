// Users Management Screen - For Managers Only
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Avatar,
  Badge,
  Surface,
  Searchbar,
  FAB,
  Portal,
  Dialog,
  Paragraph,
  Divider,
  ActivityIndicator,
  Menu,
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useNavigation } from '@react-navigation/native';

// Demo data for users
const DEMO_USERS = [
  {
    id: 1,
    email: 'john.manager@company.com',
    firstName: 'John',
    lastName: 'Smith',
    role: 'manager',
    isActive: true,
    lastLogin: '2024-01-14T10:30:00Z',
    createdAt: '2023-08-15T09:00:00Z',
    assignedClients: ['TechStartup Inc', 'Local Coffee Shop'],
    totalPosts: 156,
    approvalStats: {
      approved: 142,
      rejected: 8,
      pending: 6,
    },
  },
  {
    id: 2,
    email: 'sarah.designer@company.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'designer',
    isActive: true,
    lastLogin: '2024-01-14T14:15:00Z',
    createdAt: '2023-09-10T11:30:00Z',
    assignedClients: ['TechStartup Inc', 'Fitness Studio'],
    totalPosts: 89,
    approvalStats: {
      approved: 78,
      rejected: 5,
      pending: 6,
    },
  },
  {
    id: 3,
    email: 'mike.designer@company.com',
    firstName: 'Mike',
    lastName: 'Chen',
    role: 'designer',
    isActive: true,
    lastLogin: '2024-01-14T09:45:00Z',
    createdAt: '2023-10-05T14:20:00Z',
    assignedClients: ['Local Coffee Shop', 'Fashion Boutique'],
    totalPosts: 67,
    approvalStats: {
      approved: 58,
      rejected: 4,
      pending: 5,
    },
  },
  {
    id: 4,
    email: 'emma.designer@company.com',
    firstName: 'Emma',
    lastName: 'Davis',
    role: 'designer',
    isActive: false,
    lastLogin: '2024-01-10T16:20:00Z',
    createdAt: '2023-11-12T10:15:00Z',
    assignedClients: ['Fitness Studio'],
    totalPosts: 45,
    approvalStats: {
      approved: 40,
      rejected: 3,
      pending: 2,
    },
  },
  {
    id: 5,
    email: 'lisa.designer@company.com',
    firstName: 'Lisa',
    lastName: 'Park',
    role: 'designer',
    isActive: true,
    lastLogin: '2024-01-14T11:55:00Z',
    createdAt: '2023-12-01T13:45:00Z',
    assignedClients: ['Fashion Boutique'],
    totalPosts: 34,
    approvalStats: {
      approved: 29,
      rejected: 2,
      pending: 3,
    },
  },
];

interface UsersScreenProps {}

const UsersScreen: React.FC<UsersScreenProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'manager' | 'designer'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isMenuVisible, setIsMenuVisible] = useState<{ [key: number]: boolean }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation();

  // Filter users based on search and filters
  const filteredUsers = DEMO_USERS.filter(user => {
    const matchesSearch = `${user.firstName} ${user.lastName} ${user.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const toggleMenu = (userId: number) => {
    setIsMenuVisible(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleEditUser = (user: any) => {
    // Navigate to edit user screen
    navigation.navigate('EditUser' as never, { userId: user.id } as never);
    setIsMenuVisible({});
  };

  const handleViewUser = (user: any) => {
    // Navigate to user details screen
    navigation.navigate('UserDetails' as never, { userId: user.id } as never);
    setIsMenuVisible({});
  };

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user);
    setIsDeleteDialogVisible(true);
    setIsMenuVisible({});
  };

  const confirmDeleteUser = () => {
    // Mock delete API call
    Alert.alert('Success', `User ${userToDelete?.firstName} ${userToDelete?.lastName} has been deleted.`);
    setIsDeleteDialogVisible(false);
    setUserToDelete(null);
  };

  const handleToggleUserStatus = (user: any) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: () => {
            // Mock API call
            Alert.alert('Success', `User ${action}d successfully!`);
          },
        },
      ]
    );
    setIsMenuVisible({});
  };

  const handleCreateUser = () => {
    navigation.navigate('CreateUser' as never);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    return role === 'manager' ? '#6366f1' : '#10b981';
  };

  const getRoleIcon = (role: string) => {
    return role === 'manager' ? 'star' : 'brush';
  };

  const getApprovalRate = (stats: any) => {
    const total = stats.approved + stats.rejected;
    if (total === 0) return 0;
    return Math.round((stats.approved / total) * 100);
  };

  const renderUserCard = (user: any) => (
    <Card key={user.id} style={styles.userCard}>
      <Card.Content>
        {/* Header */}
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={50} 
              label={`${user.firstName[0]}${user.lastName[0]}`}
              style={[styles.avatar, { backgroundColor: getRoleColor(user.role) }]}
            />
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                {!user.isActive && (
                  <Chip mode="outlined" style={styles.inactiveChip} textStyle={styles.inactiveText}>
                    Inactive
                  </Chip>
                )}
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.roleRow}>
                <Ionicons 
                  name={getRoleIcon(user.role) as any} 
                  size={16} 
                  color={getRoleColor(user.role)} 
                />
                <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Text>
              </View>
            </View>
          </View>
          
          <Menu
            visible={isMenuVisible[user.id] || false}
            onDismiss={() => toggleMenu(user.id)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => toggleMenu(user.id)}
              />
            }
          >
            <Menu.Item onPress={() => handleViewUser(user)} title="View Details" />
            <Menu.Item onPress={() => handleEditUser(user)} title="Edit User" />
            <Menu.Item 
              onPress={() => handleToggleUserStatus(user)} 
              title={user.isActive ? 'Deactivate' : 'Activate'} 
            />
            <Divider />
            <Menu.Item 
              onPress={() => handleDeleteUser(user)} 
              title="Delete User"
              titleStyle={{ color: '#ef4444' }}
            />
          </Menu>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.totalPosts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.assignedClients.length}</Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{getApprovalRate(user.approvalStats)}%</Text>
            <Text style={styles.statLabel}>Approval Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.approvalStats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Assigned Clients */}
        <View style={styles.clientsSection}>
          <Text style={styles.clientsLabel}>Assigned Clients:</Text>
          <View style={styles.clientsContainer}>
            {user.assignedClients.map((client: string, index: number) => (
              <Chip key={index} mode="outlined" style={styles.clientChip}>
                {client}
              </Chip>
            ))}
          </View>
        </View>

        {/* Last Login */}
        <View style={styles.lastLoginSection}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={styles.lastLoginText}>
            Last active: {formatDate(user.lastLogin)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <Surface style={styles.statsHeader}>
        <View style={styles.headerStatItem}>
          <Text style={styles.headerStatNumber}>{DEMO_USERS.length}</Text>
          <Text style={styles.headerStatLabel}>Total Users</Text>
        </View>
        <View style={styles.headerStatItem}>
          <Text style={styles.headerStatNumber}>
            {DEMO_USERS.filter(u => u.isActive).length}
          </Text>
          <Text style={styles.headerStatLabel}>Active</Text>
        </View>
        <View style={styles.headerStatItem}>
          <Text style={styles.headerStatNumber}>
            {DEMO_USERS.filter(u => u.role === 'manager').length}
          </Text>
          <Text style={styles.headerStatLabel}>Managers</Text>
        </View>
        <View style={styles.headerStatItem}>
          <Text style={styles.headerStatNumber}>
            {DEMO_USERS.filter(u => u.role === 'designer').length}
          </Text>
          <Text style={styles.headerStatLabel}>Designers</Text>
        </View>
      </Surface>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <TouchableOpacity 
            style={[styles.filterChip, filterRole === 'all' && styles.activeFilterChip]}
            onPress={() => setFilterRole('all')}
          >
            <Text style={[styles.filterText, filterRole === 'all' && styles.activeFilterText]}>
              All Roles
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterChip, filterRole === 'manager' && styles.activeFilterChip]}
            onPress={() => setFilterRole('manager')}
          >
            <Text style={[styles.filterText, filterRole === 'manager' && styles.activeFilterText]}>
              Managers
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterChip, filterRole === 'designer' && styles.activeFilterChip]}
            onPress={() => setFilterRole('designer')}
          >
            <Text style={[styles.filterText, filterRole === 'designer' && styles.activeFilterText]}>
              Designers
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'active' && styles.activeFilterChip]}
            onPress={() => setFilterStatus(filterStatus === 'active' ? 'all' : 'active')}
          >
            <Text style={[styles.filterText, filterStatus === 'active' && styles.activeFilterText]}>
              Active Only
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.usersList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredUsers.length > 0 ? (
          filteredUsers.map(renderUserCard)
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Ionicons name="people-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first team member"
                }
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleCreateUser}
        label="Add User"
      />

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={isDeleteDialogVisible} onDismiss={() => setIsDeleteDialogVisible(false)}>
          <Dialog.Title>Delete User</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete {userToDelete?.firstName} {userToDelete?.lastName}? 
              This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmDeleteUser} textColor="#ef4444">Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  headerStatItem: {
    alignItems: 'center',
  },
  headerStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  headerStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchbar: {
    marginBottom: 12,
    elevation: 2,
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#6366f1',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  inactiveChip: {
    height: 24,
    borderColor: '#ef4444',
  },
  inactiveText: {
    color: '#ef4444',
    fontSize: 10,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  clientsSection: {
    marginBottom: 12,
  },
  clientsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  clientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  clientChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  lastLoginSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastLoginText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366f1',
  },
  emptyCard: {
    marginTop: 40,
    borderRadius: 12,
    elevation: 1,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default UsersScreen; 