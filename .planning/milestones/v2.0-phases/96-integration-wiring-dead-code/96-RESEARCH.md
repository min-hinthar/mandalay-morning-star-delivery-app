# Phase 96: Integration Wiring & Dead Code Resolution - Research

**Researched:** 2026-03-04
**Domain:** Order detail display, reorder slug fix, dead code cleanup
**Confidence:** HIGH

## Summary

This phase addresses three distinct but small-scope problems: (1) wiring existing DB columns (tip_cents, discount_cents, promo_code, delivery_instructions) to the order detail page display, (2) fixing a reorder bug where UUID is passed as menuItemSlug, and (3) removing dead price-drift code that was never reachable from the server.

All changes are in well-understood, existing code paths. The DB schema already has the columns; the TypeScript types and UI just need updating. The reorder API already queries menu_items but doesn't select/return slug. The dead code locations are precisely identified.

**Primary recommendation:** Wire existing data through types and UI; no new infrastructure needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Tip and discount rendered as inline rows in totals section, between Tax and Total
- Same conditional pattern as Tax: only rendered when non-zero
- Discount row shows code name + amount: "Discount (WELCOME10)" with negative amount in green (text-jade)
- Tip row shows "Tip" with amount
- Delivery instructions rendered inside existing delivery address Card, below address lines
- Italicized, same style as special instructions elsewhere on the page
- Only shown when delivery_instructions is non-null/non-empty
- useReorder.ts line 69 passes `item.menuItemId` (UUID) as `menuItemSlug` -- must pass actual menu item slug
- Reorder API response needs to include slug from menu_items table join
- Remove `updatePricesFromServer` from cart-store.ts (line 251+)
- Remove 409 PRICE_CHANGED handler from PaymentStepV8.tsx (lines 143-144)
- Remove `updatePricesFromServer` type from cart.ts (line 55)
- Server never emits 409 PRICE_CHANGED -- CHKT-02 downscoped to cleanup only

### Claude's Discretion
- Exact ordering of tip vs discount rows in totals
- Whether to add tip_cents/discount_cents/promo_code/delivery_instructions to OrderQueryResult interface or rely on `*` select
- How to source slug in reorder API (join menu_items or add slug to order_items snapshot)

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHKT-02 | Cart auto-refreshes prices on 409 PRICE_CHANGED (downscoped to dead code cleanup) | Dead code locations identified: cart-store.ts:251-275, PaymentStepV8.tsx:142-151, cart.ts:55-61 |
| CHKT-06 | User can apply promo codes at checkout (audit: promo_code not displayed on order detail) | DB has `promo_code` + `discount_cents` on orders table; Order type + UI need wiring |
| CHKT-07 | User can add tip at checkout (audit: tip_cents not displayed on order detail) | DB has `tip_cents` on orders table; Order type + UI need wiring |
| CHKT-08 | User can add delivery instructions (audit: not rendered on order detail page) | DB has `delivery_instructions` on orders table; Order type + UI need wiring |
| CUX-11 | User can one-tap reorder from order history (audit: useReorder.ts passes UUID as menuItemSlug) | Reorder API needs slug from menu_items join; both useReorder.ts:69 and OrdersTab.tsx:120 have the bug |
</phase_requirements>

## Architecture Patterns

### Current Order Detail Page Structure
```
page.tsx (367 lines)
  OrderQueryResult interface (line 21) -- defines DB select shape
  Supabase select('*', ...) (line 86) -- fetches order + joins
  Transform block (lines 123-173) -- snake_case -> camelCase
  JSX totals section (lines 313-338) -- Subtotal, Delivery Fee, Tax, Total
  Delivery address Card (lines 250-271) -- address lines only
```

### Data Flow: DB -> Types -> UI

**Current state (missing fields):**
1. DB `orders` table has: `tip_cents`, `promo_code`, `discount_cents`, `delivery_instructions`
2. `OrdersRow` in `database.ts` (line 299): MISSING these 4 fields
3. `OrderQueryResult` in `page.tsx` (line 21): MISSING these 4 fields
4. `Order` type in `order.ts` (line 32): MISSING these 4 fields
5. Transform block in `page.tsx` (line 154): does NOT map these fields
6. UI totals section: does NOT render tip/discount rows

**Required wiring:**
1. Add 4 fields to `OrdersRow` / `OrdersInsert` / `OrdersUpdate` in `database.ts`
2. Add 4 fields to `OrderQueryResult` in `page.tsx`
3. Add 4 camelCase fields to `Order` in `order.ts`
4. Add 4 field mappings in transform block
5. Add conditional tip/discount rows in totals JSX
6. Add delivery_instructions below address in delivery card

