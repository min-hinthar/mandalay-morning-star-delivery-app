# Phase 79: Saturday Ops Dashboard - Research

**Researched:** 2026-03-01
**Domain:** Admin operations dashboard with real-time polling, bulk actions, countdown timers, driver readiness
**Confidence:** HIGH

## Summary

This phase builds a new `/admin/ops` page -- a dense, operational "control room" for Saturday delivery management. The codebase already has mature admin patterns: `AdminDashboard`/`KPICard` for animated KPI grids, `OrdersTable`/`OrderCardRow` for order lists, `StatusBadge` for status display, `SkeletonCrossfade` for loading states, `ConfirmDialog` for confirmation modals, and `Checkbox` (Radix-based) for selection. The existing `AdminNav` is a simple array of nav items that needs one addition. Business rules from Phase 78 (`getBusinessRules()`) provide `cutoffDay`, `cutoffHour`, `deliveryStartHour`, `deliveryEndHour` via `unstable_cache` with tag-based invalidation.

The key technical challenges are: (1) 5s client-side polling that preserves checkbox selections across refreshes, (2) bulk status change via the existing per-order PATCH API (no RPC exists yet -- STATE.md says "Bulk ops via server-side RPC" but no RPC was created in prior phases), (3) countdown timers that compute time remaining from business rules and transition to alert state at zero, and (4) deriving driver availability from `availability_json` without new schema.

**Primary recommendation:** Build as a client component page with `useEffect`-based 5s polling, reuse existing `KPICard` patterns for clickable status cards, extend `OrderCardRow` with checkbox support, and use `ConfirmDialog` for bulk action confirmation. The page should NOT be a server component since it needs continuous polling and interactive state.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Widget grid layout: KPI status cards at top, then order list, then driver readiness below
- KPI cards are clickable -- clicking a status card filters the order list to that status
- Countdown timers (cutoff + delivery start) in a sticky top bar, always visible when scrolling
- New route at `/admin/ops` -- does NOT replace the existing `/admin` analytics dashboard
- Add "Ops Center" link to admin navigation
- Checkbox on each order row with "Select All" in header
- When 1+ orders selected, a floating/sticky toolbar appears with bulk actions
- Forward-only status transitions only: Pending->Confirmed, Confirmed->Preparing, Preparing->Out for Delivery
- Cancel remains a separate per-order action (not bulk)
- Confirmation dialog before bulk status change: "Move 5 orders from Confirmed -> Preparing?"
- After bulk action: clear all selections + show success toast with count
- Derived from existing `availability_json` -- no new DB schema or check-in system
- Driver is "expected" if: Saturday in `available_days` AND today not in `blocked_dates` AND `is_active=true`
- Compact list format: name, vehicle type, rating, reason if unavailable
- Show ALL active drivers -- available ones highlighted, unavailable ones grayed out with reason
- Positioned below the order list as a full-width section
- Clicking a driver links to their detail page
- Client-side polling every 5 seconds (no Supabase Realtime subscriptions)
- Preserve checkbox selections across refreshes
- If a selected order leaves the current filter view, silently drop that selection
- Subtle refresh pulse/spinner icon in header on each poll cycle
- When countdown timers hit zero: visual alert state (red, "PAST CUTOFF" / "DELIVERY STARTED"), no sound

