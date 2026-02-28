---
phase: 38
plan: 02
status: complete
started: 2026-02-05
completed: 2026-02-05
subsystem: offline/customer
tags: [indexeddb, offline-cache, hooks, react]
---

# Phase 38 Plan 02: Customer IndexedDB Store & Online/Offline Detection

IndexedDB menu cache with timestamp tracking and online/offline detection hook for customer offline browsing.

## Changes Made

### Files Created

| File                                         | Purpose                                      | Lines |
| -------------------------------------------- | -------------------------------------------- | ----- |
| `src/lib/services/customer-offline-store.ts` | IndexedDB menu cache with staleness tracking | 159   |
| `src/lib/hooks/useCustomerOfflineSync.ts`    | Online/offline detection hook                | 73    |

### Files Modified

| File                     | Change                              |
| ------------------------ | ----------------------------------- |
| `src/lib/hooks/index.ts` | Added useCustomerOfflineSync export |

## Implementation Details

### customer-offline-store.ts

IndexedDB-based menu cache following existing driver offline-store.ts pattern:

- **Database:** `mms-customer-offline` with `menu-cache` object store
- **Single record pattern:** Uses "current" key for menu data
- **Timestamp tracking:** `cachedAt` field for staleness checks
- **Version field:** For cache invalidation support (OFFLINE-12)

**menuCache API:**

- `save(data, version)` - Store menu data with timestamp
- `get()` - Retrieve cached data with metadata
- `isStale(cachedAt, thresholdHours=24)` - Check 24-hour staleness
- `getAgeMs(cachedAt)` - Get cache age in milliseconds
- `clear()` - Clear all cached data

### useCustomerOfflineSync Hook

Online/offline detection with reconnection handling per CONTEXT.md:

- **isOnline:** Current navigator.onLine status
- **wasOffline:** True for 3 seconds after reconnecting (for "Back online" banner)
- **checkStatus():** Manual status refresh

**Features:**

- SSR-safe with typeof guards
- Window event listeners for online/offline
- Automatic timeout cleanup on unmount
- 3-second wasOffline window for UX feedback

## Commits

| Hash    | Description                                                                  |
| ------- | ---------------------------------------------------------------------------- |
| 58f8196 | feat(38-02): create customer offline store with IndexedDB menu cache         |
| 21dc529 | feat(38-02): create useCustomerOfflineSync hook for online/offline detection |
| 041ab3c | feat(38-02): export useCustomerOfflineSync from hooks barrel                 |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- [x] `pnpm typecheck` passes
- [x] customer-offline-store.ts created (159 lines > 80 min)
- [x] useCustomerOfflineSync.ts created (73 lines > 30 min)
- [x] menuCache export with save/get/isStale/clear methods
- [x] useCustomerOfflineSync exported from hooks barrel
- [x] addEventListener pattern for online/offline events

## Dependencies

- **Provides:** Customer menu caching infrastructure and online status detection
- **Required by:** 38-03 (Menu page offline integration, offline indicators)

## Notes

- Build verification blocked by Windows file lock on .next folder (pre-existing dev server issue)
- TypeScript compilation verified clean
- Pattern follows existing offline-store.ts for consistency
