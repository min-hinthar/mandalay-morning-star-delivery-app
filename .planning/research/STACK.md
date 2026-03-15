# Technology Stack: v2.1 Route Operations & Admin Mobile

**Project:** Morning Star Delivery App
**Researched:** 2026-03-14
**Overall confidence:** HIGH

## Executive Summary

v2.1 requires **one new npm package**: `@dnd-kit/core` + `@dnd-kit/sortable` for drag-to-reorder stop lists. Everything else builds on existing infrastructure. The codebase already has route optimization (Google Routes API + nearest-neighbor fallback), location tracking (Geolocation API + adaptive server updates), photo proof capture/upload (Supabase Storage), and Leaflet maps. The admin mobile UX is a CSS/layout refactor of existing pages, not a stack addition.

Key decision: Use `@dnd-kit` over Framer Motion's built-in `Reorder` component despite Framer Motion already being installed. Framer Motion Reorder has documented mobile touch bugs (items snap back instead of reordering on iOS/Android) that have never been properly fixed upstream. Since drag-reorder is critical for both admin route editing AND driver stop reordering on phones, mobile reliability is non-negotiable. `@dnd-kit` is battle-tested on mobile with proper touch handling, keyboard accessibility, and screen reader support.

---

## Recommended Stack

### New Dependencies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop framework | Accessible, mobile-reliable DnD primitives. React 19 compatible. 16.8+ peer dep. |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable list preset | Built on @dnd-kit/core. Provides SortableContext, useSortable, arrayMove. |
| `@dnd-kit/utilities` | ^3.2.2 | CSS transform utilities | Required by sortable for CSS.Transform.toString(). Tiny (~1KB). |

### Existing Stack (Already Installed -- No Changes)

| Technology | Version | Purpose for v2.1 | Status |
|------------|---------|-------------------|--------|
| Framer Motion | 12.26.1 | Layout animations during reorder, stop card transitions | Already used everywhere |
| Leaflet + react-leaflet | 1.9.4 / 5.0.0 | Route maps (admin detail, route builder) | Already rendering route maps |
| `@react-google-maps/api` | 2.20.8 | NOT USED for route optimization -- only customer tracking map | Keep as-is |
| Google Routes API | server-side | Route optimization (optimizeWaypointOrder) | Already in `route-optimization/optimizer.ts` |
| Supabase Storage | via @supabase/supabase-js | Photo proof upload/retrieval | Already in `delivery-photos.ts` |
| browser-image-compression | 2.0.2 | Client-side photo compression before upload | Already used for driver profile photos |
| Zustand | 5.0.10 | Driver route execution state (current stop, progress) | Already used for cart, offline state |
| TanStack React Query | 5.90.1 | Server state for route data, invalidation on mutations | Already used throughout |
| date-fns | 4.1.0 | Time window formatting, ETA display | Already used |
| Lucide React | 0.562.0 | Icons for route status, navigation actions | Already used |
| Radix UI (Dialog, Select, etc.) | Various | Modals, dropdowns in route editing UI | Already used for 70+ components |

### Existing Infrastructure (No Changes Needed)

| System | What Exists | v2.1 Usage |
|--------|-------------|------------|
| Route optimization service | `src/lib/services/route-optimization/` with Google Routes API + nearest-neighbor fallback | Reuse as-is for auto-sort. Already handles time windows, polylines, batch stop index updates. |
| `batch_update_stop_indices` RPC | Supabase stored procedure for atomic reorder | Reuse for both optimization and manual drag-reorder saves |
| `useLocationTracking` hook | Geolocation watchPosition + adaptive server updates (2-10min intervals) | Reuse for driver route execution. Already posts to `/api/driver/location`. |
| `LocationTracker` component | GPS badge with status/error display | Reuse in driver route view |
| Photo proof pipeline | `PhotoCapture` component + `/api/driver/routes/[routeId]/stops/[stopId]/photo` + Supabase Storage | Reuse as-is for delivery proof |
| `StopDetailView` component | Driver stop detail with customer info, address, map, items, status actions | Extend with photo proof trigger and navigation integration |
| Clustering utility | `src/lib/utils/clustering.ts` with Haversine distance | Reuse for route builder |
| Admin route detail | `RouteDetailClient` with StopsList, OptimizationModal, AddStopsModal, reassign | Extend with drag-reorder capability |

---

## What NOT to Add

