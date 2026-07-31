import { describe, expect, it } from "vitest";
import { enforceMinimumOrder } from "../validation";

/**
 * Server-side minimum-order gate.
 *
 * `resolveMinimumOrder` is unit-tested separately; this suite covers the thin
 * route wrapper — that a rejection actually reaches the client as a 400 with
 * the `MINIMUM_ORDER_NOT_MET` code, a message naming the real numbers, and the
 * `details` payload the checkout banner renders from. That wrapper is the only
 * thing standing between a direct POST and an under-floor long-distance order,
 * so its response shape is part of the contract, not an implementation detail.
 */

const RULES = {
  minimumOrderCents: 2500,
  extendedMinOrderCents: 10000,
  longDistanceThresholdMiles: 25,
};

async function readError(response: NonNullable<ReturnType<typeof enforceMinimumOrder>>) {
  const body = (await response.json()) as {
    error: { code: string; message: string; details: Record<string, unknown> };
  };
  return { status: response.status, ...body.error };
}

describe("enforceMinimumOrder", () => {
  describe("passes through when the floor is met", () => {
    it("returns null for a local order at the base minimum", () => {
      expect(enforceMinimumOrder(2500, "local", RULES)).toBeNull();
    });

    it("returns null for an extended order at the extended minimum", () => {
      expect(enforceMinimumOrder(10000, "extended", RULES)).toBeNull();
    });

    it("returns null for an out-of-range order that clears the base floor", () => {
      // out-of-range is exempt from the EXTENDED floor only — it's a coverage
      // rejection, and telling someone to add food to an address we don't serve
      // would be nonsense. The base floor still applies.
      expect(enforceMinimumOrder(2500, "out-of-range", RULES)).toBeNull();
    });
  });

  describe("rejects under-floor orders", () => {
    it("rejects the incident shape: a $60 cart on an extended-tier address", async () => {
      const response = enforceMinimumOrder(6000, "extended", RULES);
      expect(response).not.toBeNull();

      const error = await readError(response!);
      expect(error.status).toBe(400);
      expect(error.code).toBe("MINIMUM_ORDER_NOT_MET");
      // Names the real threshold and the exact shortfall, not a generic refusal.
      expect(error.message).toContain("beyond 25 miles");
      expect(error.message).toContain("$100.00");
      expect(error.message).toContain("$40.00");
      expect(error.details).toEqual({
        minimumCents: 10000,
        shortfallCents: 4000,
        subtotalCents: 6000,
        isExtendedMinimum: true,
      });
    });

    it("applies the extended floor to the far tier too", async () => {
      const error = await readError(enforceMinimumOrder(9999, "far", RULES)!);
      expect(error.details).toMatchObject({ minimumCents: 10000, isExtendedMinimum: true });
    });

    it("never charges an out-of-range order the extended floor", async () => {
      const error = await readError(enforceMinimumOrder(1000, "out-of-range", RULES)!);
      expect(error.details).toMatchObject({ minimumCents: 2500, isExtendedMinimum: false });
      expect(error.message).not.toContain("beyond");
    });

    it("applies the base floor — not the extended one — to a local order", async () => {
      const error = await readError(enforceMinimumOrder(1000, "local", RULES)!);
      expect(error.status).toBe(400);
      expect(error.code).toBe("MINIMUM_ORDER_NOT_MET");
      expect(error.message).not.toContain("beyond");
      expect(error.details).toEqual({
        minimumCents: 2500,
        shortfallCents: 1500,
        subtotalCents: 1000,
        isExtendedMinimum: false,
      });
    });
  });

  describe("admin configuration", () => {
    it("disables the extended floor when set to $0", () => {
      const disabled = { ...RULES, extendedMinOrderCents: 0 };
      expect(enforceMinimumOrder(6000, "extended", disabled)).toBeNull();
    });

    it("falls back to the base floor when the extended floor is set below it", async () => {
      const inverted = { ...RULES, extendedMinOrderCents: 1000 };
      // An extended floor under the base floor must never *lower* the bar.
      expect(enforceMinimumOrder(2500, "extended", inverted)).toBeNull();

      const error = await readError(enforceMinimumOrder(2000, "extended", inverted)!);
      expect(error.details).toMatchObject({ minimumCents: 2500, isExtendedMinimum: false });
    });

    it("quotes the configured threshold, not a hardcoded 25", async () => {
      const wider = { ...RULES, longDistanceThresholdMiles: 30 };
      const error = await readError(enforceMinimumOrder(6000, "extended", wider)!);
      expect(error.message).toContain("beyond 30 miles");
    });
  });
});
