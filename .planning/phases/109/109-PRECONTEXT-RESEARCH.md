# Phase 109: Quality & Maintenance — Precontext Research

> Updated after Wave 2 deep-dives (8 targeted agents). All areas at VERY HIGH confidence.

## 1. Resolved Assumptions

### Technical Approach
- **Integration tests**: Vitest with jsdom, mocked Supabase client, testing handler functions directly (import + call, no HTTP layer). All 48 existing tests use this pattern. No HTTP test server or Docker/Supabase instance exists.
- **Sequential test pattern**: Use mutable `currentRouteState` / `currentStopStates` objects shared within a single test. Mock `update()` to mutate state so subsequent `select()` returns updated values. Proven by rate-limit burst tests (15 sequential calls, state evolves). Each `vi.mocked(requireDriver).mockResolvedValue()` call within a test overrides the previous — no reset needed between sequential handler calls.
- **Mock strategy**: `vi.mock()` for `@/lib/auth`, `@/lib/rate-limit`, `@/lib/utils/logger`, `@/lib/badges`, `@/lib/supabase/server`; manual Supabase query chain mocks via `fromMock` implementation function dispatching on table name.
- **File split**: 4 per-event-type handler files + barrel `index.ts`. Route.ts import `from "./handlers"` resolves to `./handlers/index.ts` via Node module resolution — zero import changes. Existing `route.test.ts` does NOT import handlers (it mocks at module level and imports route) — zero test changes.
- **No real database**: All RPC calls (promote_next_stop, calculate_driver_streak) mocked. Badge logic (4 queries: drivers select, streak RPC, badges select, badges insert) is non-blocking — route completion succeeds even if badges throw.

### Scope Boundaries
| In Scope | Out of Scope | Rationale |
|----------|-------------|-----------|
| Driver route lifecycle: assigned → accept → start → stop arrive → stop deliver → next-stop promoted → route complete | Admin operations (assign, override, split/merge) | QUAL-01 says "driver route lifecycle"; admin is Phase 105 (ROUTE-03, already shipped) |
| Stop skip path (valid terminal state) | Decline route | Skip triggers promotion (same as deliver). Decline is not a RouteStatus value — it resets to `planned`. |
| promote_next_stop RPC mock testing | Real database integration testing | No Docker/Supabase test infra exists; all 48 tests mock |
| Webhook handlers.ts split into 4 files | Resend webhook handler | Resend handler is 333 lines (under limit) |
| Barrel re-export preserving import contract | New webhook event type handlers | Only the 4 existing handlers are in scope |
| Error path coverage (400/401/403/404/500 per handler) | E2E test enablement | E2E tests are skipped due to auth fixture gap — future scope |

### Implementation Order
1. Add route/stop factories to `src/test/factories/index.ts` (~50 lines)
2. Write lifecycle integration test at `src/app/api/driver/routes/__tests__/lifecycle.test.ts` (~400-500 lines)
3. Split `handlers.ts` → `handlers/` directory (4 files + barrel)
4. Delete original `handlers.ts`, remove `/* eslint-disable max-lines */`
5. Run full verification suite

## 2. Realistic Data/Scale Analysis

- **Route lifecycle endpoints**: 5 driver endpoints + 1 admin PATCH = 6 handlers to test
- **Stop transitions**: 5 statuses, 10 valid transitions, 2 terminal states
- **Webhook handlers**: 4 handlers totaling 529 lines → 4 files (275, 150, 65, 45 lines) + 15-line barrel
- **Test file estimate**: ~400-500 lines for lifecycle integration tests, ~50 lines for new factories
- **Existing coverage gap**: ZERO integration tests for any route lifecycle endpoint; ZERO tests for next-stop promotion

## 3. Cross-Phase Contract Inventory

### From Phase 104: Type Safety & API Corrections
- `delivery_zones` table typed in `database.ts`
- Customer contact fallback: `orders.customer_name ?? profiles.full_name`
- `updateRouteStats()` counts only `status === "pending"` (not enroute)
- **Must NOT break**: Type signatures, contact fallback pattern, pending-only counting

### From Phase 105: Route Lifecycle Guards
- `VALID_ROUTE_TRANSITIONS` constant at `src/lib/validations/route.ts:19-25`
- Driver start endpoint: only `accepted` → `in_progress`
- Admin PATCH: lifecycle validation + Sentry audit + CHECK constraint
- Timestamp management: `accepted_at`, `started_at`, `completed_at`
- **Must NOT break**: Transition constant, admin guard, Sentry audit, CHECK constraint

