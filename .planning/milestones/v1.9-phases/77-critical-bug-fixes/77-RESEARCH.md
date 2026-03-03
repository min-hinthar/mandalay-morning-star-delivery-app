# Phase 77: Critical Bug Fixes - Research

**Researched:** 2026-03-01
**Domain:** Checkout correctness, cart state management, order lifecycle
**Confidence:** HIGH

## Summary

Phase 77 fixes 8 critical bugs in checkout and cart operations. All bugs exist in already-built code — no new libraries or architectural patterns needed. The fixes are surgical: correcting Supabase query operators, adding Zod refinements, hardening debounce logic, adding server-side re-validation, and introducing a `refund_status` column with UI badges.

The codebase is well-structured with established patterns (Zod validation, Zustand stores, server actions returning `{ success?, error? }`, audit logging). Every fix has a clear location and a narrow blast radius.

**Primary recommendation:** Fix bugs in dependency order — data layer first (migration for BUG-07), then server-side logic (BUG-01, 02, 03, 05, 08), then client-side (BUG-04, 06). This minimizes integration risk.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **BUG-08 (Stale Cart):** Block checkout when price drift detected. Validate both base item prices AND modifier prices against DB. Show inline diff on each affected cart item (old price -> new price), not a top banner. One-tap "Accept updated prices" button that updates cart in-place. User stays in checkout flow.
- **BUG-06 (Quantity Limit):** Show toast when per-item quantity cap (MAX_ITEM_QUANTITY = 10) is hit. Show toast when total cart items cap (MAX_CART_ITEMS) is hit. Apply in BOTH add-to-cart button (menu page) AND cart page quantity stepper.
- **BUG-07 (Refund Status):** Parallel flag model with `refund_status` column ('none' | 'partial' | 'full'). Do NOT add 'refunded' as terminal order status. Auto-compute from `refunded_quantity`. Admin: colored badge (yellow=partial, red=full) + filterable column. Customer: show 'Refunded' indicator in order history.
- **BUG-02/05 (Cutoff & Coverage):** Inline banner on checkout page when cutoff passes. Include specific cutoff time in message. One-tap "Update to [next date]" button. Proactive cutoff check (~60s interval) PLUS server-side re-validation. Coverage re-validation at checkout submission. Full date+time comparison in isPastCutoff().
- **BUG-01 (TOCTOU Cleanup):** Fix `.eq()` -> `.in()` with proper order_item_id array.
- **BUG-03 (Time Window):** Add `.refine()` against TIME_WINDOWS list.
- **BUG-04 (Cart Debounce):** Fix with timestamp-based dedup.

