import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const mockValidate = vi.fn();
const mockResolveFirstOrder = vi.fn();

vi.mock("@/lib/stripe/promo", () => ({
  validatePromoCode: (...args: unknown[]) => mockValidate(...args),
}));
vi.mock("@/lib/referrals/first-order-discount", () => ({
  resolveFirstOrderDiscount: (...args: unknown[]) => mockResolveFirstOrder(...args),
}));

import { resolveCheckoutDiscount, resolveStripeSessionDiscounts } from "../discount";
import type { CheckoutDiscount } from "../discount";
import type Stripe from "stripe";

const USER = "user-A";

/**
 * Minimal service-client stub: loyalty_rewards lookup returns `row`;
 * the orders redemption-count query resolves `orderCount`.
 */
function serviceClientReturning(row: { user_id: string } | null, orderCount = 0) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row });
  const rewardsEq = vi.fn(() => ({ maybeSingle }));
  const countNot = vi.fn().mockResolvedValue({ count: orderCount, error: null });
  const countEq = vi.fn(() => ({ not: countNot }));
  const from = vi.fn((table: string) =>
    table === "orders"
      ? { select: vi.fn(() => ({ eq: countEq })) }
      : { select: vi.fn(() => ({ eq: rewardsEq })) }
  );
  return { from } as unknown as SupabaseClient<Database>;
}

const userClient = {} as unknown as SupabaseClient<Database>;

beforeEach(() => {
  (mockValidate as Mock).mockReset();
  (mockResolveFirstOrder as Mock).mockReset();
});

describe("resolveCheckoutDiscount — loyalty code ownership", () => {
  it("accepts a KYAYZU- code owned by the redeeming user", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 800,
      couponId: "cpn_8",
      promotionCodeId: "promo_8",
      percentOff: null,
      minimumAmountCents: 5000,
    });
    const service = serviceClientReturning({ user_id: USER });

    const result = await resolveCheckoutDiscount(userClient, USER, 6000, "KYAYZU-ABC2345", service);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.discount.discountCents).toBe(800);
      expect(result.discount.promotionCodeId).toBe("promo_8");
    }
  });

  it("rejects a KYAYZU- code owned by a different account", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 800,
      couponId: "cpn_8",
      promotionCodeId: "promo_8",
      percentOff: null,
      minimumAmountCents: 5000,
    });
    const service = serviceClientReturning({ user_id: "user-B" });

    const result = await resolveCheckoutDiscount(userClient, USER, 6000, "KYAYZU-STOLEN1", service);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/different account/i);
  });

  it("rejects a KYAYZU- code with no matching reward row", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 800,
      couponId: "cpn_8",
      promotionCodeId: "promo_8",
      percentOff: null,
      minimumAmountCents: 5000,
    });
    const service = serviceClientReturning(null);

    const result = await resolveCheckoutDiscount(userClient, USER, 6000, "KYAYZU-GHOST99", service);

    expect(result.ok).toBe(false);
  });

  it("does NOT ownership-check non-loyalty (referral) codes", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 1000,
      couponId: "cpn_ref",
      promotionCodeId: "promo_ref",
      percentOff: null,
      minimumAmountCents: 5000,
    });
    // If the ownership branch ran, this null would reject; it must be skipped.
    const service = serviceClientReturning(null);

    const result = await resolveCheckoutDiscount(userClient, USER, 6000, "THANKS-XYZ123", service);

    expect(result.ok).toBe(true);
    expect(service.from as Mock).not.toHaveBeenCalled();
  });

  it("enforces the promo minimum subtotal with a friendly message", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 800,
      couponId: "cpn_8",
      promotionCodeId: "promo_8",
      percentOff: null,
      minimumAmountCents: 5000,
    });
    const service = serviceClientReturning({ user_id: USER });

    const result = await resolveCheckoutDiscount(userClient, USER, 4000, "KYAYZU-ABC2345", service);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/at least \$50/);
  });

  it("falls back to the server-gated first-order discount when no code", async () => {
    mockResolveFirstOrder.mockResolvedValue({
      couponId: "cpn_welcome",
      discountCents: 500,
      kind: "welcome",
    });
    const service = serviceClientReturning(null);

    const result = await resolveCheckoutDiscount(userClient, USER, 6000, undefined, service);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.discount.couponId).toBe("cpn_welcome");
      expect(result.discount.promotionCodeId).toBeNull();
    }
    expect(mockValidate).not.toHaveBeenCalled();
  });

  it("computes percent-off discounts from the subtotal and marks them isPercent", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 0,
      couponId: "cpn_pct",
      promotionCodeId: "promo_pct",
      percentOff: 15,
      minimumAmountCents: null,
      maxRedemptions: null,
      timesRedeemed: 0,
    });
    const service = serviceClientReturning(null);

    const result = await resolveCheckoutDiscount(userClient, USER, 10000, "SAVE15", service);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.discount.discountCents).toBe(1500);
      expect(result.discount.isPercent).toBe(true);
    }
  });

  it("amount_off codes are NOT marked isPercent", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 800,
      couponId: "cpn_8",
      promotionCodeId: "promo_8",
      percentOff: null,
      minimumAmountCents: null,
      maxRedemptions: 100,
      timesRedeemed: 3,
    });
    const service = serviceClientReturning(null);

    const result = await resolveCheckoutDiscount(userClient, USER, 6000, "FLAT8", service);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.discount.isPercent).toBe(false);
  });

  it("enforces max_redemptions app-side for percent codes (Stripe count + app orders)", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 0,
      couponId: "cpn_pct",
      promotionCodeId: "promo_pct",
      percentOff: 10,
      minimumAmountCents: null,
      maxRedemptions: 5,
      timesRedeemed: 2,
    });
    // 2 Stripe-counted + 3 app-side orders = 5 >= max 5 → rejected
    const service = serviceClientReturning(null, 3);

    const result = await resolveCheckoutDiscount(userClient, USER, 10000, "SAVE10", service);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/redemption limit/i);
  });

  it("allows percent codes still under their redemption cap", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 0,
      couponId: "cpn_pct",
      promotionCodeId: "promo_pct",
      percentOff: 10,
      minimumAmountCents: null,
      maxRedemptions: 5,
      timesRedeemed: 2,
    });
    const service = serviceClientReturning(null, 2);

    const result = await resolveCheckoutDiscount(userClient, USER, 10000, "SAVE10", service);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.discount.discountCents).toBe(1000);
  });
});

