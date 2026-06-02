import React, { createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useRepository } from '../hooks/useRepositories';
import { useRepositoryStats } from '../hooks/useAnalytics';
import { Repository, RepositoryStats } from '../types';

interface RepositoryContextValue {
  repositoryId: string;
  repository: Repository | undefined;
  stats: RepositoryStats | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  commitCount: number;
  branchCount: number;
  lastActivityLabel: string;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { repositoryId = '' } = useParams<{ repositoryId: string }>();

  const {
    data: repository,
    isLoading: repoLoading,
    isError: repoError,
    error: repoErr,
  } = useRepository(repositoryId);

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErr,
  } = useRepositoryStats(repositoryId, !!repositoryId);

  const value = useMemo<RepositoryContextValue>(() => {
    const commitCount = stats?.totalCommits ?? 0;
    const branchCount = stats?.totalBranches ?? 0;
    const lastActivityLabel = stats?.latestCommitDate
      ? stats.latestCommitDate
      : repository?.createdAt ?? '';

    return {
      repositoryId,
      repository,
      stats,
      isLoading: repoLoading || statsLoading,
      isError: repoError || statsError,
      error: (repoErr ?? statsErr) as Error | null,
      commitCount,
      branchCount,
      lastActivityLabel,
    };
  }, [
    repositoryId,
    repository,
    stats,
    repoLoading,
    statsLoading,
    repoError,
    statsError,
    repoErr,
    statsErr,
  ]);

  return (
    <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>
  );
};

export function useRepositoryWorkspace(): RepositoryContextValue {
  const ctx = useContext(RepositoryContext);
  if (!ctx) {
    throw new Error('useRepositoryWorkspace must be used within RepositoryProvider');
  }
  return ctx;
}
