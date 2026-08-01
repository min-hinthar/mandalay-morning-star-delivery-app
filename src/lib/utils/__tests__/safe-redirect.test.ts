/**
 * isSafeRedirect — post-auth redirect-target guard.
 *
 * The four inlined copies this replaces accepted `/\evil.com` and
 * `/<TAB>/evil.com`, both of which the WHATWG URL parser resolves to an
 * off-site origin (backslash aliases to "/" for special schemes; tab/LF/CR are
 * stripped before parsing). Since the middleware now attaches `?next=` to every
 * unauthenticated /checkout · /cart · /orders · /account hit, that value is on
 * the standard customer path and a `?next=` lure is plausible.
 */

import { describe, it, expect } from "vitest";
import { isSafeRedirect } from "../safe-redirect";

describe("isSafeRedirect", () => {
  it("accepts ordinary same-origin paths", () => {
    for (const p of [
      "/",
      "/checkout",
      "/cart",
      "/orders/abc-123",
      "/orders/abc/share",
      "/account?tab=rewards",
      "/checkout?session_id=cs_test_123",
      "/menu#specials",
    ]) {
      expect(isSafeRedirect(p), p).toBe(true);
    }
  });

  it("rejects the obvious off-site forms", () => {
    for (const p of [
      "//evil.com",
      "https://evil.com",
      "http://evil.com",
      "javascript://evil.com",
      "evil.com",
      "",
    ]) {
      expect(isSafeRedirect(p), p).toBe(false);
    }
  });

  it("rejects backslash and stripped-whitespace bypasses (the real bug)", () => {
    // Each of these resolves to https://evil.com/ via new URL(path, origin).
    for (const p of [
      "/\\evil.com",
      "/\t/evil.com",
      "/\n/evil.com",
      "/\r/evil.com",
      "/\\\\evil.com",
    ]) {
      expect(isSafeRedirect(p), JSON.stringify(p)).toBe(false);
    }
  });

  it("agrees with actual URL resolution for every case it accepts", () => {
    // Property check: anything accepted MUST resolve back to the same origin.
    const origin = "https://mandalaymorningstar.com";
    const candidates = [
      "/",
      "/checkout",
      "/orders/1/share",
      "//evil.com",
      "/\\evil.com",
      "/\t/evil.com",
      "https://evil.com",
      "/account?tab=x#y",
    ];
    for (const p of candidates) {
      if (!isSafeRedirect(p)) continue;
      expect(new URL(p, origin).origin, JSON.stringify(p)).toBe(origin);
    }
  });
});
