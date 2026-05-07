import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with Alpha Signal sample companies...\n');

  // ============================================
  // 1. SECTORS & INDUSTRIES
  // ============================================
  console.log('📊 Seeding sectors and industries...');

  const sectors = await Promise.all([
    prisma.sector.upsert({
      where: { slug: 'consumer-discretionary' },
      update: {},
      create: {
        name: 'Consumer Discretionary',
        slug: 'consumer-discretionary',
      },
    }),
    prisma.sector.upsert({
      where: { slug: 'chemicals' },
      update: {},
      create: {
        name: 'Chemicals',
        slug: 'chemicals',
      },
    }),
    prisma.sector.upsert({
      where: { slug: 'industrials' },
      update: {},
      create: {
        name: 'Industrials',
        slug: 'industrials',
      },
    }),
    prisma.sector.upsert({
      where: { slug: 'materials' },
      update: {},
      create: {
        name: 'Materials',
        slug: 'materials',
      },
    }),
  ]);

  const industries = await Promise.all([
    prisma.industry.upsert({
      where: { slug: 'consumer-electronics' },
      update: {},
      create: {
        name: 'Consumer Electronics Manufacturing',
        slug: 'consumer-electronics',
        sectorId: sectors[0].id,
      },
    }),
    prisma.industry.upsert({
      where: { slug: 'specialty-chemicals' },
      update: {},
      create: {
        name: 'Specialty Chemicals',
        slug: 'specialty-chemicals',
        sectorId: sectors[1].id,
      },
    }),
    prisma.industry.upsert({
      where: { slug: 'cables-wires' },
      update: {},
      create: {
        name: 'Cables & Wires',
        slug: 'cables-wires',
        sectorId: sectors[2].id,
      },
    }),
    prisma.industry.upsert({
      where: { slug: 'building-materials' },
      update: {},
      create: {
        name: 'Building Materials',
        slug: 'building-materials',
        sectorId: sectors[3].id,
      },
    }),
  ]);

  console.log(`✓ Created ${sectors.length} sectors and ${industries.length} industries\n`);

  // ============================================
  // 2. COMPANIES (The 5 requested companies)
  // ============================================
  console.log('🏢 Seeding companies...');

  const companies = await Promise.all([
    // 1. Dixon Technologies
    prisma.company.upsert({
      where: { nseSymbol: 'DIXON' },
      update: {},
      create: {
        nseSymbol: 'DIXON',
        bseCode: '540699',
        isin: 'INE935N01012',
        companyName: 'Dixon Technologies (India) Limited',
        shortName: 'Dixon Technologies',
        sectorId: sectors[0].id,
        industryId: industries[0].id,
        marketCapCategory: 'MID_CAP',
        listingDate: new Date('2017-09-18'),
        isActive: true,
        metadata: {
          description: 'Leading electronics manufacturing services company in India',
          website: 'https://www.dixoninfo.com',
        },
      },
    }),
    // 2. Deepak Nitrite
    prisma.company.upsert({
      where: { nseSymbol: 'DEEPAKNTR' },
      update: {},
      create: {
        nseSymbol: 'DEEPAKNTR',
        bseCode: '506401',
        isin: 'INE288B01029',
        companyName: 'Deepak Nitrite Limited',
        shortName: 'Deepak Nitrite',
        sectorId: sectors[1].id,
        industryId: industries[1].id,
        marketCapCategory: 'MID_CAP',
        listingDate: new Date('1993-10-22'),
        isActive: true,
        metadata: {
          description: 'Manufacturer of basic and specialty chemicals',
          website: 'https://www.deepaknitrite.com',
        },
      },
    }),
    // 3. Polycab India
    prisma.company.upsert({
      where: { nseSymbol: 'POLYCAB' },
      update: {},
      create: {
        nseSymbol: 'POLYCAB',
        bseCode: '542652',
        isin: 'INE455K01017',
        companyName: 'Polycab India Limited',
        shortName: 'Polycab India',
        sectorId: sectors[2].id,
        industryId: industries[2].id,
        marketCapCategory: 'LARGE_CAP',
        listingDate: new Date('2019-04-16'),
        isActive: true,
        metadata: {
          description: 'India\'s leading manufacturer of wires and cables',
          website: 'https://www.polycab.com',
        },
      },
    }),
    // 4. Clean Science and Technology
    prisma.company.upsert({
      where: { nseSymbol: 'CLEAN' },
      update: {},
      create: {
        nseSymbol: 'CLEAN',
        bseCode: '543318',
        isin: 'INE227W01011',
        companyName: 'Clean Science and Technology Limited',
        shortName: 'Clean Science',
        sectorId: sectors[1].id,
        industryId: industries[1].id,
        marketCapCategory: 'MID_CAP',
        listingDate: new Date('2021-07-19'),
        isActive: true,
        metadata: {
          description: 'Manufacturer of performance chemicals and FMCG additives',
          website: 'https://www.cleansciencetech.com',
        },
      },
    }),
    // 5. Astral Ltd
    prisma.company.upsert({
      where: { nseSymbol: 'ASTRAL' },
      update: {},
      create: {
        nseSymbol: 'ASTRAL',
        bseCode: '541450',
        isin: 'INE006I01046',
        companyName: 'Astral Limited',
        shortName: 'Astral Ltd',
        sectorId: sectors[3].id,
        industryId: industries[3].id,
        marketCapCategory: 'MID_CAP',
        listingDate: new Date('2007-01-02'),
        isActive: true,
        metadata: {
          description: 'Leading manufacturer of CPVC pipes and fittings',
          website: 'https://www.astralltd.com',
        },
      },
    }),
  ]);

  console.log(`✓ Created ${companies.length} companies\n`);

  // ============================================
  // 3. FINANCIAL RESULTS (4 quarters for each)
  // ============================================
  console.log('💰 Seeding financial results...');

  const financialResults = [];

  // Dixon Technologies - Strong growth story
  for (let q = 1; q <= 4; q++) {
    financialResults.push(
      prisma.financialResult.upsert({
        where: {
          companyId_fiscalYear_fiscalQuarter_periodType: {
            companyId: companies[0].id,
            fiscalYear: 2024,
            fiscalQuarter: q,
            periodType: 'QUARTERLY',
          },
        },
        update: {},
        create: {
          companyId: companies[0].id,
          periodType: 'QUARTERLY',
          fiscalYear: 2024,
          fiscalQuarter: q,
          revenue: 4200 + q * 300,
          operatingProfit: 168 + q * 12,
          netProfit: 95 + q * 7,
          eps: 6.2 + q * 0.45,
          operatingMargin: 4.0 + q * 0.1,
          netMargin: 2.25 + q * 0.08,
          publishedAt: new Date(`2024-0${q * 3}-15`),
        },
      })
    );
  }

  // Deepak Nitrite - Stable performer
  for (let q = 1; q <= 4; q++) {
    financialResults.push(
      prisma.financialResult.upsert({
        where: {
          companyId_fiscalYear_fiscalQuarter_periodType: {
            companyId: companies[1].id,
            fiscalYear: 2024,
            fiscalQuarter: q,
            periodType: 'QUARTERLY',
          },
        },
        update: {},
        create: {
          companyId: companies[1].id,
          periodType: 'QUARTERLY',
          fiscalYear: 2024,
          fiscalQuarter: q,
          revenue: 1850 + q * 50,
          operatingProfit: 425 + q * 15,
          netProfit: 315 + q * 10,
          eps: 24.5 + q * 0.8,
          operatingMargin: 23.0,
          netMargin: 17.0,
          publishedAt: new Date(`2024-0${q * 3}-18`),
        },
      })
    );
  }

  // Polycab India - Market leader
  for (let q = 1; q <= 4; q++) {
    financialResults.push(
      prisma.financialResult.upsert({
        where: {
          companyId_fiscalYear_fiscalQuarter_periodType: {
            companyId: companies[2].id,
            fiscalYear: 2024,
            fiscalQuarter: q,
            periodType: 'QUARTERLY',
          },
        },
        update: {},
        create: {
          companyId: companies[2].id,
          periodType: 'QUARTERLY',
          fiscalYear: 2024,
          fiscalQuarter: q,
          revenue: 3800 + q * 200,
          operatingProfit: 456 + q * 24,
          netProfit: 342 + q * 18,
          eps: 22.8 + q * 1.2,
          operatingMargin: 12.0,
          netMargin: 9.0,
          publishedAt: new Date(`2024-0${q * 3}-12`),
        },
      })
    );
  }

  // Clean Science - High margin business
  for (let q = 1; q <= 4; q++) {
    financialResults.push(
      prisma.financialResult.upsert({
        where: {
          companyId_fiscalYear_fiscalQuarter_periodType: {
            companyId: companies[3].id,
            fiscalYear: 2024,
            fiscalQuarter: q,
            periodType: 'QUARTERLY',
          },
        },
        update: {},
        create: {
          companyId: companies[3].id,
          periodType: 'QUARTERLY',
          fiscalYear: 2024,
          fiscalQuarter: q,
          revenue: 280 + q * 15,
          operatingProfit: 112 + q * 6,
          netProfit: 84 + q * 4.5,
          eps: 26.2 + q * 1.4,
          operatingMargin: 40.0,
          netMargin: 30.0,
          publishedAt: new Date(`2024-0${q * 3}-20`),
        },
      })
    );
  }

  // Astral Ltd - Steady grower
  for (let q = 1; q <= 4; q++) {
    financialResults.push(
      prisma.financialResult.upsert({
        where: {
          companyId_fiscalYear_fiscalQuarter_periodType: {
            companyId: companies[4].id,
            fiscalYear: 2024,
            fiscalQuarter: q,
            periodType: 'QUARTERLY',
          },
        },
        update: {},
        create: {
          companyId: companies[4].id,
          periodType: 'QUARTERLY',
          fiscalYear: 2024,
          fiscalQuarter: q,
          revenue: 1450 + q * 75,
          operatingProfit: 232 + q * 12,
          netProfit: 174 + q * 9,
          eps: 15.5 + q * 0.8,
          operatingMargin: 16.0,
          netMargin: 12.0,
          publishedAt: new Date(`2024-0${q * 3}-16`),
        },
      })
    );
  }

  await Promise.all(financialResults);
  console.log(`✓ Created ${financialResults.length} financial results\n`);

  // ============================================
  // 4. BALANCE SHEET DATA
  // ============================================
  console.log('📊 Seeding balance sheet data...');

  const balanceSheets = await Promise.all([
    prisma.balanceSheetData.upsert({
      where: {
        companyId_fiscalYear_fiscalQuarter: {
          companyId: companies[0].id,
          fiscalYear: 2024,
          fiscalQuarter: 3,
        },
      },
      update: {},
      create: {
        companyId: companies[0].id,
        fiscalYear: 2024,
        fiscalQuarter: 3,
        totalAssets: 8450,
        totalDebt: 1200,
        equity: 4800,
        cashEquivalents: 650,
        currentRatio: 1.45,
        debtToEquity: 0.25,
        interestCoverage: 18.5,
      },
    }),
    prisma.balanceSheetData.upsert({
      where: {
        companyId_fiscalYear_fiscalQuarter: {
          companyId: companies[1].id,
          fiscalYear: 2024,
          fiscalQuarter: 3,
        },
      },
      update: {},
      create: {
        companyId: companies[1].id,
        fiscalYear: 2024,
        fiscalQuarter: 3,
        totalAssets: 12500,
        totalDebt: 2100,
        equity: 7800,
        cashEquivalents: 1200,
        currentRatio: 1.85,
        debtToEquity: 0.27,
        interestCoverage: 22.0,
      },
    }),
    prisma.balanceSheetData.upsert({
      where: {
        companyId_fiscalYear_fiscalQuarter: {
          companyId: companies[2].id,
          fiscalYear: 2024,
          fiscalQuarter: 3,
        },
      },
      update: {},
      create: {
        companyId: companies[2].id,
        fiscalYear: 2024,
        fiscalQuarter: 3,
        totalAssets: 18900,
        totalDebt: 3200,
        equity: 11500,
        cashEquivalents: 1850,
        currentRatio: 1.95,
        debtToEquity: 0.28,
        interestCoverage: 20.5,
      },
    }),
    prisma.balanceSheetData.upsert({
      where: {
        companyId_fiscalYear_fiscalQuarter: {
          companyId: companies[3].id,
          fiscalYear: 2024,
          fiscalQuarter: 3,
        },
      },
      update: {},
      create: {
        companyId: companies[3].id,
        fiscalYear: 2024,
        fiscalQuarter: 3,
        totalAssets: 3200,
        totalDebt: 0,
        equity: 2850,
        cashEquivalents: 850,
        currentRatio: 3.2,
        debtToEquity: 0.0,
        interestCoverage: 99.0,
      },
    }),
    prisma.balanceSheetData.upsert({
      where: {
        companyId_fiscalYear_fiscalQuarter: {
          companyId: companies[4].id,
          fiscalYear: 2024,
          fiscalQuarter: 3,
        },
      },
      update: {},
      create: {
        companyId: companies[4].id,
        fiscalYear: 2024,
        fiscalQuarter: 3,
        totalAssets: 9200,
        totalDebt: 1500,
        equity: 6200,
        cashEquivalents: 1100,
        currentRatio: 2.1,
        debtToEquity: 0.24,
        interestCoverage: 24.5,
      },
    }),
  ]);

  console.log(`✓ Created ${balanceSheets.length} balance sheet entries\n`);

  // ============================================
  // 5. SHAREHOLDING PATTERNS (8 quarters history)
  // ============================================
  console.log('👥 Seeding shareholding patterns...');

  const shareholdingPatterns = [];

  for (const [idx, company] of companies.entries()) {
    const basePromoter = [72.5, 69.5, 55.2, 83.8, 48.5][idx];
    for (let q = 0; q < 8; q++) {
      const quarter = new Date(2024, 0, 1);
      quarter.setMonth(quarter.getMonth() - q * 3);

      shareholdingPatterns.push(
        prisma.shareholdingPattern.upsert({
          where: {
            companyId_quarter: {
              companyId: company.id,
              quarter,
            },
          },
          update: {},
          create: {
            companyId: company.id,
            quarter,
            promoterHoldingPct: basePromoter - q * 0.2,
            fiiHoldingPct: 15.5 + q * 0.3,
            diiHoldingPct: 8.2 + q * 0.2,
            publicHoldingPct: 100 - (basePromoter - q * 0.2) - (15.5 + q * 0.3) - (8.2 + q * 0.2),
            pledgePct: 0.0,
            numShareholders: 125000 + idx * 25000,
          },
        })
      );
    }
  }

  await Promise.all(shareholdingPatterns);
  console.log(`✓ Created ${shareholdingPatterns.length} shareholding patterns\n`);

  // ============================================
  // 6. TECHNICAL INDICATORS
  // ============================================
  console.log('📈 Seeding technical indicators...');

  const today = new Date();
  const technicalIndicators = await Promise.all([
    prisma.technicalIndicator.upsert({
      where: { companyId_date: { companyId: companies[0].id, date: today } },
      update: {},
      create: {
        companyId: companies[0].id,
        date: today,
        rsi14: 62.5,
        macd: 18.5,
        macdSignal: 15.3,
        macdHistogram: 3.2,
        sma20: 5820.0,
        sma50: 5650.0,
        sma100: 5450.0,
        sma200: 5200.0,
        adx: 28.5,
      },
    }),
    prisma.technicalIndicator.upsert({
      where: { companyId_date: { companyId: companies[1].id, date: today } },
      update: {},
      create: {
        companyId: companies[1].id,
        date: today,
        rsi14: 55.8,
        macd: 8.2,
        macdSignal: 7.5,
        macdHistogram: 0.7,
        sma20: 2145.0,
        sma50: 2120.0,
        sma100: 2080.0,
        sma200: 2050.0,
        adx: 22.3,
      },
    }),
    prisma.technicalIndicator.upsert({
      where: { companyId_date: { companyId: companies[2].id, date: today } },
      update: {},
      create: {
        companyId: companies[2].id,
        date: today,
        rsi14: 58.2,
        macd: 32.5,
        macdSignal: 28.8,
        macdHistogram: 3.7,
        sma20: 5680.0,
        sma50: 5550.0,
        sma100: 5380.0,
        sma200: 5150.0,
        adx: 25.8,
      },
    }),
    prisma.technicalIndicator.upsert({
      where: { companyId_date: { companyId: companies[3].id, date: today } },
      update: {},
      create: {
        companyId: companies[3].id,
        date: today,
        rsi14: 48.5,
        macd: -5.2,
        macdSignal: -3.8,
        macdHistogram: -1.4,
        sma20: 1485.0,
        sma50: 1520.0,
        sma100: 1580.0,
        sma200: 1650.0,
        adx: 18.5,
      },
    }),
    prisma.technicalIndicator.upsert({
      where: { companyId_date: { companyId: companies[4].id, date: today } },
      update: {},
      create: {
        companyId: companies[4].id,
        date: today,
        rsi14: 52.3,
        macd: 12.5,
        macdSignal: 11.2,
        macdHistogram: 1.3,
        sma20: 1875.0,
        sma50: 1850.0,
        sma100: 1800.0,
        sma200: 1720.0,
        adx: 21.2,
      },
    }),
  ]);

  console.log(`✓ Created ${technicalIndicators.length} technical indicators\n`);

  // ============================================
  // 7. NEWS ARTICLES
  // ============================================
  console.log('📰 Seeding news articles...');

  const newsArticles = await Promise.all([
    prisma.newsArticle.upsert({
      where: { url: 'https://example.com/news/dixon-apple-contract' },
      update: {},
      create: {
        companyId: companies[0].id,
        sectorId: sectors[0].id,
        title: 'Dixon Technologies Bags New Contract from Global Tech Giant',
        source: 'Business Standard',
        url: 'https://example.com/news/dixon-apple-contract',
        publishedAt: new Date('2024-01-15'),
        summary: 'Dixon Technologies secures major manufacturing contract, expected to boost revenues significantly.',
        sentimentScore: 0.8542,
        sentimentLabel: 'POSITIVE',
        impactRating: 'HIGH',
        riskTags: [],
      },
    }),
    prisma.newsArticle.upsert({
      where: { url: 'https://example.com/news/deepak-expansion' },
      update: {},
      create: {
        companyId: companies[1].id,
        sectorId: sectors[1].id,
        title: 'Deepak Nitrite Announces Capacity Expansion Plans',
        source: 'Economic Times',
        url: 'https://example.com/news/deepak-expansion',
        publishedAt: new Date('2024-01-20'),
        summary: 'Company plans to expand phenol and acetone production capacity to meet growing demand.',
        sentimentScore: 0.7234,
        sentimentLabel: 'POSITIVE',
        impactRating: 'MEDIUM',
        riskTags: [],
      },
    }),
    prisma.newsArticle.upsert({
      where: { url: 'https://example.com/news/polycab-fmeg' },
      update: {},
      create: {
        companyId: companies[2].id,
        sectorId: sectors[2].id,
        title: 'Polycab India Expands FMEG Product Portfolio',
        source: 'Mint',
        url: 'https://example.com/news/polycab-fmeg',
        publishedAt: new Date('2024-02-01'),
        summary: 'Polycab diversifies into fast-moving electrical goods segment with new product launches.',
        sentimentScore: 0.6823,
        sentimentLabel: 'POSITIVE',
        impactRating: 'MEDIUM',
        riskTags: [],
      },
    }),
  ]);

  console.log(`✓ Created ${newsArticles.length} news articles\n`);

  // ============================================
  // 8. AI SUMMARIES
  // ============================================
  console.log('🤖 Seeding AI summaries...');

  const aiSummaries = await Promise.all([
    // Dixon Technologies
    prisma.aiSummary.create({
      data: {
        companyId: companies[0].id,
        summaryType: 'BUSINESS_OVERVIEW',
        content: 'Leading electronics manufacturing services company focusing on consumer electronics, mobile phones, washing machines, and LED TVs.',
        modelVersion: 'claude-sonnet-4.5',
        promptVersion: 'v1.2.0',
        confidence: 'HIGH',
        dataFreshnessNote: 'Based on Q3 FY24 data',
      },
    }),
    prisma.aiSummary.create({
      data: {
        companyId: companies[0].id,
        summaryType: 'BULL_CASE',
        content: 'Strong growth potential from PLI scheme benefits, expanding client base, and Make in India tailwinds. Beneficiary of smartphone and consumer electronics manufacturing shift to India.',
        modelVersion: 'claude-sonnet-4.5',
        promptVersion: 'v1.2.0',
        confidence: 'MEDIUM',
      },
    }),
    // Deepak Nitrite
    prisma.aiSummary.create({
      data: {
        companyId: companies[1].id,
        summaryType: 'BUSINESS_OVERVIEW',
        content: 'Integrated chemicals manufacturer producing basic and specialty chemicals including phenol, acetone, and various intermediates.',
        modelVersion: 'claude-sonnet-4.5',
        promptVersion: 'v1.2.0',
        confidence: 'HIGH',
      },
    }),
    prisma.aiSummary.create({
      data: {
        companyId: companies[1].id,
        summaryType: 'BULL_CASE',
        content: 'Backward integration benefits, strong demand for specialty chemicals, and expansion in high-margin products. China+1 strategy beneficiary.',
        modelVersion: 'claude-sonnet-4.5',
        promptVersion: 'v1.2.0',
        confidence: 'MEDIUM',
      },
    }),
    // Polycab India
    prisma.aiSummary.create({
      data: {
        companyId: companies[2].id,
        summaryType: 'BUSINESS_OVERVIEW',
        content: 'Largest manufacturer and seller of wires and cables in India with growing FMEG business. Strong brand and distribution network.',
        modelVersion: 'claude-sonnet-4.5',
        promptVersion: 'v1.2.0',
        confidence: 'HIGH',
      },
    }),
    prisma.aiSummary.create({
      data: {
        companyId: companies[2].id,
        summaryType: 'BULL_CASE',
        content: 'Market leader in wires & cables, diversification into FMEG gaining traction, infrastructure spending tailwinds, and strong balance sheet.',
        modelVersion: 'claude-sonnet-4.5',
        promptVersion: 'v1.2.0',
        confidence: 'HIGH',
      },
    }),
  ]);

  console.log(`✓ Created ${aiSummaries.length} AI summaries\n`);

  // ============================================
  // 9. COMPOSITE SCORES
  // ============================================
  console.log('⭐ Seeding composite scores...');

  const compositeScores = await Promise.all([
    prisma.compositeScore.upsert({
      where: { companyId_date: { companyId: companies[0].id, date: today } },
      update: {},
      create: {
        companyId: companies[0].id,
        date: today,
        qualityScore: 78,
        growthScore: 92,
        riskScore: 32,
        sentimentScore: 85,
        momentumScore: 88,
        factorBreakdown: {
          quality: [{ factor: 'ROE', value: 18.5, weight: 0.3 }, { factor: 'ROIC', value: 16.2, weight: 0.3 }],
          growth: [{ factor: 'Revenue CAGR', value: 45.2, weight: 0.4 }, { factor: 'EPS Growth', value: 52.1, weight: 0.3 }],
        },
      },
    }),
    prisma.compositeScore.upsert({
      where: { companyId_date: { companyId: companies[1].id, date: today } },
      update: {},
      create: {
        companyId: companies[1].id,
        date: today,
        qualityScore: 88,
        growthScore: 72,
        riskScore: 22,
        sentimentScore: 78,
        momentumScore: 68,
        factorBreakdown: {
          quality: [{ factor: 'ROE', value: 24.5, weight: 0.3 }, { factor: 'ROIC', value: 22.1, weight: 0.3 }],
          growth: [{ factor: 'Revenue CAGR', value: 18.5, weight: 0.4 }],
        },
      },
    }),
    prisma.compositeScore.upsert({
      where: { companyId_date: { companyId: companies[2].id, date: today } },
      update: {},
      create: {
        companyId: companies[2].id,
        date: today,
        qualityScore: 85,
        growthScore: 75,
        riskScore: 18,
        sentimentScore: 80,
        momentumScore: 75,
        factorBreakdown: {
          quality: [{ factor: 'ROE', value: 21.2, weight: 0.3 }],
          growth: [{ factor: 'Revenue CAGR', value: 22.3, weight: 0.4 }],
        },
      },
    }),
    prisma.compositeScore.upsert({
      where: { companyId_date: { companyId: companies[3].id, date: today } },
      update: {},
      create: {
        companyId: companies[3].id,
        date: today,
        qualityScore: 95,
        growthScore: 68,
        riskScore: 12,
        sentimentScore: 70,
        momentumScore: 58,
        factorBreakdown: {
          quality: [{ factor: 'ROE', value: 32.5, weight: 0.3 }, { factor: 'Net Margin', value: 30.0, weight: 0.3 }],
          growth: [{ factor: 'Revenue CAGR', value: 25.8, weight: 0.4 }],
        },
      },
    }),
    prisma.compositeScore.upsert({
      where: { companyId_date: { companyId: companies[4].id, date: today } },
      update: {},
      create: {
        companyId: companies[4].id,
        date: today,
        qualityScore: 82,
        growthScore: 78,
        riskScore: 20,
        sentimentScore: 75,
        momentumScore: 72,
        factorBreakdown: {
          quality: [{ factor: 'ROE', value: 19.8, weight: 0.3 }],
          growth: [{ factor: 'Revenue CAGR', value: 28.5, weight: 0.4 }],
        },
      },
    }),
  ]);

  console.log(`✓ Created ${compositeScores.length} composite scores\n`);

  // ============================================
  // 10. INSIDER TRANSACTIONS
  // ============================================
  console.log('💼 Seeding insider transactions...');

  const insiderTransactions = await Promise.all([
    prisma.insiderTransaction.create({
      data: {
        companyId: companies[0].id,
        transactionType: 'BUY',
        quantity: 10000n,
        price: 5650.00,
        value: 56500000.00,
        personName: 'Sunil Vachani',
        personCategory: 'Promoter',
        filingDate: new Date('2024-01-10'),
      },
    }),
    prisma.insiderTransaction.create({
      data: {
        companyId: companies[1].id,
        transactionType: 'SELL',
        quantity: 5000n,
        price: 2180.00,
        value: 10900000.00,
        personName: 'Maulik Mehta',
        personCategory: 'Executive Director',
        filingDate: new Date('2024-01-25'),
      },
    }),
  ]);

  console.log(`✓ Created ${insiderTransactions.length} insider transactions\n`);

  console.log('✅ Database seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - ${sectors.length} sectors`);
  console.log(`   - ${industries.length} industries`);
  console.log(`   - ${companies.length} companies (Dixon, Deepak Nitrite, Polycab, Clean Science, Astral)`);
  console.log(`   - ${financialResults.length} financial results`);
  console.log(`   - ${balanceSheets.length} balance sheets`);
  console.log(`   - ${shareholdingPatterns.length} shareholding patterns`);
  console.log(`   - ${technicalIndicators.length} technical indicators`);
  console.log(`   - ${newsArticles.length} news articles`);
  console.log(`   - ${aiSummaries.length} AI summaries`);
  console.log(`   - ${compositeScores.length} composite scores`);
  console.log(`   - ${insiderTransactions.length} insider transactions`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
