import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PLATFORM_INFO = {
  facebook: {
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    description: 'Connect your Facebook page to post updates, images, and videos.',
    instructions: [
      'Click "Connect Facebook" below',
      'Log in to your Facebook account',
      'Grant permissions to Nellie',
      'Select the page you want to manage',
      'Complete the connection process'
    ],
    permissions: [
      'Post on your behalf',
      'Read page information',
      'Access page insights',
      'Manage page posts'
    ]
  },
  instagram: {
    name: 'Instagram',
    icon: 'photo-camera',
    color: '#E4405F',
    description: 'Connect your Instagram business account for posts, stories, and reels.',
    instructions: [
      'Click "Connect Instagram" below',
      'Log in to your Facebook account',
      'Select your Instagram business account',
      'Grant required permissions',
      'Complete the connection process'
    ],
    permissions: [
      'Post content on your behalf',
      'Read account information',
      'Access post insights',
      'Manage Instagram content'
    ]
  },
  twitter: {
    name: 'X (Twitter)',
    icon: 'flutter-dash',
    color: '#1DA1F2',
    description: 'Connect your X account to post tweets, images, and threads.',
    instructions: [
      'Click "Connect X" below',
      'Log in to your X account',
      'Authorize Nellie to access your account',
      'Grant posting permissions',
      'Complete the connection process'
    ],
    permissions: [
      'Post tweets on your behalf',
      'Read account information',
      'Access tweet metrics',
      'Manage your content'
    ]
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'business',
    color: '#0A66C2',
    description: 'Connect your LinkedIn profile or company page for professional posts.',
    instructions: [
      'Click "Connect LinkedIn" below',
      'Log in to your LinkedIn account',
      'Choose personal or company account',
      'Grant required permissions',
      'Complete the connection process'
    ],
    permissions: [
      'Post on your behalf',
      'Read profile information',
      'Access post analytics',
      'Manage content'
    ]
  },
  youtube: {
    name: 'YouTube',
    icon: 'play-circle-outline',
    color: '#FF0000',
    description: 'Connect your YouTube channel to upload videos and manage content.',
    instructions: [
      'Click "Connect YouTube" below',
      'Log in to your Google account',
      'Select your YouTube channel',
      'Grant upload permissions',
      'Complete the connection process'
    ],
    permissions: [
      'Upload videos on your behalf',
      'Read channel information',
      'Access video analytics',
      'Manage channel content'
    ]
  },
  threads: {
    name: 'Threads',
    icon: 'forum',
    color: '#000000',
    description: 'Connect your Threads account for text posts and media sharing.',
    instructions: [
      'Click "Connect Threads" below',
      'Log in to your Meta account',
      'Select your Threads profile',
      'Grant posting permissions',
      'Complete the connection process'
    ],
    permissions: [
      'Post on your behalf',
      'Read profile information',
      'Access post insights',
      'Manage Threads content'
    ]
  }
};

interface ConnectAccountModalProps {
  visible: boolean;
  clientId: number | null;
  connectedPlatforms: string[];
  onConnect: (platform: string, clientId: number) => Promise<void>;
  onClose: () => void;
}