describe("resolveStripeSessionDiscounts — charged total must equal stored total", () => {
  function stripeCreatingCoupon(id = "cpn_oneoff") {
    const create = vi.fn().mockResolvedValue({ id });
    return { stripe: { coupons: { create } } as unknown as Stripe, create };
  }

  it("converts percent codes to a one-off amount_off coupon equal to the stored discount", async () => {
    const { stripe, create } = stripeCreatingCoupon();
    const discount: CheckoutDiscount = {
      discountCents: 1500,
      couponId: "cpn_pct",
      promotionCodeId: "promo_pct",
      isPercent: true,
    };

    const discounts = await resolveStripeSessionDiscounts(stripe, discount, "SAVE15");

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ amount_off: 1500, currency: "usd", duration: "once" })
    );
    expect(discounts).toEqual([{ coupon: "cpn_oneoff" }]);
  });

  it("passes amount_off codes through as the original promotion_code", async () => {
    const { stripe, create } = stripeCreatingCoupon();
    const discount: CheckoutDiscount = {
      discountCents: 800,
      couponId: "cpn_8",
      promotionCodeId: "promo_8",
      isPercent: false,
    };

    const discounts = await resolveStripeSessionDiscounts(stripe, discount, "FLAT8");

    expect(create).not.toHaveBeenCalled();
    expect(discounts).toEqual([{ promotion_code: "promo_8" }]);
  });

  it("applies the first-order discount as a bare coupon", async () => {
    const { stripe } = stripeCreatingCoupon();
    const discount: CheckoutDiscount = {
      discountCents: 500,
      couponId: "cpn_welcome",
      promotionCodeId: null,
      isPercent: false,
    };

    const discounts = await resolveStripeSessionDiscounts(stripe, discount, undefined);

    expect(discounts).toEqual([{ coupon: "cpn_welcome" }]);
  });

  it("returns undefined when there is no discount", async () => {
    const { stripe } = stripeCreatingCoupon();
    const discount: CheckoutDiscount = {
      discountCents: 0,
      couponId: null,
      promotionCodeId: null,
      isPercent: false,
    };

    expect(await resolveStripeSessionDiscounts(stripe, discount, undefined)).toBeUndefined();
  });
});
