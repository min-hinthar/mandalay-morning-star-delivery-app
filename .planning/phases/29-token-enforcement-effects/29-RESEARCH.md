# Phase 29: Token Enforcement - Effects - Research

**Researched:** 2026-01-27
**Domain:** CSS effects tokens - shadows, blur, motion/timing standardization
**Confidence:** HIGH

## Summary

Phase 29 standardizes all visual effects (shadows, blur, animations) to use semantic design tokens. The project already has comprehensive token infrastructure:
- Shadow tokens in `tokens.css` (--shadow-sm through --shadow-2xl, semantic aliases)
- Motion tokens in `motion-tokens.ts` (Framer Motion compatible) and CSS variables
- Blur usage via Tailwind's `backdrop-blur-*` utilities (consistent but not tokenized)

Current state analysis found:
- **Shadows:** ~35 hardcoded `boxShadow` values in inline styles + Framer Motion variants
- **Blur:** 4 hardcoded `blur(Npx)` in globals.css; most usage via Tailwind utilities
- **Motion:** ~100 inline `ease:` and `duration:` values in Framer Motion transitions

The audit script already detects `shadow-[...]`, `blur-[Npx]`, and `duration-[Nms]` patterns. This phase extends detection to inline style boxShadow/backdropFilter and Framer Motion transition props.

**Primary recommendation:** Migrate shadows first (highest visual impact), then blur tokens, then motion timing. Create CSS blur variables to complement existing Tailwind utilities.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TailwindCSS | 4.x | Shadow/blur utilities | Already maps to CSS variables |
| Framer Motion | 11.x | Animation timing | Existing motion-tokens.ts |
| CSS Custom Properties | Native | Token definitions | Source of truth in tokens.css |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @/lib/motion-tokens | Internal | Framer Motion presets | All animation transitions |
| @/lib/micro-interactions | Internal | Button/card variants | Component hover/tap states |
| @/lib/design-system/tokens/motion | Internal | Overlay transitions | Modal/drawer/toast animations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS variables for blur | Tailwind arbitrary values | Tailwind utilities already work; tokens add semantic meaning |
| Multiple motion files | Single consolidated file | Existing structure works; dual export pattern covers CSS + FM |

**No installation needed:** All infrastructure exists.

## Architecture Patterns

### Existing Token Structure
```
src/
├── styles/
│   └── tokens.css                 # CSS variables (shadows, durations, easing)
│       ├── --shadow-sm/md/lg/xl/2xl
│       ├── --shadow-card/card-hover/elevated/nav
│       ├── --shadow-glow-primary/success/warning
│       ├── --shadow-inner/inner-glow
│       ├── --duration-instant/fast/normal/slow/slower
│       └── --ease-default/spring/out/in/in-out
├── lib/
│   ├── motion-tokens.ts           # Framer Motion presets (springs, variants)
│   ├── micro-interactions.ts      # Button/card hover variants
│   └── design-system/tokens/
│       └── motion.ts              # Overlay-specific transitions
└── tailwind.config.ts             # Maps CSS vars to utilities
    ├── boxShadow (shadow-sm/md/lg/xl/card/etc.)
    ├── transitionDuration (duration-fast/normal/slow)
    └── transitionTimingFunction (ease-default/spring/out)
```

### Pattern 1: Shadow Token Migration
**What:** Replace hardcoded boxShadow strings with CSS variables
**When to use:** Inline styles, Framer Motion animate states
**Example:**
```typescript
// BEFORE: Hardcoded shadow
style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}

// AFTER: CSS variable
style={{ boxShadow: "var(--shadow-lg)" }}

// For Framer Motion animation states (interpolation needed):
// Keep numeric values but document token equivalence
animate={{ boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }} // --shadow-lg equivalent
```

### Pattern 2: Blur Token System
**What:** Create CSS variables for blur values, use Tailwind utilities
**When to use:** backdrop-filter in inline styles, globals.css hardcoded values
**Example:**
```css
/* Add to tokens.css */
--blur-sm: 4px;
--blur-md: 8px;
--blur-lg: 12px;
--blur-xl: 20px;
--blur-2xl: 30px;

/* For backdrop filters in inline styles */
backdropFilter: "blur(var(--blur-md))"
```

### Pattern 3: Motion Timing Standardization
**What:** Use motion-tokens.ts presets instead of inline durations
**When to use:** Framer Motion transition props
**Example:**
```typescript
// BEFORE: Inline duration
transition={{ duration: 0.3, ease: "easeOut" }}

// AFTER: Import from motion-tokens
import { transition } from "@/lib/motion-tokens";
transition={transition.normal}  // { duration: 0.18, ease: easing.default }

// OR use duration constant
import { duration } from "@/lib/motion-tokens";
transition={{ duration: duration.slow, ease: easing.out }}
```

