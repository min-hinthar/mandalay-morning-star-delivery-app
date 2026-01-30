---
status: resolved
trigger: "TypeScript errors and sourcemap warnings after phase 35 verification commit"
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:00:00Z
---

## Current Focus

hypothesis: badgeBounce.bounce.transition.ease missing `as const` assertion
test: Add `as const` to ease: "easeOut" in CartIndicator.tsx
expecting: TypeScript will accept the Easing type
next_action: Apply fix and verify build

## Symptoms

expected: Clean build with no errors - TypeScript compiles successfully, no sourcemap warnings
actual: Both TypeScript errors and "Could not auto-detect referenced sourcemap" warnings on Vercel/next build
errors: TypeScript type errors + sourcemap warnings during build
reproduction: pnpm build, pnpm dev, pnpm typecheck, next build
started: After phase 35 verification commit (c895cd9)

## Eliminated

## Evidence

- timestamp: 2026-01-30T00:01:00Z
  checked: pnpm typecheck output
  found: Errors in .next/dev/types/routes.d.ts - file has duplicate content appended (lines 139-149 duplicate lines 129-138)
  implication: Next.js generated routes file is corrupted - likely from interrupted build

- timestamp: 2026-01-30T00:01:00Z
  checked: pnpm build output
  found: CartIndicator.tsx:140 - Type error with framer-motion Variants type
  implication: badgeBounce.bounce variant has `ease: "easeOut"` as string, but framer-motion expects specific Easing type

- timestamp: 2026-01-30T00:02:00Z
  checked: git log for CartIndicator.tsx
  found: Commit c319140 changed from spring.rubbery to tween with ease property
  implication: The fix in commit c319140 missed adding `as const` to ease value

- timestamp: 2026-01-30T00:03:00Z
  checked: Other usages of ease in codebase
  found: All other ease values use `as const` (e.g., iconShake line 49, motion.ts, etc.)
  implication: Consistent pattern requires `as const` for framer-motion type compatibility

## Resolution

root_cause: Two issues - (1) Commit c319140 added tween transition with `ease: "easeOut"` but forgot `as const` assertion, causing framer-motion Variants type incompatibility. (2) .next/dev/types/routes.d.ts was corrupted with duplicate content from interrupted build.
fix: Added `as const` to `ease: "easeOut"` in CartIndicator.tsx line 39. Deleted corrupted .next directory (regenerated on build).
verification: pnpm typecheck passes, pnpm build succeeds, pnpm lint passes, pnpm dev starts without sourcemap warnings
files_changed: [src/components/ui/layout/AppHeader/CartIndicator.tsx]
