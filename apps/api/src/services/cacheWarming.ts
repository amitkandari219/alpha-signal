/**
 * Cache Warming Service
 *
 * Pre-loads cache with data for popular stocks
 * Runs on server startup and periodically via scheduled tasks
 */

import { getCacheService, CACHE_KEYS, CACHE_TTL } from './cache';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const cacheService = getCacheService();

/**
 * Top stocks to warm cache for (seed data)
 * In production, this should be dynamically determined from page view analytics
 */
const TOP_STOCKS_SEED = [
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'INFY',
  'ICICIBANK',
  'HINDUNILVR',
  'ITC',
  'SBIN',
  'BHARTIARTL',
  'BAJFINANCE',
  'KOTAKBANK',
  'LT',
  'ASIANPAINT',
  'HCLTECH',
  'AXISBANK',
  'MARUTI',
  'SUNPHARMA',
  'TITAN',
  'ULTRACEMCO',
  'NESTLEIND',
  'WIPRO',
  'TATASTEEL',
  'TECHM',
  'NTPC',
  'POWERGRID',
  'ONGC',
  'BAJAJFINSV',
  'ADANIPORTS',
  'DIVISLAB',
  'DRREDDY',
  'CIPLA',
  'EICHERMOT',
  'HEROMOTOCO',
  'BRITANNIA',
  'GRASIM',
  'HINDALCO',
  'JSWSTEEL',
  'INDUSINDBK',
  'COALINDIA',
  'TATAMOTORS',
  'M&M',
  'APOLLOHOSP',
  'SHREECEM',
  'SBILIFE',
  'BAJAJ-AUTO',
  'ADANIENT',
  'TATACONSUM',
  'UPL',
  'HAVELLS',
  'DIXON',
];

/**
 * Warm cache for a single stock
 */
async function warmStockCache(symbol: string): Promise<void> {
  try {
    const company = await prisma.companies.findFirst({
      where: { symbol },
      select: {
        id: true,
        symbol: true,
        name: true,
        sector_id: true,
      },
    });

    if (!company) {
      console.log(`⚠️  Company not found: ${symbol}`);
      return;
    }

    // 1. Cache stock scores
    try {
      const scores = await fetchStockScores(company.id);
      if (scores) {
        await cacheService.set(
          CACHE_KEYS.stockScores(symbol),
          scores,
          CACHE_TTL.STOCK_SCORES
        );
      }
    } catch (error) {
      console.error(`Error caching scores for ${symbol}:`, error);
    }

    // 2. Cache stock price (mock for now)
    try {
      const price = {
        symbol,
        price: 100 + Math.random() * 500,
        change: Math.random() * 20 - 10,
        changePercent: Math.random() * 5 - 2.5,
        volume: Math.floor(Math.random() * 1000000),
        timestamp: new Date().toISOString(),
      };

      await cacheService.set(
        CACHE_KEYS.stockPrice(symbol),
        price,
        CACHE_TTL.STOCK_PRICE
      );
    } catch (error) {
      console.error(`Error caching price for ${symbol}:`, error);
    }

    // 3. Cache stock detail (composite data)
    try {
      const detail = {
        company,
        scores: await fetchStockScores(company.id),
        // Add other data as needed
      };

      await cacheService.set(
        CACHE_KEYS.stockDetail(symbol),
        detail,
        CACHE_TTL.STOCK_DETAIL
      );
    } catch (error) {
      console.error(`Error caching detail for ${symbol}:`, error);
    }

    console.log(`🔥 Cache warmed for ${symbol}`);
  } catch (error) {
    console.error(`Failed to warm cache for ${symbol}:`, error);
  }
}

/**
 * Fetch stock scores from database
 */
async function fetchStockScores(companyId: string): Promise<any> {
  try {
    // Query latest composite scores
    // TODO: Replace with actual composite_scores table query
    const scores = await prisma.$queryRaw<any[]>`
      SELECT
        quality_score,
        growth_score,
        momentum_score,
        risk_score,
        sentiment_score,
        computed_at
      FROM composite_scores
      WHERE company_id = ${companyId}
      ORDER BY computed_at DESC
      LIMIT 1
    `;

    if (scores.length > 0) {
      return scores[0];
    }

    // Return mock scores if no data
    return {
      quality_score: Math.floor(Math.random() * 40) + 60,
      growth_score: Math.floor(Math.random() * 40) + 50,
      momentum_score: Math.floor(Math.random() * 40) + 40,
      risk_score: Math.floor(Math.random() * 40) + 30,
      sentiment_score: Math.floor(Math.random() * 40) + 50,
      computed_at: new Date(),
    };
  } catch (error) {
    console.error('Error fetching scores:', error);
    return null;
  }
}

