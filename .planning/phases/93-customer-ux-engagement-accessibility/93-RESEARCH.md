# Phase 93: Customer UX - Engagement & Accessibility - Research

**Researched:** 2026-03-03
**Domain:** Post-purchase engagement features + accessibility hardening
**Confidence:** HIGH

## Summary

Phase 93 has two distinct workstreams: (1) post-purchase engagement features (reorder, rating prompt, order sharing) and (2) accessibility hardening across interactive elements (focus rings, keyboard delete, aria-labels, form error linking, icon+color status, tilt keyboard fix). Both build on Phase 92's customer UX foundation.

The codebase is well-prepared for this phase. Key existing assets: reorder API route already exists (`/api/account/orders/[id]/reorder`), the `OrdersTab` already has a working reorder handler, `driver_ratings` table exists with full schema, rating API route (`/api/orders/[id]/rating`) with GET+POST is complete, `DeliveryFeedbackForm` and `StarRating` components are built, `ShareButton` exists with Web Share API + clipboard fallback, and `ValidatedInput` already has `aria-invalid` and `aria-describedby`. The primary work is wiring existing pieces into new locations and filling accessibility gaps.

**Primary recommendation:** Leverage existing reorder/rating/share infrastructure. Most work is UI wiring and accessibility attribute additions -- not new backend logic. The rating banner (CUX-12) and order sharing (CUX-13) require the most new code. StatusBadge icon mapping (CUX-18) is a single-component update. Accessibility items (CUX-14/15/16/17/19) are surgical attribute additions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Reorder flow (CUX-11)**
- Reorder button on BOTH order list cards (OrderCard) AND order detail page (/orders/[id])
- When cart has items: replace cart with confirmation dialog -- "Replace X items in cart with order #Y?"
- Unavailable items: skip them, add available items, show toast -- "2 of 5 items unavailable -- added 3 to cart"
- After reorder completes: open cart drawer showing the reordered items for review
- Reorder fetches order_items from Supabase and calls addItem() for each available item

**Rating prompt (CUX-12)**
- Rating prompt appears as a dismissible banner at top of /orders/[id] page after order status = "delivered"
- Tapping the banner navigates to existing /orders/[id]/feedback page (DeliveryFeedbackForm)
- Banner persists until user rates OR explicitly dismisses (dismissed state stored in DB -- `rating_dismissed` boolean on orders or ratings table)
- Admin view: simple ratings list page -- order #, customer name, stars, text feedback, date. Sortable by date/stars
- Ratings show customer identity (name visible to admin) -- useful for family business follow-up
- Existing DeliveryFeedbackForm + StarRating components are reused as-is

**Order sharing (CUX-13)**
- Share/copy button on order detail page header (/orders/[id]) -- icon button next to back navigation
- Shared content: URL only -- `{origin}/orders/{shareToken}/share`
- Shared page shows order summary: item names, quantities, total -- NO customer name, address, or payment details
- Fully public access -- no auth required. Link uses a random share_token (not order ID) so links aren't guessable
- Reuses existing ShareButton component (Web Share API + clipboard fallback)

**Status indicator icons (CUX-18)**
- Match StatusStepper icon set: ShieldCheck (confirmed), ChefHat (preparing), Truck (in transit), Package (delivered), Clock (pending), XCircle (cancelled)
- Icon placement: icon before text in badge -- "icon Confirmed" pattern
- Include refund statuses: DollarSign (refunded), AlertCircle (partial refund), Clock (refund pending)
- Apply to both admin tables AND customer views -- single StatusBadge component update

