/**
 * Health Check Routes
 *
 * Provides comprehensive health monitoring endpoints for:
 * - API status (uptime, memory, version)
 * - Database connectivity (PostgreSQL)
 * - Redis connectivity
 * - Celery worker status (via Redis)
 * - Full system health check
 *
 * All endpoints are public but rate-limited (10 req/min per IP)
 * Returns 200 for OK, 503 for errors
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import rateLimit from '@fastify/rate-limit';

const prisma = new PrismaClient();
const startTime = Date.now();

// Track system version (from package.json or environment)
const API_VERSION = process.env.API_VERSION || '1.0.0';

/**
 * Health status interface
 */
interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  [key: string]: any;
}

/**
 * Get current memory usage
 */
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
  };
}

/**
 * Get system uptime in seconds
 */
function getUptime(): number {
  return Math.floor((Date.now() - startTime) / 1000);
}

/**
 * Check database connection and latency
 */
async function checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      status: 'ok',
      latency,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/**
 * Check Redis connection and latency
 */
async function checkRedis(): Promise<{ status: string; latency?: number; error?: string }> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = createClient({ url: redisUrl });

  try {
    const start = Date.now();
    await client.connect();
    await client.ping();
    const latency = Date.now() - start;
    await client.quit();

    return {
      status: 'ok',
      latency,
    };
  } catch (error) {
    try {
      await client.quit();
    } catch {}

    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown Redis error',
    };
  }
}

/**
 * Check Celery worker status via Redis
 * Celery workers register their heartbeat in Redis
 */
async function checkWorkers(): Promise<{
  status: string;
  workers?: number;
  active?: boolean;
  error?: string;
}> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = createClient({ url: redisUrl });

  try {
    await client.connect();

    // Check for active Celery workers
    // Celery stores worker stats in celery:* keys
    const keys = await client.keys('celery:worker:*');
    const workerCount = keys.length;

    await client.quit();

    return {
      status: workerCount > 0 ? 'ok' : 'no_workers',
      workers: workerCount,
      active: workerCount > 0,
    };
  } catch (error) {
    try {
      await client.quit();
    } catch {}

    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown worker check error',
    };
  }
}

/**
 * Register health check routes
 */
export async function healthRoutes(fastify: FastifyInstance) {
  // Apply rate limiting to all health endpoints (10 req/min per IP)
  await fastify.register(rateLimit, {
    max: 10,
    timeWindow: '1 minute',
    skipOnError: false,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });

  /**
   * GET /health
   * Basic API health check with uptime, memory, and version
   */
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const health: HealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: getUptime(),
      version: API_VERSION,
      memory: getMemoryUsage(),
      environment: process.env.NODE_ENV || 'development',
    };

    return reply.code(200).send(health);
  });

  /**
   * GET /health/db
   * Database connection check with latency
   */
  fastify.get('/health/db', async (request: FastifyRequest, reply: FastifyReply) => {
    const dbCheck = await checkDatabase();

    const response = {
      service: 'database',
      timestamp: new Date().toISOString(),
      ...dbCheck,
    };

    const statusCode = dbCheck.status === 'ok' ? 200 : 503;
    return reply.code(statusCode).send(response);
  });

  /**
   * GET /health/redis
   * Redis connection check with latency
   */
  fastify.get('/health/redis', async (request: FastifyRequest, reply: FastifyReply) => {
    const redisCheck = await checkRedis();

    const response = {
      service: 'redis',
      timestamp: new Date().toISOString(),
      ...redisCheck,
    };

    const statusCode = redisCheck.status === 'ok' ? 200 : 503;
    return reply.code(statusCode).send(response);
  });

  /**
   * GET /health/workers
   * Celery worker status check via Redis
   */
  fastify.get('/health/workers', async (request: FastifyRequest, reply: FastifyReply) => {
    const workersCheck = await checkWorkers();

    const response = {
      service: 'celery_workers',
      timestamp: new Date().toISOString(),
      ...workersCheck,
    };

    const statusCode = workersCheck.status === 'ok' ? 200 : 503;
    return reply.code(statusCode).send(response);
  });

  /**
   * GET /health/full
   * Combined status of all system components
   */
  fastify.get('/health/full', async (request: FastifyRequest, reply: FastifyReply) => {
    // Run all checks in parallel
    const [dbCheck, redisCheck, workersCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkWorkers(),
    ]);

    // Determine overall status
    const hasError = dbCheck.status === 'error' || redisCheck.status === 'error';
    const isDegraded = workersCheck.status === 'no_workers' || workersCheck.status === 'error';

    let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';
    if (hasError) {
      overallStatus = 'error';
    } else if (isDegraded) {
      overallStatus = 'degraded';
    }

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: getUptime(),
      version: API_VERSION,
      environment: process.env.NODE_ENV || 'development',
      memory: getMemoryUsage(),
      checks: {
        database: dbCheck,
        redis: redisCheck,
        workers: workersCheck,
      },
    };

    const statusCode = overallStatus === 'ok' ? 200 : 503;
    return reply.code(statusCode).send(response);
  });

  fastify.log.info('✅ Health check routes registered');
}
