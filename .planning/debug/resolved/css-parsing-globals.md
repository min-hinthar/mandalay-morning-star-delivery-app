---
status: resolved
trigger: "Build error - Parsing CSS source code failed in ./src/app/globals.css:759:22"
created: 2026-01-24T12:00:00Z
updated: 2026-01-24T12:35:00Z
---

## Current Focus

hypothesis: CONFIRMED - TailwindCSS 4 automatic content detection scans all markdown files, finding deprecated z-index CSS variable patterns and generating invalid wildcard CSS
test: Verify build completes without CSS parsing warnings
expecting: Zero CSS parsing warnings after updating all documentation files
next_action: Run build and verify warnings are eliminated

## Symptoms

expected: Build and dev server run without CSS errors
actual: "Parsing CSS source code failed" mentioning invalid z-index wildcard patterns
errors: TailwindCSS 4 generated invalid CSS with literal `*` and `...` in CSS output
reproduction: Run `pnpm dev` and navigate to any page
started: After Phase 15 (z-index token migration + R3F setup)

## Eliminated

(none - first hypothesis confirmed)

## Evidence

- timestamp: 2026-01-24T12:01:00Z
  checked: src/app/globals.css
  found: Only 353 lines, no deprecated z-index pattern in source
  implication: Error is in compiled CSS, not source

- timestamp: 2026-01-24T12:02:00Z
  checked: Grep for deprecated patterns in src/
  found: No matches in .tsx, .ts, .js, .css files
  implication: Source code is clean

- timestamp: 2026-01-24T12:03:00Z
  checked: Grep for deprecated patterns in entire repo
  found: Pattern exists in docs/component-guide.md, .claude/LEARNINGS.md, .planning/ files
  implication: Documentation files contain deprecated patterns

- timestamp: 2026-01-24T12:04:00Z
  checked: pnpm dev output
  found: Compiled CSS shows invalid wildcard pattern with literal `...`
  implication: TailwindCSS 4 scans docs/ and generates wildcard fallback for similar classes

- timestamp: 2026-01-24T12:05:00Z
  checked: tailwind.config.ts content paths
  found: Only includes src/pages, src/components, src/app - NOT docs/
  implication: TailwindCSS 4 with @tailwindcss/postcss has automatic content detection beyond explicit paths

- timestamp: 2026-01-24T12:25:00Z
  checked: Build after documentation updates
  found: Warnings reduced from 5 to 2
  implication: Need to update remaining files including this debug file itself

## Resolution

root_cause: TailwindCSS 4 automatic content detection scans ALL markdown files in the repository (not just configured paths). Documentation files containing code examples with deprecated arbitrary z-index CSS variable syntax cause TailwindCSS to generate invalid wildcard fallback patterns in the compiled CSS.

fix: Updated all documentation files to use current TailwindCSS 4 z-index utilities (z-modal, z-sticky, z-popover) instead of deprecated CSS variable syntax. Files updated:
- docs/component-guide.md (already using correct patterns)
- .claude/LEARNINGS.md (3 patterns updated)
- .planning/research/ARCHITECTURE.md (2 patterns updated)
- .planning/codebase/CONVENTIONS.md (1 pattern updated)
- .planning/phases/01-foundation-token-system/01-RESEARCH.md (2 patterns updated)
- .planning/phases/01-foundation-token-system/01-01-PLAN.md (2 patterns updated)
- .planning/phases/06-checkout-flow/06-RESEARCH.md (1 pattern updated)
- .planning/phases/15-foundation-r3f-setup/15-RESEARCH.md (1 pattern updated)
- .planning/phases/15-foundation-r3f-setup/15-01-SUMMARY.md (1 pattern updated)
- .planning/research/STACK.md (1 pattern updated)
- docs/V8/PRD_V8.md (1 pattern updated)
- .claude/ERROR_HISTORY.md (code examples updated)
- .planning/debug/css-parsing-globals.md (this file - cleaned)

verification: Build completes successfully with zero CSS parsing warnings. Tested with `pnpm build`.
files_changed:
  - Multiple documentation files (see fix section above)
