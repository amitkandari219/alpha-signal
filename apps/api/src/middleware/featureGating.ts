/**
 * Feature Gating Middleware
 *
 * Tier-based access control for GraphQL fields
 */

export type SubscriptionTier = 'FREE' | 'PRO' | 'PREMIUM';

export interface UpgradePrompt {
  data: null;
  upgradeRequired: true;
  requiredTier: 'PRO' | 'PREMIUM';
  message: string;
}

// Feature definitions with required tiers
export const FEATURE_GATES = {
  // AI Summary features
  ai_summary_full: 'PRO',
  ai_summary_business_overview: 'FREE',

  // Fundamentals features
  fundamentals_full: 'PRO',
  fundamentals_basic: 'FREE', // ROE, ROCE, OPM only

  // Technicals features
  technicals_full: 'PRO',
  technicals_trend_only: 'FREE',

  // News & Sentiment
  news_sentiment_full: 'PRO',
  news_headlines_only: 'FREE',

  // Advanced features
  tailwind_engine: 'PRO',
  risk_dashboard_full: 'PRO',
  risk_quality_score: 'FREE',

  // Screener limits
  screener_unlimited: 'PRO',
  screener_basic: 'FREE', // 5 filters, 20 results

  // Watchlists
  watchlist_multiple: 'PRO',
  watchlist_single: 'FREE',

  // Premium features
  alerts: 'PRO',
  portfolio: 'PRO',
  api_access: 'PREMIUM',
  data_export: 'PRO',
  custom_alerts: 'PREMIUM',
} as const;

/**
 * Check if user has access to a feature
 */
export function hasFeatureAccess(
  userTier: SubscriptionTier,
  feature: keyof typeof FEATURE_GATES
): boolean {
  const requiredTier = FEATURE_GATES[feature];

  const tierRank = { FREE: 0, PRO: 1, PREMIUM: 2 };
  const userRank = tierRank[userTier];
  const requiredRank = tierRank[requiredTier as SubscriptionTier];

  return userRank >= requiredRank;
}

/**
 * Create upgrade prompt for gated feature
 */
export function createUpgradePrompt(
  feature: keyof typeof FEATURE_GATES,
  customMessage?: string
): UpgradePrompt {
  const requiredTier = FEATURE_GATES[feature] as 'PRO' | 'PREMIUM';

  const defaultMessages: Record<string, string> = {
    ai_summary_full: 'Upgrade to Pro to unlock full AI-powered analysis with key insights, growth drivers, and competitive positioning.',
    fundamentals_full: 'Upgrade to Pro to access complete fundamental analysis including all financial ratios and metrics.',
    technicals_full: 'Upgrade to Pro to unlock advanced technical indicators including SMA, EMA, RSI, MACD, and Bollinger Bands.',
    news_sentiment_full: 'Upgrade to Pro to get AI-powered sentiment analysis and news digest.',
    tailwind_engine: 'Upgrade to Pro to access the Tailwind Engine - AI-powered analysis of growth catalysts and market opportunities.',
    risk_dashboard_full: 'Upgrade to Pro to unlock the complete Risk Dashboard with detailed vulnerability analysis.',
    screener_unlimited: 'Upgrade to Pro to remove screener limits - use unlimited filters and see all results.',
    watchlist_multiple: 'Upgrade to Pro to create up to 5 watchlists with 50 stocks each.',
    alerts: 'Upgrade to Pro to set price alerts and get notified when stocks hit your target prices.',
    portfolio: 'Upgrade to Pro to track your portfolio performance with detailed analytics and insights.',
    api_access: 'Upgrade to Premium to get API access for programmatic data retrieval and integration.',
    data_export: 'Upgrade to Pro to export screener results and analysis data to CSV.',
    custom_alerts: 'Upgrade to Premium to create custom alerts based on technical indicators and fundamental metrics.',
  };

  return {
    data: null,
    upgradeRequired: true,
    requiredTier,
    message: customMessage || defaultMessages[feature] || `Upgrade to ${requiredTier} to unlock this feature.`,
  };
}

/**
 * Filter object fields based on user tier
 */
export function filterFieldsByTier<T extends Record<string, any>>(
  data: T,
  userTier: SubscriptionTier,
  fieldRestrictions: Record<string, SubscriptionTier>
): T {
  const filtered = { ...data };

  Object.keys(fieldRestrictions).forEach((field) => {
    const requiredTier = fieldRestrictions[field];
    if (!hasFeatureAccess(userTier, requiredTier as any)) {
      filtered[field] = null;
    }
  });

  return filtered;
}

/**
 * Get screener limits based on tier
 */
export function getScreenerLimits(tier: SubscriptionTier) {
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
 * Get watchlist limits based on tier
 */
export function getWatchlistLimits(tier: SubscriptionTier) {
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
 * Get alert limits based on tier
 */
export function getAlertLimits(tier: SubscriptionTier) {
  switch (tier) {
    case 'FREE':
      return { maxAlerts: 0, canCreateCustom: false };
    case 'PRO':
      return { maxAlerts: 10, canCreateCustom: false };
    case 'PREMIUM':
      return { maxAlerts: Infinity, canCreateCustom: true };
  }
}
