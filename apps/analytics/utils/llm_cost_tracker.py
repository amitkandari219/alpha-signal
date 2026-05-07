"""
LLM Cost Tracking Utility

Tracks every Claude API call in the llm_usage table with:
- Token usage (input/output/total)
- Cost calculation based on Claude Sonnet pricing
- Task type categorization
- Duration tracking
- Company association

Cost rates for Claude Sonnet 4 (as of 2026):
- Input: $3 per million tokens
- Output: $15 per million tokens

Usage:
    from utils.llm_cost_tracker import log_llm_usage

    # Track an LLM call
    log_llm_usage(
        model="claude-sonnet-4-20250514",
        prompt_tokens=1500,
        completion_tokens=800,
        task_type="SUMMARY",
        company_id="uuid-here",
        duration_ms=2350
    )
"""

import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import create_engine, text
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class CostRates:
    """Claude API pricing per million tokens"""
    input_per_million: float = 3.0
    output_per_million: float = 15.0


class LLMCostTracker:
    """
    Tracks LLM API usage and costs

    Logs every Claude API call to the database with:
    - Token counts
    - Calculated costs
    - Task type
    - Company association
    - Execution time
    """

    def __init__(self, db_url: Optional[str] = None):
        """
        Initialize the cost tracker

        Args:
            db_url: Database connection URL (defaults to DATABASE_URL env var)
        """
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@localhost:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)
        self.rates = CostRates()

        # Get cost limit from environment
        self.daily_cost_limit = float(os.getenv('LLM_DAILY_COST_LIMIT_USD', '100.0'))

    def calculate_cost(
        self,
        prompt_tokens: int,
        completion_tokens: int
    ) -> Decimal:
        """
        Calculate cost in USD for a Claude API call

        Args:
            prompt_tokens: Number of input tokens
            completion_tokens: Number of output tokens

        Returns:
            Cost in USD (Decimal with 6 decimal places)
        """
        input_cost = (prompt_tokens / 1_000_000) * self.rates.input_per_million
        output_cost = (completion_tokens / 1_000_000) * self.rates.output_per_million
        total_cost = input_cost + output_cost

        return Decimal(str(round(total_cost, 6)))

    def log_usage(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        task_type: str,
        company_id: Optional[str] = None,
        duration_ms: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Log an LLM API call to the database

        Args:
            model: Model name (e.g., "claude-sonnet-4-20250514")
            prompt_tokens: Number of input tokens
            completion_tokens: Number of output tokens
            task_type: Type of task (SUMMARY, SENTIMENT, REPORT, OTHER)
            company_id: Optional company UUID
            duration_ms: Optional execution time in milliseconds
            metadata: Optional additional metadata

        Returns:
            UUID of the created log entry

        Raises:
            ValueError: If task_type is not valid
        """
        # Validate task type
        valid_types = ['SUMMARY', 'SENTIMENT', 'REPORT', 'WEEKLY_REPORT_GENERATION', 'OTHER']
        if task_type not in valid_types:
            raise ValueError(f"Invalid task_type. Must be one of: {valid_types}")

        # Calculate cost
        total_tokens = prompt_tokens + completion_tokens
        estimated_cost = self.calculate_cost(prompt_tokens, completion_tokens)

        # Insert into database
        with self.engine.begin() as conn:
            query = text("""
                INSERT INTO llm_usage (
                    id, model, prompt_tokens, completion_tokens, total_tokens,
                    estimated_cost_usd, task_type, company_id, duration_ms,
                    metadata, created_at
                ) VALUES (
                    gen_random_uuid(), :model, :prompt_tokens, :completion_tokens,
                    :total_tokens, :estimated_cost_usd, :task_type, :company_id,
                    :duration_ms, :metadata, :created_at
                )
                RETURNING id
            """)

            result = conn.execute(query, {
                'model': model,
                'prompt_tokens': prompt_tokens,
                'completion_tokens': completion_tokens,
                'total_tokens': total_tokens,
                'estimated_cost_usd': estimated_cost,
                'task_type': task_type,
                'company_id': company_id,
                'duration_ms': duration_ms,
                'metadata': metadata,
                'created_at': datetime.now()
            })

            usage_id = result.fetchone()[0]

            logger.info(
                f"LLM usage logged: {usage_id} | "
                f"model={model} | task={task_type} | "
                f"tokens={total_tokens} | cost=${estimated_cost}"
            )

            return str(usage_id)

    def get_daily_cost(self, date: Optional[datetime] = None) -> Decimal:
        """
        Get total LLM costs for a specific day

        Args:
            date: Date to query (defaults to today)

        Returns:
            Total cost in USD for the day
        """
        if date is None:
            date = datetime.now()

        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        with self.engine.connect() as conn:
            query = text("""
                SELECT COALESCE(SUM(estimated_cost_usd), 0) as total_cost
                FROM llm_usage
                WHERE created_at >= :start_date AND created_at < :end_date
            """)

            result = conn.execute(query, {
                'start_date': start_of_day,
                'end_date': end_of_day
            })

            return Decimal(str(result.fetchone()[0]))

    def get_weekly_cost(self) -> Decimal:
        """Get total LLM costs for the current week"""
        now = datetime.now()
        week_start = now - timedelta(days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

        with self.engine.connect() as conn:
            query = text("""
                SELECT COALESCE(SUM(estimated_cost_usd), 0) as total_cost
                FROM llm_usage
                WHERE created_at >= :week_start
            """)

            result = conn.execute(query, {'week_start': week_start})
            return Decimal(str(result.fetchone()[0]))

    def get_monthly_cost(self) -> Decimal:
        """Get total LLM costs for the current month"""
        now = datetime.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        with self.engine.connect() as conn:
            query = text("""
                SELECT COALESCE(SUM(estimated_cost_usd), 0) as total_cost
                FROM llm_usage
                WHERE created_at >= :month_start
            """)

            result = conn.execute(query, {'month_start': month_start})
            return Decimal(str(result.fetchone()[0]))

    def get_daily_call_count(self, date: Optional[datetime] = None) -> int:
        """Get total number of LLM calls for a specific day"""
        if date is None:
            date = datetime.now()

        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        with self.engine.connect() as conn:
            query = text("""
                SELECT COUNT(*) as call_count
                FROM llm_usage
                WHERE created_at >= :start_date AND created_at < :end_date
            """)

            result = conn.execute(query, {
                'start_date': start_of_day,
                'end_date': end_of_day
            })

            return result.fetchone()[0]

    def get_avg_cost_by_task_type(self, task_type: str) -> Decimal:
        """Get average cost per call for a specific task type"""
        with self.engine.connect() as conn:
            query = text("""
                SELECT COALESCE(AVG(estimated_cost_usd), 0) as avg_cost
                FROM llm_usage
                WHERE task_type = :task_type
            """)

            result = conn.execute(query, {'task_type': task_type})
            return Decimal(str(result.fetchone()[0]))

    def get_projected_monthly_cost(self) -> Decimal:
        """
        Calculate projected monthly cost based on current month's daily average

        Returns:
            Projected cost for the full month
        """
        now = datetime.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        days_elapsed = (now - month_start).days + 1

        # Days in current month
        if now.month == 12:
            next_month = now.replace(year=now.year + 1, month=1, day=1)
        else:
            next_month = now.replace(month=now.month + 1, day=1)
        days_in_month = (next_month - month_start).days

        # Get current month cost
        current_cost = self.get_monthly_cost()

        # Project for full month
        if days_elapsed > 0:
            daily_avg = current_cost / Decimal(str(days_elapsed))
            projected = daily_avg * Decimal(str(days_in_month))
            return projected

        return Decimal('0')

    def check_daily_limit(self) -> Dict[str, Any]:
        """
        Check if daily cost limit has been exceeded

        Returns:
            Dict with status and details
        """
        today_cost = self.get_daily_cost()
        limit = Decimal(str(self.daily_cost_limit))

        exceeded = today_cost >= limit
        percentage = (today_cost / limit * 100) if limit > 0 else 0

        return {
            'exceeded': exceeded,
            'current_cost': float(today_cost),
            'limit': float(limit),
            'percentage': float(percentage),
            'remaining': float(max(limit - today_cost, 0))
        }

    def get_dashboard_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive LLM cost statistics for admin dashboard

        Returns:
            Dict with all cost metrics
        """
        today_cost = self.get_daily_cost()
        weekly_cost = self.get_weekly_cost()
        monthly_cost = self.get_monthly_cost()
        calls_today = self.get_daily_call_count()
        avg_summary_cost = self.get_avg_cost_by_task_type('SUMMARY')
        projected_monthly = self.get_projected_monthly_cost()

        return {
            'today_usd': float(today_cost),
            'this_week_usd': float(weekly_cost),
            'this_month_usd': float(monthly_cost),
            'calls_today': calls_today,
            'avg_cost_per_summary_usd': float(avg_summary_cost),
            'projected_monthly_usd': float(projected_monthly)
        }


# ============================================
# CONVENIENCE FUNCTION
# ============================================

def log_llm_usage(
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    task_type: str = 'OTHER',
    company_id: Optional[str] = None,
    duration_ms: Optional[int] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Convenience function to log LLM usage

    Args:
        model: Model name (e.g., "claude-sonnet-4-20250514")
        prompt_tokens: Number of input tokens
        completion_tokens: Number of output tokens
        task_type: Type of task (SUMMARY, SENTIMENT, REPORT, OTHER)
        company_id: Optional company UUID
        duration_ms: Optional execution time in milliseconds
        metadata: Optional additional metadata

    Returns:
        UUID of the created log entry
    """
    tracker = LLMCostTracker()
    return tracker.log_usage(
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        task_type=task_type,
        company_id=company_id,
        duration_ms=duration_ms,
        metadata=metadata
    )
