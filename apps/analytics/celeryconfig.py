"""
Celery Beat Schedule Configuration

Defines scheduled tasks for Alpha Signal analytics workers:
- Daily data ingestion (news, prices, financial results)
- Weekly report generation (sector and macro)
- Batch score recomputation
- Maintenance tasks
"""
from celery.schedules import crontab
import os

# Celery Beat Schedule
# All times are in UTC. IST = UTC + 5:30
beat_schedule = {
    # ═══════════════════════════════════════════
    # DAILY DATA INGESTION TASKS
    # ═══════════════════════════════════════════

    'ingest-news-every-hour': {
        'task': 'src.tasks.run_news_ingestion',
        'schedule': crontab(minute=15),  # Every hour at :15
    },

    'ingest-social-media-hourly': {
        'task': 'src.tasks.run_social_ingestion',
        'schedule': crontab(minute=30),  # Every hour at :30
    },

    'scan-financial-results-daily': {
        'task': 'src.tasks.run_financial_results_scan',
        'schedule': crontab(hour=10, minute=0),  # 10:00 UTC = 15:30 IST (After market close)
    },

    'bulk-deals-daily': {
        'task': 'src.tasks.run_daily_bulk_deals',
        'schedule': crontab(hour=11, minute=0),  # 11:00 UTC = 16:30 IST
    },

    'eod-price-finalization': {
        'task': 'src.tasks.run_eod_task',
        'schedule': crontab(hour=11, minute=30),  # 11:30 UTC = 17:00 IST
    },

    # ═══════════════════════════════════════════
    # DAILY SCORE COMPUTATION TASKS
    # ═══════════════════════════════════════════

    'recompute-all-company-scores': {
        'task': 'src.tasks.recompute_all_companies',
        'schedule': crontab(hour=22, minute=30),  # 22:30 UTC = 04:00 IST (Early morning)
    },

    # ═══════════════════════════════════════════
    # WEEKLY REPORT GENERATION TASKS
    # ═══════════════════════════════════════════

    'generate-sector-weekly-reports': {
        'task': 'generate_all_sector_reports',
        'schedule': crontab(day_of_week=6, hour=20, minute=30),  # Saturday 20:30 UTC = Sunday 02:00 IST
    },

    'generate-macro-weekly-report': {
        'task': 'generate_macro_weekly_report',
        'schedule': crontab(day_of_week=6, hour=22, minute=30),  # Saturday 22:30 UTC = Sunday 04:00 IST
    },

    # ═══════════════════════════════════════════
    # QUARTERLY TASKS
    # ═══════════════════════════════════════════

    'quarterly-shareholding-patterns': {
        'task': 'src.tasks.run_quarterly_shareholding',
        'schedule': crontab(day_of_month=15, hour=9, minute=0),  # 15th of every month, 09:00 UTC
    },

    # ═══════════════════════════════════════════
    # MAINTENANCE & CLEANUP TASKS
    # ═══════════════════════════════════════════

    'cleanup-dead-letter-queue': {
        'task': 'src.tasks.cleanup_dead_letter_queue',
        'schedule': crontab(day_of_week=0, hour=2, minute=0),  # Sunday 02:00 UTC = 07:30 IST
    },

    'cleanup-old-sentiment-data': {
        'task': 'src.tasks.cleanup_old_sentiment_data',
        'schedule': crontab(day_of_month=1, hour=3, minute=0),  # 1st of every month, 03:00 UTC
    },

    'monitor-pipeline-health': {
        'task': 'src.tasks.monitor_pipeline_health',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },

    # ═══════════════════════════════════════════
    # EVENT INGESTION ENGINE TASKS (TASK #78)
    # ═══════════════════════════════════════════

    'process-all-company-events-daily': {
        'task': 'src.tasks.batch_process_all_company_events',
        'schedule': crontab(hour=17, minute=30),  # 17:30 UTC = 23:00 IST (Daily at 11 PM IST)
    },

    'generate-weekly-summaries': {
        'task': 'src.tasks.batch_generate_weekly_summaries',
        'schedule': crontab(day_of_week=0, hour=0, minute=30),  # Sunday 00:30 UTC = 06:00 IST
    },

    # ═══════════════════════════════════════════
    # COMPANY PROFILE BUILDER TASKS (TASK #79)
    # ═══════════════════════════════════════════

    'check-and-update-profiles': {
        'task': 'src.tasks.check_and_update_profiles_task',
        'schedule': crontab(hour=18, minute=0),  # 18:00 UTC = 23:30 IST (Daily check for updates)
    },
}

# Celery Configuration
timezone = 'Asia/Kolkata'
enable_utc = True
task_serializer = 'json'
accept_content = ['json']
result_serializer = 'json'
task_track_started = True
task_time_limit = 30 * 60  # 30 minutes
task_soft_time_limit = 25 * 60  # 25 minutes
worker_prefetch_multiplier = 1
worker_max_tasks_per_child = 1000

# Broker Configuration
broker_url = os.getenv('CELERY_BROKER_URL', 'redis://:alphasignal_redis_dev@redis:6379/0')
result_backend = os.getenv('CELERY_RESULT_BACKEND', 'redis://:alphasignal_redis_dev@redis:6379/0')

# Result Backend Configuration
result_expires = 3600  # Results expire after 1 hour
result_extended = True

# Task Routes
task_routes = {
    'src.tasks.compute_all_scores': {'queue': 'scoring'},
    'src.tasks.compute_financial_ratios': {'queue': 'scoring'},
    'src.tasks.compute_technical_indicators': {'queue': 'technical'},
    'src.tasks.process_news_article': {'queue': 'nlp'},
    'src.tasks.generate_summary': {'queue': 'llm'},
    'src.tasks.regenerate_all_summaries': {'queue': 'llm'},
    'generate_sector_weekly_report': {'queue': 'llm'},
    'generate_macro_weekly_report': {'queue': 'llm'},
    'generate_all_sector_reports': {'queue': 'llm'},
    'src.tasks.run_news_ingestion': {'queue': 'ingestion'},
    'src.tasks.run_social_ingestion': {'queue': 'ingestion'},
    'src.tasks.run_financial_results_scan': {'queue': 'ingestion'},
    'src.tasks.run_eod_task': {'queue': 'ingestion'},
    # Event Ingestion Engine
    'src.tasks.process_new_events_task': {'queue': 'ingestion'},
    'src.tasks.generate_period_summary_task': {'queue': 'llm'},
    'src.tasks.batch_process_all_company_events': {'queue': 'ingestion'},
    'src.tasks.batch_generate_weekly_summaries': {'queue': 'llm'},
    # Company Profile Builder
    'src.tasks.build_company_profile_task': {'queue': 'llm'},
    'src.tasks.update_company_profile_section_task': {'queue': 'llm'},
    'src.tasks.check_and_update_profiles_task': {'queue': 'llm'},
    'src.tasks.batch_build_all_profiles_task': {'queue': 'llm'},
}

# Worker Configuration
worker_pool = 'prefork'
worker_concurrency = 4  # Adjust based on CPU cores

# Beat Schedule Export
beat_schedule_filename = '/tmp/celerybeat-schedule'

# Logging
worker_hijack_root_logger = False
worker_log_format = '[%(asctime)s: %(levelname)s/%(processName)s] %(message)s'
worker_task_log_format = '[%(asctime)s: %(levelname)s/%(processName)s][%(task_name)s(%(task_id)s)] %(message)s'
