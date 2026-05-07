"""
Technical Analysis Engine for Alpha Signal

Computes technical indicators from price_data (daily OHLCV) and stores in technical_indicators table.
Includes trend classification, breakout detection, and momentum scoring.
"""
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import numpy as np
import pandas as pd
import ta  # Using 'ta' library (pure Python, no C dependencies)
from sqlalchemy import create_engine, text
import os
import uuid

logger = logging.getLogger(__name__)


@dataclass
class TechnicalIndicators:
    """Container for all technical indicators"""
    date: datetime
    close: float
    volume: int

    # Moving Averages
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    sma_100: Optional[float] = None
    sma_200: Optional[float] = None
    ema_20: Optional[float] = None

    # Distance from MAs (%)
    dist_sma_20: Optional[float] = None
    dist_sma_50: Optional[float] = None
    dist_sma_100: Optional[float] = None
    dist_sma_200: Optional[float] = None

    # Momentum indicators
    rsi_14: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None

    # Volatility
    bb_upper: Optional[float] = None
    bb_middle: Optional[float] = None
    bb_lower: Optional[float] = None
    atr: Optional[float] = None

    # Trend
    adx: Optional[float] = None

    # Stochastic
    stochastic_k: Optional[float] = None
    stochastic_d: Optional[float] = None

    # Volume
    obv: Optional[float] = None
    volume_sma_20: Optional[float] = None
    volume_spike: bool = False

    # Delivery %
    delivery_pct: Optional[float] = None
    delivery_sma_10: Optional[float] = None


@dataclass
class TrendAnalysis:
    """Trend classification and breakout detection"""
    trend_status: str  # STRONG_UPTREND, UPTREND, SIDEWAYS, DOWNTREND, STRONG_DOWNTREND
    breakout_active: bool = False
    breakout_date: Optional[datetime] = None
    breakout_price: Optional[float] = None
    breakout_range_low: Optional[float] = None
    breakout_range_high: Optional[float] = None
    days_since_breakout: Optional[int] = None
    volume_confirmation: bool = False


@dataclass
class MomentumScore:
    """Momentum score breakdown (0-100)"""
    total_score: float
    rsi_component: float  # 20%
    ma_alignment_component: float  # 25%
    macd_component: float  # 20%
    volume_component: float  # 15%
    relative_strength_component: float  # 20%


