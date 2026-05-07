/**
 * Event Search Bar Component
 *
 * Full-text search across all company events with results display
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Building2, Loader2, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface EventSearchResult {
  id: string;
  companySymbol: string;
  companyName: string;
  eventTitle: string;
  eventDate: string;
  eventType:
    | 'EARNINGS'
    | 'DIVIDEND'
    | 'BOARD_MEETING'
    | 'AGM'
    | 'RIGHTS_ISSUE'
    | 'BUYBACK'
    | 'MERGER'
    | 'OTHER';
  snippet: string;
  matchedText?: string;
}

interface EventSearchBarProps {
  placeholder?: string;
  onResultClick?: (result: EventSearchResult) => void;
}

export const EventSearchBar: React.FC<EventSearchBarProps> = ({
  placeholder = 'Search across all company events...',
  onResultClick,
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);

  const RESULTS_PER_PAGE = 10;

  // Fetch search results
  const { data, isLoading, error } = useQuery({
    queryKey: ['eventSearch', query, currentPage],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return { results: [], totalCount: 0 };
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Mock search results
      const mockResults: EventSearchResult[] = [
        {
          id: '1',
          companySymbol: 'RELIANCE',
          companyName: 'Reliance Industries',
          eventTitle: 'Q3 FY25 Earnings Conference Call',
          eventDate: '2025-01-18',
          eventType: 'EARNINGS',
          snippet:
            'Reliance Industries reported strong Q3 results with revenue growth of 12% YoY...',
          matchedText: query,
        },
        {
          id: '2',
          companySymbol: 'TCS',
          companyName: 'Tata Consultancy Services',
          eventTitle: 'Dividend Declaration - ₹25 per share',
          eventDate: '2025-02-05',
          eventType: 'DIVIDEND',
          snippet: 'Board of Directors declared interim dividend of ₹25 per equity share...',
          matchedText: query,
        },
        {
          id: '3',
          companySymbol: 'INFY',
          companyName: 'Infosys',
          eventTitle: 'Board Meeting for Q4 Results',
          eventDate: '2025-04-12',
          eventType: 'BOARD_MEETING',
          snippet:
            'Board will consider and approve financial results for Q4 FY25 on April 12...',
          matchedText: query,
        },
        {
          id: '4',
          companySymbol: 'HDFCBANK',
          companyName: 'HDFC Bank',
          eventTitle: 'Annual General Meeting (AGM)',
          eventDate: '2025-06-28',
          eventType: 'AGM',
          snippet: 'Annual General Meeting scheduled for June 28, 2025 at Mumbai...',
          matchedText: query,
        },
        {
          id: '5',
          companySymbol: 'BHARTIARTL',
          companyName: 'Bharti Airtel',
          eventTitle: 'Rights Issue Announcement',
          eventDate: '2025-03-15',
          eventType: 'RIGHTS_ISSUE',
          snippet: 'Company announces rights issue to raise ₹25,000 Cr for 5G expansion...',
          matchedText: query,
        },
      ];

      // Filter results based on query (case-insensitive)
      const filtered = mockResults.filter(
        (result) =>
          result.eventTitle.toLowerCase().includes(query.toLowerCase()) ||
          result.companyName.toLowerCase().includes(query.toLowerCase()) ||
          result.snippet.toLowerCase().includes(query.toLowerCase())
      );

      const start = (currentPage - 1) * RESULTS_PER_PAGE;
      const paginatedResults = filtered.slice(start, start + RESULTS_PER_PAGE);

      return {
        results: paginatedResults,
        totalCount: filtered.length,
      };
    },
    enabled: query.trim().length >= 2,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset page when query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const results = data?.results || [];
  const totalCount = data?.totalCount || 0;
  const showResults = isExpanded && query.trim().length >= 2;

  const handleResultClick = (result: EventSearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
    setIsExpanded(false);
    setQuery('');
  };

  const getEventTypeBadge = (type: EventSearchResult['eventType']) => {
    const badges = {
      EARNINGS: { text: 'Earnings', color: 'bg-signal-purple/20 text-signal-purple' },
      DIVIDEND: { text: 'Dividend', color: 'bg-signal-green/20 text-signal-green' },
      BOARD_MEETING: { text: 'Board Meeting', color: 'bg-accent-blue/20 text-accent-blue' },
      AGM: { text: 'AGM', color: 'bg-signal-yellow/20 text-signal-yellow' },
      RIGHTS_ISSUE: { text: 'Rights Issue', color: 'bg-signal-red/20 text-signal-red' },
      BUYBACK: { text: 'Buyback', color: 'bg-chart-up/20 text-chart-up' },
      MERGER: { text: 'Merger', color: 'bg-accent-blue/20 text-accent-blue' },
      OTHER: { text: 'Other', color: 'bg-text-muted/20 text-text-muted' },
    };

    const badge = badges[type];
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="bg-signal-yellow/30 text-text-primary">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsExpanded(true);
          }}
          onFocus={() => setIsExpanded(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsExpanded(false);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-border-default rounded-lg shadow-2xl max-h-[600px] overflow-hidden z-50">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-6 text-center">
              <p className="text-signal-red text-sm">Failed to load results</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && !error && (
            <>
              {results.length > 0 ? (
                <>
                  {/* Results Header */}
                  <div className="px-4 py-3 border-b border-border-default bg-bg-tertiary">
                    <p className="text-sm text-text-muted">
                      Found {totalCount} event{totalCount !== 1 ? 's' : ''} matching "{query}"
                    </p>
                  </div>

                  {/* Results List */}
                  <div className="overflow-y-auto max-h-[500px]">
                    {results.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full px-4 py-4 border-b border-border-default hover:bg-bg-tertiary transition-colors text-left"
                      >
                        {/* Company and Badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-text-muted flex-shrink-0" />
                          <span className="text-sm font-medium text-text-primary">
                            {result.companyName}
                          </span>
                          <span className="text-sm text-text-muted">({result.companySymbol})</span>
                          {getEventTypeBadge(result.eventType)}
                        </div>

                        {/* Event Title */}
                        <h4 className="text-base font-semibold text-text-primary mb-1">
                          {highlightMatch(result.eventTitle, query)}
                        </h4>

                        {/* Date */}
                        <div className="flex items-center gap-1 mb-2">
                          <Calendar className="w-3.5 h-3.5 text-text-muted" />
                          <span className="text-xs text-text-muted">
                            {new Date(result.eventDate).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Snippet */}
                        <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                          {highlightMatch(result.snippet, query)}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalCount > RESULTS_PER_PAGE && (
                    <div className="px-4 py-3 border-t border-border-default bg-bg-tertiary flex items-center justify-between">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-bg-secondary border border-border-default rounded text-sm text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-tertiary transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-text-muted">
                        Page {currentPage} of {Math.ceil(totalCount / RESULTS_PER_PAGE)}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={currentPage >= Math.ceil(totalCount / RESULTS_PER_PAGE)}
                        className="px-3 py-1.5 bg-bg-secondary border border-border-default rounded text-sm text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-tertiary transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Empty State */
                <div className="py-12 text-center">
                  <Search className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                  <p className="text-text-secondary">No events found matching "{query}"</p>
                  <p className="text-sm text-text-muted mt-1">
                    Try different keywords or check spelling
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EventSearchBar;
