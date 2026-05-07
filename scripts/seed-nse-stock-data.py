#!/usr/bin/env python3
"""
Seed database with real stock data from NSE India
Fetches current prices for all Nifty 50 stocks
"""

import sys
import os

# Add analytics module to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'apps', 'analytics', 'src'))

from data_fetchers.nse_india_fetcher import NSEIndiaFetcher, NIFTY_50_SYMBOLS
from database.db_manager import DatabaseManager
from datetime import datetime
import time

def seed_stock_data():
    """Seed database with real Nifty 50 stock data from NSE"""

    print("🚀 Starting NSE India Real Stock Data Seeding")
    print("=" * 60)

    fetcher = NSEIndiaFetcher()
    db = DatabaseManager()

    total_stocks = len(NIFTY_50_SYMBOLS)
    success_count = 0
    error_count = 0

    print(f"\n📊 Fetching current prices for {total_stocks} Nifty 50 stocks...")
    print()

    for idx, symbol in enumerate(NIFTY_50_SYMBOLS, 1):
        print(f"[{idx}/{total_stocks}] {symbol:12s} ", end="")

        try:
            # Fetch current quote from NSE
            quote = fetcher.fetch_quote(symbol)

            if quote:
                # Store price data
                try:
                    db.store_price_data(
                        symbol=symbol,
                        timestamp=quote['timestamp'],
                        open_price=float(quote['open']),
                        high_price=float(quote['high']),
                        low_price=float(quote['low']),
                        close_price=float(quote['last_price']),
                        volume=int(quote['volume']),
                        change_percent=float(quote['change_percent']),
                    )

                    # Update company info if available
                    if quote.get('company_name'):
                        try:
                            db.update_company_info(
                                symbol=symbol,
                                company_name=quote['company_name'],
                                sector=quote.get('industry'),
                                market_cap=None,  # NSE API doesn't provide market cap
                            )
                        except:
                            pass  # Company might not exist in DB yet

                    print(f"✓ ₹{quote['last_price']:8.2f} ({quote['change_percent']:+6.2f}%) Vol: {quote['volume']:>12,}")
                    success_count += 1

                except Exception as e:
                    print(f"✗ DB Error: {str(e)[:40]}")
                    error_count += 1

            else:
                print(f"✗ No data from NSE API")
                error_count += 1

            # Rate limit: Be gentle with NSE API
            time.sleep(0.5)

        except Exception as e:
            print(f"✗ ERROR: {str(e)[:50]}")
            error_count += 1

    print()
    print("=" * 60)
    print(f"✅ Seeding Complete!")
    print(f"   Success: {success_count}/{total_stocks}")
    print(f"   Errors: {error_count}/{total_stocks}")
    print()

    if success_count > 0:
        print("💡 Next steps:")
        print("   - Run this script daily to build historical data")
        print("   - Or schedule with Celery Beat for automatic updates")
        print("   - Check data: psql -c 'SELECT symbol, COUNT(*) FROM price_data GROUP BY symbol;'")
    else:
        print("⚠️  No data was stored. Check database connection and company records.")

    print()


if __name__ == '__main__':
    try:
        seed_stock_data()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
