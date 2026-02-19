# Phase 73: Driver Availability & Route Visibility - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Drivers can set their recurring weekly availability and block specific dates. Upcoming assigned routes visible beyond today. Weekly schedule view shows planned routes. History page gains date-range filtering, pagination, and monthly summaries. Admin sees driver availability during route assignment.

</domain>

<decisions>
## Implementation Decisions

### Availability Input UX
- Recurring day-of-week: **toggleable pill chips** (Mon-Sun) — reuse `DietaryChipPicker` pattern from `src/components/ui/account/SettingsTab/DietaryChipPicker.tsx`
- Selected state: `bg-amber-600 text-text-inverse border-amber-600` + spring scale pop animation
- Unselected: `bg-surface-primary border-border hover:border-primary`
- One-off blocked dates: **date input chips with add/remove** — `+` button opens native `<input type="date">`, adds dismissible chip (pill style with X icon). No external calendar library. Uses `date-fns` for formatting.
- Optional global toggle via existing `ToggleSwitch` component for "I am available this week" binary override
- JSONB column on `drivers` table (decided in STATE.md — no separate table):
  ```ts
  { available_days: ("monday"|"tuesday"|...|"sunday")[], blocked_dates: string[] }
  ```

### Schedule & Route View Layout
- **Schedule page:** Chronological list grouped by day-of-week headers (e.g., "Tuesday, Feb 24"), each route as compact `HistorySummaryCard` variant — same shell (`rounded-xl bg-surface-primary border border-border shadow-sm`), showing date, stop count, estimated duration
- Availability toggle row (Mon-Sun pills) displayed above the route list on schedule page
- **Driver home:** Keep scoped to today only (existing `RouteCard` pattern). Add a passive "Next route: Thursday" chip below RouteCard when a future route exists — tapping navigates to `/driver/schedule`
- No calendar grid or timeline — vertical stacked cards match established driver patterns (`DriverHistoryContent.tsx`, `HistorySummaryCard`)
- Reuse `HistorySummaryCard` directly (collapsed-row + expand-to-stops, stagger animations, correct tokens)

### History, Filtering & Stats
- Date-range filter: **3-pill period toggle** (Daily 14d / Weekly 12w / Monthly 12mo) — exact pattern from `EarningsPageClient.tsx` with `getPeriodStartDate()` client-side cutoff
- Pill toggle CSS: `rounded-lg border bg-surface-primary p-1`, active `bg-secondary text-text-inverse`
- Pagination: **"Load More" button** incrementing `limit` param by 20 per tap — existing `history/route.ts` API already accepts `limit` (default 20, max 100)
- Lifetime stats row: Keep existing 3-card `StatMiniCard` grid (Total Deliveries, Rating, On Time %) from `DriverHistoryContent.tsx`
- Per-period aggregate stats: Compute client-side — route count, stop count, avg stops/route (mirrors `EarningsPageClient` `useMemo` reduces)
- Monthly grouping: Collapsible month-header sections using `AnimatePresence` expand/collapse from `HistorySummaryCard.tsx`
- No earnings in history page — earnings belong on the dedicated earnings page (Phase 72 separation)

### Admin Availability Integration
- **CreateRouteModal driver picker:** Badge/dot on each driver card — `Available` (green) / `Unavailable` (amber/muted) for the selected delivery date
- **DriverInfoCard reassignment Select:** `(Unavailable)` suffix in SelectItem label when driver marked unavailable
- `/admin/drivers` list page: No change — not a route-assignment surface
- No separate admin availability page or calendar overlay — inline indicators at decision points only

### Claude's Discretion
- Exact pill chip sizing and spacing for day-of-week toggles
- Empty state illustration/copy for schedule page with no upcoming routes
- "Next route" chip styling on driver home
- Collapsible month-header visual treatment in history
- Whether to show unavailable drivers as disabled or hidden in CreateRouteModal picker

</decisions>

<specifics>
## Specific Ideas

- `DietaryChipPicker` is the exact component pattern for day-of-week toggles (small fixed set, multi-select, spring animation)
- `HistorySummaryCard` is the route list card to reuse for schedule view (collapsed row + expand to stops)
- `EarningsPageClient` period toggle is the filter pattern to copy for history page
- `DAYS_OF_WEEK` constant already exists in `OperationsSettingsForm` — reuse or extract to shared constant
- Availability JSONB lives on `drivers` table per STATE.md architectural decision
- History API (`/api/driver/routes/history`) already has `limit` param — extend, don't replace

</specifics>

<deferred>
## Deferred Ideas

- Time-of-day availability windows (morning/afternoon shifts) — future enhancement if needed
- Admin-side dedicated availability management page — overkill for current fleet size
- Automated route assignment based on availability — future phase

</deferred>

---

*Phase: 73-driver-availability-route-visibility*
*Context gathered: 2026-02-19*
