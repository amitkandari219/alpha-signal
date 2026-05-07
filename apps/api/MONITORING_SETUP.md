# Monitoring System Implementation

This document describes Part 5 (Admin Dashboard) and Part 6 (Alerting) of the Alpha Signal monitoring system.

## Part 5: Admin Dashboard

### Endpoint: GET /admin/dashboard

Protected endpoint that requires `ADMIN_API_KEY` via the `X-Admin-API-Key` header.

### Authentication

Add to your `.env` file:
```bash
ADMIN_API_KEY=your-secure-admin-key-here
```

Pass the key in your request:
```bash
curl -H "X-Admin-API-Key: your-secure-admin-key-here" \
  http://localhost:4000/admin/dashboard
```

### Response Structure

```json
{
  "success": true,
  "timestamp": "2026-02-08T12:00:00.000Z",
  "system": {
    "api_status": "healthy",
    "db_status": "healthy",
    "redis_status": "healthy",
    "workers_status": "healthy",
    "uptime_hours": 2.5,
    "unacknowledged_alerts": 0
  },
  "users": {
    "total": 150,
    "free": 120,
    "pro": 25,
    "premium": 5,
    "registered_today": 3,
    "active_today": 45
  },
  "revenue": {
    "mrr": 15000,
    "payments_today": 2,
    "payments_this_month": 18,
    "failed_payments": 1
  },
  "content": {
    "companies_tracked": 500,
    "ai_summaries_total": 1500,
    "weekly_reports_published": 0
  },
  "performance": {
    "avg_response_time_ms": 150,
    "p95_response_time_ms": 350,
    "cache_hit_ratio": 75.5,
    "errors_today": 2
  },
  "pipelines": {
    "last_price_update": "2026-02-08T11:55:00.000Z",
    "last_news_ingestion": "2026-02-08T11:50:00.000Z",
    "last_score_computation": "2026-02-08T11:45:00.000Z"
  },
  "top_stocks_today": [
    { "symbol": "TCS", "views": 150 },
    { "symbol": "INFY", "views": 120 }
  ]
}
```

### Additional Admin Endpoints

#### GET /admin/alerts
Get recent alerts with optional filtering:
```bash
curl -H "X-Admin-API-Key: your-key" \
  "http://localhost:4000/admin/alerts?limit=50&severity=CRITICAL"
```

#### POST /admin/alerts/:id/acknowledge
Acknowledge a specific alert:
```bash
curl -X POST \
  -H "X-Admin-API-Key: your-key" \
  http://localhost:4000/admin/alerts/{alert-id}/acknowledge
```

#### GET /admin/errors
Get recent error logs:
```bash
curl -H "X-Admin-API-Key: your-key" \
  "http://localhost:4000/admin/errors?limit=100&statusCode=500"
```

#### GET /admin/users
Get user list with filtering:
```bash
curl -H "X-Admin-API-Key: your-key" \
  "http://localhost:4000/admin/users?limit=50&tier=PREMIUM&search=john"
```

#### GET /admin/subscriptions
Get subscription list:
```bash
curl -H "X-Admin-API-Key: your-key" \
  "http://localhost:4000/admin/subscriptions?limit=50&status=ACTIVE"
```

## Part 6: Alerting System

### Overview

The alerting system monitors critical conditions every 5 minutes and logs alerts to the `alert_history` table.

### Alert Severities

- **CRITICAL**: Requires immediate action (e.g., database down, Redis down, no workers)
- **WARNING**: Requires attention (e.g., high error rate, slow response time)
- **INFO**: Informational (e.g., new payments, user milestones)

### Alert Conditions

#### CRITICAL Alerts

1. **DATABASE_DOWN**: Database connection failed
2. **REDIS_DOWN**: Redis connection failed
3. **WORKERS_DOWN**: No Celery workers active

#### WARNING Alerts

1. **HIGH_ERROR_RATE**: Error rate exceeds 5%
2. **SLOW_RESPONSE_TIME**: Average response time exceeds 2 seconds
3. **LOW_CACHE_HIT_RATIO**: Cache hit ratio below 50%
4. **STALE_PRICE_UPDATES**: No price updates in 30 minutes during market hours (9:15 AM - 3:30 PM IST, Mon-Fri)
5. **LLM_COST_LIMIT_EXCEEDED**: Daily LLM cost exceeds configured limit

#### INFO Alerts

1. **NEW_PAYMENT**: New payment(s) received
2. **USER_MILESTONE**: User milestone reached (every 100 users)

### Configuration

Add to your `.env` file:
```bash
# LLM Cost Tracking
LLM_DAILY_COST_LIMIT_USD=100.0

# SMTP Configuration (optional - for email alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ALERT_EMAIL_TO=admin@yourcompany.com
```

### Alert Cooldown

To prevent alert spam, each alert type has a 5-minute cooldown period. Once an alert is triggered, the same alert won't be triggered again for 5 minutes.

### Database Schema

#### alert_history Table

