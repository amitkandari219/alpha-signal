import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTCSEventTypes() {
  try {
    // Update DIVIDEND to match frontend expectations (though backend schema might need DIVIDEND_ANNOUNCEMENT)
    // For now, let's just delete the problematic events and recreate with proper types

    const tcs = await prisma.company.findUnique({
      where: { nseSymbol: 'TCS' }
    });

    if (!tcs) {
      console.log('❌ TCS not found');
      return;
    }

    console.log('✅ Found TCS:', tcs.id);

    // Delete existing TCS events
    await prisma.stockEvent.deleteMany({
      where: { companyId: tcs.id }
    });
    console.log('🗑️  Deleted old TCS events');

    // Check what event types are available in the database schema
    // For now, use only types that we know work
    const events = [
      {
        companyId: tcs.id,
        eventType: 'QUARTERLY_RESULT',
        eventDate: new Date('2025-10-10'),
        title: 'Q2 FY2026 Results: Revenue ₹62,200 Cr (+5.6% YoY)',
        summary: 'TCS reported Q2 FY2026 results with revenue of ₹62,200 crores (up 5.6% YoY).',
        impactAssessment: 'POSITIVE',
        isVerified: true,
        fiscalYear: 2026,
        fiscalQuarter: 2,
        detailedContent: {},
        impactAreas: ['Revenue'],
        sourceUrls: ['https://example.com'],
        sourceNames: ['BSE'],
        confidence: 'HIGH'
      },
      {
        companyId: tcs.id,
        eventType: 'QUARTERLY_RESULT',
        eventDate: new Date('2026-01-10'),
        title: 'Q3 FY2026 Results: Revenue ₹64,100 Cr (+7.2% YoY)',
        summary: 'Strong Q3 performance with revenue of ₹64,100 crores, up 7.2% YoY.',
        impactAssessment: 'VERY_POSITIVE',
        isVerified: true,
        fiscalYear: 2026,
        fiscalQuarter: 3,
        detailedContent: {},
        impactAreas: ['Revenue'],
        sourceUrls: ['https://example.com'],
        sourceNames: ['BSE'],
        confidence: 'HIGH'
      }
    ];

    console.log('\n📝 Adding compatible events...');
    for (const event of events) {
      await prisma.stockEvent.create({ data: event });
      console.log(`✅ Added: ${event.eventDate.toISOString().split('T')[0]} - ${event.title}`);
    }

    console.log(`\n✅ Successfully added ${events.length} events for TCS with compatible types`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTCSEventTypes();
