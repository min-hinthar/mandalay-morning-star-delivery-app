import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const mockValidate = vi.fn();
const mockResolveFirstOrder = vi.fn();
const mockReclaim = vi.fn();
const mockLookupCoupon = vi.fn();

vi.mock("@/lib/stripe/promo", () => ({
  validatePromoCode: (...args: unknown[]) => mockValidate(...args),
}));
vi.mock("@/lib/referrals/first-order-discount", () => ({
  resolveFirstOrderDiscount: (...args: unknown[]) => mockResolveFirstOrder(...args),
}));
vi.mock("@/lib/coupons", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/coupons")>()),
  lookupCoupon: (...args: unknown[]) => mockLookupCoupon(...args),
}));
vi.mock("@/lib/referrals/reclaim-pending-checkouts", () => ({
  reclaimPendingCheckouts: (...args: unknown[]) => mockReclaim(...args),
}));

import {
  withoutIdleCoupon,
  applyDeliveryWaiver,
  resolveCheckoutDiscount,
  resolveStripeSessionDiscounts,
} from "../discount";
import type { CouponRow } from "@/lib/coupons";
import type { CheckoutDiscount } from "../discount";
import type Stripe from "stripe";

const USER = "user-A";
const stripeStub = {} as unknown as Stripe;

type Call = [string, unknown[]];

/** Chainable, awaitable query stub: records every builder call, resolves via `resolve`. */
function chain(resolve: (calls: Call[]) => unknown) {
  const calls: Call[] = [];
  const obj: Record<string, unknown> = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === "then") {
          return (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
            Promise.resolve(resolve(calls)).then(res, rej);
        }
        return (...args: unknown[]) => {
          calls.push([prop, args]);
          return obj;
        };
      },
    }
  );
  return { obj, calls };
}

const has = (calls: Call[], method: string, col?: string) =>
  calls.some(([m, a]) => m === method && (col === undefined || a[0] === col));

/**
 * Service-client stub. loyalty_rewards → `row`. orders queries resolve by shape:
 * - redemption count (eq promo_code, head count): `orderCount` for percent
 *   (has gte cutover), `codCount` for amount_off;
 * - own pending checkouts with the code (eq promo_code, row select) → `ownPendingIds`;
 * - discounted-pending count (gt discount_cents) → `pendingCount`;
 * - prior-orders count (first-time gate) → `orderCount`.
 */
function serviceClientReturning(
  row: { user_id: string; redeemed_at?: string | null } | null,
  orderCount = 0,
  pendingCount = 0,
  codCount = 0,
  ownPendingIds: string[] = []
) {
  const queries: Call[][] = [];
  const from = vi.fn((table: string) => {
    const { obj, calls } = chain((c) => {
      if (table === "loyalty_rewards") return { data: row, error: null };
      const head = c.some(([m, a]) => m === "select" && (a[1] as { head?: boolean })?.head);
      if (has(c, "eq", "promo_code")) {
        if (!head) return { data: ownPendingIds.map((id) => ({ id })), error: null };
        return { count: has(c, "gte") ? orderCount : codCount, error: null };
      }
      if (has(c, "gt", "discount_cents")) return { count: pendingCount, error: null };
      return { count: orderCount, error: null };
    });
    queries.push(calls);
    return obj;
  });
  return Object.assign({ from } as unknown as SupabaseClient<Database>, { queries });
}

const userClient = {} as unknown as SupabaseClient<Database>;

