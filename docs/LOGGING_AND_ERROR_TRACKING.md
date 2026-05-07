# Logging and Error Tracking Documentation

## Overview

Alpha Signal implements comprehensive structured logging and error tracking across all services (API and Analytics) to ensure observability, debugging efficiency, and cost monitoring.

## Part 3: Structured Logging

### API Service (Node.js/TypeScript)

#### Logger Implementation (`apps/api/src/services/logger.ts`)

Uses **pino** for high-performance JSON logging with automatic context injection.

**Features:**
- JSON format in production, pretty-printed in development
- Automatic field inclusion: `service`, `environment`, `timestamp`
- Request context: `request_id` (UUID), `user_id`, `duration_ms`
- Error serialization with stack traces
- Sensitive data sanitization (passwords, tokens, etc.)

**Configuration:**
```typescript
const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction ? undefined : { target: 'pino-pretty' },
  base: {
    service: 'alpha-signal-api',
    environment: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
```

#### Logged Events

**1. HTTP Requests**
```typescript
logHttpRequest(request, reply, durationMs);
// Logs: method, url, status, duration_ms, user_agent, ip
```

**2. GraphQL Queries**
```typescript
logGraphQLQuery(queryName, variables, durationMs, userId, error);
// Logs: query_name, variables (sanitized), duration_ms, user_id
```

**3. Cache Operations**
```typescript
logCacheOperation('hit' | 'miss' | 'set' | 'delete', key, durationMs);
// Logs: cache_operation, cache_key, duration_ms
```

**4. Payment Events**
```typescript
logPaymentEvent(event, userId, amount, paymentId, error);
// Logs: payment_event, user_id, amount_paise, payment_id
```

**5. AI Summary Generation**
```typescript
logAISummaryGeneration(companyId, summaryType, modelVersion, durationMs, tokensUsed, error);
// Logs: company_id, summary_type, model_version, duration_ms, tokens_used
```

**6. Data Pipeline Runs**
```typescript
logDataPipeline(pipelineName, status, recordsProcessed, durationMs, error);
// Logs: pipeline_name, pipeline_status, records_processed, duration_ms
```

**7. Authentication Events**
```typescript
logAuthEvent('login' | 'logout' | 'register' | 'token_refresh' | 'auth_failed', userId, email, reason);
// Logs: auth_event, user_id, email, reason
```

**8. Slow Database Queries**
```typescript
logSlowQuery(model, operation, durationMs, query);
// Logs: db_model, db_operation, duration_ms, query (truncated)
```

**9. Rate Limiting**
```typescript
logRateLimitEvent(ip, route, userId, limit);
// Logs: rate_limit_event, ip, route, user_id, limit
```

**10. WebSocket Events**
```typescript
logWebSocketEvent(event, socketId, userId, metadata);
// Logs: ws_event, socket_id, user_id, metadata
```

#### Integration Points

**Fastify Request Logging:**
```typescript
// Automatic request logging with timing
fastify.addHook('onRequest', async (request, reply) => {
  (request as any).startTime = Date.now();
});

fastify.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - ((request as any).startTime || Date.now());
  logHttpRequest(request, reply, duration);
});
```

**GraphQL Operation Logging:**
```typescript
// Apollo Server plugin for GraphQL logging
const graphqlLoggingPlugin: ApolloServerPlugin = {
  async requestDidStart() {
    // Tracks operation name, variables, duration, and errors
  }
};
```

### Analytics Service (Python)

#### Logger Implementation (`apps/analytics/utils/logger.py`)

Uses **structlog** for consistent JSON logging across all Python services.

**Features:**
- Same JSON format as API service
- Automatic context: `service`, `environment`, `timestamp`, `module`
- Call site information: filename, function, line number
- Exception formatting with stack traces
- Console renderer in development, JSON in production

**Configuration:**
```python
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.CallsiteParameterAdder(...),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer() if IS_PRODUCTION else ConsoleRenderer(),
    ],
    logger_factory=LoggerFactory(),
)
```

#### Logged Events

**1. Celery Tasks**
```python
log_celery_task(task_name, task_id, status, duration_ms, error, metadata)
# Logs: task_name, task_id, task_status, duration_ms, task_metadata
```

**2. LLM API Calls**
```python
log_llm_api_call(provider, model, operation, duration_ms, tokens_used, cost_usd, company_id, error)
# Logs: llm_provider, llm_model, llm_operation, duration_ms, tokens_used, cost_usd
```

**3. Data Pipelines**
```python
log_data_pipeline(pipeline_name, status, records_processed, duration_ms, error, metadata)
# Logs: pipeline_name, pipeline_status, records_processed, duration_ms
```

