/**
 * useFeatureGate Hook
 *
 * Checks if the current user has access to a feature based on their tier
 */

import { useAuthStore } from '../store/useAuthStore';

export type SubscriptionTier = 'FREE' | 'PRO' | 'PREMIUM';

export type FeatureKey =
  | 'ai_summary_full'
  | 'ai_summary_business_overview'
  | 'fundamentals_full'
  | 'fundamentals_basic'
  | 'technicals_full'
  | 'technicals_trend_only'
  | 'news_sentiment_full'
  | 'news_headlines_only'
  | 'tailwind_engine'
  | 'risk_dashboard_full'
  | 'risk_quality_score'
  | 'screener_unlimited'
  | 'screener_basic'
  | 'watchlist_multiple'
  | 'watchlist_single'
  | 'alerts'
  | 'portfolio'
  | 'api_access'
  | 'data_export'
  | 'custom_alerts'
  | 'profile_full'
  | 'profile_business_model';

// Feature requirements mapping
const FEATURE_GATES: Record<FeatureKey, SubscriptionTier> = {
  ai_summary_full: 'PRO',
  ai_summary_business_overview: 'FREE',
  fundamentals_full: 'PRO',
  fundamentals_basic: 'FREE',
  technicals_full: 'PRO',
  technicals_trend_only: 'FREE',
  news_sentiment_full: 'PRO',
  news_headlines_only: 'FREE',
  tailwind_engine: 'PRO',
  risk_dashboard_full: 'PRO',
  risk_quality_score: 'FREE',
  screener_unlimited: 'PRO',
  screener_basic: 'FREE',
  watchlist_multiple: 'PRO',
  watchlist_single: 'FREE',
  alerts: 'PRO',
  portfolio: 'PRO',
  api_access: 'PREMIUM',
  data_export: 'PRO',
  custom_alerts: 'PREMIUM',
  profile_full: 'PRO',
  profile_business_model: 'FREE',
};

// Feature display names
const FEATURE_NAMES: Record<FeatureKey, string> = {
  ai_summary_full: 'Full AI Analysis',
  ai_summary_business_overview: 'AI Business Overview',
  fundamentals_full: 'Complete Fundamentals',
  fundamentals_basic: 'Basic Fundamentals',
  technicals_full: 'Advanced Technical Analysis',
  technicals_trend_only: 'Trend Status',
  news_sentiment_full: 'AI Sentiment Analysis',
  news_headlines_only: 'News Headlines',
  tailwind_engine: 'Tailwind Engine',
  risk_dashboard_full: 'Complete Risk Analysis',
  risk_quality_score: 'Quality Score',
  screener_unlimited: 'Unlimited Screener',
  screener_basic: 'Basic Screener',
  watchlist_multiple: 'Multiple Watchlists',
  watchlist_single: 'Single Watchlist',
  alerts: 'Price Alerts',
  portfolio: 'Portfolio Tracking',
  api_access: 'API Access',
  data_export: 'Data Export',
  custom_alerts: 'Custom Alerts',
  profile_full: 'Complete Company Profile',
  profile_business_model: 'Business Model',
};

export function useFeatureGate(feature: FeatureKey) {
  const { user } = useAuthStore();

  const userTier: SubscriptionTier = (user?.tier as SubscriptionTier) || 'FREE';
  const requiredTier = FEATURE_GATES[feature];
  const featureName = FEATURE_NAMES[feature];

  const tierRank = { FREE: 0, PRO: 1, PREMIUM: 2 };
  const userRank = tierRank[userTier];
  const requiredRank = tierRank[requiredTier];

  const hasAccess = userRank >= requiredRank;

  return {
    hasAccess,
    userTier,
    requiredTier,
    featureName,
    showUpgrade: !hasAccess,
  };
}

/**
 * Get tier limits for screener
 */
export function useScreenerLimits() {
  const { user } = useAuthStore();
  const tier: SubscriptionTier = (user?.tier as SubscriptionTier) || 'FREE';

  switch (tier) {
    case 'FREE':
      return { maxFilters: 5, maxResults: 20, canExport: false };
    case 'PRO':
      return { maxFilters: 15, maxResults: Infinity, canExport: true };
    case 'PREMIUM':
      return { maxFilters: Infinity, maxResults: Infinity, canExport: true };
  }
}

/**
 * Get tier limits for watchlists
 */
export function useWatchlistLimits() {
  const { user } = useAuthStore();
  const tier: SubscriptionTier = (user?.tier as SubscriptionTier) || 'FREE';

  switch (tier) {
    case 'FREE':
      return { maxWatchlists: 1, maxStocksPerWatchlist: 10 };
    case 'PRO':
      return { maxWatchlists: 5, maxStocksPerWatchlist: 50 };
    case 'PREMIUM':
      return { maxWatchlists: Infinity, maxStocksPerWatchlist: Infinity };
  }
}

/**
 * Get tier limits for alerts
 */
export function useAlertLimits() {
  const { user } = useAuthStore();
  const tier: SubscriptionTier = (user?.tier as SubscriptionTier) || 'FREE';

  switch (tier) {
    case 'FREE':
      return { maxAlerts: 0, canCreateCustom: false };
    case 'PRO':
      return { maxAlerts: 10, canCreateCustom: false };
    case 'PREMIUM':
      return { maxAlerts: Infinity, canCreateCustom: true };
  }
}
