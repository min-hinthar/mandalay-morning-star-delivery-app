# Phase 106: Timezone Correctness — Precontext Research

## 1. Resolved Assumptions

### Technical Approach
- **Timezone standard**: All date/time operations pinned to `America/Los_Angeles` via `TIMEZONE` constant from `src/types/delivery.ts`
- **Helper reuse**: Existing `toISOWithTimezone()`, `getZonedDayOfWeek()`, `getZonedParts()`, `isPastCutoffForDay()` are correct and reusable — no new timezone library needed
- **Database storage**: All timestamps stored as `TIMESTAMPTZ` (PostgreSQL stores in UTC); display via LA-timezone-aware formatters
- **IMMUTABLE wrapper**: `delivery_date(ts)` SQL function already wraps `ts AT TIME ZONE 'America/Los_Angeles'` for index expressions — no migration needed
- **DST handling**: `Intl.DateTimeFormat` with `timeZone: TIMEZONE` handles DST automatically — no manual offset tables

### Scope Boundaries
- **IN**: SC-1 through SC-5 (checkout date construction, COD email offset display, cron LA date, date picker pre-filter, 30-day future limit)
- **IN**: Fix hardcoded timezone strings in `useDeliveryGate.ts` and `delivery-timezone.ts`
- **IN**: Fix email formatting in `DeliveryBlock.tsx` (add `timeZone` param + display offset)
- **IN**: Fix test `makePtDate()` DST hardcoding + add DST transition tests
- **OUT**: Admin daily digest cron (not in SC — flag for future phase)
- **OUT**: Driver availability timezone bug (`availability.ts:67`) — opportunistic only
- **OUT**: Admin dashboard date formatting (not customer-facing)
- **OUT**: Adding "PST"/"PDT" labels to checkout UI (SC requires data correctness, not UI labels)

### Implementation Order
1. Fix checkout `scheduledDate` construction (SC-1) — unblocks correct cutoff validation
2. Fix COD email delivery window props (SC-2) — depends on correct ISO strings from step 1
3. Fix cron reminder LA date computation (SC-3) — independent
4. Pre-filter cutoff-passed dates in `getAvailableDeliveryDatesMultiDay()` (SC-4) — independent
5. Add 30-day future validation to checkout API (SC-5) — independent

## 2. Realistic Data/Scale Analysis

| Metric | Value | Timezone Impact |
|--------|-------|-----------------|
| Orders/week | 20-50 | Low volume; timezone bugs affect individual customers, not system load |
| Delivery days | Mon/Wed/Thu/Sat | 4 cutoff boundaries per week to get right |
| Drivers | 2-4 family members | All in LA timezone; driver TZ bugs low-impact |
| Coverage radius | 50mi from Covina CA | All customers in Pacific timezone |
| Cron frequency | Daily at ~8 AM PT | Single execution; wrong date = missed reminders for entire day |
| DST transitions | 2/year (Mar, Nov) | 4 hours of vulnerability window per transition |
| Email recipients | All customers + admins | Emails render in any timezone; offset display critical |

## 3. Cross-Phase Contract Inventory

### From Phase 104 (Type Safety)
| Contract | Detail | Must Preserve |
|----------|--------|---------------|
| RouteStatus type | `"planned" \| "assigned" \| "accepted" \| "in_progress" \| "completed"` | YES |
| delivery_zones typed | No `as any` casts on zone queries | YES |
| Customer contact fallback | `order.customer_name ?? profile.full_name` | YES |
| pending_stops semantics | Count only `status: "pending"`, not enroute | YES |
| FK hints | All `routes→drivers` queries use `!routes_driver_id_fkey` | YES |

### From Phase 105 (Route Lifecycle Guards)
| Contract | Detail | Must Preserve |
|----------|--------|---------------|
| VALID_ROUTE_TRANSITIONS | Record<RouteStatus, RouteStatus[]> in `src/lib/validations/route.ts` | YES |
| Timestamp semantics | `accepted_at` cleared on downgrade, `declined_at` never cleared | YES |
| Admin PATCH guard | Returns 400 with `{ error, validTransitions }` on invalid transition | YES |
| CHECK constraint | `chk_planned_unassigned`: `status != 'planned' OR driver_id IS NULL` | YES |
| Sentry audit | `captureMessage` after successful admin status changes | YES |

### Feeds Into Future Phases
| Phase | What 106 Provides |
|-------|-------------------|
| 107 (Data Integrity) | Correct timezone semantics for stop promotion timing |
| 108 (Rate Limiting) | No new endpoints; existing rate limiter targets unchanged |
| 109 (Quality/Tests) | Timezone-aware test fixtures; DST boundary coverage |

