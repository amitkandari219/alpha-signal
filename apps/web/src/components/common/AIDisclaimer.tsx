/**
 * AI Disclaimer Component
 *
 * SEBI-compliant disclaimer for AI-generated content
 * Includes model version, timestamp, and user feedback
 */

import React, { useState } from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';

interface AIDisclaimerProps {
  modelVersion?: string;
  generatedAt?: string;
  dataFreshness?: string;
  onFeedback?: (type: 'up' | 'down') => void;
  variant?: 'full' | 'compact';
}

export const AIDisclaimer: React.FC<AIDisclaimerProps> = ({
  modelVersion = 'GPT-4 Turbo',
  generatedAt,
  dataFreshness,
  onFeedback,
  variant = 'full',
}) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleFeedback = (type: 'up' | 'down') => {
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);
    if (onFeedback && newFeedback) {
      onFeedback(newFeedback);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border-primary">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-signal-purple" />
          <span>AI-generated • {modelVersion}</span>
        </div>
        {onFeedback && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFeedback('up')}
              className={`p-1 rounded transition-colors ${
                feedback === 'up'
                  ? 'bg-signal-green text-white'
                  : 'text-text-muted hover:text-signal-green hover:bg-bg-hover'
              }`}
              title="Helpful"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className={`p-1 rounded transition-colors ${
                feedback === 'down'
                  ? 'bg-signal-red text-white'
                  : 'text-text-muted hover:text-signal-red hover:bg-bg-hover'
              }`}
              title="Not helpful"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4 border-t border-border-primary">
      {/* SEBI Compliance Warning */}
      <div className="flex items-start gap-2 p-3 bg-signal-yellow/5 border border-signal-yellow/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-signal-yellow flex-shrink-0 mt-0.5" />
        <div className="text-xs text-text-secondary leading-relaxed">
          <span className="font-semibold text-text-primary">AI-Generated Content:</span> This
          analysis is created by AI for informational and educational purposes only. It is{' '}
          <span className="font-semibold">NOT investment advice, a recommendation, or a buy/sell
          signal</span>. AI may generate incomplete or inaccurate information. Always conduct your
          own research and consult a SEBI-registered investment advisor before making decisions.
        </div>
      </div>

      {/* Metadata & Feedback */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {dataFreshness && (
            <span className="text-xs text-text-muted">{dataFreshness}</span>
          )}
          {generatedAt && (
            <span className="text-xs text-text-muted">{generatedAt}</span>
          )}
          <span className="px-2 py-1 bg-bg-tertiary text-text-muted text-xs rounded">
            {modelVersion}
          </span>
        </div>

        {onFeedback && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted mr-2">Was this helpful?</span>
            <button
              onClick={() => handleFeedback('up')}
              className={`p-1.5 rounded transition-colors ${
                feedback === 'up'
                  ? 'bg-signal-green text-white'
                  : 'bg-bg-tertiary text-text-muted hover:text-signal-green hover:bg-bg-hover'
              }`}
              title="Helpful"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className={`p-1.5 rounded transition-colors ${
                feedback === 'down'
                  ? 'bg-signal-red text-white'
                  : 'bg-bg-tertiary text-text-muted hover:text-signal-red hover:bg-bg-hover'
              }`}
              title="Not helpful"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
