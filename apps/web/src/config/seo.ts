/**
 * SEO Configuration
 *
 * Page-specific SEO meta tags and structured data
 */

export const SEO_CONFIG = {
  // Homepage / Landing
  homepage: {
    title: 'Alpha Signal — AI-Powered Stock Intelligence for Indian Markets',
    description: 'AI research assistant for Indian small & mid-cap stocks. Bull/bear cases, risk flags, quality scores, and sentiment analysis. 2 hours of research in 5 minutes.',
    jsonLd: {
      '@type': 'Organization',
      name: 'Alpha Signal',
      description: 'AI-Powered Stock Intelligence Platform',
      url: 'https://alphasignal.in',
    },
  },

  // Screener
  screener: {
    title: 'AI Stock Screener — Find Best Indian Stocks',
    description: 'Screen 500+ Indian stocks by Quality, Growth, Risk, Momentum scores. AI-powered multi-factor screening for small & mid-cap stocks.',
  },

  // Dashboard
  dashboard: {
    title: 'Market Dashboard',
    description: 'Real-time Indian market dashboard with sector heatmap, FII/DII flows, trending stocks, and AI market brief.',
  },

  // Sectors
  sectors: {
    title: 'Indian Market Sectors — Performance & Analysis',
    description: 'Sector-wise analysis of Indian stock market. Compare sector performance, rotation, and top stocks in each sector.',
  },

  // Reports
  reports: {
    title: 'Weekly Market Intelligence Reports',
    description: 'AI-generated weekly sector reports and macro economic overview for Indian stock market.',
  },

  // Pricing
  pricing: {
    title: 'Pricing — Alpha Signal | AI Stock Intelligence from ₹299/mo',
    description: 'Choose your plan. Free tier available. Pro from ₹299/mo with full AI analysis, screener, and alerts.',
  },

  // Watchlist
  watchlist: {
    title: 'My Watchlist',
    description: 'Track your favorite Indian stocks with real-time prices, quality scores, and AI-generated insights.',
  },

  // Portfolio
  portfolio: {
    title: 'My Portfolio',
    description: 'Monitor your stock portfolio with performance tracking, risk analysis, and AI-powered recommendations.',
  },

  // Alerts
  alerts: {
    title: 'Stock Alerts',
    description: 'Set custom alerts for price changes, quality score updates, and important company events.',
  },

  // Legal pages
  terms: {
    title: 'Terms of Service',
    description: 'Terms and conditions for using Alpha Signal.',
    noindex: true,
  },

  privacy: {
    title: 'Privacy Policy',
    description: 'How Alpha Signal collects, uses, and protects your data.',
    noindex: true,
  },

  methodology: {
    title: 'Scoring Methodology',
    description: 'Learn how Alpha Signal calculates Quality, Growth, Risk, and Momentum scores for Indian stocks.',
  },
};

export default SEO_CONFIG;
