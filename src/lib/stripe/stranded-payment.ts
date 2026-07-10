/**
 * Stranded-payment detection.
 *
 * A "stranded payment" is money Stripe has captured for an order whose DB row
 * does NOT reflect a live, paid order:
 *   - `paid_but_pending`   — charged, but the order never left `pending`
 *     (a dropped `checkout.session.completed` webhook, or the customer never
 *     returned to the confirmation page). The order is not being processed.
 *   - `paid_but_cancelled` — charged, but the order is `cancelled` and no
 *     refund covers the charge (a cancel of a paid order, or a
 *     cancel/expiry-vs-payment race). The customer is out the money.
 *
 * Both are otherwise SILENT: every confirm path guards on `status = 'pending'`,
 * so a paid+cancelled order is never re-inspected and no alert is raised. This
 * module gives the confirm handlers and the reconciliation cron a shared,
 * testable way to spot the condition.
 */

import type Stripe from "stripe";

export type StrandedKind = "paid_but_pending" | "paid_but_cancelled";

export interface PaymentInspection {
  /** Stripe reports the payment as captured/succeeded. */
  paid: boolean;
  /** Amount captured, in cents (0 when unknown). */
  amountCents: number;
  /** Amount refunded so far, in cents. */
  amountRefundedCents: number;
  /** Resolved PaymentIntent id, if any. */
  paymentIntentId: string | null;
  /** The Checkout Session id inspected, if any. */
  sessionId: string | null;
}

/**
 * When the PaymentIntent was null at confirm time, the confirm handlers store
 * `session_<checkout_session_id>` as a placeholder in `stripe_payment_intent_id`.
 * That is NOT a real PaymentIntent id, so treat it as absent.
 */
export function isPlaceholderPaymentIntentId(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith("session_");
}

/**
 * Pure classifier: given an order's status and a Stripe payment inspection,
 * decide whether the order represents a stranded payment. Fully refunded money
 * is not stranded. Returns null for healthy orders.
 */
export function classifyStrandedPayment(
  orderStatus: string,
  inspection: Pick<PaymentInspection, "paid" | "amountCents" | "amountRefundedCents">
): StrandedKind | null {
  if (!inspection.paid) return null;
  // Net money still with us after any refunds. Fully refunded ⇒ not stranded.
  const netChargedCents = inspection.amountCents - inspection.amountRefundedCents;
  if (netChargedCents <= 0) return null;
  if (orderStatus === "pending") return "paid_but_pending";
  if (orderStatus === "cancelled") return "paid_but_cancelled";
  return null;
}

/** Extract a PaymentIntent id from a Stripe union field (string | object | null). */
export function resolvePaymentIntentId(
  paymentIntent: string | Stripe.PaymentIntent | null | undefined
): string | null {
  if (typeof paymentIntent === "string") return paymentIntent;
  if (paymentIntent && typeof paymentIntent === "object") return paymentIntent.id;
  return null;
}

/** Read captured + refunded amounts off a PaymentIntent's expanded latest_charge. */
export function amountsFromPaymentIntent(pi: Stripe.PaymentIntent): {
  amountCents: number;
  amountRefundedCents: number;
} {
  const charge = pi.latest_charge;
  if (charge && typeof charge !== "string") {
    return {
      amountCents: charge.amount ?? pi.amount ?? 0,
      amountRefundedCents: charge.amount_refunded ?? 0,
    };
  }
  return { amountCents: pi.amount ?? 0, amountRefundedCents: 0 };
}

/**
 * Inspect Stripe for the real payment state behind an order. Prefers a concrete
 * PaymentIntent id (most authoritative); falls back to the Checkout Session.
 * Returns `paid: false` (never throws for a missing reference) when there is
 * nothing to inspect, so callers can treat "no Stripe handle" as "not paid".
 */
export async function inspectOrderPayment(
  stripe: Stripe,
  refs: { paymentIntentId?: string | null; sessionId?: string | null }
): Promise<PaymentInspection> {
  const realPaymentIntentId = isPlaceholderPaymentIntentId(refs.paymentIntentId)
    ? null
    : (refs.paymentIntentId ?? null);

  if (realPaymentIntentId) {
    const pi = await stripe.paymentIntents.retrieve(realPaymentIntentId, {
      expand: ["latest_charge"],
    });
    const { amountCents, amountRefundedCents } = amountsFromPaymentIntent(pi);
    return {
      paid: pi.status === "succeeded",
      amountCents,
      amountRefundedCents,
      paymentIntentId: pi.id,
      sessionId: refs.sessionId ?? null,
    };
  }

  if (refs.sessionId) {
    const session = await stripe.checkout.sessions.retrieve(refs.sessionId, {
      expand: ["payment_intent.latest_charge"],
    });
    const pi = session.payment_intent;
    const piId = resolvePaymentIntentId(pi);
    let amountCents = session.amount_total ?? 0;
    let amountRefundedCents = 0;
    if (pi && typeof pi !== "string") {
      const amounts = amountsFromPaymentIntent(pi);
      amountCents = amounts.amountCents || amountCents;
      amountRefundedCents = amounts.amountRefundedCents;
    }
    return {
      paid: session.payment_status === "paid",
      amountCents,
      amountRefundedCents,
      paymentIntentId: piId,
      sessionId: session.id,
    };
  }

  return {
    paid: false,
    amountCents: 0,
    amountRefundedCents: 0,
    paymentIntentId: realPaymentIntentId,
    sessionId: refs.sessionId ?? null,
  };
}
