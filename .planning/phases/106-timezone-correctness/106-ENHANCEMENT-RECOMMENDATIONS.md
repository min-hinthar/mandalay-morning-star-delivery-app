# Phase 106: Timezone Correctness — Enhancement Recommendations

## Priority Matrix

| # | Enhancement | Priority | Effort | Impact |
|---|-------------|----------|--------|--------|
| 1 | Fix checkout scheduledDate construction | MUST-HAVE | Low | Critical — wrong cutoff validation |
| 2 | Fix COD email delivery window offset | MUST-HAVE | Low | Critical — ambiguous times in email |
| 3 | Fix cron reminder LA date computation | MUST-HAVE | Low | Critical — missed/wrong reminders |
| 4 | Pre-filter cutoff-passed dates in picker | MUST-HAVE | Low | High — wasted date slots |
| 5 | Add 30-day future date validation | MUST-HAVE | Low | Medium — unbounded input |
| 6 | Fix email formatters timezone param | SHOULD-HAVE | Low | High — all emails affected |
| 7 | Replace hardcoded timezone strings | SHOULD-HAVE | Low | Medium — env configurability |
| 8 | Add DST transition tests | SHOULD-HAVE | Medium | High — regression prevention |
| 9 | Refactor test `makePtDate()` for DST | SHOULD-HAVE | Low | Medium — test correctness |
| 10 | Fix driver availability day-of-week | NICE-TO-HAVE | Low | Low — all drivers in LA |
| 11 | Fix OrderSummary date-fns timezone | NICE-TO-HAVE | Low | Medium — tracking display |
| 12 | Document cron DST drift limitation | NICE-TO-HAVE | Low | Low — operational awareness |

---

## Detailed Recommendations

### 1. Fix Checkout `scheduledDate` Construction (MUST-HAVE)

**What**: Replace `new Date(input.scheduledDate + "T12:00:00")` at `route.ts:53` with timezone-aware construction using `toISOWithTimezone()` or explicit UTC.

**Why**: Current code creates a Date interpreted as UTC noon. When passed to `getZonedDayOfWeek()`, the LA day-of-week calculation may be off by 1 day near midnight boundaries. This means cutoff validation (`isPastCutoffForDay`) could allow orders past cutoff or reject valid orders.

**Design compliance**: Data correctness only — no UI change needed (SC-1).

**Implementation hint**:
```typescript
// Before (bug):
const scheduledDate = new Date(input.scheduledDate + "T12:00:00");

// After (fix):
const scheduledDateISO = toISOWithTimezone(input.scheduledDate, "12:00");
const scheduledDate = new Date(scheduledDateISO);
```
This ensures the Date object represents noon LA time, not noon UTC.

---

### 2. Fix COD Email Delivery Window Offset (MUST-HAVE)

**What**: Replace bare ISO string concatenation in `helpers.ts:119-120` with `toISOWithTimezone()` calls so email templates receive timezone-aware strings.

**Why**: COD email path constructs delivery window as `"2026-03-20T18:00:00"` (no offset). Email templates then format with `toLocaleTimeString()` using server timezone (UTC on Vercel), showing wrong times. Stripe checkout path already uses `toISOWithTimezone()` correctly.

**Design compliance**: SC-2 requires "delivery window with timezone offset (e.g., '10:00 AM - 6:00 PM PST')". Email must show explicit timezone indicator.

**Implementation hint**:
```typescript
// Before (bug):
deliveryWindowStart: `${opts.scheduledDate}T${opts.timeWindowStart}:00`,

// After (fix):
deliveryWindowStart: toISOWithTimezone(opts.scheduledDate, opts.timeWindowStart),
```

---

### 3. Fix Cron Reminder LA Date Computation (MUST-HAVE)

**What**: Replace `new Date().toISOString().split("T")[0]` at `delivery-reminders/route.ts:60` with LA-timezone-aware date string.

