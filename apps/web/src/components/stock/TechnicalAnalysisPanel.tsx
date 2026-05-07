/**
 * Technical Analysis Panel Component
 *
 * Comprehensive technical indicators and signals organized into 6 sub-sections
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  CartesianGrid,
  ComposedChart,
} from 'recharts';
import { TrendGauge } from '../common/TrendGauge';
import { RSIGauge } from '../common/RSIGauge';
import { CircularGauge } from '../common/CircularGauge';
import { CollapsiblePanel } from '../common/CollapsiblePanel';
import { GatedContent } from '../common/GatedContent';
import { CircularScoreGauge, MetricCard, MiniSparkline, ScoreFactorBreakdown } from '../scores';
import { getTechnicalData } from '../../data/mockTechnicalData';

interface TechnicalAnalysisPanelProps {
  symbol: string;
  currentPrice: number;
  defaultExpanded?: boolean;
}

export const TechnicalAnalysisPanel: React.FC<TechnicalAnalysisPanelProps> = ({
  symbol,
  currentPrice,
  defaultExpanded = false,
}) => {
  const data = getTechnicalData(symbol);

  return (
    <CollapsiblePanel
      title="Technical Analysis"
      icon={Activity}
      defaultExpanded={defaultExpanded}
    >
      <div className="space-y-6">
          {/* 1. Trend Dashboard */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Trend Dashboard</h3>
            <TrendGauge
              status={data.trend.status}
              position={data.trend.position}
              description={data.trend.description}
            />
          </div>

          {/* 2. Moving Average Table */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Moving Averages</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-secondary">
                  <tr>
                    <th className="text-left p-3 text-text-muted font-medium">MA</th>
                    <th className="text-right p-3 text-text-muted font-medium">Value</th>
                    <th className="text-right p-3 text-text-muted font-medium">Distance</th>
                    <th className="text-center p-3 text-text-muted font-medium">Signal</th>
                    <th className="text-center p-3 text-text-muted font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.movingAverages).map(([key, ma], idx) => (
                    <tr
                      key={key}
                      className={`border-t border-border-primary ${
                        idx % 2 === 0 ? 'bg-bg-tertiary' : 'bg-bg-secondary'
                      }`}
                    >
                      <td className="p-3 font-medium text-text-primary">
                        {key.toUpperCase().replace('SMA', 'SMA-')}
                      </td>
                      <td className="p-3 text-right text-text-secondary font-data">
                        ₹{ma.value.toFixed(2)}
                      </td>
                      <td
                        className={`p-3 text-right font-bold font-data ${
                          ma.distancePercent > 0 ? 'text-signal-green' : 'text-signal-red'
                        }`}
                      >
                        {ma.distancePercent > 0 ? '+' : ''}
                        {ma.distancePercent.toFixed(2)}%
                      </td>
                      <td className="p-3 text-center">
                        {ma.signal === 'ABOVE' ? (
                          <div className="inline-flex items-center gap-1 text-signal-green">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Above</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-signal-red">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Below</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1 text-text-secondary">
                          {ma.trend === 'RISING' ? (
                            <TrendingUp className="w-4 h-4 text-signal-green" />
                          ) : ma.trend === 'FALLING' ? (
                            <TrendingDown className="w-4 h-4 text-signal-red" />
                          ) : (
                            <Minus className="w-4 h-4 text-signal-yellow" />
                          )}
                          <span className="text-xs font-medium">{ma.trend}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gate advanced indicators for FREE users */}
          <GatedContent feature="technicals_full" showPreview={true}>
          {/* 3. Oscillator Panel */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Oscillators</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* RSI */}
              <div className="flex justify-center">
                <RSIGauge value={data.oscillators.rsi} />
              </div>

              {/* MACD */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-text-primary">MACD</div>
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-text-muted">MACD: </span>
                      <span
                        className={`font-bold font-data ${
                          data.oscillators.macd.current > 0
                            ? 'text-signal-green'
                            : 'text-signal-red'
                        }`}
                      >
                        {data.oscillators.macd.current.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted">Signal: </span>
                      <span className="font-bold font-data text-text-secondary">
                        {data.oscillators.macd.signal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <ComposedChart data={data.oscillators.macd.histogram}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                    <XAxis dataKey="date" stroke="#8B949E" tick={false} />
                    <YAxis stroke="#8B949E" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161B22',
                        border: '1px solid #30363D',
                        borderRadius: '6px',
                      }}
                    />
                    <ReferenceLine y={0} stroke="#8B949E" strokeDasharray="3 3" />
                    <Bar
                      dataKey="value"
                      fill={(entry: any) => (entry.value > 0 ? '#26A69A' : '#EF5350')}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#58A6FF"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stochastic */}
            <div className="mt-6 space-y-3">
              <div className="text-sm font-semibold text-text-primary">
                Stochastic Oscillator
                <span className="ml-2 text-xs text-text-muted">
                  %K: {data.oscillators.stochastic.k.toFixed(1)} | %D:{' '}
                  {data.oscillators.stochastic.d.toFixed(1)}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={data.oscillators.stochastic.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="date" stroke="#8B949E" tick={false} />
                  <YAxis domain={[0, 100]} stroke="#8B949E" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161B22',
                      border: '1px solid #30363D',
                      borderRadius: '6px',
                    }}
                  />
                  {/* Overbought zone */}
                  <Area
                    type="monotone"
                    dataKey={() => 100}
                    fill="#EF5350"
                    fillOpacity={0.1}
                    stroke="none"
                  />
                  {/* Oversold zone */}
                  <Area
                    type="monotone"
                    dataKey={() => 30}
                    fill="#26A69A"
                    fillOpacity={0.1}
                    stroke="none"
                  />
                  <ReferenceLine y={70} stroke="#EF5350" strokeDasharray="3 3" label="70" />
                  <ReferenceLine y={30} stroke="#26A69A" strokeDasharray="3 3" label="30" />
                  <Line type="monotone" dataKey="k" stroke="#58A6FF" strokeWidth={2} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="d"
                    stroke="#A371F7"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Volume Analysis */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Volume Analysis</h3>
            <div className="space-y-4">
              {/* Volume spike alert */}
              {data.volume.isSpike && (
                <div className="flex items-center gap-2 p-3 bg-signal-yellow/10 border border-signal-yellow/30 rounded">
                  <AlertCircle className="w-5 h-5 text-signal-yellow flex-shrink-0" />
                  <div className="text-sm font-medium text-signal-yellow">
                    Volume Spike Detected — Today's volume is{' '}
                    {(data.volume.todayVolume / data.volume.avgVolume20Day).toFixed(2)}x the 20-day
                    average
                  </div>
                </div>
              )}

              {/* Volume comparison bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-muted">Today's Volume</span>
                  <span className="font-bold font-data text-text-primary">
                    {(data.volume.todayVolume / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="relative h-8 bg-bg-secondary rounded-lg overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-signal-blue/30 rounded-lg"
                    style={{
                      width: `${
                        Math.min(
                          (data.volume.todayVolume / data.volume.avgVolume20Day) * 100,
                          100
                        )
                      }%`,
                    }}
                  />
                  <div
                    className="absolute left-0 top-0 h-full border-r-2 border-signal-yellow"
                    style={{ width: '100%' }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs text-text-muted">
                      20-day avg: {(data.volume.avgVolume20Day / 1000000).toFixed(2)}M
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery % trend */}
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="Delivery %"
                  value={`${data.volume.deliveryPercent.toFixed(1)}%`}
                  color="blue"
                />
                <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
                  <div className="text-xs text-text-muted mb-2">10-Day Trend</div>
                  <MiniSparkline
                    data={data.volume.deliveryTrend}
                    width={120}
                    height={30}
                    color="#58A6FF"
                    showLastValue
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Breakout Detector */}
          <div
            className={`bg-bg-tertiary border rounded-lg p-4 ${
              data.breakout.isActive
                ? 'border-signal-green shadow-[0_0_15px_rgba(38,166,154,0.3)]'
                : 'border-border-primary'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text-primary">Breakout Status</h3>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  data.breakout.isActive
                    ? 'bg-signal-green/20 text-signal-green'
                    : 'bg-bg-secondary text-text-muted'
                }`}
              >
                {data.breakout.isActive ? 'Breakout Detected' : 'No Active Breakout'}
              </div>
            </div>

            {data.breakout.isActive && data.breakout.priceHistory ? (
              <div className="space-y-4">
                {/* Breakout details */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-bg-secondary rounded p-2">
                    <div className="text-xs text-text-muted mb-1">Range Low</div>
                    <div className="text-sm font-bold text-text-primary font-data">
                      ₹{data.breakout.consolidationLow}
                    </div>
                  </div>
                  <div className="bg-bg-secondary rounded p-2">
                    <div className="text-xs text-text-muted mb-1">Range High</div>
                    <div className="text-sm font-bold text-text-primary font-data">
                      ₹{data.breakout.consolidationHigh}
                    </div>
                  </div>
                  <div className="bg-bg-secondary rounded p-2">
                    <div className="text-xs text-text-muted mb-1">Breakout Level</div>
                    <div className="text-sm font-bold text-signal-green font-data">
                      ₹{data.breakout.breakoutLevel}
                    </div>
                  </div>
                  <div className="bg-bg-secondary rounded p-2">
                    <div className="text-xs text-text-muted mb-1">Direction</div>
                    <div
                      className={`text-sm font-bold ${
                        data.breakout.direction === 'UP' ? 'text-signal-green' : 'text-signal-red'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {data.breakout.direction === 'UP' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {data.breakout.direction}
                      </div>
                    </div>
                  </div>
                  <div className="bg-bg-secondary rounded p-2">
                    <div className="text-xs text-text-muted mb-1">Days Ago</div>
                    <div className="text-sm font-bold text-text-primary font-data">
                      {data.breakout.daysSinceBreakout}
                    </div>
                  </div>
                </div>

                {/* Volume confirmation */}
                <div className="flex items-center gap-2">
                  {data.breakout.volumeConfirmed ? (
                    <CheckCircle className="w-4 h-4 text-signal-green" />
                  ) : (
                    <XCircle className="w-4 h-4 text-signal-red" />
                  )}
                  <span className="text-sm text-text-secondary">
                    Volume {data.breakout.volumeConfirmed ? 'Confirmed' : 'Not Confirmed'}
                  </span>
                </div>

                {/* Mini price chart */}
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={data.breakout.priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                    <XAxis dataKey="date" stroke="#8B949E" tick={false} />
                    <YAxis stroke="#8B949E" domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161B22',
                        border: '1px solid #30363D',
                        borderRadius: '6px',
                      }}
                    />
                    <ReferenceLine
                      y={data.breakout.consolidationLow}
                      stroke="#EF5350"
                      strokeDasharray="3 3"
                      label="Low"
                    />
                    <ReferenceLine
                      y={data.breakout.consolidationHigh}
                      stroke="#26A69A"
                      strokeDasharray="3 3"
                      label="High"
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#58A6FF"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-text-muted">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  No breakout detected. Price is trading within normal range.
                </p>
              </div>
            )}
          </div>

          {/* 6. Momentum Score */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Momentum Score</h3>
            <div className="space-y-4">
              {/* Circular gauge */}
              <div className="flex justify-center">
                <CircularScoreGauge
                  score={data.momentumScore.overall}
                  label="Momentum Score"
                  size="lg"
                  showMethodologyLink={true}
                  methodologySection="momentum-score"
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
                      name: 'RSI Positioning',
                      weight: 20,
                      value: (data.momentumScore.factors.rsiPositioning / 20) * 100,
                      contribution: data.momentumScore.factors.rsiPositioning,
                      explanation: 'Relative Strength Index (RSI) measures momentum. Values above 50 indicate bullish momentum.',
                    },
                    {
                      name: 'Price-MA Alignment',
                      weight: 25,
                      value: (data.momentumScore.factors.priceMAAlignment / 25) * 100,
                      contribution: data.momentumScore.factors.priceMAAlignment,
                      explanation: 'Measures price position relative to key moving averages. Higher scores indicate price above multiple MAs.',
                    },
                    {
                      name: 'MACD Trend',
                      weight: 20,
                      value: (data.momentumScore.factors.macdTrend / 20) * 100,
                      contribution: data.momentumScore.factors.macdTrend,
                      explanation: 'MACD indicator shows trend direction and momentum strength. Positive divergence indicates bullish trend.',
                    },
                    {
                      name: 'Volume Confirmation',
                      weight: 15,
                      value: (data.momentumScore.factors.volumeConfirmation / 15) * 100,
                      contribution: data.momentumScore.factors.volumeConfirmation,
                      explanation: 'Volume confirms price moves. Higher volume on up days indicates strong buying interest.',
                    },
                    {
                      name: 'Relative Strength vs Nifty 500',
                      weight: 20,
                      value: (data.momentumScore.factors.relativeStrength / 20) * 100,
                      contribution: data.momentumScore.factors.relativeStrength,
                      explanation: 'Outperformance relative to the broader market index. Higher scores indicate market leadership.',
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