**Focus rings (CUX-14)**
- Add visible focus-visible ring to UnifiedMenuItemCard article element
- Follow established pattern: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none`
- Ensure AddButton and any interactive sub-elements within cards also have focus rings

**Keyboard cart delete (CUX-15)**
- Add Delete key handler on CartItem -- triggers removal with confirmation
- Confirmation: reuse existing pattern (not a new modal -- inline or toast-based undo)
- Screen reader announcement on delete: "Item removed from cart"

**Drawer aria-labels (CUX-16)**
- Add aria-label to ItemDetailSheet Drawer/Modal (e.g., "Item details for {itemName}")
- Audit all drawer/modal instances for descriptive aria-labels
- Pattern already correct in CartDrawer ("Your Cart") and base Drawer component

**Form error linking (CUX-17)**
- Add aria-invalid="true" to ValidatedInput when errors are present (currently missing)
- Audit modifier group forms in ItemDetailSheet for aria-describedby linkage
- Existing ValidatedInput pattern (errorId, helperId, describedBy) is the standard -- extend to all forms

**3D tilt on keyboard focus (CUX-19)**
- Disable tilt effect when card receives keyboard focus (Tab navigation)
- Add onFocus handler that does NOT trigger tilt (currently only mouse/touch activates tilt)
- Focus ring must remain visible -- tilt transform should not obscure outline
- useAnimationPreference already gates tilt globally for reduced-motion users

### Claude's Discretion
- Confirmation dialog design for cart replacement (modal vs inline)
- Rating banner visual design and animation
- Share page layout and styling
- Exact keyboard navigation pattern for cart items (arrow keys optional)
- Which modifier forms need aria-describedby audit (scope based on code review)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CUX-11 | User can one-tap reorder from order history | Reorder API exists (`/api/account/orders/[id]/reorder`). OrdersTab has working handler. Need: add to OrderCard + order detail page, cart replacement dialog, cart drawer open after reorder |
| CUX-12 | Rating prompt appears after delivery confirmation | `driver_ratings` table exists. API route exists. DeliveryFeedbackForm exists. Need: rating banner component on order detail, `rating_dismissed` column migration, admin ratings page |
| CUX-13 | User can copy shareable order link | ShareButton exists. Need: `share_token` column migration, share token generation on order creation, public share page (`/orders/[shareToken]/share`), wire ShareButton to order detail header |
| CUX-14 | Interactive cards have visible focus rings | UnifiedMenuItemCard has `tabIndex={0}` and `onKeyDown` but no `focus-visible:ring-*` classes on article. Pattern exists in 234 instances across codebase |
| CUX-15 | Cart items deletable via keyboard with confirmation | CartItem has trash button with focus ring. Need: `onKeyDown` handler for Delete key, confirmation UX (toast-based undo pattern), `aria-live` announcement |
| CUX-16 | Drawer handles have descriptive aria-labels | Drawer component supports `title` prop mapped to `aria-label`. ItemDetailSheet passes no title to Drawer. Need: pass `title` to Drawer in ItemDetailSheet, audit other instances |
| CUX-17 | Form errors linked to fields via aria-describedby | ValidatedInput ALREADY has `aria-invalid={state === "invalid"}` and `aria-describedby`. ModifierGroup uses RadioGroup/Checkbox without error linking. Need: audit modifier validation errors |
| CUX-18 | Status indicators use icons alongside color | StatusBadge is color-only. StatusStepper has icon mapping (ShieldCheck, ChefHat, Truck, Package). Need: add icon prop + mapping to StatusBadge, apply everywhere StatusBadge is used |
| CUX-19 | 3D tilt disabled on keyboard focus | useTiltEffect only activates on mouse/touch events. Need: add `isFocused` state to disable tilt style when keyboard-focused, ensure focus ring renders without transform interference |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | UI framework | Project stack |
| Next.js 16 | 16.x | App Router, SSR pages, API routes | Project stack |
| Zustand | latest | Cart store, cart drawer state | `useCartStore`, `useCartDrawer` |
| Framer Motion | latest | Animations via `m` import | Spring physics, AnimatePresence |
| Lucide React | latest | Icons (ShieldCheck, ChefHat, Truck, Package, etc.) | Already used throughout |
| Supabase | latest | DB, Auth, RLS | Ratings table, share tokens |
| sonner (toast) | latest | Toast notifications via `@/lib/hooks/useToastV8` | Undo-pattern, reorder feedback |
| Zod | latest | Request validation | Rating schema validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| uuid (v4) | latest | Generate share tokens | CUX-13 share_token generation |
| date-fns | latest | Date formatting | Admin ratings list |

### No New Libraries Needed
All requirements are achievable with existing dependencies.

## Architecture Patterns

### Recommended Project Structure (New Files)
```
supabase/migrations/
  036_rating_dismissed_share_token.sql  # New migration

src/app/(customer)/orders/[id]/
  page.tsx                              # Modified: add rating banner, reorder, share
  RatingBanner.tsx                      # New: dismissible rating prompt
  ReorderButton.tsx                     # New: reorder with confirmation dialog

src/app/(public)/shared/[shareToken]/
  page.tsx                              # New: public order share page

src/app/(admin)/admin/ratings/
  page.tsx                              # New: admin ratings list

src/components/ui/admin/
  StatusBadge.tsx                       # Modified: add icon support

src/components/ui/orders/
  OrderCard.tsx                         # Modified: add reorder button

