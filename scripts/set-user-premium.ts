#!/usr/bin/env tsx

/**
 * Set User to Premium Status
 * Usage: npx tsx scripts/set-user-premium.ts <email>
 */

import { PrismaClient, UserTier } from '@prisma/client';

const prisma = new PrismaClient();

async function setUserPremium(email: string) {
  try {
    console.log(`🔍 Looking for user: ${email}`);

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create user if doesn't exist
      console.log(`📝 User not found. Creating new user...`);

      // Generate a random password hash (user will need to reset password)
      const bcrypt = require('bcryptjs');
      const tempPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: email.split('@')[0],
          tier: UserTier.PREMIUM,
          isActive: true,
        },
      });

      console.log(`✅ User created with PREMIUM tier`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.name}`);
      console.log(`🎖️  Tier: ${user.tier}`);
      console.log(`🔑 Temporary password: ${tempPassword}`);
      console.log(`⚠️  Please reset password after first login!`);
    } else {
      // Update existing user to PREMIUM
      console.log(`✅ User found. Current tier: ${user.tier}`);

      if (user.tier === UserTier.PREMIUM) {
        console.log(`✨ User is already PREMIUM!`);
      } else {
        user = await prisma.user.update({
          where: { email },
          data: {
            tier: UserTier.PREMIUM,
            isActive: true,
          },
        });

        console.log(`🎉 User upgraded to PREMIUM!`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`👤 Name: ${user.name}`);
        console.log(`🎖️  Tier: ${user.tier}`);
      }
    }

    // Show subscription details if any
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (subscriptions.length > 0) {
      const sub = subscriptions[0];
      console.log(`\n💳 Active Subscription:`);
      console.log(`   Plan: ${sub.plan.name}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Period: ${sub.currentPeriodStart.toLocaleDateString()} - ${sub.currentPeriodEnd.toLocaleDateString()}`);
    } else {
      console.log(`\n⚠️  No subscription found (tier set manually)`);
    }

  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line or use default
const email = process.argv[2] || 'amitkandari219@gmail.com';

console.log(`🚀 Setting user to PREMIUM status...`);
console.log(``);

setUserPremium(email)
  .then(() => {
    console.log(``);
    console.log(`✅ Done!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
