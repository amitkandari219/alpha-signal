-- TimescaleDB Setup Migration for Alpha Signal
-- This migration sets up TimescaleDB-specific features for time-series price data
-- Run this after enabling TimescaleDB extension: CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ============================================
-- ENABLE TIMESCALEDB EXTENSION
-- ============================================

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ============================================
-- PRICE DATA HYPERTABLE
-- ============================================

-- Create the price_data table for OHLCV time-series data
-- This table is managed outside Prisma because Prisma doesn't natively support hypertables
CREATE TABLE IF NOT EXISTS price_data (
    company_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open DECIMAL(10, 2) NOT NULL,
    high DECIMAL(10, 2) NOT NULL,
    low DECIMAL(10, 2) NOT NULL,
    close DECIMAL(10, 2) NOT NULL,
    volume BIGINT NOT NULL,
    vwap DECIMAL(10, 2),
    delivery_pct DECIMAL(5, 2),
    interval VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Composite primary key for hypertable
    PRIMARY KEY (company_id, timestamp, interval),

    -- Foreign key to companies table
    CONSTRAINT fk_price_data_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
);

-- Create index on interval for efficient filtering
CREATE INDEX IF NOT EXISTS idx_price_data_interval ON price_data(interval);

-- Create index on timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_price_data_timestamp ON price_data(timestamp DESC);

-- Create composite index for company + interval queries
CREATE INDEX IF NOT EXISTS idx_price_data_company_interval ON price_data(company_id, interval, timestamp DESC);

-- Add constraint for valid interval values
ALTER TABLE price_data ADD CONSTRAINT chk_price_data_interval
    CHECK (interval IN ('MIN_1', 'MIN_5', 'MIN_15', 'HOUR_1', 'DAILY'));

-- Convert to hypertable (partition by timestamp with 1 day chunks)
SELECT create_hypertable(
    'price_data',
    'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Enable compression on the hypertable
ALTER TABLE price_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'company_id, interval',
    timescaledb.compress_orderby = 'timestamp DESC'
);

-- ============================================
-- RETENTION POLICIES
-- ============================================

-- Add retention policy for 1-minute data (30 days)
-- This automatically drops chunks older than 30 days for MIN_1 interval
SELECT add_retention_policy(
    'price_data',
    INTERVAL '30 days',
    if_not_exists => TRUE
);

-- Add compression policy (compress chunks older than 7 days)
SELECT add_compression_policy(
    'price_data',
    INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Note: For different retention per interval, we'll need to implement custom logic
-- in the application layer to delete old data based on interval type:
-- - MIN_1: 30 days
-- - MIN_5: 90 days
-- - MIN_15: 180 days
-- - HOUR_1: 365 days
-- - DAILY: indefinite (no deletion)

-- ============================================
-- CONTINUOUS AGGREGATES
-- ============================================

-- Create continuous aggregate for daily OHLCV from minute data
-- This pre-computes daily candles from intraday data for faster queries
CREATE MATERIALIZED VIEW IF NOT EXISTS price_data_daily
WITH (timescaledb.continuous) AS
SELECT
    company_id,
    time_bucket('1 day', timestamp) AS day,
    'DAILY' AS interval,
    FIRST(open, timestamp) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, timestamp) AS close,
    SUM(volume) AS volume,
    AVG(vwap) AS vwap,
    AVG(delivery_pct) AS delivery_pct,
    COUNT(*) AS num_candles
FROM price_data
WHERE interval IN ('MIN_1', 'MIN_5', 'MIN_15')
GROUP BY company_id, day;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_price_data_daily_company_day
    ON price_data_daily(company_id, day DESC);

-- Add refresh policy for continuous aggregate (refresh every hour)
SELECT add_continuous_aggregate_policy(
    'price_data_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Create continuous aggregate for hourly OHLCV from minute data
CREATE MATERIALIZED VIEW IF NOT EXISTS price_data_hourly
WITH (timescaledb.continuous) AS
SELECT
    company_id,
    time_bucket('1 hour', timestamp) AS hour,
    'HOUR_1' AS interval,
    FIRST(open, timestamp) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, timestamp) AS close,
    SUM(volume) AS volume,
    AVG(vwap) AS vwap,
    AVG(delivery_pct) AS delivery_pct,
    COUNT(*) AS num_candles
FROM price_data
WHERE interval IN ('MIN_1', 'MIN_5')
GROUP BY company_id, hour;

-- Create index on the hourly materialized view
CREATE INDEX IF NOT EXISTS idx_price_data_hourly_company_hour
    ON price_data_hourly(company_id, hour DESC);

