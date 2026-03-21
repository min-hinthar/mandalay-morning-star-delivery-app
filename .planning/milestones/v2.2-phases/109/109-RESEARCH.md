# Phase 109: Quality & Maintenance - Research

**Researched:** 2026-03-21
**Domain:** Vitest integration testing (mocked Supabase), file restructuring (barrel re-export)
**Confidence:** HIGH

## Summary

Phase 109 has two discrete deliverables: (1) integration tests covering the full driver route lifecycle and (2) splitting an oversized webhook handlers.ts into per-event files. Both are well-understood patterns with zero external dependencies to discover -- the stack is already established (Vitest 4.0.17, jsdom, mocked Supabase) and 48 existing test files demonstrate every mock pattern needed.

The precontext research (109-PRECONTEXT-RESEARCH.md) is exceptionally thorough -- line-level API specs, exact mock chain shapes, and all gray areas resolved at VERY HIGH confidence. This research validates those findings against the actual source code and adds planner-specific guidance: task ordering, verification commands, and pitfall prevention.

**Primary recommendation:** Implement factories first, lifecycle test second, handler split third. Each step is independently verifiable.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Driver lifecycle only -- QUAL-01 scope. Admin PATCH is Phase 105.
- D-02: Stop skip path included (both terminal states trigger promote_next_stop)
- D-03: Decline route excluded (not a RouteStatus value)
- D-04: Handler imports with mocked deps (all 48 tests use this pattern)
- D-05: Mock Supabase via vi.mock() for @/lib/auth, @/lib/rate-limit, @/lib/utils/logger, @/lib/badges, @/lib/supabase/server
- D-06: Mock checkAndAwardBadges import directly -- returns []
- D-07: RPC mocked: supabase.rpc("promote_next_stop", args) returns { data: { promoted_stop_id, stop_index }, error: null }
- D-08: Mutable shared state within a single test -- routeState and stopStates objects
- D-09: Sequential handler calls in ONE it() block -- state evolves
- D-10: Pattern proven by rate-limit burst tests (15 sequential calls)
- D-11: Single file: src/app/api/driver/routes/__tests__/lifecycle.test.ts (~400-500 lines)
- D-12: Parent-level __tests__ for cross-cutting integration tests
- D-13: Route/stop factories added to src/test/factories/index.ts
- D-14: Full lifecycle sequence test: accept -> start -> stop arrive -> stop deliver -> promoted -> route complete
- D-15: Stop promotion RPC verification
- D-16: Error paths: 400, 401, 403, 404, 500
- D-17: Concurrent stop delivery: second call gets promoted_stop_id: null
- D-18: Badge failure resilience: completion succeeds with newBadges: []
- D-19: Route with no stops: firstStopId: null, ordersTransitioned: 0
- D-20: Split handlers.ts into handlers/ directory with 4 files + barrel index.ts
- D-21: Kebab-case naming (checkout-session-completed.ts etc.)
- D-22: Barrel re-exports all 4 handlers -- zero import changes to route.ts
- D-23: Remove /* eslint-disable max-lines */ from original file
- D-24: Existing route.test.ts does NOT import from ./handlers -- zero test changes
- D-25 through D-28: Exact mock chain counts per handler (verified against source)

### Claude's Discretion
- Test describe/it block structure and naming
- Exact assertion style (toEqual vs toMatchObject vs individual expects)
- Factory default values (UUIDs, timestamps)
- Whether to use it.each() for error path parameterization
- Order of test cases within the file

### Deferred Ideas (OUT OF SCOPE)
- Admin lifecycle guard tests (admin PATCH validation)
- Per-handler webhook unit tests after split
- E2E test enablement for driver lifecycle
- Live Redis integration tests
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUAL-01 | Integration tests cover full driver route lifecycle: assigned -> accept -> start -> stop arrive -> stop deliver -> next-stop promoted -> route complete | All 4 handler source files verified (82/135/167/218 lines). Mock chain shapes documented. Sequential test pattern proven by rate-limit burst tests. Factory pattern established by createMockOrder(). |
| QUAL-02 | handlers.ts (529 lines) split into per-event-type handler files with barrel re-export -- each handler file under 400-line ESLint limit | Line-level split analysis complete: 4 handlers (267/35/55/142 lines). No cross-handler refs. route.ts import unchanged via Node module resolution. route.test.ts unaffected (does not import handlers). |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | 4.0.17 | Test runner + assertions | Already installed, 48 test files, globals:true |
| @vitejs/plugin-react | (in vitest.config) | JSX transform for test env | Required by vitest config |
| jsdom | (via vitest env) | DOM environment for tests | Configured in vitest.config.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/jest-dom | ^6.9.1 | DOM matchers | Imported in setup.ts (available globally) |
| fake-indexeddb | ^6.2.5 | IndexedDB polyfill | Imported in setup.ts |

