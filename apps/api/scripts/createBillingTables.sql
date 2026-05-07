-- Create billing tables for Razorpay integration

-- Enums
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'HALTED', 'EXPIRED');
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCESS', 'FAILED', 'REFUNDED');

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    razorpay_plan_id VARCHAR(255) UNIQUE NOT NULL,
    tier "UserTier" NOT NULL,
    billing_cycle "BillingCycle" NOT NULL,
    regular_price INTEGER NOT NULL, -- in paise
    launch_price INTEGER NOT NULL,
    is_launch_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(255) UNIQUE NOT NULL,
    discount_pct INTEGER NOT NULL CHECK (discount_pct >= 0 AND discount_pct <= 100),
    max_uses INTEGER NOT NULL,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    applicable_tiers TEXT[] NOT NULL, -- array of tier names
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions
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

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    razorpay_payment_id VARCHAR(255) UNIQUE NOT NULL,
    amount INTEGER NOT NULL, -- in paise
    currency VARCHAR(10) DEFAULT 'INR',
    status "PaymentStatus" DEFAULT 'SUCCESS',
    payment_method VARCHAR(255),
    receipt_url TEXT,
    invoice_number VARCHAR(255) UNIQUE,
    taxable_amount INTEGER, -- in paise
    gst_amount INTEGER, -- in paise
    paid_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Webhook Events
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

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

-- Seed EARLYBIRD40 coupon
INSERT INTO coupons (code, discount_pct, max_uses, current_uses, valid_from, valid_until, applicable_tiers, is_active)
VALUES (
    'EARLYBIRD40',
    40,
    500,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '3 months',
    ARRAY['PRO', 'PREMIUM'],
    true
)
ON CONFLICT (code) DO NOTHING;
