#!/usr/bin/env python3
"""
Test runner for scoring engine

Computes scores for seed companies and prints formatted results
"""
import sys
import os
sys.path.insert(0, '/app')

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


def get_top_factors(score_obj, n=3):
    """Get top N contributing factors"""
    sorted_factors = sorted(
        score_obj.factors,
        key=lambda f: f.weighted_contribution,
        reverse=True
    )
    return sorted_factors[:n]


def main():
    """Main test runner"""
    print("\n" + "="*80)
    print("ALPHA SIGNAL SCORING ENGINE - TEST RUN")
    print("="*80 + "\n")

    # Initialize scoring engine
    engine = ScoringEngine()

    # Get seed companies
    db_engine = create_engine(engine.db_url)

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

    # Compute scores for each company
    results = []

    for company in companies:
        print(f"Computing scores for {company['company_name']}...")

        try:
            scores = engine.compute_all_scores(str(company['id']))

            results.append({
                'company': company,
                'scores': scores
            })

            print(f"  ✓ Quality: {scores['quality'].total_score:.1f}")
            print(f"  ✓ Growth: {scores['growth'].total_score:.1f}")
            print(f"  ✓ Risk: {scores['risk'].total_score:.1f}")
            print(f"  ✓ Sentiment: {scores['sentiment'].total_score:.1f}")
            print(f"  ✓ Momentum: {scores['momentum'].total_score:.1f}")
            print()

        except Exception as e:
            logger.error(f"Error computing scores for {company['company_name']}: {e}", exc_info=True)
            print(f"  ❌ Error: {e}\n")

    if not results:
        print("❌ No scores computed successfully!")
        return

    # Print results table
    print("\n" + "="*80)
    print("SCORE SUMMARY")
    print("="*80 + "\n")

    # Table headers and widths
    headers = ['Company', 'Quality', 'Growth', 'Risk', 'Sentiment', 'Momentum']
    widths = [20, 9, 8, 6, 11, 10]

    # Print table
    print_table_border(widths, 'top')
    print_table_row(headers, widths)
    print_table_border(widths, 'middle')

    for result in results:
        company_name = result['company']['company_name']
        # Truncate long names
        if len(company_name) > 20:
            company_name = company_name[:17] + '...'

        scores = result['scores']
        values = [
            company_name,
            f"{scores['quality'].total_score:.0f}",
            f"{scores['growth'].total_score:.0f}",
            f"{scores['risk'].total_score:.0f}",
            f"{scores['sentiment'].total_score:.0f}",
            f"{scores['momentum'].total_score:.0f}"
        ]
        print_table_row(values, widths)

    print_table_border(widths, 'bottom')

    # Print factor breakdowns
    print("\n" + "="*80)
    print("FACTOR BREAKDOWN (Top 3 Contributors per Score)")
    print("="*80 + "\n")

    for result in results:
        company_name = result['company']['company_name']
        scores = result['scores']

        print(f"{'='*80}")
        print(f"{company_name}")
        print(f"{'='*80}\n")

        # Quality Score
        print(f"Quality Score: {scores['quality'].total_score:.1f}")
        top_factors = get_top_factors(scores['quality'])
        for i, factor in enumerate(top_factors, 1):
            raw_str = f"{factor.raw_value:.2f}" if factor.raw_value is not None else "N/A"
            print(f"  {i}. {factor.factor_name}: {factor.normalized_score:.1f}/100 "
                  f"(weight {factor.weight:.0f}%, contribution {factor.weighted_contribution:.1f}, raw: {raw_str})")
        print()

        # Growth Score
        print(f"Growth Score: {scores['growth'].total_score:.1f}")
        top_factors = get_top_factors(scores['growth'])
        for i, factor in enumerate(top_factors, 1):
            raw_str = f"{factor.raw_value:.2f}" if factor.raw_value is not None else "N/A"
            print(f"  {i}. {factor.factor_name}: {factor.normalized_score:.1f}/100 "
                  f"(weight {factor.weight:.0f}%, contribution {factor.weighted_contribution:.1f}, raw: {raw_str})")
        print()

        # Risk Score
        print(f"Risk Score: {scores['risk'].total_score:.1f} (HIGHER = MORE RISK)")
        top_factors = get_top_factors(scores['risk'])
        for i, factor in enumerate(top_factors, 1):
            raw_str = f"{factor.raw_value:.2f}" if factor.raw_value is not None else "N/A"
            print(f"  {i}. {factor.factor_name}: {factor.normalized_score:.1f}/100 "
                  f"(weight {factor.weight:.0f}%, contribution {factor.weighted_contribution:.1f}, raw: {raw_str})")
        print()

        # Sentiment Score
        print(f"Sentiment Score: {scores['sentiment'].total_score:.1f}")
        top_factors = get_top_factors(scores['sentiment'])
        for i, factor in enumerate(top_factors, 1):
            raw_str = f"{factor.raw_value:.2f}" if factor.raw_value is not None else "N/A"
            print(f"  {i}. {factor.factor_name}: {factor.normalized_score:.1f}/100 "
                  f"(weight {factor.weight:.0f}%, contribution {factor.weighted_contribution:.1f}, raw: {raw_str})")
        print()

        # Momentum Score
        print(f"Momentum Score: {scores['momentum'].total_score:.1f}")
        top_factors = get_top_factors(scores['momentum'])
        for i, factor in enumerate(top_factors, 1):
            raw_str = f"{factor.raw_value:.2f}" if factor.raw_value is not None else "N/A"
            print(f"  {i}. {factor.factor_name}: {factor.normalized_score:.1f}/100 "
                  f"(weight {factor.weight:.0f}%, contribution {factor.weighted_contribution:.1f}, raw: {raw_str})")
        print()

    print("="*80)
    print("✓ Scoring test completed successfully!")
    print("="*80 + "\n")


if __name__ == '__main__':
    main()
