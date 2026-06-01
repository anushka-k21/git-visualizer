import axios from 'axios';
import {
  ApiResponse,
  BranchListItem,
  CommitDetails,
  CommitListItem,
  GraphResponse,
  ImportRepositoryRequest,
  Repository,
  SyncBranchesResult,
  SyncResult,
  TimelineGroupBy,
  TimelineResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120_000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

const syncApi = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 1_800_000,
});

syncApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const repositoryApi = {
  import: async (data: ImportRepositoryRequest): Promise<ApiResponse<Repository>> => {
    const response = await api.post<ApiResponse<Repository>>('/repositories/import', data);
    return response.data;
  },

  list: async (): Promise<Repository[]> => {
    const response = await api.get<ApiResponse<Repository[]>>('/repositories');
    return response.data.data ?? [];
  },

  getById: async (id: string): Promise<Repository> => {
    const response = await api.get<ApiResponse<Repository>>(`/repositories/${id}`);
    if (!response.data.data) throw new Error('Repository not found');
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/repositories/${id}`);
  },

  sync: async (id: string): Promise<SyncResult> => {
    const response = await syncApi.post<ApiResponse<SyncResult>>(`/repositories/${id}/sync`);
    if (!response.data.data) throw new Error('Sync failed');
    return response.data.data;
  },

  syncBranches: async (id: string): Promise<SyncBranchesResult> => {
    const response = await syncApi.post<ApiResponse<SyncBranchesResult>>(
      `/repositories/${id}/sync-branches`
    );
    if (!response.data.data) throw new Error('Branch sync failed');
    return response.data.data;
  },

  getCommits: async (id: string): Promise<CommitListItem[]> => {
    const response = await api.get<ApiResponse<CommitListItem[]>>(`/repositories/${id}/commits`);
    return response.data.data ?? [];
  },

  getGraph: async (id: string): Promise<GraphResponse> => {
    const response = await api.get<ApiResponse<GraphResponse>>(`/repositories/${id}/graph`);
    return response.data.data ?? { nodes: [], edges: [], activeBranch: null };
  },

  getBranches: async (id: string): Promise<BranchListItem[]> => {
    const response = await api.get<ApiResponse<BranchListItem[]>>(`/repositories/${id}/branches`);
    return response.data.data ?? [];
  },

  getTimeline: async (id: string, groupBy: TimelineGroupBy): Promise<TimelineResponse> => {
    const response = await api.get<ApiResponse<TimelineResponse>>(
      `/repositories/${id}/timeline`,
      { params: { groupBy } }
    );
    return response.data.data ?? [];
  },
};

export const commitApi = {
  getDetails: async (hash: string, repositoryId: string): Promise<CommitDetails> => {
    const response = await api.get<ApiResponse<CommitDetails>>(`/commits/${hash}`, {
      params: { repositoryId },
    });
    if (!response.data.data) throw new Error('Commit not found');
    return response.data.data;
  },
};

export default api;
