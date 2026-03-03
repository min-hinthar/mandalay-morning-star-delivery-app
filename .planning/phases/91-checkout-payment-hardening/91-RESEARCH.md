# Phase 91: Checkout & Payment Hardening - Research

**Researched:** 2026-03-03
**Domain:** Stripe Checkout Sessions, server-authoritative pricing, checkout UX
**Confidence:** HIGH

## Summary

Phase 91 hardens the checkout pipeline with 10 requirements spanning server-authoritative pricing (CHKT-01/02), modifier validation (CHKT-03), prep time buffers (CHKT-04), duplicate order prevention (CHKT-05), promo codes (CHKT-06), tips (CHKT-07), delivery instructions (CHKT-08), guest cart flow (CHKT-09), and checkout logging (CHKT-10).

The codebase is well-structured for these changes. The existing checkout API route (`src/app/api/checkout/session/route.ts`) already has price drift detection (lines 224-276) that compares client-sent prices against DB — CHKT-01/02 simplifies this by removing client-sent prices entirely. The cart store uses IndexedDB persistence which naturally supports guest browsing (CHKT-09). The checkout store is lightweight (70 lines) and ready for tip/promo state additions.

**Primary recommendation:** Split into 4 plans: (1) server-authoritative pricing + schema cleanup, (2) tips + promos + delivery instructions (revenue features), (3) duplicate order prevention + prep time buffer (business rules), (4) guest cart flow + checkout logging.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Tip UX (CHKT-07):** Tip on payment step before "Pay" button. 15%/20%/25%/Custom presets with dollar preview. 15% pre-selected. Tip in Stripe charge.
- **Promo Code UX (CHKT-06):** Collapsible "Have a promo code?" link on payment step. Validates against Stripe Coupons API. Discount in order summary.
- **Guest Cart Flow (CHKT-09):** Full menu access for guests. Cart in localStorage/IndexedDB via Zustand persist. Auth wall at "Checkout" button → /login?next=/checkout. No cart merge needed.
- **Duplicate Order Prevention (CHKT-05):** One order per user per Saturday. Client-side check on load + server-side at submit. Any non-cancelled order blocks. Link to existing order in message.
- **Price Conflict Resolution (CHKT-01/02):** Client sends only IDs + modifier selections. Server resolves all prices. On 409 PRICE_CHANGED: auto-refresh, toast, highlight changed items. User must re-click Pay.

### Claude's Discretion
- Delivery Instructions (CHKT-08): placement and UI
- Modifier Bounds Validation (CHKT-03): extend existing modifier validation
- Prep Time Buffer (CHKT-04): configurable in business rules
- Checkout Logging (CHKT-10): Sentry breadcrumb + structured log

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHKT-01 | Client sends only item IDs + modifier selections (no prices) | Remove `basePriceCents`/`priceDeltaCents` from Zod schema, cart-to-checkout mapping, and cart store types |
| CHKT-02 | Cart auto-refreshes on 409 PRICE_CHANGED | Add price-refresh handler in cart store; modify 409 response to include updated prices |
| CHKT-03 | Server validates modifier item_index bounds | Add bounds check in checkout route before RPC call (modifier item_index < items.length) |
| CHKT-04 | Delivery time windows include prep time buffer | Add `prepTimeBufferMinutes` to BusinessRules + app_settings seed |
| CHKT-05 | One order per Saturday per user | Add duplicate-check query in checkout route + client-side check hook |
| CHKT-06 | Promo code application at checkout | Stripe Coupons API validation → discount in Stripe session + orders table |
| CHKT-07 | Tip at checkout (15%/20%/25%/custom) | Tip as Stripe line item + `tip_cents` column in orders table |
| CHKT-08 | Delivery instructions text field | Reuse `special_instructions` on orders or add `delivery_instructions` column |
| CHKT-09 | Guest browsing + auth wall at checkout | Existing pattern: CheckoutClient redirects to `/login?next=/checkout` on line 131-135 |
| CHKT-10 | Checkout event logging | logger.info() + Sentry breadcrumb after successful Stripe session creation |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Stripe | latest | Payment processing, Coupons API | Already installed |
| Zustand | 5.x | Cart + checkout state management | Already installed |
| Zod | 3.x | Request validation schemas | Already installed |
| Framer Motion | 11.x | Checkout animations | Already installed |
| React Hook Form | n/a | Not used in checkout — direct Zustand | Confirmed |