src/components/ui/cart/CartItem/
  CartItem.tsx                          # Modified: keyboard Delete handler

src/components/ui/menu/UnifiedMenuItemCard/
  UnifiedMenuItemCard.tsx               # Modified: focus ring, tilt keyboard fix
  useTiltEffect.ts                      # Modified: focus state awareness

src/components/ui/menu/
  ItemDetailSheet.tsx                   # Modified: pass aria-label to Drawer

src/components/ui/FormValidation/
  ValidatedInput.tsx                    # No changes needed (already has aria-invalid)
```

### Pattern 1: Reorder with Cart Replacement
**What:** Reorder calls existing API, handles cart replacement with confirmation
**When to use:** CUX-11 implementation
**Key insight:** `OrdersTab` already has a working `handleReorder()` -- extract and enhance it.

The existing OrdersTab reorder handler:
1. Calls `/api/account/orders/${orderId}/reorder` POST
2. Clears cart, adds items, shows warnings toast
3. Navigates to `/cart`

Enhancement needed:
1. Check if cart has items first
2. Show confirmation dialog if cart non-empty
3. After adding items, open cart drawer (via `useCartDrawer.getState().open()`) instead of navigating
4. Show precise toast: "2 of 5 items unavailable -- added 3 to cart"

### Pattern 2: Server Component with Client Islands (Order Detail Page)
**What:** Order detail page is a server component; rating banner + reorder button are client components
**When to use:** CUX-11, CUX-12, CUX-13 on `/orders/[id]/page.tsx`
**Key insight:** The page already fetches order data server-side. Pass `order.status`, `order.id` as props to client components.

```typescript
// In order detail page (server component):
{order.status === "delivered" && (
  <RatingBanner orderId={order.id} />
)}
<ReorderButton orderId={order.id} />
<ShareButton orderId={order.id} />
```

### Pattern 3: StatusBadge Icon Mapping
**What:** Single STATUS_ICONS map + conditional icon rendering
**When to use:** CUX-18
```typescript
const STATUS_ICONS: Record<string, React.FC<{ className?: string }>> = {
  pending: Clock,
  confirmed: ShieldCheck,
  preparing: ChefHat,
  in_transit: Truck,
  out_for_delivery: Truck,
  delivered: Package,
  completed: Package,
  cancelled: XCircle,
  failed: XCircle,
  active: ShieldCheck,
  inactive: XCircle,
  // Refund statuses
  refunded: DollarSign,
  partial: AlertCircle,
  refund_pending: Clock,
};
```

### Pattern 4: Keyboard Delete with Undo Toast
**What:** Delete key triggers removal with undo option in toast
**When to use:** CUX-15
```typescript
// CartItem onKeyDown handler:
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    const itemName = item.nameEn;
    removeItem(item.cartItemId);
    // Screen reader announcement
    announce(`${itemName} removed from cart`);
    toast({
      message: `${itemName} removed`,
      type: "info",
      // undo not natively supported by sonner, consider action button
    });
  }
}, [item, removeItem]);
```

### Anti-Patterns to Avoid
- **Don't duplicate reorder logic:** Extract from OrdersTab, share between OrderCard and order detail
- **Don't use order ID in share URLs:** Use random `share_token` (crypto.randomUUID()) for security
- **Don't add focus rings to non-interactive elements:** Only interactive elements (buttons, links, cards with onClick) get focus rings
- **Don't disable tilt on ALL focus events:** Only keyboard focus (`:focus-visible`) should disable tilt, not click-focus

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Share token generation | Custom random string | `crypto.randomUUID()` | Guaranteed uniqueness, URL-safe |
| Toast notifications | Custom toast system | `@/lib/hooks/useToastV8` (sonner) | Already integrated, consistent UX |
| Focus ring styling | Custom CSS per component | `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` | 234 instances establish this pattern |
| Cart drawer control | Custom open/close state | `useCartDrawer` Zustand store | Already provides `open()`, `close()`, `toggle()` |
| Rating submission | New API route | Existing `/api/orders/[id]/rating` POST | Complete with validation, auth, rate limiting |
| Rating retrieval | New query | Existing `/api/orders/[id]/rating` GET | Returns `hasRating` + rating data |
| Screen reader announcements | Custom aria-live region | `aria-live="assertive"` div or existing patterns | Standard WCAG approach |

## Common Pitfalls

### Pitfall 1: ValidatedInput aria-invalid Already Exists
**What goes wrong:** CONTEXT.md says "currently missing" but code shows `aria-invalid={state === "invalid"}` is already present (line 256 of ValidatedInput.tsx)
**Why it happens:** Requirements written before thorough code audit
**How to avoid:** CUX-17 scope reduces to auditing ModifierGroup and other forms, NOT ValidatedInput
**Warning signs:** Duplicate attributes cause React warnings

### Pitfall 2: Existing Reorder Handler Clears Cart Without Confirmation
**What goes wrong:** OrdersTab's `handleReorder()` calls `clearCart()` unconditionally (line 116)
**Why it happens:** Initial implementation lacked the confirmation UX requirement
**How to avoid:** Add cart-empty check before clearing; show dialog if cart non-empty
**Warning signs:** User loses cart items without warning on reorder

### Pitfall 3: Rating Table is `driver_ratings` Not `ratings`
**What goes wrong:** CONTEXT.md refers to "ratings table" but the schema uses `driver_ratings`
**Why it happens:** Naming convention in requirements vs schema
**How to avoid:** Use existing `driver_ratings` table. Add `rating_dismissed` as a new column on `orders` table (not ratings) for simpler queries
**Warning signs:** Schema mismatch if creating a new `ratings` table

### Pitfall 4: 3D Tilt Transform Can Obscure Focus Ring
**What goes wrong:** CSS `transform: rotateX(...)` with `perspective` can clip `outline` or `ring` on the card
**Why it happens:** 3D transforms create new stacking contexts and coordinate spaces
**How to avoid:** When keyboard focused, set tilt rotations to 0 AND ensure `outline-offset` or `ring-offset` is sufficient
**Warning signs:** Focus ring visually appears behind or clipped by 3D-transformed card

### Pitfall 5: Order Detail Page is Server Component
**What goes wrong:** Trying to add client-side interactivity (reorder, share, rating banner) directly in the server component
**Why it happens:** Page file is async function (RSC)
**How to avoid:** Create separate client components (RatingBanner, ReorderButton) and compose them in the server component page
**Warning signs:** `useState`/`useEffect` in server component causes build error

### Pitfall 6: Share Page Route Must Be Public (No Auth)
**What goes wrong:** Putting share page under `(customer)` route group which has auth middleware
**Why it happens:** Copy-paste from existing order pages
**How to avoid:** Place share page under `(public)` route group: `src/app/(public)/shared/[shareToken]/page.tsx`
**Warning signs:** Shared link requires login, defeating the purpose

### Pitfall 7: Migration Numbering
**What goes wrong:** Migration number conflicts with existing files
**Why it happens:** Mixed numbering schemes (000-035 sequential, then 20260214 timestamp format)
**How to avoid:** Latest sequential is 035. Use 036 for this phase's migration
**Warning signs:** Supabase rejects migration due to duplicate number

## Code Examples

### Rating Banner Component (CUX-12)
```typescript
// RatingBanner.tsx - Client component on order detail
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface RatingBannerProps {
  orderId: string;
}

