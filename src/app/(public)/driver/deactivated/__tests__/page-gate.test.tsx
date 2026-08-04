/**
 * Only an actually-deactivated driver may see this page.
 *
 * It gated on "is there a logged-in user" alone, so ANY signed-in customer who
 * navigated to /driver/deactivated was shown the admin's email and phone. The
 * route is deliberately public-ish — `middleware.ts` exempts it so a deactivated
 * driver can reach it without passing the driver-layout guard — which is exactly
 * why the page itself has to do the check.
 *
 * The gate defers to `getRoleDashboard`, the same source of truth the auth
 * callback and the driver layout use. It already returns this page's path for an
 * inactive driver, so "render only when it agrees" cannot drift from the rest of
 * the app, and cannot loop.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock factories are hoisted above ordinary const declarations, so the
// doubles have to be created inside vi.hoisted() to exist when they run.
const { redirect, getRoleDashboard, getUser, maybeSingle } = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    // Next's redirect() throws to halt rendering; mirror that so control flow
    // in the page under test matches production.
    throw new Error(`REDIRECT:${path}`);
  }),
  getRoleDashboard: vi.fn(),
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth/role-redirect", () => ({ getRoleDashboard }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
  createServiceClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle }) }),
    }),
  }),
}));

import DriverDeactivatedPage from "../page";

/** Render the page, returning the path it redirected to, or null if it rendered. */
async function redirectedTo(): Promise<string | null> {
  try {
    await DriverDeactivatedPage();
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("REDIRECT:")) return message.slice("REDIRECT:".length);
    throw err;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  maybeSingle.mockResolvedValue({ data: null, error: null });
});

describe("the deactivated page's gate", () => {
  it("sends a signed-out visitor to login without consulting roles", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    expect(await redirectedTo()).toBe("/login");
    expect(getRoleDashboard).not.toHaveBeenCalled();
  });

  it("renders for a driver who really is deactivated", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "d@x.co" } }, error: null });
    getRoleDashboard.mockResolvedValue({
      path: "/driver/deactivated",
      role: "driver",
      driverStatus: "inactive",
    });

    expect(await redirectedTo()).toBeNull();
  });

  it("turns a customer away instead of showing them the admin's contact", async () => {
    // The bug: this used to render, exposing the admin email and phone to any
    // signed-in user who guessed the URL.
    getUser.mockResolvedValue({ data: { user: { id: "u2", email: "c@x.co" } }, error: null });
    getRoleDashboard.mockResolvedValue({ path: "/menu", role: "customer" });

    expect(await redirectedTo()).toBe("/menu");
  });

  it("turns away an ACTIVE driver and an admin, each to their own home", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u3", email: "x@x.co" } }, error: null });

    getRoleDashboard.mockResolvedValue({
      path: "/driver",
      role: "driver",
      driverStatus: "active",
    });
    expect(await redirectedTo()).toBe("/driver");

    getRoleDashboard.mockResolvedValue({ path: "/admin", role: "admin" });
    expect(await redirectedTo()).toBe("/admin");
  });

  it("fails closed when the role lookup errors", async () => {
    // getRoleDashboard swallows DB errors into this path rather than throwing,
    // so the page must follow it rather than fall through to the contact info.
    getUser.mockResolvedValue({ data: { user: { id: "u4", email: "y@x.co" } }, error: null });
    getRoleDashboard.mockResolvedValue({
      path: "/login?error=role_lookup_failed",
      role: "unknown",
    });

    expect(await redirectedTo()).toBe("/login?error=role_lookup_failed");
  });
});
