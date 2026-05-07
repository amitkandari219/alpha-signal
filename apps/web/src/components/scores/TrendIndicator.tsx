/**
 * Trend Indicator Component
 *
 * 5-segment horizontal bar with arrow pointer showing trend strength
 * Segments: strong downtrend, downtrend, sideways, uptrend, strong uptrend
 */

import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export type TrendType = 'strong_downtrend' | 'downtrend' | 'sideways' | 'uptrend' | 'strong_uptrend';

export interface TrendIndicatorProps {
  trend: TrendType;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({ trend }) => {
  // Segment definitions
  const segments = [
    { key: 'strong_downtrend', label: 'Strong Downtrend', color: 'bg-red-700', icon: ArrowDown },
    { key: 'downtrend', label: 'Downtrend', color: 'bg-red-500', icon: ArrowDown },
    { key: 'sideways', label: 'Sideways', color: 'bg-signal-yellow', icon: Minus },
    { key: 'uptrend', label: 'Uptrend', color: 'bg-green-500', icon: ArrowUp },
    { key: 'strong_uptrend', label: 'Strong Uptrend', color: 'bg-green-700', icon: ArrowUp },
  ];

  // Find current segment index
  const currentIndex = segments.findIndex((s) => s.key === trend);
  const currentSegment = segments[currentIndex];
  const Icon = currentSegment.icon;

  return (
    <div className="space-y-2">
      {/* Segment bar */}
      <div className="flex gap-1 h-8">
        {segments.map((segment, index) => {
          const isCurrent = index === currentIndex;

          return (
            <div
              key={segment.key}
              className={`flex-1 rounded transition-all duration-300 ${segment.color} ${
                isCurrent ? 'scale-y-125 opacity-100' : 'opacity-40 scale-y-100'
              }`}
              style={{
                transformOrigin: 'center',
              }}
            />
          );
        })}
      </div>

      {/* Arrow pointer */}
      <div className="relative h-6">
        <div
          className="absolute transition-all duration-300"
          style={{
            left: `calc(${(currentIndex / (segments.length - 1)) * 100}% - 12px)`,
          }}
        >
          <div className="flex items-center justify-center w-6 h-6 bg-bg-secondary border-2 border-text-primary rounded-full">
            <Icon className="w-4 h-4 text-text-primary" />
          </div>
        </div>
      </div>

      {/* Text label */}
      <div className="text-center">
        <span className="text-sm font-medium text-text-primary">{currentSegment.label}</span>
      </div>
    </div>
  );
};

export default TrendIndicator;
