# Phase 72: Driver Earnings Dashboard - Research

**Researched:** 2026-02-19
**Domain:** Driver earnings computation, charting, navigation restructure, gamification
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Earnings Computation Model
- No earnings table/columns exist — compute at query time from `deliveries_count * rate`
- Add `driver_pay_per_stop_cents` key to `app_settings` (e.g., 500 = $5/stop) — admin-configurable
- `delivery_fee_cents` on orders is business revenue, NOT driver pay — do not conflate
- `weeklyEarningsCents` prop in `DriverDashboardProps` is dead code — wire it to real computed data
- `driver_stats_mv` materialized view is the right place for aggregate earnings
- No tips column exists; do not assume tips go to drivers

#### Dashboard & Chart Design
- Summary cards: reuse `StatCard` pattern (rounded-2xl, gradient, animated count-up via `AnimatedValue`)
- 2-col grid (`grid-cols-2 gap-4`): Today's Earnings + This Week above fold
- Chart: `AreaChart` via existing `PerformanceChart` component with `type="area"` — zero new chart infra
- Chart color: `var(--color-secondary)` (saffron) matching `CHART_COLORS.primary`
- Period toggle: pill selector matching admin analytics pattern (`rounded-lg border bg-surface-primary p-1`, active `bg-saffron text-text-inverse`)
- Time granularity: Daily (14 days) / Weekly (12 weeks, default) / Monthly (12 months)
- Per-route breakdown: collapsible card rows using `HistorySummaryCard` expand/collapse pattern — no tables
- Card shell: `bg-surface-primary/80 backdrop-blur-sm rounded-2xl border-2 shadow-card` (driver glass variant)
- Chart height: h=220 mobile, h=300 desktop

#### Achievement/Badge System
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

#### Bottom Navigation Restructure
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

### Deferred Ideas (OUT OF SCOPE)
- Tips/bonus system — would require new schema and business logic (future phase)
- Driver payout/payment integration — out of scope, earnings are display-only
- Earnings export/download as CSV — could be added in Phase 74 polish
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DDASH-01 | Weekly earnings summary card showing computed earnings (per-delivery rate x completed deliveries) | Earnings API computes from route_stops + app_settings `driver_pay_per_stop_cents`; StatCard with AnimatedValue `format="currency"` |
| DDASH-02 | Per-route earnings breakdown showing earnings for each completed route | New API endpoint returns routes with stop counts; HistorySummaryCard expand/collapse pattern extended with earnings column |
| DDASH-03 | Earnings history chart using Recharts (bar/line) showing weekly/monthly trends | Existing `PerformanceChart` with `type="area"`, period toggle, responsive height |
| DDASH-11 | Earnings streak and badges wired to existing unused dashboard props (badges, streakDays) | `driver_badges` table (migration 021) + badge award logic on route completion + existing BadgesDisplay/StreakDisplay components |
| DDASH-12 | Performance milestones computed from existing stats (100 deliveries badge, 5-star streak) | Server-side threshold check after route completion; insert to `driver_badges` with defined badge_type values |
| DUI-01 | Driver bottom nav expanded with earnings and schedule tabs | DriverNav.tsx navItems array expanded from 3 to 5 items; new routes `/driver/earnings` and `/driver/schedule` |
</phase_requirements>

## Summary

Phase 72 builds on strong existing foundations. The driver dashboard already has `DriverDashboardProps` with typed `weeklyEarningsCents`, `badges`, and `streakDays` props — all currently dead code or mock data. The `driver_badges` table, `calculate_driver_streak()`, and `calculate_driver_weekly_deliveries()` functions exist from migration 021. The `PerformanceChart` component supports `area` type with Recharts. The `StatCard` supports animated counting via `AnimatedValue`. The `HistorySummaryCard` has the expand/collapse pattern. The `DriverNav` already handles the bottom navigation with animation.

**The primary work is:** (1) creating an earnings computation API backed by `app_settings` + `route_stops` joins, (2) building the `/driver/earnings` page with chart and per-route breakdown, (3) adding badge award logic to route completion, (4) expanding DriverNav from 3 to 5 tabs, and (5) wiring the dashboard earnings card to real data.

