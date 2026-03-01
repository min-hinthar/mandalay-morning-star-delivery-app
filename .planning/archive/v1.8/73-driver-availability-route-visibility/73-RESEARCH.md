# Phase 73: Driver Availability & Route Visibility - Research

**Researched:** 2026-02-19
**Domain:** Supabase JSONB, Next.js App Router, existing driver UI patterns
**Confidence:** HIGH

## Summary

Phase 73 extends the driver experience with availability scheduling (JSONB on `drivers` table), upcoming route visibility, a schedule page, and enhanced history with filtering/pagination. All work builds on established codebase patterns -- no new external libraries required. The `DietaryChipPicker` pattern maps directly to day-of-week toggles, `HistorySummaryCard` to schedule route cards, and `EarningsPageClient` period toggle to history filtering.

The database migration adds an `availability_json` JSONB column to the existing `drivers` table. Admin integration is lightweight -- availability badges/indicators in `CreateRouteModal` driver picker and `DriverInfoCard` reassignment Select.

**Primary recommendation:** Three plans -- (1) DB migration + availability API + availability UI component, (2) schedule page + upcoming route chip on dashboard, (3) history page enhancements (filtering, pagination, monthly grouping) + admin availability indicators.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Recurring day-of-week: **toggleable pill chips** (Mon-Sun) -- reuse `DietaryChipPicker` pattern from `src/components/ui/account/SettingsTab/DietaryChipPicker.tsx`
- Selected state: `bg-amber-600 text-text-inverse border-amber-600` + spring scale pop animation
- Unselected: `bg-surface-primary text-text-secondary border-border hover:border-primary`
- One-off blocked dates: **date input chips with add/remove** -- `+` button opens native `<input type="date">`, adds dismissible chip (pill style with X icon). No external calendar library. Uses `date-fns` for formatting.
- Optional global toggle via existing `ToggleSwitch` component for "I am available this week" binary override
- JSONB column on `drivers` table (decided in STATE.md -- no separate table):
  ```ts
  { available_days: ("monday"|"tuesday"|...|"sunday")[], blocked_dates: string[] }
  ```
- **Schedule page:** Chronological list grouped by day-of-week headers, each route as compact `HistorySummaryCard` variant
- Availability toggle row (Mon-Sun pills) displayed above the route list on schedule page
- **Driver home:** Keep scoped to today only. Add passive "Next route: Thursday" chip below RouteCard when future route exists -- tapping navigates to `/driver/schedule`
- No calendar grid or timeline -- vertical stacked cards
- Reuse `HistorySummaryCard` directly
- Date-range filter: **3-pill period toggle** (Daily 14d / Weekly 12w / Monthly 12mo) -- exact pattern from `EarningsPageClient.tsx` with `getPeriodStartDate()` client-side cutoff
- Pill toggle CSS: `rounded-lg border bg-surface-primary p-1`, active `bg-secondary text-text-inverse`
- Pagination: **"Load More" button** incrementing `limit` param by 20 per tap
- Lifetime stats row: Keep existing 3-card `StatMiniCard` grid
- Per-period aggregate stats: Compute client-side
- Monthly grouping: Collapsible month-header sections using `AnimatePresence`
- No earnings in history page
- **Admin CreateRouteModal driver picker:** Badge/dot on each driver card -- `Available` (green) / `Unavailable` (amber/muted)
- **DriverInfoCard reassignment Select:** `(Unavailable)` suffix in SelectItem label
- No separate admin availability page

### Claude's Discretion
- Exact pill chip sizing and spacing for day-of-week toggles
- Empty state illustration/copy for schedule page with no upcoming routes
- "Next route" chip styling on driver home
- Collapsible month-header visual treatment in history
- Whether to show unavailable drivers as disabled or hidden in CreateRouteModal picker

