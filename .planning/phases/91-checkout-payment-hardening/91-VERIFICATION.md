---
phase: 91-checkout-payment-hardening
verified: 2026-03-03T19:15:00Z
status: passed
score: 20/20 must-haves verified
re_verification: false
---

# Phase 91: Checkout Payment Hardening Verification Report

**Phase Goal:** Checkout is airtight — server-authoritative pricing, graceful conflict resolution, and revenue features (tips, promos) ready for launch
**Verified:** 2026-03-03T19:15:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                  | Status     | Evidence                                                                                              |
|----|----------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------------------|
| 1  | Orders table has tip_cents, promo_code, discount_cents, delivery_instructions columns  | VERIFIED   | `035_checkout_hardening.sql` lines 11-15: ALTER TABLE with all 4 columns                              |
| 2  | Unique partial index prevents duplicate orders per user per Saturday                   | VERIFIED   | `035_checkout_hardening.sql` lines 21-23: `idx_orders_user_delivery_date` partial index               |
| 3  | Zod checkout schema accepts items without price fields                                 | VERIFIED   | `checkout.ts` validation: `checkoutItemSchema` has no `basePriceCents` or `priceDeltaCents`           |
| 4  | Order utility functions support tip and discount in totals                             | VERIFIED   | `order.ts` line 76-77: `calculateOrderTotals` accepts `tipCents`, `discountCents`; line 90-93: `Math.max(0, subtotal+delivery+tax+tip-discount)` |
| 5  | Checkout API resolves all prices from DB, never reads client-sent prices               | VERIFIED   | `route.ts` line 229: `const tipCents = input.tipCents ?? 0`; no client price fields read; Zod schema strips them |
| 6  | 409 PRICE_CHANGED response includes priceDrifts with current prices                   | VERIFIED   | `PaymentStepV8.tsx` lines 141-148: handles 409 PRICE_CHANGED, calls `updatePricesFromServer(data.error.details?.priceDrifts)` |
| 7  | Modifier item_index validated against items array bounds                               | VERIFIED   | `route.ts` lines 276-280: explicit bounds check `mod.item_index < 0 || mod.item_index >= rpcItems.length` |
| 8  | Duplicate orders for same user + same Saturday return DUPLICATE_ORDER error            | VERIFIED   | `route.ts` lines 104-126: Supabase query + 409 errorResponse("DUPLICATE_ORDER", ...)                 |
| 9  | Promo code validated against Stripe Promotion Codes API                                | VERIFIED   | `promo.ts` line 29: `stripe.promotionCodes.list({code, active: true, ...})`; wired via `validatePromoCode(input.promoCode)` in route |
| 10 | Tip amount included as Stripe line item                                                | VERIFIED   | `order.ts` lines 158-170: tip line item appended when `tipCents > 0`; `route.ts` line 387 passes tipCents |
| 11 | Delivery instructions stored in order                                                  | VERIFIED   | `route.ts` line 296: `delivery_instructions: input.deliveryInstructions ?? null` in RPC p_order      |
| 12 | Successful checkout logged with order_id, total_cents, user_id, payment_intent_id     | VERIFIED   | `route.ts` lines 417-426: `logger.info("Checkout session created", {orderId, totalCents, userId, paymentIntentId, ...})` |
| 13 | Prep time buffer applied to time window generation                                     | VERIFIED   | `generate-time-windows.ts`: `prepTimeBufferMinutes` param shifts effective start hour; `route.ts` line 49-53 and `page.tsx` line 9 both pass `rules.prepTimeBufferMinutes` |
| 14 | User sees tip presets (15%/20%/25%/Custom) with dollar amounts on payment step        | VERIFIED   | `TipSelector.tsx` lines 34,86-141: TIP_PRESETS=[15,20,25], 4 buttons with dollar preview; rendered in PaymentStepV8 line 313 |
| 15 | 15% tip is pre-selected by default                                                     | VERIFIED   | `checkout-store.ts` line 28: `tipPercent: 15` in initialState                                        |
| 16 | User sees collapsible promo code input on payment step                                 | VERIFIED   | `PromoCodeInput.tsx` lines 109-118: "Have a promo code?" toggle; rendered in PaymentStepV8 line 318  |
| 17 | Order summary shows tip, discount, and delivery instructions line items                | VERIFIED   | `CheckoutSummaryV8.tsx` lines 281-313: tip and discount conditional line items; adjusted total calculation |
| 18 | Cart auto-refreshes prices on 409 PRICE_CHANGED with toast                             | VERIFIED   | `cart-store.ts` line 251: `updatePricesFromServer` action; `PaymentStepV8.tsx` lines 141-155: calls it on 409 and shows toast |
| 19 | Client-side duplicate order check shows early warning on checkout page load            | VERIFIED   | `useExistingOrder.ts`: full hook implementation; `CheckoutClient.tsx` lines 84, 188-196: hook called, warning banner rendered |
| 20 | Guest can browse and build cart; auth prompt only when tapping Checkout                | VERIFIED   | `CheckoutClient.tsx` line 137: client-side `router.push("/login?next=/checkout")` — no server middleware blocks `/checkout`; `cartIDBStorage` imported in cart-store for persistence |

