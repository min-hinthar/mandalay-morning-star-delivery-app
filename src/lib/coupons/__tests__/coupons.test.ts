import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import {
  COUPON_CODE_PATTERN,
  generateCouponCode,
  isReservedCouponCode,
  lookupCoupon,
  type CouponRow,
} from "..";
import { couponEffect, couponLabel } from "../effect";
import { couponStatus } from "../status";
import { createCouponsSchema } from "@/app/api/admin/coupons/schemas";

const none = { amount_off_cents: null, percent_off: null, max_discount_cents: null };

describe("couponEffect", () => {
  it("free delivery waives the whole fee and never touches the food discount", () => {
    expect(couponEffect("free_delivery", none, 4000, 1500)).toEqual({
      discountCents: 0,
      deliveryWaiverCents: 1500,
    });
  });
  it("free delivery honors a waiver cap", () => {
    const e = couponEffect("free_delivery", { ...none, max_discount_cents: 1500 }, 4000, 3000);
    expect(e.deliveryWaiverCents).toBe(1500);
  });
  it("amount_off never exceeds the subtotal", () => {
    const e = couponEffect("amount_off", { ...none, amount_off_cents: 5000 }, 3200, 1500);
    expect(e).toEqual({ discountCents: 3200, deliveryWaiverCents: 0 });
  });
  it("percent_off rounds and respects the max-discount cap", () => {
    expect(couponEffect("percent_off", { ...none, percent_off: 15 }, 3333, 0).discountCents).toBe(
      500
    );
    const capped = couponEffect(
      "percent_off",
      { ...none, percent_off: 50, max_discount_cents: 1000 },
      8000,
      0
    );
    expect(capped.discountCents).toBe(1000);
  });
  it("labels read naturally", () => {
    expect(couponLabel("free_delivery", none)).toBe("Free delivery");
    expect(couponLabel("amount_off", { ...none, amount_off_cents: 1000 })).toBe("$10.00 off");
    expect(couponLabel("percent_off", { ...none, percent_off: 20, max_discount_cents: 1500 })).toBe(
      "20% off (up to $15.00)"
    );
  });
});

describe("couponStatus", () => {
  const now = Date.parse("2026-09-24T12:00:00Z");
  const base = { revoked_at: null, expires_at: null, order_id: null, holder: null };
  it("is active with no holder", () => {
    expect(couponStatus(base, now)).toBe("active");
  });
  it("is redeemed while a live order holds it", () => {
    const holder = { status: "pending_approval", created_at: "2026-09-24T11:00:00Z" };
    expect(couponStatus({ ...base, order_id: "o1", holder }, now)).toBe("redeemed");
  });
  it("releases on a cancelled or stale-pending holder (mirrors claim_coupon)", () => {
    const cancelled = { status: "cancelled", created_at: "2026-09-24T11:59:00Z" };
    expect(couponStatus({ ...base, order_id: "o1", holder: cancelled }, now)).toBe("active");
    const fresh = { status: "pending", created_at: "2026-09-24T11:30:00Z" };
    expect(couponStatus({ ...base, order_id: "o1", holder: fresh }, now)).toBe("in_checkout");
    const stale = { status: "pending", created_at: "2026-09-24T09:00:00Z" };
    expect(couponStatus({ ...base, order_id: "o1", holder: stale }, now)).toBe("active");
  });
  it("revoked and expired win over active", () => {
    expect(couponStatus({ ...base, revoked_at: "2026-09-01T00:00:00Z" }, now)).toBe("revoked");
    expect(couponStatus({ ...base, expires_at: "2026-09-01T00:00:00Z" }, now)).toBe("expired");
  });
});

describe("code generation", () => {
  it("produces DB-valid, unambiguous codes", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCouponCode("FREEDEL");
      expect(code).toMatch(COUPON_CODE_PATTERN);
      expect(code.slice(8)).not.toMatch(/[01ILO]/);
    }
  });
  it("reserves the loyalty prefix", () => {
    expect(isReservedCouponCode("KYAYZU-ABCD")).toBe(true);
    expect(isReservedCouponCode("GIFT-ABCD")).toBe(false);
  });
});