export function RatingBanner({ orderId }: RatingBannerProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if rating exists or was dismissed
    async function checkRating() {
      const res = await fetch(`/api/orders/${orderId}/rating`);
      const data = await res.json();
      if (!data.hasRating) {
        // Also check dismissed flag
        const supabase = createClient();
        const { data: order } = await supabase
          .from("orders")
          .select("rating_dismissed")
          .eq("id", orderId)
          .single();
        if (!order?.rating_dismissed) {
          setVisible(true);
        }
      }
    }
    checkRating();
  }, [orderId]);

  const handleDismiss = async () => {
    setDismissed(true);
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ rating_dismissed: true })
      .eq("id", orderId);
  };

  if (!visible || dismissed) return null;

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-xl bg-saffron/10 border border-saffron/20 p-4 mb-6"
        role="status"
      >
        {/* Banner content */}
      </m.div>
    </AnimatePresence>
  );
}
```

### Tilt Focus Guard (CUX-19)
```typescript
// In useTiltEffect.ts - add focus awareness
const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);

const handleFocus = useCallback(() => {
  // Only flag keyboard focus (not click focus)
  // :focus-visible heuristic: if last input was keyboard
  setIsKeyboardFocused(true);
  mouseX.set(0.5);
  mouseY.set(0.5);
}, [mouseX, mouseY]);

const handleBlur = useCallback(() => {
  setIsKeyboardFocused(false);
}, []);

// tiltStyle should return empty when keyboard focused
const tiltStyle = enabled && !isKeyboardFocused
  ? { rotateX, rotateY, ... }
  : {};
