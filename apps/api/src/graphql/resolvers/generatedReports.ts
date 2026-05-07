/**
 * GraphQL Resolvers for Generated Stock Reports
 *
 * Provides queries and mutations for:
 * - Generating comprehensive stock reports
 * - Getting existing reports
 * - Tracking report views and downloads
 */

import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { aggregateReportData } from '../../services/reportDataAggregator';
import { getCacheService, CACHE_TTL } from '../../services/cache';

const prisma = new PrismaClient();
const cache = getCacheService();

// ============================================
// TYPE DEFINITIONS
// ============================================

export const generatedReportsTypeDefs = `#graphql
  enum GeneratedReportType {
    COMPREHENSIVE
    QUICK_ANALYSIS
    SECTOR_COMPARISON
    RISK_ASSESSMENT
  }

  enum ReportGenerationStatus {
    PENDING
    GENERATING
    COMPLETED
    FAILED
    PARTIAL
  }

  type GeneratedReport {
    id: ID!
    symbol: String!
    companyId: ID!
    reportType: String!
    title: String!

    # Report sections
    timeline: JSON
    businessModel: JSON
    financials: JSON
    moat: JSON
    supplyChain: JSON
    catalysts: JSON
    govtImpact: JSON
    globalTrade: JSON
    risks: JSON
    aiSummary: JSON

    # Metadata
    metadata: JSON
    generationMetrics: JSON

    # Analytics
    viewCount: Int!
    downloadCount: Int!

    # Lifecycle
    status: String!
    generatedAt: String!
    expiresAt: String
    lastAccessedAt: String

    # Upgrade prompt fields (for FREE users)
    upgradeRequired: Boolean
    requiredTier: String
    message: String
  }

  type MutationResponse {
    success: Boolean!
    message: String
  }

  extend type Query {
    # Generate or retrieve comprehensive stock report
    generateReport(symbol: String!): GeneratedReport!

    # Get existing report by symbol
    getReport(symbol: String!): GeneratedReport!
  }

  extend type Mutation {
    # Track report download
    trackReportDownload(reportId: ID!): MutationResponse!
  }
`;

// ============================================
// QUERY RESOLVERS
// ============================================