### Claude's Discretion
- Loading skeleton design for initial page load
- Exact KPI card arrangement (how many per row, responsive breakpoints)
- Time window grouping implementation approach (OPS-06)
- Toast styling and duration
- Empty state design when no orders exist
- Mobile responsiveness approach

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OPS-01 | Ops center widget with order status counts and quick-action buttons | Reuse `KPICard` pattern with clickable cards that filter order list; 5s polling via `useEffect`+`setInterval` |
| OPS-02 | Bulk operations -- checkbox select + bulk status change | Existing `Checkbox` component (Radix), selection state in `Set<string>`, sequential PATCH calls to existing `/api/admin/orders/[id]/status` |
| OPS-03 | Countdown timers -- cutoff warning and delivery start time | `getBusinessRules()` provides times; compute target Date from next Saturday + configured hour; `useEffect` with 1s interval |
| OPS-04 | Unassigned orders badge -- red indicator for orders not on a route | Query orders with status=confirmed that have no matching `route_stops` entry; LEFT JOIN or separate query |
| OPS-05 | Driver availability widget -- who's ready, who hasn't arrived | Fetch `/api/admin/drivers`, derive from `availability_json.available_days` + `blocked_dates` + `is_active` client-side |
| OPS-06 | Time window grouping -- orders by delivery slot | Group by `delivery_window_start` field; display as section headers in order list |
| OPS-07 | Toast confirmation + optimistic UI on status changes | Existing `toast()` from `useToastV8`; optimistic local state update before API response |
| RULES-09 | Admin ops dashboard uses configured cutoff/delivery times for countdown timers | `getBusinessRules()` already available; pass as server props or fetch via API |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js 16 | 16.x | App Router, server components | Project framework |
| React 19 | 19.x | UI components | Project framework |
| Supabase | @supabase/ssr | Data fetching, auth | Project DB layer |
| Framer Motion | 12.x | Animations, layout transitions | Project animation library |
| Radix UI | @radix-ui/react-checkbox | Checkbox primitive | Already installed, used in existing Checkbox |
| Tailwind CSS v4 | 4.x | Styling via design tokens | Project styling approach |
| date-fns | 4.x | Date formatting, calculations | Already used throughout admin |
| Lucide React | latest | Icons | Already used throughout admin |
| Zod | 3.x | Request validation | Already used in status route |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Card/Badge | installed | Card, Badge, Button primitives | KPI cards, status badges |
| useToastV8 | internal | Toast notifications | Bulk action success/error feedback |
| useAnimationPreference | internal | Respect reduced-motion | All animated components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 5s polling | Supabase Realtime | Decided against -- indistinguishable at 20-50 orders, adds complexity |
| Sequential PATCH | Server RPC | RPC doesn't exist yet; sequential PATCH is simpler for 2-10 order batches |
| Custom KPI cards | Reuse AdminDashboard | Ops KPIs need onClick filtering -- extend pattern, don't import AdminDashboard directly |

**Installation:**
```bash
# No new packages needed -- zero new npm packages per STATE.md decision
```

## Architecture Patterns

### Recommended Project Structure
```
src/app/(admin)/admin/ops/
  page.tsx              # Server component: fetch business rules, pass to client
  OpsCenter.tsx         # Client component: main orchestrator
  error.tsx             # Error boundary (follow existing admin pattern)
  loading.tsx           # Loading skeleton

src/components/ui/admin/ops/
  index.tsx             # Barrel exports
  OpsKPIGrid.tsx        # Status count cards with click-to-filter
  OpsOrderList.tsx      # Order list with checkboxes + bulk toolbar
  OpsOrderRow.tsx       # Single order row with checkbox
  OpsBulkToolbar.tsx    # Floating/sticky toolbar for bulk actions
  OpsCountdownBar.tsx   # Sticky countdown timers bar
  OpsDriverPanel.tsx    # Driver availability section
  useOpsPolling.ts      # Custom hook: 5s polling + selection preservation
  useCountdown.ts       # Custom hook: countdown timer logic
  helpers.ts            # Shared types, status transition map, driver availability logic
```

### Pattern 1: Server/Client Split for Ops Page
**What:** Server component fetches business rules (cached), passes to client component that owns all interactive state.
**When to use:** Always for this page -- business rules are server-only (`unstable_cache`), but polling and selections are client-only.
**Example:**
```typescript
// page.tsx (server component)
import { getBusinessRules } from "@/lib/settings/business-rules";
import { OpsCenter } from "./OpsCenter";

export default async function OpsPage() {
  const rules = await getBusinessRules();
  return <OpsCenter rules={rules} />;
}
```

### Pattern 2: Polling with Selection Preservation
**What:** 5s interval fetches orders, merges with existing selection state. Selected IDs stored in `Set<string>`, pruned against current data on each refresh.
**When to use:** Core polling loop.
**Example:**
```typescript
// useOpsPolling.ts
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

export function useOpsPolling(intervalMs = 5000) {
  const [orders, setOrders] = useState<OpsOrder[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      setOrders(data);
      // Prune selections: remove IDs no longer in visible set
      setSelectedIds(prev => {
        const visibleIds = new Set(data.map((o: OpsOrder) => o.id));
        const next = new Set<string>();
        prev.forEach(id => { if (visibleIds.has(id)) next.add(id); });
        return next;
      });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, intervalMs);
    return () => clearInterval(interval);
  }, [fetchOrders, intervalMs]);

  return { orders, selectedIds, setSelectedIds, isRefreshing, statusFilter, setStatusFilter, refetch: fetchOrders };
}
```