### No New Dependencies Required
All CHKT requirements can be implemented with existing stack. Stripe Coupons API is part of the Stripe SDK already installed. No new packages needed.

## Architecture Patterns

### Pattern 1: Server-Authoritative Pricing (CHKT-01)
**What:** Client sends `{ menuItemId, quantity, modifiers: [{ optionId }] }` — no price fields. Server resolves prices from DB.
**Current state:** Zod schema (`src/lib/validations/checkout.ts`) includes `basePriceCents` and `priceDeltaCents`. PaymentStepV8 (line 106) sends `basePriceCents`. Cart store items have `basePriceCents` and `priceDeltaCents`.
**Change:** Remove price fields from Zod schema. Remove from `handleCheckout` body construction. Server already uses `menuItem.base_price_cents` and `modifier.price_delta_cents` from DB lookups.
**Key insight:** The existing price drift detection (route.ts lines 224-276) becomes unnecessary when client stops sending prices. Replace with a simpler "return current prices on any request for cart refresh" approach.

### Pattern 2: Price Refresh on 409 (CHKT-02)
**What:** When server detects item changes (sold out, unavailable, or price changed between add-to-cart and checkout), return 409 with `priceDrifts` array. Client auto-refreshes cart prices.
**Current state:** 409 PRICE_CHANGED already returned (route.ts line 269-276) but only when client prices mismatch.
**Change after CHKT-01:** Since client no longer sends prices, price drift detection changes to: server creates order with current DB prices. If any item has changed since last menu fetch, server includes `priceDrifts` in successful response (not 409), or alternatively, add a `/api/cart/validate` endpoint that returns current prices for cart items. The 409 still fires for sold-out/unavailable items.
**Better approach:** Add a `refreshPrices` field to the 409 response with current prices per item. Cart store adds an `updatePricesFromServer(priceDrifts)` action.

### Pattern 3: Stripe Checkout Session with Tips and Promos
**What:** Tips added as a Stripe line item. Promos validated via `stripe.coupons.retrieve()` and applied via `discounts` parameter on Checkout Session.
**Stripe API:**
```typescript
// Tip as line item
lineItems.push({
  price_data: {
    currency: 'usd',
    unit_amount: tipCents,
    product_data: { name: 'Tip' },
  },
  quantity: 1,
});

// Promo via coupon
const session = await stripe.checkout.sessions.create({
  discounts: [{ coupon: validatedCouponId }],
  // ...other params
});
```
**Note:** Stripe `discounts` and `line_items` cannot be used together with `allow_promotion_codes`. Must use explicit `discounts` array with pre-validated coupon ID.

### Pattern 4: Duplicate Order Prevention (CHKT-05)
**What:** Query orders table for existing non-cancelled orders on the target Saturday.
```sql
SELECT id, status FROM orders
WHERE user_id = $1
  AND status != 'cancelled'
  AND delivery_window_start::date = $2
LIMIT 1;
```
**Server-side:** Check before `create_order_with_items` RPC. Return `DUPLICATE_ORDER` error code.
**Client-side:** Hook `useExistingOrder(scheduledDate)` fetches on checkout page load for early warning.

### Anti-Patterns to Avoid
- **Don't store tip percentage in DB** — store `tip_cents` (resolved amount). Percentage is display-only.
- **Don't validate promo codes client-side** — always server-side via Stripe Coupons API.
- **Don't add a separate "delivery instructions" column** when `special_instructions` already exists on orders. Evaluate if the existing column suffices or if semantic separation is needed.
- **Don't create a cart merge system** — localStorage cart is sole source for guests, no server-side cart needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coupon validation | Custom promo code system | Stripe Coupons API | Edge cases: expiry, usage limits, amount vs %, one-time vs multi-use |
| Idempotent payments | Custom dedup logic | Stripe idempotency keys | Already in use (`checkout_${order.id}`) |
| Price calculation | Client-side totaling for API | Server-side `calculateOrderTotals()` | Already exists, server-authoritative |

## Common Pitfalls

