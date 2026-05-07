/**
 * Authentication Middleware
 *
 * Provides JWT authentication decorator for protected routes
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fastify decorator to add `authenticate` method
 * Use as preHandler: [fastify.authenticate]
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Verify JWT token
    await request.jwtVerify();

    // Get user from database
    const decoded = request.user as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Attach user to request
    request.user = user as any;
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

/**
 * Setup authentication decorator on Fastify instance
 */
export function setupAuth(fastify: any) {
  fastify.decorate('authenticate', authenticate);
}
