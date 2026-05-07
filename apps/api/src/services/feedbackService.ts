/**
 * User Feedback Service
 *
 * Handles thumbs up/down feedback on AI-generated content
 * Integrates with audit logger for compliance tracking
 */

import { PrismaClient } from '@prisma/client';
import { logUserFeedback } from './auditLogger';

const prisma = new PrismaClient();

/**
 * Feedback types
 */
export enum FeedbackType {
  AI_SUMMARY = 'AI_SUMMARY',
  NEWS_SENTIMENT = 'NEWS_SENTIMENT',
  MARKET_BRIEF = 'MARKET_BRIEF',
  PORTFOLIO_INSIGHTS = 'PORTFOLIO_INSIGHTS',
  SCORE_QUALITY = 'SCORE_QUALITY',
  SCORE_GROWTH = 'SCORE_GROWTH',
  SCORE_MOMENTUM = 'SCORE_MOMENTUM',
  SCORE_RISK = 'SCORE_RISK',
  SCORE_SENTIMENT = 'SCORE_SENTIMENT',
}

/**
 * Feedback rating
 */
export enum FeedbackRating {
  UP = 'UP',
  DOWN = 'DOWN',
}

/**
 * Feedback entry interface
 */
export interface FeedbackEntry {
  userId: string;
  feedbackType: FeedbackType;
  resourceId: string;
  companyId?: string;
  rating: FeedbackRating;
  comment?: string;
  metadata?: Record<string, any>;
}

/**
 * Submit or update feedback
 *
 * If feedback exists for this user+resource, it will be updated
 * Otherwise, a new feedback entry is created
 *
 * @param entry - Feedback entry
 * @returns Promise<void>
 */
export async function submitFeedback(entry: FeedbackEntry): Promise<void> {
  try {
    // Check if feedback already exists
    const existing = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT id FROM user_feedback
      WHERE user_id = $1 AND resource_id = $2
      `,
      entry.userId,
      entry.resourceId
    );

    if (existing.length > 0) {
      // Update existing feedback
      await prisma.$executeRawUnsafe(
        `
        UPDATE user_feedback
        SET rating = $1, comment = $2, metadata = $3, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $4 AND resource_id = $5
        `,
        entry.rating,
        entry.comment || null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.userId,
        entry.resourceId
      );
    } else {
      // Insert new feedback
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO user_feedback (user_id, feedback_type, resource_id, company_id, rating, comment, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        entry.userId,
        entry.feedbackType,
        entry.resourceId,
        entry.companyId || null,
        entry.rating,
        entry.comment || null,
        entry.metadata ? JSON.stringify(entry.metadata) : null
      );
    }

    // Log to audit trail
    await logUserFeedback(entry.userId, entry.resourceId, {
      resourceType: entry.feedbackType,
      rating: entry.rating,
      comment: entry.comment,
    });
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    throw error;
  }
}

/**
 * Get feedback for a resource
 *
 * @param resourceId - Resource ID
 * @returns Promise<any[]>
 */
export async function getResourceFeedback(resourceId: string): Promise<any[]> {
  const result = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT
      id,
      user_id,
      feedback_type,
      rating,
      comment,
      metadata,
      created_at,
      updated_at
    FROM user_feedback
    WHERE resource_id = $1
    ORDER BY created_at DESC
    `,
    resourceId
  );

  return result;
}

/**
 * Get user's feedback
 *
 * @param userId - User ID
 * @param options - Query options
 * @returns Promise<any[]>
 */
export async function getUserFeedback(
  userId: string,
  options?: {
    feedbackType?: FeedbackType;
    limit?: number;
    offset?: number;
  }
): Promise<any[]> {
  const conditions = [`user_id = '${userId}'`];

  if (options?.feedbackType) {
    conditions.push(`feedback_type = '${options.feedbackType}'`);
  }

  const whereClause = conditions.join(' AND ');
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      id,
      feedback_type,
      resource_id,
      company_id,
      rating,
      comment,
      metadata,
      created_at,
      updated_at
    FROM user_feedback
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return result;
}

/**
 * Check if user has given feedback for a resource
 *
 * @param userId - User ID
 * @param resourceId - Resource ID
 * @returns Promise<{ exists: boolean; rating?: FeedbackRating }>
 */
export async function checkUserFeedback(
  userId: string,
  resourceId: string
): Promise<{ exists: boolean; rating?: FeedbackRating }> {
  const result = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT rating FROM user_feedback
    WHERE user_id = $1 AND resource_id = $2
    `,
    userId,
    resourceId
  );

  if (result.length > 0) {
    return {
      exists: true,
      rating: result[0].rating,
    };
  }

  return { exists: false };
}

/**
 * Get feedback statistics
 *
 * @returns Promise<any[]>
 */
export async function getFeedbackStats(): Promise<any[]> {
  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT * FROM feedback_stats
  `);

  return result;
}

/**
 * Get feedback statistics for a specific type
 *
 * @param feedbackType - Feedback type
 * @param days - Number of days to look back (default: 30)
 * @returns Promise<any>
 */
export async function getFeedbackStatsByType(
  feedbackType: FeedbackType,
  days: number = 30
): Promise<any> {
  const result = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT
      COUNT(*) as total_feedback,
      COUNT(CASE WHEN rating = 'UP' THEN 1 END) as thumbs_up,
      COUNT(CASE WHEN rating = 'DOWN' THEN 1 END) as thumbs_down,
      ROUND(
        100.0 * COUNT(CASE WHEN rating = 'UP' THEN 1 END) / NULLIF(COUNT(*), 0),
        2
      ) as satisfaction_percentage,
      COUNT(CASE WHEN comment IS NOT NULL AND comment != '' THEN 1 END) as comments_count
    FROM user_feedback
    WHERE feedback_type = $1
    AND created_at > NOW() - INTERVAL '${days} days'
    `,
    feedbackType
  );

  return result[0] || {
    total_feedback: 0,
    thumbs_up: 0,
    thumbs_down: 0,
    satisfaction_percentage: 0,
    comments_count: 0,
  };
}

/**
 * Get recent negative feedback for quality monitoring
 *
 * @param feedbackType - Optional filter by type
 * @param limit - Number of results (default: 20)
 * @returns Promise<any[]>
 */
export async function getRecentNegativeFeedback(
  feedbackType?: FeedbackType,
  limit: number = 20
): Promise<any[]> {
  const typeFilter = feedbackType ? `AND feedback_type = '${feedbackType}'` : '';

  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      id,
      user_id,
      feedback_type,
      resource_id,
      company_id,
      comment,
      metadata,
      created_at
    FROM user_feedback
    WHERE rating = 'DOWN'
    ${typeFilter}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);

  return result;
}

/**
 * Delete feedback (for user data deletion requests)
 *
 * @param userId - User ID
 * @returns Promise<number> - Number of deleted records
 */
export async function deleteUserFeedback(userId: string): Promise<number> {
  const result = await prisma.$executeRawUnsafe(
    `
    DELETE FROM user_feedback
    WHERE user_id = $1
    `,
    userId
  );

  return result as number;
}

export default {
  submitFeedback,
  getResourceFeedback,
  getUserFeedback,
  checkUserFeedback,
  getFeedbackStats,
  getFeedbackStatsByType,
  getRecentNegativeFeedback,
  deleteUserFeedback,
};
