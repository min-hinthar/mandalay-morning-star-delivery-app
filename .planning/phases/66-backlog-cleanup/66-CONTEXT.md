# Phase 66: Backlog Cleanup - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve outstanding feature gaps and tech debt: cart modifier editing, driver tracking fix + full tracking page enhancement, UnifiedMenuItemCard refactor, dead code/dependency audit, and Edge Function removal. Language preference (SETT-04) removed from scope.

</domain>

<decisions>
## Implementation Decisions

### Cart Modifier Editing

- Open ItemDetailSheet for editing existing cart items (same sheet as adding)
- Pre-populated with current modifier selections and quantity
- Full edit: modifiers AND quantity changeable in the same sheet
- CTA button says "Update Cart" (distinct from "Add to Cart")
- Edit trigger: always-visible pencil icon on each cart item row
- Only items with modifier options show the edit icon; quantity-only items use cart page controls
- Each cart entry is independent — editing one doesn't affect duplicates of the same menu item
- "Cart updated" toast confirmation after saving
- Confirm discard if user changed something and tries to close without saving
- If menu item is unavailable (sold out), sheet opens in "unavailable" state — user can only remove, not update

### Claude's Discretion (Cart)

- Zero-quantity behavior (remove item or minimum 1)
- Live price update vs price on save
- Animation style for sheet open/close
- Sub-component test coverage strategy

### Driver Tracking — Bug Fix + Full Enhancement

- Fix route_id extraction from routeStop data (original bug)
- Google Maps integration with custom pin icons (restaurant, vehicle, destination)
- Route line between driver and destination, dynamic update as driver progresses (completed portion changes color)
- Driver marker smooth-slides from old to new position
- Auto-fit zoom showing both driver and destination pins
- Free pan/zoom + re-center button for user exploration
- Split view layout: map top 50%, status/info bottom 50%
- Driver name + profile photo shown once assigned/en route
- Call driver button (tap to call)
- Full item list visible in info section (not collapsed)

### Tracking — Status Display

- Horizontal stepper at top: Confirmed → Preparing → Out for Delivery → Delivered (active step highlighted)
- Vertical timeline below stepper with timestamps and detailed history
- Status stepper dots fill with animation, timeline entries slide in
- aria-live region for screen reader announcements on status changes
- Browser tab title updates with live status: "Preparing... | Morning Star" → "Out for Delivery | Morning Star"

### Tracking — ETA & Location

- ETA display (format at Claude's discretion based on available data)
- Off-route handling: subtle ETA recalculation only (no explicit "off-route" alert to customer)
- Stale location (>2 min no update): faded driver pin + "Last updated X min ago" timestamp
- Offline: show last cached driver position with "Last updated" label

### Tracking — Pre-Delivery & Post-Delivery States

- Pre-delivery (preparing): map shows restaurant pin, switches to driver tracking once en route
- Delivered: auto-transition to "Delivered!" confirmation screen with celebration animation (confetti/animated checkmark)
- Star rating (1-5) on delivered screen — optional, quick tap
- Rating stored in orders table, visible to both driver and admin
- Post-delivery: tracking page accessible from order history as read-only view (delivered status, map with final route, rating if given)

### Tracking — Cancellation

- Order cancelled during transit: cancelled overlay on map (stays visible) with reason and next steps

### Tracking — Notifications

- Push notification + in-app banner when driver is nearby (~2 min away)
- Push notification tone: warm and friendly ("Your delicious meal is on its way!")
- Sound + haptic feedback for status transitions

### Tracking — Sharing & Access

- Share button on tracking page (native share sheet or copy link)
- Shared link viewable by any authenticated user (doesn't have to be order owner)
- One tracking page per order (multiple active orders each have their own page)

### Tracking — Delivery Notes

- Delivery instructions visible and editable on tracking page
- Editable at any time before order is marked delivered

### Tracking — Loading & Errors

- Map placeholder (grey rectangle) + skeleton lines for status info as loading state
- Map load failure: error banner with "Retry" button, status info still visible below

### Tracking — Testing

- Supabase test seeds for manual QA with real real-time subscriptions

### Claude's Discretion (Tracking)

- ETA format (countdown vs time window)
- Update frequency (WebSocket vs polling)
- URL structure (/orders/[id]/tracking vs /tracking/[id])
- Tablet/landscape responsive layout
- Google Maps dark mode variant
- Google Maps JS lazy loading strategy
- Performance budget handling for Maps bundle

### UnifiedMenuItemCard Refactor

- Split into sub-modules to get under 400 lines
- Barrel export pattern (consuming files' imports don't change)

### Claude's Discretion (Card Refactor)

- Split strategy (by visual sections vs by responsibility)
- Sub-component naming convention
- Reusability of extracted components
- Whether to simplify public props API
- Whether to apply minor visual polish during refactor
- Test coverage for extracted sub-components
- Import path approach (barrel vs deep imports)

### Dead Code & Dependency Audit

- Remove dead `send-order-confirmation` Edge Function
- Full audit: unused exports/functions, deprecated patterns, unused npm deps, unused CSS classes
- Scan for legacy API routes with zero frontend references
- Console.log cleanup (Claude distinguishes debug from intentional)
- CSS dead code scan (Claude determines safe removals)
- Unused TypeScript types removal (Claude's judgment)
- Unused npm dependencies: Claude decides production vs dev (judgment-based)
- Environment variables: flag unused ones for user review (don't delete)

### Claude's Discretion (Dead Code)

- Confidence threshold for removal vs flagging
- Which console statements are intentional vs debug
- Which CSS tokens are safe to remove
- Which TypeScript types serve as documentation vs are truly dead
- Legacy API route removal criteria

</decisions>

<specifics>
## Specific Ideas

- Cart edit flow should feel like a natural extension of the existing ItemDetailSheet — same sheet, same interactions, just pre-populated
- Tracking page should feel like a premium delivery experience (Uber Eats/DoorDash level)
- Custom map pin icons for restaurant, vehicle, and destination (branded, not default markers)
- Celebration animation on delivery (confetti or animated checkmark) — the app values feeling "delightfully alive with motion"
- Push notifications warm and friendly tone matching the brand
- Driver tracking is the biggest scope expansion — essentially a full tracking feature build

</specifics>

<deferred>
## Deferred Ideas

- Language preference selector (SETT-04) — removed from Phase 66 scope entirely, for a future milestone
- Apple Sign-in integration — previously deferred from Phase 62

</deferred>

---

_Phase: 66-backlog-cleanup_
_Context gathered: 2026-02-15_
