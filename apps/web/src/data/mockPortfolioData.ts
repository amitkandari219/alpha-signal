/**
 * Mock Portfolio Data
 *
 * Portfolio holdings, analytics, and insights for Premium users
 */

export interface PortfolioHolding {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  avgPrice: number;
  cmp: number;
  currentValue: number;
  investedValue: number;
  pnl: number;
  pnlPercent: number;
  weight: number; // % of portfolio
  sector: string;
  qualityScore: number;
  riskScore: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  todayPnl: number;
  todayPnlPercent: number;
  xirr: number; // annualized return
  holdingCount: number;
}

export interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PortfolioScores {
  quality: number;
  growth: number;
  risk: number;
  sentiment: number;
  momentum: number;
}

export interface AIInsight {
  type: 'warning' | 'info' | 'suggestion';
  message: string;
}

// Mock Portfolio Holdings
export const portfolioHoldings: PortfolioHolding[] = [
  {
    id: '1',
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries',
    quantity: 50,
    avgPrice: 2450.50,
    cmp: 2678.20,
    currentValue: 133910,
    investedValue: 122525,
    pnl: 11385,
    pnlPercent: 9.29,
    weight: 18.5,
    sector: 'Energy',
    qualityScore: 82,
    riskScore: 35,
  },
  {
    id: '2',
    symbol: 'TCS',
    companyName: 'Tata Consultancy Services',
    quantity: 30,
    avgPrice: 3650.00,
    cmp: 3892.45,
    currentValue: 116773.5,
    investedValue: 109500,
    pnl: 7273.5,
    pnlPercent: 6.64,
    weight: 16.1,
    sector: 'IT Services',
    qualityScore: 88,
    riskScore: 28,
  },
  {
    id: '3',
    symbol: 'HDFCBANK',
    companyName: 'HDFC Bank',
    quantity: 80,
    avgPrice: 1580.25,
    cmp: 1645.80,
    currentValue: 131664,
    investedValue: 126420,
    pnl: 5244,
    pnlPercent: 4.15,
    weight: 18.2,
    sector: 'Banking',
    qualityScore: 85,
    riskScore: 32,
  },
  {
    id: '4',
    symbol: 'INFY',
    companyName: 'Infosys',
    quantity: 60,
    avgPrice: 1420.00,
    cmp: 1512.30,
    currentValue: 90738,
    investedValue: 85200,
    pnl: 5538,
    pnlPercent: 6.50,
    weight: 12.5,
    sector: 'IT Services',
    qualityScore: 86,
    riskScore: 30,
  },
  {
    id: '5',
    symbol: 'ASIANPAINT',
    companyName: 'Asian Paints',
    quantity: 40,
    avgPrice: 2850.75,
    cmp: 2945.60,
    currentValue: 117824,
    investedValue: 114030,
    pnl: 3794,
    pnlPercent: 3.33,
    weight: 16.3,
    sector: 'Consumer Durables',
    qualityScore: 80,
    riskScore: 38,
  },
  {
    id: '6',
    symbol: 'BAJFINANCE',
    companyName: 'Bajaj Finance',
    quantity: 15,
    avgPrice: 6850.00,
    cmp: 6420.25,
    currentValue: 96303.75,
    investedValue: 102750,
    pnl: -6446.25,
    pnlPercent: -6.27,
    weight: 13.3,
    sector: 'NBFC',
    qualityScore: 78,
    riskScore: 58,
  },
  {
    id: '7',
    symbol: 'BHARTIARTL',
    companyName: 'Bharti Airtel',
    quantity: 100,
    avgPrice: 920.50,
    cmp: 1085.70,
    currentValue: 108570,
    investedValue: 92050,
    pnl: 16520,
    pnlPercent: 17.95,
    weight: 15.0,
    sector: 'Telecom',
    qualityScore: 75,
    riskScore: 42,
  },
  {
    id: '8',
    symbol: 'ITC',
    companyName: 'ITC Ltd',
    quantity: 200,
    avgPrice: 385.25,
    cmp: 412.80,
    currentValue: 82560,
    investedValue: 77050,
    pnl: 5510,
    pnlPercent: 7.15,
    weight: 11.4,
    sector: 'FMCG',
    qualityScore: 72,
    riskScore: 35,
  },
  {
    id: '9',
    symbol: 'MARUTI',
    companyName: 'Maruti Suzuki India',
    quantity: 8,
    avgPrice: 10250.00,
    cmp: 11840.50,
    currentValue: 94724,
    investedValue: 82000,
    pnl: 12724,
    pnlPercent: 15.52,
    weight: 13.1,
    sector: 'Automobile',
    qualityScore: 76,
    riskScore: 45,
  },
  {
    id: '10',
    symbol: 'SUNPHARMA',
    companyName: 'Sun Pharmaceutical',
    quantity: 120,
    avgPrice: 1180.50,
    cmp: 1245.30,
    currentValue: 149436,
    investedValue: 141660,
    pnl: 7776,
    pnlPercent: 5.49,
    weight: 20.6,
    sector: 'Pharmaceuticals',
    qualityScore: 79,
    riskScore: 40,
  },
  {
    id: '11',
    symbol: 'WIPRO',
    companyName: 'Wipro Ltd',
    quantity: 150,
    avgPrice: 425.75,
    cmp: 398.20,
    currentValue: 59730,
    investedValue: 63862.5,
    pnl: -4132.5,
    pnlPercent: -6.47,
    weight: 8.2,
    sector: 'IT Services',
    qualityScore: 70,
    riskScore: 48,
  },
  {
    id: '12',
    symbol: 'AXISBANK',
    companyName: 'Axis Bank',
    quantity: 90,
    avgPrice: 1050.00,
    cmp: 1125.40,
    currentValue: 101286,
    investedValue: 94500,
    pnl: 6786,
    pnlPercent: 7.18,
    weight: 14.0,
    sector: 'Banking',
    qualityScore: 74,
    riskScore: 52,
  },
];

