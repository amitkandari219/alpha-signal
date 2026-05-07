# Weekly Report Generation Engine

Python-based AI-powered weekly report generation system with Celery tasks and Claude API integration.

## Overview

The Weekly Report Generation Engine automatically creates comprehensive market analysis reports:

- **Sector Weekly Reports**: Deep dive into specific sector performance with data-driven insights
- **Macro Weekly Reports**: Overall market and economic overview with sector rotation analysis

Both report types use Claude AI to generate professional financial analysis based on structured data from multiple sources.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Celery Beat Scheduler                      │
│  (Saturday 20:30 UTC / Sunday 02:00 IST - Sector Reports)  │
│  (Saturday 22:30 UTC / Sunday 04:00 IST - Macro Reports)   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Celery Worker (LLM Queue)                 │
│  - generate_all_sector_reports_task()                       │
│  - generate_sector_weekly_report_task(sector_id)            │
│  - generate_macro_weekly_report_task()                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           WeeklyReportGenerator (Engine)                    │
│  - _fetch_sector_data() → aggregates 7+ data sources        │
│  - _fetch_macro_data() → market-wide data collection        │
│  - _call_claude_api() → Claude Sonnet 4 integration         │
│  - _structure_report_content() → JSON formatting            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database Storage                    │
│  - weekly_reports table (report metadata + full content)    │
│  - report_sections table (structured sections)              │
│  - llm_usage table (cost tracking)                          │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. Sector Weekly Reports

**Data Collection** (7-day lookback):
- Price data for all stocks in sector
- Sector average return, best/worst performers
- Volume trends and market breadth
- News articles with sentiment analysis
- Sentiment snapshots for trend identification
- Shareholding patterns (FII/DII changes)
- Composite scores for top-rated stocks
- Comparison vs. Nifty 500 benchmark

**Report Sections** (JSON output):
```json
{
  "performance_summary": {
    "sector_return_pct": 2.5,
    "vs_nifty500_pct": 1.0,
    "trend_direction": "UP"
  },
  "top_movers": {
    "gainers": [...],
    "losers": [...]
  },
  "key_events": [...],
  "fii_dii_flow": {...},
  "policy_updates": [...],
  "ai_outlook": {
    "paragraphs": [...],
    "confidence": "HIGH",
    "key_risks": [...],
    "key_opportunities": [...]
  },
  "top_stocks": [...]
}
```

### 2. Macro Weekly Reports

**Data Collection**:
- Market indices performance (Nifty 50, Sensex, Midcap, Smallcap)
- Market breadth (advances/declines, 52-week highs/lows)
- FII/DII weekly flows and trends
- Currency & commodities (USD/INR, Crude, Gold)
- Macro indicators (GDP, IIP, PMI, CPI, Repo Rate)
- Sector rotation analysis (leading/lagging sectors)
- Top market-moving news across all sectors
- Global context (US Fed, China, Europe)

**Report Sections** (JSON output):
```json
{
  "market_summary": {...},
  "market_breadth": {...},
  "fii_dii_weekly": {...},
  "currency_commodities": {...},
  "macro_indicators": {...},
  "sector_rotation": {
    "leading_sectors": [...],
    "lagging_sectors": [...],
    "improving_sectors": [...],
    "weakening_sectors": [...]
  },
  "global_context": {...},
  "ai_weekly_thesis": {
    "title": "...",
    "paragraphs": [...],
    "key_watch_items": [...]
  }
}
```

### 3. Claude API Integration

**Model Configuration**:
- Model: `claude-sonnet-4-20250514`
- Temperature: `0.3` (consistent, factual tone)
- Max Tokens: `4000` (comprehensive analysis)
- Retry Logic: 3 attempts with exponential backoff

**Prompt Design**:
- Professional financial analyst tone
- Data-grounded analysis (no speculation)
- Specific numbers and time periods
- No buy/sell/hold recommendations
- AI-generated disclaimer included
- Structured JSON output matching schema

