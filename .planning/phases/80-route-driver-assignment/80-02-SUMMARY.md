---
phase: 80-route-driver-assignment
plan: "02"
subsystem: route-builder-ui
tags: [leaflet, maps, route-builder, clustering, driver-selector]
dependency_graph:
  requires:
    - src/lib/utils/clustering.ts (clusterOrders, estimateRouteDuration, getUnclusteredOrders)
    - src/lib/validations/route.ts (createRouteSchema)
    - src/lib/availability.ts (isDriverAvailable)
    - src/app/api/admin/routes/route.ts (POST route creation)
    - src/components/ui/admin/AdminPageHeader.tsx
    - src/components/ui/admin/SkeletonCrossfade.tsx
  provides:
    - src/app/(admin)/admin/routes/new/page.tsx (full-page route builder)
    - src/app/api/admin/routes/builder-orders/route.ts (unassigned orders with coordinates)
    - src/components/ui/admin/routes/RouteBuilder/ (RouteBuilderClient, helpers, barrel)
    - src/components/ui/admin/routes/RouteBuilderMap/ (Leaflet map, skeleton, dynamic wrapper)
  affects:
    - src/app/(admin)/admin/routes/page.tsx (Create Route button now links to /admin/routes/new)
    - Plans 03-04 (consume RouteBuilderClient and helpers)
tech_stack:
  added: []
  patterns:
    - Dynamic import with SSR disabled for Leaflet (avoids window-not-defined)
    - divIcon colored circles instead of default Leaflet PNG markers (avoids webpack bundling issues)
    - FitBounds inner component using useMap() hook for reactive viewport adjustment
    - Two-column sticky layout for desktop, stacked for mobile
    - Parallel data fetching for orders + drivers on mount
key_files:
  created:
    - src/app/(admin)/admin/routes/new/page.tsx
    - src/app/api/admin/routes/builder-orders/route.ts
    - src/components/ui/admin/routes/RouteBuilder/RouteBuilderClient.tsx
    - src/components/ui/admin/routes/RouteBuilder/UnassignedOrdersPanel.tsx
    - src/components/ui/admin/routes/RouteBuilder/DriverSelector.tsx
    - src/components/ui/admin/routes/RouteBuilder/RouteSummaryBar.tsx
    - src/components/ui/admin/routes/RouteBuilder/helpers.ts
    - src/components/ui/admin/routes/RouteBuilder/index.tsx
    - src/components/ui/admin/routes/RouteBuilderMap/RouteBuilderMap.tsx
    - src/components/ui/admin/routes/RouteBuilderMap/MapSkeleton.tsx
    - src/components/ui/admin/routes/RouteBuilderMap/index.tsx
  modified:
    - src/app/(admin)/admin/routes/page.tsx (Create Route button links to /admin/routes/new)
decisions:
  - "divIcon colored circles over default Leaflet markers: avoids webpack PNG bundling issues entirely"
  - "Dedicated /api/admin/routes/builder-orders endpoint: ops/orders lacks address coordinates needed for map"
  - "FitBounds as inner component with useMap hook: only Leaflet pattern that works for reactive viewport"
  - "Sticky right column on desktop: map stays visible while scrolling orders list"
  - "DriverSelector uses isDriverAvailable from lib/availability.ts: consistent with existing OpsDriverPanel"
metrics:
  duration: 12 minutes
  completed_date: "2026-03-02"
  tasks_completed: 2
  files_created: 11
  files_modified: 1
---

# Phase 80 Plan 02: Route Builder UI Summary

Full-page route builder at `/admin/routes/new` with two-column Leaflet map layout, cluster-grouped unassigned orders panel, availability-aware driver selector, and one-click atomic route creation.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Leaflet map component and route builder helpers | 98f31da7 | RouteBuilderMap/*, RouteBuilder/helpers.ts, RouteBuilder/index.tsx |
| 2 | Full-page route builder with all panels | 1458951c | RouteBuilderClient.tsx, UnassignedOrdersPanel.tsx, DriverSelector.tsx, RouteSummaryBar.tsx, builder-orders API, new/page.tsx |

## What Was Built

### /admin/routes/new

Full-page route builder with:
- **Two-column layout**: left (orders + driver), right (map + summary bar). Sticky right column on desktop.
- **Date picker**: defaults to upcoming Saturday via `getNextSaturday()`.
- **Unassigned orders panel**: clusters with color-coded section headers, "Select All" per cluster, individual checkboxes, customer name + address + time window + total per card, "Location Unknown" section for orders without coordinates, search by name/address.
- **Leaflet map**: colored circle divIcons matching cluster colors, FitBounds auto-adjusts viewport on selection change, SSR-disabled via dynamic import.
- **Driver selector**: availability check via `isDriverAvailable`, available drivers sorted first with green dot, unavailable grayed with reason, click to toggle selection.
- **Route summary bar**: stop count, ~duration, driver name (or "No driver assigned"), yellow warning for overlapping time windows, Create Route button.

### /api/admin/routes/builder-orders

New GET endpoint returning unassigned confirmed/preparing orders with:
- Address coordinates (lat/lng) for map pins
- Address line 1 + city for display
- Delivery window start/end for conflict detection
- Only orders with zero active route_stops (truly unassigned)

### helpers.ts

- `BuilderOrder` type with full address + window fields
- `getNextSaturday()`: date-fns nextSaturday → YYYY-MM-DD
- `formatCurrency(cents)`: cents to "$XX.XX"
- `hasTimeWindowConflict(orders)`: pairwise overlap detection
- `transformApiOrder(raw)`: API response → BuilderOrder mapping

### Routes List Update

`Create Route` button changed from modal trigger to `Link href="/admin/routes/new"` using Button's `asChild` prop. CreateRouteModal code preserved intact.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Added /api/admin/routes/builder-orders endpoint**
- **Found during:** Task 2
- **Issue:** Neither `/api/admin/orders` nor `/api/admin/ops/orders` included address lat/lng or delivery_window_end needed for map markers and time window conflict detection
- **Fix:** Created dedicated `builder-orders` API endpoint with address join and unassignment filter
- **Files modified:** src/app/api/admin/routes/builder-orders/route.ts (new)
- **Commit:** 1458951c

## Self-Check: PASSED

Files created and present:
- src/app/(admin)/admin/routes/new/page.tsx: FOUND
- src/components/ui/admin/routes/RouteBuilder/RouteBuilderClient.tsx: FOUND
- src/components/ui/admin/routes/RouteBuilder/UnassignedOrdersPanel.tsx: FOUND
- src/components/ui/admin/routes/RouteBuilder/DriverSelector.tsx: FOUND
- src/components/ui/admin/routes/RouteBuilder/RouteSummaryBar.tsx: FOUND
- src/components/ui/admin/routes/RouteBuilder/helpers.ts: FOUND
- src/components/ui/admin/routes/RouteBuilder/index.tsx: FOUND
- src/components/ui/admin/routes/RouteBuilderMap/RouteBuilderMap.tsx: FOUND
- src/components/ui/admin/routes/RouteBuilderMap/MapSkeleton.tsx: FOUND
- src/components/ui/admin/routes/RouteBuilderMap/index.tsx: FOUND
- src/app/api/admin/routes/builder-orders/route.ts: FOUND
- Commit 98f31da7 (Task 1): FOUND
- Commit 1458951c (Task 2): FOUND

Verification:
- pnpm typecheck: PASS
- pnpm lint: PASS
- pnpm lint:css: PASS
- pnpm build: PASS (routes/new and api/routes/builder-orders in build output)
