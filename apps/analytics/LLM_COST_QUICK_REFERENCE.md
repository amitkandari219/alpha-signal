# LLM Cost Tracking - Quick Reference

## 🚀 Quick Start

### 1. Apply Migration
```bash
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

### 2. Set Environment
```bash
# Add to .env
LLM_DAILY_COST_LIMIT_USD=100.0
ADMIN_API_KEY=your-secure-key
```

### 3. Run Tests
```bash
cd apps/analytics
python test_llm_cost_tracking.py
```

## 📝 Python Usage

### Log LLM Usage (Convenience Function)
```python
from utils.llm_cost_tracker import log_llm_usage

log_llm_usage(
    model="claude-sonnet-4-20250514",
    prompt_tokens=1500,
    completion_tokens=800,
    task_type="SUMMARY",  # SUMMARY, SENTIMENT, REPORT, OTHER
    company_id="uuid",    # Optional
    duration_ms=2350      # Optional
)
```

### Get Statistics
```python
from utils.llm_cost_tracker import LLMCostTracker

tracker = LLMCostTracker()

# Individual metrics
today = tracker.get_daily_cost()
weekly = tracker.get_weekly_cost()
monthly = tracker.get_monthly_cost()
calls = tracker.get_daily_call_count()

# All dashboard stats at once
stats = tracker.get_dashboard_stats()
print(f"Today: ${stats['today_usd']:.2f}")
print(f"Calls: {stats['calls_today']}")
```

### Check Limit
```python
status = tracker.check_daily_limit()
if status['exceeded']:
    print(f"⚠️ Limit exceeded! ${status['current_cost']:.2f} / ${status['limit']:.2f}")
```

## 🌐 API Usage

### Get Dashboard
```bash
curl -H "X-Admin-Api-Key: your-key" \
  http://localhost:4000/admin/dashboard
```

### Get Detailed Usage
```bash
# Last 30 days
curl -H "X-Admin-Api-Key: your-key" \
  http://localhost:4000/admin/llm-usage

# Custom date range
curl -H "X-Admin-Api-Key: your-key" \
  "http://localhost:4000/admin/llm-usage?startDate=2026-02-01&endDate=2026-02-08&limit=50"
```

### Get Alerts
```bash
curl -H "X-Admin-Api-Key: your-key" \
  http://localhost:4000/admin/alerts
```

## 💰 Cost Calculation

### Pricing (Claude Sonnet 4)
- Input: $3 / million tokens
- Output: $15 / million tokens

### Formula
```
cost = (input_tokens / 1M × $3) + (output_tokens / 1M × $15)
```

### Example
```
1,500 input + 800 output = $0.0165
```

## 📊 Database Queries

### Today's Total
```sql
SELECT SUM(estimated_cost_usd) as total
FROM llm_usage
WHERE created_at >= CURRENT_DATE;
```

### By Task Type
```sql
SELECT task_type, COUNT(*), SUM(estimated_cost_usd)
FROM llm_usage
WHERE created_at >= CURRENT_DATE
GROUP BY task_type;
```

### Top Companies
```sql
SELECT c.company_name, COUNT(*) as calls, SUM(l.estimated_cost_usd) as cost
FROM llm_usage l
JOIN companies c ON l.company_id = c.id
WHERE l.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.company_name
ORDER BY cost DESC
LIMIT 10;
```

## 🔔 Alerts

### Alert Trigger
- Checks every 5 minutes
- Fires when: `today_cost >= LLM_DAILY_COST_LIMIT_USD`
- 5-minute cooldown between alerts

### View Alerts
```bash
curl -H "X-Admin-Api-Key: your-key" \
  http://localhost:4000/admin/alerts
```

### Acknowledge Alert
```bash
curl -X POST \
  -H "X-Admin-Api-Key: your-key" \
  http://localhost:4000/admin/alerts/{alert-id}/acknowledge
```

## 🔧 Troubleshooting

### Not Logging?
1. Check migration: `npx prisma migrate status`
2. Check imports in `llm_engine.py`
3. Run test: `python test_llm_cost_tracking.py`

### Dashboard Empty?
1. Verify admin key: Check `ADMIN_API_KEY` env var
2. Check data: `SELECT COUNT(*) FROM llm_usage;`
3. Check API logs for errors

### Alerts Not Firing?
1. Check limit: `LLM_DAILY_COST_LIMIT_USD` must be set
2. Check monitoring: Look for "🚨 Alert monitoring started"
3. Check cooldown: 5-minute gap between same alerts

## 📁 Files

### Core:
- `utils/llm_cost_tracker.py` - Main tracking logic
- `routes/admin.ts` - Admin dashboard
- `services/alerting.ts` - Alert system

### Tests:
- `test_llm_cost_tracking.py` - Validation tests

### Docs:
- `LLM_COST_TRACKING.md` - Full documentation
- This file - Quick reference

## 🎯 Common Tasks

### View Today's Cost
```python
from utils.llm_cost_tracker import LLMCostTracker
print(f"${LLMCostTracker().get_daily_cost():.2f}")
```

### Check if Over Budget
```python
from utils.llm_cost_tracker import LLMCostTracker
status = LLMCostTracker().check_daily_limit()
print("Over budget!" if status['exceeded'] else "Within budget")
```

### Get This Month's Stats
```bash
curl -H "X-Admin-Api-Key: $ADMIN_KEY" \
  "http://localhost:4000/admin/llm-usage?startDate=$(date -d '1 month ago' +%Y-%m-%d)" \
  | jq '.summary'
```

## 📈 Dashboard Response

```json
{
  "llm_costs": {
    "today_usd": 2.45,          // Total cost today
    "this_week_usd": 15.80,     // Total cost this week
    "this_month_usd": 52.30,    // Total cost this month
    "calls_today": 48,          // Number of calls today
    "avg_cost_per_summary_usd": 0.03,  // Avg per SUMMARY task
    "projected_monthly_usd": 68.50     // Projected end-of-month
  }
}
```

## 🔑 Environment Variables

```bash
# Required for admin access
ADMIN_API_KEY=your-secure-key-here

# Optional - defaults to $100
LLM_DAILY_COST_LIMIT_USD=100.0

# Optional - for error tracking
SENTRY_DSN=
```

## 📞 Need Help?

1. **Full docs**: See `LLM_COST_TRACKING.md`
2. **Run tests**: `python test_llm_cost_tracking.py`
3. **Check logs**: Review API and analytics logs
4. **SQL direct**: Use Prisma Studio or psql

---

**Last Updated**: 2026-02-08
**Version**: 1.0.0
