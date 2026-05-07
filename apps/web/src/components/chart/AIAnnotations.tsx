/**
 * AIAnnotations Component
 *
 * Renders AI-detected patterns on the chart as SVG overlays
 * Supports all 7 pattern types with individual dismiss functionality
 */

import React, { useMemo } from 'react';
import { X, Sparkles } from 'lucide-react';
import {
  PatternAnnotation,
  SupportResistancePattern,
  TrendChannelPattern,
  MACrossoverPattern,
  RSIDivergencePattern,
  VolumeClimaxPattern,
  GapPattern,
  ConsolidationBreakoutPattern,
} from '@/utils/chartPatterns';
import { ChartCoordinateMapper } from '@/utils/chartCoordinates';

interface AIAnnotationsProps {
  patterns: Record<string, PatternAnnotation[]>;
  coordinateMapper: ChartCoordinateMapper | null;
  onDismissPattern?: (patternType: string, index: number) => void;
  dismissedPatterns?: Set<string>; // Set of pattern IDs that have been dismissed
}

/**
 * AIAnnotations component - renders pattern overlays
 */
export const AIAnnotations: React.FC<AIAnnotationsProps> = ({
  patterns,
  coordinateMapper,
  onDismissPattern,
  dismissedPatterns = new Set(),
}) => {
  if (!coordinateMapper) {
    return null;
  }

  const dimensions = coordinateMapper.getDimensions();

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 20 }}
      width={dimensions.width}
      height={dimensions.height}
    >
      {/* Support & Resistance */}
      {patterns.supportResistance?.map((pattern, index) => (
        <SupportResistanceRenderer
          key={`sr-${index}`}
          pattern={pattern}
          mapper={coordinateMapper}
          onDismiss={() => onDismissPattern?.('supportResistance', index)}
          isDismissed={dismissedPatterns.has(`supportResistance-${index}`)}
        />
      ))}

      {/* Trend Channel */}
      {patterns.trendChannel?.map((pattern, index) => (
        <TrendChannelRenderer
          key={`tc-${index}`}
          pattern={pattern}
          mapper={coordinateMapper}
          onDismiss={() => onDismissPattern?.('trendChannel', index)}
          isDismissed={dismissedPatterns.has(`trendChannel-${index}`)}
        />
      ))}

      {/* MA Crossover */}
      {patterns.maCrossover?.map((pattern, index) => (
        <MACrossoverRenderer
          key={`mac-${index}`}
          pattern={pattern}
          mapper={coordinateMapper}
          onDismiss={() => onDismissPattern?.('maCrossover', index)}
          isDismissed={dismissedPatterns.has(`maCrossover-${index}`)}
        />
      ))}

      {/* RSI Divergence */}
      {patterns.rsiDivergence?.map((pattern, index) => (
        <RSIDivergenceRenderer
          key={`rsi-${index}`}
          pattern={pattern}
          mapper={coordinateMapper}
          onDismiss={() => onDismissPattern?.('rsiDivergence', index)}
          isDismissed={dismissedPatterns.has(`rsiDivergence-${index}`)}
        />
      ))}

      {/* Volume Climax */}
      {patterns.volumeClimax?.map((pattern, index) => (
        <VolumeClimaxRenderer
          key={`vc-${index}`}
          pattern={pattern}
          mapper={coordinateMapper}
          onDismiss={() => onDismissPattern?.('volumeClimax', index)}
          isDismissed={dismissedPatterns.has(`volumeClimax-${index}`)}
        />
      ))}

      {/* Gaps */}
      {patterns.gaps?.map((pattern, index) => (
        <GapRenderer
          key={`gap-${index}`}
          pattern={pattern}
          mapper={coordinateMapper}
          onDismiss={() => onDismissPattern?.('gaps', index)}
          isDismissed={dismissedPatterns.has(`gaps-${index}`)}
        />
      ))}

      {/* Consolidation & Breakout */}
      {patterns.consolidationBreakout?.map((pattern, index) => (
        <ConsolidationBreakoutRenderer
          key={`cb-${index}`}
          pattern={pattern}
          mapper={coordinateMapper}
          onDismiss={() => onDismissPattern?.('consolidationBreakout', index)}
          isDismissed={dismissedPatterns.has(`consolidationBreakout-${index}`)}
        />
      ))}
    </svg>
  );
};

