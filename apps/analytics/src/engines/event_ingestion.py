"""
Event Ingestion Engine

Automatically creates stock_events from various data sources:
- financial_results: QUARTERLY_RESULT events with AI summary
- news_articles: Only HIGH impact news, auto-categorized
- shareholding_patterns: PROMOTER_CHANGE (>2%), PLEDGE_CHANGE (>5%)
- insider_transactions: BULK_DEAL, BLOCK_DEAL
- risk_flags: REGULATORY_ACTION, AUDITOR_CHANGE events
- composite_scores: Events when score changes >10 points

Features:
- Auto-assess impact based on metrics
- Deduplicate events
- Generate period summaries (monthly/quarterly/annual)
"""
import os
import json
from typing import Dict, Optional, List, Any, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
from dataclasses import dataclass
import anthropic
from sqlalchemy import create_engine, text
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))
from utils.logger import logger, log_error


@dataclass
class EventData:
    """Event data structure"""
    company_id: str
    event_type: str
    event_date: datetime
    impact_assessment: str
    title: str
    description: str
    metadata: Dict
    source_id: Optional[str] = None
    source_type: Optional[str] = None


class EventIngestionEngine:
    """
    Event Ingestion Engine

    Auto-creates stock_events from various data sources with intelligent
    impact assessment and deduplication.
    """

    # Impact thresholds
    REVENUE_GROWTH_THRESHOLD = 20.0  # 20% YoY growth
    MARGIN_EXPANSION_THRESHOLD = 2.0  # 2% margin expansion
    PROMOTER_CHANGE_THRESHOLD = 2.0  # 2% promoter holding change
    PLEDGE_CHANGE_THRESHOLD = 5.0  # 5% pledge change
    SCORE_CHANGE_THRESHOLD = 10.0  # 10 points score change

    # Event type mappings
    EVENT_TYPE_MAP = {
        'QUARTERLY_RESULT': 'QUARTERLY_RESULT',
        'ANNUAL_RESULT': 'ANNUAL_RESULT',
        'PROMOTER_CHANGE': 'PROMOTER_CHANGE',
        'PLEDGE_CHANGE': 'PLEDGE_CHANGE',
        'BULK_DEAL': 'BULK_DEAL',
        'BLOCK_DEAL': 'BLOCK_DEAL',
        'REGULATORY_ACTION': 'REGULATORY_ACTION',
        'AUDITOR_CHANGE': 'AUDITOR_CHANGE',
    }

    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)

        # Initialize Anthropic client for AI summaries
        api_key = os.getenv('ANTHROPIC_API_KEY')
        self.anthropic_client = anthropic.Anthropic(api_key=api_key) if api_key else None
        self.model = "claude-sonnet-4-20250514"

    # ============================================================
    # MAIN PROCESSING METHODS
    # ============================================================

    def process_new_events(self, company_id: str) -> Dict:
        """
        Process all new events for a company from various sources

        Args:
            company_id: UUID of the company

        Returns:
            dict: Summary of events created
        """
        logger.info(f"Processing new events for company {company_id}")

        try:
            events_created = {
                'financial_results': 0,
                'news_articles': 0,
                'shareholding_changes': 0,
                'insider_transactions': 0,
                'risk_flags': 0,
                'score_changes': 0,
                'total': 0
            }

            # Process financial results
            events_created['financial_results'] = self._process_financial_results(company_id)

            # Process news articles
            events_created['news_articles'] = self._process_news_articles(company_id)

            # Process shareholding patterns
            events_created['shareholding_changes'] = self._process_shareholding_patterns(company_id)

            # Process insider transactions
            events_created['insider_transactions'] = self._process_insider_transactions(company_id)

            # Process risk flags
            events_created['risk_flags'] = self._process_risk_flags(company_id)

            # Process composite score changes
            events_created['score_changes'] = self._process_score_changes(company_id)

            # Calculate total
            events_created['total'] = sum([
                events_created['financial_results'],
                events_created['news_articles'],
                events_created['shareholding_changes'],
                events_created['insider_transactions'],
                events_created['risk_flags'],
                events_created['score_changes']
            ])

            logger.info(f"Processed events for {company_id}: {events_created['total']} events created")

            return {
                'company_id': company_id,
                'events_created': events_created,
                'status': 'success'
            }

        except Exception as e:
            logger.error(f"Error processing events for {company_id}: {e}", exc_info=True)
            return {
                'company_id': company_id,
                'status': 'error',
                'error': str(e)
            }

    # ============================================================
    # SOURCE-SPECIFIC PROCESSORS
    # ============================================================

    def _process_financial_results(self, company_id: str) -> int:
        """Process financial results and create QUARTERLY_RESULT events"""
        try:
            with self.engine.connect() as conn:
                # Get recent financial results without events
                query = text("""
                    SELECT
                        fr.id, fr.company_id, fr.period_type, fr.fiscal_year, fr.fiscal_quarter,
                        fr.revenue, fr.net_profit, fr.operating_margin, fr.net_margin,
                        fr.published_at,
                        LAG(fr.revenue) OVER (PARTITION BY fr.company_id ORDER BY fr.fiscal_year, fr.fiscal_quarter) as prev_revenue,
                        LAG(fr.net_profit) OVER (PARTITION BY fr.company_id ORDER BY fr.fiscal_year, fr.fiscal_quarter) as prev_profit,
                        LAG(fr.operating_margin) OVER (PARTITION BY fr.company_id ORDER BY fr.fiscal_year, fr.fiscal_quarter) as prev_margin
                    FROM financial_results fr
                    WHERE fr.company_id = :company_id
                    AND fr.period_type = 'QUARTERLY'
                    AND NOT EXISTS (
                        SELECT 1 FROM stock_events se
                        WHERE se.source_id = fr.id::text
                        AND se.source_type = 'financial_result'
                    )
                    ORDER BY fr.fiscal_year DESC, fr.fiscal_quarter DESC
                    LIMIT 4
                """)

                results = conn.execute(query, {'company_id': company_id}).fetchall()

                events_created = 0
                for row in results:
                    # Calculate growth metrics
                    revenue_growth = None
                    profit_growth = None
                    margin_change = None

                    if row.prev_revenue and row.revenue:
                        revenue_growth = ((float(row.revenue) - float(row.prev_revenue)) / float(row.prev_revenue)) * 100

                    if row.prev_profit and row.net_profit:
                        profit_growth = ((float(row.net_profit) - float(row.prev_profit)) / float(row.prev_profit)) * 100

                    if row.prev_margin and row.operating_margin:
                        margin_change = float(row.operating_margin) - float(row.prev_margin)

                    # Assess impact
                    impact = self._assess_financial_impact(revenue_growth, profit_growth, margin_change)

                    # Generate AI summary
                    summary = self._generate_financial_summary(
                        company_id, row, revenue_growth, profit_growth, margin_change
                    )

                    # Create event
                    event_data = EventData(
                        company_id=company_id,
                        event_type='QUARTERLY_RESULT',
                        event_date=row.published_at,
                        impact_assessment=impact,
                        title=f"Q{row.fiscal_quarter} FY{row.fiscal_year} Results",
                        description=summary,
                        metadata={
                            'fiscal_year': row.fiscal_year,
                            'fiscal_quarter': row.fiscal_quarter,
                            'revenue': float(row.revenue) if row.revenue else None,
                            'net_profit': float(row.net_profit) if row.net_profit else None,
                            'revenue_growth_pct': revenue_growth,
                            'profit_growth_pct': profit_growth,
                            'margin_change': margin_change
                        },
                        source_id=str(row.id),
                        source_type='financial_result'
                    )

                    if self._create_event(event_data):
                        events_created += 1

                return events_created

        except Exception as e:
            logger.error(f"Error processing financial results for {company_id}: {e}", exc_info=True)
            return 0

    def _process_news_articles(self, company_id: str) -> int:
        """Process HIGH impact news articles and create events"""
        try:
            with self.engine.connect() as conn:
                # Get HIGH impact news without events
                query = text("""
                    SELECT
                        na.id, na.company_id, na.title, na.summary, na.published_at,
                        na.impact_rating, na.sentiment_label, na.sentiment_score
                    FROM news_articles na
                    WHERE na.company_id = :company_id
                    AND na.impact_rating = 'HIGH'
                    AND na.published_at > NOW() - INTERVAL '30 days'
                    AND NOT EXISTS (
                        SELECT 1 FROM stock_events se
                        WHERE se.source_id = na.id::text
                        AND se.source_type = 'news_article'
                    )
                    ORDER BY na.published_at DESC
                    LIMIT 10
                """)

                results = conn.execute(query, {'company_id': company_id}).fetchall()

                events_created = 0
                for row in results:
                    # Auto-categorize news into event types
                    event_type, impact = self._categorize_news(row.title, row.summary, row.sentiment_label)

                    event_data = EventData(
                        company_id=company_id,
                        event_type=event_type,
                        event_date=row.published_at,
                        impact_assessment=impact,
                        title=row.title,
                        description=row.summary or row.title,
                        metadata={
                            'sentiment_label': row.sentiment_label,
                            'sentiment_score': float(row.sentiment_score) if row.sentiment_score else None,
                            'impact_rating': row.impact_rating
                        },
                        source_id=str(row.id),
                        source_type='news_article'
                    )

                    if self._create_event(event_data):
                        events_created += 1

                return events_created

        except Exception as e:
            logger.error(f"Error processing news articles for {company_id}: {e}", exc_info=True)
            return 0

    def _process_shareholding_patterns(self, company_id: str) -> int:
        """Process shareholding changes and create PROMOTER_CHANGE/PLEDGE_CHANGE events"""
        try:
            with self.engine.connect() as conn:
                # Get shareholding changes without events
                query = text("""
                    SELECT
                        sp.id, sp.company_id, sp.quarter,
                        sp.promoter_holding_pct, sp.pledge_pct,
                        LAG(sp.promoter_holding_pct) OVER (PARTITION BY sp.company_id ORDER BY sp.quarter) as prev_promoter,
                        LAG(sp.pledge_pct) OVER (PARTITION BY sp.company_id ORDER BY sp.quarter) as prev_pledge
                    FROM shareholding_patterns sp
                    WHERE sp.company_id = :company_id
                    AND sp.quarter > NOW() - INTERVAL '1 year'
                    ORDER BY sp.quarter DESC
                    LIMIT 4
                """)

                results = conn.execute(query, {'company_id': company_id}).fetchall()

                events_created = 0
                for row in results:
                    # Check for promoter holding change
                    if row.prev_promoter:
                        promoter_change = abs(float(row.promoter_holding_pct) - float(row.prev_promoter))

                        if promoter_change >= self.PROMOTER_CHANGE_THRESHOLD:
                            # Check if event already exists
                            check_query = text("""
                                SELECT 1 FROM stock_events
                                WHERE company_id = :company_id
                                AND event_type = 'PROMOTER_CHANGE'
                                AND DATE(event_date) = DATE(:quarter)
                            """)

                            exists = conn.execute(check_query, {
                                'company_id': company_id,
                                'quarter': row.quarter
                            }).fetchone()

                            if not exists:
                                impact = 'NEGATIVE' if float(row.promoter_holding_pct) < float(row.prev_promoter) else 'POSITIVE'

                                event_data = EventData(
                                    company_id=company_id,
                                    event_type='PROMOTER_CHANGE',
                                    event_date=row.quarter,
                                    impact_assessment=impact,
                                    title=f"Promoter Holding Change: {promoter_change:.2f}%",
                                    description=f"Promoter holding changed from {row.prev_promoter:.2f}% to {row.promoter_holding_pct:.2f}%",
                                    metadata={
                                        'promoter_holding_pct': float(row.promoter_holding_pct),
                                        'prev_promoter_holding_pct': float(row.prev_promoter),
                                        'change_pct': promoter_change * (-1 if impact == 'NEGATIVE' else 1)
                                    },
                                    source_id=str(row.id),
                                    source_type='shareholding_pattern'
                                )

                                if self._create_event(event_data):
                                    events_created += 1

                    # Check for pledge change
                    if row.prev_pledge and row.pledge_pct:
                        pledge_change = abs(float(row.pledge_pct) - float(row.prev_pledge))

                        if pledge_change >= self.PLEDGE_CHANGE_THRESHOLD:
                            # Check if event already exists
                            check_query = text("""
                                SELECT 1 FROM stock_events
                                WHERE company_id = :company_id
                                AND event_type = 'PLEDGE_CHANGE'
                                AND DATE(event_date) = DATE(:quarter)
                            """)

                            exists = conn.execute(check_query, {
                                'company_id': company_id,
                                'quarter': row.quarter
                            }).fetchone()

                            if not exists:
                                impact = 'NEGATIVE' if float(row.pledge_pct) > float(row.prev_pledge) else 'POSITIVE'

                                event_data = EventData(
                                    company_id=company_id,
                                    event_type='PLEDGE_CHANGE',
                                    event_date=row.quarter,
                                    impact_assessment=impact,
                                    title=f"Promoter Pledge Change: {pledge_change:.2f}%",
                                    description=f"Promoter pledge changed from {row.prev_pledge:.2f}% to {row.pledge_pct:.2f}%",
                                    metadata={
                                        'pledge_pct': float(row.pledge_pct),
                                        'prev_pledge_pct': float(row.prev_pledge),
                                        'change_pct': pledge_change * (1 if impact == 'NEGATIVE' else -1)
                                    },
                                    source_id=str(row.id),
                                    source_type='shareholding_pattern'
                                )

                                if self._create_event(event_data):
                                    events_created += 1

                return events_created

        except Exception as e:
            logger.error(f"Error processing shareholding patterns for {company_id}: {e}", exc_info=True)
            return 0

    def _process_insider_transactions(self, company_id: str) -> int:
        """Process bulk/block deals and create events"""
        try:
            with self.engine.connect() as conn:
                # Get bulk/block deals without events (deals > 5 crore)
                query = text("""
                    SELECT
                        it.id, it.company_id, it.transaction_type, it.quantity,
                        it.price, it.value, it.person_name, it.person_category,
                        it.filing_date
                    FROM insider_transactions it
                    WHERE it.company_id = :company_id
                    AND it.value > 50000000
                    AND it.filing_date > NOW() - INTERVAL '90 days'
                    AND NOT EXISTS (
                        SELECT 1 FROM stock_events se
                        WHERE se.source_id = it.id::text
                        AND se.source_type = 'insider_transaction'
                    )
                    ORDER BY it.filing_date DESC
                    LIMIT 10
                """)

                results = conn.execute(query, {'company_id': company_id}).fetchall()

                events_created = 0
                for row in results:
                    # Determine if it's a bulk or block deal based on value
                    event_type = 'BLOCK_DEAL' if float(row.value) > 100000000 else 'BULK_DEAL'
                    impact = 'NEGATIVE' if row.transaction_type == 'SELL' else 'POSITIVE'

                    event_data = EventData(
                        company_id=company_id,
                        event_type=event_type,
                        event_date=row.filing_date,
                        impact_assessment=impact,
                        title=f"{event_type.replace('_', ' ').title()}: {row.person_name}",
                        description=f"{row.person_name} ({row.person_category}) {row.transaction_type.lower()} {row.quantity:,} shares at ₹{float(row.price):.2f}",
                        metadata={
                            'transaction_type': row.transaction_type,
                            'quantity': int(row.quantity),
                            'price': float(row.price),
                            'value': float(row.value),
                            'person_name': row.person_name,
                            'person_category': row.person_category
                        },
                        source_id=str(row.id),
                        source_type='insider_transaction'
                    )

                    if self._create_event(event_data):
                        events_created += 1

                return events_created

        except Exception as e:
            logger.error(f"Error processing insider transactions for {company_id}: {e}", exc_info=True)
            return 0

    def _process_risk_flags(self, company_id: str) -> int:
        """Process risk flags and create REGULATORY_ACTION/AUDITOR_CHANGE events"""
        try:
            with self.engine.connect() as conn:
                # Get risk flags without events
                query = text("""
                    SELECT
                        rf.id, rf.company_id, rf.flag_type, rf.severity,
                        rf.title, rf.description, rf.detected_at
                    FROM risk_flags rf
                    WHERE rf.company_id = :company_id
                    AND rf.detected_at > NOW() - INTERVAL '90 days'
                    AND rf.flag_type IN ('REGULATORY', 'AUDITOR_CONCERN')
                    AND NOT EXISTS (
                        SELECT 1 FROM stock_events se
                        WHERE se.source_id = rf.id::text
                        AND se.source_type = 'risk_flag'
                    )
                    ORDER BY rf.detected_at DESC
                    LIMIT 10
                """)

                results = conn.execute(query, {'company_id': company_id}).fetchall()

                events_created = 0
                for row in results:
                    event_type = 'REGULATORY_ACTION' if row.flag_type == 'REGULATORY' else 'AUDITOR_CHANGE'

                    # Determine impact based on severity
                    impact_map = {
                        'HIGH': 'VERY_NEGATIVE',
                        'MEDIUM': 'NEGATIVE',
                        'LOW': 'NEUTRAL'
                    }
                    impact = impact_map.get(row.severity, 'NEGATIVE')

                    event_data = EventData(
                        company_id=company_id,
                        event_type=event_type,
                        event_date=row.detected_at,
                        impact_assessment=impact,
                        title=row.title,
                        description=row.description,
                        metadata={
                            'flag_type': row.flag_type,
                            'severity': row.severity
                        },
                        source_id=str(row.id),
                        source_type='risk_flag'
                    )

                    if self._create_event(event_data):
                        events_created += 1

                return events_created

        except Exception as e:
            logger.error(f"Error processing risk flags for {company_id}: {e}", exc_info=True)
            return 0

    def _process_score_changes(self, company_id: str) -> int:
        """Process significant composite score changes"""
        try:
            with self.engine.connect() as conn:
                # Get recent score changes
                query = text("""
                    WITH score_changes AS (
                        SELECT
                            cs.id, cs.company_id, cs.score_type, cs.total_score, cs.computed_at,
                            LAG(cs.total_score) OVER (PARTITION BY cs.company_id, cs.score_type ORDER BY cs.computed_at) as prev_score
                        FROM composite_scores cs
                        WHERE cs.company_id = :company_id
                        AND cs.computed_at > NOW() - INTERVAL '30 days'
                    )
                    SELECT * FROM score_changes
                    WHERE prev_score IS NOT NULL
                    AND ABS(total_score - prev_score) >= :threshold
                    AND NOT EXISTS (
                        SELECT 1 FROM stock_events se
                        WHERE se.company_id = score_changes.company_id
                        AND se.metadata->>'score_type' = score_changes.score_type
                        AND DATE(se.event_date) = DATE(score_changes.computed_at)
                        AND se.source_type = 'score_change'
                    )
                    ORDER BY computed_at DESC
                    LIMIT 5
                """)

                results = conn.execute(query, {
                    'company_id': company_id,
                    'threshold': self.SCORE_CHANGE_THRESHOLD
                }).fetchall()

                events_created = 0
                for row in results:
                    score_change = float(row.total_score) - float(row.prev_score)
                    impact = 'POSITIVE' if score_change > 0 else 'NEGATIVE'

                    if abs(score_change) >= 15:
                        impact = 'VERY_POSITIVE' if score_change > 0 else 'VERY_NEGATIVE'

                    event_data = EventData(
                        company_id=company_id,
                        event_type='OTHER',  # Generic event type for score changes
                        event_date=row.computed_at,
                        impact_assessment=impact,
                        title=f"{row.score_type.title()} Score Changed by {score_change:.1f} points",
                        description=f"{row.score_type.title()} score moved from {row.prev_score:.1f} to {row.total_score:.1f}",
                        metadata={
                            'score_type': row.score_type,
                            'current_score': float(row.total_score),
                            'previous_score': float(row.prev_score),
                            'change': score_change
                        },
                        source_id=str(row.id),
                        source_type='score_change'
                    )

                    if self._create_event(event_data):
                        events_created += 1

                return events_created

        except Exception as e:
            logger.error(f"Error processing score changes for {company_id}: {e}", exc_info=True)
            return 0

    # ============================================================
    # HELPER METHODS
    # ============================================================

    def _assess_financial_impact(
        self,
        revenue_growth: Optional[float],
        profit_growth: Optional[float],
        margin_change: Optional[float]
    ) -> str:
        """Assess financial impact based on metrics"""
        if revenue_growth is None and profit_growth is None:
            return 'NEUTRAL'

        # Very positive: revenue growth >20% AND margin expansion
        if (revenue_growth and revenue_growth >= self.REVENUE_GROWTH_THRESHOLD and
            margin_change and margin_change >= self.MARGIN_EXPANSION_THRESHOLD):
            return 'VERY_POSITIVE'

        # Positive: either revenue growth >20% OR margin expansion OR profit growth >20%
        if ((revenue_growth and revenue_growth >= self.REVENUE_GROWTH_THRESHOLD) or
            (margin_change and margin_change >= self.MARGIN_EXPANSION_THRESHOLD) or
            (profit_growth and profit_growth >= self.REVENUE_GROWTH_THRESHOLD)):
            return 'POSITIVE'

        # Very negative: revenue decline >20% OR profit decline >50%
        if ((revenue_growth and revenue_growth <= -self.REVENUE_GROWTH_THRESHOLD) or
            (profit_growth and profit_growth <= -50)):
            return 'VERY_NEGATIVE'

        # Negative: revenue decline >10% OR profit decline >20%
        if ((revenue_growth and revenue_growth <= -10) or
            (profit_growth and profit_growth <= -20)):
            return 'NEGATIVE'

        return 'NEUTRAL'

    def _categorize_news(self, title: str, summary: str, sentiment: str) -> Tuple[str, str]:
        """Auto-categorize news into event types"""
        text = (title + ' ' + (summary or '')).lower()

        # Check for specific event types
        if any(word in text for word in ['acquisition', 'acquire', 'merger', 'buyout']):
            return 'ACQUISITION', 'POSITIVE' if sentiment == 'POSITIVE' else 'NEUTRAL'

        if any(word in text for word in ['divestiture', 'sell', 'divest', 'exit']):
            return 'DIVESTITURE', 'NEUTRAL'

        if any(word in text for word in ['order', 'contract', 'win']):
            return 'ORDER_WIN', 'POSITIVE'

        if any(word in text for word in ['launch', 'product', 'new offering']):
            return 'PRODUCT_LAUNCH', 'POSITIVE'

        if any(word in text for word in ['expansion', 'plant', 'capex', 'facility']):
            return 'PLANT_EXPANSION', 'POSITIVE'

        if any(word in text for word in ['sebi', 'regulatory', 'notice', 'penalty']):
            return 'REGULATORY_ACTION', 'NEGATIVE'

        if any(word in text for word in ['rating', 'credit', 'upgrade', 'downgrade']):
            return 'CREDIT_RATING_CHANGE', 'POSITIVE' if sentiment == 'POSITIVE' else 'NEGATIVE'

        if any(word in text for word in ['management', 'ceo', 'cfo', 'resignation', 'appointed']):
            return 'MANAGEMENT_CHANGE', 'NEUTRAL'

        # Default to media coverage
        impact = {
            'POSITIVE': 'POSITIVE',
            'NEGATIVE': 'NEGATIVE',
            'NEUTRAL': 'NEUTRAL'
        }.get(sentiment, 'NEUTRAL')

        return 'MEDIA_COVERAGE', impact

    def _generate_financial_summary(
        self,
        company_id: str,
        result_row: Any,
        revenue_growth: Optional[float],
        profit_growth: Optional[float],
        margin_change: Optional[float]
    ) -> str:
        """Generate AI summary for financial results"""
        try:
            if not self.anthropic_client:
                return f"Q{result_row.fiscal_quarter} FY{result_row.fiscal_year} results published."

            # Build context
            context = f"""
            Financial Results Summary:
            - Quarter: Q{result_row.fiscal_quarter} FY{result_row.fiscal_year}
            - Revenue: ₹{float(result_row.revenue):.2f} Cr
            - Net Profit: ₹{float(result_row.net_profit):.2f} Cr
            - Operating Margin: {float(result_row.operating_margin):.2f}%
            - Net Margin: {float(result_row.net_margin):.2f}%
            """

            if revenue_growth:
                context += f"\n- Revenue Growth YoY: {revenue_growth:.2f}%"
            if profit_growth:
                context += f"\n- Profit Growth YoY: {profit_growth:.2f}%"
            if margin_change:
                context += f"\n- Margin Change: {margin_change:.2f}%"

            prompt = f"""Generate a concise 2-3 sentence summary of these quarterly results.
            Focus on key metrics and performance highlights.

            {context}

            Summary:"""

            response = self.anthropic_client.messages.create(
                model=self.model,
                max_tokens=200,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}]
            )

            return response.content[0].text.strip()

        except Exception as e:
            logger.error(f"Error generating financial summary: {e}")
            return f"Q{result_row.fiscal_quarter} FY{result_row.fiscal_year} results published."

    def _create_event(self, event_data: EventData) -> bool:
        """Create a stock event in the database"""
        try:
            with self.engine.begin() as conn:
                query = text("""
                    INSERT INTO stock_events (
                        id, company_id, event_type, event_date, impact_assessment,
                        title, description, metadata, source_id, source_type, created_at
                    ) VALUES (
                        gen_random_uuid(), :company_id, :event_type, :event_date, :impact_assessment,
                        :title, :description, :metadata::jsonb, :source_id, :source_type, NOW()
                    )
                """)

                conn.execute(query, {
                    'company_id': event_data.company_id,
                    'event_type': event_data.event_type,
                    'event_date': event_data.event_date,
                    'impact_assessment': event_data.impact_assessment,
                    'title': event_data.title,
                    'description': event_data.description,
                    'metadata': json.dumps(event_data.metadata),
                    'source_id': event_data.source_id,
                    'source_type': event_data.source_type
                })

                return True

        except Exception as e:
            logger.error(f"Error creating event: {e}", exc_info=True)
            return False

    # ============================================================
    # PERIOD SUMMARY GENERATION
    # ============================================================

    def generate_period_summary(self, company_id: str, period_type: str) -> Dict:
        """
        Generate AI summary for a period (monthly/quarterly/annual)

        Args:
            company_id: UUID of the company
            period_type: 'monthly', 'quarterly', or 'annual'

        Returns:
            dict: Summary generation results
        """
        logger.info(f"Generating {period_type} summary for company {company_id}")

        try:
            # Determine date range
            if period_type == 'monthly':
                days = 30
            elif period_type == 'quarterly':
                days = 90
            elif period_type == 'annual':
                days = 365
            else:
                raise ValueError(f"Invalid period_type: {period_type}")

            # Fetch events for the period
            with self.engine.connect() as conn:
                query = text("""
                    SELECT
                        event_type, event_date, impact_assessment,
                        title, description, metadata
                    FROM stock_events
                    WHERE company_id = :company_id
                    AND event_date >= NOW() - INTERVAL ':days days'
                    ORDER BY event_date DESC
                """)

                events = conn.execute(query, {
                    'company_id': company_id,
                    'days': days
                }).fetchall()

                # Get company info
                company_query = text("""
                    SELECT company_name, short_name
                    FROM companies
                    WHERE id = :company_id
                """)
                company = conn.execute(company_query, {'company_id': company_id}).fetchone()

            if not events:
                return {
                    'company_id': company_id,
                    'period_type': period_type,
                    'summary': 'No significant events in this period.',
                    'status': 'success'
                }

            # Generate AI summary
            summary = self._generate_period_summary_ai(company, events, period_type)

            return {
                'company_id': company_id,
                'period_type': period_type,
                'events_count': len(events),
                'summary': summary,
                'status': 'success'
            }

        except Exception as e:
            logger.error(f"Error generating period summary for {company_id}: {e}", exc_info=True)
            return {
                'company_id': company_id,
                'period_type': period_type,
                'status': 'error',
                'error': str(e)
            }

    def _generate_period_summary_ai(self, company: Any, events: List, period_type: str) -> str:
        """Generate AI summary for a period"""
        try:
            if not self.anthropic_client:
                return f"Summary of {len(events)} events in the {period_type} period."

            # Build event context
            event_context = ""
            for event in events[:20]:  # Limit to 20 most recent events
                event_context += f"\n- {event.event_date.strftime('%Y-%m-%d')}: {event.title} ({event.impact_assessment})"

            prompt = f"""Generate a comprehensive summary of key events for {company.company_name} over the {period_type} period.

Events:
{event_context}

Provide a 3-4 sentence summary highlighting:
1. Most significant events
2. Overall impact on the company
3. Key trends or patterns

Summary:"""

            response = self.anthropic_client.messages.create(
                model=self.model,
                max_tokens=500,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}]
            )

            return response.content[0].text.strip()

        except Exception as e:
            logger.error(f"Error generating AI period summary: {e}")
            return f"Summary of {len(events)} events in the {period_type} period."
