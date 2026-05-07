/**
 * Institutional-Grade Deep Research Report Generator
 *
 * Elite equity research using comprehensive investigative framework
 * Generates premium research dossiers with infographic-ready structure
 */

import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import { generateInfographics, InfographicSpecs } from './infographicGenerator';

const prisma = new PrismaClient();

// Lazy initialization of Claude AI client
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropic = new Anthropic({ apiKey, baseURL: 'https://api.anthropic.com' });
  }
  return anthropic;
}

// ═══════════════════════════════════════════════════════════════
// INSTITUTIONAL REPORT INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface InstitutionalReport {
  symbol: string;
  companyName: string;
  generatedAt: string;
  asOfDate: string;

  // 1) Executive Dashboard
  executiveDashboard: {
    snapshot: string;
    whyItMatters: string[];
    businessModelDiagram: string;
    moatVerdict: {
      strength: string;
      durability: string;
      erosionRisks: string;
    };
    keyDrivers: string[];
    keyRisks: string[];
    whatToMonitor: string[];
    confidenceScore: number;
    confidenceReasoning: string;
  };

  // 2) Deep Research Dossier
  companyDNA: {
    foundingStory: string;
    majorPivots: string[];
    maTimeline: any[];
    leadershipTimeline: any[];
    strategyEvolution: string;
  };

  businessDeconstruction: {
    productLines: any[];
    unitEconomics: string;
    customerSegments: any[];
    routesToMarket: string;
  };

  supplyChainPositioning: {
    upstream: any[];
    midstream: string;
    downstream: any[];
    dependenciesMap: string;
    competitiveMap: string;
  };

  moatAnalysis: {
    structuralMoat: any;
    operationalMoat: any;
    strategicMoat: any;
    fragility: string;
    evidence: string;
    moatScorecard: any;
  };

  financialForensics: {
    growthQuality: string;
    accountingQuality: string;
    balanceSheet: string;
    cashConversionCycle: string;
    capitalAllocation: string;
    promoterBehavior: string;
    financialTruthTable: any;
  };

  marketStructure: {
    tam: string;
    sam: string;
    som: string;
    industryCycle: string;
    portersFiveForces: any;
    regulatoryLandscape: string;
  };

  growthEngines: {
    growthLevers: string[];
    executionConstraints: string[];
    pipeline: string;
    whatMustGoRight: string[];
    whatCanGoWrong: string[];
  };

  riskLandscape: {
    businessRisk: any[];
    financialRisk: any[];
    governanceRisk: any[];
    regulatoryRisk: any[];
    techDisruptionRisk: any[];
    competitiveRisk: any[];
    geopoliticalRisk: any[];
    esgRisk: any[];
    riskHeatmap: any;
  };

  macroPolicyGeopolitics: {
    indiaGovtInitiatives: any[];
    tradePolicy: string;
    interestRatesSensitivity: string;
    globalRelations: string;
    scenarios: any;
  };

  catalysts: {
    nearTerm: any[];
    longTerm: any[];
    catalystTracker: any[];
  };

  peerBenchmarking: {
    peers: any[];
    differentiation: string;
  };

  investorOperatingManual: {
    kpisToMonitor: string[];
    earlyWarningSignals: string[];
    managementQuestions: string[];
  };

  // 3) Infographic Blueprint
  infographics: {
    timeline: any;
    valueChain: any;
    ecosystemMap: any;
    radarChart: any;
    kpiDashboard: any;
    trendChart: any;
    heatmap: any;
    impactMatrix: any;
    scenarioTree: any;
    executiveDashboardVisual: any;
  };

  // 4) Red Flags & Open Questions
  redFlags: {
    dataGaps: string[];
    verificationPlan: any[];
    diligenceChecklist: string[];
  };

  // 5) Source Library
  sources: {
    companyPrimary: any[];
    governmentRegulatory: any[];
    industryResearch: any[];
    credibleNews: any[];
    peerReferences: any[];
  };

  // 6) Visual Infographics (NEW!)
  visualInfographics?: InfographicSpecs;
}

// ═══════════════════════════════════════════════════════════════
// MAIN REPORT GENERATION
// ═══════════════════════════════════════════════════════════════

