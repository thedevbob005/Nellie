// Nellie Redux Store Configuration
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import clientsSlice from './slices/clientsSlice';
import postsSlice from './slices/postsSlice';
import socialAccountsSlice from './slices/socialAccountsSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    clients: clientsSlice,
    posts: postsSlice,
    socialAccounts: socialAccountsSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: __DEV__,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 