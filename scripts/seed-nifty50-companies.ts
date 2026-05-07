#!/usr/bin/env tsx
/**
 * Seed Nifty 50 companies into the database
 */

import { PrismaClient, MarketCapCategory } from '@prisma/client';

const prisma = new PrismaClient();

const NIFTY_50_COMPANIES = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Limited', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Limited', sector: 'IT', industry: 'IT Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', sector: 'Financial Services', industry: 'Banks' },
  { symbol: 'INFY', name: 'Infosys Limited', sector: 'IT', industry: 'IT Services' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Limited', sector: 'FMCG', industry: 'Consumer Goods' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', sector: 'Financial Services', industry: 'Banks' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Limited', sector: 'Financial Services', industry: 'Banks' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Financial Services', industry: 'Banks' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', sector: 'Telecom', industry: 'Telecommunications' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited', sector: 'Financial Services', industry: 'Finance' },
  { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG', industry: 'Consumer Goods' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Limited', sector: 'Consumer Durables', industry: 'Paints' },
  { symbol: 'AXISBANK', name: 'Axis Bank Limited', sector: 'Financial Services', industry: 'Banks' },
  { symbol: 'LT', name: 'Larsen & Toubro Limited', sector: 'Construction', industry: 'Infrastructure' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Limited', sector: 'Auto', industry: 'Automobiles' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Limited', sector: 'Pharma', industry: 'Pharmaceuticals' },
  { symbol: 'TITAN', name: 'Titan Company Limited', sector: 'Consumer Durables', industry: 'Jewelry' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Limited', sector: 'Construction', industry: 'Cement' },
  { symbol: 'NESTLEIND', name: 'Nestle India Limited', sector: 'FMCG', industry: 'Food Products' },
  { symbol: 'WIPRO', name: 'Wipro Limited', sector: 'IT', industry: 'IT Services' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Limited', sector: 'IT', industry: 'IT Services' },
  { symbol: 'TECHM', name: 'Tech Mahindra Limited', sector: 'IT', industry: 'IT Services' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Limited', sector: 'Power', industry: 'Power Transmission' },
  { symbol: 'NTPC', name: 'NTPC Limited', sector: 'Power', industry: 'Power Generation' },
  { symbol: 'ONGC', name: 'Oil and Natural Gas Corporation Limited', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', sector: 'Auto', industry: 'Automobiles' },
  { symbol: 'COALINDIA', name: 'Coal India Limited', sector: 'Metals & Mining', industry: 'Mining' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Limited', sector: 'Financial Services', industry: 'Finance' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Limited', sector: 'Auto', industry: 'Automobiles' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone Limited', sector: 'Infrastructure', industry: 'Ports' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Limited', sector: 'Metals & Mining', industry: 'Steel' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Limited', sector: 'Financial Services', industry: 'Banks' },
  { symbol: 'DIVISLAB', name: 'Divi\'s Laboratories Limited', sector: 'Pharma', industry: 'Pharmaceuticals' },
  { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories Limited', sector: 'Pharma', industry: 'Pharmaceuticals' },
  { symbol: 'CIPLA', name: 'Cipla Limited', sector: 'Pharma', industry: 'Pharmaceuticals' },
  { symbol: 'GRASIM', name: 'Grasim Industries Limited', sector: 'Metals & Mining', industry: 'Cement' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Limited', sector: 'Auto', industry: 'Automobiles' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Limited', sector: 'Metals & Mining', industry: 'Aluminum' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Limited', sector: 'Auto', industry: 'Automobiles' },
  { symbol: 'UPL', name: 'UPL Limited', sector: 'Chemicals', industry: 'Agrochemicals' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Limited', sector: 'Metals & Mining', industry: 'Steel' },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Limited', sector: 'FMCG', industry: 'Food Products' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Limited', sector: 'Healthcare', industry: 'Hospitals' },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Limited', sector: 'FMCG', industry: 'Consumer Goods' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Company Limited', sector: 'Financial Services', industry: 'Insurance' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Limited', sector: 'Metals & Mining', industry: 'Mining' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Limited', sector: 'Auto', industry: 'Automobiles' },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Company Limited', sector: 'Financial Services', industry: 'Insurance' },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corporation Limited', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'LTIM', name: 'LTIMindtree Limited', sector: 'IT', industry: 'IT Services' },
];

async function seedNifty50Companies() {
  console.log('🌱 Starting Nifty 50 companies seed...\n');

  try {
    // Get first available sector and industry (they should exist from the Prisma seed)
    const defaultSector = await prisma.sector.findFirst();
    const defaultIndustry = await prisma.industry.findFirst();

    if (!defaultSector || !defaultIndustry) {
      throw new Error('No sectors or industries found. Please run `npx prisma db seed` first.');
    }

    console.log(`✓ Using sector: ${defaultSector.name}`);
    console.log(`✓ Using industry: ${defaultIndustry.name}\n`);

    let created = 0;
    let skipped = 0;

    for (const company of NIFTY_50_COMPANIES) {
      try {
        // Check if company already exists
        const existing = await prisma.company.findUnique({
          where: { nseSymbol: company.symbol },
        });

        if (existing) {
          console.log(`⏭️  ${company.symbol.padEnd(12)} - Already exists`);
          skipped++;
          continue;
        }

        // Create company with required fields
        // Generate a valid 12-character ISIN (format: INE + 9 alphanumeric + check digit)
        const symbolPart = company.symbol.substring(0, 6).padEnd(6, '0');
        const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const isin = `INE${symbolPart}${randomPart}`;  // Exactly 12 characters

        await prisma.company.create({
          data: {
            id: crypto.randomUUID(),
            nseSymbol: company.symbol,
            isin: isin,
            companyName: company.name,
            shortName: company.symbol,
            sectorId: defaultSector.id,
            industryId: defaultIndustry.id,
            marketCapCategory: MarketCapCategory.LARGE_CAP, // Nifty 50 are all large caps
            isActive: true,
            metadata: {
              sector: company.sector,
              industry: company.industry,
            },
          },
        });

        console.log(`✓ ${company.symbol.padEnd(12)} - ${company.name}`);
        created++;
      } catch (error: any) {
        console.error(`✗ ${company.symbol.padEnd(12)} - Error: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Nifty 50 companies seeded successfully!');
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${NIFTY_50_COMPANIES.length}`);
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('\n❌ Error seeding companies:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedNifty50Companies()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
