/**
 * AI Pattern Detection Test Component
 *
 * Use this to test and debug AI pattern detection algorithms
 * Add this component temporarily to your chart page
 */

import React, { useMemo } from 'react';
import { detectAllPatterns, type PatternAnnotation } from '@/utils/chartPatterns';
import type { OHLCVData } from '@/utils/technicalIndicators';

interface AIPatternTestProps {
  data: OHLCVData[];
  symbol: string;
}

export const AIPatternTest: React.FC<AIPatternTestProps> = ({ data, symbol }) => {
  // Detect all patterns
  const allPatterns = useMemo(() => {
    if (!data || data.length === 0) return null;

    console.log('[AI Pattern Test] Running detection on', data.length, 'data points');
    const patterns = detectAllPatterns(data);

    // Log each pattern type
    Object.entries(patterns).forEach(([type, typePatterns]) => {
      console.log(`[AI Pattern Test] ${type}:`, typePatterns.length, 'patterns found');
      if (typePatterns.length > 0) {
        console.log(`[AI Pattern Test] ${type} details:`, typePatterns);
      }
    });

    return patterns;
  }, [data]);

  if (!allPatterns) {
    return (
      <div className="fixed bottom-4 left-4 bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-md z-50">
        <h3 className="text-white font-semibold mb-2">🤖 AI Pattern Test</h3>
        <p className="text-gray-400 text-sm">Waiting for chart data...</p>
      </div>
    );
  }

  // Count total patterns
  const totalPatterns = Object.values(allPatterns).reduce(
    (sum, patterns) => sum + patterns.length,
    0
  );

  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-md z-50 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">🤖 AI Pattern Detection Test</h3>
        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
          {totalPatterns} found
        </span>
      </div>

      <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
        {/* Support & Resistance */}
        <PatternTestRow
          title="Support & Resistance"
          patterns={allPatterns.supportResistance}
          icon="📊"
        />

        {/* Trend Channel */}
        <PatternTestRow
          title="Trend Channel"
          patterns={allPatterns.trendChannel}
          icon="📈"
        />

        {/* MA Crossover */}
        <PatternTestRow
          title="Golden/Death Cross"
          patterns={allPatterns.maCrossover}
          icon="⭐"
        />

        {/* RSI Divergence */}
        <PatternTestRow
          title="RSI Divergence"
          patterns={allPatterns.rsiDivergence}
          icon="📉"
        />

        {/* Volume Climax */}
        <PatternTestRow
          title="Volume Climax"
          patterns={allPatterns.volumeClimax}
          icon="🔊"
        />

        {/* Gaps */}
        <PatternTestRow
          title="Price Gaps"
          patterns={allPatterns.gaps}
          icon="↕️"
        />

        {/* Consolidation */}
        <PatternTestRow
          title="Consolidation/Breakout"
          patterns={allPatterns.consolidationBreakout}
          icon="📦"
        />
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Open browser console for detailed pattern data
        </p>
      </div>
    </div>
  );
};

interface PatternTestRowProps {
  title: string;
  patterns: PatternAnnotation[];
  icon: string;
}

const PatternTestRow: React.FC<PatternTestRowProps> = ({ title, patterns, icon }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="border border-gray-700 rounded p-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between hover:bg-gray-700/50 rounded p-1 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-gray-300">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              patterns.length > 0
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-700 text-gray-500'
            }`}
          >
            {patterns.length}
          </span>
          <span className="text-gray-500 text-xs">{expanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {expanded && patterns.length > 0 && (
        <div className="mt-2 space-y-2 pl-6">
          {patterns.map((pattern, idx) => (
            <div key={idx} className="text-xs bg-gray-900/50 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-purple-400 font-mono">
                  Confidence: {(pattern.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-gray-400 text-xs">{pattern.description}</p>
              <p className="text-gray-600 text-xs mt-1">
                Detected: {new Date(pattern.detectedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
