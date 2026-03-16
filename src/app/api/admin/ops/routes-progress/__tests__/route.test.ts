import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing handler
vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  adminLimiter: {},
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { exception: vi.fn() },
}));

import { GET } from "../route";
import { requireAdmin } from "@/lib/auth";

/**
 * Integration Tests: GET /api/admin/ops/routes-progress
 *
 * Tests auth, success response shape, and DB error handling.
 */

describe("GET /api/admin/ops/routes-progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: false,
      error: "Unauthorized",
      status: 401,
    } as never);

    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns array of RouteProgressItem on success", async () => {
    const mockRoutes = [
      {
        id: "r1",
        status: "in_progress",
        stats_json: { total_stops: 5, delivered_stops: 2 },
        started_at: "2026-03-16T10:00:00Z",
        delivery_date: "2026-03-16",
        drivers: { profiles: { full_name: "Alice" } },
      },
    ];

    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      userId: "admin-1",
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                neq: vi
                  .fn()
                  .mockResolvedValue({ data: mockRoutes, error: null }),
              }),
            }),
          }),
        })),
      },
    } as never);

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      id: "r1",
      status: "in_progress",
      driver_name: "Alice",
      delivery_date: "2026-03-16",
    });
    expect(body[0].stats_json).toEqual({
      total_stops: 5,
      delivered_stops: 2,
    });
  });

  it("returns 500 when database query fails", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      userId: "admin-1",
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                neq: vi
                  .fn()
                  .mockResolvedValue({ data: null, error: new Error("DB") }),
              }),
            }),
          }),
        })),
      },
    } as never);

    const response = await GET();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to fetch route progress");
  });

  it("includes driver name from profiles join", async () => {
    const mockRoutes = [
      {
        id: "r2",
        status: "assigned",
        stats_json: null,
        started_at: null,
        delivery_date: "2026-03-16",
        drivers: { profiles: { full_name: "Bob" } },
      },
    ];

    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      userId: "admin-1",
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                neq: vi
                  .fn()
                  .mockResolvedValue({ data: mockRoutes, error: null }),
              }),
            }),
          }),
        })),
      },
    } as never);

    const response = await GET();
    const body = await response.json();
    expect(body[0].driver_name).toBe("Bob");
  });

  it("returns empty array when no routes match", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      userId: "admin-1",
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        })),
      },
    } as never);

    const response = await GET();
    const body = await response.json();
    expect(body).toEqual([]);
  });

  it("handles null driver profiles gracefully", async () => {
    const mockRoutes = [
      {
        id: "r3",
        status: "in_progress",
        stats_json: { total_stops: 3, delivered_stops: 0 },
        started_at: null,
        delivery_date: "2026-03-16",
        drivers: { profiles: null },
      },
    ];

    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      userId: "admin-1",
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                neq: vi
                  .fn()
                  .mockResolvedValue({ data: mockRoutes, error: null }),
              }),
            }),
          }),
        })),
      },
    } as never);

    const response = await GET();
    const body = await response.json();
    expect(body[0].driver_name).toBeNull();
  });
});
