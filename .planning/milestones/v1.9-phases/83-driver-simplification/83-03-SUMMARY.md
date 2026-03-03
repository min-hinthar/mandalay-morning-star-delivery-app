---
phase: 83-driver-simplification
plan: "03"
subsystem: driver-simple-mode
tags: [components, driver-ux, delivery, confirmation, wiring]
dependency_graph:
  requires:
    - src/components/ui/driver/SimpleModeProvider.tsx
    - src/components/ui/driver/SimpleHome.tsx
    - src/lib/hooks/useOfflineSync.ts
    - src/lib/hooks/useBodyScrollLock.ts
  provides:
    - src/components/ui/driver/SimpleStopView.tsx
    - src/components/ui/driver/DeliveryConfirmDialog.tsx
    - src/app/(driver)/driver/DriverHomeSwitch.tsx
    - src/app/(driver)/driver/route/DriverRouteSwitch.tsx
  affects:
    - src/app/(driver)/driver/page.tsx
    - src/app/(driver)/driver/route/page.tsx
    - src/app/(driver)/driver/route/[stopId]/page.tsx
    - src/components/ui/driver/index.ts
tech_stack:
  added: []
  patterns:
    - Single-stop focus with auto-advance after delivery confirmation
    - Client wrapper pattern for conditional server-rendered content
    - Server-side simple_mode redirect for stop detail pages
key_files:
  created:
    - src/components/ui/driver/SimpleStopView.tsx
    - src/components/ui/driver/DeliveryConfirmDialog.tsx
    - src/app/(driver)/driver/DriverHomeSwitch.tsx
    - src/app/(driver)/driver/route/DriverRouteSwitch.tsx
  modified:
    - src/app/(driver)/driver/page.tsx
    - src/app/(driver)/driver/route/page.tsx
    - src/app/(driver)/driver/route/[stopId]/page.tsx
    - src/components/ui/driver/index.ts
decisions:
  - "Client wrapper pattern (DriverHomeSwitch, DriverRouteSwitch) for server-to-client simple mode branching"
  - "Server-side redirect from stop detail page in simple mode (avoids useSimpleMode in server component)"
  - "Phone data added to route stop query for SimpleStopView call-customer feature"
  - "Optimistic local status tracking with useOfflineSync fallback for delivery marking"
  - "1.5s success animation before auto-advance to next stop"
  - "Call for Help hardcoded operator phone for MVP"
metrics:
  completed: "2026-03-02"
  tasks_completed: 2
  files_created: 4
  files_modified: 4
---

# Phase 83 Plan 03: SimpleStopView + DeliveryConfirmDialog + Page Wiring

**One-liner:** Single-stop focus delivery view with confirmation dialog, plus conditional rendering wired into all driver pages.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | SimpleStopView + DeliveryConfirmDialog | 49000fe5 | 4 files (2 new, 2 modified) |
| 2 | Page wiring (home, route, stop detail) | 49000fe5 | 6 files (2 new, 4 modified) |

## What Was Built

### Task 1: Core Components

**`src/components/ui/driver/SimpleStopView.tsx`** (~350 lines) — Single-stop focus view:
- Progress counter "X of Y done" with animated teal progress bar
- Customer name (text-2xl bold), address card (tap opens Google Maps), phone card (tap calls)
- Mark Delivered button (72px, green) triggers DeliveryConfirmDialog
- Call for Help button dials hardcoded operator phone
- Success animation overlay ("Delivered!" green screen, 1.5s auto-dismiss)
- "All Done!" celebration screen with PartyPopper icon and Go Home button
- Offline delivery via useOfflineSync.queueStatusUpdate with optimistic local state

**`src/components/ui/driver/DeliveryConfirmDialog.tsx`** — "Mark as delivered at [address]?" confirmation with Cancel/Yes buttons. AnimatePresence, useBodyScrollLock, loading spinner.

### Task 2: Page Wiring

**`src/app/(driver)/driver/DriverHomeSwitch.tsx`** — Client wrapper: renders SimpleHome in simple mode, DriverDashboard in normal mode.

**`src/app/(driver)/driver/route/DriverRouteSwitch.tsx`** — Client wrapper: renders SimpleStopView in simple mode, ActiveRouteView with DriverPageHeader in normal mode.

**`src/app/(driver)/driver/route/page.tsx`** — Updated to pass stops through DriverRouteSwitch. Added phone to stop query.

**`src/app/(driver)/driver/route/[stopId]/page.tsx`** — Server-side redirect to `/driver/route` when simple_mode is true.

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (432 tests) |
| `pnpm build` | PASS |

## Deviations from Plan

- Phone data sourced from customer profile join (not a separate field on orders) — added to existing profiles query.
