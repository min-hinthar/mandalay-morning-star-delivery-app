# Phase 109: Enhancement Recommendations

## Priority Matrix

| # | Recommendation | Priority | Effort | Impact |
|---|---------------|----------|--------|--------|
| 1 | Route/stop test factories | MUST-HAVE | Low | High |
| 2 | Full lifecycle sequence test | MUST-HAVE | Medium | Critical |
| 3 | Stop promotion mock + test | MUST-HAVE | Medium | Critical |
| 4 | Error path coverage | MUST-HAVE | Medium | High |
| 5 | Handler split with barrel | MUST-HAVE | Low | High |
| 6 | Stop skip path test | SHOULD-HAVE | Low | Medium |
| 7 | Concurrent stop delivery test | SHOULD-HAVE | Medium | High |
| 8 | Badge award edge case test | SHOULD-HAVE | Low | Medium |
| 9 | Route with no stops edge case | SHOULD-HAVE | Low | Medium |
| 10 | Admin lifecycle guard test | NICE-TO-HAVE | Medium | Medium |
| 11 | Webhook handler unit tests per file | NICE-TO-HAVE | Medium | Medium |
| 12 | E2E test enablement roadmap | NICE-TO-HAVE | Low | Low |

---

## Detailed Recommendations

### 1. Route/Stop Test Factories (MUST-HAVE)

**What:** Add `createMockRoute(status, overrides?)` and `createMockStop(status, overrides?)` factories to `src/test/factories/index.ts`. Support all 5 route statuses and 5 stop statuses with sensible defaults (UUIDs, timestamps, driver_id).

**Why:** No route or stop factories exist. Every route test currently builds mock objects inline, leading to inconsistency and verbosity. Phase 108 added factories for rate limit testing — same pattern needed here.

**Implementation hint:** Follow `createMockOrder()` pattern. Include `createMockRouteWithStops(n, routeStatus, stopStatus)` for nested relation objects.

---

### 2. Full Lifecycle Sequence Test (MUST-HAVE)

**What:** Single test case (or describe block) that calls handlers in sequence: accept → start → stop arrive → stop deliver → verify promotion → route complete. Each step verifies the expected status transition occurred.

**Why:** This is the core of QUAL-01. Currently ZERO integration tests exist for any route lifecycle endpoint. The coverage matrix shows every lifecycle step lacks API handler tests. This single test provides the safety net for all future route changes.

**Implementation hint:** Use `describe("Route Lifecycle Integration")` with sequential `it()` blocks sharing mock state. Mock Supabase `fromMock` to track updates and return updated state for subsequent queries.

---

### 3. Stop Promotion Mock + Test (MUST-HAVE)

**What:** Test that `promote_next_stop` RPC is called with correct args after a stop is delivered or skipped, and that the response (`promoted_stop_id`, `stop_index`) is correctly included in the handler response.

**Why:** Next-stop promotion has ZERO test coverage. It's the most complex piece of the lifecycle — the atomic RPC with `FOR UPDATE SKIP LOCKED` was added in Phase 107 specifically to prevent race conditions. Verifying the handler correctly calls and interprets the RPC is essential.

**Implementation hint:** Mock `supabase.rpc("promote_next_stop", args)` to return `{ data: { promoted_stop_id: "stop-2", stop_index: 1 }, error: null }`. Verify args match `{ p_route_id, p_completed_stop_id }`.

---

### 4. Error Path Coverage (MUST-HAVE)

**What:** Test all error responses for each handler: 400 (invalid status transition), 401 (auth failure), 403 (wrong driver), 404 (route not found), 500 (DB error). Verify error response shapes match documented contracts.

**Why:** Error handling is where bugs hide. The webhook handler learning (return 500 on DB errors) came from a production bug. Each handler has 4-5 error paths that need verification.

**Implementation hint:** Parameterized tests using `it.each()` for status transition matrix. Test that accepting an `in_progress` route returns 400 with correct message.

---

### 5. Handler Split with Barrel (MUST-HAVE)

**What:** Split `handlers.ts` (529 lines) into `handlers/` directory with 4 event-type files + barrel `index.ts`. Each file gets its own imports. Remove `/* eslint-disable max-lines */` comment.

**Why:** Success criteria requires it. File exceeds 400-line ESLint limit. Split is clean — no handler calls another, shared deps are just imports.

