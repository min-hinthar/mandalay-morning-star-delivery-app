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

import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  AUTHED_PATH_PREFIXES,
  isAuthedPath,
  isUncacheablePath,
  isUncacheableRequest,
  isUncacheableSupabaseRequest,
} from "../sw-denylist";

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

  it("does not match sibling routes sharing a stem (boundary-anchored)", () => {
    expect(isAuthedPath("/orders-history")).toBe(false);
    expect(isAuthedPath("/accounts")).toBe(false);
    expect(isAuthedPath("/checkout-faq")).toBe(false);
  });

  it("every prefix is anchored to the path start", () => {
    for (const prefix of AUTHED_PATH_PREFIXES) {
      expect(prefix.source.startsWith("^\\/")).toBe(true);
    }
  });
});

describe("isUncacheablePath (defaultCache wrapper predicate)", () => {
  it.each(["/api/account/profile", "/api/orders", "/api/orders/abc", "/api/account/settings"])(
    "refuses authed API JSON %s (the defaultCache 'apis' handler would cache it)",
    (path) => {
      expect(isUncacheablePath(path)).toBe(true);
    }
  );

  it("covers /api/menu too — its offline caching comes from the EARLIER menu-api-cache handler", () => {
    expect(isUncacheablePath("/api/menu")).toBe(true);
  });

  it("covers every authed page path isAuthedPath covers", () => {
    expect(isUncacheablePath("/account")).toBe(true);
    expect(isUncacheablePath("/admin/orders")).toBe(true);
  });

  it("leaves public pages cacheable", () => {
    expect(isUncacheablePath("/menu")).toBe(false);
    expect(isUncacheablePath("/")).toBe(false);
  });
});

