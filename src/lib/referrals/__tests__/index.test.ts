import { describe, expect, it } from "vitest";

import {
  generateReferralCode,
  normalizeReferralCode,
  referralShareUrl,
  REFERRAL_CODE_LENGTH,
} from "../index";

describe("referral codes", () => {
  it("generates codes of the right length from the safe alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateReferralCode();
      expect(code).toHaveLength(REFERRAL_CODE_LENGTH);
      // No ambiguous chars (0/O, 1/I/L) and uppercase only.
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
    }
  });

  it("normalizes user/URL input to canonical form", () => {
    expect(normalizeReferralCode("  ab-cd 23 ")).toBe("ABCD23");
    expect(normalizeReferralCode("mmstar!")).toBe("MMSTAR");
  });

  it("builds a share URL with the code", () => {
    expect(referralShareUrl("https://mandalaymorningstar.com", "ABC2345")).toBe(
      "https://mandalaymorningstar.com/?ref=ABC2345"
    );
    // Trailing slash on the base is collapsed.
    expect(referralShareUrl("https://x.com/", "CODE")).toBe("https://x.com/?ref=CODE");
  });
});
