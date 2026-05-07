/**
 * Chart Type Selector Component
 *
 * Allows user to switch between Line, Candlestick, Area, and Heikin-Ashi chart types
 */

import React, { useState } from 'react';
import { TrendingUp, CandlestickChart, AreaChart, Hexagon, Lock } from 'lucide-react';
import { ChartType, useChartStore } from '../../../store/useChartStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { SubscriptionTier } from '../../../hooks/useFeatureGate';
import { UpgradePrompt } from '../../common/UpgradePrompt';

interface ChartTypeSelectorProps {
  className?: string;
}

const CHART_TYPES = [
  {
    value: 'line' as ChartType,
    label: 'Line',
    icon: TrendingUp,
    minTier: 'FREE' as SubscriptionTier,
  },
  {
    value: 'candle' as ChartType,
    label: 'Candle',
    icon: CandlestickChart,
    minTier: 'PRO' as SubscriptionTier,
  },
  {
    value: 'area' as ChartType,
    label: 'Area',
    icon: AreaChart,
    minTier: 'FREE' as SubscriptionTier,
  },
  {
    value: 'heikinAshi' as ChartType,
    label: 'Heikin-Ashi',
    icon: Hexagon,
    minTier: 'PRO' as SubscriptionTier,
  },
];

export const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({ className = '' }) => {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const chartType = useChartStore((state) => state.chartType);
  const setChartType = useChartStore((state) => state.setChartType);
  const { user } = useAuthStore();

  const userTier: SubscriptionTier = (user?.tier as SubscriptionTier) || 'FREE';
  const tierRank = { FREE: 0, PRO: 1, PREMIUM: 2 };

  const hasAccess = (minTier: SubscriptionTier) => {
    return tierRank[userTier] >= tierRank[minTier];
  };

  const handleSelect = (type: ChartType, minTier: SubscriptionTier) => {
    if (!hasAccess(minTier)) {
      setShowUpgradePrompt(true);
      return;
    }
    setChartType(type);
  };

  return (
    <>
      <div className={`flex items-center gap-1 ${className}`}>
        {CHART_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = chartType === type.value;
          const isLocked = !hasAccess(type.minTier);

          return (
            <button
              key={type.value}
              onClick={() => handleSelect(type.value, type.minTier)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                flex items-center gap-1.5
                ${
                  isActive
                    ? 'bg-accent-blue text-white'
                    : isLocked
                    ? 'bg-bg-tertiary text-text-muted cursor-pointer opacity-50 hover:opacity-70'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary hover:text-text-primary'
                }
              `}
              title={
                isLocked
                  ? `${type.label} chart requires ${type.minTier} plan`
                  : `Switch to ${type.label} chart`
              }
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              <span>{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt
          feature="Advanced Chart Types"
          requiredTier="PRO"
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
    </>
  );
};