-- Add refresh policy for hourly aggregate (refresh every 5 minutes)
SELECT add_continuous_aggregate_policy(
    'price_data_hourly',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes',
    if_not_exists => TRUE
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get latest price for a company
CREATE OR REPLACE FUNCTION get_latest_price(p_company_id UUID, p_interval VARCHAR DEFAULT 'DAILY')
RETURNS TABLE (
    timestamp TIMESTAMPTZ,
    open DECIMAL,
    high DECIMAL,
    low DECIMAL,
    close DECIMAL,
    volume BIGINT,
    vwap DECIMAL,
    delivery_pct DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pd.timestamp,
        pd.open,
        pd.high,
        pd.low,
        pd.close,
        pd.volume,
        pd.vwap,
        pd.delivery_pct
    FROM price_data pd
    WHERE pd.company_id = p_company_id
      AND pd.interval = p_interval
    ORDER BY pd.timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get OHLCV data for a date range
CREATE OR REPLACE FUNCTION get_price_history(
    p_company_id UUID,
    p_interval VARCHAR,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    timestamp TIMESTAMPTZ,
    open DECIMAL,
    high DECIMAL,
    low DECIMAL,
    close DECIMAL,
    volume BIGINT,
    vwap DECIMAL,
    delivery_pct DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pd.timestamp,
        pd.open,
        pd.high,
        pd.low,
        pd.close,
        pd.volume,
        pd.vwap,
        pd.delivery_pct
    FROM price_data pd
    WHERE pd.company_id = p_company_id
      AND pd.interval = p_interval
      AND pd.timestamp >= p_start_date
      AND pd.timestamp <= p_end_date
    ORDER BY pd.timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate percentage change
CREATE OR REPLACE FUNCTION calculate_price_change(
    p_company_id UUID,
    p_interval VARCHAR DEFAULT 'DAILY',
    p_lookback_periods INT DEFAULT 1
)
RETURNS TABLE (
    current_close DECIMAL,
    previous_close DECIMAL,
    change DECIMAL,
    change_pct DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_prices AS (
        SELECT
            close,
            LAG(close, p_lookback_periods) OVER (ORDER BY timestamp) AS prev_close,
            ROW_NUMBER() OVER (ORDER BY timestamp DESC) AS rn
        FROM price_data
        WHERE company_id = p_company_id
          AND interval = p_interval
    )
    SELECT
        close AS current_close,
        prev_close AS previous_close,
        (close - prev_close) AS change,
        CASE
            WHEN prev_close > 0 THEN ((close - prev_close) / prev_close * 100)
            ELSE NULL
        END AS change_pct
    FROM ranked_prices
    WHERE rn = 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PERFORMANCE OPTIMIZATION
-- ============================================

-- Create statistics for better query planning
CREATE STATISTICS IF NOT EXISTS price_data_company_interval_stats
    ON company_id, interval, timestamp
    FROM price_data;

-- Analyze the table for query planner
ANALYZE price_data;

-- ============================================
-- COMMENTS & DOCUMENTATION
-- ============================================

COMMENT ON TABLE price_data IS 'Time-series OHLCV price data managed by TimescaleDB hypertable';
COMMENT ON COLUMN price_data.company_id IS 'Foreign key reference to companies table';
COMMENT ON COLUMN price_data.timestamp IS 'Timestamp of the candle (open time)';
COMMENT ON COLUMN price_data.interval IS 'Candle interval: MIN_1, MIN_5, MIN_15, HOUR_1, or DAILY';
COMMENT ON COLUMN price_data.vwap IS 'Volume-weighted average price';
COMMENT ON COLUMN price_data.delivery_pct IS 'Delivery percentage (NSE-specific metric)';

COMMENT ON MATERIALIZED VIEW price_data_daily IS 'Continuous aggregate for daily OHLCV computed from minute data';
COMMENT ON MATERIALIZED VIEW price_data_hourly IS 'Continuous aggregate for hourly OHLCV computed from minute data';

COMMENT ON FUNCTION get_latest_price IS 'Get the most recent price data for a company';
COMMENT ON FUNCTION get_price_history IS 'Get historical OHLCV data for a date range';
COMMENT ON FUNCTION calculate_price_change IS 'Calculate price change and percentage change over N periods';

-- ============================================
-- SAMPLE QUERIES
-- ============================================

/*
-- Insert sample price data
INSERT INTO price_data (company_id, timestamp, open, high, low, close, volume, vwap, delivery_pct, interval)
VALUES (
    'company-uuid-here'::uuid,
    '2024-02-08 09:15:00+00',
    2847.50,
    2850.00,
    2845.00,
    2848.75,
    125000,
    2847.80,
    65.50,
    'MIN_1'
);

-- Get latest daily price
SELECT * FROM get_latest_price('company-uuid-here'::uuid, 'DAILY');

-- Get price history for last 30 days
SELECT * FROM get_price_history(
    'company-uuid-here'::uuid,
    'DAILY',
    NOW() - INTERVAL '30 days',
    NOW()
);

-- Calculate daily percentage change
SELECT * FROM calculate_price_change('company-uuid-here'::uuid, 'DAILY', 1);

-- Query daily aggregate view
SELECT * FROM price_data_daily
WHERE company_id = 'company-uuid-here'::uuid
  AND day >= NOW() - INTERVAL '90 days'
ORDER BY day DESC;

-- Get intraday data (5-minute candles)
SELECT timestamp, open, high, low, close, volume
FROM price_data
WHERE company_id = 'company-uuid-here'::uuid
  AND interval = 'MIN_5'
  AND timestamp >= NOW() - INTERVAL '1 day'
ORDER BY timestamp ASC;
*/
