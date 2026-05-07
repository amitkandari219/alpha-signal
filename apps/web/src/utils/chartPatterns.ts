/**
 * Chart Pattern Detection Algorithms
 *
 * 7 AI-powered pattern detection algorithms for chart analysis:
 * 1. Support & Resistance
 * 2. Trend Channel
 * 3. MA Crossover (Golden/Death Cross)
 * 4. RSI Divergence
 * 5. Volume Climax
 * 6. Gap Detection
 * 7. Consolidation & Breakout
 */

import { OHLCVData, calculateSMA, calculateRSI } from './technicalIndicators';

// ============================================================================
// TYPES
// ============================================================================

export type PatternType =
  | 'supportResistance'
  | 'trendChannel'
  | 'maCrossover'
  | 'rsiDivergence'
  | 'volumeClimax'
  | 'gaps'
  | 'consolidationBreakout';

export type LevelStrength = 'weak' | 'moderate' | 'strong' | 'very-strong';

export interface BasePattern {
  type: PatternType;
  confidence: number; // 0-1
  detectedAt: string; // ISO date
  description: string;
}

export interface SupportResistancePattern extends BasePattern {
  type: 'supportResistance';
  level: number; // center price level
  upperBound: number; // zone upper limit
  lowerBound: number; // zone lower limit
  touchPoints: { date: string; price: number; bounceStrength: number }[];
  isSupport: boolean;
  averageBounceStrength: number; // average % reversal
  touchCount: number; // number of touches
  lastTestedDate: string; // ISO date of most recent touch
  daysSinceLastTest: number; // days since most recent touch
  recencyWeight: number; // 0-1 score (1.0 = very recent, 0.2 = old)
  strength: LevelStrength; // overall level strength classification
  hasTimeframeConfluence?: boolean; // true if level appears across 2+ timeframes
  confluenceTimeframes?: string[]; // e.g., ['1M', '3M', '1Y']
}

export interface TrendChannelPattern extends BasePattern {
  type: 'trendChannel';
  startDate: string;
  endDate: string;
  upperSlope: number;
  lowerSlope: number;
  upperIntercept: number;
  lowerIntercept: number;
  rSquared: number;
  direction: 'up' | 'down';
}

export interface MACrossoverPattern extends BasePattern {
  type: 'maCrossover';
  crossoverDate: string;
  crossoverPrice: number;
  isGolden: boolean; // true = golden cross, false = death cross
  sma50Value: number;
  sma200Value: number;
  performanceSinceCross: number; // % return since cross
}

export interface RSIDivergencePattern extends BasePattern {
  type: 'rsiDivergence';
  startDate: string;
  endDate: string;
  isBullish: boolean;
  pricePoints: { date: string; price: number }[];
  rsiPoints: { date: string; value: number }[];
}

export interface VolumeClimaxPattern extends BasePattern {
  type: 'volumeClimax';
  date: string;
  volume: number;
  averageVolume: number;
  volumeRatio: number; // actual / average
  priceChange: number; // % change on that day
}

export interface GapPattern extends BasePattern {
  type: 'gaps';
  gapDate: string;
  gapType: 'up' | 'down';
  gapSize: number; // % gap
  prevHigh: number;
  prevLow: number;
  currHigh: number;
  currLow: number;
  isFilled: boolean;
  filledDate?: string;
}

export interface ConsolidationBreakoutPattern extends BasePattern {
  type: 'consolidationBreakout';
  consolidationStart: string;
  consolidationEnd: string;
  consolidationHigh: number;
  consolidationLow: number;
  consolidationRange: number; // %
  breakoutDate?: string;
  breakoutDirection?: 'up' | 'down';
  breakoutPrice?: number;
}

export type PatternAnnotation =
  | SupportResistancePattern
  | TrendChannelPattern
  | MACrossoverPattern
  | RSIDivergencePattern
  | VolumeClimaxPattern
  | GapPattern
  | ConsolidationBreakoutPattern;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Classify level strength based on multiple factors
 */
function classifyLevelStrength(
  touchCount: number,
  avgBounceStrength: number,
  recencyWeight: number,
  hasTimeframeConfluence: boolean
): LevelStrength {
  const score =
    touchCount * 10 +
    avgBounceStrength * 5 +
    recencyWeight * 20 +
    (hasTimeframeConfluence ? 15 : 0);

  if (score >= 50) return 'very-strong';
  if (score >= 35) return 'strong';
  if (score >= 20) return 'moderate';
  return 'weak';
}

// ============================================================================
// 1. SUPPORT & RESISTANCE DETECTION
// ============================================================================

/**
 * Detect support and resistance levels with bounce confirmation
 *
 * Algorithm:
 * - Find pivot highs and lows (local extrema)
 * - Cluster pivots within tight tolerance (1.0-1.5% max)
 * - Validate bounces: price must reverse by 1.5-2.5%+ within 3 bars
 * - Deduplicate touches within minDaysBetweenTouches window
 * - Score by average bounce strength, prioritize strong bounces over weak touches
 */
