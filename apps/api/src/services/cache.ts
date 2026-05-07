/**
 * Redis Cache Service
 *
 * Centralized caching layer for Alpha Signal API
 * Provides fast data access and reduces database load
 */

import { createClient, RedisClientType } from 'redis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Cache TTL (Time To Live) configurations in seconds
 */
export const CACHE_TTL = {
  STOCK_DETAIL: 300,        // 5 minutes - full stock page data
  STOCK_PRICE: 10,          // 10 seconds - latest price only
  STOCK_SCORES: 600,        // 10 minutes - composite scores
  AI_SUMMARY: 3600,         // 1 hour - AI summaries
  TECHNICALS: 600,          // 10 minutes - technical indicators
  NEWS: 300,                // 5 minutes - news & sentiment
  SCREENER: 120,            // 2 minutes - screener results
  SECTOR_OVERVIEW: 600,     // 10 minutes - sector page data
  MARKET_OVERVIEW: 30,      // 30 seconds - market indices
  TRENDING: 300,            // 5 minutes - trending stocks
  REPORTS: 1800,            // 30 minutes - latest reports
} as const;

/**
 * Cache key patterns
 */
export const CACHE_KEYS = {
  stockDetail: (symbol: string) => `stock:${symbol}:detail`,
  stockPrice: (symbol: string) => `stock:${symbol}:price`,
  stockScores: (symbol: string) => `stock:${symbol}:scores`,
  aiSummary: (symbol: string) => `stock:${symbol}:ai_summary`,
  technicals: (symbol: string) => `stock:${symbol}:technicals`,
  news: (symbol: string) => `stock:${symbol}:news`,
  screener: (filterHash: string) => `screener:${filterHash}`,
  sectorOverview: (sectorId: string) => `sector:${sectorId}:overview`,
  marketOverview: () => 'dashboard:market_overview',
  trending: () => 'dashboard:trending',
  reports: () => 'reports:latest',
  stockPattern: (symbol: string) => `stock:${symbol}:*`,
} as const;

/**
 * Cache statistics for monitoring
 */
interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
}

/**
 * CacheService class - handles all Redis operations
 */
export class CacheService {
  private client: RedisClientType;
  private pubClient: RedisClientType;
  private subClient: RedisClientType;
  private isConnected: boolean = false;
  private stats: CacheStats = { hits: 0, misses: 0, errors: 0 };

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // Main client for get/set operations
    this.client = createClient({ url: redisUrl });

    // Pub/sub clients (Redis requires separate connections for pub/sub)
    this.pubClient = createClient({ url: redisUrl });
    this.subClient = createClient({ url: redisUrl });

