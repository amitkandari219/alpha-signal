/**
 * Data Unavailable Component
 *
 * Shows users when data is missing or cannot be verified.
 * GOLDEN RULE: Better to show "Data Unavailable" than show wrong data.
 *
 * Use cases:
 * - Data failed validation
 * - Multiple sources disagree (>10% deviation)
 * - Data is too old (>30 days for live metrics)
 * - Required API unavailable
 * - Company hasn't filed reports
 */

import React from 'react';
import { AlertTriangle, Info, FileQuestion, RefreshCw, ExternalLink } from 'lucide-react';

export interface DataUnavailableProps {
  field: string;
  reason: string;
  severity?: 'error' | 'warning' | 'info';
  showReportButton?: boolean;
  showRawDataButton?: boolean;
  onReportIssue?: () => void;
  onViewRawData?: () => void;
  variant?: 'full' | 'compact' | 'inline';
  alternativeText?: string; // Optional alternative data to show
  externalLink?: { url: string; label: string }; // Link to external source
}

export const DataUnavailable: React.FC<DataUnavailableProps> = ({
  field,
  reason,
  severity = 'warning',
  showReportButton = true,
  showRawDataButton = false,
  onReportIssue,
  onViewRawData,
  variant = 'full',
  alternativeText,
  externalLink,
}) => {
  const { icon: Icon, color, bg, border } = getSeverityStyles(severity);

  // Inline variant - just a small badge
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${bg} ${color} border ${border}`}>
        <Icon className="w-3 h-3" />
        <span>Data Unavailable</span>
      </span>
    );
  }

  // Compact variant - single line with icon
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bg} border ${border}`}>
        <Icon className={`w-4 h-4 ${color}`} />
        <div className="flex-1">
          <span className="text-sm font-medium text-text-primary">
            {field}: Data Not Available
          </span>
          <span className="text-xs text-text-secondary ml-2">({reason})</span>
        </div>
      </div>
    );
  }

  // Full variant - detailed card
  return (
    <div className={`rounded-lg p-6 border ${border} ${bg}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${bg} ${color}`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-text-primary mb-1">
            {field}: Data Not Available
          </h4>
          <p className="text-sm text-text-secondary">
            We couldn't verify accurate data for this metric.
          </p>
        </div>
      </div>

      {/* Reason */}
      <div className={`mb-4 p-3 rounded-lg bg-bg-tertiary border-l-4 ${border}`}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-medium text-text-primary">Reason: </span>
            <span className="text-text-secondary">{reason}</span>
          </div>
        </div>
      </div>

      {/* Alternative Text */}
      {alternativeText && (
        <div className="mb-4 p-3 rounded-lg bg-accent-blue/10 border border-accent-blue/30">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-accent-blue flex-shrink-0 mt-0.5" />
            <div className="text-sm text-text-secondary">
              <span className="font-medium text-accent-blue">Note: </span>
              {alternativeText}
            </div>
          </div>
        </div>
      )}

      {/* External Link */}
      {externalLink && (
        <div className="mb-4">
          <a
            href={externalLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-accent-blue hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            {externalLink.label}
          </a>
        </div>
      )}

      {/* Action Buttons */}
      {(showReportButton || showRawDataButton) && (
        <div className="flex flex-wrap gap-2 pt-2">
          {showReportButton && (
            <button
              onClick={onReportIssue}
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors text-sm font-medium"
            >
              <AlertTriangle className="w-4 h-4" />
              Report Issue
            </button>
          )}

          {showRawDataButton && (
            <button
              onClick={onViewRawData}
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors text-sm"
            >
              <FileQuestion className="w-4 h-4" />
              View Raw Data
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getSeverityStyles(severity: 'error' | 'warning' | 'info'): {
  icon: React.ComponentType<any>;
  color: string;
  bg: string;
  border: string;
} {
  switch (severity) {
    case 'error':
      return {
        icon: AlertTriangle,
        color: 'text-signal-red',
        bg: 'bg-signal-red/10',
        border: 'border-signal-red/30',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        color: 'text-signal-yellow',
        bg: 'bg-signal-yellow/10',
        border: 'border-signal-yellow/30',
      };
    case 'info':
      return {
        icon: Info,
        color: 'text-accent-blue',
        bg: 'bg-accent-blue/10',
        border: 'border-accent-blue/30',
      };
  }
}

// ═══════════════════════════════════════════════════════════════
// PRESET CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

export const DataUnavailablePresets = {
  validationFailed: (field: string) => ({
    field,
    reason: 'Data failed validation checks. Multiple sources show conflicting values.',
    severity: 'error' as const,
    alternativeText: 'We prioritize accuracy over completeness. This data will be available once verified.',
  }),

  staleData: (field: string, lastUpdated: string) => ({
    field,
    reason: `Data is outdated (last updated: ${lastUpdated}). Awaiting fresh data from source.`,
    severity: 'warning' as const,
    alternativeText: 'Check back after the next quarterly filing for updated information.',
  }),

  sourceUnavailable: (field: string, sourceName: string) => ({
    field,
    reason: `Data source (${sourceName}) is currently unavailable. Trying alternative sources.`,
    severity: 'warning' as const,
  }),

  notFiled: (field: string) => ({
    field,
    reason: 'Company has not yet filed this data with regulators.',
    severity: 'info' as const,
    externalLink: {
      url: 'https://www.nseindia.com/companies-listing/corporate-filings-announcements',
      label: 'Check NSE Announcements',
    },
  }),

  underCalculation: (field: string) => ({
    field,
    reason: 'Data is being calculated from recent filings. Will be available shortly.',
    severity: 'info' as const,
  }),

  privacyRestricted: (field: string) => ({
    field,
    reason: 'This information is restricted to PRO/PREMIUM subscribers.',
    severity: 'info' as const,
    alternativeText: 'Upgrade to access detailed analytics and verified data.',
  }),
};
