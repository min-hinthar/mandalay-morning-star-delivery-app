# Phase 92: Customer UX - Discovery & Shopping - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Customers can efficiently find, filter, and purchase items with a polished mobile shopping experience. Persistent search, dietary filters, sold-out sorting, modifier scroll indicator, Saturday hero banner, min order warning, sticky checkout footer, auto-select delivery date, cart sync status, offline banner, and dynamic gate polling. Requirements: CUX-01 through CUX-10, CUX-20.

Audit notes: CUX-05 (hero) and CUX-10 (offline banner) may overlap with v1.9/v1.6 implementations — enhance rather than rebuild.

</domain>

<decisions>
## Implementation Decisions

### Search & filter layout (CUX-01, CUX-02, CUX-03)
- Collapsible header on scroll: full search bar + dietary chips visible at top of page, collapses to compact form when scrolling down, expands again on scroll-up
- Uses existing `useScrollDirection` hook for collapse/expand behavior
- Dietary filter chips: all 6 options from DietaryChipPicker (Vegetarian, Vegan, Gluten-free, Nut allergy, Dairy-free, Halal) in a horizontally scrollable chip row
- Sold-out items: greyed out / desaturated cards with "Sold Out" badge overlay, sorted to bottom of each category
- Sold-out items are still tappable — open item detail sheet in view-only mode with disabled "Add to Cart" replaced by "Sold Out" state
- Search + filters use AND logic: typing text with active dietary chips combines both conditions (e.g., "chicken" + Gluten-Free = only gluten-free chicken items)

### Cart status indicators (CUX-06, CUX-09, CUX-10)
- Sync status: subtle text in cart drawer header — "Saved" with checkmark or "Saving..." next to cart title, disappears after 2 seconds (Google Docs auto-save style)
- Offline banner: fixed amber top banner — "You're offline — browsing cached menu. Some items may be unavailable." Dismissible. Auto-hides on reconnect with "Back online!" toast
- Minimum order warning: displayed in CartBar sticky footer — warning text above checkout button when below minimum ("$X.XX more to reach $25 minimum"), checkout button disabled

### Modifier scroll indicator (CUX-04)
- Claude's Discretion: pick scroll indicator approach based on existing patterns (TimeSlotPicker has scroll button logic, fade gradient is common in DoorDash/Uber Eats)

### Saturday hero & date auto-select (CUX-05, CUX-08)
- Hero enhancement: add explicit "Next delivery: Saturday, March 7" text with "Order by Friday 3 PM" cutoff info to existing Hero component. Enhance, don't rebuild
- Delivery date auto-select: first available Saturday is pre-selected but user still sees the date picker. Can change if multiple dates become available in the future
- Keep existing checkout step structure (don't skip date step)

### Sticky checkout footer (CUX-07)
- CartBar already exists as sticky mobile footer with checkout button, free delivery progress, item count badge, and iOS safe area support
- Verify/enhance existing implementation — likely minimal work needed

### Dynamic gate polling (CUX-20)
- 10-second polling interval applies everywhere useDeliveryGate is used (homepage hero, menu, cart, checkout) during the final 30 minutes before cutoff
- Consistent behavior across all pages, not page-specific

### Claude's Discretion
- Modifier scroll indicator design (fade gradient, scroll arrows, or hybrid)
- Exact collapse animation for compact header mode
- Search input styling in compact vs expanded state
- CartBar min-order warning layout details
- Offline banner animation/transition style

</decisions>

<specifics>
## Specific Ideas

- Collapsible header should feel smooth — DoorDash-style where search and chips condense on scroll but remain accessible
- Google Docs-style auto-save indicator for cart sync — minimal and unobtrusive
- Sold-out items greyed out but still browsable (view-only detail sheet) so customers know what's normally available
- AND filter logic is most intuitive for meal discovery — "show me gluten-free chicken dishes"

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SearchInput.tsx` (305 lines): has `mobileCollapsible` prop, expand animation variants — needs always-visible mode
- `DietaryChipPicker.tsx` (64 lines): toggle chips with Framer Motion animations, emoji labels — migrate from account settings to menu context
- `DIETARY_OPTIONS` / `DIETARY_EMOJIS` in `settings-types.ts`: all 6 dietary option definitions
- `CheckoutGate.tsx` (139 lines): min order warning with `minimumShortfallCents` prop, amber-to-red gradient
- `CartBar.tsx` (309 lines): fixed bottom bar with slide-up animation, free delivery progress, iOS safe area
- `Hero.tsx` (173 lines): dynamic hero with business rule params (cutoffDay, cutoffHour, deliveryFee)
- `TimeSlotPicker/` components: date pills, time slot pills, scroll button logic
- `useDeliveryGate.ts` (97 lines): 60s polling, `computeDeliveryGate()` with urgency levels
- `useCustomerOfflineSync.ts` (74 lines): online/offline detection with 3-second timer
- `useScrollDirection` hook: scroll-based visibility toggling
- `ModifierGroup.tsx` (148 lines): RadioGroup/Checkbox modifier list — needs scroll overflow indicator
- `MenuGrid.tsx` / `MenuContent.tsx`: menu item grid — needs sold-out sorting logic
- `cart-store.ts` (324 lines): has `pendingSync` flag on CartItem, online listener, reconnect toast

### Established Patterns
- Framer Motion for component animations (spring tokens, stagger patterns)
- `useAnimationPreference` for reduced motion support
- Fuse.js for fuzzy search (existing search implementation)
- Zustand + idb-keyval for cart state persistence
- `getBusinessRules()` for configurable business params
- Design token enforcement (no hardcoded colors/spacing/z-index)

### Integration Points
- MenuHeader: add always-visible search + dietary chips
- MenuContent/MenuGrid: add dietary filter state + sold-out sorting
- CartBar: add min order warning inline
- CartDrawer header: add sync status indicator
- Hero/HeroContent: add next Saturday date + cutoff text
- TimeSlotPicker: auto-select first Saturday
- useDeliveryGate: conditional 10s polling in final 30 minutes
- New component: customer offline banner (pattern from SimpleOfflineOverlay)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 92-customer-ux-discovery-shopping*
*Context gathered: 2026-03-03*