### From Phase 106: Timezone Correctness
- `TIMEZONE = "America/Los_Angeles"` at `src/types/delivery.ts`
- `toISOWithTimezone()` for checkout date construction
- Cron uses `getTodayInTimezone()` for LA-aware date
- **Must NOT break**: Timezone constant, utility functions

### From Phase 107: Data Integrity
- `promote_next_stop` RPC: `FOR UPDATE SKIP LOCKED` prevents double-promotion
- Returns `{ promoted_stop_id, stop_index }` or nulls
- Dead `increment_driver_deliveries` call removed from complete handler
- Trigger `update_driver_deliveries_count` is sole source of truth
- **Must NOT break**: RPC function, trigger ownership, absence of dead code

### From Phase 108: Rate Limiting Restoration
- 13 rate limiters via `createLimiter()` factory
- Server action fallback: in-memory 15 req/min when Redis unavailable
- Health endpoint: real Redis PING with 3s timeout
- 21 unit tests in `src/lib/rate-limit/__tests__/`
- **Must NOT break**: All limiter exports, fallback, health endpoint, test patterns

### Feeds Into Future
- Integration tests become regression safety net for all future route changes
- Handler split establishes pattern for any future webhook file growth

## 4. Route Lifecycle API Specifications (Line-Level Extraction)

### POST `/api/driver/routes/[routeId]/accept`
**File**: `src/app/api/driver/routes/[routeId]/accept/route.ts`
**Imports (lines 1-4)**: `NextRequest`, `NextResponse`, `requireDriver` from `@/lib/auth`, `checkRateLimit`+`driverActionLimiter` from `@/lib/rate-limit`, `logger` from `@/lib/utils/logger`
**Signature (line 16)**: `export async function POST(_request: NextRequest, { params }: { params: Promise<{ routeId: string }> })`

- **Auth (line 20-24)**: `const auth = await requireDriver(); if (!auth.success) return json({ error: auth.error }, { status: auth.status }); const { supabase, driverId } = auth;`
- **Rate limit (lines 26-32)**: `checkRateLimit({ limiter: driverActionLimiter, identifier: driverId, role: "driver", route: "driver/routes/[routeId]/accept" })`
- **Query 1 (lines 35-40)**: `.from("routes").select("id, status, driver_id").eq("id", routeId).returns<RouteQueryResult[]>().single()`
- **Guard (line 48)**: `route.driver_id !== driverId` → 403 `"Not authorized to accept this route"`
- **Guard (line 54)**: `route.status !== "assigned"` → 400 `"Cannot accept route with status: ${route.status}"`
- **Query 2 (lines 61-65)**: `.from("routes").update({ status: "accepted", accepted_at: acceptedAt }).eq("id", routeId).select("id")`
- **Errors**: 404 `"Route not found"`, 403, 400, 500 `"Failed to accept route"`, 500 `"Internal server error"`
- **Success (line 76)**: `{ success: true, acceptedAt }` (200)

### POST `/api/driver/routes/[routeId]/start`
**File**: `src/app/api/driver/routes/[routeId]/start/route.ts`
**Imports (lines 1-4)**: Same as accept
**Signature (line 21)**: `export async function POST(_request: NextRequest, { params }: RouteParams)`

- **Auth + Rate limit**: Same pattern as accept
- **Query 1 (lines 40-45)**: `.from("routes").select("id, status, driver_id").eq("id", routeId).returns<RouteQueryResult[]>().single()`
- **Guard (line 59)**: `route.status !== "accepted"` → 400 `"Cannot start route — accept route first. Current status: ${route.status}"`
- **Query 2 (lines 66-72)**: `.from("routes").update({ status: "in_progress", started_at }).eq("id", routeId)` — NOTE: no `.select()` chain
- **Query 3 (lines 80-87)**: `.from("route_stops").select("id, stop_index").eq("route_id", routeId).order("stop_index", { ascending: true }).limit(1).returns<StopQueryResult[]>().single()`
- **Query 4 (line 90)**: `.from("route_stops").update({ status: "enroute" }).eq("id", firstStop.id)` — only if firstStop exists
- **Query 5 (lines 94-97)**: `.from("route_stops").select("order_id").eq("route_id", routeId)` — get all order IDs
- **Query 6 (lines 102-107)**: `.from("orders").update({ status: "out_for_delivery" }).in("id", orderIds).in("status", ["confirmed", "preparing"]).select("id")` — batch transition
- **Side effects**: Logs warn on order batch failure (non-blocking), logs info with count
- **Errors**: 404, 403, 400, 500 `"Failed to start route"`, 500 `"Internal server error"`
- **Success (lines 124-129)**: `{ success: true, startedAt, firstStopId: firstStop?.id ?? null, ordersTransitioned: orderIds.length }` (200)

