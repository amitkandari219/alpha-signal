"""
Celery tasks for fetching real stock data
"""

import sys
import os
from datetime import datetime, timedelta
from celery import shared_task
import logging

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_fetchers.yahoo_finance_fetcher import YahooFinanceFetcher, NIFTY_50_SYMBOLS
from database.db_manager import DatabaseManager

logger = logging.getLogger(__name__)


@shared_task(name='fetch_nifty50_daily_data')
def fetch_nifty50_daily_data():
    """
    Fetch daily price data for Nifty 50 stocks
    Runs daily at market close (3:30 PM IST)
    """
    logger.info("Starting daily Nifty 50 data fetch...")

    fetcher = YahooFinanceFetcher()
    db = DatabaseManager()

    try:
        # Fetch current prices for all Nifty 50 stocks
        stocks_data = fetcher.fetch_multiple_stocks(NIFTY_50_SYMBOLS, exchange='NSE')

        success_count = 0
        error_count = 0

        for stock_data in stocks_data:
            try:
                # Store in database
                db.store_price_data(
                    symbol=stock_data['symbol'],
                    timestamp=stock_data['timestamp'],
                    open_price=stock_data['open'],
                    high_price=stock_data['high'],
                    low_price=stock_data['low'],
                    close_price=stock_data['close'],
                    volume=stock_data['volume'],
                    change_percent=stock_data['change_percent'],
                )

                success_count += 1
                logger.info(f"Stored data for {stock_data['symbol']}: ₹{stock_data['close']:.2f}")

            except Exception as e:
                error_count += 1
                logger.error(f"Error storing data for {stock_data['symbol']}: {str(e)}")

        logger.info(f"Daily fetch complete: {success_count} success, {error_count} errors")

        return {
            'success': True,
            'stocks_fetched': success_count,
            'errors': error_count,
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Fatal error in daily fetch: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


@shared_task(name='fetch_historical_data_for_stock')
def fetch_historical_data_for_stock(symbol: str, period: str = '1mo'):
    """
    Fetch historical data for a specific stock

    Args:
        symbol: Stock symbol (e.g., 'RELIANCE')
        period: Period to fetch (1mo, 3mo, 6mo, 1y)
    """
    logger.info(f"Fetching {period} historical data for {symbol}...")

    fetcher = YahooFinanceFetcher()
    db = DatabaseManager()

    try:
        # Fetch historical data
        hist_data = fetcher.fetch_historical_data(symbol, period=period)

        if hist_data is None or hist_data.empty:
            logger.warning(f"No historical data found for {symbol}")
            return {'success': False, 'error': 'No data found'}

        # Store each day's data
        stored_count = 0

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
                stored_count += 1

            except Exception as e:
                logger.error(f"Error storing data point for {symbol}: {str(e)}")

        logger.info(f"Stored {stored_count} historical data points for {symbol}")

        return {
            'success': True,
            'symbol': symbol,
            'data_points': stored_count,
            'period': period
        }

    except Exception as e:
        logger.error(f"Error fetching historical data for {symbol}: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task(name='update_company_info')
def update_company_info(symbol: str):
    """
    Update company information from Yahoo Finance

    Args:
        symbol: Stock symbol
    """
    logger.info(f"Updating company info for {symbol}...")

    fetcher = YahooFinanceFetcher()
    db = DatabaseManager()

    try:
        company_info = fetcher.fetch_company_info(symbol)

        if not company_info:
            return {'success': False, 'error': 'No company info found'}

        # Update company record in database
        db.update_company_info(
            symbol=symbol,
            company_name=company_info['company_name'],
            sector=company_info.get('sector'),
            industry=company_info.get('industry'),
            market_cap=company_info.get('market_cap'),
            description=company_info.get('description'),
        )

        logger.info(f"Updated company info for {symbol}")

        return {
            'success': True,
            'symbol': symbol,
            'company_name': company_info['company_name']
        }

    except Exception as e:
        logger.error(f"Error updating company info for {symbol}: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task(name='fetch_top_gainers_losers')
def fetch_top_gainers_losers():
    """
    Fetch and cache top gainers/losers for the day
    """
    logger.info("Fetching top gainers and losers...")

    fetcher = YahooFinanceFetcher()

    try:
        result = fetcher.get_top_gainers_losers(NIFTY_50_SYMBOLS)

        logger.info(f"Found {len(result['gainers'])} gainers and {len(result['losers'])} losers")

        # Could store in Redis for caching
        return {
            'success': True,
            'gainers': result['gainers'][:5],  # Top 5
            'losers': result['losers'][:5],    # Bottom 5
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error fetching gainers/losers: {str(e)}")
        return {'success': False, 'error': str(e)}
