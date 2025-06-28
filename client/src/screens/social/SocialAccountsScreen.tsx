import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState } from '../../store';
import { 
  fetchSocialAccounts, 
  connectSocialAccount, 
  disconnectSocialAccount,
  testSocialConnection,
  refreshSocialToken 
} from '../../store/slices/socialAccountsSlice';
import { SocialAccount, Client } from '../../types';
import SocialAccountCard from '../../components/social/SocialAccountCard';
import ConnectAccountModal from '../../components/social/ConnectAccountModal';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const PLATFORM_COLORS = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  threads: '#000000',
};

const PLATFORM_ICONS = {
  facebook: 'facebook',
  instagram: 'photo-camera',
  twitter: 'flutter-dash',
  linkedin: 'business',
  youtube: 'play-circle-outline',
  threads: 'forum',
};

interface SocialAccountsScreenProps {
  navigation: any;
  route?: {
    params?: {
      clientId?: number;
    };
  };
}

const SocialAccountsScreen: React.FC<SocialAccountsScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const dispatch = useDispatch();
  const { 
    accounts, 
    loading, 
    error, 
    connectionTests,
    oauthUrls 
  } = useSelector((state: RootState) => state.socialAccounts);
  
  const { clients } = useSelector((state: RootState) => state.clients);
  
  const [selectedClient, setSelectedClient] = useState<number | null>(
    route?.params?.clientId || null
  );
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showClientSelector, setShowClientSelector] = useState(false);

  // Filter accounts by selected client
  const filteredAccounts = selectedClient 
    ? accounts.filter(account => account.client_id === selectedClient)
    : accounts;

  // Group accounts by client
  const accountsByClient = accounts.reduce((acc, account) => {
    if (!acc[account.client_id]) {
      acc[account.client_id] = [];
    }
    acc[account.client_id].push(account);
    return acc;
  }, {} as Record<number, SocialAccount[]>);

  // Available platforms for connecting
  const availablePlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'threads'];

  useFocusEffect(
    useCallback(() => {
      loadSocialAccounts();
    }, [selectedClient])
  );

  const loadSocialAccounts = async () => {
    try {
      if (selectedClient) {
        await dispatch(fetchSocialAccounts({ client_id: selectedClient }) as any);
      } else {
        await dispatch(fetchSocialAccounts({}) as any);
      }
    } catch (error) {
      console.error('Failed to load social accounts:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSocialAccounts();
    setRefreshing(false);
  };

  const handleConnectAccount = (platform: string) => {
    if (!selectedClient) {
      Alert.alert(
        'Select Client',
        'Please select a client first to connect social media accounts.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setSelectedPlatform(platform);
    setShowConnectModal(true);
  };

  const handleOAuthConnect = async (platform: string, clientId: number) => {
    try {
      const result = await dispatch(connectSocialAccount({
        platform,
        client_id: clientId
      }) as any);

      if (result.payload?.oauth_url) {
        const supported = await Linking.canOpenURL(result.payload.oauth_url);
        if (supported) {
          await Linking.openURL(result.payload.oauth_url);
        } else {
          Alert.alert(
            'Cannot Open URL',
            'Unable to open the authentication page. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      Alert.alert(
        'Connection Failed', 
        'Failed to initiate OAuth connection. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setShowConnectModal(false);
      setSelectedPlatform(null);
    }
  };

  const handleDisconnectAccount = (accountId: number, platform: string) => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect this ${platform} account? This will stop all posting to this account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(disconnectSocialAccount(accountId) as any);
              await loadSocialAccounts();
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to disconnect account. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleTestConnection = async (accountId: number) => {
    try {
      await dispatch(testSocialConnection(accountId) as any);
    } catch (error) {
      Alert.alert(
        'Test Failed',
        'Connection test failed. Please check your account settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRefreshToken = async (accountId: number) => {
    try {
      await dispatch(refreshSocialToken(accountId) as any);
      await loadSocialAccounts();
    } catch (error) {
      Alert.alert(
        'Refresh Failed',
        'Failed to refresh access token. You may need to reconnect this account.',
        [{ text: 'OK' }]
      );
    }
  };

  const getClientName = (clientId: number): string => {
    const client = clients.find((c: Client) => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getConnectedPlatforms = (clientId: number): string[] => {
    return accountsByClient[clientId]?.map(acc => acc.platform) || [];
  };

  const renderClientSelector = () => (
    <View style={styles.clientSelector}>
      <TouchableOpacity
        style={styles.clientSelectorButton}
        onPress={() => setShowClientSelector(true)}
      >
        <Text style={styles.clientSelectorText}>
          {selectedClient ? getClientName(selectedClient) : 'All Clients'}
        </Text>
        <Icon name="arrow-drop-down" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderClientSelectorModal = () => (
    <Modal
      visible={showClientSelector}
      transparent
      animationType="fade"
      onRequestClose={() => setShowClientSelector(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowClientSelector(false)}
      >
        <View style={styles.clientSelectorModal}>
          <Text style={styles.modalTitle}>Select Client</Text>
          
          <TouchableOpacity
            style={[
              styles.clientOption,
              !selectedClient && styles.clientOptionSelected
            ]}
            onPress={() => {
              setSelectedClient(null);
              setShowClientSelector(false);
            }}
          >
            <Text style={styles.clientOptionText}>All Clients</Text>
          </TouchableOpacity>

          {clients.map((client: Client) => (
            <TouchableOpacity
              key={client.id}
              style={[
                styles.clientOption,
                selectedClient === client.id && styles.clientOptionSelected
              ]}
              onPress={() => {
                setSelectedClient(client.id);
                setShowClientSelector(false);
              }}
            >
              <Text style={styles.clientOptionText}>{client.name}</Text>
              <Text style={styles.platformCount}>
                {getConnectedPlatforms(client.id).length} platforms
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderConnectButton = () => {
    if (!selectedClient) return null;

    const connectedPlatforms = getConnectedPlatforms(selectedClient);
    const availableToConnect = availablePlatforms.filter(
      platform => !connectedPlatforms.includes(platform)
    );

    if (availableToConnect.length === 0) {
      return (
        <View style={styles.allConnectedContainer}>
          <Icon name="check-circle" size={24} color="#4CAF50" />
          <Text style={styles.allConnectedText}>
            All platforms connected for {getClientName(selectedClient)}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.connectButtonContainer}>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => setShowConnectModal(true)}
        >
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.connectButtonText}>Connect Account</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSocialAccountsList = () => {
    if (selectedClient) {
      // Show accounts for selected client
      const clientAccounts = accountsByClient[selectedClient] || [];
      
      return (
        <View style={styles.accountsContainer}>
          <Text style={styles.sectionTitle}>
            Connected Accounts - {getClientName(selectedClient)}
          </Text>
          
          {clientAccounts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="link-off" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No accounts connected</Text>
              <Text style={styles.emptySubtext}>
                Connect social media accounts to start posting
              </Text>
            </View>
          ) : (
            clientAccounts.map((account) => (
              <SocialAccountCard
                key={account.id}
                account={account}
                onDisconnect={handleDisconnectAccount}
                onTestConnection={handleTestConnection}
                onRefreshToken={handleRefreshToken}
                connectionStatus={connectionTests[account.id]}
              />
            ))
          )}
        </View>
      );
    } else {
      // Show accounts grouped by client
      return (
        <View style={styles.accountsContainer}>
          {Object.entries(accountsByClient).map(([clientId, clientAccounts]) => (
            <View key={clientId} style={styles.clientGroup}>
              <Text style={styles.clientGroupTitle}>
                {getClientName(parseInt(clientId))}
              </Text>
              
              {clientAccounts.map((account) => (
                <SocialAccountCard
                  key={account.id}
                  account={account}
                  onDisconnect={handleDisconnectAccount}
                  onTestConnection={handleTestConnection}
                  onRefreshToken={handleRefreshToken}
                  connectionStatus={connectionTests[account.id]}
                />
              ))}
            </View>
          ))}

          {Object.keys(accountsByClient).length === 0 && (
            <View style={styles.emptyContainer}>
              <Icon name="link-off" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No accounts connected</Text>
              <Text style={styles.emptySubtext}>
                Select a client and connect social media accounts to start posting
              </Text>
            </View>
          )}
        </View>
      );
    }
  };

  if (loading.fetch && accounts.length === 0) {
    return <LoadingOverlay message="Loading social accounts..." />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Social Accounts</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Icon 
              name="refresh" 
              size={24} 
              color={refreshing ? "#ccc" : "#333"} 
            />
          </TouchableOpacity>
        </View>

        {renderClientSelector()}
        {renderConnectButton()}

        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {renderSocialAccountsList()}
        </ScrollView>

        <ConnectAccountModal
          visible={showConnectModal}
          clientId={selectedClient}
          connectedPlatforms={selectedClient ? getConnectedPlatforms(selectedClient) : []}
          onConnect={handleOAuthConnect}
          onClose={() => {
            setShowConnectModal(false);
            setSelectedPlatform(null);
          }}
        />

        {renderClientSelectorModal()}

        {error && (
          <View style={styles.errorContainer}>
            <Icon name="error" size={20} color="#f44336" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </SafeAreaView>
    </ErrorBoundary>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  clientSelector: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  clientSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  clientSelectorText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  connectButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  allConnectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  allConnectedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  accountsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  clientGroup: {
    marginBottom: 24,
  },
  clientGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientSelectorModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  clientOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  clientOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  clientOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  platformCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});

export default SocialAccountsScreen; 