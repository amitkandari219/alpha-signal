/**
 * Mock AI Report Generator
 *
 * Generates sample report data without calling Anthropic API
 * Use this for testing PDF generation functionality
 */

import { ComprehensiveReport } from './aiReportGenerator';

export async function generateMockReport(symbol: string, companyName: string): Promise<ComprehensiveReport> {
  console.log(`📝 Generating MOCK report for ${companyName} (${symbol})`);

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const report: ComprehensiveReport = {
    symbol,
    companyName,
    generatedAt: new Date().toISOString(),

    timeline: {
      foundingStory: `${companyName} was founded in the early 1990s by visionary entrepreneurs who saw an opportunity in the rapidly growing Indian market. Starting with a small operation, the company has grown into one of India's leading enterprises through strategic expansion and innovation.`,
      majorMilestones: [
        { year: "1995", event: "Company founded", impact: "Established initial operations in Mumbai with 50 employees" },
        { year: "2000", event: "First major expansion", impact: "Opened 10 new facilities across India, revenue grew 300%" },
        { year: "2005", event: "IPO Launch", impact: "Listed on NSE/BSE, raised ₹500 Cr for expansion" },
        { year: "2010", event: "International expansion", impact: "Entered Southeast Asian markets, established global presence" },
        { year: "2015", event: "Technology transformation", impact: "Invested ₹1000 Cr in digital infrastructure and automation" },
        { year: "2020", event: "Pandemic resilience", impact: "Demonstrated strong business continuity, market share increased 15%" },
        { year: "2023", event: "Sustainability initiative", impact: "Committed to net-zero emissions by 2030, launched green products" },
        { year: "2024", event: "Strategic acquisition", impact: "Acquired key competitor, consolidated market position" },
      ],
      currentState: `Today, ${companyName} stands as a market leader with a strong presence across India and expanding international operations. The company is focused on digital transformation, sustainability, and expanding its product portfolio to capture emerging market opportunities.`,
    },

    executiveSummary: {
      headline: `${companyName}: Leading Indian enterprise with strong fundamentals and growth potential`,
      keyHighlights: [
        `Market leader in ${symbol} sector with 25% market share`,
        "Consistent revenue growth of 15-20% over past 5 years",
        "Strong profitability with operating margins above 18%",
        "Robust balance sheet with debt-to-equity ratio of 0.3",
        "Expanding into high-growth segments with ₹2000 Cr investment",
        "Strong management team with proven track record",
      ],
      investmentThesis: `${companyName} represents a compelling investment opportunity in the Indian market. The company has demonstrated consistent growth, strong operational efficiency, and is well-positioned to capitalize on India's economic expansion. With a proven business model, competitive advantages in distribution and brand recognition, and strategic investments in future growth areas, the company offers attractive risk-adjusted returns for long-term investors.`,
      bullCase: `The bull case for ${companyName} rests on several key factors: (1) India's GDP growth of 6-7% provides strong tailwinds for domestic consumption, (2) Company's market share gains in core segments, (3) Successful execution of digital transformation leading to margin expansion, (4) Government initiatives like Make in India and PLI schemes providing support, (5) Potential for 25%+ revenue growth if new product launches succeed.`,
      bearCase: `Key risks include: (1) Intense competition from both domestic and international players, (2) Raw material cost inflation impacting margins, (3) Regulatory changes in the industry, (4) Economic slowdown reducing consumer spending, (5) Execution risks in new initiatives and acquisitions. Valuation at current levels leaves limited margin for error.`,
      bottomLine: `${companyName} is a quality business with strong fundamentals and good growth prospects. Suitable for investors with 3-5 year horizon seeking exposure to India's growth story. Current valuation appears reasonable given growth outlook.`,
    },

    businessAnalysis: {
      overview: `${companyName} operates in the Indian market with a diversified business model spanning multiple segments. The company has built strong brand equity over decades and enjoys leadership position in key categories.`,
      businessModel: `The company follows an integrated business model covering the entire value chain from sourcing to distribution. This vertical integration provides cost advantages and quality control. Revenue is generated through B2B and B2C channels with increasing focus on direct-to-consumer digital platforms.`,
      revenueStreams: [
        { stream: "Core Products", percentage: "~60%", analysis: "Largest revenue contributor with stable margins, mature market" },
        { stream: "Premium Segment", percentage: "~25%", analysis: "Fast growing at 30% CAGR, higher margins, urban focus" },
        { stream: "Services", percentage: "~10%", analysis: "Emerging revenue stream, high profitability, recurring revenue" },
        { stream: "Exports", percentage: "~5%", analysis: "Growing international presence, foreign exchange revenue" },
      ],
      competitiveAdvantages: [
        "Strong brand recognition built over 25+ years",
        "Extensive distribution network covering 500+ cities",
        "Economies of scale with largest manufacturing capacity",
        "Vertical integration reducing costs and ensuring quality",
        "Customer loyalty and high repeat purchase rates",
        "Strong R&D capabilities with 200+ patents",
        "Financial strength enabling continuous investment",
      ],
      keyRisks: [
        "Dependence on few key raw material suppliers",
        "Regulatory compliance costs increasing",
        "Digital disruption changing industry dynamics",
        "Competition from low-cost alternatives",
        "Changing consumer preferences",
      ],
    },

    financialAnalysis: {
      overview: `${companyName} has demonstrated strong financial performance with consistent revenue growth and improving profitability metrics. The company maintains a healthy balance sheet with moderate leverage and strong cash generation.`,
      profitability: {
        summary: "Operating margins have expanded from 15% to 18% over past 3 years due to operational efficiencies and better product mix. Net margins stable at 12-13%.",
        trends: "Profitability trending upward driven by premium product mix, automation benefits, and scale advantages. EBITDA margins expected to reach 20% by FY26.",
        margins: "Best-in-class margins compared to peers, reflecting strong pricing power and cost management. ROE consistently above 18%, ROCE at 22%.",
      },
      growth: {
        historical: "Revenue CAGR of 18% over past 5 years, outpacing industry growth of 12%. Volume growth of 10% plus price increases contributing to topline.",
        drivers: "Growth driven by market share gains, new product launches, geographic expansion, and premiumization trend. Digital channels growing at 50% annually.",
        sustainability: "Growth sustainable given large addressable market, low penetration in tier-2/3 cities, and ongoing innovation pipeline. Target 15-20% growth over next 3-5 years.",
      },
      balanceSheet: {
        strength: "Strong balance sheet with debt-to-equity of 0.3x, well below industry average. Current ratio healthy at 1.8x. Cash and equivalents of ₹3000 Cr provide cushion.",
        concerns: "Working capital days increasing slightly due to inventory buildup. Capex intensity high at 8% of sales, but necessary for growth.",
      },
    },

    moatAnalysis: {
      overallStrength: "Medium to Wide moat. ${companyName} has built sustainable competitive advantages through brand, scale, and distribution network that would be difficult for competitors to replicate.",
      dimensions: [
        { name: "Network Effects", rating: 5, explanation: "Limited network effects as business model doesn't create strong user network. Some platform effects in B2B segment." },
        { name: "Brand Power", rating: 8, explanation: "Very strong brand recognition with top-of-mind recall in key categories. Brand equity built over 25+ years provides pricing power." },
        { name: "Cost Advantages", rating: 7, explanation: "Scale advantages in procurement and manufacturing. Vertical integration reduces costs. Automation providing further benefits." },
        { name: "Switching Costs", rating: 6, explanation: "Moderate switching costs for B2B customers due to service relationships. Lower for retail consumers but brand loyalty helps." },
        { name: "Regulatory/IP Barriers", rating: 5, explanation: "Some regulatory licensing advantages. Growing patent portfolio but not core to competitive position." },
        { name: "Scale Economics", rating: 8, explanation: "Significant scale advantages in distribution, marketing, and manufacturing. Largest player benefits from spreading fixed costs." },
      ],
      sustainability: "Moat likely to strengthen over next 5 years as company invests in brand, technology, and distribution. Digital transformation could enhance competitive position further.",
    },

    supplyChain: {
      position: "Mid-stream position in value chain. Procures raw materials, manufactures finished goods, and distributes through own and third-party channels.",
      keySuppliers: [
        { type: "Raw Materials - Primary inputs", importance: "Critical - 40% of COGS", concentration: "High - Top 5 suppliers account for 60%" },
        { type: "Packaging materials", importance: "Medium - 15% of COGS", concentration: "Medium - Multiple suppliers available" },
        { type: "Technology & Equipment", importance: "Medium - Capital items", concentration: "Low - International suppliers" },
      ],
      keyCustomers: [
        { segment: "Modern Trade", contribution: "~35% of revenue", dependency: "Medium - Growing channel" },
        { segment: "Traditional Retail", contribution: "~40% of revenue", dependency: "Low - Fragmented" },
        { segment: "B2B Institutional", contribution: "~15% of revenue", dependency: "High - Large contracts" },
        { segment: "E-commerce", contribution: "~10% of revenue", dependency: "Low - Fast growing" },
      ],
      vulnerabilities: [
        "Supplier concentration risk for key raw materials",
        "Transportation costs increasing with fuel prices",
        "Port congestion affecting import/export",
        "Regional disruptions impacting specific facilities",
      ],
      advantages: [
        "Strong supplier relationships built over decades",
        "Forward integration into distribution",
        "Multiple manufacturing locations reducing risk",
        "Inventory management systems optimizing working capital",
      ],
    },

    governmentImpact: {
      currentPolicies: [
        { policy: "Make in India initiative", impact: "Positive - Supports domestic manufacturing, reduced imports", timeline: "Ongoing since 2014" },
        { policy: "GST compliance", impact: "Mixed - Simplified taxation but compliance costs high", timeline: "Implemented 2017" },
        { policy: "Environmental regulations", impact: "Neutral to negative - Increased capex for compliance", timeline: "Ongoing" },
      ],
      upcomingInitiatives: [
        { initiative: "PLI Scheme for sector", potentialImpact: "Could provide ₹500 Cr incentives over 5 years if qualified", probability: "High" },
        { initiative: "Labor law reforms", potentialImpact: "May increase operational flexibility, reduce costs 2-3%", probability: "Medium" },
        { initiative: "Import duty changes", potentialImpact: "Protection from cheaper imports, margin expansion possible", probability: "Medium" },
      ],
      regulatoryEnvironment: "Regulatory environment generally stable and supportive of organized sector players. Compliance requirements increasing but manageable for large players like ${companyName}. Government focus on formalization benefiting organized sector.",
      incentivesSubsidies: [
        "MEIS/RoDTEP export incentives of 2-4%",
        "State government subsidies for new facilities",
        "R&D tax credits for innovation spending",
        "Potential PLI scheme benefits",
      ],
    },

    globalFactors: {
      tradeDynamics: "Export exposure limited at 5% of revenue, primarily to Middle East and Southeast Asia. Import dependency for some raw materials creates forex exposure. China+1 trend benefiting as global companies diversify supply chains.",
      currencyExposure: "Moderate forex exposure with natural hedging from exports. Rupee depreciation increases raw material costs but benefits exports. Company hedges 60-70% of exposure.",
      commodityImpact: "Exposed to oil, petrochemicals, and agricultural commodities. Oil price increase of $10/barrel impacts costs by ₹200 Cr annually. Implementing price pass-through mechanisms.",
      geopoliticalRisks: [
        "US-China trade tensions - Opportunity as supply chain shifts",
        "Middle East instability - Affects oil prices and export markets",
        "Protectionist trends - Risk to export growth",
        "Global recession - Demand impact",
      ],
      globalTrends: [
        { trend: "Premiumization in emerging markets", impact: "Positive - Aligns with product strategy", timeframe: "3-5 years" },
        { trend: "Sustainability focus", impact: "Mixed - Capex but brand premium", timeframe: "Ongoing" },
        { trend: "Digital commerce growth", impact: "Positive - Direct customer access", timeframe: "1-3 years" },
      ],
    },

    catalysts: {
      nearTerm: [
        { catalyst: "New product launch in Q2", timeline: "Q2 FY25", impact: "+5% to +8% revenue boost", probability: "High" },
        { catalyst: "Capacity expansion completion", timeline: "Q3 FY25", impact: "₹1000 Cr additional revenue capacity", probability: "High" },
        { catalyst: "PLI scheme approval", timeline: "Next 6 months", impact: "Margins expand 100-150 bps", probability: "Medium" },
        { catalyst: "Market share gains", timeline: "Ongoing", impact: "+2% volume growth", probability: "Medium" },
      ],
      longTerm: [
        { catalyst: "Digital transformation", timeline: "2-3 years", impact: "Margin expansion 200+ bps, revenue channel diversification" },
        { catalyst: "International expansion", timeline: "3-5 years", impact: "Export revenue could reach 15% of total" },
        { catalyst: "Platform business development", timeline: "2-4 years", impact: "New high-margin revenue stream" },
      ],
    },

    riskAssessment: {
      overallRisk: "Medium risk profile. Established business with track record but facing competitive and regulatory headwinds. Financial position strong providing buffer.",
      majorRisks: [
        { risk: "Intense competition from new entrants", severity: "High", likelihood: "High", mitigation: "Strengthen brand, innovation, and distribution" },
        { risk: "Raw material cost inflation", severity: "High", likelihood: "Medium", mitigation: "Long-term contracts, price pass-through, efficiency" },
        { risk: "Regulatory changes", severity: "Medium", likelihood: "Medium", mitigation: "Active engagement with policy makers, compliance investment" },
        { risk: "Demand slowdown", severity: "High", likelihood: "Low", mitigation: "Geographic and product diversification" },
        { risk: "Technology disruption", severity: "Medium", likelihood: "Medium", mitigation: "Digital investments, partnerships" },
      ],
      riskScore: 45,
    },

    valuation: {
      currentPrice: 1000,
      fairValue: "₹950 - ₹1100 based on DCF and multiples",
      priceTarget: {
        low: "₹850 (bear case)",
        base: "₹1150 (base case)",
        high: "₹1400 (bull case)",
        timeframe: "12 months",
      },
      valuationMetrics: "Trading at 25x P/E vs 5-year average of 22x. Premium justified by growth acceleration. P/B of 4.5x reasonable given ROE of 18%. EV/EBITDA of 15x in line with quality peers.",
      comparison: "Valuation premium to sector average of 20x P/E warranted by superior growth, profitability, and market position. In line with best-in-class domestic peers.",
    },

    recommendation: {
      rating: "Buy",
      confidence: 75,
      reasoning: `${companyName} represents a compelling investment opportunity for long-term investors. The company has demonstrated consistent execution, strong competitive position, and is well-positioned to benefit from India's growth trajectory. While valuation is not cheap, it's justified by the quality of the business and growth prospects. Key catalysts over the next 12 months include new product launches, capacity additions, and potential PLI scheme benefits. Risks are well-understood and manageable. Recommend accumulating on dips.`,
      idealInvestor: "Suitable for growth-oriented investors with 3-5 year investment horizon. Ideal for those seeking exposure to India's consumption story with a quality business. Not suitable for value investors seeking deep discounts or those requiring high dividend yield (current yield ~1.5%).",
      timeHorizon: "3-5 years for optimal returns",
      positionSize: "5-8% of equity portfolio for moderate risk investors. Can be a core holding given quality and growth profile. Consider scaling in over 2-3 months to reduce timing risk.",
    },
  };

  console.log(`✅ Mock report generated for ${symbol}`);
  return report;
}
