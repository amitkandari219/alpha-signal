"""
Celery Beat Scheduler Configuration for Alpha Signal

Defines the schedule for all data ingestion pipelines:
- price_ingestion: EOD task at 16:00 IST (finalize daily candles)
- financial_results_ingestion: Daily scan at 22:00 IST
- news_ingestion: Every 15 minutes
- social_ingestion: Every 30 minutes
- shareholding_ingestion: Quarterly patterns + daily bulk deals

Note: WebSocket for price_ingestion runs continuously (separate long-running process)
"""
from celery.schedules import crontab
from src.celery_app import app


# Celery Beat schedule configuration
app.conf.beat_schedule = {
    # ═══════════════════════════════════════════
    # DATA INGESTION PIPELINES
    # ═══════════════════════════════════════════

    # Pipeline 1: Price Ingestion - EOD Task
    # Runs at 16:00 IST (10:30 UTC) to finalize daily candles
    'price-eod-task': {
        'task': 'src.tasks.run_eod_task',
        'schedule': crontab(hour=10, minute=30),  # 16:00 IST = 10:30 UTC
        'options': {
            'expires': 3600,  # Task expires after 1 hour if not executed
        }
    },

    # Pipeline 2: Financial Results Ingestion
    # Runs daily at 22:00 IST (16:30 UTC) to scan for new filings
    'financial-results-daily-scan': {
        'task': 'src.tasks.run_financial_results_scan',
        'schedule': crontab(hour=16, minute=30),  # 22:00 IST = 16:30 UTC
        'options': {
            'expires': 7200,  # Task expires after 2 hours
        }
    },

    # Pipeline 3: News Ingestion
    # Runs every 15 minutes to fetch from NewsAPI and RSS feeds
    'news-ingestion-every-15-min': {
        'task': 'src.tasks.run_news_ingestion',
        'schedule': 900.0,  # 15 minutes in seconds
        'options': {
            'expires': 600,  # Task expires after 10 minutes
        }
    },

    # Pipeline 4: Social Media Ingestion
    # Runs every 30 minutes to fetch from Twitter and Reddit
    'social-ingestion-every-30-min': {
        'task': 'src.tasks.run_social_ingestion',
        'schedule': 1800.0,  # 30 minutes in seconds
        'options': {
            'expires': 1200,  # Task expires after 20 minutes
        }
    },

    # Pipeline 5a: Shareholding Patterns (Quarterly)
    # Runs on the 15th of Jan, Apr, Jul, Oct (quarter end months) at 10:00 IST
    'shareholding-quarterly-patterns': {
        'task': 'src.tasks.run_quarterly_shareholding',
        'schedule': crontab(
            hour=4,  # 10:00 IST = 04:30 UTC
            minute=30,
            day_of_month=15,
            month_of_year='1,4,7,10'  # Quarter end months
        ),
        'options': {
            'expires': 43200,  # Task expires after 12 hours
        }
    },

    # Pipeline 5b: Bulk/Block Deals (Daily)
    # Runs daily at 18:00 IST (12:30 UTC) to fetch bulk and block deals
    'bulk-block-deals-daily': {
        'task': 'src.tasks.run_daily_bulk_deals',
        'schedule': crontab(hour=12, minute=30),  # 18:00 IST = 12:30 UTC
        'options': {
            'expires': 3600,  # Task expires after 1 hour
        }
    },

    # ═══════════════════════════════════════════
    # NLP PROCESSING & AI SUMMARIES
    # ═══════════════════════════════════════════

    # Batch regenerate all AI summaries for active companies
    # Runs daily at 04:00 IST (22:30 UTC previous day)
    'regenerate-ai-summaries-daily': {
        'task': 'src.tasks.batch_regenerate_summaries',
        'schedule': crontab(hour=22, minute=30),  # 04:00 IST = 22:30 UTC
        'options': {
            'expires': 14400,  # Task expires after 4 hours
        }
    },

    # ═══════════════════════════════════════════
    # SCORING ENGINE
    # ═══════════════════════════════════════════

    # Recompute all scores for all companies
    # Runs daily at 05:00 IST (23:30 UTC previous day)
    'recompute-all-scores-daily': {
        'task': 'src.tasks.batch_recompute_scores',
        'schedule': crontab(hour=23, minute=30),  # 05:00 IST = 23:30 UTC
        'options': {
            'expires': 14400,  # Task expires after 4 hours
        }
    },

    # ═══════════════════════════════════════════
    # MAINTENANCE & CLEANUP
    # ═══════════════════════════════════════════

    # Clean up old processed items from dead-letter queue
    # Runs weekly on Sunday at 03:00 IST
    'cleanup-dead-letter-queue': {
        'task': 'src.tasks.cleanup_dead_letter_queue',
        'schedule': crontab(hour=21, minute=30, day_of_week=0),  # Sunday 03:00 IST = 21:30 UTC
        'options': {
            'expires': 7200,  # Task expires after 2 hours
        }
    },

    # Clean up old sentiment snapshots (>90 days)
    # Runs monthly on the 1st at 02:00 IST
    'cleanup-old-sentiment-snapshots': {
        'task': 'src.tasks.cleanup_old_sentiment_data',
        'schedule': crontab(hour=20, minute=30, day_of_month=1),  # 1st of month, 02:00 IST = 20:30 UTC
        'options': {
            'expires': 7200,  # Task expires after 2 hours
        }
    },

    # ═══════════════════════════════════════════
    # MONITORING & HEALTH CHECKS
    # ═══════════════════════════════════════════

    # Monitor pipeline health and data freshness
    # Runs every hour
    'monitor-pipeline-health': {
        'task': 'src.tasks.monitor_pipeline_health',
        'schedule': 3600.0,  # 1 hour in seconds
        'options': {
            'expires': 1800,  # Task expires after 30 minutes
        }
    },
}

