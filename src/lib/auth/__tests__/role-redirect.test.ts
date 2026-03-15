import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRoleDashboard } from "../role-redirect";

// Mock logger to avoid console noise
vi.mock("@/lib/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock resolve-oauth-email
vi.mock("@/lib/auth/resolve-oauth-email", () => ({
  resolveOAuthEmail: vi.fn(() => "test@example.com"),
}));

function createMockSupabase(overrides: {
  profileData?: { role: string } | null;
  profileError?: Error | null;
  driverData?: { id: string; is_active: boolean } | null;
  driverError?: Error | null;
  upsertError?: Error | null;
  insertError?: { message: string; code: string } | null;
  checkData?: { id: string } | null;
}) {
  const {
    profileData = null,
    profileError = null,
    driverData = null,
    driverError = null,
    checkData = { id: "user-1" },
  } = overrides;

  return {
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: profileData, error: profileError })
              ),
              maybeSingle: vi.fn(() =>
                Promise.resolve({ data: checkData, error: null })
              ),
              is: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
          upsert: vi.fn(() =>
            Promise.resolve({ error: overrides.upsertError ?? null })
          ),
          insert: vi.fn(() =>
            Promise.resolve({ error: overrides.insertError ?? null })
          ),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        };
      }
      if (table === "drivers") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: driverData, error: driverError })
              ),
            })),
          })),
        };
      }
      return {};
    }),
    auth: {
      admin: {
        getUserById: vi.fn(() =>
          Promise.resolve({ data: { user: { email: "test@example.com" } }, error: null })
        ),
      },
    },
  } as unknown as Parameters<typeof getRoleDashboard>[0];
}

describe("getRoleDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns /admin for admin role", async () => {
    const supabase = createMockSupabase({ profileData: { role: "admin" } });
    const result = await getRoleDashboard(supabase, "user-1", "admin@test.com");

    expect(result).toEqual({ path: "/admin", role: "admin" });
  });

  it("returns /driver for active driver", async () => {
    const supabase = createMockSupabase({
      profileData: { role: "driver" },
      driverData: { id: "driver-1", is_active: true },
    });
    const result = await getRoleDashboard(supabase, "user-1", "driver@test.com");

    expect(result).toEqual({
      path: "/driver",
      role: "driver",
      driverStatus: "active",
    });
  });

  it("returns /driver/onboard for driver with no record", async () => {
    const supabase = createMockSupabase({
      profileData: { role: "driver" },
      driverData: null,
    });
    const result = await getRoleDashboard(supabase, "user-1");

    expect(result).toEqual({
      path: "/driver/onboard",
      role: "driver",
      driverStatus: "no_record",
    });
  });

  it("returns /driver/deactivated for inactive driver", async () => {
    const supabase = createMockSupabase({
      profileData: { role: "driver" },
      driverData: { id: "driver-1", is_active: false },
    });
    const result = await getRoleDashboard(supabase, "user-1");

    expect(result).toEqual({
      path: "/driver/deactivated",
      role: "driver",
      driverStatus: "inactive",
    });
  });

  it("returns /menu for customer role", async () => {
    const supabase = createMockSupabase({ profileData: { role: "customer" } });
    const result = await getRoleDashboard(supabase, "user-1", "cust@test.com");

    expect(result).toEqual({ path: "/menu", role: "customer" });
  });

  it("auto-creates profile and returns /menu when no profile found", async () => {
    const supabase = createMockSupabase({ profileData: null });
    const result = await getRoleDashboard(supabase, "user-1", "new@test.com");

    expect(result).toEqual({ path: "/menu", role: "customer" });
  });

  it("returns error path (not /) when DB throws error", async () => {
    // This tests the catch block behavior.
    // BUG: currently returns { path: "/", role: "unknown" }
    // FIX: should return { path: "/login?error=role_lookup_failed", role: "unknown" }
    const supabase = {
      from: vi.fn(() => {
        throw new Error("DB connection failed");
      }),
    } as unknown as Parameters<typeof getRoleDashboard>[0];

    const result = await getRoleDashboard(supabase, "user-1");

    // After fix, this should pass. Before fix, path would be "/"
    expect(result.role).toBe("unknown");
    expect(result.path).toBe("/login?error=role_lookup_failed");
  });
});
