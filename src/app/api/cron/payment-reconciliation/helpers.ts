/**
 * Pure candidate-filtering helpers for the payment-reconciliation cron.
 * Extracted so the time-window / Stripe-handle logic is unit-testable without
 * mocking Stripe, Supabase, and the email stack.
 */

import { isPlaceholderPaymentIntentId } from "@/lib/stripe/stranded-payment";

/** Only scan orders touched within this window (bounds work + re-alert volume). */
export const LOOKBACK_MS = 6 * 60 * 60 * 1000; // 6h
/** Skip `pending` orders younger than this — the webhook + confirmation-page
 *  self-heal have not had their chance yet, so they are not "stranded" yet. */
export const PENDING_GRACE_MS = 30 * 60 * 1000; // 30m
/** Only email admins for orders that became stranded recently, so a persistent
 *  case is not re-emailed on every hourly run (Sentry holds the durable issue). */
export const EMAIL_RECENCY_MS = 100 * 60 * 1000; // 100m
export const MAX_PER_RUN = 50;

export interface ReconcileCandidate {
  status: string;
  placed_at: string;
  updated_at: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
}

/** Does the order have a real Stripe handle to inspect (a real PI, or a
 *  Checkout Session)? The `session_<id>` placeholder is not a real PI. */
export function hasStripeHandle(
  order: Pick<ReconcileCandidate, "stripe_checkout_session_id" | "stripe_payment_intent_id">
): boolean {
  const hasRealPi =
    !!order.stripe_payment_intent_id &&
    !isPlaceholderPaymentIntentId(order.stripe_payment_intent_id);
  return hasRealPi || !!order.stripe_checkout_session_id;
}

/** True when a `pending` order is still inside its grace window — too young to
 *  treat as stranded (the normal confirm paths may still land). */
export function isPendingWithinGrace(
  order: Pick<ReconcileCandidate, "status" | "placed_at">,
  nowMs: number
): boolean {
  return order.status === "pending" && Date.parse(order.placed_at) > nowMs - PENDING_GRACE_MS;
}

/** Whether to (re-)email admins now: only while the stranding is fresh, so a
 *  persistent unresolved order is not re-emailed on every run. */
export function isWithinEmailRecency(
  order: Pick<ReconcileCandidate, "updated_at">,
  nowMs: number
): boolean {
  return Date.parse(order.updated_at) >= nowMs - EMAIL_RECENCY_MS;
}