**Primary recommendation:** No new libraries needed. Reuse existing PerformanceChart, StatCard, AnimatedValue, HistorySummaryCard, BadgesDisplay, and StreakDisplay components. Add a single `driver_pay_per_stop_cents` key to app_settings via migration. Create a lightweight server-side earnings computation function.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 2.x | Area/Bar/Line charts | Already used in admin analytics (`PerformanceChart`) |
| framer-motion | 11.x | Animations, layout transitions | Already used for all driver dashboard animations |
| lucide-react | latest | Icons (`Banknote`, `CalendarDays`) | Already used in DriverNav and all driver components |
| @supabase/supabase-js | 2.x | Database queries, RPC calls | Already used for all data fetching |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| AnimatedValue | local | Count-up animation for earnings numbers | StatCard with `format="currency"` |
| PerformanceChart | local | Time series charts | Earnings history chart with `type="area"` |
| HistorySummaryCard | local | Expandable card rows | Per-route earnings breakdown |
| BadgesDisplay | local | Badge grid with animations | Dashboard and earnings page badge sections |
| StreakDisplay | local | Streak visualization with fire particles | Dashboard streak section (already wired) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PerformanceChart (area) | New custom chart component | Unnecessary — existing supports area type with all needed features |
| Client-side earnings calc | DB-side function | DB function is more reliable for aggregate queries; client-side would need multiple round trips |
| Separate earnings table | Computed from route_stops | Context decision locks computation approach; no schema additions beyond app_settings key |

**Installation:** None needed. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(driver)/driver/
│   ├── earnings/
│   │   ├── page.tsx              # Server component: fetch earnings data
│   │   ├── EarningsPageClient.tsx # Client component: chart + breakdown
│   │   └── loading.tsx           # Skeleton loading state
│   └── schedule/
│       └── page.tsx              # Placeholder for Phase 73
├── app/api/driver/
│   ├── earnings/
│   │   └── route.ts              # GET: earnings data (summary + history + per-route)
│   └── routes/[routeId]/
│       └── complete/
│           └── route.ts          # POST: (existing) — add badge award logic
├── components/ui/driver/
│   ├── DriverNav.tsx             # Updated: 3 → 5 tabs
│   └── DriverDashboard/
│       ├── EarningsSummaryCard.tsx # New: 2-col earnings grid
│       └── types.ts              # Updated: remove dead weeklyEarningsCents
└── lib/
    └── earnings/
        └── compute.ts            # Shared earnings computation logic
```

### Pattern 1: Earnings Computation via app_settings + route_stops Join
**What:** Query `app_settings` for `driver_pay_per_stop_cents`, then compute earnings from delivered route_stops count per time period.
**When to use:** Anytime earnings data is needed (dashboard summary, earnings page, chart data).
**Example:**
```typescript
// Earnings computation pattern
async function getDriverEarnings(supabase, driverId: string, period: string) {
  // 1. Get rate from app_settings (readable by all roles via USING(true))
  const { data: rateSetting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'driver_pay_per_stop_cents')
    .single();
  const ratePerStop = Number(rateSetting?.value ?? 500); // default $5

  // 2. Count delivered stops grouped by time period
  const { data: routes } = await supabase
    .from('routes')
    .select(`
      id, delivery_date, status,
      route_stops!inner(id, status)
    `)
    .eq('driver_id', driverId)
    .eq('route_stops.status', 'delivered')
    .gte('delivery_date', startDate)
    .order('delivery_date', { ascending: false });

  // 3. Compute: deliveredStops * ratePerStop
  return routes.map(r => ({
    routeId: r.id,
    date: r.delivery_date,
    deliveredStops: r.route_stops.length,
    earningsCents: r.route_stops.length * ratePerStop,
  }));
}
```

### Pattern 2: Badge Award on Route Completion
**What:** After a route is marked complete, check badge thresholds against driver's cumulative stats and insert any newly-earned badges.
**When to use:** In the route completion API handler (POST /api/driver/routes/[routeId]/complete or start).
**Example:**
```typescript
// Badge thresholds (from Context decisions)
const BADGE_THRESHOLDS = [
  { type: 'first_delivery', threshold: 1, name: 'First Delivery', icon: '🎉' },
  { type: 'delivery_10', threshold: 10, name: '10 Deliveries', icon: '⭐' },
  { type: 'delivery_50', threshold: 50, name: '50 Deliveries', icon: '🏆' },
  { type: 'delivery_100', threshold: 100, name: '100 Deliveries', icon: '💎' },
  { type: 'streak_5', threshold: 5, name: '5-Day Streak', icon: '🔥' },
  { type: 'streak_10', threshold: 10, name: '10-Day Streak', icon: '🌟' },
];

