# Tailwind v4 Learnings

## `tailwind.config.ts` Is Dead Code (SYSTEMIC)

**Context:** After replacing hardcoded colors with Pepper design tokens, Playwright revealed ALL custom tokens resolved to transparent/default.

**Root Cause:** In Tailwind v4 + Turbopack, `tailwind.config.ts` is completely ignored. The `@config` directive is also silently ignored by Turbopack's CSS pipeline. The **only** source of truth for utility class generation is `@theme inline {}` in `globals.css`.

**Self-referencing pattern:**
```css
@theme inline {
  --color-status-success: var(--color-status-success);
  --color-status-success-bg: var(--color-status-success-bg);
}
```

**Verification:** Playwright `browser_evaluate` — create temp element with class, read `getComputedStyle()`. If `transparent` or `0px`, token not registered.

**Supersedes:** Individual entries about `bg-overlay-heavy`, `@config` directive.

**Apply when:** ANY custom Tailwind utility class isn't working. Check `@theme inline` first. New tokens in `tokens.css` MUST also be added to `@theme inline`.

---

## `@source not` for Non-Source Directories

Tailwind v4 auto-scans ALL files for utility class patterns — including `docs/`, `.planning/`, `.claude/`, `eslint.config.mjs`, `scripts/`.

**Problem:** Wildcard examples like `var(--shadow-*)` in docs generate invalid CSS (`Unexpected token Delim('*')`).

**Fix:**
```css
@import "tailwindcss";
@source not "../../docs";
@source not "../../scripts";
@source not "../../.planning";
```

**Also:** Use real class names in ESLint messages and documentation — wildcards get compiled.

**Apply when:** CSS parsing errors from files outside `src/`, or documentation containing CSS variable patterns.

---

## Z-Index Utilities

Custom `zIndex` theme extensions do NOT generate utility classes in v4.

```ts
// Does NOT create z-modal class
theme: { extend: { zIndex: { modal: '50' } } }

// Use default scale or arbitrary values
z-50       // Default scale
z-[60]     // Arbitrary value
```

**@theme variable naming:** CSS variables use full prefix (`--z-index-modal`), utilities strip it (`z-modal`). TypeScript helpers must reference full CSS variable name.

---

## Mobile CSS Variable Resolution

**Context:** Modal, Drawer, navigation dots showing transparent backgrounds on mobile.

Tailwind v4's `@theme inline` block processes BEFORE `tokens.css` is imported. Desktop masks this with `backdrop-blur`, but mobile has blur disabled.

**Fix:** Use explicit Tailwind colors for mobile-critical backgrounds:
```tsx
// eslint-disable-next-line no-restricted-syntax
className="bg-white dark:bg-black md:bg-white/80 md:dark:bg-black/80 md:backdrop-blur-md"
```

**Affected:** Modal, Drawer, MobileDrawer, ItemDetailSheet, CartBar, NavDots, SectionNavDots, SectionCarousel.

**Apply when:** Fixed/floating UI elements appearing transparent on mobile.
