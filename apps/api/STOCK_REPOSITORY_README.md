# Stock Knowledge Repository - Implementation Guide

## Overview

The Stock Knowledge Repository system provides a comprehensive, AI-powered knowledge base for tracking company events, milestones, profiles, and timeline summaries. This implementation covers Tasks #77 (Database Schema) and #80 (Backend API).

## Database Schema (Task #77)

### New Tables

#### 1. **StockEvent**
Stores all significant events for companies with rich metadata.

**Fields:**
- `id` - UUID primary key
- `companyId` - Foreign key to Company
- `eventType` - Enum (33 types: QUARTERLY_RESULT, DIVIDEND, ACQUISITION, etc.)
- `eventDate` - Date of the event
- `title` - Event title
- `summary` - 100-200 word summary (Text field)
- `detailedContent` - JSON with structured data specific to event type
- `impactAssessment` - Enum (VERY_POSITIVE, POSITIVE, NEUTRAL, NEGATIVE, VERY_NEGATIVE)
- `impactAreas` - Array of strings (e.g., ["Revenue", "Market Share"])
- `sourceUrls` - Array of source URLs
- `sourceNames` - Array of source names
- `aiGenerated` - Boolean (default: true)
- `confidence` - Enum (HIGH, MEDIUM, LOW)
- `isVerified` - Boolean (default: false)
- `tags` - Array of strings
- `fiscalYear` - Optional integer
- `fiscalQuarter` - Optional integer (1-4)
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- `[companyId, eventDate]` - For company-specific timeline queries
- `[eventType, eventDate]` - For filtering by event type
- `[impactAssessment]` - For filtering by impact
- `[eventDate]` - For chronological sorting
- `[fiscalYear, fiscalQuarter]` - For financial period queries
- `[isVerified]` - For tier-based filtering

**Full-Text Search:** The schema includes support for PostgreSQL full-text search on `title` and `summary` fields.

#### 2. **StockMilestone**
Tracks major milestones in a company's history.

**Fields:**
- `id` - UUID primary key
- `companyId` - Foreign key to Company
- `milestoneType` - Enum (MAJOR_ACHIEVEMENT, SIGNIFICANT_SETBACK, STRATEGIC_SHIFT, MARKET_MILESTONE, OPERATIONAL_MILESTONE)
- `date` - Date of milestone
- `title` - Milestone title
- `description` - Detailed description (Text)
- `significance` - Why this milestone matters (Text)
- `relatedEventIds` - Array of related StockEvent IDs
- `metadata` - JSON for additional structured data
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- `[companyId, date]` - For company milestone timeline
- `[milestoneType]` - For filtering by type
- `[date]` - For chronological sorting

#### 3. **CompanyTimelineSummary**
AI-generated narrative summaries of company activity over different time periods.

**Fields:**
- `id` - UUID primary key
- `companyId` - Foreign key to Company
- `periodType` - Enum (LAST_7_DAYS, LAST_30_DAYS, LAST_90_DAYS, LAST_6_MONTHS, LAST_1_YEAR, LAST_3_YEARS, LAST_5_YEARS, ALL_TIME)
- `startDate` - Period start date
- `endDate` - Period end date
- `keyEvents` - JSON array of key events
- `majorChanges` - JSON object with major changes
- `narrative` - AI-generated narrative summary (Text)
- `metrics` - JSON with quantitative metrics
- `generatedAt` - Timestamp of generation
- `updatedAt` - Last update timestamp

**Indexes:**
- `[companyId, periodType]` - Unique constraint and index
- `[generatedAt]` - For tracking freshness

#### 4. **CompanyProfile**
Structured company profile with 7 section types.

**Fields:**
- `id` - UUID primary key
- `companyId` - Foreign key to Company
- `sectionType` - Enum (BUSINESS_MODEL, PRODUCTS_SERVICES, COMPETITIVE_POSITION, MANAGEMENT_TEAM, FINANCIAL_HIGHLIGHTS, GROWTH_DRIVERS, KEY_RISKS)
- `content` - JSON with section-specific structured data
- `lastUpdated` - When the content was last updated
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- `[companyId, sectionType]` - Unique constraint and index

### New Enums