**4. Data Ingestion**
```python
log_data_ingestion(source, data_type, records_fetched, records_stored, duration_ms, error)
# Logs: data_source, data_type, records_fetched, records_stored, duration_ms
```

**5. Financial Calculations**
```python
log_calculation(calculation_type, company_id, duration_ms, values_computed, error)
# Logs: calculation_type, company_id, duration_ms, values_computed
```

**6. Database Operations**
```python
log_db_operation(operation, model, duration_ms, records_affected, error)
# Logs: db_operation, db_model, duration_ms, records_affected
# Auto-warns on slow queries (>1000ms)
```

**7. Cache Operations**
```python
log_cache_operation(operation, key, duration_ms, hit)
# Logs: cache_operation, cache_key, duration_ms, cache_hit
```

#### Integration Points

**Celery Task Example:**
```python
@app.task(base=CallbackTask, bind=True)
def fetch_stock_data(self, symbol: str, exchange: str = 'NSE'):
    start_time = time.time()

    log_celery_task(
        task_name=self.name,
        task_id=self.request.id,
        status='started',
        metadata={'symbol': symbol, 'exchange': exchange}
    )

    try:
        # Task logic here
        result = process_data()

        duration_ms = (time.time() - start_time) * 1000
        log_celery_task(
            task_name=self.name,
            task_id=self.request.id,
            status='success',
            duration_ms=duration_ms,
            metadata={'symbol': symbol}
        )

        return result
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        log_celery_task(
            task_name=self.name,
            task_id=self.request.id,
            status='failure',
            duration_ms=duration_ms,
            error=e
        )
        raise
```

**LLM API Call Example:**
```python
# In llm_engine.py
start_time = time.time()
response = self.anthropic_client.messages.create(...)
duration_ms = (time.time() - start_time) * 1000

log_llm_api_call(
    provider='anthropic',
    model=self.model,
    operation=task_type.lower(),
    duration_ms=duration_ms,
    tokens_used=response.usage.input_tokens + response.usage.output_tokens,
    cost_usd=calculated_cost,
    company_id=company_id
)
```

## Part 4: Error Tracking

### Error Tracking Service (`apps/api/src/services/errorTracker.ts`)

Implements comprehensive error tracking with dual storage: **Sentry** (optional) and **PostgreSQL** database.

#### Features

1. **Dual Error Tracking**
   - Database storage for all errors (last 10,000 auto-pruned)
   - Optional Sentry integration for advanced error monitoring
   - Structured logging for all errors

2. **Global Error Handlers**
   - Uncaught exceptions
   - Unhandled promise rejections
   - Fastify error handler hook

3. **Error Context**
   - `request_id`: UUID for request tracing
   - `user_id`: User performing the action
   - `route`: API route where error occurred
   - `metadata`: Request details (headers, query, params)
   - `stack_trace`: Full stack trace

4. **Auto-Pruning**
   - Keeps only last 10,000 errors
   - Automatic cleanup on each new error

#### Database Schema

```prisma
model ErrorLog {
  id         String   @id @default(uuid()) @db.Uuid
  errorType  String   @map("error_type")
  message    String   @db.Text
  stackTrace String?  @map("stack_trace") @db.Text
  requestId  String?  @map("request_id")
  userId     String?  @map("user_id") @db.Uuid
  route      String?
  metadata   Json?
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([errorType])
  @@index([userId])
  @@index([createdAt])
  @@map("error_log")
}
```

#### Usage

**1. Track Error Manually**
```typescript
import { trackError } from './services/errorTracker.js';

try {
  // Some operation
} catch (error) {
  trackError(error as Error, {
    requestId: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user-123',
    route: 'POST /api/stocks',
    metadata: { symbol: 'RELIANCE' }
  });
}
```

**2. Global Error Handlers**
```typescript
// Automatically set up in index.ts
setupGlobalErrorHandlers();

// Handles:
// - process.on('uncaughtException')
// - process.on('unhandledRejection')
```

**3. Fastify Error Handler**
```typescript
// Automatically configured
setupFastifyErrorHandler(fastify);

// Intercepts all route errors and logs them
```

**4. Get Error Statistics**
```typescript
import { getErrorStats } from './services/errorTracker.js';

const stats = await getErrorStats(24); // Last 24 hours
// Returns:
// {
//   total: 42,
//   byType: { GraphQLError: 15, ValidationError: 10, ... },
//   recentErrors: [...]
// }
```

#### Sentry Integration

**Configuration:**
```bash
# .env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NODE_ENV=production
```

**Features:**
- Automatic error capture
- Performance monitoring
- User context tracking
- Request metadata attachment
- Only initialized if `SENTRY_DSN` is set

**Initialization:**
```typescript
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% in production
    attachStacktrace: true,
  });
}
```

