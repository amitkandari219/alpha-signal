/**
 * Stock Detail Page Container
 *
 * Full stock detail page with React Query data fetching and collapsible panels
 */

import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StockHeader } from '../components/stock/StockHeader';
import { AIIntelligencePanel } from '../components/stock/AIIntelligencePanel';
import { FundamentalAnalysisPanel } from '../components/stock/FundamentalAnalysisPanel';
import { TechnicalAnalysisPanel } from '../components/stock/TechnicalAnalysisPanel';
import { NewsSentimentPanel } from '../components/stock/NewsSentimentPanel';
import { TailwindEnginePanel } from '../components/stock/TailwindEnginePanel';
import { RiskDashboardPanel } from '../components/stock/RiskDashboardPanel';
import { PeerComparisonPanel } from '../components/stock/PeerComparisonPanel';
import { LoadingPage } from '../components/common/LoadingSkeleton';
import { mockStocks, getCurrentPriceData } from '../data/mockStockData';
import { SEO } from '../components/SEO';
import { analytics, AnalyticsEvents } from '../services/analytics';

// Lazy load tab components
const TimelineTab = lazy(() => import('../components/stock/TimelineTab'));
const ProfileTab = lazy(() => import('../components/stock/ProfileTab'));

interface StockDetailPageProps {}

type TabType = 'analysis' | 'timeline' | 'profile';