**Score:** 20/20 truths verified

---

## Required Artifacts

| Artifact                                                        | Provides                                           | Status    | Details                                                   |
|-----------------------------------------------------------------|----------------------------------------------------|-----------|-----------------------------------------------------------|
| `supabase/migrations/035_checkout_hardening.sql`               | Schema changes: columns, index, setting, RPC       | VERIFIED  | 126 lines, all 4 new columns, unique index, updated RPC   |
| `src/lib/validations/checkout.ts`                              | Zod schema without price fields                    | VERIFIED  | tipCents/promoCode/deliveryInstructions added; no basePriceCents |
| `src/types/checkout.ts`                                        | DUPLICATE_ORDER, PriceDrift, updated types         | VERIFIED  | DUPLICATE_ORDER in union; PriceDrift interface; CheckoutState has 7 new fields |
| `src/lib/utils/order.ts`                                       | calculateOrderTotals with tip/discount             | VERIFIED  | tipCents/discountCents params; Math.max(0) clamping; tip line item |
| `src/app/api/checkout/session/route.ts`                        | Hardened checkout API (446 lines)                  | VERIFIED  | All features implemented: server pricing, duplicates, promos, tip, logging |
| `src/lib/settings/business-rules.ts`                          | prepTimeBufferMinutes in BusinessRules             | VERIFIED  | Interface field, default=30, DB_KEY_MAP entry             |
| `src/lib/settings/generate-time-windows.ts`                   | Prep buffer applied to window start                | VERIFIED  | effectiveStartHour computed from buffer; backward-compatible |
| `src/lib/stripe/promo.ts`                                      | validatePromoCode helper                           | VERIFIED  | Stripe promotionCodes.list; amount_off and percent_off both handled |
| `src/app/api/checkout/session/helpers.ts`                      | cleanupOrder, buildModifierGroupsMap               | VERIFIED  | Exists; imported by route.ts line 21                      |
| `src/components/ui/checkout/TipSelector.tsx`                  | Tip preset buttons with custom input               | VERIFIED  | 174 lines; 4 buttons, dollar preview, animated custom input, uses checkout store |
| `src/components/ui/checkout/PromoCodeInput.tsx`               | Collapsible promo code input                       | VERIFIED  | 187 lines; collapsible, fetch /api/checkout/validate-promo, applied badge, remove button |
| `src/lib/stores/checkout-store.ts`                            | Tip, promo, delivery instructions state            | VERIFIED  | 98 lines; 7 new state fields; 6 new actions; tipPercent:15 initial |
| `src/components/ui/checkout/PaymentStepV8.tsx`                | Payment step with all new sections (401 lines)     | VERIFIED  | TipSelector, PromoCodeInput rendered; delivery instructions textarea; tipCents/promoCode/deliveryInstructions in API body; no price fields sent |
| `src/components/ui/checkout/CheckoutSummaryV8.tsx`            | Order summary with tip and discount lines          | VERIFIED  | 344 lines; tip and discount conditional line items; adjusted total |
| `src/components/ui/checkout/index.ts`                         | Barrel exports for new components                  | VERIFIED  | Lines 36-39: TipSelector and PromoCodeInput exported      |
| `src/app/api/checkout/validate-promo/route.ts`                | Promo validation endpoint                          | VERIFIED  | 45 lines; uses validatePromoCode; returns valid/discountCents/label |
| `src/lib/stores/cart-store.ts`                                | updatePricesFromServer action                      | VERIFIED  | Line 251: full implementation with baseDrift + modDrifts handling |
| `src/lib/hooks/useExistingOrder.ts`                           | Hook for client-side duplicate order check         | VERIFIED  | 59 lines; Supabase query; silent-fail design; returns existingOrder/isLoading |
| `src/app/(customer)/checkout/CheckoutClient.tsx`              | Checkout page with duplicate check + price refresh | VERIFIED  | useExistingOrder called; warning banner rendered; client-side auth redirect |
| `src/types/cart.ts`                                           | updatePricesFromServer in CartStore interface      | VERIFIED  | Line 55: type declaration for updatePricesFromServer       |