describe("sw.ts wires both halves of the boundary (source guard)", () => {
  const sw = readFileSync(join(process.cwd(), "src/app/sw.ts"), "utf8");

  it("hard navigations: the NavigationRoute denylist spreads the shared prefixes", () => {
    expect(sw).toContain("...AUTHED_PATH_PREFIXES");
  });

  it("RSC soft-nav/prefetch + API JSON + supabase JSON: defaultCache matchers are wrapped", () => {
    // The halves the first cuts missed — soft navigations are RSC fetches
    // that never hit the NavigationRoute (pages-rsc), the 'apis' handler
    // caches all same-origin GET /api/* JSON, and the 'cross-origin' handler
    // would cache browser supabase-js PostgREST/auth JSON.
    expect(sw).toMatch(/isUncacheableRequest\(args\.sameOrigin, args\.url\)/);
  });

  it("pre-fix RSC and API caches are purged on activation", () => {
    expect(sw).toContain('"pages-rsc"');
    expect(sw).toContain('"pages-rsc-prefetch"');
    expect(sw).toContain('"apis"');
  });

  it("the external-images handler matches supabase hosts by STORAGE PATH, not bare hostname", () => {
    // A hostname-wide supabase match cached PostgREST/auth JSON
    // (/rest/v1/addresses street+city, /auth/v1/user email+phone) into the
    // 30-day external-images cache. Only /storage/ (dish photos) may match.
    expect(sw).toMatch(/supabase\.co.*\n?.*\/storage\//);
    expect(sw).not.toMatch(/url\.hostname\.includes\("supabase\.co"\)/);
  });

  it("the public menu's own cache handler is registered BEFORE the defaultCache spread", () => {
    // isUncacheablePath blankets /api/ for the defaultCache entries; the
    // menu keeps offline support only because its explicit handler wins
    // first-match. If this ordering flips, the menu loses offline silently.
    const menuHandler = sw.indexOf("menu-api-cache");
    const spread = sw.indexOf("...defaultCache");
    expect(menuHandler).toBeGreaterThan(-1);
    expect(spread).toBeGreaterThan(-1);
    expect(menuHandler).toBeLessThan(spread);
  });

  it("the navigation cache version is bumped past the pre-fix v4", () => {
    const version = sw.match(/CACHE_VERSION = "v(\d+)"/);
    expect(Number(version?.[1])).toBeGreaterThanOrEqual(5);
  });
});

describe("isUncacheableSupabaseRequest / isUncacheableRequest (cross-origin half)", () => {
  it.each([
    ["abc.supabase.co", "/rest/v1/addresses"],
    ["abc.supabase.co", "/rest/v1/order_items"],
    ["abc.supabase.co", "/auth/v1/user"],
    ["abc.supabase.com", "/functions/v1/anything"],
    // signed/authenticated storage: private delivery-proof + feedback
    // photos (1h signatures) must not outlive their signature in a cache
    ["abc.supabase.co", "/storage/v1/object/sign/delivery-photos/stop.jpg"],
    ["abc.supabase.co", "/storage/v1/object/authenticated/feedback/x.jpg"],
  ])("refuses supabase API/auth/signed-storage %s%s", (host, path) => {
    expect(isUncacheableSupabaseRequest(host, path)).toBe(true);
  });

  it.each([
    ["abc.supabase.co", "/storage/v1/object/public/menu/mohinga.webp"],
    ["drive.google.com", "/uc"],
    ["lh3.googleusercontent.com", "/d/abc"],
    ["evil-supabase.co", "/rest/v1/x"], // not a .supabase.co subdomain
  ])("leaves %s%s cacheable", (host, path) => {
    expect(isUncacheableSupabaseRequest(host, path)).toBe(false);
  });

  it("isUncacheableRequest routes same-origin to the path predicate, cross-origin to supabase", () => {
    expect(isUncacheableRequest(true, new URL("https://self.test/account"))).toBe(true);
    expect(isUncacheableRequest(true, new URL("https://self.test/menu"))).toBe(false);
    expect(isUncacheableRequest(false, new URL("https://abc.supabase.co/rest/v1/addresses"))).toBe(
      true
    );
    expect(
      isUncacheableRequest(false, new URL("https://abc.supabase.co/storage/v1/object/public/x"))
    ).toBe(false);
    expect(isUncacheableRequest(false, new URL("https://fonts.gstatic.com/font.woff2"))).toBe(
      false
    );
  });
});

describe("purge list + wrapper assumptions hold against the INSTALLED serwist", () => {
  // sw.ts hardcodes serwist's cache names in the activation purge and relies
  // on the pages/apis/cross-origin entries having FUNCTION matchers (regex
  // matchers escape the wrapper). Neither assumption is visible in sw.ts
  // source — pin both against the installed package so a serwist bump that
  // renames a cache or changes a matcher shape goes red instead of silently
  // no-oping the PII purge.
  const PURGED = ["pages-rsc", "pages-rsc-prefetch", "pages", "apis", "others", "cross-origin"];

  it("sw.ts purges exactly this pinned name set", () => {
    const sw = readFileSync(join(process.cwd(), "src/app/sw.ts"), "utf8");
    const arr = sw.match(/serwistPageCaches = \[([^\]]+)\]/)?.[1] ?? "";
    const names = [...arr.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(names.sort()).toEqual([...PURGED].sort());
  });

  it("every purged name is a real cache in the production defaultCache, owned by a function matcher", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { defaultCache } = await import("@serwist/next/worker");
    vi.unstubAllEnvs();
    // Precondition: under NODE_ENV=production the defaultCache is the full
    // handler list, not the dev NetworkOnly singleton. If this fails, the
    // stubEnv-before-import trick broke — fix the test, not sw.ts.
    expect(defaultCache.length).toBeGreaterThan(5);

    const matcherByCache = new Map<string, unknown>();
    for (const entry of defaultCache) {
      const cacheName = (entry.handler as { cacheName?: string }).cacheName;
      if (cacheName) matcherByCache.set(cacheName, entry.matcher);
    }
    for (const name of PURGED) {
      expect(matcherByCache.has(name), `serwist no longer emits a "${name}" cache`).toBe(true);
      expect(
        typeof matcherByCache.get(name),
        `"${name}"'s matcher is no longer a function — it would escape the wrapper`
      ).toBe("function");
    }
  });
});
