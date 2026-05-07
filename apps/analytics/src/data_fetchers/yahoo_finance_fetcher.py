"""
Yahoo Finance Data Fetcher
Fetches real-time and historical stock data for Indian stocks
"""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class YahooFinanceFetcher:
    """Fetch stock data from Yahoo Finance"""

    def __init__(self):
        # Set user agent to avoid blocking
        import yfinance as yf_module
        yf_module.shared._URLLIB_TIMEOUT = 10

        # Create session with proper headers
        import requests
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })

    def get_nse_symbol(self, symbol: str) -> str:
        """Convert NSE symbol to Yahoo Finance format"""
        # Yahoo Finance uses .NS suffix for NSE stocks
        if not symbol.endswith('.NS') and not symbol.endswith('.BO'):
            return f"{symbol}.NS"
        return symbol

    def get_bse_symbol(self, symbol: str) -> str:
        """Convert BSE code to Yahoo Finance format"""
        # Yahoo Finance uses .BO suffix for BSE stocks
        if not symbol.endswith('.BO') and not symbol.endswith('.NS'):
            return f"{symbol}.BO"
        return symbol

    def fetch_current_price(self, symbol: str, exchange: str = 'NSE') -> Optional[Dict]:
        """
        Fetch current/latest price for a stock

        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            exchange: 'NSE' or 'BSE'

        Returns:
            Dictionary with current price data or None if failed
        """
        try:
            # Format symbol for Yahoo Finance
            yf_symbol = self.get_nse_symbol(symbol) if exchange == 'NSE' else self.get_bse_symbol(symbol)

            # Fetch stock data
            ticker = yf.Ticker(yf_symbol)
            info = ticker.info

            # Get latest price data
            hist = ticker.history(period='1d')

            if hist.empty:
                logger.warning(f"No data found for {yf_symbol}")
                return None

            latest = hist.iloc[-1]

            return {
                'symbol': symbol,
                'exchange': exchange,
                'open': float(latest['Open']),
                'high': float(latest['High']),
                'low': float(latest['Low']),
                'close': float(latest['Close']),
                'volume': int(latest['Volume']),
                'timestamp': latest.name.to_pydatetime(),
                'previous_close': float(info.get('previousClose', latest['Close'])),
                'change': float(latest['Close'] - info.get('previousClose', latest['Close'])),
                'change_percent': float(((latest['Close'] - info.get('previousClose', latest['Close'])) / info.get('previousClose', latest['Close'])) * 100) if info.get('previousClose') else 0,
                'market_cap': info.get('marketCap'),
                'day_range': f"{latest['Low']:.2f} - {latest['High']:.2f}",
            }

        except Exception as e:
            logger.error(f"Error fetching price for {symbol}: {str(e)}")
            return None

    def fetch_historical_data(
        self,
        symbol: str,
        exchange: str = 'NSE',
        period: str = '1mo',
        interval: str = '1d'
    ) -> Optional[pd.DataFrame]:
        """
        Fetch historical price data

        Args:
            symbol: Stock symbol
            exchange: 'NSE' or 'BSE'
            period: Period to fetch (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)

        Returns:
            DataFrame with historical data or None if failed
        """
        try:
            yf_symbol = self.get_nse_symbol(symbol) if exchange == 'NSE' else self.get_bse_symbol(symbol)

            ticker = yf.Ticker(yf_symbol)
            hist = ticker.history(period=period, interval=interval)

            if hist.empty:
                logger.warning(f"No historical data for {yf_symbol}")
                return None

            # Add calculated columns
            hist['Symbol'] = symbol
            hist['Exchange'] = exchange
            hist['Change'] = hist['Close'].diff()
            hist['Change_Percent'] = hist['Close'].pct_change() * 100

            return hist

        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {str(e)}")
            return None

    def fetch_company_info(self, symbol: str, exchange: str = 'NSE') -> Optional[Dict]:
        """
        Fetch company information

        Args:
            symbol: Stock symbol
            exchange: 'NSE' or 'BSE'

        Returns:
            Dictionary with company info or None if failed
        """
        try:
            yf_symbol = self.get_nse_symbol(symbol) if exchange == 'NSE' else self.get_bse_symbol(symbol)

            ticker = yf.Ticker(yf_symbol)
            info = ticker.info

            return {
                'symbol': symbol,
                'exchange': exchange,
                'company_name': info.get('longName', info.get('shortName', symbol)),
                'sector': info.get('sector'),
                'industry': info.get('industry'),
                'market_cap': info.get('marketCap'),
                'website': info.get('website'),
                'description': info.get('longBusinessSummary'),
                'employees': info.get('fullTimeEmployees'),
                'country': info.get('country'),
                'currency': info.get('currency', 'INR'),
                'exchange_name': info.get('exchange'),
            }

        except Exception as e:
            logger.error(f"Error fetching company info for {symbol}: {str(e)}")
            return None

    def fetch_multiple_stocks(
        self,
        symbols: List[str],
        exchange: str = 'NSE'
    ) -> List[Dict]:
        """
        Fetch current prices for multiple stocks

        Args:
            symbols: List of stock symbols
            exchange: 'NSE' or 'BSE'

        Returns:
            List of dictionaries with stock data
        """
        results = []

        for symbol in symbols:
            data = self.fetch_current_price(symbol, exchange)
            if data:
                results.append(data)

        return results

    def get_top_gainers_losers(self, symbols: List[str], exchange: str = 'NSE') -> Dict:
        """
        Get top gainers and losers from a list of symbols

        Args:
            symbols: List of stock symbols
            exchange: 'NSE' or 'BSE'

        Returns:
            Dictionary with 'gainers' and 'losers' lists
        """
        stocks_data = self.fetch_multiple_stocks(symbols, exchange)

        # Sort by change percent
        sorted_stocks = sorted(stocks_data, key=lambda x: x['change_percent'], reverse=True)

        return {
            'gainers': sorted_stocks[:10],  # Top 10 gainers
            'losers': sorted_stocks[-10:],   # Top 10 losers
        }


