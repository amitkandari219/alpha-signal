#!/usr/bin/env tsx

/**
 * Set User to Premium Status (Simple Version)
 * Usage: npx tsx scripts/set-user-premium-simple.ts <email>
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

      // Simple password hash (for development only)
      const passwordHash = '$2a$10$dummyhashfortesting.pleaseresetpassword';

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
      console.log(`⚠️  Set a proper password via the app!`);
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
      }

      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.name}`);
      console.log(`🎖️  Tier: ${user.tier}`);
    }

    // Show user details
    console.log(`\n📊 User Details:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'Not set'}`);
    console.log(`   Tier: ${user.tier}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Created: ${user.createdAt.toLocaleString()}`);

  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line or use default
const email = process.argv[2] || 'amitkandari219@gmail.com';

console.log(`🚀 Alpha Signal - Set User to PREMIUM`);
console.log(`====================================\n`);

setUserPremium(email)
  .then(() => {
    console.log(``);
    console.log(`✅ Done! User is now PREMIUM.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
