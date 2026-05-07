/**
 * Technical Indicator Calculations for Stock Charts
 *
 * Client-side implementations of common technical indicators
 * Patterns inspired by apps/analytics/src/engines/technical_analysis.py
 */

export interface OHLCVData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorDataPoint {
  time: string;
  value: number;
}

// ============================================================================
// MOVING AVERAGES
// ============================================================================

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(
  data: OHLCVData[],
  period: number
): IndicatorDataPoint[] {
  if (data.length < period) return [];

  const result: IndicatorDataPoint[] = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const average = sum / period;

    result.push({
      time: data[i].time,
      value: parseFloat(average.toFixed(2)),
    });
  }

  return result;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(
  data: OHLCVData[],
  period: number
): IndicatorDataPoint[] {
  if (data.length < period) return [];

  const result: IndicatorDataPoint[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for first value
  let ema = 0;
  for (let i = 0; i < period; i++) {
    ema += data[i].close;
  }
  ema = ema / period;

  result.push({
    time: data[period - 1].time,
    value: parseFloat(ema.toFixed(2)),
  });

  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({
      time: data[i].time,
      value: parseFloat(ema.toFixed(2)),
    });
  }

  return result;
}

/**
 * Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(data: OHLCVData[]): IndicatorDataPoint[] {
  if (data.length === 0) return [];

  const result: IndicatorDataPoint[] = [];
  let cumulativeTPV = 0; // Typical Price * Volume
  let cumulativeVolume = 0;

  for (let i = 0; i < data.length; i++) {
    const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
    cumulativeTPV += typicalPrice * data[i].volume;
    cumulativeVolume += data[i].volume;

    const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0;

    result.push({
      time: data[i].time,
      value: parseFloat(vwap.toFixed(2)),
    });
  }

  return result;
}

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(
  data: OHLCVData[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: IndicatorDataPoint[];
  middle: IndicatorDataPoint[];
  lower: IndicatorDataPoint[];
} {
  if (data.length < period) {
    return { upper: [], middle: [], lower: [] };
  }

  const middle = calculateSMA(data, period);
  const upper: IndicatorDataPoint[] = [];
  const lower: IndicatorDataPoint[] = [];

  for (let i = period - 1; i < data.length; i++) {
    // Calculate standard deviation
    const sma = middle[i - period + 1].value;
    let sumSquaredDiff = 0;

    for (let j = 0; j < period; j++) {
      const diff = data[i - j].close - sma;
      sumSquaredDiff += diff * diff;
    }

    const variance = sumSquaredDiff / period;
    const standardDeviation = Math.sqrt(variance);

    upper.push({
      time: data[i].time,
      value: parseFloat((sma + stdDev * standardDeviation).toFixed(2)),
    });

    lower.push({
      time: data[i].time,
      value: parseFloat((sma - stdDev * standardDeviation).toFixed(2)),
    });
  }

  return { upper, middle, lower };
}

// ============================================================================
// MOMENTUM OSCILLATORS
// ============================================================================

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(
  data: OHLCVData[],
  period: number = 14
): IndicatorDataPoint[] {
  if (data.length < period + 1) return [];

  const result: IndicatorDataPoint[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // Calculate RSI for first period
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  result.push({
    time: data[period].time,
    value: parseFloat(rsi.toFixed(2)),
  });

  // Calculate RSI for remaining values (smoothed)
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    let gain = 0;
    let loss = 0;

    if (change > 0) {
      gain = change;
    } else {
      loss = Math.abs(change);
    }

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const newRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const newRsi = 100 - 100 / (1 + newRs);

    result.push({
      time: data[i].time,
      value: parseFloat(newRsi.toFixed(2)),
    });
  }

  return result;
}

/**
 * Moving Average Convergence Divergence (MACD)
 */
