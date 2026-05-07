/**
 * Generate Sample Weekly Reports
 *
 * Creates 4 sample reports:
 * - 1 Macro Weekly Report
 * - 3 Sector Reports (IT, Chemicals, Capital Goods)
 *
 * All reports use realistic Indian market context with professional analyst tone.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateSampleReports() {
  console.log('📊 Generating sample weekly reports...\n');

  const currentDate = new Date();
  const fiscalYear = currentDate.getFullYear();
  const fiscalWeek = Math.floor((currentDate.getTime() - new Date(fiscalYear, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  // Get sectors
  const sectors = await prisma.sector.findMany({
    where: { name: { in: ['Technology', 'Chemicals', 'Capital Goods'] } }
  });

  console.log(`Found ${sectors.length} sectors for sample reports\n`);

  // 1. Generate Macro Weekly Report
  console.log('📈 Creating Macro Weekly Report...');

  const macroReport = await prisma.weeklyReport.create({
    data: {
      reportType: 'MACRO_WEEKLY',
      title: 'Market Weekly: Cautious Optimism Amid Global Uncertainty',
      slug: 'market-weekly-cautious-optimism-global-uncertainty',
      summary: `Indian equity markets showed resilience this week with Nifty50 gaining 1.8% to close at 21,453, while the broader market saw mixed performance. FII flows remained positive at ₹3,245 crore, while DIIs continued their buying streak with ₹5,120 crore inflow. The IT and Banking sectors led the gains, while Metal and Realty faced headwinds. Global cues remained mixed with Fed commentary suggesting a prolonged higher rate environment. Domestic macro indicators showed steady growth with PMI holding above 57, though inflation concerns persist.`,
      fullContent: {
        market_summary: {
          nifty50: { weekly_return: 1.8, monthly_return: 3.2, ytd_return: 8.5 },
          sensex: { weekly_return: 1.7, monthly_return: 3.1, ytd_return: 8.2 },
          midcap100: { weekly_return: 0.5, monthly_return: 1.8, ytd_return: 12.3 },
          smallcap250: { weekly_return: -0.3, monthly_return: 0.9, ytd_return: 15.7 }
        },
        market_breadth: {
          advances: 1245,
          declines: 987,
          new_52w_highs: 23,
          new_52w_lows: 15,
          pct_above_200dma: 58.5
        },
        fii_dii_weekly: {
          fii_net_weekly: 3245,
          dii_net_weekly: 5120,
          fii_monthly_trend: 'Positive after 3 weeks of outflows',
          dii_monthly_trend: 'Consistently strong buying across sectors'
        },
        currency_commodities: {
          usd_inr: { weekly_change: 0.3, impact_note: 'Rupee weakened marginally; import-heavy sectors may face headwinds' },
          crude_oil: { weekly_change: 2.1, impact_note: 'WTI crude rose on OPEC supply concerns; OMCs under pressure' },
          gold: { weekly_change: 1.5, impact_note: 'Safe haven demand amid geopolitical tensions' }
        },
        macro_indicators: {
          gdp_latest: { value: 7.6, trend: 'Strong growth momentum', last_updated: 'Dec 2025' },
          iip_latest: { value: 5.2, trend: 'Manufacturing uptick', last_updated: 'Jan 2026' },
          pmi_latest: { value: 57.8, trend: 'Sustained expansion', last_updated: 'Feb 2026' },
          cpi_latest: { value: 5.4, trend: 'Above RBI comfort zone', last_updated: 'Jan 2026' },
          repo_rate: { value: 6.5, trend: 'Unchanged; pause continues', last_updated: 'Feb 2026' }
        },
        sector_rotation: {
          leading_sectors: ['Information Technology', 'Banking & Finance', 'Healthcare'],
          lagging_sectors: ['Metal & Mining', 'Real Estate', 'Media & Entertainment'],
          improving_sectors: ['Capital Goods', 'Automobiles'],
          weakening_sectors: ['FMCG', 'Cement']
        },
        global_context: {
          us_fed_update: 'Fed Chair Powell indicated rates may stay higher for longer, with no cuts expected before mid-2026. US job data came in stronger than expected.',
          china_impact: 'Chinese manufacturing PMI showed marginal improvement. Property sector concerns persist, though stimulus measures are providing support.',
          europe_update: 'ECB hinted at potential rate cuts in Q2 2026. European economies showing signs of recovery after prolonged weakness.'
        },
        ai_weekly_thesis: {
          title: 'Cautious Optimism Amid Global Uncertainty',
          paragraphs: [
            'Indian markets demonstrated resilience this week, with the Nifty50 gaining 1.8% despite mixed global cues and elevated valuations. The rally was broad-based initially but narrowed towards the week-end, with large-caps outperforming mid and small-caps significantly. This divergence suggests profit-taking in the frothier segments while institutional money continues to find value in quality large-caps.',
            'The FII-DII dynamics remained constructive, with domestic institutional buying more than offsetting any foreign selling pressure. DIIs deployed ₹5,120 crore this week, primarily in Banking, IT, and Consumer Discretionary sectors. FIIs turned net buyers with ₹3,245 crore inflow, marking a reversal from the previous three weeks of consistent selling. This shift appears driven by renewed interest in Indian IT exporters amid a potential US economic soft landing.',
            'Macro indicators present a mixed picture. While GDP growth remains robust at 7.6% and manufacturing activity stays elevated (PMI at 57.8), inflation at 5.4% continues to limit RBI\'s policy flexibility. The central bank is expected to maintain its hawkish stance in the near term, which could cap upside for rate-sensitive sectors. Global central banks diverging on policy paths adds another layer of complexity for market direction.',
            'Looking ahead, corporate earnings will be the key catalyst. With Q4 earnings season approaching, Street expects mid-teens profit growth led by BFSI, IT, and select industrials. Any disappointment could trigger profit-booking given current valuations. Geopolitical tensions, crude oil prices, and domestic inflation trajectory remain key monitorables. Selective stock-picking in quality names with reasonable valuations appears prudent over broad market bets.'
          ],
          key_watch_items: [
            'Q4 earnings trajectory - especially for BFSI and IT sectors',
            'RBI monetary policy meeting outcome in April',
            'Global crude oil prices and their impact on OMCs and inflation',
            'FII flow sustainability amid Fed\'s higher-for-longer stance',
            'State election outcomes and their potential policy implications'
          ]
        }
      },
      publishedAt: currentDate,
      fiscalWeek,
      fiscalYear,
      isPublished: true,
      viewCount: 247
    }
  });

  console.log(`✓ Created Macro Weekly Report: ${macroReport.title}\n`);

  // 2. Generate IT Sector Report
  if (sectors.find(s => s.name === 'Technology')) {
    console.log('💻 Creating IT Sector Weekly Report...');

    const itSector = sectors.find(s => s.name === 'Technology')!;
    const itReport = await prisma.weeklyReport.create({
      data: {
        reportType: 'SECTOR_WEEKLY',
        sectorId: itSector.id,
        title: 'IT Sector Weekly: Deal Momentum Accelerates Amid Wage Hike Concerns',
        slug: 'it-sector-deal-momentum-accelerates-wage-hikes',
        summary: `The Indian IT sector rallied 3.2% this week, outperforming the broader market on strong deal wins and improving commentary from US clients. TCS announced a ₹28,000 crore mega-deal while Infosys raised its revenue guidance for FY2026. However, wage hike announcements by tier-1 players raised margin concerns. The sector continues to benefit from the AI transformation theme, with most companies highlighting growing demand for gen-AI integration projects. FIIs increased stake in IT majors, suggesting renewed confidence in the sector's growth outlook.`,
        fullContent: {
          performance_summary: {
            sector_return_pct: 3.2,
            vs_nifty500_pct: 1.5,
            trend_direction: 'UP'
          },
          top_movers: {
            gainers: [
              { symbol: 'TCS', name: 'Tata Consultancy Services', return_pct: 4.5, reason: 'Mega-deal announcement worth ₹28,000 crore; strong Q4 guidance' },
              { symbol: 'INFY', name: 'Infosys', return_pct: 3.8, reason: 'Revenue guidance upgrade; large deal wins in BFSI vertical' },
              { symbol: 'TECHM', name: 'Tech Mahindra', return_pct: 5.2, reason: 'Turnaround story gaining traction; cost optimization efforts showing results' }
            ],
            losers: [
              { symbol: 'LTTS', name: 'L&T Technology Services', return_pct: -1.2, reason: 'Concerns over ER&D spending cuts by automotive clients' },
              { symbol: 'PERSISTENT', name: 'Persistent Systems', return_pct: -0.8, reason: 'Profit booking after strong run-up; no specific negative news' }
            ]
          },
          key_events: [
            { headline: 'TCS wins ₹28,000 crore decade-long deal from UK retailer', impact: 'Significant revenue visibility; validates large deal pipeline strength', sentiment: 'Positive', source: 'Company Press Release' },
            { headline: 'Infosys raises FY26 revenue guidance to 5-7% CC growth', impact: 'Confidence in demand recovery; offsets wage hike concerns', sentiment: 'Positive', source: 'Investor Presentation' },
            { headline: 'IT firms announce 8-10% wage hikes effective April', impact: 'Margin pressure in Q1; attrition control measures', sentiment: 'Neutral', source: 'Industry Sources' },
            { headline: 'NASSCOM projects 6-8% industry growth for FY26', impact: 'Tempered expectations; focus on AI-driven services', sentiment: 'Neutral', source: 'NASSCOM Annual Report' }
          ],
          fii_dii_flow: {
            fii_net: 1245.5,
            dii_net: 823.2,
            trend_vs_last_week: 'FII inflows accelerated; DII maintained steady buying'
          },
          policy_updates: [
            { policy: 'PLI Scheme for IT Hardware extended to software services', impact_on_sector: 'Potential incentives for expanding R&D centers in India', sentiment: 'Positive' },
            { policy: 'Data Privacy Bill cleared by cabinet', impact_on_sector: 'Compliance costs to rise; opportunities in data governance solutions', sentiment: 'Neutral' }
          ],
          ai_outlook: {
            paragraphs: [
              'The IT sector demonstrated strong momentum this week, significantly outperforming the broader market with a 3.2% gain. The rally was driven by a combination of large deal wins, improving client commentary, and renewed FII interest. TCS\'s mega-deal announcement and Infosys\'s guidance upgrade have reinforced confidence in the sector\'s ability to navigate the uncertain macro environment and capture market share.',
              'The deal pipeline across tier-1 IT services companies remains robust, with increasing focus on digital transformation, cloud migration, and gen-AI implementation projects. Client spending is stabilizing after a prolonged period of discretionary cuts, though mega-deals are becoming more competitive and margin-dilutive. The shift towards outcome-based and consumption-linked contracts is evident, requiring IT firms to invest more upfront.',
              'Margin concerns have resurfaced following wage hike announcements by major players. With 8-10% salary increases effective April and limited pricing power in competitive segments, Q1 FY27 margins could face 100-150 bps headwinds. However, companies are banking on operational efficiencies through AI-led automation and pyramid optimization to cushion the impact. The focus is shifting from revenue growth to sustainable margin expansion.'
            ],
            confidence: 'HIGH',
            key_risks: [
              'Potential US recession impacting discretionary IT spending',
              'Wage inflation and attrition pressure on margins',
              'Intense competition in gen-AI services affecting deal profitability'
            ],
            key_opportunities: [
              'Growing demand for gen-AI integration across enterprises',
              'Cloud migration acceleration as enterprises modernize legacy systems',
              'Market share gains from tier-2 players struggling with talent retention'
            ]
          },
          top_stocks: [
            { symbol: 'TCS', name: 'Tata Consultancy Services', quality_score: 88, growth_score: 72, current_price: 3845, week_return: 4.5 },
            { symbol: 'INFY', name: 'Infosys', quality_score: 85, growth_score: 70, current_price: 1523, week_return: 3.8 },
            { symbol: 'WIPRO', name: 'Wipro', quality_score: 78, growth_score: 65, current_price: 445, week_return: 2.1 }
          ]
        },
        publishedAt: currentDate,
        fiscalWeek,
        fiscalYear,
        isPublished: true,
        viewCount: 183
      }
    });

    console.log(`✓ Created IT Sector Report: ${itReport.title}\n`);
  }

  // 3. Generate Chemicals Sector Report
  if (sectors.find(s => s.name === 'Chemicals')) {
    console.log('🧪 Creating Chemicals Sector Weekly Report...');

    const chemSector = sectors.find(s => s.name === 'Chemicals')!;
    const chemReport = await prisma.weeklyReport.create({
      data: {
        reportType: 'SECTOR_WEEKLY',
        sectorId: chemSector.id,
        title: 'Chemicals Sector Weekly: Pricing Power Returns as China Inventory Normalizes',
        slug: 'chemicals-pricing-power-returns-china-inventory',
        summary: `The specialty chemicals sector bounced back 2.3% this week after consolidating for two months, driven by signs of pricing stabilization and inventory normalization in China. Companies like Deepak Nitrite and PI Industries reported improved order books with better realization prospects. Agrochemical players saw demand pick up ahead of the Kharif season. However, commodity chemical players remain under pressure due to overcapacity and weak global demand. The sector's outlook is improving with China+1 tailwinds and capex-led volume growth visible across specialty segments.`,
        fullContent: {
          performance_summary: {
            sector_return_pct: 2.3,
            vs_nifty500_pct: 0.6,
            trend_direction: 'UP'
          },
          top_movers: {
            gainers: [
              { symbol: 'DEEPAKNTR', name: 'Deepak Nitrite', return_pct: 5.1, reason: 'Strong Q4 guidance; phenol capacity expansion on track' },
              { symbol: 'PI', name: 'PI Industries', return_pct: 3.9, reason: 'Agrochemical demand revival ahead of Kharif; new molecule launches' },
              { symbol: 'CLEAN', name: 'Clean Science', return_pct: 4.3, reason: 'China inventory destocking complete; European order book improving' }
            ],
            losers: [
              { symbol: 'GUJALKALI', name: 'Gujarat Alkalies', return_pct: -2.1, reason: 'Weak caustic soda pricing; commodity cycle headwinds' },
              { symbol: 'ATUL', name: 'Atul Ltd', return_pct: -1.5, reason: 'Margin pressure due to input cost inflation' }
            ]
          },
          key_events: [
            { headline: 'Deepak Nitrite announces ₹1,200 crore phenol capex', impact: 'Capacity expansion to capture import substitution opportunity', sentiment: 'Positive', source: 'Analyst Meet' },
            { headline: 'China chemical exports decline 8% YoY in January', impact: 'Positive for Indian specialty chemical players; pricing power returns', sentiment: 'Positive', source: 'China Customs Data' },
            { headline: 'Agrochemical demand expected to rise 12-15% in Kharif 2026', impact: 'Volume growth for PI Industries, UPL, and Dhanuka Agritech', sentiment: 'Positive', source: 'Industry Report' },
            { headline: 'US EPA extends review period for new agrochemical molecules', impact: 'Delays in commercialization; R&D timelines extended', sentiment: 'Negative', source: 'Regulatory Update' }
          ],
          fii_dii_flow: {
            fii_net: 325.8,
            dii_net: 567.2,
            trend_vs_last_week: 'Both FII and DII flows turned positive after 6 weeks of selling'
          },
          policy_updates: [
            { policy: 'PLI for bulk drugs extended to specialty chemicals', impact_on_sector: 'Potential incentives for backward integration and capacity expansion', sentiment: 'Positive' },
            { policy: 'Anti-dumping duty on Chinese chemical imports extended', impact_on_sector: 'Protection for domestic players; pricing power improves', sentiment: 'Positive' }
          ],
          ai_outlook: {
            paragraphs: [
              'The chemicals sector staged a recovery this week, with specialty chemical players leading the charge. The 2.3% sectoral gain was primarily driven by improving commentary on pricing stabilization and inventory normalization in China. After months of destocking that pressured realizations, companies are now seeing order books rebuild with better pricing visibility. This turnaround is particularly evident in segments like specialty pigments, FMCG chemicals, and agrochemical intermediates.',
              'The China+1 theme continues to play out favorably for Indian specialty chemical manufacturers. With Chinese producers grappling with environmental compliance costs and Western buyers diversifying supply chains, Indian players are winning market share in high-margin molecules. Deepak Nitrite and Clean Science have reported strong inquiry pipelines from European and US customers. However, the transition is gradual, and near-term volume growth remains muted.',
              'Agrochemical demand is showing green shoots ahead of the Kharif season. Normal monsoon predictions and healthy reservoir levels bode well for agrochemical consumption. PI Industries and Dhanuka Agritech are likely to benefit from both volume growth and new product launches. However, commodity chemical players remain under pressure due to global overcapacity and weak end-user demand, particularly in construction and automotive sectors.'
            ],
            confidence: 'MEDIUM',
            key_risks: [
              'Chinese producers resuming aggressive pricing if demand fails to pick up',
              'Extended delays in new molecule approvals impacting CSM players',
              'Weak global industrial demand affecting bulk chemicals'
            ],
            key_opportunities: [
              'China+1 supply chain diversification benefiting Indian specialty players',
              'Strong agrochemical season expected with normal monsoon forecast',
              'Capacity expansions in phenol, FMCG chemicals coming onstream'
            ]
          },
          top_stocks: [
            { symbol: 'DEEPAKNTR', name: 'Deepak Nitrite', quality_score: 82, growth_score: 78, current_price: 2156, week_return: 5.1 },
            { symbol: 'PI', name: 'PI Industries', quality_score: 85, growth_score: 75, current_price: 3678, week_return: 3.9 },
            { symbol: 'CLEAN', name: 'Clean Science', quality_score: 88, growth_score: 80, current_price: 1543, week_return: 4.3 }
          ]
        },
        publishedAt: currentDate,
        fiscalWeek,
        fiscalYear,
        isPublished: true,
        viewCount: 156
      }
    });

    console.log(`✓ Created Chemicals Sector Report: ${chemReport.title}\n`);
  }

  // 4. Generate Capital Goods Sector Report
  if (sectors.find(s => s.name === 'Capital Goods')) {
    console.log('⚙️  Creating Capital Goods Sector Weekly Report...');

    const capGoodsSector = sectors.find(s => s.name === 'Capital Goods')!;
    const capGoodsReport = await prisma.weeklyReport.create({
      data: {
        reportType: 'SECTOR_WEEKLY',
        sectorId: capGoodsSector.id,
        title: 'Capital Goods Weekly: Capex Cycle Strengthens with PLI Push',
        slug: 'capital-goods-capex-cycle-pli-push',
        summary: `The capital goods sector advanced 1.9% this week, supported by robust order inflows and positive management commentary on the capex cycle. L&T reported order wins worth ₹45,000 crore, spanning infrastructure, green energy, and defence. Railway and defence-focused companies saw heightened interest following budget allocation announcements. The government's PLI push and infrastructure spending are driving visibility for domestic manufacturers. While valuations remain elevated, the earnings growth trajectory appears sustainable with FY26 revenue growth expectations of 15-18% for tier-1 players.`,
        fullContent: {
          performance_summary: {
            sector_return_pct: 1.9,
            vs_nifty500_pct: 0.2,
            trend_direction: 'UP'
          },
          top_movers: {
            gainers: [
              { symbol: 'LT', name: 'Larsen & Toubro', return_pct: 2.8, reason: 'Strong order inflows of ₹45,000 crore; robust pipeline visibility' },
              { symbol: 'GRSE', name: 'GRSE', return_pct: 6.2, reason: 'Defence order wins; warship delivery timelines improving' },
              { symbol: 'ABB', name: 'ABB India', return_pct: 3.1, reason: 'Electric vehicle charging and automation demand rising' }
            ],
            losers: [
              { symbol: 'THERMAX', name: 'Thermax', return_pct: -1.8, reason: 'Valuation concerns after recent run-up; no specific negative' },
              { symbol: 'CUMMINS', name: 'Cummins India', return_pct: -2.3, reason: 'Power generation demand softening; renewable energy transition concerns' }
            ]
          },
          key_events: [
            { headline: 'L&T wins ₹45,000 crore orders in green energy and infrastructure', impact: 'Strong order book replenishment; execution visibility for next 18-24 months', sentiment: 'Positive', source: 'Company Filing' },
            { headline: 'Railway budget allocation increased 22% YoY to ₹2.8 lakh crore', impact: 'Sustained demand for railway equipment, signaling, and electrification', sentiment: 'Positive', source: 'Union Budget 2026' },
            { headline: 'Defence capital outlay raised to ₹1.72 lakh crore for FY27', impact: 'Positive for defence PSUs and private players with Make in India focus', sentiment: 'Positive', source: 'Ministry of Defence' },
            { headline: 'PLI incentives for EV charging infrastructure announced', impact: 'Growth opportunity for electrical equipment manufacturers', sentiment: 'Positive', source: 'Ministry of Heavy Industries' }
          ],
          fii_dii_flow: {
            fii_net: 445.3,
            dii_net: 712.8,
            trend_vs_last_week: 'Consistent buying in capital goods and infrastructure themes'
          },
          policy_updates: [
            { policy: 'National Infrastructure Pipeline extended to ₹150 lakh crore', impact_on_sector: 'Long-term order visibility for L&T, KEC, Kalpataru Power', sentiment: 'Positive' },
            { policy: 'Simplified approval for defence manufacturing licenses', impact_on_sector: 'Faster project execution; reduced bureaucratic delays', sentiment: 'Positive' }
          ],
          ai_outlook: {
            paragraphs: [
              'The capital goods sector continues to ride the domestic capex cycle with strong order inflows and expanding order books. This week\'s 1.9% gain reflects sustained confidence in infrastructure and defence spending, despite rich valuations. L&T\'s ₹45,000 crore order wins underscore the breadth of opportunities spanning green energy, hydrocarbon infrastructure, and urban metro projects. The diversified order mix reduces dependency on any single vertical and provides earnings visibility well into FY27.',
              'Railway and defence sub-sectors are witnessing heightened activity following budget announcements. The 22% increase in railway capital allocation and ₹1.72 lakh crore defence outlay are material positives for PSUs like RVNL, IRFC, and GRSE. Private players like L&T, Bharat Forge, and BEL are also positioned to benefit from the ongoing indigenization push under the Aatmanirbhar Bharat initiative. Execution remains key, with project delays being the primary risk.',
              'The transition towards green energy and electric mobility is opening new avenues for electrical equipment manufacturers. Companies like ABB India, Siemens, and Havells are seeing strong demand for EV charging infrastructure, battery storage systems, and grid modernization equipment. The PLI scheme for EV charging adds another growth lever. However, traditional power generation equipment faces headwinds as thermal capacity additions slow down in favor of renewable energy.'
            ],
            confidence: 'HIGH',
            key_risks: [
              'Execution delays in large infrastructure projects impacting revenue recognition',
              'Working capital intensity rising with larger project scales',
              'Commodity price volatility affecting margins on fixed-price contracts'
            ],
            key_opportunities: [
              'Sustained government infrastructure spending providing multi-year order visibility',
              'Defence indigenization creating opportunities for private sector players',
              'Green energy transition driving demand for electrical equipment and grid infrastructure',
              'PLI schemes for EV charging and advanced manufacturing'
            ]
          },
          top_stocks: [
            { symbol: 'LT', name: 'Larsen & Toubro', quality_score: 87, growth_score: 82, current_price: 3456, week_return: 2.8 },
            { symbol: 'ABB', name: 'ABB India', quality_score: 84, growth_score: 76, current_price: 6789, week_return: 3.1 },
            { symbol: 'GRSE', name: 'GRSE', quality_score: 72, growth_score: 85, current_price: 1234, week_return: 6.2 }
          ]
        },
        publishedAt: currentDate,
        fiscalWeek,
        fiscalYear,
        isPublished: true,
        viewCount: 142
      }
    });

    console.log(`✓ Created Capital Goods Sector Report: ${capGoodsReport.title}\n`);
  }

  console.log('✅ Sample reports generation complete!\n');
  console.log('📊 Summary:');
  console.log('   - 1 Macro Weekly Report');
  console.log('   - 3 Sector Reports (IT, Chemicals, Capital Goods)');
  console.log('   - All reports marked as published');
  console.log('   - Realistic Indian market context');
  console.log('   - Professional financial analyst tone');
  console.log('   - SEBI-compliant content (no buy/sell recommendations)\n');

  await prisma.$disconnect();
}

generateSampleReports()
  .catch((error) => {
    console.error('❌ Error generating sample reports:', error);
    process.exit(1);
  });
