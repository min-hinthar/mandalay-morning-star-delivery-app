---
phase: 29
plan: 02
subsystem: design-tokens
tags: [shadow, tokens, css-variables, tailwind, framer-motion]
requires: ["29-01"]
provides:
  - shadow-glow-amber token
  - shadow-hint-sm/md tokens
  - component shadow migrations
  - motion token documentation
affects: ["29-03"]
tech-stack:
  added: []
  patterns: ["CSS variable shadows", "Framer Motion token equivalents"]
key-files:
  created: []
  modified:
    - src/styles/tokens.css
    - tailwind.config.ts
    - src/components/ui/cart/CartSummary.tsx
    - src/components/ui/cart/CartBar.tsx
    - src/components/ui/theme-toggle.tsx
    - src/components/ui/layout/MobileDrawer/DrawerNavLink.tsx
    - src/components/ui/layout/AppHeader/SearchTrigger.tsx
    - src/components/ui/layout/AppHeader/AccountIndicator.tsx
    - src/lib/micro-interactions.ts
    - src/lib/motion-tokens.ts
decisions:
  - id: shadow-glow-amber
    choice: "New token for amber progress bar glow"
    rationale: "Distinct from warning (orange) - amber-500 specific for cart progress"
  - id: shadow-hint-sm-md
    choice: "New tokens for gradient hint shadows"
    rationale: "Brand-tinted compound shadows for keyboard hints and dropdowns"
  - id: framer-motion-numeric
    choice: "Keep numeric boxShadow for animated variants"
    rationale: "Framer Motion requires numeric values for smooth interpolation"
  - id: discrete-state-css-vars
    choice: "Use CSS vars for inputFocus states"
    rationale: "Discrete state changes work with CSS variables, not interpolated"
metrics:
  duration: 15min
  completed: 2026-01-28
---

# Phase 29 Plan 02: Shadow Migration Summary

**One-liner:** Migrated all arbitrary Tailwind shadow values to semantic tokens with CSS variable support for theme-awareness.

## Changes Made

### Task 1: Component Shadow Migrations (from previous session)

| Component | Before | After |
|-----------|--------|-------|
| CartSummary | `shadow-[0_2px_8px_rgba(245,158,11,0.4)]` | `shadow-glow-amber` |
| CartBar | `shadow-[0_-4px_20px...]` light/dark | `shadow-nav-top` |
| theme-toggle | `dark:shadow-[0_0_12px...]` | `dark:shadow-glow-primary` |
| DrawerNavLink | `shadow-[0_0_12px_rgba(164,16,52,0.25)]` | `shadow-glow-primary` |

### Task 2: AppHeader Shadow Migrations

| Component | Before | After |
|-----------|--------|-------|
| SearchTrigger hint | Compound gradient shadow | `shadow-hint-sm` |
| AccountIndicator dropdown | Compound gradient shadow | `shadow-hint-md` |

### Task 3: Motion Token Files

**micro-interactions.ts:**
- Added JSDoc documenting shadow token equivalents
- primaryButtonVariants: ~--shadow-xs, ~--shadow-button-hover equivalents
- cardVariants: ~--shadow-sm, ~--shadow-lg equivalents
- Values kept numeric for Framer Motion interpolation

**motion-tokens.ts:**
- inputFocus now uses CSS variable tokens
  - initial: `var(--shadow-none)`
  - focus: `var(--shadow-focus)`
  - error: `var(--shadow-focus-error)`
  - success: `var(--shadow-focus-success)`
- buttonPress.whileTap documents ~--shadow-xs equivalent

### New Tokens Added

**tokens.css (light mode):**
```css
--shadow-glow-amber: 0 2px 8px rgba(245, 158, 11, 0.4);
--shadow-hint-sm: 0 2px 8px rgba(164, 16, 52, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1);
--shadow-hint-md: 0 4px 20px -4px rgba(164, 16, 52, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08);
```

**tokens.css (dark mode):**
```css
--shadow-glow-amber: 0 2px 8px rgba(251, 191, 36, 0.5);
--shadow-hint-sm: 0 2px 8px rgba(245, 158, 11, 0.2), 0 1px 4px rgba(0, 0, 0, 0.2);
--shadow-hint-md: 0 4px 20px -4px rgba(245, 158, 11, 0.15), 0 2px 8px rgba(0, 0, 0, 0.3);
```

**tailwind.config.ts:**
```typescript
"glow-amber": "var(--shadow-glow-amber)",
"hint-sm": "var(--shadow-hint-sm)",
"hint-md": "var(--shadow-hint-md)",
```

## Verification Results

- Zero `shadow-[...]` violations in cart/, theme-toggle, MobileDrawer
- Zero `shadow-[...]` violations in AppHeader/ (excluding valid var() patterns)
- `var(--shadow-` count in motion-tokens.ts: 4 (inputFocus states)
- Token equivalents documented in micro-interactions.ts: 5 comments
- `pnpm typecheck` passes
- `pnpm build` passes

## Decisions Made

1. **shadow-glow-amber** - Distinct token for amber cart progress glow (not reusing warning/orange)
2. **shadow-hint-sm/md** - Compound gradient shadows for keyboard hints and dropdowns
3. **Framer Motion numeric** - Keep hardcoded values where animation interpolation required
4. **CSS vars for discrete states** - inputFocus uses CSS vars since states don't interpolate

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Phase 29-03 (blur migration) can proceed. All shadow tokens are now:
- Theme-aware via CSS variables
- Accessible via Tailwind utilities
- Documented for Framer Motion animated cases

## Commits

| Commit | Description |
|--------|-------------|
| bc1b170 | Task 1 - Component shadows (previous session) |
| e272ab2 | Task 2 - AppHeader shadows |
| e733792 | Task 3 - Motion token files |
