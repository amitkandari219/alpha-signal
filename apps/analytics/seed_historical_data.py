#!/usr/bin/env python3
"""
Generate 5 years of realistic historical financial and price data for seed companies
"""
import sys
sys.path.insert(0, '/app')

from sqlalchemy import create_engine, text
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import uuid
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Company profiles with realistic characteristics
COMPANY_PROFILES = {
    'DIXON': {
        'name': 'Dixon Technologies (India) Limited',
        'base_revenue': 1000,  # Crores
        'revenue_cagr': 0.25,  # 25% CAGR
        'base_opm': 0.04,  # 4%
        'opm_improvement': 0.002,  # +0.2% per quarter
        'debt_to_equity': 0.25,
        'working_capital_intensive': True,
        'price_base': 1500,
        'price_cagr': 0.30  # Stock outperforms due to growth story
    },
    'DEEPAKNTR': {
        'name': 'Deepak Nitrite Limited',
        'base_revenue': 2500,
        'revenue_cagr': 0.18,
        'base_opm': 0.25,  # Starts high
        'cyclical': True,  # Margin compression in FY23
        'debt_to_equity': 0.27,
        'price_base': 2000,
        'price_cagr': 0.15  # More volatile, cyclical
    },
    'POLYCAB': {
        'name': 'Polycab India Limited',
        'base_revenue': 10000,  # Larger company
        'revenue_cagr': 0.18,
        'base_opm': 0.13,  # Stable 12-14%
        'opm_volatility': 0.005,  # Very stable
        'debt_to_equity': 0.15,  # Low debt
        'steady_compounder': True,
        'price_base': 2500,
        'price_cagr': 0.20  # Steady compounder premium
    },
    'CLEAN': {
        'name': 'Clean Science and Technology Limited',
        'base_revenue': 500,
        'revenue_cagr_early': 0.30,  # 30% early
        'revenue_cagr_late': 0.15,  # Slowing to 15%
        'base_opm': 0.40,  # High margins
        'opm_range': (0.35, 0.42),
        'debt_to_equity': 0.0,  # Debt-free
        'price_base': 1200,
        'price_cagr': 0.22  # Premium valuation
    },
    'ASTRAL': {
        'name': 'Astral Limited',
        'base_revenue': 3000,
        'revenue_cagr': 0.22,
        'base_opm': 0.14,
        'opm_improvement': 0.003,  # Improving margins
        'debt_to_equity': 0.24,
        'capex_heavy': True,
        'price_base': 1800,
        'price_cagr': 0.25
    }
}


