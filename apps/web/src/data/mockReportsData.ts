/**
 * Mock Data for Weekly Reports
 *
 * Development data for testing the Reports feature
 */

export const mockReports = [
  {
    id: '1',
    title: 'Market Weekly: Tech Rally Continues Amid Fed Optimism',
    slug: 'market-weekly-tech-rally-continues-amid-fed-optimism',
    reportType: 'MACRO',
    sector: null,
    summary:
      'Indian markets witnessed a strong rally this week, driven by optimism around potential rate cuts and robust earnings from technology sector leaders. The Nifty 50 gained 2.3% while Sensex closed above 73,000 for the first time. Foreign institutional investors turned net buyers after three consecutive weeks of selling.',
    publishedAt: '2024-03-15T09:00:00Z',
    fiscalWeek: 11,
    fiscalYear: 2024,
    viewCount: 1523,
  },
  {
    id: '2',
    title: 'Financial Services Sector: Q4 Earnings Preview and Key Trends',
    slug: 'financial-services-sector-q4-earnings-preview',
    reportType: 'SECTOR',
    sector: {
      id: 'finance',
      name: 'Finance',
    },
    summary:
      'As Q4 earnings season approaches, Indian financial services companies are expected to report strong results. Banks are likely to show improved asset quality with declining NPAs, while NBFCs continue their growth momentum in retail lending. Insurance and AMC segments remain robust.',
    publishedAt: '2024-03-13T09:00:00Z',
    fiscalWeek: 11,
    fiscalYear: 2024,
    viewCount: 987,
  },
  {
    id: '3',
    title: 'Technology Sector: AI Adoption Drives Growth Outlook',
    slug: 'technology-sector-ai-adoption-drives-growth',
    reportType: 'SECTOR',
    sector: {
      id: 'technology',
      name: 'Technology',
    },
    summary:
      'Indian IT services companies are witnessing accelerated deal closures as enterprises worldwide embrace AI and digital transformation initiatives. Large deals worth $500M+ are becoming more common, with clients focused on modernization and cloud migration projects.',
    publishedAt: '2024-03-11T09:00:00Z',
    fiscalWeek: 11,
    fiscalYear: 2024,
    viewCount: 1245,
  },
  {
    id: '4',
    title: 'Market Weekly: Volatility Returns as Global Cues Weigh',
    slug: 'market-weekly-volatility-returns-global-cues',
    reportType: 'MACRO',
    sector: null,
    summary:
      'Indian equity markets faced renewed volatility this week as mixed global cues and profit booking at higher levels led to consolidation. Mid and small-cap indices outperformed benchmarks, while FII outflows moderated. Key sectoral drivers included pharma and auto stocks.',
    publishedAt: '2024-03-08T09:00:00Z',
    fiscalWeek: 10,
    fiscalYear: 2024,
    viewCount: 1678,
  },
  {
    id: '5',
    title: 'Healthcare Sector: Pharmaceutical Exports Surge Continues',
    slug: 'healthcare-sector-pharma-exports-surge',
    reportType: 'SECTOR',
    sector: {
      id: 'healthcare',
      name: 'Healthcare',
    },
    summary:
      'Indian pharmaceutical companies continue to benefit from strong export demand, particularly in regulated markets. Generic drug approvals from USFDA remain robust, while the domestic formulations segment shows steady growth. API manufacturing gains traction.',
    publishedAt: '2024-03-06T09:00:00Z',
    fiscalWeek: 10,
    fiscalYear: 2024,
    viewCount: 856,
  },
  {
    id: '6',
    title: 'Energy Sector: Oil Marketing Companies Navigate Volatile Crude',
    slug: 'energy-sector-omc-navigate-volatile-crude',
    reportType: 'SECTOR',
    sector: {
      id: 'energy',
      name: 'Energy',
    },
    summary:
      'Oil marketing companies faced margin pressure this quarter as crude oil prices remained elevated. However, strong refining throughput and improving marketing margins provided support. Renewable energy initiatives by major players gained momentum.',
    publishedAt: '2024-03-04T09:00:00Z',
    fiscalWeek: 10,
    fiscalYear: 2024,
    viewCount: 734,
  },
];

