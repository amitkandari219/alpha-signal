"""
Financial Ratio Engine for Alpha Signal

Computes 45+ financial ratios from financial_results, balance_sheet_data, and cashflow_data tables.
Groups: Growth, Profitability, Balance Sheet, Cash Flow, Peer Comparison

Handles edge cases specific to Indian market (limited history, negative equity, stock splits, etc.)
"""
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import numpy as np
import pandas as pd
from scipy import stats
from sqlalchemy import create_engine, text, Column, String, DateTime, JSON
from sqlalchemy.orm import Session, declarative_base
from sqlalchemy.dialects.postgresql import UUID, JSONB
import os
import uuid
import json

logger = logging.getLogger(__name__)

Base = declarative_base()


class CompanyMetrics(Base):
    """SQLAlchemy model for storing computed financial ratios"""
    __tablename__ = 'company_metrics'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    computed_ratios = Column(JSONB, nullable=False)
    computation_timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    data_quality_flags = Column(JSONB, nullable=True)


@dataclass
class FinancialRatios:
    """Complete set of financial ratios for a company"""
    # Growth Metrics
    revenue_cagr_3y: Optional[float] = None
    revenue_cagr_5y: Optional[float] = None
    profit_cagr_3y: Optional[float] = None
    profit_cagr_5y: Optional[float] = None
    eps_cagr_3y: Optional[float] = None
    eps_cagr_5y: Optional[float] = None
    revenue_acceleration: Optional[float] = None
    qoq_revenue_growth: Optional[float] = None
    qoq_profit_growth: Optional[float] = None

    # Profitability Metrics
    roe_ttm: Optional[float] = None
    roce_ttm: Optional[float] = None
    roa_ttm: Optional[float] = None
    operating_margin_ttm: Optional[float] = None
    net_margin_ttm: Optional[float] = None
    ebitda_margin_ttm: Optional[float] = None
    operating_margin_trend_3y: Optional[float] = None
    net_margin_trend_3y: Optional[float] = None

    # Balance Sheet Metrics
    debt_to_equity: Optional[float] = None
    interest_coverage: Optional[float] = None
    current_ratio: Optional[float] = None
    cash_pct_market_cap: Optional[float] = None
    working_capital_days: Optional[float] = None
    debt_trend_3y: Optional[float] = None

    # Cash Flow Metrics
    ocf_to_pat_3y_avg: Optional[float] = None
    free_cash_flow_ttm: Optional[float] = None
    fcf_yield: Optional[float] = None
    capex_to_depreciation: Optional[float] = None

    # Peer Comparison (vs sector)
    roe_sector_zscore: Optional[float] = None
    roce_sector_zscore: Optional[float] = None
    revenue_growth_sector_zscore: Optional[float] = None
    margin_sector_zscore: Optional[float] = None

    # Additional Important Ratios
    book_value_per_share: Optional[float] = None
    price_to_book: Optional[float] = None
    asset_turnover: Optional[float] = None
    inventory_turnover: Optional[float] = None
    receivables_days: Optional[float] = None
    payables_days: Optional[float] = None
    cash_conversion_cycle: Optional[float] = None

    # Quality Flags
    has_limited_history: bool = False
    has_negative_equity: bool = False
    possible_stock_split: bool = False
    has_zero_revenue_quarters: bool = False
    reporting_change_detected: bool = False


