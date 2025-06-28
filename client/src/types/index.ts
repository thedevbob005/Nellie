// Nellie Social Media Management - Type Definitions

export interface Organization {
  id: number;
  name: string;
  email: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface User {
  id: number;
  organization_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'manager' | 'designer';
  last_login?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  organization?: Organization;
}

export interface Client {
  id: number;
  organization_id: number;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  logo_path?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  social_accounts?: SocialAccount[];
}

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
  client?: Client;
}

export interface Post {
  id: number;
  client_id: number;
  created_by: number;
  title?: string;
  content: string;
  platform_specific_data?: any;
  status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'failed' | 'cancelled';
  scheduled_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  is_recurring: boolean;
  recurring_pattern?: string;
  client?: Client;
  created_by_user?: User;
  media_files?: MediaFile[];
  post_platforms?: PostPlatform[];
  post_approvals?: PostApproval[];
}

export interface PostPlatform {
  id: number;
  post_id: number;
  social_account_id: number;
  platform: string;
  platform_post_id?: string;
  published_at?: string;
  status: 'pending' | 'published' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
  post?: Post;
  social_account?: SocialAccount;
  analytics?: Analytics[];
}

export interface PostApproval {
  id: number;
  post_id: number;
  approved_by: number;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  feedback?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  post?: Post;
  approved_by_user?: User;
}

export interface MediaFile {
  id: number;
  post_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  media_type: 'image' | 'video' | 'document';
  dimensions?: string;
  created_at: string;
  updated_at: string;
  post?: Post;
}

export interface Analytics {
  id: number;
  post_platform_id: number;
  platform: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  impressions: number;
  reach: number;
  clicks: number;
  engagement_rate: number;
  platform_data?: any;
  recorded_at: string;
  created_at: string;
  post_platform?: PostPlatform;
}

export interface SystemLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  description: string;
  ip_address?: string;
  user_agent?: string;
  data?: any;
  created_at: string;
  user?: User;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expires_at: string;
}

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Dashboard: undefined;
  ClientList: undefined;
  ClientDetail: { clientId: number };
  PostCreate: { clientId?: number };
  PostEdit: { postId: number };
  PostApproval: undefined;
  Calendar: undefined;
  Analytics: { clientId?: number };
  SocialAccounts: { clientId?: number };
  Settings: undefined;
  Profile: undefined;
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  Posts: undefined;
  Clients: undefined;
  SocialAccounts: undefined;
  Analytics: undefined;
};

// Form Types
export interface CreatePostForm {
  client_id: number;
  title?: string;
  content: string;
  platforms: string[];
  scheduled_at?: string;
  media_files?: any[];
  is_recurring: boolean;
  recurring_pattern?: string;
}

export interface ClientForm {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  logo?: any;
}

// UI State Types
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
} 