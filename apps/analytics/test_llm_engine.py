#!/usr/bin/env python3
"""
Test LLM Summarization Engine

Tests all 6 summary types with Claude API
"""
import sys
sys.path.insert(0, '/app')

from src.engines.llm_engine import LLMEngine
from sqlalchemy import create_engine, text
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_llm_engine():
    """Test LLM Engine with seed companies"""
    print("\n" + "="*120)
    print("ALPHA SIGNAL LLM SUMMARIZATION ENGINE - TEST")
    print("="*120 + "\n")

    # Check API key
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not configured!")
        print("   Set it in .env file to enable Claude-powered summaries")
        return

    print("✓ Anthropic API key configured\n")

    # Initialize engine
    llm = LLMEngine()

    # Get a seed company
    db_url = os.getenv(
        'DATABASE_URL',
        'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
    )
    db_engine = create_engine(db_url)

    with db_engine.connect() as conn:
        query = text("""
            SELECT id, company_name, nse_symbol
            FROM companies
            WHERE nse_symbol = 'DIXON'
            LIMIT 1
        """)
        result = conn.execute(query)
        company = dict(result.fetchone()._mapping) if result else None

    if not company:
        print("❌ No seed company found (DIXON)")
        return

    company_id = str(company['id'])
    company_name = company['company_name']

    print(f"Testing with: {company_name} ({company['nse_symbol']})")
    print(f"Company ID: {company_id}\n")

    # Test all 6 summary types
    summary_types = [
        ('business_overview', 'Business Overview'),
        ('earnings_summary', 'Earnings Summary'),
        ('bull_case', 'Bull Case'),
        ('bear_case', 'Bear Case'),
        ('news_digest', 'News Digest'),
        ('risk_assessment', 'Risk Assessment')
    ]

    print("="*120)
    print("GENERATING SUMMARIES")
    print("="*120 + "\n")

    results = {}

    for summary_type, display_name in summary_types:
        print(f"📝 Generating {display_name}...")

        try:
            summary = llm.generate_summary(company_id, summary_type, force_refresh=True)

            # Display results
            print(f"   ✓ Generated successfully")
            print(f"   Model: {summary.model_version}")
            print(f"   Tokens: {summary.token_usage['total_tokens']} "
                  f"(in: {summary.token_usage['input_tokens']}, out: {summary.token_usage['output_tokens']})")
            print(f"   Confidence: {summary.confidence_level:.0%}")

            # Show snippet of content
            if 'summary' in summary.content:
                snippet = summary.content['summary'][:150]
                print(f"   Preview: {snippet}...")

            print()

            results[summary_type] = {
                'status': 'success',
                'summary': summary
            }

        except Exception as e:
            print(f"   ❌ Error: {e}\n")
            results[summary_type] = {
                'status': 'error',
                'error': str(e)
            }

    # Summary statistics
    print("="*120)
    print("RESULTS SUMMARY")
    print("="*120 + "\n")

    success_count = sum(1 for r in results.values() if r['status'] == 'success')
    error_count = sum(1 for r in results.values() if r['status'] == 'error')
    total_tokens = sum(
        r['summary'].token_usage['total_tokens']
        for r in results.values()
        if r['status'] == 'success'
    )

    print(f"Total summaries generated: {success_count}/{len(summary_types)}")
    print(f"Errors: {error_count}")
    print(f"Total tokens used: {total_tokens:,}")

    # Estimate cost (Claude Sonnet 4.5: $3/MTok input, $15/MTok output)
    if success_count > 0:
        total_input = sum(
            r['summary'].token_usage['input_tokens']
            for r in results.values()
            if r['status'] == 'success'
        )
        total_output = sum(
            r['summary'].token_usage['output_tokens']
            for r in results.values()
            if r['status'] == 'success'
        )

        cost_input = (total_input / 1_000_000) * 3
        cost_output = (total_output / 1_000_000) * 15
        total_cost = cost_input + cost_output

        print(f"Estimated cost: ${total_cost:.4f}")

    print()

    # Show example summary content
    if results['business_overview']['status'] == 'success':
        print("="*120)
        print("EXAMPLE: BUSINESS OVERVIEW")
        print("="*120 + "\n")

        content = results['business_overview']['summary'].content

        if 'summary' in content:
            print("Summary:")
            print(content['summary'])
            print()

        if 'key_highlights' in content:
            print("Key Highlights:")
            for i, highlight in enumerate(content['key_highlights'], 1):
                print(f"  {i}. {highlight}")
            print()

    print("="*120)
    print("✓ LLM Summarization Engine test completed!")
    print("="*120 + "\n")


if __name__ == '__main__':
    test_llm_engine()
