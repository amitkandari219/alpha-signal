# Logging & Error Tracking - Quick Reference Guide

## Quick Start

### API Service (TypeScript)

```typescript
// Import logger
import { logger, logError, logGraphQLQuery } from './services/logger.js';
import { trackError } from './services/errorTracker.js';

// Basic logging
logger.info('Operation completed', { userId: 'user-123', duration: 125 });
logger.warn('Slow query detected', { query: 'SELECT...', duration: 2000 });
logger.error('Operation failed', { error: error.message });

// Track errors
try {
  // Your code
} catch (error) {
  trackError(error as Error, {
    requestId: request.headers['x-request-id'],
    userId: user?.id,
    route: request.url,
    metadata: { /* any relevant data */ }
  });
}
```

### Analytics Service (Python)

```python
# Import logger
from utils.logger import logger, log_celery_task, log_llm_api_call, log_error

# Basic logging
logger.info("Operation completed", user_id="user-123", duration=125)
logger.warning("Slow query detected", query="SELECT...", duration=2000)

# Celery task logging
start_time = time.time()
log_celery_task(
    task_name=self.name,
    task_id=self.request.id,
    status='started'
)

try:
    # Task logic
    duration_ms = (time.time() - start_time) * 1000
    log_celery_task(
        task_name=self.name,
        task_id=self.request.id,
        status='success',
        duration_ms=duration_ms
    )
except Exception as e:
    log_error(error=e, context={'task_id': self.request.id})
    raise
```

## Common Use Cases

### 1. Log HTTP Request
```typescript
// Automatic via middleware - no code needed!
// But if manual logging needed:
logHttpRequest(request, reply, durationMs);
```

### 2. Log GraphQL Query
```typescript
// Automatic via plugin - no code needed!
// But if manual logging needed:
logGraphQLQuery('GetStock', { symbol: 'RELIANCE' }, 250, userId);
```

### 3. Log Cache Operation
```typescript
logCacheOperation('hit', 'stock:RELIANCE', 5);
logCacheOperation('miss', 'stock:TATA', 3);
```

### 4. Log Payment Event
```typescript
logPaymentEvent('subscription.created', userId, 99900, paymentId);
```

### 5. Log AI Summary Generation
```typescript
logAISummaryGeneration(
  companyId,
  'BUSINESS_OVERVIEW',
  'claude-sonnet-4',
  durationMs,
  tokensUsed
);
```

### 6. Log Data Pipeline
```typescript
// TypeScript
logDataPipeline('price_ingestion', 'started');
// ... process data ...
logDataPipeline('price_ingestion', 'completed', recordsProcessed, durationMs);

// Python
log_data_pipeline('price_ingestion', 'started')
# ... process data ...
log_data_pipeline('price_ingestion', 'completed', records_processed, duration_ms)
```

### 7. Log LLM API Call (Python)
```python
start_time = time.time()
response = anthropic_client.messages.create(...)
duration_ms = (time.time() - start_time) * 1000

log_llm_api_call(
    provider='anthropic',
    model='claude-sonnet-4',
    operation='summarization',
    duration_ms=duration_ms,
    tokens_used=response.usage.input_tokens + response.usage.output_tokens,
    cost_usd=calculated_cost,
    company_id=company_id
)
```

### 8. Track Error with Context
```typescript
trackError(error, {
  requestId: 'req-123',
  userId: 'user-456',
  route: 'POST /api/stocks',
  metadata: {
    symbol: 'RELIANCE',
    action: 'create'
  }
});
```

### 9. Get Error Statistics
```typescript
const stats = await getErrorStats(24); // Last 24 hours
console.log(`Total errors: ${stats.total}`);
console.log('By type:', stats.byType);
console.log('Recent:', stats.recentErrors);
```

## Log Levels

### TypeScript
```typescript
logger.debug('Detailed debug info', { ... });  // Development only
logger.info('Normal operation', { ... });       // General info
logger.warn('Warning condition', { ... });      // Warnings
logger.error('Error occurred', { ... });        // Errors
```

### Python
```python
logger.debug("Detailed debug info", ...)  # Development only
logger.info("Normal operation", ...)       # General info
logger.warning("Warning condition", ...)   # Warnings
logger.error("Error occurred", ...)        # Errors
```

## Best Practices

### ✅ DO:
- Include `request_id`, `user_id`, relevant IDs
- Add `duration_ms` for operations
- Use structured fields instead of string concatenation
- Sanitize sensitive data (passwords, tokens)
- Log at appropriate levels
- Include error stack traces

### ❌ DON'T:
- Log passwords, API keys, tokens
- Use string interpolation: ❌ `logger.info(\`User \${userId} logged in\`)`
- Log in tight loops without sampling
- Log entire request/response bodies
- Ignore error context

