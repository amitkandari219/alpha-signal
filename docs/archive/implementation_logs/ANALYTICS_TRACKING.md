# Analytics Tracking System

## Overview

Comprehensive analytics tracking system for Alpha Signal that captures user interactions, page views, and key events across the application. Data is stored in PostgreSQL and can optionally be sent to Google Analytics 4.

## Architecture

### Components

1. **Frontend Service** (`apps/web/src/services/analytics.ts`)
   - Singleton service that tracks events
   - Sends data to backend API
   - Integrates with GA4 (if configured)
   - Session management

2. **Backend API** (`apps/api/src/routes/analytics.ts`)
   - REST endpoint for receiving events
   - Stores events in PostgreSQL
   - Provides analytics query endpoints (admin)

3. **Database** (`page_analytics` table)
   - Stores all analytics events
   - Indexed for fast queries
   - Includes user_id, session_id, event data

4. **Google Analytics 4** (optional)
   - Configured via `VITE_GA4_ID` environment variable
   - Loaded dynamically in `index.html`
   - Parallel tracking with backend

## Tracked Events

### Core Events

| Event Name | Description | Tracked Data |
|-----------|-------------|--------------|
| `stock_page_view` | User views a stock detail page | symbol, companyName, sector, marketCapCategory |
| `screener_used` | User applies filters in screener | filterCount, resultCount |
| `watchlist_created` | User creates a watchlist | name, stockCount |
| `alert_created` | User creates a price alert | symbol, alertType |
| `upgrade_clicked` | User clicks upgrade prompt | location, targetTier, userTier |
| `payment_completed` | User completes payment | tier, amount, currency |
| `report_viewed` | User views a report | reportType, symbol |
| `ai_panel_expanded` | User expands AI panel | symbol, panelName |

### Additional Events

- `page_view` - Generic page view
- `search_performed` - Search functionality used
- `filter_applied` - Screener filter applied
- `portfolio_updated` - Portfolio modified
- `pricing_page_view` - Pricing page visited
- `sign_up_started` - Registration initiated
- `sign_up_completed` - Registration completed
- `login_completed` - User logged in

## Implementation

### Frontend Integration

#### 1. Import the Service

```typescript
import { analytics, AnalyticsEvents } from '../services/analytics';
```

#### 2. Track Events

```typescript
// Track stock page view
analytics.trackStockView('RELIANCE', {
  companyName: 'Reliance Industries',
  sector: 'Oil & Gas',
});

// Track screener usage
analytics.trackScreenerUsed(5, 42);

// Track upgrade click
analytics.trackUpgradeClicked('inline_prompt', 'PRO');

// Track custom event
analytics.trackEvent(AnalyticsEvents.REPORT_VIEWED, {
  reportType: 'quarterly',
  symbol: 'RELIANCE',
});
```

#### 3. Track Page Views

```typescript
useEffect(() => {
  analytics.trackPageView('Stock Detail', {
    symbol: 'RELIANCE',
    section: 'fundamentals',
  });
}, []);
```

### Backend API

#### POST /api/analytics

Store an analytics event.

**Request Body:**
```json
{
  "eventName": "stock_page_view",
  "eventData": {
    "symbol": "RELIANCE",
    "companyName": "Reliance Industries"
  },
  "pageUrl": "https://alphasignal.com/stock/RELIANCE",
  "referrer": "https://google.com",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "1234567890_abc123",
  "userId": "uuid-here" // optional
}
```

**Response:**
```json
{
  "success": true
}
```

#### GET /api/analytics/stats (Protected)

Get analytics statistics.

**Query Parameters:**
- `startDate` (optional) - Start date (ISO string)
- `endDate` (optional) - End date (ISO string)

**Response:**
```json
{
  "success": true,
  "stats": {
    "dateRange": {
      "start": "2026-01-01T00:00:00Z",
      "end": "2026-02-08T00:00:00Z"
    },
    "totalEvents": 15432,
    "uniqueUsers": 1234,
    "uniqueSessions": 2345,
    "eventBreakdown": [
      { "eventName": "stock_page_view", "count": 5432 },
      { "eventName": "screener_used", "count": 2341 }
    ],
    "topPages": [
      { "pageUrl": "/stock/RELIANCE", "count": 432 },
      { "pageUrl": "/screener", "count": 321 }
    ]
  }
}
```

#### GET /api/analytics/events/:eventName (Protected)

Get details for a specific event type.

**Query Parameters:**
- `limit` (optional) - Number of events to return (default: 100)

## Database Schema

```sql
CREATE TABLE page_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_data JSONB,
    page_url TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX page_analytics_user_id_idx ON page_analytics(user_id);
CREATE INDEX page_analytics_session_id_idx ON page_analytics(session_id);
CREATE INDEX page_analytics_event_name_idx ON page_analytics(event_name);
CREATE INDEX page_analytics_created_at_idx ON page_analytics(created_at);
```

## Configuration

### Environment Variables

#### Frontend (`.env`)

```bash
# API endpoint
VITE_API_URL=http://localhost:4000

# Google Analytics 4 (optional)
VITE_GA4_ID=G-XXXXXXXXXX

# Enable analytics in development
VITE_ANALYTICS_ENABLED=true
```

#### Backend

No additional configuration needed. Uses existing database connection.

## Setup Instructions

### 1. Run Database Migration

```bash
cd apps/api

# Option 1: Run test script (creates table if not exists)
npx tsx scripts/test-analytics.ts

# Option 2: Apply migration manually
psql -d alphasignal -f prisma/migrations/20260208120000_add_page_analytics/migration.sql
```

