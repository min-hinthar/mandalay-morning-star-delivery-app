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
import { readFileSync } from "node:fs";
import { join } from "node:path";

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
let ordered: Array<[string, unknown]>;
let limited: number[];

beforeEach(() => {
  vi.clearAllMocks();
  applied = [];
  ordered = [];
  limited = [];
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn((col: string, val: unknown) => {
      applied.push([col, val]);
      return chain;
    }),
    order: vi.fn((col: string, opts: unknown) => {
      ordered.push([col, opts]);
      return chain;
    }),
    limit: vi.fn((n: number) => {
      limited.push(n);
      return chain;
    }),
    maybeSingle,
  };
  from.mockReturnValue(chain);
});

describe("getOrderCancellation", () => {
  it("returns the admin's reason and the time it was recorded", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        reason: "Kitchen closed unexpectedly",
        created_at: "2026-08-04T01:00:00Z",
        new_value: { status: "cancelled", notified: true },
      },
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

  it("takes the most recent cancel row, not just any of them", async () => {
    // An order is cancelled once in practice, so this is belt not braces —
    // but without it a dropped .order() would return the OLDEST cancel row on
    // any order that somehow has two, and the suite would stay green.
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await getOrderCancellation("o-1");

    expect(ordered).toEqual([["created_at", { ascending: false }]]);
    expect(limited).toEqual([1]);
  });

  it("returns null when the order was never cancelled", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await getOrderCancellation("o-1")).toBeNull();
  });

  it("withholds the reason when the admin chose NOT to notify the customer", async () => {
    // reason is one required free-text field with no customer-copy/internal
    // split, so an admin opting out of the email may have written it for staff
    // ("suspected card fraud — hold refund"). Showing it anyway would override
    // an explicit choice. The timestamp is still safe to surface.
    maybeSingle.mockResolvedValue({
      data: {
        reason: "suspected card fraud — hold refund pending review",
        created_at: "2026-08-04T01:00:00Z",
        new_value: { status: "cancelled", notified: false },
      },
      error: null,
    });

    expect(await getOrderCancellation("o-1")).toEqual({
      cancelledAt: "2026-08-04T01:00:00Z",
      reason: null,
    });
  });

  it("withholds the reason on a row written before the flag existed", async () => {
    // Absent means unknowable. Withholding degrades to the pre-existing
    // behaviour (no reason shown); showing could leak a staff note.
    for (const newValue of [{ status: "cancelled" }, null, "cancelled", ["cancelled"]]) {
      maybeSingle.mockResolvedValue({
        data: { reason: "internal note", created_at: "2026-08-04T01:00:00Z", new_value: newValue },
        error: null,
      });
      expect(
        (await getOrderCancellation("o-1"))?.reason,
        `new_value: ${JSON.stringify(newValue)}`
      ).toBeNull();
    }
  });

  it("keeps a null reason null — an admin can cancel without giving one", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        reason: null,
        created_at: "2026-08-04T01:00:00Z",
        new_value: { status: "cancelled", notified: true },
      },
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

describe("the writer that this reader depends on", () => {
  /**
   * The gate above is only worth anything if the admin cancel route actually
   * records `notified`. Nothing else pins that: there is no unit test for that
   * route (it drives Stripe refunds and emails), so deleting the flag would
   * leave every suite green while silently withholding the reason from every
   * future cancellation — the exact silent-failure shape #230 and #231 were
   * about, one layer up.
   *
   * A source assertion rather than a mocked route: the coupling is a data
   * contract between two files, and no runtime test spans it.
   */
  it("writes notified onto the cancel audit row", () => {
    const route = readFileSync(
      join(process.cwd(), "src/app/api/admin/orders/[id]/cancel/route.ts"),
      "utf8"
    ).replace(/^\s*\/\/.*$/gm, ""); // strip comments — they discuss `notified` too

    const insert = route.slice(route.indexOf('from("order_audit_log")'));
    const call = insert.slice(0, insert.indexOf("});"));

    expect(call, "the cancel audit insert no longer records notifyCustomer").toMatch(
      /notified:\s*notifyCustomer/
    );
  });
});
