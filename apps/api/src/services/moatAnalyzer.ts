/**
 * Moat Analyzer Service
 *
 * Calculates competitive moat scores based on existing database data
 * Returns structured analysis with simple explanations
 */

import { PrismaClient } from '@prisma/client';
import {
  Shield,
  Users,
  Award,
  DollarSign,
  Lock,
  TrendingUp,
} from 'lucide-react';

const prisma = new PrismaClient();

export interface MoatDimension {
  name: string;
  score: number; // 0-10
  explanation: string;
  evidence: string[];
  analogy: string;
  icon: string; // Icon name for frontend
}

export interface MoatAnalysis {
  overallScore: number; // 0-10
  dimensions: {
    networkEffects: MoatDimension;
    brandPower: MoatDimension;
    costAdvantage: MoatDimension;
    switchingCosts: MoatDimension;
    scaleEconomies: MoatDimension;
  };
  interpretation: string;
  summary: string;
}

/**
 * Calculate comprehensive moat analysis for a company
 */
export async function calculateMoatScore(symbol: string): Promise<MoatAnalysis> {
  // Get company data
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

  // Fetch required data in parallel
  const [
    latestScores,
    financials,
    shareholding,
    riskFlags,
    newsArticles,
  ] = await Promise.all([
    prisma.compositeScore.findFirst({
      where: { companyId: company.id },
      orderBy: { date: 'desc' },
    }),
    prisma.financialResult.findMany({
      where: { companyId: company.id },
      orderBy: { fiscalYear: 'desc' },
      take: 8, // 2 years quarterly
    }),
    prisma.shareholdingPattern.findMany({
      where: { companyId: company.id },
      orderBy: { quarter: 'desc' },
      take: 4, // Last 4 quarters
    }),
    prisma.riskFlag.findMany({
      where: {
        companyId: company.id,
        isActive: true,
      },
    }),
    prisma.newsArticle.findMany({
      where: {
        companyId: company.id,
        sentimentLabel: 'POSITIVE',
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    }),
  ]);

  // Calculate each dimension
  const networkEffects = calculateNetworkEffects(company, latestScores, financials);
  const brandPower = calculateBrandPower(company, latestScores, newsArticles, financials);
  const costAdvantage = calculateCostAdvantage(company, financials);
  const switchingCosts = calculateSwitchingCosts(company, shareholding);
  const scaleEconomies = calculateScaleEconomies(company, financials);

  // Calculate overall score (weighted average)
  const overallScore = (
    networkEffects.score * 0.20 +
    brandPower.score * 0.25 +
    costAdvantage.score * 0.20 +
    switchingCosts.score * 0.15 +
    scaleEconomies.score * 0.20
  );

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    dimensions: {
      networkEffects,
      brandPower,
      costAdvantage,
      switchingCosts,
      scaleEconomies,
    },
    interpretation: getInterpretation(overallScore),
    summary: getSummary(company.companyName, overallScore),
  };
}

/**
 * 1. Network Effects - "The more people use it, the more valuable it becomes"
 */
function calculateNetworkEffects(
  company: any,
  scores: any,
  financials: any[]
): MoatDimension {
  let score = 0;
  const evidence: string[] = [];

  // Check if it's a platform/network business
  const isPlatform = company.sector?.name === 'Technology' ||
                     company.industry?.name?.includes('Platform') ||
                     company.companyName.toLowerCase().includes('network');

  if (isPlatform) {
    score += 3;
    evidence.push('Operates in technology/platform sector with potential network effects');
  }

  // Revenue growth indicates network expansion
  if (financials.length >= 4) {
    const recentRevenue = Number(financials[0]?.revenue || 0);
    const oldRevenue = Number(financials[3]?.revenue || 0);
    const growth = ((recentRevenue - oldRevenue) / oldRevenue) * 100;

    if (growth > 50) {
      score += 3;
      evidence.push(`Strong revenue growth of ${growth.toFixed(0)}% suggests expanding user network`);
    } else if (growth > 25) {
      score += 2;
      evidence.push(`Moderate revenue growth of ${growth.toFixed(0)}%`);
    }
  }

  // Quality score from composite indicates strong ecosystem
  if (scores?.qualityScore > 80) {
    score += 2;
    evidence.push('High quality score indicates strong market position and user satisfaction');
  }

  // Cap at 10
  score = Math.min(10, score);

  // If no platform indicators, default to low score
  if (score === 0) {
    score = 3;
    evidence.push('Not primarily a network/platform business');
  }

  return {
    name: 'Network Effects',
    score: Math.round(score * 10) / 10,
    explanation: 'Companies with network effects get stronger as they grow, making it nearly impossible for new competitors to catch up.',
    evidence,
    analogy: 'Like WhatsApp - everyone uses it because everyone uses it. New messaging apps struggle to compete even if they\'re better, because your friends aren\'t there.',
    icon: 'Users',
  };
}