### No New Dependencies
Phase 109 requires ZERO new packages. All testing infrastructure exists.

**Verification command:**
```bash
pnpm test
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/api/driver/routes/
    __tests__/
      lifecycle.test.ts           # NEW: Cross-cutting integration test
    [routeId]/
      accept/route.ts             # 82 lines - test target
      start/route.ts              # 135 lines - test target
      complete/route.ts           # 167 lines - test target
      stops/[stopId]/route.ts     # 218 lines - test target
  app/api/webhooks/stripe/
    handlers/                     # NEW: directory replaces handlers.ts
      index.ts                    # Barrel re-export (~15 lines)
      checkout-session-completed.ts  # ~275 lines
      checkout-session-expired.ts    # ~45 lines
      payment-failed.ts             # ~65 lines
      charge-refunded.ts            # ~155 lines
    route.ts                      # UNCHANGED - imports from "./handlers"
    __tests__/route.test.ts       # UNCHANGED - does not import handlers
  test/factories/
    index.ts                      # MODIFIED: add route/stop factories
```

### Pattern 1: Sequential Lifecycle Test with Mutable State
**What:** Single test case with shared mutable state that evolves across sequential handler calls.
**When to use:** Testing multi-step workflows where each step depends on the previous step's output.
**Verified by:** Rate-limit burst test in `check.test.ts` (lines 89-108) -- 15+ sequential calls sharing in-memory state in one `it()` block.

```typescript
// Mutable state shared within the test
let routeState = createMockRoute({ status: "assigned" });
let stopStates = [
  createMockStop({ stop_index: 0, status: "pending" }),
  createMockStop({ stop_index: 1, status: "pending" }),
];

// fromMock dispatches on table name, reads/writes shared state
const fromMock = vi.fn((table: string) => {
  if (table === "routes") return buildRouteChain(routeState);
  if (table === "route_stops") return buildStopChain(stopStates);
  if (table === "orders") return buildOrderChain();
  if (table === "drivers") return buildDriverChain();
});

// Sequential calls -- state evolves
const r1 = await POST(req, { params: Promise.resolve({ routeId: "r1" }) });
expect(routeState.status).toBe("accepted");
// ... continue with start, stop update, complete
```

### Pattern 2: Module-Level vi.mock() with Handler Import
**What:** Mock all dependencies at module scope before importing handler.
**When to use:** All API handler tests in this codebase.
**Source:** `route.test.ts` (lines 1-71) -- establishes the canonical pattern.

```typescript
// Mocks MUST be before imports (Vitest hoists them)
vi.mock("@/lib/auth", () => ({
  requireDriver: vi.fn(),
}));
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

// Then dynamic import the handlers
const { POST } = await import("../[routeId]/accept/route");
```

### Pattern 3: Factory with Overrides
**What:** Factory functions returning typed mock objects with spread overrides.
**When to use:** Creating test data that matches database row shapes.
**Source:** `src/test/factories/index.ts` -- createMockOrder(), createMockMenuItem(), etc.

```typescript
export function createMockRoute(overrides?: Partial<RoutesRow>): RoutesRow {
  return {
    id: "route-uuid",
    status: "assigned",
    driver_id: "driver-uuid",
    delivery_date: "2026-03-21",
    accepted_at: null,
    started_at: null,
    completed_at: null,
    // ... all fields with defaults
    ...overrides,
  };
}
```

### Pattern 4: Barrel Re-export for File Split
**What:** Directory with index.ts re-exporting named exports from sibling files.
**When to use:** Splitting an oversized file while preserving the import contract.
**Source:** Project convention (component subfolder pattern in CLAUDE.md).

```typescript
// handlers/index.ts
export { handleCheckoutSessionCompleted } from "./checkout-session-completed";
export { handleCheckoutSessionExpired } from "./checkout-session-expired";
export { handlePaymentFailed } from "./payment-failed";
export { handleChargeRefunded } from "./charge-refunded";
```

