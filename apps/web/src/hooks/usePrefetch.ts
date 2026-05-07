/**
 * Prefetching Hooks
 *
 * Optimistically prefetch data before user clicks
 * Improves perceived performance by loading data ahead of time
 */

import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, STALE_TIME } from '../lib/queryClient';
import { apiClient } from '../lib/apiClient';

/**
 * Prefetch stock detail data on hover
 *
 * Usage:
 * const prefetch = usePrefetchStock();
 * <tr onMouseEnter={() => prefetch('RELIANCE')}>
 */
export function usePrefetchStock() {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prefetch = useCallback(
    (symbol: string) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Wait 500ms before prefetching (user must hover for this duration)
      timeoutRef.current = setTimeout(() => {
        // Check if data is already cached
        const cacheKey = queryKeys.stockDetail(symbol);
        const cachedData = queryClient.getQueryData(cacheKey);

        if (!cachedData) {
          // Prefetch stock detail data
          queryClient.prefetchQuery({
            queryKey: cacheKey,
            queryFn: async () => {
              const response = await apiClient.get(`/api/stocks/${symbol}`);
              return response.data;
            },
            staleTime: STALE_TIME.STOCK_DETAIL,
          });

          console.log(`🔮 Prefetched: ${symbol}`);
        }
      }, 500); // 500ms hover delay
    },
    [queryClient]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { prefetch, cancel };
}

/**
 * Prefetch multiple stocks (e.g., top watchlist items)
 *
 * Usage:
 * const prefetchList = usePrefetchStockList();
 * useEffect(() => {
 *   prefetchList(['RELIANCE', 'TCS', 'INFY']);
 * }, []);
 */
export function usePrefetchStockList() {
  const queryClient = useQueryClient();

  const prefetchList = useCallback(
    async (symbols: string[]) => {
      console.log(`🔮 Prefetching ${symbols.length} stocks...`);

      // Prefetch in parallel
      await Promise.all(
        symbols.map((symbol) =>
          queryClient.prefetchQuery({
            queryKey: queryKeys.stockDetail(symbol),
            queryFn: async () => {
              const response = await apiClient.get(`/api/stocks/${symbol}`);
              return response.data;
            },
            staleTime: STALE_TIME.STOCK_DETAIL,
          })
        )
      );

      console.log(`✅ Prefetched ${symbols.length} stocks`);
    },
    [queryClient]
  );

  return prefetchList;
}

/**
 * Prefetch next page of paginated data
 *
 * Usage:
 * const prefetchNext = usePrefetchNextPage('screener', filters);
 * <button onClick={() => prefetchNext(currentPage + 1)}>
 */
export function usePrefetchNextPage(
  queryType: string,
  filters: any
) {
  const queryClient = useQueryClient();

  const prefetchNext = useCallback(
    (nextPage: number) => {
      queryClient.prefetchQuery({
        queryKey: [queryType, { ...filters, page: nextPage }],
        queryFn: async () => {
          const response = await apiClient.get(`/api/${queryType}`, {
            params: { ...filters, page: nextPage },
          });
          return response.data;
        },
        staleTime: STALE_TIME.SCREENER,
      });

      console.log(`🔮 Prefetched page ${nextPage}`);
    },
    [queryClient, queryType, filters]
  );

  return prefetchNext;
}

/**
 * Prefetch on route navigation
 *
 * Usage in route components:
 * usePrefetchOnNavigate('/stock/:symbol', (params) => {
 *   return queryKeys.stockDetail(params.symbol);
 * });
 */
export function usePrefetchOnNavigate(
  route: string,
  getQueryKey: (params: any) => any[]
) {
  const queryClient = useQueryClient();

  const prefetch = useCallback(
    (params: any) => {
      const queryKey = getQueryKey(params);

      queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          // Extract symbol from route params
          const symbol = params.symbol;
          const response = await apiClient.get(`/api/stocks/${symbol}`);
          return response.data;
        },
        staleTime: STALE_TIME.STOCK_DETAIL,
      });
    },
    [queryClient, getQueryKey]
  );

  return prefetch;
}

/**
 * Prefetch report when hovering over report card
 */
export function usePrefetchReport() {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prefetch = useCallback(
    (reportId: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const cacheKey = queryKeys.report(reportId);
        const cachedData = queryClient.getQueryData(cacheKey);

        if (!cachedData) {
          queryClient.prefetchQuery({
            queryKey: cacheKey,
            queryFn: async () => {
              const response = await apiClient.get(`/api/reports/${reportId}`);
              return response.data;
            },
            staleTime: STALE_TIME.REPORTS,
          });

          console.log(`🔮 Prefetched report: ${reportId}`);
        }
      }, 500);
    },
    [queryClient]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { prefetch, cancel };
}

export default {
  usePrefetchStock,
  usePrefetchStockList,
  usePrefetchNextPage,
  usePrefetchOnNavigate,
  usePrefetchReport,
};
