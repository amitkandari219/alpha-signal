/**
 * Mock OHLCV Data for Stock Charts
 *
 * Generates realistic candlestick and volume data for 5 companies
 */

export interface OHLCVData {
  time: string; // ISO date string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Generate realistic OHLCV data with support/resistance levels
function generateOHLCVData(
  symbol: string,
  basePrice: number,
  days: number,
  trend: 'up' | 'down' | 'sideways' = 'up'
): OHLCVData[] {
  const data: OHLCVData[] = [];
  let currentPrice = basePrice;
  const today = new Date();

  // Define support and resistance levels (±5%, ±10%, ±15% from base)
  // These create "magnetic" price levels that the stock tends to test multiple times
  const supportLevels = [
    basePrice * 0.85,  // Strong support at -15%
    basePrice * 0.90,  // Support at -10%
    basePrice * 0.95,  // Minor support at -5%
  ];
  const resistanceLevels = [
    basePrice * 1.05,  // Minor resistance at +5%
    basePrice * 1.10,  // Resistance at +10%
    basePrice * 1.15,  // Strong resistance at +15%
  ];

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Add trend bias
    let trendFactor = 0;
    if (trend === 'up') trendFactor = Math.random() * 0.008;
    if (trend === 'down') trendFactor = Math.random() * -0.008;

    // Daily volatility
    const volatility = 0.015;
    let change = (Math.random() - 0.5) * volatility + trendFactor;

    // Apply support/resistance magnetic effect
    // If price is near a support level, it tends to bounce up
    for (const support of supportLevels) {
      const distanceToSupport = (currentPrice - support) / currentPrice;
      if (distanceToSupport > -0.03 && distanceToSupport < 0.02) {
        // Within 3% below to 2% above support - bounce up
        change += Math.random() * 0.01;
        // Snap to level occasionally to create repeated touches
        if (Math.random() < 0.3) {
          currentPrice = support;
        }
      }
    }

    // If price is near a resistance level, it tends to bounce down
    for (const resistance of resistanceLevels) {
      const distanceToResistance = (resistance - currentPrice) / currentPrice;
      if (distanceToResistance > -0.02 && distanceToResistance < 0.03) {
        // Within 2% above to 3% below resistance - bounce down
        change -= Math.random() * 0.01;
        // Snap to level occasionally to create repeated touches
        if (Math.random() < 0.3) {
          currentPrice = resistance;
        }
      }
    }

    const open = currentPrice;
    const close = currentPrice * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);
    const volume = Math.floor(1000000 + Math.random() * 5000000);

