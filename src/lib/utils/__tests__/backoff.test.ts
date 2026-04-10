import { describe, it, expect } from "vitest";
import { getBackoffDelay, RECONNECT_BASE_MS, RECONNECT_MAX_MS } from "../backoff";

describe("getBackoffDelay", () => {
  describe("default curve (base=1000, max=30000)", () => {
    it.each([
      [0, 1000],
      [1, 2000],
      [2, 4000],
      [3, 8000],
      [4, 16000],
      [5, 30000], // first clamp to cap (would be 32000)
      [6, 30000], // stays capped
      [7, 30000], // stays capped
      [100, 30000], // extreme clamp
    ])("attempt %i → %ims", (attempt, expected) => {
      expect(getBackoffDelay(attempt)).toBe(expected);
    });
  });

  describe("custom base and max", () => {
    it("getBackoffDelay(0, 500, 5000) returns 500 (custom base)", () => {
      expect(getBackoffDelay(0, 500, 5000)).toBe(500);
    });

    it("getBackoffDelay(1, 500, 5000) returns 1000 (custom base * 2)", () => {
      expect(getBackoffDelay(1, 500, 5000)).toBe(1000);
    });

    it("getBackoffDelay(10, 500, 5000) returns 5000 (custom cap)", () => {
      expect(getBackoffDelay(10, 500, 5000)).toBe(5000);
    });

    it("getBackoffDelay(3, 100, 10000) returns 800 (800 under cap)", () => {
      expect(getBackoffDelay(3, 100, 10000)).toBe(800);
    });
  });

  describe("exported constants", () => {
    it("RECONNECT_BASE_MS equals 1000", () => {
      expect(RECONNECT_BASE_MS).toBe(1000);
    });

    it("RECONNECT_MAX_MS equals 30000", () => {
      expect(RECONNECT_MAX_MS).toBe(30_000);
    });
  });
});
