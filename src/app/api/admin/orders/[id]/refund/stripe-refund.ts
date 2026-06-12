import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/database";

export interface StripeRefundOutcome {
  /** False when there was no charge to refund against (unpaid order). */
  attempted: boolean;
  succeeded: boolean;
  /** Money moved by THIS call (a previous failed attempt may be recovered). */
  refundedNowCents: number;
  alreadyRefundedCents: number;
  message: string;
}

/**
 * Sum every admin item-refund recorded for the order. The audit log is the
 * durable record of what the DB has marked refunded, so the Stripe target is
 * "cumulative audited refunds" — which makes this function safely
 * re-drivable: if a previous call marked the DB but the Stripe request
 * failed, the next call sees the shortfall and refunds the difference.
 */
export async function sumAuditedRefundCents(
  serviceClient: SupabaseClient<Database>,
  orderId: string
): Promise<number> {
  const { data, error } = await serviceClient
    .from("order_audit_log")
    .select("new_value")
    .eq("order_id", orderId)
    .eq("action", "refund");
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => {
    const value = row.new_value as { totalRefundCents?: unknown } | null;
    const cents = typeof value?.totalRefundCents === "number" ? value.totalRefundCents : 0;
    return sum + cents;
  }, 0);
}

/** Pure delta math, capped at the charge amount (testable in isolation). */
export function computeRefundDeltaCents(
  cumulativeAuditedCents: number,
  chargeAmountCents: number,
  alreadyRefundedCents: number
): number {
  return Math.max(0, Math.min(cumulativeAuditedCents, chargeAmountCents) - alreadyRefundedCents);
}

/**
 * Bring the Stripe-side refunded amount up to the cumulative audited refund
 * total for the order. Idempotent: the idempotency key is derived from the
 * cumulative target, so re-submitting the same state never double-refunds.
 */
export async function issueStripeRefundDelta(opts: {
  stripe: Stripe;
  serviceClient: SupabaseClient<Database>;
  orderId: string;
  paymentIntentId: string;
}): Promise<StripeRefundOutcome> {
  const { stripe, serviceClient, orderId, paymentIntentId } = opts;

  const cumulativeAuditedCents = await sumAuditedRefundCents(serviceClient, orderId);

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });
  const charge = paymentIntent.latest_charge;
  if (!charge || typeof charge === "string") {
    return {
      attempted: false,
      succeeded: false,
      refundedNowCents: 0,
      alreadyRefundedCents: 0,
      message: "No charge found on the payment intent — refund in the Stripe dashboard.",
    };
  }

  const alreadyRefundedCents = charge.amount_refunded ?? 0;
  const deltaCents = computeRefundDeltaCents(
    cumulativeAuditedCents,
    charge.amount,
    alreadyRefundedCents
  );

  if (deltaCents <= 0) {
    return {
      attempted: true,
      succeeded: true,
      refundedNowCents: 0,
      alreadyRefundedCents,
      message: "Card already refunded for the audited amount — no additional charge moved.",
    };
  }

  const refund = await stripe.refunds.create(
    {
      payment_intent: paymentIntentId,
      amount: deltaCents,
      metadata: { order_id: orderId, source: "admin-item-refund" },
    },
    // Keyed on the cumulative target: a retry of the same state is a no-op.
    { idempotencyKey: `admin-refund-${orderId}-${cumulativeAuditedCents}` }
  );

  logger.info("Stripe refund issued for admin item refund", {
    orderId,
    refundId: refund.id,
    refundedNowCents: deltaCents,
    api: "admin/orders/[id]/refund",
  });

  return {
    attempted: true,
    succeeded: true,
    refundedNowCents: deltaCents,
    alreadyRefundedCents,
    message: `Refunded $${(deltaCents / 100).toFixed(2)} to the original payment method.`,
  };
}
