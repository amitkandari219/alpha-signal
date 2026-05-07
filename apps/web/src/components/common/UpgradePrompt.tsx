/**
 * UpgradePrompt Component
 *
 * Shows upgrade prompts when users hit tier-gated features
 * 3 variants: inline, modal, toast
 */

import { Lock, X, Sparkles, TrendingUp, Shield } from 'lucide-react';
import clsx from 'clsx';
import { FeatureKey } from '../../hooks/useFeatureGate';
import { analytics, AnalyticsEvents } from '../../services/analytics';

interface UpgradePromptProps {
  feature: FeatureKey | string;
  variant?: 'inline' | 'modal' | 'toast';
  requiredTier: 'PRO' | 'PREMIUM';
  message?: string;
  onClose?: () => void;
  onDismiss?: () => void;
  onUpgrade?: () => void;
}

// Feature-specific benefits
const FEATURE_BENEFITS: Record<string, string[]> = {
  ai_summary_full: [
    'Complete AI-powered business analysis',
    'Growth drivers and competitive positioning',
    'Key insights and investment thesis',
  ],
  tailwind_engine: [
    'AI-powered growth catalyst detection',
    'Market opportunity analysis',
    'Future trends and tailwinds',
  ],
  risk_dashboard_full: [
    'Comprehensive vulnerability analysis',
    'Red flags and warning signals',
    'Risk scoring across multiple dimensions',
  ],
  fundamentals_full: [
    'All financial ratios and metrics',
    'Historical trends and comparisons',
    'Peer benchmarking',
  ],
  technicals_full: [
    'Advanced technical indicators (SMA, EMA, RSI, MACD)',
    'Support and resistance levels',
    'Chart pattern recognition',
  ],
  alerts: [
    'Set price target alerts',
    'Get notified on your terms',
    'Track up to 10 stocks',
  ],
  portfolio: [
    'Track your investments',
    'Real-time P&L calculations',
    'Performance analytics',
  ],
  screener_unlimited: [
    'Use up to 15 filters (Pro) or unlimited (Premium)',
    'See all matching results',
    'Export data to CSV',
  ],
  watchlist_multiple: [
    'Create up to 5 watchlists (Pro)',
    'Track up to 50 stocks per list',
    'Organize by strategy or sector',
  ],
};

// Pricing info
const TIER_PRICING = {
  PRO: { price: '₹999', period: '/month', annual: '₹9,999/year (2 months free)' },
  PREMIUM: { price: '₹2,499', period: '/month', annual: '₹24,999/year (2 months free)' },
};

export function UpgradePrompt({
  feature,
  variant = 'modal',
  requiredTier,
  message,
  onClose,
  onDismiss,
  onUpgrade,
}: UpgradePromptProps) {
  const benefits = FEATURE_BENEFITS[feature] || [
    'Access to advanced analytics',
    'Real-time data and insights',
    'Priority support',
  ];

  const pricing = TIER_PRICING[requiredTier];

  // Support both onClose and onDismiss for backward compatibility
  const handleClose = onClose || onDismiss;

  const handleUpgrade = () => {
    // Track upgrade click
    analytics.trackUpgradeClicked(
      variant === 'inline' ? 'inline_prompt' : variant === 'modal' ? 'modal_prompt' : 'toast_prompt',
      requiredTier
    );

    if (onUpgrade) {
      onUpgrade();
    } else {
      // Navigate to pricing page
      window.location.href = '/pricing';
    }
  };

  // INLINE VARIANT - Used in panels
  if (variant === 'inline') {
    return (
      <div className="relative rounded-lg border border-gradient-to-r from-purple-500/20 to-blue-500/20 bg-gradient-to-br from-purple-900/10 to-blue-900/10 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Upgrade to {requiredTier} to unlock this feature
            </h3>
            <p className="text-sm text-neutral-300 mb-4">
              {message || `Get access to advanced analytics and insights`}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpgrade}
                className="px-4 py-2 bg-signal-blue hover:bg-signal-blue/90 text-white rounded-lg font-medium transition-colors"
              >
                See Plans
              </button>
              <div className="text-sm text-neutral-400">
                Starting at {pricing.price}{pricing.period}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MODAL VARIANT - Used for blocked features
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-2xl mx-4 bg-bg-secondary rounded-xl border border-border-primary shadow-2xl">
          {/* Close button */}
          {handleClose && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          {/* Header */}
          <div className="p-8 border-b border-border-primary">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                {feature === 'tailwind_engine' ? (
                  <TrendingUp className="w-8 h-8 text-white" />
                ) : feature.includes('risk') ? (
                  <Shield className="w-8 h-8 text-white" />
                ) : (
                  <Sparkles className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  This is a {requiredTier} feature
                </h2>
                <p className="text-neutral-400 mt-1">
                  {message || 'Upgrade to unlock advanced capabilities'}
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="p-8">
            <h3 className="text-lg font-semibold text-white mb-4">What you'll get:</h3>
            <ul className="space-y-3 mb-6">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success-500/20 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-success-500" />
                  </div>
                  <span className="text-neutral-300">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Pricing */}
            <div className="bg-bg-tertiary rounded-lg p-4 mb-6">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-white">{pricing.price}</span>
                <span className="text-neutral-400">{pricing.period}</span>
              </div>
              <div className="text-sm text-neutral-400">{pricing.annual}</div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleUpgrade}
                className="flex-1 px-6 py-3 bg-signal-blue hover:bg-signal-blue/90 text-white rounded-lg font-semibold transition-colors"
              >
                Upgrade to {requiredTier}
              </button>
              {handleClose && (
                <button
                  onClick={handleClose}
                  className="px-6 py-3 border border-border-primary hover:bg-bg-tertiary text-neutral-300 rounded-lg font-medium transition-colors"
                >
                  Maybe Later
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TOAST VARIANT - Used for limits
  if (variant === 'toast') {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-96 bg-bg-secondary rounded-lg border border-border-primary shadow-xl animate-slide-in-right">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-warning-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-warning-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium mb-2">
                {message || `You've reached the free tier limit`}
              </p>
              <button
                onClick={handleUpgrade}
                className="text-sm text-signal-blue hover:underline font-medium"
              >
                Upgrade to {requiredTier}
              </button>
            </div>
            {handleClose && (
              <button
                onClick={handleClose}
                className="flex-shrink-0 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