### 2. Configure Google Analytics 4 (Optional)

1. Create a GA4 property at https://analytics.google.com
2. Get your Measurement ID (format: G-XXXXXXXXXX)
3. Add to frontend `.env`:
   ```bash
   VITE_GA4_ID=G-XXXXXXXXXX
   ```

### 3. Test Analytics

```bash
# Run analytics test script
cd apps/api
npx tsx scripts/test-analytics.ts

# Expected output:
# ✅ Table ensured
# ✅ Indexes created
# ✅ Test event created
# ✅ Recent events: 5
# ✅ Event breakdown
# ✅ Unique sessions: 42
# ✅ Test event deleted
# ✨ All analytics tests passed!
```

### 4. Verify in Browser

1. Open browser DevTools (Network tab)
2. Navigate to a stock page
3. Look for POST request to `/api/analytics`
4. Check that event data is sent correctly

## Usage Examples

### Track Stock Page View

```typescript
// In StockDetailPage.tsx
useEffect(() => {
  if (stockData && symbol) {
    analytics.trackStockView(symbol, {
      companyName: stockData.companyName,
      sector: stockData.sector,
      marketCapCategory: stockData.marketCapCategory,
    });
  }
}, [stockData, symbol]);
```

### Track Screener Usage

```typescript
// In Screener.tsx
const applyFilters = () => {
  setDebouncedFilters(filters);

  const activeFilterCount = totalActiveFilters;
  analytics.trackScreenerUsed(activeFilterCount, filteredStocks.length);
};
```

### Track Upgrade Clicks

```typescript
// In UpgradePrompt.tsx
const handleUpgrade = () => {
  analytics.trackUpgradeClicked(
    variant === 'inline' ? 'inline_prompt' : 'modal_prompt',
    requiredTier
  );

  window.location.href = '/pricing';
};
```

### Track AI Panel Expansion

```typescript
// In AIIntelligencePanel.tsx
const handlePanelExpand = (isExpanded: boolean) => {
  if (isExpanded) {
    analytics.trackAIPanelExpanded(symbol, 'AI Intelligence');
  }
};

<CollapsiblePanel
  title="AI Intelligence"
  onExpand={handlePanelExpand}
  // ... other props
/>
```

## Querying Analytics Data

### SQL Queries

```sql
-- Get event counts by type
SELECT event_name, COUNT(*) as count
FROM page_analytics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_name
ORDER BY count DESC;

-- Get most viewed stocks
SELECT
  event_data->>'symbol' as symbol,
  COUNT(*) as views
FROM page_analytics
WHERE event_name = 'stock_page_view'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_data->>'symbol'
ORDER BY views DESC
LIMIT 10;

-- Get conversion funnel
SELECT
  SUM(CASE WHEN event_name = 'pricing_page_view' THEN 1 ELSE 0 END) as pricing_views,
  SUM(CASE WHEN event_name = 'upgrade_clicked' THEN 1 ELSE 0 END) as upgrade_clicks,
  SUM(CASE WHEN event_name = 'payment_completed' THEN 1 ELSE 0 END) as payments
FROM page_analytics
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Get user session duration (using first and last event)
SELECT
  session_id,
  MIN(created_at) as session_start,
  MAX(created_at) as session_end,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as duration_seconds,
  COUNT(*) as event_count
FROM page_analytics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY session_id
HAVING COUNT(*) > 1
ORDER BY duration_seconds DESC
LIMIT 20;
```

## Privacy & Compliance

### Data Retention

- Analytics events are stored indefinitely by default
- Consider implementing a data retention policy:
  ```sql
  -- Delete events older than 90 days
  DELETE FROM page_analytics
  WHERE created_at < NOW() - INTERVAL '90 days';
  ```

### User Privacy

- `user_id` is optional - tracks both authenticated and anonymous users
- `session_id` is stored in sessionStorage (cleared on browser close)
- No personally identifiable information (PII) is stored
- User can disable tracking by setting localStorage flag:
  ```javascript
  localStorage.setItem('analytics_disabled', 'true');
  ```

### GDPR Compliance

- Add cookie consent banner if required
- Provide opt-out mechanism
- Allow users to request data deletion
- Include analytics in privacy policy

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Event Volume** - Track daily event counts
2. **Error Rates** - Monitor failed event submissions
3. **Session Duration** - Average time users spend
4. **Conversion Rates** - Pricing page → Upgrade → Payment
5. **Feature Usage** - Which features are most used

### Alerting

Set up alerts for:
- Sudden drop in event volume (> 50% decrease)
- High error rates (> 5%)
- No events received for > 1 hour (during business hours)

## Troubleshooting

### Events Not Being Tracked

1. Check browser console for errors
2. Verify API endpoint is correct (`VITE_API_URL`)
3. Check network tab for failed requests
4. Ensure analytics is enabled in production

### Missing Event Data

1. Verify event schema matches expected format
2. Check that all required fields are provided
3. Look for validation errors in API logs

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check database connection string
3. Ensure `page_analytics` table exists
4. Run test script: `npx tsx scripts/test-analytics.ts`

## Future Enhancements

- [ ] Real-time analytics dashboard
- [ ] Funnel analysis visualizations
- [ ] A/B testing framework
- [ ] Cohort analysis
- [ ] Heatmap tracking
- [ ] Session replay
- [ ] Advanced user segmentation
- [ ] Predictive analytics

## Support

For questions or issues:
- Create an issue in the repository
- Contact the development team
- Check the API logs for errors
