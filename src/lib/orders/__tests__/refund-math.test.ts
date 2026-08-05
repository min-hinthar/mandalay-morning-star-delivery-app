/**
 * Tests for the TS mirror of `apply_item_refunds` (audit D4/D5), plus a
 * source guard pinning the migration SQL to the same formulas.
 *
 * The SQL cannot run here, so correctness rests on two legs:
 *  1. these vectors pin the TS mirror's behavior (incl. rounding boundaries
 *     where SQL round() and Math.round could diverge), and
 *  2. the source guard below asserts the migration contains the mirrored
 *     expressions — so neither side can drift without a red test.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  clampRefundToRemaining,
  computeItemRefund,
  itemGrossRefundCents,
  orderDiscountRatio,
  remainingShippingRefundCents,
} from "../refund-math";

const NO_DISCOUNT = { subtotalCents: 10000, discountCents: 0, taxCents: 1050 };

describe("itemGrossRefundCents", () => {
  it("is the full line total when refunding every unit", () => {
    expect(itemGrossRefundCents(2400, 3, 3)).toBe(2400);
  });

  it("rounds the per-unit share (SQL: round(line/qty * n))", () => {
    // 1000/3 = 333.33… ; 1 unit → 333, 2 units → 667 (not 666)
    expect(itemGrossRefundCents(1000, 3, 1)).toBe(333);
    expect(itemGrossRefundCents(1000, 3, 2)).toBe(667);
  });

  it("pins the .5 boundary where SQL round-half-away and Math.round agree (positive)", () => {
    // 25/2 * 1 = 12.5 → 13 in both SQL round() and Math.round
    expect(itemGrossRefundCents(25, 2, 1)).toBe(13);
  });

  it("returns 0 for a zero-quantity line instead of dividing by zero", () => {
    expect(itemGrossRefundCents(1000, 0, 1)).toBe(0);
  });
});

describe("orderDiscountRatio", () => {
  it("is 0 with no discount", () => {
    expect(orderDiscountRatio(NO_DISCOUNT)).toBe(0);
  });

  it("is discount/subtotal", () => {
    expect(orderDiscountRatio({ subtotalCents: 10000, discountCents: 1000, taxCents: 0 })).toBe(
      0.1
    );
  });

  it("clamps at 1 when the discount exceeds the subtotal", () => {
    expect(orderDiscountRatio({ subtotalCents: 500, discountCents: 800, taxCents: 0 })).toBe(1);
  });

  it("is 0 (not NaN) when the subtotal is 0", () => {
    expect(orderDiscountRatio({ subtotalCents: 0, discountCents: 500, taxCents: 0 })).toBe(0);
  });
});

describe("computeItemRefund", () => {
  it("undiscounted order: refunds the gross plus its tax share", () => {
    // $20 line on a $100 order taxed $10.50 → tax share $2.10
    const r = computeItemRefund(2000, NO_DISCOUNT);
    expect(r).toEqual({ grossCents: 2000, goodsCents: 2000, taxCents: 210, totalCents: 2210 });
  });

  it("discounted order: goods scale down, tax share does NOT (tax was charged on the full subtotal)", () => {
    // $10 welcome discount on a $100 order → ratio 0.1
    // $20 line: goods 2000*0.9=1800, tax 2000*1050/10000=210
    const ctx = { subtotalCents: 10000, discountCents: 1000, taxCents: 1050 };
    const r = computeItemRefund(2000, ctx);
    expect(r).toEqual({ grossCents: 2000, goodsCents: 1800, taxCents: 210, totalCents: 2010 });
  });

  it("the D4 incident shape: refunding the whole order returns total minus tip, not more", () => {
    // subtotal $95, discount $10, tax 10.5% of $95 = $9.98 (998), delivery $15, tip $5
    // total = 9500 + 1500 + 998 + 500 - 1000 = 11498
    const ctx = { subtotalCents: 9500, discountCents: 1000, taxCents: 998 };
    const items = [
      { line: 4500, qty: 1 },
      { line: 3000, qty: 2 },
      { line: 2000, qty: 1 },
    ];
    const itemsRefund = items.reduce(
      (sum, i) =>
        sum + computeItemRefund(itemGrossRefundCents(i.line, i.qty, i.qty), ctx).totalCents,
      0
    );
    const withShipping = itemsRefund + remainingShippingRefundCents(1500, 0);
    const totalCents = 9500 + 1500 + 998 + 500 - 1000;
    // Everything but the tip comes back, within per-line rounding (≤1¢/line).
    expect(Math.abs(withShipping - (totalCents - 500))).toBeLessThanOrEqual(items.length);
    // And the OLD behavior (raw line totals) would have over-refunded goods:
    const rawRefund = items.reduce((s, i) => s + i.line, 0) + 1500;
    expect(rawRefund).toBeGreaterThan(itemsRefund - 998 + 1500); // gross > net-of-discount goods
  });

  it("100%-discounted goods still refund their tax share", () => {
    const ctx = { subtotalCents: 2000, discountCents: 2000, taxCents: 210 };
    const r = computeItemRefund(1000, ctx);
    expect(r.goodsCents).toBe(0);
    expect(r.taxCents).toBe(105);
    expect(r.totalCents).toBe(105);
  });

  it("zero-subtotal order refunds nothing per line (no NaN)", () => {
    const r = computeItemRefund(0, { subtotalCents: 0, discountCents: 0, taxCents: 0 });
    expect(r.totalCents).toBe(0);
  });

  it("pins a rounding .5 boundary in the tax share", () => {
    // gross 50, tax 105, subtotal 1000 → 50*105/1000 = 5.25 → 5
    // gross 50, tax 110, subtotal 1000 → 5.5 → 6 (half away from zero == Math.round here)
    expect(
      computeItemRefund(50, { subtotalCents: 1000, discountCents: 0, taxCents: 105 }).taxCents
    ).toBe(5);
    expect(
      computeItemRefund(50, { subtotalCents: 1000, discountCents: 0, taxCents: 110 }).taxCents
    ).toBe(6);
  });
});

describe("clampRefundToRemaining (cumulative cap mirror)", () => {
  it("passes a refund that fits the remaining balance through unchanged", () => {
    expect(clampRefundToRemaining(2000, 5000, 3)).toEqual({ totalCents: 2000, outcome: "ok" });
  });

  it("the reviewer's repro: per-line rounding overshoot clamps to what the customer paid", () => {
    // 2 × $1.00 items, 1¢ discount, 21¢ tax → total paid 220¢.
    const ctx = { subtotalCents: 200, discountCents: 1, taxCents: 21 };
    const perLine = computeItemRefund(itemGrossRefundCents(100, 1, 1), ctx).totalCents;
    expect(perLine).toBe(111); // round(99.5)=100 goods + round(10.5)=11 tax
    const requested = perLine * 2; // 222 > 220 paid
    const capped = clampRefundToRemaining(requested, 220, 2);
    expect(capped).toEqual({ totalCents: 220, outcome: "clamped" });
  });

  it("clamps only within the ≤1¢/line rounding bound", () => {
    // 3¢ over with only 2 lines cannot be rounding — genuine over-refund.
    expect(clampRefundToRemaining(223, 220, 2).outcome).toBe("exceeds");
  });

  it("never clamps when nothing remains refundable (fully refunded order)", () => {
    expect(clampRefundToRemaining(1, 0, 1).outcome).toBe("exceeds");
  });
});

describe("remainingShippingRefundCents (D5 once-per-order guard)", () => {
  it("refunds the full fee the first time", () => {
    expect(remainingShippingRefundCents(1500, 0)).toBe(1500);
  });

  it("refunds 0 once the fee has been refunded", () => {
    expect(remainingShippingRefundCents(1500, 1500)).toBe(0);
  });

  it("refunds only the remainder after a partial legacy refund", () => {
    expect(remainingShippingRefundCents(1500, 600)).toBe(900);
  });

  it("never goes negative when prior refunds exceed the fee", () => {
    expect(remainingShippingRefundCents(1500, 2000)).toBe(0);
  });
});

describe("the migration SQL mirrors this module (source guard)", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20260805200000_discount_proportional_refunds.sql"),
    "utf8"
  );

  it("scales goods by the discount ratio", () => {
    expect(sql).toContain("LEAST(1, v_order.discount_cents::numeric / v_order.subtotal_cents)");
    expect(sql).toContain("round(v_gross * (1 - v_discount_ratio))");
  });

  it("adds the line's proportional tax share", () => {
    expect(sql).toContain("round(v_gross::numeric * v_order.tax_cents / v_order.subtotal_cents)");
  });

  it("guards the shipping refund to once per order", () => {
    expect(sql).toContain("GREATEST(0, v_order.delivery_fee_cents - v_prior_shipping)");
  });

  it("caps cumulative refunds at the remaining balance, reusing the route-matched phrase", () => {
    expect(sql).toContain("v_remaining := v_order.total_cents - v_prior_total");
    expect(sql).toContain("v_overshoot := v_total_refund - v_remaining");
    // The refund route's card-refund recovery path matches on this phrase —
    // if it changes here, the route's error handling silently degrades.
    expect(sql).toContain("exceeds order total");
  });

  it("clamps the ≤1¢/line rounding overshoot instead of rejecting it", () => {
    // The bound: overshoot within jsonb_array_length(p_items) cents, and only
    // while something remains refundable — mirrored by clampRefundToRemaining.
    expect(sql).toContain("v_overshoot <= jsonb_array_length(p_items)");
    expect(sql).toContain("v_remaining > 0 AND");
    expect(sql).toContain("v_total_refund := v_remaining");
    // The shave keeps the itemization summing to the clamped total.
    expect(sql).toMatch(/jsonb_set\(\s*v_results/);
  });

  it("sums prior refunds from the audit log (the same rows the Stripe delta reconciles)", () => {
    expect(sql).toMatch(/SUM\(\(new_value->>'totalRefundCents'\)::int\)/);
    expect(sql).toMatch(/SUM\(\(new_value->>'shippingRefundCents'\)::int\)/);
    expect(sql).toContain("action = 'refund'");
  });

  it("keeps the signature drift-neutral (no arg or return changes)", () => {
    expect(sql).toContain(
      "public.apply_item_refunds(p_order_id uuid, p_items jsonb, p_refund_shipping boolean DEFAULT false)"
    );
    expect(sql).toContain("RETURNS jsonb");
  });

  it("is the LATEST apply_item_refunds migration (a newer one must move these guards forward)", () => {
    // If a later migration redefines the function without the D4/D5 guards,
    // this file's assertions would still pass while prod regressed. Pin the
    // ordering: no migration after this one may touch apply_item_refunds
    // without updating this guard.
    const dir = join(process.cwd(), "supabase/migrations");
    const later = readdirSync(dir)
      .filter((f: string) => f > "20260805200000_discount_proportional_refunds.sql")
      .filter((f: string) => readFileSync(join(dir, f), "utf8").includes("apply_item_refunds"));
    expect(later).toEqual([]);
  });
});
