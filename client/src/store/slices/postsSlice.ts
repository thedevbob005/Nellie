// Posts Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Post } from '../../types';
import ApiService from '../../services/api';
import { RootState } from '../index';

// Types
export interface MediaFile {
  id: number;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'video' | 'document';
  file_size: number;
  mime_type: string;
  created: string;
  url?: string;
}

export interface PostPlatform {
  social_account_id: number;
  platform: 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'threads' | 'linkedin';
  account_name: string;
  platform_specific_data?: any;
}

export interface PostApproval {
  id?: number;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  approved_by?: string;
  approved_at?: string;
  created?: string;
}

export interface Post {
  id: number;
  title?: string;
  content: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'failed' | 'cancelled';
  scheduled_at?: string;
  published_at?: string;
  created: string;
  updated: string;
  client: {
    id: number;
    name: string;
    logo_path?: string;
  };
  created_by: {
    id: number;
    name: string;
  };
  platforms: PostPlatform[];
  media_files: MediaFile[];
  approval?: PostApproval;
  approval_history?: PostApproval[];
  is_recurring: boolean;
  recurring_pattern?: string;
  platform_specific_data?: any;
}

export interface PostCreateData {
  client_id: number;
  title?: string;
  content: string;
  social_account_ids: number[];
  scheduled_at?: string;
  platform_specific_data?: any;
  platform_data?: { [key: number]: any };
  media_files?: { id: number }[];
  is_recurring?: boolean;
  recurring_pattern?: string;
}

export interface PostUpdateData extends Partial<PostCreateData> {
  id: number;
}

export interface PostFilters {
  status?: string;
  client_id?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

interface PostsState {
  posts: Post[];
  currentPost: Post | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: PostFilters;
  pendingApprovals: Post[];
  scheduledPosts: Post[];
}

const initialState: PostsState = {
  posts: [],
  currentPost: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {},
  pendingApprovals: [],
  scheduledPosts: [],
};

// Async Thunks
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (filters: PostFilters = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiService.getPosts(filters.page, filters.limit, filters);
    return response;
  }
);

