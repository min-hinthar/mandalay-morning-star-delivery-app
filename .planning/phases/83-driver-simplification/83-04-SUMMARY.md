---
phase: 83-driver-simplification
plan: "04"
subsystem: driver-simple-mode
tags: [components, driver-ux, offline, toast]
dependency_graph:
  requires:
    - src/components/ui/driver/SimpleModeProvider.tsx
    - src/lib/hooks/useOfflineSync.ts
    - src/lib/hooks/useToastV8.ts
  provides:
    - src/components/ui/driver/SimpleOfflineOverlay.tsx
  affects:
    - src/components/ui/driver/DriverShell.tsx
    - src/components/ui/driver/index.ts
tech_stack:
  added: []
  patterns:
    - Full-screen dismissible overlay with state reset on new offline event
    - Previous value ref for online/offline transition detection
    - Conditional component rendering in shell (overlay vs banner)
key_files:
  created:
    - src/components/ui/driver/SimpleOfflineOverlay.tsx
  modified:
    - src/components/ui/driver/DriverShell.tsx
    - src/components/ui/driver/index.ts
decisions:
  - "Full-screen overlay for simple mode vs compact banner for normal mode"
  - "Overlay dismissed state resets when device goes online then offline again"
  - "Toast on reconnect and sync complete (not on overlay)"
  - "z-[80] matches existing OfflineBanner z-index"
metrics:
  completed: "2026-03-02"
  tasks_completed: 2
  files_created: 1
  files_modified: 2
---

# Phase 83 Plan 04: SimpleOfflineOverlay + DriverShell Wiring

**One-liner:** Full-screen dismissible offline overlay for simple mode with reconnect toasts, conditionally rendered in DriverShell.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | SimpleOfflineOverlay component | f7d6a0ec | 2 files (1 new, 1 modified) |
| 2 | DriverShell conditional offline UX | f7d6a0ec | 1 file (modified) |

## What Was Built

**`src/components/ui/driver/SimpleOfflineOverlay.tsx`** — Full-screen overlay when offline:
- WifiOff icon (h-10, status-warning color)
- "No Internet" heading, reassuring body text about route being saved
- Pending delivery count display when actions queued
- "Continue Offline" button dismisses overlay
- X button in top-right for quick dismiss
- Dismissed state resets on next offline event (was online -> now offline)
- Toast "Back online -- syncing deliveries..." on reconnect
- Toast "All synced!" when syncState transitions to 'synced'

**`src/components/ui/driver/DriverShell.tsx`** — Conditional rendering:
- Simple mode: `<SimpleOfflineOverlay />`
- Normal mode: `<OfflineBanner />` (unchanged)
- All existing service worker and sync logic preserved

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (432 tests) |
| `pnpm build` | PASS |

## Deviations from Plan

None.
