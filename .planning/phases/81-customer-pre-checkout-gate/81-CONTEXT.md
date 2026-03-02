# Phase 81: Customer Pre-Checkout Gate - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Customers always know when the next delivery is, whether they can still order, and what happens if they cannot. This phase adds delivery schedule awareness and cutoff enforcement across all customer-facing pages: homepage hero, menu, cart drawer, checkout, order tracking, and empty states.

</domain>

<decisions>
## Implementation Decisions

### Hero CTA states (GATE-01)
- CTA button text changes dynamically: "Order Now" when ordering is open, "Pre-Order for [Saturday date]" when closed
- Both states link to /menu
- Live countdown timer near the CTA when ordering is open: "Order within 2h 34m"
- When closed: show "Orders open [Day]" instead of countdown
- Urgency color shift: countdown turns amber when under 2 hours, red when under 30 minutes
- Existing stat bar item ("Order by Friday 3:00 PM") updates to "Orders closed — next Saturday [date]" when past cutoff

### Menu delivery banner (GATE-02)
- Slim persistent bar below the sticky MenuHeader (similar pattern to admin OpsCountdownBar)
- Shows delivery date + live countdown when open: "Delivering Saturday, March 7 — Order within 2h 34m"
- When closed: "Next delivery: Saturday, March 14"
- Same urgency color shift as hero (amber <2h, red <30m)

### Cart delivery info (GATE-03)
- Cart drawer shows delivery date + live countdown
- When ordering is closed: checkout button is disabled/grayed out with text "Checkout opens [Day] at [Time]"
- Users can still add/remove cart items when ordering is closed (cart acts as a wishlist)
- Cart items are preserved across open/closed transitions

### Past-cutoff checkout modal (GATE-04)
- Warm and helpful tone: "We're preparing this week's deliveries! Your next chance to order is for Saturday, [date]."
- Two actions: "Got it" (dismiss) and "Browse Menu" (navigate to /menu)
- Cart items are preserved — not cleared
- Gate triggers at two points:
  1. Checkout page load — modal shown immediately if past cutoff
  2. Server-side validation at payment submit — catches cutoff passing during session
- Client-side timer detects cutoff passing mid-checkout and shows modal immediately (don't let user waste time on a form that won't submit)

### Empty states with Saturday context (GATE-05)
- Existing empty states (empty cart, no orders, etc.) get a line about the Saturday delivery schedule
- Pattern: "We deliver every Saturday — order by [Day] [Time]."
- Use dynamic business rules values (not hardcoded)

### Order tracking freshness (GATE-06)
- Polling indicator and "last updated X ago" timestamp on tracking page
- Auto-refresh via existing useTrackingSubscription infrastructure

### Claude's Discretion
- Tracking page: placement of "last updated" timestamp and polling indicator style
- Tracking page: whether to include manual refresh option alongside auto-polling
- Empty state: exact wording and placement per component
- Loading skeleton design for countdown components
- Exact countdown format (hh:mm vs "2 hours, 34 minutes" vs "2h 34m")

</decisions>

<specifics>
## Specific Ideas

- Menu page should show a persistent banner when ordering is closed: "You're pre-ordering for [Saturday]. Orders open [Day] at [Time]."
- Countdown urgency mirrors a "last call" pattern — warm amber then red as time runs out
- Cart becomes a wishlist when ordering is closed — items stay, checkout is disabled
- Past-cutoff modal should feel reassuring, not apologetic — focus on the next opportunity
- Tracking page already imports RefreshCw icon — could be reused for polling indicator

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `delivery-dates.ts`: Full utility suite — `getNextSaturday`, `isPastCutoff`, `getTimeUntilCutoff`, `getDeliveryDate`, `getCutoffForSaturday`
- `getBusinessRules()` (`lib/settings/business-rules.ts`): Cached reader for cutoff day/hour, delivery fees from `app_settings` table
- `OpsCountdownBar` (`components/ui/admin/ops/OpsCountdownBar.tsx`): Admin countdown bar pattern — reusable concept for menu banner
- `useTrackingSubscription` / `useLastUpdateDisplay` hooks: Already handle real-time tracking data and "last updated" calculation
- `useMediaQuery`, `useAnimationPreference`: Existing hooks for responsive and motion-safe behavior

### Established Patterns
- Hero already receives `cutoffDay`, `cutoffHour`, `deliveryFeeCents`, `freeDeliveryThresholdCents` as server props — extend with open/closed state
- `TimeSlotPicker` / `DatePill` already handle cutoff-passed styling — reuse color/state patterns
- Cart drawer uses `CartFooter` for checkout button — add delivery info and disabled state there
- Drawer component supports both mobile (bottom sheet) and desktop (right slide) — delivery info must work in both

### Integration Points
- Homepage `page.tsx`: Already calls `getBusinessRules()` and passes to Hero — add delivery state computation
- `MenuHeader.tsx`: Add delivery banner below (new component, sticky positioning)
- `CartDrawer.tsx` / `CartDrawerParts.tsx`: Add delivery date + countdown to CartFooter or CartHeader
- `CheckoutClient.tsx`: Add cutoff check on mount and client-side timer
- `checkout/session/route.ts`: Add server-side cutoff validation before creating payment
- `TrackingPageClient.tsx`: Surface `useLastUpdateDisplay` in UI, add polling indicator

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 81-customer-pre-checkout-gate*
*Context gathered: 2026-03-01*
