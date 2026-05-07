import pino from 'pino';
import { randomUUID } from 'crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';

const isProduction = process.env.NODE_ENV === 'production';

// Create base logger with conditional formatting
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  // Use pretty printing in development, JSON in production
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
  // Base context fields for all logs
  base: {
    service: 'alpha-signal-api',
    environment: process.env.NODE_ENV || 'development',
  },
  // Add timestamp
  timestamp: pino.stdTimeFunctions.isoTime,
  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

/**
 * Create a child logger with request context
 */
export function createRequestLogger(request: FastifyRequest) {
  const requestId = request.headers['x-request-id']?.toString() || randomUUID();
  const userId = (request as any).user?.id || null;

  return logger.child({
    request_id: requestId,
    user_id: userId,
  });
}

/**
 * Log HTTP request with timing
 */
export function logHttpRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  durationMs: number
) {
  const requestLogger = createRequestLogger(request);

  const logData = {
    method: request.method,
    url: request.url,
    status: reply.statusCode,
    duration_ms: durationMs,
    user_agent: request.headers['user-agent'],
    ip: request.ip,
  };

  if (reply.statusCode >= 500) {
    requestLogger.error(logData, 'HTTP request failed');
  } else if (reply.statusCode >= 400) {
    requestLogger.warn(logData, 'HTTP request client error');
  } else {
    requestLogger.info(logData, 'HTTP request completed');
  }
}

/**
 * Log GraphQL query with timing and sanitized variables
 */
export function logGraphQLQuery(
  queryName: string,
  variables: Record<string, any>,
  durationMs: number,
  userId?: string,
  error?: Error
) {
  const logData = {
    query_name: queryName,
    variables: sanitizeVariables(variables),
    duration_ms: durationMs,
    user_id: userId || null,
  };

  if (error) {
    logger.error({ ...logData, err: error }, `GraphQL query failed: ${queryName}`);
  } else {
    logger.info(logData, `GraphQL query executed: ${queryName}`);
  }
}

/**
 * Sanitize variables to remove sensitive data
 */
function sanitizeVariables(variables: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'password',
    'passwordHash',
    'token',
    'refreshToken',
    'secret',
    'apiKey',
    'authToken',
  ];

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(variables)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeVariables(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Log cache hit/miss
 */
export function logCacheOperation(
  operation: 'hit' | 'miss' | 'set' | 'delete',
  key: string,
  durationMs?: number
) {
  logger.debug(
    {
      cache_operation: operation,
      cache_key: key,
      duration_ms: durationMs,
    },
    `Cache ${operation}: ${key}`
  );
}

/**
 * Log payment event
 */
export function logPaymentEvent(
  event: string,
  userId: string,
  amount: number,
  paymentId?: string,
  error?: Error
) {
  const logData = {
    payment_event: event,
    user_id: userId,
    amount_paise: amount,
    payment_id: paymentId,
  };

  if (error) {
    logger.error({ ...logData, err: error }, `Payment event failed: ${event}`);
  } else {
    logger.info(logData, `Payment event: ${event}`);
  }
}

/**
 * Log error with full context
 */
export function logError(
  error: Error,
  context: {
    requestId?: string;
    userId?: string;
    route?: string;
    operation?: string;
    metadata?: Record<string, any>;
  }
) {
  logger.error(
    {
      err: error,
      stack: error.stack,
      request_id: context.requestId,
      user_id: context.userId,
      route: context.route,
      operation: context.operation,
      metadata: context.metadata,
    },
    `Error occurred: ${error.message}`
  );
}

/**
 * Log AI summary generation
 */
export function logAISummaryGeneration(
  companyId: string,
  summaryType: string,
  modelVersion: string,
  durationMs: number,
  tokensUsed?: number,
  error?: Error
) {
  const logData = {
    company_id: companyId,
    summary_type: summaryType,
    model_version: modelVersion,
    duration_ms: durationMs,
    tokens_used: tokensUsed,
  };

  if (error) {
    logger.error(
      { ...logData, err: error },
      `AI summary generation failed: ${summaryType}`
    );
  } else {
    logger.info(logData, `AI summary generated: ${summaryType}`);
  }
}

/**
 * Log data pipeline run
 */
export function logDataPipeline(
  pipelineName: string,
  status: 'started' | 'completed' | 'failed',
  recordsProcessed?: number,
  durationMs?: number,
  error?: Error
) {
  const logData = {
    pipeline_name: pipelineName,
    pipeline_status: status,
    records_processed: recordsProcessed,
    duration_ms: durationMs,
  };

  if (error) {
    logger.error(
      { ...logData, err: error },
      `Data pipeline failed: ${pipelineName}`
    );
  } else if (status === 'started') {
    logger.info(logData, `Data pipeline started: ${pipelineName}`);
  } else {
    logger.info(logData, `Data pipeline completed: ${pipelineName}`);
  }
}

/**
 * Log WebSocket event
 */
export function logWebSocketEvent(
  event: string,
  socketId: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  logger.debug(
    {
      ws_event: event,
      socket_id: socketId,
      user_id: userId,
      metadata,
    },
    `WebSocket event: ${event}`
  );
}

/**
 * Log authentication event
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'register' | 'token_refresh' | 'auth_failed',
  userId?: string,
  email?: string,
  reason?: string
) {
  const logData = {
    auth_event: event,
    user_id: userId,
    email: email ? email.toLowerCase() : undefined,
    reason,
  };

  if (event === 'auth_failed') {
    logger.warn(logData, `Authentication failed: ${reason || 'Unknown'}`);
  } else {
    logger.info(logData, `Authentication event: ${event}`);
  }
}

/**
 * Log database query (for slow queries)
 */
export function logSlowQuery(
  model: string,
  operation: string,
  durationMs: number,
  query?: string
) {
  logger.warn(
    {
      db_model: model,
      db_operation: operation,
      duration_ms: durationMs,
      query: query ? query.substring(0, 500) : undefined, // Truncate long queries
    },
    `Slow database query detected: ${model}.${operation}`
  );
}

/**
 * Log rate limit event
 */
export function logRateLimitEvent(
  ip: string,
  route: string,
  userId?: string,
  limit?: number
) {
  logger.warn(
    {
      rate_limit_event: 'exceeded',
      ip,
      route,
      user_id: userId,
      limit,
    },
    `Rate limit exceeded: ${route}`
  );
}

export default logger;
