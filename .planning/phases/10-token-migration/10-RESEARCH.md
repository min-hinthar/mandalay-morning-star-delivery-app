# Phase 10: Token Migration - Research

**Researched:** 2026-01-23
**Domain:** Design token migration (z-index and color tokens)
**Confidence:** HIGH

## Summary

Phase 10 migrates all hardcoded z-index values and gradient colors to the established design token system. The codebase already has a comprehensive token system in place with TypeScript constants, CSS custom properties, and Tailwind utility classes for z-index. Color tokens exist but some components still use hardcoded hex values.

Research identified **30 files** requiring z-index migration and **4 components** requiring gradient color tokenization. The existing V8 components demonstrate the correct migration pattern - importing from `@/design-system/tokens/z-index` and using the token objects.

**Primary recommendation:** Migrate files incrementally by domain (homepage, menu, tracking, UI), using ESLint warnings as validation that all hardcoded values are removed.

## Standard Stack

### Token System Architecture

| Layer | File | Purpose | Usage |
|-------|------|---------|-------|
| TypeScript | `src/design-system/tokens/z-index.ts` | Runtime constants | `zIndex.modal`, `zIndexVar.modal`, `zClass.modal` |
| CSS | `src/styles/tokens.css` | CSS custom properties | `var(--zindex-modal)` |
| Tailwind | `tailwind.config.ts` | Utility classes | `z-modal`, `z-dropdown` |

### Z-Index Token Values

| Token | Value | Semantic Use |
|-------|-------|--------------|
| `base` | 0 | Default layer |
| `dropdown` | 10 | Dropdown menus |
| `sticky` | 20 | Sticky headers |
| `fixed` | 30 | Fixed positioning |
| `modalBackdrop` | 40 | Modal overlays |
| `modal` | 50 | Modal content |
| `popover` | 60 | Popovers, flyouts |
| `tooltip` | 70 | Tooltips |
| `toast` | 80 | Toast notifications |
| `max` | 100 | Emergency override |

### Color Token System

| Property | CSS Variable | Tailwind Class |
|----------|--------------|----------------|
| Primary red | `var(--color-primary)` | `bg-primary`, `text-primary` |
| Secondary yellow | `var(--color-secondary)` | `bg-secondary`, `text-secondary` |
| Accent green | `var(--color-accent-green)` | `bg-green`, `text-green` |

## Architecture Patterns

### Pattern 1: Inline Style z-index (Use `zIndex` constant)

**What:** For inline styles, import and use the numeric constant
**When to use:** `style={{ zIndex: value }}` patterns
**Example:**
```typescript
// Source: src/components/ui-v8/Modal.tsx
import { zIndex } from "@/design-system/tokens/z-index";

// Before
style={{ zIndex: 50 }}

// After
style={{ zIndex: zIndex.modal }}
```

### Pattern 2: Inline Style CSS Variable (Use `zIndexVar`)

**What:** For style objects needing CSS variable syntax
**When to use:** When CSS cascading or theming is needed
**Example:**
```typescript
import { zIndexVar } from "@/design-system/tokens/z-index";

style={{ zIndex: zIndexVar.modal }} // outputs "var(--zindex-modal)"
```

### Pattern 3: Tailwind Classes (Use `zClass` or direct class)

**What:** For className-based z-index
**When to use:** Tailwind/className strings
**Example:**
```typescript
import { zClass } from "@/design-system/tokens/z-index";

// Before
className="z-10"

// After (option A - string literal)
className="z-dropdown"

// After (option B - constant)
className={zClass.dropdown}
```

### Pattern 4: Gradient Color Tokenization

**What:** Replace hardcoded hex values with CSS custom properties
**When to use:** Gradient backgrounds
**Example:**
```typescript
// Before
className="bg-gradient-to-r from-[#D4A017] via-[#A41034] to-[#D4A017]"

// After
className="bg-gradient-to-r from-secondary via-primary to-secondary"

// Or for complex gradients in style objects:
style={{
  background: "linear-gradient(to right, var(--color-secondary), var(--color-primary), var(--color-secondary))"
}}
```