## 4. UI Element Analysis (Date/Time Displays)

### Customer-Facing
| Component | File | Current Format | Timezone Aware | Phase 106 Action |
|-----------|------|---------------|----------------|-----------------|
| DatePill | `TimeSlotPicker/DatePill.tsx` | "Fri 25 Mar" | YES (uses TIMEZONE) | None needed |
| TimeSlotPill | `TimeSlotPicker/TimeSlotPill.tsx` | "10:00 AM - 6:00 PM" | N/A (label from config) | None needed |
| TimeSlotDisplay | `checkout/TimeSlotDisplay.tsx` | "Mon, Mar 19" | YES (uses TIMEZONE) | None needed |
| DeliveryBanner | `delivery/DeliveryBanner.tsx` | "Delivering Saturday, March 22" | YES (via displayDate) | None needed |
| CutoffModal | `delivery/CutoffModal.tsx` | "Saturday, March 22" | YES (via displayDate) | None needed |
| OrderSummary | `orders/tracking/OrderSummary.tsx` | "Saturday, Mar 22 • 10:00 AM - 6:00 PM" | NO (date-fns, no TZ) | Out of scope* |

### Email Templates
| Component | File | Current Format | Timezone Aware | Phase 106 Action |
|-----------|------|---------------|----------------|-----------------|
| DeliveryBlock | `emails/components/DeliveryBlock.tsx` | "Friday, March 22, 2026 / 10:00 AM - 6:00 PM" | NO | **FIX: Add timeZone param + offset display (SC-2)** |
| OrderConfirmation | `emails/OrderConfirmation.tsx` | Uses DeliveryBlock | NO | Inherits fix |
| DeliveryReminder | `emails/DeliveryReminder.tsx` | Uses DeliveryBlock | NO | Inherits fix |
| helpers.ts | `emails/helpers.ts` | formatDate() no TZ | NO | **FIX: Add timeZone param** |

*OrderSummary uses date-fns without timezone — real bug but not in Phase 106 success criteria.

### Driver-Facing
| Component | File | Timezone Aware | Phase 106 Action |
|-----------|------|----------------|-----------------|
| StopCard | `driver/StopCard.tsx` | NO (no TZ param) | Out of scope |
| StopDetail | `driver/StopDetail.tsx` | NO (no TZ param) | Out of scope |

## 5. Gotcha Inventory

### Critical (Will break in production)
| # | Gotcha | Source | Phase 106 Fix |
|---|--------|--------|---------------|
| G1 | `getUTCDay()` wrong in LA timezone | CLAUDE.md | Use `getZonedDayOfWeek()` everywhere |
| G2 | `new Date("YYYY-MM-DD")` parses as UTC midnight | nextjs.md | Use `toISOWithTimezone()` or explicit `Z` suffix |
| G3 | `void asyncFn()` killed on Vercel | CLAUDE.md | Use `after()` for all email sends |
| G4 | `toISOString().split("T")[0]` returns UTC date | Codebase | Use `Intl.DateTimeFormat` with LA timezone |
| G5 | PostgREST FK hints required for routes→drivers | data-schema.md | Any new route query uses `!routes_driver_id_fkey` |

### High (Silent failures)
| # | Gotcha | Source | Phase 106 Fix |
|---|--------|--------|---------------|
| G6 | `.update()` returns no row count | stripe.md | Chain `.select("id")` to verify |
| G7 | Service client `auth.getUser()` returns null | supabase-auth.md | Use `auth.admin.getUserById()` |
| G8 | `DO NOTHING` won't fill NULL cols | CLAUDE.md | Use `DO UPDATE WHERE col IS NULL` |
| G9 | Email template `toLocaleTimeString()` uses server TZ | DeliveryBlock.tsx | Add `timeZone: "America/Los_Angeles"` param |
| G10 | Test `makePtDate()` hardcodes `-08:00` (ignores DST) | test files | Refactor to dynamic offset |

### Medium
| # | Gotcha | Source | Phase 106 Fix |
|---|--------|--------|---------------|
| G11 | Vercel cron schedules are UTC-fixed (no DST) | vercel.json | Document as known limitation |
| G12 | `DELIVERY_TIMEZONE` not in `.env.example` | config audit | Add documentation |
| G13 | Hardcoded `"America/Los_Angeles"` in 2 files | config audit | Replace with TIMEZONE import |

## 6. Data Contracts

### Timezone Constant
```typescript
// src/types/delivery.ts:21
export const TIMEZONE = process.env.DELIVERY_TIMEZONE || "America/Los_Angeles";
```