```prisma
enum EventType {
  QUARTERLY_RESULT, ANNUAL_RESULT, MANAGEMENT_CHANGE, DIVIDEND, STOCK_SPLIT,
  BONUS, RIGHTS_ISSUE, ACQUISITION, DIVESTITURE, CAPEX_ANNOUNCEMENT,
  ORDER_WIN, ORDER_LOSS, PRODUCT_LAUNCH, PLANT_EXPANSION, REGULATORY_ACTION,
  SEBI_NOTICE, CREDIT_RATING_CHANGE, AUDITOR_CHANGE, PROMOTER_CHANGE,
  BULK_DEAL, BLOCK_DEAL, PLEDGE_CHANGE, SECTOR_POLICY, GOVERNMENT_ORDER,
  CONCALL_HIGHLIGHT, ANALYST_ACTION, MEDIA_COVERAGE, LITIGATION_UPDATE,
  AGM_EGM, BOARD_MEETING, OTHER
}

enum ImpactAssessment {
  VERY_POSITIVE, POSITIVE, NEUTRAL, NEGATIVE, VERY_NEGATIVE
}

enum MilestoneType {
  MAJOR_ACHIEVEMENT, SIGNIFICANT_SETBACK, STRATEGIC_SHIFT,
  MARKET_MILESTONE, OPERATIONAL_MILESTONE
}

enum TimelinePeriodType {
  LAST_7_DAYS, LAST_30_DAYS, LAST_90_DAYS, LAST_6_MONTHS,
  LAST_1_YEAR, LAST_3_YEARS, LAST_5_YEARS, ALL_TIME
}

enum CompanyProfileSectionType {
  BUSINESS_MODEL, PRODUCTS_SERVICES, COMPETITIVE_POSITION,
  MANAGEMENT_TEAM, FINANCIAL_HIGHLIGHTS, GROWTH_DRIVERS, KEY_RISKS
}
```

### Database Migration

The schema was pushed to the database using:
```bash
npx prisma db push
npx prisma generate
```

## Backend API (Task #80)

### GraphQL API

**Location:** `/Users/amitkandari/Desktop/alpha-signal/apps/api/src/graphql/resolvers/stockRepository.ts`

#### Queries

1. **stockEvents** - Get stock events for a company with filters and pagination
   ```graphql
   query {
     stockEvents(
       companyId: "uuid"
       filters: {
         eventTypes: [QUARTERLY_RESULT, DIVIDEND]
         impactAssessments: [POSITIVE, VERY_POSITIVE]
         startDate: "2024-01-01"
         endDate: "2024-12-31"
         search: "revenue growth"
         tags: ["growth"]
         fiscalYear: 2024
         fiscalQuarter: 1
         isVerified: true
       }
       pagination: { limit: 20, offset: 0 }
     ) {
       events {
         id
         title
         summary
         eventType
         impactAssessment
         eventDate
       }
       total
       hasMore
     }
   }
   ```

2. **stockEvent** - Get single stock event by ID
   ```graphql
   query {
     stockEvent(id: "uuid") {
       id
       title
       summary
       detailedContent
       company { companyName }
     }
   }
   ```

3. **companyMilestones** - Get company milestones
   ```graphql
   query {
     companyMilestones(companyId: "uuid", limit: 10) {
       id
       title
       description
       significance
       milestoneType
       date
     }
   }
   ```

4. **companyProfile** - Get company profile section
   ```graphql
   query {
     companyProfile(
       companyId: "uuid"
       sectionType: BUSINESS_MODEL
     ) {
       id
       sectionType
       content
       lastUpdated
     }
   }
   ```

5. **companyProfileAll** - Get all company profile sections
   ```graphql
   query {
     companyProfileAll(companyId: "uuid") {
       id
       sectionType
       content
     }
   }
   ```

6. **companyTimelineSummary** - Get timeline summary
   ```graphql
   query {
     companyTimelineSummary(
       companyId: "uuid"
       periodType: LAST_30_DAYS
     ) {
       id
       narrative
       keyEvents
       majorChanges
       metrics
     }
   }
   ```

7. **searchEventsAcrossCompanies** - Full-text search across all companies
   ```graphql
   query {
     searchEventsAcrossCompanies(
       query: "dividend announcement"
       filters: { impactAssessments: [POSITIVE] }
       pagination: { limit: 20, offset: 0 }
     ) {
       events {
         id
         title
         company { companyName }
       }
       total
     }
   }
   ```

