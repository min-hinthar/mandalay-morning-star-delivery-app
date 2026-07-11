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
 * (cumulative target, already-refunded) pair, so re-submitting the same state
 * never double-refunds, and an interleaved external refund changes the key
 * instead of locking retries out for 24h.
 *
 * POLICY: `charge.amount_refunded` counts ALL refunds, including ones issued
 * directly from the Stripe dashboard. The invariant maintained here is
 * "total returned to the customer >= cumulative audited item refunds" — an
 * external goodwill refund therefore absorbs a later item refund instead of
 * stacking on top of it.
 */
export async function issueStripeRefundDelta(opts: {
  stripe: Stripe;
  serviceClient: SupabaseClient<Database>;
  orderId: string;
  paymentIntentId: string;
  /**
   * Written to the Stripe refund's `metadata.source`. The `charge.refunded`
   * webhook skips its generic customer email for `admin-item-refund` and
   * `cancellation` (those flows send their own itemized/cancellation email);
   * any other source (e.g. `auto-reconcile`) lets the webhook email the
   * customer. Defaults to `admin-item-refund` (backwards compatible).
   */
  refundSource?: string;
}): Promise<StripeRefundOutcome> {
  const {
    stripe,
    serviceClient,
    orderId,
    paymentIntentId,
    refundSource = "admin-item-refund",
  } = opts;

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
      metadata: { order_id: orderId, source: refundSource },
    },
    // Keyed on the (target, already-refunded) state: a retry of the same
    // state dedupes; a changed state gets a fresh key.
    {
      idempotencyKey: `admin-refund-${orderId}-${cumulativeAuditedCents}-${alreadyRefundedCents}`,
    }
  );

  logger.info("Stripe refund issued for admin item refund", {
    orderId,
    refundId: refund.id,
    refundedNowCents: deltaCents,
    api: "admin/orders/[id]/refund",
  });

  // Concurrent refunds on the same order can both read a stale
  // amount_refunded and overshoot the audited target (rare: refunds are an
  // admin action). Detect and alert rather than serialize.
  try {
    const after = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const afterCharge = after.latest_charge;
    if (
      afterCharge &&
      typeof afterCharge !== "string" &&
      afterCharge.amount_refunded > Math.min(cumulativeAuditedCents, afterCharge.amount)
    ) {
      logger.error("Stripe refunded MORE than the audited total — reconcile manually", {
        orderId,
        amountRefunded: afterCharge.amount_refunded,
        cumulativeAuditedCents,
        api: "admin/orders/[id]/refund",
      });
    }
  } catch {
    // Verification is best-effort; the refund itself succeeded.
  }

  return {
    attempted: true,
    succeeded: true,
    refundedNowCents: deltaCents,
    alreadyRefundedCents,
    message: `Refunded $${(deltaCents / 100).toFixed(2)} to the original payment method.`,
  };
}
