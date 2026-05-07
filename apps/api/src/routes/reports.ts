/**
 * REST API Routes for Weekly Reports
 *
 * Provides endpoints for:
 * - GET /api/reports - List reports with filtering
 * - GET /api/reports/:slug - Get single report by slug
 * - POST /api/reports/:slug/view - Increment view count
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { generateReportPDF, getUserTier } from '../services/pdfExporter.js';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const listReportsQuerySchema = z.object({
  reportType: z.enum(['SECTOR_WEEKLY', 'MACRO_WEEKLY']).optional(),
  sectorId: z.string().uuid().optional(),
  isPublished: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('20'),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('0'),
  fiscalYear: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  fiscalWeek: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
});

const reportSlugSchema = z.object({
  slug: z.string().min(1),
});

// ============================================
// ROUTE HANDLERS
// ============================================

export async function reportRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/reports
   * List reports with optional filters and pagination
   *
   * Query params:
   * - reportType: 'SECTOR_WEEKLY' | 'MACRO_WEEKLY'
   * - sectorId: UUID of sector
   * - isPublished: 'true' | 'false'
   * - fiscalYear: number
   * - fiscalWeek: number
   * - limit: number (default: 20, max: 50)
   * - offset: number (default: 0)
   */
  fastify.get('/api/reports', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listReportsQuerySchema.parse(request.query);

      // Build where clause
      const where: any = {};

      if (query.reportType) {
        where.reportType = query.reportType;
      }

      if (query.sectorId) {
        where.sectorId = query.sectorId;
      }

      if (query.fiscalYear) {
        where.fiscalYear = query.fiscalYear;
      }

      if (query.fiscalWeek) {
        where.fiscalWeek = query.fiscalWeek;
      }

      // Default to only published reports unless explicitly requested
      if (query.isPublished !== undefined) {
        where.isPublished = query.isPublished;
      } else {
        where.isPublished = true;
      }

      // Enforce limit constraints
      const limit = Math.min(Math.max(query.limit, 1), 50);
      const offset = Math.max(query.offset, 0);

      // Fetch reports
      const [reports, total] = await Promise.all([
        prisma.weeklyReport.findMany({
          where,
          include: {
            sector: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            reportSections: {
              orderBy: { sectionOrder: 'asc' },
              select: {
                id: true,
                sectionOrder: true,
                sectionTitle: true,
                sectionType: true,
                content: true,
              },
            },
          },
          orderBy: [
            { fiscalYear: 'desc' },
            { fiscalWeek: 'desc' },
            { publishedAt: 'desc' },
          ],
          take: limit,
          skip: offset,
        }),
        prisma.weeklyReport.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: reports,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * GET /api/reports/:slug
   * Get single report by slug
   *
   * Returns full report with all sections
   */
  fastify.get(
    '/api/reports/:slug',
    async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
      try {
        const { slug } = reportSlugSchema.parse(request.params);

        const report = await prisma.weeklyReport.findUnique({
          where: { slug },
          include: {
            sector: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            reportSections: {
              orderBy: { sectionOrder: 'asc' },
              select: {
                id: true,
                sectionOrder: true,
                sectionTitle: true,
                sectionType: true,
                content: true,
                createdAt: true,
              },
            },
          },
        });

        if (!report) {
          return reply.status(404).send({
            success: false,
            error: 'Report not found',
          });
        }

        // Only return published reports (unless admin - TODO: add admin check)
        if (!report.isPublished) {
          return reply.status(404).send({
            success: false,
            error: 'Report not found',
          });
        }

        return reply.send({
          success: true,
          data: report,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: error.errors,
          });
        }

        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * POST /api/reports/:slug/view
   * Increment view count for a report
   *
   * This endpoint is idempotent and can be called multiple times
   * Used for analytics tracking
   */
  fastify.post(
    '/api/reports/:slug/view',
    async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
      try {
        const { slug } = reportSlugSchema.parse(request.params);

        // Check if report exists and is published
        const existingReport = await prisma.weeklyReport.findUnique({
          where: { slug },
          select: { id: true, isPublished: true },
        });

        if (!existingReport) {
          return reply.status(404).send({
            success: false,
            error: 'Report not found',
          });
        }

        if (!existingReport.isPublished) {
          return reply.status(404).send({
            success: false,
            error: 'Report not found',
          });
        }

        // Increment view count
        const report = await prisma.weeklyReport.update({
          where: { slug },
          data: {
            viewCount: {
              increment: 1,
            },
          },
          select: {
            id: true,
            slug: true,
            viewCount: true,
          },
        });

        return reply.send({
          success: true,
          data: {
            slug: report.slug,
            viewCount: report.viewCount,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: error.errors,
          });
        }

        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /api/reports/latest
   * Get latest N reports across all sectors
   */
  fastify.get('/api/reports/latest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as { limit?: string };
      const limit = Math.min(
        Math.max(parseInt(query.limit || '10', 10), 1),
        50
      );

      const reports = await prisma.weeklyReport.findMany({
        where: {
          isPublished: true,
        },
        select: {
          id: true,
          reportType: true,
          sectorId: true,
          sector: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          title: true,
          slug: true,
          coverImageUrl: true,
          summary: true,
          publishedAt: true,
          fiscalWeek: true,
          fiscalYear: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { publishedAt: 'desc' },
          { fiscalYear: 'desc' },
          { fiscalWeek: 'desc' },
        ],
        take: limit,
      });

      return reply.send({
        success: true,
        data: reports,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * GET /api/reports/sector/:sectorId
   * Get reports for a specific sector
   */
  fastify.get(
    '/api/reports/sector/:sectorId',
    async (request: FastifyRequest<{ Params: { sectorId: string } }>, reply: FastifyReply) => {
      try {
        const { sectorId } = request.params;
        const query = request.query as { limit?: string };
        const limit = Math.min(
          Math.max(parseInt(query.limit || '10', 10), 1),
          20
        );

        // Verify sector exists
        const sector = await prisma.sector.findUnique({
          where: { id: sectorId },
          select: { id: true, name: true, slug: true },
        });

        if (!sector) {
          return reply.status(404).send({
            success: false,
            error: 'Sector not found',
          });
        }

        const reports = await prisma.weeklyReport.findMany({
          where: {
            sectorId,
            isPublished: true,
          },
          select: {
            id: true,
            reportType: true,
            sectorId: true,
            sector: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            title: true,
            slug: true,
            coverImageUrl: true,
            summary: true,
            publishedAt: true,
            fiscalWeek: true,
            fiscalYear: true,
            viewCount: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [
            { fiscalYear: 'desc' },
            { fiscalWeek: 'desc' },
          ],
          take: limit,
        });

        return reply.send({
          success: true,
          data: {
            sector,
            reports,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * POST /api/reports/generate/:symbol
   * Generate comprehensive stock report PDF
   *
   * Requires authentication and PRO/PREMIUM tier
   * Returns PDF file download
   */
  fastify.post(
    '/api/reports/generate/:symbol',
    async (request: FastifyRequest<{ Params: { symbol: string } }>, reply: FastifyReply) => {
      try {
        // 1. Check authentication
        const token = request.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return reply.status(401).send({
            success: false,
            error: 'Authentication required',
          });
        }

        // 2. Verify JWT and get user
        let userId: string;
        try {
          const decoded = await fastify.jwt.verify(token) as any;
          userId = decoded.userId || decoded.id;
        } catch (error) {
          return reply.status(401).send({
            success: false,
            error: 'Invalid or expired token',
          });
        }

        // 3. Check tier access
        const { tier, canExportPDF } = await getUserTier(userId);
        if (!canExportPDF) {
          return reply.status(403).send({
            success: false,
            error: 'PDF export requires PRO or PREMIUM subscription',
            requiredTier: 'PRO',
          });
        }

        const { symbol } = request.params;

        // 4. Generate PDF
        fastify.log.info(`Generating PDF for ${symbol} (user: ${userId}, tier: ${tier})`);
        const result = await generateReportPDF(symbol.toUpperCase(), userId);

        if (!result.success) {
          return reply.status(500).send({
            success: false,
            error: result.error || 'Failed to generate PDF',
          });
        }

        // 5. Read the generated PDF file
        const filePath = path.join(process.cwd(), 'uploads', 'reports', result.filename!);
        const fileBuffer = await fs.readFile(filePath);

        // 6. Set headers for PDF download
        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', `attachment; filename="${result.filename}"`);
        reply.header('Content-Length', fileBuffer.length.toString());

        return reply.send(fileBuffer);
      } catch (error: any) {
        fastify.log.error('PDF generation error:', error);
        return reply.status(500).send({
          success: false,
          error: error.message || 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /api/reports/download/:filename
   * Download a previously generated PDF report
   *
   * Requires authentication
   */
  fastify.get(
    '/api/reports/download/:filename',
    async (request: FastifyRequest<{ Params: { filename: string } }>, reply: FastifyReply) => {
      try {
        // 1. Check authentication
        const token = request.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return reply.status(401).send({
            success: false,
            error: 'Authentication required',
          });
        }

        // 2. Verify JWT
        try {
          await fastify.jwt.verify(token);
        } catch (error) {
          return reply.status(401).send({
            success: false,
            error: 'Invalid or expired token',
          });
        }

        const { filename } = request.params;

        // 3. Validate filename (security check)
        if (!filename.match(/^[a-zA-Z0-9_-]+\.pdf$/)) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid filename format',
          });
        }

        // 4. Read file
        const filePath = path.join(process.cwd(), 'uploads', 'reports', filename);

        try {
          const fileBuffer = await fs.readFile(filePath);

          // 5. Set headers for PDF download
          reply.header('Content-Type', 'application/pdf');
          reply.header('Content-Disposition', `attachment; filename="${filename}"`);
          reply.header('Content-Length', fileBuffer.length.toString());

          return reply.send(fileBuffer);
        } catch (error: any) {
          if (error.code === 'ENOENT') {
            return reply.status(404).send({
              success: false,
              error: 'PDF file not found or has expired',
            });
          }
          throw error;
        }
      } catch (error: any) {
        fastify.log.error('PDF download error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /api/reports/user-tier
   * Check if user can export PDFs
   *
   * Requires authentication
   */
  fastify.get(
    '/api/reports/user-tier',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // 1. Check authentication
        const token = request.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return reply.status(401).send({
            success: false,
            error: 'Authentication required',
          });
        }

        // 2. Verify JWT and get user
        let userId: string;
        try {
          const decoded = await fastify.jwt.verify(token) as any;
          userId = decoded.userId || decoded.id;
        } catch (error) {
          return reply.status(401).send({
            success: false,
            error: 'Invalid or expired token',
          });
        }

        // 3. Get tier info
        const tierInfo = await getUserTier(userId);

        return reply.send({
          success: true,
          data: tierInfo,
        });
      } catch (error: any) {
        fastify.log.error('User tier check error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );
}
