# Phase 105: Route Lifecycle Guards — Enhancement Recommendations

Generated: 2026-03-19 | 12-agent protocol

---

## Priority Matrix

| # | Enhancement | Priority | Effort | Risk |
|---|---|---|---|---|
| 1 | VALID_ROUTE_TRANSITIONS constant | MUST-HAVE | S | None |
| 2 | Start endpoint: remove `planned` | MUST-HAVE | XS | Low |
| 3 | Admin PATCH lifecycle guard | MUST-HAVE | M | Medium |
| 4 | Frontend dropdown filtering | MUST-HAVE | S | Low |
| 5 | Re-backfill + CHECK constraint | MUST-HAVE | S | Low |
| 6 | Sentry audit logging | MUST-HAVE | S | None |
| 7 | Timestamp clearing on downgrades | MUST-HAVE | S | Low |
| 8 | Active route query cleanup | SHOULD-HAVE | XS | None |
| 9 | Admin PATCH error messages | SHOULD-HAVE | S | None |
| 10 | Transition validation unit tests | SHOULD-HAVE | M | None |
| 11 | Admin status change confirmation dialog | NICE-TO-HAVE | M | None |
| 12 | Force-override escape hatch | NICE-TO-HAVE | L | Medium |

---

## Detailed Recommendations

### 1. VALID_ROUTE_TRANSITIONS Constant [MUST-HAVE]

**What:** Define a shared transition map in `src/lib/validations/route.ts`, alongside existing `routeStatusSchema`. Export `VALID_ROUTE_TRANSITIONS`, `isValidRouteTransition()`, and `getValidRouteTransitions()`.

**Why:** Both backend (admin PATCH) and frontend (dropdown filter) need the same transition rules. A single constant prevents divergence and provides a test fixture for Phase 109 integration tests.

**Design compliance:** Follows the `VALID_STOP_TRANSITIONS` pattern already established in `driver-api.ts`.

**Implementation hint:**
```typescript
export const VALID_ROUTE_TRANSITIONS: Record<RouteStatus, RouteStatus[]> = {
  planned:     ["assigned"],
  assigned:    ["planned", "accepted"],
  accepted:    ["planned", "assigned", "in_progress"],
  in_progress: ["completed"],
  completed:   [],
};

export function isValidRouteTransition(from: RouteStatus, to: RouteStatus): boolean {
  return VALID_ROUTE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidRouteTransitions(current: RouteStatus): RouteStatus[] {
  return VALID_ROUTE_TRANSITIONS[current] ?? [];
}
```

---

### 2. Start Endpoint: Remove `planned` from Guard [MUST-HAVE]

**What:** Change `start/route.ts:57` from `route.status !== "planned" && route.status !== "accepted"` to `route.status !== "accepted"`.

**Why:** The lifecycle requires `assigned` → `accepted` → `in_progress`. Allowing `planned` bypasses the accept flow entirely. This is Issue F from CONCERNS.md — the root cause of "driver cannot start route" errors when routes are in `assigned` status.

**Design compliance:** Aligns driver flow with the 5-status lifecycle defined in Phase 101.

**Implementation hint:** Single line change. Update error message to: `"Cannot start route — accept route first. Current status: ${route.status}"`. Grep for tests referencing `planned` in start context and update expectations.

---

### 3. Admin PATCH Lifecycle Guard [MUST-HAVE]

**What:** Add transition validation to `admin/routes/[id]/route.ts` before applying status changes (lines 340-366). Reject invalid transitions with 400 and a clear error message.

**Why:** Currently admin can set ANY status from ANY state — including `in_progress` without driver acceptance (Issue G), or reversing completed routes. This creates orphaned states and data inconsistency.

**Design compliance:** Defense in depth — backend is the authoritative guard. Frontend filtering is UX only.

**Implementation hint:**
```typescript
if (status !== undefined) {
  const currentRoute = await fetchCurrentRoute(id);
  if (!isValidRouteTransition(currentRoute.status, status)) {
    return NextResponse.json({
      error: `Cannot transition route from "${currentRoute.status}" to "${status}"`,
      validTransitions: getValidRouteTransitions(currentRoute.status),
    }, { status: 400 });
  }
  // ... existing timestamp logic
}
```

