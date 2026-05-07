/**
 * Admin Dashboard Routes
 *
 * Protected endpoints for system monitoring and administration
 * Requires ADMIN_API_KEY for authentication
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getRecentAlerts, acknowledgeAlert, getUnacknowledgedCount } from '../services/alerting.js';
import { getCacheService } from '../services/cache.js';

const prisma = new PrismaClient();
const cacheService = getCacheService();

/**
 * Middleware to verify admin API key
 */
async function verifyAdminKey(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-admin-api-key'] as string;
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    console.warn('ADMIN_API_KEY not configured');
    return reply.status(500).send({
      error: 'Admin API not configured',
    });
  }

  if (!apiKey || apiKey !== expectedKey) {
    return reply.status(401).send({
      error: 'Unauthorized - Invalid or missing admin API key',
    });
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  /**
   * GET /admin/dashboard
   * Returns comprehensive system metrics and statistics
   */
  fastify.get(
    '/admin/dashboard',
    { preHandler: verifyAdminKey },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Calculate uptime
        const uptimeHours = process.uptime() / 3600;

        // Check system status
        let db_status: 'healthy' | 'degraded' | 'down' = 'healthy';
        try {
          await prisma.$queryRaw`SELECT 1`;
        } catch (error) {
          console.error('Database health check failed:', error);
          db_status = 'down';
        }

        let redis_status: 'healthy' | 'degraded' | 'down' = 'healthy';
        try {
          const testKey = 'health:check';
          await cacheService.set(testKey, { timestamp: Date.now() }, 5);
          const testValue = await cacheService.get(testKey);
          if (!testValue) {
            redis_status = 'degraded';
          }
        } catch (error) {
          console.error('Redis health check failed:', error);
          redis_status = 'down';
        }

        const api_status = db_status === 'down' ? 'down'
          : (db_status === 'degraded' || redis_status === 'degraded') ? 'degraded'
          : 'healthy';

        const workers_status: 'healthy' | 'degraded' | 'down' = 'healthy';

        // Get user statistics
        const [totalUsers, freeUsers, proUsers, premiumUsers] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { tier: 'FREE' } }),
          prisma.user.count({ where: { tier: 'PRO' } }),
          prisma.user.count({ where: { tier: 'PREMIUM' } }),
        ]);

        // Users registered today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const registeredToday = await prisma.user.count({
          where: {
            createdAt: {
              gte: todayStart,
            },
          },
        });

        // Active users today (users who logged in today)
        const activeToday = await prisma.user.count({
          where: {
            lastLoginAt: {
              gte: todayStart,
            },
          },
        });

        // Revenue statistics
        const activeSubscriptions = await prisma.subscription.findMany({
          where: {
            status: 'ACTIVE',
          },
          include: {
            plan: true,
          },
        });

        // Calculate MRR (Monthly Recurring Revenue)
        let mrr = 0;
        for (const sub of activeSubscriptions) {
          const planPrice = sub.plan.isLaunchActive
            ? sub.plan.launchPrice
            : sub.plan.regularPrice;

          if (sub.plan.billingCycle === 'MONTHLY') {
            mrr += planPrice;
          } else if (sub.plan.billingCycle === 'ANNUAL') {
            mrr += Math.floor(planPrice / 12);
          }
        }

        // Convert from paise to rupees
        mrr = Math.floor(mrr / 100);

        // Payments today
        const paymentsToday = await prisma.payment.count({
          where: {
            status: 'SUCCESS',
            paidAt: {
              gte: todayStart,
            },
          },
        });

        // Payments this month
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const paymentsThisMonth = await prisma.payment.count({
          where: {
            status: 'SUCCESS',
            paidAt: {
              gte: monthStart,
            },
          },
        });

        // Failed payments
        const failedPayments = await prisma.payment.count({
          where: {
            status: 'FAILED',
          },
        });

        // Content statistics
        const [companiesTracked, aiSummariesTotal] = await Promise.all([
          prisma.company.count({ where: { isActive: true } }),
          prisma.aiSummary.count(),
        ]);

        // Weekly reports published (placeholder - implement when reports are added)
        const weeklyReportsPublished = 0;

        // Performance metrics
        const errorsToday = await prisma.errorLog.count({
          where: {
            createdAt: {
              gte: todayStart,
            },
          },
        });

        const cacheStats = cacheService.getStats();

        const performance = {
          avg_response_time_ms: 0, // TODO: Track from metrics
          p95_response_time_ms: 0, // TODO: Track from metrics
          cache_hit_ratio: parseFloat(cacheStats.hitRate) || 0,
          errors_today: errorsToday,
        };

        // Pipeline status (last update timestamps)
        const [lastPriceUpdate, lastNewsIngestion, lastScoreComputation] = await Promise.all([
          // TODO: Query price_data table for last update
          Promise.resolve(new Date()),
          prisma.newsArticle.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
          prisma.compositeScore.findFirst({
            orderBy: { computedAt: 'desc' },
            select: { computedAt: true },
          }),
        ]);

        // Top stocks today (by page views)
        const topStocksToday = await prisma.pageAnalytics.groupBy({
          by: ['eventData'],
          where: {
            eventName: 'stock_view',
            createdAt: {
              gte: todayStart,
            },
          },
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 10,
        });

        // Extract symbols from eventData
        const topStocks = topStocksToday
          .map((item: any) => {
            try {
              const eventData = item.eventData as any;
              return {
                symbol: eventData?.symbol || 'UNKNOWN',
                views: item._count.id,
              };
            } catch {
              return null;
            }
          })
          .filter((item): item is { symbol: string; views: number } => item !== null);

        // ============================================
        // LLM COST TRACKING
        // ============================================

        // Today's LLM costs
        const todayLLMCosts = await prisma.$queryRaw<Array<{ total: number }>>`
          SELECT COALESCE(SUM(estimated_cost_usd), 0)::FLOAT as total
          FROM llm_usage
          WHERE created_at >= ${todayStart}
        `;
        const todayLLM = todayLLMCosts[0]?.total || 0;

        // This week's LLM costs
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);

        const weekLLMCosts = await prisma.$queryRaw<Array<{ total: number }>>`
          SELECT COALESCE(SUM(estimated_cost_usd), 0)::FLOAT as total
          FROM llm_usage
          WHERE created_at >= ${weekStart}
        `;
        const weekLLM = weekLLMCosts[0]?.total || 0;

        // This month's LLM costs
        const monthLLMCosts = await prisma.$queryRaw<Array<{ total: number }>>`
          SELECT COALESCE(SUM(estimated_cost_usd), 0)::FLOAT as total
          FROM llm_usage
          WHERE created_at >= ${monthStart}
        `;
        const monthLLM = monthLLMCosts[0]?.total || 0;

        // Today's call count
        const callsToday = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::BIGINT as count
          FROM llm_usage
          WHERE created_at >= ${todayStart}
        `;
        const llmCallsToday = Number(callsToday[0]?.count || 0);

        // Average cost per summary
        const avgSummaryCosts = await prisma.$queryRaw<Array<{ avg: number }>>`
          SELECT COALESCE(AVG(estimated_cost_usd), 0)::FLOAT as avg
          FROM llm_usage
          WHERE task_type = 'SUMMARY'
        `;
        const avgCostPerSummary = avgSummaryCosts[0]?.avg || 0;

        // Project monthly cost based on current pace
        const currentDay = new Date().getDate();
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const projectedMonthlyLLM = currentDay > 0
          ? (monthLLM / currentDay) * daysInMonth
          : 0;

        // Get unacknowledged alerts count
        const unacknowledgedAlerts = await getUnacknowledgedCount();

        return reply.send({
          success: true,
          timestamp: new Date().toISOString(),
          system: {
            api_status,
            db_status,
            redis_status,
            workers_status,
            uptime_hours: parseFloat(uptimeHours.toFixed(2)),
            unacknowledged_alerts: unacknowledgedAlerts,
          },
          llm_costs: {
            today_usd: parseFloat(todayLLM.toFixed(2)),
            this_week_usd: parseFloat(weekLLM.toFixed(2)),
            this_month_usd: parseFloat(monthLLM.toFixed(2)),
            calls_today: llmCallsToday,
            avg_cost_per_summary_usd: parseFloat(avgCostPerSummary.toFixed(4)),
            projected_monthly_usd: parseFloat(projectedMonthlyLLM.toFixed(2)),
          },
          users: {
            total: totalUsers,
            free: freeUsers,
            pro: proUsers,
            premium: premiumUsers,
            registered_today: registeredToday,
            active_today: activeToday,
          },
          revenue: {
            mrr,
            payments_today: paymentsToday,
            payments_this_month: paymentsThisMonth,
            failed_payments: failedPayments,
          },
          content: {
            companies_tracked: companiesTracked,
            ai_summaries_total: aiSummariesTotal,
            weekly_reports_published: weeklyReportsPublished,
          },
          performance,
          pipelines: {
            last_price_update: lastPriceUpdate.toISOString(),
            last_news_ingestion: lastNewsIngestion?.createdAt.toISOString() || null,
            last_score_computation: lastScoreComputation?.computedAt.toISOString() || null,
          },
          top_stocks_today: topStocks,
        });
      } catch (error) {
        fastify.log.error('Error fetching admin dashboard:', error);
        return reply.status(500).send({
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /admin/alerts
   * Get recent alerts
   */
  fastify.get(
    '/admin/alerts',
    { preHandler: verifyAdminKey },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const queryParams = request.query as { limit?: string; severity?: string };
        const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 50;

        let alerts;
        if (queryParams.severity) {
          alerts = await prisma.alertHistory.findMany({
            where: {
              severity: queryParams.severity as any,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: limit,
          });
        } else {
          alerts = await getRecentAlerts(limit);
        }

        return reply.send({
          success: true,
          count: alerts.length,
          alerts,
        });
      } catch (error) {
        fastify.log.error('Error fetching alerts:', error);
        return reply.status(500).send({
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * POST /admin/alerts/:id/acknowledge
   * Acknowledge an alert
   */
  fastify.post(
    '/admin/alerts/:id/acknowledge',
    { preHandler: verifyAdminKey },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const params = request.params as { id: string };

        await acknowledgeAlert(params.id);

        return reply.send({
          success: true,
          message: 'Alert acknowledged',
        });
      } catch (error) {
        fastify.log.error('Error acknowledging alert:', error);
        return reply.status(500).send({
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /admin/errors
   * Get recent error logs
   */
  fastify.get(
    '/admin/errors',
    { preHandler: verifyAdminKey },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const queryParams = request.query as { limit?: string; statusCode?: string };
        const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 100;

        const where: any = {};
        if (queryParams.statusCode) {
          where.statusCode = parseInt(queryParams.statusCode, 10);
        }

        const errors = await prisma.errorLog.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          select: {
            id: true,
            endpoint: true,
            method: true,
            statusCode: true,
            errorType: true,
            errorMessage: true,
            userId: true,
            createdAt: true,
          },
        });

        return reply.send({
          success: true,
          count: errors.length,
          errors,
        });
      } catch (error) {
        fastify.log.error('Error fetching error logs:', error);
        return reply.status(500).send({
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /admin/users
   * Get user list with filtering and pagination
   */
  fastify.get(
    '/admin/users',
    { preHandler: verifyAdminKey },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const queryParams = request.query as {
          limit?: string;
          offset?: string;
          tier?: string;
          search?: string;
        };

        const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 50;
        const offset = queryParams.offset ? parseInt(queryParams.offset, 10) : 0;

        const where: any = {};
        if (queryParams.tier) {
          where.tier = queryParams.tier;
        }
        if (queryParams.search) {
          where.OR = [
            { email: { contains: queryParams.search, mode: 'insensitive' } },
            { name: { contains: queryParams.search, mode: 'insensitive' } },
          ];
        }

        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where,
            select: {
              id: true,
              email: true,
              name: true,
              tier: true,
              isActive: true,
              createdAt: true,
              lastLoginAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: limit,
            skip: offset,
          }),
          prisma.user.count({ where }),
        ]);

        return reply.send({
          success: true,
          total,
          limit,
          offset,
          users,
        });
      } catch (error) {
        fastify.log.error('Error fetching users:', error);
        return reply.status(500).send({
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /admin/subscriptions
   * Get subscription list
   */
  fastify.get(
    '/admin/subscriptions',
    { preHandler: verifyAdminKey },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const queryParams = request.query as {
          limit?: string;
          status?: string;
        };

        const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 50;

        const where: any = {};
        if (queryParams.status) {
          where.status = queryParams.status;
        }

        const subscriptions = await prisma.subscription.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            plan: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
        });

        return reply.send({
          success: true,
          count: subscriptions.length,
          subscriptions,
        });
      } catch (error) {
        fastify.log.error('Error fetching subscriptions:', error);
        return reply.status(500).send({
          error: 'Internal server error',
        });
      }
    }
  );
}
