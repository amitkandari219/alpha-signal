/**
 * Mock Risk Dashboard Data
 *
 * Red flags, earnings quality, governance, and volatility metrics
 */

export type RiskStatus = 'CLEAR' | 'WATCH' | 'FLAGGED';
export type EarningsQualityLevel = 'LOW' | 'MODERATE' | 'HIGH';
export type VolatilityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RedFlagCategory {
  id: string;
  name: string;
  status: RiskStatus;
  description?: string; // Only for WATCH or FLAGGED
  icon: 'Shield' | 'AlertTriangle' | 'Users' | 'TrendingDown' | 'FileText' | 'Scale' | 'Gavel' | 'AlertCircle';
}

export interface EarningsQualityFactor {
  name: string;
  shortName: string;
  value: number;
  normalRange: string;
  status: 'NORMAL' | 'CONCERNING';
}

export interface EarningsQuality {
  score: number; // 0-100
  probabilityLevel: EarningsQualityLevel;
  factors: EarningsQualityFactor[];
}

export interface GovernanceFactor {
  name: string;
  current: number;
  threshold: number;
  unit: string;
  isInverse?: boolean; // true if lower is better
}

export interface GovernanceRisk {
  score: number; // 0-100, lower is better
  factors: GovernanceFactor[];
}

export interface VolatilityMetrics {
  historicalVolatility1Y: {
    value: number; // percentage
    classification: VolatilityLevel;
  };
  beta: {
    value: number;
    interpretation: string;
  };
  maxDrawdown: {
    oneYear: number; // percentage
    threeYear: number; // percentage
    chartData: { date: string; drawdown: number }[]; // Last 1Y
  };
  earningsSurprise: {
    variance: number;
    quarters: {
      quarter: string;
      actual: number;
      expected: number;
      surprise: number;
    }[];
  };
}

export interface RiskDashboardData {
  redFlags: RedFlagCategory[];
  earningsQuality: EarningsQuality;
  governanceRisk: GovernanceRisk;
  volatilityMetrics: VolatilityMetrics;
}

