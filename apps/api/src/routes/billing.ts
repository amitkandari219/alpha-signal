/**
 * Billing Routes
 *
 * Handles subscription creation, management, webhooks, and coupon validation
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  createSubscription,
  cancelSubscription,
  verifyWebhookSignature,
  calculateGST,
  generateInvoiceNumber,
  applyCouponDiscount,
  MOCK_MODE,
} from '../services/razorpay';

const prisma = new PrismaClient();

export default async function billingRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/subscription-plans
   * Get all subscription plans (public)
   */
  fastify.get('/api/subscription-plans', async (request, reply) => {
    try {
      const plans = await prisma.$queryRaw<any[]>`
        SELECT * FROM subscription_plans
        ORDER BY
          CASE tier
            WHEN 'PRO' THEN 1
            WHEN 'PREMIUM' THEN 2
            ELSE 3
          END,
          CASE billing_cycle
            WHEN 'MONTHLY' THEN 1
            WHEN 'ANNUAL' THEN 2
            ELSE 3
          END
      `;

      return reply.send({ plans });
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * GET /api/subscription-plans/:id
   * Get a single subscription plan (public)
   */
  fastify.get('/api/subscription-plans/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const plan = await prisma.$queryRaw<any[]>`
        SELECT * FROM subscription_plans WHERE id = ${id}::uuid
      `;

      if (plan.length === 0) {
        return reply.code(404).send({ error: 'Plan not found' });
      }

      return reply.send({ plan: plan[0] });
    } catch (error: any) {
      console.error('Error fetching plan:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * POST /billing/create-subscription
   * Create a new subscription
   */
  fastify.post(
    '/billing/create-subscription',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { planId, couponCode } = request.body as {
        planId: string;
        couponCode?: string;
      };

      const userId = request.user!.id;

      try {
        // Check for existing active subscription
        const existingSubscription = await prisma.$queryRaw<any[]>`
          SELECT * FROM subscriptions
          WHERE user_id = ${userId}::uuid
          AND status = 'ACTIVE'
          LIMIT 1
        `;

        if (existingSubscription.length > 0) {
          return reply.code(400).send({
            error: 'User already has an active subscription',
          });
        }

        // Fetch plan details
        const plan = await prisma.$queryRaw<any[]>`
          SELECT * FROM subscription_plans
          WHERE id = ${planId}::uuid
        `;

        if (plan.length === 0) {
          return reply.code(404).send({ error: 'Plan not found' });
        }

        const planData = plan[0];
        let finalAmount = planData.is_launch_active
          ? planData.launch_price
          : planData.regular_price;

        let couponId = null;

        // Apply coupon if provided
        if (couponCode) {
          const couponResult = await prisma.$queryRaw<any[]>`
            SELECT * FROM coupons
            WHERE code = ${couponCode}
            AND is_active = true
            AND valid_from <= CURRENT_TIMESTAMP
            AND valid_until >= CURRENT_TIMESTAMP
            AND current_uses < max_uses
            AND ${planData.tier}::text = ANY(applicable_tiers)
          `;

          if (couponResult.length > 0) {
            const coupon = couponResult[0];
            const { finalAmount: discountedAmount } = applyCouponDiscount(
              finalAmount,
              coupon.discount_pct
            );
            finalAmount = discountedAmount;
            couponId = coupon.id;

            // Increment coupon usage
            await prisma.$executeRawUnsafe(
              `UPDATE coupons SET current_uses = current_uses + 1 WHERE id = $1`,
              coupon.id
            );
          }
        }

        // Create Razorpay subscription
        const razorpaySubscription = await createSubscription({
          planId: planData.razorpay_plan_id,
          customerId: `cust_${userId}`, // In production, use actual Razorpay customer ID
          totalCount: planData.billing_cycle === 'MONTHLY' ? 120 : 10, // 10 years worth
          customerNotify: 1,
          notes: {
            userId,
            tier: planData.tier,
            couponCode: couponCode || '',
          },
        });

        // Calculate period dates
        const currentPeriodStart = new Date(razorpaySubscription.current_start * 1000);
        const currentPeriodEnd = new Date(razorpaySubscription.current_end * 1000);

        // Store subscription in database
        const subscription = await prisma.$queryRaw<any[]>`
          INSERT INTO subscriptions (
            user_id,
            razorpay_subscription_id,
            plan_id,
            status,
            current_period_start,
            current_period_end,
            coupon_id
          ) VALUES (
            ${userId}::uuid,
            ${razorpaySubscription.id},
            ${planId}::uuid,
            'ACTIVE',
            ${currentPeriodStart},
            ${currentPeriodEnd},
            ${couponId}::uuid
          )
          RETURNING *
        `;

        // Update user tier
        await prisma.$executeRawUnsafe(
          `UPDATE users SET tier = $1 WHERE id = $2`,
          planData.tier,
          userId
        );

        return reply.send({
          success: true,
          subscription: subscription[0],
          razorpaySubscriptionId: razorpaySubscription.id,
          amount: finalAmount,
          mockMode: MOCK_MODE,
        });
      } catch (error: any) {
        console.error('Error creating subscription:', error);
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  /**
   * GET /billing/status
   * Get current subscription status
   */
  fastify.get(
    '/billing/status',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user!.id;

      try {
        const subscription = await prisma.$queryRaw<any[]>`
          SELECT
            s.*,
            sp.name as plan_name,
            sp.tier,
            sp.billing_cycle,
            sp.regular_price,
            sp.launch_price,
            sp.is_launch_active,
            c.code as coupon_code,
            c.discount_pct as coupon_discount
          FROM subscriptions s
          JOIN subscription_plans sp ON s.plan_id = sp.id
          LEFT JOIN coupons c ON s.coupon_id = c.id
          WHERE s.user_id = ${userId}::uuid
          ORDER BY s.created_at DESC
          LIMIT 1
        `;

        if (subscription.length === 0) {
          return reply.send({
            hasSubscription: false,
            subscription: null,
          });
        }

        return reply.send({
          hasSubscription: true,
          subscription: subscription[0],
        });
      } catch (error: any) {
        console.error('Error fetching subscription status:', error);
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  /**
   * POST /billing/cancel
   * Cancel subscription
   */
  fastify.post(
    '/billing/cancel',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { cancelAtPeriodEnd } = request.body as {
        cancelAtPeriodEnd: boolean;
      };

      const userId = request.user!.id;

      try {
        // Fetch active subscription
        const subscription = await prisma.$queryRaw<any[]>`
          SELECT * FROM subscriptions
          WHERE user_id = ${userId}::uuid
          AND status = 'ACTIVE'
          LIMIT 1
        `;

        if (subscription.length === 0) {
          return reply.code(404).send({ error: 'No active subscription found' });
        }

        const subData = subscription[0];

        // Cancel in Razorpay
        await cancelSubscription(subData.razorpay_subscription_id, cancelAtPeriodEnd);

        if (cancelAtPeriodEnd) {
          // Mark for cancellation at period end
          await prisma.$executeRawUnsafe(
            `UPDATE subscriptions SET cancel_at_period_end = true WHERE id = $1`,
            subData.id
          );
        } else {
          // Cancel immediately
          await prisma.$executeRawUnsafe(
            `UPDATE subscriptions SET status = 'CANCELLED' WHERE id = $1`,
            subData.id
          );

          // Downgrade user to FREE
          await prisma.$executeRawUnsafe(
            `UPDATE users SET tier = 'FREE' WHERE id = $1`,
            userId
          );
        }

        return reply.send({
          success: true,
          cancelAtPeriodEnd,
        });
      } catch (error: any) {
        console.error('Error cancelling subscription:', error);
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  /**
   * POST /billing/validate-coupon
   * Validate a coupon code
   */
  fastify.post(
    '/billing/validate-coupon',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { couponCode, planId } = request.body as {
        couponCode: string;
        planId: string;
      };

      try {
        // Fetch plan
        const plan = await prisma.$queryRaw<any[]>`
          SELECT * FROM subscription_plans WHERE id = ${planId}::uuid
        `;

        if (plan.length === 0) {
          return reply.code(404).send({ error: 'Plan not found' });
        }

        const planData = plan[0];

        // Fetch coupon
        const coupon = await prisma.$queryRaw<any[]>`
          SELECT * FROM coupons
          WHERE code = ${couponCode}
          AND is_active = true
          AND valid_from <= CURRENT_TIMESTAMP
          AND valid_until >= CURRENT_TIMESTAMP
          AND current_uses < max_uses
          AND ${planData.tier}::text = ANY(applicable_tiers)
        `;

        if (coupon.length === 0) {
          return reply.code(400).send({
            valid: false,
            error: 'Invalid or expired coupon',
          });
        }

        const couponData = coupon[0];
        const basePrice = planData.is_launch_active
          ? planData.launch_price
          : planData.regular_price;

        const { discountAmount, finalAmount } = applyCouponDiscount(
          basePrice,
          couponData.discount_pct
        );

        return reply.send({
          valid: true,
          coupon: {
            code: couponData.code,
            discountPct: couponData.discount_pct,
            discountAmount,
            finalAmount,
          },
        });
      } catch (error: any) {
        console.error('Error validating coupon:', error);
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  /**
   * POST /billing/webhook
   * Handle Razorpay webhooks
   */
  fastify.post('/billing/webhook', async (request, reply) => {
    const signature = request.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(request.body);
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    try {
      // Verify signature
      if (!verifyWebhookSignature(body, signature, secret)) {
        return reply.code(400).send({ error: 'Invalid signature' });
      }

      const event = request.body as any;

      // Store webhook event
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO webhook_events (event_type, razorpay_event_id, payload)
        VALUES ($1, $2, $3)
        ON CONFLICT (razorpay_event_id) DO NOTHING
        `,
        event.event,
        event.payload?.payment?.entity?.id || event.payload?.subscription?.entity?.id || `evt_${Date.now()}`,
        JSON.stringify(event)
      );

      // Handle different event types
      switch (event.event) {
        case 'subscription.activated':
          await handleSubscriptionActivated(event.payload.subscription.entity);
          break;

        case 'subscription.charged':
          await handleSubscriptionCharged(event.payload.payment.entity);
          break;

        case 'subscription.cancelled':
          await handleSubscriptionCancelled(event.payload.subscription.entity);
          break;

        case 'subscription.halted':
          await handleSubscriptionHalted(event.payload.subscription.entity);
          break;

        case 'payment.failed':
          await handlePaymentFailed(event.payload.payment.entity);
          break;

        default:
          console.log(`Unhandled event type: ${event.event}`);
      }

      // Mark as processed
      await prisma.$executeRawUnsafe(
        `
        UPDATE webhook_events
        SET processed = true, processed_at = CURRENT_TIMESTAMP
        WHERE razorpay_event_id = $1
        `,
        event.payload?.payment?.entity?.id || event.payload?.subscription?.entity?.id
      );

      return reply.send({ status: 'success' });
    } catch (error: any) {
      console.error('Webhook processing error:', error);

      // Log error to webhook_events
      await prisma.$executeRawUnsafe(
        `
        UPDATE webhook_events
        SET error_message = $1
        WHERE razorpay_event_id = $2
        `,
        error.message,
        (request.body as any).payload?.payment?.entity?.id || (request.body as any).payload?.subscription?.entity?.id
      );

      return reply.code(500).send({ error: error.message });
    }
  });
}

