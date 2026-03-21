# Phase 107: Data Integrity - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Atomic stop promotion RPC and dead code removal. Route stop promotion becomes race-free via PostgreSQL `FOR UPDATE SKIP LOCKED`, and driver delivery counts are accurate by removing the dead `increment_driver_deliveries` RPC call that would double-count if it ever existed. No UI changes, no new endpoints, no schema changes beyond the new RPC function.

</domain>

<decisions>
## Implementation Decisions

### Atomic stop promotion RPC design
- Create `promote_next_stop(p_route_id uuid, p_completed_stop_id uuid)` PostgreSQL function
- Use `FOR UPDATE SKIP LOCKED` to atomically select and lock the next pending stop — prevents double-promotion on concurrent requests within 500ms
- `RETURNS jsonb` with `{ promoted_stop_id: uuid | null, stop_index: int | null }` — flexible, includes all client-needed info
- Validate completed stop belongs to route AND is in terminal state (`delivered` or `skipped`) before promotion
- Call `PERFORM update_route_stats(p_route_id)` inside the RPC — atomic with promotion, stats always reflect current state
- Use `RAISE EXCEPTION` with `ERRCODE = 'invalid_parameter_value'` for validation failures — match existing RPC error pattern
- `SECURITY DEFINER SET search_path = public` — match all existing RPCs in the codebase
- `CREATE OR REPLACE FUNCTION` — idempotent definition, safe for re-runs
- When no pending stops remain, return `{ promoted_stop_id: null, stop_index: null }` — no error, graceful completion
- Order pending stops by `stop_index ASC` — next stop is always the lowest-indexed pending one
- Lock only a single row (`LIMIT 1`) — minimal lock contention
- SELECT...INTO pattern with `v_` prefixed variables — match existing `split_route`/`merge_routes` convention

### Dead code removal
- Remove `increment_driver_deliveries` RPC call from `complete/route.ts` lines 108-118 (the try/catch block)
- Remove the `logger.info("increment_driver_deliveries RPC not available, skipping")` dead log path
- Remove `increment_driver_deliveries` type entry from `src/types/database.ts` Functions section
- Do NOT remove `calculate_route_stats` SQL function — rollback chain risk, defer unless explicitly scoped
- Do NOT create a DROP FUNCTION migration — the RPC never existed as a SQL function, only as a TypeScript call
- Do NOT update existing tests — no stop completion tests exist (Phase 109 scope)
- Leave `update_driver_deliveries_count` trigger completely untouched — it's the sole source of truth for delivery counts, firing AFTER UPDATE on `route_stops` when `status = 'delivered'`
- Badge logic's `deliveries_count` read is correct — trigger fires per-stop during delivery, badge check reads post-trigger count at route completion

### Stop handler TypeScript changes
- Replace inline SELECT+UPDATE promotion (lines 165-187 of `stops/[stopId]/route.ts`) with single `supabase.rpc("promote_next_stop", { p_route_id, p_completed_stop_id })` call
- Remove the JS `updateRouteStats()` call at line 163 — now handled inside the RPC atomically
- Remove the local `updateRouteStats()` function definition (lines 206-235) — no longer called anywhere in this file
- Promotion failure is non-blocking — log at warn level and continue (match existing pattern)
- Stop status update already succeeded before promotion — never roll back the stop on promotion failure
- Response shape unchanged: `{ success, stop, orderUpdated?, nextStop }` — client compatibility preserved
- Parse `promotionResult.promoted_stop_id` and `promotionResult.stop_index` into existing `nextStop` object shape

