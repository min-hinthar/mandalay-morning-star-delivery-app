import { describe, expect, it } from "vitest";

import {
  LOYALTY_MILESTONE_STEP,
  LOYALTY_REWARD_TTL_DAYS,
  daysUntilExpiry,
  milestonesReached,
  nextMilestone,
  nextRewardCents,
  nextTier,
  ordersToNextMilestone,
  spendToNextTierCents,
  orderSpendCents,
  progressInCycle,
  rewardCentsForSpend,
  rewardExpiryISO,
  tierForSpend,
  hasEarlyAccess,
  tierPerks,
  TIER_PERKS,
  LOYALTY_TIERS,
} from "..";

describe("loyalty helpers", () => {
  it("step is 5", () => {
    expect(LOYALTY_MILESTONE_STEP).toBe(5);
  });

  describe("nextMilestone", () => {
    it("returns the next multiple of the step strictly above stars", () => {
      expect(nextMilestone(0)).toBe(5);
      expect(nextMilestone(3)).toBe(5);
      expect(nextMilestone(5)).toBe(10);
      expect(nextMilestone(9)).toBe(10);
      expect(nextMilestone(12)).toBe(15);
    });
  });

  describe("ordersToNextMilestone", () => {
    it("counts orders remaining to the next reward", () => {
      expect(ordersToNextMilestone(0)).toBe(5);
      expect(ordersToNextMilestone(3)).toBe(2);
      expect(ordersToNextMilestone(4)).toBe(1);
      expect(ordersToNextMilestone(5)).toBe(5);
      expect(ordersToNextMilestone(7)).toBe(3);
    });
  });

  describe("milestonesReached (back-fill)", () => {
    it("returns every milestone at or below the order count", () => {
      expect(milestonesReached(0)).toEqual([]);
      expect(milestonesReached(4)).toEqual([]);
      expect(milestonesReached(5)).toEqual([5]);
      expect(milestonesReached(6)).toEqual([5]); // count jumped 4→6, still issues 5
      expect(milestonesReached(12)).toEqual([5, 10]);
      expect(milestonesReached(15)).toEqual([5, 10, 15]);
    });
  });

  describe("progressInCycle", () => {
    it("is the position within the current 5-order cycle", () => {
      expect(progressInCycle(0)).toBe(0);
      expect(progressInCycle(2)).toBe(2);
      expect(progressInCycle(5)).toBe(0);
      expect(progressInCycle(7)).toBe(2);
    });
  });

  describe("orderSpendCents", () => {
    it("is subtotal minus discount, floored at 0", () => {
      expect(orderSpendCents(5000, 0)).toBe(5000);
      expect(orderSpendCents(5000, 800)).toBe(4200);
      expect(orderSpendCents(800, 1000)).toBe(0); // discount > subtotal → 0
    });
  });

  describe("tierForSpend", () => {
    it("maps lifetime net spend to the Burmese-gem ladder", () => {
      expect(tierForSpend(0).id).toBe("new");
      expect(tierForSpend(24999).id).toBe("new");
      expect(tierForSpend(25000).id).toBe("jade"); // $250
      expect(tierForSpend(74999).id).toBe("jade");
      expect(tierForSpend(75000).id).toBe("ruby"); // $750
      expect(tierForSpend(149999).id).toBe("ruby");
      expect(tierForSpend(150000).id).toBe("gold"); // $1500
      expect(tierForSpend(500000).id).toBe("gold");
    });
  });

  describe("nextTier / spendToNextTierCents", () => {
    it("points to the next gem by spend, null at the top", () => {
      expect(nextTier(0)?.id).toBe("jade");
      expect(spendToNextTierCents(0)).toBe(25000);
      expect(nextTier(70000)?.id).toBe("ruby");
      expect(spendToNextTierCents(70000)).toBe(5000);
      expect(nextTier(150000)).toBeNull();
      expect(spendToNextTierCents(150000)).toBeNull();
    });
  });

  describe("rewardCentsForSpend (tier-scaled coupons)", () => {
    it("grows the milestone coupon by spend tier", () => {
      expect(rewardCentsForSpend(0)).toBe(500); // New Friend
      expect(rewardCentsForSpend(25000)).toBe(800); // Jade
      expect(rewardCentsForSpend(75000)).toBe(1000); // Ruby
      expect(rewardCentsForSpend(150000)).toBe(1200); // Gold
    });
  });

  describe("nextRewardCents", () => {
    it("is the coupon size at the customer's current spend tier", () => {
      expect(nextRewardCents(0)).toBe(500);
      expect(nextRewardCents(30000)).toBe(800);
      expect(nextRewardCents(80000)).toBe(1000);
      expect(nextRewardCents(200000)).toBe(1200);
    });
  });

  describe("rewardExpiryISO", () => {
    it("adds the TTL window to the issue date", () => {
      const from = new Date("2026-01-01T00:00:00.000Z");
      const expiry = new Date(rewardExpiryISO(from));
      const days = Math.round((expiry.getTime() - from.getTime()) / 86_400_000);
      expect(days).toBe(LOYALTY_REWARD_TTL_DAYS);
    });
  });

  describe("daysUntilExpiry", () => {
    const now = new Date("2026-01-10T12:00:00.000Z");
    it("rounds up whole days remaining", () => {
      expect(daysUntilExpiry("2026-01-17T12:00:00.000Z", now)).toBe(7);
      expect(daysUntilExpiry("2026-01-11T00:00:00.000Z", now)).toBe(1);
    });
    it("clamps past-due to 0 and passes through null", () => {
      expect(daysUntilExpiry("2026-01-09T12:00:00.000Z", now)).toBe(0);
      expect(daysUntilExpiry(null, now)).toBeNull();
    });
  });

  describe("hasEarlyAccess", () => {
    it("is true only at Ruby tier and above (by spend)", () => {
      expect(hasEarlyAccess(0)).toBe(false); // New Friend
      expect(hasEarlyAccess(24999)).toBe(false);
      expect(hasEarlyAccess(25000)).toBe(false); // Jade
      expect(hasEarlyAccess(74999)).toBe(false);
      expect(hasEarlyAccess(75000)).toBe(true); // Ruby
      expect(hasEarlyAccess(149999)).toBe(true);
      expect(hasEarlyAccess(150000)).toBe(true); // Gold
      expect(hasEarlyAccess(500000)).toBe(true);
    });
  });

  describe("tierPerks / TIER_PERKS", () => {
    it("returns the perks for the tier at a given lifetime spend", () => {
      expect(tierPerks(0)).toBe(TIER_PERKS.new);
      expect(tierPerks(25000)).toBe(TIER_PERKS.jade);
      expect(tierPerks(75000)).toBe(TIER_PERKS.ruby);
      expect(tierPerks(150000)).toBe(TIER_PERKS.gold);
    });

    it("defines bilingual perks for every tier", () => {
      for (const tier of LOYALTY_TIERS) {
        const perks = TIER_PERKS[tier.id];
        expect(perks.length).toBeGreaterThan(0);
        for (const perk of perks) {
          expect(perk.en.length).toBeGreaterThan(0);
          expect(perk.my.length).toBeGreaterThan(0);
          expect(["star", "gift", "sparkles", "crown", "clock"]).toContain(perk.icon);
        }
      }
    });

    it("only Ruby+ perks mention early access", () => {
      const mentionsEarly = (id: keyof typeof TIER_PERKS) =>
        TIER_PERKS[id].some((p) => /early access/i.test(p.en));
      expect(mentionsEarly("new")).toBe(false);
      expect(mentionsEarly("jade")).toBe(false);
      expect(mentionsEarly("ruby")).toBe(true);
    });
  });
});
