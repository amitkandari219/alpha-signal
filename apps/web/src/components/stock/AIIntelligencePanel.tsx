/**
 * AI Intelligence Panel Component
 *
 * PRIMARY PRODUCT DIFFERENTIATOR - AI-generated stock insights
 * Displays comprehensive AI analysis with business overview, thesis, bull/bear cases, risks, and tailwinds
 */

import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ExternalLink
} from 'lucide-react';
import { CollapsiblePanel } from '../common/CollapsiblePanel';
import { getAIIntelligence } from '../../data/mockAIIntelligence';
import { GatedContent } from '../common/GatedContent';
import { AIDisclaimer } from '../common/AIDisclaimer';
import { analytics, AnalyticsEvents } from '../../services/analytics';

interface AIIntelligencePanelProps {
  symbol: string;
  defaultExpanded?: boolean;
}

export const AIIntelligencePanel: React.FC<AIIntelligencePanelProps> = ({
  symbol,
  defaultExpanded = true
}) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const aiData = getAIIntelligence(symbol);

  const confidenceColors = {
    High: 'bg-signal-green text-bg-primary',
    Medium: 'bg-signal-yellow text-bg-primary',
    Low: 'bg-signal-red text-bg-primary'
  };

  const severityColors = {
    HIGH: 'bg-signal-red text-white',
    MEDIUM: 'bg-signal-yellow text-bg-primary'
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(feedback === type ? null : type);
  };

  const handlePanelExpand = (isExpanded: boolean) => {
    if (isExpanded) {
      analytics.trackAIPanelExpanded(symbol, 'AI Intelligence');
    }
  };

  return (
    <CollapsiblePanel
      title="AI Intelligence"
      icon={Sparkles}
      badge={{ text: 'AI Generated', color: 'purple' }}
      defaultExpanded={defaultExpanded}
      onExpand={handlePanelExpand}
      headerRight={
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted hidden md:inline">
            Updated {aiData.updatedAt}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded ${confidenceColors[aiData.confidence]}`}>
            {aiData.confidence} Confidence
          </span>
        </div>
      }
    >
      <div className="space-y-6">
          {/* Business Overview */}
          <section>
            <h3 className="text-base font-semibold text-text-primary mb-3">
              Business Overview
            </h3>
            <div className="space-y-3">
              {aiData.businessOverview.map((paragraph, index) => (
                <p key={index} className="text-sm text-text-primary leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          {/* Gated Content - PRO Feature */}
          <GatedContent feature="ai_summary_full" showPreview={true}>
            {/* Current Thesis */}
            <section>
              <h3 className="text-base font-semibold text-text-primary mb-3">
                Current Market Thesis
              </h3>
              <div className="border-l-2 border-purple-400/50 pl-4 py-2">
                <p className="text-sm text-text-secondary italic leading-relaxed">
                  {aiData.currentThesis}
                </p>
              </div>
            </section>

            {/* Bull Case / Bear Case */}
            <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bull Case */}
              <div className="bg-bg-tertiary border-t-2 border-signal-green rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-signal-green" />
                  <h4 className="text-base font-semibold text-text-primary">Bull Case</h4>
                </div>
                <ul className="space-y-3">
                  {aiData.bullCase.points.map((point, index) => (
                    <li key={index} className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-signal-green flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-text-secondary leading-relaxed">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bear Case */}
              <div className="bg-bg-tertiary border-t-2 border-signal-red rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-signal-red" />
                  <h4 className="text-base font-semibold text-text-primary">Bear Case</h4>
                </div>
                <ul className="space-y-3">
                  {aiData.bearCase.points.map((point, index) => (
                    <li key={index} className="flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-signal-red flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-text-secondary leading-relaxed">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Key Risks */}
          <section>
            <h3 className="text-base font-semibold text-text-primary mb-3">
              Key Risks
            </h3>
            <div className="space-y-2">
              {aiData.keyRisks.map((risk, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 p-3 bg-bg-tertiary rounded border border-border-primary"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${severityColors[risk.severity]}`}>
                        {risk.severity}
                      </span>
                      <span className="text-sm text-text-primary">{risk.risk}</span>
                    </div>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 text-xs text-signal-blue hover:underline"
                      onClick={(e) => e.preventDefault()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      {risk.source}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tailwinds */}
          <section>
            <h3 className="text-base font-semibold text-text-primary mb-3">
              Tailwinds
            </h3>
            <div className="space-y-2">
              {aiData.tailwinds.map((tailwind, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-bg-tertiary rounded border border-border-primary"
                >
                  <ArrowUp className="w-4 h-4 text-signal-green flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-text-primary mb-1">{tailwind.item}</p>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 text-xs text-signal-blue hover:underline"
                      onClick={(e) => e.preventDefault()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      {tailwind.source}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
          </GatedContent>

          {/* AI Disclaimer - SEBI Compliance */}
          <section>
            <AIDisclaimer
              modelVersion={aiData.modelVersion}
              generatedAt={`Updated ${aiData.updatedAt}`}
              dataFreshness={aiData.dataFreshness}
              onFeedback={handleFeedback}
            />
          </section>
      </div>
    </CollapsiblePanel>
  );
};
