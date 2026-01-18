# Sprint 1: Bug Fixes

> **Priority**: HIGHEST — Fix blockers first
> **Tasks**: 7
> **Dependencies**: None (start here)

---

## Progress

| Task | Status | Description |
|------|--------|-------------|
| 1.1 | ✅ | Dynamic text contrast for HomepageHero |
| 1.2 | ✅ | Saturday badge dynamic contrast |
| 1.3 | ✅ | Intersection Observer for category scroll |
| 1.4 | ✅ | Fix CheckoutLayout to 3 steps |
| 1.5 | ✅ | DropdownAction component (signout fix) |
| 1.6 | ✅ | Expanded z-index tokens + CSS Layers |
| 1.7 | ✅ | Collapsible scroll-direction-aware headers |

---

## Task 1.1: Dynamic Text Contrast for HomepageHero

**Bug**: White text on white/cream background is unreadable
**File**: `src/components/homepage/HomepageHero.tsx` (lines 154, 207)
**Status**: ✅ Complete
**Implementation**: Created `src/lib/hooks/useLuminance.ts` with WCAG-compliant luminance detection

### Prompt

```
Create a useLuminance hook and apply it to HomepageHero.tsx for dynamic text color.

REQUIREMENTS:
- Create src/lib/hooks/useLuminance.ts
- Calculate relative luminance of background color
- Return "light" | "dark" based on WCAG contrast threshold
- For gradients, sample the dominant color or use weighted average

IMPLEMENTATION:
- Parse CSS color (hex, rgb, hsl) to RGB values
- Calculate luminance: L = 0.2126*R + 0.7152*G + 0.0722*B
- Threshold: if L > 0.179, background is light → use dark text
- Apply to HomepageHero.tsx lines 154, 207
- Replace text-white with dynamic class based on luminance
- Add text-shadow for additional contrast on gradients

OUTPUT:
- src/lib/hooks/useLuminance.ts
- Update src/components/homepage/HomepageHero.tsx

TOKENS TO USE:
- var(--color-charcoal) for dark text
- var(--color-cream) for light text
```

### Verification
- [ ] Text readable on light backgrounds
- [ ] Text readable on dark backgrounds
- [ ] Text readable on gradient backgrounds
- [ ] Works in dark mode
- [ ] TypeScript clean

---

## Task 1.2: Saturday Badge Dynamic Contrast

**Bug**: Saturday badge has white text on translucent white glass
**File**: `src/components/homepage/HomepageHero.tsx` (lines 199-210)
**Status**: ⬜ Not Started

### Prompt

```
Apply the same luminance detection to the Saturday delivery badge in HomepageHero.

REQUIREMENTS:
- Use useLuminance hook from Task 1.1
- Saturday badge (lines 199-210) currently uses .glass class with white text
- Detect the effective background (glass overlay on gradient)
- Switch text color dynamically

IMPLEMENTATION:
- Option A: Use dark text with glass effect
- Option B: Replace glass with solid bg-[var(--color-primary)]/90
- Badge should be visible on ALL hero image variants (A/B test ready)

OUTPUT:
- Update src/components/homepage/HomepageHero.tsx lines 199-210
- Ensure badge readable in light mode, dark mode, and all A/B variants
```

### Verification
- [ ] Saturday badge always readable
- [ ] Works on all hero variants
- [ ] Works in light and dark mode

---

## Task 1.3: Intersection Observer for Category Scroll

**Bug**: Category tab click jumps page awkwardly (headerOffset mismatch)
**File**: `src/components/menu/menu-content.tsx` (lines 59-83)
**Status**: ⬜ Not Started

### Prompt

```
Replace hardcoded headerOffset with Intersection Observer in menu-content.tsx.

REQUIREMENTS:
- Remove headerOffset = 140 (line 59-83)
- Create useActiveCategory hook using Intersection Observer
- Observe all category sections
- Update active category when section enters viewport
- Smooth scroll to category when tab clicked

IMPLEMENTATION:
- src/lib/hooks/useActiveCategory.ts
- Options: { rootMargin: "-56px 0px -80% 0px" } (accounts for collapsed header)
- Track which section is most visible
- Update URL hash without page jump
- scrollIntoView with behavior: "smooth"

OUTPUT:
- src/lib/hooks/useActiveCategory.ts
- Update src/components/menu/menu-content.tsx
- Remove scroll-mt-32 hacks, use proper IO detection
```

### Verification
- [ ] Category tab click scrolls smoothly
- [ ] No page jump on click
- [ ] Active tab updates correctly when scrolling
- [ ] Works with collapsible header (Task 1.7)

---

## Task 1.4: Fix CheckoutLayout to 3 Steps

**Bug**: Type mismatch (4 steps in layout, 3 in store) causes checkout steps not to load
**Files**: `src/components/layouts/CheckoutLayout.tsx`, `src/types/checkout.ts`
**Status**: ⬜ Not Started

### Prompt

