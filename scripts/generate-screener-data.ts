#!/usr/bin/env tsx
/**
 * Generate screener mock data from real Nifty 50 companies in database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateScreenerData() {
  console.log('🚀 Generating screener data from Nifty 50 companies...\n');

  // Get all active companies with their latest price data
  const companies = await prisma.company.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      nseSymbol: true,
      companyName: true,
      sectorId: true,
      sector: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      nseSymbol: 'asc',
    },
  });

  console.log(`Found ${companies.length} active companies\n`);

  // Get latest prices for each company
  const screenerStocks = [];

  for (const company of companies) {
    const priceData = await prisma.$queryRaw<Array<{close: any, open: any}>>`
      SELECT close, open
      FROM price_data
      WHERE company_id = ${company.id}::uuid AND interval = 'DAY_1'
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    if (priceData[0]) {
      const price = Number(priceData[0].close);
      const open = Number(priceData[0].open);
      const change_pct = ((price - open) / open) * 100;

      screenerStocks.push({
        id: company.id,
        symbol: company.nseSymbol,
        companyName: company.companyName,
        sector: company.sector.name,
        exchange: 'NSE' as const,
        cmp: price,
        marketCap: Math.floor(Math.random() * 500000) + 10000, // Placeholder
        marketCapCategory: 'Large' as const, // Nifty 50 are large caps
        qualityScore: Math.floor(Math.random() * 40) + 60, // 60-100
        growthScore: Math.floor(Math.random() * 40) + 60,
        riskScore: Math.floor(Math.random() * 50) + 20, // 20-70
        momentumScore: Math.floor(Math.random() * 40) + 50,
        roe: Math.random() * 30 + 10,
        roce: Math.random() * 35 + 12,
        debtToEquity: Math.random() * 2,
        promoterHolding: Math.random() * 40 + 40,
        pledge: Math.random() * 5,
        rsi: Math.random() * 60 + 20,
        trend: change_pct > 2 ? 'Strong Uptrend' as const :
               change_pct > 0 ? 'Uptrend' as const :
               change_pct > -2 ? 'Sideways' as const :
               change_pct > -5 ? 'Downtrend' as const :
               'Strong Downtrend' as const,
        pe: Math.random() * 40 + 10,
        pb: Math.random() * 10 + 1,
        evEbitda: Math.random() * 20 + 5,
        return1Y: change_pct * 10, // Placeholder
      });
    }
  }

  // Generate TypeScript code
  const tsCode = `/**
 * Mock Screener Data - Generated from Nifty 50 real companies
 * Last updated: ${new Date().toISOString()}
 */

export interface ScreenerStock {
  id: string;
  symbol: string;
  companyName: string;
  sector: string;
  exchange: 'NSE' | 'BSE' | 'BOTH';
  cmp: number;
  marketCap: number;
  marketCapCategory: 'Large' | 'Mid' | 'Small' | 'Micro';
  qualityScore: number;
  growthScore: number;
  riskScore: number;
  momentumScore: number;
  roe: number;
  roce: number;
  debtToEquity: number;
  promoterHolding: number;
  pledge: number;
  rsi: number;
  trend: 'Strong Uptrend' | 'Uptrend' | 'Sideways' | 'Downtrend' | 'Strong Downtrend';
  pe: number;
  pb: number;
  evEbitda: number;
  return1Y: number;
}

export const screenerStocks: ScreenerStock[] = ${JSON.stringify(screenerStocks, null, 2)};

export const allScreenerStocks = screenerStocks;

export const sectorOptions = [
${[...new Set(screenerStocks.map(s => s.sector))].map(sector => {
    const count = screenerStocks.filter(s => s.sector === sector).length;
    return `  { value: '${sector}', label: '${sector}', count: ${count} }`;
  }).join(',\n')}
];
`;

  // Write to file
  const fs = await import('fs');
  const path = await import('path');

  const outputPath = path.join(process.cwd(), 'apps/web/src/data/mockScreenerData.ts');
  fs.writeFileSync(outputPath, tsCode);

  console.log(`✅ Generated screener data with ${screenerStocks.length} stocks`);
  console.log(`📁 Written to: ${outputPath}\n`);

  await prisma.$disconnect();
}

generateScreenerData()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
