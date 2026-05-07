/**
 * Trending Stocks Component
 *
 * Displays stocks with unusual activity or significant changes
 */

import React from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CollapsiblePanel } from '../common/CollapsiblePanel';
import { TrendingStock } from '../../data/mockDashboardData';

interface TrendingStocksProps {
  stocks: TrendingStock[];
}

export const TrendingStocks: React.FC<TrendingStocksProps> = ({ stocks }) => {
  const navigate = useNavigate();

  return (
    <CollapsiblePanel title="Trending Stocks" icon={Flame} defaultExpanded={true}>
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-4 pb-2">
          {stocks.map((stock) => (
            <div
              key={stock.symbol}
              onClick={() => navigate(`/stock/${stock.symbol}`)}
              className="min-w-[280px] bg-bg-tertiary border border-border-primary rounded-lg p-4 hover:border-signal-blue hover:shadow-lg transition-all cursor-pointer group"
            >
              {/* Reason Badge */}
              <div className="mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-signal-blue/20 text-signal-blue">
                  <Flame className="w-3 h-3" />
                  {stock.reason}
                </span>
              </div>

              {/* Stock Info */}
              <div className="mb-3">
                <div className="font-bold text-text-primary text-lg group-hover:text-signal-blue transition-colors">
                  {stock.symbol}
                </div>
                <div className="text-sm text-text-muted truncate">{stock.name}</div>
              </div>

              {/* Price Info */}
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs text-text-muted mb-1">Current Price</div>
                  <div className="text-xl font-bold font-data text-text-primary">
                    ₹{stock.cmp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`flex items-center gap-1 text-lg font-bold font-data ${
                      stock.change > 0 ? 'text-signal-green' : 'text-signal-red'
                    }`}
                  >
                    {stock.change > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4 rotate-180" />
                    )}
                    {stock.change > 0 ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                  </div>
                  <div className="text-xs text-text-muted">
                    {stock.change > 0 ? '+' : ''}₹{stock.change.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CollapsiblePanel>
  );
};
