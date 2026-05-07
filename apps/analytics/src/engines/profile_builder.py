"""
Company Profile Builder Engine

Maintains comprehensive company profiles with 7 sections:
1. BUSINESS_MODEL - What they do, revenue segments, products, geography
2. COMPETITIVE_ADVANTAGE - Moat analysis, market position, differentiators
3. MANAGEMENT_QUALITY - Key persons, track record, promoter holding, governance
4. KEY_RISKS - Top 5-7 risks with severity, likelihood, impact
5. GROWTH_DRIVERS - Top 5 catalysts with timeline and confidence
6. REVENUE_BREAKDOWN - By product/segment, by geography, concentration risk
7. CORPORATE_HISTORY - Key milestones: founded, IPO, acquisitions, expansions

Each section:
- AI-generated using Claude API
- Stores version number, last_updated, source_urls
- Update triggers: quarterly results, management changes, new risks, etc.
"""
import os
import json
from typing import Dict, Optional, List, Any
from datetime import datetime, timedelta
from decimal import Decimal
from dataclasses import dataclass
import anthropic
from sqlalchemy import create_engine, text
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))
from utils.logger import logger, log_error, log_llm_api_call
from utils.llm_cost_tracker import log_llm_usage


@dataclass
class ProfileSection:
    """Profile section data structure"""
    section_type: str
    content: Dict
    version: int
    last_updated: datetime
    source_urls: List[str]
    confidence_level: str
    metadata: Dict


