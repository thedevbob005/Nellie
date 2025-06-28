// Clients Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../services/api';
import { RootState } from '../index';

// Types
export interface SocialAccount {
  id: number;
  platform: 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'threads' | 'linkedin';
  account_name: string;
  is_active: boolean;
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  logo_path?: string;
  created_at: string;
  updated_at: string;
  social_accounts?: SocialAccount[];
  social_accounts_count?: number;
  platforms?: string[];
  statistics?: {
    total_posts: number;
    published_posts: number;
    scheduled_posts: number;
    pending_approval: number;
  };
  recent_posts?: any[];
}

export interface ClientCreateData {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  logo?: File;
}

export interface ClientUpdateData extends Partial<ClientCreateData> {
  id: number;
}

export interface ClientStats {
  client: {
    id: number;
    name: string;
  };
  posts: {
    total: number;
    published: number;
    scheduled: number;
    pending: number;
    draft: number;
  };
  recent_activity: any[];
  platforms: string[];
  date_range: {
    start: string;
    end: string;
  };
}

interface ClientsState {
  clients: Client[];
  currentClient: Client | null;
  currentClientStats: ClientStats | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const initialState: ClientsState = {
  clients: [],
  currentClient: null,
  currentClientStats: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

// Async thunks
export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async (params: { page?: number; limit?: number } = {}) => {
    const { page = 1, limit = 20 } = params;
    const response = await apiService.get(`/clients?page=${page}&limit=${limit}`);
    return response.data;
  }
);

export const fetchClient = createAsyncThunk(
  'clients/fetchClient',
  async (clientId: number) => {
    const response = await apiService.get(`/clients/${clientId}`);
    return response.data;
  }
);

export const createClient = createAsyncThunk(
  'clients/createClient',
  async (clientData: ClientCreateData) => {
    const formData = new FormData();
    formData.append('name', clientData.name);
    if (clientData.email) formData.append('email', clientData.email);
    if (clientData.phone) formData.append('phone', clientData.phone);
    if (clientData.website) formData.append('website', clientData.website);
    if (clientData.description) formData.append('description', clientData.description);
    if (clientData.logo) formData.append('logo', clientData.logo);

    const response = await apiService.post('/clients', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
);

export const updateClient = createAsyncThunk(
  'clients/updateClient',
  async (clientData: ClientUpdateData) => {
    const { id, ...updateData } = clientData;
    const formData = new FormData();
    
    if (updateData.name) formData.append('name', updateData.name);
    if (updateData.email) formData.append('email', updateData.email);
    if (updateData.phone) formData.append('phone', updateData.phone);
    if (updateData.website) formData.append('website', updateData.website);
    if (updateData.description) formData.append('description', updateData.description);
    if (updateData.logo) formData.append('logo', updateData.logo);

    const response = await apiService.put(`/clients/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
);

export const deleteClient = createAsyncThunk(
  'clients/deleteClient',
  async (clientId: number) => {
    await apiService.delete(`/clients/${clientId}`);
    return clientId;
  }
);

export const fetchClientStats = createAsyncThunk(
  'clients/fetchClientStats',
  async (params: { clientId: number; startDate?: string; endDate?: string }) => {
    const { clientId, startDate, endDate } = params;
    let url = `/clients/${clientId}/stats`;
    
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    const response = await apiService.get(url);
    return response.data;
  }
);

// Slice
const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentClient: (state) => {
      state.currentClient = null;
    },
    clearCurrentClientStats: (state) => {
      state.currentClientStats = null;
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      state.pagination.page = action.payload.page;
      state.pagination.limit = action.payload.limit;
    },
  },
  extraReducers: (builder) => {
    // Fetch clients
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload.clients;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch clients';
      });

    // Fetch single client
    builder
      .addCase(fetchClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClient.fulfilled, (state, action) => {
        state.loading = false;
        state.currentClient = action.payload;
      })
      .addCase(fetchClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch client';
      });

    // Create client
    builder
      .addCase(createClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.loading = false;
        state.clients.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create client';
      });

    // Update client
    builder
      .addCase(updateClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.clients.findIndex(client => client.id === action.payload.id);
        if (index !== -1) {
          state.clients[index] = { ...state.clients[index], ...action.payload };
        }
        if (state.currentClient && state.currentClient.id === action.payload.id) {
          state.currentClient = { ...state.currentClient, ...action.payload };
        }
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update client';
      });

    // Delete client
    builder
      .addCase(deleteClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = state.clients.filter(client => client.id !== action.payload);
        state.pagination.total -= 1;
        if (state.currentClient && state.currentClient.id === action.payload) {
          state.currentClient = null;
        }
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete client';
      });

    // Fetch client stats
    builder
      .addCase(fetchClientStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientStats.fulfilled, (state, action) => {
        state.loading = false;
        state.currentClientStats = action.payload;
      })
      .addCase(fetchClientStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch client statistics';
      });
  },
});

export const { clearError, clearCurrentClient, clearCurrentClientStats, setPagination } = clientsSlice.actions;

// Selectors
export const selectClients = (state: RootState) => state.clients.clients;
export const selectCurrentClient = (state: RootState) => state.clients.currentClient;
export const selectCurrentClientStats = (state: RootState) => state.clients.currentClientStats;
export const selectClientsLoading = (state: RootState) => state.clients.loading;
export const selectClientsError = (state: RootState) => state.clients.error;
export const selectClientsPagination = (state: RootState) => state.clients.pagination;

export default clientsSlice.reducer; 