---
phase: 64-service-worker-hardening
plan: 04
subsystem: infra
tags: [indexeddb, idb-keyval, zustand, cart, offline, persistence, hydration]

# Dependency graph
requires:
  - phase: 64-01
    provides: "Service worker foundation with content-hash precache and offline fallback"
provides:
  - "IndexedDB-backed cart persistence via idb-keyval StateStorage adapter"
  - "Transparent localStorage-to-IndexedDB migration on first load"
  - "Async hydration tracking via _hasHydrated flag"
  - "Offline cart actions with pendingSync indicator"
  - "Reconnect sync: clears pendingSync + shows 'Cart synced!' toast"
affects: [64-05, 65-lighthouse-ci]

# Tech tracking
tech-stack:
  added: ["idb-keyval", "fake-indexeddb"]
  patterns: ["IndexedDB StateStorage adapter for Zustand persist", "async hydration tracking with _hasHydrated", "online event listener for offline sync"]

key-files:
  created:
    - "src/lib/services/cart-idb-storage.ts"
  modified:
    - "src/lib/stores/cart-store.ts"
    - "src/types/cart.ts"
    - "src/test/setup.ts"

key-decisions:
  - "Used idb-keyval default store (no custom DB name) for simplicity"
  - "One-time transparent migration: check localStorage if IndexedDB empty, copy + delete"
  - "pendingSync flag on CartItem (optional boolean) rather than separate sync queue"
  - "Online listener at module level via setupOnlineListener() called once"
  - "Added fake-indexeddb/auto to test setup for IndexedDB mock in jsdom"

patterns-established:
  - "IDB storage adapter: StateStorage interface wrapping idb-keyval get/set/del"
  - "Hydration tracking: _hasHydrated boolean + _setHasHydrated action + onRehydrateStorage callback"
  - "Offline-aware mutations: check navigator.onLine, mark items with pendingSync"
  - "Reconnect sync: window 'online' event listener clears pending flags + toast notification"

# Metrics
duration: 13min
completed: 2026-02-15
---

# Phase 64 Plan 04: Cart IndexedDB Migration Summary

**Cart persistence migrated from localStorage to IndexedDB via idb-keyval, with transparent data migration, async hydration tracking, and offline pendingSync indicators**

## Performance

- **Duration:** 13 min
- **Started:** 2026-02-15T06:56:59Z
- **Completed:** 2026-02-15T07:09:47Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created cartIDBStorage adapter implementing Zustand StateStorage with idb-keyval
- Transparent one-time migration from localStorage to IndexedDB (read + copy + cleanup)
- Added _hasHydrated flag for UI to avoid flash of empty cart during async hydration
- Items added while offline get pendingSync: true flag for visual indicators
- On reconnect: pendingSync flags cleared + "Cart synced!" success toast
- All 335 existing tests pass with fake-indexeddb mock

## Task Commits

Each task was committed atomically:

1. **Task 1: Install idb-keyval and create cart IDB storage adapter** - `63b3d13` (feat)
2. **Task 2: Migrate cart store to IndexedDB with hydration tracking and offline sync** - `ecde60a` (feat)

## Files Created/Modified
- `src/lib/services/cart-idb-storage.ts` - Zustand StateStorage adapter using idb-keyval with localStorage migration
- `src/lib/stores/cart-store.ts` - Replaced localStorage backend with cartIDBStorage, added hydration tracking, offline awareness, and online sync listener
- `src/types/cart.ts` - Added pendingSync optional boolean to CartItem, _hasHydrated and _setHasHydrated to CartStore interface
- `src/test/setup.ts` - Added fake-indexeddb/auto import for test environment IndexedDB mock
- `package.json` - Added idb-keyval dependency and fake-indexeddb devDependency

## Decisions Made
- Used idb-keyval's default store (no custom DB name needed -- simpler, one key-value store suffices)
- Migration strategy: check IndexedDB first, fall back to localStorage, copy to IDB + remove from LS
- pendingSync as optional boolean on CartItem rather than separate offline queue (lightweight approach)
- setupOnlineListener() called at module level (executes once when module is imported)
- fake-indexeddb/auto provides global indexedDB shim in test setup (required since jsdom lacks IndexedDB)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added fake-indexeddb for test environment**
- **Found during:** Task 2 (verification step)
- **Issue:** Cart store tests failed with "ReferenceError: indexedDB is not defined" in jsdom environment
- **Fix:** Installed fake-indexeddb as devDependency and added `import "fake-indexeddb/auto"` to test setup
- **Files modified:** package.json, pnpm-lock.yaml, src/test/setup.ts
- **Verification:** All 335 tests pass including 5 cart-store tests
- **Committed in:** ecde60a (Task 2 commit)

**2. [Rule 3 - Blocking] Included orphaned OfflinePage component from prior plan**
- **Found during:** Task 2 (typecheck verification)
- **Issue:** typecheck failed because src/app/offline/page.tsx referenced OfflinePage from @/components/ui/offline which existed as uncommitted files from a prior plan execution
- **Fix:** Included the orphaned files (OfflinePage.tsx, index.ts re-export, page.tsx refactor) in Task 2 commit
- **Files modified:** src/app/offline/page.tsx, src/components/ui/offline/index.ts, src/components/ui/offline/OfflinePage.tsx
- **Verification:** typecheck passes with all files committed
- **Committed in:** ecde60a (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for test and type-check infrastructure. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Cart now persists in IndexedDB, surviving service worker cache clears
- _hasHydrated flag available for UI components to avoid flash of empty cart
- pendingSync flag on cart items ready for visual indicators in cart UI
- Online sync listener auto-clears pending state on reconnect
- All existing cart operations remain backward-compatible

---
*Phase: 64-service-worker-hardening*
*Completed: 2026-02-15*
