# Phase 91: Checkout & Payment Hardening - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Checkout is airtight — server-authoritative pricing, graceful conflict resolution, and revenue features (tips, promos) ready for launch. Client sends only item IDs and modifier selections; server resolves all prices. Price conflicts auto-refresh instead of erroring. Tips and promo codes integrate with Stripe. Guest cart browsing works without auth. Duplicate orders per Saturday blocked. Delivery instructions captured. Checkout events logged. Requirements: CHKT-01 through CHKT-10.

</domain>

<decisions>
## Implementation Decisions

### Tip UX (CHKT-07)
- Tip selection appears on the payment step, before the "Pay" button
- Percentage-based preset buttons: 15% / 20% / 25% / Custom
- Each button shows calculated dollar amount below it
- Custom opens a dollar input field
- 15% is pre-selected by default when user reaches payment step
- Tip amount included in Stripe charge (added to line items or metadata)

### Promo Code UX (CHKT-06)
- Collapsible input on payment step: "Have a promo code?" link expands to text input + Apply button
- Collapsed by default — doesn't distract users without codes
- Validates against Stripe Coupons API
- Discount reflected in order summary before payment

### Guest Cart Flow (CHKT-09)
- Guests browse full menu with all prices, modifiers, item details, and photos — no restrictions
- Cart stored in localStorage/IndexedDB via existing Zustand persist (no server-side cart)
- No visual indicator that user is not signed in while browsing
- Auth wall triggers when guest taps "Checkout" button — redirects to /login?next=/checkout
- After magic link sign-in, redirect back to /checkout; cart persists from localStorage automatically
- No cart merge logic needed — localStorage cart is the only source

### Duplicate Order Prevention (CHKT-05)
- One order per user per Saturday delivery window (strict enforcement)
- Dual check: client-side on checkout page load (early warning) + server-side at checkout submit (enforcement)
- Any non-cancelled order (pending, confirmed, preparing, out_for_delivery, delivered) blocks a new order for that Saturday
- Block message: "You already have an order for this Saturday. View your order or contact us to make changes." with link to existing order
- No admin bypass needed — admin adds items to existing order manually from ops dashboard

### Price Conflict Resolution (CHKT-01, CHKT-02)
- Client sends only item IDs + modifier selections to checkout API (no prices) — server resolves all prices from DB
- Cart store still caches prices locally for instant display (menu cards, cart drawer, summary)
- Server is sole pricing authority; client-cached prices are display-only
- On 409 PRICE_CHANGED: cart auto-refreshes prices from server, toast shows "Some prices were updated. Review your cart."
- 409 response includes full priceDrifts array (item name, old price, new price) for transparent toast content
- Changed items get brief highlight animation in cart/summary
- After auto-refresh, user must re-click "Pay" (no auto-retry) — gives chance to review if prices increased

### Delivery Instructions (CHKT-08)
- Claude's Discretion: placement and UI for delivery instructions text field ("Leave at door", etc.)
- Likely on address or payment step as an optional textarea

### Modifier Bounds Validation (CHKT-03)
- Claude's Discretion: server validates modifier item_index bounds before checkout RPC (extend existing modifier validation)

### Prep Time Buffer (CHKT-04)
- Claude's Discretion: configurable prep time buffer in delivery time windows (extend getBusinessRules/generateTimeWindows)

### Checkout Logging (CHKT-10)
- Claude's Discretion: log successful checkouts with order_id, total_cents, user_id, payment_intent_id to Sentry breadcrumb + structured log

</decisions>

<specifics>
## Specific Ideas

- Tip presets should feel like DoorDash/Uber Eats — percentage buttons with dollar preview, pre-selected at 15%
- Guest browsing should be completely invisible — identical experience to signed-in users until checkout
- Price refresh should be smooth, not jarring — toast + highlight, not a full page redirect or blocking modal
- Duplicate order block should be helpful, not punitive — link to existing order, suggest contacting admin for changes

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/stores/cart-store.ts`: Zustand + idb-keyval persist — already supports guest browsing (no auth required for cart)
- `src/lib/stores/checkout-store.ts`: Checkout step state (address/time/payment) — needs tip + promo state additions
- `src/components/ui/checkout/PaymentStepV8.tsx`: Payment step component — tip and promo UI goes here
- `src/components/ui/checkout/CheckoutSummaryV8.tsx`: Order summary — needs tip/promo/delivery-instructions line items
- `src/lib/validations/checkout.ts`: Zod schema — needs tip/promo/deliveryInstructions fields, remove basePriceCents/priceDeltaCents
- `src/app/api/checkout/session/route.ts`: Checkout API — price drift detection already exists (lines 224-276), needs server-side pricing, tip/promo/duplicate-check additions
- `src/lib/hooks/useAuth.ts`: Auth hook — used by CheckoutClient for redirect; guest flow changes redirect logic
- `src/lib/hooks/useDeliveryGate.ts`: Delivery gate — cutoff already handled
- `src/lib/settings.ts`: Business rules — getBusinessRules(), generateTimeWindows() — prep time buffer extends these
- `src/types/checkout.ts`: CheckoutErrorCode enum — needs DUPLICATE_ORDER code

### Established Patterns
- Stripe Checkout Session with metadata (order_id, user_id, scheduled_date, time windows)
- Zod `.safeParse()` for request validation
- `errorResponse()` helper for structured checkout errors
- Toast notifications via `useToastV8` for user feedback
- Framer Motion animations on checkout step transitions
- `checkRateLimit()` for API rate limiting
- `logger.exception()` for Sentry error tracking

### Integration Points
- Stripe Coupons API for promo code validation
- Stripe line items for tip amount
- Cart store (Zustand) — price refresh handler on 409
- Checkout API route — server-side pricing, duplicate check, tip/promo processing
- Orders table — duplicate check query by user_id + scheduled_date + status
- Business rules (app_settings) — prep time buffer configuration

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 91-checkout-payment-hardening*
*Context gathered: 2026-03-03*
