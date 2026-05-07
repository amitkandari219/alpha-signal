/**
 * Mock Tailwind (Macro/Sector Forces) Data
 *
 * Government policies, sector momentum, commodity correlations, and macro indicators
 */

export type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type RelevanceLevel = 'HIGH' | 'LOW';

export interface GovernmentPolicy {
  id: string;
  name: string;
  effectiveDate: string;
  description: string;
  relevance: string;
  sourceUrl: string;
  impact: ImpactLevel;
}

export interface SectorPerformance {
  period: string;
  sectorReturn: number; // percentage
  nifty500Return: number; // percentage
}

export interface SectorMomentum {
  sectorName: string;
  ranking: number; // 1-24
  totalSectors: number;
  performanceData: SectorPerformance[];
  indexChart3M: { date: string; value: number }[];
}

export interface CommodityData {
  name: string;
  currentPrice: number;
  unit: string;
  change3M: number; // percentage
  correlation: string; // "Strong Positive", "Moderate Negative", etc.
  sparkline: number[];
}

export interface MacroIndicator {
  id: string;
  name: string;
  currentValue: string;
  trend: 'UP' | 'DOWN' | 'FLAT';
  sparkline: number[];
  relevance: RelevanceLevel;
}

export interface TailwindData {
  governmentPolicies: GovernmentPolicy[];
  sectorMomentum: SectorMomentum;
  commodityCorrelation?: {
    commodities: CommodityData[];
    aiNote: string;
  };
  macroIndicators: MacroIndicator[];
}

