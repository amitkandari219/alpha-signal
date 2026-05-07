/**
 * Market Trends Page
 *
 * Broad market intelligence with indices, breadth, FII/DII flows, sector rotation, and most active stocks
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, Target, Users } from 'lucide-react';
import {
  indicesData,
  marketBreadth,
  fiiDiiFlows,
  fiiDiiSummary,
  sectorRotation,
  volumeLeaders,
  priceGainers,
  priceLosers,
  week52Highs,
  week52Lows,
} from '../data/mockMarketTrendsData';

type ActiveTab = 'volume' | 'gainers' | 'losers' | 'highs' | 'lows';

export const MarketTrends: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('volume');

  // Get most recent FII/DII data for table (last 10 days)
  const recentFlowData = fiiDiiFlows.slice(-10).reverse();

  // Get active stocks based on selected tab
  const getActiveStocks = () => {
    switch (activeTab) {
      case 'volume':
        return volumeLeaders;
      case 'gainers':
        return priceGainers;
      case 'losers':
        return priceLosers;
      case 'highs':
        return week52Highs;
      case 'lows':
        return week52Lows;
      default:
        return volumeLeaders;
    }
  };

  const activeStocks = getActiveStocks();

  // Quadrant labels for sector rotation
  const quadrants = [
    { x: 50, y: 50, label: 'Leading', color: 'text-signal-green' },
    { x: -50, y: 50, label: 'Improving', color: 'text-signal-blue' },
    { x: -50, y: -50, label: 'Lagging', color: 'text-signal-red' },
    { x: 50, y: -50, label: 'Weakening', color: 'text-signal-yellow' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Market Trends</h1>
        <p className="text-text-secondary">
          Comprehensive market intelligence - indices, breadth, flows, and rotation analysis
        </p>
      </div>

      {/* 1. Index Dashboard - 4 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {indicesData.map((index) => (
          <div key={index.symbol} className="bg-bg-secondary border border-border-primary rounded-lg p-6">
            {/* Index Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{index.name}</h3>
                <p className="text-sm text-text-muted">{index.symbol}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-data font-bold text-text-primary">
                  {index.current.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
                <div
                  className={`text-sm font-data font-semibold ${
                    index.change >= 0 ? 'text-signal-green' : 'text-signal-red'
                  }`}
                >
                  {index.change >= 0 ? '+' : ''}
                  {index.change.toFixed(2)} ({index.changePercent >= 0 ? '+' : ''}
                  {index.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>

            {/* Intraday Chart */}
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={index.intradayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis dataKey="time" stroke="#8B949E" style={{ fontSize: 10 }} />
                <YAxis domain={['dataMin', 'dataMax']} stroke="#8B949E" style={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161B22',
                    border: '1px solid #30363D',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#E6EDF3' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={index.change >= 0 ? '#3FB950' : '#F85149'}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* 52-Week Range Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                <span>52W Low: ₹{index.low52w.toLocaleString('en-IN')}</span>
                <span>52W High: ₹{index.high52w.toLocaleString('en-IN')}</span>
              </div>
              <div className="relative h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-signal-red via-signal-yellow to-signal-green rounded-full"
                  style={{
                    left: 0,
                    width: `${
                      ((index.current - index.low52w) / (index.high52w - index.low52w)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Market Breadth */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Market Breadth</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Advances vs Declines */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3">Advances vs Declines</h3>
            <div className="space-y-3">
              {/* Horizontal Stacked Bar */}
              <div className="flex h-12 rounded-lg overflow-hidden">
                <div
                  className="bg-signal-green flex items-center justify-center text-white font-data font-semibold text-sm"
                  style={{
                    width: `${
                      (marketBreadth.advances /
                        (marketBreadth.advances + marketBreadth.declines)) *
                      100
                    }%`,
                  }}
                >
                  {marketBreadth.advances}
                </div>
                <div
                  className="bg-signal-red flex items-center justify-center text-white font-data font-semibold text-sm"
                  style={{
                    width: `${
                      (marketBreadth.declines /
                        (marketBreadth.advances + marketBreadth.declines)) *
                      100
                    }%`,
                  }}
                >
                  {marketBreadth.declines}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-signal-green rounded"></div>
                  <span className="text-text-secondary">Advances</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-signal-red rounded"></div>
                  <span className="text-text-secondary">Declines</span>
                </div>
              </div>

              {/* New Highs & Lows */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-bg-tertiary border border-border-primary rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-signal-green" />
                    <span className="text-xs text-text-secondary">New Highs</span>
                  </div>
                  <div className="text-xl font-data font-bold text-signal-green">
                    {marketBreadth.newHighs}
                  </div>
                </div>
                <div className="bg-bg-tertiary border border-border-primary rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-signal-red" />
                    <span className="text-xs text-text-secondary">New Lows</span>
                  </div>
                  <div className="text-xl font-data font-bold text-signal-red">
                    {marketBreadth.newLows}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: 200 DMA Gauge */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3">Above 200-Day MA</h3>
            <div className="flex flex-col items-center justify-center h-full">
              {/* Circular Gauge */}
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 200 200" className="transform -rotate-90">
                  {/* Background Circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#21262D"
                    strokeWidth="20"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke={
                      marketBreadth.above200DMA >= 70
                        ? '#3FB950'
                        : marketBreadth.above200DMA >= 40
                        ? '#D29922'
                        : '#F85149'
                    }
                    strokeWidth="20"
                    strokeDasharray={`${(marketBreadth.above200DMA / 100) * 502.4} 502.4`}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-data font-bold text-text-primary">
                    {marketBreadth.above200DMA}%
                  </div>
                  <div className="text-xs text-text-muted mt-1">Stocks Above 200 DMA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FII/DII Activity */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">FII/DII Activity</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* FII MTD */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-signal-blue" />
              <span className="text-xs text-text-secondary">FII - Month to Date</span>
            </div>
            <div
              className={`text-xl font-data font-bold ${
                fiiDiiSummary.fiiMTD >= 0 ? 'text-signal-green' : 'text-signal-red'
              }`}
            >
              {fiiDiiSummary.fiiMTD >= 0 ? '+' : ''}₹{Math.abs(fiiDiiSummary.fiiMTD).toLocaleString('en-IN')} Cr
            </div>
          </div>

          {/* DII MTD */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-signal-blue" />
              <span className="text-xs text-text-secondary">DII - Month to Date</span>
            </div>
            <div
              className={`text-xl font-data font-bold ${
                fiiDiiSummary.diiMTD >= 0 ? 'text-signal-green' : 'text-signal-red'
              }`}
            >
              {fiiDiiSummary.diiMTD >= 0 ? '+' : ''}₹{Math.abs(fiiDiiSummary.diiMTD).toLocaleString('en-IN')} Cr
            </div>
          </div>

          {/* FII FY */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-signal-purple" />
              <span className="text-xs text-text-secondary">FII - Financial Year</span>
            </div>
            <div
              className={`text-xl font-data font-bold ${
                fiiDiiSummary.fiiFY >= 0 ? 'text-signal-green' : 'text-signal-red'
              }`}
            >
              {fiiDiiSummary.fiiFY >= 0 ? '+' : ''}₹{Math.abs(fiiDiiSummary.fiiFY).toLocaleString('en-IN')} Cr
            </div>
          </div>

          {/* DII FY */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-signal-purple" />
              <span className="text-xs text-text-secondary">DII - Financial Year</span>
            </div>
            <div
              className={`text-xl font-data font-bold ${
                fiiDiiSummary.diiFY >= 0 ? 'text-signal-green' : 'text-signal-red'
              }`}
            >
              {fiiDiiSummary.diiFY >= 0 ? '+' : ''}₹{Math.abs(fiiDiiSummary.diiFY).toLocaleString('en-IN')} Cr
            </div>
          </div>
        </div>

        {/* 30-Day Chart */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">Last 30 Trading Days</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={fiiDiiFlows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis
                dataKey="date"
                stroke="#8B949E"
                style={{ fontSize: 11 }}
                tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              />
              <YAxis
                stroke="#8B949E"
                style={{ fontSize: 11 }}
                label={{
                  value: '₹ Crores',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#8B949E' },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#E6EDF3' }}
                formatter={(value: any) => [`₹${value.toLocaleString('en-IN')} Cr`, '']}
              />
              <Legend />
              <Bar dataKey="fiiNet" fill="#58A6FF" name="FII Net Flow" />
              <Bar dataKey="diiNet" fill="#A371F7" name="DII Net Flow" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent 10 Days Table */}
        <div>
          <h3 className="text-sm font-semibold text-text-secondary mb-3">Recent 10 Trading Days</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-tertiary border-b border-border-primary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">FII Buy</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">FII Sell</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">FII Net</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">DII Buy</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">DII Sell</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">DII Net</th>
                </tr>
              </thead>
              <tbody>
                {recentFlowData.map((flow, idx) => (
                  <tr key={idx} className="border-b border-border-primary hover:bg-bg-tertiary transition-colors">
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {new Date(flow.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm font-data text-right text-text-secondary">
                      ₹{flow.fiiBuy.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm font-data text-right text-text-secondary">
                      ₹{flow.fiiSell.toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-data font-semibold text-right ${
                        flow.fiiNet >= 0 ? 'text-signal-green' : 'text-signal-red'
                      }`}
                    >
                      {flow.fiiNet >= 0 ? '+' : ''}₹{flow.fiiNet.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm font-data text-right text-text-secondary">
                      ₹{flow.diiBuy.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm font-data text-right text-text-secondary">
                      ₹{flow.diiSell.toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-data font-semibold text-right ${
                        flow.diiNet >= 0 ? 'text-signal-green' : 'text-signal-red'
                      }`}
                    >
                      {flow.diiNet >= 0 ? '+' : ''}₹{flow.diiNet.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Sector Rotation Chart (RRG Style) */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Sector Rotation Map</h2>
        <p className="text-sm text-text-secondary mb-6">
          Relative performance vs momentum change - sectors positioned in quadrants
        </p>

        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
            <XAxis
              type="number"
              dataKey="relativePerformance"
              domain={[-100, 100]}
              stroke="#8B949E"
              label={{
                value: 'Relative Performance →',
                position: 'insideBottom',
                offset: -10,
                style: { fill: '#8B949E' },
              }}
            />
            <YAxis
              type="number"
              dataKey="momentumChange"
              domain={[-100, 100]}
              stroke="#8B949E"
              label={{
                value: 'Momentum Change →',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#8B949E' },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161B22',
                border: '1px solid #30363D',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#E6EDF3' }}
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-bg-secondary border border-border-primary rounded-lg p-3 shadow-lg">
                      <div className="font-semibold text-text-primary mb-2">{data.sectorName}</div>
                      <div className="space-y-1 text-xs">
                        <div className="text-text-secondary">
                          Rel. Perf: <span className="font-data">{data.relativePerformance.toFixed(1)}%</span>
                        </div>
                        <div className="text-text-secondary">
                          Momentum: <span className="font-data">{data.momentumChange.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="#8B949E" strokeWidth={2} />
            <ReferenceLine y={0} stroke="#8B949E" strokeWidth={2} />

            {/* Quadrant Labels */}
            {quadrants.map((q, idx) => (
              <text
                key={idx}
                x={q.x > 0 ? '75%' : '25%'}
                y={q.y > 0 ? '20%' : '80%'}
                textAnchor="middle"
                fill="#8B949E"
                fontSize={14}
                fontWeight="bold"
              >
                {q.label}
              </text>
            ))}

            <Scatter data={sectorRotation} fill="#58A6FF">
              {sectorRotation.map((entry, index) => {
                // Determine color based on quadrant
                let color = '#58A6FF';
                if (entry.relativePerformance >= 0 && entry.momentumChange >= 0) {
                  color = '#3FB950'; // Leading (top-right)
                } else if (entry.relativePerformance < 0 && entry.momentumChange >= 0) {
                  color = '#58A6FF'; // Improving (top-left)
                } else if (entry.relativePerformance < 0 && entry.momentumChange < 0) {
                  color = '#F85149'; // Lagging (bottom-left)
                } else {
                  color = '#D29922'; // Weakening (bottom-right)
                }
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
              <LabelList
                dataKey="sectorName"
                position="top"
                style={{ fill: '#E6EDF3', fontSize: 11, fontWeight: 600 }}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-signal-green"></div>
            <span className="text-text-muted">Leading</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-signal-blue"></div>
            <span className="text-text-muted">Improving</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-signal-red"></div>
            <span className="text-text-muted">Lagging</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-signal-yellow"></div>
            <span className="text-text-muted">Weakening</span>
          </div>
        </div>
      </div>

      {/* 5. Most Active Stocks */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
        {/* Tab Header */}
        <div className="border-b border-border-primary p-4">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Most Active Stocks</h2>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'volume', label: 'Volume Leaders', icon: Activity },
              { key: 'gainers', label: 'Price Gainers', icon: TrendingUp },
              { key: 'losers', label: 'Price Losers', icon: TrendingDown },
              { key: 'highs', label: '52W Highs', icon: Target },
              { key: 'lows', label: '52W Lows', icon: Target },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ActiveTab)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-signal-blue text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stocks Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-tertiary border-b border-border-primary">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">
                  Company Name
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">CMP</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">Change %</th>
                {activeTab === 'volume' && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">
                    Volume (Lakh)
                  </th>
                )}
                {(activeTab === 'highs' || activeTab === 'lows') && (
                  <>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">
                      52W High
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">
                      52W Low
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {activeStocks.map((stock, idx) => (
                <tr
                  key={stock.symbol}
                  onClick={() => navigate(`/stock/${stock.symbol}`)}
                  className="border-b border-border-primary hover:bg-bg-tertiary transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-text-muted">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-data font-semibold text-signal-blue">
                    {stock.symbol}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-primary">{stock.companyName}</td>
                  <td className="px-4 py-3 text-sm font-data font-semibold text-right">
                    ₹{stock.cmp.toFixed(2)}
                  </td>
                  <td
                    className={`px-4 py-3 text-sm font-data font-semibold text-right ${
                      stock.changePercent >= 0 ? 'text-signal-green' : 'text-signal-red'
                    }`}
                  >
                    {stock.changePercent >= 0 ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                  </td>
                  {activeTab === 'volume' && (
                    <td className="px-4 py-3 text-sm font-data text-right text-text-secondary">
                      {stock.volume?.toLocaleString('en-IN')}
                    </td>
                  )}
                  {(activeTab === 'highs' || activeTab === 'lows') && (
                    <>
                      <td className="px-4 py-3 text-sm font-data text-right text-text-secondary">
                        ₹{stock.high52w?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-data text-right text-text-secondary">
                        ₹{stock.low52w?.toFixed(2)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketTrends;
