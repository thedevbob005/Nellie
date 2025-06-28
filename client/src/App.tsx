// Nellie Social Media Management - Main App Component
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './store';
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PaperProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </PaperProvider>
      </Provider>
    </GestureHandlerRootView>
  );
} 