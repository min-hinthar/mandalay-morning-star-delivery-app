---
phase: 116-micro-interactions-polish
verified: 2026-04-11T02:00:00Z
status: human_needed
score: 5/5 must-haves verified
gaps: []
human_verification:
  - test: "Undo toast countdown bar animates correctly"
    expected: "Removing a cart item shows a blue progress bar that counts down from 100% to 0% over 5 seconds"
    why_human: "rAF-driven animation cannot be verified programmatically without rendering the component"
  - test: "Clicking Undo restores item"
    expected: "After removing an item, clicking Undo in the toast restores the item with correct quantity, modifiers, and notes"
    why_human: "Store mutation + toast interaction requires live browser session to verify"
  - test: "Swipe hint bounce plays once on first cart item"
    expected: "First cart item bounces left then back (x: 0 -> -30 -> 0) after ~800ms on page load; does not repeat on subsequent page loads"
    why_human: "localStorage flag + animation timing requires manual browser test in fresh session and repeated session"
  - test: "Dietary chip scroll fades appear and disappear correctly"
    expected: "Right fade appears when chips overflow; scrolling right reveals left fade and hides right fade at end"
    why_human: "Requires actual viewport overflow — depends on screen width and number of dietary chips"
  - test: "Sticky reorder button stays visible while scrolling"
    expected: "ReorderButton remains at viewport bottom across all scroll positions on order detail page with shadow-lg, border-t separator, and iOS safe-area padding"
    why_human: "CSS sticky behavior with safe-area-inset requires device/simulator verification"
  - test: "OG image renders in social preview"
    expected: "Sharing an order link on Twitter/iMessage shows the og-image.png thumbnail (1200x630)"
    why_human: "public/og-image.png does not exist in the repo; metadata references the path but image will be blank until provided"
---

# Phase 116: Micro-Interactions & Polish Verification Report

**Phase Goal:** Destructive actions are recoverable, gestures are discoverable, and shared links look professional
**Verified:** 2026-04-11T02:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Deleting a cart item or clearing the cart shows a 5-second undo toast | VERIFIED | `cart-store.ts` lines 213–243 (removeItem) and 251–269 (clearCart) — both snapshot state, call `toast({ duration: 5000, action: { label: "Undo" } })` |
| 2 | Swipe-to-delete shows a visual preview indicator before the gesture commits | VERIFIED | `CartItem.tsx` lines 161–163 — `SwipeDeleteIndicator` renders inside `AnimatePresence` when `isDragging` is true (during drag, before commit threshold); bounce hint adds discoverability via one-time `x: [0, -30, 0]` animation |
| 3 | Dietary filter chips show a scroll indicator when content overflows | VERIFIED | `MenuHeader.tsx` lines 49–76 — `showLeftFade`/`showRightFade` state with `updateFadeIndicators` callback, passive scroll listener + ResizeObserver |
| 4 | Order detail has a sticky reorder button visible without scrolling | VERIFIED | `src/app/(customer)/orders/[id]/page.tsx` lines 424–437 — `sticky bottom-0 z-20` div with `bg-surface-primary`, `border-t border-border`, `shadow-lg`, `env(safe-area-inset-bottom)` |
| 5 | Sharing an order link produces a rich preview via Open Graph meta tags | VERIFIED (code) | `share/page.tsx` lines 38–112 — `async generateMetadata` fetches order from Supabase via `createServiceClient()`, returns dynamic title/description/og tags. Known gap: `public/og-image.png` missing — image in OG tags will not render |

**Score:** 5/5 truths verified (code-level)

### Known Stub

