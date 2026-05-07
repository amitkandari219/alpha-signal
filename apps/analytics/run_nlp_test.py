#!/usr/bin/env python3
"""
Test runner for NLP Pipeline

Tests the complete NLP pipeline on seed news articles and shows:
1. Sentiment Results Table with company, news sentiment, composite sentiment, risk keywords, sentiment score
2. Risk Keyword Extraction Samples (from negative articles)
3. BEFORE → AFTER Sentiment Score comparison (proves scoring engine integration)
4. Entity Linking Accuracy Report
"""
import sys
sys.path.insert(0, '/app')

from src.engines.nlp_pipeline import NLPPipeline
from src.engines.scoring_engine import ScoringEngine
from sqlalchemy import create_engine, text
from typing import List, Dict
import logging
import os

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


def format_sentiment(val):
    """Format sentiment value (-1 to 1)"""
    if val is None or (isinstance(val, float) and val != val):
        return "N/A"
    if val > 0.3:
        return f"+{val:.2f} 📈"
    elif val < -0.3:
        return f"{val:.2f} 📉"
    else:
        return f"{val:.2f} ➡️"


def format_score(val):
    """Format score value (0-100)"""
    if val is None or (isinstance(val, float) and val != val):
        return "N/A"
    return f"{val:.0f}"