### Deferred Ideas (OUT OF SCOPE)
- Time-of-day availability windows (morning/afternoon shifts)
- Admin-side dedicated availability management page
- Automated route assignment based on availability
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DDASH-04 | Upcoming assigned routes visible on driver home | "Next route" chip on dashboard linking to /driver/schedule; query routes with `delivery_date > today` |
| DDASH-05 | Weekly schedule view showing planned routes for coming week | Schedule page with day-grouped `HistorySummaryCard` list + availability pills above |
| DDASH-06 | Availability scheduling -- driver marks available days (recurring) | JSONB `availability_json` column on drivers table, `DietaryChipPicker`-pattern toggles |
| DDASH-07 | One-off unavailability -- block specific dates | Date input chips with `+` button, stored in `blocked_dates` array in JSONB |
| DDASH-08 | History page date-range filtering | 3-pill period toggle (Daily/Weekly/Monthly) reusing `EarningsPageClient` pattern |
| DDASH-09 | History page pagination for large result sets | "Load More" button incrementing `limit` by 20, existing API already accepts `limit` param |
| DDASH-10 | Monthly summary view in history with aggregate stats | Collapsible month-header sections, client-side computed route/stop/avg stats |
| DUI-04 | Admin view of driver availability when creating/assigning routes | Availability badge in CreateRouteModal driver picker + suffix in DriverInfoCard Select |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| Supabase JS v2 | JSONB column read/write, RPC, queries | Already used for all driver data operations |
| date-fns | Date formatting for blocked dates and schedule headers | Already installed, used in `CreateRouteModal` |
| framer-motion | Spring animations, AnimatePresence for expand/collapse | Already used in all driver UI components |
| lucide-react | Icons (CalendarDays, Plus, X, ChevronDown, etc.) | Already the project's icon library |

### No New Dependencies
All features implementable with existing stack. No new `npm install` needed.

## Architecture Patterns

### Recommended File Structure
```
src/
  app/(driver)/driver/
    schedule/
      page.tsx                    # Server component: auth + fetch upcoming routes + availability
      SchedulePageClient.tsx      # Client component: availability pills + grouped route list
    history/
      page.tsx                    # Existing server page (keep)
      DriverHistoryContent.tsx    # Enhance with period toggle, pagination, monthly grouping
  app/api/driver/
    availability/
      route.ts                   # GET/PATCH driver availability JSONB
    routes/
      upcoming/
        route.ts                 # GET upcoming routes (delivery_date >= today, planned/in_progress)
      history/
        route.ts                 # Extend with offset param for pagination
  components/ui/driver/
    AvailabilityPicker/
      index.tsx                  # Barrel
      DayOfWeekPills.tsx         # Mon-Sun toggleable chips (DietaryChipPicker pattern)
      BlockedDateChips.tsx       # Date input + dismissible chips
      AvailabilityToggle.tsx     # "Available this week" ToggleSwitch wrapper
    DriverDashboard/
      NextRouteChip.tsx          # "Next route: Thursday" passive chip
  lib/
    availability.ts              # Shared types + helper (isDriverAvailable for admin)
  types/
    driver.ts                    # Add DriverAvailability type
supabase/migrations/
    026_driver_availability.sql  # Add availability_json JSONB column
```

### Pattern 1: DietaryChipPicker Adaptation for Day-of-Week
**What:** Reuse the exact toggle pattern from `DietaryChipPicker.tsx`
**When to use:** Day-of-week multi-select

**Source pattern (DietaryChipPicker.tsx):**
```tsx
<m.button
  type="button"
  onClick={() => toggle(option)}
  animate={shouldAnimate ? { scale: isSelected ? [1, 1.15, 1] : 1 } : undefined}
  transition={{ type: "spring", stiffness: 500, damping: 25 }}
  className={cn(
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-sm font-medium",
    "border transition-colors min-h-[44px]",
    isSelected
      ? "bg-amber-600 text-text-inverse border-amber-600"
      : "bg-surface-primary text-text-secondary border-border hover:border-primary"
  )}
/>
```

**Adaptation:** Replace `DIETARY_OPTIONS` with days array, use 3-letter abbreviations (Mon, Tue, ..., Sun).

### Pattern 2: EarningsPageClient Period Toggle for History Filtering
**What:** 3-pill toggle bar for Daily/Weekly/Monthly filtering
**When to use:** History page date range filtering

**Source pattern (EarningsPageClient.tsx):**
```tsx
<div className="flex gap-0.5 rounded-lg border border-border bg-surface-primary p-1">
  {PERIODS.map((period) => (
    <button
      key={period.value}
      onClick={() => setSelectedPeriod(period.value)}
      className={cn(
        "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        selectedPeriod === period.value
          ? "bg-secondary text-text-inverse"
          : "text-text-secondary hover:text-text-primary"
      )}
    />
  ))}
</div>
```

### Pattern 3: HistorySummaryCard for Schedule Route List
**What:** Reuse existing collapsed-row + expand-to-stops card for upcoming routes
**When to use:** Schedule page route listing

**Key props:** `route: HistoryRouteData` (id, date, stopCount, deliveredCount, onTimePercentage, totalDurationMinutes, stops)

For upcoming routes, `deliveredCount` will be 0 and `stops` will contain pending stops. The card handles this gracefully already.

### Pattern 4: JSONB Column Pattern
**What:** Store structured availability data in a single JSONB column on `drivers`
**When to use:** Driver availability storage

```sql
ALTER TABLE drivers
ADD COLUMN availability_json JSONB DEFAULT '{"available_days": [], "blocked_dates": []}'::jsonb;
```

