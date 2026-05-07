/**
 * Create Materialized Views - Simple Version
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating materialized views...\n');

  try {
    // Drop existing views if they exist
    console.log('📝 Dropping existing views (if any)...');
    try {
      await prisma.$executeRawUnsafe('DROP MATERIALIZED VIEW IF EXISTS mv_screener_data CASCADE');
      await prisma.$executeRawUnsafe('DROP MATERIALIZED VIEW IF EXISTS mv_sector_aggregates CASCADE');
      console.log('✓ Dropped existing views\n');
    } catch (error) {
      console.log('⚠️  No existing views to drop\n');
    }

    // Create mv_screener_data
    console.log('📊 Creating mv_screener_data...');
    await prisma.$executeRawUnsafe(`
      CREATE MATERIALIZED VIEW mv_screener_data AS
      SELECT
        c.id as company_id,
        c."nseSymbol" as symbol,
        c."companyName" as company_name,
        c."shortName" as short_name,
        c."marketCapCategory" as market_cap,
        s.name as sector_name,
        cs."qualityScore" as quality,
        cs."growthScore" as growth,
        cs."riskScore" as risk,
        cs."sentimentScore" as sentiment,
        cs."momentumScore" as momentum,
        cs.date as score_date
      FROM "Company" c
      LEFT JOIN "Sector" s ON c."sectorId" = s.id
      LEFT JOIN "CompositeScore" cs ON c.id = cs."companyId" AND cs.date = (
        SELECT MAX(date) FROM "CompositeScore" WHERE "companyId" = c.id
      )
      WHERE c."isActive" = true
    `);
    console.log('✓ Created mv_screener_data\n');

    // Create indexes for mv_screener_data
    console.log('📇 Creating indexes for mv_screener_data...');
    await prisma.$executeRawUnsafe('CREATE INDEX idx_mv_screener_symbol ON mv_screener_data(symbol)');
    await prisma.$executeRawUnsafe('CREATE INDEX idx_mv_screener_sector ON mv_screener_data(sector_name)');
    await prisma.$executeRawUnsafe('CREATE INDEX idx_mv_screener_quality ON mv_screener_data(quality)');
    console.log('✓ Created indexes\n');

    // Create mv_sector_aggregates
    console.log('📊 Creating mv_sector_aggregates...');
    await prisma.$executeRawUnsafe(`
      CREATE MATERIALIZED VIEW mv_sector_aggregates AS
      SELECT
        s.id as sector_id,
        s.name as sector_name,
        COUNT(c.id) as company_count,
        AVG(cs."qualityScore") as avg_quality,
        AVG(cs."growthScore") as avg_growth,
        AVG(cs."riskScore") as avg_risk,
        AVG(cs."sentimentScore") as avg_sentiment,
        AVG(cs."momentumScore") as avg_momentum
      FROM "Sector" s
      LEFT JOIN "Company" c ON c."sectorId" = s.id AND c."isActive" = true
      LEFT JOIN "CompositeScore" cs ON c.id = cs."companyId" AND cs.date = (
        SELECT MAX(date) FROM "CompositeScore" WHERE "companyId" = c.id
      )
      GROUP BY s.id, s.name
    `);
    console.log('✓ Created mv_sector_aggregates\n');

    // Create indexes for mv_sector_aggregates
    console.log('📇 Creating indexes for mv_sector_aggregates...');
    await prisma.$executeRawUnsafe('CREATE INDEX idx_mv_sector_name ON mv_sector_aggregates(sector_name)');
    console.log('✓ Created indexes\n');

    console.log('✅ All materialized views created successfully!\n');

    // Verify
    const screenerCount = await prisma.$queryRaw<any[]>`SELECT COUNT(*) as count FROM mv_screener_data`;
    const sectorCount = await prisma.$queryRaw<any[]>`SELECT COUNT(*) as count FROM mv_sector_aggregates`;

    console.log('📊 Verification:');
    console.log(`  - mv_screener_data: ${screenerCount[0].count} rows`);
    console.log(`  - mv_sector_aggregates: ${sectorCount[0].count} rows`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