### Route completion handler changes
- Remove the entire try/catch block at lines 108-118 that calls `increment_driver_deliveries`
- Badge logic (lines 120-163) stays unchanged — reads `deliveries_count` which is already accurate from per-stop trigger
- `totalDeliveries` calculation on line 131 adds `stats.delivered_stops` to `deliveries_count` — this double-counts NOW because trigger already incremented. But since the RPC never existed, `deliveries_count` was always 0, making this effectively `0 + stats.delivered_stops`. After Phase 107, trigger is authoritative, but badge logic reads current `deliveries_count` which includes all stop-level increments. The `+ stats.delivered_stops` on line 131 will double-count. **Flag this for planner to verify and fix if needed.**
- Keep completion rate formula as-is (delivered/total, different from stop handler's (delivered+skipped)/total) — not Phase 107 scope, note for Phase 109

### Error handling & resilience
- RPC failures caught in TypeScript, logged at warn level, not surfaced to client — promotion is best-effort after stop update succeeds
- Concurrent stop completions: SKIP LOCKED ensures second concurrent request gets a different pending stop or null — no double-promotion ever
- Stale data is acceptable — client gets current stop status in the response regardless of promotion outcome
- RPC exception propagation: catch in TypeScript with structured log context `{ api, routeId, stopId, error.message }`
- DB errors on the stop update itself (before RPC) still return 500 — no change to existing error path
- If RPC returns null `promoted_stop_id`, response includes `nextStop: null` — client interprets as "all stops done"

### Migration strategy
- Date-prefixed filename following Phase 106 migrations (e.g., `20260321_atomic_stop_promotion.sql`)
- No constraint deferral needed — promotion changes `status` column, not `stop_index`, so DEFERRABLE UNIQUE on `(route_id, stop_index)` is irrelevant
- Triggers fire normally inside RPC transaction — `update_driver_deliveries_count` fires when status changes to 'delivered' (but promotion sets to 'enroute', so trigger does NOT fire during promotion — only during the initial stop status update before RPC call)
- `prevent_duplicate_active_assignment` trigger only fires on INSERT — not relevant to status UPDATE
- `update_updated_at_column` trigger fires on UPDATE — harmless, sets `updated_at = NOW()`
- Deploy order: migration first (creates function), then TypeScript changes (calls function)
- No separate DOWN migration — `CREATE OR REPLACE` is idempotent, matches project convention
- Migration must come after `20260320_route_lifecycle_guards.sql` (Phase 105)

### Type safety
- Add `promote_next_stop` to `src/types/database.ts` Functions section with `Args: { p_route_id: string; p_completed_stop_id: string }; Returns: Json`
- Remove `increment_driver_deliveries` entry from Functions section (if it exists — verify before removing)
- No full `supabase gen types` regeneration — manual entry matches Phase 104 pattern
- Cast RPC result to typed interface: `{ promoted_stop_id: string | null; stop_index: number | null }`

### Observability
- Log successful promotions at info level: `{ api, routeId, stopId, promotedStopId, stopIndex }`
- Log promotion failures at warn level: `{ api, routeId, stopId, error.message }`
- Log "no pending stops remaining" at info level (normal completion path, not an error)
- No Sentry events — stop promotion is a normal operation, not an admin override requiring audit trail
- No new monitoring alerts needed — existing driver action rate limiter covers stop operations
- Dead code removal logging: remove the "RPC not available" log — it fires on every route completion and provides no signal

### Claude's Discretion
- Exact migration date prefix (use current date at planning time)
- Whether to extract RPC result type interface vs inline type assertion
- Log message wording and structured context field names
- Whether to add a code comment explaining why `updateRouteStats` was removed from TypeScript
- Test organization if any validation tests are added
- Whether badge `totalDeliveries` double-count is actually triggered (depends on whether trigger was ever applied in production)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stop promotion
- `.planning/phases/107-data-integrity/107-PRECONTEXT-RESEARCH.md` — Full analysis: proposed RPC implementation, data contracts, gotcha inventory (G1-G15), file map, gray area resolutions, constraint inventory
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` — Current stop handler with inline SELECT+UPDATE race condition (lines 165-187) and local `updateRouteStats` function (lines 206-235)
- `src/lib/validations/driver-api.ts` — `VALID_STOP_TRANSITIONS` and `isValidStatusTransition()` — stop status validation

### Dead code
- `src/app/api/driver/routes/[routeId]/complete/route.ts` — Route completion handler with dead `increment_driver_deliveries` call (lines 108-118) and badge logic (lines 120-163)
- `supabase/migrations/001_functions_triggers.sql` — `update_driver_deliveries_count` trigger definition (sole source of truth)

### RPC patterns
- `supabase/migrations/20260312_route_pipeline_hardening.sql` — `update_route_stats()`, `reindex_route_stops()`, `batch_update_stop_statuses()` — existing RPC patterns to follow (SECURITY DEFINER, naming, error handling)
- `supabase/migrations/20260312_delivery_direction_zones.sql` — Recent migration naming convention

### Database constraints
- `supabase/migrations/20260313_fix_stop_index_unique_deferrable.sql` — DEFERRABLE UNIQUE on `(route_id, stop_index)` — not impacted by status-only updates
- `supabase/migrations/000_initial_schema.sql` — `route_stops` table definition, indexes, base constraints

### Prior phase contracts
- `.planning/phases/104-type-safety-api-corrections/104-CONTEXT.md` — Type patterns, manual database.ts maintenance, `.update().select("id")`
- `.planning/phases/105-route-lifecycle-guards/105-CONTEXT.md` — Lifecycle guards, VALID_ROUTE_TRANSITIONS, Sentry audit pattern
- `.planning/phases/106-timezone-correctness/106-CONTEXT.md` — Utility reuse pattern, existing function over new code

### Requirements
- `.planning/REQUIREMENTS.md` — DATA-01 (atomic stop promotion) and DATA-02 (remove dead RPC call)

### Learnings
- `.claude/learnings/data-schema.md` — PostgREST FK hints, CREATE OR REPLACE pattern
- `.claude/learnings/testing.md` — Mock shape matching for `.rpc()` calls
- `CLAUDE.md` — `void asyncFn()` killed on Vercel, `.update()` needs `.select("id")`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `update_route_stats(p_route_id)` SQL RPC — called inside new `promote_next_stop` via PERFORM
- `reindex_route_stops(p_route_id)` SQL RPC — available if stop_index reordering ever needed (not needed for promotion)
- `VALID_STOP_TRANSITIONS` in `driver-api.ts` — stop status validation already enforced before promotion
- `isValidStatusTransition()` in `driver-api.ts` — guards against invalid stop transitions
- `requireDriver()` in `lib/auth` — returns `{ success, supabase, driverId }` — already used in both handlers
- `logger.warn()` / `logger.info()` — structured logging with context objects — used throughout

### Established Patterns
- SECURITY DEFINER + SET search_path = public on all RPCs
- `p_` prefix for function parameters, `v_` prefix for local variables
- `RAISE EXCEPTION ... USING ERRCODE = '...'` for validation errors
- `PERFORM` to call other RPCs without capturing return value
- `CREATE OR REPLACE FUNCTION` for idempotent migrations
- `.rpc("name", { params })` for TypeScript → PostgreSQL RPC calls
- Non-blocking side effects: catch errors, log, continue
- `returns<Type[]>()` for typed Supabase query results

### Integration Points
- `stops/[stopId]/route.ts:165-187` — Replace inline promotion with RPC call
- `stops/[stopId]/route.ts:163` — Remove `updateRouteStats()` call (now inside RPC)
- `stops/[stopId]/route.ts:206-235` — Remove local `updateRouteStats()` function
- `complete/route.ts:108-118` — Remove dead `increment_driver_deliveries` block
- `src/types/database.ts` Functions section — Add `promote_next_stop`, remove `increment_driver_deliveries`
- `supabase/migrations/` — New migration file for RPC

</code_context>

<specifics>
## Specific Ideas

- Research already includes complete proposed RPC implementation (Section 12 of PRECONTEXT-RESEARCH.md) — use as starting point, verify against current codebase state
- Badge `totalDeliveries` on line 131 of `complete/route.ts` may double-count after trigger is authoritative — planner should verify current production `deliveries_count` values and decide if fix is needed
- Completion rate formula inconsistency (stop handler vs complete handler) is documented but deferred to Phase 109
- At current scale (20-50 orders, 2-4 drivers), race condition is rare but correctness fix prevents data corruption on driver double-taps or network retries

</specifics>

<deferred>
## Deferred Ideas

- Integration tests for stop promotion — Phase 109 (QUAL-01)
- `calculate_route_stats` dead SQL function removal — rollback chain risk, needs explicit scoping
- Completion rate formula alignment (stop handler vs complete handler) — Phase 109 or future
- Badge `totalDeliveries` double-count investigation — verify in planning, fix if confirmed
- Full `supabase gen types` CLI regeneration — too risky with manual additions
- Replace JS `updateRouteStats` in other files with SQL RPC — larger refactor

</deferred>

---

*Phase: 107-data-integrity*
*Context gathered: 2026-03-20*