export function detectSupportResistance(
  data: OHLCVData[],
  windowSize: number = 5,
  tolerance: number = 0.01, // 1% tolerance
  minTouches: number = 2,
  minBounce: number = 1.5, // Minimum % bounce required
  minDaysBetweenTouches: number = 5 // Minimum days between touches to avoid micro-noise
): SupportResistancePattern[] {
  // Helper functions defined FIRST for hoisting
  function calculateBounceStrength(pivotIndex: number, pivotPrice: number, isSupport: boolean): number {
    let maxBounce = 0;
    for (let j = pivotIndex + 1; j <= Math.min(pivotIndex + 3, data.length - 1); j++) {
      if (isSupport) {
        const bounce = ((data[j].high - pivotPrice) / pivotPrice) * 100;
        maxBounce = Math.max(maxBounce, bounce);
      } else {
        const bounce = ((pivotPrice - data[j].low) / pivotPrice) * 100;
        maxBounce = Math.max(maxBounce, bounce);
      }
    }
    return maxBounce;
  }

  function calculateRecencyWeight(daysSinceLastTest: number): number {
    if (daysSinceLastTest <= 30) return 1.0;
    if (daysSinceLastTest <= 90) return 0.7;
    if (daysSinceLastTest <= 180) return 0.4;
    return 0.2;
  }

  function deduplicateTouches(touches: Array<{ date: string; price: number; bounceStrength: number }>): Array<{ date: string; price: number; bounceStrength: number }> {
    if (touches.length === 0) return touches;
    const validTouchesOnly = touches.filter((t) => {
      const date = new Date(t.date);
      return !isNaN(date.getTime()) && !isNaN(t.price) && !isNaN(t.bounceStrength);
    });
    if (validTouchesOnly.length === 0) return [];
    const sorted = [...validTouchesOnly].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const deduplicated: Array<{ date: string; price: number; bounceStrength: number }> = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      const lastTouch = deduplicated[deduplicated.length - 1];
      const currentTouch = sorted[i];
      const daysDiff = Math.abs((new Date(currentTouch.date).getTime() - new Date(lastTouch.date).getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= minDaysBetweenTouches) {
        deduplicated.push(currentTouch);
      } else {
        if (currentTouch.bounceStrength > lastTouch.bounceStrength) {
          deduplicated[deduplicated.length - 1] = currentTouch;
        }
      }
    }
    return deduplicated;
  }

  function removeOutliers(touches: Array<{ date: string; price: number; bounceStrength: number }>): Array<{ date: string; price: number; bounceStrength: number }> {
    if (touches.length < 3) return touches;
    const avgPrice = touches.reduce((sum, t) => sum + t.price, 0) / touches.length;
    const filtered = touches.filter((t) => {
      const deviation = Math.abs(t.price - avgPrice) / avgPrice;
      return deviation <= 0.01;
    });
    return filtered.length >= minTouches ? filtered : touches;
  }

  try {
    console.log('[SR Detection] Step 1: Starting');
    console.log('[SR Detection] Step 2: Data check', { dataLength: data?.length, windowSize, tolerance, minTouches, minBounce });

    // Validate inputs
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('[SR Detection] Invalid data, returning empty');
      return [];
    }
    console.log('[SR Detection] Step 3: Data is valid');

    if (data.length < windowSize * 2 + 3) {
      console.log('[SR Detection] Not enough data points, returning empty');
      return [];
    }
    console.log('[SR Detection] Step 4: Data length check passed');

    const patterns: SupportResistancePattern[] = [];
    console.log('[SR Detection] Step 5: Patterns array created');

  // Find pivot highs and lows with their indices
  console.log('[SR Detection] Step 6: About to find pivots');
  const pivots: { date: string; price: number; type: 'high' | 'low'; index: number }[] = [];
  console.log('[SR Detection] Step 7: Pivots array created, starting loop');

  for (let i = windowSize; i < data.length - windowSize - 3; i++) { // -3 to allow bounce check
    const current = data[i];
    let isPivotHigh = true;
    let isPivotLow = true;

    // Check if it's a pivot high (highest in window)
    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j !== i && data[j].high >= current.high) {
        isPivotHigh = false;
      }
      if (j !== i && data[j].low <= current.low) {
        isPivotLow = false;
      }
    }

    if (isPivotHigh) {
      pivots.push({ date: current.time, price: current.high, type: 'high', index: i });
    }
    if (isPivotLow) {
      pivots.push({ date: current.time, price: current.low, type: 'low', index: i });
    }
  }
  console.log('[SR Detection] Step 8: Pivot loop completed, found', pivots.length, 'pivots');

  // Cluster pivots by price level
  console.log('[SR Detection] Step 9: About to cluster resistance pivots');
  const resistanceClusters = clusterPivotsWithIndex(
    pivots.filter((p) => p.type === 'high'),
    tolerance
  );
  console.log('[SR Detection] Step 10: Resistance clusters done');
  const supportClusters = clusterPivotsWithIndex(
    pivots.filter((p) => p.type === 'low'),
    tolerance
  );
  console.log('[SR Detection] Step 11: Support clusters done, got', resistanceClusters.length, 'resistance and', supportClusters.length, 'support clusters');

  // Process resistance patterns
  console.log('[SR Detection] Step 12: About to process resistance patterns');
  resistanceClusters.forEach((cluster) => {
    if (cluster.length >= minTouches) {
      // Calculate bounce strength for each touch
      const touchesWithBounce = cluster.map((p) => ({
        date: p.date,
        price: p.price,
        bounceStrength: calculateBounceStrength(p.index, p.price, false),
      }));

      // Filter: only keep touches with sufficient bounce
      let validTouches = touchesWithBounce.filter((t) => t.bounceStrength >= minBounce);

      // Deduplicate touches that are too close in time (avoid counting micro-noise)
      validTouches = deduplicateTouches(validTouches);

      // Remove outliers (swing highs that are far from cluster average)
      validTouches = removeOutliers(validTouches);

      if (validTouches.length >= minTouches) {
        const avgPrice = validTouches.reduce((sum, p) => sum + p.price, 0) / validTouches.length;
        const avgBounce = validTouches.reduce((sum, t) => sum + t.bounceStrength, 0) / validTouches.length;

        // Calculate recency metrics
        const sortedTouches = [...validTouches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastTestedDate = sortedTouches[0].date; // Most recent touch
        const mostRecentDate = data[data.length - 1].time; // Current date (last data point)
        const daysSinceLastTest = Math.max(0, Math.floor(
          (new Date(mostRecentDate).getTime() - new Date(lastTestedDate).getTime()) / (1000 * 60 * 60 * 24)
        ));

        // Validate daysSinceLastTest is a valid number
        if (isNaN(daysSinceLastTest)) {
          return; // Skip this pattern if date calculation failed
        }

        const recencyWeight = calculateRecencyWeight(daysSinceLastTest);

        // Zone bounds: ±0.5%
        const zoneWidth = avgPrice * 0.005;

        // Updated confidence calculation with recency weighting
        // 30% touch count + 40% bounce strength + 30% recency
        const touchScore = (validTouches.length / 3) * 0.3;
        const bounceScore = (avgBounce / 10) * 0.4;
        const recencyScore = recencyWeight * 0.3;
        const confidence = Math.min(touchScore + bounceScore + recencyScore, 1);

        // Calculate level strength classification
        // TODO: Implement timeframe confluence detection (currently set to false)
        const hasTimeframeConfluence = false;
        const strength = classifyLevelStrength(validTouches.length, avgBounce, recencyWeight, hasTimeframeConfluence);

        patterns.push({
          type: 'supportResistance',
          confidence,
          detectedAt: validTouches[validTouches.length - 1].date,
          description: `Resistance at ₹${avgPrice.toFixed(2)} (${validTouches.length}T, ${avgBounce.toFixed(1)}% bounce)`,
          level: avgPrice,
          upperBound: avgPrice + zoneWidth,
          lowerBound: avgPrice - zoneWidth,
          touchPoints: validTouches,
          isSupport: false,
          averageBounceStrength: avgBounce,
          touchCount: validTouches.length,
          lastTestedDate,
          daysSinceLastTest,
          recencyWeight,
          strength,
        });
      }
    }
  });

  // Process support patterns
  supportClusters.forEach((cluster) => {
    if (cluster.length >= minTouches) {
      // Calculate bounce strength for each touch
      const touchesWithBounce = cluster.map((p) => ({
        date: p.date,
        price: p.price,
        bounceStrength: calculateBounceStrength(p.index, p.price, true),
      }));

      // Filter: only keep touches with sufficient bounce
      let validTouches = touchesWithBounce.filter((t) => t.bounceStrength >= minBounce);

      // Deduplicate touches that are too close in time (avoid counting micro-noise)
      validTouches = deduplicateTouches(validTouches);

      // Remove outliers (swing lows that are far from cluster average)
      validTouches = removeOutliers(validTouches);

      if (validTouches.length >= minTouches) {
        const avgPrice = validTouches.reduce((sum, p) => sum + p.price, 0) / validTouches.length;
        const avgBounce = validTouches.reduce((sum, t) => sum + t.bounceStrength, 0) / validTouches.length;

        // Calculate recency metrics
        const sortedTouches = [...validTouches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastTestedDate = sortedTouches[0].date; // Most recent touch
        const mostRecentDate = data[data.length - 1].time; // Current date (last data point)
        const daysSinceLastTest = Math.max(0, Math.floor(
          (new Date(mostRecentDate).getTime() - new Date(lastTestedDate).getTime()) / (1000 * 60 * 60 * 24)
        ));

        // Validate daysSinceLastTest is a valid number
        if (isNaN(daysSinceLastTest)) {
          return; // Skip this pattern if date calculation failed
        }

        const recencyWeight = calculateRecencyWeight(daysSinceLastTest);

        // Zone bounds: ±0.5%
        const zoneWidth = avgPrice * 0.005;

        // Updated confidence calculation with recency weighting
        // 30% touch count + 40% bounce strength + 30% recency
        const touchScore = (validTouches.length / 3) * 0.3;
        const bounceScore = (avgBounce / 10) * 0.4;
        const recencyScore = recencyWeight * 0.3;
        const confidence = Math.min(touchScore + bounceScore + recencyScore, 1);

        // Calculate level strength classification
        // TODO: Implement timeframe confluence detection (currently set to false)
        const hasTimeframeConfluence = false;
        const strength = classifyLevelStrength(validTouches.length, avgBounce, recencyWeight, hasTimeframeConfluence);

        patterns.push({
          type: 'supportResistance',
          confidence,
          detectedAt: validTouches[validTouches.length - 1].date,
          description: `Support at ₹${avgPrice.toFixed(2)} (${validTouches.length}T, ${avgBounce.toFixed(1)}% bounce)`,
          level: avgPrice,
          upperBound: avgPrice + zoneWidth,
          lowerBound: avgPrice - zoneWidth,
          touchPoints: validTouches,
          isSupport: true,
          averageBounceStrength: avgBounce,
          touchCount: validTouches.length,
          lastTestedDate,
          daysSinceLastTest,
          recencyWeight,
          strength,
        });
      }
    }
  });

  // Filter out stale levels (not tested in 6+ months) UNLESS they're exceptional
  const filteredPatterns = patterns.filter((pattern) => {
    const daysSince = pattern.daysSinceLastTest;

    // Keep if:
    // - Tested in last 180 days (6 months), OR
    // - Very strong (7+ touches with avg bounce ≥3%), OR
    // - Has timeframe confluence (will be marked later)
    return (
      daysSince <= 180 ||
      (pattern.touchCount >= 7 && pattern.averageBounceStrength >= 3.0)
    );
  });

  // Sort by confidence (prioritizes stronger bounces + recency)
  const sorted = filteredPatterns.sort((a, b) => b.confidence - a.confidence);

  // Limit to top 3 support and top 3 resistance to avoid chart clutter
  const supportPatterns = sorted.filter((p) => p.isSupport).slice(0, 3);
  const resistancePatterns = sorted.filter((p) => !p.isSupport).slice(0, 3);

  const result = [...supportPatterns, ...resistancePatterns];
  console.log('[SR Detection] Completed successfully, returning:', result.length, 'patterns');
  return result;
  } catch (error) {
    console.error('[SR Detection] Error in detectSupportResistance:', error);
    return [];
  }
}

