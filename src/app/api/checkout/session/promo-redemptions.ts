import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { reclaimPendingCheckouts } from "@/lib/referrals/reclaim-pending-checkouts";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/database";

/**
 * When percent codes started converting to one-off coupons. Before this
 * moment percent redemptions went through Stripe's promotion-code machinery
 * and live in `times_redeemed`; after it they only exist as order rows. The
 * app-side count is scoped to >= this timestamp so the tallies never overlap.
 */
export const PERCENT_CONVERSION_CUTOVER_ISO = "2026-06-13T00:00:00Z";

/** Unpaid card checkouts older than this can no longer complete (30-min sessions, retries included). */
const LIVE_PENDING_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Redemptions of a max_redemptions-limited Stripe code that Stripe's own
 * `times_redeemed` can't see:
 *  - percent codes charge through a one-off coupon, so Stripe never counts
 *    them: every non-cancelled order with the code since the cutover counts;
 *  - amount_off codes are counted by Stripe only at CARD completion, so COD
 *    orders (never reach Stripe) are added — without this a
 *    max_redemptions:1 code (every KYAYZU- loyalty code) was reusable
 *    indefinitely via cash on delivery.
 * Both also count OTHER customers' still-open card checkouts: Stripe counts
 * at completion, so N concurrent sessions could otherwise all complete. This
 * customer's own open checkouts are excluded here and reclaimed last instead
 * (`reclaimOwnCheckoutsWithCode`), so an abandon-and-retry isn't locked out.
 */
export async function countAppRedemptions(
  serviceClient: SupabaseClient<Database>,
  promoCode: string,
  userId: string,
  isPercent: boolean
): Promise<{ count: number } | { error: true }> {
  const since = new Date(Date.now() - LIVE_PENDING_WINDOW_MS).toISOString();
  const othersLivePending = `and(status.eq.pending,user_id.neq.${userId},created_at.gt."${since}")`;
  const base = serviceClient
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("promo_code", promoCode)
    .neq("status", "cancelled");
  const { count, error } = isPercent
    ? await base
        .gte("created_at", PERCENT_CONVERSION_CUTOVER_ISO)
        .or(`status.neq.pending,${othersLivePending}`)
    : await base.or(`payment_method.eq.cod,${othersLivePending}`);
  if (error) {
    logger.exception(error, { api: "checkout-session", promoCode });
    return { error: true };
  }
  return { count: count ?? 0 };
}

/**
 * The customer's own open card checkouts with this limited code can still
 * complete WITH it, so they'd stack with the new order. Expire + cancel them
 * (the destructive step — callers run it after every rejecting gate). False =
 * one couldn't be neutralized (or the read failed); the caller withholds the code.
 */
export async function reclaimOwnCheckoutsWithCode(
  stripe: Stripe,
  serviceClient: SupabaseClient<Database>,
  userId: string,
  promoCode: string
): Promise<boolean> {
  const { data, error } = await serviceClient
    .from("orders")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "pending")
    .eq("promo_code", promoCode);
  if (error) {
    logger.exception(error, { api: "checkout-session", promoCode });
    return false;
  }
  if (!data || data.length === 0) return true;
  return reclaimPendingCheckouts(stripe, serviceClient, userId, {
    orderIds: data.map((o) => o.id),
  });
}
