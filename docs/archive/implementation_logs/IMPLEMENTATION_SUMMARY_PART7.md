# Implementation Summary - Part 7: LLM Cost Tracking

## ✅ Completed Tasks

### 1. Database Schema & Migration

**Created:**
- `/apps/api/prisma/schema.prisma` - Added `LLMTaskType` enum and `LLMUsage` model
- `/apps/api/prisma/migrations/20260208000001_add_llm_usage/migration.sql` - Database migration

**Features:**
- Tracks every Claude API call with token counts
- Stores costs calculated per call
- Indexed for efficient querying
- Supports task type categorization (SUMMARY, SENTIMENT, REPORT, OTHER)
- Optional company association
- Duration tracking in milliseconds

### 2. Python Cost Tracking Utility

**Created:**
- `/apps/analytics/utils/llm_cost_tracker.py` - Core tracking functionality
- `/apps/analytics/utils/__init__.py` - Package exports

**Key Features:**
```python
class LLMCostTracker:
    - calculate_cost()           # Claude Sonnet pricing: $3 input, $15 output per 1M tokens
    - log_usage()                # Log API call to database
    - get_daily_cost()           # Today's total cost
    - get_weekly_cost()          # This week's cost
    - get_monthly_cost()         # This month's cost
    - get_daily_call_count()     # Number of calls today
    - get_avg_cost_by_task_type() # Average per task type
    - get_projected_monthly_cost() # Project based on current pace
    - check_daily_limit()        # Check if limit exceeded
    - get_dashboard_stats()      # All metrics for dashboard
```

**Convenience Function:**
```python
log_llm_usage(model, prompt_tokens, completion_tokens, task_type, ...)
```

### 3. LLM Engine Integration

**Updated:**
- `/apps/analytics/src/engines/llm_engine.py`

**Changes:**
- Imported `log_llm_usage` utility
- Modified `_call_claude()` to automatically log all API calls
- Tracks duration, token counts, and task type
- Includes metadata (temperature, summary type, etc.)
- Gracefully handles logging failures without breaking API calls

### 4. Admin Dashboard Updates

**Updated:**
- `/apps/api/src/routes/admin.ts`

**New Endpoint Data:**
```json
{
  "llm_costs": {
    "today_usd": 2.45,
    "this_week_usd": 15.80,
    "this_month_usd": 52.30,
    "calls_today": 48,
    "avg_cost_per_summary_usd": 0.03,
    "projected_monthly_usd": 68.50
  }
}
```

**Endpoints:**
- `GET /admin/dashboard` - Comprehensive system metrics including LLM costs
- `GET /admin/llm-usage` - Detailed LLM usage breakdown with filtering

### 5. Alerting System

**Updated:**
- `/apps/api/src/services/alerting.ts`

**New Alert Condition:**
- **Type:** `LLM_COST_LIMIT_EXCEEDED`
- **Severity:** WARNING
- **Trigger:** When daily cost >= `LLM_DAILY_COST_LIMIT_USD`
- **Cooldown:** 5 minutes between alerts
- **Message:** "Daily LLM cost limit exceeded. Review usage to optimize costs."

**Check Function:**
```typescript
async function checkLLMCostLimit(): Promise<{
  exceeded: boolean;
  cost: number;
  limit: number;
}>
```

### 6. Environment Configuration

**Updated:**
- `/.env.example`

**Added Variables:**
```bash
# Monitoring & Alerting
METRICS_API_KEY=your-metrics-api-key-change-in-production
ADMIN_API_KEY=your-admin-api-key-change-in-production

# Error Tracking (Optional)
SENTRY_DSN=

# LLM Cost Tracking
LLM_DAILY_COST_LIMIT_USD=100.0
```

### 7. Testing & Validation

**Created:**
- `/apps/analytics/test_llm_cost_tracking.py` - Comprehensive test suite

**Tests:**
- ✓ Cost calculation accuracy (multiple scenarios)
- ✓ Database logging
- ✓ Cost retrieval (daily, weekly, monthly)
- ✓ Dashboard statistics aggregation
- ✓ Limit threshold checking

### 8. Documentation

**Created:**
- `/LLM_COST_TRACKING.md` - Complete implementation guide

**Covers:**
- Architecture overview
- Database schema
- Cost calculation formulas
- Python API usage
- REST API endpoints
- Configuration guide
- Alerting system
- Monitoring & optimization
- SQL queries
- Troubleshooting
- Migration guide

## 📊 Cost Calculation

### Claude Sonnet 4 Pricing (2026)
- **Input:** $3 per million tokens
- **Output:** $15 per million tokens

### Example Calculation
```
Request: 1,500 input + 800 output tokens
Input cost:  1,500 / 1,000,000 × $3  = $0.0045
Output cost:   800 / 1,000,000 × $15 = $0.0120
Total cost:                            $0.0165
```

## 🔄 Integration Points

### 1. Automatic Logging
Every Claude API call in `llm_engine.py` automatically logs:
- Token usage (input/output/total)
- Calculated cost
- Task type
- Company ID (if applicable)
- Duration
- Metadata

### 2. Admin Dashboard
Real-time cost visibility:
- Current day/week/month costs
- Call counts
- Average costs per task type
- Monthly projections