**Cost Tracking**:
- Every API call logged to `llm_usage` table
- Task type: `WEEKLY_REPORT_GENERATION`
- Input/output tokens tracked
- Cost calculated: $3/M input tokens, $15/M output tokens
- Duration and metadata logged

### 4. Error Handling

- Try/except blocks around all operations
- Retry logic for Claude API failures (3 attempts)
- Structured logging with `structlog`
- Database transaction rollback on errors
- Graceful degradation (continue other reports if one fails)
- Dead-letter queue for failed tasks

## File Structure

```
apps/analytics/
├── src/
│   ├── engines/
│   │   └── weekly_report_generator.py    # Main engine (850+ lines)
│   ├── tasks.py                          # Celery tasks (added 150 lines)
│   └── celery_app.py                     # Updated with config import
├── celeryconfig.py                       # Beat schedule configuration
├── test_weekly_report_generator.py       # Validation test script
└── WEEKLY_REPORT_GENERATION.md           # This file
```

## Setup & Configuration

### 1. Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...              # Claude API key
DATABASE_URL=postgresql://...             # PostgreSQL connection
CELERY_BROKER_URL=redis://...             # Redis for Celery
CELERY_RESULT_BACKEND=redis://...         # Redis for results

# Optional
LLM_DAILY_COST_LIMIT_USD=100.0            # Daily cost limit
```

### 2. Database Schema

Tables required:
- `weekly_reports` - Report metadata and full content
- `report_sections` - Structured sections
- `sectors` - Sector information
- `companies` - Company master data
- `daily_prices` - Stock price data
- `news_articles` - News with sentiment
- `sentiment_snapshots` - Daily sentiment aggregates
- `shareholding_patterns` - FII/DII data
- `composite_scores` - Stock quality scores
- `llm_usage` - Cost tracking

### 3. Install Dependencies

```bash
cd apps/analytics
pip install -r requirements.txt

# Key dependencies:
# - anthropic>=0.18.0
# - celery>=5.3.0
# - redis>=5.0.0
# - sqlalchemy>=2.0.0
# - structlog>=23.0.0
```

### 4. Start Workers

```bash
# Terminal 1: Start Celery worker
celery -A src.celery_app worker --loglevel=info -Q llm,ingestion,scoring

# Terminal 2: Start Celery Beat scheduler
celery -A src.celery_app beat --loglevel=info

# Terminal 3: Monitor tasks
celery -A src.celery_app flower
# Access at http://localhost:5555
```

## Usage

### Manual Report Generation

```python
from src.engines.weekly_report_generator import WeeklyReportGenerator

# Initialize generator
generator = WeeklyReportGenerator()

# Generate sector report
sector_id = "uuid-of-technology-sector"
report_id = generator.generate_sector_weekly_report(sector_id)
print(f"Sector report generated: {report_id}")

# Generate macro report
report_id = generator.generate_macro_weekly_report()
print(f"Macro report generated: {report_id}")
```

### Trigger via Celery

```bash
# Generate all sector reports
celery -A src.celery_app call generate_all_sector_reports

# Generate specific sector report
celery -A src.celery_app call generate_sector_weekly_report --args='["sector-uuid"]'

# Generate macro report
celery -A src.celery_app call generate_macro_weekly_report
```

### Scheduled Execution

Reports are automatically generated via Celery Beat:

- **Sector Reports**: Every Saturday at 20:30 UTC (Sunday 02:00 IST)
- **Macro Report**: Every Saturday at 22:30 UTC (Sunday 04:00 IST)

Schedule defined in `celeryconfig.py`:

```python
beat_schedule = {
    'generate-sector-weekly-reports': {
        'task': 'generate_all_sector_reports',
        'schedule': crontab(day_of_week=6, hour=20, minute=30),
    },
    'generate-macro-weekly-report': {
        'task': 'generate_macro_weekly_report',
        'schedule': crontab(day_of_week=6, hour=22, minute=30),
    },
}
```

## Testing

### Run Validation Tests

```bash
cd apps/analytics
python test_weekly_report_generator.py
```

**Test Coverage**:
1. WeeklyReportGenerator initialization
2. Sector data fetching
3. Macro data fetching
4. Utility methods (fiscal week, slug generation)
5. Report structuring
6. API key configuration check
7. Database table verification

### Expected Output

```
================================================================================
TESTING WEEKLY REPORT GENERATOR
================================================================================

