/**
 * Comparison Search Component
 *
 * Allows users to add comparison stocks/indices
 * Tier-based: FREE = locked, PRO = max 1, PREMIUM = max 3
 * Shows Nifty 50, sector indices, and custom search
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Search, TrendingUp } from 'lucide-react';
import { useChartStore } from '../../../store/useChartStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { SubscriptionTier } from '../../../hooks/useFeatureGate';
import { LockBadge } from '../../common/LockBadge';
import { UpgradePrompt } from '../../common/UpgradePrompt';

interface ComparisonSearchProps {
  className?: string;
}

// Popular comparison options
const POPULAR_COMPARISONS = [
  { symbol: 'NIFTY50', name: 'Nifty 50' },
  { symbol: 'NIFTY500', name: 'Nifty 500' },
  { symbol: 'NIFTYMIDCAP100', name: 'Nifty Midcap 100' },
  { symbol: 'NIFTYSMALLCAP250', name: 'Nifty Smallcap 250' },
];

// Sector indices
const SECTOR_INDICES = [
  { symbol: 'NIFTYBANK', name: 'Nifty Bank' },
  { symbol: 'NIFTYIT', name: 'Nifty IT' },
  { symbol: 'NIFTYPHARMA', name: 'Nifty Pharma' },
  { symbol: 'NIFTYAUTO', name: 'Nifty Auto' },
  { symbol: 'NIFTYMETAL', name: 'Nifty Metal' },
  { symbol: 'NIFTYFMCG', name: 'Nifty FMCG' },
  { symbol: 'NIFTYREALTY', name: 'Nifty Realty' },
  { symbol: 'NIFTYENERGY', name: 'Nifty Energy' },
];

export const ComparisonSearch: React.FC<ComparisonSearchProps> = ({
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const comparisons = useChartStore((state) => state.comparisons);
  const addComparison = useChartStore((state) => state.addComparison);
  const removeComparison = useChartStore((state) => state.removeComparison);
  const { user } = useAuthStore();

  const userTier: SubscriptionTier = (user?.tier as SubscriptionTier) || 'FREE';

  // Tier-based limits
  const maxComparisons = userTier === 'FREE' ? 0 : userTier === 'PRO' ? 1 : 3;
  const hasAccess = userTier !== 'FREE';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAddComparison = (symbol: string, name: string) => {
    const success = addComparison(symbol, name);

    if (!success) {
      if (comparisons.some((c) => c.symbol === symbol)) {
        alert(`${name} is already added`);
      } else {
        alert(`Maximum ${maxComparisons} comparisons allowed`);
      }
    }
  };

  const handleRemoveComparison = (symbol: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeComparison(symbol);
  };

  // Filter options based on search query
  const filteredPopular = POPULAR_COMPARISONS.filter(
    (opt) =>
      opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSectors = SECTOR_INDICES.filter(
    (opt) =>
      opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className={`relative ${className}`} ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          onClick={() => {
            if (!hasAccess) {
              setShowUpgradePrompt(true);
            } else {
              setIsOpen(!isOpen);
            }
          }}
          className="
            px-3 py-1.5 rounded-lg text-sm font-medium
            bg-bg-tertiary text-text-secondary
            hover:bg-bg-primary hover:text-text-primary
            transition-all flex items-center gap-2
          "
          title={hasAccess ? "Add comparison" : "Comparison requires PRO plan"}
        >
          <Plus className="w-4 h-4" />
          <span>Compare</span>
          {!hasAccess && <LockBadge tier="PRO" size="sm" />}
          {comparisons.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-accent-blue text-white text-xs">
              {comparisons.length}
            </span>
          )}
        </button>

      {/* Active Comparisons (shown next to button) */}
      {comparisons.length > 0 && (
        <div className="absolute top-full mt-2 left-0 flex items-center gap-2 z-10">
          {comparisons.map((comp) => (
            <div
              key={comp.symbol}
              className="
                px-2 py-1 rounded-md text-xs font-medium
                bg-bg-secondary border border-border-default text-text-primary
                flex items-center gap-1.5
              "
            >
              <TrendingUp className="w-3 h-3" />
              <span>{comp.symbol}</span>
              <button
                onClick={(e) => handleRemoveComparison(comp.symbol, e)}
                className="text-text-muted hover:text-signal-red transition-colors"
                title={`Remove ${comp.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="
            absolute top-full mt-2 right-0 z-50
            w-80 bg-bg-secondary border border-border-default rounded-lg shadow-xl
            overflow-hidden
          "
        >
          {/* Header with Search */}
          <div className="px-4 py-3 border-b border-border-default">
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Add Comparison
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search indices or stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-9 pr-3 py-2 rounded-lg text-sm
                  bg-bg-tertiary border border-border-default
                  text-text-primary placeholder-text-muted
                  focus:outline-none focus:border-accent-blue
                "
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-96 overflow-y-auto">
            {/* Popular Indices */}
            {filteredPopular.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-bg-tertiary">
                  <span className="text-xs font-semibold text-text-muted uppercase">
                    Popular Indices
                  </span>
                </div>
                {filteredPopular.map((option) => (
                  <button
                    key={option.symbol}
                    onClick={() => handleAddComparison(option.symbol, option.name)}
                    className="
                      w-full px-4 py-2.5 text-left transition-colors
                      hover:bg-bg-tertiary
                    "
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {option.name}
                        </div>
                        <div className="text-xs text-text-muted">{option.symbol}</div>
                      </div>
                      {comparisons.some((c) => c.symbol === option.symbol) && (
                        <span className="text-xs text-signal-green font-medium">
                          Added
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Sector Indices */}
            {filteredSectors.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-bg-tertiary">
                  <span className="text-xs font-semibold text-text-muted uppercase">
                    Sector Indices
                  </span>
                </div>
                {filteredSectors.map((option) => (
                  <button
                    key={option.symbol}
                    onClick={() => handleAddComparison(option.symbol, option.name)}
                    className="
                      w-full px-4 py-2.5 text-left transition-colors
                      hover:bg-bg-tertiary
                    "
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {option.name}
                        </div>
                        <div className="text-xs text-text-muted">{option.symbol}</div>
                      </div>
                      {comparisons.some((c) => c.symbol === option.symbol) && (
                        <span className="text-xs text-signal-green font-medium">
                          Added
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {searchQuery &&
              filteredPopular.length === 0 &&
              filteredSectors.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-text-muted">No results found</p>
                  <p className="text-xs text-text-muted mt-1">
                    Try searching for popular indices or sectors
                  </p>
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border-default bg-bg-tertiary">
            <p className="text-xs text-text-muted">
              {userTier === 'PRO' && `Compare up to ${maxComparisons} stock or index`}
              {userTier === 'PREMIUM' && `Compare up to ${maxComparisons} stocks or indices`}
              {userTier !== 'FREE' && ` (${comparisons.length}/${maxComparisons} used)`}
            </p>
          </div>
        </div>
      )}
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt
          feature="Stock Comparison"
          requiredTier="PRO"
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
    </>
  );
};
