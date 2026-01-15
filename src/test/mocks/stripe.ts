/**
 * Mock utilities for Stripe API
 * Used in webhook tests and checkout session tests
 */

import type Stripe from "stripe";

/**
 * Mock Stripe checkout session create response
 */
export const mockCheckoutSessionResponse = {
  id: "cs_test_123456",
  url: "https://checkout.stripe.com/pay/cs_test_123456",
  payment_intent: "pi_test_123456",
  customer: "cus_test_123456",
};

/**
 * Create mock Stripe client
 */
export function createMockStripeClient() {
  return {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue(mockCheckoutSessionResponse),
      },
    },
    customers: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn().mockResolvedValue({ id: "cus_test_123456" }),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  };
}

/**
 * Mock Stripe event for checkout.session.completed
 */
export function createCheckoutCompletedEvent(
  orderId: string,
  userId: string,
  paymentIntentId = "pi_test_123456"
): Stripe.Event {
  return {
    id: "evt_test_checkout_completed",
    type: "checkout.session.completed",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    object: "event",
    data: {
      object: {
        id: "cs_test_123456",
        object: "checkout.session",
        payment_intent: paymentIntentId,
        payment_status: "paid",
        status: "complete",
        metadata: {
          order_id: orderId,
          user_id: userId,
        },
      } as unknown as Stripe.Checkout.Session,
    },
  };
}

/**
 * Mock Stripe event for checkout.session.expired
 */
export function createCheckoutExpiredEvent(
  orderId: string,
  userId: string
): Stripe.Event {
  return {
    id: "evt_test_checkout_expired",
    type: "checkout.session.expired",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    object: "event",
    data: {
      object: {
        id: "cs_test_expired",
        object: "checkout.session",
        payment_intent: null,
        payment_status: "unpaid",
        status: "expired",
        metadata: {
          order_id: orderId,
          user_id: userId,
        },
      } as unknown as Stripe.Checkout.Session,
    },
  };
}

/**
 * Mock Stripe event for charge.refunded (full refund)
 */
export function createChargeRefundedEvent(
  paymentIntentId: string,
  amountCents: number,
  fullRefund = true
): Stripe.Event {
  return {
    id: "evt_test_charge_refunded",
    type: "charge.refunded",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    object: "event",
    data: {
      object: {
        id: "ch_test_123456",
        object: "charge",
        payment_intent: paymentIntentId,
        amount: amountCents,
        amount_refunded: fullRefund ? amountCents : Math.floor(amountCents / 2),
        refunded: fullRefund,
      } as unknown as Stripe.Charge,
    },
  };
}

/**
 * Mock Stripe event for payment_intent.payment_failed
 */
export function createPaymentFailedEvent(
  orderId?: string
): Stripe.Event {
  return {
    id: "evt_test_payment_failed",
    type: "payment_intent.payment_failed",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    object: "event",
    data: {
      object: {
        id: "pi_test_failed",
        object: "payment_intent",
        status: "requires_payment_method",
        last_payment_error: {
          message: "Your card was declined.",
          code: "card_declined",
        },
        metadata: orderId ? { order_id: orderId } : {},
      } as unknown as Stripe.PaymentIntent,
    },
  };
}
