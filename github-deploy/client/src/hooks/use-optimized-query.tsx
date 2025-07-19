import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

interface OptimizedQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  prefetch?: boolean;
}

export function useOptimizedQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options: OptimizedQueryOptions = {}
) {
  const queryClient = useQueryClient();
  
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    refetchOnMount = false,
    refetchOnWindowFocus = false,
    prefetch = false
  } = options;

  // Prefetch data if requested
  useEffect(() => {
    if (prefetch && enabled) {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime
      });
    }
  }, [queryClient, queryKey, queryFn, prefetch, enabled, staleTime]);

  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    refetchOnMount,
    refetchOnWindowFocus,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000)
  });

  // Smart cache invalidation
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // Optimistic updates helper
  const updateCache = useCallback((updater: (old: T | undefined) => T) => {
    queryClient.setQueryData(queryKey, updater);
  }, [queryClient, queryKey]);

  return {
    ...query,
    invalidateCache,
    updateCache
  };
}

// Hook for paginated data with optimized loading
export function useOptimizedPagination<T>(
  baseQueryKey: readonly unknown[],
  fetchPage: (page: number) => Promise<{ data: T[]; total: number; hasMore: boolean }>,
  pageSize = 20
) {
  const queryClient = useQueryClient();

  const loadPage = useCallback(async (page: number) => {
    const queryKey = [...baseQueryKey, 'page', page];
    
    return queryClient.fetchQuery({
      queryKey,
      queryFn: () => fetchPage(page),
      staleTime: 3 * 60 * 1000, // 3 minutes for paginated data
    });
  }, [baseQueryKey, fetchPage, queryClient]);

  // Prefetch next page
  const prefetchNextPage = useCallback((currentPage: number) => {
    const nextPageKey = [...baseQueryKey, 'page', currentPage + 1];
    queryClient.prefetchQuery({
      queryKey: nextPageKey,
      queryFn: () => fetchPage(currentPage + 1),
      staleTime: 3 * 60 * 1000,
    });
  }, [baseQueryKey, fetchPage, queryClient]);

  return {
    loadPage,
    prefetchNextPage
  };
}