# Phase 38: Customer Offline Support - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Customers can browse menu and see cached content when offline — service worker caching with offline indicators and stale content awareness. Cart operations work offline, checkout blocked until online. Admin pages show offline status but don't support offline workflows.

</domain>

<decisions>
## Implementation Decisions

### Offline Indicator

- Fixed banner at top of viewport, pushes content down
- Shown on all pages including admin
- Subtle amber warning style with warning icon
- No action buttons, info only
- Slide down/up animation
- On reconnection: shows "Back online" for 3 seconds then auto-dismisses

### Cart Behavior While Offline

- Cart operations (add/remove items) work offline
- Checkout button disabled with tooltip explaining need for connection
- No blocking modals, just disabled state with explanation

### Stale Content Display

- Subtle amber badge matching offline banner style
- Position: above menu grid (single badge, not per-item)
- Relative timestamp format: "Cached 2 hours ago", "Cached yesterday"
- Shown only when offline (not when online with stale data)
- Applies to homepage featured sections and menu page
- Prices shown as-is, no special "may have changed" marking
- Unavailable/sold-out items shown as cached (no hiding)

### Cache Strategy

- Cache scope: menu data + menu images (full browsing experience)
- App shell (navigation, layout) cached separately
- Stale-while-revalidate: show cache first, background refresh when online
- Stale threshold: 24 hours
- Images cached on demand (as user browses), not pre-cached
- Recent order history cached for viewing (no actions)
- Maximum cache size: 50 MB
- Eviction policy: LRU (oldest items first)

### Update Prompts

- Fixed banner at bottom of viewport (separate from offline banner at top)
- Primary brand color styling (positive update message)
- Check for updates on each page load/navigation
- Auto-refresh with 5-second countdown
- Dismiss button stops countdown, banner returns on next navigation
- Text: "New version available - Refreshing in 5..."

### Claude's Discretion

- Exact animation timing and easing curves
- Cache key naming conventions
- Service worker registration timing
- Error handling for cache failures
- Fallback placeholder for uncached images

</decisions>

<specifics>
## Specific Ideas

- Offline banner and stale badge use consistent amber styling for visual connection
- Update banner uses brand primary color to feel positive/progressive
- Auto-refresh countdown gives user control while encouraging updates
- Cart works offline for better UX — users can browse and add items even without connection

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 38-customer-offline-support_
_Context gathered: 2026-02-04_
