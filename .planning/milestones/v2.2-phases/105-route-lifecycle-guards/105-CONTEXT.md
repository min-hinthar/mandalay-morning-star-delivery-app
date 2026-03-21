# Phase 105: Route Lifecycle Guards - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix driver route start blocker and admin override bypass. Drivers can start and proceed through assigned routes (accept before start), and admins cannot bypass lifecycle states (no setting `in_progress` without driver acceptance). Audit trail on admin overrides via Sentry events.

</domain>

<decisions>
## Implementation Decisions

### Transition map rules
- Define `VALID_ROUTE_TRANSITIONS` constant in `src/lib/validations/route.ts` (alongside existing `routeStatusSchema`)
- Export `isValidRouteTransition(from, to)` and `getValidRouteTransitions(current)` helpers
- Valid transitions:
  - `planned` → `assigned` (admin assigns driver)
  - `assigned` → `planned`, `accepted` (unassign or accept)
  - `accepted` → `planned`, `assigned`, `in_progress` (reset, reassign, or start)
  - `in_progress` → `completed` (only forward)
  - `completed` → nothing (terminal state, no transitions allowed)
- Both frontend (dropdown filter) and backend (PATCH guard) enforce same rules — shared constant prevents divergence

### Start endpoint fix
- Remove `planned` from start guard (line 57 of `start/route.ts`)
- Only `accepted` status allowed — lifecycle requires accept before start
- Error message: "Cannot start route — accept route first. Current status: {status}"
- This is Issue F from CONCERNS.md

### Admin PATCH lifecycle guard
- Add transition validation to `admin/routes/[id]/route.ts` before applying status changes
- Fetch current route status BEFORE building update object
- Reject invalid transitions with 400 + `{ error, validTransitions }` response
- Chain `.select("id")` on update to verify affected rows
- This is Issue G from CONCERNS.md

### Audit trail
- Sentry events, NOT a new DB table — REQUIREMENTS.md explicitly defers table as "overhead for solo operator"
- Emit `Sentry.captureMessage("Admin route status override", { level: "info", extra: { routeId, adminUserId, fromStatus, toStatus, timestamp } })`
- Inline Sentry call (SDK buffers internally), no need for `after()`

### Frontend dropdown filtering
- Update `RouteHeader.tsx` Select dropdown to disable invalid status options based on current status
- Import `getValidRouteTransitions` from shared validation
- Current status always shown (not disabled); invalid targets shown disabled
- Backend remains authoritative — frontend is UX only

### Timestamp clearing on downgrades
- Clear `accepted_at` when status changes to `assigned` (from any higher state)
- Set `started_at` when transitioning to `in_progress` (existing behavior, keep)
- Set `completed_at` when transitioning to `completed` (existing behavior, keep)
- Do NOT clear decline fields on status changes (they record history, not current state)

### Migration
- Re-backfill: convert any `planned` routes with `driver_id IS NOT NULL` to `assigned`
- Add CHECK constraint: `CHECK (status != 'planned' OR driver_id IS NULL)` — prevents future invalid state
- Must ship together with start endpoint fix — otherwise orphaned routes become permanently stuck

### No email notifications on admin overrides
- Admin made the change — no notification needed
- Decline email (existing) is driver-initiated, different use case
- Defer admin override notifications to future milestone

### Claude's Discretion
- Migration filename/number
- Exact Sentry event structure (tags vs extra)
- Test organization (inline vs separate test file)
- Whether to add admin PATCH error messages as toast in frontend
- Whether to log transition rejections at warn level in addition to 400 response

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Route lifecycle
- `.planning/phases/105-route-lifecycle-guards/105-PRECONTEXT-RESEARCH.md` — Full research: state machine, gotcha inventory, file map, gray area resolutions
- `.planning/phases/105-route-lifecycle-guards/105-ENHANCEMENT-RECOMMENDATIONS.md` — 12 ranked enhancements with implementation hints
- `.planning/codebase/CONCERNS.md` — Issue F (start blocker) and Issue G (admin override bypass)
- `.planning/research/PITFALLS.md` — Pitfall 3 (coupled fixes), Pitfall 8 (admin escape hatch)

