-- ============================================
-- Materialized Views for Performance Optimization
-- ============================================
-- These views pre-compute expensive JOINs and aggregations
-- Refresh frequency: 5-15 minutes via Celery tasks
-- ============================================

-- ============================================
-- 1. SCREENER DATA VIEW
-- ============================================
-- Pre-joins companies + scores + metrics + prices
-- Powers the entire screener page with one fast query

DROP MATERIALIZED VIEW IF EXISTS mv_screener_data CASCADE;

CREATE MATERIALIZED VIEW mv_screener_data AS
SELECT
    c.id AS company_id,
    c.symbol,
    c.name AS company_name,
    s.name AS sector_name,
    i.name AS industry_name,

    -- Latest price data (mock for now, replace with actual price_data query)
    100.0 + (RANDOM() * 500) AS cmp,
    (RANDOM() * 10 - 5) AS price_change,
    (RANDOM() * 5 - 2.5) AS price_change_pct,

    -- Market data
    c.market_cap,
    c.promoter_holding,

    -- Composite scores (latest)
    COALESCE(cs.quality_score, 0) AS quality_score,
    COALESCE(cs.growth_score, 0) AS growth_score,
    COALESCE(cs.momentum_score, 0) AS momentum_score,
    COALESCE(cs.risk_score, 0) AS risk_score,
    COALESCE(cs.sentiment_score, 0) AS sentiment_score,

    -- Key financial ratios (mock for now, replace with actual company_metrics)
    15.0 + (RANDOM() * 20) AS roe,
    12.0 + (RANDOM() * 18) AS roce,
    8.0 + (RANDOM() * 25) AS operating_margin,
    0.2 + (RANDOM() * 1.5) AS debt_to_equity,
    20.0 + (RANDOM() * 30) AS pe_ratio,

    -- Growth metrics (mock for now)
    10.0 + (RANDOM() * 25) AS revenue_cagr_5y,
    8.0 + (RANDOM() * 30) AS profit_cagr_5y,

    -- Price ranges (mock for now)
    80.0 + (RANDOM() * 600) AS week_52_high,
    50.0 + (RANDOM() * 400) AS week_52_low,

    -- Returns (mock for now)
    (RANDOM() * 100 - 20) AS year_return_pct,
    (RANDOM() * 60 - 10) AS month_return_pct,
    (RANDOM() * 30 - 5) AS week_return_pct,

    -- Timestamps
    cs.computed_at AS scores_updated_at,
    NOW() AS last_refreshed

FROM companies c
LEFT JOIN sectors s ON c.sector_id = s.id
LEFT JOIN industries i ON c.industry_id = i.id
LEFT JOIN LATERAL (
    SELECT *
    FROM composite_scores
    WHERE company_id = c.id
    ORDER BY computed_at DESC
    LIMIT 1
) cs ON true

WHERE c.is_active = true;

-- Create unique index for CONCURRENT refresh
CREATE UNIQUE INDEX idx_mv_screener_data_company_id ON mv_screener_data(company_id);

-- Create indexes for filtering and sorting
CREATE INDEX idx_mv_screener_data_sector ON mv_screener_data(sector_name);
CREATE INDEX idx_mv_screener_data_industry ON mv_screener_data(industry_name);
CREATE INDEX idx_mv_screener_data_quality_score ON mv_screener_data(quality_score DESC);
CREATE INDEX idx_mv_screener_data_growth_score ON mv_screener_data(growth_score DESC);
CREATE INDEX idx_mv_screener_data_momentum_score ON mv_screener_data(momentum_score DESC);
CREATE INDEX idx_mv_screener_data_risk_score ON mv_screener_data(risk_score);
CREATE INDEX idx_mv_screener_data_sentiment_score ON mv_screener_data(sentiment_score DESC);
CREATE INDEX idx_mv_screener_data_market_cap ON mv_screener_data(market_cap DESC);
CREATE INDEX idx_mv_screener_data_pe_ratio ON mv_screener_data(pe_ratio);
CREATE INDEX idx_mv_screener_data_roe ON mv_screener_data(roe DESC);

-- ============================================
-- 2. SECTOR AGGREGATES VIEW
-- ============================================
-- Pre-computed sector-level metrics
-- Powers sector heatmap and sector overview pages

DROP MATERIALIZED VIEW IF EXISTS mv_sector_aggregates CASCADE;

CREATE MATERIALIZED VIEW mv_sector_aggregates AS
SELECT
    s.id AS sector_id,
    s.name AS sector_name,
    COUNT(DISTINCT c.id) AS stock_count,

    -- Average scores
    AVG(cs.quality_score) AS avg_quality_score,
    AVG(cs.growth_score) AS avg_growth_score,
    AVG(cs.momentum_score) AS avg_momentum_score,
    AVG(cs.risk_score) AS avg_risk_score,
    AVG(cs.sentiment_score) AS avg_sentiment_score,

    -- Financial aggregates (mock for now)
    AVG(15.0 + (RANDOM() * 20)) AS avg_pe,
    AVG(12.0 + (RANDOM() * 15)) AS avg_roe,
    SUM(c.market_cap) AS total_market_cap,

    -- Price movements (mock for now)
    (RANDOM() * 6 - 3) AS daily_change_pct,
    (RANDOM() * 15 - 7) AS weekly_change_pct,
    (RANDOM() * 30 - 10) AS monthly_change_pct,

    -- Top performers (mock for now)
    (ARRAY_AGG(c.symbol ORDER BY RANDOM()))[1] AS top_gainer_symbol,
    (ARRAY_AGG(c.symbol ORDER BY RANDOM()))[2] AS top_loser_symbol,

    NOW() AS last_refreshed

