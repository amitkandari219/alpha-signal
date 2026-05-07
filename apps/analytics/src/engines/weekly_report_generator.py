"""
Weekly Report Generation Engine

Generates AI-powered weekly reports with Claude API integration:
- Sector-specific weekly reports
- Macro market weekly reports
- Comprehensive data aggregation from multiple sources
- Structured JSON output with professional financial analysis
- Cost tracking and error handling

Generated reports are stored in weekly_reports and report_sections tables.
Scheduled via Celery Beat every Sunday morning.
"""

import os
import json
import time
import re
from typing import Dict, Optional, List, Any, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
from dataclasses import dataclass
import anthropic
from sqlalchemy import create_engine, text
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))
from utils.llm_cost_tracker import LLMCostTracker
from utils.logger import logger, log_llm_api_call, log_error


@dataclass
class ReportMetadata:
    """Metadata for generated report"""
    report_id: str
    model_version: str
    prompt_version: str
    token_usage: Dict[str, int]
    cost_usd: Decimal
    generated_at: datetime
    data_period: Tuple[datetime, datetime]


class WeeklyReportGenerator:
    """
    Weekly Report Generation Engine

    Generates two types of AI-powered weekly reports:
    1. Sector Weekly Reports - Deep dive into specific sector performance
    2. Macro Weekly Reports - Overall market and economic overview

    Features:
    - Comprehensive data aggregation from 7+ data sources
    - Claude API integration for natural language generation
    - Structured JSON output matching database schema
    - Cost tracking and retry logic
    - Professional financial analyst tone
    """

    # Model configuration
    MODEL = "claude-sonnet-4-20250514"
    TEMPERATURE = 0.3
    MAX_TOKENS = 4000
    MAX_RETRIES = 3

    # Analysis period (days)
    ANALYSIS_PERIOD_DAYS = 7

    def __init__(self, db_url: Optional[str] = None):
        """
        Initialize the Weekly Report Generator

        Args:
            db_url: Database connection URL (defaults to DATABASE_URL env var)
        """
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@localhost:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)

        # Initialize Anthropic client
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")
        self.anthropic_client = anthropic.Anthropic(api_key=api_key)

        # Initialize cost tracker
        self.cost_tracker = LLMCostTracker(db_url=db_url)

        logger.info("Weekly Report Generator initialized", model=self.MODEL)

    # ============================================================
    # SECTOR REPORT GENERATION
    # ============================================================

    def generate_sector_weekly_report(self, sector_id: str) -> str:
        """
        Generate sector-specific weekly report

        Args:
            sector_id: UUID of the sector

        Returns:
            UUID of the created weekly report

        Raises:
            ValueError: If sector not found or data insufficient
        """
        logger.info("Starting sector weekly report generation", sector_id=sector_id)

        try:
            # Fetch sector data
            sector_data = self._fetch_sector_data(sector_id, self.ANALYSIS_PERIOD_DAYS)

            if not sector_data['sector']:
                raise ValueError(f"Sector {sector_id} not found")

            sector_name = sector_data['sector']['name']
            logger.info(f"Generating weekly report for sector: {sector_name}", sector_id=sector_id)

            # Call Claude API to generate report content
            report_content, token_usage = self._call_claude_api(
                prompt_type='sector_weekly',
                context=sector_data,
                company_id=None
            )

            # Structure report content
            structured_report = self._structure_sector_report(report_content, sector_data)

            # Generate metadata
            fiscal_week, fiscal_year = self._get_fiscal_week_year()
            slug = self._generate_slug(f"{sector_name} Weekly Report Week {fiscal_week} {fiscal_year}")

            # Store report in database
            report_id = self._store_weekly_report(
                report_type='SECTOR_WEEKLY',
                sector_id=sector_id,
                title=f"{sector_name} - Weekly Analysis",
                slug=slug,
                summary=structured_report.get('ai_outlook', {}).get('paragraphs', [''])[0][:500],
                full_content=structured_report,
                fiscal_week=fiscal_week,
                fiscal_year=fiscal_year
            )

            # Store report sections
            self._store_sector_report_sections(report_id, structured_report)

            # Calculate cost
            cost_usd = self.cost_tracker.calculate_cost(
                token_usage['input_tokens'],
                token_usage['output_tokens']
            )

            logger.info(
                "Sector weekly report generated successfully",
                report_id=report_id,
                sector=sector_name,
                tokens=token_usage['total_tokens'],
                cost_usd=float(cost_usd)
            )

            return report_id

        except Exception as e:
            log_error(
                error_type='sector_report_generation_failed',
                error_message=str(e),
                context={'sector_id': sector_id}
            )
            raise

    def _fetch_sector_data(self, sector_id: str, days: int) -> Dict[str, Any]:
        """
        Fetch comprehensive sector data for report generation

        Args:
            sector_id: UUID of the sector
            days: Number of days to look back

        Returns:
            Dictionary with all sector data
        """
        with self.engine.connect() as conn:
            # Date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)

            # 1. Sector info
            query = text("""
                SELECT id, name, slug
                FROM sectors
                WHERE id = :sector_id
            """)
            result = conn.execute(query, {'sector_id': sector_id})
            sector = dict(result.fetchone()._mapping) if result else None

            if not sector:
                return {'sector': None}

            # 2. Get all companies in sector
            query = text("""
                SELECT id, company_name, nse_symbol
                FROM companies
                WHERE sector_id = :sector_id
                  AND is_active = true
                ORDER BY market_cap DESC
                LIMIT 100
            """)
            result = conn.execute(query, {'sector_id': sector_id})
            companies = [dict(row._mapping) for row in result]
            company_ids = [c['id'] for c in companies]

            if not company_ids:
                logger.warning("No companies found in sector", sector_id=sector_id)
                return {'sector': sector, 'companies': []}

            # 3. Price data for all stocks (past 7 days)
            query = text("""
                SELECT company_id, date, close, volume
                FROM daily_prices
                WHERE company_id = ANY(:company_ids)
                  AND date >= :start_date
                  AND date <= :end_date
                ORDER BY date DESC
            """)
            result = conn.execute(query, {
                'company_ids': company_ids,
                'start_date': start_date,
                'end_date': end_date
            })
            prices = [dict(row._mapping) for row in result]

            # 4. Calculate sector performance
            sector_performance = self._calculate_sector_performance(prices, company_ids, days)

            # 5. News articles for sector (past 7 days)
            query = text("""
                SELECT title, summary, source, published_at,
                       sentiment_label, sentiment_score, risk_tags
                FROM news_articles
                WHERE sector_id = :sector_id
                  AND published_at >= :start_date
                  AND published_at <= :end_date
                ORDER BY published_at DESC
                LIMIT 50
            """)
            result = conn.execute(query, {
                'sector_id': sector_id,
                'start_date': start_date,
                'end_date': end_date
            })
            news = [dict(row._mapping) for row in result]

            # 6. Sentiment snapshots for sector trend
            query = text("""
                SELECT company_id, date, news_sentiment, composite_sentiment
                FROM sentiment_snapshots
                WHERE company_id = ANY(:company_ids)
                  AND date >= :start_date
                  AND date <= :end_date
                ORDER BY date DESC
            """)
            result = conn.execute(query, {
                'company_ids': company_ids,
                'start_date': start_date,
                'end_date': end_date
            })
            sentiment = [dict(row._mapping) for row in result]

            # 7. Shareholding patterns (latest FII/DII changes)
            query = text("""
                SELECT company_id, date, fii_holding_pct, dii_holding_pct,
                       promoter_holding_pct
                FROM shareholding_patterns
                WHERE company_id = ANY(:company_ids)
                ORDER BY date DESC
                LIMIT 100
            """)
            result = conn.execute(query, {'company_ids': company_ids})
            shareholding = [dict(row._mapping) for row in result]

            # 8. Composite scores for top-rated stocks
            query = text("""
                SELECT cs.company_id, cs.quality_score, cs.growth_score,
                       cs.valuation_score, cs.composite_score,
                       c.company_name, c.nse_symbol
                FROM composite_scores cs
                JOIN companies c ON cs.company_id = c.id
                WHERE cs.company_id = ANY(:company_ids)
                ORDER BY cs.composite_score DESC
                LIMIT 10
            """)
            result = conn.execute(query, {'company_ids': company_ids})
            top_stocks = [dict(row._mapping) for row in result]

            # 9. Get Nifty 500 performance for comparison
            nifty_performance = self._get_nifty_performance(start_date, end_date, conn)

            return {
                'sector': sector,
                'companies': companies,
                'prices': prices,
                'sector_performance': sector_performance,
                'nifty_performance': nifty_performance,
                'news': news,
                'sentiment': sentiment,
                'shareholding': shareholding,
                'top_stocks': top_stocks,
                'analysis_period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days
                }
            }

    def _calculate_sector_performance(
        self,
        prices: List[Dict],
        company_ids: List[str],
        days: int
    ) -> Dict[str, Any]:
        """Calculate sector performance metrics"""
        if not prices:
            return {
                'sector_return_pct': 0.0,
                'avg_volume': 0,
                'gainers': [],
                'losers': []
            }

        # Group prices by company
        company_prices = {}
        for price in prices:
            cid = str(price['company_id'])
            if cid not in company_prices:
                company_prices[cid] = []
            company_prices[cid].append(price)

        # Calculate returns for each company
        company_returns = []
        for cid, price_list in company_prices.items():
            if len(price_list) < 2:
                continue

            # Sort by date
            price_list_sorted = sorted(price_list, key=lambda x: x['date'])
            start_price = price_list_sorted[0]['close']
            end_price = price_list_sorted[-1]['close']

            if start_price and start_price > 0:
                return_pct = ((end_price - start_price) / start_price) * 100
                company_returns.append({
                    'company_id': cid,
                    'return_pct': return_pct,
                    'start_price': float(start_price),
                    'end_price': float(end_price)
                })

        # Calculate sector average return
        if company_returns:
            sector_return = sum(r['return_pct'] for r in company_returns) / len(company_returns)
        else:
            sector_return = 0.0

        # Sort for gainers and losers
        company_returns_sorted = sorted(company_returns, key=lambda x: x['return_pct'], reverse=True)

        # Calculate average volume
        avg_volume = sum(p['volume'] for p in prices if p['volume']) / len(prices) if prices else 0

        return {
            'sector_return_pct': round(sector_return, 2),
            'avg_volume': int(avg_volume),
            'gainers': company_returns_sorted[:5],
            'losers': company_returns_sorted[-5:],
            'total_companies_analyzed': len(company_returns)
        }

    def _get_nifty_performance(
        self,
        start_date: datetime,
        end_date: datetime,
        conn
    ) -> Dict[str, float]:
        """Get Nifty 500 performance for comparison"""
        # For now, return placeholder
        # In production, fetch from index_prices table
        return {
            'nifty500_return_pct': 1.5,
            'nifty50_return_pct': 1.8
        }

    # ============================================================
    # MACRO REPORT GENERATION
    # ============================================================

    def generate_macro_weekly_report(self) -> str:
        """
        Generate macro market weekly report

        Returns:
            UUID of the created weekly report

        Raises:
            ValueError: If data insufficient
        """
        logger.info("Starting macro weekly report generation")

        try:
            # Fetch macro data
            macro_data = self._fetch_macro_data(self.ANALYSIS_PERIOD_DAYS)

            logger.info("Generating macro market weekly report")

            # Call Claude API to generate report content
            report_content, token_usage = self._call_claude_api(
                prompt_type='macro_weekly',
                context=macro_data,
                company_id=None
            )

            # Structure report content
            structured_report = self._structure_macro_report(report_content, macro_data)

            # Generate metadata
            fiscal_week, fiscal_year = self._get_fiscal_week_year()
            slug = self._generate_slug(f"Market Overview Week {fiscal_week} {fiscal_year}")

            # Store report in database
            report_id = self._store_weekly_report(
                report_type='MACRO_WEEKLY',
                sector_id=None,
                title=f"Market Overview - Week {fiscal_week}, {fiscal_year}",
                slug=slug,
                summary=structured_report.get('ai_weekly_thesis', {}).get('paragraphs', [''])[0][:500],
                full_content=structured_report,
                fiscal_week=fiscal_week,
                fiscal_year=fiscal_year
            )

            # Store report sections
            self._store_macro_report_sections(report_id, structured_report)

            # Calculate cost
            cost_usd = self.cost_tracker.calculate_cost(
                token_usage['input_tokens'],
                token_usage['output_tokens']
            )

            logger.info(
                "Macro weekly report generated successfully",
                report_id=report_id,
                tokens=token_usage['total_tokens'],
                cost_usd=float(cost_usd)
            )

            return report_id

        except Exception as e:
            log_error(
                error_type='macro_report_generation_failed',
                error_message=str(e),
                context={}
            )
            raise

    def _fetch_macro_data(self, days: int) -> Dict[str, Any]:
        """
        Fetch market-wide macro data for report generation

        Args:
            days: Number of days to look back

        Returns:
            Dictionary with all macro data
        """
        with self.engine.connect() as conn:
            # Date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)

            # 1. Get all sectors for sector rotation analysis
            query = text("""
                SELECT id, name, slug
                FROM sectors
                WHERE parent_sector_id IS NULL
                ORDER BY name
            """)
            result = conn.execute(query)
            sectors = [dict(row._mapping) for row in result]

            # 2. Calculate performance for each sector
            sector_performance = []
            for sector in sectors:
                sector_data = self._fetch_sector_data(sector['id'], days)
                if sector_data.get('sector_performance'):
                    sector_performance.append({
                        'sector_name': sector['name'],
                        'return_pct': sector_data['sector_performance']['sector_return_pct']
                    })

            # Sort sectors by performance
            sector_performance_sorted = sorted(
                sector_performance,
                key=lambda x: x['return_pct'],
                reverse=True
            )

            # 3. Get market breadth data (advances, declines)
            # For now, return calculated values
            # In production, aggregate from daily_prices
            market_breadth = self._calculate_market_breadth(start_date, end_date, conn)

            # 4. FII/DII data (aggregate for all stocks)
            query = text("""
                SELECT date,
                       SUM(fii_holding_pct) as total_fii,
                       SUM(dii_holding_pct) as total_dii
                FROM shareholding_patterns
                WHERE date >= :start_date
                  AND date <= :end_date
                GROUP BY date
                ORDER BY date DESC
                LIMIT 10
            """)
            result = conn.execute(query, {
                'start_date': start_date,
                'end_date': end_date
            })
            fii_dii_data = [dict(row._mapping) for row in result]

            # 5. Get top news across all sectors
            query = text("""
                SELECT title, summary, source, published_at,
                       sentiment_label, sentiment_score
                FROM news_articles
                WHERE published_at >= :start_date
                  AND published_at <= :end_date
                  AND sentiment_score IS NOT NULL
                ORDER BY ABS(sentiment_score) DESC
                LIMIT 30
            """)
            result = conn.execute(query, {
                'start_date': start_date,
                'end_date': end_date
            })
            top_news = [dict(row._mapping) for row in result]

            return {
                'sectors': sectors,
                'sector_performance': sector_performance_sorted,
                'market_breadth': market_breadth,
                'fii_dii_data': fii_dii_data,
                'top_news': top_news,
                'analysis_period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days
                }
            }

    def _calculate_market_breadth(
        self,
        start_date: datetime,
        end_date: datetime,
        conn
    ) -> Dict[str, Any]:
        """Calculate market breadth metrics"""
        # For now, return placeholder values
        # In production, calculate from daily_prices table
        return {
            'advances': 1250,
            'declines': 850,
            'new_52w_highs': 45,
            'new_52w_lows': 23,
            'pct_above_200dma': 62.5
        }

    # ============================================================
    # CLAUDE API INTEGRATION
    # ============================================================

    def _call_claude_api(
        self,
        prompt_type: str,
        context: Dict[str, Any],
        company_id: Optional[str] = None
    ) -> Tuple[Dict, Dict]:
        """
        Call Claude API with retry logic and cost tracking

        Args:
            prompt_type: Type of prompt ('sector_weekly' or 'macro_weekly')
            context: Context data for the report
            company_id: Optional company ID for cost tracking

        Returns:
            (response_json, token_usage)
        """
        start_time = time.time()

        # Get prompt templates
        system_prompt, user_prompt_template = self._get_prompt_template(prompt_type)

        # Format user prompt with context
        user_prompt = user_prompt_template.format(
            context_json=json.dumps(context, indent=2, default=str)
        )

        logger.info(
            f"Calling Claude API for {prompt_type}",
            prompt_length=len(user_prompt),
            model=self.MODEL
        )

        for attempt in range(self.MAX_RETRIES):
            try:
                response = self.anthropic_client.messages.create(
                    model=self.MODEL,
                    max_tokens=self.MAX_TOKENS,
                    temperature=self.TEMPERATURE,
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
                        logger.error("Failed to parse JSON from Claude response", content=content[:500])
                        raise

                # Token usage
                token_usage = {
                    'input_tokens': response.usage.input_tokens,
                    'output_tokens': response.usage.output_tokens,
                    'total_tokens': response.usage.input_tokens + response.usage.output_tokens
                }

                # Calculate cost
                cost_usd = (response.usage.input_tokens * 3.0 / 1_000_000) + \
                          (response.usage.output_tokens * 15.0 / 1_000_000)

                # Log LLM API call
                log_llm_api_call(
                    provider='anthropic',
                    model=self.MODEL,
                    operation=prompt_type,
                    duration_ms=duration_ms,
                    tokens_used=token_usage['total_tokens'],
                    cost_usd=cost_usd,
                    company_id=company_id
                )

                # Log LLM usage to database
                try:
                    self.cost_tracker.log_usage(
                        model=self.MODEL,
                        prompt_tokens=response.usage.input_tokens,
                        completion_tokens=response.usage.output_tokens,
                        task_type='WEEKLY_REPORT_GENERATION',
                        company_id=company_id,
                        duration_ms=int(duration_ms),
                        metadata={
                            'report_type': prompt_type,
                            'max_tokens': self.MAX_TOKENS,
                            'temperature': self.TEMPERATURE
                        }
                    )
                except Exception as e:
                    logger.warning("Failed to log LLM usage to database", error=str(e))

                logger.info(
                    "Claude API call successful",
                    tokens=token_usage['total_tokens'],
                    cost_usd=cost_usd,
                    duration_ms=duration_ms
                )

                return result, token_usage

            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000

                if attempt == self.MAX_RETRIES - 1:
                    # Log final failure
                    log_llm_api_call(
                        provider='anthropic',
                        model=self.MODEL,
                        operation=prompt_type,
                        duration_ms=duration_ms,
                        company_id=company_id,
                        error=e
                    )
                    raise

                logger.warning(
                    f"Claude API call attempt {attempt + 1} failed",
                    error=str(e),
                    attempt=attempt + 1,
                    max_retries=self.MAX_RETRIES
                )
                time.sleep(2 ** attempt)  # Exponential backoff

    # ============================================================
    # REPORT STRUCTURING
    # ============================================================

    def _structure_sector_report(
        self,
        ai_response: Dict,
        data: Dict
    ) -> Dict[str, Any]:
        """
        Structure sector report content into final JSON format

        Args:
            ai_response: Response from Claude API
            data: Original data context

        Returns:
            Structured report matching sector report schema
        """
        # Merge AI-generated content with calculated metrics
        structured = {
            'performance_summary': ai_response.get('performance_summary', {
                'sector_return_pct': data['sector_performance']['sector_return_pct'],
                'vs_nifty500_pct': data['sector_performance']['sector_return_pct'] -
                                  data['nifty_performance']['nifty500_return_pct'],
                'trend_direction': 'UP' if data['sector_performance']['sector_return_pct'] > 0 else 'DOWN'
            }),
            'top_movers': ai_response.get('top_movers', {
                'gainers': [],
                'losers': []
            }),
            'key_events': ai_response.get('key_events', []),
            'fii_dii_flow': ai_response.get('fii_dii_flow', {
                'fii_net': 0.0,
                'dii_net': 0.0,
                'trend_vs_last_week': 'stable'
            }),
            'policy_updates': ai_response.get('policy_updates', []),
            'ai_outlook': ai_response.get('ai_outlook', {
                'paragraphs': [],
                'confidence': 'MEDIUM',
                'key_risks': [],
                'key_opportunities': []
            }),
            'top_stocks': self._format_top_stocks(data.get('top_stocks', []), data.get('prices', []))
        }

        return structured

    def _structure_macro_report(
        self,
        ai_response: Dict,
        data: Dict
    ) -> Dict[str, Any]:
        """
        Structure macro report content into final JSON format

        Args:
            ai_response: Response from Claude API
            data: Original data context

        Returns:
            Structured report matching macro report schema
        """
        structured = {
            'market_summary': ai_response.get('market_summary', {
                'nifty50': {'weekly_return': 0.0, 'monthly_return': 0.0, 'ytd_return': 0.0},
                'sensex': {'weekly_return': 0.0, 'monthly_return': 0.0, 'ytd_return': 0.0},
                'midcap100': {'weekly_return': 0.0, 'monthly_return': 0.0, 'ytd_return': 0.0},
                'smallcap250': {'weekly_return': 0.0, 'monthly_return': 0.0, 'ytd_return': 0.0}
            }),
            'market_breadth': data.get('market_breadth', {}),
            'fii_dii_weekly': ai_response.get('fii_dii_weekly', {
                'fii_net_weekly': 0.0,
                'dii_net_weekly': 0.0,
                'fii_monthly_trend': 'stable',
                'dii_monthly_trend': 'stable'
            }),
            'currency_commodities': ai_response.get('currency_commodities', {}),
            'macro_indicators': ai_response.get('macro_indicators', {}),
            'sector_rotation': self._format_sector_rotation(data.get('sector_performance', [])),
            'global_context': ai_response.get('global_context', {}),
            'ai_weekly_thesis': ai_response.get('ai_weekly_thesis', {
                'title': 'Weekly Market Analysis',
                'paragraphs': [],
                'key_watch_items': []
            })
        }

        return structured

    def _format_top_stocks(self, top_stocks: List[Dict], prices: List[Dict]) -> List[Dict]:
        """Format top stocks with current price and weekly return"""
        formatted = []

        for stock in top_stocks:
            # Get latest price
            stock_prices = [p for p in prices if str(p['company_id']) == str(stock['company_id'])]
            current_price = stock_prices[0]['close'] if stock_prices else 0.0

            # Calculate weekly return (placeholder)
            week_return = 0.0
            if len(stock_prices) >= 2:
                stock_prices_sorted = sorted(stock_prices, key=lambda x: x['date'])
                start_price = stock_prices_sorted[0]['close']
                end_price = stock_prices_sorted[-1]['close']
                if start_price and start_price > 0:
                    week_return = ((end_price - start_price) / start_price) * 100

            formatted.append({
                'symbol': stock.get('nse_symbol', ''),
                'name': stock.get('company_name', ''),
                'quality_score': int(stock.get('quality_score', 0)),
                'growth_score': int(stock.get('growth_score', 0)),
                'current_price': float(current_price),
                'week_return': round(week_return, 2)
            })

        return formatted

    def _format_sector_rotation(self, sector_performance: List[Dict]) -> Dict[str, List[str]]:
        """Format sector rotation data"""
        if not sector_performance:
            return {
                'leading_sectors': [],
                'lagging_sectors': [],
                'improving_sectors': [],
                'weakening_sectors': []
            }

        # Sort by performance
        sorted_sectors = sorted(sector_performance, key=lambda x: x['return_pct'], reverse=True)

        return {
            'leading_sectors': [s['sector_name'] for s in sorted_sectors[:3]],
            'lagging_sectors': [s['sector_name'] for s in sorted_sectors[-3:]],
            'improving_sectors': [s['sector_name'] for s in sorted_sectors[:5]],
            'weakening_sectors': [s['sector_name'] for s in sorted_sectors[-5:]]
        }

    # ============================================================
    # DATABASE STORAGE
    # ============================================================

    def _store_weekly_report(
        self,
        report_type: str,
        sector_id: Optional[str],
        title: str,
        slug: str,
        summary: str,
        full_content: Dict,
        fiscal_week: int,
        fiscal_year: int
    ) -> str:
        """
        Store weekly report in database

        Returns:
            UUID of created report
        """
        with self.engine.begin() as conn:
            query = text("""
                INSERT INTO weekly_reports (
                    id, report_type, sector_id, title, slug,
                    summary, full_content, published_at, fiscal_week,
                    fiscal_year, is_published, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), :report_type, :sector_id, :title, :slug,
                    :summary, :full_content, :published_at, :fiscal_week,
                    :fiscal_year, :is_published, :created_at, :updated_at
                )
                RETURNING id
            """)

            result = conn.execute(query, {
                'report_type': report_type,
                'sector_id': sector_id,
                'title': title,
                'slug': slug,
                'summary': summary,
                'full_content': json.dumps(full_content),
                'published_at': datetime.now(),
                'fiscal_week': fiscal_week,
                'fiscal_year': fiscal_year,
                'is_published': True,
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            })

            report_id = result.fetchone()[0]

            logger.info("Weekly report stored in database", report_id=report_id, slug=slug)

            return str(report_id)

    def _store_sector_report_sections(self, report_id: str, content: Dict):
        """Store sector report sections in database"""
        sections = [
            {
                'title': 'Performance Summary',
                'type': 'METRIC_CARDS',
                'order': 1,
                'content': content.get('performance_summary', {})
            },
            {
                'title': 'Top Movers',
                'type': 'TABLE_DATA',
                'order': 2,
                'content': content.get('top_movers', {})
            },
            {
                'title': 'Key Events',
                'type': 'TEXT',
                'order': 3,
                'content': {'events': content.get('key_events', [])}
            },
            {
                'title': 'FII/DII Flow',
                'type': 'METRIC_CARDS',
                'order': 4,
                'content': content.get('fii_dii_flow', {})
            },
            {
                'title': 'AI Outlook',
                'type': 'TEXT',
                'order': 5,
                'content': content.get('ai_outlook', {})
            },
            {
                'title': 'Top Stocks',
                'type': 'STOCK_LIST',
                'order': 6,
                'content': {'stocks': content.get('top_stocks', [])}
            }
        ]

        with self.engine.begin() as conn:
            for section in sections:
                query = text("""
                    INSERT INTO report_sections (
                        id, report_id, section_order, section_title,
                        section_type, content, created_at
                    ) VALUES (
                        gen_random_uuid(), :report_id, :section_order, :section_title,
                        :section_type, :content, :created_at
                    )
                """)

                conn.execute(query, {
                    'report_id': report_id,
                    'section_order': section['order'],
                    'section_title': section['title'],
                    'section_type': section['type'],
                    'content': json.dumps(section['content']),
                    'created_at': datetime.now()
                })

        logger.info(f"Stored {len(sections)} report sections", report_id=report_id)

    def _store_macro_report_sections(self, report_id: str, content: Dict):
        """Store macro report sections in database"""
        sections = [
            {
                'title': 'Market Summary',
                'type': 'METRIC_CARDS',
                'order': 1,
                'content': content.get('market_summary', {})
            },
            {
                'title': 'Market Breadth',
                'type': 'METRIC_CARDS',
                'order': 2,
                'content': content.get('market_breadth', {})
            },
            {
                'title': 'FII/DII Weekly',
                'type': 'CHART_DATA',
                'order': 3,
                'content': content.get('fii_dii_weekly', {})
            },
            {
                'title': 'Sector Rotation',
                'type': 'TABLE_DATA',
                'order': 4,
                'content': content.get('sector_rotation', {})
            },
            {
                'title': 'Macro Indicators',
                'type': 'METRIC_CARDS',
                'order': 5,
                'content': content.get('macro_indicators', {})
            },
            {
                'title': 'AI Weekly Thesis',
                'type': 'TEXT',
                'order': 6,
                'content': content.get('ai_weekly_thesis', {})
            }
        ]

        with self.engine.begin() as conn:
            for section in sections:
                query = text("""
                    INSERT INTO report_sections (
                        id, report_id, section_order, section_title,
                        section_type, content, created_at
                    ) VALUES (
                        gen_random_uuid(), :report_id, :section_order, :section_title,
                        :section_type, :content, :created_at
                    )
                """)

                conn.execute(query, {
                    'report_id': report_id,
                    'section_order': section['order'],
                    'section_title': section['title'],
                    'section_type': section['type'],
                    'content': json.dumps(section['content']),
                    'created_at': datetime.now()
                })

        logger.info(f"Stored {len(sections)} report sections", report_id=report_id)

    # ============================================================
    # PROMPT TEMPLATES
    # ============================================================

    def _get_prompt_template(self, prompt_type: str) -> Tuple[str, str]:
        """Get system and user prompt templates"""

        base_system = """You are a senior financial analyst specializing in Indian equity markets.

Your role:
- Analyze market and sector data objectively
- Cite specific numbers from the provided data
- Never make buy/sell/hold recommendations
- Use professional financial analyst tone
- Flag data limitations or gaps

CRITICAL RULES:
1. Only use numbers that appear in the provided context data
2. Reference specific time periods (e.g., "Week ending [date]")
3. Never extrapolate or estimate numbers
4. Always include disclaimer at the end
5. Focus on trends, patterns, and notable events

Disclaimer to include:
"This analysis is AI-generated and for informational purposes only. It should not be considered as investment advice."

Output must be valid JSON matching the required schema."""

        if prompt_type == 'sector_weekly':
            return (
                base_system,
                """Analyze the sector data and generate a comprehensive weekly sector report.

Context Data:
{context_json}

Generate a JSON response with the following structure:
{{
  "performance_summary": {{
    "sector_return_pct": <calculated from data>,
    "vs_nifty500_pct": <sector return vs index>,
    "trend_direction": "UP" | "DOWN" | "FLAT"
  }},
  "top_movers": {{
    "gainers": [
      {{"symbol": "ABC", "name": "Company Name", "return_pct": 15.5, "reason": "Brief reason for gain"}}
    ],
    "losers": [
      {{"symbol": "XYZ", "name": "Company Name", "return_pct": -8.2, "reason": "Brief reason for loss"}}
    ]
  }},
  "key_events": [
    {{"headline": "Event headline", "impact": "Expected impact", "sentiment": "POSITIVE|NEGATIVE|NEUTRAL", "source": "Source name"}}
  ],
  "fii_dii_flow": {{
    "fii_net": <net FII flow in crores>,
    "dii_net": <net DII flow in crores>,
    "trend_vs_last_week": "increasing|decreasing|stable"
  }},
  "policy_updates": [
    {{"policy": "Policy name", "impact_on_sector": "Impact description", "sentiment": "POSITIVE|NEGATIVE|NEUTRAL"}}
  ],
  "ai_outlook": {{
    "paragraphs": [
      "First paragraph of outlook analysis...",
      "Second paragraph...",
      "Third paragraph..."
    ],
    "confidence": "HIGH|MEDIUM|LOW",
    "key_risks": ["Risk 1", "Risk 2", "Risk 3"],
    "key_opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"]
  }}
}}

Focus on facts from the data. Be specific with numbers. End outlook with disclaimer."""
            )

        elif prompt_type == 'macro_weekly':
            return (
                base_system,
                """Analyze the market data and generate a comprehensive macro weekly report.

Context Data:
{context_json}

Generate a JSON response with the following structure:
{{
  "market_summary": {{
    "nifty50": {{"weekly_return": 2.5, "monthly_return": 5.2, "ytd_return": 8.5}},
    "sensex": {{"weekly_return": 2.3, "monthly_return": 5.0, "ytd_return": 8.2}},
    "midcap100": {{"weekly_return": 3.1, "monthly_return": 6.5, "ytd_return": 12.3}},
    "smallcap250": {{"weekly_return": 3.8, "monthly_return": 7.2, "ytd_return": 15.1}}
  }},
  "fii_dii_weekly": {{
    "fii_net_weekly": <net FII flow in crores>,
    "dii_net_weekly": <net DII flow in crores>,
    "fii_monthly_trend": "buying|selling|neutral",
    "dii_monthly_trend": "buying|selling|neutral"
  }},
  "currency_commodities": {{
    "usd_inr": {{"weekly_change": 0.5, "impact_note": "Brief impact note"}},
    "crude_oil": {{"weekly_change": -2.3, "impact_note": "Brief impact note"}},
    "gold": {{"weekly_change": 1.2, "impact_note": "Brief impact note"}}
  }},
  "macro_indicators": {{
    "gdp_latest": {{"value": 7.2, "trend": "growing", "last_updated": "Q3 FY24"}},
    "iip_latest": {{"value": 5.8, "trend": "expanding", "last_updated": "Jan 2024"}},
    "pmi_latest": {{"value": 56.5, "trend": "expansion", "last_updated": "Feb 2024"}},
    "cpi_latest": {{"value": 5.1, "trend": "moderating", "last_updated": "Jan 2024"}},
    "repo_rate": {{"value": 6.5, "trend": "unchanged", "last_updated": "Feb 2024"}}
  }},
  "global_context": {{
    "us_fed_update": "Brief update on Fed policy and US markets",
    "china_impact": "Brief note on China economic situation and impact on India",
    "europe_update": "Brief update on European markets"
  }},
  "ai_weekly_thesis": {{
    "title": "Catchy title for this week's market thesis",
    "paragraphs": [
      "First paragraph of comprehensive market analysis...",
      "Second paragraph discussing key themes...",
      "Third paragraph on sector rotation...",
      "Fourth paragraph with forward outlook..."
    ],
    "key_watch_items": [
      "Item 1 to watch next week",
      "Item 2 to watch next week",
      "Item 3 to watch next week"
    ]
  }}
}}

Provide comprehensive analysis backed by data. Be specific with numbers. End thesis with disclaimer."""
            )

        else:
            raise ValueError(f"Unknown prompt type: {prompt_type}")

    # ============================================================
    # UTILITY METHODS
    # ============================================================

    def _get_fiscal_week_year(self) -> Tuple[int, int]:
        """
        Calculate fiscal week and year

        Returns:
            (fiscal_week, fiscal_year)
        """
        now = datetime.now()

        # ISO week number (1-53)
        fiscal_week = now.isocalendar()[1]

        # Fiscal year (April to March)
        if now.month >= 4:
            fiscal_year = now.year
        else:
            fiscal_year = now.year - 1

        return fiscal_week, fiscal_year

    def _generate_slug(self, title: str) -> str:
        """
        Generate URL-friendly slug from title

        Args:
            title: Report title

        Returns:
            Slugified string
        """
        # Convert to lowercase
        slug = title.lower()

        # Replace spaces with hyphens
        slug = re.sub(r'\s+', '-', slug)

        # Remove special characters
        slug = re.sub(r'[^a-z0-9-]', '', slug)

        # Remove multiple consecutive hyphens
        slug = re.sub(r'-+', '-', slug)

        # Remove leading/trailing hyphens
        slug = slug.strip('-')

        return slug
