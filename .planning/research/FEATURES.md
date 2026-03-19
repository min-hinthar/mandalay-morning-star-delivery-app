# Feature Landscape: v2.2 Stability & Correctness

**Domain:** Delivery app bug fixes -- route lifecycle, checkout validation, timezone correctness, rate limiting
**Researched:** 2026-03-19
**Mode:** Fix/correctness milestone (not greenfield features)

---

## Table Stakes

Fixes without which the system is broken or produces incorrect behavior in production.

### Route Lifecycle State Machine

| Fix | Issue | Why Broken | Complexity | Files |
|-----|-------|-----------|------------|-------|
| Driver cannot start `assigned` route -- UI shows "Start" but API rejects | F | `start` endpoint allows `planned`/`accepted` but not `assigned`. Driver sees route via `active` query with `.in("status", ["assigned", "accepted", "planned", "in_progress"])`. No UI gate between "Accept" and "Start" CTAs. | Low | `active/route.ts:168`, driver route UI |
| `updateRouteStats` counts `enroute` stop as `pending` | I | Dashboard shows 0 stops in-progress. `pending_stops: stops.filter(s => s.status === "pending" \|\| s.status === "enroute").length` conflates two distinct states. Admin sees misleading counts. | Low | `stops/[stopId]/route.ts:218-222` |
| Missing `increment_driver_deliveries` RPC -- delivery count never incremented | J | `deliveries_count` stays 0 forever. Try/catch swallows the missing RPC. Badge eligibility calculated from single-route data only. | Low | `complete/route.ts:109-118`, new migration |
| Race condition in next-stop promotion (SELECT then UPDATE) | 9 | Two parallel stop completions can both find same `pending` stop as "next". Rapid offline queue drain triggers this. Classic read-then-write race. | Med | `stops/[stopId]/route.ts:167-186` |
| Admin route status override bypasses lifecycle guards | G | Admin PATCH can set `in_progress` on `planned`/`assigned` route without driver acceptance. Can set `planned` with driver still attached. No valid-transition check, no audit trail. | Med | `admin/routes/[id]/route.ts:340-366` |

**Standard pattern (HIGH confidence):** Delivery/logistics systems enforce transitions via a declarative transition table -- every `(current_state, event)` pair maps to exactly one `next_state` or is rejected. The codebase already has this pattern for *stop* transitions (`VALID_STOP_TRANSITIONS` in `driver-api.ts`) but not for *route* transitions. Route status is checked via ad-hoc `if` statements scattered across 4 endpoints. A single `VALID_ROUTE_TRANSITIONS` map checked at every mutation point is the standard fix.

**Race condition fix (HIGH confidence):** PostgreSQL atomic UPDATE with WHERE clause eliminates the read-then-write race. Instead of `SELECT id FROM route_stops WHERE status = 'pending' ORDER BY stop_index LIMIT 1` followed by `UPDATE route_stops SET status = 'enroute' WHERE id = $1`, use a single `UPDATE route_stops SET status = 'enroute' WHERE id = (SELECT id FROM route_stops WHERE route_id = $1 AND status = 'pending' ORDER BY stop_index LIMIT 1) RETURNING id`. This is a standard pattern documented in PostgreSQL concurrency guides. Alternatively, wrap in a Supabase RPC for cleaner application code.

### Checkout Timezone & Date Validation

| Fix | Issue | Why Broken | Complexity | Files |
|-----|-------|-----------|------------|-------|
| `scheduledDate` parsed with `T12:00:00` implicit UTC | A | `new Date("2026-03-19T12:00:00")` is noon UTC on Vercel. Works by accident because `getZonedParts` converts downstream. Breaks if server TZ changes or date is near midnight. | Low | `checkout/session/route.ts:53` |
| COD email sends naive ISO strings (no timezone offset) | B | Email template receives `2026-03-19T11:00:00` without `-07:00` suffix. Email client may interpret as UTC, showing wrong delivery time to customer. DB stores correct TZ-aware strings; email path is inconsistent. | Low | `checkout/session/helpers.ts:119-120, 158-159` |
| No future date upper bound on checkout | E | Customer can submit `scheduledDate` for 2028. Only regex validation `^\d{4}-\d{2}-\d{2}$`. No maximum days-ahead check. | Low | `checkout/session/route.ts`, Zod schema |
| Delivery reminder cron uses UTC date, not LA date | 6 | `new Date().toISOString().split("T")[0]` computes UTC "today". Between midnight UTC and 7-8 AM LA, cron queries wrong date -- sends no reminders or yesterday's reminders. | Low | `cron/delivery-reminders/route.ts:60` |
| `getAvailableDeliveryDatesMultiDay` includes cutoff-passed dates consuming slots | C | Past-cutoff dates consume the limited `count` slots (default 6). Customer sees fewer available dates. Auto-select `useEffect` flashes disabled then enabled. | Low | `delivery-dates.ts:283-312` |

