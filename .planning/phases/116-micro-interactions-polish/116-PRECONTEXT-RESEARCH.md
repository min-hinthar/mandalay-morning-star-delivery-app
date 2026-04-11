# Phase 116: Micro-Interactions & Polish — Pre-Context Research

**Generated:** 2026-04-10
**Protocol:** 12-Agent Deep Phase Assumptions
**Phase Goal:** Destructive actions are recoverable, gestures are discoverable, and shared links look professional

---

## 1. Resolved Assumptions

### Technical Approach

| Requirement | Approach | Confidence | Evidence |
|-------------|----------|------------|---------|
| UXPL-01: Cart item undo | Extend `useToastV8` with `action` prop; snapshot item before `removeItem()` | HIGH | Toast at root layout survives nav; removeItem is synchronous store-only (cart-store.ts:212) |
| UXPL-02: Cart clear undo | Snapshot full `items[]` before `clearCart()`; same toast action pattern | HIGH | Max 50 items ~25KB; safe in closure (types/cart.ts:76) |
| UXPL-03: Swipe preview | Persistent subtle bounce hint on first cart item; one-time localStorage flag | HIGH | No onboarding exists; SwipeDeleteIndicator already shows during drag (CartItem.tsx:127) |
| UXPL-04: Dietary scroll | Gradient fade indicators on MenuHeader chip row; reuse CategoryTabs pattern | HIGH | MenuHeader uses `overflow-x-auto no-scrollbar` (MenuHeader.tsx:74); CategoryTabs has exact pattern |
| UXPL-05: Sticky reorder | `sticky bottom-0` with shadow + safe-area offset on order detail page | HIGH | ReorderButton exists (ReorderButton.tsx:1-64); not sticky yet |
| UXPL-06: OG meta tags | `generateMetadata()` on share page; static brand image fallback | HIGH | Share page has static metadata only (share/page.tsx:38-44); no @vercel/og needed |

### Scope Boundaries

**In scope:**
- Toast system extension: `action` prop on `Toast`/`ToastOptions` interfaces
- Cart undo: snapshot + delayed commit pattern for removeItem and clearCart
- Swipe discoverability: one-time hint animation on first cart item
- Dietary scroll: gradient fade indicators (left/right) on MenuHeader chips
- Sticky reorder: CSS sticky + elevated shadow on order detail
- OG tags: dynamic `generateMetadata()` on share page with first item image fallback

**Out of scope:**
- Animation system audit (QUAL-04)
- Undo for non-cart operations (order cancellation, etc.)
- Dynamic OG image generation via `@vercel/og` / `ImageResponse`
- Push notification integration
- Reorder UX redesign (only positioning change)
- Spring physics harmonization

**Ambiguous (resolved):**
- Dietary chip target = MenuHeader (menu page), NOT DietaryChipPicker (account settings)
- OG image = static brand 1200x630 PNG; menu item image as dynamic fallback
- Swipe preview = persistent hint + one-time flag, not full tutorial overlay
- Cart clear undo = full array snapshot, not individual item tracking

### Implementation Order

1. **Plan 01: Toast action extension + cart undo (UXPL-01, UXPL-02)** — Highest architectural delta. Extend useToastV8, modify cart-store snapshot, update ClearCartConfirmation.
2. **Plan 02: Swipe hint + dietary scroll (UXPL-03, UXPL-04)** — Small delta on existing components. CartItem hint animation + MenuHeader gradient fades.
3. **Plan 03: Sticky reorder + OG tags (UXPL-05, UXPL-06)** — Independent features. CSS sticky + generateMetadata server-side.

### Backend Requirements

- **None** — all 6 requirements are client-side or metadata-only
- Share page already fetches order via service client with share_token validation
- No new API routes, no DB migrations, no RLS changes

---

## 2. Realistic Data/Scale Analysis

