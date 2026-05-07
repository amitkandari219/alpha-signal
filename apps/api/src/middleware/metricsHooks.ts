/**
 * Metrics Hooks Middleware
 *
 * Fastify hooks to automatically track HTTP request metrics
 * Records request count, duration, and status codes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getMetricsService } from '../services/metrics.js';

const metricsService = getMetricsService();

/**
 * Setup metrics tracking hooks
 */
export function setupMetricsHooks(fastify: FastifyInstance) {
  // Track request start time
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    (request as any).startTime = Date.now();
  });

  // Track request completion
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = (request as any).startTime;
    if (!startTime) return;

    const duration = Date.now() - startTime;
    const method = request.method;
    const path = request.routerPath || request.url;
    const statusCode = reply.statusCode;

    // Track HTTP metrics
    metricsService.trackHttpRequest(method, path, statusCode, duration);
  });

  fastify.log.info('✅ Metrics hooks configured');
}