export const mockTailwindData: Record<string, TailwindData> = {
  RELIANCE: {
    governmentPolicies: [
      {
        id: 'ril-policy-1',
        name: 'National Green Hydrogen Mission',
        effectiveDate: 'Jan 2024',
        description: 'Government allocated ₹19,744 crore for green hydrogen ecosystem development with production targets of 5 MMT by 2030. Includes incentives for electrolyzer manufacturing and pilot projects.',
        relevance: 'Directly benefits Reliance\'s ₹75,000cr green hydrogen and electrolyzer manufacturing plans at Jamnagar.',
        sourceUrl: '#',
        impact: 'HIGH',
      },
      {
        id: 'ril-policy-2',
        name: 'PLI Scheme for Telecom Equipment',
        effectiveDate: 'Mar 2024',
        description: 'Production Linked Incentive worth ₹12,195 crore for domestic manufacturing of telecom and networking products including 5G equipment.',
        relevance: 'Supports Jio\'s 5G infrastructure capex and potential equipment exports, improving unit economics.',
        sourceUrl: '#',
        impact: 'MEDIUM',
      },
      {
        id: 'ril-policy-3',
        name: 'GST Rate Rationalization on Retail',
        effectiveDate: 'Jul 2025',
        description: 'GST Council reduced rates on daily essentials (18% to 12%) and certain electronics (28% to 18%) to boost consumption.',
        relevance: 'Benefits Reliance Retail by improving price competitiveness and driving volume growth in grocery and electronics.',
        sourceUrl: '#',
        impact: 'MEDIUM',
      },
      {
        id: 'ril-policy-4',
        name: 'National Infrastructure Pipeline Phase 2',
        effectiveDate: 'Apr 2025',
        description: 'Government announced ₹111 lakh crore investment in infrastructure through 2030, including smart cities, industrial corridors, and digital infrastructure.',
        relevance: 'Increases fiber, tower, and data center demand for Jio; also benefits petrochemical demand for construction materials.',
        sourceUrl: '#',
        impact: 'HIGH',
      },
    ],
    sectorMomentum: {
      sectorName: 'Diversified Conglomerates',
      ranking: 3,
      totalSectors: 24,
      performanceData: [
        { period: '1M', sectorReturn: 5.2, nifty500Return: 3.1 },
        { period: '3M', sectorReturn: 12.8, nifty500Return: 8.4 },
        { period: '6M', sectorReturn: 18.5, nifty500Return: 11.2 },
        { period: '1Y', sectorReturn: 34.7, nifty500Return: 22.3 },
      ],
      indexChart3M: Array.from({ length: 60 }, (_, i) => ({
        date: new Date(2026, 1, i - 59).toISOString().split('T')[0],
        value: 45200 + i * 80 + Math.sin(i / 5) * 600,
      })),
    },
    commodityCorrelation: {
      commodities: [
        {
          name: 'Brent Crude Oil',
          currentPrice: 84.5,
          unit: '$/bbl',
          change3M: -6.2,
          correlation: 'Strong Positive (O2C Margins)',
          sparkline: [89, 90, 88, 87, 86, 85, 84.5],
        },
        {
          name: 'Naphtha',
          currentPrice: 625,
          unit: '$/tonne',
          change3M: -4.8,
          correlation: 'Moderate Negative (Input Cost)',
          sparkline: [655, 650, 640, 635, 630, 628, 625],
        },
        {
          name: 'Polyester (PTA)',
          currentPrice: 875,
          unit: '$/tonne',
          change3M: 3.2,
          correlation: 'Strong Positive (O2C Spreads)',
          sparkline: [848, 855, 860, 865, 870, 872, 875],
        },
      ],
      aiNote: 'Favorable commodity trends: Lower crude oil prices benefiting refining margins while polyester spreads remain healthy. Current environment supports 200-250bps EBITDA margin expansion in O2C segment over next 2 quarters.',
    },
    macroIndicators: [
      {
        id: 'gdp',
        name: 'GDP Growth Rate',
        currentValue: '7.2%',
        trend: 'UP',
        sparkline: [6.8, 6.9, 7.0, 7.1, 7.2, 7.3],
        relevance: 'HIGH',
      },
      {
        id: 'iip',
        name: 'IIP',
        currentValue: '5.8%',
        trend: 'UP',
        sparkline: [4.5, 4.8, 5.1, 5.4, 5.6, 5.8],
        relevance: 'HIGH',
      },
      {
        id: 'pmi',
        name: 'PMI Manufacturing',
        currentValue: '57.5',
        trend: 'UP',
        sparkline: [54.2, 55.1, 55.8, 56.5, 57.0, 57.5],
        relevance: 'HIGH',
      },
      {
        id: 'usdinr',
        name: 'USD/INR',
        currentValue: '83.25',
        trend: 'DOWN',
        sparkline: [83.8, 83.7, 83.6, 83.4, 83.3, 83.25],
        relevance: 'MEDIUM',
      },
      {
        id: 'bond',
        name: '10Y Bond Yield',
        currentValue: '6.95%',
        trend: 'DOWN',
        sparkline: [7.15, 7.10, 7.05, 7.00, 6.97, 6.95],
        relevance: 'LOW',
      },
      {
        id: 'cpi',
        name: 'CPI Inflation',
        currentValue: '5.1%',
        trend: 'DOWN',
        sparkline: [5.8, 5.6, 5.4, 5.3, 5.2, 5.1],
        relevance: 'HIGH',
      },
    ],
  },

  TCS: {
    governmentPolicies: [
      {
        id: 'tcs-policy-1',
        name: 'Digital India 2.0 Initiative',
        effectiveDate: 'Feb 2025',
        description: 'Government allocated ₹35,000 crore for digital infrastructure, e-governance platforms, and cybersecurity initiatives across ministries and state governments.',
        relevance: 'Expands addressable market for TCS in government IT services, cloud migrations, and digital transformation projects.',
        sourceUrl: '#',
        impact: 'HIGH',
      },
      {
        id: 'tcs-policy-2',
        name: 'Software Product PLI Scheme',
        effectiveDate: 'Apr 2024',
        description: 'Production Linked Incentive worth ₹7,000 crore for development of Made-in-India software products and SaaS platforms.',
        relevance: 'Benefits TCS product engineering services and potential to launch domestic software products with cost advantages.',
        sourceUrl: '#',
        impact: 'MEDIUM',
      },
      {
        id: 'tcs-policy-3',
        name: 'National Data Governance Framework',
        effectiveDate: 'Aug 2025',
        description: 'Mandatory data localization requirements for critical sectors (BFSI, healthcare, government). Data must be stored within India with strict compliance norms.',
        relevance: 'Increases demand for domestic data centers and cloud services where TCS has strong capabilities and partnerships.',
        sourceUrl: '#',
        impact: 'HIGH',
      },
    ],
    sectorMomentum: {
      sectorName: 'IT Services',
      ranking: 8,
      totalSectors: 24,
      performanceData: [
        { period: '1M', sectorReturn: 2.8, nifty500Return: 3.1 },
        { period: '3M', sectorReturn: 6.5, nifty500Return: 8.4 },
        { period: '6M', sectorReturn: 9.2, nifty500Return: 11.2 },
        { period: '1Y', sectorReturn: 18.4, nifty500Return: 22.3 },
      ],
      indexChart3M: Array.from({ length: 60 }, (_, i) => ({
        date: new Date(2026, 1, i - 59).toISOString().split('T')[0],
        value: 28500 + i * 25 + Math.sin(i / 7) * 400,
      })),
    },
    macroIndicators: [
      {
        id: 'gdp',
        name: 'GDP Growth Rate',
        currentValue: '7.2%',
        trend: 'UP',
        sparkline: [6.8, 6.9, 7.0, 7.1, 7.2, 7.3],
        relevance: 'MEDIUM',
      },
      {
        id: 'iip',
        name: 'IIP',
        currentValue: '5.8%',
        trend: 'UP',
        sparkline: [4.5, 4.8, 5.1, 5.4, 5.6, 5.8],
        relevance: 'LOW',
      },
      {
        id: 'pmi',
        name: 'PMI Manufacturing',
        currentValue: '57.5',
        trend: 'UP',
        sparkline: [54.2, 55.1, 55.8, 56.5, 57.0, 57.5],
        relevance: 'LOW',
      },
      {
        id: 'usdinr',
        name: 'USD/INR',
        currentValue: '83.25',
        trend: 'DOWN',
        sparkline: [83.8, 83.7, 83.6, 83.4, 83.3, 83.25],
        relevance: 'HIGH',
      },
      {
        id: 'bond',
        name: '10Y Bond Yield',
        currentValue: '6.95%',
        trend: 'DOWN',
        sparkline: [7.15, 7.10, 7.05, 7.00, 6.97, 6.95],
        relevance: 'LOW',
      },
      {
        id: 'cpi',
        name: 'CPI Inflation',
        currentValue: '5.1%',
        trend: 'DOWN',
        sparkline: [5.8, 5.6, 5.4, 5.3, 5.2, 5.1],
        relevance: 'MEDIUM',
      },
    ],
  },

  INFY: {
    governmentPolicies: [
      {
        id: 'infy-policy-1',
        name: 'Digital India 2.0 Initiative',
        effectiveDate: 'Feb 2025',
        description: 'Government allocated ₹35,000 crore for digital infrastructure, e-governance platforms, and cybersecurity initiatives.',
        relevance: 'Expands market for Infosys in government IT services and digital transformation.',
        sourceUrl: '#',
        impact: 'HIGH',
      },
      {
        id: 'infy-policy-2',
        name: 'National Data Governance Framework',
        effectiveDate: 'Aug 2025',
        description: 'Mandatory data localization requirements for critical sectors with strict compliance norms.',
        relevance: 'Increases demand for domestic data centers and cloud services where Infosys has strong capabilities.',
        sourceUrl: '#',
        impact: 'HIGH',
      },
    ],
    sectorMomentum: {
      sectorName: 'IT Services',
      ranking: 8,
      totalSectors: 24,
      performanceData: [
        { period: '1M', sectorReturn: 2.8, nifty500Return: 3.1 },
        { period: '3M', sectorReturn: 6.5, nifty500Return: 8.4 },
        { period: '6M', sectorReturn: 9.2, nifty500Return: 11.2 },
        { period: '1Y', sectorReturn: 18.4, nifty500Return: 22.3 },
      ],
      indexChart3M: Array.from({ length: 60 }, (_, i) => ({
        date: new Date(2026, 1, i - 59).toISOString().split('T')[0],
        value: 28500 + i * 25 + Math.sin(i / 7) * 400,
      })),
    },
    macroIndicators: [
      {
        id: 'gdp',
        name: 'GDP Growth Rate',
        currentValue: '7.2%',
        trend: 'UP',
        sparkline: [6.8, 6.9, 7.0, 7.1, 7.2, 7.3],
        relevance: 'MEDIUM',
      },
      {
        id: 'iip',
        name: 'IIP',
        currentValue: '5.8%',
        trend: 'UP',
        sparkline: [4.5, 4.8, 5.1, 5.4, 5.6, 5.8],
        relevance: 'LOW',
      },
      {
        id: 'pmi',
        name: 'PMI Manufacturing',
        currentValue: '57.5',
        trend: 'UP',
        sparkline: [54.2, 55.1, 55.8, 56.5, 57.0, 57.5],
        relevance: 'LOW',
      },
      {
        id: 'usdinr',
        name: 'USD/INR',
        currentValue: '83.25',
        trend: 'DOWN',
        sparkline: [83.8, 83.7, 83.6, 83.4, 83.3, 83.25],
        relevance: 'HIGH',
      },
      {
        id: 'bond',
        name: '10Y Bond Yield',
        currentValue: '6.95%',
        trend: 'DOWN',
        sparkline: [7.15, 7.10, 7.05, 7.00, 6.97, 6.95],
        relevance: 'LOW',
      },
      {
        id: 'cpi',
        name: 'CPI Inflation',
        currentValue: '5.1%',
        trend: 'DOWN',
        sparkline: [5.8, 5.6, 5.4, 5.3, 5.2, 5.1],
        relevance: 'MEDIUM',
      },
    ],
  },

  HDFCBANK: {
    governmentPolicies: [
      {
        id: 'hdfc-policy-1',
        name: 'Pradhan Mantri Awas Yojana Extension',
        effectiveDate: 'Jan 2025',
        description: 'Government extended PMAY scheme with ₹48,000 crore allocation targeting 1 crore urban housing units. Includes interest subsidy for EWS/LIG segments and infrastructure development.',
        relevance: 'Directly benefits HDFC Bank\'s home loan portfolio (34% of retail loans) with government-backed demand and subsidy support.',
        sourceUrl: '#',
        impact: 'HIGH',
      },
      {
        id: 'hdfc-policy-2',
        name: 'RBI Liquidity Adjustment Framework',
        effectiveDate: 'Dec 2024',
        description: 'RBI introduced new liquidity windows for banks maintaining LCR above 110%, providing access to cheaper funds for incremental lending.',
        relevance: 'Benefits HDFC Bank with strong liquidity position (LCR ~125%) by reducing cost of funds and improving NIMs.',
        sourceUrl: '#',
        impact: 'MEDIUM',
      },
      {
        id: 'hdfc-policy-3',
        name: 'National Infrastructure Pipeline',
        effectiveDate: 'Apr 2025',
        description: 'Government announced ₹111 lakh crore infrastructure investment including roads, railways, ports, and urban development through 2030.',
        relevance: 'Creates demand for project finance and working capital loans; also supports real estate sector recovery.',
        sourceUrl: '#',
        impact: 'HIGH',
      },
      {
        id: 'hdfc-policy-4',
        name: 'GST Compliance Digitization',
        effectiveDate: 'Jun 2025',
        description: 'Mandatory e-invoicing extended to businesses with turnover >₹5 crore, integrating with banking systems for real-time GST credit verification.',
        relevance: 'Strengthens HDFC Bank\'s SME banking proposition with integrated GST solutions and working capital offerings.',
        sourceUrl: '#',
        impact: 'MEDIUM',
      },
    ],
    sectorMomentum: {
      sectorName: 'Private Banks',
      ranking: 5,
      totalSectors: 24,
      performanceData: [
        { period: '1M', sectorReturn: 4.2, nifty500Return: 3.1 },
        { period: '3M', sectorReturn: 10.8, nifty500Return: 8.4 },
        { period: '6M', sectorReturn: 15.3, nifty500Return: 11.2 },
        { period: '1Y', sectorReturn: 28.7, nifty500Return: 22.3 },
      ],
      indexChart3M: Array.from({ length: 60 }, (_, i) => ({
        date: new Date(2026, 1, i - 59).toISOString().split('T')[0],
        value: 35600 + i * 95 + Math.sin(i / 6) * 550,
      })),
    },
    macroIndicators: [
      {
        id: 'gdp',
        name: 'GDP Growth Rate',
        currentValue: '7.2%',
        trend: 'UP',
        sparkline: [6.8, 6.9, 7.0, 7.1, 7.2, 7.3],
        relevance: 'HIGH',
      },
      {
        id: 'iip',
        name: 'IIP',
        currentValue: '5.8%',
        trend: 'UP',
        sparkline: [4.5, 4.8, 5.1, 5.4, 5.6, 5.8],
        relevance: 'HIGH',
      },
      {
        id: 'pmi',
        name: 'PMI Manufacturing',
        currentValue: '57.5',
        trend: 'UP',
        sparkline: [54.2, 55.1, 55.8, 56.5, 57.0, 57.5],
        relevance: 'HIGH',
      },
      {
        id: 'usdinr',
        name: 'USD/INR',
        currentValue: '83.25',
        trend: 'DOWN',
        sparkline: [83.8, 83.7, 83.6, 83.4, 83.3, 83.25],
        relevance: 'MEDIUM',
      },
      {
        id: 'bond',
        name: '10Y Bond Yield',
        currentValue: '6.95%',
        trend: 'DOWN',
        sparkline: [7.15, 7.10, 7.05, 7.00, 6.97, 6.95],
        relevance: 'HIGH',
      },
      {
        id: 'cpi',
        name: 'CPI Inflation',
        currentValue: '5.1%',
        trend: 'DOWN',
        sparkline: [5.8, 5.6, 5.4, 5.3, 5.2, 5.1],
        relevance: 'HIGH',
      },
    ],
  },

  TATASTEEL: {
    governmentPolicies: [
      {
        id: 'tata-policy-1',
        name: 'National Steel Policy 2030',
        effectiveDate: 'Mar 2024',
        description: 'Government targets 300 MT steel production capacity by 2030-31 with PLI incentives of ₹6,322 crore for specialty steel. Includes import duty protection and scrap policy reforms.',
        relevance: 'Benefits Tata Steel through PLI incentives for specialty steel and protection from Chinese dumping via higher import duties.',
        sourceUrl: '#',
        impact: 'HIGH',
      },
      {
        id: 'tata-policy-2',
        name: 'National Infrastructure Pipeline',
        effectiveDate: 'Apr 2025',
        description: 'Government committed ₹111 lakh crore for infrastructure including roads (₹32L cr), railways (₹18L cr), and urban development (₹25L cr).',
        relevance: 'Creates structural demand for steel from infrastructure projects, supporting 8-10% domestic steel demand CAGR.',
        sourceUrl: '#',
        impact: 'HIGH',
      },
      {
        id: 'tata-policy-3',
        name: 'Scrap Recycling Policy',
        effectiveDate: 'Oct 2024',
        description: 'New policy promotes use of scrap steel with lower GST (5% vs 18% on pig iron) and incentives for collection infrastructure.',
        relevance: 'Reduces raw material costs for Tata Steel\'s EAF operations; UK Port Talbot transition to EAF becomes more viable.',
        sourceUrl: '#',
        impact: 'MEDIUM',
      },
      {
        id: 'tata-policy-4',
        name: 'Green Steel Mission',
        effectiveDate: 'Jun 2025',
        description: 'Government launched mission for low-carbon steel with ₹5,000 crore funding. Targets 10% green steel production by 2030 with carbon credit trading.',
        relevance: 'Aligns with Tata Steel\'s hydrogen-based steel roadmap; carbon credits could offset 2-3% of costs post-2027.',
        sourceUrl: '#',
        impact: 'MEDIUM',
      },
    ],
    sectorMomentum: {
      sectorName: 'Metals & Mining',
      ranking: 18,
      totalSectors: 24,
      performanceData: [
        { period: '1M', sectorReturn: 1.2, nifty500Return: 3.1 },
        { period: '3M', sectorReturn: -2.5, nifty500Return: 8.4 },
        { period: '6M', sectorReturn: 3.8, nifty500Return: 11.2 },
        { period: '1Y', sectorReturn: 8.5, nifty500Return: 22.3 },
      ],
      indexChart3M: Array.from({ length: 60 }, (_, i) => ({
        date: new Date(2026, 1, i - 59).toISOString().split('T')[0],
        value: 12800 - i * 15 + Math.sin(i / 8) * 300,
      })),
    },
    commodityCorrelation: {
      commodities: [
        {
          name: 'Iron Ore (Fe 62%)',
          currentPrice: 118,
          unit: '$/tonne',
          change3M: -8.5,
          correlation: 'Strong Negative (Input Cost)',
          sparkline: [129, 126, 123, 121, 119, 118.5, 118],
        },
        {
          name: 'Coking Coal',
          currentPrice: 285,
          unit: '$/tonne',
          change3M: 12.5,
          correlation: 'Strong Negative (Input Cost)',
          sparkline: [253, 260, 268, 275, 280, 283, 285],
        },
        {
          name: 'Hot Rolled Coil (India)',
          currentPrice: 52500,
          unit: '₹/tonne',
          change3M: -4.2,
          correlation: 'Strong Positive (Realization)',
          sparkline: [54800, 54200, 53500, 53000, 52700, 52550, 52500],
        },
        {
          name: 'Zinc (LME)',
          currentPrice: 2685,
          unit: '$/tonne',
          change3M: -6.8,
          correlation: 'Moderate Positive (By-product)',
          sparkline: [2880, 2820, 2760, 2720, 2700, 2690, 2685],
        },
      ],
      aiNote: 'Challenging commodity environment: Elevated coking coal prices (+12.5% in 3M) squeezing steel spreads despite lower iron ore. Hot rolled coil prices under pressure from Chinese exports. Expect 150-200bps margin compression in India operations if trends persist through Q1 FY26.',
    },
    macroIndicators: [
      {
        id: 'gdp',
        name: 'GDP Growth Rate',
        currentValue: '7.2%',
        trend: 'UP',
        sparkline: [6.8, 6.9, 7.0, 7.1, 7.2, 7.3],
        relevance: 'HIGH',
      },
      {
        id: 'iip',
        name: 'IIP',
        currentValue: '5.8%',
        trend: 'UP',
        sparkline: [4.5, 4.8, 5.1, 5.4, 5.6, 5.8],
        relevance: 'HIGH',
      },
      {
        id: 'pmi',
        name: 'PMI Manufacturing',
        currentValue: '57.5',
        trend: 'UP',
        sparkline: [54.2, 55.1, 55.8, 56.5, 57.0, 57.5],
        relevance: 'HIGH',
      },
      {
        id: 'usdinr',
        name: 'USD/INR',
        currentValue: '83.25',
        trend: 'DOWN',
        sparkline: [83.8, 83.7, 83.6, 83.4, 83.3, 83.25],
        relevance: 'MEDIUM',
      },
      {
        id: 'bond',
        name: '10Y Bond Yield',
        currentValue: '6.95%',
        trend: 'DOWN',
        sparkline: [7.15, 7.10, 7.05, 7.00, 6.97, 6.95],
        relevance: 'MEDIUM',
      },
      {
        id: 'cpi',
        name: 'CPI Inflation',
        currentValue: '5.1%',
        trend: 'DOWN',
        sparkline: [5.8, 5.6, 5.4, 5.3, 5.2, 5.1],
        relevance: 'HIGH',
      },
    ],
  },
};

export const getTailwindData = (symbol: string): TailwindData => {
  return mockTailwindData[symbol] || mockTailwindData['RELIANCE'];
};
