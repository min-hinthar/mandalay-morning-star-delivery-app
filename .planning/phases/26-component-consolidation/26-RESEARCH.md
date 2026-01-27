# Phase 26: Component Consolidation - Research Findings

## Executive Summary

Component consolidation involves merging the `ui-v8/` directory into `ui/`, updating all import paths, removing duplicate components, and cleaning up v7 naming remnants. The CONTEXT.md prescribes a "big bang" approach with a single commit.

---

## 1. Current State Analysis

### 1.1 Directory Structure

**ui/ (40+ files):**
- Core primitives: Button, Badge, Card, Input, Checkbox, etc.
- Overlays: Dialog, AlertDialog, overlay-base.tsx, drawer.tsx, Modal.tsx, tooltip.tsx, toast.tsx
- Feedback: Alert, Progress, Skeleton, EmptyState
- Form validation: FormValidation.tsx (comprehensive)
- Storybook stories: Badge.stories.tsx, Button.stories.tsx, Input.stories.tsx, Modal.stories.tsx
- Barrel export: index.ts (comprehensive, well-organized)

**ui-v8/ (47 files across subdirectories):**
- Root overlays: Modal.tsx, BottomSheet.tsx, Drawer.tsx, Dropdown.tsx, Tooltip.tsx, Toast.tsx, ToastProvider.tsx
- overlay/: Portal.tsx, Backdrop.tsx
- cart/: AddToCartButton, CartBarV8, CartButtonV8, CartDrawerV8, CartEmptyState, CartItemV8, CartSummary, ClearCartConfirmation, FlyToCart, QuantitySelector
- menu/: BlurImage, CategoryTabsV8, EmojiPlaceholder, FavoriteButton, ItemDetailSheetV8, MenuContentV8, MenuGridV8, MenuSectionV8, MenuSkeletonV8, SearchAutocomplete, SearchInputV8
- navigation/: AppShell, BottomNav, Header, MobileMenu, PageContainer
- scroll/: RevealOnScroll, ScrollChoreographer, ParallaxLayer
- transitions/: PageTransitionV8

### 1.2 Import Usage (16 files import from ui-v8)

| File | ui-v8 Imports |
|------|---------------|
| `app/providers.tsx` | CartBarV8, CartDrawerV8, FlyToCart |
| `app/(public)/menu/page.tsx` | MenuContentV8, MenuSkeletonV8 |
| `components/homepage/HomepageMenuSection.tsx` | ItemDetailSheetV8 |
| `components/checkout/AddressStepV8.tsx` | Modal, BottomSheet |
| `components/menu/menu-header.tsx` | CartButtonV8 |
| `components/menu/menu-skeleton.tsx` | MenuItemCardV8Skeleton |
| `components/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx` | FavoriteButton |
| `components/menu/UnifiedMenuItemCard/CardImage.tsx` | getCategoryEmoji |
| `components/menu/UnifiedMenuItemCard/AddButton.tsx` | QuantitySelector, useFlyToCart |
| `ui-v8/navigation/MobileMenu.tsx` | Drawer |
| `ui-v8/menu/ItemDetailSheetV8.tsx` | Modal, BottomSheet, AddToCartButton |
| `ui-v8/cart/ClearCartConfirmation.tsx` | Modal |
| `ui-v8/cart/CartDrawerV8.tsx` | BottomSheet, Drawer |

### 1.3 Duplicate Components (Require Resolution)

| Component | ui/ | ui-v8/ | Winner (per CONTEXT) |
|-----------|-----|--------|---------------------|
| **Modal** | 745 lines (V5), nested stack support, controlled mode, header/footer slots | 402 lines (V8), responsive, swipe-to-dismiss | **V8** |
| **BottomSheet** | via overlay-base.tsx | Standalone, swipe gestures, haptic feedback | **V8** |
| **Drawer** | Vaul-based (Radix), component-based API | Custom, spring animations, focus trap | **V8** (merge BottomSheet into Drawer per CONTEXT) |
| **Tooltip** | CSS-only (group-hover), no JS state | React state, delay support, controlled mode | **V8** |
| **Toast** | Radix-based, declarative variants | Custom, imperative API, ToastContainer | **V8** (declarative only per CONTEXT) |

### 1.4 V7 Naming Remnants (4 files)

