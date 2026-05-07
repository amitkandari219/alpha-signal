/**
 * Mock Dashboard Data
 *
 * Data for all dashboard widgets
 */

export interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

export interface WatchlistStock {
  symbol: string;
  name: string;
  cmp: number;
  change: number;
  changePercent: number;
  qualityScore: number;
  topSignal: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  symbol: string;
  type: 'price' | 'technical' | 'fundamental' | 'news' | 'risk';
  message: string;
  isUnread: boolean;
}

export interface TrendingStock {
  symbol: string;
  name: string;
  reason: string;
  cmp: number;
  change: number;
  changePercent: number;
}

export interface SectorData {
  name: string;
  size: number; // Market cap in crores
  change: number; // Daily change %
  topGainer: string;
  topLoser: string;
}

// Market Indices Data
export const marketIndices: MarketIndex[] = [
  {
    name: 'Nifty 50',
    symbol: 'NIFTY',
    value: 22145.80,
    change: 145.60,
    changePercent: 0.66,
    sparkline: [22000, 22050, 22100, 22080, 22120, 22150, 22145.8],
  },
  {
    name: 'Nifty Midcap 100',
    symbol: 'NIFTYMID100',
    value: 48562.35,
    change: -285.20,
    changePercent: -0.58,
    sparkline: [48850, 48800, 48700, 48650, 48600, 48550, 48562.35],
  },
  {
    name: 'Nifty Smallcap 250',
    symbol: 'NIFTYSMLCAP250',
    value: 13245.90,
    change: 98.45,
    changePercent: 0.75,
    sparkline: [13150, 13180, 13200, 13220, 13240, 13250, 13245.9],
  },
  {
    name: 'Sensex',
    symbol: 'SENSEX',
    value: 73258.45,
    change: 456.30,
    changePercent: 0.63,
    sparkline: [72800, 72900, 73000, 73100, 73200, 73300, 73258.45],
  },
];

// Watchlist Stocks
export const watchlistStocks: WatchlistStock[] = [
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Limited',
    cmp: 2951.00,
    change: 9.44,
    changePercent: 0.32,
    qualityScore: 78,
    topSignal: 'Strong Q3 results beat estimates, revenue growth at 18% YoY',
  },
  {
    symbol: 'DIVISLAB',
    name: 'Divis Laboratories Limited',
    cmp: 6140.00,
    change: 115.68,
    changePercent: 1.92,
    qualityScore: 72,
    topSignal: 'Margin pressure from API pricing, but long-term outlook positive',
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    cmp: 938.80,
    change: -2.26,
    changePercent: -0.24,
    qualityScore: 82,
    topSignal: 'Capacity expansion on track, maintaining high ROE of 24%+',
  },
  {
    symbol: 'INFY',
    name: 'Infosys Limited',
    cmp: 6320.40,
    change: 85.60,
    changePercent: 1.37,
    qualityScore: 72,
    topSignal: 'Deal wins accelerating, particularly in BFSI vertical',
  },
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Limited',
    cmp: 2456.75,
    change: 32.50,
    changePercent: 1.34,
    qualityScore: 85,
    topSignal: 'Retail and telecom segments showing strong momentum',
  },
];

// Recent Alerts
export const recentAlerts: Alert[] = [
  {
    id: 'alert-1',
    timestamp: '2 hours ago',
    symbol: 'TCS',
    type: 'technical',
    message: 'Broke above 5200 resistance with strong volume',
    isUnread: true,
  },
  {
    id: 'alert-2',
    timestamp: '3 hours ago',
    symbol: 'DIVISLAB',
    type: 'price',
    message: 'Price dropped below ₹490 support level',
    isUnread: true,
  },
  {
    id: 'alert-3',
    timestamp: '5 hours ago',
    symbol: 'HDFCBANK',
    type: 'news',
    message: 'Positive news: New client acquisition announced',
    isUnread: false,
  },
  {
    id: 'alert-4',
    timestamp: '1 day ago',
    symbol: 'INFY',
    type: 'fundamental',
    message: 'Quality Score improved from 68 to 72',
    isUnread: false,
  },
  {
    id: 'alert-5',
    timestamp: '1 day ago',
    symbol: 'RELIANCE',
    type: 'risk',
    message: 'Risk score decreased to 48 (from 52)',
    isUnread: false,
  },
];