def generate_quarterly_financials(symbol, profile, start_date, num_quarters=20):
    """Generate quarterly financial data"""
    quarters = []
    current_date = start_date

    base_revenue = profile['base_revenue']
    quarterly_growth = (1 + profile.get('revenue_cagr', 0.18)) ** 0.25 - 1

    for q in range(num_quarters):
        fiscal_year = 2021 + (q // 4)
        fiscal_quarter = (q % 4) + 1

        # Revenue with growth
        if symbol == 'CLEAN' and q > 10:
            # Slowing growth for Clean Science
            growth_rate = (1 + profile['revenue_cagr_late']) ** 0.25 - 1
        else:
            growth_rate = quarterly_growth

        revenue = base_revenue * ((1 + growth_rate) ** q)
        revenue *= (1 + np.random.normal(0, 0.05))  # Add seasonality/noise

        # Operating margin
        if profile.get('cyclical') and symbol == 'DEEPAKNTR':
            # Cyclical pattern for Deepak Nitrite
            if 8 <= q <= 11:  # FY23 - margin compression
                opm = profile['base_opm'] * 0.7  # 30% margin compression
            elif q >= 12:  # FY24-25 recovery
                opm = profile['base_opm'] * 0.9 + (q - 12) * 0.02
            else:
                opm = profile['base_opm']
        elif 'opm_improvement' in profile:
            opm = profile['base_opm'] + (q * profile['opm_improvement'])
        elif 'opm_range' in profile:
            opm = np.random.uniform(*profile['opm_range'])
        else:
            opm = profile['base_opm'] + np.random.normal(0, profile.get('opm_volatility', 0.01))

        opm = max(0.02, min(0.45, opm))  # Cap between 2% and 45%

        operating_profit = revenue * opm

        # Net margin (typically 60-80% of operating margin)
        npm_ratio = 0.70 if profile.get('debt_to_equity', 0) > 0.2 else 0.75
        net_profit = operating_profit * npm_ratio
        net_margin = net_profit / revenue

        # EPS (assume 10 crore shares for simplicity)
        shares_outstanding = 100000000
        eps = (net_profit * 10000000) / shares_outstanding  # Convert crores to rupees

        quarters.append({
            'fiscal_year': fiscal_year,
            'fiscal_quarter': fiscal_quarter,
            'published_at': current_date,
            'revenue': round(revenue, 2),
            'operating_profit': round(operating_profit, 2),
            'net_profit': round(net_profit, 2),
            'eps': round(eps, 2),
            'operating_margin': round(opm * 100, 2),
            'net_margin': round(net_margin * 100, 2)
        })

        # Move to next quarter
        current_date += timedelta(days=91)

    return quarters


def generate_balance_sheet(symbol, profile, quarters):
    """Generate balance sheet data matching quarterly results"""
    balance_sheets = []

    for i, q in enumerate(quarters):
        revenue = q['revenue']

        # Total assets (typically 1.5-2.5x revenue for these companies)
        asset_multiple = 1.8 if profile.get('working_capital_intensive') else 1.5
        total_assets = revenue * asset_multiple * 4  # Annualized

        # Debt to equity
        de_ratio = profile.get('debt_to_equity', 0.2)
        equity = total_assets / (1 + de_ratio)
        total_debt = equity * de_ratio

        # Cash
        cash_pct = 0.05 if de_ratio > 0.2 else 0.15
        cash_equivalents = total_assets * cash_pct

        # Current ratio
        current_ratio = 1.5 + np.random.normal(0, 0.2)
        current_ratio = max(1.0, min(4.0, current_ratio))

        # Interest coverage
        if total_debt > 0:
            interest_expense = total_debt * 0.08 / 4  # 8% annual rate, quarterly
            interest_coverage = q['operating_profit'] / max(interest_expense, 0.01)
        else:
            interest_coverage = 100.0  # Very high for debt-free

        balance_sheets.append({
            'fiscal_year': q['fiscal_year'],
            'fiscal_quarter': q['fiscal_quarter'],
            'total_assets': round(total_assets, 2),
            'total_debt': round(total_debt, 2),
            'equity': round(equity, 2),
            'cash_equivalents': round(cash_equivalents, 2),
            'current_ratio': round(current_ratio, 2),
            'debt_to_equity': round(de_ratio, 3),
            'interest_coverage': round(min(interest_coverage, 150.0), 2)
        })

    return balance_sheets


def generate_cashflow(symbol, profile, quarters):
    """Generate cash flow data"""
    cashflows = []

    for i, q in enumerate(quarters):
        net_profit = q['net_profit']

        # OCF typically 80-120% of net profit for good companies
        ocf_ratio = 1.0 + np.random.normal(0, 0.15)
        ocf_ratio = max(0.6, min(1.3, ocf_ratio))
        operating_cash_flow = net_profit * ocf_ratio

        # Capex
        if profile.get('capex_heavy'):
            capex = q['revenue'] * 0.06  # 6% of revenue
        else:
            capex = q['revenue'] * 0.03  # 3% of revenue

        # FCF
        free_cash_flow = operating_cash_flow - capex

        # Depreciation
        depreciation = capex * 0.8  # Roughly 80% of capex

        cashflows.append({
            'fiscal_year': q['fiscal_year'],
            'fiscal_quarter': q['fiscal_quarter'],
            'operating_cash_flow': round(operating_cash_flow, 2),
            'investing_cash_flow': round(-capex, 2),
            'financing_cash_flow': round(np.random.normal(0, 10), 2),
            'free_cash_flow': round(free_cash_flow, 2),
            'capex': round(capex, 2),
            'depreciation': round(depreciation, 2)
        })

    return cashflows


def generate_price_data(symbol, profile, start_date, num_days=1250):
    """Generate realistic daily OHLCV data"""
    prices = []

    base_price = profile['price_base']
    annual_return = profile['price_cagr']
    daily_drift = annual_return / 252  # Trading days per year
    daily_volatility = 0.02  # 2% daily volatility

    current_price = base_price
    current_date = start_date

    for day in range(num_days):
        # Skip weekends
        if current_date.weekday() >= 5:
            current_date += timedelta(days=1)
            continue

        # Random walk with drift
        daily_return = np.random.normal(daily_drift, daily_volatility)
        current_price *= (1 + daily_return)

        # OHLC with realistic intraday movement
        intraday_vol = current_price * 0.015
        open_price = current_price * (1 + np.random.normal(0, 0.005))
        high_price = max(open_price, current_price) + abs(np.random.normal(0, intraday_vol))
        low_price = min(open_price, current_price) - abs(np.random.normal(0, intraday_vol))
        close_price = current_price

        # Volume (realistic range for Indian stocks)
        base_volume = 100000 + np.random.randint(-20000, 50000)

        prices.append({
            'date': current_date,
            'open': round(open_price, 2),
            'high': round(high_price, 2),
            'low': round(low_price, 2),
            'close': round(close_price, 2),
            'volume': base_volume
        })

        current_date += timedelta(days=1)

    return prices


def main():
    """Main execution"""
    print("\n" + "="*100)
    print("GENERATING 5 YEARS OF HISTORICAL DATA FOR SEED COMPANIES")
    print("="*100 + "\n")

    db_url = os.getenv(
        'DATABASE_URL',
        'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
    )
    engine = create_engine(db_url)

    # Get company IDs
    with engine.connect() as conn:
        query = text("""
            SELECT id, company_name, nse_symbol
            FROM companies
            WHERE nse_symbol IN ('DIXON', 'DEEPAKNTR', 'POLYCAB', 'CLEAN', 'ASTRAL')
        """)
        result = conn.execute(query)
        companies = {row.nse_symbol: dict(row._mapping) for row in result}

    start_date = datetime(2021, 4, 1)  # Q1 FY21
    price_start_date = datetime(2020, 1, 1)  # 5 years of price data

    for symbol, company in companies.items():
        print(f"\nGenerating data for {company['company_name']} ({symbol})...")

        profile = COMPANY_PROFILES[symbol]
        company_id = str(company['id'])

        # Generate quarterly data
        quarters = generate_quarterly_financials(symbol, profile, start_date, num_quarters=20)
        balance_sheets = generate_balance_sheet(symbol, profile, quarters)
        cashflows = generate_cashflow(symbol, profile, quarters)

        # Generate daily price data
        prices = generate_price_data(symbol, profile, price_start_date, num_days=1250)

        with engine.connect() as conn:
            # Delete existing seed data (4 quarters)
            conn.execute(text("DELETE FROM financial_results WHERE company_id = :cid"), {'cid': company_id})
            conn.execute(text("DELETE FROM balance_sheet_data WHERE company_id = :cid"), {'cid': company_id})
            conn.execute(text("DELETE FROM cashflow_data WHERE company_id = :cid"), {'cid': company_id})
            conn.execute(text("DELETE FROM price_data WHERE company_id = :cid"), {'cid': company_id})

            # Insert financial results
            for q in quarters:
                conn.execute(text("""
                    INSERT INTO financial_results (
                        id, company_id, period_type, published_at, fiscal_year, fiscal_quarter,
                        revenue, operating_profit, net_profit, eps, operating_margin, net_margin, updated_at
                    ) VALUES (
                        :id, :company_id, :period_type, :published_at, :fiscal_year, :fiscal_quarter,
                        :revenue, :operating_profit, :net_profit, :eps, :operating_margin, :net_margin, NOW()
                    )
                """), {
                    'id': str(uuid.uuid4()),
                    'company_id': company_id,
                    'period_type': 'QUARTERLY',
                    **q
                })

            # Insert balance sheet data
            for bs in balance_sheets:
                conn.execute(text("""
                    INSERT INTO balance_sheet_data (
                        id, company_id, fiscal_year, fiscal_quarter,
                        total_assets, total_debt, equity, cash_equivalents,
                        current_ratio, debt_to_equity, interest_coverage, updated_at
                    ) VALUES (
                        :id, :company_id, :fiscal_year, :fiscal_quarter,
                        :total_assets, :total_debt, :equity, :cash_equivalents,
                        :current_ratio, :debt_to_equity, :interest_coverage, NOW()
                    )
                """), {
                    'id': str(uuid.uuid4()),
                    'company_id': company_id,
                    **bs
                })

            # Insert cashflow data
            for cf in cashflows:
                conn.execute(text("""
                    INSERT INTO cashflow_data (
                        id, company_id, fiscal_year, fiscal_quarter,
                        operating_cf, investing_cf, financing_cf,
                        free_cash_flow, capex, updated_at
                    ) VALUES (
                        :id, :company_id, :fiscal_year, :fiscal_quarter,
                        :operating_cf, :investing_cf, :financing_cf,
                        :free_cash_flow, :capex, NOW()
                    )
                """), {
                    'id': str(uuid.uuid4()),
                    'company_id': company_id,
                    'fiscal_year': cf['fiscal_year'],
                    'fiscal_quarter': cf['fiscal_quarter'],
                    'operating_cf': cf['operating_cash_flow'],
                    'investing_cf': cf['investing_cash_flow'],
                    'financing_cf': cf['financing_cash_flow'],
                    'free_cash_flow': cf['free_cash_flow'],
                    'capex': cf['capex']
                })

            # Insert price data
            for price in prices:
                conn.execute(text("""
                    INSERT INTO price_data (
                        company_id, timestamp, open, high, low, close, volume, interval
                    ) VALUES (
                        :company_id, :timestamp, :open, :high, :low, :close, :volume, :interval
                    )
                """), {
                    'company_id': company_id,
                    'timestamp': price['date'],
                    'open': price['open'],
                    'high': price['high'],
                    'low': price['low'],
                    'close': price['close'],
                    'volume': price['volume'],
                    'interval': 'DAILY'
                })

            conn.commit()

        print(f"  ✓ Inserted 20 quarters of financial data")
        print(f"  ✓ Inserted 20 quarters of balance sheet data")
        print(f"  ✓ Inserted 20 quarters of cashflow data")
        print(f"  ✓ Inserted {len(prices)} days of price data")

    # Verify data counts
    print("\n" + "="*100)
    print("DATA VERIFICATION")
    print("="*100 + "\n")

    with engine.connect() as conn:
        for symbol, company in companies.items():
            query = text("""
                SELECT
                    (SELECT COUNT(*) FROM financial_results WHERE company_id = :cid) as fin_count,
                    (SELECT COUNT(*) FROM balance_sheet_data WHERE company_id = :cid) as bs_count,
                    (SELECT COUNT(*) FROM cashflow_data WHERE company_id = :cid) as cf_count,
                    (SELECT COUNT(*) FROM price_data WHERE company_id = :cid) as price_count
            """)
            result = conn.execute(query, {'cid': str(company['id'])}).fetchone()

            print(f"{symbol:12} | Financial: {result[0]:3} | Balance Sheet: {result[1]:3} | "
                  f"Cashflow: {result[2]:3} | Price: {result[3]:4}")

    print("\n" + "="*100)
    print("✓ Historical data generation completed successfully!")
    print("="*100 + "\n")


if __name__ == '__main__':
    main()