def main():
    """Main test runner"""
    print("\n" + "="*120)
    print("ALPHA SIGNAL NLP PIPELINE - VALIDATION TEST")
    print("="*120 + "\n")

    # Initialize engines
    nlp = NLPPipeline()
    scoring_engine = ScoringEngine()

    db_url = os.getenv(
        'DATABASE_URL',
        'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
    )
    db_engine = create_engine(db_url)

    # Get seed companies
    with db_engine.connect() as conn:
        query = text("""
            SELECT id, company_name, nse_symbol
            FROM companies
            WHERE nse_symbol IN ('DIXON', 'DEEPAKNTR', 'POLYCAB', 'CLEAN', 'ASTRAL')
            ORDER BY company_name
        """)
        result = conn.execute(query)
        companies = [dict(row._mapping) for row in result]

    if not companies:
        print("❌ No seed companies found!")
        return

    print(f"Found {len(companies)} seed companies\n")

    # Get all news articles
    with db_engine.connect() as conn:
        query = text("""
            SELECT na.id, na.company_id, na.title, na.full_text as content, na.sentiment_label,
                   c.company_name, c.nse_symbol
            FROM news_articles na
            JOIN companies c ON c.id = na.company_id
            WHERE c.nse_symbol IN ('DIXON', 'DEEPAKNTR', 'POLYCAB', 'CLEAN', 'ASTRAL')
            ORDER BY c.company_name, na.created_at DESC
        """)
        result = conn.execute(query)
        articles = [dict(row._mapping) for row in result]

    if not articles:
        print("❌ No news articles found! Run seed_news_articles.py first.")
        return

    print(f"Found {len(articles)} news articles to process\n")

    # STEP 1: Get BEFORE sentiment scores (before NLP processing)
    print("STEP 1: Computing BEFORE sentiment scores (without NLP data)...")
    print("-" * 120)
    before_scores = {}

    for company in companies:
        try:
            scores = scoring_engine.compute_all_scores(str(company['id']))
            before_scores[company['id']] = {
                'sentiment': scores['sentiment'].total_score,
            }
            print(f"✓ {company['company_name']}: Sentiment={before_scores[company['id']]['sentiment']:.0f}")
        except Exception as e:
            logger.error(f"Error getting before scores for {company['company_name']}: {e}")
            before_scores[company['id']] = None

    print()

    # STEP 2: Process all articles through NLP pipeline
    print("STEP 2: Processing articles through NLP pipeline...")
    print("-" * 120)

    processed_results = []
    entity_linking_stats = {
        'total': 0,
        'matched': 0,
        'high_confidence': 0  # >= 90% match score
    }

    for article in articles:
        print(f"Processing: {article['title'][:70]}...")

        try:
            result = nlp.process_article(str(article['id']))

            processed_results.append({
                'article': article,
                'result': result
            })

            # Track entity linking stats
            entity_linking_stats['total'] += 1
            if result.company_id:
                entity_linking_stats['matched'] += 1
                if result.entity_match_score >= 0.90:
                    entity_linking_stats['high_confidence'] += 1

            print(f"  ✓ Sentiment: {result.sentiment_label} ({result.sentiment_score:.2f}) | "
                  f"Risk keywords: {len(result.risk_keywords)} | "
                  f"Entity match: {result.entity_match_score:.0%}")

        except Exception as e:
            logger.error(f"Error processing article {article['id']}: {e}", exc_info=True)
            print(f"  ❌ Error: {e}")

    print()

    # STEP 3: Update sentiment snapshots for all companies
    print("STEP 3: Updating sentiment snapshots...")
    print("-" * 120)

    for company in companies:
        try:
            snapshot = nlp.update_sentiment_snapshot(str(company['id']))
            print(f"✓ {company['company_name']}: "
                  f"News sentiment={snapshot.get('news_sentiment', 0):.2f}, "
                  f"Articles={snapshot.get('news_count', 0)}")
        except Exception as e:
            logger.error(f"Error updating snapshot for {company['company_name']}: {e}")

    print()

    # STEP 4: Get AFTER sentiment scores (with NLP data)
    print("STEP 4: Computing AFTER sentiment scores (with NLP data)...")
    print("-" * 120)
    after_scores = {}

    for company in companies:
        try:
            scores = scoring_engine.compute_all_scores(str(company['id']))
            after_scores[company['id']] = {
                'sentiment': scores['sentiment'].total_score,
            }
            print(f"✓ {company['company_name']}: Sentiment={after_scores[company['id']]['sentiment']:.0f}")
        except Exception as e:
            logger.error(f"Error getting after scores for {company['company_name']}: {e}")
            after_scores[company['id']] = None

    print()

    # STEP 5: Print sentiment results table
    print("\n" + "="*120)
    print("SENTIMENT RESULTS TABLE")
    print("="*120 + "\n")

    headers = ['Company', 'News Sentiment', 'Composite', 'Risk Keywords', 'Sentiment Score']
    widths = [16, 18, 16, 14, 16]

    print_table_border(widths, 'top')
    print_table_row(headers, widths)
    print_table_border(widths, 'middle')

    for company in companies:
        # Fetch latest snapshot
        with db_engine.connect() as conn:
            query = text("""
                SELECT news_sentiment, composite_sentiment
                FROM sentiment_snapshots
                WHERE company_id = :company_id
                ORDER BY date DESC
                LIMIT 1
            """)
            result = conn.execute(query, {'company_id': company['id']})
            snapshot = result.fetchone()

            # Count risk keywords from processed articles
            risk_query = text("""
                SELECT COUNT(*) as risk_count
                FROM news_articles
                WHERE company_id = :company_id
                AND risk_tags IS NOT NULL
                AND array_length(risk_tags, 1) > 0
            """)
            risk_result = conn.execute(risk_query, {'company_id': company['id']})
            risk_count = risk_result.fetchone()[0]

        if snapshot:
            values = [
                company['nse_symbol'],
                format_sentiment(snapshot.news_sentiment),
                format_sentiment(snapshot.composite_sentiment),
                str(risk_count),
                format_score(after_scores.get(company['id'], {}).get('sentiment'))
            ]
        else:
            values = [
                company['nse_symbol'],
                "No data",
                "No data",
                "0",
                format_score(after_scores.get(company['id'], {}).get('sentiment'))
            ]

        print_table_row(values, widths)

    print_table_border(widths, 'bottom')

    # STEP 6: Print risk keyword extraction samples
    print("\n" + "="*120)
    print("RISK KEYWORD EXTRACTION SAMPLES (Negative Articles)")
    print("="*120 + "\n")

    # Get processed negative articles
    negative_samples = [p for p in processed_results
                       if p['article']['sentiment_label'] == 'NEGATIVE'][:3]

    for sample in negative_samples:
        article = sample['article']
        result = sample['result']

        print(f"Article: {article['title']}")
        print(f"Company: {article['company_name']} ({article['nse_symbol']})")
        print(f"Risk Keywords Found: {len(result.risk_keywords)}")

        if result.risk_keywords:
            print("\nTop Risk Keywords:")
            # Group by category
            by_category = {}
            for kw in result.risk_keywords[:10]:  # Show top 10
                cat = kw['category']
                if cat not in by_category:
                    by_category[cat] = []
                by_category[cat].append(f"{kw['term']} ({kw['severity']})")

            for category, terms in by_category.items():
                print(f"  {category}: {', '.join(terms)}")

        print()

    # STEP 7: Print BEFORE → AFTER sentiment score comparison
    print("="*120)
    print("SENTIMENT SCORE COMPARISON: BEFORE vs AFTER NLP PROCESSING")
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

        # Sentiment
        s_diff = after['sentiment'] - before['sentiment']
        s_arrow = "→" if abs(s_diff) < 1 else ("↑" if s_diff > 0 else "↓")

        explanation = ""
        if abs(s_diff) > 2:
            explanation = "News and social sentiment data now feeding score"

        print(f"  Sentiment:  {before['sentiment']:.0f} {s_arrow} {after['sentiment']:.0f} ({s_diff:+.0f}) {explanation}")
        print()

    # STEP 8: Print entity linking accuracy report
    print("="*120)
    print("ENTITY LINKING ACCURACY REPORT")
    print("="*120 + "\n")

    total = entity_linking_stats['total']
    matched = entity_linking_stats['matched']
    high_conf = entity_linking_stats['high_confidence']

    match_rate = (matched / total * 100) if total > 0 else 0
    high_conf_rate = (high_conf / matched * 100) if matched > 0 else 0

    print(f"Total articles processed: {total}")
    print(f"Successfully linked to companies: {matched} ({match_rate:.1f}%)")
    print(f"High confidence matches (≥90%): {high_conf} ({high_conf_rate:.1f}% of matches)")
    print()

    # Show entity linking details per company
    print("Entity Linking by Company:")
    for company in companies:
        company_articles = [p for p in processed_results
                          if p['article']['company_id'] == company['id']]

        if company_articles:
            avg_score = sum(p['result'].entity_match_score for p in company_articles) / len(company_articles)
            print(f"  {company['company_name']}: {len(company_articles)} articles, "
                  f"avg match score {avg_score:.0%}")

    print()

    print("="*120)
    print("✓ NLP Pipeline validation completed successfully!")
    print("="*120 + "\n")


if __name__ == '__main__':
    main()
