import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { ApolloServer } from '@apollo/server';
import fastifyApollo from '@as-integrations/fastify';
import { Server } from 'socket.io';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { GraphQLScalarType, Kind } from 'graphql';
import bcrypt from 'bcrypt';
import DataLoader from 'dataloader';
import { authRoutes } from './routes/auth.js';
import billingRoutes from './routes/billing.js';
import { seoRoutes } from './routes/seo.js';
import { analyticsRoutes } from './routes/analytics.js';
import { healthRoutes } from './routes/health.js';
import { metricsRoutes } from './routes/metrics.js';
import { reportRoutes } from './routes/reports.js';
import { newsletterRoutes } from './routes/newsletter.js';
import { WebSocketServer } from './websocket/server.js';
import { startMockPriceSimulator } from './services/mockPriceSimulator.js';
import { setupRateLimiting } from './middleware/rateLimiting.js';
import { setupAuth } from './middleware/auth.js';
import { cachePlugin } from './middleware/cacheMiddleware.js';
import { setupMetricsHooks } from './middleware/metricsHooks.js';
import { graphqlMetricsPlugin } from './middleware/graphqlMetricsPlugin.js';
import { scheduleCacheWarming } from './services/cacheWarming.js';
import { scheduleMaterializedViewRefresh } from './services/materializedViewRefresh.js';
import { adminRoutes } from './routes/admin.js';
import { startAlertMonitoring } from './services/alerting.js';
import { logger, logHttpRequest, createRequestLogger } from './services/logger.js';
import {
  setupGlobalErrorHandlers,
  setupFastifyErrorHandler,
  trackError,
} from './services/errorTracker.js';
import { graphqlLoggingPlugin } from './middleware/graphqlLoggingPlugin.js';
import {
  reportsTypeDefs,
  reportsQueryResolvers,
  reportsMutationResolvers,
  reportsFieldResolvers,
} from './graphql/resolvers/reports.js';
import {
  generatedReportsTypeDefs,
  generatedReportsQueryResolvers,
  generatedReportsMutationResolvers,
  generatedReportsFieldResolvers,
} from './graphql/resolvers/generatedReports.js';
import {
  stockRepositoryTypeDefs,
  stockRepositoryQueryResolvers,
  stockRepositoryMutationResolvers,
  stockRepositoryFieldResolvers,
} from './graphql/resolvers/stockRepository.js';
import { stockRepositoryRoutes } from './routes/stockRepository.js';
import { stockRoutes } from './routes/stocks.js';

config();

// Setup global error handlers for uncaught exceptions
setupGlobalErrorHandlers();

const prisma = new PrismaClient();

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = '0.0.0.0';

// ============================================
// CUSTOM SCALARS
// ============================================

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value: any) {
    return value;
  },
  parseValue(value: any) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.OBJECT || ast.kind === Kind.LIST) {
      return JSON.parse(JSON.stringify(ast));
    }
    return null;
  },
});

// ============================================
// AUTHENTICATION HELPERS
// ============================================

const authenticateUser = (context: any) => {
  if (!context.user) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
};

const generateTokens = (fastify: any, userId: string) => {
  const token = fastify.jwt.sign({ userId }, { expiresIn: '7d' });
  const refreshToken = fastify.jwt.sign({ userId }, { expiresIn: '30d' });
  return { token, refreshToken };
};

// ============================================
// DATALOADERS (for N+1 prevention)
// ============================================

const createLoaders = () => {
  const companyLoader = new DataLoader(async (ids: readonly string[]) => {
    const companies = await prisma.company.findMany({
      where: { id: { in: [...ids] } },
      include: { sector: true, industry: true },
    });
    const companyMap = new Map(companies.map(c => [c.id, c]));
    return ids.map(id => companyMap.get(id) || null);
  });

  const latestScoreLoader = new DataLoader(async (companyIds: readonly string[]) => {
    const scores = await prisma.compositeScore.findMany({
      where: { companyId: { in: [...companyIds] } },
      orderBy: { date: 'desc' },
      distinct: ['companyId'],
    });
    const scoreMap = new Map(scores.map(s => [s.companyId, s]));
    return companyIds.map(id => scoreMap.get(id) || null);
  });

  return { companyLoader, latestScoreLoader };
};

