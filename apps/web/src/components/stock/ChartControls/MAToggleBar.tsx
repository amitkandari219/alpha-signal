/**
 * Moving Average Toggle Bar Component
 *
 * Toggles for SMA, EMA, VWAP, and Bollinger Bands overlays
 * With tier-based access control
 */

import React, { useState } from 'react';
import { MAType, useChartStore } from '../../../store/useChartStore';
import { MA_COLORS } from '../../../utils/chartHelpers';
import { useAuthStore } from '../../../store/useAuthStore';
import { SubscriptionTier } from '../../../hooks/useFeatureGate';
import { LockBadge } from '../../common/LockBadge';
import { UpgradePrompt } from '../../common/UpgradePrompt';

interface MAToggleBarProps {
  className?: string;
}

const MA_OPTIONS: Array<{
  value: MAType;
  label: string;
  color: string;
  requiredTier: SubscriptionTier;
}> = [
  { value: 'sma20', label: 'SMA 20', color: MA_COLORS.sma20, requiredTier: 'PRO' },
  { value: 'sma50', label: 'SMA 50', color: MA_COLORS.sma50, requiredTier: 'PRO' },
  { value: 'sma100', label: 'SMA 100', color: MA_COLORS.sma100, requiredTier: 'PRO' },
  { value: 'sma200', label: 'SMA 200', color: MA_COLORS.sma200, requiredTier: 'FREE' },
  { value: 'ema20', label: 'EMA 20', color: MA_COLORS.ema20, requiredTier: 'PRO' },
  { value: 'vwap', label: 'VWAP', color: MA_COLORS.vwap, requiredTier: 'PRO' },
  { value: 'bb', label: 'BB (20,2)', color: MA_COLORS.bb, requiredTier: 'PRO' },
];

export const MAToggleBar: React.FC<MAToggleBarProps> = ({ className = '' }) => {
  const activeMAs = useChartStore((state) => state.activeMAs);
  const toggleMA = useChartStore((state) => state.toggleMA);
  const { user } = useAuthStore();
  const userTier: SubscriptionTier = (user?.tier as SubscriptionTier) || 'FREE';

  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Tier rank for comparison
  const tierRank = { FREE: 0, PRO: 1, PREMIUM: 2 };

  const handleMAClick = (ma: MAType, requiredTier: SubscriptionTier) => {
    const hasAccess = tierRank[userTier] >= tierRank[requiredTier];

    if (hasAccess) {
      toggleMA(ma);
    } else {
      setShowUpgradePrompt(true);
    }
  };

  return (
    <>
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        <span className="text-xs text-text-muted font-medium">Moving Averages:</span>
        {MA_OPTIONS.map((ma) => {
          const isActive = activeMAs[ma.value];
          const hasAccess = tierRank[userTier] >= tierRank[ma.requiredTier];

          return (
            <button
              key={ma.value}
              onClick={() => handleMAClick(ma.value, ma.requiredTier)}
              disabled={!hasAccess && !isActive}
              className={`
                px-2.5 py-1 rounded-md text-xs font-medium transition-all
                flex items-center gap-1.5
                ${
                  isActive
                    ? 'bg-bg-secondary text-text-primary border border-current'
                    : hasAccess
                    ? 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary hover:text-text-primary'
                    : 'bg-bg-tertiary text-text-muted cursor-not-allowed opacity-60'
                }
              `}
              style={
                isActive
                  ? {
                      borderColor: ma.color,
                      color: ma.color,
                    }
                  : undefined
              }
              title={hasAccess ? `Toggle ${ma.label}` : `${ma.label} - PRO feature`}
            >
              {/* Color indicator dot */}
              {isActive && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ma.color }}
                />
              )}
              <span>{ma.label}</span>
              {!hasAccess && <LockBadge tier="PRO" size="sm" />}
            </button>
          );
        })}
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt
          feature="Advanced Moving Averages"
          requiredTier="PRO"
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
    </>
  );
};