```

### Keyboard Delete Handler (CUX-15)
```typescript
// In CartItem.tsx - add to m.div
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    triggerHaptic("medium");
    removeItem(item.cartItemId);
    // Announce to screen readers
  }
}, [item.cartItemId, removeItem]);

// On the container m.div:
<m.div
  tabIndex={0}
  onKeyDown={handleKeyDown}
  aria-label={`${item.nameEn}, quantity ${item.quantity}, ${formatPrice(itemTotal)}`}
  // ...existing props
>
```

### Migration for CUX-12 + CUX-13
```sql
-- 036_rating_dismissed_share_token.sql

-- CUX-12: Add rating_dismissed flag to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating_dismissed BOOLEAN NOT NULL DEFAULT FALSE;

-- CUX-13: Add share_token to orders for public sharing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Index for share token lookups
CREATE INDEX IF NOT EXISTS idx_orders_share_token ON orders(share_token) WHERE share_token IS NOT NULL;

-- RLS: allow public read of share page data via share_token
-- (handled by API route, not direct client query)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `aria-disabled` for sold-out | `opacity-60 cursor-not-allowed` | Phase 92 | CUX-14: focus rings should still work on sold-out |
| Color-only status badges | Icon + color badges (CUX-18) | This phase | WCAG 1.4.1 compliance |
| Mouse-only tilt | Mouse + touch tilt with keyboard guard | This phase | WCAG 2.1.1 keyboard accessible |

## Open Questions

1. **`rating_dismissed` column location**
   - What we know: Needs to persist per-order whether user dismissed the rating banner
   - Options: column on `orders` table (simpler query) vs column on `driver_ratings` table (semantic)
   - Recommendation: `orders.rating_dismissed` -- simpler to query in the server component page, no need to join driver_ratings just to check dismissal

2. **Share token generation timing**
   - What we know: Need `share_token` on orders for public sharing
   - Options: generate on order creation vs generate on first share click
   - Recommendation: Generate on first share click (lazy) -- saves DB writes on orders that are never shared. Use an API route that generates + returns the token.

3. **Reorder button placement on OrderCard**
   - What we know: CONTEXT says both OrderCard and order detail page
   - What's unclear: OrderCard is used in `(customer)/orders/page.tsx` via `OrderCard` component. But `OrdersTab` (account page) already has reorder built in.
   - Recommendation: Add reorder to the standalone `OrderCard` component (used on orders list page). The `OrdersTab` already handles reorder independently.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all referenced files
- `src/components/ui/admin/StatusBadge.tsx` -- current color-only implementation
- `src/components/ui/cart/CartItem/CartItem.tsx` -- swipe delete, no keyboard handler
- `src/components/ui/menu/UnifiedMenuItemCard/useTiltEffect.ts` -- mouse/touch only activation
- `src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx` -- tabIndex=0, no focus ring classes
- `src/components/ui/FormValidation/ValidatedInput.tsx` -- already has aria-invalid + aria-describedby
- `src/components/ui/Drawer.tsx` -- supports `title` prop as `aria-label`
- `src/components/ui/menu/ItemDetailSheet.tsx` -- no title passed to Drawer
- `src/app/api/orders/[id]/rating/route.ts` -- complete POST/GET handlers
- `src/app/api/account/orders/[id]/reorder/route.ts` -- complete reorder API
- `src/components/ui/account/OrdersTab/OrdersTab.tsx` -- working reorder handler
- `src/lib/stores/cart-store.ts` -- addItem, clearCart, removeItem
- `src/lib/hooks/useCartDrawer.ts` -- open/close/toggle
- `supabase/migrations/000_initial_schema.sql` -- driver_ratings table schema
- `src/components/ui/orders/tracking/ShareButton.tsx` -- Web Share API pattern
- `src/components/ui/orders/tracking/StatusStepper.tsx` -- icon mapping reference

### Secondary (MEDIUM confidence)
- WCAG 2.1 SC 1.4.1 (color not sole visual means) -- basis for CUX-18
- WCAG 2.1 SC 2.1.1 (keyboard accessible) -- basis for CUX-15, CUX-19
- WCAG 2.1 SC 4.1.3 (status messages) -- basis for screen reader announcements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, no new dependencies
- Architecture: HIGH -- patterns established in 95 phases, all referenced files inspected
- Pitfalls: HIGH -- identified from direct code inspection, not speculation
- Accessibility: HIGH -- WCAG requirements are well-documented standards

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable -- no fast-moving external dependencies)
