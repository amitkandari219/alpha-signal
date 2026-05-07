# LLM Cost Tracking - Implementation Guide

## Overview

The LLM Cost Tracking system monitors and tracks all Claude API usage across the Alpha Signal platform, providing real-time cost visibility, budget alerts, and usage analytics.

## Architecture

### Components

1. **Database Model** (`llm_usage` table)
   - Stores every API call with token counts and costs
   - Indexed by task_type, company_id, and created_at
   - Tracks duration and metadata

2. **Python Utility** (`utils/llm_cost_tracker.py`)
   - Cost calculation based on Claude Sonnet pricing
   - Database logging
   - Statistics aggregation
   - Alert threshold checking

3. **Admin Dashboard** (`/admin/dashboard` endpoint)
   - Real-time cost metrics
   - Weekly/monthly projections
   - Per-task type breakdowns

4. **Alerting System**
   - Monitors daily cost limit
   - Sends alerts when threshold exceeded
   - Configurable via environment variable

## Database Schema

```sql
-- Enum for task types
CREATE TYPE "LLMTaskType" AS ENUM ('SUMMARY', 'SENTIMENT', 'REPORT', 'OTHER');

-- Main usage tracking table
CREATE TABLE "llm_usage" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "model" TEXT NOT NULL,
    "prompt_tokens" INTEGER NOT NULL,
    "completion_tokens" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "estimated_cost_usd" DECIMAL(10,6) NOT NULL,
    "task_type" "LLMTaskType" NOT NULL,
    "company_id" UUID,
    "duration_ms" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX "llm_usage_task_type_idx" ON "llm_usage"("task_type");
CREATE INDEX "llm_usage_company_id_idx" ON "llm_usage"("company_id");
CREATE INDEX "llm_usage_created_at_idx" ON "llm_usage"("created_at");
```

## Cost Calculation

### Claude Sonnet 4 Pricing (2026)

- **Input**: $3.00 per million tokens
- **Output**: $15.00 per million tokens

### Formula

```python
input_cost = (prompt_tokens / 1_000_000) * 3.0
output_cost = (completion_tokens / 1_000_000) * 15.0
total_cost = input_cost + output_cost
```

### Example

For a request with 1,500 input tokens and 800 output tokens:
```
Input cost:  1,500 / 1,000,000 × $3.00  = $0.0045
Output cost:   800 / 1,000,000 × $15.00 = $0.0120
Total cost:                               $0.0165
```

## Usage

### Python - Logging LLM Usage

```python
from utils.llm_cost_tracker import log_llm_usage

# Log an API call
usage_id = log_llm_usage(
    model="claude-sonnet-4-20250514",
    prompt_tokens=1500,
    completion_tokens=800,
    task_type="SUMMARY",
    company_id="uuid-here",  # Optional
    duration_ms=2350,         # Optional
    metadata={                # Optional
        'summary_type': 'business_overview',
        'temperature': 0.3
    }
)
```

### Python - Getting Cost Statistics

```python
from utils.llm_cost_tracker import LLMCostTracker

tracker = LLMCostTracker()

# Get today's cost
today_cost = tracker.get_daily_cost()

# Get weekly cost
weekly_cost = tracker.get_weekly_cost()

# Get monthly cost
monthly_cost = tracker.get_monthly_cost()

# Get dashboard stats
stats = tracker.get_dashboard_stats()
# Returns:
# {
#     'today_usd': 2.45,
#     'this_week_usd': 15.80,
#     'this_month_usd': 52.30,
#     'calls_today': 48,
#     'avg_cost_per_summary_usd': 0.03,
#     'projected_monthly_usd': 68.50
# }

# Check if daily limit exceeded
limit_status = tracker.check_daily_limit()
# Returns:
# {
#     'exceeded': False,
#     'current_cost': 45.20,
#     'limit': 100.00,
#     'percentage': 45.2,
#     'remaining': 54.80
# }
```

### API - Admin Dashboard

```bash
# Get comprehensive dashboard
curl -H "X-Admin-Api-Key: your-admin-key" \
  http://localhost:4000/admin/dashboard

# Response includes llm_costs section:
{
  "success": true,
  "timestamp": "2026-02-08T12:00:00Z",
  "llm_costs": {
    "today_usd": 2.45,
    "this_week_usd": 15.80,
    "this_month_usd": 52.30,
    "calls_today": 48,
    "avg_cost_per_summary_usd": 0.03,
    "projected_monthly_usd": 68.50
  },
  "system": { ... },
  "users": { ... },
  ...
}
```

### API - Detailed LLM Usage

```bash
# Get detailed usage breakdown
curl -H "X-Admin-Api-Key: your-admin-key" \
  "http://localhost:4000/admin/llm-usage?startDate=2026-02-01&limit=100"

# Response:
{
  "success": true,
  "date_range": {
    "start": "2026-02-01T00:00:00Z",
    "end": "2026-02-08T12:00:00Z"
  },
  "summary": {
    "total_calls": 245,
    "total_cost": 52.30,
    "total_tokens": 1250000
  },
  "by_task_type": [
    {
      "task_type": "SUMMARY",
      "calls": 180,
      "total_cost": 45.50,
      "total_tokens": 980000
    },
    {
      "task_type": "SENTIMENT",
      "calls": 65,
      "total_cost": 6.80,
      "total_tokens": 270000
    }
  ],
  "recent_usage": [ ... ]
}
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Monitoring & Alerting
ADMIN_API_KEY=your-secure-admin-key-change-in-production
METRICS_API_KEY=your-metrics-api-key

# Error Tracking (Optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# LLM Cost Tracking
LLM_DAILY_COST_LIMIT_USD=100.0
```

### Cost Limits

The daily cost limit triggers a **WARNING** alert when exceeded. Configure based on your budget:

