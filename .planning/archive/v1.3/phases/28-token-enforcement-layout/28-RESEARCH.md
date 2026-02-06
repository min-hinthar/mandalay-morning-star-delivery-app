# Phase 28: Token Enforcement - Layout - Research

**Researched:** 2026-01-28
**Domain:** Tailwind CSS layout tokens - spacing, typography, border-radius enforcement
**Confidence:** HIGH

## Summary

This phase enforces consistent layout tokens across the codebase by migrating hardcoded pixel values to Tailwind's design scale. The project already has a comprehensive token system in `tokens.css` with CSS custom properties for spacing, typography, and border-radius. The main work involves identifying and replacing arbitrary values (`text-[10px]`, `top-[72px]`, `borderRadius: "8px"`) with standard Tailwind utilities or CSS variable references.

Current violation audit (via `scripts/audit-tokens.js`):
- **Typography:** 10 files with `text-[Npx]` arbitrary font sizes (mostly `text-[10px]` and `text-[11px]`)
- **Spacing:** 2 files with arbitrary position values (`top-[72px]`)
- **Border-radius:** 13 occurrences in 6 files (inline style `borderRadius: "Npx"` in charts and MorphingMenu)
- **Font-weight:** 1 file with inline `fontWeight: 600`

The Phase 27 pattern (ESLint enforcement + batch migration by component type) applies here. ESLint rules already exist in `eslint.config.mjs` for colors; extend with layout-specific patterns.

**Primary recommendation:** Migrate in priority order: (1) typography scale standardization, (2) spacing/position cleanup, (3) border-radius in inline styles. Add ESLint rules for `text-[Npx]` and spacing arbitrary values.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TailwindCSS | 4.x | Utility-first CSS | Already in use, spacing/typography scale is native |
| CSS Custom Properties | Native | Design tokens | Already defined in tokens.css |
| class-variance-authority | Latest | Variant management | Already used throughout codebase |
| eslint-plugin-better-tailwindcss | 0.x | Arbitrary value enforcement | Can restrict `text-[Npx]`, `p-[Npx]` patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| audit-tokens.js | In-repo | Violation detection | Already scans for spacing violations |
| ESLint no-restricted-syntax | Built-in | AST-based enforcement | Block inline style violations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual grep | ESLint plugin | ESLint provides IDE integration and CI blocking |
| Global text scale override | Per-component migration | Migration preserves intentional variations |

**No installation needed:** All tools already in project. Consider adding `eslint-plugin-better-tailwindcss` for stronger enforcement.

## Architecture Patterns

### Token System Structure (Already Exists)
```
src/
├── styles/
│   └── tokens.css          # CSS custom properties (source of truth)
│       ├── --text-xs through --text-7xl (font sizes)
│       ├── --leading-* (line heights)
│       ├── --tracking-* (letter spacing)
│       ├── --space-* (0 through 32)
│       └── --radius-* (sm through full, semantic aliases)
├── tailwind.config.ts      # Maps CSS vars to Tailwind utilities
│   ├── fontSize (with line-height defaults)
│   ├── spacing (full scale)
│   ├── borderRadius (semantic + numeric)
│   └── letterSpacing, lineHeight
```

### Pattern 1: Typography Scale Mapping
**What:** Map arbitrary font sizes to Tailwind scale
**When to use:** All `text-[Npx]` violations
**Example:**
```typescript
// BEFORE (arbitrary)
className="text-[10px]"

// AFTER (Tailwind scale)
className="text-xs"  // 12px, close enough for most cases

// OR if 10px is truly needed, add to tokens:
// In tokens.css: --text-2xs: 0.625rem;
// In tailwind.config.ts: "2xs": ["var(--text-2xs)", {...}]
className="text-2xs"
```

### Pattern 2: Spacing Scale Mapping
**What:** Replace arbitrary spacing with Tailwind scale
**When to use:** `p-[Npx]`, `m-[Npx]`, `gap-[Npx]`, `top-[Npx]` violations
**Example:**
```typescript
// BEFORE (arbitrary 72px for header offset)
className="top-[72px]"

// AFTER (use CSS variable for semantic meaning)
className="top-[var(--header-height)]"  // Already defined as 56px in tokens

// OR calculate with spacing scale
className="top-14"  // 56px
// If 72px truly needed: top-[calc(var(--header-height)+16px)] or define new token
```

