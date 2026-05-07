-- CreateTable
CREATE TABLE IF NOT EXISTS "page_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "session_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_data" JSONB,
    "page_url" TEXT NOT NULL,
    "referrer" TEXT,
    "user_agent" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "page_analytics_user_id_idx" ON "page_analytics"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "page_analytics_session_id_idx" ON "page_analytics"("session_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "page_analytics_event_name_idx" ON "page_analytics"("event_name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "page_analytics_created_at_idx" ON "page_analytics"("created_at");