### Reorder Slug Bug

**Two locations with the same bug:**
1. `src/lib/hooks/useReorder.ts` line 69: `menuItemSlug: item.menuItemId`
2. `src/components/ui/account/OrdersTab/OrdersTab.tsx` line 120: `menuItemSlug: item.menuItemId`

**Root cause:** Reorder API (`/api/account/orders/[id]/reorder/route.ts`) does not return `slug`. The `CartItem` interface in the route (line 36) has `menuItemId` but no `slug`. The API already queries `menu_items` table (line 139) but only selects `id, name_en, base_price_cents, is_active, is_sold_out`.

**Fix chain:**
1. Add `slug` to `MenuItemRow` interface in route.ts
2. Add `slug` to menu_items select query
3. Add `slug` to `CartItem` interface in route.ts
4. Include `slug` in API response
5. Update `useReorder.ts` to use `item.slug` for `menuItemSlug`
6. Update `OrdersTab.tsx` to use `item.slug` for `menuItemSlug`

### Dead Code Removal

**Three precise deletions:**

| File | Lines | What | Why Dead |
|------|-------|------|----------|
| `src/lib/stores/cart-store.ts` | 247-275 | `updatePricesFromServer` method + JSDoc | Server never emits 409 PRICE_CHANGED |
| `src/components/ui/checkout/PaymentStepV8.tsx` | 141-151 | 409 PRICE_CHANGED handler block | Server never emits 409 PRICE_CHANGED |
| `src/types/cart.ts` | 51-61 | `updatePricesFromServer` type definition | No implementation after store removal |

**Safety check:** `updatePricesFromServer` is only referenced in these 3 files (verified via grep). No other consumers.

### Existing Patterns to Follow

**Conditional row rendering (Tax pattern):**
```typescript
// Source: order detail page.tsx line 328-333
{order.taxCents > 0 && (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">Tax</span>
    <span>{formatPrice(order.taxCents)}</span>
  </div>
)}
```

**Delivery address card (lines 250-270):**
```typescript
// Source: order detail page.tsx
<Card>
  <CardContent className="p-4 flex items-start gap-3">
    <div className="rounded-full bg-curry/10 p-2">
      <MapPin className="h-5 w-5 text-curry" />
    </div>
    <div>
      <p className="font-medium text-charcoal">Delivery Address</p>
      {/* address lines here */}
      {/* delivery_instructions goes BELOW address lines */}
    </div>
  </CardContent>
</Card>
```

**Special instructions italic pattern (line 294-296):**
```typescript
// Source: order detail page.tsx -- item-level instructions
<p className="text-xs text-muted-foreground italic mt-1">
  Note: {item.specialInstructions}
</p>
```

## Common Pitfalls

### Pitfall 1: OrdersRow Type Drift
**What goes wrong:** TypeScript types in `database.ts` don't match actual DB schema. Adding fields to `OrderQueryResult` and `Order` but forgetting `OrdersRow` causes type confusion.
**How to avoid:** Update all three type layers: `OrdersRow` (database.ts), `OrderQueryResult` (page.tsx), `Order` (order.ts).

### Pitfall 2: Missing Second Reorder Location
**What goes wrong:** Fixing `useReorder.ts` but missing the same bug in `OrdersTab.tsx` line 120.
**How to avoid:** Both locations must be fixed. The `ReorderCartItem` interface in both files needs `slug` field added.

### Pitfall 3: Dead Code Removal Breaking Tests
**What goes wrong:** Cart store tests may reference `updatePricesFromServer`.
**How to avoid:** Checked -- `cart-store.test.ts` does NOT test `updatePricesFromServer`. No test changes needed.

### Pitfall 4: Select * vs Explicit Fields
**What goes wrong:** The order detail page uses `select('*', ...)` which already returns tip_cents etc from DB, but TypeScript doesn't know about them because `OrderQueryResult` doesn't declare them.
**How to avoid:** Add the 4 fields to `OrderQueryResult` interface. The `*` select already fetches them.

### Pitfall 5: Negative Amount Display for Discount
**What goes wrong:** Discount should show as negative (e.g., "-$5.00") in green text.
**How to avoid:** Use `formatPrice(order.discountCents)` with a `-` prefix and `text-jade` class (same token used for FREE delivery fee display).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Price formatting | Custom cent-to-dollar | `formatPrice()` from `@/lib/utils/currency` | Already used everywhere on the page |
| Green color for discount | Custom color | `text-jade` design token | Used for FREE delivery fee, consistent |

## Code Examples

### Tip Row (between Tax and Total)
```typescript
// Pattern: same as tax conditional row
{order.tipCents > 0 && (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">Tip</span>
    <span>{formatPrice(order.tipCents)}</span>
  </div>
)}
```

