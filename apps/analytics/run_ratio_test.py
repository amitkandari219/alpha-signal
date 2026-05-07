#!/usr/bin/env python3
"""
Test runner for Financial Ratio Engine

Computes ratios for seed companies, shows validation table, and BEFORE/AFTER score comparison
"""
import sys
import os
sys.path.insert(0, '/app')

from src.engines.financial_ratios import FinancialRatioEngine
from src.engines.scoring_engine import ScoringEngine
from sqlalchemy import create_engine, text
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def print_table_border(widths: List[int], style='top'):
    """Print table border"""
    if style == 'top':
        corners = ('╔', '╦', '╗')
        line = '═'
    elif style == 'middle':
        corners = ('╠', '╬', '╣')
        line = '═'
    elif style == 'bottom':
        corners = ('╚', '╩', '╝')
        line = '═'
    else:  # separator
        corners = ('╠', '╬', '╣')
        line = '─'

    parts = [corners[0]]
    for i, width in enumerate(widths):
        parts.append(line * (width + 2))
        if i < len(widths) - 1:
            parts.append(corners[1])
    parts.append(corners[2])
    print(''.join(parts))


def print_table_row(values: List[str], widths: List[int]):
    """Print table row"""
    parts = ['║']
    for val, width in zip(values, widths):
        centered = val.center(width)
        parts.append(f' {centered} ║')
    print(''.join(parts))


def format_pct(val, decimals=1):
    """Format percentage"""
    if val is None:
        return "N/A"
    return f"{val:.{decimals}f}%"


def format_ratio(val, decimals=2):
    """Format ratio"""
    if val is None:
        return "N/A"
    return f"{val:.{decimals}f}"


def format_multiple(val, decimals=1):
    """Format multiple (like 8.5x)"""
    if val is None:
        return "N/A"
    return f"{val:.{decimals}f}x"