```sql
CREATE TABLE alert_history (
  id UUID PRIMARY KEY,
  severity VARCHAR(20) NOT NULL, -- CRITICAL, WARNING, INFO
  alert_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### error_log Table

```sql
CREATE TABLE error_log (
  id UUID PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  error_type VARCHAR(255),
  error_message TEXT,
  stack_trace TEXT,
  user_id UUID,
  request_body JSONB,
  user_agent VARCHAR(500),
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Usage in Code

#### Logging Errors

The error logging is integrated into the global error handler. Errors are automatically logged to the `error_log` table.

#### Running Alert Checks Manually

```typescript
import { runAlertChecks } from './services/alerting.js';

// Run all alert checks
await runAlertChecks();
```

#### Getting Recent Alerts

```typescript
import { getRecentAlerts, getUnacknowledgedCount } from './services/alerting.js';

// Get last 50 alerts
const alerts = await getRecentAlerts(50);

// Get count of unacknowledged alerts
const count = await getUnacknowledgedCount();
```

#### Acknowledging Alerts

```typescript
import { acknowledgeAlert } from './services/alerting.js';

await acknowledgeAlert('alert-uuid-here');
```

## Data Sources

The admin dashboard queries data from:

- **users** table: User statistics
- **subscriptions** table: Subscription and revenue data
- **payments** table: Payment statistics
- **page_analytics** table: Page views and stock views
- **error_log** table: Error tracking
- **company** table: Companies tracked
- **ai_summary** table: AI summaries count
- **news_article** table: Last news ingestion timestamp
- **composite_score** table: Last score computation timestamp
- Redis cache: Cache hit ratio statistics

## Performance Metrics

### Tracked Metrics

1. **avg_response_time_ms**: Average response time across all requests
2. **p95_response_time_ms**: 95th percentile response time
3. **cache_hit_ratio**: Percentage of cache hits vs misses
4. **errors_today**: Number of errors logged today

### Collecting Metrics

Response times are automatically tracked by the metrics middleware. Cache statistics are collected from the Redis cache service.

## Market Hours Detection

The alerting system detects IST market hours (9:15 AM - 3:30 PM, Monday-Friday) for price update monitoring. This ensures alerts for stale price data are only sent during active trading hours.

## Testing

### Test Admin Dashboard

```bash
# Make sure the server is running
npm run dev

# Test the dashboard endpoint
curl -H "X-Admin-API-Key: your-admin-api-key-change-in-production" \
  http://localhost:4000/admin/dashboard | jq
```

### Test Alert System

The alert system runs automatically every 5 minutes. To test manually:

1. Stop Redis: `docker stop alpha-signal-redis`
2. Wait for alert check cycle (5 minutes) or restart the server
3. Check alerts: `curl -H "X-Admin-API-Key: your-key" http://localhost:4000/admin/alerts`
4. Restart Redis: `docker start alpha-signal-redis`

### Test Error Logging

Trigger an error and check the error log:

```bash
# Trigger an error (invalid endpoint)
curl http://localhost:4000/invalid-endpoint

# Check error logs
curl -H "X-Admin-API-Key: your-key" \
  http://localhost:4000/admin/errors | jq
```

## Production Considerations

### Email Alerts

In production, configure SMTP settings to send email alerts for CRITICAL severity issues:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
ALERT_EMAIL_TO=oncall@yourcompany.com
```

### Alert Integrations

For production, consider integrating with:

- **PagerDuty**: For on-call alerts
- **Slack**: For team notifications
- **Discord**: For community/team alerts
- **Datadog/New Relic**: For advanced monitoring

### Security

1. **Use strong ADMIN_API_KEY**: Generate a secure random key
2. **Enable HTTPS**: Use SSL/TLS in production
3. **Rate limiting**: Protect admin endpoints with rate limiting
4. **IP whitelisting**: Restrict admin endpoints to specific IPs
5. **Audit logging**: Log all admin actions for compliance

### Scaling

For high-traffic production environments:

1. **External monitoring**: Use Prometheus + Grafana for metrics
2. **Distributed tracing**: Add OpenTelemetry for request tracing
3. **Log aggregation**: Use ELK stack or Datadog for logs
4. **Alert deduplication**: Use tools like Alertmanager
5. **Runbooks**: Create runbooks for each alert type

## Troubleshooting

### Dashboard returns 401

- Verify `ADMIN_API_KEY` is set in `.env`
- Check the header name is `X-Admin-API-Key` (case-sensitive)
- Ensure the key matches exactly (no extra spaces)

### No alerts being generated

- Check server logs for alert check cycles (every 5 minutes)
- Verify the alert monitoring was started: `🚨 Alert monitoring started`
- Check database for `alert_history` table

### Alert cooldown not working

- Alert cooldowns are stored in-memory and reset on server restart
- For persistent cooldowns, implement Redis-based storage

## Related Files

- `/apps/api/src/routes/admin.ts`: Admin dashboard routes
- `/apps/api/src/services/alerting.ts`: Alert monitoring service
- `/apps/api/src/services/metrics.ts`: Metrics collection service
- `/apps/api/prisma/schema.prisma`: Database schema
