# Phase 106: Timezone Correctness - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Batch-fix all timezone bugs across checkout, email, cron, and date filtering. All date/time operations use LA timezone consistently — customers see correct delivery windows, reminders fire on the right day, checkout rejects stale or far-future dates. No UI label changes (except email offset display per SC-2), no new endpoints, no schema changes.

</domain>

<decisions>
## Implementation Decisions

### Checkout date construction (TZ-01)
- Replace `new Date(scheduledDate + "T12:00:00")` in `checkout/session/route.ts:53` with `toISOWithTimezone()` call
- `toISOWithTimezone` already exists in `delivery-timezone.ts` — produces correct LA-offset ISO strings
- Downstream validators (`getZonedDayOfWeek`, `isPastCutoffForDay`) receive correctly-zoned Date
- No migration needed — `delivery_date()` IMMUTABLE SQL function already handles DB-side

### COD email timezone display (TZ-02)
- Add `timeZone: TIMEZONE` param to all `toLocaleTimeString()` / `toLocaleDateString()` calls in email templates
- Files: `DeliveryBlock.tsx`, `emails/helpers.ts`, `OrderConfirmation.tsx`
- Display timezone offset in delivery window (e.g., "10:00 AM - 6:00 PM PST")
- Fix `helpers.ts:119-120` — use `toISOWithTimezone()` for email date props instead of `${date}T${time}:00`
- `after()` already used for email sends — no change to send pattern

### Cron LA date computation (TZ-03)
- Replace `new Date().toISOString().split("T")[0]` in cron with LA-timezone-aware date
- Reuse `getTodayInTimezone()` pattern from `driver/routes/active/route.ts:9-17`
- Query bounds need LA offset: `.gte("delivery_window_start", `${today}T00:00:00${offset}`)`
- Use `toISOWithTimezone()` for offset-aware bounds (handles DST automatically)
- Known limitation: Vercel cron schedules are UTC-fixed — ±1hr DST drift documented, not fixable

### Date picker pre-filtering (TZ-04)
- Pre-filter cutoff-passed dates in `getAvailableDeliveryDatesMultiDay()` BEFORE filling candidate slots
- All 6 returned dates should have `cutoffPassed: false` — no wasted slots
- Keep disabled pill UX in `DatePill` for any edge cases (defense in depth)
- Direction filtering via `filterDaysByDirection()` happens before candidate generation (existing behavior)

### 30-day future validation (TZ-05)
- Add `MAX_DELIVERY_DAYS_FUTURE = 30` hardcoded constant
- Validate in checkout route AFTER `toISOWithTimezone()` conversion
- Use LA date for comparison (not UTC) — `scheduledDate` string is already LA date
- Return 400 with descriptive error: "Delivery date cannot be more than 30 days in the future"

