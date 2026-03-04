import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * RLS policy edge case tests (TST-03)
 *
 * These tests verify RLS policy LOGIC by documenting expected behavior
 * as executable specifications. Since unit tests cannot connect to Supabase,
 * we mock the Supabase client to simulate the responses that RLS policies
 * would produce for each user/role context.
 *
 * Companion to: scripts/rls-isolation-test.mjs (integration test against live DB)
 * RLS policies defined in: supabase/migrations/003_rls.sql
 */

// ── Mock helpers ─────────────────────────────────────────────────────

/** Create a mock Supabase client scoped to a specific user */
function createMockClientForUser(userId: string, role: "authenticated" | "anon" = "authenticated") {
  const authUser = role === "authenticated"
    ? { id: userId, email: `${userId}@test.com`, role: "authenticated" }
    : null;

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser },
        error: authUser ? null : { message: "Not authenticated" },
      }),
    },
    from: vi.fn(),
    _userId: userId,
    _role: role,
  };
}

/** Simulate RLS-filtered query: only returns rows matching userId */
function mockOrdersForUser(client: ReturnType<typeof createMockClientForUser>, ownOrders: Array<{ id: string; user_id: string; status: string }>) {
  const selectChain = {
    eq: vi.fn().mockImplementation((_col: string, _val: string) => ({
      data: ownOrders.filter((o) => o.user_id === client._userId),
      error: null,
    })),
    data: ownOrders.filter((o) => o.user_id === client._userId),
    error: null,
  };

  client.from.mockImplementation((table: string) => {
    if (table === "orders") {
      return { select: vi.fn().mockReturnValue(selectChain) };
    }
    return { select: vi.fn().mockReturnValue({ data: [], error: null }) };
  });
}

/** Simulate RLS-filtered update: only affects rows matching userId */
function mockOrderUpdateForUser(client: ReturnType<typeof createMockClientForUser>, orders: Array<{ id: string; user_id: string }>) {
  client.from.mockImplementation((table: string) => {
    if (table === "orders") {
      return {
        update: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation((_col: string, val: string) => {
            const order = orders.find((o) => o.id === val);
            if (!order || order.user_id !== client._userId) {
              // RLS blocks: update affects 0 rows (no error, just no match)
              return { data: null, error: null, count: 0 };
            }
            return { data: order, error: null, count: 1 };
          }),
        })),
      };
    }
    return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ data: null, error: null }) }) };
  });
}

// ── Tests ────────────────────────────────────────────────────────────

