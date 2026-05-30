import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveFirstOrderDiscount } from "../first-order-discount";

afterEach(() => {
  delete process.env.STRIPE_REFERRAL_COUPON_ID;
  delete process.env.STRIPE_WELCOME_COUPON_ID;
});

describe("resolveFirstOrderDiscount", () => {
  it("is a no-op (and never queries) when no coupons are configured", async () => {
    const from = vi.fn();
    const result = await resolveFirstOrderDiscount({ from } as never, "user-1", 9999);
    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("returns null below the minimum subtotal even when configured", async () => {
    process.env.STRIPE_WELCOME_COUPON_ID = "welcome_x";
    const from = vi.fn();
    // $40 < $50 minimum
    const result = await resolveFirstOrderDiscount({ from } as never, "user-1", 4000);
    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });
});
