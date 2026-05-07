/**
 * REST API Routes for Newsletter Subscriptions
 *
 * Provides endpoints for:
 * - POST /api/newsletter/subscribe - Subscribe to newsletter
 * - POST /api/newsletter/unsubscribe - Unsubscribe from newsletter
 * - GET /api/newsletter/preferences - Get current preferences (authenticated)
 * - PUT /api/newsletter/preferences - Update preferences (authenticated)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  subscribedSectors: z
    .array(z.string())
    .min(1, 'At least one sector must be selected')
    .max(10, 'Maximum 10 sectors allowed'),
  frequency: z.enum(['WEEKLY', 'DAILY']),
});

const unsubscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const updatePreferencesSchema = z.object({
  subscribedSectors: z
    .array(z.string())
    .min(1, 'At least one sector must be selected')
    .max(10, 'Maximum 10 sectors allowed')
    .optional(),
  frequency: z.enum(['WEEKLY', 'DAILY']).optional(),
});

// ============================================
// ROUTE HANDLERS
// ============================================

export async function newsletterRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/newsletter/subscribe
   * Subscribe to newsletter
   *
   * Body:
   * - email: string
   * - subscribedSectors: string[] (sector IDs)
   * - frequency: 'WEEKLY' | 'DAILY'
   */
  fastify.post(
    '/api/newsletter/subscribe',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = subscribeSchema.parse(request.body);

        // Validate sector IDs
        const sectors = await prisma.sector.findMany({
          where: {
            id: { in: body.subscribedSectors },
          },
          select: { id: true, name: true },
        });

        if (sectors.length !== body.subscribedSectors.length) {
          return reply.status(400).send({
            success: false,
            error: 'One or more invalid sector IDs',
          });
        }

        // Check if subscriber already exists
        const existing = await prisma.newsletterSubscriber.findUnique({
          where: { email: body.email },
        });

        if (existing) {
          // Reactivate if inactive
          if (!existing.isActive) {
            const subscriber = await prisma.newsletterSubscriber.update({
              where: { email: body.email },
              data: {
                isActive: true,
                subscribedSectors: body.subscribedSectors,
                frequency: body.frequency,
                unsubscribedAt: null,
              },
            });

            return reply.send({
              success: true,
              message: 'Newsletter subscription reactivated',
              data: {
                id: subscriber.id,
                email: subscriber.email,
                subscribedSectors: sectors.map((s) => ({
                  id: s.id,
                  name: s.name,
                })),
                frequency: subscriber.frequency,
              },
            });
          }

          return reply.status(400).send({
            success: false,
            error: 'Email already subscribed',
          });
        }

        // Check if user exists with this email
        const user = await prisma.user.findUnique({
          where: { email: body.email },
          select: { id: true },
        });

        // Create new subscriber
        const subscriber = await prisma.newsletterSubscriber.create({
          data: {
            email: body.email,
            subscribedSectors: body.subscribedSectors,
            frequency: body.frequency,
            userId: user?.id,
            isActive: true,
          },
        });

        return reply.send({
          success: true,
          message: 'Successfully subscribed to newsletter',
          data: {
            id: subscriber.id,
            email: subscriber.email,
            subscribedSectors: sectors.map((s) => ({
              id: s.id,
              name: s.name,
            })),
            frequency: subscriber.frequency,
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
   * POST /api/newsletter/unsubscribe
   * Unsubscribe from newsletter
   *
   * Body:
   * - email: string
   */
  fastify.post(
    '/api/newsletter/unsubscribe',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = unsubscribeSchema.parse(request.body);

        const subscriber = await prisma.newsletterSubscriber.findUnique({
          where: { email: body.email },
        });

        if (!subscriber) {
          return reply.status(404).send({
            success: false,
            error: 'Subscriber not found',
          });
        }

        if (!subscriber.isActive) {
          return reply.status(400).send({
            success: false,
            error: 'Already unsubscribed',
          });
        }

        await prisma.newsletterSubscriber.update({
          where: { email: body.email },
          data: {
            isActive: false,
            unsubscribedAt: new Date(),
          },
        });

        return reply.send({
          success: true,
          message: 'Successfully unsubscribed from newsletter',
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
   * GET /api/newsletter/preferences
   * Get current newsletter preferences (authenticated)
   *
   * Requires authentication
   */
  fastify.get(
    '/api/newsletter/preferences',
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.status(401).send({ error: 'Unauthorized' });
        }
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const decoded = request.user as { userId: string };

        const subscriber = await prisma.newsletterSubscriber.findUnique({
          where: { userId: decoded.userId },
        });

        if (!subscriber) {
          return reply.status(404).send({
            success: false,
            error: 'Newsletter subscription not found',
          });
        }

        // Get sector details
        const sectorIds = subscriber.subscribedSectors as string[];
        const sectors = await prisma.sector.findMany({
          where: { id: { in: sectorIds } },
          select: { id: true, name: true, slug: true },
        });

        return reply.send({
          success: true,
          data: {
            id: subscriber.id,
            email: subscriber.email,
            subscribedSectors: sectors,
            frequency: subscriber.frequency,
            isActive: subscriber.isActive,
            subscribedAt: subscriber.subscribedAt.toISOString(),
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
   * PUT /api/newsletter/preferences
   * Update newsletter preferences (authenticated)
   *
   * Requires authentication
   *
   * Body:
   * - subscribedSectors: string[] (optional)
   * - frequency: 'WEEKLY' | 'DAILY' (optional)
   */
  fastify.put(
    '/api/newsletter/preferences',
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.status(401).send({ error: 'Unauthorized' });
        }
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const decoded = request.user as { userId: string };
        const body = updatePreferencesSchema.parse(request.body);

        // Find subscriber
        const subscriber = await prisma.newsletterSubscriber.findUnique({
          where: { userId: decoded.userId },
        });

        if (!subscriber) {
          return reply.status(404).send({
            success: false,
            error: 'Newsletter subscription not found',
          });
        }

        // Validate sector IDs if provided
        if (body.subscribedSectors) {
          const sectors = await prisma.sector.findMany({
            where: { id: { in: body.subscribedSectors } },
          });

          if (sectors.length !== body.subscribedSectors.length) {
            return reply.status(400).send({
              success: false,
              error: 'One or more invalid sector IDs',
            });
          }
        }

        // Update preferences
        const data: any = {};
        if (body.subscribedSectors !== undefined) {
          data.subscribedSectors = body.subscribedSectors;
        }
        if (body.frequency !== undefined) {
          data.frequency = body.frequency;
        }

        const updated = await prisma.newsletterSubscriber.update({
          where: { userId: decoded.userId },
          data,
        });

        // Get sector details
        const sectorIds = updated.subscribedSectors as string[];
        const sectors = await prisma.sector.findMany({
          where: { id: { in: sectorIds } },
          select: { id: true, name: true, slug: true },
        });

        return reply.send({
          success: true,
          message: 'Newsletter preferences updated',
          data: {
            id: updated.id,
            email: updated.email,
            subscribedSectors: sectors,
            frequency: updated.frequency,
            isActive: updated.isActive,
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
   * GET /api/newsletter/unsubscribe/:email
   * Unsubscribe from newsletter via link (for email campaigns)
   *
   * This is a GET endpoint to support email unsubscribe links
   */
  fastify.get(
    '/api/newsletter/unsubscribe/:email',
    async (request: FastifyRequest<{ Params: { email: string } }>, reply: FastifyReply) => {
      try {
        const { email } = request.params;

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid email address',
          });
        }

        const subscriber = await prisma.newsletterSubscriber.findUnique({
          where: { email },
        });

        if (!subscriber) {
          return reply.status(404).send({
            success: false,
            error: 'Subscriber not found',
          });
        }

        if (!subscriber.isActive) {
          return reply.send({
            success: true,
            message: 'Already unsubscribed',
          });
        }

        await prisma.newsletterSubscriber.update({
          where: { email },
          data: {
            isActive: false,
            unsubscribedAt: new Date(),
          },
        });

        return reply.send({
          success: true,
          message: 'Successfully unsubscribed from newsletter',
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
}
