# Phase 52: Cart Validation & Cart Page - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Cart reflects reality — stale items are flagged, prices are current, and the cart page is fully functional. Covers sold-out/unavailable item indicators, price change warnings, full cart page at /cart, and hydration-safe validation. Does not cover customization/add-on changes, delivery instructions, dietary cards, promo codes, or real-time menu subscriptions on the cart page.

</domain>

<decisions>
## Implementation Decisions

### Stale Item UX

- Sold-out items: gray overlay + "Sold Out" badge — clear and unmissable
- Unavailable items (removed from menu): gray overlay + red badge — different color from sold-out (amber) to distinguish severity
- Problem items float to top in a dedicated "Items needing attention" section
- Section header uses direct/urgent tone: "2 items unavailable" — factual, to the point
- No bulk "Remove all" action — user resolves each item individually
- Attention section animates collapse when last issue is resolved
- Inline suggestions: 3 items from same category with thumbnail + name + price
- Tapping a suggestion auto-replaces the sold-out item instantly (no confirmation, no undo)
- Replacement carries over the original item's quantity
- Both sold-out and unavailable items get the same inline suggestions treatment

### Cart Page Layout

- Two-column layout on desktop: items left, order summary right; collapses to single column on mobile
- Mini card style for cart items: thumbnail on top/left, details right, stepper below — more visual than compact rows
- Items grouped by category under category headers (Soups, Rice, etc.)
- Show customizations/add-ons below item name in smaller text
- Title shows item count: "Your Cart (5 items)"
- "Continue Shopping" back link at top + "+ Add more items" button below items list
- "Clear Cart" button exists already — use existing implementation
- Item removal: slide out left animation
- Mobile: checkout button + total below summary (not sticky)
- Tapping a cart item opens bottom sheet modal for editing (quantity, customizations)
- Swipe left to delete on mobile — reveals red area with trash icon
- Order summary: subtotal, delivery fee, estimated tax, total (full itemized breakdown)
- Delivery instructions, dietary card, promo codes, delivery ETA — checkout only, not on cart page

### Checkout Gate

- Checkout button disabled when stale/sold-out items exist OR minimum order not met
- Warning banner above checkout button (not inside button text)
- Banner is tappable — smooth-scrolls to attention section at top
- Combined message when multiple blockers: "2 items need attention · $5 below minimum"
- Checkout button pulses from disabled gray to active green when all issues are cleared
- Minimum order shortfall shown in order summary section (not a separate banner)
- Minimum order blocks checkout (not info-only)

### Validation Timing

- Validation runs on cart page/drawer mount; timing details at Claude's discretion
- Cart drawer also runs validation and shows full stale UX (gray overlay, badges, remove buttons)
- Brief skeleton cards during validation — signals freshness check happening
- If validation fails (API error/network issue): silent fail, allow checkout — backend validates on order submit
- No Supabase real-time subscription for menu changes — validate on mount/checkout only
- Hydration safety: validation waits for Zustand rehydration (approach at Claude's discretion)
- Validation caching, re-entry behavior, data source (existing menu API vs dedicated endpoint): Claude's discretion
- Store open/closed check: Claude checks if handled elsewhere
- Add-to-cart validation: Claude's discretion on performance tradeoff

### Price Change Handling

- Amber "Price updated" badge on price-increased items; green "Price updated" badge on price-decreased items
- Price-changed items stay in place (don't float to attention section) — less disruptive than sold-out
- Price changes are info-only — don't block checkout
- Badge shows "Price updated" (no difference amount) — new price visible on the item
- Badge is dismissable — tap to acknowledge and remove
- Dismissing updates the persisted cart price (won't reappear on next cart open)
- Order total animates with count-up when prices change
- No separate "Price adjustments" line in summary — individual item prices update, subtotal reflects sum
- Customization/add-on availability changes: out of scope for this phase (price + item availability only)

### Claude's Discretion

- Quantity stepper style (+/- buttons vs dropdown)
- Zero-quantity removal behavior (direct remove vs confirm)
- Empty cart state design (mascot or illustration)
- Order summary sidebar sticky behavior on desktop
- Attention section collapsible vs always expanded
- Skeleton count during validation (match items vs fixed)
- Validation caching and re-entry strategy
- API data source for validation
- Store hours check placement

</decisions>

<specifics>
## Specific Ideas

- Cart badge on nav icon already exists — no work needed
- Clear Cart feature already exists — reuse existing implementation
- ConfirmDialog from Phase 50 available for Clear Cart confirmation
- Swipe-to-delete pattern: red background + trash icon (iOS/Android convention)
- Checkout button pulse animation: disabled gray → active green transition
- Category grouping mirrors menu page category organization
- Bottom sheet modal for item editing matches mobile-first interaction patterns

</specifics>

<deferred>
## Deferred Ideas

- Customization/add-on availability changes — future validation enhancement
- Real-time menu change subscriptions on cart page — overkill for current scale
- Promo/coupon code input on cart page — checkout only for now

</deferred>

---

_Phase: 52-cart-validation_
_Context gathered: 2026-02-08_
