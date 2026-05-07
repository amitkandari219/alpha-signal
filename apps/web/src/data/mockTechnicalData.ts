/**
 * Mock Technical Analysis Data
 *
 * Comprehensive technical indicators and signals for stock analysis
 */

export type TrendStatus = 'STRONG_UPTREND' | 'UPTREND' | 'SIDEWAYS' | 'DOWNTREND' | 'STRONG_DOWNTREND';
export type MASignal = 'ABOVE' | 'BELOW';
export type MATrend = 'RISING' | 'FALLING' | 'FLAT';

export interface TrendData {
  status: TrendStatus;
  description: string;
  position: number; // 0-100 for gauge position
}

export interface MovingAverage {
  value: number;
  distancePercent: number;
  signal: MASignal;
  trend: MATrend;
}

export interface OscillatorData {
  rsi: number;
  macd: {
    current: number;
    signal: number;
    histogram: { date: string; value: number }[];
  };
  stochastic: {
    k: number;
    d: number;
    history: { date: string; k: number; d: number }[];
  };
}

export interface VolumeData {
  todayVolume: number;
  avgVolume20Day: number;
  deliveryPercent: number;
  deliveryTrend: number[]; // 10-day sparkline
  isSpike: boolean;
}

export interface BreakoutData {
  isActive: boolean;
  consolidationLow?: number;
  consolidationHigh?: number;
  breakoutLevel?: number;
  direction?: 'UP' | 'DOWN';
  volumeConfirmed?: boolean;
  daysSinceBreakout?: number;
  priceHistory?: { date: string; price: number }[];
}

export interface MomentumScore {
  overall: number;
  factors: {
    rsiPositioning: number;
    priceMAAlignment: number;
    macdTrend: number;
    volumeConfirmation: number;
    relativeStrength: number;
  };
}

export interface TechnicalData {
  trend: TrendData;
  movingAverages: {
    sma20: MovingAverage;
    sma50: MovingAverage;
    sma100: MovingAverage;
    sma200: MovingAverage;
  };
  oscillators: OscillatorData;
  volume: VolumeData;
  breakout: BreakoutData;
  momentumScore: MomentumScore;
}