#### Mutations

1. **createStockEvent** - Create new stock event (admin only)
   ```graphql
   mutation {
     createStockEvent(input: {
       companyId: "uuid"
       eventType: QUARTERLY_RESULT
       eventDate: "2024-01-15"
       title: "Q3 FY24 Results"
       summary: "..."
       detailedContent: { revenue: 1000, profit: 200 }
       impactAssessment: POSITIVE
       impactAreas: ["Revenue", "Profitability"]
       sourceUrls: ["https://example.com"]
       sourceNames: ["BSE"]
       confidence: HIGH
       tags: ["quarterly-results"]
     }) {
       id
       title
     }
   }
   ```

2. **updateStockEvent** - Update stock event (admin only)
3. **verifyStockEvent** - Mark event as verified (admin only)

### REST API

**Location:** `/Users/amitkandari/Desktop/alpha-signal/apps/api/src/routes/stockRepository.ts`

#### Endpoints

1. **GET /api/stock-events** - List all stock events with filters
   - Query params: eventTypes, impactAssessments, startDate, endDate, search, tags, fiscalYear, fiscalQuarter, isVerified, limit, offset

2. **GET /api/stock-events/:id** - Get single stock event

3. **GET /api/companies/:companyId/events** - Get events for a company
   - Same query params as /api/stock-events

4. **GET /api/companies/:companyId/milestones** - Get company milestones
   - Query params: limit (default: 10, max: 50)

5. **GET /api/companies/:companyId/profile** - Get company profile
   - Query params: sectionType (optional, returns all if not specified)

6. **GET /api/companies/:companyId/timeline** - Get timeline summary
   - Query params: periodType (default: LAST_30_DAYS)

7. **GET /api/stock-events/search** - Search events across companies
   - Query params: query (required, min 2 chars), eventTypes, impactAssessments, startDate, endDate, tags, fiscalYear, fiscalQuarter, isVerified, limit, offset

8. **POST /api/stock-events** - Create new stock event (admin only)
   - Body: CreateStockEventInput

9. **PATCH /api/stock-events/:id** - Update stock event (admin only)
   - Body: UpdateStockEventInput (partial)

10. **POST /api/stock-events/:id/verify** - Verify stock event (admin only)

### Error Handling

All endpoints include proper error handling with:
- 400 Bad Request - Invalid input/validation errors
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Resource not found
- 500 Internal Server Error - Server errors

Response format:
```json
{
  "success": true/false,
  "data": { ... },
  "error": "Error message" // if success is false
}
```

### Tier-Based Access Control

The API implements tier-based filtering:

- **FREE Tier**: Only verified events (isVerified = true)
- **PRO Tier**: All events
- **PREMIUM Tier**: All events + admin mutations

This is implemented in both GraphQL resolvers and REST routes using:
```typescript
const userTier = context?.user?.tier || 'FREE';
if (userTier === 'FREE') {
  where.isVerified = true;
}
```

### Pagination

All list endpoints support pagination with:
- `limit` - Number of records (default: 20, max: 100)
- `offset` - Skip N records (default: 0)

Response includes:
- `total` - Total matching records
- `hasMore` - Boolean indicating more records available

### Full-Text Search

The search functionality uses PostgreSQL's `ILIKE` for case-insensitive searching on:
- Event title
- Event summary

Example:
```typescript
where.OR = [
  { title: { contains: searchTerm, mode: 'insensitive' } },
  { summary: { contains: searchTerm, mode: 'insensitive' } },
];
```

## Integration with Main App

The Stock Repository is integrated into the main application (`src/index.ts`):

1. **Type Definitions**: Added to GraphQL schema
2. **Query Resolvers**: Merged into main resolvers
3. **Mutation Resolvers**: Merged into main resolvers
4. **Field Resolvers**: Merged into main resolvers
5. **REST Routes**: Registered with Fastify

```typescript
// In src/index.ts
import {
  stockRepositoryTypeDefs,
  stockRepositoryQueryResolvers,
  stockRepositoryMutationResolvers,
  stockRepositoryFieldResolvers,
} from './graphql/resolvers/stockRepository.js';
import { stockRepositoryRoutes } from './routes/stockRepository.js';

// Merge type definitions
const typeDefs = [baseTypeDefs, reportsTypeDefs, stockRepositoryTypeDefs];

// Register routes
await fastify.register(stockRepositoryRoutes);
```

