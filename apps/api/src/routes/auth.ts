/**
 * Authentication Routes
 *
 * Handles user registration, login, token refresh, and logout
 * Uses JWT for access tokens (15min) and refresh tokens (7 days)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// In-memory store for refresh tokens (use Redis in production)
const refreshTokens = new Map<string, { userId: string; expiresAt: Date }>();

// Rate limiting tracker (use Redis in production)
const loginAttempts = new Map<string, { count: number; resetAt: Date }>();

// Helper: Check rate limit
function checkRateLimit(ip: string): boolean {
  const now = new Date();
  const attempt = loginAttempts.get(ip);

  if (!attempt || attempt.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: new Date(now.getTime() + 60000) });
    return true;
  }

  if (attempt.count >= 5) {
    return false;
  }

  attempt.count++;
  return true;
}

// Helper: Generate tokens
function generateTokens(fastify: FastifyInstance, userId: string, email: string, tier: string) {
  const accessToken = fastify.jwt.sign(
    { userId, email, tier },
    { expiresIn: '15m' }
  );

  const refreshToken = fastify.jwt.sign(
    { userId, type: 'refresh' },
    { expiresIn: '7d' }
  );

  // Store refresh token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  refreshTokens.set(refreshToken, { userId, expiresAt });

  return { accessToken, refreshToken };
}

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/register
  fastify.post('/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = registerSchema.parse(request.body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        return reply.status(400).send({
          error: 'User with this email already exists',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(body.password, 10);

      // Create user with FREE tier
      const user = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name,
          tier: 'FREE',
          isActive: true,
        },
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(
        fastify,
        user.id,
        user.email,
        user.tier
      );

      return reply.send({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // POST /auth/login
  fastify.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const clientIp = request.ip;

      // Check rate limit
      if (!checkRateLimit(clientIp)) {
        return reply.status(429).send({
          error: 'Too many login attempts. Please try again in 1 minute.',
        });
      }

      const body = loginSchema.parse(request.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user) {
        return reply.status(401).send({
          error: 'Invalid email or password',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(body.password, user.passwordHash);

      if (!isValidPassword) {
        return reply.status(401).send({
          error: 'Invalid email or password',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return reply.status(403).send({
          error: 'Account is disabled',
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(
        fastify,
        user.id,
        user.email,
        user.tier
      );

      return reply.send({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // POST /auth/refresh
  fastify.post('/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as { refreshToken?: string };
      const refreshToken = body.refreshToken;

      if (!refreshToken) {
        return reply.status(401).send({
          error: 'Refresh token not found',
        });
      }

      // Verify refresh token
      const decoded = fastify.jwt.verify(refreshToken) as {
        userId: string;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        return reply.status(401).send({
          error: 'Invalid token type',
        });
      }

      // Check if refresh token exists in store
      const storedToken = refreshTokens.get(refreshToken);
      if (!storedToken || storedToken.expiresAt < new Date()) {
        refreshTokens.delete(refreshToken);
        return reply.status(401).send({
          error: 'Refresh token expired or invalid',
        });
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        return reply.status(401).send({
          error: 'User not found or inactive',
        });
      }

      // Generate new access token
      const accessToken = fastify.jwt.sign(
        { userId: user.id, email: user.email, tier: user.tier },
        { expiresIn: '15m' }
      );

      return reply.send({
        success: true,
        accessToken,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(401).send({
        error: 'Invalid or expired refresh token',
      });
    }
  });

  // POST /auth/logout
  fastify.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as { refreshToken?: string };
      const refreshToken = body.refreshToken;

      if (refreshToken) {
        // Remove refresh token from store
        refreshTokens.delete(refreshToken);
      }

      return reply.send({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // GET /auth/me - Get current user
  fastify.get('/auth/me', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = request.user as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          tier: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: 'User not found',
        });
      }

      return reply.send({
        success: true,
        user,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });
}
