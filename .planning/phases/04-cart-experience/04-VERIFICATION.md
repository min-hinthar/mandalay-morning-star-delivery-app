---
phase: 04-cart-experience
verified: 2026-01-22T18:02:50Z
status: gaps_found
score: 0/21 must-haves verified
gaps:
  - truth: "Cart button appears in header with item count badge"
    status: failed
    reason: "CartButtonV8 created but NOT integrated - app uses V7 Header with cartCount prop"
    artifacts:
      - path: "src/components/ui-v8/cart/CartButtonV8.tsx"
        issue: "Component exists (156 lines, substantive) but never imported/used outside cart directory"
    missing:
      - "Replace V7 Header cart button with CartButtonV8 in HeaderClient.tsx"
      - "Import CartButtonV8 from @/components/ui-v8/cart"
      - "Pass CartButtonV8 as rightContent prop to Header"
  
  - truth: "Badge animates (pulse) when cart count changes"
    status: failed
    reason: "CartButtonV8 has animation but is not wired to app"
    artifacts:
      - path: "src/components/ui-v8/cart/CartButtonV8.tsx"
        issue: "Badge pulse animation implemented (lines 52-84) but component not used"
    missing:
      - "Same as above - integrate CartButtonV8 into app"
  
  - truth: "Clicking cart button opens cart drawer"
    status: failed
    reason: "CartButtonV8 has open() handler but is not wired to app"
    artifacts:
      - path: "src/components/ui-v8/cart/CartButtonV8.tsx"
        issue: "useCartDrawer.open() wired (line 41, 108) but component not integrated"
    missing:
      - "Same as above - integrate CartButtonV8 into app"
  
  - truth: "Badge ref is accessible for fly-to-cart animation target"
    status: failed
    reason: "Badge ref registration works but CartButtonV8 not rendered"
    artifacts:
      - path: "src/components/ui-v8/cart/CartButtonV8.tsx"
        issue: "setBadgeRef properly registered (lines 57-64) but component not in DOM"
      - path: "src/lib/stores/cart-animation-store.ts"
        issue: "Store exists but badgeRef will always be null (CartButtonV8 never mounts)"
    missing:
      - "Same as above - integrate CartButtonV8 so ref is registered"
  
  - truth: "Cart opens as bottom sheet on mobile (< 640px)"
    status: failed
    reason: "CartDrawerV8 created but NOT integrated - app uses V7 CartDrawer"
    artifacts:
      - path: "src/components/ui-v8/cart/CartDrawerV8.tsx"
        issue: "Component exists (295 lines) with BottomSheet logic (lines 265-276) but never used"
      - path: "src/app/providers.tsx"
        issue: "Imports V7 CartDrawer from @/components/cart/v7-index (line 6), not V8"
    missing:
      - "Replace CartDrawer import with CartDrawerV8 in providers.tsx"
      - "Change: import { CartDrawer } from '@/components/cart/v7-index'"
      - "To: import { CartDrawerV8 } from '@/components/ui-v8/cart'"
      - "Update JSX: <CartDrawer /> -> <CartDrawerV8 />"
  
  - truth: "Cart opens as side drawer on desktop (>= 640px)"
    status: failed
    reason: "Same as above - CartDrawerV8 not integrated"
    artifacts:
      - path: "src/components/ui-v8/cart/CartDrawerV8.tsx"
        issue: "Drawer logic exists (lines 280-291) but component never rendered"
    missing:
      - "Same as above - integrate CartDrawerV8"
  
  - truth: "Cart shows item list with CartItemV8 components"
    status: failed
    reason: "CartItemV8 created but CartDrawerV8 not integrated"
    artifacts:
      - path: "src/components/ui-v8/cart/CartItemV8.tsx"
        issue: "Component exists (407 lines, fully implemented) but never rendered"
      - path: "src/components/ui-v8/cart/CartDrawerV8.tsx"
        issue: "Uses CartItemV8 (line 168) but drawer itself not integrated"
    missing:
      - "Same as above - integrate CartDrawerV8 which uses CartItemV8"
  
  - truth: "User can increment/decrement quantity with animated number transition"
    status: failed
    reason: "QuantitySelector has animation but CartItemV8 not rendered"
    artifacts:
      - path: "src/components/ui-v8/cart/QuantitySelector.tsx"
        issue: "Number flip animation implemented (lines 127-165) but component never displayed"
    missing:
      - "Same as above - integrate CartDrawerV8 -> CartItemV8 -> QuantitySelector chain"
  
  - truth: "User can swipe left to reveal delete action on mobile"
    status: failed
    reason: "Swipe gesture implemented but CartItemV8 not rendered"
    artifacts:
      - path: "src/components/ui-v8/cart/CartItemV8.tsx"
        issue: "Swipe-to-delete fully implemented (lines 129-155, 196-201) but never displayed"
    missing:
      - "Same as above - integrate CartDrawerV8 -> CartItemV8"
  
  - truth: "Swiping past threshold removes item from cart"
    status: failed
    reason: "Same as above - swipe logic exists but component not wired"
    artifacts:
      - path: "src/components/ui-v8/cart/CartItemV8.tsx"
        issue: "Threshold check at line 149: if (offset.x < -100 || velocity.x < -500)"
    missing:
      - "Same as above"
  
  - truth: "Decrementing to 0 removes item from cart"
    status: failed
    reason: "Same as above - decrement logic exists but component not wired"
    artifacts:
      - path: "src/components/ui-v8/cart/CartItemV8.tsx"
        issue: "Decrement-to-remove logic at lines 163-170"
    missing:
      - "Same as above"
  
  - truth: "Cart shows subtotal, delivery fee, and estimated total"
    status: failed
    reason: "CartSummary created but CartDrawerV8 not integrated"
    artifacts:
      - path: "src/components/ui-v8/cart/CartSummary.tsx"
        issue: "Component exists (220 lines) with PriceTicker for all totals but never rendered"
      - path: "src/components/ui-v8/cart/CartDrawerV8.tsx"
        issue: "Uses CartSummary (line 196) but drawer not integrated"
    missing:
      - "Same as above - integrate CartDrawerV8 which uses CartSummary"
  
  - truth: "Free delivery progress bar animates toward threshold"
    status: failed
    reason: "Progress animation implemented but CartSummary not rendered"
    artifacts:
      - path: "src/components/ui-v8/cart/CartSummary.tsx"
        issue: "Progress bar animation fully implemented (lines 59-120) but never displayed"
    missing:
      - "Same as above"
  
  - truth: "Empty cart shows friendly state with browse menu CTA"
    status: failed
    reason: "CartEmptyState created but CartDrawerV8 not integrated"
    artifacts:
      - path: "src/components/ui-v8/cart/CartEmptyState.tsx"
        issue: "Component exists (162 lines) but never rendered"
      - path: "src/components/ui-v8/cart/CartDrawerV8.tsx"
        issue: "Uses CartEmptyState (lines 140, 244) but drawer not integrated"
    missing:
      - "Same as above - integrate CartDrawerV8 which uses CartEmptyState"
  
  - truth: "Close button and backdrop click close the cart"
    status: failed
    reason: "Close handlers exist but CartDrawerV8 not integrated"
    artifacts:
      - path: "src/components/ui-v8/cart/CartDrawerV8.tsx"
        issue: "Close button (lines 106-122), backdrop handled by V8 primitives, but drawer not rendered"
    missing:
      - "Same as above"
  
  - truth: "Add-to-cart triggers fly animation from source to cart badge"
    status: failed
    reason: "FlyToCart/AddToCartButton created but not integrated, badge ref null"
    artifacts:
      - path: "src/components/ui-v8/cart/FlyToCart.tsx"
        issue: "GSAP animation fully implemented (226 lines) but never used - no AddToCartButton in app"
      - path: "src/components/ui-v8/cart/AddToCartButton.tsx"
        issue: "Component exists (235 lines) with fly integration but never imported/used"
    missing:
      - "Add AddToCartButton to menu item cards"
      - "Ensure CartButtonV8 is rendered so badgeRef is available"
      - "Import AddToCartButton from @/components/ui-v8/cart"
  
  - truth: "Cart badge pulses after fly animation completes"
    status: failed
    reason: "Badge pulse trigger exists but CartButtonV8 not rendered, fly animation never runs"
    artifacts:
      - path: "src/lib/stores/cart-animation-store.ts"
        issue: "triggerBadgePulse() implemented (lines 40-44) but never called (fly animation never runs)"
      - path: "src/components/ui-v8/cart/FlyToCart.tsx"
        issue: "Calls triggerBadgePulse on complete (line 135) but animation never triggered"
    missing:
      - "Same as above - integrate AddToCartButton and CartButtonV8"
  
  - truth: "Clear cart shows confirmation modal before clearing"
    status: failed
    reason: "ClearCartConfirmation created but never integrated into cart drawer"
    artifacts:
      - path: "src/components/ui-v8/cart/ClearCartConfirmation.tsx"
        issue: "Component exists (231 lines, modal fully implemented) but never imported/used"
    missing:
      - "Add ClearCartConfirmation to CartDrawerV8"
      - "Add 'Clear Cart' button in CartDrawerV8 that triggers confirmation"
      - "Wire useClearCartConfirmation hook"
  
  - truth: "Confirming clear cart empties the cart"
    status: failed
    reason: "Same as above - confirmation logic exists but component not integrated"
    artifacts:
      - path: "src/components/ui-v8/cart/ClearCartConfirmation.tsx"
        issue: "useCart.clearCart() called on confirm (line 217) but component never rendered"
    missing:
      - "Same as above"
  
  - truth: "Animation respects reduced motion preference"
    status: failed
    reason: "All components check shouldAnimate but are not rendered"
    artifacts:
      - path: "src/components/ui-v8/cart/CartButtonV8.tsx"
        issue: "useAnimationPreference used (line 43) but component not integrated"
      - path: "src/components/ui-v8/cart/CartItemV8.tsx"
        issue: "useAnimationPreference used (line 124) but component not integrated"
      - path: "src/components/ui-v8/cart/CartDrawerV8.tsx"
        issue: "useAnimationPreference used (line 22) but component not integrated"
    missing:
      - "Same as above - integrate all V8 cart components"