### POST `/api/driver/routes/[routeId]/complete`
**File**: `src/app/api/driver/routes/[routeId]/complete/route.ts`
**Imports (lines 1-8)**: Same as accept + `completeRouteSchema` from `@/lib/validations/driver-api`, `checkAndAwardBadges` from `@/lib/badges`, `RouteStats` type from `@/types/driver`
**Signature (line 21)**: `export async function POST(request: NextRequest, { params }: RouteParams)` — takes body

- **Body (lines 27-32)**: `completeRouteSchema.safeParse(body)` — optional, notes only (not stored in this handler)
- **Auth + Rate limit**: Same pattern
- **Query 1 (lines 49-54)**: `.from("routes").select("id, status, driver_id, stats_json").eq("id", routeId).returns<RouteQueryResult[]>().single()`
- **Guard (line 68)**: `route.status !== "in_progress"` → 400 `"Cannot complete route with status: ${route.status}"`
- **Query 2 (lines 74-77)**: `.from("route_stops").select("status").eq("route_id", routeId)` — get all stop statuses for stats
- **Stats calc**: counts delivered/pending/skipped from stop statuses, `completion_rate = Math.round((delivered / total) * 100)`
- **Query 3 (lines 93-100)**: `.from("routes").update({ status: "completed", completed_at, stats_json: stats as Json }).eq("id", routeId)`
- **Badge block (lines 110-154)**: Non-blocking try-catch:
  - Query 4 (lines 114-119): `.from("drivers").select("deliveries_count, rating_avg").eq("id", driverId).single()`
  - Query 5 (lines 126-128): `.rpc("calculate_driver_streak", { p_driver_id: driverId })`
  - Line 132: `createServiceClient()` for badge insert
  - Line 133-137: `checkAndAwardBadges(serviceClient, driverId, { totalDeliveries, streakDays, ratingAvg })`
  - Badge failure: logged via `logger.exception()`, returns `newBadges: []`
- **checkAndAwardBadges** (in `src/lib/badges/thresholds.ts`):
  - Query A (lines 61-65): `.from("driver_badges").select("badge_type").eq("driver_id", driverId)` — existing badges
  - Pure threshold check against 7 badge types (first_delivery, delivery_10/50/100, streak_5/10, five_star)
  - Query B (lines 97-104): `.from("driver_badges").insert([...newBadges])` — via service client
- **Errors**: 404, 403, 400, 500 `"Failed to complete route"`, 500 `"Internal server error"`
- **Success (lines 156-161)**: `{ success: true, completedAt, stats, newBadges }` (200)

### PATCH `/api/driver/routes/[routeId]/stops/[stopId]`
**File**: `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts`
**Imports (lines 1-6)**: Same as accept + `updateStopStatusSchema`, `isValidStatusTransition` from `@/lib/validations/driver-api`, `RouteStopStatus` type
**Signature (line 31)**: `export async function PATCH(request: NextRequest, { params }: { params: Promise<{ routeId: string; stopId: string }> })`

- **Body (lines 36-40)**: `updateStopStatusSchema.safeParse(body)` → `{ status, deliveryNotes? }`. Validation error returns `parseResult.error.issues[0].message` (400)
- **Auth + Rate limit**: Same pattern
- **Query 1 (lines 60-65)**: `.from("routes").select("id, status, driver_id").eq("id", routeId).returns<RouteQueryResult[]>().single()`
- **Guard (line 79)**: `route.status !== "in_progress"` → 400 `"Route must be in progress to update stops"`
- **Query 2 (lines 85-91)**: `.from("route_stops").select("id, status, route_id, stop_index, order_id").eq("id", stopId).eq("route_id", routeId).returns<StopQueryResult[]>().single()`
- **Guard (line 102)**: `!isValidStatusTransition(stop.status, newStatus)` → 400 `"Cannot transition from ${stop.status} to ${newStatus}"`
- **Query 3 (lines 124-127)**: `.from("route_stops").update(updateData).eq("id", stopId)` — updateData includes `status`, `arrived_at` (if arrived), `delivered_at` (if delivered), `delivery_notes`
- **If delivered (lines 142-147)**: `.from("orders").update({ status: "delivered", delivered_at }).eq("id", stop.order_id).eq("status", "out_for_delivery").select("id")` — optimistic lock on current status
- **If delivered/skipped (lines 169-172)**: `.rpc("promote_next_stop", { p_route_id: routeId, p_completed_stop_id: stopId })` → returns `{ promoted_stop_id, stop_index }`
- **Order update edge cases**: No-op logged as warn (race condition), error logged as warn (non-blocking)
- **Errors**: 400 (validation/transition), 404 (route/stop), 403, 500 `"Failed to update stop"`, 500 `"Internal server error"`
- **Success (lines 202-212)**: `{ success: true, stop: { id, status, arrivedAt?, deliveredAt? }, orderUpdated?: bool, nextStop?: { id, stopIndex } }` (200)