export const fetchPost = createAsyncThunk(
  'posts/fetchPost',
  async (postId: number, { rejectWithValue }) => {
    try {
      const response = await apiService.getPost(postId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData: PostCreateData, { rejectWithValue }) => {
    try {
      const response = await apiService.createPost(postData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async (postData: PostUpdateData, { rejectWithValue }) => {
    try {
      const response = await apiService.updatePost(postData.id, postData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId: number, { rejectWithValue }) => {
    try {
      await apiService.deletePost(postId);
      return postId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitPost = createAsyncThunk(
  'posts/submitPost',
  async (postId: number, { rejectWithValue }) => {
    try {
      const response = await apiService.submitPost(postId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const approvePost = createAsyncThunk(
  'posts/approvePost',
  async ({ postId, feedback }: { postId: number; feedback?: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.approvePost(postId, feedback);
      return { postId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const rejectPost = createAsyncThunk(
  'posts/rejectPost',
  async ({ postId, feedback }: { postId: number; feedback: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.rejectPost(postId, feedback);
      return { postId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadMedia = createAsyncThunk(
  'posts/uploadMedia',
  async (files: File[], { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files[]', file);
      });
      
      const response = await apiService.uploadMedia(formData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMediaFiles = createAsyncThunk(
  'posts/fetchMediaFiles',
  async (params: { page?: number; limit?: number; file_type?: string } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await apiService.getMediaFiles(queryParams.toString());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
    setFilters: (state, action: PayloadAction<PostFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    updatePostStatus: (state, action: PayloadAction<{ id: number; status: Post['status'] }>) => {
      const { id, status } = action.payload;
      const post = state.posts.find(p => p.id === id);
      if (post) {
        post.status = status;
      }
      if (state.currentPost && state.currentPost.id === id) {
        state.currentPost.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Posts
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.data;
        state.pagination = action.payload.pagination;
        state.filters = action.payload.filters;
        
        // Update pending approvals
        state.pendingApprovals = action.payload.data.filter((post: Post) => 
          post.status === 'pending_approval'
        );
        
        // Update scheduled posts
        state.scheduledPosts = action.payload.data.filter((post: Post) => 
          post.status === 'scheduled'
        );
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Single Post
    builder
      .addCase(fetchPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPost.fulfilled, (state, action: PayloadAction<Post>) => {
        state.loading = false;
        state.currentPost = action.payload;
        state.error = null;
      })
      .addCase(fetchPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Post
    builder
      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action: PayloadAction<Post>) => {
        state.loading = false;
        state.posts.unshift(action.payload);
        state.pagination.total += 1;
        state.error = null;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Post
    builder
      .addCase(updatePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePost.fulfilled, (state, action: PayloadAction<Post>) => {
        state.loading = false;
        const index = state.posts.findIndex(post => post.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = { ...state.posts[index], ...action.payload };
        }
        if (state.currentPost && state.currentPost.id === action.payload.id) {
          state.currentPost = { ...state.currentPost, ...action.payload };
        }
        state.error = null;
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Post
    builder
      .addCase(deletePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.posts = state.posts.filter(post => post.id !== action.payload);
        state.pagination.total -= 1;
        if (state.currentPost && state.currentPost.id === action.payload) {
          state.currentPost = null;
        }
        state.error = null;
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Submit Post
    builder
      .addCase(submitPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitPost.fulfilled, (state, action) => {
        state.loading = false;
        const post = state.posts.find(p => p.id === action.payload.id);
        if (post) {
          post.status = action.payload.status;
        }
        if (state.currentPost && state.currentPost.id === action.payload.id) {
          state.currentPost.status = action.payload.status;
        }
      })
      .addCase(submitPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Approve Post
    builder
      .addCase(approvePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approvePost.fulfilled, (state, action) => {
        state.loading = false;
        const { postId } = action.payload;
        state.pendingApprovals = state.pendingApprovals.filter(post => post.id !== postId);
        const postIndex = state.posts.findIndex(post => post.id === postId);
        if (postIndex !== -1) {
          state.posts[postIndex].status = 'approved';
        }
        if (state.currentPost && state.currentPost.id === postId) {
          state.currentPost.status = 'approved';
        }
        state.error = null;
      })
      .addCase(approvePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Reject Post
    builder
      .addCase(rejectPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectPost.fulfilled, (state, action) => {
        state.loading = false;
        const { postId } = action.payload;
        state.pendingApprovals = state.pendingApprovals.filter(post => post.id !== postId);
        const postIndex = state.posts.findIndex(post => post.id === postId);
        if (postIndex !== -1) {
          state.posts[postIndex].status = 'cancelled';
        }
        if (state.currentPost && state.currentPost.id === postId) {
          state.currentPost.status = 'cancelled';
        }
        state.error = null;
      })
      .addCase(rejectPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Upload Media
    builder
      .addCase(uploadMedia.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadMedia.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(uploadMedia.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  clearCurrentPost, 
  setFilters, 
  clearFilters, 
  updatePostStatus 
} = postsSlice.actions;

// Selectors
export const selectPosts = (state: RootState) => state.posts.posts;
export const selectCurrentPost = (state: RootState) => state.posts.currentPost;
export const selectPostsLoading = (state: RootState) => state.posts.loading;
export const selectPostsError = (state: RootState) => state.posts.error;
export const selectPostsPagination = (state: RootState) => state.posts.pagination;
export const selectPostsFilters = (state: RootState) => state.posts.filters;
export const selectPendingApprovals = (state: RootState) => state.posts.pendingApprovals;
export const selectScheduledPosts = (state: RootState) => state.posts.scheduledPosts;

// Computed selectors
export const selectPostsByStatus = (status: Post['status']) => (state: RootState) =>
  state.posts.posts.filter(post => post.status === status);

export const selectPostsByClient = (clientId: number) => (state: RootState) =>
  state.posts.posts.filter(post => post.client.id === clientId);

export default postsSlice.reducer; 