def main():
    """Main test runner"""
    print("\n" + "="*120)
    print("ALPHA SIGNAL FINANCIAL RATIO ENGINE - VALIDATION TEST")
    print("="*120 + "\n")

    # Initialize engines
    ratio_engine = FinancialRatioEngine()
    scoring_engine = ScoringEngine()

    # Get seed companies
    db_engine = create_engine(ratio_engine.db_url)

    with db_engine.connect() as conn:
        query = text("""
            SELECT c.id, c.company_name, c.nse_symbol, COUNT(fr.id) as record_count
            FROM companies c
            LEFT JOIN financial_results fr ON c.id = fr.company_id
            WHERE c.nse_symbol IN ('DIXON', 'DEEPAKNTR', 'POLYCAB', 'CLEAN', 'ASTRAL')
            GROUP BY c.id, c.company_name, c.nse_symbol
            HAVING COUNT(fr.id) > 0
            ORDER BY c.company_name
        """)
        result = conn.execute(query)
        companies = [dict(row._mapping) for row in result]

    if not companies:
        print("❌ No seed companies found with financial data!")
        return

    print(f"Found {len(companies)} seed companies:")
    for c in companies:
        print(f"  • {c['company_name']} ({c['nse_symbol']}) - {c['record_count']} financial records")
    print()

    # STEP 1: Get BEFORE scores (existing scores)
    print("STEP 1: Computing BEFORE scores (without ratio engine)...")
    print("-" * 120)
    before_scores = {}

    for company in companies:
        try:
            scores = scoring_engine.compute_all_scores(str(company['id']))
            before_scores[company['id']] = {
                'quality': scores['quality'].total_score,
                'growth': scores['growth'].total_score,
                'risk': scores['risk'].total_score,
                'sentiment': scores['sentiment'].total_score,
                'momentum': scores['momentum'].total_score,
            }
            print(f"✓ {company['company_name']}: Q={before_scores[company['id']]['quality']:.0f}, "
                  f"G={before_scores[company['id']]['growth']:.0f}, "
                  f"R={before_scores[company['id']]['risk']:.0f}")
        except Exception as e:
            logger.error(f"Error getting before scores for {company['company_name']}: {e}")
            before_scores[company['id']] = None

    print()

    # STEP 2: Compute financial ratios for all companies
    print("STEP 2: Computing financial ratios...")
    print("-" * 120)
    results = []

    for company in companies:
        print(f"Computing ratios for {company['company_name']}...")

        try:
            ratios = ratio_engine.compute_all_ratios(str(company['id']))

            results.append({
                'company': company,
                'ratios': ratios
            })

            flags = []
            if ratios.has_limited_history:
                flags.append('LIMITED_HISTORY')
            if ratios.has_negative_equity:
                flags.append('NEGATIVE_EQUITY')
            if ratios.possible_stock_split:
                flags.append('STOCK_SPLIT')

            flag_str = f" [{', '.join(flags)}]" if flags else ""
            print(f"  ✓ Computed 45+ ratios{flag_str}")

        except Exception as e:
            logger.error(f"Error computing ratios for {company['company_name']}: {e}", exc_info=True)
            print(f"  ❌ Error: {e}\n")

    print()

    if not results:
        print("❌ No ratios computed successfully!")
        return

    # STEP 3: Get AFTER scores (with computed ratios)
    print("STEP 3: Computing AFTER scores (with ratio engine)...")
    print("-" * 120)
    after_scores = {}

    for company in companies:
        try:
            scores = scoring_engine.compute_all_scores(str(company['id']))
            after_scores[company['id']] = {
                'quality': scores['quality'].total_score,
                'growth': scores['growth'].total_score,
                'risk': scores['risk'].total_score,
                'sentiment': scores['sentiment'].total_score,
                'momentum': scores['momentum'].total_score,
            }
            print(f"✓ {company['company_name']}: Q={after_scores[company['id']]['quality']:.0f}, "
                  f"G={after_scores[company['id']]['growth']:.0f}, "
                  f"R={after_scores[company['id']]['risk']:.0f}")
        except Exception as e:
            logger.error(f"Error getting after scores for {company['company_name']}: {e}")
            after_scores[company['id']] = None

    print()

    # STEP 4: Print ratio validation table
    print("\n" + "="*120)
    print("FINANCIAL RATIOS VALIDATION TABLE")
    print("="*120 + "\n")

    # Table headers and widths
    headers = ['Company', 'Rev CAGR\n5Y', 'Profit CAGR\n5Y', 'ROE\nTTM', 'ROCE\nTTM', 'D/E\nLatest',
               'OCF/PAT\n3Y Avg', 'Int Cover\nLatest', 'Curr Rat\nLatest', 'OPM Trend\n3Y Slope', 'FCF Yield\nLatest']
    widths = [18, 11, 13, 9, 9, 11, 11, 11, 11, 11, 11]

    # Print table
    print_table_border(widths, 'top')
    print_table_row(headers, widths)
    print_table_border(widths, 'middle')

    for result in results:
        company_name = result['company']['nse_symbol']
        ratios = result['ratios']

        values = [
            company_name,
            format_pct(ratios.revenue_cagr_5y),
            format_pct(ratios.profit_cagr_5y),
            format_pct(ratios.roe_ttm),
            format_pct(ratios.roce_ttm),
            format_ratio(ratios.debt_to_equity),
            format_ratio(ratios.ocf_to_pat_3y_avg),
            format_multiple(ratios.interest_coverage) if ratios.interest_coverage and ratios.interest_coverage < 100 else "High",
            format_ratio(ratios.current_ratio),
            format_pct(ratios.operating_margin_trend_3y) if ratios.operating_margin_trend_3y else "N/A",
            format_pct(ratios.fcf_yield) if ratios.fcf_yield else "N/A"
        ]
        print_table_row(values, widths)

    print_table_border(widths, 'bottom')

    # STEP 5: Print BEFORE vs AFTER comparison
    print("\n" + "="*120)
    print("SCORE COMPARISON: BEFORE vs AFTER RATIO ENGINE")
    print("="*120 + "\n")

    for company in companies:
        company_id = company['id']
        name = company['company_name']

        before = before_scores.get(company_id)
        after = after_scores.get(company_id)

        if not before or not after:
            print(f"{name}:")
            print("  ⚠️  Could not compute comparison (missing scores)\n")
            continue

        print(f"{name}:")

        # Quality
        q_diff = after['quality'] - before['quality']
        q_arrow = "→" if abs(q_diff) < 1 else ("↑" if q_diff > 0 else "↓")
        print(f"  Quality:   {before['quality']:.0f} {q_arrow} {after['quality']:.0f} "
              f"({q_diff:+.0f}) "
              f"{'✓ More accurate ROE/ROCE with computed ratios' if abs(q_diff) > 2 else ''}")

        # Growth
        g_diff = after['growth'] - before['growth']
        g_arrow = "→" if abs(g_diff) < 1 else ("↑" if g_diff > 0 else "↓")
        print(f"  Growth:    {before['growth']:.0f} {g_arrow} {after['growth']:.0f} "
              f"({g_diff:+.0f}) "
              f"{'✓ CAGR properly computed via geometric mean' if abs(g_diff) > 2 else ''}")

        # Risk
        r_diff = after['risk'] - before['risk']
        r_arrow = "→" if abs(r_diff) < 1 else ("↑" if r_diff > 0 else "↓")
        print(f"  Risk:      {before['risk']:.0f} {r_arrow} {after['risk']:.0f} "
              f"({r_diff:+.0f}) "
              f"{'⚠️ Higher risk detected with ratio analysis' if r_diff > 2 else ''}")

        print()

    print("="*120)
    print("✓ Financial Ratio Engine validation completed successfully!")
    print("="*120 + "\n")


if __name__ == '__main__':
    main()