**TypeScript type:**
```typescript
export interface DriverAvailability {
  available_days: DayOfWeek[];
  blocked_dates: string[]; // ISO date strings "YYYY-MM-DD"
}

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
```

### Anti-Patterns to Avoid
- **Separate availability table:** Decision locked -- use JSONB on drivers table, not a separate table
- **Calendar grid component:** Decision locked -- vertical stacked cards only
- **External date picker library:** Decision locked -- native `<input type="date">` only
- **Server-side pagination with offset/cursor:** Use simpler `limit` increment for "Load More" pattern

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Day-of-week toggles | Custom toggle from scratch | Adapt `DietaryChipPicker` pattern | Established animation, accessibility, token usage |
| Period filter toggle | Custom segmented control | Copy `EarningsPageClient` period toggle | Exact same UX pattern, proven CSS |
| Route list cards | New card component | Reuse `HistorySummaryCard` | Consistent with history page, has expand/collapse |
| Toggle switch | Custom checkbox | Use existing `ToggleSwitch` component | Already extracted and shared |
| Date formatting | Manual date string manipulation | `date-fns` format/parse | Already installed, handles edge cases |

## Common Pitfalls

### Pitfall 1: Timezone-Sensitive Date Comparisons
**What goes wrong:** Comparing `delivery_date` (DATE type, no timezone) with JavaScript `new Date()` that uses local timezone
**Why it happens:** `new Date().toISOString().split('T')[0]` uses UTC, but the app operates in `America/Los_Angeles`
**How to avoid:** Use the existing `getDateInfo()` pattern from `src/app/(driver)/driver/page.tsx` which uses `Intl.DateTimeFormat` with explicit `timeZone: "America/Los_Angeles"`
**Warning signs:** Routes appearing/disappearing around midnight, "today" showing wrong day

### Pitfall 2: Supabase JSONB Query Syntax
**What goes wrong:** Using wrong operator for JSONB contains queries
**Why it happens:** Supabase JS v2 has specific operators for JSONB
**How to avoid:** For checking availability: use `.select('availability_json')` then check client-side. For admin queries needing availability, include `availability_json` in the SELECT and process in the API transform.
**Warning signs:** Empty results or 400 errors from Supabase

### Pitfall 3: RLS on Updated Drivers Table
**What goes wrong:** Driver can't read/write their own availability
**Why it happens:** Existing RLS policies may not cover the new `availability_json` column
**How to avoid:** Existing RLS policies on `drivers` table already allow `UPDATE` for own driver row (via `user_id = auth.uid()`). JSONB column inherits table-level RLS -- no new policy needed. Verify with existing driver PATCH pattern from profile API.
**Warning signs:** 403/row-level security errors when saving availability

### Pitfall 4: History API Not Returning Total Count
**What goes wrong:** "Load More" button shows when there are no more results
**Why it happens:** Current history API returns only routes, not total count
**How to avoid:** Either: (a) return `total` count from API alongside routes, or (b) check if returned count < requested limit (means no more pages)
**Warning signs:** Empty "Load More" clicks, button never disappearing

### Pitfall 5: Admin Availability Check Requires Driver Data
**What goes wrong:** CreateRouteModal doesn't have availability data for the selected delivery date
**Why it happens:** The existing `fetchDrivers()` in CreateRouteModal calls `/api/admin/drivers?active=true` which doesn't include `availability_json`
**How to avoid:** Extend the admin drivers API response to include `availability_json`, then compute availability status client-side for the selected date
**Warning signs:** Availability badges always showing "Available" or missing entirely

## Code Examples

### Migration: Add availability_json column
```sql
-- 026_driver_availability.sql
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS availability_json JSONB
DEFAULT '{"available_days": [], "blocked_dates": []}'::jsonb;

COMMENT ON COLUMN drivers.availability_json IS
'Driver weekly availability: available_days (recurring day-of-week) and blocked_dates (one-off YYYY-MM-DD)';
```

### API: GET/PATCH availability
```typescript
// GET handler pattern
const { data: driver } = await supabase
  .from("drivers")
  .select("availability_json")
  .eq("id", driverId)
  .single();

// PATCH handler pattern
const { error } = await supabase
  .from("drivers")
  .update({ availability_json: body })
  .eq("id", driverId);
```

