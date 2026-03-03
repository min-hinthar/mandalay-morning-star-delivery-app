---
phase: 80-route-driver-assignment
plan: "03"
subsystem: route-reassignment-ui
tags: [reassignment, api, ui, stop-cards, route-list]
dependency_graph:
  requires:
    - 80-01 (reassignStopSchema, updateRouteStats, helpers.ts)
  provides:
    - src/app/api/admin/routes/[id]/stops/reassign/route.ts (POST reassignment endpoint)
    - RouteStopCard reassign dropdown + ConfirmDialog remove
    - StopsList reassign prop passthrough
    - RouteDetailClient availableRoutes + handleReassign
    - RouteCardRow estimated duration from stats_json
  affects:
    - Admin route detail page (stop cards get Reassign dropdown)
    - Admin route list page (RouteCardRow shows real duration)
    - Routes list API GET (now returns estimatedDurationMinutes)
tech_stack:
  added: []
  patterns:
    - ConfirmDialog reused from settings (consistent UX)
    - Inline available-routes fetch inside fetchRoute (piggybacks on existing refresh)
    - Atomic-ish reassignment with sequential reindex (acceptable for 10-50 orders)
key_files:
  created:
    - src/app/api/admin/routes/[id]/stops/reassign/route.ts
  modified:
    - src/components/ui/admin/routes/RouteStopCard.tsx
    - src/components/ui/admin/routes/StopsList.tsx
    - src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx
    - src/components/ui/admin/routes/RouteListTable/RouteCardRow.tsx
    - src/components/ui/admin/routes/RouteListTable/types.tsx
    - src/app/api/admin/routes/route.ts
decisions:
  - "availableRoutes fetch piggybacks inside fetchRoute (not parallel): keeps code simpler, single refresh point"
  - "ConfirmDialog for remove action: consistent UX matching settings pattern (v1.9 decision)"
  - "estimatedDurationMinutes optional on AdminRoute: backward-compatible with existing API consumers"
metrics:
  duration: 10 minutes
  completed_date: "2026-03-02"
  tasks_completed: 2
  files_created: 1
  files_modified: 6
  tests_added: 0
  tests_total: 417
---

# Phase 80 Plan 03: Order Reassignment Between Routes Summary

Stop reassignment API endpoint with full business-rule validation, "Reassign" dropdown on stop cards listing other planned same-day routes, ConfirmDialog replacing native confirm() for remove, and real duration minutes from stats_json on route list cards.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Create reassignment API endpoint | 2cca9441 | src/app/api/admin/routes/[id]/stops/reassign/route.ts |
| 2 | Add reassignment UI and enhance route stats | 05991cb3 | RouteStopCard.tsx, StopsList.tsx, RouteDetailClient.tsx, RouteCardRow.tsx, types.tsx, routes API route.ts |

## What Was Built

### POST /api/admin/routes/[id]/stops/reassign

Full validation chain:
- Auth + admin role + rate limiting (matching sibling route pattern)
- Source route: exists + planned status
- Target route: exists + planned status
- Same delivery_date check
- Source !== target check
- Stop belongs to source route
- Order not already on target route

Mutation:
- Moves stop to target route at max_index + 1
- Reindexes remaining source stops sequentially
- Updates stats_json on both routes via `updateRouteStats`
- Returns `{ stopId, sourceRouteId, targetRouteId, message }`

### RouteStopCard.tsx

- Added `availableRoutes?: Array<{ id, driverName, stopCount }>` and `onReassign?` props
- "Reassign" dropdown appears when `routeStatus === 'planned'` and available routes exist
- Each dropdown item shows: `{driverName ?? 'Unassigned'} — {stopCount} stops`
- "Remove" button now opens `ConfirmDialog` instead of native `confirm()`
- ConfirmDialog message: "This will return the order to the unassigned pool..."

### StopsList.tsx

- Added `availableRoutes` and `onReassign` props, passed through to each `RouteStopCard`

### RouteDetailClient.tsx

- Added `availableRoutes` state
- `fetchRoute()` now also fetches `/api/admin/routes?date={deliveryDate}` after loading route, filters to other planned routes, maps to `{ id, driverName, stopCount }`
- `handleReassign(stopId, targetRouteId)`: POSTs to reassign API, toast success/error, calls `fetchRoute()` on success
- `handleRemoveStop` now uses `toast` for error display instead of `alert()`
- Passes `availableRoutes` and `handleReassign` to `StopsList`

### RouteCardRow.tsx + types.tsx + routes API

- `AdminRoute` type: added `estimatedDurationMinutes?: number | null`
- Routes list GET API: appends `estimatedDurationMinutes: statsJson?.total_duration_minutes ?? null` to each item
- Duration display: shows real minutes if available, falls back to `~{stopCount * 15} min`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed UnassignedOrdersPanel lint error from Plan 02**
- **Found during:** Task 2 post-lint verification
- **Issue:** `text-white` in UnassignedOrdersPanel.tsx (created in Plan 02, untracked) violated design token ESLint rule `no-restricted-syntax`
- **Fix:** Changed `text-white` to `text-text-inverse`
- **Files modified:** src/components/ui/admin/routes/RouteBuilder/UnassignedOrdersPanel.tsx
- **Commit:** 05991cb3 (included with Task 2)

**2. [Rule 1 - Formatting] Prettier formatting applied to modified files**
- **Found during:** Task 2 post-implementation
- **Issue:** Modified files failed `pnpm format:check` (pre-existing project-wide Prettier non-compliance)
- **Fix:** `pnpm prettier --write` on the 6 modified/created files
- **Commit:** 05991cb3

## Self-Check: PASSED

All files present and all commits verified:
- src/app/api/admin/routes/[id]/stops/reassign/route.ts: FOUND
- src/components/ui/admin/routes/RouteStopCard.tsx: FOUND
- src/components/ui/admin/routes/StopsList.tsx: FOUND
- src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx: FOUND
- src/components/ui/admin/routes/RouteListTable/RouteCardRow.tsx: FOUND
- src/app/api/admin/routes/route.ts: FOUND
- Commit 2cca9441 (reassign API): FOUND
- Commit 05991cb3 (UI changes): FOUND