Node resolves `import from "./handlers"` to `./handlers/index.ts` -- zero changes to `route.ts`.

### Anti-Patterns to Avoid
- **Vacuous assertions inside conditionals:** Never `if (result) { expect(...) }`. Assert existence first, then drill in. (Gotcha C2)
- **Incomplete mock chains:** Every `.update().eq().select()` chain needs a corresponding mock. Missing method = `not a function` error. (Gotcha C1)
- **Mocks after imports:** `vi.mock()` MUST be before `import` statements in the test file. Vitest hoists them, but dynamic `await import()` runs after mocks. (Gotcha M5)
- **Testing HTTP layer:** Do NOT use supertest, fetch, or any HTTP server. Import handler functions directly. (Decision D-04)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test data creation | Inline object literals | `createMockRoute(overrides?)` factory | Consistency across 10+ test cases, single source of truth for defaults |
| Supabase query chain mocks | Individual method stubs per test | `fromMock` dispatch function reading shared state | Mock must match EXACT chain shape; centralized dispatch catches mismatches |
| RPC result parsing | Manual JSON.parse or casting | Mock `supabase.rpc()` returning typed result directly | Handler already casts via `rpcData as unknown as PromotionResult` |
| Status transition validation | Inline if/else checks in tests | Import `isValidStatusTransition()` for reference, test handler's 400 responses | Validation logic already exists in `driver-api.ts` |

**Key insight:** The mock chain is the critical complexity. Each handler has 2-6 Supabase query chains, and EVERY chain link must be mocked or the test throws `not a function` instead of testing handler logic.

## Common Pitfalls

### Pitfall 1: Start Handler Update Has No .select() Chain
**What goes wrong:** Mocking `routes.update().eq().select()` for the start handler causes a chain mismatch because start's update does NOT chain `.select()`.
**Why it happens:** Accept handler (line 65) chains `.select("id")` after update. Start handler (line 72) does NOT. They look identical at a glance.
**How to avoid:** Accept mock chain: `update().eq().select()`. Start mock chain: `update().eq()` only. Verified line-by-line in source.
**Warning signs:** `TypeError: .select is not a function` in start handler tests.

### Pitfall 2: Complete Handler Body Parsing Silently Catches Errors
**What goes wrong:** The complete handler wraps `request.json()` in try-catch (lines 26-32), so passing a NextRequest with no body doesn't fail -- it silently continues.
**Why it happens:** The body is optional (notes for future use). `completeRouteSchema.safeParse()` is called but result is discarded.
**How to avoid:** Mock `request.json()` to return `{}` or throw. Both paths are valid -- the handler continues either way.
**Warning signs:** Tests pass but don't verify body handling.

### Pitfall 3: Order Update is Conditional on Status
**What goes wrong:** Stop handler's order update (lines 142-147) only fires when `newStatus === "delivered"`, and uses optimistic lock `.eq("status", "out_for_delivery")`. Mock must return empty array for no-op case.
**Why it happens:** If order is already delivered (race condition), update returns 0 rows. Handler logs warn but continues.
**How to avoid:** Mock order update to return `{ data: [{ id: "..." }], error: null }` for happy path, `{ data: [], error: null }` for no-op.
**Warning signs:** Assertion `orderUpdated: true` fails when mock returns wrong shape.

### Pitfall 4: RPC Called Only for Terminal States
**What goes wrong:** Tests expect promote_next_stop RPC call for `arrived` status -- but RPC only fires for `delivered` or `skipped` (lines 168-200).
**Why it happens:** Arriving at a stop is not terminal. Only terminal states trigger promotion.
**How to avoid:** Assert RPC called only when `newStatus` is `"delivered"` or `"skipped"`. Assert NOT called for `"arrived"` or `"enroute"`.
**Warning signs:** RPC mock assertion failures on non-terminal status tests.

### Pitfall 5: Stats Calculation Spreads Existing stats_json
**What goes wrong:** Complete handler's stats calc (line 86) does `...route.stats_json` to preserve distance/duration. If mock returns null stats_json, spread is harmless. But if mock returns partial stats, they override computed values.
**Why it happens:** `Object.assign` / spread semantics -- later properties win.
**How to avoid:** Factory default: `stats_json: null`. Only override in tests specifically testing stats preservation.
**Warning signs:** Unexpected `total_distance_miles` or `total_duration_minutes` in stats output.