function clusterPivots(
  pivots: { date: string; price: number }[],
  tolerance: number
): { date: string; price: number }[][] {
  if (pivots.length === 0) return [];

  const clusters: { date: string; price: number }[][] = [];
  const sorted = [...pivots].sort((a, b) => a.price - b.price);

  let currentCluster: { date: string; price: number }[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevPrice = currentCluster[currentCluster.length - 1].price;
    const currPrice = sorted[i].price;

    if (Math.abs(currPrice - prevPrice) / prevPrice <= tolerance) {
      currentCluster.push(sorted[i]);
    } else {
      clusters.push(currentCluster);
      currentCluster = [sorted[i]];
    }
  }

  clusters.push(currentCluster);
  return clusters;
}

function clusterPivotsWithIndex(
  pivots: { date: string; price: number; index: number }[],
  tolerance: number
): { date: string; price: number; index: number }[][] {
  if (pivots.length === 0) return [];

  const clusters: { date: string; price: number; index: number }[][] = [];
  const sorted = [...pivots].sort((a, b) => a.price - b.price);

  let currentCluster: { date: string; price: number; index: number }[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevPrice = currentCluster[currentCluster.length - 1].price;
    const currPrice = sorted[i].price;

    if (Math.abs(currPrice - prevPrice) / prevPrice <= tolerance) {
      currentCluster.push(sorted[i]);
    } else {
      clusters.push(currentCluster);
      currentCluster = [sorted[i]];
    }
  }

  clusters.push(currentCluster);
  return clusters;
}