**Why**: `toISOString()` returns UTC date. When cron fires at 15:00 UTC (7-8 AM PT), UTC "today" is correct. But at midnight-8AM UTC boundary (4-midnight PT), UTC date is tomorrow while LA date is still today. Cron would query wrong day's orders.

**Design compliance**: SC-3 requires "reminders for LA-date orders, not UTC-date orders."

**Implementation hint**: Reuse the `getTodayInTimezone()` pattern from `driver/routes/active/route.ts`:
```typescript
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric", month: "2-digit", day: "2-digit",
});
const today = formatter.format(new Date()); // "YYYY-MM-DD" in LA
```
Also fix query bounds to include timezone offset:
```typescript
const offset = getTimezoneOffsetString(new Date()); // "-08:00" or "-07:00"
.gte("delivery_window_start", `${today}T00:00:00${offset}`)
.lt("delivery_window_start", `${today}T23:59:59${offset}`)
```

---

### 4. Pre-Filter Cutoff-Passed Dates in Picker (MUST-HAVE)

**What**: In `getAvailableDeliveryDatesMultiDay()`, filter out cutoff-passed candidates before filling the `count` slots, so all returned dates are orderable.

**Why**: Currently, if Monday's cutoff passed, the function returns Monday (marked `cutoffPassed: true`) consuming 1 of 6 slots. Customer sees 5 available + 1 grayed-out instead of 6 available dates.

**Design compliance**: SC-4 requires "only future dates with cutoff not yet passed."

**Implementation hint**: Add pre-filter at candidate generation (L287):
```typescript
// Skip today if cutoff passed
if (isPastCutoffForDay(candidateDate, dayConfig, now)) continue;
```

---

### 5. Add 30-Day Future Date Validation (MUST-HAVE)

**What**: Add server-side validation in checkout route to reject `scheduledDate` more than 30 days in the future.

**Why**: No upper bound currently exists. Customer (or API caller) can schedule delivery for any future date, creating unmanageable orders.

**Design compliance**: SC-5 requires "Checkout API returns 400 for scheduledDate more than 30 days in the future."

**Implementation hint**:
```typescript
const MAX_DELIVERY_DAYS_FUTURE = 30;
const daysAhead = Math.ceil(
  (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
);
if (daysAhead > MAX_DELIVERY_DAYS_FUTURE) {
  return errorResponse("VALIDATION_ERROR",
    "Cannot schedule delivery more than 30 days in advance", 400);
}
```

---

### 6. Fix Email Formatters Timezone Param (SHOULD-HAVE)

**What**: Add `timeZone: "America/Los_Angeles"` to all `toLocaleDateString()` / `toLocaleTimeString()` calls in email templates.

**Why**: Email rendering happens on Vercel (UTC). Without explicit timezone, dates/times render in UTC — 7-8 hours ahead of LA time. Customer in LA ordering for "Saturday 2 PM" would see "Saturday 10 PM" in email.

**Design compliance**: Extends SC-2 fix to all email templates (not just COD).

**Implementation hint**: In `DeliveryBlock.tsx`:
```typescript
function formatDeliveryTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "America/Los_Angeles",
  });
}
```
Add timezone suffix extraction:
```typescript
const tzName = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles", timeZoneName: "short"
}).formatToParts(date).find(p => p.type === "timeZoneName")?.value;
// Returns "PST" or "PDT"
```

---

### 7. Replace Hardcoded Timezone Strings (SHOULD-HAVE)

**What**: Replace hardcoded `"America/Los_Angeles"` in `useDeliveryGate.ts:48` and `delivery-timezone.ts:8` with `TIMEZONE` constant import.

**Why**: These 2 files bypass the env-configurable `DELIVERY_TIMEZONE` variable, breaking multi-region configurability.

**Implementation hint**:
```typescript
import { TIMEZONE } from "@/types/delivery";
// Replace: "America/Los_Angeles" → TIMEZONE
```

---

### 8. Add DST Transition Tests (SHOULD-HAVE)

**What**: Add explicit test cases for March 8 (spring forward) and November 1 (fall back) DST transitions.

