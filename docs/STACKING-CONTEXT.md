# Stacking Context Rules

## Overview

This document defines the z-index layer system and stacking context patterns for the Morning Star app. Following these rules prevents z-index conflicts where overlays block clicks or elements appear in wrong order.

## Z-Index Layer System

| Token | Value | Tailwind Class | Use For |
|-------|-------|----------------|---------|
| `--z-index-base` | 0 | `z-base` | Default stacking, page content |
| `--z-index-dropdown` | 10 | `z-dropdown` | Dropdown menus, select options |
| `--z-index-sticky` | 20 | `z-sticky` | Sticky headers, floating buttons |
| `--z-index-fixed` | 30 | `z-fixed` | Fixed navigation, persistent UI |
| `--z-index-modal-backdrop` | 40 | `z-modal-backdrop` | Modal/drawer backdrops |
| `--z-index-modal` | 50 | `z-modal` | Modal dialogs, drawers, sheets |
| `--z-index-popover` | 60 | `z-popover` | Popovers appearing over modals |
| `--z-index-tooltip` | 70 | `z-tooltip` | Tooltips (always on top of content) |
| `--z-index-toast` | 80 | `z-toast` | Toast notifications |
| `--z-index-max` | 100 | `z-max` | Emergency override (use sparingly) |

## Usage Patterns

### In TailwindCSS (Preferred)

```tsx
// Good - use token classes
<div className="z-modal">Modal content</div>
<header className="z-sticky">Sticky header</header>

// Bad - hardcoded values (ESLint will error)
<div className="z-50">Modal content</div>
<div className="z-[999]">Bad idea</div>
```

### In Inline Styles

```tsx
import { zIndex, zIndexVar } from "@/design-system/tokens/z-index";

// Good - use constants
<div style={{ zIndex: zIndex.modal }}>Using number</div>
<div style={{ zIndex: zIndexVar.modal }}>Using CSS var</div>

// Bad - hardcoded values (ESLint will error)
<div style={{ zIndex: 50 }}>Bad</div>
```

### In CSS Files

```css
/* Good - use CSS variables */
.modal {
  z-index: var(--z-index-modal);
}

/* Bad - hardcoded values (Stylelint will error) */
.modal {
  z-index: 50;
}
```

## Stacking Context Isolation

A new stacking context is created when an element has:
- `position: relative/absolute/fixed/sticky` with `z-index` other than auto
- `opacity` less than 1
- `transform`, `filter`, `backdrop-filter`, `perspective`
- `isolation: isolate`
- `will-change` with values that create stacking context
- `contain: paint/layout/content/strict`

### Isolation Boundaries

Create isolation boundaries to contain z-index scope:

```tsx
// Isolation boundary - z-index values inside don't leak out
<div className="isolate">
  <div className="z-10">Safe inside boundary</div>
</div>
```

### When to Create Isolation

1. **Component boundaries** - Complex components with internal layering
2. **Card content** - Image overlays, badges on cards
3. **Before transforms** - Elements with hover transforms
4. **Portals entry points** - Where portal content mounts

### Common Patterns

#### Sticky Header

```tsx
<header className="sticky top-0 z-sticky">
  {/* Header content at z-20 */}
</header>
```

#### Modal with Backdrop

```tsx
<div className="fixed inset-0 z-modal-backdrop bg-black/50" />
<div className="fixed z-modal">
  {/* Modal content at z-50, above backdrop at z-40 */}
</div>
```

#### Dropdown in Header

```tsx
<header className="z-sticky">
  <div className="relative">
    <button>Menu</button>
    {/* Dropdown needs to escape header's stacking context */}
    <Portal>
      <div className="z-dropdown">Dropdown content</div>
    </Portal>
  </div>
</header>
```

## Troubleshooting

### Element Behind Another

1. Check if parent has transform/filter/opacity (creates stacking context)
2. Verify element uses correct z-index token
3. Consider if element needs to be in a portal

### Overlay Not Blocking Clicks

1. Verify backdrop has `pointer-events-auto`
2. Check z-index is higher than content being blocked
3. Ensure no `pointer-events-none` on parent

### Click Events Not Reaching Element

1. Check for invisible overlays with high z-index
2. Look for `pointer-events-none` on ancestors
3. Verify closed overlays are removed from DOM (not just hidden)

## Exceptions

The following z-index values are allowed without tokens:

- `z-index: auto` - Reset to default stacking
- `z-index: -1` - Place behind siblings (rare, document usage)
- `z-index: 1` - Slight elevation within isolated component

Document any exceptions with a comment explaining why.

## Related Files

- `src/styles/tokens.css` - CSS custom property definitions
- `src/design-system/tokens/z-index.ts` - TypeScript constants
- `src/app/globals.css` - TailwindCSS @theme integration
- `eslint.config.mjs` - JSX enforcement rules
- `.stylelintrc.json` - CSS enforcement rules
