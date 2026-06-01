import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositoryApi } from '../services/api';
import { HeatmapRange } from '../types';
import { COMMIT_QUERY_KEYS } from './useCommits';

export const ANALYTICS_QUERY_KEYS = {
  stats: (id: string) => ['repositories', id, 'stats'] as const,
  contributors: (id: string) => ['repositories', id, 'contributors'] as const,
  contributor: (id: string, contributorId: string) =>
    ['repositories', id, 'contributors', contributorId] as const,
  heatmap: (id: string, range: HeatmapRange) => ['repositories', id, 'heatmap', range] as const,
  files: (id: string, search: string) => ['repositories', id, 'files', search] as const,
  fileHistory: (id: string, path: string, sort: string, skip: number) =>
    ['repositories', id, 'files', 'history', path, sort, skip] as const,
};

export function useRepositoryStats(repositoryId: string, enabled = true) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.stats(repositoryId),
    queryFn: () => repositoryApi.getStats(repositoryId),
    enabled: !!repositoryId && enabled,
    staleTime: 60_000,
  });
}

export function useContributors(repositoryId: string, enabled = true) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.contributors(repositoryId),
    queryFn: () => repositoryApi.getContributors(repositoryId),
    enabled: !!repositoryId && enabled,
    staleTime: 60_000,
  });
}

export function useContributor(
  repositoryId: string,
  contributorId: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.contributor(repositoryId, contributorId ?? ''),
    queryFn: () => repositoryApi.getContributor(repositoryId, contributorId!),
    enabled: !!repositoryId && !!contributorId && enabled,
    staleTime: 60_000,
  });
}

export function useHeatmap(repositoryId: string, range: HeatmapRange, enabled = true) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.heatmap(repositoryId, range),
    queryFn: () => repositoryApi.getHeatmap(repositoryId, range),
    enabled: !!repositoryId && enabled,
    staleTime: 120_000,
  });
}

export function useFiles(repositoryId: string, search: string, enabled = true) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.files(repositoryId, search),
    queryFn: () => repositoryApi.getFiles(repositoryId, search || undefined),
    enabled: !!repositoryId && enabled,
    staleTime: 300_000,
  });
}

export function useFileHistory(
  repositoryId: string,
  filePath: string | null,
  sort: 'newest' | 'oldest',
  skip: number,
  enabled = true
) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.fileHistory(repositoryId, filePath ?? '', sort, skip),
    queryFn: () =>
      repositoryApi.getFileHistory(repositoryId, filePath!, { sort, skip, limit: 50 }),
    enabled: !!repositoryId && !!filePath && enabled,
    staleTime: 60_000,
  });
}

export function useSyncContributors() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repositoryId: string) => repositoryApi.syncContributors(repositoryId),
    onSuccess: (_data, repositoryId) => {
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEYS.contributors(repositoryId) });
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEYS.stats(repositoryId) });
      queryClient.invalidateQueries({ queryKey: COMMIT_QUERY_KEYS.graph(repositoryId) });
    },
  });
}
