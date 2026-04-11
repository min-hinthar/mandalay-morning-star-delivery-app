# Phase 116: Micro-Interactions & Polish - Context

**Gathered:** 2026-04-10 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Destructive actions are recoverable, gestures are discoverable, and shared links look professional. Cart deletions show undo toast, swipe-to-delete has visual preview, dietary chips show scroll indicators, order detail has sticky reorder button, and shared order links render rich Open Graph previews.

**In scope (6 requirements):**
- UXPL-01: Cart item deletion shows 5-second undo toast
- UXPL-02: Cart clear shows undo toast
- UXPL-03: Swipe-to-delete shows visual preview indicator before drag starts
- UXPL-04: Dietary filter chips show scroll indicator when overflowing
- UXPL-05: Order detail has sticky reorder button visible without scrolling
- UXPL-06: Shared order links include Open Graph meta tags

**Explicitly NOT in scope:**
- Undo for non-cart operations (order cancellation, etc.)
- Dynamic OG image generation via @vercel/og / ImageResponse
- Animation system audit (QUAL-04)
- Push notifications
- Reorder UX redesign (only positioning change)
- Spring physics harmonization

</domain>

<decisions>
## Implementation Decisions

### Undo UX Pattern (UXPL-01, UXPL-02)
- **D-01:** Immediate remove + snapshot restore — item is removed from cart immediately, snapshot captured before mutation. Undo restores from snapshot. NOT delayed removal.
- **D-02:** Cart removeItem snapshot: capture single item via `get().items.find()` before `removeItem()`. Restore via `addItem(snapshot)`.
- **D-03:** Cart clearCart snapshot: capture full `[...get().items]` before `clearCart()`. Restore via `set({ items: snapshot })`.
- **D-04:** 5-second undo window via toast duration. Toast dismissal = action is permanent. Undo click = immediate restore + haptic "success" via `triggerHaptic()`.
- **D-05:** Debounce at store level to prevent duplicate undo clicks. Dismiss toast immediately on undo action.
- **D-06:** Edge case: if item becomes unavailable during 5s window, show error toast on undo attempt. Validate item exists in menu before restoring.
- **D-07:** Update ClearCartConfirmation.tsx — remove "cannot be undone" language since it's now recoverable.

### Toast System Extension (UXPL-01, UXPL-02)
- **D-08:** Extend existing `useToastV8` with `action?: { label: string; onClick: () => void }` on ToastOptions interface. NOT a new component.
- **D-09:** Toast action button renders inside existing ToastCard. Uses `spring.default` entrance animation (stiffness 300, damping 22).
- **D-10:** Countdown progress bar from 100% to 0% over toast duration. Visual urgency indicator.
- **D-11:** Action button tap: `scale: 0.97` with `spring.snappyButton`. Min 44px touch target (h-11).
- **D-12:** Toast with action prevents auto-dismiss on action click — only dismiss after onClick callback completes.

### Swipe Discoverability (UXPL-03)
- **D-13:** Subtle bounce animation on first cart item, NOT tutorial overlay. One-time `localStorage.getItem("swipeHintSeen")` flag.
- **D-14:** Bounce animation: `x: [0, -30, 0]` with `spring.ultraBouncy` (stiffness 500, damping 12). Delay 800ms after mount.
- **D-15:** Fires once per user (not per session). Set flag after animation completes.
- **D-16:** Guard PanInfo: `if (!info?.offset || !info?.velocity) return` — prevents crash on interrupted gestures.
- **D-17:** touchAction: drag handle gets `touch-none`, content keeps `pan-y` — no vertical scroll conflict.

### Dietary Scroll Indicators (UXPL-04)
- **D-18:** Gradient fade indicators on MenuHeader chip row, reusing CategoryTabs pattern (`updateFadeIndicators` callback).
- **D-19:** Left: `bg-gradient-to-r from-surface-primary to-transparent w-8`. Right: `bg-gradient-to-l from-surface-primary to-transparent w-8`.
- **D-20:** Visibility: show when `scrollLeft > 10` (left) or `scrollLeft < scrollWidth - clientWidth - 10` (right). pointer-events-none, z-10.
- **D-21:** Dark mode: use `from-surface-primary dark:from-surface-elevated` pattern from CategoryTabs.
- **D-22:** Responsive negative margin: `px-4 -mx-4 sm:px-6 sm:-mx-6` at every breakpoint to reach full width.
- **D-23:** Add `w-full` to scroll container parent to prevent flex collapse.

### Sticky Reorder Button (UXPL-05)
- **D-24:** CSS `sticky bottom-0 z-20` on order detail page. NOT fixed position.
- **D-25:** Shadow: `shadow-lg` with warm tint. Background: `bg-surface-primary` with `border-t border-border`.
- **D-26:** Safe area: `style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}` — position not padding for inset.
- **D-27:** Verify z-20 doesn't conflict with bottom nav. Add margin if needed.
- **D-28:** Loading="eager" for images inside the sticky container — lazy + animated containers prevents loading.