### Discount Row (with promo code name)
```typescript
// Pattern: conditional + green negative amount
{order.discountCents > 0 && (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">
      Discount{order.promoCode ? ` (${order.promoCode})` : ''}
    </span>
    <span className="text-jade">-{formatPrice(order.discountCents)}</span>
  </div>
)}
```

### Delivery Instructions in Address Card
```typescript
// Pattern: italic text below address lines
{order.deliveryInstructions && (
  <p className="text-sm text-muted-foreground italic mt-2">
    {order.deliveryInstructions}
  </p>
)}
```

### Reorder API Slug Addition
```typescript
// In route.ts MenuItemRow interface, add slug:
interface MenuItemRow {
  id: string;
  slug: string; // ADD
  name_en: string;
  base_price_cents: number;
  is_active: boolean;
  is_sold_out: boolean;
}

// In menu_items select, add slug:
.select("id, slug, name_en, base_price_cents, is_active, is_sold_out")

// In CartItem interface, add slug:
interface CartItem {
  menuItemId: string;
  slug: string; // ADD
  // ...rest
}

// In response building:
cartItems.push({
  menuItemId: menuItem.id,
  slug: menuItem.slug, // ADD
  // ...rest
});
```

### Order Type Updates
```typescript
// In order.ts Order interface, add:
tipCents: number;
promoCode: string | null;
discountCents: number;
deliveryInstructions: string | null;

// In database.ts OrdersRow, add:
tip_cents: number;
promo_code: string | null;
discount_cents: number;
delivery_instructions: string | null;
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHKT-02 | Dead code removed, no updatePricesFromServer references | unit | `pnpm typecheck` (compilation verifies removal) | N/A |
| CHKT-06 | promo_code + discount_cents displayed on order detail | manual-only | Server component, needs browser verification | N/A |
| CHKT-07 | tip_cents displayed on order detail | manual-only | Server component, needs browser verification | N/A |
| CHKT-08 | delivery_instructions displayed on order detail | manual-only | Server component, needs browser verification | N/A |
| CUX-11 | Reorder passes slug not UUID | unit | `pnpm vitest run src/lib/stores/__tests__/cart-store.test.ts` | Exists (no reorder test) |

### Sampling Rate
- **Per task commit:** `pnpm typecheck && pnpm test`
- **Per wave merge:** `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None -- changes are type additions, UI wiring, and dead code removal. Existing test infrastructure (typecheck + cart-store tests) covers the core validations. The order detail page is a server component not easily unit-tested; typecheck confirms type correctness.

## File Impact Summary

| File | Change Type | Scope |
|------|-------------|-------|
| `src/types/database.ts` | Add fields | 4 fields to OrdersRow + OrdersInsert + OrdersUpdate |
| `src/types/order.ts` | Add fields | 4 fields to Order interface |
| `src/types/cart.ts` | Remove type | Delete updatePricesFromServer type (lines 51-61) |
| `src/app/(customer)/orders/[id]/page.tsx` | Add fields + UI | OrderQueryResult + transform + 3 new UI sections |
| `src/lib/stores/cart-store.ts` | Remove method | Delete updatePricesFromServer (lines 247-275) |
| `src/components/ui/checkout/PaymentStepV8.tsx` | Remove handler | Delete 409 block (lines 141-151) |
| `src/app/api/account/orders/[id]/reorder/route.ts` | Add slug | MenuItemRow + select + CartItem + response |
| `src/lib/hooks/useReorder.ts` | Fix slug | Line 69: `item.menuItemId` -> `item.slug` |
| `src/components/ui/account/OrdersTab/OrdersTab.tsx` | Fix slug | Line 120: `item.menuItemId` -> `item.slug` |

**Total: 9 files, all surgical changes.**

## Sources

### Primary (HIGH confidence)
- Direct code inspection of all 9 affected files
- Database schema `001_schema.sql` lines 163-191 (orders table with tip/promo/discount/instructions)
- Database schema `001_schema.sql` lines 96-112 (menu_items table with slug)
- Grep across codebase for `updatePricesFromServer` (4 references, all in 3 files)
- Grep across codebase for `menuItemSlug` (confirms bug in 2 locations)

## Metadata

**Confidence breakdown:**
- Order detail wiring: HIGH -- all columns verified in schema, types clearly missing them
- Reorder slug fix: HIGH -- bug confirmed at line 69 and line 120, API already queries menu_items
- Dead code removal: HIGH -- grep confirms exactly 3 files, no hidden consumers
- Test impact: HIGH -- cart-store.test.ts does not test updatePricesFromServer

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable codebase, no external dependencies)
