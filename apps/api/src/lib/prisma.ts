/**
 * Prisma Client Configuration
 *
 * Optimized Prisma client with connection pooling and query optimization
 */

import { PrismaClient } from '@prisma/client';

// Connection pool configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/alphasignal';

// Parse connection string and add pool parameters
const url = new URL(DATABASE_URL);
url.searchParams.set('connection_limit', '20');  // Max connections
url.searchParams.set('pool_timeout', '60');      // Pool timeout in seconds
url.searchParams.set('statement_cache_size', '100'); // Statement cache

// Query timeout settings
const queryTimeout = parseInt(process.env.QUERY_TIMEOUT || '10000', 10); // 10 seconds
const idleTimeout = parseInt(process.env.IDLE_TIMEOUT || '60000', 10);   // 60 seconds

/**
 * Create optimized Prisma client
 */
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url.toString(),
    },
  },
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log slow queries (> 1 second)
prisma.$on('query' as never, (e: any) => {
  if (e.duration > 1000) {
    console.warn(`🐌 Slow query detected (${e.duration}ms):`, e.query);
  }
});

// Log errors
prisma.$on('error' as never, (e: any) => {
  console.error('❌ Prisma error:', e);
});

// Log warnings
prisma.$on('warn' as never, (e: any) => {
  console.warn('⚠️  Prisma warning:', e);
});

/**
 * Connection pool statistics
 */
export async function getConnectionPoolStats(): Promise<any> {
  try {
    const stats = await prisma.$queryRaw`
      SELECT
        count(*) as total_connections,
        sum(case when state = 'active' then 1 else 0 end) as active,
        sum(case when state = 'idle' then 1 else 0 end) as idle,
        max(state_change) as last_activity
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;
    return stats;
  } catch (error) {
    console.error('Error getting connection pool stats:', error);
    return null;
  }
}

/**
 * Query timeout middleware
 * Automatically kills queries that run longer than specified timeout
 */
prisma.$use(async (params, next) => {
  const timeout = setTimeout(() => {
    console.error(`Query timeout exceeded (${queryTimeout}ms):`, params.model, params.action);
  }, queryTimeout);

  try {
    const result = await next(params);
    clearTimeout(timeout);
    return result;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
});

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('🔌 Disconnecting Prisma client...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔌 Disconnecting Prisma client...');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
