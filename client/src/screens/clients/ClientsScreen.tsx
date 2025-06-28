// Clients Screen Component  
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../store';
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  clearError,
  selectClients,
  selectClientsLoading,
  selectClientsError,
  selectClientsPagination,
  Client,
  ClientCreateData,
  ClientUpdateData,
} from '../../store/slices/clientsSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  website: string;
  description: string;
}

const ClientsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const clients = useSelector(selectClients);
  const loading = useSelector(selectClientsLoading);
  const error = useSelector(selectClientsError);
  const pagination = useSelector(selectClientsPagination);
  const currentUser = useSelector(selectCurrentUser);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    website: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<ClientFormData>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const loadClients = async () => {
    try {
      await dispatch(fetchClients({ page: 1, limit: 20 })).unwrap();
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      website: '',
      description: '',
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      website: client.website || '',
      description: client.description || '',
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<ClientFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Client name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      errors.website = 'Please enter a valid website URL (http:// or https://)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (editingClient) {
        const updateData: ClientUpdateData = {
          id: editingClient.id,
          ...formData,
        };
        // Remove empty fields
        Object.keys(updateData).forEach(key => {
          if (updateData[key as keyof ClientUpdateData] === '') {
            delete updateData[key as keyof ClientUpdateData];
          }
        });
        
        await dispatch(updateClient(updateData)).unwrap();
      } else {
        const createData: ClientCreateData = { ...formData };
        // Remove empty fields
        Object.keys(createData).forEach(key => {
          if (createData[key as keyof ClientCreateData] === '') {
            delete createData[key as keyof ClientCreateData];
          }
        });
        
        await dispatch(createClient(createData)).unwrap();
      }
      
      setModalVisible(false);
      Alert.alert(
        'Success',
        `Client ${editingClient ? 'updated' : 'created'} successfully`
      );
    } catch (error) {
      console.error('Failed to save client:', error);
    }
  };

  const handleDelete = (client: Client) => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete "${client.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteClient(client.id)).unwrap();
              Alert.alert('Success', 'Client deleted successfully');
            } catch (error) {
              console.error('Failed to delete client:', error);
            }
          },
        },
      ]
    );
  };

  const getPlatformIcon = (platform: string) => {
    const iconMap: { [key: string]: string } = {
      facebook: 'logo-facebook',
      instagram: 'logo-instagram',
      twitter: 'logo-twitter',
      youtube: 'logo-youtube',
      threads: 'chatbubbles',
      linkedin: 'logo-linkedin',
    };
    return iconMap[platform] || 'globe';
  };

  const renderClientItem = ({ item }: { item: Client }) => (
    <View style={styles.clientCard}>
      <View style={styles.clientHeader}>
        <View style={styles.clientInfo}>
          {item.logo_path ? (
            <Image
              source={{ uri: `${process.env.API_BASE_URL}/${item.logo_path}` }}
              style={styles.clientLogo}
            />
          ) : (
            <View style={styles.placeholderLogo}>
              <Text style={styles.placeholderText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.clientDetails}>
            <Text style={styles.clientName}>{item.name}</Text>
            {item.email && <Text style={styles.clientEmail}>{item.email}</Text>}
            {item.phone && <Text style={styles.clientPhone}>{item.phone}</Text>}
          </View>
        </View>
        
        {currentUser?.role === 'manager' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openEditModal(item)}
            >
              <Ionicons name="pencil" size={16} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash" size={16} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {item.description && (
        <Text style={styles.clientDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.clientMeta}>
        <View style={styles.socialPlatforms}>
          {item.platforms?.map((platform, index) => (
            <View key={index} style={styles.platformIcon}>
              <Ionicons
                name={getPlatformIcon(platform) as any}
                size={16}
                color="#4CAF50"
              />
            </View>
          ))}
        </View>
        
        <View style={styles.clientStats}>
          <Text style={styles.statText}>
            {item.social_accounts_count || 0} accounts
          </Text>
          {item.statistics && (
            <Text style={styles.statText}>
              {item.statistics.total_posts} posts
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderForm = () => (
    <ScrollView style={styles.formContainer}>
      <Text style={styles.modalTitle}>
        {editingClient ? 'Edit Client' : 'Add New Client'}
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Client Name *</Text>
        <TextInput
          style={[styles.input, formErrors.name && styles.inputError]}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Enter client name"
          autoCapitalize="words"
        />
        {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, formErrors.email && styles.inputError]}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Website</Text>
        <TextInput
          style={[styles.input, formErrors.website && styles.inputError]}
          value={formData.website}
          onChangeText={(text) => setFormData({ ...formData, website: text })}
          placeholder="https://example.com"
          keyboardType="url"
          autoCapitalize="none"
        />
        {formErrors.website && <Text style={styles.errorText}>{formErrors.website}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Brief description of the client"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => setModalVisible(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        {currentUser?.role === 'manager' && (
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {clients.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Clients Yet</Text>
          <Text style={styles.emptySubtitle}>
            {currentUser?.role === 'manager'
              ? 'Add your first client to get started'
              : 'No clients assigned to you yet'}
          </Text>
          {currentUser?.role === 'manager' && (
            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
              <Text style={styles.emptyButtonText}>Add Client</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={clients}
          renderItem={renderClientItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          {renderForm()}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007bff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  clientCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  placeholderLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 1,
  },
  clientPhone: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  deleteButton: {
    backgroundColor: '#ffe6e6',
  },
  clientDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  clientMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialPlatforms: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIcon: {
    marginRight: 8,
    padding: 4,
    backgroundColor: '#f0f8f0',
    borderRadius: 4,
  },
  clientStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#007bff',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ClientsScreen; 