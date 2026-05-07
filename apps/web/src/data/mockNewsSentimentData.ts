/**
 * Mock News Sentiment Data
 *
 * Realistic Indian market news with sentiment analysis
 */

export type SentimentType = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
export type ImpactRating = 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskCategory = 'REGULATORY' | 'FINANCIAL' | 'MANAGEMENT' | 'OPERATIONAL' | 'LITIGATION';

export interface NewsCluster {
  id: string;
  topic: string;
  summary: string;
  sourceCount: number;
  dateRange: string;
  sentiment: SentimentType;
  impact: ImpactRating;
  sources: {
    title: string;
    url: string;
    source: string;
    date: string;
  }[];
}

export interface SentimentTimelineData {
  date: string;
  sentiment: number; // -1 to +1
  price: number;
}

export interface RiskAlert {
  id: string;
  timestamp: string;
  headline: string;
  category: RiskCategory;
  details: string;
}

export interface SectorCorrelation {
  text: string;
  articles: {
    title: string;
    url: string;
    source: string;
  }[];
}

export interface NewsSentimentData {
  newsDigest: NewsCluster[];
  sentimentTimeline30D: SentimentTimelineData[];
  sentimentTimeline90D: SentimentTimelineData[];
  sentimentTimeline180D: SentimentTimelineData[];
  riskAlerts: RiskAlert[];
  sectorCorrelation: SectorCorrelation;
}