class TechnicalAnalysisEngine:
    """
    Main engine for computing technical indicators
    """

    def __init__(self, db_url: Optional[str] = None):
        """Initialize engine with database connection"""
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)

    def compute_all_indicators(self, company_id: str) -> Dict:
        """
        Compute all technical indicators for a company

        Returns:
            Dict with indicators, trend analysis, momentum score, and quality flags
        """
        logger.info(f"Computing technical indicators for company {company_id}")

        # Fetch price data
        price_data = self._fetch_price_data(company_id)

        if len(price_data) < 20:
            raise ValueError(f"Insufficient price data: {len(price_data)} days (need at least 20)")

        df = pd.DataFrame(price_data)

        # Quality flags
        flags = []
        if len(df) < 200:
            flags.append('insufficient_price_history')

        avg_volume = df['volume'].mean()
        if avg_volume < 1000:
            flags.append('low_liquidity_warning')

        # Compute all technical indicators
        df = self._compute_indicators(df)

        # Trend analysis
        trend = self._analyze_trend(df)

        # Breakout detection
        breakout = self._detect_breakout(df)
        if breakout['active']:
            trend.breakout_active = True
            trend.breakout_date = breakout['date']
            trend.breakout_price = breakout['price']
            trend.breakout_range_low = breakout['range_low']
            trend.breakout_range_high = breakout['range_high']
            trend.days_since_breakout = breakout['days_since']
            trend.volume_confirmation = breakout['volume_confirmed']

        # Momentum score
        momentum_score = self._compute_momentum_score(df, company_id)

        # Store in database
        self._store_indicators(company_id, df)

        logger.info(f"Successfully computed indicators for {company_id}")

        return {
            'company_id': company_id,
            'indicators_computed': len(df),
            'trend_analysis': trend,
            'momentum_score': momentum_score,
            'quality_flags': flags,
            'latest_indicators': self._get_latest_indicators(df)
        }

    def _fetch_price_data(self, company_id: str) -> List[Dict]:
        """Fetch OHLCV data from price_data table"""
        with self.engine.connect() as conn:
            query = text("""
                SELECT
                    timestamp::date as date,
                    open, high, low, close, volume,
                    delivery_pct
                FROM price_data
                WHERE company_id = :company_id
                AND interval = 'DAILY'
                ORDER BY timestamp ASC
            """)
            result = conn.execute(query, {'company_id': company_id})
            data = [dict(row._mapping) for row in result]

            # Convert to float
            for row in data:
                for key in ['open', 'high', 'low', 'close']:
                    if row.get(key) is not None:
                        row[key] = float(row[key])
                if row.get('delivery_pct') is not None:
                    row['delivery_pct'] = float(row['delivery_pct'])

            return data

    def _compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute all technical indicators using 'ta' library"""

        # Moving Averages
        df['sma_20'] = ta.trend.sma_indicator(df['close'], window=20)
        df['sma_50'] = ta.trend.sma_indicator(df['close'], window=50)
        if len(df) >= 100:
            df['sma_100'] = ta.trend.sma_indicator(df['close'], window=100)
        if len(df) >= 200:
            df['sma_200'] = ta.trend.sma_indicator(df['close'], window=200)
        df['ema_20'] = ta.trend.ema_indicator(df['close'], window=20)

        # Distance from MAs (%)
        df['dist_sma_20'] = ((df['close'] - df['sma_20']) / df['sma_20'] * 100)
        df['dist_sma_50'] = ((df['close'] - df['sma_50']) / df['sma_50'] * 100)
        if 'sma_100' in df.columns:
            df['dist_sma_100'] = ((df['close'] - df['sma_100']) / df['sma_100'] * 100)
        if 'sma_200' in df.columns:
            df['dist_sma_200'] = ((df['close'] - df['sma_200']) / df['sma_200'] * 100)

        # RSI
        df['rsi_14'] = ta.momentum.rsi(df['close'], window=14)

        # MACD
        macd = ta.trend.MACD(df['close'], window_slow=26, window_fast=12, window_sign=9)
        df['macd'] = macd.macd()
        df['macd_signal'] = macd.macd_signal()
        df['macd_histogram'] = macd.macd_diff()

        # Bollinger Bands
        bb = ta.volatility.BollingerBands(df['close'], window=20, window_dev=2)
        df['bb_upper'] = bb.bollinger_hband()
        df['bb_middle'] = bb.bollinger_mavg()
        df['bb_lower'] = bb.bollinger_lband()

        # ADX
        df['adx'] = ta.trend.adx(df['high'], df['low'], df['close'], window=14)

        # Stochastic Oscillator
        stoch = ta.momentum.StochasticOscillator(
            df['high'], df['low'], df['close'],
            window=14, smooth_window=3
        )
        df['stochastic_k'] = stoch.stoch()
        df['stochastic_d'] = stoch.stoch_signal()

        # ATR
        df['atr'] = ta.volatility.average_true_range(df['high'], df['low'], df['close'], window=14)

        # OBV
        df['obv'] = ta.volume.on_balance_volume(df['close'], df['volume'])

        # Volume metrics
        df['volume_sma_20'] = df['volume'].rolling(window=20).mean()
        df['volume_spike'] = df['volume'] > (df['volume_sma_20'] * 2)

        # Delivery % trend
        if 'delivery_pct' in df.columns:
            df['delivery_sma_10'] = df['delivery_pct'].rolling(window=10).mean()

        return df

    def _analyze_trend(self, df: pd.DataFrame) -> TrendAnalysis:
        """Classify trend status"""
        latest = df.iloc[-1]
        close = latest['close']
        sma_20 = latest.get('sma_20')
        sma_50 = latest.get('sma_50')
        sma_200 = latest.get('sma_200')
        adx = latest.get('adx', 0)

        # Determine trend
        if pd.notna(sma_20) and pd.notna(sma_50) and pd.notna(sma_200):
            if close > sma_20 > sma_50 > sma_200 and adx > 25:
                trend_status = "STRONG_UPTREND"
            elif close > sma_50 > sma_200:
                trend_status = "UPTREND"
            elif close < sma_20 < sma_50 < sma_200 and adx > 25:
                trend_status = "STRONG_DOWNTREND"
            elif close < sma_50 < sma_200:
                trend_status = "DOWNTREND"
            else:
                trend_status = "SIDEWAYS"
        elif pd.notna(sma_50):
            # Fallback if SMA-200 not available
            if close > sma_50:
                trend_status = "UPTREND"
            elif close < sma_50:
                trend_status = "DOWNTREND"
            else:
                trend_status = "SIDEWAYS"
        else:
            trend_status = "INSUFFICIENT_DATA"

        return TrendAnalysis(trend_status=trend_status)

    def _detect_breakout(self, df: pd.DataFrame) -> Dict:
        """Detect breakouts from consolidation ranges"""
        if len(df) < 50:
            return {'active': False}

        # Look for 50-day consolidation (high-low range < 15% of mean)
        lookback = 50
        recent = df.tail(lookback + 10)  # Extra 10 days to check for breakout

        consolidation_period = recent.iloc[:lookback]
        high = consolidation_period['high'].max()
        low = consolidation_period['low'].min()
        mean_price = consolidation_period['close'].mean()
        range_pct = ((high - low) / mean_price) * 100

        if range_pct < 15:  # Consolidation detected
            # Check for breakout in last 10 days
            breakout_period = recent.iloc[lookback:]
            avg_volume = consolidation_period['volume'].mean()

            for i, row in breakout_period.iterrows():
                if row['close'] > high and row['volume'] > (avg_volume * 1.5):
                    # Breakout detected!
                    days_since = len(df) - df.index.get_loc(i) - 1

                    # Check if volume confirmation persists
                    after_breakout = df.loc[i:].tail(min(days_since + 1, 5))
                    volume_confirmed = (after_breakout['volume'] > avg_volume).mean() > 0.6

                    return {
                        'active': True,
                        'date': row['date'],
                        'price': row['close'],
                        'range_low': low,
                        'range_high': high,
                        'days_since': days_since,
                        'volume_confirmed': volume_confirmed
                    }

        return {'active': False}

    def _compute_momentum_score(self, df: pd.DataFrame, company_id: str) -> MomentumScore:
        """
        Compute momentum score (0-100) with component breakdown
        """
        latest = df.iloc[-1]

        # Component 1: RSI positioning (20%)
        # RSI 50-65 scores highest (healthy uptrend)
        rsi = latest.get('rsi_14', 50)
        if 50 <= rsi <= 65:
            rsi_score = 100
        elif rsi > 65:
            # Overbought
            rsi_score = max(0, 100 - (rsi - 65) * 2)
        else:
            # Below 50
            rsi_score = (rsi / 50) * 100
        rsi_component = rsi_score * 0.20

        # Component 2: Price-MA alignment (25%)
        # All MAs aligned bullishly = 100
        close = latest['close']
        sma_20 = latest.get('sma_20')
        sma_50 = latest.get('sma_50')
        sma_200 = latest.get('sma_200')

        alignment_score = 0
        if pd.notna(sma_20):
            if close > sma_20:
                alignment_score += 25
            if pd.notna(sma_50) and sma_20 > sma_50:
                alignment_score += 25
            if pd.notna(sma_200) and sma_50 and sma_50 > sma_200:
                alignment_score += 25
            if pd.notna(sma_200) and close > sma_200:
                alignment_score += 25
        ma_alignment_component = alignment_score * 0.25

        # Component 3: MACD trend (20%)
        # MACD above signal and rising = 100
        macd = latest.get('macd', 0)
        macd_signal = latest.get('macd_signal', 0)
        macd_hist = latest.get('macd_histogram', 0)

        macd_score = 50  # Neutral
        if macd > macd_signal and macd_hist > 0:
            macd_score = 100
        elif macd < macd_signal and macd_hist < 0:
            macd_score = 0
        macd_component = macd_score * 0.20

        # Component 4: Volume confirmation (15%)
        # Rising OBV + above-average volume = 100
        obv_trend = 0
        if len(df) >= 20:
            obv_20_ago = df.iloc[-20]['obv']
            obv_current = latest['obv']
            if pd.notna(obv_20_ago) and pd.notna(obv_current):
                obv_trend = 1 if obv_current > obv_20_ago else -1

        volume_ratio = latest['volume'] / latest.get('volume_sma_20', latest['volume'])
        volume_score = 0
        if obv_trend > 0 and volume_ratio > 1:
            volume_score = min(100, 50 + (volume_ratio - 1) * 50)
        elif obv_trend < 0:
            volume_score = 0
        else:
            volume_score = 50
        volume_component = volume_score * 0.15

        # Component 5: Relative strength vs benchmark (20%)
        # Use proxy: average of seed companies
        rs_component = self._compute_relative_strength(df, company_id) * 0.20

        # Total score
        total = rsi_component + ma_alignment_component + macd_component + volume_component + rs_component
        total = np.clip(total, 0, 100)

        return MomentumScore(
            total_score=total,
            rsi_component=rsi_component,
            ma_alignment_component=ma_alignment_component,
            macd_component=macd_component,
            volume_component=volume_component,
            relative_strength_component=rs_component
        )

    def _compute_relative_strength(self, df: pd.DataFrame, company_id: str) -> float:
        """
        Compute relative strength vs market benchmark
        Uses average of seed companies as proxy for Nifty 500
        """
        if len(df) < 252:  # Need 1 year
            return 50.0

        # Company return (1 year)
        company_return = ((df.iloc[-1]['close'] / df.iloc[-252]['close']) - 1) * 100

        # Benchmark return (proxy: average of all companies)
        with self.engine.connect() as conn:
            query = text("""
                SELECT AVG(
                    (p2.close - p1.close) / p1.close * 100
                ) as avg_return
                FROM (
                    SELECT company_id, close
                    FROM price_data
                    WHERE interval = 'DAILY'
                    AND timestamp = (
                        SELECT MAX(timestamp) FROM price_data WHERE interval = 'DAILY'
                    )
                ) p2
                JOIN (
                    SELECT company_id, close
                    FROM price_data
                    WHERE interval = 'DAILY'
                    AND timestamp = (
                        SELECT MAX(timestamp) - INTERVAL '1 year' FROM price_data WHERE interval = 'DAILY'
                    )
                ) p1 ON p2.company_id = p1.company_id
            """)
            result = conn.execute(query)
            row = result.fetchone()
            benchmark_return = float(row.avg_return) if row.avg_return else 0

        # Score based on outperformance
        outperformance = company_return - benchmark_return

        if outperformance > 20:
            return 100
        elif outperformance < -20:
            return 0
        else:
            # Linear scale
            return 50 + (outperformance / 20) * 50

    def _get_latest_indicators(self, df: pd.DataFrame) -> Dict:
        """Get latest indicator values for reporting"""
        latest = df.iloc[-1]
        return {
            'date': latest['date'],
            'close': latest['close'],
            'rsi_14': latest.get('rsi_14'),
            'macd': latest.get('macd'),
            'macd_signal': latest.get('macd_signal'),
            'macd_histogram': latest.get('macd_histogram'),
            'sma_20': latest.get('sma_20'),
            'sma_50': latest.get('sma_50'),
            'sma_100': latest.get('sma_100'),
            'sma_200': latest.get('sma_200'),
            'ema_20': latest.get('ema_20'),
            'dist_sma_20': latest.get('dist_sma_20'),
            'dist_sma_50': latest.get('dist_sma_50'),
            'dist_sma_100': latest.get('dist_sma_100'),
            'dist_sma_200': latest.get('dist_sma_200'),
            'adx': latest.get('adx'),
            'bb_upper': latest.get('bb_upper'),
            'bb_middle': latest.get('bb_middle'),
            'bb_lower': latest.get('bb_lower'),
            'atr': latest.get('atr'),
            'stochastic_k': latest.get('stochastic_k'),
            'stochastic_d': latest.get('stochastic_d'),
            'obv': latest.get('obv'),
            'volume_sma_20': latest.get('volume_sma_20'),
            'volume_spike': latest.get('volume_spike', False),
            'delivery_sma_10': latest.get('delivery_sma_10')
        }

    def _store_indicators(self, company_id: str, df: pd.DataFrame):
        """Store computed indicators in technical_indicators table"""
        with self.engine.connect() as conn:
            # Delete existing indicators for this company
            conn.execute(text("DELETE FROM technical_indicators WHERE company_id = :cid"),
                        {'cid': company_id})

            # Insert new indicators
            for _, row in df.iterrows():
                conn.execute(text("""
                    INSERT INTO technical_indicators (
                        id, company_id, date,
                        rsi_14, macd, macd_signal, macd_histogram,
                        sma_20, sma_50, sma_100, sma_200, ema_20,
                        adx, obv,
                        bb_upper, bb_middle, bb_lower, atr,
                        stochastic_k, stochastic_d,
                        volume_sma_20, delivery_pct
                    ) VALUES (
                        :id, :company_id, :date,
                        :rsi_14, :macd, :macd_signal, :macd_histogram,
                        :sma_20, :sma_50, :sma_100, :sma_200, :ema_20,
                        :adx, :obv,
                        :bb_upper, :bb_middle, :bb_lower, :atr,
                        :stochastic_k, :stochastic_d,
                        :volume_sma_20, :delivery_pct
                    )
                """), {
                    'id': str(uuid.uuid4()),
                    'company_id': company_id,
                    'date': row['date'],
                    'rsi_14': row.get('rsi_14'),
                    'macd': row.get('macd'),
                    'macd_signal': row.get('macd_signal'),
                    'macd_histogram': row.get('macd_histogram'),
                    'sma_20': row.get('sma_20'),
                    'sma_50': row.get('sma_50'),
                    'sma_100': row.get('sma_100'),
                    'sma_200': row.get('sma_200'),
                    'ema_20': row.get('ema_20'),
                    'adx': row.get('adx'),
                    'obv': int(row.get('obv', 0)) if pd.notna(row.get('obv')) else None,
                    'bb_upper': row.get('bb_upper'),
                    'bb_middle': row.get('bb_middle'),
                    'bb_lower': row.get('bb_lower'),
                    'atr': row.get('atr'),
                    'stochastic_k': row.get('stochastic_k'),
                    'stochastic_d': row.get('stochastic_d'),
                    'volume_sma_20': int(row.get('volume_sma_20', 0)) if pd.notna(row.get('volume_sma_20')) else None,
                    'delivery_pct': row.get('delivery_pct')
                })

            conn.commit()

        logger.info(f"Stored {len(df)} indicator records for company {company_id}")
