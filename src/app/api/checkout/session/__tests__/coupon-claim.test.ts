import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClaim = vi.fn();
const mockDeleteEq = vi.fn();
const mockCancelIn = vi.fn();
const mockReclaim = vi.fn();
let couponHolder: { order_id: string | null } | null = null;
let holderOrder: { user_id: string; status: string } | null = null;

vi.mock("@/lib/coupons", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/coupons")>()),
  claimCoupon: (...args: unknown[]) => mockClaim(...args),
}));
vi.mock("@/lib/referrals/reclaim-pending-checkouts", () => ({
  reclaimPendingCheckouts: (...args: unknown[]) => mockReclaim(...args),
}));
vi.mock("@/lib/stripe/server", () => ({ stripe: {} }));
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: (table: string) => ({
      delete: () => ({ eq: (...args: unknown[]) => mockDeleteEq(...args) }),
      update: () => ({ eq: () => ({ in: (...args: unknown[]) => mockCancelIn(...args) }) }),
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: table === "coupons" ? couponHolder : holderOrder }),
        }),
      }),
    }),
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
  mockReclaim.mockReset();
  mockDeleteEq.mockReset().mockResolvedValue({ error: null });
  mockCancelIn.mockReset().mockResolvedValue({ error: null });
  couponHolder = null;
  holderOrder = null;
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

  it("deletes the just-created order and returns 409 when another customer holds the coupon", async () => {
    mockClaim.mockResolvedValue("in_use");
    couponHolder = { order_id: "other-order" };
    holderOrder = { user_id: "u2", status: "confirmed" };
    const res = await claimAppCouponOrRollback(discount({ id: "c1" }), "o1", "u1");
    expect(mockReclaim).not.toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "o1");
    expect(res?.status).toBe(409);
    const body = await res!.json();
    expect(body.error.message).toMatch(/already in use/i);
  });

  it("reclaims the customer's OWN abandoned checkout, then claims again", async () => {
    mockClaim.mockResolvedValueOnce("in_use").mockResolvedValueOnce("ok");
    couponHolder = { order_id: "my-old-order" };
    holderOrder = { user_id: "u1", status: "pending" };
    mockReclaim.mockResolvedValue(true);
    expect(await claimAppCouponOrRollback(discount({ id: "c1" }), "o1", "u1")).toBeNull();
    expect(mockReclaim).toHaveBeenCalledWith({}, expect.anything(), "u1", {
      orderIds: ["my-old-order"],
    });
    expect(mockDeleteEq).not.toHaveBeenCalled();
  });

  it("fails closed on an RPC error (never keeps an unclaimed discounted order)", async () => {
    mockClaim.mockResolvedValue("error");
    const res = await claimAppCouponOrRollback(discount({ id: "c1" }), "o1", "u1");
    expect(mockDeleteEq).toHaveBeenCalled();
    expect(res?.status).toBe(500);
  });

  it("cancels the order when the rollback delete itself fails", async () => {
    mockClaim.mockResolvedValue("in_use");
    mockDeleteEq.mockResolvedValue({ error: { message: "boom" } });
    await claimAppCouponOrRollback(discount({ id: "c1" }), "o1", "u1");
    expect(mockCancelIn).toHaveBeenCalledWith("status", ["pending", "pending_approval"]);
  });
});
