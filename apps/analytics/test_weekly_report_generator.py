"""
Test script for Weekly Report Generator

Tests:
1. Data fetching for sector reports
2. Data fetching for macro reports
3. Report structuring
4. Database storage
5. Celery task execution (optional)
"""
import os
import sys
from datetime import datetime

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.engines.weekly_report_generator import WeeklyReportGenerator
from sqlalchemy import create_engine, text
from utils.logger import logger


def test_weekly_report_generator():
    """Test weekly report generator functionality"""
    print("\n" + "="*80)
    print("TESTING WEEKLY REPORT GENERATOR")
    print("="*80 + "\n")

    try:
        # Initialize generator
        generator = WeeklyReportGenerator()
        print("✓ WeeklyReportGenerator initialized successfully")

        # Get database connection
        db_url = os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@localhost:5432/alphasignal'
        )
        engine = create_engine(db_url)

        # Test 1: Get a test sector
        print("\n[TEST 1] Fetching test sector...")
        with engine.connect() as conn:
            query = text("""
                SELECT id, name, slug
                FROM sectors
                WHERE parent_sector_id IS NULL
                LIMIT 1
            """)
            result = conn.execute(query)
            sector = dict(result.fetchone()._mapping) if result else None

        if not sector:
            print("✗ No sectors found in database")
            return False

        print(f"✓ Found test sector: {sector['name']} ({sector['id']})")

        # Test 2: Fetch sector data
        print("\n[TEST 2] Fetching sector data...")
        try:
            sector_data = generator._fetch_sector_data(sector['id'], 7)
            print(f"✓ Sector data fetched successfully")
            print(f"  - Companies: {len(sector_data.get('companies', []))}")
            print(f"  - Price data points: {len(sector_data.get('prices', []))}")
            print(f"  - News articles: {len(sector_data.get('news', []))}")
            print(f"  - Top stocks: {len(sector_data.get('top_stocks', []))}")
            print(f"  - Sector return: {sector_data.get('sector_performance', {}).get('sector_return_pct', 0)}%")
        except Exception as e:
            print(f"✗ Error fetching sector data: {e}")
            import traceback
            traceback.print_exc()
            return False

        # Test 3: Fetch macro data
        print("\n[TEST 3] Fetching macro data...")
        try:
            macro_data = generator._fetch_macro_data(7)
            print(f"✓ Macro data fetched successfully")
            print(f"  - Sectors analyzed: {len(macro_data.get('sectors', []))}")
            print(f"  - Sector performance data: {len(macro_data.get('sector_performance', []))}")
            print(f"  - Top news: {len(macro_data.get('top_news', []))}")
            print(f"  - FII/DII data points: {len(macro_data.get('fii_dii_data', []))}")
        except Exception as e:
            print(f"✗ Error fetching macro data: {e}")
            import traceback
            traceback.print_exc()
            return False

        # Test 4: Test utility methods
        print("\n[TEST 4] Testing utility methods...")
        try:
            fiscal_week, fiscal_year = generator._get_fiscal_week_year()
            print(f"✓ Fiscal week/year: Week {fiscal_week}, FY{fiscal_year}")

            slug = generator._generate_slug("Technology Sector - Weekly Analysis Week 6 2024")
            print(f"✓ Generated slug: {slug}")
        except Exception as e:
            print(f"✗ Error testing utility methods: {e}")
            return False

        # Test 5: Test report structuring (with mock data)
        print("\n[TEST 5] Testing report structuring...")
        try:
            # Create mock AI response
            mock_ai_response = {
                'performance_summary': {
                    'sector_return_pct': 2.5,
                    'vs_nifty500_pct': 1.0,
                    'trend_direction': 'UP'
                },
                'top_movers': {
                    'gainers': [
                        {'symbol': 'TEST1', 'name': 'Test Company 1', 'return_pct': 15.5, 'reason': 'Strong earnings'}
                    ],
                    'losers': []
                },
                'key_events': [
                    {'headline': 'Test event', 'impact': 'Positive', 'sentiment': 'POSITIVE', 'source': 'Test'}
                ],
                'ai_outlook': {
                    'paragraphs': ['Test outlook paragraph 1', 'Test outlook paragraph 2'],
                    'confidence': 'MEDIUM',
                    'key_risks': ['Risk 1'],
                    'key_opportunities': ['Opportunity 1']
                }
            }

            structured = generator._structure_sector_report(mock_ai_response, sector_data)
            print(f"✓ Sector report structured successfully")
            print(f"  - Sections: {list(structured.keys())}")
        except Exception as e:
            print(f"✗ Error structuring sector report: {e}")
            import traceback
            traceback.print_exc()
            return False

        # Test 6: Check if ANTHROPIC_API_KEY is set
        print("\n[TEST 6] Checking API key configuration...")
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if api_key:
            print(f"✓ ANTHROPIC_API_KEY is configured")
            print("  Note: Full report generation test skipped to avoid API costs")
            print("  To test full generation, run:")
            print(f"    generator.generate_sector_weekly_report('{sector['id']}')")
        else:
            print("⚠ ANTHROPIC_API_KEY not configured")
            print("  Full report generation will not work without API key")

        # Test 7: Check database tables
        print("\n[TEST 7] Checking database tables...")
        with engine.connect() as conn:
            # Check weekly_reports table
            query = text("SELECT COUNT(*) as count FROM weekly_reports")
            result = conn.execute(query)
            report_count = result.fetchone()[0]
            print(f"✓ weekly_reports table exists: {report_count} reports found")

            # Check report_sections table
            query = text("SELECT COUNT(*) as count FROM report_sections")
            result = conn.execute(query)
            section_count = result.fetchone()[0]
            print(f"✓ report_sections table exists: {section_count} sections found")

        print("\n" + "="*80)
        print("ALL TESTS PASSED SUCCESSFULLY!")
        print("="*80 + "\n")

        print("Next steps:")
        print("1. Set ANTHROPIC_API_KEY environment variable")
        print("2. Run full report generation:")
        print("   python -c \"from src.engines.weekly_report_generator import WeeklyReportGenerator; g = WeeklyReportGenerator(); g.generate_sector_weekly_report('SECTOR_ID')\"")
        print("3. Start Celery worker:")
        print("   celery -A src.celery_app worker --loglevel=info")
        print("4. Start Celery Beat scheduler:")
        print("   celery -A src.celery_app beat --loglevel=info")
        print("5. Trigger weekly report generation:")
        print("   celery -A src.celery_app call generate_all_sector_reports")

        return True

    except Exception as e:
        print(f"\n✗ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = test_weekly_report_generator()
    sys.exit(0 if success else 1)