### Pattern 3: Countdown Timer Hook
**What:** Computes time remaining until a target time (cutoff or delivery start). Updates every second. Transitions to "past" state at zero.
**When to use:** Countdown timers in sticky bar.
**Example:**
```typescript
// useCountdown.ts
'use client';
import { useState, useEffect } from 'react';

interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  label: string;
}

export function useCountdown(targetDate: Date, label: string): CountdownState {
  const [state, setState] = useState<CountdownState>(() => compute(targetDate, label));

  useEffect(() => {
    const tick = () => setState(compute(targetDate, label));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate, label]);

  return state;
}

function compute(target: Date, label: string): CountdownState {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, isPast: true, label };
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { hours, minutes, seconds, isPast: false, label };
}
```

### Pattern 4: Bulk Status Change with Sequential PATCH
**What:** Iterate selected order IDs, call existing PATCH endpoint for each, collect results, show toast.
**When to use:** Bulk toolbar action.
**Example:**
```typescript
async function bulkStatusChange(
  orderIds: string[],
  newStatus: OrderStatus
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;

  // Sequential to respect rate limits and maintain order
  for (const id of orderIds) {
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notifyCustomer: true }),
      });
      if (res.ok) succeeded++;
      else failed++;
    } catch {
      failed++;
    }
  }
  return { succeeded, failed };
}
```

### Pattern 5: Driver Availability Derivation
**What:** Client-side computation from existing `availability_json` field. No DB changes needed.
**When to use:** Driver readiness widget.
**Example:**
```typescript
import type { DriverAvailability, DayOfWeek } from '@/types/driver';
import { format } from 'date-fns';

interface DriverReadiness {
  id: string;
  fullName: string | null;
  vehicleType: string | null;
  ratingAvg: number;
  isAvailable: boolean;
  unavailableReason: string | null;
}

function deriveDriverReadiness(driver: DriverApiResponse, today: Date): DriverReadiness {
  const dayName = format(today, 'EEEE').toLowerCase() as DayOfWeek;
  const todayStr = format(today, 'yyyy-MM-dd');
  const avail: DriverAvailability | null = driver.availability;

  let isAvailable = true;
  let reason: string | null = null;

  if (!driver.isActive) {
    isAvailable = false;
    reason = 'Inactive';
  } else if (!avail) {
    isAvailable = false;
    reason = 'No availability set';
  } else if (!avail.available_days.includes(dayName)) {
    isAvailable = false;
    reason = `Not available on ${format(today, 'EEEE')}s`;
  } else if (avail.blocked_dates.includes(todayStr)) {
    isAvailable = false;
    reason = 'Blocked for today';
  }

  return {
    id: driver.id,
    fullName: driver.fullName,
    vehicleType: driver.vehicleType,
    ratingAvg: driver.ratingAvg,
    isAvailable,
    unavailableReason: reason,
  };
}
```

### Pattern 6: Unassigned Orders Detection
**What:** Orders with status "confirmed" that have no corresponding entry in `route_stops`. The existing `/api/admin/orders` does NOT include route assignment data. Two options:
1. **Add a dedicated ops API endpoint** that joins orders with route_stops to compute `isAssigned` flag
2. **Fetch route_stops separately** and compute client-side

**Recommendation:** Option 1 -- create `/api/admin/ops/orders` that returns enriched order data including `route_stop_id` (null = unassigned). This avoids N+1 and keeps the logic server-side.

