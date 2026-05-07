/**
 * Create Content Flags Table - SEBI Compliance
 *
 * Logs all AI-generated content that violates SEBI regulations
 * Critical for audit trail and regulatory compliance
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createContentFlagsTable() {
  console.log('🔧 Creating content_flags table for SEBI compliance...');

  try {
    // Create severity enum
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "ContentFlagSeverity" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ ContentFlagSeverity enum created');

    // Create content_flags table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS content_flags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        summary_id UUID,
        company_id UUID,
        flagged_terms JSONB NOT NULL,
        severity "ContentFlagSeverity" NOT NULL,
        original_content TEXT,
        action_taken VARCHAR(50) NOT NULL,
        reviewed BOOLEAN DEFAULT false,
        reviewed_by VARCHAR(255),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ content_flags table created');

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_content_flags_severity ON content_flags(severity);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_content_flags_created_at ON content_flags(created_at);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_content_flags_reviewed ON content_flags(reviewed);
    `);
    console.log('✅ Indexes created');

    console.log('\n✨ Content flags table created successfully!');
    console.log('\nThis table will log:');
    console.log('  - AI content containing prohibited terms');
    console.log('  - Severity levels (HIGH/MEDIUM/LOW)');
    console.log('  - Flagged terms for each violation');
    console.log('  - Action taken (BLOCKED/REGENERATED)');
    console.log('  - Review status for compliance audits');
  } catch (error) {
    console.error('❌ Error creating content_flags table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createContentFlagsTable();
