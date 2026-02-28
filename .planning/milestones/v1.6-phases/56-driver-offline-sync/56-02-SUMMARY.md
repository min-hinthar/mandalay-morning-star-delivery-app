---
phase: 56-driver-offline-sync
plan: 02
subsystem: ui
tags: [offline-sync, indexeddb, driver-ui, optimistic-ui, background-sync]

# Dependency graph
requires:
  - phase: 56-driver-offline-sync
    provides: IndexedDB queue with idempotency keys, backoff retry, purgeExpiredEntries
provides:
  - Offline-aware DeliveryActions with status update queuing
  - Offline-aware ExceptionModal with skip-status queuing
  - Offline-aware StopDetailView with photo queuing
  - Upgraded useOfflineSync with syncState machine, background timer, expiry purge, drain detection
affects: [56-03, driver-offline-indicators, driver-sync-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Offline fallback pattern: navigator.onLine check -> try fetch -> catch TypeError/5xx -> queue to IndexedDB"
    - "syncState machine: idle -> syncing -> synced/error -> idle (with auto-reset timers)"
    - "onDrain callback: queue empty after sync triggers router.refresh()"
    - "Background sync timer: 60s setInterval when queue non-empty and online"

key-files:
  created: []
  modified:
    - src/lib/hooks/useOfflineSync.ts
    - src/components/ui/driver/DeliveryActions.tsx
    - src/components/ui/driver/ExceptionModal.tsx
    - src/components/ui/driver/StopDetailView.tsx

key-decisions:
  - "Exception offline simplification: queue 'skipped' status update (not full exception POST) when offline"
  - "navigator.onLine used directly in handlers for freshness (not React state per research pitfall #1)"
  - "5xx responses fall through to offline queue (same as network errors)"
  - "onDrain callback via useRef to avoid effect dependency churn"

patterns-established:
  - "Offline fallback: check navigator.onLine -> attempt fetch -> catch TypeError or 5xx -> queueStatusUpdate/queuePhoto"
  - "syncState machine replaces boolean isSyncing for richer sync status reporting"
  - "prevTotalRef drain detection: compare pre/post-sync totals for queue empty transition"

# Metrics
duration: 4min
completed: 2026-02-11
---

# Phase 56 Plan 02: UI Wiring Summary

**Driver UI components (DeliveryActions, ExceptionModal, StopDetailView) wired through IndexedDB offline queue with syncState machine, 60s background timer, and drain-triggered data refresh**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-11T11:01:00Z
- **Completed:** 2026-02-11T11:05:20Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Upgraded useOfflineSync with syncState machine (idle/syncing/synced/error), expiry purge on mount, 60s background timer, and onDrain callback
- DeliveryActions queues status updates when offline/5xx/network-error with brief "Queued" flash UI
- ExceptionModal queues skip-status with exception details in deliveryNotes when offline
- StopDetailView queues photos to IndexedDB when offline with optimistic hasPhoto state

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade useOfflineSync with sync state, background timer, expiry purge, and drain detection** - `d510080` (feat)
2. **Task 2: Wire DeliveryActions, ExceptionModal, StopDetailView through offline queue** - `ec9f373` (feat)

## Files Created/Modified

- `src/lib/hooks/useOfflineSync.ts` - Sync state machine, background timer, expiry purge, onDrain callback, backward-compat isSyncing
- `src/components/ui/driver/DeliveryActions.tsx` - Offline-aware status updates with queueStatusUpdate fallback and "Queued" flash
- `src/components/ui/driver/ExceptionModal.tsx` - Offline-aware exception reporting via queueStatusUpdate('skipped')
- `src/components/ui/driver/StopDetailView.tsx` - Offline-aware photo uploads via queuePhoto with onDrain router.refresh()

## Decisions Made

- Exception offline simplification: queue a 'skipped' status update (not the full exception POST) when offline. The delivery_exceptions record is best-effort and can be filed from admin later.
- navigator.onLine used directly in handlers for freshness rather than React state (per research pitfall #1)
- 5xx responses treated same as network errors: fall through to offline queue
- onDrain callback stored in useRef to avoid triggering effect dependency re-runs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three driver UI components now queue actions when offline
- useOfflineSync provides sync state for future sync indicators (Plan 03)
- Background timer ensures queued items are retried every 60s
- onDrain callback enables data refresh when sync completes
- Ready for Plan 03: sync status indicators and offline banner UI

---

_Phase: 56-driver-offline-sync_
_Completed: 2026-02-11_
