/**
 * Portfolio Page (Premium Feature)
 *
 * Comprehensive portfolio tracking with holdings, analytics, and AI insights
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Upload,
  Link2,
  Brain,
  AlertTriangle,
  Info,
  Lightbulb,
  Crown,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import {
  portfolioHoldings,
  portfolioSummary,
  sectorAllocation,
  portfolioScores,
  topHoldings,
  aiInsights,
  currentUserTier,
  tierLimits,
  PortfolioHolding,
} from '../data/mockPortfolioData';
import { useFeatureGate } from '../hooks/useFeatureGate';
import { UpgradePrompt } from '../components/common/UpgradePrompt';
import { AIDisclaimer } from '../components/common/AIDisclaimer';

export const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const { hasAccess, requiredTier } = useFeatureGate('portfolio');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAddHoldingModal, setShowAddHoldingModal] = useState(false);

  const handleAIFeedback = (type: 'up' | 'down') => {
    console.log(`Portfolio AI insights feedback: ${type}`);
    // TODO: Send feedback to API
  };

  // Block FREE users with upgrade modal
  if (!hasAccess) {
    return (
      <div className="p-6">
        <UpgradePrompt
          feature="portfolio"
          variant="modal"
          requiredTier={requiredTier as 'PRO' | 'PREMIUM'}
        />
      </div>
    );
  }

  // If no access, show upgrade prompt (old logic below, now handled above)
  if (!hasAccess) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-text-primary">Portfolio</h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-signal-purple/10 border border-signal-purple/30 text-signal-purple">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          </div>
          <p className="text-text-secondary">
            Track your holdings, P&L, and portfolio analytics with AI-powered insights
          </p>
        </div>

        {/* Upgrade Card */}
        <div className="bg-gradient-to-br from-signal-purple/20 via-bg-secondary to-bg-secondary border border-signal-purple/30 rounded-lg p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-signal-purple/20 mb-6">
            <Crown className="w-8 h-8 text-signal-purple" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            Upgrade to Premium for Portfolio Tracking
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto mb-8">
            Get comprehensive portfolio management with holdings tracking, sector allocation analysis,
            concentration risk monitoring, AI-powered insights, and XIRR calculations — all in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-6 py-3 bg-signal-purple text-white rounded-lg font-medium hover:bg-signal-purple/90 transition-colors">
              Upgrade to Premium
            </button>
            <button className="px-6 py-3 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary">
              Learn More
            </button>
          </div>

          {/* Feature List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            {[
              { icon: TrendingUp, title: 'Holdings Tracking', desc: 'Real-time P&L and XIRR calculation' },
              { icon: Brain, title: 'AI Insights', desc: 'Portfolio recommendations and risk alerts' },
              { icon: AlertTriangle, title: 'Risk Monitoring', desc: 'Concentration and sector exposure analysis' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-bg-secondary border border-border-primary rounded-lg p-6 text-left"
              >
                <feature.icon className="w-8 h-8 text-signal-purple mb-3" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Holdings table setup
  const columnHelper = createColumnHelper<PortfolioHolding>();

  const columns = [
    columnHelper.accessor('symbol', {
      header: 'Symbol',
      cell: (info) => (
        <span className="font-data font-semibold text-signal-blue cursor-pointer hover:underline">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('companyName', {
      header: 'Company Name',
      cell: (info) => <span className="text-text-primary">{info.getValue()}</span>,
    }),
    columnHelper.accessor('quantity', {
      header: 'Qty',
      cell: (info) => <span className="font-data">{info.getValue()}</span>,
    }),
    columnHelper.accessor('avgPrice', {
      header: 'Avg Price',
      cell: (info) => <span className="font-data">₹{info.getValue().toFixed(2)}</span>,
    }),
    columnHelper.accessor('cmp', {
      header: 'CMP',
      cell: (info) => <span className="font-data font-semibold">₹{info.getValue().toFixed(2)}</span>,
    }),
    columnHelper.accessor('currentValue', {
      header: 'Current Value',
      cell: (info) => <span className="font-data">₹{info.getValue().toLocaleString('en-IN')}</span>,
    }),
    columnHelper.accessor('pnl', {
      header: 'P&L',
      cell: (info) => {
        const val = info.getValue();
        return (
          <span className={`font-data font-semibold ${val >= 0 ? 'text-signal-green' : 'text-signal-red'}`}>
            {val >= 0 ? '+' : ''}₹{Math.abs(val).toLocaleString('en-IN')}
          </span>
        );
      },
    }),
    columnHelper.accessor('pnlPercent', {
      header: 'P&L %',
      cell: (info) => {
        const val = info.getValue();
        return (
          <span className={`font-data font-semibold ${val >= 0 ? 'text-signal-green' : 'text-signal-red'}`}>
            {val >= 0 ? '+' : ''}
            {val.toFixed(2)}%
          </span>
        );
      },
    }),
    columnHelper.accessor('weight', {
      header: 'Weight %',
      cell: (info) => <span className="font-data">{info.getValue().toFixed(1)}%</span>,
    }),
    columnHelper.accessor('qualityScore', {
      header: 'Quality',
      cell: (info) => {
        const val = info.getValue();
        const color = val >= 70 ? 'text-signal-green' : val >= 40 ? 'text-signal-yellow' : 'text-signal-red';
        return <span className={`font-data font-semibold ${color}`}>{val}</span>;
      },
    }),
    columnHelper.accessor('riskScore', {
      header: 'Risk',
      cell: (info) => {
        const val = info.getValue();
        const color = val >= 60 ? 'text-signal-red' : val >= 40 ? 'text-signal-yellow' : 'text-signal-green';
        return <span className={`font-data font-semibold ${color}`}>{val}</span>;
      },
    }),
  ];

  const table = useReactTable({
    data: portfolioHoldings,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Prepare radar chart data
  const radarData = [
    { subject: 'Quality', score: portfolioScores.quality, fullMark: 100 },
    { subject: 'Growth', score: portfolioScores.growth, fullMark: 100 },
    { subject: 'Momentum', score: portfolioScores.momentum, fullMark: 100 },
    { subject: 'Sentiment', score: portfolioScores.sentiment, fullMark: 100 },
    { subject: 'Risk', score: 100 - portfolioScores.risk, fullMark: 100 }, // Invert risk (lower is better)
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-text-primary">Portfolio</h1>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-signal-purple/10 border border-signal-purple/30 text-signal-purple">
            <Crown className="w-3 h-3" />
            Premium
          </div>
        </div>
        <p className="text-text-secondary">
          Track your holdings, P&L, and portfolio analytics with AI-powered insights
        </p>
      </div>

      {/* 1. Portfolio Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invested */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
          <div className="text-sm text-text-secondary mb-1">Total Invested</div>
          <div className="text-2xl font-data font-bold text-text-primary">
            ₹{portfolioSummary.totalInvested.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Current Value */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
          <div className="text-sm text-text-secondary mb-1">Current Value</div>
          <div className="text-2xl font-data font-bold text-text-primary">
            ₹{portfolioSummary.currentValue.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Total P&L */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
          <div className="text-sm text-text-secondary mb-1">Total P&L</div>
          <div
            className={`text-2xl font-data font-bold ${
              portfolioSummary.totalPnl >= 0 ? 'text-signal-green' : 'text-signal-red'
            }`}
          >
            {portfolioSummary.totalPnl >= 0 ? '+' : ''}₹
            {Math.abs(portfolioSummary.totalPnl).toLocaleString('en-IN')}
          </div>
          <div
            className={`text-sm font-data font-semibold ${
              portfolioSummary.totalPnlPercent >= 0 ? 'text-signal-green' : 'text-signal-red'
            }`}
          >
            {portfolioSummary.totalPnlPercent >= 0 ? '+' : ''}
            {portfolioSummary.totalPnlPercent.toFixed(2)}%
          </div>
        </div>

        {/* Today's P&L */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
          <div className="text-sm text-text-secondary mb-1">Today's P&L</div>
          <div
            className={`text-2xl font-data font-bold ${
              portfolioSummary.todayPnl >= 0 ? 'text-signal-green' : 'text-signal-red'
            }`}
          >
            {portfolioSummary.todayPnl >= 0 ? '+' : ''}₹
            {Math.abs(portfolioSummary.todayPnl).toLocaleString('en-IN')}
          </div>
          <div
            className={`text-sm font-data font-semibold ${
              portfolioSummary.todayPnlPercent >= 0 ? 'text-signal-green' : 'text-signal-red'
            }`}
          >
            {portfolioSummary.todayPnlPercent >= 0 ? '+' : ''}
            {portfolioSummary.todayPnlPercent.toFixed(2)}%
          </div>
        </div>

        {/* XIRR */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
          <div className="text-sm text-text-secondary mb-1">XIRR (Annualized)</div>
          <div className="text-2xl font-data font-bold text-signal-green">
            {portfolioSummary.xirr.toFixed(2)}%
          </div>
          <div className="text-sm text-text-muted">{portfolioSummary.holdingCount} Holdings</div>
        </div>
      </div>

      {/* 4. Add Holdings Section */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowAddHoldingModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-signal-blue text-white rounded-lg font-medium hover:bg-signal-blue/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Holding
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary">
          <Upload className="w-4 h-4" />
          Import from CSV
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary relative">
          <Link2 className="w-4 h-4" />
          Sync with Broker
          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-signal-yellow text-bg-primary text-xs font-bold rounded">
            Soon
          </span>
        </button>
      </div>

      {/* 2. Holdings Table */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-primary">
          <h2 className="text-xl font-semibold text-text-primary">Holdings</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-tertiary border-b border-border-primary">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 text-left">
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-2 text-xs font-semibold text-text-secondary ${
                            header.column.getCanSort() ? 'cursor-pointer hover:text-text-primary' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-text-muted">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="w-4 h-4" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="w-4 h-4" />
                              ) : (
                                <ArrowUpDown className="w-4 h-4" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/stock/${row.original.symbol}`)}
                  className="border-b border-border-primary hover:bg-bg-tertiary transition-colors cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {/* Total Row */}
            <tfoot className="bg-bg-tertiary border-t-2 border-border-primary">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-text-primary">
                  Total
                </td>
                <td className="px-4 py-3 text-sm font-data font-semibold text-text-primary">
                  ₹{portfolioSummary.currentValue.toLocaleString('en-IN')}
                </td>
                <td
                  className={`px-4 py-3 text-sm font-data font-semibold ${
                    portfolioSummary.totalPnl >= 0 ? 'text-signal-green' : 'text-signal-red'
                  }`}
                >
                  {portfolioSummary.totalPnl >= 0 ? '+' : ''}₹
                  {Math.abs(portfolioSummary.totalPnl).toLocaleString('en-IN')}
                </td>
                <td
                  className={`px-4 py-3 text-sm font-data font-semibold ${
                    portfolioSummary.totalPnlPercent >= 0 ? 'text-signal-green' : 'text-signal-red'
                  }`}
                >
                  {portfolioSummary.totalPnlPercent >= 0 ? '+' : ''}
                  {portfolioSummary.totalPnlPercent.toFixed(2)}%
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 3. Portfolio-Level Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Allocation */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Sector Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sectorAllocation}
                dataKey="value"
                nameKey="sector"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={(entry) => `${entry.sector} (${entry.percentage.toFixed(1)}%)`}
                labelLine={{ stroke: '#8B949E' }}
              >
                {sectorAllocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Value']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Score Distribution */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Portfolio Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#30363D" />
              <PolarAngleAxis dataKey="subject" stroke="#8B949E" style={{ fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} stroke="#8B949E" style={{ fontSize: 10 }} />
              <Radar
                name="Portfolio"
                dataKey="score"
                stroke="#58A6FF"
                fill="#58A6FF"
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: '8px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Concentration Risk */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Concentration Risk - Top 5 Holdings
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topHoldings} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis type="number" domain={[0, 25]} stroke="#8B949E" style={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="symbol" stroke="#8B949E" style={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => [`${value.toFixed(1)}%`, 'Weight']}
              />
              <Bar dataKey="weight" fill="#D29922" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-text-muted">
            ⚠️ Recommended: Keep individual holdings below 15% of portfolio
          </div>
        </div>

        {/* Risk Exposure */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Risk Exposure Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-signal-red" />
                <span className="text-text-primary">High Risk Holdings</span>
              </div>
              <span className="text-xl font-data font-bold text-signal-red">2</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-signal-yellow" />
                <span className="text-text-primary">Medium Risk Holdings</span>
              </div>
              <span className="text-xl font-data font-bold text-signal-yellow">4</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-signal-green" />
                <span className="text-text-primary">Low Risk Holdings</span>
              </div>
              <span className="text-xl font-data font-bold text-signal-green">6</span>
            </div>

            <div className="mt-4 p-4 bg-signal-yellow/10 border border-signal-yellow/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-signal-yellow flex-shrink-0 mt-0.5" />
                <div className="text-sm text-text-primary">
                  <span className="font-semibold">Portfolio Risk Score: {portfolioScores.risk}</span>
                  <p className="text-text-secondary mt-1">
                    Your portfolio has moderate risk. Consider rebalancing high-risk positions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. AI Portfolio Insights */}
      <div className="bg-bg-secondary border border-signal-purple/30 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-signal-purple" />
          <h2 className="text-xl font-semibold text-text-primary">AI Portfolio Insights</h2>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-signal-purple/10 border border-signal-purple/30 text-signal-purple">
            <Crown className="w-3 h-3" />
            Premium
          </div>
        </div>
        <p className="text-sm text-text-secondary mb-6">
          AI-powered analysis of your portfolio composition, risk exposure, and actionable recommendations
        </p>

        <div className="space-y-3">
          {aiInsights.map((insight, idx) => {
            const Icon =
              insight.type === 'warning'
                ? AlertTriangle
                : insight.type === 'info'
                ? Info
                : Lightbulb;
            const color =
              insight.type === 'warning'
                ? 'signal-yellow'
                : insight.type === 'info'
                ? 'signal-blue'
                : 'signal-green';

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-4 bg-${color}/10 border border-${color}/30 rounded-lg`}
              >
                <Icon className={`w-5 h-5 text-${color} flex-shrink-0 mt-0.5`} />
                <p className="text-sm text-text-primary">{insight.message}</p>
              </div>
            );
          })}
        </div>

        {/* AI Disclaimer - SEBI Compliance */}
        <div className="mt-6">
          <AIDisclaimer
            modelVersion="GPT-4 Turbo + Portfolio Analytics"
            generatedAt="Updated just now"
            onFeedback={handleAIFeedback}
          />
        </div>
      </div>

      {/* Add Holding Modal */}
      {showAddHoldingModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAddHoldingModal(false)}
        >
          <div
            className="bg-bg-secondary border border-border-primary rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-text-primary mb-4">Add Holding</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Stock Symbol
                </label>
                <input
                  type="text"
                  placeholder="e.g., RELIANCE"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-signal-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  placeholder="e.g., 10"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-signal-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Average Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 2450.50"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-signal-blue"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button className="flex-1 px-4 py-2 bg-signal-blue text-white rounded-lg font-medium hover:bg-signal-blue/90 transition-colors">
                Add Holding
              </button>
              <button
                onClick={() => setShowAddHoldingModal(false)}
                className="flex-1 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