FROM sectors s
LEFT JOIN companies c ON s.id = c.sector_id AND c.is_active = true
LEFT JOIN LATERAL (
    SELECT *
    FROM composite_scores
    WHERE company_id = c.id
    ORDER BY computed_at DESC
    LIMIT 1
) cs ON true

GROUP BY s.id, s.name;

-- Create unique index for CONCURRENT refresh
CREATE UNIQUE INDEX idx_mv_sector_aggregates_sector_id ON mv_sector_aggregates(sector_id);

-- Create indexes
CREATE INDEX idx_mv_sector_aggregates_name ON mv_sector_aggregates(sector_name);
CREATE INDEX idx_mv_sector_aggregates_market_cap ON mv_sector_aggregates(total_market_cap DESC);

-- ============================================
-- 3. DASHBOARD DATA VIEW
-- ============================================
-- Pre-computed dashboard widgets data
-- Powers the dashboard page

DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_data CASCADE;

CREATE MATERIALIZED VIEW mv_dashboard_data AS
SELECT
    'market_overview' AS widget_type,
    jsonb_build_object(
        'indices', jsonb_build_array(
            jsonb_build_object(
                'name', 'NIFTY 50',
                'value', 21000 + (RANDOM() * 1000),
                'change', (RANDOM() * 200 - 100),
                'change_pct', (RANDOM() * 2 - 1)
            ),
            jsonb_build_object(
                'name', 'SENSEX',
                'value', 70000 + (RANDOM() * 2000),
                'change', (RANDOM() * 500 - 250),
                'change_pct', (RANDOM() * 2 - 1)
            ),
            jsonb_build_object(
                'name', 'NIFTY BANK',
                'value', 45000 + (RANDOM() * 1000),
                'change', (RANDOM() * 300 - 150),
                'change_pct', (RANDOM() * 2 - 1)
            )
        )
    ) AS data,
    NOW() AS last_refreshed

UNION ALL

-- Trending stocks (mock for now)
SELECT
    'trending_stocks' AS widget_type,
    jsonb_build_object(
        'stocks', jsonb_agg(
            jsonb_build_object(
                'symbol', c.symbol,
                'name', c.name,
                'change_pct', (RANDOM() * 10 - 5),
                'volume', (RANDOM() * 5000000)::bigint
            )
        )
    ) AS data,
    NOW() AS last_refreshed
FROM (
    SELECT id, symbol, name
    FROM companies
    WHERE is_active = true
    ORDER BY RANDOM()
    LIMIT 10
) c

UNION ALL

-- Recent alerts summary (mock for now)
SELECT
    'alerts_summary' AS widget_type,
    jsonb_build_object(
        'total_alerts', (RANDOM() * 50)::int,
        'high_priority', (RANDOM() * 10)::int,
        'medium_priority', (RANDOM() * 20)::int,
        'low_priority', (RANDOM() * 20)::int
    ) AS data,
    NOW() AS last_refreshed;

-- Create index
CREATE INDEX idx_mv_dashboard_data_widget ON mv_dashboard_data(widget_type);

-- ============================================
-- REFRESH FUNCTIONS
-- ============================================
-- Helper functions to refresh materialized views

-- Refresh all materialized views concurrently
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_screener_data;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sector_aggregates;
    REFRESH MATERIALIZED VIEW mv_dashboard_data;

    RAISE NOTICE 'All materialized views refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Refresh screener data only
CREATE OR REPLACE FUNCTION refresh_screener_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_screener_data;
    RAISE NOTICE 'Screener materialized view refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Refresh sector aggregates only
CREATE OR REPLACE FUNCTION refresh_sector_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sector_aggregates;
    RAISE NOTICE 'Sector aggregates materialized view refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USAGE EXAMPLES
-- ============================================
-- Query screener data:
-- SELECT * FROM mv_screener_data WHERE quality_score > 70 ORDER BY quality_score DESC;
--
-- Query sector aggregates:
-- SELECT * FROM mv_sector_aggregates ORDER BY total_market_cap DESC;
--
-- Query dashboard data:
-- SELECT * FROM mv_dashboard_data WHERE widget_type = 'market_overview';
--
-- Refresh all views:
-- SELECT refresh_all_materialized_views();
--
-- Or manually:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_screener_data;
-- ============================================

COMMENT ON MATERIALIZED VIEW mv_screener_data IS 'Pre-computed screener data with JOINs for fast queries. Refresh every 5 minutes.';
COMMENT ON MATERIALIZED VIEW mv_sector_aggregates IS 'Pre-computed sector-level aggregates. Refresh every 15 minutes.';
COMMENT ON MATERIALIZED VIEW mv_dashboard_data IS 'Pre-computed dashboard widgets data. Refresh every 5 minutes.';
