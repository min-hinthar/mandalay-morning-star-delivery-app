/**
 * `cancellationReason` on the tracking page was structurally dead.
 *
 * #231 removed `orders.cancelled_at` / `cancellation_reason` from both tracking
 * queries — columns that never existed and were failing the whole select — and
 * hardcoded the two fields to null as an explicitly deferred follow-up. This is
 * that follow-up: the values come from `order_audit_log`, the one place a
 * cancellation reason is actually recorded.
 *
 * Only ADMIN cancellations write there. That is the right scope rather than a
 * limitation: the reason a customer needs surfaced is the one they did not
 * write ("we cancelled your order because …"). Their own self-serve reason goes
 * into a `special_instructions` note moments after they typed it, and mining it
 * back out of free text would be guesswork.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { maybeSingle, from, createServiceClient, loggerException } = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const from = vi.fn();
  return {
    maybeSingle,
    from,
    createServiceClient: vi.fn(() => ({ from })),
    loggerException: vi.fn(),
  };
});

vi.mock("@/lib/supabase/server", () => ({ createServiceClient }));
vi.mock("@/lib/utils/logger", () => ({ logger: { exception: loggerException } }));

import { getOrderCancellation } from "../cancellation";

/** Record the filters applied so the query's scoping can be asserted. */
let applied: Array<[string, unknown]>;

beforeEach(() => {
  vi.clearAllMocks();
  applied = [];
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn((col: string, val: unknown) => {
      applied.push([col, val]);
      return chain;
    }),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle,
  };
  from.mockReturnValue(chain);
});

describe("getOrderCancellation", () => {
  it("returns the admin's reason and the time it was recorded", async () => {
    maybeSingle.mockResolvedValue({
      data: { reason: "Kitchen closed unexpectedly", created_at: "2026-08-04T01:00:00Z" },
      error: null,
    });

    expect(await getOrderCancellation("o-1")).toEqual({
      cancelledAt: "2026-08-04T01:00:00Z",
      reason: "Kitchen closed unexpectedly",
    });
  });

  it("reads order_audit_log through the SERVICE client", async () => {
    // Its RLS is admin-only for SELECT (baseline:2291), so a customer-scoped
    // client reads nothing. Callers prove ownership before calling — both
    // current ones match user_id in the query that fetched the order.
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await getOrderCancellation("o-1");

    expect(createServiceClient).toHaveBeenCalled();
    expect(from).toHaveBeenCalledWith("order_audit_log");
  });

  it("scopes to this order's cancel rows only", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await getOrderCancellation("o-42");

    // Without BOTH filters a service-client read would reach other orders'
    // audit rows, or return a refund/edit entry as if it were a cancellation.
    expect(applied).toEqual([
      ["order_id", "o-42"],
      ["action", "cancel"],
    ]);
  });

  it("returns null when the order was never cancelled", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await getOrderCancellation("o-1")).toBeNull();
  });

  it("keeps a null reason null — an admin can cancel without giving one", async () => {
    maybeSingle.mockResolvedValue({
      data: { reason: null, created_at: "2026-08-04T01:00:00Z" },
      error: null,
    });

    expect(await getOrderCancellation("o-1")).toEqual({
      cancelledAt: "2026-08-04T01:00:00Z",
      reason: null,
    });
  });

  it("reports a query failure instead of letting it read as 'no reason'", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: "boom" } });

    expect(await getOrderCancellation("o-1")).toBeNull();
    expect(loggerException).toHaveBeenCalled();
  });

  it("survives a thrown error, because it only decorates a page", async () => {
    maybeSingle.mockRejectedValue(new Error("network"));

    expect(await getOrderCancellation("o-1")).toBeNull();
    expect(loggerException).toHaveBeenCalled();
  });
});