# Celery Beat timezone configuration
# All times are in UTC, but we use IST for business logic
app.conf.timezone = 'UTC'

# Beat scheduler backend (use database for distributed setup)
app.conf.beat_scheduler = 'django_celery_beat.schedulers:DatabaseScheduler'

# Task result expiration (7 days)
app.conf.result_expires = 7 * 24 * 3600

# Task soft/hard time limits
app.conf.task_soft_time_limit = 3600  # 1 hour soft limit
app.conf.task_time_limit = 7200  # 2 hours hard limit

# Task serialization
app.conf.task_serializer = 'json'
app.conf.result_serializer = 'json'
app.conf.accept_content = ['json']

# Worker prefetch multiplier (how many tasks each worker prefetches)
app.conf.worker_prefetch_multiplier = 4

# Enable UTC timestamps
app.conf.enable_utc = True


# ═══════════════════════════════════════════
# TASK ROUTING
# Route different task types to different queues
# ═══════════════════════════════════════════

app.conf.task_routes = {
    # Data ingestion pipelines → 'ingestion' queue
    'src.tasks.run_news_ingestion': {'queue': 'ingestion'},
    'src.tasks.run_social_ingestion': {'queue': 'ingestion'},
    'src.tasks.run_financial_results_scan': {'queue': 'ingestion'},
    'src.tasks.run_quarterly_shareholding': {'queue': 'ingestion'},
    'src.tasks.run_daily_bulk_deals': {'queue': 'ingestion'},
    'src.tasks.run_eod_task': {'queue': 'ingestion'},

    # NLP processing → 'nlp' queue (CPU-intensive)
    'src.tasks.process_news_article': {'queue': 'nlp'},
    'src.tasks.batch_process_articles': {'queue': 'nlp'},
    'src.tasks.update_sentiment_snapshot': {'queue': 'nlp'},

    # AI summaries (LLM calls) → 'llm' queue
    'src.tasks.generate_summary': {'queue': 'llm'},
    'src.tasks.regenerate_all_summaries': {'queue': 'llm'},
    'src.tasks.batch_regenerate_summaries': {'queue': 'llm'},

    # Scoring engine → 'scoring' queue
    'src.tasks.compute_all_scores': {'queue': 'scoring'},
    'src.tasks.batch_recompute_scores': {'queue': 'scoring'},
    'src.tasks.recompute_all_companies': {'queue': 'scoring'},

    # Technical indicators → 'indicators' queue
    'src.tasks.compute_technical_indicators': {'queue': 'indicators'},
    'src.tasks.compute_financial_ratios': {'queue': 'indicators'},

    # Maintenance tasks → 'maintenance' queue
    'src.tasks.cleanup_dead_letter_queue': {'queue': 'maintenance'},
    'src.tasks.cleanup_old_sentiment_data': {'queue': 'maintenance'},
    'src.tasks.monitor_pipeline_health': {'queue': 'maintenance'},

    # Default → 'celery' queue
    # All other tasks go to the default queue
}


# ═══════════════════════════════════════════
# MONITORING & LOGGING
# ═══════════════════════════════════════════

# Send task events for monitoring (Flower, Prometheus)
app.conf.task_send_sent_event = True
app.conf.worker_send_task_events = True

# Track started tasks
app.conf.task_track_started = True

# Ignore task results for fire-and-forget tasks
app.conf.task_ignore_result = False

# Enable task result backend
app.conf.result_backend = 'redis://redis:6379/1'

# Task result compression
app.conf.result_compression = 'gzip'

# ═══════════════════════════════════════════
# RETRY POLICIES
# Default retry policy for tasks
# ═══════════════════════════════════════════

app.conf.task_annotations = {
    '*': {
        'rate_limit': '1000/m',  # Max 1000 tasks per minute (global rate limit)
    },
    'src.tasks.run_news_ingestion': {
        'rate_limit': '4/m',  # NewsAPI rate limit awareness (4 calls per minute)
    },
    'src.tasks.run_social_ingestion': {
        'rate_limit': '2/m',  # Social API rate limits
    },
    'src.tasks.generate_summary': {
        'rate_limit': '30/m',  # Claude API rate limit (30 requests per minute)
    },
}


if __name__ == '__main__':
    """
    Run Celery Beat scheduler

    Usage:
        python scheduler.py

    Or use Celery command directly:
        celery -A src.celery_app beat --loglevel=info
    """
    app.start()
