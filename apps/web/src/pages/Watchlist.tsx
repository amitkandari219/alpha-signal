/**
 * Watchlist Page
 *
 * Shows all user watchlists in a grid with create/edit/delete actions
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { mockWatchlists, tierLimits, currentUserTier, Watchlist } from '../data/mockWatchlistData';

export const WatchlistPage: React.FC = () => {
  const navigate = useNavigate();
  const [watchlists, setWatchlists] = useState<Watchlist[]>(mockWatchlists);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const limits = tierLimits[currentUserTier];
  const canCreateMore = watchlists.length < limits.watchlists;

  const handleCreateWatchlist = () => {
    if (!canCreateMore) {
      setShowUpgradeModal(true);
      return;
    }

    const newWatchlist: Watchlist = {
      id: `${Date.now()}`,
      name: 'New Watchlist',
      stockCount: 0,
      lastUpdated: new Date(),
      topStocks: [],
      stocks: [],
    };

    setWatchlists([...watchlists, newWatchlist]);
    setEditingId(newWatchlist.id);
    setEditName(newWatchlist.name);
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      setWatchlists(
        watchlists.map((w) => (w.id === editingId ? { ...w, name: editName } : w))
      );
      setEditingId(null);
      setEditName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = (id: string) => {
    setWatchlists(watchlists.filter((w) => w.id !== id));
    setDeleteConfirm(null);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">My Watchlists</h1>
          <p className="text-text-secondary">
            Track and monitor your favorite stocks in organized lists
          </p>
        </div>
        <button
          onClick={handleCreateWatchlist}
          className="flex items-center gap-2 px-4 py-2 bg-signal-blue text-white rounded-lg hover:bg-signal-blue/90 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Create New Watchlist
        </button>
      </div>

      {/* Tier Limit Info */}
      {currentUserTier !== 'premium' && (
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">
                {currentUserTier === 'free' ? 'Free Plan' : 'Pro Plan'}: {watchlists.length} /{' '}
                {limits.watchlists === Infinity ? '∞' : limits.watchlists} watchlists
              </p>
            </div>
            {!canCreateMore && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-sm text-signal-blue hover:underline"
              >
                Upgrade to create more
              </button>
            )}
          </div>
        </div>
      )}

      {/* Watchlists Grid */}
      {watchlists.length === 0 ? (
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-12 text-center">
          <TrendingUp className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">No watchlists yet</h3>
          <p className="text-text-secondary mb-6">
            Create your first watchlist to start tracking stocks
          </p>
          <button
            onClick={handleCreateWatchlist}
            className="inline-flex items-center gap-2 px-6 py-3 bg-signal-blue text-white rounded-lg hover:bg-signal-blue/90 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Watchlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlists.map((watchlist) => (
            <div
              key={watchlist.id}
              className="bg-bg-secondary border border-border-primary rounded-lg p-5 hover:border-signal-blue transition-colors cursor-pointer group"
              onClick={() => navigate(`/watchlist/${watchlist.id}`)}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {editingId === watchlist.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-bg-tertiary border border-border-primary rounded px-2 py-1 text-text-primary font-semibold focus:outline-none focus:border-signal-blue"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-text-primary group-hover:text-signal-blue transition-colors">
                      {watchlist.name}
                    </h3>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(watchlist.id, watchlist.name);
                    }}
                    className="p-1 text-text-muted hover:text-signal-blue transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(watchlist.id);
                    }}
                    className="p-1 text-text-muted hover:text-signal-red transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stock Count & Last Updated */}
              <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                <span>{watchlist.stockCount} stocks</span>
                <span>•</span>
                <span>{formatDate(watchlist.lastUpdated)}</span>
              </div>

              {/* Top 3 Stocks */}
              {watchlist.topStocks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {watchlist.topStocks.map((symbol) => (
                    <span
                      key={symbol}
                      className="px-2 py-1 bg-bg-tertiary border border-border-primary rounded text-xs font-medium text-text-primary font-data"
                    >
                      {symbol}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-text-primary mb-2">Delete Watchlist</h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete this watchlist? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-signal-red text-white rounded-lg hover:bg-signal-red/90 transition-colors"
              >
                Delete
              </button>
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
              You've reached the limit for {currentUserTier === 'free' ? 'Free' : 'Pro'} plan.
              Upgrade to create more watchlists.
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

export default WatchlistPage;
