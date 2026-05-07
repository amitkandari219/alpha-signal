/**
 * Global Search Modal (Cmd+K)
 *
 * Terminal-like search interface with typeahead
 * Quick access to stocks, sectors, and pages
 */

import React, { useEffect, useRef, useState } from 'react';
import { Search, TrendingUp, Layers, FileText, X, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

interface SearchResult {
  id: string;
  type: 'stock' | 'sector' | 'page' | 'event';
  title: string;
  subtitle?: string;
  path: string;
  icon: React.ElementType;
  eventType?: string;
  eventDate?: string;
}

// Mock search results - will be replaced with actual API calls
const mockResults: SearchResult[] = [
  { id: '1', type: 'stock', title: 'DIXON', subtitle: 'Dixon Technologies', path: '/stock/DIXON', icon: TrendingUp },
  { id: '2', type: 'stock', title: 'DEEPAKNTR', subtitle: 'Deepak Nitrite', path: '/stock/DEEPAKNTR', icon: TrendingUp },
  { id: '3', type: 'stock', title: 'POLYCAB', subtitle: 'Polycab India', path: '/stock/POLYCAB', icon: TrendingUp },
  { id: '4', type: 'sector', title: 'Technology', subtitle: 'IT & Software', path: '/sectors/technology', icon: Layers },
  { id: '5', type: 'sector', title: 'Chemicals', subtitle: 'Chemical Industry', path: '/sectors/chemicals', icon: Layers },
  { id: '6', type: 'page', title: 'Screener', subtitle: 'Filter stocks', path: '/screener', icon: FileText },
  { id: '7', type: 'page', title: 'Portfolio', subtitle: 'Track holdings', path: '/portfolio', icon: FileText },
  { id: '8', type: 'event', title: 'Q3 FY25 Earnings', subtitle: 'Reliance Industries', path: '/stock/RELIANCE', icon: Calendar, eventType: 'Earnings', eventDate: '2025-01-18' },
  { id: '9', type: 'event', title: 'Dividend Declaration', subtitle: 'TCS', path: '/stock/TCS', icon: Calendar, eventType: 'Dividend', eventDate: '2025-02-05' },
  { id: '10', type: 'event', title: 'Board Meeting', subtitle: 'Infosys', path: '/stock/INFY', icon: Calendar, eventType: 'Board Meeting', eventDate: '2025-04-12' },
];

export const GlobalSearch: React.FC = () => {
  const { isSearchOpen, setSearchOpen } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle search query
  useEffect(() => {
    if (query.trim()) {
      const filtered = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.subtitle?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setSelectedIndex(0);
    } else {
      setResults(mockResults.slice(0, 5));
    }
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSearchOpen) return;

      switch (e.key) {
        case 'Escape':
          setSearchOpen(false);
          setQuery('');
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            navigate(results[selectedIndex].path);
            setSearchOpen(false);
            setQuery('');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, results, selectedIndex, navigate, setSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl mx-4 bg-bg-secondary border border-border-default rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default">
          <Search className="w-5 h-5 text-signal-purple flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks, sectors, events, pages..."
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none text-lg"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => {
                      navigate(result.path);
                      setSearchOpen(false);
                      setQuery('');
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3
                      transition-colors duration-150
                      ${
                        index === selectedIndex
                          ? 'bg-bg-tertiary border-l-2 border-signal-purple'
                          : 'hover:bg-bg-tertiary'
                      }
                    `}
                  >
                    <div
                      className={`
                      w-8 h-8 rounded flex items-center justify-center flex-shrink-0
                      ${result.type === 'stock' ? 'bg-signal-green/20 text-signal-green' : ''}
                      ${result.type === 'sector' ? 'bg-signal-purple/20 text-signal-purple' : ''}
                      ${result.type === 'page' ? 'bg-signal-yellow/20 text-signal-yellow' : ''}
                      ${result.type === 'event' ? 'bg-accent-blue/20 text-accent-blue' : ''}
                    `}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-text-primary font-medium">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-text-secondary text-sm">{result.subtitle}</p>
                      )}
                      {result.type === 'event' && result.eventDate && (
                        <p className="text-text-muted text-xs mt-0.5">
                          {new Date(result.eventDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {result.eventType && ` • ${result.eventType}`}
                        </p>
                      )}
                    </div>
                    <kbd className="px-2 py-1 bg-bg-secondary border border-border-default rounded text-xs font-mono text-text-muted">
                      ↵
                    </kbd>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-text-secondary">No results found for "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border-default bg-bg-tertiary/50">
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
                Esc
              </kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