// GraphQL Type Definitions - Merge base types with reports types
const baseTypeDefs = `#graphql
  # ============================================
  # ENUMS
  # ============================================

  enum Period {
    DAY_1
    WEEK_1
    MONTH_1
    MONTH_3
    MONTH_6
    YEAR_1
    YEAR_5
    MAX
  }

  enum TrendStatus {
    STRONG_UPTREND
    UPTREND
    SIDEWAYS
    DOWNTREND
    STRONG_DOWNTREND
  }

  enum RiskFlagType {
    PROMOTER_PLEDGE
    AUDITOR_CONCERN
    RELATED_PARTY
    DEBT_SPIRAL
    EARNINGS_MANIPULATION
    GOVERNANCE
    LITIGATION
    REGULATORY
  }

  enum Severity {
    HIGH
    MEDIUM
    LOW
  }

  # ============================================
  # BASIC TYPES
  # ============================================

  type Company {
    id: ID!
    nseSymbol: String
    bseCode: String
    isin: String!
    companyName: String!
    shortName: String!
    marketCapCategory: String!
    listingDate: String
    isActive: Boolean!
    sector: Sector!
    industry: Industry!
    compositeScores: [CompositeScore!]
    financialResults: [FinancialResult!]
    technicalIndicators: [TechnicalIndicator!]
  }

  type Sector {
    id: ID!
    name: String!
    slug: String!
    companies: [Company!]
  }

  type Industry {
    id: ID!
    name: String!
    slug: String!
    companies: [Company!]
  }

  type CompositeScore {
    id: ID!
    date: String!
    qualityScore: Int!
    growthScore: Int!
    riskScore: Int!
    sentimentScore: Int!
    momentumScore: Int!
    factorBreakdown: JSON!
    computedAt: String!
  }

  type FinancialResult {
    id: ID!
    periodType: String!
    fiscalYear: Int!
    fiscalQuarter: Int
    revenue: Float
    operatingProfit: Float
    netProfit: Float
    eps: Float
    operatingMargin: Float
    netMargin: Float
    publishedAt: String!
  }

  type TechnicalIndicator {
    id: ID!
    date: String!
    rsi14: Float
    macd: Float
    macdSignal: Float
    macdHistogram: Float
    sma20: Float
    sma50: Float
    sma100: Float
    sma200: Float
    adx: Float
  }

  type NewsArticle {
    id: ID!
    title: String!
    source: String!
    url: String!
    publishedAt: String!
    summary: String
    sentimentLabel: String
    impactRating: String
  }

  # ============================================
  # COMPREHENSIVE STOCK DETAIL TYPES
  # ============================================

  type StockDetail {
    symbol: String!
    company: CompanyInfo!
    priceData: PriceSnapshot!
    historicalPrices(period: Period!): [OHLCV!]!
    aiSummary: AISummaryDetail
    fundamentals: Fundamentals
    technicals: TechnicalsDetail
    newsSentiment: NewsSentiment
    tailwinds: TailwindData
    riskDashboard: RiskDashboard
    scores: CompositeScoresDetail
    shareholding: ShareholdingData
    insiderTransactions: [InsiderTransactionDetail!]!
    peerComparison: [PeerMetric!]!
  }

  type CompanyInfo {
    name: String!
    shortName: String!
    sector: String!
    industry: String!
    isin: String!
    marketCapCategory: String!
    listingDate: String
  }

  type PriceSnapshot {
    current: Float!
    changePct: Float!
    dayHigh: Float
    dayLow: Float
    week52High: Float
    week52Low: Float
    volume: Float
    marketCap: Float
    timestamp: String!
  }

  type OHLCV {
    timestamp: String!
    open: Float!
    high: Float!
    low: Float!
    close: Float!
    volume: Float!
  }

  type AISummaryDetail {
    businessOverview: String
    currentThesis: String
    bullCase: String
    bearCase: String
    keyRisks: [String!]
    tailwinds: [String!]
    confidence: String!
    generatedAt: String!
    dataFreshnessNote: String
  }

  type Fundamentals {
    revenueCagr3y: Float
    revenueCagr5y: Float
    profitCagr5y: Float
    roe: Float
    roce: Float
    operatingMargin: Float
    netMargin: Float
    debtToEquity: Float
    interestCoverage: Float
    currentRatio: Float
    cashPctOfMcap: Float
    fcfYield: Float
    ocfToPatRatio: Float
  }

  type TechnicalsDetail {
    trendStatus: TrendStatus!
    sma20: MovingAverageData
    sma50: MovingAverageData
    sma100: MovingAverageData
    sma200: MovingAverageData
    rsi14: Float
    macd: MACDData
    adx: Float
    breakoutSignals: [String!]
    momentumScore: Int
  }

  type MovingAverageData {
    value: Float!
    distancePct: Float!
  }

  type MACDData {
    value: Float!
    signal: Float!
    histogram: Float!
  }

  type NewsSentiment {
    newsDigest: [NewsDigestItem!]!
    sentimentTimeline: [SentimentTimelineItem!]!
    riskAlerts: [String!]!
    sectorCorrelation: String
  }

  type NewsDigestItem {
    title: String!
    source: String!
    publishedAt: String!
    sentiment: String!
    impact: String!
    url: String!
  }

  type SentimentTimelineItem {
    date: String!
    sentiment: Float!
  }

  type TailwindData {
    policies: [PolicyTailwind!]!
    sectorMomentum: SectorMomentumData
    commodityCorrelations: [CommodityCorrelation!]!
    macroFactors: [MacroFactor!]!
  }

  type PolicyTailwind {
    name: String!
    description: String!
    impact: String!
  }

  type SectorMomentumData {
    trend: String!
    score: Int!
  }

  type CommodityCorrelation {
    commodity: String!
    correlation: Float!
    impact: String!
  }

  type MacroFactor {
    factor: String!
    status: String!
    impact: String!
  }

  type RiskDashboard {
    flags: [RiskFlagDetail!]!
    earningsQualityScore: Int
    governanceRiskScore: Int
    volatilityMetrics: VolatilityMetrics
  }

  type RiskFlagDetail {
    type: RiskFlagType!
    severity: Severity!
    description: String!
    detectedAt: String!
  }

  type VolatilityMetrics {
    beta: Float
    volatility30d: Float
    volatility90d: Float
    maxDrawdown: Float
  }

  type CompositeScoresDetail {
    quality: ScoreDetail!
    growth: ScoreDetail!
    risk: ScoreDetail!
    sentiment: ScoreDetail!
    momentum: ScoreDetail!
  }

  type ScoreDetail {
    value: Int!
    factorBreakdown: [FactorBreakdown!]!
  }

  type FactorBreakdown {
    factor: String!
    value: Float!
    weight: Float!
  }

  type ShareholdingData {
    current: ShareholdingQuarter!
    history: [ShareholdingQuarter!]!
  }

  type ShareholdingQuarter {
    quarter: String!
    promoterPct: Float!
    fiiPct: Float!
    diiPct: Float!
    publicPct: Float!
    pledgePct: Float
  }

  type InsiderTransactionDetail {
    personName: String!
    personCategory: String!
    transactionType: String!
    quantity: Float!
    price: Float!
    value: Float!
    filingDate: String!
  }

  type PeerMetric {
    companyName: String!
    symbol: String!
    marketCap: Float
    pe: Float
    roe: Float
    debtToEquity: Float
    revenueCagr: Float
  }

  # ============================================
  # SCREENER TYPES
  # ============================================

  type StockSummary {
    symbol: String!
    name: String!
    sector: String!
    cmp: Float!
    marketCap: Float!
    qualityScore: Int!
    growthScore: Int!
    riskScore: Int!
    momentumScore: Int!
    sentimentScore: Int!
  }

  input ScreenerInput {
    marketCapMin: Float
    marketCapMax: Float
    sectorIds: [ID!]
    qualityScoreMin: Int
    growthScoreMin: Int
    riskScoreMax: Int
    roeMin: Float
    debtToEquityMax: Float
    promoterHoldingMin: Float
    sortBy: String
    sortOrder: String
    limit: Int
    offset: Int
  }

  # ============================================
  # SECTOR & MARKET TYPES
  # ============================================

  type SectorDetail {
    id: ID!
    name: String!
    slug: String!
    overview: String
    topPerformers: [StockSummary!]!
    avgQualityScore: Float
    avgGrowthScore: Float
    companies: [StockSummary!]!
  }

  type MarketTrends {
    nifty50: IndexData!
    sensex: IndexData!
    topGainers: [StockSummary!]!
    topLosers: [StockSummary!]!
    mostActive: [StockSummary!]!
    sectorPerformance: [SectorPerformance!]!
  }

  type IndexData {
    value: Float!
    change: Float!
    changePct: Float!
  }

  type SectorPerformance {
    sectorName: String!
    changePct: Float!
  }

  # ============================================
  # USER & PORTFOLIO TYPES
  # ============================================

  type PortfolioDetail {
    holdings: [PortfolioHolding!]!
    totalValue: Float!
    totalInvested: Float!
    unrealizedPnl: Float!
    unrealizedPnlPct: Float!
  }

  type PortfolioHolding {
    company: CompanyInfo!
    quantity: Int!
    avgPrice: Float!
    currentPrice: Float!
    currentValue: Float!
    unrealizedPnl: Float!
    unrealizedPnlPct: Float!
  }

  type Watchlist {
    id: ID!
    name: String!
    companies: [StockSummary!]!
    createdAt: String!
    updatedAt: String!
  }

  type Alert {
    id: ID!
    company: CompanyInfo!
    conditionType: String!
    threshold: Float!
    isActive: Boolean!
    lastTriggeredAt: String
    createdAt: String!
  }

  # ============================================
  # AUTH TYPES
  # ============================================

  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
  }

  type User {
    id: ID!
    email: String!
    name: String
    tier: String!
    createdAt: String!
  }

  # ============================================
  # INPUT TYPES
  # ============================================

  input CreateWatchlistInput {
    name: String!
    companyIds: [ID!]!
  }

  input UpdateWatchlistInput {
    name: String
    companyIds: [ID!]
  }

  input CreateAlertInput {
    companyId: ID!
    conditionType: String!
    threshold: Float!
  }

  input UpdateAlertInput {
    threshold: Float
    isActive: Boolean
  }

  input AddToPortfolioInput {
    companyId: ID!
    quantity: Int!
    avgPrice: Float!
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  # ============================================
  # QUERIES & MUTATIONS
  # ============================================

  scalar JSON

  type SearchResult {
    id: ID!
    nseSymbol: String
    bseCode: String
    companyName: String!
    shortName: String!
    sector: String!
    marketCapCategory: String!
    matchType: String!
  }

  type Query {
    # Health & Info
    health: String!
    version: String!

    # Stock Queries
    stock(symbol: String!): StockDetail
    searchStocks(query: String!, limit: Int): [SearchResult!]!
    screener(filters: ScreenerInput!): [StockSummary!]!
    companyEvents(symbol: String!, startDate: String, endDate: String, isVerified: Boolean): [StockEvent!]!

    # Sector & Market
    sectorOverview(sectorId: ID!): SectorDetail
    marketTrends: MarketTrends

    # User-specific (authenticated)
    portfolio: PortfolioDetail
    watchlists: [Watchlist!]!

    # Legacy Company queries (keep for backward compatibility)
    companies(limit: Int): [Company!]!
    company(nseSymbol: String!): Company
    companyById(id: ID!): Company
    sectors: [Sector!]!
    sector(slug: String!): Sector
    topQualityCompanies(limit: Int): [Company!]!
    topGrowthCompanies(limit: Int): [Company!]!
    recentNews(limit: Int): [NewsArticle!]!
  }

  type Mutation {
    # Watchlist mutations
    createWatchlist(input: CreateWatchlistInput!): Watchlist!
    updateWatchlist(id: ID!, input: UpdateWatchlistInput!): Watchlist!
    deleteWatchlist(id: ID!): Boolean!

    # Alert mutations
    createAlert(input: CreateAlertInput!): Alert!
    updateAlert(id: ID!, input: UpdateAlertInput!): Alert!
    deleteAlert(id: ID!): Boolean!

    # Portfolio mutations
    addToPortfolio(input: AddToPortfolioInput!): PortfolioHolding!
    removeFromPortfolio(companyId: ID!): Boolean!

    # Auth mutations
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(refreshToken: String!): AuthPayload!

    # Legacy
    ping: String!
  }
`;