export function calculateMACD(
  data: OHLCVData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: IndicatorDataPoint[];
  signal: IndicatorDataPoint[];
  histogram: IndicatorDataPoint[];
} {
  if (data.length < slowPeriod) {
    return { macd: [], signal: [], histogram: [] };
  }

  // Calculate fast and slow EMAs
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // Calculate MACD line (fast EMA - slow EMA)
  const macdLine: IndicatorDataPoint[] = [];
  const startIndex = slowPeriod - fastPeriod;

  for (let i = 0; i < slowEMA.length; i++) {
    const fastValue = fastEMA[i + startIndex].value;
    const slowValue = slowEMA[i].value;

    macdLine.push({
      time: slowEMA[i].time,
      value: parseFloat((fastValue - slowValue).toFixed(2)),
    });
  }

  // Calculate signal line (EMA of MACD line)
  if (macdLine.length < signalPeriod) {
    return { macd: macdLine, signal: [], histogram: [] };
  }

  const signalLine: IndicatorDataPoint[] = [];
  const multiplier = 2 / (signalPeriod + 1);

  // Start with SMA for first signal value
  let signalEMA = 0;
  for (let i = 0; i < signalPeriod; i++) {
    signalEMA += macdLine[i].value;
  }
  signalEMA = signalEMA / signalPeriod;

  signalLine.push({
    time: macdLine[signalPeriod - 1].time,
    value: parseFloat(signalEMA.toFixed(2)),
  });

  // Calculate signal EMA for remaining values
  for (let i = signalPeriod; i < macdLine.length; i++) {
    signalEMA = (macdLine[i].value - signalEMA) * multiplier + signalEMA;
    signalLine.push({
      time: macdLine[i].time,
      value: parseFloat(signalEMA.toFixed(2)),
    });
  }

  // Calculate histogram (MACD - Signal)
  const histogram: IndicatorDataPoint[] = [];
  const histogramStartIndex = signalPeriod - 1;

  for (let i = 0; i < signalLine.length; i++) {
    const macdValue = macdLine[i + histogramStartIndex].value;
    const signalValue = signalLine[i].value;

    histogram.push({
      time: signalLine[i].time,
      value: parseFloat((macdValue - signalValue).toFixed(2)),
    });
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

/**
 * Stochastic Oscillator
 */
export function calculateStochastic(
  data: OHLCVData[],
  kPeriod: number = 14,
  dPeriod: number = 3
): {
  k: IndicatorDataPoint[];
  d: IndicatorDataPoint[];
} {
  if (data.length < kPeriod) {
    return { k: [], d: [] };
  }

  const kLine: IndicatorDataPoint[] = [];

  // Calculate %K
  for (let i = kPeriod - 1; i < data.length; i++) {
    let lowestLow = Infinity;
    let highestHigh = -Infinity;

    for (let j = 0; j < kPeriod; j++) {
      const index = i - j;
      lowestLow = Math.min(lowestLow, data[index].low);
      highestHigh = Math.max(highestHigh, data[index].high);
    }

    const currentClose = data[i].close;
    const range = highestHigh - lowestLow;
    const kValue = range === 0 ? 50 : ((currentClose - lowestLow) / range) * 100;

    kLine.push({
      time: data[i].time,
      value: parseFloat(kValue.toFixed(2)),
    });
  }

  // Calculate %D (SMA of %K)
  if (kLine.length < dPeriod) {
    return { k: kLine, d: [] };
  }

  const dLine: IndicatorDataPoint[] = [];

  for (let i = dPeriod - 1; i < kLine.length; i++) {
    let sum = 0;
    for (let j = 0; j < dPeriod; j++) {
      sum += kLine[i - j].value;
    }
    const average = sum / dPeriod;

    dLine.push({
      time: kLine[i].time,
      value: parseFloat(average.toFixed(2)),
    });
  }

  return { k: kLine, d: dLine };
}

// ============================================================================
// TREND INDICATORS
// ============================================================================

/**
 * Average Directional Index (ADX)
 * Simplified version - measures trend strength
 */
export function calculateADX(
  data: OHLCVData[],
  period: number = 14
): IndicatorDataPoint[] {
  if (data.length < period + 1) return [];

  const result: IndicatorDataPoint[] = [];
  const trueRanges: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  // Calculate True Range, +DM, -DM
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    // True Range
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);

    // Directional Movement
    const upMove = high - data[i - 1].high;
    const downMove = data[i - 1].low - low;

    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;

    plusDMs.push(plusDM);
    minusDMs.push(minusDM);
  }

  // Calculate smoothed TR, +DI, -DI
  let smoothedTR = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedPlusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedMinusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0);

  const dxValues: number[] = [];

  for (let i = period; i < data.length; i++) {
    const index = i - 1; // Adjust for trueRanges starting at index 1

    if (index < trueRanges.length) {
      smoothedTR = smoothedTR - smoothedTR / period + trueRanges[index];
      smoothedPlusDM = smoothedPlusDM - smoothedPlusDM / period + plusDMs[index];
      smoothedMinusDM = smoothedMinusDM - smoothedMinusDM / period + minusDMs[index];
    }

    const plusDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
    const minusDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;

    // Calculate DX
    const diSum = plusDI + minusDI;
    const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
    dxValues.push(dx);
  }

  // Calculate ADX (smoothed DX)
  if (dxValues.length < period) return [];

  let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;

  result.push({
    time: data[period * 2 - 1].time,
    value: parseFloat(adx.toFixed(2)),
  });

  for (let i = period; i < dxValues.length; i++) {
    adx = (adx * (period - 1) + dxValues[i]) / period;
    result.push({
      time: data[i + period].time,
      value: parseFloat(adx.toFixed(2)),
    });
  }

  return result;
}

// ============================================================================
// VOLUME INDICATORS
// ============================================================================

/**
 * On-Balance Volume (OBV)
 */
export function calculateOBV(data: OHLCVData[]): IndicatorDataPoint[] {
  if (data.length < 2) return [];

  const result: IndicatorDataPoint[] = [];
  let obv = 0;

  // First data point
  result.push({
    time: data[0].time,
    value: 0,
  });

  // Calculate OBV
  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) {
      obv += data[i].volume;
    } else if (data[i].close < data[i - 1].close) {
      obv -= data[i].volume;
    }
    // If close is unchanged, OBV stays the same

    result.push({
      time: data[i].time,
      value: obv,
    });
  }

  return result;
}

// ============================================================================
// VOLATILITY INDICATORS
// ============================================================================

/**
 * Average True Range (ATR)
 */
export function calculateATR(
  data: OHLCVData[],
  period: number = 14
): IndicatorDataPoint[] {
  if (data.length < period + 1) return [];

  const result: IndicatorDataPoint[] = [];
  const trueRanges: number[] = [];

  // Calculate True Range for each period
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    trueRanges.push(tr);
  }

  // Calculate initial ATR (SMA of first period TRs)
  let atr = 0;
  for (let i = 0; i < period; i++) {
    atr += trueRanges[i];
  }
  atr = atr / period;

  result.push({
    time: data[period].time,
    value: parseFloat(atr.toFixed(2)),
  });

  // Calculate smoothed ATR for remaining values
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    result.push({
      time: data[i + 1].time,
      value: parseFloat(atr.toFixed(2)),
    });
  }

  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate distance from price to indicator (in %)
 */
export function calculateDistancePercent(
  currentPrice: number,
  indicatorValue: number
): number {
  if (indicatorValue === 0) return 0;
  return parseFloat(
    (((currentPrice - indicatorValue) / indicatorValue) * 100).toFixed(2)
  );
}
