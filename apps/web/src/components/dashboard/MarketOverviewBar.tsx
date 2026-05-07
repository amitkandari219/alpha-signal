/**
 * Market Overview Bar Component
 *
 * Displays major market indices with sparklines
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MiniSparkline } from '../scores';
import { MarketIndex } from '../../data/mockDashboardData';

interface MarketOverviewBarProps {
  indices: MarketIndex[];
}

export const MarketOverviewBar: React.FC<MarketOverviewBarProps> = ({ indices }) => {
  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
      <div className="flex items-center gap-6 overflow-x-auto scrollbar-thin">
        {indices.map((index) => (
          <div
            key={index.symbol}
            className="flex items-center gap-4 min-w-[280px] px-4 py-2 bg-bg-tertiary rounded-lg"
          >
            <div className="flex-1">
              <div className="text-xs text-text-muted mb-1">{index.name}</div>
              <div className="text-xl font-bold text-text-primary font-data">
                {index.value.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-semibold font-data ${
                  index.change > 0 ? 'text-signal-green' : 'text-signal-red'
                }`}
              >
                {index.change > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {index.change > 0 ? '+' : ''}
                {index.change.toFixed(2)} ({index.changePercent > 0 ? '+' : ''}
                {index.changePercent.toFixed(2)}%)
              </div>
            </div>
            <div className="w-24">
              <MiniSparkline
                data={index.sparkline}
                width={96}
                height={40}
                color={index.change > 0 ? '#26A69A' : '#EF5350'}
                showLastValue={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
