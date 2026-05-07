-- Initialize TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertables for time-series data
-- These will be created after tables are defined by Prisma migrations
-- Example: SELECT create_hypertable('stock_prices', 'timestamp');
