/**
 * GraphQL Resolvers for Weekly Reports
 *
 * Provides queries and mutations for:
 * - Fetching reports with filters (reportType, sectorId, isPublished)
 * - Getting single report by slug
 * - Getting latest reports
 * - Incrementing view count
 * - Newsletter subscription management
 */

import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

// ============================================
// TYPE DEFINITIONS
// ============================================

export const reportsTypeDefs = `#graphql
  enum ReportType {
    SECTOR_WEEKLY
    MACRO_WEEKLY
  }

  enum SectionType {
    TEXT
    CHART_DATA
    TABLE_DATA
    METRIC_CARDS
    STOCK_LIST
  }

  enum NewsletterFrequency {
    WEEKLY
    DAILY
  }

  type WeeklyReport {
    id: ID!
    reportType: ReportType!
    sectorId: String
    sector: Sector
    title: String!
    slug: String!
    coverImageUrl: String
    summary: String!
    fullContent: JSON!
    publishedAt: String
    fiscalWeek: Int!
    fiscalYear: Int!
    isPublished: Boolean!
    viewCount: Int!
    createdAt: String!
    updatedAt: String!
    reportSections: [ReportSection!]!
  }

  type ReportSection {
    id: ID!
    reportId: String!
    sectionOrder: Int!
    sectionTitle: String!
    sectionType: SectionType!
    content: JSON!
    createdAt: String!
  }

  type NewsletterSubscriber {
    id: ID!
    userId: String
    email: String!
    subscribedSectors: [String!]!
    frequency: NewsletterFrequency!
    isActive: Boolean!
    subscribedAt: String!
    unsubscribedAt: String
  }

  input ReportFiltersInput {
    reportType: ReportType
    sectorId: String
    isPublished: Boolean
  }

  input PaginationInput {
    limit: Int
    offset: Int
  }

  extend type Query {
    # Get reports with optional filters and pagination
    reports(filters: ReportFiltersInput, pagination: PaginationInput): [WeeklyReport!]!

    # Get single report by slug
    report(slug: String!): WeeklyReport

    # Get latest N reports
    latestReports(limit: Int!): [WeeklyReport!]!

    # Get reports by sector
    reportsBySector(sectorId: String!, limit: Int): [WeeklyReport!]!
  }

  extend type Mutation {
    # Increment report view count
    incrementReportView(slug: String!): WeeklyReport!

    # Subscribe to newsletter
    subscribeNewsletter(
      email: String!
      subscribedSectors: [String!]!
      frequency: NewsletterFrequency!
    ): NewsletterSubscriber!

    # Unsubscribe from newsletter
    unsubscribeNewsletter(email: String!): Boolean!

    # Update newsletter preferences (authenticated)
    updateNewsletterPreferences(
      subscribedSectors: [String!]
      frequency: NewsletterFrequency
    ): NewsletterSubscriber!
  }
`;

// ============================================
// QUERY RESOLVERS
// ============================================

