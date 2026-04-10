---
phase: 114-loading-states-offline
plan: 03
subsystem: ui
tags: [indexeddb, offline, cache, zustand, cart-sync, pwa]

requires:
  - phase: 114-loading-states-offline
    provides: customer-offline-store menuCache API (plan 02)
provides:
  - IDB-first menu loading with stale badge support
  - Real cart sync validation on reconnect with price/availability checks
  - purgeStalePendingSync export for checkout flow
affects: [checkout, menu, cart, offline]

tech-stack:
  added: []
  patterns: [idb-first-loading, online-event-sync, listener-guard]

key-files:
  created:
    - src/components/ui/menu/__tests__/useMenuCache.test.ts
    - src/lib/stores/__tests__/cart-sync.test.ts
  modified:
    - src/components/ui/menu/useMenuCache.ts
    - src/lib/stores/cart-store.ts

key-decisions:
  - "Used 30s duration toast instead of persistent flag (ToastOptions lacks persistent field)"
  - "purgeStalePendingSync clears all pending flags unconditionally (no per-item timestamp tracking needed)"

patterns-established:
  - "IDB-first loading: mount effect with idbLoadedRef guard loads cache before network, transitions on fresh data"
  - "Online sync: listenerSetup module-level guard prevents duplicate event listener registration"

requirements-completed: [LOAD-04, CFIX-08]

duration: 12min
completed: 2026-04-10
---

# Phase 114 Plan 03: IDB-First Menu + Cart Sync Summary

**IDB-first menu loading from IndexedDB on mount with stale badge, plus real cart sync validation against /api/menu on reconnect**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-10T07:11:51Z
- **Completed:** 2026-04-10T07:24:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- useMenuCache loads IDB cache immediately on mount (instant menu display before network), with 24h stale check and seamless transition to fresh data
- setupOnlineListener fetches /api/menu on reconnect, validates prices/availability for pendingSync items, updates cart prices, removes unavailable items with named toasts
- Listener guard prevents duplicate online event registration; purgeStalePendingSync clears flags on store hydration
- 11 new tests (5 useMenuCache + 6 cart-sync), all 1029 tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Flip useMenuCache to IDB-first loading on mount** - `d579ba66` (feat)
2. **Task 2: Wire real cart sync validation in setupOnlineListener** - `d85e5f4b` (feat)

## Files Created/Modified

- `src/components/ui/menu/useMenuCache.ts` - IDB-first loading with mount effect, stale check, network transition
- `src/components/ui/menu/__tests__/useMenuCache.test.ts` - 5 tests: mount cache, transition, stale skip, no cache, error fallback
- `src/lib/stores/cart-store.ts` - syncPendingCartItems, buildMenuLookup, purgeStalePendingSync, listener guard
- `src/lib/stores/__tests__/cart-sync.test.ts` - 6 tests: fetch, price match, price change, unavailable, guard, purge

## Decisions Made

- Used `duration: 30_000` instead of `persistent: true` for removed-item toasts -- ToastOptions interface lacks a `persistent` field, 30s duration provides equivalent long visibility
- purgeStalePendingSync clears all pendingSync flags unconditionally rather than tracking per-item timestamps -- simpler implementation, if user was offline 24h+ prices are stale anyway

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed persistent toast type mismatch**
- **Found during:** Task 2 (cart sync implementation)
- **Issue:** Plan specified `persistent: true` on toast call, but `ToastOptions` interface only has `message`, `type`, `duration`, `sound` -- no `persistent` field. TypeScript compilation failed.
- **Fix:** Replaced `persistent: true` with `duration: 30_000` (30s) for equivalent long-lived visibility. Updated test to match.
- **Files modified:** src/lib/stores/cart-store.ts, src/lib/stores/__tests__/cart-sync.test.ts
- **Verification:** `pnpm typecheck` passes, test verifies `duration: 30_000` in toast call
- **Committed in:** d85e5f4b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for TypeScript compilation. No behavioral difference -- 30s duration achieves same user visibility as persistent.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 114 (loading-states-offline) plan 03 complete -- all 3 plans finished
- IDB-first menu loading and real cart sync validation are production-ready
- No blockers for next phase

---
*Phase: 114-loading-states-offline*
*Completed: 2026-04-10*