### Auth Return Types (from `src/lib/auth/driver.ts`)
```typescript
// Success
{ success: true, supabase: SupabaseClient<Database>, userId: string, driverId: string }
// Failure
{ success: false, error: string, status: 401 | 403 }
```
Handler destructures: `const { supabase, driverId } = auth;`

### Rate Limit Return Types (from `src/lib/rate-limit/check.ts`)
```typescript
// Signature
checkRateLimit(opts: { limiter: Ratelimit | null, identifier: string, role: UserRole, route: string }): Promise<RateLimitResult>
// Limited
{ limited: true, response: NextResponse } // 429 with Retry-After header
// Not limited
{ limited: false, headers: { "X-RateLimit-Limit": string, "X-RateLimit-Remaining": string, "X-RateLimit-Reset": string } }
```

### Stop Transition Matrix
```
pending   → [enroute, arrived, delivered, skipped]
enroute   → [arrived, delivered, skipped]
arrived   → [delivered, skipped]
delivered → [] (terminal)
skipped   → [] (terminal)
```

### Route Transition Matrix
```
planned     → [assigned]
assigned    → [planned, accepted]
accepted    → [planned, assigned, in_progress]
in_progress → [completed]
completed   → [] (terminal)
```

## 5. Gotcha Inventory

### Critical (Must handle or tests will be wrong/useless)

| # | Gotcha | Source | Fix Guidance |
|---|--------|--------|-------------|
| C1 | Supabase fluent chain mocks must match EXACT query shape | learnings/testing.md | Every `.update().eq().eq().select()` chain needs corresponding mock chain. Missing method → `not a function` → test throws instead of testing handler logic |
| C2 | Vacuous tests hide broken assertions | learnings/testing.md | Never use `if (result) { expect(...) }`. Assert existence first: `expect(route).toBeDefined()` then `expect(route.status).toBe(...)` |
| C3 | Webhook handlers must return 500 on DB errors | learnings/stripe.md | Each split handler's catch block must return 500 for retryable errors (DB, network). Return 200 only for success or non-retryable errors (missing metadata) |
| C4 | `.update()` returns no row count | learnings/stripe.md | Chain `.select("id")` after `.update()` to verify affected rows. Mock must include this chain link |
| C5 | PostgREST FK hints: routes→drivers has 2 FKs | learnings/data-schema.md | Any query joining drivers from routes must use `!routes_driver_id_fkey` hint. Missing hint → PGRST201 in production |

### High (Can cause subtle test failures)

| # | Gotcha | Source | Fix Guidance |
|---|--------|--------|-------------|
| H1 | Promise.all mocks must handle ALL parallel queries | learnings/testing.md | Route start handler runs 6 queries. Mock `fromMock` must handle each table or Promise.all rejects |
| H2 | `after()` fire-and-forget killed on Vercel | learnings/nextjs.md | All email sends use `after()`. Test mock must execute callback immediately |
| H3 | Service client `auth.getUser()` returns null | learnings/supabase-auth.md | Badge logic uses service client. Mock must use `auth.admin.getUserById()` pattern |
| H4 | RPC Json union breaks TypeScript strict | Phase 107 | Cast via local interface: `rpcData as unknown as PromotionResult` |
| H5 | Stale tests after validation rule changes | learnings/testing.md | Before writing tests, grep `VALID_STOP_TRANSITIONS` and `VALID_ROUTE_TRANSITIONS` to match current schema |

### Medium (Edge cases to cover)