// ============================================================================
// INDIVIDUAL PATTERN RENDERERS
// ============================================================================

interface PatternRendererProps<T> {
  pattern: T;
  mapper: ChartCoordinateMapper;
  onDismiss?: () => void;
  isDismissed: boolean;
}

/**
 * Support & Resistance Renderer
 */
const SupportResistanceRenderer: React.FC<PatternRendererProps<SupportResistancePattern>> = ({
  pattern,
  mapper,
  onDismiss,
  isDismissed,
}) => {
  if (isDismissed) return null;

  const dimensions = mapper.getDimensions();
  const yCenter = mapper.priceToY(pattern.level);
  const yUpper = mapper.priceToY(pattern.upperBound);
  const yLower = mapper.priceToY(pattern.lowerBound);

  if (yCenter === null || yUpper === null || yLower === null) {
    return null;
  }

  // Colors: green #3FB950 for support, red #F85149 for resistance
  const fillColor = pattern.isSupport ? '#3FB950' : '#F85149';
  const strokeColor = pattern.isSupport ? '#10b981' : '#ef4444';
  const labelColor = pattern.isSupport ? '#3FB950' : '#F85149';

  const chartWidth = dimensions.width - (dimensions.left || 0) - dimensions.right;
  const xStart = dimensions.left || 0;
  const xEnd = dimensions.width - dimensions.right;

  // Strength-based visual styles
  const getStrengthStyles = (strength: string) => {
    switch (strength) {
      case 'very-strong':
        return { opacity: 0.15, strokeWidth: 2, dashArray: 'none' }; // Solid line, highest opacity
      case 'strong':
        return { opacity: 0.12, strokeWidth: 1.5, dashArray: '8,4' }; // Long dashes
      case 'moderate':
        return { opacity: 0.08, strokeWidth: 1, dashArray: '6,6' }; // Medium dashes
      case 'weak':
        return { opacity: 0.05, strokeWidth: 1, dashArray: '4,8' }; // Short dashes, lowest opacity
      default:
        return { opacity: 0.08, strokeWidth: 1, dashArray: '6,6' };
    }
  };

  // Check for timeframe confluence (MUST be defined FIRST)
  const hasConfluence = pattern.hasTimeframeConfluence || false;
  const confluenceCount = pattern.confluenceTimeframes?.length || 0;

  const strengthStyles = getStrengthStyles(pattern.strength);

  // Boost visual weight for confluence levels
  const confluenceMultiplier = hasConfluence ? 1.5 : 1; // 50% thicker/brighter for confluence

  // Strength emoji indicator
  const strengthEmoji = {
    'very-strong': '🔴',
    'strong': '🟠',
    'moderate': '🟡',
    'weak': '⚪',
  };

  // Format "last tested" time
  const daysAgo = pattern.daysSinceLastTest;
  const timeText =
    daysAgo === 0
      ? 'Today'
      : daysAgo === 1
      ? '1d ago'
      : daysAgo < 7
      ? `${daysAgo}d ago`
      : daysAgo < 30
      ? `${Math.floor(daysAgo / 7)}w ago`
      : `${Math.floor(daysAgo / 30)}m ago`;

  // Enhanced label format with confluence indicator
  // Confluence levels: Double emoji (🔴🔴) or triple (🔴🔴🔴)
  const emojiBase = strengthEmoji[pattern.strength];
  const emojiDisplay = hasConfluence
    ? emojiBase.repeat(Math.min(confluenceCount, 3)) // Show 2-3 emojis for confluence
    : emojiBase;

  const shortLabel = pattern.isSupport ? 'S' : 'R';
  const formattedPrice = `₹${pattern.level.toFixed(0)}`;
  const touchLabel = `${pattern.touchCount}T`;
  const confluenceBadge = hasConfluence ? ' ⭐' : ''; // Star badge for confluence
  const labelText = `${emojiDisplay} ${shortLabel} ${formattedPrice} (${touchLabel}, ${timeText})${confluenceBadge}`;

  // Position label 10px left of right edge (increased width to accommodate longer text)
  const labelX = xEnd - 150;
  const labelY = yCenter;

  return (
    <g>
      {/* Zone band - semi-transparent rectangle with strength-based opacity */}
      <rect
        x={xStart}
        y={yUpper}
        width={chartWidth}
        height={yLower - yUpper}
        fill={fillColor}
        opacity={strengthStyles.opacity * confluenceMultiplier}
        pointerEvents="none"
      />

      {/* Upper border line */}
      <line
        x1={xStart}
        y1={yUpper}
        x2={xEnd}
        y2={yUpper}
        stroke={strokeColor}
        strokeWidth={strengthStyles.strokeWidth * 0.7 * confluenceMultiplier}
        strokeDasharray={strengthStyles.dashArray}
        opacity={strengthStyles.opacity * 3 * confluenceMultiplier}
      />

      {/* Center line - main level indicator with strength-based styling + confluence boost */}
      <line
        x1={xStart}
        y1={yCenter}
        x2={xEnd}
        y2={yCenter}
        stroke={strokeColor}
        strokeWidth={strengthStyles.strokeWidth * confluenceMultiplier * 1.5} // Extra thick for confluence
        strokeDasharray={strengthStyles.dashArray}
        opacity={strengthStyles.opacity * 4 * confluenceMultiplier}
      />

      {/* Lower border line */}
      <line
        x1={xStart}
        y1={yLower}
        x2={xEnd}
        y2={yLower}
        stroke={strokeColor}
        strokeWidth={strengthStyles.strokeWidth * 0.7 * confluenceMultiplier}
        strokeDasharray={strengthStyles.dashArray}
        opacity={strengthStyles.opacity * 3 * confluenceMultiplier}
      />

      {/* Label pill with increased width for longer text */}
      <g className="pointer-events-auto">
        <rect
          x={labelX}
          y={labelY - 10}
          width={140}
          height={20}
          fill={labelColor}
          opacity={0.85}
          rx={10}
        />
        <text
          x={labelX + 6}
          y={labelY + 4}
          fontSize={10}
          fill="white"
          fontWeight="600"
        >
          {labelText}
        </text>

        {/* Dismiss button */}
        {onDismiss && (
          <g
            onClick={onDismiss}
            style={{ cursor: 'pointer' }}
            className="hover:opacity-80"
          >
            <circle
              cx={labelX + 93}
              cy={labelY}
              r={7}
              fill="white"
              opacity={0.9}
            />
            <X
              x={labelX + 88}
              y={labelY - 5}
              width={10}
              height={10}
              stroke={labelColor}
              strokeWidth={2}
            />
          </g>
        )}
      </g>

      {/* AI badge */}
      <AIBadge x={xStart + 5} y={yCenter - 12} />
    </g>
  );
};

