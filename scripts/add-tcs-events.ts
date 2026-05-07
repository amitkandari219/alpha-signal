import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTCSEvents() {
  try {
    // Find TCS company
    const tcs = await prisma.company.findUnique({
      where: { nseSymbol: 'TCS' }
    });

    if (!tcs) {
      console.log('❌ TCS not found');
      return;
    }

    console.log('✅ Found TCS:', tcs.id);

    // Add some test events for TCS
    const events = [
      {
        companyId: tcs.id,
        eventType: 'QUARTERLY_RESULT',
        eventDate: new Date('2025-10-10'),
        title: 'Q2 FY2026 Results: Revenue ₹62,200 Cr (+5.6% YoY)',
        summary: 'TCS reported Q2 FY2026 results with revenue of ₹62,200 crores (up 5.6% YoY). Net profit stood at ₹12,380 crores with EBITDA margin of 24.5%. Strong growth in BFSI and retail verticals.',
        impactAssessment: 'POSITIVE',
        isVerified: true,
        fiscalYear: 2026,
        fiscalQuarter: 2,
        detailedContent: {},
        impactAreas: ['Revenue', 'Profitability'],
        sourceUrls: ['https://example.com'],
        sourceNames: ['BSE'],
        confidence: 'HIGH'
      },
      {
        companyId: tcs.id,
        eventType: 'DIVIDEND',
        eventDate: new Date('2025-11-15'),
        title: 'Interim Dividend of ₹10 per share declared',
        summary: 'Board of Directors declared an interim dividend of ₹10 per equity share. Record date set for November 25, 2025.',
        impactAssessment: 'POSITIVE',
        isVerified: true,
        detailedContent: {},
        impactAreas: ['Shareholder Returns'],
        sourceUrls: ['https://example.com'],
        sourceNames: ['BSE'],
        confidence: 'HIGH'
      },
      {
        companyId: tcs.id,
        eventType: 'ORDER_WIN',
        eventDate: new Date('2025-12-05'),
        title: '$1.2 Billion Deal with Major US Retailer',
        summary: 'TCS wins major 5-year transformation deal worth $1.2 billion with leading US retailer. Contract includes cloud migration, AI-powered analytics, and digital commerce platforms.',
        impactAssessment: 'VERY_POSITIVE',
        isVerified: true,
        detailedContent: {},
        impactAreas: ['Revenue', 'Growth'],
        sourceUrls: ['https://example.com'],
        sourceNames: ['Press Release'],
        confidence: 'HIGH'
      },
      {
        companyId: tcs.id,
        eventType: 'QUARTERLY_RESULT',
        eventDate: new Date('2026-01-10'),
        title: 'Q3 FY2026 Results: Revenue ₹64,100 Cr (+7.2% YoY)',
        summary: 'Strong Q3 performance with revenue of ₹64,100 crores, up 7.2% YoY and 3.1% QoQ. Net profit grew to ₹12,850 crores. Order book remains robust at $11.2 billion.',
        impactAssessment: 'VERY_POSITIVE',
        isVerified: true,
        fiscalYear: 2026,
        fiscalQuarter: 3,
        detailedContent: {},
        impactAreas: ['Revenue', 'Profitability', 'Growth'],
        sourceUrls: ['https://example.com'],
        sourceNames: ['BSE'],
        confidence: 'HIGH'
      }
    ];

    console.log('\n📝 Adding events...');
    for (const event of events) {
      const created = await prisma.stockEvent.create({
        data: event
      });
      console.log(`✅ Added: ${event.eventDate.toISOString().split('T')[0]} - ${event.title}`);
    }

    console.log(`\n✅ Successfully added ${events.length} events for TCS`);
    console.log('🎯 Now visit /stock/TCS and switch to 3M or 6M to see event markers!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTCSEvents();
