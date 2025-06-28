// Login Screen Component
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  HelperText,
  Divider,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState, AppDispatch } from '../../store';
import { loginUser, registerUser, clearError } from '../../store/slices/authSlice';

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    organizationName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    // Clear errors when switching between login/register
    dispatch(clearError());
    setFormErrors({});
  }, [isLoginMode, dispatch]);

  useEffect(() => {
    // Clear errors after 5 seconds
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const validateLoginForm = (): boolean => {
    const errors: any = {};
    
    if (!loginForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginForm.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!loginForm.password.trim()) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegisterForm = (): boolean => {
    const errors: any = {};
    
    if (!registerForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerForm.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!registerForm.password.trim()) {
      errors.password = 'Password is required';
    } else if (registerForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(registerForm.password)) {
      errors.password = 'Password must contain at least one uppercase letter, lowercase letter, and number';
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!registerForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!registerForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!registerForm.organizationName.trim()) {
      errors.organizationName = 'Organization name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLoginForm()) return;
    
    try {
      await dispatch(loginUser({
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password,
      })).unwrap();
      
      // Success - navigation will be handled by the app navigator
      Alert.alert('Success', 'Login successful!');
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = async () => {
    if (!validateRegisterForm()) return;
    
    try {
      await dispatch(registerUser({
        email: registerForm.email.trim().toLowerCase(),
        password: registerForm.password,
        first_name: registerForm.firstName.trim(),
        last_name: registerForm.lastName.trim(),
        organization_name: registerForm.organizationName.trim(),
      })).unwrap();
      
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully. Please login with your credentials.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsLoginMode(true);
              setLoginForm({
                email: registerForm.email,
                password: '',
              });
              setRegisterForm({
                email: '',
                password: '',
                confirmPassword: '',
                firstName: '',
                lastName: '',
                organizationName: '',
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
    }
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormErrors({});
    dispatch(clearError());
  };

  const renderLoginForm = () => (
    <View style={styles.formContainer}>
      <TextInput
        label="Email"
        value={loginForm.email}
        onChangeText={(text) => setLoginForm({ ...loginForm, email: text })}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={!!formErrors.email}
        style={styles.input}
      />
      <HelperText type="error" visible={!!formErrors.email}>
        {formErrors.email}
      </HelperText>

      <TextInput
        label="Password"
        value={loginForm.password}
        onChangeText={(text) => setLoginForm({ ...loginForm, password: text })}
        mode="outlined"
        secureTextEntry={!showPassword}
        autoComplete="password"
        error={!!formErrors.password}
        style={styles.input}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off' : 'eye'}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />
      <HelperText type="error" visible={!!formErrors.password}>
        {formErrors.password}
      </HelperText>

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Login
      </Button>
    </View>
  );

  const renderRegisterForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.nameRow}>
        <View style={styles.nameInput}>
          <TextInput
            label="First Name"
            value={registerForm.firstName}
            onChangeText={(text) => setRegisterForm({ ...registerForm, firstName: text })}
            mode="outlined"
            autoComplete="given-name"
            error={!!formErrors.firstName}
          />
          <HelperText type="error" visible={!!formErrors.firstName}>
            {formErrors.firstName}
          </HelperText>
        </View>
        
        <View style={styles.nameInput}>
          <TextInput
            label="Last Name"
            value={registerForm.lastName}
            onChangeText={(text) => setRegisterForm({ ...registerForm, lastName: text })}
            mode="outlined"
            autoComplete="family-name"
            error={!!formErrors.lastName}
          />
          <HelperText type="error" visible={!!formErrors.lastName}>
            {formErrors.lastName}
          </HelperText>
        </View>
      </View>

      <TextInput
        label="Organization Name"
        value={registerForm.organizationName}
        onChangeText={(text) => setRegisterForm({ ...registerForm, organizationName: text })}
        mode="outlined"
        autoComplete="organization"
        error={!!formErrors.organizationName}
        style={styles.input}
      />
      <HelperText type="error" visible={!!formErrors.organizationName}>
        {formErrors.organizationName}
      </HelperText>

      <TextInput
        label="Email"
        value={registerForm.email}
        onChangeText={(text) => setRegisterForm({ ...registerForm, email: text })}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={!!formErrors.email}
        style={styles.input}
      />
      <HelperText type="error" visible={!!formErrors.email}>
        {formErrors.email}
      </HelperText>

      <TextInput
        label="Password"
        value={registerForm.password}
        onChangeText={(text) => setRegisterForm({ ...registerForm, password: text })}
        mode="outlined"
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        error={!!formErrors.password}
        style={styles.input}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off' : 'eye'}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />
      <HelperText type="error" visible={!!formErrors.password}>
        {formErrors.password}
      </HelperText>

      <TextInput
        label="Confirm Password"
        value={registerForm.confirmPassword}
        onChangeText={(text) => setRegisterForm({ ...registerForm, confirmPassword: text })}
        mode="outlined"
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        error={!!formErrors.confirmPassword}
        style={styles.input}
      />
      <HelperText type="error" visible={!!formErrors.confirmPassword}>
        {formErrors.confirmPassword}
      </HelperText>

      <Button
        mode="contained"
        onPress={handleRegister}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Create Account
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Surface style={styles.surface}>
            <View style={styles.header}>
              <Title style={styles.title}>Nellie</Title>
              <Paragraph style={styles.subtitle}>
                Social Media Management Made Simple
              </Paragraph>
            </View>

            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.tabContainer}>
                  <Button
                    mode={isLoginMode ? 'contained' : 'outlined'}
                    onPress={() => setIsLoginMode(true)}
                    style={[styles.tab, isLoginMode && styles.activeTab]}
                    compact
                  >
                    Login
                  </Button>
                  <Button
                    mode={!isLoginMode ? 'contained' : 'outlined'}
                    onPress={() => setIsLoginMode(false)}
                    style={[styles.tab, !isLoginMode && styles.activeTab]}
                    compact
                  >
                    Register
                  </Button>
                </View>

                {error && (
                  <Surface style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </Surface>
                )}

                {isLoginMode ? renderLoginForm() : renderRegisterForm()}

                <Divider style={styles.divider} />

                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>
                    {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
                  </Text>
                  <Button mode="text" onPress={switchMode} compact>
                    {isLoginMode ? 'Sign Up' : 'Sign In'}
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {!isLoginMode && (
              <View style={styles.footer}>
                <Paragraph style={styles.footerText}>
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                  Your organization will be set up with you as the primary administrator.
                </Paragraph>
              </View>
            )}
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  surface: {
    borderRadius: 12,
    elevation: 4,
    backgroundColor: 'white',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    borderRadius: 0,
  },
  activeTab: {
    elevation: 2,
  },
  formContainer: {
    marginTop: 16,
  },
  input: {
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nameInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  divider: {
    marginVertical: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchText: {
    color: '#666',
    fontSize: 14,
  },
  footer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen; 