### Pattern 3: Border-Radius in Inline Styles
**What:** Replace hardcoded borderRadius in style objects with tokens
**When to use:** Chart libraries, animation configs
**Example:**
```typescript
// BEFORE (hardcoded in Recharts config)
element: {
  borderRadius: "8px",
}

// AFTER (CSS variable)
element: {
  borderRadius: "var(--radius-md)",  // 8px = md
}

// Mapping reference:
// 2px = --radius-sm (rounded-sm)
// 4px = between sm and md (use sm or md)
// 8px = --radius-md (rounded-md)
// 12px = --radius-lg (rounded-lg)
// 16px = --radius-xl (rounded-xl)
// 24px = --radius-2xl (rounded-2xl)
```

### Pattern 4: Font-Weight Semantic Tokens
**What:** Replace numeric font-weight with Tailwind classes
**When to use:** Any `fontWeight: 600` or similar inline styles
**Example:**
```typescript
// BEFORE (hardcoded numeric)
style={{ fontWeight: 600 }}

// AFTER (semantic token)
// Remove from style, add to className:
className="font-semibold"  // 600

// Mapping:
// 400 = font-normal
// 500 = font-medium
// 600 = font-semibold
// 700 = font-bold
// 800 = font-extrabold
// 900 = font-black
```

### Anti-Patterns to Avoid
- **Pixel values for spacing:** Use Tailwind scale (`p-4` not `p-[16px]`)
- **Arbitrary font sizes without token:** Add to tokens.css if truly needed
- **Hardcoded borderRadius in animations:** Use CSS variables for consistency
- **Inline fontWeight numbers:** Always use Tailwind semantic classes

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Small font detection | Manual grep | ESLint pattern match | Catches at build time |
| Typography scale | New font sizes | Existing Tailwind scale | Scale is designed for readability |
| Position values for header | Magic numbers | CSS variable tokens | Single source of truth |
| Border-radius consistency | Per-component values | Token variables | Theme-aware, maintainable |

**Key insight:** The token system is comprehensive. This phase is enforcement, not design. If a value truly doesn't fit the scale, add a semantic token with a meaningful name.

## Common Pitfalls

### Pitfall 1: Over-Zealous Small Font Replacement
**What goes wrong:** Replacing `text-[10px]` with `text-xs` when 10px was intentional
**Why it happens:** Tailwind's smallest scale is `text-xs` (12px)
**How to avoid:** Evaluate if 10px is truly needed (badges, captions, etc.). If yes, add `text-2xs` token.
**Warning signs:** Text becomes too large after migration, breaking layouts

### Pitfall 2: Header Height Mismatch
**What goes wrong:** Using `top-[72px]` but token is `--header-height: 56px`
**Why it happens:** Header height changed or varies between contexts
**How to avoid:** Verify actual header height, may need `--header-height-with-tabs` or similar
**Warning signs:** Sticky elements overlap or have gaps

### Pitfall 3: Chart Library Styling Breaks
**What goes wrong:** Recharts/Chart.js doesn't respect CSS variables
**Why it happens:** Some libraries parse values at render time
**How to avoid:** Test in browser after migration. May need computed value fallback.
**Warning signs:** Charts render with wrong radii or no radii

### Pitfall 4: Animation Border-Radius Interpolation
**What goes wrong:** MorphingMenu animation breaks when using CSS variables
**Why it happens:** Framer Motion interpolates between string values
**How to avoid:** Keep numeric strings for animation states, use semantic tokens for static styles only
**Warning signs:** Janky animations, console errors about invalid values

### Pitfall 5: Responsive Variants Ignored
**What goes wrong:** Fixing base class but missing `md:text-[10px]` variant
**Why it happens:** Grep patterns don't catch responsive prefixes
**How to avoid:** Search for full pattern including prefixes: `md:text-\[`, `lg:p-\[`
**Warning signs:** Desktop/mobile rendering inconsistencies

## Code Examples

### Typography Token Mapping Reference
```typescript
// Tailwind Scale → CSS Variable → Pixel Value
// text-xs  → --text-xs   → 12px (0.75rem)
// text-sm  → --text-sm   → 14px (0.875rem)
// text-base → --text-base → 16px (1rem)
// text-lg  → --text-lg   → 18px (1.125rem)
// text-xl  → --text-xl   → 20px (1.25rem)
// text-2xl → --text-2xl  → 24px (1.5rem)
// text-3xl → --text-3xl  → 32px (2rem)
// text-4xl → --text-4xl  → 40px (2.5rem)

// For 10px (smaller than xs), add custom token:
// tokens.css:
// --text-2xs: 0.625rem; /* 10px */
// --text-2xs--line-height: 1.4;
// --text-2xs--letter-spacing: 0.01em;

// tailwind.config.ts fontSize section:
// "2xs": ["var(--text-2xs)", { lineHeight: "var(--text-2xs--line-height)" }],

// Usage:
className="text-2xs"
```

