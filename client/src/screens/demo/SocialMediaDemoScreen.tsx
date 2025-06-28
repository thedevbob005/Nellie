import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import SocialAccountCard from '../../components/social/SocialAccountCard';
import ConnectAccountModal from '../../components/social/ConnectAccountModal';
import ConnectionStatusIndicator from '../../components/social/ConnectionStatusIndicator';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import OAuthBrowserModal from '../../components/social/OAuthBrowserModal';

// Demo data
const DEMO_CLIENTS = [
  { id: 1, name: 'Acme Corp', platform_count: 3 },
  { id: 2, name: 'TechStart Inc', platform_count: 5 },
  { id: 3, name: 'Fashion Brand', platform_count: 2 },
];

const DEMO_SOCIAL_ACCOUNTS = [
  {
    id: 1,
    client_id: 1,
    platform: 'facebook',
    account_id: '12345678901234567',
    account_name: 'Acme Corp Official',
    access_token: 'demo_token',
    token_expires_at: '2024-12-31T23:59:59Z',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    is_active: true,
  },
  {
    id: 2,
    client_id: 1,
    platform: 'instagram',
    account_id: 'acme_corp_insta',
    account_name: '@acme_corp',
    access_token: 'demo_token',
    token_expires_at: '2024-02-15T10:30:00Z', // Expiring soon
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    is_active: true,
  },
  {
    id: 3,
    client_id: 1,
    platform: 'twitter',
    account_id: 'acme_corp_x',
    account_name: '@AcmeCorp',
    access_token: 'demo_token',
    token_expires_at: '2024-01-01T00:00:00Z', // Expired
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    is_active: true,
  },
  {
    id: 4,
    client_id: 2,
    platform: 'linkedin',
    account_id: 'techstart-inc',
    account_name: 'TechStart Inc',
    access_token: 'demo_token',
    token_expires_at: '2024-12-31T23:59:59Z',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    is_active: true,
  },
  {
    id: 5,
    client_id: 2,
    platform: 'youtube',
    account_id: 'techstart_channel',
    account_name: 'TechStart Channel',
    access_token: 'demo_token',
    token_expires_at: '2024-12-31T23:59:59Z',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    is_active: true,
  },
];

const DEMO_CONNECTION_TESTS = {
  1: { status: 'connected', tested_at: '2024-01-20T14:30:00Z', message: 'All good!' },
  2: { status: 'warning', tested_at: '2024-01-20T14:25:00Z', message: 'Token expires soon' },
  3: { status: 'error', tested_at: '2024-01-20T14:20:00Z', message: 'Token expired' },
  4: { status: 'connected', tested_at: '2024-01-20T14:35:00Z', message: 'Working perfectly' },
  5: { status: 'testing', tested_at: '2024-01-20T14:40:00Z', message: 'Testing connection...' },
};

interface SocialMediaDemoScreenProps {
  navigation: any;
}

