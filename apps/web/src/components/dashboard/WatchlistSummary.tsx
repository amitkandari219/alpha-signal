/**
 * Watchlist Summary Component
 *
 * Displays user's primary watchlist stocks with prefetching
 */

import React, { useEffect } from 'react';
import { Eye, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CircularScoreGauge } from '../scores';
import { CollapsiblePanel } from '../common/CollapsiblePanel';
import { WatchlistStock } from '../../data/mockDashboardData';
import { LivePriceCompact } from '../common/LivePrice';
import { CompanyLogoCompact } from '../common/CompanyLogo';
import { usePrefetchStock, usePrefetchStockList } from '../../hooks/usePrefetch';

interface WatchlistSummaryProps {
  stocks: WatchlistStock[];
}

export const WatchlistSummary: React.FC<WatchlistSummaryProps> = ({ stocks }) => {
  const navigate = useNavigate();
  const { prefetch, cancel } = usePrefetchStock();
  const prefetchList = usePrefetchStockList();

  // Prefetch top 5 watchlist stocks on mount
  useEffect(() => {
    const symbols = stocks.slice(0, 5).map(s => s.symbol);
    if (symbols.length > 0) {
      prefetchList(symbols);
    }
  }, [stocks, prefetchList]);

  return (
    <CollapsiblePanel
      title="Watchlist"
      icon={Eye}
      defaultExpanded={true}
      headerRight={
        <Link
          to="/watchlist"
          className="text-xs text-signal-blue hover:underline flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          View all
          <ExternalLink className="w-3 h-3" />
        </Link>
      }
    >
      <div className="overflow-x-auto -mx-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-primary">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">
                Symbol
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted">
                CMP
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted">
                Change
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted">
                Quality
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">
                Top Signal
              </th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr
                key={stock.symbol}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                onMouseEnter={() => prefetch(stock.symbol)}
                onMouseLeave={() => cancel()}
                className="border-b border-border-default hover:bg-bg-tertiary cursor-pointer transition-colors group"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogoCompact symbol={stock.symbol} companyName={stock.name} />
                    <div>
                      <div className="font-medium text-text-primary">{stock.symbol}</div>
                      <div className="text-xs text-text-muted">{stock.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-right whitespace-nowrap" colSpan={2}>
                  <LivePriceCompact symbol={stock.symbol} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-center">
                    <CircularScoreGauge score={stock.qualityScore} label="" size="sm" />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-text-secondary leading-relaxed max-w-md">
                    {stock.topSignal}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsiblePanel>
  );
};
