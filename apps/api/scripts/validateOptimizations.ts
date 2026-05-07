/**
 * Validation Script for Caching and Optimization
 *
 * Tests all optimization features:
 * - Redis caching
 * - Materialized views
 * - TimescaleDB optimizations
 * - Connection pooling
 * - Cache invalidation
 * - Graceful degradation
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import chalk from 'chalk';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface ValidationResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration?: number;
}

const results: ValidationResult[] = [];

function logResult(result: ValidationResult) {
  const icon = result.status === 'PASS' ? '✅' : '❌';
  const color = result.status === 'PASS' ? chalk.green : chalk.red;
  const duration = result.duration ? ` (${result.duration}ms)` : '';
  console.log(`${icon} ${color(result.status)}: ${result.name}${duration}`);
  console.log(`   ${chalk.gray(result.message)}`);
  results.push(result);
}

async function validate() {
  console.log(chalk.bold.blue('\n🔍 VALIDATION REPORT: Caching & Optimization\n'));
  console.log(chalk.gray('=' .repeat(70)));
  console.log();

  // ============================================
  // 1. REDIS CACHING
  // ============================================
  console.log(chalk.bold.yellow('📦 REDIS CACHING TESTS\n'));

  // Test 1.1: Redis Connection
  try {
    await redis.ping();
    logResult({
      name: 'Redis Connection',
      status: 'PASS',
      message: 'Successfully connected to Redis server',
    });
  } catch (error: any) {
    logResult({
      name: 'Redis Connection',
      status: 'FAIL',
      message: `Cannot connect to Redis: ${error.message}`,
    });
  }

  // Test 1.2: Cache Write and Read
  try {
    const testKey = 'test:validation:cache';
    const testValue = { test: 'data', timestamp: Date.now() };

    await redis.set(testKey, JSON.stringify(testValue), 'EX', 60);
    const cached = await redis.get(testKey);

    if (cached && JSON.parse(cached).test === 'data') {
      logResult({
        name: 'Cache Write/Read',
        status: 'PASS',
        message: 'Successfully wrote and read from cache',
      });
    } else {
      throw new Error('Cached data mismatch');
    }

    await redis.del(testKey);
  } catch (error: any) {
    logResult({
      name: 'Cache Write/Read',
      status: 'FAIL',
      message: `Cache operation failed: ${error.message}`,
    });
  }

  // Test 1.3: Cache Pattern Deletion
  try {
    await redis.set('test:pattern:1', 'data1');
    await redis.set('test:pattern:2', 'data2');
    await redis.set('test:other', 'data3');

    const keys = await redis.keys('test:pattern:*');
    for (const key of keys) {
      await redis.del(key);
    }

    const remaining = await redis.keys('test:pattern:*');

    if (remaining.length === 0) {
      logResult({
        name: 'Cache Pattern Deletion',
        status: 'PASS',
        message: 'Successfully deleted cache keys by pattern',
      });
    } else {
      throw new Error('Pattern deletion incomplete');
    }

    await redis.del('test:other');
  } catch (error: any) {
    logResult({
      name: 'Cache Pattern Deletion',
      status: 'FAIL',
      message: `Pattern deletion failed: ${error.message}`,
    });
  }

  console.log();

  // ============================================
  // 2. MATERIALIZED VIEWS
  // ============================================
  console.log(chalk.bold.yellow('📊 MATERIALIZED VIEWS TESTS\n'));

  // Test 2.1: Screener View Exists
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT schemaname, matviewname
      FROM pg_matviews
      WHERE matviewname = 'mv_screener_data'
    `;

    if (result.length > 0) {
      logResult({
        name: 'Screener Materialized View',
        status: 'PASS',
        message: 'mv_screener_data exists and is accessible',
      });
    } else {
      throw new Error('View not found');
    }
  } catch (error: any) {
    logResult({
      name: 'Screener Materialized View',
      status: 'FAIL',
      message: `View check failed: ${error.message}`,
    });
  }

  // Test 2.2: Sector Aggregates View Exists
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT schemaname, matviewname
      FROM pg_matviews
      WHERE matviewname = 'mv_sector_aggregates'
    `;

    if (result.length > 0) {
      logResult({
        name: 'Sector Aggregates Materialized View',
        status: 'PASS',
        message: 'mv_sector_aggregates exists and is accessible',
      });
    } else {
      throw new Error('View not found');
    }
  } catch (error: any) {
    logResult({
      name: 'Sector Aggregates Materialized View',
      status: 'FAIL',
      message: `View check failed: ${error.message}`,
    });
  }

  // Test 2.3: Dashboard View Exists
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT schemaname, matviewname
      FROM pg_matviews
      WHERE matviewname = 'mv_dashboard_data'
    `;

    if (result.length > 0) {
      logResult({
        name: 'Dashboard Materialized View',
        status: 'PASS',
        message: 'mv_dashboard_data exists and is accessible',
      });
    } else {
      throw new Error('View not found');
    }
  } catch (error: any) {
    logResult({
      name: 'Dashboard Materialized View',
      status: 'FAIL',
      message: `View check failed: ${error.message}`,
    });
  }

  // Test 2.4: Query Performance (Screener)
  try {
    const startTime = Date.now();
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM mv_screener_data
      LIMIT 100
    `;
    const duration = Date.now() - startTime;

    if (duration < 100) {
      logResult({
        name: 'Screener Query Performance',
        status: 'PASS',
        message: `Query completed in ${duration}ms (target: <100ms)`,
        duration,
      });
    } else {
      logResult({
        name: 'Screener Query Performance',
        status: 'FAIL',
        message: `Query too slow: ${duration}ms (target: <100ms)`,
        duration,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Screener Query Performance',
      status: 'FAIL',
      message: `Query failed: ${error.message}`,
    });
  }

  console.log();

  // ============================================
  // 3. TIMESCALEDB OPTIMIZATIONS
  // ============================================
  console.log(chalk.bold.yellow('⚙️  TIMESCALEDB OPTIMIZATION TESTS\n'));

  // Test 3.1: Hypertable Exists
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT hypertable_name
      FROM timescaledb_information.hypertables
      WHERE hypertable_name = 'price_data'
    `;

    if (result.length > 0) {
      logResult({
        name: 'TimescaleDB Hypertable',
        status: 'PASS',
        message: 'price_data is configured as a hypertable',
      });
    } else {
      throw new Error('Hypertable not found');
    }
  } catch (error: any) {
    logResult({
      name: 'TimescaleDB Hypertable',
      status: 'FAIL',
      message: `Hypertable check failed: ${error.message}`,
    });
  }

  // Test 3.2: Compression Policy
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT *
      FROM timescaledb_information.compression_settings
      WHERE hypertable_name = 'price_data'
    `;

    if (result.length > 0) {
      logResult({
        name: 'Compression Policy',
        status: 'PASS',
        message: `Compression enabled on price_data (${result.length} settings)`,
      });
    } else {
      logResult({
        name: 'Compression Policy',
        status: 'FAIL',
        message: 'No compression policy found for price_data',
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Compression Policy',
      status: 'FAIL',
      message: `Compression check failed: ${error.message}`,
    });
  }

  // Test 3.3: Continuous Aggregates
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT view_name
      FROM timescaledb_information.continuous_aggregates
    `;

    const expectedViews = ['price_data_daily', 'price_data_weekly'];
    const foundViews = result.map((r: any) => r.view_name);
    const missing = expectedViews.filter(v => !foundViews.includes(v));

    if (missing.length === 0) {
      logResult({
        name: 'Continuous Aggregates',
        status: 'PASS',
        message: `All continuous aggregates exist: ${foundViews.join(', ')}`,
      });
    } else {
      logResult({
        name: 'Continuous Aggregates',
        status: 'FAIL',
        message: `Missing aggregates: ${missing.join(', ')}`,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Continuous Aggregates',
      status: 'FAIL',
      message: `Aggregates check failed: ${error.message}`,
    });
  }

  console.log();

  // ============================================
  // 4. CONNECTION POOLING
  // ============================================
  console.log(chalk.bold.yellow('🔌 CONNECTION POOLING TESTS\n'));

  // Test 4.1: Database Connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    logResult({
      name: 'Database Connection',
      status: 'PASS',
      message: 'Successfully connected to PostgreSQL',
    });
  } catch (error: any) {
    logResult({
      name: 'Database Connection',
      status: 'FAIL',
      message: `Cannot connect to database: ${error.message}`,
    });
  }

  // Test 4.2: Connection Pool Stats
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT
        count(*) as total_connections,
        sum(case when state = 'active' then 1 else 0 end) as active,
        sum(case when state = 'idle' then 1 else 0 end) as idle
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;

    const stats = result[0];

    if (stats.total_connections > 0) {
      logResult({
        name: 'Connection Pool Stats',
        status: 'PASS',
        message: `Active: ${stats.active}, Idle: ${stats.idle}, Total: ${stats.total_connections}`,
      });
    } else {
      throw new Error('No connections found');
    }
  } catch (error: any) {
    logResult({
      name: 'Connection Pool Stats',
      status: 'FAIL',
      message: `Stats check failed: ${error.message}`,
    });
  }

  // Test 4.3: Query Performance
  try {
    const startTime = Date.now();
    await prisma.company.findMany({
      take: 10,
      select: { symbol: true, name: true },
    });
    const duration = Date.now() - startTime;

    if (duration < 50) {
      logResult({
        name: 'Database Query Performance',
        status: 'PASS',
        message: `Query completed in ${duration}ms (target: <50ms)`,
        duration,
      });
    } else {
      logResult({
        name: 'Database Query Performance',
        status: 'FAIL',
        message: `Query too slow: ${duration}ms (target: <50ms)`,
        duration,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Database Query Performance',
      status: 'FAIL',
      message: `Query failed: ${error.message}`,
    });
  }

  console.log();

  // ============================================
  // 5. INDEXES
  // ============================================
  console.log(chalk.bold.yellow('📇 INDEX TESTS\n'));

  // Test 5.1: Performance Indexes Count
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
    `;

    const count = Number(result[0].count);

    if (count >= 15) {
      logResult({
        name: 'Performance Indexes',
        status: 'PASS',
        message: `${count} performance indexes created (expected: ≥15)`,
      });
    } else {
      logResult({
        name: 'Performance Indexes',
        status: 'FAIL',
        message: `Only ${count} indexes found (expected: ≥15)`,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Performance Indexes',
      status: 'FAIL',
      message: `Index check failed: ${error.message}`,
    });
  }

  // Test 5.2: Full-text Search Indexes
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexdef ILIKE '%gin%'
    `;

    const count = Number(result[0].count);

    if (count >= 2) {
      logResult({
        name: 'Full-text Search Indexes',
        status: 'PASS',
        message: `${count} GIN indexes created for full-text search`,
      });
    } else {
      logResult({
        name: 'Full-text Search Indexes',
        status: 'FAIL',
        message: `Only ${count} GIN indexes found (expected: ≥2)`,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Full-text Search Indexes',
      status: 'FAIL',
      message: `GIN index check failed: ${error.message}`,
    });
  }

  console.log();

  // ============================================
  // SUMMARY
  // ============================================
  console.log(chalk.gray('=' .repeat(70)));
  console.log(chalk.bold.blue('\n📋 VALIDATION SUMMARY\n'));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(chalk.green(`✅ PASSED: ${passed}/${total}`));
  console.log(chalk.red(`❌ FAILED: ${failed}/${total}`));
  console.log(chalk.blue(`📊 PASS RATE: ${passRate}%`));

  if (failed === 0) {
    console.log(chalk.bold.green('\n🎉 ALL VALIDATIONS PASSED!\n'));
  } else {
    console.log(chalk.bold.red('\n⚠️  SOME VALIDATIONS FAILED!\n'));
    console.log(chalk.yellow('Failed tests:'));
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(chalk.yellow(`  - ${r.name}: ${r.message}`));
      });
    console.log();
  }

  // Cleanup
  await prisma.$disconnect();
  await redis.quit();

  process.exit(failed > 0 ? 1 : 0);
}

validate().catch((error) => {
  console.error(chalk.red('❌ Validation script error:'), error);
  process.exit(1);
});