const ConnectAccountModal: React.FC<ConnectAccountModalProps> = ({
  visible,
  clientId,
  connectedPlatforms,
  onConnect,
  onClose,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Get available platforms (not yet connected)
  const availablePlatforms = Object.keys(PLATFORM_INFO).filter(
    platform => !connectedPlatforms.includes(platform)
  );

  const handleConnect = async (platform: string) => {
    if (!clientId) {
      Alert.alert('Error', 'No client selected');
      return;
    }

    setConnecting(true);
    try {
      await onConnect(platform, clientId);
    } catch (error) {
      console.error('Connection failed:', error);
      Alert.alert(
        'Connection Failed',
        'Failed to connect to ' + PLATFORM_INFO[platform]?.name + '. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setConnecting(false);
    }
  };

  const renderPlatformSelection = () => (
    <View style={styles.platformSelection}>
      <Text style={styles.modalTitle}>Connect Social Account</Text>
      <Text style={styles.modalSubtitle}>
        Choose a platform to connect for this client
      </Text>

      {availablePlatforms.length === 0 ? (
        <View style={styles.noPlatformsContainer}>
          <Icon name="check-circle" size={64} color="#4CAF50" />
          <Text style={styles.noPlatformsText}>All Platforms Connected!</Text>
          <Text style={styles.noPlatformsSubtext}>
            This client has connected all available social media platforms.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.platformList} showsVerticalScrollIndicator={false}>
          {availablePlatforms.map((platform) => {
            const info = PLATFORM_INFO[platform];
            return (
              <TouchableOpacity
                key={platform}
                style={[styles.platformCard, { borderLeftColor: info.color }]}
                onPress={() => {
                  setSelectedPlatform(platform);
                  setShowInstructions(true);
                }}
              >
                <View style={styles.platformCardContent}>
                  <View style={[styles.platformCardIcon, { backgroundColor: info.color }]}>
                    <Icon name={info.icon} size={24} color="#fff" />
                  </View>
                  
                  <View style={styles.platformCardInfo}>
                    <Text style={styles.platformCardName}>{info.name}</Text>
                    <Text style={styles.platformCardDescription}>
                      {info.description}
                    </Text>
                  </View>
                  
                  <Icon name="arrow-forward-ios" size={16} color="#ccc" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const renderInstructions = () => {
    if (!selectedPlatform) return null;
    
    const info = PLATFORM_INFO[selectedPlatform];
    
    return (
      <View style={styles.instructionsContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setShowInstructions(false);
            setSelectedPlatform(null);
          }}
        >
          <Icon name="arrow-back" size={24} color="#333" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.instructionsHeader}>
          <View style={[styles.instructionsPlatformIcon, { backgroundColor: info.color }]}>
            <Icon name={info.icon} size={32} color="#fff" />
          </View>
          <Text style={styles.instructionsTitle}>Connect {info.name}</Text>
          <Text style={styles.instructionsSubtitle}>{info.description}</Text>
        </View>

        <ScrollView style={styles.instructionsContent} showsVerticalScrollIndicator={false}>
          <View style={styles.instructionsSection}>
            <Text style={styles.sectionTitle}>How to Connect:</Text>
            {info.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{instruction}</Text>
              </View>
            ))}
          </View>

          <View style={styles.instructionsSection}>
            <Text style={styles.sectionTitle}>Permissions Required:</Text>
            {info.permissions.map((permission, index) => (
              <View key={index} style={styles.permissionItem}>
                <Icon name="check" size={16} color="#4CAF50" />
                <Text style={styles.permissionText}>{permission}</Text>
              </View>
            ))}
          </View>

          <View style={styles.securityNote}>
            <Icon name="security" size={20} color="#2196F3" />
            <Text style={styles.securityNoteText}>
              Your account credentials are never stored by Nellie. We only receive 
              secure access tokens that you can revoke at any time.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.connectButtonContainer}>
          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: info.color }]}
            onPress={() => handleConnect(selectedPlatform)}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name={info.icon} size={20} color="#fff" />
                <Text style={styles.connectButtonText}>
                  Connect {info.name}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          {showInstructions && (
            <Text style={styles.headerTitle}>
              {selectedPlatform ? PLATFORM_INFO[selectedPlatform]?.name : ''}
            </Text>
          )}
        </View>

        {showInstructions ? renderInstructions() : renderPlatformSelection()}
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
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  platformSelection: {
    flex: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  platformList: {
    flex: 1,
  },
  platformCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  platformCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  platformCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  platformCardInfo: {
    flex: 1,
  },
  platformCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  platformCardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noPlatformsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  noPlatformsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noPlatformsSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  instructionsContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  instructionsHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  instructionsPlatformIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  instructionsSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  instructionsContent: {
    flex: 1,
    padding: 16,
  },
  instructionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  securityNoteText: {
    fontSize: 12,
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  connectButtonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ConnectAccountModal; 