export async function generateInstitutionalReport(
  symbol: string
): Promise<InstitutionalReport> {
  console.log(`🎯 Generating institutional-grade research report for ${symbol}`);
  console.log(`📋 Using chunked generation (4 AI calls) for reliability`);

  // Fetch company data
  const company = await prisma.company.findFirst({
    where: {
      OR: [
        { nseSymbol: { equals: symbol.toUpperCase(), mode: 'insensitive' } },
        { bseCode: { equals: symbol, mode: 'insensitive' } },
      ]
    },
    include: {
      sector: true,
      industry: true,
      financialResults: {
        orderBy: { fiscalYear: 'desc' },
        take: 10,
      },
    },
  });

  if (!company) {
    throw new Error(`No company found for symbol: ${symbol}`);
  }

  const companyName = company.companyName;
  const ticker = company.nseSymbol || company.bseCode || symbol;
  const asOfDate = new Date().toISOString().split('T')[0];

  console.log(`📊 Company: ${companyName} (${ticker})`);
  console.log(`📅 As of: ${asOfDate}`);

  // Generate report in 4 focused chunks (parallel for speed)
  console.log('🚀 Generating 4 report chunks in parallel...');

  const [chunk1, chunk2, chunk3, chunk4] = await Promise.all([
    generateChunk1_Foundation(companyName, ticker, asOfDate, company),
    generateChunk2_MoatFinancials(companyName, ticker, asOfDate, company),
    generateChunk3_GrowthRisks(companyName, ticker, asOfDate, company),
    generateChunk4_ForwardLooking(companyName, ticker, asOfDate, company),
  ]);

  console.log('✅ All chunks generated successfully');

  // Combine all chunks (without visuals first)
  const report: InstitutionalReport = {
    symbol: ticker,
    companyName,
    generatedAt: new Date().toISOString(),
    asOfDate,

    // Chunk 1: Foundation
    executiveDashboard: chunk1.executiveDashboard,
    companyDNA: chunk1.companyDNA,
    businessDeconstruction: chunk1.businessDeconstruction,

    // Chunk 2: Moat & Financials
    supplyChainPositioning: chunk2.supplyChainPositioning,
    moatAnalysis: chunk2.moatAnalysis,
    financialForensics: chunk2.financialForensics,
    marketStructure: chunk2.marketStructure,

    // Chunk 3: Growth & Risks
    growthEngines: chunk3.growthEngines,
    riskLandscape: chunk3.riskLandscape,
    macroPolicyGeopolitics: chunk3.macroPolicyGeopolitics,

    // Chunk 4: Forward Looking
    catalysts: chunk4.catalysts,
    peerBenchmarking: chunk4.peerBenchmarking,
    investorOperatingManual: chunk4.investorOperatingManual,
    infographics: chunk4.infographics,
    redFlags: chunk4.redFlags,
    sources: chunk4.sources,
  };

  console.log('✅ Institutional report compiled successfully');

  // Generate visual infographics (charts, diagrams, etc.)
  try {
    console.log('🎨 Generating visual infographics...');
    const visualInfographics = await generateInfographics(report, companyName, ticker);
    report.visualInfographics = visualInfographics;
    console.log('✅ Visual infographics generated successfully');
  } catch (error: any) {
    console.error('⚠️  Failed to generate visual infographics:', error.message);
    console.log('   Continuing without visual infographics...');
    // Report still valid without visuals
  }

  return report;
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

function buildInstitutionalPrompt(
  companyName: string,
  ticker: string,
  asOfDate: string,
  companyData: any
): string {
  const financialSummary = companyData.financialResults
    .slice(0, 5)
    .map((f: any) => `FY${f.fiscalYear}: Revenue ₹${f.revenue}Cr, PAT ₹${f.netProfit}Cr`)
    .join('\n');

  return `You are an elite, institutional-grade equity research analyst and investigative business strategist.

TASK
Create a "Deep Research Master Report" on the following stock/company:
- Company: ${companyName}
- Ticker: ${ticker} (NSE/BSE)
- As-of date: ${asOfDate}
- Sector: ${companyData.sector?.name || 'Unknown'}
- Industry: ${companyData.industry?.name || 'Unknown'}
- Audience: serious long-term investors + operators (not traders)
- Output style: premium research dossier + infographic-ready structure

Recent Financials (for context):
${financialSummary}

NON-NEGOTIABLE RULES
1) NO investment advice: do not say buy/sell/hold, no target price, no return promises.
2) Be evidence-first: every important claim must be supported by a SOURCE.
   - Since browsing is NOT available: clearly label "unverified / needs source" for claims that need verification
   - List what sources would confirm each claim
3) Do not hallucinate numbers/events/partnerships/policies. If unknown, say "unknown" and create a verification checklist.
4) Separate FACTS vs ANALYSIS vs SPECULATION clearly.
5) Keep it readable: dense but structured. Use nested objects where helpful.
6) India context: use FY/quarter language, INR where relevant, regulatory context (SEBI-safe).

DELIVERABLE
Produce a masterpiece report that covers "everything under the sun" impacting the business.

OUTPUT FORMAT
Return ONLY valid JSON (no markdown, no code fences) with this exact structure:

{
  "executiveDashboard": {
    "snapshot": "2-line description of what company does",
    "whyItMatters": ["reason 1", "reason 2", "reason 3", "reason 4", "reason 5"],
    "businessModelDiagram": "Description: inputs → value creation → customers → cash flow",
    "moatVerdict": {
      "strength": "Wide/Medium/Narrow - explain",
      "durability": "How sustainable over 5-10 years",
      "erosionRisks": "What could weaken the moat"
    },
    "keyDrivers": ["driver 1", "driver 2", ... (7 total)],
    "keyRisks": ["risk 1", "risk 2", ... (7 total)],
    "whatToMonitor": ["metric 1", "metric 2", ... (12-month checklist)],
    "confidenceScore": 75,
    "confidenceReasoning": "Why this confidence level"
  },

  "companyDNA": {
    "foundingStory": "Detailed founding narrative with dates",
    "majorPivots": ["pivot 1 with year and impact", ...],
    "maTimeline": [
      {"year": "2015", "event": "Acquired XYZ", "impact": "Expanded into segment Y", "source": "needs verification"}
    ],
    "leadershipTimeline": [
      {"year": "2010", "change": "New CEO appointed", "impact": "Strategic shift to digital"}
    ],
    "strategyEvolution": "How strategy changed over time and why"
  },

  "businessDeconstruction": {
    "productLines": [
      {"product": "Product A", "revenueSplit": "~40%", "marginProfile": "High/Medium/Low", "analysis": "..."}
    ],
    "unitEconomics": "Pricing power, cost structure, key cost drivers",
    "customerSegments": [
      {"segment": "Enterprise", "whyTheyPay": "...", "switchingCosts": "High/Medium/Low"}
    ],
    "routesToMarket": "B2B/B2C channels, distribution strategy"
  },

  "supplyChainPositioning": {
    "upstream": [
      {"type": "Raw material X", "criticality": "High", "supplierConcentration": "Medium", "importExposure": "40%"}
    ],
    "midstream": "Manufacturing/operations capabilities and constraints",
    "downstream": [
      {"channel": "Modern trade", "contribution": "~35%", "dependency": "Medium"}
    ],
    "dependenciesMap": "Single points of failure, bottlenecks",
    "competitiveMap": "Position vs domestic and global peers"
  },

  "moatAnalysis": {
    "structuralMoat": {
      "networkEffects": {"rating": 3, "evidence": "..."},
      "scaleEconomies": {"rating": 8, "evidence": "..."},
      "switchingCosts": {"rating": 6, "evidence": "..."},
      "brand": {"rating": 7, "evidence": "..."},
      "ip": {"rating": 4, "evidence": "..."},
      "regulatory": {"rating": 5, "evidence": "..."}
    },
    "operationalMoat": "Process excellence, cost advantages, supply contracts",
    "strategicMoat": "Positioning, partnerships, ecosystem control",
    "fragility": "What could break the moat (tech disruption, regulation, etc)",
    "evidence": "Pricing power trends, retention rates, ROIC stability",
    "moatScorecard": {
      "overall": "Medium to Wide",
      "trend": "Strengthening/Stable/Weakening",
      "horizon": "5-10 years"
    }
  },

  "financialForensics": {
    "growthQuality": "Revenue/EBITDA/PAT/FCF trends over 10 years, quality of growth",
    "accountingQuality": "Accruals, working capital movements, exceptional items red flags",
    "balanceSheet": "Leverage, maturity profile, FX exposure, off-balance items",
    "cashConversionCycle": "Days, trends, inventory/receivables stress",
    "capitalAllocation": "Reinvestment vs dividends vs buybacks vs M&A track record",
    "promoterBehavior": "Pledging, related party transactions, governance flags",
    "financialTruthTable": {
      "looksGood": ["strength 1", "strength 2"],
      "concerning": ["concern 1", "concern 2"],
      "unclear": ["needs verification 1"]
    }
  },

  "marketStructure": {
    "tam": "Total addressable market size and growth (cite source or mark unverified)",
    "sam": "Serviceable addressable market",
    "som": "Current market share",
    "industryCycle": "Commodity/capex/consumer driven, cyclicality",
    "portersFiveForces": {
      "buyerPower": "High/Medium/Low - reasoning",
      "supplierPower": "High/Medium/Low - reasoning",
      "newEntrants": "High/Medium/Low - reasoning",
      "substitutes": "High/Medium/Low - reasoning",
      "rivalry": "High/Medium/Low - reasoning"
    },
    "regulatoryLandscape": "Key regulations, compliance requirements, upcoming changes"
  },

  "growthEngines": {
    "growthLevers": ["volume expansion", "pricing power", "new products", "geographic expansion", ...],
    "executionConstraints": ["capex needs", "talent gaps", "regulatory approvals", ...],
    "pipeline": "Announced projects, order book, guidance",
    "whatMustGoRight": ["condition 1", "condition 2", ...],
    "whatCanGoWrong": ["risk 1", "risk 2", ...]
  },

  "riskLandscape": {
    "businessRisk": [
      {"risk": "Customer concentration", "probability": "Medium", "impact": "High", "mitigation": "..."}
    ],
    "financialRisk": [...],
    "governanceRisk": [...],
    "regulatoryRisk": [...],
    "techDisruptionRisk": [...],
    "competitiveRisk": [...],
    "geopoliticalRisk": [...],
    "esgRisk": [...],
    "riskHeatmap": {
      "high": ["critical risk 1", "critical risk 2"],
      "medium": [...],
      "low": [...]
    }
  },

  "macroPolicyGeopolitics": {
    "indiaGovtInitiatives": [
      {"policy": "Make in India", "impact": "Positive - supports domestic manufacturing", "timeline": "Ongoing", "source": "needs verification"}
    ],
    "tradePolicy": "Import duties, PLI schemes, localization mandates",
    "interestRatesSensitivity": "How interest rate changes impact the business",
    "globalRelations": "Supply chain shifts, China+1, geopolitical impacts",
    "scenarios": {
      "base": "Expected business trajectory",
      "tailwind": "Best case drivers",
      "headwind": "Adverse scenario impacts"
    }
  },

  "catalysts": {
    "nearTerm": [
      {"catalyst": "New product launch", "timeline": "Q2 FY25", "impact": "Revenue boost of 5-8%", "probability": "High", "watchFor": "Order flow data"}
    ],
    "longTerm": [
      {"catalyst": "Capacity expansion", "timeline": "2-3 years", "impact": "Doubles capacity", "drivers": ["capex completion", "demand sustains"]}
    ],
    "catalystTracker": [
      {"event": "Q1 results", "date": "Jul 2024", "whatToWatch": "Margin expansion signals"}
    ]
  },

  "peerBenchmarking": {
    "peers": [
      {"name": "Peer A", "growth": "15%", "margins": "18%", "roic": "22%", "valuation": "25x PE"}
    ],
    "differentiation": "Where this company is genuinely better/worse than peers and why"
  },

  "investorOperatingManual": {
    "kpisToMonitor": ["Monthly KPI 1", "Quarterly KPI 2", ...],
    "earlyWarningSignals": ["Leading indicator 1", "Red flag 2", ...],
    "managementQuestions": ["Question for earnings call 1", ...]
  },

  "infographics": {
    "timeline": {
      "events": [
        {"date": "1995", "title": "Company founded", "detail": "Started operations in Mumbai", "impact": "Established foundation"}
      ]
    },
    "valueChain": {
      "nodes": [
        {"id": "suppliers", "label": "Raw Materials", "type": "input"},
        {"id": "manufacturing", "label": "Production", "type": "process"},
        {"id": "distribution", "label": "Channels", "type": "output"},
        {"id": "customers", "label": "End Users", "type": "customer"}
      ],
      "edges": [
        {"from": "suppliers", "to": "manufacturing", "label": "Procurement"},
        {"from": "manufacturing", "to": "distribution", "label": "Products"},
        {"from": "distribution", "to": "customers", "label": "Sales"}
      ]
    },
    "radarChart": {
      "axes": [
        {"name": "Network Effects", "value": 3, "note": "Limited"},
        {"name": "Brand Power", "value": 8, "note": "Very strong"},
        {"name": "Cost Advantages", "value": 7, "note": "Scale benefits"},
        {"name": "Switching Costs", "value": 6, "note": "Moderate"},
        {"name": "IP/Regulatory", "value": 5, "note": "Some barriers"},
        {"name": "Scale Economics", "value": 8, "note": "Significant"}
      ]
    },
    "kpiDashboard": {
      "kpis": [
        {"label": "Revenue Growth", "value": "15%", "delta": "+2pp", "period": "YoY", "note": "Accelerating"},
        {"label": "EBITDA Margin", "value": "18%", "delta": "+50bps", "period": "YoY", "note": "Expanding"}
      ]
    }
  },

  "redFlags": {
    "dataGaps": ["Missing supplier concentration data", "Unclear promoter succession plan"],
    "verificationPlan": [
      {"gap": "Exact market share", "verifyFrom": "Annual report page X, Industry association data"}
    ],
    "diligenceChecklist": [
      "1. Verify promoter pledging status",
      "2. Check related party transaction disclosures",
      "... (20 items total)"
    ]
  },

  "sources": {
    "companyPrimary": [
      {"title": "Annual Report FY23", "publisher": "${companyName}", "date": "2023", "link": "needs verification"}
    ],
    "governmentRegulatory": [],
    "industryResearch": [],
    "credibleNews": [],
    "peerReferences": []
  }
}

CRITICAL: Return ONLY the JSON object above. No markdown, no explanations, no code fences.
Make it comprehensive, factual, and premium quality.`;
}

// ═══════════════════════════════════════════════════════════════
// CLAUDE API CALL
// ═══════════════════════════════════════════════════════════════

async function callClaudeForInstitutionalReport(prompt: string): Promise<any> {
  const client = getAnthropicClient();

  console.log('📤 Sending request to Claude API (this may take 60-90 seconds)...');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929', // Use Sonnet 4.5 for best balance
    max_tokens: 16000, // Large token limit for comprehensive report
    temperature: 0.3, // Lower temperature for factual analysis
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response format from Claude');
  }

  // Strip markdown code fences if present
  let text = content.text.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(text.trim());
    console.log('✅ Successfully parsed institutional report JSON');
    return parsed;
  } catch (error: any) {
    console.error('❌ JSON parsing failed:', error.message);
    console.error('Response preview:', text.substring(0, 500));
    throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// CHUNK GENERATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function generateChunk1_Foundation(
  companyName: string,
  ticker: string,
  asOfDate: string,
  companyData: any
): Promise<any> {
  console.log('  📦 Chunk 1/4: Foundation (Executive Dashboard, DNA, Business)');

  const financialSummary = companyData.financialResults
    .slice(0, 5)
    .map((f: any) => `FY${f.fiscalYear}: Revenue ₹${f.revenue}Cr, PAT ₹${f.netProfit}Cr`)
    .join('\n');

  const prompt = `You are an elite equity research analyst. Generate the FOUNDATION sections for ${companyName} (${ticker}).

Company: ${companyName}
Ticker: ${ticker}
Sector: ${companyData.sector?.name || 'Unknown'}
Industry: ${companyData.industry?.name || 'Unknown'}
As of: ${asOfDate}

Recent Financials:
${financialSummary}

CRITICAL RULES:
1. NO investment advice (no buy/sell/hold, no targets)
2. Evidence-first - cite sources or mark "needs verification"
3. No hallucinations - say "unknown" if uncertain
4. Separate FACTS vs ANALYSIS clearly
5. India context (FY, INR, SEBI-safe)

Generate ONLY these 3 sections. Return pure JSON (no markdown):

{
  "executiveDashboard": {
    "snapshot": "2-line company description",
    "whyItMatters": ["reason 1", "reason 2", "reason 3", "reason 4", "reason 5"],
    "businessModelDiagram": "Inputs → Value Creation → Customers → Cash (describe flow)",
    "moatVerdict": {
      "strength": "Wide/Medium/Narrow with explanation",
      "durability": "5-10 year sustainability assessment",
      "erosionRisks": "What could weaken the moat"
    },
    "keyDrivers": ["driver 1", "driver 2", ... (7 total)],
    "keyRisks": ["risk 1", "risk 2", ... (7 total)],
    "whatToMonitor": ["metric 1", "metric 2", ... (12-month checklist, 8-10 items)],
    "confidenceScore": 75,
    "confidenceReasoning": "Why this score"
  },

  "companyDNA": {
    "foundingStory": "Detailed founding narrative with dates and founders",
    "majorPivots": ["Year + pivot + impact", ... (3-5 major strategic shifts)],
    "maTimeline": [
      {"year": "2015", "event": "Acquisition of XYZ", "impact": "Expanded into Y segment", "source": "Annual Report / needs verification"}
    ],
    "leadershipTimeline": [
      {"year": "2010", "change": "New CEO appointed", "impact": "Strategic shift to digital"}
    ],
    "strategyEvolution": "How strategy evolved over time (2-3 paragraphs)"
  },

  "businessDeconstruction": {
    "productLines": [
      {"product": "Product A", "revenueSplit": "~40%", "marginProfile": "High/Medium/Low", "analysis": "Why profitable/not"}
    ],
    "unitEconomics": "Pricing power, cost structure, key inputs (2 paragraphs)",
    "customerSegments": [
      {"segment": "Enterprise", "whyTheyPay": "Value proposition", "switchingCosts": "High/Medium/Low"}
    ],
    "routesToMarket": "B2B/B2C channels, distribution strategy (1-2 paragraphs)"
  }
}`;

  const result = await callClaudeChunk(prompt, 'Foundation');
  return result;
}

