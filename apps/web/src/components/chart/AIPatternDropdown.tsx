/**
 * AIPatternDropdown Component
 *
 * Dropdown for toggling AI pattern detection on the chart
 * FREE users only get Support/Resistance, PRO/PREMIUM get all 7 patterns
 */

import React, { useState } from 'react';
import { Sparkles, Lock, Check, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { useChartStore, useEnabledAIPatternsCount, type AIPatternType } from '@/store/useChartStore';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { UpgradePrompt } from '@/components/common/UpgradePrompt';

interface AIPatternDropdownProps {
  patternCounts?: Record<AIPatternType, number>; // Optional: show count next to each pattern
}

/**
 * AI pattern configuration
 */
const AI_PATTERN_CONFIG: Record<
  AIPatternType,
  {
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }
> = {
  supportResistance: {
    label: 'Support & Resistance',
    description: 'Detect key price levels with multiple touch points',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'text-purple-400',
  },
  trendChannel: {
    label: 'Trend Channel',
    description: 'Identify parallel trend lines using regression',
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-blue-400',
  },
  maCrossover: {
    label: 'Golden/Death Cross',
    description: 'Detect SMA50 and SMA200 crossovers',
    icon: <Activity className="w-4 h-4" />,
    color: 'text-yellow-400',
  },
  rsiDivergence: {
    label: 'RSI Divergence',
    description: 'Find bullish and bearish RSI divergences',
    icon: <Activity className="w-4 h-4" />,
    color: 'text-green-400',
  },
  volumeClimax: {
    label: 'Volume Climax',
    description: 'Spot unusual volume spikes (3× average)',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'text-orange-400',
  },
  gaps: {
    label: 'Price Gaps',
    description: 'Identify gap ups/downs and track fills',
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-red-400',
  },
  consolidationBreakout: {
    label: 'Consolidation & Breakout',
    description: 'Detect ranging periods and breakouts',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'text-indigo-400',
  },
};

/**
 * AIPatternDropdown component for toggling AI patterns
 */
export const AIPatternDropdown: React.FC<AIPatternDropdownProps> = ({ patternCounts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const aiPatterns = useChartStore((state) => state.aiPatterns);
  const toggleAIPattern = useChartStore((state) => state.toggleAIPattern);
  const setAllAIPatterns = useChartStore((state) => state.setAllAIPatterns);
  const enabledCount = useEnabledAIPatternsCount();

  // Feature gate check (FREE users only get support/resistance)
  const { hasAccess, userTier } = useFeatureGate('technicals_full');
  const isFreeUser = userTier === 'FREE';

  // Pattern types allowed for FREE users
  const FREE_PATTERN_TYPES: AIPatternType[] = ['supportResistance'];

  const handleToggle = (pattern: AIPatternType) => {
    // Check if locked for FREE users
    if (isFreeUser && !FREE_PATTERN_TYPES.includes(pattern)) {
      setShowUpgradeModal(true);
      return;
    }

    toggleAIPattern(pattern);
  };

  const handleEnableAll = () => {
    if (isFreeUser) {
      // FREE users: only enable allowed patterns
      FREE_PATTERN_TYPES.forEach((pattern) => {
        if (!aiPatterns[pattern]) {
          toggleAIPattern(pattern);
        }
      });
    } else {
      setAllAIPatterns(true);
    }
  };

  const handleDisableAll = () => {
    setAllAIPatterns(false);
  };

  return (
    <>
      <div className="relative">
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors
            ${
              isOpen
                ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50'
            }
          `}
        >
          <Sparkles className="w-4 h-4" />
          AI Patterns
          {enabledCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs">
              {enabledCount}
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

            {/* Dropdown Content */}
            <div className="absolute top-full left-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 max-h-[500px] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-gray-100">AI Pattern Detection</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEnableAll}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Enable All
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      onClick={handleDisableAll}
                      className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      Disable All
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Automatically detect chart patterns using AI algorithms
                </p>
              </div>

              {/* Pattern List */}
              <div className="py-2">
                {(Object.entries(AI_PATTERN_CONFIG) as [AIPatternType, typeof AI_PATTERN_CONFIG[AIPatternType]][]).map(
                  ([patternType, config]) => {
                    const isEnabled = aiPatterns[patternType];
                    const isLocked = isFreeUser && !FREE_PATTERN_TYPES.includes(patternType);
                    const count = patternCounts?.[patternType] || 0;

                    return (
                      <button
                        key={patternType}
                        onClick={() => handleToggle(patternType)}
                        className={`
                          w-full flex items-start gap-3 px-4 py-3 text-sm transition-colors
                          ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-700/50 cursor-pointer'}
                          ${isEnabled && !isLocked ? 'bg-gray-700/30' : ''}
                        `}
                        disabled={isLocked}
                      >
                        {/* Checkbox */}
                        <div
                          className={`
                            flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5
                            ${
                              isEnabled && !isLocked
                                ? 'bg-purple-500 border-purple-500'
                                : 'border-gray-600'
                            }
                          `}
                        >
                          {isEnabled && !isLocked && <Check className="w-3.5 h-3.5 text-white" />}
                          {isLocked && <Lock className="w-3 h-3 text-gray-500" />}
                        </div>

                        {/* Icon */}
                        <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>{config.icon}</div>

                        {/* Content */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-200">{config.label}</span>
                            {count > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs">
                                {count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
                        </div>

                        {/* Lock Icon */}
                        {isLocked && <Lock className="flex-shrink-0 w-4 h-4 text-yellow-500 mt-1" />}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Footer with tier info */}
              {isFreeUser && (
                <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <Lock className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-400">
                      Unlock all 7 AI pattern detection algorithms with PRO or PREMIUM
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Upgrade Now
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          feature="ai_patterns"
          variant="modal"
          requiredTier="PRO"
          message="Unlock all 7 AI-powered pattern detection algorithms"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
};