---

# Phase 4: Cart Experience Verification Report

**Phase Goal:** Deliver a delightful cart drawer with smooth animations and intuitive item management
**Verified:** 2026-01-22T18:02:50Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Critical Finding: Complete Integration Gap

All V8 cart components were created and are substantive (2117 total lines), BUT **NONE are integrated into the app**. The app continues to use V7 components from `@/components/cart/v7-index`.

### What Exists vs What's Used

| Component | V8 Version (Created) | App Uses | Integrated? |
|-----------|---------------------|----------|-------------|
| Cart Button | CartButtonV8.tsx (156 lines) | V7 Header with cartCount prop | ❌ NO |
| Cart Drawer | CartDrawerV8.tsx (295 lines) | V7 CartDrawer from v7-index | ❌ NO |
| Cart Item | CartItemV8.tsx (407 lines) | V7 CartItem | ❌ NO |
| Quantity Selector | QuantitySelector.tsx (194 lines) | V7 implementation | ❌ NO |
| Cart Summary | CartSummary.tsx (220 lines) | V7 CartSummary | ❌ NO |
| Empty State | CartEmptyState.tsx (162 lines) | Not rendered | ❌ NO |
| Fly Animation | FlyToCart.tsx (226 lines) | Not used | ❌ NO |
| Add Button | AddToCartButton.tsx (235 lines) | V7 AddToCart | ❌ NO |
| Clear Confirmation | ClearCartConfirmation.tsx (231 lines) | Not used | ❌ NO |