| File | Issue |
|------|-------|
| `lib/motion-tokens.ts` | File header says "V7 Motion Token System" (cosmetic) |
| `components/theme/DynamicThemeProvider.tsx` | Imports `v7Palettes` from gradients.ts |
| `lib/webgl/gradients.ts` | Exports `v7Palettes` constant |
| `stories/Page.tsx` | May reference v7 (need to verify) |

---

## 2. Component Analysis Deep Dive

### 2.1 Modal Comparison

**ui/Modal.tsx (V5):**
- 745 lines with useModal hook, ModalHeader, ModalFooter, ConfirmModal
- Nested modal stack context (ModalStackContext)
- SSR-safe (isMounted check)
- createPortal directly to document.body
- CSS variables for theming
- initialFocusRef support

**ui-v8/Modal.tsx:**
- 402 lines, simpler implementation
- Uses Portal component from overlay/
- Uses design-system tokens (zIndex, overlayMotion)
- Route-aware close (useRouteChangeClose hook)
- Mobile swipe-to-dismiss via useSwipeToClose

**Resolution:** Keep V8 Modal. V5 features to evaluate:
- useModal hook (keep - convenient state management)
- ConfirmModal (keep - common pattern)
- ModalHeader/ModalFooter components (keep - useful)
- Nested modal stack (drop - V8 doesn't have it)
- initialFocusRef (V8 has focus management already)

### 2.2 Toast Comparison

**ui/toast.tsx (V6):**
- Radix-based (@radix-ui/react-toast)
- Declarative: `<Toast variant="success">...</Toast>`
- ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastAction, ToastClose
- Uses toaster.tsx companion

**ui-v8/Toast.tsx:**
- Custom implementation
- Imperative: `toast({ message, type })`
- Uses useToastV8 hook with global state
- ToastContainer renders via Portal

**CONTEXT says:** "Toast: Declarative only (<Toast /> component, no imperative showToast function)"

**Resolution:**
- Keep V8's Toast component and ToastContainer for rendering
- Keep V8's animation and styling
- Drop the imperative `toast()` function
- Need to reconcile with Radix-based API or create declarative wrapper

**Note:** The existing useToastV8.ts hook exports an imperative `toast()` function. Per CONTEXT, this should be replaced with a declarative-only approach.

### 2.3 Drawer + BottomSheet

**CONTEXT says:** "Merge BottomSheet into Drawer - BottomSheet becomes Drawer with position='bottom'"

**ui/drawer.tsx (Vaul):**
- Uses vaul library (Radix-style primitives)
- Component-based: Drawer, DrawerTrigger, DrawerContent, DrawerHeader, etc.
- Always bottom-positioned

**ui-v8/Drawer.tsx:**
- Custom spring animations
- Side prop: "left" | "right"
- Width prop: "sm" | "md" | "lg"

**ui-v8/BottomSheet.tsx:**
- Slide-up from bottom
- Swipe-to-dismiss
- Height prop: "auto" | "full"

**Resolution:**
1. Merge BottomSheet functionality into Drawer
2. Add `position?: 'left' | 'right' | 'bottom'` prop
3. When position='bottom', use BottomSheet behavior (swipe, drag handle)
4. Drop Vaul-based drawer.tsx

### 2.4 Tooltip

**ui/tooltip.tsx:**
- CSS-only hover state (group-hover:opacity-100)
- No JavaScript state management
- Simple but limited (no delay, no keyboard support)

**ui-v8/Tooltip.tsx:**
- Full React state management
- Delay support (delayDuration prop)
- Controlled/uncontrolled modes
- Keyboard accessibility (focus shows tooltip)
- AnimatePresence for animations

**Resolution:** Use V8 Tooltip exclusively.

---

## 3. File Migration Plan

### 3.1 Components to Move (ui-v8/ -> ui/)

| Source | Destination | Notes |
|--------|-------------|-------|
| `ui-v8/Modal.tsx` | `ui/Modal.tsx` | Replaces existing, add useModal hook |
| `ui-v8/BottomSheet.tsx` | MERGE into Drawer | |
| `ui-v8/Drawer.tsx` | `ui/Drawer.tsx` | Add position='bottom' support |
| `ui-v8/Tooltip.tsx` | `ui/tooltip.tsx` | Replaces existing |
| `ui-v8/Toast.tsx` | `ui/Toast.tsx` | Make declarative |
| `ui-v8/ToastProvider.tsx` | `ui/ToastProvider.tsx` | |
| `ui-v8/Dropdown.tsx` | `ui/Dropdown.tsx` | New component |
| `ui-v8/overlay/Portal.tsx` | `ui/Portal.tsx` | |
| `ui-v8/overlay/Backdrop.tsx` | `ui/Backdrop.tsx` | |
| `ui-v8/cart/*` | `ui/cart/*` | All 11 files |
| `ui-v8/menu/*` | `ui/menu/*` | All 14 files |
| `ui-v8/navigation/*` | `ui/navigation/*` | All 6 files |
| `ui-v8/scroll/*` | `ui/scroll/*` | All 3 files |
| `ui-v8/transitions/*` | `ui/transitions/*` | All 1 file |

### 3.2 Files to Delete After Merge

- `ui/overlay-base.tsx` (replaced by V8 overlays)
- `ui/drawer.tsx` (Vaul-based, replaced)
- `ui/toast.tsx` (Radix-based, replaced)
- `ui/toaster.tsx` (companion to Radix toast)
- `ui/tooltip.tsx` (CSS-only, replaced)
- Entire `ui-v8/` directory

### 3.3 Files to Rename (V7 Prefix Removal)

| File | Change |
|------|--------|
| `lib/webgl/gradients.ts` | Rename export `v7Palettes` to `palettes` |
| `components/theme/DynamicThemeProvider.tsx` | Update import |

---

## 4. Import Path Updates

### 4.1 Pattern Transformations

```
@/components/ui-v8/Modal -> @/components/ui
@/components/ui-v8/BottomSheet -> @/components/ui (Drawer with position='bottom')
@/components/ui-v8/Drawer -> @/components/ui
@/components/ui-v8/cart -> @/components/ui/cart
@/components/ui-v8/menu -> @/components/ui/menu
@/components/ui-v8/navigation -> @/components/ui/navigation
@/components/ui-v8/scroll -> @/components/ui/scroll
@/components/ui-v8/transitions -> @/components/ui/transitions
@/components/ui-v8/overlay -> @/components/ui (Portal, Backdrop in root)
```

### 4.2 Component Rename Mappings

These V8-suffixed names should become clean names:

| Old Name | New Name |
|----------|----------|
| `MenuContentV8` | `MenuContent` |
| `MenuSkeletonV8` | `MenuSkeleton` |
| `CartBarV8` | `CartBar` |
| `CartButtonV8` | `CartButton` |
| `CartDrawerV8` | `CartDrawer` |
| `CartItemV8` | `CartItem` |
| `CategoryTabsV8` | `CategoryTabs` |
| `ItemDetailSheetV8` | `ItemDetailSheet` |
| `MenuGridV8` | `MenuGrid` |
| `MenuSectionV8` | `MenuSection` |
| `SearchInputV8` | `SearchInput` |
| `MenuItemCardV8Skeleton` | `MenuItemCardSkeleton` |
| `PageTransitionV8` | `PageTransition` |

---

## 5. Technical Considerations

### 5.1 Hook Dependencies

The V8 components depend on these hooks:
- `useRouteChangeClose` - Route-aware overlay closing
- `useBodyScrollLock` - Prevent background scroll
- `useSwipeToClose` - Touch gestures
- `useMediaQuery` - Responsive behavior
- `useToastV8` - Toast state (needs declarative wrapper)
- `useFlyToCart` - Cart animation

These hooks are in `lib/hooks/` and don't need migration.

### 5.2 Design Token Dependencies

V8 components use:
- `@/design-system/tokens/z-index` (zIndex.modal, zIndex.toast, etc.)
- `@/design-system/tokens/motion` (overlayMotion.backdrop, etc.)

These are already in place.

### 5.3 ESLint Rule for Preventing ui-v8 Recreation

Add to `eslint.config.mjs`:
```javascript
{
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@/components/ui-v8/*", "@/components/ui-v8"],
            message: "ui-v8 has been consolidated into ui/. Import from @/components/ui instead."
          }
        ]
      }
    ]
  }
}
```

### 5.4 TypeScript Path Alias

Current tsconfig.json already has:
```json
"paths": {
  "@/*": ["./src/*"]
}
```

No changes needed - `@/components/ui` already works.

---

## 6. Dead Code Detection

### 6.1 Knip Configuration

Knip is already installed and configured. Run after consolidation:
```bash
pnpm knip
```

### 6.2 Current Knip Results (Relevant)

From the current knip run, these ui-related exports are unused:
- `tap` from motion-tokens.ts
- `overlay` from motion-tokens.ts
- `flipCard` from motion-tokens.ts
- `expandingCard` from motion-tokens.ts
- `ValidatedTextarea` from FormValidation.tsx
- `ValidatedForm` from FormValidation.tsx

These can be removed during or after consolidation.

---

## 7. Risk Assessment

### 7.1 High Impact Changes

| Change | Risk | Mitigation |
|--------|------|------------|
| Modal replacement | Type mismatches | TypeScript will catch; compare prop interfaces |
| Toast API change | Breaking change | Grep for `toast({` calls, update to declarative |
| BottomSheet removal | Import failures | Grep handles all references |
| Drawer merging | Complex refactor | Test mobile swipe behavior |

### 7.2 Testing Requirements

- Run full test suite after import updates
- Manual test: Modal open/close, swipe dismiss
- Manual test: Toast notifications
- Manual test: Drawer/BottomSheet on mobile
- Manual test: Tooltip hover/focus
- Build verification (Next.js build)
- Lint verification

---

## 8. Execution Order Recommendation

Based on CONTEXT.md's "big bang" approach:

1. **Prepare**: Create unified index.ts barrel export for ui/
2. **Move**: `git mv` all ui-v8 components to ui/ (preserves history)
3. **Merge Duplicates**:
   - Modal: Add useModal, ConfirmModal from V5 to V8 Modal
   - Drawer: Add position='bottom' with BottomSheet behavior
   - Toast: Convert to declarative API
   - Tooltip: Simple replacement
4. **Delete Replaced Files**: overlay-base.tsx, drawer.tsx (vaul), toast.tsx (radix), toaster.tsx, tooltip.tsx (css)
5. **Rename V8 Suffixes**: Update all component file names and exports
6. **Update Imports**: Mass find-replace across codebase (16 files + internal V8 refs)
7. **Clean V7 Naming**: v7Palettes -> palettes
8. **Add ESLint Rule**: Prevent ui-v8 imports
9. **Delete ui-v8/**: Remove directory
10. **Verify**: lint, typecheck, build, test

---

## 9. Questions for Planning

### 9.1 Resolved by CONTEXT.md

- Migration strategy: Big bang (single commit)
- Winner resolution: V8 wins
- BottomSheet: Merge into Drawer
- Toast API: Declarative only
- Naming: Clean names (no v7/v8 prefixes)
- Documentation: Deferred to Phase 32

### 9.2 Claude's Discretion (per CONTEXT)

- **Modal controlled vs uncontrolled**: Keep V8's controlled-only pattern; useModal hook provides convenience
- **Dead code detection tooling**: Use knip (already configured)
- **Order of migration**: Recommend overlays first (Modal, Drawer, Toast, Tooltip), then cart, menu, navigation, scroll, transitions

---

## 10. Estimated Scope

| Task | Files Affected | Complexity |
|------|---------------|------------|
| Move ui-v8 components | 47 files | Low (git mv) |
| Merge duplicates | 5 components | Medium |
| Update imports | ~20 files | Low (find-replace) |
| Rename V8 suffixes | ~15 components | Low |
| Update barrel export | 1 file (index.ts) | Medium |
| Clean v7 naming | 2 files | Low |
| Add ESLint rule | 1 file | Low |
| Delete old files | 5 files + directory | Low |

**Total: Single commit, ~100 files touched, ~2-3 hours execution time**

---

## 11. Success Criteria Checklist

Per phase requirements:

- [ ] All components import from `@/components/ui/` (no ui-v8 paths)
- [ ] V7 naming removed from public APIs (palettes, not v7Palettes)
- [ ] Single Modal, BottomSheet, Drawer implementation (no duplicates)
- [ ] Single Tooltip and Toast implementation
- [ ] No broken imports after consolidation
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Lint passes