### Requirements
- `.planning/REQUIREMENTS.md` — ROUTE-01 and ROUTE-03 definitions, out-of-scope audit table

### Prior phase contracts
- `.planning/phases/104-type-safety-api-corrections/104-CONTEXT.md` — Phase 104 decisions, type patterns
- `.planning/phases/104-type-safety-api-corrections/104-VERIFICATION.md` — Phase 104 completion verification

### Database migrations
- `supabase/migrations/20260316_route_status_enum_extend.sql` — 5-status enum definition
- `supabase/migrations/20260316_route_status_backfill.sql` — Original backfill + accept/decline columns
- `supabase/migrations/20260316_route_rpc_status_update.sql` — Split/merge RPC status handling
- `supabase/migrations/011_order_audit_log.sql` — Existing audit log pattern (for reference only)

### Learnings
- `.claude/learnings/data-schema.md` — PostgREST FK hints (CRITICAL for routes with 2 FKs to drivers)
- `.claude/learnings/testing.md` — Stale tests after validation rule changes
- `.claude/learnings/stripe.md` — `.update()` needs `.select("id")` for row count verification

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VALID_STOP_TRANSITIONS` in `src/lib/validations/driver-api.ts` — Pattern to follow for route transitions
- `isValidStatusTransition()` in same file — Function signature to replicate
- `order_audit_log` INSERT pattern — 6 files demonstrate the Sentry/audit approach
- `requireAdmin()` in `src/lib/auth/admin.ts` — Returns `{ success, supabase, userId }` for audit logging
- `STATUS_CONFIG` in `RouteHeader.tsx` — Already has all 5 status labels/icons/colors

### Established Patterns
- PostgREST FK hints: all routes→drivers queries use `!routes_driver_id_fkey` (4 files fixed in commit `1191f45e`)
- `.update().select("id")` for verifying affected rows (Phase 104 pattern)
- `after()` for fire-and-forget side effects on Vercel (decline email pattern)
- Service client for operations that null out `driver_id` (RLS bypass)
- Admin PATCH auto-transitions: assigning driver → `assigned`, unassigning → `planned` (existing logic to extend)

### Integration Points
- `src/lib/validations/route.ts` — Add `VALID_ROUTE_TRANSITIONS` alongside `routeStatusSchema`
- `src/app/api/driver/routes/[routeId]/start/route.ts:57` — Single line guard change
- `src/app/api/admin/routes/[id]/route.ts:340-366` — Status handling section to add guard before
- `src/components/ui/admin/routes/RouteDetailClient/RouteHeader.tsx:134-139` — Dropdown filtering
- `src/components/ui/admin/routes/RouteDetailClient/useStopMutations.ts:24-46` — Optimistic update handles rejection via existing try/catch

</code_context>

<specifics>
## Specific Ideas

No specific requirements — all decisions driven by CONCERNS.md Issue F and Issue G analysis, PRECONTEXT-RESEARCH gray area resolutions, and REQUIREMENTS.md ROUTE-01/ROUTE-03 definitions. Implementation is surgical: ~100 lines across 5 files + 1 migration.

</specifics>

<deferred>
## Deferred Ideas

- Full audit log table for route status changes — deferred per REQUIREMENTS.md:52
- Force-override escape hatch for admin (bypass lifecycle with reason) — future milestone
- Admin status change confirmation dialog — nice UX improvement, not in v2.2 scope
- Email notification on admin status override — deferred, admin made the change
- Split/merge lifecycle guards — existing RPCs already reset to `assigned`, out of scope

</deferred>

---

*Phase: 105-route-lifecycle-guards*
*Context gathered: 2026-03-19*
