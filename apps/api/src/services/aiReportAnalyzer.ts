/**
 * AI Report Analyzer Service
 *
 * Uses Claude AI to generate intelligent, beginner-friendly insights for stock reports.
 *
 * Three main sections:
 * 1. Executive Summary - TL;DR with buy reasons, risks, and bottom line
 * 2. Future Catalysts - Upcoming events that could impact stock price
 * 3. Risk Analysis - Major risks with probability and impact assessment
 *
 * CRITICAL: All AI-generated text must be in simple, beginner-friendly language.
 * No jargon like "EBITDA", "P/E compression", "FCF yield".
 */

import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Claude AI client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface ExecutiveSummary {
  oneLiner: string;
  buyReasons: string[];
  risks: string[];
  bottomLine: string;
  bestFor: string;
  confidence: number; // 0-1
  generatedAt: string;
}

export interface Catalyst {
  eventName: string;
  expectedDate: string; // "Q2 2026" or "March 2026"
  impactLevel: 'High' | 'Medium' | 'Low';
  probability: 'High' | 'Medium' | 'Low';
  explanation: string;
  estimatedImpact: string; // "+12% to +18%"
  category: 'Company' | 'Government' | 'Industry' | 'Macro';
}

export interface Risk {
  riskName: string;
  category: 'Financial' | 'Operational' | 'Strategic' | 'External' | 'Regulatory';
  impact: 'High' | 'Medium' | 'Low';
  probability: 'High' | 'Medium' | 'Low';
  explanation: string;
  mitigation?: string;
}

export interface AIReportAnalysis {
  executiveSummary: ExecutiveSummary;
  catalysts: Catalyst[];
  risks: Risk[];
}

// ═══════════════════════════════════════════════════════════════
// GENERATE EXECUTIVE SUMMARY
// ═══════════════════════════════════════════════════════════════

