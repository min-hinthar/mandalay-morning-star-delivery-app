import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/database";

/**
 * Kill a customer's stale unpaid checkouts so a first-order discount can be
 * granted again (audit D6).
 *
 * Why this exists: an open checkout session is a discount that can still be
 * REDEEMED — so the first-order gates must count `pending` orders, or several
 * concurrent checkouts each qualify as "first" and each completes with its
 * own discount. But counting them alone over-blocks the everyday flow of
 * abandoning a checkout and retrying a minute later (the abandoned order
 * stays `pending` until Stripe expires the session at 30 minutes). This
 * reclaims that window: expire the session at Stripe — after which it can
 * NEVER complete — then cancel the order it belonged to.
 *
 * Returns true only when EVERY pending checkout was verifiably neutralized.
 * Any ambiguity aborts with false and the caller withholds the discount —
 * the fail-safe direction (the customer keeps full-price checkout; nothing
 * stacks). Specifically:
 *  - a pending order with no recorded session id cannot be expired (its
 *    session may still complete) → false;
 *  - a non-Stripe pending order is not this function's to cancel → false;
 *  - `sessions.expire` failing on an already-COMPLETED session means the
 *    order is actually paid and the webhook hasn't landed yet → false.
 *
 * The expiry ALSO fires Stripe's `checkout.session.expired` webhook, whose
 * handler cancels the order too — the direct cancel below just doesn't wait
 * for it. Both writes are guarded (`.eq status pending`), so they compose.
 */
export async function reclaimPendingCheckouts(
  stripe: Stripe,
  serviceClient: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  // Only DISCOUNTED pendings are stacking candidates; an undiscounted
  // in-progress checkout is harmless and must not be torn down.
  const { data: pendings, error } = await serviceClient
    .from("orders")
    .select("id, stripe_checkout_session_id, payment_method")
    .eq("user_id", userId)
    .eq("status", "pending")
    .gt("discount_cents", 0);

  if (error) {
    logger.exception(error, { api: "reclaim-pending-checkouts", userId });
    return false;
  }
  if (!pendings || pendings.length === 0) return true;

  for (const order of pendings) {
    // Every abort below is a WITHHELD DISCOUNT downstream — log the reason so
    // a "where's my welcome discount?" report is traceable in Sentry/logs.
    if (order.payment_method !== "stripe" || !order.stripe_checkout_session_id) {
      logger.warn("Reclaim aborted — pending order cannot be safely expired", {
        api: "reclaim-pending-checkouts",
        orderId: order.id,
        reason: order.payment_method !== "stripe" ? "non-stripe-order" : "missing-session-id",
      });
      return false;
    }

    try {
      await stripe.checkout.sessions.expire(order.stripe_checkout_session_id);
    } catch {
      // expire() rejects for sessions that are not `open` — either already
      // expired (fine: it can't complete) or COMPLETED (the order is paid;
      // abort). Look at the session to tell which.
      const session = await stripe.checkout.sessions
        .retrieve(order.stripe_checkout_session_id)
        .catch(() => null);
      if (!session || session.status !== "expired") {
        logger.warn("Reclaim aborted — session not expirable", {
          api: "reclaim-pending-checkouts",
          orderId: order.id,
          reason:
            session?.status === "complete"
              ? "session-completed-order-paid"
              : "session-unretrievable",
        });
        return false;
      }
    }

    const { data: cancelled, error: cancelError } = await serviceClient
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id)
      .eq("status", "pending")
      .select("id");

    if (cancelError) {
      logger.exception(cancelError, { api: "reclaim-pending-checkouts", orderId: order.id });
      return false;
    }
    if (!cancelled || cancelled.length === 0) {
      // Zero rows: something else transitioned it since our read. After a
      // successful expire the only legitimate mover is the expiry webhook's
      // own cancel — verify rather than assume.
      const { data: current } = await serviceClient
        .from("orders")
        .select("status")
        .eq("id", order.id)
        .single();
      if (current?.status !== "cancelled") {
        logger.warn("Reclaim aborted — order moved to an unexpected status mid-reclaim", {
          api: "reclaim-pending-checkouts",
          orderId: order.id,
          reason: `status-${current?.status ?? "unknown"}`,
        });
        return false;
      }
    }
  }

  return true;
}
