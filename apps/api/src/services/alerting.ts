/**
 * Alerting Service
 *
 * Monitors system health and sends alerts for critical issues
 * Alert conditions are checked every 5 minutes via scheduled job
 */

import { PrismaClient, AlertSeverity } from '@prisma/client';
import { getCacheService } from './cache.js';

const prisma = new PrismaClient();
const cacheService = getCacheService();

interface AlertCondition {
  type: string;
  severity: AlertSeverity;
  check: () => Promise<boolean>;
  message: (details?: any) => string;
}

// Store last alert times to prevent spam
const lastAlertTimes = new Map<string, number>();
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if we should send an alert (respect cooldown)
 */
function shouldSendAlert(alertType: string): boolean {
  const lastTime = lastAlertTimes.get(alertType);
  const now = Date.now();

  if (!lastTime || (now - lastTime) > ALERT_COOLDOWN_MS) {
    lastAlertTimes.set(alertType, now);
    return true;
  }

  return false;
}

/**
 * Create an alert in the database
 */
async function createAlert(
  severity: AlertSeverity,
  alertType: string,
  message: string,
  metadata?: any
): Promise<void> {
  try {
    await prisma.alertHistory.create({
      data: {
        severity,
        alertType,
        message,
        metadata: metadata || null,
        acknowledged: false,
      },
    });

    // Log to console based on severity
    const logFn = severity === 'CRITICAL' ? console.error
      : severity === 'WARNING' ? console.warn
      : console.info;

    logFn(`[${severity}] ${alertType}: ${message}`);

    // TODO: Send email if SMTP_HOST is configured
    if (process.env.SMTP_HOST && severity === 'CRITICAL') {
      console.log(`📧 Would send email alert: ${message}`);
      // await sendEmailAlert(severity, alertType, message, metadata);
    }
  } catch (error) {
    console.error('Failed to create alert:', error);
  }
}

/**
 * Check database connection
 */
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check Redis connection
 */
async function checkRedisHealth(): Promise<boolean> {
  try {
    const testKey = 'alert:health:check';
    await cacheService.set(testKey, { timestamp: Date.now() }, 5);
    const testValue = await cacheService.get(testKey);
    return testValue !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Check if Celery workers are active (placeholder)
 */
async function checkWorkersHealth(): Promise<boolean> {
  // TODO: Implement actual Celery worker check
  // For now, always return true
  return true;
}

/**
 * Check error rate
 */
async function checkErrorRate(): Promise<{ isHigh: boolean; rate: number }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const errorCount = await prisma.errorLog.count({
    where: {
      createdAt: {
        gte: oneHourAgo,
      },
      statusCode: {
        gte: 500,
      },
    },
  });

  const totalRequestsLastHour = 100; // TODO: Track actual request count
  const errorPercentage = totalRequestsLastHour > 0
    ? (errorCount / totalRequestsLastHour) * 100
    : 0;

  return {
    isHigh: errorPercentage > 5,
    rate: errorPercentage,
  };
}

/**
 * Check response time
 */
async function checkResponseTime(): Promise<{ isSlow: boolean; avgTime: number }> {
  // TODO: Get from metrics service
  // For now, return placeholder
  return {
    isSlow: false,
    avgTime: 0,
  };
}

/**
 * Check cache hit ratio
 */
async function checkCacheHitRatio(): Promise<{ isLow: boolean; ratio: number }> {
  const cacheStats = cacheService.getStats();
  const hitRatio = parseFloat(cacheStats.hitRate) || 0;

  return {
    isLow: hitRatio < 50,
    ratio: hitRatio,
  };
}

/**
 * Check if price updates are stale (during market hours)
 */
async function checkPriceUpdates(): Promise<{ isStale: boolean; lastUpdate?: Date }> {
  // Check if we're in market hours (9:15 AM - 3:30 PM IST, Mon-Fri)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const hour = istTime.getUTCHours();
  const minute = istTime.getUTCMinutes();
  const day = istTime.getUTCDay();

  const isMarketHours = day >= 1 && day <= 5 && // Monday to Friday
    ((hour === 9 && minute >= 15) || (hour > 9 && hour < 15) || (hour === 15 && minute <= 30));

  if (!isMarketHours) {
    return { isStale: false };
  }

  // TODO: Check actual price update timestamps from price_data table
  // For now, return false
  return { isStale: false };
}

/**
 * Check for new payments
 */
async function checkNewPayments(): Promise<{ hasNew: boolean; count: number }> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const newPayments = await prisma.payment.count({
    where: {
      status: 'SUCCESS',
      createdAt: {
        gte: fiveMinutesAgo,
      },
    },
  });

  return {
    hasNew: newPayments > 0,
    count: newPayments,
  };
}

/**
 * Check for user milestones
 */
async function checkUserMilestones(): Promise<{ hasMilestone: boolean; total: number }> {
  const totalUsers = await prisma.user.count();

  // Check if we just crossed a milestone (every 100 users)
  const milestone = Math.floor(totalUsers / 100) * 100;
  const isAtMilestone = totalUsers === milestone && milestone > 0;

  return {
    hasMilestone: isAtMilestone,
    total: totalUsers,
  };
}

