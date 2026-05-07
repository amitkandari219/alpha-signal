/**
 * Mock Fundamental Analysis Data
 *
 * Comprehensive financial metrics for fundamental analysis
 */

export interface GrowthMetrics {
  revenueCagr3Y: number;
  revenueCagr5Y: number;
  revenueSparkline: number[];
  profitCagr3Y: number;
  profitCagr5Y: number;
  profitSparkline: number[];
  epsGrowth: number;
  epsSparkline: number[];
}

export interface ProfitabilityMetrics {
  roe: { current: number; sectorMedian: number; qoqChange: number };
  roce: { current: number; sectorMedian: number; qoqChange: number };
  operatingMargin: { current: number; sectorMedian: number; qoqChange: number };
  netMargin: { current: number; sectorMedian: number; qoqChange: number };
}

export interface BalanceSheetHealth {
  debtToEquity: number;
  interestCoverage: number;
  currentRatio: number;
  cashPercentOfMarketCap: number;
}

export interface CashFlowData {
  yearlyData: {
    year: string;
    operatingCF: number;
    pat: number;
  }[];
  fcfYield: number;
  ocfToPat: number;
}

export interface PromoterData {
  holding: number;
  holdingTrend: number[]; // 8 quarters
  pledge: number;
  fiiChange: number;
  diiChange: number;
  insiderTransactions: {
    date: string;
    person: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    value: number;
  }[];
}

export interface QualityScore {
  overall: number;
  factors: {
    roeConsistency: number;
    roce: number;
    opmTrend: number;
    debtDiscipline: number;
    cashFlowQuality: number;
    promoterHolding: number;
    earningsPredictability: number;
    capitalAllocation: number;
  };
}

export interface FundamentalData {
  growth: GrowthMetrics;
  profitability: ProfitabilityMetrics;
  balanceSheet: BalanceSheetHealth;
  cashFlow: CashFlowData;
  promoter: PromoterData;
  qualityScore: QualityScore;
}

