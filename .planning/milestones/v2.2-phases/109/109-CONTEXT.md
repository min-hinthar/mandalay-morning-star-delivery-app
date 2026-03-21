# Phase 109: Quality & Maintenance - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning
**Mode:** Auto-resolved — all gray areas pre-resolved at VERY HIGH confidence via deep precontext research

<domain>
## Phase Boundary

Integration tests covering the full driver route lifecycle (accept → start → stop arrive → stop deliver → next-stop promoted → route complete) and splitting the oversized webhook `handlers.ts` (529 lines) into per-event-type files with barrel re-export. No new endpoints, no UI changes, no admin test coverage.

</domain>

<decisions>
## Implementation Decisions

### Test scope
- **D-01:** Driver lifecycle only — QUAL-01 says "driver route lifecycle". Admin PATCH is Phase 105 (ROUTE-03, already shipped).
- **D-02:** Stop skip path included — both `delivered` and `skipped` are terminal states that trigger `promote_next_stop`. Must verify both paths.
- **D-03:** Decline route excluded — `declined` is not a RouteStatus value; decline resets to `planned`, not part of lifecycle path.

### Test approach
- **D-04:** Handler imports with mocked deps (all 48 existing tests use this pattern). No HTTP server, no supertest, no fetch against localhost.
- **D-05:** Mock Supabase via `vi.mock()` for `@/lib/auth`, `@/lib/rate-limit`, `@/lib/utils/logger`, `@/lib/badges`, `@/lib/supabase/server`. Manual query chain mocks via `fromMock` dispatching on table name.
- **D-06:** Mock `checkAndAwardBadges` import directly — returns `[]`. Don't mock the 4 internal badge queries.
- **D-07:** RPC mocked: `supabase.rpc("promote_next_stop", args)` returns `{ data: { promoted_stop_id, stop_index }, error: null }` or nulls for SKIP LOCKED contention.

### Test state management
- **D-08:** Mutable shared state within a single test — `routeState` and `stopStates` objects. Mock `update()` mutates state so subsequent `select()` returns updated values.
- **D-09:** Sequential handler calls in ONE `it()` block — state evolves: accept → start → stop update → complete.
- **D-10:** Pattern proven by rate-limit burst tests: 15 sequential calls sharing in-memory state.

### Test file organization
- **D-11:** Single file: `src/app/api/driver/routes/__tests__/lifecycle.test.ts` (~400-500 lines).
- **D-12:** Parent-level `__tests__` for cross-cutting integration tests (precedent: `src/lib/__tests__/rls-edge-cases.test.ts`).
- **D-13:** Route/stop factories added to `src/test/factories/index.ts` — `createMockRoute(overrides?)`, `createMockStop(overrides?)`, `createMockRouteWithStops(n, routeStatus, stopStatus)`.

### Test coverage
- **D-14:** Full lifecycle sequence test: accept → start → stop arrive → stop deliver → promoted → route complete. Each step verifies status transition.
- **D-15:** Stop promotion RPC verification: correct args passed, response correctly included in handler response.
- **D-16:** Error paths: 400 (invalid transition), 401 (auth failure), 403 (wrong driver), 404 (route not found), 500 (DB error).
- **D-17:** Concurrent stop delivery: second call gets `promoted_stop_id: null` from SKIP LOCKED — handler returns without `nextStop`.
- **D-18:** Badge failure resilience: route completion succeeds with `newBadges: []` even when badge check throws.
- **D-19:** Route with no stops: `firstStopId: null`, `ordersTransitioned: 0`.

### Handler split
- **D-20:** Split `handlers.ts` (529 lines) into `handlers/` directory with 4 per-event-type files + barrel `index.ts`.
- **D-21:** Kebab-case naming: `checkout-session-completed.ts`, `checkout-session-expired.ts`, `payment-failed.ts`, `charge-refunded.ts` (zero dot-notation filenames in codebase; `get-handler.ts` precedent from Phase 105).
- **D-22:** Barrel re-exports all 4 handlers — `route.ts` import `from "./handlers"` resolves to `./handlers/index.ts` via Node module resolution. Zero import changes.
- **D-23:** Remove `/* eslint-disable max-lines */` from original file. All split files under 400 lines.
- **D-24:** Existing `route.test.ts` does NOT import from `./handlers` — mocks at module level, imports route. Zero test changes needed.

