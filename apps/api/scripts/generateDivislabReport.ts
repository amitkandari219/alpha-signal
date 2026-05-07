import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateReport() {
  // Find the company
  const company = await prisma.company.findFirst({
    where: { nseSymbol: 'DIVISLAB' }
  });

  if (!company) {
    console.error('❌ Company DIVISLAB not found');
    return;
  }

  console.log('\n' + '='.repeat(80));
  console.log('STOCK KNOWLEDGE REPOSITORY REPORT: DIVI\'S LABORATORIES LIMITED');
  console.log('='.repeat(80));
  console.log(`NSE Symbol: ${company.nseSymbol}`);
  console.log(`Company Name: ${company.companyName}`);
  console.log(`Sector: ${company.sector || 'N/A'}`);
  console.log('='.repeat(80));

  // Fetch Stock Events
  console.log('\n📅 STOCK EVENTS');
  console.log('-'.repeat(80));
  const events = await prisma.stockEvent.findMany({
    where: { companyId: company.id },
    orderBy: { eventDate: 'desc' }
  });

  if (events.length === 0) {
    console.log('  ⚠️  No stock events found for DIVISLAB');
  } else {
    console.log(`  Total Events: ${events.length}\n`);
    events.forEach((event, idx) => {
      console.log(`  ${idx + 1}. ${event.title}`);
      console.log(`     Type: ${event.eventType} | Date: ${event.eventDate.toISOString().split('T')[0]} | Impact: ${event.impactAssessment}`);
      console.log(`     Summary: ${event.summary.substring(0, 200)}...`);
      if (event.detailedContent) {
        console.log(`     Details: ${JSON.stringify(event.detailedContent).substring(0, 150)}...`);
      }
      console.log('');
    });
  }

  // Fetch Milestones
  console.log('\n🏆 COMPANY MILESTONES');
  console.log('-'.repeat(80));
  const milestones = await prisma.stockMilestone.findMany({
    where: { companyId: company.id },
    orderBy: { date: 'desc' }
  });

  if (milestones.length === 0) {
    console.log('  ⚠️  No milestones found for DIVISLAB');
  } else {
    console.log(`  Total Milestones: ${milestones.length}\n`);
    milestones.forEach((milestone, idx) => {
      console.log(`  ${idx + 1}. ${milestone.title}`);
      console.log(`     Type: ${milestone.milestoneType} | Date: ${milestone.date.toISOString().split('T')[0]}`);
      console.log(`     Description: ${milestone.description}`);
      console.log(`     Significance: ${milestone.significance}`);
      console.log('');
    });
  }

  // Fetch Company Profile
  console.log('\n📊 COMPANY PROFILE');
  console.log('-'.repeat(80));
  const profiles = await prisma.companyProfile.findMany({
    where: { companyId: company.id },
    orderBy: { sectionType: 'asc' }
  });

  if (profiles.length === 0) {
    console.log('  ⚠️  No company profile data found for DIVISLAB');
  } else {
    console.log(`  Total Profile Sections: ${profiles.length}\n`);
    profiles.forEach((profile) => {
      console.log(`  📌 ${profile.sectionType}`);
      console.log(`     Last Updated: ${profile.lastUpdated?.toISOString().split('T')[0] || 'N/A'}`);
      console.log(`     Content:`);
      console.log(`     ${JSON.stringify(profile.content, null, 6)}`);
      console.log('');
    });
  }

  // Fetch Timeline Summaries
  console.log('\n📈 TIMELINE SUMMARIES');
  console.log('-'.repeat(80));
  const summaries = await prisma.companyTimelineSummary.findMany({
    where: { companyId: company.id },
    orderBy: { generatedAt: 'desc' }
  });

  if (summaries.length === 0) {
    console.log('  ⚠️  No timeline summaries found for DIVISLAB');
  } else {
    console.log(`  Total Summaries: ${summaries.length}\n`);
    summaries.forEach((summary, idx) => {
      console.log(`  ${idx + 1}. ${summary.periodType}`);
      console.log(`     Period: ${summary.startDate.toISOString().split('T')[0]} to ${summary.endDate.toISOString().split('T')[0]}`);
      console.log(`     Generated: ${summary.generatedAt.toISOString().split('T')[0]}`);
      console.log(`     Narrative: ${summary.narrative.substring(0, 300)}...`);
      if (summary.metrics) {
        console.log(`     Metrics: ${JSON.stringify(summary.metrics)}`);
      }
      console.log('');
    });
  }

  // Summary Statistics
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY STATISTICS');
  console.log('='.repeat(80));
  console.log(`  Total Stock Events: ${events.length}`);
  console.log(`  Total Milestones: ${milestones.length}`);
  console.log(`  Total Profile Sections: ${profiles.length}`);
  console.log(`  Total Timeline Summaries: ${summaries.length}`);

  // Event breakdown
  if (events.length > 0) {
    const eventsByType: Record<string, number> = {};
    const eventsByImpact: Record<string, number> = {};

    events.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      eventsByImpact[event.impactAssessment] = (eventsByImpact[event.impactAssessment] || 0) + 1;
    });

    console.log('\n  Events by Type:');
    Object.entries(eventsByType).forEach(([type, count]) => {
      console.log(`    - ${type}: ${count}`);
    });

    console.log('\n  Events by Impact:');
    Object.entries(eventsByImpact).forEach(([impact, count]) => {
      console.log(`    - ${impact}: ${count}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('END OF REPORT');
  console.log('='.repeat(80) + '\n');
}

generateReport()
  .catch(e => {
    console.error('❌ Error generating report:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