### Pattern 4: Semantic Shadow Aliases
**What:** Add context-specific shadow tokens
**When to use:** Component-specific shadows (buttons, inputs, cards)
**Example:**
```css
/* Existing in tokens.css */
--shadow-card: 0 8px 24px rgba(164, 16, 52, 0.08);
--shadow-card-hover: 0 12px 32px rgba(164, 16, 52, 0.12);
--shadow-button-hover: 0 4px 16px rgba(164, 16, 52, 0.20);

/* Add for Phase 29 (per CONTEXT.md decisions) */
--shadow-xs: 0 1px 2px rgba(164, 16, 52, 0.03);
--shadow-none: none;
--shadow-inner-sm: inset 0 1px 2px rgba(26, 25, 24, 0.03);
--shadow-primary: 0 4px 16px rgba(164, 16, 52, 0.25);
--shadow-success: 0 4px 16px rgba(82, 165, 46, 0.25);
--shadow-warning: 0 4px 16px rgba(232, 125, 30, 0.25);
--shadow-error: 0 4px 16px rgba(196, 92, 74, 0.25);
```

### Anti-Patterns to Avoid
- **Hardcoded rgba shadows:** Use `var(--shadow-*)` for theme awareness
- **Inline blur values:** Use Tailwind `backdrop-blur-*` or CSS variables
- **Magic duration numbers:** Import from motion-tokens.ts
- **Duplicating Framer Motion configs:** Reuse existing presets

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shadow system | Custom shadow values | tokens.css `--shadow-*` | Theme-aware, dark mode support |
| Blur values | Arbitrary `blur(Npx)` | Tailwind utilities or `--blur-*` | Consistency across overlays |
| Animation timing | Inline `duration: 0.3` | motion-tokens.ts exports | Single source, easier updates |
| Spring physics | Per-component springs | motion-tokens.ts `spring.*` | Tested, consistent feel |
| Input focus rings | Custom boxShadow | inputFocus from motion-tokens | Standard glow patterns |

**Key insight:** This project has TWO motion systems that need coordination:
1. **CSS transitions** (Tailwind `duration-*`, `ease-*`) - for simple hover/transitions
2. **Framer Motion** (motion-tokens.ts) - for complex animations

Both should derive from the same token values.

## Common Pitfalls

### Pitfall 1: Framer Motion Shadow Animation
**What goes wrong:** CSS variables don't interpolate smoothly in Framer Motion
**Why it happens:** FM interpolates between string values; `var(--shadow-lg)` can't interpolate
**How to avoid:** For animated shadows, keep numeric values but add comment documenting token equivalent
**Warning signs:** Shadows snap instead of smooth transition

### Pitfall 2: Dark Mode Shadow Tokens
**What goes wrong:** Using light-mode shadow values in dark mode
**Why it happens:** tokens.css already has dark mode variants; inline shadows don't
**How to avoid:** Always use CSS variables which auto-switch in dark mode
**Warning signs:** Shadows invisible or too harsh in dark theme

### Pitfall 3: Blur Performance
**What goes wrong:** Heavy blur values cause jank on mobile
**Why it happens:** backdrop-filter is GPU-intensive
**How to avoid:** Use `blur-sm` (4px) for most cases; `blur-md` (8px) max for overlays
**Warning signs:** Laggy scroll, frame drops on iOS

### Pitfall 4: Motion Token Import Paths
**What goes wrong:** Importing from wrong location
**Why it happens:** Multiple motion files exist
**How to avoid:**
  - `@/lib/motion-tokens` for general animations (springs, variants, hover)
  - `@/lib/micro-interactions` for button/card variants
  - `@/lib/design-system/tokens/motion` for overlay-specific
**Warning signs:** TypeScript errors, missing exports

### Pitfall 5: Reduced Motion Regression
**What goes wrong:** New animations don't respect `data-reduce-motion`
**Why it happens:** animations.css handles CSS animations; Framer Motion needs separate handling
**How to avoid:** Use `useReducedMotion()` hook from `@/lib/hooks/useReducedMotion`
**Warning signs:** Users with motion sensitivity see full animations

## Code Examples

### Shadow Token Usage
```typescript
// Component inline style
<div style={{ boxShadow: "var(--shadow-card)" }} />

// Tailwind class
<div className="shadow-card hover:shadow-card-hover" />

// Framer Motion (non-animated)
<motion.div
  style={{ boxShadow: "var(--shadow-md)" }}
  whileHover={{ scale: 1.02 }}
/>

// Framer Motion (animated shadow - keep values, document token)
<motion.div
  initial={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}  // --shadow-sm equiv
  whileHover={{ boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}  // --shadow-lg equiv
/>
```