    this.setupEventHandlers();
    this.connect();
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
      this.stats.errors++;
    });

    this.client.on('connect', () => {
      console.log('✅ Redis client connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('✅ Redis client ready');
    });

    this.pubClient.on('error', (err) => {
      console.error('Redis Pub Client Error:', err);
    });

    this.subClient.on('error', (err) => {
      console.error('Redis Sub Client Error:', err);
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      await Promise.all([
        this.client.connect(),
        this.pubClient.connect(),
        this.subClient.connect(),
      ]);

      // Subscribe to cache invalidation channel
      await this.subscribeToCacheInvalidation();

      console.log('✅ Cache service initialized');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<any> {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache');
      this.stats.misses++;
      return null;
    }

    try {
      const value = await this.client.get(key);

      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      this.stats.errors++;
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache set');
      return;
    }

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Delete specific key from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.del(key);
      console.log(`🗑️  Cache invalidated: ${key}`);
    } catch (error) {
      console.error(`Cache DELETE error for key ${key}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Delete all keys matching a pattern
   * Example: deletePattern('stock:DIXON:*') deletes all DIXON cache entries
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️  Cache invalidated ${keys.length} keys matching: ${pattern}`);
      }
    } catch (error) {
      console.error(`Cache DELETE PATTERN error for ${pattern}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Warm cache by pre-loading data for top stocks
   */
  async warmCache(symbols: string[]): Promise<void> {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache warming');
      return;
    }

    console.log(`🔥 Warming cache for ${symbols.length} stocks...`);

    for (const symbol of symbols) {
      try {
        // Fetch and cache stock detail data
        // In production, this would call your actual data fetching functions
        // For now, we'll create placeholder logic

        // Example: Cache stock price
        const priceKey = CACHE_KEYS.stockPrice(symbol);
        const priceData = await this.fetchStockPrice(symbol);
        if (priceData) {
          await this.set(priceKey, priceData, CACHE_TTL.STOCK_PRICE);
        }

        // Example: Cache stock scores
        const scoresKey = CACHE_KEYS.stockScores(symbol);
        const scoresData = await this.fetchStockScores(symbol);
        if (scoresData) {
          await this.set(scoresKey, scoresData, CACHE_TTL.STOCK_SCORES);
        }

        console.log(`✅ Cache warmed for ${symbol}`);
      } catch (error) {
        console.error(`Failed to warm cache for ${symbol}:`, error);
      }
    }

    console.log('🔥 Cache warming complete');
  }

  /**
   * Fetch stock price from database
   */
  private async fetchStockPrice(symbol: string): Promise<any> {
    try {
      // TODO: Replace with actual price data query
      const company = await prisma.companies.findFirst({
        where: { symbol },
        select: { id: true, symbol: true, name: true },
      });

      if (!company) return null;

      // Mock price data - replace with actual price_data query
      return {
        symbol,
        price: 100 + Math.random() * 100,
        change: Math.random() * 10 - 5,
        changePercent: Math.random() * 5 - 2.5,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Fetch stock scores from database
   */
  private async fetchStockScores(symbol: string): Promise<any> {
    try {
      // TODO: Replace with actual scores query
      const company = await prisma.companies.findFirst({
        where: { symbol },
        select: { id: true, symbol: true },
      });

      if (!company) return null;

      // Mock scores data - replace with actual composite_scores query
      return {
        symbol,
        qualityScore: Math.floor(Math.random() * 40) + 60,
        growthScore: Math.floor(Math.random() * 40) + 50,
        momentumScore: Math.floor(Math.random() * 40) + 40,
        riskScore: Math.floor(Math.random() * 40) + 30,
        sentimentScore: Math.floor(Math.random() * 40) + 50,
      };
    } catch (error) {
      console.error(`Error fetching scores for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Subscribe to cache invalidation pub/sub channel
   */
  private async subscribeToCacheInvalidation(): Promise<void> {
    try {
      await this.subClient.subscribe('cache:invalidate', (message) => {
        try {
          const { symbol, type } = JSON.parse(message);
          console.log(`📢 Cache invalidation received: ${symbol} - ${type}`);

          // Invalidate specific cache keys based on type
          if (type === 'scores') {
            this.delete(CACHE_KEYS.stockScores(symbol));
            this.delete(CACHE_KEYS.stockDetail(symbol));
          } else if (type === 'price') {
            this.delete(CACHE_KEYS.stockPrice(symbol));
            this.delete(CACHE_KEYS.stockDetail(symbol));
          } else if (type === 'ai_summary') {
            this.delete(CACHE_KEYS.aiSummary(symbol));
            this.delete(CACHE_KEYS.stockDetail(symbol));
          } else if (type === 'technicals') {
            this.delete(CACHE_KEYS.technicals(symbol));
            this.delete(CACHE_KEYS.stockDetail(symbol));
          } else if (type === 'news') {
            this.delete(CACHE_KEYS.news(symbol));
            this.delete(CACHE_KEYS.stockDetail(symbol));
          } else if (type === 'all') {
            // Invalidate all cache entries for this symbol
            this.deletePattern(CACHE_KEYS.stockPattern(symbol));
          }
        } catch (error) {
          console.error('Error processing cache invalidation message:', error);
        }
      });

      console.log('✅ Subscribed to cache:invalidate channel');
    } catch (error) {
      console.error('Failed to subscribe to cache invalidation:', error);
    }
  }

  /**
   * Publish cache invalidation message
   */
  async publishInvalidation(symbol: string, type: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.pubClient.publish(
        'cache:invalidate',
        JSON.stringify({ symbol, type })
      );
      console.log(`📢 Published cache invalidation: ${symbol} - ${type}`);
    } catch (error) {
      console.error('Failed to publish cache invalidation:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : '0.00';

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, errors: 0 };
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      await Promise.all([
        this.client.quit(),
        this.pubClient.quit(),
        this.subClient.quit(),
      ]);
      this.isConnected = false;
      console.log('✅ Cache service disconnected');
    } catch (error) {
      console.error('Error disconnecting cache service:', error);
    }
  }
}

// Singleton instance
let cacheServiceInstance: CacheService | null = null;

/**
 * Get cache service singleton instance
 */
export function getCacheService(): CacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService();
  }
  return cacheServiceInstance;
}

export default getCacheService;