### ISO Format With Offset
```
Pattern: YYYY-MM-DDTHH:MM:SS±HH:MM
PST:     2026-01-15T12:00:00-08:00
PDT:     2026-07-15T12:00:00-07:00
Generator: toISOWithTimezone(date: string, time: string): string
```

### Database Columns (orders table)
| Column | Type | Storage | Display |
|--------|------|---------|---------|
| delivery_window_start | TIMESTAMPTZ | UTC internally | Format with LA timezone |
| delivery_window_end | TIMESTAMPTZ | UTC internally | Format with LA timezone |
| placed_at | TIMESTAMPTZ | UTC | Format with LA timezone |

### DeliveryDate Interface
```typescript
interface DeliveryDate {
  date: Date;
  dateString: string;        // "YYYY-MM-DD"
  displayDate: string;       // "Monday, March 19, 2026"
  isNextWeek: boolean;
  cutoffPassed: boolean;
}
```

### DeliveryDayConfig Interface
```typescript
interface DeliveryDayConfig {
  dayOfWeek: number;         // 0=Sun...6=Sat
  isActive: boolean;
  cutoffDay: number;         // Day before delivery
  cutoffHour: number;        // Hour (0-23) in LA timezone
  direction?: string;        // "east"|"west"|"south"|"all"
}
```

## 7. Design Compliance Matrix

| Principle | Requirement | Phase 106 Compliance |
|-----------|-------------|---------------------|
| Timezone consistency | All dates in LA timezone | Fixing 5 bugs to achieve |
| Email warmth | "Mingalabar!" greeting, warm tone | No changes to greeting/tone |
| Delivery window caveat | "preferred window, not guaranteed" | Already present in DeliveryBlock |
| 12-hour time format | "h:mm AM/PM" with explicit period | Maintained in all fixes |
| Day-of-week context | Always include weekday name | Maintained in formatDisplayDate |
| Monospace for prices only | No monospace for dates/times | Maintained |

## 8. Identity/Brand Framework

### Content Constraints for Timezone Display
- **DO**: Show day-of-week + full date ("Saturday, March 20, 2026")
- **DO**: 12-hour time with AM/PM ("2:00 PM - 3:00 PM PDT")
- **DO**: Include caveat in emails ("preferred delivery window, not a guaranteed arrival time")
- **DON'T**: Use monospace for dates/times (too clinical)
- **DON'T**: Abbreviate "PT" without spelling out "Pacific Time" at least once
- **DON'T**: Use vague time language ("arriving soon") — use explicit windows

### Email Tone (Unchanged)
- Greeting: "Mingalabar!" (non-negotiable)
- COD notice: warm, not corporate ("We've received it and our team will confirm it shortly")
- Reminder: excitement-driven ("Your Burmese feast is arriving today!")

## 9. Architectural Decisions

### Decision 1: Fix data layer only, not UI labels
- **Options**: (A) Fix data + add "PST"/"PDT" to all UIs, (B) Fix data only + email offset per SC-2
- **Chosen**: B — SC-2 explicitly requires email offset; other SCs require data correctness only
- **Rationale**: Minimal scope, all customers in LA timezone, UI labels add clutter

### Decision 2: Pre-filter vs disable in date picker
- **Options**: (A) Remove cutoff-passed dates entirely, (B) Keep disabled pill pattern
- **Chosen**: B (current behavior) — user sees context, better UX
- **Rationale**: SC-4 says "shows only future dates with cutoff not yet passed" — interpret as pre-filter in `getAvailableDeliveryDatesMultiDay()` so slots aren't wasted, but DatePill still shows disabled state for any edge cases

### Decision 3: 30-day limit storage
- **Options**: (A) Hardcoded constant, (B) Configurable via app_settings
- **Recommended**: A (hardcoded constant `MAX_DELIVERY_DAYS_FUTURE = 30`)
- **Rationale**: Simpler; 30 days is a safety guard, not a business rule that changes. Consistent with `CUTOFF_SAFETY_BUFFER_MS` pattern.

### Decision 4: Admin daily digest cron — defer
- **Options**: (A) Fix in Phase 106, (B) Defer to Phase 109
- **Chosen**: B — not in success criteria, admin-facing only, lower impact
- **Rationale**: Phase 106 scope is customer-facing timezone correctness

## 10. File Map

### CREATE
| File | Purpose |
|------|---------|
| (none) | No new files needed — all fixes in existing files |