### Anti-Patterns to Avoid
- **Don't import AdminDashboard directly:** The existing `AdminDashboard` component is designed for the analytics overview. Ops KPI cards need click-to-filter behavior and different data. Build new `OpsKPIGrid` using the same visual patterns (`KPICard`-like styling) but with `onClick` handlers.
- **Don't use `router.refresh()`:** The page is fully client-side polling. Server component refresh is unnecessary and would cause flicker.
- **Don't build a new bulk API endpoint if sequential PATCH works:** At 2-10 orders per bulk action, sequential PATCH to the existing endpoint is fine. Rate limiting (`adminLimiter`) is the concern -- ensure it can handle 10 rapid calls.
- **Don't store selections in URL params:** Checkbox state is ephemeral and per-session. URL params would create confusing bookmark/share behavior.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Checkbox primitive | Custom checkbox | Existing `Checkbox` from `@/components/ui/checkbox` | Radix-based, animated, accessible |
| Status badge | Custom status display | Existing `StatusBadge` from `@/components/ui/admin/StatusBadge` | Consistent pulse animations, color mapping |
| Confirmation dialog | Custom modal | Existing `ConfirmDialog` from `@/components/ui/admin/settings/ConfirmDialog` | Uses project `Modal`, consistent patterns |
| Toast notifications | Custom notification | Existing `toast()` from `@/lib/hooks/useToastV8` | Global state, stacking, auto-dismiss |
| Loading skeleton | Custom skeleton | Existing `SkeletonCrossfade` + `KPISkeleton` patterns | Crossfade animation, min display time |
| Card row container | Custom row | Existing `CardRow` from `@/components/ui/admin/CardRow` | Status tint, selection ring, hover animation |
| Empty state | Custom empty | Existing `EmptyState` from `@/components/ui/EmptyState` | Consistent illustrations and actions |
| Page header | Custom header | Existing `AdminPageHeader` from `@/components/ui/admin/AdminPageHeader` | Breadcrumbs, count badge, actions slot |
| Error boundary | Custom error | Follow existing `error.tsx` pattern in admin pages | Next.js error boundary convention |

**Key insight:** The admin section has a mature component library. Nearly every visual element needed for the ops dashboard already exists as a reusable component. The innovation is in composition and the polling/selection state management.

## Common Pitfalls

### Pitfall 1: Polling Leaks on Unmount
**What goes wrong:** `setInterval` continues after component unmounts, causing state updates on unmounted components.
**Why it happens:** Missing cleanup in `useEffect`.
**How to avoid:** Always return cleanup function from `useEffect` that calls `clearInterval`. Use `useRef` for the interval ID if needed.
**Warning signs:** "Can't perform a React state update on an unmounted component" warning.

### Pitfall 2: Selection Drift After Filter Change
**What goes wrong:** User selects orders in "Confirmed" filter, switches to "Preparing" filter, selected IDs reference orders no longer visible.
**Why it happens:** Selection state (`Set<string>`) isn't scoped to the active filter.
**How to avoid:** When filter changes, prune `selectedIds` to only include IDs visible in the new filter. The CONTEXT.md explicitly says: "If a selected order leaves the current filter view, silently drop that selection."
**Warning signs:** Bulk toolbar shows "3 selected" but only 1 order is visible.

### Pitfall 3: Race Condition in Bulk Status Change
**What goes wrong:** Polling refreshes data mid-bulk-operation, causing stale state conflicts.
**Why it happens:** 5s polling fires while sequential PATCH calls are in progress.
**How to avoid:** Pause polling during bulk operations. Set a `isBulkOperating` ref, skip poll when true.
**Warning signs:** Orders flicker between old and new status during bulk change.

### Pitfall 4: Countdown Timer Timezone Issues
**What goes wrong:** Countdown shows wrong time because business rules hours are assumed to be in a different timezone.
**Why it happens:** `cutoffHour` is a simple number (e.g., 15 for 3 PM) without timezone context. STATE.md notes: "Verify timezone for customer gate: Asia/Yangon vs America/Los_Angeles."
**How to avoid:** Use the same timezone assumption as the rest of the app. The countdown target date should be computed using the browser's local time (the operator is local). Document the timezone assumption.
**Warning signs:** Countdown doesn't match when the operator expects cutoff.

### Pitfall 5: File Length Exceeding 400-Line Limit
**What goes wrong:** `OpsCenter.tsx` or `OpsOrderList.tsx` exceeds the 400-line ESLint rule.
**Why it happens:** The ops page is feature-dense with many UI states.
**How to avoid:** Split into subfolder pattern from the start: `OpsCenter/index.tsx`, `OpsKPIGrid.tsx`, `OpsOrderList.tsx`, etc. Each file owns one concern. Extract hooks (`useOpsPolling`, `useCountdown`) into separate files.
**Warning signs:** ESLint `max-lines` warning during build.

