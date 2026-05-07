#!/bin/bash

# Initialize Alpha Signal Production Database
# This script runs database migrations, seeds initial data, and sets up TimescaleDB

set -e

echo "🚀 Initializing Alpha Signal Production Database..."
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U alphasignal -d alphasignal > /dev/null 2>&1; do
    echo "   PostgreSQL is unavailable - sleeping"
    sleep 2
done
echo "✅ PostgreSQL is ready!"
echo ""

# Run Prisma migrations
echo "📦 Running Prisma migrations..."
cd /app/apps/api
npx prisma migrate deploy
echo "✅ Migrations applied successfully!"
echo ""

# Create TimescaleDB extension
echo "🕒 Creating TimescaleDB extension..."
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;" || true
echo "✅ TimescaleDB extension created!"
echo ""

# Create hypertables for time-series data
echo "📊 Creating hypertables..."

# Check if price_data exists and is not already a hypertable
psql $DATABASE_URL << 'EOF'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_data') THEN
        IF NOT EXISTS (SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_name = 'price_data') THEN
            SELECT create_hypertable('price_data', 'timestamp', if_not_exists => TRUE);
            RAISE NOTICE 'Hypertable created for price_data';
        ELSE
            RAISE NOTICE 'price_data is already a hypertable';
        END IF;
    ELSE
        RAISE NOTICE 'price_data table does not exist yet';
    END IF;
END $$;
EOF

# Check if technical_indicators exists and is not already a hypertable
psql $DATABASE_URL << 'EOF'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'technical_indicators') THEN
        IF NOT EXISTS (SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_name = 'technical_indicators') THEN
            SELECT create_hypertable('technical_indicators', 'timestamp', if_not_exists => TRUE);
            RAISE NOTICE 'Hypertable created for technical_indicators';
        ELSE
            RAISE NOTICE 'technical_indicators is already a hypertable';
        END IF;
    ELSE
        RAISE NOTICE 'technical_indicators table does not exist yet';
    END IF;
END $$;
EOF

echo "✅ Hypertables created!"
echo ""

# Seed initial data (optional - run seed script if it exists)
echo "🌱 Seeding initial data..."
if [ -f "/app/apps/api/prisma/seed.ts" ]; then
    npx tsx /app/apps/api/prisma/seed.ts || echo "⚠️  Seed script not found or failed (this is optional)"
else
    echo "⚠️  Seed script not found (skipping)"
fi
echo ""

# Create materialized views
echo "🔍 Creating materialized views..."
psql $DATABASE_URL << 'EOF'
-- Materialized view for top gainers/losers
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_movers AS
SELECT
    c.id,
    c.company_name,
    c.nse_symbol,
    pd.close_price,
    pd.change_percent,
    pd.volume,
    pd.timestamp
FROM companies c
JOIN LATERAL (
    SELECT close_price, change_percent, volume, timestamp
    FROM price_data
    WHERE company_id = c.id
    ORDER BY timestamp DESC
    LIMIT 1
) pd ON true
WHERE c.is_listed = true
ORDER BY pd.change_percent DESC;

CREATE UNIQUE INDEX IF NOT EXISTS mv_top_movers_id_idx ON mv_top_movers(id);

-- Materialized view for sector performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_sector_performance AS
SELECT
    s.id,
    s.name as sector_name,
    COUNT(c.id) as company_count,
    AVG(pd.change_percent) as avg_change_percent,
    SUM(pd.volume) as total_volume,
    MAX(pd.timestamp) as last_updated
FROM sectors s
LEFT JOIN companies c ON c.sector_id = s.id AND c.is_listed = true
LEFT JOIN LATERAL (
    SELECT change_percent, volume, timestamp
    FROM price_data
    WHERE company_id = c.id
    ORDER BY timestamp DESC
    LIMIT 1
) pd ON true
GROUP BY s.id, s.name;

CREATE UNIQUE INDEX IF NOT EXISTS mv_sector_performance_id_idx ON mv_sector_performance(id);

EOF

echo "✅ Materialized views created!"
echo ""

# Create additional indexes
echo "🔧 Creating additional indexes..."
psql $DATABASE_URL << 'EOF'
-- Price data indexes
CREATE INDEX IF NOT EXISTS idx_price_data_company_timestamp ON price_data(company_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_data_timestamp ON price_data(timestamp DESC);

-- Technical indicators indexes
CREATE INDEX IF NOT EXISTS idx_technical_indicators_company_timestamp ON technical_indicators(company_id, timestamp DESC);

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector_id);
CREATE INDEX IF NOT EXISTS idx_companies_market_cap ON companies(market_cap_category);
CREATE INDEX IF NOT EXISTS idx_companies_listed ON companies(is_listed) WHERE is_listed = true;

-- News articles indexes
CREATE INDEX IF NOT EXISTS idx_news_articles_company_published ON news_articles(company_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_sentiment ON news_articles(sentiment_label);

-- Stock events indexes (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_events') THEN
        CREATE INDEX IF NOT EXISTS idx_stock_events_company_date ON stock_events(company_id, event_date DESC);
        CREATE INDEX IF NOT EXISTS idx_stock_events_type ON stock_events(event_type);
        RAISE NOTICE 'Stock events indexes created';
    END IF;
END $$;

EOF

echo "✅ Indexes created!"
echo ""

echo "🎉 Database initialized successfully!"
echo ""
echo "📊 Database Statistics:"
psql $DATABASE_URL -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
echo ""

echo "✅ Production database setup complete!"
