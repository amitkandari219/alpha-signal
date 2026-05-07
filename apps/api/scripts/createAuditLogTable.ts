/**
 * Create Audit Log Table - SEBI Compliance
 *
 * Comprehensive audit trail for regulatory compliance
 * Logs all critical operations: AI generations, score computations, payments, tier changes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAuditLogTable() {
  console.log('🔧 Creating audit_log table for SEBI compliance...');

  try {
    // Create action type enum
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "AuditActionType" AS ENUM (
          'AI_GENERATION',
          'SCORE_COMPUTATION',
          'USER_REGISTRATION',
          'USER_LOGIN',
          'TIER_CHANGE',
          'PAYMENT_INITIATED',
          'PAYMENT_SUCCESS',
          'PAYMENT_FAILED',
          'CONTENT_FLAGGED',
          'USER_FEEDBACK',
          'WATCHLIST_ADD',
          'WATCHLIST_REMOVE',
          'PORTFOLIO_ADD',
          'PORTFOLIO_REMOVE',
          'DATA_EXPORT',
          'SYSTEM_ERROR'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ AuditActionType enum created');

    // Create resource type enum
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "AuditResourceType" AS ENUM (
          'AI_SUMMARY',
          'SCORE',
          'USER',
          'SUBSCRIPTION',
          'PAYMENT',
          'CONTENT',
          'WATCHLIST',
          'PORTFOLIO',
          'SYSTEM'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ AuditResourceType enum created');

    // Create audit_log table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        action "AuditActionType" NOT NULL,
        resource_type "AuditResourceType" NOT NULL,
        resource_id UUID,
        metadata JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- Foreign key to users table (if exists)
        CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    console.log('✅ audit_log table created');

    // Create indexes for performance
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON audit_log(resource_type);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_resource_id ON audit_log(resource_id);
    `);
    console.log('✅ Indexes created');

    // Create a view for recent audit logs (last 30 days)
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE VIEW recent_audit_logs AS
      SELECT
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        metadata,
        ip_address,
        success,
        error_message,
        created_at
      FROM audit_log
      WHERE created_at > NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC;
    `);
    console.log('✅ recent_audit_logs view created');

    console.log('\n✨ Audit log system created successfully!');
    console.log('\nThis system will log:');
    console.log('  - AI content generation events');
    console.log('  - Score computation events');
    console.log('  - User authentication events');
    console.log('  - Subscription tier changes');
    console.log('  - Payment transactions');
    console.log('  - Content moderation flags');
    console.log('  - User feedback submissions');
    console.log('  - Portfolio & watchlist modifications');
    console.log('  - Data export requests');
    console.log('  - System errors');
    console.log('\n📋 Query recent logs: SELECT * FROM recent_audit_logs;');
  } catch (error) {
    console.error('❌ Error creating audit_log table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAuditLogTable();
