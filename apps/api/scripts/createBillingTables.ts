/**
 * Create Billing Tables Script
 *
 * Creates all billing-related tables for Razorpay integration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createBillingTables() {
  console.log('🔧 Creating billing tables...');

  try {
    // Create enums
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'HALTED', 'EXPIRED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "PaymentStatus" AS ENUM ('SUCCESS', 'FAILED', 'REFUNDED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✅ Enums created');

    // Create subscription_plans table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        razorpay_plan_id VARCHAR(255) UNIQUE NOT NULL,
        tier "UserTier" NOT NULL,
        billing_cycle "BillingCycle" NOT NULL,
        regular_price INTEGER NOT NULL,
        launch_price INTEGER NOT NULL,
        is_launch_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ subscription_plans table created');

    // Create coupons table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS coupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(255) UNIQUE NOT NULL,
        discount_pct INTEGER NOT NULL CHECK (discount_pct >= 0 AND discount_pct <= 100),
        max_uses INTEGER NOT NULL,
        current_uses INTEGER DEFAULT 0,
        valid_from TIMESTAMP NOT NULL,
        valid_until TIMESTAMP NOT NULL,
        applicable_tiers TEXT[] NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ coupons table created');

    // Create subscriptions table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        razorpay_subscription_id VARCHAR(255) UNIQUE NOT NULL,
        plan_id UUID NOT NULL REFERENCES subscription_plans(id),
        status "SubscriptionStatus" DEFAULT 'ACTIVE',
        current_period_start TIMESTAMP NOT NULL,
        current_period_end TIMESTAMP NOT NULL,
        cancel_at_period_end BOOLEAN DEFAULT false,
        coupon_id UUID REFERENCES coupons(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);`);
    console.log('✅ subscriptions table created');

    // Create payments table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        razorpay_payment_id VARCHAR(255) UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status "PaymentStatus" DEFAULT 'SUCCESS',
        payment_method VARCHAR(255),
        receipt_url TEXT,
        invoice_number VARCHAR(255) UNIQUE,
        taxable_amount INTEGER,
        gst_amount INTEGER,
        paid_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);`);
    console.log('✅ payments table created');

    // Create webhook_events table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(255) NOT NULL,
        razorpay_event_id VARCHAR(255) UNIQUE NOT NULL,
        payload JSONB NOT NULL,
        processed BOOLEAN DEFAULT false,
        processed_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);`);
    console.log('✅ webhook_events table created');

    // Seed EARLYBIRD40 coupon
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    await prisma.$executeRawUnsafe(`
      INSERT INTO coupons (code, discount_pct, max_uses, current_uses, valid_from, valid_until, applicable_tiers, is_active)
      VALUES (
        'EARLYBIRD40',
        40,
        500,
        0,
        CURRENT_TIMESTAMP,
        $1::timestamp,
        ARRAY['PRO', 'PREMIUM'],
        true
      )
      ON CONFLICT (code) DO NOTHING;
    `, threeMonthsFromNow);
    console.log('✅ EARLYBIRD40 coupon seeded');

    console.log('\n✨ Billing tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating billing tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createBillingTables();
