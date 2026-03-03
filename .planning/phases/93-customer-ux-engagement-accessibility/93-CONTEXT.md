# Phase 93: Customer UX - Engagement & Accessibility - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Post-purchase engagement features (one-tap reorder, rating prompt, order sharing) and accessibility hardening across all interactive elements (focus rings, keyboard cart delete, drawer aria-labels, form error linking, icon+color status indicators, 3D tilt keyboard fix). Requirements: CUX-11 through CUX-19.

Backend needed: CUX-12 requires `ratings` table migration, POST /api/ratings route, admin ratings view. CUX-13 requires a `share_token` column on orders and a public share page.

</domain>

<decisions>
## Implementation Decisions

### Reorder flow (CUX-11)
- Reorder button on BOTH order list cards (OrderCard) AND order detail page (/orders/[id])
- When cart has items: replace cart with confirmation dialog — "Replace X items in cart with order #Y?"
- Unavailable items (sold out / removed): skip them, add available items, show toast — "2 of 5 items unavailable — added 3 to cart"
- After reorder completes: open cart drawer showing the reordered items for review
- Reorder fetches order_items from Supabase and calls addItem() for each available item

### Rating prompt (CUX-12)
- Rating prompt appears as a dismissible banner at top of /orders/[id] page after order status = "delivered"
- Tapping the banner navigates to existing /orders/[id]/feedback page (DeliveryFeedbackForm)
- Banner persists until user rates OR explicitly dismisses (dismissed state stored in DB — `rating_dismissed` boolean on orders or ratings table)
- Admin view: simple ratings list page — order #, customer name, stars, text feedback, date. Sortable by date/stars
- Ratings show customer identity (name visible to admin) — useful for family business follow-up
- Existing DeliveryFeedbackForm + StarRating components are reused as-is

### Order sharing (CUX-13)
- Share/copy button on order detail page header (/orders/[id]) — icon button next to back navigation
- Shared content: URL only — `{origin}/orders/{shareToken}/share`
- Shared page shows order summary: item names, quantities, total — NO customer name, address, or payment details
- Fully public access — no auth required. Link uses a random share_token (not order ID) so links aren't guessable
- Reuses existing ShareButton component (Web Share API + clipboard fallback)

### Status indicator icons (CUX-18)
- Match StatusStepper icon set: ShieldCheck (confirmed), ChefHat (preparing), Truck (in transit), Package (delivered), Clock (pending), XCircle (cancelled)
- Icon placement: icon before text in badge — "🛡 Confirmed" pattern
- Include refund statuses: DollarSign (refunded), AlertCircle (partial refund), Clock (refund pending)
- Apply to both admin tables AND customer views — single StatusBadge component update

### Focus rings (CUX-14)
- Add visible focus-visible ring to UnifiedMenuItemCard article element
- Follow established pattern: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none`
- Ensure AddButton and any interactive sub-elements within cards also have focus rings

### Keyboard cart delete (CUX-15)
- Add Delete key handler on CartItem — triggers removal with confirmation
- Confirmation: reuse existing pattern (not a new modal — inline or toast-based undo)
- Screen reader announcement on delete: "Item removed from cart"

### Drawer aria-labels (CUX-16)
- Add aria-label to ItemDetailSheet Drawer/Modal (e.g., "Item details for {itemName}")
- Audit all drawer/modal instances for descriptive aria-labels
- Pattern already correct in CartDrawer ("Your Cart") and base Drawer component

### Form error linking (CUX-17)
- Add aria-invalid="true" to ValidatedInput when errors are present (currently missing)
- Audit modifier group forms in ItemDetailSheet for aria-describedby linkage
- Existing ValidatedInput pattern (errorId, helperId, describedBy) is the standard — extend to all forms

### 3D tilt on keyboard focus (CUX-19)
- Disable tilt effect when card receives keyboard focus (Tab navigation)
- Add onFocus handler that does NOT trigger tilt (currently only mouse/touch activates tilt)
- Focus ring must remain visible — tilt transform should not obscure outline
- useAnimationPreference already gates tilt globally for reduced-motion users

### Claude's Discretion
- Confirmation dialog design for cart replacement (modal vs inline)
- Rating banner visual design and animation
- Share page layout and styling
- Exact keyboard navigation pattern for cart items (arrow keys optional)
- Which modifier forms need aria-describedby audit (scope based on code review)

</decisions>

<specifics>
## Specific Ideas

- Reorder should feel instant — one tap, cart drawer opens with items. DoorDash/Uber Eats "order again" pattern
- Rating banner should be non-intrusive — more like a gentle nudge than a popup
- Share link uses random token for security — order IDs should not be in the URL
- Status icons reuse the same Lucide icons from StatusStepper for visual consistency across tracking and badges

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `OrderCard.tsx`: order list card — add reorder button here
- `OrderListAnimated.tsx`: scroll-reveal animation wrapper for order list
- `/orders/[id]/page.tsx`: order detail — add reorder button + share button
- `DeliveryFeedbackForm.tsx`: complete 1-5 star rating form with haptic feedback
- `StarRating.tsx`: accessible radiogroup with spring animations
- `ShareButton.tsx`: Web Share API + clipboard fallback — reuse for CUX-13
- `StatusStepper.tsx`: already has icon mapping (ShieldCheck, ChefHat, Truck, Package)
- `StatusBadge.tsx`: color-only badge — needs icon addition
- `cart-store.ts`: addItem(), removeItem(), clearCart() — core of reorder logic
- `UnifiedMenuItemCard/useTiltEffect.ts`: tilt hook — needs keyboard focus guard
- `ValidatedInput.tsx`: aria-describedby pattern — extend with aria-invalid
- `Drawer.tsx`: focus trap + aria-label from title prop
- `CartItem.tsx`: swipe-to-delete + trash button — add keyboard Delete handler

### Established Patterns
- `focus-visible:ring-2 ring-{color} ring-offset-2` for focus rings (234 instances across 123 files)
- Framer Motion spring animations for all interactive transitions
- Haptic feedback (30-50ms vibrate) on taps
- Design token enforcement — no hardcoded colors/spacing
- `useAnimationPreference` for reduced motion support
- Toast notifications for user feedback (sonner)
- Supabase RPC/REST for data operations with RLS

### Integration Points
- OrderCard: add reorder button (new prop or child component)
- Order detail page header: add share button + reorder button
- Order detail page: add rating banner (conditional on delivered + not rated/dismissed)
- StatusBadge: add icon prop and icon mapping (single component change)
- CartItem: add onKeyDown handler for Delete key
- UnifiedMenuItemCard: add onFocus/onBlur handlers, add focus-visible classes
- ItemDetailSheet: pass aria-label to Drawer/Modal
- ValidatedInput: add aria-invalid attribute
- New: /api/orders/[id]/rating POST endpoint
- New: /orders/[shareToken]/share public page
- New: ratings table migration + share_token column on orders
- New: /admin/ratings page for admin view

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 93-customer-ux-engagement-accessibility*
*Context gathered: 2026-03-03*
