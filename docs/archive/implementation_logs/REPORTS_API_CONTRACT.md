# Weekly Reports API Contract

This document defines the API contract between the frontend Reports feature and the backend GraphQL API.

## GraphQL Schema

### Types

#### Report
```graphql
type Report {
  id: ID!
  title: String!
  slug: String!
  reportType: ReportType!
  sector: Sector
  summary: String!
  fullContent: String!
  publishedAt: DateTime!
  fiscalWeek: Int!
  fiscalYear: Int!
  viewCount: Int!
  reportSections: [ReportSection!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

#### ReportSection
```graphql
type ReportSection {
  id: ID!
  reportId: ID!
  sectionOrder: Int!
  sectionTitle: String
  sectionType: SectionType!
  content: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

#### Sector
```graphql
type Sector {
  id: ID!
  name: String!
  slug: String!
}
```

#### NewsletterSubscription
```graphql
type NewsletterSubscription {
  id: ID!
  email: String!
  subscribedSectors: [String!]!
  frequency: NewsletterFrequency!
  isActive: Boolean!
  subscribedAt: DateTime!
  unsubscribedAt: DateTime
}
```

### Enums

```graphql
enum ReportType {
  MACRO
  SECTOR
}

enum SectionType {
  TEXT
  METRIC_CARDS
  CHART_DATA
  TABLE_DATA
  STOCK_LIST
}

enum NewsletterFrequency {
  DAILY
  WEEKLY
}
```

### Input Types

```graphql
input ReportFilters {
  reportType: ReportType
  sectorId: ID
  fiscalWeek: Int
  fiscalYear: Int
  searchQuery: String
}

input Pagination {
  limit: Int
  offset: Int
}
```

## Queries

### 1. Get Reports (Paginated with Filters)

```graphql
query GetReports($filters: ReportFilters, $pagination: Pagination) {
  reports(filters: $filters, pagination: $pagination) {
    id
    title
    slug
    reportType
    sector {
      id
      name
    }
    summary
    publishedAt
    fiscalWeek
    fiscalYear
    viewCount
  }
}
```

**Request Example:**
```json
{
  "filters": {
    "reportType": "MACRO"
  },
  "pagination": {
    "limit": 10,
    "offset": 0
  }
}
```

**Response Example:**
```json
{
  "data": {
    "reports": [
      {
        "id": "1",
        "title": "Market Weekly: Tech Rally Continues",
        "slug": "market-weekly-tech-rally-continues",
        "reportType": "MACRO",
        "sector": null,
        "summary": "Markets witnessed strong rally...",
        "publishedAt": "2024-03-15T09:00:00Z",
        "fiscalWeek": 11,
        "fiscalYear": 2024,
        "viewCount": 1523
      }
    ]
  }
}
```

### 2. Get Single Report by Slug

```graphql
query GetReportDetail($slug: String!) {
  report(slug: $slug) {
    id
    title
    slug
    reportType
    sector {
      id
      name
    }
    summary
    fullContent
    publishedAt
    fiscalWeek
    fiscalYear
    viewCount
    reportSections {
      id
      sectionOrder
      sectionTitle
      sectionType
      content
    }
  }
}
```

**Request Example:**
```json
{
  "slug": "market-weekly-tech-rally-continues"
}
```

**Response Example:**
```json
{
  "data": {
    "report": {
      "id": "1",
      "title": "Market Weekly: Tech Rally Continues",
      "slug": "market-weekly-tech-rally-continues",
      "reportType": "MACRO",
      "sector": null,
      "summary": "Markets witnessed strong rally...",
      "fullContent": "Full report content here...",
      "publishedAt": "2024-03-15T09:00:00Z",
      "fiscalWeek": 11,
      "fiscalYear": 2024,
      "viewCount": 1523,
      "reportSections": [
        {
          "id": "1",
          "sectionOrder": 1,
          "sectionTitle": "Market Performance",
          "sectionType": "METRIC_CARDS",
          "content": "[{\"label\":\"Nifty 50\",\"value\":\"22,485\",\"change\":2.3}]"
        }
      ]
    }
  }
}
```

### 3. Get Latest Reports

```graphql
query LatestReports($limit: Int!) {
  latestReports(limit: $limit) {
    id
    title
    slug
    reportType
    sector {
      id
      name
    }
    publishedAt
    viewCount
  }
}
```

### 4. Get Reports Count

```graphql
query GetReportsCount($filters: ReportFilters) {
  reportsCount(filters: $filters)
}
```

**Response:**
```json
{
  "data": {
    "reportsCount": 42
  }
}
```

### 5. Get Newsletter Preferences

```graphql
query GetNewsletterPreferences {
  myNewsletterPreferences {
    id
    email
    subscribedSectors
    frequency
    isActive
    subscribedAt
  }
}
```

## Mutations

### 1. Increment Report View Count

```graphql
mutation IncrementReportView($slug: String!) {
  incrementReportView(slug: $slug) {
    id
    viewCount
  }
}
```

**Request Example:**
```json
{
  "slug": "market-weekly-tech-rally-continues"
}
```

**Response Example:**
```json
{
  "data": {
    "incrementReportView": {
      "id": "1",
      "viewCount": 1524
    }
  }
}
```

**Implementation Notes:**
- Should be idempotent (use session-based tracking to prevent duplicate counts)
- Consider using localStorage key `viewedReports` to check if user already viewed
- Rate limit to prevent abuse

### 2. Subscribe to Newsletter

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
    isActive
  }
}
```

**Request Example:**
```json
{
  "email": "user@example.com",
  "subscribedSectors": ["TECHNOLOGY", "FINANCE"],
  "frequency": "WEEKLY"
}
```

**Response Example:**
```json
{
  "data": {
    "subscribeNewsletter": {
      "id": "123",
      "email": "user@example.com",
      "isActive": true
    }
  }
}
```

**Validation Rules:**
- Email must be valid format
- At least one sector must be selected
- Send confirmation email with unsubscribe link
- Generate unique token for unsubscribe

### 3. Unsubscribe from Newsletter

```graphql
mutation UnsubscribeNewsletter($email: String!) {
  unsubscribeNewsletter(email: $email) {
    success
    message
  }
}
```

### 4. Update Newsletter Preferences

```graphql
mutation UpdateNewsletterPreferences(
  $subscribedSectors: [String!]!
  $frequency: NewsletterFrequency!
) {
  updateNewsletterPreferences(
    subscribedSectors: $subscribedSectors
    frequency: $frequency
  ) {
    id
    subscribedSectors
    frequency
    isActive
  }
}
```

## Section Content Formats

### TEXT Section
```json
{
  "sectionType": "TEXT",
  "content": "Plain text content with paragraphs separated by \\n\\n"
}
```

### METRIC_CARDS Section
```json
{
  "sectionType": "METRIC_CARDS",
  "content": "[{\"label\":\"Nifty 50\",\"value\":\"22,485\",\"change\":2.3,\"changeLabel\":\"WoW\"}]"
}
```

**Content Structure:**
```typescript
Array<{
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
}>
```

### CHART_DATA Section
```json
{
  "sectionType": "CHART_DATA",
  "content": "{\"type\":\"bar\",\"data\":[{\"name\":\"IT\",\"value\":4.2}]}"
}
```

**Content Structure:**
```typescript
{
  type: 'bar' | 'line';
  data: Array<{
    name: string;
    value: number;
  }>;
}
```

### TABLE_DATA Section
```json
{
  "sectionType": "TABLE_DATA",
  "content": "{\"headers\":[\"Date\",\"Event\"],\"rows\":[[\"March 18\",\"RBI MPC\"]]}"
}
```

**Content Structure:**
```typescript
{
  headers: string[];
  rows: Array<Array<string | number>>;
}
```

### STOCK_LIST Section
```json
{
  "sectionType": "STOCK_LIST",
  "content": "[{\"symbol\":\"INFY\",\"name\":\"Infosys\",\"price\":1485,\"return\":5.2,\"scores\":{\"alphaScore\":84}}]"
}
```

**Content Structure:**
```typescript
Array<{
  symbol: string;
  name: string;
  price: number;
  return?: number;
  scores?: {
    alphaScore: number;
    qualityScore: number;
    valueScore: number;
  };
}>
```

## Error Handling

### Common Error Codes

```graphql
type Error {
  message: String!
  code: String!
  path: [String]
  extensions: ErrorExtensions
}
```

**Error Codes:**
- `UNAUTHENTICATED` - User not authenticated
- `FORBIDDEN` - User doesn't have required tier
- `NOT_FOUND` - Report not found
- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests

**Example Error Response:**
```json
{
  "errors": [
    {
      "message": "Report not found",
      "code": "NOT_FOUND",
      "path": ["report"],
      "extensions": {
        "slug": "invalid-slug"
      }
    }
  ]
}
```

## Authentication

All queries and mutations (except public ones) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Public Endpoints (No Auth Required)
- `reports` (query)
- `report` (query)
- `latestReports` (query)
- `reportsCount` (query)
- `subscribeNewsletter` (mutation)
- `unsubscribeNewsletter` (mutation)

### Protected Endpoints (Auth Required)
- `myNewsletterPreferences` (query)
- `updateNewsletterPreferences` (mutation)
- `incrementReportView` (mutation) - optional but recommended

## Rate Limiting

**Recommended Limits:**
- Anonymous users: 100 requests/hour
- Authenticated users: 1000 requests/hour
- View count increment: 1 request per report per session

## Caching Strategy

**Cache Headers:**
```
Cache-Control: public, max-age=300, s-maxage=600
```

**Recommended Cache Times:**
- Report list: 5 minutes
- Report detail: 10 minutes
- Latest reports: 2 minutes
- Reports count: 5 minutes

**Cache Invalidation:**
- Invalidate on new report publish
- Invalidate specific report on update
- Don't cache for authenticated newsletter queries

## Data Validation

### Report Creation/Update
- `title`: 10-200 characters
- `slug`: Unique, URL-friendly, lowercase with hyphens
- `summary`: 50-500 characters
- `fullContent`: 100-50000 characters
- `fiscalWeek`: 1-53
- `fiscalYear`: Current year ± 2 years
- `sectionType`: Must be valid enum value
- `content`: Valid JSON for structured types

### Newsletter Subscription
- `email`: Valid email format, max 254 characters
- `subscribedSectors`: 1-10 sectors
- `frequency`: Valid enum value

## Testing Endpoints

### Health Check
```graphql
query {
  health {
    status
    timestamp
  }
}
```

### Sample Data Query (Dev Only)
```graphql
query {
  sampleReports {
    # Returns 5 sample reports for testing
  }
}
```

## Performance Requirements

- Reports list query: < 200ms
- Report detail query: < 300ms
- View increment mutation: < 100ms
- Newsletter subscription: < 500ms

## Database Indexes

Recommended indexes for optimal performance:

```sql
CREATE INDEX idx_reports_published_at ON reports(published_at DESC);
CREATE INDEX idx_reports_slug ON reports(slug);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_sector ON reports(sector_id);
CREATE INDEX idx_report_sections_report_id ON report_sections(report_id);
CREATE INDEX idx_report_sections_order ON report_sections(section_order);
CREATE INDEX idx_newsletter_email ON newsletter_subscriptions(email);
```

## Migration Scripts

When deploying, ensure the following migrations are run:
1. Create `reports` table
2. Create `report_sections` table
3. Create `newsletter_subscriptions` table
4. Add foreign keys and constraints
5. Create indexes
6. Seed initial data (optional)

---

**API Version:** 1.0
**Last Updated:** 2024-03-15
**Backend Implementation Status:** Pending
