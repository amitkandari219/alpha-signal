/**
 * Tailwind Engine Panel Component
 *
 * Shows macro and sector forces that could benefit the company
 */

import React from 'react';
import {
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Wind,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { CollapsiblePanel } from '../common/CollapsiblePanel';
import { SeverityBadge, MetricCard, MiniSparkline } from '../scores';
import { getTailwindData, ImpactLevel, RelevanceLevel } from '../../data/mockTailwindData';
import { GatedContent } from '../common/GatedContent';

interface TailwindEnginePanelProps {
  symbol: string;
  defaultExpanded?: boolean;
}

export const TailwindEnginePanel: React.FC<TailwindEnginePanelProps> = ({
  symbol,
  defaultExpanded = false,
}) => {
  const data = getTailwindData(symbol);

  const getImpactBorderColor = (impact: ImpactLevel) => {
    switch (impact) {
      case 'HIGH':
        return 'border-signal-green';
      case 'MEDIUM':
        return 'border-signal-yellow';
      case 'LOW':
        return 'border-border-primary';
    }
  };

  const getImpactSeverity = (impact: ImpactLevel): 'high' | 'medium' | 'low' => {
    switch (impact) {
      case 'HIGH':
        return 'high';
      case 'MEDIUM':
        return 'medium';
      case 'LOW':
        return 'low';
    }
  };

  const getTrendIcon = (trend: 'UP' | 'DOWN' | 'FLAT') => {
    switch (trend) {
      case 'UP':
        return <TrendingUp className="w-4 h-4 text-signal-green" />;
      case 'DOWN':
        return <TrendingDown className="w-4 h-4 text-signal-red" />;
      case 'FLAT':
        return <Minus className="w-4 h-4 text-text-muted" />;
    }
  };

  // Prepare sector performance bar chart data
  const sectorBarData = data.sectorMomentum.performanceData.map((perf) => ({
    period: perf.period,
    sector: perf.sectorReturn,
    nifty: perf.nifty500Return,
    outperformance: perf.sectorReturn - perf.nifty500Return,
  }));

  return (
    <CollapsiblePanel
      title="Tailwinds & Macro Forces"
      icon={Wind}
      defaultExpanded={defaultExpanded}
    >
      <GatedContent feature="tailwind_engine" showPreview={true}>
      <div className="space-y-6">
          {/* 1. Government Policy Tracker */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">
              Government Policy Tracker
            </h3>

            <div className="space-y-3">
              {data.governmentPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className={`bg-bg-secondary border-l-4 ${getImpactBorderColor(
                    policy.impact
                  )} rounded p-4`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-bold text-text-primary flex-1">{policy.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-bg-tertiary text-text-muted">
                        {policy.effectiveDate}
                      </span>
                      <SeverityBadge
                        severity={getImpactSeverity(policy.impact)}
                        label={`${policy.impact} Impact`}
                        size="sm"
                      />
                    </div>
                  </div>

                  <p className="text-sm text-text-secondary mb-2 leading-relaxed">
                    {policy.description}
                  </p>

                  <div className="flex items-start gap-2 mb-2 pl-3 border-l-2 border-signal-blue/30">
                    <span className="text-xs font-semibold text-signal-blue">Relevance:</span>
                    <p className="text-xs text-text-secondary flex-1">{policy.relevance}</p>
                  </div>

                  <a
                    href={policy.sourceUrl}
                    className="flex items-center gap-1 text-xs text-signal-blue hover:underline"
                    onClick={(e) => e.preventDefault()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    View policy details
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Sector Momentum */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Sector Momentum</h3>

            {/* Sector Ranking */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Relative Strength Ranking</span>
                <span className="text-lg font-bold text-text-primary font-data">
                  #{data.sectorMomentum.ranking}{' '}
                  <span className="text-sm text-text-muted font-normal">
                    / {data.sectorMomentum.totalSectors} sectors
                  </span>
                </span>
              </div>

              {/* Ranking Position Indicator */}
              <div className="relative h-8 bg-bg-secondary rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex">
                  {/* Green zone (top 8) */}
                  <div
                    className="bg-signal-green/20"
                    style={{ width: `${(8 / data.sectorMomentum.totalSectors) * 100}%` }}
                  ></div>
                  {/* Yellow zone (9-16) */}
                  <div
                    className="bg-signal-yellow/20"
                    style={{ width: `${(8 / data.sectorMomentum.totalSectors) * 100}%` }}
                  ></div>
                  {/* Red zone (17-24) */}
                  <div className="bg-signal-red/20 flex-1"></div>
                </div>
                {/* Position marker */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                  style={{
                    left: `${((data.sectorMomentum.ranking - 0.5) / data.sectorMomentum.totalSectors) * 100}%`,
                  }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-white"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>Top performers</span>
                <span>Laggards</span>
              </div>
            </div>

            {/* Performance vs Nifty 500 Bar Chart */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-text-primary mb-3">
                {data.sectorMomentum.sectorName} vs Nifty 500
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sectorBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="period" stroke="#8B949E" />
                  <YAxis stroke="#8B949E" label={{ value: 'Returns (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161B22',
                      border: '1px solid #30363D',
                      borderRadius: '6px',
                    }}
                    formatter={(value: any) => [`${value.toFixed(1)}%`, '']}
                  />
                  <Bar dataKey="sector" fill="#26A69A" name={data.sectorMomentum.sectorName} />
                  <Bar dataKey="nifty" fill="#8B949E" name="Nifty 500" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 3-Month Sector Index Chart */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3">
                Sector Index (3-Month Trend)
              </h4>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={data.sectorMomentum.indexChart3M}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="date" stroke="#8B949E" tick={false} />
                  <YAxis stroke="#8B949E" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161B22',
                      border: '1px solid #30363D',
                      borderRadius: '6px',
                    }}
                    formatter={(value: any) => [value.toFixed(0), 'Index']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#58A6FF"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Commodity Correlation (Conditional) */}
          {data.commodityCorrelation && (
            <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
              <h3 className="text-base font-semibold text-text-primary mb-4">
                Commodity Correlation
              </h3>

              {/* Commodity Table */}
              <div className="overflow-x-auto mb-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-primary">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-text-muted">
                        Commodity
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-text-muted">
                        Current Price
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-text-muted">
                        3M Change
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-text-muted">
                        Correlation
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-text-muted">
                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.commodityCorrelation.commodities.map((commodity, idx) => (
                      <tr key={idx} className="border-b border-border-default">
                        <td className="py-3 px-3 text-sm font-medium text-text-primary">
                          {commodity.name}
                        </td>
                        <td className="py-3 px-3 text-right text-sm font-data text-text-primary">
                          {commodity.currentPrice.toLocaleString('en-IN')} {commodity.unit}
                        </td>
                        <td
                          className={`py-3 px-3 text-right text-sm font-semibold font-data ${
                            commodity.change3M > 0 ? 'text-signal-green' : 'text-signal-red'
                          }`}
                        >
                          {commodity.change3M > 0 ? '+' : ''}
                          {commodity.change3M.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-xs text-text-secondary">
                          {commodity.correlation}
                        </td>
                        <td className="py-3 px-3">
                          <MiniSparkline data={commodity.sparkline} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AI Note */}
              <div className="bg-bg-secondary border-l-4 border-[#A371F7] rounded p-3">
                <div className="flex items-start gap-2">
                  <Wind className="w-4 h-4 text-[#A371F7] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary leading-relaxed">
                    <span className="font-semibold text-[#A371F7]">AI Analysis: </span>
                    {data.commodityCorrelation.aiNote}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Macro Dashboard */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Macro Dashboard</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.macroIndicators.map((indicator) => (
                <MetricCard
                  key={indicator.id}
                  label={indicator.name}
                  value={indicator.currentValue}
                  sparklineData={indicator.sparkline}
                  color={indicator.trend === 'UP' ? 'green' : indicator.trend === 'DOWN' ? 'red' : 'default'}
                />
              ))}
            </div>
          </div>
      </div>
      </GatedContent>
    </CollapsiblePanel>
  );
};
