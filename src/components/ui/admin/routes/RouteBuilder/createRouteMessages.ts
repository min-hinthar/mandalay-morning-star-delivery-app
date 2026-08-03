/**
 * Turning a create-route HTTP response into something an admin can act on.
 *
 * Extracted from RouteBuilderClient so the message logic is unit-testable —
 * it was module-private and therefore untested, which is how the success
 * branch quietly discarded every outcome the API distinguishes.
 */

/**
 * Turn a failed create-route response into something the admin can act on.
 *
 * The API already returns WHICH orders blocked the batch (invalidOrderIds /
 * unpaidOrderIds / assignedOrderIds) — the old handler read only the top-level
 * `error` string and dropped them, so "Some orders are already assigned to
 * active routes" left the admin to guess which of 30 selected orders it meant.
 *
 * Also stops assuming a non-OK body is JSON: a gateway 502/504 or an auth
 * redirect returns HTML, and the bare `response.json()` threw a SyntaxError
 * that surfaced as "Unexpected token '<'" instead of anything useful.
 */
export async function describeRouteError(response: Response): Promise<string> {
  let payload: Record<string, unknown> | null = null;
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    return `Failed to create route (server returned ${response.status})`;
  }

  const base = typeof payload?.error === "string" ? payload.error : "Failed to create route";
  const idLists: Array<[string, string]> = [
    ["unpaidOrderIds", "unpaid"],
    ["invalidOrderIds", "not ready"],
    ["assignedOrderIds", "already routed"],
  ];

  const details = idLists
    .map(([key, label]) => {
      const ids = payload?.[key];
      if (!Array.isArray(ids) || ids.length === 0) return null;
      // Short ids keep the toast readable; the full set is rarely needed to act.
      const shown = ids.slice(0, 3).map((id) => String(id).slice(0, 8));
      const more = ids.length > shown.length ? ` +${ids.length - shown.length} more` : "";
      return `${label}: ${shown.join(", ")}${more}`;
    })
    .filter(Boolean);

  return details.length > 0 ? `${base} — ${details.join("; ")}` : base;
}

/**
 * Read what a SUCCESSFUL create actually produced.
 *
 * The route is created either way, but POST /api/admin/routes distinguishes
 * outcomes the admin needs — stops that will miss their delivery window,
 * auto-optimization being switched off, optimization skipped for missing
 * coordinates — and the handler used to throw all of it away behind a fixed
 * "Route created successfully".
 *
 * Mirrors describeRouteError's defensiveness: a 2xx whose body is not JSON
 * (a proxy rewriting the response, say) must not turn a successful create
 * into a thrown SyntaxError caught by the error branch — that would tell the
 * admin the route FAILED when it exists.
 */
export async function readRouteCreateOutcome(
  response: Response
): Promise<{ message: string; hasWindowViolations: boolean }> {
  const fallback = { message: "Route created successfully", hasWindowViolations: false };
  try {
    const payload = (await response.json()) as Record<string, unknown> | null;
    const violations = payload?.timeWindowViolations;
    const hasWindowViolations = Array.isArray(violations) && violations.length > 0;

    if (typeof payload?.message === "string") {
      return { message: payload.message, hasWindowViolations };
    }

    // No usable message. Unreachable under today's server contract (the route
    // always sends one alongside violations), but the fallback must not pair a
    // WARNING toast with the words "Route created successfully" — a warning
    // that reads as unqualified success is the exact dishonesty this file
    // exists to remove, and it would land the moment that contract drifts.
    return hasWindowViolations
      ? {
          message: `Route created — ${violations.length} stop(s) may miss their delivery window`,
          hasWindowViolations,
        }
      : fallback;
  } catch {
    return fallback;
  }
}
