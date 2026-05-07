/**
 * Chart Helper Utilities
 *
 * Heikin-Ashi, volume metrics, and price normalization
 */

import { OHLCVData } from './technicalIndicators';

// ============================================================================
// HEIKIN-ASHI TRANSFORMATION
// ============================================================================

/**
 * Convert standard OHLC candlesticks to Heikin-Ashi
 *
 * Heikin-Ashi smooths price data to identify trends more clearly
 * Formula:
 * - HA Close = (Open + High + Low + Close) / 4
 * - HA Open = (Previous HA Open + Previous HA Close) / 2
 * - HA High = Max(High, HA Open, HA Close)
 * - HA Low = Min(Low, HA Open, HA Close)
 */
export function convertToHeikinAshi(data: OHLCVData[]): OHLCVData[] {
  if (data.length === 0) return [];

  const haData: OHLCVData[] = [];

  // First candle
  const firstCandle = data[0];
  const haClose = (firstCandle.open + firstCandle.high + firstCandle.low + firstCandle.close) / 4;
  const haOpen = (firstCandle.open + firstCandle.close) / 2;
  const haHigh = Math.max(firstCandle.high, haOpen, haClose);
  const haLow = Math.min(firstCandle.low, haOpen, haClose);

  haData.push({
    time: firstCandle.time,
    open: parseFloat(haOpen.toFixed(2)),
    high: parseFloat(haHigh.toFixed(2)),
    low: parseFloat(haLow.toFixed(2)),
    close: parseFloat(haClose.toFixed(2)),
    volume: firstCandle.volume,
  });

  // Remaining candles
  for (let i = 1; i < data.length; i++) {
    const candle = data[i];
    const prevHA = haData[i - 1];

    const haClose = (candle.open + candle.high + candle.low + candle.close) / 4;
    const haOpen = (prevHA.open + prevHA.close) / 2;
    const haHigh = Math.max(candle.high, haOpen, haClose);
    const haLow = Math.min(candle.low, haOpen, haClose);

    haData.push({
      time: candle.time,
      open: parseFloat(haOpen.toFixed(2)),
      high: parseFloat(haHigh.toFixed(2)),
      low: parseFloat(haLow.toFixed(2)),
      close: parseFloat(haClose.toFixed(2)),
      volume: candle.volume,
    });
  }

  return haData;
}

// ============================================================================
// VOLUME METRICS
// ============================================================================

export interface VolumeMetrics {
  average: Array<{ time: string; value: number }>;
  spikes: Array<{ time: string; multiplier: number }>;
  isAboveAverage: boolean[];
}

/**
 * Calculate volume moving average and detect spikes
 */
export function calculateVolumeMetrics(
  data: OHLCVData[],
  period: number = 20
): VolumeMetrics {
  if (data.length < period) {
    return { average: [], spikes: [], isAboveAverage: [] };
  }

  const average: Array<{ time: string; value: number }> = [];
  const spikes: Array<{ time: string; multiplier: number }> = [];
  const isAboveAverage: boolean[] = [];

  // Calculate moving average
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].volume;
    }
    const avg = sum / period;

    average.push({
      time: data[i].time,
      value: Math.round(avg),
    });

    // Detect spikes (volume > 2x average)
    const currentVolume = data[i].volume;
    const multiplier = avg > 0 ? currentVolume / avg : 1;

    if (multiplier >= 2) {
      spikes.push({
        time: data[i].time,
        multiplier: parseFloat(multiplier.toFixed(2)),
      });
    }

    isAboveAverage.push(currentVolume > avg);
  }

  return { average, spikes, isAboveAverage };
}

// ============================================================================
// PRICE NORMALIZATION FOR COMPARISON
// ============================================================================

/**
 * Normalize price series to percentage return from start
 *
 * Useful for comparing multiple stocks on the same chart
 * Formula: ((Current Price - Start Price) / Start Price) * 100
 */