function row(overrides: Partial<CouponRow> = {}): CouponRow {
  return {
    id: "c1",
    code: "GIFT-ABC234",
    kind: "amount_off",
    amount_off_cents: 1000,
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

function serviceWith(coupon: CouponRow | null, holder: Record<string, unknown> | null = null) {
  const from = vi.fn((table: string) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () =>
          table === "coupons" ? { data: coupon, error: null } : { data: holder, error: null },
      }),
    }),
  }));
  return { from } as unknown as SupabaseClient<Database>;
}

describe("lookupCoupon", () => {
  const opts = { userId: "u1", subtotalCents: 5000 };

  it("returns none for codes outside the app format (falls through to Stripe)", async () => {
    const service = serviceWith(null);
    expect(await lookupCoupon(service, "KYAYZU-ABCD1234", opts)).toEqual({ status: "none" });
    expect(await lookupCoupon(service, "a b", opts)).toEqual({ status: "none" });
  });
  it("normalizes case before lookup", async () => {
    const result = await lookupCoupon(serviceWith(row()), "gift-abc234", opts);
    expect(result.status).toBe("valid");
  });
  it("rejects revoked, expired, other-account and below-minimum coupons", async () => {
    const check = async (c: CouponRow) => (await lookupCoupon(serviceWith(c), c.code, opts)).status;
    expect(await check(row({ revoked_at: "2026-09-02T00:00:00Z" }))).toBe("invalid");
    expect(await check(row({ expires_at: "2020-01-01T00:00:00Z" }))).toBe("invalid");
    expect(await check(row({ assigned_user_id: "someone-else" }))).toBe("invalid");
    expect(await check(row({ min_subtotal_cents: 6000 }))).toBe("invalid");
  });
  it("rejects a coupon held by another customer's live order", async () => {
    const service = serviceWith(row({ order_id: "o1" }), {
      status: "confirmed",
      created_at: new Date().toISOString(),
      user_id: "u2",
    });
    const result = await lookupCoupon(service, "GIFT-ABC234", opts);
    expect(result).toEqual({ status: "invalid", message: "This code has already been used." });
  });
  it("treats the customer's own open checkout as reclaimable", async () => {
    const service = serviceWith(row({ order_id: "o1" }), {
      status: "pending",
      created_at: new Date().toISOString(),
      user_id: "u1",
    });
    expect((await lookupCoupon(service, "GIFT-ABC234", opts)).status).toBe("valid");
  });
});

describe("createCouponsSchema", () => {
  it("requires the value for its kind", () => {
    expect(createCouponsSchema.safeParse({ kind: "amount_off" }).success).toBe(false);
    expect(createCouponsSchema.safeParse({ kind: "percent_off" }).success).toBe(false);
    expect(createCouponsSchema.safeParse({ kind: "free_delivery" }).success).toBe(true);
  });
  it("rejects bulk issuance with a custom code or an assignee", () => {
    const r = createCouponsSchema.safeParse({
      kind: "free_delivery",
      quantity: 5,
      code: "SORRY-1",
    });
    expect(r.success).toBe(false);
  });
  it("normalizes and validates custom codes, refusing the loyalty prefix", () => {
    const ok = createCouponsSchema.safeParse({ kind: "free_delivery", code: " sorry-abc " });
    expect(ok.success && ok.data.code).toBe("SORRY-ABC");
    expect(
      createCouponsSchema.safeParse({ kind: "free_delivery", code: "KYAYZU-X1" }).success
    ).toBe(false);
    expect(
      createCouponsSchema.safeParse({ kind: "free_delivery", code: "no spaces" }).success
    ).toBe(false);
  });
  it("rejects past expiry and email-without-assignee", () => {
    expect(
      createCouponsSchema.safeParse({ kind: "free_delivery", expiresAt: "2020-01-01T00:00:00Z" })
        .success
    ).toBe(false);
    expect(createCouponsSchema.safeParse({ kind: "free_delivery", sendEmail: true }).success).toBe(
      false
    );
  });
});