### Pitfall 6: Barrel Re-export Must Match Exact Function Names
**What goes wrong:** Typo in barrel export name silently breaks the import -- TypeScript catches it but only if route.ts destructures the import.
**Why it happens:** `route.ts` (line 9-14) imports all 4 by name. Any name mismatch = build failure.
**How to avoid:** Copy-paste the exact function names from the original `handlers.ts`. Run `pnpm typecheck` after split.
**Warning signs:** Build failure citing missing exports from `./handlers`.

## Code Examples

### Mock Chain for Accept Handler (2 chains)
```typescript
// Source: src/app/api/driver/routes/[routeId]/accept/route.ts lines 35-65
// Chain 1: SELECT route
// .from("routes").select("id, status, driver_id").eq("id", routeId).returns<>().single()
// Chain 2: UPDATE route
// .from("routes").update({ status, accepted_at }).eq("id", routeId).select("id")

const buildRouteSelectChain = (route: RouteQueryResult) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  returns: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: route, error: null }),
});

const buildRouteUpdateChain = () => ({
  update: vi.fn((data) => {
    Object.assign(routeState, data); // Mutate shared state
    return {
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: routeState.id }], error: null }),
      }),
    };
  }),
});
```

### Mock Chain for Start Handler (6 chains)
```typescript
// Source: src/app/api/driver/routes/[routeId]/start/route.ts
// CRITICAL: route update (line 66-72) has NO .select() chain

// Route update for start -- no .select()
update: vi.fn((data) => {
  Object.assign(routeState, data);
  return {
    eq: vi.fn().mockResolvedValue({ error: null }), // Resolves directly, no .select()
  };
}),
```

### Mock RPC for promote_next_stop
```typescript
// Source: src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts lines 169-172
const mockRpc = vi.fn().mockResolvedValue({
  data: { promoted_stop_id: "stop-2-uuid", stop_index: 1 },
  error: null,
});

// For SKIP LOCKED contention (no pending stops):
mockRpc.mockResolvedValue({
  data: { promoted_stop_id: null, stop_index: null },
  error: null,
});
```

### Factory Pattern for Routes and Stops
```typescript
// Source: follows createMockOrder() pattern in src/test/factories/index.ts
import type { RoutesRow, RouteStopsRow } from "@/types/driver";

export function createMockRoute(overrides?: Partial<RoutesRow>): RoutesRow {
  return {
    id: "route-uuid",
    delivery_date: "2026-03-21",
    driver_id: "driver-uuid",
    status: "assigned",
    optimized_polyline: null,
    stats_json: null,
    started_at: null,
    completed_at: null,
    accepted_at: null,
    declined_at: null,
    declined_reason: null,
    declined_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockStop(overrides?: Partial<RouteStopsRow>): RouteStopsRow {
  return {
    id: "stop-uuid",
    route_id: "route-uuid",
    order_id: "order-uuid",
    stop_index: 0,
    eta: null,
    status: "pending",
    arrived_at: null,
    delivered_at: null,
    delivery_photo_url: null,
    delivery_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
```

### Webhook Handler Barrel Split
```typescript
// handlers/index.ts
export { handleCheckoutSessionCompleted } from "./checkout-session-completed";
export { handleCheckoutSessionExpired } from "./checkout-session-expired";
export { handlePaymentFailed } from "./payment-failed";
export { handleChargeRefunded } from "./charge-refunded";
```

