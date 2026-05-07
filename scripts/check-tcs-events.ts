import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTCSEvents() {
  try {
    // Find TCS company
    const company = await prisma.company.findUnique({
      where: { nseSymbol: 'TCS' }
    });

    if (!company) {
      console.log('❌ TCS company not found in database');
      return;
    }

    console.log('✅ Found TCS:');
    console.log('   ID:', company.id);
    console.log('   Name:', company.companyName);

    // Check events for TCS
    const eventCount = await prisma.stockEvent.count({
      where: { companyId: company.id }
    });

    console.log(`\n📊 Total events for TCS: ${eventCount}`);

    if (eventCount > 0) {
      const recentEvents = await prisma.stockEvent.findMany({
        where: { companyId: company.id },
        orderBy: { eventDate: 'desc' },
        take: 5,
        select: {
          eventDate: true,
          eventType: true,
          title: true,
          isVerified: true
        }
      });

      console.log('\n📅 Recent 5 events:');
      recentEvents.forEach(e => {
        const date = e.eventDate.toISOString().split('T')[0];
        const verified = e.isVerified ? '✓' : '✗';
        console.log(`  ${date} | ${e.eventType.padEnd(20)} | ${verified} | ${e.title}`);
      });
    } else {
      console.log('\n❌ No events found for TCS in stock_events table');
      console.log('   You need to populate the database with event data');
    }

    // Check total events in database
    const totalEvents = await prisma.stockEvent.count();
    console.log(`\n📈 Total events in database (all companies): ${totalEvents}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTCSEvents();
