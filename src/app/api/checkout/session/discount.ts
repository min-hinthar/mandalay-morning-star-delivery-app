import type { SupabaseClient } from "@supabase/supabase-js";

import { validatePromoCode } from "@/lib/stripe/promo";
import { resolveFirstOrderDiscount } from "@/lib/referrals/first-order-discount";
import type { Database } from "@/types/database";

export interface CheckoutDiscount {
  discountCents: number;
  /** Bare coupon id — used for the server-gated first-order auto-discount. */
  couponId: string | null;
  /**
   * Promotion code id for a customer-entered code. When set, checkout applies
   * it as `discounts: [{ promotion_code }]` so Stripe natively enforces the
   * code's max_redemptions / minimum_amount / expires_at.
   */
  promotionCodeId: string | null;
}

export type ResolveDiscountResult =
  | { ok: true; discount: CheckoutDiscount }
  | { ok: false; message: string };

/**
 * Resolve the discount for a checkout session.
 *
 * - A customer-entered `promoCode` is validated against Stripe; its minimum
 *   subtotal is enforced here (friendly error) rather than letting Stripe 500
 *   at session creation. Applied as a promotion code so restrictions hold.
 * - With no code, falls back to the server-gated first-order auto-discount
 *   (welcome/referee), applied as a bare coupon (no shareable code).
 */
export async function resolveCheckoutDiscount(
  supabase: SupabaseClient<Database>,
  userId: string,
  subtotalCents: number,
  promoCode: string | undefined,
  /** Service-role client, used ONLY for the loyalty-code ownership lookup (must
   * see rows the customer doesn't own to reject cross-account use). */
  serviceClient: SupabaseClient<Database>
): Promise<ResolveDiscountResult> {
  if (promoCode) {
    const promo = await validatePromoCode(promoCode);
    if (!promo.valid) {
      return { ok: false, message: promo.message };
    }
    // Loyalty codes (KYAYZU-) are issued to one customer. Stripe's
    // max_redemptions:1 already blocks reuse, but bind the code to its owner
    // here so a leaked code can't be redeemed by another account and the
    // customer gets a clear message before paying. Referral codes are
    // intentionally shareable, so they're exempt. Uses the service client so
    // RLS doesn't hide another account's row (which would mask the real cause).
    if (promoCode.toUpperCase().startsWith("KYAYZU-")) {
      const { data: reward } = await serviceClient
        .from("loyalty_rewards")
        .select("user_id")
        .eq("reward_code", promoCode)
        .maybeSingle();
      if (!reward) {
        return { ok: false, message: "Invalid or expired promo code" };
      }
      if (reward.user_id !== userId) {
        return { ok: false, message: "This reward is linked to a different account." };
      }
    }
    if (promo.minimumAmountCents !== null && subtotalCents < promo.minimumAmountCents) {
      return {
        ok: false,
        message: `This code needs a subtotal of at least $${(promo.minimumAmountCents / 100).toFixed(2)}.`,
      };
    }
    const discountCents =
      promo.percentOff !== null
        ? Math.round((subtotalCents * promo.percentOff) / 100)
        : promo.discountCents;
    return {
      ok: true,
      discount: {
        discountCents,
        couponId: promo.couponId,
        promotionCodeId: promo.promotionCodeId,
      },
    };
  }

  const autoDiscount = await resolveFirstOrderDiscount(supabase, userId, subtotalCents);
  if (autoDiscount) {
    return {
      ok: true,
      discount: {
        discountCents: autoDiscount.discountCents,
        couponId: autoDiscount.couponId,
        promotionCodeId: null,
      },
    };
  }

  return { ok: true, discount: { discountCents: 0, couponId: null, promotionCodeId: null } };
}