| # | Gotcha | Source | Fix Guidance |
|---|--------|--------|-------------|
| M1 | Route with no stops → firstStop is null | Start handler | Return `firstStopId: null`, `ordersTransitioned: 0` |
| M2 | All stops already terminal → promotion returns null | Stop handler | `nextStop` is absent from response |
| M3 | Order already in different status → update is no-op | Stop handler | Log warn, stop still updated |
| M4 | Badge check fails → route completion still succeeds | Complete handler | Non-blocking; logged exception only |
| M5 | `vi.mock()` must be called BEFORE importing handler | Vitest convention | Hoist mocks above imports in test files |

## 6. Data Contracts

### Route Query Result (from GET/accept/start/complete)
```typescript
interface RouteQueryResult {
  id: string;
  status: RouteStatus; // planned | assigned | accepted | in_progress | completed
  driver_id: string | null;
  delivery_date?: string;
  started_at?: string | null;
  completed_at?: string | null;
  accepted_at?: string | null;
  stats_json?: RouteStats | null;
  optimized_polyline?: string | null;
}
```

### Stop Query Result
```typescript
interface StopQueryResult {
  id: string;
  status: RouteStopStatus; // pending | enroute | arrived | delivered | skipped
  route_id: string;
  stop_index: number;
  order_id: string;
  eta?: string | null;
  arrived_at?: string | null;
  delivered_at?: string | null;
  delivery_photo_url?: string | null;
  delivery_notes?: string | null;
}
```

### promote_next_stop RPC
```typescript
// Args
{ p_route_id: string; p_completed_stop_id: string }
// Returns (jsonb)
{ promoted_stop_id: string | null; stop_index: number | null }
```

### RouteStats
```typescript
interface RouteStats {
  total_stops: number;
  pending_stops: number;
  delivered_stops: number;
  skipped_stops: number;
  completion_rate: number; // 0-100
}
```

## 7. Webhook Handler Split Analysis (Verified Line-by-Line)

### Current State
- **File**: `src/app/api/webhooks/stripe/handlers.ts` — 529 lines (530 with eslint-disable)
- **Line 1**: `/* eslint-disable max-lines */` — must be removed after split
- **Lines 2-11**: All imports (React, next/server after(), services, email, logger, email components, Stripe type, OrderStatus type)
- **Only consumer**: `src/app/api/webhooks/stripe/route.ts` (lines 9-14 import all 4 handlers)

### Handler Inventory (exact line ranges)
| Handler | Lines | Size | Event Type | Unique Deps |
|---------|-------|------|-----------|-------------|
| `handleCheckoutSessionCompleted` | 16-282 | 267 | `checkout.session.completed` | React, after(), sendEmail, AdminNewOrderAlert, OrderConfirmation, fetchSuggestedItems, getAdminEmails |
| `handleCheckoutSessionExpired` | 287-321 | 35 | `checkout.session.expired` | (shared only) |
| `handlePaymentFailed` | 329-383 | 55 | `payment_intent.payment_failed` | (shared only) |
| `handleChargeRefunded` | 388-529 | 142 | `charge.refunded` | React, after(), sendEmail, RefundNotification, OrderStatus type, `preDeliveryStatuses` const |

### Impact on Tests — ZERO CHANGES NEEDED
**Verified**: `route.test.ts` (610 lines) does NOT import from `./handlers`. It:
- Mocks all dependencies at module level (`vi.mock("@/lib/rate-limit", ...)`)
- Dynamically imports `../route` at test time (line 195)
- Tests only call `POST()` from route — handlers are invoked indirectly
- The barrel `./handlers/index.ts` resolves identically to `./handlers.ts` via Node module resolution

### No Cross-Handler References
- **No handler calls another handler** — fully independent event processors
- **No shared utility functions** defined within handlers.ts (all imports are from external modules)
- **No shared constants** except `preDeliveryStatuses` in charge.refunded (inline, not shared)

### Proposed File Structure
```
stripe/handlers/
  index.ts                          # Barrel re-export (15 lines)
  checkout-session-completed.ts     # ~275 lines (handler + 10 import lines)
  checkout-session-expired.ts       # ~45 lines (handler + 5 import lines)
  payment-failed.ts                 # ~65 lines (handler + 5 import lines)
  charge-refunded.ts                # ~155 lines (handler + 8 import lines)
```

All files under 400-line ESLint limit. No `/* eslint-disable */` needed in any file.

### Import Contract Preservation
```typescript
// stripe/handlers/index.ts — barrel
export { handleCheckoutSessionCompleted } from "./checkout-session-completed";
export { handleCheckoutSessionExpired } from "./checkout-session-expired";
export { handlePaymentFailed } from "./payment-failed";
export { handleChargeRefunded } from "./charge-refunded";
```

