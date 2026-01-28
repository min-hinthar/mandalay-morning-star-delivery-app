---
status: resolved
trigger: "next build failing with CSS optimization error on wildcard var pattern - unexpected token"
created: 2026-01-27T00:00:00Z
updated: 2026-01-27T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Tailwind v4 auto-content detection scans .claude/LEARNINGS.md and picks up wildcard patterns from examples
test: Confirmed via grep - pattern exists at line 630 in LEARNINGS.md
expecting: Changing the example to use concrete class names will eliminate the warning
next_action: Fix LEARNINGS.md line 630 to use concrete class names instead of wildcard

## Symptoms

expected: Build completes successfully
actual: Build fails with CSS optimization warning about `Unexpected token Delim('*')` in wildcard var class
errors: |
  Found 1 warning while optimizing generated CSS:
  │   }
  │   .bg-\[var\(--color-\*\)\] {
  │     background-color: var(--color-WILDCARD);
  ┆                                   ^-- Unexpected token Delim('*')
reproduction: Run `next build` or `pnpm build`
started: Unknown

## Eliminated

## Evidence

- timestamp: 2026-01-27T00:01:00Z
  checked: Grep search for wildcard pattern across project
  found: Pattern exists in `.claude/LEARNINGS.md` line 630 as an example of bad practice
  implication: Tailwind v4 auto-content detection scans all project files including .claude/ and interprets example class patterns as real classes

- timestamp: 2026-01-27T00:02:00Z
  checked: LEARNINGS.md section about Tailwind v4 scanning
  found: The file already documents this exact issue at lines 616-637 but the example itself (line 630) contains the problematic pattern
  implication: The documentation example is causing the very issue it warns about - ironic but easily fixed

## Resolution

root_cause: `.claude/LEARNINGS.md` line 630 contains a wildcard var pattern as an example of bad practice, but Tailwind v4 auto-content detection scans this file and tries to compile it as a real class, resulting in CSS optimization error
fix: Replace the wildcard example with a concrete class name or escape the pattern so Tailwind doesn't interpret it
verification: Build completes without CSS optimization warning - verified with `pnpm build`
files_changed: [".claude/LEARNINGS.md"]