### Mock chain accuracy
- **D-25:** Accept handler: 2 chains (select+single, update+select).
- **D-26:** Start handler: 6 chains (route select, route update WITHOUT `.select()`, first stop select, stop enroute update, order_ids select, orders batch update). NOTE: start's `.update()` has no `.select()` chain — accept does.
- **D-27:** Complete handler: 3 chains + `checkAndAwardBadges` mock.
- **D-28:** Stop handler: 4 chains + RPC. Order update only if delivered. Promotion only if delivered/skipped.

### Claude's Discretion
- Test describe/it block structure and naming
- Exact assertion style (toEqual vs toMatchObject vs individual expects)
- Factory default values (UUIDs, timestamps)
- Whether to use `it.each()` for error path parameterization
- Order of test cases within the file

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Route lifecycle handlers (test targets)
- `src/app/api/driver/routes/[routeId]/accept/route.ts` — Accept handler: 2 Supabase chains, guards on status/driver_id
- `src/app/api/driver/routes/[routeId]/start/route.ts` — Start handler: 6 chains, first stop enroute, batch order transition
- `src/app/api/driver/routes/[routeId]/complete/route.ts` — Complete handler: stats calc, non-blocking badge block
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` — Stop handler: transition validation, order update, promote_next_stop RPC

### Transition constants
- `src/lib/validations/route.ts` — `VALID_ROUTE_TRANSITIONS` constant (line 19-25)
- `src/lib/validations/driver-api.ts` — `VALID_STOP_TRANSITIONS`, `isValidStatusTransition()`, `updateStopStatusSchema`

### Webhook handler (split target)
- `src/app/api/webhooks/stripe/handlers.ts` — 529 lines, 4 handlers, `/* eslint-disable max-lines */`
- `src/app/api/webhooks/stripe/route.ts` — Consumer: imports all 4 handlers (lines 9-14)
- `src/app/api/webhooks/stripe/__tests__/route.test.ts` — Does NOT import handlers directly

### Test infrastructure
- `src/test/factories/index.ts` — Existing factories: `createMockMenuItem`, `createMockOrder`, `createMockAddress`
- `src/test/setup.ts` — Vitest setup with env vars, ResizeObserver, localStorage mocks
- `vitest.config.ts` — jsdom environment, globals:true, 10s timeout

### Precontext research
- `.planning/phases/109/109-PRECONTEXT-RESEARCH.md` — Full API specs (line-level), mock chain reference, data contracts, gotcha inventory (C1-C5, H1-H5, M1-M5)
- `.planning/phases/109/109-ENHANCEMENT-RECOMMENDATIONS.md` — Prioritized 12 recommendations (5 MUST, 4 SHOULD, 3 NICE)

### Cross-phase contracts
- `.planning/phases/105-route-lifecycle-guards/105-CONTEXT.md` — Transition map, admin guards, Sentry audit
- `.planning/phases/107-data-integrity/107-CONTEXT.md` — `promote_next_stop` RPC, `FOR UPDATE SKIP LOCKED`

### Requirements
- `.planning/REQUIREMENTS.md` — QUAL-01, QUAL-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createMockOrder()` factory — pattern to follow for route/stop factories
- `src/test/mocks/stripe.ts` — 4 Stripe event type factories (reference for webhook test data)
- `vi.mock()` + dynamic import pattern in `route.test.ts` — proven approach for handler testing
- Rate-limit burst test pattern (15 sequential calls with shared state) — proven sequential test approach

### Established Patterns
- Parent-level `__tests__/` directory for cross-cutting tests (`src/lib/__tests__/`)
- `fromMock` implementation dispatching on table name for Supabase chain mocks
- `vi.mocked(requireDriver).mockResolvedValue()` for auth mocking
- `Promise.resolve({ routeId: "..." })` for dynamic route params
- Non-blocking try-catch for badge logic — always returns `newBadges: []` on failure

### Integration Points
- `src/test/factories/index.ts` — add `createMockRoute`, `createMockStop`, `createMockRouteWithStops`
- `src/app/api/webhooks/stripe/handlers.ts` → `handlers/` directory (delete original)
- `src/app/api/webhooks/stripe/route.ts` — import path unchanged (`./handlers` → `./handlers/index.ts`)

</code_context>

<deferred>
## Deferred Ideas

- Admin lifecycle guard tests (admin PATCH validation) — separate phase or backlog
- Per-handler webhook unit tests after split — future quality improvement
- E2E test enablement for driver lifecycle (auth fixture setup needed) — future milestone
- Live Redis integration tests — future infrastructure work

</deferred>

---

*Phase: 109-quality-maintenance*
*Context gathered: 2026-03-21*
