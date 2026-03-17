# Phase 96: Integration Wiring & Dead Code Resolution - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire checkout data (tip, promo, delivery instructions) to order detail page display, fix reorder slug bug (UUID→slug), and remove confirmed-dead price drift code. Closes 3 integration gaps and 3 broken flows from v2.0 audit.

</domain>

<decisions>
## Implementation Decisions

### Order detail totals display
- Tip and discount rendered as inline rows in the totals section, between Tax and Total
- Same conditional pattern as Tax: only rendered when non-zero
- Discount row shows code name + amount: "Discount (WELCOME10)" with negative amount in green (text-jade)
- Tip row shows "Tip" with amount

### Delivery instructions display
- Rendered inside the existing delivery address Card, below the address lines
- Italicized, same style as special instructions elsewhere on the page
- Only shown when delivery_instructions is non-null/non-empty

### Reorder slug fix
- useReorder.ts line 69 passes `item.menuItemId` (UUID) as `menuItemSlug` — must pass actual menu item slug
- Reorder API response needs to include slug from menu_items table join

### Dead code removal
- Remove `updatePricesFromServer` from cart-store.ts (line 251+)
- Remove 409 PRICE_CHANGED handler from PaymentStepV8.tsx (lines 143-144)
- Remove `updatePricesFromServer` type from cart.ts (line 55)
- Server never emits 409 PRICE_CHANGED — CHKT-02 downscoped to cleanup only

### Claude's Discretion
- Exact ordering of tip vs discount rows in totals
- Whether to add tip_cents/discount_cents/promo_code/delivery_instructions to OrderQueryResult interface or rely on `*` select
- How to source slug in reorder API (join menu_items or add slug to order_items snapshot)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `formatPrice()` from `@/lib/utils/currency`: Already used for all money display on order detail page
- `Card/CardContent` from `@/components/ui/card`: Used for delivery address card where instructions will go
- `text-jade` token: Used for FREE delivery fee display — reuse for discount negative amount

### Established Patterns
- Conditional row rendering: Tax row uses `{order.taxCents > 0 && ...}` — tip/discount follow same pattern
- `OrderQueryResult` interface at top of page.tsx defines query shape — needs tip/promo/instructions fields added
- Order transform block (lines 154-173) maps snake_case DB fields to camelCase Order type

### Integration Points
- `src/app/(customer)/orders/[id]/page.tsx`: Main order detail page — add fields to interface + display
- `src/lib/hooks/useReorder.ts`: Fix menuItemSlug assignment (line 69)
- `src/lib/stores/cart-store.ts`: Remove updatePricesFromServer
- `src/components/ui/checkout/PaymentStepV8.tsx`: Remove 409 handler
- `src/types/cart.ts`: Remove updatePricesFromServer type
- `src/types/order.ts`: May need tip/discount/promo/instructions fields added to Order type

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward integration wiring following existing receipt/card patterns on the order detail page.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 96-integration-wiring-dead-code*
*Context gathered: 2026-03-04*
