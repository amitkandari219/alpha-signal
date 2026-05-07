/**
 * GraphQL Resolvers for Stock Knowledge Repository
 *
 * Provides queries and mutations for:
 * - StockEvent: Company events with full-text search
 * - StockMilestone: Key company milestones
 * - CompanyProfile: Structured company profile sections
 * - CompanyTimelineSummary: AI-generated timeline narratives
 */

import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

// ============================================
// TYPE DEFINITIONS
// ============================================

export const stockRepositoryTypeDefs = `#graphql
  enum EventType {
    QUARTERLY_RESULT
    ANNUAL_RESULT
    MANAGEMENT_CHANGE
    DIVIDEND
    STOCK_SPLIT
    BONUS
    RIGHTS_ISSUE
    ACQUISITION
    DIVESTITURE
    CAPEX_ANNOUNCEMENT
    ORDER_WIN
    ORDER_LOSS
    PRODUCT_LAUNCH
    PLANT_EXPANSION
    REGULATORY_ACTION
    SEBI_NOTICE
    CREDIT_RATING_CHANGE
    AUDITOR_CHANGE
    PROMOTER_CHANGE
    BULK_DEAL
    BLOCK_DEAL
    PLEDGE_CHANGE
    SECTOR_POLICY
    GOVERNMENT_ORDER
    CONCALL_HIGHLIGHT
    ANALYST_ACTION
    MEDIA_COVERAGE
    LITIGATION_UPDATE
    AGM_EGM
    BOARD_MEETING
    OTHER
  }

  enum ImpactAssessment {
    VERY_POSITIVE
    POSITIVE
    NEUTRAL
    NEGATIVE
    VERY_NEGATIVE
  }

  enum MilestoneType {
    MAJOR_ACHIEVEMENT
    SIGNIFICANT_SETBACK
    STRATEGIC_SHIFT
    MARKET_MILESTONE
    OPERATIONAL_MILESTONE
  }

  enum TimelinePeriodType {
    LAST_7_DAYS
    LAST_30_DAYS
    LAST_90_DAYS
    LAST_6_MONTHS
    LAST_1_YEAR
    LAST_3_YEARS
    LAST_5_YEARS
    ALL_TIME
  }

  enum CompanyProfileSectionType {
    BUSINESS_MODEL
    PRODUCTS_SERVICES
    COMPETITIVE_POSITION
    MANAGEMENT_TEAM
    FINANCIAL_HIGHLIGHTS
    GROWTH_DRIVERS
    KEY_RISKS
  }

  enum ConfidenceLevel {
    HIGH
    MEDIUM
    LOW
  }

  type StockEvent {
    id: ID!
    companyId: String!
    company: Company!
    eventType: EventType!
    eventDate: String!
    title: String!
    summary: String!
    detailedContent: JSON!
    impactAssessment: ImpactAssessment!
    impactAreas: [String!]!
    sourceUrls: [String!]!
    sourceNames: [String!]!
    aiGenerated: Boolean!
    confidence: ConfidenceLevel!
    isVerified: Boolean!
    tags: [String!]!
    fiscalYear: Int
    fiscalQuarter: Int
    createdAt: String!
    updatedAt: String!
  }

  type StockMilestone {
    id: ID!
    companyId: String!
    company: Company!
    milestoneType: MilestoneType!
    date: String!
    title: String!
    description: String!
    significance: String!
    relatedEventIds: [String!]!
    metadata: JSON
    createdAt: String!
    updatedAt: String!
  }

  type CompanyTimelineSummary {
    id: ID!
    companyId: String!
    company: Company!
    periodType: TimelinePeriodType!
    startDate: String!
    endDate: String!
    keyEvents: JSON!
    majorChanges: JSON!
    narrative: String!
    metrics: JSON!
    generatedAt: String!
    updatedAt: String!
  }

  type CompanyProfile {
    id: ID!
    companyId: String!
    company: Company!
    sectionType: CompanyProfileSectionType!
    content: JSON!
    lastUpdated: String!
    createdAt: String!
    updatedAt: String!
  }

  type StockEventsResponse {
    events: [StockEvent!]!
    total: Int!
    hasMore: Boolean!
  }

  type SearchEventsResponse {
    events: [StockEvent!]!
    total: Int!
  }

  input StockEventFiltersInput {
    eventTypes: [EventType!]
    impactAssessments: [ImpactAssessment!]
    startDate: String
    endDate: String
    search: String
    tags: [String!]
    fiscalYear: Int
    fiscalQuarter: Int
    isVerified: Boolean
  }

  input PaginationInput {
    limit: Int
    offset: Int
  }

  extend type Query {
    # Get stock events for a company with filters and pagination
    stockEvents(
      companyId: ID!
      filters: StockEventFiltersInput
      pagination: PaginationInput
    ): StockEventsResponse!

    # Get single stock event by ID
    stockEvent(id: ID!): StockEvent

    # Get company milestones
    companyMilestones(companyId: ID!, limit: Int): [StockMilestone!]!

    # Get company profile section
    companyProfile(companyId: ID!, sectionType: CompanyProfileSectionType!): CompanyProfile

    # Get all company profile sections
    companyProfileAll(companyId: ID!): [CompanyProfile!]!

    # Get company timeline summary
    companyTimelineSummary(companyId: ID!, periodType: TimelinePeriodType!): CompanyTimelineSummary

    # Search events across all companies
    searchEventsAcrossCompanies(
      query: String!
      filters: StockEventFiltersInput
      pagination: PaginationInput
    ): SearchEventsResponse!
  }

  extend type Mutation {
    # Create a new stock event (admin only)
    createStockEvent(input: CreateStockEventInput!): StockEvent!

    # Update a stock event (admin only)
    updateStockEvent(id: ID!, input: UpdateStockEventInput!): StockEvent!

    # Verify a stock event (admin only)
    verifyStockEvent(id: ID!): StockEvent!
  }

  input CreateStockEventInput {
    companyId: ID!
    eventType: EventType!
    eventDate: String!
    title: String!
    summary: String!
    detailedContent: JSON!
    impactAssessment: ImpactAssessment!
    impactAreas: [String!]!
    sourceUrls: [String!]!
    sourceNames: [String!]!
    aiGenerated: Boolean
    confidence: ConfidenceLevel!
    tags: [String!]!
    fiscalYear: Int
    fiscalQuarter: Int
  }

  input UpdateStockEventInput {
    eventType: EventType
    eventDate: String
    title: String
    summary: String
    detailedContent: JSON
    impactAssessment: ImpactAssessment
    impactAreas: [String!]
    sourceUrls: [String!]
    sourceNames: [String!]
    confidence: ConfidenceLevel
    tags: [String!]
    fiscalYear: Int
    fiscalQuarter: Int
  }
`;

