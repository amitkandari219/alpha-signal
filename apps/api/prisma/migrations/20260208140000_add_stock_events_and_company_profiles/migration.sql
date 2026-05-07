-- Migration: Add stock_events and company_profiles tables
-- Created: 2026-02-08 14:00:00
-- Tasks: #78 (Event Ingestion Engine) and #79 (Company Profile Builder)

-- ============================================
-- STOCK EVENTS TABLE (TASK #78)
-- ============================================

CREATE TABLE IF NOT EXISTS stock_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_date TIMESTAMP NOT NULL,
    impact_assessment TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    source_id TEXT,
    source_type TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for stock_events
CREATE INDEX idx_stock_events_company_id ON stock_events(company_id);
CREATE INDEX idx_stock_events_event_type ON stock_events(event_type);
CREATE INDEX idx_stock_events_event_date ON stock_events(event_date DESC);
CREATE INDEX idx_stock_events_impact ON stock_events(impact_assessment);
CREATE INDEX idx_stock_events_company_date ON stock_events(company_id, event_date DESC);
CREATE INDEX idx_stock_events_source ON stock_events(source_id, source_type);

-- Add check constraints for stock_events
ALTER TABLE stock_events
ADD CONSTRAINT chk_event_type CHECK (
    event_type IN (
        'QUARTERLY_RESULT', 'ANNUAL_RESULT', 'MANAGEMENT_CHANGE', 'DIVIDEND',
        'STOCK_SPLIT', 'BONUS', 'RIGHTS_ISSUE', 'ACQUISITION', 'DIVESTITURE',
        'CAPEX_ANNOUNCEMENT', 'ORDER_WIN', 'ORDER_LOSS', 'PRODUCT_LAUNCH',
        'PLANT_EXPANSION', 'REGULATORY_ACTION', 'SEBI_NOTICE', 'CREDIT_RATING_CHANGE',
        'AUDITOR_CHANGE', 'PROMOTER_CHANGE', 'BULK_DEAL', 'BLOCK_DEAL', 'PLEDGE_CHANGE',
        'SECTOR_POLICY', 'GOVERNMENT_ORDER', 'CONCALL_HIGHLIGHT', 'ANALYST_ACTION',
        'MEDIA_COVERAGE', 'LITIGATION_UPDATE', 'AGM_EGM', 'BOARD_MEETING', 'OTHER'
    )
);

ALTER TABLE stock_events
ADD CONSTRAINT chk_impact_assessment CHECK (
    impact_assessment IN ('VERY_POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'VERY_NEGATIVE')
);

-- ============================================
-- COMPANY PROFILES TABLE (TASK #79)
-- ============================================

CREATE TABLE IF NOT EXISTS company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    source_urls JSONB DEFAULT '[]',
    confidence_level TEXT NOT NULL DEFAULT 'MEDIUM',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for company_profiles
CREATE INDEX idx_company_profiles_company_id ON company_profiles(company_id);
CREATE INDEX idx_company_profiles_section_type ON company_profiles(section_type);
CREATE INDEX idx_company_profiles_company_section ON company_profiles(company_id, section_type);
CREATE INDEX idx_company_profiles_version ON company_profiles(company_id, section_type, version DESC);
CREATE INDEX idx_company_profiles_last_updated ON company_profiles(last_updated DESC);

-- Add check constraints for company_profiles
ALTER TABLE company_profiles
ADD CONSTRAINT chk_section_type CHECK (
    section_type IN (
        'BUSINESS_MODEL', 'COMPETITIVE_ADVANTAGE', 'MANAGEMENT_QUALITY',
        'KEY_RISKS', 'GROWTH_DRIVERS', 'REVENUE_BREAKDOWN', 'CORPORATE_HISTORY'
    )
);

ALTER TABLE company_profiles
ADD CONSTRAINT chk_confidence_level CHECK (
    confidence_level IN ('HIGH', 'MEDIUM', 'LOW')
);

-- ============================================
-- STOCK MILESTONES TABLE (Supporting table for events)
-- ============================================

CREATE TABLE IF NOT EXISTS stock_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL,
    milestone_date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    significance TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for stock_milestones
CREATE INDEX idx_stock_milestones_company_id ON stock_milestones(company_id);
CREATE INDEX idx_stock_milestones_date ON stock_milestones(milestone_date DESC);
CREATE INDEX idx_stock_milestones_type ON stock_milestones(milestone_type);
CREATE INDEX idx_stock_milestones_company_date ON stock_milestones(company_id, milestone_date DESC);

-- Add check constraints for stock_milestones
ALTER TABLE stock_milestones
ADD CONSTRAINT chk_milestone_type CHECK (
    milestone_type IN (
        'MAJOR_ACHIEVEMENT', 'SIGNIFICANT_SETBACK', 'STRATEGIC_SHIFT',
        'MARKET_MILESTONE', 'OPERATIONAL_MILESTONE'
    )
);

ALTER TABLE stock_milestones
ADD CONSTRAINT chk_significance CHECK (
    significance IN ('HIGH', 'MEDIUM', 'LOW')
);

-- ============================================
-- COMPANY TIMELINE SUMMARIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS company_timeline_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    summary_text TEXT NOT NULL,
    key_events JSONB DEFAULT '[]',
    metrics JSONB DEFAULT '{}',
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for company_timeline_summaries
CREATE INDEX idx_timeline_summaries_company ON company_timeline_summaries(company_id);
CREATE INDEX idx_timeline_summaries_period ON company_timeline_summaries(period_type);
CREATE INDEX idx_timeline_summaries_dates ON company_timeline_summaries(start_date DESC, end_date DESC);
CREATE INDEX idx_timeline_summaries_company_period ON company_timeline_summaries(company_id, period_type, start_date DESC);

-- Add check constraints
ALTER TABLE company_timeline_summaries
ADD CONSTRAINT chk_period_type CHECK (
    period_type IN (
        'LAST_7_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS', 'LAST_6_MONTHS',
        'LAST_1_YEAR', 'LAST_3_YEARS', 'LAST_5_YEARS', 'ALL_TIME'
    )
);

-- ============================================
-- UPDATE TRIGGERS FOR TIMESTAMPS
-- ============================================

-- Trigger for stock_events
CREATE OR REPLACE FUNCTION update_stock_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_events_updated_at
    BEFORE UPDATE ON stock_events
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_events_updated_at();

-- Trigger for company_timeline_summaries
CREATE OR REPLACE FUNCTION update_timeline_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timeline_summaries_updated_at
    BEFORE UPDATE ON company_timeline_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_timeline_summaries_updated_at();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON stock_events TO alphasignal;
GRANT SELECT, INSERT, UPDATE, DELETE ON company_profiles TO alphasignal;
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_milestones TO alphasignal;
GRANT SELECT, INSERT, UPDATE, DELETE ON company_timeline_summaries TO alphasignal;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE stock_events IS 'Auto-generated stock events from various data sources (Task #78)';
COMMENT ON TABLE company_profiles IS 'AI-generated company profile sections (Task #79)';
COMMENT ON TABLE stock_milestones IS 'Significant company milestones and achievements';
COMMENT ON TABLE company_timeline_summaries IS 'Period-based summaries of company events and performance';

COMMENT ON COLUMN stock_events.source_id IS 'ID of the source record (e.g., financial_result.id, news_article.id)';
COMMENT ON COLUMN stock_events.source_type IS 'Type of source (e.g., financial_result, news_article, risk_flag)';
COMMENT ON COLUMN company_profiles.version IS 'Version number, incremented on each update';
COMMENT ON COLUMN company_profiles.confidence_level IS 'AI confidence level based on data availability';
