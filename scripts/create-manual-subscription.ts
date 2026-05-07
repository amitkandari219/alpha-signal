#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createManualSubscription(email: string) {
  try {
    console.log(`🔍 Finding user: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ User found: ${user.tier}`);

    // Check if subscription plan exists
    let plan = await prisma.subscriptionPlan.findFirst({
      where: {
        tier: user.tier as any,
        billingCycle: 'ANNUAL',
      },
    });

    if (!plan) {
      console.log(`📝 Creating subscription plan for ${user.tier}...`);

      const prices = {
        FREE: { regular: 0, launch: 0 },
        PRO: { regular: 499900, launch: 299900 },
        PREMIUM: { regular: 999900, launch: 599900 },
      };

      plan = await prisma.subscriptionPlan.create({
        data: {
          name: `${user.tier} Annual`,
          razorpayPlanId: `manual_${user.tier.toLowerCase()}_annual`,
          tier: user.tier as any,
          billingCycle: 'ANNUAL',
          regularPrice: prices[user.tier as keyof typeof prices].regular,
          launchPrice: prices[user.tier as keyof typeof prices].launch,
          isLaunchActive: true,
        },
      });

      console.log(`✅ Plan created: ${plan.name}`);
    }

    // Check if subscription already exists
    const existingSub = await prisma.subscription.findFirst({
      where: { userId: user.id },
    });

    if (existingSub) {
      console.log(`⚠️  Subscription already exists for this user`);
      console.log(`   Plan: ${existingSub.planId}`);
      console.log(`   Status: ${existingSub.status}`);
      return;
    }

    // Create manual subscription
    const now = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 10); // 10 years from now

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        razorpaySubscriptionId: `manual_${user.id}_lifetime`,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false,
      },
    });

    console.log(`\n✅ Manual subscription created!`);
    console.log(`   User: ${user.email}`);
    console.log(`   Tier: ${user.tier}`);
    console.log(`   Plan: ${plan.name}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Valid Until: ${endDate.toLocaleDateString()} (10 years)`);
    console.log(`\n💡 This is a manual lifetime subscription for testing/admin purposes`);

  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || 'amitkandari219@gmail.com';

console.log(`🚀 Creating Manual Subscription\n`);
createManualSubscription(email).then(() => process.exit(0));
