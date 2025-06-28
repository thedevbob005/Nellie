// UI Redux Slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LoadingState, ErrorState } from '../../types';

interface UiState {
  loading: LoadingState;
  errors: ErrorState;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
  theme: 'light' | 'dark';
  isConnected: boolean;
  currentScreen: string;
}

const initialState: UiState = {
  loading: {},
  errors: {},
  notifications: [],
  theme: 'light',
  isConnected: true,
  currentScreen: 'Dashboard',
};

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      const { key, isLoading } = action.payload;
      state.loading[key] = isLoading;
    },
    clearLoading: (state, action: PayloadAction<string>) => {
      delete state.loading[action.payload];
    },
    clearAllLoading: (state) => {
      state.loading = {};
    },
    setError: (state, action: PayloadAction<{ key: string; error: string }>) => {
      const { key, error } = action.payload;
      state.errors[key] = error;
    },
    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
    clearAllErrors: (state) => {
      state.errors = {};
    },
    addNotification: (state, action: PayloadAction<{
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
    }>) => {
      const notification = {
        id: Date.now().toString(),
        ...action.payload,
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setCurrentScreen: (state, action: PayloadAction<string>) => {
      state.currentScreen = action.payload;
    },
  },
});

export const {
  setLoading,
  clearLoading,
  clearAllLoading,
  setError,
  clearError,
  clearAllErrors,
  addNotification,
  removeNotification,
  clearAllNotifications,
  setTheme,
  setConnected,
  setCurrentScreen,
} = uiSlice.actions;

export default uiSlice.reducer; 