/**
 * Check if daily LLM cost limit exceeded
 */
async function checkLLMCostLimit(): Promise<{ exceeded: boolean; cost: number; limit: number }> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayLLMCosts = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COALESCE(SUM(estimated_cost_usd), 0)::FLOAT as total
    FROM llm_usage
    WHERE created_at >= ${todayStart}
  `;
  const todayCost = todayLLMCosts[0]?.total || 0;

  const dailyLimit = parseFloat(process.env.LLM_DAILY_COST_LIMIT_USD || '100');

  return {
    exceeded: todayCost >= dailyLimit,
    cost: todayCost,
    limit: dailyLimit,
  };
}

/**
 * Define all alert conditions
 */
const alertConditions: AlertCondition[] = [
  // CRITICAL: Database connection failed
  {
    type: 'DATABASE_DOWN',
    severity: 'CRITICAL',
    check: async () => !(await checkDatabaseHealth()),
    message: () => 'Database connection failed. Immediate action required.',
  },

  // CRITICAL: Redis connection failed
  {
    type: 'REDIS_DOWN',
    severity: 'CRITICAL',
    check: async () => !(await checkRedisHealth()),
    message: () => 'Redis connection failed. Caching is unavailable.',
  },

  // CRITICAL: No Celery workers active
  {
    type: 'WORKERS_DOWN',
    severity: 'CRITICAL',
    check: async () => !(await checkWorkersHealth()),
    message: () => 'No Celery workers are active. Background tasks are not being processed.',
  },

  // WARNING: High error rate
  {
    type: 'HIGH_ERROR_RATE',
    severity: 'WARNING',
    check: async () => {
      const result = await checkErrorRate();
      return result.isHigh;
    },
    message: () => {
      return 'Error rate is above 5%. System may be experiencing issues.';
    },
  },

  // WARNING: Slow response time
  {
    type: 'SLOW_RESPONSE_TIME',
    severity: 'WARNING',
    check: async () => {
      const result = await checkResponseTime();
      return result.isSlow;
    },
    message: () => {
      return 'Average response time is above 2 seconds. Performance degradation detected.';
    },
  },

  // WARNING: Low cache hit ratio
  {
    type: 'LOW_CACHE_HIT_RATIO',
    severity: 'WARNING',
    check: async () => {
      const result = await checkCacheHitRatio();
      return result.isLow;
    },
    message: () => {
      return 'Cache hit ratio is below 50%. Consider reviewing cache strategy.';
    },
  },

  // WARNING: Stale price updates during market hours
  {
    type: 'STALE_PRICE_UPDATES',
    severity: 'WARNING',
    check: async () => {
      const result = await checkPriceUpdates();
      return result.isStale;
    },
    message: () => {
      return 'No price updates received in the last 30 minutes during market hours.';
    },
  },

  // INFO: New payment received
  {
    type: 'NEW_PAYMENT',
    severity: 'INFO',
    check: async () => {
      const result = await checkNewPayments();
      return result.hasNew;
    },
    message: () => {
      return 'New payment(s) received.';
    },
  },

  // INFO: User milestone reached
  {
    type: 'USER_MILESTONE',
    severity: 'INFO',
    check: async () => {
      const result = await checkUserMilestones();
      return result.hasMilestone;
    },
    message: () => {
      return 'User milestone reached!';
    },
  },

  // WARNING: Daily LLM cost limit exceeded
  {
    type: 'LLM_COST_LIMIT_EXCEEDED',
    severity: 'WARNING',
    check: async () => {
      const result = await checkLLMCostLimit();
      return result.exceeded;
    },
    message: () => {
      return 'Daily LLM cost limit exceeded. Review usage to optimize costs.';
    },
  },
];

/**
 * Run all alert checks
 */
export async function runAlertChecks(): Promise<void> {
  console.log('🔍 Running alert checks...');

  for (const condition of alertConditions) {
    try {
      const shouldAlert = await condition.check();

      if (shouldAlert && shouldSendAlert(condition.type)) {
        const message = condition.message();
        await createAlert(condition.severity, condition.type, message);
      }
    } catch (error) {
      console.error(`Error checking alert condition ${condition.type}:`, error);
    }
  }

  console.log('✅ Alert checks complete');
}

/**
 * Start scheduled alert monitoring (every 5 minutes)
 */
export function startAlertMonitoring(): void {
  // Run immediately
  runAlertChecks();

  // Then run every 5 minutes
  setInterval(() => {
    runAlertChecks();
  }, 5 * 60 * 1000);

  console.log('🚨 Alert monitoring started (checks every 5 minutes)');
}

/**
 * Get recent alerts
 */
export async function getRecentAlerts(limit: number = 50): Promise<any[]> {
  return await prisma.alertHistory.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: string): Promise<void> {
  await prisma.alertHistory.update({
    where: { id: alertId },
    data: { acknowledged: true },
  });
}

/**
 * Get unacknowledged alerts count
 */
export async function getUnacknowledgedCount(): Promise<number> {
  return await prisma.alertHistory.count({
    where: { acknowledged: false },
  });
}
