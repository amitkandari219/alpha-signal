/**
 * React Query Configuration
 *
 * Optimized query client with aggressive caching and prefetching
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Cache time configurations (in milliseconds)
 */
export const CACHE_TIME = {
  STOCK_DETAIL: 5 * 60 * 1000,      // 5 minutes
  STOCK_PRICE: 1 * 60 * 1000,       // 1 minute
  REPORTS: 30 * 60 * 1000,          // 30 minutes
  USER_DATA: 10 * 60 * 1000,        // 10 minutes
  SCREENER: 2 * 60 * 1000,          // 2 minutes
  DASHBOARD: 3 * 60 * 1000,         // 3 minutes
} as const;

/**
 * Stale time configurations (in milliseconds)
 * Data is considered fresh for this duration
 */
export const STALE_TIME = {
  STOCK_DETAIL: 5 * 60 * 1000,      // 5 minutes
  STOCK_PRICE: 1 * 60 * 1000,       // 1 minute
  REPORTS: 30 * 60 * 1000,          // 30 minutes
  USER_DATA: 5 * 60 * 1000,         // 5 minutes
  SCREENER: 2 * 60 * 1000,          // 2 minutes
  DASHBOARD: 2 * 60 * 1000,         // 2 minutes
} as const;

/**
 * Create optimized Query Client
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch on window focus (user tabs back to app)
      refetchOnWindowFocus: true,

      // Refetch on reconnect (internet connection restored)
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,

      // Retry failed requests 1 time
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Keep unused data in cache for 30 minutes
      cacheTime: 30 * 60 * 1000,

      // Default stale time: 5 minutes
      staleTime: 5 * 60 * 1000,

      // Suspense mode disabled by default
      suspense: false,

      // Keep previous data while fetching new data
      keepPreviousData: true,
    },
    mutations: {
      // Retry mutations 0 times (don't retry mutations by default)
      retry: 0,

      // Show error to user after failed mutation
      onError: (error: any) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
  // Stock queries
  stockDetail: (symbol: string) => ['stock', 'detail', symbol],
  stockPrice: (symbol: string) => ['stock', 'price', symbol],
  stockScores: (symbol: string) => ['stock', 'scores', symbol],
  stockChart: (symbol: string, period: string) => ['stock', 'chart', symbol, period],
  stockNews: (symbol: string) => ['stock', 'news', symbol],
  stockEvents: (symbol: string) => ['stock', 'events', symbol],

  // Screener queries
  screener: (filters: any) => ['screener', filters],

  // Dashboard queries
  dashboard: () => ['dashboard'],
  marketOverview: () => ['market', 'overview'],
  trending: () => ['trending'],

  // Portfolio queries
  portfolio: (userId: string) => ['portfolio', userId],
  watchlist: (userId: string) => ['watchlist', userId],

  // Reports queries
  reports: () => ['reports'],
  report: (id: string) => ['report', id],

  // Sector queries
  sectors: () => ['sectors'],
  sector: (id: string) => ['sector', id],

  // User queries
  user: (userId: string) => ['user', userId],
  subscription: (userId: string) => ['subscription', userId],
} as const;

export default queryClient;