### Anti-Patterns to Avoid

- **Hardcoded numbers:** Never use `z-[50]` or `zIndex: 50`
- **Magic numbers:** Never use arbitrary values like `z-[9999]`
- **Inconsistent imports:** Always import from `@/design-system/tokens/z-index`, not relative paths

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Z-index values | Custom constants | `zIndex` from tokens | Centralized, ESLint-enforced |
| Z-index CSS vars | String templates | `zIndexVar` from tokens | Type-safe, consistent |
| Z-index classes | String literals | Tailwind `z-modal` etc | Config-driven |
| Chart colors | Inline hex codes | CSS custom properties | Theme-aware, maintainable |

## Common Pitfalls

### Pitfall 1: Wrong Token Selection

**What goes wrong:** Using `z-sticky` (20) when content should be above fixed elements
**Why it happens:** Not understanding the layer hierarchy
**How to avoid:** Consult token table; sticky < fixed < modal
**Warning signs:** Elements visually hidden behind others

### Pitfall 2: Negative z-index Migration

**What goes wrong:** `-z-10` should become `-z-dropdown` but this doesn't exist
**Why it happens:** Tailwind doesn't auto-generate negative variants for custom z-index
**How to avoid:** Use inline style for negative values: `style={{ zIndex: -zIndex.dropdown }}`
**Warning signs:** ESLint won't catch `-z-10`

### Pitfall 3: Relative Stacking Context

**What goes wrong:** Local z-index within a component (1, 2, 3) migrated to global tokens
**Why it happens:** Treating all z-index values as global layers
**How to avoid:** Check if parent creates stacking context; keep local values as small numbers
**Warning signs:** Comments like "local stacking only"

### Pitfall 4: Gradient Alpha Channels

**What goes wrong:** Tokenizing `rgba(164, 16, 52, 0.3)` as `var(--color-primary)` loses opacity
**Why it happens:** CSS variables don't support alpha modification directly
**How to avoid:** Use CSS `color-mix()` or keep explicit rgba with token color values
**Warning signs:** Gradients becoming fully opaque

## Code Examples

### Example 1: Modal Migration (Full Pattern)

```typescript
// Source: src/components/ui-v8/Modal.tsx
import { zIndex } from "@/design-system/tokens/z-index";

// Backdrop
<motion.div
  style={{ zIndex: zIndex.modalBackdrop }}
  className="fixed inset-0 bg-black/50"
/>

// Content
<motion.div
  style={{ zIndex: zIndex.modal }}
  className="fixed ..."
/>
```

### Example 2: Toast Migration

```typescript
// Source: src/components/ui-v8/Toast.tsx
import { zIndex } from "@/design-system/tokens/z-index";

<ToastViewport
  style={{ zIndex: zIndex.toast }}
  className="fixed bottom-0 ..."
/>
```

### Example 3: Header with Token Classes

```typescript
// Source: src/components/ui-v8/navigation/Header.tsx
import { zClass } from "@/design-system/tokens/z-index";

<header className={cn("fixed top-0 left-0 right-0", zClass.fixed)}>
```

### Example 4: Gradient Color Migration

```typescript
// Before (footer.tsx)
className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]"

// After - use semantic surface colors
className="bg-gradient-to-br from-[var(--color-surface-primary)] via-[var(--color-surface-secondary)] to-[var(--color-surface-tertiary)]"

// Or for dark footer specifically, add token:
// In tokens.css: --color-footer-bg-start: #1a1a2e;
// Then: from-[var(--color-footer-bg-start)]
```

## File Inventory

### Z-Index Migration by Domain