### Integration Points Missing

**1. src/app/providers.tsx (Line 6)**
```typescript
// CURRENT (V7):
import { CartDrawer } from "@/components/cart/v7-index";

// SHOULD BE (V8):
import { CartDrawerV8 } from "@/components/ui-v8/cart";
```

**2. src/components/layout/HeaderClient.tsx (Lines 6, 76-88)**
```typescript
// CURRENT (V7):
import { Header } from "./v7-index";
<Header cartCount={itemCount} onCartClick={openCart} ... />

// SHOULD BE (V8):
import { CartButtonV8 } from "@/components/ui-v8/cart";
<Header rightContent={<CartButtonV8 />} ... />
```

**3. Menu Item Cards (Missing entirely)**
```typescript
// SHOULD ADD:
import { AddToCartButton } from "@/components/ui-v8/cart";
<AddToCartButton item={menuItem} />
```

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Cart button appears in header with item count badge | ❌ FAILED | CartButtonV8 exists but NOT used - V7 Header used instead |
| 2 | Badge animates (pulse) when cart count changes | ❌ FAILED | Animation implemented but component not rendered |
| 3 | Clicking cart button opens cart drawer | ❌ FAILED | Handler exists but component not integrated |
| 4 | Badge ref is accessible for fly-to-cart animation target | ❌ FAILED | Ref registration works but CartButtonV8 never mounts |
| 5 | Cart opens as bottom sheet on mobile (< 640px) | ❌ FAILED | CartDrawerV8 has BottomSheet but NOT used - V7 used |
| 6 | Cart opens as side drawer on desktop (>= 640px) | ❌ FAILED | CartDrawerV8 has Drawer but NOT used - V7 used |
| 7 | Cart shows item list with CartItemV8 components | ❌ FAILED | CartItemV8 exists but CartDrawerV8 not integrated |
| 8 | User can increment/decrement quantity with animated number transition | ❌ FAILED | QuantitySelector animation exists but not rendered |
| 9 | User can swipe left to reveal delete action on mobile | ❌ FAILED | Swipe gesture implemented but not rendered |
| 10 | Swiping past threshold removes item from cart | ❌ FAILED | Threshold logic exists but not wired to app |
| 11 | Decrementing to 0 removes item from cart | ❌ FAILED | Logic exists but not wired to app |
| 12 | Cart shows subtotal, delivery fee, and estimated total | ❌ FAILED | CartSummary exists but CartDrawerV8 not integrated |
| 13 | Free delivery progress bar animates toward threshold | ❌ FAILED | Progress animation implemented but not rendered |
| 14 | Empty cart shows friendly state with browse menu CTA | ❌ FAILED | CartEmptyState exists but CartDrawerV8 not integrated |
| 15 | Close button and backdrop click close the cart | ❌ FAILED | Close handlers exist but drawer not rendered |
| 16 | Add-to-cart triggers fly animation from source to cart badge | ❌ FAILED | FlyToCart/AddToCartButton exist but not integrated |
| 17 | Cart badge pulses after fly animation completes | ❌ FAILED | Pulse trigger exists but never called (fly never runs) |
| 18 | Clear cart shows confirmation modal before clearing | ❌ FAILED | ClearCartConfirmation exists but never used |
| 19 | Confirming clear cart empties the cart | ❌ FAILED | clearCart() logic exists but modal not rendered |
| 20 | Animation respects reduced motion preference | ❌ FAILED | All components check shouldAnimate but not rendered |
| 21 | Cart items display name, image, modifiers, quantity, and price | ❌ FAILED | CartItemV8 has full display but not rendered |

