# Phase 56: Driver Offline Sync - Research

**Researched:** 2026-02-11
**Domain:** Offline queue consolidation, retry with exponential backoff, idempotency
**Confidence:** HIGH

## Summary

The codebase has a clear dual-queue architecture that must be consolidated:

1. **Zustand persist queue** (`src/lib/stores/driver-store.ts`) -- `PendingAction[]` persisted to `localStorage` via `zustand/middleware/persist`. Uses `crypto.randomUUID()` for IDs, stores `createdAt` timestamps. Currently **not consumed by any sync logic** -- no code reads `pendingActions` to replay them. The `addPendingAction`/`removePendingAction` methods exist but are only exercised in tests.

2. **IndexedDB queue** (`src/lib/services/offline-store/`) -- Three separate object stores (`pending-status`, `pending-photos`, `pending-locations`) with full CRUD and sync logic in `sync.ts`. Consumed by `useOfflineSync` hook. Connected to `OfflineBanner` and `DriverShell`. This is the **active, wired-up system**.

The driver UI (`DeliveryActions.tsx`, `ExceptionModal.tsx`, `StopDetailView.tsx`, `ActiveRouteView.tsx`) makes direct `fetch()` calls to API routes **without any offline queueing**. If `fetch()` fails while offline, the user sees an error message. The existing queuing infrastructure (`useOfflineSync.queueStatusUpdate`) is never called from any UI component.

**Primary recommendation:** Keep IndexedDB as the single queue. Remove the Zustand `pendingActions` array. Wire `DeliveryActions` and `ExceptionModal` through a unified offline-aware action dispatcher that queues to IndexedDB when offline and calls the API directly when online. Add idempotency keys, exponential backoff retry, and the redesigned banner UX.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Persist queue across app restarts with a **2-hour expiry** -- entries older than 2 hours auto-discard on load
- **No jitter** on backoff delays -- small driver fleet, thundering herd not a concern
- **Persistent banner** when offline -- fixed bar visible at all times while disconnected
- Banner shows **pending queue count** (e.g., "Offline -- 2 actions pending")
- **Warning amber/yellow** color for the offline banner
- **Animated slide in/out** -- banner slides in when going offline, slides out when reconnecting
- "Back online" banner **auto-dismisses after sync completes** -- shows "Syncing..." then "All synced!" before sliding away

### Claude's Discretion
**Queue architecture:**
- Which queue to keep (Zustand vs IndexedDB) -- researcher should analyze both implementations and recommend
- Whether to migrate existing data from the removed queue or start fresh
- Queue size cap (if any) -- evaluate realistic action volume per delivery route
- FIFO vs parallel processing -- evaluate based on status update semantics
- Connectivity detection strategy (navigator.onLine, health ping, or both)

**Retry behavior:**
- Backoff timing intervals -- pick appropriate timing for delivery status updates
- Max retry attempts before giving up
- What happens after max retries (manual retry vs mark-failed-and-continue)
- Whether retries trigger only on reconnect or also on a background timer
- Whether different action types have different retry priorities
- Success feedback when queue drains (per-item toast vs summary vs silent)
- Retry logging approach (server-persisted audit trail vs client-only)

**Offline UX feedback:**
- Offline action feedback (optimistic update + queued badge vs explicit queued state)
- Banner position (top vs bottom of screen)
- Failed sync item indicator granularity

**Conflict resolution:**
- Server behavior when receiving stale updates (silent reject vs notify driver)
- Status transition enforcement (strict ordering vs last-write-wins)
- Idempotency key strategy (client UUID vs composite natural key)
- Retry vs permanent fail on 4xx client errors
- Data refresh timing on reconnect (immediate vs after queue drain)
- Duplicate detection key expiry (time-bounded vs permanent)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.10 | Driver store (route state, UI state) | Already in codebase; persist middleware handles localStorage |
| IndexedDB (native) | Browser API | Offline pending queue storage | Already in codebase; handles Blob (photos), async, larger capacity |
| Framer Motion | 12.26.1 | Banner slide in/out animation | Already in codebase; used throughout driver UI |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.562.0 | Icons (WifiOff, Wifi, RefreshCw, Check, AlertCircle) | Banner icons |
| zod | 4.3.5 | Validation of queued action payloads before sync | Validate before replaying |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw IndexedDB | idb-keyval / Dexie.js | Simpler API but adds dependency; existing raw IndexedDB code works fine |
| navigator.onLine only | Health ping endpoint | More reliable but adds server load; see recommendation below |
| Service Worker Background Sync | Client-side retry loop | Better browser integration but Safari doesn't support Background Sync API |