beforeEach(() => {
  (mockValidate as Mock).mockReset();
  (mockResolveFirstOrder as Mock).mockReset();
  (mockReclaim as Mock).mockReset();
  (mockLookupCoupon as Mock).mockReset();
  (mockLookupCoupon as Mock).mockResolvedValue({ status: "none" });
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

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      6000,
      "KYAYZU-ABC2345",
      service,
      stripeStub
    );

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

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      6000,
      "KYAYZU-STOLEN1",
      service,
      stripeStub
    );

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

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      6000,
      "KYAYZU-GHOST99",
      service,
      stripeStub
    );

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

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      6000,
      "THANKS-XYZ123",
      service,
      stripeStub
    );

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

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      4000,
      "KYAYZU-ABC2345",
      service,
      stripeStub
    );

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

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      6000,
      undefined,
      service,
      stripeStub
    );

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

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      10000,
      "SAVE15",
      service,
      stripeStub
    );

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

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      6000,
      "FLAT8",
      service,
      stripeStub
    );

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

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      10000,
      "SAVE10",
      service,
      stripeStub
    );

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

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      10000,
      "SAVE10",
      service,
      stripeStub
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.discount.discountCents).toBe(1000);
  });

  it("passes the reclaim context through to the first-order discount resolver", async () => {
    mockResolveFirstOrder.mockResolvedValue(null);
    const service = serviceClientReturning(null);

    await resolveCheckoutDiscount(userClient, USER, 6000, undefined, service, stripeStub);

    expect(mockResolveFirstOrder).toHaveBeenCalledWith(userClient, USER, 6000, {
      stripe: stripeStub,
      serviceClient: service,
    });
  });

  it("first_time_transaction percent code: a pending checkout blocks until reclaimed (D6)", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 0,
      couponId: "cpn_pct",
      promotionCodeId: "promo_pct",
      percentOff: 10,
      minimumAmountCents: null,
      maxRedemptions: null,
      timesRedeemed: 0,
      firstTimeTransaction: true,
    });
    mockReclaim.mockResolvedValue(true);
    const service = serviceClientReturning(null, 0, 2);

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      10000,
      "WELCOME10",
      service,
      stripeStub
    );

    expect(mockReclaim).toHaveBeenCalledWith(stripeStub, service, USER);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.discount.discountCents).toBe(1000);
  });

  it("first_time_transaction percent code: failed reclaim rejects with a friendly message (D6)", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 0,
      couponId: "cpn_pct",
      promotionCodeId: "promo_pct",
      percentOff: 10,
      minimumAmountCents: null,
      maxRedemptions: null,
      timesRedeemed: 0,
      firstTimeTransaction: true,
    });
    mockReclaim.mockResolvedValue(false);
    const service = serviceClientReturning(null, 0, 1);

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      10000,
      "WELCOME10",
      service,
      stripeStub
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/another checkout in progress/i);
  });

  it("reclaim never runs for a code that fails max_redemptions (destructive gate is last)", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 0,
      couponId: "cpn_pct",
      promotionCodeId: "promo_pct",
      percentOff: 10,
      minimumAmountCents: null,
      maxRedemptions: 5,
      timesRedeemed: 5,
      firstTimeTransaction: true,
    });
    // Pendings exist, but the code is at its global cap — a doomed code must
    // not tear down a live checkout on its way to rejection.
    const service = serviceClientReturning(null, 0, 2);

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      10000,
      "WELCOME10",
      service,
      stripeStub
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/redemption limit/i);
    expect(mockReclaim).not.toHaveBeenCalled();
  });

  it("first_time_transaction percent code: no pendings means no reclaim call", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 0,
      couponId: "cpn_pct",
      promotionCodeId: "promo_pct",
      percentOff: 10,
      minimumAmountCents: null,
      maxRedemptions: null,
      timesRedeemed: 0,
      firstTimeTransaction: true,
    });
    const service = serviceClientReturning(null, 0, 0);

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      10000,
      "WELCOME10",
      service,
      stripeStub
    );

    expect(mockReclaim).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });

  it("enforces first_time_transaction for percent codes (repeat customer rejected)", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 0,
      couponId: "cpn_pct",
      promotionCodeId: "promo_pct",
      percentOff: 10,
      minimumAmountCents: null,
      maxRedemptions: null,
      timesRedeemed: 0,
      firstTimeTransaction: true,
    });
    // Customer already has 1 non-pending/cancelled order
    const service = serviceClientReturning(null, 1);

    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      10000,
      "WELCOME10",
      service,
      stripeStub
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/first order/i);
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
      appCoupon: null,
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
      appCoupon: null,
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
      appCoupon: null,
    };

    const discounts = await resolveStripeSessionDiscounts(stripe, discount, undefined);

    expect(discounts).toEqual([{ coupon: "cpn_welcome" }]);
  });

  it("never falls through to the raw promotion code when a percent rounds to zero", async () => {
    const { stripe, create } = stripeCreatingCoupon();
    const discount: CheckoutDiscount = {
      discountCents: 0,
      couponId: "cpn_pct",
      promotionCodeId: "promo_pct",
      isPercent: true,
      appCoupon: null,
    };

    const discounts = await resolveStripeSessionDiscounts(stripe, discount, "SAVE15");

    expect(create).not.toHaveBeenCalled();
    expect(discounts).toBeUndefined();
  });

  it("returns undefined when there is no discount", async () => {
    const { stripe } = stripeCreatingCoupon();
    const discount: CheckoutDiscount = {
      discountCents: 0,
      couponId: null,
      promotionCodeId: null,
      isPercent: false,
      appCoupon: null,
    };

    expect(await resolveStripeSessionDiscounts(stripe, discount, undefined)).toBeUndefined();
  });
});

