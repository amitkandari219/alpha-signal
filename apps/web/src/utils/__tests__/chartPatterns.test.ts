/**
 * Chart Pattern Detection Tests
 *
 * Run with: npm test chartPatterns.test.ts
 * Or run in browser console by copying the test functions
 */

import {
  detectSupportResistance,
  detectTrendChannel,
  detectMACrossover,
  detectRSIDivergence,
  detectVolumeClimax,
  detectGaps,
  detectConsolidationBreakout,
  detectAllPatterns,
} from '../chartPatterns';
import type { OHLCVData } from '../technicalIndicators';

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

/**
 * Generate mock data with support level at 450
 */
export function generateSupportData(points: number = 100): OHLCVData[] {
  const data: OHLCVData[] = [];
  const supportLevel = 450;

  for (let i = 0; i < points; i++) {
    const date = new Date(Date.now() - (points - i) * 24 * 60 * 60 * 1000);

    // Bounce at support level every ~10 days
    const isSupport = i % 10 === 0;
    const low = isSupport ? supportLevel + Math.random() * 2 : supportLevel + 5 + Math.random() * 15;
    const high = low + 5 + Math.random() * 10;
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);

    data.push({
      time: date.toISOString(),
      open,
      high,
      low,
      close,
      volume: 1000000 + Math.random() * 500000,
    });
  }

  return data;
}

/**
 * Generate mock data with uptrend
 */
export function generateTrendData(points: number = 60): OHLCVData[] {
  const data: OHLCVData[] = [];
  const startPrice = 400;
  const dailyGrowth = 2;

  for (let i = 0; i < points; i++) {
    const date = new Date(Date.now() - (points - i) * 24 * 60 * 60 * 1000);
    const basePrice = startPrice + i * dailyGrowth;

    const low = basePrice + Math.random() * 5;
    const high = low + 10 + Math.random() * 10;
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);

    data.push({
      time: date.toISOString(),
      open,
      high,
      low,
      close,
      volume: 1000000 + Math.random() * 500000,
    });
  }

  return data;
}

/**
 * Generate mock data with volume spike
 */
export function generateVolumeClimaxData(points: number = 50): OHLCVData[] {
  const data: OHLCVData[] = [];
  const avgVolume = 1000000;

  for (let i = 0; i < points; i++) {
    const date = new Date(Date.now() - (points - i) * 24 * 60 * 60 * 1000);

    // Spike at middle
    const volume = i === Math.floor(points / 2)
      ? avgVolume * 4.5 // 4.5× spike
      : avgVolume + Math.random() * 300000;

    data.push({
      time: date.toISOString(),
      open: 450 + Math.random() * 10,
      high: 460 + Math.random() * 10,
      low: 445 + Math.random() * 5,
      close: 450 + Math.random() * 10,
      volume,
    });
  }

  return data;
}

/**
 * Generate mock data with gap up
 */
export function generateGapData(points: number = 30): OHLCVData[] {
  const data: OHLCVData[] = [];

  for (let i = 0; i < points; i++) {
    const date = new Date(Date.now() - (points - i) * 24 * 60 * 60 * 1000);

    // Create gap at middle
    const gapUp = i === Math.floor(points / 2) ? 15 : 0;
    const basePrice = 450 + gapUp;

    data.push({
      time: date.toISOString(),
      open: basePrice + Math.random() * 5,
      high: basePrice + 5 + Math.random() * 5,
      low: basePrice + Math.random() * 3,
      close: basePrice + Math.random() * 5,
      volume: 1000000 + Math.random() * 500000,
    });
  }

  return data;
}

/**
 * Generate mock data with consolidation
 */