**Standard pattern (HIGH confidence):** Store UTC `timestamptz` in database. Compute "today" in the business timezone using `Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" })`. The codebase already has a correct `getTodayInTimezone()` helper in `active/route.ts:9-17` and uses `toISOWithTimezone()` for DB writes -- the cron endpoint and COD email path just don't use them. Fix is applying existing patterns consistently.

**Date bounds (MEDIUM confidence):** Food delivery apps limit scheduling to 7-14 days ahead. WooCommerce delivery date plugins offer configurable min/max date bounds. For a weekly service with 4 delivery days, 21 days (3 weeks of dates shown in picker) is a reasonable upper bound. Add validation: `reject if scheduledDate > today + 21 days`.

### Rate Limiting

| Fix | Issue | Why Broken | Complexity | Files |
|-----|-------|-----------|------------|-------|
| All 13 rate limiters are null -- in-memory fallback per-instance | 3 | Every limiter exports `null`. Fallback is 15 req/min per serverless instance. Attacker hits N instances = N*15 req/min. Auth, checkout, refund endpoints effectively unprotected. | Med | `rate-limit/client.ts`, env config |

**Standard pattern (HIGH confidence):** `@upstash/ratelimit` with Upstash Redis REST is the documented Next.js/Vercel serverless pattern. Vercel's own templates use it. The codebase already has the correct architecture (typed limiter exports, `checkRateLimit` wrapper, fail-open design). Setup is purely infrastructure: provision Upstash Redis instance, set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env vars, restore `Ratelimit` constructors with `Ratelimit.slidingWindow()`. The existing code was designed for this -- Redis provisioning was the blocker (Redis Cloud `redis://` URL incompatible with `@upstash/redis` REST client).

### Data Integrity

| Fix | Issue | Why Broken | Complexity | Files |
|-----|-------|-----------|------------|-------|
| `active/route` API missing `customer_name`/`customer_phone` fallback | 7 | Driver can't call COD customers whose profile lacks phone. Route-detail endpoint at `/api/driver/routes/[routeId]/route.ts:201` correctly falls back to `orders.customer_name`; active endpoint only reads `profiles`. | Low | `active/route.ts:193-204` |
| Regenerate Supabase types for `delivery_zones` table | 4 | 3 files use `as any` casts. No type safety on zone queries -- wrong column names silently fail. Table exists in migration but not in generated types. | Low | `business-rules.ts:125`, `delivery-zones/route.ts` |
| `revalidateTag` called with invalid `{ expire: 0 }` second argument | 5 | Next.js `revalidateTag(tag)` takes no options parameter. Second arg silently ignored. Intent was immediate expiry but that's the default behavior. | Low | 4 admin API files |

---

## Differentiators

Improvements beyond the bare fix that raise correctness or observability quality.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Centralized `VALID_ROUTE_TRANSITIONS` map | Single record of allowed `(from, to)` pairs used by both driver and admin endpoints. Prevents any future lifecycle bypass. Mirrors existing `VALID_STOP_TRANSITIONS`. | Low | New file in `validations/`, ~30 lines |
| Admin status override audit log | Log overrides with `{ admin_id, route_id, from_status, to_status, timestamp }`. Essential for debugging Saturday ops. | Med | New migration for `route_audit_log` table + insert in admin PATCH |
| Separate `enroute_stops` in route stats | Dashboard shows "1 in progress, 4 pending" instead of "5 pending". More accurate ops view. | Low | Add field to `RouteStats` type + update calculation |
| Integration tests for driver route lifecycle | Full sequence: `assigned` -> accept -> start -> mark stops -> complete. Catches state machine regressions before production. | Med | New test file, mock Supabase client |
| Atomic `promote_next_stop` RPC | PostgreSQL function wrapping the "find next pending + set enroute" into one atomic operation. Cleaner than inline subquery UPDATE. | Med | New migration, simpler application code |
| Webhook `handlers.ts` file split | 529 lines with eslint-disable. Split into `handle-checkout-completed.ts`, `handle-payment-failed.ts`, etc. | Low | Mechanical refactor, zero logic change |

---

## Anti-Features

