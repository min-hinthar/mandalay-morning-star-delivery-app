# Phase 56: Driver Offline Sync - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Driver status updates never get lost — pending actions queue locally and retry automatically when connectivity returns. Consolidates the existing dual-queue architecture (Zustand localStorage + IndexedDB) into a single queue. Idempotency keys prevent duplicate status updates during sync retry.

</domain>

<decisions>
## Implementation Decisions

### Queue architecture

- Persist queue across app restarts with a **2-hour expiry** — entries older than 2 hours auto-discard on load
- **Claude's Discretion:** Which queue to keep (Zustand vs IndexedDB) — researcher should analyze both implementations and recommend
- **Claude's Discretion:** Whether to migrate existing data from the removed queue or start fresh
- **Claude's Discretion:** Queue size cap (if any) — evaluate realistic action volume per delivery route
- **Claude's Discretion:** FIFO vs parallel processing — evaluate based on status update semantics
- **Claude's Discretion:** Connectivity detection strategy (navigator.onLine, health ping, or both)

### Retry behavior

- **No jitter** on backoff delays — small driver fleet, thundering herd not a concern
- **Claude's Discretion:** Backoff timing intervals — pick appropriate timing for delivery status updates
- **Claude's Discretion:** Max retry attempts before giving up
- **Claude's Discretion:** What happens after max retries (manual retry vs mark-failed-and-continue)
- **Claude's Discretion:** Whether retries trigger only on reconnect or also on a background timer
- **Claude's Discretion:** Whether different action types have different retry priorities
- **Claude's Discretion:** Success feedback when queue drains (per-item toast vs summary vs silent)
- **Claude's Discretion:** Retry logging approach (server-persisted audit trail vs client-only)

### Offline UX feedback

- **Persistent banner** when offline — fixed bar visible at all times while disconnected
- Banner shows **pending queue count** (e.g., "Offline — 2 actions pending")
- **Warning amber/yellow** color for the offline banner
- **Animated slide in/out** — banner slides in when going offline, slides out when reconnecting
- "Back online" banner **auto-dismisses after sync completes** — shows "Syncing..." then "All synced!" before sliding away
- **Claude's Discretion:** Offline action feedback (optimistic update + queued badge vs explicit queued state)
- **Claude's Discretion:** Banner position (top vs bottom of screen)
- **Claude's Discretion:** Failed sync item indicator granularity

### Conflict resolution

- **Claude's Discretion:** Server behavior when receiving stale updates (silent reject vs notify driver)
- **Claude's Discretion:** Status transition enforcement (strict ordering vs last-write-wins)
- **Claude's Discretion:** Idempotency key strategy (client UUID vs composite natural key)
- **Claude's Discretion:** Retry vs permanent fail on 4xx client errors
- **Claude's Discretion:** Data refresh timing on reconnect (immediate vs after queue drain)
- **Claude's Discretion:** Duplicate detection key expiry (time-bounded vs permanent)

</decisions>

<specifics>
## Specific Ideas

- Roadmap notes this is the "highest-risk feature" — dual-queue architecture must be consolidated to one
- ~50 lines of core logic but touches critical driver delivery flow
- Existing Zustand localStorage and IndexedDB queues both exist — one must go

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 56-driver-offline-sync_
_Context gathered: 2026-02-11_
