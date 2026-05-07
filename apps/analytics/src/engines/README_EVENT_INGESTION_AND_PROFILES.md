# Event Ingestion Engine & Company Profile Builder

This document describes the Event Ingestion Engine (Task #78) and Company Profile Builder (Task #79) implementations for the Stock Knowledge Repository system.

## Table of Contents
- [Event Ingestion Engine (Task #78)](#event-ingestion-engine-task-78)
- [Company Profile Builder (Task #79)](#company-profile-builder-task-79)
- [Database Schema](#database-schema)
- [Celery Tasks & Scheduling](#celery-tasks--scheduling)
- [Usage Examples](#usage-examples)

---

## Event Ingestion Engine (Task #78)

### Overview
The Event Ingestion Engine automatically creates `stock_events` from various data sources with intelligent impact assessment and deduplication.

### File Location
`apps/analytics/src/engines/event_ingestion.py`

### Features

#### 1. Auto-Create Stock Events From:
- **Financial Results**: QUARTERLY_RESULT events with AI-generated summaries
- **News Articles**: Only HIGH impact news, auto-categorized into event types
- **Shareholding Patterns**:
  - PROMOTER_CHANGE events (>2% change)
  - PLEDGE_CHANGE events (>5% change)
- **Insider Transactions**: BULK_DEAL and BLOCK_DEAL events
- **Risk Flags**: REGULATORY_ACTION and AUDITOR_CHANGE events
- **Composite Scores**: Events when any score changes >10 points

#### 2. Impact Assessment
Auto-assesses impact based on metrics:
- **VERY_POSITIVE**: Revenue growth >20% AND margin expansion >2%
- **POSITIVE**: Revenue growth >20% OR margin expansion OR profit growth >20%
- **NEGATIVE**: Revenue decline >10% OR profit decline >20%
- **VERY_NEGATIVE**: Revenue decline >20% OR profit decline >50%
- **NEUTRAL**: Everything else

#### 3. Auto-Categorization
News articles are automatically categorized into event types:
- Acquisitions, divestitures
- Order wins, product launches
- Plant expansions, capex announcements
- Regulatory actions, credit rating changes
- Management changes
- Media coverage

#### 4. Deduplication
Prevents creating multiple events for the same source:
- Checks `source_id` and `source_type` before creating events
- No duplicate quarterly results or shareholding changes

### Methods

#### `process_new_events(company_id: str) -> Dict`
Scans all data sources and creates events for a company.

```python
from engines.event_ingestion import EventIngestionEngine

engine = EventIngestionEngine()
result = engine.process_new_events("company-uuid-here")

# Returns:
# {
#     'company_id': 'uuid',
#     'events_created': {
#         'financial_results': 2,
#         'news_articles': 5,
#         'shareholding_changes': 1,
#         'insider_transactions': 0,
#         'risk_flags': 0,
#         'score_changes': 1,
#         'total': 9
#     },
#     'status': 'success'
# }
```

#### `generate_period_summary(company_id: str, period_type: str) -> Dict`
Generates AI summary of events for a period (monthly/quarterly/annual).

```python
result = engine.generate_period_summary("company-uuid", "quarterly")

# Returns:
# {
#     'company_id': 'uuid',
#     'period_type': 'quarterly',
#     'events_count': 15,
#     'summary': 'AI-generated summary of key events...',
#     'status': 'success'
# }
```

### Event Thresholds
```python
REVENUE_GROWTH_THRESHOLD = 20.0    # 20% YoY growth
MARGIN_EXPANSION_THRESHOLD = 2.0   # 2% margin expansion
PROMOTER_CHANGE_THRESHOLD = 2.0    # 2% promoter holding change
PLEDGE_CHANGE_THRESHOLD = 5.0      # 5% pledge change
SCORE_CHANGE_THRESHOLD = 10.0      # 10 points score change
```

---

## Company Profile Builder (Task #79)

### Overview
The Company Profile Builder maintains comprehensive company profiles with 7 AI-generated sections, each with version control and confidence levels.

### File Location
`apps/analytics/src/engines/profile_builder.py`

### 7 Profile Sections

#### 1. BUSINESS_MODEL
- What the company does
- Revenue segments and their contribution
- Products and services
- Geographic presence
- Business characteristics (asset-light/heavy, B2B/B2C)

#### 2. COMPETITIVE_ADVANTAGE
- Moat analysis
- Market position and share
- Key differentiators
- Economic moat factors
- Competitive threats

#### 3. MANAGEMENT_QUALITY
- Key management team (CEO, CFO, directors)
- Track record and execution history
- Promoter holding trends
- Governance quality assessment
- Board independence

#### 4. KEY_RISKS
- Top 5-7 risks with:
  - Risk name
  - Severity (HIGH/MEDIUM/LOW)
  - Likelihood (HIGH/MEDIUM/LOW)
  - Impact description
  - Mitigation factors

#### 5. GROWTH_DRIVERS
- Top 5 growth catalysts with:
  - Driver name
  - Timeline (SHORT_TERM/MEDIUM_TERM/LONG_TERM)
  - Confidence (HIGH/MEDIUM/LOW)
  - Impact description
  - Key milestones

#### 6. REVENUE_BREAKDOWN
- By product/segment
- By geography
- Concentration risk analysis
- Growth trends by segment

#### 7. CORPORATE_HISTORY
- Key milestones chronologically:
  - Founding/Incorporation
  - IPO/Listing
  - Major acquisitions
  - Significant expansions
  - Product launches
  - Strategic shifts

### Section Metadata
Each section stores:
- **content**: Structured JSON data
- **version**: Version number (incremented on updates)
- **last_updated**: Timestamp of last generation
- **source_urls**: URLs of source data
- **confidence_level**: HIGH/MEDIUM/LOW (based on data availability)
- **metadata**: Model version, data points used, etc.

### Methods

#### `build_complete_profile(company_id: str) -> Dict`
Builds all 7 sections for a company.

```python
from engines.profile_builder import CompanyProfileBuilder

builder = CompanyProfileBuilder()
result = builder.build_complete_profile("company-uuid-here")

# Returns:
# {
#     'company_id': 'uuid',
#     'sections_generated': {
#         'BUSINESS_MODEL': {'status': 'success', 'version': 1, ...},
#         'COMPETITIVE_ADVANTAGE': {'status': 'success', 'version': 1, ...},
#         ...
#     },
#     'success_count': 7,
#     'error_count': 0,
#     'status': 'success'
# }
```

#### `generate_section(company_id: str, section_type: str) -> ProfileSection`
Generates a specific profile section.

```python
section = builder.generate_section("company-uuid", "KEY_RISKS")

# Returns ProfileSection dataclass with:
# - section_type
# - content (JSON)
# - version
# - last_updated
# - source_urls
# - confidence_level
# - metadata
```

#### `update_section(company_id: str, section_type: str) -> ProfileSection`
Updates an existing section (increments version number).

#### `check_update_triggers(company_id: str) -> List[str]`
Checks which sections need updating based on new data.

```python
sections_to_update = builder.check_update_triggers("company-uuid")
# Returns: ['KEY_RISKS', 'GROWTH_DRIVERS']
```

### Update Triggers
Sections are automatically updated when:

| Section | Triggers |
|---------|----------|
| BUSINESS_MODEL | New financial results, HIGH impact news |
| COMPETITIVE_ADVANTAGE | HIGH impact news, score changes |
| MANAGEMENT_QUALITY | Shareholding changes, risk flags, management news |
| KEY_RISKS | New risk flags, negative HIGH impact news |
| GROWTH_DRIVERS | Financial results, positive events, positive news |
| REVENUE_BREAKDOWN | New financial results |
| CORPORATE_HISTORY | Major events, HIGH impact news |

Also updates if section is >90 days old.

### Confidence Level Assessment
- **HIGH**: 20+ data points available
- **MEDIUM**: 10-19 data points available
- **LOW**: <10 data points available

---

## Database Schema

### stock_events Table
```sql
CREATE TABLE stock_events (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    event_type TEXT,                    -- EventType enum
    event_date TIMESTAMP,
    impact_assessment TEXT,             -- ImpactAssessment enum
    title TEXT,
    description TEXT,
    metadata JSONB,
    source_id TEXT,                     -- Source record ID
    source_type TEXT,                   -- Source type (e.g., 'financial_result')
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### company_profiles Table
```sql
CREATE TABLE company_profiles (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    section_type TEXT,                  -- CompanyProfileSectionType enum
    content JSONB,                      -- Structured section content
    version INTEGER,                    -- Version number
    last_updated TIMESTAMP,
    source_urls JSONB,                  -- Array of source URLs
    confidence_level TEXT,              -- ConfidenceLevel enum
    metadata JSONB,
    created_at TIMESTAMP
);
```

### stock_milestones Table
```sql
CREATE TABLE stock_milestones (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    milestone_type TEXT,                -- MilestoneType enum
    milestone_date DATE,
    title TEXT,
    description TEXT,
    significance TEXT,                  -- Severity enum
    metadata JSONB,
    created_at TIMESTAMP
);
```

### company_timeline_summaries Table
```sql
CREATE TABLE company_timeline_summaries (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    period_type TEXT,                   -- TimelinePeriodType enum
    start_date DATE,
    end_date DATE,
    summary_text TEXT,
    key_events JSONB,                   -- Array of event summaries
    metrics JSONB,
    ai_generated BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## Celery Tasks & Scheduling

### Event Ingestion Tasks

#### `process_new_events_task(company_id)`
Process events for a single company.

```python
from src.tasks import process_new_events_task

# Queue task
process_new_events_task.delay("company-uuid")
```

#### `generate_period_summary_task(company_id, period_type)`
Generate period summary for a company.

```python
from src.tasks import generate_period_summary_task

# Queue task
generate_period_summary_task.delay("company-uuid", "quarterly")
```

#### `batch_process_all_company_events()`
Process events for all active companies.

```python
from src.tasks import batch_process_all_company_events

# Queue task
batch_process_all_company_events.delay()
```

#### `batch_generate_weekly_summaries()`
Generate weekly summaries for all companies.

```python
from src.tasks import batch_generate_weekly_summaries

# Queue task
batch_generate_weekly_summaries.delay()
```

### Company Profile Tasks

#### `build_company_profile_task(company_id)`
Build complete profile for a company.

```python
from src.tasks import build_company_profile_task

# Queue task
build_company_profile_task.delay("company-uuid")
```

#### `update_company_profile_section_task(company_id, section_type)`
Update a specific profile section.

```python
from src.tasks import update_company_profile_section_task

# Queue task
update_company_profile_section_task.delay("company-uuid", "KEY_RISKS")
```

#### `check_and_update_profiles_task()`
Check all profiles and update as needed.

```python
from src.tasks import check_and_update_profiles_task

# Queue task
check_and_update_profiles_task.delay()
```

#### `batch_build_all_profiles_task()`
Build profiles for all active companies (initial setup).

```python
from src.tasks import batch_build_all_profiles_task

# Queue task
batch_build_all_profiles_task.delay()
```

### Scheduled Tasks (celeryconfig.py)

```python
beat_schedule = {
    # Event Ingestion - Daily at 23:00 IST
    'process-all-company-events-daily': {
        'task': 'src.tasks.batch_process_all_company_events',
        'schedule': crontab(hour=17, minute=30),  # 17:30 UTC = 23:00 IST
    },

    # Weekly Summaries - Sunday at 06:00 IST
    'generate-weekly-summaries': {
        'task': 'src.tasks.batch_generate_weekly_summaries',
        'schedule': crontab(day_of_week=0, hour=0, minute=30),  # Sunday 00:30 UTC = 06:00 IST
    },

    # Profile Updates - Daily at 23:30 IST
    'check-and-update-profiles': {
        'task': 'src.tasks.check_and_update_profiles_task',
        'schedule': crontab(hour=18, minute=0),  # 18:00 UTC = 23:30 IST
    },
}
```

### Task Queues

Tasks are routed to appropriate queues for better resource management:

- **ingestion queue**: Event processing tasks
- **llm queue**: AI generation tasks (summaries, profiles)

```python
task_routes = {
    'src.tasks.process_new_events_task': {'queue': 'ingestion'},
    'src.tasks.generate_period_summary_task': {'queue': 'llm'},
    'src.tasks.build_company_profile_task': {'queue': 'llm'},
    'src.tasks.update_company_profile_section_task': {'queue': 'llm'},
    # ... more routes
}
```

---

## Usage Examples

### Example 1: Process Events for a Company

```python
from engines.event_ingestion import EventIngestionEngine

# Initialize engine
engine = EventIngestionEngine()

# Process events for a specific company
result = engine.process_new_events("550e8400-e29b-41d4-a716-446655440000")

print(f"Created {result['events_created']['total']} events")
print(f"Financial results: {result['events_created']['financial_results']}")
print(f"News articles: {result['events_created']['news_articles']}")
```

### Example 2: Generate Quarterly Summary

```python
from engines.event_ingestion import EventIngestionEngine

engine = EventIngestionEngine()

# Generate quarterly summary
result = engine.generate_period_summary(
    company_id="550e8400-e29b-41d4-a716-446655440000",
    period_type="quarterly"
)

print(result['summary'])
```

### Example 3: Build Complete Company Profile

```python
from engines.profile_builder import CompanyProfileBuilder

# Initialize builder
builder = CompanyProfileBuilder()

# Build complete profile
result = builder.build_complete_profile("550e8400-e29b-41d4-a716-446655440000")

print(f"Generated {result['success_count']} of {result['total_sections']} sections")
```

### Example 4: Update Specific Profile Section

```python
from engines.profile_builder import CompanyProfileBuilder

builder = CompanyProfileBuilder()

# Update KEY_RISKS section
section = builder.update_section(
    company_id="550e8400-e29b-41d4-a716-446655440000",
    section_type="KEY_RISKS"
)

print(f"Updated to version {section.version}")
print(f"Confidence: {section.confidence_level}")
print(f"Content: {section.content}")
```

### Example 5: Check Which Sections Need Updates

```python
from engines.profile_builder import CompanyProfileBuilder

builder = CompanyProfileBuilder()

# Check update triggers
sections = builder.check_update_triggers("550e8400-e29b-41d4-a716-446655440000")

print(f"Sections needing update: {sections}")
# Output: ['KEY_RISKS', 'GROWTH_DRIVERS', 'MANAGEMENT_QUALITY']
```

### Example 6: Query Events from Database

```python
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://...')

with engine.connect() as conn:
    # Get recent events for a company
    query = text("""
        SELECT event_type, event_date, title, impact_assessment
        FROM stock_events
        WHERE company_id = :company_id
        ORDER BY event_date DESC
        LIMIT 20
    """)

    events = conn.execute(query, {'company_id': 'uuid-here'}).fetchall()

    for event in events:
        print(f"{event.event_date}: {event.title} ({event.impact_assessment})")
```

### Example 7: Query Profile Sections

```python
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://...')

with engine.connect() as conn:
    # Get latest version of all sections
    query = text("""
        SELECT DISTINCT ON (section_type)
            section_type, content, version, confidence_level, last_updated
        FROM company_profiles
        WHERE company_id = :company_id
        ORDER BY section_type, version DESC
    """)

    sections = conn.execute(query, {'company_id': 'uuid-here'}).fetchall()

    for section in sections:
        print(f"{section.section_type} v{section.version} ({section.confidence_level})")
```

---

## Migration Instructions

### 1. Apply Database Migration

```bash
cd apps/api
psql $DATABASE_URL -f prisma/migrations/20260208140000_add_stock_events_and_company_profiles/migration.sql
```

### 2. Generate Prisma Client

```bash
cd apps/api
npx prisma generate
```

### 3. Initial Profile Build (Optional)

```bash
# From Python environment
from src.tasks import batch_build_all_profiles_task

# Queue initial profile build for all companies
batch_build_all_profiles_task.delay()
```

### 4. Test Event Processing

```bash
# From Python environment
from src.tasks import process_new_events_task

# Test on a single company
process_new_events_task.delay("company-uuid-here")
```

---

## Environment Variables

Both engines require:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Anthropic API (for AI generation)
ANTHROPIC_API_KEY=sk-ant-...

# Redis (for caching)
REDIS_URL=redis://:password@host:6379
```

---

## Performance Considerations

### Event Ingestion
- Processes ~50-100 companies per minute
- AI summary generation adds ~2-3 seconds per event
- Can disable AI summaries by not setting ANTHROPIC_API_KEY

### Profile Builder
- Complete profile generation: ~30-60 seconds per company
- Single section update: ~5-10 seconds
- Batch operations are queued asynchronously

### Resource Usage
- Event ingestion: Low CPU, moderate DB queries
- Profile building: High API usage (Claude), high token consumption
- Recommended: Run LLM tasks in dedicated queue

---

## Troubleshooting

### Issue: No events created
**Solution**: Check if source data exists in database (financial_results, news_articles, etc.)

### Issue: Profile generation fails
**Solution**: Verify ANTHROPIC_API_KEY is set and valid. Check if sufficient data exists for the company.

### Issue: Low confidence levels
**Solution**: Ensure company has sufficient historical data (financials, news, events)

### Issue: Events duplicated
**Solution**: Check deduplication logic. Ensure source_id and source_type are set correctly.

---

## Future Enhancements

### Event Ingestion
- [ ] Add more event sources (social media, analyst reports)
- [ ] Implement event clustering for related events
- [ ] Add sentiment trend analysis
- [ ] Create event importance scoring

### Company Profile
- [ ] Add peer comparison section
- [ ] Implement change tracking (diff between versions)
- [ ] Add visual elements (charts, graphs)
- [ ] Create profile completeness score

---

## License & Support

Part of the Alpha Signal Stock Knowledge Repository system.

For questions or issues:
- Check the logs in `apps/analytics/logs/`
- Review Celery task history in Flower UI
- Consult database query examples above