### Spacing Token Mapping Reference
```typescript
// Tailwind Scale → CSS Variable → Pixel Value
// p-0    → --space-0    → 0
// p-px   → --space-px   → 1px
// p-0.5  → --space-0-5  → 2px (0.125rem)
// p-1    → --space-1    → 4px (0.25rem)
// p-2    → --space-2    → 8px (0.5rem)
// p-3    → --space-3    → 12px (0.75rem)
// p-4    → --space-4    → 16px (1rem)
// p-5    → --space-5    → 20px (1.25rem)
// p-6    → --space-6    → 24px (1.5rem)
// p-8    → --space-8    → 32px (2rem)
// p-10   → --space-10   → 40px (2.5rem)
// p-12   → --space-12   → 48px (3rem)
// p-16   → --space-16   → 64px (4rem)
// p-20   → --space-20   → 80px (5rem)

// For header offset (72px), use combination or new token:
// Option A: Use existing close value
className="top-[72px]"  // Keep if semantic
// Option B: Define semantic token
// tokens.css: --header-height-full: 72px;
className="top-[var(--header-height-full)]"
```

### Border-Radius in Chart Libraries
```typescript
// BEFORE: Recharts with hardcoded radius
<Bar
  dataKey="value"
  fill="var(--color-primary)"
  radius={[8, 8, 0, 0]}  // Hardcoded
/>

// AFTER: Still hardcoded but documented
// Note: Recharts radius prop requires numbers, not CSS variables
// Map to token conceptually: 8 = --radius-md equivalent
<Bar
  dataKey="value"
  fill="var(--color-primary)"
  radius={[8, 8, 0, 0]}  // Equivalent to rounded-md top corners
/>

// For style objects that accept strings:
element: {
  borderRadius: "var(--radius-md)",  // 8px
}
```

### ESLint Rules for Layout Enforcement
```javascript
// Add to eslint.config.mjs rules section
{
  // Catch arbitrary font sizes in Tailwind classes
  selector: "Literal[value=/text-\\[\\d+px\\]/]",
  message: "Use Tailwind typography scale (text-xs, text-sm, etc.) or add semantic token instead of text-[Npx]",
},
{
  // Catch arbitrary spacing in margin/padding
  selector: "Literal[value=/(p|m|gap|space)-\\[\\d+px\\]/]",
  message: "Use Tailwind spacing scale (p-4, m-6, etc.) or CSS variable instead of arbitrary px values",
},
{
  // Catch inline fontSize pixel values
  selector: "Property[key.name='fontSize'][value.value=/^\\d+px$/]",
  message: "Use Tailwind typography class or CSS variable instead of inline fontSize",
},
{
  // Catch inline borderRadius pixel values
  selector: "Property[key.name='borderRadius'][value.value=/^\\d+px$/]",
  message: "Use CSS variable (var(--radius-*)) instead of hardcoded borderRadius",
},
```

## Current Violation Inventory

### Typography (`text-[Npx]`) - 10 files
| File | Pattern | Count | Suggested Fix |
|------|---------|-------|---------------|
| badge.tsx | `text-[10px]` | 1 | Add `text-2xs` token |
| TimeSlotPicker.tsx | `text-[10px]` | 1 | Use `text-2xs` or `text-xs` |
| CartButton.tsx | `text-[11px]` | 1 | Use `text-xs` (close enough) |
| CartBar.tsx | `text-[10px]` | 1 | Use `text-2xs` |
| DietaryBadges.tsx | `text-[10px]` | 1 | Use `text-2xs` |
| CheckoutStepperV8.tsx | `text-[10px]` | 1 | Use `text-2xs` |
| CheckoutLayout.tsx | `text-[10px]` | 1 | Use `text-2xs` |
| NavDots.tsx | `text-[10px]` | 1 | Use `text-2xs` |
| CartIndicator.tsx | `text-[11px]` | 1 | Use `text-xs` |
| DrawerFooter.tsx | `text-[10px]` | 1 | Use `text-2xs` |

### Spacing (`top-[Npx]`) - 2 files
| File | Pattern | Count | Suggested Fix |
|------|---------|-------|---------------|
| MenuSkeleton.tsx | `top-[72px]` | 1 | Define `--tabs-offset` token |
| CategoryTabs.tsx | `top-[72px]` | 1 | Use same `--tabs-offset` token |