```
Reconcile CheckoutLayout.tsx with checkout-store.ts - use 3 steps everywhere.

REQUIREMENTS:
- CheckoutLayout.tsx has 4 steps: address, time, review, pay
- checkout-store.ts has 3 steps: address, time, payment
- Standardize on 3 steps: address, time, payment
- Integrate CheckoutLayout as the page wrapper

IMPLEMENTATION:
- Update src/components/layouts/CheckoutLayout.tsx:
  - Change steps to ["address", "time", "payment"]
  - Remove "review" and "pay" steps
  - Match labels: "Address", "Time", "Payment"
- Update src/types/checkout.ts to export single source of truth
- Ensure checkout page uses CheckoutLayout wrapper

OUTPUT:
- src/components/layouts/CheckoutLayout.tsx (fixed)
- src/types/checkout.ts (canonical type)
- src/app/(customer)/checkout/page.tsx (use wrapper)
```

### Verification
- [ ] All 3 checkout steps load
- [ ] Navigation between steps works
- [ ] TypeScript clean (no type errors)
- [ ] E2E test passes

---

## Task 1.5: DropdownAction Component

**Bug**: Signout button doesn't work (form inside Radix dropdown)
**File**: `src/components/auth/user-menu.tsx` (lines 65-72)
**Status**: ⬜ Not Started

### Prompt

```
Create a full-featured DropdownAction component to fix signout and other dropdown forms.

REQUIREMENTS:
- Replace form-based actions in Radix dropdowns
- Props: onClick, loading, disabled, icon, variant, children
- Loading state: spinner replaces icon
- Support async onClick handlers
- Properly propagate click through Radix dropdown

IMPLEMENTATION:
- src/components/ui/DropdownAction.tsx
- Use Radix DropdownMenuItem internally
- Handle async: set loading true, await onClick, set loading false
- Error handling: catch and log, don't break dropdown
- Variants: default, destructive (for signout/delete actions)

USAGE IN USER-MENU:
- Replace <form action={signOut}> with <DropdownAction onClick={signOut}>
- Show loading spinner while signing out
- Handle success (redirect) and error (toast)

OUTPUT:
- src/components/ui/DropdownAction.tsx
- Update src/components/auth/user-menu.tsx
```

### Verification
- [ ] Signout button works
- [ ] Loading spinner shows while signing out
- [ ] Redirects to login on success
- [ ] Error toast on failure

---

## Task 1.6: Expanded Z-Index Tokens + CSS Layers

**Bug**: Hardcoded z-index values (z-30) break stacking order
**Files**: `src/styles/tokens.css`, `src/styles/globals.css`, multiple components
**Status**: ⬜ Not Started

### Prompt

```
Create comprehensive z-index token system with CSS @layer for cascade control.

REQUIREMENTS:
- Expand current z-index tokens (--z-sticky: 20, --z-modal: 50)
- Add granular levels: base, dropdown, tooltip, overlay, modal, toast
- Use CSS @layer for proper cascade order
- Replace all hardcoded z-index values (z-30, z-40, etc.)

IMPLEMENTATION:
tokens.css additions:
  --z-base: 1;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-overlay: 30;
  --z-modal: 40;
  --z-tooltip: 50;
  --z-toast: 60;

CSS Layers (globals.css):
  @layer base, tokens, components, utilities;

AUDIT FILES:
- menu-header.tsx (z-30 → --z-sticky)
- category-tabs.tsx (z-20 → --z-sticky)
- All modals, drawers, tooltips

OUTPUT:
- src/styles/tokens.css (expanded)
- src/styles/globals.css (CSS layers)
- All files with hardcoded z-index updated
```

### Verification
- [ ] No hardcoded z-index values
- [ ] Stacking order correct (tooltips > modals > sticky > base)
- [ ] CSS layers working
- [ ] TypeScript clean

---

## Task 1.7: Collapsible Scroll-Direction-Aware Headers

**Bug**: Header heights inconsistent (56px, 64px, 60px)
**Files**: Multiple layout and header components
**Status**: ⬜ Not Started

### Prompt

```
Create useScrollDirection hook and apply to all sticky headers.

REQUIREMENTS:
- Headers expand on scroll up, collapse on scroll down
- Collapsed height: 56px (h-14)
- Expanded height: variable (depends on content)
- Smooth transition: 200ms ease-out
- Apply to: CustomerLayout, MenuHeader, CategoryTabs

IMPLEMENTATION:
- src/lib/hooks/useScrollDirection.ts
  - Track scroll position
  - Detect direction: "up" | "down" | "idle"
  - Debounce/throttle for performance
  - Return { scrollDirection, isCollapsed }

- Header component pattern:
  - Expanded: show full content
  - Collapsed: show minimal (logo + key actions)
  - Transition: height + opacity for extra content

OUTPUT:
- src/lib/hooks/useScrollDirection.ts
- Update src/components/layouts/CustomerLayout.tsx
- Update src/components/menu/menu-header.tsx
- Update src/components/menu/category-tabs.tsx
```

### Verification
- [ ] Headers collapse on scroll down
- [ ] Headers expand on scroll up
- [ ] Collapsed height is exactly 56px
- [ ] Transition is smooth (200ms)
- [ ] No layout shift (CLS)

---

## Sprint 1 Completion Checklist

Before moving to Sprint 2:
- [x] All 7 tasks completed
- [x] `pnpm typecheck` passes
- [x] `pnpm test` passes (346 tests, including updated menu-content tests)
- [x] E2E tests written (`e2e/sprint-1-bugfixes.spec.ts`)
- [ ] E2E tests passing (requires dev server)
- [ ] Visual review in light mode
- [ ] Visual review in dark mode
- [ ] Tested at 375px, 768px, 1024px, 1440px