/**
 * Webhook event handlers
 */

async function handleSubscriptionActivated(subscription: any) {
  await prisma.$executeRawUnsafe(
    `
    UPDATE subscriptions
    SET status = 'ACTIVE',
        current_period_start = $1,
        current_period_end = $2
    WHERE razorpay_subscription_id = $3
    `,
    new Date(subscription.current_start * 1000),
    new Date(subscription.current_end * 1000),
    subscription.id
  );
}

async function handleSubscriptionCharged(payment: any) {
  // Fetch subscription
  const subscription = await prisma.$queryRaw<any[]>`
    SELECT s.*, sp.tier
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.razorpay_subscription_id = ${payment.subscription_id}
  `;

  if (subscription.length === 0) return;

  const subData = subscription[0];

  // Calculate GST
  const { taxableAmount, gstAmount } = calculateGST(payment.amount);

  // Create payment record
  await prisma.$executeRawUnsafe(
    `
    INSERT INTO payments (
      user_id,
      subscription_id,
      razorpay_payment_id,
      amount,
      currency,
      status,
      payment_method,
      taxable_amount,
      gst_amount,
      invoice_number,
      paid_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
    subData.user_id,
    subData.id,
    payment.id,
    payment.amount,
    payment.currency,
    'SUCCESS',
    payment.method,
    taxableAmount,
    gstAmount,
    generateInvoiceNumber(payment.id),
    new Date(payment.created_at * 1000)
  );

  // Ensure user has correct tier
  await prisma.$executeRawUnsafe(
    `UPDATE users SET tier = $1 WHERE id = $2`,
    subData.tier,
    subData.user_id
  );
}

async function handleSubscriptionCancelled(subscription: any) {
  await prisma.$executeRawUnsafe(
    `
    UPDATE subscriptions
    SET status = 'CANCELLED'
    WHERE razorpay_subscription_id = $1
    `,
    subscription.id
  );

  // Downgrade user to FREE
  const sub = await prisma.$queryRaw<any[]>`
    SELECT user_id FROM subscriptions
    WHERE razorpay_subscription_id = ${subscription.id}
  `;

  if (sub.length > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE users SET tier = 'FREE' WHERE id = $1`,
      sub[0].user_id
    );
  }
}

async function handleSubscriptionHalted(subscription: any) {
  await prisma.$executeRawUnsafe(
    `
    UPDATE subscriptions
    SET status = 'HALTED'
    WHERE razorpay_subscription_id = $1
    `,
    subscription.id
  );
}

async function handlePaymentFailed(payment: any) {
  // Log failed payment
  const subscription = await prisma.$queryRaw<any[]>`
    SELECT * FROM subscriptions
    WHERE razorpay_subscription_id = ${payment.subscription_id}
  `;

  if (subscription.length === 0) return;

  const subData = subscription[0];

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO payments (
      user_id,
      subscription_id,
      razorpay_payment_id,
      amount,
      currency,
      status,
      paid_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    subData.user_id,
    subData.id,
    payment.id,
    payment.amount,
    payment.currency,
    'FAILED',
    new Date()
  );
}
