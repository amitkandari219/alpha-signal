"""
Structured logging for Alpha Signal Analytics Engine
Uses structlog for consistent JSON logging across all Python services
"""

import logging
import sys
import os
from typing import Any, Dict, Optional
import structlog
from structlog.stdlib import LoggerFactory

# Determine if running in production
IS_PRODUCTION = os.getenv('NODE_ENV', 'development') == 'production'
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO' if IS_PRODUCTION else 'DEBUG')

def configure_logging():
    """Configure structlog with appropriate processors and settings"""

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, LOG_LEVEL.upper()),
    )

    # Define processors for structlog
    processors = [
        # Add log level
        structlog.stdlib.add_log_level,
        # Add logger name
        structlog.stdlib.add_logger_name,
        # Add timestamp
        structlog.processors.TimeStamper(fmt="iso"),
        # Add call site information (file, line, function)
        structlog.processors.CallsiteParameterAdder(
            parameters=[
                structlog.processors.CallsiteParameter.FILENAME,
                structlog.processors.CallsiteParameter.FUNC_NAME,
                structlog.processors.CallsiteParameter.LINENO,
            ]
        ),
        # Format stack info and exceptions
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        # Add service name
        structlog.processors.EventRenamer("message"),
    ]

    # In production, use JSON renderer. In development, use ConsoleRenderer
    if IS_PRODUCTION:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(
            structlog.dev.ConsoleRenderer(
                colors=True,
                exception_formatter=structlog.dev.plain_traceback,
            )
        )

    # Configure structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=LoggerFactory(),
        cache_logger_on_first_use=True,
    )


# Configure logging on module import
configure_logging()

# Create base logger with service context
logger = structlog.get_logger().bind(
    service="alpha-signal-analytics",
    environment=os.getenv('NODE_ENV', 'development'),
)


def get_logger(name: str = None) -> structlog.stdlib.BoundLogger:
    """
    Get a logger instance with optional module name

    Args:
        name: Module or component name

    Returns:
        Configured structlog logger
    """
    if name:
        return logger.bind(module=name)
    return logger


