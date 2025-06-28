// Social Accounts Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../services/api';
import { RootState } from '../index';

// Types
export interface SocialAccount {
  id: number;
  client_id: number;
  platform: 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'threads' | 'linkedin';
  account_id: string;
  account_name: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  account_data?: any;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  client?: {
    id: number;
    name: string;
  };
}

export interface OAuthInitResponse {
  auth_url: string;
  platform: string;
  client_id: number;
}

export interface ConnectionTest {
  is_valid: boolean;
  platform: string;
  account_name: string;
  message: string;
}

interface SocialAccountsState {
  accounts: SocialAccount[];
  currentAccount: SocialAccount | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  oauthUrl: string | null;
  connectionTests: { [accountId: number]: ConnectionTest };
}

const initialState: SocialAccountsState = {
  accounts: [],
  currentAccount: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  oauthUrl: null,
  connectionTests: {},
};

// Async Thunks
export const fetchSocialAccounts = createAsyncThunk(
  'socialAccounts/fetchSocialAccounts',
  async (params?: { client_id?: number; page?: number; limit?: number }) => {
    const response = await apiService.getSocialAccounts(params);
    return response.data;
  }
);

export const fetchSocialAccount = createAsyncThunk(
  'socialAccounts/fetchSocialAccount',
  async (id: number) => {
    const response = await apiService.getSocialAccount(id);
    return response.data;
  }
);

export const connectSocialAccount = createAsyncThunk(
  'socialAccounts/connectSocialAccount',
  async (accountData: {
    client_id: number;
    platform: string;
    account_id: string;
    account_name: string;
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: string;
    account_data?: any;
  }) => {
    const response = await apiService.connectSocialAccount(accountData);
    return response.data;
  }
);

export const updateSocialAccount = createAsyncThunk(
  'socialAccounts/updateSocialAccount',
  async ({ id, data }: { id: number; data: any }) => {
    const response = await apiService.updateSocialAccount(id, data);
    return response.data;
  }
);

export const deleteSocialAccount = createAsyncThunk(
  'socialAccounts/deleteSocialAccount',
  async (id: number) => {
    await apiService.deleteSocialAccount(id);
    return id;
  }
);

export const refreshSocialToken = createAsyncThunk(
  'socialAccounts/refreshSocialToken',
  async (id: number) => {
    const response = await apiService.refreshSocialToken(id);
    return response.data;
  }
);

export const testSocialConnection = createAsyncThunk(
  'socialAccounts/testSocialConnection',
  async (id: number) => {
    const response = await apiService.testSocialConnection(id);
    return { accountId: id, result: response.data };
  }
);

export const initOAuth = createAsyncThunk(
  'socialAccounts/initOAuth',
  async ({ platform, clientId }: { platform: string; clientId: number }) => {
    const response = await apiService.initOAuth(platform, clientId);
    return response.data;
  }
);

export const handleOAuthCallback = createAsyncThunk(
  'socialAccounts/handleOAuthCallback',
  async ({
    platform,
    clientId,
    code,
    state,
  }: {
    platform: string;
    clientId: number;
    code: string;
    state?: string;
  }) => {
    const response = await apiService.handleOAuthCallback(platform, clientId, code, state);
    return response.data;
  }
);

// Slice
const socialAccountsSlice = createSlice({
  name: 'socialAccounts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearOAuthUrl: (state) => {
      state.oauthUrl = null;
    },
    clearCurrentAccount: (state) => {
      state.currentAccount = null;
    },
    setCurrentAccount: (state, action: PayloadAction<SocialAccount>) => {
      state.currentAccount = action.payload;
    },
    clearConnectionTests: (state) => {
      state.connectionTests = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch Social Accounts
    builder
      .addCase(fetchSocialAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSocialAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload.social_accounts || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchSocialAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch social accounts';
      });

    // Fetch Single Social Account
    builder
      .addCase(fetchSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSocialAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAccount = action.payload.social_account;
      })
      .addCase(fetchSocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch social account';
      });

    // Connect Social Account
    builder
      .addCase(connectSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectSocialAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts.unshift(action.payload.social_account);
        state.currentAccount = action.payload.social_account;
      })
      .addCase(connectSocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to connect social account';
      });

    // Update Social Account
    builder
      .addCase(updateSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSocialAccount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.accounts.findIndex(
          (account) => account.id === action.payload.social_account.id
        );
        if (index !== -1) {
          state.accounts[index] = action.payload.social_account;
        }
        if (state.currentAccount?.id === action.payload.social_account.id) {
          state.currentAccount = action.payload.social_account;
        }
      })
      .addCase(updateSocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update social account';
      });

    // Delete Social Account
    builder
      .addCase(deleteSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSocialAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = state.accounts.filter((account) => account.id !== action.payload);
        if (state.currentAccount?.id === action.payload) {
          state.currentAccount = null;
        }
        // Remove connection test for deleted account
        delete state.connectionTests[action.payload];
      })
      .addCase(deleteSocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete social account';
      });

    // Refresh Social Token
    builder
      .addCase(refreshSocialToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshSocialToken.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.accounts.findIndex(
          (account) => account.id === action.payload.social_account.id
        );
        if (index !== -1) {
          state.accounts[index] = action.payload.social_account;
        }
        if (state.currentAccount?.id === action.payload.social_account.id) {
          state.currentAccount = action.payload.social_account;
        }
      })
      .addCase(refreshSocialToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to refresh token';
      });

    // Test Social Connection
    builder
      .addCase(testSocialConnection.pending, (state) => {
        state.error = null;
      })
      .addCase(testSocialConnection.fulfilled, (state, action) => {
        state.connectionTests[action.payload.accountId] = action.payload.result;
      })
      .addCase(testSocialConnection.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to test connection';
      });

    // Init OAuth
    builder
      .addCase(initOAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.oauthUrl = null;
      })
      .addCase(initOAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.oauthUrl = action.payload.auth_url;
      })
      .addCase(initOAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to initialize OAuth';
      });

    // Handle OAuth Callback
    builder
      .addCase(handleOAuthCallback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(handleOAuthCallback.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts.unshift(action.payload.social_account);
        state.currentAccount = action.payload.social_account;
        state.oauthUrl = null;
      })
      .addCase(handleOAuthCallback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to handle OAuth callback';
        state.oauthUrl = null;
      });
  },
});

// Actions
export const {
  clearError,
  clearOAuthUrl,
  clearCurrentAccount,
  setCurrentAccount,
  clearConnectionTests,
} = socialAccountsSlice.actions;

// Selectors
export const selectSocialAccounts = (state: RootState) => state.socialAccounts.accounts;
export const selectCurrentSocialAccount = (state: RootState) => state.socialAccounts.currentAccount;
export const selectSocialAccountsLoading = (state: RootState) => state.socialAccounts.loading;
export const selectSocialAccountsError = (state: RootState) => state.socialAccounts.error;
export const selectSocialAccountsPagination = (state: RootState) => state.socialAccounts.pagination;
export const selectOAuthUrl = (state: RootState) => state.socialAccounts.oauthUrl;
export const selectConnectionTests = (state: RootState) => state.socialAccounts.connectionTests;

// Helper selectors
export const selectSocialAccountsByClient = (clientId: number) => (state: RootState) =>
  state.socialAccounts.accounts.filter((account) => account.client_id === clientId);

export const selectSocialAccountsByPlatform = (platform: string) => (state: RootState) =>
  state.socialAccounts.accounts.filter((account) => account.platform === platform);

export const selectActiveSocialAccounts = (state: RootState) =>
  state.socialAccounts.accounts.filter((account) => account.is_active);

export default socialAccountsSlice.reducer; 