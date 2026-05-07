/**
 * Data Confidence Indicator Component
 *
 * Shows users the quality and source of data with visual badges:
 * - ✅ Verified (95-100%) - Official exchange data
 * - ✓ High Confidence (80-94%) - Verified third-party sources
 * - ⚠ Medium Confidence (60-79%) - Calculated or estimated
 * - ⚠ Estimated (0-59%) - Projections or low confidence
 *
 * Includes tooltip with:
 * - Data source
 * - Confidence percentage
 * - Last updated timestamp
 * - Warning if estimated
 */

import React, { useState } from 'react';
import { Info, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface DataConfidenceIndicatorProps {
  field: string;
  value: any;
  confidence: number; // 0-1
  source?: string;
  lastUpdated?: string;
  showValue?: boolean; // Whether to show the value itself
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DataConfidenceIndicator: React.FC<DataConfidenceIndicatorProps> = ({
  field,
  value,
  confidence,
  source = 'database',
  lastUpdated,
  showValue = true,
  size = 'md',
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const badge = getConfidenceBadge(confidence);
  const sourceDisplay = getSourceDisplayName(source);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const badgeSizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${sizeClasses[size]} ${className}`}>
      {/* Value Display */}
      {showValue && (
        <span className="font-semibold text-text-primary">{formatValue(value)}</span>
      )}

      {/* Confidence Badge with Tooltip */}
      <div className="relative">
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`inline-flex items-center gap-1 rounded-md font-medium transition-colors ${badgeSizeClasses[size]} ${badge.classes}`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute left-0 top-full mt-2 z-50 w-72 bg-bg-secondary border border-border-default rounded-lg p-3 shadow-xl">
            <div className="space-y-2">
              <div className="font-semibold text-sm border-b border-border-default pb-2 mb-2">
                Data Quality Information
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Info className="w-4 h-4 text-accent-blue flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-text-secondary">Source: </span>
                  <span className="text-text-primary font-medium">{sourceDisplay}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${badge.iconBg}`}>
                  {confidence >= 0.8 ? (
                    <CheckCircle className="w-3 h-3 text-signal-green" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-signal-yellow" />
                  )}
                </div>
                <div>
                  <span className="text-text-secondary">Confidence: </span>
                  <span className="text-text-primary font-medium">
                    {(confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {lastUpdated && (
                <div className="flex items-start gap-2 text-xs">
                  <Clock className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-text-secondary">Last updated: </span>
                    <span className="text-text-primary font-medium">
                      {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              )}

              {/* Warning for low confidence */}
              {confidence < 0.8 && (
                <div className="mt-3 pt-2 border-t border-border-default">
                  <div className="flex items-start gap-2 text-xs text-signal-yellow">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      {confidence < 0.6
                        ? 'This is an estimate or projection. Verify with official sources before making decisions.'
                        : 'This data is calculated or from third-party sources. Cross-reference with official filings for accuracy.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getConfidenceBadge(confidence: number): {
  label: string;
  icon: string;
  classes: string;
  iconBg: string;
} {
  if (confidence >= 0.95) {
    return {
      label: 'Verified',
      icon: '✅',
      classes: 'bg-signal-green/20 text-signal-green border border-signal-green/40',
      iconBg: 'bg-signal-green/20',
    };
  } else if (confidence >= 0.8) {
    return {
      label: 'High Confidence',
      icon: '✓',
      classes: 'bg-signal-green/15 text-signal-green border border-signal-green/30',
      iconBg: 'bg-signal-green/20',
    };
  } else if (confidence >= 0.6) {
    return {
      label: 'Medium Confidence',
      icon: '⚠',
      classes: 'bg-signal-yellow/20 text-signal-yellow border border-signal-yellow/40',
      iconBg: 'bg-signal-yellow/20',
    };
  } else {
    return {
      label: 'Estimated',
      icon: '⚠',
      classes: 'bg-signal-red/20 text-signal-red border border-signal-red/40',
      iconBg: 'bg-signal-red/20',
    };
  }
}

function getSourceDisplayName(source: string): string {
  const displayNames: Record<string, string> = {
    NSE_API: 'NSE (Official Exchange)',
    BSE_API: 'BSE (Official Exchange)',
    company_filings: 'Company Filings (Official)',
    database: 'Alpha Signal Database',
    screener_api: 'Screener.in (Verified)',
    moneycontrol: 'Moneycontrol',
    yahoo_finance: 'Yahoo Finance',
    ai_generated: 'AI-Generated Insight',
    calculated: 'Calculated from Data',
    estimated: 'Estimated/Projected',
    manual_entry: 'Manual Entry',
  };

  return displayNames[source] || source;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  if (typeof value === 'number') {
    // Format numbers with appropriate precision
    if (Math.abs(value) >= 1000) {
      return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    } else {
      return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    }
  }

  return String(value);
}