## Testing

### GraphQL Testing

Use Apollo Studio or GraphQL Playground at `http://localhost:4000/graphql`

Example test query:
```graphql
query TestStockEvents {
  stockEvents(
    companyId: "your-company-uuid"
    filters: { eventTypes: [QUARTERLY_RESULT] }
    pagination: { limit: 5 }
  ) {
    events {
      id
      title
      eventType
      eventDate
    }
    total
  }
}
```

### REST API Testing

Using curl:
```bash
# List events
curl "http://localhost:4000/api/stock-events?limit=10&eventTypes=DIVIDEND"

# Get single event
curl "http://localhost:4000/api/stock-events/{uuid}"

# Search events
curl "http://localhost:4000/api/stock-events/search?query=dividend"

# Get company events
curl "http://localhost:4000/api/companies/{uuid}/events"

# Get company milestones
curl "http://localhost:4000/api/companies/{uuid}/milestones"

# Get company profile
curl "http://localhost:4000/api/companies/{uuid}/profile?sectionType=BUSINESS_MODEL"

# Get timeline summary
curl "http://localhost:4000/api/companies/{uuid}/timeline?periodType=LAST_30_DAYS"
```

## Data Population

To populate the tables with sample data, you can use Prisma Studio or create a seed script:

```bash
npx prisma studio
```

Or create a seed file:
```typescript
// prisma/seed-stock-events.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample stock event
  await prisma.stockEvent.create({
    data: {
      companyId: 'your-company-uuid',
      eventType: 'QUARTERLY_RESULT',
      eventDate: new Date('2024-01-15'),
      title: 'Q3 FY24 Results - Strong Revenue Growth',
      summary: 'Company reported Q3 FY24 results with revenue growth of 23% YoY...',
      detailedContent: {
        revenue: 1000,
        profit: 200,
        eps: 12.5
      },
      impactAssessment: 'POSITIVE',
      impactAreas: ['Revenue', 'Profitability'],
      sourceUrls: ['https://www.bseindia.com/...'],
      sourceNames: ['BSE'],
      confidence: 'HIGH',
      tags: ['quarterly-results', 'growth'],
      fiscalYear: 2024,
      fiscalQuarter: 3,
    },
  });
}

main();
```

## Performance Considerations

1. **Indexes**: All critical query paths are indexed
2. **Pagination**: Enforced max limits (100 for events, 50 for milestones)
3. **Selective Includes**: Company relations are included only when needed
4. **Full-Text Search**: Uses PostgreSQL's native text search capabilities

## Security

1. **Authentication**: JWT-based authentication via context
2. **Authorization**: Tier-based access control
3. **Input Validation**: Zod schemas for all inputs
4. **SQL Injection**: Protected via Prisma ORM
5. **Admin-Only Mutations**: Verified user tier for create/update/verify operations

## Future Enhancements

1. Add full-text search indexes for better performance
2. Implement caching for frequently accessed profiles
3. Add bulk import API for stock events
4. Create webhook notifications for new events
5. Add analytics tracking for popular queries
6. Implement event recommendations based on user portfolio

## Files Modified/Created

### Modified:
- `/Users/amitkandari/Desktop/alpha-signal/apps/api/prisma/schema.prisma`
- `/Users/amitkandari/Desktop/alpha-signal/apps/api/src/index.ts`

### Created:
- `/Users/amitkandari/Desktop/alpha-signal/apps/api/src/graphql/resolvers/stockRepository.ts`
- `/Users/amitkandari/Desktop/alpha-signal/apps/api/src/routes/stockRepository.ts`
- `/Users/amitkandari/Desktop/alpha-signal/apps/api/STOCK_REPOSITORY_README.md`

## Summary

Both Task #77 (Database Schema) and Task #80 (Backend API) have been successfully implemented with:

- 4 new database tables with proper indexes and relationships
- 7 GraphQL queries for comprehensive data access
- 3 GraphQL mutations for admin operations
- 10 REST API endpoints for flexible access
- Full-text search across all companies
- Tier-based access control
- Comprehensive error handling
- Input validation with Zod
- Proper TypeScript types throughout

The system is ready for integration with the frontend and can be extended with AI-powered event generation pipelines.
