/**
 * Sectors Page
 *
 * Sector heatmap and performance table with sortable columns
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { sectorPerformanceData, SectorPerformance } from '../data/mockSectorData';

type ChangeMetric = '1D' | '1W' | '1M';

export const Sectors: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState<ChangeMetric>('1D');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Prepare treemap data
  const treemapData = useMemo(() => {
    return sectorPerformanceData.map((sector) => ({
      name: sector.sectorName,
      size: sector.totalMarketCap,
      change:
        selectedMetric === '1D'
          ? sector.change1D
          : selectedMetric === '1W'
          ? sector.change1W
          : sector.change1M,
      sectorId: sector.sectorId,
    }));
  }, [selectedMetric]);

  // Get color based on performance
  const getColor = (change: number) => {
    if (change > 2) return '#26A69A'; // Strong green
    if (change > 1) return '#4DB6AC'; // Medium green
    if (change > 0) return '#80CBC4'; // Light green
    if (change > -1) return '#FFAB91'; // Light red
    if (change > -2) return '#FF8A65'; // Medium red
    return '#EF5350'; // Strong red
  };

  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, change, sectorId } = props;

    if (change === undefined || change === null) {
      return null;
    }

    if (width < 80 || height < 60) {
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={getColor(change)}
            stroke="#161B22"
            strokeWidth={2}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/sectors/${sectorId}`)}
          />
        </g>
      );
    }

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={getColor(change)}
          stroke="#161B22"
          strokeWidth={2}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate(`/sectors/${sectorId}`)}
        />
        {/* Sector Name with outline */}
        <text
          x={x + width / 2}
          y={y + height / 2 - 10}
          textAnchor="middle"
          stroke="#000000"
          strokeWidth={3}
          fill="transparent"
          fontSize={width > 150 ? 14 : 12}
          fontWeight="bold"
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 - 10}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={width > 150 ? 14 : 12}
          fontWeight="bold"
        >
          {name}
        </text>

        {/* Change percentage with outline */}
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          stroke="#000000"
          strokeWidth={3}
          fill="transparent"
          fontSize={width > 150 ? 18 : 14}
          fontWeight="bold"
        >
          {change > 0 ? '+' : ''}
          {change.toFixed(2)}%
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={width > 150 ? 18 : 14}
          fontWeight="bold"
        >
          {change > 0 ? '+' : ''}
          {change.toFixed(2)}%
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-3 shadow-lg">
          <div className="font-bold text-text-primary mb-2">{data.name}</div>
          <div className="space-y-1 text-sm">
            <div
              className={`font-semibold font-data ${
                data.change > 0 ? 'text-signal-green' : 'text-signal-red'
              }`}
            >
              {data.change > 0 ? '+' : ''}
              {data.change.toFixed(2)}%
            </div>
            <div className="text-text-secondary text-xs">
              Market Cap: ₹{(data.size / 100000).toFixed(2)}L Cr
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Table setup
  const columnHelper = createColumnHelper<SectorPerformance>();

  const columns = [
    columnHelper.accessor('sectorName', {
      header: 'Sector Name',
      cell: (info) => (
        <span className="font-semibold text-text-primary cursor-pointer hover:text-signal-blue transition-colors">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('stockCount', {
      header: '# Stocks',
      cell: (info) => <span className="font-data">{info.getValue()}</span>,
    }),
    columnHelper.accessor('change1D', {
      header: '1D %',
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
    columnHelper.accessor('change1W', {
      header: '1W %',
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
    columnHelper.accessor('change1M', {
      header: '1M %',
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
    columnHelper.accessor('change3M', {
      header: '3M %',
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
    columnHelper.accessor('change6M', {
      header: '6M %',
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
    columnHelper.accessor('change1Y', {
      header: '1Y %',
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
    columnHelper.accessor('avgQualityScore', {
      header: 'Avg Quality',
      cell: (info) => {
        const val = info.getValue();
        const color = val >= 70 ? 'text-signal-green' : val >= 40 ? 'text-signal-yellow' : 'text-signal-red';
        return <span className={`font-data font-semibold ${color}`}>{val}</span>;
      },
    }),
    columnHelper.accessor('momentumRating', {
      header: 'Momentum',
      cell: (info) => {
        const val = info.getValue();
        const color =
          val === 'Strong'
            ? 'text-signal-green'
            : val === 'Moderate'
            ? 'text-signal-yellow'
            : 'text-signal-red';
        return <span className={`font-semibold ${color}`}>{val}</span>;
      },
    }),
  ];

  const table = useReactTable({
    data: sectorPerformanceData,
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Sectors</h1>
        <p className="text-text-secondary">
          Comprehensive sector-wise performance analysis and market overview
        </p>
      </div>

      {/* Sector Heatmap */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Sector Heatmap</h2>
          <div className="flex gap-2">
            {(['1D', '1W', '1M'] as ChangeMetric[]).map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                  selectedMetric === metric
                    ? 'bg-signal-blue text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                {metric}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={500}>
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#161B22"
            content={<CustomTreemapContent />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#26A69A' }}></div>
            <span className="text-text-muted">&gt; +2%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4DB6AC' }}></div>
            <span className="text-text-muted">+1% to +2%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#80CBC4' }}></div>
            <span className="text-text-muted">0% to +1%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFAB91' }}></div>
            <span className="text-text-muted">0% to -1%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF8A65' }}></div>
            <span className="text-text-muted">-1% to -2%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF5350' }}></div>
            <span className="text-text-muted">&lt; -2%</span>
          </div>
        </div>
      </div>

      {/* Sector Performance Table */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-primary">
          <h2 className="text-xl font-semibold text-text-primary">Sector Performance</h2>
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
                  onClick={() => navigate(`/sectors/${row.original.sectorId}`)}
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
      </div>
    </div>
  );
};

export default Sectors;
