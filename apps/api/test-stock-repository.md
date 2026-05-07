# Stock Repository Testing Guide

## Quick Validation Checklist

### 1. Database Schema Validation

Run these commands to verify the schema is correct:

```bash
# Check if Prisma schema is valid
npx prisma validate

# Generate Prisma client
npx prisma generate

# View the database in Prisma Studio
npx prisma studio
```

Expected tables in Prisma Studio:
- ✅ stock_events
- ✅ stock_milestones
- ✅ company_timeline_summaries
- ✅ company_profiles

### 2. GraphQL Schema Validation

Start the server and test GraphQL endpoint:

```bash
# Start the server
npm run dev

# Server should start at http://localhost:4000/graphql
```

### 3. GraphQL Query Tests

Open GraphQL Playground at `http://localhost:4000/graphql` and run:

#### Test 1: Check Schema Types
```graphql
{
  __schema {
    types {
      name
    }
  }
}
```

Look for these types:
- StockEvent
- StockMilestone
- CompanyTimelineSummary
- CompanyProfile
- EventType
- ImpactAssessment

#### Test 2: Query Available Fields
```graphql
{
  __type(name: "StockEvent") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

#### Test 3: Sample Event Query (will return empty if no data)
```graphql
query TestQuery {
  searchEventsAcrossCompanies(
    query: "test"
    pagination: { limit: 5 }
  ) {
    events {
      id
      title
    }
    total
  }
}
```

### 4. REST API Tests

#### Test all REST endpoints:

```bash
# 1. List all stock events
curl -X GET "http://localhost:4000/api/stock-events?limit=10" \
  -H "Content-Type: application/json"

# Expected: { "success": true, "data": { "events": [], "total": 0, ... } }

# 2. Search events
curl -X GET "http://localhost:4000/api/stock-events/search?query=dividend&limit=5" \
  -H "Content-Type: application/json"

# Expected: { "success": true, "data": { "events": [], "total": 0, ... } }

# 3. Get company events (replace UUID with real company ID)
curl -X GET "http://localhost:4000/api/companies/{company-uuid}/events?limit=10" \
  -H "Content-Type: application/json"

# 4. Get company milestones
curl -X GET "http://localhost:4000/api/companies/{company-uuid}/milestones?limit=10" \
  -H "Content-Type: application/json"

# 5. Get company profile
curl -X GET "http://localhost:4000/api/companies/{company-uuid}/profile" \
  -H "Content-Type: application/json"

# 6. Get company timeline
curl -X GET "http://localhost:4000/api/companies/{company-uuid}/timeline?periodType=LAST_30_DAYS" \
  -H "Content-Type: application/json"
