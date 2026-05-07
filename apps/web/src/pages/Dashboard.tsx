/**
 * Dashboard Page
 *
 * Main home page showing market overview, watchlist, alerts, and trending stocks
 */

import React from 'react';
import { MarketOverviewBar } from '../components/dashboard/MarketOverviewBar';
import { WatchlistSummary } from '../components/dashboard/WatchlistSummary';
import { AlertsFeed } from '../components/dashboard/AlertsFeed';
import { TrendingStocks } from '../components/dashboard/TrendingStocks';
import { SectorHeatmap } from '../components/dashboard/SectorHeatmap';
import { AIMarketBrief } from '../components/dashboard/AIMarketBrief';
import { LatestReports } from '../components/dashboard/LatestReports';
import { getDashboardData } from '../data/mockDashboardData';
import { SEO } from '../components/SEO';
import { SEO_CONFIG } from '../config/seo';

export const Dashboard: React.FC = () => {
  const data = getDashboardData();

  return (
    <>
      <SEO
        title={SEO_CONFIG.dashboard.title}
        description={SEO_CONFIG.dashboard.description}
        canonical="/dashboard"
        noindex={true}
      />
      <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Dashboard</h1>
        <p className="text-text-secondary">
          Welcome back! Here's what's happening in the market today.
        </p>
      </div>

      {/* Market Overview Bar - Full Width */}
      <div>
        <MarketOverviewBar indices={data.indices} />
      </div>

      {/* Main Grid: Watchlist (60%) + Alerts (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <WatchlistSummary stocks={data.watchlist} />
        </div>
        <div className="lg:col-span-2">
          <AlertsFeed alerts={data.alerts} />
        </div>
      </div>

      {/* Trending Stocks - Full Width */}
      <div>
        <TrendingStocks stocks={data.trending} />
      </div>

      {/* Latest Reports Section - Full Width */}
      <div>
        <LatestReports />
      </div>

      {/* Bottom Grid: Sector Heatmap (70%) + AI Brief (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7">
          <SectorHeatmap sectors={data.sectors} />
        </div>
        <div className="lg:col-span-3">
          <AIMarketBrief
            generatedAt={data.marketBrief.generatedAt}
            summary={data.marketBrief.summary}
          />
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