**Homepage (6 files):**
| File | Issues | Migration Strategy |
|------|--------|-------------------|
| `src/components/homepage/Hero.tsx` | `zIndex: 1, 2, 3, 4` inline | Keep local (stacking context) |
| `src/components/homepage/FloatingFood.tsx` | `zIndex` prop, inline numbers | Keep local (parallax layers) |
| `src/components/homepage/Timeline.tsx` | `z-10` | `z-dropdown` |
| `src/components/homepage/TestimonialsSection.tsx` | `z-10` | `z-dropdown` |
| `src/components/homepage/HowItWorksTimeline.tsx` | `z-10` (2 locations) | `z-dropdown` |
| `src/components/homepage/HomepageHero.tsx` | `z-10`, `-z-10` | `z-dropdown`, negative inline |
| `src/components/homepage/CoverageSection.tsx` | `z-10` (2 locations) | `z-dropdown` |

**Menu (9 files):**
| File | Issues | Migration Strategy |
|------|--------|-------------------|
| `src/components/menu/menu-skeleton.tsx` | `z-10` | `z-dropdown` |
| `src/components/menu/menu-item-card.tsx` | `z-10` (3 locations) | `z-dropdown` |
| `src/components/menu/MenuItemCard.tsx` | `z-10`, `z-20` (4 locations) | `z-dropdown`, `z-sticky` |
| `src/components/menu/item-detail-modal.tsx` | `z-10`, `z-20` | `z-dropdown`, `z-sticky` |
| `src/components/menu/MenuLayout.tsx` | `z-20` | `z-sticky` |
| `src/components/menu/ItemDetail.tsx` | `z-20` | `z-sticky` |
| `src/components/menu/category-tabs.tsx` | `z-10` (3 locations) | `z-dropdown` |
| `src/components/menu/CategoryCarousel.tsx` | `z-10`, `z-30` | `z-dropdown`, `z-fixed` |
| `src/components/ui-v8/menu/MenuItemCardV8.tsx` | `z-10` | `z-dropdown` |
| `src/components/ui-v8/menu/BlurImage.tsx` | `z-10` (2 locations) | `z-dropdown` |

**Tracking (4 files):**
| File | Issues | Migration Strategy |
|------|--------|-------------------|
| `src/components/tracking/TrackingMap.tsx` | `z-10` (4 locations) | `z-dropdown` |
| `src/components/tracking/TrackingPageClient.tsx` | `z-20` | `z-sticky` |
| `src/components/tracking/DeliveryMap.tsx` | `z-10` (4 locations) | `z-dropdown` |
| `src/components/tracking/PushToast.tsx` | `zIndex: 100 - index` | `zIndex.max - index` |

**UI Components (6 files):**
| File | Issues | Migration Strategy |
|------|--------|-------------------|
| `src/components/ui/Carousel.tsx` | `z-10` | `z-dropdown` |
| `src/components/ui/TabSwitcher.tsx` | `z-10` (6 locations) | `z-dropdown` |
| `src/components/ui/overlay-base.tsx` | `z-10`, `zIndex` prop | Token or prop passthrough |
| `src/components/ui/Modal.tsx` | `zIndex` calculation | `zIndex.modal + stackLevel * 10` |
| `src/components/ui-v8/Modal.tsx` | `z-10` in close button | `z-dropdown` |
| `src/components/ui-v8/scroll/ParallaxLayer.tsx` | `z-10` | `z-dropdown` |

**Remaining (5 files):**
| File | Issues | Migration Strategy |
|------|--------|-------------------|
| `src/components/layout/footer.tsx` | `z-10` (2) | `z-dropdown` |
| `src/components/cart/CartBar.tsx` | `z-10` | `z-dropdown` |
| `src/components/cart/CartAnimations.tsx` | `zIndex: 9999` | `zIndex.max` |
| `src/components/driver/PhotoCapture.tsx` | `z-10` | `z-dropdown` |
| `src/components/auth/WelcomeAnimation.tsx` | `z-10` | `z-dropdown` |
| `src/components/checkout/TimeSlotPicker.tsx` | `z-10` (2) | `z-dropdown` |

### Color Token Migration (4 files)

