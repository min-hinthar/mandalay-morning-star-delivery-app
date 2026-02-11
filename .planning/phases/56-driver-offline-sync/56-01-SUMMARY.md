---
phase: 56-driver-offline-sync
plan: 01
subsystem: infra
tags: [indexeddb, offline-sync, idempotency, exponential-backoff, zustand]

# Dependency graph
requires:
  - phase: 56-driver-offline-sync
    provides: Phase research identifying INFR-03 (retry logic) and INFR-04 (dual-queue) issues
provides:
  - Single IndexedDB queue (Zustand pendingActions removed)
  - Idempotency keys on PendingStatusUpdate and PendingPhoto
  - Exponential backoff retry (2s/4s/8s/16s/32s, no jitter)
  - 4xx permanent failure discrimination
  - 2-hour expired entry purge
affects: [56-02, 56-03, driver-offline-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "retryWithBackoff pattern: Idempotency-Key header + 4xx/5xx discrimination"
    - "FIFO queue processing: sorted by createdAt ascending"
    - "Fire-and-forget for locations: no idempotency, no backoff"

key-files:
  created:
    - src/lib/services/offline-store/retry.ts
  modified:
    - src/lib/stores/driver-store.ts
    - src/lib/stores/__tests__/driver-store.test.ts
    - src/lib/services/offline-store/db.ts
    - src/lib/services/offline-store/stores.ts
    - src/lib/services/offline-store/sync.ts
    - src/lib/services/offline-store/index.ts
    - src/lib/hooks/useOfflineSync.ts

key-decisions:
  - "INFR-04: IndexedDB is the single queue -- Zustand pendingActions fully removed"
  - "Locations are fire-and-forget (no idempotency key, no backoff)"
  - "Backoff: 2s base, 32s cap, 5 max attempts, no jitter per user decision"
  - "4xx = permanent failure (removed from queue immediately)"

patterns-established:
  - "retryWithBackoff: generic retry with idempotency header injection"
  - "purgeExpiredEntries: 2-hour TTL on all queued items"

# Metrics
duration: 7min
completed: 2026-02-11
---

# Phase 56 Plan 01: Queue Infrastructure Summary

**Single IndexedDB queue with idempotency keys, exponential backoff retry (2s-32s), 4xx/5xx discrimination, and 2-hour expiry purge**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-11T10:50:57Z
- **Completed:** 2026-02-11T10:57:53Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Eliminated dual-queue architecture (INFR-04): Zustand pendingActions fully removed, IndexedDB is sole queue
- Added idempotency keys (crypto.randomUUID) to PendingStatusUpdate and PendingPhoto interfaces and store add methods
- Implemented retryWithBackoff with exponential backoff (2s/4s/8s/16s/32s, no jitter), Idempotency-Key header injection, and 4xx permanent failure discrimination
- Added purgeExpiredEntries utility (2-hour TTL) for queue cleanup on load

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove Zustand pendingActions and add idempotency keys** - `d843138` (feat)
2. **Task 2: Implement exponential backoff retry and sync with expiry purge** - `250ffbc` (feat)

## Files Created/Modified
- `src/lib/services/offline-store/retry.ts` - NEW: getBackoffDelay, retryWithBackoff, purgeExpiredEntries
- `src/lib/stores/driver-store.ts` - Removed PendingAction interface, pendingActions state, and queue actions
- `src/lib/stores/__tests__/driver-store.test.ts` - Removed pendingActions test describe block (10 tests remain)
- `src/lib/services/offline-store/db.ts` - Added idempotencyKey to PendingStatusUpdate and PendingPhoto
- `src/lib/services/offline-store/stores.ts` - pendingStatus.add and pendingPhotos.add generate idempotency keys
- `src/lib/services/offline-store/sync.ts` - Rewritten with retryWithBackoff, FIFO ordering, permanentFailures tracking
- `src/lib/services/offline-store/index.ts` - Re-exports purgeExpiredEntries and getBackoffDelay
- `src/lib/hooks/useOfflineSync.ts` - Updated lastSyncResult type with permanentFailures field

## Decisions Made
- INFR-04: IndexedDB is the single queue -- Zustand pendingActions fully removed
- Locations are fire-and-forget (no idempotency key, no backoff) -- duplicates harmless
- Backoff: 2s base, 32s cap, 5 max attempts, no jitter per locked user decision
- 4xx = permanent failure (removed from queue immediately, logged with [PERMANENT] prefix)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated useOfflineSync hook type for permanentFailures**
- **Found during:** Task 2 (sync.ts rewrite)
- **Issue:** syncPendingItems return type gained permanentFailures field; useOfflineSync lastSyncResult type was missing it
- **Fix:** Added permanentFailures: number to both interface and state type in useOfflineSync.ts
- **Files modified:** src/lib/hooks/useOfflineSync.ts
- **Verification:** pnpm typecheck passes
- **Committed in:** 250ffbc (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Type alignment fix necessary for compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Queue infrastructure complete: single IndexedDB queue with idempotency, backoff, and expiry
- Ready for Plan 02: UI wiring (sync status indicators, pending counts display, retry triggers)
- purgeExpiredEntries should be called on app load in Plan 02

---
*Phase: 56-driver-offline-sync*
*Completed: 2026-02-11*
