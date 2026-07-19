import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { RoutesRow, RouteStopsRow } from "@/types/driver";
import { createMockRoute, createMockStop } from "@/test/factories";

// ── Module-level mocks (before handler imports) ──────────────────────

vi.mock("@/lib/auth", () => ({ requireDriver: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  driverActionLimiter: {},
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), exception: vi.fn() },
}));
vi.mock("@/lib/badges", () => ({
  checkAndAwardBadges: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));
// Customer status emails fire fire-and-forget from start (out_for_delivery) and
// stop-delivered (delivered) — stub the sender so the lifecycle asserts routing,
// not email side effects.
vi.mock("@/lib/email", () => ({
  sendOrderStatusEmail: vi.fn().mockResolvedValue(true),
}));
// Run after() callbacks inline so the fire-and-forget email path doesn't need a
// real request scope (the routes now schedule emails via after()).
vi.mock("next/server", async (importOriginal) => {
  const mod = await importOriginal<typeof import("next/server")>();
  return {
    ...mod,
    after: (cb: () => Promise<void>) => {
      void cb();
    },
  };
});

// ── Imports after mocks ──────────────────────────────────────────────

import { requireDriver } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { checkAndAwardBadges } from "@/lib/badges";

// ── Constants ────────────────────────────────────────────────────────

const DRIVER_ID = "driver-uuid";
const ROUTE_ID = "route-uuid";

// ── Handler imports (dynamic after mocks) ────────────────────────────

const { POST: acceptRoute } = await import("../[routeId]/accept/route");
const { POST: startRoute } = await import("../[routeId]/start/route");
const { POST: completeRoute } = await import("../[routeId]/complete/route");
const { PATCH: updateStop } = await import("../[routeId]/stops/[stopId]/route");

// ── Shared mock state ────────────────────────────────────────────────

let routeState: RoutesRow;
let stopStates: RouteStopsRow[];
let orderUpdateShouldFail = false;

// ── Mock RPC ─────────────────────────────────────────────────────────

const mockRpc = vi.fn().mockImplementation((name: string) => {
  if (name === "promote_next_stop") {
    const nextPending = stopStates.find((s) => s.status === "pending");
    if (nextPending) {
      nextPending.status = "enroute";
      return Promise.resolve({
        data: { promoted_stop_id: nextPending.id, stop_index: nextPending.stop_index },
        error: null,
      });
    }
    return Promise.resolve({ data: { promoted_stop_id: null, stop_index: null }, error: null });
  }
  if (name === "calculate_driver_streak") {
    return Promise.resolve({ data: 0, error: null });
  }
  return Promise.resolve({ data: null, error: null });
});

// ── Supabase chain mock ──────────────────────────────────────────────

/** Track call count per table to distinguish chain shapes within a handler */
const callCounts: Record<string, number> = {};

function resetCallCounts() {
  Object.keys(callCounts).forEach((k) => delete callCounts[k]);
}

function createChainTerminal(resolveValue: unknown) {
  const terminal: Record<string, unknown> = {
    single: () => Promise.resolve(resolveValue),
    returns: () => terminal,
    eq: () => terminal,
    order: () => terminal,
    limit: () => terminal,
    in: () => terminal,
    select: () => terminal,
    // Make thenable so `await chain.eq(...)` resolves without .single()
    then: (resolve: (v: unknown) => void) => resolve(resolveValue),
  };
  return terminal;
}

function fromMock(table: string) {
  const key = table;
  callCounts[key] = (callCounts[key] ?? 0) + 1;

  if (table === "routes") {
    return {
      select: (cols?: string) => {
        // Complete handler chain 2: select("status").eq(...)
        if (cols === "status") {
          return createChainTerminal({
            data: stopStates.map((s) => ({ status: s.status })),
            error: null,
          });
        }
        // Route select → single chain (used by all handlers as chain 1)
        return createChainTerminal({ data: routeState, error: null });
      },
      update: (data: Partial<RoutesRow>) => {
        Object.assign(routeState, data);
        // Accept handler chain 2 has .select("id") after .eq()
        // Start/complete handler chain 2 has NO .select() — resolves directly on .eq()
        const updateChain: Record<string, unknown> = {
          eq: () => ({
            // If .select() is called after .eq(), it's the accept pattern
            select: () => Promise.resolve({ data: [{ id: routeState.id }], error: null }),
            // Resolve directly for start/complete (no .select())
            then: (resolve: (val: unknown) => void) => resolve({ error: null }),
          }),
        };
        return updateChain;
      },
    };
  }

  if (table === "route_stops") {
    return {
      select: (cols?: string) => {
        // Start handler chain 5: select("order_id").eq(...)
        if (cols === "order_id") {
          return createChainTerminal({
            data: stopStates.map((s) => ({ order_id: s.order_id })),
            error: null,
          });
        }
        // Start handler chain 3: first stop select or stop handler chain 2: stop select
        // Complete handler: select("status").eq(...)
        if (cols === "status") {
          return createChainTerminal({
            data: stopStates.map((s) => ({ status: s.status })),
            error: null,
          });
        }
        // Stop handler: select("id, status, route_id, stop_index, order_id").eq().eq()
        const selectChain: Record<string, unknown> = {
          eq: (col: string, val: string) => {
            if (col === "route_id") {
              // Start handler: first stop by route_id then order/limit/single.
              // Fallback promotion: a second .eq("status", X) returns the
              // status-filtered array of stops.
              const firstStopData =
                stopStates.length > 0
                  ? { id: stopStates[0].id, stop_index: stopStates[0].stop_index }
                  : null;
              const routeStopsTerminal: Record<string, unknown> = {
                single: () =>
                  Promise.resolve({
                    data: firstStopData,
                    error: firstStopData ? null : { message: "not found" },
                  }),
                returns: () => routeStopsTerminal,
                order: () => routeStopsTerminal,
                limit: () => routeStopsTerminal,
                eq: (_col2: string, statusVal: string) =>
                  createChainTerminal({
                    data: stopStates
                      .filter((s) => s.status === statusVal)
                      .map((s) => ({ id: s.id, stop_index: s.stop_index })),
                    error: null,
                  }),
                then: (resolve: (v: unknown) => void) =>
                  resolve({ data: firstStopData, error: null }),
              };
              return routeStopsTerminal;
            }
            if (col === "id") {
              // Stop handler: select by stop id, then chain .eq("route_id", ...)
              const stop = stopStates.find((s) => s.id === val);
              return {
                eq: () =>
                  createChainTerminal({
                    data: stop ?? null,
                    error: stop ? null : { message: "not found" },
                  }),
                returns: () => ({
                  single: () =>
                    Promise.resolve({
                      data: stop ?? null,
                      error: stop ? null : { message: "not found" },
                    }),
                }),
              };
            }
            return createChainTerminal({ data: null, error: null });
          },
          returns: () => selectChain,
          single: () => {
            const firstStop = stopStates.length > 0 ? stopStates[0] : null;
            return Promise.resolve({
              data: firstStop ? { id: firstStop.id, stop_index: firstStop.stop_index } : null,
              error: firstStop ? null : { message: "not found" },
            });
          },
        };
        return selectChain;
      },
      update: (data: Record<string, string | null>) => ({
        eq: (col: string, val: string) => {
          const stop = col === "id" ? stopStates.find((s) => s.id === val) : null;
          const apply = (guard?: string) => {
            if (stop && (guard === undefined || stop.status === guard)) Object.assign(stop, data);
          };
          return {
            // Status-guarded second .eq (start first-stop + fallback promotion)
            eq: (_col2: string, val2: string) => {
              const matched = Boolean(stop && stop.status === val2);
              apply(val2);
              return {
                select: () => Promise.resolve({ data: matched ? [{ id: val }] : [], error: null }),
                then: (resolve: (v: unknown) => void) => resolve({ error: null }),
              };
            },
            // Direct await (single .eq stop status update)
            then: (resolve: (v: unknown) => void) => {
              apply();
              resolve({ error: null });
            },
          };
        },
      }),
    };
  }

  if (table === "orders") {
    const orderResult = orderUpdateShouldFail
      ? { data: null, error: { message: "order update failed" } }
      : { data: [{ id: "order-0-uuid" }], error: null };
    return {
      update: () => ({
        in: () => ({
          in: () => ({
            select: () => Promise.resolve(orderResult),
          }),
          select: () => Promise.resolve(orderResult),
        }),
        eq: () => ({
          eq: () => ({
            select: () => Promise.resolve(orderResult),
          }),
          select: () => Promise.resolve(orderResult),
        }),
      }),
    };
  }

  if (table === "drivers") {
    return {
      select: () =>
        createChainTerminal({
          data: { deliveries_count: 2, rating_avg: 5 },
          error: null,
        }),
    };
  }

  return { select: () => createChainTerminal({ data: null, error: null }) };
}

const mockSupabase = { from: vi.fn(fromMock), rpc: mockRpc };

// ── Auth setup helper ────────────────────────────────────────────────

function setupAuth(opts?: { success?: boolean; driverId?: string; status?: number }) {
  const success = opts?.success ?? true;
  if (success) {
    vi.mocked(requireDriver).mockResolvedValue({
      success: true as const,
      supabase: mockSupabase as never,
      driverId: opts?.driverId ?? DRIVER_ID,
      userId: "user-uuid",
    });
  } else {
    vi.mocked(requireDriver).mockResolvedValue({
      success: false as const,
      error: "Unauthorized",
      status: opts?.status ?? 401,
    } as never);
  }
}

// ── Request helpers ──────────────────────────────────────────────────

function postRequest(path: string) {
  return new NextRequest(`http://localhost/api/driver/routes/${path}`, { method: "POST" });
}

function patchRequest(path: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/driver/routes/${path}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function routeParams(routeId: string) {
  return { params: Promise.resolve({ routeId }) };
}

function stopParams(routeId: string, stopId: string) {
  return { params: Promise.resolve({ routeId, stopId }) };
}

// ── Tests ────────────────────────────────────────────────────────────

describe("Driver Route Lifecycle Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCallCounts();
    orderUpdateShouldFail = false;
    routeState = createMockRoute({ status: "assigned" });
    stopStates = [
      createMockStop({ id: "stop-0-uuid", stop_index: 0, order_id: "order-0-uuid" }),
      createMockStop({ id: "stop-1-uuid", stop_index: 1, order_id: "order-1-uuid" }),
    ];
    setupAuth();
    vi.mocked(createServiceClient).mockReturnValue(mockSupabase as never);
  });

  it("completes full lifecycle: accept -> start -> arrive -> deliver -> complete", async () => {
    // ── Accept ──
    const acceptRes = await acceptRoute(postRequest(`${ROUTE_ID}/accept`), routeParams(ROUTE_ID));
    const acceptData = await acceptRes.json();
    expect(acceptRes.status).toBe(200);
    expect(acceptData.success).toBe(true);
    expect(acceptData.acceptedAt).toBeDefined();
    expect(routeState.status).toBe("accepted");

    // ── Start ──
    resetCallCounts();
    const startRes = await startRoute(postRequest(`${ROUTE_ID}/start`), routeParams(ROUTE_ID));
    const startData = await startRes.json();
    expect(startRes.status).toBe(200);
    expect(startData.success).toBe(true);
    expect(startData.firstStopId).toBe("stop-0-uuid");
    expect(startData.ordersTransitioned).toBe(2);
    expect(routeState.status).toBe("in_progress");

    // ── Stop 0: arrive ──
    resetCallCounts();
    const arriveRes = await updateStop(
      patchRequest(`${ROUTE_ID}/stops/stop-0-uuid`, { status: "arrived" }),
      stopParams(ROUTE_ID, "stop-0-uuid")
    );
    const arriveData = await arriveRes.json();
    expect(arriveRes.status).toBe(200);
    expect(arriveData.success).toBe(true);
    expect(arriveData.stop.status).toBe("arrived");
    expect(arriveData.stop.arrivedAt).toBeDefined();
    // arrived is not terminal — no nextStop promotion
    expect(arriveData.nextStop).toBeNull();

    // ── Stop 0: deliver ──
    resetCallCounts();
    // Update stop state to reflect arrived (from previous step's mock mutation)
    stopStates[0].status = "arrived";
    const deliverRes = await updateStop(
      patchRequest(`${ROUTE_ID}/stops/stop-0-uuid`, { status: "delivered" }),
      stopParams(ROUTE_ID, "stop-0-uuid")
    );
    const deliverData = await deliverRes.json();
    expect(deliverRes.status).toBe(200);
    expect(deliverData.success).toBe(true);
    expect(deliverData.stop.status).toBe("delivered");
    expect(deliverData.orderUpdated).toBe(true);
    // Next stop promoted
    expect(deliverData.nextStop).toEqual({ id: "stop-1-uuid", stopIndex: 1 });
    // promote_next_stop RPC was called
    expect(mockRpc).toHaveBeenCalledWith("promote_next_stop", {
      p_route_id: ROUTE_ID,
      p_completed_stop_id: "stop-0-uuid",
    });

    // ── Complete ──
    resetCallCounts();
    stopStates[0].status = "delivered";
    stopStates[1].status = "delivered";
    const completeRes = await completeRoute(
      postRequest(`${ROUTE_ID}/complete`),
      routeParams(ROUTE_ID)
    );
    const completeData = await completeRes.json();
    expect(completeRes.status).toBe(200);
    expect(completeData.success).toBe(true);
    expect(completeData.stats).toBeDefined();
    expect(completeData.stats.delivered_stops).toBe(2);
    expect(completeData.stats.total_stops).toBe(2);
    expect(completeData.stats.completion_rate).toBe(100);
    expect(completeData.newBadges).toEqual([]);
    expect(routeState.status).toBe("completed");
  });

  it("complete returns 409 when stops are still pending (not yet persisted)", async () => {
    routeState.status = "in_progress";
    stopStates[0].status = "delivered";
    stopStates[1].status = "pending"; // a queued delivery hasn't landed yet

    const res = await completeRoute(postRequest(`${ROUTE_ID}/complete`), routeParams(ROUTE_ID));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("not delivered or skipped");
    expect(routeState.status).toBe("in_progress"); // not completed
  });

  // ── Stop skip path ──

  it("skip triggers promote_next_stop and promotes next pending stop", async () => {
    routeState.status = "in_progress";
    stopStates[0].status = "enroute";

    const skipRes = await updateStop(
      patchRequest(`${ROUTE_ID}/stops/stop-0-uuid`, { status: "skipped" }),
      stopParams(ROUTE_ID, "stop-0-uuid")
    );
    const skipData = await skipRes.json();
    expect(skipRes.status).toBe(200);
    expect(skipData.success).toBe(true);
    expect(skipData.stop.status).toBe("skipped");
    expect(skipData.nextStop).toEqual({ id: "stop-1-uuid", stopIndex: 1 });
    expect(mockRpc).toHaveBeenCalledWith("promote_next_stop", {
      p_route_id: ROUTE_ID,
      p_completed_stop_id: "stop-0-uuid",
    });
  });

  it("arrived status does NOT trigger promote_next_stop RPC", async () => {
    routeState.status = "in_progress";
    stopStates[0].status = "enroute";

    await updateStop(
      patchRequest(`${ROUTE_ID}/stops/stop-0-uuid`, { status: "arrived" }),
      stopParams(ROUTE_ID, "stop-0-uuid")
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });

  // ── Concurrent stop delivery (SKIP LOCKED) ──

  it("concurrent delivery returns promoted_stop_id: null when SKIP LOCKED contention", async () => {
    routeState.status = "in_progress";
    stopStates[0].status = "arrived";

    // Override RPC to simulate SKIP LOCKED contention (no row locked)
    mockRpc.mockImplementationOnce(() =>
      Promise.resolve({ data: { promoted_stop_id: null, stop_index: null }, error: null })
    );

    const res = await updateStop(
      patchRequest(`${ROUTE_ID}/stops/stop-0-uuid`, { status: "delivered" }),
      stopParams(ROUTE_ID, "stop-0-uuid")
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.nextStop).toBeNull();
  });

  // ── Error paths ──

  describe("error paths", () => {
    it("returns 401 when auth fails", async () => {
      setupAuth({ success: false, status: 401 });
      const res = await acceptRoute(postRequest(`${ROUTE_ID}/accept`), routeParams(ROUTE_ID));
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 403 when driver does not own route", async () => {
      setupAuth({ driverId: "other-driver-uuid" });
      const res = await acceptRoute(postRequest(`${ROUTE_ID}/accept`), routeParams(ROUTE_ID));
      expect(res.status).toBe(403);
    });

    it("returns 404 when route not found", async () => {
      // Override fromMock to return null route
      mockSupabase.from.mockImplementationOnce(() => ({
        select: () => createChainTerminal({ data: null, error: { message: "not found" } }),
      }));
      const res = await acceptRoute(postRequest(`${ROUTE_ID}/accept`), routeParams(ROUTE_ID));
      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid status transition (accept already-accepted)", async () => {
      routeState.status = "accepted";
      const res = await acceptRoute(postRequest(`${ROUTE_ID}/accept`), routeParams(ROUTE_ID));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Cannot accept route with status");
    });

    it("returns 400 for invalid stop transition", async () => {
      routeState.status = "in_progress";
      stopStates[0].status = "delivered"; // terminal

      const res = await updateStop(
        patchRequest(`${ROUTE_ID}/stops/stop-0-uuid`, { status: "arrived" }),
        stopParams(ROUTE_ID, "stop-0-uuid")
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Cannot transition from");
    });

    it("returns 500 when DB update fails", async () => {
      // Override fromMock to return error on update
      mockSupabase.from.mockImplementationOnce(() => ({
        select: () => createChainTerminal({ data: routeState, error: null }),
      }));
      mockSupabase.from.mockImplementationOnce(() => ({
        select: () => createChainTerminal({ data: null, error: { message: "DB error" } }),
        update: () => ({
          eq: () => ({
            select: () => Promise.resolve({ data: null, error: { message: "DB error" } }),
            then: (resolve: (v: unknown) => void) => resolve({ error: { message: "DB error" } }),
          }),
        }),
      }));

      const res = await acceptRoute(postRequest(`${ROUTE_ID}/accept`), routeParams(ROUTE_ID));
      expect(res.status).toBe(500);
    });
  });

  // ── Badge failure resilience ──

  it("route completion succeeds when badge check throws", async () => {
    routeState.status = "in_progress";
    stopStates[0].status = "delivered";
    stopStates[1].status = "delivered";

    vi.mocked(checkAndAwardBadges).mockRejectedValueOnce(new Error("Badge service down"));

    const res = await completeRoute(postRequest(`${ROUTE_ID}/complete`), routeParams(ROUTE_ID));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.newBadges).toEqual([]);
    expect(routeState.status).toBe("completed");
  });

  // ── Route with no stops ──

  it("start returns firstStopId null and ordersTransitioned 0 for route with no stops", async () => {
    routeState.status = "accepted";
    stopStates = []; // No stops

    const res = await startRoute(postRequest(`${ROUTE_ID}/start`), routeParams(ROUTE_ID));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.firstStopId).toBeNull();
    expect(data.ordersTransitioned).toBe(0);
  });

  // ── Start: order-transition failure is surfaced (no silent stuck orders) ──

  it("start returns 500 when the order transition fails", async () => {
    routeState.status = "accepted";
    orderUpdateShouldFail = true;

    const res = await startRoute(postRequest(`${ROUTE_ID}/start`), routeParams(ROUTE_ID));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("failed to update orders");
  });

  // ── Start: idempotent re-entry when already in_progress (retry path) ──

  it("start is idempotent when route is already in_progress", async () => {
    routeState.status = "in_progress";
    routeState.started_at = "2026-06-04T10:00:00.000Z";

    const res = await startRoute(postRequest(`${ROUTE_ID}/start`), routeParams(ROUTE_ID));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    // Returns the persisted start time, not a fresh stamp
    expect(data.startedAt).toBe("2026-06-04T10:00:00.000Z");
    expect(data.ordersTransitioned).toBe(2);
    expect(routeState.status).toBe("in_progress");
  });

  // ── Stop promotion fallback when the atomic RPC errors ──

  it("deliver promotes lowest pending stop via fallback when RPC errors", async () => {
    routeState.status = "in_progress";
    stopStates[0].status = "arrived";
    stopStates[1].status = "pending";
    mockRpc.mockImplementationOnce(() =>
      Promise.resolve({ data: null, error: { message: "rpc failed" } })
    );

    const res = await updateStop(
      patchRequest(`${ROUTE_ID}/stops/stop-0-uuid`, { status: "delivered" }),
      stopParams(ROUTE_ID, "stop-0-uuid")
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.nextStop).toEqual({ id: "stop-1-uuid", stopIndex: 1 });
    expect(stopStates[1].status).toBe("enroute");
  });

  it("deliver fallback returns the already-enroute stop when RPC errors", async () => {
    routeState.status = "in_progress";
    stopStates[0].status = "arrived";
    stopStates[1].status = "enroute"; // already advanced
    mockRpc.mockImplementationOnce(() =>
      Promise.resolve({ data: null, error: { message: "rpc failed" } })
    );

    const res = await updateStop(
      patchRequest(`${ROUTE_ID}/stops/stop-0-uuid`, { status: "delivered" }),
      stopParams(ROUTE_ID, "stop-0-uuid")
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.nextStop).toEqual({ id: "stop-1-uuid", stopIndex: 1 });
  });

  // ── Idempotent re-submission (offline at-least-once retry) ──

  it("re-submitting an already-delivered stop returns idempotent success, not 400", async () => {
    routeState.status = "in_progress";
    stopStates[0].status = "delivered";
    stopStates[0].delivered_at = "2026-06-04T11:00:00.000Z";

    const res = await updateStop(
      patchRequest(`${ROUTE_ID}/stops/stop-0-uuid`, { status: "delivered" }),
      stopParams(ROUTE_ID, "stop-0-uuid")
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.idempotent).toBe(true);
    expect(data.stop.status).toBe("delivered");
    expect(data.stop.deliveredAt).toBe("2026-06-04T11:00:00.000Z");
    expect(data.nextStop).toBeNull();
    // No promotion RPC on an idempotent no-op
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("deliver fallback returns null nextStop when no pending stops remain", async () => {
    routeState.status = "in_progress";
    stopStates[0].status = "arrived";
    stopStates[1].status = "delivered"; // last remaining already done
    mockRpc.mockImplementationOnce(() =>
      Promise.resolve({ data: null, error: { message: "rpc failed" } })
    );

    const res = await updateStop(
      patchRequest(`${ROUTE_ID}/stops/stop-0-uuid`, { status: "delivered" }),
      stopParams(ROUTE_ID, "stop-0-uuid")
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.nextStop).toBeNull();
  });
});
