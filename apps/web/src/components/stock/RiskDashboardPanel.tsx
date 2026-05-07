/**
 * Risk Dashboard Panel Component
 *
 * Proactively surfaces risks for small-cap investors
 */

import React from 'react';
import {
  Shield,
  AlertTriangle,
  Users,
  TrendingDown,
  FileText,
  Scale,
  Gavel,
  AlertCircle,
  CheckCircle,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { CollapsiblePanel } from '../common/CollapsiblePanel';
import { CircularScoreGauge, MetricCard, SeverityBadge } from '../scores';
import { GatedContent } from '../common/GatedContent';
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { getRiskData, RiskStatus, EarningsQualityLevel, VolatilityLevel } from '../../data/mockRiskData';

interface RiskDashboardPanelProps {
  symbol: string;
  defaultExpanded?: boolean;
}

export const RiskDashboardPanel: React.FC<RiskDashboardPanelProps> = ({
  symbol,
  defaultExpanded = false,
}) => {
  const data = getRiskData(symbol);

  const getStatusColor = (status: RiskStatus) => {
    switch (status) {
      case 'CLEAR':
        return 'bg-signal-green/20 border-signal-green/30';
      case 'WATCH':
        return 'bg-signal-yellow/20 border-signal-yellow/30';
      case 'FLAGGED':
        return 'bg-signal-red/20 border-signal-red/30';
    }
  };

  const getStatusSeverity = (status: RiskStatus): 'clear' | 'low' | 'high' => {
    switch (status) {
      case 'CLEAR':
        return 'clear';
      case 'WATCH':
        return 'low';
      case 'FLAGGED':
        return 'high';
    }
  };

  const getStatusIcon = (status: RiskStatus) => {
    switch (status) {
      case 'CLEAR':
        return <CheckCircle className="w-5 h-5 text-signal-green" />;
      case 'WATCH':
        return <Eye className="w-5 h-5 text-signal-yellow" />;
      case 'FLAGGED':
        return <AlertTriangle className="w-5 h-5 text-signal-red" />;
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const iconProps = { className: 'w-6 h-6' };
    switch (iconName) {
      case 'Shield':
        return <Shield {...iconProps} />;
      case 'AlertTriangle':
        return <AlertTriangle {...iconProps} />;
      case 'Users':
        return <Users {...iconProps} />;
      case 'TrendingDown':
        return <TrendingDown {...iconProps} />;
      case 'FileText':
        return <FileText {...iconProps} />;
      case 'Scale':
        return <Scale {...iconProps} />;
      case 'Gavel':
        return <Gavel {...iconProps} />;
      case 'AlertCircle':
        return <AlertCircle {...iconProps} />;
      default:
        return <AlertCircle {...iconProps} />;
    }
  };

  const getEarningsQualityColor = (level: EarningsQualityLevel) => {
    switch (level) {
      case 'LOW':
        return 'text-signal-green';
      case 'MODERATE':
        return 'text-signal-yellow';
      case 'HIGH':
        return 'text-signal-red';
    }
  };

  const getVolatilityColor = (level: VolatilityLevel) => {
    switch (level) {
      case 'LOW':
        return 'text-signal-green';
      case 'MEDIUM':
        return 'text-signal-yellow';
      case 'HIGH':
        return 'text-signal-red';
    }
  };

  return (
    <CollapsiblePanel
      title="Risk Dashboard"
      icon={Shield}
      defaultExpanded={defaultExpanded}
    >
      <div className="space-y-6">
          {/* Gate detailed risk analysis for FREE users */}
          <GatedContent feature="risk_dashboard_full" showPreview={true}>
          {/* 1. Red Flag Detection Grid */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">
              Red Flag Detection
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.redFlags.map((flag) => (
                <div
                  key={flag.id}
                  className={`border-2 rounded-lg p-4 ${getStatusColor(flag.status)} ${
                    flag.status === 'FLAGGED' ? 'animate-pulse-glow' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-text-primary">{getCategoryIcon(flag.icon)}</div>
                    <SeverityBadge severity={getStatusSeverity(flag.status)} size="sm" />
                  </div>

                  <h4 className="text-sm font-semibold text-text-primary mb-2">{flag.name}</h4>

                  {flag.description && (
                    <>
                      <p className="text-xs text-text-secondary mb-2 leading-relaxed">
                        {flag.description}
                      </p>
                      <a
                        href="#"
                        className="flex items-center gap-1 text-xs text-signal-blue hover:underline"
                        onClick={(e) => e.preventDefault()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View details
                      </a>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Earnings Quality Section */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">
              Earnings Quality Analysis
            </h3>

            {/* Large Score */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-primary">
              <div>
                <div className="text-5xl font-bold text-text-primary font-data mb-2">
                  {data.earningsQuality.score}
                  <span className="text-2xl text-text-muted">/100</span>
                </div>
                <div
                  className={`text-sm font-semibold ${getEarningsQualityColor(
                    data.earningsQuality.probabilityLevel
                  )}`}
                >
                  {data.earningsQuality.probabilityLevel === 'LOW' && 'Low probability of earnings manipulation'}
                  {data.earningsQuality.probabilityLevel === 'MODERATE' && 'Moderate probability of earnings manipulation'}
                  {data.earningsQuality.probabilityLevel === 'HIGH' && 'High probability of earnings manipulation'}
                </div>
              </div>
              <div className="text-xs text-text-muted text-right">
                <p>Based on Beneish M-Score</p>
                <p>methodology variant</p>
              </div>
            </div>

            {/* Factor Decomposition Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-text-muted">
                      Factor
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-text-muted">
                      Value
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-text-muted">
                      Normal Range
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-text-muted">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.earningsQuality.factors.map((factor, idx) => (
                    <tr key={idx} className="border-b border-border-default">
                      <td className="py-3 px-3">
                        <div className="text-sm font-medium text-text-primary">
                          {factor.shortName}
                        </div>
                        <div className="text-xs text-text-muted">{factor.name}</div>
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-data text-text-primary">
                        {factor.value.toFixed(3)}
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-text-secondary">
                        {factor.normalRange}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            factor.status === 'NORMAL'
                              ? 'bg-signal-green/20 text-signal-green'
                              : 'bg-signal-red/20 text-signal-red'
                          }`}
                        >
                          {factor.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </GatedContent>

          {/* 3. Governance Risk Score (FREE users can see this quality score) */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">
              Governance Risk Score
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Circular Gauge */}
              <div className="flex flex-col items-center justify-center">
                <CircularScoreGauge
                  score={100 - data.governanceRisk.score}
                  label="Governance Quality"
                  size="lg"
                  showMethodologyLink={true}
                  methodologySection="risk-score"
                />
                <p className="text-xs text-text-muted mt-2 text-center">
                  Higher score = Better governance
                </p>
              </div>

              {/* Factor Bars */}
              <div className="space-y-4">
                {data.governanceRisk.factors.map((factor, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text-primary">{factor.name}</span>
                      <span className="text-xs font-data text-text-secondary">
                        {factor.current} {factor.unit}
                      </span>
                    </div>
                    <div className="relative h-6 bg-bg-secondary rounded overflow-hidden">
                      {/* Threshold marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-text-muted z-10"
                        style={{ left: `${(factor.threshold / 100) * 100}%` }}
                      ></div>
                      {/* Current value bar */}
                      <div
                        className={`absolute top-0 bottom-0 left-0 ${
                          factor.isInverse
                            ? factor.current <= factor.threshold
                              ? 'bg-signal-green'
                              : 'bg-signal-red'
                            : factor.current >= factor.threshold
                            ? 'bg-signal-green'
                            : 'bg-signal-red'
                        }`}
                        style={{
                          width: `${Math.min((factor.current / 100) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-xs text-text-muted">
                        {factor.isInverse ? 'Lower is better' : 'Higher is better'}
                      </span>
                      <span className="text-xs text-text-muted">
                        Threshold: {factor.threshold} {factor.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Volatility Metrics */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Volatility Metrics</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Historical Volatility */}
              <MetricCard
                label="Historical Volatility (1Y)"
                value={`${data.volatilityMetrics.historicalVolatility1Y.value.toFixed(1)}%`}
                color={
                  data.volatilityMetrics.historicalVolatility1Y.classification === 'LOW'
                    ? 'green'
                    : data.volatilityMetrics.historicalVolatility1Y.classification === 'MEDIUM'
                    ? 'yellow'
                    : 'red'
                }
              />

              {/* Beta */}
              <MetricCard
                label="Beta vs Nifty 500"
                value={data.volatilityMetrics.beta.value.toFixed(2)}
                color="blue"
              />
            </div>

            {/* Max Drawdown */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-text-primary mb-3">Maximum Drawdown</h4>
              <div className="flex items-center gap-6 mb-3">
                <div>
                  <div className="text-xs text-text-muted">1 Year</div>
                  <div className="text-2xl font-bold text-signal-red font-data">
                    {data.volatilityMetrics.maxDrawdown.oneYear.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">3 Years</div>
                  <div className="text-2xl font-bold text-signal-red font-data">
                    {data.volatilityMetrics.maxDrawdown.threeYear.toFixed(1)}%
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={data.volatilityMetrics.maxDrawdown.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="date" stroke="#8B949E" tick={false} />
                  <YAxis stroke="#8B949E" domain={['auto', 0]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161B22',
                      border: '1px solid #30363D',
                      borderRadius: '6px',
                    }}
                    formatter={(value: any) => [`${value.toFixed(1)}%`, 'Drawdown']}
                  />
                  <Line type="monotone" dataKey="drawdown" stroke="#EF5350" strokeWidth={2} dot={false} />
                  <ReferenceLine y={0} stroke="#8B949E" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Earnings Surprise Variance */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-text-primary">
                  Earnings Surprise Variance
                </h4>
                <div className="text-right">
                  <div className="text-xs text-text-muted">Std Deviation</div>
                  <div className="text-lg font-bold text-text-primary font-data">
                    {data.volatilityMetrics.earningsSurprise.variance.toFixed(1)}%
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis
                    type="category"
                    dataKey="quarter"
                    stroke="#8B949E"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="#8B949E"
                    label={{ value: 'Surprise %', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161B22',
                      border: '1px solid #30363D',
                      borderRadius: '6px',
                    }}
                    formatter={(value: any, name: string, props: any) => {
                      if (name === 'surprise') {
                        return [
                          `${value.toFixed(1)}% (Actual: ₹${props.payload.actual}, Expected: ₹${props.payload.expected})`,
                          'Surprise',
                        ];
                      }
                      return [value, name];
                    }}
                  />
                  <ReferenceLine y={0} stroke="#8B949E" strokeDasharray="3 3" />
                  <Scatter
                    data={data.volatilityMetrics.earningsSurprise.quarters}
                    dataKey="surprise"
                  >
                    {data.volatilityMetrics.earningsSurprise.quarters.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.surprise > 0 ? '#26A69A' : '#EF5350'}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>
    </CollapsiblePanel>
  );
};