```

### 5. Create Sample Data

To test with real data, create a test script:

```typescript
// test-create-event.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestEvent() {
  // First, get a company ID
  const company = await prisma.company.findFirst({
    where: { isActive: true }
  });

  if (!company) {
    console.log('No companies found. Please seed companies first.');
    return;
  }

  // Create a test stock event
  const event = await prisma.stockEvent.create({
    data: {
      companyId: company.id,
      eventType: 'QUARTERLY_RESULT',
      eventDate: new Date('2024-01-15'),
      title: 'Q3 FY24 Results - Strong Performance',
      summary: `${company.companyName} reported impressive Q3 FY24 results with revenue growth of 23% YoY and profit growth of 18% YoY. The company's operating margins expanded by 150 basis points, driven by operational efficiencies and favorable product mix. Management expressed confidence in sustaining the growth momentum through strategic initiatives and market expansion.`,
      detailedContent: {
        revenue: 1000,
        revenueGrowth: 23,
        profit: 200,
        profitGrowth: 18,
        operatingMargin: 20,
        eps: 12.5,
        epsGrowth: 15
      },
      impactAssessment: 'POSITIVE',
      impactAreas: ['Revenue', 'Profitability', 'Operating Efficiency'],
      sourceUrls: ['https://www.bseindia.com/results'],
      sourceNames: ['BSE India'],
      confidence: 'HIGH',
      tags: ['quarterly-results', 'strong-growth', 'earnings-beat'],
      fiscalYear: 2024,
      fiscalQuarter: 3,
    },
  });

  console.log('✅ Created test event:', event.id);

  // Create a milestone
  const milestone = await prisma.stockMilestone.create({
    data: {
      companyId: company.id,
      milestoneType: 'MAJOR_ACHIEVEMENT',
      date: new Date('2024-01-20'),
      title: 'Achieved ₹10,000 Cr Revenue Milestone',
      description: `${company.companyName} crossed the significant ₹10,000 crore annual revenue milestone, marking a major achievement in its growth journey.`,
      significance: 'This milestone represents 5x growth in revenue over the past 5 years and establishes the company as a major player in its industry segment.',
      relatedEventIds: [event.id],
      metadata: {
        revenue: 10000,
        yearAchieved: 2024,
        growthRate: 25
      }
    }
  });

  console.log('✅ Created test milestone:', milestone.id);

  // Create a company profile section
  const profile = await prisma.companyProfile.create({
    data: {
      companyId: company.id,
      sectionType: 'BUSINESS_MODEL',
      content: {
        overview: `${company.companyName} operates in the ${company.industry} sector with a focus on innovative solutions.`,
        revenueStreams: [
          'Product Sales',
          'Services',
          'Licensing'
        ],
        customerSegments: [
          'Enterprise',
          'SMB',
          'Consumer'
        ],
        keyPartnerships: [
          'Strategic Partners',
          'Distribution Partners',
          'Technology Partners'
        ],
        competitiveAdvantages: [
          'Strong brand recognition',
          'Extensive distribution network',
          'Proprietary technology'
        ]
      }
    }
  });

  console.log('✅ Created company profile:', profile.id);

  // Create a timeline summary
  const summary = await prisma.companyTimelineSummary.create({
    data: {
      companyId: company.id,
      periodType: 'LAST_30_DAYS',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      keyEvents: [
        {
          date: '2024-01-15',
          title: 'Q3 Results',
          impact: 'POSITIVE'
        }
      ],
      majorChanges: {
        financial: 'Strong revenue growth',
        operational: 'Margin expansion',
        strategic: 'Market share gains'
      },
      narrative: `In the last 30 days, ${company.companyName} demonstrated strong operational performance with the announcement of Q3 FY24 results. The company reported robust revenue growth of 23% and improved profitability metrics, driven by operational efficiencies and favorable market conditions.`,
      metrics: {
        revenueGrowth: 23,
        profitGrowth: 18,
        marginExpansion: 1.5,
        stockReturn: 8.5
      }
    }
  });

  console.log('✅ Created timeline summary:', summary.id);

  console.log('\n🎉 All test data created successfully!');
  console.log('\nNow you can test the API with:');
  console.log(`- Company ID: ${company.id}`);
  console.log(`- Event ID: ${event.id}`);
  console.log(`- Milestone ID: ${milestone.id}`);
}

createTestEvent()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:
```bash
npx tsx test-create-event.ts
```

### 6. Full Integration Test

After creating sample data, test the full workflow:

```bash
# 1. Get company ID from database
COMPANY_ID="<your-company-uuid>"

# 2. Get events for the company
curl "http://localhost:4000/api/companies/$COMPANY_ID/events"

# 3. Get milestones
curl "http://localhost:4000/api/companies/$COMPANY_ID/milestones"

# 4. Get profile
curl "http://localhost:4000/api/companies/$COMPANY_ID/profile"

# 5. Get timeline
curl "http://localhost:4000/api/companies/$COMPANY_ID/timeline?periodType=LAST_30_DAYS"

# 6. Search across all companies
curl "http://localhost:4000/api/stock-events/search?query=growth"
```

### 7. GraphQL Integration Test

```graphql
# Query 1: Get events for a company
query GetCompanyEvents($companyId: ID!) {
  stockEvents(
    companyId: $companyId
    filters: {
      eventTypes: [QUARTERLY_RESULT, DIVIDEND]
      impactAssessments: [POSITIVE, VERY_POSITIVE]
    }
    pagination: { limit: 10 }
  ) {
    events {
      id
      title
      summary
      eventType
      eventDate
      impactAssessment
      confidence
      tags
      company {
        companyName
        sector { name }
      }
    }
    total
    hasMore
  }
}

# Query 2: Get single event
query GetEvent($id: ID!) {
  stockEvent(id: $id) {
    id
    title
    summary
    detailedContent
    eventType
    eventDate
    impactAssessment
    impactAreas
    sourceUrls
    sourceNames
    company {
      companyName
      shortName
    }
  }
}

# Query 3: Get milestones
query GetMilestones($companyId: ID!) {
  companyMilestones(companyId: $companyId, limit: 5) {
    id
    title
    description
    significance
    milestoneType
    date
    relatedEventIds
  }
}

# Query 4: Get company profile
query GetProfile($companyId: ID!, $sectionType: CompanyProfileSectionType!) {
  companyProfile(companyId: $companyId, sectionType: $sectionType) {
    id
    sectionType
    content
    lastUpdated
  }
}

# Query 5: Get all profile sections
query GetAllProfiles($companyId: ID!) {
  companyProfileAll(companyId: $companyId) {
    id
    sectionType
    content
    lastUpdated
  }
}

# Query 6: Get timeline summary
query GetTimeline($companyId: ID!, $periodType: TimelinePeriodType!) {
  companyTimelineSummary(companyId: $companyId, periodType: $periodType) {
    id
    periodType
    startDate
    endDate
    narrative
    keyEvents
    majorChanges
    metrics
    generatedAt
  }
}

# Query 7: Search across companies
query SearchEvents($query: String!) {
  searchEventsAcrossCompanies(
    query: $query
    filters: {
      impactAssessments: [POSITIVE, VERY_POSITIVE]
      startDate: "2024-01-01"
    }
    pagination: { limit: 20 }
  ) {
    events {
      id
      title
      eventDate
      impactAssessment
      company {
        companyName
        sector { name }
      }
    }
    total
  }
}
```

