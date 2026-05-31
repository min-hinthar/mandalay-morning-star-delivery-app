import { describe, expect, it } from "vitest";

import {
  LOYALTY_MILESTONE_STEP,
  LOYALTY_REWARD_TTL_DAYS,
  daysUntilExpiry,
  milestoneReached,
  nextMilestone,
  nextRewardCents,
  nextTier,
  ordersToNextMilestone,
  ordersToNextTier,
  progressInCycle,
  rewardCentsForOrders,
  rewardExpiryISO,
  tierForOrders,
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

  describe("milestoneReached", () => {
    it("returns the count only on a milestone boundary", () => {
      expect(milestoneReached(0)).toBeNull();
      expect(milestoneReached(4)).toBeNull();
      expect(milestoneReached(5)).toBe(5);
      expect(milestoneReached(6)).toBeNull();
      expect(milestoneReached(10)).toBe(10);
      expect(milestoneReached(15)).toBe(15);
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

  describe("tierForOrders", () => {
    it("maps order count to the Burmese-gem ladder", () => {
      expect(tierForOrders(0).id).toBe("new");
      expect(tierForOrders(9).id).toBe("new");
      expect(tierForOrders(10).id).toBe("jade");
      expect(tierForOrders(24).id).toBe("jade");
      expect(tierForOrders(25).id).toBe("ruby");
      expect(tierForOrders(49).id).toBe("ruby");
      expect(tierForOrders(50).id).toBe("gold");
      expect(tierForOrders(120).id).toBe("gold");
    });
  });

  describe("nextTier / ordersToNextTier", () => {
    it("points to the next gem, null at the top", () => {
      expect(nextTier(0)?.id).toBe("jade");
      expect(ordersToNextTier(0)).toBe(10);
      expect(nextTier(23)?.id).toBe("ruby");
      expect(ordersToNextTier(23)).toBe(2);
      expect(nextTier(50)).toBeNull();
      expect(ordersToNextTier(50)).toBeNull();
    });
  });

  describe("rewardCentsForOrders (tier-scaled coupons)", () => {
    it("grows the milestone coupon by tier", () => {
      expect(rewardCentsForOrders(5)).toBe(500); // New Friend
      expect(rewardCentsForOrders(10)).toBe(800); // Jade
      expect(rewardCentsForOrders(25)).toBe(1000); // Ruby
      expect(rewardCentsForOrders(50)).toBe(1200); // Gold
    });
  });

  describe("nextRewardCents", () => {
    it("is the coupon size at the upcoming milestone's tier", () => {
      expect(nextRewardCents(3)).toBe(500); // next milestone 5 → New Friend
      expect(nextRewardCents(8)).toBe(800); // next milestone 10 → Jade
      expect(nextRewardCents(23)).toBe(1000); // next milestone 25 → Ruby
      expect(nextRewardCents(48)).toBe(1200); // next milestone 50 → Gold
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
});
