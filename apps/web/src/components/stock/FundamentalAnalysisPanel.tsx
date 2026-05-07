/**
 * Fundamental Analysis Panel Component
 *
 * Comprehensive fundamental metrics organized into 6 sub-cards
 */

import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CircularGauge } from '../common/CircularGauge';
import { CollapsiblePanel } from '../common/CollapsiblePanel';
import { CircularScoreGauge, MetricCard, MiniSparkline, ScoreFactorBreakdown, ScoreFactor } from '../scores';
import { getFundamentalData } from '../../data/mockFundamentalData';
import { GatedContent } from '../common/GatedContent';

interface FundamentalAnalysisPanelProps {
  symbol: string;
  defaultExpanded?: boolean;
}

export const FundamentalAnalysisPanel: React.FC<FundamentalAnalysisPanelProps> = ({
  symbol,
  defaultExpanded = false,
}) => {
  const data = getFundamentalData(symbol);

  return (
    <CollapsiblePanel
      title="Fundamental Analysis"
      icon={TrendingUp}
      defaultExpanded={defaultExpanded}
    >
      <div className="space-y-4">
          {/* Gate Growth Metrics for FREE users */}
          <GatedContent feature="fundamentals_full" showPreview={true}>
          {/* Sub-card 1: Growth Metrics */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Growth Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                label="Revenue CAGR (3Y)"
                value={`${data.growth.revenueCagr3Y.toFixed(1)}%`}
                change={data.growth.revenueCagr3Y - data.growth.revenueCagr5Y}
                changeLabel="vs 5Y"
                sparklineData={data.growth.revenueSparkline}
                color={data.growth.revenueCagr3Y > 15 ? 'green' : data.growth.revenueCagr3Y > 5 ? 'yellow' : 'red'}
              />
              <MetricCard
                label="Profit CAGR (3Y)"
                value={`${data.growth.profitCagr3Y.toFixed(1)}%`}
                change={data.growth.profitCagr3Y - data.growth.profitCagr5Y}
                changeLabel="vs 5Y"
                sparklineData={data.growth.profitSparkline}
                color={data.growth.profitCagr3Y > 15 ? 'green' : data.growth.profitCagr3Y > 5 ? 'yellow' : 'red'}
              />
              <MetricCard
                label="EPS Growth (3Y)"
                value={`${data.growth.epsGrowth.toFixed(1)}%`}
                sparklineData={data.growth.epsSparkline}
                color={data.growth.epsGrowth > 15 ? 'green' : data.growth.epsGrowth > 5 ? 'yellow' : 'red'}
              />
            </div>
          </div>
          </GatedContent>

          {/* Sub-card 2: Profitability (FREE users see ROE, ROCE, OPM only) */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Profitability</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="ROE"
                value={`${data.profitability.roe.current.toFixed(1)}%`}
                change={data.profitability.roe.qoqChange}
                changeLabel="vs Sector"
                color="green"
              />
              <MetricCard
                label="ROCE"
                value={`${data.profitability.roce.current.toFixed(1)}%`}
                change={data.profitability.roce.qoqChange}
                changeLabel="vs Sector"
                color="green"
              />
              <MetricCard
                label="Operating Margin"
                value={`${data.profitability.operatingMargin.current.toFixed(1)}%`}
                change={data.profitability.operatingMargin.qoqChange}
                changeLabel="vs Sector"
                color="blue"
              />
              <MetricCard
                label="Net Margin"
                value={`${data.profitability.netMargin.current.toFixed(1)}%`}
                change={data.profitability.netMargin.qoqChange}
                changeLabel="vs Sector"
                color="blue"
              />
            </div>
          </div>

          {/* Gate remaining sub-cards for FREE users */}
          <GatedContent feature="fundamentals_full" showPreview={true}>
          {/* Sub-card 3: Balance Sheet Health */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Balance Sheet Health</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CircularGauge
                value={data.balanceSheet.debtToEquity}
                min={0}
                max={2}
                label="Debt-to-Equity"
                thresholds={{
                  green: [0, 0.5],
                  yellow: [0.5, 1.0],
                  red: [1.0, 2.0],
                }}
              />
              <CircularGauge
                value={data.balanceSheet.interestCoverage}
                min={0}
                max={20}
                label="Interest Coverage"
                unit="x"
                thresholds={{
                  red: [0, 3],
                  yellow: [3, 8],
                  green: [8, 20],
                }}
              />
              <CircularGauge
                value={data.balanceSheet.currentRatio}
                min={0}
                max={3}
                label="Current Ratio"
                thresholds={{
                  red: [0, 1.0],
                  yellow: [1.0, 1.5],
                  green: [1.5, 3.0],
                }}
              />
              <CircularGauge
                value={data.balanceSheet.cashPercentOfMarketCap}
                min={0}
                max={30}
                label="Cash % of Mkt Cap"
                unit="%"
                thresholds={{
                  red: [0, 3],
                  yellow: [3, 10],
                  green: [10, 30],
                }}
              />
            </div>
          </div>

          {/* Sub-card 4: Cash Flow */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Cash Flow Analysis</h3>
            <div className="space-y-4">
              {/* 5-year bar chart */}
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.cashFlow.yearlyData}>
                  <XAxis dataKey="year" stroke="#8B949E" />
                  <YAxis stroke="#8B949E" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161B22',
                      border: '1px solid #30363D',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="operatingCF" name="Operating CF" fill="#58A6FF" />
                  <Bar dataKey="pat" name="PAT" fill="#A371F7" />
                </BarChart>
              </ResponsiveContainer>

              {/* FCF Yield and OCF/PAT */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-bg-secondary rounded p-3">
                  <div className="text-xs text-text-muted mb-1">FCF Yield</div>
                  <div className="text-xl font-bold text-text-primary font-data">
                    {data.cashFlow.fcfYield.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-bg-secondary rounded p-3">
                  <div className="text-xs text-text-muted mb-1">OCF/PAT Ratio</div>
                  <div
                    className={`text-xl font-bold font-data ${
                      data.cashFlow.ocfToPat >= 1.0 ? 'text-signal-green' : 'text-signal-yellow'
                    }`}
                  >
                    {data.cashFlow.ocfToPat.toFixed(2)}x
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-card 5: Promoter & Insider Activity */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">
              Promoter & Insider Activity
            </h3>
            <div className="space-y-4">
              {/* Promoter holding with trend */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-text-muted">Promoter Holding</div>
                  <div className="text-2xl font-bold text-text-primary font-data">
                    {data.promoter.holding.toFixed(2)}%
                  </div>
                </div>
                <MiniSparkline
                  data={data.promoter.holdingTrend}
                  width={120}
                  height={40}
                  color="#58A6FF"
                  showLastValue
                />
              </div>

              {/* Pledge % */}
              <div className="flex items-center justify-between bg-bg-secondary rounded p-3">
                <div className="text-sm text-text-primary">Pledge</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-lg font-bold font-data ${
                      data.promoter.pledge > 20 ? 'text-signal-red' : 'text-signal-green'
                    }`}
                  >
                    {data.promoter.pledge.toFixed(2)}%
                  </span>
                  {data.promoter.pledge > 20 && (
                    <AlertTriangle className="w-4 h-4 text-signal-red" />
                  )}
                </div>
              </div>

              {/* FII/DII Changes */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="FII Change (QoQ)"
                  value={`${data.promoter.fiiChange > 0 ? '+' : ''}${data.promoter.fiiChange.toFixed(1)}%`}
                  change={data.promoter.fiiChange}
                  color={data.promoter.fiiChange > 0 ? 'green' : 'red'}
                />
                <MetricCard
                  label="DII Change (QoQ)"
                  value={`${data.promoter.diiChange > 0 ? '+' : ''}${data.promoter.diiChange.toFixed(1)}%`}
                  change={data.promoter.diiChange}
                  color={data.promoter.diiChange > 0 ? 'green' : 'red'}
                />
              </div>

              {/* Insider Transactions Table */}
              <div>
                <div className="text-sm font-semibold text-text-primary mb-2">
                  Recent Insider Transactions
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-bg-secondary">
                      <tr>
                        <th className="text-left p-2 text-text-muted font-medium">Date</th>
                        <th className="text-left p-2 text-text-muted font-medium">Person</th>
                        <th className="text-left p-2 text-text-muted font-medium">Type</th>
                        <th className="text-right p-2 text-text-muted font-medium">Quantity</th>
                        <th className="text-right p-2 text-text-muted font-medium">Value (Cr)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.promoter.insiderTransactions.map((txn, idx) => (
                        <tr key={idx} className="border-t border-border-primary">
                          <td className="p-2 text-text-secondary">{txn.date}</td>
                          <td className="p-2 text-text-secondary">{txn.person}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                txn.type === 'BUY'
                                  ? 'bg-signal-green/20 text-signal-green'
                                  : 'bg-signal-red/20 text-signal-red'
                              }`}
                            >
                              {txn.type}
                            </span>
                          </td>
                          <td className="p-2 text-right text-text-secondary font-data">
                            {txn.quantity.toLocaleString()}
                          </td>
                          <td className="p-2 text-right text-text-secondary font-data">
                            ₹{txn.value.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-card 6: Quality Score */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Quality Score</h3>
            <div className="space-y-4">
              {/* Large circular gauge */}
              <div className="flex justify-center">
                <CircularScoreGauge
                  score={data.qualityScore.overall}
                  label="Quality Score"
                  size="lg"
                  showMethodologyLink={true}
                  methodologySection="quality-score"
                />
              </div>

              {/* Factor decomposition */}
              <div>
                <div className="text-sm font-semibold text-text-primary mb-2">
                  Factor Breakdown
                </div>
                <ScoreFactorBreakdown
                  factors={[
                    {
                      name: 'ROE Consistency',
                      weight: 15,
                      value: (data.qualityScore.factors.roeConsistency / 15) * 100,
                      contribution: data.qualityScore.factors.roeConsistency,
                      explanation: 'Measures the stability and consistency of Return on Equity over time. Higher consistency indicates predictable profitability.',
                    },
                    {
                      name: 'ROCE',
                      weight: 15,
                      value: (data.qualityScore.factors.roce / 15) * 100,
                      contribution: data.qualityScore.factors.roce,
                      explanation: 'Return on Capital Employed indicates how efficiently the company uses its capital to generate profits.',
                    },
                    {
                      name: 'OPM Trend',
                      weight: 10,
                      value: (data.qualityScore.factors.opmTrend / 10) * 100,
                      contribution: data.qualityScore.factors.opmTrend,
                      explanation: 'Operating Profit Margin trend shows pricing power and cost management efficiency.',
                    },
                    {
                      name: 'Debt Discipline',
                      weight: 15,
                      value: (data.qualityScore.factors.debtDiscipline / 15) * 100,
                      contribution: data.qualityScore.factors.debtDiscipline,
                      explanation: 'Evaluates the company\'s ability to manage debt levels responsibly and maintain financial flexibility.',
                    },
                    {
                      name: 'Cash Flow Quality',
                      weight: 15,
                      value: (data.qualityScore.factors.cashFlowQuality / 15) * 100,
                      contribution: data.qualityScore.factors.cashFlowQuality,
                      explanation: 'Measures the quality and sustainability of cash flows from operations.',
                    },
                    {
                      name: 'Promoter Holding',
                      weight: 10,
                      value: (data.qualityScore.factors.promoterHolding / 10) * 100,
                      contribution: data.qualityScore.factors.promoterHolding,
                      explanation: 'Stable promoter holding indicates confidence in the business and alignment with shareholders.',
                    },
                    {
                      name: 'Earnings Predictability',
                      weight: 10,
                      value: (data.qualityScore.factors.earningsPredictability / 10) * 100,
                      contribution: data.qualityScore.factors.earningsPredictability,
                      explanation: 'Consistent earnings growth with low volatility suggests a stable business model.',
                    },
                    {
                      name: 'Capital Allocation',
                      weight: 10,
                      value: (data.qualityScore.factors.capitalAllocation / 10) * 100,
                      contribution: data.qualityScore.factors.capitalAllocation,
                      explanation: 'Evaluates management\'s effectiveness in allocating capital to maximize shareholder returns.',
                    },
                  ]}
                />
              </div>
            </div>
          </div>
          </GatedContent>
      </div>
    </CollapsiblePanel>
  );
};