async function generateChunk2_MoatFinancials(
  companyName: string,
  ticker: string,
  asOfDate: string,
  companyData: any
): Promise<any> {
  console.log('  📦 Chunk 2/4: Moat & Financials (Supply Chain, MOAT, Financials, Market)');

  const prompt = `You are an elite equity research analyst. Generate the MOAT & FINANCIALS sections for ${companyName} (${ticker}).

Company: ${companyName}
Sector: ${companyData.sector?.name || 'Unknown'}
Industry: ${companyData.industry?.name || 'Unknown'}

CRITICAL RULES:
1. NO investment advice
2. Evidence-first - cite sources or mark "needs verification"
3. Separate FACTS vs ANALYSIS

Generate these 4 sections. Return pure JSON (no markdown):

{
  "supplyChainPositioning": {
    "upstream": [
      {"type": "Raw material X", "criticality": "High/Medium/Low", "supplierConcentration": "Description", "importExposure": "% or description"}
    ],
    "midstream": "Manufacturing/operations capabilities (2 paragraphs)",
    "downstream": [
      {"channel": "Modern trade", "contribution": "~35%", "dependency": "High/Medium/Low"}
    ],
    "dependenciesMap": "Single points of failure, bottlenecks (1-2 paragraphs)",
    "competitiveMap": "Position vs peers (1-2 paragraphs)"
  },

  "moatAnalysis": {
    "structuralMoat": {
      "networkEffects": {"rating": 1-10, "evidence": "Explanation"},
      "scaleEconomies": {"rating": 1-10, "evidence": "Explanation"},
      "switchingCosts": {"rating": 1-10, "evidence": "Explanation"},
      "brand": {"rating": 1-10, "evidence": "Explanation"},
      "ip": {"rating": 1-10, "evidence": "Explanation"},
      "regulatory": {"rating": 1-10, "evidence": "Explanation"}
    },
    "operationalMoat": "Process excellence, cost advantages (1-2 paragraphs)",
    "strategicMoat": "Positioning, partnerships (1-2 paragraphs)",
    "fragility": "What could break the moat (1-2 paragraphs)",
    "evidence": "Pricing power, retention, ROIC evidence (1-2 paragraphs)",
    "moatScorecard": {
      "overall": "Wide/Medium/Narrow",
      "trend": "Strengthening/Stable/Weakening",
      "horizon": "5-10 years"
    }
  },

  "financialForensics": {
    "growthQuality": "Revenue/EBITDA/PAT/FCF trends over 10 years (2-3 paragraphs)",
    "accountingQuality": "Accruals, working capital, red flags (2 paragraphs)",
    "balanceSheet": "Leverage, FX exposure, off-balance items (2 paragraphs)",
    "cashConversionCycle": "Days, trends, stress signals (1-2 paragraphs)",
    "capitalAllocation": "Reinvestment/dividends/M&A track record (2 paragraphs)",
    "promoterBehavior": "Pledging, related party transactions (1-2 paragraphs)",
    "financialTruthTable": {
      "looksGood": ["strength 1", "strength 2", "strength 3"],
      "concerning": ["concern 1", "concern 2"],
      "unclear": ["needs verification 1"]
    }
  },

  "marketStructure": {
    "tam": "Total addressable market (with source or 'needs verification')",
    "sam": "Serviceable market",
    "som": "Current market share",
    "industryCycle": "Cyclicality assessment (1-2 paragraphs)",
    "portersFiveForces": {
      "buyerPower": "High/Medium/Low - reasoning",
      "supplierPower": "High/Medium/Low - reasoning",
      "newEntrants": "High/Medium/Low - reasoning",
      "substitutes": "High/Medium/Low - reasoning",
      "rivalry": "High/Medium/Low - reasoning"
    },
    "regulatoryLandscape": "Key regulations, compliance (2 paragraphs)"
  }
}`;

  const result = await callClaudeChunk(prompt, 'Moat & Financials');
  return result;
}

