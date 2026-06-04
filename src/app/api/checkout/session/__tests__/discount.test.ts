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

import { resolveCheckoutDiscount } from "../discount";

const USER = "user-A";

/** Minimal service-client stub whose loyalty_rewards lookup returns `row`. */
function serviceClientReturning(row: { user_id: string } | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
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

  it("computes percent-off discounts from the subtotal", async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      discountCents: 0,
      couponId: "cpn_pct",
      promotionCodeId: "promo_pct",
      percentOff: 15,
      minimumAmountCents: null,
    });
    const service = serviceClientReturning(null);

    const result = await resolveCheckoutDiscount(userClient, USER, 10000, "SAVE15", service);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.discount.discountCents).toBe(1500);
  });
});
