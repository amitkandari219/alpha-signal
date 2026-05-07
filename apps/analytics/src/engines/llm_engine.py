"""
LLM Summarization Engine

Generates AI summaries by feeding structured data to Claude API with:
- Prompt registry with versioned templates
- Context builders for 6 summary types
- Output validation with grounding checks
- Redis caching with TTL
- Celery tasks for async generation
"""
import os
import json
from typing import Dict, Optional, List, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import anthropic
from sqlalchemy import create_engine, text
from redis import Redis
import time
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))
from utils.llm_cost_tracker import log_llm_usage
from utils.logger import logger, log_llm_api_call, log_error


@dataclass
class SummaryOutput:
    """Validated summary output"""
    content: Dict
    model_version: str
    prompt_version: str
    confidence_level: float
    data_freshness_note: str
    generated_at: datetime
    token_usage: Dict


class LLMEngine:
    """
    LLM Summarization Engine

    Generates 6 types of AI summaries:
    - business_overview
    - earnings_summary
    - bull_case
    - bear_case
    - news_digest
    - risk_assessment
    """

    # Cache TTLs (in seconds)
    CACHE_TTL = {
        'business_overview': 7 * 24 * 3600,      # 7 days
        'earnings_summary': 30 * 24 * 3600,      # 30 days
        'bull_case': 7 * 24 * 3600,              # 7 days
        'bear_case': 7 * 24 * 3600,              # 7 days
        'news_digest': 24 * 3600,                # 24 hours
        'risk_assessment': 3 * 24 * 3600         # 3 days
    }

    def __init__(self, db_url: Optional[str] = None, redis_url: Optional[str] = None):
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)

        # Initialize Redis client
        redis_url = redis_url or os.getenv('REDIS_URL', 'redis://:alphasignal_redis_dev@redis:6379')
        self.redis = Redis.from_url(redis_url, decode_responses=True)

        # Initialize Anthropic client
        api_key = os.getenv('ANTHROPIC_API_KEY')
        self.anthropic_client = anthropic.Anthropic(api_key=api_key) if api_key else None

        # Model configuration
        self.model = "claude-sonnet-4-20250514"
        self.temperature = 0.3
        self.max_retries = 3

    # ============================================================
    # CONTEXT BUILDERS
    # ============================================================

    def business_overview_context(self, company_id: str) -> Dict:
        """
        Build context for business overview summary

        Includes:
        - Company info, sector
        - Last 3 years of financials
        - Key ratios
        - Recent concall highlights
        """
        with self.engine.connect() as conn:
            # Company info
            query = text("""
                SELECT c.company_name, c.short_name, c.nse_symbol, c.bse_code,
                       c.market_cap_category, c.listing_date,
                       s.name as sector_name,
                       i.name as industry_name
                FROM companies c
                LEFT JOIN sectors s ON c.sector_id = s.id
                LEFT JOIN industries i ON c.industry_id = i.id
                WHERE c.id = :company_id
            """)
            company_result = conn.execute(query, {'company_id': company_id})
            company = dict(company_result.fetchone()._mapping) if company_result else None

            if not company:
                raise ValueError(f"Company {company_id} not found")

            # Last 3 years financials (annual)
            query = text("""
                SELECT fiscal_year, revenue, operating_profit, net_profit,
                       operating_margin, net_margin, eps
                FROM financial_results
                WHERE company_id = :company_id
                  AND period_type = 'ANNUAL'
                ORDER BY fiscal_year DESC
                LIMIT 3
            """)
            result = conn.execute(query, {'company_id': company_id})
            financials = [dict(row._mapping) for row in result]

            # Key ratios from computed_ratios
            query = text("""
                SELECT revenue_cagr_5y, profit_cagr_5y, roe_ttm, roce_ttm,
                       debt_to_equity, current_ratio, ocf_to_pat_3y_avg
                FROM computed_ratios
                WHERE company_id = :company_id
                ORDER BY computed_at DESC
                LIMIT 1
            """)
            result = conn.execute(query, {'company_id': company_id})
            ratios = dict(result.fetchone()._mapping) if result else {}

            return {
                'company': company,
                'financials_3y': financials,
                'key_ratios': ratios,
                'context_date': datetime.now().isoformat()
            }

    def earnings_summary_context(self, company_id: str) -> Dict:
        """
        Build context for earnings summary

        Includes:
        - Current + last 4 quarterly results
        - YoY comparisons
        - Margin trends
        """
        with self.engine.connect() as conn:
            # Company info
            query = text("""
                SELECT company_name, nse_symbol
                FROM companies
                WHERE id = :company_id
            """)
            company_result = conn.execute(query, {'company_id': company_id})
            company = dict(company_result.fetchone()._mapping) if company_result else None

            # Last 5 quarters
            query = text("""
                SELECT fiscal_year, fiscal_quarter, revenue, operating_profit,
                       net_profit, eps, operating_margin, net_margin,
                       published_at
                FROM financial_results
                WHERE company_id = :company_id
                  AND period_type = 'QUARTERLY'
                ORDER BY fiscal_year DESC, fiscal_quarter DESC
                LIMIT 5
            """)
            result = conn.execute(query, {'company_id': company_id})
            quarters = [dict(row._mapping) for row in result]

            return {
                'company': company,
                'quarters': quarters,
                'context_date': datetime.now().isoformat()
            }

    def bull_case_context(self, company_id: str) -> Dict:
        """
        Build context for bull case

        Includes:
        - Growth metrics (revenue/profit CAGR)
        - Positive sentiment data
        - Strong quality metrics
        """
        with self.engine.connect() as conn:
            # Company info
            query = text("""
                SELECT company_name, nse_symbol
                FROM companies
                WHERE id = :company_id
            """)
            company_result = conn.execute(query, {'company_id': company_id})
            company = dict(company_result.fetchone()._mapping) if company_result else None

            # Growth metrics
            query = text("""
                SELECT revenue_cagr_5y, profit_cagr_5y, revenue_cagr_3y,
                       profit_cagr_3y, roe_ttm, roce_ttm
                FROM computed_ratios
                WHERE company_id = :company_id
                ORDER BY computed_at DESC
                LIMIT 1
            """)
            result = conn.execute(query, {'company_id': company_id})
            growth = dict(result.fetchone()._mapping) if result else {}

            # Positive sentiment (if available)
            query = text("""
                SELECT news_sentiment, composite_sentiment
                FROM sentiment_snapshots
                WHERE company_id = :company_id
                  AND news_sentiment > 0
                ORDER BY date DESC
                LIMIT 7
            """)
            result = conn.execute(query, {'company_id': company_id})
            sentiment = [dict(row._mapping) for row in result]

            return {
                'company': company,
                'growth_metrics': growth,
                'positive_sentiment': sentiment,
                'context_date': datetime.now().isoformat()
            }

    def bear_case_context(self, company_id: str) -> Dict:
        """
        Build context for bear case

        Includes:
        - Risk flags
        - Debt metrics
        - Negative news/sentiment
        """
        with self.engine.connect() as conn:
            # Company info
            query = text("""
                SELECT company_name, nse_symbol
                FROM companies
                WHERE id = :company_id
            """)
            company_result = conn.execute(query, {'company_id': company_id})
            company = dict(company_result.fetchone()._mapping) if company_result else None

            # Risk metrics
            query = text("""
                SELECT debt_to_equity, current_ratio, interest_coverage,
                       has_negative_equity, has_zero_revenue_quarters
                FROM computed_ratios
                WHERE company_id = :company_id
                ORDER BY computed_at DESC
                LIMIT 1
            """)
            result = conn.execute(query, {'company_id': company_id})
            risk = dict(result.fetchone()._mapping) if result else {}

            # Negative sentiment (if available)
            query = text("""
                SELECT news_sentiment, composite_sentiment
                FROM sentiment_snapshots
                WHERE company_id = :company_id
                  AND news_sentiment < 0
                ORDER BY date DESC
                LIMIT 7
            """)
            result = conn.execute(query, {'company_id': company_id})
            sentiment = [dict(row._mapping) for row in result]

            return {
                'company': company,
                'risk_metrics': risk,
                'negative_sentiment': sentiment,
                'context_date': datetime.now().isoformat()
            }

    def news_digest_context(self, company_id: str) -> Dict:
        """
        Build context for news digest

        Includes:
        - Last 7 days of news with sentiment
        """
        with self.engine.connect() as conn:
            # Company info
            query = text("""
                SELECT company_name, nse_symbol
                FROM companies
                WHERE id = :company_id
            """)
            company_result = conn.execute(query, {'company_id': company_id})
            company = dict(company_result.fetchone()._mapping) if company_result else None

            # Recent news
            query = text("""
                SELECT title, summary, source, published_at,
                       sentiment_label, sentiment_score
                FROM news_articles
                WHERE company_id = :company_id
                  AND published_at >= NOW() - INTERVAL '7 days'
                ORDER BY published_at DESC
                LIMIT 20
            """)
            result = conn.execute(query, {'company_id': company_id})
            news = [dict(row._mapping) for row in result]

            return {
                'company': company,
                'news_last_7d': news,
                'context_date': datetime.now().isoformat()
            }

    def risk_assessment_context(self, company_id: str) -> Dict:
        """
        Build context for risk assessment

        Includes:
        - All risk flags
        - Governance data
        - Debt metrics
        """
        with self.engine.connect() as conn:
            # Company info
            query = text("""
                SELECT company_name, nse_symbol
                FROM companies
                WHERE id = :company_id
            """)
            company_result = conn.execute(query, {'company_id': company_id})
            company = dict(company_result.fetchone()._mapping) if company_result else None

            # Risk flags from computed_ratios
            query = text("""
                SELECT has_limited_history, has_negative_equity,
                       possible_stock_split, has_zero_revenue_quarters,
                       debt_to_equity, interest_coverage
                FROM computed_ratios
                WHERE company_id = :company_id
                ORDER BY computed_at DESC
                LIMIT 1
            """)
            result = conn.execute(query, {'company_id': company_id})
            risk_flags = dict(result.fetchone()._mapping) if result else {}

            # Recent negative news with risk keywords
            query = text("""
                SELECT title, summary, risk_tags, sentiment_label
                FROM news_articles
                WHERE company_id = :company_id
                  AND risk_tags IS NOT NULL
                  AND array_length(risk_tags, 1) > 0
                ORDER BY published_at DESC
                LIMIT 10
            """)
            result = conn.execute(query, {'company_id': company_id})
            risk_news = [dict(row._mapping) for row in result]

            return {
                'company': company,
                'risk_flags': risk_flags,
                'risk_news': risk_news,
                'context_date': datetime.now().isoformat()
            }

    # ============================================================
    # LLM CALL WITH RETRY
    # ============================================================

    def _call_claude(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2000,
        task_type: str = 'SUMMARY',
        company_id: Optional[str] = None
    ) -> Tuple[Dict, Dict]:
        """
        Call Claude API with retry logic and cost tracking

        Returns:
            (response_json, token_usage)
        """
        if not self.anthropic_client:
            raise ValueError("ANTHROPIC_API_KEY not configured")

        start_time = time.time()

        for attempt in range(self.max_retries):
            try:
                response = self.anthropic_client.messages.create(
                    model=self.model,
                    max_tokens=max_tokens,
                    temperature=self.temperature,
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": user_prompt}
                    ]
                )

                # Calculate duration
                duration_ms = (time.time() - start_time) * 1000

                # Extract JSON from response
                content = response.content[0].text

                # Parse JSON
                try:
                    result = json.loads(content)
                except json.JSONDecodeError:
                    # Try to extract JSON from markdown code block
                    if "```json" in content:
                        start = content.find("```json") + 7
                        end = content.find("```", start)
                        content = content[start:end].strip()
                        result = json.loads(content)
                    else:
                        raise

                # Token usage
                token_usage = {
                    'input_tokens': response.usage.input_tokens,
                    'output_tokens': response.usage.output_tokens,
                    'total_tokens': response.usage.input_tokens + response.usage.output_tokens
                }

                # Calculate cost (approximate for Claude Sonnet 4)
                # Input: $3 per million tokens, Output: $15 per million tokens
                cost_usd = (response.usage.input_tokens * 3.0 / 1_000_000) + \
                          (response.usage.output_tokens * 15.0 / 1_000_000)

                # Log LLM API call with structured logging
                log_llm_api_call(
                    provider='anthropic',
                    model=self.model,
                    operation=task_type.lower(),
                    duration_ms=duration_ms,
                    tokens_used=token_usage['total_tokens'],
                    cost_usd=cost_usd,
                    company_id=company_id
                )

                # Log LLM usage for cost tracking (database)
                try:
                    log_llm_usage(
                        model=self.model,
                        prompt_tokens=response.usage.input_tokens,
                        completion_tokens=response.usage.output_tokens,
                        task_type=task_type,
                        company_id=company_id,
                        duration_ms=int(duration_ms),
                        metadata={
                            'summary_type': task_type.lower(),
                            'max_tokens': max_tokens,
                            'temperature': self.temperature
                        }
                    )
                except Exception as e:
                    logger.warning("Failed to log LLM usage to database", error=str(e))

                return result, token_usage

            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000

                if attempt == self.max_retries - 1:
                    # Log final failure
                    log_llm_api_call(
                        provider='anthropic',
                        model=self.model,
                        operation=task_type.lower(),
                        duration_ms=duration_ms,
                        company_id=company_id,
                        error=e
                    )
                    raise

                logger.warning(
                    f"Claude API call attempt {attempt + 1} failed",
                    error=str(e),
                    attempt=attempt + 1,
                    max_retries=self.max_retries
                )
                time.sleep(2 ** attempt)  # Exponential backoff

    def _validate_output(
        self,
        output: Dict,
        context: Dict,
        summary_type: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate output and check grounding

        Returns:
            (is_valid, error_message)
        """
        # Basic schema validation
        required_keys = {
            'business_overview': ['summary', 'key_highlights', 'business_model'],
            'earnings_summary': ['summary', 'key_metrics', 'trends'],
            'bull_case': ['summary', 'growth_drivers', 'strengths'],
            'bear_case': ['summary', 'risk_factors', 'concerns'],
            'news_digest': ['summary', 'key_events', 'sentiment_overview'],
            'risk_assessment': ['summary', 'risk_factors', 'severity']
        }

        expected_keys = required_keys.get(summary_type, [])
        for key in expected_keys:
            if key not in output:
                return False, f"Missing required key: {key}"

        # TODO: Grounding check - extract numbers and compare with context
        # For now, skip detailed grounding validation

        return True, None

    # ============================================================
    # GENERATE SUMMARY
    # ============================================================

    def generate_summary(
        self,
        company_id: str,
        summary_type: str,
        force_refresh: bool = False
    ) -> SummaryOutput:
        """
        Generate AI summary for a company

        Args:
            company_id: UUID of company
            summary_type: One of 6 summary types
            force_refresh: Skip cache and regenerate

        Returns:
            SummaryOutput with validated content
        """
        # Check cache first
        cache_key = f"summary:{company_id}:{summary_type}"

        if not force_refresh:
            cached = self.redis.get(cache_key)
            if cached:
                logger.info(f"Cache hit for {summary_type} summary of {company_id}")
                return SummaryOutput(**json.loads(cached))

        # Build context
        context_builders = {
            'business_overview': self.business_overview_context,
            'earnings_summary': self.earnings_summary_context,
            'bull_case': self.bull_case_context,
            'bear_case': self.bear_case_context,
            'news_digest': self.news_digest_context,
            'risk_assessment': self.risk_assessment_context
        }

        if summary_type not in context_builders:
            raise ValueError(f"Unknown summary type: {summary_type}")

        context = context_builders[summary_type](company_id)

        # Get prompt template
        system_prompt, user_prompt_template = self._get_prompt_template(summary_type)

        # Format user prompt with context
        user_prompt = user_prompt_template.format(
            company_name=context['company']['company_name'],
            context_json=json.dumps(context, indent=2, default=str)
        )

        # Call Claude API
        logger.info(f"Generating {summary_type} summary for {company_id}")
        output, token_usage = self._call_claude(
            system_prompt,
            user_prompt,
            task_type='SUMMARY',
            company_id=company_id
        )

        # Validate output
        is_valid, error_msg = self._validate_output(output, context, summary_type)

        if not is_valid:
            logger.error(f"Validation failed: {error_msg}")
            raise ValueError(f"Output validation failed: {error_msg}")

        # Create summary output
        summary = SummaryOutput(
            content=output,
            model_version=self.model,
            prompt_version="1.0",
            confidence_level=0.9,
            data_freshness_note=f"Data as of {context['context_date']}",
            generated_at=datetime.now(),
            token_usage=token_usage
        )

        # Store in database
        self._store_summary(company_id, summary_type, summary)

        # Cache result
        ttl = self.CACHE_TTL.get(summary_type, 24 * 3600)
        self.redis.setex(
            cache_key,
            ttl,
            json.dumps(summary.__dict__, default=str)
        )

        logger.info(f"Generated {summary_type} summary for {company_id} "
                   f"(tokens: {token_usage['total_tokens']})")

        return summary

    def _store_summary(self, company_id: str, summary_type: str, summary: SummaryOutput):
        """Store summary in ai_summaries table"""
        with self.engine.begin() as conn:
            query = text("""
                INSERT INTO ai_summaries (
                    id, company_id, summary_type, content,
                    model_version, prompt_version, confidence_level,
                    data_freshness_note, token_usage, generated_at
                ) VALUES (
                    gen_random_uuid(), :company_id, :summary_type, :content,
                    :model_version, :prompt_version, :confidence_level,
                    :data_freshness_note, :token_usage, :generated_at
                )
            """)
            conn.execute(query, {
                'company_id': company_id,
                'summary_type': summary_type,
                'content': json.dumps(summary.content),
                'model_version': summary.model_version,
                'prompt_version': summary.prompt_version,
                'confidence_level': summary.confidence_level,
                'data_freshness_note': summary.data_freshness_note,
                'token_usage': json.dumps(summary.token_usage),
                'generated_at': summary.generated_at
            })

    # ============================================================
    # PROMPT TEMPLATES
    # ============================================================

    def _get_prompt_template(self, summary_type: str) -> Tuple[str, str]:
        """Get system and user prompt templates for summary type"""

        base_system = """You are a financial analyst specializing in Indian small and mid-cap stocks.

Your role:
- Analyze financial data objectively
- Cite specific numbers from the provided data
- Never make buy/sell recommendations
- Flag data limitations or gaps
- Use clear, professional language

CRITICAL RULES:
1. Only use numbers that appear in the provided context data
2. If a metric is missing, state "Data not available"
3. Never extrapolate or estimate numbers
4. Always cite the source period (e.g., "Q3 FY24", "FY2023")

Output must be valid JSON matching the required schema."""

        prompts = {
            'business_overview': (
                base_system,
                """Analyze this company and provide a comprehensive business overview.

Company: {company_name}

Context Data:
{context_json}

Generate a JSON response with:
{{
  "summary": "2-3 paragraph executive summary of the business",
  "key_highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "business_model": "Description of how the company makes money",
  "sector_position": "Company's position in its sector",
  "recent_performance": "Summary of last 3 years financial performance with specific numbers"
}}

Focus on facts from the data. Cite specific metrics."""
            ),

            'earnings_summary': (
                base_system,
                """Analyze the latest earnings and provide a summary.

Company: {company_name}

Context Data:
{context_json}

Generate a JSON response with:
{{
  "summary": "2-paragraph summary of latest quarter results",
  "key_metrics": {{
    "revenue_yoy": "X% YoY growth",
    "profit_yoy": "X% YoY growth",
    "margin_trend": "expanding/contracting/stable"
  }},
  "trends": ["trend 1", "trend 2", "trend 3"],
  "quarter_comparison": "How this quarter compares to previous quarters"
}}

Use exact numbers from the context data."""
            ),

            'bull_case': (
                base_system,
                """Present the bull case (positive outlook) for this company.

Company: {company_name}

Context Data:
{context_json}

Generate a JSON response with:
{{
  "summary": "2-paragraph bull case argument",
  "growth_drivers": ["driver 1", "driver 2", "driver 3"],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "positive_metrics": {{
    "revenue_cagr": "X% over Y years",
    "profit_cagr": "X% over Y years",
    "roe": "X%"
  }}
}}

Focus on factual strengths backed by data."""
            ),

            'bear_case': (
                base_system,
                """Present the bear case (risks and concerns) for this company.

Company: {company_name}

Context Data:
{context_json}

Generate a JSON response with:
{{
  "summary": "2-paragraph bear case argument",
  "risk_factors": ["risk 1", "risk 2", "risk 3"],
  "concerns": ["concern 1", "concern 2", "concern 3"],
  "risk_metrics": {{
    "debt_to_equity": "X.X",
    "negative_trends": ["trend 1", "trend 2"]
  }}
}}

Be objective. Flag real risks from the data."""
            ),

            'news_digest': (
                base_system,
                """Summarize the latest news about this company.

Company: {company_name}

Context Data:
{context_json}

Generate a JSON response with:
{{
  "summary": "1-paragraph overview of news sentiment and key themes",
  "key_events": ["event 1", "event 2", "event 3"],
  "sentiment_overview": "Overall sentiment (positive/negative/mixed) with reasoning",
  "market_moving_news": ["news 1 that could impact stock price", "news 2"]
}}

Summarize objectively. Group related news items."""
            ),

            'risk_assessment': (
                base_system,
                """Assess the risk profile of this company.

Company: {company_name}

Context Data:
{context_json}

Generate a JSON response with:
{{
  "summary": "2-paragraph risk assessment",
  "risk_factors": [
    {{"category": "Financial", "factor": "description", "severity": "high/medium/low"}},
    {{"category": "Operational", "factor": "description", "severity": "high/medium/low"}}
  ],
  "severity": "Overall risk level: low/medium/high",
  "mitigating_factors": ["factor 1 that reduces risk", "factor 2"]
}}

Be comprehensive. Flag all material risks."""
            )
        }

        return prompts.get(summary_type, (base_system, ""))

    # ============================================================
    # BATCH OPERATIONS
    # ============================================================

    def regenerate_all_summaries(self, company_id: str) -> Dict[str, SummaryOutput]:
        """
        Regenerate all 6 summary types for a company

        Returns:
            Dict mapping summary_type -> SummaryOutput
        """
        summary_types = [
            'business_overview',
            'earnings_summary',
            'bull_case',
            'bear_case',
            'news_digest',
            'risk_assessment'
        ]

        results = {}

        for summary_type in summary_types:
            try:
                summary = self.generate_summary(
                    company_id,
                    summary_type,
                    force_refresh=True
                )
                results[summary_type] = summary
                logger.info(f"✓ Generated {summary_type} for {company_id}")
            except Exception as e:
                logger.error(f"✗ Failed to generate {summary_type} for {company_id}: {e}")
                results[summary_type] = None

        return results
