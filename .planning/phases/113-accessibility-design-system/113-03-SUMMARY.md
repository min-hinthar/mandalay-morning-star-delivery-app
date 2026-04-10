# Plan 113-03 Summary: Contrast Regression Guard + ESLint Ring Enforcement

**Status:** Complete
**Date:** 2026-04-09
**Requirements:** A11Y-02, A11Y-04

## What was done

### Task 1: Vitest Contrast Audit
- Created `src/__tests__/contrast-audit.test.ts` with WCAG AA contrast verification
- 26 test cases covering all text-muted x surface combinations in light and dark themes
- Helper functions: `hexToRgb`, `relativeLuminance`, `contrastRatio`
- Lowest ratio verified: 7.28:1 (dark text-muted on surface-elevated) — well above 4.5:1 threshold
- Portal dark mode documented: CSS custom properties ensure correct inheritance

### Task 2: ESLint Ring Enforcement
- Added 2 new `no-restricted-syntax` rules to `eslint.config.mjs`:
  1. **Hardcoded ring color** — blocks `ring-red-*`, `ring-zinc-*`, etc. (27 Tailwind color families)
  2. **focus:ring pattern** — blocks `focus:ring`, requires `focus-visible:ring` (WCAG 2.4.7)
- Migrated 35 files from `focus:ring` to `focus-visible:ring`
- Fixed 2 remaining hardcoded ring colors in OpsKPIGrid.tsx and SettingsNudgeBanner.tsx

## Verification

- `pnpm lint` — 0 errors
- `pnpm lint:css` — pass
- `pnpm format:check` — pass
- `pnpm typecheck` — pass
- `pnpm test` — 1018 tests pass (65 files), including 26 contrast audit tests
- `pnpm build` — pass

## Commits
- `75f65fb5` — contrast audit test file
- `c7c09ebd` — ESLint rules + focus:ring migration (36 files)

## Files Modified
- `eslint.config.mjs` — 2 new rules added
- `src/__tests__/contrast-audit.test.ts` — new file
- 35 component/app files — focus:ring → focus-visible:ring
- `src/components/ui/admin/ops/OpsKPIGrid.tsx` — ring-teal-500/ring-purple-500 → semantic tokens
- `src/components/ui/homepage/SettingsNudgeBanner.tsx` — ring-amber-400 → ring-status-warning
