/**
 * Razorpay Service
 *
 * Handles all Razorpay API interactions for subscription management
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

export const MOCK_MODE = process.env.RAZORPAY_MOCK_MODE === 'true';

// Lazy initialization of Razorpay instance
let razorpay: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (MOCK_MODE) {
    // Return a mock Razorpay instance for testing
    return {} as Razorpay;
  }

  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET or enable RAZORPAY_MOCK_MODE=true');
    }

    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  return razorpay;
}

/**
 * Create a Razorpay subscription
 */
export async function createSubscription(params: {
  planId: string;
  customerId: string;
  totalCount: number;
  customerNotify: number;
  notes?: Record<string, string>;
}) {
  if (MOCK_MODE) {
    return {
      id: `sub_mock_${Date.now()}`,
      plan_id: params.planId,
      customer_id: params.customerId,
      status: 'created',
      current_start: Math.floor(Date.now() / 1000),
      current_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    };
  }

  return getRazorpay().subscriptions.create(params);
}

/**
 * Cancel a Razorpay subscription
 */
export async function cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false) {
  if (MOCK_MODE) {
    return {
      id: subscriptionId,
      status: cancelAtCycleEnd ? 'active' : 'cancelled',
    };
  }

  return getRazorpay().subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
}

/**
 * Fetch subscription details
 */
export async function fetchSubscription(subscriptionId: string) {
  if (MOCK_MODE) {
    return {
      id: subscriptionId,
      plan_id: 'plan_mock',
      status: 'active',
      current_start: Math.floor(Date.now() / 1000),
      current_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    };
  }

  return getRazorpay().subscriptions.fetch(subscriptionId);
}

/**
 * Create a Razorpay plan
 */
export async function createPlan(params: {
  period: 'monthly' | 'yearly';
  interval: number;
  item: {
    name: string;
    amount: number;
    currency: string;
    description?: string;
  };
  notes?: Record<string, string>;
}) {
  if (MOCK_MODE) {
    // Generate unique mock ID with random component
    const random = Math.random().toString(36).substring(2, 9);
    return {
      id: `plan_mock_${Date.now()}_${random}`,
      ...params,
    };
  }

  return getRazorpay().plans.create(params);
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (MOCK_MODE) {
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Generate GST invoice data
 */
export function calculateGST(amount: number): {
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
} {
  // GST is 18% inclusive in the amount
  const totalAmount = amount;
  const taxableAmount = Math.round((amount * 100) / 118);
  const gstAmount = totalAmount - taxableAmount;

  return {
    taxableAmount,
    gstAmount,
    totalAmount,
  };
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(paymentId: string): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const shortId = paymentId.slice(-8).toUpperCase();

  return `INV-${year}${month}-${shortId}`;
}

/**
 * Apply coupon discount
 */
export function applyCouponDiscount(
  baseAmount: number,
  discountPct: number
): {
  discountAmount: number;
  finalAmount: number;
} {
  const discountAmount = Math.round((baseAmount * discountPct) / 100);
  const finalAmount = baseAmount - discountAmount;

  return {
    discountAmount,
    finalAmount,
  };
}

export default getRazorpay;
