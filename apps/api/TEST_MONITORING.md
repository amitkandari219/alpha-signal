# Monitoring System Test Plan

## Prerequisites

1. Ensure database is running:
```bash
docker ps | grep postgres
```

2. Ensure Redis is running:
```bash
docker ps | grep redis
```

3. Set the ADMIN_API_KEY in your `.env` file:
```bash
ADMIN_API_KEY=test-admin-key-12345
```

4. Start the API server:
```bash
cd apps/api
npm run dev
```

## Test 1: Admin Dashboard

### Expected Result
Should return comprehensive dashboard data with system health, user stats, revenue, performance metrics.

### Command
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  http://localhost:4000/admin/dashboard | jq
```

### Verify
- `success` is `true`
- `system.api_status` is `"healthy"`
- `system.db_status` is `"healthy"`
- `system.redis_status` is `"healthy"`
- `users` object contains counts
- `performance` object has metrics

## Test 2: Admin Dashboard Without Auth

### Expected Result
Should return 401 Unauthorized

### Command
```bash
curl -i http://localhost:4000/admin/dashboard
```

### Verify
- Status code is `401`
- Response contains "Unauthorized" error

## Test 3: Recent Alerts

### Expected Result
Should return list of alerts (may be empty initially)

### Command
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  http://localhost:4000/admin/alerts?limit=20 | jq
```

### Verify
- `success` is `true`
- `alerts` is an array
- Each alert has `severity`, `alertType`, `message`, `createdAt`

## Test 4: Filter Alerts by Severity

### Expected Result
Should return only CRITICAL alerts

### Command
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  "http://localhost:4000/admin/alerts?severity=CRITICAL" | jq
```

### Verify
- All returned alerts have `severity` = `"CRITICAL"`

## Test 5: Error Logs

### Expected Result
Should return list of error logs

### Command
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  http://localhost:4000/admin/errors?limit=10 | jq
```

### Verify
- `success` is `true`
- `errors` is an array
- Each error has `endpoint`, `method`, `statusCode`, `createdAt`

## Test 6: User List

### Expected Result
Should return paginated list of users

### Command
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  "http://localhost:4000/admin/users?limit=10" | jq
```

### Verify
- `success` is `true`
- `total` is a number
- `users` is an array with user objects

## Test 7: Subscription List

### Expected Result
Should return list of subscriptions

### Command
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  "http://localhost:4000/admin/subscriptions?limit=10" | jq
```

### Verify
- `success` is `true`
- `subscriptions` is an array

## Test 8: Alert Monitoring (Check Server Logs)

### Expected Result
Server logs should show alert checks running every 5 minutes

### Command
Check server console output for:
```
🚨 Alert monitoring started (checks every 5 minutes)
🔍 Running alert checks...
✅ Alert checks complete
```

### Verify
- Alert checks run automatically
- No errors in alert checking

## Test 9: Database Health Check (Simulate Failure)

### Expected Result
System should detect database down and create CRITICAL alert

### Steps
1. Stop PostgreSQL:
```bash
docker stop alpha-signal-postgres
```

2. Wait for next alert check (up to 5 minutes) or restart server

3. Check alerts:
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  http://localhost:4000/admin/alerts | jq
```

4. Restart PostgreSQL:
```bash
docker start alpha-signal-postgres
```

### Verify
- Alert with `alertType` = `"DATABASE_DOWN"` is created
- `severity` is `"CRITICAL"`
- Dashboard shows `db_status` = `"down"`

## Test 10: Redis Health Check (Simulate Failure)

### Expected Result
System should detect Redis down and create CRITICAL alert

### Steps
1. Stop Redis:
```bash
docker stop alpha-signal-redis
```

2. Wait for next alert check or restart server

3. Check alerts:
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  http://localhost:4000/admin/alerts | jq
```

4. Restart Redis:
```bash
docker start alpha-signal-redis
```

### Verify
- Alert with `alertType` = `"REDIS_DOWN"` is created
- `severity` is `"CRITICAL"`
- Dashboard shows `redis_status` = `"down"`

## Test 11: Acknowledge Alert

### Expected Result
Alert should be marked as acknowledged

### Steps
1. Get an alert ID from the alerts list:
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  http://localhost:4000/admin/alerts | jq '.[0].id'
```

2. Acknowledge the alert (replace ALERT_ID):
```bash
curl -X POST \
  -H "X-Admin-API-Key: test-admin-key-12345" \
  http://localhost:4000/admin/alerts/ALERT_ID/acknowledge | jq
```

3. Verify:
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  http://localhost:4000/admin/alerts | jq
```

### Verify
- POST returns `success: true`
- Alert's `acknowledged` field is now `true`

## Test 12: Error Logging

### Expected Result
Errors should be automatically logged to error_log table

### Steps
1. Trigger a 404 error:
```bash
curl http://localhost:4000/nonexistent-endpoint
```

2. Check error logs:
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  http://localhost:4000/admin/errors | jq
```

### Verify
- Error is logged with correct endpoint
- `statusCode` is `404`
- `method` is `GET`

## Test 13: Cache Statistics

### Expected Result
Dashboard should show cache hit ratio

### Steps
1. Make several requests to trigger cache:
```bash
curl http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'
```

2. Check dashboard:
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  http://localhost:4000/admin/dashboard | jq '.performance.cache_hit_ratio'
```

### Verify
- `cache_hit_ratio` is a number between 0 and 100

## Test 14: User Statistics

### Expected Result
Dashboard should show accurate user counts

### Steps
1. Register a new user via `/auth/register`
2. Check dashboard:
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  http://localhost:4000/admin/dashboard | jq '.users'
```

### Verify
- `total` count increases
- `registered_today` increases
- User tier counts are accurate

## Test 15: LLM Cost Tracking Alert

### Expected Result
Alert should trigger when daily LLM cost exceeds limit

### Steps
1. Set a low limit in `.env`:
```bash
LLM_DAILY_COST_LIMIT_USD=0.01
```

2. Restart server

3. Trigger some LLM usage (if implemented)

4. Check alerts:
```bash
curl -H "X-Admin-API-Key: test-admin-key-12345" \
  http://localhost:4000/admin/alerts | jq
```

### Verify
- Alert with `alertType` = `"LLM_COST_LIMIT_EXCEEDED"` is created
- `severity` is `"WARNING"`

## Summary Checklist

- [ ] Admin dashboard returns complete data
- [ ] Authentication works (401 without key)
- [ ] Alerts are created and stored
- [ ] Alerts can be filtered by severity
- [ ] Error logs are captured
- [ ] User list is paginated correctly
- [ ] Subscription list works
- [ ] Alert monitoring runs automatically
- [ ] Database health check works
- [ ] Redis health check works
- [ ] Alerts can be acknowledged
- [ ] Errors are logged automatically
- [ ] Cache statistics are tracked
- [ ] User statistics are accurate
- [ ] LLM cost tracking works

## Notes

- Alert checks run every 5 minutes, so some tests require patience
- Alert cooldowns prevent spam, so the same alert won't repeat for 5 minutes
- Some features (like LLM usage, weekly reports) depend on other system components

## Troubleshooting

### Dashboard returns empty data
- Ensure database has seed data
- Check database connection
- Verify Prisma migrations are applied

### Alerts not appearing
- Check server logs for alert checks
- Verify database tables exist: `alert_history`, `error_log`
- Ensure alert monitoring started (check logs for "🚨 Alert monitoring started")

### Authentication fails
- Verify `ADMIN_API_KEY` is set in `.env`
- Check header name is exactly `X-Admin-API-Key`
- Ensure no extra spaces in the key value