✓ WeeklyReportGenerator initialized successfully

[TEST 1] Fetching test sector...
✓ Found test sector: Technology (uuid-...)

[TEST 2] Fetching sector data...
✓ Sector data fetched successfully
  - Companies: 45
  - Price data points: 315
  - News articles: 28
  - Top stocks: 10
  - Sector return: 2.5%

[TEST 3] Fetching macro data...
✓ Macro data fetched successfully
  - Sectors analyzed: 12
  - Sector performance data: 12
  - Top news: 30
  - FII/DII data points: 7

[TEST 4] Testing utility methods...
✓ Fiscal week/year: Week 6, FY2024
✓ Generated slug: technology-sector-weekly-analysis-week-6-2024

[TEST 5] Testing report structuring...
✓ Sector report structured successfully
  - Sections: ['performance_summary', 'top_movers', 'key_events', ...]

[TEST 6] Checking API key configuration...
✓ ANTHROPIC_API_KEY is configured

[TEST 7] Checking database tables...
✓ weekly_reports table exists: 0 reports found
✓ report_sections table exists: 0 sections found

================================================================================
ALL TESTS PASSED SUCCESSFULLY!
================================================================================
```

## Cost Estimation

### Claude API Pricing (2026)
- Input tokens: $3 per million
- Output tokens: $15 per million

### Estimated Costs per Report

**Sector Report**:
- Input tokens: ~8,000 (data context)
- Output tokens: ~2,500 (structured analysis)
- Cost per report: ~$0.06

**Macro Report**:
- Input tokens: ~12,000 (market-wide data)
- Output tokens: ~3,500 (comprehensive analysis)
- Cost per report: ~$0.09

### Weekly Cost (12 sectors + 1 macro)
- Sector reports: 12 × $0.06 = $0.72
- Macro report: 1 × $0.09 = $0.09
- **Total weekly**: ~$0.81

### Monthly Cost
- 4 weeks × $0.81 = **~$3.24/month**

All costs tracked in `llm_usage` table with detailed breakdown.

## Monitoring & Observability

### Structured Logging

```python
from utils.logger import logger

logger.info(
    "Sector weekly report generated",
    report_id=report_id,
    sector=sector_name,
    tokens=token_usage['total_tokens'],
    cost_usd=float(cost_usd)
)
```

### Cost Tracking Queries

```sql
-- Today's LLM costs
SELECT
  SUM(estimated_cost_usd) as total_cost,
  COUNT(*) as call_count,
  task_type
FROM llm_usage
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY task_type;

-- Weekly report generation stats
SELECT
  COUNT(*) as reports_generated,
  SUM(estimated_cost_usd) as total_cost,
  AVG(duration_ms) as avg_duration_ms
FROM llm_usage
WHERE task_type = 'WEEKLY_REPORT_GENERATION'
  AND created_at >= NOW() - INTERVAL '7 days';
```

### Health Checks

```sql
-- Latest reports generated
SELECT
  id, report_type, title,
  fiscal_week, fiscal_year,
  created_at
FROM weekly_reports
ORDER BY created_at DESC
LIMIT 10;

-- Report sections count
SELECT
  wr.title,
  COUNT(rs.id) as section_count
