"""
NSE India Data Fetcher
Fetches real-time stock data from NSE India official APIs
"""

import requests
import json
from datetime import datetime
from typing import List, Dict, Optional
import logging
import time

logger = logging.getLogger(__name__)


class NSEIndiaFetcher:
    """Fetch stock data from NSE India official APIs"""

    BASE_URL = "https://www.nseindia.com/api"

    def __init__(self):
        self.session = requests.Session()

        # NSE requires these headers to work
        # Note: Don't set Accept-Encoding - let requests library handle it automatically
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
        })

        # Get cookies by visiting homepage
        try:
            self.session.get('https://www.nseindia.com', timeout=10)
        except:
            pass

    def fetch_quote(self, symbol: str) -> Optional[Dict]:
        """
        Fetch current quote for a stock

        Args:
            symbol: NSE symbol (e.g., 'RELIANCE', 'TCS')

        Returns:
            Dictionary with quote data or None if failed
        """
        try:
            url = f"{self.BASE_URL}/quote-equity?symbol={symbol}"
            response = self.session.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json()

                # Extract price info
                price_info = data.get('priceInfo', {})
                pre_open = data.get('preOpenMarket', {}).get('data', [{}])[0] if data.get('preOpenMarket') else {}

                return {
                    'symbol': symbol,
                    'company_name': data.get('info', {}).get('companyName', symbol),
                    'industry': data.get('metadata', {}).get('industry'),
                    'last_price': float(price_info.get('lastPrice', 0)),
                    'change': float(price_info.get('change', 0)),
                    'change_percent': float(price_info.get('pChange', 0)),
                    'previous_close': float(price_info.get('previousClose', 0)),
                    'open': float(price_info.get('open', 0)),
                    'high': float(price_info.get('intraDayHighLow', {}).get('max', 0)),
                    'low': float(price_info.get('intraDayHighLow', {}).get('min', 0)),
                    'volume': int(price_info.get('totalTradedVolume', 0)),
                    'value': float(price_info.get('totalTradedValue', 0)),
                    'week_high_52': float(price_info.get('weekHighLow', {}).get('max', 0)),
                    'week_low_52': float(price_info.get('weekHighLow', {}).get('min', 0)),
                    'timestamp': datetime.now(),
                    'isin': data.get('info', {}).get('isin'),
                }

            else:
                logger.warning(f"Failed to fetch {symbol}: HTTP {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Error fetching quote for {symbol}: {str(e)}")
            return None

    def fetch_multiple_quotes(self, symbols: List[str], delay: float = 0.5) -> List[Dict]:
        """
        Fetch quotes for multiple stocks

        Args:
            symbols: List of NSE symbols
            delay: Delay between requests (seconds)

        Returns:
            List of quote dictionaries
        """
        results = []

        for symbol in symbols:
            quote = self.fetch_quote(symbol)
            if quote:
                results.append(quote)
            time.sleep(delay)  # Rate limiting

        return results

    def fetch_market_status(self) -> Dict:
        """Fetch current market status"""
        try:
            url = f"{self.BASE_URL}/marketStatus"
            response = self.session.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                return {
                    'market_state': data.get('marketState', []),
                    'timestamp': datetime.now(),
                }

            return {'market_state': [], 'timestamp': datetime.now()}

        except Exception as e:
            logger.error(f"Error fetching market status: {str(e)}")
            return {'market_state': [], 'timestamp': datetime.now()}

    def fetch_top_gainers(self, count: int = 10) -> List[Dict]:
        """Fetch top gaining stocks"""
        try:
            url = f"{self.BASE_URL}/live-analysis-variations?index=gainers"
            response = self.session.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                gainers = data.get('NIFTY', {}).get('data', [])[:count]

                return [{
                    'symbol': item.get('symbol'),
                    'last_price': float(item.get('lastPrice', 0)),
                    'change': float(item.get('change', 0)),
                    'change_percent': float(item.get('pChange', 0)),
                } for item in gainers]

            return []

        except Exception as e:
            logger.error(f"Error fetching top gainers: {str(e)}")
            return []

    def fetch_top_losers(self, count: int = 10) -> List[Dict]:
        """Fetch top losing stocks"""
        try:
            url = f"{self.BASE_URL}/live-analysis-variations?index=losers"
            response = self.session.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                losers = data.get('NIFTY', {}).get('data', [])[:count]

                return [{
                    'symbol': item.get('symbol'),
                    'last_price': float(item.get('lastPrice', 0)),
                    'change': float(item.get('change', 0)),
                    'change_percent': float(item.get('pChange', 0)),
                } for item in losers]

            return []

        except Exception as e:
            logger.error(f"Error fetching top losers: {str(e)}")
            return []


# Nifty 50 stock symbols
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
    fetcher = NSEIndiaFetcher()

    print("Testing NSE India API...")
    print()

    # Test single stock
    print("1. Fetching RELIANCE...")
    reliance = fetcher.fetch_quote('RELIANCE')
    if reliance:
        print(f"   {reliance['company_name']}")
        print(f"   Price: ₹{reliance['last_price']:.2f} ({reliance['change_percent']:+.2f}%)")
        print(f"   Volume: {reliance['volume']:,}")
    print()

    # Test top gainers
    print("2. Top 5 Gainers:")
    gainers = fetcher.fetch_top_gainers(5)
    for stock in gainers:
        print(f"   {stock['symbol']}: ₹{stock['last_price']:.2f} ({stock['change_percent']:+.2f}%)")
    print()

    # Test market status
    print("3. Market Status:")
    status = fetcher.fetch_market_status()
    print(f"   {status}")
