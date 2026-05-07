/**
 * Mock Alerts Data
 *
 * Alert feed, active alerts, and configuration for stock alerts
 */

export type AlertConditionType =
  | 'price_above'
  | 'price_below'
  | 'volume_spike'
  | 'sentiment_change'
  | 'risk_flag'
  | 'score_change';

export type NotificationMethod = 'in_app' | 'email' | 'both';

export interface TriggeredAlert {
  id: string;
  stockSymbol: string;
  stockName: string;
  conditionType: AlertConditionType;
  conditionDescription: string;
  currentValue: number;
  threshold: number;
  triggeredAt: Date;
  isRead: boolean;
}

export interface ActiveAlert {
  id: string;
  stockSymbol: string;
  stockName: string;
  conditionType: AlertConditionType;
  conditionSummary: string;
  threshold: number;
  isActive: boolean;
  notificationMethod: NotificationMethod;
  createdAt: Date;
}

export interface AlertTypeConfig {
  type: AlertConditionType;
  label: string;
  icon: string;
  thresholdLabel: string;
  thresholdUnit: string;
  color: string;
}

// Alert Type Configurations
export const alertTypeConfigs: AlertTypeConfig[] = [
  {
    type: 'price_above',
    label: 'Price Above',
    icon: 'trending-up',
    thresholdLabel: 'Target Price',
    thresholdUnit: '₹',
    color: 'signal-green',
  },
  {
    type: 'price_below',
    label: 'Price Below',
    icon: 'trending-down',
    thresholdLabel: 'Target Price',
    thresholdUnit: '₹',
    color: 'signal-red',
  },
  {
    type: 'volume_spike',
    label: 'Volume Spike (>2x avg)',
    icon: 'activity',
    thresholdLabel: 'Multiplier',
    thresholdUnit: 'x',
    color: 'signal-blue',
  },
  {
    type: 'sentiment_change',
    label: 'Sentiment Change (>0.3 shift)',
    icon: 'heart-pulse',
    thresholdLabel: 'Minimum Shift',
    thresholdUnit: '',
    color: 'signal-purple',
  },
  {
    type: 'risk_flag',
    label: 'New Risk Flag',
    icon: 'alert-triangle',
    thresholdLabel: 'Risk Score Threshold',
    thresholdUnit: '',
    color: 'signal-yellow',
  },
  {
    type: 'score_change',
    label: 'Score Change (>10 points)',
    icon: 'gauge',
    thresholdLabel: 'Minimum Change',
    thresholdUnit: 'pts',
    color: 'signal-orange',
  },
];

// Mock Triggered Alerts (Alert Feed) - Start with empty array for production
export const triggeredAlerts: TriggeredAlert[] = [];

// Mock Active Alerts (Configured Alerts) - Start with empty array for production
export const activeAlerts: ActiveAlert[] = [];

// Tier Limits Configuration
export const tierLimits = {
  free: {
    canAccessAlerts: false,
    maxAlerts: 0,
    allowedConditions: [] as AlertConditionType[],
  },
  pro: {
    canAccessAlerts: true,
    maxAlerts: 10,
    allowedConditions: ['price_above', 'price_below'] as AlertConditionType[],
  },
  premium: {
    canAccessAlerts: true,
    maxAlerts: Infinity,
    allowedConditions: [
      'price_above',
      'price_below',
      'volume_spike',
      'sentiment_change',
      'risk_flag',
      'score_change',
    ] as AlertConditionType[],
  },
};

export const currentUserTier: 'free' | 'pro' | 'premium' = 'pro'; // Change to test different tiers
