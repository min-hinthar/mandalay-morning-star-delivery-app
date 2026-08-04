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
 *
 * There are TWO admin paths, not one — the dedicated cancel route
 * (action='cancel') and the generic status route (action='status_change',
 * pending | pending_approval | confirmed | preparing -> cancelled). Both take
 * the same free-text reason and email the same template; the second was missed
 * on the first pass, leaving that whole path dead.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { rows, from, createServiceClient, loggerException } = vi.hoisted(() => {
  const rows = vi.fn();
  const from = vi.fn();
  return {
    rows,
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

/** Shorthand for the audit row shape the reader consumes. */
function auditRow(over: Partial<Record<string, unknown>> = {}) {
  return {
    action: "cancel",
    reason: "Kitchen closed unexpectedly",
    created_at: "2026-08-04T01:00:00Z",
    new_value: { status: "cancelled", notified: true },
    ...over,
  };
}

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
    in: vi.fn((col: string, val: unknown) => {
      applied.push([col, val]);
      return chain;
    }),
    order: vi.fn((col: string, opts: unknown) => {
      ordered.push([col, opts]);
      return chain;
    }),
    // Terminal: the reader awaits the builder directly rather than calling
    // .single()/.maybeSingle(), because it now scans a small window of rows.
    limit: vi.fn((n: number) => {
      limited.push(n);
      return rows();
    }),
  };
  from.mockReturnValue(chain);
});

describe("getOrderCancellation", () => {
  it("returns the admin's reason and the time it was recorded", async () => {
    rows.mockResolvedValue({ data: [auditRow()], error: null });

    expect(await getOrderCancellation("o-1")).toEqual({
      cancelledAt: "2026-08-04T01:00:00Z",
      reason: "Kitchen closed unexpectedly",
    });
  });

  it("reads a cancellation made through the generic STATUS route", async () => {
    // The path this reader originally missed. PATCH /admin/orders/[id]/status
    // allows pending | pending_approval | confirmed | preparing -> cancelled,
    // takes the same reason, and emails the same OrderCancellation template —
    // but its audit row says action='status_change'. Scoped to 'cancel' alone,
    // that whole path stayed dead: email with a reason, tracking page without.
    rows.mockResolvedValue({
      data: [
        auditRow({
          action: "status_change",
          reason: "Ingredient shortage — sorry!",
          new_value: { status: "cancelled", notified: true },
        }),
      ],
      error: null,
    });

    expect(await getOrderCancellation("o-1")).toEqual({
      cancelledAt: "2026-08-04T01:00:00Z",
      reason: "Ingredient shortage — sorry!",
    });
  });

  it("does not mistake a non-cancel status_change for a cancellation", async () => {
    // 'status_change' is also what approve-cod and every forward transition
    // write. Taking the newest row of that action — rather than the newest one
    // that moved INTO cancelled — would surface a COD-approval note as the
    // cancellation reason, and stamp the wrong time on the overlay.
    rows.mockResolvedValue({
      data: [
        auditRow({
          action: "status_change",
          reason: "Cash on delivery order approved by admin",
          created_at: "2026-08-04T09:00:00Z",
          new_value: { status: "confirmed", notified: true },
        }),
        auditRow({ reason: "Kitchen closed unexpectedly" }),
      ],
      error: null,
    });

    expect(await getOrderCancellation("o-1")).toEqual({
      cancelledAt: "2026-08-04T01:00:00Z",
      reason: "Kitchen closed unexpectedly",
    });
  });

  it("ignores a status_change row whose new_value is not an object", async () => {
    for (const newValue of [null, "cancelled", ["cancelled"], 7]) {
      rows.mockResolvedValue({
        data: [auditRow({ action: "status_change", new_value: newValue })],
        error: null,
      });
      expect(
        await getOrderCancellation("o-1"),
        `new_value: ${JSON.stringify(newValue)}`
      ).toBeNull();
    }
  });

  it("reads order_audit_log through the SERVICE client", async () => {
    // Its RLS is admin-only for SELECT (baseline:2291), so a customer-scoped
    // client reads nothing. Callers prove ownership before calling — both
    // current ones match user_id in the query that fetched the order.
    rows.mockResolvedValue({ data: [], error: null });
    await getOrderCancellation("o-1");

    expect(createServiceClient).toHaveBeenCalled();
    expect(from).toHaveBeenCalledWith("order_audit_log");
  });

  it("scopes to this order's cancellation-bearing rows only", async () => {
    rows.mockResolvedValue({ data: [], error: null });
    await getOrderCancellation("o-42");

    // Without BOTH filters a service-client read would reach other orders'
    // audit rows, or return a refund/edit entry as if it were a cancellation.
    expect(applied).toEqual([
      ["order_id", "o-42"],
      ["action", ["cancel", "status_change"]],
    ]);
  });

  it("takes the most recent cancellation row, not just any of them", async () => {
    // An order is cancelled once in practice, so this is belt not braces —
    // but without it a dropped .order() would return the OLDEST cancel row on
    // any order that somehow has two, and the suite would stay green.
    rows.mockResolvedValue({ data: [], error: null });
    await getOrderCancellation("o-1");

    expect(ordered).toEqual([["created_at", { ascending: false }]]);
    // Bounded: the scan is a small indexed page, never the whole audit trail.
    expect(limited).toEqual([10]);
  });

  it("returns null when the order was never cancelled", async () => {
    rows.mockResolvedValue({ data: [], error: null });
    expect(await getOrderCancellation("o-1")).toBeNull();
  });

  it("withholds the reason when the admin chose NOT to notify the customer", async () => {
    // reason is one required free-text field with no customer-copy/internal
    // split, so an admin opting out of the email may have written it for staff
    // ("suspected card fraud — hold refund"). Showing it anyway would override
    // an explicit choice. The timestamp is still safe to surface.
    for (const action of ["cancel", "status_change"]) {
      rows.mockResolvedValue({
        data: [
          auditRow({
            action,
            reason: "suspected card fraud — hold refund pending review",
            new_value: { status: "cancelled", notified: false },
          }),
        ],
        error: null,
      });

      expect(await getOrderCancellation("o-1"), `action: ${action}`).toEqual({
        cancelledAt: "2026-08-04T01:00:00Z",
        reason: null,
      });
    }
  });

  it("withholds the reason on a row written before the flag existed", async () => {
    // Absent means unknowable. Withholding degrades to the pre-existing
    // behaviour (no reason shown); showing could leak a staff note. A legacy
    // 'cancel' row still counts AS a cancellation whatever its new_value shape,
    // because that route only ever cancels — the timestamp still shows.
    for (const newValue of [{ status: "cancelled" }, null, "cancelled", ["cancelled"]]) {
      rows.mockResolvedValue({
        data: [auditRow({ reason: "internal note", new_value: newValue })],
        error: null,
      });
      expect(
        (await getOrderCancellation("o-1"))?.reason,
        `new_value: ${JSON.stringify(newValue)}`
      ).toBeNull();
    }
  });

  it("keeps a null reason null — an admin can cancel without giving one", async () => {
    rows.mockResolvedValue({ data: [auditRow({ reason: null })], error: null });

    expect(await getOrderCancellation("o-1")).toEqual({
      cancelledAt: "2026-08-04T01:00:00Z",
      reason: null,
    });
  });

  it("reports a query failure instead of letting it read as 'no reason'", async () => {
    rows.mockResolvedValue({ data: null, error: { message: "boom" } });

    expect(await getOrderCancellation("o-1")).toBeNull();
    expect(loggerException).toHaveBeenCalled();
  });

  it("survives a thrown error, because it only decorates a page", async () => {
    rows.mockRejectedValue(new Error("network"));

    expect(await getOrderCancellation("o-1")).toBeNull();
    expect(loggerException).toHaveBeenCalled();
  });
});