### MODIFY
| File | Change |
|------|--------|
| `src/app/api/checkout/session/route.ts` | L53: Replace `new Date(scheduledDate + "T12:00:00")` with `toISOWithTimezone`; add 30-day validation |
| `src/app/api/checkout/session/helpers.ts` | L119-120, L158-159: Use `toISOWithTimezone()` for email props |
| `src/app/api/cron/delivery-reminders/route.ts` | L60: Replace UTC date with LA-timezone-aware date computation |
| `src/lib/utils/delivery-dates.ts` | `getAvailableDeliveryDatesMultiDay()`: Pre-filter cutoff-passed candidates |
| `src/emails/components/DeliveryBlock.tsx` | L19-35: Add `timeZone: TIMEZONE` to formatters + display offset |
| `src/emails/helpers.ts` | formatDate(): Add `timeZone: TIMEZONE` parameter |
| `src/emails/OrderConfirmation.tsx` | Local formatDate(): Add `timeZone: TIMEZONE` parameter |
| `src/lib/hooks/useDeliveryGate.ts` | L48: Replace hardcoded `"America/Los_Angeles"` with TIMEZONE import |
| `src/lib/utils/delivery-timezone.ts` | L8: Replace hardcoded `"America/Los_Angeles"` with TIMEZONE import |
| `src/lib/utils/__tests__/delivery-dates.test.ts` | Refactor `makePtDate()` for DST; add DST transition tests |
| `src/lib/utils/__tests__/delivery-dates-multiday.test.ts` | Same `makePtDate()` refactor |

### READ (reference during implementation)
| File | Why |
|------|-----|
| `src/lib/utils/delivery-dates.ts` | Core timezone utilities — pattern reference |
| `src/lib/services/cod-order.ts` | Verify COD path uses `toISOWithTimezone()` correctly |
| `src/types/delivery.ts` | TIMEZONE constant definition |
| `src/app/api/driver/routes/active/route.ts` | Reference `getTodayInTimezone()` pattern for cron fix |

### REUSE (existing patterns)
| Pattern | Source | Apply To |
|---------|--------|----------|
| `getTodayInTimezone()` | `driver/routes/active/route.ts:9-17` | Cron reminder date computation |
| `toISOWithTimezone()` | `delivery-timezone.ts` | Checkout date + email props |
| `getZonedDayOfWeek()` | `delivery-dates.ts:106-109` | Any day-of-week calculation |

## 11. Gray Area Resolutions

| # | Gray Area | Resolution | Confidence |
|---|-----------|-----------|-----------|
| 1 | UI timezone labels scope | Email only per SC-2; other UIs data-correctness only | HIGH |
| 2 | Admin daily digest cron | Out of scope; defer to Phase 109 | HIGH |
| 3 | Driver availability TZ bug | Out of scope; opportunistic fix only | MEDIUM |
| 4 | Test DST hardcoding | In scope; tests must validate DST correctly | HIGH |
| 5 | Email timezone display | Required per SC-2 ("with timezone offset (e.g., PST)") | HIGH |
| 6 | 30-day limit storage | Hardcoded constant (simpler, safety guard) | MEDIUM-HIGH |
| 7 | DST transition tests | Required; add March 8 + Nov 1 test cases | HIGH |
| 8 | Pre-filter vs disable | Pre-filter in utility; keep disabled pill UX | MEDIUM-HIGH |
| 9 | date-fns vs Intl mixing | Keep mixed; Intl for calculations, date-fns for display | HIGH |
| 10 | COD order date path | Already correct via `toISOWithTimezone()` in `cod-order.ts` | HIGH |

## 12. Core Domain Architecture

### Flow 1: Checkout → Stripe
```
Customer selects date (DatePill) → TimeStepV8 → POST /api/checkout/session
  → route.ts:53 [BUG] new Date(scheduledDate + "T12:00:00") — no TZ
  → getZonedDayOfWeek(scheduledDate) — receives wrong Date
  → isPastCutoffForDay(scheduledDate, dayConfig, now) — wrong cutoff check
  → toISOWithTimezone(scheduledDate, timeWindowStart) — correct DB storage
  → Stripe metadata: raw strings (no offset)
```

### Flow 2: Checkout → COD → Email
```
POST /api/checkout/session → createCODOrder()
  → cod-order.ts:64-65 — toISOWithTimezone() [CORRECT]
  → after(() => sendCODOrderEmail())
  → helpers.ts:119-120 [BUG] `${date}T${time}:00` — no offset
  → DeliveryBlock.tsx:29-35 [BUG] toLocaleTimeString() — no TZ param
```