### Pitfall 6: Rate Limiting on Bulk Operations
**What goes wrong:** Bulk status change for 10 orders triggers rate limiter (5 req/min per HARD-01 spec).
**Why it happens:** Admin rate limiter may be too restrictive for burst bulk operations.
**How to avoid:** The current `adminLimiter` allows more than 5/min (HARD-01 is a future phase). Check current limits. If needed, add small delays between sequential calls (100ms).
**Warning signs:** 429 responses during bulk operations.

### Pitfall 7: Stale Business Rules in Countdown
**What goes wrong:** Admin changes cutoff time in settings, but ops page countdown still uses old value.
**Why it happens:** `getBusinessRules()` uses `unstable_cache` with `revalidate: 300` (5 minutes). Page is client-side polling -- server component props don't refresh.
**How to avoid:** Initial rules come from server component props. For mid-session freshness, either accept 5-min staleness or add a lightweight API that returns current rules (reusing `getBusinessRules()`).
**Warning signs:** Countdown doesn't update after settings change until page reload.

## Code Examples

### KPI Status Card (Ops-Specific Clickable Card)
```typescript
// Verified pattern from existing KPICard.tsx + AdminDashboard.tsx
// Ops version adds onClick handler for filter behavior

interface OpsKPICardProps {
  label: string;
  count: number;
  variant: 'default' | 'success' | 'warning' | 'danger';
  isActive: boolean;
  onClick: () => void;
}

// Reuse variantStyles from KPICard.tsx pattern:
// default (teal), success (green), warning (secondary/amber), danger (red)
```

### Existing Status Transition Map
```typescript
// Source: src/app/api/admin/orders/[id]/status/route.ts
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

// Ops bulk transitions (forward-only, per CONTEXT.md):
const BULK_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: null, // no bulk for this
  delivered: null,
  cancelled: null,
};
```

### AdminNav Extension Point
```typescript
// Source: src/components/ui/admin/AdminNav.tsx
// Add to navItems array (between Routes and Menu, or at top for prominence):
{
  label: "Ops Center",
  href: "/admin/ops",
  icon: Activity, // or Monitor or RadioTower from lucide-react
},
```

### Driver API Response Shape
```typescript
// Source: src/app/api/admin/drivers/route.ts GET response
interface DriverApiResponse {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  vehicleType: string | null; // "car" | "motorcycle" | "bicycle" | "van" | "truck"
  licensePlate: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
  ratingAvg: number;
  deliveriesCount: number;
  availability: DriverAvailability | null; // { available_days: DayOfWeek[], blocked_dates: string[] }
  createdAt: string;
}
```

### AdminOrder Interface (Existing)
```typescript
// Source: src/components/ui/admin/OrdersTable.tsx
export interface AdminOrder {
  id: string;
  status: OrderStatus;
  refundStatus: RefundStatus;
  totalCents: number;
  deliveryWindowStart: string | null;
  placedAt: string;
  itemCount: number;
  customerName: string | null;
  customerEmail: string;
}
```

