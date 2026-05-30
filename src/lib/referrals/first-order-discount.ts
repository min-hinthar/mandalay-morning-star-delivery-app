import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, OrderStatus } from "@/types/database";
import { FIRST_ORDER_MIN_SUBTOTAL_CENTS, REFEREE_DISCOUNT_CENTS, WELCOME_DISCOUNT_CENTS } from ".";

/** Order statuses that count as a real (completed/processing) purchase. */
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
 */
export async function resolveFirstOrderDiscount(
  supabase: SupabaseClient<Database>,
  userId: string,
  subtotalCents: number
): Promise<FirstOrderDiscount | null> {
  const referralCoupon = process.env.STRIPE_REFERRAL_COUPON_ID;
  const welcomeCoupon = process.env.STRIPE_WELCOME_COUPON_ID;
  if (!referralCoupon && !welcomeCoupon) return null;
  if (subtotalCents < FIRST_ORDER_MIN_SUBTOTAL_CENTS) return null;

  // First completed order only.
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", COMPLETED_ORDER_STATUSES);
  if ((count ?? 0) > 0) return null;

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