**Implementation hint:**
- Create `handlers/` directory
- Move each handler function to its own file with needed imports
- Barrel re-exports all 4 functions
- Delete original `handlers.ts`
- Verify `route.ts` import `from "./handlers"` still resolves

---

### 6. Stop Skip Path Test (SHOULD-HAVE)

**What:** Test that skipping a stop (any non-terminal → `skipped`) calls `promote_next_stop` and correctly advances to the next pending stop.

**Why:** Skip is a valid terminal state alongside delivered. The lifecycle integration test (Rec #2) covers the happy path (deliver); this covers the alternative path. Both terminal states trigger promotion.

**Implementation hint:** Same mock pattern as Rec #3 but with `status: "skipped"` in the request body. Verify promotion RPC still called.

---

### 7. Concurrent Stop Delivery Test (SHOULD-HAVE)

**What:** Test that two simultaneous stop delivery requests don't both promote the same next stop. Verify that when `promote_next_stop` returns `{ promoted_stop_id: null }` (SKIP LOCKED), the handler gracefully returns without a `nextStop` field.

**Why:** This is the exact scenario Phase 107's RPC was designed to prevent. Testing it verifies the handler correctly interprets a null promotion result.

**Implementation hint:** First call returns `{ promoted_stop_id: "stop-3", stop_index: 2 }`. Second call returns `{ promoted_stop_id: null, stop_index: null }`. Verify second response has no `nextStop`.

---

### 8. Badge Award Edge Case Test (SHOULD-HAVE)

**What:** Test that route completion succeeds even when badge calculation fails (driver not found, RPC error, insert error). Verify the response still has `success: true` with `newBadges: []`.

**Why:** Badge logic is non-blocking (Phase 107 learning: badge double-count fix). If badge check throws, route completion must still succeed. This is a documented edge case in the complete handler.

**Implementation hint:** Mock `supabase.from("drivers").select(...).single()` to return `{ data: null, error: { message: "not found" } }`. Verify response is 200 with `newBadges: []`.

---

### 9. Route with No Stops Edge Case (SHOULD-HAVE)

**What:** Test that starting a route with no stops returns `{ firstStopId: null, ordersTransitioned: 0 }` and completing it returns `{ stats: { total_stops: 0, completion_rate: 0 } }`.

**Why:** Edge case that could cause null pointer exceptions if not handled. The start handler queries for first stop with `.limit(1).single()` which returns null when no stops exist.

**Implementation hint:** Mock route_stops queries to return `{ data: [], error: null }` for select and `{ data: null, error: null }` for single.

---

### 10. Admin Lifecycle Guard Test (NICE-TO-HAVE)

**What:** Test admin PATCH endpoint's lifecycle validation — verify it rejects invalid transitions and returns `{ error, validTransitions }` in the 400 response.

**Why:** Admin PATCH is Phase 105 territory, not strictly QUAL-01 scope. But it uses the same `VALID_ROUTE_TRANSITIONS` constant, and testing it alongside driver endpoints ensures the constant is correct for both consumers.

**Implementation hint:** Reuse the same mock pattern with `requireAdmin()` instead of `requireDriver()`. Focus on transition validation only (3-4 test cases).

---

### 11. Webhook Handler Unit Tests Per File (NICE-TO-HAVE)

**What:** After splitting handlers, add a small unit test for each handler file verifying its core logic (order status update, email send, error handling).

**Why:** The existing `route.test.ts` tests the webhook route entry point, but individual handlers don't have focused tests. Post-split, each file could have a co-located `__tests__/` directory.

**Implementation hint:** Extract handler tests from existing `route.test.ts` into per-handler test files. Low effort since tests already exist — just reorganize.

---

### 12. E2E Test Enablement Roadmap (NICE-TO-HAVE)

**What:** Document what's needed to enable the 6 skipped E2E driver lifecycle tests in `e2e/driver-flow.spec.ts`. Don't implement — just document the auth fixture setup and test data requirements.

**Why:** All E2E route lifecycle tests are currently skipped (`test.skip`). Understanding the blockers helps future phases. The integration tests from QUAL-01 provide immediate coverage, but E2E tests are the long-term goal.

**Implementation hint:** Check what auth fixture setup is needed (Supabase test user, driver role, route seed data). Document in a comment block at the top of the E2E file.
