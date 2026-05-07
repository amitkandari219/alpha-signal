/**
 * Indicator Panel Component
 *
 * Dropdown panel for selecting technical indicators (max 3 active)
 * Includes tier gating: FREE = RSI only, PRO+ = all indicators
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Lock, Check } from 'lucide-react';
import { IndicatorType, useChartStore } from '../../../store/useChartStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { SubscriptionTier } from '../../../hooks/useFeatureGate';
import { UpgradePrompt } from '../../common/UpgradePrompt';

interface IndicatorPanelProps {
  className?: string;
  maxActive?: number;
}

const INDICATORS: Array<{
  value: IndicatorType;
  label: string;
  description: string;
  minTier: SubscriptionTier;
}> = [
  {
    value: 'rsi',
    label: 'RSI (14)',
    description: 'Relative Strength Index',
    minTier: 'FREE',
  },
  {
    value: 'macd',
    label: 'MACD (12,26,9)',
    description: 'Moving Average Convergence Divergence',
    minTier: 'PRO',
  },
  {
    value: 'stochastic',
    label: 'Stochastic (14,3)',
    description: 'Stochastic Oscillator',
    minTier: 'PRO',
  },
  {
    value: 'adx',
    label: 'ADX (14)',
    description: 'Average Directional Index',
    minTier: 'PRO',
  },
  {
    value: 'obv',
    label: 'OBV',
    description: 'On-Balance Volume',
    minTier: 'PRO',
  },
  {
    value: 'atr',
    label: 'ATR (14)',
    description: 'Average True Range',
    minTier: 'PRO',
  },
];

export const IndicatorPanel: React.FC<IndicatorPanelProps> = ({
  className = '',
  maxActive = 3,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeIndicators = useChartStore((state) => state.activeIndicators);
  const toggleIndicator = useChartStore((state) => state.toggleIndicator);
  const { user } = useAuthStore();

  const userTier: SubscriptionTier = (user?.tier as SubscriptionTier) || 'FREE';
  const tierRank = { FREE: 0, PRO: 1, PREMIUM: 2 };

  const hasAccess = (minTier: SubscriptionTier) => {
    return tierRank[userTier] >= tierRank[minTier];
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (indicator: IndicatorType, minTier: SubscriptionTier) => {
    if (!hasAccess(minTier)) {
      setShowUpgradePrompt(true);
      return;
    }

    const success = toggleIndicator(indicator);

    if (!success && !activeIndicators.includes(indicator)) {
      // Max limit reached
      alert(`Maximum ${maxActive} indicators allowed`);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          px-3 py-1.5 rounded-lg text-sm font-medium
          bg-bg-tertiary text-text-secondary
          hover:bg-bg-primary hover:text-text-primary
          transition-all flex items-center gap-2
        "
      >
        <span>Indicators</span>
        {activeIndicators.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-accent-blue text-white text-xs">
            {activeIndicators.length}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="
            absolute top-full mt-2 right-0 z-50
            w-80 bg-bg-secondary border border-border-default rounded-lg shadow-xl
            overflow-hidden
          "
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border-default">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                Technical Indicators
              </h3>
              <span className="text-xs text-text-muted">
                {activeIndicators.length}/{maxActive} active
              </span>
            </div>
          </div>

          {/* Indicator List */}
          <div className="max-h-80 overflow-y-auto">
            {INDICATORS.map((indicator) => {
              const isActive = activeIndicators.includes(indicator.value);
              const isLocked = !hasAccess(indicator.minTier);

              return (
                <button
                  key={indicator.value}
                  onClick={() => handleToggle(indicator.value, indicator.minTier)}
                  className={`
                    w-full px-4 py-3 text-left transition-colors
                    flex items-start gap-3
                    ${
                      isLocked
                        ? 'opacity-50 cursor-pointer hover:opacity-70'
                        : 'hover:bg-bg-tertiary cursor-pointer'
                    }
                  `}
                >
                  {/* Checkbox / Lock */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-text-muted" />
                    ) : (
                      <div
                        className={`
                          w-4 h-4 rounded border flex items-center justify-center
                          ${
                            isActive
                              ? 'bg-accent-blue border-accent-blue'
                              : 'border-border-default'
                          }
                        `}
                      >
                        {isActive && <Check className="w-3 h-3 text-white" />}
                      </div>
                    )}
                  </div>

                  {/* Label & Description */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          isActive ? 'text-text-primary' : 'text-text-secondary'
                        }`}
                      >
                        {indicator.label}
                      </span>
                      {isLocked && (
                        <span className="text-xs text-accent-blue font-medium">
                          {indicator.minTier}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {indicator.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {userTier === 'FREE' && (
            <div className="px-4 py-3 border-t border-border-default bg-bg-tertiary">
              <p className="text-xs text-text-muted">
                Upgrade to <span className="text-accent-blue font-semibold">PRO</span> to
                unlock all indicators
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt
          feature="Advanced Indicators"
          requiredTier="PRO"
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
    </div>
  );
};