| Metric | Value | Source |
|--------|-------|--------|
| Max cart items | 50 | `types/cart.ts:76` MAX_CART_ITEMS |
| Max per-item qty | 50 | `types/cart.ts:75` MAX_ITEM_QUANTITY |
| Cart snapshot size | ~25KB worst case | 50 items x ~500 bytes (modifiers, notes) |
| Undo window | 5000ms | UXPL-01 requirement |
| Toast stack limit | 5 | `useToastV8.ts` TOAST_LIMIT |
| Dietary options count | 6 | DIETARY_OPTIONS in settings-types.ts |
| Chip width (avg) | ~80-100px | px-3 py-1.5 + emoji + label |
| Mobile viewport | ~320px | Overflow starts below ~480px with 6 chips |
| OG image recommended | 1200x630px | Open Graph Protocol standard |
| Share page auth | None (public via share_token) | share/page.tsx:67-89 |

---

## 3. Cross-Phase Contract Inventory

### From Phase 110: Critical Fixes & Data Reliability
- **Query key factory** (`src/lib/queryKeys.ts`) — use factory keys, never inline arrays
- **Retry config** — mutations NEVER retry (`retry: false` literal)
- **ClientErrorCodes** (`src/types/errors.ts`) — extend here if new error codes needed
- **AbortController cleanup** — every timeout/fetch needs useEffect cleanup return

### From Phase 111: Checkout Conversion
- **Form persistence** (`checkout-store.ts`) — undo must not break `partialize` middleware
- **Price change detection** (`useCartValidation`) — auto-updates prices; undo restores pre-update price
- **Polling gate** — `refetchInterval: enabled ? MS : false` pattern
- **RHF mode: "onTouched"** — form validation pattern

### From Phase 112: Order Tracking Overhaul
- **Drawer exit animation** — `duration: 0.15s easeIn`, NEVER spring (Safari GPU crash, commit 4087d3bf)
- **Backoff utility** (`src/lib/utils/backoff.ts`) — reusable for any retry logic
- **Visibility pause** — `document.visibilitychange` listener cleanup in useEffect

### From Phase 113: Accessibility & Design System
- **44px touch targets** — all interactive elements ≥ 44px (Button/Input sm = h-11)
- **focus-visible only** — never `focus:ring`, always `focus-visible:`
- **Token enforcement** — ESLint blocks hardcoded hex, arbitrary px, `ring-red-*`
- **Dark mode complete** — all tokens have dark variants

### From Phase 114: Loading States & Offline
- **Loading hierarchy** — skeleton (15s) > spinner (30s) > timeout error
- **IDB-first menu** — offline cold-start shows cached menu
- **Cart sync on reconnect** — `syncPendingCartItems` on online event; auto-updates prices

### From Phase 115: Data Layer Optimization
- **Cart optimistic formalization** — 3-layer validation (UI poll, online sync, checkout server)
- **Price auto-update** — `updateItemPrice()` auto-called on detection
- **Pagination** — orders (cursor) and menu search (offset) paginated
- **removeItem is store-only** — no server call, IDB persisted via middleware

### Contracts Phase 116 Creates
- **Toast action pattern** — `toast({ action: { label, onClick } })` for recoverable actions
- **Undo mechanism** — snapshot-before-mutate + delayed commit via toast timer
- **Swipe hint animation** — one-time localStorage flag pattern
- **Scroll fade indicator** — reusable gradient overlay for overflow containers
- **Dynamic OG metadata** — `generateMetadata()` pattern for order sharing

### What Phase 116 Must NOT Break
- Drawer.tsx exit animation (NEVER spring)
- Mutation retry: false (NEVER change)
- Query key factory usage
- 44px touch targets on all interactive elements
- Focus-visible ring pattern
- IDB cart persistence middleware
- Cart optimistic + rollback 3-layer validation
- Price auto-update mechanism

---

## 4. Gotcha Inventory

### CRITICAL (Will break production if ignored)