### Pitfall 1: Stale Cart Prices After CHKT-01
**What goes wrong:** Client removes prices from checkout payload but still displays stale prices in cart.
**Why it happens:** Cart store caches `basePriceCents` from when item was added. Menu prices can change between add and checkout.
**How to avoid:** Cart store prices remain for display only. On 409, update cart store prices from server response.
**Warning signs:** Cart shows $10, checkout summary shows $12 after price change.

### Pitfall 2: Stripe discounts + line_items conflict
**What goes wrong:** Using `allow_promotion_codes: true` alongside `discounts` array causes Stripe API error.
**Why it happens:** Stripe doesn't allow both — must choose one approach.
**How to avoid:** Pre-validate coupon server-side, pass as `discounts: [{ coupon: id }]`. Never use `allow_promotion_codes`.

### Pitfall 3: Race condition on duplicate order check
**What goes wrong:** Two simultaneous checkout submissions both pass the duplicate check.
**Why it happens:** Check-then-insert isn't atomic.
**How to avoid:** Add a unique partial index on orders: `CREATE UNIQUE INDEX ON orders(user_id, delivery_window_start::date) WHERE status != 'cancelled'`. The DB enforces uniqueness.

### Pitfall 4: Guest cart lost on auth redirect
**What goes wrong:** Guest adds items, clicks checkout, redirected to login, cart is empty after redirect.
**Why it happens:** If cart is in memory-only store.
**How to avoid:** Cart already uses IndexedDB persistence (`cartIDBStorage`). Survives page navigation. Confirmed safe.

### Pitfall 5: Tip included in Stripe but not in order total
**What goes wrong:** Stripe charges correct amount (food + tip) but orders.total_cents doesn't include tip.
**Why it happens:** `calculateOrderTotals` doesn't know about tip.
**How to avoid:** Store `tip_cents` separately in orders table. `total_cents` = subtotal + delivery + tax + tip - discount. Update both `calculateOrderTotals` and the RPC.

## Code Examples

### Removing Price Fields from Checkout Schema
```typescript
// BEFORE (current)
export const checkoutItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
  basePriceCents: z.number().int().min(0),  // REMOVE
  modifiers: z.array(z.object({
    optionId: z.string().uuid(),
    priceDeltaCents: z.number().int(),  // REMOVE
  })),
  notes: z.string().max(500).optional(),
});

// AFTER (CHKT-01)
export const checkoutItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
  modifiers: z.array(z.object({
    optionId: z.string().uuid(),
  })),
  notes: z.string().max(500).optional(),
});
```

### Tip Presets Component Pattern
```typescript
const TIP_PRESETS = [
  { label: '15%', multiplier: 0.15 },
  { label: '20%', multiplier: 0.20 },
  { label: '25%', multiplier: 0.25 },
] as const;

// Calculate tip from subtotal
const tipCents = isCustomTip
  ? customTipCents
  : Math.round(subtotalCents * selectedMultiplier);
```

### Duplicate Order Check Query
```typescript
const { data: existingOrder } = await supabase
  .from('orders')
  .select('id, status')
  .eq('user_id', userId)
  .neq('status', 'cancelled')
  .gte('delivery_window_start', `${scheduledDate}T00:00:00`)
  .lt('delivery_window_start', `${scheduledDate}T23:59:59`)
  .limit(1)
  .maybeSingle();
```

### Stripe Coupon Validation
```typescript
async function validatePromoCode(code: string): Promise<{
  valid: boolean;
  couponId?: string;
  discountCents?: number;
  discountPercent?: number;
}> {
  try {
    // Stripe promotion codes map to coupons
    const promos = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
    });
    if (promos.data.length === 0) return { valid: false };

    const promo = promos.data[0];
    const coupon = promo.coupon;

    return {
      valid: true,
      couponId: coupon.id,
      discountCents: coupon.amount_off ?? undefined,
      discountPercent: coupon.percent_off ?? undefined,
    };
  } catch {
    return { valid: false };
  }
}
```

## Existing Code Audit

### Files That Need Changes