## Structured Logging Examples

### Good ✅
```typescript
logger.info('User logged in', {
  user_id: user.id,
  email: user.email,
  duration_ms: 125
});
```

### Bad ❌
```typescript
logger.info(`User ${user.id} (${user.email}) logged in after ${duration}ms`);
```

## Query Logs

### Development (Pretty Print)
Logs are automatically pretty-printed with colors in development.

### Production (JSON)
```bash
# Find slow GraphQL queries
cat api.log | grep 'GraphQL query' | jq 'select(.duration_ms > 1000)'

# Track user errors
cat api.log | jq 'select(.user_id == "user-123" and .level == "error")'

# Monitor payment failures
cat api.log | jq 'select(.payment_event == "failed")'

# Find expensive LLM calls
cat analytics.log | jq 'select(.cost_usd > 0.1)'

# Track pipeline failures
cat analytics.log | jq 'select(.pipeline_status == "failed")'
```

## Environment Variables

```bash
# Logging
NODE_ENV=production|development
LOG_LEVEL=debug|info|warn|error

# Error Tracking (optional)
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

## Error Tracking API

```typescript
// Get error stats for last 24 hours
const stats = await getErrorStats(24);

// Clear all error logs (testing only)
const count = await clearErrorLogs();

// Track error manually
trackError(error, { /* context */ });
```

## Common Patterns

### Route Handler with Logging
```typescript
fastify.get('/api/stocks/:symbol', async (request, reply) => {
  const startTime = Date.now();
  const { symbol } = request.params;

  try {
    const data = await fetchStockData(symbol);

    logger.info('Stock data fetched', {
      symbol,
      duration_ms: Date.now() - startTime,
      user_id: request.user?.id
    });

    return data;
  } catch (error) {
    trackError(error as Error, {
      route: request.url,
      userId: request.user?.id,
      metadata: { symbol }
    });
    throw error;
  }
});
```

### Celery Task with Logging
```python
@app.task(base=CallbackTask, bind=True)
def process_company_data(self, company_id: str):
    start_time = time.time()

    log_celery_task(
        task_name=self.name,
        task_id=self.request.id,
        status='started',
        metadata={'company_id': company_id}
    )

    try:
        # Process data
        result = process_data(company_id)

        duration_ms = (time.time() - start_time) * 1000
        log_celery_task(
            task_name=self.name,
            task_id=self.request.id,
            status='success',
            duration_ms=duration_ms,
            metadata={'company_id': company_id, 'records': len(result)}
        )

        return result
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        log_celery_task(
            task_name=self.name,
            task_id=self.request.id,
            status='failure',
            duration_ms=duration_ms,
            error=e,
            metadata={'company_id': company_id}
        )
        raise
```

## Debugging Tips

### Find Request by ID
```bash
# TypeScript logs
cat api.log | jq 'select(.request_id == "req-123")'

# Follow request through system
cat api.log | jq -c 'select(.request_id == "req-123")' | sort -k1
```

### Find User Activity
```bash
cat api.log | jq -c 'select(.user_id == "user-456")' | tail -20
```

### Find Errors
```bash
# All errors
cat api.log | jq 'select(.level == "error")'

# By error type
cat api.log | jq 'select(.error_type == "ValidationError")'

# With stack traces
cat api.log | jq 'select(.stack != null)'
```

### Monitor Performance
```bash
# Slow operations (>1000ms)
cat api.log | jq 'select(.duration_ms > 1000)'

# Average duration by operation
cat api.log | jq -s 'group_by(.operation) | map({operation: .[0].operation, avg_duration: (map(.duration_ms) | add / length)})'
```

## Testing

### Test Logging
```bash
cd apps/api
npx tsx tests/test_logging_and_errors.ts
```

### Verify Logs in Database
```sql
-- Recent errors
SELECT * FROM error_log ORDER BY created_at DESC LIMIT 10;

-- Error stats
SELECT error_type, COUNT(*) as count
FROM error_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY count DESC;

-- Errors by user
SELECT user_id, COUNT(*) as error_count
FROM error_log
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY error_count DESC;
```

## Support

- **Full Documentation**: `/docs/LOGGING_AND_ERROR_TRACKING.md`
- **Implementation Summary**: `/MONITORING_PARTS_3_4_SUMMARY.md`
- **Test Script**: `/apps/api/tests/test_logging_and_errors.ts`

## Quick Links

- [Pino Documentation](https://getpino.io/)
- [Structlog Documentation](https://www.structlog.org/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Best Practices for Structured Logging](https://www.honeycomb.io/blog/structured-logging-and-your-team)
