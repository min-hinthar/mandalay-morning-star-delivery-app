# Sprint 2: Consistency

> **Priority**: HIGH — Standardize after bugs are fixed
> **Tasks**: 8
> **Dependencies**: Sprint 1 complete

---

## Progress

| Task | Status | Description |
|------|--------|-------------|
| 2.1 | ⬜ | Port ItemCard to MenuItemCard (16:9) |
| 2.2 | ⬜ | Full CartItem rewrite with tokens |
| 2.3 | ⬜ | Badge variants (featured, allergen, price, status) |
| 2.4 | ⬜ | Header normalization |
| 2.5 | ⬜ | Unified cart drawer/bar style |
| 2.6 | ⬜ | Full token audit |
| 2.7 | ⬜ | Stylelint + ESLint rules |
| 2.8 | ⬜ | Dark mode parity testing |

---

## Task 2.1: Port ItemCard to MenuItemCard

**Issue**: Two competing card styles (4:3 vs 16:9)
**Standard**: 16:9 (aspect-video)
**Status**: ⬜ Not Started

### Prompt

```
Consolidate all ItemCard features into MenuItemCard, deprecate ItemCard.

REQUIREMENTS:
- MenuItemCard uses 16:9 (aspect-video) - this is the standard
- ItemCard uses 4:3 - deprecated
- Port any unique ItemCard features as MenuItemCard variants/props
- Update all usages to MenuItemCard

AUDIT ITEMCARD FEATURES:
- Check for unique hover effects, badges, layouts
- Port as props: variant="compact" | "featured" | "default"

IMPLEMENTATION:
- Enhance src/components/menu/MenuItemCard.tsx
- Add any missing features from ItemCard as props
- Find and replace all ItemCard imports
- Delete src/components/menu/ItemCard.tsx (or mark deprecated)

OUTPUT:
- src/components/menu/MenuItemCard.tsx (enhanced)
- All files using ItemCard updated
- ItemCard.tsx deleted or deprecated
```

### Verification
- [ ] All cards use 16:9 aspect ratio
- [ ] No ItemCard imports remain
- [ ] All ItemCard features preserved as variants

---

## Task 2.2: Full CartItem Rewrite

**Issue**: CartItem uses tailwind colors instead of tokens
**Status**: ⬜ Not Started

### Prompt

```
Rewrite CartItem component with V4 patterns and design tokens.

REQUIREMENTS:
- Current CartItem uses tailwind colors (border, foreground, etc.)
- Rewrite to use --color-* tokens exclusively
- Follow V4 component patterns:
  - Framer Motion for animations
  - Design token variables only
  - TypeScript strict mode

IMPLEMENTATION:
- New src/components/cart/CartItem.tsx
- Structure:
  - Image (80px square, aspect-square)
  - Item details (name, modifiers, notes)
  - Quantity controls (+/- buttons)
  - Price display
  - Swipe-to-delete (mobile)
- All colors: var(--color-*)
- All spacing: var(--space-*)
- All shadows: var(--shadow-*)

OUTPUT:
- src/components/cart/CartItem.tsx (full rewrite)
- Verify in CartDrawer and CartBar contexts
```

### Verification
- [ ] No tailwind color classes
- [ ] All tokens used correctly
- [ ] Swipe-to-delete works
- [ ] Works in drawer and bar contexts

---

## Task 2.3: Badge Variants

**Issue**: Badge is generic shadcn default
**Status**: ⬜ Not Started

### Prompt

```
Enhance Badge component with V4 semantic variants.

REQUIREMENTS:
Current Badge is generic shadcn default.
Add variants:
- featured: Gold background, star icon (for popular items)
- allergen: Amber background, warning style (for dietary info)
- price: Green (discount) or red (premium) (for price modifiers)
- status: Semantic colors (for order/delivery status)

IMPLEMENTATION:
- Update src/components/ui/Badge.tsx
- Add variant prop: "default" | "featured" | "allergen" | "price-discount" | "price-premium" | "status-success" | "status-warning" | "status-error"
- Use design tokens for all colors
- Add optional icon slot

OUTPUT:
- src/components/ui/Badge.tsx (enhanced)
- Update MenuItemCard to use new badge variants
```

### Verification
- [ ] All 4 badge types work
- [ ] Tokens used for all colors
- [ ] Icons display correctly

---

## Task 2.4: Header Normalization

**Issue**: Headers have inconsistent styling
**Status**: ⬜ Not Started

### Prompt