```typescript
// handlers/checkout-session-completed.ts (first 10 lines)
import React from "react";
import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, fetchSuggestedItems, getAdminEmails } from "@/lib/email";
import { logger } from "@/lib/utils/logger";
import { AdminNewOrderAlert } from "@/emails/AdminNewOrderAlert";
import { OrderConfirmation } from "@/emails/OrderConfirmation";
import type Stripe from "stripe";

export async function handleCheckoutSessionCompleted(
  supabase: ReturnType<typeof createServiceClient>,
  session: Stripe.Checkout.Session
) {
  // ... handler body from lines 16-282
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.17 |
| Config file | vitest.config.ts |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUAL-01 | Full lifecycle: accept -> start -> arrive -> deliver -> promoted -> complete | integration | `pnpm vitest run src/app/api/driver/routes/__tests__/lifecycle.test.ts` | Wave 0 |
| QUAL-01 | Error paths: 400/401/403/404/500 per handler | integration | `pnpm vitest run src/app/api/driver/routes/__tests__/lifecycle.test.ts` | Wave 0 |
| QUAL-01 | Stop skip path triggers promotion | integration | `pnpm vitest run src/app/api/driver/routes/__tests__/lifecycle.test.ts` | Wave 0 |
| QUAL-01 | Concurrent stop delivery (SKIP LOCKED null) | integration | `pnpm vitest run src/app/api/driver/routes/__tests__/lifecycle.test.ts` | Wave 0 |
| QUAL-01 | Badge failure resilience | integration | `pnpm vitest run src/app/api/driver/routes/__tests__/lifecycle.test.ts` | Wave 0 |
| QUAL-01 | Route with no stops edge case | integration | `pnpm vitest run src/app/api/driver/routes/__tests__/lifecycle.test.ts` | Wave 0 |
| QUAL-02 | handlers.ts split into 4 files + barrel | manual + typecheck | `pnpm typecheck && pnpm test` | N/A (structural) |
| QUAL-02 | All split files under 400 lines | lint | `pnpm lint` | N/A (structural) |
| QUAL-02 | Existing webhook tests unchanged/passing | regression | `pnpm vitest run src/app/api/webhooks/stripe/__tests__/route.test.ts` | Exists |

### Sampling Rate
- **Per task commit:** `pnpm vitest run src/app/api/driver/routes/__tests__/lifecycle.test.ts` (lifecycle) or `pnpm vitest run src/app/api/webhooks/stripe/__tests__/route.test.ts` (webhook)
- **Per wave merge:** `pnpm test` (all 48+ test files)
- **Phase gate:** `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`

### Wave 0 Gaps
- [ ] `src/app/api/driver/routes/__tests__/lifecycle.test.ts` -- covers QUAL-01 (entire file is new)
- [ ] Route/stop factories in `src/test/factories/index.ts` -- shared test fixtures for lifecycle tests
- Framework install: None needed -- Vitest 4.0.17 already installed and configured

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| vi.mock with static returns | vi.mock with mutable shared state | Established in this codebase | Enables sequential lifecycle testing |
| Flat handler files | Directory with barrel re-export | Project convention | Scalable file organization |
| Manual route/stop objects | Factory functions with overrides | Phase 109 (this phase) | Consistent test data |

**No deprecated/outdated patterns detected.** Vitest 4.x is current. All mock patterns are stable Vitest APIs.

## Open Questions

None. All gray areas resolved at VERY HIGH confidence per precontext research. Every handler has been read line-by-line. Mock chain shapes are documented. The implementation path is fully determined.

## Sources

### Primary (HIGH confidence)
- Source code: All 4 handler files read line-by-line (accept 82L, start 135L, complete 167L, stop 218L)
- Source code: handlers.ts (529 lines) with exact handler boundaries
- Source code: route.ts webhook consumer (lines 9-14 imports)
- Source code: route.test.ts (lines 1-80 mock patterns)
- Source code: factories/index.ts (existing factory patterns)
- Source code: vitest.config.ts (confirmed: jsdom, globals:true, 10s timeout)
- Source code: src/lib/validations/driver-api.ts (stop transitions)
- Source code: src/lib/validations/route.ts (route transitions)
- Source code: src/types/driver.ts (RoutesRow, RouteStopsRow interfaces)

### Secondary (HIGH confidence)
- 109-PRECONTEXT-RESEARCH.md -- line-level API specs, mock chain reference, gotcha inventory
- 109-CONTEXT.md -- 28 locked decisions, canonical references
- 109-ENHANCEMENT-RECOMMENDATIONS.md -- prioritized implementation order

### Verified at Runtime
- `pnpm test` -- 839 tests passing across 48 files (confirmed 2026-03-21)
- Vitest 4.0.17 (confirmed via package.json)
- No new dependencies needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- versions verified from package.json, all deps already installed
- Architecture: HIGH -- patterns extracted from actual source code, not documentation
- Pitfalls: HIGH -- 15 gotchas documented in precontext, top 6 verified against line-level source
- Mock chains: HIGH -- every chain verified by reading handler source code

**Research date:** 2026-03-21
**Valid until:** Indefinite -- all findings are from actual source code in the same commit