**Installation:** No new dependencies needed. Everything uses existing stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── stores/
│   │   └── driver-store.ts          # Remove pendingActions, keep route/location/online state
│   ├── services/
│   │   └── offline-store/
│   │       ├── db.ts                # Add idempotency_key field, add 2hr expiry cleanup
│   │       ├── stores.ts            # Add idempotencyKey to PendingStatusUpdate
│   │       ├── sync.ts              # Add exponential backoff, idempotency headers
│   │       └── index.ts             # Re-export
│   └── hooks/
│       ├── useOfflineSync.ts        # Add backoff state, retry logic, drain detection
│       └── useConnectivity.ts       # NEW: navigator.onLine + online/offline events
├── components/
│   └── ui/
│       └── driver/
│           ├── OfflineBanner.tsx     # Redesign: amber, slide animation, queue count, sync states
│           └── DeliveryActions.tsx   # Wire through offline-aware dispatch
```

### Pattern 1: Offline-Aware Action Dispatch
**What:** Wrap every driver API call in a function that checks connectivity. Online = direct fetch. Offline = queue to IndexedDB with idempotency key.
**When to use:** Every status update, exception report, and photo upload from driver UI.
**Example:**
```typescript
// Source: Codebase analysis + offline-first patterns
async function dispatchDriverAction(action: QueueableAction): Promise<void> {
  const idempotencyKey = crypto.randomUUID();

  if (navigator.onLine) {
    try {
      const response = await fetchWithTimeout(action.url, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(action.payload),
      });

      if (response.ok) return; // Success
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`); // Don't queue 4xx
      }
      // 5xx: fall through to queue
    } catch (err) {
      if (err instanceof TypeError) {
        // Network error -- queue it
      } else {
        throw err; // Re-throw client errors
      }
    }
  }

  // Queue for later
  await addToQueue({
    ...action,
    idempotencyKey,
    createdAt: new Date().toISOString(),
  });
}
```

### Pattern 2: Exponential Backoff Without Jitter (per user decision)
**What:** Retry with increasing delays: 2s, 4s, 8s, 16s, 32s (capped). No jitter.
**When to use:** Every queued item during sync replay.
**Example:**
```typescript
// Source: Standard exponential backoff pattern
function getBackoffDelay(attempt: number, baseMs = 2000, maxMs = 32000): number {
  return Math.min(baseMs * Math.pow(2, attempt), maxMs);
}

// Retry loop for a single queued item
async function retryAction(item: PendingAction, maxAttempts = 5): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': item.idempotencyKey,
        },
        body: JSON.stringify(item.payload),
      });

      if (response.ok) return true;
      if (response.status >= 400 && response.status < 500) return false; // Permanent fail

      // 5xx: retry
    } catch {
      // Network error: retry
    }

    if (attempt < maxAttempts - 1) {
      await sleep(getBackoffDelay(attempt));
    }
  }
  return false;
}
```

### Pattern 3: Two-Hour Expiry on Load (per user decision)
**What:** When the app loads or resumes, scan the queue and discard entries with `createdAt` older than 2 hours.
**When to use:** On app init (inside `useOfflineSync` mount effect) and before each sync attempt.
**Example:**
```typescript
async function purgeExpiredEntries(maxAgeMs = 2 * 60 * 60 * 1000): Promise<number> {
  const now = Date.now();
  const allItems = await pendingStatus.getAll();
  let purged = 0;

  for (const item of allItems) {
    if (now - new Date(item.createdAt).getTime() > maxAgeMs) {
      await pendingStatus.remove(item.id);
      purged++;
    }
  }
  return purged;
}
```

### Anti-Patterns to Avoid
- **Dual queue writes:** Never write the same action to both Zustand and IndexedDB. Single source of truth.
- **Optimistic UI without rollback:** If showing optimistic status changes, must handle rollback when sync ultimately fails.
- **Blocking UI on sync:** Sync should happen in background. Never make the user wait for queue drain.
- **Retrying 4xx errors:** Client errors (400, 403, 404) indicate a permanent problem (e.g., stale status). Retrying wastes battery and will never succeed.

## Discretion Recommendations

### Queue: Keep IndexedDB, Remove Zustand pendingActions
**Confidence:** HIGH
**Reasoning:**
- IndexedDB is the **only queue with working sync logic** (`sync.ts` processes all three stores)
- IndexedDB handles Blob storage (photos) which localStorage cannot
- IndexedDB has no practical size limits (localStorage capped at ~5-10MB)
- The Zustand `pendingActions` array is **dead code** -- nothing reads it for sync
- Zustand persist via localStorage is synchronous and blocks the main thread for large payloads
- IndexedDB async operations don't block rendering

**Migration:** Start fresh. No data migration needed because:
1. Zustand `pendingActions` is never populated by actual UI code
2. IndexedDB queue items have a 2-hour expiry anyway
3. Migration adds complexity for zero benefit

### Queue Size Cap: 100 items
**Confidence:** HIGH
**Reasoning:**
- A typical delivery route has 10-30 stops
- Each stop generates at most: 1 status update (arrived) + 1 status update (delivered) + 1 photo + 1 possible exception = ~4 actions
- 30 stops x 4 actions = 120 max theoretical, but most routes are 10-15 stops
- Cap at 100 with oldest-first eviction provides generous headroom
- Beyond 100 queued items indicates something is seriously wrong (stuck offline for hours)

### Processing Order: FIFO (Sequential)
**Confidence:** HIGH
**Reasoning:**
- Status updates have **strict transition ordering**: `pending -> enroute -> arrived -> delivered`
- The server validates transitions (`isValidStatusTransition` in `driver-api.ts`)
- If "arrived" is replayed before "enroute", the server will reject it
- FIFO guarantees chronological order, preventing transition violations
- Parallel processing would race conditions on the same stop
- Queue is small (~4 items per stop) so sequential processing is fast enough

### Connectivity Detection: navigator.onLine + online/offline Events
**Confidence:** HIGH
**Reasoning:**
- `navigator.onLine` is unreliable for detecting true internet connectivity (MDN warns it only checks network interface, not internet access)
- However, for this use case it's **good enough** because:
  - We also detect connectivity failure when `fetch()` throws a `TypeError`
  - The retry loop catches real network failures regardless of `navigator.onLine`
  - Health ping adds server load and complexity for marginal benefit
  - The existing codebase already uses this pattern in `useOfflineSync.ts`, `DriverLayout.tsx`, and `OfflineIndicator.tsx`
- The `online`/`offline` events trigger sync attempts; failed fetches during sync handle the false-positive case naturally

### Backoff Timing: 2s, 4s, 8s, 16s, 32s
**Confidence:** HIGH
**Reasoning:**
- Base interval of 2 seconds is responsive enough for delivery status updates
- Cap at 32 seconds keeps the driver waiting at most ~30s between attempts
- 5 total attempts = 2+4+8+16+32 = 62 seconds total wait time max
- Drivers are typically stopped at delivery locations, so short waits are acceptable
- No jitter needed (per user decision) since fleet is small (~5-10 drivers)

### Max Retry Attempts: 5, Then Mark Failed
**Confidence:** HIGH
**Reasoning:**
- 5 attempts with exponential backoff = ~62 seconds of trying
- If still failing after 62 seconds, connectivity is genuinely unavailable
- **Mark as "failed" in queue** but don't discard -- surface to UI with manual retry button
- Driver can tap "Retry" when they know they have signal
- Automatic retries resume on next `online` event anyway
- Silent discard would lose data; forced manual retry would block the driver

### Retry Triggers: Both on Reconnect AND Background Timer
**Confidence:** MEDIUM
**Reasoning:**
- On reconnect (`online` event): immediate sync attempt -- handles the common case
- Background timer (every 60 seconds while items are pending): catches cases where `online` event doesn't fire but connectivity returned
- Timer only runs when queue is non-empty (no wasted cycles)
- 60-second interval balances responsiveness vs battery use

### Action Priority: All Equal (FIFO)
**Confidence:** HIGH
**Reasoning:**
- Status updates must be in order (FIFO handles this)
- Photos and exceptions are tied to specific stops and don't conflict
- No compelling reason to prioritize one type over another
- Adding priority levels adds complexity without clear benefit for a ~10-30 stop route

### Success Feedback: Summary Banner (Not Per-Item Toast)
**Confidence:** HIGH
**Reasoning:**
- Per CONTEXT.md locked decision: banner shows "Syncing..." then "All synced!" before sliding away
- This IS the summary approach -- no per-item toasts needed
- Consistent with the banner-based UX pattern already decided
- Per-item toasts would be noisy and distracting while driving

### Retry Logging: Client-Only Console + Sentry for Permanent Failures
**Confidence:** MEDIUM
**Reasoning:**
- Console.warn for each retry attempt (debug purposes)
- Sentry error capture when an item permanently fails after max retries
- Server-persisted audit trail is overkill for a small fleet
- Sentry already integrated (`@sentry/nextjs` in package.json)

### Offline Action Feedback: Optimistic Update + Queued Badge
**Confidence:** HIGH
**Reasoning:**
- When driver taps "Mark Delivered" offline, **immediately update local UI** to show delivered state
- Banner shows queue count increasing (e.g., "Offline -- 3 actions pending")
- If sync ultimately fails, rollback the optimistic update and surface error
- This gives responsive feel; explicit "queued" state would confuse drivers who expect instant response

### Banner Position: Top of Screen
**Confidence:** HIGH
**Reasoning:**
- Current `OfflineBanner.tsx` already renders at `fixed top-0`
- `OfflineIndicator.tsx` also uses `fixed inset-x-0 top-0`
- Bottom of screen has the action bar (`DriverLayout` action area)
- Top position is consistent with existing codebase patterns
- The driver layout header is `sticky top-0 z-20`; banner at `z-[80]` overlays it correctly

### Failed Sync Indicator: Per-Stop Error State
**Confidence:** MEDIUM
**Reasoning:**
- If a status update for stop #5 permanently fails, mark that stop in the UI with an error icon
- Driver can navigate to that stop and manually retry
- Preferable to a generic "3 items failed" message with no way to identify which stops

### Server Conflict Resolution: Strict Ordering with Silent Reject
**Confidence:** HIGH
**Reasoning:**
- Server already validates status transitions (`isValidStatusTransition` in `driver-api.ts`)
- Returns 400 for invalid transitions: `"Cannot transition from ${currentStatus} to ${newStatus}"`
- Client should treat 400 as permanent failure and remove from queue (don't retry)
- No need to notify driver of silent rejects -- the server state is already correct
- Edge case: driver marks "arrived" offline, admin already marks "skipped" on server. Client receives 400, discards the stale "arrived" update. Client refreshes data after queue drain.

### Idempotency Key Strategy: Client UUID
**Confidence:** HIGH
**Reasoning:**
- `crypto.randomUUID()` already used throughout codebase (driver-store.ts, offline-store stores.ts)
- UUID generated at action creation time, stored with queued item
- Sent as `Idempotency-Key` header on every request (including retries)
- Server stores (idempotency_key, response) pairs with 24-hour TTL
- Simpler than composite keys; sufficient for a small fleet
- Stripe, Adyen, and Square all use client UUID approach
- Composite keys add complexity without benefit when UUIDs already guarantee uniqueness

### 4xx vs 5xx Handling
**Confidence:** HIGH
- **4xx:** Permanent failure. Remove from queue. Log to Sentry. Surface error to driver.
- **5xx:** Transient failure. Retry with backoff.
- **Network error (TypeError):** Transient. Retry with backoff.

### Data Refresh on Reconnect: After Queue Drain
**Confidence:** HIGH
**Reasoning:**
- Refreshing before drain creates race conditions (server state doesn't reflect pending actions yet)
- After queue drains successfully, call `router.refresh()` to get authoritative server state
- This ensures the UI shows the actual server state including all synced changes

### Duplicate Detection Key Expiry: 24-Hour Server-Side TTL
**Confidence:** MEDIUM
**Reasoning:**
- Queue items expire after 2 hours client-side (per locked decision)
- 24-hour server TTL provides generous buffer for edge cases
- Can be implemented as a simple database table with periodic cleanup
- Or use Supabase RPC function with `created_at` filter

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Queue persistence | Custom localStorage serializer | IndexedDB (existing `offline-store/`) | Already built, handles Blobs, async, no size limit |
| Exponential backoff | setTimeout chains | Simple loop with `await sleep()` | Readable, testable, no timer cleanup needed |
| UUID generation | Custom ID generator | `crypto.randomUUID()` | Browser-native, RFC 4122 compliant, already used |
| Slide animation | CSS keyframes | Framer Motion `AnimatePresence` + `m.div` | Already in codebase, handles exit animations properly |
| Online detection | Custom polling | `navigator.onLine` + window events | Sufficient for this use case; fetch failures catch false positives |

**Key insight:** The existing IndexedDB infrastructure handles 80% of what's needed. The main work is wiring the UI to the queue, adding backoff/retry logic to `sync.ts`, adding idempotency keys, and redesigning the banner.

## Common Pitfalls

### Pitfall 1: Stale Closure in Retry Loop
**What goes wrong:** `useCallback` captures stale `isOnline` state; retry loop runs even after going offline again.
**Why it happens:** React closures capture values at creation time.
**How to avoid:** Use `navigator.onLine` (always current) instead of React state in retry logic. Or use `useRef` for the online flag.
**Warning signs:** Retries continue even after disconnect; battery drain.

### Pitfall 2: Race Condition Between Sync and New Actions
**What goes wrong:** User queues action, sync starts processing, user queues another action for same stop. Two conflicting updates in flight.
**Why it happens:** Sync reads queue snapshot but new items arrive during processing.
**How to avoid:** Lock the queue during sync (set `isSyncing` flag, prevent new queue writes for the same stop while its action is in-flight). Or use FIFO and only process items older than the sync-start timestamp.
**Warning signs:** Duplicate or out-of-order status updates on server.

### Pitfall 3: IndexedDB Transaction Lifetime
**What goes wrong:** Transaction auto-closes if microtask queue runs other async work between operations.
**Why it happens:** IndexedDB transactions auto-commit when no pending requests exist on the event loop tick.
**How to avoid:** Complete all reads/writes in a single synchronous chain within one transaction. Don't `await` unrelated work between IndexedDB operations.
**Warning signs:** "TransactionInactiveError" in console.

### Pitfall 4: Optimistic UI Without Rollback
**What goes wrong:** UI shows "Delivered" but sync permanently fails. Driver moves on thinking delivery succeeded. No rollback to show the real state.
**Why it happens:** Optimistic update applied but failure handler doesn't revert.
**How to avoid:** Store pre-optimistic state. On permanent failure, revert to stored state and surface error banner on the specific stop.
**Warning signs:** UI shows "Delivered" but server shows "arrived"; admin sees stale data.

### Pitfall 5: Banner Z-Index Conflict
**What goes wrong:** New offline banner overlaps or is hidden by existing `DriverLayout` header (`z-20`) or the existing `OfflineBanner` (`z-[80]`).
**Why it happens:** Multiple banner components fighting for the same position.
**How to avoid:** Remove old `OfflineBanner.tsx` entirely. New banner replaces it. Use `z-[80]` (same slot). Ensure `DriverShell` only mounts one banner.
**Warning signs:** Banners overlapping; header content hidden; content pushed down twice.

### Pitfall 6: Service Worker Scope Mismatch
**What goes wrong:** Service worker registered with `scope: "/driver"` may not intercept requests to `/api/driver/...` routes.
**Why it happens:** SW scope only affects page navigation, not fetch requests from pages within scope.
**How to avoid:** Client-side sync (which this phase uses) doesn't depend on SW fetch interception. The SW is only used for cache and the existing `SYNC_REQUESTED` message. Keep client-side retry logic.
**Warning signs:** SW events not firing for API calls.

## Code Examples

### Existing Queue Entry Point (to be wired into UI)
```typescript
// Source: src/lib/hooks/useOfflineSync.ts (existing, unused by UI)
const queueStatusUpdate = useCallback(
  async (routeId, stopId, status, deliveryNotes?) => {
    await pendingStatus.add(routeId, stopId, status, deliveryNotes);
    await updatePendingCounts();
  },
  [updatePendingCounts]
);
```

### Existing Server Validation (constrains retry behavior)
```typescript
// Source: src/lib/validations/driver-api.ts
export const VALID_STOP_TRANSITIONS: Record<string, string[]> = {
  pending: ["enroute", "skipped"],
  enroute: ["arrived", "skipped"],
  arrived: ["delivered", "skipped"],
  delivered: [], // Terminal state
  skipped: [],   // Terminal state
};
```

### Banner Animation Pattern (matches locked decision)
```typescript
// Source: Codebase pattern from framer-motion usage
<AnimatePresence>
  {showBanner && (
    <m.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed inset-x-0 top-0 z-[80]"
    >
      {/* Banner content */}
    </m.div>
  )}
</AnimatePresence>
```

### Idempotency Key Header Pattern
```typescript
// Source: IETF draft-ietf-httpapi-idempotency-key-header + Stripe pattern
const response = await fetch(url, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': item.idempotencyKey, // UUID stored with queued item
  },
  body: JSON.stringify(payload),
});
```

## Codebase Inventory: Files to Modify

| File | Action | Reason |
|------|--------|--------|
| `src/lib/stores/driver-store.ts` | Remove `pendingActions`, `addPendingAction`, `removePendingAction`, `clearPendingActions` | Consolidate to IndexedDB queue |
| `src/lib/stores/__tests__/driver-store.test.ts` | Remove pending action tests | Matches store changes |
| `src/lib/services/offline-store/db.ts` | Add `idempotency_key` field to `PendingStatusUpdate` | Idempotency support |
| `src/lib/services/offline-store/stores.ts` | Add idempotency key to `pendingStatus.add()` | Generate UUID at queue time |
| `src/lib/services/offline-store/sync.ts` | Add exponential backoff, idempotency headers, 4xx/5xx handling, expiry purge | Core retry logic |
| `src/lib/hooks/useOfflineSync.ts` | Add backoff state, background timer, drain detection, expiry cleanup on mount | Orchestrate sync lifecycle |
| `src/components/ui/driver/OfflineBanner.tsx` | Redesign: amber color, slide animation, queue count, syncing/synced states | Per locked UX decisions |
| `src/components/ui/driver/DeliveryActions.tsx` | Wrap `updateStatus()` in offline-aware dispatch | Queue when offline |
| `src/components/ui/driver/ExceptionModal.tsx` | Wrap `handleSubmit()` in offline-aware dispatch | Queue when offline |
| `src/components/ui/driver/StopDetailView.tsx` | Wrap `handlePhotoUpload()` in offline-aware dispatch | Queue when offline |
| `src/components/ui/driver/DriverShell.tsx` | Ensure only one banner mounts; pass sync state | Banner consolidation |
| `src/components/ui/layout/DriverLayout.tsx` | Remove inline offline indicator (replaced by OfflineBanner) | Avoid duplicate banners |
| `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` | Add `Idempotency-Key` header processing | Server-side duplicate detection |
| `src/app/api/driver/routes/[routeId]/stops/[stopId]/exception/route.ts` | Add `Idempotency-Key` header processing | Server-side duplicate detection |

**New files (if needed):**

| File | Purpose |
|------|---------|
| `src/lib/services/offline-store/retry.ts` | Exponential backoff retry logic (extracted from sync.ts if >50 lines) |
| `src/lib/hooks/useConnectivity.ts` | Shared connectivity hook (if needed to deduplicate online/offline listeners) |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Background Sync API | Client-side retry loops | 2024-2025 | Safari still doesn't support Background Sync; client-side is more portable |
| localStorage for queues | IndexedDB for queues | 2023+ | localStorage is sync/blocking, 5MB cap, can't store Blobs |
| navigator.onLine only | onLine + fetch error detection | Always | onLine is unreliable; combine with actual fetch failures |
| Zustand persist for offline queue | Zustand for UI state, IndexedDB for queue | Current best practice | Separation of concerns; IndexedDB better suited for async queue operations |

**Deprecated/outdated:**
- Service Worker Background Sync: Still not supported in Safari (as of Feb 2026). Chromium-only. Use client-side retry instead.
- localStorage for offline queues: Blocking, size-limited, can't handle Blobs. Use IndexedDB.

## Open Questions

1. **Server-side idempotency storage**
   - What we know: Need to store (idempotency_key, response) pairs to detect duplicates
   - What's unclear: Whether to use a Supabase table or in-memory cache (route handlers are serverless on Vercel)
   - Recommendation: Use a Supabase table `idempotency_keys` with columns `(key, endpoint, response_status, response_body, created_at)`. Add a cron job or Supabase function to purge entries older than 24 hours. Serverless functions can't use in-memory caches reliably.

2. **Photo queue with Blobs and exponential backoff**
   - What we know: Photos are stored as Blobs in IndexedDB `pending-photos` store; uploaded via FormData
   - What's unclear: Whether large photo uploads should have different backoff timing than small JSON status updates
   - Recommendation: Use same backoff timing. Photos are typically <2MB. If upload timeout is a concern, add a fetch timeout of 30 seconds for photos vs 10 seconds for status updates.

3. **Route completion while items are queued**
   - What we know: `ActiveRouteView` has a "Complete Route" button that POSTs to `/api/driver/routes/${routeId}/complete`
   - What's unclear: Should route completion be blocked if there are pending queue items for that route?
   - Recommendation: Block route completion if pending items exist for that route. Show message: "Sync pending actions before completing route." This prevents the server from completing a route with missing delivery records.

## Sources

### Primary (HIGH confidence)
- Zustand v5.0.8 persist middleware docs (Context7 /pmndrs/zustand) -- partialize, custom storage, IndexedDB integration
- Codebase analysis: `src/lib/stores/driver-store.ts`, `src/lib/services/offline-store/`, `src/lib/hooks/useOfflineSync.ts`, `src/components/ui/driver/DeliveryActions.tsx`
- MDN navigator.onLine docs -- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine

### Secondary (MEDIUM confidence)
- IETF Idempotency-Key header draft -- https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/
- Stripe idempotent requests docs -- https://docs.stripe.com/api/idempotent_requests
- Uppy GitHub issue on navigator.onLine reliability -- https://github.com/transloadit/uppy/issues/1658

### Tertiary (LOW confidence)
- LogRocket offline-first frontend apps 2025 -- https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/
- MDN PWA offline guide -- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in codebase, no new deps
- Architecture: HIGH -- clear pattern from existing code analysis; dual queue well understood
- Pitfalls: HIGH -- based on codebase-specific patterns (existing ERROR_HISTORY, scroll lock issues, timer cleanup)
- Idempotency: MEDIUM -- server-side storage strategy needs validation during implementation

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days -- stable domain, no fast-moving deps)
