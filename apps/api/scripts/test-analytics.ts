/**
 * Test Analytics Tracking
 *
 * This script tests the analytics tracking functionality
 * Run with: npx tsx scripts/test-analytics.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAnalytics() {
  console.log('🧪 Testing Analytics Tracking...\n');

  try {
    // Test 1: Create page_analytics table if it doesn't exist
    console.log('1️⃣ Ensuring page_analytics table exists...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS page_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        session_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        event_data JSONB,
        page_url TEXT NOT NULL,
        referrer TEXT,
        user_agent TEXT NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Table ensured\n');

    // Test 2: Create indexes
    console.log('2️⃣ Creating indexes...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS page_analytics_user_id_idx ON page_analytics(user_id);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS page_analytics_session_id_idx ON page_analytics(session_id);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS page_analytics_event_name_idx ON page_analytics(event_name);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS page_analytics_created_at_idx ON page_analytics(created_at);
    `;
    console.log('✅ Indexes created\n');

    // Test 3: Insert test analytics event
    console.log('3️⃣ Inserting test analytics event...');
    const testEvent = await prisma.pageAnalytics.create({
      data: {
        sessionId: `test_session_${Date.now()}`,
        eventName: 'stock_page_view',
        eventData: {
          symbol: 'RELIANCE',
          companyName: 'Reliance Industries',
          sector: 'Oil & Gas',
        },
        pageUrl: 'http://localhost:3000/stock/RELIANCE',
        referrer: 'http://localhost:3000/',
        userAgent: 'Mozilla/5.0 (Test Script)',
      },
    });
    console.log('✅ Test event created:', {
      id: testEvent.id,
      eventName: testEvent.eventName,
      sessionId: testEvent.sessionId,
    });
    console.log('');

    // Test 4: Query analytics events
    console.log('4️⃣ Querying recent analytics events...');
    const recentEvents = await prisma.pageAnalytics.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        eventName: true,
        sessionId: true,
        pageUrl: true,
        createdAt: true,
      },
    });
    console.log('✅ Recent events:', recentEvents.length);
    recentEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.eventName} - ${event.sessionId.substring(0, 20)}...`);
    });
    console.log('');

    // Test 5: Get event counts by event name
    console.log('5️⃣ Counting events by type...');
    const eventCounts = await prisma.pageAnalytics.groupBy({
      by: ['eventName'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });
    console.log('✅ Event breakdown:');
    eventCounts.forEach((event) => {
      console.log(`   ${event.eventName}: ${event._count.id}`);
    });
    console.log('');

    // Test 6: Get unique sessions
    console.log('6️⃣ Counting unique sessions...');
    const uniqueSessions = await prisma.pageAnalytics.findMany({
      select: { sessionId: true },
      distinct: ['sessionId'],
    });
    console.log(`✅ Unique sessions: ${uniqueSessions.length}\n`);

    // Test 7: Clean up test event
    console.log('7️⃣ Cleaning up test event...');
    await prisma.pageAnalytics.delete({
      where: { id: testEvent.id },
    });
    console.log('✅ Test event deleted\n');

    console.log('✨ All analytics tests passed!\n');
  } catch (error) {
    console.error('❌ Error testing analytics:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testAnalytics()
  .then(() => {
    console.log('✅ Analytics test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analytics test failed:', error);
    process.exit(1);
  });
