import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClaim = vi.fn();
const mockDeleteEq = vi.fn();

vi.mock("@/lib/coupons", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/coupons")>()),
  claimCoupon: (...args: unknown[]) => mockClaim(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: () => ({ delete: () => ({ eq: (...args: unknown[]) => mockDeleteEq(...args) }) }),
  }),
}));

import { claimAppCouponOrRollback } from "../coupon-claim";
import type { CheckoutDiscount } from "../discount";
import type { CouponRow } from "@/lib/coupons";

const discount = (appCoupon: Partial<CouponRow> | null): CheckoutDiscount => ({
  discountCents: 0,
  couponId: null,
  promotionCodeId: null,
  isPercent: false,
  appCoupon: appCoupon as CouponRow | null,
});

beforeEach(() => {
  mockClaim.mockReset();
  mockDeleteEq.mockReset().mockResolvedValue({ error: null });
});

describe("claimAppCouponOrRollback", () => {
  it("is a no-op without an app coupon", async () => {
    expect(await claimAppCouponOrRollback(discount(null), "o1", "u1")).toBeNull();
    expect(mockClaim).not.toHaveBeenCalled();
  });

  it("keeps the order when the claim wins", async () => {
    mockClaim.mockResolvedValue("ok");
    expect(await claimAppCouponOrRollback(discount({ id: "c1" }), "o1", "u1")).toBeNull();
    expect(mockDeleteEq).not.toHaveBeenCalled();
  });

  it("deletes the just-created order and returns 409 when the coupon is already taken", async () => {
    mockClaim.mockResolvedValue("in_use");
    const res = await claimAppCouponOrRollback(discount({ id: "c1" }), "o1", "u1");
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "o1");
    expect(res?.status).toBe(409);
    const body = await res!.json();
    expect(body.error.message).toMatch(/already in use/i);
  });

  it("fails closed on an RPC error (never keeps an unclaimed discounted order)", async () => {
    mockClaim.mockResolvedValue("error");
    const res = await claimAppCouponOrRollback(discount({ id: "c1" }), "o1", "u1");
    expect(mockDeleteEq).toHaveBeenCalled();
    expect(res?.status).toBe(500);
  });
});
