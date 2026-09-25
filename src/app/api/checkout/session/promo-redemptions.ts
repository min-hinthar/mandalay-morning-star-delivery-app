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
 * Total redemptions of a max_redemptions-limited Stripe code, including the
 * ones Stripe's own `times_redeemed` can't see:
 *  - percent codes charge through a one-off coupon, so Stripe never counts
 *    them: every non-cancelled order with the code since the cutover counts
 *    (on top of the pre-cutover Stripe tally);
 *  - amount_off codes are counted by Stripe only when a session completes
 *    WITH the promotion code. COD orders never reach Stripe (without counting
 *    them a max_redemptions:1 code — every KYAYZU- loyalty code — was
 *    reusable indefinitely via cash on delivery), and a card order paid via
 *    retry-payment is charged through a one-off coupon Stripe doesn't tie to
 *    the code. So card redemptions are max(Stripe tally, paid card orders).
 * Both also count OTHER customers' still-open card checkouts: Stripe counts
 * at completion, so N concurrent sessions could otherwise all complete. This
 * customer's own open checkouts are excluded here and reclaimed last instead
 * (`reclaimOwnCheckoutsWithCode`), so an abandon-and-retry isn't locked out.
 */
export async function countRedemptions(
  serviceClient: SupabaseClient<Database>,
  promoCode: string,
  userId: string,
  isPercent: boolean,
  stripeTimesRedeemed: number
): Promise<{ count: number } | { error: true }> {
  const since = new Date(Date.now() - LIVE_PENDING_WINDOW_MS).toISOString();
  const othersLivePending = `and(status.eq.pending,user_id.neq.${userId},created_at.gt."${since}")`;
  const base = () =>
    serviceClient
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("promo_code", promoCode)
      .neq("status", "cancelled");
  if (isPercent) {
    const { count, error } = await base()
      .gte("created_at", PERCENT_CONVERSION_CUTOVER_ISO)
      .or(`status.neq.pending,${othersLivePending}`);
    if (error) return failed(error, promoCode);
    return { count: stripeTimesRedeemed + (count ?? 0) };
  }
  const [paidCard, codOrLive] = await Promise.all([
    base().eq("payment_method", "stripe").neq("status", "pending"),
    base().or(`payment_method.eq.cod,${othersLivePending}`),
  ]);
  if (paidCard.error) return failed(paidCard.error, promoCode);
  if (codOrLive.error) return failed(codOrLive.error, promoCode);
  return {
    count: Math.max(stripeTimesRedeemed, paidCard.count ?? 0) + (codOrLive.count ?? 0),
  };
}

function failed(error: unknown, promoCode: string): { error: true } {
  logger.exception(error, { api: "checkout-session", promoCode });
  return { error: true };
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