function couponRow(overrides: Partial<CouponRow> = {}): CouponRow {
  return {
    id: "cpn-app-1",
    code: "FREEDEL-ABC234",
    kind: "free_delivery",
    amount_off_cents: null,
    percent_off: null,
    max_discount_cents: null,
    min_subtotal_cents: 0,
    assigned_user_id: null,
    expires_at: null,
    note: null,
    created_by: null,
    created_at: "2026-09-01T00:00:00Z",
    revoked_at: null,
    order_id: null,
    redeemed_at: null,
    redeemed_by: null,
    ...overrides,
  };
}

describe("resolveCheckoutDiscount — one-time reuse via COD (Stripe never counts COD)", () => {
  it("rejects a KYAYZU- code already stamped redeemed", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 500,
      couponId: "cpn_5",
      promotionCodeId: "promo_5",
      percentOff: null,
      minimumAmountCents: null,
      maxRedemptions: 1,
      timesRedeemed: 0,
    });
    const service = serviceClientReturning({ user_id: USER, redeemed_at: "2026-09-01T00:00:00Z" });
    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      6000,
      "KYAYZU-ABCD1234",
      service,
      stripeStub,
      "cod"
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/already been used/i);
  });

  it("counts COD redemptions against an amount_off code's max_redemptions", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 500,
      couponId: "cpn_5",
      promotionCodeId: "promo_5",
      percentOff: null,
      minimumAmountCents: null,
      maxRedemptions: 1,
      timesRedeemed: 0,
    });
    const service = serviceClientReturning(null, 0, 0, 1);
    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      6000,
      "ONCE5",
      service,
      stripeStub,
      "cod"
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/redemption limit/i);
  });

  it("enforces first_time_transaction for amount_off codes (Stripe can't see COD orders)", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 500,
      couponId: "cpn_5",
      promotionCodeId: "promo_5",
      percentOff: null,
      minimumAmountCents: null,
      maxRedemptions: null,
      timesRedeemed: 0,
      firstTimeTransaction: true,
    });
    const service = serviceClientReturning(null, 2);
    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      6000,
      "WELCOME5",
      service,
      stripeStub,
      "cod"
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/first order/i);
  });
});

describe("resolveCheckoutDiscount — limited codes vs open card checkouts", () => {
  const limitedAmount = {
    valid: true,
    discountCents: 500,
    couponId: "cpn_5",
    promotionCodeId: "promo_5",
    percentOff: null,
    minimumAmountCents: null,
    maxRedemptions: 1,
    timesRedeemed: 0,
  };

  it("counts OTHER customers' open card checkouts (Stripe only counts at completion)", async () => {
    mockValidate.mockResolvedValue(limitedAmount);
    const service = serviceClientReturning(null);
    await resolveCheckoutDiscount(userClient, USER, 6000, "ONCE5", service, stripeStub, "cod");
    const countQuery = service.queries.find(
      (q) => has(q, "eq", "promo_code") && q.some(([m]) => m === "or")
    );
    const orFilter = countQuery?.find(([m]) => m === "or")?.[1][0] as string;
    expect(orFilter).toContain("payment_method.eq.cod");
    expect(orFilter).toContain(`and(status.eq.pending,user_id.neq.${USER}`);
  });

  it("reclaims the customer's own open checkout with the code before granting it", async () => {
    mockValidate.mockResolvedValue(limitedAmount);
    mockReclaim.mockResolvedValue(true);
    const service = serviceClientReturning(null, 0, 0, 0, ["own-pending-1"]);
    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      6000,
      "ONCE5",
      service,
      stripeStub
    );
    expect(mockReclaim).toHaveBeenCalledWith(stripeStub, service, USER, {
      orderIds: ["own-pending-1"],
    });
    expect(result.ok).toBe(true);
  });

  it("withholds the code when the customer's own open checkout can't be reclaimed", async () => {
    mockValidate.mockResolvedValue(limitedAmount);
    mockReclaim.mockResolvedValue(false);
    const service = serviceClientReturning(null, 0, 0, 0, ["own-pending-1"]);
    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      6000,
      "ONCE5",
      service,
      stripeStub
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/another checkout in progress/i);
  });
});

