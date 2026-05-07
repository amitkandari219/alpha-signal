-- AlterTable error_log to match new structure
ALTER TABLE "error_log" DROP COLUMN IF EXISTS "endpoint";
ALTER TABLE "error_log" DROP COLUMN IF EXISTS "method";
ALTER TABLE "error_log" DROP COLUMN IF EXISTS "status_code";
ALTER TABLE "error_log" DROP COLUMN IF EXISTS "error_message";
ALTER TABLE "error_log" DROP COLUMN IF EXISTS "request_body";
ALTER TABLE "error_log" DROP COLUMN IF EXISTS "user_agent";
ALTER TABLE "error_log" DROP COLUMN IF EXISTS "ip_address";

-- Add new columns
ALTER TABLE "error_log" ADD COLUMN IF NOT EXISTS "message" TEXT NOT NULL DEFAULT 'Unknown error';
ALTER TABLE "error_log" ADD COLUMN IF NOT EXISTS "request_id" TEXT;
ALTER TABLE "error_log" ADD COLUMN IF NOT EXISTS "route" TEXT;
ALTER TABLE "error_log" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Update error_type to be NOT NULL if it isn't already
ALTER TABLE "error_log" ALTER COLUMN "error_type" SET NOT NULL;

-- Remove default from message after backfill
ALTER TABLE "error_log" ALTER COLUMN "message" DROP DEFAULT;

-- Drop old indexes
DROP INDEX IF EXISTS "error_log_endpoint_idx";
DROP INDEX IF EXISTS "error_log_status_code_idx";

-- Create new indexes
CREATE INDEX IF NOT EXISTS "error_log_error_type_idx" ON "error_log"("error_type");
CREATE INDEX IF NOT EXISTS "error_log_user_id_idx" ON "error_log"("user_id");
CREATE INDEX IF NOT EXISTS "error_log_created_at_idx" ON "error_log"("created_at");
