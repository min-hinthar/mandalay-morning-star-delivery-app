/**
 * POST /api/admin/routes returns more than "did it work".
 *
 * On SUCCESS it distinguishes: optimized · optimized with N time-window
 * violations · not optimized because auto-optimization is off · not optimized
 * for missing coordinates. The route builder used to collapse all four into a
 * hardcoded "Route created successfully", so an admin was never told that
 * stops on the route they just built will arrive AFTER their delivery window
 * closes — the one outcome that needs acting on while the route is still
 * editable.
 *
 * On FAILURE it returns WHICH orders blocked the batch. That half was fixed in
 * #225 but never unit-tested, because both helpers were module-private.
 */

import { describe, it, expect } from "vitest";
import { describeRouteError, readRouteCreateOutcome } from "../createRouteMessages";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** A gateway 502 / auth redirect: 2xx or not, the body is HTML. */
function html(status: number): Response {
  return new Response("<!doctype html><title>Gateway Timeout</title>", {
    status,
    headers: { "content-type": "text/html" },
  });
}

describe("readRouteCreateOutcome", () => {
  it("surfaces the time-window violation message and flags it as a warning", async () => {
    const res = await readRouteCreateOutcome(
      json({
        optimized: true,
        timeWindowViolations: [{ stopId: "s1", minutesLate: 25 }],
        message: "Route created and optimized with 1 time window warning(s)",
      })
    );

    expect(res.message).toMatch(/time window warning/i);
    // The route exists either way — but a stop that misses its window is the
    // one outcome the admin has to act on, so it must not read as plain success.
    expect(res.hasWindowViolations).toBe(true);
  });

  it("surfaces the auto-optimization-off message WITHOUT crying wolf", async () => {
    const res = await readRouteCreateOutcome(
      json({
        optimized: false,
        message: "Route created (auto-optimization is off in Settings → Operations)",
      })
    );

    expect(res.message).toMatch(/auto-optimization is off/i);
    // Deliberately configured, not a problem — success, not warning.
    expect(res.hasWindowViolations).toBe(false);
  });

  it("surfaces the missing-coordinates reason rather than a blanket success", async () => {
    const res = await readRouteCreateOutcome(
      json({
        optimized: false,
        message: "Route created (not optimized — missing coordinates or single stop)",
      })
    );

    expect(res.message).toMatch(/missing coordinates/i);
    expect(res.hasWindowViolations).toBe(false);
  });

  it("treats an EMPTY violations array as no violations", async () => {
    // The API omits the key when empty, but an empty array must not trip the
    // warning — `Array.isArray([])` is true.
    const res = await readRouteCreateOutcome(
      json({ optimized: true, timeWindowViolations: [], message: "Route created and optimized" })
    );

    expect(res.hasWindowViolations).toBe(false);
  });

  it("falls back to plain success when a 2xx body is not JSON", async () => {
    // A proxy rewriting a successful response must not make the UI claim the
    // create FAILED — the route exists. Throwing here would land in the
    // handler's catch and show an error toast for a route that was created.
    const res = await readRouteCreateOutcome(html(200));

    expect(res.message).toBe("Route created successfully");
    expect(res.hasWindowViolations).toBe(false);
  });

  it("never pairs a warning with the word 'successfully' when the message is missing", async () => {
    // Unreachable under today's server contract, but a warning-styled toast
    // reading "Route created successfully" is self-contradictory — precisely
    // the dishonesty this module removes.
    const res = await readRouteCreateOutcome(
      json({ optimized: true, timeWindowViolations: [{ stopId: "s1" }, { stopId: "s2" }] })
    );

    expect(res.hasWindowViolations).toBe(true);
    expect(res.message).not.toMatch(/successfully/i);
    expect(res.message).toMatch(/2 stop/);
  });

  it("falls back when message is present but not a string", async () => {
    const res = await readRouteCreateOutcome(json({ message: { nested: "oops" } }));

    expect(res.message).toBe("Route created successfully");
  });
});

describe("describeRouteError", () => {
  it("names the offending orders instead of leaving the admin to guess", async () => {
    const msg = await describeRouteError(
      json(
        {
          error: "Some orders are already assigned to active routes",
          assignedOrderIds: ["11111111-aaaa", "22222222-bbbb"],
        },
        400
      )
    );

    expect(msg).toMatch(/already routed/);
    expect(msg).toContain("11111111");
  });

  it("caps the id list so the toast stays readable", async () => {
    const msg = await describeRouteError(
      json({ error: "Unpaid orders", unpaidOrderIds: ["a1", "b2", "c3", "d4", "e5"] }, 400)
    );

    expect(msg).toMatch(/\+2 more/);
  });

  it("reports the status instead of throwing when the body is HTML", async () => {
    // Regression guard: a bare response.json() here threw a SyntaxError that
    // surfaced to the admin as "Unexpected token '<'".
    const msg = await describeRouteError(html(504));

    expect(msg).toMatch(/504/);
    expect(msg).not.toMatch(/Unexpected token/);
  });

  it("falls back to a generic error when the body has no error string", async () => {
    expect(await describeRouteError(json({}, 500))).toBe("Failed to create route");
  });
});
