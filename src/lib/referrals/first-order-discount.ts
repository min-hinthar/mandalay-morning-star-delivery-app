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
 * redeemed, so DISCOUNTED `pending` orders must block too — otherwise
 * several concurrent unpaid checkouts each pass the "no orders yet" gate and
 * each completes with its own discount. (An undiscounted pending can't
 * stack, so it neither blocks nor gets torn down.) But a stale pending
 * (abandoned checkout, up to 30 min before Stripe expires it) would then
 * block the everyday retry, so when discounted pendings are the ONLY
 * blocker they are reclaimed first: their sessions expired at Stripe
 * (irrevocably un-completable), their orders cancelled. Reclaim failing in
 * any way withholds the discount — fail-safe in the no-stacking direction.
 *
 * Residual race, sized honestly: this pending-count read happens during
 * discount resolution, but the CURRENT checkout's own pending row isn't
 * inserted until create_order_with_items much later in the route — after
 * profile/customer ensure and the Stripe session round-trips. Two genuinely
 * parallel submissions can therefore both read zero pendings and both be
 * granted. It still takes deliberate double-submission, and the durable
 * close is a DB-level guard (partial unique index or advisory lock on
 * open discounted pendings per user) — deferred at current scale.
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

  // Open DISCOUNTED checkouts block too (they can still complete WITH their
  // discount); an undiscounted pending can't stack and is left alone.
  const { count: pendingCount, error: pendingError } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "pending")
    .gt("discount_cents", 0);
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