- **Development**: $10-20/day
- **Staging**: $50/day
- **Production**: $100-500/day depending on scale

## Alerting

### Alert Types

When daily cost limit is exceeded:

- **Type**: `LLM_COST_LIMIT_EXCEEDED`
- **Severity**: `WARNING`
- **Message**: "Daily LLM cost limit exceeded. Review usage to optimize costs."
- **Cooldown**: 5 minutes between alerts

### Alert Channels

1. **Database** - Stored in `alert_history` table
2. **Console Logs** - Logged as warnings
3. **Admin Dashboard** - Shows unacknowledged alerts
4. **Email** - TODO: When SMTP configured

### Acknowledging Alerts

```bash
# Get unacknowledged alerts
curl -H "X-Admin-Api-Key: your-admin-key" \
  http://localhost:4000/admin/alerts

# Acknowledge an alert
curl -X POST \
  -H "X-Admin-Api-Key: your-admin-key" \
  http://localhost:4000/admin/alerts/{alert-id}/acknowledge
```

## Integration with LLM Engine

The LLM engine automatically logs all API calls:

```python
# In llm_engine.py _call_claude method

# ... API call happens ...

# Automatically logged
log_llm_usage(
    model=self.model,
    prompt_tokens=response.usage.input_tokens,
    completion_tokens=response.usage.output_tokens,
    task_type=task_type,
    company_id=company_id,
    duration_ms=duration_ms,
    metadata={...}
)
```

## Monitoring & Optimization

### Key Metrics to Track

1. **Daily Cost Trends**
   - Watch for unexpected spikes
   - Compare week-over-week

2. **Cost per Task Type**
   - Identify expensive operations
   - Optimize prompts for high-cost tasks

3. **Token Usage Patterns**
   - Monitor input/output ratios
   - Optimize context size

4. **Duration Metrics**
   - Correlate cost with latency
   - Identify slow operations

### Cost Optimization Strategies

1. **Prompt Engineering**
   - Reduce unnecessary context
   - Be more specific to get shorter responses
   - Use system prompts effectively

2. **Caching**
   - Cache frequently requested summaries
   - Set appropriate TTLs by summary type

3. **Batch Processing**
   - Group related requests
   - Process during off-peak hours

4. **Selective Generation**
   - Generate summaries on-demand
   - Prioritize high-value companies

## Testing

### Run Validation Tests

```bash
cd apps/analytics
python test_llm_cost_tracking.py
```

Tests cover:
- ✓ Cost calculation accuracy
- ✓ Database logging
- ✓ Statistics retrieval
- ✓ Dashboard aggregation
- ✓ Limit threshold checking

## Database Queries

### Daily cost breakdown

```sql
SELECT
  DATE(created_at) as date,
  task_type,
  COUNT(*) as calls,
  SUM(total_tokens) as total_tokens,
  SUM(estimated_cost_usd) as total_cost
FROM llm_usage
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at), task_type
ORDER BY date DESC, total_cost DESC;
```

### Top spending companies

```sql
SELECT
  c.company_name,
  COUNT(*) as api_calls,
  SUM(l.estimated_cost_usd) as total_cost
FROM llm_usage l
JOIN companies c ON l.company_id = c.id
WHERE l.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.company_name
ORDER BY total_cost DESC
LIMIT 10;
```

### Average cost by task type

```sql
SELECT
  task_type,
  COUNT(*) as calls,
  AVG(estimated_cost_usd) as avg_cost,
  AVG(total_tokens) as avg_tokens,
  AVG(duration_ms) as avg_duration
FROM llm_usage
GROUP BY task_type
ORDER BY avg_cost DESC;
```

## Troubleshooting

### Issue: Costs not being logged

**Check:**
1. Database migration applied: `npx prisma migrate deploy`
2. LLM engine importing correctly: Check `llm_engine.py` imports
3. Database connection: Test with `python test_llm_cost_tracking.py`

### Issue: Alerts not firing

**Check:**
1. Alert monitoring started: Look for "🚨 Alert monitoring started" in logs
2. Daily limit configured: Check `LLM_DAILY_COST_LIMIT_USD` env var
3. Alert cooldown: 5-minute cooldown between same alert types

### Issue: Dashboard not showing costs

**Check:**
1. Admin API key: Must match `ADMIN_API_KEY` env var
2. Database has data: Query `llm_usage` table directly
3. API logs: Check for errors in admin route handler

## Migration Guide

### Apply Database Migration

```bash
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

### Update LLM Engine

The LLM engine in `apps/analytics/src/engines/llm_engine.py` has been updated to automatically log usage. No manual changes needed if using the updated version.

### Restart Services

```bash
# Restart API server
cd apps/api
npm run dev

# Restart Celery workers (if running)
cd apps/analytics
celery -A src.celery_app worker --loglevel=info
```

## Security Considerations

1. **Admin API Key**
   - Use strong, random keys in production
   - Rotate regularly
   - Never commit to version control

2. **Cost Data**
   - Contains sensitive business metrics
   - Restrict access to admins only
   - Audit access logs

3. **Alert Spam**
   - 5-minute cooldown prevents spam
   - Adjust `ALERT_COOLDOWN_MS` if needed

## Future Enhancements

- [ ] Email alerts via SMTP
- [ ] Slack/Discord webhook notifications
- [ ] Cost forecasting with ML
- [ ] Per-user cost attribution
- [ ] Budget allocation by feature
- [ ] Cost anomaly detection
- [ ] Grafana dashboard integration
- [ ] Weekly cost reports

## Support

For issues or questions:
- Check logs: `apps/api` and `apps/analytics`
- Run tests: `python test_llm_cost_tracking.py`
- Review alerts: `/admin/alerts` endpoint
- Database queries: Use Prisma Studio or psql
