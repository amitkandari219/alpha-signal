/**
 * Data Source Tracker Service
 *
 * Tracks WHERE each piece of data comes from for transparency and debugging.
 * Every data point should have source attribution.
 *
 * Sources ranked by confidence:
 * - NSE/BSE API: 100% (official exchange data)
 * - Company filings: 95% (official, but may have delays)
 * - Database: 90% (our verified data)
 * - Third-party APIs: 85% (Screener, Moneycontrol, etc.)
 * - AI-generated: 60% (insights, not raw data)
 * - Estimated: 40% (calculations, projections)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DataSource {
  field: string;
  value: any;
  sources: Array<{
    name: string; // "database", "NSE_API", "BSE_API", "company_filings", etc.
    fetchedAt: string;
    confidence: number; // 0-1
    url?: string; // Link to source if available
    metadata?: Record<string, any>;
  }>;
  primarySource: string;
  lastVerified: string;
  overallConfidence: number;
}

// ═══════════════════════════════════════════════════════════════
// SOURCE CONFIDENCE MAPPING
// ═══════════════════════════════════════════════════════════════

export enum DataSourceName {
  NSE_API = 'NSE_API',
  BSE_API = 'BSE_API',
  COMPANY_FILINGS = 'company_filings',
  DATABASE = 'database',
  SCREENER_API = 'screener_api',
  MONEYCONTROL = 'moneycontrol',
  YAHOO_FINANCE = 'yahoo_finance',
  AI_GENERATED = 'ai_generated',
  ESTIMATED = 'estimated',
  MANUAL_ENTRY = 'manual_entry',
  CALCULATED = 'calculated',
}

const SOURCE_CONFIDENCE_MAP: Record<DataSourceName, number> = {
  [DataSourceName.NSE_API]: 1.0, // Official exchange data = 100%
  [DataSourceName.BSE_API]: 1.0,
  [DataSourceName.COMPANY_FILINGS]: 0.95, // Official filings = 95%
  [DataSourceName.DATABASE]: 0.9, // Our verified database = 90%
  [DataSourceName.SCREENER_API]: 0.85, // Third-party verified = 85%
  [DataSourceName.MONEYCONTROL]: 0.8,
  [DataSourceName.YAHOO_FINANCE]: 0.8,
  [DataSourceName.AI_GENERATED]: 0.6, // AI insights = 60%
  [DataSourceName.CALCULATED]: 0.7, // Calculated from other data = 70%
  [DataSourceName.ESTIMATED]: 0.4, // Estimates/projections = 40%
  [DataSourceName.MANUAL_ENTRY]: 0.5, // Manual entry = 50%
};

export function calculateConfidence(sourceName: string): number {
  return SOURCE_CONFIDENCE_MAP[sourceName as DataSourceName] || 0.5;
}

// ═══════════════════════════════════════════════════════════════
// TRACK DATA SOURCE
// ═══════════════════════════════════════════════════════════════

export interface TrackDataSourceParams {
  symbol: string;
  field: string;
  value: any;
  source: DataSourceName | string;
  metadata?: Record<string, any>;
  url?: string;
}

/**
 * Log data source for a specific field
 * Creates audit trail for debugging and transparency
 */