export const mockNewsSentimentData: Record<string, NewsSentimentData> = {
  RELIANCE: {
    newsDigest: [
      {
        id: 'ril-1',
        topic: '5G Network Expansion and Monetization Strategy',
        summary: 'Jio announced completion of pan-India 5G rollout with 100M+ subscribers. Management indicated plans for gradual tariff hikes starting Q1 FY26 to drive ARPU expansion. Analysts expect 15-20% revenue growth from telecom segment over next 2 years.',
        sourceCount: 6,
        dateRange: 'Feb 1-7, 2026',
        sentiment: 'POSITIVE',
        impact: 'HIGH',
        sources: [
          { title: 'Jio Completes 5G Rollout Across India', url: '#', source: 'Economic Times', date: 'Feb 7, 2026' },
          { title: 'RIL Telecom Revenue to Surge on Tariff Hikes', url: '#', source: 'Business Standard', date: 'Feb 6, 2026' },
          { title: 'Brokerages Upgrade Reliance Target Post 5G Data', url: '#', source: 'Moneycontrol', date: 'Feb 5, 2026' },
          { title: 'Jio 5G Subscriber Base Crosses 100 Million', url: '#', source: 'LiveMint', date: 'Feb 4, 2026' },
          { title: 'Telecom ARPU Expansion Expected in FY26', url: '#', source: 'BloombergQuint', date: 'Feb 3, 2026' },
          { title: 'RIL Management Commentary on 5G Monetization', url: '#', source: 'CNBC-TV18', date: 'Feb 1, 2026' },
        ],
      },
      {
        id: 'ril-2',
        topic: 'Q3 FY25 Results Beat Estimates',
        summary: 'Reliance reported consolidated revenue of ₹2.35L cr, up 8% YoY, beating street estimates. Net profit grew 12% to ₹18,540 cr driven by strong retail performance and improving O2C margins. EBITDA margin expanded 40bps QoQ.',
        sourceCount: 8,
        dateRange: 'Jan 18-25, 2026',
        sentiment: 'POSITIVE',
        impact: 'HIGH',
        sources: [
          { title: 'Reliance Q3 Profit Jumps 12% on Retail Strength', url: '#', source: 'Reuters', date: 'Jan 25, 2026' },
          { title: 'RIL Q3 Results: Revenue Beats Estimates', url: '#', source: 'Economic Times', date: 'Jan 25, 2026' },
          { title: 'Retail Division Drives RIL Q3 Performance', url: '#', source: 'Business Line', date: 'Jan 24, 2026' },
          { title: 'Analysts Positive on Reliance Margin Expansion', url: '#', source: 'Financial Express', date: 'Jan 23, 2026' },
          { title: 'O2C Margins Improve on Better Spreads', url: '#', source: 'Moneycontrol', date: 'Jan 22, 2026' },
          { title: 'RIL Outlook Remains Strong: Management', url: '#', source: 'CNBC-TV18', date: 'Jan 20, 2026' },
          { title: 'Reliance Retail Same-Store-Sales Growth Impressive', url: '#', source: 'LiveMint', date: 'Jan 19, 2026' },
          { title: 'Brokerages Raise RIL Target Price Post Q3', url: '#', source: 'Business Standard', date: 'Jan 18, 2026' },
        ],
      },
      {
        id: 'ril-3',
        topic: 'New Energy Capex and Green Hydrogen Plans',
        summary: 'Company announced ₹75,000 cr investment in green hydrogen, solar panel, and battery manufacturing over next 3 years. First phase of Jamnagar giga-factory expected by H2 FY26. Government PLI incentives will support project economics.',
        sourceCount: 5,
        dateRange: 'Jan 10-16, 2026',
        sentiment: 'POSITIVE',
        impact: 'MEDIUM',
        sources: [
          { title: 'RIL Green Hydrogen Project Gets Govt Nod', url: '#', source: 'Economic Times', date: 'Jan 16, 2026' },
          { title: 'Reliance to Invest ₹75,000cr in New Energy', url: '#', source: 'Business Standard', date: 'Jan 14, 2026' },
          { title: 'Jamnagar Giga-Factory Construction On Track', url: '#', source: 'LiveMint', date: 'Jan 12, 2026' },
          { title: 'PLI Schemes to Benefit RIL Green Projects', url: '#', source: 'Financial Express', date: 'Jan 11, 2026' },
          { title: 'Analysts See Long-Term Value in RIL Energy Bet', url: '#', source: 'Moneycontrol', date: 'Jan 10, 2026' },
        ],
      },
      {
        id: 'ril-4',
        topic: 'Retail Segment O2O Integration Progress',
        summary: 'JioMart integration with physical stores showing strong traction. Online-to-offline model driving higher footfall and ticket sizes. Management targets 1,500+ new store openings in FY26 across grocery, fashion, and electronics formats.',
        sourceCount: 4,
        dateRange: 'Dec 28-Jan 5, 2026',
        sentiment: 'POSITIVE',
        impact: 'MEDIUM',
        sources: [
          { title: 'JioMart O2O Strategy Gains Momentum', url: '#', source: 'Business Line', date: 'Jan 5, 2026' },
          { title: 'Reliance Retail Store Expansion Plans for FY26', url: '#', source: 'Economic Times', date: 'Jan 2, 2026' },
          { title: 'Online Grocery Competition Intensifies', url: '#', source: 'LiveMint', date: 'Dec 30, 2025' },
          { title: 'RIL Retail Footfall Trends Positive', url: '#', source: 'Moneycontrol', date: 'Dec 28, 2025' },
        ],
      },
      {
        id: 'ril-5',
        topic: 'Demerger and Value Unlocking Timeline',
        summary: 'Reports suggest Reliance may announce financial services demerger by Q2 FY26. Potential separate listings for Jio and Retail could unlock 25-30% value per sum-of-parts analysis. No official confirmation yet from management.',
        sourceCount: 3,
        dateRange: 'Dec 15-20, 2025',
        sentiment: 'NEUTRAL',
        impact: 'HIGH',
        sources: [
          { title: 'RIL Demerger Timeline Speculation Builds', url: '#', source: 'Economic Times', date: 'Dec 20, 2025' },
          { title: 'Analysts Expect Jio, Retail Listings Soon', url: '#', source: 'Business Standard', date: 'Dec 18, 2025' },
          { title: 'Value Unlocking Potential in RIL Structure', url: '#', source: 'Moneycontrol', date: 'Dec 15, 2025' },
        ],
      },
    ],
    sentimentTimeline30D: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2026, 1, i - 29).toISOString().split('T')[0],
      sentiment: 0.3 + Math.sin(i / 5) * 0.2 + (i / 150),
      price: 2456 + (i * 2) + Math.sin(i / 3) * 15,
    })),
    sentimentTimeline90D: Array.from({ length: 90 }, (_, i) => ({
      date: new Date(2026, 1, i - 89).toISOString().split('T')[0],
      sentiment: 0.2 + Math.sin(i / 10) * 0.3 + (i / 300),
      price: 2380 + (i * 0.8) + Math.sin(i / 8) * 20,
    })),
    sentimentTimeline180D: Array.from({ length: 180 }, (_, i) => ({
      date: new Date(2026, 1, i - 179).toISOString().split('T')[0],
      sentiment: 0.1 + Math.sin(i / 20) * 0.4 + (i / 600),
      price: 2280 + (i * 0.5) + Math.sin(i / 15) * 25,
    })),
    riskAlerts: [
      {
        id: 'ril-risk-1',
        timestamp: 'Jan 30, 2026 10:45 AM',
        headline: 'TRAI Consultation Paper on Telecom Tariff Regulation',
        category: 'REGULATORY',
        details: 'Telecom regulator issued consultation paper potentially limiting pricing flexibility. Could impact Jio ARPU expansion plans.',
      },
    ],
    sectorCorrelation: {
      text: 'Government announcement of ₹12,000 crore PLI incentives for electronics manufacturing and clean energy has created positive sentiment across the conglomerate sector. Reliance\'s planned investments in green hydrogen and solar panel manufacturing position it to benefit significantly from these policy tailwinds. Additionally, strong consumer demand trends in Indian retail (premiumization driving 2x growth in premium products) are supporting Reliance Retail\'s margin expansion strategy.',
      articles: [
        { title: 'Govt Unveils PLI 2.0 for Green Energy Sector', url: '#', source: 'PIB India' },
        { title: 'Retail Premiumization Trend Accelerates', url: '#', source: 'Redseer Report 2026' },
        { title: 'Conglomerate Stocks Rally on Policy Support', url: '#', source: 'Economic Times' },
      ],
    },
  },

  TCS: {
    newsDigest: [
      {
        id: 'tcs-1',
        topic: 'Q3 FY25 Results Show Steady Growth',
        summary: 'TCS reported 4.1% QoQ revenue growth in constant currency with deal wins totaling $11.2B TCV. North America growth accelerated while Europe remained soft. Management commentary indicates discretionary spending recovery underway but gradual.',
        sourceCount: 7,
        dateRange: 'Jan 10-15, 2026',
        sentiment: 'POSITIVE',
        impact: 'MEDIUM',
        sources: [
          { title: 'TCS Q3 Beats Estimates on Strong Deal Wins', url: '#', source: 'Economic Times', date: 'Jan 15, 2026' },
          { title: 'IT Sector Recovery Signals from TCS Results', url: '#', source: 'Business Standard', date: 'Jan 14, 2026' },
          { title: 'TCS North America Business Accelerates', url: '#', source: 'LiveMint', date: 'Jan 13, 2026' },
          { title: 'Deal Pipeline Remains Robust: TCS CFO', url: '#', source: 'Moneycontrol', date: 'Jan 12, 2026' },
          { title: 'Europe Weakness Persists in Q3', url: '#', source: 'Financial Express', date: 'Jan 11, 2026' },
          { title: 'TCS Maintains Margin Guidance', url: '#', source: 'CNBC-TV18', date: 'Jan 11, 2026' },
          { title: 'Brokerages Mixed on TCS Post Q3', url: '#', source: 'Business Line', date: 'Jan 10, 2026' },
        ],
      },
      {
        id: 'tcs-2',
        topic: 'GenAI Revenue Monetization Progress',
        summary: 'TCS disclosed $1.5B+ in GenAI-related deal wins. AI.Cloud unit seeing strong adoption for cognitive business operations. However, concerns remain about potential productivity-led headcount reductions industry-wide.',
        sourceCount: 5,
        dateRange: 'Jan 20-28, 2026',
        sentiment: 'NEUTRAL',
        impact: 'HIGH',
        sources: [
          { title: 'TCS GenAI Deal Wins Cross $1.5 Billion', url: '#', source: 'Economic Times', date: 'Jan 28, 2026' },
          { title: 'AI Productivity Gains May Reduce IT Hiring', url: '#', source: 'Business Standard', date: 'Jan 25, 2026' },
          { title: 'TCS AI.Cloud Unit Growth Accelerates', url: '#', source: 'LiveMint', date: 'Jan 23, 2026' },
          { title: 'Industry Debates AI Impact on Employment', url: '#', source: 'Financial Express', date: 'Jan 22, 2026' },
          { title: 'GenAI Pilots Converting to Production', url: '#', source: 'Moneycontrol', date: 'Jan 20, 2026' },
        ],
      },
      {
        id: 'tcs-3',
        topic: 'BFSI Vertical Faces Budget Pressures',
        summary: 'Banking and financial services clients delaying large transformation programs amid macro uncertainty. Regional banking stress in US/Europe impacting project pipelines. TCS BFSI revenue (28% of total) saw flat QoQ growth.',
        sourceCount: 4,
        dateRange: 'Jan 5-12, 2026',
        sentiment: 'NEGATIVE',
        impact: 'MEDIUM',
        sources: [
          { title: 'BFSI IT Spending Remains Cautious', url: '#', source: 'Economic Times', date: 'Jan 12, 2026' },
          { title: 'Regional Bank Failures Impact IT Vendors', url: '#', source: 'Business Standard', date: 'Jan 9, 2026' },
          { title: 'TCS BFSI Vertical Growth Slows', url: '#', source: 'Moneycontrol', date: 'Jan 7, 2026' },
          { title: 'Large Deal Closures Taking Longer', url: '#', source: 'LiveMint', date: 'Jan 5, 2026' },
        ],
      },
    ],
    sentimentTimeline30D: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2026, 1, i - 29).toISOString().split('T')[0],
      sentiment: 0.1 + Math.sin(i / 6) * 0.15,
      price: 3890 + Math.sin(i / 4) * 25 + (i * 0.5),
    })),
    sentimentTimeline90D: Array.from({ length: 90 }, (_, i) => ({
      date: new Date(2026, 1, i - 89).toISOString().split('T')[0],
      sentiment: 0.05 + Math.sin(i / 12) * 0.2,
      price: 3820 + Math.sin(i / 10) * 30 + (i * 0.8),
    })),
    sentimentTimeline180D: Array.from({ length: 180 }, (_, i) => ({
      date: new Date(2026, 1, i - 179).toISOString().split('T')[0],
      sentiment: 0.0 + Math.sin(i / 25) * 0.25,
      price: 3680 + Math.sin(i / 20) * 40 + (i * 1.2),
    })),
    riskAlerts: [
      {
        id: 'tcs-risk-1',
        timestamp: 'Jan 28, 2026 2:30 PM',
        headline: 'US H-1B Visa Policy Changes Under Discussion',
        category: 'REGULATORY',
        details: 'Proposed changes to H-1B visa program could increase costs and restrict offshore delivery model. Industry awaiting final regulations.',
      },
      {
        id: 'tcs-risk-2',
        timestamp: 'Jan 15, 2026 11:00 AM',
        headline: 'Attrition Stabilizing but Wage Inflation Persists',
        category: 'OPERATIONAL',
        details: 'While attrition declined to 12%, wage inflation of 6-8% expected in FY26. Could pressure margins if not offset by automation gains.',
      },
    ],
    sectorCorrelation: {
      text: 'Global IT services spending forecasts from Gartner project 8-10% CAGR through 2028, with enterprise AI adoption accelerating (75% of enterprises expected to deploy AI by 2026 per IDC). TCS is well-positioned with its Topaz AI suite and strong client relationships. However, cloud migration momentum (still only 30% of workloads in public cloud per McKinsey) presents both opportunity and execution risk as legacy modernization projects require significant investment.',
      articles: [
        { title: 'Gartner IT Spending Forecast 2026-2028', url: '#', source: 'Gartner Research' },
        { title: 'IDC: Enterprise AI Adoption Accelerating', url: '#', source: 'IDC AI Spending Guide' },
        { title: 'Cloud Migration Still in Early Stages', url: '#', source: 'McKinsey Cloud Survey' },
      ],
    },
  },

  // Add more stocks...
  INFY: {
    newsDigest: [],
    sentimentTimeline30D: [],
    sentimentTimeline90D: [],
    sentimentTimeline180D: [],
    riskAlerts: [
      {
        id: 'infy-risk-1',
        timestamp: 'Feb 2, 2026 9:15 AM',
        headline: 'SEBI Investigation into Insider Trading Allegations',
        category: 'LITIGATION',
        details: 'Market regulator initiated probe into alleged insider trading by unnamed individuals. Company denied wrongdoing and stated full cooperation.',
      },
      {
        id: 'infy-risk-2',
        timestamp: 'Jan 20, 2026 4:45 PM',
        headline: 'Revenue Conversion Lag from Large Deals',
        category: 'FINANCIAL',
        details: 'Despite strong TCV wins, revenue conversion taking 6-9 months longer than historical average. Could impact FY26 growth targets.',
      },
    ],
    sectorCorrelation: {
      text: 'IT sector facing headwinds from prolonged client spending caution. European clients finally accelerating digital initiatives post-pandemic delays, but US BFSI sector weakness persists.',
      articles: [],
    },
  },

  HDFCBANK: {
    newsDigest: [],
    sentimentTimeline30D: [],
    sentimentTimeline90D: [],
    sentimentTimeline180D: [],
    riskAlerts: [],
    sectorCorrelation: {
      text: 'RBI\'s focus on liquidity management and deposit mobilization is driving industry-wide competition for deposits. Housing demand supported by demographics (10M+ household formations annually) and government infrastructure spending (₹111 lakh crore National Infrastructure Pipeline) create favorable tailwinds for mortgage lending.',
      articles: [
        { title: 'RBI Liquidity Guidelines Impact Banking Sector', url: '#', source: 'Reserve Bank of India' },
        { title: 'Housing Demand Outlook Remains Strong', url: '#', source: 'Census Projections' },
      ],
    },
  },

  TATASTEEL: {
    newsDigest: [],
    sentimentTimeline30D: [],
    sentimentTimeline90D: [],
    sentimentTimeline180D: [],
    riskAlerts: [
      {
        id: 'tata-risk-1',
        timestamp: 'Feb 5, 2026 1:20 PM',
        headline: 'China Steel Exports Surge Pressuring Prices',
        category: 'OPERATIONAL',
        details: 'Chinese steel exports at record levels creating global oversupply. Indian steel prices under pressure, testing $550-600/tonne support.',
      },
      {
        id: 'tata-risk-2',
        timestamp: 'Jan 25, 2026 3:30 PM',
        headline: 'UK Operations Restructuring Costs Higher',
        category: 'FINANCIAL',
        details: 'Port Talbot transition to EAF showing cost overruns. Expected cash burn of ₹5,000-8,000cr annually until restructuring complete.',
      },
      {
        id: 'tata-risk-3',
        timestamp: 'Jan 18, 2026 10:00 AM',
        headline: 'Coking Coal Prices Elevated',
        category: 'OPERATIONAL',
        details: 'Australian coking coal prices remain high at $280-300/tonne vs long-term average of $180. Squeezing steel spreads.',
      },
    ],
    sectorCorrelation: {
      text: 'Government\'s National Infrastructure Pipeline of ₹111 lakh crore supporting long-term steel demand. Ministry of Steel PLI scheme providing ₹6,322 crore incentives for specialty steel. However, China\'s overcapacity and elevated coking coal costs remain near-term headwinds.',
      articles: [
        { title: 'National Infrastructure Pipeline Progress', url: '#', source: 'NITI Aayog' },
        { title: 'Steel PLI Scheme Details', url: '#', source: 'Ministry of Steel' },
      ],
    },
  },
};

export const getNewsSentimentData = (symbol: string): NewsSentimentData => {
  return mockNewsSentimentData[symbol] || mockNewsSentimentData['RELIANCE'];
};
