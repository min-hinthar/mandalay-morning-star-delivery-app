import { describe, it, expect } from "vitest";
import { formatPrice } from "../format";

describe("formatPrice", () => {
  it("formats cents to dollars", () => {
    expect(formatPrice(1500)).toBe("$15.00");
    expect(formatPrice(0)).toBe("$0.00");
    expect(formatPrice(99)).toBe("$0.99");
  });
});
