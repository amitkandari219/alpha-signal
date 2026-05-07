/**
 * Collapsible Panel Component
 *
 * Reusable wrapper for all analysis panels with consistent styling and behavior
 */

import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp, LucideIcon, RefreshCw } from 'lucide-react';

export interface CollapsiblePanelProps {
  title: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    color: 'purple' | 'green' | 'yellow' | 'red';
  };
  defaultExpanded?: boolean;
  isLoading?: boolean;
  error?: Error;
  headerRight?: ReactNode;
  lastUpdated?: Date;
  onRetry?: () => void;
  children: ReactNode;
  onExpand?: (isExpanded: boolean) => void;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  icon: Icon,
  badge,
  defaultExpanded = true,
  isLoading = false,
  error,
  headerRight,
  lastUpdated,
  onRetry,
  children,
  onExpand,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onExpand) {
      onExpand(newState);
    }
  };

  const getBadgeColor = (color: 'purple' | 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'purple':
        return 'bg-[#A371F7] text-white';
      case 'green':
        return 'bg-signal-green text-white';
      case 'yellow':
        return 'bg-signal-yellow text-white';
      case 'red':
        return 'bg-signal-red text-white';
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      className={`bg-bg-secondary border rounded-lg overflow-hidden transition-colors ${
        error ? 'border-signal-red/50 bg-signal-red/5' : 'border-border-default'
      }`}
    >
      {/* Panel Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-tertiary transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Icon */}
          <Icon className="w-5 h-5 text-text-secondary flex-shrink-0" />

          {/* Title */}
          <h2 className="text-lg font-semibold text-text-primary truncate">{title}</h2>

          {/* Badge (optional) */}
          {badge && (
            <span
              className={`px-2 py-1 text-xs font-medium rounded flex-shrink-0 ${getBadgeColor(
                badge.color
              )}`}
            >
              {badge.text}
            </span>
          )}

          {/* Last Updated (optional) */}
          {lastUpdated && !error && (
            <span className="text-xs text-text-muted flex-shrink-0 hidden md:inline">
              Updated {getTimeAgo(lastUpdated)}
            </span>
          )}
        </div>

        {/* Header Right Content (optional) */}
        {headerRight && (
          <div className="flex items-center gap-3 mr-3" onClick={(e) => e.stopPropagation()}>
            {headerRight}
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          className="text-text-muted hover:text-text-secondary transition-colors flex-shrink-0"
          aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Panel Content */}
      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-border-default">
          {/* Loading State */}
          {isLoading && (
            <div className="p-6">
              <PanelSkeleton />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-signal-red/20 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-signal-red"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">
                  Failed to load data
                </h3>
                <p className="text-sm text-text-secondary mb-4 max-w-md">
                  {error.message || 'An unexpected error occurred while loading this panel.'}
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-signal-red hover:bg-signal-red/90 text-white rounded-md transition-colors text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && <div className="p-6">{children}</div>}
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader Component
const PanelSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Row 1 */}
      <div className="h-20 bg-bg-tertiary rounded"></div>
      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-32 bg-bg-tertiary rounded"></div>
        <div className="h-32 bg-bg-tertiary rounded"></div>
      </div>
      {/* Row 3 */}
      <div className="h-24 bg-bg-tertiary rounded"></div>
    </div>
  );
};

export default CollapsiblePanel;