export function normalizeToPercentReturn(
  data: OHLCVData[]
): Array<{ time: string; value: number }> {
  if (data.length === 0) return [];

  const startPrice = data[0].close;
  const normalized: Array<{ time: string; value: number }> = [];

  for (const candle of data) {
    const percentReturn = ((candle.close - startPrice) / startPrice) * 100;
    normalized.push({
      time: candle.time,
      value: parseFloat(percentReturn.toFixed(2)),
    });
  }

  return normalized;
}

/**
 * Normalize multiple series to start at the same baseline (100)
 */
export function normalizeToBaselineIndex(
  data: OHLCVData[],
  baseline: number = 100
): Array<{ time: string; value: number }> {
  if (data.length === 0) return [];

  const startPrice = data[0].close;
  const normalized: Array<{ time: string; value: number }> = [];

  for (const candle of data) {
    const indexValue = (candle.close / startPrice) * baseline;
    normalized.push({
      time: candle.time,
      value: parseFloat(indexValue.toFixed(2)),
    });
  }

  return normalized;
}

// ============================================================================
// DATA SAMPLING FOR PERFORMANCE
// ============================================================================

/**
 * Sample data points when dataset is too large
 *
 * Uses max-min sampling to preserve peaks and troughs
 */
export function sampleOHLCVData(
  data: OHLCVData[],
  maxPoints: number = 1000
): OHLCVData[] {
  if (data.length <= maxPoints) return data;

  const sampledData: OHLCVData[] = [];
  const bucketSize = Math.ceil(data.length / maxPoints);

  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, Math.min(i + bucketSize, data.length));

    if (bucket.length === 1) {
      sampledData.push(bucket[0]);
    } else {
      // For each bucket, keep the candle with max high and min low
      let maxCandle = bucket[0];
      let minCandle = bucket[0];

      for (const candle of bucket) {
        if (candle.high > maxCandle.high) maxCandle = candle;
        if (candle.low < minCandle.low) minCandle = candle;
      }

      // Add in chronological order
      if (maxCandle.time < minCandle.time) {
        sampledData.push(maxCandle);
        if (maxCandle.time !== minCandle.time) {
          sampledData.push(minCandle);
        }
      } else {
        sampledData.push(minCandle);
        if (maxCandle.time !== minCandle.time) {
          sampledData.push(maxCandle);
        }
      }
    }
  }

  return sampledData;
}

// ============================================================================
// CHART FORMATTING HELPERS
// ============================================================================

/**
 * Format volume for display (e.g., 1.2M, 45.3K)
 */