### Blur Token Usage
```typescript
// Tailwind (preferred)
<div className="backdrop-blur-sm" />  // 4px
<div className="backdrop-blur-md" />  // 8px
<div className="backdrop-blur-lg" />  // 12px

// CSS variable (for inline styles)
<div style={{ backdropFilter: "blur(var(--blur-md))" }} />

// Framer Motion animated blur
<motion.div
  animate={{
    backdropFilter: "blur(20px)",  // Keep for interpolation
  }}
/>
```

### Motion Token Usage
```typescript
import {
  duration,
  spring,
  transition,
  hover
} from "@/lib/motion-tokens";

// Using preset transition
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={transition.normal}
/>

// Using spring preset
<motion.div
  whileHover={hover.lift}
  transition={spring.snappy}
/>

// Using duration constant
<motion.div
  transition={{
    duration: duration.fast,
    ease: easing.out
  }}
/>
```

### ESLint Rules to Add
```javascript
// Add to eslint.config.mjs
{
  // Catch inline boxShadow with hardcoded values
  selector: "Property[key.name='boxShadow'][value.type='Literal'][value.value=/^0\\s/]",
  message: "Use CSS variable (var(--shadow-*)) instead of hardcoded boxShadow. Exception: Framer Motion animated shadows.",
},
{
  // Catch inline backdropFilter with hardcoded blur
  selector: "Property[key.name='backdropFilter'][value.value=/blur\\(\\d+px\\)/]",
  message: "Use CSS variable (var(--blur-*)) or Tailwind backdrop-blur-* instead of hardcoded blur.",
},
{
  // Catch hardcoded durations in Framer Motion (info level)
  // Note: This is informational since FM interpolation sometimes requires numbers
  selector: "Property[key.name='duration'][value.type='Literal'][value.raw=/^0\\.\\d+$/]",
  message: "Consider using duration token from @/lib/motion-tokens for consistency.",
},
```

## Current Violation Inventory

### Shadows - Inline boxShadow (~35 occurrences)
| File | Count | Pattern | Priority |
|------|-------|---------|----------|
| motion-tokens.ts | 6 | inputFocus, buttonPress | HIGH - token source |
| micro-interactions.ts | 5 | primaryButton, card variants | HIGH - token source |
| checkout/page.tsx | 2 | Animation states | MEDIUM |
| CTABanner.tsx | 2 | Animation states | MEDIUM |
| CheckoutStepperV8.tsx | 1 | Animation state | MEDIUM |
| CartSummary.tsx | 1 | Tailwind arbitrary `shadow-[...]` | HIGH |
| CartBar.tsx | 1 | Tailwind arbitrary `shadow-[...]` | HIGH |
| theme-toggle.tsx | 1 | Dark mode glow | MEDIUM |
| useLuminance.ts | 4 | Drop shadow utility | LOW - dynamic |
| NavDots.tsx | 1 | Animation state | LOW |

### Shadows - Tailwind Arbitrary Values
| File | Pattern | Fix |
|------|---------|-----|
| CartSummary.tsx | `shadow-[0_2px_8px_rgba(245,158,11,0.4)]` | Add `--shadow-glow-secondary` token |
| CartBar.tsx | `shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]` | Add `--shadow-nav-top` token |
| theme-toggle.tsx | `shadow-[0_0_12px_rgba(229,62,62,0.3)]` | Use `--shadow-glow-primary` |
| DrawerNavLink.tsx | `shadow-[0_0_12px_rgba(164,16,52,0.25)]` | Use `--shadow-glow-primary` |
| SearchTrigger.tsx | `shadow-[0_2px_8px_...]` | Add focused search token |
| AccountIndicator.tsx | `shadow-[0_4px_20px_...]` | Use existing or add semantic token |

### Blur - Hardcoded Values
| File | Pattern | Fix |
|------|---------|-----|
| globals.css | `blur(12px)` x4 | Use `var(--blur-lg)` |
| globals.css | `blur(30px)` x2 | Use `var(--blur-2xl)` |
| globals.css | `blur(36px)` x2 | Add `--blur-3xl: 36px` |
| CommandPalette.tsx | `blur(20px)` inline | Use `var(--blur-xl)` |
| Header.tsx | `blur(${blurAmount}px)` | Keep dynamic; document tokens |
| motion-tokens.ts | `blur(0px)`/`blur(20px)` | Keep for animation interpolation |