/**
 * 2. Brand Power - "Can they charge more just because of their name?"
 */
function calculateBrandPower(
  company: any,
  scores: any,
  news: any[],
  financials: any[]
): MoatDimension {
  let score = 0;
  const evidence: string[] = [];

  // Check profit margins (premium brands have high margins)
  if (financials.length > 0) {
    const avgMargin = financials
      .slice(0, 4)
      .reduce((sum, f) => sum + Number(f.netMargin || 0), 0) / 4;

    if (avgMargin > 20) {
      score += 4;
      evidence.push(`High profit margin of ${avgMargin.toFixed(1)}% shows ability to charge premium prices`);
    } else if (avgMargin > 15) {
      score += 3;
      evidence.push(`Good profit margin of ${avgMargin.toFixed(1)}%`);
    } else if (avgMargin > 10) {
      score += 2;
      evidence.push(`Average profit margin of ${avgMargin.toFixed(1)}%`);
    }
  }

  // Market cap indicates brand recognition
  if (company.marketCapCategory === 'LARGE_CAP') {
    score += 3;
    evidence.push('Large-cap company with established brand recognition');
  } else if (company.marketCapCategory === 'MID_CAP') {
    score += 2;
    evidence.push('Mid-cap company with growing brand presence');
  }

  // Positive news sentiment indicates brand strength
  if (news.length > 10) {
    score += 2;
    evidence.push(`Strong media coverage with ${news.length} positive articles recently`);
  }

  // Quality score from composite
  if (scores?.qualityScore > 75) {
    score += 1;
    evidence.push('High quality score reflects strong brand reputation');
  }

  score = Math.min(10, score);

  return {
    name: 'Brand Power',
    score: Math.round(score * 10) / 10,
    explanation: 'Strong brands can charge premium prices just because of their name. Customers trust them and willingly pay more versus generic alternatives.',
    evidence,
    analogy: 'Like Apple charging 2x for same specs because people trust the brand. You pay extra for the Apple logo, not just the technology.',
    icon: 'Award',
  };
}

/**
 * 3. Cost Advantages - "Can they make products cheaper than competitors?"
 */
function calculateCostAdvantage(
  company: any,
  financials: any[]
): MoatDimension {
  let score = 0;
  const evidence: string[] = [];

  if (financials.length > 0) {
    // Operating margin indicates cost efficiency
    const avgOperatingMargin = financials
      .slice(0, 4)
      .reduce((sum, f) => sum + Number(f.operatingMargin || 0), 0) / 4;

    if (avgOperatingMargin > 25) {
      score += 5;
      evidence.push(`Exceptional operating margin of ${avgOperatingMargin.toFixed(1)}% shows cost leadership`);
    } else if (avgOperatingMargin > 20) {
      score += 4;
      evidence.push(`Strong operating margin of ${avgOperatingMargin.toFixed(1)}%`);
    } else if (avgOperatingMargin > 15) {
      score += 3;
      evidence.push(`Good operating margin of ${avgOperatingMargin.toFixed(1)}%`);
    } else if (avgOperatingMargin > 10) {
      score += 2;
      evidence.push(`Average operating margin of ${avgOperatingMargin.toFixed(1)}%`);
    }

    // Gross margin consistency (indicates pricing power from cost advantage)
    const margins = financials.slice(0, 4).map(f => Number(f.operatingMargin || 0));
    const marginStability = Math.max(...margins) - Math.min(...margins);

    if (marginStability < 3) {
      score += 2;
      evidence.push('Consistent margins over time indicate sustainable cost advantages');
    }

    // Revenue per employee (efficiency indicator - if we had employee data)
    // For now, use large cap as proxy for scale efficiencies
    if (company.marketCapCategory === 'LARGE_CAP') {
      score += 2;
      evidence.push('Large scale provides purchasing power and operational efficiencies');
    }
  }

  score = Math.min(10, score);

  return {
    name: 'Cost Advantage',
    score: Math.round(score * 10) / 10,
    explanation: 'Companies that can produce goods or services cheaper than competitors can undercut rivals on price while maintaining healthy profits.',
    evidence,
    analogy: 'Like owning the mines instead of buying raw materials. While competitors pay market price, you produce at a fraction of the cost and pocket the difference.',
    icon: 'DollarSign',
  };
}

/**
 * 4. Switching Costs - "How hard is it for customers to switch?"
 */
