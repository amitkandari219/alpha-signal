/**
 * Metrics Routes
 *
 * Exposes application metrics for monitoring systems (Prometheus, Datadog, etc.)
 * Protected with METRICS_API_KEY bearer token authentication
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getMetricsService } from '../services/metrics.js';

const metricsService = getMetricsService();

/**
 * Verify metrics API key from bearer token
 */
async function verifyMetricsAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Bearer token required',
    });
  }

  const token = authHeader.substring(7);
  const expectedKey = process.env.METRICS_API_KEY;

  if (!expectedKey) {
    request.log.warn('METRICS_API_KEY not configured');
    return reply.code(503).send({
      error: 'Service Unavailable',
      message: 'Metrics endpoint not configured',
    });
  }

  if (token !== expectedKey) {
    return reply.code(403).send({
      error: 'Forbidden',
      message: 'Invalid metrics API key',
    });
  }
}

/**
 * Register metrics routes
 */
export async function metricsRoutes(fastify: FastifyInstance) {
  /**
   * GET /metrics
   * Returns all collected metrics in JSON format
   * Protected with METRICS_API_KEY bearer token
   */
  fastify.get(
    '/metrics',
    {
      preHandler: verifyMetricsAuth,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const metrics = metricsService.getMetrics();

      return reply.code(200).send({
        timestamp: new Date().toISOString(),
        metrics,
      });
    }
  );

  /**
   * GET /metrics/prometheus
   * Returns metrics in Prometheus format
   * Protected with METRICS_API_KEY bearer token
   */
  fastify.get(
    '/metrics/prometheus',
    {
      preHandler: verifyMetricsAuth,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const prometheusFormat = metricsService.getPrometheusFormat();

      return reply
        .code(200)
        .header('Content-Type', 'text/plain; version=0.0.4')
        .send(prometheusFormat);
    }
  );

  fastify.log.info('✅ Metrics routes registered');
}
