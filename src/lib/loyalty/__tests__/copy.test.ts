import { describe, expect, it } from "vitest";

import {
  expiringDayLabel,
  expiryLabel,
  ordersToReward,
  spendToTier,
  unlockedAnnounce,
  WALLET_EMPTY,
  WALLET_USE_HINT,
} from "../copy";

describe("loyalty bilingual copy", () => {
  describe("expiryLabel", () => {
    it("handles today / tomorrow / future and is bilingual", () => {
      expect(expiryLabel(0).en).toBe("Expires today");
      expect(expiryLabel(1).en).toBe("Expires tomorrow");
      expect(expiryLabel(5).en).toBe("Expires in 5 days");
      // negative clamps to "today"
      expect(expiryLabel(-3).en).toBe("Expires today");
      for (const d of [0, 1, 7]) {
        expect(expiryLabel(d).my.length).toBeGreaterThan(0);
        expect(expiryLabel(d).my).not.toBe(expiryLabel(d).en);
      }
    });
  });

  describe("expiringDayLabel", () => {
    it("gives the bare label and treats null / 0 / past-due as today", () => {
      expect(expiringDayLabel(5)).toBe("in 5 days");
      expect(expiringDayLabel(1)).toBe("tomorrow");
      expect(expiringDayLabel(0)).toBe("today");
      expect(expiringDayLabel(-2)).toBe("today");
      expect(expiringDayLabel(null)).toBe("today");
      expect(expiringDayLabel(undefined)).toBe("today");
    });
  });

  describe("ordersToReward", () => {
    it("singularizes 1 order and pluralizes otherwise", () => {
      expect(ordersToReward(1, "$8").en).toContain("Just 1 more order");
      expect(ordersToReward(3, "$8").en).toContain("3 more orders");
      expect(ordersToReward(1, "$8").my).toContain("၁");
    });
  });

  describe("spendToTier", () => {
    it("includes the spend amount and tier name, bilingual", () => {
      const t = spendToTier("$120.00", "Padamya (Ruby)");
      expect(t.en).toBe("$120.00 more to reach Padamya (Ruby)");
      expect(t.my).toContain("$120.00");
      expect(t.my.length).toBeGreaterThan(0);
    });
  });

  describe("unlockedAnnounce", () => {
    it("embeds the amount in both languages", () => {
      expect(unlockedAnnounce("$10").en).toContain("$10");
      expect(unlockedAnnounce("$10").my).toContain("$10");
    });
  });

  it("static strings carry both languages", () => {
    for (const t of [WALLET_EMPTY, WALLET_USE_HINT]) {
      expect(t.en.length).toBeGreaterThan(0);
      expect(t.my.length).toBeGreaterThan(0);
    }
  });
});
