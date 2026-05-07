/**
 * Create Razorpay Subscription Plans
 *
 * Creates all 8 subscription plans (4 tiers × 2 billing cycles) in Razorpay
 * and stores them in the database
 */

import { PrismaClient } from '@prisma/client';
import { createPlan, MOCK_MODE } from '../src/services/razorpay';

const prisma = new PrismaClient();

const PLANS = [
  // PRO Monthly
  {
    name: 'PRO Monthly',
    tier: 'PRO',
    billingCycle: 'MONTHLY',
    regularPrice: 99900, // ₹999 in paise
    launchPrice: 59940, // 40% off = ₹599.40
    period: 'monthly' as const,
    interval: 1,
  },
  // PRO Annual
  {
    name: 'PRO Annual',
    tier: 'PRO',
    billingCycle: 'ANNUAL',
    regularPrice: 999900, // ₹9,999 in paise
    launchPrice: 599940, // 40% off = ₹5,999.40
    period: 'yearly' as const,
    interval: 1,
  },
  // PREMIUM Monthly
  {
    name: 'PREMIUM Monthly',
    tier: 'PREMIUM',
    billingCycle: 'MONTHLY',
    regularPrice: 199900, // ₹1,999 in paise
    launchPrice: 119940, // 40% off = ₹1,199.40
    period: 'monthly' as const,
    interval: 1,
  },
  // PREMIUM Annual
  {
    name: 'PREMIUM Annual',
    tier: 'PREMIUM',
    billingCycle: 'ANNUAL',
    regularPrice: 1999900, // ₹19,999 in paise
    launchPrice: 1199940, // 40% off = ₹11,999.40
    period: 'yearly' as const,
    interval: 1,
  },
];

async function createRazorpayPlans() {
  console.log('🚀 Creating Razorpay subscription plans...');
  console.log(`Mode: ${MOCK_MODE ? 'MOCK' : 'LIVE'}\n`);

  try {
    for (const planData of PLANS) {
      console.log(`📋 Creating plan: ${planData.name}`);

      // Create plan in Razorpay (or mock)
      const razorpayPlan = await createPlan({
        period: planData.period,
        interval: planData.interval,
        item: {
          name: planData.name,
          amount: planData.launchPrice, // Using launch price initially
          currency: 'INR',
          description: `${planData.tier} tier subscription - ${planData.billingCycle.toLowerCase()}`,
        },
        notes: {
          tier: planData.tier,
          billing_cycle: planData.billingCycle,
        },
      });

      console.log(`  ✅ Razorpay plan created: ${razorpayPlan.id}`);

      // Check if plan exists by name and update, otherwise insert
      const existingPlan = await prisma.$queryRaw<any[]>`
        SELECT id FROM subscription_plans WHERE name = ${planData.name}
      `;

      if (existingPlan.length > 0) {
        // Update existing plan
        await prisma.$executeRawUnsafe(
          `
          UPDATE subscription_plans
          SET razorpay_plan_id = $1,
              tier = $2::"UserTier",
              billing_cycle = $3::"BillingCycle",
              regular_price = $4,
              launch_price = $5
          WHERE name = $6
          `,
          razorpayPlan.id,
          planData.tier,
          planData.billingCycle,
          planData.regularPrice,
          planData.launchPrice,
          planData.name
        );
      } else {
        // Insert new plan
        await prisma.$executeRawUnsafe(
          `
          INSERT INTO subscription_plans (name, razorpay_plan_id, tier, billing_cycle, regular_price, launch_price, is_launch_active)
          VALUES ($1, $2, $3::"UserTier", $4::"BillingCycle", $5, $6, true)
          `,
          planData.name,
          razorpayPlan.id,
          planData.tier,
          planData.billingCycle,
          planData.regularPrice,
          planData.launchPrice
        );
      }

      console.log(`  ✅ Stored in database\n`);
    }

    console.log('✨ All subscription plans created successfully!');
    console.log('\n📊 Summary:');
    console.log('  - PRO Monthly: ₹999 → ₹599 (40% off)');
    console.log('  - PRO Annual: ₹9,999 → ₹5,999 (40% off)');
    console.log('  - PREMIUM Monthly: ₹1,999 → ₹1,199 (40% off)');
    console.log('  - PREMIUM Annual: ₹19,999 → ₹11,999 (40% off)');
    console.log('\n💡 Use coupon EARLYBIRD40 for additional 40% off!');
  } catch (error) {
    console.error('❌ Error creating plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createRazorpayPlans();
