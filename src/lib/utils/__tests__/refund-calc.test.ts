import { describe, expect, it } from "vitest";

/**
 * Pure refund calculation functions matching the logic in
 * src/app/api/admin/orders/[id]/refund/route.ts
 *
 * These replicate the route handler's inline logic for isolated unit testing
 * of rounding edge cases and ceiling validation.
 */

/**
 * Calculate refund amount for a partial quantity refund.
 * Mirrors: unitPrice = line_total_cents / quantity; Math.round(unitPrice * refundQuantity)
 */
function calculateUnitRefund(
  lineTotalCents: number,
  totalUnits: number,
  refundUnits: number
): number {
  const unitPrice = lineTotalCents / totalUnits;
  return Math.round(unitPrice * refundUnits);
}

/**
 * Validate that a refund does not exceed the order total.
 * Mirrors: if (totalRefundCents > orderTotal) return 400
 */
function isRefundValid(
  refundAmountCents: number,
  orderTotalCents: number,
  previousRefundsCents: number = 0
): boolean {
  const totalRefund = previousRefundsCents + refundAmountCents;
  return totalRefund <= orderTotalCents && refundAmountCents > 0;
}

describe("refund calculation (TST-05)", () => {
  describe("rounding edge cases", () => {
    it("handles odd quantity division (3 units, $10 total) — refund 1 unit", () => {
      // 1000 cents / 3 = 333.333... cents per unit
      // Math.round(333.333...) = 333 cents
      const result = calculateUnitRefund(1000, 3, 1);
      expect(result).toBe(333);
    });

    it("handles odd quantity division (3 units, $10 total) — refund 2 units", () => {
      // 1000 / 3 * 2 = 666.666... → Math.round = 667
      const result = calculateUnitRefund(1000, 3, 2);
      expect(result).toBe(667);
    });

    it("handles even division (2 units, $10 total) — refund 1 unit", () => {
      // 1000 / 2 = 500.0 → Math.round = 500
      const result = calculateUnitRefund(1000, 2, 1);
      expect(result).toBe(500);
    });

    it("handles single unit refund from large order (10 units, $33.33 total)", () => {
      // 3333 / 10 = 333.3 → Math.round(333.3) = 333
      const result = calculateUnitRefund(3333, 10, 1);
      expect(result).toBe(333);
    });

    it("full quantity refund returns exact total (no rounding drift)", () => {
      // Refunding all units should equal the total
      const result = calculateUnitRefund(1000, 3, 3);
      expect(result).toBe(1000);
    });

    it("rounding can cause 1+2 unit refunds to not sum to total (known behavior)", () => {
      // 1 unit refund = 333, 2 unit refund = 667 → 333 + 667 = 1000 (exact in this case)
      // But: 1 unit = 333, another 1 unit = 333 → 333 + 333 = 666, not 667
      const firstUnit = calculateUnitRefund(1000, 3, 1);
      const secondUnit = calculateUnitRefund(1000, 3, 1);
      // Two separate 1-unit refunds = 666, but 2-unit refund = 667
      expect(firstUnit + secondUnit).toBe(666);
      expect(calculateUnitRefund(1000, 3, 2)).toBe(667);
    });
  });

  describe("ceiling validation", () => {
    it("accepts refund equal to order total", () => {
      expect(isRefundValid(1000, 1000)).toBe(true);
    });

    it("rejects refund exceeding order total by 1 cent", () => {
      expect(isRefundValid(1001, 1000)).toBe(false);
    });

    it("accepts first partial refund", () => {
      expect(isRefundValid(500, 1000, 0)).toBe(true);
    });

    it("rejects second partial refund that would exceed total", () => {
      // First refund was 600, second is 500 — total 1100 > 1000
      expect(isRefundValid(500, 1000, 600)).toBe(false);
    });

    it("accepts two partial refunds summing to total", () => {
      // First refund was 500, second is 500 — total 1000 = 1000
      expect(isRefundValid(500, 1000, 500)).toBe(true);
    });

    it("rejects zero refund amount", () => {
      expect(isRefundValid(0, 1000)).toBe(false);
    });

    it("accepts minimum 1-cent refund", () => {
      expect(isRefundValid(1, 1000)).toBe(true);
    });

    it("accepts 1-cent refund from large order", () => {
      expect(isRefundValid(1, 999999)).toBe(true);
    });

    it("rejects negative refund amount", () => {
      // Negative amount: totalRefund = -1, which is <= 1000 but amount is not > 0
      expect(isRefundValid(-1, 1000)).toBe(false);
    });
  });
});