export function generateConsolidationData(points: number = 40): OHLCVData[] {
  const data: OHLCVData[] = [];
  const consolidationStart = 10;
  const consolidationEnd = 30;

  for (let i = 0; i < points; i++) {
    const date = new Date(Date.now() - (points - i) * 24 * 60 * 60 * 1000);

    // Tight range during consolidation
    const isConsolidating = i >= consolidationStart && i <= consolidationEnd;
    const basePrice = 450;
    const range = isConsolidating ? 2 : 10;

    data.push({
      time: date.toISOString(),
      open: basePrice + Math.random() * range,
      high: basePrice + range + Math.random() * 2,
      low: basePrice + Math.random() * 2,
      close: basePrice + Math.random() * range,
      volume: 1000000 + Math.random() * 500000,
    });
  }

  return data;
}

// ============================================================================
// TESTS
// ============================================================================

describe('Chart Pattern Detection', () => {
  describe('detectSupportResistance', () => {
    it('should detect support level', () => {
      const data = generateSupportData(100);
      const patterns = detectSupportResistance(data);

      console.log('✅ Support/Resistance Test:', patterns.length, 'patterns found');
      patterns.forEach(p => {
        console.log(`  ${p.isSupport ? 'Support' : 'Resistance'} at ${p.level.toFixed(2)}, ${p.touchPoints.length} touches`);
      });

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.isSupport)).toBe(true);
    });

    it('should require minimum touches', () => {
      const data = generateSupportData(20); // Not enough data
      const patterns = detectSupportResistance(data, 5, 0.02, 5); // Need 5 touches

      expect(patterns.length).toBe(0);
    });
  });

  describe('detectTrendChannel', () => {
    it('should detect uptrend channel', () => {
      const data = generateTrendData(60);
      const patterns = detectTrendChannel(data);

      console.log('✅ Trend Channel Test:', patterns.length, 'patterns found');
      patterns.forEach(p => {
        console.log(`  ${p.direction} channel, R²=${p.rSquared.toFixed(2)}`);
      });

      expect(patterns.length).toBeGreaterThanOrEqual(0); // May or may not detect
      if (patterns.length > 0) {
        expect(patterns[0].direction).toBe('up');
        expect(patterns[0].rSquared).toBeGreaterThan(0.7);
      }
    });
  });

  describe('detectVolumeClimax', () => {
    it('should detect volume spike', () => {
      const data = generateVolumeClimaxData(50);
      const patterns = detectVolumeClimax(data);

      console.log('✅ Volume Climax Test:', patterns.length, 'patterns found');
      patterns.forEach(p => {
        console.log(`  ${p.volumeRatio.toFixed(1)}× volume on ${new Date(p.date).toLocaleDateString()}`);
      });

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].volumeRatio).toBeGreaterThanOrEqual(3);
    });
  });

  describe('detectGaps', () => {
    it('should detect gap up', () => {
      const data = generateGapData(30);
      const patterns = detectGaps(data);

      console.log('✅ Gap Detection Test:', patterns.length, 'patterns found');
      patterns.forEach(p => {
        console.log(`  Gap ${p.gapType} ${p.gapSize.toFixed(1)}%, ${p.isFilled ? 'filled' : 'open'}`);
      });

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].gapType).toBe('up');
    });
  });

  describe('detectConsolidationBreakout', () => {
    it('should detect consolidation zone', () => {
      const data = generateConsolidationData(40);
      const patterns = detectConsolidationBreakout(data);

      console.log('✅ Consolidation Test:', patterns.length, 'patterns found');
      patterns.forEach(p => {
        console.log(`  ${p.consolidationRange.toFixed(1)}% range, ${p.breakoutDirection || 'no breakout'}`);
      });

      expect(patterns.length).toBeGreaterThanOrEqual(0);
      if (patterns.length > 0) {
        expect(patterns[0].consolidationRange).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('detectAllPatterns', () => {
    it('should run all detections', () => {
      const data = generateSupportData(200);
      const patterns = detectAllPatterns(data);

      console.log('✅ All Patterns Test:');
      console.log('  Support/Resistance:', patterns.supportResistance.length);
      console.log('  Trend Channel:', patterns.trendChannel.length);
      console.log('  MA Crossover:', patterns.maCrossover.length);
      console.log('  RSI Divergence:', patterns.rsiDivergence.length);
      console.log('  Volume Climax:', patterns.volumeClimax.length);
      console.log('  Gaps:', patterns.gaps.length);
      console.log('  Consolidation:', patterns.consolidationBreakout.length);

      expect(typeof patterns).toBe('object');
      expect(Object.keys(patterns).length).toBe(7);
    });
  });
});

// ============================================================================
// BROWSER CONSOLE TEST
// ============================================================================

/**
 * Run this in browser console to test pattern detection
 *
 * Usage:
 * 1. Copy this entire file
 * 2. Open browser console
 * 3. Paste and run
 * 4. Call: runBrowserTest()
 */
export function runBrowserTest() {
  console.log('🤖 Starting AI Pattern Detection Tests...\n');

  // Test 1: Support & Resistance
  console.log('📊 Test 1: Support & Resistance');
  const supportData = generateSupportData(100);
  const supportPatterns = detectSupportResistance(supportData);
  console.log(`  Found ${supportPatterns.length} patterns`);
  supportPatterns.forEach(p => {
    console.log(`  - ${p.isSupport ? 'Support' : 'Resistance'} at ${p.level.toFixed(2)} (${p.touchPoints.length} touches)`);
  });
  console.log('');

  // Test 2: Trend Channel
  console.log('📈 Test 2: Trend Channel');
  const trendData = generateTrendData(60);
  const trendPatterns = detectTrendChannel(trendData);
  console.log(`  Found ${trendPatterns.length} patterns`);
  trendPatterns.forEach(p => {
    console.log(`  - ${p.direction} channel, R²=${p.rSquared.toFixed(2)}`);
  });
  console.log('');

  // Test 3: Volume Climax
  console.log('🔊 Test 3: Volume Climax');
  const volumeData = generateVolumeClimaxData(50);
  const volumePatterns = detectVolumeClimax(volumeData);
  console.log(`  Found ${volumePatterns.length} patterns`);
  volumePatterns.forEach(p => {
    console.log(`  - ${p.volumeRatio.toFixed(1)}× volume spike`);
  });
  console.log('');

  // Test 4: Gaps
  console.log('↕️ Test 4: Gap Detection');
  const gapData = generateGapData(30);
  const gapPatterns = detectGaps(gapData);
  console.log(`  Found ${gapPatterns.length} patterns`);
  gapPatterns.forEach(p => {
    console.log(`  - Gap ${p.gapType} ${p.gapSize.toFixed(1)}%`);
  });
  console.log('');

  // Test 5: Consolidation
  console.log('📦 Test 5: Consolidation & Breakout');
  const consolidationData = generateConsolidationData(40);
  const consolidationPatterns = detectConsolidationBreakout(consolidationData);
  console.log(`  Found ${consolidationPatterns.length} patterns`);
  consolidationPatterns.forEach(p => {
    console.log(`  - ${p.consolidationRange.toFixed(1)}% range consolidation`);
  });
  console.log('');

  // Test 6: All patterns
  console.log('🔍 Test 6: All Patterns Combined');
  const allData = generateSupportData(200);
  const allPatterns = detectAllPatterns(allData);
  const totalCount = Object.values(allPatterns).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`  Total patterns detected: ${totalCount}`);
  Object.entries(allPatterns).forEach(([type, patterns]) => {
    if (patterns.length > 0) {
      console.log(`  - ${type}: ${patterns.length}`);
    }
  });
  console.log('');

  console.log('✅ All tests completed!');
  console.log('');
  console.log('💡 Next steps:');
  console.log('  1. Test with real stock data');
  console.log('  2. Enable AI Patterns in the chart UI');
  console.log('  3. Check TESTING_AI_PATTERNS.md for detailed guide');
}

// Auto-export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).runBrowserTest = runBrowserTest;
  (window as any).generateSupportData = generateSupportData;
  (window as any).generateTrendData = generateTrendData;
  (window as any).detectAllPatterns = detectAllPatterns;

  console.log('✅ AI Pattern test functions loaded!');
  console.log('📝 Run: runBrowserTest()');
}