**Gotcha:** Fetch current route status BEFORE the update, not after. The admin PATCH currently builds `routeUpdate` incrementally — status validation must happen before the object is applied.

---

### 4. Frontend Dropdown Filtering [MUST-HAVE]

**What:** Update `RouteHeader.tsx` to only show valid transition targets in the Select dropdown, based on current `route.status`.

**Why:** UX should prevent invalid actions before the user attempts them. Showing all 5 statuses when only 1-2 are valid creates confusion and wasted API calls.

**Design compliance:** Follows existing admin UI pattern — action buttons already conditionally render based on status (e.g., delete only for planned/assigned).

**Implementation hint:**
```tsx
import { getValidRouteTransitions } from "@/lib/validations/route";

const validTransitions = getValidRouteTransitions(route.status);

// In Select component:
{Object.entries(STATUS_CONFIG).map(([value, config]) => (
  <SelectItem
    key={value}
    value={value}
    disabled={value !== route.status && !validTransitions.includes(value as RouteStatus)}
  >
    {config.label}
  </SelectItem>
))}
```

---

### 5. Re-Backfill + CHECK Constraint [MUST-HAVE]

**What:** Create a migration that: (1) converts any `planned` routes with `driver_id` to `assigned`, and (2) adds a CHECK constraint preventing this invalid state.

**Why:** The initial backfill (Phase 101) ran once, but admin PATCH can create new `planned`+`driver_id` combos. The CHECK constraint is the only durable prevention.

**Design compliance:** Idempotent migration pattern per `supabase-auth.md` learnings.

**Implementation hint:**
```sql
-- Re-backfill orphaned routes
UPDATE routes SET status = 'assigned'
WHERE driver_id IS NOT NULL AND status = 'planned';

-- Prevent future invalid state
ALTER TABLE routes ADD CONSTRAINT chk_planned_unassigned
  CHECK (status != 'planned' OR driver_id IS NULL);
```

**Gotcha:** Must ship WITH the start endpoint fix. Otherwise, fixing the start guard makes any remaining `planned`+`driver_id` routes permanently stuck.

---

### 6. Sentry Audit Logging [MUST-HAVE]

**What:** Emit a Sentry event on every admin status override with: admin user ID, route ID, previous status, new status, timestamp.

**Why:** Success Criterion 4 requires "logged with timestamp and previous state." REQUIREMENTS.md defers a full audit table, so Sentry is the lightweight alternative.

**Design compliance:** Existing Sentry integration captures errors; this extends to operational events.

