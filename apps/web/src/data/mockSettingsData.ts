/**
 * Mock Settings & Billing Data
 *
 * User settings, preferences, API keys, and billing information
 */

export interface UserProfile {
  name: string;
  email: string;
  emailVerified: boolean;
}

export interface UserPreferences {
  defaultWatchlist: string;
  defaultScreenerPreset: string;
  notificationsInApp: boolean;
  notificationsEmail: boolean;
  theme: 'dark' | 'light';
  defaultChartPeriod: string;
  defaultTablePageSize: number;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed: Date | null;
  callsToday: number;
}

export interface APIUsageStats {
  callsToday: number;
  dailyLimit: number;
}

export interface PlanFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  premium: boolean | string;
}

export interface BillingPlan {
  tier: 'free' | 'pro' | 'premium';
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'annual';
  features: string[];
}

export interface Invoice {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  downloadUrl: string;
}

// Mock User Profile
export const userProfile: UserProfile = {
  name: 'Amit Kandari',
  email: 'amit@example.com',
  emailVerified: true,
};

// Mock User Preferences
export const userPreferences: UserPreferences = {
  defaultWatchlist: 'My Watchlist',
  defaultScreenerPreset: 'Value Stocks',
  notificationsInApp: true,
  notificationsEmail: false,
  theme: 'dark',
  defaultChartPeriod: '1M',
  defaultTablePageSize: 50,
};

// Mock API Keys
export const apiKeys: APIKey[] = [
  {
    id: '1',
    name: 'Production API',
    key: 'sk_live_1234567890abcdef',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    callsToday: 1247,
  },
  {
    id: '2',
    name: 'Development API',
    key: 'sk_test_abcdef1234567890',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    callsToday: 42,
  },
];

// Mock API Usage Stats
export const apiUsageStats: APIUsageStats = {
  callsToday: 1289,
  dailyLimit: 10000,
};

// Watchlist Options
export const watchlistOptions = [
  'My Watchlist',
  'Tech Stocks',
  'Banking Stocks',
  'Large Cap',
  'Mid Cap',
];

// Screener Preset Options
export const screenerPresetOptions = [
  'Value Stocks',
  'Growth Stocks',
  'High Dividend',
  'Small Cap Growth',
  'Quality Large Caps',
];

// Chart Period Options
export const chartPeriodOptions = [
  { value: '1D', label: '1 Day' },
  { value: '1W', label: '1 Week' },
  { value: '1M', label: '1 Month' },
  { value: '3M', label: '3 Months' },
  { value: '6M', label: '6 Months' },
  { value: '1Y', label: '1 Year' },
  { value: 'ALL', label: 'All Time' },
];

// Table Page Size Options
export const tablePageSizeOptions = [25, 50, 100, 200];

// Plan Features Comparison
export const planFeatures: PlanFeature[] = [
  {
    name: 'Stock screener filters',
    free: '5 filters',
    pro: '15 filters',
    premium: 'Unlimited',
  },
  {
    name: 'Watchlists',
    free: '1 watchlist',
    pro: '5 watchlists',
    premium: 'Unlimited',
  },
  {
    name: 'Price alerts',
    free: false,
    pro: '10 alerts',
    premium: 'Unlimited',
  },
  {
    name: 'Advanced alerts (volume, sentiment, risk)',
    free: false,
    pro: false,
    premium: true,
  },
  {
    name: 'Portfolio tracking',
    free: false,
    pro: false,
    premium: true,
  },
  {
    name: 'AI insights',
    free: false,
    pro: 'Basic',
    premium: 'Advanced',
  },
  {
    name: 'Historical data',
    free: '1 year',
    pro: '5 years',
    premium: 'Unlimited',
  },
  {
    name: 'API access',
    free: false,
    pro: false,
    premium: '10K calls/day',
  },
  {
    name: 'Export data',
    free: false,
    pro: 'CSV',
    premium: 'CSV, Excel, PDF',
  },
  {
    name: 'Priority support',
    free: false,
    pro: false,
    premium: true,
  },
];

// Current User Plan
export const currentUserPlan: BillingPlan = {
  tier: 'pro',
  name: 'Pro',
  price: 499,
  billingPeriod: 'monthly',
  features: [
    '15 screener filters',
    '5 watchlists',
    '10 price alerts',
    'Basic AI insights',
    '5 years historical data',
    'CSV export',
  ],
};

// Plan renewal date
export const planRenewalDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 18); // 18 days from now

// Mock Billing History (Invoices)
export const invoices: Invoice[] = [
  {
    id: 'INV-2026-001',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12), // 12 days ago
    amount: 499,
    status: 'paid',
    downloadUrl: '#',
  },
  {
    id: 'INV-2025-012',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 42), // ~1.5 months ago
    amount: 499,
    status: 'paid',
    downloadUrl: '#',
  },
  {
    id: 'INV-2025-011',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 72), // ~2.5 months ago
    amount: 499,
    status: 'paid',
    downloadUrl: '#',
  },
  {
    id: 'INV-2025-010',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 102), // ~3.5 months ago
    amount: 499,
    status: 'paid',
    downloadUrl: '#',
  },
];

// Tier configuration
export const tierLimits = {
  free: {
    canAccessAPIKeys: false,
  },
  pro: {
    canAccessAPIKeys: false,
  },
  premium: {
    canAccessAPIKeys: true,
  },
};

export const currentUserTier: 'free' | 'pro' | 'premium' = 'pro'; // Change to test different tiers
