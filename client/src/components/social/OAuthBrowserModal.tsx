import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface OAuthBrowserModalProps {
  visible: boolean;
  oauthUrl: string;
  platform: string;
  redirectUri: string;
  onSuccess: (code: string, state?: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const OAuthBrowserModal: React.FC<OAuthBrowserModalProps> = ({
  visible,
  oauthUrl,
  platform,
  redirectUri,
  onSuccess,
  onError,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PLATFORM_NAMES = {
    facebook: 'Facebook',
    instagram: 'Instagram', 
    twitter: 'X (Twitter)',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    threads: 'Threads',
  };

  const platformName = PLATFORM_NAMES[platform] || platform;

  const handleOpenInExternalBrowser = async () => {
    try {
      const supported = await Linking.canOpenURL(oauthUrl);
      if (supported) {
        await Linking.openURL(oauthUrl);
        onCancel();
      } else {
        Alert.alert('Error', 'Cannot open external browser');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open external browser');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onCancel}
          >
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.titleText}>Connect {platformName}</Text>
            <Text style={styles.subtitleText}>OAuth Authentication</Text>
          </View>

          <TouchableOpacity
            style={styles.externalBrowserButton}
            onPress={handleOpenInExternalBrowser}
          >
            <Icon name="open-in-browser" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.instructionsContainer}>
            <Icon name="security" size={64} color="#2196F3" />
            <Text style={styles.instructionsTitle}>Secure Authentication</Text>
            <Text style={styles.instructionsText}>
              You'll be redirected to {platformName} to complete the authentication process. 
              Your credentials are never stored by Nellie.
            </Text>
            
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleOpenInExternalBrowser}
            >
              <Icon name="open-in-browser" size={20} color="#fff" />
              <Text style={styles.continueButtonText}>
                Continue to {platformName}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subtitleText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  externalBrowserButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  instructionsContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OAuthBrowserModal; 