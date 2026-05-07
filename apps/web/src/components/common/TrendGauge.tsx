/**
 * Trend Gauge Component
 *
 * Horizontal 5-zone gauge for trend visualization
 */

import React from 'react';
import { TrendStatus } from '../../data/mockTechnicalData';

interface TrendGaugeProps {
  status: TrendStatus;
  position: number; // 0-100
  description: string;
}

export const TrendGauge: React.FC<TrendGaugeProps> = ({ status, position, description }) => {
  const zones = [
    { label: 'Strong Down', color: '#EF5350', range: [0, 20] },
    { label: 'Downtrend', color: '#FF8A80', range: [20, 40] },
    { label: 'Sideways', color: '#FFC107', range: [40, 60] },
    { label: 'Uptrend', color: '#81C784', range: [60, 80] },
    { label: 'Strong Up', color: '#26A69A', range: [80, 100] },
  ];

  return (
    <div className="space-y-3">
      {/* Gauge */}
      <div className="relative">
        {/* Zone bars */}
        <div className="flex h-12 rounded-lg overflow-hidden border border-border-primary">
          {zones.map((zone, idx) => (
            <div
              key={idx}
              className="flex-1 relative"
              style={{ backgroundColor: zone.color }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white/80">
                {zone.label}
              </div>
            </div>
          ))}
        </div>

        {/* Arrow pointer */}
        <div
          className="absolute top-full mt-1 transform -translate-x-1/2 transition-all duration-500"
          style={{ left: `${position}%` }}
        >
          <div className="flex flex-col items-center">
            <svg width="20" height="12" className="drop-shadow-lg">
              <polygon points="10,0 20,12 0,12" fill="#ffffff" />
            </svg>
            <div className="w-0.5 h-2 bg-white"></div>
          </div>
        </div>
      </div>

      {/* Status label */}
      <div className="pt-4 text-center">
        <div className="text-lg font-bold text-text-primary mb-1">{status.replace('_', ' ')}</div>
        <div className="text-sm text-text-secondary">{description}</div>
      </div>
    </div>
  );
};