// ============================================================================
// 2. TREND CHANNEL DETECTION
// ============================================================================

/**
 * Detect trend channels using linear regression
 *
 * Algorithm:
 * - Run linear regression on highs and lows separately
 * - Valid if R² > 0.7 for both, parallel slopes
 */
export function detectTrendChannel(
  data: OHLCVData[],
  minPoints: number = 20,
  rSquaredThreshold: number = 0.7
): TrendChannelPattern[] {
  if (data.length < minPoints) return [];

  const patterns: TrendChannelPattern[] = [];

  // Use last 60 data points for channel detection
  const recentData = data.slice(-Math.min(60, data.length));

  // Linear regression on highs
  const highsRegression = linearRegression(recentData.map((d, i) => ({ x: i, y: d.high })));

  // Linear regression on lows
  const lowsRegression = linearRegression(recentData.map((d, i) => ({ x: i, y: d.low })));

  // Check if both have strong correlation
  if (highsRegression.rSquared > rSquaredThreshold && lowsRegression.rSquared > rSquaredThreshold) {
    // Check if slopes are parallel (within 20% of each other)
    const slopeRatio = Math.abs(highsRegression.slope / lowsRegression.slope);
    if (slopeRatio > 0.8 && slopeRatio < 1.2) {
      const direction = highsRegression.slope > 0 ? 'up' : 'down';

      patterns.push({
        type: 'trendChannel',
        confidence: Math.min((highsRegression.rSquared + lowsRegression.rSquared) / 2, 1),
        detectedAt: recentData[recentData.length - 1].time,
        description: `${direction === 'up' ? 'Ascending' : 'Descending'} channel (R²=${highsRegression.rSquared.toFixed(2)})`,
        startDate: recentData[0].time,
        endDate: recentData[recentData.length - 1].time,
        upperSlope: highsRegression.slope,
        lowerSlope: lowsRegression.slope,
        upperIntercept: highsRegression.intercept,
        lowerIntercept: lowsRegression.intercept,
        rSquared: (highsRegression.rSquared + lowsRegression.rSquared) / 2,
        direction,
      });
    }
  }

  return patterns;
}

function linearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumYY = points.reduce((sum, p) => sum + p.y * p.y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const meanY = sumY / n;
  const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
  const ssResidual = points.reduce((sum, p) => {
    const predicted = slope * p.x + intercept;
    return sum + Math.pow(p.y - predicted, 2);
  }, 0);
  const rSquared = 1 - ssResidual / ssTotal;

  return { slope, intercept, rSquared: Math.max(0, rSquared) };
}

// ============================================================================
// 3. MA CROSSOVER (GOLDEN/DEATH CROSS)
// ============================================================================

/**
 * Detect SMA50 and SMA200 crossovers
 */
export function detectMACrossover(data: OHLCVData[]): MACrossoverPattern[] {
  if (data.length < 200) return [];

  const patterns: MACrossoverPattern[] = [];
  const sma50 = calculateSMA(data, 50);
  const sma200 = calculateSMA(data, 200);

  // Find crossovers
  for (let i = 200; i < data.length; i++) {
    const prevSma50 = sma50[i - 1];
    const prevSma200 = sma200[i - 1];
    const currSma50 = sma50[i];
    const currSma200 = sma200[i];

    // Golden cross: SMA50 crosses above SMA200
    if (prevSma50 < prevSma200 && currSma50 > currSma200) {
      const performance = ((data[data.length - 1].close - data[i].close) / data[i].close) * 100;

      patterns.push({
        type: 'maCrossover',
        confidence: 0.85,
        detectedAt: data[i].time,
        description: `Golden Cross - SMA50 crossed above SMA200 (+${performance.toFixed(1)}% since)`,
        crossoverDate: data[i].time,
        crossoverPrice: data[i].close,
        isGolden: true,
        sma50Value: currSma50,
        sma200Value: currSma200,
        performanceSinceCross: performance,
      });
    }

    // Death cross: SMA50 crosses below SMA200
    if (prevSma50 > prevSma200 && currSma50 < currSma200) {
      const performance = ((data[data.length - 1].close - data[i].close) / data[i].close) * 100;

      patterns.push({
        type: 'maCrossover',
        confidence: 0.85,
        detectedAt: data[i].time,
        description: `Death Cross - SMA50 crossed below SMA200 (${performance.toFixed(1)}% since)`,
        crossoverDate: data[i].time,
        crossoverPrice: data[i].close,
        isGolden: false,
        sma50Value: currSma50,
        sma200Value: currSma200,
        performanceSinceCross: performance,
      });
    }
  }

  // Return only most recent crossover
  return patterns.slice(-1);
}

// ============================================================================
// 4. RSI DIVERGENCE
// ============================================================================

/**
 * Detect RSI divergences (bullish and bearish)
 */
export function detectRSIDivergence(
  data: OHLCVData[],
  rsiPeriod: number = 14
): RSIDivergencePattern[] {
  if (data.length < rsiPeriod + 20) return [];

  const patterns: RSIDivergencePattern[] = [];
  const rsiValues = calculateRSI(data, rsiPeriod);

  // Find recent pivots (last 30 bars)
  const recentData = data.slice(-30);
  const recentRsi = rsiValues.slice(-30);

  // Find pivot highs and lows
  for (let i = 5; i < recentData.length - 5; i++) {
    // Check for bullish divergence: price lower low + RSI higher low
    if (i > 10) {
      const currPrice = recentData[i].low;
      const currRsi = recentRsi[i];

      // Find previous low
      for (let j = i - 10; j < i - 2; j++) {
        const prevPrice = recentData[j].low;
        const prevRsi = recentRsi[j];

        // Bullish divergence
        if (currPrice < prevPrice && currRsi > prevRsi && currRsi < 40 && prevRsi < 40) {
          patterns.push({
            type: 'rsiDivergence',
            confidence: 0.75,
            detectedAt: recentData[i].time,
            description: 'Bullish RSI Divergence - Price lower low, RSI higher low',
            startDate: recentData[j].time,
            endDate: recentData[i].time,
            isBullish: true,
            pricePoints: [
              { date: recentData[j].time, price: prevPrice },
              { date: recentData[i].time, price: currPrice },
            ],
            rsiPoints: [
              { date: recentData[j].time, value: prevRsi },
              { date: recentData[i].time, value: currRsi },
            ],
          });
        }

        // Bearish divergence: price higher high + RSI lower high
        const currHigh = recentData[i].high;
        const prevHigh = recentData[j].high;

        if (currHigh > prevHigh && currRsi < prevRsi && currRsi > 60 && prevRsi > 60) {
          patterns.push({
            type: 'rsiDivergence',
            confidence: 0.75,
            detectedAt: recentData[i].time,
            description: 'Bearish RSI Divergence - Price higher high, RSI lower high',
            startDate: recentData[j].time,
            endDate: recentData[i].time,
            isBullish: false,
            pricePoints: [
              { date: recentData[j].time, price: prevHigh },
              { date: recentData[i].time, price: currHigh },
            ],
            rsiPoints: [
              { date: recentData[j].time, value: prevRsi },
              { date: recentData[i].time, value: currRsi },
            ],
          });
        }
      }
    }
  }

  // Return only the most recent divergence
  return patterns.slice(-1);
}