**route.ts import (lines 9-14)**: `from "./handlers"` — UNCHANGED. Node resolves `./handlers` → `./handlers/index.ts`.
**route.test.ts**: UNCHANGED. Does not import handlers.

### Per-File Import Requirements
| File | Needs `React` | Needs `after()` | Needs `sendEmail` | Needs `createServiceClient` | Needs `logger` |
|------|:---:|:---:|:---:|:---:|:---:|
| checkout-session-completed | Y | Y | Y | Y | Y |
| checkout-session-expired | - | - | - | Y | Y |
| payment-failed | - | - | - | Y | Y |
| charge-refunded | Y | Y | Y | Y | Y |

## 8. Test Infrastructure Inventory

### Existing (Available)
| Resource | Location | Status |
|----------|----------|--------|
| Vitest config | `vitest.config.ts` | jsdom, globals:true, 10s timeout |
| Test setup | `src/test/setup.ts` | ResizeObserver, localStorage, matchMedia, env vars |
| Menu item factory | `src/test/factories/index.ts` | `createMockMenuItem()` |
| Order factory | `src/test/factories/index.ts` | `createMockOrder()` |
| Address factory | `src/test/factories/index.ts` | `createMockAddress()` |
| Stripe event mocks | `src/test/mocks/stripe.ts` | 4 event type factories |
| Auth mock pattern | Per-test `vi.mock()` | `requireDriver`/`requireAdmin` |
| Rate limit mock | Per-test `vi.mock()` | Always `{ limited: false }` |
| after() mock | Per-test `vi.mock()` | Execute callback immediately |
| Dynamic params | Per-test helper | `{ params: Promise.resolve({...}) }` |

### Missing (Must Create for Phase 109)
| Resource | Purpose | Notes |
|----------|---------|-------|
| Route factory | `createMockRoute(overrides?)` | Default: `{ id: uuid, status: "assigned", driver_id: uuid, delivery_date: "2026-03-21", accepted_at: null, started_at: null, completed_at: null, stats_json: null }` |
| Stop factory | `createMockStop(overrides?)` | Default: `{ id: uuid, route_id: uuid, order_id: uuid, stop_index: 0, status: "pending", eta: null, arrived_at: null, delivered_at: null, delivery_notes: null }` |
| RPC mock pattern | `.rpc("promote_next_stop", args)` | Return: `{ data: { promoted_stop_id: string, stop_index: number }, error: null }` or `{ data: { promoted_stop_id: null, stop_index: null }, error: null }` |

### Sequential Test Pattern (Established by Deep-Dive)
```typescript
// Mutable state shared within a single test
let routeState = { id: "r1", status: "assigned", driver_id: "d1", ... };
let stopStates = [{ id: "s1", status: "pending", ... }, { id: "s2", status: "pending", ... }];

// fromMock dispatches on table name, reads/writes shared state
const fromMock = vi.fn((table: string) => {
  if (table === "routes") return { select: ..., update: (u) => { Object.assign(routeState, u); ... } };
  if (table === "route_stops") return { /* reads/writes stopStates */ };
  // ...
});

// Sequential calls in ONE test — state evolves
const r1 = await acceptHandler(req, params);    // routeState.status → "accepted"
const r2 = await startHandler(req, params);      // routeState.status → "in_progress"
const r3 = await stopHandler(req, params);       // stopStates[0].status → "delivered", promotion called
const r4 = await completeHandler(req, params);   // routeState.status → "completed"
```
Proven by rate-limit burst test pattern: 15 sequential `checkRateLimit()` calls share in-memory bucket state within one `it()` block.

## 9. Test Coverage Gap Analysis

### Current Coverage Matrix
| Lifecycle Step | Validation Test | API Handler Test | Hook Test | E2E Test |
|----------------|----------------|-----------------|-----------|----------|
| Accept route | isValidRouteTransition ✓ | NONE | useAcceptRoute ✓ (fetch only) | Skipped |
| Start route | completeRouteSchema ✓ | NONE | NONE | Skipped |
| Stop arrive | VALID_STOP_TRANSITIONS ✓ | NONE | NONE | Skipped |
| Stop deliver | VALID_STOP_TRANSITIONS ✓ | NONE | NONE | Skipped |
| Stop skip | VALID_STOP_TRANSITIONS ✓ | NONE | NONE | Skipped |
| Next-stop promoted | NONE | NONE | NONE | NONE |
| Route complete | completeRouteSchema ✓ | NONE | NONE | Skipped |
| Admin override | isValidRouteTransition ✓ | NONE | useReassignDriver ✓ | Skipped |

