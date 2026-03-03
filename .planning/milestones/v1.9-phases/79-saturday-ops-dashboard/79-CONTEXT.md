# Phase 79: Saturday Ops Dashboard - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Single-screen operations center where the operator answers "what needs attention right now?" in under 3 seconds. Shows live order counts by status, bulk status changes, countdown timers (cutoff + delivery start), unassigned orders badge, and driver availability. This is a NEW page at `/admin/ops` — the existing admin dashboard stays as the weekly analytics overview.

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout
- Widget grid layout: KPI status cards at top, then order list, then driver readiness below
- KPI cards are clickable — clicking a status card filters the order list to that status
- Countdown timers (cutoff + delivery start) in a sticky top bar, always visible when scrolling
- New route at `/admin/ops` — does NOT replace the existing `/admin` analytics dashboard
- Add "Ops Center" link to admin navigation

### Bulk order actions
- Checkbox on each order row with "Select All" in header
- When 1+ orders selected, a floating/sticky toolbar appears with bulk actions
- Forward-only status transitions only: Pending→Confirmed, Confirmed→Preparing, Preparing→Out for Delivery
- Cancel remains a separate per-order action (not bulk)
- Confirmation dialog before bulk status change: "Move 5 orders from Confirmed → Preparing?"
- After bulk action: clear all selections + show success toast with count

### Driver readiness
- Derived from existing `availability_json` — no new DB schema or check-in system
- Driver is "expected" if: Saturday in `available_days` AND today not in `blocked_dates` AND `is_active=true`
- Compact list format: name, vehicle type, rating, reason if unavailable
- Show ALL active drivers — available ones highlighted, unavailable ones grayed out with reason
- Positioned below the order list as a full-width section
- Clicking a driver links to their detail page

### Real-time refresh
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

</decisions>

<specifics>
## Specific Ideas

- KPI cards should feel like the existing `AdminDashboard` KPI cards — animated values, color-coded variants
- Unassigned orders badge should be visually urgent (red, possibly pulsing) to draw attention
- Bulk toolbar pattern similar to Gmail's floating action bar when emails are selected
- The whole page should feel like a "control room" — dense, information-rich, actionable

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AdminDashboard` + `KPICard`: Animated KPI grid with variants (default/success/warning/danger), goal tracking
- `StatusBadge`: Status display with pulse animations for active statuses
- `OrdersTable` + `OrderCardRow`: Admin order list with sorting, date grouping, drawer detail
- `AdminOrder` interface: id, status, refundStatus, totalCents, deliveryWindowStart, placedAt, itemCount, customerName, customerEmail
- `BusinessRules` (from Phase 78): `getBusinessRules()` returns cutoffDay, cutoffHour, deliveryStartHour, deliveryEndHour
- `checkbox` component: Existing shadcn checkbox component
- `EmptyState` component: Reusable empty state with illustrations
- `ExpandableTableRow`: Pattern for rows with inline detail panels

### Established Patterns
- Server components for data fetching, client components for interactivity
- Supabase server client via `createClient()` for queries
- Framer Motion for animations with `useAnimationPreference` hook
- Design token enforcement — no hardcoded colors/spacing
- Card-based layouts with `Card/CardHeader/CardContent` from shadcn

### Integration Points
- Admin nav (`AdminNav.tsx`): Add "Ops Center" link
- Admin route group: `src/app/(admin)/admin/ops/page.tsx`
- Orders API: `src/app/api/admin/orders/[id]/status/route.ts` for status changes
- Drivers API: `src/app/api/admin/drivers/route.ts` for driver list
- Business rules: `getBusinessRules()` for countdown timer configuration

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 79-saturday-ops-dashboard*
*Context gathered: 2026-03-01*
