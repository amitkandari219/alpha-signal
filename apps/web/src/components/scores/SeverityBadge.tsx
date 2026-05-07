/**
 * Severity Badge Component
 *
 * Small pill/badge for severity levels
 * Used in risk flags, news impact ratings, alert levels
 */

import React from 'react';

export type SeverityLevel = 'high' | 'medium' | 'low' | 'clear';

export interface SeverityBadgeProps {
  severity: SeverityLevel;
  label?: string; // optional custom label (defaults to severity in caps)
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  label,
  size = 'md',
}) => {
  // Color mapping
  const colorClasses = {
    high: 'bg-signal-red text-white',
    medium: 'bg-signal-yellow text-bg-primary',
    low: 'bg-gray-600 text-white',
    clear: 'bg-signal-green text-white',
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  // Default label
  const displayLabel = label || severity.toUpperCase();

  return (
    <span
      className={`inline-flex items-center font-medium rounded ${colorClasses[severity]} ${sizeClasses[size]}`}
    >
      {displayLabel}
    </span>
  );
};

export default SeverityBadge;
