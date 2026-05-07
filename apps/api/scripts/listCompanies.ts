import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      nseSymbol: true,
      companyName: true,
    },
    orderBy: {
      companyName: 'asc'
    }
  });

  console.log('\nAvailable companies in database:');
  console.log('='.repeat(60));
  companies.forEach(c => {
    console.log(`${c.nseSymbol?.padEnd(15)} | ${c.companyName}`);
  });
  console.log('='.repeat(60));
  console.log(`Total: ${companies.length} companies\n`);
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