export const mockReportDetail = {
  id: '1',
  title: 'Market Weekly: Tech Rally Continues Amid Fed Optimism',
  slug: 'market-weekly-tech-rally-continues-amid-fed-optimism',
  reportType: 'MACRO',
  sector: null,
  summary:
    'Indian markets witnessed a strong rally this week, driven by optimism around potential rate cuts and robust earnings from technology sector leaders. The Nifty 50 gained 2.3% while Sensex closed above 73,000 for the first time. Foreign institutional investors turned net buyers after three consecutive weeks of selling.',
  fullContent: `Indian equity markets witnessed a remarkable rally this week, with benchmark indices reaching new all-time highs. The Nifty 50 gained 2.3% to close at 22,485, while the Sensex crossed the psychological 73,000 mark for the first time, closing at 73,427.

The rally was broad-based, with strong participation across market capitalizations. Mid-cap and small-cap indices outperformed benchmarks, gaining 3.1% and 3.5% respectively.

Foreign institutional investors (FIIs) turned net buyers after three consecutive weeks of selling, pumping in ₹4,250 crores. Domestic institutional investors (DIIs) remained strong buyers, adding ₹5,180 crores during the week.

Technology stocks led the rally, with the IT index surging 4.2%. Banking and financial services stocks also participated strongly, with the Bank Nifty gaining 2.8%. Consumer durables and auto stocks remained in focus on strong demand outlook.`,
  publishedAt: '2024-03-15T09:00:00Z',
  fiscalWeek: 11,
  fiscalYear: 2024,
  viewCount: 1523,
  reportSections: [
    {
      id: '1',
      sectionOrder: 1,
      sectionTitle: 'Market Performance Snapshot',
      sectionType: 'METRIC_CARDS',
      content: JSON.stringify([
        { label: 'Nifty 50', value: '22,485', change: 2.3, changeLabel: 'WoW' },
        { label: 'Sensex', value: '73,427', change: 2.4, changeLabel: 'WoW' },
        { label: 'Bank Nifty', value: '47,895', change: 2.8, changeLabel: 'WoW' },
        { label: 'IT Index', value: '34,567', change: 4.2, changeLabel: 'WoW' },
      ]),
    },
    {
      id: '2',
      sectionOrder: 2,
      sectionTitle: 'Key Market Drivers',
      sectionType: 'TEXT',
      content: `The week's rally was driven by multiple positive factors:

Technology Sector Strength: IT stocks rallied on strong deal wins and positive commentary from major companies about AI adoption and digital transformation demand. Infosys and TCS led the gains with 5.2% and 4.8% respectively.

Rate Cut Optimism: Growing expectations of potential rate cuts by major central banks, including the Fed and RBI, lifted sentiment. Bond yields declined, making equities more attractive.

Robust Q4 Earnings: Better-than-expected Q4 results from early reporters boosted confidence. Revenue growth remained healthy while margins showed improvement across sectors.

FII Inflows Resume: After sustained selling in previous weeks, foreign investors turned net buyers. This shift in sentiment provided crucial support to the rally.`,
    },
    {
      id: '3',
      sectionOrder: 3,
      sectionTitle: 'Sectoral Performance',
      sectionType: 'CHART_DATA',
      content: JSON.stringify({
        type: 'bar',
        data: [
          { name: 'IT', value: 4.2 },
          { name: 'Auto', value: 3.5 },
          { name: 'Consumer', value: 3.1 },
          { name: 'Banking', value: 2.8 },
          { name: 'Pharma', value: 2.4 },
          { name: 'Metals', value: 1.8 },
          { name: 'Energy', value: 1.2 },
          { name: 'Realty', value: 0.8 },
        ],
      }),
    },
    {
      id: '4',
      sectionOrder: 4,
      sectionTitle: 'Top Performing Stocks',
      sectionType: 'STOCK_LIST',
      content: JSON.stringify([
        {
          symbol: 'INFY',
          name: 'Infosys Ltd',
          price: 1485,
          return: 5.2,
          scores: { alphaScore: 84, qualityScore: 92, valueScore: 78 },
        },
        {
          symbol: 'TCS',
          name: 'Tata Consultancy Services',
          price: 3890,
          return: 4.8,
          scores: { alphaScore: 88, qualityScore: 95, valueScore: 75 },
        },
        {
          symbol: 'HCLTECH',
          name: 'HCL Technologies',
          price: 1456,
          return: 4.5,
          scores: { alphaScore: 82, qualityScore: 88, valueScore: 80 },
        },
        {
          symbol: 'MARUTI',
          name: 'Maruti Suzuki India',
          price: 12450,
          return: 3.8,
          scores: { alphaScore: 78, qualityScore: 85, valueScore: 82 },
        },
        {
          symbol: 'TITAN',
          name: 'Titan Company',
          price: 3280,
          return: 3.6,
          scores: { alphaScore: 86, qualityScore: 90, valueScore: 72 },
        },
        {
          symbol: 'HDFC',
          name: 'HDFC Bank',
          price: 1545,
          return: 3.2,
          scores: { alphaScore: 85, qualityScore: 93, valueScore: 76 },
        },
      ]),
    },
    {
      id: '5',
      sectionOrder: 5,
      sectionTitle: 'Week Ahead: Key Events to Watch',
      sectionType: 'TABLE_DATA',
      content: JSON.stringify({
        headers: ['Date', 'Event', 'Impact'],
        rows: [
          ['March 18', 'RBI MPC Meeting Outcome', 'High'],
          ['March 19', 'HDFC Bank Q4 Results', 'High'],
          ['March 20', 'US Fed Interest Rate Decision', 'High'],
          ['March 21', 'Reliance Industries Q4 Results', 'High'],
          ['March 22', 'IIP & Inflation Data', 'Medium'],
        ],
      }),
    },
    {
      id: '6',
      sectionOrder: 6,
      sectionTitle: 'Outlook and Strategy',
      sectionType: 'TEXT',
      content: `Looking ahead, market momentum appears constructive with multiple positive factors in play. The earnings season will be crucial in determining sustainability of current valuations.

Key factors to monitor:
- Q4 earnings quality and management commentary
- Global central bank policy decisions
- FII flow trends and positioning
- Crude oil price movements
- Geopolitical developments

Strategy Recommendations:
1. Maintain focus on quality stocks with strong earnings visibility
2. Use any dips as buying opportunities in structurally strong sectors
3. Keep portfolio diversified across market caps and sectors
4. Monitor technical levels for short-term trading decisions
5. Stay updated on earnings announcements and guidance

Risk Factors:
- Unexpected hawkish stance from central banks
- Disappointing earnings results
- Geopolitical tensions escalation
- Sharp crude oil price increases
- FII selling resumption

Overall, the market structure remains positive, but investors should remain selective and focus on quality names with reasonable valuations.`,
    },
  ],
};

export const getReportBySlug = (slug: string) => {
  // In production, this would be an API call
  if (slug === mockReportDetail.slug) {
    return mockReportDetail;
  }
  return null;
};

export const getMockReportsData = (
  filters: { reportType?: 'MACRO' | 'SECTOR' } = {},
  page = 1,
  limit = 10
) => {
  let filteredReports = [...mockReports];

  if (filters.reportType) {
    filteredReports = filteredReports.filter((r) => r.reportType === filters.reportType);
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    reports: filteredReports.slice(startIndex, endIndex),
    totalCount: filteredReports.length,
    page,
    limit,
  };
};
