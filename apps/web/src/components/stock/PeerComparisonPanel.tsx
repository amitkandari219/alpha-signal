/**
 * Peer Comparison Panel Component
 *
 * Shows peer companies from the same sector with comparative metrics and radar chart
 */

import React, { useState, useMemo } from 'react';
import { Users, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Link } from 'react-router-dom';
import { CircularScoreGauge } from '../scores';
import { getPeerComparisonData, PeerCompany } from '../../data/mockPeerData';

interface PeerComparisonPanelProps {
  symbol: string;
}

type SortColumn =
  | 'name'
  | 'cmp'
  | 'marketCap'
  | 'qualityScore'
  | 'growthScore'
  | 'riskScore'
  | 'roe'
  | 'peRatio'
  | 'return1Y';
type SortDirection = 'asc' | 'desc' | null;

export const PeerComparisonPanel: React.FC<PeerComparisonPanelProps> = ({ symbol }) => {
  const data = getPeerComparisonData(symbol);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Sort companies based on current sort state
  const sortedCompanies = useMemo(() => {
    if (!sortColumn || !sortDirection) return data.companies;

    return [...data.companies].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Handle special case for name sorting
      if (sortColumn === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data.companies, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 text-text-muted" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3 h-3 text-signal-blue" />;
    }
    return <ArrowDown className="w-3 h-3 text-signal-blue" />;
  };

  // Prepare radar chart data
  const currentStock = data.companies.find((c) => c.symbol === symbol);
  const radarData = [
    {
      metric: 'Quality',
      current: currentStock?.radarScores.quality || 0,
      median: data.sectorMedian.quality,
    },
    {
      metric: 'Growth',
      current: currentStock?.radarScores.growth || 0,
      median: data.sectorMedian.growth,
    },
    {
      metric: 'Risk (Inv)',
      current: currentStock?.radarScores.riskInverse || 0,
      median: data.sectorMedian.riskInverse,
    },
    {
      metric: 'Sentiment',
      current: currentStock?.radarScores.sentiment || 0,
      median: data.sectorMedian.sentiment,
    },
    {
      metric: 'Momentum',
      current: currentStock?.radarScores.momentum || 0,
      median: data.sectorMedian.momentum,
    },
  ];

  const formatMarketCap = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L Cr`;
    }
    return `₹${(value / 1000).toFixed(1)}K Cr`;
  };

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-signal-blue" />
          <h2 className="text-xl font-semibold text-text-primary">Peer Comparison</h2>
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-signal-blue/20 text-signal-blue">
            {data.sector}
          </span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden rounded-lg border border-border-primary">
            <table className="min-w-full divide-y divide-border-primary">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-bg-tertiary px-4 py-3 text-left"
                  >
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
                    >
                      Company
                      {getSortIcon('name')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('cmp')}
                      className="flex items-center gap-1 justify-end w-full text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
                    >
                      CMP
                      {getSortIcon('cmp')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('marketCap')}
                      className="flex items-center gap-1 justify-end w-full text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
                    >
                      Market Cap
                      {getSortIcon('marketCap')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleSort('qualityScore')}
                      className="flex items-center gap-1 justify-center w-full text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
                    >
                      Quality
                      {getSortIcon('qualityScore')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleSort('growthScore')}
                      className="flex items-center gap-1 justify-center w-full text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
                    >
                      Growth
                      {getSortIcon('growthScore')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleSort('riskScore')}
                      className="flex items-center gap-1 justify-center w-full text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
                    >
                      Risk
                      {getSortIcon('riskScore')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('roe')}
                      className="flex items-center gap-1 justify-end w-full text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
                    >
                      ROE
                      {getSortIcon('roe')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('peRatio')}
                      className="flex items-center gap-1 justify-end w-full text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
                    >
                      P/E
                      {getSortIcon('peRatio')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('return1Y')}
                      className="flex items-center gap-1 justify-end w-full text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
                    >
                      1Y Return
                      {getSortIcon('return1Y')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default bg-bg-secondary">
                {sortedCompanies.map((company) => {
                  const isCurrentStock = company.symbol === symbol;
                  return (
                    <tr
                      key={company.symbol}
                      className={`hover:bg-bg-tertiary transition-colors ${
                        isCurrentStock ? 'border-l-4 border-l-signal-blue bg-signal-blue/5' : ''
                      }`}
                    >
                      <td
                        className={`sticky left-0 z-10 px-4 py-4 ${
                          isCurrentStock ? 'bg-signal-blue/5' : 'bg-bg-secondary'
                        } group-hover:bg-bg-tertiary`}
                      >
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/stock/${company.symbol}`}
                            className="text-sm font-medium text-text-primary hover:text-signal-blue flex items-center gap-1"
                          >
                            {company.name}
                            {!isCurrentStock && (
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </Link>
                          {isCurrentStock && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-signal-blue/20 text-signal-blue">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted font-mono">{company.symbol}</div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-data text-text-primary whitespace-nowrap">
                        ₹{company.cmp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-data text-text-secondary whitespace-nowrap">
                        {formatMarketCap(company.marketCap)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <CircularScoreGauge
                            score={company.qualityScore}
                            label=""
                            size="sm"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-block px-2 py-1 text-sm font-bold font-data rounded ${
                            company.growthScore >= 70
                              ? 'bg-signal-green/20 text-signal-green'
                              : company.growthScore >= 50
                              ? 'bg-signal-yellow/20 text-signal-yellow'
                              : 'bg-signal-red/20 text-signal-red'
                          }`}
                        >
                          {company.growthScore}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-block px-2 py-1 text-sm font-bold font-data rounded ${
                            company.riskScore <= 40
                              ? 'bg-signal-green/20 text-signal-green'
                              : company.riskScore <= 55
                              ? 'bg-signal-yellow/20 text-signal-yellow'
                              : 'bg-signal-red/20 text-signal-red'
                          }`}
                        >
                          {company.riskScore}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-data text-text-primary">
                        {company.roe.toFixed(1)}%
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-data text-text-primary">
                        {company.peRatio.toFixed(1)}
                      </td>
                      <td
                        className={`px-4 py-4 text-right text-sm font-bold font-data ${
                          company.return1Y > 0 ? 'text-signal-green' : 'text-signal-red'
                        }`}
                      >
                        {company.return1Y > 0 ? '+' : ''}
                        {company.return1Y.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Radar Chart Section */}
      <div className="bg-bg-tertiary border border-border-primary rounded-lg p-6">
        <h3 className="text-base font-semibold text-text-primary mb-4">
          Performance vs Sector Median
        </h3>

        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#30363D" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#8B949E', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#8B949E', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161B22',
                border: '1px solid #30363D',
                borderRadius: '6px',
              }}
              formatter={(value: any) => [value.toFixed(1), '']}
            />
            <Radar
              name={currentStock?.name || symbol}
              dataKey="current"
              stroke="#58A6FF"
              fill="#58A6FF"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name="Sector Median"
              dataKey="median"
              stroke="#8B949E"
              fill="transparent"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
              }}
              iconType="line"
            />
          </RadarChart>
        </ResponsiveContainer>

        <div className="mt-4 text-xs text-text-muted text-center">
          Higher values indicate better performance. Risk is inverted (higher = lower risk).
        </div>
      </div>
    </div>
  );
};