export async function generateExecutiveSummary(
  companyName: string,
  data: {
    industry: string;
    marketCap: string;
    revenue5Y: number[];
    profitMargin: number;
    debtEquity: number;
    recentNews: string[];
  }
): Promise<ExecutiveSummary> {
  const prompt = `You are a stock analyst explaining ${companyName} to a beginner investor.

Based on this data:
- Industry: ${data.industry}
- Market Cap: ${data.marketCap}
- Revenue (5Y): ${data.revenue5Y.join(', ')}
- Profit Margin: ${data.profitMargin}%
- Debt/Equity: ${data.debtEquity}
- Recent News: ${data.recentNews.join('; ')}

Generate an executive summary with:

1. ONE-LINE THESIS (15 words max):
   Example: "Fast-growing e-commerce leader with strong profits but high valuation"

2. TOP 3 REASONS TO BUY (bullet points, simple language):
   Example: "• Growing 30% per year - much faster than competitors"
   Use simple words, explain WHY each matters

3. TOP 3 RISKS TO WATCH (bullet points):
   Example: "• High debt (₹5,000 Cr) - could struggle if business slows"
   Be specific with numbers, explain impact

4. BOTTOM LINE (2 sentences max):
   Example: "Good company but expensive stock. Wait for 15% price drop before buying."

5. BEST FOR (investor type):
   Example: "Growth investors with 5+ year horizon who can handle volatility"

CRITICAL:
- Use SIMPLE language (avoid: "EBITDA", "P/E compression", "FCF yield")
- Use everyday analogies
- Be specific with numbers
- Be honest about risks
- Give actionable advice

Format as JSON:
{
  "oneLiner": "...",
  "buyReasons": ["...", "...", "..."],
  "risks": ["...", "...", "..."],
  "bottomLine": "...",
  "bestFor": "..."
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Sonnet for better quality
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      ...parsed,
      confidence: 0.75, // Sonnet = 75% confidence
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to generate executive summary:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// GENERATE FUTURE CATALYSTS
// ═══════════════════════════════════════════════════════════════

export async function generateCatalysts(
  companyName: string,
  data: {
    sector: string;
    earningsDate?: string;
    recentNews: string[];
    govtPolicies: string[];
    industryTrends: string[];
  }
): Promise<Catalyst[]> {
  const prompt = `Identify upcoming events that could significantly impact ${companyName} stock price.

Context:
- Sector: ${data.sector}
- Next earnings date: ${data.earningsDate || 'Not available'}
- Recent news: ${data.recentNews.join('; ')}
- Government policies: ${data.govtPolicies.join('; ')}
- Industry trends: ${data.industryTrends.join('; ')}

Generate 3-5 future catalysts with:

For EACH catalyst:
1. Event name (5 words max)
2. Expected date/quarter
3. Impact level (High/Medium/Low)
4. Probability (High/Medium/Low)
5. Simple explanation (2 sentences):
   - What is it?
   - Why does it matter for stock price?
6. Estimated impact: "+/- X% stock move if it happens"
7. Category: Company/Government/Industry/Macro

Categories to consider:
- Company events (earnings, product launches, expansions)
- Government policies (PLI schemes, subsidies, tariff changes)
- Industry events (tech shifts, regulatory changes)
- Macro events (elections, interest rates, global trade)

Example output:
{
  "eventName": "PLI Scheme Approval",
  "expectedDate": "Q2 2026",
  "impactLevel": "High",
  "probability": "Medium",
  "explanation": "Government may approve ₹500 Cr subsidy for new factory. This would reduce costs by 15% and boost profits.",
  "estimatedImpact": "+12% to +18%",
  "category": "Government"
}

CRITICAL:
- Be specific with dates and numbers
- Explain WHY each catalyst matters
- Give realistic probability
- Quantify potential stock impact
- Use simple language

Format as JSON array of catalyst objects.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250611', // Haiku for faster, cheaper catalysts
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON array
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON array from Claude response');
    }

    const catalysts: Catalyst[] = JSON.parse(jsonMatch[0]);
    return catalysts.slice(0, 5); // Limit to 5 catalysts
  } catch (error) {
    console.error('Failed to generate catalysts:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// GENERATE RISK ANALYSIS
// ═══════════════════════════════════════════════════════════════

export async function generateRiskAnalysis(
  companyName: string,
  data: {
    debtEquity: number;
    customerConcentration?: string;
    supplierConcentration?: string;
    geoExposure: string[];
    controversies: string[];
    competition: string[];
  }
): Promise<Risk[]> {
  const prompt = `Analyze the major risks facing ${companyName}.

Data provided:
- Debt/Equity: ${data.debtEquity}
- Customer concentration: ${data.customerConcentration || 'Not available'}
- Supplier concentration: ${data.supplierConcentration || 'Not available'}
- Geographic exposure: ${data.geoExposure.join(', ')}
- Recent controversies: ${data.controversies.join('; ')}
- Competitive landscape: ${data.competition.join('; ')}

Identify TOP 5 RISKS with:

For EACH risk:
1. Risk name (3-5 words)
2. Category (Financial/Operational/Strategic/External/Regulatory)
3. Impact level (High/Medium/Low)
4. Probability (High/Medium/Low)
5. Simple explanation (3 sentences):
   - What is the risk?
   - Why could it hurt the business?
   - What would happen to stock price?
6. Mitigation (if company is doing anything about it)

Example:
{
  "riskName": "China Supply Dependency",
  "category": "Operational",
  "impact": "High",
  "probability": "Medium",
  "explanation": "Company sources 60% of raw materials from China. Geopolitical tensions could disrupt supply. Stock could fall 20-30% if supply is cut off.",
  "mitigation": "Company is diversifying to Vietnam and Taiwan (will take 2 years)"
}

CRITICAL:
- Be specific about WHAT could go wrong
- Quantify impact ("stock could fall X%")
- Note if management is addressing it
- Use simple language

Format as JSON array of risk objects.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250611', // Haiku for risks
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON array
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON array from Claude response');
    }

    const risks: Risk[] = JSON.parse(jsonMatch[0]);
    return risks.slice(0, 5); // Limit to 5 risks
  } catch (error) {
    console.error('Failed to generate risk analysis:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPREHENSIVE AI ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate complete AI analysis for a stock report
 * Runs all three AI analyses in parallel for performance
 */
export async function generateAIReportAnalysis(
  symbol: string
): Promise<AIReportAnalysis> {
  // Fetch required data from database
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

  const [financials, news] = await Promise.all([
    prisma.financialResult.findMany({
      where: { companyId: company.id },
      orderBy: { fiscalYear: 'desc' },
      take: 5,
    }),
    prisma.newsArticle.findMany({
      where: { companyId: company.id },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    }),
  ]);

  // Prepare data for AI
  const revenue5Y = financials.map((f) => Number(f.revenue || 0));
  const profitMargin = financials[0] ? Number(financials[0].netMargin || 0) : 0;
  const recentNews = news.map((n) => n.title).slice(0, 5);

  // Generate all sections in parallel
  const [executiveSummary, catalysts, risks] = await Promise.all([
    generateExecutiveSummary(company.companyName, {
      industry: company.industry?.name || 'Unknown',
      marketCap: company.marketCapCategory || 'Unknown',
      revenue5Y,
      profitMargin,
      debtEquity: 0.5, // TODO: Calculate from balance sheet
      recentNews,
    }),
    generateCatalysts(company.companyName, {
      sector: company.sector?.name || 'Unknown',
      earningsDate: undefined, // TODO: Get from events
      recentNews,
      govtPolicies: [], // TODO: Extract from tailwind analysis
      industryTrends: [], // TODO: Extract from sector analysis
    }),
    generateRiskAnalysis(company.companyName, {
      debtEquity: 0.5, // TODO: Calculate from balance sheet
      customerConcentration: undefined,
      supplierConcentration: undefined,
      geoExposure: ['India'], // TODO: Extract from company profile
      controversies: recentNews.filter((n) =>
        n.toLowerCase().includes('controversy') ||
        n.toLowerCase().includes('regulatory') ||
        n.toLowerCase().includes('fine')
      ),
      competition: [], // TODO: Get competitor names
    }),
  ]);

  return {
    executiveSummary,
    catalysts,
    risks,
  };
}

// ═══════════════════════════════════════════════════════════════
// CACHING & COST OPTIMIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Get cached AI analysis or generate new one
 * Cache for 24 hours to reduce costs
 */
export async function getOrGenerateAIAnalysis(
  symbol: string,
  forceRefresh: boolean = false
): Promise<AIReportAnalysis> {
  // Check cache first
  if (!forceRefresh) {
    const cached = await prisma.aiSummary.findFirst({
      where: {
        company: { nseSymbol: symbol },
        summaryType: 'AI_REPORT_ANALYSIS',
        generatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { generatedAt: 'desc' },
    });

    if (cached && cached.content) {
      console.log(`✅ Using cached AI analysis for ${symbol}`);
      return cached.content as AIReportAnalysis;
    }
  }

  // Generate new analysis
  console.log(`🤖 Generating new AI analysis for ${symbol}...`);
  const startTime = Date.now();

  try {
    const analysis = await generateAIReportAnalysis(symbol);

    // Cache the result
    const company = await prisma.company.findUnique({
      where: { nseSymbol: symbol },
    });

    if (company) {
      await prisma.aiSummary.create({
        data: {
          companyId: company.id,
          summaryType: 'AI_REPORT_ANALYSIS',
          content: analysis as any,
          generatedAt: new Date(),
          metadata: {
            generationTimeMs: Date.now() - startTime,
            model: 'claude-sonnet-4 + claude-haiku-4',
            version: '1.0',
          },
        },
      });
    }

    console.log(`✅ AI analysis generated for ${symbol} in ${Date.now() - startTime}ms`);
    return analysis;
  } catch (error) {
    console.error(`❌ Failed to generate AI analysis for ${symbol}:`, error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// FALLBACK TEMPLATES (if AI fails)
// ═══════════════════════════════════════════════════════════════

export function getFallbackExecutiveSummary(companyName: string): ExecutiveSummary {
  return {
    oneLiner: `${companyName} - Analysis in progress`,
    buyReasons: [
      'Established player in the industry',
      'Strong market position',
      'Consistent revenue growth',
    ],
    risks: [
      'Market volatility',
      'Industry competition',
      'Regulatory changes',
    ],
    bottomLine: 'Do your own research before investing.',
    bestFor: 'Long-term investors',
    confidence: 0.3, // Low confidence for template
    generatedAt: new Date().toISOString(),
  };
}

export function getFallbackCatalysts(): Catalyst[] {
  return [
    {
      eventName: 'Quarterly Earnings',
      expectedDate: 'Next Quarter',
      impactLevel: 'Medium',
      probability: 'High',
      explanation: 'Company will announce quarterly results. Positive results could boost stock.',
      estimatedImpact: '-5% to +10%',
      category: 'Company',
    },
  ];
}

export function getFallbackRisks(): Risk[] {
  return [
    {
      riskName: 'Market Volatility',
      category: 'External',
      impact: 'Medium',
      probability: 'High',
      explanation: 'Stock markets can be volatile. External events could cause price fluctuations. Investors should be prepared for short-term ups and downs.',
    },
  ];
}
