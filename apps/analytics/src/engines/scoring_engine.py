"""
Scoring Engine for Alpha Signal

Computes 5 composite scores (0-100) with full factor decomposition:
1. Quality Score - Financial health and operational excellence
2. Growth Score - Revenue and profit expansion
3. Risk Score - Financial and governance risks (higher = more risk)
4. Sentiment Score - Market sentiment and news
5. Momentum Score - Technical price momentum

Each score includes detailed factor breakdown for transparency.
"""
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
import numpy as np
from scipy import stats
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import os

logger = logging.getLogger(__name__)


@dataclass
class ScoreFactor:
    """Individual factor contribution to a score"""
    factor_name: str
    weight: float  # Percentage weight (0-100)
    raw_value: Optional[float]
    normalized_score: float  # 0-100
    weighted_contribution: float
    is_missing: bool = False


@dataclass
class CompositeScore:
    """A composite score with factor breakdown"""
    score_type: str
    total_score: float  # 0-100
    factors: List[ScoreFactor]
    computed_at: datetime
    company_id: str


class ScoringEngine:
    """
    Main scoring engine that computes all 5 composite scores
    """

    def __init__(self, db_url: Optional[str] = None):
        """Initialize scoring engine with database connection"""
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)

    def _get_computed_ratios(self, company_id: str) -> Optional[Dict]:
        """
        Fetch pre-computed ratios from company_metrics if available and fresh (<24h old)

        Returns:
            Dict of computed ratios if available and fresh, None otherwise
        """
        try:
            with self.engine.connect() as conn:
                query = text("""
                    SELECT computed_ratios, computation_timestamp
                    FROM company_metrics
                    WHERE company_id = :company_id
                """)
                result = conn.execute(query, {'company_id': company_id})
                row = result.fetchone()

                if not row:
                    return None

                # Check if ratios are fresh (< 24 hours old)
                computation_time = row.computation_timestamp
                age = datetime.now() - computation_time

                if age > timedelta(hours=24):
                    logger.info(f"Computed ratios for {company_id} are stale ({age.total_seconds()/3600:.1f}h old)")
                    return None

                logger.info(f"Using pre-computed ratios for {company_id} (age: {age.total_seconds()/3600:.1f}h)")
                return row.computed_ratios

        except Exception as e:
            logger.warning(f"Error fetching computed ratios: {e}")
            return None

    def _get_technical_indicators(self, company_id: str) -> Optional[Dict]:
        """
        Fetch latest technical indicators from technical_indicators table

        Returns:
            Dict of technical indicators if available, None otherwise
        """
        try:
            with self.engine.connect() as conn:
                query = text("""
                    SELECT *
                    FROM technical_indicators
                    WHERE company_id = :company_id
                    ORDER BY date DESC
                    LIMIT 1
                """)
                result = conn.execute(query, {'company_id': company_id})
                row = result.fetchone()

                if not row:
                    return None

                logger.info(f"Using pre-computed technical indicators for {company_id}")
                return dict(row._mapping)

        except Exception as e:
            logger.warning(f"Error fetching technical indicators: {e}")
            return None

    def compute_all_scores(self, company_id: str) -> Dict[str, CompositeScore]:
        """
        Compute all 5 scores for a company

        Args:
            company_id: UUID of the company

        Returns:
            Dictionary of score_type -> CompositeScore
        """
        logger.info(f"Computing all scores for company {company_id}")

        # Check for pre-computed ratios
        computed_ratios = self._get_computed_ratios(company_id)

        # Fetch all required data
        financial_data = self._fetch_financial_data(company_id)
        price_data = self._fetch_price_data(company_id)
        sentiment_data = self._fetch_sentiment_data(company_id)

        # Add computed ratios to financial_data if available
        if computed_ratios:
            financial_data['computed_ratios'] = computed_ratios

        # Compute each score
        scores = {
            'quality': self._compute_quality_score(company_id, financial_data),
            'growth': self._compute_growth_score(company_id, financial_data),
            'risk': self._compute_risk_score(company_id, financial_data),
            'sentiment': self._compute_sentiment_score(company_id, sentiment_data),
            'momentum': self._compute_momentum_score(company_id, price_data)
        }

        return scores

    # ============================================================================
    # SCORE 1: QUALITY SCORE
    # ============================================================================

    def _compute_quality_score(
        self,
        company_id: str,
        financial_data: Dict
    ) -> CompositeScore:
        """
        Compute Quality Score (0-100)

        Factors:
        - ROE Consistency (15%)
        - ROCE Level (15%)
        - Operating Margin Trend (10%)
        - Debt Discipline (15%)
        - Cash Flow Quality (15%)
        - Promoter Holding (10%)
        - Earnings Predictability (10%)
        - Capital Allocation (10%)
        """
        factors = []

        # Factor 1: ROE Consistency (15%)
        roe_score, roe_raw = self._factor_roe_consistency(financial_data)
        factors.append(ScoreFactor(
            factor_name="ROE Consistency",
            weight=15.0,
            raw_value=roe_raw,
            normalized_score=roe_score,
            weighted_contribution=roe_score * 0.15,
            is_missing=(roe_score == 0 and roe_raw is None)
        ))

        # Factor 2: ROCE Level (15%)
        roce_score, roce_raw = self._factor_roce_level(financial_data)
        factors.append(ScoreFactor(
            factor_name="ROCE Level",
            weight=15.0,
            raw_value=roce_raw,
            normalized_score=roce_score,
            weighted_contribution=roce_score * 0.15,
            is_missing=(roce_score == 0 and roce_raw is None)
        ))

        # Factor 3: Operating Margin Trend (10%)
        opm_score, opm_raw = self._factor_opm_trend(financial_data)
        factors.append(ScoreFactor(
            factor_name="Operating Margin Trend",
            weight=10.0,
            raw_value=opm_raw,
            normalized_score=opm_score,
            weighted_contribution=opm_score * 0.10,
            is_missing=(opm_score == 0 and opm_raw is None)
        ))

        # Factor 4: Debt Discipline (15%)
        debt_score, debt_raw = self._factor_debt_discipline(financial_data)
        factors.append(ScoreFactor(
            factor_name="Debt Discipline",
            weight=15.0,
            raw_value=debt_raw,
            normalized_score=debt_score,
            weighted_contribution=debt_score * 0.15,
            is_missing=(debt_score == 0 and debt_raw is None)
        ))

        # Factor 5: Cash Flow Quality (15%)
        cf_score, cf_raw = self._factor_cash_flow_quality(financial_data)
        factors.append(ScoreFactor(
            factor_name="Cash Flow Quality",
            weight=15.0,
            raw_value=cf_raw,
            normalized_score=cf_score,
            weighted_contribution=cf_score * 0.15,
            is_missing=(cf_score == 0 and cf_raw is None)
        ))

        # Factor 6: Promoter Holding (10%)
        promoter_score, promoter_raw = self._factor_promoter_holding(financial_data)
        factors.append(ScoreFactor(
            factor_name="Promoter Holding",
            weight=10.0,
            raw_value=promoter_raw,
            normalized_score=promoter_score,
            weighted_contribution=promoter_score * 0.10,
            is_missing=(promoter_score == 0 and promoter_raw is None)
        ))

        # Factor 7: Earnings Predictability (10%)
        predict_score, predict_raw = self._factor_earnings_predictability(financial_data)
        factors.append(ScoreFactor(
            factor_name="Earnings Predictability",
            weight=10.0,
            raw_value=predict_raw,
            normalized_score=predict_score,
            weighted_contribution=predict_score * 0.10,
            is_missing=(predict_score == 0 and predict_raw is None)
        ))

        # Factor 8: Capital Allocation (10%)
        capital_score, capital_raw = self._factor_capital_allocation(financial_data)
        factors.append(ScoreFactor(
            factor_name="Capital Allocation",
            weight=10.0,
            raw_value=capital_raw,
            normalized_score=capital_score,
            weighted_contribution=capital_score * 0.10,
            is_missing=(capital_score == 0 and capital_raw is None)
        ))

        # Handle missing data by redistributing weights
        factors = self._redistribute_weights(factors)

        # Calculate total score with 95-point cap (no company is perfect)
        total_score = sum(f.weighted_contribution for f in factors)
        total_score = np.clip(total_score, 0, 95)

        return CompositeScore(
            score_type='quality',
            total_score=total_score,
            factors=factors,
            computed_at=datetime.now(),
            company_id=company_id
        )

    def _factor_roe_consistency(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        ROE Consistency: 5Y average ROE + standard deviation
        >15% avg with low variance = 100; <8% = 0
        """
        try:
            quarterly_results = data.get('quarterly_results', [])
            if len(quarterly_results) < 4:
                return 0.0, None

            # Calculate ROE for each quarter (PAT / Equity)
            roes = []
            for q in quarterly_results[-20:]:  # Last 5 years (20 quarters)
                if q.get('net_profit') and q.get('total_equity'):
                    roe = (q['net_profit'] / q['total_equity']) * 100
                    if -50 < roe < 200:  # Sanity check
                        roes.append(roe)

            if len(roes) < 4:
                return 0.0, None

            avg_roe = np.mean(roes)
            std_roe = np.std(roes)
            cv = std_roe / avg_roe if avg_roe != 0 else 999

            # Score based on average and consistency
            if avg_roe >= 15 and cv < 0.3:
                score = 100
            elif avg_roe < 8:
                score = 0
            else:
                # Linear interpolation between 8% and 15%
                base_score = (avg_roe - 8) / (15 - 8) * 100
                # Penalty for high variability
                consistency_factor = max(0, 1 - cv)
                score = base_score * (0.7 + 0.3 * consistency_factor)

            return np.clip(score, 0, 100), avg_roe

        except Exception as e:
            logger.warning(f"Error computing ROE consistency: {e}")
            return 0.0, None

    def _factor_roce_level(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        ROCE Level: Latest TTM ROCE
        >20% = 100; <8% = 0
        """
        try:
            # Try using pre-computed ratios first
            computed_ratios = data.get('computed_ratios')
            if computed_ratios and computed_ratios.get('roce_ttm'):
                roce = float(computed_ratios['roce_ttm'])
            else:
                # Fall back to on-the-fly calculation
                latest = data.get('latest_ttm', {})
                if not latest.get('ebit') or not latest.get('capital_employed'):
                    return 0.0, None
                roce = (latest['ebit'] / latest['capital_employed']) * 100

            if roce >= 20:
                score = 100
            elif roce <= 8:
                score = 0
            else:
                # Linear interpolation
                score = (roce - 8) / (20 - 8) * 100

            return np.clip(score, 0, 100), roce

        except Exception as e:
            logger.warning(f"Error computing ROCE: {e}")
            return 0.0, None

    def _factor_opm_trend(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Operating Margin Trend: 3Y OPM slope via linear regression
        Positive slope = 80-100; flat = 50-80; negative = 0-50
        """
        try:
            # Try using pre-computed ratios first
            computed_ratios = data.get('computed_ratios')
            if computed_ratios and computed_ratios.get('operating_margin_trend_3y') is not None:
                slope = float(computed_ratios['operating_margin_trend_3y'])
            else:
                # Fall back to on-the-fly calculation
                return self._compute_opm_trend_fallback(data)

            # Score based on slope
            if slope > 0:
                # Positive trend: 80-100
                score = 80 + min(slope * 10, 20)  # Each 1% improvement = +10 points
            elif slope < 0:
                # Negative trend: 0-50
                score = 50 + (slope * 10)  # Each 1% decline = -10 points
            else:
                # Flat trend: 50-80
                score = 65

            return np.clip(score, 0, 100), slope

        except Exception as e:
            logger.warning(f"Error computing OPM trend: {e}")
            return 50.0, None

    def _compute_opm_trend_fallback(self, data: Dict) -> Tuple[float, Optional[float]]:
        """Fall back to on-the-fly OPM trend calculation"""
        try:
            quarterly_results = data.get('quarterly_results', [])
            if len(quarterly_results) < 12:  # Need 3 years
                return 50.0, 0.0  # Default to flat

            # Get last 12 quarters (3 years)
            recent = quarterly_results[-12:]
            opms = []
            for q in recent:
                if q.get('revenue') and q.get('ebitda') and q['revenue'] > 0:
                    opm = (q['ebitda'] / q['revenue']) * 100
                    opms.append(opm)

            if len(opms) < 8:
                return 50.0, 0.0

            # Linear regression to find slope
            x = np.arange(len(opms))
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, opms)

            # Score based on slope
            if slope > 0.5:  # Improving margins
                score = 80 + min(20, slope * 10)
            elif slope > -0.5:  # Flat margins
                score = 50 + (slope + 0.5) * 30
            else:  # Declining margins
                score = max(0, 50 + slope * 20)

            return np.clip(score, 0, 100), slope

        except Exception as e:
            logger.warning(f"Error computing OPM trend: {e}")
            return 50.0, 0.0

    def _factor_debt_discipline(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Debt Discipline: D/E ratio + interest coverage
        D/E <0.3 AND coverage >5x = 100; D/E >1.5 = 0
        """
        try:
            latest = data.get('latest_balance_sheet', {})
            if not latest:
                return 50.0, None

            total_debt = latest.get('total_debt', 0)
            total_equity = latest.get('total_equity', 1)
            ebit = data.get('latest_ttm', {}).get('ebit', 0)
            interest = data.get('latest_ttm', {}).get('interest_expense', 0)

            de_ratio = total_debt / total_equity if total_equity > 0 else 999
            interest_coverage = ebit / interest if interest > 0 else 999

            # Score D/E ratio (60% weight)
            if de_ratio < 0.3:
                de_score = 100
            elif de_ratio > 1.5:
                de_score = 0
            else:
                de_score = (1.5 - de_ratio) / 1.2 * 100

            # Score interest coverage (40% weight)
            if interest_coverage > 5:
                coverage_score = 100
            elif interest_coverage < 1:
                coverage_score = 0
            else:
                coverage_score = (interest_coverage - 1) / 4 * 100

            score = de_score * 0.6 + coverage_score * 0.4

            return np.clip(score, 0, 100), de_ratio

        except Exception as e:
            logger.warning(f"Error computing debt discipline: {e}")
            return 50.0, None

    def _factor_cash_flow_quality(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Cash Flow Quality: 3Y average OCF/PAT ratio
        >1.0 = 100; <0.5 = 0
        """
        try:
            # Try using pre-computed ratios first
            computed_ratios = data.get('computed_ratios')
            if computed_ratios and computed_ratios.get('ocf_to_pat_3y_avg'):
                avg_ratio = float(computed_ratios['ocf_to_pat_3y_avg'])
            else:
                # Fall back to on-the-fly calculation (will likely fail due to missing cashflow data)
                quarterly_results = data.get('quarterly_results', [])
                if len(quarterly_results) < 12:
                    return 50.0, None

                # Calculate OCF/PAT for last 12 quarters
                ratios = []
                for q in quarterly_results[-12:]:
                    ocf = q.get('operating_cash_flow')
                    pat = q.get('net_profit')
                    if ocf and pat and pat > 0:
                        ratio = ocf / pat
                        if 0 < ratio < 5:  # Sanity check
                            ratios.append(ratio)

                if not ratios:
                    return 50.0, None

                avg_ratio = np.mean(ratios)

            if avg_ratio >= 1.0:
                score = 100
            elif avg_ratio <= 0.5:
                score = 0
            else:
                score = (avg_ratio - 0.5) / 0.5 * 100

            return np.clip(score, 0, 100), avg_ratio

        except Exception as e:
            logger.warning(f"Error computing cash flow quality: {e}")
            return 50.0, None

    def _factor_promoter_holding(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Promoter Holding: Current % + 4-quarter trend
        >60% and stable/increasing = 100; <30% or declining = 0-30
        """
        try:
            shareholding = data.get('shareholding_pattern', [])
            if not shareholding:
                return 50.0, None

            # Get current and 4-quarter ago
            current = shareholding[0].get('promoter_holding', 0)

            if len(shareholding) >= 4:
                old = shareholding[3].get('promoter_holding', 0)
                trend = current - old
            else:
                trend = 0

            # Score based on level and trend
            if current >= 60 and trend >= 0:
                score = 100
            elif current < 30 or trend < -5:
                score = max(0, current * 0.5)
            else:
                level_score = (current - 30) / 30 * 70
                trend_bonus = max(0, min(30, trend * 10))
                score = level_score + trend_bonus

            return np.clip(score, 0, 100), current

        except Exception as e:
            logger.warning(f"Error computing promoter holding: {e}")
            return 50.0, None

    def _factor_earnings_predictability(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Earnings Predictability: Coefficient of variation of last 8 quarterly EPS
        Low CV = 100; high CV = 0
        """
        try:
            quarterly_results = data.get('quarterly_results', [])
            if len(quarterly_results) < 8:
                return 50.0, None

            eps_values = []
            for q in quarterly_results[-8:]:
                eps = q.get('eps')
                if eps is not None:
                    eps_values.append(eps)

            if len(eps_values) < 6:
                return 50.0, None

            mean_eps = np.mean(eps_values)
            std_eps = np.std(eps_values)
            cv = std_eps / abs(mean_eps) if mean_eps != 0 else 999

            # Lower CV = better predictability
            if cv < 0.15:
                score = 100
            elif cv > 0.8:
                score = 0
            else:
                score = (0.8 - cv) / 0.65 * 100

            return np.clip(score, 0, 100), cv

        except Exception as e:
            logger.warning(f"Error computing earnings predictability: {e}")
            return 50.0, None

    def _factor_capital_allocation(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Capital Allocation: FCF yield + dividend payout consistency
        High FCF yield + growing dividends = 100
        """
        try:
            latest_ttm = data.get('latest_ttm', {})
            market_cap = data.get('market_cap', 0)

            if not market_cap:
                return 50.0, None

            fcf = latest_ttm.get('free_cash_flow', 0)
            fcf_yield = (fcf / market_cap) * 100 if market_cap > 0 else 0

            # Check dividend consistency
            quarterly_results = data.get('quarterly_results', [])
            if len(quarterly_results) >= 4:
                dividends = [q.get('dividend_per_share', 0) for q in quarterly_results[-4:]]
                div_growing = all(dividends[i] >= dividends[i-1] for i in range(1, len(dividends)))
            else:
                div_growing = False

            # Score FCF yield (70%) and dividend growth (30%)
            if fcf_yield > 5:
                fcf_score = 100
            elif fcf_yield < 0:
                fcf_score = 0
            else:
                fcf_score = (fcf_yield / 5) * 100

            div_score = 100 if div_growing else 50

            score = fcf_score * 0.7 + div_score * 0.3

            return np.clip(score, 0, 100), fcf_yield

        except Exception as e:
            logger.warning(f"Error computing capital allocation: {e}")
            return 50.0, None

    # ============================================================================
    # SCORE 2: GROWTH SCORE
    # ============================================================================

    def _compute_growth_score(
        self,
        company_id: str,
        financial_data: Dict
    ) -> CompositeScore:
        """
        Compute Growth Score (0-100)

        Factors:
        - Revenue CAGR 5Y (25%)
        - Profit CAGR 5Y (25%)
        - Revenue Acceleration (15%)
        - Margin Expansion (15%)
        - Sector Growth Tailwind (10%)
        - Reinvestment Rate (10%)
        """
        factors = []

        # Factor 1: Revenue CAGR 5Y (25%)
        rev_score, rev_raw = self._factor_revenue_cagr(financial_data)
        factors.append(ScoreFactor(
            factor_name="Revenue CAGR 5Y",
            weight=25.0,
            raw_value=rev_raw,
            normalized_score=rev_score,
            weighted_contribution=rev_score * 0.25,
            is_missing=(rev_score == 0 and rev_raw is None)
        ))

        # Factor 2: Profit CAGR 5Y (25%)
        profit_score, profit_raw = self._factor_profit_cagr(financial_data)
        factors.append(ScoreFactor(
            factor_name="Profit CAGR 5Y",
            weight=25.0,
            raw_value=profit_raw,
            normalized_score=profit_score,
            weighted_contribution=profit_score * 0.25,
            is_missing=(profit_score == 0 and profit_raw is None)
        ))

        # Factor 3: Revenue Acceleration (15%)
        accel_score, accel_raw = self._factor_revenue_acceleration(financial_data)
        factors.append(ScoreFactor(
            factor_name="Revenue Acceleration",
            weight=15.0,
            raw_value=accel_raw,
            normalized_score=accel_score,
            weighted_contribution=accel_score * 0.15,
            is_missing=(accel_score == 0 and accel_raw is None)
        ))

        # Factor 4: Margin Expansion (15%)
        margin_score, margin_raw = self._factor_margin_expansion(financial_data)
        factors.append(ScoreFactor(
            factor_name="Margin Expansion",
            weight=15.0,
            raw_value=margin_raw,
            normalized_score=margin_score,
            weighted_contribution=margin_score * 0.15,
            is_missing=(margin_score == 0 and margin_raw is None)
        ))

        # Factor 5: Sector Growth Tailwind (10%)
        sector_score, sector_raw = self._factor_sector_growth(financial_data)
        factors.append(ScoreFactor(
            factor_name="Sector Growth Tailwind",
            weight=10.0,
            raw_value=sector_raw,
            normalized_score=sector_score,
            weighted_contribution=sector_score * 0.10,
            is_missing=(sector_score == 0 and sector_raw is None)
        ))

        # Factor 6: Reinvestment Rate (10%)
        reinvest_score, reinvest_raw = self._factor_reinvestment_rate(financial_data)
        factors.append(ScoreFactor(
            factor_name="Reinvestment Rate",
            weight=10.0,
            raw_value=reinvest_raw,
            normalized_score=reinvest_score,
            weighted_contribution=reinvest_score * 0.10,
            is_missing=(reinvest_score == 0 and reinvest_raw is None)
        ))

        # Handle missing data
        factors = self._redistribute_weights(factors)

        # Calculate total score with 95-point cap (no company is perfect)
        total_score = sum(f.weighted_contribution for f in factors)
        total_score = np.clip(total_score, 0, 95)

        return CompositeScore(
            score_type='growth',
            total_score=total_score,
            factors=factors,
            computed_at=datetime.now(),
            company_id=company_id
        )

    def _factor_revenue_cagr(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Revenue CAGR 5Y: >25% = 100; <5% = 0 (log-scaled)
        """
        try:
            # Try using pre-computed ratios first
            computed_ratios = data.get('computed_ratios')
            if computed_ratios and computed_ratios.get('revenue_cagr_5y') is not None:
                cagr = float(computed_ratios['revenue_cagr_5y'])
            else:
                # Fall back to on-the-fly calculation
                quarterly_results = data.get('quarterly_results', [])
                if len(quarterly_results) < 20:  # Need 5 years
                    return 50.0, None

                # Get revenue from 5 years ago and latest
                old_revenue = quarterly_results[-20].get('revenue', 0)
                new_revenue = quarterly_results[-1].get('revenue', 0)

                if old_revenue <= 0 or new_revenue <= 0:
                    return 50.0, None

                # Calculate CAGR
                cagr = (pow(new_revenue / old_revenue, 1/5) - 1) * 100

            # Log-scaled scoring
            if cagr >= 25:
                score = 100
            elif cagr <= 5:
                score = 0
            else:
                # Logarithmic scaling for better differentiation
                score = np.log(cagr / 5) / np.log(25 / 5) * 100

            return np.clip(score, 0, 100), cagr

        except Exception as e:
            logger.warning(f"Error computing revenue CAGR: {e}")
            return 50.0, None

    def _factor_profit_cagr(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Profit CAGR 5Y: >30% = 100; negative = 0
        """
        try:
            # Try using pre-computed ratios first
            computed_ratios = data.get('computed_ratios')
            if computed_ratios and computed_ratios.get('profit_cagr_5y') is not None:
                cagr = float(computed_ratios['profit_cagr_5y'])
            else:
                # Fall back to on-the-fly calculation
                quarterly_results = data.get('quarterly_results', [])
                if len(quarterly_results) < 20:
                    return 50.0, None

                old_profit = quarterly_results[-20].get('net_profit', 0)
                new_profit = quarterly_results[-1].get('net_profit', 0)

                if old_profit <= 0 or new_profit <= 0:
                    return 0.0, None

                cagr = (pow(new_profit / old_profit, 1/5) - 1) * 100

            if cagr >= 30:
                score = 100
            elif cagr <= 0:
                score = 0
            else:
                score = (cagr / 30) * 100

            return np.clip(score, 0, 100), cagr

        except Exception as e:
            logger.warning(f"Error computing profit CAGR: {e}")
            return 50.0, None

    def _factor_revenue_acceleration(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Revenue Acceleration: Latest quarter YoY vs 5Y CAGR
        Accelerating = bonus; decelerating = penalty
        """
        try:
            quarterly_results = data.get('quarterly_results', [])
            if len(quarterly_results) < 20:
                return 50.0, None

            # Latest quarter YoY growth
            latest_rev = quarterly_results[-1].get('revenue', 0)
            yoy_rev = quarterly_results[-4].get('revenue', 0)  # 4 quarters ago

            if yoy_rev <= 0:
                return 50.0, None

            yoy_growth = ((latest_rev / yoy_rev) - 1) * 100

            # 5Y CAGR
            old_rev = quarterly_results[-20].get('revenue', 0)
            if old_rev <= 0:
                return 50.0, None

            cagr = (pow(latest_rev / old_rev, 1/5) - 1) * 100

            # Compare acceleration
            acceleration = yoy_growth - cagr

            # Score: accelerating = 70-100, flat = 50, decelerating = 0-30
            if acceleration > 5:
                score = 70 + min(30, acceleration * 3)
            elif acceleration < -5:
                score = max(0, 50 + acceleration * 5)
            else:
                score = 50 + acceleration * 4

            return np.clip(score, 0, 100), acceleration

        except Exception as e:
            logger.warning(f"Error computing revenue acceleration: {e}")
            return 50.0, None

    def _factor_margin_expansion(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Margin Expansion: 3Y OPM/NPM trend slope
        Expanding = 80-100; contracting = 0-30
        """
        try:
            quarterly_results = data.get('quarterly_results', [])
            if len(quarterly_results) < 12:
                return 50.0, None

            # Calculate net margins for last 12 quarters
            margins = []
            for q in quarterly_results[-12:]:
                revenue = q.get('revenue', 0)
                profit = q.get('net_profit', 0)
                if revenue > 0:
                    margin = (profit / revenue) * 100
                    margins.append(margin)

            if len(margins) < 8:
                return 50.0, None

            # Linear regression for slope
            x = np.arange(len(margins))
            slope, _, _, _, _ = stats.linregress(x, margins)

            # Score based on slope
            if slope > 0.3:  # Expanding
                score = 80 + min(20, slope * 30)
            elif slope < -0.3:  # Contracting
                score = max(0, 30 + slope * 50)
            else:  # Stable
                score = 50 + slope * 100

            return np.clip(score, 0, 100), slope

        except Exception as e:
            logger.warning(f"Error computing margin expansion: {e}")
            return 50.0, None

    def _factor_sector_growth(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Sector Growth Tailwind: Sector revenue growth vs GDP growth
        >2x GDP = 100
        """
        try:
            # Placeholder: would need sector-level data
            # For now, use company's own growth as proxy
            sector_growth = data.get('sector_growth_rate', 7.0)  # Default GDP-like growth
            gdp_growth = 6.5  # India GDP growth assumption

            ratio = sector_growth / gdp_growth if gdp_growth > 0 else 1

            if ratio >= 2:
                score = 100
            elif ratio <= 0.5:
                score = 0
            else:
                score = (ratio - 0.5) / 1.5 * 100

            return np.clip(score, 0, 100), ratio

        except Exception as e:
            logger.warning(f"Error computing sector growth: {e}")
            return 50.0, None

    def _factor_reinvestment_rate(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Reinvestment Rate: Capex-to-depreciation
        >1.5 = investing for growth; <0.5 = harvesting
        """
        try:
            latest_ttm = data.get('latest_ttm', {})
            capex = abs(latest_ttm.get('capex', 0))
            depreciation = latest_ttm.get('depreciation', 0)

            if depreciation <= 0:
                return 50.0, None

            ratio = capex / depreciation

            # Higher reinvestment = better for growth score
            if ratio >= 1.5:
                score = 100
            elif ratio <= 0.5:
                score = 20
            else:
                score = 20 + (ratio - 0.5) / 1.0 * 80

            return np.clip(score, 0, 100), ratio

        except Exception as e:
            logger.warning(f"Error computing reinvestment rate: {e}")
            return 50.0, None

    # ============================================================================
    # SCORE 3: RISK SCORE (HIGHER = MORE RISK)
    # ============================================================================

    def _compute_risk_score(
        self,
        company_id: str,
        financial_data: Dict
    ) -> CompositeScore:
        """
        Compute Risk Score (0-100, HIGHER = MORE RISK)

        Factors:
        - Promoter Pledge (15%)
        - Debt-to-Equity Trend (15%)
        - Earnings Manipulation M-Score (15%)
        - Auditor Red Flags (10%)
        - Governance Score (10%)
        - Price Volatility (10%)
        - Liquidity Risk (10%)
        - Regulatory Exposure (15%)
        """
        factors = []

        # Factor 1: Promoter Pledge (15%)
        pledge_score, pledge_raw = self._factor_promoter_pledge(financial_data)
        factors.append(ScoreFactor(
            factor_name="Promoter Pledge",
            weight=15.0,
            raw_value=pledge_raw,
            normalized_score=pledge_score,
            weighted_contribution=pledge_score * 0.15,
            is_missing=(pledge_score == 0 and pledge_raw is None)
        ))

        # Factor 2: Debt-to-Equity Trend (15%)
        de_trend_score, de_trend_raw = self._factor_de_trend(financial_data)
        factors.append(ScoreFactor(
            factor_name="Debt-to-Equity Trend",
            weight=15.0,
            raw_value=de_trend_raw,
            normalized_score=de_trend_score,
            weighted_contribution=de_trend_score * 0.15,
            is_missing=(de_trend_score == 0 and de_trend_raw is None)
        ))

        # Factor 3: Earnings Manipulation M-Score (15%)
        mscore_score, mscore_raw = self._factor_mscore(financial_data)
        factors.append(ScoreFactor(
            factor_name="Earnings Manipulation M-Score",
            weight=15.0,
            raw_value=mscore_raw,
            normalized_score=mscore_score,
            weighted_contribution=mscore_score * 0.15,
            is_missing=(mscore_score == 0 and mscore_raw is None)
        ))

        # Factor 4: Auditor Red Flags (10%)
        auditor_score, auditor_raw = self._factor_auditor_flags(financial_data)
        factors.append(ScoreFactor(
            factor_name="Auditor Red Flags",
            weight=10.0,
            raw_value=auditor_raw,
            normalized_score=auditor_score,
            weighted_contribution=auditor_score * 0.10,
            is_missing=(auditor_score == 0 and auditor_raw is None)
        ))

        # Factor 5: Governance Score (10%)
        gov_score, gov_raw = self._factor_governance(financial_data)
        factors.append(ScoreFactor(
            factor_name="Governance Score",
            weight=10.0,
            raw_value=gov_raw,
            normalized_score=gov_score,
            weighted_contribution=gov_score * 0.10,
            is_missing=(gov_score == 0 and gov_raw is None)
        ))

        # Factor 6: Price Volatility (10%)
        vol_score, vol_raw = self._factor_price_volatility(financial_data)
        factors.append(ScoreFactor(
            factor_name="Price Volatility",
            weight=10.0,
            raw_value=vol_raw,
            normalized_score=vol_score,
            weighted_contribution=vol_score * 0.10,
            is_missing=(vol_score == 0 and vol_raw is None)
        ))

        # Factor 7: Liquidity Risk (10%)
        liq_score, liq_raw = self._factor_liquidity_risk(financial_data)
        factors.append(ScoreFactor(
            factor_name="Liquidity Risk",
            weight=10.0,
            raw_value=liq_raw,
            normalized_score=liq_score,
            weighted_contribution=liq_score * 0.10,
            is_missing=(liq_score == 0 and liq_raw is None)
        ))

        # Factor 8: Regulatory Exposure (15%)
        reg_score, reg_raw = self._factor_regulatory_exposure(financial_data)
        factors.append(ScoreFactor(
            factor_name="Regulatory Exposure",
            weight=15.0,
            raw_value=reg_raw,
            normalized_score=reg_score,
            weighted_contribution=reg_score * 0.15,
            is_missing=(reg_score == 0 and reg_raw is None)
        ))

        # Handle missing data
        factors = self._redistribute_weights(factors)

        # Calculate total score with 95-point cap (even for risk, cap at 95)
        total_score = sum(f.weighted_contribution for f in factors)
        total_score = np.clip(total_score, 0, 95)

        return CompositeScore(
            score_type='risk',
            total_score=total_score,
            factors=factors,
            computed_at=datetime.now(),
            company_id=company_id
        )

    def _factor_promoter_pledge(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Promoter Pledge: >20% pledged = 100 (high risk); 0% = 0
        """
        try:
            shareholding = data.get('shareholding_pattern', [])
            if not shareholding:
                return 0.0, None

            pledge_pct = shareholding[0].get('promoter_pledge_percentage', 0)

            if pledge_pct >= 20:
                score = 100
            else:
                score = (pledge_pct / 20) * 100

            return np.clip(score, 0, 100), pledge_pct

        except Exception as e:
            logger.warning(f"Error computing promoter pledge: {e}")
            return 0.0, None

    def _factor_de_trend(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Debt-to-Equity Trend: Increasing D/E over 3 years = higher risk
        """
        try:
            quarterly_results = data.get('quarterly_results', [])
            if len(quarterly_results) < 12:
                return 50.0, None

            # Calculate D/E ratios for last 12 quarters
            de_ratios = []
            for q in quarterly_results[-12:]:
                debt = q.get('total_debt', 0)
                equity = q.get('total_equity', 1)
                if equity > 0:
                    de_ratios.append(debt / equity)

            if len(de_ratios) < 8:
                return 50.0, None

            # Check trend
            x = np.arange(len(de_ratios))
            slope, _, _, _, _ = stats.linregress(x, de_ratios)

            # Increasing debt = higher risk score
            if slope > 0.05:  # Significantly increasing
                score = 80 + min(20, slope * 100)
            elif slope < -0.05:  # Decreasing
                score = max(0, 20 - slope * 100)
            else:  # Stable
                score = 40

            return np.clip(score, 0, 100), slope

        except Exception as e:
            logger.warning(f"Error computing D/E trend: {e}")
            return 50.0, None

    def _factor_mscore(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Earnings Manipulation M-Score (simplified Beneish)
        High M-Score = high risk
        """
        try:
            # Simplified M-Score calculation
            # Would need more detailed accounting data for full implementation
            quarterly_results = data.get('quarterly_results', [])
            if len(quarterly_results) < 8:
                return 50.0, None

            # Check for red flags in fundamentals
            latest = quarterly_results[-1]
            prev = quarterly_results[-4]

            # Days Sales Outstanding increase
            dso_current = (latest.get('receivables', 0) / latest.get('revenue', 1)) * 365
            dso_prev = (prev.get('receivables', 0) / prev.get('revenue', 1)) * 365
            dso_index = dso_current / dso_prev if dso_prev > 0 else 1

            # Asset Quality Index
            current_assets = latest.get('current_assets', 0)
            fixed_assets = latest.get('fixed_assets', 1)
            asset_quality = current_assets / fixed_assets if fixed_assets > 0 else 1

            # Simplified score
            if dso_index > 1.3 or asset_quality > 3:
                score = 80  # High manipulation risk
            elif dso_index > 1.1:
                score = 50  # Moderate risk
            else:
                score = 20  # Low risk

            return np.clip(score, 0, 100), dso_index

        except Exception as e:
            logger.warning(f"Error computing M-Score: {e}")
            return 50.0, None

    def _factor_auditor_flags(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Auditor Red Flags: Qualified opinions, auditor changes
        """
        try:
            # Placeholder: would need auditor data from database
            # Check metadata for auditor issues
            auditor_flags = data.get('auditor_flags', 0)

            score = min(100, auditor_flags * 25)

            return np.clip(score, 0, 100), float(auditor_flags)

        except Exception as e:
            logger.warning(f"Error computing auditor flags: {e}")
            return 0.0, None

    def _factor_governance(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Governance Score: Board independence %, related-party transactions
        Poor governance = high risk score
        """
        try:
            # Placeholder: would need governance data
            # Check for related party transaction volume
            latest_ttm = data.get('latest_ttm', {})
            revenue = latest_ttm.get('revenue', 0)
            rpt_volume = data.get('related_party_transactions', 0)

            if revenue > 0:
                rpt_ratio = rpt_volume / revenue
                if rpt_ratio > 0.20:  # >20% of revenue is RPT
                    score = 80
                elif rpt_ratio > 0.10:
                    score = 50
                else:
                    score = 20
            else:
                score = 50

            return np.clip(score, 0, 100), rpt_ratio if revenue > 0 else None

        except Exception as e:
            logger.warning(f"Error computing governance: {e}")
            return 50.0, None

    def _factor_price_volatility(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Price Volatility: 1Y annualized standard deviation
        Higher volatility = higher risk
        """
        try:
            price_data = data.get('price_history', [])
            if len(price_data) < 252:  # Need 1 year of daily data
                return 50.0, None

            # Calculate daily returns
            prices = [p['close'] for p in price_data[-252:]]
            returns = np.diff(prices) / prices[:-1]

            # Annualized volatility
            volatility = np.std(returns) * np.sqrt(252) * 100

            # Score: higher volatility = higher risk
            if volatility > 50:
                score = 100
            elif volatility < 15:
                score = 0
            else:
                score = (volatility - 15) / 35 * 100

            return np.clip(score, 0, 100), volatility

        except Exception as e:
            logger.warning(f"Error computing price volatility: {e}")
            return 50.0, None

    def _factor_liquidity_risk(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Liquidity Risk: Average daily traded value vs market cap
        Low liquidity = higher risk
        """
        try:
            market_cap = data.get('market_cap', 0)
            avg_daily_value = data.get('avg_daily_traded_value', 0)

            if market_cap <= 0:
                return 50.0, None

            liquidity_ratio = (avg_daily_value / market_cap) * 100

            # Low liquidity = high risk score
            if liquidity_ratio < 0.01:  # <0.01% traded daily
                score = 100
            elif liquidity_ratio > 0.5:  # >0.5% traded daily
                score = 0
            else:
                score = (0.5 - liquidity_ratio) / 0.49 * 100

            return np.clip(score, 0, 100), liquidity_ratio

        except Exception as e:
            logger.warning(f"Error computing liquidity risk: {e}")
            return 50.0, None

    def _factor_regulatory_exposure(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Regulatory Exposure: SEBI actions, NCLT proceedings
        """
        try:
            # Check for regulatory actions
            sebi_actions = data.get('sebi_actions_count', 0)
            nclt_cases = data.get('nclt_cases_count', 0)

            score = min(100, (sebi_actions * 30 + nclt_cases * 40))

            return np.clip(score, 0, 100), float(sebi_actions + nclt_cases)

        except Exception as e:
            logger.warning(f"Error computing regulatory exposure: {e}")
            return 0.0, None

    # ============================================================================
    # SCORE 4: SENTIMENT SCORE
    # ============================================================================

    def _compute_sentiment_score(
        self,
        company_id: str,
        sentiment_data: Dict
    ) -> CompositeScore:
        """
        Compute Sentiment Score (0-100)

        Factors:
        - News sentiment (40%)
        - Social sentiment (30%)
        - Analyst tone from concalls (20%)
        - Insider transaction signals (10%)
        """
        factors = []

        # Factor 1: News sentiment (40%)
        news_score, news_raw = self._factor_news_sentiment(sentiment_data)
        factors.append(ScoreFactor(
            factor_name="News Sentiment",
            weight=40.0,
            raw_value=news_raw,
            normalized_score=news_score,
            weighted_contribution=news_score * 0.40,
            is_missing=(news_score == 0 and news_raw is None)
        ))

        # Factor 2: Social sentiment (30%)
        social_score, social_raw = self._factor_social_sentiment(sentiment_data)
        factors.append(ScoreFactor(
            factor_name="Social Sentiment",
            weight=30.0,
            raw_value=social_raw,
            normalized_score=social_score,
            weighted_contribution=social_score * 0.30,
            is_missing=(social_score == 0 and social_raw is None)
        ))

        # Factor 3: Analyst tone (20%)
        analyst_score, analyst_raw = self._factor_analyst_tone(sentiment_data)
        factors.append(ScoreFactor(
            factor_name="Analyst Tone",
            weight=20.0,
            raw_value=analyst_raw,
            normalized_score=analyst_score,
            weighted_contribution=analyst_score * 0.20,
            is_missing=(analyst_score == 0 and analyst_raw is None)
        ))

        # Factor 4: Insider transactions (10%)
        insider_score, insider_raw = self._factor_insider_transactions(sentiment_data)
        factors.append(ScoreFactor(
            factor_name="Insider Transactions",
            weight=10.0,
            raw_value=insider_raw,
            normalized_score=insider_score,
            weighted_contribution=insider_score * 0.10,
            is_missing=(insider_score == 0 and insider_raw is None)
        ))

        # Handle missing data
        factors = self._redistribute_weights(factors)

        # Calculate total score with 95-point cap (no company is perfect)
        total_score = sum(f.weighted_contribution for f in factors)
        total_score = np.clip(total_score, 0, 95)

        return CompositeScore(
            score_type='sentiment',
            total_score=total_score,
            factors=factors,
            computed_at=datetime.now(),
            company_id=company_id
        )

    def _factor_news_sentiment(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        News sentiment: 7-day rolling weighted average
        """
        try:
            sentiment_snapshots = data.get('sentiment_snapshots', [])
            if not sentiment_snapshots:
                return 50.0, None

            # Get last 7 days of news sentiment
            recent = sentiment_snapshots[:7]
            news_sentiments = [s.get('news_sentiment', 0) for s in recent]

            if not news_sentiments:
                return 50.0, None

            # Weighted average (more recent = higher weight)
            weights = np.exp(np.linspace(0, 1, len(news_sentiments)))
            weighted_avg = np.average(news_sentiments, weights=weights)

            # Normalize from -1,1 to 0,100
            score = (weighted_avg + 1) * 50

            return np.clip(score, 0, 100), weighted_avg

        except Exception as e:
            logger.warning(f"Error computing news sentiment: {e}")
            return 50.0, None

    def _factor_social_sentiment(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Social sentiment: 7-day rolling weighted average
        """
        try:
            sentiment_snapshots = data.get('sentiment_snapshots', [])
            if not sentiment_snapshots:
                return 50.0, None

            recent = sentiment_snapshots[:7]
            social_sentiments = [s.get('social_sentiment', 0) for s in recent]

            if not social_sentiments:
                return 50.0, None

            weights = np.exp(np.linspace(0, 1, len(social_sentiments)))
            weighted_avg = np.average(social_sentiments, weights=weights)

            score = (weighted_avg + 1) * 50

            return np.clip(score, 0, 100), weighted_avg

        except Exception as e:
            logger.warning(f"Error computing social sentiment: {e}")
            return 50.0, None

    def _factor_analyst_tone(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Analyst tone from earnings calls
        """
        try:
            # Placeholder: would need concall sentiment data
            analyst_tone = data.get('latest_concall_sentiment', 0)

            score = (analyst_tone + 1) * 50

            return np.clip(score, 0, 100), analyst_tone

        except Exception as e:
            logger.warning(f"Error computing analyst tone: {e}")
            return 50.0, None

    def _factor_insider_transactions(self, data: Dict) -> Tuple[float, Optional[float]]:
        """
        Insider transaction signals: Net buying = positive
        """
        try:
            insider_txns = data.get('insider_transactions', [])
            if not insider_txns:
                return 50.0, None

            # Get last 3 months
            recent = insider_txns[:90]

            total_buy = sum(t.get('quantity', 0) for t in recent if t.get('transaction_type') == 'buy')
            total_sell = sum(t.get('quantity', 0) for t in recent if t.get('transaction_type') == 'sell')

            if total_buy + total_sell == 0:
                return 50.0, None

            net_ratio = (total_buy - total_sell) / (total_buy + total_sell)

            score = (net_ratio + 1) * 50

            return np.clip(score, 0, 100), net_ratio

        except Exception as e:
            logger.warning(f"Error computing insider transactions: {e}")
            return 50.0, None

    # ============================================================================
    # SCORE 5: MOMENTUM SCORE
    # ============================================================================

    def _compute_momentum_score(
        self,
        company_id: str,
        price_data: Dict
    ) -> CompositeScore:
        """
        Compute Momentum Score (0-100)

        Factors:
        - RSI-14 positioning (20%)
        - Price vs MA alignment (25%)
        - MACD trend (20%)
        - Volume confirmation (15%)
        - Relative strength vs Nifty 500 (20%)
        """
        # Try to get pre-computed technical indicators
        tech_indicators = self._get_technical_indicators(company_id)

        factors = []

        # Factor 1: RSI-14 (20%)
        rsi_score, rsi_raw = self._factor_rsi(price_data, tech_indicators)
        factors.append(ScoreFactor(
            factor_name="RSI-14 Positioning",
            weight=20.0,
            raw_value=rsi_raw,
            normalized_score=rsi_score,
            weighted_contribution=rsi_score * 0.20,
            is_missing=(rsi_score == 0 and rsi_raw is None)
        ))

        # Factor 2: MA alignment (25%)
        ma_score, ma_raw = self._factor_ma_alignment(price_data, tech_indicators)
        factors.append(ScoreFactor(
            factor_name="Price vs MA Alignment",
            weight=25.0,
            raw_value=ma_raw,
            normalized_score=ma_score,
            weighted_contribution=ma_score * 0.25,
            is_missing=(ma_score == 0 and ma_raw is None)
        ))

        # Factor 3: MACD trend (20%)
        macd_score, macd_raw = self._factor_macd(price_data, tech_indicators)
        factors.append(ScoreFactor(
            factor_name="MACD Trend",
            weight=20.0,
            raw_value=macd_raw,
            normalized_score=macd_score,
            weighted_contribution=macd_score * 0.20,
            is_missing=(macd_score == 0 and macd_raw is None)
        ))

        # Factor 4: Volume confirmation (15%)
        volume_score, volume_raw = self._factor_volume_confirmation(price_data, tech_indicators)
        factors.append(ScoreFactor(
            factor_name="Volume Confirmation",
            weight=15.0,
            raw_value=volume_raw,
            normalized_score=volume_score,
            weighted_contribution=volume_score * 0.15,
            is_missing=(volume_score == 0 and volume_raw is None)
        ))

        # Factor 5: Relative strength (20%)
        rs_score, rs_raw = self._factor_relative_strength(price_data, tech_indicators)
        factors.append(ScoreFactor(
            factor_name="Relative Strength vs Nifty 500",
            weight=20.0,
            raw_value=rs_raw,
            normalized_score=rs_score,
            weighted_contribution=rs_score * 0.20,
            is_missing=(rs_score == 0 and rs_raw is None)
        ))

        # Handle missing data
        factors = self._redistribute_weights(factors)

        # Calculate total score with 95-point cap (no company is perfect)
        total_score = sum(f.weighted_contribution for f in factors)
        total_score = np.clip(total_score, 0, 95)

        return CompositeScore(
            score_type='momentum',
            total_score=total_score,
            factors=factors,
            computed_at=datetime.now(),
            company_id=company_id
        )

    def _factor_rsi(self, data: Dict, tech_indicators: Optional[Dict] = None) -> Tuple[float, Optional[float]]:
        """
        RSI-14: 50-65 sweet spot scores highest
        """
        try:
            # Try using pre-computed technical indicators first
            if tech_indicators and tech_indicators.get('rsi_14'):
                rsi = float(tech_indicators['rsi_14'])
            else:
                # Fall back to on-the-fly calculation
                price_history = data.get('price_history', [])
                if len(price_history) < 30:
                    return 50.0, None

                # Calculate RSI
                closes = [p['close'] for p in price_history[-30:]]
                rsi = self._calculate_rsi(closes, period=14)

            if rsi is None:
                return 50.0, None

            # Score: 50-65 is sweet spot
            if 50 <= rsi <= 65:
                score = 100 - abs(rsi - 57.5) * 2
            elif rsi < 30:
                score = 20  # Oversold
            elif rsi > 70:
                score = 30  # Overbought
            else:
                score = 50 + (rsi - 50) * 2 if rsi < 50 else 50 + (65 - rsi) * 2

            return np.clip(score, 0, 100), rsi

        except Exception as e:
            logger.warning(f"Error computing RSI: {e}")
            return 50.0, None

    def _factor_ma_alignment(self, data: Dict, tech_indicators: Optional[Dict] = None) -> Tuple[float, Optional[float]]:
        """
        Price vs MA alignment: All MAs aligned bullishly = 100
        """
        try:
            # Try using pre-computed technical indicators first
            if tech_indicators:
                current_price = data.get('price_history', [{}])[-1].get('close') if data.get('price_history') else None
                ma20 = tech_indicators.get('sma_20')
                ma50 = tech_indicators.get('sma_50')
                ma200 = tech_indicators.get('sma_200')

                if current_price and ma20 and ma50:
                    # Check alignment
                    score = 0
                    if current_price > float(ma20):
                        score += 25
                    if float(ma20) > float(ma50):
                        score += 25
                    if ma200 and float(ma50) > float(ma200):
                        score += 25
                    if ma200 and current_price > float(ma200):
                        score += 25

                    return np.clip(score, 0, 100), score

            # Fall back to on-the-fly calculation
            price_history = data.get('price_history', [])
            if len(price_history) < 200:
                return 50.0, None

            current_price = price_history[-1]['close']

            # Calculate MAs
            closes = [p['close'] for p in price_history]
            ma20 = np.mean(closes[-20:])
            ma50 = np.mean(closes[-50:])
            ma200 = np.mean(closes[-200:])

            # Check alignment
            score = 0
            if current_price > ma20:
                score += 25
            if ma20 > ma50:
                score += 25
            if ma50 > ma200:
                score += 25
            if current_price > ma200:
                score += 25

            return np.clip(score, 0, 100), score

        except Exception as e:
            logger.warning(f"Error computing MA alignment: {e}")
            return 50.0, None

    def _factor_macd(self, data: Dict, tech_indicators: Optional[Dict] = None) -> Tuple[float, Optional[float]]:
        """
        MACD trend: MACD above signal and rising = 100
        """
        try:
            # Try using pre-computed technical indicators first
            if tech_indicators:
                macd_line = tech_indicators.get('macd')
                signal_line = tech_indicators.get('macd_signal')
                macd_histogram = tech_indicators.get('macd_histogram')

                if macd_line is not None and signal_line is not None:
                    macd_line = float(macd_line)
                    signal_line = float(signal_line)

                    # Check if MACD is above signal and histogram positive (rising)
                    if macd_line > signal_line:
                        if macd_histogram and float(macd_histogram) > 0:
                            score = 100
                        else:
                            score = 70
                    elif macd_line < signal_line:
                        score = 30
                    else:
                        score = 50

                    return np.clip(score, 0, 100), macd_line

            # Fall back to on-the-fly calculation
            price_history = data.get('price_history', [])
            if len(price_history) < 50:
                return 50.0, None

            closes = [p['close'] for p in price_history[-50:]]

            # Calculate MACD
            ema12 = self._calculate_ema(closes, 12)
            ema26 = self._calculate_ema(closes, 26)
            macd_line = ema12[-1] - ema26[-1]

            # Signal line (9-period EMA of MACD)
            macd_values = ema12[-9:] - ema26[-9:]
            signal_line = np.mean(macd_values)

            # Check if MACD is above signal and rising
            if macd_line > signal_line:
                if len(macd_values) > 2 and macd_values[-1] > macd_values[-2]:
                    score = 100
                else:
                    score = 70
            else:
                score = 30

            return np.clip(score, 0, 100), macd_line - signal_line

        except Exception as e:
            logger.warning(f"Error computing MACD: {e}")
            return 50.0, None

    def _factor_volume_confirmation(self, data: Dict, tech_indicators: Optional[Dict] = None) -> Tuple[float, Optional[float]]:
        """
        Volume confirmation: Rising OBV + above-average volume
        """
        try:
            # Try using pre-computed technical indicators first
            if tech_indicators:
                obv = tech_indicators.get('obv')
                volume_sma = tech_indicators.get('volume_sma_20')

                if obv is not None and volume_sma is not None:
                    # For OBV trend, we'd need historical data, so fall back for that
                    # But we can use volume comparison
                    price_history = data.get('price_history', [])
                    if price_history:
                        current_volume = price_history[-1].get('volume', 0)
                        volume_above_avg = current_volume > (float(volume_sma) * 1.2)

                        # Simplified scoring since we don't have OBV trend
                        score = 50  # Neutral
                        if volume_above_avg:
                            score += 40

                        return np.clip(score, 0, 100), current_volume

            # Fall back to on-the-fly calculation
            price_history = data.get('price_history', [])
            if len(price_history) < 30:
                return 50.0, None

            # Calculate OBV
            obv = self._calculate_obv(price_history[-30:])

            # Check if OBV is rising
            obv_trend = obv[-1] > obv[-5] if len(obv) >= 5 else False

            # Check average volume
            volumes = [p.get('volume', 0) for p in price_history[-30:]]
            avg_volume = np.mean(volumes[:-1])
            current_volume = volumes[-1]

            volume_above_avg = current_volume > avg_volume * 1.2

            # Score
            score = 0
            if obv_trend:
                score += 60
            if volume_above_avg:
                score += 40

            return np.clip(score, 0, 100), current_volume / avg_volume if avg_volume > 0 else None

        except Exception as e:
            logger.warning(f"Error computing volume confirmation: {e}")
            return 50.0, None

    def _factor_relative_strength(self, data: Dict, tech_indicators: Optional[Dict] = None) -> Tuple[float, Optional[float]]:
        """
        Relative strength vs Nifty 500: Multi-timeframe
        """
        try:
            # Placeholder: would need Nifty 500 data for comparison
            # For now, use stock's own momentum as proxy
            price_history = data.get('price_history', [])
            if len(price_history) < 63:  # 3 months
                return 50.0, None

            # 1-month and 3-month returns
            price_1m = price_history[-21]['close']
            price_3m = price_history[-63]['close']
            current = price_history[-1]['close']

            return_1m = ((current / price_1m) - 1) * 100
            return_3m = ((current / price_3m) - 1) * 100

            # Weighted score (daily 60%, weekly 40%)
            score_1m = min(100, max(0, 50 + return_1m * 2))
            score_3m = min(100, max(0, 50 + return_3m))

            score = score_1m * 0.6 + score_3m * 0.4

            return np.clip(score, 0, 100), return_1m

        except Exception as e:
            logger.warning(f"Error computing relative strength: {e}")
            return 50.0, None

    # ============================================================================
    # HELPER METHODS
    # ============================================================================

    def _calculate_rsi(self, prices: List[float], period: int = 14) -> Optional[float]:
        """Calculate RSI indicator"""
        try:
            if len(prices) < period + 1:
                return None

            deltas = np.diff(prices)
            gains = np.where(deltas > 0, deltas, 0)
            losses = np.where(deltas < 0, -deltas, 0)

            avg_gain = np.mean(gains[-period:])
            avg_loss = np.mean(losses[-period:])

            if avg_loss == 0:
                return 100

            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))

            return rsi

        except Exception as e:
            logger.warning(f"Error calculating RSI: {e}")
            return None

    def _calculate_ema(self, prices: List[float], period: int) -> np.ndarray:
        """Calculate Exponential Moving Average"""
        prices_array = np.array(prices)
        ema = np.zeros_like(prices_array)
        ema[0] = prices_array[0]

        multiplier = 2 / (period + 1)

        for i in range(1, len(prices_array)):
            ema[i] = (prices_array[i] - ema[i-1]) * multiplier + ema[i-1]

        return ema

    def _calculate_obv(self, price_data: List[Dict]) -> np.ndarray:
        """Calculate On-Balance Volume"""
        obv = np.zeros(len(price_data))
        obv[0] = price_data[0].get('volume', 0)

        for i in range(1, len(price_data)):
            if price_data[i]['close'] > price_data[i-1]['close']:
                obv[i] = obv[i-1] + price_data[i].get('volume', 0)
            elif price_data[i]['close'] < price_data[i-1]['close']:
                obv[i] = obv[i-1] - price_data[i].get('volume', 0)
            else:
                obv[i] = obv[i-1]

        return obv

    def _redistribute_weights(self, factors: List[ScoreFactor]) -> List[ScoreFactor]:
        """
        Redistribute weights proportionally when factors are missing
        """
        missing_weight = sum(f.weight for f in factors if f.is_missing)

        if missing_weight == 0:
            return factors

        available_factors = [f for f in factors if not f.is_missing]

        if not available_factors:
            # All factors missing - return as is
            return factors

        # Calculate total available weight
        available_weight = sum(f.weight for f in available_factors)

        # Redistribute
        redistribution_factor = (100 - missing_weight + available_weight) / available_weight

        updated_factors = []
        for f in factors:
            if f.is_missing:
                updated_factors.append(f)
            else:
                new_weight = f.weight * redistribution_factor
                new_contribution = f.normalized_score * (new_weight / 100)
                updated_factors.append(ScoreFactor(
                    factor_name=f.factor_name,
                    weight=new_weight,
                    raw_value=f.raw_value,
                    normalized_score=f.normalized_score,
                    weighted_contribution=new_contribution,
                    is_missing=False
                ))

        return updated_factors

    # ============================================================================
    # DATA FETCHING METHODS
    # ============================================================================

    def _fetch_financial_data(self, company_id: str) -> Dict:
        """Fetch financial data from database"""
        with self.engine.connect() as conn:
            # Fetch quarterly results
            query = text("""
                SELECT
                    published_at,
                    fiscal_year,
                    fiscal_quarter,
                    revenue,
                    operating_profit,
                    net_profit,
                    eps,
                    operating_margin,
                    net_margin
                FROM financial_results
                WHERE company_id = :company_id
                ORDER BY published_at DESC
                LIMIT 40
            """)
            result = conn.execute(query, {'company_id': company_id})
            quarterly_results = [dict(row._mapping) for row in result]

            # Fetch balance sheet data
            query = text("""
                SELECT
                    fiscal_year,
                    fiscal_quarter,
                    total_assets,
                    total_debt,
                    equity,
                    cash_equivalents,
                    current_ratio,
                    debt_to_equity,
                    interest_coverage
                FROM balance_sheet_data
                WHERE company_id = :company_id
                ORDER BY fiscal_year DESC, fiscal_quarter DESC
                LIMIT 20
            """)
            result = conn.execute(query, {'company_id': company_id})
            balance_sheets = [dict(row._mapping) for row in result]

            # Get company info
            query = text("""
                SELECT
                    company_name,
                    nse_symbol,
                    sector_id
                FROM companies
                WHERE id = :company_id
            """)
            result = conn.execute(query, {'company_id': company_id})
            company_info = dict(result.fetchone()._mapping)

            # Calculate TTM metrics
            latest_ttm = {}
            if len(quarterly_results) >= 4:
                latest_ttm = {
                    'revenue': sum(float(q['revenue'] or 0) for q in quarterly_results[:4]),
                    'operating_profit': sum(float(q['operating_profit'] or 0) for q in quarterly_results[:4]),
                    'ebit': sum(float(q['operating_profit'] or 0) for q in quarterly_results[:4]),  # Use operating_profit as EBIT proxy
                    'net_profit': sum(float(q['net_profit'] or 0) for q in quarterly_results[:4]),
                }

                # Calculate ROCE components
                if balance_sheets:
                    latest_bs = balance_sheets[0]
                    capital_employed = float(latest_bs['total_assets'] or 0) - float(latest_bs['total_debt'] or 0)
                    latest_ttm['capital_employed'] = capital_employed
                    latest_ttm['interest_expense'] = 0  # Not available, placeholder

            # Combine equity from balance sheet with quarterly results
            for q in quarterly_results:
                # Match by fiscal year and quarter
                for bs in balance_sheets:
                    if (q.get('fiscal_year') == bs.get('fiscal_year') and
                        q.get('fiscal_quarter') == bs.get('fiscal_quarter')):
                        q['total_equity'] = float(bs['equity'] or 0)
                        q['total_debt'] = float(bs['total_debt'] or 0)
                        q['total_assets'] = float(bs['total_assets'] or 0)
                        q['debt_to_equity'] = float(bs['debt_to_equity'] or 0)
                        q['interest_coverage'] = float(bs['interest_coverage'] or 0)
                        break

                # Calculate EBITDA as proxy (operating_profit + depreciation estimate)
                q['ebitda'] = float(q.get('operating_profit') or 0) * 1.15  # Rough estimate
                q['ebit'] = float(q.get('operating_profit') or 0)

            return {
                'company_info': company_info,
                'quarterly_results': quarterly_results,
                'balance_sheets': balance_sheets,
                'latest_ttm': latest_ttm,
                'latest_balance_sheet': balance_sheets[0] if balance_sheets else {},
                'shareholding_pattern': [],  # Would fetch from shareholding table
                'sector_growth_rate': 8.5,  # Placeholder
                'market_cap': 50000000000,  # Placeholder
                'auditor_flags': 0,
                'related_party_transactions': 0,
                'sebi_actions_count': 0,
                'nclt_cases_count': 0,
            }

    def _fetch_price_data(self, company_id: str) -> Dict:
        """Fetch price data from database"""
        return {
            'price_history': [],  # Would fetch from price_data table
            'avg_daily_traded_value': 100000000,  # Placeholder
        }

    def _fetch_sentiment_data(self, company_id: str) -> Dict:
        """Fetch sentiment data from database"""
        try:
            with self.engine.connect() as conn:
                # Fetch sentiment snapshots from last 7 days
                query = text("""
                    SELECT
                        date,
                        news_sentiment,
                        social_sentiment,
                        composite_sentiment,
                        sample_size
                    FROM sentiment_snapshots
                    WHERE company_id = :company_id
                    ORDER BY date DESC
                    LIMIT 7
                """)
                result = conn.execute(query, {'company_id': company_id})
                snapshots = [dict(row._mapping) for row in result]

                return {
                    'sentiment_snapshots': snapshots,
                    'insider_transactions': [],
                    'latest_concall_sentiment': 0.1,
                }

        except Exception as e:
            logger.warning(f"Error fetching sentiment data for {company_id}: {e}")
            return {
                'sentiment_snapshots': [],
                'insider_transactions': [],
                'latest_concall_sentiment': 0.1,
            }
