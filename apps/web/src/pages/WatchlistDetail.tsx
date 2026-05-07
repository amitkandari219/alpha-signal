/**
 * Watchlist Detail Page
 *
 * Detailed view of a watchlist with stocks table, drag-and-drop reordering, and real-time updates
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  Plus,
  Edit2,
  X,
  Bell,
  BellOff,
  GripVertical,
  Download,
  Search,
  Trash2,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { mockWatchlists, WatchlistStock, tierLimits, currentUserTier } from '../data/mockWatchlistData';
import { allScreenerStocks } from '../data/mockScreenerData';

// Sortable Row Component
interface SortableRowProps {
  stock: WatchlistStock;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleAlert: (id: string) => void;
  onNavigate: (symbol: string) => void;
  priceFlash: Record<string, 'up' | 'down' | null>;
}

const SortableRow: React.FC<SortableRowProps> = ({
  stock,
  isSelected,
  onToggleSelect,
  onRemove,
  onToggleAlert,
  onNavigate,
  priceFlash,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stock.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-signal-green';
    if (score >= 40) return 'text-signal-yellow';
    return 'text-signal-red';
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'Bullish') return 'text-signal-green';
    if (sentiment === 'Bearish') return 'text-signal-red';
    return 'text-text-secondary';
  };

  const flashClass = priceFlash[stock.id]
    ? priceFlash[stock.id] === 'up'
      ? 'animate-flash-green'
      : 'animate-flash-red'
    : '';

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-border-primary hover:bg-bg-tertiary transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-text-muted" />
          </div>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(stock.id)}
            className="w-4 h-4 rounded border-border-primary bg-bg-tertiary"
          />
        </div>
      </td>
      <td
        className="px-4 py-3 font-data font-semibold text-signal-blue cursor-pointer hover:underline"
        onClick={() => onNavigate(stock.symbol)}
      >
        {stock.symbol}
      </td>
      <td className="px-4 py-3 text-text-primary">{stock.companyName}</td>
      <td className={`px-4 py-3 font-data font-semibold ${flashClass}`}>₹{stock.cmp.toFixed(2)}</td>
      <td
        className={`px-4 py-3 font-data font-semibold ${
          stock.changePercent >= 0 ? 'text-signal-green' : 'text-signal-red'
        }`}
      >
        {stock.changePercent >= 0 ? '+' : ''}
        {stock.changePercent.toFixed(2)}%
      </td>
      <td
        className={`px-4 py-3 font-data ${
          stock.changeToday >= 0 ? 'text-signal-green' : 'text-signal-red'
        }`}
      >
        {stock.changeToday >= 0 ? '+' : ''}₹{stock.changeToday.toFixed(2)}
      </td>
      <td className={`px-4 py-3 font-data font-semibold ${getScoreColor(stock.qualityScore)}`}>
        {stock.qualityScore}
      </td>
      <td className={`px-4 py-3 font-data font-semibold ${getScoreColor(stock.momentumScore)}`}>
        {stock.momentumScore}
      </td>
      <td className={`px-4 py-3 ${getSentimentColor(stock.sentiment)}`}>{stock.sentiment}</td>
      <td className="px-4 py-3">
        <button
          onClick={() => onToggleAlert(stock.id)}
          className={`p-1 rounded transition-colors ${
            stock.alertActive
              ? 'text-signal-blue hover:text-signal-blue/80'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          {stock.alertActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onRemove(stock.id)}
          className="p-1 text-text-muted hover:text-signal-red transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

export const WatchlistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const watchlistData = mockWatchlists.find((w) => w.id === id);
  const [watchlistName, setWatchlistName] = useState(watchlistData?.name || 'My Watchlist');
  const [isEditingName, setIsEditingName] = useState(false);
  const [stocks, setStocks] = useState<WatchlistStock[]>(
    watchlistData?.stocks.sort((a, b) => a.order - b.order) || []
  );
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down' | null>>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const limits = tierLimits[currentUserTier];
  const canAddMore = stocks.length < limits.stocksPerWatchlist;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prev) =>
        prev.map((stock) => {
          const change = (Math.random() - 0.5) * 10; // Random change between -5 to +5
          const newCmp = Math.max(stock.cmp + change, 1);
          const newChangePercent = ((newCmp - stock.cmp) / stock.cmp) * 100;

          // Trigger flash animation
          if (change !== 0) {
            setPriceFlash((f) => ({ ...f, [stock.id]: change > 0 ? 'up' : 'down' }));
            setTimeout(() => {
              setPriceFlash((f) => ({ ...f, [stock.id]: null }));
            }, 500);
          }

          return {
            ...stock,
            cmp: newCmp,
            changePercent: stock.changePercent + newChangePercent,
            changeToday: stock.changeToday + change,
          };
        })
      );
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  const handleToggleSelect = (stockId: string) => {
    setSelectedStocks((prev) => {
      const next = new Set(prev);
      if (next.has(stockId)) {
        next.delete(stockId);
      } else {
        next.add(stockId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedStocks.size === stocks.length) {
      setSelectedStocks(new Set());
    } else {
      setSelectedStocks(new Set(stocks.map((s) => s.id)));
    }
  };

  const handleRemoveStock = (stockId: string) => {
    setStocks((prev) => prev.filter((s) => s.id !== stockId));
    setSelectedStocks((prev) => {
      const next = new Set(prev);
      next.delete(stockId);
      return next;
    });
  };

  const handleRemoveSelected = () => {
    setStocks((prev) => prev.filter((s) => !selectedStocks.has(s.id)));
    setSelectedStocks(new Set());
  };

  const handleToggleAlert = (stockId: string) => {
    setStocks((prev) =>
      prev.map((s) => (s.id === stockId ? { ...s, alertActive: !s.alertActive } : s))
    );
  };

  const handleSetAlertsForAll = () => {
    setStocks((prev) => prev.map((s) => ({ ...s, alertActive: true })));
  };

  const handleExportCSV = () => {
    const headers = ['Symbol', 'Name', 'CMP', 'Change %', 'Change Today', 'Quality', 'Momentum', 'Sentiment'];
    const rows = stocks.map((s) => [
      s.symbol,
      s.companyName,
      s.cmp.toFixed(2),
      s.changePercent.toFixed(2),
      s.changeToday.toFixed(2),
      s.qualityScore,
      s.momentumScore,
      s.sentiment,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${watchlistName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleAddStock = (symbol: string) => {
    if (!canAddMore) {
      setShowUpgradeModal(true);
      return;
    }

    const stockData = allScreenerStocks.find((s) => s.symbol === symbol);
    if (!stockData) return;

    const newStock: WatchlistStock = {
      id: `${Date.now()}`,
      symbol: stockData.symbol,
      companyName: stockData.companyName,
      cmp: stockData.cmp,
      changePercent: Math.random() * 10 - 5,
      changeToday: Math.random() * 100 - 50,
      qualityScore: stockData.qualityScore,
      momentumScore: stockData.momentumScore,
      sentiment: stockData.momentumScore > 70 ? 'Bullish' : stockData.momentumScore < 40 ? 'Bearish' : 'Neutral',
      alertActive: false,
      order: stocks.length,
    };

    setStocks([...stocks, newStock]);
    setShowAddModal(false);
    setSearchQuery('');
  };

  const filteredSearchStocks = allScreenerStocks.filter(
    (stock) =>
      (stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.companyName.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !stocks.some((s) => s.symbol === stock.symbol)
  );

  if (!watchlistData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Watchlist Not Found</h2>
          <p className="text-text-secondary mb-6">The watchlist you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/watchlist')}
            className="px-6 py-3 bg-signal-blue text-white rounded-lg hover:bg-signal-blue/90 transition-colors"
          >
            Back to Watchlists
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/watchlist" className="hover:text-text-primary transition-colors">
          Watchlists
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-text-primary">{watchlistName}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isEditingName ? (
            <input
              type="text"
              value={watchlistName}
              onChange={(e) => setWatchlistName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingName(false);
                if (e.key === 'Escape') {
                  setWatchlistName(watchlistData.name);
                  setIsEditingName(false);
                }
              }}
              className="text-3xl font-bold bg-bg-tertiary border border-border-primary rounded px-3 py-1 text-text-primary focus:outline-none focus:border-signal-blue"
              autoFocus
            />
          ) : (
            <h1 className="text-3xl font-bold text-text-primary">{watchlistName}</h1>
          )}
          <button
            onClick={() => setIsEditingName(true)}
            className="p-2 text-text-muted hover:text-signal-blue transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <span className="text-text-secondary">({stocks.length} stocks)</span>
        </div>

        <button
          onClick={() => {
            if (!canAddMore) {
              setShowUpgradeModal(true);
            } else {
              setShowAddModal(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-signal-blue text-white rounded-lg hover:bg-signal-blue/90 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Stock
        </button>
      </div>

      {/* Tier Limit Info */}
      {currentUserTier !== 'premium' && (
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">
                {currentUserTier === 'free' ? 'Free Plan' : 'Pro Plan'}: {stocks.length} /{' '}
                {limits.stocksPerWatchlist === Infinity ? '∞' : limits.stocksPerWatchlist} stocks per
                watchlist
              </p>
            </div>
            {!canAddMore && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-sm text-signal-blue hover:underline"
              >
                Upgrade to add more
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedStocks.size > 0 && (
        <div className="flex items-center gap-4 bg-bg-secondary border border-border-primary rounded-lg p-4">
          <span className="text-text-primary font-medium">{selectedStocks.size} selected</span>
          <button
            onClick={handleRemoveSelected}
            className="flex items-center gap-2 px-3 py-1.5 border border-border-primary text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Remove Selected
          </button>
          <button
            onClick={handleSetAlertsForAll}
            className="flex items-center gap-2 px-3 py-1.5 border border-border-primary text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors text-sm"
          >
            <Bell className="w-4 h-4" />
            Set Alerts for All
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 border border-border-primary text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors text-sm ml-auto"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      )}

      {/* Stocks Table */}
      {stocks.length === 0 ? (
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-12 text-center">
          <h3 className="text-xl font-semibold text-text-primary mb-2">No stocks yet</h3>
          <p className="text-text-secondary mb-6">Add stocks to start tracking their performance</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-signal-blue text-white rounded-lg hover:bg-signal-blue/90 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Stock
          </button>
        </div>
      ) : (
        <div className="bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-tertiary border-b border-border-primary">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStocks.size === stocks.length && stocks.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-border-primary bg-bg-tertiary"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Symbol</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">CMP</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                    Change %
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                    Change (Today)
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                    Quality Score
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                    Momentum Score
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                    Sentiment
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Alert</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={stocks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <tbody>
                    {stocks.map((stock) => (
                      <SortableRow
                        key={stock.id}
                        stock={stock}
                        isSelected={selectedStocks.has(stock.id)}
                        onToggleSelect={handleToggleSelect}
                        onRemove={handleRemoveStock}
                        onToggleAlert={handleToggleAlert}
                        onNavigate={(symbol) => navigate(`/stock/${symbol}`)}
                        priceFlash={priceFlash}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </DndContext>
            </table>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-6 max-w-2xl w-full max-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-text-primary">Add Stock to Watchlist</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery('');
                }}
                className="p-1 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search by symbol or company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:border-signal-blue"
              />
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredSearchStocks.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  {searchQuery ? 'No stocks found' : 'Start typing to search for stocks'}
                </div>
              ) : (
                filteredSearchStocks.slice(0, 20).map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg hover:border-signal-blue border border-transparent transition-colors cursor-pointer"
                    onClick={() => handleAddStock(stock.symbol)}
                  >
                    <div>
                      <div className="font-semibold text-text-primary font-data">{stock.symbol}</div>
                      <div className="text-sm text-text-secondary">{stock.companyName}</div>
                    </div>
                    <button className="px-3 py-1 bg-signal-blue text-white rounded-lg hover:bg-signal-blue/90 transition-colors text-sm">
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-text-primary mb-2">Upgrade Required</h3>
            <p className="text-text-secondary mb-6">
              You've reached the limit for {currentUserTier === 'free' ? 'Free' : 'Pro'} plan. Upgrade to
              add more stocks.
            </p>
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-text-primary">Pro Plan</span>
                  <span className="text-signal-blue font-bold">₹999/mo</span>
                </div>
                <p className="text-sm text-text-secondary">5 watchlists, 50 stocks each</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg border-2 border-signal-blue">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-text-primary">Premium Plan</span>
                  <span className="text-signal-blue font-bold">₹2,999/mo</span>
                </div>
                <p className="text-sm text-text-secondary">Unlimited watchlists & stocks</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Upgrade flow would be implemented here');
                  setShowUpgradeModal(false);
                }}
                className="px-4 py-2 bg-signal-blue text-white rounded-lg hover:bg-signal-blue/90 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchlistDetail;