### Flow 3: Cron Delivery Reminders
```
GET /api/cron/delivery-reminders (daily ~8 AM PT)
  → route.ts:60 [BUG] new Date().toISOString().split("T")[0] — UTC date
  → Query: .gte("delivery_window_start", `${today}T00:00:00`) — no offset
  → sendEmail(order.delivery_window_start) — DB values have offset [CORRECT]
```

### Flow 4: Date Picker
```
getAvailableDeliveryDatesMultiDay(now, deliveryDays, 6, directions)
  → Generates 3 weeks of candidates per active day
  → [GAP] Includes cutoff-passed dates, marks cutoffPassed: true
  → Returns 6 dates (some may be cutoff-passed, wasting slots)
  → TimeStepV8 auto-selects first non-cutoff-passed date
```

## 13. Expanded Gotcha Inventory (Wave 2 Findings)

### Per Success Criterion

**SC-1 (Checkout scheduledDate)**:
- G1: `new Date(date + "T12:00:00")` creates UTC noon, not LA noon — wrong day-of-week at boundary
- G2: IMMUTABLE `delivery_date()` index already handles DB-side — no migration needed
- G3: Supabase stores `scheduledDate` as string metadata — validate before storing

**SC-2 (COD email offset)**:
- G4: `after()` required for email sends on Vercel — never `void sendEmail()`
- G5: Email `toLocaleTimeString()` uses server TZ (UTC on Vercel) — add explicit `timeZone`
- G6: Resend idempotency key `"order-confirmation-{orderId}"` prevents duplicate sends
- G7: COD email uses denormalized `customer_name`/`customer_phone` from order, not profile

**SC-3 (Cron LA date)**:
- G8: Cron at 12:00 UTC = 4-5 AM PT — UTC "today" may differ from LA "today"
- G9: Query bounds need offset: `.gte("delivery_window_start", `${today}T00:00:00-08:00`)`
- G10: DST changes offset (-08:00 winter, -07:00 summer) — use `toISOWithTimezone()` for bounds
- G11: Vercel cron schedules are UTC-fixed; document as known DST ±1hr drift

**SC-4 (Date picker pre-filter)**:
- G12: `getAvailableDeliveryDatesMultiDay()` returns 6 dates including cutoff-passed ones
- G13: Pre-filter BEFORE filling slots — all 6 returned dates should have `cutoffPassed: false`
- G14: Direction filtering via `filterDaysByDirection()` must happen before candidate generation

**SC-5 (30-day future limit)**:
- G15: Validate in checkout route AFTER `toISOWithTimezone()` conversion
- G16: Use LA date for comparison (not UTC) — `scheduledDate` string is already LA date
- G17: Return 400 with `VALIDATION_ERROR` code — client error, not retryable

## 14. Design Token Audit Results

### Timezone Configuration Consistency

| Location | Value | Source | Status |
|----------|-------|--------|--------|
| `src/types/delivery.ts` | `process.env.DELIVERY_TIMEZONE \|\| "America/Los_Angeles"` | Env var | ✓ Single source |
| `src/lib/hooks/useDeliveryGate.ts:48` | `"America/Los_Angeles"` hardcoded | String literal | ❌ Fix: import TIMEZONE |
| `src/lib/utils/delivery-timezone.ts:8` | `"America/Los_Angeles"` hardcoded | String literal | ❌ Fix: import TIMEZONE |
| `supabase/migrations/002_functions.sql` | `'America/Los_Angeles'` in SQL | Migration | ✓ Acceptable (SQL can't import TS) |
| `supabase/migrations/035_checkout_hardening.sql` | `'America/Los_Angeles'` in SQL | Migration | ✓ Acceptable |
| All other files | Import from `@/types/delivery` | Module import | ✓ Correct |

### Cron Schedule vs Intent
| Cron | Schedule (UTC) | PST (Winter) | PDT (Summer) | Intent |
|------|---------------|--------------|--------------|--------|
| delivery-reminders | 15:00 | 7:00 AM | 8:00 AM | "8 AM PT" |
| digest-morning | 14:00 | 6:00 AM | 7:00 AM | "6 AM PT" |
| digest-evening | 06:00 | 10:00 PM | 11:00 PM | "10 PM PT" |

**Gap**: All cron times drift ±1hr during DST. Documented as known limitation — Vercel cron doesn't support timezone-aware scheduling.

### Environment Configuration
- `.env.example`: Missing `DELIVERY_TIMEZONE` documentation
- `scripts/launch-check.ts`: Shows as optional with default
- `next.config.ts`: No timezone env var exposed
- Production: TIMEZONE inlined at build time for client components