```
Normalize all sticky headers to consistent styling.

REQUIREMENTS:
- Collapsed height: 56px (h-14)
- Backdrop: backdrop-blur-lg (16px)
- Z-index: var(--z-sticky)
- Background: var(--color-cream)/95 (light) or var(--color-background)/95 (dark)
- Border: border-b border-[var(--color-border)]

APPLY TO:
- CustomerLayout header
- MenuHeader
- CategoryTabs
- Any other sticky elements

OUTPUT:
- All sticky headers use identical token-based styling
- No hardcoded values
```

### Verification
- [ ] All headers have same collapsed height
- [ ] All headers have same blur
- [ ] All headers use token z-index

---

## Task 2.5: Unified Cart UI Style

**Issue**: Cart drawer and cart bar use different styles
**Status**: ⬜ Not Started

### Prompt

```
Create new unified style for cart drawer and cart bar.

REQUIREMENTS:
- CartDrawer and CartBar currently use different styles
- Design new shared style using only design tokens
- Apply to both components

SHARED STYLE:
- Background: var(--color-surface)
- Border: var(--color-border)
- Shadow: var(--shadow-lg)
- Spacing: var(--space-4) padding
- Typography: consistent with V4 type scale

IMPLEMENTATION:
- Create shared CartContainer styles or component
- Apply to cart-drawer.tsx and CustomerLayout CartBar
- Ensure visual consistency between drawer (tablet+) and bar (mobile)

OUTPUT:
- src/components/cart/cart-drawer.tsx (updated)
- src/components/layouts/CustomerLayout.tsx (CartBar updated)
```

### Verification
- [ ] Drawer and bar look consistent
- [ ] All tokens used correctly
- [ ] Works at all breakpoints

---

## Task 2.6: Full Token Audit

**Issue**: Hardcoded values throughout codebase
**Status**: ⬜ Not Started

### Prompt

```
Audit and replace all hardcoded values with design tokens.

REQUIREMENTS:
- No hardcoded hex colors (except in tokens.css)
- No hardcoded pixel values for spacing
- No hardcoded border-radius values
- No hardcoded opacity values

NEW TOKENS TO ADD:
- --opacity-subtle: 0.5
- --opacity-muted: 0.7
- --opacity-visible: 0.9
- --opacity-solid: 1

IMPLEMENTATION:
- Use grep/search to find all hardcoded values
- Replace with appropriate tokens
- Add missing tokens to tokens.css

VERIFY:
- Run Stylelint/ESLint (see 2.7)
- Visual regression check

OUTPUT:
- src/styles/tokens.css (expanded)
- All component files updated
```

### Verification
- [ ] No hardcoded hex values
- [ ] No hardcoded spacing values
- [ ] Opacity tokens added and used
- [ ] Linting passes (after 2.7)

---

## Task 2.7: Stylelint + ESLint Rules

**Issue**: No enforcement of token usage
**Status**: ⬜ Not Started

### Prompt

```
Create linting rules to enforce token usage.

REQUIREMENTS:
- Stylelint: Block hardcoded colors in CSS
- ESLint: Block hardcoded colors in className strings
- Warn on non-token spacing values
- Error on non-token z-index values

IMPLEMENTATION:
Stylelint config:
- stylelint-declaration-strict-value for colors, z-index
- Custom regex rules for hex/rgb values

ESLint config:
- Custom rule or plugin for className analysis
- Detect patterns like "bg-[#hex]", "text-[rgb()]"

OUTPUT:
- .stylelintrc.json (new or updated)
- .eslintrc.json (updated)
- package.json (new dev dependencies)
```

### Verification
- [ ] Lint rules detect hardcoded values
- [ ] All current code passes
- [ ] CI will catch future violations

---

## Task 2.8: Dark Mode Parity Testing

**Issue**: Need to verify all changes work in both modes
**Status**: ⬜ Not Started

### Prompt

```
Create E2E tests to verify all V4 changes work in both light and dark mode.

REQUIREMENTS:
- Test each bug fix in both modes
- Test each consistency change in both modes
- Verify no visual regressions

IMPLEMENTATION:
- Add Playwright tests with colorScheme: "light" and "dark"
- Screenshot comparison for key pages
- Specific assertions for:
  - Hero text readable
  - Category scroll works
  - Checkout loads
  - Signout works
  - Cards render correctly
  - Headers collapse/expand

OUTPUT:
- tests/e2e/v4-dark-mode.spec.ts
- tests/e2e/v4-light-mode.spec.ts
```

### Verification
- [ ] Light mode E2E tests pass
- [ ] Dark mode E2E tests pass
- [ ] No visual regressions

---

## Sprint 2 Completion Checklist

Before moving to Sprint 3:
- [ ] All 8 tasks completed
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] Lint rules passing
- [ ] E2E tests passing (light + dark)
- [ ] Visual review at all breakpoints