// Trending Stocks (Nifty 50 only)
export const trendingStocks: TrendingStock[] = [
  {
    symbol: 'TITAN',
    name: 'Titan Company Limited',
    reason: 'Volume 3.2x average',
    cmp: 3450.20,
    change: 215.60,
    changePercent: 6.66,
  },
  {
    symbol: 'BAJFINANCE',
    name: 'Bajaj Finance Limited',
    reason: 'Sentiment shift: Negative → Positive',
    cmp: 6825.80,
    change: 385.40,
    changePercent: 5.98,
  },
  {
    symbol: 'HCLTECH',
    name: 'HCL Technologies Limited',
    reason: 'Quality Score +8 points',
    cmp: 1845.30,
    change: 95.20,
    changePercent: 5.44,
  },
  {
    symbol: 'WIPRO',
    name: 'Wipro Limited',
    reason: 'Strong FII buying',
    cmp: 1025.60,
    change: 68.40,
    changePercent: 7.15,
  },
  {
    symbol: 'MARUTI',
    name: 'Maruti Suzuki India Limited',
    reason: 'Auto sector momentum',
    cmp: 10825.40,
    change: 542.80,
    changePercent: 5.28,
  },
  {
    symbol: 'ASIANPAINT',
    name: 'Asian Paints Limited',
    reason: 'Breakout above resistance',
    cmp: 2985.20,
    change: 145.60,
    changePercent: 5.13,
  },
];

// Sector Performance Data
export const sectorData: SectorData[] = [
  {
    name: 'IT Services',
    size: 1250000, // 12.5L crores
    change: 1.25,
    topGainer: 'TCS +0.32%',
    topLoser: 'TECHM -0.06%',
  },
  {
    name: 'Pharmaceuticals',
    size: 850000, // 8.5L crores
    change: -0.85,
    topGainer: 'SUNPHARMA +1.2%',
    topLoser: 'DRREDDY -0.8%',
  },
  {
    name: 'Auto Components',
    size: 620000, // 6.2L crores
    change: 2.15,
    topGainer: 'TATAMOTORS +3.2%',
    topLoser: 'M&M -0.9%',
  },
  {
    name: 'Speciality Chemicals',
    size: 480000, // 4.8L crores
    change: 1.85,
    topGainer: 'UPL +1.5%',
    topLoser: 'GRASIM -0.95%',
  },
  {
    name: 'Banking',
    size: 2100000, // 21L crores
    change: 0.45,
    topGainer: 'HDFCBANK +1.2%',
    topLoser: 'INDUSINDBK -1.8%',
  },
  {
    name: 'Consumer Durables',
    size: 380000, // 3.8L crores
    change: 3.25,
    topGainer: 'TITAN +3.04%',
    topLoser: 'HAVELLS -0.5%',
  },
  {
    name: 'Energy',
    size: 1800000, // 18L crores
    change: -0.65,
    topGainer: 'ADANIGREEN +2.1%',
    topLoser: 'ONGC -2.3%',
  },
  {
    name: 'FMCG',
    size: 920000, // 9.2L crores
    change: 0.35,
    topGainer: 'BRITANNIA +1.5%',
    topLoser: 'ITC -0.8%',
  },
  {
    name: 'Metals',
    size: 580000, // 5.8L crores
    change: -1.45,
    topGainer: 'HINDALCO +0.5%',
    topLoser: 'TATASTEEL -2.8%',
  },
  {
    name: 'Telecom',
    size: 450000, // 4.5L crores
    change: 0.95,
    topGainer: 'BHARTIARTL +1.2%',
    topLoser: 'IDEA -0.3%',
  },
  {
    name: 'Infrastructure',
    size: 720000, // 7.2L crores
    change: 1.65,
    topGainer: 'LTI +2.5%',
    topLoser: 'NBCC -1.2%',
  },
  {
    name: 'Real Estate',
    size: 340000, // 3.4L crores
    change: -0.55,
    topGainer: 'DLF +1.8%',
    topLoser: 'GODREJPROP -2.5%',
  },
];

// AI Market Brief
export const aiMarketBrief = {
  generatedAt: 'Today at 3:45 PM',
  summary: [
    'Market breadth positive with mid-caps outperforming large-caps. Nifty 50 up 0.66% led by IT and Auto sectors.',
    'Small-cap rally continues with Nifty Smallcap 250 up 0.75%. Consumer Durables sector leading with 3.25% gains.',
    'FII inflows strong at ₹2,450 Cr, primarily in IT Services and Auto Components sectors.',
    'Metal stocks under pressure (-1.45%) due to weak China demand signals and inventory build-up concerns.',
    'Volatility remains subdued with India VIX at 12.4 (-5.2%), indicating stable market sentiment.',
  ],
};

export const getDashboardData = () => {
  return {
    indices: marketIndices,
    watchlist: watchlistStocks,
    alerts: recentAlerts,
    trending: trendingStocks,
    sectors: sectorData,
    marketBrief: aiMarketBrief,
  };
};
