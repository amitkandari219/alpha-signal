"""
Real-time Price Ingestion Pipeline

Fetches stock prices from Zerodha Kite WebSocket API:
- Connects to Kite Ticker WebSocket
- Subscribes to all tracked company instruments
- Writes each tick to Redis for real-time serving
- Batch-inserts to TimescaleDB price_data every 5 seconds
- EOD task (16:00 IST): finalizes daily candles, triggers technical indicators

Features:
- Automatic reconnection with exponential backoff
- Fallback HTTP polling if WebSocket fails
- Health monitoring: tick rate tracking
- Redis pub/sub for real-time broadcasting to web clients
"""
import os
import logging
import time
import json
from typing import List, Dict, Optional, Set
from datetime import datetime, timedelta
from collections import defaultdict
from threading import Thread, Lock
import redis
from sqlalchemy import create_engine, text
from kiteconnect import KiteTicker, KiteConnect

logger = logging.getLogger(__name__)


class PriceIngestionPipeline:
    """
    Real-time stock price ingestion from Zerodha Kite WebSocket
    """

    def __init__(self, db_url: Optional[str] = None, redis_url: Optional[str] = None):
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)

        # Redis for real-time serving and pub/sub
        redis_url = redis_url or os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        self.redis_client = redis.from_url(redis_url, decode_responses=True)

        # Zerodha Kite configuration
        self.kite_api_key = os.getenv('KITE_API_KEY')
        self.kite_access_token = os.getenv('KITE_ACCESS_TOKEN')

        if not self.kite_api_key or not self.kite_access_token:
            logger.warning("KITE_API_KEY or KITE_ACCESS_TOKEN not configured")

        # WebSocket connection
        self.kite_ticker: Optional[KiteTicker] = None
        self.kite_http: Optional[KiteConnect] = None

        # Tracking
        self.subscribed_instruments: Set[int] = set()
        self.instrument_map: Dict[int, str] = {}  # instrument_token -> nse_symbol
        self.tick_buffer: List[Dict] = []
        self.tick_buffer_lock = Lock()
        self.tick_counts: Dict[str, int] = defaultdict(int)  # symbol -> count (per minute)
        self.last_tick_reset = time.time()

        # Health monitoring
        self.is_connected = False
        self.last_tick_time = None
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 10
        self.reconnect_delay = 2  # seconds

        # Batch insertion config
        self.batch_size = 100
        self.batch_interval = 5  # seconds

    def start_websocket(self):
        """
        Start WebSocket connection and subscribe to all tracked instruments
        """
        logger.info("Starting Zerodha Kite WebSocket connection")

        try:
            # Initialize Kite HTTP client
            self.kite_http = KiteConnect(api_key=self.kite_api_key)
            self.kite_http.set_access_token(self.kite_access_token)

            # Get all tracked instruments
            instruments = self._get_tracked_instruments()

            if not instruments:
                logger.warning("No instruments to track. Exiting.")
                return

            # Build instrument map
            for inst in instruments:
                self.instrument_map[inst['instrument_token']] = inst['nse_symbol']
                self.subscribed_instruments.add(inst['instrument_token'])

            logger.info(f"Tracking {len(self.subscribed_instruments)} instruments")

            # Initialize KiteTicker
            self.kite_ticker = KiteTicker(self.kite_api_key, self.kite_access_token)

            # Set up callbacks
            self.kite_ticker.on_connect = self._on_connect
            self.kite_ticker.on_ticks = self._on_ticks
            self.kite_ticker.on_close = self._on_close
            self.kite_ticker.on_error = self._on_error

            # Start background thread for batch insertion
            batch_thread = Thread(target=self._batch_insert_worker, daemon=True)
            batch_thread.start()

            # Start background thread for health monitoring
            health_thread = Thread(target=self._health_monitor_worker, daemon=True)
            health_thread.start()

            # Connect and start (blocking call)
            self.kite_ticker.connect(threaded=False)

        except Exception as e:
            logger.error(f"Failed to start WebSocket: {e}", exc_info=True)
            self._start_fallback_polling()

    def _on_connect(self, ws, response):
        """Callback when WebSocket connection is established"""
        logger.info("WebSocket connected successfully")
        self.is_connected = True
        self.reconnect_attempts = 0

        # Subscribe to all instruments
        if self.subscribed_instruments:
            ws.subscribe(list(self.subscribed_instruments))
            ws.set_mode(ws.MODE_FULL, list(self.subscribed_instruments))
            logger.info(f"Subscribed to {len(self.subscribed_instruments)} instruments")

    def _on_ticks(self, ws, ticks):
        """Callback when ticks are received"""
        self.last_tick_time = time.time()

        for tick in ticks:
            try:
                instrument_token = tick.get('instrument_token')
                symbol = self.instrument_map.get(instrument_token)

                if not symbol:
                    continue

                # Track tick count for health monitoring
                self.tick_counts[symbol] += 1

                # Process tick
                self._process_tick(symbol, tick)

            except Exception as e:
                logger.error(f"Error processing tick: {e}")

    def _on_close(self, ws, code, reason):
        """Callback when WebSocket connection is closed"""
        logger.warning(f"WebSocket closed: code={code}, reason={reason}")
        self.is_connected = False

        # Attempt reconnection
        self._reconnect()

    def _on_error(self, ws, code, reason):
        """Callback when WebSocket error occurs"""
        logger.error(f"WebSocket error: code={code}, reason={reason}")

    def _reconnect(self):
        """Reconnect to WebSocket with exponential backoff"""
        if self.reconnect_attempts >= self.max_reconnect_attempts:
            logger.error(f"Max reconnection attempts ({self.max_reconnect_attempts}) reached. "
                        "Switching to fallback polling.")
            self._start_fallback_polling()
            return

        self.reconnect_attempts += 1
        delay = self.reconnect_delay * (2 ** (self.reconnect_attempts - 1))
        logger.info(f"Reconnecting in {delay} seconds (attempt {self.reconnect_attempts})")

        time.sleep(delay)

        try:
            if self.kite_ticker:
                self.kite_ticker.connect(threaded=False)
        except Exception as e:
            logger.error(f"Reconnection failed: {e}")
            self._reconnect()

    def _process_tick(self, symbol: str, tick: Dict):
        """
        Process a single tick:
        1. Write to Redis for real-time serving
        2. Add to batch buffer for TimescaleDB insertion
        3. Publish to Redis pub/sub for WebSocket clients

        Args:
            symbol: NSE symbol
            tick: Tick data from Kite
        """
        try:
            timestamp = tick.get('timestamp') or tick.get('exchange_timestamp') or datetime.now()

            # Extract tick data
            tick_data = {
                'symbol': symbol,
                'ltp': tick.get('last_price', 0),
                'open': tick.get('ohlc', {}).get('open', 0),
                'high': tick.get('ohlc', {}).get('high', 0),
                'low': tick.get('ohlc', {}).get('low', 0),
                'close': tick.get('ohlc', {}).get('close', 0),
                'volume': tick.get('volume', 0),
                'change': tick.get('change', 0),
                'change_pct': ((tick.get('last_price', 0) - tick.get('ohlc', {}).get('close', 0)) /
                              tick.get('ohlc', {}).get('close', 1)) * 100 if tick.get('ohlc', {}).get('close') else 0,
                'timestamp': timestamp.isoformat() if isinstance(timestamp, datetime) else timestamp
            }

            # 1. Write to Redis (TTL: 10 seconds)
            redis_key = f"price:live:{symbol}"
            self.redis_client.setex(redis_key, 10, json.dumps(tick_data))

            # 2. Publish to Redis pub/sub for WebSocket clients
            self.redis_client.publish(f"price_updates:{symbol}", json.dumps(tick_data))

            # 3. Add to batch buffer for database insertion
            with self.tick_buffer_lock:
                self.tick_buffer.append({
                    'symbol': symbol,
                    'timestamp': timestamp,
                    'open': tick_data['open'],
                    'high': tick_data['high'],
                    'low': tick_data['low'],
                    'close': tick_data['ltp'],
                    'volume': tick_data['volume']
                })

        except Exception as e:
            logger.error(f"Failed to process tick for {symbol}: {e}")

    def _batch_insert_worker(self):
        """
        Background worker that batch-inserts ticks to TimescaleDB every 5 seconds
        """
        logger.info("Batch insertion worker started")

        while True:
            try:
                time.sleep(self.batch_interval)

                with self.tick_buffer_lock:
                    if not self.tick_buffer:
                        continue

                    # Get batch and clear buffer
                    batch = self.tick_buffer[:self.batch_size]
                    self.tick_buffer = self.tick_buffer[self.batch_size:]

                # Insert batch
                self._insert_price_data(batch)
                logger.debug(f"Inserted {len(batch)} ticks to database")

            except Exception as e:
                logger.error(f"Batch insertion failed: {e}", exc_info=True)

    def _insert_price_data(self, batch: List[Dict]):
        """
        Insert batch of price data to TimescaleDB

        Args:
            batch: List of tick dicts
        """
        if not batch:
            return

        with self.engine.begin() as conn:
            # First, resolve company IDs for symbols
            symbols = list(set([t['symbol'] for t in batch]))

            query = text("""
                SELECT nse_symbol, id FROM companies
                WHERE nse_symbol = ANY(:symbols)
            """)
            result = conn.execute(query, {'symbols': symbols})
            symbol_to_id = {row[0]: row[1] for row in result}

            # Insert price data
            for tick in batch:
                company_id = symbol_to_id.get(tick['symbol'])
                if not company_id:
                    continue

                insert_query = text("""
                    INSERT INTO price_data (
                        company_id, timestamp, open, high, low, close, volume
                    ) VALUES (
                        :company_id, :timestamp, :open, :high, :low, :close, :volume
                    )
                    ON CONFLICT (company_id, timestamp) DO UPDATE SET
                        open = EXCLUDED.open,
                        high = EXCLUDED.high,
                        low = EXCLUDED.low,
                        close = EXCLUDED.close,
                        volume = EXCLUDED.volume
                """)

                conn.execute(insert_query, {
                    'company_id': company_id,
                    'timestamp': tick['timestamp'],
                    'open': tick['open'],
                    'high': tick['high'],
                    'low': tick['low'],
                    'close': tick['close'],
                    'volume': tick['volume']
                })

    def _health_monitor_worker(self):
        """
        Background worker that monitors tick health:
        - Tracks tick rate per minute
        - Alerts if <50% of expected ticks
        """
        logger.info("Health monitoring worker started")

        while True:
            try:
                time.sleep(60)  # Check every minute

                # Calculate expected vs actual ticks
                total_ticks = sum(self.tick_counts.values())
                num_instruments = len(self.subscribed_instruments)
                expected_ticks = num_instruments * 60  # Assume 1 tick/sec per instrument

                tick_ratio = total_ticks / expected_ticks if expected_ticks > 0 else 0

                logger.info(f"Health check: {total_ticks} ticks received "
                           f"({tick_ratio:.1%} of expected {expected_ticks})")

                if tick_ratio < 0.5 and self.is_connected:
                    logger.warning(f"Low tick rate: {tick_ratio:.1%} of expected. "
                                  "WebSocket may be unhealthy.")

                # Reset counters
                self.tick_counts.clear()

            except Exception as e:
                logger.error(f"Health monitoring failed: {e}")

    def _start_fallback_polling(self):
        """
        Fallback mode: poll HTTP API every 10 seconds if WebSocket fails
        """
        logger.info("Starting fallback HTTP polling mode")

        while True:
            try:
                if not self.kite_http:
                    self.kite_http = KiteConnect(api_key=self.kite_api_key)
                    self.kite_http.set_access_token(self.kite_access_token)

                # Get quote for all symbols
                symbols_list = [f"NSE:{symbol}" for symbol in self.instrument_map.values()]

                if not symbols_list:
                    logger.warning("No symbols to poll")
                    time.sleep(10)
                    continue

                # Quote API has a limit, poll in batches of 50
                for i in range(0, len(symbols_list), 50):
                    batch = symbols_list[i:i+50]
                    quotes = self.kite_http.quote(batch)

                    for full_symbol, quote in quotes.items():
                        symbol = full_symbol.replace('NSE:', '')

                        # Convert quote to tick format
                        tick = {
                            'last_price': quote.get('last_price'),
                            'ohlc': quote.get('ohlc', {}),
                            'volume': quote.get('volume'),
                            'timestamp': datetime.now()
                        }

                        self._process_tick(symbol, tick)

                time.sleep(10)

            except Exception as e:
                logger.error(f"Fallback polling failed: {e}", exc_info=True)
                time.sleep(10)

    def _get_tracked_instruments(self) -> List[Dict]:
        """
        Get all tracked instruments with Kite instrument tokens

        Returns:
            List of dicts with nse_symbol, instrument_token
        """
        with self.engine.connect() as conn:
            query = text("""
                SELECT nse_symbol, kite_instrument_token
                FROM companies
                WHERE is_active = true
                  AND nse_symbol IS NOT NULL
                  AND kite_instrument_token IS NOT NULL
                ORDER BY nse_symbol
            """)
            result = conn.execute(query)
            return [{'nse_symbol': row[0], 'instrument_token': row[1]} for row in result]

    def run_eod_task(self) -> Dict:
        """
        End-of-day task (runs at 16:00 IST):
        1. Finalize daily candles
        2. Compute OHLCV from intraday data
        3. Trigger technical indicator recomputation

        Returns:
            Dict with EOD task statistics
        """
        logger.info("Starting EOD task")
        start_time = time.time()

        stats = {
            'companies_processed': 0,
            'candles_finalized': 0,
            'indicators_triggered': 0,
            'errors': 0
        }

        try:
            companies = self._get_tracked_companies()

            for company in companies:
                try:
                    # Finalize today's candle
                    self._finalize_daily_candle(company['id'])
                    stats['candles_finalized'] += 1

                    # Trigger technical indicator recomputation
                    self._trigger_indicator_computation(company['id'])
                    stats['indicators_triggered'] += 1

                    stats['companies_processed'] += 1

                except Exception as e:
                    logger.error(f"EOD task failed for {company['company_name']}: {e}")
                    stats['errors'] += 1

        except Exception as e:
            logger.error(f"EOD task failed: {e}", exc_info=True)
            stats['errors'] += 1

        duration = time.time() - start_time
        stats['duration_seconds'] = round(duration, 2)

        logger.info(f"EOD task completed: {stats}")

        return stats

    def _finalize_daily_candle(self, company_id: str):
        """
        Compute and store daily OHLCV from intraday data

        Args:
            company_id: UUID of company
        """
        with self.engine.begin() as conn:
            today = datetime.now().date()

            query = text("""
                INSERT INTO price_data (company_id, timestamp, open, high, low, close, volume)
                SELECT
                    company_id,
                    DATE_TRUNC('day', timestamp) as timestamp,
                    FIRST(open, timestamp) as open,
                    MAX(high) as high,
                    MIN(low) as low,
                    LAST(close, timestamp) as close,
                    SUM(volume) as volume
                FROM price_data
                WHERE company_id = :company_id
                  AND DATE(timestamp) = :today
                GROUP BY company_id, DATE_TRUNC('day', timestamp)
                ON CONFLICT (company_id, timestamp) DO UPDATE SET
                    open = EXCLUDED.open,
                    high = EXCLUDED.high,
                    low = EXCLUDED.low,
                    close = EXCLUDED.close,
                    volume = EXCLUDED.volume
            """)

            conn.execute(query, {
                'company_id': company_id,
                'today': today
            })

    def _trigger_indicator_computation(self, company_id: str):
        """
        Trigger technical indicator computation task

        Args:
            company_id: UUID of company
        """
        try:
            from src.tasks import compute_technical_indicators

            compute_technical_indicators.delay(company_id)
            logger.debug(f"Triggered indicator computation for company {company_id}")

        except Exception as e:
            logger.error(f"Failed to trigger indicator computation: {e}")

    def _get_tracked_companies(self) -> List[Dict]:
        """Get all active companies"""
        with self.engine.connect() as conn:
            query = text("""
                SELECT id, company_name, nse_symbol
                FROM companies
                WHERE is_active = true
                  AND nse_symbol IS NOT NULL
                ORDER BY company_name
            """)
            result = conn.execute(query)
            return [dict(row._mapping) for row in result]


def run_price_websocket():
    """Celery task wrapper for starting price WebSocket"""
    pipeline = PriceIngestionPipeline()
    pipeline.start_websocket()


def run_eod_task():
    """Celery task wrapper for EOD task"""
    pipeline = PriceIngestionPipeline()
    return pipeline.run_eod_task()