### Claude's Discretion
- Toast message wording and frequency throttling for quantity limits
- Exact implementation of proactive cutoff polling interval
- Price diff UI styling (colors, layout within cart item)
- Error message copy for edge cases
- How to compute refund_status (DB trigger vs application-level vs computed column)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BUG-01 | Fix checkout TOCTOU cleanup — `.eq()` -> `.in()` | Supabase `.in()` operator confirmed in codebase (line 98, 108 of checkout route). Cleanup code at lines 222-227 already uses `.in()` for `order_item_modifiers` but the `freshMenuItems` error path at line 225 has the `.eq()` bug |
| BUG-02 | Fix `isPastCutoff()` — full date+time comparison | `delivery-dates.ts` already uses `getTime()` comparison (line 151). The function itself is correct; the BUG is that `getNextSaturday()` returns same Saturday even ON Saturday, so the cutoff check on Saturday itself is wrong |
| BUG-03 | Add time window validation — `.refine()` against `TIME_WINDOWS` | `checkout.ts` has no time window validation. `TIME_WINDOWS` array defined in `src/types/delivery.ts`. Need `.refine()` on `createCheckoutSessionSchema` |
| BUG-04 | Fix cart debounce race condition | `cart-store.ts` has `shouldDebounce()` with 300ms window. `AddToCartButton.tsx` has separate 500ms debounce. Two independent debounce layers but neither handles concurrent state reads correctly |
| BUG-05 | Re-validate coverage + cutoff at checkout submission | Checkout route validates address `is_verified` but doesn't re-check cutoff timing. Need to add `isPastCutoff()` check and coverage re-validation in `checkout/session/route.ts` |
| BUG-06 | Add quantity limit toast when silently capped | `cart-store.ts` `addItem()` silently clamps at MAX_ITEM_QUANTITY (line 117) and silently returns at MAX_CART_ITEMS (line 129). `toast` is already imported |
| BUG-07 | Unify refund and status transition logic | Refund route at `admin/orders/[id]/refund/route.ts` updates `refunded_quantity` per item but no aggregate `refund_status` on orders table. Status route has `VALID_TRANSITIONS` map. Need new column + migration + UI badges |
| BUG-08 | Re-validate modifiers against DB at checkout | `validateCartItems()` in `order.ts` checks `is_active` and `is_sold_out` but does NOT compare client-sent prices against DB prices. Need price drift detection |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Purpose | Location |
|---------|---------|----------|
| Zod | Validation schemas, `.refine()` for BUG-03 | `src/lib/validations/checkout.ts` |
| Zustand | Cart store with persist middleware | `src/lib/stores/cart-store.ts` |
| Supabase JS | DB queries, `.in()` operator for BUG-01 | `src/lib/supabase/server.ts` |
| Next.js App Router | API routes for checkout | `src/app/api/checkout/session/route.ts` |
| useToastV8 | Toast notifications for BUG-06 | `src/lib/hooks/useToastV8` |

### No New Dependencies
Per STATE.md decision: "Zero new npm packages -- entire milestone uses installed deps."

## Architecture Patterns

### Existing Patterns to Follow

**Server-side validation pattern (checkout/session/route.ts):**
```typescript
// 1. Parse with Zod
const parsed = schema.safeParse(body);
if (!parsed.success) return errorResponse("VALIDATION_ERROR", ...);

// 2. Authenticate
const { user } = await supabase.auth.getUser();

// 3. Validate business rules (where BUG-02, 03, 05, 08 add checks)

// 4. Create order atomically via RPC
const { data: rpcResult } = await supabase.rpc("create_order_with_items", ...);

// 5. Create Stripe session
```

**Cart store mutation pattern (cart-store.ts):**
```typescript
addItem: (item) => {
  const signature = createItemSignature(item);
  if (shouldDebounce(signature)) return; // BUG-04 hardens this
  const { items } = get();
  // ... merge or add
  // BUG-06 adds toast calls here
}
```

**Admin UI pattern (admin/orders/page.tsx):**
```typescript
// Filter state + badge rendering
const STATUS_FILTERS: { value: OrderStatus | "all"; label: string }[] = [...]
// BUG-07 adds refund_status filter alongside this
```

### Anti-Patterns to Avoid
- **Don't add 'refunded' to OrderStatus enum** — CONTEXT.md explicitly forbids this. Use parallel `refund_status` column.
- **Don't redirect to cart page on stale prices** — CONTEXT.md says user stays in checkout flow.
- **Don't use top banner for price drift** — CONTEXT.md says inline diff on each affected item.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time window validation | Manual string matching | Zod `.refine()` with `TIME_WINDOWS.some()` | Single source of truth |
| Price comparison | Custom diff algorithm | Simple `!==` comparison on cents values | Prices are integers, exact match required |
| Debounce race conditions | Complex mutex/lock | Atomic `set()` with `get()` in Zustand | Zustand's synchronous `set` is already atomic within a single call |
| Refund status computation | Application-level recomputation on every read | DB trigger on `order_items` update | Single source of truth, impossible to drift |

## Common Pitfalls