export const mockFundamentalData: Record<string, FundamentalData> = {
  RELIANCE: {
    growth: {
      revenueCagr3Y: 18.5,
      revenueCagr5Y: 22.3,
      revenueSparkline: [85, 92, 98, 105, 118, 132, 145, 158, 172, 188, 205, 223],
      profitCagr3Y: 15.2,
      profitCagr5Y: 19.8,
      profitSparkline: [42, 45, 48, 52, 56, 61, 65, 70, 75, 82, 88, 94],
      epsGrowth: 16.8,
      epsSparkline: [68, 72, 75, 79, 84, 89, 95, 101, 108, 115, 123, 132],
    },
    profitability: {
      roe: { current: 14.2, sectorMedian: 12.5, qoqChange: 0.8 },
      roce: { current: 11.8, sectorMedian: 10.2, qoqChange: 0.5 },
      operatingMargin: { current: 12.5, sectorMedian: 11.0, qoqChange: 0.3 },
      netMargin: { current: 8.2, sectorMedian: 7.5, qoqChange: 0.2 },
    },
    balanceSheet: {
      debtToEquity: 0.48,
      interestCoverage: 8.5,
      currentRatio: 1.35,
      cashPercentOfMarketCap: 4.2,
    },
    cashFlow: {
      yearlyData: [
        { year: 'FY21', operatingCF: 82000, pat: 53500 },
        { year: 'FY22', operatingCF: 95000, pat: 60500 },
        { year: 'FY23', operatingCF: 108000, pat: 67200 },
        { year: 'FY24', operatingCF: 125000, pat: 74800 },
        { year: 'FY25E', operatingCF: 138000, pat: 82500 },
      ],
      fcfYield: 3.8,
      ocfToPat: 1.52,
    },
    promoter: {
      holding: 50.39,
      holdingTrend: [50.51, 50.48, 50.45, 50.42, 50.41, 50.40, 50.39, 50.39],
      pledge: 0.0,
      fiiChange: 1.2,
      diiChange: -0.3,
      insiderTransactions: [
        { date: '2025-12-15', person: 'Mukesh D. Ambani', type: 'BUY', quantity: 50000, value: 12.25 },
        { date: '2025-10-20', person: 'Nita M. Ambani', type: 'BUY', quantity: 25000, value: 6.05 },
        { date: '2025-09-05', person: 'Isha Ambani', type: 'BUY', quantity: 15000, value: 3.58 },
        { date: '2025-07-18', person: 'Akash Ambani', type: 'BUY', quantity: 20000, value: 4.72 },
      ],
    },
    qualityScore: {
      overall: 82,
      factors: {
        roeConsistency: 13.5,
        roce: 12.8,
        opmTrend: 8.5,
        debtDiscipline: 13.2,
        cashFlowQuality: 14.0,
        promoterHolding: 9.5,
        earningsPredictability: 8.0,
        capitalAllocation: 8.5,
      },
    },
  },

  TCS: {
    growth: {
      revenueCagr3Y: 12.8,
      revenueCagr5Y: 11.5,
      revenueSparkline: [145, 152, 158, 165, 172, 178, 185, 192, 198, 205, 212, 218],
      profitCagr3Y: 11.5,
      profitCagr5Y: 10.8,
      profitSparkline: [32, 34, 35, 37, 38, 40, 41, 43, 44, 46, 47, 49],
      epsGrowth: 12.2,
      epsSparkline: [88, 91, 94, 97, 100, 103, 107, 110, 114, 118, 122, 126],
    },
    profitability: {
      roe: { current: 47.5, sectorMedian: 25.2, qoqChange: 1.2 },
      roce: { current: 52.8, sectorMedian: 28.5, qoqChange: 1.5 },
      operatingMargin: { current: 24.5, sectorMedian: 18.5, qoqChange: 0.5 },
      netMargin: { current: 18.8, sectorMedian: 14.2, qoqChange: 0.3 },
    },
    balanceSheet: {
      debtToEquity: 0.02,
      interestCoverage: 125.0,
      currentRatio: 3.85,
      cashPercentOfMarketCap: 18.5,
    },
    cashFlow: {
      yearlyData: [
        { year: 'FY21', operatingCF: 38500, pat: 32430 },
        { year: 'FY22', operatingCF: 42000, pat: 38320 },
        { year: 'FY23', operatingCF: 44500, pat: 42150 },
        { year: 'FY24', operatingCF: 48200, pat: 45980 },
        { year: 'FY25E', operatingCF: 51000, pat: 49200 },
      ],
      fcfYield: 4.2,
      ocfToPat: 1.19,
    },
    promoter: {
      holding: 72.05,
      holdingTrend: [72.28, 72.22, 72.18, 72.15, 72.12, 72.09, 72.07, 72.05],
      pledge: 0.0,
      fiiChange: 0.5,
      diiChange: 0.2,
      insiderTransactions: [
        { date: '2025-11-25', person: 'N Chandrasekaran', type: 'BUY', quantity: 10000, value: 3.92 },
        { date: '2025-08-12', person: 'Rajesh Gopinathan', type: 'SELL', quantity: 5000, value: 1.89 },
      ],
    },
    qualityScore: {
      overall: 92,
      factors: {
        roeConsistency: 14.8,
        roce: 15.0,
        opmTrend: 9.5,
        debtDiscipline: 15.0,
        cashFlowQuality: 14.5,
        promoterHolding: 9.0,
        earningsPredictability: 9.8,
        capitalAllocation: 9.4,
      },
    },
  },

  INFY: {
    growth: {
      revenueCagr3Y: 9.5,
      revenueCagr5Y: 8.8,
      revenueSparkline: [120, 125, 128, 132, 136, 140, 144, 148, 152, 156, 160, 164],
      profitCagr3Y: 8.2,
      profitCagr5Y: 7.5,
      profitSparkline: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
      epsGrowth: 9.0,
      epsSparkline: [52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74],
    },
    profitability: {
      roe: { current: 31.2, sectorMedian: 25.2, qoqChange: 0.5 },
      roce: { current: 34.5, sectorMedian: 28.5, qoqChange: 0.3 },
      operatingMargin: { current: 21.0, sectorMedian: 18.5, qoqChange: -0.2 },
      netMargin: { current: 16.5, sectorMedian: 14.2, qoqChange: 0.1 },
    },
    balanceSheet: {
      debtToEquity: 0.0,
      interestCoverage: 180.0,
      currentRatio: 2.95,
      cashPercentOfMarketCap: 22.8,
    },
    cashFlow: {
      yearlyData: [
        { year: 'FY21', operatingCF: 22500, pat: 19350 },
        { year: 'FY22', operatingCF: 24800, pat: 22150 },
        { year: 'FY23', operatingCF: 26500, pat: 24200 },
        { year: 'FY24', operatingCF: 28200, pat: 25980 },
        { year: 'FY25E', operatingCF: 30000, pat: 27500 },
      ],
      fcfYield: 3.5,
      ocfToPat: 1.15,
    },
    promoter: {
      holding: 15.18,
      holdingTrend: [15.45, 15.38, 15.32, 15.28, 15.24, 15.22, 15.20, 15.18],
      pledge: 0.0,
      fiiChange: -0.8,
      diiChange: 0.4,
      insiderTransactions: [
        { date: '2025-10-08', person: 'Salil Parekh', type: 'SELL', quantity: 8000, value: 1.24 },
        { date: '2025-07-22', person: 'Jayesh Sanghrajka', type: 'BUY', quantity: 3000, value: 0.45 },
      ],
    },
    qualityScore: {
      overall: 86,
      factors: {
        roeConsistency: 13.8,
        roce: 14.2,
        opmTrend: 8.0,
        debtDiscipline: 15.0,
        cashFlowQuality: 13.5,
        promoterHolding: 5.5,
        earningsPredictability: 9.0,
        capitalAllocation: 9.0,
      },
    },
  },

  HDFCBANK: {
    growth: {
      revenueCagr3Y: 16.5,
      revenueCagr5Y: 18.2,
      revenueSparkline: [95, 102, 108, 115, 123, 132, 141, 150, 160, 171, 182, 195],
      profitCagr3Y: 14.8,
      profitCagr5Y: 16.5,
      profitSparkline: [28, 30, 32, 34, 37, 39, 42, 44, 47, 50, 53, 56],
      epsGrowth: 15.5,
      epsSparkline: [45, 48, 51, 54, 57, 61, 64, 68, 72, 76, 81, 85],
    },
    profitability: {
      roe: { current: 17.8, sectorMedian: 14.5, qoqChange: -0.3 },
      roce: { current: 3.2, sectorMedian: 2.8, qoqChange: -0.1 },
      operatingMargin: { current: 65.5, sectorMedian: 58.2, qoqChange: 0.5 },
      netMargin: { current: 23.5, sectorMedian: 20.8, qoqChange: -0.2 },
    },
    balanceSheet: {
      debtToEquity: 5.85,
      interestCoverage: 4.2,
      currentRatio: 0.95,
      cashPercentOfMarketCap: 2.8,
    },
    cashFlow: {
      yearlyData: [
        { year: 'FY21', operatingCF: 42000, pat: 31200 },
        { year: 'FY22', operatingCF: 48500, pat: 37800 },
        { year: 'FY23', operatingCF: 55200, pat: 42500 },
        { year: 'FY24', operatingCF: 62800, pat: 48200 },
        { year: 'FY25E', operatingCF: 68000, pat: 52500 },
      ],
      fcfYield: 2.8,
      ocfToPat: 1.35,
    },
    promoter: {
      holding: 26.14,
      holdingTrend: [26.18, 26.17, 26.16, 26.15, 26.15, 26.14, 26.14, 26.14],
      pledge: 0.0,
      fiiChange: 2.1,
      diiChange: -0.5,
      insiderTransactions: [
        { date: '2025-12-02', person: 'Sashidhar Jagdishan', type: 'BUY', quantity: 5000, value: 0.82 },
        { date: '2025-09-18', person: 'Kaizad Bharucha', type: 'BUY', quantity: 3000, value: 0.48 },
      ],
    },
    qualityScore: {
      overall: 78,
      factors: {
        roeConsistency: 12.5,
        roce: 11.8,
        opmTrend: 9.0,
        debtDiscipline: 10.5,
        cashFlowQuality: 12.0,
        promoterHolding: 8.0,
        earningsPredictability: 8.5,
        capitalAllocation: 8.7,
      },
    },
  },

  TATASTEEL: {
    growth: {
      revenueCagr3Y: 4.2,
      revenueCagr5Y: 3.8,
      revenueSparkline: [85, 88, 86, 84, 87, 89, 91, 88, 86, 89, 92, 90],
      profitCagr3Y: -2.5,
      profitCagr5Y: -1.8,
      profitSparkline: [12, 15, 13, 10, 8, 11, 14, 12, 9, 11, 13, 11],
      epsGrowth: -1.5,
      epsSparkline: [28, 32, 29, 25, 22, 26, 30, 28, 24, 27, 29, 27],
    },
    profitability: {
      roe: { current: 8.5, sectorMedian: 10.2, qoqChange: -1.2 },
      roce: { current: 7.2, sectorMedian: 8.5, qoqChange: -0.8 },
      operatingMargin: { current: 11.5, sectorMedian: 13.2, qoqChange: -0.5 },
      netMargin: { current: 4.2, sectorMedian: 5.8, qoqChange: -0.3 },
    },
    balanceSheet: {
      debtToEquity: 1.15,
      interestCoverage: 2.8,
      currentRatio: 1.05,
      cashPercentOfMarketCap: 3.5,
    },
    cashFlow: {
      yearlyData: [
        { year: 'FY21', operatingCF: 18500, pat: 12200 },
        { year: 'FY22', operatingCF: 22000, pat: 18500 },
        { year: 'FY23', operatingCF: 16500, pat: 14200 },
        { year: 'FY24', operatingCF: 12800, pat: 9500 },
        { year: 'FY25E', operatingCF: 15000, pat: 11000 },
      ],
      fcfYield: 2.2,
      ocfToPat: 1.08,
    },
    promoter: {
      holding: 33.74,
      holdingTrend: [33.82, 33.80, 33.78, 33.77, 33.76, 33.75, 33.74, 33.74],
      pledge: 0.0,
      fiiChange: -1.5,
      diiChange: -0.2,
      insiderTransactions: [
        { date: '2025-08-15', person: 'T. V. Narendran', type: 'SELL', quantity: 10000, value: 1.15 },
      ],
    },
    qualityScore: {
      overall: 58,
      factors: {
        roeConsistency: 8.5,
        roce: 8.0,
        opmTrend: 5.5,
        debtDiscipline: 9.0,
        cashFlowQuality: 9.5,
        promoterHolding: 8.5,
        earningsPredictability: 5.0,
        capitalAllocation: 6.0,
      },
    },
  },
};

export const getFundamentalData = (symbol: string): FundamentalData => {
  return mockFundamentalData[symbol] || mockFundamentalData['RELIANCE'];
};
