# Alpha Signal Database Schema

Complete PostgreSQL + TimescaleDB database schema for the Alpha Signal stock intelligence platform.

## Overview

This schema supports:
- **18 Prisma-managed tables** for core business logic
- **1 TimescaleDB hypertable** (`price_data`) for time-series OHLCV data
- **Comprehensive indexing** for optimized queries
- **Data retention policies** for efficient storage
- **Continuous aggregates** for pre-computed metrics

---

## Architecture

### Core Components

1. **Master Data** - Companies, Sectors, Industries
2. **Financial Data** - Results, Balance Sheet, Cash Flow
3. **Shareholding** - Patterns, Insider Transactions
4. **Technical Analysis** - Indicators, Price Data (TimescaleDB)
5. **Sentiment & News** - Articles, Sentiment Snapshots
6. **AI & Scoring** - Summaries, Composite Scores, Risk Flags
7. **User Management** - Users, Watchlists, Alerts, Portfolios

---

## Tables & Relationships

### 1. Master Data Tables

#### `sectors`
- Hierarchical sector structure with self-referencing parent
- Used for sector-level aggregation and filtering

```prisma
model Sector {
  id, name, slug, parentSectorId
  parentSector → Sector (self-reference)
  subSectors → Sector[]
  industries → Industry[]
  companies → Company[]
}
```

#### `industries`
- Sub-classification under sectors
- Many-to-one with sectors

```prisma
model Industry {
  id, name, slug, sectorId
  sector → Sector
  companies → Company[]
}
```

#### `companies`
- Master company registry
- Unique identifiers: NSE symbol, BSE code, ISIN
- Market cap classification: LARGE_CAP | MID_CAP | SMALL_CAP | MICRO_CAP

**Key Fields:**
- `nseSymbol` - NSE trading symbol (nullable)
- `bseCode` - BSE scrip code (nullable)
- `isin` - CHAR(12) unique identifier (required)
- `marketCapCategory` - Enum classification
- `isActive` - Soft delete flag
- `metadata` - JSON for flexible additional data

**Indexes:**
- B-tree on `nseSymbol`, `bseCode`
- Partial index on `isActive = true`
- Composite on `sectorId`, `industryId`

---

### 2. Financial Data Tables

#### `financial_results`
- Quarterly, Annual, and TTM (Trailing Twelve Months) results
- P&L metrics: revenue, profits, margins, EPS

**Unique Constraint:** `(companyId, fiscalYear, fiscalQuarter, periodType)`

**Indexes:**
- Composite: `(companyId, publishedAt)` for time-series queries

#### `balance_sheet_data`
- Assets, liabilities, equity
- Key ratios: current ratio, debt-to-equity, interest coverage

**Unique Constraint:** `(companyId, fiscalYear, fiscalQuarter)`

#### `cashflow_data`
- Operating, investing, financing cash flows
- Free cash flow and capex

**Unique Constraint:** `(companyId, fiscalYear, fiscalQuarter)`

#### `shareholding_patterns`
- Quarterly shareholding distribution
- Promoter, FII, DII, public holdings
- Pledge percentage tracking

**Unique Constraint:** `(companyId, quarter)`

#### `insider_transactions`
- Buy/sell transactions by insiders
- Person name, category, filing date
- Value and quantity tracking

**Index:** `(companyId, filingDate)`

---

### 3. Technical Analysis Tables

#### `technical_indicators`
- Daily technical indicators
- RSI, MACD, Bollinger Bands, Stochastics
- Moving averages (SMA/EMA 20, 50, 100, 200)
- Volume indicators (OBV, volume SMA)

**Unique Constraint:** `(companyId, date)`

**Index:** `(companyId, date)` for time-series

#### `price_data` (TimescaleDB Hypertable)
- **Not managed by Prisma** - direct SQL access only
- OHLCV data at multiple intervals:
  - `MIN_1` - 1-minute candles (30-day retention)
  - `MIN_5` - 5-minute candles (90-day retention)
  - `MIN_15` - 15-minute candles (180-day retention)
  - `HOUR_1` - Hourly candles (365-day retention)
  - `DAILY` - Daily candles (indefinite retention)

**Continuous Aggregates:**
- `price_data_daily` - Daily OHLCV from minute data
- `price_data_hourly` - Hourly OHLCV from minute data

**Helper Functions:**
- `get_latest_price(company_id, interval)` - Latest price
- `get_price_history(company_id, interval, start, end)` - Range query
- `calculate_price_change(company_id, interval, periods)` - % change

---

### 4. News & Sentiment Tables

#### `news_articles`
- Company and sector-level news
- Sentiment scoring: POSITIVE | NEGATIVE | NEUTRAL
- Impact rating: HIGH | MEDIUM | LOW
- Risk tags array for flagged topics

**Indexes:**
- `(companyId, publishedAt)`
- `(sectorId, publishedAt)`
- `(publishedAt)` for recent news

#### `sentiment_snapshots`
- Daily aggregated sentiment scores
- News sentiment + social sentiment → composite
- Sample size tracking

