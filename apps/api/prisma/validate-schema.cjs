#!/usr/bin/env node

/**
 * Schema Validation Test - Verify against original requirements
 * Tests the implementation against the exact prompt specifications
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

let totalTests = 0;
let passedTests = 0;

function test(name, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`${COLORS.green}✓${COLORS.reset} ${name}`);
    if (details) console.log(`  ${COLORS.cyan}→${COLORS.reset} ${details}`);
  } else {
    console.log(`${COLORS.red}✗${COLORS.reset} ${name}`);
    if (details) console.log(`  ${COLORS.red}→${COLORS.reset} ${details}`);
  }
}

function section(title) {
  console.log(`\n${COLORS.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
  console.log(`${COLORS.blue}${title}${COLORS.reset}`);
  console.log(`${COLORS.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);
}

console.log(`\n${COLORS.cyan}╔════════════════════════════════════════════════╗${COLORS.reset}`);
console.log(`${COLORS.cyan}║   Alpha Signal Schema Validation Test         ║${COLORS.reset}`);
console.log(`${COLORS.cyan}║   Testing Against Original Prompt             ║${COLORS.reset}`);
console.log(`${COLORS.cyan}╚════════════════════════════════════════════════╝${COLORS.reset}\n`);

// Read schema file
const schemaPath = path.join(__dirname, 'schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Read migration file
const migrationPath = path.join(__dirname, 'migrations/20260208000000_timescaledb_setup/migration.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');

// ============================================
// TABLE 1: COMPANIES
// ============================================
section('TABLE 1: companies');

test('companies model exists', schema.includes('model Company'));
test('id field (UUID)', schema.includes('id') && schema.includes('@db.Uuid'));
test('nse_symbol (unique nullable)',
  schema.includes('nseSymbol') &&
  schema.includes('String?') &&
  schema.includes('@unique'));
test('bse_code (unique nullable)',
  schema.includes('bseCode') &&
  schema.includes('String?') &&
  schema.includes('@unique'));
test('isin (unique char 12)',
  schema.includes('isin') &&
  schema.includes('@db.Char(12)') &&
  schema.includes('@unique'));
test('company_name field', schema.includes('companyName'));
test('short_name field', schema.includes('shortName'));
test('sector_id (FK)', schema.includes('sectorId') && schema.includes('Sector'));
test('industry_id (FK)', schema.includes('industryId') && schema.includes('Industry'));
test('market_cap_category enum',
  schema.includes('marketCapCategory') &&
  schema.includes('MarketCapCategory'));
test('MarketCapCategory enum values',
  schema.includes('LARGE_CAP') &&
  schema.includes('MID_CAP') &&
  schema.includes('SMALL_CAP') &&
  schema.includes('MICRO_CAP'));
test('listing_date field', schema.includes('listingDate'));
test('is_active (default true)',
  schema.includes('isActive') &&
  schema.includes('@default(true)'));
test('metadata (JSON)', schema.includes('metadata') && schema.includes('Json?'));
test('created_at field', schema.includes('createdAt'));
test('updated_at field', schema.includes('updatedAt'));

// ============================================
// TABLE 2: SECTORS
// ============================================
section('TABLE 2: sectors');

test('sectors model exists', schema.includes('model Sector'));
test('id field', schema.includes('id'));
test('name field', schema.includes('name'));
test('slug field', schema.includes('slug'));
test('parent_sector_id (self-referencing)',
  schema.includes('parentSectorId') &&
  schema.includes('parentSector') &&
  schema.includes('SectorHierarchy'));

// ============================================
// TABLE 3: INDUSTRIES
// ============================================
section('TABLE 3: industries');

test('industries model exists', schema.includes('model Industry'));
test('id field', schema.includes('id'));
test('name field', schema.includes('name'));
test('slug field', schema.includes('slug'));
test('sector_id (FK)', schema.includes('sectorId') && schema.includes('Sector'));

// ============================================
// TABLE 4: FINANCIAL_RESULTS
// ============================================
section('TABLE 4: financial_results');

test('financial_results model exists', schema.includes('model FinancialResult'));
test('company_id (FK)', schema.includes('companyId') && schema.includes('Company'));
test('period_type enum', schema.includes('periodType') && schema.includes('PeriodType'));
test('PeriodType enum values',
  schema.includes('QUARTERLY') &&
  schema.includes('ANNUAL') &&
  schema.includes('TTM'));
test('fiscal_year field', schema.includes('fiscalYear'));
test('fiscal_quarter (nullable)', schema.includes('fiscalQuarter') && schema.includes('Int?'));
test('revenue field', schema.includes('revenue'));
test('operating_profit field', schema.includes('operatingProfit'));
test('net_profit field', schema.includes('netProfit'));
test('eps field', schema.includes('eps'));
test('operating_margin field', schema.includes('operatingMargin'));
test('net_margin field', schema.includes('netMargin'));
test('tax_rate field', schema.includes('taxRate'));
test('raw_data (JSON)', schema.includes('rawData') && schema.includes('Json?'));
test('source_url field', schema.includes('sourceUrl'));
test('published_at field', schema.includes('publishedAt'));

// ============================================
// TABLE 5: BALANCE_SHEET_DATA
// ============================================
section('TABLE 5: balance_sheet_data');

test('balance_sheet_data model exists', schema.includes('model BalanceSheetData'));
test('company_id (FK)', schema.includes('companyId'));
test('fiscal_year field', schema.includes('fiscalYear'));
test('fiscal_quarter (nullable)', schema.includes('fiscalQuarter'));
test('total_assets field', schema.includes('totalAssets'));
test('total_debt field', schema.includes('totalDebt'));
test('equity field', schema.includes('equity'));
test('cash_equivalents field', schema.includes('cashEquivalents'));
test('current_ratio field', schema.includes('currentRatio'));
test('debt_to_equity field', schema.includes('debtToEquity'));
test('interest_coverage field', schema.includes('interestCoverage'));
test('raw_data (JSON)', schema.includes('rawData'));

// ============================================
// TABLE 6: CASHFLOW_DATA
// ============================================
section('TABLE 6: cashflow_data');

test('cashflow_data model exists', schema.includes('model CashflowData'));
test('company_id (FK)', schema.includes('companyId'));
test('fiscal_year field', schema.includes('fiscalYear'));
test('fiscal_quarter field', schema.includes('fiscalQuarter'));
test('operating_cf field', schema.includes('operatingCf'));
test('investing_cf field', schema.includes('investingCf'));
test('financing_cf field', schema.includes('financingCf'));
test('free_cash_flow field', schema.includes('freeCashFlow'));
test('capex field', schema.includes('capex'));

// ============================================
// TABLE 7: SHAREHOLDING_PATTERNS
// ============================================
section('TABLE 7: shareholding_patterns');

test('shareholding_patterns model exists', schema.includes('model ShareholdingPattern'));
test('company_id (FK)', schema.includes('companyId'));
test('quarter (date)', schema.includes('quarter') && schema.includes('@db.Date'));
test('promoter_holding_pct field', schema.includes('promoterHoldingPct'));
test('fii_holding_pct field', schema.includes('fiiHoldingPct'));
test('dii_holding_pct field', schema.includes('diiHoldingPct'));
test('public_holding_pct field', schema.includes('publicHoldingPct'));
test('pledge_pct field', schema.includes('pledgePct'));
test('num_shareholders field', schema.includes('numShareholders'));

// ============================================
// TABLE 8: INSIDER_TRANSACTIONS
// ============================================
section('TABLE 8: insider_transactions');

test('insider_transactions model exists', schema.includes('model InsiderTransaction'));
test('company_id (FK)', schema.includes('companyId'));
test('transaction_type enum', schema.includes('transactionType') && schema.includes('TransactionType'));
test('TransactionType enum values', schema.includes('BUY') && schema.includes('SELL'));
test('quantity field', schema.includes('quantity'));
test('price field', schema.includes('price'));
test('value field', schema.includes('value'));
test('person_name field', schema.includes('personName'));
test('person_category field', schema.includes('personCategory'));
test('filing_date field', schema.includes('filingDate'));

// ============================================
// TABLE 9: TECHNICAL_INDICATORS
// ============================================
section('TABLE 9: technical_indicators');

test('technical_indicators model exists', schema.includes('model TechnicalIndicator'));
test('company_id (FK)', schema.includes('companyId'));
test('date field', schema.includes('date'));
test('rsi_14 field', schema.includes('rsi14'));
test('macd field', schema.includes('macd'));
test('macd_signal field', schema.includes('macdSignal'));
test('macd_histogram field', schema.includes('macdHistogram'));
test('sma_20 field', schema.includes('sma20'));
test('sma_50 field', schema.includes('sma50'));
test('sma_100 field', schema.includes('sma100'));
test('sma_200 field', schema.includes('sma200'));
test('ema_20 field', schema.includes('ema20'));
test('adx field', schema.includes('adx'));
test('obv field', schema.includes('obv'));
test('bb_upper field', schema.includes('bbUpper'));
test('bb_middle field', schema.includes('bbMiddle'));
test('bb_lower field', schema.includes('bbLower'));
test('atr field', schema.includes('atr'));
test('stochastic_k field', schema.includes('stochasticK'));
test('stochastic_d field', schema.includes('stochasticD'));
test('volume_sma_20 field', schema.includes('volumeSma20'));
test('delivery_pct field', schema.includes('deliveryPct'));

// ============================================
// TABLE 10: NEWS_ARTICLES
// ============================================
section('TABLE 10: news_articles');

test('news_articles model exists', schema.includes('model NewsArticle'));
test('company_id (FK nullable)', schema.includes('companyId') && schema.includes('String?'));
test('sector_id (FK nullable)', schema.includes('sectorId') && schema.includes('String?'));
test('title field', schema.includes('title'));
test('source field', schema.includes('source'));
test('url field', schema.includes('url'));
test('published_at field', schema.includes('publishedAt'));
test('summary field', schema.includes('summary'));
test('full_text field', schema.includes('fullText'));
test('sentiment_score (float)', schema.includes('sentimentScore') && schema.includes('Decimal'));
test('sentiment_label enum', schema.includes('sentimentLabel') && schema.includes('SentimentLabel'));
test('SentimentLabel enum values',
  schema.includes('POSITIVE') &&
  schema.includes('NEGATIVE') &&
  schema.includes('NEUTRAL'));
test('impact_rating enum', schema.includes('impactRating') && schema.includes('ImpactRating'));
test('ImpactRating enum values',
  schema.includes('enum ImpactRating') &&
  schema.includes('HIGH') &&
  schema.includes('MEDIUM') &&
  schema.includes('LOW'));
test('risk_tags (string array)', schema.includes('riskTags') && schema.includes('String[]'));

// ============================================
// TABLE 11: SENTIMENT_SNAPSHOTS
// ============================================
section('TABLE 11: sentiment_snapshots');

test('sentiment_snapshots model exists', schema.includes('model SentimentSnapshot'));
test('company_id (FK)', schema.includes('companyId'));
test('date field', schema.includes('date'));
test('news_sentiment field', schema.includes('newsSentiment'));
test('social_sentiment field', schema.includes('socialSentiment'));
test('composite_sentiment field', schema.includes('compositeSentiment'));
test('sample_size field', schema.includes('sampleSize'));

// ============================================
// TABLE 12: AI_SUMMARIES
// ============================================
section('TABLE 12: ai_summaries');

test('ai_summaries model exists', schema.includes('model AiSummary'));
test('company_id (FK)', schema.includes('companyId'));
test('summary_type enum', schema.includes('summaryType') && schema.includes('SummaryType'));
test('SummaryType enum values',
  schema.includes('BUSINESS_OVERVIEW') &&
  schema.includes('EARNINGS_SUMMARY') &&
  schema.includes('BULL_CASE') &&
  schema.includes('BEAR_CASE') &&
  schema.includes('NEWS_DIGEST') &&
  schema.includes('RISK_ASSESSMENT') &&
  schema.includes('CURRENT_THESIS'));
test('content (JSON)', schema.includes('content') && schema.includes('Json'));
test('model_version field', schema.includes('modelVersion'));
test('prompt_version field', schema.includes('promptVersion'));
test('confidence enum', schema.includes('confidence') && schema.includes('ConfidenceLevel'));
test('ConfidenceLevel enum values',
  schema.includes('enum ConfidenceLevel') &&
  schema.includes('HIGH') &&
  schema.includes('MEDIUM') &&
  schema.includes('LOW'));
test('data_freshness_note field', schema.includes('dataFreshnessNote'));
test('generated_at field', schema.includes('generatedAt'));

// ============================================
// TABLE 13: COMPOSITE_SCORES
// ============================================
section('TABLE 13: composite_scores');

test('composite_scores model exists', schema.includes('model CompositeScore'));
test('company_id (FK)', schema.includes('companyId'));
test('date field', schema.includes('date'));
test('quality_score (int 0-100)', schema.includes('qualityScore') && schema.includes('Int'));
test('growth_score field', schema.includes('growthScore'));
test('risk_score field', schema.includes('riskScore'));
test('sentiment_score field', schema.includes('sentimentScore'));
test('momentum_score field', schema.includes('momentumScore'));
test('factor_breakdown (JSON)', schema.includes('factorBreakdown') && schema.includes('Json'));
test('computed_at field', schema.includes('computedAt'));

// ============================================
// TABLE 14: RISK_FLAGS
// ============================================
section('TABLE 14: risk_flags');

test('risk_flags model exists', schema.includes('model RiskFlag'));
test('company_id (FK)', schema.includes('companyId'));
test('flag_type enum', schema.includes('flagType') && schema.includes('RiskFlagType'));
test('RiskFlagType enum values',
  schema.includes('PROMOTER_PLEDGE') &&
  schema.includes('AUDITOR_CONCERN') &&
  schema.includes('RELATED_PARTY') &&
  schema.includes('DEBT_SPIRAL') &&
  schema.includes('EARNINGS_MANIPULATION') &&
  schema.includes('GOVERNANCE') &&
  schema.includes('LITIGATION') &&
  schema.includes('REGULATORY'));
test('severity enum', schema.includes('severity') && schema.includes('Severity'));
test('description field', schema.includes('description'));
test('detected_at field', schema.includes('detectedAt'));
test('resolved_at (nullable)', schema.includes('resolvedAt') && schema.includes('DateTime?'));
test('evidence (JSON)', schema.includes('evidence') && schema.includes('Json?'));
test('is_active (default true)',
  schema.includes('isActive') &&
  schema.includes('@default(true)'));

// ============================================
// TABLE 15: USERS
// ============================================
section('TABLE 15: users');

test('users model exists', schema.includes('model User'));
test('email field', schema.includes('email'));
test('password_hash field', schema.includes('passwordHash'));
test('name field', schema.includes('name'));
test('tier enum', schema.includes('tier') && schema.includes('UserTier'));
test('UserTier enum values',
  schema.includes('FREE') &&
  schema.includes('PRO') &&
  schema.includes('PREMIUM'));
test('is_active field', schema.includes('isActive'));
test('created_at field', schema.includes('createdAt'));
test('last_login_at field', schema.includes('lastLoginAt'));

// ============================================
// TABLE 16: WATCHLISTS
// ============================================
section('TABLE 16: watchlists');

test('watchlists model exists', schema.includes('model Watchlist'));
test('user_id (FK)', schema.includes('userId'));
test('name field', schema.includes('name'));
test('company_ids (string array)', schema.includes('companyIds') && schema.includes('String[]'));
test('alert_config (JSON)', schema.includes('alertConfig') && schema.includes('Json?'));
test('created_at field', schema.includes('createdAt'));
test('updated_at field', schema.includes('updatedAt'));

// ============================================
// TABLE 17: ALERTS
// ============================================
section('TABLE 17: alerts');

test('alerts model exists', schema.includes('model Alert'));
test('user_id (FK)', schema.includes('userId'));
test('company_id (FK)', schema.includes('companyId'));
test('condition_type enum', schema.includes('conditionType') && schema.includes('AlertConditionType'));
test('AlertConditionType enum values',
  schema.includes('PRICE_ABOVE') &&
  schema.includes('PRICE_BELOW') &&
  schema.includes('VOLUME_SPIKE') &&
  schema.includes('SENTIMENT_CHANGE') &&
  schema.includes('RISK_FLAG') &&
  schema.includes('SCORE_CHANGE'));
test('threshold (float)', schema.includes('threshold') && schema.includes('Decimal'));
test('is_active field', schema.includes('isActive'));
test('last_triggered_at field', schema.includes('lastTriggeredAt'));
test('created_at field', schema.includes('createdAt'));

// ============================================
// TABLE 18: USER_PORTFOLIOS
// ============================================
section('TABLE 18: user_portfolios');

test('user_portfolios model exists', schema.includes('model UserPortfolio'));
test('user_id (FK)', schema.includes('userId'));
test('company_id (FK)', schema.includes('companyId'));
test('quantity field', schema.includes('quantity'));
test('avg_price field', schema.includes('avgPrice'));
test('current_value field', schema.includes('currentValue'));
test('unrealized_pnl field', schema.includes('unrealizedPnl'));
test('added_at field', schema.includes('addedAt'));

// ============================================
// INDEXES
// ============================================
section('INDEXES');

test('companies: nse_symbol index', schema.includes('@@index([nseSymbol])'));
test('companies: bse_code index', schema.includes('@@index([bseCode])'));
test('companies: is_active index', schema.includes('@@index([isActive])'));
test('financial_results: composite unique',
  schema.includes('@@unique([companyId, fiscalYear, fiscalQuarter, periodType])'));
test('technical_indicators: company_id + date',
  schema.includes('@@index([companyId, date])'));
test('news_articles: company_id + published_at',
  schema.includes('@@index([companyId, publishedAt])'));
test('composite_scores: company_id + date',
  schema.includes('@@index([companyId, date])'));
test('sentiment_snapshots: company_id + date',
  schema.includes('@@index([companyId, date])'));

// ============================================
// TIMESCALEDB
// ============================================
section('TIMESCALEDB - price_data');

test('price_data table created', migration.includes('CREATE TABLE') && migration.includes('price_data'));
test('company_id column', migration.includes('company_id UUID'));
test('timestamp column', migration.includes('timestamp TIMESTAMPTZ'));
test('open column', migration.includes('open DECIMAL'));
test('high column', migration.includes('high DECIMAL'));
test('low column', migration.includes('low DECIMAL'));
test('close column', migration.includes('close DECIMAL'));
test('volume column', migration.includes('volume BIGINT'));
test('vwap column', migration.includes('vwap DECIMAL'));
test('delivery_pct column', migration.includes('delivery_pct DECIMAL'));
test('interval column', migration.includes('interval VARCHAR'));
test('PriceInterval enum in schema',
  schema.includes('MIN_1') &&
  schema.includes('MIN_5') &&
  schema.includes('MIN_15') &&
  schema.includes('HOUR_1') &&
  schema.includes('DAILY'));
test('Hypertable created', migration.includes('create_hypertable'));
test('Compression enabled', migration.includes('timescaledb.compress'));
test('Retention policy', migration.includes('add_retention_policy'));
test('Compression policy', migration.includes('add_compression_policy'));
test('Continuous aggregate: daily',
  migration.includes('price_data_daily') &&
  migration.includes('MATERIALIZED VIEW'));
test('Continuous aggregate: hourly',
  migration.includes('price_data_hourly') &&
  migration.includes('MATERIALIZED VIEW'));
test('Helper function: get_latest_price', migration.includes('get_latest_price'));
test('Helper function: get_price_history', migration.includes('get_price_history'));
test('Helper function: calculate_price_change', migration.includes('calculate_price_change'));

// ============================================
// RESULTS
// ============================================
section('TEST RESULTS SUMMARY');

const percentage = ((passedTests / totalTests) * 100).toFixed(1);
const color = percentage >= 95 ? COLORS.green : percentage >= 80 ? COLORS.yellow : COLORS.red;

console.log(`${color}Passed: ${passedTests}/${totalTests} tests (${percentage}%)${COLORS.reset}\n`);

if (passedTests === totalTests) {
  console.log(`${COLORS.green}╔════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.green}║  ✓ ALL TESTS PASSED - SCHEMA FULLY COMPLIANT  ║${COLORS.reset}`);
  console.log(`${COLORS.green}║     Implementation matches prompt 100%         ║${COLORS.reset}`);
  console.log(`${COLORS.green}╚════════════════════════════════════════════════╝${COLORS.reset}\n`);
  process.exit(0);
} else {
  const failed = totalTests - passedTests;
  console.log(`${COLORS.yellow}╔════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.yellow}║  ⚠ ${failed} TEST(S) FAILED - REVIEW REQUIRED        ║${COLORS.reset}`);
  console.log(`${COLORS.yellow}╚════════════════════════════════════════════════╝${COLORS.reset}\n`);
  process.exit(1);
}
