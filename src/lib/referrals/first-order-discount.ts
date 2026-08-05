import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, OrderStatus } from "@/types/database";
import { logger } from "@/lib/utils/logger";
import { FIRST_ORDER_MIN_SUBTOTAL_CENTS, REFEREE_DISCOUNT_CENTS, WELCOME_DISCOUNT_CENTS } from ".";
import { reclaimPendingCheckouts } from "./reclaim-pending-checkouts";

/**
 * Order statuses that permanently consume first-order eligibility: the
 * customer has (or is getting) a real order. `pending_approval` is an
 * accepted COD order awaiting admin approval; `cancelled` never counts.
 */
const COMPLETED_ORDER_STATUSES: OrderStatus[] = [
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "pending_approval",
];

export interface FirstOrderDiscount {
  couponId: string;
  discountCents: number;
  /** "referee" ($10, referred) or "welcome" ($5). */
  kind: "referee" | "welcome";
}

/**
 * Pick the auto-applied first-order discount for a customer, or null.
 *
 * Eligible when: subtotal ≥ minimum, the customer has no completed order yet,
 * and the relevant Stripe coupon is configured. Referred customers (a pending
 * referral) get the larger referee discount; everyone else gets the welcome
 * discount. Gated server-side so there's no shareable/abusable code.
 *
 * STACKING (audit D6): an open checkout is a discount that can still be
 * redeemed, so `pending` orders must block too — otherwise several
 * concurrent unpaid checkouts each pass the "no orders yet" gate and each
 * completes with its own discount. But a stale pending (abandoned checkout,
 * up to 30 min before Stripe expires it) would then block the everyday
 * retry, so when pendings are the ONLY blocker they are reclaimed first:
 * their sessions expired at Stripe (irrevocably un-completable), their
 * orders cancelled. Reclaim failing in any way withholds the discount —
 * fail-safe in the no-stacking direction. The residual race (two truly
 * simultaneous session creations both reading zero pendings) is
 * milliseconds wide and requires deliberate parallel submission.
 */
export async function resolveFirstOrderDiscount(
  supabase: SupabaseClient<Database>,
  userId: string,
  subtotalCents: number,
  /** Enables reclaiming stale pending checkouts when they are the only blocker. */
  reclaim?: { stripe: Stripe; serviceClient: SupabaseClient<Database> }
): Promise<FirstOrderDiscount | null> {
  const referralCoupon = process.env.STRIPE_REFERRAL_COUPON_ID;
  const welcomeCoupon = process.env.STRIPE_WELCOME_COUPON_ID;
  if (!referralCoupon && !welcomeCoupon) return null;
  if (subtotalCents < FIRST_ORDER_MIN_SUBTOTAL_CENTS) return null;

  // First completed order only. A failed read withholds the discount — it
  // must never read as "no orders" (that would GRANT on error).
  const { count: completedCount, error: completedError } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", COMPLETED_ORDER_STATUSES);
  if (completedError) {
    logger.exception(completedError, { api: "first-order-discount", userId });
    return null;
  }
  if ((completedCount ?? 0) > 0) return null;

  // Open checkouts block too (they can still complete WITH their discount).
  const { count: pendingCount, error: pendingError } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "pending");
  if (pendingError) {
    logger.exception(pendingError, { api: "first-order-discount", userId });
    return null;
  }
  if ((pendingCount ?? 0) > 0) {
    if (!reclaim) return null;
    const freed = await reclaimPendingCheckouts(reclaim.stripe, reclaim.serviceClient, userId);
    if (!freed) return null;
  }

  // Referred → larger referee discount.
  const { data: referral } = await supabase
    .from("referrals")
    .select("id")
    .eq("referee_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (referral && referralCoupon) {
    return { couponId: referralCoupon, discountCents: REFEREE_DISCOUNT_CENTS, kind: "referee" };
  }
  if (welcomeCoupon) {
    return { couponId: welcomeCoupon, discountCents: WELCOME_DISCOUNT_CENTS, kind: "welcome" };
  }
  return null;
}
