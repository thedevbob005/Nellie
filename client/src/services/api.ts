// Nellie API Service
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, LoginRequest, LoginResponse } from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // TODO: Replace with your actual server URL
    this.baseURL = __DEV__ 
      ? 'http://localhost:8080/api' 
      : 'https://your-production-server.com/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.api.interceptors.request.use(
      async (config) => {
        const user = await this.getStoredUser();
        if (user) {
          // For session-based auth, the session cookie will be handled automatically
          config.headers['X-Requested-With'] = 'XMLHttpRequest';
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Authentication failed or session expired
          await this.clearStoredUser();
          // Redirect to login - handled by navigation
        }
        return Promise.reject(error);
      }
    );
  }

  // User Data Management
  private async getStoredUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  private async setStoredUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }

  private async clearStoredUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem('user_data');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/auth/login', credentials);
      
      if (response.data.success) {
        const userData = response.data.data;
        await this.setStoredUser(userData);
        return {
          user: userData,
          token: 'session_based', // We're using session-based auth
        };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Network error during login');
    }
  }

  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    organization_name: string;
  }): Promise<any> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/auth/register', userData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Network error during registration');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearStoredUser();
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      const response = await this.api.get('/auth/profile');
      if (response.data.success) {
        const userData = response.data.data;
        await this.setStoredUser(userData);
        return userData;
      } else {
        throw new Error(response.data.message || 'Failed to get user profile');
      }
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(userData: {
    first_name?: string;
    last_name?: string;
    email?: string;
  }): Promise<any> {
    try {
      const response = await this.api.put('/auth/profile', userData);
      if (response.data.success) {
        const updatedUser = response.data.data;
        await this.setStoredUser(updatedUser);
        return updatedUser;
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Network error during profile update');
    }
  }

  async changePassword(passwordData: {
    current_password: string;
    new_password: string;
  }): Promise<void> {
    try {
      const response = await this.api.put('/auth/change-password', passwordData);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Network error during password change');
    }
  }

  // User Management (Managers only)
  async getUsers(): Promise<any> {
    const response = await this.api.get('/users');
    return response.data;
  }

  async getUser(id: number): Promise<any> {
    const response = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async createUser(userData: any): Promise<any> {
    const response = await this.api.post('/users', userData);
    return response.data;
  }

  async updateUser(id: number, userData: any): Promise<any> {
    const response = await this.api.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: number): Promise<any> {
    const response = await this.api.delete(`/users/${id}`);
    return response.data;
  }

  async resetUserPassword(id: number): Promise<any> {
    const response = await this.api.post(`/users/${id}/reset-password`);
    return response.data;
  }

  // Client Management
  async getClients(page: number = 1, limit: number = 20): Promise<any> {
    const response = await this.api.get(`/clients?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getClient(id: number): Promise<any> {
    const response = await this.api.get(`/clients/${id}`);
    return response.data;
  }

  async createClient(clientData: any): Promise<any> {
    const response = await this.api.post('/clients', clientData);
    return response.data;
  }

  async updateClient(id: number, clientData: any): Promise<any> {
    const response = await this.api.put(`/clients/${id}`, clientData);
    return response.data;
  }

  async deleteClient(id: number): Promise<any> {
    const response = await this.api.delete(`/clients/${id}`);
    return response.data;
  }

  // Post Management
  async getPosts(page: number = 1, limit: number = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await this.api.get(`/posts?${params}`);
    return response.data;
  }

  async getPost(id: number): Promise<any> {
    const response = await this.api.get(`/posts/${id}`);
    return response.data;
  }

  async createPost(postData: any): Promise<any> {
    const response = await this.api.post('/posts', postData);
    return response.data;
  }

  async updatePost(id: number, postData: any): Promise<any> {
    const response = await this.api.put(`/posts/${id}`, postData);
    return response.data;
  }

  async deletePost(id: number): Promise<any> {
    const response = await this.api.delete(`/posts/${id}`);
    return response.data;
  }

  async submitPost(id: number): Promise<any> {
    const response = await this.api.post(`/posts/${id}/submit`);
    return response.data;
  }

  // Post Approval (Managers only)
  async approvePost(postId: number, feedback?: string): Promise<any> {
    const response = await this.api.post(`/posts/${postId}/approve`, { feedback });
    return response.data;
  }

  async rejectPost(postId: number, feedback: string): Promise<any> {
    const response = await this.api.post(`/posts/${postId}/reject`, { feedback });
    return response.data;
  }

  // Social Account Management
  async getSocialAccounts(): Promise<any> {
    const response = await this.api.get('/social-accounts');
    return response.data;
  }

  // Social Media Integration Methods
  async getSocialAccounts(params?: any): Promise<any> {
    const response = await this.api.get('/social-accounts', { params });
    return response.data;
  }

  async getSocialAccount(id: number): Promise<any> {
    const response = await this.api.get(`/social-accounts/${id}`);
    return response.data;
  }

  async connectSocialAccount(accountData: any): Promise<any> {
    const response = await this.api.post('/social-accounts', accountData);
    return response.data;
  }

  async updateSocialAccount(id: number, accountData: any): Promise<any> {
    const response = await this.api.put(`/social-accounts/${id}`, accountData);
    return response.data;
  }

  async deleteSocialAccount(id: number): Promise<any> {
    const response = await this.api.delete(`/social-accounts/${id}`);
    return response.data;
  }

  async refreshSocialToken(id: number): Promise<any> {
    const response = await this.api.post(`/social-accounts/${id}/refresh-token`);
    return response.data;
  }

  async testSocialConnection(id: number): Promise<any> {
    const response = await this.api.get(`/social-accounts/${id}/test-connection`);
    return response.data;
  }

  // OAuth Methods
  async initOAuth(platform: string, clientId: number): Promise<any> {
    const response = await this.api.post('/oauth/init', { platform, client_id: clientId });
    return response.data;
  }

  async handleOAuthCallback(platform: string, clientId: number, code: string, state?: string): Promise<any> {
    const response = await this.api.get('/oauth/callback', {
      params: { platform, client_id: clientId, code, state }
    });
    return response.data;
  }

  async disconnectSocialAccount(accountId: number): Promise<any> {
    const response = await this.api.delete(`/social-accounts/${accountId}`);
    return response.data;
  }

  async refreshSocialToken(accountId: number): Promise<any> {
    const response = await this.api.post(`/social-accounts/${accountId}/refresh-token`);
    return response.data;
  }

  // Media Upload
  async uploadMedia(mediaFile: FormData): Promise<any> {
    const response = await this.api.post('/media/upload', mediaFile, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteMedia(mediaId: number): Promise<any> {
    const response = await this.api.delete(`/media/${mediaId}`);
    return response.data;
  }

  async getMediaFiles(queryString: string = ''): Promise<any> {
    const response = await this.api.get(`/media?${queryString}`);
    return response.data;
  }

  // Dashboard and Analytics
  async getDashboardStats(): Promise<any> {
    const response = await this.api.get('/dashboard/stats');
    return response.data;
  }

  async getRecentPosts(): Promise<any> {
    const response = await this.api.get('/dashboard/recent-posts');
    return response.data;
  }

  async getPendingApprovals(): Promise<any> {
    const response = await this.api.get('/dashboard/pending-approvals');
    return response.data;
  }

  async getAnalytics(clientId?: number, dateRange?: any): Promise<any> {
    let url = '/analytics';
    const params = new URLSearchParams();
    
    if (clientId) params.append('client_id', clientId.toString());
    if (dateRange?.start) params.append('start_date', dateRange.start);
    if (dateRange?.end) params.append('end_date', dateRange.end);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await this.api.get(url);
    return response.data;
  }

  async getPostAnalytics(postId: number): Promise<any> {
    const response = await this.api.get(`/analytics/posts/${postId}`);
    return response.data;
  }

  async getClientAnalytics(clientId: number): Promise<any> {
    const response = await this.api.get(`/analytics/clients/${clientId}`);
    return response.data;
  }

  // Calendar
  async getCalendarPosts(startDate: string, endDate: string): Promise<any> {
    const response = await this.api.get(`/calendar/posts?start=${startDate}&end=${endDate}`);
    return response.data;
  }

  async reschedulePost(postId: number, newDate: string): Promise<any> {
    const response = await this.api.put(`/calendar/posts/${postId}/reschedule`, { 
      scheduled_at: newDate 
    });
    return response.data;
  }

  // Utility Methods
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/dashboard');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  // Post Publishing Integration
  async publishPost(id: number): Promise<any> {
    try {
      const response = await this.api.post(`/posts/${id}/publish`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to publish post');
    }
  }

  async schedulePost(id: number, scheduledAt: string): Promise<any> {
    try {
      const response = await this.api.post(`/posts/${id}/schedule`, {
        scheduled_at: scheduledAt
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to schedule post');
    }
  }

  async getPublishingQueue(): Promise<any> {
    try {
      const response = await this.api.get('/posts/queue');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get publishing queue');
    }
  }

  async optimizeContent(content: string, platform: string): Promise<any> {
    try {
      const response = await this.api.post('/posts/optimize-content', {
        content,
        platform
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to optimize content');
    }
  }

  async getBestPostingTimes(clientId: number): Promise<any> {
    try {
      const response = await this.api.get('/posts/best-times', {
        params: { client_id: clientId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get best posting times');
    }
  }

  // Analytics Integration
  async getAnalyticsDashboard(dateRange: string = '30d', clientId?: number): Promise<any> {
    try {
      const params: any = { range: dateRange };
      if (clientId) params.client_id = clientId;
      
      const response = await this.api.get('/analytics/dashboard', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get analytics dashboard');
    }
  }

  async getClientAnalyticsDetailed(clientId: number, dateRange: string = '30d'): Promise<any> {
    try {
      const response = await this.api.get(`/analytics/client/${clientId}`, {
        params: { range: dateRange }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get client analytics');
    }
  }

  async getPlatformAnalytics(platform: string, clientId?: number, dateRange: string = '30d'): Promise<any> {
    try {
      const params: any = { platform, range: dateRange };
      if (clientId) params.client_id = clientId;
      
      const response = await this.api.get('/analytics/platform', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get platform analytics');
    }
  }

  async syncAnalytics(clientIds?: number[], force: boolean = false): Promise<any> {
    try {
      const response = await this.api.post('/analytics/sync', {
        client_ids: clientIds || [],
        force
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to sync analytics');
    }
  }

  async getRealtimeAnalytics(): Promise<any> {
    try {
      const response = await this.api.get('/analytics/realtime');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get realtime analytics');
    }
  }

  async exportAnalyticsReport(reportConfig: {
    client_ids: number[];
    date_range: string;
    format: 'pdf' | 'csv';
  }): Promise<any> {
    try {
      const response = await this.api.post('/analytics/export', reportConfig);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to export analytics report');
    }
  }

  // Content Template Integration
  async getContentTemplates(platform: string, category: string = 'general'): Promise<any> {
    try {
      const response = await this.api.get('/content/templates', {
        params: { platform, category }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get content templates');
    }
  }

  async getContentSuggestions(platform: string, clientId: number): Promise<any> {
    try {
      const response = await this.api.get('/content/suggestions', {
        params: { platform, client_id: clientId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get content suggestions');
    }
  }

  async generateHashtags(content: string, platform: string, limit: number = 10): Promise<any> {
    try {
      const response = await this.api.post('/content/hashtags', {
        content,
        platform,
        limit
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate hashtags');
    }
  }

  async validateContent(content: string, platform: string, media: any[] = []): Promise<any> {
    try {
      const response = await this.api.post('/content/validate', {
        content,
        platform,
        media
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate content');
    }
  }

  // Enhanced Social Account Management
  async getSocialAccountsByClient(clientId: number): Promise<any> {
    try {
      const response = await this.api.get('/social-accounts', {
        params: { client_id: clientId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get social accounts');
    }
  }

  async getSocialAccountsByPlatform(platform: string): Promise<any> {
    try {
      const response = await this.api.get('/social-accounts', {
        params: { platform }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get platform accounts');
    }
  }

  async testAllSocialConnections(clientId?: number): Promise<any> {
    try {
      const params = clientId ? { client_id: clientId } : {};
      const response = await this.api.get('/social-accounts/test-all', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to test social connections');
    }
  }

  // Enhanced Post Management
  async getPostsByStatus(status: string, clientId?: number): Promise<any> {
    try {
      const params: any = { status };
      if (clientId) params.client_id = clientId;
      
      const response = await this.api.get('/posts', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get posts by status');
    }
  }

  async getScheduledPosts(clientId?: number): Promise<any> {
    try {
      return await this.getPostsByStatus('scheduled', clientId);
    } catch (error) {
      throw error;
    }
  }

  async getPendingPosts(clientId?: number): Promise<any> {
    try {
      return await this.getPostsByStatus('pending_approval', clientId);
    } catch (error) {
      throw error;
    }
  }

  async getPublishedPosts(clientId?: number, dateRange?: string): Promise<any> {
    try {
      const params: any = { status: 'published' };
      if (clientId) params.client_id = clientId;
      if (dateRange) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(dateRange.replace('d', '')));
        params.start_date = startDate.toISOString().split('T')[0];
        params.end_date = endDate.toISOString().split('T')[0];
      }
      
      const response = await this.api.get('/posts', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get published posts');
    }
  }

  async duplicatePost(id: number): Promise<any> {
    try {
      const response = await this.api.post(`/posts/${id}/duplicate`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to duplicate post');
    }
  }

  async bulkUpdatePosts(postIds: number[], updates: any): Promise<any> {
    try {
      const response = await this.api.patch('/posts/bulk-update', {
        post_ids: postIds,
        updates
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to bulk update posts');
    }
  }

  // Real-time Features
  async getNotifications(): Promise<any> {
    try {
      const response = await this.api.get('/notifications');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get notifications');
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<any> {
    try {
      const response = await this.api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }

  async getSystemStatus(): Promise<any> {
    try {
      const response = await this.api.get('/system/status');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get system status');
    }
  }

  // Calendar and Scheduling
  async getCalendarData(startDate: string, endDate: string, clientId?: number): Promise<any> {
    try {
      const params: any = { start_date: startDate, end_date: endDate };
      if (clientId) params.client_id = clientId;
      
      const response = await this.api.get('/calendar', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get calendar data');
    }
  }

  async movePostInCalendar(postId: number, newDateTime: string): Promise<any> {
    try {
      const response = await this.api.patch(`/calendar/move/${postId}`, {
        new_datetime: newDateTime
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to move post in calendar');
    }
  }

  // Media Management Enhancement
  async getMediaByPost(postId: number): Promise<any> {
    try {
      const response = await this.api.get(`/media/post/${postId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get post media');
    }
  }

  async getMediaByClient(clientId: number): Promise<any> {
    try {
      const response = await this.api.get(`/media/client/${clientId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get client media');
    }
  }

  async optimizeMediaForPlatform(mediaId: number, platform: string): Promise<any> {
    try {
      const response = await this.api.post(`/media/${mediaId}/optimize`, {
        platform
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to optimize media');
    }
  }

  // Team Collaboration
  async getTeamMembers(): Promise<any> {
    try {
      const response = await this.api.get('/team/members');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get team members');
    }
  }

  async assignClientToUser(clientId: number, userId: number): Promise<any> {
    try {
      const response = await this.api.post('/team/assign-client', {
        client_id: clientId,
        user_id: userId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to assign client to user');
    }
  }

  async getPostComments(postId: number): Promise<any> {
    try {
      const response = await this.api.get(`/posts/${postId}/comments`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get post comments');
    }
  }

  async addPostComment(postId: number, comment: string): Promise<any> {
    try {
      const response = await this.api.post(`/posts/${postId}/comments`, {
        comment
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add post comment');
    }
  }

  // Client Performance Tracking
  async getClientPerformanceMetrics(clientId: number, dateRange: string = '30d'): Promise<any> {
    try {
      const response = await this.api.get(`/clients/${clientId}/performance`, {
        params: { range: dateRange }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get client performance metrics');
    }
  }

  async getClientGrowthData(clientId: number): Promise<any> {
    try {
      const response = await this.api.get(`/clients/${clientId}/growth`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get client growth data');
    }
  }

  // Search and Filtering
  async searchPosts(query: string, filters?: any): Promise<any> {
    try {
      const params = { q: query, ...filters };
      const response = await this.api.get('/posts/search', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search posts');
    }
  }

  async searchClients(query: string): Promise<any> {
    try {
      const response = await this.api.get('/clients/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search clients');
    }
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService; 