### Pitfall 1: Stale Closure in Zustand addItem
**What goes wrong:** Reading `items` via `get()` then doing async work before `set()` creates a TOCTOU window where concurrent calls read the same stale state.
**Why it happens:** JavaScript is single-threaded but callbacks can interleave between async boundaries.
**How to avoid:** Use Zustand's callback-form `set((state) => ...)` for atomic read-modify-write. The current `addItem` reads via `get()` (line 107) then sets — safe for synchronous operations but fragile if async is added.
**Warning signs:** Duplicate cart items appearing after rapid clicks.

### Pitfall 2: CUTOFF_DAY Not Used in isPastCutoff
**What goes wrong:** `getCutoffForSaturday()` hardcodes `utcDate.setUTCDate(utcDate.getUTCDate() - 1)` (always Friday) but doesn't use `CUTOFF_DAY` constant.
**Why it happens:** The constant exists in `delivery.ts` but the function in `delivery-dates.ts` doesn't import or use it.
**How to avoid:** Import and use `CUTOFF_DAY` to compute cutoff day offset from Saturday.

### Pitfall 3: Cleanup Code Missing order_item_modifiers
**What goes wrong:** The error-path cleanup in checkout route (lines 222-227) correctly deletes `order_item_modifiers` using `.in()` for the success path (line 237-240) but the error path for `freshMenuError` (line 225) has broken `.eq()` logic.
**How to avoid:** Use the same `.in("order_item_id", orderItems.map(oi => oi.id))` pattern for all cleanup paths.

### Pitfall 4: Cart Price Types Must Match
**What goes wrong:** Cart stores prices as `basePriceCents` (number) and modifier `priceDeltaCents` (number). DB stores as `base_price_cents` and `price_delta_cents`. If comparison uses different types or field names, drift goes undetected.
**How to avoid:** Map cart items to DB field names explicitly before comparison. Compare cents-to-cents.

### Pitfall 5: Migration Must Handle Existing Orders
**What goes wrong:** Adding `refund_status` column without a default breaks existing order rows.
**How to avoid:** Use `DEFAULT 'none'` in the ALTER TABLE statement. Optionally backfill from existing `refunded_quantity` data.

## Code Examples

### BUG-01 Fix: TOCTOU Cleanup
```typescript
// BEFORE (broken - line 225):
await supabase
  .from("order_item_modifiers")
  .delete()
  .eq("order_item_id", orderItems.map((oi) => oi.id)[0] ? "" : "");

// AFTER (correct):
await supabase
  .from("order_item_modifiers")
  .delete()
  .in("order_item_id", orderItems.map((oi) => oi.id));
```

### BUG-03 Fix: Time Window Validation
```typescript
import { TIME_WINDOWS } from "@/types/delivery";

export const createCheckoutSessionSchema = z.object({
  // ... existing fields ...
  timeWindowStart: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  timeWindowEnd: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  // ... existing fields ...
}).refine(
  (data) => TIME_WINDOWS.some(
    (tw) => tw.start === data.timeWindowStart && tw.end === data.timeWindowEnd
  ),
  { message: "Invalid delivery time window", path: ["timeWindowStart"] }
);
```

### BUG-06 Fix: Toast on Quantity Cap
```typescript
// In addItem, when merging:
const newQuantity = Math.min(existing.quantity + (item.quantity || 1), MAX_ITEM_QUANTITY);
if (newQuantity === MAX_ITEM_QUANTITY && existing.quantity + (item.quantity || 1) > MAX_ITEM_QUANTITY) {
  toast({ message: `Maximum ${MAX_ITEM_QUANTITY} per item`, type: "warning" });
}

// In addItem, when cart full:
if (items.length >= MAX_CART_ITEMS) {
  toast({ message: `Cart is full (max ${MAX_CART_ITEMS} items)`, type: "warning" });
  return;
}
```