**Score:** 0/21 truths verified

### Required Artifacts

| Artifact | Exists | Substantive | Wired | Status |
|----------|--------|-------------|-------|--------|
| `src/components/ui-v8/cart/CartButtonV8.tsx` | ✅ YES | ✅ YES (156 lines) | ❌ NO | ⚠️ ORPHANED |
| `src/lib/stores/cart-animation-store.ts` | ✅ YES | ✅ YES (46 lines) | ✅ YES | ⚠️ PARTIAL (ref never set) |
| `src/components/ui-v8/cart/index.ts` | ✅ YES | ✅ YES (exports) | ❌ NO | ⚠️ ORPHANED |
| `src/components/ui-v8/cart/CartItemV8.tsx` | ✅ YES | ✅ YES (407 lines) | ❌ NO | ⚠️ ORPHANED |
| `src/components/ui-v8/cart/QuantitySelector.tsx` | ✅ YES | ✅ YES (194 lines) | ✅ YES | ⚠️ PARTIAL (used by CartItemV8) |
| `src/components/ui-v8/cart/CartDrawerV8.tsx` | ✅ YES | ✅ YES (295 lines) | ❌ NO | ⚠️ ORPHANED |
| `src/components/ui-v8/cart/CartSummary.tsx` | ✅ YES | ✅ YES (220 lines) | ✅ YES | ⚠️ PARTIAL (used by CartDrawerV8) |
| `src/components/ui-v8/cart/CartEmptyState.tsx` | ✅ YES | ✅ YES (162 lines) | ✅ YES | ⚠️ PARTIAL (used by CartDrawerV8) |
| `src/components/ui-v8/cart/FlyToCart.tsx` | ✅ YES | ✅ YES (226 lines) | ❌ NO | ⚠️ ORPHANED |
| `src/components/ui-v8/cart/AddToCartButton.tsx` | ✅ YES | ✅ YES (235 lines) | ❌ NO | ⚠️ ORPHANED |
| `src/components/ui-v8/cart/ClearCartConfirmation.tsx` | ✅ YES | ✅ YES (231 lines) | ❌ NO | ⚠️ ORPHANED |

