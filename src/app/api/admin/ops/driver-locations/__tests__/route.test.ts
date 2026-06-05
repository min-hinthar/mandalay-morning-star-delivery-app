import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  adminLimiter: {},
}));
vi.mock("@/lib/utils/logger", () => ({ logger: { exception: vi.fn() } }));

import { GET } from "../route";
import { requireAdmin } from "@/lib/auth";

function makeRequest(date = "2026-03-21"): Request {
  return new Request(`http://localhost/api/admin/ops/driver-locations?date=${date}`);
}

/** Build a supabase mock: routes query → routeRows; location query → per-driver latest. */
function buildSupabase(opts: {
  routeRows: unknown[];
  routesError?: unknown;
  locationByDriver?: Record<string, unknown>;
}) {
  const routesChain = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          returns: vi.fn().mockResolvedValue({
            data: opts.routeRows,
            error: opts.routesError ?? null,
          }),
        }),
      }),
    }),
  };

  const locationChain = (driverId: string) => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            returns: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: opts.locationByDriver?.[driverId] ?? null,
                error: null,
              }),
            }),
          }),
        }),
      }),
    }),
  });

  // Track which driverId the location query targets via the .eq call.
  return {
    from: vi.fn((table: string) => {
      if (table === "routes") return routesChain;
      // location_updates: capture driver id from eq, then date-range filters.
      let capturedDriver = "";
      const terminal = () => ({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            returns: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: opts.locationByDriver?.[capturedDriver] ?? null,
                error: null,
              }),
            }),
          }),
        }),
      });
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn((_col: string, val: string) => {
            capturedDriver = val;
            // chain: .eq().gte().lt().order()...
            return { gte: vi.fn().mockReturnValue({ lt: vi.fn(terminal) }) };
          }),
        }),
      };
    }),
    _locationChain: locationChain,
  };
}

describe("GET /api/admin/ops/driver-locations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: false,
      error: "Unauthorized",
      status: 401,
    } as never);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns [] when no routes have drivers for the date", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      userId: "admin-1",
      supabase: buildSupabase({ routeRows: [] }),
    } as never);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns latest location per driver with freshness flag", async () => {
    const fresh = new Date().toISOString();
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      userId: "admin-1",
      supabase: buildSupabase({
        routeRows: [
          {
            driver_id: "d1",
            routes_driver_id_fkey: { profiles: { full_name: "Alice" } },
          },
        ],
        locationByDriver: {
          d1: {
            driver_id: "d1",
            route_id: "r1",
            latitude: 34.09,
            longitude: -117.89,
            heading: 90,
            recorded_at: fresh,
          },
        },
      }),
    } as never);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      driverId: "d1",
      driverName: "Alice",
      lat: 34.09,
      lng: -117.89,
      isStale: false,
    });
  });

  it("flags stale locations older than the threshold", async () => {
    const old = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      userId: "admin-1",
      supabase: buildSupabase({
        routeRows: [{ driver_id: "d2", routes_driver_id_fkey: { profiles: { full_name: "Bob" } } }],
        locationByDriver: {
          d2: {
            driver_id: "d2",
            route_id: null,
            latitude: 34,
            longitude: -118,
            heading: null,
            recorded_at: old,
          },
        },
      }),
    } as never);

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body[0].isStale).toBe(true);
  });

  it("returns 500 when the routes query errors", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      userId: "admin-1",
      supabase: buildSupabase({ routeRows: [], routesError: new Error("DB") }),
    } as never);
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