### BUG-07: Refund Status Migration
```sql
-- Add refund_status column
ALTER TABLE orders ADD COLUMN refund_status text NOT NULL DEFAULT 'none'
  CHECK (refund_status IN ('none', 'partial', 'full'));

-- Create trigger to auto-compute
CREATE OR REPLACE FUNCTION compute_order_refund_status()
RETURNS TRIGGER AS $$
DECLARE
  total_qty integer;
  total_refunded integer;
BEGIN
  SELECT COALESCE(SUM(quantity), 0), COALESCE(SUM(COALESCE(refunded_quantity, 0)), 0)
  INTO total_qty, total_refunded
  FROM order_items
  WHERE order_id = NEW.order_id;

  UPDATE orders
  SET refund_status = CASE
    WHEN total_refunded = 0 THEN 'none'
    WHEN total_refunded >= total_qty THEN 'full'
    ELSE 'partial'
  END
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_refund_status
AFTER UPDATE OF refunded_quantity ON order_items
FOR EACH ROW EXECUTE FUNCTION compute_order_refund_status();
```

### BUG-08: Price Drift Detection
```typescript
// After validateCartItems() succeeds, compare prices:
const priceDrifts: Array<{ itemIndex: number; field: string; cartPrice: number; dbPrice: number }> = [];

for (let i = 0; i < input.items.length; i++) {
  const cartItem = input.items[i];
  const dbItem = menuItems.get(cartItem.menuItemId);
  if (!dbItem) continue;

  // Check base price
  if (cartItem.basePriceCents !== undefined && cartItem.basePriceCents !== dbItem.base_price_cents) {
    priceDrifts.push({ itemIndex: i, field: "base_price", cartPrice: cartItem.basePriceCents, dbPrice: dbItem.base_price_cents });
  }

  // Check modifier prices
  for (const mod of cartItem.modifiers) {
    const dbMod = modifierOptions.get(mod.optionId);
    if (dbMod && mod.priceDeltaCents !== undefined && mod.priceDeltaCents !== dbMod.price_delta_cents) {
      priceDrifts.push({ itemIndex: i, field: "modifier_price", cartPrice: mod.priceDeltaCents, dbPrice: dbMod.price_delta_cents });
    }
  }
}

if (priceDrifts.length > 0) {
  return errorResponse("PRICE_CHANGED", "Some prices have changed", 409, { priceDrifts });
}
```

## State of the Art

No technology changes relevant — all fixes use existing stack (Zod, Zustand, Supabase, Next.js App Router) at their current versions.

## Open Questions

1. **Checkout schema change for BUG-08:**
   - What we know: Current `checkoutItemSchema` doesn't include `basePriceCents` or modifier `priceDeltaCents`
   - What's unclear: Whether to add price fields to the schema or rely solely on DB comparison
   - Recommendation: Add `basePriceCents` to checkout schema so server can detect drift. Modifier prices need `priceDeltaCents` added to modifier schema.

2. **Customer order history for BUG-07:**
   - What we know: No `account/orders/page` exists (Glob returned empty)
   - What's unclear: Where customer order history is rendered
   - Recommendation: Search for order history components; may be in account dashboard or a different route pattern

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/app/api/checkout/session/route.ts` — checkout flow
- Codebase analysis: `src/lib/stores/cart-store.ts` — cart state management
- Codebase analysis: `src/lib/utils/delivery-dates.ts` — cutoff logic
- Codebase analysis: `src/lib/validations/checkout.ts` — Zod schemas
- Codebase analysis: `src/types/delivery.ts` — TIME_WINDOWS, CUTOFF constants
- Codebase analysis: `src/app/api/admin/orders/[id]/refund/route.ts` — refund logic
- Codebase analysis: `src/app/api/admin/orders/[id]/status/route.ts` — status transitions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use, patterns established
- Architecture: HIGH — surgical fixes within existing architecture
- Pitfalls: HIGH — bugs identified with exact line numbers

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable codebase, no external dependency changes)