### Phase 109 Must Fill
- API handler tests for: accept, start, stop update (arrive/deliver/skip), complete
- Promotion logic test: verify RPC called after terminal stop status
- Full lifecycle sequence: accept → start → arrive → deliver → promoted → complete

## 10. Architectural Decisions

### Decision 1: Mock vs Real Database
- **Chosen**: Mocked Supabase client (consistent with all 48 existing tests)
- **Alternative**: Local Supabase via Docker (rejected — no infrastructure exists, would require new tooling)
- **Rationale**: Zero setup cost; matches established patterns; validates handler logic not DB queries

### Decision 2: Test File Organization
- **Chosen**: Single integration test file in `src/app/api/driver/routes/__tests__/lifecycle.test.ts`
- **Alternative**: Per-endpoint test files (accept.test.ts, start.test.ts, etc.)
- **Rationale**: Integration tests verify sequential flow; splitting would lose the lifecycle narrative

### Decision 3: Handler Split Naming
- **Chosen**: Kebab-case (`checkout-session-completed.ts`)
- **Alternative**: Dot notation (`checkout.session.completed.ts`)
- **Rationale**: No dots in filenames elsewhere in codebase; kebab-case matches `get-handler.ts` precedent

### Decision 4: Barrel Location
- **Chosen**: `handlers/index.ts` (subfolder barrel)
- **Alternative**: `handlers.ts` re-exporting from siblings (flat structure)
- **Rationale**: Matches project convention (component subfolder pattern); zero import changes in route.ts

## 11. File Map

### Create
| File | Purpose | Est. Lines |
|------|---------|-----------|
| `src/app/api/driver/routes/__tests__/lifecycle.test.ts` | Route lifecycle integration tests | ~400-500 |
| `src/app/api/webhooks/stripe/handlers/index.ts` | Barrel re-export | ~15 |
| `src/app/api/webhooks/stripe/handlers/checkout-session-completed.ts` | Checkout completed handler | ~275 |
| `src/app/api/webhooks/stripe/handlers/checkout-session-expired.ts` | Checkout expired handler | ~45 |
| `src/app/api/webhooks/stripe/handlers/payment-failed.ts` | Payment failed handler | ~65 |
| `src/app/api/webhooks/stripe/handlers/charge-refunded.ts` | Charge refunded handler | ~150 |

### Delete
| File | Reason |
|------|--------|
| `src/app/api/webhooks/stripe/handlers.ts` | Replaced by handlers/ directory |

### Modify
| File | Change |
|------|--------|
| `src/test/factories/index.ts` | Add route/stop/driver factories |

### Read (reference only)
| File | Purpose |
|------|---------|
| `src/app/api/driver/routes/[routeId]/accept/route.ts` | Accept handler spec |
| `src/app/api/driver/routes/[routeId]/start/route.ts` | Start handler spec |
| `src/app/api/driver/routes/[routeId]/complete/route.ts` | Complete handler spec |
| `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` | Stop handler spec |
| `src/lib/validations/route.ts` | Transition constants |
| `src/lib/validations/driver-api.ts` | Stop transition constants |
| `src/app/api/webhooks/stripe/route.ts` | Import contract verification |

## 12. Gray Area Resolutions (All VERY HIGH Confidence)