class CompanyProfileBuilder:
    """
    Company Profile Builder Engine

    Builds and maintains comprehensive company profiles with 7 key sections.
    Each section is AI-generated using structured data from multiple sources.
    """

    # Section types
    SECTION_TYPES = [
        'BUSINESS_MODEL',
        'COMPETITIVE_ADVANTAGE',
        'MANAGEMENT_QUALITY',
        'KEY_RISKS',
        'GROWTH_DRIVERS',
        'REVENUE_BREAKDOWN',
        'CORPORATE_HISTORY'
    ]

    # Update triggers
    UPDATE_TRIGGERS = {
        'BUSINESS_MODEL': ['financial_results', 'news_articles'],
        'COMPETITIVE_ADVANTAGE': ['news_articles', 'composite_scores'],
        'MANAGEMENT_QUALITY': ['shareholding_patterns', 'risk_flags', 'news_articles'],
        'KEY_RISKS': ['risk_flags', 'news_articles', 'composite_scores'],
        'GROWTH_DRIVERS': ['financial_results', 'news_articles', 'stock_events'],
        'REVENUE_BREAKDOWN': ['financial_results'],
        'CORPORATE_HISTORY': ['stock_events', 'news_articles']
    }

    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)

        # Initialize Anthropic client
        api_key = os.getenv('ANTHROPIC_API_KEY')
        self.anthropic_client = anthropic.Anthropic(api_key=api_key) if api_key else None
        self.model = "claude-sonnet-4-20250514"
        self.temperature = 0.3

    # ============================================================
    # MAIN PROFILE GENERATION METHODS
    # ============================================================

    def build_complete_profile(self, company_id: str) -> Dict:
        """
        Build complete company profile with all 7 sections

        Args:
            company_id: UUID of the company

        Returns:
            dict: Profile generation results
        """
        logger.info(f"Building complete profile for company {company_id}")

        try:
            results = {
                'company_id': company_id,
                'sections_generated': {},
                'total_sections': len(self.SECTION_TYPES),
                'success_count': 0,
                'error_count': 0
            }

            # Generate each section
            for section_type in self.SECTION_TYPES:
                try:
                    section = self.generate_section(company_id, section_type)
                    results['sections_generated'][section_type] = {
                        'status': 'success',
                        'version': section.version,
                        'last_updated': section.last_updated.isoformat()
                    }
                    results['success_count'] += 1
                except Exception as e:
                    logger.error(f"Error generating section {section_type}: {e}")
                    results['sections_generated'][section_type] = {
                        'status': 'error',
                        'error': str(e)
                    }
                    results['error_count'] += 1

            logger.info(f"Profile generation complete: {results['success_count']}/{results['total_sections']} sections")

            return {
                **results,
                'status': 'success' if results['success_count'] > 0 else 'error'
            }

        except Exception as e:
            logger.error(f"Error building profile for {company_id}: {e}", exc_info=True)
            return {
                'company_id': company_id,
                'status': 'error',
                'error': str(e)
            }

    def generate_section(self, company_id: str, section_type: str) -> ProfileSection:
        """
        Generate a specific profile section

        Args:
            company_id: UUID of the company
            section_type: Type of section to generate

        Returns:
            ProfileSection: Generated section
        """
        logger.info(f"Generating {section_type} section for company {company_id}")

        if section_type not in self.SECTION_TYPES:
            raise ValueError(f"Invalid section_type: {section_type}")

        # Build context for the section
        context = self._build_section_context(company_id, section_type)

        # Generate content using AI
        content, source_urls, confidence = self._generate_section_content(
            company_id, section_type, context
        )

        # Get current version
        current_version = self._get_current_version(company_id, section_type)

        # Create section
        section = ProfileSection(
            section_type=section_type,
            content=content,
            version=current_version + 1,
            last_updated=datetime.now(),
            source_urls=source_urls,
            confidence_level=confidence,
            metadata={
                'generated_at': datetime.now().isoformat(),
                'model': self.model,
                'data_points_used': len(context)
            }
        )

        # Save to database
        self._save_section(company_id, section)

        return section

    def update_section(self, company_id: str, section_type: str) -> ProfileSection:
        """
        Update an existing section (increments version)

        Args:
            company_id: UUID of the company
            section_type: Type of section to update

        Returns:
            ProfileSection: Updated section
        """
        logger.info(f"Updating {section_type} section for company {company_id}")
        return self.generate_section(company_id, section_type)

    def check_update_triggers(self, company_id: str) -> List[str]:
        """
        Check which sections need updating based on new data

        Args:
            company_id: UUID of the company

        Returns:
            list: Sections that need updating
        """
        sections_to_update = []

        try:
            with self.engine.connect() as conn:
                for section_type in self.SECTION_TYPES:
                    # Get last update time for this section
                    query = text("""
                        SELECT last_updated
                        FROM company_profiles
                        WHERE company_id = :company_id
                        AND section_type = :section_type
                        ORDER BY version DESC
                        LIMIT 1
                    """)

                    result = conn.execute(query, {
                        'company_id': company_id,
                        'section_type': section_type
                    }).fetchone()

                    last_updated = result.last_updated if result else None

                    # Check if update is needed based on triggers
                    if self._should_update_section(company_id, section_type, last_updated, conn):
                        sections_to_update.append(section_type)

            return sections_to_update

        except Exception as e:
            logger.error(f"Error checking update triggers for {company_id}: {e}", exc_info=True)
            return []

    # ============================================================
    # CONTEXT BUILDERS FOR EACH SECTION
    # ============================================================

    def _build_section_context(self, company_id: str, section_type: str) -> Dict:
        """Build context data for a specific section"""
        context_builders = {
            'BUSINESS_MODEL': self._build_business_model_context,
            'COMPETITIVE_ADVANTAGE': self._build_competitive_advantage_context,
            'MANAGEMENT_QUALITY': self._build_management_quality_context,
            'KEY_RISKS': self._build_key_risks_context,
            'GROWTH_DRIVERS': self._build_growth_drivers_context,
            'REVENUE_BREAKDOWN': self._build_revenue_breakdown_context,
            'CORPORATE_HISTORY': self._build_corporate_history_context
        }

        builder = context_builders.get(section_type)
        if not builder:
            raise ValueError(f"No context builder for section: {section_type}")

        return builder(company_id)

    def _build_business_model_context(self, company_id: str) -> Dict:
        """Build context for BUSINESS_MODEL section"""
        with self.engine.connect() as conn:
            # Get company info
            company_query = text("""
                SELECT
                    c.company_name, c.short_name, c.nse_symbol,
                    s.name as sector_name, i.name as industry_name,
                    c.listing_date, c.metadata
                FROM companies c
                JOIN sectors s ON c.sector_id = s.id
                JOIN industries i ON c.industry_id = i.id
                WHERE c.id = :company_id
            """)
            company = conn.execute(company_query, {'company_id': company_id}).fetchone()

            # Get recent financials
            financials_query = text("""
                SELECT
                    fiscal_year, fiscal_quarter, revenue, net_profit,
                    operating_margin, net_margin
                FROM financial_results
                WHERE company_id = :company_id
                AND period_type = 'QUARTERLY'
                ORDER BY fiscal_year DESC, fiscal_quarter DESC
                LIMIT 8
            """)
            financials = conn.execute(financials_query, {'company_id': company_id}).fetchall()

            # Get recent news
            news_query = text("""
                SELECT title, summary, published_at
                FROM news_articles
                WHERE company_id = :company_id
                AND published_at > NOW() - INTERVAL '90 days'
                ORDER BY published_at DESC
                LIMIT 10
            """)
            news = conn.execute(news_query, {'company_id': company_id}).fetchall()

            return {
                'company': company,
                'financials': financials,
                'news': news
            }

    def _build_competitive_advantage_context(self, company_id: str) -> Dict:
        """Build context for COMPETITIVE_ADVANTAGE section"""
        with self.engine.connect() as conn:
            # Get company info
            company_query = text("""
                SELECT
                    c.company_name, c.short_name,
                    s.name as sector_name, i.name as industry_name
                FROM companies c
                JOIN sectors s ON c.sector_id = s.id
                JOIN industries i ON c.industry_id = i.id
                WHERE c.id = :company_id
            """)
            company = conn.execute(company_query, {'company_id': company_id}).fetchone()

            # Get composite scores
            scores_query = text("""
                SELECT score_type, total_score, factor_breakdown
                FROM composite_scores
                WHERE company_id = :company_id
                ORDER BY computed_at DESC
                LIMIT 5
            """)
            scores = conn.execute(scores_query, {'company_id': company_id}).fetchall()

            # Get key financial ratios
            ratios_query = text("""
                SELECT
                    revenue, operating_margin, net_margin, eps
                FROM financial_results
                WHERE company_id = :company_id
                ORDER BY fiscal_year DESC, fiscal_quarter DESC
                LIMIT 8
            """)
            ratios = conn.execute(ratios_query, {'company_id': company_id}).fetchall()

            # Get positive news
            news_query = text("""
                SELECT title, summary, published_at
                FROM news_articles
                WHERE company_id = :company_id
                AND sentiment_label = 'POSITIVE'
                AND published_at > NOW() - INTERVAL '180 days'
                ORDER BY published_at DESC
                LIMIT 15
            """)
            news = conn.execute(news_query, {'company_id': company_id}).fetchall()

            return {
                'company': company,
                'scores': scores,
                'ratios': ratios,
                'news': news
            }

    def _build_management_quality_context(self, company_id: str) -> Dict:
        """Build context for MANAGEMENT_QUALITY section"""
        with self.engine.connect() as conn:
            # Get company info
            company_query = text("""
                SELECT company_name, short_name
                FROM companies
                WHERE id = :company_id
            """)
            company = conn.execute(company_query, {'company_id': company_id}).fetchone()

            # Get shareholding patterns
            shareholding_query = text("""
                SELECT
                    quarter, promoter_holding_pct, fii_holding_pct,
                    dii_holding_pct, pledge_pct
                FROM shareholding_patterns
                WHERE company_id = :company_id
                ORDER BY quarter DESC
                LIMIT 8
            """)
            shareholding = conn.execute(shareholding_query, {'company_id': company_id}).fetchall()

            # Get governance-related risk flags
            risk_query = text("""
                SELECT flag_type, severity, title, description, detected_at
                FROM risk_flags
                WHERE company_id = :company_id
                AND flag_type IN ('GOVERNANCE', 'RELATED_PARTY', 'AUDITOR_CONCERN')
                ORDER BY detected_at DESC
                LIMIT 5
            """)
            risks = conn.execute(risk_query, {'company_id': company_id}).fetchall()

            # Get management-related news
            news_query = text("""
                SELECT title, summary, published_at
                FROM news_articles
                WHERE company_id = :company_id
                AND (
                    LOWER(title) LIKE '%management%'
                    OR LOWER(title) LIKE '%ceo%'
                    OR LOWER(title) LIKE '%cfo%'
                    OR LOWER(title) LIKE '%director%'
                    OR LOWER(title) LIKE '%governance%'
                )
                AND published_at > NOW() - INTERVAL '1 year'
                ORDER BY published_at DESC
                LIMIT 10
            """)
            news = conn.execute(news_query, {'company_id': company_id}).fetchall()

            return {
                'company': company,
                'shareholding': shareholding,
                'risks': risks,
                'news': news
            }

    def _build_key_risks_context(self, company_id: str) -> Dict:
        """Build context for KEY_RISKS section"""
        with self.engine.connect() as conn:
            # Get company info
            company_query = text("""
                SELECT company_name, short_name
                FROM companies
                WHERE id = :company_id
            """)
            company = conn.execute(company_query, {'company_id': company_id}).fetchone()

            # Get all risk flags
            risk_query = text("""
                SELECT flag_type, severity, title, description, detected_at, metadata
                FROM risk_flags
                WHERE company_id = :company_id
                ORDER BY
                    CASE severity
                        WHEN 'HIGH' THEN 1
                        WHEN 'MEDIUM' THEN 2
                        WHEN 'LOW' THEN 3
                    END,
                    detected_at DESC
                LIMIT 15
            """)
            risks = conn.execute(risk_query, {'company_id': company_id}).fetchall()

            # Get risk score
            risk_score_query = text("""
                SELECT total_score, factor_breakdown
                FROM composite_scores
                WHERE company_id = :company_id
                AND score_type = 'risk'
                ORDER BY computed_at DESC
                LIMIT 1
            """)
            risk_score = conn.execute(risk_score_query, {'company_id': company_id}).fetchone()

            # Get negative news
            news_query = text("""
                SELECT title, summary, published_at, impact_rating
                FROM news_articles
                WHERE company_id = :company_id
                AND sentiment_label = 'NEGATIVE'
                AND published_at > NOW() - INTERVAL '180 days'
                ORDER BY
                    CASE impact_rating
                        WHEN 'HIGH' THEN 1
                        WHEN 'MEDIUM' THEN 2
                        WHEN 'LOW' THEN 3
                    END,
                    published_at DESC
                LIMIT 10
            """)
            news = conn.execute(news_query, {'company_id': company_id}).fetchall()

            return {
                'company': company,
                'risks': risks,
                'risk_score': risk_score,
                'news': news
            }

    def _build_growth_drivers_context(self, company_id: str) -> Dict:
        """Build context for GROWTH_DRIVERS section"""
        with self.engine.connect() as conn:
            # Get company info
            company_query = text("""
                SELECT company_name, short_name
                FROM companies
                WHERE id = :company_id
            """)
            company = conn.execute(company_query, {'company_id': company_id}).fetchone()

            # Get growth score
            growth_score_query = text("""
                SELECT total_score, factor_breakdown
                FROM composite_scores
                WHERE company_id = :company_id
                AND score_type = 'growth'
                ORDER BY computed_at DESC
                LIMIT 1
            """)
            growth_score = conn.execute(growth_score_query, {'company_id': company_id}).fetchone()

            # Get positive events
            events_query = text("""
                SELECT event_type, event_date, title, description, impact_assessment
                FROM stock_events
                WHERE company_id = :company_id
                AND impact_assessment IN ('POSITIVE', 'VERY_POSITIVE')
                AND event_date > NOW() - INTERVAL '1 year'
                ORDER BY event_date DESC
                LIMIT 15
            """)
            events = conn.execute(events_query, {'company_id': company_id}).fetchall()

            # Get positive news
            news_query = text("""
                SELECT title, summary, published_at
                FROM news_articles
                WHERE company_id = :company_id
                AND sentiment_label = 'POSITIVE'
                AND published_at > NOW() - INTERVAL '180 days'
                ORDER BY published_at DESC
                LIMIT 15
            """)
            news = conn.execute(news_query, {'company_id': company_id}).fetchall()

            # Get financial trends
            financials_query = text("""
                SELECT
                    fiscal_year, fiscal_quarter, revenue, net_profit,
                    operating_margin, eps
                FROM financial_results
                WHERE company_id = :company_id
                ORDER BY fiscal_year DESC, fiscal_quarter DESC
                LIMIT 12
            """)
            financials = conn.execute(financials_query, {'company_id': company_id}).fetchall()

            return {
                'company': company,
                'growth_score': growth_score,
                'events': events,
                'news': news,
                'financials': financials
            }

    def _build_revenue_breakdown_context(self, company_id: str) -> Dict:
        """Build context for REVENUE_BREAKDOWN section"""
        with self.engine.connect() as conn:
            # Get company info
            company_query = text("""
                SELECT company_name, short_name
                FROM companies
                WHERE id = :company_id
            """)
            company = conn.execute(company_query, {'company_id': company_id}).fetchone()

            # Get financial results with raw_data
            financials_query = text("""
                SELECT
                    fiscal_year, fiscal_quarter, revenue, net_profit,
                    operating_margin, raw_data
                FROM financial_results
                WHERE company_id = :company_id
                ORDER BY fiscal_year DESC, fiscal_quarter DESC
                LIMIT 12
            """)
            financials = conn.execute(financials_query, {'company_id': company_id}).fetchall()

            return {
                'company': company,
                'financials': financials
            }

    def _build_corporate_history_context(self, company_id: str) -> Dict:
        """Build context for CORPORATE_HISTORY section"""
        with self.engine.connect() as conn:
            # Get company info
            company_query = text("""
                SELECT company_name, short_name, listing_date, metadata
                FROM companies
                WHERE id = :company_id
            """)
            company = conn.execute(company_query, {'company_id': company_id}).fetchone()

            # Get major events
            events_query = text("""
                SELECT event_type, event_date, title, description, impact_assessment
                FROM stock_events
                WHERE company_id = :company_id
                AND event_type IN (
                    'ACQUISITION', 'DIVESTITURE', 'PLANT_EXPANSION',
                    'PRODUCT_LAUNCH', 'MANAGEMENT_CHANGE'
                )
                ORDER BY event_date DESC
                LIMIT 30
            """)
            events = conn.execute(events_query, {'company_id': company_id}).fetchall()

            # Get significant news
            news_query = text("""
                SELECT title, summary, published_at
                FROM news_articles
                WHERE company_id = :company_id
                AND impact_rating = 'HIGH'
                ORDER BY published_at DESC
                LIMIT 20
            """)
            news = conn.execute(news_query, {'company_id': company_id}).fetchall()

            return {
                'company': company,
                'events': events,
                'news': news
            }

    # ============================================================
    # AI CONTENT GENERATION
    # ============================================================

    def _generate_section_content(
        self,
        company_id: str,
        section_type: str,
        context: Dict
    ) -> Tuple[Dict, List[str], str]:
        """
        Generate section content using Claude API

        Returns:
            tuple: (content_dict, source_urls, confidence_level)
        """
        if not self.anthropic_client:
            return self._generate_fallback_content(section_type, context)

        try:
            prompt = self._build_section_prompt(section_type, context)

            start_time = datetime.now()

            response = self.anthropic_client.messages.create(
                model=self.model,
                max_tokens=2000,
                temperature=self.temperature,
                messages=[{"role": "user", "content": prompt}]
            )

            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

            # Log LLM usage
            log_llm_usage(
                model=self.model,
                prompt_tokens=response.usage.input_tokens,
                completion_tokens=response.usage.output_tokens,
                task_type='REPORT',
                company_id=company_id,
                duration_ms=duration_ms
            )

            content_text = response.content[0].text.strip()

            # Parse content (expecting structured format)
            content = self._parse_section_content(section_type, content_text, context)

            # Extract source URLs
            source_urls = self._extract_source_urls(context)

            # Determine confidence level
            confidence = self._assess_confidence(context, section_type)

            return content, source_urls, confidence

        except Exception as e:
            logger.error(f"Error generating section content: {e}", exc_info=True)
            return self._generate_fallback_content(section_type, context)

    def _build_section_prompt(self, section_type: str, context: Dict) -> str:
        """Build prompt for section generation"""
        prompts = {
            'BUSINESS_MODEL': self._build_business_model_prompt,
            'COMPETITIVE_ADVANTAGE': self._build_competitive_advantage_prompt,
            'MANAGEMENT_QUALITY': self._build_management_quality_prompt,
            'KEY_RISKS': self._build_key_risks_prompt,
            'GROWTH_DRIVERS': self._build_growth_drivers_prompt,
            'REVENUE_BREAKDOWN': self._build_revenue_breakdown_prompt,
            'CORPORATE_HISTORY': self._build_corporate_history_prompt
        }

        builder = prompts.get(section_type)
        if not builder:
            raise ValueError(f"No prompt builder for section: {section_type}")

        return builder(context)

    def _build_business_model_prompt(self, context: Dict) -> str:
        """Build prompt for BUSINESS_MODEL section"""
        company = context['company']
        financials = context.get('financials', [])
        news = context.get('news', [])

        prompt = f"""Generate a comprehensive business model overview for {company.company_name}.

Company Information:
- Sector: {company.sector_name}
- Industry: {company.industry_name}
- Listed Since: {company.listing_date.strftime('%Y') if company.listing_date else 'N/A'}

Recent Financial Performance:
"""
        for f in financials[:4]:
            prompt += f"\n- Q{f.fiscal_quarter} FY{f.fiscal_year}: Revenue ₹{float(f.revenue):.0f}Cr, Profit ₹{float(f.net_profit):.0f}Cr, Margin {float(f.operating_margin):.1f}%"

        if news:
            prompt += f"\n\nRecent News Highlights:\n"
            for n in news[:5]:
                prompt += f"- {n.title}\n"

        prompt += """

Provide a structured business model overview with:
1. Core Business: What they do, main products/services
2. Revenue Segments: Key revenue streams and their contribution
3. Geographic Presence: Major markets and geographic distribution
4. Business Characteristics: Asset-light/heavy, B2B/B2C, scale advantages

Format as JSON with keys: core_business, revenue_segments, geographic_presence, business_characteristics

JSON:"""

        return prompt

    def _build_competitive_advantage_prompt(self, context: Dict) -> str:
        """Build prompt for COMPETITIVE_ADVANTAGE section"""
        company = context['company']
        scores = context.get('scores', [])
        news = context.get('news', [])

        prompt = f"""Analyze the competitive advantages and market position of {company.company_name}.

Sector: {company.sector_name}
Industry: {company.industry_name}

"""
        if scores:
            prompt += "Composite Scores:\n"
            for s in scores:
                prompt += f"- {s.score_type.title()}: {float(s.total_score):.1f}/100\n"

        if news:
            prompt += "\nPositive News and Developments:\n"
            for n in news[:10]:
                prompt += f"- {n.title}\n"

        prompt += """

Provide a moat analysis covering:
1. Market Position: Market share, competitive standing
2. Key Differentiators: What sets them apart
3. Economic Moat: Sustainable competitive advantages
4. Competitive Threats: Main competitors and risks

Format as JSON with keys: market_position, key_differentiators, economic_moat, competitive_threats

JSON:"""

        return prompt

    def _build_management_quality_prompt(self, context: Dict) -> str:
        """Build prompt for MANAGEMENT_QUALITY section"""
        company = context['company']
        shareholding = context.get('shareholding', [])
        risks = context.get('risks', [])
        news = context.get('news', [])

        prompt = f"""Assess management quality and governance for {company.company_name}.

"""
        if shareholding:
            latest = shareholding[0]
            prompt += f"""Shareholding Pattern (Latest):
- Promoter Holding: {float(latest.promoter_holding_pct):.2f}%
- FII Holding: {float(latest.fii_holding_pct):.2f}%
- DII Holding: {float(latest.dii_holding_pct):.2f}%
- Promoter Pledge: {float(latest.pledge_pct):.2f}% if latest.pledge_pct else '0.00%'}

"""

        if risks:
            prompt += "Governance Concerns:\n"
            for r in risks:
                prompt += f"- {r.title} ({r.severity})\n"

        if news:
            prompt += "\nManagement-Related News:\n"
            for n in news[:5]:
                prompt += f"- {n.title}\n"

        prompt += """

Provide management quality assessment:
1. Key Management: CEO, CFO, and key leadership (if known)
2. Track Record: Historical performance and execution
3. Promoter Holding: Trend and skin in the game
4. Governance Quality: Transparency, board independence, related party transactions

Format as JSON with keys: key_management, track_record, promoter_holding_analysis, governance_quality

JSON:"""

        return prompt

    def _build_key_risks_prompt(self, context: Dict) -> str:
        """Build prompt for KEY_RISKS section"""
        company = context['company']
        risks = context.get('risks', [])
        risk_score = context.get('risk_score')
        news = context.get('news', [])

        prompt = f"""Identify and analyze the top 5-7 key risks for {company.company_name}.

"""
        if risk_score:
            prompt += f"Risk Score: {float(risk_score.total_score):.1f}/100\n\n"

        if risks:
            prompt += "Identified Risk Flags:\n"
            for r in risks:
                prompt += f"- {r.flag_type}: {r.title} ({r.severity})\n"

        if news:
            prompt += "\nNegative News:\n"
            for n in news[:5]:
                prompt += f"- {n.title}\n"

        prompt += """

Provide top 5-7 key risks with:
- Risk Name
- Severity: HIGH/MEDIUM/LOW
- Likelihood: HIGH/MEDIUM/LOW
- Impact Description
- Mitigation Factors (if any)

Format as JSON array with keys: risk_name, severity, likelihood, impact, mitigation

JSON:"""

        return prompt

    def _build_growth_drivers_prompt(self, context: Dict) -> str:
        """Build prompt for GROWTH_DRIVERS section"""
        company = context['company']
        growth_score = context.get('growth_score')
        events = context.get('events', [])
        news = context.get('news', [])

        prompt = f"""Identify the top 5 growth drivers and catalysts for {company.company_name}.

"""
        if growth_score:
            prompt += f"Growth Score: {float(growth_score.total_score):.1f}/100\n\n"

        if events:
            prompt += "Positive Events:\n"
            for e in events[:10]:
                prompt += f"- {e.title} ({e.event_date.strftime('%Y-%m-%d')})\n"

        if news:
            prompt += "\nPositive News:\n"
            for n in news[:10]:
                prompt += f"- {n.title}\n"

        prompt += """

Identify top 5 growth drivers with:
- Driver Name
- Timeline: SHORT_TERM (0-1 year), MEDIUM_TERM (1-3 years), LONG_TERM (3+ years)
- Confidence: HIGH/MEDIUM/LOW
- Impact Description
- Key Milestones

Format as JSON array with keys: driver_name, timeline, confidence, impact, milestones

JSON:"""

        return prompt

    def _build_revenue_breakdown_prompt(self, context: Dict) -> str:
        """Build prompt for REVENUE_BREAKDOWN section"""
        company = context['company']
        financials = context.get('financials', [])

        prompt = f"""Analyze revenue breakdown and diversification for {company.company_name}.

Recent Financial Results:
"""
        for f in financials[:8]:
            prompt += f"\n- Q{f.fiscal_quarter} FY{f.fiscal_year}: Revenue ₹{float(f.revenue):.0f}Cr"
            if f.raw_data:
                prompt += f" (Segment data: {json.dumps(f.raw_data) if isinstance(f.raw_data, dict) else f.raw_data})"

        prompt += """

Provide revenue breakdown analysis:
1. By Product/Segment: Main revenue segments and their contribution
2. By Geography: Geographic distribution of revenue
3. Concentration Risk: Customer/product concentration risks
4. Trends: Growth trends by segment

Format as JSON with keys: by_segment, by_geography, concentration_risk, trends

JSON:"""

        return prompt

    def _build_corporate_history_prompt(self, context: Dict) -> str:
        """Build prompt for CORPORATE_HISTORY section"""
        company = context['company']
        events = context.get('events', [])
        news = context.get('news', [])

        prompt = f"""Document the corporate history and key milestones for {company.company_name}.

"""
        if company.listing_date:
            prompt += f"Listed Since: {company.listing_date.strftime('%Y')}\n"

        if events:
            prompt += "\nMajor Events:\n"
            for e in events[:20]:
                prompt += f"- {e.event_date.strftime('%Y-%m-%d')}: {e.title}\n"

        if news:
            prompt += "\nSignificant News:\n"
            for n in news[:10]:
                prompt += f"- {n.published_at.strftime('%Y-%m-%d')}: {n.title}\n"

        prompt += """

Document key milestones chronologically:
- Founding/Incorporation
- IPO/Listing
- Major Acquisitions
- Significant Expansions
- Product Launches
- Strategic Shifts

Format as JSON array with keys: year, milestone_type, title, description

JSON:"""

        return prompt

    def _parse_section_content(self, section_type: str, content_text: str, context: Dict) -> Dict:
        """Parse AI-generated content into structured format"""
        try:
            # Try to parse as JSON
            # Remove any markdown code blocks
            if '```json' in content_text:
                content_text = content_text.split('```json')[1].split('```')[0].strip()
            elif '```' in content_text:
                content_text = content_text.split('```')[1].split('```')[0].strip()

            content = json.loads(content_text)
            return content
        except Exception as e:
            logger.error(f"Error parsing section content: {e}")
            # Return fallback structured content
            return {
                'raw_text': content_text,
                'parse_error': str(e)
            }

    def _generate_fallback_content(self, section_type: str, context: Dict) -> Tuple[Dict, List[str], str]:
        """Generate fallback content when AI is unavailable"""
        content = {
            'section_type': section_type,
            'status': 'fallback',
            'message': 'AI generation unavailable'
        }

        source_urls = self._extract_source_urls(context)
        confidence = 'LOW'

        return content, source_urls, confidence

    # ============================================================
    # HELPER METHODS
    # ============================================================

    def _extract_source_urls(self, context: Dict) -> List[str]:
        """Extract source URLs from context"""
        urls = []

        # Extract from news
        if 'news' in context:
            for news in context['news'][:5]:
                if hasattr(news, 'url') and news.url:
                    urls.append(news.url)

        return urls

    def _assess_confidence(self, context: Dict, section_type: str) -> str:
        """Assess confidence level based on data availability"""
        data_points = 0

        # Count available data points
        for key, value in context.items():
            if isinstance(value, list):
                data_points += len(value)
            elif value is not None:
                data_points += 1

        if data_points >= 20:
            return 'HIGH'
        elif data_points >= 10:
            return 'MEDIUM'
        else:
            return 'LOW'

    def _get_current_version(self, company_id: str, section_type: str) -> int:
        """Get current version number for a section"""
        try:
            with self.engine.connect() as conn:
                query = text("""
                    SELECT MAX(version) as max_version
                    FROM company_profiles
                    WHERE company_id = :company_id
                    AND section_type = :section_type
                """)

                result = conn.execute(query, {
                    'company_id': company_id,
                    'section_type': section_type
                }).fetchone()

                return result.max_version if result and result.max_version else 0

        except Exception as e:
            logger.error(f"Error getting current version: {e}")
            return 0

    def _save_section(self, company_id: str, section: ProfileSection) -> bool:
        """Save section to database"""
        try:
            with self.engine.begin() as conn:
                query = text("""
                    INSERT INTO company_profiles (
                        id, company_id, section_type, content, version,
                        last_updated, source_urls, confidence_level, metadata, created_at
                    ) VALUES (
                        gen_random_uuid(), :company_id, :section_type, :content::jsonb, :version,
                        :last_updated, :source_urls, :confidence_level, :metadata::jsonb, NOW()
                    )
                """)

                conn.execute(query, {
                    'company_id': company_id,
                    'section_type': section.section_type,
                    'content': json.dumps(section.content),
                    'version': section.version,
                    'last_updated': section.last_updated,
                    'source_urls': json.dumps(section.source_urls),
                    'confidence_level': section.confidence_level,
                    'metadata': json.dumps(section.metadata)
                })

                return True

        except Exception as e:
            logger.error(f"Error saving section: {e}", exc_info=True)
            return False

    def _should_update_section(
        self,
        company_id: str,
        section_type: str,
        last_updated: Optional[datetime],
        conn: Any
    ) -> bool:
        """Check if section should be updated based on triggers"""
        if not last_updated:
            return True  # Never generated, needs update

        # Check if data has changed since last update
        triggers = self.UPDATE_TRIGGERS.get(section_type, [])

        for trigger in triggers:
            if trigger == 'financial_results':
                # Check for new financial results
                query = text("""
                    SELECT COUNT(*) FROM financial_results
                    WHERE company_id = :company_id
                    AND published_at > :last_updated
                """)
                count = conn.execute(query, {
                    'company_id': company_id,
                    'last_updated': last_updated
                }).scalar()

                if count > 0:
                    return True

            elif trigger == 'news_articles':
                # Check for HIGH impact news
                query = text("""
                    SELECT COUNT(*) FROM news_articles
                    WHERE company_id = :company_id
                    AND published_at > :last_updated
                    AND impact_rating = 'HIGH'
                """)
                count = conn.execute(query, {
                    'company_id': company_id,
                    'last_updated': last_updated
                }).scalar()

                if count > 0:
                    return True

            elif trigger == 'risk_flags':
                # Check for new risk flags
                query = text("""
                    SELECT COUNT(*) FROM risk_flags
                    WHERE company_id = :company_id
                    AND detected_at > :last_updated
                """)
                count = conn.execute(query, {
                    'company_id': company_id,
                    'last_updated': last_updated
                }).scalar()

                if count > 0:
                    return True

        # Update if more than 90 days old
        if (datetime.now() - last_updated).days > 90:
            return True

        return False