export const generatedReportsQueryResolvers = {
  /**
   * Generate comprehensive stock report
   * Checks cache first (30min TTL), generates if not found
   */
  generateReport: async (
    _: any,
    { symbol }: { symbol: string },
    context: any
  ) => {
    // 1. Authentication check
    if (!context.user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // 2. Tier gating - PRO feature
    const userTier = context.user.tier || 'FREE';
    if (userTier === 'FREE') {
      return {
        id: null,
        symbol,
        companyId: null,
        reportType: 'COMPREHENSIVE',
        title: '',
        viewCount: 0,
        downloadCount: 0,
        status: 'PENDING',
        generatedAt: new Date().toISOString(),
        upgradeRequired: true,
        requiredTier: 'PRO',
        message: 'Upgrade to PRO to generate comprehensive reports',
      };
    }

    // 3. Check cache first
    const cacheKey = `report:comprehensive:${symbol}`;
    const cachedReport = await cache.get(cacheKey);

    if (cachedReport) {
      // Update last accessed time
      await prisma.generatedReport.update({
        where: { id: cachedReport.id },
        data: { lastAccessedAt: new Date() },
      });

      return cachedReport;
    }

    // 4. Check database for recent report (within 24 hours)
    const existingReport = await prisma.generatedReport.findFirst({
      where: {
        symbol,
        reportType: 'COMPREHENSIVE',
        status: 'COMPLETED',
        generatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { generatedAt: 'desc' },
    });

    if (existingReport) {
      // Cache and return
      await cache.set(cacheKey, existingReport, CACHE_TTL.REPORTS);
      return {
        ...existingReport,
        generatedAt: existingReport.generatedAt.toISOString(),
        expiresAt: existingReport.expiresAt?.toISOString(),
        lastAccessedAt: existingReport.lastAccessedAt?.toISOString(),
      };
    }

    // 5. Generate new report
    const startTime = Date.now();

    try {
      // Aggregate data
      const data = await aggregateReportData(symbol);

      // Create report record
      const report = await prisma.generatedReport.create({
        data: {
          symbol,
          companyId: data.company.id,
          reportType: 'COMPREHENSIVE',
          title: `${symbol} - Comprehensive Analysis Report`,
          timeline: data.timeline as any,
          businessModel: data.businessModel as any,
          financials: data.financials as any,
          moat: data.moat as any,
          supplyChain: data.supplyChain as any,
          catalysts: data.catalysts as any,
          govtImpact: data.govtImpact as any,
          globalTrade: data.globalTrade as any,
          risks: data.risks as any,
          aiSummary: data.aiSummary as any,
          status: 'COMPLETED',
          generatedBy: context.user.id,
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hr
          metadata: {
            dataVersion: '1.0',
            generatedBy: context.user.email,
          } as any,
          generationMetrics: {
            durationMs: Date.now() - startTime,
            dataSources: [
              'financials',
              'technicals',
              'news',
              'sentiment',
              'events',
              'ai_summaries',
            ],
          } as any,
        },
      });

      // 6. Cache the report
      const reportData = {
        ...report,
        generatedAt: report.generatedAt.toISOString(),
        expiresAt: report.expiresAt?.toISOString(),
        lastAccessedAt: report.lastAccessedAt?.toISOString(),
      };
      await cache.set(cacheKey, reportData, CACHE_TTL.REPORTS);

      // 7. Log analytics
      await prisma.pageAnalytics.create({
        data: {
          userId: context.user.id,
          sessionId: context.sessionId || 'unknown',
          eventName: 'REPORT_GENERATED',
          eventData: {
            symbol,
            reportType: 'COMPREHENSIVE',
            durationMs: Date.now() - startTime,
          } as any,
          pageUrl: `/stock/${symbol}/report`,
          referrer: '',
          userAgent: context.userAgent || '',
        },
      });

      return reportData;
    } catch (error: any) {
      // Log error and create failed report record
      const company = await prisma.company.findUnique({
        where: { nseSymbol: symbol },
      });

      if (company) {
        await prisma.generatedReport.create({
          data: {
            symbol,
            companyId: company.id,
            reportType: 'COMPREHENSIVE',
            title: `${symbol} - Report Generation Failed`,
            status: 'FAILED',
            generatedBy: context.user.id,
            metadata: { error: error.message } as any,
          },
        });
      }

      throw new GraphQLError('Failed to generate report', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          originalError: error.message,
        },
      });
    }
  },

  /**
   * Get existing report by symbol
   */
  getReport: async (
    _: any,
    { symbol }: { symbol: string },
    context: any
  ) => {
    // 1. Authentication check
    if (!context.user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // 2. Tier gating
    const userTier = context.user.tier || 'FREE';
    if (userTier === 'FREE') {
      throw new GraphQLError('Upgrade to PRO to access reports', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // 3. Find report
    const report = await prisma.generatedReport.findFirst({
      where: {
        symbol,
        reportType: 'COMPREHENSIVE',
        status: 'COMPLETED',
      },
      orderBy: { generatedAt: 'desc' },
    });

    if (!report) {
      throw new GraphQLError('Report not found. Generate a new report.', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // 4. Track view
    await Promise.all([
      prisma.generatedReport.update({
        where: { id: report.id },
        data: {
          viewCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      }),
      prisma.reportView.create({
        data: {
          reportId: report.id,
          userId: context.user.id,
          ipAddress: context.ip,
          userAgent: context.userAgent,
        },
      }),
    ]);

    return {
      ...report,
      generatedAt: report.generatedAt.toISOString(),
      expiresAt: report.expiresAt?.toISOString(),
      lastAccessedAt: report.lastAccessedAt?.toISOString(),
    };
  },
};

// ============================================
// MUTATION RESOLVERS
// ============================================

export const generatedReportsMutationResolvers = {
  /**
   * Increment download count (called when user downloads PDF)
   */
  trackReportDownload: async (
    _: any,
    { reportId }: { reportId: string },
    context: any
  ) => {
    if (!context.user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    await prisma.generatedReport.update({
      where: { id: reportId },
      data: { downloadCount: { increment: 1 } },
    });

    return { success: true, message: 'Download tracked' };
  },
};

// ============================================
// FIELD RESOLVERS
// ============================================

export const generatedReportsFieldResolvers = {
  GeneratedReport: {
    generatedAt: (parent: any) => parent.generatedAt?.toISOString?.() || parent.generatedAt,
    expiresAt: (parent: any) => parent.expiresAt?.toISOString?.() || parent.expiresAt || null,
    lastAccessedAt: (parent: any) => parent.lastAccessedAt?.toISOString?.() || parent.lastAccessedAt || null,
  },
};
