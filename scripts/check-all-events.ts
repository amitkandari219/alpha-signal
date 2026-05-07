import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllEvents() {
  try {
    const companiesWithEvents = await prisma.stockEvent.groupBy({
      by: ['companyId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    console.log(`📊 Companies with events (${companiesWithEvents.length} total):\n`);

    for (const item of companiesWithEvents) {
      const company = await prisma.company.findUnique({
        where: { id: item.companyId },
        select: { nseSymbol: true, companyName: true }
      });

      if (company) {
        console.log(`${company.nseSymbol?.padEnd(15)} | ${item._count.id.toString().padStart(2)} events | ${company.companyName}`);
      }
    }

    // Show sample event
    console.log('\n📅 Sample event:');
    const sampleEvent = await prisma.stockEvent.findFirst({
      include: {
        company: {
          select: { nseSymbol: true, companyName: true }
        }
      }
    });

    if (sampleEvent) {
      console.log(`   Symbol: ${sampleEvent.company.nseSymbol}`);
      console.log(`   Date: ${sampleEvent.eventDate.toISOString().split('T')[0]}`);
      console.log(`   Type: ${sampleEvent.eventType}`);
      console.log(`   Title: ${sampleEvent.title}`);
      console.log(`   Impact: ${sampleEvent.impactAssessment}`);
      console.log(`   Verified: ${sampleEvent.isVerified}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllEvents();
