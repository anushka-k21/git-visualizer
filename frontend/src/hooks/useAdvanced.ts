import { useQuery } from '@tanstack/react-query';
import { repositoryApi, commitApi } from '../services/api';
import { PlaybackDateFilter } from '../types';

export const ADVANCED_QUERY_KEYS = {
  commitDiff: (repositoryId: string, hash: string, path?: string) =>
    ['commits', repositoryId, hash, 'diff', path ?? ''] as const,
  compare: (id: string, source: string, target: string) =>
    ['repositories', id, 'compare', source, target] as const,
  compareDiff: (id: string, source: string, target: string) =>
    ['repositories', id, 'compare', source, target, 'diff'] as const,
  playback: (id: string, filter: PlaybackDateFilter) =>
    ['repositories', id, 'playback', filter] as const,
  impact: (id: string, params: string) => ['repositories', id, 'impact', params] as const,
};

export function useCommitDiff(
  repositoryId: string,
  commitHash: string | null,
  filePath?: string,
  enabled = true
) {
  return useQuery({
    queryKey: ADVANCED_QUERY_KEYS.commitDiff(repositoryId, commitHash ?? '', filePath),
    queryFn: () => commitApi.getDiff(commitHash!, repositoryId, filePath),
    enabled: !!repositoryId && !!commitHash && enabled,
    staleTime: 120_000,
  });
}

export function useBranchComparison(
  repositoryId: string,
  sourceBranch: string | null,
  targetBranch: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: ADVANCED_QUERY_KEYS.compare(
      repositoryId,
      sourceBranch ?? '',
      targetBranch ?? ''
    ),
    queryFn: () =>
      repositoryApi.compareBranches(repositoryId, sourceBranch!, targetBranch!),
    enabled:
      !!repositoryId &&
      !!sourceBranch &&
      !!targetBranch &&
      sourceBranch !== targetBranch &&
      enabled,
    staleTime: 60_000,
  });
}

export function useComparisonDiff(
  repositoryId: string,
  sourceBranch: string | null,
  targetBranch: string | null,
  enabled = false
) {
  return useQuery({
    queryKey: ADVANCED_QUERY_KEYS.compareDiff(
      repositoryId,
      sourceBranch ?? '',
      targetBranch ?? ''
    ),
    queryFn: () =>
      repositoryApi.getComparisonDiff(repositoryId, sourceBranch!, targetBranch!),
    enabled:
      !!repositoryId &&
      !!sourceBranch &&
      !!targetBranch &&
      sourceBranch !== targetBranch &&
      enabled,
    staleTime: 120_000,
  });
}

export function usePlayback(
  repositoryId: string,
  filter: PlaybackDateFilter = 'all',
  enabled = true
) {
  return useQuery({
    queryKey: ADVANCED_QUERY_KEYS.playback(repositoryId, filter),
    queryFn: () => repositoryApi.getPlayback(repositoryId, filter),
    enabled: !!repositoryId && enabled,
    staleTime: 300_000,
  });
}

export function useImpactAnalysis(
  repositoryId: string,
  options: {
    limit?: number;
    contributor?: string;
    branch?: string;
    minScore?: number;
    enabled?: boolean;
  } = {}
) {
  const params = JSON.stringify(options);
  return useQuery({
    queryKey: ADVANCED_QUERY_KEYS.impact(repositoryId, params),
    queryFn: () => repositoryApi.getImpact(repositoryId, options),
    enabled: !!repositoryId && (options.enabled ?? true),
    staleTime: 120_000,
  });
}
