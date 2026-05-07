# Stock Repository Quick Reference Card

## 🚀 Quick Start

### Start Server
```bash
npm run dev
```

### Access Endpoints
- **GraphQL Playground:** http://localhost:4000/graphql
- **REST API Base:** http://localhost:4000/api
- **Prisma Studio:** `npx prisma studio`

---

## 📊 Database Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `stock_events` | Company events | eventType, eventDate, title, summary |
| `stock_milestones` | Key milestones | milestoneType, date, title |
| `company_timeline_summaries` | AI narratives | periodType, narrative, metrics |
| `company_profiles` | Company sections | sectionType, content |

---

## 🔍 GraphQL Queries (7)

### 1. Get Company Events
```graphql
stockEvents(companyId: ID!, filters: {...}, pagination: {...}): StockEventsResponse!
```

### 2. Get Single Event
```graphql
stockEvent(id: ID!): StockEvent
```

### 3. Get Milestones
```graphql
companyMilestones(companyId: ID!, limit: Int): [StockMilestone!]!
```

### 4. Get Profile Section
```graphql
companyProfile(companyId: ID!, sectionType: CompanyProfileSectionType!): CompanyProfile
```

### 5. Get All Profile Sections
```graphql
companyProfileAll(companyId: ID!): [CompanyProfile!]!
```

### 6. Get Timeline Summary
```graphql
companyTimelineSummary(companyId: ID!, periodType: TimelinePeriodType!): CompanyTimelineSummary
```

### 7. Search Across Companies
```graphql
searchEventsAcrossCompanies(query: String!, filters: {...}, pagination: {...}): SearchEventsResponse!
```

---

## 🔧 REST API Endpoints (10)

### Events
```
GET    /api/stock-events              - List all events
GET    /api/stock-events/:id          - Get single event
GET    /api/stock-events/search       - Search events
POST   /api/stock-events              - Create event (admin)
PATCH  /api/stock-events/:id          - Update event (admin)
POST   /api/stock-events/:id/verify   - Verify event (admin)
```

### Company Data
```
GET    /api/companies/:id/events      - Get company events
GET    /api/companies/:id/milestones  - Get milestones
GET    /api/companies/:id/profile     - Get profile
GET    /api/companies/:id/timeline    - Get timeline
```

---

## 🎯 Event Types (33)

### Financial
QUARTERLY_RESULT, ANNUAL_RESULT, DIVIDEND, STOCK_SPLIT, BONUS, RIGHTS_ISSUE

### Corporate Actions
MANAGEMENT_CHANGE, ACQUISITION, DIVESTITURE, AUDITOR_CHANGE, PROMOTER_CHANGE, CREDIT_RATING_CHANGE

### Operations
CAPEX_ANNOUNCEMENT, ORDER_WIN, ORDER_LOSS, PRODUCT_LAUNCH, PLANT_EXPANSION

### Regulatory
REGULATORY_ACTION, SEBI_NOTICE, LITIGATION_UPDATE

### Market Events
BULK_DEAL, BLOCK_DEAL, PLEDGE_CHANGE

### Other
SECTOR_POLICY, GOVERNMENT_ORDER, CONCALL_HIGHLIGHT, ANALYST_ACTION, MEDIA_COVERAGE, AGM_EGM, BOARD_MEETING, OTHER

---

## 📈 Impact Assessment

| Level | Description |
|-------|-------------|
| VERY_POSITIVE | Major positive impact |
| POSITIVE | Positive impact |
| NEUTRAL | No significant impact |
| NEGATIVE | Negative impact |
| VERY_NEGATIVE | Major negative impact |

---

## 🔐 Access Control

| Tier | Access Level |
|------|-------------|
| FREE | Verified events only |
| PRO | All events |
| PREMIUM | All events + Admin mutations |

---

## 🔍 Filter Parameters

