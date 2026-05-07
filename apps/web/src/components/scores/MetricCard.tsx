/**
 * Metric Card Component
 *
 * Compact card for displaying individual metrics with change indicator and sparkline
 * Used for ROE, ROCE, PE Ratio, etc.
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MiniSparkline } from './MiniSparkline';

export interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number; // percentage change (e.g., 5.2 = +5.2%)
  changeLabel?: string; // e.g., "vs last quarter", "YoY"
  sparklineData?: number[];
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'default';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  changeLabel,
  sparklineData,
  color = 'default',
}) => {
  // Color mapping
  const colorClasses = {
    green: 'text-signal-green',
    red: 'text-signal-red',
    blue: 'text-signal-blue',
    yellow: 'text-signal-yellow',
    default: 'text-text-primary',
  };

  const sparklineColors = {
    green: '#3CD280',
    red: '#F85149',
    blue: '#3B82F6',
    yellow: '#FBB80E',
    default: '#3B82F6',
  };

  const valueColor = colorClasses[color];
  const sparklineColor = sparklineColors[color];

  // Change indicator
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const changeColor = isPositive ? 'text-signal-green' : isNegative ? 'text-signal-red' : 'text-text-muted';

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 hover:border-border-hover transition-colors">
      {/* Label */}
      <div className="text-xs text-text-secondary mb-1">{label}</div>

      {/* Value */}
      <div className={`text-2xl font-bold ${valueColor} mb-2`}>{value}</div>

      {/* Change indicator (if provided) */}
      {change !== undefined && (
        <div className="flex items-center gap-1 mb-2">
          {isPositive && <TrendingUp className="w-4 h-4 text-signal-green" />}
          {isNegative && <TrendingDown className="w-4 h-4 text-signal-red" />}
          <span className={`text-sm font-medium ${changeColor}`}>
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-xs text-text-muted ml-1">{changeLabel}</span>
          )}
        </div>
      )}

      {/* Sparkline (if data provided) */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-2">
          <MiniSparkline
            data={sparklineData}
            width={120}
            height={24}
            color={sparklineColor}
            showLastValue
          />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