function calculateSwitchingCosts(
  company: any,
  shareholding: any[]
): MoatDimension {
  let score = 0;
  const evidence: string[] = [];

  // Stable promoter holding indicates long-term customer stickiness (indirect)
  if (shareholding.length >= 2) {
    const promoterChange = Math.abs(
      Number(shareholding[0]?.promoterHoldingPct || 0) -
      Number(shareholding[shareholding.length - 1]?.promoterHoldingPct || 0)
    );

    if (promoterChange < 1) {
      score += 2;
      evidence.push('Stable ownership suggests strong business fundamentals and customer retention');
    }
  }

  // Industry-based heuristics
  const highSwitchingIndustries = [
    'Banking',
    'Insurance',
    'Software',
    'Telecommunications',
    'Enterprise IT',
  ];

  const mediumSwitchingIndustries = [
    'Healthcare',
    'Education',
    'Utilities',
    'Industrial Equipment',
  ];

  const industryName = company.industry?.name || '';

  if (highSwitchingIndustries.some(ind => industryName.includes(ind))) {
    score += 5;
    evidence.push(`${industryName} typically has high switching costs - customers face significant hassle changing providers`);
  } else if (mediumSwitchingIndustries.some(ind => industryName.includes(ind))) {
    score += 3;
    evidence.push(`${industryName} has moderate switching costs`);
  } else {
    score += 2;
    evidence.push('Industry has relatively low switching barriers');
  }

  // Large cap companies usually have longer relationships
  if (company.marketCapCategory === 'LARGE_CAP') {
    score += 2;
    evidence.push('Established company likely has long-term customer relationships');
  }

  score = Math.min(10, score);

  return {
    name: 'Switching Costs',
    score: Math.round(score * 10) / 10,
    explanation: 'When it\'s painful or expensive for customers to switch to a competitor, they tend to stay loyal even if alternatives exist.',
    evidence,
    analogy: 'Like changing banks - huge pain to update all auto-payments, direct deposits, and linked accounts. Most people stick with their bank even if others offer better rates.',
    icon: 'Lock',
  };
}

/**
 * 5. Scale Economies - "Being big gives unfair advantages"
 */
function calculateScaleEconomies(
  company: any,
  financials: any[]
): MoatDimension {
  let score = 0;
  const evidence: string[] = [];

  // Market cap as scale indicator
  if (company.marketCapCategory === 'LARGE_CAP') {
    score += 4;
    evidence.push('Large-cap company with significant scale advantages');
  } else if (company.marketCapCategory === 'MID_CAP') {
    score += 2;
    evidence.push('Mid-cap company with moderate scale');
  } else {
    score += 1;
    evidence.push('Small-cap company still building scale');
  }

  // Revenue size indicates scale
  if (financials.length > 0) {
    const latestRevenue = Number(financials[0]?.revenue || 0);
    const revenueCr = latestRevenue / 10000000; // Convert to crores

    if (revenueCr > 10000) {
      score += 3;
      evidence.push(`Massive revenue of ₹${(revenueCr / 100).toFixed(0)}K+ Cr provides enormous purchasing power and R&D budget`);
    } else if (revenueCr > 1000) {
      score += 2;
      evidence.push(`Large revenue of ₹${(revenueCr / 100).toFixed(0)}K Cr enables significant scale benefits`);
    } else if (revenueCr > 100) {
      score += 1;
      evidence.push(`Revenue of ₹${revenueCr.toFixed(0)} Cr`);
    }
  }

  // Operating leverage (improving margins with scale)
  if (financials.length >= 4) {
    const recentMargin = Number(financials[0]?.operatingMargin || 0);
    const oldMargin = Number(financials[3]?.operatingMargin || 0);

    if (recentMargin > oldMargin) {
      score += 2;
      evidence.push('Improving margins as company grows shows operating leverage from scale');
    }
  }

  score = Math.min(10, score);

  return {
    name: 'Scale Economies',
    score: Math.round(score * 10) / 10,
    explanation: 'Bigger companies can spread fixed costs over more units, negotiate better deals with suppliers, and afford expensive R&D that smaller competitors cannot match.',
    evidence,
    analogy: 'Like Walmart buying in bulk - they negotiate prices smaller stores can\'t get. They also afford sophisticated logistics systems that would bankrupt a small retailer.',
    icon: 'TrendingUp',
  };
}

/**
 * Get overall interpretation based on score
 */
function getInterpretation(score: number): string {
  if (score >= 9) return 'Exceptional competitive moat - Warren Buffett would approve';
  if (score >= 7) return 'Strong competitive advantages - good long-term investment';
  if (score >= 5) return 'Moderate protection from competition';
  if (score >= 3) return 'Vulnerable to competitive pressure';
  return 'Commodity business with little protection';
}

/**
 * Get summary statement
 */
function getSummary(companyName: string, score: number): string {
  if (score >= 9) {
    return `${companyName} has exceptional competitive advantages that make it extremely difficult for competitors to challenge its market position.`;
  }
  if (score >= 7) {
    return `${companyName} has strong competitive advantages that should protect profitability for years to come.`;
  }
  if (score >= 5) {
    return `${companyName} has moderate competitive protection but faces some competitive threats.`;
  }
  if (score >= 3) {
    return `${companyName} faces significant competitive pressure with limited protective moats.`;
  }
  return `${companyName} operates in a highly competitive environment with minimal sustainable advantages.`;
}

export default calculateMoatScore;
