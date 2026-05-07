-- CreateEnum
CREATE TYPE "LLMTaskType" AS ENUM ('SUMMARY', 'SENTIMENT', 'REPORT', 'OTHER');

-- CreateTable
CREATE TABLE "llm_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "model" TEXT NOT NULL,
    "prompt_tokens" INTEGER NOT NULL,
    "completion_tokens" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "estimated_cost_usd" DECIMAL(10,6) NOT NULL,
    "task_type" "LLMTaskType" NOT NULL,
    "company_id" UUID,
    "duration_ms" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "llm_usage_task_type_idx" ON "llm_usage"("task_type");

-- CreateIndex
CREATE INDEX "llm_usage_company_id_idx" ON "llm_usage"("company_id");

-- CreateIndex
CREATE INDEX "llm_usage_created_at_idx" ON "llm_usage"("created_at");
