-- CreateTable: ai_summaries
-- Stores AI-generated summaries for companies

CREATE TABLE IF NOT EXISTS "ai_summaries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "summary_type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "model_version" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "confidence_level" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "data_freshness_note" TEXT,
    "token_usage" JSONB,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_summaries_company_id_summary_type_idx" ON "ai_summaries"("company_id", "summary_type");

-- CreateIndex
CREATE INDEX "ai_summaries_generated_at_idx" ON "ai_summaries"("generated_at" DESC);

-- AddForeignKey
ALTER TABLE "ai_summaries" ADD CONSTRAINT "ai_summaries_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Comment
COMMENT ON TABLE "ai_summaries" IS 'AI-generated summaries using Claude API with 6 summary types: business_overview, earnings_summary, bull_case, bear_case, news_digest, risk_assessment';
