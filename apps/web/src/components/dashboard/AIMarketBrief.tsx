/**
 * AI Market Brief Component
 *
 * AI-generated daily market summary
 */

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CollapsiblePanel } from '../common/CollapsiblePanel';
import { AIDisclaimer } from '../common/AIDisclaimer';

interface AIMarketBriefProps {
  generatedAt: string;
  summary: string[];
}

export const AIMarketBrief: React.FC<AIMarketBriefProps> = ({ generatedAt, summary }) => {
  const handleFeedback = (type: 'up' | 'down') => {
    console.log(`Market brief feedback: ${type}`);
    // TODO: Send feedback to API
  };

  return (
    <CollapsiblePanel
      title="AI Market Brief"
      icon={Sparkles}
      badge={{ text: 'AI Generated', color: 'purple' }}
      defaultExpanded={true}
    >
      <div className="space-y-4">
        <ul className="space-y-3">
          {summary.map((point, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#A371F7] flex-shrink-0"></span>
              <p className="text-sm text-text-secondary leading-relaxed">{point}</p>
            </li>
          ))}
        </ul>

        {/* AI Disclaimer - SEBI Compliance */}
        <AIDisclaimer
          modelVersion="GPT-4 Turbo + Market Data"
          generatedAt={`Generated ${generatedAt}`}
          onFeedback={handleFeedback}
        />
      </div>
    </CollapsiblePanel>
  );
};
