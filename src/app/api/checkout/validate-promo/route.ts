import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { labelFor, lookupCoupon, normalizeCouponCode } from "@/lib/coupons";
import { checkRateLimit, publicReadLimiter, getClientIp } from "@/lib/rate-limit";
import { validatePromoCode } from "@/lib/stripe/promo";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  code: z.string().min(1).max(50),
});

/** One generic message for every rejection — prevents code enumeration. */
const NOT_VALID = { valid: false, error: "Promo code is not valid or has expired" };

/**
 * Preview a code for the checkout summary. Advisory only: the checkout route
 * re-validates everything (subtotal minimum, first-order, redemption caps)
 * and app coupons are claimed atomically there. The response carries enough
 * shape (`kind`, `percentOff`, caps, minimum) for the client to recompute the
 * discount live as the cart changes, instead of freezing a stale amount.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit to prevent promo code enumeration
    const ip = getClientIp(request);
    const rl = await checkRateLimit({
      limiter: publicReadLimiter,
      identifier: ip,
      role: "anon",
      route: "checkout/validate-promo",
    });
    if (rl.limited) return rl.response;

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ valid: false, error: "Invalid promo code" }, { status: 400 });
    }
    const code = normalizeCouponCode(parsed.data.code);

    // Optional: signed-in customers get account-bound checks (assigned app
    // coupons, loyalty-code ownership) at preview time, not at Place Order.
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    const service = createServiceClient();

    const coupon = await lookupCoupon(service, code, {
      userId: user?.id ?? null,
      subtotalCents: null,
    });
    if (coupon.status === "invalid") return NextResponse.json(NOT_VALID, { status: 200 });
    if (coupon.status === "valid") {
      const c = coupon.coupon;
      return NextResponse.json({
        valid: true,
        kind: c.kind,
        discountCents: c.amount_off_cents ?? 0,
        percentOff: c.percent_off,
        maxDiscountCents: c.max_discount_cents,
        minimumAmountCents: c.min_subtotal_cents > 0 ? c.min_subtotal_cents : null,
        label: labelFor(c),
      });
    }

    const result = await validatePromoCode(code);
    if (!result.valid) return NextResponse.json(NOT_VALID, { status: 200 });

    if (user && code.startsWith("KYAYZU-")) {
      const { data: reward } = await service
        .from("loyalty_rewards")
        .select("user_id, redeemed_at")
        .eq("reward_code", code)
        .maybeSingle();
      if (!reward || reward.user_id !== user.id || reward.redeemed_at) {
        return NextResponse.json(NOT_VALID, { status: 200 });
      }
    }

    const isPercent = result.percentOff != null;
    return NextResponse.json({
      valid: true,
      kind: isPercent ? "percent_off" : "amount_off",
      discountCents: result.discountCents,
      percentOff: result.percentOff,
      maxDiscountCents: null,
      minimumAmountCents: result.minimumAmountCents,
      label: isPercent
        ? result.percentOff + "% off"
        : "$" + (result.discountCents / 100).toFixed(2) + " off",
    });
  } catch {
    return NextResponse.json(
      { valid: false, error: "Failed to validate promo code" },
      { status: 500 }
    );
  }
}
