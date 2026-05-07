/**
 * Mock Price Simulator for Development
 *
 * Generates realistic price ticks for seed companies during development.
 * Publishes to Redis pub/sub channels that WebSocket server consumes.
 *
 * Features:
 * - Random walk price generation with trend bias
 * - Trend bias derived from technical_indicators table
 * - Realistic volume fluctuations
 * - Publishes every 1-2 seconds
 */

import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StockSimulator {
  companyId: string;
  symbol: string;
  currentPrice: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: number;
  baseVolume: number;
}

export class MockPriceSimulator {
  private redisClient: any;
  private simulators: StockSimulator[] = [];
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
  }

  async initialize() {
    // Connect to Redis
    await this.redisClient.connect();
    console.log('✅ Mock Price Simulator: Redis connected');

    // Load seed companies and their latest prices/trends
    await this.loadSeedCompanies();

    console.log(`✅ Mock Price Simulator: Loaded ${this.simulators.length} companies`);
  }

  private async loadSeedCompanies() {
    // Get all active companies (includes all Nifty 50)
    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        nseSymbol: true,
      },
      take: 60, // Load up to 60 companies (covers Nifty 50 + seed companies)
    });

    for (const company of companies) {
      // Get latest price from price_data (TimescaleDB hypertable)
      const latestPriceResult = await prisma.$queryRaw<Array<{close: any, volume: any}>>`
        SELECT close, volume
        FROM price_data
        WHERE company_id = ${company.id}::uuid AND interval = 'DAY_1'
        ORDER BY timestamp DESC
        LIMIT 1
      `;

      const latestPrice = latestPriceResult[0];

      // Calculate trend based on price vs SMA200
      let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';

      if (latestPrice) {
        const indicatorResult = await prisma.$queryRaw<Array<{sma_200: any}>>`
          SELECT sma_200
          FROM technical_indicators
          WHERE company_id = ${company.id}::uuid
          ORDER BY date DESC
          LIMIT 1
        `;

        if (indicatorResult[0]?.sma_200) {
          const currentPrice = Number(latestPrice.close);
          const sma200 = Number(indicatorResult[0].sma_200);

          if (currentPrice > sma200 * 1.05) {
            trend = 'BULLISH'; // Price 5%+ above SMA200
          } else if (currentPrice < sma200 * 0.95) {
            trend = 'BEARISH'; // Price 5%+ below SMA200
          }
        }

        this.simulators.push({
          companyId: company.id,
          symbol: company.nseSymbol,
          currentPrice: Number(latestPrice.close),
          trend,
          volatility: this.getVolatilityForSymbol(company.nseSymbol),
          baseVolume: Number(latestPrice.volume) || 100000,
        });
      }
    }
  }

  private getVolatilityForSymbol(symbol: string): number {
    // Different stocks have different volatilities
    const volatilityMap: Record<string, number> = {
      // Banks - Lower volatility
      HDFCBANK: 0.012,
      ICICIBANK: 0.012,
      KOTAKBANK: 0.012,
      SBIN: 0.014,
      AXISBANK: 0.013,
      INDUSINDBK: 0.014,

      // IT - Moderate volatility
      TCS: 0.013,
      INFY: 0.013,
      WIPRO: 0.015,
      HCLTECH: 0.014,
      TECHM: 0.015,
      LTIM: 0.015,

      // Large caps - Lower volatility
      RELIANCE: 0.012,
      HINDUNILVR: 0.011,
      ITC: 0.011,

      // Mid/Small caps - Higher volatility
      DIXON: 0.022,
      CLEAN: 0.020,
      DEEPAKNTR: 0.018,
      ASTRAL: 0.015,
      POLYCAB: 0.016,
    };
    // Default volatility for stocks not in map
    return volatilityMap[symbol] || 0.015; // 1.5% default
  }

  start() {
    if (this.isRunning) {
      console.warn('⚠️  Mock Price Simulator: Already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Mock Price Simulator: Started');

    // Generate ticks every 1-2 seconds
    this.intervalId = setInterval(() => {
      this.generateTicks();
    }, 1000 + Math.random() * 1000); // Random interval 1-2 seconds
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log('🛑 Mock Price Simulator: Stopped');
  }

  async cleanup() {
    this.stop();
    await this.redisClient.quit();
    await prisma.$disconnect();
  }

  private generateTicks() {
    for (const sim of this.simulators) {
      // Calculate trend bias
      let trendBias = 0;
      if (sim.trend === 'BULLISH') {
        trendBias = 0.0001; // Slight upward drift
      } else if (sim.trend === 'BEARISH') {
        trendBias = -0.0001; // Slight downward drift
      }

      // Random walk with trend bias
      const randomChange = (Math.random() - 0.5) * 2 * sim.volatility;
      const priceChange = trendBias + randomChange;

      // Update price
      const oldPrice = sim.currentPrice;
      sim.currentPrice = sim.currentPrice * (1 + priceChange);

      // Calculate change percentage
      const change = sim.currentPrice - oldPrice;
      const change_pct = (change / oldPrice) * 100;

      // Generate realistic volume (±50% of base)
      const volume = Math.floor(sim.baseVolume * (0.5 + Math.random()));

      // Prepare tick data
      const tickData = {
        symbol: sim.symbol,
        ltp: Number(sim.currentPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        change_pct: Number(change_pct.toFixed(2)),
        volume: volume,
        timestamp: new Date().toISOString(),
        open: Number((sim.currentPrice * 0.998).toFixed(2)),
        high: Number((sim.currentPrice * 1.001).toFixed(2)),
        low: Number((sim.currentPrice * 0.999).toFixed(2)),
      };

      // Publish to Redis channel that WebSocket server listens to
      const channel = `price_updates:${sim.symbol}`;
      this.redisClient.publish(channel, JSON.stringify(tickData));

      // Log occasionally (every ~10 ticks)
      if (Math.random() < 0.1) {
        const emoji = change >= 0 ? '📈' : '📉';
        console.log(
          `${emoji} ${sim.symbol}: ₹${tickData.ltp} (${change_pct >= 0 ? '+' : ''}${tickData.change_pct.toFixed(2)}%)`
        );
      }
    }
  }
}

// Singleton instance
let simulatorInstance: MockPriceSimulator | null = null;

export async function startMockPriceSimulator() {
  if (process.env.MOCK_PRICES !== 'true') {
    console.log('ℹ️  Mock Price Simulator: Disabled (MOCK_PRICES != true)');
    return;
  }

  if (simulatorInstance) {
    console.warn('⚠️  Mock Price Simulator: Already initialized');
    return;
  }

  simulatorInstance = new MockPriceSimulator();
  await simulatorInstance.initialize();
  simulatorInstance.start();

  return simulatorInstance;
}

export async function stopMockPriceSimulator() {
  if (simulatorInstance) {
    await simulatorInstance.cleanup();
    simulatorInstance = null;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down mock price simulator...');
  await stopMockPriceSimulator();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down mock price simulator...');
  await stopMockPriceSimulator();
  process.exit(0);
});