// Merge type definitions
const typeDefs = [
  baseTypeDefs,
  reportsTypeDefs,
  generatedReportsTypeDefs,
  stockRepositoryTypeDefs,
];

// GraphQL Resolvers
const resolvers = {
  JSON: JSONScalar,

  Query: {
    health: () => 'OK',
    version: () => '1.0.0',

    // ============================================
    // REPORTS QUERIES
    // ============================================
    ...reportsQueryResolvers,

    // ============================================
    // GENERATED REPORTS QUERIES
    // ============================================
    ...generatedReportsQueryResolvers,

    // ============================================
    // STOCK REPOSITORY QUERIES
    // ============================================
    ...stockRepositoryQueryResolvers,

    // ============================================
    // MAIN STOCK QUERY
    // ============================================
    stock: async (_: any, { symbol }: { symbol: string }) => {
      const company = await prisma.company.findUnique({
        where: { nseSymbol: symbol },
        include: {
          sector: true,
          industry: true,
        },
      });

      if (!company) {
        throw new GraphQLError('Stock not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return { symbol, company };
    },

    // ============================================
    // COMPANY EVENTS QUERY
    // ============================================
    companyEvents: async (
      _: any,
      {
        symbol,
        startDate,
        endDate,
        isVerified,
      }: { symbol: string; startDate?: string; endDate?: string; isVerified?: boolean }
    ) => {
      // First, find the company by symbol
      const company = await prisma.company.findUnique({
        where: { nseSymbol: symbol },
      });

      if (!company) {
        throw new GraphQLError('Company not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Build where clause for events
      const where: any = {
        companyId: company.id,
      };

      // Add date range filters if provided
      if (startDate || endDate) {
        where.eventDate = {};
        if (startDate) {
          where.eventDate.gte = new Date(startDate);
        }
        if (endDate) {
          where.eventDate.lte = new Date(endDate);
        }
      }

      // Add verification filter if provided
      if (isVerified !== undefined) {
        where.isVerified = isVerified;
      }

      // Fetch events
      const events = await prisma.stockEvent.findMany({
        where,
        orderBy: {
          eventDate: 'desc',
        },
        take: 100, // Limit to 100 events
      });

      return events;
    },

    // ============================================
    // SEARCH STOCKS QUERY
    // ============================================
    searchStocks: async (_: any, { query, limit = 8 }: { query: string; limit?: number }) => {
      if (!query || query.length < 2) {
        return [];
      }

      const searchTerm = query.trim().toLowerCase();

      // Search with case-insensitive LIKE on multiple fields
      const companies = await prisma.company.findMany({
        where: {
          isActive: true,
          OR: [
            { nseSymbol: { contains: searchTerm, mode: 'insensitive' } },
            { bseCode: { contains: searchTerm, mode: 'insensitive' } },
            { companyName: { contains: searchTerm, mode: 'insensitive' } },
            { shortName: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        include: {
          sector: true,
        },
        take: 50, // Get more for sorting
      });

      // Score and sort results
      const scoredResults = companies.map(company => {
        let matchType = 'contains';
        let score = 1;

        // Check for exact matches (highest priority)
        if (company.nseSymbol?.toLowerCase() === searchTerm) {
          matchType = 'exact';
          score = 100;
        } else if (company.bseCode?.toLowerCase() === searchTerm) {
          matchType = 'exact';
          score = 99;
        } else if (company.shortName.toLowerCase() === searchTerm) {
          matchType = 'exact';
          score = 98;
        }
        // Check for prefix matches (medium priority)
        else if (company.nseSymbol?.toLowerCase().startsWith(searchTerm)) {
          matchType = 'prefix';
          score = 50;
        } else if (company.bseCode?.toLowerCase().startsWith(searchTerm)) {
          matchType = 'prefix';
          score = 49;
        } else if (company.shortName.toLowerCase().startsWith(searchTerm)) {
          matchType = 'prefix';
          score = 48;
        } else if (company.companyName.toLowerCase().startsWith(searchTerm)) {
          matchType = 'prefix';
          score = 47;
        }
        // Contains matches (lowest priority)
        else if (company.nseSymbol?.toLowerCase().includes(searchTerm)) {
          matchType = 'contains';
          score = 10;
        } else if (company.companyName.toLowerCase().includes(searchTerm)) {
          matchType = 'contains';
          score = 9;
        }

        return {
          id: company.id,
          nseSymbol: company.nseSymbol,
          bseCode: company.bseCode,
          companyName: company.companyName,
          shortName: company.shortName,
          sector: company.sector.name,
          marketCapCategory: company.marketCapCategory,
          matchType,
          score,
        };
      });

      // Sort by score (descending) and return limited results
      return scoredResults
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },

    // ============================================
    // SCREENER QUERY
    // ============================================
    screener: async (_: any, { filters }: { filters: any }) => {
      const {
        marketCapMin,
        marketCapMax,
        sectorIds,
        qualityScoreMin,
        growthScoreMin,
        riskScoreMax,
        roeMin,
        debtToEquityMax,
        promoterHoldingMin,
        sortBy = 'qualityScore',
        sortOrder = 'desc',
        limit = 50,
        offset = 0,
      } = filters;

      // Build where clause
      const where: any = { isActive: true };

      if (sectorIds && sectorIds.length > 0) {
        where.sectorId = { in: sectorIds };
      }

      // Get companies with latest scores
      const companies = await prisma.company.findMany({
        where,
        include: {
          sector: true,
          compositeScores: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
        take: limit * 2, // Get more than needed for filtering
      });

      // Filter by scores and ratios
      const filtered = companies.filter(c => {
        const score = c.compositeScores[0];
        if (!score) return false;

        if (qualityScoreMin && score.qualityScore < qualityScoreMin) return false;
        if (growthScoreMin && score.growthScore < growthScoreMin) return false;
        if (riskScoreMax && score.riskScore > riskScoreMax) return false;

        return true;
      });

      // Sort
      filtered.sort((a, b) => {
        const aScore = a.compositeScores[0];
        const bScore = b.compositeScores[0];
        const field = sortBy as keyof typeof aScore;
        const aVal = aScore[field] as number;
        const bVal = bScore[field] as number;
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });

      // Paginate
      const paginated = filtered.slice(offset, offset + limit);

      return paginated.map(c => ({
        symbol: c.nseSymbol,
        name: c.shortName,
        sector: c.sector.name,
        cmp: 0, // TODO: Get from price data
        marketCap: 0, // TODO: Calculate
        qualityScore: c.compositeScores[0].qualityScore,
        growthScore: c.compositeScores[0].growthScore,
        riskScore: c.compositeScores[0].riskScore,
        momentumScore: c.compositeScores[0].momentumScore,
        sentimentScore: c.compositeScores[0].sentimentScore,
      }));
    },

    // ============================================
    // SECTOR OVERVIEW
    // ============================================
    sectorOverview: async (_: any, { sectorId }: { sectorId: string }) => {
      const sector = await prisma.sector.findUnique({
        where: { id: sectorId },
        include: {
          companies: {
            where: { isActive: true },
            include: {
              compositeScores: {
                orderBy: { date: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      if (!sector) {
        throw new GraphQLError('Sector not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return sector;
    },

    // ============================================
    // MARKET TRENDS
    // ============================================
    marketTrends: async () => {
      // TODO: Implement with real market data
      return {
        nifty50: { value: 19500, change: 125, changePct: 0.65 },
        sensex: { value: 65500, change: 320, changePct: 0.49 },
        topGainers: [],
        topLosers: [],
        mostActive: [],
        sectorPerformance: [],
      };
    },

    // ============================================
    // PORTFOLIO (authenticated)
    // ============================================
    portfolio: async (_: any, __: any, context: any) => {
      const user = authenticateUser(context);

      const holdings = await prisma.userPortfolio.findMany({
        where: { userId: user.id },
        include: {
          company: {
            include: {
              sector: true,
              industry: true,
            },
          },
        },
      });

      return { holdings };
    },

    // ============================================
    // WATCHLISTS (authenticated)
    // ============================================
    watchlists: async (_: any, __: any, context: any) => {
      const user = authenticateUser(context);

      return await prisma.watchlist.findMany({
        where: { userId: user.id },
      });
    },

    // ============================================
    // LEGACY QUERIES (backward compatibility)
    // ============================================
    companies: async (_: any, { limit = 10 }: { limit?: number }) => {
      return await prisma.company.findMany({
        take: limit,
        where: { isActive: true },
        include: {
          sector: true,
          industry: true,
        },
      });
    },

    company: async (_: any, { nseSymbol }: { nseSymbol: string }) => {
      return await prisma.company.findUnique({
        where: { nseSymbol },
        include: {
          sector: true,
          industry: true,
          compositeScores: {
            orderBy: { date: 'desc' },
            take: 1,
          },
          financialResults: {
            orderBy: { publishedAt: 'desc' },
            take: 4,
          },
          technicalIndicators: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      });
    },

    companyById: async (_: any, { id }: { id: string }) => {
      return await prisma.company.findUnique({
        where: { id },
        include: {
          sector: true,
          industry: true,
        },
      });
    },

    sectors: async () => {
      return await prisma.sector.findMany({
        include: {
          _count: {
            select: { companies: true },
          },
        },
      });
    },

    sector: async (_: any, { slug }: { slug: string }) => {
      return await prisma.sector.findUnique({
        where: { slug },
        include: {
          companies: {
            where: { isActive: true },
            take: 10,
          },
        },
      });
    },

    topQualityCompanies: async (_: any, { limit = 10 }: { limit?: number }) => {
      const scores = await prisma.compositeScore.findMany({
        orderBy: { qualityScore: 'desc' },
        take: limit,
        include: {
          company: {
            include: {
              sector: true,
              industry: true,
            },
          },
        },
      });
      return scores.map(s => ({
        ...s.company,
        compositeScores: [s],
      }));
    },

    topGrowthCompanies: async (_: any, { limit = 10 }: { limit?: number }) => {
      const scores = await prisma.compositeScore.findMany({
        orderBy: { growthScore: 'desc' },
        take: limit,
        include: {
          company: {
            include: {
              sector: true,
              industry: true,
            },
          },
        },
      });
      return scores.map(s => ({
        ...s.company,
        compositeScores: [s],
      }));
    },

    recentNews: async (_: any, { limit = 10 }: { limit?: number }) => {
      return await prisma.newsArticle.findMany({
        orderBy: { publishedAt: 'desc' },
        take: limit,
      });
    },
  },

  // ============================================
  // MUTATIONS
  // ============================================
  Mutation: {
    // ============================================
    // REPORTS MUTATIONS
    // ============================================
    ...reportsMutationResolvers,

    // ============================================
    // GENERATED REPORTS MUTATIONS
    // ============================================
    ...generatedReportsMutationResolvers,

    // ============================================
    // STOCK REPOSITORY MUTATIONS
    // ============================================
    ...stockRepositoryMutationResolvers,

    // Watchlist mutations
    createWatchlist: async (_: any, { input }: any, context: any) => {
      const user = authenticateUser(context);
      return await prisma.watchlist.create({
        data: {
          userId: user.id,
          name: input.name,
          companyIds: input.companyIds,
        },
      });
    },

    updateWatchlist: async (_: any, { id, input }: any, context: any) => {
      const user = authenticateUser(context);
      return await prisma.watchlist.update({
        where: { id, userId: user.id },
        data: input,
      });
    },

    deleteWatchlist: async (_: any, { id }: any, context: any) => {
      const user = authenticateUser(context);
      await prisma.watchlist.delete({
        where: { id, userId: user.id },
      });
      return true;
    },

    // Alert mutations
    createAlert: async (_: any, { input }: any, context: any) => {
      const user = authenticateUser(context);
      return await prisma.alert.create({
        data: {
          userId: user.id,
          ...input,
        },
        include: {
          company: true,
        },
      });
    },

    updateAlert: async (_: any, { id, input }: any, context: any) => {
      const user = authenticateUser(context);
      return await prisma.alert.update({
        where: { id, userId: user.id },
        data: input,
        include: {
          company: true,
        },
      });
    },

    deleteAlert: async (_: any, { id }: any, context: any) => {
      const user = authenticateUser(context);
      await prisma.alert.delete({
        where: { id, userId: user.id },
      });
      return true;
    },

    // Portfolio mutations
    addToPortfolio: async (_: any, { input }: any, context: any) => {
      const user = authenticateUser(context);
      const holding = await prisma.userPortfolio.upsert({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId: input.companyId,
          },
        },
        create: {
          userId: user.id,
          companyId: input.companyId,
          quantity: input.quantity,
          avgPrice: input.avgPrice,
        },
        update: {
          quantity: { increment: input.quantity },
        },
        include: {
          company: true,
        },
      });
      return holding;
    },

    removeFromPortfolio: async (_: any, { companyId }: any, context: any) => {
      const user = authenticateUser(context);
      await prisma.userPortfolio.delete({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId,
          },
        },
      });
      return true;
    },

    // Auth mutations
    register: async (_: any, { input }: any, context: any) => {
      const { email, password, name } = input;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new GraphQLError('Email already registered', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, passwordHash, name },
      });

      const tokens = generateTokens(context.fastify, user.id);
      return { ...tokens, user };
    },

    login: async (_: any, { input }: any, context: any) => {
      const { email, password } = input;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const tokens = generateTokens(context.fastify, user.id);
      return { ...tokens, user };
    },

    refreshToken: async (_: any, { refreshToken }: any, context: any) => {
      try {
        const decoded: any = context.fastify.jwt.verify(refreshToken);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        const tokens = generateTokens(context.fastify, user.id);
        return { ...tokens, user };
      } catch (error) {
        throw new GraphQLError('Invalid refresh token', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
    },

    ping: () => 'pong',
  },

  // ============================================
  // FIELD RESOLVERS
  // ============================================

  StockDetail: {
    company: (parent: any) => ({
      name: parent.company.companyName,
      shortName: parent.company.shortName,
      sector: parent.company.sector.name,
      industry: parent.company.industry.name,
      isin: parent.company.isin,
      marketCapCategory: parent.company.marketCapCategory,
      listingDate: parent.company.listingDate?.toISOString(),
    }),

    priceData: async (parent: any) => {
      // TODO: Get from price_data table (TimescaleDB)
      return {
        current: 2850.50,
        changePct: 1.25,
        dayHigh: 2875.00,
        dayLow: 2830.00,
        week52High: 3200.00,
        week52Low: 2100.00,
        volume: 1250000,
        marketCap: 45000000000,
        timestamp: new Date().toISOString(),
      };
    },

    historicalPrices: async (parent: any, { period }: any) => {
      // TODO: Query price_data table based on period
      return [];
    },

    aiSummary: async (parent: any) => {
      const summaries = await prisma.aiSummary.findMany({
        where: { companyId: parent.company.id },
        orderBy: { generatedAt: 'desc' },
      });

      const summaryMap = new Map(summaries.map(s => [s.summaryType, s]));

      return {
        businessOverview: summaryMap.get('BUSINESS_OVERVIEW')?.content,
        currentThesis: summaryMap.get('CURRENT_THESIS')?.content,
        bullCase: summaryMap.get('BULL_CASE')?.content,
        bearCase: summaryMap.get('BEAR_CASE')?.content,
        keyRisks: [], // Extract from RISK_ASSESSMENT
        tailwinds: [],
        confidence: summaries[0]?.confidence || 'MEDIUM',
        generatedAt: summaries[0]?.generatedAt.toISOString() || new Date().toISOString(),
        dataFreshnessNote: summaries[0]?.dataFreshnessNote,
      };
    },

    fundamentals: async (parent: any) => {
      const [financials, balanceSheet, cashflow] = await Promise.all([
        prisma.financialResult.findMany({
          where: { companyId: parent.company.id },
          orderBy: { publishedAt: 'desc' },
          take: 5,
        }),
        prisma.balanceSheetData.findFirst({
          where: { companyId: parent.company.id },
          orderBy: { fiscalYear: 'desc' },
        }),
        prisma.cashflowData.findFirst({
          where: { companyId: parent.company.id },
          orderBy: { fiscalYear: 'desc' },
        }),
      ]);

      // TODO: Calculate CAGRs and ratios
      return {
        revenueCagr3y: null,
        revenueCagr5y: null,
        profitCagr5y: null,
        roe: null,
        roce: null,
        operatingMargin: financials[0]?.operatingMargin ? parseFloat(financials[0].operatingMargin.toString()) : null,
        netMargin: financials[0]?.netMargin ? parseFloat(financials[0].netMargin.toString()) : null,
        debtToEquity: balanceSheet?.debtToEquity ? parseFloat(balanceSheet.debtToEquity.toString()) : null,
        interestCoverage: balanceSheet?.interestCoverage ? parseFloat(balanceSheet.interestCoverage.toString()) : null,
        currentRatio: balanceSheet?.currentRatio ? parseFloat(balanceSheet.currentRatio.toString()) : null,
        cashPctOfMcap: null,
        fcfYield: null,
        ocfToPatRatio: null,
      };
    },

    technicals: async (parent: any) => {
      const indicator = await prisma.technicalIndicator.findFirst({
        where: { companyId: parent.company.id },
        orderBy: { date: 'desc' },
      });

      if (!indicator) return null;

      const currentPrice = 2850.50; // TODO: Get from price data

      return {
        trendStatus: 'UPTREND', // TODO: Calculate based on SMAs
        sma20: indicator.sma20 ? {
          value: parseFloat(indicator.sma20.toString()),
          distancePct: ((currentPrice - parseFloat(indicator.sma20.toString())) / parseFloat(indicator.sma20.toString())) * 100,
        } : null,
        sma50: indicator.sma50 ? {
          value: parseFloat(indicator.sma50.toString()),
          distancePct: ((currentPrice - parseFloat(indicator.sma50.toString())) / parseFloat(indicator.sma50.toString())) * 100,
        } : null,
        sma100: indicator.sma100 ? {
          value: parseFloat(indicator.sma100.toString()),
          distancePct: ((currentPrice - parseFloat(indicator.sma100.toString())) / parseFloat(indicator.sma100.toString())) * 100,
        } : null,
        sma200: indicator.sma200 ? {
          value: parseFloat(indicator.sma200.toString()),
          distancePct: ((currentPrice - parseFloat(indicator.sma200.toString())) / parseFloat(indicator.sma200.toString())) * 100,
        } : null,
        rsi14: indicator.rsi14 ? parseFloat(indicator.rsi14.toString()) : null,
        macd: indicator.macd ? {
          value: parseFloat(indicator.macd.toString()),
          signal: indicator.macdSignal ? parseFloat(indicator.macdSignal.toString()) : 0,
          histogram: indicator.macdHistogram ? parseFloat(indicator.macdHistogram.toString()) : 0,
        } : null,
        adx: indicator.adx ? parseFloat(indicator.adx.toString()) : null,
        breakoutSignals: [],
        momentumScore: null,
      };
    },

    newsSentiment: async (parent: any) => {
      const [news, sentiments] = await Promise.all([
        prisma.newsArticle.findMany({
          where: { companyId: parent.company.id },
          orderBy: { publishedAt: 'desc' },
          take: 10,
        }),
        prisma.sentimentSnapshot.findMany({
          where: { companyId: parent.company.id },
          orderBy: { date: 'desc' },
          take: 30,
        }),
      ]);

      return {
        newsDigest: news.map(n => ({
          title: n.title,
          source: n.source,
          publishedAt: n.publishedAt.toISOString(),
          sentiment: n.sentimentLabel || 'NEUTRAL',
          impact: n.impactRating || 'MEDIUM',
          url: n.url,
        })),
        sentimentTimeline: sentiments.map(s => ({
          date: s.date.toISOString(),
          sentiment: s.compositeSentiment ? parseFloat(s.compositeSentiment.toString()) : 0,
        })),
        riskAlerts: [],
        sectorCorrelation: null,
      };
    },

    tailwinds: async (parent: any) => {
      // TODO: Implement tailwinds analysis
      return {
        policies: [],
        sectorMomentum: null,
        commodityCorrelations: [],
        macroFactors: [],
      };
    },

    riskDashboard: async (parent: any) => {
      const flags = await prisma.riskFlag.findMany({
        where: {
          companyId: parent.company.id,
          isActive: true,
        },
        orderBy: { detectedAt: 'desc' },
      });

      return {
        flags: flags.map(f => ({
          type: f.flagType,
          severity: f.severity,
          description: f.description,
          detectedAt: f.detectedAt.toISOString(),
        })),
        earningsQualityScore: null,
        governanceRiskScore: null,
        volatilityMetrics: null,
      };
    },

    scores: async (parent: any) => {
      const score = await prisma.compositeScore.findFirst({
        where: { companyId: parent.company.id },
        orderBy: { date: 'desc' },
      });

      if (!score) return null;

      const breakdown = score.factorBreakdown as any;

      return {
        quality: {
          value: score.qualityScore,
          factorBreakdown: breakdown.quality || [],
        },
        growth: {
          value: score.growthScore,
          factorBreakdown: breakdown.growth || [],
        },
        risk: {
          value: score.riskScore,
          factorBreakdown: breakdown.risk || [],
        },
        sentiment: {
          value: score.sentimentScore,
          factorBreakdown: breakdown.sentiment || [],
        },
        momentum: {
          value: score.momentumScore,
          factorBreakdown: breakdown.momentum || [],
        },
      };
    },

    shareholding: async (parent: any) => {
      const patterns = await prisma.shareholdingPattern.findMany({
        where: { companyId: parent.company.id },
        orderBy: { quarter: 'desc' },
        take: 9,
      });

      if (patterns.length === 0) return null;

      const mapPattern = (p: any) => ({
        quarter: p.quarter.toISOString().split('T')[0],
        promoterPct: parseFloat(p.promoterHoldingPct.toString()),
        fiiPct: parseFloat(p.fiiHoldingPct.toString()),
        diiPct: parseFloat(p.diiHoldingPct.toString()),
        publicPct: parseFloat(p.publicHoldingPct.toString()),
        pledgePct: p.pledgePct ? parseFloat(p.pledgePct.toString()) : null,
      });

      return {
        current: mapPattern(patterns[0]),
        history: patterns.slice(1).map(mapPattern),
      };
    },

    insiderTransactions: async (parent: any) => {
      const transactions = await prisma.insiderTransaction.findMany({
        where: { companyId: parent.company.id },
        orderBy: { filingDate: 'desc' },
        take: 20,
      });

      return transactions.map(t => ({
        personName: t.personName,
        personCategory: t.personCategory,
        transactionType: t.transactionType,
        quantity: parseFloat(t.quantity.toString()),
        price: parseFloat(t.price.toString()),
        value: parseFloat(t.value.toString()),
        filingDate: t.filingDate.toISOString().split('T')[0],
      }));
    },

    peerComparison: async (parent: any) => {
      // TODO: Get peer companies and compare metrics
      return [];
    },
  },

  SectorDetail: {
    overview: () => null,
    topPerformers: () => [],
    avgQualityScore: () => null,
    avgGrowthScore: () => null,
    companies: (parent: any) => {
      return parent.companies.map((c: any) => ({
        symbol: c.nseSymbol,
        name: c.shortName,
        sector: parent.name,
        cmp: 0,
        marketCap: 0,
        qualityScore: c.compositeScores[0]?.qualityScore || 0,
        growthScore: c.compositeScores[0]?.growthScore || 0,
        riskScore: c.compositeScores[0]?.riskScore || 0,
        momentumScore: c.compositeScores[0]?.momentumScore || 0,
        sentimentScore: c.compositeScores[0]?.sentimentScore || 0,
      }));
    },
  },

  PortfolioDetail: {
    holdings: async (parent: any) => {
      return parent.holdings.map((h: any) => ({
        company: {
          name: h.company.companyName,
          shortName: h.company.shortName,
          sector: h.company.sector.name,
          industry: h.company.industry.name,
          isin: h.company.isin,
          marketCapCategory: h.company.marketCapCategory,
          listingDate: h.company.listingDate?.toISOString(),
        },
        quantity: h.quantity,
        avgPrice: parseFloat(h.avgPrice.toString()),
        currentPrice: 0, // TODO: Get from price data
        currentValue: h.currentValue ? parseFloat(h.currentValue.toString()) : 0,
        unrealizedPnl: h.unrealizedPnl ? parseFloat(h.unrealizedPnl.toString()) : 0,
        unrealizedPnlPct: 0,
      }));
    },
    totalValue: (parent: any) => {
      return parent.holdings.reduce((sum: number, h: any) => {
        return sum + (h.currentValue ? parseFloat(h.currentValue.toString()) : 0);
      }, 0);
    },
    totalInvested: (parent: any) => {
      return parent.holdings.reduce((sum: number, h: any) => {
        return sum + (h.quantity * parseFloat(h.avgPrice.toString()));
      }, 0);
    },
    unrealizedPnl: (parent: any) => {
      return parent.holdings.reduce((sum: number, h: any) => {
        return sum + (h.unrealizedPnl ? parseFloat(h.unrealizedPnl.toString()) : 0);
      }, 0);
    },
    unrealizedPnlPct: (parent: any) => {
      const totalInvested = parent.holdings.reduce((sum: number, h: any) => {
        return sum + (h.quantity * parseFloat(h.avgPrice.toString()));
      }, 0);
      const totalPnl = parent.holdings.reduce((sum: number, h: any) => {
        return sum + (h.unrealizedPnl ? parseFloat(h.unrealizedPnl.toString()) : 0);
      }, 0);
      return totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
    },
  },

  Watchlist: {
    companies: async (parent: any) => {
      const companies = await prisma.company.findMany({
        where: { id: { in: parent.companyIds } },
        include: {
          sector: true,
          compositeScores: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      });

      return companies.map(c => ({
        symbol: c.nseSymbol,
        name: c.shortName,
        sector: c.sector.name,
        cmp: 0,
        marketCap: 0,
        qualityScore: c.compositeScores[0]?.qualityScore || 0,
        growthScore: c.compositeScores[0]?.growthScore || 0,
        riskScore: c.compositeScores[0]?.riskScore || 0,
        momentumScore: c.compositeScores[0]?.momentumScore || 0,
        sentimentScore: c.compositeScores[0]?.sentimentScore || 0,
      }));
    },
    createdAt: (parent: any) => parent.createdAt.toISOString(),
    updatedAt: (parent: any) => parent.updatedAt.toISOString(),
  },

  Alert: {
    company: async (parent: any) => {
      const company = await prisma.company.findUnique({
        where: { id: parent.companyId },
        include: { sector: true, industry: true },
      });
      return company ? {
        name: company.companyName,
        shortName: company.shortName,
        sector: company.sector.name,
        industry: company.industry.name,
        isin: company.isin,
        marketCapCategory: company.marketCapCategory,
        listingDate: company.listingDate?.toISOString(),
      } : null;
    },
    threshold: (parent: any) => parseFloat(parent.threshold.toString()),
    lastTriggeredAt: (parent: any) => parent.lastTriggeredAt?.toISOString(),
    createdAt: (parent: any) => parent.createdAt.toISOString(),
  },

  User: {
    createdAt: (parent: any) => parent.createdAt.toISOString(),
  },

  // Legacy field resolvers
  CompositeScore: {
    date: (parent: any) => parent.date.toISOString(),
    computedAt: (parent: any) => parent.computedAt.toISOString(),
  },

  FinancialResult: {
    revenue: (parent: any) => parent.revenue ? parseFloat(parent.revenue) : null,
    operatingProfit: (parent: any) => parent.operatingProfit ? parseFloat(parent.operatingProfit) : null,
    netProfit: (parent: any) => parent.netProfit ? parseFloat(parent.netProfit) : null,
    eps: (parent: any) => parent.eps ? parseFloat(parent.eps) : null,
    operatingMargin: (parent: any) => parent.operatingMargin ? parseFloat(parent.operatingMargin) : null,
    netMargin: (parent: any) => parent.netMargin ? parseFloat(parent.netMargin) : null,
    publishedAt: (parent: any) => parent.publishedAt.toISOString(),
  },

  TechnicalIndicator: {
    date: (parent: any) => parent.date.toISOString(),
    rsi14: (parent: any) => parent.rsi14 ? parseFloat(parent.rsi14) : null,
    macd: (parent: any) => parent.macd ? parseFloat(parent.macd) : null,
    macdSignal: (parent: any) => parent.macdSignal ? parseFloat(parent.macdSignal) : null,
    macdHistogram: (parent: any) => parent.macdHistogram ? parseFloat(parent.macdHistogram) : null,
    sma20: (parent: any) => parent.sma20 ? parseFloat(parent.sma20) : null,
    sma50: (parent: any) => parent.sma50 ? parseFloat(parent.sma50) : null,
    sma100: (parent: any) => parent.sma100 ? parseFloat(parent.sma100) : null,
    sma200: (parent: any) => parent.sma200 ? parseFloat(parent.sma200) : null,
    adx: (parent: any) => parent.adx ? parseFloat(parent.adx) : null,
  },

  NewsArticle: {
    publishedAt: (parent: any) => parent.publishedAt.toISOString(),
  },

  // ============================================
  // REPORTS FIELD RESOLVERS
  // ============================================
  ...reportsFieldResolvers,

  // ============================================
  // GENERATED REPORTS FIELD RESOLVERS
  // ============================================
  ...generatedReportsFieldResolvers,

  // ============================================
  // STOCK REPOSITORY FIELD RESOLVERS
  // ============================================
  ...stockRepositoryFieldResolvers,
};

async function main() {
  const fastify = Fastify({
    logger: logger as any, // Use our custom pino logger
    disableRequestLogging: true, // We'll handle request logging manually
  });

  // Setup Fastify error handler
  setupFastifyErrorHandler(fastify);

  // Add request timing and logging hook
  fastify.addHook('onRequest', async (request, reply) => {
    (request as any).startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const duration = Date.now() - ((request as any).startTime || Date.now());
    logHttpRequest(request, reply, duration);
  });

  // Register plugins
  await fastify.register(cors, {
    origin: (origin, callback) => {
      // In development, allow all localhost ports
      if (!origin || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
  });

  // Setup authentication decorator
  setupAuth(fastify);

  // Rate limiting setup
  await setupRateLimiting(fastify);

  // Setup metrics tracking hooks
  setupMetricsHooks(fastify);

  // Apollo Server setup
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [cachePlugin, graphqlMetricsPlugin, graphqlLoggingPlugin],
  });

  await apollo.start();
  await fastify.register(fastifyApollo(apollo), {
    path: '/graphql',
    context: async (request: any) => {
      const loaders = createLoaders();
      let user = null;

      // Try to extract user from JWT token
      try {
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const decoded: any = fastify.jwt.verify(token);
          user = await prisma.user.findUnique({
            where: { id: decoded.userId },
          });
        }
      } catch (error) {
        // Invalid token, continue without user
      }

      return {
        fastify,
        loaders,
        user,
      };
    },
  });

  // WebSocket Server setup with real-time price updates and alerts
  const wsServer = new WebSocketServer(fastify);
  fastify.log.info('✅ WebSocket server initialized');

  // Start mock price simulator in development
  if (process.env.MOCK_PRICES === 'true') {
    await startMockPriceSimulator();
    fastify.log.info('✅ Mock price simulator started');
  }

  // Register auth routes
  await fastify.register(authRoutes);

  // Register billing routes
  await fastify.register(billingRoutes);

  // Register SEO routes
  await fastify.register(seoRoutes);

  // Register analytics routes
  await fastify.register(analyticsRoutes);

  // Register health check routes
  await fastify.register(healthRoutes);

  // Register metrics routes
  await fastify.register(metricsRoutes);

  // Register admin routes
  await fastify.register(adminRoutes);

  // Register reports routes
  await fastify.register(reportRoutes);

  // Register newsletter routes
  await fastify.register(newsletterRoutes);

  // Register stock repository routes
  await fastify.register(stockRepositoryRoutes);

  // Register stock routes
  await fastify.register(stockRoutes);

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`🚀 API Server ready at http://${HOST}:${PORT}`);
    fastify.log.info(`📊 GraphQL endpoint: http://${HOST}:${PORT}/graphql`);
    fastify.log.info(`🔌 WebSocket ready at ws://${HOST}:${PORT}`);

    // Start cache warming
    scheduleCacheWarming();
    fastify.log.info(`🔥 Cache warming scheduled`);

    // Start materialized view refresh
    scheduleMaterializedViewRefresh();
    fastify.log.info(`🔄 Materialized view refresh scheduled`);

    // Start alert monitoring
    startAlertMonitoring();
    fastify.log.info(`🚨 Alert monitoring started`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