describe("the writers that this reader depends on", () => {
  /**
   * The gate above is only worth anything if the admin routes actually record
   * `notified`. Nothing else pins that: neither route has a unit test (they
   * drive Stripe refunds and emails), so deleting the flag would leave every
   * suite green while silently withholding the reason from every future
   * cancellation — the exact silent-failure shape #230 and #231 were about,
   * one layer up.
   *
   * Source assertions rather than mocked routes: the coupling is a data
   * contract between three files, and no runtime test spans it.
   */
  it.each([
    ["cancel", "src/app/api/admin/orders/[id]/cancel/route.ts"],
    ["status", "src/app/api/admin/orders/[id]/status/route.ts"],
  ])("the %s route writes notified onto its audit row", (_name, path) => {
    const route = readFileSync(join(process.cwd(), path), "utf8").replace(/^\s*\/\/.*$/gm, ""); // strip comments — they discuss `notified` too

    const insert = route.slice(route.indexOf('from("order_audit_log")'));
    const call = insert.slice(0, insert.indexOf("});"));

    expect(call, "the audit insert no longer records notifyCustomer").toMatch(
      /notified:\s*notifyCustomer/
    );
  });

  /**
   * And that the status route can still reach `cancelled` at all — if that
   * transition were removed the widened filter would be dead weight, and if a
   * new one were added (out_for_delivery -> cancelled) this reader would pick
   * it up for free. Pinning the set makes either change visible here.
   */
  it("the status route still transitions orders into cancelled", () => {
    const route = readFileSync(
      join(process.cwd(), "src/app/api/admin/orders/[id]/status/route.ts"),
      "utf8"
    );
    const table = route.slice(
      route.indexOf("const VALID_TRANSITIONS"),
      route.indexOf("interface OrderRow")
    );

    expect(table).toMatch(/pending:\s*\[[^\]]*"cancelled"/);
    expect(table).toMatch(/pending_approval:\s*\[[^\]]*"cancelled"/);
    expect(table).toMatch(/confirmed:\s*\[[^\]]*"cancelled"/);
    expect(table).toMatch(/preparing:\s*\[[^\]]*"cancelled"/);
  });
});
