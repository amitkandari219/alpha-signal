/**
 * Score Components Demo
 *
 * Example usage of all reusable score visualization components
 * This file demonstrates how to use each component across panels
 */

import React from 'react';
import {
  CircularScoreGauge,
  ScoreFactorBreakdown,
  MiniSparkline,
  MetricCard,
  TrendIndicator,
  SeverityBadge,
  ScoreFactor,
} from './index';

export const ScoreComponentsDemo: React.FC = () => {
  // Example data
  const earningsQualityFactors: ScoreFactor[] = [
    {
      name: 'DSRI',
      weight: 12.5,
      value: 85,
      contribution: 10.6,
      explanation: 'Days Sales in Receivables Index: Low value indicates healthy receivables collection',
    },
    {
      name: 'GMI',
      weight: 12.5,
      value: 72,
      contribution: 9.0,
      explanation: 'Gross Margin Index: Stable gross margins suggest consistent profitability',
    },
    {
      name: 'AQI',
      weight: 12.5,
      value: 68,
      contribution: 8.5,
      explanation: 'Asset Quality Index: Lower value indicates better asset quality',
    },
    {
      name: 'SGI',
      weight: 12.5,
      value: 55,
      contribution: 6.9,
      explanation: 'Sales Growth Index: Moderate growth without aggressive revenue recognition',
    },
    {
      name: 'DEPI',
      weight: 12.5,
      value: 78,
      contribution: 9.8,
      explanation: 'Depreciation Index: Conservative depreciation policies',
    },
    {
      name: 'SGAI',
      weight: 12.5,
      value: 62,
      contribution: 7.8,
      explanation: 'Sales, General & Admin Index: Controlled operating expenses',
    },
    {
      name: 'Accruals',
      weight: 12.5,
      value: 58,
      contribution: 7.3,
      explanation: 'Total Accruals to Total Assets: Lower is better for earnings quality',
    },
    {
      name: 'Leverage',
      weight: 12.5,
      value: 48,
      contribution: 6.0,
      explanation: 'Leverage Index: Moderate debt levels relative to assets',
    },
  ];

  const roeSparklineData = [12.5, 13.2, 14.1, 13.8, 15.2, 16.4, 17.1, 16.8];
  const revenueSparklineData = [100, 105, 108, 112, 118, 125, 132, 138];

  return (
    <div className="p-6 space-y-8 bg-bg-primary">
      <h1 className="text-2xl font-bold text-text-primary">Score Components Demo</h1>

      {/* CircularScoreGauge Examples */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          1. Circular Score Gauges
        </h2>
        <div className="flex gap-8 items-end">
          <CircularScoreGauge score={85} label="Earnings Quality" size="sm" />
          <CircularScoreGauge score={72} label="Governance Risk" size="md" />
          <CircularScoreGauge score={45} label="Volatility Score" size="lg" />
        </div>
      </section>

      {/* ScoreFactorBreakdown Example */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          2. Score Factor Breakdown
        </h2>
        <div className="max-w-3xl">
          <ScoreFactorBreakdown factors={earningsQualityFactors} />
        </div>
      </section>

      {/* MiniSparkline Examples */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">3. Mini Sparklines</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-text-secondary w-32">ROE Trend:</span>
            <MiniSparkline
              data={roeSparklineData}
              width={120}
              height={32}
              color="#3CD280"
              showLastValue
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-text-secondary w-32">Revenue Growth:</span>
            <MiniSparkline
              data={revenueSparklineData}
              width={120}
              height={32}
              color="#3B82F6"
              showLastValue
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-text-secondary w-32">Declining Metric:</span>
            <MiniSparkline
              data={[100, 95, 88, 82, 75, 68, 60, 55]}
              width={120}
              height={32}
              color="#F85149"
              showLastValue
            />
          </div>
        </div>
      </section>

      {/* MetricCard Examples */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">4. Metric Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">
          <MetricCard
            label="Return on Equity"
            value="16.8%"
            change={5.2}
            changeLabel="YoY"
            sparklineData={roeSparklineData}
            color="green"
          />
          <MetricCard
            label="PE Ratio"
            value="24.5"
            change={-2.1}
            changeLabel="vs sector"
            sparklineData={[28, 27.5, 26.8, 26, 25.5, 25, 24.8, 24.5]}
            color="blue"
          />
          <MetricCard
            label="Debt/Equity"
            value="0.45"
            change={-8.3}
            changeLabel="vs last year"
            sparklineData={[0.65, 0.62, 0.58, 0.54, 0.51, 0.48, 0.46, 0.45]}
            color="yellow"
          />
        </div>
      </section>

      {/* TrendIndicator Examples */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">5. Trend Indicators</h2>
        <div className="space-y-6 max-w-2xl">
          <div>
            <div className="text-text-secondary mb-2">Price Action:</div>
            <TrendIndicator trend="strong_uptrend" />
          </div>
          <div>
            <div className="text-text-secondary mb-2">Volume Trend:</div>
            <TrendIndicator trend="sideways" />
          </div>
          <div>
            <div className="text-text-secondary mb-2">Sentiment:</div>
            <TrendIndicator trend="downtrend" />
          </div>
        </div>
      </section>

      {/* SeverityBadge Examples */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">6. Severity Badges</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-text-secondary w-32">Risk Flags:</span>
            <SeverityBadge severity="high" />
            <SeverityBadge severity="medium" />
            <SeverityBadge severity="low" />
            <SeverityBadge severity="clear" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-text-secondary w-32">Custom Labels:</span>
            <SeverityBadge severity="high" label="CRITICAL" />
            <SeverityBadge severity="medium" label="WARNING" />
            <SeverityBadge severity="low" label="WATCH" />
            <SeverityBadge severity="clear" label="ALL CLEAR" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-text-secondary w-32">Small Size:</span>
            <SeverityBadge severity="high" size="sm" />
            <SeverityBadge severity="medium" size="sm" />
            <SeverityBadge severity="low" size="sm" />
            <SeverityBadge severity="clear" size="sm" />
          </div>
        </div>
      </section>

      {/* Real-world usage example */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          7. Combined Example: Risk Dashboard Summary
        </h2>
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <CircularScoreGauge score={72} label="Overall Risk Score" size="md" />
            </div>
            <div className="col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Earnings Quality</span>
                <div className="flex items-center gap-2">
                  <MiniSparkline data={[65, 68, 70, 72, 74, 75, 76, 78]} width={60} height={20} color="#3CD280" />
                  <SeverityBadge severity="clear" label="GOOD" size="sm" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Debt Levels</span>
                <div className="flex items-center gap-2">
                  <MiniSparkline data={[80, 75, 70, 65, 60, 58, 55, 52]} width={60} height={20} color="#FBB80E" />
                  <SeverityBadge severity="medium" label="MODERATE" size="sm" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">SEBI Investigation</span>
                <div className="flex items-center gap-2">
                  <MiniSparkline data={[20, 25, 30, 35, 40, 45, 50, 55]} width={60} height={20} color="#F85149" />
                  <SeverityBadge severity="high" label="FLAGGED" size="sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border-primary pt-4">
            <div className="text-text-secondary mb-2">Market Sentiment:</div>
            <TrendIndicator trend="uptrend" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScoreComponentsDemo;
