/**
 * Analytics Routes
 *
 * Handles tracking of user events and page analytics
 * Stores data in the page_analytics table
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for analytics events
const analyticsEventSchema = z.object({
  eventName: z.string().min(1, 'Event name is required'),
  eventData: z.record(z.any()).optional(),
  pageUrl: z.string().url('Invalid page URL'),
  referrer: z.string().optional(),
  userAgent: z.string().min(1, 'User agent is required'),
  sessionId: z.string().min(1, 'Session ID is required'),
  userId: z.string().uuid().optional(),
});

interface AnalyticsEventBody {
  eventName: string;
  eventData?: Record<string, any>;
  pageUrl: string;
  referrer?: string;
  userAgent: string;
  sessionId: string;
  userId?: string;
}

export async function analyticsRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/analytics
   * Track an analytics event
   */
  fastify.post('/api/analytics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = analyticsEventSchema.parse(request.body) as AnalyticsEventBody;

      // Store the analytics event
      await prisma.pageAnalytics.create({
        data: {
          userId: body.userId || null,
          sessionId: body.sessionId,
          eventName: body.eventName,
          eventData: body.eventData || null,
          pageUrl: body.pageUrl,
          referrer: body.referrer || null,
          userAgent: body.userAgent,
        },
      });

      // Return success (no need to send back data)
      return reply.status(201).send({
        success: true,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error('Analytics tracking error:', error);

      // Don't fail the request - just log and return success
      // This ensures analytics failures don't impact user experience
      return reply.status(201).send({
        success: true,
      });
    }
  });

  /**
   * GET /api/analytics/stats
   * Get analytics statistics (admin/internal use)
   * Protected route - requires authentication
   */
  fastify.get('/api/analytics/stats', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = request.user as { userId: string; tier: string };

      // Only allow admin/premium users to view stats (you can adjust this)
      if (decoded.tier !== 'PREMIUM') {
        return reply.status(403).send({
          error: 'Access denied',
        });
      }

      // Get date range from query params
      const queryParams = request.query as { startDate?: string; endDate?: string };
      const startDate = queryParams.startDate
        ? new Date(queryParams.startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const endDate = queryParams.endDate
        ? new Date(queryParams.endDate)
        : new Date();

      // Get event counts
      const eventCounts = await prisma.pageAnalytics.groupBy({
        by: ['eventName'],
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      // Get unique users and sessions
      const uniqueUsers = await prisma.pageAnalytics.findMany({
        where: {
          userId: { not: null },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      const uniqueSessions = await prisma.pageAnalytics.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          sessionId: true,
        },
        distinct: ['sessionId'],
      });

      // Get top pages
      const topPages = await prisma.pageAnalytics.groupBy({
        by: ['pageUrl'],
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      });

      return reply.send({
        success: true,
        stats: {
          dateRange: {
            start: startDate,
            end: endDate,
          },
          totalEvents: eventCounts.reduce((sum, e) => sum + e._count.id, 0),
          uniqueUsers: uniqueUsers.length,
          uniqueSessions: uniqueSessions.length,
          eventBreakdown: eventCounts.map(e => ({
            eventName: e.eventName,
            count: e._count.id,
          })),
          topPages: topPages.map(p => ({
            pageUrl: p.pageUrl,
            count: p._count.id,
          })),
        },
      });
    } catch (error) {
      fastify.log.error('Error fetching analytics stats:', error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  /**
   * GET /api/analytics/events/:eventName
   * Get details for a specific event type
   * Protected route - requires authentication
   */
  fastify.get('/api/analytics/events/:eventName', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = request.user as { userId: string; tier: string };
      const params = request.params as { eventName: string };

      // Only allow admin/premium users to view event details
      if (decoded.tier !== 'PREMIUM') {
        return reply.status(403).send({
          error: 'Access denied',
        });
      }

      const queryParams = request.query as { limit?: string };
      const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 100;

      // Get recent events of this type
      const events = await prisma.pageAnalytics.findMany({
        where: {
          eventName: params.eventName,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        select: {
          id: true,
          userId: true,
          sessionId: true,
          eventData: true,
          pageUrl: true,
          createdAt: true,
        },
      });

      return reply.send({
        success: true,
        eventName: params.eventName,
        count: events.length,
        events,
      });
    } catch (error) {
      fastify.log.error('Error fetching event details:', error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });
}
