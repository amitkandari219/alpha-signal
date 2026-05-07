/**
 * Quick database check script
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Database Health Check\n');

  // Check users
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, tier: true },
    });
    console.log(`✅ Users table: ${users.length} users`);
    users.forEach(u => console.log(`   - ${u.email} (${u.tier})`));
  } catch (error: any) {
    console.log(`❌ Users table: ${error.message}`);
  }

  // Check companies
  try {
    const companies = await prisma.company.findMany({
      select: { symbol: true, companyName: true },
      take: 10,
    });
    console.log(`\n✅ Company table: ${companies.length} companies`);
    companies.forEach(c => console.log(`   - ${c.symbol}: ${c.companyName}`));
  } catch (error: any) {
    console.log(`\n❌ Company table: ${error.message}`);
  }

  // Check composite_scores
  try {
    const scores = await prisma.compositeScore.findMany({
      select: { symbol: true, qualityScore: true, growthScore: true },
      take: 5,
    });
    console.log(`\n✅ CompositeScore table: ${scores.length} scores`);
  } catch (error: any) {
    console.log(`\n❌ CompositeScore table: ${error.message}`);
  }

  // Check ai_summaries
  try {
    const summaries = await prisma.aiSummary.findMany({
      select: { symbol: true, summaryType: true },
      take: 5,
    });
    console.log(`\n✅ AiSummary table: ${summaries.length} summaries`);
  } catch (error: any) {
    console.log(`\n❌ AiSummary table: ${error.message}`);
  }

  // Check technical_indicators
  try {
    const indicators = await prisma.technicalIndicator.count();
    console.log(`\n✅ TechnicalIndicator table: ${indicators} indicators`);
  } catch (error: any) {
    console.log(`\n❌ TechnicalIndicator table: ${error.message}`);
  }

  // Check news_articles
  try {
    const news = await prisma.newsArticle.count();
    console.log(`\n✅ NewsArticle table: ${news} articles`);
  } catch (error: any) {
    console.log(`\n❌ NewsArticle table: ${error.message}`);
  }

  // Check weekly_reports - not in schema, skip
  console.log(`\n⚠️  WeeklyReport table: Not in current schema`);

  // Check materialized views
  try {
    const mvScreener = await prisma.$queryRaw`SELECT COUNT(*) as count FROM mv_screener_data`;
    console.log(`\n✅ mv_screener_data view exists`);
  } catch (error: any) {
    console.log(`\n❌ mv_screener_data view: ${error.message}`);
  }

  try {
    const mvSector = await prisma.$queryRaw`SELECT COUNT(*) as count FROM mv_sector_aggregates`;
    console.log(`✅ mv_sector_aggregates view exists`);
  } catch (error: any) {
    console.log(`❌ mv_sector_aggregates view: ${error.message}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
