# Phase 27: Token Enforcement - Colors - Research

**Researched:** 2026-01-27
**Domain:** Design system token enforcement, Tailwind CSS theming, CSS custom properties
**Confidence:** HIGH

## Summary

This phase migrates all hardcoded color values in TSX files to semantic design tokens. The codebase already has a comprehensive token system defined in `tokens.css` with light/dark theme support. The main work involves finding and replacing hardcoded values (`text-white`, `text-black`, `bg-white`, `bg-black`, hex colors in arbitrary values) with semantic token equivalents.

The project uses TailwindCSS 4 with CSS custom properties for theming. ESLint rules already exist for detecting violations but are currently advisory. The migration pattern is mechanical: identify violation, determine semantic intent, apply correct token.

**Primary recommendation:** Batch files by domain (homepage, admin, driver, checkout) and fix violations systematically. Create missing tokens (overlay, skeleton, disabled) before starting component migration.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TailwindCSS | 4.x | Utility-first CSS | Already in use, CSS variable theming is native |
| CSS Custom Properties | Native | Theme tokens | Browser-native, no JS runtime needed |
| class-variance-authority | Latest | Variant management | Already used in button.tsx, card.tsx |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ESLint no-restricted-syntax | Built-in | Enforcement | Block hardcoded colors at build time |
| cn (clsx/tailwind-merge) | Latest | Class composition | Already standard in codebase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS variables | CSS-in-JS tokens | CSS vars are zero-runtime, already in use |
| Manual grep | Custom ESLint rule | ESLint rules already exist, just need enforcement |

**No installation needed:** All tools are already in the project.

## Architecture Patterns

### Token System Structure (Already Exists)
```
src/
├── styles/
│   └── tokens.css          # CSS custom properties (source of truth)
├── app/
│   └── globals.css         # Imports tokens, defines Tailwind theme
└── tailwind.config.ts      # Maps CSS vars to Tailwind utilities
```

### Pattern 1: Semantic Token Mapping
**What:** Map visual intent to semantic tokens
**When to use:** Every color replacement
**Example:**
```typescript
// BEFORE (hardcoded)
className="text-white bg-black"

// AFTER (semantic tokens)
className="text-text-inverse bg-surface-inverse"

// Context-specific example: text on dark hero background
className="text-hero-text bg-hero-gradient-start"
```

### Pattern 2: Theme-Aware Gradients
**What:** Define gradient utilities in Tailwind config or use CSS variables
**When to use:** Any gradient that should adapt to theme
**Example:**
```css
/* In globals.css @layer utilities */
.bg-gradient-hero {
  background: linear-gradient(
    180deg,
    var(--hero-gradient-start) 0%,
    var(--hero-gradient-mid) 50%,
    var(--hero-gradient-end) 100%
  );
}
```

### Pattern 3: Overlay/Backdrop Tokens
**What:** Dedicated tokens for semi-transparent overlays
**When to use:** Modals, drawers, image overlays
**Example:**
```css
/* In tokens.css :root */
--color-overlay: rgba(0, 0, 0, 0.5);
--color-overlay-light: rgba(255, 255, 255, 0.5);

/* In .dark */
--color-overlay: rgba(0, 0, 0, 0.7);
--color-overlay-light: rgba(255, 255, 255, 0.3);
```

### Pattern 4: High-Contrast Mode Compatibility
**What:** Driver mode uses `bg-black text-white` for accessibility
**When to use:** DriverLayout high-contrast toggle
**Decision:** Keep conditional classes for high-contrast mode:
```typescript
// This is intentional for accessibility, not a violation
className={highContrast ? "bg-black text-white" : "bg-background text-foreground"}
```

### Anti-Patterns to Avoid
- **Opacity-based text colors:** Use `text-muted-foreground` not `text-white/70`
- **Hardcoded hex in arbitrary values:** Use `bg-[var(--color-*)]` not `bg-[#fff]`
- **Theme-unaware gradients:** Always use CSS variables in gradient definitions
- **Inline style hex colors:** Move to tokens or Tailwind utilities

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color replacement detection | Manual search | ESLint rules | Already configured, catches at build time |
| Dark mode switching | JS toggle logic | TailwindCSS `dark:` variant | Native, no JS needed for styles |
| Gradient theming | Multiple gradient classes | CSS var-based single class | One class, theme adapts automatically |

**Key insight:** The token system already exists and is comprehensive. This phase is migration, not design.

## Common Pitfalls

### Pitfall 1: Opacity Suffix Confusion
**What goes wrong:** Using `text-white/80` instead of semantic token
**Why it happens:** Tailwind opacity shorthand is familiar
**How to avoid:** Always ask "what does this color mean?" not "what color is it?"
**Warning signs:** Any `/[number]` opacity suffix on white/black

### Pitfall 2: Context-Blind Token Selection
**What goes wrong:** Using `text-foreground` on a dark gradient background
**Why it happens:** Not considering the background context
**How to avoid:** Match token to context: hero uses `text-hero-text`, surfaces use `text-foreground`
**Warning signs:** White text invisible or black text invisible after theme switch

### Pitfall 3: Missing Dark Mode Test
**What goes wrong:** Fix looks good in light mode, breaks in dark mode
**Why it happens:** Only testing one theme
**How to avoid:** Toggle theme after each batch of changes
**Warning signs:** Text disappears, contrast issues, gradients look wrong

