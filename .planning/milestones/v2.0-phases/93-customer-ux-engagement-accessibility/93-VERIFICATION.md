---
phase: 93-customer-ux-engagement-accessibility
verified: 2026-03-03T23:55:00Z
status: human_needed
score: 13/13 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 12/13
  gaps_closed:
    - "Admin ratings page lists submitted ratings with order number, customer name, stars, feedback, date"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Tab-navigate to a menu card and visually confirm focus ring appears and 3D tilt is flat"
    expected: "Visible blue ring around card, card remains flat (no 3D rotation)"
    why_human: "Focus ring visual appearance cannot be verified programmatically"
  - test: "Navigate to a delivered order detail page and verify rating banner appears"
    expected: "Saffron-colored banner with star icon, 'How was your order?', Rate now button, and X dismiss button"
    why_human: "Banner visibility depends on runtime API and DB state, not statically verifiable"
  - test: "Press Delete or Backspace on a focused cart item and verify removal with toast"
    expected: "Item removed from cart, toast notification 'Item name removed from cart'"
    why_human: "Keyboard interaction requires browser/app runtime"
  - test: "Dismiss rating banner on a delivered order, reload page, confirm banner stays hidden"
    expected: "Banner does not reappear after reload (dismissal persisted to DB)"
    why_human: "Requires Supabase write to rating_dismissed and page reload to verify"
---

# Phase 93: Customer UX Engagement + Accessibility Verification Report

**Phase Goal:** Post-purchase engagement features work and all interactive elements meet accessibility standards
**Verified:** 2026-03-03T23:55:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (admin ratings join path fixed)

---

## Re-verification Summary

**Gap closed:** The admin ratings page previously used `profiles!driver_ratings_user_id_fkey` — a FK that does not exist in any migration. The fix replaces that broken direct join with a two-hop join through orders: `orders!inner ( id, profiles ( full_name ) )`. This traverses the valid `driver_ratings.order_id -> orders.id -> orders.user_id -> profiles.id` path.

**Changes verified:**
- `src/app/(admin)/admin/ratings/page.tsx` — query now reads `orders!inner ( id, profiles ( full_name ) )` (lines 112-117)
- `src/types/database.ts` — `DriverRatingsRow`, `DriverRatingsInsert`, `DriverRatingsUpdate` contain no `user_id` field
- `src/types/database.ts` — `driver_ratings` Relationships array contains only three FK entries: `driver_ratings_order_id_fkey`, `driver_ratings_driver_id_fkey`, `driver_ratings_route_stop_id_fkey`. The stale `driver_ratings_user_id_fkey` entry is absent.
- No other file in `src/` references `driver_ratings_user_id_fkey`

