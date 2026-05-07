/**
 * REST API Routes for Stock Knowledge Repository
 *
 * Provides endpoints for:
 * - GET /api/stock-events - List stock events with filtering
 * - GET /api/stock-events/:id - Get single stock event
 * - GET /api/companies/:companyId/events - Get events for a company
 * - GET /api/companies/:companyId/milestones - Get company milestones
 * - GET /api/companies/:companyId/profile - Get company profile
 * - GET /api/companies/:companyId/timeline - Get timeline summary
 * - GET /api/stock-events/search - Search events across companies
 * - POST /api/stock-events - Create new stock event (admin)
 * - PATCH /api/stock-events/:id - Update stock event (admin)
 * - POST /api/stock-events/:id/verify - Verify stock event (admin)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const listEventsQuerySchema = z.object({
  eventTypes: z.string().optional(),
  impactAssessments: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  tags: z.string().optional(),
  fiscalYear: z.string().transform((val) => parseInt(val, 10)).optional(),
  fiscalQuarter: z.string().transform((val) => parseInt(val, 10)).optional(),
  isVerified: z.string().transform((val) => val === 'true').optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).default('20'),
  offset: z.string().transform((val) => parseInt(val, 10)).default('0'),
});

const eventIdSchema = z.object({
  id: z.string().uuid(),
});

const companyIdSchema = z.object({
  companyId: z.string().uuid(),
});

const companyProfileQuerySchema = z.object({
  sectionType: z.enum([
    'BUSINESS_MODEL',
    'PRODUCTS_SERVICES',
    'COMPETITIVE_POSITION',
    'MANAGEMENT_TEAM',
    'FINANCIAL_HIGHLIGHTS',
    'GROWTH_DRIVERS',
    'KEY_RISKS',
  ]).optional(),
});

const timelineSummaryQuerySchema = z.object({
  periodType: z.enum([
    'LAST_7_DAYS',
    'LAST_30_DAYS',
    'LAST_90_DAYS',
    'LAST_6_MONTHS',
    'LAST_1_YEAR',
    'LAST_3_YEARS',
    'LAST_5_YEARS',
    'ALL_TIME',
  ]).default('LAST_30_DAYS'),
});

const searchEventsQuerySchema = z.object({
  query: z.string().min(2),
  eventTypes: z.string().optional(),
  impactAssessments: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.string().optional(),
  fiscalYear: z.string().transform((val) => parseInt(val, 10)).optional(),
  fiscalQuarter: z.string().transform((val) => parseInt(val, 10)).optional(),
  isVerified: z.string().transform((val) => val === 'true').optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).default('20'),
  offset: z.string().transform((val) => parseInt(val, 10)).default('0'),
});

const createStockEventSchema = z.object({
  companyId: z.string().uuid(),
  eventType: z.string(),
  eventDate: z.string(),
  title: z.string().min(1),
  summary: z.string().min(100).max(2000),
  detailedContent: z.record(z.any()),
  impactAssessment: z.enum(['VERY_POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'VERY_NEGATIVE']),
  impactAreas: z.array(z.string()),
  sourceUrls: z.array(z.string().url()),
  sourceNames: z.array(z.string()),
  aiGenerated: z.boolean().optional(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  tags: z.array(z.string()),
  fiscalYear: z.number().optional(),
  fiscalQuarter: z.number().min(1).max(4).optional(),
});

const updateStockEventSchema = z.object({
  eventType: z.string().optional(),
  eventDate: z.string().optional(),
  title: z.string().min(1).optional(),
  summary: z.string().min(100).max(2000).optional(),
  detailedContent: z.record(z.any()).optional(),
  impactAssessment: z.enum(['VERY_POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'VERY_NEGATIVE']).optional(),
  impactAreas: z.array(z.string()).optional(),
  sourceUrls: z.array(z.string().url()).optional(),
  sourceNames: z.array(z.string()).optional(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  tags: z.array(z.string()).optional(),
  fiscalYear: z.number().optional(),
  fiscalQuarter: z.number().min(1).max(4).optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

const parseArrayParam = (param: string | undefined): string[] | undefined => {
  if (!param) return undefined;
  return param.split(',').map(s => s.trim()).filter(s => s.length > 0);
};

const checkUserTier = (request: FastifyRequest): string => {
  const user = (request as any).user;
  return user?.tier || 'FREE';
};

const requireAdmin = (request: FastifyRequest) => {
  const user = (request as any).user;
  if (!user || user.tier !== 'PREMIUM') {
    throw new Error('Admin access required');
  }
};

// ============================================
// ROUTE HANDLERS
// ============================================

export async function stockRepositoryRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/stock-events
   * List all stock events with optional filters and pagination
   */
  fastify.get('/api/stock-events', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listEventsQuerySchema.parse(request.query);
      const userTier = checkUserTier(request);

      // Build where clause
      const where: any = {};

      if (query.eventTypes) {
        where.eventType = { in: parseArrayParam(query.eventTypes) };
      }

      if (query.impactAssessments) {
        where.impactAssessment = { in: parseArrayParam(query.impactAssessments) };
      }

      if (query.startDate || query.endDate) {
        where.eventDate = {};
        if (query.startDate) {
          where.eventDate.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.eventDate.lte = new Date(query.endDate);
        }
      }

      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { summary: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      if (query.tags) {
        where.tags = { hasSome: parseArrayParam(query.tags) };
      }

      if (query.fiscalYear) {
        where.fiscalYear = query.fiscalYear;
      }

      if (query.fiscalQuarter) {
        where.fiscalQuarter = query.fiscalQuarter;
      }

      // Apply tier-based filtering
      if (userTier === 'FREE') {
        where.isVerified = true;
      } else if (query.isVerified !== undefined) {
        where.isVerified = query.isVerified;
      }

      const limit = Math.min(Math.max(query.limit, 1), 100);
      const offset = Math.max(query.offset, 0);

      // Get total count
      const total = await prisma.stockEvent.count({ where });

      // Get events
      const events = await prisma.stockEvent.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              nseSymbol: true,
              companyName: true,
              shortName: true,
              sector: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { eventDate: 'desc' },
        take: limit,
        skip: offset,
      });

      return reply.send({
        success: true,
        data: {
          events,
          total,
          hasMore: offset + limit < total,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/stock-events/:id
   * Get single stock event by ID
   */
  fastify.get('/api/stock-events/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = eventIdSchema.parse(request.params);
      const userTier = checkUserTier(request);

      const event = await prisma.stockEvent.findUnique({
        where: { id: params.id },
        include: {
          company: {
            include: {
              sector: true,
              industry: true,
            },
          },
        },
      });

      if (!event) {
        return reply.status(404).send({
          success: false,
          error: 'Stock event not found',
        });
      }

      // Apply tier-based access
      if (userTier === 'FREE' && !event.isVerified) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied: Premium content',
        });
      }

      return reply.send({
        success: true,
        data: event,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/companies/:companyId/events
   * Get events for a specific company
   */
  fastify.get('/api/companies/:companyId/events', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = companyIdSchema.parse(request.params);
      const query = listEventsQuerySchema.parse(request.query);
      const userTier = checkUserTier(request);

      // Build where clause
      const where: any = { companyId: params.companyId };

      if (query.eventTypes) {
        where.eventType = { in: parseArrayParam(query.eventTypes) };
      }

      if (query.impactAssessments) {
        where.impactAssessment = { in: parseArrayParam(query.impactAssessments) };
      }

      if (query.startDate || query.endDate) {
        where.eventDate = {};
        if (query.startDate) {
          where.eventDate.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.eventDate.lte = new Date(query.endDate);
        }
      }

      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { summary: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      // Apply tier-based filtering
      if (userTier === 'FREE') {
        where.isVerified = true;
      } else if (query.isVerified !== undefined) {
        where.isVerified = query.isVerified;
      }

      const limit = Math.min(Math.max(query.limit, 1), 100);
      const offset = Math.max(query.offset, 0);

      const total = await prisma.stockEvent.count({ where });

      const events = await prisma.stockEvent.findMany({
        where,
        orderBy: { eventDate: 'desc' },
        take: limit,
        skip: offset,
      });

      return reply.send({
        success: true,
        data: {
          events,
          total,
          hasMore: offset + limit < total,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/companies/:companyId/milestones
   * Get milestones for a specific company
   */
  fastify.get('/api/companies/:companyId/milestones', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = companyIdSchema.parse(request.params);
      const query = z.object({
        limit: z.string().transform((val) => parseInt(val, 10)).default('10'),
      }).parse(request.query);

      const limit = Math.min(Math.max(query.limit, 1), 50);

      const milestones = await prisma.stockMilestone.findMany({
        where: { companyId: params.companyId },
        orderBy: { date: 'desc' },
        take: limit,
      });

      return reply.send({
        success: true,
        data: milestones,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/companies/:companyId/profile
   * Get company profile section(s)
   */
  fastify.get('/api/companies/:companyId/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = companyIdSchema.parse(request.params);
      const query = companyProfileQuerySchema.parse(request.query);

      if (query.sectionType) {
        // Get specific section
        const profile = await prisma.companyProfile.findUnique({
          where: {
            companyId_sectionType: {
              companyId: params.companyId,
              sectionType: query.sectionType as any,
            },
          },
        });

        if (!profile) {
          return reply.status(404).send({
            success: false,
            error: 'Company profile section not found',
          });
        }

        return reply.send({
          success: true,
          data: profile,
        });
      } else {
        // Get all sections
        const profiles = await prisma.companyProfile.findMany({
          where: { companyId: params.companyId },
          orderBy: { sectionType: 'asc' },
        });

        return reply.send({
          success: true,
          data: profiles,
        });
      }
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/companies/:companyId/timeline
   * Get company timeline summary
   */
  fastify.get('/api/companies/:companyId/timeline', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = companyIdSchema.parse(request.params);
      const query = timelineSummaryQuerySchema.parse(request.query);

      const summary = await prisma.companyTimelineSummary.findUnique({
        where: {
          companyId_periodType: {
            companyId: params.companyId,
            periodType: query.periodType as any,
          },
        },
      });

      if (!summary) {
        return reply.status(404).send({
          success: false,
          error: 'Timeline summary not found',
        });
      }

      return reply.send({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/stock-events/search
   * Search events across all companies
   */
  fastify.get('/api/stock-events/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = searchEventsQuerySchema.parse(request.query);
      const userTier = checkUserTier(request);

      // Build where clause
      const where: any = {
        OR: [
          { title: { contains: query.query, mode: 'insensitive' } },
          { summary: { contains: query.query, mode: 'insensitive' } },
        ],
      };

      if (query.eventTypes) {
        where.eventType = { in: parseArrayParam(query.eventTypes) };
      }

      if (query.impactAssessments) {
        where.impactAssessment = { in: parseArrayParam(query.impactAssessments) };
      }

      if (query.startDate || query.endDate) {
        where.eventDate = {};
        if (query.startDate) {
          where.eventDate.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.eventDate.lte = new Date(query.endDate);
        }
      }

      if (query.tags) {
        where.tags = { hasSome: parseArrayParam(query.tags) };
      }

      // Apply tier-based filtering
      if (userTier === 'FREE') {
        where.isVerified = true;
      } else if (query.isVerified !== undefined) {
        where.isVerified = query.isVerified;
      }

      const limit = Math.min(Math.max(query.limit, 1), 100);
      const offset = Math.max(query.offset, 0);

      const total = await prisma.stockEvent.count({ where });

      const events = await prisma.stockEvent.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              nseSymbol: true,
              companyName: true,
              shortName: true,
              sector: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [
          { eventDate: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      });

      return reply.send({
        success: true,
        data: {
          events,
          total,
          query: query.query,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/stock-events
   * Create new stock event (admin only)
   */
  fastify.post('/api/stock-events', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      requireAdmin(request);
      const body = createStockEventSchema.parse(request.body);

      const event = await prisma.stockEvent.create({
        data: {
          companyId: body.companyId,
          eventType: body.eventType as any,
          eventDate: new Date(body.eventDate),
          title: body.title,
          summary: body.summary,
          detailedContent: body.detailedContent,
          impactAssessment: body.impactAssessment as any,
          impactAreas: body.impactAreas,
          sourceUrls: body.sourceUrls,
          sourceNames: body.sourceNames,
          aiGenerated: body.aiGenerated !== undefined ? body.aiGenerated : true,
          confidence: body.confidence as any,
          tags: body.tags,
          fiscalYear: body.fiscalYear,
          fiscalQuarter: body.fiscalQuarter,
        },
        include: {
          company: {
            include: {
              sector: true,
              industry: true,
            },
          },
        },
      });

      return reply.status(201).send({
        success: true,
        data: event,
      });
    } catch (error: any) {
      if (error.message === 'Admin access required') {
        return reply.status(403).send({
          success: false,
          error: error.message,
        });
      }
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PATCH /api/stock-events/:id
   * Update stock event (admin only)
   */
  fastify.patch('/api/stock-events/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      requireAdmin(request);
      const params = eventIdSchema.parse(request.params);
      const body = updateStockEventSchema.parse(request.body);

      const updateData: any = {};
      if (body.eventType) updateData.eventType = body.eventType;
      if (body.eventDate) updateData.eventDate = new Date(body.eventDate);
      if (body.title) updateData.title = body.title;
      if (body.summary) updateData.summary = body.summary;
      if (body.detailedContent) updateData.detailedContent = body.detailedContent;
      if (body.impactAssessment) updateData.impactAssessment = body.impactAssessment;
      if (body.impactAreas) updateData.impactAreas = body.impactAreas;
      if (body.sourceUrls) updateData.sourceUrls = body.sourceUrls;
      if (body.sourceNames) updateData.sourceNames = body.sourceNames;
      if (body.confidence) updateData.confidence = body.confidence;
      if (body.tags) updateData.tags = body.tags;
      if (body.fiscalYear !== undefined) updateData.fiscalYear = body.fiscalYear;
      if (body.fiscalQuarter !== undefined) updateData.fiscalQuarter = body.fiscalQuarter;

      const event = await prisma.stockEvent.update({
        where: { id: params.id },
        data: updateData,
        include: {
          company: {
            include: {
              sector: true,
              industry: true,
            },
          },
        },
      });

      return reply.send({
        success: true,
        data: event,
      });
    } catch (error: any) {
      if (error.message === 'Admin access required') {
        return reply.status(403).send({
          success: false,
          error: error.message,
        });
      }
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/stock-events/:id/verify
   * Verify a stock event (admin only)
   */
  fastify.post('/api/stock-events/:id/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      requireAdmin(request);
      const params = eventIdSchema.parse(request.params);

      const event = await prisma.stockEvent.update({
        where: { id: params.id },
        data: { isVerified: true },
        include: {
          company: {
            include: {
              sector: true,
              industry: true,
            },
          },
        },
      });

      return reply.send({
        success: true,
        data: event,
      });
    } catch (error: any) {
      if (error.message === 'Admin access required') {
        return reply.status(403).send({
          success: false,
          error: error.message,
        });
      }
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });
}