// ============================================================================
// 5. VOLUME CLIMAX
// ============================================================================

/**
 * Detect volume climaxes (volume > 3× average)
 */
export function detectVolumeClimax(
  data: OHLCVData[],
  lookback: number = 20,
  multiplier: number = 3
): VolumeClimaxPattern[] {
  if (data.length < lookback + 1) return [];

  const patterns: VolumeClimaxPattern[] = [];

  for (let i = lookback; i < data.length; i++) {
    const currentVolume = data[i].volume;

    // Calculate average volume over lookback period
    const avgVolume =
      data.slice(i - lookback, i).reduce((sum, d) => sum + d.volume, 0) / lookback;

    const volumeRatio = currentVolume / avgVolume;

    // Detect climax
    if (volumeRatio >= multiplier) {
      const priceChange = ((data[i].close - data[i].open) / data[i].open) * 100;

      patterns.push({
        type: 'volumeClimax',
        confidence: Math.min(volumeRatio / 5, 1),
        detectedAt: data[i].time,
        description: `Volume Climax - ${volumeRatio.toFixed(1)}× average volume`,
        date: data[i].time,
        volume: currentVolume,
        averageVolume: avgVolume,
        volumeRatio,
        priceChange,
      });
    }
  }

  return patterns;
}

// ============================================================================
// 6. GAP DETECTION
// ============================================================================

/**
 * Detect price gaps (gap up/down > 1%)
 */
export function detectGaps(data: OHLCVData[], minGapPercent: number = 1): GapPattern[] {
  if (data.length < 2) return [];

  const patterns: GapPattern[] = [];

  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];

    // Gap up: current low > previous high
    if (curr.low > prev.high) {
      const gapSize = ((curr.low - prev.high) / prev.high) * 100;

      if (gapSize >= minGapPercent) {
        // Check if gap was filled later
        let isFilled = false;
        let filledDate: string | undefined;

        for (let j = i + 1; j < data.length; j++) {
          if (data[j].low <= prev.high) {
            isFilled = true;
            filledDate = data[j].time;
            break;
          }
        }

        patterns.push({
          type: 'gaps',
          confidence: 0.8,
          detectedAt: curr.time,
          description: `Gap Up ${gapSize.toFixed(1)}%${isFilled ? ' (filled)' : ''}`,
          gapDate: curr.time,
          gapType: 'up',
          gapSize,
          prevHigh: prev.high,
          prevLow: prev.low,
          currHigh: curr.high,
          currLow: curr.low,
          isFilled,
          filledDate,
        });
      }
    }

    // Gap down: current high < previous low
    if (curr.high < prev.low) {
      const gapSize = ((prev.low - curr.high) / prev.low) * 100;

      if (gapSize >= minGapPercent) {
        // Check if gap was filled later
        let isFilled = false;
        let filledDate: string | undefined;

        for (let j = i + 1; j < data.length; j++) {
          if (data[j].high >= prev.low) {
            isFilled = true;
            filledDate = data[j].time;
            break;
          }
        }

        patterns.push({
          type: 'gaps',
          confidence: 0.8,
          detectedAt: curr.time,
          description: `Gap Down ${gapSize.toFixed(1)}%${isFilled ? ' (filled)' : ''}`,
          gapDate: curr.time,
          gapType: 'down',
          gapSize,
          prevHigh: prev.high,
          prevLow: prev.low,
          currHigh: curr.high,
          currLow: curr.low,
          isFilled,
          filledDate,
        });
      }
    }
  }

  return patterns;
}

// ============================================================================
// 7. CONSOLIDATION & BREAKOUT
// ============================================================================

/**
 * Detect consolidation zones and breakouts
 */
