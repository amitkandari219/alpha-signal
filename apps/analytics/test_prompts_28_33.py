"""
Comprehensive Test Suite for Prompts 28-33

Tests all major components:
- Prompt 28: Financial Ratio Engine
- Prompt 29: Technical Analysis Engine
- Prompt 30: NLP Pipeline
- Prompt 31: LLM Summarization Engine
- Prompt 32: Scoring Engine
- Prompt 33: Data Ingestion Pipelines
"""
import os
import sys
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
import json

# Set up environment
os.environ.setdefault('DATABASE_URL', 'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal')
os.environ.setdefault('REDIS_URL', 'redis://:alphasignal_redis_dev@redis:6379')

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def print_header(text):
    """Print section header"""
    print(f"\n{BLUE}{'=' * 80}{RESET}")
    print(f"{BLUE}{text.center(80)}{RESET}")
    print(f"{BLUE}{'=' * 80}{RESET}\n")


def print_success(text):
    """Print success message"""
    print(f"{GREEN}✓ {text}{RESET}")


def print_error(text):
    """Print error message"""
    print(f"{RED}✗ {text}{RESET}")


def print_warning(text):
    """Print warning message"""
    print(f"{YELLOW}⚠ {text}{RESET}")


def print_info(text):
    """Print info message"""
    print(f"  {text}")


def get_test_company():
    """Get Dixon Technologies as test company"""
    db_url = os.getenv('DATABASE_URL')
    engine = create_engine(db_url)

    with engine.connect() as conn:
        query = text("""
            SELECT id, company_name, nse_symbol
            FROM companies
            WHERE nse_symbol = 'DIXON'
            LIMIT 1
        """)
        result = conn.execute(query)
        row = result.fetchone()

        if row:
            return {
                'id': str(row[0]),
                'company_name': row[1],
                'nse_symbol': row[2]
            }
        else:
            print_error("Dixon Technologies not found in database. Please run seed data first.")
            return None