### Common Filters
- `eventTypes: [EventType!]` - Filter by event types
- `impactAssessments: [ImpactAssessment!]` - Filter by impact
- `startDate: String` - Filter from date
- `endDate: String` - Filter to date
- `search: String` - Full-text search
- `tags: [String!]` - Filter by tags
- `fiscalYear: Int` - Filter by fiscal year
- `fiscalQuarter: Int` - Filter by quarter (1-4)
- `isVerified: Boolean` - Filter by verification status

### Pagination
- `limit: Int` - Records per page (max: 100)
- `offset: Int` - Skip N records

---

## 📝 Example Requests

### GraphQL: Get Recent Events
```graphql
query {
  stockEvents(
    companyId: "uuid"
    filters: {
      eventTypes: [QUARTERLY_RESULT, DIVIDEND]
      impactAssessments: [POSITIVE, VERY_POSITIVE]
      startDate: "2024-01-01"
    }
    pagination: { limit: 10 }
  ) {
    events {
      id
      title
      eventDate
      impactAssessment
    }
    total
    hasMore
  }
}
```

### REST: Search Events
```bash
curl "http://localhost:4000/api/stock-events/search?query=dividend&impactAssessments=POSITIVE&limit=20"
```

### REST: Get Company Timeline
```bash
curl "http://localhost:4000/api/companies/{uuid}/timeline?periodType=LAST_30_DAYS"
```

### REST: Create Event (Admin)
```bash
curl -X POST "http://localhost:4000/api/stock-events" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "uuid",
    "eventType": "DIVIDEND",
    "eventDate": "2024-01-15",
    "title": "Dividend Announcement",
    "summary": "...",
    "detailedContent": {...},
    "impactAssessment": "POSITIVE",
    "impactAreas": ["Shareholder Value"],
    "sourceUrls": ["https://..."],
    "sourceNames": ["BSE"],
    "confidence": "HIGH",
    "tags": ["dividend"]
  }'
```

---

## 🧪 Quick Test

### 1. Validate Schema
```bash
npx prisma validate
```

### 2. Start Server
```bash
npm run dev
```

### 3. Test GraphQL
Open http://localhost:4000/graphql and run:
```graphql
{ __schema { types { name } } }
```

### 4. Test REST API
```bash
curl http://localhost:4000/api/stock-events?limit=5
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `STOCK_REPOSITORY_README.md` | Complete API documentation |
| `test-stock-repository.md` | Testing guide with examples |
| `TASK_COMPLETION_SUMMARY.md` | Implementation summary |
| `QUICK_REFERENCE.md` | This file - Quick reference |

---

## 🐛 Troubleshooting

### Schema Error
```bash
npx prisma format
npx prisma validate
```

### Type Errors
```bash
npx prisma generate
```

### Server Won't Start
Check ports 4000 and 5432 are available

### No Data Returned
- Verify company ID exists
- Check tier-based access (FREE = verified only)
- Ensure data exists in database

---

## 💡 Pro Tips

1. **Use GraphQL for complex queries** - Better for nested data
2. **Use REST for simple CRUD** - Easier for basic operations
3. **Always paginate** - Set reasonable limits
4. **Filter early** - Use filters to reduce data transfer
5. **Cache profile data** - Profiles change infrequently
6. **Index searches** - Full-text search is fast but can be optimized

---

## 🎓 Learning Resources

1. Read `STOCK_REPOSITORY_README.md` for deep dive
2. Follow `test-stock-repository.md` for hands-on testing
3. Check `TASK_COMPLETION_SUMMARY.md` for implementation details
4. Explore GraphQL schema in Playground
5. Use Prisma Studio to understand data structure

---

## ✅ Checklist

- [ ] Server running
- [ ] Database connected
- [ ] GraphQL Playground accessible
- [ ] REST endpoints responding
- [ ] Sample data created
- [ ] Queries tested
- [ ] Filters working
- [ ] Pagination working
- [ ] Search working
- [ ] Access control working

---

**Version:** 1.0.0
**Created:** 2024
**Status:** Production Ready
**Last Updated:** 2024-02-08
