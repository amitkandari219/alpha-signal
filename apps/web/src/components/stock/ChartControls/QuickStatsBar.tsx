/**
 * Quick Stats Bar Component
 *
 * Displays OHLC, 52W High/Low, Volume, and P/E ratio
 */

import React from 'react';
import { formatVolume, formatPrice } from '../../../utils/chartHelpers';

interface QuickStatsBarProps {
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  week52: {
    high: number;
    low: number;
  };
  avgVolume: number;
  peRatio?: number;
  currentPrice: number;
  className?: string;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({
  ohlc,
  week52,
  avgVolume,
  peRatio,
  currentPrice,
  className = '',
}) => {
  // Check if current price is within 5% of 52W high/low
  const isNear52WHigh = currentPrice >= week52.high * 0.95;
  const isNear52WLow = currentPrice <= week52.low * 1.05;

  const stats = [
    { label: 'Open', value: formatPrice(ohlc.open), highlight: false },
    { label: 'High', value: formatPrice(ohlc.high), highlight: false },
    { label: 'Low', value: formatPrice(ohlc.low), highlight: false },
    { label: 'Close', value: formatPrice(ohlc.close), highlight: false },
    {
      label: '52W High',
      value: formatPrice(week52.high),
      highlight: isNear52WHigh,
      highlightColor: 'text-signal-green',
    },
    {
      label: '52W Low',
      value: formatPrice(week52.low),
      highlight: isNear52WLow,
      highlightColor: 'text-signal-red',
    },
    { label: 'Avg Volume', value: formatVolume(avgVolume), highlight: false },
  ];

  if (peRatio !== undefined) {
    stats.push({
      label: 'P/E Ratio',
      value: peRatio.toFixed(2),
      highlight: false,
    });
  }

  return (
    <div
      className={`
        flex items-center gap-4 overflow-x-auto py-2 px-1
        scrollbar-thin scrollbar-thumb-border-default scrollbar-track-transparent
        ${className}
      `}
    >
      {stats.map((stat, index) => (
        <div
          key={index}
          className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
        >
          <span className="text-xs text-text-muted font-medium">{stat.label}:</span>
          <span
            className={`text-xs font-semibold ${
              stat.highlight ? stat.highlightColor : 'text-text-primary'
            }`}
          >
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
};