**Key:** 
- ✅ WIRED = Imported AND used in app
- ⚠️ PARTIAL = Used by other V8 cart components but root component not integrated
- ⚠️ ORPHANED = Exists but never imported outside cart directory

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| CartButtonV8 | useCartDrawer | open() on click | ❌ NOT_WIRED | Component not rendered |
| CartButtonV8 | useCart | itemCount for badge | ❌ NOT_WIRED | Component not rendered |
| CartButtonV8 | useCartAnimationStore | setBadgeRef on mount | ❌ NOT_WIRED | Component never mounts |
| CartItemV8 | useCart | updateQuantity, removeItem | ❌ NOT_WIRED | Component not rendered |
| CartItemV8 | framer-motion drag | swipe-to-delete gesture | ✅ VERIFIED | Code correct (line 196) |
| CartDrawerV8 | BottomSheet | mobile rendering | ✅ VERIFIED | Code correct (lines 265-276) |
| CartDrawerV8 | Drawer | desktop rendering | ✅ VERIFIED | Code correct (lines 280-291) |
| CartDrawerV8 | useCartDrawer | isOpen, close state | ❌ NOT_WIRED | Component not rendered |
| CartSummary | useCart | subtotal, delivery, total | ✅ VERIFIED | Code correct (lines 51-56) |
| FlyToCart | useCartAnimationStore | badgeRef target | ❌ NOT_WIRED | badgeRef always null |
| FlyToCart | GSAP | fly animation | ✅ VERIFIED | Code correct (lines 130-158) |
| AddToCartButton | useFlyToCart | celebration trigger | ❌ NOT_WIRED | Component not used |
| ClearCartConfirmation | useCart | clearCart action | ✅ VERIFIED | Code correct (line 217) |

### Requirements Coverage

All requirements (CART-01 through CART-08) are **BLOCKED** - implementation exists but is not integrated.

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| CART-01 | ❌ BLOCKED | CartDrawerV8 not integrated - app uses V7 |
| CART-02 | ❌ BLOCKED | CartItemV8 not integrated - app uses V7 |
| CART-03 | ❌ BLOCKED | CartDrawerV8 responsive logic exists but not used |
| CART-04 | ❌ BLOCKED | AddToCartButton + FlyToCart not integrated |
| CART-05 | ❌ BLOCKED | CartButtonV8 not integrated - badge animation not visible |
| CART-06 | ❌ BLOCKED | QuantitySelector not integrated - animation not visible |
| CART-07 | ❌ BLOCKED | CartItemV8 swipe gesture not integrated |
| CART-08 | ❌ BLOCKED | CartSummary not integrated - progress bar not visible |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/app/providers.tsx | 6 | Using V7 instead of V8 | 🛑 BLOCKER | Phase 4 work not delivered to users |
| src/components/layout/HeaderClient.tsx | 6 | Using V7 instead of V8 | 🛑 BLOCKER | CartButtonV8 not visible to users |
| src/components/ui-v8/cart/* | * | Orphaned components (not imported outside cart dir) | 🛑 BLOCKER | 2117 lines of code unused |

**No code anti-patterns found** - All V8 components are well-implemented with:
- ✅ Proper exports
- ✅ TypeScript types
- ✅ Animation preferences respected
- ✅ Accessibility attributes
- ✅ No console.log statements
- ✅ No stub patterns (TODO, FIXME, placeholder)
- ✅ Substantive implementations (not thin placeholders)

**The only issue is INTEGRATION** - the code quality is good, but the components were never wired into the app.

### Human Verification Required

None at this time - automated checks reveal complete integration gap. Human verification only needed AFTER integration is complete.

## Gaps Summary

**Root Cause:** Phase 4 execution completed component creation but **skipped the integration step**. All 4 plans (04-01 through 04-04) built V8 components in isolation without replacing V7 usage in the app.

**Impact:** Zero user-facing changes from Phase 4. Users still see V7 cart experience with no new animations or improvements.

**What needs to happen:**

1. **Replace V7 CartDrawer with CartDrawerV8** in `src/app/providers.tsx`
2. **Replace V7 Header cart button with CartButtonV8** in `src/components/layout/HeaderClient.tsx`
3. **Add AddToCartButton** to menu item cards
4. **Add ClearCartConfirmation** to CartDrawerV8 with trigger button
5. **Test integration** to ensure V8 components work with existing hooks (useCart, useCartDrawer)

**Effort estimate:** 30-60 minutes for integration + testing.

---

*Verified: 2026-01-22T18:02:50Z*
*Verifier: Claude (gsd-verifier)*
