import { describe, expect, it } from "vitest";

import {
  LOYALTY_MILESTONE_STEP,
  milestoneReached,
  nextMilestone,
  ordersToNextMilestone,
  progressInCycle,
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
});
