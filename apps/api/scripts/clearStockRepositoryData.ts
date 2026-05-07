/**
 * Clear Stock Repository Data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing stock repository data...\n');

  const deletedSummaries = await prisma.companyTimelineSummary.deleteMany();
  console.log(`✓ Deleted ${deletedSummaries.count} timeline summaries`);

  const deletedProfiles = await prisma.companyProfile.deleteMany();
  console.log(`✓ Deleted ${deletedProfiles.count} company profiles`);

  const deletedMilestones = await prisma.stockMilestone.deleteMany();
  console.log(`✓ Deleted ${deletedMilestones.count} milestones`);

  const deletedEvents = await prisma.stockEvent.deleteMany();
  console.log(`✓ Deleted ${deletedEvents.count} stock events`);

  console.log('\n✅ All stock repository data cleared!');
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
