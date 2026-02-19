# Phase 72: Driver Earnings Dashboard - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Drivers can view their earnings history with weekly/monthly breakdowns and achievement badges. Includes earnings summary on dashboard, dedicated earnings page with charts, bottom nav restructure to add Earnings and Schedule tabs, and streak/milestone badge display.

</domain>

<decisions>
## Implementation Decisions

### Earnings Computation Model
- No earnings table/columns exist — compute at query time from `deliveries_count * rate`
- Add `driver_pay_per_stop_cents` key to `app_settings` (e.g., 500 = $5/stop) — admin-configurable
- `delivery_fee_cents` on orders is business revenue, NOT driver pay — do not conflate
- `weeklyEarningsCents` prop in `DriverDashboardProps` is dead code — wire it to real computed data
- `driver_stats_mv` materialized view is the right place for aggregate earnings
- No tips column exists; do not assume tips go to drivers

### Dashboard & Chart Design
- Summary cards: reuse `StatCard` pattern (rounded-2xl, gradient, animated count-up via `AnimatedValue`)
- 2-col grid (`grid-cols-2 gap-4`): Today's Earnings + This Week above fold
- Chart: `AreaChart` via existing `PerformanceChart` component with `type="area"` — zero new chart infra
- Chart color: `var(--color-secondary)` (saffron) matching `CHART_COLORS.primary`
- Period toggle: pill selector matching admin analytics pattern (`rounded-lg border bg-surface-primary p-1`, active `bg-saffron text-text-inverse`)
- Time granularity: Daily (14 days) / Weekly (12 weeks, default) / Monthly (12 months)
- Per-route breakdown: collapsible card rows using `HistorySummaryCard` expand/collapse pattern — no tables
- Card shell: `bg-surface-primary/80 backdrop-blur-sm rounded-2xl border-2 shadow-card` (driver glass variant)
- Chart height: h=220 mobile, h=300 desktop

### Achievement/Badge System
- Badge triggers from existing schema (`migration 021_driver_gamification.sql`):
  - `first_delivery` (1), `delivery_10` (10), `delivery_50` (50), `delivery_100` (100)
  - `streak_5` (5 days), `streak_10` (10 days)
  - `five_star` (rating_avg >= 5.0 with 10+ deliveries)
- Visual: 48x48 circular container, gradient bg, emoji icon — matches existing `BadgesDisplay.tsx`
- Entry animation: `scale: 0 → 1` with `spring.ultraBouncy` + 0.1s stagger
- Badge earned: `celebration.badge` token from `effects.ts`
- Streak "on fire": orange gradient card + fire particles (already in `StreakDisplay.tsx`)
- Gamification prominence: secondary — after route card in dashboard stack, hidden when empty
- Badge award: server-side on route completion, check thresholds, insert to `driver_badges`
- New badge notification: toast (not confetti — confetti reserved for payment completion)
- Dashboard shows 5 most recent badges; earnings page shows all

### Bottom Navigation Restructure
- Expand from 3 to 5 tabs: Home → Route → Earnings → Schedule → History
- Icons (lucide-react, h-6 w-6): `Banknote` for Earnings, `CalendarDays` for Schedule
- Active state: existing `text-accent-teal`, `strokeWidth: 2.5`, `scale-110`, layoutId pill — works for 5 tabs without changes
- Touch targets: `min-h-[56px] min-w-[64px]` already set — 5 tabs fit at 375px viewport (75px/slot)
- Container height `h-16` + `pb-20` on main content: no adjustment needed
- Home tab avatar: keep as-is (Phase 71 pattern) — do NOT add separate Profile tab
- Badge on Schedule tab: reasonable for "schedule posted" notification; no badge on Earnings tab

### Claude's Discretion
- Exact chart tooltip format and interaction
- Loading skeleton layout for earnings page
- Error state handling for earnings computation
- Whether earnings summary card shows trend arrow (up/down vs last period)
- Compression algorithm for earnings data on slow connections

</decisions>

<specifics>
## Specific Ideas

- `weeklyEarningsCents` prop already typed in `DriverDashboardProps` — wire to real data source
- Reuse `PerformanceChart` component with `type="area"` — no new chart library needed
- `BadgesDisplay` and `StreakDisplay` components already exist and are wired into dashboard layout
- `driver_badges` table with RLS policies already migrated (021)
- `calculate_driver_streak()` DB function already exists
- Admin analytics pill toggle is the exact pattern for period selection

</specifics>

<deferred>
## Deferred Ideas

- Tips/bonus system — would require new schema and business logic (future phase)
- Driver payout/payment integration — out of scope, earnings are display-only
- Earnings export/download as CSV — could be added in Phase 74 polish

</deferred>

---

*Phase: 72-driver-earnings-dashboard*
*Context gathered: 2026-02-19*
