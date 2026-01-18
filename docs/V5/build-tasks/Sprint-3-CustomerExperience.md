# Sprint 3: Customer Experience

> **Priority**: HIGH — Customer-facing features
> **Tasks**: 6
> **Dependencies**: Sprint 1 & 2 complete
> **Source**: docs/V5/PRD.md, docs/V5/UX-spec.md

---

## Progress

| Task | Status | Description |
|------|--------|-------------|
| 3.1 | ✅ | Homepage hero V5 token refresh |
| 3.2 | ✅ | Menu accordion sections |
| 3.3 | ✅ | Cart bottom sheet (mobile) |
| 3.4 | ✅ | Cart bar token refresh |
| 3.5 | ✅ | Checkout upsell section |
| 3.6 | ✅ | Component token audit & cleanup |

---

## Task 3.1: Homepage Hero Refresh

**Goal**: Update HomepageHero and FooterCTA to use V5 design tokens
**Status**: ✅ Complete

### Files to Update
- `src/components/homepage/HomepageHero.tsx`
- `src/components/homepage/FooterCTA.tsx`

### Issues Found
- Hardcoded hex colors: `#8B1A1A` (pagoda), `#D4AF37` (lotus)
- V4 aliases: `text-gradient-gold`, `accent-tertiary`, `shadow-premium`
- Missing V5 semantic tokens

### Changes Required
- Replace hardcoded colors with `var(--color-interactive-primary)`
- Replace `accent-tertiary` with `var(--color-accent-tertiary)`
- Use `var(--color-text-inverse)` instead of `text-white`
- Update motion to use `var(--duration-*)` tokens

### Verification
- [x] No hardcoded hex colors in decorative elements
- [x] All V4 aliases replaced with V5 tokens
- [x] Dark mode renders correctly
- [x] Animations use motion tokens

---

## Task 3.2: Menu Accordion Sections

**Goal**: Create collapsible menu categories per UX-spec
**Status**: ✅ Complete

### Files to Create
- `src/components/menu/MenuAccordion.tsx`

### UX-Spec Requirements
```
┌─────────────────────────────────────────┐
│ ▼ Appetizers                      (12)  │ ← Header: tap to expand/collapse
├─────────────────────────────────────────┤
│ ┌─────────┐                             │
│ │  IMG    │ Samosa (4 pcs)              │ ← Item card
│ │         │ Crispy pastry with...       │
│ └─────────┘ $8.99           [+ Add]     │
└─────────────────────────────────────────┘
```

- Chevron rotates 180° on expand
- Item count badge always visible
- First category auto-expanded on load
- Smooth height animation (300ms ease-out)

### Implementation
- Use Radix Accordion primitive or custom
- Integrate with existing category data
- Add item count badges per category
- Support keyboard navigation

### Verification
- [x] Accordion expands/collapses correctly
- [x] Item counts displayed in headers
- [x] First category auto-expanded
- [x] Animation smooth (300ms ease-out)
- [x] Keyboard accessible

---

## Task 3.3: Cart Bottom Sheet (Mobile)

**Goal**: Implement mobile-friendly cart with gestures
**Status**: ✅ Complete

### Files to Update
- `src/components/cart/cart-drawer.tsx`

