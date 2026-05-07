/**
 * Score Factor Breakdown Component
 *
 * Horizontal bar chart showing factor contributions to overall score
 * Expandable rows with underlying data explanations
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface ScoreFactor {
  name: string;
  weight: number; // percentage (e.g., 15 = 15%)
  value: number; // 0-100
  contribution: number; // points contributed to total score
  explanation?: string; // optional explanation shown on expand
}

export interface ScoreFactorBreakdownProps {
  factors: ScoreFactor[];
}

export const ScoreFactorBreakdown: React.FC<ScoreFactorBreakdownProps> = ({ factors }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Color based on value
  const getValueColor = (value: number) => {
    if (value <= 30) return 'bg-signal-red';
    if (value <= 60) return 'bg-signal-yellow';
    return 'bg-signal-green';
  };

  const getValueTextColor = (value: number) => {
    if (value <= 30) return 'text-signal-red';
    if (value <= 60) return 'text-signal-yellow';
    return 'text-signal-green';
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Calculate max contribution for scaling bars
  const maxContribution = Math.max(...factors.map((f) => f.contribution));

  return (
    <div className="space-y-2">
      {factors.map((factor, index) => {
        const isExpanded = expandedIndex === index;
        const barWidth = (factor.contribution / maxContribution) * 100;

        return (
          <div key={index} className="space-y-1">
            {/* Factor row */}
            <div
              className={`flex items-center gap-3 p-3 rounded border border-border-primary transition-colors ${
                factor.explanation ? 'cursor-pointer hover:bg-bg-tertiary' : ''
              }`}
              onClick={() => factor.explanation && toggleExpand(index)}
            >
              {/* Expand icon (if explanation available) */}
              {factor.explanation && (
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  )}
                </div>
              )}

              {/* Factor name + weight */}
              <div className="flex-shrink-0 w-32">
                <div className="text-sm text-text-primary font-medium">{factor.name}</div>
                <div className="text-xs text-text-muted">Weight: {factor.weight}%</div>
              </div>

              {/* Horizontal bar */}
              <div className="flex-1 bg-bg-tertiary rounded-full h-6 relative overflow-hidden">
                <div
                  className={`h-full ${getValueColor(factor.value)} transition-all duration-500 ease-out`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {/* Value display */}
              <div className="flex-shrink-0 w-20 text-right">
                <div className={`text-sm font-semibold ${getValueTextColor(factor.value)}`}>
                  {factor.value.toFixed(1)}
                </div>
                <div className="text-xs text-text-muted">
                  +{factor.contribution.toFixed(1)} pts
                </div>
              </div>
            </div>

            {/* Expanded explanation */}
            {isExpanded && factor.explanation && (
              <div className="ml-10 pl-4 py-2 border-l-2 border-border-primary">
                <p className="text-sm text-text-secondary leading-relaxed">
                  {factor.explanation}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ScoreFactorBreakdown;
