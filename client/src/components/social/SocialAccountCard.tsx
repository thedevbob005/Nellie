import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SocialAccount } from '../../types';

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

interface ConnectionStatus {
  status: 'testing' | 'connected' | 'disconnected' | 'error' | 'token_expired';
  message?: string;
  tested_at?: string;
}

interface SocialAccountCardProps {
  account: SocialAccount;
  onDisconnect: (accountId: number, platform: string) => void;
  onTestConnection: (accountId: number) => void;
  onRefreshToken: (accountId: number) => void;
  connectionStatus?: ConnectionStatus;
}

const SocialAccountCard: React.FC<SocialAccountCardProps> = ({
  account,
  onDisconnect,
  onTestConnection,
  onRefreshToken,
  connectionStatus,
}) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

  const platformColor = PLATFORM_COLORS[account.platform] || '#666';
  const platformIcon = PLATFORM_ICONS[account.platform] || 'link';

  // Check if token is expired or about to expire
  const isTokenExpired = () => {
    if (!account.token_expires_at) return false;
    
    const expiryDate = new Date(account.token_expires_at);
    const now = new Date();
    const timeDiff = expiryDate.getTime() - now.getTime();
    const hoursUntilExpiry = timeDiff / (1000 * 3600);
    
    return hoursUntilExpiry <= 0;
  };

  const isTokenExpiringSoon = () => {
    if (!account.token_expires_at) return false;
    
    const expiryDate = new Date(account.token_expires_at);
    const now = new Date();
    const timeDiff = expiryDate.getTime() - now.getTime();
    const hoursUntilExpiry = timeDiff / (1000 * 3600);
    
    return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24;
  };

  const getConnectionStatusInfo = () => {
    if (isTokenExpired()) {
      return {
        status: 'error',
        icon: 'error',
        color: '#f44336',
        text: 'Token Expired',
        subtext: 'Refresh token required',
      };
    }

    if (isTokenExpiringSoon()) {
      return {
        status: 'warning',
        icon: 'warning',
        color: '#ff9800',
        text: 'Token Expiring',
        subtext: 'Expires within 24 hours',
      };
    }

    if (connectionStatus?.status === 'testing') {
      return {
        status: 'testing',
        icon: 'sync',
        color: '#2196F3',
        text: 'Testing...',
        subtext: 'Checking connection',
      };
    }

    if (connectionStatus?.status === 'error') {
      return {
        status: 'error',
        icon: 'error',
        color: '#f44336',
        text: 'Connection Failed',
        subtext: connectionStatus.message || 'Unable to connect',
      };
    }

    if (connectionStatus?.status === 'connected') {
      return {
        status: 'connected',
        icon: 'check-circle',
        color: '#4CAF50',
        text: 'Connected',
        subtext: connectionStatus.tested_at 
          ? `Tested ${formatTimeAgo(connectionStatus.tested_at)}`
          : 'Connection verified',
      };
    }

    // Default status
    return {
      status: 'unknown',
      icon: 'help',
      color: '#666',
      text: 'Unknown',
      subtext: 'Test connection to verify',
    };
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatExpiryDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPlatformDisplayName = (platform: string): string => {
    const names = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      twitter: 'X (Twitter)',
      linkedin: 'LinkedIn',
      youtube: 'YouTube',
      threads: 'Threads',
    };
    return names[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await onTestConnection(account.id);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleRefreshToken = async () => {
    setIsRefreshingToken(true);
    try {
      await onRefreshToken(account.id);
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect ${account.account_name} (${getPlatformDisplayName(account.platform)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => onDisconnect(account.id, account.platform),
        },
      ]
    );
  };

  const statusInfo = getConnectionStatusInfo();

  return (
    <View style={[styles.container, { borderLeftColor: platformColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.platformInfo}>
          <View style={[styles.platformIcon, { backgroundColor: platformColor }]}>
            <Icon name={platformIcon} size={20} color="#fff" />
          </View>
          
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{account.account_name}</Text>
            <Text style={styles.platformName}>
              {getPlatformDisplayName(account.platform)}
            </Text>
          </View>
        </View>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          {statusInfo.status === 'testing' ? (
            <ActivityIndicator size="small" color={statusInfo.color} />
          ) : (
            <Icon name={statusInfo.icon} size={20} color={statusInfo.color} />
          )}
          <View style={styles.statusText}>
            <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
            <Text style={styles.statusSubtext}>{statusInfo.subtext}</Text>
          </View>
        </View>
      </View>

      {/* Account Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Account ID:</Text>
          <Text style={styles.detailValue}>{account.account_id}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Connected:</Text>
          <Text style={styles.detailValue}>
            {formatTimeAgo(account.created_at)}
          </Text>
        </View>

        {account.token_expires_at && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Token Expires:</Text>
            <Text style={[
              styles.detailValue,
              (isTokenExpired() || isTokenExpiringSoon()) && styles.expiryWarning
            ]}>
              {formatExpiryDate(account.token_expires_at)}
            </Text>
          </View>
        )}

        {account.account_data && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Additional Info:</Text>
            <Text style={styles.detailValue}>
              {typeof account.account_data === 'object' 
                ? Object.keys(account.account_data).join(', ')
                : 'Available'
              }
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.testButton]}
          onPress={handleTestConnection}
          disabled={isTestingConnection}
        >
          {isTestingConnection ? (
            <ActivityIndicator size="small" color="#2196F3" />
          ) : (
            <>
              <Icon name="wifi-tethering" size={18} color="#2196F3" />
              <Text style={[styles.actionText, { color: '#2196F3' }]}>
                Test
              </Text>
            </>
          )}
        </TouchableOpacity>

        {(isTokenExpired() || isTokenExpiringSoon()) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.refreshButton]}
            onPress={handleRefreshToken}
            disabled={isRefreshingToken}
          >
            {isRefreshingToken ? (
              <ActivityIndicator size="small" color="#ff9800" />
            ) : (
              <>
                <Icon name="refresh" size={18} color="#ff9800" />
                <Text style={[styles.actionText, { color: '#ff9800' }]}>
                  Refresh
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.disconnectButton]}
          onPress={handleDisconnect}
        >
          <Icon name="link-off" size={18} color="#f44336" />
          <Text style={[styles.actionText, { color: '#f44336' }]}>
            Disconnect
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  platformName: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 1,
  },
  details: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  expiryWarning: {
    color: '#f44336',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  testButton: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  refreshButton: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
  },
  disconnectButton: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    marginLeft: 'auto',
    marginRight: 0,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default SocialAccountCard; 