### 8. Performance Tests

Test pagination and filtering:

```bash
# Test different page sizes
for i in 10 20 50 100; do
  echo "Testing limit=$i"
  time curl -s "http://localhost:4000/api/stock-events?limit=$i" > /dev/null
done

# Test filtering by event type
curl "http://localhost:4000/api/stock-events?eventTypes=QUARTERLY_RESULT,DIVIDEND&limit=50"

# Test date range filtering
curl "http://localhost:4000/api/stock-events?startDate=2024-01-01&endDate=2024-12-31"

# Test impact filtering
curl "http://localhost:4000/api/stock-events?impactAssessments=POSITIVE,VERY_POSITIVE"

# Test search performance
time curl -s "http://localhost:4000/api/stock-events/search?query=growth&limit=100" > /dev/null
```

### 9. Error Handling Tests

Test error scenarios:

```bash
# Invalid UUID format
curl "http://localhost:4000/api/stock-events/invalid-uuid"
# Expected: 400 Bad Request

# Non-existent company
curl "http://localhost:4000/api/companies/00000000-0000-0000-0000-000000000000/events"
# Expected: 200 OK with empty array

# Invalid query parameters
curl "http://localhost:4000/api/stock-events?limit=invalid"
# Expected: 400 Bad Request

# Missing required search query
curl "http://localhost:4000/api/stock-events/search"
# Expected: 400 Bad Request
```

### 10. Authentication Tests

Test tier-based access:

```bash
# Without authentication (FREE tier)
curl "http://localhost:4000/api/stock-events"
# Expected: Only verified events

# With PRO tier token
curl -H "Authorization: Bearer <pro-token>" "http://localhost:4000/api/stock-events"
# Expected: All events including unverified

# Admin mutation without auth
curl -X POST "http://localhost:4000/api/stock-events" \
  -H "Content-Type: application/json" \
  -d '{"companyId": "uuid", "eventType": "DIVIDEND", ...}'
# Expected: 403 Forbidden
```

## Success Criteria

✅ All database tables created with correct schema
✅ Prisma client generates without errors
✅ GraphQL schema includes all new types
✅ All 7 GraphQL queries work correctly
✅ All 3 GraphQL mutations work (with admin auth)
✅ All 10 REST endpoints respond correctly
✅ Pagination works as expected
✅ Filtering works for all parameters
✅ Full-text search returns relevant results
✅ Tier-based access control enforced
✅ Error handling returns appropriate status codes
✅ Input validation catches invalid data

## Troubleshooting

### Issue: Prisma schema errors
**Solution**: Run `npx prisma format` and `npx prisma validate`

### Issue: GraphQL schema not updated
**Solution**: Restart the server to reload the schema

### Issue: REST endpoints return 404
**Solution**: Check that routes are registered in `src/index.ts`

### Issue: Authentication not working
**Solution**: Ensure JWT token is valid and user object is in context

### Issue: Search returns no results
**Solution**: Ensure data exists and search query is at least 2 characters

### Issue: TypeScript compilation errors
**Solution**: Run `npx prisma generate` to regenerate types

## Next Steps

After validation:

1. Create seed scripts for sample data
2. Set up automated tests with Jest
3. Add integration with AI event generation pipeline
4. Create frontend components to display events
5. Add webhooks for event notifications
6. Implement caching for frequently accessed data
7. Add analytics tracking for popular queries
