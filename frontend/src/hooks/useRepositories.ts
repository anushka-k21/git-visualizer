import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositoryApi } from '../services/api';
import { ImportRepositoryRequest } from '../types';

export const QUERY_KEYS = {
  repositories: ['repositories'] as const,
  repository: (id: string) => ['repositories', id] as const,
};

export function useRepositories() {
  return useQuery({
    queryKey: QUERY_KEYS.repositories,
    queryFn: repositoryApi.list,
    staleTime: 30_000,
  });
}

export function useRepository(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.repository(id),
    queryFn: () => repositoryApi.getById(id),
    enabled: !!id,
  });
}

export function useImportRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ImportRepositoryRequest) => repositoryApi.import(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.repositories });
    },
  });
}

export function useDeleteRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => repositoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.repositories });
    },
  });
}
