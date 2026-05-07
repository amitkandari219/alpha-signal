# Weekly Reports System - API Documentation

This document describes the complete Weekly Reports system implementation, including database schema, GraphQL API, and REST API endpoints.

## Table of Contents

1. [Database Schema](#database-schema)
2. [GraphQL API](#graphql-api)
3. [REST API](#rest-api)
4. [Newsletter System](#newsletter-system)
5. [Usage Examples](#usage-examples)

---

## Database Schema

### Enums

```prisma
enum ReportType {
  SECTOR_WEEKLY    // Weekly report for a specific sector
  MACRO_WEEKLY     // Weekly macroeconomic report
}

enum SectionType {
  TEXT             // Rich text content
  CHART_DATA       // Data for charts/graphs
  TABLE_DATA       // Tabular data
  METRIC_CARDS     // Key metrics display
  STOCK_LIST       // List of stocks with metrics
}

enum NewsletterFrequency {
  WEEKLY           // Weekly newsletter
  DAILY            // Daily newsletter
}
```

### Models

#### WeeklyReport
Stores weekly reports for sectors or macro economy.

```prisma
model WeeklyReport {
  id              String       @id @default(uuid())
  reportType      ReportType   // SECTOR_WEEKLY or MACRO_WEEKLY
  sectorId        String?      // FK to Sector (null for macro reports)
  title           String       // Report title
  slug            String       @unique // URL-friendly slug
  coverImageUrl   String?      // Cover image URL
  summary         String       @db.Text // 150-200 words summary
  fullContent     Json         // Structured content (sections)
  publishedAt     DateTime?    // Publication timestamp
  fiscalWeek      Int          // Week number (1-52)
  fiscalYear      Int          // Year
  isPublished     Boolean      @default(false)
  viewCount       Int          @default(0)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  sector          Sector?
  reportSections  ReportSection[]
  newsletterQueue NewsletterQueue[]

  @@unique([reportType, sectorId, fiscalYear, fiscalWeek])
  @@index([reportType, isPublished, publishedAt])
}
```

#### ReportSection
Individual sections within a report.

```prisma
model ReportSection {
  id           String      @id @default(uuid())
  reportId     String      // FK to WeeklyReport
  sectionOrder Int         // Order within report (1, 2, 3...)
  sectionTitle String      // Section heading
  sectionType  SectionType // Type of content
  content      Json        // Section content (structure varies by type)
  createdAt    DateTime    @default(now())

  report WeeklyReport

  @@index([reportId, sectionOrder])
}
```

#### NewsletterSubscriber
Newsletter subscription management.

```prisma
model NewsletterSubscriber {
  id                String              @id @default(uuid())
  userId            String?             @unique // FK to User (optional)
  email             String              @unique
  subscribedSectors Json                // Array of sector IDs
  frequency         NewsletterFrequency @default(WEEKLY)
  isActive          Boolean             @default(true)
  subscribedAt      DateTime            @default(now())
  unsubscribedAt    DateTime?

  user            User?
  newsletterQueue NewsletterQueue[]

  @@index([email])
  @@index([isActive, frequency])
}
```

#### NewsletterQueue
Queue for sending newsletters.

```prisma
model NewsletterQueue {
  id           String    @id @default(uuid())
  reportId     String    // FK to WeeklyReport
  subscriberId String    // FK to NewsletterSubscriber
  scheduledFor DateTime  // When to send
  sentAt       DateTime? // When sent
  status       String    @default("pending") // pending, sent, failed
  createdAt    DateTime  @default(now())

  report     WeeklyReport
  subscriber NewsletterSubscriber

  @@index([subscriberId, status])
  @@index([scheduledFor, status])
}
```

---

## GraphQL API

### Type Definitions

```graphql
enum ReportType {
  SECTOR_WEEKLY
  MACRO_WEEKLY
}

enum SectionType {
  TEXT
  CHART_DATA
  TABLE_DATA
  METRIC_CARDS
  STOCK_LIST
}

enum NewsletterFrequency {
  WEEKLY
  DAILY
}

type WeeklyReport {
  id: ID!
  reportType: ReportType!
  sectorId: String
  sector: Sector
  title: String!
  slug: String!
  coverImageUrl: String
  summary: String!
  fullContent: JSON!
  publishedAt: String
  fiscalWeek: Int!
  fiscalYear: Int!
  isPublished: Boolean!
  viewCount: Int!
  createdAt: String!
  updatedAt: String!
  reportSections: [ReportSection!]!
}

type ReportSection {
  id: ID!
  reportId: String!
  sectionOrder: Int!
  sectionTitle: String!
  sectionType: SectionType!
  content: JSON!
  createdAt: String!
}

type NewsletterSubscriber {
  id: ID!
  userId: String
  email: String!
  subscribedSectors: [String!]!
  frequency: NewsletterFrequency!
  isActive: Boolean!
  subscribedAt: String!
  unsubscribedAt: String
}
```

### Queries

#### Get Reports with Filters
```graphql
query GetReports($filters: ReportFiltersInput, $pagination: PaginationInput) {
  reports(filters: $filters, pagination: $pagination) {
    id
    reportType
    sector {
      id
      name
      slug
    }
    title
    slug
    coverImageUrl
    summary
    publishedAt
    fiscalWeek
    fiscalYear
    viewCount
    reportSections {
      sectionTitle
      sectionType
      content
    }
  }
}

# Variables
{
  "filters": {
    "reportType": "SECTOR_WEEKLY",
    "sectorId": "sector-uuid",
    "isPublished": true
  },
  "pagination": {
    "limit": 20,
    "offset": 0
  }
}
```

#### Get Single Report by Slug
```graphql
query GetReport($slug: String!) {
  report(slug: $slug) {
    id
    reportType
    sector {
      name
      slug
    }
    title
    summary
    fullContent
    reportSections {
      sectionOrder
      sectionTitle
      sectionType
      content
    }
    publishedAt
    viewCount
  }
}

# Variables
{
  "slug": "it-sector-week-5-2026"
}
```

#### Get Latest Reports
```graphql
query GetLatestReports($limit: Int!) {
  latestReports(limit: $limit) {
    id
    reportType
    title
    slug
    coverImageUrl
    summary
    sector {
      name
      slug
    }
    publishedAt
    fiscalWeek
    fiscalYear
  }
}

# Variables
{
  "limit": 10
}
```

#### Get Reports by Sector
```graphql
query GetReportsBySector($sectorId: String!, $limit: Int) {
  reportsBySector(sectorId: $sectorId, limit: $limit) {
    id
    title
    slug
    summary
    publishedAt
    fiscalWeek
    fiscalYear
    viewCount
  }
}
```

### Mutations

#### Increment Report View
```graphql
mutation IncrementReportView($slug: String!) {
  incrementReportView(slug: $slug) {
    id
    slug
    viewCount
  }
}
```

#### Subscribe to Newsletter
```graphql
mutation SubscribeNewsletter(
  $email: String!
  $subscribedSectors: [String!]!
  $frequency: NewsletterFrequency!
) {
  subscribeNewsletter(
    email: $email
    subscribedSectors: $subscribedSectors
    frequency: $frequency
  ) {
    id
    email
    subscribedSectors
    frequency
    isActive
  }
}

# Variables
{
  "email": "user@example.com",
  "subscribedSectors": ["sector-uuid-1", "sector-uuid-2"],
  "frequency": "WEEKLY"
}
```

#### Unsubscribe from Newsletter
```graphql
mutation UnsubscribeNewsletter($email: String!) {
  unsubscribeNewsletter(email: $email)
}
```

#### Update Newsletter Preferences (Authenticated)
```graphql
mutation UpdateNewsletterPreferences(
  $subscribedSectors: [String!]
  $frequency: NewsletterFrequency
) {
  updateNewsletterPreferences(
    subscribedSectors: $subscribedSectors
    frequency: $frequency
  ) {
    id
    subscribedSectors
    frequency
  }
}
```

---

## REST API

### Reports Endpoints

#### GET /api/reports
List reports with optional filters and pagination.

**Query Parameters:**
- `reportType`: `SECTOR_WEEKLY` | `MACRO_WEEKLY` (optional)
- `sectorId`: UUID (optional)
- `isPublished`: `true` | `false` (optional, default: `true`)
- `fiscalYear`: number (optional)
- `fiscalWeek`: number (optional)
- `limit`: number (default: 20, max: 50)
- `offset`: number (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "reportType": "SECTOR_WEEKLY",
      "sectorId": "sector-uuid",
      "sector": {
        "id": "sector-uuid",
        "name": "Information Technology",
        "slug": "information-technology"
      },
      "title": "IT Sector Weekly - Week 5, 2026",
      "slug": "it-sector-week-5-2026",
      "coverImageUrl": "https://...",
      "summary": "The IT sector showed...",
      "publishedAt": "2026-02-03T00:00:00.000Z",
      "fiscalWeek": 5,
      "fiscalYear": 2026,
      "viewCount": 145,
      "reportSections": [...]
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### GET /api/reports/:slug
Get single report by slug.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reportType": "SECTOR_WEEKLY",
    "title": "IT Sector Weekly - Week 5, 2026",
    "slug": "it-sector-week-5-2026",
    "summary": "...",
    "fullContent": { /* structured content */ },
    "reportSections": [
      {
        "id": "section-uuid",
        "sectionOrder": 1,
        "sectionTitle": "Market Overview",
        "sectionType": "TEXT",
        "content": { "html": "..." }
      },
      {
        "sectionOrder": 2,
        "sectionTitle": "Top Performers",
        "sectionType": "STOCK_LIST",
        "content": {
          "stocks": [
            { "symbol": "TCS", "change": 5.2, "volume": 1500000 }
          ]
        }
      }
    ]
  }
}
```

#### POST /api/reports/:slug/view
Increment view count for analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "slug": "it-sector-week-5-2026",
    "viewCount": 146
  }
}
```

#### GET /api/reports/latest
Get latest N reports across all sectors.

**Query Parameters:**
- `limit`: number (default: 10, max: 50)

#### GET /api/reports/sector/:sectorId
Get reports for a specific sector.

**Query Parameters:**
- `limit`: number (default: 10, max: 20)

---

## Newsletter System

### REST Endpoints

#### POST /api/newsletter/subscribe
Subscribe to newsletter.

**Request Body:**
```json
{
  "email": "user@example.com",
  "subscribedSectors": ["sector-uuid-1", "sector-uuid-2"],
  "frequency": "WEEKLY"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter",
  "data": {
    "id": "subscriber-uuid",
    "email": "user@example.com",
    "subscribedSectors": [
      { "id": "sector-uuid-1", "name": "IT" },
      { "id": "sector-uuid-2", "name": "Banking" }
    ],
    "frequency": "WEEKLY"
  }
}
```

#### POST /api/newsletter/unsubscribe
Unsubscribe from newsletter.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### GET /api/newsletter/unsubscribe/:email
Unsubscribe via email link (for email campaigns).

#### GET /api/newsletter/preferences
Get current preferences (requires authentication).

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "subscriber-uuid",
    "email": "user@example.com",
    "subscribedSectors": [
      { "id": "sector-uuid", "name": "IT", "slug": "it" }
    ],
    "frequency": "WEEKLY",
    "isActive": true,
    "subscribedAt": "2026-01-15T10:30:00.000Z"
  }
}
```

#### PUT /api/newsletter/preferences
Update preferences (requires authentication).

**Request Body:**
```json
{
  "subscribedSectors": ["sector-uuid-1"],
  "frequency": "DAILY"
}
```

---

## Usage Examples

### Frontend Integration

#### Fetch Latest Reports
```typescript
async function getLatestReports() {
  const response = await fetch('/api/reports/latest?limit=5');
  const data = await response.json();
  return data.data;
}
```

#### Display Report Detail
```typescript
async function getReport(slug: string) {
  const response = await fetch(`/api/reports/${slug}`);
  const data = await response.json();
  return data.data;
}

// Track view
async function trackReportView(slug: string) {
  await fetch(`/api/reports/${slug}/view`, { method: 'POST' });
}
```

#### Newsletter Subscription
```typescript
async function subscribeToNewsletter(
  email: string,
  sectorIds: string[],
  frequency: 'WEEKLY' | 'DAILY'
) {
  const response = await fetch('/api/newsletter/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      subscribedSectors: sectorIds,
      frequency,
    }),
  });
  return response.json();
}
```

### Report Section Content Structure

#### TEXT Section
```json
{
  "sectionType": "TEXT",
  "content": {
    "html": "<p>Rich HTML content...</p>",
    "markdown": "# Markdown content..."
  }
}
```

#### CHART_DATA Section
```json
{
  "sectionType": "CHART_DATA",
  "content": {
    "chartType": "line",
    "data": [
      { "date": "2026-01-01", "value": 100 },
      { "date": "2026-01-02", "value": 105 }
    ],
    "options": {
      "title": "Price Trend",
      "yAxisLabel": "Price (₹)"
    }
  }
}
```

#### TABLE_DATA Section
```json
{
  "sectionType": "TABLE_DATA",
  "content": {
    "headers": ["Company", "Price", "Change %", "Volume"],
    "rows": [
      ["TCS", "3500", "5.2", "1500000"],
      ["Infosys", "1450", "3.1", "2000000"]
    ]
  }
}
```

#### METRIC_CARDS Section
```json
{
  "sectionType": "METRIC_CARDS",
  "content": {
    "metrics": [
      {
        "label": "Sector PE",
        "value": "25.4",
        "change": "+2.1%",
        "trend": "up"
      },
      {
        "label": "Market Cap",
        "value": "₹15.2L Cr",
        "change": "+5.3%",
        "trend": "up"
      }
    ]
  }
}
```

#### STOCK_LIST Section
```json
{
  "sectionType": "STOCK_LIST",
  "content": {
    "title": "Top Performers",
    "stocks": [
      {
        "symbol": "TCS",
        "name": "Tata Consultancy Services",
        "price": 3500,
        "change": 5.2,
        "volume": 1500000,
        "marketCap": 1300000
      }
    ]
  }
}
```

---

## Database Migrations

The schema has been applied using Prisma:

```bash
# Format schema
npx prisma format

# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

---

## Next Steps

1. **Python Report Generation Engine**: Build the backend service to generate reports
2. **Frontend Implementation**: Create UI components for reports library and detail pages
3. **Newsletter Service**: Implement email sending service
4. **Tier Gating**: Add premium content restrictions
5. **Analytics**: Track report engagement metrics

---

## File Locations

- **Database Schema**: `apps/api/prisma/schema.prisma`
- **GraphQL Resolvers**: `apps/api/src/graphql/resolvers/reports.ts`
- **REST Routes - Reports**: `apps/api/src/routes/reports.ts`
- **REST Routes - Newsletter**: `apps/api/src/routes/newsletter.ts`
- **Main Server**: `apps/api/src/index.ts`