| File | Change | Requirement |
|------|--------|-------------|
| `src/lib/validations/checkout.ts` | Remove `basePriceCents`, `priceDeltaCents`; add `tipCents`, `promoCode`, `deliveryInstructions` | CHKT-01, 06, 07, 08 |
| `src/app/api/checkout/session/route.ts` | Remove price drift detection, add server pricing, tip line item, promo validation, duplicate check, CHKT-03 bounds check, logging | CHKT-01-10 |
| `src/components/ui/checkout/PaymentStepV8.tsx` | Add tip selector, promo input, delivery instructions; remove price fields from checkout body | CHKT-01, 06, 07, 08 |
| `src/components/ui/checkout/CheckoutSummaryV8.tsx` | Add tip/promo/discount line items in summary | CHKT-06, 07 |
| `src/lib/stores/checkout-store.ts` | Add tipPercent, tipCents, customTipCents, promoCode, discountCents, deliveryInstructions state | CHKT-06, 07, 08 |
| `src/lib/stores/cart-store.ts` | Add `updatePricesFromServer()` action for 409 handling | CHKT-02 |
| `src/types/checkout.ts` | Add `DUPLICATE_ORDER` error code; update request/response types | CHKT-05 |
| `src/lib/utils/order.ts` | Update `calculateOrderTotals` for tip/discount; `createStripeLineItems` for tip | CHKT-06, 07 |
| `src/lib/settings/business-rules.ts` | Add `prepTimeBufferMinutes` to BusinessRules | CHKT-04 |
| `src/lib/settings/generate-time-windows.ts` | Apply prep buffer to window generation | CHKT-04 |
| `src/app/(customer)/checkout/CheckoutClient.tsx` | Add duplicate order check on mount | CHKT-05 |
| `supabase/migrations/027_create_order_atomic.sql` | Update RPC for tip_cents, promo_code, discount_cents | CHKT-06, 07 |

### Files That Are Already Correct
- `src/lib/stores/cart-store.ts` — IndexedDB persistence for guest cart (CHKT-09 already works)
- `src/app/(customer)/checkout/CheckoutClient.tsx` lines 131-135 — Auth redirect (CHKT-09 already works)
- `src/lib/rate-limit/` — Rate limiting already in place
- `src/lib/stripe/server.ts` — Stripe client already configured

### Database Schema Changes Needed

**Migration: Add tip/promo/discount columns to orders**
```sql
ALTER TABLE orders
  ADD COLUMN tip_cents INTEGER NOT NULL DEFAULT 0 CHECK (tip_cents >= 0),
  ADD COLUMN promo_code TEXT,
  ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  ADD COLUMN delivery_instructions TEXT;
```

**Migration: Unique index for duplicate order prevention**
```sql
CREATE UNIQUE INDEX idx_orders_user_delivery_date
  ON orders (user_id, (delivery_window_start::date))
  WHERE status != 'cancelled';
```

**Migration: Add prep_time_buffer_minutes to app_settings seed**
```sql
INSERT INTO app_settings (category, key, value, description)
VALUES ('delivery', 'prep_time_buffer_minutes', '30', 'Minutes buffer before first delivery window')
ON CONFLICT (key) DO NOTHING;
```

**Migration: Update create_order_with_items RPC for new columns**

## Open Questions

1. **Delivery instructions vs special_instructions:** The `orders` table already has `special_instructions` (used for order notes). Should delivery instructions be a separate column or merged? Recommendation: Add separate `delivery_instructions` column for semantic clarity — order notes are for the kitchen, delivery instructions are for the driver.

2. **Tip column in orders:** Does tip need to be included in `total_cents`? Recommendation: YES. `total_cents = subtotal + delivery + tax + tip - discount`. This ensures financial reconciliation is straightforward. Store `tip_cents` and `discount_cents` as separate columns for reporting.

## Sources

### Primary (HIGH confidence)
- Codebase audit: All files listed in "Existing Code Audit" section read directly
- Stripe Checkout Sessions API — line_items, discounts, metadata parameters
- Supabase RPC patterns — existing `create_order_with_items` function

### Secondary (MEDIUM confidence)
- Stripe Promotion Codes vs Coupons API distinction (promotion codes are customer-facing codes that map to coupons)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, no new deps
- Architecture: HIGH — patterns follow existing codebase conventions
- Pitfalls: HIGH — verified against actual code, not hypothetical

**Research date:** 2026-03-03
**Valid until:** 2026-04-03