/**
 * Get top stocks from page view analytics
 * TODO: Implement actual analytics query
 */
async function getTopViewedStocks(limit: number = 50): Promise<string[]> {
  try {
    // TODO: Query from page_views table or analytics service
    // For now, return seed data
    return TOP_STOCKS_SEED.slice(0, limit);
  } catch (error) {
    console.error('Error fetching top viewed stocks:', error);
    return TOP_STOCKS_SEED.slice(0, limit);
  }
}

/**
 * Warm cache for top stocks
 */
export async function warmTopStocksCache(limit: number = 50): Promise<void> {
  console.log(`🔥 Starting cache warming for top ${limit} stocks...`);

  try {
    const topStocks = await getTopViewedStocks(limit);

    // Warm cache in parallel (batches of 10 to avoid overwhelming the system)
    const batchSize = 10;
    for (let i = 0; i < topStocks.length; i += batchSize) {
      const batch = topStocks.slice(i, i + batchSize);
      await Promise.all(batch.map(symbol => warmStockCache(symbol)));
    }

    console.log(`✅ Cache warming complete for ${topStocks.length} stocks`);
  } catch (error) {
    console.error('❌ Cache warming failed:', error);
  }
}

/**
 * Warm cache for market overview data
 */
export async function warmMarketOverviewCache(): Promise<void> {
  try {
    // Mock market indices data
    const marketData = {
      indices: [
        {
          name: 'NIFTY 50',
          value: 21000 + Math.random() * 1000,
          change: Math.random() * 200 - 100,
          changePercent: Math.random() * 2 - 1,
        },
        {
          name: 'SENSEX',
          value: 70000 + Math.random() * 2000,
          change: Math.random() * 500 - 250,
          changePercent: Math.random() * 2 - 1,
        },
        {
          name: 'NIFTY BANK',
          value: 45000 + Math.random() * 1000,
          change: Math.random() * 300 - 150,
          changePercent: Math.random() * 2 - 1,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await cacheService.set(
      CACHE_KEYS.marketOverview(),
      marketData,
      CACHE_TTL.MARKET_OVERVIEW
    );

    console.log('🔥 Market overview cache warmed');
  } catch (error) {
    console.error('Failed to warm market overview cache:', error);
  }
}

/**
 * Warm cache for trending stocks
 */
export async function warmTrendingStocksCache(): Promise<void> {
  try {
    // TODO: Implement actual trending stocks logic (based on volume, price movement, etc.)
    const trendingStocks = TOP_STOCKS_SEED.slice(0, 10).map(symbol => ({
      symbol,
      change: Math.random() * 10 - 5,
      changePercent: Math.random() * 8 - 4,
      volume: Math.floor(Math.random() * 5000000),
      reason: Math.random() > 0.5 ? 'High Volume' : 'Price Movement',
    }));

    await cacheService.set(
      CACHE_KEYS.trending(),
      trendingStocks,
      CACHE_TTL.TRENDING
    );

    console.log('🔥 Trending stocks cache warmed');
  } catch (error) {
    console.error('Failed to warm trending stocks cache:', error);
  }
}

/**
 * Complete cache warming routine
 * Run on server startup and periodically
 */
export async function runCacheWarming(): Promise<void> {
  console.log('🔥🔥🔥 STARTING COMPLETE CACHE WARMING 🔥🔥🔥');

  await Promise.all([
    warmTopStocksCache(50),
    warmMarketOverviewCache(),
    warmTrendingStocksCache(),
  ]);

  console.log('✅✅✅ CACHE WARMING COMPLETE ✅✅✅');
}

/**
 * Schedule periodic cache warming
 * Call this from your server initialization
 */
export function scheduleCacheWarming(): void {
  // Warm cache on startup
  setTimeout(() => {
    runCacheWarming();
  }, 5000); // Wait 5 seconds after startup

  // Warm cache every 5 minutes
  setInterval(() => {
    runCacheWarming();
  }, 5 * 60 * 1000); // 5 minutes

  console.log('✅ Cache warming scheduled (every 5 minutes)');
}

export default {
  warmTopStocksCache,
  warmMarketOverviewCache,
  warmTrendingStocksCache,
  runCacheWarming,
  scheduleCacheWarming,
};
