/**
 * Stock Detail Page
 *
 * Displays detailed information for a specific stock
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const Stock: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary font-display mb-2">
            {symbol}
          </h1>
          <p className="text-text-secondary">Stock Details</p>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent-blue" />
          <span className="text-sm text-text-muted">Live Data</span>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Price Card */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Current Price</span>
            <TrendingUp className="w-4 h-4 text-signal-green" />
          </div>
          <div className="text-3xl font-bold text-text-primary font-data">
            ₹1,234.56
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-signal-green text-sm">+23.45 (1.94%)</span>
          </div>
        </div>

        {/* Day High Card */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Day High</span>
          </div>
          <div className="text-3xl font-bold text-text-primary font-data">
            ₹1,256.78
          </div>
        </div>

        {/* Day Low Card */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Day Low</span>
          </div>
          <div className="text-3xl font-bold text-text-primary font-data">
            ₹1,198.34
          </div>
        </div>
      </div>

      {/* Placeholder Chart Area */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-8">
        <div className="flex items-center justify-center h-[400px] text-text-muted">
          <div className="text-center">
            <Activity className="w-16 h-16 mx-auto mb-4 text-text-muted/50" />
            <p className="text-lg">Stock chart will be displayed here</p>
            <p className="text-sm mt-2">Full implementation coming soon</p>
          </div>
        </div>
      </div>

      {/* Company Info Placeholder */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Company Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-text-muted block mb-1">Market Cap</span>
            <span className="text-text-primary font-data">₹12,345 Cr</span>
          </div>
          <div>
            <span className="text-sm text-text-muted block mb-1">P/E Ratio</span>
            <span className="text-text-primary font-data">23.45</span>
          </div>
          <div>
            <span className="text-sm text-text-muted block mb-1">Sector</span>
            <span className="text-text-primary">Technology</span>
          </div>
          <div>
            <span className="text-sm text-text-muted block mb-1">52W High</span>
            <span className="text-text-primary font-data">₹1,456.78</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stock;