| # | Gotcha | Feature | Fix | Source |
|---|--------|---------|-----|--------|
| C-1 | Toast has NO action button support | UXPL-01/02 | Extend Toast/ToastOptions interfaces with `action?: { label, onClick }` | useToastV8.ts:35-40 |
| C-2 | `removeItem` is synchronous — no rollback exists | UXPL-01 | Snapshot item BEFORE calling removeItem; restore via addItem | cart-store.ts:212-216 |
| C-3 | `clearCart` is synchronous — no snapshot | UXPL-02 | Capture `getState().items` before calling clearCart | cart-store.ts:218-220 |
| C-4 | Single mutation owner — toast action must NOT also mutate | UXPL-01/02 | Toast onClick calls parent callback; parent owns mutation | state-management.md |
| C-5 | Never internal fetch from server components | UXPL-06 | Call Supabase directly in generateMetadata, don't fetch own API | nextjs.md |
| C-6 | `process.env` inlined at build — dynamic access fails | UXPL-06 | Use `NEXT_PUBLIC_SITE_URL` or hardcode domain for og:url | nextjs.md |

### HIGH (Will cause bugs)

| # | Gotcha | Feature | Fix | Source |
|---|--------|---------|-----|--------|
| H-1 | Zustand hydration — getState() in useMemo not reactive | UXPL-01/02 | Use direct selectors `useCartStore((s) => s.items)` | state-management.md |
| H-2 | Store-level debounce — rapid undo clicks create duplicates | UXPL-01/02 | Debounce at store level; export `__clearDebounceState()` for tests | state-management.md |
| H-3 | PanInfo undefined on interrupted gestures | UXPL-03 | Guard: `if (!info?.offset \|\| !info?.velocity) return` | mobile-ux.md |
| H-4 | Safe area inset on sticky — position not padding | UXPL-05 | `style={{ bottom: "calc(0px + env(safe-area-inset-bottom, 0px))" }}` | mobile-ux.md |
| H-5 | Responsive negative margin must match parent padding | UXPL-04 | `px-4 -mx-4 sm:px-6 sm:-mx-6` at every breakpoint | mobile-ux.md |
| H-6 | Flex items-center collapses children without w-full | UXPL-04 | Add `w-full` to scroll container parent | react-patterns.md |
| H-7 | OG date timezone — Date string parsed as UTC | UXPL-06 | Use explicit timezone: `toLocaleDateString(undefined, { timeZone })` | nextjs.md |

### MEDIUM (UX degradation)

| # | Gotcha | Feature | Fix | Source |
|---|--------|---------|-----|--------|
| M-1 | Framer Motion direction ref stale | UXPL-01 | Set direction ref synchronously BEFORE state change | animation.md |
| M-2 | Event listeners inside useEffect, not useCallback | UXPL-01 | Define handler inside useEffect with guard clause | react-patterns.md |
| M-3 | touchAction conflicts block vertical scroll | UXPL-03 | Drag handle: `touch-none`; content: `pan-y` | mobile-ux.md |
| M-4 | Nested scroll containers block desktop wheel | UXPL-04 | One scroll container per axis; let modal handle outer scroll | mobile-ux.md |
| M-5 | Skeleton structure must match loaded state | UXPL-05 | Match sticky position, heights, grid between skeleton and real | animation.md |
| M-6 | loading="lazy" + animated containers = no load | UXPL-05 | Use loading="eager" inside Framer Motion wrappers | animation.md |
| M-7 | Non-existent token → transparent (no build error) | All | Verify computed style; use `status-` prefix for status colors | design-tokens.md |

---

## 5. Data Contracts

### Toast System Extension

```typescript
// EXTEND useToastV8.ts
interface ToastOptions {
  message: string;
  type?: "success" | "error" | "info" | "warning" | "order" | "exception";
  duration?: number;
  sound?: boolean;
  // NEW
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Toast extends ToastOptions {
  id: string;
}
```

### Cart Undo Pattern

```typescript
// cart-store.ts extension
// BEFORE removeItem:
const snapshot = get().items.find(i => i.cartItemId === cartItemId);
removeItem(cartItemId);
toast({
  message: `${snapshot.nameEn} removed`,
  type: "info",
  duration: 5000,
  action: { label: "Undo", onClick: () => addItem(snapshot) }
});

// BEFORE clearCart:
const snapshot = [...get().items];
clearCart();
toast({
  message: `${snapshot.length} items removed`,
  type: "info",
  duration: 5000,
  action: { label: "Undo", onClick: () => set({ items: snapshot }) }
});
```

### OG Metadata Shape

