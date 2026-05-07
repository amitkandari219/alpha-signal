/**
 * Global Stock Search Component
 *
 * Command palette style search (Cmd+K) with typeahead and keyboard navigation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, TrendingUp, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const API_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql';

interface SearchResult {
  id: string;
  nseSymbol: string | null;
  bseCode: string | null;
  companyName: string;
  shortName: string;
  sector: string;
  marketCapCategory: string;
  matchType: string;
}

interface RecentSearch {
  symbol: string;
  companyName: string;
  timestamp: number;
}

const RECENT_SEARCHES_KEY = 'alpha-signal-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export const GlobalStockSearch: React.FC = () => {
  const navigate = useNavigate();
  const { isSearchOpen, setSearchOpen } = useAppStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isSearchOpen]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query SearchStocks($query: String!, $limit: Int) {
              searchStocks(query: $query, limit: $limit) {
                id
                nseSymbol
                bseCode
                companyName
                shortName
                sector
                marketCapCategory
                matchType
              }
            }
          `,
          variables: {
            query: searchQuery,
            limit: 8,
          },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        setResults([]);
      } else {
        setResults(data.data.searchStocks || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle query change with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim().length >= 2) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        performSearch(query);
      }, 300); // 300ms debounce
    } else {
      setResults([]);
      setIsLoading(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, performSearch]);

  // Save to recent searches
  const saveRecentSearch = (result: SearchResult) => {
    const symbol = result.nseSymbol || result.bseCode || result.shortName;
    const recent: RecentSearch = {
      symbol,
      companyName: result.shortName,
      timestamp: Date.now(),
    };

    const updated = [
      recent,
      ...recentSearches.filter((r) => r.symbol !== symbol),
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Handle selection
  const handleSelect = (result: SearchResult) => {
    const symbol = result.nseSymbol || result.bseCode || result.shortName;
    saveRecentSearch(result);
    setSearchOpen(false);
    navigate(`/stock/${symbol}`);
  };

  // Handle recent search click
  const handleRecentClick = (recent: RecentSearch) => {
    setQuery(recent.symbol);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSearchOpen) return;

      const itemCount = query.trim() ? results.length : recentSearches.length;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setSearchOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % itemCount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + itemCount) % itemCount);
          break;
        case 'Enter':
          e.preventDefault();
          if (query.trim() && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          } else if (!query.trim() && recentSearches[selectedIndex]) {
            handleRecentClick(recentSearches[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, results, recentSearches, selectedIndex, query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results, query]);

  if (!isSearchOpen) return null;

  // Get logo color based on first letter
  const getLogoColor = (name: string) => {
    const colors = [
      'from-signal-purple to-accent-blue',
      'from-signal-green to-chart-up',
      'from-signal-yellow to-chart-down',
      'from-accent-blue to-signal-purple',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get market cap badge color
  const getMarketCapColor = (category: string) => {
    switch (category) {
      case 'LARGE_CAP':
        return 'bg-signal-green/20 text-signal-green';
      case 'MID_CAP':
        return 'bg-signal-yellow/20 text-signal-yellow';
      case 'SMALL_CAP':
        return 'bg-signal-red/20 text-signal-red';
      default:
        return 'bg-text-muted/20 text-text-muted';
    }
  };

  const displayItems = query.trim() ? results : [];
  const showRecent = !query.trim() && recentSearches.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl mx-4 bg-bg-secondary border border-border-default rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border-default">
          <Search className="w-5 h-5 text-text-secondary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks..."
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden md:flex items-center gap-1 px-2 py-1 bg-bg-tertiary border border-border-default rounded text-xs font-mono text-text-muted">
            ESC
          </kbd>
        </div>

        {/* Results / Recent Searches */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && query.length >= 2 && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-blue border-t-transparent" />
            </div>
          )}

          {!isLoading && displayItems.length > 0 && (
            <div className="py-2">
              {displayItems.map((result, index) => {
                const symbol = result.nseSymbol || result.bseCode || result.shortName;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3
                      transition-all duration-150 animate-stagger-in
                      ${
                        index === selectedIndex
                          ? 'bg-bg-tertiary border-l-2 border-accent-blue'
                          : 'hover:bg-bg-tertiary'
                      }
                    `}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Company Logo */}
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${getLogoColor(
                        result.companyName
                      )} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-white font-bold text-sm">
                        {result.companyName.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Company Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-text-primary font-data">
                          {symbol}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMarketCapColor(
                            result.marketCapCategory
                          )}`}
                        >
                          {result.marketCapCategory.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary truncate">
                        {result.companyName}
                      </p>
                    </div>

                    {/* Sector Badge */}
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-bg-primary rounded text-xs text-text-muted">
                        {result.sector}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Recent Searches */}
          {showRecent && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs text-text-muted uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Recent Searches
              </div>
              {recentSearches.map((recent, index) => (
                <button
                  key={recent.symbol}
                  onClick={() => handleRecentClick(recent)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3
                    transition-colors duration-150
                    ${
                      index === selectedIndex
                        ? 'bg-bg-tertiary border-l-2 border-accent-blue'
                        : 'hover:bg-bg-tertiary'
                    }
                  `}
                >
                  <Clock className="w-5 h-5 text-text-muted flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <span className="font-bold text-text-primary font-data">
                      {recent.symbol}
                    </span>
                    <span className="text-sm text-text-secondary ml-2">
                      {recent.companyName}
                    </span>
                  </div>
                  <TrendingUp className="w-4 h-4 text-text-muted" />
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-text-secondary">No stocks found for "{query}"</p>
              <p className="text-text-muted text-sm mt-2">
                Try searching by symbol or company name
              </p>
            </div>
          )}

          {/* Empty State */}
          {!query && recentSearches.length === 0 && (
            <div className="py-12 text-center">
              <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">Search for stocks</p>
              <p className="text-text-muted text-sm mt-2">
                Start typing a symbol or company name
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-default bg-bg-tertiary/30">
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-bg-secondary border border-border-default rounded font-mono">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-bg-secondary border border-border-default rounded font-mono">
                ↵
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-bg-secondary border border-border-default rounded font-mono">
                ESC
              </kbd>
              Close
            </span>
          </div>
          <div className="text-xs text-text-muted">
            {results.length > 0 && `${results.length} result${results.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes stagger-in {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 150ms ease-out;
        }

        .animate-scale-in {
          animation: scale-in 150ms ease-out;
        }

        .animate-stagger-in {
          animation: stagger-in 150ms ease-out backwards;
        }
      `}</style>
    </div>
  );
};

export default GlobalStockSearch;