FROM weekly_reports wr
LEFT JOIN report_sections rs ON wr.id = rs.report_id
WHERE wr.created_at >= NOW() - INTERVAL '7 days'
GROUP BY wr.id, wr.title;
```

## Troubleshooting

### Issue: Claude API rate limit

**Solution**: Increase retry backoff or reduce concurrent tasks
```python
# In weekly_report_generator.py
MAX_RETRIES = 5
time.sleep(5 ** attempt)  # Longer backoff
```

### Issue: Insufficient data for sector

**Solution**: Reports gracefully handle missing data
```python
if not sector_data['companies']:
    logger.warning("No companies in sector", sector_id=sector_id)
    # Returns empty report or skips
```

### Issue: Database connection timeout

**Solution**: Increase connection pool size
```python
engine = create_engine(db_url, pool_size=20, max_overflow=40)
```

### Issue: Celery task timeout

**Solution**: Increase task time limits in `celeryconfig.py`
```python
task_time_limit = 60 * 60  # 60 minutes
task_soft_time_limit = 55 * 60  # 55 minutes
```

## Future Enhancements

1. **Multi-language Support**: Generate reports in Hindi, Gujarati
2. **Chart Generation**: Auto-generate performance charts
3. **Email Distribution**: Send reports to newsletter subscribers
4. **PDF Export**: Generate downloadable PDF versions
5. **Historical Comparison**: Compare with previous week/month
6. **Custom Sector Groups**: User-defined sector watchlists
7. **Real-time Updates**: Mid-week market update reports
8. **Enhanced AI Analysis**: Multi-model ensemble for higher confidence

## API Reference

### WeeklyReportGenerator Class

```python
class WeeklyReportGenerator:
    """Main weekly report generation engine"""

    def __init__(self, db_url: Optional[str] = None):
        """Initialize with optional database URL"""

    def generate_sector_weekly_report(self, sector_id: str) -> str:
        """
        Generate sector weekly report

        Args:
            sector_id: UUID of sector

        Returns:
            report_id: UUID of created report

        Raises:
            ValueError: If sector not found or data insufficient
        """

    def generate_macro_weekly_report(self) -> str:
        """
        Generate macro market weekly report

        Returns:
            report_id: UUID of created report

        Raises:
            ValueError: If data insufficient
        """

    def _fetch_sector_data(self, sector_id: str, days: int) -> Dict:
        """Fetch comprehensive sector data"""

    def _fetch_macro_data(self, days: int) -> Dict:
        """Fetch market-wide macro data"""

    def _call_claude_api(
        self,
        prompt_type: str,
        context: Dict,
        company_id: Optional[str] = None
    ) -> Tuple[Dict, Dict]:
        """Call Claude API with retry logic"""

    def _structure_sector_report(
        self,
        ai_response: Dict,
        data: Dict
    ) -> Dict:
        """Structure sector report into final JSON"""

    def _structure_macro_report(
        self,
        ai_response: Dict,
        data: Dict
    ) -> Dict:
        """Structure macro report into final JSON"""
```

### Celery Tasks

```python
@app.task(name='generate_sector_weekly_report')
def generate_sector_weekly_report_task(sector_id: str) -> Dict:
    """Generate sector weekly report (Celery task)"""

@app.task(name='generate_macro_weekly_report')
def generate_macro_weekly_report_task() -> Dict:
    """Generate macro weekly report (Celery task)"""

@app.task(name='generate_all_sector_reports')
def generate_all_sector_reports_task() -> Dict:
    """Generate reports for all sectors (batch task)"""
```

## Contributing

When extending the weekly report system:

1. **Add new data sources**: Update `_fetch_sector_data()` or `_fetch_macro_data()`
2. **Modify report schema**: Update `_structure_sector_report()` and prompts
3. **Add new report types**: Extend `WeeklyReportGenerator` class
4. **Update cost tracking**: Ensure all LLM calls log to `llm_usage`
5. **Add tests**: Update `test_weekly_report_generator.py`

## License

Internal use only - Alpha Signal platform.

## Support

For issues or questions:
- Check logs: `tail -f celery.log`
- Monitor costs: Query `llm_usage` table
- Review reports: Query `weekly_reports` table
- Contact: dev@alphasignal.com