### Toast Usage Pattern
```typescript
// Source: src/lib/hooks/useToastV8.ts
import { toast } from "@/lib/hooks/useToastV8";

// Success after bulk action
toast({ message: `${count} orders moved to Preparing`, type: "success" });

// Error
toast({ message: "Failed to update 2 orders", type: "error" });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded cutoff/delivery times | `getBusinessRules()` from `app_settings` | Phase 78 (just completed) | Countdown timers MUST use this, not constants |
| `router.refresh()` after status change | Client-side optimistic update + polling | Current project pattern | No full-page refresh needed |
| Constants for delivery fee | DB-backed `app_settings` via `unstable_cache` | Phase 78 | All business rules are dynamic now |

**Deprecated/outdated:**
- `TIME_WINDOWS` constant: Replaced by dynamic generation from business rules settings (Phase 78)
- Hardcoded `CUTOFF_DAY`, `CUTOFF_HOUR` constants: Now in `app_settings` DB table

## Open Questions

1. **Unassigned Orders Query Strategy**
   - What we know: Need to identify "confirmed" orders not in any `route_stops` row. The existing `/api/admin/orders` does not include route assignment data.
   - What's unclear: Whether to extend the existing orders API or create a new ops-specific endpoint.
   - Recommendation: Create `/api/admin/ops/orders` that LEFT JOINs with `route_stops` and includes an `isAssigned` boolean. Keeps existing API stable, gives ops page exactly what it needs.

2. **Rate Limiting During Bulk Operations**
   - What we know: The `adminLimiter` exists for rate limiting. Bulk ops could fire 5-10 rapid PATCH calls.
   - What's unclear: Exact current rate limit threshold for admin.
   - Recommendation: Add a small delay (100-200ms) between sequential PATCH calls in bulk operations. If rate limited, report partial success ("3 of 5 updated, 2 rate limited").

3. **Time Window Grouping (OPS-06)**
   - What we know: Orders have `delivery_window_start` field. Phase 78 made time windows dynamic.
   - What's unclear: Whether to group by exact window or by hour blocks.
   - Recommendation: Group by `delivery_window_start` value. Orders with the same window start time form a group. Display as section headers (e.g., "11:00 AM - 12:00 PM") above the order rows within that group.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react + jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm test -- --run` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPS-01 | Status counts compute correctly from order data | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/helpers.test.ts -t "status counts"` | No - Wave 0 |
| OPS-02 | Bulk transition map returns correct next status | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/helpers.test.ts -t "bulk transitions"` | No - Wave 0 |
| OPS-03 | Countdown computes correct time remaining | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/useCountdown.test.ts` | No - Wave 0 |
| OPS-04 | Unassigned count matches orders without route_stop | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/helpers.test.ts -t "unassigned"` | No - Wave 0 |
| OPS-05 | Driver availability derivation from availability_json | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/helpers.test.ts -t "driver readiness"` | No - Wave 0 |
| OPS-06 | Time window grouping produces correct groups | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/helpers.test.ts -t "time window"` | No - Wave 0 |
| OPS-07 | Toast fires after bulk status change | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/helpers.test.ts -t "toast"` | No - Wave 0 |
| RULES-09 | Countdown target date uses getBusinessRules values | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/useCountdown.test.ts -t "business rules"` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test -- --run`
- **Per wave merge:** `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/ui/admin/ops/__tests__/helpers.test.ts` -- covers OPS-01, OPS-02, OPS-04, OPS-05, OPS-06, OPS-07
- [ ] `src/components/ui/admin/ops/__tests__/useCountdown.test.ts` -- covers OPS-03, RULES-09

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/components/ui/admin/AdminDashboard/KPICard.tsx` -- KPI card patterns, variant styles
- Codebase inspection: `src/components/ui/admin/OrdersTable.tsx` -- order list patterns, sorting, grouping
- Codebase inspection: `src/components/ui/admin/StatusBadge.tsx` -- status color map, pulse animations
- Codebase inspection: `src/app/api/admin/orders/[id]/status/route.ts` -- status transition validation, audit logging
- Codebase inspection: `src/app/api/admin/drivers/route.ts` -- driver API response shape with `availability_json`
- Codebase inspection: `src/lib/settings/business-rules.ts` -- `getBusinessRules()`, `BusinessRules` interface, cached reader
- Codebase inspection: `src/types/driver.ts` -- `DriverAvailability`, `DayOfWeek`, `DriversRow` types
- Codebase inspection: `src/components/ui/checkbox.tsx` -- Radix checkbox with Framer Motion animations
- Codebase inspection: `src/components/ui/admin/AdminNav.tsx` -- nav items array, Lucide icons
- Codebase inspection: `src/components/ui/admin/settings/ConfirmDialog.tsx` -- confirmation dialog pattern
- Codebase inspection: `src/lib/hooks/useToastV8.ts` -- toast API, types, usage patterns

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` decisions: "Bulk ops via server-side RPC" (noted but no RPC exists yet)
- `.planning/STATE.md` decisions: "5s polling over Supabase Realtime"

### Tertiary (LOW confidence)
- Rate limiting thresholds for `adminLimiter` -- not verified in detail, assumed reasonable for 10-call bursts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries are already installed and in active use
- Architecture: HIGH -- patterns directly derived from existing admin page implementations
- Pitfalls: HIGH -- identified from concrete code review of polling, state management, and API patterns
- Validation: MEDIUM -- test file paths are proposed, not yet created

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable -- no dependency changes expected)