export function detectConsolidationBreakout(
  data: OHLCVData[],
  minPeriod: number = 15,
  maxRangePercent: number = 5
): ConsolidationBreakoutPattern[] {
  if (data.length < minPeriod) return [];

  const patterns: ConsolidationBreakoutPattern[] = [];

  // Look for consolidation in recent data (last 30 bars)
  for (let i = minPeriod; i < Math.min(data.length, data.length - 5); i++) {
    const window = data.slice(i - minPeriod, i);

    const highest = Math.max(...window.map((d) => d.high));
    const lowest = Math.min(...window.map((d) => d.low));
    const range = ((highest - lowest) / lowest) * 100;

    // Check if consolidating (tight range)
    if (range <= maxRangePercent) {
      // Check for breakout in next few bars
      let breakoutDate: string | undefined;
      let breakoutDirection: 'up' | 'down' | undefined;
      let breakoutPrice: number | undefined;

      for (let j = i; j < Math.min(i + 10, data.length); j++) {
        if (data[j].close > highest) {
          breakoutDate = data[j].time;
          breakoutDirection = 'up';
          breakoutPrice = data[j].close;
          break;
        }
        if (data[j].close < lowest) {
          breakoutDate = data[j].time;
          breakoutDirection = 'down';
          breakoutPrice = data[j].close;
          break;
        }
      }

      patterns.push({
        type: 'consolidationBreakout',
        confidence: breakoutDirection ? 0.8 : 0.6,
        detectedAt: window[window.length - 1].time,
        description: breakoutDirection
          ? `Breakout ${breakoutDirection} from ${minPeriod}-day consolidation`
          : `Consolidating for ${minPeriod} days (${range.toFixed(1)}% range)`,
        consolidationStart: window[0].time,
        consolidationEnd: window[window.length - 1].time,
        consolidationHigh: highest,
        consolidationLow: lowest,
        consolidationRange: range,
        breakoutDate,
        breakoutDirection,
        breakoutPrice,
      });
    }
  }

  // Return only most recent consolidation
  return patterns.slice(-1);
}

// ============================================================================
// COMBINED DETECTION
// ============================================================================

/**
 * Get adaptive parameters based on time period
 * Longer periods need:
 * - Larger tolerance (price ranges are wider)
 * - Smaller window size (more pivots needed for clustering)
 */
function getAdaptiveParams(period?: string): { tolerance: number; windowSize: number; minTouches: number; minBounce: number; minDaysBetweenTouches: number } {
  const paramMap: Record<string, { tolerance: number; windowSize: number; minTouches: number; minBounce: number; minDaysBetweenTouches: number }> = {
    '1D': { tolerance: 0.008, windowSize: 2, minTouches: 2, minBounce: 1.5, minDaysBetweenTouches: 1 },   // 0.8%, intraday
    '1W': { tolerance: 0.012, windowSize: 3, minTouches: 2, minBounce: 1.2, minDaysBetweenTouches: 2 },   // 1.2%, more permissive for short timeframe
    '1M': { tolerance: 0.015, windowSize: 3, minTouches: 2, minBounce: 1.0, minDaysBetweenTouches: 2 },   // 1.5%, relaxed for short timeframe - only ~20-30 bars
    '3M': { tolerance: 0.010, windowSize: 4, minTouches: 2, minBounce: 1.8, minDaysBetweenTouches: 5 },   // Tightened to 1.0%
    '6M': { tolerance: 0.010, windowSize: 4, minTouches: 3, minBounce: 2.0, minDaysBetweenTouches: 7 },   // Tightened to 1.0%, 2% bounce
    '1Y': { tolerance: 0.012, windowSize: 5, minTouches: 3, minBounce: 2.0, minDaysBetweenTouches: 10 },  // 1.2%, 2% bounce
    '5Y': { tolerance: 0.015, windowSize: 5, minTouches: 3, minBounce: 2.5, minDaysBetweenTouches: 15 },  // 1.5%, 2.5% bounce
    'MAX': { tolerance: 0.015, windowSize: 5, minTouches: 3, minBounce: 2.5, minDaysBetweenTouches: 15 }, // 1.5%, 2.5% bounce
  };

  return paramMap[period || '1D'] || { tolerance: 0.010, windowSize: 4, minTouches: 2, minBounce: 1.5, minDaysBetweenTouches: 5 }; // Default
}

/**
 * Run all pattern detection algorithms with period-aware parameters
 */
export function detectAllPatterns(
  data: OHLCVData[],
  period?: string
): Record<PatternType, PatternAnnotation[]> {
  try {
    console.log('[Pattern Detection] Starting detectAllPatterns for period:', period, 'with', data?.length, 'data points');

    // Validate inputs
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('[Pattern Detection] Invalid data, returning empty patterns');
      return {
        supportResistance: [],
        trendChannel: [],
        maCrossover: [],
        rsiDivergence: [],
        volumeClimax: [],
        gaps: [],
        consolidationBreakout: [],
      };
    }

    const { tolerance, windowSize, minTouches, minBounce, minDaysBetweenTouches } = getAdaptiveParams(period);
    console.log('[Pattern Detection] Using params:', { tolerance, windowSize, minTouches, minBounce, minDaysBetweenTouches });

    console.log('[Pattern Detection] Calling detectSupportResistance...');
    const supportResistance = detectSupportResistance(data, windowSize, tolerance, minTouches, minBounce, minDaysBetweenTouches);
    console.log('[Pattern Detection] SR done, got', supportResistance.length, 'patterns');

    const result = {
      supportResistance: supportResistance,
      trendChannel: [], // detectTrendChannel(data),
      maCrossover: [], // detectMACrossover(data),
      rsiDivergence: [], // detectRSIDivergence(data),
      volumeClimax: [], // detectVolumeClimax(data),
      gaps: [], // detectGaps(data),
      consolidationBreakout: [], // detectConsolidationBreakout(data),
    };

    console.log('[Pattern Detection] All patterns detected successfully');
    return result;
  } catch (error) {
    console.error('Error in detectAllPatterns:', error);
    return {
      supportResistance: [],
      trendChannel: [],
      maCrossover: [],
      rsiDivergence: [],
      volumeClimax: [],
      gaps: [],
      consolidationBreakout: [],
    };
  }
}

