/**
 * updateSession — auth gating with preserved destination.
 *
 * Contract: an unauthenticated hit on any protected path (admin, driver, AND
 * the customer group's checkout/cart/orders/account) redirects to /login with
 * ?next=<path>, so the post-login redirect can land the customer back where
 * they were headed. The (customer) layout's own redirect("/login") cannot see
 * the request path — before this, a guest tapping "Proceed to Checkout" got
 * /login with no destination and was dumped on /menu after signing in.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

let mockUser: { id: string } | null = null;
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: mockUser } }),
    },
  }),
}));

import { updateSession } from "../middleware";

function req(path: string): NextRequest {
  return new NextRequest(`https://mandalaymorningstar.com${path}`);
}

beforeEach(() => {
  mockUser = null;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://stub.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "stub-anon-key");
});

describe("updateSession — unauthenticated redirects carry ?next=", () => {
  it.each(["/checkout", "/cart", "/orders", "/account", "/orders/abc/tracking"])(
    "redirects guest on %s to /login?next=<path>",
    async (path) => {
      const res = await updateSession(req(path));
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/login");
      expect(location.searchParams.get("next")).toBe(path);
    }
  );

  it("still gates /admin and /driver with ?next=", async () => {
    for (const path of ["/admin/orders", "/driver"]) {
      const res = await updateSession(req(path));
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/login");
      expect(location.searchParams.get("next")).toBe(path);
    }
  });

  it("does NOT redirect guests on public paths", async () => {
    for (const path of ["/", "/menu", "/login", "/carte"]) {
      const res = await updateSession(req(path));
      expect(res.headers.get("location")).toBeNull();
    }
  });

  it("does NOT redirect guests on the PUBLIC order-share page (its whole audience is logged out)", async () => {
    // /orders/{token}/share is the (public) share page — service-client read
    // keyed on share_token, deliberately unauthenticated. Gating it kills
    // every shared link for its intended recipients.
    for (const path of ["/orders/abc123token/share", "/orders/abc123token/share/"]) {
      const res = await updateSession(req(path));
      expect(res.headers.get("location")).toBeNull();
    }
  });

  it("still gates deeper /orders paths that only RESEMBLE the share page", async () => {
    for (const path of ["/orders/abc/share/extra", "/orders/share/tracking"]) {
      const res = await updateSession(req(path));
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/login");
      expect(location.searchParams.get("next")).toBe(path);
    }
  });

  it("does NOT redirect an authenticated user on protected paths", async () => {
    mockUser = { id: "user-1" };
    for (const path of ["/checkout", "/cart", "/admin/orders"]) {
      const res = await updateSession(req(path));
      expect(res.headers.get("location")).toBeNull();
    }
  });
});
