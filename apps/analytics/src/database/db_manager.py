"""
Database Manager for storing stock data
"""

import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
import os
import logging

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manage database operations for stock data"""

    def __init__(self):
        self.database_url = os.getenv('DATABASE_URL')
        self.conn = None

    def connect(self):
        """Connect to PostgreSQL database"""
        if not self.conn or self.conn.closed:
            self.conn = psycopg2.connect(self.database_url)
        return self.conn

    def close(self):
        """Close database connection"""
        if self.conn and not self.conn.closed:
            self.conn.close()

    def get_company_id(self, symbol: str) -> str:
        """Get company ID from NSE symbol"""
        conn = self.connect()
        cursor = conn.cursor()

        try:
            cursor.execute(
                "SELECT id FROM companies WHERE nse_symbol = %s",
                (symbol,)
            )
            result = cursor.fetchone()

            if result:
                return result[0]
            else:
                logger.warning(f"Company not found for symbol: {symbol}")
                return None

        except Exception as e:
            logger.error(f"Error getting company ID: {str(e)}")
            return None
        finally:
            cursor.close()

    def store_price_data(
        self,
        symbol: str,
        timestamp: datetime,
        open_price: float,
        high_price: float,
        low_price: float,
        close_price: float,
        volume: int,
        change_percent: float = 0,
    ):
        """
        Store price data in price_data table

        Note: price_data table might not exist yet with all columns.
        This assumes you have a table with these columns.
        """
        company_id = self.get_company_id(symbol)

        if not company_id:
            logger.error(f"Cannot store price data: company not found for {symbol}")
            return

        conn = self.connect()
        cursor = conn.cursor()

        try:
            # Insert or update price data
            # Note: interval defaults to 'DAY_1' for daily data
            cursor.execute("""
                INSERT INTO price_data (
                    company_id,
                    timestamp,
                    open,
                    high,
                    low,
                    close,
                    volume,
                    interval
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'DAY_1')
                ON CONFLICT (company_id, timestamp, interval)
                DO UPDATE SET
                    open = EXCLUDED.open,
                    high = EXCLUDED.high,
                    low = EXCLUDED.low,
                    close = EXCLUDED.close,
                    volume = EXCLUDED.volume
            """, (
                company_id,
                timestamp,
                open_price,
                high_price,
                low_price,
                close_price,
                volume,
            ))

            conn.commit()

        except Exception as e:
            conn.rollback()
            logger.error(f"Error storing price data for {symbol}: {str(e)}")
            raise
        finally:
            cursor.close()

    def update_company_info(
        self,
        symbol: str,
        company_name: str = None,
        sector: str = None,
        industry: str = None,
        market_cap: int = None,
        description: str = None,
    ):
        """Update company information"""
        conn = self.connect()
        cursor = conn.cursor()

        try:
            # Build update query dynamically
            updates = []
            params = []

            if company_name:
                updates.append("company_name = %s")
                params.append(company_name)

            if sector:
                updates.append("sector_id = (SELECT id FROM sectors WHERE name = %s LIMIT 1)")
                params.append(sector)

            if market_cap:
                # Determine market cap category
                if market_cap >= 200000000000:  # >= 2000 Cr
                    category = 'LARGE_CAP'
                elif market_cap >= 50000000000:  # >= 500 Cr
                    category = 'MID_CAP'
                elif market_cap >= 5000000000:  # >= 50 Cr
                    category = 'SMALL_CAP'
                else:
                    category = 'MICRO_CAP'

                updates.append("market_cap_category = %s")
                params.append(category)

            if updates:
                params.append(symbol)
                query = f"UPDATE companies SET {', '.join(updates)} WHERE nse_symbol = %s"
                cursor.execute(query, params)
                conn.commit()

        except Exception as e:
            conn.rollback()
            logger.error(f"Error updating company info for {symbol}: {str(e)}")
            raise
        finally:
            cursor.close()

    def get_latest_price(self, symbol: str) -> dict:
        """Get latest price for a stock"""
        company_id = self.get_company_id(symbol)

        if not company_id:
            return None

        conn = self.connect()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                SELECT
                    timestamp,
                    open_price,
                    high_price,
                    low_price,
                    close_price,
                    volume,
                    change_percent
                FROM price_data
                WHERE company_id = %s
                ORDER BY timestamp DESC
                LIMIT 1
            """, (company_id,))

            result = cursor.fetchone()

            if result:
                return {
                    'symbol': symbol,
                    'timestamp': result[0],
                    'open': float(result[1]),
                    'high': float(result[2]),
                    'low': float(result[3]),
                    'close': float(result[4]),
                    'volume': int(result[5]),
                    'change_percent': float(result[6]),
                }

            return None

        except Exception as e:
            logger.error(f"Error getting latest price for {symbol}: {str(e)}")
            return None
        finally:
            cursor.close()