// ============================================================================
// TIMEFRAME CONFLUENCE DETECTION
// ============================================================================

export interface TimeframeConfluence {
  level: number;
  timeframes: string[]; // e.g., ['1M', '3M', '1Y']
  patterns: SupportResistancePattern[];
  confluenceScore: number; // 0-1 (number of timeframes / 3)
  isSupport: boolean;
}

/**
 * Detect when the same level appears across multiple timeframes
 * This adds significant weight to level strength
 */
export function detectTimeframeConfluence(
  patterns1M: SupportResistancePattern[],
  patterns3M: SupportResistancePattern[],
  patterns1Y: SupportResistancePattern[],
  tolerance: number = 0.015 // 1.5% tolerance for confluence
): TimeframeConfluence[] {
  const confluences: TimeframeConfluence[] = [];

  // Start with 1Y patterns (longest timeframe = most significant)
  patterns1Y.forEach((p1Y) => {
    const matching3M = patterns3M.find(
      (p) =>
        p.isSupport === p1Y.isSupport && // Same type (support/resistance)
        Math.abs(p.level - p1Y.level) / p1Y.level < tolerance // Within tolerance
    );

    const matching1M = patterns1M.find(
      (p) =>
        p.isSupport === p1Y.isSupport &&
        Math.abs(p.level - p1Y.level) / p1Y.level < tolerance
    );

    const timeframes: string[] = ['1Y'];
    const matchedPatterns: SupportResistancePattern[] = [p1Y];

    if (matching3M) {
      timeframes.push('3M');
      matchedPatterns.push(matching3M);
    }

    if (matching1M) {
      timeframes.push('1M');
      matchedPatterns.push(matching1M);
    }

    // Only create confluence if level appears in 2+ timeframes
    if (timeframes.length >= 2) {
      confluences.push({
        level: p1Y.level,
        timeframes,
        patterns: matchedPatterns,
        confluenceScore: timeframes.length / 3, // Max score = 1.0 (all 3 timeframes)
        isSupport: p1Y.isSupport,
      });
    }
  });

  return confluences;
}

/**
 * Mark patterns with timeframe confluence
 * Updates the hasTimeframeConfluence field for matching patterns
 */
export function markPatternsWithConfluence(
  patterns: SupportResistancePattern[],
  confluences: TimeframeConfluence[]
): SupportResistancePattern[] {
  return patterns.map((pattern) => {
    // Check if this pattern is part of any confluence
    const confluence = confluences.find((conf) =>
      conf.patterns.some((p) => Math.abs(p.level - pattern.level) / pattern.level < 0.001) // 0.1% match
    );

    if (confluence) {
      // Recalculate strength with confluence bonus
      const hasTimeframeConfluence = true;
      const newStrength = classifyLevelStrength(
        pattern.touchCount,
        pattern.averageBounceStrength,
        pattern.recencyWeight,
        hasTimeframeConfluence
      );

      // Recalculate confidence with confluence boost
      const confluenceBonus = confluence.confluenceScore * 0.15; // Up to 15% boost
      const newConfidence = Math.min(pattern.confidence + confluenceBonus, 1);

      return {
        ...pattern,
        strength: newStrength,
        confidence: newConfidence,
      };
    }

    return pattern;
  });
}

// Helper function to classify level strength (now defined at top of file)

// ============================================================================
// PROXIMITY DETECTION
// ============================================================================

export interface ProximityAlert {
  type: 'support' | 'resistance';
  level: number;
  distance: number; // % distance from current price
  pattern: SupportResistancePattern;
}

/**
 * Check if current price is near any support/resistance levels
 * Returns alerts for levels within 2% of current price
 */
export function detectProximityAlerts(
  currentPrice: number,
  patterns: SupportResistancePattern[],
  threshold: number = 0.02 // 2% threshold
): ProximityAlert[] {
  const alerts: ProximityAlert[] = [];

  patterns.forEach((pattern) => {
    const distance = Math.abs(currentPrice - pattern.level) / currentPrice;

    if (distance <= threshold) {
      alerts.push({
        type: pattern.isSupport ? 'support' : 'resistance',
        level: pattern.level,
        distance: distance * 100, // Convert to percentage
        pattern,
      });
    }
  });

  // Sort by distance (closest first)
  return alerts.sort((a, b) => a.distance - b.distance);
}
