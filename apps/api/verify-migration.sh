#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║        ALPHA SIGNAL - MIGRATION VERIFICATION                 ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "📊 Checking all tables..."
echo ""

docker exec -i alpha-signal-postgres psql -U alphasignal -d alphasignal << 'SQL'
SELECT 
  'sectors' as table_name, COUNT(*) as rows FROM sectors
UNION ALL SELECT 'industries', COUNT(*) FROM industries
UNION ALL SELECT 'companies', COUNT(*) FROM companies
UNION ALL SELECT 'financial_results', COUNT(*) FROM financial_results
UNION ALL SELECT 'balance_sheet_data', COUNT(*) FROM balance_sheet_data
UNION ALL SELECT 'cashflow_data', COUNT(*) FROM cashflow_data
UNION ALL SELECT 'shareholding_patterns', COUNT(*) FROM shareholding_patterns
UNION ALL SELECT 'insider_transactions', COUNT(*) FROM insider_transactions
UNION ALL SELECT 'technical_indicators', COUNT(*) FROM technical_indicators
UNION ALL SELECT 'news_articles', COUNT(*) FROM news_articles
UNION ALL SELECT 'sentiment_snapshots', COUNT(*) FROM sentiment_snapshots
UNION ALL SELECT 'ai_summaries', COUNT(*) FROM ai_summaries
UNION ALL SELECT 'composite_scores', COUNT(*) FROM composite_scores
UNION ALL SELECT 'risk_flags', COUNT(*) FROM risk_flags
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'watchlists', COUNT(*) FROM watchlists
UNION ALL SELECT 'alerts', COUNT(*) FROM alerts
UNION ALL SELECT 'user_portfolios', COUNT(*) FROM user_portfolios
UNION ALL SELECT 'price_data', COUNT(*) FROM price_data
ORDER BY table_name;
SQL

echo ""
echo "✅ Migration verification complete!"