// Calculate Portfolio Summary
const totalInvested = portfolioHoldings.reduce((sum, h) => sum + h.investedValue, 0);
const currentValue = portfolioHoldings.reduce((sum, h) => sum + h.currentValue, 0);
const totalPnl = currentValue - totalInvested;
const totalPnlPercent = (totalPnl / totalInvested) * 100;

export const portfolioSummary: PortfolioSummary = {
  totalInvested,
  currentValue,
  totalPnl,
  totalPnlPercent,
  todayPnl: 8542.5, // Mock today's P&L
  todayPnlPercent: 0.68,
  xirr: 12.45, // Mock XIRR (annualized return)
  holdingCount: portfolioHoldings.length,
};

// Calculate Sector Allocation
const sectorMap = new Map<string, number>();
portfolioHoldings.forEach((holding) => {
  const current = sectorMap.get(holding.sector) || 0;
  sectorMap.set(holding.sector, current + holding.currentValue);
});

const colors = [
  '#58A6FF',
  '#3FB950',
  '#D29922',
  '#A371F7',
  '#F85149',
  '#79C0FF',
  '#56D364',
  '#E3B341',
];

export const sectorAllocation: SectorAllocation[] = Array.from(sectorMap.entries())
  .map(([sector, value], index) => ({
    sector,
    value,
    percentage: (value / currentValue) * 100,
    color: colors[index % colors.length],
  }))
  .sort((a, b) => b.value - a.value);

// Calculate Portfolio-Level Scores (weighted average by portfolio weight)
const calculateWeightedScore = (scoreKey: keyof Pick<PortfolioHolding, 'qualityScore' | 'riskScore'>) => {
  const totalWeight = portfolioHoldings.reduce((sum, h) => sum + h.weight, 0);
  const weightedSum = portfolioHoldings.reduce((sum, h) => sum + (h[scoreKey] * h.weight), 0);
  return Math.round(weightedSum / totalWeight);
};

export const portfolioScores: PortfolioScores = {
  quality: calculateWeightedScore('qualityScore'),
  growth: 72, // Mock
  risk: calculateWeightedScore('riskScore'),
  sentiment: 68, // Mock
  momentum: 65, // Mock
};

// Top 5 Holdings for Concentration Risk
export const topHoldings = portfolioHoldings
  .sort((a, b) => b.weight - a.weight)
  .slice(0, 5)
  .map((h) => ({
    symbol: h.symbol,
    weight: h.weight,
  }));

// AI Portfolio Insights
export const aiInsights: AIInsight[] = [
  {
    type: 'warning',
    message:
      'Your portfolio has 44.8% concentration in IT Services and Banking sectors — consider diversification across defensive sectors like FMCG or Healthcare.',
  },
  {
    type: 'warning',
    message:
      '2 holdings (BAJFINANCE, AXISBANK) have elevated risk scores (>50) — review flagged risks and consider position sizing.',
  },
  {
    type: 'suggestion',
    message:
      'Sun Pharma represents 20.6% of your portfolio (highest concentration) — consider rebalancing to reduce single-stock risk below 15%.',
  },
  {
    type: 'info',
    message:
      'Your portfolio quality score of 79 is above market average — strong fundamentals across holdings.',
  },
  {
    type: 'suggestion',
    message:
      'Bharti Airtel and Maruti showing strong momentum (+17.95%, +15.52% gains) — consider trailing stop-loss to protect profits.',
  },
];

// Tier Configuration
export const tierLimits = {
  free: { canAccessPortfolio: false },
  pro: { canAccessPortfolio: false },
  premium: { canAccessPortfolio: true },
};

export const currentUserTier: 'free' | 'pro' | 'premium' = 'free'; // Change to test different tiers