async function awardBadges(supabase, driverId: string, stats: DriverStats) {
  const { data: existing } = await supabase
    .from('driver_badges')
    .select('badge_type')
    .eq('driver_id', driverId);

  const earned = new Set(existing?.map(b => b.badge_type) ?? []);
  const newBadges = BADGE_THRESHOLDS.filter(b =>
    !earned.has(b.type) && stats.totalDeliveries >= b.threshold
  );

  // Insert new badges (service role for admin-only INSERT policy)
  if (newBadges.length > 0) {
    await supabase.from('driver_badges').insert(
      newBadges.map(b => ({
        driver_id: driverId,
        badge_type: b.type,
        name: b.name,
        icon: b.icon,
      }))
    );
  }
  return newBadges;
}
```

### Pattern 3: Period Toggle State Management
**What:** Client-side period selection (Daily/Weekly/Monthly) that re-fetches chart data.
**When to use:** Earnings page chart section.
**Example:**
```typescript
// Pill toggle pattern (from admin analytics)
const periods = ['daily', 'weekly', 'monthly'] as const;
type Period = typeof periods[number];

function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex rounded-lg border bg-surface-primary p-1 gap-0.5">
      {periods.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            value === p
              ? 'bg-secondary text-text-inverse'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Creating an earnings DB table:** Context explicitly locks computation from route_stops * rate. No schema migration for earnings storage.
- **Using delivery_fee_cents for driver pay:** This is business revenue. Driver pay uses `driver_pay_per_stop_cents` from app_settings.
- **Client-side aggregate computation:** Heavy joins should happen server-side (API route or DB function). Client only renders.
- **backdrop-blur on mobile DriverNav:** Causes Safari crashes. The existing DriverNav already avoids this — maintain that pattern.
- **Adding Profile tab to bottom nav:** Context explicitly says "do NOT add separate Profile tab" — Home tab avatar stays.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Earnings chart | Custom canvas/SVG chart | `PerformanceChart` with `type="area"` | Already handles responsive container, gradients, tooltips, animations |
| Count-up animation | Custom requestAnimationFrame counter | `AnimatedValue` component | Already handles format="currency", duration, easing |
| Expand/collapse cards | Custom height animation | `HistorySummaryCard` pattern with `AnimatePresence` | Already handles height:0→auto transition, exit animation |
| Badge display grid | Custom badge layout | `BadgesDisplay` component | Already handles stagger animations, overflow scroll, 5-badge limit |
| Streak visualization | Custom fire particles | `StreakDisplay` component | Already handles isOnFire threshold, particles, gradient |
| Bottom nav indicator | Custom tab bar | Extend existing `DriverNav` with 2 more items | Already handles layoutId pill, scale-110, badge counts |

**Key insight:** Phase 72 is primarily a wiring + data phase, not a UI-building phase. Nearly every visual component already exists.

## Common Pitfalls

### Pitfall 1: Badge INSERT Requires Admin/Service Role
**What goes wrong:** Driver-authenticated Supabase client tries to INSERT into `driver_badges` — blocked by admin-only INSERT policy.
**Why it happens:** Migration 021 only allows admin INSERT: `WITH CHECK (public.is_admin())`.
**How to avoid:** Use `createServiceClient()` (service role) for badge award logic, or call a SECURITY DEFINER function.
**Warning signs:** 403/RLS error on route completion when trying to award badges.

### Pitfall 2: Materialized View Staleness
**What goes wrong:** `driver_stats_mv` shows outdated delivery counts because materialized view hasn't been refreshed.
**Why it happens:** MV requires explicit `REFRESH MATERIALIZED VIEW CONCURRENTLY` — not auto-updated.
**How to avoid:** For real-time earnings, query `route_stops` directly instead of relying on `driver_stats_mv`. Use MV only for admin analytics where staleness is acceptable.
**Warning signs:** Dashboard shows different delivery count than earnings page.

### Pitfall 3: app_settings Key Missing on Fresh DB
**What goes wrong:** `driver_pay_per_stop_cents` doesn't exist in app_settings, earnings compute returns NaN or $0.
**Why it happens:** Key needs to be seeded via migration. If migration hasn't run, key is missing.
**How to avoid:** Migration seeds the key with default value. Code has fallback: `Number(rateSetting?.value ?? 500)`.
**Warning signs:** Earnings show $0.00 despite completed deliveries.

### Pitfall 4: DriverNav 5-Tab Width on Small Screens
**What goes wrong:** 5 labels don't fit on narrow viewports (<375px), causing text overlap.
**Why it happens:** Going from 3 to 5 tabs reduces per-tab width from ~125px to ~75px.
**How to avoid:** Current `min-w-[64px]` fits 5 tabs at 375px (5*64=320 < 375). Labels at `text-xs` are short enough. Verify with smallest common viewport.
**Warning signs:** Tab labels wrapping or overlapping on iPhone SE (320px).

### Pitfall 5: Route-Stops Join Performance
**What goes wrong:** Earnings history query for 12 months of routes is slow due to large join.
**Why it happens:** No index on `route_stops.status`, `routes.delivery_date` combination for driver-specific queries.
**How to avoid:** Index on `routes(driver_id, delivery_date)` already exists (`idx_routes_driver`). The query should use `eq('driver_id')` first to leverage this index. For monthly aggregation, compute server-side and return pre-aggregated data.
**Warning signs:** Earnings page takes >2s to load on first visit.

### Pitfall 6: five_star Badge Logic
**What goes wrong:** Badge awarded prematurely (driver with 1 delivery at 5.0 rating gets it).
**Why it happens:** Missing minimum delivery threshold check.
**How to avoid:** Context specifies: "rating_avg >= 5.0 with 10+ deliveries". Badge check must AND both conditions.
**Warning signs:** New driver with single 5-star rating gets five_star badge.

## Code Examples

### Earnings API Route (GET /api/driver/earnings)
```typescript
// Source: Codebase patterns from existing driver API routes
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const period = url.searchParams.get('period') ?? 'weekly';

  // Get driver record
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!driver) return NextResponse.json({ error: 'Not a driver' }, { status: 403 });

  // Get pay rate from app_settings (USING(true) allows driver read)
  const { data: rateSetting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'driver_pay_per_stop_cents')
    .single();
  const rateCents = Number(rateSetting?.value ?? 500);

  // Compute date range based on period
  const now = new Date();
  let startDate: string;
  if (period === 'daily') {
    startDate = new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0];
  } else if (period === 'monthly') {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split('T')[0];
  } else {
    startDate = new Date(now.getTime() - 12 * 7 * 86400000).toISOString().split('T')[0];
  }

  // Fetch routes with delivered stops
  const { data: routes } = await supabase
    .from('routes')
    .select('id, delivery_date, status, route_stops(id, status)')
    .eq('driver_id', driver.id)
    .gte('delivery_date', startDate)
    .eq('status', 'completed')
    .order('delivery_date', { ascending: false });

  // Compute per-route earnings
  const routeEarnings = (routes ?? []).map(r => {
    const delivered = r.route_stops?.filter(s => s.status === 'delivered').length ?? 0;
    return {
      routeId: r.id,
      date: r.delivery_date,
      deliveredStops: delivered,
      earningsCents: delivered * rateCents,
    };
  });

  // Aggregate for chart data
  // ... group by period (day/week/month) and sum earningsCents

  return NextResponse.json({ routeEarnings, rateCents, period });
}
```

### Migration: Seed driver_pay_per_stop_cents
```sql
-- Add driver pay rate to app_settings
INSERT INTO app_settings (key, value, category) VALUES
  ('driver_pay_per_stop_cents', '500'::jsonb, 'operations')
ON CONFLICT (key) DO NOTHING;
```

### DriverNav Update (3 → 5 tabs)
```typescript
// Source: Existing DriverNav.tsx pattern
import { Home, Package, Banknote, CalendarDays, History } from "lucide-react";

const navItems = [
  { label: "Home", href: "/driver", icon: Home, key: "home", exact: true },
  { label: "Route", href: "/driver/route", icon: Package, key: "route", exact: false },
  { label: "Earnings", href: "/driver/earnings", icon: Banknote, key: "earnings", exact: true },
  { label: "Schedule", href: "/driver/schedule", icon: CalendarDays, key: "schedule", exact: true },
  { label: "History", href: "/driver/history", icon: History, key: "history", exact: true },
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate earnings table | Compute from route_stops * rate | Context decision | No schema change needed |
| `weeklyEarningsCents` mock prop | Wire to real API data | Phase 72 | Dashboard shows actual earnings |
| Admin-only `driver_stats_mv` | Direct route_stops query for drivers | Phase 72 | Real-time accuracy for driver view |
| 3-tab DriverNav | 5-tab DriverNav | Phase 72 | Earnings + Schedule accessible |

**Deprecated/outdated:**
- `weeklyEarningsCents` prop default value of 0 with `void weeklyResult` in page.tsx — will be replaced with real data
- `_weeklyEarningsCents` prefix in DriverDashboard — dead code placeholder

## Open Questions

1. **Route completion trigger for badge awards**
   - What we know: Badges should be awarded server-side on route completion
   - What's unclear: Which specific endpoint triggers "route completion"? The route status update to `completed`, or the last stop delivery?
   - Recommendation: Use the existing route completion flow — when route status transitions to `completed`, trigger badge check. If no explicit completion endpoint exists, add badge check to the stop delivery endpoint when all stops are delivered/skipped.

2. **Streak badge vs delivery count badge timing**
   - What we know: Streak badges (streak_5, streak_10) depend on `calculate_driver_streak()` which checks consecutive days
   - What's unclear: Should streak badges be awarded at route completion too, or on a daily cron?
   - Recommendation: Award at route completion — streak function already handles date logic. No cron needed.

3. **Chart data aggregation on the server vs client**
   - What we know: 12 months of data could be 50+ routes
   - What's unclear: Whether to aggregate in SQL or in the API route handler
   - Recommendation: Aggregate in the API route handler (TypeScript). The route_stops join is already efficient with the driver_id index. Aggregation logic (group by week/month) is simpler in TypeScript than dynamic SQL.

## Sources

### Primary (HIGH confidence)
- Codebase: `supabase/migrations/021_driver_gamification.sql` — driver_badges table, calculate_driver_streak, calculate_driver_weekly_deliveries
- Codebase: `supabase/migrations/003_analytics.sql` — driver_stats_mv, get_driver_performance function
- Codebase: `supabase/migrations/010_app_settings.sql` — app_settings table with JSONB values
- Codebase: `supabase/migrations/022_rls_audit_hardening.sql` — app_settings USING(true) for universal read
- Codebase: `src/components/ui/admin/analytics/PerformanceChart.tsx` — Recharts area/bar/line chart
- Codebase: `src/components/ui/driver/DriverDashboard/` — StatCard, BadgesDisplay, StreakDisplay, HistorySummaryCard
- Codebase: `src/components/ui/driver/DriverNav.tsx` — 3-tab bottom navigation
- Codebase: `src/app/(driver)/driver/page.tsx` — dashboard data fetching pattern with parallel queries

### Secondary (MEDIUM confidence)
- Codebase: `src/components/ui/admin/AdminDashboard/AnimatedValue.tsx` — animated counter for currency format
- Codebase: `src/types/analytics.ts` — PerformanceChartProps interface with DailyMetricPoint data type

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and used in codebase
- Architecture: HIGH — patterns directly observed in existing code
- Pitfalls: HIGH — RLS policies verified from migration files, MV behavior well-documented
- Earnings computation: HIGH — route_stops/routes schema verified, app_settings accessible

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable — no external API dependencies)