# Common NSE stock symbols for Indian market
NIFTY_50_SYMBOLS = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR',
    'ICICIBANK', 'KOTAKBANK', 'SBIN', 'BHARTIARTL', 'BAJFINANCE',
    'ITC', 'ASIANPAINT', 'AXISBANK', 'LT', 'MARUTI',
    'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'NESTLEIND', 'WIPRO',
    'HCLTECH', 'TECHM', 'POWERGRID', 'NTPC', 'ONGC',
    'TATAMOTORS', 'COALINDIA', 'BAJAJFINSV', 'M&M', 'ADANIPORTS',
    'TATASTEEL', 'INDUSINDBK', 'DIVISLAB', 'DRREDDY', 'CIPLA',
    'GRASIM', 'EICHERMOT', 'HINDALCO', 'HEROMOTOCO', 'UPL',
    'JSWSTEEL', 'BRITANNIA', 'APOLLOHOSP', 'TATACONSUM', 'SBILIFE',
    'ADANIENT', 'BAJAJ-AUTO', 'HDFCLIFE', 'BPCL', 'LTIM',
]


if __name__ == '__main__':
    # Test the fetcher
    fetcher = YahooFinanceFetcher()

    print("Fetching RELIANCE current price...")
    reliance = fetcher.fetch_current_price('RELIANCE')
    if reliance:
        print(f"RELIANCE: ₹{reliance['close']:.2f} ({reliance['change_percent']:+.2f}%)")

    print("\nFetching TCS historical data...")
    tcs_hist = fetcher.fetch_historical_data('TCS', period='5d')
    if tcs_hist is not None:
        print(tcs_hist.tail())

    print("\nFetching top 5 Nifty 50 stocks...")
    stocks = fetcher.fetch_multiple_stocks(NIFTY_50_SYMBOLS[:5])
    for stock in stocks:
        print(f"{stock['symbol']}: ₹{stock['close']:.2f} ({stock['change_percent']:+.2f}%)")