/**
 * Trend Channel Renderer
 */
const TrendChannelRenderer: React.FC<PatternRendererProps<TrendChannelPattern>> = ({
  pattern,
  mapper,
  onDismiss,
  isDismissed,
}) => {
  if (isDismissed) return null;

  const startPoint = mapper.chartToSVG(pattern.startDate, pattern.upperIntercept);
  const endX = mapper.dateToX(pattern.endDate);

  if (!startPoint || endX === null) return null;

  // Calculate end points based on slope
  const dataLength = mapper.getChartData().length;
  const upperEndY = pattern.upperIntercept + pattern.upperSlope * dataLength;
  const lowerEndY = pattern.lowerIntercept + pattern.lowerSlope * dataLength;

  const upperY = mapper.priceToY(upperEndY);
  const lowerY = mapper.priceToY(lowerEndY);

  if (upperY === null || lowerY === null) return null;

  const color = pattern.direction === 'up' ? '#10b981' : '#ef4444';

  return (
    <g>
      {/* Upper trendline */}
      <line
        x1={startPoint.x}
        y1={startPoint.y}
        x2={endX}
        y2={upperY}
        stroke={color}
        strokeWidth={2}
        opacity={0.7}
      />

      {/* Lower trendline */}
      <line
        x1={startPoint.x}
        y1={mapper.priceToY(pattern.lowerIntercept)!}
        x2={endX}
        y2={lowerY}
        stroke={color}
        strokeWidth={2}
        opacity={0.7}
      />

      {/* Fill between lines */}
      <polygon
        points={`${startPoint.x},${startPoint.y} ${endX},${upperY} ${endX},${lowerY} ${startPoint.x},${mapper.priceToY(pattern.lowerIntercept)}`}
        fill={color}
        opacity={0.1}
      />

      {/* Label */}
      <text
        x={(startPoint.x + endX) / 2}
        y={(upperY + lowerY) / 2}
        fontSize={12}
        fill={color}
        fontWeight="600"
        textAnchor="middle"
      >
        {pattern.direction === 'up' ? '▲' : '▼'} Channel (R²={pattern.rSquared.toFixed(2)})
      </text>

      <AIBadge x={startPoint.x + 5} y={startPoint.y - 20} />
    </g>
  );
};