### Border-Radius (inline styles) - 6 files
| File | Pattern | Count | Suggested Fix |
|------|---------|-------|---------------|
| MorphingMenu.tsx | `borderRadius: "2px"/"4px"` | 6 | Keep for animation interpolation |
| RevenueChart.tsx | `borderRadius: "16px"` | 1 | Use `var(--radius-xl)` |
| PerformanceChart.tsx | `borderRadius: "8px"` | 2 | Use `var(--radius-md)` |
| PeakHoursChart.tsx | `borderRadius: "8px"` | 1 | Use `var(--radius-md)` |
| ExceptionBreakdown.tsx | `borderRadius: "8px"` | 1 | Use `var(--radius-md)` |
| DeliverySuccessChart.tsx | `borderRadius: "8px"` | 2 | Use `var(--radius-md)` |

### Font-Weight (inline styles) - 1 file
| File | Pattern | Count | Suggested Fix |
|------|---------|-------|---------------|
| RevenueChart.tsx | `fontWeight: 600` | 1 | Context-dependent (may be Recharts config) |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Arbitrary values everywhere | Constrained design tokens | TailwindCSS 4 theme directive | Consistent, maintainable |
| `text-[10px]` for small text | Custom token `text-2xs` | Best practice 2024+ | Single source, responsive |
| Magic numbers for positions | CSS variables for layout | CSS custom property maturity | Theme-aware, documented |
| Per-file border-radius | Semantic `rounded-*` tokens | Design system adoption | Brand consistency |

**Current best practice:** Define all layout values as CSS custom properties. Use Tailwind scale where possible. Add semantic tokens (with meaningful names) only when Tailwind scale doesn't cover the use case.

## Open Questions

1. **10px Font Size Handling**
   - What we know: 10 files use `text-[10px]`, Tailwind's smallest is `text-xs` (12px)
   - What's unclear: Is 10px truly needed, or can we use 12px?
   - Recommendation: Add `text-2xs` token (10px) for badges/captions where 12px would break layout

2. **Header Offset Value (72px)**
   - What we know: `--header-height` is 56px, but components use 72px
   - What's unclear: Why 72px? Is header actually taller in some contexts?
   - Recommendation: Investigate actual header height, may need `--header-height-with-tabs` token

3. **MorphingMenu Animation Values**
   - What we know: Uses `borderRadius: "2px"` and `"4px"` in Framer Motion variants
   - What's unclear: Will CSS variables work with Framer Motion interpolation?
   - Recommendation: Test first; likely need to keep numeric strings for animation

## Migration Strategy (Per CONTEXT.md Decisions)

1. **Batch by component type** (per user preference)
2. **Fix all spacing within a component** at once (not minimal changes)
3. **Add ESLint rules during phase** (not after)
4. **Trust build passing** for verification (no visual check required)

**Recommended execution order:**
1. **Plan 01:** Add `text-2xs` token + ESLint rules for typography/spacing
2. **Plan 02:** Migrate all `text-[10px]` → `text-2xs` across badge/cart/nav components
3. **Plan 03:** Migrate `top-[72px]` to CSS variable in menu components
4. **Plan 04:** Migrate chart component inline styles to CSS variables

## Sources

### Primary (HIGH confidence)
- `/websites/tailwindcss` Context7 - Typography, spacing, border-radius customization
- `/schoero/eslint-plugin-better-tailwindcss` Context7 - Arbitrary value enforcement
- `src/styles/tokens.css` - Project's existing token definitions (verified comprehensive)
- `tailwind.config.ts` - Full spacing, typography, border-radius configuration
- `scripts/audit-tokens.js` - Existing violation detection (spacing patterns line 94-109)
- `eslint.config.mjs` - Existing ESLint rules pattern for extension

### Secondary (MEDIUM confidence)
- TailwindCSS v4 documentation on `@theme` directive
- Phase 27 RESEARCH.md - Established migration patterns and ESLint approach

### Tertiary (LOW confidence)
- None - all findings verified against codebase and official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already in project
- Architecture: HIGH - Patterns verified against existing codebase and token system
- Pitfalls: HIGH - Derived from actual code inspection and animation library knowledge
- Violation inventory: HIGH - Verified via grep and audit script

**Research date:** 2026-01-28
**Valid until:** Indefinite (patterns are stable, codebase-specific)
