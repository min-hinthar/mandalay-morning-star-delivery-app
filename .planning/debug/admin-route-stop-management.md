---
status: awaiting_human_verify
trigger: "Admins need to add/remove/move orders (stops) to/from existing routes. No UI for adding stops."
created: 2026-03-04T00:00:00Z
updated: 2026-03-04T00:00:00Z
---

## Current Focus

hypothesis: API layer is complete (POST add stops, DELETE remove stop, POST reassign). StopsList/RouteStopCard already have Remove and Reassign UI. Only missing piece is "Add Stops" button + modal on route detail page.
test: Read all route-related code to verify
expecting: Confirm no AddStops UI exists
next_action: Create AddStopsModal component and wire it into RouteDetailClient

## Symptoms

expected: Admin should be able to add unassigned orders to an existing route, move orders between routes, remove stops without cancelling orders
actual: No UI exists to add stops to an existing route. Remove and Reassign already work.
errors: No errors - feature gap
reproduction: Open existing route detail page - no way to add new stops
started: Feature gap - route management built with creation-only workflow

## Eliminated

- hypothesis: API endpoints for add/remove/reassign stops are missing
  evidence: All three endpoints exist and are fully implemented (POST /stops, DELETE /stops/[stopId], POST /stops/reassign)
  timestamp: 2026-03-04

- hypothesis: Remove stop UI is missing
  evidence: RouteStopCard has Remove button with ConfirmDialog, wired to DELETE /stops/[stopId]
  timestamp: 2026-03-04

- hypothesis: Reassign (move between routes) UI is missing
  evidence: RouteStopCard has Reassign dropdown showing other planned routes for same date
  timestamp: 2026-03-04

## Evidence

- timestamp: 2026-03-04
  checked: API endpoints at src/app/api/admin/routes/[id]/stops/
  found: POST (add stops), PATCH (update status), DELETE (remove stop) all implemented
  implication: Backend is ready

- timestamp: 2026-03-04
  checked: src/app/api/admin/routes/[id]/stops/reassign/route.ts
  found: POST reassign endpoint fully implemented with business rules
  implication: Backend for move-between-routes is ready

- timestamp: 2026-03-04
  checked: RouteStopCard.tsx
  found: Has Remove button (with ConfirmDialog) and Reassign dropdown (with available routes)
  implication: Remove and Reassign UI already exist

- timestamp: 2026-03-04
  checked: RouteDetailClient.tsx
  found: No "Add Stops" button or modal. handleRemoveStop and handleReassign handlers exist.
  implication: Only AddStops UI is missing

- timestamp: 2026-03-04
  checked: builder-orders API
  found: GET /api/admin/routes/builder-orders returns unassigned confirmed/preparing orders
  implication: Can reuse this endpoint for the AddStops modal

## Resolution

root_cause: AddStopsModal component does not exist. RouteDetailClient has no button to trigger adding stops to an existing route.
fix: Created AddStopsModal component, wired into RouteDetailClient with toast + refetch, added "Add Stops" button in RouteHeader (visible only for planned routes)
verification: typecheck passes, lint passes
files_changed:
  - src/components/ui/admin/routes/AddStopsModal/AddStopsModal.tsx (new)
  - src/components/ui/admin/routes/AddStopsModal/index.tsx (new)
  - src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx (modified)
  - src/components/ui/admin/routes/RouteDetailClient/RouteHeader.tsx (modified)
  - src/components/ui/admin/routes/index.ts (modified)
