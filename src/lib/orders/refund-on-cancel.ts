/**
 * Refund a paid order in full as part of a cancellation (or a system
 * reconciliation of a stranded cancelled order).
 *
 * Reuses the item-refund machinery so a cancellation refund stays consistent
 * with admin item-refunds:
 *   - writes one `action='refund'` audit row for the order total (the durable
 *     record `issueStripeRefundDelta` reconciles the Stripe side against), then
 *   - drives `issueStripeRefundDelta`, which is idempotent (keyed on the
 *     cumulative-audited / already-refunded pair) — re-running moves only the
 *     shortfall, never double-refunds.
 *
 * COD / unpaid / already-fully-refunded orders return `{ refunded: false }`
 * (no card rail / nothing to move). Resolves the real PaymentIntent behind a
 * `session_<id>` placeholder via `inspectOrderPayment`.
 */

import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";
import { logger } from "@/lib/utils/logger";
import { inspectOrderPayment } from "@/lib/stripe/stranded-payment";
import {
  issueStripeRefundDelta,
  sumAuditedRefundCents,
  type StripeRefundOutcome,
} from "@/app/api/admin/orders/[id]/refund/stripe-refund";

/**
 * Customer-facing refund state for cancellation copy:
 *   - `refunded` — money is fully back on the card (this call moved it, or a
 *     prior refund already covered the full captured amount).
 *   - `pending`  — the card WAS charged but the refund didn't fully land this
 *     call; the reconciliation cron completes it (≤24h). Copy must reassure
 *     ("your refund is being processed"), never say "no refund".
 *   - `none`     — no card charge to refund (COD, or the order was never
 *     captured). "No refund has been issued" is correct here.
 */
export type CancelRefundStatus = "refunded" | "pending" | "none";

export interface CancelRefundResult {
  /** True when this call moved money on the card (or a prior attempt already did the full amount). */
  refunded: boolean;
  /** Money moved by THIS call, cents. */
  refundedCents: number;
  /**
   * Cumulative amount returned to the customer for this charge (prior refunds +
   * this call). Use THIS for customer-facing copy — `refundedCents` is only the
   * delta this call moved, which understates the total when a prior partial
   * refund exists.
   */
  totalRefundedCents: number;
  /**
   * Discriminant for customer-facing copy. Distinguishes "money is back"
   * (`refunded`) from "charged but refund still settling" (`pending`) from
   * "nothing to refund" (`none`) — so a transient failure on a PAID order never
   * emails "no refund has been issued".
   */
  status: CancelRefundStatus;
  message: string;
  outcome?: StripeRefundOutcome;
}

export interface OrderRefundHandles {
  payment_method: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
}

export async function refundPaidOrderInFull(opts: {
  serviceClient: SupabaseClient<Database>;
  stripe: Stripe;
  orderId: string;
  order: OrderRefundHandles;
  /** Audit actor. For a system refund (cron/webhook) pass the order's user_id. */
  actorId: string;
  actorRole: "customer" | "admin" | "system";
  reason: string;
  /** Stripe refund metadata source — controls webhook email dedup (see charge-refunded). */
  refundSource: "cancellation" | "auto-reconcile";
}): Promise<CancelRefundResult> {
  const { serviceClient, stripe, orderId, order, actorId, actorRole, reason, refundSource } = opts;

  // COD has no card rail; the cancellation email tells the customer the team
  // will arrange any cash refund.
  if (order.payment_method !== "stripe") {
    return {
      refunded: false,
      refundedCents: 0,
      totalRefundedCents: 0,
      status: "none",
      message: "No card payment to refund (COD).",
    };
  }

  // Resolve real payment + refund state (handles the session_<id> placeholder PI).
  const inspection = await inspectOrderPayment(stripe, {
    paymentIntentId: order.stripe_payment_intent_id,
    sessionId: order.stripe_checkout_session_id,
  });
  if (!inspection.paid || !inspection.paymentIntentId) {
    return {
      refunded: false,
      refundedCents: 0,
      totalRefundedCents: 0,
      status: "none",
      message: "No captured payment to refund.",
    };
  }
  if (inspection.amountCents - inspection.amountRefundedCents <= 0) {
    return {
      refunded: false,
      refundedCents: 0,
      totalRefundedCents: inspection.amountRefundedCents,
      // Money is already fully back — treat as refunded for customer copy.
      status: "refunded",
      message: "Payment already fully refunded.",
    };
  }

  // Bring the audited refund total up to the amount actually CAPTURED on the
  // card (not order.total_cents, which can differ under partial capture /
  // Stripe-side discounts); the idempotent delta refunder then moves exactly
  // the shortfall. Writing only the delta keeps this safe to re-run (e.g.
  // cancel → later reconciliation).
  const capturedCents = inspection.amountCents;
  const alreadyAuditedCents = await sumAuditedRefundCents(serviceClient, orderId);
  const auditDeltaCents = Math.max(0, capturedCents - alreadyAuditedCents);
  if (auditDeltaCents > 0) {
    const { error: auditError } = await serviceClient.from("order_audit_log").insert({
      order_id: orderId,
      action: "refund",
      actor_id: actorId,
      actor_role: actorRole,
      old_value: null as Json,
      new_value: {
        totalRefundCents: auditDeltaCents,
        source: refundSource,
        reason,
      } as unknown as Json,
      reason: `Full refund on cancellation: ${reason}`,
    });
    if (auditError) throw auditError;
  }

  const outcome = await issueStripeRefundDelta({
    stripe,
    serviceClient,
    orderId,
    paymentIntentId: inspection.paymentIntentId,
    refundSource,
  });

  if (!outcome.succeeded) {
    logger.error("Cancellation refund did not succeed", {
      orderId,
      message: outcome.message,
      api: "refund-on-cancel",
      flowId: "refund",
    });
  }

  // Cumulative returned = prior refunds (from the charge) + what this call moved.
  const totalRefundedCents = inspection.amountRefundedCents + outcome.refundedNowCents;

  return {
    refunded: outcome.succeeded && outcome.refundedNowCents > 0,
    refundedCents: outcome.refundedNowCents,
    totalRefundedCents,
    // A card charge exists (inspection.paid). If the delta refunder brought the
    // total up to the captured amount it's fully back; otherwise it's a paid
    // order whose refund is still settling (the safety net completes it) — never
    // "none", which would render "no refund has been issued" for a real charge.
    status: outcome.succeeded && totalRefundedCents >= capturedCents ? "refunded" : "pending",
    message: outcome.message,
    outcome,
  };
}