export const reportsQueryResolvers = {
  /**
   * Get reports with optional filters and pagination
   */
  reports: async (
    _: any,
    {
      filters,
      pagination,
    }: {
      filters?: {
        reportType?: 'SECTOR_WEEKLY' | 'MACRO_WEEKLY';
        sectorId?: string;
        isPublished?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
      };
    }
  ) => {
    const where: any = {};

    // Apply filters
    if (filters?.reportType) {
      where.reportType = filters.reportType;
    }
    if (filters?.sectorId) {
      where.sectorId = filters.sectorId;
    }
    if (filters?.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    // Default to only published reports unless explicitly requested
    if (!filters?.isPublished) {
      where.isPublished = true;
    }

    const reports = await prisma.weeklyReport.findMany({
      where,
      include: {
        sector: true,
        reportSections: {
          orderBy: { sectionOrder: 'asc' },
        },
      },
      orderBy: [
        { fiscalYear: 'desc' },
        { fiscalWeek: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: pagination?.limit || 20,
      skip: pagination?.offset || 0,
    });

    return reports;
  },

  /**
   * Get single report by slug
   */
  report: async (_: any, { slug }: { slug: string }) => {
    const report = await prisma.weeklyReport.findUnique({
      where: { slug },
      include: {
        sector: true,
        reportSections: {
          orderBy: { sectionOrder: 'asc' },
        },
      },
    });

    if (!report) {
      throw new GraphQLError('Report not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Only return published reports to non-admin users
    // TODO: Add admin check when needed
    if (!report.isPublished) {
      throw new GraphQLError('Report not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return report;
  },

  /**
   * Get latest N reports
   */
  latestReports: async (_: any, { limit }: { limit: number }) => {
    const reports = await prisma.weeklyReport.findMany({
      where: {
        isPublished: true,
      },
      include: {
        sector: true,
        reportSections: {
          orderBy: { sectionOrder: 'asc' },
        },
      },
      orderBy: [
        { publishedAt: 'desc' },
        { fiscalYear: 'desc' },
        { fiscalWeek: 'desc' },
      ],
      take: Math.min(limit, 50), // Max 50 reports
    });

    return reports;
  },

  /**
   * Get reports by sector
   */
  reportsBySector: async (
    _: any,
    { sectorId, limit = 10 }: { sectorId: string; limit?: number }
  ) => {
    const reports = await prisma.weeklyReport.findMany({
      where: {
        sectorId,
        isPublished: true,
      },
      include: {
        sector: true,
        reportSections: {
          orderBy: { sectionOrder: 'asc' },
        },
      },
      orderBy: [
        { fiscalYear: 'desc' },
        { fiscalWeek: 'desc' },
      ],
      take: Math.min(limit, 20),
    });

    return reports;
  },
};

// ============================================
// MUTATION RESOLVERS
// ============================================

export const reportsMutationResolvers = {
  /**
   * Increment report view count
   */
  incrementReportView: async (_: any, { slug }: { slug: string }) => {
    const report = await prisma.weeklyReport.update({
      where: { slug },
      data: {
        viewCount: {
          increment: 1,
        },
      },
      include: {
        sector: true,
        reportSections: {
          orderBy: { sectionOrder: 'asc' },
        },
      },
    });

    return report;
  },

  /**
   * Subscribe to newsletter
   */
  subscribeNewsletter: async (
    _: any,
    {
      email,
      subscribedSectors,
      frequency,
    }: {
      email: string;
      subscribedSectors: string[];
      frequency: 'WEEKLY' | 'DAILY';
    }
  ) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new GraphQLError('Invalid email address', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Check if subscriber already exists
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        const subscriber = await prisma.newsletterSubscriber.update({
          where: { email },
          data: {
            isActive: true,
            subscribedSectors: subscribedSectors,
            frequency: frequency,
            unsubscribedAt: null,
          },
        });
        return subscriber;
      }

      throw new GraphQLError('Email already subscribed', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Create new subscriber
    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email,
        subscribedSectors: subscribedSectors,
        frequency: frequency,
        isActive: true,
      },
    });

    return subscriber;
  },

  /**
   * Unsubscribe from newsletter
   */
  unsubscribeNewsletter: async (_: any, { email }: { email: string }) => {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      throw new GraphQLError('Subscriber not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    await prisma.newsletterSubscriber.update({
      where: { email },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    return true;
  },

  /**
   * Update newsletter preferences (requires authentication)
   */
  updateNewsletterPreferences: async (
    _: any,
    {
      subscribedSectors,
      frequency,
    }: {
      subscribedSectors?: string[];
      frequency?: 'WEEKLY' | 'DAILY';
    },
    context: any
  ) => {
    // Authenticate user
    if (!context.user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Find subscriber by user ID
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { userId: context.user.id },
    });

    if (!subscriber) {
      throw new GraphQLError('Newsletter subscription not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Update preferences
    const data: any = {};
    if (subscribedSectors !== undefined) {
      data.subscribedSectors = subscribedSectors;
    }
    if (frequency !== undefined) {
      data.frequency = frequency;
    }

    const updated = await prisma.newsletterSubscriber.update({
      where: { userId: context.user.id },
      data,
    });

    return updated;
  },
};

// ============================================
// FIELD RESOLVERS
// ============================================

export const reportsFieldResolvers = {
  WeeklyReport: {
    publishedAt: (parent: any) => parent.publishedAt?.toISOString() || null,
    createdAt: (parent: any) => parent.createdAt.toISOString(),
    updatedAt: (parent: any) => parent.updatedAt.toISOString(),
  },

  ReportSection: {
    createdAt: (parent: any) => parent.createdAt.toISOString(),
  },

  NewsletterSubscriber: {
    subscribedAt: (parent: any) => parent.subscribedAt.toISOString(),
    unsubscribedAt: (parent: any) => parent.unsubscribedAt?.toISOString() || null,
    subscribedSectors: (parent: any) => parent.subscribedSectors as string[],
  },
};
