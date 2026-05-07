/**
 * Timeline Generator Service
 *
 * Generates beautiful, easy-to-understand timeline events for stock reports
 * Pulls from multiple data sources and converts technical jargon to simple language
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TimelineEvent {
  date: string; // ISO date string "1975-08-15"
  year: number;
  title: string;
  description: string; // Simple, easy-to-understand explanation
  type: 'POSITIVE' | 'NEUTRAL' | 'IMPORTANT' | 'CHALLENGE';
  impact?: string; // "Revenue +45%", "Stock -20%", etc.
  category?: 'FOUNDING' | 'IPO' | 'EXPANSION' | 'PRODUCT_LAUNCH' | 'ACQUISITION' |
             'LEADERSHIP' | 'ACHIEVEMENT' | 'FINANCIAL' | 'CHALLENGE' | 'REGULATORY' | 'MILESTONE';
  metric?: {
    label: string;
    value: string;
  };
}

/**
 * Generate timeline events for a company
 */
export async function generateTimeline(symbol: string): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  // 1. Get company basic info
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

  // 2. Add founding event (if available)
  if (company.listingDate) {
    const listingYear = new Date(company.listingDate).getFullYear();
    events.push({
      date: company.listingDate.toISOString(),
      year: listingYear,
      title: 'Stock Listed on Stock Exchange',
      description: `${company.companyName} shares became available for public trading on NSE, allowing anyone to buy and own a part of the company.`,
      type: 'IMPORTANT',
      category: 'IPO',
      impact: 'Public trading began',
    });
  }

  // 3. Fetch stock events from database
  const stockEvents = await prisma.stockEvent.findMany({
    where: { companyId: company.id },
    orderBy: { eventDate: 'desc' },
    take: 50,
  });

  // Convert stock events to timeline events with simple language
  for (const event of stockEvents) {
    const timelineEvent = convertStockEventToTimeline(event);
    if (timelineEvent) {
      events.push(timelineEvent);
    }
  }

  // 4. Fetch milestones
  const milestones = await prisma.stockMilestone.findMany({
    where: { companyId: company.id },
    orderBy: { date: 'desc' },
    take: 20,
  });

  for (const milestone of milestones) {
    events.push({
      date: milestone.date.toISOString(),
      year: new Date(milestone.date).getFullYear(),
      title: milestone.title,
      description: simplifyLanguage(milestone.description),
      type: milestone.milestoneType === 'MAJOR_ACHIEVEMENT' ? 'POSITIVE' :
            milestone.milestoneType === 'SIGNIFICANT_SETBACK' ? 'CHALLENGE' :
            'NEUTRAL',
      category: 'MILESTONE',
    });
  }

  // 5. Generate financial milestones
  const financialMilestones = await generateFinancialMilestones(company.id, company.companyName);
  events.push(...financialMilestones);

  // 6. Sort by date (newest first) and take top 30
  const sortedEvents = events
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);

  return sortedEvents;
}

/**
 * Convert database stock event to timeline event with simple language
 */
function convertStockEventToTimeline(event: any): TimelineEvent | null {
  const date = event.eventDate.toISOString();
  const year = new Date(event.eventDate).getFullYear();

  // Determine type based on impact assessment
  let type: TimelineEvent['type'] = 'NEUTRAL';
  if (event.impactAssessment === 'VERY_POSITIVE' || event.impactAssessment === 'POSITIVE') {
    type = 'POSITIVE';
  } else if (event.impactAssessment === 'VERY_NEGATIVE' || event.impactAssessment === 'NEGATIVE') {
    type = 'CHALLENGE';
  }

  // Simplify event type to category
  const category = mapEventTypeToCategory(event.eventType);

  // Make title more readable
  const title = makeReadableTitle(event.title, event.eventType);

  // Simplify description
  const description = simplifyLanguage(event.summary);

  return {
    date,
    year,
    title,
    description,
    type,
    category,
  };
}

/**
 * Map event type to category
 */
function mapEventTypeToCategory(eventType: string): TimelineEvent['category'] {
  const typeMap: Record<string, TimelineEvent['category']> = {
    'QUARTERLY_RESULT': 'FINANCIAL',
    'ANNUAL_RESULT': 'FINANCIAL',
    'MANAGEMENT_CHANGE': 'LEADERSHIP',
    'DIVIDEND': 'FINANCIAL',
    'ACQUISITION': 'ACQUISITION',
    'PRODUCT_LAUNCH': 'PRODUCT_LAUNCH',
    'PLANT_EXPANSION': 'EXPANSION',
    'REGULATORY_ACTION': 'REGULATORY',
    'CREDIT_RATING_CHANGE': 'FINANCIAL',
  };

  return typeMap[eventType] || 'MILESTONE';
}

/**
 * Make event title more readable
 */
