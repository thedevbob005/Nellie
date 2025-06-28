import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';

interface LoadingOverlayProps {
  visible?: boolean;
  message?: string;
  transparent?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible = true,
  message = 'Loading...',
  transparent = false,
}) => {
  if (!visible) return null;

  const content = (
    <View style={[styles.container, transparent && styles.transparentContainer]}>
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );

  if (transparent) {
    return content;
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
    >
      {content}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  transparentContainer: {
    backgroundColor: '#f5f5f5',
  },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default LoadingOverlay; 