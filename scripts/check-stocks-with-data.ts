import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStocksWithData() {
  try {
    // Get companies with events
    const companiesWithEvents = await prisma.stockEvent.groupBy({
      by: ['companyId'],
      _count: { id: true }
    });

    console.log('🔍 Checking stocks with events AND price data...\n');

    for (const item of companiesWithEvents) {
      const company = await prisma.company.findUnique({
        where: { id: item.companyId },
        select: {
          nseSymbol: true,
          companyName: true,
          isActive: true
        }
      });

      if (company && company.nseSymbol) {
        // Check if price data exists
        const priceDataCount = await prisma.dailyOHLC.count({
          where: { symbol: company.nseSymbol }
        });

        const status = priceDataCount > 0 ? '✅ HAS PRICE DATA' : '❌ NO PRICE DATA';
        console.log(`${company.nseSymbol?.padEnd(15)} | ${item._count.id.toString().padStart(2)} events | ${status}`);

        if (priceDataCount > 0) {
          console.log(`   → TEST AT: /stock/${company.nseSymbol}`);
          console.log(`   → Company: ${company.companyName}\n`);
        }
      }
    }

    // Also check popular stocks that might have price data
    console.log('\n📊 Checking popular stocks for price data...');
    const popularSymbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC'];

    for (const symbol of popularSymbols) {
      const priceCount = await prisma.dailyOHLC.count({
        where: { symbol }
      });

      if (priceCount > 0) {
        console.log(`✅ ${symbol.padEnd(15)} - ${priceCount} price records`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStocksWithData();
