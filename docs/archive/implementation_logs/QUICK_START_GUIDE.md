# Quick Start Guide - Event Ingestion & Company Profiles

## Prerequisites
- Database migration applied
- ANTHROPIC_API_KEY set in environment
- Celery workers running

---

## 1. Apply Database Migration

```bash
cd /Users/amitkandari/Desktop/alpha-signal/apps/api

# Apply migration
psql $DATABASE_URL -f prisma/migrations/20260208140000_add_stock_events_and_company_profiles/migration.sql

# Generate Prisma client
npx prisma generate
```

---

## 2. Test Event Ingestion (Single Company)

```python
# In Python shell or script
import os
os.chdir('/Users/amitkandari/Desktop/alpha-signal/apps/analytics')

from src.engines.event_ingestion import EventIngestionEngine

# Initialize engine
engine = EventIngestionEngine()

# Get a company ID from your database
# SELECT id FROM companies WHERE is_active = true LIMIT 1;
company_id = "your-company-uuid-here"

# Process events
result = engine.process_new_events(company_id)

print(f"Events created: {result['events_created']['total']}")
print(f"- Financial results: {result['events_created']['financial_results']}")
print(f"- News articles: {result['events_created']['news_articles']}")
print(f"- Shareholding changes: {result['events_created']['shareholding_changes']}")
print(f"- Insider transactions: {result['events_created']['insider_transactions']}")
print(f"- Risk flags: {result['events_created']['risk_flags']}")
print(f"- Score changes: {result['events_created']['score_changes']}")
```

---

## 3. Test Profile Builder (Single Company)

```python
# In Python shell or script
import os
os.chdir('/Users/amitkandari/Desktop/alpha-signal/apps/analytics')

from src.engines.profile_builder import CompanyProfileBuilder

# Initialize builder
builder = CompanyProfileBuilder()

# Get a company ID
company_id = "your-company-uuid-here"

# Build complete profile (all 7 sections)
result = builder.build_complete_profile(company_id)

print(f"Sections generated: {result['success_count']}/{result['total_sections']}")
for section_type, section_info in result['sections_generated'].items():
    if section_info['status'] == 'success':
        print(f"✓ {section_type} - v{section_info['version']}")
    else:
        print(f"✗ {section_type} - {section_info['error']}")
```

---

## 4. Queue Celery Tasks

```python
# In Python shell or script
import os
os.chdir('/Users/amitkandari/Desktop/alpha-signal/apps/analytics')

from src.tasks import (
    process_new_events_task,
    build_company_profile_task,
    generate_period_summary_task
)

company_id = "your-company-uuid-here"

# Queue event processing
task1 = process_new_events_task.delay(company_id)
print(f"Queued event processing: {task1.id}")

# Queue profile building
task2 = build_company_profile_task.delay(company_id)
print(f"Queued profile building: {task2.id}")

# Queue weekly summary
task3 = generate_period_summary_task.delay(company_id, "weekly")
print(f"Queued weekly summary: {task3.id}")

# Check task status
print(f"Task 1 status: {task1.status}")
print(f"Task 2 status: {task2.status}")
```

---

## 5. Batch Process All Companies

```python
# WARNING: This will process ALL active companies
# Only run this when ready for production

import os
os.chdir('/Users/amitkandari/Desktop/alpha-signal/apps/analytics')

from src.tasks import (
    batch_process_all_company_events,
    batch_build_all_profiles_task
)

# Process events for all companies
events_task = batch_process_all_company_events.delay()
print(f"Batch event processing queued: {events_task.id}")

# Build profiles for all companies (only for initial setup)
# profiles_task = batch_build_all_profiles_task.delay()
# print(f"Batch profile building queued: {profiles_task.id}")
```

---

## 6. Query Results

### Query Stock Events

```python
from sqlalchemy import create_engine, text
import os

db_url = os.getenv('DATABASE_URL', 'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal')
engine = create_engine(db_url)

company_id = "your-company-uuid-here"

with engine.connect() as conn:
    query = text("""
        SELECT
            event_type, event_date, title,
            impact_assessment, source_type
        FROM stock_events
        WHERE company_id = :company_id
        ORDER BY event_date DESC
        LIMIT 10
    """)

    events = conn.execute(query, {'company_id': company_id}).fetchall()

    print("\nRecent Events:")
    for event in events:
        print(f"  {event.event_date.strftime('%Y-%m-%d')} | {event.event_type} | {event.impact_assessment}")
        print(f"    {event.title}")
        print()
```

### Query Company Profile

```python
from sqlalchemy import create_engine, text
import json
import os

db_url = os.getenv('DATABASE_URL', 'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal')
engine = create_engine(db_url)

company_id = "your-company-uuid-here"

with engine.connect() as conn:
    query = text("""
        SELECT DISTINCT ON (section_type)
            section_type, content, version,
            confidence_level, last_updated
        FROM company_profiles
        WHERE company_id = :company_id
        ORDER BY section_type, version DESC
    """)

    sections = conn.execute(query, {'company_id': company_id}).fetchall()

    print("\nProfile Sections:")
    for section in sections:
        print(f"\n{section.section_type} (v{section.version} - {section.confidence_level})")
        print(f"  Last Updated: {section.last_updated}")

        # Pretty print a sample of the content
        content = json.loads(section.content) if isinstance(section.content, str) else section.content
        print(f"  Content keys: {list(content.keys())}")
```

---

## 7. Verify Scheduled Tasks

```bash
# Check Celery Beat schedule
cd /Users/amitkandari/Desktop/alpha-signal/apps/analytics
celery -A src.celery_app inspect scheduled

# Monitor Celery workers
celery -A src.celery_app inspect active

# Check Flower UI (if running)
# Open http://localhost:5555 in browser
```

