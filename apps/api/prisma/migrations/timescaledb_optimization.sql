-- ============================================
-- TimescaleDB Optimization
-- ============================================
-- Compression policies, retention policies, and performance tuning
-- ============================================

-- ============================================
-- 1. COMPRESSION POLICIES
-- ============================================
-- Compress old data to save storage space (10-20x compression)

-- Compress price_data chunks older than 7 days
SELECT add_compression_policy('price_data', INTERVAL '7 days');

-- ============================================
-- 2. RETENTION POLICIES
-- ============================================
-- Automatically drop old data to manage storage

-- Drop 1-minute price data older than 30 days
SELECT add_retention_policy('price_data', INTERVAL '30 days');

-- Note: For production, you may want longer retention:
-- - 1-minute data: 90 days
-- - 5-minute data: 1 year
-- - Daily data: 5 years (via continuous aggregates)

-- ============================================
-- 3. CONTINUOUS AGGREGATES (if not already created)
-- ============================================
-- Pre-compute daily, weekly, monthly OHLCV data

-- Daily OHLCV (if not exists)
CREATE MATERIALIZED VIEW IF NOT EXISTS price_data_daily
WITH (timescaledb.continuous) AS
SELECT
    company_id,
    time_bucket('1 day', time) AS day,
    first(price, time) AS open,
    max(price) AS high,
    min(price) AS low,
    last(price, time) AS close,
    sum(volume) AS volume
FROM price_data
GROUP BY company_id, day;

-- Refresh policy: refresh last 7 days every hour
SELECT add_continuous_aggregate_policy('price_data_daily',
    start_offset => INTERVAL '7 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Weekly OHLCV (if not exists)
CREATE MATERIALIZED VIEW IF NOT EXISTS price_data_weekly
WITH (timescaledb.continuous) AS
SELECT
    company_id,
    time_bucket('1 week', time) AS week,
    first(price, time) AS open,
    max(price) AS high,
    min(price) AS low,
    last(price, time) AS close,
    sum(volume) AS volume
FROM price_data
GROUP BY company_id, week;

-- Refresh policy: refresh last 4 weeks every day
SELECT add_continuous_aggregate_policy('price_data_weekly',
    start_offset => INTERVAL '4 weeks',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');

-- ============================================
-- 4. CHUNK TIME INTERVALS
-- ============================================
-- Optimize chunk size for better query performance

-- Set chunk interval for price_data (if not already set)
-- 7-day chunks work well for most workloads
SELECT set_chunk_time_interval('price_data', INTERVAL '7 days');

-- ============================================
-- 5. ADDITIONAL INDEXES
-- ============================================
-- Performance indexes for common query patterns

-- Stock events indexes
CREATE INDEX IF NOT EXISTS idx_stock_events_company_date
ON stock_events(company_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_stock_events_type
ON stock_events(event_type);

-- Full-text search on stock events
CREATE INDEX IF NOT EXISTS idx_stock_events_search
ON stock_events USING GIN(to_tsvector('english', title || ' ' || COALESCE(summary, '')));

-- News articles indexes
CREATE INDEX IF NOT EXISTS idx_news_articles_company_published
ON news_articles(company_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_articles_sentiment
ON news_articles(sentiment_label);

-- Full-text search on news articles
CREATE INDEX IF NOT EXISTS idx_news_articles_search
ON news_articles USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Composite scores indexes
CREATE INDEX IF NOT EXISTS idx_composite_scores_company_date
ON composite_scores(company_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_composite_scores_quality
ON composite_scores(quality_score DESC);

CREATE INDEX IF NOT EXISTS idx_composite_scores_growth
ON composite_scores(growth_score DESC);

-- Weekly reports indexes
CREATE INDEX IF NOT EXISTS idx_weekly_reports_published
ON weekly_reports(published_at DESC) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_weekly_reports_slug
ON weekly_reports(slug) WHERE is_published = true;

-- User subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
ON subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_expires
ON subscriptions(expires_at) WHERE status = 'ACTIVE';

-- Watchlist indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user_company
ON watchlist(user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_watchlist_company
ON watchlist(company_id);

-- Portfolio holdings indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_user_company
ON portfolio_holdings(user_id, company_id);

-- Company metrics indexes
CREATE INDEX IF NOT EXISTS idx_company_metrics_company_period
ON company_metrics(company_id, period DESC);

-- ============================================
-- 6. STATISTICS UPDATE
-- ============================================
-- Update table statistics for query planner

ANALYZE companies;
ANALYZE price_data;
ANALYZE composite_scores;
ANALYZE stock_events;
ANALYZE news_articles;
ANALYZE weekly_reports;
ANALYZE subscriptions;
ANALYZE watchlist;
ANALYZE portfolio_holdings;

-- ============================================
-- 7. VACUUM AND REINDEX (maintenance)
-- ============================================
-- Run periodically to maintain performance

-- Vacuum all tables (removes dead rows)
VACUUM ANALYZE;

-- Note: Schedule these via cron or pg_cron:
-- - VACUUM ANALYZE daily at 2 AM
-- - REINDEX weekly on Sunday at 3 AM

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check compression policies
SELECT * FROM timescaledb_information.compression_settings;

-- Check retention policies
SELECT * FROM timescaledb_information.data_nodes;

-- Check continuous aggregates
SELECT * FROM timescaledb_information.continuous_aggregates;

-- Check chunk intervals
SELECT * FROM timescaledb_information.dimensions;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS external_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

COMMENT ON TABLE price_data IS 'TimescaleDB hypertable with compression (7-day chunks, 30-day retention)';
COMMENT ON MATERIALIZED VIEW price_data_daily IS 'Daily OHLCV continuous aggregate, refreshed hourly';
COMMENT ON MATERIALIZED VIEW price_data_weekly IS 'Weekly OHLCV continuous aggregate, refreshed daily';