export async function trackDataSource(params: TrackDataSourceParams): Promise<void> {
  const { symbol, field, value, source, metadata, url } = params;

  try {
    await prisma.dataSourceLog.create({
      data: {
        symbol,
        field,
        value: JSON.stringify(value),
        source,
        confidence: calculateConfidence(source),
        url: url || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        fetchedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`Failed to track data source for ${symbol}.${field}:`, error);
    // Don't throw - tracking is non-critical
  }
}

/**
 * Track multiple data sources at once (bulk operation)
 */
export async function trackDataSourcesBulk(
  symbol: string,
  sources: Array<{
    field: string;
    value: any;
    source: DataSourceName | string;
    metadata?: Record<string, any>;
    url?: string;
  }>
): Promise<void> {
  try {
    await prisma.dataSourceLog.createMany({
      data: sources.map((s) => ({
        symbol,
        field: s.field,
        value: JSON.stringify(s.value),
        source: s.source,
        confidence: calculateConfidence(s.source),
        url: s.url || null,
        metadata: s.metadata ? JSON.stringify(s.metadata) : null,
        fetchedAt: new Date(),
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    console.error(`Failed to track bulk data sources for ${symbol}:`, error);
  }
}

// ═══════════════════════════════════════════════════════════════
// RETRIEVE DATA SOURCES
// ═══════════════════════════════════════════════════════════════

/**
 * Get all sources for a specific data field
 * Used to show users where data came from
 */
export async function getDataSources(
  symbol: string,
  field: string,
  limit: number = 10
): Promise<DataSource | null> {
  try {
    const logs = await prisma.dataSourceLog.findMany({
      where: { symbol, field },
      orderBy: { fetchedAt: 'desc' },
      take: limit,
    });

    if (logs.length === 0) {
      return null;
    }

    // Parse sources
    const sources = logs.map((log) => ({
      name: log.source,
      fetchedAt: log.fetchedAt.toISOString(),
      confidence: log.confidence,
      url: log.url || undefined,
      metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
    }));

    // Determine primary source (highest confidence + most recent)
    const primarySource = sources[0].name;

    // Calculate overall confidence (weighted average with recency)
    const weights = sources.map((_, index) => Math.pow(0.8, index)); // Exponential decay
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const overallConfidence =
      sources.reduce((sum, source, index) => sum + source.confidence * weights[index], 0) /
      totalWeight;

    return {
      field,
      value: logs[0].value ? JSON.parse(logs[0].value) : null,
      sources,
      primarySource,
      lastVerified: logs[0].fetchedAt.toISOString(),
      overallConfidence,
    };
  } catch (error) {
    console.error(`Failed to get data sources for ${symbol}.${field}:`, error);
    return null;
  }
}

/**
 * Get all data sources for a symbol (for audit trail)
 */
export async function getAllDataSources(
  symbol: string,
  fieldsFilter?: string[]
): Promise<Map<string, DataSource>> {
  try {
    const where = fieldsFilter
      ? { symbol, field: { in: fieldsFilter } }
      : { symbol };

    const logs = await prisma.dataSourceLog.findMany({
      where,
      orderBy: { fetchedAt: 'desc' },
    });

    // Group by field
    const fieldMap = new Map<string, typeof logs>();
    for (const log of logs) {
      if (!fieldMap.has(log.field)) {
        fieldMap.set(log.field, []);
      }
      fieldMap.get(log.field)!.push(log);
    }

    // Convert to DataSource format
    const result = new Map<string, DataSource>();
    for (const [field, logs] of fieldMap.entries()) {
      const sources = logs.map((log) => ({
        name: log.source,
        fetchedAt: log.fetchedAt.toISOString(),
        confidence: log.confidence,
        url: log.url || undefined,
        metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
      }));

      const primarySource = sources[0].name;
      const weights = sources.map((_, index) => Math.pow(0.8, index));
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const overallConfidence =
        sources.reduce((sum, source, index) => sum + source.confidence * weights[index], 0) /
        totalWeight;

      result.set(field, {
        field,
        value: logs[0].value ? JSON.parse(logs[0].value) : null,
        sources,
        primarySource,
        lastVerified: logs[0].fetchedAt.toISOString(),
        overallConfidence,
      });
    }

    return result;
  } catch (error) {
    console.error(`Failed to get all data sources for ${symbol}:`, error);
    return new Map();
  }
}

// ═══════════════════════════════════════════════════════════════
// DATA FRESHNESS
// ═══════════════════════════════════════════════════════════════

export interface FreshnessInfo {
  field: string;
  lastUpdated: string;
  ageInHours: number;
  isStale: boolean;
  staleness: 'fresh' | 'recent' | 'stale' | 'very_stale';
}

/**
 * Check how fresh a data point is
 * Returns staleness level for UI display
 */
export async function checkDataFreshness(
  symbol: string,
  field: string,
  staleThresholdHours: number = 24
): Promise<FreshnessInfo | null> {
  try {
    const latestLog = await prisma.dataSourceLog.findFirst({
      where: { symbol, field },
      orderBy: { fetchedAt: 'desc' },
    });

    if (!latestLog) {
      return null;
    }

    const now = new Date();
    const ageInMs = now.getTime() - latestLog.fetchedAt.getTime();
    const ageInHours = ageInMs / (1000 * 60 * 60);

    let staleness: 'fresh' | 'recent' | 'stale' | 'very_stale';
    if (ageInHours < 1) {
      staleness = 'fresh';
    } else if (ageInHours < staleThresholdHours) {
      staleness = 'recent';
    } else if (ageInHours < staleThresholdHours * 3) {
      staleness = 'stale';
    } else {
      staleness = 'very_stale';
    }

    return {
      field,
      lastUpdated: latestLog.fetchedAt.toISOString(),
      ageInHours,
      isStale: ageInHours > staleThresholdHours,
      staleness,
    };
  } catch (error) {
    console.error(`Failed to check data freshness for ${symbol}.${field}:`, error);
    return null;
  }
}

/**
 * Check freshness for multiple fields at once
 */
export async function checkDataFreshnessBulk(
  symbol: string,
  fields: string[],
  staleThresholdHours: number = 24
): Promise<Map<string, FreshnessInfo>> {
  const result = new Map<string, FreshnessInfo>();

  for (const field of fields) {
    const freshness = await checkDataFreshness(symbol, field, staleThresholdHours);
    if (freshness) {
      result.set(field, freshness);
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP OLD LOGS
// ═══════════════════════════════════════════════════════════════

/**
 * Clean up old data source logs (keep only last N days)
 * Run this periodically to prevent database bloat
 */
export async function cleanupOldDataSourceLogs(retentionDays: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.dataSourceLog.deleteMany({
      where: {
        fetchedAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Cleaned up ${result.count} old data source logs (older than ${retentionDays} days)`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup old data source logs:', error);
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get human-readable source name for display
 */
export function getSourceDisplayName(source: string): string {
  const displayNames: Record<string, string> = {
    [DataSourceName.NSE_API]: 'NSE (Official)',
    [DataSourceName.BSE_API]: 'BSE (Official)',
    [DataSourceName.COMPANY_FILINGS]: 'Company Filings',
    [DataSourceName.DATABASE]: 'Alpha Signal Database',
    [DataSourceName.SCREENER_API]: 'Screener.in',
    [DataSourceName.MONEYCONTROL]: 'Moneycontrol',
    [DataSourceName.YAHOO_FINANCE]: 'Yahoo Finance',
    [DataSourceName.AI_GENERATED]: 'AI-Generated Insight',
    [DataSourceName.CALCULATED]: 'Calculated',
    [DataSourceName.ESTIMATED]: 'Estimated',
    [DataSourceName.MANUAL_ENTRY]: 'Manual Entry',
  };

  return displayNames[source] || source;
}

/**
 * Get confidence badge info for UI
 */
export function getConfidenceBadge(confidence: number): {
  label: string;
  color: 'green' | 'yellow' | 'red';
  icon: string;
} {
  if (confidence >= 0.95) {
    return { label: 'Verified', color: 'green', icon: '✅' };
  } else if (confidence >= 0.8) {
    return { label: 'High Confidence', color: 'green', icon: '✓' };
  } else if (confidence >= 0.6) {
    return { label: 'Medium Confidence', color: 'yellow', icon: '⚠' };
  } else {
    return { label: 'Estimated', color: 'red', icon: '⚠' };
  }
}

/**
 * Format age for display
 */
export function formatDataAge(ageInHours: number): string {
  if (ageInHours < 1) {
    return `${Math.round(ageInHours * 60)} minutes ago`;
  } else if (ageInHours < 24) {
    return `${Math.round(ageInHours)} hours ago`;
  } else {
    const days = Math.round(ageInHours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

// ═══════════════════════════════════════════════════════════════
// AUDIT TRAIL SUMMARY
// ═══════════════════════════════════════════════════════════════

export interface AuditTrailSummary {
  symbol: string;
  totalFields: number;
  fieldsWithSources: number;
  avgConfidence: number;
  staleDataFields: string[];
  missingSourceFields: string[];
  lastAuditDate: string;
}

/**
 * Generate audit trail summary for a symbol
 * Useful for admin panel and debugging
 */
export async function generateAuditTrailSummary(
  symbol: string,
  requiredFields: string[]
): Promise<AuditTrailSummary> {
  const allSources = await getAllDataSources(symbol);

  const fieldsWithSources = allSources.size;
  const missingSourceFields = requiredFields.filter((field) => !allSources.has(field));

  // Calculate average confidence
  let totalConfidence = 0;
  for (const [_, source] of allSources) {
    totalConfidence += source.overallConfidence;
  }
  const avgConfidence = fieldsWithSources > 0 ? totalConfidence / fieldsWithSources : 0;

  // Check stale data
  const staleDataFields: string[] = [];
  for (const [field, source] of allSources) {
    const freshness = await checkDataFreshness(symbol, field);
    if (freshness && freshness.isStale) {
      staleDataFields.push(field);
    }
  }

  return {
    symbol,
    totalFields: requiredFields.length,
    fieldsWithSources,
    avgConfidence,
    staleDataFields,
    missingSourceFields,
    lastAuditDate: new Date().toISOString(),
  };
}