---

## 8. Monitor Logs

```bash
# View Celery worker logs
cd /Users/amitkandari/Desktop/alpha-signal/apps/analytics
tail -f logs/celery_worker.log

# View specific task logs
grep "process_new_events_task" logs/celery_worker.log | tail -20
grep "build_company_profile_task" logs/celery_worker.log | tail -20
```

---

## 9. Database Verification Queries

### Count Events by Type
```sql
SELECT event_type, COUNT(*) as count
FROM stock_events
GROUP BY event_type
ORDER BY count DESC;
```

### Count Profiles by Section
```sql
SELECT section_type, COUNT(*) as count
FROM company_profiles
GROUP BY section_type
ORDER BY count DESC;
```

### Check Profile Completeness
```sql
-- Companies with all 7 sections
SELECT company_id, COUNT(DISTINCT section_type) as sections
FROM company_profiles
GROUP BY company_id
HAVING COUNT(DISTINCT section_type) = 7;

-- Companies missing sections
SELECT company_id, COUNT(DISTINCT section_type) as sections
FROM company_profiles
GROUP BY company_id
HAVING COUNT(DISTINCT section_type) < 7;
```

### Recent Events
```sql
SELECT
    c.company_name,
    se.event_type,
    se.event_date,
    se.title,
    se.impact_assessment
FROM stock_events se
JOIN companies c ON se.company_id = c.id
ORDER BY se.event_date DESC
LIMIT 20;
```

---

## 10. Troubleshooting

### Issue: No events created
```python
# Check if source data exists
from sqlalchemy import create_engine, text
import os

db_url = os.getenv('DATABASE_URL')
engine = create_engine(db_url)
company_id = "your-company-uuid-here"

with engine.connect() as conn:
    # Check financial results
    fr = conn.execute(text("SELECT COUNT(*) FROM financial_results WHERE company_id = :id"), {'id': company_id}).scalar()
    print(f"Financial results: {fr}")

    # Check news articles
    na = conn.execute(text("SELECT COUNT(*) FROM news_articles WHERE company_id = :id"), {'id': company_id}).scalar()
    print(f"News articles: {na}")

    # Check shareholding patterns
    sp = conn.execute(text("SELECT COUNT(*) FROM shareholding_patterns WHERE company_id = :id"), {'id': company_id}).scalar()
    print(f"Shareholding patterns: {sp}")
```

### Issue: Profile generation fails
```python
# Check if ANTHROPIC_API_KEY is set
import os
api_key = os.getenv('ANTHROPIC_API_KEY')
print(f"API Key set: {bool(api_key)}")

# Try generating a single section
from src.engines.profile_builder import CompanyProfileBuilder

builder = CompanyProfileBuilder()
company_id = "your-company-uuid-here"

try:
    section = builder.generate_section(company_id, "BUSINESS_MODEL")
    print(f"Success! Version: {section.version}, Confidence: {section.confidence_level}")
except Exception as e:
    print(f"Error: {e}")
```

### Issue: Tasks not running
```bash
# Check if Celery workers are running
ps aux | grep celery

# Check Redis connection
redis-cli -u $REDIS_URL ping

# Restart workers
pkill -f 'celery worker'
celery -A src.celery_app worker --loglevel=info --queues=ingestion,llm &
```

---

## 11. Environment Variables Checklist

```bash
# Required variables
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:0:10}..."
echo "REDIS_URL: ${REDIS_URL:0:20}..."
echo "CELERY_BROKER_URL: ${CELERY_BROKER_URL:0:20}..."
echo "CELERY_RESULT_BACKEND: ${CELERY_RESULT_BACKEND:0:20}..."
```

---

## 12. Next Steps

1. ✅ Apply database migration
2. ✅ Test with 1 company
3. ✅ Verify results in database
4. ✅ Queue tasks via Celery
5. ✅ Monitor execution
6. ⏳ Enable scheduled tasks
7. ⏳ Batch process all companies (when ready)

---

## Quick Commands Summary

```bash
# 1. Apply migration
cd apps/api && psql $DATABASE_URL -f prisma/migrations/20260208140000_add_stock_events_and_company_profiles/migration.sql

# 2. Generate Prisma client
cd apps/api && npx prisma generate

# 3. Start Celery worker
cd apps/analytics && celery -A src.celery_app worker --loglevel=info --queues=ingestion,llm

# 4. Start Celery beat (for scheduled tasks)
cd apps/analytics && celery -A src.celery_app beat --loglevel=info

# 5. Start Flower (monitoring UI)
cd apps/analytics && celery -A src.celery_app flower

# 6. Test Python import
cd apps/analytics && python -c "from src.engines.event_ingestion import EventIngestionEngine; print('OK')"

# 7. View logs
cd apps/analytics && tail -f logs/celery_worker.log
```

---

## Success Indicators

✓ Migration applied without errors
✓ Tables created: stock_events, company_profiles, stock_milestones, company_timeline_summaries
✓ Python imports work without errors
✓ Test company processed successfully
✓ Events visible in database
✓ Profile sections generated
✓ Celery tasks execute
✓ Scheduled tasks appear in beat schedule

---

## Support

For detailed documentation, see:
- `/apps/analytics/src/engines/README_EVENT_INGESTION_AND_PROFILES.md`
- `/TASK_78_79_IMPLEMENTATION_SUMMARY.md`

For issues:
- Check logs in `apps/analytics/logs/`
- Review Celery task history in Flower
- Verify database records
- Check ANTHROPIC_API_KEY is valid