Things to deliberately NOT build during this correctness milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Per-day delivery time windows | Issue D notes global windows. Adding `startHour`/`endHour` per `DeliveryDayConfig` needs schema change + UI. Not a bug -- works correctly with uniform hours. | Document as future enhancement if business requests different hours per day. |
| Real-time route status via Supabase Realtime | 5s polling is sufficient at 20-50 orders. Realtime channels are scope creep for a fix milestone. | Keep polling. Revisit at 200+ orders. |
| Edge middleware rate limiting | Architecturally better to rate-limit at the edge. But refactoring from API-level to middleware is a separate project. | Restore Upstash at API level first. Edge migration is a separate milestone. |
| Full idempotency system | Server-generated idempotency keys + dedup table is overkill at current scale. Stop transition validation already provides natural idempotency (re-submitting same transition returns 400). | Rely on transition validation for stops. Route start is naturally idempotent (400 if already `in_progress`). |
| Realtime cache invalidation for business rules | Issue 8 notes 5-min stale window across instances. Realtime subscription would fix but adds complexity. | Accept 5-min TTL. Tag-based `revalidateTag` works at this scale. Operator rarely changes settings during active delivery. |
| Retry queue for `increment_driver_deliveries` | Complex retry/queue for an RPC at 2-4 drivers is over-engineering. | Create the missing RPC. Simple call + log failure. Manual DB fix covers any missed increment. |
| Route optimization algorithm | Explicitly deferred in PROJECT.md. Manual drag-reorder shipped in v2.1. | Keep existing Google Directions optimization + manual reorder. |
| Comprehensive E2E test suite | Full Playwright E2E for all flows would take longer than the fixes themselves. | Targeted integration tests for the state machine. Unit tests for timezone helpers. E2E is a separate effort. |

---

## Feature Dependencies

```
Fix 4 (regenerate types)         ── Do FIRST: enables type safety for all subsequent work
  |
  v
Fix 5 (revalidateTag args)       ── Independent, trivial cleanup
Fix 7 (customer contact fallback) ── Independent, trivial query change

Fix A (timezone construction)    ─┐
Fix B (COD email timezone)        ├── Timezone cluster: same pattern, test together
Fix 6 (cron UTC date)            ─┘
  |
  v
Fix C (cutoff date pre-filter)   ── Depends on timezone fixes being correct
Fix E (future date bound)        ── Pairs naturally with checkout validation

Fix F (assigned status gate)     ─┐
Fix I (enroute stat counting)     ├── State machine cluster
Fix G (admin override guards)    ─┘
  |
  v
Integration tests                ── Must follow state machine fixes

Fix 9 (race condition)           ── Independent, DB-level atomic fix
Fix J (missing RPC)              ── Independent, new migration
Fix 3 (rate limiting)            ── Independent, infrastructure provisioning
```

### Suggested Phase Ordering

```
Phase 1: Foundation
  - Fix 4: Regenerate Supabase types
  - Fix 5: Remove invalid revalidateTag args
  - Fix 7: Add customer_name/phone fallback to active route
  (Low risk, unblocks type safety)

Phase 2: Timezone correctness
  - Fix A: Explicit timezone construction in checkout
  - Fix B: TZ-aware strings in COD email
  - Fix 6: LA timezone in delivery reminder cron
  - Fix C: Pre-filter cutoff-passed dates
  - Fix E: Add future date upper bound (21 days)
  (All use same Intl.DateTimeFormat pattern)

Phase 3: Route lifecycle
  - Fix F: Gate driver UI by assigned vs accepted status
  - Fix I: Separate enroute from pending in stats
  - Fix G: Add transition guards to admin PATCH
  - Differentiator: VALID_ROUTE_TRANSITIONS centralized map
  (State machine correctness cluster)

Phase 4: Data integrity
  - Fix 9: Atomic next-stop promotion (RPC or subquery UPDATE)
  - Fix J: Create increment_driver_deliveries migration
  (Database-level fixes)

Phase 5: Security & infrastructure
  - Fix 3: Provision Upstash Redis, restore rate limiters
  (Infrastructure task, test in staging before production)

Phase 6: Quality
  - Integration tests for driver route lifecycle
  - Split webhook handlers.ts
  (Coverage and maintenance)
```

---

## MVP Recommendation

**Must ship (table stakes):**

