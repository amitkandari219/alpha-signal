/**
 * Central Stock Data Source
 *
 * Single source of truth for all stock data in the application.
 * All other mock data files should import from here to maintain consistency.
 */

export interface Stock {
  symbol: string;
  companyName: string;
  sector: string;
  marketCapCategory: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' | 'MICRO_CAP';
  exchange: 'NSE' | 'BSE' | 'BOTH';
}

/**
 * NIFTY 50 STOCKS - Single Source of Truth
 * These are fetched from the database and updated by the seeder script
 */
export const NIFTY_50_STOCKS: Stock[] = [
  { symbol: 'RELIANCE', companyName: 'Reliance Industries Limited', sector: 'Energy', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'TCS', companyName: 'Tata Consultancy Services Limited', sector: 'IT Services', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'HDFCBANK', companyName: 'HDFC Bank Limited', sector: 'Banking', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'INFY', companyName: 'Infosys Limited', sector: 'IT Services', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'HINDUNILVR', companyName: 'Hindustan Unilever Limited', sector: 'FMCG', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'ICICIBANK', companyName: 'ICICI Bank Limited', sector: 'Banking', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'KOTAKBANK', companyName: 'Kotak Mahindra Bank Limited', sector: 'Banking', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'SBIN', companyName: 'State Bank of India', sector: 'Banking', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'BHARTIARTL', companyName: 'Bharti Airtel Limited', sector: 'Telecom', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'BAJFINANCE', companyName: 'Bajaj Finance Limited', sector: 'Financial Services', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'ITC', companyName: 'ITC Limited', sector: 'FMCG', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'ASIANPAINT', companyName: 'Asian Paints Limited', sector: 'Consumer Durables', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'AXISBANK', companyName: 'Axis Bank Limited', sector: 'Banking', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'LT', companyName: 'Larsen & Toubro Limited', sector: 'Infrastructure', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'MARUTI', companyName: 'Maruti Suzuki India Limited', sector: 'Automobiles', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'SUNPHARMA', companyName: 'Sun Pharmaceutical Industries Limited', sector: 'Pharmaceuticals', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'TITAN', companyName: 'Titan Company Limited', sector: 'Consumer Durables', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'ULTRACEMCO', companyName: 'UltraTech Cement Limited', sector: 'Cement', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'NESTLEIND', companyName: 'Nestle India Limited', sector: 'FMCG', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'WIPRO', companyName: 'Wipro Limited', sector: 'IT Services', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'HCLTECH', companyName: 'HCL Technologies Limited', sector: 'IT Services', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'TECHM', companyName: 'Tech Mahindra Limited', sector: 'IT Services', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'POWERGRID', companyName: 'Power Grid Corporation of India Limited', sector: 'Power', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'NTPC', companyName: 'NTPC Limited', sector: 'Power', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'ONGC', companyName: 'Oil and Natural Gas Corporation Limited', sector: 'Energy', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'TATAMOTORS', companyName: 'Tata Motors Limited', sector: 'Automobiles', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'COALINDIA', companyName: 'Coal India Limited', sector: 'Mining', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'BAJAJFINSV', companyName: 'Bajaj Finserv Limited', sector: 'Financial Services', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'M&M', companyName: 'Mahindra & Mahindra Limited', sector: 'Automobiles', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'ADANIPORTS', companyName: 'Adani Ports and Special Economic Zone Limited', sector: 'Infrastructure', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'TATASTEEL', companyName: 'Tata Steel Limited', sector: 'Steel', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'INDUSINDBK', companyName: 'IndusInd Bank Limited', sector: 'Banking', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'DIVISLAB', companyName: 'Divi\'s Laboratories Limited', sector: 'Pharmaceuticals', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'DRREDDY', companyName: 'Dr. Reddy\'s Laboratories Limited', sector: 'Pharmaceuticals', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'CIPLA', companyName: 'Cipla Limited', sector: 'Pharmaceuticals', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'GRASIM', companyName: 'Grasim Industries Limited', sector: 'Cement', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'EICHERMOT', companyName: 'Eicher Motors Limited', sector: 'Automobiles', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'HINDALCO', companyName: 'Hindalco Industries Limited', sector: 'Aluminum', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'HEROMOTOCO', companyName: 'Hero MotoCorp Limited', sector: 'Automobiles', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'UPL', companyName: 'UPL Limited', sector: 'Chemicals', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'JSWSTEEL', companyName: 'JSW Steel Limited', sector: 'Steel', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'BRITANNIA', companyName: 'Britannia Industries Limited', sector: 'FMCG', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'APOLLOHOSP', companyName: 'Apollo Hospitals Enterprise Limited', sector: 'Healthcare', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'TATACONSUM', companyName: 'Tata Consumer Products Limited', sector: 'FMCG', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'SBILIFE', companyName: 'SBI Life Insurance Company Limited', sector: 'Insurance', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'ADANIENT', companyName: 'Adani Enterprises Limited', sector: 'Diversified', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'BAJAJ-AUTO', companyName: 'Bajaj Auto Limited', sector: 'Automobiles', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'HDFCLIFE', companyName: 'HDFC Life Insurance Company Limited', sector: 'Insurance', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'BPCL', companyName: 'Bharat Petroleum Corporation Limited', sector: 'Energy', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
  { symbol: 'LTIM', companyName: 'LTIMindtree Limited', sector: 'IT Services', marketCapCategory: 'LARGE_CAP', exchange: 'NSE' },
];

/**
 * Helper function to get stock by symbol
 */
export function getStockBySymbol(symbol: string): Stock | undefined {
  return NIFTY_50_STOCKS.find(stock => stock.symbol === symbol);
}

/**
 * Helper function to get all symbols
 */
export function getAllSymbols(): string[] {
  return NIFTY_50_STOCKS.map(stock => stock.symbol);
}

/**
 * Helper function to get stocks by sector
 */
export function getStocksBySector(sector: string): Stock[] {
  return NIFTY_50_STOCKS.filter(stock => stock.sector === sector);
}

/**
 * Helper function to get all unique sectors
 */
export function getAllSectors(): string[] {
  return [...new Set(NIFTY_50_STOCKS.map(stock => stock.sector))];
}