### Availability check helper (for admin)
```typescript
export function isDriverAvailable(
  availability: DriverAvailability | null,
  date: string // YYYY-MM-DD
): boolean {
  if (!availability) return true; // No data = assume available

  // Check blocked dates first
  if (availability.blocked_dates.includes(date)) return false;

  // Check day-of-week
  const dayIndex = new Date(date + "T12:00:00Z").getUTCDay();
  const dayNames: DayOfWeek[] = [
    "sunday", "monday", "tuesday", "wednesday",
    "thursday", "friday", "saturday"
  ];
  const dayOfWeek = dayNames[dayIndex];

  // If no available_days set, assume available all days
  if (availability.available_days.length === 0) return true;

  return availability.available_days.includes(dayOfWeek);
}
```

### Upcoming routes query
```typescript
const { data: upcomingRoutes } = await supabase
  .from("routes")
  .select("id, delivery_date, status, stats_json, started_at")
  .eq("driver_id", driverId)
  .gt("delivery_date", todayStr)
  .in("status", ["planned", "in_progress"])
  .order("delivery_date", { ascending: true })
  .limit(7);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate availability table | JSONB on drivers | Decided pre-Phase 73 (STATE.md) | Simpler queries, no joins needed |
| Calendar date picker library | Native `<input type="date">` | CONTEXT.md decision | No bundle size increase, mobile-native UX |
| Server-side pagination with cursor | Client-side "Load More" with limit | CONTEXT.md decision | Simpler implementation, sufficient for ~100 routes |

## Open Questions

1. **Default availability for new drivers**
   - What we know: JSONB defaults to `{"available_days": [], "blocked_dates": []}`
   - What's unclear: Should empty `available_days` mean "available all days" or "available no days"?
   - Recommendation: Empty = available all days (opt-out model). This matches the admin's existing ability to assign any driver to any route. The pills start deselected, and the driver opts in to restrict their days.

2. **Saturday-only delivery pattern**
   - What we know: `CreateRouteModal` validates delivery date must be Saturday. STATE.md mentions "confirm day-of-week pattern vs Saturday-only"
   - What's unclear: If deliveries are always Saturday, do drivers need to mark availability for all 7 days?
   - Recommendation: Show all 7 days for future flexibility, but the admin availability check only matters for the route's delivery date (Saturday). The UI labels this clearly.

## Existing Codebase References

| Component/File | Location | Reuse For |
|----------------|----------|-----------|
| `DietaryChipPicker` | `src/components/ui/account/SettingsTab/DietaryChipPicker.tsx` | Day-of-week toggle pattern |
| `HistorySummaryCard` | `src/components/ui/driver/DriverDashboard/HistorySummaryCard.tsx` | Schedule route cards |
| `EarningsPageClient` | `src/app/(driver)/driver/earnings/EarningsPageClient.tsx` | Period toggle + filtering pattern |
| `DriverHistoryContent` | `src/app/(driver)/driver/history/DriverHistoryContent.tsx` | StatMiniCard grid, history page base |
| `ToggleSwitch` | `src/components/ui/admin/settings/ToggleSwitch.tsx` | "Available this week" toggle |
| `DriverDashboard` | `src/components/ui/driver/DriverDashboard/DriverDashboard.tsx` | Dashboard to add "Next route" chip |
| `CreateRouteModal` | `src/components/ui/admin/routes/CreateRouteModal/CreateRouteModal.tsx` | Add availability badge to driver picker |
| `DriverInfoCard` | `src/components/ui/admin/routes/RouteDetailClient/DriverInfoCard.tsx` | Add availability suffix to Select |
| History API | `src/app/api/driver/routes/history/route.ts` | Extend with offset/total count |
| Admin drivers API | `src/app/api/admin/drivers/route.ts` | Add availability_json to response |
| `DriverNav` | `src/components/ui/driver/DriverNav.tsx` | Schedule tab already exists |
| `DAYS_OF_WEEK` | `src/components/ui/admin/settings/OperationsSettingsForm.tsx` (line 43) | Extract to shared constant |
| Driver page | `src/app/(driver)/driver/page.tsx` | getDateInfo() timezone pattern, data fetching |
| `requireDriver` | `src/lib/auth/driver.ts` | Auth for availability API |
| Driver types | `src/types/driver.ts` | Add DriverAvailability type |

## Sources

### Primary (HIGH confidence)
- Codebase exploration: all referenced files read directly
- Supabase JSONB: standard PostgreSQL JSONB support, well-documented
- Existing driver API patterns: `requireDriver`, rate limiting, response transforms

### Secondary (MEDIUM confidence)
- date-fns usage confirmed in `CreateRouteModal.tsx` (format, nextSaturday, isSaturday)
- framer-motion patterns confirmed across all driver components

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing
- Architecture: HIGH -- follows exact established patterns from Phases 71-72
- Pitfalls: HIGH -- identified from existing codebase constraints (timezone, RLS, JSONB)

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable domain, no external API dependencies)