export const StockDetailPage: React.FC<StockDetailPageProps> = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Get active tab from URL params, default to 'analysis'
  const activeTab = (searchParams.get('tab') as TabType) || 'analysis';

  // Tab change handler
  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch stock data via React Query from real API
  const { data: stockData, isLoading, error } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: async () => {
      if (!symbol) {
        throw new Error('Stock symbol not provided');
      }

      // Fetch real data from API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/stocks/${symbol}`);

      if (!response.ok) {
        throw new Error(`Stock not found: ${symbol}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stock data');
      }

      // Transform API response to match component expectations
      const data = result.data;
      return {
        symbol: data.symbol,
        companyName: data.companyName,
        shortName: data.shortName,
        sector: data.sector,
        industry: data.industry,
        marketCapCategory: data.marketCapCategory,
        isin: data.isin,
        listingDate: data.listingDate,
        priceData: getCurrentPriceData(symbol), // Live prices come from WebSocket
      };
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Track stock page view when data is loaded
  useEffect(() => {
    if (stockData && symbol) {
      analytics.trackStockView(symbol, {
        companyName: stockData.companyName,
        sector: stockData.sector,
        marketCapCategory: stockData.marketCapCategory,
      });
    }
  }, [stockData, symbol]);

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        setShowStickyHeader(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Loading state
  if (isLoading) {
    return <LoadingPage />;
  }

  // Error state
  if (error || !stockData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Stock Not Found</h2>
          <p className="text-text-secondary">
            Unable to load data for symbol: {symbol}
          </p>
        </div>
      </div>
    );
  }

  // SEO data
  const qualityScore = stockData.scores?.quality || 75;
  const seoTitle = `${stockData.companyName} (${symbol}) — AI Stock Analysis`;
  const seoDescription = `AI-powered analysis of ${stockData.companyName}. Quality Score: ${qualityScore}/100. Get bull/bear cases, risk flags, and fundamental analysis.`;

  const jsonLd = {
    '@type': 'FinancialProduct',
    name: `${stockData.companyName} Stock Analysis`,
    description: `AI analysis of ${symbol}`,
    provider: {
      '@type': 'Organization',
      name: 'Alpha Signal',
    },
  };

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={`/stock/${symbol}`}
        jsonLd={jsonLd}
      />
      <div className="space-y-6 animate-fade-in">
        {/* Sticky Sub-Header */}
      {showStickyHeader && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-bg-secondary/95 backdrop-blur-sm border-b border-border-default animate-fade-in">
          <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-text-primary">
                {stockData.companyName}
              </h2>
              <span className="text-sm text-text-muted">{stockData.symbol}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xl font-bold text-text-primary font-data">
                  ₹{stockData.priceData.currentPrice.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div
                  className={`text-sm font-semibold font-data ${
                    stockData.priceData.isPositive ? 'text-signal-green' : 'text-signal-red'
                  }`}
                >
                  {stockData.priceData.isPositive ? '+' : ''}
                  {stockData.priceData.change.toFixed(2)} (
                  {stockData.priceData.isPositive ? '+' : ''}
                  {stockData.priceData.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div ref={headerRef}>
        <StockHeader
          symbol={symbol || 'RELIANCE'}
          companyName={stockData.companyName}
          sector={stockData.sector}
          marketCapCategory={stockData.marketCapCategory}
        />
      </div>

      {/* Tab Bar */}
      <div className="sticky top-14 z-30 bg-bg-primary/95 backdrop-blur-sm border-b border-border-default">
        <div className="flex items-center gap-1 px-2 py-1">
          <button
            onClick={() => handleTabChange('analysis')}
            className={`px-6 py-3 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'analysis'
                ? 'bg-bg-secondary text-text-primary border border-border-default shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            Analysis
          </button>
          <button
            onClick={() => handleTabChange('timeline')}
            className={`px-6 py-3 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'timeline'
                ? 'bg-bg-secondary text-text-primary border border-border-default shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => handleTabChange('profile')}
            className={`px-6 py-3 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-bg-secondary text-text-primary border border-border-default shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            Profile
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'analysis' && (
        <div className="space-y-4">
        {/* AI Intelligence Panel - PRIMARY DIFFERENTIATOR */}
        <AIIntelligencePanel symbol={symbol || 'RELIANCE'} defaultExpanded={true} />

        {/* Fundamental Analysis Panel */}
        <FundamentalAnalysisPanel symbol={symbol || 'RELIANCE'} defaultExpanded={false} />

        {/* Technical Analysis Panel */}
        <TechnicalAnalysisPanel
          symbol={symbol || 'RELIANCE'}
          currentPrice={stockData.priceData.currentPrice}
          defaultExpanded={false}
        />

        {/* News & Sentiment Panel */}
        <NewsSentimentPanel symbol={symbol || 'RELIANCE'} defaultExpanded={false} />

        {/* Tailwinds & Macro Forces Panel */}
        <TailwindEnginePanel symbol={symbol || 'RELIANCE'} defaultExpanded={false} />

        {/* Risk Dashboard Panel */}
        <RiskDashboardPanel symbol={symbol || 'RELIANCE'} defaultExpanded={false} />

        {/* Peer Comparison Panel */}
        <PeerComparisonPanel symbol={symbol || 'RELIANCE'} />

        {/* Financials Panel */}
        <CollapsiblePanel title="Financials" defaultOpen={false}>
          <div className="text-text-secondary text-center py-8">
            Financial statements and key metrics will be displayed here
          </div>
        </CollapsiblePanel>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <Suspense fallback={<LoadingPage />}>
          <TimelineTab symbol={symbol || 'RELIANCE'} />
        </Suspense>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Suspense fallback={<LoadingPage />}>
          <ProfileTab symbol={symbol || 'RELIANCE'} />
        </Suspense>
      )}
    </div>
    </>
  );
};

// Collapsible Panel Component
interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-tertiary transition-colors"
      >
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        <svg
          className={`w-5 h-5 text-text-secondary transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && <div className="px-6 py-4 border-t border-border-default">{children}</div>}
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value }) => {
  return (
    <div className="bg-bg-tertiary border border-border-default rounded-lg p-4">
      <div className="text-sm text-text-muted mb-1">{label}</div>
      <div className="text-xl font-bold text-text-primary font-data">{value}</div>
    </div>
  );
};

export default StockDetailPage;
