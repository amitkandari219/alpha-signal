/**
 * Create User Feedback Table
 *
 * Stores thumbs up/down feedback on AI-generated content
 * Helps improve AI quality and track user satisfaction
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createUserFeedbackTable() {
  console.log('🔧 Creating user_feedback table...');

  try {
    // Create feedback rating enum
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "FeedbackRating" AS ENUM ('UP', 'DOWN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ FeedbackRating enum created');

    // Create feedback type enum
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "FeedbackType" AS ENUM (
          'AI_SUMMARY',
          'NEWS_SENTIMENT',
          'MARKET_BRIEF',
          'PORTFOLIO_INSIGHTS',
          'SCORE_QUALITY',
          'SCORE_GROWTH',
          'SCORE_MOMENTUM',
          'SCORE_RISK',
          'SCORE_SENTIMENT'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ FeedbackType enum created');

    // Create user_feedback table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        feedback_type "FeedbackType" NOT NULL,
        resource_id UUID NOT NULL,
        company_id UUID,
        rating "FeedbackRating" NOT NULL,
        comment TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- Foreign keys
        CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

        -- Unique constraint: one feedback per user per resource
        CONSTRAINT unique_user_resource_feedback UNIQUE (user_id, resource_id)
      );
    `);
    console.log('✅ user_feedback table created');

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(feedback_type);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_user_feedback_resource_id ON user_feedback(resource_id);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_user_feedback_rating ON user_feedback(rating);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at);
    `);
    console.log('✅ Indexes created');

    // Create a view for feedback statistics
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE VIEW feedback_stats AS
      SELECT
        feedback_type,
        COUNT(*) as total_feedback,
        COUNT(CASE WHEN rating = 'UP' THEN 1 END) as thumbs_up,
        COUNT(CASE WHEN rating = 'DOWN' THEN 1 END) as thumbs_down,
        ROUND(
          100.0 * COUNT(CASE WHEN rating = 'UP' THEN 1 END) / COUNT(*),
          2
        ) as satisfaction_percentage
      FROM user_feedback
      GROUP BY feedback_type
      ORDER BY total_feedback DESC;
    `);
    console.log('✅ feedback_stats view created');

    // Create trigger to update updated_at
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_user_feedback_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS trigger_update_user_feedback_updated_at ON user_feedback;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER trigger_update_user_feedback_updated_at
      BEFORE UPDATE ON user_feedback
      FOR EACH ROW
      EXECUTE FUNCTION update_user_feedback_updated_at();
    `);
    console.log('✅ Updated_at trigger created');

    console.log('\n✨ User feedback system created successfully!');
    console.log('\nThis system allows:');
    console.log('  - Thumbs up/down on AI-generated content');
    console.log('  - Optional text comments');
    console.log('  - Feedback per content type (summaries, scores, insights)');
    console.log('  - One feedback per user per resource (can be updated)');
    console.log('  - Real-time satisfaction statistics');
    console.log('\n📊 View satisfaction stats: SELECT * FROM feedback_stats;');
  } catch (error) {
    console.error('❌ Error creating user_feedback table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createUserFeedbackTable();
