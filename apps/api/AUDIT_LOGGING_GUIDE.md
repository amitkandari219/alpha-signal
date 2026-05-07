# Audit Logging Guide - SEBI Compliance

## Overview

The audit logging system provides comprehensive tracking of all critical operations for regulatory compliance and security audits. Every significant action is logged with user context, timestamps, and metadata.

## Quick Start

### 1. Setup

First, create the audit_log table:

```bash
cd apps/api
npx tsx scripts/createAuditLogTable.ts
```

### 2. Import the Logger

```typescript
import {
  logAIGeneration,
  logScoreComputation,
  logUserRegistration,
  logPayment,
  logContentFlagged,
  logUserFeedback,
} from '../services/auditLogger';
```

## Usage Examples

### AI Content Generation

Log every time AI generates content (summaries, insights, recommendations):

```typescript
// In your AI generation service
const summary = await generateAISummary(symbol);

await logAIGeneration(
  userId,
  summary.id,
  {
    symbol: 'RELIANCE',
    type: 'business_overview',
    modelVersion: 'GPT-4 Turbo',
    tokensUsed: 1500,
  }
);
```

### Score Computation

Log whenever scores are calculated:

```typescript
// In your score calculation service
const qualityScore = await computeQualityScore(symbol);

await logScoreComputation(
  userId, // Can be undefined for system-level computations
  qualityScore.id,
  {
    symbol: 'RELIANCE',
    scoreType: 'QUALITY',
    value: 85,
    factors: {
      roe: 22.5,
      debt_to_equity: 0.3,
      promoter_holding: 50.2,
    },
  }
);
```

### User Registration

Log new user signups:

```typescript
// In your registration handler
const user = await createUser(email, password, name);

await logUserRegistration(
  user.id,
  req.ip,
  req.headers['user-agent'],
  {
    email: user.email,
    tier: 'FREE',
  }
);
```

### User Login

Track authentication attempts (both success and failure):

```typescript
// In your login handler
try {
  const user = await authenticateUser(email, password);

  await logUserLogin(
    user.id,
    req.ip,
    req.headers['user-agent'],
    true // success
  );

  return res.json({ token });
} catch (error) {
  await logUserLogin(
    attemptedUserId,
    req.ip,
    req.headers['user-agent'],
    false // failure
  );

  return res.status(401).json({ error: 'Invalid credentials' });
}
```

### Tier Changes

Log subscription upgrades/downgrades:

```typescript
// In your subscription service
await logTierChange(
  userId,
  subscription.id,
  {
    oldTier: 'FREE',
    newTier: 'PRO',
    reason: 'user_upgrade',
  }
);
```

### Payments

Track payment lifecycle:

```typescript
import { AuditAction } from '../services/auditLogger';

// Payment initiated
await logPayment(
  userId,
  order.id,
  AuditAction.PAYMENT_INITIATED,
  {
    amount: 299,
    currency: 'INR',
    plan: 'PRO_MONTHLY',
    razorpayOrderId: order.razorpay_order_id,
  }
);

// Payment success
await logPayment(
  userId,
  payment.id,
  AuditAction.PAYMENT_SUCCESS,
  {
    amount: 299,
    currency: 'INR',
    plan: 'PRO_MONTHLY',
    razorpayOrderId: order.razorpay_order_id,
    razorpayPaymentId: payment.razorpay_payment_id,
  }
);

// Payment failure
await logPayment(
  userId,
  payment.id,
  AuditAction.PAYMENT_FAILED,
  {
    amount: 299,
    currency: 'INR',
    plan: 'PRO_MONTHLY',
    razorpayOrderId: order.razorpay_order_id,
    errorCode: 'BAD_REQUEST_ERROR',
  }
);
```

### Content Moderation

Log when content is flagged by the SEBI filter:

```typescript
// In your content filter middleware
const validation = await validateAISummary(content);

if (!validation.isValid) {
  await logContentFlagged(
    userId,
    summaryId,
    {
      flaggedTerms: validation.flaggedTerms,
      severity: validation.severity,
      actionTaken: 'BLOCKED',
    }
  );

  throw new Error('Content contains prohibited terms');
}
```

### User Feedback

Log thumbs up/down feedback:

```typescript
// In your feedback handler
await logUserFeedback(
  userId,
  summaryId,
  {
    resourceType: 'AI_SUMMARY',
    rating: 'UP', // or 'DOWN'
    comment: req.body.comment, // optional
  }
);
```

### Portfolio/Watchlist Changes

Track portfolio and watchlist modifications:

```typescript
import { AuditAction } from '../services/auditLogger';

// Add to portfolio
await logPortfolioChange(
  userId,
  AuditAction.PORTFOLIO_ADD,
  holdingId,
  {
    symbol: 'RELIANCE',
    quantity: 10,
    avgPrice: 2450.50,
  }
);

// Add to watchlist
await logPortfolioChange(
  userId,
  AuditAction.WATCHLIST_ADD,
  watchlistItemId,
  {
    symbol: 'RELIANCE',
  }
);
```

### System Errors

Log critical system errors:

```typescript
// In global error handler
try {
  // ... operation
} catch (error) {
  await logSystemError(
    error.message,
    {
      code: error.code || 'INTERNAL_ERROR',
      stack: error.stack,
      endpoint: req.path,
    }
  );

  throw error;
}
```

## Querying Audit Logs

### Get User's Audit Trail

```typescript
import { getUserAuditLogs, AuditAction, ResourceType } from '../services/auditLogger';

// Get all logs for a user
const logs = await getUserAuditLogs(userId);

// Filter by action type
const aiLogs = await getUserAuditLogs(userId, {
  action: AuditAction.AI_GENERATION,
  limit: 50,
});

// Filter by resource type
const paymentLogs = await getUserAuditLogs(userId, {
  resourceType: ResourceType.PAYMENT,
  limit: 20,
});
```

### Get Audit Statistics

```typescript
import { getAuditStats } from '../services/auditLogger';

// Last 30 days
const stats = await getAuditStats(30);

// Last 7 days
const weekStats = await getAuditStats(7);
```

### Direct SQL Queries

```sql
-- View recent activity (last 30 days)
SELECT * FROM recent_audit_logs;

-- Find all failed operations
SELECT * FROM audit_log WHERE success = false ORDER BY created_at DESC;

-- Find all AI generations for a stock
SELECT * FROM audit_log
WHERE action = 'AI_GENERATION'
AND metadata->>'symbol' = 'RELIANCE'
ORDER BY created_at DESC;

-- Count operations by type
SELECT action, COUNT(*) FROM audit_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY COUNT(*) DESC;

-- Find payment failures
SELECT * FROM audit_log
WHERE action = 'PAYMENT_FAILED'
ORDER BY created_at DESC;

-- Track user activity
SELECT action, resource_type, created_at
FROM audit_log
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC
LIMIT 100;
```

## Best Practices

### 1. Always Log Critical Operations

Critical operations that MUST be logged:
- ✅ All AI content generation
- ✅ All score computations
- ✅ User authentication (login/registration)
- ✅ Subscription tier changes
- ✅ All payment events
- ✅ Content moderation actions
- ✅ Data exports

### 2. Include Relevant Metadata

```typescript
// ❌ Bad - minimal metadata
await logAIGeneration(userId, summaryId, { symbol: 'RELIANCE' });

// ✅ Good - comprehensive metadata
await logAIGeneration(userId, summaryId, {
  symbol: 'RELIANCE',
  type: 'quarterly_analysis',
  modelVersion: 'GPT-4 Turbo',
  tokensUsed: 1500,
  dataSource: 'BSE',
  quarterEnding: '2024-03-31',
});
```

### 3. Don't Fail on Audit Errors

Audit logging should never break the main operation:

```typescript
// The auditLogger service already handles this internally
// But if you're doing custom logging:
try {
  await logAudit(entry);
} catch (error) {
  console.error('Audit logging failed:', error);
  // Don't throw - continue with main operation
}
```

### 4. Capture IP and User Agent

For security-sensitive operations:

```typescript
await logUserLogin(
  userId,
  req.ip || req.connection.remoteAddress,
  req.headers['user-agent'],
  true
);
```

### 5. Regular Monitoring

Set up alerts for:
- High volume of failed payments
- Unusual AI generation patterns
- Multiple failed login attempts
- Content filtering violations

## SEBI Compliance Notes

### What to Log

According to SEBI guidelines, platforms must maintain:
1. **User Activity Logs**: All user actions (30-day retention minimum)
2. **Content Generation Logs**: AI-generated content with timestamps
3. **Financial Transaction Logs**: Payment records (7-year retention)
4. **Content Moderation Logs**: Flagged content and actions taken

### Retention Requirements

```sql
-- Keep financial logs for 7 years
-- Keep user activity for 90 days minimum
-- Keep content flags indefinitely

-- Clean up old non-financial logs (run monthly)
DELETE FROM audit_log
WHERE created_at < NOW() - INTERVAL '90 days'
AND resource_type NOT IN ('PAYMENT', 'SUBSCRIPTION', 'CONTENT');
```

### Access Control

Audit logs contain sensitive information. Implement:
- ✅ Admin-only access to full audit trail
- ✅ Users can view their own audit history (limited fields)
- ✅ Encrypt sensitive metadata fields
- ✅ Role-based access control for queries

## Troubleshooting

### Table doesn't exist

```bash
npx tsx apps/api/scripts/createAuditLogTable.ts
```

### Foreign key constraint error

Ensure users table exists before creating audit_log:

```sql
-- Check if users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'users'
);
```

### Performance issues

Add more indexes if needed:

```sql
-- Index on specific metadata fields
CREATE INDEX idx_audit_log_symbol ON audit_log((metadata->>'symbol'));

-- Index on time ranges
CREATE INDEX idx_audit_log_date_range ON audit_log(created_at DESC);
```

## Support

For questions about audit logging:
1. Check this guide
2. Review `/apps/api/src/services/auditLogger.ts`
3. Query the audit_log table directly for investigation

**Remember**: Audit logging is critical for SEBI compliance. Never disable or bypass it in production.