const SocialMediaDemoScreen: React.FC<SocialMediaDemoScreenProps> = ({ navigation }) => {
  const [selectedClient, setSelectedClient] = useState<number>(1);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionTests, setConnectionTests] = useState(DEMO_CONNECTION_TESTS);

  const selectedClientData = DEMO_CLIENTS.find(c => c.id === selectedClient);
  const clientAccounts = DEMO_SOCIAL_ACCOUNTS.filter(acc => acc.client_id === selectedClient);
  const connectedPlatforms = clientAccounts.map(acc => acc.platform);

  const handleTestConnection = async (accountId: number) => {
    setConnectionTests(prev => ({
      ...prev,
      [accountId]: { status: 'testing', tested_at: new Date().toISOString(), message: 'Testing...' }
    }));

    // Simulate API call
    setTimeout(() => {
      const randomStatus = Math.random() > 0.7 ? 'error' : 'connected';
      setConnectionTests(prev => ({
        ...prev,
        [accountId]: {
          status: randomStatus,
          tested_at: new Date().toISOString(),
          message: randomStatus === 'connected' ? 'Connection successful!' : 'Connection failed'
        }
      }));
    }, 2000);
  };

  const handleRefreshToken = async (accountId: number) => {
    Alert.alert(
      'Refresh Token',
      'In a real app, this would refresh the OAuth token for this account.',
      [{ text: 'OK' }]
    );
  };

  const handleDisconnectAccount = (accountId: number, platform: string) => {
    Alert.alert(
      'Account Disconnected',
      `${platform} account has been disconnected (demo).`,
      [{ text: 'OK' }]
    );
  };

  const handleOAuthConnect = async (platform: string, clientId: number) => {
    setSelectedPlatform(platform);
    setShowConnectModal(false);
    setShowOAuthModal(true);
  };

  const handleOAuthSuccess = (code: string, state?: string) => {
    setShowOAuthModal(false);
    Alert.alert(
      'Connection Successful!',
      `OAuth code received: ${code.substring(0, 20)}...\nIn a real app, this would complete the account connection.`,
      [{ text: 'OK' }]
    );
  };

  const handleOAuthError = (error: string) => {
    setShowOAuthModal(false);
    Alert.alert('OAuth Error', error, [{ text: 'OK' }]);
  };

  const handleOAuthCancel = () => {
    setShowOAuthModal(false);
  };

  const renderClientSelector = () => (
    <View style={styles.clientSelector}>
      <Text style={styles.sectionTitle}>Select Client:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientScrollView}>
        {DEMO_CLIENTS.map((client) => (
          <TouchableOpacity
            key={client.id}
            style={[
              styles.clientCard,
              selectedClient === client.id && styles.clientCardSelected
            ]}
            onPress={() => setSelectedClient(client.id)}
          >
            <Text style={[
              styles.clientName,
              selectedClient === client.id && styles.clientNameSelected
            ]}>
              {client.name}
            </Text>
            <Text style={styles.platformCount}>
              {client.platform_count} platforms
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStatusIndicators = () => (
    <View style={styles.statusSection}>
      <Text style={styles.sectionTitle}>Connection Status Overview:</Text>
      <View style={styles.statusGrid}>
        {clientAccounts.map((account) => (
          <ConnectionStatusIndicator
            key={account.id}
            status={connectionTests[account.id]?.status || 'unknown'}
            platform={account.platform}
            accountName={account.account_name}
            lastChecked={connectionTests[account.id]?.tested_at}
            onTest={() => handleTestConnection(account.id)}
            onRefresh={() => handleRefreshToken(account.id)}
            compact={true}
            animated={true}
          />
        ))}
      </View>
    </View>
  );

  const renderSocialAccountCards = () => (
    <View style={styles.accountsSection}>
      <Text style={styles.sectionTitle}>
        Connected Accounts - {selectedClientData?.name}
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

      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => setShowConnectModal(true)}
      >
        <Icon name="add" size={24} color="#fff" />
        <Text style={styles.connectButtonText}>Connect New Account</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFeatureHighlights = () => (
    <View style={styles.featuresSection}>
      <Text style={styles.sectionTitle}>✨ Featured Capabilities:</Text>
      
      <View style={styles.featureCard}>
        <Icon name="security" size={24} color="#4CAF50" />
        <Text style={styles.featureTitle}>Secure OAuth Integration</Text>
        <Text style={styles.featureDescription}>
          Seamless authentication flows for all 6 social media platforms
        </Text>
      </View>

      <View style={styles.featureCard}>
        <Icon name="wifi-tethering" size={24} color="#2196F3" />
        <Text style={styles.featureTitle}>Real-time Connection Testing</Text>
        <Text style={styles.featureDescription}>
          Live status monitoring with automatic token refresh
        </Text>
      </View>

      <View style={styles.featureCard}>
        <Icon name="error-outline" size={24} color="#ff9800" />
        <Text style={styles.featureTitle}>Intelligent Error Recovery</Text>
        <Text style={styles.featureDescription}>
          User-friendly error handling with guided recovery steps
        </Text>
      </View>

      <View style={styles.featureCard}>
        <Icon name="devices" size={24} color="#9C27B0" />
        <Text style={styles.featureTitle}>Cross-Platform Publishing</Text>
        <Text style={styles.featureDescription}>
          Facebook, Instagram, X, LinkedIn, YouTube, Threads support
        </Text>
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Social Media Demo</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {renderClientSelector()}
          {renderStatusIndicators()}
          {renderSocialAccountCards()}
          {renderFeatureHighlights()}
        </ScrollView>

        <ConnectAccountModal
          visible={showConnectModal}
          clientId={selectedClient}
          connectedPlatforms={connectedPlatforms}
          onConnect={handleOAuthConnect}
          onClose={() => setShowConnectModal(false)}
        />

        <OAuthBrowserModal
          visible={showOAuthModal}
          oauthUrl={`https://example.com/oauth/${selectedPlatform}?demo=true`}
          platform={selectedPlatform}
          redirectUri="https://app.nellie.com/oauth/callback"
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
          onCancel={handleOAuthCancel}
        />

        {isLoading && <LoadingOverlay message="Processing..." />}
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
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  clientSelector: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  clientScrollView: {
    marginTop: 12,
  },
  clientCard: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  clientCardSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  clientNameSelected: {
    color: '#2196F3',
  },
  platformCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  accountsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  featuresSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    marginLeft: 12,
    flex: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
});

export default SocialMediaDemoScreen; 