/**
 * MA Crossover Renderer
 */
const MACrossoverRenderer: React.FC<PatternRendererProps<MACrossoverPattern>> = ({
  pattern,
  mapper,
  onDismiss,
  isDismissed,
}) => {
  if (isDismissed) return null;

  const point = mapper.chartToSVG(pattern.crossoverDate, pattern.crossoverPrice);
  if (!point) return null;

  const icon = pattern.isGolden ? '⭐' : '💀';
  const color = pattern.isGolden ? '#fbbf24' : '#dc2626';

  return (
    <g className="pointer-events-auto">
      {/* Marker circle */}
      <circle cx={point.x} cy={point.y} r={12} fill={color} opacity={0.9} />

      {/* Icon */}
      <text
        x={point.x}
        y={point.y + 5}
        fontSize={16}
        textAnchor="middle"
      >
        {icon}
      </text>

      {/* Tooltip box */}
      <g>
        <rect
          x={point.x - 80}
          y={point.y - 40}
          width={160}
          height={32}
          fill="#1f2937"
          stroke={color}
          strokeWidth={2}
          rx={4}
          opacity={0.95}
        />
        <text
          x={point.x}
          y={point.y - 28}
          fontSize={11}
          fill="white"
          fontWeight="600"
          textAnchor="middle"
        >
          {pattern.isGolden ? 'Golden Cross' : 'Death Cross'}
        </text>
        <text
          x={point.x}
          y={point.y - 14}
          fontSize={10}
          fill="#9ca3af"
          textAnchor="middle"
        >
          {pattern.performanceSinceCross >= 0 ? '+' : ''}
          {pattern.performanceSinceCross.toFixed(1)}% since cross
        </text>
      </g>

      <AIBadge x={point.x + 15} y={point.y - 15} />
    </g>
  );
};

/**
 * RSI Divergence Renderer
 */
const RSIDivergenceRenderer: React.FC<PatternRendererProps<RSIDivergencePattern>> = ({
  pattern,
  mapper,
  onDismiss,
  isDismissed,
}) => {
  if (isDismissed) return null;

  const point1 = mapper.chartToSVG(pattern.pricePoints[0].date, pattern.pricePoints[0].price);
  const point2 = mapper.chartToSVG(pattern.pricePoints[1].date, pattern.pricePoints[1].price);

  if (!point1 || !point2) return null;

  const color = pattern.isBullish ? '#10b981' : '#ef4444';

  return (
    <g>
      {/* Divergence line on price chart */}
      <line
        x1={point1.x}
        y1={point1.y}
        x2={point2.x}
        y2={point2.y}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="4,4"
        opacity={0.7}
      />

      {/* Dots at endpoints */}
      <circle cx={point1.x} cy={point1.y} r={4} fill={color} />
      <circle cx={point2.x} cy={point2.y} r={4} fill={color} />

      {/* Label */}
      <text
        x={(point1.x + point2.x) / 2}
        y={Math.min(point1.y, point2.y) - 10}
        fontSize={11}
        fill={color}
        fontWeight="600"
        textAnchor="middle"
      >
        {pattern.isBullish ? 'Bullish' : 'Bearish'} RSI Divergence
      </text>

      <AIBadge x={point2.x + 5} y={point2.y - 15} />
    </g>
  );
};

/**
 * Volume Climax Renderer
 */
const VolumeClimaxRenderer: React.FC<PatternRendererProps<VolumeClimaxPattern>> = ({
  pattern,
  mapper,
  onDismiss,
  isDismissed,
}) => {
  if (isDismissed) return null;

  const dataPoint = mapper.getDataPointAtDate(pattern.date);
  if (!dataPoint) return null;

  const point = mapper.chartToSVG(pattern.date, dataPoint.high);
  if (!point) return null;

  return (
    <g>
      {/* Highlight marker */}
      <circle cx={point.x} cy={point.y} r={10} fill="#fbbf24" opacity={0.3} />
      <circle cx={point.x} cy={point.y} r={6} fill="#fbbf24" opacity={0.6} />

      {/* Label */}
      <text
        x={point.x}
        y={point.y - 15}
        fontSize={11}
        fill="#fbbf24"
        fontWeight="600"
        textAnchor="middle"
      >
        Volume {pattern.volumeRatio.toFixed(1)}×
      </text>

      <AIBadge x={point.x + 12} y={point.y - 12} />
    </g>
  );
};

