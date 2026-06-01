import axios from 'axios';
import {
  ApiResponse,
  BranchListItem,
  BranchComparison,
  CommitDetails,
  CommitDiff,
  CommitListItem,
  ContributorDetail,
  ContributorListItem,
  FileHistoryResponse,
  GraphResponse,
  HeatmapEntry,
  HeatmapRange,
  ImpactAnalysisResponse,
  ImportRepositoryRequest,
  PlaybackDateFilter,
  PlaybackTimeline,
  Repository,
  RepositoryFile,
  RepositoryStats,
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

  syncContributors: async (id: string): Promise<{ repositoryId: string; contributorsSynced: number }> => {
    const response = await api.post<ApiResponse<{ repositoryId: string; contributorsSynced: number }>>(
      `/repositories/${id}/sync-contributors`
    );
    if (!response.data.data) throw new Error('Contributor sync failed');
    return response.data.data;
  },

  getStats: async (id: string): Promise<RepositoryStats> => {
    const response = await api.get<ApiResponse<RepositoryStats>>(`/repositories/${id}/stats`);
    if (!response.data.data) throw new Error('Stats not found');
    return response.data.data;
  },

  getContributors: async (id: string): Promise<ContributorListItem[]> => {
    const response = await api.get<ApiResponse<ContributorListItem[]>>(
      `/repositories/${id}/contributors`
    );
    return response.data.data ?? [];
  },

  getContributor: async (id: string, contributorId: string): Promise<ContributorDetail> => {
    const response = await api.get<ApiResponse<ContributorDetail>>(
      `/repositories/${id}/contributors/${contributorId}`
    );
    if (!response.data.data) throw new Error('Contributor not found');
    return response.data.data;
  },

  getHeatmap: async (id: string, range: HeatmapRange): Promise<HeatmapEntry[]> => {
    const response = await api.get<ApiResponse<HeatmapEntry[]>>(`/repositories/${id}/heatmap`, {
      params: { range },
    });
    return response.data.data ?? [];
  },

  getFiles: async (id: string, search?: string): Promise<RepositoryFile[]> => {
    const response = await api.get<ApiResponse<RepositoryFile[]>>(`/repositories/${id}/files`, {
      params: search ? { search } : undefined,
    });
    return response.data.data ?? [];
  },

  getFileHistory: async (
    id: string,
    path: string,
    options: { limit?: number; skip?: number; sort?: 'newest' | 'oldest' }
  ): Promise<FileHistoryResponse> => {
    const response = await api.get<ApiResponse<FileHistoryResponse>>(
      `/repositories/${id}/files/history`,
      { params: { path, ...options } }
    );
    return response.data.data ?? { entries: [], hasMore: false };
  },

  compareBranches: async (
    id: string,
    sourceBranch: string,
    targetBranch: string
  ): Promise<BranchComparison> => {
    const response = await api.get<ApiResponse<BranchComparison>>(`/repositories/${id}/compare`, {
      params: { sourceBranch, targetBranch },
    });
    if (!response.data.data) throw new Error('Comparison failed');
    return response.data.data;
  },

  getComparisonDiff: async (
    id: string,
    sourceBranch: string,
    targetBranch: string
  ): Promise<CommitDiff> => {
    const response = await api.get<ApiResponse<CommitDiff>>(`/repositories/${id}/compare/diff`, {
      params: { sourceBranch, targetBranch },
    });
    if (!response.data.data) throw new Error('Comparison diff failed');
    return response.data.data;
  },

  getPlayback: async (id: string, filter: PlaybackDateFilter): Promise<PlaybackTimeline> => {
    const response = await api.get<ApiResponse<PlaybackTimeline>>(
      `/repositories/${id}/playback`,
      { params: { filter } }
    );
    if (!response.data.data) throw new Error('Playback failed');
    return response.data.data;
  },

  getImpact: async (
    id: string,
    options: {
      limit?: number;
      contributor?: string;
      branch?: string;
      minScore?: number;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<ImpactAnalysisResponse> => {
    const response = await api.get<ApiResponse<ImpactAnalysisResponse>>(
      `/repositories/${id}/impact`,
      { params: options }
    );
    if (!response.data.data) throw new Error('Impact analysis failed');
    return response.data.data;
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

  getDiff: async (
    hash: string,
    repositoryId: string,
    filePath?: string
  ): Promise<CommitDiff> => {
    const response = await api.get<ApiResponse<CommitDiff>>(`/commits/${hash}/diff`, {
      params: { repositoryId, path: filePath },
    });
    if (!response.data.data) throw new Error('Diff not found');
    return response.data.data;
  },
};

export default api;
