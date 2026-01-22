---
phase: 01-foundation-token-system
plan: 04
subsystem: design-tokens
tags: [z-index, css-variables, typescript, gap-closure]

# Dependency graph (for orchestrator context)
requires:
  - 01-01 # Original z-index token definitions
provides:
  - corrected-css-variable-references
affects:
  - any component using zIndexVar in inline styles

# Tech tracking
tech-stack:
  patterns:
    - css-custom-properties-in-typescript

# File tracking
key-files:
  modified:
    - src/design-system/tokens/z-index.ts

# Decisions
decisions: []

# Metrics
metrics:
  duration: "3 min"
  completed: "2026-01-22"
---

# Phase 01 Plan 04: Z-Index CSS Variable Fix Summary

**One-liner:** Corrected zIndexVar to reference --z-index-* CSS custom properties matching globals.css @theme block.

## What Was Done

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Updated all 10 zIndexVar properties to use --z-index-* prefix | 47e9d1d |
| 2 | Added JSDoc clarifying CSS variable naming convention | 7beeb30 |

## Key Changes

### Before (BROKEN)
```typescript
export const zIndexVar = {
  modal: "var(--z-modal)",  // CSS variable doesn't exist
  // ...
}
```

### After (FIXED)
```typescript
export const zIndexVar = {
  modal: "var(--z-index-modal)",  // Matches globals.css @theme
  // ...
}
```

## Root Cause

TailwindCSS 4 strips the `--z-index-` prefix to generate `z-*` utilities, but the raw CSS custom properties retain the full name. The original implementation incorrectly assumed the utility name matched the CSS variable name.

## Verification Results

- Pattern match: 11 occurrences of `var(--z-index-` (10 properties + 1 JSDoc example)
- No old pattern: 0 occurrences of `var(--z-base)`
- TypeScript: Compiles without errors

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| zIndexVar.modal equals "var(--z-index-modal)" | PASS |
| All 10 zIndexVar properties use --z-index-* prefix | PASS |
| TypeScript compiles without errors | PASS |

## Impact

Components using `style={{ zIndex: zIndexVar.modal }}` will now correctly receive the CSS variable value instead of silently failing with an invalid reference.
