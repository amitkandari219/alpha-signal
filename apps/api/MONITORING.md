# Monitoring System Documentation

This document describes the monitoring system implemented for the Alpha Signal API.

## Part 1: Health Check Endpoints

### Overview
Comprehensive health monitoring endpoints that provide real-time status of all system components.

### Endpoints

#### 1. GET /health
Basic API health check with system information.

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "memory": {
    "rss": 256,
    "heapUsed": 128,
    "heapTotal": 256,
    "external": 12
  },
  "environment": "development"
}
```

#### 2. GET /health/db
Database connection check with latency measurement.

**Response (200 OK):**
```json
{
  "service": "database",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "ok",
  "latency": 5
}
```

**Response (503 Service Unavailable):**
```json
{
  "service": "database",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "error",
  "error": "Connection failed"
}
```

#### 3. GET /health/redis
Redis connection check with latency measurement.

**Response (200 OK):**
```json
{
  "service": "redis",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "ok",
  "latency": 2
}
```

#### 4. GET /health/workers
Celery worker status check via Redis.

**Response (200 OK):**
```json
{
  "service": "celery_workers",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "ok",
  "workers": 3,
  "active": true
}
```

**Response (503 Service Unavailable):**
```json
{
  "service": "celery_workers",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "no_workers",
  "workers": 0,
  "active": false
}
```

#### 5. GET /health/full
Combined status of all system components.

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development",
  "memory": {
    "rss": 256,
    "heapUsed": 128,
    "heapTotal": 256,
    "external": 12
  },
  "checks": {
    "database": {
      "status": "ok",
      "latency": 5
    },
    "redis": {
      "status": "ok",
      "latency": 2
    },
    "workers": {
      "status": "ok",
      "workers": 3,
      "active": true
    }
  }
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "degraded",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development",
  "memory": {...},
  "checks": {
    "database": {
      "status": "ok",
      "latency": 5
    },
    "redis": {
      "status": "ok",
      "latency": 2
    },
    "workers": {
      "status": "no_workers",
      "workers": 0,
      "active": false
    }
  }
}
```

### Rate Limiting
All health endpoints are rate-limited to **10 requests per minute per IP** to prevent abuse.

### Status Codes
- **200 OK**: Service is healthy
- **503 Service Unavailable**: Service is down or degraded
- **429 Too Many Requests**: Rate limit exceeded

---

## Part 2: Metrics Collection

### Overview
Comprehensive metrics collection system for monitoring application performance, usage, and business metrics.

### Metrics Service API

The `MetricsService` class provides methods to collect different types of metrics:

#### Counter Metrics
Monotonically increasing values (e.g., total requests, cache hits).

```typescript
metricsService.incrementCounter('http_requests_total', {
  method: 'GET',
  path: '/api/stocks',
  status: 200
});
```

#### Histogram Metrics
Track distribution of values (e.g., request duration, latency).

```typescript
metricsService.recordHistogram('http_request_duration_ms', 125, {
  method: 'GET',
  path: '/api/stocks'
});
```

#### Gauge Metrics
Values that can go up or down (e.g., active connections, memory usage).

```typescript
metricsService.setGauge('websocket_connections_active', 42);
```

### Tracked Metrics

#### HTTP Metrics (Automatic)
- `http_requests_total` (counter) - Total HTTP requests by method, path, and status
- `http_request_duration_ms` (histogram) - HTTP request duration with percentiles

#### GraphQL Metrics (Automatic)
- `graphql_resolver_duration_ms` (histogram) - Resolver execution time
- `graphql_resolver_calls_total` (counter) - Total resolver calls

#### Cache Metrics
- `cache_hits_total` (counter) - Cache hits by cache type
- `cache_misses_total` (counter) - Cache misses by cache type

#### WebSocket Metrics
- `websocket_connections_active` (gauge) - Current active WebSocket connections

#### Business Metrics
- `active_users_daily` (gauge) - Daily active users
- `stock_page_views_total` (counter) - Stock page views by symbol
- `search_queries_total` (counter) - Search queries
- `subscription_upgrades_total` (counter) - Subscription upgrades by tier

### Metrics Endpoint

#### GET /metrics
Returns all metrics in JSON format.

**Authentication:** Bearer token (METRICS_API_KEY)

