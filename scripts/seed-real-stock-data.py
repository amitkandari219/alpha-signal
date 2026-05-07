#!/usr/bin/env python3
"""
Seed database with real stock data from Yahoo Finance
Fetches Nifty 50 stocks with 3 months of historical data
"""

import sys
import os

# Add analytics module to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'apps', 'analytics', 'src'))

from data_fetchers.yahoo_finance_fetcher import YahooFinanceFetcher, NIFTY_50_SYMBOLS
from database.db_manager import DatabaseManager
from datetime import datetime
import time

def seed_stock_data():
    """Seed database with real Nifty 50 stock data"""

    print("🚀 Starting Real Stock Data Seeding")
    print("=" * 60)

    fetcher = YahooFinanceFetcher()
    db = DatabaseManager()

    total_stocks = len(NIFTY_50_SYMBOLS)
    success_count = 0
    error_count = 0

    print(f"\n📊 Fetching data for {total_stocks} Nifty 50 stocks...")
    print()

    for idx, symbol in enumerate(NIFTY_50_SYMBOLS, 1):
        print(f"[{idx}/{total_stocks}] Processing {symbol}...", end=" ")

        try:
            # 1. Fetch company info
            company_info = fetcher.fetch_company_info(symbol)

            if company_info:
                try:
                    db.update_company_info(
                        symbol=symbol,
                        company_name=company_info['company_name'],
                        sector=company_info.get('sector'),
                        market_cap=company_info.get('market_cap'),
                    )
                    print(f"✓ Info", end=" ")
                except Exception as e:
                    print(f"✗ Info ({str(e)[:30]})", end=" ")

            # 2. Fetch 3 months of historical data
            hist_data = fetcher.fetch_historical_data(symbol, period='3mo', interval='1d')

            if hist_data is not None and not hist_data.empty:
                data_points = 0

                for index, row in hist_data.iterrows():
                    try:
                        db.store_price_data(
                            symbol=symbol,
                            timestamp=index.to_pydatetime(),
                            open_price=float(row['Open']),
                            high_price=float(row['High']),
                            low_price=float(row['Low']),
                            close_price=float(row['Close']),
                            volume=int(row['Volume']),
                            change_percent=float(row.get('Change_Percent', 0)),
                        )
                        data_points += 1
                    except Exception as e:
                        # Might fail if company doesn't exist in DB yet
                        pass

                print(f"✓ {data_points} days", end=" ")
                success_count += 1

            else:
                print(f"✗ No data", end=" ")
                error_count += 1

            # Get latest price
            latest = fetcher.fetch_current_price(symbol)
            if latest:
                print(f"| ₹{latest['close']:.2f} ({latest['change_percent']:+.2f}%)")
            else:
                print()

            # Rate limit: Yahoo Finance free tier has limits
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
    print("💡 Tip: Run 'make prod-logs-worker' to see Celery task logs")
    print("💡 Tip: Schedule daily updates with Celery Beat")
    print()


if __name__ == '__main__':
    try:
        seed_stock_data()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {str(e)}")
        sys.exit(1)
