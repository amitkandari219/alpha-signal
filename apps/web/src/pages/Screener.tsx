/**
 * Screener Page
 *
 * Multi-factor stock screening tool with filters and sortable results
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  Save,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { allScreenerStocks, sectorOptions, ScreenerStock } from '../data/mockScreenerData';
import { VirtualizedStockTable } from '../components/screener/VirtualizedStockTable';
import { SEO } from '../components/SEO';
import { SEO_CONFIG } from '../config/seo';
import { analytics, AnalyticsEvents } from '../services/analytics';

interface FilterState {
  marketCapMin: number;
  marketCapMax: number;
  exchanges: string[];
  marketCapCategories: string[];
  sectors: string[];
  qualityScoreMin: number;
  qualityScoreMax: number;
  growthScoreMin: number;
  growthScoreMax: number;
  roeMin: number;
  roceMin: number;
  riskScoreMax: number;
  debtToEquityMax: number;
  promoterHoldingMin: number;
  pledgeMax: number;
  momentumScoreMin: number;
  momentumScoreMax: number;
  rsiMin: number;
  rsiMax: number;
  trend: string;
  peMin: number;
  peMax: number;
  pbMin: number;
  pbMax: number;
  evEbitdaMin: number;
  evEbitdaMax: number;
}

const defaultFilters: FilterState = {
  marketCapMin: 0,
  marketCapMax: 500000,
  exchanges: [],
  marketCapCategories: [],
  sectors: [],
  qualityScoreMin: 0,
  qualityScoreMax: 100,
  growthScoreMin: 0,
  growthScoreMax: 100,
  roeMin: 0,
  roceMin: 0,
  riskScoreMax: 100,
  debtToEquityMax: 5,
  promoterHoldingMin: 0,
  pledgeMax: 100,
  momentumScoreMin: 0,
  momentumScoreMax: 100,
  rsiMin: 0,
  rsiMax: 100,
  trend: '',
  peMin: -50,
  peMax: 200,
  pbMin: 0,
  pbMax: 50,
  evEbitdaMin: -50,
  evEbitdaMax: 200,
};

export const Screener: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<FilterState>(defaultFilters);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['Market', 'Quality & Growth'])
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageSize, setPageSize] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [sectorSearch, setSectorSearch] = useState('');
  const [useVirtualScroll, setUseVirtualScroll] = useState(true); // Performance mode enabled by default

  // Debounce filters (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  // Filter stocks
  const filteredStocks = useMemo(() => {
    return allScreenerStocks.filter((stock) => {
      if (stock.marketCap < debouncedFilters.marketCapMin || stock.marketCap > debouncedFilters.marketCapMax)
        return false;
      if (debouncedFilters.exchanges.length > 0 && !debouncedFilters.exchanges.includes(stock.exchange)) return false;
      if (
        debouncedFilters.marketCapCategories.length > 0 &&
        !debouncedFilters.marketCapCategories.includes(stock.marketCapCategory)
      )
        return false;
      if (debouncedFilters.sectors.length > 0 && !debouncedFilters.sectors.includes(stock.sector)) return false;
      if (
        stock.qualityScore < debouncedFilters.qualityScoreMin ||
        stock.qualityScore > debouncedFilters.qualityScoreMax
      )
        return false;
      if (
        stock.growthScore < debouncedFilters.growthScoreMin ||
        stock.growthScore > debouncedFilters.growthScoreMax
      )
        return false;
      if (stock.roe < debouncedFilters.roeMin) return false;
      if (stock.roce < debouncedFilters.roceMin) return false;
      if (stock.riskScore > debouncedFilters.riskScoreMax) return false;
      if (stock.debtToEquity > debouncedFilters.debtToEquityMax) return false;
      if (stock.promoterHolding < debouncedFilters.promoterHoldingMin) return false;
      if (stock.pledge > debouncedFilters.pledgeMax) return false;
      if (
        stock.momentumScore < debouncedFilters.momentumScoreMin ||
        stock.momentumScore > debouncedFilters.momentumScoreMax
      )
        return false;
      if (stock.rsi < debouncedFilters.rsiMin || stock.rsi > debouncedFilters.rsiMax) return false;
      if (debouncedFilters.trend && stock.trend !== debouncedFilters.trend) return false;
      if (stock.pe < debouncedFilters.peMin || stock.pe > debouncedFilters.peMax) return false;
      if (stock.pb < debouncedFilters.pbMin || stock.pb > debouncedFilters.pbMax) return false;
      if (stock.evEbitda < debouncedFilters.evEbitdaMin || stock.evEbitda > debouncedFilters.evEbitdaMax)
        return false;

      return true;
    });
  }, [debouncedFilters]);

  // Per-group active filter counts
  const groupFilterCounts = useMemo(() => {
    let market = 0;
    if (filters.marketCapMin > 0 || filters.marketCapMax < 500000) market++;
    if (filters.exchanges.length > 0) market++;
    if (filters.marketCapCategories.length > 0) market++;

    let sectors = filters.sectors.length > 0 ? 1 : 0;

    let qualityGrowth = 0;
    if (filters.qualityScoreMin > 0 || filters.qualityScoreMax < 100) qualityGrowth++;
    if (filters.growthScoreMin > 0 || filters.growthScoreMax < 100) qualityGrowth++;
    if (filters.roeMin > 0) qualityGrowth++;
    if (filters.roceMin > 0) qualityGrowth++;

    let riskGov = 0;
    if (filters.riskScoreMax < 100) riskGov++;
    if (filters.debtToEquityMax < 5) riskGov++;
    if (filters.promoterHoldingMin > 0) riskGov++;
    if (filters.pledgeMax < 100) riskGov++;

    let technicals = 0;
    if (filters.momentumScoreMin > 0 || filters.momentumScoreMax < 100) technicals++;
    if (filters.rsiMin > 0 || filters.rsiMax < 100) technicals++;
    if (filters.trend) technicals++;

    let valuation = 0;
    if (filters.peMin > -50 || filters.peMax < 200) valuation++;
    if (filters.pbMin > 0 || filters.pbMax < 50) valuation++;
    if (filters.evEbitdaMin > -50 || filters.evEbitdaMax < 200) valuation++;

    return {
      Market: market,
      Sectors: sectors,
      'Quality & Growth': qualityGrowth,
      'Risk & Governance': riskGov,
      Technicals: technicals,
      Valuation: valuation,
    };
  }, [filters]);

  const totalActiveFilters = Object.values(groupFilterCounts).reduce((a, b) => a + b, 0);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-signal-green';
    if (score >= 40) return 'text-signal-yellow';
    return 'text-signal-red';
  };

  // Table columns
  const columns = useMemo<ColumnDef<ScreenerStock>[]>(
    () => [
      {
        accessorKey: 'symbol',
        header: 'Symbol',
        cell: (info) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/stock/${info.getValue()}`);
            }}
            className="font-medium text-signal-blue hover:underline"
          >
            {info.getValue() as string}
          </button>
        ),
      },
      {
        accessorKey: 'companyName',
        header: 'Company Name',
        cell: (info) => (
          <div className="max-w-[200px] truncate">{info.getValue() as string}</div>
        ),
      },
      {
        accessorKey: 'sector',
        header: 'Sector',
        cell: (info) => <div className="text-xs">{info.getValue() as string}</div>,
      },
      {
        accessorKey: 'cmp',
        header: 'CMP',
        cell: (info) => {
          const value = info.getValue() as number;
          if (value == null) return <span className="text-xs text-text-muted">-</span>;
          return (
            <span className="font-data">
              ₹{value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          );
        },
      },
      {
        accessorKey: 'marketCap',
        header: 'Mkt Cap',
        cell: (info) => {
          const value = info.getValue() as number;
          if (value == null) return <span className="text-xs text-text-muted">-</span>;
          return (
            <span className="font-data text-xs">
              {value >= 100000 ? `₹${(value / 100000).toFixed(1)}L Cr` : `₹${(value / 1000).toFixed(1)}K Cr`}
            </span>
          );
        },
      },
      {
        accessorKey: 'qualityScore',
        header: 'Quality',
        cell: (info) => {
          const score = info.getValue() as number;
          return (
            <span className={`font-bold font-data ${getScoreColor(score)}`}>
              {score}
            </span>
          );
        },
      },
      {
        accessorKey: 'growthScore',
        header: 'Growth',
        cell: (info) => {
          const score = info.getValue() as number;
          return (
            <span className={`font-bold font-data ${getScoreColor(score)}`}>
              {score}
            </span>
          );
        },
      },
      {
        accessorKey: 'riskScore',
        header: 'Risk',
        cell: (info) => {
          const score = info.getValue() as number;
          const color = score <= 40 ? 'text-signal-green' : score <= 60 ? 'text-signal-yellow' : 'text-signal-red';
          return (
            <span className={`font-bold font-data ${color}`}>
              {score}
            </span>
          );
        },
      },
      {
        accessorKey: 'momentumScore',
        header: 'Momentum',
        cell: (info) => {
          const score = info.getValue() as number;
          return (
            <span className={`font-bold font-data ${getScoreColor(score)}`}>
              {score}
            </span>
          );
        },
      },
      {
        accessorKey: 'roe',
        header: 'ROE',
        cell: (info) => {
          const value = info.getValue() as number;
          if (value == null) return <span className="text-xs text-text-muted">-</span>;
          return <span className="font-data text-xs">{value.toFixed(1)}%</span>;
        },
      },
      {
        accessorKey: 'pe',
        header: 'P/E',
        cell: (info) => {
          const value = info.getValue() as number;
          if (value == null) return <span className="text-xs text-text-muted">-</span>;
          return <span className="font-data text-xs">{value.toFixed(1)}</span>;
        },
      },
      {
        accessorKey: 'return1Y',
        header: '1Y Return',
        cell: (info) => {
          const value = info.getValue() as number;
          if (value == null) return <span className="text-xs text-text-muted">-</span>;
          return (
            <span className={`font-data text-xs font-semibold ${value > 0 ? 'text-signal-green' : 'text-signal-red'}`}>
              {value > 0 ? '+' : ''}{value.toFixed(1)}%
            </span>
          );
        },
      },
    ],
    [navigate]
  );

  const table = useReactTable({
    data: filteredStocks,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setDebouncedFilters(defaultFilters);
  };

  const applyFilters = () => {
    setDebouncedFilters(filters);

    // Track screener usage
    const activeFilterCount = totalActiveFilters;
    analytics.trackScreenerUsed(activeFilterCount, filteredStocks.length);
  };

  const handleExportCSV = () => {
    alert('Export to CSV is available for Pro and Premium users. Upgrade to unlock this feature!');
  };

  const filteredSectorOptions = sectorOptions.filter(s =>
    s.label.toLowerCase().includes(sectorSearch.toLowerCase())
  );

  const toggleCheckbox = (key: 'exchanges' | 'marketCapCategories', value: string) => {
    setFilters(prev => {
      const current = prev[key];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const toggleSector = (value: string) => {
    setFilters(prev => {
      const updated = prev.sectors.includes(value)
        ? prev.sectors.filter(v => v !== value)
        : [...prev.sectors, value];
      return { ...prev, sectors: updated };
    });
  };

  return (
    <>
      <SEO
        title={SEO_CONFIG.screener.title}
        description={SEO_CONFIG.screener.description}
        canonical="/screener"
      />
      <div className="flex gap-6 animate-fade-in">
        {/* Mobile Filter Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-signal-blue text-white rounded-full p-4 shadow-lg"
      >
        <Filter className="w-5 h-5" />
        {totalActiveFilters > 0 && (
          <span className="absolute -top-1 -right-1 bg-signal-red text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {totalActiveFilters}
          </span>
        )}
      </button>

      {/* Filter Sidebar */}
      <div
        className={`fixed md:sticky top-0 left-0 h-screen bg-bg-secondary border-r border-border-primary transition-transform z-40 flex flex-col ${
          showFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ width: '280px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-border-primary flex-shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-signal-blue" />
            <h2 className="text-lg font-semibold text-text-primary">Filters</h2>
            {totalActiveFilters > 0 && (
              <span className="bg-signal-blue text-white text-xs font-bold rounded-full px-2 py-0.5">
                {totalActiveFilters}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowFilters(false)}
            className="md:hidden text-text-muted hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Groups - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Group 1: Market */}
          <div className="border border-border-primary rounded-lg overflow-hidden">
            <button
              onClick={() => toggleGroup('Market')}
              className="w-full flex items-center justify-between p-3 bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">Market</span>
                {groupFilterCounts.Market > 0 && (
                  <span className="bg-signal-blue text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {groupFilterCounts.Market}
                  </span>
                )}
              </div>
              {expandedGroups.has('Market') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedGroups.has('Market') && (
              <div className="p-3 space-y-4">
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Market Cap (Cr)</label>
                  <Slider
                    range
                    min={0}
                    max={500000}
                    step={1000}
                    value={[filters.marketCapMin, filters.marketCapMax]}
                    onChange={(value) => {
                      const [min, max] = value as number[];
                      setFilters(prev => ({ ...prev, marketCapMin: min, marketCapMax: max }));
                    }}
                    styles={{
                      track: { backgroundColor: '#58A6FF' },
                      handle: { borderColor: '#58A6FF' },
                    }}
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>₹{filters.marketCapMin}</span>
                    <span>₹{filters.marketCapMax >= 500000 ? '5L+' : filters.marketCapMax}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Exchange</label>
                  <div className="space-y-2">
                    {['NSE', 'BSE', 'BOTH'].map(ex => (
                      <label key={ex} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.exchanges.includes(ex)}
                          onChange={() => toggleCheckbox('exchanges', ex)}
                          className="rounded"
                        />
                        <span className="text-sm text-text-primary">{ex}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Market Cap Category</label>
                  <div className="space-y-2">
                    {['Large', 'Mid', 'Small', 'Micro'].map(cat => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.marketCapCategories.includes(cat)}
                          onChange={() => toggleCheckbox('marketCapCategories', cat)}
                          className="rounded"
                        />
                        <span className="text-sm text-text-primary">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Group 2: Sectors */}
          <div className="border border-border-primary rounded-lg overflow-hidden">
            <button
              onClick={() => toggleGroup('Sectors')}
              className="w-full flex items-center justify-between p-3 bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">Sectors</span>
                {groupFilterCounts.Sectors > 0 && (
                  <span className="bg-signal-blue text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {groupFilterCounts.Sectors}
                  </span>
                )}
              </div>
              {expandedGroups.has('Sectors') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedGroups.has('Sectors') && (
              <div className="p-3">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search sectors..."
                    value={sectorSearch}
                    onChange={(e) => setSectorSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-bg-secondary border border-border-primary rounded text-sm text-text-primary"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {filteredSectorOptions.map(sector => (
                    <label key={sector.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.sectors.includes(sector.value)}
                        onChange={() => toggleSector(sector.value)}
                        className="rounded"
                      />
                      <span className="text-sm text-text-primary flex-1">{sector.label}</span>
                      <span className="text-xs text-text-muted">({sector.count})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Group 3: Quality & Growth */}
          <div className="border border-border-primary rounded-lg overflow-hidden">
            <button
              onClick={() => toggleGroup('Quality & Growth')}
              className="w-full flex items-center justify-between p-3 bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">Quality & Growth</span>
                {groupFilterCounts['Quality & Growth'] > 0 && (
                  <span className="bg-signal-blue text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {groupFilterCounts['Quality & Growth']}
                  </span>
                )}
              </div>
              {expandedGroups.has('Quality & Growth') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedGroups.has('Quality & Growth') && (
              <div className="p-3 space-y-4">
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Quality Score</label>
                  <Slider
                    range
                    min={0}
                    max={100}
                    value={[filters.qualityScoreMin, filters.qualityScoreMax]}
                    onChange={(value) => {
                      const [min, max] = value as number[];
                      setFilters(prev => ({ ...prev, qualityScoreMin: min, qualityScoreMax: max }));
                    }}
                    styles={{
                      track: { backgroundColor: '#26A69A' },
                      handle: { borderColor: '#26A69A' },
                    }}
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>{filters.qualityScoreMin}</span>
                    <span>{filters.qualityScoreMax}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Growth Score</label>
                  <Slider
                    range
                    min={0}
                    max={100}
                    value={[filters.growthScoreMin, filters.growthScoreMax]}
                    onChange={(value) => {
                      const [min, max] = value as number[];
                      setFilters(prev => ({ ...prev, growthScoreMin: min, growthScoreMax: max }));
                    }}
                    styles={{
                      track: { backgroundColor: '#26A69A' },
                      handle: { borderColor: '#26A69A' },
                    }}
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>{filters.growthScoreMin}</span>
                    <span>{filters.growthScoreMax}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-2 block">ROE Min: {filters.roeMin.toFixed(0)}%</label>
                  <Slider
                    min={0}
                    max={50}
                    value={filters.roeMin}
                    onChange={(value) => setFilters(prev => ({ ...prev, roeMin: value as number }))}
                    styles={{
                      track: { backgroundColor: '#26A69A' },
                      handle: { borderColor: '#26A69A' },
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-2 block">ROCE Min: {filters.roceMin.toFixed(0)}%</label>
                  <Slider
                    min={0}
                    max={50}
                    value={filters.roceMin}
                    onChange={(value) => setFilters(prev => ({ ...prev, roceMin: value as number }))}
                    styles={{
                      track: { backgroundColor: '#26A69A' },
                      handle: { borderColor: '#26A69A' },
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Group 4: Risk & Governance */}
          <div className="border border-border-primary rounded-lg overflow-hidden">
            <button
              onClick={() => toggleGroup('Risk & Governance')}
              className="w-full flex items-center justify-between p-3 bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">Risk & Governance</span>
                {groupFilterCounts['Risk & Governance'] > 0 && (
                  <span className="bg-signal-blue text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {groupFilterCounts['Risk & Governance']}
                  </span>
                )}
              </div>
              {expandedGroups.has('Risk & Governance') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedGroups.has('Risk & Governance') && (
              <div className="p-3 space-y-4">
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Risk Score Max: {filters.riskScoreMax}</label>
                  <Slider
                    min={0}
                    max={100}
                    value={filters.riskScoreMax}
                    onChange={(value) => setFilters(prev => ({ ...prev, riskScoreMax: value as number }))}
                    styles={{
                      track: { backgroundColor: '#EF5350' },
                      handle: { borderColor: '#EF5350' },
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Debt-to-Equity Max: {filters.debtToEquityMax.toFixed(1)}</label>
                  <Slider
                    min={0}
                    max={5}
                    step={0.1}
                    value={filters.debtToEquityMax}
                    onChange={(value) => setFilters(prev => ({ ...prev, debtToEquityMax: value as number }))}
                    styles={{
                      track: { backgroundColor: '#EF5350' },
                      handle: { borderColor: '#EF5350' },
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Promoter Holding Min: {filters.promoterHoldingMin.toFixed(0)}%</label>
                  <Slider
                    min={0}
                    max={100}
                    value={filters.promoterHoldingMin}
                    onChange={(value) => setFilters(prev => ({ ...prev, promoterHoldingMin: value as number }))}
                    styles={{
                      track: { backgroundColor: '#26A69A' },
                      handle: { borderColor: '#26A69A' },
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Pledge Max: {filters.pledgeMax.toFixed(0)}%</label>
                  <Slider
                    min={0}
                    max={100}
                    value={filters.pledgeMax}
                    onChange={(value) => setFilters(prev => ({ ...prev, pledgeMax: value as number }))}
                    styles={{
                      track: { backgroundColor: '#EF5350' },
                      handle: { borderColor: '#EF5350' },
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Group 5: Technicals */}
          <div className="border border-border-primary rounded-lg overflow-hidden">
            <button
              onClick={() => toggleGroup('Technicals')}
              className="w-full flex items-center justify-between p-3 bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">Technicals</span>
                {groupFilterCounts.Technicals > 0 && (
                  <span className="bg-signal-blue text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {groupFilterCounts.Technicals}
                  </span>
                )}
              </div>
              {expandedGroups.has('Technicals') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedGroups.has('Technicals') && (
              <div className="p-3 space-y-4">
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Momentum Score</label>
                  <Slider
                    range
                    min={0}
                    max={100}
                    value={[filters.momentumScoreMin, filters.momentumScoreMax]}
                    onChange={(value) => {
                      const [min, max] = value as number[];
                      setFilters(prev => ({ ...prev, momentumScoreMin: min, momentumScoreMax: max }));
                    }}
                    styles={{
                      track: { backgroundColor: '#58A6FF' },
                      handle: { borderColor: '#58A6FF' },
                    }}
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>{filters.momentumScoreMin}</span>
                    <span>{filters.momentumScoreMax}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-2 block">RSI Range</label>
                  <Slider
                    range
                    min={0}
                    max={100}
                    value={[filters.rsiMin, filters.rsiMax]}
                    onChange={(value) => {
                      const [min, max] = value as number[];
                      setFilters(prev => ({ ...prev, rsiMin: min, rsiMax: max }));
                    }}
                    styles={{
                      track: { backgroundColor: '#58A6FF' },
                      handle: { borderColor: '#58A6FF' },
                    }}
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>{filters.rsiMin}</span>
                    <span>{filters.rsiMax}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Trend</label>
                  <select
                    value={filters.trend}
                    onChange={(e) => setFilters(prev => ({ ...prev, trend: e.target.value }))}
                    className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded text-sm text-text-primary"
                  >
                    <option value="">All Trends</option>
                    <option value="Strong Uptrend">Strong Uptrend</option>
                    <option value="Uptrend">Uptrend</option>
                    <option value="Sideways">Sideways</option>
                    <option value="Downtrend">Downtrend</option>
                    <option value="Strong Downtrend">Strong Downtrend</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Group 6: Valuation */}
          <div className="border border-border-primary rounded-lg overflow-hidden">
            <button
              onClick={() => toggleGroup('Valuation')}
              className="w-full flex items-center justify-between p-3 bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">Valuation</span>
                {groupFilterCounts.Valuation > 0 && (
                  <span className="bg-signal-blue text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {groupFilterCounts.Valuation}
                  </span>
                )}
              </div>
              {expandedGroups.has('Valuation') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedGroups.has('Valuation') && (
              <div className="p-3 space-y-4">
                <div>
                  <label className="text-xs text-text-muted mb-2 block">P/E Ratio</label>
                  <Slider
                    range
                    min={-50}
                    max={200}
                    value={[filters.peMin, filters.peMax]}
                    onChange={(value) => {
                      const [min, max] = value as number[];
                      setFilters(prev => ({ ...prev, peMin: min, peMax: max }));
                    }}
                    styles={{
                      track: { backgroundColor: '#A371F7' },
                      handle: { borderColor: '#A371F7' },
                    }}
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>{filters.peMin}</span>
                    <span>{filters.peMax >= 200 ? '200+' : filters.peMax}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-2 block">P/B Ratio</label>
                  <Slider
                    range
                    min={0}
                    max={50}
                    value={[filters.pbMin, filters.pbMax]}
                    onChange={(value) => {
                      const [min, max] = value as number[];
                      setFilters(prev => ({ ...prev, pbMin: min, pbMax: max }));
                    }}
                    styles={{
                      track: { backgroundColor: '#A371F7' },
                      handle: { borderColor: '#A371F7' },
                    }}
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>{filters.pbMin}</span>
                    <span>{filters.pbMax >= 50 ? '50+' : filters.pbMax}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-2 block">EV/EBITDA</label>
                  <Slider
                    range
                    min={-50}
                    max={200}
                    value={[filters.evEbitdaMin, filters.evEbitdaMax]}
                    onChange={(value) => {
                      const [min, max] = value as number[];
                      setFilters(prev => ({ ...prev, evEbitdaMin: min, evEbitdaMax: max }));
                    }}
                    styles={{
                      track: { backgroundColor: '#A371F7' },
                      handle: { borderColor: '#A371F7' },
                    }}
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>{filters.evEbitdaMin}</span>
                    <span>{filters.evEbitdaMax >= 200 ? '200+' : filters.evEbitdaMax}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Sticky Footer */}
        <div className="p-4 pt-3 border-t border-border-primary bg-bg-secondary flex-shrink-0 space-y-3">
          <button
            onClick={applyFilters}
            className="w-full px-4 py-2 bg-signal-blue text-white rounded-lg hover:bg-signal-blue/90 transition-colors font-medium"
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            className="w-full px-4 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            Reset All
          </button>
          <button className="w-full px-4 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Save Screen
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setShowFilters(false)}
        ></div>
      )}

      {/* Results Area */}
      <div className="flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Stock Screener</h1>
            <p className="text-text-secondary">
              {filteredStocks.length} stocks match your criteria
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Virtual Scroll Toggle */}
            <button
              onClick={() => setUseVirtualScroll(!useVirtualScroll)}
              className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
                useVirtualScroll
                  ? 'border-signal-green text-signal-green bg-signal-green/10'
                  : 'border-border-primary text-text-primary hover:bg-bg-tertiary'
              }`}
              title={useVirtualScroll ? 'Virtual scrolling enabled (faster)' : 'Virtual scrolling disabled'}
            >
              <Zap className="w-4 h-4" />
              {useVirtualScroll ? 'Performance Mode' : 'Standard Mode'}
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Desktop: Table */}
        {useVirtualScroll ? (
          <div className="hidden md:block">
            <VirtualizedStockTable
              data={filteredStocks}
              columns={columns}
              sorting={sorting}
              onSortingChange={setSorting}
            />
          </div>
        ) : (
          <div className="hidden md:block bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-tertiary sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-semibold text-text-muted cursor-pointer hover:text-text-primary transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getIsSorted() ? (
                              header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : (
                                <ArrowDown className="w-3 h-3" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-30" />
                            )}
                          </div>
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
                      className="border-b border-border-default hover:bg-bg-tertiary cursor-pointer transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-sm text-text-primary">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border-primary">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-bg-tertiary border border-border-primary rounded px-2 py-1 text-text-primary"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-1 border border-border-primary rounded text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bg-tertiary transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-text-secondary">
                  Page {table.getState().pagination.pageIndex + 1} of{' '}
                  {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-1 border border-border-primary rounded text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bg-tertiary transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-3">
          {table.getRowModel().rows.map((row) => {
            const stock = row.original;
            return (
              <div
                key={row.id}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className="bg-bg-secondary border border-border-primary rounded-lg p-4 hover:border-signal-blue transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-text-primary">{stock.symbol}</div>
                    <div className="text-sm text-text-secondary truncate">{stock.companyName}</div>
                  </div>
                  <span className="px-2 py-1 text-xs bg-bg-tertiary text-text-muted rounded">
                    {stock.sector}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-lg font-bold font-data text-text-primary">
                      {stock.cmp != null ? `₹${stock.cmp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '-'}
                    </div>
                    <div className={`text-sm font-semibold font-data ${stock.return1Y != null && stock.return1Y > 0 ? 'text-signal-green' : 'text-signal-red'}`}>
                      {stock.return1Y != null ? `${stock.return1Y > 0 ? '+' : ''}${stock.return1Y.toFixed(1)}% (1Y)` : '-'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="text-center">
                      <div className="text-xs text-text-muted">Quality</div>
                      <div className={`text-lg font-bold font-data ${getScoreColor(stock.qualityScore)}`}>
                        {stock.qualityScore}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-text-muted">Growth</div>
                      <div className={`text-lg font-bold font-data ${getScoreColor(stock.growthScore)}`}>
                        {stock.growthScore}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-text-muted">Risk</div>
                      <div className={`text-lg font-bold font-data ${stock.riskScore <= 40 ? 'text-signal-green' : stock.riskScore <= 60 ? 'text-signal-yellow' : 'text-signal-red'}`}>
                        {stock.riskScore}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Mobile Pagination */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 border border-border-primary rounded text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-text-secondary">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 border border-border-primary rounded text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Screener;
