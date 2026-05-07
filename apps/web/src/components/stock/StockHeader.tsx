/**
 * Stock Header Component
 *
 * Company info, price, action buttons, period toggle, chart controls, and professional chart
 */

import React, { useState, useMemo } from 'react';
import { Star, Bell, Share2, Maximize2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StockChart } from './StockChart';
import { mockStocks, getOHLCVData, getCurrentPriceData } from '../../data/mockStockData';
import { CompanyLogo } from '../common/CompanyLogo';
import {
  ChartTypeSelector,
  MAToggleBar,
  QuickStatsBar,
  IndicatorPanel,
  ComparisonSearch,
} from './ChartControls';
import { AIPatternDropdown } from '../chart/AIPatternDropdown';
import { EventFilterDropdown } from '../chart/EventFilterDropdown';
import { ChartSharing } from '../chart/ChartSharing';
import { CrosshairSyncProvider } from '../../contexts/CrosshairSyncContext';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { useAuthStore } from '../../store/useAuthStore';

interface StockHeaderProps {
  symbol: string;
  companyName?: string;
  sector?: string;
  marketCapCategory?: string;
}

type Period = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX';

const PERIODS: Period[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'MAX'];

export const StockHeader: React.FC<StockHeaderProps> = ({
  symbol,
  companyName: propCompanyName,
  sector: propSector,
  marketCapCategory: propMarketCapCategory
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1D');
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartContainerRef = React.useRef<HTMLDivElement>(null);

  // Navigation and feature gate hooks
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { hasAccess: hasReportAccess } = useFeatureGate('profile_full');

  // Get stock metadata - prefer props (real data), fallback to mock for missing stocks
  const mockStock = mockStocks[symbol];
  const stock = {
    symbol: symbol,
    companyName: propCompanyName || mockStock?.companyName || symbol + ' Limited',
    sector: propSector || mockStock?.sector || 'Unknown',
    marketCapCategory: propMarketCapCategory || mockStock?.marketCapCategory || 'LARGE_CAP',
    exchange: mockStock?.exchange || 'NSE' as const,
    basePrice: mockStock?.basePrice || 1000,
    trend: mockStock?.trend || 'sideways' as const,
  };
  const priceData = getCurrentPriceData(symbol);
  const chartData = getOHLCVData(symbol, selectedPeriod);

  // Debug: Log chart data
  console.log(`[StockHeader] Symbol: ${symbol}, Period: ${selectedPeriod}, Data points: ${chartData.length}`, chartData.slice(0, 2));

  // Calculate OHLC and stats for QuickStatsBar
  const chartStats = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        ohlc: { open: 0, high: 0, low: 0, close: 0 },
        week52: { high: 0, low: 0 },
        avgVolume: 0,
      };
    }

    // Get latest candle for OHLC
    const latestCandle = chartData[chartData.length - 1];

    // Calculate 52-week high/low (approximate with available data)
    const allData = getOHLCVData(symbol, 'MAX'); // Get all available data
    const last52Weeks = allData.slice(-252); // Approx 252 trading days in a year

    const week52High = Math.max(...last52Weeks.map((d) => d.high));
    const week52Low = Math.min(...last52Weeks.map((d) => d.low));

    // Calculate average volume (last 20 days)
    const last20Days = chartData.slice(-20);
    const avgVolume =
      last20Days.reduce((sum, d) => sum + d.volume, 0) / last20Days.length;

    return {
      ohlc: {
        open: latestCandle.open,
        high: latestCandle.high,
        low: latestCandle.low,
        close: latestCandle.close,
      },
      week52: {
        high: week52High,
        low: week52Low,
      },
      avgVolume,
    };
  }, [chartData, symbol]);

  // Fullscreen handlers
  const enterFullscreen = () => {
    const container = document.getElementById('chart-container');
    if (container) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen changes (e.g., ESC key)
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Get logo color based on first letter
  const getLogoColor = (name: string) => {
    const colors = [
      'from-signal-purple to-accent-blue',
      'from-signal-green to-chart-up',
      'from-signal-yellow to-chart-down',
      'from-accent-blue to-signal-purple',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get market cap badge color
  const getMarketCapColor = (category: string) => {
    switch (category) {
      case 'LARGE_CAP':
        return 'bg-signal-green/20 text-signal-green';
      case 'MID_CAP':
        return 'bg-signal-yellow/20 text-signal-yellow';
      case 'SMALL_CAP':
        return 'bg-signal-red/20 text-signal-red';
      default:
        return 'bg-text-muted/20 text-text-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Company Info + Price + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Left: Company Info */}
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          <CompanyLogo
            symbol={symbol}
            companyName={stock.companyName}
            size="md"
          />

          {/* Company Details */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-text-primary font-display mb-2">
              {stock.companyName}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {/* Sector Badge */}
              <span className="px-3 py-1 bg-bg-tertiary border border-border-default rounded-full text-sm text-text-secondary">
                {stock.sector}
              </span>

              {/* Market Cap Badge */}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getMarketCapColor(
                  stock.marketCapCategory
                )}`}
              >
                {stock.marketCapCategory.replace('_', ' ')}
              </span>

              {/* Exchange Badge */}
              <span className="px-3 py-1 bg-accent-blue/20 text-accent-blue rounded-full text-sm font-medium">
                {stock.exchange}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Price + Actions */}
        <div className="flex flex-col items-end gap-4">
          {/* Current Price */}
          <div className="text-right">
            <div className="flex flex-col gap-1">
              <div className="text-4xl font-semibold text-text-primary font-data">
                ₹{priceData.currentPrice.toFixed(2)}
              </div>
              <div className={`text-sm font-medium ${priceData.isPositive ? 'text-signal-green' : 'text-signal-red'}`}>
                {priceData.isPositive ? '+' : ''}{priceData.change.toFixed(2)} ({priceData.isPositive ? '+' : ''}{priceData.changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWatchlisted(!isWatchlisted)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isWatchlisted
                  ? 'bg-signal-yellow text-bg-primary'
                  : 'bg-bg-tertiary text-text-primary hover:bg-bg-secondary border border-border-default'
              }`}
            >
              <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">
                {isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}
              </span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-secondary transition-colors border border-border-default">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Set Alert</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-secondary transition-colors border border-border-default">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* View Report Button (PRO Feature) */}
            <button
              onClick={() => navigate(`/stock/${symbol}/report`)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors font-medium"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">View Report</span>
              {!hasReportAccess && (
                <span className="ml-1 text-xs px-2 py-0.5 bg-signal-purple rounded">PRO</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div
        id="chart-container"
        ref={chartContainerRef}
        className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-4"
      >
        {/* Row 1: Chart Type + Compare + Indicators + AI Patterns + Events + Screenshot + Fullscreen */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <ChartTypeSelector />

          <div className="flex items-center gap-2 flex-wrap">
            <ComparisonSearch />
            <IndicatorPanel />

            {/* AI Patterns */}
            <AIPatternDropdown />

            {/* Event Filters */}
            <EventFilterDropdown companyId={symbol} />

            {/* Chart Sharing */}
            <ChartSharing
              symbol={symbol}
              period={selectedPeriod}
              chartContainerRef={chartContainerRef}
            />

            <button
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className="
                px-3 py-1.5 rounded-lg text-sm font-medium
                bg-bg-tertiary text-text-secondary
                hover:bg-bg-primary hover:text-text-primary
                transition-all flex items-center gap-2
              "
              title={isFullscreen ? 'Exit fullscreen (ESC)' : 'Enter fullscreen'}
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: MA Toggle Bar */}
        <MAToggleBar />

        {/* Row 3: Quick Stats Bar */}
        <QuickStatsBar
          ohlc={chartStats.ohlc}
          week52={chartStats.week52}
          avgVolume={chartStats.avgVolume}
          currentPrice={priceData.currentPrice}
          peRatio={undefined} // TODO: Add P/E ratio from fundamentals
        />

        {/* Row 4: Period Toggle */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center bg-bg-tertiary border border-border-default rounded-lg p-1">
            {PERIODS.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  selectedPeriod === period
                    ? 'bg-accent-blue text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <CrosshairSyncProvider>
          <StockChart
            data={chartData}
            period={selectedPeriod}
            height={isFullscreen ? window.innerHeight - 200 : window.innerWidth < 768 ? 300 : 400}
            symbol={symbol}
          />
        </CrosshairSyncProvider>
      </div>
    </div>
  );
};
