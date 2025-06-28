// Create/Edit User Screen - For Managers Only
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  RadioButton,
  Chip,
  Surface,
  Portal,
  Modal,
  List,
  Checkbox,
  ActivityIndicator,
  Divider,
  Switch,
  HelperText,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

// Demo data for clients
const DEMO_CLIENTS = [
  { id: 1, name: 'TechStartup Inc', isActive: true },
  { id: 2, name: 'Local Coffee Shop', isActive: true },
  { id: 3, name: 'Fitness Studio', isActive: true },
  { id: 4, name: 'Fashion Boutique', isActive: true },
  { id: 5, name: 'Digital Agency', isActive: false },
];

// Demo user data for editing
const DEMO_USER_DATA = {
  id: 2,
  email: 'sarah.designer@company.com',
  firstName: 'Sarah',
  lastName: 'Johnson',
  role: 'designer',
  isActive: true,
  assignedClients: [1, 3], // TechStartup Inc, Fitness Studio
};

interface CreateEditUserScreenProps {}

const CreateEditUserScreen: React.FC<CreateEditUserScreenProps> = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Get userId from route params (undefined for create mode)
  const userId = (route.params as any)?.userId;
  const isEditMode = !!userId;
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'designer',
    isActive: true,
    assignedClients: [] as number[],
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load user data for editing
  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      // Mock API call to load user data
      setTimeout(() => {
        setFormData({
          firstName: DEMO_USER_DATA.firstName,
          lastName: DEMO_USER_DATA.lastName,
          email: DEMO_USER_DATA.email,
          password: '',
          confirmPassword: '',
          role: DEMO_USER_DATA.role,
          isActive: DEMO_USER_DATA.isActive,
          assignedClients: DEMO_USER_DATA.assignedClients,
        });
        setLoading(false);
      }, 1000);
    }
  }, [isEditMode]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation (for create mode or when changing password)
    if (!isEditMode || formData.password) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const action = isEditMode ? 'updated' : 'created';
      Alert.alert(
        'Success', 
        `User ${formData.firstName} ${formData.lastName} has been ${action} successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleClientAssignment = (clientId: number) => {
    const isAssigned = formData.assignedClients.includes(clientId);
    if (isAssigned) {
      updateFormData('assignedClients', formData.assignedClients.filter(id => id !== clientId));
    } else {
      updateFormData('assignedClients', [...formData.assignedClients, clientId]);
    }
  };

  const getAssignedClientNames = () => {
    return DEMO_CLIENTS
      .filter(client => formData.assignedClients.includes(client.id))
      .map(client => client.name);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Surface style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditMode ? `Edit ${formData.firstName} ${formData.lastName}` : 'Create New User'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEditMode 
              ? 'Update user information and permissions' 
              : 'Add a new team member to your organization'
            }
          </Text>
        </Surface>

        {/* Basic Information */}
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextInput
                  label="First Name *"
                  value={formData.firstName}
                  onChangeText={(text) => updateFormData('firstName', text)}
                  mode="outlined"
                  error={!!errors.firstName}
                  style={styles.input}
                />
                <HelperText type="error" visible={!!errors.firstName}>
                  {errors.firstName}
                </HelperText>
              </View>
              
              <View style={styles.halfField}>
                <TextInput
                  label="Last Name *"
                  value={formData.lastName}
                  onChangeText={(text) => updateFormData('lastName', text)}
                  mode="outlined"
                  error={!!errors.lastName}
                  style={styles.input}
                />
                <HelperText type="error" visible={!!errors.lastName}>
                  {errors.lastName}
                </HelperText>
              </View>
            </View>

            <TextInput
              label="Email Address *"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.email}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>
          </Card.Content>
        </Card>

        {/* Password Section */}
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>
              {isEditMode ? 'Change Password' : 'Password'}
            </Text>
            {isEditMode && (
              <Text style={styles.sectionSubtitle}>
                Leave blank to keep current password
              </Text>
            )}
            
            <TextInput
              label={isEditMode ? "New Password" : "Password *"}
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              mode="outlined"
              secureTextEntry={!showPassword}
              error={!!errors.password}
              style={styles.input}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>

            <TextInput
              label={isEditMode ? "Confirm New Password" : "Confirm Password *"}
              value={formData.confirmPassword}
              onChangeText={(text) => updateFormData('confirmPassword', text)}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              error={!!errors.confirmPassword}
              style={styles.input}
              right={
                <TextInput.Icon 
                  icon={showConfirmPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </HelperText>
          </Card.Content>
        </Card>

        {/* Role & Status */}
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Role & Status</Text>
            
            {/* Role Selection */}
            <Text style={styles.fieldLabel}>User Role</Text>
            <RadioButton.Group 
              onValueChange={(value) => updateFormData('role', value)} 
              value={formData.role}
            >
              <View style={styles.radioOption}>
                <RadioButton value="manager" />
                <View style={styles.radioContent}>
                  <Text style={styles.radioTitle}>Manager</Text>
                  <Text style={styles.radioDescription}>
                    Full access - can manage users, approve content, and view all analytics
                  </Text>
                </View>
              </View>
              
              <View style={styles.radioOption}>
                <RadioButton value="designer" />
                <View style={styles.radioContent}>
                  <Text style={styles.radioTitle}>Designer</Text>
                  <Text style={styles.radioDescription}>
                    Limited access - can create content and view basic analytics
                  </Text>
                </View>
              </View>
            </RadioButton.Group>

            <Divider style={styles.divider} />

            {/* Account Status */}
            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <Text style={styles.switchTitle}>Account Status</Text>
                <Text style={styles.switchDescription}>
                  {formData.isActive ? 'User can log in and access the system' : 'User account is disabled'}
                </Text>
              </View>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => updateFormData('isActive', value)}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Client Assignment (only for designers) */}
        {formData.role === 'designer' && (
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Client Assignment</Text>
              <Text style={styles.sectionSubtitle}>
                Select which clients this designer can work on
              </Text>
              
              <Button
                mode="outlined"
                onPress={() => setShowClientSelector(true)}
                style={styles.clientSelectorButton}
                icon="account-multiple"
              >
                Select Clients ({formData.assignedClients.length})
              </Button>

              {/* Assigned Clients Display */}
              {formData.assignedClients.length > 0 && (
                <View style={styles.assignedClientsContainer}>
                  <Text style={styles.assignedClientsLabel}>Assigned Clients:</Text>
                  <View style={styles.chipContainer}>
                    {getAssignedClientNames().map((clientName, index) => (
                      <Chip key={index} style={styles.clientChip} mode="outlined">
                        {clientName}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            {saving ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={saving}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>

      {/* Client Selection Modal */}
      <Portal>
        <Modal
          visible={showClientSelector}
          onDismiss={() => setShowClientSelector(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Select Clients</Text>
          <Text style={styles.modalSubtitle}>
            Choose which clients this designer can work on
          </Text>
          
          <ScrollView style={styles.clientList}>
            {DEMO_CLIENTS.map((client) => (
              <List.Item
                key={client.id}
                title={client.name}
                description={client.isActive ? 'Active' : 'Inactive'}
                left={() => (
                  <Checkbox
                    status={formData.assignedClients.includes(client.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleClientAssignment(client.id)}
                  />
                )}
                onPress={() => toggleClientAssignment(client.id)}
                style={[
                  styles.clientListItem,
                  !client.isActive && styles.inactiveClientItem
                ]}
              />
            ))}
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <Button
              mode="contained"
              onPress={() => setShowClientSelector(false)}
              style={styles.modalButton}
            >
              Done ({formData.assignedClients.length} selected)
            </Button>
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfField: {
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  radioContent: {
    flex: 1,
    marginLeft: 8,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  radioDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  divider: {
    marginVertical: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  clientSelectorButton: {
    marginBottom: 16,
  },
  assignedClientsContainer: {
    marginTop: 8,
  },
  assignedClientsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  clientChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    marginBottom: 12,
    backgroundColor: '#6366f1',
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
  cancelButton: {
    borderColor: '#d1d5db',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  clientList: {
    maxHeight: 300,
  },
  clientListItem: {
    paddingHorizontal: 0,
  },
  inactiveClientItem: {
    opacity: 0.6,
  },
  modalButtons: {
    marginTop: 16,
  },
  modalButton: {
    backgroundColor: '#6366f1',
  },
});

export default CreateEditUserScreen;
