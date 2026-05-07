import * as Sentry from '@sentry/node';
import { PrismaClient } from '@prisma/client';
import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { logger, logError } from './logger.js';

const prisma = new PrismaClient();

// Maximum number of errors to keep in the database (auto-prune oldest)
const MAX_ERROR_LOGS = 10000;

// Initialize Sentry only if DSN is provided
const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development';
const SENTRY_ENABLED = !!SENTRY_DSN;

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
    // Attach stack traces to errors
    attachStacktrace: true,
    // Enable performance monitoring
    integrations: [
      // Automatically instrument Node.js libraries and frameworks
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],
  });
  logger.info('Sentry error tracking initialized', {
    environment: SENTRY_ENVIRONMENT,
  });
} else {
  logger.info('Sentry not configured - error tracking will use database only');
}

/**
 * Store error in database with auto-pruning
 */
async function storeErrorInDB(
  errorType: string,
  message: string,
  stackTrace: string | undefined,
  requestId: string | undefined,
  userId: string | undefined,
  route: string | undefined,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // Store error in database
    await prisma.errorLog.create({
      data: {
        errorType,
        message: message.substring(0, 10000), // Limit message length
        stackTrace: stackTrace?.substring(0, 50000), // Limit stack trace length
        requestId,
        userId,
        route,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    });

    // Auto-prune old errors (keep only last MAX_ERROR_LOGS)
    // Run this asynchronously to not block error logging
    pruneOldErrors().catch(err => {
      logger.error('Failed to prune old error logs', { error: err.message });
    });
  } catch (err) {
    // Don't let error logging fail the application
    logger.error('Failed to store error in database', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Prune old error logs to keep only the most recent MAX_ERROR_LOGS entries
 */
async function pruneOldErrors(): Promise<void> {
  const count = await prisma.errorLog.count();

  if (count > MAX_ERROR_LOGS) {
    const toDelete = count - MAX_ERROR_LOGS;

    // Delete oldest errors
    const oldestErrors = await prisma.errorLog.findMany({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: toDelete,
    });

    const idsToDelete = oldestErrors.map(e => e.id);

    await prisma.errorLog.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    logger.info(`Pruned ${toDelete} old error logs`, {
      remaining: MAX_ERROR_LOGS,
    });
  }
}

/**
 * Track error with both Sentry and database
 */
export function trackError(
  error: Error,
  context?: {
    requestId?: string;
    userId?: string;
    route?: string;
    metadata?: Record<string, any>;
  }
): void {
  const errorType = error.name || 'Error';
  const message = error.message || 'Unknown error';
  const stackTrace = error.stack;

  // Log to structured logger
  logError(error, {
    requestId: context?.requestId,
    userId: context?.userId,
    route: context?.route,
    metadata: context?.metadata,
  });

  // Store in database
  storeErrorInDB(
    errorType,
    message,
    stackTrace,
    context?.requestId,
    context?.userId,
    context?.route,
    context?.metadata
  );

  // Send to Sentry if enabled
  if (SENTRY_ENABLED) {
    Sentry.captureException(error, {
      tags: {
        route: context?.route,
      },
      user: context?.userId
        ? {
            id: context.userId,
          }
        : undefined,
      extra: {
        requestId: context?.requestId,
        metadata: context?.metadata,
      },
    });
  }
}

/**
 * Setup global error handlers for uncaught exceptions and unhandled rejections
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack,
    });

    trackError(error, {
      route: 'uncaughtException',
      metadata: { type: 'uncaughtException' },
    });

    // Give some time for error to be logged
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const error =
      reason instanceof Error ? reason : new Error(String(reason));

    logger.error('Unhandled promise rejection', {
      error: error.message,
      stack: error.stack,
      reason: String(reason),
    });

    trackError(error, {
      route: 'unhandledRejection',
      metadata: {
        type: 'unhandledRejection',
        reason: String(reason),
      },
    });
  });

  logger.info('Global error handlers configured');
}

/**
 * Setup Fastify error handler hook
 */
export function setupFastifyErrorHandler(fastify: FastifyInstance): void {
  // Add error handler hook
  fastify.setErrorHandler(
    async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      const requestId =
        request.headers['x-request-id']?.toString() || 'unknown';
      const userId = (request as any).user?.id;
      const route = `${request.method} ${request.url}`;

      // Don't track validation errors and 404s as errors
      const skipTracking =
        error.statusCode === 404 ||
        error.statusCode === 400 ||
        error.validation !== undefined;

      if (!skipTracking) {
        trackError(error, {
          requestId,
          userId,
          route,
          metadata: {
            statusCode: error.statusCode || 500,
            method: request.method,
            url: request.url,
            headers: request.headers,
            query: request.query,
            params: request.params,
          },
        });
      }

      // Determine status code
      const statusCode = error.statusCode || 500;

      // Log the error
      if (statusCode >= 500) {
        logger.error('Internal server error', {
          error: error.message,
          stack: error.stack,
          statusCode,
          route,
          requestId,
          userId,
        });
      } else {
        logger.warn('Client error', {
          error: error.message,
          statusCode,
          route,
          requestId,
          userId,
        });
      }

      // Send appropriate error response
      reply.status(statusCode).send({
        error: {
          message:
            statusCode >= 500
              ? 'Internal server error'
              : error.message || 'An error occurred',
          statusCode,
          requestId,
        },
      });
    }
  );

  logger.info('Fastify error handler configured');
}

/**
 * Get error statistics
 */
export async function getErrorStats(hours: number = 24): Promise<{
  total: number;
  byType: Record<string, number>;
  recentErrors: Array<{
    id: string;
    errorType: string;
    message: string;
    route: string | null;
    createdAt: Date;
  }>;
}> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const [total, errors] = await Promise.all([
    prisma.errorLog.count({
      where: { createdAt: { gte: since } },
    }),
    prisma.errorLog.findMany({
      where: { createdAt: { gte: since } },
      select: {
        id: true,
        errorType: true,
        message: true,
        route: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  // Group by error type
  const byType: Record<string, number> = {};
  for (const error of errors) {
    byType[error.errorType] = (byType[error.errorType] || 0) + 1;
  }

  return {
    total,
    byType,
    recentErrors: errors.slice(0, 10),
  };
}

/**
 * Clear all error logs (useful for testing)
 */
export async function clearErrorLogs(): Promise<number> {
  const result = await prisma.errorLog.deleteMany({});
  logger.info(`Cleared ${result.count} error logs`);
  return result.count;
}

export default {
  trackError,
  setupGlobalErrorHandlers,
  setupFastifyErrorHandler,
  getErrorStats,
  clearErrorLogs,
};
