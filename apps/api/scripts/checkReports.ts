import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReports() {
  const reports = await prisma.weeklyReport.findMany({
    select: {
      id: true,
      reportType: true,
      title: true,
      slug: true,
      sector: { select: { name: true } },
      isPublished: true,
      publishedAt: true,
      viewCount: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('📊 Weekly Reports in Database:');
  console.log('Total:', reports.length);
  console.log('');

  reports.forEach((r, i) => {
    console.log(`Report ${i+1}:`);
    console.log(`  Type: ${r.reportType}`);
    console.log(`  Title: ${r.title}`);
    console.log(`  Slug: ${r.slug}`);
    console.log(`  Sector: ${r.sector?.name || 'N/A (Macro)'}`);
    console.log(`  Published: ${r.isPublished}`);
    console.log(`  Views: ${r.viewCount}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkReports();