async function generateChunk3_GrowthRisks(
  companyName: string,
  ticker: string,
  asOfDate: string,
  companyData: any
): Promise<any> {
  console.log('  📦 Chunk 3/4: Growth & Risks (Growth Engines, Risk Landscape, Macro)');

  const prompt = `You are an elite equity research analyst. Generate the GROWTH & RISKS sections for ${companyName} (${ticker}).

Company: ${companyName}
Sector: ${companyData.sector?.name || 'Unknown'}

CRITICAL RULES:
1. NO investment advice
2. Evidence-first
3. Separate FACTS vs ANALYSIS

Generate these 3 sections. Return pure JSON (no markdown):

{
  "growthEngines": {
    "growthLevers": ["volume expansion", "pricing power", "new products", ... (5-7 levers)],
    "executionConstraints": ["capex needs", "talent gaps", ... (4-6 constraints)],
    "pipeline": "Announced projects, order book, guidance (2-3 paragraphs)",
    "whatMustGoRight": ["condition 1", "condition 2", ... (4-5 items)],
    "whatCanGoWrong": ["risk 1", "risk 2", ... (4-5 items)]
  },

  "riskLandscape": {
    "businessRisk": [
      {"risk": "Customer concentration", "probability": "High/Medium/Low", "impact": "High/Medium/Low", "mitigation": "How to mitigate"}
    ],
    "financialRisk": [{"risk": "...", "probability": "...", "impact": "...", "mitigation": "..."}],
    "governanceRisk": [{"risk": "...", "probability": "...", "impact": "...", "mitigation": "..."}],
    "regulatoryRisk": [{"risk": "...", "probability": "...", "impact": "...", "mitigation": "..."}],
    "techDisruptionRisk": [{"risk": "...", "probability": "...", "impact": "...", "mitigation": "..."}],
    "competitiveRisk": [{"risk": "...", "probability": "...", "impact": "...", "mitigation": "..."}],
    "geopoliticalRisk": [{"risk": "...", "probability": "...", "impact": "...", "mitigation": "..."}],
    "esgRisk": [],
    "riskHeatmap": {
      "high": ["critical risk 1", "critical risk 2"],
      "medium": ["medium risk 1"],
      "low": ["low risk 1"]
    }
  },

  "macroPolicyGeopolitics": {
    "indiaGovtInitiatives": [
      {"policy": "Make in India", "impact": "Positive/Negative/Neutral - explanation", "timeline": "Ongoing/Upcoming", "source": "needs verification"}
    ],
    "tradePolicy": "Import duties, PLI, localization (2 paragraphs)",
    "interestRatesSensitivity": "How rates impact business (1-2 paragraphs)",
    "globalRelations": "China+1, geopolitical impacts (2 paragraphs)",
    "scenarios": {
      "base": "Expected trajectory (1 paragraph)",
      "tailwind": "Best case drivers (1 paragraph)",
      "headwind": "Adverse scenario (1 paragraph)"
    }
  }
}`;

  const result = await callClaudeChunk(prompt, 'Growth & Risks');
  return result;
}