export const mockTechnicalData: Record<string, TechnicalData> = {
  RELIANCE: {
    trend: {
      status: 'UPTREND',
      description: 'Price above all major MAs with rising ADX',
      position: 75,
    },
    movingAverages: {
      sma20: { value: 2428.50, distancePercent: 1.15, signal: 'ABOVE', trend: 'RISING' },
      sma50: { value: 2385.20, distancePercent: 2.99, signal: 'ABOVE', trend: 'RISING' },
      sma100: { value: 2342.80, distancePercent: 4.86, signal: 'ABOVE', trend: 'RISING' },
      sma200: { value: 2298.40, distancePercent: 6.88, signal: 'ABOVE', trend: 'FLAT' },
    },
    oscillators: {
      rsi: 62.5,
      macd: {
        current: 28.5,
        signal: 22.8,
        histogram: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(2026, 0, i + 10).toISOString().split('T')[0],
          value: Math.sin(i / 3) * 15 + (i - 15) * 0.8,
        })),
      },
      stochastic: {
        k: 68.3,
        d: 64.2,
        history: Array.from({ length: 20 }, (_, i) => ({
          date: new Date(2026, 1, i - 10).toISOString().split('T')[0],
          k: 50 + Math.sin(i / 2) * 20 + Math.random() * 10,
          d: 50 + Math.sin(i / 2) * 20,
        })),
      },
    },
    volume: {
      todayVolume: 8500000,
      avgVolume20Day: 6800000,
      deliveryPercent: 58.5,
      deliveryTrend: [52, 54, 56, 55, 57, 59, 58, 60, 59, 58.5],
      isSpike: false,
    },
    breakout: {
      isActive: true,
      consolidationLow: 2380,
      consolidationHigh: 2440,
      breakoutLevel: 2440,
      direction: 'UP',
      volumeConfirmed: true,
      daysSinceBreakout: 3,
      priceHistory: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2026, 1, i - 20).toISOString().split('T')[0],
        price: i < 20 ? 2380 + Math.random() * 60 : 2440 + (i - 20) * 2,
      })),
    },
    momentumScore: {
      overall: 72,
      factors: {
        rsiPositioning: 16.5,
        priceMAAlignment: 21.0,
        macdTrend: 15.5,
        volumeConfirmation: 11.0,
        relativeStrength: 16.0,
      },
    },
  },

  TCS: {
    trend: {
      status: 'SIDEWAYS',
      description: 'Price oscillating around major MAs with low ADX',
      position: 50,
    },
    movingAverages: {
      sma20: { value: 3885.20, distancePercent: 0.23, signal: 'ABOVE', trend: 'FLAT' },
      sma50: { value: 3892.50, distancePercent: -0.19, signal: 'BELOW', trend: 'FLAT' },
      sma100: { value: 3878.30, distancePercent: 0.41, signal: 'ABOVE', trend: 'FLAT' },
      sma200: { value: 3856.80, distancePercent: 0.96, signal: 'ABOVE', trend: 'RISING' },
    },
    oscillators: {
      rsi: 48.2,
      macd: {
        current: -2.5,
        signal: -1.8,
        histogram: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(2026, 0, i + 10).toISOString().split('T')[0],
          value: Math.sin(i / 4) * 8 - 2,
        })),
      },
      stochastic: {
        k: 52.1,
        d: 48.9,
        history: Array.from({ length: 20 }, (_, i) => ({
          date: new Date(2026, 1, i - 10).toISOString().split('T')[0],
          k: 45 + Math.sin(i / 2.5) * 15 + Math.random() * 8,
          d: 45 + Math.sin(i / 2.5) * 15,
        })),
      },
    },
    volume: {
      todayVolume: 4200000,
      avgVolume20Day: 3800000,
      deliveryPercent: 62.8,
      deliveryTrend: [60, 61, 62, 63, 62, 61, 63, 64, 63, 62.8],
      isSpike: false,
    },
    breakout: {
      isActive: false,
    },
    momentumScore: {
      overall: 52,
      factors: {
        rsiPositioning: 9.5,
        priceMAAlignment: 13.0,
        macdTrend: 9.0,
        volumeConfirmation: 8.5,
        relativeStrength: 12.0,
      },
    },
  },

  INFY: {
    trend: {
      status: 'DOWNTREND',
      description: 'Price below major MAs with declining momentum',
      position: 30,
    },
    movingAverages: {
      sma20: { value: 1562.80, distancePercent: -1.82, signal: 'BELOW', trend: 'FALLING' },
      sma50: { value: 1588.50, distancePercent: -3.49, signal: 'BELOW', trend: 'FALLING' },
      sma100: { value: 1605.20, distancePercent: -5.58, signal: 'BELOW', trend: 'FALLING' },
      sma200: { value: 1618.90, distancePercent: -6.49, signal: 'BELOW', trend: 'FLAT' },
    },
    oscillators: {
      rsi: 38.5,
      macd: {
        current: -18.5,
        signal: -12.2,
        histogram: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(2026, 0, i + 10).toISOString().split('T')[0],
          value: -Math.abs(Math.sin(i / 3) * 12) - (30 - i) * 0.5,
        })),
      },
      stochastic: {
        k: 32.8,
        d: 38.5,
        history: Array.from({ length: 20 }, (_, i) => ({
          date: new Date(2026, 1, i - 10).toISOString().split('T')[0],
          k: 40 - (20 - i) * 1.5 + Math.sin(i / 2) * 10 + Math.random() * 8,
          d: 40 - (20 - i) * 1.5 + Math.sin(i / 2) * 10,
        })),
      },
    },
    volume: {
      todayVolume: 12500000,
      avgVolume20Day: 5800000,
      deliveryPercent: 42.5,
      deliveryTrend: [48, 47, 46, 45, 44, 43, 44, 43, 42, 42.5],
      isSpike: true,
    },
    breakout: {
      isActive: false,
    },
    momentumScore: {
      overall: 35,
      factors: {
        rsiPositioning: 6.0,
        priceMAAlignment: 8.0,
        macdTrend: 5.5,
        volumeConfirmation: 7.0,
        relativeStrength: 8.5,
      },
    },
  },

  HDFCBANK: {
    trend: {
      status: 'STRONG_UPTREND',
      description: 'Strong bullish momentum with all MAs aligned positively',
      position: 90,
    },
    movingAverages: {
      sma20: { value: 1688.20, distancePercent: 3.52, signal: 'ABOVE', trend: 'RISING' },
      sma50: { value: 1642.80, distancePercent: 6.30, signal: 'ABOVE', trend: 'RISING' },
      sma100: { value: 1598.50, distancePercent: 9.22, signal: 'ABOVE', trend: 'RISING' },
      sma200: { value: 1556.90, distancePercent: 12.16, signal: 'ABOVE', trend: 'RISING' },
    },
    oscillators: {
      rsi: 72.8,
      macd: {
        current: 42.5,
        signal: 35.8,
        histogram: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(2026, 0, i + 10).toISOString().split('T')[0],
          value: (i - 10) * 1.2 + Math.sin(i / 4) * 8,
        })),
      },
      stochastic: {
        k: 78.5,
        d: 75.2,
        history: Array.from({ length: 20 }, (_, i) => ({
          date: new Date(2026, 1, i - 10).toISOString().split('T')[0],
          k: 60 + i * 1.2 + Math.sin(i / 2) * 8 + Math.random() * 6,
          d: 60 + i * 1.2 + Math.sin(i / 2) * 8,
        })),
      },
    },
    volume: {
      todayVolume: 18500000,
      avgVolume20Day: 8200000,
      deliveryPercent: 68.5,
      deliveryTrend: [62, 63, 64, 65, 66, 67, 68, 69, 68, 68.5],
      isSpike: true,
    },
    breakout: {
      isActive: true,
      consolidationLow: 1640,
      consolidationHigh: 1690,
      breakoutLevel: 1690,
      direction: 'UP',
      volumeConfirmed: true,
      daysSinceBreakout: 5,
      priceHistory: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2026, 1, i - 20).toISOString().split('T')[0],
        price: i < 22 ? 1640 + Math.random() * 50 : 1690 + (i - 22) * 5,
      })),
    },
    momentumScore: {
      overall: 85,
      factors: {
        rsiPositioning: 18.5,
        priceMAAlignment: 24.0,
        macdTrend: 19.0,
        volumeConfirmation: 14.5,
        relativeStrength: 18.0,
      },
    },
  },

  TATASTEEL: {
    trend: {
      status: 'STRONG_DOWNTREND',
      description: 'Severe bearish pressure with all indicators negative',
      position: 10,
    },
    movingAverages: {
      sma20: { value: 128.50, distancePercent: -5.84, signal: 'BELOW', trend: 'FALLING' },
      sma50: { value: 135.20, distancePercent: -10.74, signal: 'BELOW', trend: 'FALLING' },
      sma100: { value: 142.80, distancePercent: -15.07, signal: 'BELOW', trend: 'FALLING' },
      sma200: { value: 148.90, distancePercent: -18.39, signal: 'BELOW', trend: 'FALLING' },
    },
    oscillators: {
      rsi: 28.5,
      macd: {
        current: -8.5,
        signal: -5.2,
        histogram: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(2026, 0, i + 10).toISOString().split('T')[0],
          value: -(30 - i) * 0.6 - Math.abs(Math.sin(i / 3) * 5),
        })),
      },
      stochastic: {
        k: 22.3,
        d: 28.8,
        history: Array.from({ length: 20 }, (_, i) => ({
          date: new Date(2026, 1, i - 10).toISOString().split('T')[0],
          k: 35 - i * 0.8 + Math.sin(i / 2) * 8 + Math.random() * 6,
          d: 35 - i * 0.8 + Math.sin(i / 2) * 8,
        })),
      },
    },
    volume: {
      todayVolume: 22000000,
      avgVolume20Day: 15000000,
      deliveryPercent: 38.2,
      deliveryTrend: [42, 41, 40, 39, 40, 39, 38, 38, 38, 38.2],
      isSpike: false,
    },
    breakout: {
      isActive: false,
    },
    momentumScore: {
      overall: 22,
      factors: {
        rsiPositioning: 3.5,
        priceMAAlignment: 5.0,
        macdTrend: 3.0,
        volumeConfirmation: 4.5,
        relativeStrength: 6.0,
      },
    },
  },
};

export const getTechnicalData = (symbol: string): TechnicalData => {
  return mockTechnicalData[symbol] || mockTechnicalData['RELIANCE'];
};
