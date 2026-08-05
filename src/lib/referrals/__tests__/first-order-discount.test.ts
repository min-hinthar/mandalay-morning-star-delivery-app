import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const mockReclaim = vi.fn();
vi.mock("../reclaim-pending-checkouts", () => ({
  reclaimPendingCheckouts: (...args: unknown[]) => mockReclaim(...args),
}));

import { resolveFirstOrderDiscount } from "../first-order-discount";

const stripeStub = {} as unknown as Stripe;
const serviceStub = {} as unknown as SupabaseClient<Database>;
const RECLAIM = { stripe: stripeStub, serviceClient: serviceStub };

/**
 * Supabase stub for the resolver's three queries:
 *  - orders completed count: .select(count).eq(user_id).in(statuses)
 *  - orders pending count:   .select(count).eq(user_id).eq(status).gt(discount)
 *  - referrals lookup:       .select().eq().eq().maybeSingle()
 */
function supabaseWith(opts: {
  completed?: number;
  pending?: number;
  completedError?: boolean;
  pendingError?: boolean;
  referred?: boolean;
}) {
  const completedResult = opts.completedError
    ? { count: null, error: { message: "boom" } }
    : { count: opts.completed ?? 0, error: null };
  const pendingResult = opts.pendingError
    ? { count: null, error: { message: "boom" } }
    : { count: opts.pending ?? 0, error: null };

  const inFn = vi.fn().mockResolvedValue(completedResult);
  const gtFn = vi.fn().mockResolvedValue(pendingResult);
  const statusEq = vi.fn(() => ({ gt: gtFn }));
  const userEq = vi.fn(() => ({ in: inFn, eq: statusEq }));

  const maybeSingle = vi.fn().mockResolvedValue({ data: opts.referred ? { id: "ref-1" } : null });
  const refEq2 = vi.fn(() => ({ maybeSingle }));
  const refEq1 = vi.fn(() => ({ eq: refEq2 }));

  const from = vi.fn((table: string) =>
    table === "orders"
      ? { select: vi.fn(() => ({ eq: userEq })) }
      : { select: vi.fn(() => ({ eq: refEq1 })) }
  );
  return { from } as unknown as SupabaseClient<Database>;
}

beforeEach(() => {
  (mockReclaim as Mock).mockReset();
  process.env.STRIPE_WELCOME_COUPON_ID = "welcome_x";
});

afterEach(() => {
  delete process.env.STRIPE_REFERRAL_COUPON_ID;
  delete process.env.STRIPE_WELCOME_COUPON_ID;
});

describe("resolveFirstOrderDiscount", () => {
  it("is a no-op (and never queries) when no coupons are configured", async () => {
    delete process.env.STRIPE_WELCOME_COUPON_ID;
    const from = vi.fn();
    const result = await resolveFirstOrderDiscount({ from } as never, "user-1", 9999);
    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("returns null below the minimum subtotal even when configured", async () => {
    const from = vi.fn();
    // $40 < $50 minimum
    const result = await resolveFirstOrderDiscount({ from } as never, "user-1", 4000);
    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("grants the welcome discount to a genuinely first-time customer", async () => {
    const supabase = supabaseWith({ completed: 0, pending: 0 });
    const result = await resolveFirstOrderDiscount(supabase, "user-1", 9999, RECLAIM);
    expect(result).toEqual({ couponId: "welcome_x", discountCents: 500, kind: "welcome" });
    expect(mockReclaim).not.toHaveBeenCalled();
  });

  it("prefers the referee discount for referred customers", async () => {
    process.env.STRIPE_REFERRAL_COUPON_ID = "referral_x";
    const supabase = supabaseWith({ completed: 0, pending: 0, referred: true });
    const result = await resolveFirstOrderDiscount(supabase, "user-1", 9999, RECLAIM);
    expect(result).toEqual({ couponId: "referral_x", discountCents: 1000, kind: "referee" });
  });

  it("returns null once the customer has a completed order", async () => {
    const supabase = supabaseWith({ completed: 1 });
    expect(await resolveFirstOrderDiscount(supabase, "user-1", 9999, RECLAIM)).toBeNull();
  });

  it("a failed completed-count read withholds the discount (never grants on error)", async () => {
    const supabase = supabaseWith({ completedError: true });
    expect(await resolveFirstOrderDiscount(supabase, "user-1", 9999, RECLAIM)).toBeNull();
    expect(mockReclaim).not.toHaveBeenCalled();
  });

  it("a failed pending-count read withholds the discount too", async () => {
    const supabase = supabaseWith({ completed: 0, pendingError: true });
    expect(await resolveFirstOrderDiscount(supabase, "user-1", 9999, RECLAIM)).toBeNull();
    expect(mockReclaim).not.toHaveBeenCalled();
  });

  it("D6: an open pending checkout blocks the discount when reclaim is unavailable", async () => {
    const supabase = supabaseWith({ completed: 0, pending: 1 });
    expect(await resolveFirstOrderDiscount(supabase, "user-1", 9999)).toBeNull();
  });

  it("D6: pendings are reclaimed and the discount granted when reclaim succeeds", async () => {
    mockReclaim.mockResolvedValue(true);
    const supabase = supabaseWith({ completed: 0, pending: 2 });
    const result = await resolveFirstOrderDiscount(supabase, "user-1", 9999, RECLAIM);
    expect(mockReclaim).toHaveBeenCalledWith(stripeStub, serviceStub, "user-1");
    expect(result).toEqual({ couponId: "welcome_x", discountCents: 500, kind: "welcome" });
  });

  it("D6: a failed reclaim withholds the discount (fail-safe against stacking)", async () => {
    mockReclaim.mockResolvedValue(false);
    const supabase = supabaseWith({ completed: 0, pending: 1 });
    expect(await resolveFirstOrderDiscount(supabase, "user-1", 9999, RECLAIM)).toBeNull();
  });

  it("D6: a completed order short-circuits before any reclaim attempt", async () => {
    mockReclaim.mockResolvedValue(true);
    const supabase = supabaseWith({ completed: 1, pending: 3 });
    expect(await resolveFirstOrderDiscount(supabase, "user-1", 9999, RECLAIM)).toBeNull();
    expect(mockReclaim).not.toHaveBeenCalled();
  });
});