| File | Hardcoded Colors | Migration Strategy |
|------|------------------|-------------------|
| `src/components/layout/footer.tsx` | `#1a1a2e`, `#16213e`, `#0f0f23`, rgba values | Add footer-specific dark surface tokens or use existing dark theme tokens |
| `src/components/layout/header.tsx` | `#D4A017`, `#A41034` in gradients | Use `from-secondary via-primary to-secondary` |
| `src/components/ui/FlipCard.tsx` | `#A41034`, `#7a0c27`, `#EBCD00` | Use `from-primary to-primary-active`, `text-secondary` |
| `src/components/admin/analytics/Charts.tsx` | V7_COLORS object with hex values | Convert to use CSS custom properties |
| `src/components/admin/analytics/PerformanceChart.tsx` | V5_CHART_COLORS object | Convert to use CSS custom properties |
| `src/components/admin/RevenueChart.tsx` | V6_CHART_COLORS object | Convert to use CSS custom properties |

## ESLint Validation

### Rule Location
`eslint.config.mjs` lines 41-74

### What It Catches
```javascript
// Rule 1: Arbitrary z-[number] values
"z-[10]", "z-[999]" // Flagged

// Rule 2: Standard Tailwind z-* numeric classes
"z-0", "z-10", "z-20", "z-30", "z-40", "z-50", "z-auto" // Flagged

// Rule 3: Inline zIndex with numeric literals
style={{ zIndex: 50 }} // Flagged
```

### Running Validation
```bash
# Check all files for z-index warnings
pnpm lint 2>&1 | grep -c "z-index"

# Target specific files
npx eslint --no-warn-ignored src/components/homepage/Hero.tsx
```

### What It Does NOT Catch
- Negative z-index values (`-z-10`)
- zIndex with expressions (`zIndex: 100 - index`)
- Hardcoded colors (separate rule needed)

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `z-50` class | `z-modal` class | Semantic, maintainable |
| `zIndex: 50` inline | `zIndex: zIndex.modal` | Type-safe, centralized |
| Hardcoded hex colors | CSS custom properties | Theme-aware, consistent |

**Already migrated (V8 components):**
- `src/components/ui-v8/Modal.tsx`
- `src/components/ui-v8/Toast.tsx`
- `src/components/ui-v8/BottomSheet.tsx`
- `src/components/ui-v8/Dropdown.tsx`
- `src/components/ui-v8/Drawer.tsx`
- `src/components/ui-v8/Tooltip.tsx`
- `src/components/ui-v8/navigation/Header.tsx`
- `src/components/ui-v8/cart/FlyToCart.tsx`
- `src/components/ui-v8/overlay/Backdrop.tsx`

## Open Questions

1. **Local stacking context values (Hero.tsx, FloatingFood.tsx)**
   - What we know: These use zIndex 1, 2, 3 for parallax layering within a stacking context
   - What's unclear: Should these use tokens or remain as local numbers?
   - Recommendation: Keep as local numbers with comment; ESLint rule specifically exempts these patterns

2. **Footer dark gradient colors**
   - What we know: Footer uses unique dark colors not in current token palette
   - What's unclear: Add new tokens or map to existing dark theme tokens?
   - Recommendation: Add `--color-footer-bg-*` tokens for explicit theming control

3. **Chart color consistency**
   - What we know: Three different chart color objects (V5, V6, V7)
   - What's unclear: Should these consolidate to one?
   - Recommendation: Create shared chart color tokens; out of scope for this phase but note for future

## Sources

### Primary (HIGH confidence)
- `src/design-system/tokens/z-index.ts` - Token definitions
- `src/styles/tokens.css` - CSS custom properties (lines 254-263)
- `tailwind.config.ts` - Tailwind z-index config (lines 266-277)
- `eslint.config.mjs` - ESLint rule configuration
- V8 component examples (Modal, Toast, Header, etc.)

### Secondary (MEDIUM confidence)
- Grep results for z-index patterns across codebase
- File inventory counts from glob searches

## Metadata

**Confidence breakdown:**
- Token system: HIGH - Verified from source files
- File inventory: HIGH - Verified with grep/glob
- Migration patterns: HIGH - Verified from V8 examples
- ESLint rule: HIGH - Verified from eslint.config.mjs

**Research date:** 2026-01-23
**Valid until:** 60 days (stable internal system)