// ============================================
// QUERY RESOLVERS
// ============================================

export const stockRepositoryQueryResolvers = {
  /**
   * Get stock events for a company with filters and pagination
   */
  stockEvents: async (
    _: any,
    {
      companyId,
      filters,
      pagination,
    }: {
      companyId: string;
      filters?: {
        eventTypes?: string[];
        impactAssessments?: string[];
        startDate?: string;
        endDate?: string;
        search?: string;
        tags?: string[];
        fiscalYear?: number;
        fiscalQuarter?: number;
        isVerified?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
      };
    },
    context?: any
  ) => {
    // Build where clause
    const where: any = { companyId };

    if (filters?.eventTypes && filters.eventTypes.length > 0) {
      where.eventType = { in: filters.eventTypes };
    }

    if (filters?.impactAssessments && filters.impactAssessments.length > 0) {
      where.impactAssessment = { in: filters.impactAssessments };
    }

    if (filters?.startDate || filters?.endDate) {
      where.eventDate = {};
      if (filters.startDate) {
        where.eventDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.eventDate.lte = new Date(filters.endDate);
      }
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters?.fiscalYear) {
      where.fiscalYear = filters.fiscalYear;
    }

    if (filters?.fiscalQuarter) {
      where.fiscalQuarter = filters.fiscalQuarter;
    }

    if (filters?.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    // Apply tier-based filtering
    const userTier = context?.user?.tier || 'FREE';
    if (userTier === 'FREE') {
      // Free tier: Only show verified events
      where.isVerified = true;
    }

    const limit = Math.min(pagination?.limit || 20, 100);
    const offset = pagination?.offset || 0;

    // Get total count
    const total = await prisma.stockEvent.count({ where });

    // Get events
    const events = await prisma.stockEvent.findMany({
      where,
      include: {
        company: {
          include: {
            sector: true,
            industry: true,
          },
        },
      },
      orderBy: { eventDate: 'desc' },
      take: limit,
      skip: offset,
    });

    return {
      events,
      total,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Get single stock event by ID
   */
  stockEvent: async (_: any, { id }: { id: string }, context?: any) => {
    const event = await prisma.stockEvent.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            sector: true,
            industry: true,
          },
        },
      },
    });

    if (!event) {
      throw new GraphQLError('Stock event not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Apply tier-based access
    const userTier = context?.user?.tier || 'FREE';
    if (userTier === 'FREE' && !event.isVerified) {
      throw new GraphQLError('Access denied: Premium content', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    return event;
  },

  /**
   * Get company milestones
   */
  companyMilestones: async (
    _: any,
    { companyId, limit = 10 }: { companyId: string; limit?: number }
  ) => {
    const milestones = await prisma.stockMilestone.findMany({
      where: { companyId },
      include: {
        company: {
          include: {
            sector: true,
            industry: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: Math.min(limit, 50),
    });

    return milestones;
  },

  /**
   * Get company profile section
   */
  companyProfile: async (
    _: any,
    {
      companyId,
      sectionType,
    }: {
      companyId: string;
      sectionType: string;
    }
  ) => {
    const profile = await prisma.companyProfile.findUnique({
      where: {
        companyId_sectionType: {
          companyId,
          sectionType: sectionType as any,
        },
      },
      include: {
        company: {
          include: {
            sector: true,
            industry: true,
          },
        },
      },
    });

    if (!profile) {
      throw new GraphQLError('Company profile section not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return profile;
  },

  /**
   * Get all company profile sections
   */
  companyProfileAll: async (_: any, { companyId }: { companyId: string }) => {
    const profiles = await prisma.companyProfile.findMany({
      where: { companyId },
      include: {
        company: {
          include: {
            sector: true,
            industry: true,
          },
        },
      },
      orderBy: { sectionType: 'asc' },
    });

    return profiles;
  },

  /**
   * Get company timeline summary
   */
  companyTimelineSummary: async (
    _: any,
    {
      companyId,
      periodType,
    }: {
      companyId: string;
      periodType: string;
    }
  ) => {
    const summary = await prisma.companyTimelineSummary.findUnique({
      where: {
        companyId_periodType: {
          companyId,
          periodType: periodType as any,
        },
      },
      include: {
        company: {
          include: {
            sector: true,
            industry: true,
          },
        },
      },
    });

    if (!summary) {
      throw new GraphQLError('Timeline summary not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return summary;
  },

  /**
   * Search events across all companies using full-text search
   */
  searchEventsAcrossCompanies: async (
    _: any,
    {
      query,
      filters,
      pagination,
    }: {
      query: string;
      filters?: {
        eventTypes?: string[];
        impactAssessments?: string[];
        startDate?: string;
        endDate?: string;
        tags?: string[];
        fiscalYear?: number;
        fiscalQuarter?: number;
        isVerified?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
      };
    },
    context?: any
  ) => {
    if (!query || query.length < 2) {
      return { events: [], total: 0 };
    }

    // Build where clause
    const where: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (filters?.eventTypes && filters.eventTypes.length > 0) {
      where.eventType = { in: filters.eventTypes };
    }

    if (filters?.impactAssessments && filters.impactAssessments.length > 0) {
      where.impactAssessment = { in: filters.impactAssessments };
    }

    if (filters?.startDate || filters?.endDate) {
      where.eventDate = {};
      if (filters.startDate) {
        where.eventDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.eventDate.lte = new Date(filters.endDate);
      }
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters?.fiscalYear) {
      where.fiscalYear = filters.fiscalYear;
    }

    if (filters?.fiscalQuarter) {
      where.fiscalQuarter = filters.fiscalQuarter;
    }

    // Apply tier-based filtering
    const userTier = context?.user?.tier || 'FREE';
    if (userTier === 'FREE') {
      where.isVerified = true;
    } else if (filters?.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    const limit = Math.min(pagination?.limit || 20, 100);
    const offset = pagination?.offset || 0;

    // Get total count
    const total = await prisma.stockEvent.count({ where });

    // Get events
    const events = await prisma.stockEvent.findMany({
      where,
      include: {
        company: {
          include: {
            sector: true,
            industry: true,
          },
        },
      },
      orderBy: [
        { eventDate: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    return {
      events,
      total,
    };
  },
};

// ============================================
// MUTATION RESOLVERS
// ============================================

export const stockRepositoryMutationResolvers = {
  /**
   * Create a new stock event (admin only)
   */
  createStockEvent: async (
    _: any,
    { input }: { input: any },
    context: any
  ) => {
    // Authenticate user (admin only)
    if (!context.user || context.user.tier !== 'PREMIUM') {
      throw new GraphQLError('Not authorized: Admin access required', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const event = await prisma.stockEvent.create({
      data: {
        companyId: input.companyId,
        eventType: input.eventType,
        eventDate: new Date(input.eventDate),
        title: input.title,
        summary: input.summary,
        detailedContent: input.detailedContent,
        impactAssessment: input.impactAssessment,
        impactAreas: input.impactAreas,
        sourceUrls: input.sourceUrls,
        sourceNames: input.sourceNames,
        aiGenerated: input.aiGenerated !== undefined ? input.aiGenerated : true,
        confidence: input.confidence,
        tags: input.tags,
        fiscalYear: input.fiscalYear,
        fiscalQuarter: input.fiscalQuarter,
      },
      include: {
        company: {
          include: {
            sector: true,
            industry: true,
          },
        },
      },
    });

    return event;
  },

  /**
   * Update a stock event (admin only)
   */
  updateStockEvent: async (
    _: any,
    { id, input }: { id: string; input: any },
    context: any
  ) => {
    // Authenticate user (admin only)
    if (!context.user || context.user.tier !== 'PREMIUM') {
      throw new GraphQLError('Not authorized: Admin access required', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const updateData: any = {};

    if (input.eventType) updateData.eventType = input.eventType;
    if (input.eventDate) updateData.eventDate = new Date(input.eventDate);
    if (input.title) updateData.title = input.title;
    if (input.summary) updateData.summary = input.summary;
    if (input.detailedContent) updateData.detailedContent = input.detailedContent;
    if (input.impactAssessment) updateData.impactAssessment = input.impactAssessment;
    if (input.impactAreas) updateData.impactAreas = input.impactAreas;
    if (input.sourceUrls) updateData.sourceUrls = input.sourceUrls;
    if (input.sourceNames) updateData.sourceNames = input.sourceNames;
    if (input.confidence) updateData.confidence = input.confidence;
    if (input.tags) updateData.tags = input.tags;
    if (input.fiscalYear !== undefined) updateData.fiscalYear = input.fiscalYear;
    if (input.fiscalQuarter !== undefined) updateData.fiscalQuarter = input.fiscalQuarter;

    const event = await prisma.stockEvent.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          include: {
            sector: true,
            industry: true,
          },
        },
      },
    });

    return event;
  },

  /**
   * Verify a stock event (admin only)
   */
  verifyStockEvent: async (_: any, { id }: { id: string }, context: any) => {
    // Authenticate user (admin only)
    if (!context.user || context.user.tier !== 'PREMIUM') {
      throw new GraphQLError('Not authorized: Admin access required', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const event = await prisma.stockEvent.update({
      where: { id },
      data: { isVerified: true },
      include: {
        company: {
          include: {
            sector: true,
            industry: true,
          },
        },
      },
    });

    return event;
  },
};

// ============================================
// FIELD RESOLVERS
// ============================================

export const stockRepositoryFieldResolvers = {
  StockEvent: {
    eventDate: (parent: any) => parent.eventDate.toISOString().split('T')[0],
    createdAt: (parent: any) => parent.createdAt.toISOString(),
    updatedAt: (parent: any) => parent.updatedAt.toISOString(),
  },

  StockMilestone: {
    date: (parent: any) => parent.date.toISOString().split('T')[0],
    createdAt: (parent: any) => parent.createdAt.toISOString(),
    updatedAt: (parent: any) => parent.updatedAt.toISOString(),
  },

  CompanyTimelineSummary: {
    startDate: (parent: any) => parent.startDate.toISOString().split('T')[0],
    endDate: (parent: any) => parent.endDate.toISOString().split('T')[0],
    generatedAt: (parent: any) => parent.generatedAt.toISOString(),
    updatedAt: (parent: any) => parent.updatedAt.toISOString(),
  },

  CompanyProfile: {
    lastUpdated: (parent: any) => parent.lastUpdated.toISOString(),
    createdAt: (parent: any) => parent.createdAt.toISOString(),
    updatedAt: (parent: any) => parent.updatedAt.toISOString(),
  },
};