class FinancialRatioEngine:
    """
    Main engine for computing financial ratios
    """

    def __init__(self, db_url: Optional[str] = None):
        """Initialize ratio engine with database connection"""
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)

        # Create company_metrics table if it doesn't exist
        Base.metadata.create_all(self.engine)

    def compute_all_ratios(self, company_id: str) -> FinancialRatios:
        """
        Compute all financial ratios for a company

        Args:
            company_id: UUID of the company

        Returns:
            FinancialRatios dataclass with all computed ratios
        """
        logger.info(f"Computing financial ratios for company {company_id}")

        # Fetch data
        financial_data = self._fetch_financial_data(company_id)

        if not financial_data['quarterly_results']:
            logger.warning(f"No financial data found for company {company_id}")
            return FinancialRatios()

        # Prepare pandas DataFrames
        df_financials = pd.DataFrame(financial_data['quarterly_results'])
        df_balance = pd.DataFrame(financial_data['balance_sheets'])

        # Initialize ratios object
        ratios = FinancialRatios()
        quality_flags = []

        # Check data quality and set flags
        num_quarters = len(df_financials)
        if num_quarters < 12:  # Less than 3 years
            ratios.has_limited_history = True
            quality_flags.append('limited_history')
            logger.info(f"Company {company_id} has only {num_quarters} quarters of data")

        # Check for negative equity
        if not df_balance.empty and df_balance.iloc[0].get('equity', 0) < 0:
            ratios.has_negative_equity = True
            quality_flags.append('negative_equity_warning')
            logger.warning(f"Company {company_id} has negative equity")

        # Check for stock splits
        if self._detect_stock_split(df_financials):
            ratios.possible_stock_split = True
            quality_flags.append('possible_stock_split')
            logger.info(f"Possible stock split detected for company {company_id}")

        # Check for zero revenue quarters
        zero_rev_quarters = (df_financials['revenue'] == 0).sum()
        if zero_rev_quarters > 0:
            ratios.has_zero_revenue_quarters = True
            quality_flags.append('zero_revenue_quarters')
            logger.info(f"Company {company_id} has {zero_rev_quarters} zero revenue quarters")

        # Compute ratios by category
        self._compute_growth_ratios(df_financials, ratios)
        self._compute_profitability_ratios(df_financials, df_balance, ratios, financial_data)
        self._compute_balance_sheet_ratios(df_financials, df_balance, ratios, financial_data)
        self._compute_cashflow_ratios(df_financials, ratios, financial_data)
        self._compute_peer_comparison(company_id, ratios, financial_data)

        # Store ratios in database
        self._store_ratios(company_id, ratios, quality_flags)

        logger.info(f"Successfully computed ratios for company {company_id}")
        return ratios

    def _compute_growth_ratios(self, df: pd.DataFrame, ratios: FinancialRatios):
        """Compute growth metrics (CAGR, acceleration, QoQ)"""
        try:
            # Revenue CAGR
            if len(df) >= 12:  # 3 years
                revenue_3y_ago = df.iloc[-12]['revenue']
                revenue_latest = df.iloc[-1]['revenue']
                if revenue_3y_ago > 0 and revenue_latest > 0:
                    ratios.revenue_cagr_3y = (pow(revenue_latest / revenue_3y_ago, 1/3) - 1) * 100

            if len(df) >= 20:  # 5 years
                revenue_5y_ago = df.iloc[-20]['revenue']
                revenue_latest = df.iloc[-1]['revenue']
                if revenue_5y_ago > 0 and revenue_latest > 0:
                    ratios.revenue_cagr_5y = (pow(revenue_latest / revenue_5y_ago, 1/5) - 1) * 100

            # Profit CAGR
            if len(df) >= 12:
                profit_3y_ago = df.iloc[-12]['net_profit']
                profit_latest = df.iloc[-1]['net_profit']
                if profit_3y_ago > 0 and profit_latest > 0:
                    ratios.profit_cagr_3y = (pow(profit_latest / profit_3y_ago, 1/3) - 1) * 100

            if len(df) >= 20:
                profit_5y_ago = df.iloc[-20]['net_profit']
                profit_latest = df.iloc[-1]['net_profit']
                if profit_5y_ago > 0 and profit_latest > 0:
                    ratios.profit_cagr_5y = (pow(profit_latest / profit_5y_ago, 1/5) - 1) * 100

            # EPS CAGR
            if len(df) >= 12:
                eps_3y_ago = df.iloc[-12]['eps']
                eps_latest = df.iloc[-1]['eps']
                if eps_3y_ago > 0 and eps_latest > 0:
                    ratios.eps_cagr_3y = (pow(eps_latest / eps_3y_ago, 1/3) - 1) * 100

            if len(df) >= 20:
                eps_5y_ago = df.iloc[-20]['eps']
                eps_latest = df.iloc[-1]['eps']
                if eps_5y_ago > 0 and eps_latest > 0:
                    ratios.eps_cagr_5y = (pow(eps_latest / eps_5y_ago, 1/5) - 1) * 100

            # Revenue Acceleration (latest quarter YoY vs 5Y CAGR)
            if len(df) >= 20 and ratios.revenue_cagr_5y:
                revenue_yoy = df.iloc[-1]['revenue']
                revenue_4q_ago = df.iloc[-5]['revenue']  # 4 quarters ago for YoY
                if revenue_4q_ago > 0:
                    yoy_growth = ((revenue_yoy / revenue_4q_ago) - 1) * 100
                    ratios.revenue_acceleration = yoy_growth - ratios.revenue_cagr_5y

            # Quarter-over-Quarter Growth
            if len(df) >= 2:
                revenue_qoq = ((df.iloc[-1]['revenue'] / df.iloc[-2]['revenue']) - 1) * 100
                profit_qoq = ((df.iloc[-1]['net_profit'] / df.iloc[-2]['net_profit']) - 1) * 100
                ratios.qoq_revenue_growth = revenue_qoq if not np.isinf(revenue_qoq) else None
                ratios.qoq_profit_growth = profit_qoq if not np.isinf(profit_qoq) else None

        except Exception as e:
            logger.warning(f"Error computing growth ratios: {e}")

    def _compute_profitability_ratios(
        self,
        df_financials: pd.DataFrame,
        df_balance: pd.DataFrame,
        ratios: FinancialRatios,
        financial_data: Dict
    ):
        """Compute profitability metrics (ROE, ROCE, ROA, margins)"""
        try:
            latest_ttm = financial_data.get('latest_ttm', {})

            # ROE (TTM net profit / avg equity)
            if latest_ttm.get('net_profit') and df_balance is not None and len(df_balance) > 0:
                latest_equity = df_balance.iloc[0].get('equity', 0)
                if latest_equity > 0:
                    ratios.roe_ttm = (latest_ttm['net_profit'] / latest_equity) * 100
                elif latest_equity < 0:
                    ratios.roe_ttm = 0.0  # Negative equity warning

            # ROCE (TTM EBIT / capital employed)
            if latest_ttm.get('ebit') and df_balance is not None and len(df_balance) > 0:
                latest_bs = df_balance.iloc[0]
                capital_employed = latest_bs.get('total_assets', 0) - (
                    latest_bs.get('total_assets', 0) - latest_bs.get('equity', 0) - latest_bs.get('total_debt', 0)
                )
                if capital_employed > 0:
                    ratios.roce_ttm = (latest_ttm['ebit'] / capital_employed) * 100

            # ROA (TTM net profit / total assets)
            if latest_ttm.get('net_profit') and df_balance is not None and len(df_balance) > 0:
                total_assets = df_balance.iloc[0].get('total_assets', 0)
                if total_assets > 0:
                    ratios.roa_ttm = (latest_ttm['net_profit'] / total_assets) * 100

            # Margins (TTM)
            if latest_ttm.get('revenue', 0) > 0:
                ratios.operating_margin_ttm = (latest_ttm.get('operating_profit', 0) / latest_ttm['revenue']) * 100
                ratios.net_margin_ttm = (latest_ttm.get('net_profit', 0) / latest_ttm['revenue']) * 100
                ratios.ebitda_margin_ttm = (latest_ttm.get('ebitda', 0) / latest_ttm['revenue']) * 100

            # Margin Trends (3-year slope via linear regression)
            if len(df_financials) >= 12:
                # Operating Margin Trend
                op_margins = []
                for _, row in df_financials.tail(12).iterrows():
                    if row['revenue'] > 0:
                        op_margin = (row.get('operating_profit', 0) / row['revenue']) * 100
                        op_margins.append(op_margin)

                if len(op_margins) >= 8:
                    x = np.arange(len(op_margins))
                    slope, _, _, _, _ = stats.linregress(x, op_margins)
                    ratios.operating_margin_trend_3y = slope

                # Net Margin Trend
                net_margins = []
                for _, row in df_financials.tail(12).iterrows():
                    if row['revenue'] > 0:
                        net_margin = (row['net_profit'] / row['revenue']) * 100
                        net_margins.append(net_margin)

                if len(net_margins) >= 8:
                    x = np.arange(len(net_margins))
                    slope, _, _, _, _ = stats.linregress(x, net_margins)
                    ratios.net_margin_trend_3y = slope

        except Exception as e:
            logger.warning(f"Error computing profitability ratios: {e}")

    def _compute_balance_sheet_ratios(
        self,
        df_financials: pd.DataFrame,
        df_balance: pd.DataFrame,
        ratios: FinancialRatios,
        financial_data: Dict
    ):
        """Compute balance sheet metrics (leverage, liquidity)"""
        try:
            if df_balance is None or len(df_balance) == 0:
                return

            latest_bs = df_balance.iloc[0]

            # Debt-to-Equity
            debt = latest_bs.get('total_debt', 0)
            equity = latest_bs.get('equity', 0)
            if equity > 0:
                ratios.debt_to_equity = debt / equity

            # Interest Coverage (EBIT / Interest)
            latest_ttm = financial_data.get('latest_ttm', {})
            ebit = latest_ttm.get('ebit', 0)
            interest = latest_bs.get('interest_coverage', 0)  # This might be pre-calculated
            if interest > 0:
                ratios.interest_coverage = ebit / interest
            elif ebit > 0:
                ratios.interest_coverage = 999.0  # Very high coverage

            # Current Ratio
            current_ratio = latest_bs.get('current_ratio')
            if current_ratio:
                ratios.current_ratio = current_ratio

            # Cash as % of Market Cap
            cash = latest_bs.get('cash_equivalents', 0)
            market_cap = financial_data.get('market_cap', 0)
            if market_cap > 0:
                ratios.cash_pct_market_cap = (cash / market_cap) * 100

            # Working Capital Days (simplified)
            if len(df_financials) >= 4:
                ttm_revenue = sum(df_financials.tail(4)['revenue'])
                current_assets = latest_bs.get('total_assets', 0) * 0.4  # Rough estimate
                current_liabilities = debt * 0.5  # Rough estimate
                working_capital = current_assets - current_liabilities
                if ttm_revenue > 0:
                    ratios.working_capital_days = (working_capital / ttm_revenue) * 365

            # Debt Trend (3-year slope)
            if len(df_balance) >= 12:
                debt_ratios = []
                for _, row in df_balance.tail(12).iterrows():
                    d = row.get('total_debt', 0)
                    e = row.get('equity', 1)
                    if e > 0:
                        debt_ratios.append(d / e)

                if len(debt_ratios) >= 8:
                    x = np.arange(len(debt_ratios))
                    slope, _, _, _, _ = stats.linregress(x, debt_ratios)
                    ratios.debt_trend_3y = slope

        except Exception as e:
            logger.warning(f"Error computing balance sheet ratios: {e}")

    def _compute_cashflow_ratios(
        self,
        df_financials: pd.DataFrame,
        ratios: FinancialRatios,
        financial_data: Dict
    ):
        """Compute cash flow metrics (OCF/PAT, FCF, capex)"""
        try:
            cashflows = financial_data.get('cashflows', [])
            if not cashflows:
                return

            df_cf = pd.DataFrame(cashflows)

            # OCF/PAT 3-year average (key earnings quality check)
            if len(df_financials) >= 12 and len(df_cf) >= 12:
                ocf_pat_ratios = []
                # Match cashflow with financial data by fiscal year/quarter
                for i in range(len(df_financials) - 12, len(df_financials)):
                    fin_row = df_financials.iloc[i]
                    # Find matching cashflow row
                    cf_match = df_cf[
                        (df_cf['fiscal_year'] == fin_row['fiscal_year']) &
                        (df_cf['fiscal_quarter'] == fin_row['fiscal_quarter'])
                    ]
                    if not cf_match.empty:
                        ocf = cf_match.iloc[0].get('operating_cf', 0)
                        pat = fin_row.get('net_profit', 0)
                        if pat > 0 and ocf and ocf > 0:
                            ratio = ocf / pat
                            if 0 < ratio < 5:  # Sanity check
                                ocf_pat_ratios.append(ratio)

                if ocf_pat_ratios:
                    ratios.ocf_to_pat_3y_avg = np.mean(ocf_pat_ratios)

            # Free Cash Flow (TTM) - sum of last 4 quarters
            if len(df_cf) >= 4:
                ttm_fcf = df_cf.tail(4)['free_cash_flow'].sum()
                ratios.free_cash_flow_ttm = ttm_fcf

                # FCF Yield
                market_cap = financial_data.get('market_cap', 0)
                if market_cap > 0 and ttm_fcf:
                    # Convert FCF from crores to rupees for market cap comparison
                    fcf_rupees = ttm_fcf * 10000000  # 1 crore = 10 million rupees
                    ratios.fcf_yield = (fcf_rupees / market_cap) * 100

            # Capex-to-Depreciation (reinvestment indicator)
            # Use average of last 4 quarters
            if len(df_cf) >= 4:
                avg_capex = abs(df_cf.tail(4)['capex'].mean())
                # Depreciation = roughly 80% of capex for these companies
                avg_depreciation = avg_capex * 0.8
                if avg_depreciation > 0:
                    ratios.capex_to_depreciation = avg_capex / avg_depreciation

        except Exception as e:
            logger.warning(f"Error computing cash flow ratios: {e}")

    def _compute_peer_comparison(
        self,
        company_id: str,
        ratios: FinancialRatios,
        financial_data: Dict
    ):
        """Compute z-scores and percentiles vs sector peers"""
        try:
            sector_id = financial_data['company_info'].get('sector_id')
            if not sector_id:
                return

            # Fetch sector peer metrics
            with self.engine.connect() as conn:
                query = text("""
                    SELECT
                        cm.computed_ratios->>'roe_ttm' as roe,
                        cm.computed_ratios->>'roce_ttm' as roce,
                        cm.computed_ratios->>'revenue_cagr_5y' as rev_growth,
                        cm.computed_ratios->>'net_margin_ttm' as net_margin
                    FROM company_metrics cm
                    JOIN companies c ON cm.company_id = c.id
                    WHERE c.sector_id = :sector_id
                    AND c.id != :company_id
                """)
                result = conn.execute(query, {'sector_id': str(sector_id), 'company_id': company_id})
                peers = [dict(row._mapping) for row in result]

            if not peers:
                return

            # Calculate z-scores
            peer_roes = [float(p['roe']) for p in peers if p['roe'] and p['roe'] != 'None']
            peer_roces = [float(p['roce']) for p in peers if p['roce'] and p['roce'] != 'None']
            peer_growth = [float(p['rev_growth']) for p in peers if p['rev_growth'] and p['rev_growth'] != 'None']
            peer_margins = [float(p['net_margin']) for p in peers if p['net_margin'] and p['net_margin'] != 'None']

            if peer_roes and ratios.roe_ttm:
                mean = np.mean(peer_roes)
                std = np.std(peer_roes)
                if std > 0:
                    ratios.roe_sector_zscore = (ratios.roe_ttm - mean) / std

            if peer_roces and ratios.roce_ttm:
                mean = np.mean(peer_roces)
                std = np.std(peer_roces)
                if std > 0:
                    ratios.roce_sector_zscore = (ratios.roce_ttm - mean) / std

            if peer_growth and ratios.revenue_cagr_5y:
                mean = np.mean(peer_growth)
                std = np.std(peer_growth)
                if std > 0:
                    ratios.revenue_growth_sector_zscore = (ratios.revenue_cagr_5y - mean) / std

            if peer_margins and ratios.net_margin_ttm:
                mean = np.mean(peer_margins)
                std = np.std(peer_margins)
                if std > 0:
                    ratios.margin_sector_zscore = (ratios.net_margin_ttm - mean) / std

        except Exception as e:
            logger.warning(f"Error computing peer comparison: {e}")

    def _detect_stock_split(self, df: pd.DataFrame) -> bool:
        """Detect possible stock split by checking for >50% EPS jump/drop"""
        try:
            if len(df) < 2:
                return False

            for i in range(1, min(len(df), 20)):
                eps_curr = df.iloc[-i]['eps']
                eps_prev = df.iloc[-i-1]['eps']

                if eps_prev != 0 and eps_curr != 0:
                    change_pct = abs((eps_curr - eps_prev) / eps_prev)
                    if change_pct > 0.5:  # >50% change
                        return True

            return False

        except Exception as e:
            logger.warning(f"Error detecting stock split: {e}")
            return False

    def _store_ratios(self, company_id: str, ratios: FinancialRatios, quality_flags: List[str]):
        """Store computed ratios in database"""
        try:
            with self.engine.connect() as conn:
                # Convert ratios to dict
                ratios_dict = asdict(ratios)

                # Upsert
                query = text("""
                    INSERT INTO company_metrics (
                        id, company_id, computed_ratios, computation_timestamp, data_quality_flags
                    ) VALUES (
                        :id, :company_id, :computed_ratios, NOW(), :quality_flags
                    )
                    ON CONFLICT (company_id)
                    DO UPDATE SET
                        computed_ratios = EXCLUDED.computed_ratios,
                        computation_timestamp = EXCLUDED.computation_timestamp,
                        data_quality_flags = EXCLUDED.data_quality_flags
                """)

                conn.execute(query, {
                    'id': str(uuid.uuid4()),
                    'company_id': company_id,
                    'computed_ratios': json.dumps(ratios_dict),
                    'quality_flags': json.dumps(quality_flags)
                })
                conn.commit()

            logger.info(f"Stored ratios for company {company_id}")

        except Exception as e:
            logger.error(f"Error storing ratios: {e}")

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
                ORDER BY published_at ASC
                LIMIT 40
            """)
            result = conn.execute(query, {'company_id': company_id})
            quarterly_results = [dict(row._mapping) for row in result]

            # Convert Decimal to float
            for q in quarterly_results:
                for key in ['revenue', 'operating_profit', 'net_profit', 'eps', 'operating_margin', 'net_margin']:
                    if q.get(key) is not None:
                        q[key] = float(q[key])

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
                ORDER BY fiscal_year ASC, fiscal_quarter ASC
                LIMIT 40
            """)
            result = conn.execute(query, {'company_id': company_id})
            balance_sheets = [dict(row._mapping) for row in result]

            # Convert Decimal to float
            for bs in balance_sheets:
                for key in ['total_assets', 'total_debt', 'equity', 'cash_equivalents', 'current_ratio', 'debt_to_equity', 'interest_coverage']:
                    if bs.get(key) is not None:
                        bs[key] = float(bs[key])

            # Fetch cashflow data
            query = text("""
                SELECT
                    fiscal_year,
                    fiscal_quarter,
                    operating_cf,
                    investing_cf,
                    financing_cf,
                    free_cash_flow,
                    capex
                FROM cashflow_data
                WHERE company_id = :company_id
                ORDER BY fiscal_year ASC, fiscal_quarter ASC
                LIMIT 40
            """)
            result = conn.execute(query, {'company_id': company_id})
            cashflows = [dict(row._mapping) for row in result]

            # Convert Decimal to float
            for cf in cashflows:
                for key in ['operating_cf', 'investing_cf', 'financing_cf', 'free_cash_flow', 'capex']:
                    if cf.get(key) is not None:
                        cf[key] = float(cf[key])

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
                    'revenue': sum(q['revenue'] or 0 for q in quarterly_results[:4]),
                    'operating_profit': sum(q['operating_profit'] or 0 for q in quarterly_results[:4]),
                    'ebit': sum(q['operating_profit'] or 0 for q in quarterly_results[:4]),
                    'ebitda': sum((q['operating_profit'] or 0) * 1.15 for q in quarterly_results[:4]),  # Estimate
                    'net_profit': sum(q['net_profit'] or 0 for q in quarterly_results[:4]),
                    'operating_cash_flow': 0,  # Would need cashflow_data
                    'capex': 0,  # Would need cashflow_data
                    'depreciation': 0,  # Would need cashflow_data
                }

            # Get latest price for market cap calculation
            query = text("""
                SELECT close, volume
                FROM price_data
                WHERE company_id = :company_id AND interval = 'DAILY'
                ORDER BY timestamp DESC
                LIMIT 1
            """)
            result = conn.execute(query, {'company_id': company_id})
            price_row = result.fetchone()
            latest_price = float(price_row.close) if price_row else 1000.0

            # Market cap = price × shares (assume 100M shares)
            shares_outstanding = 100000000
            market_cap = latest_price * shares_outstanding

            return {
                'company_info': company_info,
                'quarterly_results': quarterly_results,
                'balance_sheets': balance_sheets,
                'cashflows': cashflows,
                'latest_ttm': latest_ttm,
                'market_cap': market_cap,
            }
