# Phase 94: Admin & Driver Enhancements - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin has time-window order grouping for batch processing, and drivers can contact customers (call/text), navigate to stops via preferred maps app, and must capture photo proof before marking deliveries complete. Requirements: ADMIN-01, DRV-01, DRV-02, DRV-03.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All implementation decisions delegated to Claude. User trusts Claude to pick the best approach for each area based on existing code patterns, driver simplicity (non-technical family members), and the 50-150 orders/Saturday scale.

**ADMIN-01: Time-Window Grouping**
- `groupByTimeWindow()` helper and `OpsOrderList` grouped rendering ALREADY EXIST in `src/components/ui/admin/ops/`
- Claude reviews existing implementation for gaps and enhances if needed (collapsible groups, per-window select-all, count badges, range-based merging)
- Keep exact-timestamp grouping vs merge into hourly ranges: Claude decides based on existing delivery window data patterns
- Collapsible vs always-visible groups: Claude decides based on 50-150 order volume
- Per-window select-all checkbox: Claude decides based on batch processing utility

**DRV-01: One-Tap Customer Contact**
- Phone call via `tel:` already exists in `StopDetail.tsx` — extend with SMS option
- Call + Text: two buttons vs expandable vs single split button — Claude picks simplest driver-friendly pattern
- SMS pre-fill: template message vs empty — Claude picks for non-technical drivers
- Button placement: current content area vs sticky footer — Claude picks for quick access during deliveries
- No-phone fallback: disabled state vs hidden — Claude follows existing StopDetail conditional pattern

**DRV-02: Turn-by-Turn Navigation**
- `NavigationButton` component already opens Google Maps via URL
- Maps app preference: always Google Maps vs platform-auto-detect vs driver setting — Claude picks most practical for 3-6 family drivers
- Navigation opens immediately on tap (current behavior) — keep this, no preview step
- Button visibility: all stops vs active-only — Claude picks based on delivery workflow
- No-coordinates fallback: text address search vs hidden — Claude picks most helpful approach

**DRV-03: Photo Proof Enforcement**
- `PhotoCapture` + offline queue + upload API all exist — change from optional to enforced
- Enforcement level: hard block vs soft warning vs admin override — Claude picks based on requirement saying "enforced, not optional"
- Offline handling: queued photo counts as captured (don't block driver on connectivity) — Claude follows existing offline-first pattern
- Post-capture display: inline thumbnail vs confirmation badge — Claude picks for driver speed
- Admin photo viewing: order detail only vs ops dashboard indicator — Claude picks for dispute handling workflow

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User delegated all decisions to Claude with trust in pragmatic choices for non-technical family-member drivers and solo admin operator at 50-150 orders/Saturday scale.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/admin/ops/helpers.ts`: `groupByTimeWindow()`, `computeStatusCounts()`, `deriveDriverReadiness()` — ADMIN-01 foundation
- `src/components/ui/admin/ops/OpsOrderList.tsx`: Already renders grouped orders with section headers — enhance for batch processing
- `src/components/ui/admin/ops/OpsCenter.tsx`: Calls `groupByTimeWindow(filteredOrders)` — already wired
- `src/components/ui/driver/StopDetail.tsx`: Has `handleCall()` with `tel:` link and `NavigationButton` — extend for DRV-01/DRV-02
- `src/components/ui/driver/StopDetailView.tsx`: Has `PhotoCapture` integration with offline queue — modify for DRV-03 enforcement
- `src/components/ui/driver/NavigationButton.tsx`: Opens Google Maps with coordinates/address — enhance for DRV-02
- `src/components/ui/driver/PhotoCapture.tsx`: Camera capture component with blob handling
- `src/lib/hooks/useOfflineSync.ts`: IndexedDB queue for photo uploads when offline
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/photo/`: Photo upload API route (path exists in grep but route file not found — may need creation)

### Established Patterns
- Driver simple mode (default on): 2-tab nav, simplified views — new features must work in simple mode
- Offline-first: photo queue via IndexedDB, `useOfflineSync` hook with `queuePhoto()` and `onDrain` callback
- Framer Motion animations: all driver page elements use `m.div` with opacity/y transitions
- `useAnimationPreference()` hook for reduced-motion support
- Toast notifications via `useToastV8` for success/error feedback
- 5s polling on ops dashboard via `useOpsPolling()`
- `testMode` prop pattern for components that skip API calls in test mode

### Integration Points
- Driver stop detail page (`/driver/route/[stopId]`) — DRV-01/02/03 changes go here
- `DeliveryActions` component — DRV-03 enforcement hooks into status transition logic
- Admin ops center (`/admin/ops`) — ADMIN-01 enhancements go here
- `OpsOrderRow` component — potential photo indicator for admin viewing
- Admin order detail drawer (`OrderDetailDrawer`) — photo viewing for disputes
- Supabase Storage `menu-photos` bucket — reuse infrastructure pattern for delivery photos (or existing delivery photo path)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 94-admin-driver-enhancements*
*Context gathered: 2026-03-03*