**Implementation hint:**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.captureMessage("Admin route status override", {
  level: "info",
  tags: { action: "route_status_override" },
  extra: {
    routeId: id,
    adminUserId: auth.userId,
    fromStatus: currentRoute.status,
    toStatus: status,
    timestamp: new Date().toISOString(),
  },
});
```

**Gotcha:** Use `after()` if Sentry call is non-blocking, or inline if fast enough (Sentry SDK buffers, so inline is fine).

---

### 7. Timestamp Clearing on Downgrades [MUST-HAVE]

**What:** When admin changes status to `assigned`, clear `accepted_at`. When reviving a declined route (status changes away from `planned`), clear decline fields.

**Why:** Timestamps from a previous lifecycle become stale and misleading. A route showing `accepted_at: 2026-03-15` but `status: assigned` implies the driver accepted but is contradicted by the status.

**Design compliance:** Data consistency — timestamps reflect the current lifecycle position.

**Implementation hint:**
```typescript
if (status === "assigned") {
  routeUpdate.accepted_at = null;
}
if (status === "in_progress") {
  routeUpdate.started_at = new Date().toISOString();
}
if (status === "completed") {
  routeUpdate.completed_at = new Date().toISOString();
}
```

---

### 8. Active Route Query Cleanup [SHOULD-HAVE]

**What:** Remove `"planned"` from the active route query filter in `active/route.ts:170`.

**Why:** After the CHECK constraint, `planned` routes always have `driver_id: null`. The query already filters by `driver_id = driverId`, so `planned` results are logically impossible. Removing it makes intent clearer.

**Design compliance:** Code hygiene — query filter matches reality.

**Implementation hint:** Change `.in("status", ["assigned", "accepted", "planned", "in_progress"])` to `.in("status", ["assigned", "accepted", "in_progress"])`. Same change in driver SSR page query.

---

### 9. Admin PATCH Error Messages [SHOULD-HAVE]

**What:** Return the list of valid transitions in the 400 error response when an invalid transition is rejected.

**Why:** Admin sees "Cannot transition from assigned to completed" but doesn't know what IS valid. Including `validTransitions: ["planned", "accepted"]` saves a round-trip to documentation.

**Design compliance:** Professional error messaging per brand guidelines — context-specific, not generic.

**Implementation hint:** Already shown in Enhancement #3 code snippet. Add `validTransitions` array to error response body.

---

### 10. Transition Validation Unit Tests [SHOULD-HAVE]

**What:** Add unit tests for `VALID_ROUTE_TRANSITIONS`, `isValidRouteTransition()`, and `getValidRouteTransitions()`. Test every valid and invalid transition pair.

**Why:** Phase 109 will add integration tests for the full lifecycle, but unit tests for the transition logic itself catch regressions immediately. The `VALID_STOP_TRANSITIONS` tests caught a Phase 83 regression.

**Design compliance:** TDD pattern established in Phase 101 (14 tests before implementation).

**Implementation hint:** 5×5 matrix = 25 transition pairs. Test each: 8 should pass, 17 should fail. Add to `src/lib/validations/__tests__/route.test.ts`.

---

### 11. Admin Status Change Confirmation Dialog [NICE-TO-HAVE]

**What:** Show a confirmation dialog when admin selects a new status from the dropdown, showing current → new status and asking "Are you sure?"

**Why:** Status changes are consequential (e.g., starting a route transitions all orders). A confirmation prevents accidental clicks, especially on mobile where the 44px touch targets can be hit accidentally.

**Design compliance:** Follows `DeclineConfirmDialog` pattern from driver flow. Uses existing `ConfirmDialog` component.

**Implementation hint:** Wrap `handleStatusChange` in a dialog trigger. Show current status badge → arrow → new status badge. "Confirm" and "Cancel" buttons.

---

### 12. Force-Override Escape Hatch [NICE-TO-HAVE]

**What:** Allow admin to bypass lifecycle guards with an explicit "Force Override" checkbox + mandatory reason field. Log force overrides with higher Sentry severity.

**Why:** PITFALLS.md Pitfall 8: "Admin uses direct status overrides as emergency escape hatch." Strict guards without any bypass mean admin must resort to raw SQL for emergencies.

**Design compliance:** Not in v2.2 scope — deferred. If implemented, require `body.force: true` + `body.reason: string` in PATCH payload. Emit `Sentry.captureMessage` at `warning` level.

**Implementation hint:** Add `force` and `reason` to `updateRouteSchema`. In guard logic: if `!isValidRouteTransition(from, to) && !body.force`, reject. If `body.force && !body.reason`, reject with "Reason required." If both provided, allow but log prominently.

---

## Implementation Sequence

```
Phase 105 Plan Structure:

Plan 1: Validation + Driver Fix
  - Add VALID_ROUTE_TRANSITIONS to route.ts (#1)
  - Fix start endpoint (#2)
  - Add unit tests (#10)

Plan 2: Admin Guard + Frontend + Migration
  - Admin PATCH lifecycle guard (#3)
  - Frontend dropdown filtering (#4)
  - Timestamp clearing (#7)
  - Sentry audit logging (#6)
  - Re-backfill migration + CHECK constraint (#5)
  - Active route query cleanup (#8)
  - Error messages (#9)
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Orphaned `planned`+`driver_id` routes | Medium | High — permanently stuck | Re-backfill migration runs before CHECK |
| Admin loses emergency override | Low | Medium — must use SQL | Document SQL escape hatch in ops guide |
| Frontend/backend transition rules diverge | Low | Medium — confusing UX | Shared `VALID_ROUTE_TRANSITIONS` constant |
| Existing tests break from start guard change | Medium | Low — test update needed | Grep for `'planned'` in test files before change |
| CHECK constraint blocks valid admin operation | Low | High — 500 error | Test all admin flows before shipping |