| Item | Detail | Impact |
|------|--------|--------|
| `public/og-image.png` | File not in repo — documented in 116-03-SUMMARY as known stub | OG tags emit correct `<meta>` tags; social platforms will show no image thumbnail until file is provided. Title and description previews will still work. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/hooks/useToastV8.ts` | Toast action interface | VERIFIED | `ToastActionButton` interface at line 25, `action?: ToastActionButton` on `Toast` (line 39) and `ToastOptions` (line 48), `triggerAction()` at line 256 |
| `src/components/ui/Toast.tsx` | Action button + countdown bar | VERIFIED | Action button with `h-11` (44px) at line 122–142; countdown rAF bar at lines 80–96 and 158–167 |
| `src/lib/stores/cart-store.ts` | Snapshot + undo for removeItem/clearCart | VERIFIED | `const snapshot = get().items.find(...)` at line 214; `const snapshot = [...get().items]` at line 252 |
| `src/components/ui/cart/ClearCartConfirmation.tsx` | Updated copy removing "cannot be undone" | VERIFIED | Line 131: `"You can undo this for 5 seconds."` — no "cannot be undone" present |
| `src/components/ui/cart/CartItem/CartItem.tsx` | Swipe hint bounce + isFirstItem prop | VERIFIED | `isFirstItem?: boolean` at line 25; `localStorage.getItem("swipeHintSeen")` at line 73; `x: [0, -30, 0]` via `animate` at line 180; `spring.ultraBouncy` at line 181 |
| `src/components/ui/menu/MenuHeader.tsx` | Gradient fade scroll indicators | VERIFIED | `showLeftFade`/`showRightFade` state at lines 50–51; `scrollLeft > 10` at line 58; `pointer-events-none` on both fade divs; `ResizeObserver` at line 70 |
| `src/app/(customer)/orders/[id]/page.tsx` | Sticky reorder container | VERIFIED | `sticky bottom-0 z-20` at line 427; `paddingBottom: "env(safe-area-inset-bottom, 0px)"` at line 434 |
| `src/app/(public)/orders/[id]/share/page.tsx` | Dynamic generateMetadata | VERIFIED | `export async function generateMetadata` at line 38; no `export const metadata` present; uses `createServiceClient()` |
| `src/app/layout.tsx` | Root-level openGraph defaults | VERIFIED | `openGraph` object at lines 41–47 with `siteName: "Mandalay Morning Star"` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `cart-store.ts` | `useToastV8.ts` | `toast({ action: { label: "Undo", onClick } })` | WIRED | removeItem line 221–242, clearCart line 257–268 both call `toast` with action |
| `Toast.tsx` | `useToastV8.ts` | `toast.action` field consumed | WIRED | `{toast.action && (` at line 121; action button renders `toast.action.label` |
| `CartItem.tsx` | `localStorage` | `getItem/setItem` for `swipeHintSeen` | WIRED | `localStorage.getItem("swipeHintSeen")` at line 73; `localStorage.setItem("swipeHintSeen", "1")` at line 91 |
| `MenuHeader.tsx` | scroll/resize events | `updateFadeIndicators` callback | WIRED | `container.addEventListener("scroll", updateFadeIndicators, { passive: true })` at line 67; `ResizeObserver` at line 70 |
| `share/page.tsx` | Supabase orders table | `createServiceClient()` in generateMetadata | WIRED | `createServiceClient()` at line 40; `.eq("share_token", shareToken)` at line 54 |
| `layout.tsx` | All pages | Root metadata openGraph defaults | WIRED | `openGraph` block at lines 41–47; `siteName` present |
| `CartDrawerParts.tsx` | `CartItem` | `isFirstItem={index === 0}` | WIRED | Line 256 in CartDrawerParts; line 85 in CartPage/CartItemGroup |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `Toast.tsx` (action button) | `toast.action` | `cart-store.ts` removeItem/clearCart snapshot → `toast()` call | Yes — item name from real cart state | FLOWING |
| `share/page.tsx` generateMetadata | `order.total_cents`, `order.order_items` | Supabase query via `createServiceClient()` with `share_token` | Yes — DB query on orders table | FLOWING |
| `MenuHeader.tsx` fade indicators | `showLeftFade`/`showRightFade` | Scroll position from DOM (`scrollLeft`, `scrollWidth`, `clientWidth`) | Yes — live DOM measurements | FLOWING |
| `CartItem.tsx` bounce hint | `showSwipeHint` | `localStorage.getItem("swipeHintSeen")` flag | Yes — real localStorage + 800ms timer | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED for visual/animation features — all behaviors require browser rendering. Runnable entry points (API routes) not in scope for this phase's core changes. The share page `generateMetadata` is server-side and cannot be curl-tested without a running server and valid share_token.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| UXPL-01 | 116-01 | Cart item deletion shows 5-second undo toast | SATISFIED | `cart-store.ts` removeItem snapshot + toast with action |
| UXPL-02 | 116-01 | Cart clear shows undo toast | SATISFIED | `cart-store.ts` clearCart snapshot + toast with action |
| UXPL-03 | 116-02 | Swipe-to-delete shows visual preview indicator before gesture commits | SATISFIED | `SwipeDeleteIndicator` renders during drag; bounce hint adds discoverability |
| UXPL-04 | 116-02 | Dietary filter chips show scroll indicator when overflowing | SATISFIED | `MenuHeader.tsx` fade indicators with `pointer-events-none` |
| UXPL-05 | 116-03 | Order detail has sticky reorder button | SATISFIED | `sticky bottom-0 z-20` with shadow, border-t, safe-area-inset |
| UXPL-06 | 116-03 | Shared order links include Open Graph meta tags | SATISFIED (code) | `generateMetadata` wired to Supabase; og-image.png stub noted |

All 6 requirements claimed by phase 116 plans are covered. No orphaned requirements.

REQUIREMENTS.md traceability table shows all 6 as "Pending" — this needs updating to "Complete" after human verification closes.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/(public)/orders/[id]/share/page.tsx` | 102–103 | `og-image.png` path referenced but file missing from `public/` | Warning | OG image tag emits but image 404s on social crawlers. Title/description previews still work. File must be provided by design team. |

No TODO/FIXME/placeholder comments, no empty handlers, no hardcoded empty data arrays in phase-modified files.

Note: The `CartItem.tsx` `handleKeyDown` comment at line 141 `// Undo toast is now shown by removeItem in cart-store` is intentional documentation, not a stub.

### Human Verification Required

#### 1. Undo Toast Countdown Bar

**Test:** Remove a cart item; observe the toast
**Expected:** Blue progress bar at bottom of toast counts down from full width to zero over 5 seconds; "Undo" button is visible with min 44px height
**Why human:** rAF-driven animation cannot be verified programmatically

#### 2. Cart Item Undo Flow

**Test:** Add 2 items to cart, remove one, click Undo within 5 seconds
**Expected:** Removed item reappears with original quantity, modifiers, and notes; haptic feedback on restore (mobile)
**Why human:** Store snapshot restore requires live browser interaction

#### 3. Clear Cart Undo Flow

**Test:** Add multiple items, click Clear Cart, confirm, then click Undo within 5 seconds
**Expected:** All items restored exactly as before; ClearCartConfirmation shows "You can undo this for 5 seconds" (not "cannot be undone")
**Why human:** Multi-item restore requires live interaction to verify completeness

#### 4. Swipe Hint One-Time Behavior

**Test:** Open cart with items in a fresh browser session (no prior `swipeHintSeen` localStorage key); observe first item after ~800ms; close and reopen
**Expected:** First visit: bounce animation plays once on first item, then stops. Second visit: no bounce animation.
**Why human:** localStorage flag + animation timing requires controlled test sessions

#### 5. Dietary Chip Scroll Indicators

**Test:** Set a narrow viewport (< 375px width) or ensure enough dietary filter options exist; open menu page
**Expected:** Right fade gradient visible when chips overflow; scrolling right reveals left fade; at end, right fade disappears
**Why human:** Requires actual viewport overflow — chip count and container width are dynamic

#### 6. Sticky Reorder Button

**Test:** Navigate to order detail page with a long order (many items) on mobile; scroll down
**Expected:** ReorderButton remains pinned to viewport bottom with shadow and border-top separator; on iOS, button is not obscured by home indicator (safe-area respected)
**Why human:** CSS sticky + `env(safe-area-inset-bottom)` requires device/simulator

#### 7. OG Social Preview

**Test:** Share an order link on Twitter or iMessage with Open Graph debug tool (e.g., opengraph.xyz or cards-dev.twitter.com)
**Expected:** Rich preview shows "Order from Morning Star - {date}" title and "{N} items — ${total}" description. Image preview will be absent until `public/og-image.png` is added.
**Why human:** Social crawlers require a deployed URL; `og-image.png` is not yet in the repo

### Gaps Summary

No blocking gaps found in code. All 5 roadmap success criteria are met at the code level:

1. Undo toasts — implemented with 5s duration, action button, countdown bar, haptic restore
2. Swipe indicator — SwipeDeleteIndicator renders during drag; bounce hint adds discoverability
3. Scroll indicators — gradient fades with pointer-events-none on dietary chip row
4. Sticky reorder — sticky bottom-0 with safe-area inset and visual elevation
5. OG meta tags — dynamic generateMetadata with Supabase query; fallback on error

The only outstanding item is the missing `public/og-image.png` file. This was explicitly documented in 116-03-SUMMARY as a known stub ("needs to be provided"). OG text metadata (title, description, url, siteName) will work correctly; only image thumbnails in social previews will be absent. This is a design asset dependency, not a code gap.

Human verification is required to confirm visual and interaction behaviors listed above.

---

_Verified: 2026-04-11T02:00:00Z_
_Verifier: Claude (gsd-verifier)_