| Gray Area | Resolution | Confidence | Evidence |
|-----------|-----------|------------|---------|
| Test scope: driver lifecycle only or admin too? | Driver lifecycle only | VERY HIGH | QUAL-01 definition: "driver route lifecycle: assigned → accept → start → stop arrive → stop deliver → next-stop promoted → route complete". Admin PATCH is Phase 105 (ROUTE-03, already shipped). Route starts in `assigned` as precondition, not tested. |
| Integration = HTTP calls or handler imports? | Handler imports with mocked deps | VERY HIGH | All 48 existing tests import handlers directly. `route.test.ts` uses dynamic import `await import("../route")`. No HTTP server, no `supertest`, no `fetch` against localhost. |
| Split granularity: per-event or grouped? | Per-event (4 files) | VERY HIGH | Success criteria: "per-event-type handler files". Even the 35-line `checkout.session.expired` gets its own file per requirements. |
| RPC testing: mock or real DB? | Mock | VERY HIGH | No `docker-compose.yml`, no `supabase/config.toml` test profile, no `pool: "forks"` in vitest config. All 48 tests mock Supabase. |
| Decline route in scope? | No | VERY HIGH | RouteStatus enum: `planned | assigned | accepted | in_progress | completed`. No `declined` value. Decline endpoint resets to `planned`. Not in lifecycle path. |
| Stop skip in scope? | Yes — as separate test case | VERY HIGH | `VALID_STOP_TRANSITIONS`: skip is valid from pending/enroute/arrived. Both delivered AND skipped trigger `promote_next_stop`. Must verify both terminal paths. |
| File naming: dots or kebab? | Kebab-case | VERY HIGH | Zero filenames with dots elsewhere in codebase. `get-handler.ts` precedent from Phase 105-02. |
| Phases 104-108 complete? | Yes, all merged to main | VERY HIGH | Git log last 30 commits, ROADMAP.md marks all [x], PROJECT.md documents completion dates. |
| Sequential test state management? | Mutable shared state within test | VERY HIGH | Rate-limit burst test proves pattern: 15 sequential calls share in-memory state in one `it()`. `vi.mocked().mockResolvedValue()` persists until overwritten — no reset between calls. |
| Will webhook test break after split? | No | VERY HIGH | `route.test.ts` does NOT import from `./handlers`. Mocks at module level, imports route. Node resolves `./handlers` → `./handlers/index.ts` identically. |
| Test file location? | `src/app/api/driver/routes/__tests__/lifecycle.test.ts` | VERY HIGH | Parent-level `__tests__` for cross-cutting tests (precedent: `src/lib/__tests__/rls-edge-cases.test.ts`). Imports from `../[routeId]/accept/route`, etc. Vitest picks up all `*.test.ts` regardless of location. |
| Badge logic — how much to mock? | Mock `checkAndAwardBadges` import | VERY HIGH | Badge block is non-blocking try-catch (lines 110-154). Mock the import to return `[]`. Tests don't need to mock 4 internal badge queries — just the entry point. |
| Start handler `.update()` has no `.select()`? | Correct — accept has `.select("id")`, start does NOT | VERY HIGH | Verified line-by-line: accept (line 65) chains `.select("id")`, start (line 72) does not. Mock chain must match exactly. |

## 13. Exact Mock Chain Reference

Each handler's Supabase query needs a corresponding mock chain. Mismatches cause `not a function` errors.

### Accept Handler — 2 chains
```
routes.select("id, status, driver_id").eq("id", routeId).returns<>().single()
routes.update({ status, accepted_at }).eq("id", routeId).select("id")
```

### Start Handler — 6 chains
```
routes.select("id, status, driver_id").eq("id", routeId).returns<>().single()
routes.update({ status, started_at }).eq("id", routeId)                        ← NO .select()
route_stops.select("id, stop_index").eq("route_id", routeId).order().limit(1).returns<>().single()
route_stops.update({ status: "enroute" }).eq("id", firstStop.id)
route_stops.select("order_id").eq("route_id", routeId)                         ← returns array
orders.update({ status }).in("id", ids).in("status", [...]).select("id")
```

### Complete Handler — 3 chains + badge mock
```
routes.select("id, status, driver_id, stats_json").eq("id", routeId).returns<>().single()
route_stops.select("status").eq("route_id", routeId)                            ← returns array
routes.update({ status, completed_at, stats_json }).eq("id", routeId)
checkAndAwardBadges() → mock import returns []
```

### Stop Handler — 4 chains + RPC
```
routes.select("id, status, driver_id").eq("id", routeId).returns<>().single()
route_stops.select("id, status, route_id, stop_index, order_id").eq("id", stopId).eq("route_id", routeId).returns<>().single()
route_stops.update({ status, arrived_at?, delivered_at?, delivery_notes? }).eq("id", stopId)
orders.update({ status, delivered_at }).eq("id", orderId).eq("status", "out_for_delivery").select("id")  ← only if delivered
supabase.rpc("promote_next_stop", { p_route_id, p_completed_stop_id })          ← only if delivered/skipped
```

## 14. Design Token Audit (N/A)
Phase 109 has no UI components — purely backend tests and file reorganization.

## 15. Verification Checklist
```
[ ] Route lifecycle integration tests pass: pnpm test
[ ] All 4 split handler files under 400 lines
[ ] Barrel re-export preserves import contract (route.ts unchanged)
[ ] No `/* eslint-disable max-lines */` in any handler file
[ ] Existing webhook tests still pass (zero changes to route.test.ts)
[ ] Existing 48 test files pass (no regressions)
[ ] Full suite: pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```