---

## Key Link Verification

| From                                          | To                                           | Via                                    | Status   | Details                                                                      |
|-----------------------------------------------|----------------------------------------------|----------------------------------------|----------|------------------------------------------------------------------------------|
| `route.ts`                                    | `stripe.promotionCodes.list`                 | validatePromoCode in promo.ts          | WIRED    | route.ts imports validatePromoCode; promo.ts calls promotionCodes.list       |
| `route.ts`                                    | orders table unique index                    | Supabase query + DUPLICATE_ORDER check | WIRED    | Lines 104-126: explicit pre-create query; 409 response on duplicate          |
| `route.ts`                                    | DB columns tip_cents/promo_code/etc          | RPC p_order object                     | WIRED    | Lines 289-296: all 4 new columns passed to create_order_with_items RPC       |
| `TipSelector.tsx`                             | `checkout-store.ts`                          | useCheckoutStore                       | WIRED    | Lines 42-45: useCheckoutStore for tipPercent, customTipCents, setTipPercent  |
| `PaymentStepV8.tsx`                           | `TipSelector.tsx`                            | Component composition                  | WIRED    | Line 30 import; line 313 render `<TipSelector subtotalCents={itemsSubtotal}>`|
| `PaymentStepV8.tsx`                           | `cart-store.ts` updatePricesFromServer       | 409 PRICE_CHANGED handler              | WIRED    | Lines 142-144: `useCartStore.getState().updatePricesFromServer(...)` on 409  |
| `CheckoutClient.tsx`                          | `useExistingOrder.ts`                        | Duplicate order early warning          | WIRED    | Line 14 import; line 84 call; lines 188-196 warning banner render            |
| `PromoCodeInput.tsx`                          | `/api/checkout/validate-promo`               | fetch POST                             | WIRED    | Line 52: `fetch("/api/checkout/validate-promo", {method:"POST", ...})`       |
| `checkout/page.tsx`                           | `generateTimeWindows`                        | prepTimeBufferMinutes passed           | WIRED    | Line 9: `rules.prepTimeBufferMinutes` as third arg                           |

---

## Requirements Coverage

| Requirement | Source Plans | Description                                                                        | Status    | Evidence                                                                 |
|-------------|-------------|------------------------------------------------------------------------------------|-----------|--------------------------------------------------------------------------|
| CHKT-01     | 01, 02, 03  | Client sends only item IDs + modifier selections (no prices)                       | SATISFIED | Zod schema has no basePriceCents/priceDeltaCents; PaymentStepV8 sends no price fields |
| CHKT-02     | 02, 04      | Cart auto-refreshes prices on 409 PRICE_CHANGED instead of error                  | SATISFIED | updatePricesFromServer in cart-store; PaymentStepV8 handles 409 PRICE_CHANGED with toast |
| CHKT-03     | 02          | Server validates modifier item_index bounds before checkout RPC                    | SATISFIED | route.ts lines 276-280: explicit bounds validation loop                  |
| CHKT-04     | 02          | Delivery time windows include configurable prep time buffer                        | SATISFIED | generate-time-windows.ts prepTimeBufferMinutes param; used in route.ts and page.tsx |
| CHKT-05     | 01, 02, 04  | User cannot place more than one order per Saturday delivery window                 | SATISFIED | DB unique partial index + server 409 DUPLICATE_ORDER + client useExistingOrder warning |
| CHKT-06     | 02, 03      | User can apply promo codes at checkout (Stripe coupon integration)                 | SATISFIED | promo.ts uses Stripe promotionCodes.list; validate-promo route; PromoCodeInput UI |
| CHKT-07     | 03          | User can add tip at checkout (15%/20%/25%/custom)                                 | SATISFIED | TipSelector with 4 presets, dollar preview, 15% default, custom input    |
| CHKT-08     | 01, 02, 03  | User can add delivery instructions                                                 | SATISFIED | Zod field, stored in RPC, textarea in PaymentStep, CheckoutSummary shows it |
| CHKT-09     | 04          | User can browse and build cart without signing in; auth at checkout; cart transfers| SATISFIED | Client-side auth redirect in CheckoutClient; cartIDBStorage for persistence; no server middleware |
| CHKT-10     | 02          | Successful checkouts logged with order_id, total_cents, user_id, payment_intent_id| SATISFIED | route.ts lines 417-426: logger.info with all required fields             |

