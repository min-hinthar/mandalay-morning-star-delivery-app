/**
 * The D7 privacy boundary's path predicate (see ../sw-denylist.ts).
 *
 * The service worker itself cannot run under vitest, so the boundary is
 * enforced through this shared module and pinned here: the NavigationRoute
 * denylist (hard navigations) and the defaultCache matcher wrapper (RSC
 * soft-nav/prefetch fetches) both consume AUTHED_PATH_PREFIXES/isAuthedPath,
 * and a source guard asserts sw.ts actually wires BOTH halves — the RSC half
 * is the one the first cut of D7 missed entirely.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { AUTHED_PATH_PREFIXES, isAuthedPath } from "../sw-denylist";

describe("isAuthedPath", () => {
  it.each([
    "/admin",
    "/admin/orders/abc",
    "/driver",
    "/driver/route/xyz",
    "/driver/onboard", // public but carries one-time invite tokens — deliberately covered
    "/driver/deactivated",
    "/account",
    "/account/settings",
    "/orders",
    "/orders/abc/share", // public token-share page renders a delivery address
    "/checkout",
  ])("matches %s", (path) => {
    expect(isAuthedPath(path)).toBe(true);
  });

  it.each(["/", "/menu", "/menu/mohinga", "/offline", "/api/menu", "/auth/callback", "/about"])(
    "does not match public path %s",
    (path) => {
      expect(isAuthedPath(path)).toBe(false);
    }
  );

  it("does not match authed-looking prefixes in the middle of a path", () => {
    expect(isAuthedPath("/menu/admin-favorites")).toBe(false);
  });

  it("every prefix is anchored to the path start", () => {
    for (const prefix of AUTHED_PATH_PREFIXES) {
      expect(prefix.source.startsWith("^\\/")).toBe(true);
    }
  });
});

describe("sw.ts wires both halves of the boundary (source guard)", () => {
  const sw = readFileSync(join(process.cwd(), "src/app/sw.ts"), "utf8");

  it("hard navigations: the NavigationRoute denylist spreads the shared prefixes", () => {
    expect(sw).toContain("...AUTHED_PATH_PREFIXES");
  });

  it("RSC soft-nav/prefetch: defaultCache matchers are wrapped with isAuthedPath", () => {
    // The half the first cut missed — soft navigations are RSC fetches that
    // never hit the NavigationRoute, landing in pages-rsc(-prefetch).
    expect(sw).toMatch(/args\.sameOrigin && isAuthedPath\(args\.url\.pathname\)/);
  });

  it("pre-fix RSC caches are purged on activation", () => {
    expect(sw).toContain('"pages-rsc"');
    expect(sw).toContain('"pages-rsc-prefetch"');
  });

  it("the navigation cache version is bumped past the pre-fix v4", () => {
    const version = sw.match(/CACHE_VERSION = "v(\d+)"/);
    expect(Number(version?.[1])).toBeGreaterThanOrEqual(5);
  });
});
