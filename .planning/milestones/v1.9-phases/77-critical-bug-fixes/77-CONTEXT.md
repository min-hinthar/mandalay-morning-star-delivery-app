# Phase 77: Critical Bug Fixes - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 8 critical bugs (BUG-01 through BUG-08) in checkout and cart operations so they produce correct, consistent results under all timing conditions. This phase delivers correctness fixes only — no new features, no UI redesigns beyond what's needed to surface errors properly.

</domain>

<decisions>
## Implementation Decisions

### Stale Cart Handling (BUG-08)
- Block checkout when price drift detected — do NOT auto-update silently
- Validate both base item prices AND modifier prices against DB at checkout
- Show inline diff on each affected cart item (old price → new price) — not a top banner
- Provide one-tap "Accept updated prices" button that updates cart in-place and re-enables payment
- User stays in checkout flow — no redirect to cart page

### Quantity Limit Feedback (BUG-06)
- Show toast when per-item quantity cap (MAX_ITEM_QUANTITY = 10) is hit
- Show toast when total cart items cap (MAX_CART_ITEMS) is hit — currently only console.warns
- Apply toast feedback in BOTH add-to-cart button (menu page) AND cart page quantity stepper
- Toast tone and frequency: Claude's discretion, match existing toast patterns

### Refund Status (BUG-07)
- Parallel flag model: add `refund_status` column to orders table (values: 'none' | 'partial' | 'full')
- Do NOT add 'refunded' as a terminal order status — delivery status flow stays unchanged
- Auto-compute `refund_status` from item-level `refunded_quantity` data — single source of truth
- Admin order list: colored badge (yellow=partial, red=full) next to delivery status
- Admin order list: filterable column for refund status
- Customer order history: show 'Refunded' indicator on orders with refunds — full transparency

### Cutoff & Coverage Errors (BUG-02, BUG-05)
- Inline banner on checkout page when cutoff passes: "Orders for [date] closed at 3:00 PM Friday. Next delivery: [next Saturday]."
- Include the specific cutoff time in the message to educate users about the weekly cycle
- One-tap "Update to [next date]" button in the banner — keeps user in checkout
- Proactive cutoff check on checkout page (periodic, ~60s interval) PLUS server-side re-validation at submission
- Coverage re-validation at checkout submission (BUG-05): block checkout + inline banner + offer address change without leaving checkout
- Full date+time comparison in isPastCutoff() — not just time-of-day (BUG-02)

### Checkout TOCTOU Cleanup (BUG-01)
- Fix `.eq()` → `.in()` with proper order_item_id array for cleanup deletes
- Ensure cleanup deletes exactly the items belonging to the current order

### Time Window Validation (BUG-03)
- Add `.refine()` against TIME_WINDOWS list in checkout validation schema

### Cart Debounce Race Condition (BUG-04)
- Fix with timestamp-based dedup (existing debounce in cart-store.ts needs hardening)
- Rapid add-to-cart clicks must produce correct final quantity

### Claude's Discretion
- Toast message wording and frequency throttling for quantity limits
- Exact implementation of proactive cutoff polling interval
- Price diff UI styling (colors, layout within cart item)
- Error message copy for edge cases (e.g., item removed from menu entirely)
- How to compute refund_status (DB trigger vs application-level vs computed column)

</decisions>

<specifics>
## Specific Ideas

- Stale cart: one-tap "Accept updated prices" keeps users in checkout — do not redirect to cart page
- Cutoff message should educate: include "3:00 PM Friday" cutoff time so users learn the weekly cycle
- Refund badge: yellow for partial, red for full — consistent with warning/error color semantics
- Customer-facing refund indicator: be transparent, show refund status in order history

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cart-store.ts`: Already has `shouldDebounce()` and `createItemSignature()` — BUG-04 hardens these
- `delivery-dates.ts`: Has `isPastCutoff()`, `getCutoffForSaturday()`, `getNextSaturday()` — BUG-02 fixes comparison logic
- `useToastV8`: Existing toast system for BUG-06 feedback
- `order.ts` validation schemas: Zod schemas for checkout validation — BUG-03 adds `.refine()`
- `checkout/session/route.ts`: Already does item validation and RPC-based atomic order creation — BUG-01/05/08 modify this flow
- `admin/orders/[id]/refund/route.ts`: Item-level refund with `refunded_quantity` tracking — BUG-07 builds on this
- `admin/orders/[id]/status/route.ts`: Status transition logic with `VALID_TRANSITIONS` map — BUG-07 adds refund_status parallel to this

### Established Patterns
- Server actions return `{ success?, error? }` objects
- Zod `.safeParse()` for all input validation
- Toast notifications for client-side feedback
- `order_audit_log` table for tracking changes — refund already logs here
- Rate limiting on checkout and admin routes

### Integration Points
- `checkout/session/route.ts` — BUG-01, BUG-03, BUG-05, BUG-08 all modify this endpoint
- `cart-store.ts` — BUG-04, BUG-06 modify the Zustand store
- `delivery-dates.ts` — BUG-02 fixes the cutoff logic
- `AddToCartButton.tsx` — BUG-06 adds toast feedback
- Admin order pages — BUG-07 adds refund badge and filter
- Customer order pages — BUG-07 adds refund indicator
- Database migration needed for `refund_status` column on orders table

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 77-critical-bug-fixes*
*Context gathered: 2026-03-01*
