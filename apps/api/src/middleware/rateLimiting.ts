/**
 * Rate Limiting Configuration
 *
 * Tier-based rate limits using Redis store
 */

import rateLimit from '@fastify/rate-limit';
import { FastifyInstance, FastifyRequest } from 'fastify';
import Redis from 'ioredis';

// Rate limit tiers (requests per minute, requests per day)
export const RATE_LIMITS = {
  FREE: {
    perMinute: 100,
    perDay: 1000,
  },
  PRO: {
    perMinute: 500,
    perDay: 10000,
  },
  PREMIUM: {
    perMinute: 2000,
    perDay: 50000,
  },
} as const;

export async function setupRateLimiting(fastify: FastifyInstance) {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  // Per-minute rate limiting
  await fastify.register(rateLimit, {
    global: true,
    max: async (request: FastifyRequest) => {
      const user = (request as any).user;
      if (!user) return RATE_LIMITS.FREE.perMinute;

      const tier = user.subscription_tier || 'FREE';
      return RATE_LIMITS[tier as keyof typeof RATE_LIMITS]?.perMinute || RATE_LIMITS.FREE.perMinute;
    },
    timeWindow: '1 minute',
    redis,
    nameSpace: 'rate-limit:minute:',
    skipOnError: false,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    errorResponseBuilder: (request, context) => {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
        retryAfter: Math.ceil(context.ttl / 1000),
      };
    },
  });

  console.log('✅ Rate limiting configured with Redis store');
}

/**
 * Check daily rate limit (called in GraphQL context)
 */
export async function checkDailyRateLimit(
  userId: string,
  tier: 'FREE' | 'PRO' | 'PREMIUM'
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  const key = `rate-limit:daily:${userId}`;
  const limit = RATE_LIMITS[tier].perDay;

  const count = await redis.incr(key);

  // Set expiry on first request of the day
  if (count === 1) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const secondsUntilMidnight = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
    await redis.expire(key, secondsUntilMidnight);
  }

  const ttl = await redis.ttl(key);
  const resetAt = new Date(Date.now() + ttl * 1000);

  await redis.quit();

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}
