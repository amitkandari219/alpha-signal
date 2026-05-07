/**
 * Audit Logger Service - SEBI Compliance
 *
 * Centralized service for logging all critical operations
 * Required for regulatory audits and compliance investigations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Audit action types
 */
export enum AuditAction {
  AI_GENERATION = 'AI_GENERATION',
  SCORE_COMPUTATION = 'SCORE_COMPUTATION',
  USER_REGISTRATION = 'USER_REGISTRATION',
  USER_LOGIN = 'USER_LOGIN',
  TIER_CHANGE = 'TIER_CHANGE',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CONTENT_FLAGGED = 'CONTENT_FLAGGED',
  USER_FEEDBACK = 'USER_FEEDBACK',
  WATCHLIST_ADD = 'WATCHLIST_ADD',
  WATCHLIST_REMOVE = 'WATCHLIST_REMOVE',
  PORTFOLIO_ADD = 'PORTFOLIO_ADD',
  PORTFOLIO_REMOVE = 'PORTFOLIO_REMOVE',
  DATA_EXPORT = 'DATA_EXPORT',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

/**
 * Resource types
 */
export enum ResourceType {
  AI_SUMMARY = 'AI_SUMMARY',
  SCORE = 'SCORE',
  USER = 'USER',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PAYMENT = 'PAYMENT',
  CONTENT = 'CONTENT',
  WATCHLIST = 'WATCHLIST',
  PORTFOLIO = 'PORTFOLIO',
  SYSTEM = 'SYSTEM',
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Log an audit entry
 *
 * @param entry - Audit log entry details
 * @returns Promise<void>
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO audit_log (user_id, action, resource_type, resource_id, metadata, ip_address, user_agent, success, error_message)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      entry.userId || null,
      entry.action,
      entry.resourceType,
      entry.resourceId || null,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
      entry.ipAddress || null,
      entry.userAgent || null,
      entry.success !== undefined ? entry.success : true,
      entry.errorMessage || null
    );
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    // But log the error for monitoring
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Log AI content generation
 */
export async function logAIGeneration(
  userId: string,
  summaryId: string,
  metadata: { symbol: string; type: string; modelVersion: string; tokensUsed?: number }
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.AI_GENERATION,
    resourceType: ResourceType.AI_SUMMARY,
    resourceId: summaryId,
    metadata,
    success: true,
  });
}

/**
 * Log score computation
 */
export async function logScoreComputation(
  userId: string | undefined,
  scoreId: string,
  metadata: { symbol: string; scoreType: string; value: number; factors?: Record<string, number> }
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.SCORE_COMPUTATION,
    resourceType: ResourceType.SCORE,
    resourceId: scoreId,
    metadata,
    success: true,
  });
}

/**
 * Log user registration
 */
export async function logUserRegistration(
  userId: string,
  ipAddress: string,
  userAgent: string,
  metadata: { email: string; tier: string }
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.USER_REGISTRATION,
    resourceType: ResourceType.USER,
    resourceId: userId,
    metadata,
    ipAddress,
    userAgent,
    success: true,
  });
}

/**
 * Log user login
 */
export async function logUserLogin(
  userId: string,
  ipAddress: string,
  userAgent: string,
  success: boolean
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.USER_LOGIN,
    resourceType: ResourceType.USER,
    resourceId: userId,
    ipAddress,
    userAgent,
    success,
  });
}

/**
 * Log tier change
 */
export async function logTierChange(
  userId: string,
  subscriptionId: string,
  metadata: { oldTier: string; newTier: string; reason: string }
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.TIER_CHANGE,
    resourceType: ResourceType.SUBSCRIPTION,
    resourceId: subscriptionId,
    metadata,
    success: true,
  });
}

/**
 * Log payment event
 */
export async function logPayment(
  userId: string,
  paymentId: string,
  action: AuditAction.PAYMENT_INITIATED | AuditAction.PAYMENT_SUCCESS | AuditAction.PAYMENT_FAILED,
  metadata: {
    amount: number;
    currency: string;
    plan: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    errorCode?: string;
  }
): Promise<void> {
  await logAudit({
    userId,
    action,
    resourceType: ResourceType.PAYMENT,
    resourceId: paymentId,
    metadata,
    success: action === AuditAction.PAYMENT_SUCCESS,
  });
}

/**
 * Log content flagged by filter
 */
export async function logContentFlagged(
  userId: string | undefined,
  contentId: string,
  metadata: { flaggedTerms: string[]; severity: string; actionTaken: string }
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.CONTENT_FLAGGED,
    resourceType: ResourceType.CONTENT,
    resourceId: contentId,
    metadata,
    success: true,
  });
}

/**
 * Log user feedback
 */
export async function logUserFeedback(
  userId: string,
  resourceId: string,
  metadata: { resourceType: string; rating: string; comment?: string }
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.USER_FEEDBACK,
    resourceType: ResourceType.CONTENT,
    resourceId,
    metadata,
    success: true,
  });
}

/**
 * Log portfolio/watchlist modification
 */
export async function logPortfolioChange(
  userId: string,
  action: AuditAction.PORTFOLIO_ADD | AuditAction.PORTFOLIO_REMOVE | AuditAction.WATCHLIST_ADD | AuditAction.WATCHLIST_REMOVE,
  resourceId: string,
  metadata: { symbol: string; quantity?: number; avgPrice?: number }
): Promise<void> {
  const resourceType = action.startsWith('PORTFOLIO') ? ResourceType.PORTFOLIO : ResourceType.WATCHLIST;

  await logAudit({
    userId,
    action,
    resourceType,
    resourceId,
    metadata,
    success: true,
  });
}

/**
 * Log data export request
 */
export async function logDataExport(
  userId: string,
  metadata: { exportType: string; format: string; recordCount: number }
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.DATA_EXPORT,
    resourceType: ResourceType.USER,
    resourceId: userId,
    metadata,
    success: true,
  });
}

/**
 * Log system error
 */
export async function logSystemError(
  errorMessage: string,
  metadata: { code: string; stack?: string; endpoint?: string }
): Promise<void> {
  await logAudit({
    action: AuditAction.SYSTEM_ERROR,
    resourceType: ResourceType.SYSTEM,
    errorMessage,
    metadata,
    success: false,
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    action?: AuditAction;
    resourceType?: ResourceType;
    limit?: number;
    offset?: number;
  }
): Promise<any[]> {
  const conditions = [`user_id = '${userId}'`];

  if (options?.action) {
    conditions.push(`action = '${options.action}'`);
  }

  if (options?.resourceType) {
    conditions.push(`resource_type = '${options.resourceType}'`);
  }

  const whereClause = conditions.join(' AND ');
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  const result = await prisma.$queryRawUnsafe(`
    SELECT * FROM audit_log
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return result as any[];
}

/**
 * Get audit statistics
 */
export async function getAuditStats(days: number = 30): Promise<any> {
  const result = await prisma.$queryRawUnsafe(`
    SELECT
      action,
      resource_type,
      COUNT(*) as count,
      COUNT(CASE WHEN success = false THEN 1 END) as failures
    FROM audit_log
    WHERE created_at > NOW() - INTERVAL '${days} days'
    GROUP BY action, resource_type
    ORDER BY count DESC
  `);

  return result;
}

export default {
  logAudit,
  logAIGeneration,
  logScoreComputation,
  logUserRegistration,
  logUserLogin,
  logTierChange,
  logPayment,
  logContentFlagged,
  logUserFeedback,
  logPortfolioChange,
  logDataExport,
  logSystemError,
  getUserAuditLogs,
  getAuditStats,
};