**All 10 requirements satisfied. No orphaned requirements.**

---

## Anti-Patterns Found

| File                                  | Line | Pattern                     | Severity  | Impact                              |
|---------------------------------------|------|-----------------------------|-----------|-------------------------------------|
| `route.ts` (checkout/session)         | —    | 446 lines (limit: 400)      | Warning   | ESLint max-lines; lint passes; helpers extracted to helpers.ts |
| `PaymentStepV8.tsx`                   | —    | 401 lines (limit: 400)      | Warning   | 1 line over; lint passes; functionally complete |
| `order.ts` line 63                    | 63   | `// V1: No tax calculation` | Info      | Documented intentional deferral; not a stub — known limitation |

No blocker anti-patterns. Both over-limit files pass `pnpm lint`. The tax placeholder is an intentional design decision with a comment pointing to a future phase, not a stub that blocks goal achievement.

---

## Human Verification Required

### 1. Tip UX — Visual and Interaction Quality

**Test:** Navigate to checkout payment step. Observe TipSelector buttons (15%/20%/25%/Custom). Confirm 15% is visually selected on load, dollar amounts show correctly based on cart subtotal, custom input animates in when "Custom" is tapped, and custom amount validates min/max.
**Expected:** DoorDash-style selector with instant dollar preview, smooth animation, correct 15% pre-selection.
**Why human:** Visual fidelity and animation quality cannot be verified programmatically.

### 2. Promo Code Flow — End-to-End

**Test:** On checkout payment step, click "Have a promo code?", enter a valid Stripe test promo code, click Apply. Confirm: applied badge shows with discount label, summary updates, total decreases. Then click Remove and confirm promo clears.
**Expected:** Collapsible expands, validation call succeeds, badge appears, total adjusts, remove works.
**Why human:** Requires a live Stripe test environment with seeded promo codes.

### 3. PRICE_CHANGED Cart Refresh UX

**Test:** Simulate a price change (modify DB price of a menu item after adding to cart), then attempt checkout. Confirm toast notification appears with "Some prices were updated", cart prices visually update to match new DB prices.
**Expected:** No error state — seamless cart refresh with informational toast.
**Why human:** Requires DB manipulation mid-session; toast visual and cart highlight cannot be verified programmatically.

### 4. Duplicate Order Warning Banner

**Test:** With an existing active order for the next Saturday, navigate to checkout. Confirm the yellow/warning banner appears immediately with a link to the existing order.
**Expected:** Banner visible before any checkout steps, link navigates to correct order detail page.
**Why human:** Requires an existing order in the database; banner appearance and link correctness are visual.

### 5. Guest Checkout Flow — Cart Persistence Across Login Redirect

**Test:** As a logged-out user, add 3 items to cart. Navigate to /checkout. Confirm redirect to /login?next=/checkout. Log in. Confirm redirect back to /checkout with all 3 items still in cart.
**Expected:** Zero item loss across auth redirect; seamless return to checkout.
**Why human:** Requires browser session, IndexedDB behavior, and real auth flow.

---

## Gaps Summary

No gaps found. All 20 truths verified, all 10 requirements satisfied, all key links wired, all 9 commits present in git history. Two files marginally exceed the 400-line limit but pass `pnpm lint` and both have logical justifications (route.ts has co-located helpers.ts extracted; PaymentStepV8.tsx is 1 line over). These are warnings, not blockers.

---

_Verified: 2026-03-03T19:15:00Z_
_Verifier: Claude (gsd-verifier)_