### OG Meta Tags (UXPL-06)
- **D-29:** Convert share page from static metadata to dynamic `generateMetadata()`. Static brand 1200x630 PNG as fallback. Menu item image when available.
- **D-30:** Title: `Order from Morning Star - {date}`. Description: item list truncated to 155 chars.
- **D-31:** Call Supabase directly in generateMetadata — NEVER internal fetch from server components.
- **D-32:** Use `NEXT_PUBLIC_SITE_URL` for og:url — `process.env` is inlined at build, dynamic access fails.
- **D-33:** Add root-level openGraph defaults in `layout.tsx` for site-wide fallback.

### Claude's Discretion
- Toast countdown bar visual style (solid vs gradient)
- Exact bounce animation easing curve tuning
- Scroll fade gradient width (8px baseline, adjust if needed)
- OG description formatting details
- Error toast wording for unavailable-item-on-undo edge case

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Toast system
- `src/lib/hooks/useToastV8.ts` — Toast interfaces (ToastOptions:35-40), reducer, queue management
- `src/components/ui/Toast.tsx` — ToastCard rendering, animation, portal

### Cart state
- `src/lib/stores/cart-store.ts` — removeItem (:212-216), clearCart (:218-220), store shape
- `src/components/ui/cart/ClearCartConfirmation.tsx` — Clear cart confirmation dialog text

### Swipe gestures
- `src/components/ui/cart/CartItem/CartItem.tsx` — Cart item with swipe-to-delete
- `src/components/ui/cart/CartItem/SwipeDeleteIndicator.tsx` — Existing swipe visual
- `src/lib/swipe-gestures/constants.ts` — Gesture thresholds
- `src/lib/swipe-gestures/utils.ts` — triggerHaptic utility

### Scroll indicators
- `src/components/ui/menu/MenuHeader.tsx` — Dietary chip row (:83-85), overflow-x-auto
- `src/components/ui/menu/CategoryTabs.tsx` — Scroll fade indicator reference pattern (:95-100)

### Sticky reorder
- `src/app/(customer)/orders/[id]/ReorderButton.tsx` — Existing reorder component
- `src/lib/hooks/useReorder.ts` — Reorder hook

### OG meta tags
- `src/app/(public)/orders/[id]/share/page.tsx` — Current static metadata share page
- `src/app/layout.tsx` — Root layout, openGraph defaults target

### Animation tokens
- `src/lib/motion-tokens/core.ts` — Spring presets (default, snappyButton, ultraBouncy)
- `src/lib/micro-interactions/feedback.ts` — Haptic feedback utilities

### Pre-context research
- `.planning/phases/116-micro-interactions-polish/116-PRECONTEXT-RESEARCH.md` — Full 12-agent analysis with gotcha inventory, data contracts, risk assessment

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useToastV8` hook: global toast state with reducer, queue, portal — extend with `action` prop
- `CategoryTabs` scroll fade: `updateFadeIndicators` callback with gradient overlays — copy pattern for MenuHeader
- `triggerHaptic()` utility: provides haptic feedback on mobile — use for undo confirmation
- `SwipeDeleteIndicator`: existing visual during drag — swipe hint adds pre-drag discoverability
- `ReorderButton`: existing component — only needs CSS position change
- `spring.default`, `spring.snappyButton`, `spring.ultraBouncy`: motion token presets for all animations
- `useAnimationPreference()`: reduced-motion gate — all new animations must check this

### Established Patterns
- Optimistic mutations: Phase 115 established store-only cart mutations with 3-layer validation
- Toast at z-80, sticky elements at z-20: tokenized z-index system
- 44px min touch targets: Phase 113 enforcement (Button/Input sm = h-11)
- focus-visible only: Phase 113 ring system (never `focus:ring`)
- Drawer exit: `duration: 0.15s easeIn`, NEVER spring (Safari GPU crash)
- Token enforcement: ESLint blocks hardcoded hex, arbitrary px values

### Integration Points
- Root layout: ToastProvider at `layout.tsx:84` — toast survives navigation
- Cart store: Zustand with persist middleware — IDB synced via middleware
- Menu page: MenuHeader dietary chips at `:83-85` — add gradient overlays
- Order detail: `orders/[id]/page.tsx` — wrap ReorderButton with sticky container
- Share page: `share/page.tsx` — convert static metadata export to generateMetadata()

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. All decisions grounded in codebase analysis and pre-context research findings.

</specifics>

<deferred>
## Deferred Ideas

- Dynamic OG image generation via @vercel/og / ImageResponse — defer until social sharing metrics justify complexity
- Undo for non-cart destructive actions (order cancellation, admin operations) — separate phase
- Spring physics harmonization across all components — QUAL-04 backlog
- Animation system audit — v2.4 candidate

None — discussion stayed within phase scope

</deferred>

---

*Phase: 116-micro-interactions-polish*
*Context gathered: 2026-04-10*