**Join path validity:**
- `driver_ratings_order_id_fkey` — confirmed in DB schema and TypeScript types: `driver_ratings.order_id -> orders.id`
- `orders_user_id_fkey` — confirmed in DB schema and TypeScript types: `orders.user_id -> profiles.id`
- Supabase query traversal `orders!inner ( id, profiles ( full_name ) )` is now resolvable at runtime

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Orders table has rating_dismissed boolean column | VERIFIED | Migration 036 line 5: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating_dismissed BOOLEAN NOT NULL DEFAULT FALSE` |
| 2 | Orders table has share_token text column with unique index | VERIFIED | Migration 036 lines 8-11: UNIQUE TEXT column + partial index |
| 3 | POST /api/orders/:id/share-token generates and returns a share token lazily | VERIFIED | `src/app/api/orders/[id]/share-token/route.ts` — checks existing token, generates via `crypto.randomUUID()`, returns `{ shareToken, shareUrl }` |
| 4 | Public share page at /orders/:shareToken/share renders order summary without auth | VERIFIED | `src/app/(public)/orders/[shareToken]/share/page.tsx` — uses `createServiceClient()` (service role), queries by `eq("share_token", shareToken)`, renders items/totals, calls `notFound()` on missing token |
| 5 | Admin ratings page lists submitted ratings with order number, customer name, stars, feedback, date | VERIFIED | `src/app/(admin)/admin/ratings/page.tsx` — query uses `orders!inner ( id, profiles ( full_name ) )` traversing `driver_ratings.order_id -> orders.user_id -> profiles.full_name`. Both FK hops exist in schema and types. `r.orders.profiles?.full_name ?? "Unknown"` renders name. |
| 6 | Admin ratings page supports sorting by date or stars via query param | VERIFIED | `?sort=stars` branches to `order("rating", {ascending:false})`, default is `order("submitted_at", {ascending:false})`. Sort toggle links present. |
| 7 | StatusBadge renders an icon before the label for every status | VERIFIED | `STATUS_ICONS` map in `StatusBadge.tsx` covers 14 statuses. `Icon && <Icon className={iconClasses} aria-hidden="true" />` renders before `{displayLabel}` |
| 8 | UnifiedMenuItemCard has visible focus ring on keyboard Tab navigation | VERIFIED | `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none` on `m.article` + `tabIndex={0}` |
| 9 | 3D tilt effect is disabled when card receives keyboard focus | VERIFIED | `useTiltEffect.ts` — `isKeyboardFocused` state, `handleFocus/handleBlur` callbacks, `tiltStyle = enabled && !isKeyboardFocused ? {...} : {}`. `onFocus={handleFocus}` and `onBlur={handleBlur}` wired to article element. |
| 10 | Cart items can be deleted by pressing Delete or Backspace key | VERIFIED | `CartItem.tsx` — `handleKeyDown` on `m.div` with `tabIndex={0}`: `e.key === "Delete" \|\| e.key === "Backspace"` triggers `removeItem` + `toast({message: \`${item.nameEn} removed from cart\`, type: "info"})` |
| 11 | ItemDetailSheet Drawer has a descriptive aria-label with item name | VERIFIED | `ItemDetailSheet.tsx` line 464: `title={item?.nameEn ? \`Item details for ${item.nameEn}\` : "Item details"}` on mobile Drawer |
| 12 | User can tap Reorder on order card or order detail page and items are added to cart | VERIFIED | `OrderCard.tsx` has reorder button for `["delivered", "confirmed"]` statuses. `useReorder.ts` calls POST `/api/account/orders/${orderId}/reorder`, clears cart, adds items, opens cart drawer. `ReorderButton.tsx` renders in order detail page. |
| 13 | Rating banner appears on delivered order detail page until rated or dismissed | VERIFIED | `RatingBanner.tsx` — dual check: `GET /api/orders/${orderId}/rating` (hasRating) + Supabase client query for `rating_dismissed`. `order.status === "delivered" && <RatingBanner orderId={order.id} />` in order detail page. |

**Score:** 13/13 truths verified

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/036_rating_dismissed_share_token.sql` | DB columns for rating dismissal and order sharing | VERIFIED | Contains `rating_dismissed` boolean and `share_token` text with partial unique index |
| `src/app/api/orders/[id]/share-token/route.ts` | Lazy share token generation endpoint | VERIFIED | POST handler with auth check, lazy UUID generation, idempotent return |
| `src/app/(public)/orders/[shareToken]/share/page.tsx` | Public order share page | VERIFIED | Contains `share_token` query, service role client, OG metadata |
| `src/app/(admin)/admin/ratings/page.tsx` | Admin ratings list view | VERIFIED | Query uses `orders!inner ( id, profiles ( full_name ) )` — both FK hops exist in DB schema and TypeScript types. Customer names resolve correctly at runtime. |

### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/ui/admin/StatusBadge.tsx` | Icon + color status badges for WCAG 1.4.1 | VERIFIED | `STATUS_ICONS` map with 14 LucideIcon entries; icon rendered before label |
| `src/components/ui/menu/UnifiedMenuItemCard/useTiltEffect.ts` | Keyboard focus guard on tilt effect | VERIFIED | `isKeyboardFocused` state + `handleFocus`/`handleBlur` callbacks; `tiltStyle` returns `{}` when keyboard-focused |
| `src/components/ui/cart/CartItem/CartItem.tsx` | Keyboard Delete handler with haptic + toast | VERIFIED | `handleKeyDown` with Delete/Backspace, `tabIndex={0}`, `role="group"`, `aria-label` |
| `src/components/ui/menu/ItemDetailSheet.tsx` | Aria-label on Drawer with item name | VERIFIED | `title` prop on mobile Drawer at line 464 |

### Plan 03 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/hooks/useReorder.ts` | Reorder logic with cart replacement | VERIFIED | Exports `useReorder`, calls reorder API, clears cart, adds items, opens drawer, shows warning toast |
| `src/app/(customer)/orders/[id]/ReorderButton.tsx` | Reorder button with confirmation dialog | VERIFIED | Uses `useReorder`, AlertDialog for cart replacement, RotateCcw icon |
| `src/app/(customer)/orders/[id]/RatingBanner.tsx` | Dismissible rating prompt banner | VERIFIED | Contains `rating_dismissed`, dual-check logic, AnimatePresence exit animation, DB persist on dismiss |
| `src/app/(customer)/orders/[id]/OrderShareButton.tsx` | Share button calling share-token API | VERIFIED | Calls POST `/api/orders/${orderId}/share-token`, Web Share API with clipboard fallback |
| `src/components/ui/orders/OrderCard.tsx` | Order card with reorder button | VERIFIED | Contains `useReorder`, reorder button for `["delivered", "confirmed"]` statuses |
| `src/app/(customer)/orders/[id]/page.tsx` | Order detail with rating banner, reorder, and share | VERIFIED | Imports and renders `RatingBanner`, `ReorderButton`, `OrderShareButton` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/orders/[id]/share-token/route.ts` | `orders.share_token` | Supabase update + select | WIRED | `crypto.randomUUID()` + `.update({ share_token: shareToken })` |
| `src/app/(public)/orders/[shareToken]/share/page.tsx` | `orders + order_items` | Supabase query by share_token | WIRED | `.eq("share_token", shareToken)` with `order_items(name_snapshot, quantity, line_total_cents, order_item_modifiers(...))` |
| `src/app/(admin)/admin/ratings/page.tsx` | `driver_ratings + orders + profiles` | Supabase join via orders | WIRED | `orders!inner ( id, profiles ( full_name ) )` — traverses `driver_ratings.order_id -> orders.id -> orders.user_id -> profiles.id`. Both FK hops confirmed in schema and types. |
| `src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx` | `useTiltEffect` | focus/blur handlers | WIRED | `onFocus={handleFocus}` and `onBlur={handleBlur}` on `m.article` element |
| `src/lib/hooks/useReorder.ts` | `/api/account/orders/[id]/reorder` | fetch POST | WIRED | `fetch(\`/api/account/orders/${orderId}/reorder\`, { method: "POST" })` with `result.data.cartItems` destructuring matching API response |
| `src/lib/hooks/useReorder.ts` | `cart-store clearCart + addItem` | Zustand store actions | WIRED | `useCartStore.getState().clearCart()` + `addItem()` in loop |
| `src/app/(customer)/orders/[id]/RatingBanner.tsx` | `/api/orders/[id]/rating GET` | Check if rating exists | WIRED | `fetch(\`/api/orders/${orderId}/rating\`)` with `data.hasRating` check |
| `src/app/(customer)/orders/[id]/RatingBanner.tsx` | `orders.rating_dismissed` | Supabase client update | WIRED | `.update({ rating_dismissed: true }).eq("id", orderId)` in `handleDismiss` |
| `src/app/(customer)/orders/[id]/page.tsx` | `/api/orders/[id]/share-token POST` | OrderShareButton calls share token API | WIRED | `OrderShareButton` in page renders + calls `POST /api/orders/${orderId}/share-token` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CUX-11 | Plan 03 | User can one-tap reorder from order history | SATISFIED | `useReorder` hook + `ReorderButton` in order detail + reorder button in `OrderCard` for delivered/confirmed orders |
| CUX-12 | Plan 01 + 03 | Rating prompt after delivery (ratings table, POST API, admin view) | SATISFIED | Rating banner implemented and dismissal persists. Admin view lists ratings with customer names via `orders!inner -> profiles` join. |
| CUX-13 | Plan 01 + 03 | User can copy shareable order link | SATISFIED | `OrderShareButton` generates token via API and copies `/orders/{token}/share` URL via Web Share API or clipboard. Public share page renders without auth. |
| CUX-14 | Plan 02 | Interactive cards have visible focus rings | SATISFIED | `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none` on `m.article` with `tabIndex={0}` |
| CUX-15 | Plan 02 | Cart items deletable via keyboard | SATISFIED | `handleKeyDown` with Delete/Backspace, `tabIndex={0}`, toast notification |
| CUX-16 | Plan 02 | Drawer handles have descriptive aria-labels | SATISFIED | `ItemDetailSheet`, `CartDrawer` mobile, and `AddressStepV8` Drawer all have `title` prop |
| CUX-17 | Plan 02 | Form errors linked to fields via aria-describedby | SATISFIED | `ValidatedInput` has `aria-invalid` + `aria-describedby`. Audit confirmed `ModifierGroup` uses Radix primitives with built-in a11y. |
| CUX-18 | Plan 02 | Status indicators use icons alongside color | SATISFIED | `STATUS_ICONS` map with 14 Lucide icons in `StatusBadge.tsx`, renders `<Icon aria-hidden="true" />` before label text |
| CUX-19 | Plan 02 | 3D tilt disabled on keyboard focus | SATISFIED | `isKeyboardFocused` guard in `useTiltEffect.ts` returns empty `tiltStyle` during keyboard focus |

All 9 requirement IDs (CUX-11 through CUX-19) are satisfied. No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/(customer)/orders/[id]/RatingBanner.tsx` | 79 | `bg-saffron/10 border-saffron/20` color classes | Info | `saffron` is an established project design token used in 10+ existing files; not a violation |

No blockers found. The previously identified blocker (broken FK join in admin ratings) has been resolved.

---

## Human Verification Required

### 1. Focus Ring Visual Check

**Test:** Tab-navigate to a menu card using keyboard only
**Expected:** Visible blue ring appears around the card, 3D tilt transform is flat (no rotation)
**Why human:** Focus ring CSS rendering requires visual confirmation in browser

### 2. Rating Banner Appearance

**Test:** Log in as a customer, navigate to an order with status "delivered" that has not been rated or dismissed
**Expected:** Saffron-colored banner with "How was your order?" text, star icon, "Rate now" button, and X dismiss button
**Why human:** Banner visibility requires live API call and runtime DB state check

### 3. Cart Keyboard Delete

**Test:** Tab to a cart item, press Delete or Backspace
**Expected:** Item removed from cart immediately; toast notification appears with item name + "removed from cart"
**Why human:** Requires browser keyboard interaction at runtime

### 4. Rating Banner Dismissal Persistence

**Test:** Dismiss rating banner on a delivered order, then reload the page
**Expected:** Banner does not reappear after reload (dismissal persisted to DB)
**Why human:** Requires Supabase write to `rating_dismissed` and page reload to verify

---

## Gaps Summary

No functional gaps remain. The sole gap from initial verification — the admin ratings page joining `profiles` via a non-existent `user_id` FK on `driver_ratings` — has been resolved. The query now traverses the valid two-hop path: `driver_ratings.order_id -> orders.id`, then `orders.user_id -> profiles.id`. TypeScript types confirm no `user_id` field or stale FK relationship remain in `DriverRatingsRow`, `DriverRatingsInsert`, `DriverRatingsUpdate`, or the `driver_ratings` Relationships array.

All 13 observable truths pass. All 9 requirement IDs (CUX-11 through CUX-19) are satisfied. Phase goal is achieved pending human verification of runtime browser behavior.

---

*Verified: 2026-03-03T23:55:00Z*
*Verifier: Claude (gsd-verifier)*
