---
status: fixing
trigger: "Build error - Parsing CSS source code failed in ./src/app/globals.css:759:22"
created: 2026-01-24T12:00:00Z
updated: 2026-01-24T12:05:00Z
---

## Current Focus

hypothesis: TailwindCSS 4 automatic content detection is scanning docs/ folder, finding z-[var(--z-*)] patterns in markdown code examples, and generating invalid wildcard CSS
test: Update documentation to use current z-index tokens (z-modal, z-sticky, etc.)
expecting: Build should succeed after removing old patterns from all scanned files
next_action: Update docs/component-guide.md to use current z-index patterns

## Symptoms

expected: Build and dev server run without CSS errors
actual: "Parsing CSS source code failed" at globals.css:759:22 mentioning `.z-[var(--z-...)]`
errors:
```
./src/app/globals.css:759:22
Parsing CSS source code failed
.z-\[var\(--z-\.\.\.\)\] {
    z-index: var(--z-...);
}
```
reproduction: Run `pnpm dev` and navigate to any page
started: After Phase 15 (z-index token migration + R3F setup)

## Eliminated

(none yet - first hypothesis confirmed)

## Evidence

- timestamp: 2026-01-24T12:01:00Z
  checked: src/app/globals.css
  found: Only 353 lines, no z-[var(--z-*)] pattern in source
  implication: Error is in compiled CSS, not source

- timestamp: 2026-01-24T12:02:00Z
  checked: Grep for z-[var(--z- in src/
  found: No matches in .tsx, .ts, .js, .css files
  implication: Source code is clean

- timestamp: 2026-01-24T12:03:00Z
  checked: Grep for z-[var(--z- in entire repo
  found: Pattern exists in docs/component-guide.md (lines 45-46), .claude/LEARNINGS.md, .planning/ files
  implication: Documentation files contain deprecated patterns

- timestamp: 2026-01-24T12:04:00Z
  checked: pnpm dev output
  found: Compiled CSS line 759 shows `.z-\[var\(--z-\.\.\.\)\]` with literal `...` - invalid CSS wildcard pattern
  implication: TailwindCSS 4 scans docs/ and generates wildcard fallback for similar classes

- timestamp: 2026-01-24T12:05:00Z
  checked: tailwind.config.ts content paths
  found: Only includes src/pages, src/components, src/app - NOT docs/
  implication: TailwindCSS 4 with @tailwindcss/postcss has automatic content detection beyond explicit paths

## Resolution

root_cause: TailwindCSS 4 automatic content detection scans docs/component-guide.md which contains code examples using deprecated z-[var(--z-sticky)] and z-[var(--z-modal)] patterns (lines 45-46). TailwindCSS generates a wildcard fallback pattern `.z-[var(--z-...)]` which contains invalid CSS syntax (literal `...`).

fix: Update docs/component-guide.md to use current z-index tokens (z-sticky, z-modal, z-popover) instead of deprecated CSS variable syntax (z-[var(--z-sticky)])

verification: (pending)
files_changed:
  - docs/component-guide.md