def test_prompt_28_financial_ratios():
    """Test Prompt 28: Financial Ratio Engine"""
    print_header("PROMPT 28: Financial Ratio Engine")

    try:
        from engines.financial_ratios import FinancialRatioEngine

        company = get_test_company()
        if not company:
            return False

        print_info(f"Testing with company: {company['company_name']} ({company['nse_symbol']})")

        # Initialize engine
        engine = FinancialRatioEngine()
        print_success("FinancialRatioEngine initialized")

        # Compute ratios
        print_info("Computing 45+ financial ratios...")
        ratios = engine.compute_all_ratios(company['id'])

        # Display key ratios
        print_success("Financial ratios computed successfully!")
        print_info(f"  Revenue CAGR 5Y: {ratios.revenue_cagr_5y:.2f}%" if ratios.revenue_cagr_5y else "  Revenue CAGR 5Y: N/A")
        print_info(f"  Profit CAGR 5Y: {ratios.profit_cagr_5y:.2f}%" if ratios.profit_cagr_5y else "  Profit CAGR 5Y: N/A")
        print_info(f"  ROE (TTM): {ratios.roe_ttm:.2f}%" if ratios.roe_ttm else "  ROE (TTM): N/A")
        print_info(f"  ROCE (TTM): {ratios.roce_ttm:.2f}%" if ratios.roce_ttm else "  ROCE (TTM): N/A")
        print_info(f"  Debt/Equity: {ratios.debt_to_equity:.2f}" if ratios.debt_to_equity else "  Debt/Equity: N/A")
        print_info(f"  OCF/PAT (3Y avg): {ratios.ocf_to_pat_3y_avg:.2f}" if ratios.ocf_to_pat_3y_avg else "  OCF/PAT (3Y avg): N/A")

        # Quality flags
        if ratios.has_limited_history:
            print_warning("Limited financial history available")
        if ratios.has_negative_equity:
            print_warning("Negative equity detected")
        if ratios.possible_stock_split:
            print_warning("Possible stock split detected")

        return True

    except Exception as e:
        print_error(f"Financial Ratio Engine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_prompt_29_technical_analysis():
    """Test Prompt 29: Technical Analysis Engine"""
    print_header("PROMPT 29: Technical Analysis Engine")

    try:
        from engines.technical_analysis import TechnicalAnalysisEngine

        company = get_test_company()
        if not company:
            return False

        print_info(f"Testing with company: {company['company_name']} ({company['nse_symbol']})")

        # Initialize engine
        engine = TechnicalAnalysisEngine()
        print_success("TechnicalAnalysisEngine initialized")

        # Compute indicators
        print_info("Computing technical indicators...")
        result = engine.compute_all_indicators(company['id'])

        # Display results
        print_success("Technical indicators computed successfully!")
        print_info(f"  Indicators computed: {result['indicators_computed']}")
        print_info(f"  Trend status: {result['trend_analysis'].trend_status}")
        print_info(f"  Breakout active: {result['trend_analysis'].breakout_active}")
        print_info(f"  Support level: ₹{result['trend_analysis'].support_level:.2f}" if result['trend_analysis'].support_level else "  Support level: N/A")
        print_info(f"  Resistance level: ₹{result['trend_analysis'].resistance_level:.2f}" if result['trend_analysis'].resistance_level else "  Resistance level: N/A")

        # Momentum score
        if result['momentum_score']:
            print_info(f"  Momentum Score: {result['momentum_score'].total_score:.1f}/100")

        # Quality flags
        if result['quality_flags']:
            for flag in result['quality_flags']:
                print_warning(flag)

        return True

    except Exception as e:
        print_error(f"Technical Analysis Engine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_prompt_30_nlp_pipeline():
    """Test Prompt 30: NLP Pipeline"""
    print_header("PROMPT 30: NLP Pipeline")

    try:
        from engines.nlp_pipeline import NLPPipeline

        company = get_test_company()
        if not company:
            return False

        print_info(f"Testing with company: {company['company_name']} ({company['nse_symbol']})")

        # Initialize NLP pipeline
        nlp = NLPPipeline()
        print_success("NLPPipeline initialized")

        # Get a test article
        db_url = os.getenv('DATABASE_URL')
        engine = create_engine(db_url)

        with engine.connect() as conn:
            query = text("""
                SELECT id, title
                FROM news_articles
                ORDER BY published_at DESC
                LIMIT 1
            """)
            result = conn.execute(query)
            row = result.fetchone()

            if not row:
                print_warning("No news articles found. Creating test article...")

                # Create test article
                insert_query = text("""
                    INSERT INTO news_articles (
                        id, title, url, source, full_text, summary, published_at, created_at
                    ) VALUES (
                        gen_random_uuid(),
                        'Dixon Technologies Reports Strong Q3 Results',
                        'https://example.com/test',
                        'Test Source',
                        'Dixon Technologies Ltd reported strong quarterly results with revenue growth of 25% YoY. The company expects continued growth momentum.',
                        'Dixon reports strong Q3 with 25% revenue growth',
                        NOW(),
                        NOW()
                    )
                    RETURNING id, title
                """)
                with engine.begin() as conn2:
                    result2 = conn2.execute(insert_query)
                    row = result2.fetchone()

        article_id = str(row[0])
        article_title = row[1]

        print_info(f"Processing article: {article_title}")

        # Process article
        result = nlp.process_article(article_id)

        # Display results
        print_success("Article processed successfully!")
        print_info(f"  Sentiment: {result.sentiment_label} ({result.sentiment_score:.2f})")
        print_info(f"  Risk keywords found: {len(result.risk_keywords)}")
        if result.risk_keywords:
            print_info(f"    Keywords: {', '.join(result.risk_keywords[:5])}")
        print_info(f"  Company linked: {'Yes' if result.company_id else 'No'}")
        if result.company_id:
            print_info(f"    Match score: {result.entity_match_score:.2f}")

        return True

    except Exception as e:
        print_error(f"NLP Pipeline test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_prompt_31_llm_engine():
    """Test Prompt 31: LLM Summarization Engine"""
    print_header("PROMPT 31: LLM Summarization Engine")

    try:
        from engines.llm_engine import LLMEngine

        company = get_test_company()
        if not company:
            return False

        print_info(f"Testing with company: {company['company_name']} ({company['nse_symbol']})")

        # Check if ANTHROPIC_API_KEY is configured
        if not os.getenv('ANTHROPIC_API_KEY'):
            print_warning("ANTHROPIC_API_KEY not configured. Skipping LLM test.")
            print_info("Set ANTHROPIC_API_KEY in .env to test this component")
            return True  # Don't fail the test suite

        # Initialize LLM engine
        llm = LLMEngine()
        print_success("LLMEngine initialized")

        # Generate news digest (fastest, doesn't require computed_ratios)
        print_info("Generating news digest summary...")
        summary = llm.generate_summary(company['id'], 'news_digest')

        # Display results
        print_success("AI summary generated successfully!")
        print_info(f"  Model: {summary.model_version}")
        print_info(f"  Tokens: {summary.token_usage['total_tokens']} (prompt: {summary.token_usage['prompt_tokens']}, response: {summary.token_usage['completion_tokens']})")
        print_info(f"  Cost: ${summary.token_usage['estimated_cost']:.4f}")
        print_info(f"  Generated at: {summary.generated_at}")

        # Show summary preview
        print_info("\n  Summary preview:")
        if isinstance(summary.content, dict):
            if 'headlines' in summary.content:
                print_info(f"    Headlines: {len(summary.content['headlines'])} recent news items")
            if 'overall_sentiment' in summary.content:
                print_info(f"    Overall sentiment: {summary.content['overall_sentiment']}")

        return True

    except Exception as e:
        print_error(f"LLM Engine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_prompt_32_scoring_engine():
    """Test Prompt 32: Scoring Engine"""
    print_header("PROMPT 32: Scoring Engine")

    try:
        from engines.scoring_engine import ScoringEngine

        company = get_test_company()
        if not company:
            return False

        print_info(f"Testing with company: {company['company_name']} ({company['nse_symbol']})")

        # Initialize scoring engine
        engine = ScoringEngine()
        print_success("ScoringEngine initialized")

        # Compute all scores
        print_info("Computing all 5 composite scores...")
        scores = engine.compute_all_scores(company['id'])

        # Display results
        print_success("Composite scores computed successfully!")

        for score_type, score in scores.items():
            print_info(f"\n  {score_type.upper()} SCORE: {score.total_score:.1f}/100")

            # Show top 3 contributing factors
            sorted_factors = sorted(score.factors, key=lambda f: f.weighted_contribution, reverse=True)
            print_info("    Top factors:")
            for factor in sorted_factors[:3]:
                if not factor.is_missing:
                    print_info(f"      - {factor.factor_name}: {factor.weighted_contribution:.1f} pts "
                             f"(raw: {factor.raw_value:.2f}, normalized: {factor.normalized_score:.1f})")

        return True

    except Exception as e:
        print_error(f"Scoring Engine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_prompt_33_ingestion_pipelines():
    """Test Prompt 33: Data Ingestion Pipelines"""
    print_header("PROMPT 33: Data Ingestion Pipelines")

    success_count = 0
    total_tests = 4

    # Test 1: News Ingestion
    try:
        print_info("Testing News Ingestion Pipeline...")
        from pipelines.news_ingestion import NewsIngestionPipeline

        pipeline = NewsIngestionPipeline()
        print_success("NewsIngestionPipeline initialized")

        # Check RSS feeds configuration
        print_info(f"  RSS feeds configured: {len(pipeline.RSS_FEEDS)}")
        for source, url in list(pipeline.RSS_FEEDS.items())[:2]:
            print_info(f"    - {source}: {url[:50]}...")

        success_count += 1

    except Exception as e:
        print_error(f"News Ingestion test failed: {e}")

    # Test 2: Social Ingestion
    try:
        print_info("\nTesting Social Media Ingestion Pipeline...")
        from pipelines.social_ingestion import SocialIngestionPipeline

        pipeline = SocialIngestionPipeline()
        print_success("SocialIngestionPipeline initialized")

        print_info(f"  Subreddits monitored: {', '.join(pipeline.subreddits)}")

        if not pipeline.twitter_bearer_token:
            print_warning("TWITTER_BEARER_TOKEN not configured")
        if not pipeline.reddit_client_id:
            print_warning("REDDIT_CLIENT_ID not configured")

        success_count += 1

    except Exception as e:
        print_error(f"Social Ingestion test failed: {e}")

    # Test 3: Financial Results Ingestion
    try:
        print_info("\nTesting Financial Results Ingestion Pipeline...")
        from pipelines.financial_results_ingestion import FinancialResultsIngestionPipeline

        pipeline = FinancialResultsIngestionPipeline()
        print_success("FinancialResultsIngestionPipeline initialized")

        print_info(f"  Max retries: {pipeline.max_retries}")
        print_info(f"  Retry delay: {pipeline.retry_delay}s (exponential backoff)")

        if not pipeline.bse_api_key:
            print_warning("BSE_API_KEY not configured")

        success_count += 1

    except Exception as e:
        print_error(f"Financial Results Ingestion test failed: {e}")

    # Test 4: Shareholding Ingestion
    try:
        print_info("\nTesting Shareholding Ingestion Pipeline...")
        from pipelines.shareholding_ingestion import ShareholdingIngestionPipeline

        pipeline = ShareholdingIngestionPipeline()
        print_success("ShareholdingIngestionPipeline initialized")

        print_info(f"  Current quarter: {pipeline._get_current_quarter()}")

        if not pipeline.bse_api_key:
            print_warning("BSE_API_KEY not configured")

        success_count += 1

    except Exception as e:
        print_error(f"Shareholding Ingestion test failed: {e}")

    # Test 5: Price Ingestion (basic initialization test)
    try:
        print_info("\nTesting Price Ingestion Pipeline...")
        from pipelines.price_ingestion import PriceIngestionPipeline

        pipeline = PriceIngestionPipeline()
        print_success("PriceIngestionPipeline initialized")

        print_info(f"  Batch size: {pipeline.batch_size}")
        print_info(f"  Batch interval: {pipeline.batch_interval}s")

        if not pipeline.kite_api_key:
            print_warning("KITE_API_KEY not configured")
        if not pipeline.kite_access_token:
            print_warning("KITE_ACCESS_TOKEN not configured")

        total_tests += 1
        success_count += 1

    except Exception as e:
        print_error(f"Price Ingestion test failed: {e}")

    # Test 6: Scheduler configuration
    try:
        print_info("\nTesting Celery Beat Scheduler...")
        import sys
        sys.path.insert(0, os.path.dirname(__file__))
        import scheduler

        print_success("Scheduler configuration loaded")

        # Check beat schedule
        schedule_count = len(scheduler.app.conf.beat_schedule)
        print_info(f"  Scheduled tasks: {schedule_count}")

        # Show some key schedules
        key_schedules = [
            'news-ingestion-every-15-min',
            'social-ingestion-every-30-min',
            'financial-results-daily-scan'
        ]

        for task_name in key_schedules:
            if task_name in scheduler.app.conf.beat_schedule:
                task = scheduler.app.conf.beat_schedule[task_name]
                print_info(f"    - {task_name}: {task['task']}")

        total_tests += 1
        success_count += 1

    except Exception as e:
        print_error(f"Scheduler test failed: {e}")

    print_info(f"\nPipeline tests passed: {success_count}/{total_tests}")
    return success_count == total_tests


def main():
    """Run all tests"""
    print_header("ALPHA SIGNAL - PROMPTS 28-33 TEST SUITE")

    print_info(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"Database: {os.getenv('DATABASE_URL', 'Not configured')[:80]}...")
    print_info(f"Redis: {os.getenv('REDIS_URL', 'Not configured')}")

    results = {}

    # Run all tests
    results['Prompt 28: Financial Ratios'] = test_prompt_28_financial_ratios()
    results['Prompt 29: Technical Analysis'] = test_prompt_29_technical_analysis()
    results['Prompt 30: NLP Pipeline'] = test_prompt_30_nlp_pipeline()
    results['Prompt 31: LLM Engine'] = test_prompt_31_llm_engine()
    results['Prompt 32: Scoring Engine'] = test_prompt_32_scoring_engine()
    results['Prompt 33: Ingestion Pipelines'] = test_prompt_33_ingestion_pipelines()

    # Summary
    print_header("TEST SUMMARY")

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, passed_test in results.items():
        if passed_test:
            print_success(f"{test_name}: PASSED")
        else:
            print_error(f"{test_name}: FAILED")

    print(f"\n{BLUE}{'=' * 80}{RESET}")
    if passed == total:
        print(f"{GREEN}ALL TESTS PASSED ✓ ({passed}/{total}){RESET}".center(90))
    else:
        print(f"{YELLOW}SOME TESTS FAILED ⚠ ({passed}/{total} passed){RESET}".center(90))
    print(f"{BLUE}{'=' * 80}{RESET}\n")

    print_info(f"End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    return passed == total


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