### Python Error Handling

**Global Error Logging:**
```python
from utils.logger import log_error

try:
    # Some operation
except Exception as e:
    log_error(
        error=e,
        context={'company_id': company_id, 'operation': 'scoring'},
        operation='calculate_composite_scores'
    )
    raise
```

**Celery Task Errors:**
```python
class CallbackTask(Task):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        log_celery_task(
            task_name=self.name,
            task_id=task_id,
            status='failure',
            error=exc,
            metadata={'args': args, 'kwargs': kwargs}
        )
```

## Environment Variables

### API Service
```bash
# Logging
NODE_ENV=production|development
LOG_LEVEL=debug|info|warn|error

# Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Analytics Service
```bash
# Logging
NODE_ENV=production|development
LOG_LEVEL=DEBUG|INFO|WARNING|ERROR

# Database (for error storage)
DATABASE_URL=postgresql://user:pass@host:5432/database
```

## Dependencies

### API Service
```json
{
  "pino": "^8.19.0",
  "pino-pretty": "^11.0.0",
  "@sentry/node": "^8.x.x"
}
```

### Analytics Service
```txt
structlog==24.1.0
```

## Log Query Examples

### API Logs (JSON format in production)

**Find slow GraphQL queries:**
```bash
cat api.log | grep 'GraphQL query' | jq 'select(.duration_ms > 1000)'
```

**Track user errors:**
```bash
cat api.log | grep 'error' | jq 'select(.user_id == "user-123")'
```

**Monitor payment events:**
```bash
cat api.log | grep 'payment_event' | jq 'select(.payment_event == "failed")'
```

### Analytics Logs

**Find expensive LLM calls:**
```bash
cat analytics.log | grep 'llm_provider' | jq 'select(.cost_usd > 0.1)'
```

**Track pipeline failures:**
```bash
cat analytics.log | grep 'pipeline_status' | jq 'select(.pipeline_status == "failed")'
```

## Monitoring Integrations

### Grafana Loki
- Import JSON logs
- Create dashboards for key metrics
- Set up alerts on error rates

### Datadog
- Forward logs via agent
- APM integration
- Custom metrics from log fields

### Elastic Stack
- Logstash for log parsing
- Elasticsearch for storage
- Kibana for visualization

## Best Practices

1. **Always log with context**
   - Include `request_id`, `user_id`, relevant IDs
   - Add metadata for debugging

2. **Sanitize sensitive data**
   - Passwords, tokens, API keys automatically redacted
   - Add custom sanitization for PII

3. **Use appropriate log levels**
   - `debug`: Detailed debugging information
   - `info`: Normal operations (HTTP requests, tasks)
   - `warn`: Warning conditions (rate limits, slow queries)
   - `error`: Error conditions requiring attention

4. **Include timing metrics**
   - Always log `duration_ms` for operations
   - Helps identify performance bottlenecks

5. **Structure log messages**
   - Use structured fields instead of string interpolation
   - Enables better querying and analysis

6. **Handle errors gracefully**
   - Don't let error logging crash the app
   - Use try-catch around logging code

## Performance Considerations

- **Pino** and **Structlog** are high-performance loggers
- JSON serialization is fast
- Pretty printing disabled in production
- Async log writing doesn't block requests
- Database error storage batched and auto-pruned

## Testing

### Test Logger Output
```typescript
// In development
process.env.NODE_ENV = 'development';
logger.info('Test message', { key: 'value' });
// Output: Pretty-printed colored logs

// In production
process.env.NODE_ENV = 'production';
logger.info('Test message', { key: 'value' });
// Output: {"level":30,"time":"2024-...","message":"Test message","key":"value"}
```

### Test Error Tracking
```typescript
import { trackError, getErrorStats, clearErrorLogs } from './services/errorTracker.js';

// Track test error
trackError(new Error('Test error'), {
  route: '/test',
  metadata: { test: true }
});

// Get stats
const stats = await getErrorStats(1);
console.log(stats);

// Clean up
await clearErrorLogs();
```

## Maintenance

### Database Cleanup
```sql
-- Manual cleanup of old errors (auto-runs on new errors)
DELETE FROM error_log
WHERE id IN (
  SELECT id FROM error_log
  ORDER BY created_at ASC
  LIMIT (SELECT COUNT(*) - 10000 FROM error_log)
);
```

### Log Rotation
Configure log rotation with `logrotate` or container logging drivers:

```bash
# /etc/logrotate.d/alpha-signal
/var/log/alpha-signal/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
}
```

## Support

For questions or issues:
- Check logs for error messages and stack traces
- Query database for error patterns
- Review Sentry dashboard (if configured)
- Contact engineering team with `request_id` for tracing