function makeReadableTitle(title: string, eventType: string): string {
  // Remove technical prefixes
  title = title
    .replace(/^Q[1-4]\s+FY\d{2}:\s*/i, '') // Remove "Q1 FY24: "
    .replace(/^FY\d{2,4}:\s*/i, '')         // Remove "FY2024: "
    .replace(/\s+\(.*?\)/g, '');            // Remove parenthetical notes

  // Capitalize first letter
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * Simplify technical language to easy-to-understand explanations
 */
function simplifyLanguage(text: string): string {
  if (!text) return '';

  let simplified = text;

  // Common technical terms → Simple language
  const replacements: Record<string, string> = {
    // Financial jargon
    'divestiture': 'sale of business unit',
    'divest': 'sell',
    'strategic acquisition': 'bought a company',
    'acqui-hire': 'bought a company mainly for its talented team',
    'capital allocation': 'how they spend their money',
    'optimize': 'improve',
    'leverage': 'use',
    'synergies': 'combined benefits',
    'restructuring': 'reorganizing the business',
    'rightsizing': 'adjusting company size',

    // Corporate speak
    'executed': 'completed',
    'implemented': 'started using',
    'commenced': 'started',
    'terminated': 'ended',
    'pursuant to': 'following',
    'vis-à-vis': 'compared to',

    // Financial metrics
    'EBITDA': 'operating profit',
    'YoY': 'compared to last year',
    'QoQ': 'compared to last quarter',
    'operating margin': 'profit percentage',
    'revenue growth': 'sales increase',
  };

  // Replace technical terms
  for (const [technical, simple] of Object.entries(replacements)) {
    const regex = new RegExp(technical, 'gi');
    simplified = simplified.replace(regex, simple);
  }

  // Ensure first sentence is not too long (max 120 chars for readability)
  const sentences = simplified.split(/[.!?]+/);
  if (sentences[0] && sentences[0].length > 120) {
    simplified = sentences[0].substring(0, 117) + '...';
  } else if (sentences.length >= 2) {
    // Take first 2 sentences
    simplified = sentences.slice(0, 2).join('. ') + '.';
  }

  return simplified.trim();
}

/**
 * Generate financial milestone events (revenue, profit achievements)
 */
async function generateFinancialMilestones(
  companyId: string,
  companyName: string
): Promise<TimelineEvent[]> {
  const milestones: TimelineEvent[] = [];

  // Fetch all financial results, sorted by date
  const financials = await prisma.financialResult.findMany({
    where: { companyId },
    orderBy: [
      { fiscalYear: 'asc' },
      { fiscalQuarter: 'asc' },
    ],
  });

  if (financials.length === 0) return milestones;

  // Revenue milestones: ₹100Cr, ₹500Cr, ₹1000Cr, ₹5000Cr, ₹10000Cr
  const revenueMilestones = [100, 500, 1000, 5000, 10000];
  const achievedRevenue = new Set<number>();

  // Profitability milestones
  let firstProfitable: any = null;

  for (const financial of financials) {
    const revenue = Number(financial.revenue || 0);
    const profit = Number(financial.netProfit || 0);

    // Check revenue milestones
    for (const milestone of revenueMilestones) {
      if (revenue >= milestone * 10000000 && !achievedRevenue.has(milestone)) {
        achievedRevenue.add(milestone);

        const date = new Date(financial.fiscalYear, (financial.fiscalQuarter || 1) * 3 - 1, 1);
        milestones.push({
          date: date.toISOString(),
          year: financial.fiscalYear,
          title: `Crossed ₹${milestone} Crore Revenue`,
          description: `${companyName} achieved a major milestone by reaching annual revenue of ₹${milestone} crore, showing strong business growth and market demand for their products.`,
          type: 'POSITIVE',
          category: 'FINANCIAL',
          impact: `Revenue: ₹${milestone}Cr+`,
          metric: {
            label: 'Revenue',
            value: `₹${milestone} Cr`,
          },
        });
      }
    }

    // Check profitability
    if (!firstProfitable && profit > 0) {
      firstProfitable = financial;
      const date = new Date(financial.fiscalYear, (financial.fiscalQuarter || 1) * 3 - 1, 1);
      milestones.push({
        date: date.toISOString(),
        year: financial.fiscalYear,
        title: 'Became Profitable',
        description: `${companyName} turned profitable for the first time, meaning they started making more money than they spent. This is a crucial milestone showing the business model works.`,
        type: 'POSITIVE',
        category: 'FINANCIAL',
        impact: 'Turned profitable',
      });
    }
  }

  // Calculate growth rates for recent results
  if (financials.length >= 4) {
    const latest = financials[financials.length - 1];
    const yearAgo = financials[financials.length - 5];

    if (latest.revenue && yearAgo?.revenue) {
      const revenueGrowth = ((Number(latest.revenue) - Number(yearAgo.revenue)) / Number(yearAgo.revenue)) * 100;

      if (Math.abs(revenueGrowth) > 50) {
        const date = new Date(latest.fiscalYear, (latest.fiscalQuarter || 1) * 3 - 1, 1);
        const type = revenueGrowth > 0 ? 'POSITIVE' : 'CHALLENGE';

        milestones.push({
          date: date.toISOString(),
          year: latest.fiscalYear,
          title: revenueGrowth > 0 ? 'Strong Revenue Growth' : 'Revenue Declined',
          description: revenueGrowth > 0
            ? `${companyName} grew their sales by ${Math.abs(revenueGrowth).toFixed(0)}% compared to last year, showing strong market demand and business expansion.`
            : `${companyName}'s sales fell by ${Math.abs(revenueGrowth).toFixed(0)}% compared to last year, possibly due to market conditions or increased competition.`,
          type,
          category: 'FINANCIAL',
          impact: `Revenue ${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(0)}%`,
        });
      }
    }
  }

  return milestones;
}

/**
 * Helper to create a timeline event with simple language
 */
export function createSimpleTimelineEvent(
  date: Date,
  title: string,
  description: string,
  type: TimelineEvent['type'],
  category: TimelineEvent['category'],
  impact?: string,
  metric?: TimelineEvent['metric']
): TimelineEvent {
  return {
    date: date.toISOString(),
    year: date.getFullYear(),
    title,
    description: simplifyLanguage(description),
    type,
    category,
    impact,
    metric,
  };
}

export default generateTimeline;
