import { PrismaClient } from '@prisma/client';
import { generateTimeline } from './timelineGenerator';
import { calculateMoatScore } from './moatAnalyzer';
import { validateReportData } from './dataValidator';
import { trackDataSourcesBulk, DataSourceName } from './dataSourceTracker';

const prisma = new PrismaClient();

export interface AggregatedReportData {
  company: any;
  timeline: any[];
  businessModel: any;
  financials: any;
  moat: any;
  supplyChain: any;
  catalysts: any;
  govtImpact: any;
  globalTrade: any;
  risks: any;
  aiSummary: any;
  metadata?: any; // Validation and other metadata
}

/**
 * Aggregates all data needed for comprehensive stock report
 * Fetches from multiple tables in parallel for performance
 */
export async function aggregateReportData(
  symbol: string
): Promise<AggregatedReportData> {
  // 1. Get company
  const company = await prisma.company.findUnique({
    where: { nseSymbol: symbol },
    include: {
      sector: true,
      industry: true,
    },
  });

  if (!company) {
    throw new Error(`Company not found: ${symbol}`);
  }

  // 2. Fetch all data in parallel
  const [
    events,
    milestones,
    financials,
    balanceSheets,
    cashflows,
    compositeScores,
    technicals,
    riskFlags,
    news,
    sentiment,
    shareholding,
    insiderTx,
    aiSummaries,
    companyProfiles,
  ] = await Promise.all([
    prisma.stockEvent.findMany({
      where: { companyId: company.id },
      orderBy: { eventDate: 'desc' },
      take: 50,
    }),
    prisma.stockMilestone.findMany({
      where: { companyId: company.id },
      orderBy: { date: 'desc' },
      take: 20,
    }),
    prisma.financialResult.findMany({
      where: { companyId: company.id },
      orderBy: { fiscalYear: 'desc' },
      take: 20, // 5 years quarterly
    }),
    prisma.balanceSheetData.findMany({
      where: { companyId: company.id },
      orderBy: { fiscalYear: 'desc' },
      take: 5,
    }),
    prisma.cashflowData.findMany({
      where: { companyId: company.id },
      orderBy: { fiscalYear: 'desc' },
      take: 5,
    }),
    prisma.compositeScore.findMany({
      where: { companyId: company.id },
      orderBy: { date: 'desc' },
      take: 12, // 1 year monthly
    }),
    prisma.technicalIndicator.findFirst({
      where: { companyId: company.id },
      orderBy: { date: 'desc' },
    }),
    prisma.riskFlag.findMany({
      where: {
        companyId: company.id,
        resolvedAt: null, // Active risks only
      },
      orderBy: { detectedAt: 'desc' },
    }),
    prisma.newsArticle.findMany({
      where: { companyId: company.id },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    }),
    prisma.sentimentSnapshot.findMany({
      where: { companyId: company.id },
      orderBy: { date: 'desc' },
      take: 30,
    }),
    prisma.shareholdingPattern.findMany({
      where: { companyId: company.id },
      orderBy: { quarter: 'desc' },
      take: 8, // 2 years quarterly
    }),
    prisma.insiderTransaction.findMany({
      where: { companyId: company.id },
      orderBy: { filingDate: 'desc' },
      take: 20,
    }),
    prisma.aiSummary.findMany({
      where: { companyId: company.id },
      orderBy: { generatedAt: 'desc' },
      take: 3,
    }),
    prisma.companyProfile.findMany({
      where: { companyId: company.id },
    }),
  ]);

  // 2.5 Generate beautiful timeline with simple language
  const timelineEvents = await generateTimeline(symbol);

  // 2.6 Calculate competitive moat analysis
  const moatAnalysis = await calculateMoatScore(symbol);

  // 3. Transform and structure data
  const reportData = {
    company: {
      id: company.id,
      name: company.companyName,
      symbol: company.nseSymbol,
      sector: company.sector?.name,
      industry: company.industry?.name,
      marketCap: company.marketCapCategory,
      listingDate: company.listingDate,
      isActive: company.isActive,
      metadata: company.metadata,
    },

    timeline: timelineEvents,

    businessModel: {
      description: companyProfiles.find(p => p.sectionType === 'BUSINESS_MODEL')?.content || null,
      products: companyProfiles.find(p => p.sectionType === 'PRODUCTS_SERVICES')?.content || null,
      competitivePosition: companyProfiles.find(p => p.sectionType === 'COMPETITIVE_POSITION')?.content || null,
      sector: company.sector?.name || null,
      industry: company.industry?.name || null,
    },

    financials: {
      results: financials.slice(0, 20),
      balanceSheets: balanceSheets,
      cashflows: cashflows,
      summary: calculateFinancialSummary(financials),
    },

    moat: {
      analysis: moatAnalysis,
      competitiveAdvantages: companyProfiles.find(p => p.sectionType === 'COMPETITIVE_POSITION')?.content || null,
      managementTeam: companyProfiles.find(p => p.sectionType === 'MANAGEMENT_TEAM')?.content || null,
    },

    supplyChain: {
      // Sample data for RELIANCE (will be replaced with database data in future)
      suppliers: symbol === 'RELIANCE' ? [
        {
          category: 'Crude Oil & Raw Materials',
          suppliers: ['Saudi Aramco', 'ADNOC (UAE)', 'Russian oil companies', 'US shale producers'],
          details: 'Sources crude oil globally for refining operations',
        },
        {
          category: 'Technology & Equipment',
          suppliers: ['Siemens', 'ABB', 'Honeywell', 'Cisco', 'Samsung'],
          details: 'Network equipment, automation systems, and consumer electronics',
        },
        {
          category: 'Retail Merchandise',
          suppliers: ['1000+ Indian and global brands', 'FMCG manufacturers', 'Apparel brands'],
          details: 'Products sold through Reliance Retail stores',
        },
      ] : null,
      customers: symbol === 'RELIANCE' ? [
        {
          segment: 'B2B - Petrochemicals',
          customers: ['Plastic manufacturers', 'Textile companies', 'Paint manufacturers', 'Packaging companies'],
          revenue: '~40% of revenue',
        },
        {
          segment: 'B2C - Retail',
          customers: ['450 million+ consumers across India'],
          revenue: '~35% of revenue',
          details: 'Reliance Retail, JioMart, fashion & lifestyle brands',
        },
        {
          segment: 'B2C - Telecom',
          customers: ['450 million+ Jio subscribers'],
          revenue: '~20% of revenue',
          details: 'Mobile, broadband, and digital services',
        },
      ] : null,
      distribution: symbol === 'RELIANCE' ? [
        {
          channel: 'Retail Stores',
          reach: '18,000+ stores across 7,000+ cities',
          brands: 'Reliance Fresh, Reliance Digital, Reliance Trends, JioMart',
        },
        {
          channel: 'Petrol Pumps',
          reach: '1,400+ retail fuel stations nationwide',
          brands: 'Reliance Petrol Pumps',
        },
        {
          channel: 'Digital Platforms',
          reach: 'Pan-India through JioMart app and website',
          details: 'E-commerce and quick commerce delivery',
        },
        {
          channel: 'B2B Distribution',
          reach: 'Direct sales to industrial customers',
          details: 'Petrochemicals and refined products',
        },
      ] : null,
    },

    catalysts: {
      growth: companyProfiles.find(p => p.sectionType === 'GROWTH_DRIVERS')?.content || null,
      upcomingEvents: events.filter(e =>
        e.eventDate > new Date()
      ).slice(0, 5),
    },

    govtImpact: {
      // Note: This data would need to be enriched with specific government policy tracking
      policies: [],
      regulations: {},
    },

    globalTrade: {
      // Note: This data would need to be added to the database
      exports: null,
      imports: null,
      fxExposure: null,
    },

    risks: {
      activeFlags: riskFlags,
      riskScore: calculateRiskScore(riskFlags),
      keyRisks: companyProfiles.find(p => p.sectionType === 'KEY_RISKS')?.content || null,
    },

    aiSummary: {
      latestSummary: aiSummaries[0],
      bullCase: aiSummaries.find(s => s.summaryType === 'BULL_CASE')?.content,
      bearCase: aiSummaries.find(s => s.summaryType === 'BEAR_CASE')?.content,
      keyRisks: aiSummaries.find(s => s.summaryType === 'RISK_ASSESSMENT')?.content,
      businessOverview: aiSummaries.find(s => s.summaryType === 'BUSINESS_OVERVIEW')?.content,
    },
  };

  // 4. Validate report data
  try {
    const validation = await validateReportData(symbol, {
      ...reportData,
      financials: reportData.financials,
    });

    // Log validation result
    if (!validation.isValid) {
      console.warn(`⚠️  Report validation warnings for ${symbol}:`, {
        errors: validation.errors,
        warnings: validation.warnings,
        confidence: validation.confidence,
      });
    }

    // Add validation metadata to report
    reportData.metadata = {
      ...reportData.metadata,
      validation: {
        isValid: validation.isValid,
        confidence: validation.confidence,
        errors: validation.errors,
        warnings: validation.warnings,
        validatedAt: validation.validatedAt,
      },
    };
  } catch (error) {
    console.error(`❌ Report validation failed for ${symbol}:`, error);
    // Don't block report generation on validation failure
  }

  // 5. Track data sources for key fields
  try {
    const financialSummary = reportData.financials.summary;
    const sourcesToTrack = [];

    if (financialSummary) {
      if (financialSummary.revenueGrowth !== null) {
        sourcesToTrack.push({
          field: 'revenueGrowth',
          value: financialSummary.revenueGrowth,
          source: DataSourceName.CALCULATED,
          metadata: { calculatedFrom: 'quarterly financials' },
        });
      }

      if (financialSummary.profitGrowth !== null) {
        sourcesToTrack.push({
          field: 'profitGrowth',
          value: financialSummary.profitGrowth,
          source: DataSourceName.CALCULATED,
          metadata: { calculatedFrom: 'quarterly financials' },
        });
      }

      if (financialSummary.avgMargin !== null) {
        sourcesToTrack.push({
          field: 'avgMargin',
          value: financialSummary.avgMargin,
          source: DataSourceName.CALCULATED,
          metadata: { calculatedFrom: 'last 4 quarters' },
        });
      }
    }

    // Track moat analysis
    if (reportData.moat?.analysis) {
      sourcesToTrack.push({
        field: 'moatScore',
        value: reportData.moat.analysis.overallScore,
        source: DataSourceName.CALCULATED,
        metadata: { algorithm: 'weighted moat dimensions' },
      });
    }

    // Track risk score
    if (reportData.risks?.riskScore !== undefined) {
      sourcesToTrack.push({
        field: 'riskScore',
        value: reportData.risks.riskScore,
        source: DataSourceName.CALCULATED,
        metadata: { basedOn: 'active risk flags' },
      });
    }

    // Bulk track all sources
    if (sourcesToTrack.length > 0) {
      await trackDataSourcesBulk(symbol, sourcesToTrack);
    }
  } catch (error) {
    console.error(`❌ Failed to track data sources for ${symbol}:`, error);
    // Don't block report generation on tracking failure
  }

  return reportData;
}

function calculateFinancialSummary(financials: any[]) {
  if (!financials.length) return null;

  const latest = financials[0];
  const yearAgo = financials[4];

  return {
    revenueGrowth: yearAgo && latest.revenue && yearAgo.revenue
      ? ((Number(latest.revenue) - Number(yearAgo.revenue)) / Number(yearAgo.revenue)) * 100
      : null,
    profitGrowth: yearAgo && latest.netProfit && yearAgo.netProfit
      ? ((Number(latest.netProfit) - Number(yearAgo.netProfit)) / Number(yearAgo.netProfit)) * 100
      : null,
    avgMargin: financials
      .slice(0, 4)
      .reduce((sum, f) => sum + (Number(f.netMargin) || 0), 0) / 4,
  };
}

function calculateRiskScore(riskFlags: any[]): number {
  if (!riskFlags.length) return 0;

  const severityWeights: Record<string, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
  };

  const totalScore = riskFlags.reduce(
    (sum, flag) => sum + (severityWeights[flag.severity] || 0),
    0
  );

  return Math.min(100, (totalScore / riskFlags.length) * 25);
}