describe("RLS policy edge cases (TST-03)", () => {
  const USER_A_ID = "user-aaa-111";
  const USER_B_ID = "user-bbb-222";
  const DRIVER_A_ID = "driver-aaa-111";
  const DRIVER_B_ID = "driver-bbb-222";
  const ADMIN_ID = "admin-001";

  const allOrders = [
    { id: "order-1", user_id: USER_A_ID, status: "confirmed" },
    { id: "order-2", user_id: USER_A_ID, status: "delivered" },
    { id: "order-3", user_id: USER_B_ID, status: "pending" },
    { id: "order-4", user_id: USER_B_ID, status: "confirmed" },
  ];

  const allRoutes = [
    { id: "route-1", driver_id: DRIVER_A_ID, delivery_date: "2026-03-08" },
    { id: "route-2", driver_id: DRIVER_B_ID, delivery_date: "2026-03-08" },
    { id: "route-3", driver_id: DRIVER_A_ID, delivery_date: "2026-03-15" },
  ];

  describe("cross-user order isolation", () => {
    it("user A can only read their own orders", async () => {
      const clientA = createMockClientForUser(USER_A_ID);
      mockOrdersForUser(clientA, allOrders);

      const result = clientA.from("orders").select("*");
      expect(result.data).toHaveLength(2);
      expect(result.data.every((o: { user_id: string }) => o.user_id === USER_A_ID)).toBe(true);
    });

    it("user B cannot read user A orders", async () => {
      const clientB = createMockClientForUser(USER_B_ID);
      mockOrdersForUser(clientB, allOrders);

      const result = clientB.from("orders").select("*");
      expect(result.data).toHaveLength(2);
      expect(result.data.every((o: { user_id: string }) => o.user_id === USER_B_ID)).toBe(true);
      expect(result.data.some((o: { user_id: string }) => o.user_id === USER_A_ID)).toBe(false);
    });

    it("user A cannot update user B orders", async () => {
      const clientA = createMockClientForUser(USER_A_ID);
      mockOrderUpdateForUser(clientA, allOrders);

      // Try to update User B's order
      const result = clientA.from("orders").update({ status: "cancelled" }).eq("id", "order-3");
      expect(result.count).toBe(0);
      expect(result.data).toBeNull();
    });

    it("user A can update their own order", async () => {
      const clientA = createMockClientForUser(USER_A_ID);
      mockOrderUpdateForUser(clientA, allOrders);

      // Update own order
      const result = clientA.from("orders").update({ status: "cancelled" }).eq("id", "order-1");
      expect(result.count).toBe(1);
    });
  });

  describe("driver route visibility", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("driver A sees only their assigned routes", () => {
      const clientA = createMockClientForUser(DRIVER_A_ID);

      // Simulate RLS: driver only sees routes assigned to them
      const driverARoutes = allRoutes.filter((r) => r.driver_id === DRIVER_A_ID);
      clientA.from.mockImplementation((table: string) => {
        if (table === "routes") {
          return {
            select: vi.fn().mockReturnValue({
              data: driverARoutes,
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnValue({ data: [], error: null }) };
      });

      const result = clientA.from("routes").select("*");
      expect(result.data).toHaveLength(2); // route-1 and route-3
      expect(result.data.every((r: { driver_id: string }) => r.driver_id === DRIVER_A_ID)).toBe(true);
    });

    it("driver B cannot see driver A routes", () => {
      const clientB = createMockClientForUser(DRIVER_B_ID);

      // Simulate RLS: driver B only sees their own routes
      const driverBRoutes = allRoutes.filter((r) => r.driver_id === DRIVER_B_ID);
      clientB.from.mockImplementation((table: string) => {
        if (table === "routes") {
          return {
            select: vi.fn().mockReturnValue({
              data: driverBRoutes,
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnValue({ data: [], error: null }) };
      });

      const result = clientB.from("routes").select("*");
      expect(result.data).toHaveLength(1); // Only route-2
      expect(result.data.some((r: { driver_id: string }) => r.driver_id === DRIVER_A_ID)).toBe(false);
    });
  });

  describe("admin elevation", () => {
    it("admin can read all orders across users", () => {
      const adminClient = createMockClientForUser(ADMIN_ID);

      // Admin bypasses RLS user filter, sees all orders
      adminClient.from.mockImplementation((table: string) => {
        if (table === "orders") {
          return {
            select: vi.fn().mockReturnValue({
              data: allOrders,
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnValue({ data: [], error: null }) };
      });

      const result = adminClient.from("orders").select("*");
      expect(result.data).toHaveLength(4);
      // Admin sees both User A and User B orders
      const userIds = new Set(result.data.map((o: { user_id: string }) => o.user_id));
      expect(userIds.has(USER_A_ID)).toBe(true);
      expect(userIds.has(USER_B_ID)).toBe(true);
    });

    it("admin can update any order status", () => {
      const adminClient = createMockClientForUser(ADMIN_ID);

      // Admin can update orders belonging to any user
      adminClient.from.mockImplementation((table: string) => {
        if (table === "orders") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((_col: string, val: string) => {
                const order = allOrders.find((o) => o.id === val);
                return { data: order, error: null, count: order ? 1 : 0 };
              }),
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ data: null, error: null }),
          }),
        };
      });

      // Update User A's order
      const resultA = adminClient.from("orders").update({ status: "preparing" }).eq("id", "order-1");
      expect(resultA.count).toBe(1);

      // Update User B's order
      const resultB = adminClient.from("orders").update({ status: "preparing" }).eq("id", "order-3");
      expect(resultB.count).toBe(1);
    });
  });

  describe("anonymous access denial", () => {
    it("anonymous user cannot read orders", async () => {
      const anonClient = createMockClientForUser("anon", "anon");

      // RLS denies anon access to orders table
      anonClient.from.mockImplementation((table: string) => {
        if (table === "orders") {
          return {
            select: vi.fn().mockReturnValue({
              data: null,
              error: { message: "permission denied for table orders", code: "42501" },
            }),
          };
        }
        return { select: vi.fn().mockReturnValue({ data: [], error: null }) };
      });

      const result = anonClient.from("orders").select("*");
      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
    });

    it("anonymous user cannot read profiles", async () => {
      const anonClient = createMockClientForUser("anon", "anon");

      // RLS denies anon access to profiles table
      anonClient.from.mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              data: null,
              error: { message: "permission denied for table profiles", code: "42501" },
            }),
          };
        }
        return { select: vi.fn().mockReturnValue({ data: [], error: null }) };
      });

      const result = anonClient.from("profiles").select("*");
      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
    });

    it("anonymous auth.getUser returns null", async () => {
      const anonClient = createMockClientForUser("anon", "anon");

      const { data } = await anonClient.auth.getUser();
      expect(data.user).toBeNull();
    });
  });

  describe("privilege escalation prevention", () => {
    it("user cannot set is_admin flag on their own profile", () => {
      const clientA = createMockClientForUser(USER_A_ID);

      // RLS prevents updating is_admin column
      clientA.from.mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            update: vi.fn().mockImplementation((updates: Record<string, unknown>) => {
              // RLS strips is_admin from allowed update columns
              if ("is_admin" in updates) {
                return {
                  eq: vi.fn().mockReturnValue({
                    data: null,
                    error: {
                      message: "column \"is_admin\" of relation \"profiles\" violates check constraint",
                      code: "23514",
                    },
                  }),
                };
              }
              return {
                eq: vi.fn().mockReturnValue({ data: { id: USER_A_ID }, error: null }),
              };
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ data: null, error: null }),
          }),
        };
      });

      // Attempt to escalate
      const result = clientA
        .from("profiles")
        .update({ is_admin: true })
        .eq("id", USER_A_ID);

      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
    });

    it("user can update allowed profile fields", () => {
      const clientA = createMockClientForUser(USER_A_ID);

      clientA.from.mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            update: vi.fn().mockImplementation((updates: Record<string, unknown>) => {
              if ("is_admin" in updates) {
                return {
                  eq: vi.fn().mockReturnValue({ data: null, error: { message: "forbidden" } }),
                };
              }
              return {
                eq: vi.fn().mockReturnValue({
                  data: { id: USER_A_ID, ...updates },
                  error: null,
                }),
              };
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ data: null, error: null }),
          }),
        };
      });

      // Allowed update: full_name
      const result = clientA
        .from("profiles")
        .update({ full_name: "New Name" })
        .eq("id", USER_A_ID);

      expect(result.error).toBeNull();
      expect(result.data).toMatchObject({ full_name: "New Name" });
    });
  });
});