export const mockRiskData: Record<string, RiskDashboardData> = {
  RELIANCE: {
    redFlags: [
      {
        id: 'promoter-pledge',
        name: 'Promoter Pledge',
        status: 'CLEAR',
        icon: 'Shield',
      },
      {
        id: 'auditor-concerns',
        name: 'Auditor Concerns',
        status: 'CLEAR',
        icon: 'FileText',
      },
      {
        id: 'related-party',
        name: 'Related-Party Transactions',
        status: 'WATCH',
        description: 'RPT at 12% of revenue, within industry norms but monitor for increases',
        icon: 'Users',
      },
      {
        id: 'debt-spiral',
        name: 'Debt Spiral Risk',
        status: 'CLEAR',
        icon: 'TrendingDown',
      },
      {
        id: 'earnings-manipulation',
        name: 'Earnings Manipulation',
        status: 'CLEAR',
        icon: 'AlertTriangle',
      },
      {
        id: 'governance',
        name: 'Governance Quality',
        status: 'CLEAR',
        icon: 'Shield',
      },
      {
        id: 'litigation',
        name: 'Litigation Exposure',
        status: 'WATCH',
        description: 'Ongoing disputes with telecom competitors, ₹2,500cr contingent liability',
        icon: 'Gavel',
      },
      {
        id: 'regulatory',
        name: 'Regulatory Risk',
        status: 'CLEAR',
        icon: 'AlertCircle',
      },
    ],
    earningsQuality: {
      score: 78,
      probabilityLevel: 'LOW',
      factors: [
        { name: 'Days Sales in Receivables Index', shortName: 'DSRI', value: 1.08, normalRange: '0.9 - 1.2', status: 'NORMAL' },
        { name: 'Gross Margin Index', shortName: 'GMI', value: 1.02, normalRange: '0.95 - 1.1', status: 'NORMAL' },
        { name: 'Asset Quality Index', shortName: 'AQI', value: 0.98, normalRange: '0.9 - 1.1', status: 'NORMAL' },
        { name: 'Sales Growth Index', shortName: 'SGI', value: 1.15, normalRange: '0.9 - 1.3', status: 'NORMAL' },
        { name: 'Depreciation Index', shortName: 'DEPI', value: 1.05, normalRange: '0.9 - 1.15', status: 'NORMAL' },
        { name: 'SGA Expense Index', shortName: 'SGAI', value: 0.97, normalRange: '0.9 - 1.1', status: 'NORMAL' },
        { name: 'Accruals to Total Assets', shortName: 'Accruals', value: 0.045, normalRange: '-0.05 - 0.08', status: 'NORMAL' },
        { name: 'Leverage Index', shortName: 'Leverage', value: 1.12, normalRange: '0.9 - 1.2', status: 'NORMAL' },
      ],
    },
    governanceRisk: {
      score: 25,
      factors: [
        { name: 'Board Independence', current: 58, threshold: 50, unit: '%', isInverse: false },
        { name: 'Auditor Changes (5Y)', current: 0, threshold: 2, unit: 'times', isInverse: true },
        { name: 'Related-Party Txns', current: 12, threshold: 15, unit: '% of revenue', isInverse: true },
        { name: 'Promoter Pledge', current: 0, threshold: 20, unit: '% of holding', isInverse: true },
        { name: 'SEBI Actions (5Y)', current: 0, threshold: 1, unit: 'count', isInverse: true },
      ],
    },
    volatilityMetrics: {
      historicalVolatility1Y: {
        value: 22.5,
        classification: 'MEDIUM',
      },
      beta: {
        value: 1.08,
        interpretation: 'Slightly more volatile than market, moves 8% more than Nifty 500',
      },
      maxDrawdown: {
        oneYear: -12.3,
        threeYear: -18.5,
        chartData: Array.from({ length: 252 }, (_, i) => ({
          date: new Date(2025, 1, i - 251).toISOString().split('T')[0],
          drawdown: Math.min(0, -Math.abs(Math.sin(i / 40) * 12 + Math.random() * 3)),
        })),
      },
      earningsSurprise: {
        variance: 3.2,
        quarters: [
          { quarter: 'Q3 FY25', actual: 18.5, expected: 17.8, surprise: 3.9 },
          { quarter: 'Q2 FY25', actual: 17.2, expected: 17.5, surprise: -1.7 },
          { quarter: 'Q1 FY25', actual: 16.8, expected: 16.2, surprise: 3.7 },
          { quarter: 'Q4 FY24', actual: 19.1, expected: 18.8, surprise: 1.6 },
          { quarter: 'Q3 FY24', actual: 17.5, expected: 17.0, surprise: 2.9 },
          { quarter: 'Q2 FY24', actual: 16.2, expected: 17.2, surprise: -5.8 },
          { quarter: 'Q1 FY24', actual: 15.8, expected: 15.5, surprise: 1.9 },
          { quarter: 'Q4 FY23', actual: 18.0, expected: 17.8, surprise: 1.1 },
        ],
      },
    },
  },

  TCS: {
    redFlags: [
      { id: 'promoter-pledge', name: 'Promoter Pledge', status: 'CLEAR', icon: 'Shield' },
      { id: 'auditor-concerns', name: 'Auditor Concerns', status: 'CLEAR', icon: 'FileText' },
      { id: 'related-party', name: 'Related-Party Transactions', status: 'CLEAR', icon: 'Users' },
      { id: 'debt-spiral', name: 'Debt Spiral Risk', status: 'CLEAR', icon: 'TrendingDown' },
      { id: 'earnings-manipulation', name: 'Earnings Manipulation', status: 'CLEAR', icon: 'AlertTriangle' },
      { id: 'governance', name: 'Governance Quality', status: 'CLEAR', icon: 'Shield' },
      { id: 'litigation', name: 'Litigation Exposure', status: 'CLEAR', icon: 'Gavel' },
      { id: 'regulatory', name: 'Regulatory Risk', status: 'WATCH', description: 'H-1B visa policy changes under discussion, could impact margin by 100-150bps', icon: 'AlertCircle' },
    ],
    earningsQuality: {
      score: 82,
      probabilityLevel: 'LOW',
      factors: [
        { name: 'Days Sales in Receivables Index', shortName: 'DSRI', value: 1.05, normalRange: '0.9 - 1.2', status: 'NORMAL' },
        { name: 'Gross Margin Index', shortName: 'GMI', value: 0.98, normalRange: '0.95 - 1.1', status: 'NORMAL' },
        { name: 'Asset Quality Index', shortName: 'AQI', value: 0.95, normalRange: '0.9 - 1.1', status: 'NORMAL' },
        { name: 'Sales Growth Index', shortName: 'SGI', value: 1.08, normalRange: '0.9 - 1.3', status: 'NORMAL' },
        { name: 'Depreciation Index', shortName: 'DEPI', value: 1.02, normalRange: '0.9 - 1.15', status: 'NORMAL' },
        { name: 'SGA Expense Index', shortName: 'SGAI', value: 1.01, normalRange: '0.9 - 1.1', status: 'NORMAL' },
        { name: 'Accruals to Total Assets', shortName: 'Accruals', value: 0.028, normalRange: '-0.05 - 0.08', status: 'NORMAL' },
        { name: 'Leverage Index', shortName: 'Leverage', value: 0.92, normalRange: '0.9 - 1.2', status: 'NORMAL' },
      ],
    },
    governanceRisk: {
      score: 18,
      factors: [
        { name: 'Board Independence', current: 67, threshold: 50, unit: '%', isInverse: false },
        { name: 'Auditor Changes (5Y)', current: 0, threshold: 2, unit: 'times', isInverse: true },
        { name: 'Related-Party Txns', current: 4, threshold: 15, unit: '% of revenue', isInverse: true },
        { name: 'Promoter Pledge', current: 0, threshold: 20, unit: '% of holding', isInverse: true },
        { name: 'SEBI Actions (5Y)', current: 0, threshold: 1, unit: 'count', isInverse: true },
      ],
    },
    volatilityMetrics: {
      historicalVolatility1Y: {
        value: 18.2,
        classification: 'LOW',
      },
      beta: {
        value: 0.85,
        interpretation: 'Less volatile than market, moves 15% less than Nifty 500',
      },
      maxDrawdown: {
        oneYear: -8.5,
        threeYear: -14.2,
        chartData: Array.from({ length: 252 }, (_, i) => ({
          date: new Date(2025, 1, i - 251).toISOString().split('T')[0],
          drawdown: Math.min(0, -Math.abs(Math.sin(i / 50) * 8 + Math.random() * 2)),
        })),
      },
      earningsSurprise: {
        variance: 2.1,
        quarters: [
          { quarter: 'Q3 FY25', actual: 28.5, expected: 28.2, surprise: 1.1 },
          { quarter: 'Q2 FY25', actual: 27.8, expected: 27.5, surprise: 1.1 },
          { quarter: 'Q1 FY25', actual: 26.9, expected: 27.2, surprise: -1.1 },
          { quarter: 'Q4 FY24', actual: 29.2, expected: 28.8, surprise: 1.4 },
          { quarter: 'Q3 FY24', actual: 27.5, expected: 27.0, surprise: 1.9 },
          { quarter: 'Q2 FY24', actual: 26.8, expected: 27.5, surprise: -2.5 },
          { quarter: 'Q1 FY24', actual: 25.5, expected: 25.8, surprise: -1.2 },
          { quarter: 'Q4 FY23', actual: 28.0, expected: 27.5, surprise: 1.8 },
        ],
      },
    },
  },

  INFY: {
    redFlags: [
      { id: 'promoter-pledge', name: 'Promoter Pledge', status: 'CLEAR', icon: 'Shield' },
      { id: 'auditor-concerns', name: 'Auditor Concerns', status: 'WATCH', description: 'Whistleblower complaint in 2019, fully resolved but historical concern', icon: 'FileText' },
      { id: 'related-party', name: 'Related-Party Transactions', status: 'CLEAR', icon: 'Users' },
      { id: 'debt-spiral', name: 'Debt Spiral Risk', status: 'CLEAR', icon: 'TrendingDown' },
      { id: 'earnings-manipulation', name: 'Earnings Manipulation', status: 'CLEAR', icon: 'AlertTriangle' },
      { id: 'governance', name: 'Governance Quality', status: 'CLEAR', icon: 'Shield' },
      { id: 'litigation', name: 'Litigation Exposure', status: 'FLAGGED', description: 'SEBI insider trading investigation ongoing, potential ₹1,200cr penalty exposure', icon: 'Gavel' },
      { id: 'regulatory', name: 'Regulatory Risk', status: 'WATCH', description: 'H-1B visa policy changes could impact delivery model', icon: 'AlertCircle' },
    ],
    earningsQuality: {
      score: 75,
      probabilityLevel: 'LOW',
      factors: [
        { name: 'Days Sales in Receivables Index', shortName: 'DSRI', value: 1.15, normalRange: '0.9 - 1.2', status: 'NORMAL' },
        { name: 'Gross Margin Index', shortName: 'GMI', value: 1.05, normalRange: '0.95 - 1.1', status: 'NORMAL' },
        { name: 'Asset Quality Index', shortName: 'AQI', value: 1.02, normalRange: '0.9 - 1.1', status: 'NORMAL' },
        { name: 'Sales Growth Index', shortName: 'SGI', value: 1.12, normalRange: '0.9 - 1.3', status: 'NORMAL' },
        { name: 'Depreciation Index', shortName: 'DEPI', value: 1.08, normalRange: '0.9 - 1.15', status: 'NORMAL' },
        { name: 'SGA Expense Index', shortName: 'SGAI', value: 1.06, normalRange: '0.9 - 1.1', status: 'NORMAL' },
        { name: 'Accruals to Total Assets', shortName: 'Accruals', value: 0.055, normalRange: '-0.05 - 0.08', status: 'NORMAL' },
        { name: 'Leverage Index', shortName: 'Leverage', value: 0.95, normalRange: '0.9 - 1.2', status: 'NORMAL' },
      ],
    },
    governanceRisk: {
      score: 28,
      factors: [
        { name: 'Board Independence', current: 62, threshold: 50, unit: '%', isInverse: false },
        { name: 'Auditor Changes (5Y)', current: 1, threshold: 2, unit: 'times', isInverse: true },
        { name: 'Related-Party Txns', current: 6, threshold: 15, unit: '% of revenue', isInverse: true },
        { name: 'Promoter Pledge', current: 0, threshold: 20, unit: '% of holding', isInverse: true },
        { name: 'SEBI Actions (5Y)', current: 1, threshold: 1, unit: 'count', isInverse: true },
      ],
    },
    volatilityMetrics: {
      historicalVolatility1Y: {
        value: 24.8,
        classification: 'MEDIUM',
      },
      beta: {
        value: 0.92,
        interpretation: 'Slightly less volatile than market, moves 8% less than Nifty 500',
      },
      maxDrawdown: {
        oneYear: -15.2,
        threeYear: -22.8,
        chartData: Array.from({ length: 252 }, (_, i) => ({
          date: new Date(2025, 1, i - 251).toISOString().split('T')[0],
          drawdown: Math.min(0, -Math.abs(Math.sin(i / 45) * 15 + Math.random() * 4)),
        })),
      },
      earningsSurprise: {
        variance: 4.5,
        quarters: [
          { quarter: 'Q3 FY25', actual: 22.5, expected: 23.2, surprise: -3.0 },
          { quarter: 'Q2 FY25', actual: 21.8, expected: 21.5, surprise: 1.4 },
          { quarter: 'Q1 FY25', actual: 20.2, expected: 21.5, surprise: -6.0 },
          { quarter: 'Q4 FY24', actual: 23.8, expected: 22.5, surprise: 5.8 },
          { quarter: 'Q3 FY24', actual: 21.5, expected: 21.0, surprise: 2.4 },
          { quarter: 'Q2 FY24', actual: 20.8, expected: 22.0, surprise: -5.5 },
          { quarter: 'Q1 FY24', actual: 19.5, expected: 19.8, surprise: -1.5 },
          { quarter: 'Q4 FY23', actual: 22.0, expected: 21.2, surprise: 3.8 },
        ],
      },
    },
  },

  HDFCBANK: {
    redFlags: [
      { id: 'promoter-pledge', name: 'Promoter Pledge', status: 'CLEAR', icon: 'Shield' },
      { id: 'auditor-concerns', name: 'Auditor Concerns', status: 'CLEAR', icon: 'FileText' },
      { id: 'related-party', name: 'Related-Party Transactions', status: 'CLEAR', icon: 'Users' },
      { id: 'debt-spiral', name: 'Debt Spiral Risk', status: 'CLEAR', icon: 'TrendingDown' },
      { id: 'earnings-manipulation', name: 'Earnings Manipulation', status: 'CLEAR', icon: 'AlertTriangle' },
      { id: 'governance', name: 'Governance Quality', status: 'CLEAR', icon: 'Shield' },
      { id: 'litigation', name: 'Litigation Exposure', status: 'CLEAR', icon: 'Gavel' },
      { id: 'regulatory', name: 'Regulatory Risk', status: 'WATCH', description: 'RBI increasing scrutiny on digital lending practices, compliance costs may rise', icon: 'AlertCircle' },
    ],
    earningsQuality: {
      score: 85,
      probabilityLevel: 'LOW',
      factors: [
        { name: 'Days Sales in Receivables Index', shortName: 'DSRI', value: 1.02, normalRange: '0.9 - 1.2', status: 'NORMAL' },
        { name: 'Gross Margin Index', shortName: 'GMI', value: 0.97, normalRange: '0.95 - 1.1', status: 'NORMAL' },
        { name: 'Asset Quality Index', shortName: 'AQI', value: 0.94, normalRange: '0.9 - 1.1', status: 'NORMAL' },
        { name: 'Sales Growth Index', shortName: 'SGI', value: 1.18, normalRange: '0.9 - 1.3', status: 'NORMAL' },
        { name: 'Depreciation Index', shortName: 'DEPI', value: 1.01, normalRange: '0.9 - 1.15', status: 'NORMAL' },
        { name: 'SGA Expense Index', shortName: 'SGAI', value: 0.98, normalRange: '0.9 - 1.1', status: 'NORMAL' },
        { name: 'Accruals to Total Assets', shortName: 'Accruals', value: 0.032, normalRange: '-0.05 - 0.08', status: 'NORMAL' },
        { name: 'Leverage Index', shortName: 'Leverage', value: 1.08, normalRange: '0.9 - 1.2', status: 'NORMAL' },
      ],
    },
    governanceRisk: {
      score: 15,
      factors: [
        { name: 'Board Independence', current: 72, threshold: 50, unit: '%', isInverse: false },
        { name: 'Auditor Changes (5Y)', current: 0, threshold: 2, unit: 'times', isInverse: true },
        { name: 'Related-Party Txns', current: 2, threshold: 15, unit: '% of revenue', isInverse: true },
        { name: 'Promoter Pledge', current: 0, threshold: 20, unit: '% of holding', isInverse: true },
        { name: 'SEBI Actions (5Y)', current: 0, threshold: 1, unit: 'count', isInverse: true },
      ],
    },
    volatilityMetrics: {
      historicalVolatility1Y: {
        value: 20.5,
        classification: 'MEDIUM',
      },
      beta: {
        value: 0.98,
        interpretation: 'Similar volatility to market, moves in line with Nifty 500',
      },
      maxDrawdown: {
        oneYear: -10.8,
        threeYear: -16.5,
        chartData: Array.from({ length: 252 }, (_, i) => ({
          date: new Date(2025, 1, i - 251).toISOString().split('T')[0],
          drawdown: Math.min(0, -Math.abs(Math.sin(i / 48) * 10 + Math.random() * 2.5)),
        })),
      },
      earningsSurprise: {
        variance: 2.8,
        quarters: [
          { quarter: 'Q3 FY25', actual: 42.5, expected: 41.8, surprise: 1.7 },
          { quarter: 'Q2 FY25', actual: 41.2, expected: 41.0, surprise: 0.5 },
          { quarter: 'Q1 FY25', actual: 39.8, expected: 40.5, surprise: -1.7 },
          { quarter: 'Q4 FY24', actual: 43.2, expected: 42.0, surprise: 2.9 },
          { quarter: 'Q3 FY24', actual: 40.5, expected: 40.2, surprise: 0.7 },
          { quarter: 'Q2 FY24', actual: 38.8, expected: 39.8, surprise: -2.5 },
          { quarter: 'Q1 FY24', actual: 37.5, expected: 38.0, surprise: -1.3 },
          { quarter: 'Q4 FY23', actual: 41.0, expected: 40.5, surprise: 1.2 },
        ],
      },
    },
  },

  TATASTEEL: {
    redFlags: [
      { id: 'promoter-pledge', name: 'Promoter Pledge', status: 'CLEAR', icon: 'Shield' },
      { id: 'auditor-concerns', name: 'Auditor Concerns', status: 'CLEAR', icon: 'FileText' },
      { id: 'related-party', name: 'Related-Party Transactions', status: 'WATCH', description: 'RPT at 18% of revenue, elevated vs peers due to Tata group structure', icon: 'Users' },
      { id: 'debt-spiral', name: 'Debt Spiral Risk', status: 'FLAGGED', description: 'Net Debt/EBITDA at 3.2x, above comfortable 2.5x threshold, UK ops cash burn ongoing', icon: 'TrendingDown' },
      { id: 'earnings-manipulation', name: 'Earnings Manipulation', status: 'CLEAR', icon: 'AlertTriangle' },
      { id: 'governance', name: 'Governance Quality', status: 'CLEAR', icon: 'Shield' },
      { id: 'litigation', name: 'Litigation Exposure', status: 'WATCH', description: 'UK pension obligations dispute, ₹8,000cr potential liability', icon: 'Gavel' },
      { id: 'regulatory', name: 'Regulatory Risk', status: 'WATCH', description: 'Environmental compliance costs rising, carbon tax proposals under discussion', icon: 'AlertCircle' },
    ],
    earningsQuality: {
      score: 68,
      probabilityLevel: 'MODERATE',
      factors: [
        { name: 'Days Sales in Receivables Index', shortName: 'DSRI', value: 1.22, normalRange: '0.9 - 1.2', status: 'CONCERNING' },
        { name: 'Gross Margin Index', shortName: 'GMI', value: 1.08, normalRange: '0.95 - 1.1', status: 'NORMAL' },
        { name: 'Asset Quality Index', shortName: 'AQI', value: 1.15, normalRange: '0.9 - 1.1', status: 'CONCERNING' },
        { name: 'Sales Growth Index', shortName: 'SGI', value: 0.92, normalRange: '0.9 - 1.3', status: 'NORMAL' },
        { name: 'Depreciation Index', shortName: 'DEPI', value: 1.18, normalRange: '0.9 - 1.15', status: 'CONCERNING' },
        { name: 'SGA Expense Index', shortName: 'SGAI', value: 1.12, normalRange: '0.9 - 1.1', status: 'CONCERNING' },
        { name: 'Accruals to Total Assets', shortName: 'Accruals', value: 0.072, normalRange: '-0.05 - 0.08', status: 'NORMAL' },
        { name: 'Leverage Index', shortName: 'Leverage', value: 1.28, normalRange: '0.9 - 1.2', status: 'CONCERNING' },
      ],
    },
    governanceRisk: {
      score: 32,
      factors: [
        { name: 'Board Independence', current: 55, threshold: 50, unit: '%', isInverse: false },
        { name: 'Auditor Changes (5Y)', current: 0, threshold: 2, unit: 'times', isInverse: true },
        { name: 'Related-Party Txns', current: 18, threshold: 15, unit: '% of revenue', isInverse: true },
        { name: 'Promoter Pledge', current: 0, threshold: 20, unit: '% of holding', isInverse: true },
        { name: 'SEBI Actions (5Y)', current: 0, threshold: 1, unit: 'count', isInverse: true },
      ],
    },
    volatilityMetrics: {
      historicalVolatility1Y: {
        value: 35.2,
        classification: 'HIGH',
      },
      beta: {
        value: 1.45,
        interpretation: 'Much more volatile than market, moves 45% more than Nifty 500',
      },
      maxDrawdown: {
        oneYear: -28.5,
        threeYear: -42.3,
        chartData: Array.from({ length: 252 }, (_, i) => ({
          date: new Date(2025, 1, i - 251).toISOString().split('T')[0],
          drawdown: Math.min(0, -Math.abs(Math.sin(i / 35) * 28 + Math.random() * 6)),
        })),
      },
      earningsSurprise: {
        variance: 8.5,
        quarters: [
          { quarter: 'Q3 FY25', actual: 12.5, expected: 15.2, surprise: -17.8 },
          { quarter: 'Q2 FY25', actual: 11.8, expected: 14.5, surprise: -18.6 },
          { quarter: 'Q1 FY25', actual: 10.2, expected: 12.5, surprise: -18.4 },
          { quarter: 'Q4 FY24', actual: 18.8, expected: 16.0, surprise: 17.5 },
          { quarter: 'Q3 FY24', actual: 16.5, expected: 15.0, surprise: 10.0 },
          { quarter: 'Q2 FY24', actual: 14.8, expected: 16.0, surprise: -7.5 },
          { quarter: 'Q1 FY24', actual: 13.5, expected: 14.8, surprise: -8.8 },
          { quarter: 'Q4 FY23', actual: 17.0, expected: 15.5, surprise: 9.7 },
        ],
      },
    },
  },
};

export const getRiskData = (symbol: string): RiskDashboardData => {
  return mockRiskData[symbol] || mockRiskData['RELIANCE'];
};