**Request:**
```bash
curl -H "Authorization: Bearer YOUR_METRICS_API_KEY" \
  http://localhost:4000/metrics
```

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "metrics": {
    "http_requests_total": [
      {
        "labels": {
          "method": "GET",
          "path": "/api/stocks",
          "status": 200
        },
        "value": 1523
      }
    ],
    "http_request_duration_ms": [
      {
        "labels": {
          "method": "GET",
          "path": "/api/stocks"
        },
        "count": 1523,
        "sum": 190375,
        "avg": 125.05,
        "p50": 115,
        "p95": 245,
        "p99": 380
      }
    ],
    "websocket_connections_active": [
      {
        "labels": {},
        "value": 42
      }
    ]
  }
}
```

#### GET /metrics/prometheus
Returns metrics in Prometheus format for scraping.

**Authentication:** Bearer token (METRICS_API_KEY)

**Request:**
```bash
curl -H "Authorization: Bearer YOUR_METRICS_API_KEY" \
  http://localhost:4000/metrics/prometheus
```

**Response:**
```
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/stocks",status="200"} 1523

# TYPE http_request_duration_ms histogram
http_request_duration_ms_count{method="GET",path="/api/stocks"} 1523
http_request_duration_ms_sum{method="GET",path="/api/stocks"} 190375
http_request_duration_ms_avg{method="GET",path="/api/stocks"} 125.05
http_request_duration_ms_p50{method="GET",path="/api/stocks"} 115.00
http_request_duration_ms_p95{method="GET",path="/api/stocks"} 245.00
http_request_duration_ms_p99{method="GET",path="/api/stocks"} 380.00

# TYPE websocket_connections_active gauge
websocket_connections_active 42
```

### Configuration

Add to `.env` file:

```env
# Monitoring Configuration
METRICS_API_KEY=secure-metrics-key-change-in-production
API_VERSION=1.0.0
```

### Security

- **Health endpoints**: Public but rate-limited (10 req/min per IP)
- **Metrics endpoints**: Protected with bearer token authentication
- **METRICS_API_KEY**: Must be configured as environment variable

### Automatic Tracking

The system automatically tracks:

1. **HTTP Requests**: All REST API requests via Fastify hooks
2. **GraphQL Resolvers**: All GraphQL operations via Apollo Server plugin
3. **Cache Operations**: Cache hits/misses (requires manual integration)
4. **WebSocket Connections**: Active connections (requires manual updates)

### Manual Tracking

For custom metrics, use the service directly:

```typescript
import { getMetricsService } from './services/metrics';

const metricsService = getMetricsService();

// Track custom business metric
metricsService.trackStockPageView('RELIANCE');
metricsService.trackSearchQuery('banking stocks');
metricsService.trackActiveUsers(1234);
```

### Integration with Monitoring Tools

#### Prometheus
Configure Prometheus to scrape the metrics endpoint:

```yaml
scrape_configs:
  - job_name: 'alpha-signal-api'
    static_configs:
      - targets: ['api:4000']
    metrics_path: '/metrics/prometheus'
    bearer_token: 'YOUR_METRICS_API_KEY'
```

#### Datadog
Use the JSON endpoint with custom integration:

```javascript
const response = await fetch('http://api:4000/metrics', {
  headers: {
    'Authorization': 'Bearer YOUR_METRICS_API_KEY'
  }
});
const metrics = await response.json();
// Send to Datadog
```

### Files Created

1. **Health Check Routes**: `/apps/api/src/routes/health.ts`
2. **Metrics Service**: `/apps/api/src/services/metrics.ts`
3. **Metrics Routes**: `/apps/api/src/routes/metrics.ts`
4. **Metrics Hooks**: `/apps/api/src/middleware/metricsHooks.ts`
5. **GraphQL Plugin**: `/apps/api/src/middleware/graphqlMetricsPlugin.ts`
6. **Tests**: `/apps/api/src/routes/__tests__/health.test.ts`

### Testing

Run the API and test the endpoints:

```bash
# Start the API
npm run dev

# Test health endpoints
curl http://localhost:4000/health
curl http://localhost:4000/health/db
curl http://localhost:4000/health/redis
curl http://localhost:4000/health/workers
curl http://localhost:4000/health/full

# Test metrics endpoint (requires authentication)
curl -H "Authorization: Bearer secure-metrics-key-change-in-production" \
  http://localhost:4000/metrics

curl -H "Authorization: Bearer secure-metrics-key-change-in-production" \
  http://localhost:4000/metrics/prometheus
```

### Performance Considerations

- Metrics are stored in-memory (suitable for single-instance deployments)
- Histogram values are limited to last 1000 entries per metric
- For multi-instance deployments, consider using Redis for metric aggregation
- Health checks use connection pooling to minimize overhead

### Future Enhancements

1. Add alerting based on metric thresholds
2. Implement metric persistence to TimescaleDB
3. Add custom dashboards for metric visualization
4. Integrate with external monitoring services (Grafana, New Relic)
5. Add distributed tracing support (OpenTelemetry)
