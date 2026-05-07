/**
 * Mock Watchlist Data
 *
 * Data for watchlists and watchlist stocks
 */

export interface WatchlistStock {
  id: string;
  symbol: string;
  companyName: string;
  cmp: number;
  changePercent: number;
  changeToday: number;
  qualityScore: number;
  momentumScore: number;
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  alertActive: boolean;
  order: number;
}

export interface Watchlist {
  id: string;
  name: string;
  stockCount: number;
  lastUpdated: Date;
  topStocks: string[]; // Top 3 stock symbols
  stocks: WatchlistStock[];
}

export const mockWatchlists: Watchlist[] = [
  {
    id: '1',
    name: 'Tech Growth Leaders',
    stockCount: 8,
    lastUpdated: new Date('2026-02-08T10:30:00'),
    topStocks: ['TCS', 'INFY', 'WIPRO'],
    stocks: [
      {
        id: '1',
        symbol: 'TCS',
        companyName: 'Tata Consultancy Services Limited',
        cmp: 2951.00,
        changePercent: 0.32,
        changeToday: 9.44,
        qualityScore: 78,
        momentumScore: 75,
        sentiment: 'Bullish',
        alertActive: true,
        order: 0,
      },
      {
        id: '2',
        symbol: 'INFY',
        companyName: 'Infosys Limited',
        cmp: 1497.00,
        changePercent: -0.67,
        changeToday: -10.09,
        qualityScore: 72,
        momentumScore: 68,
        sentiment: 'Neutral',
        alertActive: true,
        order: 1,
      },
      {
        id: '3',
        symbol: 'WIPRO',
        companyName: 'Wipro Limited',
        cmp: 230.10,
        changePercent: -0.27,
        changeToday: -0.62,
        qualityScore: 75,
        momentumScore: 70,
        sentiment: 'Neutral',
        alertActive: false,
        order: 2,
      },
      {
        id: '4',
        symbol: 'HCLTECH',
        companyName: 'HCL Technologies Limited',
        cmp: 1595.10,
        changePercent: 0.09,
        changeToday: 1.44,
        qualityScore: 70,
        momentumScore: 62,
        sentiment: 'Neutral',
        alertActive: false,
        order: 3,
      },
      {
        id: '5',
        symbol: 'TECHM',
        companyName: 'Tech Mahindra Limited',
        cmp: 1619.00,
        changePercent: -0.06,
        changeToday: -0.97,
        qualityScore: 76,
        momentumScore: 71,
        sentiment: 'Neutral',
        alertActive: true,
        order: 4,
      },
      {
        id: '6',
        symbol: 'LTIM',
        companyName: 'LTIMindtree Limited',
        cmp: 5627.50,
        changePercent: 1.19,
        changeToday: 66.23,
        qualityScore: 73,
        momentumScore: 68,
        sentiment: 'Bullish',
        alertActive: false,
        order: 5,
      },
      {
        id: '7',
        symbol: 'RELIANCE',
        companyName: 'Reliance Industries Limited',
        cmp: 1461.20,
        changePercent: 0.72,
        changeToday: 10.44,
        qualityScore: 77,
        momentumScore: 65,
        sentiment: 'Bullish',
        alertActive: false,
        order: 6,
      },
      {
        id: '8',
        symbol: 'TECHM',
        companyName: 'Tech Mahindra',
        cmp: 1420.30,
        changePercent: -0.8,
        changeToday: -11.45,
        qualityScore: 69,
        momentumScore: 55,
        sentiment: 'Bearish',
        alertActive: true,
        order: 7,
      },
    ],
  },
  {
    id: '2',
    name: 'Pharma & Healthcare',
    stockCount: 5,
    lastUpdated: new Date('2026-02-07T15:20:00'),
    topStocks: ['DIVISLAB', 'DRREDDY', 'CIPLA'],
    stocks: [
      {
        id: '9',
        symbol: 'DIVISLAB',
        companyName: 'Divis Laboratories Limited',
        cmp: 485.60,
        changePercent: 1.5,
        changeToday: 7.18,
        qualityScore: 72,
        momentumScore: 58,
        sentiment: 'Neutral',
        alertActive: true,
        order: 0,
      },
      {
        id: '10',
        symbol: 'DRREDDY',
        companyName: 'Dr Reddys Laboratories',
        cmp: 5840.20,
        changePercent: 0.6,
        changeToday: 34.85,
        qualityScore: 80,
        momentumScore: 67,
        sentiment: 'Bullish',
        alertActive: true,
        order: 1,
      },
      {
        id: '11',
        symbol: 'CIPLA',
        companyName: 'Cipla Ltd',
        cmp: 1385.40,
        changePercent: -0.3,
        changeToday: -4.16,
        qualityScore: 76,
        momentumScore: 62,
        sentiment: 'Neutral',
        alertActive: false,
        order: 2,
      },
      {
        id: '12',
        symbol: 'APOLLOHOSP',
        companyName: 'Apollo Hospitals Enterprise Limited',
        cmp: 285.70,
        changePercent: -1.8,
        changeToday: -5.24,
        qualityScore: 65,
        momentumScore: 48,
        sentiment: 'Bearish',
        alertActive: true,
        order: 3,
      },
      {
        id: '13',
        symbol: 'SUNPHARMA',
        companyName: 'Sun Pharmaceutical',
        cmp: 1640.80,
        changePercent: 0.9,
        changeToday: 14.63,
        qualityScore: 78,
        momentumScore: 70,
        sentiment: 'Bullish',
        alertActive: false,
        order: 4,
      },
    ],
  },
  {
    id: '3',
    name: 'Banking & Finance',
    stockCount: 6,
    lastUpdated: new Date('2026-02-06T09:45:00'),
    topStocks: ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK'],
    stocks: [
      {
        id: '14',
        symbol: 'HDFCBANK',
        companyName: 'HDFC Bank Limited',
        cmp: 938.80,
        changePercent: -0.24,
        changeToday: -2.26,
        qualityScore: 82,
        momentumScore: 80,
        sentiment: 'Bullish',
        alertActive: true,
        order: 0,
      },
      {
        id: '15',
        symbol: 'ICICIBANK',
        companyName: 'ICICI Bank Limited',
        cmp: 1395.10,
        changePercent: -0.78,
        changeToday: -10.95,
        qualityScore: 70,
        momentumScore: 65,
        sentiment: 'Neutral',
        alertActive: false,
        order: 1,
      },
      {
        id: '16',
        symbol: 'KOTAKBANK',
        companyName: 'Kotak Mahindra Bank Limited',
        cmp: 427.75,
        changePercent: 1.28,
        changeToday: 5.41,
        qualityScore: 74,
        momentumScore: 60,
        sentiment: 'Bullish',
        alertActive: true,
        order: 2,
      },
      {
        id: '17',
        symbol: 'ASIANPAINT',
        companyName: 'Asian Paints Limited',
        cmp: 2840.50,
        changePercent: 1.1,
        changeToday: 30.91,
        qualityScore: 79,
        momentumScore: 72,
        sentiment: 'Bullish',
        alertActive: false,
        order: 3,
      },
      {
        id: '18',
        symbol: 'HINDALCO',
        companyName: 'Hindalco Industries Limited',
        cmp: 2150.30,
        changePercent: -1.5,
        changeToday: -32.74,
        qualityScore: 71,
        momentumScore: 55,
        sentiment: 'Bearish',
        alertActive: true,
        order: 4,
      },
      {
        id: '19',
        symbol: 'TATASTEEL',
        companyName: 'Tata Steel Limited',
        cmp: 3420.80,
        changePercent: 2.8,
        changeToday: 93.23,
        qualityScore: 77,
        momentumScore: 78,
        sentiment: 'Bullish',
        alertActive: true,
        order: 5,
      },
    ],
  },
];

// User tier limits
export const tierLimits = {
  free: { watchlists: 1, stocksPerWatchlist: 10 },
  pro: { watchlists: 5, stocksPerWatchlist: 50 },
  premium: { watchlists: Infinity, stocksPerWatchlist: Infinity },
};

// Mock current user tier (change this to test different tiers)
export const currentUserTier: 'free' | 'pro' | 'premium' = 'free';