/**
 * Gap Renderer
 */
const GapRenderer: React.FC<PatternRendererProps<GapPattern>> = ({
  pattern,
  mapper,
  onDismiss,
  isDismissed,
}) => {
  if (isDismissed) return null;

  const x = mapper.dateToX(pattern.gapDate);
  const y1 = mapper.priceToY(pattern.gapType === 'up' ? pattern.prevHigh : pattern.prevLow);
  const y2 = mapper.priceToY(pattern.gapType === 'up' ? pattern.currLow : pattern.currHigh);

  if (x === null || y1 === null || y2 === null) return null;

  const color = pattern.gapType === 'up' ? '#10b981' : '#ef4444';

  return (
    <g>
      {/* Gap rectangle */}
      <rect
        x={x - 5}
        y={Math.min(y1, y2)}
        width={10}
        height={Math.abs(y2 - y1)}
        fill={color}
        opacity={pattern.isFilled ? 0.2 : 0.4}
        stroke={color}
        strokeWidth={1}
        strokeDasharray={pattern.isFilled ? '2,2' : ''}
      />

      {/* Label */}
      <text
        x={x}
        y={Math.min(y1, y2) - 5}
        fontSize={10}
        fill={color}
        fontWeight="600"
        textAnchor="middle"
      >
        {pattern.gapType === 'up' ? '↑' : '↓'} {pattern.gapSize.toFixed(1)}%
      </text>

      <AIBadge x={x + 8} y={Math.min(y1, y2)} />
    </g>
  );
};

/**
 * Consolidation & Breakout Renderer
 */
const ConsolidationBreakoutRenderer: React.FC<
  PatternRendererProps<ConsolidationBreakoutPattern>
> = ({ pattern, mapper, onDismiss, isDismissed }) => {
  if (isDismissed) return null;

  const startX = mapper.dateToX(pattern.consolidationStart);
  const endX = mapper.dateToX(pattern.consolidationEnd);
  const highY = mapper.priceToY(pattern.consolidationHigh);
  const lowY = mapper.priceToY(pattern.consolidationLow);

  if (startX === null || endX === null || highY === null || lowY === null) return null;

  const color = pattern.breakoutDirection === 'up' ? '#10b981' : pattern.breakoutDirection === 'down' ? '#ef4444' : '#6366f1';

  return (
    <g>
      {/* Consolidation rectangle */}
      <rect
        x={startX}
        y={highY}
        width={endX - startX}
        height={lowY - highY}
        fill={color}
        opacity={0.1}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="4,4"
      />

      {/* Breakout arrow */}
      {pattern.breakoutDirection && pattern.breakoutDate && (
        <>
          <line
            x1={endX}
            y1={(highY + lowY) / 2}
            x2={mapper.dateToX(pattern.breakoutDate)!}
            y2={pattern.breakoutDirection === 'up' ? highY - 20 : lowY + 20}
            stroke={color}
            strokeWidth={3}
            markerEnd="url(#arrowhead)"
          />
        </>
      )}

      {/* Label */}
      <text
        x={(startX + endX) / 2}
        y={highY - 10}
        fontSize={11}
        fill={color}
        fontWeight="600"
        textAnchor="middle"
      >
        Consolidation {pattern.consolidationRange.toFixed(1)}%
      </text>

      <AIBadge x={startX + 5} y={highY + 5} />
    </g>
  );
};

/**
 * AI Badge Component
 */
const AIBadge: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y} width={32} height={16} fill="#8b5cf6" opacity={0.9} rx={4} />
      <Sparkles
        x={x + 3}
        y={y + 2}
        width={12}
        height={12}
        stroke="white"
        strokeWidth={2}
        fill="none"
      />
      <text x={x + 17} y={y + 11} fontSize={9} fill="white" fontWeight="600">
        AI
      </text>
    </g>
  );
};