**Why**: DST transitions create a 1-hour vulnerability window where cutoff calculations could be wrong. Phase 95 added basic DST tests, but Phase 106 changes require new coverage.

**Implementation hint**:
```typescript
describe("DST transitions", () => {
  it("spring forward: cutoff correct on March 8, 2026", () => {
    // March 8 = DST switch day. PST → PDT at 2 AM
    const preDST = new Date("2026-03-07T23:00:00-08:00"); // 11 PM PST
    const postDST = new Date("2026-03-08T03:00:00-07:00"); // 3 AM PDT
    // Verify cutoff calculations handle both correctly
  });

  it("fall back: no duplicate reminders on November 1, 2026", () => {
    const fallback = new Date("2026-11-01T01:30:00-07:00"); // 1:30 AM PDT (first occurrence)
    // Verify cron doesn't double-process
  });
});
```

---

### 9. Refactor Test `makePtDate()` for DST (SHOULD-HAVE)

**What**: Replace hardcoded `-08:00` offset in test helper with dynamic offset computation.

**Why**: Tests using `makePtDate("2026-07-15T10:00:00")` create dates with winter offset (-08:00) for summer dates (should be -07:00). Tests may pass but mask real DST bugs.

**Implementation hint**:
```typescript
function makePtDate(value: string): Date {
  // Parse date, detect correct offset via Intl, construct with right offset
  const naive = new Date(value + "Z"); // Parse as UTC
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE, timeZoneName: "shortOffset"
  });
  const offset = extractOffset(formatter.formatToParts(naive));
  return new Date(`${value}${offset}`);
}
```

---

### 10. Fix Driver Availability Day-of-Week (NICE-TO-HAVE)

**What**: Replace `new Date(date + "T12:00:00Z").getUTCDay()` at `availability.ts:67` with `getZonedDayOfWeek()`.

**Why**: Uses UTC day-of-week for LA scheduling decisions. Low impact since all drivers are in LA, but technically incorrect.

**Implementation hint**:
```typescript
const dayOfWeek = getZonedDayOfWeek(new Date(date + "T12:00:00Z"));
```

---

### 11. Fix OrderSummary date-fns Timezone (NICE-TO-HAVE)

**What**: Replace `date-fns` `format(parseISO(...))` in `OrderSummary.tsx` with `Intl.DateTimeFormat` using explicit timezone.

**Why**: `date-fns` `format()` uses browser local timezone. Customer in non-LA timezone would see wrong delivery window on tracking page.

**Implementation hint**: Use same pattern as `TimeSlotDisplay.tsx` — `Intl.DateTimeFormat` with `timeZone: TIMEZONE`.

---

### 12. Document Cron DST Drift Limitation (NICE-TO-HAVE)

**What**: Add comment in `vercel.json` and cron routes documenting that UTC-fixed cron schedules drift ±1hr during DST transitions.

**Why**: Vercel cron doesn't support timezone-aware scheduling. Delivery reminders fire at 7 AM or 8 AM PT depending on season. Acceptable for this business (20-50 orders), but should be documented.

**Implementation hint**:
```json
{
  "path": "/api/cron/delivery-reminders",
  "schedule": "0 15 * * *"  // 15:00 UTC = 7 AM PST / 8 AM PDT (±1hr DST drift)
}
```

---

## Implementation Phases

### Plan 1: Core Data Fixes (SC-1, SC-2, SC-3)
- Fix checkout `scheduledDate` construction (rec 1)
- Fix COD email props with `toISOWithTimezone()` (rec 2)
- Fix cron reminder LA date (rec 3)
- Fix email formatters timezone param (rec 6)
- Replace hardcoded timezone strings (rec 7)

### Plan 2: Validation + Picker + Tests (SC-4, SC-5)
- Pre-filter cutoff-passed dates (rec 4)
- Add 30-day future validation (rec 5)
- Refactor `makePtDate()` (rec 9)
- Add DST transition tests (rec 8)
- Fix driver availability (rec 10, if time)
- Document cron DST drift (rec 12)
