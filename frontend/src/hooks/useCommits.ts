import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commitApi, repositoryApi } from '../services/api';
import { TimelineGroupBy } from '../types';

export const COMMIT_QUERY_KEYS = {
  commits: (id: string) => ['repositories', id, 'commits'] as const,
  graph: (id: string) => ['repositories', id, 'graph'] as const,
  branches: (id: string) => ['repositories', id, 'branches'] as const,
  timeline: (id: string, groupBy: TimelineGroupBy) =>
    ['repositories', id, 'timeline', groupBy] as const,
  commitDetails: (repositoryId: string, hash: string) =>
    ['commits', repositoryId, hash] as const,
};

export function useRepositoryCommits(repositoryId: string, enabled = true) {
  return useQuery({
    queryKey: COMMIT_QUERY_KEYS.commits(repositoryId),
    queryFn: () => repositoryApi.getCommits(repositoryId),
    enabled: !!repositoryId && enabled,
    staleTime: 60_000,
  });
}

export function useRepositoryGraph(repositoryId: string, enabled = true) {
  return useQuery({
    queryKey: COMMIT_QUERY_KEYS.graph(repositoryId),
    queryFn: () => repositoryApi.getGraph(repositoryId),
    enabled: !!repositoryId && enabled,
    staleTime: 60_000,
  });
}

export function useRepositoryBranches(repositoryId: string, enabled = true) {
  return useQuery({
    queryKey: COMMIT_QUERY_KEYS.branches(repositoryId),
    queryFn: () => repositoryApi.getBranches(repositoryId),
    enabled: !!repositoryId && enabled,
    staleTime: 60_000,
  });
}

export function useRepositoryTimeline(
  repositoryId: string,
  groupBy: TimelineGroupBy,
  enabled = true
) {
  return useQuery({
    queryKey: COMMIT_QUERY_KEYS.timeline(repositoryId, groupBy),
    queryFn: () => repositoryApi.getTimeline(repositoryId, groupBy),
    enabled: !!repositoryId && enabled,
    staleTime: 60_000,
  });
}

export function useCommitDetails(
  repositoryId: string,
  commitHash: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: COMMIT_QUERY_KEYS.commitDetails(repositoryId, commitHash ?? ''),
    queryFn: () => commitApi.getDetails(commitHash!, repositoryId),
    enabled: !!repositoryId && !!commitHash && enabled,
    staleTime: 30_000,
  });
}

export function useSyncRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repositoryId: string) => repositoryApi.sync(repositoryId),
    onSuccess: (_data, repositoryId) => {
      queryClient.invalidateQueries({ queryKey: COMMIT_QUERY_KEYS.commits(repositoryId) });
      queryClient.invalidateQueries({ queryKey: COMMIT_QUERY_KEYS.graph(repositoryId) });
      queryClient.invalidateQueries({ queryKey: ['repositories', repositoryId, 'timeline'] });
    },
  });
}

export function useSyncBranches() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repositoryId: string) => repositoryApi.syncBranches(repositoryId),
    onSuccess: (_data, repositoryId) => {
      queryClient.invalidateQueries({ queryKey: COMMIT_QUERY_KEYS.branches(repositoryId) });
      queryClient.invalidateQueries({ queryKey: COMMIT_QUERY_KEYS.graph(repositoryId) });
    },
  });
}