    data.push({
      time: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }

  return data;
}

// Mock stock metadata
export interface MockStockMetadata {
  symbol: string;
  companyName: string;
  sector: string;
  marketCapCategory: string;
  exchange: 'NSE' | 'BSE' | 'NSE/BSE';
  basePrice: number;
  trend: 'up' | 'down' | 'sideways';
}

export const mockStocks: Record<string, MockStockMetadata> = {
  RELIANCE: {
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries Limited',
    sector: 'Oil & Gas',
    marketCapCategory: 'LARGE_CAP',
    exchange: 'NSE/BSE',
    basePrice: 2456.75,
    trend: 'up',
  },
  TCS: {
    symbol: 'TCS',
    companyName: 'Tata Consultancy Services Limited',
    sector: 'IT Services',
    marketCapCategory: 'LARGE_CAP',
    exchange: 'NSE/BSE',
    basePrice: 3678.90,
    trend: 'up',
  },
  INFY: {
    symbol: 'INFY',
    companyName: 'Infosys Limited',
    sector: 'IT Services',
    marketCapCategory: 'LARGE_CAP',
    exchange: 'NSE/BSE',
    basePrice: 1445.60,
    trend: 'sideways',
  },
  HDFCBANK: {
    symbol: 'HDFCBANK',
    companyName: 'HDFC Bank Limited',
    sector: 'Banking',
    marketCapCategory: 'LARGE_CAP',
    exchange: 'NSE/BSE',
    basePrice: 1598.30,
    trend: 'up',
  },
  TATASTEEL: {
    symbol: 'TATASTEEL',
    companyName: 'Tata Steel Limited',
    sector: 'Metals & Mining',
    marketCapCategory: 'LARGE_CAP',
    exchange: 'NSE/BSE',
    basePrice: 134.25,
    trend: 'down',
  },
  DIVISLAB: {
    symbol: 'DIVISLAB',
    companyName: "Divi's Laboratories Limited",
    sector: 'Pharmaceuticals',
    marketCapCategory: 'LARGE_CAP',
    exchange: 'NSE/BSE',
    basePrice: 6140.00,
    trend: 'up',
  },
  MOTHERSON: {
    symbol: 'MOTHERSON',
    companyName: 'Samvardhana Motherson International Limited',
    sector: 'Auto Components',
    marketCapCategory: 'LARGE_CAP',
    exchange: 'NSE/BSE',
    basePrice: 178.45,
    trend: 'up',
  },
};

// Generate and cache data for all periods
export const mockOHLCVData: Record<
  string,
  Record<string, OHLCVData[]>
> = Object.keys(mockStocks).reduce((acc, symbol) => {
  const stock = mockStocks[symbol];
  acc[symbol] = {
    '1D': generateOHLCVData(symbol, stock.basePrice, 1, stock.trend),
    '1W': generateOHLCVData(symbol, stock.basePrice, 7, stock.trend),
    '1M': generateOHLCVData(symbol, stock.basePrice, 30, stock.trend),
    '3M': generateOHLCVData(symbol, stock.basePrice, 90, stock.trend),
    '6M': generateOHLCVData(symbol, stock.basePrice, 180, stock.trend),
    '1Y': generateOHLCVData(symbol, stock.basePrice, 365, stock.trend),
    '5Y': generateOHLCVData(symbol, stock.basePrice, 1825, stock.trend),
    MAX: generateOHLCVData(symbol, stock.basePrice, 3650, stock.trend),
  };
  return acc;
}, {} as Record<string, Record<string, OHLCVData[]>>);

// Get OHLCV data for any symbol (generates on-the-fly if not in cache)
export function getOHLCVData(symbol: string, period: string): OHLCVData[] {
  // If data exists in cache, return it
  if (mockOHLCVData[symbol]?.[period]) {
    return mockOHLCVData[symbol][period];
  }

  // Generate data on-the-fly for stocks not in mockStocks
  const stock = mockStocks[symbol];
  const basePrice = stock?.basePrice || 1000; // Default base price
  const trend = stock?.trend || 'sideways'; // Default trend

  // Map period to days
  const periodDays: Record<string, number> = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
    '5Y': 1825,
    'MAX': 3650,
  };

  const days = periodDays[period] || 30;

  // Generate and cache the data
  const data = generateOHLCVData(symbol, basePrice, days, trend);

  // Cache it for future use
  if (!mockOHLCVData[symbol]) {
    mockOHLCVData[symbol] = {};
  }
  mockOHLCVData[symbol][period] = data;

  return data;
}

// Get current price and change for a symbol
export function getCurrentPriceData(symbol: string) {
  const stock = mockStocks[symbol];
  const basePrice = stock?.basePrice || 1000;

  // Get today's data (generate if not available)
  const todayData = getOHLCVData(symbol, '1D');

  if (!todayData.length) {
    return {
      currentPrice: basePrice,
      change: 0,
      changePercent: 0,
      isPositive: true,
    };
  }

  const currentPrice = todayData[todayData.length - 1]?.close || basePrice;
  const yesterdayPrice = todayData[0]?.open || basePrice;
  const change = currentPrice - yesterdayPrice;
  const changePercent = (change / yesterdayPrice) * 100;

  return {
    currentPrice,
    change,
    changePercent,
    isPositive: change >= 0,
  };
}

// Calculate SMA (Simple Moving Average)
export function calculateSMA(data: OHLCVData[], period: number): Array<{ time: string; value: number }> {
  const sma: Array<{ time: string; value: number }> = [];

  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
    const average = sum / period;
    sma.push({
      time: data[i].time,
      value: parseFloat(average.toFixed(2)),
    });
  }

  return sma;
}
