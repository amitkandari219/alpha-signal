"""
Analytics Utilities Package

Contains utility modules for analytics operations including:
- LLM cost tracking and monitoring
- Structured logging with structlog
"""

from .llm_cost_tracker import LLMCostTracker, log_llm_usage
from .logger import (
    logger,
    get_logger,
    log_celery_task,
    log_llm_api_call,
    log_data_pipeline,
    log_data_ingestion,
    log_calculation,
    log_db_operation,
    log_cache_operation,
    log_error,
)

__all__ = [
    'LLMCostTracker',
    'log_llm_usage',
    'logger',
    'get_logger',
    'log_celery_task',
    'log_llm_api_call',
    'log_data_pipeline',
    'log_data_ingestion',
    'log_calculation',
    'log_db_operation',
    'log_cache_operation',
    'log_error',
]