async function generateChunk4_ForwardLooking(
  companyName: string,
  ticker: string,
  asOfDate: string,
  companyData: any
): Promise<any> {
  console.log('  📦 Chunk 4/4: Forward Looking (Catalysts, Peers, Manual, Infographics)');

  const prompt = `You are an elite equity research analyst. Generate the FORWARD LOOKING sections for ${companyName} (${ticker}).

Company: ${companyName}
As of: ${asOfDate}

CRITICAL RULES:
1. NO investment advice
2. Evidence-first

Generate these sections. Return pure JSON (no markdown):

{
  "catalysts": {
    "nearTerm": [
      {"catalyst": "New product launch", "timeline": "Q2 FY25", "impact": "Revenue boost 5-8%", "probability": "High", "watchFor": "Order data"}
    ],
    "longTerm": [
      {"catalyst": "Capacity expansion", "timeline": "2-3 years", "impact": "Doubles capacity", "drivers": ["capex", "demand"]}
    ],
    "catalystTracker": [
      {"event": "Q1 results", "date": "Jul 2024", "whatToWatch": "Margin trends"}
    ]
  },

  "peerBenchmarking": {
    "peers": [
      {"name": "Peer A", "growth": "15%", "margins": "18%", "roic": "22%", "valuation": "25x PE"}
    ],
    "differentiation": "Where company is better/worse vs peers (2-3 paragraphs)"
  },

  "investorOperatingManual": {
    "kpisToMonitor": ["Monthly KPI 1", "Quarterly KPI 2", ... (8-10 KPIs)],
    "earlyWarningSignals": ["Leading indicator 1", ... (5-7 signals)],
    "managementQuestions": ["Question 1", ... (8-10 questions)]
  },

  "infographics": {
    "timeline": {
      "events": [
        {"date": "1995", "title": "Founded", "detail": "Started in Mumbai", "impact": "Foundation"}
      ]
    },
    "radarChart": {
      "axes": [
        {"name": "Network Effects", "value": 3, "note": "Limited"},
        {"name": "Brand Power", "value": 8, "note": "Very strong"},
        {"name": "Cost Advantages", "value": 7, "note": "Scale benefits"},
        {"name": "Switching Costs", "value": 6, "note": "Moderate"},
        {"name": "IP/Regulatory", "value": 5, "note": "Some barriers"},
        {"name": "Scale Economics", "value": 8, "note": "Significant"}
      ]
    },
    "kpiDashboard": {
      "kpis": [
        {"label": "Revenue Growth", "value": "15%", "delta": "+2pp", "period": "YoY", "note": "Accelerating"}
      ]
    }
  },

  "redFlags": {
    "dataGaps": ["Missing data point 1", "Unclear area 2", ... (5-8 gaps)],
    "verificationPlan": [
      {"gap": "Market share", "verifyFrom": "Annual report, industry data"}
    ],
    "diligenceChecklist": [
      "1. Verify promoter pledging",
      "2. Check related party transactions",
      ... (20 items total)
    ]
  },

  "sources": {
    "companyPrimary": [
      {"title": "Annual Report FY23", "publisher": "${companyName}", "date": "2023", "link": "needs verification"}
    ],
    "governmentRegulatory": [],
    "industryResearch": [],
    "credibleNews": [],
    "peerReferences": []
  }
}`;

  const result = await callClaudeChunk(prompt, 'Forward Looking');
  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHUNK API CALLER
// ═══════════════════════════════════════════════════════════════

async function callClaudeChunk(prompt: string, chunkName: string): Promise<any> {
  const client = getAnthropicClient();

  console.log(`    🤖 Calling Claude for: ${chunkName}`);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8000, // Reduced from 16K since each chunk is smaller
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response format from Claude');
  }

  // Strip markdown code fences
  let text = content.text.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(text.trim());
    console.log(`    ✅ ${chunkName} parsed successfully`);
    return parsed;
  } catch (error: any) {
    console.error(`    ❌ ${chunkName} JSON parsing failed:`, error.message);
    console.error('    Error position:', error.message.match(/position (\d+)/)?.[1] || 'unknown');

    // Try to extract the problematic area
    const errorPos = parseInt(error.message.match(/position (\d+)/)?.[1] || '0');
    if (errorPos > 0) {
      const start = Math.max(0, errorPos - 100);
      const end = Math.min(text.length, errorPos + 100);
      console.error('    Context around error:', text.substring(start, end));
    }

    // Retry once with instruction to be more careful
    console.log(`    🔄 Retrying ${chunkName} with stricter JSON instructions...`);
    const retryPrompt = prompt + `\n\nIMPORTANT: Your previous response had invalid JSON. Please:
1. Escape all quotes inside strings with \\\"
2. Escape all newlines with \\n
3. Do not use literal line breaks inside strings
4. Ensure all strings are properly terminated
5. Return ONLY valid JSON, no explanations`;

    const retryClient = getAnthropicClient();
    const retryResponse = await retryClient.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.2, // Lower temperature for more precise output
      messages: [{ role: 'user', content: retryPrompt }],
    });

    const retryContent = retryResponse.content[0];
    if (retryContent.type !== 'text') {
      throw new Error('Retry failed: unexpected response format');
    }

    let retryText = retryContent.text.trim();
    if (retryText.startsWith('```json')) {
      retryText = retryText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (retryText.startsWith('```')) {
      retryText = retryText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const retryParsed = JSON.parse(retryText.trim());
      console.log(`    ✅ ${chunkName} parsed successfully on retry`);
      return retryParsed;
    } catch (retryError: any) {
      console.error(`    ❌ ${chunkName} retry also failed:`, retryError.message);

      // Last resort: return minimal valid structure
      console.log(`    ⚠️  Returning minimal fallback structure for ${chunkName}`);
      return getMinimalFallback(chunkName);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// FALLBACK STRUCTURES
// ═══════════════════════════════════════════════════════════════

function getMinimalFallback(chunkName: string): any {
  console.warn(`⚠️  Using fallback structure for ${chunkName} due to parsing errors`);

  switch (chunkName) {
    case 'Foundation':
      return {
        executiveDashboard: {
          snapshot: "Report generation encountered issues. Please retry.",
          whyItMatters: ["Data unavailable due to parsing error"],
          businessModelDiagram: "Please retry report generation",
          moatVerdict: { strength: "Unknown", durability: "Unknown", erosionRisks: "Unknown" },
          keyDrivers: ["Please retry"],
          keyRisks: ["Please retry"],
          whatToMonitor: ["Please retry"],
          confidenceScore: 0,
          confidenceReasoning: "Report generation failed"
        },
        companyDNA: {
          foundingStory: "Please retry report generation",
          majorPivots: [],
          maTimeline: [],
          leadershipTimeline: [],
          strategyEvolution: "Please retry"
        },
        businessDeconstruction: {
          productLines: [],
          unitEconomics: "Please retry",
          customerSegments: [],
          routesToMarket: "Please retry"
        }
      };

    case 'Moat & Financials':
      return {
        supplyChainPositioning: {
          upstream: [],
          midstream: "Please retry",
          downstream: [],
          dependenciesMap: "Please retry",
          competitiveMap: "Please retry"
        },
        moatAnalysis: {
          structuralMoat: {
            networkEffects: { rating: 0, evidence: "Please retry" },
            scaleEconomies: { rating: 0, evidence: "Please retry" },
            switchingCosts: { rating: 0, evidence: "Please retry" },
            brand: { rating: 0, evidence: "Please retry" },
            ip: { rating: 0, evidence: "Please retry" },
            regulatory: { rating: 0, evidence: "Please retry" }
          },
          operationalMoat: "Please retry",
          strategicMoat: "Please retry",
          fragility: "Please retry",
          evidence: "Please retry",
          moatScorecard: { overall: "Unknown", trend: "Unknown", horizon: "Unknown" }
        },
        financialForensics: {
          growthQuality: "Please retry",
          accountingQuality: "Please retry",
          balanceSheet: "Please retry",
          cashConversionCycle: "Please retry",
          capitalAllocation: "Please retry",
          promoterBehavior: "Please retry",
          financialTruthTable: { looksGood: [], concerning: [], unclear: [] }
        },
        marketStructure: {
          tam: "Please retry",
          sam: "Please retry",
          som: "Please retry",
          industryCycle: "Please retry",
          portersFiveForces: {
            buyerPower: "Unknown",
            supplierPower: "Unknown",
            newEntrants: "Unknown",
            substitutes: "Unknown",
            rivalry: "Unknown"
          },
          regulatoryLandscape: "Please retry"
        }
      };

    case 'Growth & Risks':
      return {
        growthEngines: {
          growthLevers: [],
          executionConstraints: [],
          pipeline: "Please retry",
          whatMustGoRight: [],
          whatCanGoWrong: []
        },
        riskLandscape: {
          businessRisk: [],
          financialRisk: [],
          governanceRisk: [],
          regulatoryRisk: [],
          techDisruptionRisk: [],
          competitiveRisk: [],
          geopoliticalRisk: [],
          esgRisk: [],
          riskHeatmap: { high: [], medium: [], low: [] }
        },
        macroPolicyGeopolitics: {
          indiaGovtInitiatives: [],
          tradePolicy: "Please retry",
          interestRatesSensitivity: "Please retry",
          globalRelations: "Please retry",
          scenarios: { base: "Please retry", tailwind: "Please retry", headwind: "Please retry" }
        }
      };

    case 'Forward Looking':
      return {
        catalysts: {
          nearTerm: [],
          longTerm: [],
          catalystTracker: []
        },
        peerBenchmarking: {
          peers: [],
          differentiation: "Please retry"
        },
        investorOperatingManual: {
          kpisToMonitor: [],
          earlyWarningSignals: [],
          managementQuestions: []
        },
        infographics: {
          timeline: { events: [] },
          radarChart: { axes: [] },
          kpiDashboard: { kpis: [] }
        },
        redFlags: {
          dataGaps: ["Report generation encountered errors"],
          verificationPlan: [],
          diligenceChecklist: ["Please retry report generation"]
        },
        sources: {
          companyPrimary: [],
          governmentRegulatory: [],
          industryResearch: [],
          credibleNews: [],
          peerReferences: []
        }
      };

    default:
      return {};
  }
}

export default {
  generateInstitutionalReport,
};