### UX-Spec Requirements
```
┌─────────────────────────────────────────┐
│              ═══                        │ ← Drag handle
│                                         │
│  Your Cart                    [X Close] │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Samosa (4 pcs)         x2  $17.98 │  │ ← Swipe left to delete
│  │ Spring Rolls           x1   $7.99 │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ─────────────────────────────────────  │
│  Subtotal                      $25.97   │
│  Delivery Fee                   $4.99   │
│  ─────────────────────────────────────  │
│  Total                         $30.96   │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │        Checkout  →                  ││ ← Primary CTA
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Implementation
- Use BottomSheet from overlay-base.tsx
- Add drag-to-dismiss gesture
- Add swipe-to-delete on cart items
- Responsive: bottom sheet (mobile), drawer (desktop)

### Verification
- [x] Bottom sheet opens on mobile
- [x] Drawer opens on desktop
- [x] Drag handle functional
- [x] Swipe down to minimize
- [x] V5 tokens applied throughout

---

## Task 3.4: Cart Bar Refresh

**Goal**: Update cart bar to V5 tokens and add safe-area support
**Status**: ✅ Complete

### Files to Update
- `src/components/cart/CartBar.tsx`

### Changes Required
- Replace button hex colors with `var(--color-interactive-primary)`
- Ensure 44px minimum touch target
- Add safe-area padding for notch devices

### Verification
- [x] All colors use V5 tokens
- [x] Touch targets ≥ 44px
- [x] Safe-area padding applied
- [x] Dark mode renders correctly

---

## Task 3.5: Checkout Upsell Section

**Goal**: Implement "goes well with" recommendations
**Status**: ✅ Complete

### Files to Update/Review
- `src/components/checkout/UpsellSection.tsx`

### UX-Spec Requirements
- "Goes well with" recommendations
- Smaller cards with quick-add button
- Skippable with clear "No thanks" button
- Shown during checkout, not blocking

### Implementation
- Review existing component
- Ensure V5 token compliance
- Add "No thanks" skip button
- Integration with checkout flow

### Verification
- [x] Upsell cards display correctly
- [x] Quick-add functionality works
- [x] "No thanks" button skips section
- [x] V5 tokens used throughout

---

## Task 3.6: Component Token Audit

**Goal**: Fix token inconsistencies across customer components
**Status**: ✅ Complete

### Files to Audit

| File | Issue | Fix |
|------|-------|-----|
| `CartSummary.tsx` | `emerald-600`, `amber-*` | `var(--color-status-*)` |
| `PaymentStep.tsx` | Generic Shadcn defaults | V5 tokens |
| `HowItWorksTimeline.tsx` | Hardcoded step colors | Semantic tokens |
| Multiple files | `text-muted` | `var(--color-text-secondary)` |

### Token Mapping

| V4/Hardcoded | V5 Replacement |
|--------------|----------------|
| `emerald-600` | `var(--color-status-success)` |
| `amber-500` | `var(--color-status-warning)` |
| `text-muted` | `var(--color-text-secondary)` |
| `brand-red` | `var(--color-accent-tertiary)` |
| `gold` | `var(--color-interactive-primary)` |
| `jade` | `var(--color-accent-secondary)` |

### Verification
```bash
# Should return no matches after completion
grep -r "brand-red\|text-muted\|emerald-\|amber-" src/components/
```

---

## Sprint 3 Completion Checklist

✅ **SPRINT 3 COMPLETE** (January 2026)

### Components
- [x] HomepageHero uses V5 tokens
- [x] FooterCTA uses V5 tokens
- [x] MenuAccordion component created
- [x] Cart bottom sheet with gestures
- [x] Cart bar with safe-area
- [x] UpsellSection complete

### Quality Gates
- [x] `pnpm typecheck` passes
- [x] `pnpm test` passes (346 tests)
- [x] Dark mode parity verified
- [x] WCAG AA contrast compliance
- [x] Mobile gestures functional

---

## Files Modified This Sprint

```
src/
├── components/
│   ├── homepage/
│   │   ├── HomepageHero.tsx (update)
│   │   └── FooterCTA.tsx (update)
│   ├── menu/
│   │   └── MenuAccordion.tsx (new)
│   ├── cart/
│   │   ├── cart-drawer.tsx (update)
│   │   ├── CartBar.tsx (update)
│   │   └── CartSummary.tsx (update)
│   └── checkout/
│       ├── UpsellSection.tsx (update)
│       └── PaymentStep.tsx (update)
docs/
└── V5/
    └── build-tasks/
        └── Sprint-3-CustomerExperience.md (new)
```