### 3. Alert System
Proactive monitoring:
- Checks every 5 minutes
- Alerts when daily limit exceeded
- Stores in `alert_history` table
- Visible in admin dashboard

## 🚀 Usage Examples

### Python - Log LLM Usage
```python
from utils.llm_cost_tracker import log_llm_usage

usage_id = log_llm_usage(
    model="claude-sonnet-4-20250514",
    prompt_tokens=1500,
    completion_tokens=800,
    task_type="SUMMARY",
    company_id="uuid-here",
    duration_ms=2350
)
```

### Python - Get Statistics
```python
from utils.llm_cost_tracker import LLMCostTracker

tracker = LLMCostTracker()
stats = tracker.get_dashboard_stats()
# Returns all metrics for dashboard
```

### API - Get Dashboard
```bash
curl -H "X-Admin-Api-Key: your-key" \
  http://localhost:4000/admin/dashboard
```

### API - Get Detailed Usage
```bash
curl -H "X-Admin-Api-Key: your-key" \
  "http://localhost:4000/admin/llm-usage?startDate=2026-02-01"
```

## 📁 Files Created/Modified

### Created:
1. `/apps/analytics/utils/__init__.py`
2. `/apps/analytics/utils/llm_cost_tracker.py`
3. `/apps/analytics/test_llm_cost_tracking.py`
4. `/apps/api/prisma/migrations/20260208000001_add_llm_usage/migration.sql`
5. `/LLM_COST_TRACKING.md`
6. `/IMPLEMENTATION_SUMMARY_PART7.md`

### Modified:
1. `/apps/api/prisma/schema.prisma` - Added LLMUsage model and LLMTaskType enum
2. `/apps/analytics/src/engines/llm_engine.py` - Integrated cost tracking
3. `/apps/api/src/routes/admin.ts` - Added LLM costs to dashboard
4. `/apps/api/src/services/alerting.ts` - Added cost limit alert
5. `/.env.example` - Added monitoring configuration

## ✅ Verification Checklist

- [x] Database schema defined with proper indexes
- [x] Migration file created
- [x] Python cost tracking utility implemented
- [x] Cost calculation follows Claude pricing
- [x] LLM engine automatically logs usage
- [x] Admin dashboard shows LLM costs
- [x] Detailed usage endpoint available
- [x] Alert condition for cost limit added
- [x] Environment variables documented
- [x] Test suite created
- [x] Comprehensive documentation written
- [x] Integration with existing monitoring system

## 🔧 Next Steps to Deploy

### 1. Apply Database Migration
```bash
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

### 2. Update Environment
Add to your `.env`:
```bash
ADMIN_API_KEY=your-secure-key
LLM_DAILY_COST_LIMIT_USD=100.0
```

### 3. Restart Services
```bash
# API Server
cd apps/api
npm run dev

# Celery Workers (if running)
cd apps/analytics
celery -A src.celery_app worker --loglevel=info
```

### 4. Run Tests
```bash
cd apps/analytics
python test_llm_cost_tracking.py
```

### 5. Verify Dashboard
```bash
curl -H "X-Admin-Api-Key: your-key" \
  http://localhost:4000/admin/dashboard
```

## 📈 Monitoring Recommendations

### Daily:
- Check dashboard for cost trends
- Review any cost limit alerts
- Monitor calls per task type

### Weekly:
- Analyze cost patterns
- Identify optimization opportunities
- Review projected monthly costs

### Monthly:
- Compare actual vs projected costs
- Audit high-cost operations
- Adjust daily limits if needed

## 🎯 Key Benefits

1. **Full Visibility** - Track every API call and its cost
2. **Budget Control** - Alerts prevent unexpected overages
3. **Optimization Insights** - Identify expensive operations
4. **Historical Data** - Analyze trends over time
5. **Company Attribution** - Track costs per company
6. **Task Type Analysis** - Understand cost by operation type
7. **Real-time Monitoring** - Dashboard with live metrics
8. **Automated Tracking** - No manual intervention needed

## 🔒 Security Notes

- Admin endpoints protected by API key authentication
- Cost data restricted to admin access only
- Environment variables for sensitive configuration
- No cost data exposed in public APIs
- Alert system prevents spam with cooldown

## 📊 Example Dashboard Output

```json
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
  "system": { "api_status": "healthy", ... },
  "users": { "total": 150, ... },
  "revenue": { "mrr": 25000, ... }
}
```

## 🎉 Success Criteria Met

✅ Track every Claude API call in llm_usage table
✅ Calculate costs per call (input: $3, output: $15 per million tokens)
✅ Store model, tokens, cost, task_type, company_id, duration
✅ Add LLM costs to /admin/dashboard response
✅ Show today, week, month costs and projections
✅ Alert when daily cost exceeds threshold
✅ Helper function for Python analytics scripts
✅ Environment variables in .env.example
✅ Integrated with existing codebase structure

## 🔮 Future Enhancements

- Email/Slack notifications for alerts
- Cost forecasting with ML
- Per-user cost attribution
- Budget allocation by feature
- Grafana dashboard integration
- Weekly automated reports
- Cost anomaly detection
- Optimization recommendations