export function formatVolume(volume: number): string {
  if (volume >= 10000000) {
    return `${(volume / 10000000).toFixed(2)}Cr`; // Crores
  } else if (volume >= 100000) {
    return `${(volume / 100000).toFixed(2)}L`; // Lakhs
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`; // Thousands
  }
  return volume.toString();
}

/**
 * Format price for display (Indian rupee notation)
 */
export function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format percentage with sign
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

// ============================================================================
// COLOR HELPERS
// ============================================================================

/**
 * Get color based on candle direction
 */
export function getCandleColor(open: number, close: number): {
  bodyColor: string;
  borderColor: string;
  wickColor: string;
} {
  const isUp = close >= open;

  return {
    bodyColor: isUp ? '#26A69A' : '#EF5350',
    borderColor: isUp ? '#26A69A' : '#EF5350',
    wickColor: isUp ? '#26A69A' : '#EF5350',
  };
}

/**
 * Get color for volume bar (based on price direction)
 */
export function getVolumeColor(open: number, close: number, alpha: number = 0.6): string {
  const isUp = close >= open;
  return isUp ? `rgba(38, 166, 154, ${alpha})` : `rgba(239, 83, 80, ${alpha})`;
}

/**
 * MA line colors (matching design spec)
 */
export const MA_COLORS = {
  sma20: '#58A6FF', // accent-blue
  sma50: '#D29922', // signal-yellow
  sma100: '#A371F7', // signal-purple
  sma200: '#F85149', // signal-red
  ema20: '#3FB950', // signal-green
  vwap: '#8B949E', // text-secondary
  bb: '#58A6FF', // accent-blue (same as SMA 20)
};

/**
 * Indicator colors for comparison overlays
 */
export const COMPARISON_COLORS = ['#D29922', '#A371F7', '#3FB950'];

// ============================================================================
// TIME RANGE HELPERS
// ============================================================================

/**
 * Filter data by time range
 */
export function filterDataByRange(
  data: OHLCVData[],
  range: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | 'MAX'
): OHLCVData[] {
  if (range === 'MAX' || data.length === 0) return data;

  const now = new Date();
  let startDate: Date;

  switch (range) {
    case '1D':
      startDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      break;
    case '1W':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '1M':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3M':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '6M':
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case '1Y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case '3Y':
      startDate = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return data;
  }

  return data.filter((candle) => new Date(candle.time) >= startDate);
}

/**
 * Determine default chart type based on time range
 */
export function getDefaultChartType(
  range: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | 'MAX'
): 'line' | 'candle' | 'area' | 'heikinAshi' {
  // Use candlestick for short periods, line for long periods
  if (range === '1D' || range === '1W' || range === '1M' || range === '3M' || range === '6M') {
    return 'candle';
  }
  return 'line';
}

// ============================================================================
// COMPARISON DATA GENERATION (Mock)
// ============================================================================

/**
 * Generate mock comparison data for indices and stocks
 *
 * Creates realistic random walk price data for comparison overlays
 */
export function generateComparisonData(
  symbol: string,
  startDate: string,
  endDate: string,
  mainStockData: OHLCVData[]
): OHLCVData[] {
  // Use mainStockData as template for time series
  if (!mainStockData || mainStockData.length === 0) return [];

  // Seed for deterministic randomness per symbol
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let random = seed;
  const seededRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };

  // Starting price and volatility based on symbol type
  let startPrice = 1000;
  let dailyVolatilityPct = 1.0; // ±1% default

  if (symbol.includes('NIFTY50')) {
    startPrice = 22000;
    dailyVolatilityPct = 0.8;
  } else if (symbol.includes('NIFTYMIDCAP')) {
    startPrice = 45000;
    dailyVolatilityPct = 1.2;
  } else if (symbol.includes('NIFTYSMALLCAP')) {
    startPrice = 15000;
    dailyVolatilityPct = 1.5;
  } else if (symbol.includes('NIFTYBANK')) {
    startPrice = 48000;
    dailyVolatilityPct = 1.1;
  } else if (symbol.includes('NIFTYIT')) {
    startPrice = 35000;
    dailyVolatilityPct = 1.3;
  } else if (symbol.includes('NIFTYPHARMA')) {
    startPrice = 18000;
    dailyVolatilityPct = 1.0;
  } else if (symbol.includes('NIFTY')) {
    // Other sector indices
    startPrice = 25000;
    dailyVolatilityPct = 1.0;
  } else {
    // Individual stocks - use symbol hash to vary
    startPrice = 500 + (seed % 2000);
    dailyVolatilityPct = 0.8 + (seededRandom() * 1.2);
  }

  const comparisonData: OHLCVData[] = [];
  let currentPrice = startPrice;

  for (const candle of mainStockData) {
    // Random walk with trend
    const trendBias = 0.05; // Slight upward bias
    const randomChange = (seededRandom() - 0.5 + trendBias) * 2 * dailyVolatilityPct;
    const changePercent = randomChange / 100;

    // Calculate OHLCV
    const open = currentPrice;
    const priceChange = currentPrice * changePercent;
    const close = currentPrice + priceChange;

    // Intraday high/low
    const intradayVolatility = Math.abs(priceChange) * (1 + seededRandom());
    const high = Math.max(open, close) + intradayVolatility * seededRandom();
    const low = Math.min(open, close) - intradayVolatility * seededRandom();

    // Volume (based on main stock's volume pattern)
    const volume = candle.volume * (0.8 + seededRandom() * 0.4);

    comparisonData.push({
      time: candle.time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.round(volume),
    });

    // Update current price for next iteration
    currentPrice = close;

    // Mean reversion (prevent prices from going too low or too high)
    if (currentPrice < startPrice * 0.5) {
      currentPrice = startPrice * 0.5;
    } else if (currentPrice > startPrice * 2.5) {
      currentPrice = startPrice * 2.5;
    }
  }

  return comparisonData;
}
