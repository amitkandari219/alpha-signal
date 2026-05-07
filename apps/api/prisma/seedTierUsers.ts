/**
 * Seed Test Users with Different Tiers
 *
 * Creates 3 test users for tier validation:
 * - free@test.com (FREE tier)
 * - pro@test.com (PRO tier)
 * - premium@test.com (PREMIUM tier)
 *
 * All users have password: test1234
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedTierUsers() {
  console.log('🌱 Seeding tier test users...');

  const password = 'test1234';
  const passwordHash = await bcrypt.hash(password, 10);

  const testUsers = [
    {
      email: 'free@test.com',
      name: 'Free User',
      tier: 'FREE' as const,
      passwordHash,
      isActive: true,
    },
    {
      email: 'pro@test.com',
      name: 'Pro User',
      tier: 'PRO' as const,
      passwordHash,
      isActive: true,
    },
    {
      email: 'premium@test.com',
      name: 'Premium User',
      tier: 'PREMIUM' as const,
      passwordHash,
      isActive: true,
    },
  ];

  for (const user of testUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      // Update existing user
      await prisma.user.update({
        where: { email: user.email },
        data: { tier: user.tier, passwordHash: user.passwordHash },
      });
      console.log(`✅ Updated ${user.email} (${user.tier} tier)`);
    } else {
      // Create new user
      await prisma.user.create({ data: user });
      console.log(`✅ Created ${user.email} (${user.tier} tier)`);
    }
  }

  console.log('\n📋 Test User Credentials:');
  console.log('FREE tier:    free@test.com / test1234');
  console.log('PRO tier:     pro@test.com / test1234');
  console.log('PREMIUM tier: premium@test.com / test1234\n');

  await prisma.$disconnect();
}

seedTierUsers()
  .catch((error) => {
    console.error('❌ Error seeding tier users:', error);
    process.exit(1);
  });