```typescript
// share/page.tsx generateMetadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const order = await fetchShareOrder(params.id);
  const itemList = order.items.map(i => `${i.quantity}x ${i.name}`).join(", ");
  const firstImage = order.items[0]?.imageUrl;
  return {
    title: `Order from Morning Star — ${formatDate(order.date)}`,
    description: truncate(itemList, 155),
    openGraph: {
      title: `Order from Morning Star Delivery`,
      description: `${order.items.length} items — ${formatCents(order.total)}`,
      url: `https://delivery.mandalaymorningstar.com/orders/${params.id}/share`,
      type: "website",
      images: [{ url: firstImage || "/og-image.png", width: 1200, height: 630 }],
    },
  };
}
```

---

## 6. Design Compliance Matrix

| Principle | Phase 116 Compliance | Verification |
|-----------|---------------------|--------------|
| Core value: "delightfully alive with motion" | Toast action button gets spring entrance; undo restores with popIn animation | Use `spring.default` (stiffness 300, damping 22) |
| 44px touch targets | Undo button ≥ 44px; sticky reorder button ≥ 44px | size="sm" or size="md" = h-11 (44px) |
| Focus-visible rings | All new interactive elements use `focus-visible:ring-2 ring-primary ring-offset-2` | ESLint enforces |
| Token enforcement | No hardcoded hex; use semantic tokens | ESLint blocks arbitrary colors |
| Dark mode | All new tokens have dark variants | tokens.css dark mode block |
| Haptic feedback | Undo action: `triggerHaptic("success")` on restore | swipe-gestures/utils.ts |
| Reduced motion | All animations gated on `prefers-reduced-motion` | useAnimationPreference() |
| Animation timing | Toast spring: damping 20, stiffness 300 (existing toast preset) | motion-tokens/core.ts |
| Stagger standard | Not applicable (no list reveals in Phase 116) | N/A |
| Z-index system | Toast at z-80 (existing); sticky reorder at z-20 (sticky layer) | z-index.ts tokens |

---

## 7. Identity/Brand Constraints

| Constraint | Application in Phase 116 |
|------------|-------------------------|
| Warm brand palette | Undo toast uses `bg-status-info` (teal) or warm info variant |
| Animation-first | Toast action button has spring entrance; undo restore has popIn |
| Forgiving UX | Undo on destructive actions IS the core of this phase |
| Mobile-first (70%+ users) | All interactions optimized for touch; safe-area insets handled |
| Speed to order | Undo doesn't block ordering flow; 5s window is non-intrusive |
| No generic AI aesthetic | Toast design matches existing V8 style (icon + message + action) |
| Premium quality | Smooth animations, haptic feedback, professional OG previews |

---

## 8. Architectural Decisions

### AD-1: Undo mechanism — Delayed commit vs immediate + restore

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A: Delay removal by 5s** | Clean undo (item never actually removed) | Cart UI shows item during delay (confusing); IDB out of sync | REJECT |
| **B: Remove immediately + snapshot restore** | Clean UX (item disappears); simple restore via addItem | Must handle edge cases (item became unavailable during 5s) | **CHOSEN** |

**Rationale:** Option B matches existing optimistic pattern. Phase 115 established that cart mutations are synchronous and store-only. Snapshot + restore is simpler and consistent with the 3-layer validation approach.

### AD-2: Toast extension — Extend existing vs new component

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A: Extend useToastV8** | Single system; consistent UX; minimal new code | Touch existing working code | **CHOSEN** |
| **B: New UndoToast component** | Isolated; no risk to existing toasts | Duplicate state management; inconsistent UX | REJECT |

**Rationale:** Adding `action` prop to existing Toast is additive (~30 lines). No restructuring needed. Reducer, queue, and portal all reusable.

### AD-3: OG image strategy — Static vs dynamic generation

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A: Static brand image** | Zero complexity; fast; reliable | Same image for every share | **CHOSEN** (with fallback to item image) |
| **B: ImageResponse (Satori)** | Rich per-order previews | New dependency; complex; slow generation | DEFER |

**Rationale:** Static image with dynamic title/description is sufficient for MVP. Menu item image as OG image when available adds personalization without complexity. @vercel/og can be added later if social metrics justify it.

### AD-4: Swipe hint — Persistent animation vs one-time overlay

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A: Subtle bounce on first item** | Non-intrusive; discoverable | May be missed | **CHOSEN** |
| **B: Full tutorial overlay** | Unmissable | Heavy; blocks interaction; no prior art in codebase | REJECT |

**Rationale:** DoorDash/Uber Eats use subtle hints, not overlays. One-time localStorage flag (`swipeHintSeen`) suppresses after first view. Bounce animation uses existing `spring.ultraBouncy` preset.

---

## 9. File Map

### Create (new files)
| File | Purpose |
|------|---------|
| `public/og-image.png` | Static 1200x630 OG fallback image |

### Modify (existing files)
| File | Changes |
|------|---------|
| `src/lib/hooks/useToastV8.ts` | Add `action` to Toast/ToastOptions interfaces |
| `src/components/ui/Toast.tsx` | Render action button in ToastCard; countdown timer |
| `src/lib/stores/cart-store.ts` | Wrap removeItem/clearCart with snapshot + toast |
| `src/components/ui/cart/CartItem/CartItem.tsx` | Add swipe hint animation on first item |
| `src/components/ui/cart/ClearCartConfirmation.tsx` | Update "cannot be undone" text; wire undo toast |
| `src/components/ui/menu/MenuHeader.tsx` | Add gradient fade scroll indicators to dietary chips |
| `src/app/(customer)/orders/[id]/page.tsx` | Make ReorderButton sticky bottom-0 |
| `src/app/(public)/orders/[id]/share/page.tsx` | Convert static metadata to generateMetadata() |
| `src/app/layout.tsx` | Add root-level openGraph defaults |

### Read (reference only)
| File | Purpose |
|------|---------|
| `src/components/ui/menu/CategoryTabs.tsx` | Scroll fade indicator reference pattern |
| `src/lib/swipe-gestures/constants.ts` | Gesture thresholds |
| `src/lib/motion-tokens/core.ts` | Spring presets for animations |
| `src/lib/micro-interactions/feedback.ts` | Haptic feedback utilities |
| `src/components/ui/cart/CartItem/SwipeDeleteIndicator.tsx` | Existing swipe visual |
| `src/app/(customer)/orders/[id]/ReorderButton.tsx` | Existing reorder component |
| `src/lib/hooks/useReorder.ts` | Reorder hook for context |

### Reuse (patterns to copy)
| Pattern | Source | Target |
|---------|--------|--------|
| Scroll fade gradient | `CategoryTabs.tsx:96-105` | MenuHeader dietary chips |
| Spring animation presets | `motion-tokens/core.ts` | Toast action button entrance |
| Haptic feedback | `swipe-gestures/utils.ts:triggerHaptic` | Undo action confirmation |
| generateMetadata | `tracking/page.tsx:18-24` | Share page dynamic metadata |

---

## 10. Gray Area Resolutions

| # | Question | Resolution | Confidence | Evidence |
|---|----------|------------|------------|---------|
| 1 | Does toast persist across route navigation? | YES — ToastProvider in root layout, global memory state | HIGH | layout.tsx:84, useToastV8.ts:65-67 |
| 2 | Does undo need to delay server mutation? | NO — removeItem/clearCart are store-only, no server call | HIGH | cart-store.ts:212-220 |
| 3 | OG image: static or dynamic generation? | Static brand image + menu item fallback; no ImageResponse | HIGH | No @vercel/og in deps; static is sufficient for MVP |
| 4 | Dietary chips: menu page or account settings? | Menu page (MenuHeader) — has overflow-x-auto no-scrollbar | HIGH | MenuHeader.tsx:74, DietaryChipPicker uses flex-wrap |
| 5 | Swipe preview: tutorial or persistent hint? | Persistent bounce hint + one-time localStorage flag | MEDIUM-HIGH | No onboarding pattern exists; DoorDash/UberEats precedent |
| 6 | Cart clear undo: full snapshot or item tracking? | Full array snapshot (~25KB max); safe in closure | HIGH | MAX_CART_ITEMS=50, items are JSON-serializable |
| 7 | Does useToastV8 support action callbacks? | NO — must extend interfaces + ToastCard component | HIGH | useToastV8.ts:35-40, Toast.tsx:71-110 |

---

## 11. Animation/Interaction Patterns

### Toast Action Button
- Entrance: `spring.default` (stiffness 300, damping 22)
- Button tap: `scale: 0.97` with `spring.snappyButton`
- Countdown: progress bar from 100% to 0% over 5s duration
- Exit on undo: `spring.snappy` (stiffness 600, damping 35) with haptic "success"

### Swipe Hint
- Trigger: first cart item render when `!localStorage.getItem("swipeHintSeen")`
- Animation: `x: [0, -30, 0]` with `spring.ultraBouncy` (stiffness 500, damping 12)
- Delay: 800ms after mount (let cart render settle)
- Repeat: once, then set flag

### Dietary Scroll Fade
- Left indicator: `bg-gradient-to-r from-surface-primary to-transparent w-8`
- Right indicator: `bg-gradient-to-l from-surface-primary to-transparent w-8`
- Visibility: scroll event listener; show when `scrollLeft > 10` (left) or `scrollLeft < scrollWidth - clientWidth - 10` (right)
- Position: absolute, pointer-events-none, z-10

### Sticky Reorder
- Position: `sticky bottom-0 z-20`
- Shadow: `shadow-lg` (warm-tinted: `0 8px 24px rgba(164, 16, 52, 0.08)`)
- Safe area: `style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}`
- Background: `bg-surface-primary` with `border-t border-border`

---

## 12. Design Token Audit

### Existing tokens sufficient for Phase 116
- `bg-status-info` / `bg-status-info-bg` — toast info background
- `shadow-lg` — sticky element elevation
- `z-20` (sticky layer) / `z-80` (toast layer) — z-index tokens
- `spring.default`, `spring.snappyButton`, `spring.ultraBouncy` — animation springs
- `duration.normal` (0.18s), `duration.fast` (0.12s) — timing

### Tokens NOT needed (previously assumed)
- `--shadow-sticky` — can use existing `shadow-lg` or `shadow-card-hover`
- `--color-toast-undo` — reuse `status-info` (teal matches info semantic)
- `--color-scroll-fade` — inline gradient from `surface-primary to transparent` sufficient

### No new design tokens required for Phase 116

---

## 13. Testing Strategy

### Unit Tests
- Toast action callback fires on click
- Toast action prevents auto-dismiss timeout
- Cart removeItem snapshot captured correctly
- Cart clearCart snapshot captured correctly
- Undo restores exact item state (modifiers, quantity, notes)
- Scroll indicator visibility toggles on scroll position

### Integration Tests
- Remove item → see toast → click undo → item restored with correct quantity
- Clear cart → see toast → click undo → all items restored
- Remove item → wait 5s → item permanently removed
- Navigate away during undo window → toast persists → undo still works
- Share page renders dynamic OG meta tags
- Sticky reorder button visible at all scroll positions

### E2E Tests (Playwright)
- Swipe-to-delete shows hint animation on first cart view
- Dietary chips show scroll fade on mobile viewport
- OG meta tags validate with Open Graph debugger pattern

---

## 14. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Undo race: item unavailable during 5s window | LOW | MEDIUM | Validate item exists in menu before restoring; show error toast if unavailable |
| Double-click undo creates duplicates | MEDIUM | HIGH | Debounce at store level; dismiss toast immediately on undo click |
| Toast action button too small on mobile | LOW | MEDIUM | Use size="sm" (44px min); test on actual devices |
| OG image not rendering on WhatsApp | LOW | LOW | Test with WhatsApp preview; ensure absolute URL + correct dimensions |
| Sticky button overlaps bottom nav | MEDIUM | MEDIUM | Z-index layering; test with bottom nav visible; add margin if needed |
| Scroll fade gradient wrong in dark mode | LOW | LOW | Use `from-surface-primary dark:from-surface-elevated` pattern from CategoryTabs |

---

_Research complete. 12 agents, 2 waves. All gray areas resolved to HIGH confidence._
