#!/usr/bin/env python3
"""
Test runner for Technical Analysis Engine

Computes technical indicators for all seed companies and shows:
1. Technical indicator table with trend status, RSI, MACD, MA distances, ADX, momentum score
2. Breakout detection results
3. BEFORE → AFTER momentum score comparison (proves scoring engine integration)
"""
import sys
sys.path.insert(0, '/app')

from src.engines.technical_analysis import TechnicalAnalysisEngine
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


def format_value(val, decimals=1):
    """Format numeric value"""
    if val is None or (isinstance(val, float) and val != val):  # NaN check
        return "N/A"
    if isinstance(val, bool):
        return "YES" if val else "NO"
    if isinstance(val, (int, float)):
        return f"{val:.{decimals}f}"
    return str(val)


def format_pct(val, decimals=1, with_sign=True):
    """Format percentage"""
    if val is None or (isinstance(val, float) and val != val):
        return "N/A"
    sign = "+" if val > 0 and with_sign else ""
    return f"{sign}{val:.{decimals}f}%"


def main():
    """Main test runner"""
    print("\n" + "="*120)
    print("ALPHA SIGNAL TECHNICAL ANALYSIS ENGINE - VALIDATION TEST")
    print("="*120 + "\n")

    # Initialize engines
    tech_engine = TechnicalAnalysisEngine()
    scoring_engine = ScoringEngine()

    # Get seed companies
    db_engine = create_engine(tech_engine.db_url)

    with db_engine.connect() as conn:
        query = text("""
            SELECT c.id, c.company_name, c.nse_symbol, COUNT(pd.timestamp) as price_days
            FROM companies c
            LEFT JOIN price_data pd ON c.id = pd.company_id AND pd.interval = 'DAILY'
            WHERE c.nse_symbol IN ('DIXON', 'DEEPAKNTR', 'POLYCAB', 'CLEAN', 'ASTRAL')
            GROUP BY c.id, c.company_name, c.nse_symbol
            HAVING COUNT(pd.timestamp) > 0
            ORDER BY c.company_name
        """)
        result = conn.execute(query)
        companies = [dict(row._mapping) for row in result]

    if not companies:
        print("❌ No seed companies found with price data!")
        return

    print(f"Found {len(companies)} seed companies with price data:")
    for c in companies:
        print(f"  • {c['company_name']} ({c['nse_symbol']}) - {c['price_days']} days of price data")
    print()

    # STEP 1: Get BEFORE momentum scores (before computing technical indicators)
    print("STEP 1: Computing BEFORE momentum scores (without technical indicators)...")
    print("-" * 120)
    before_scores = {}

    for company in companies:
        try:
            scores = scoring_engine.compute_all_scores(str(company['id']))
            before_scores[company['id']] = {
                'momentum': scores['momentum'].total_score,
            }
            print(f"✓ {company['company_name']}: Momentum={before_scores[company['id']]['momentum']:.0f}")
        except Exception as e:
            logger.error(f"Error getting before scores for {company['company_name']}: {e}")
            before_scores[company['id']] = None

    print()

    # STEP 2: Compute technical indicators for all companies
    print("STEP 2: Computing technical indicators...")
    print("-" * 120)
    results = []

    for company in companies:
        print(f"Computing indicators for {company['company_name']}...")

        try:
            result = tech_engine.compute_all_indicators(str(company['id']))

            results.append({
                'company': company,
                'result': result
            })

            flags_str = f" [{', '.join(result['quality_flags'])}]" if result['quality_flags'] else ""
            print(f"  ✓ Computed {result['indicators_computed']} days of indicators{flags_str}")

        except Exception as e:
            logger.error(f"Error computing indicators for {company['company_name']}: {e}", exc_info=True)
            print(f"  ❌ Error: {e}\n")

    print()

    if not results:
        print("❌ No indicators computed successfully!")
        return

    # STEP 3: Get AFTER momentum scores (with technical indicators)
    print("STEP 3: Computing AFTER momentum scores (with technical indicators)...")
    print("-" * 120)
    after_scores = {}

    for company in companies:
        try:
            scores = scoring_engine.compute_all_scores(str(company['id']))
            after_scores[company['id']] = {
                'momentum': scores['momentum'].total_score,
            }
            print(f"✓ {company['company_name']}: Momentum={after_scores[company['id']]['momentum']:.0f}")
        except Exception as e:
            logger.error(f"Error getting after scores for {company['company_name']}: {e}")
            after_scores[company['id']] = None

    print()

    # STEP 4: Print technical indicator table
    print("\n" + "="*120)
    print("TECHNICAL INDICATORS TABLE")
    print("="*120 + "\n")

    headers = ['Company', 'Trend Status', 'RSI', 'MACD Signal', 'SMA20 Dist', 'SMA200 Dist', 'ADX', 'Momentum Score']
    widths = [16, 16, 6, 13, 12, 13, 6, 15]

    print_table_border(widths, 'top')
    print_table_row(headers, widths)
    print_table_border(widths, 'middle')

    for res in results:
        company_symbol = res['company']['nse_symbol']
        result = res['result']
        latest = result['latest_indicators']
        trend = result['trend_analysis']

        macd_signal = "Bullish" if latest.get('macd', 0) and latest.get('macd_signal', 0) and latest['macd'] > latest['macd_signal'] else "Bearish"

        values = [
            company_symbol,
            trend.trend_status,
            format_value(latest.get('rsi_14'), 0),
            macd_signal,
            format_pct(latest.get('dist_sma_20')),
            format_pct(latest.get('dist_sma_200')),
            format_value(latest.get('adx'), 0),
            format_value(result['momentum_score'].total_score, 0)
        ]
        print_table_row(values, widths)

    print_table_border(widths, 'bottom')

    # STEP 5: Print breakout detection results
    print("\n" + "="*120)
    print("BREAKOUT DETECTION RESULTS")
    print("="*120 + "\n")

    for res in results:
        company_name = res['company']['company_name']
        trend = res['result']['trend_analysis']

        if trend.breakout_active:
            print(f"{company_name}: BREAKOUT DETECTED")
            print(f"  Range: ₹{trend.breakout_range_low:.2f}-₹{trend.breakout_range_high:.2f}")
            print(f"  Breakout at ₹{trend.breakout_price:.2f}")
            print(f"  Days since breakout: {trend.days_since_breakout}")
            print(f"  Volume confirmation: {'YES' if trend.volume_confirmation else 'NO'}")
        else:
            print(f"{company_name}: NO ACTIVE BREAKOUT")
        print()

    # STEP 6: Print BEFORE → AFTER momentum score comparison
    print("="*120)
    print("MOMENTUM SCORE COMPARISON: BEFORE vs AFTER TECHNICAL INDICATORS")
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

        # Momentum
        m_diff = after['momentum'] - before['momentum']
        m_arrow = "→" if abs(m_diff) < 1 else ("↑" if m_diff > 0 else "↓")

        if abs(m_diff) > 2:
            explanation = "Technical data now feeding RSI, MA alignment, MACD, volume factors"
        else:
            explanation = ""

        print(f"  Momentum:  {before['momentum']:.0f} {m_arrow} {after['momentum']:.0f} ({m_diff:+.0f}) {explanation}")
        print()

    print("="*120)
    print("✓ Technical Analysis Engine validation completed successfully!")
    print("="*120 + "\n")

    # STEP 7: Verify database storage
    print("="*120)
    print("DATABASE VERIFICATION")
    print("="*120 + "\n")

    with db_engine.connect() as conn:
        query = text("""
            SELECT c.nse_symbol, COUNT(ti.id) as indicator_days
            FROM technical_indicators ti
            JOIN companies c ON c.id = ti.company_id
            WHERE c.nse_symbol IN ('DIXON', 'DEEPAKNTR', 'POLYCAB', 'CLEAN', 'ASTRAL')
            GROUP BY c.nse_symbol
            ORDER BY c.nse_symbol
        """)
        result = conn.execute(query)

        print("Technical indicators stored in database:")
        for row in result:
            print(f"  {row.nse_symbol}: {row.indicator_days} days")

    print()


if __name__ == '__main__':
    main()
