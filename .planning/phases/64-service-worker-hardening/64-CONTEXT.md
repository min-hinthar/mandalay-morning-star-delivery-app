# Phase 64: Service Worker Hardening - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Full-scope service worker with content-hash caching, update banner, offline fallback, and cart offline queue. Expands SW coverage beyond `/driver` to all app routes with safe update behavior and branded offline experience.

</domain>

<decisions>
## Implementation Decisions

### Update Banner UX
- Bottom toast position (consistent with existing toast system)
- Keep auto-reload countdown behavior (10-second countdown)
- Countdown pauses on user interaction (typing, scrolling), resumes after idle
- Dismissible — re-shows on next navigation
- Force-reload after 3 dismissals (no more dismiss option)
- Defer banner on /cart and /checkout pages (don't interrupt order flow)
- Countdown + "Update Now" button (user can speed it up)
- Progress bar + text countdown (visual shrinking bar alongside "Reloading in 8s")
- Friendly copy: "A fresher version is ready!" + countdown
- Include version number in banner (e.g., "v1.7.2 is ready!")
- Subtle vibration on mobile when banner first appears
- Post-update: brief success toast ("Updated to latest version!")
- Same update behavior for all roles (customer, admin, driver)

### Cache Invalidation Strategy
- Content-hash per file (not build timestamp) — only changed assets re-downloaded on deploy
- Menu API cache TTL extended to 15 minutes (from 5 minutes)
- Admin pages: same caching as customer pages (admin API calls are NetworkFirst anyway)
- Silent eviction when cache quota exceeded (current ExpirationPlugin behavior)
- No "Clear Cache" button — update mechanism handles staleness
- Admin menu cache-bust mechanism: admins can force-invalidate menu cache when updating menu
- Cache hit/miss metrics reported to Sentry/analytics for TTL tuning

### Route Exclusions
- Auth callback and Sentry tunnel routes excluded from SW interception (discover exact paths from codebase)
- Claude determines which additional routes are dangerous to cache (Stripe webhooks, health endpoint, etc.)

### Offline Fallback Behavior
- Show last cached version of page when offline (with offline indicator)
- Persistent banner at top of page: "You're offline — showing cached content" (warning style, red/warning vs blue/info for update)
- When NO cached version exists: branded offline page with links to cached pages
- Offline page is precached (always available)
- Reconnection: "Back online!" toast + manual refresh (user chooses when to refresh)
- Non-queueable actions (Place Order) disabled with tooltip: "You're offline. Connect to place your order."

### Cart Offline Queue
- Cart actions (add/remove/modify) queueable while offline
- Migrate cart persistence from localStorage to IndexedDB (Zustand persist middleware)
- Offline-queued cart items show "pending sync" badge until confirmed synced
- On reconnect: brief "Cart synced!" toast
- Sync failure: error toast + keep item in cart marked as "unavailable" (user removes manually)

### Claude's Discretion
- Version number source (package.json vs git hash vs timestamp)
- Countdown reset behavior on dismiss + re-show
- Banner animation style (slide up, fade in)
- Banner visual style/color treatment
- Precache scope (app shell only vs broader public assets)
- Content-hash scope (all assets vs JS/CSS only)
- Image cache limits (current 250/30d or adjusted)
- Payment API caching exclusion approach
- Cache-bust mechanism implementation (query param vs server header)
- Cache metrics granularity level
- Background precache behavior (immediate vs on-demand)
- Cross-origin request interception policy
- Font caching strategy
- Driver route special treatment (leveraging Phase 56 offline sync)
- Auth path exclusion scope (/auth/callback only vs /auth/*)
- Health endpoint caching strategy
- Document request caching approach (bypass vs NetworkFirst)
- Pages to precache beyond /, /menu, /cart
- Offline queue implementation (Background Sync API vs custom IndexedDB)
- Push notification offline handling
- Offline page asset strategy (precache vs inline)
- Slow network detection
- Cart localStorage → IndexedDB migration approach
- Auto-retry on offline page
- Offline/update banner priority when both active

</decisions>

<specifics>
## Specific Ideas

- Current SW uses Serwist v9.5.4 with custom esbuild build script (Turbopack incompatible with @serwist/next)
- Registration already at root scope `/` in ServiceWorkerRegistration.tsx — but Phase 64 ensures ALL routes benefit
- Existing UpdatePrompt component has 5s countdown — extending to 10s with interaction pause
- Driver offline sync already built in Phase 56 — SW hardening builds on that foundation
- Cart already uses Zustand persist with localStorage — migrating to IndexedDB for better SW integration
- Offline banner (red/warning) visually distinct from update banner (info/blue) to avoid confusion

</specifics>

<deferred>
## Deferred Ideas

- Full offline mutation queue for Place Order (cart-only queue for now)
- Profile/settings offline mutations
- Push notification offline action queuing (if not handled in Phase 64)

</deferred>

---

*Phase: 64-service-worker-hardening*
*Context gathered: 2026-02-14*
