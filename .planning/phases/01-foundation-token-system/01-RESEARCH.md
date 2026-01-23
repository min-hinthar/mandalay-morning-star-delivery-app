# Phase 1: Foundation & Token System - Research

**Researched:** 2026-01-22
**Domain:** Design tokens, z-index layer system, animation infrastructure (GSAP), linting enforcement
**Confidence:** HIGH

## Summary

This phase establishes the foundational infrastructure that prevents z-index chaos and enables consistent animation timing across the application. The codebase already has significant foundation work in place (`tokens.css`, `motion-tokens.ts`, ESLint rules), but gaps exist in GSAP setup, Stylelint enforcement, and TailwindCSS 4 `@theme` integration.

Key findings:
- **Z-index tokens**: Already defined in `tokens.css` with correct semantic hierarchy. TailwindCSS 4 `@theme` integration needed for first-class utilities.
- **ESLint z-index enforcement**: Partial rules exist but only catch `z-[number]` and `z-40/50`. Need comprehensive coverage.
- **Stylelint z-index enforcement**: No rules currently. Plugin `stylelint-declaration-use-variable` available.
- **GSAP setup**: Not yet installed. Requires `gsap` + `@gsap/react` with centralized plugin registration.
- **Motion tokens**: Comprehensive system exists in `motion-tokens.ts` (Framer Motion). Need GSAP-compatible presets.

**Primary recommendation:** Extend existing token infrastructure rather than rebuilding. Add GSAP parallel to Framer Motion. Enforce with both ESLint and Stylelint rules.

## Standard Stack

The established libraries/tools for this phase:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `gsap` | ^3.14 | Timeline choreography, scroll-driven animations | Now 100% free including all plugins. Best-in-class timeline control. |
| `@gsap/react` | ^2.1 | React integration with `useGSAP` hook | Official hook with automatic cleanup, scoped selectors, `contextSafe()` |
| `gsap/ScrollTrigger` | (bundled) | Scroll-linked animations | Essential for menu browsing, hero sections, parallax |
| `gsap/SplitText` | (bundled) | Text animation (char/word/line splitting) | Hero headlines, category titles. Now free. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `gsap/Flip` | (bundled) | Layout transition animations | Cart item reordering, category filtering |
| `gsap/Observer` | (bundled) | Touch/scroll gesture detection | Swipe interactions on cart items |
| `stylelint-declaration-use-variable` | ^3.1.0 | Enforce CSS custom properties | z-index, color enforcement in CSS |

### Already Installed (Keep)

| Library | Version | Purpose |
|---------|---------|---------|
| `framer-motion` | ^12.26.1 | Component-level interactions (hover, tap, presence) |
| `tailwindcss` | ^4 | Utility-first CSS with `@theme` support |
| `stylelint` | ^17.0.0 | CSS linting |
| `eslint` | ^9 | JavaScript/TypeScript linting |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GSAP + Motion | GSAP only | Motion has superior React integration for component-level work |
| GSAP + Motion | Motion only | Motion lacks timeline control and SplitText capabilities |
| `stylelint-declaration-use-variable` | Custom rule | Existing plugin handles regex patterns for properties |

**Installation:**
```bash
# GSAP ecosystem (now 100% free)
pnpm add gsap @gsap/react

# Stylelint plugin for z-index enforcement
pnpm add -D stylelint-declaration-use-variable
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── gsap/
│   │   ├── index.ts           # Plugin registration + exports
│   │   └── presets.ts         # GSAP timeline presets, easing tokens
│   ├── motion-tokens.ts       # EXISTING: Framer Motion tokens
│   └── animations/
│       └── gsap-variants.ts   # Reusable GSAP animation patterns
├── styles/
│   ├── tokens.css             # EXISTING: CSS custom properties
│   └── theme.css              # NEW: TailwindCSS @theme z-index utilities
└── design-system/
    └── tokens/
        └── z-index.ts         # TypeScript z-index constants (mirrors CSS)
```

### Pattern 1: Centralized GSAP Plugin Registration

**What:** Single file registers all GSAP plugins once at app load
**When to use:** Always. Prevents duplicate registration and ensures tree-shaking works.