**Unique Constraint:** `(companyId, date)`

---

### 5. AI & Scoring Tables

#### `ai_summaries`
- AI-generated insights for companies
- Types: BUSINESS_OVERVIEW, EARNINGS_SUMMARY, BULL_CASE, BEAR_CASE, NEWS_DIGEST, RISK_ASSESSMENT, CURRENT_THESIS
- Model version and prompt version tracking
- Confidence levels: HIGH | MEDIUM | LOW

**Indexes:**
- `(companyId, summaryType)`
- `(generatedAt)` for freshness queries

#### `composite_scores`
- Daily computed scores (0-100 each):
  - Quality Score
  - Growth Score
  - Risk Score
  - Sentiment Score
  - Momentum Score
- Factor breakdown stored as JSON

**Unique Constraint:** `(companyId, date)`

**Indexes:**
- `(companyId, date)`
- `(date)` for cross-company comparisons

#### `risk_flags`
- Active risk alerts for companies
- Types: PROMOTER_PLEDGE, AUDITOR_CONCERN, RELATED_PARTY, DEBT_SPIRAL, EARNINGS_MANIPULATION, GOVERNANCE, LITIGATION, REGULATORY
- Severity: HIGH | MEDIUM | LOW
- Evidence stored as JSON
- `resolvedAt` nullable for flag resolution

**Indexes:**
- `(companyId, isActive)`
- Partial index on `severity = HIGH`
- `(detectedAt)` for recent flags

---

### 6. User & Portfolio Tables

#### `users`
- User authentication and profile
- Tier-based access: FREE | PRO | PREMIUM
- Last login tracking

#### `watchlists`
- User-created company lists
- Array of company IDs
- Alert configuration stored as JSON

**Index:** `(userId)`

#### `alerts`
- User-defined price and event alerts
- Condition types: PRICE_ABOVE, PRICE_BELOW, VOLUME_SPIKE, SENTIMENT_CHANGE, RISK_FLAG, SCORE_CHANGE
- Threshold values
- Last triggered timestamp

**Indexes:**
- `(userId, isActive)`
- `(companyId)`

#### `user_portfolios`
- User stock holdings
- Quantity, average price
- Unrealized P&L tracking

**Unique Constraint:** `(userId, companyId)`

---

## Data Types

### UUID Fields
All primary keys use UUID (`@db.Uuid`) for:
- Distributed system compatibility
- Non-sequential IDs for security
- Easier data migration

### Decimal Fields
Financial data uses `Decimal` type:
- `DECIMAL(20, 2)` - Large values (revenue, assets)
- `DECIMAL(10, 2)` - Prices, smaller values
- `DECIMAL(5, 2)` - Percentages, ratios
- `DECIMAL(5, 4)` - Sentiment scores (-1 to 1)

### JSON Fields
Flexible data storage:
- `metadata` in companies - Additional properties
- `rawData` in financial tables - Source data preservation
- `content` in AI summaries - Structured AI output
- `factorBreakdown` in scores - Component details
- `evidence` in risk flags - Supporting data
- `alertConfig` in watchlists - Custom alert rules

### Array Fields
- `String[]` for `riskTags` in news
- `String[]` for `companyIds` in watchlists

---

## Indexing Strategy

### B-Tree Indexes
Standard indexes on frequently queried columns:
```sql
@@index([companyId, date])      -- Time-series queries
@@index([nseSymbol])            -- Symbol lookups
@@index([sectorId])             -- Sector filtering
```

### Partial Indexes
Conditional indexes for subset queries:
```sql
@@index([isActive], where: { isActive: true })     -- Active companies only
@@index([severity], where: { severity: HIGH })     -- High-severity flags
```

### Composite Indexes
Multi-column indexes for complex queries:
```sql
@@index([companyId, publishedAt])    -- Company news timeline
@@index([userId, isActive])          -- Active user alerts
```

### Unique Constraints
Prevent duplicate data:
```sql
@@unique([companyId, fiscalYear, fiscalQuarter, periodType])  -- Financial results
@@unique([companyId, date])                                    -- Daily metrics
@@unique([userId, companyId])                                  -- Portfolio holdings
```

---

## TimescaleDB Features

### Hypertables
`price_data` is converted to a hypertable:
```sql
SELECT create_hypertable('price_data', 'timestamp', chunk_time_interval => INTERVAL '1 day');
```

**Benefits:**
- Automatic partitioning by time
- Efficient compression
- Fast time-range queries
- Parallel query execution

### Compression
Older data is automatically compressed:
```sql
ALTER TABLE price_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'company_id, interval',
    timescaledb.compress_orderby = 'timestamp DESC'
);
```

**Compression Policy:** Compress chunks older than 7 days

### Retention Policies
Automatic data deletion:
```sql
SELECT add_retention_policy('price_data', INTERVAL '30 days');
```

**Application-Level Retention:**
- MIN_1: 30 days
- MIN_5: 90 days
- MIN_15: 180 days
- HOUR_1: 365 days
- DAILY: Indefinite

### Continuous Aggregates
Pre-computed views for faster queries:

**Daily Aggregate:**
```sql
CREATE MATERIALIZED VIEW price_data_daily AS
SELECT company_id, time_bucket('1 day', timestamp) AS day,
       FIRST(open, timestamp) AS open,
       MAX(high) AS high,
       MIN(low) AS low,
       LAST(close, timestamp) AS close,
       SUM(volume) AS volume
FROM price_data
GROUP BY company_id, day;
```

**Refresh Policy:** Every 1 hour

---

## Usage Examples

### Prisma Client (TypeScript)

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get company with relationships
const company = await prisma.company.findUnique({
  where: { nseSymbol: 'RELIANCE' },
  include: {
    sector: true,
    industry: true,
    financialResults: {
      where: { periodType: 'QUARTERLY' },
      orderBy: { publishedAt: 'desc' },
      take: 4,
    },
    compositeScores: {
      orderBy: { date: 'desc' },
      take: 1,
    },
    riskFlags: {
      where: { isActive: true },
    },
  },
});

// Get top companies by quality score
const topQuality = await prisma.compositeScore.findMany({
  where: {
    date: new Date('2024-02-08'),
    qualityScore: { gte: 80 },
  },
  include: {
    company: {
      select: { nseSymbol: true, companyName: true },
    },
  },
  orderBy: { qualityScore: 'desc' },
  take: 10,
});

// Create a watchlist
const watchlist = await prisma.watchlist.create({
  data: {
    userId: 'user-uuid',
    name: 'Tech Stocks',
    companyIds: ['company-uuid-1', 'company-uuid-2'],
    alertConfig: {
      priceChangeThreshold: 5,
      volumeSpikeMultiplier: 2,
    },
  },
});
```

### Direct SQL (TimescaleDB)

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get latest price (using helper function)
const latestPrice = await prisma.$queryRaw`
  SELECT * FROM get_latest_price(${companyId}::uuid, 'DAILY');
`;

// Get intraday 5-minute candles
const intraday = await prisma.$queryRaw`
  SELECT timestamp, open, high, low, close, volume
  FROM price_data
  WHERE company_id = ${companyId}::uuid
    AND interval = 'MIN_5'
    AND timestamp >= NOW() - INTERVAL '1 day'
  ORDER BY timestamp ASC;
`;

// Get daily aggregate
const dailyAggregate = await prisma.$queryRaw`
  SELECT day, open, high, low, close, volume
  FROM price_data_daily
  WHERE company_id = ${companyId}::uuid
    AND day >= NOW() - INTERVAL '90 days'
  ORDER BY day DESC;
`;

// Calculate percentage change
const priceChange = await prisma.$queryRaw`
  SELECT * FROM calculate_price_change(${companyId}::uuid, 'DAILY', 1);
`;
```

---

## Migration Workflow

### Initial Setup

1. **Start PostgreSQL with TimescaleDB:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Run Prisma migrations:**
   ```bash
   npx prisma migrate dev
   ```

3. **Run TimescaleDB setup:**
   ```bash
   psql $DATABASE_URL -f apps/api/prisma/migrations/20260208000000_timescaledb_setup/migration.sql
   ```

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

### Schema Updates

1. **Modify `schema.prisma`**
2. **Create migration:**
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```
3. **Apply to production:**
   ```bash
   npx prisma migrate deploy
   ```

### Seeding Data

```bash
npx prisma db seed
```

---

## Performance Optimization

### Query Optimization
- Use `include` and `select` to limit fetched data
- Add indexes on frequently filtered columns
- Use `take` and `skip` for pagination
- Leverage TimescaleDB continuous aggregates

### Connection Pooling
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});
```

### Batch Operations
```typescript
// Use transactions for multiple writes
await prisma.$transaction([
  prisma.company.update({ ... }),
  prisma.compositeScore.create({ ... }),
  prisma.riskFlag.updateMany({ ... }),
]);
```

---

## Monitoring & Maintenance

### Check Hypertable Status
```sql
SELECT * FROM timescaledb_information.hypertables;
```

### View Chunk Information
```sql
SELECT * FROM timescaledb_information.chunks
WHERE hypertable_name = 'price_data';
```

### Monitor Compression
```sql
SELECT * FROM timescaledb_information.compression_settings;
```

### Check Continuous Aggregate Status
```sql
SELECT * FROM timescaledb_information.continuous_aggregates;
```

### Analyze Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM price_data
WHERE company_id = 'uuid' AND timestamp > NOW() - INTERVAL '7 days';
```

---

## Environment Variables

Required in `.env`:

```env
DATABASE_URL="postgresql://alpha_user:password@localhost:5432/alpha_signal?schema=public"
```

---

## Schema Version

**Version:** 1.0.0
**Last Updated:** February 8, 2026
**Prisma Version:** 5.x
**PostgreSQL Version:** 16.x
**TimescaleDB Version:** 2.x

---

## Support

For schema questions or issues:
- Check Prisma docs: https://www.prisma.io/docs
- TimescaleDB docs: https://docs.timescale.com
- Project documentation: `/docs`