| Candidate | Why Skip |
|-----------|----------|
| Framer Motion `Reorder` | Documented mobile touch bugs (issue #1597, #1506). Items snap back on iOS. Workarounds require `{ passive: false }` touch handlers that conflict with scroll. @dnd-kit is more reliable. |
| `@dnd-kit/react` (v0.3.2) | Pre-release (0.x). New API, unstable. Use classic `@dnd-kit/core` + `@dnd-kit/sortable` which are stable (6.3.1 + 10.0.0). |
| `react-beautiful-dnd` | Deprecated. Unmaintained since Atlassian stopped development. |
| `react-sortablejs` | Wraps SortableJS which mutates DOM directly -- conflicts with React's virtual DOM. |
| Google Maps Directions API (client-side) | Route optimization already runs server-side via Google Routes API. No need for client-side routing. |
| Mapbox / Google Maps for admin | Leaflet already works for route display. No need to add a paid mapping service for the admin side. |
| `socket.io` / Supabase Realtime | Manual status updates, not live GPS tracking. 5s polling pattern already validated in v1.9 ops dashboard. Overkill. |
| `react-responsive` / CSS container query libs | Tailwind v4 responsive utilities (`sm:`, `md:`, `lg:`) + existing breakpoint system sufficient. No library needed. |
| State machine lib (XState) | Driver route execution flow (planned -> in_progress -> completed) is simple linear state. Zustand + DB status column suffices. |

---

## Integration Points

### Drag-Reorder + Existing Route Detail

The `StopsList` component currently renders a static sorted list. Integration plan:

1. Wrap `StopsList` in `DndContext` + `SortableContext` from @dnd-kit
2. Each `RouteStopCard` becomes a `useSortable` item
3. Add drag handle (GripVertical icon) -- critical for mobile to distinguish drag from scroll
4. On `onDragEnd`, call `arrayMove` to get new order, then PATCH `/api/admin/routes/[id]/stops/reorder`
5. Reuse existing `batch_update_stop_indices` RPC for atomic DB update
6. Framer Motion `AnimatePresence` + `layout` prop handles smooth position transitions after reorder

### Driver Route Execution + Existing Components

The `ActiveRouteView` already has: start route, complete route, progress bar, stop list, location tracker. Extension plan:

1. Add "Mark Arrived" / "Mark Delivered" / "Skip" action buttons to `StopCard`
2. Use existing PATCH `/api/driver/routes/[routeId]/stops/[stopId]` for status changes
3. Add `Reorder.Group` (from @dnd-kit, not Framer Motion) for driver-side stop reordering
4. "Navigate" button opens native maps app via `window.open()` with Google Maps directions URL -- zero library needed
5. Photo proof already available via `PhotoCapture` component

### Admin Mobile Layout + Existing AdminNav

The `AdminNav` is a sidebar with collapsible state. For mobile:

1. Convert sidebar to bottom sheet / off-canvas drawer on `< md` breakpoints
2. Use existing `Drawer` component (already in component library) for mobile nav
3. Route detail, ops center, order list pages need responsive grid adjustments
4. Table components need card-based mobile alternative views
5. All Tailwind responsive -- no new dependencies

---

## Installation

```bash
# New dependencies (only addition for v2.1)
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Estimated bundle impact: ~15KB gzipped (core: ~10KB, sortable: ~4KB, utilities: ~1KB). Tree-shakeable.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Drag reorder | @dnd-kit/core + @dnd-kit/sortable | Framer Motion Reorder | Mobile touch bugs (items snap back on iOS). @dnd-kit has proper touch sensor with delay/distance activation. |
| Drag reorder | @dnd-kit/core + @dnd-kit/sortable | @dnd-kit/react (new API) | v0.3.2 pre-release. Unstable. Classic API is battle-tested. |
| Route optimization | Existing Google Routes API + NN fallback | OSRM / Valhalla self-hosted | Massive infrastructure overhead for 20-50 orders. Google Routes API already works. |
| Route optimization | Existing Google Routes API + NN fallback | Custom 2-opt/3-opt | Nearest-neighbor is sufficient for 3-10 stops per route. Diminishing returns on optimization. |
| Admin mobile nav | Tailwind responsive + existing Drawer | shadcn/ui Sidebar (new) | Already have AdminNav + Drawer components. Migrating to shadcn sidebar is unnecessary churn. |
| Driver state machine | Zustand store + DB status | XState | 4 states (planned, in_progress, completed, cancelled). XState overhead not justified. |
| Photo upload | Existing Supabase Storage pipeline | Cloudinary / S3 | Already works. Supabase Storage has CDN. No reason to change. |

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| @dnd-kit recommendation | HIGH | Verified versions on npm (6.3.1 + 10.0.0), React 19 compatible, well-documented mobile touch handling |
| Framer Motion Reorder rejection | HIGH | Verified open bug reports (#1597, #1506, #2101) for mobile. Workarounds are fragile. |
| No route optimization changes | HIGH | Inspected `optimizer.ts` -- Google Routes API + NN fallback already fully implemented with time windows, polylines, batch updates |
| No location tracking changes | HIGH | Inspected `useLocationTracking.ts` -- adaptive intervals, server POST, error handling all present |
| Admin mobile via Tailwind only | HIGH | Existing responsive utilities sufficient. AdminNav already has collapse state. |
| Photo proof reuse | HIGH | Inspected `PhotoCapture`, `delivery-photos.ts`, stop photo API endpoint -- all wired |

---

## Sources

- [@dnd-kit/sortable npm](https://www.npmjs.com/package/@dnd-kit/sortable) -- v10.0.0, published 2024-12-04
- [@dnd-kit/core npm](https://www.npmjs.com/package/@dnd-kit/core) -- v6.3.1, peer dep React >=16.8.0
- [Framer Motion Reorder docs](https://motion.dev/docs/react-reorder) -- built-in but mobile-limited
- [Framer Motion mobile Reorder bug #1597](https://github.com/motiondivision/motion/issues/1597) -- closed but workaround-based
- [Framer Motion scroll/drag conflict #1506](https://github.com/motiondivision/motion/issues/1506) -- mobile drag vs scroll
- [dnd-kit docs: Sortable](https://docs.dndkit.com/concepts/sortable) -- official sortable documentation
- Codebase inspection: `src/lib/services/route-optimization/optimizer.ts`, `src/lib/hooks/useLocationTracking.ts`, `src/components/ui/driver/PhotoCapture.tsx`, `src/components/ui/admin/routes/`