describe("resolveCheckoutDiscount — app-issued coupons", () => {
  it("returns the app coupon (and never consults Stripe) for a free-delivery code", async () => {
    mockLookupCoupon.mockResolvedValue({ status: "valid", coupon: couponRow() });
    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      6000,
      "FREEDEL-ABC234",
      serviceClientReturning(null),
      stripeStub
    );
    expect(mockValidate).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.discount.discountCents).toBe(0);
      expect(result.discount.appCoupon?.id).toBe("cpn-app-1");
    }
  });

  it("sizes an amount_off coupon to the subtotal", async () => {
    mockLookupCoupon.mockResolvedValue({
      status: "valid",
      coupon: couponRow({ kind: "amount_off", amount_off_cents: 5000 }),
    });
    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      3000,
      "GIFT-ABC234",
      serviceClientReturning(null),
      stripeStub
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.discount.discountCents).toBe(3000);
  });

  it("surfaces an invalid app coupon's message without falling through to Stripe", async () => {
    mockLookupCoupon.mockResolvedValue({
      status: "invalid",
      message: "This code has already been used.",
    });
    const result = await resolveCheckoutDiscount(
      userClient,
      USER,
      6000,
      "GIFT-ABC234",
      serviceClientReturning(null),
      stripeStub
    );
    expect(mockValidate).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, message: "This code has already been used." });
  });
});

describe("applyDeliveryWaiver", () => {
  const totals = {
    subtotalCents: 4000,
    deliveryFeeCents: 1500,
    taxCents: 420,
    tipCents: 600,
    discountCents: 0,
    totalCents: 6520,
  };
  const base: CheckoutDiscount = {
    discountCents: 0,
    couponId: null,
    promotionCodeId: null,
    isPercent: false,
    appCoupon: null,
  };

  it("zeroes the delivery fee and total follows, leaving discount_cents untouched", () => {
    const out = applyDeliveryWaiver(totals, { ...base, appCoupon: couponRow() });
    expect(out).toEqual({ ...totals, deliveryFeeCents: 0, totalCents: 5020 });
  });

  it("honors a waiver cap (far-band fee only partly waived)", () => {
    const out = applyDeliveryWaiver(
      { ...totals, deliveryFeeCents: 3000, totalCents: 8020 },
      { ...base, appCoupon: couponRow({ max_discount_cents: 1500 }) }
    );
    expect(out.deliveryFeeCents).toBe(1500);
    expect(out.totalCents).toBe(6520);
  });

  it("is a no-op for non-coupon and non-free-delivery discounts", () => {
    expect(applyDeliveryWaiver(totals, base)).toBe(totals);
    const amount = couponRow({ kind: "amount_off", amount_off_cents: 500 });
    expect(applyDeliveryWaiver(totals, { ...base, appCoupon: amount })).toBe(totals);
  });
});

describe("resolveStripeSessionDiscounts — app coupons", () => {
  it("charges an amount/percent app coupon via a one-off amount_off coupon", async () => {
    const create = vi.fn().mockResolvedValue({ id: "cpn_oneoff" });
    const stripe = { coupons: { create } } as unknown as Stripe;
    const discounts = await resolveStripeSessionDiscounts(
      stripe,
      {
        discountCents: 700,
        couponId: null,
        promotionCodeId: null,
        isPercent: false,
        appCoupon: couponRow({ kind: "amount_off", amount_off_cents: 700 }),
      },
      "GIFT-ABC234"
    );
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ amount_off: 700 }));
    expect(discounts).toEqual([{ coupon: "cpn_oneoff" }]);
  });

  it("sends no Stripe discount for free delivery (the fee line is simply absent)", async () => {
    const create = vi.fn();
    const stripe = { coupons: { create } } as unknown as Stripe;
    const discounts = await resolveStripeSessionDiscounts(
      stripe,
      {
        discountCents: 0,
        couponId: null,
        promotionCodeId: null,
        isPercent: false,
        appCoupon: couponRow(),
      },
      "FREEDEL-ABC234"
    );
    expect(create).not.toHaveBeenCalled();
    expect(discounts).toBeUndefined();
  });
});

describe("withoutIdleCoupon", () => {
  const base: CheckoutDiscount = {
    discountCents: 0,
    couponId: null,
    promotionCodeId: null,
    isPercent: false,
    appCoupon: couponRow(),
  };
  it("drops a free-delivery coupon when delivery is already free (never burned for $0)", () => {
    expect(withoutIdleCoupon(base, 0).appCoupon).toBeNull();
  });
  it("keeps it when there is a fee to waive", () => {
    expect(withoutIdleCoupon(base, 1500)).toBe(base);
  });
  it("keeps a discount coupon that saves money", () => {
    const amount = {
      ...base,
      discountCents: 500,
      appCoupon: couponRow({ kind: "amount_off", amount_off_cents: 500 }),
    };
    expect(withoutIdleCoupon(amount, 0)).toBe(amount);
  });
});
