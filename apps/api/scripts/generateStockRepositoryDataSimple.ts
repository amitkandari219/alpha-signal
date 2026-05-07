/**
 * Generate Minimal Sample Data for Stock Knowledge Repository
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

async function main() {
  console.log('🎯 Generating Stock Knowledge Repository Sample Data...\n');

  const companies = await prisma.company.findMany({
    where: {
      nseSymbol: {
        in: ['DIXON', 'DEEPAKNTR', 'POLYCAB', 'CLEAN', 'ASTRAL']
      }
    }
  });

  if (companies.length !== 5) {
    console.error('❌ Expected 5 companies, found', companies.length);
    return;
  }

  console.log(`✓ Found ${companies.length} companies\n`);

  for (const company of companies) {
    console.log(`📊 Generating data for ${company.companyName}...`);

    // Create 10 stock events
    for (let i = 0; i < 10; i++) {
      await prisma.stockEvent.create({
        data: {
          companyId: company.id,
          eventType: i % 2 === 0 ? 'QUARTERLY_RESULT' : 'ORDER_WIN',
          eventDate: daysAgo(30 * (i + 1)),
          title: `Event ${i + 1} for ${company.companyName}`,
          summary: `This is a sample event created for testing purposes. Event number ${i + 1}.`,
          detailedContent: { value: 100 + i * 10, description: `Details for event ${i + 1}` },
          impactAssessment: i < 3 ? 'VERY_POSITIVE' : i < 7 ? 'POSITIVE' : 'NEUTRAL',
          impactAreas: ['revenue', 'growth'],
          sourceUrls: ['https://example.com/'],
          sourceNames: ['Sample Source'],
          fiscalYear: 2025,
          fiscalQuarter: (i % 4) + 1,
          tags: ['sample', 'test'],
          confidence: 'HIGH',
        }
      });
    }

    // Create 3 milestones
    for (let i = 0; i < 3; i++) {
      await prisma.stockMilestone.create({
        data: {
          companyId: company.id,
          milestoneType: i === 0 ? 'MAJOR_ACHIEVEMENT' : i === 1 ? 'STRATEGIC_SHIFT' : 'MARKET_MILESTONE',
          date: daysAgo(90 * (i + 1)),
          title: `Milestone ${i + 1} for ${company.companyName}`,
          description: `Sample milestone description ${i + 1}.`,
          significance: `This milestone is significant because... ${i + 1}`,
          relatedEventIds: [],
          metadata: { value: i * 100 }
        }
      });
    }

    // Create 7 company profile sections
    const sections = [
      'BUSINESS_MODEL',
      'PRODUCTS_SERVICES',
      'COMPETITIVE_POSITION',
      'MANAGEMENT_TEAM',
      'FINANCIAL_HIGHLIGHTS',
      'GROWTH_DRIVERS',
      'KEY_RISKS'
    ];

    for (const sectionType of sections) {
      await prisma.companyProfile.create({
        data: {
          companyId: company.id,
          sectionType: sectionType as any,
          content: {
            summary: `${sectionType} summary for ${company.companyName}`,
            details: `Detailed information about ${sectionType.toLowerCase().replace('_', ' ')}.`
          }
        }
      });
    }

    // Create 2 timeline summaries
    const periodTypes = ['LAST_90_DAYS', 'LAST_6_MONTHS'] as const;
    for (let i = 0; i < 2; i++) {
      const startDate = daysAgo(180 * (i + 1));
      const endDate = daysAgo(90 * (i + 1));

      await prisma.companyTimelineSummary.create({
        data: {
          companyId: company.id,
          periodType: periodTypes[i],
          startDate,
          endDate,
          keyEvents: [
            { event: `Key event 1 for ${company.companyName}` },
            { event: `Key event 2 for ${company.companyName}` }
          ],
          majorChanges: [
            { change: `Major change 1 for ${company.companyName}` }
          ],
          narrative: `Sample narrative for ${company.companyName}. This period saw strong performance with multiple positive developments.`,
          metrics: {
            revenue_growth: 15 + i * 5,
            major_events: 3 + i
          }
        }
      });
    }

    console.log(`  ✓ Created 10 events, 3 milestones, 7 profiles, 2 summaries`);
  }

  console.log('\n✅ Sample data generation complete!\n');

  const eventCount = await prisma.stockEvent.count();
  const milestoneCount = await prisma.stockMilestone.count();
  const profileCount = await prisma.companyProfile.count();
  const summaryCount = await prisma.companyTimelineSummary.count();

  console.log('📊 Final Statistics:');
  console.log(`  - Stock Events: ${eventCount}`);
  console.log(`  - Milestones: ${milestoneCount}`);
  console.log(`  - Profile Sections: ${profileCount}`);
  console.log(`  - Timeline Summaries: ${summaryCount}`);
  console.log('\n🎉 All done!');
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