1. Regenerate Supabase types (4) -- foundation for type safety
2. Fix driver route start blocked by `assigned` status (F) -- driver-facing blocker
3. Fix all timezone bugs (A, B, 6) -- correctness cluster, same pattern
4. Create `increment_driver_deliveries` RPC (J) -- data integrity
5. Fix race condition in next-stop promotion (9) -- concurrent safety
6. Add future date upper bound on checkout (E) -- security
7. Provision Upstash Redis rate limiting (3) -- security table stakes
8. Fix `active/route` customer contact fallback (7) -- driver cannot call COD customers
9. Fix `updateRouteStats` enroute counting (I) -- dashboard accuracy
10. Fix `revalidateTag` args (5) -- code correctness
11. Pre-filter cutoff-passed dates (C) -- customer UX
12. Guard admin route status override (G) -- lifecycle integrity

**Should ship (differentiators):**

13. Centralized route transition map -- prevents future bypasses
14. Split webhook `handlers.ts` -- tech debt, reduces file to <400 lines
15. Integration tests for driver route lifecycle -- regression safety

**Defer:**

- Per-day time windows (Issue D), edge rate limiting, Realtime cache invalidation, full idempotency, comprehensive E2E suite, route optimization algorithm

---

## Complexity Assessment

| Fix | Est. Lines Changed | New Dependencies | Risk | Category |
|-----|-------------------|------------------|------|----------|
| Types regen (4) | ~0 (generated) | None | Low | Foundation |
| revalidateTag args (5) | ~4 | None | Low | Cleanup |
| Customer contact fallback (7) | ~10 | None | Low | Query fix |
| Timezone construction (A) | ~5 | None | Low | Pattern application |
| COD email timezone (B) | ~10 | None | Low | Pattern application |
| Cron UTC date (6) | ~5 | None | Low | Pattern application |
| Cutoff pre-filter (C) | ~15 | None | Low | Logic fix |
| Future date bound (E) | ~10 | None | Low | Validation add |
| Status gate (F) | ~20 | None | Low | UI conditional |
| Enroute stats (I) | ~15 | None | Low | Stats calculation |
| Admin override guard (G) | ~40 | None | Med | Transition validation |
| Race condition (9) | ~30 | None | Med | Atomic DB operation |
| Missing RPC (J) | ~20 | None | Low | New migration |
| Rate limiting (3) | ~30 | None (deps exist) | Med | Infrastructure + code |
| Route transition map | ~40 | None | Low | New validation file |
| Webhook split | ~50 | None | Low | Mechanical refactor |
| Integration tests | ~200 | None | Med | New test file |
| **Total** | **~505** | **None** | | |

---

## Sources

### State Machine Patterns
- [State Machine Design Pattern (LinkedIn)](https://www.linkedin.com/pulse/state-machine-design-pattern-concepts-examples-python-sajad-rahimi) -- MEDIUM confidence
- [State Design Pattern (SourceMaking)](https://sourcemaking.com/design_patterns/state) -- HIGH confidence
- [commercetools State Machines](https://docs.commercetools.com/learning-model-your-business-structure/state-machines/state-machines-page) -- HIGH confidence
- Existing codebase `VALID_STOP_TRANSITIONS` in `driver-api.ts` -- HIGH confidence (proven pattern in same codebase)

### Race Condition Prevention
- [Preventing Postgres Race Conditions with SELECT FOR UPDATE](https://on-systems.tech/blog/128-preventing-read-committed-sql-concurrency-errors/) -- HIGH confidence
- [Atomic read-then-write patterns](https://thomwright.co.uk/failure-patterns/atomic-read-then-write/) -- HIGH confidence
- [Transaction Locking (sqlfordevs.com)](https://sqlfordevs.com/transaction-locking-prevent-race-condition) -- HIGH confidence

### Timezone Handling
- [Intl.DateTimeFormat (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat) -- HIGH confidence
- Existing codebase `getTodayInTimezone()` in `active/route.ts` and `toISOWithTimezone()` in `delivery-timezone.ts` -- HIGH confidence (proven helpers in same codebase)

### Rate Limiting
- [Upstash Rate Limiting Docs](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) -- HIGH confidence
- [Rate Limiting Next.js API Routes (Upstash Blog)](https://upstash.com/blog/nextjs-ratelimiting) -- HIGH confidence
- [Vercel Ratelimit Template](https://vercel.com/templates/next.js/ratelimit-with-upstash-redis) -- HIGH confidence

### Delivery App UX
- [Hyperlocal Delivery App Development (Appinventiv)](https://appinventiv.com/blog/hyperlocal-delivery-app-development/) -- MEDIUM confidence
- [Delivery Date Scheduling (WooCommerce)](https://woocommerce.com/document/order-delivery-date-and-time-scheduler/) -- MEDIUM confidence

---
*Feature research for: v2.2 Stability & Correctness*
*Researched: 2026-03-19*