```typescript
// src/lib/gsap/index.ts
"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";

// Register all plugins ONCE
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, Observer);

// Default configuration for performance
gsap.config({
  autoSleep: 60,
  force3D: true,
  nullTargetWarn: false, // Suppress warnings for SSR
});

// Default animation settings
gsap.defaults({
  duration: 0.6,
  ease: "power2.out",
});

export { gsap, useGSAP, ScrollTrigger, SplitText, Flip, Observer };
```

**Source:** [GSAP React Documentation](https://gsap.com/resources/React/)

### Pattern 2: useGSAP Hook with Scoped Selectors

**What:** All GSAP animations in components use scoped container refs
**When to use:** Every component with GSAP animations

```typescript
// Source: https://gsap.com/resources/React/
"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

export function HeroSection() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // All selectors scoped to container
      gsap.from(".hero-title", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: container.current,
          start: "top 80%",
        },
      });
    },
    { scope: container } // CRITICAL: scope all selectors
  );

  return <div ref={container}>...</div>;
}
```

### Pattern 3: contextSafe for Event Handlers

**What:** Wrap event handler animations with `contextSafe()` for proper cleanup
**When to use:** Any animation triggered by user interaction (click, hover, etc.)

```typescript
// Source: https://gsap.com/resources/React/
"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export function InteractiveCard() {
  const container = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: container });

  // Wrap event handlers with contextSafe
  const handleClick = contextSafe(() => {
    gsap.to(".card-content", { scale: 1.05, duration: 0.2 });
  });

  return (
    <div ref={container}>
      <button onClick={handleClick}>Animate</button>
    </div>
  );
}
```

### Pattern 4: TailwindCSS 4 @theme Z-Index Utilities

**What:** Define z-index as theme variables that generate first-class utilities
**When to use:** Replace `z-[var(--z-modal)]` with `z-modal`

```css
/* src/styles/theme.css */
@import "tailwindcss";

@theme {
  /* Z-Index Layer System - generates z-dropdown, z-modal, etc. */
  --z-index-base: 0;
  --z-index-dropdown: 10;
  --z-index-sticky: 20;
  --z-index-fixed: 30;
  --z-index-modal-backdrop: 40;
  --z-index-modal: 50;
  --z-index-popover: 60;
  --z-index-tooltip: 70;
  --z-index-toast: 80;
  --z-index-max: 100;
}
```

This generates utilities: `z-dropdown`, `z-sticky`, `z-modal`, etc.

**Source:** [TailwindCSS 4 Z-Index Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/18031)

### Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Instead |
|--------------|---------|---------|
| GSAP inside `useEffect` | No automatic cleanup, memory leaks | Use `useGSAP` hook |
| Inline GSAP registration in components | Plugin loaded multiple times | Centralize in `lib/gsap/index.ts` |
| ScrollTrigger without scope | Selectors leak between components | Pass `scope: containerRef` |
| Hardcoded z-index numbers (`z-50`, `z-[999]`) | Unmaintainable, conflicts | Use token utilities (`z-modal`) |
| Mixing Motion layout + GSAP on same element | Conflicting DOM manipulation | Pick one library per element |

## Don't Hand-Roll

Problems with existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text split animation | Manual DOM splitting | GSAP SplitText | Handles line breaks, resizing, accessibility |
| Scroll-linked animations | IntersectionObserver DIY | GSAP ScrollTrigger | Scrubbing, pinning, snap, markers |
| Layout transitions | Manual FLIP calculation | GSAP Flip plugin | Handles nested elements, stacking contexts |
| Z-index enforcement | Manual code review | ESLint + Stylelint rules | Catches violations at build time |
| Animation cleanup | Manual cleanup in useEffect | `useGSAP` hook | Automatic context-based cleanup |

**Key insight:** GSAP's plugin ecosystem solves edge cases (resize handling, SSR, accessibility) that take weeks to implement correctly.

## Common Pitfalls

### Pitfall 1: GSAP Plugins Not Registered

**What goes wrong:** `ScrollTrigger is not defined` errors in production
**Why it happens:** Tree-shaking removes unused imports; plugins must be explicitly registered
**How to avoid:**
```typescript
// ALWAYS register plugins, even if they seem to work without it
gsap.registerPlugin(ScrollTrigger, SplitText, Flip, Observer);
```
**Warning signs:** Works in dev, fails in production build

### Pitfall 2: useGSAP Missing Scope

**What goes wrong:** Animations affect elements outside component; cleanup fails
**Why it happens:** Selectors like `.box` match globally without scope
**How to avoid:**
```typescript
// ALWAYS pass scope
useGSAP(() => { ... }, { scope: containerRef });
```
**Warning signs:** Animations persist after component unmount; unrelated elements animate

### Pitfall 3: Stylelint z-index Rule Not Catching Tailwind Classes

**What goes wrong:** `z-50` passes linting but violates token system
**Why it happens:** Stylelint checks CSS files, not Tailwind class strings in JSX
**How to avoid:** Use ESLint for JSX class strings, Stylelint for CSS files
**Warning signs:** Hardcoded z-index in className passes lint

### Pitfall 4: TailwindCSS 4 @theme Quoted Values

**What goes wrong:** `@theme { --z-index-modal: '50'; }` doesn't generate utilities
**Why it happens:** Quoted values treated as strings, not numbers
**How to avoid:** Use unquoted numeric values: `--z-index-modal: 50;`
**Warning signs:** `z-modal` class doesn't exist; arbitrary syntax required

### Pitfall 5: Motion Token Drift

**What goes wrong:** GSAP animations feel different from Framer Motion animations
**Why it happens:** Different easing curves, duration values
**How to avoid:** Create GSAP presets that map to existing motion tokens:
```typescript
// Map to existing spring.snappy
export const gsapEases = {
  snappy: "power2.out", // Matches spring.snappy feel
  bouncy: "back.out(1.7)", // Matches spring.ultraBouncy
};
```
**Warning signs:** Inconsistent animation feel across different components

## Code Examples

### GSAP ScrollTrigger with Text Split

```typescript
// Source: GSAP Documentation + @gsap/react
"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger, SplitText } from "@/lib/gsap";

export function HeroHeadline({ text }: { text: string }) {
  const container = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      // SplitText for character animation
      const split = new SplitText(container.current, {
        type: "chars,words",
        charsClass: "char",
      });

      gsap.from(split.chars, {
        y: 40,
        opacity: 0,
        stagger: 0.02,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: container.current,
          start: "top 80%",
        },
      });

      // Cleanup SplitText on unmount
      return () => split.revert();
    },
    { scope: container }
  );

  return (
    <h1 ref={container} className="text-4xl font-bold">
      {text}
    </h1>
  );
}
```

### Z-Index TypeScript Constants

```typescript
// src/design-system/tokens/z-index.ts
// Mirror of CSS tokens for TypeScript usage

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  max: 100,
} as const;

export type ZIndexToken = keyof typeof zIndex;

// CSS variable reference for inline styles
export const zIndexVar = {
  base: "var(--z-base)",
  dropdown: "var(--z-dropdown)",
  sticky: "var(--z-sticky)",
  fixed: "var(--z-fixed)",
  modalBackdrop: "var(--z-modal-backdrop)",
  modal: "var(--z-modal)",
  popover: "var(--z-popover)",
  tooltip: "var(--z-tooltip)",
  toast: "var(--z-toast)",
  max: "var(--z-max)",
} as const;
```

### ESLint Z-Index Rule Enhancement

```javascript
// eslint.config.mjs - Enhanced z-index enforcement
{
  files: ["src/components/**/*.tsx", "src/app/**/*.tsx"],
  rules: {
    "no-restricted-syntax": [
      "error", // Upgrade to error
      {
        // Catch z-[number] arbitrary values
        selector: "Literal[value=/z-\\[\\d+\\]/]",
        message: "Use design token z-index (e.g., z-modal, z-dropdown) instead of z-[number].",
      },
      {
        // Catch standard Tailwind z-* numeric classes
        selector: "Literal[value=/\\bz-(?:0|10|20|30|40|50|60|70|80|90|100)\\b/]",
        message: "Use design token z-index (e.g., z-modal, z-dropdown) instead of z-* classes.",
      },
      {
        // Catch inline zIndex in style objects
        selector: "Property[key.name='zIndex'][value.type='Literal'][value.raw=/^\\d+$/]",
        message: "Use zIndex token (e.g., zIndex.modal) instead of hardcoded number.",
      },
    ],
  },
}
```

### Stylelint Z-Index Enforcement

```json
// .stylelintrc.json - Add z-index enforcement
{
  "extends": ["stylelint-config-standard"],
  "plugins": ["stylelint-declaration-use-variable"],
  "rules": {
    "sh-waqar/declaration-use-variable": [
      ["z-index", "/color/"],
      { "ignoreValues": ["auto", "inherit", "initial", "unset"] }
    ],
    "at-rule-no-unknown": [true, {
      "ignoreAtRules": ["tailwind", "apply", "layer", "config", "theme", "custom-variant", "utility"]
    }]
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GSAP Club membership | GSAP 100% free | 2024 (Webflow acquisition) | All plugins now accessible |
| `tailwind.config.js` | TailwindCSS 4 `@theme` | 2024 | CSS-first configuration |
| `framer-motion` package | `motion` package | 2024 | Same API, rebranded |
| Manual useEffect cleanup | `useGSAP` hook | 2023 | Automatic gsap.context cleanup |
| `z-[var(--z-modal)]` | `z-modal` via @theme | TailwindCSS 4 | First-class utility generation |

**Deprecated/outdated:**
- `gsap/all` import pattern - Use individual plugin imports
- GSAP `timeline.add()` without labels - Use labels for maintainability
- Tailwind v3 `tailwind.config.js` for tokens - Use `@theme` directive

## Open Questions

1. **SplitText Accessibility**
   - What we know: SplitText v3.13+ has accessibility features
   - What's unclear: Exact implementation for screen reader compatibility
   - Recommendation: Test with VoiceOver/NVDA, add `aria-label` to split containers

2. **GSAP + React 19 Concurrent Mode**
   - What we know: useGSAP uses useIsomorphicLayoutEffect
   - What's unclear: Behavior with React 19's concurrent features
   - Recommendation: Monitor for issues; useGSAP should handle correctly

3. **ESLint Flat Config Plugin Compatibility**
   - What we know: Project uses ESLint 9 flat config
   - What's unclear: All plugins' flat config support status
   - Recommendation: Test each plugin; use compat layer if needed

## Sources

### Primary (HIGH confidence)
- [GSAP React Documentation](https://gsap.com/resources/React/) - useGSAP hook, contextSafe, cleanup patterns
- [@gsap/react npm](https://www.npmjs.com/package/@gsap/react) - Version 2.1.2, API reference
- [TailwindCSS 4 Theme Variables](https://tailwindcss.com/docs/theme) - @theme directive documentation
- [TailwindCSS 4 Z-Index Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/18031) - Working @theme z-index configuration

### Secondary (MEDIUM confidence)
- [ESLint Custom Rules Documentation](https://eslint.org/docs/latest/extend/custom-rules) - no-restricted-syntax patterns
- [stylelint-declaration-use-variable](https://www.npmjs.com/package/stylelint-declaration-use-variable) - z-index enforcement plugin

### Codebase Verified (HIGH confidence)
- `src/styles/tokens.css` - Existing z-index tokens (lines 254-263)
- `src/lib/motion-tokens.ts` - Existing Framer Motion token system
- `eslint.config.mjs` - Existing partial z-index rules (lines 44-64)
- `.stylelintrc.json` - Current Stylelint config (no z-index rules)
- `package.json` - Current dependencies (no GSAP yet)

## Metadata

**Confidence breakdown:**
- Z-index token system: HIGH - Verified in codebase, standard pattern
- GSAP setup patterns: HIGH - Official documentation verified
- TailwindCSS 4 @theme: HIGH - Official docs + working examples
- ESLint z-index rules: MEDIUM - Regex-based detection has edge cases
- Stylelint z-index rules: MEDIUM - Plugin exists but untested in this codebase
- GSAP + React 19: MEDIUM - Hook is official but React 19 is new

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable ecosystem)
