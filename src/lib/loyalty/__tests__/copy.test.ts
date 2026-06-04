import { describe, expect, it } from "vitest";

import {
  expiryLabel,
  ordersToReward,
  ordersToTier,
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

  describe("ordersToReward", () => {
    it("singularizes 1 order and pluralizes otherwise", () => {
      expect(ordersToReward(1, "$8").en).toContain("Just 1 more order");
      expect(ordersToReward(3, "$8").en).toContain("3 more orders");
      expect(ordersToReward(1, "$8").my).toContain("၁");
    });
  });

  describe("ordersToTier", () => {
    it("includes count and tier name, bilingual", () => {
      const t = ordersToTier(2, "Padamya (Ruby)");
      expect(t.en).toBe("2 more orders to Padamya (Ruby)");
      expect(ordersToTier(1, "Jade").en).toBe("1 more order to Jade");
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