### Motion - Inline Durations (~100 occurrences)
Most in Framer Motion transitions. Sample of high-priority files:
| File | Count | Pattern |
|------|-------|---------|
| BrandMascot.tsx | 12 | Various durations 0.3-3s |
| WelcomeAnimation.tsx | 5 | duration: 60, 80 (intentionally slow) |
| skeleton.tsx | 4 | shimmer timing |
| CheckoutStepperV8.tsx | 3 | Step animations |
| Modal.tsx | 2 | Open/close timing |

**Note:** Many inline durations are intentional for specific animations. Focus on standardizing common patterns (0.2, 0.3, 0.5s) rather than forcing all to use tokens.

## Migration Strategy (Per CONTEXT.md)

### Phase Order
1. **Shadows first** - Highest visual impact, most violations
2. **Blur tokens** - Small scope, quick wins
3. **Motion timing** - Largest scope, lowest priority

### Sub-task Breakdown

**29-01: Shadow Token Infrastructure**
- Add missing shadow tokens to tokens.css (xs, none, semantic colors)
- Add dark mode glow variants
- Add ESLint rules for shadow enforcement
- Update audit-tokens.js shadow pattern detection

**29-02: Shadow Migration**
- Migrate hardcoded shadows in micro-interactions.ts
- Migrate hardcoded shadows in motion-tokens.ts
- Migrate Tailwind arbitrary shadow values
- Migrate inline boxShadow styles

**29-03: Blur Token Infrastructure**
- Add --blur-* tokens to tokens.css
- Update Tailwind config if needed
- Add ESLint rules for blur enforcement

**29-04: Blur Migration**
- Migrate globals.css hardcoded blur values
- Migrate inline backdropFilter styles
- Document Framer Motion blur exceptions

**29-05: Motion Token Audit**
- Identify candidates for duration token migration
- Document intentional exceptions (decorative animations)
- Update ESLint rules to info level for duration

**29-06: Motion Migration (Optional)**
- Migrate high-impact common durations
- Leave decorative/intentional durations as-is
- Verify reduced-motion support

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-component shadows | Token system `--shadow-*` | CSS custom properties maturity | Theme-aware, maintainable |
| Hardcoded blur values | Tailwind `backdrop-blur-*` | Tailwind 3+ | Consistent, responsive |
| Inline Framer durations | Centralized motion-tokens | Project v7 refactor | Reusable, testable |
| No dark mode shadows | CSS variable switching | tokens.css dark mode | Automatic theme support |

**Current best practice:** All visual effects derive from CSS custom properties. Tailwind utilities map to these tokens. Framer Motion uses TypeScript exports that mirror the CSS values.

## Open Questions

1. **Framer Motion Shadow Interpolation**
   - What we know: CSS variables don't interpolate smoothly
   - What's unclear: Best pattern for animated shadows
   - Recommendation: Keep numeric for animated states; use vars for static

2. **Inner Shadow Tokens**
   - What we know: CONTEXT.md requests inner shadows for pressed states
   - What's unclear: Exact values for `shadow-inner-sm`, etc.
   - Recommendation: Define 2-3 inner shadow intensities

3. **Text Shadow Tokens**
   - What we know: CONTEXT.md mentions text-shadow-sm/md
   - What's unclear: Use cases in current codebase
   - Recommendation: Add tokens but low priority migration

4. **Ring vs Shadow Tokens**
   - What we know: Tailwind has separate ring utilities
   - What's unclear: Should ring-* map to shadow tokens?
   - Recommendation: Keep ring utilities separate (focus states)

## Sources

### Primary (HIGH confidence)
- `src/styles/tokens.css` - Verified shadow/motion token definitions
- `src/lib/motion-tokens.ts` - Verified Framer Motion exports (905 lines)
- `src/lib/micro-interactions.ts` - Verified interaction variants
- `tailwind.config.ts` - Verified shadow/duration mappings
- `eslint.config.mjs` - Existing ESLint pattern reference
- `scripts/audit-tokens.js` - Existing violation detection

### Secondary (MEDIUM confidence)
- [TailwindCSS Box Shadow Docs](https://tailwindcss.com/docs/box-shadow) - Token patterns
- [TailwindCSS Theme Variables](https://tailwindcss.com/docs/theme) - CSS variable integration
- [Framer Motion Transitions](https://www.framer.com/motion/transition/) - Duration/easing patterns

### Tertiary (LOW confidence)
- WebSearch results on Tailwind 4 design tokens - General patterns
- WebSearch results on Framer Motion standardization - Community approaches

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already in project, verified
- Architecture: HIGH - Patterns verified against existing codebase
- Pitfalls: HIGH - Derived from code inspection + dark mode testing
- Violation inventory: HIGH - Verified via grep across codebase

**Research date:** 2026-01-27
**Valid until:** Indefinite (patterns stable, codebase-specific)