### Pitfall 4: High-Contrast Mode False Positives
**What goes wrong:** Flagging DriverLayout's intentional `bg-black text-white`
**Why it happens:** Accessibility mode requires literal black/white
**How to avoid:** Check if code is inside high-contrast conditional
**Warning signs:** Driver mode stops working after "fixing" colors

### Pitfall 5: Library Component Hardcoding
**What goes wrong:** Recharts or other libraries render hardcoded colors
**Why it happens:** Library components don't use Tailwind
**How to avoid:** Use library's theming API or wrapper with CSS overrides
**Warning signs:** Charts look wrong in dark mode

## Code Examples

### Token Mapping Reference

```typescript
// TEXT COLORS
// Before → After
"text-white"      → "text-text-inverse" (general) or "text-hero-text" (on hero)
"text-black"      → "text-text-primary" or "text-foreground"
"text-white/70"   → "text-hero-text-muted" (on hero) or "text-muted-foreground"

// BACKGROUND COLORS
// Before → After
"bg-white"        → "bg-surface-primary" or "bg-background"
"bg-black"        → "bg-surface-inverse" (rare) or context-specific
"bg-white/50"     → "bg-overlay-light" (new token needed)
"bg-black/50"     → "bg-overlay" (new token needed)

// ARBITRARY VALUES
// Before → After
"bg-[#ffffff]"    → "bg-surface-primary"
"text-[#000000]"  → "text-text-primary"
"border-[#e5e7eb]"→ "border-border"
```

### Creating Missing Tokens

```css
/* Add to tokens.css :root */
:root {
  /* Overlay tokens for modals, drawers */
  --color-overlay: rgba(0, 0, 0, 0.5);
  --color-overlay-heavy: rgba(0, 0, 0, 0.8);

  /* Skeleton/loading state */
  --color-skeleton: #e5e7eb;

  /* Disabled states */
  --color-disabled-bg: #f3f4f6;
  --color-disabled-text: #9ca3af;
}

.dark {
  --color-overlay: rgba(0, 0, 0, 0.7);
  --color-overlay-heavy: rgba(0, 0, 0, 0.9);
  --color-skeleton: #374151;
  --color-disabled-bg: #1f2937;
  --color-disabled-text: #6b7280;
}
```

```typescript
// Add to tailwind.config.ts colors section
overlay: {
  DEFAULT: "var(--color-overlay)",
  heavy: "var(--color-overlay-heavy)",
},
skeleton: "var(--color-skeleton)",
disabled: {
  bg: "var(--color-disabled-bg)",
  text: "var(--color-disabled-text)",
},
```

### ESLint Enforcement (Upgrade to Error)

```javascript
// In eslint.config.mjs - change from advisory to blocking
{
  selector: "Literal[value=/\\btext-white\\b/]",
  message: "Use semantic token: text-text-inverse or text-hero-text instead of text-white",
},
// Keep as-is - these are already errors
```

### Gradient Theme-Aware Pattern

```typescript
// BEFORE: Multiple gradient classes conditionally applied
className={cn(
  "bg-gradient-to-r",
  isDark ? "from-gray-900 to-black" : "from-white to-gray-100"
)}

// AFTER: Single class using CSS variables
// In globals.css:
.bg-gradient-surface {
  background: linear-gradient(
    to right,
    var(--color-surface-primary),
    var(--color-surface-secondary)
  );
}
// In component:
className="bg-gradient-surface"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind color palette | CSS custom properties | TailwindCSS 4 | Native theming support |
| `dark:` prefix everywhere | CSS vars that auto-adapt | 2024+ | Simpler markup, fewer classes |
| Multiple theme stylesheets | Single stylesheet with vars | CSS vars maturity | Better performance |

**Current best practice:** Define all colors as CSS custom properties in a single tokens file, with theme-specific values in `:root` and `.dark` selectors. Reference in Tailwind config for utility generation.

## Open Questions

1. **High-contrast mode exemption**
   - What we know: DriverLayout uses `bg-black text-white` conditionally for accessibility
   - What's unclear: Should ESLint rule have exemption for this file?
   - Recommendation: Add inline disable comment with explanation, or exclude via ESLint config

2. **Recharts library colors**
   - What we know: Charts in admin analytics use hardcoded colors
   - What's unclear: Best approach for library component theming
   - Recommendation: Use Recharts' `fill` and `stroke` props with CSS variable values

## Existing Violation Count (Approximate)

| Pattern | Files | Instances |
|---------|-------|-----------|
| `text-white` | ~40 | ~100+ |
| `text-black` | ~5 | ~10 |
| `bg-white` | ~35 | ~70+ |
| `bg-black` | ~15 | ~25 |
| Hex in TSX | ~20 | ~40 |
| Gradients needing work | ~15 | ~30 |

**Total estimated changes:** ~300 replacements across ~60 files

## Sources

### Primary (HIGH confidence)
- `/websites/tailwindcss` Context7 - CSS variables theming documentation
- `src/styles/tokens.css` - Project's existing token definitions
- `tailwind.config.ts` - Project's Tailwind configuration
- `eslint.config.mjs` - Existing ESLint rules for color enforcement

### Secondary (MEDIUM confidence)
- TailwindCSS v4 documentation on theme variables
- Project's existing button.tsx and card.tsx as token usage examples

### Tertiary (LOW confidence)
- None - all findings verified against codebase and official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already in project
- Architecture: HIGH - Patterns verified against existing codebase
- Pitfalls: HIGH - Derived from actual code inspection

**Research date:** 2026-01-27
**Valid until:** Indefinite (patterns are stable, codebase-specific)