### Hardcoded timezone strings
- Replace `"America/Los_Angeles"` literals in 2 files with `TIMEZONE` import from `@/types/delivery`
- Files: `useDeliveryGate.ts:48`, `delivery-timezone.ts:8`
- SQL migrations keep literal strings (can't import TS constants)

### Test DST handling
- Refactor `makePtDate()` in test files to use dynamic offset via `Intl.DateTimeFormat`
- Add DST transition test cases (March + November boundaries)
- Affected files: `delivery-dates.test.ts`, `delivery-dates-multiday.test.ts`

### Claude's Discretion
- Exact `getTodayInTimezone()` implementation (inline or extract to shared util)
- Offset string format in emails ("PST" vs "Pacific Time" vs "-08:00")
- Test case boundary dates (exact DST transition dates)
- Whether to add JSDoc to modified functions
- Grouping of changes into plans (1 plan vs 2-3 by concern area)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Timezone utilities
- `src/types/delivery.ts` — `TIMEZONE` constant definition (line 21)
- `src/lib/utils/delivery-timezone.ts` — `toISOWithTimezone()`, timezone conversion utilities
- `src/lib/utils/delivery-dates.ts` — `getZonedDayOfWeek()`, `getZonedParts()`, `isPastCutoffForDay()`, `getAvailableDeliveryDatesMultiDay()`

### Bug locations
- `src/app/api/checkout/session/route.ts` — L53: fragile `new Date(date + "T12:00:00")` (TZ-01)
- `src/app/api/checkout/session/helpers.ts` — L119-120, L158-159: email props without offset (TZ-02)
- `src/app/api/cron/delivery-reminders/route.ts` — L60: UTC date instead of LA date (TZ-03)
- `src/lib/utils/delivery-dates.ts` — `getAvailableDeliveryDatesMultiDay()`: no cutoff pre-filter (TZ-04)
- `src/emails/components/DeliveryBlock.tsx` — L19-35: no `timeZone` param on formatters (TZ-02)
- `src/emails/helpers.ts` — `formatDate()` no timezone param (TZ-02)
- `src/emails/OrderConfirmation.tsx` — local `formatDate()` no timezone param (TZ-02)

### Pattern references
- `src/app/api/driver/routes/active/route.ts` — L9-17: `getTodayInTimezone()` pattern to reuse for cron fix
- `src/lib/services/cod-order.ts` — L64-65: correct `toISOWithTimezone()` usage (verify COD path)

### Hardcoded timezone literals
- `src/lib/hooks/useDeliveryGate.ts` — L48: hardcoded `"America/Los_Angeles"`
- `src/lib/utils/delivery-timezone.ts` — L8: hardcoded `"America/Los_Angeles"`

### Tests
- `src/lib/utils/__tests__/delivery-dates.test.ts` — `makePtDate()` DST hardcoding
- `src/lib/utils/__tests__/delivery-dates-multiday.test.ts` — same `makePtDate()` issue

### Research
- `.planning/phases/106-timezone-correctness/106-PRECONTEXT-RESEARCH.md` — Full analysis: gotcha inventory, data contracts, flow diagrams, file map
- `.planning/phases/106-timezone-correctness/106-ENHANCEMENT-RECOMMENDATIONS.md` — Ranked enhancements

### Requirements
- `.planning/REQUIREMENTS.md` — TZ-01 through TZ-05 definitions

### Prior phase contracts
- `.planning/phases/104-type-safety-api-corrections/104-CONTEXT.md` — Type patterns, `.update().select("id")`
- `.planning/phases/105-route-lifecycle-guards/105-CONTEXT.md` — Lifecycle guards, `after()` pattern

### Learnings
- `.claude/learnings/supabase-auth.md` — Service client `auth.getUser()` returns null
- `CLAUDE.md` — `getUTCDay()` wrong in LA timezone, `void asyncFn()` killed on Vercel

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `toISOWithTimezone(date, time)` in `delivery-timezone.ts` — Generates correct LA-offset ISO strings, handles DST
- `getZonedDayOfWeek(dateString)` in `delivery-dates.ts` — LA-aware day-of-week (replaces `getUTCDay()`)
- `getZonedParts(dateString)` in `delivery-dates.ts` — Extracts year/month/day in LA timezone
- `isPastCutoffForDay(dateString, dayConfig, now)` in `delivery-dates.ts` — Cutoff check with LA timezone
- `TIMEZONE` constant in `types/delivery.ts` — Single source of truth for timezone
- `getTodayInTimezone()` pattern in `driver/routes/active/route.ts:9-17` — LA-date computation for DB queries

### Established Patterns
- `Intl.DateTimeFormat` with `timeZone: TIMEZONE` for all LA-aware formatting (not `date-fns`)
- `after()` for fire-and-forget email sends on Vercel (never `void sendEmail()`)
- TIMESTAMPTZ storage + LA-timezone display formatters (DB stores UTC, app formats LA)
- `delivery_date()` IMMUTABLE SQL function for timezone-aware index expressions

### Integration Points
- Checkout route: `toISOWithTimezone()` replaces manual Date construction at line 53
- Email helpers: `timeZone: TIMEZONE` param added to `toLocaleTimeString()` / `toLocaleDateString()`
- Cron route: `getTodayInTimezone()` replaces `new Date().toISOString().split("T")[0]`
- Date picker utility: Pre-filter loop added before slot-filling loop in `getAvailableDeliveryDatesMultiDay()`
- All changes are in existing files — no new files needed

</code_context>

<specifics>
## Specific Ideas

No specific requirements — all decisions driven by success criteria TZ-01 through TZ-05 and precontext research analysis. Implementation is surgical: existing timezone utilities handle the heavy lifting, fixes are swapping incorrect calls for correct utility usage.

</specifics>

<deferred>
## Deferred Ideas

- OrderSummary date formatting (uses date-fns without timezone) — real bug but not in Phase 106 success criteria
- Admin daily digest cron timezone fix — admin-facing only, defer to future phase
- Driver StopCard/StopDetail date formatting — driver-facing, not in success criteria
- "PST"/"PDT" labels in checkout UI — SC requires data correctness, not UI labels
- Driver availability timezone bug (`availability.ts:67`) — opportunistic only, separate fix
- Vercel cron DST-aware scheduling — platform limitation, document only

</deferred>

---

*Phase: 106-timezone-correctness*
*Context gathered: 2026-03-20*
