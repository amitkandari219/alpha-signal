/**
 * Sector Detail Page
 *
 * Comprehensive sector analysis with AI summary, top stocks, charts, and FII/DII flows
 */

import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp, AlertTriangle, Wind, Brain, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import {
  LineChart,
  Line,
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
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { sectorPerformanceData, getAllSectorDetails, SectorStock } from '../data/mockSectorData';
import { CollapsiblePanel } from '../components/common/CollapsiblePanel';

export const SectorDetail: React.FC = () => {
  const { sectorId } = useParams<{ sectorId: string }>();
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'qualityScore', desc: true }]);

  const sectorDetails = useMemo(() => getAllSectorDetails(), []);
  const sectorData = sectorDetails[sectorId || ''];
  const sectorPerf = sectorPerformanceData.find((s) => s.sectorId === sectorId);

  if (!sectorData || !sectorPerf) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Sector Not Found</h2>
          <p className="text-text-secondary mb-6">The sector you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/sectors')}
            className="px-6 py-3 bg-signal-blue text-white rounded-lg hover:bg-signal-blue/90 transition-colors"
          >
            Back to Sectors
          </button>
        </div>
      </div>
    );
  }

  // Table setup for top stocks
  const columnHelper = createColumnHelper<SectorStock>();

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
    columnHelper.accessor('cmp', {
      header: 'CMP',
      cell: (info) => <span className="font-data font-semibold">₹{info.getValue().toFixed(2)}</span>,
    }),
    columnHelper.accessor('changePercent', {
      header: 'Change %',
      cell: (info) => {
        const val = info.getValue();
        return (
          <span
            className={`font-data font-semibold ${val >= 0 ? 'text-signal-green' : 'text-signal-red'}`}
          >
            {val >= 0 ? '+' : ''}
            {val.toFixed(2)}%
          </span>
        );
      },
    }),
    columnHelper.accessor('qualityScore', {
      header: 'Quality',
      cell: (info) => {
        const val = info.getValue();
        const color = val >= 70 ? 'text-signal-green' : val >= 40 ? 'text-signal-yellow' : 'text-signal-red';
        return <span className={`font-data font-semibold ${color}`}>{val}</span>;
      },
    }),
    columnHelper.accessor('growthScore', {
      header: 'Growth',
      cell: (info) => {
        const val = info.getValue();
        const color = val >= 70 ? 'text-signal-green' : val >= 40 ? 'text-signal-yellow' : 'text-signal-red';
        return <span className={`font-data font-semibold ${color}`}>{val}</span>;
      },
    }),
    columnHelper.accessor('momentumScore', {
      header: 'Momentum',
      cell: (info) => {
        const val = info.getValue();
        const color = val >= 70 ? 'text-signal-green' : val >= 40 ? 'text-signal-yellow' : 'text-signal-red';
        return <span className={`font-data font-semibold ${color}`}>{val}</span>;
      },
    }),
    columnHelper.accessor('pe', {
      header: 'P/E',
      cell: (info) => <span className="font-data">{info.getValue().toFixed(1)}</span>,
    }),
    columnHelper.accessor('roe', {
      header: 'ROE %',
      cell: (info) => {
        const val = info.getValue();
        return <span className={`font-data ${val > 15 ? 'text-signal-green' : ''}`}>{val.toFixed(1)}%</span>;
      },
    }),
  ];

  const table = useReactTable({
    data: sectorData.topStocks,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/sectors" className="hover:text-text-primary transition-colors">
          Sectors
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-text-primary">{sectorData.sectorName}</span>
      </div>

      {/* Header with Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sector Name Card */}
        <div className="lg:col-span-2 bg-bg-secondary border border-border-primary rounded-lg p-6">
          <h1 className="text-3xl font-bold text-text-primary mb-2">{sectorData.sectorName}</h1>
          <p className="text-text-secondary mb-4">{sectorData.stockCount} listed companies</p>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm text-text-secondary">1D Change</span>
              <div
                className={`text-xl font-data font-bold ${
                  sectorPerf.change1D >= 0 ? 'text-signal-green' : 'text-signal-red'
                }`}
              >
                {sectorPerf.change1D >= 0 ? '+' : ''}
                {sectorPerf.change1D.toFixed(2)}%
              </div>
            </div>
            <div>
              <span className="text-sm text-text-secondary">1Y Change</span>
              <div
                className={`text-xl font-data font-bold ${
                  sectorPerf.change1Y >= 0 ? 'text-signal-green' : 'text-signal-red'
                }`}
              >
                {sectorPerf.change1Y >= 0 ? '+' : ''}
                {sectorPerf.change1Y.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-signal-green" />
            <span className="text-sm font-semibold text-text-secondary">Avg Quality Score</span>
          </div>
          <div className="text-3xl font-bold text-text-primary">{sectorPerf.avgQualityScore}</div>
          <div className="text-sm text-text-secondary mt-1">Sector-wide average</div>
        </div>

        <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-5 h-5 text-signal-blue" />
            <span className="text-sm font-semibold text-text-secondary">Tailwind Score</span>
          </div>
          <div className="text-3xl font-bold text-text-primary">{sectorData.tailwindScore}</div>
          <div className="text-sm text-text-secondary mt-1">Market momentum</div>
        </div>
      </div>

      {/* AI Summary */}
      <CollapsiblePanel title="AI Sector Analysis" icon={Brain} defaultExpanded={true}>
        <div className="space-y-6">
          {/* Business Cycle Position */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-2">Business Cycle Position</h3>
            <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
              <span className="text-lg font-semibold text-text-primary">
                {sectorData.aiSummary.businessCyclePosition}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tailwinds */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-signal-green" />
                <h3 className="text-sm font-semibold text-text-secondary">Tailwinds</h3>
              </div>
              <ul className="space-y-2">
                {sectorData.aiSummary.tailwinds.map((tailwind, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 bg-signal-green/10 border border-signal-green/30 rounded-lg p-3"
                  >
                    <span className="text-signal-green mt-0.5">✓</span>
                    <span className="text-sm text-text-primary">{tailwind}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Headwinds */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-signal-red" />
                <h3 className="text-sm font-semibold text-text-secondary">Headwinds</h3>
              </div>
              <ul className="space-y-2">
                {sectorData.aiSummary.headwinds.map((headwind, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 bg-signal-red/10 border border-signal-red/30 rounded-lg p-3"
                  >
                    <span className="text-signal-red mt-0.5">!</span>
                    <span className="text-sm text-text-primary">{headwind}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CollapsiblePanel>

      {/* Sector vs Market Chart */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          {sectorData.sectorName} vs Nifty 500
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sectorData.vsMarketData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
            <XAxis dataKey="date" stroke="#8B949E" style={{ fontSize: 12 }} />
            <YAxis stroke="#8B949E" style={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161B22',
                border: '1px solid #30363D',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#E6EDF3' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="sectorIndex"
              stroke="#58A6FF"
              strokeWidth={2}
              name={sectorData.sectorName}
              dot={{ fill: '#58A6FF', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="nifty500"
              stroke="#8B949E"
              strokeWidth={2}
              name="Nifty 500"
              dot={{ fill: '#8B949E', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* FII/DII Flow Chart */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          FII/DII Flows - Last 4 Quarters
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sectorData.fiiDiiFlow}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
            <XAxis dataKey="quarter" stroke="#8B949E" style={{ fontSize: 12 }} />
            <YAxis stroke="#8B949E" style={{ fontSize: 12 }} label={{ value: '₹ Crores', angle: -90, position: 'insideLeft', style: { fill: '#8B949E' } }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161B22',
                border: '1px solid #30363D',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#E6EDF3' }}
            />
            <Legend />
            <Bar dataKey="fiiFlow" fill="#3FB950" name="FII Flow" />
            <Bar dataKey="diiFlow" fill="#58A6FF" name="DII Flow" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Stocks Table */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-primary">
          <h2 className="text-xl font-semibold text-text-primary">Top Stocks in Sector</h2>
        </div>

        {sectorData.topStocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-tertiary border-b border-border-primary">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left">
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center gap-2 text-sm font-semibold text-text-secondary ${
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
                    className="border-b border-border-primary hover:bg-bg-tertiary transition-colors cursor-pointer"
                    onClick={() => navigate(`/stock/${row.original.symbol}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-text-secondary">No stock data available for this sector</div>
        )}
      </div>
    </div>
  );
};

export default SectorDetail;