def log_celery_task(
    task_name: str,
    task_id: str,
    status: str,
    duration_ms: Optional[float] = None,
    error: Optional[Exception] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Log Celery task execution

    Args:
        task_name: Name of the Celery task
        task_id: Task UUID
        status: Task status (started, success, failure, retry)
        duration_ms: Task duration in milliseconds
        error: Exception if task failed
        metadata: Additional task metadata
    """
    log_data = {
        "task_name": task_name,
        "task_id": task_id,
        "task_status": status,
        "duration_ms": duration_ms,
    }

    if metadata:
        log_data["task_metadata"] = metadata

    if error:
        logger.error(
            "Celery task failed",
            **log_data,
            error=str(error),
            error_type=type(error).__name__,
            exc_info=True,
        )
    elif status == "started":
        logger.info("Celery task started", **log_data)
    elif status == "success":
        logger.info("Celery task completed", **log_data)
    elif status == "retry":
        logger.warning("Celery task retrying", **log_data)
    else:
        logger.info("Celery task event", **log_data)


def log_llm_api_call(
    provider: str,
    model: str,
    operation: str,
    duration_ms: float,
    tokens_used: Optional[int] = None,
    cost_usd: Optional[float] = None,
    company_id: Optional[str] = None,
    error: Optional[Exception] = None,
):
    """
    Log LLM API call for cost tracking and monitoring

    Args:
        provider: LLM provider (anthropic, openai, etc.)
        model: Model name (claude-3-5-sonnet-20241022, etc.)
        operation: Operation type (summarization, analysis, etc.)
        duration_ms: API call duration in milliseconds
        tokens_used: Total tokens used (input + output)
        cost_usd: Estimated cost in USD
        company_id: Company ID if applicable
        error: Exception if call failed
    """
    log_data = {
        "llm_provider": provider,
        "llm_model": model,
        "llm_operation": operation,
        "duration_ms": duration_ms,
        "tokens_used": tokens_used,
        "cost_usd": cost_usd,
        "company_id": company_id,
    }

    if error:
        logger.error(
            "LLM API call failed",
            **log_data,
            error=str(error),
            error_type=type(error).__name__,
        )
    else:
        logger.info("LLM API call completed", **log_data)


def log_data_pipeline(
    pipeline_name: str,
    status: str,
    records_processed: Optional[int] = None,
    duration_ms: Optional[float] = None,
    error: Optional[Exception] = None,
    metadata: Optional[Dict[str, Any]] = None,
):
    """
    Log data pipeline execution

    Args:
        pipeline_name: Name of the data pipeline
        status: Pipeline status (started, completed, failed)
        records_processed: Number of records processed
        duration_ms: Pipeline duration in milliseconds
        error: Exception if pipeline failed
        metadata: Additional pipeline metadata
    """
    log_data = {
        "pipeline_name": pipeline_name,
        "pipeline_status": status,
        "records_processed": records_processed,
        "duration_ms": duration_ms,
    }

    if metadata:
        log_data["pipeline_metadata"] = metadata

    if error:
        logger.error(
            "Data pipeline failed",
            **log_data,
            error=str(error),
            error_type=type(error).__name__,
            exc_info=True,
        )
    elif status == "started":
        logger.info("Data pipeline started", **log_data)
    else:
        logger.info("Data pipeline completed", **log_data)


def log_data_ingestion(
    source: str,
    data_type: str,
    records_fetched: int,
    records_stored: int,
    duration_ms: float,
    error: Optional[Exception] = None,
):
    """
    Log data ingestion from external sources

    Args:
        source: Data source (NSE, BSE, NewsAPI, etc.)
        data_type: Type of data (prices, financials, news, etc.)
        records_fetched: Number of records fetched from source
        records_stored: Number of records stored in database
        duration_ms: Ingestion duration in milliseconds
        error: Exception if ingestion failed
    """
    log_data = {
        "data_source": source,
        "data_type": data_type,
        "records_fetched": records_fetched,
        "records_stored": records_stored,
        "duration_ms": duration_ms,
    }

    if error:
        logger.error(
            "Data ingestion failed",
            **log_data,
            error=str(error),
            error_type=type(error).__name__,
        )
    else:
        logger.info("Data ingestion completed", **log_data)


def log_calculation(
    calculation_type: str,
    company_id: str,
    duration_ms: float,
    values_computed: Optional[int] = None,
    error: Optional[Exception] = None,
):
    """
    Log financial calculations and scoring

    Args:
        calculation_type: Type of calculation (ratios, scores, indicators)
        company_id: Company UUID
        duration_ms: Calculation duration in milliseconds
        values_computed: Number of values computed
        error: Exception if calculation failed
    """
    log_data = {
        "calculation_type": calculation_type,
        "company_id": company_id,
        "duration_ms": duration_ms,
        "values_computed": values_computed,
    }

    if error:
        logger.error(
            "Calculation failed",
            **log_data,
            error=str(error),
            error_type=type(error).__name__,
            exc_info=True,
        )
    else:
        logger.debug("Calculation completed", **log_data)


def log_db_operation(
    operation: str,
    model: str,
    duration_ms: float,
    records_affected: Optional[int] = None,
    error: Optional[Exception] = None,
):
    """
    Log database operations (for slow queries)

    Args:
        operation: Database operation (select, insert, update, delete)
        model: Database model/table name
        duration_ms: Operation duration in milliseconds
        records_affected: Number of records affected
        error: Exception if operation failed
    """
    log_data = {
        "db_operation": operation,
        "db_model": model,
        "duration_ms": duration_ms,
        "records_affected": records_affected,
    }

    # Log slow queries as warnings
    if duration_ms > 1000:  # Queries slower than 1 second
        logger.warning("Slow database operation", **log_data)
    elif error:
        logger.error(
            "Database operation failed",
            **log_data,
            error=str(error),
            error_type=type(error).__name__,
        )
    else:
        logger.debug("Database operation completed", **log_data)


def log_cache_operation(
    operation: str,
    key: str,
    duration_ms: Optional[float] = None,
    hit: Optional[bool] = None,
):
    """
    Log cache operations

    Args:
        operation: Cache operation (get, set, delete, flush)
        key: Cache key
        duration_ms: Operation duration in milliseconds
        hit: Whether cache hit occurred (for get operations)
    """
    log_data = {
        "cache_operation": operation,
        "cache_key": key,
        "duration_ms": duration_ms,
    }

    if operation == "get":
        log_data["cache_hit"] = hit

    logger.debug("Cache operation", **log_data)


def log_error(
    error: Exception,
    context: Optional[Dict[str, Any]] = None,
    operation: Optional[str] = None,
):
    """
    Log error with full context

    Args:
        error: Exception object
        context: Additional context information
        operation: Operation being performed when error occurred
    """
    log_data = {
        "error": str(error),
        "error_type": type(error).__name__,
        "operation": operation,
    }

    if context:
        log_data["error_context"] = context

    logger.error(
        f"Error occurred: {str(error)}",
        **log_data,
        exc_info=True,
    )


# Export commonly used functions
__all__ = [
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
