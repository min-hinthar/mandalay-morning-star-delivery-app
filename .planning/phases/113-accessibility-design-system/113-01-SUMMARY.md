---
phase: 113-accessibility-design-system
plan: "01"
subsystem: design-system
tags: [accessibility, wcag, touch-targets, focus-indicators]
dependency_graph:
  requires: []
  provides: [button-xs-variant, input-xs-variant, 44px-sm-touch-targets, input-focus-ring]
  affects: [68+ files using Button sm, 15+ files using Input sm]
tech_stack:
  added: []
  patterns: [CVA-size-variant-with-min-height, focus-visible-ring-over-motion-glow]
key_files:
  created: []
  modified:
    - src/components/ui/button.tsx
    - src/components/ui/input.tsx
decisions:
  - "sm variants bumped from h-9 (36px) to h-11 (44px) for WCAG AAA touch target compliance"
  - "xs escape hatch at h-9 (36px) for non-mobile tight containers"
  - "min-h-11 added to sm to prevent flex container collapse"
  - "focus-visible ring layered on existing Framer Motion glow (CSS + JS coexist)"
metrics:
  duration: 7m
  completed: "2026-04-10T04:16:05Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 113 Plan 01: Touch Target Compliance Summary

Button and Input sm variants upgraded to 44px (h-11) with xs escape hatch at 36px (h-9); Input gains focus-visible:ring-2 layered on Framer Motion glow.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Button sm -> h-11 + xs variant | af3c056b | src/components/ui/button.tsx |
| 2 | Input sm -> h-11 + xs variant + focus ring | aeb40cfc | src/components/ui/input.tsx |

## Changes Made

### Button (button.tsx)
- `sm`: `h-9` -> `h-11 min-h-11` (44px, flex-safe)
- New `xs`: `h-9 px-3 py-1.5 text-xs` (36px escape hatch)
- New `icon-xs`: `h-9 w-9` (36px icon-only escape hatch)
- JSDoc updated: `xs (36px), sm (44px)`

### Input (input.tsx)
- `sm`: `h-9` -> `h-11 min-h-11` (44px, flex-safe)
- New `xs`: `h-9 px-2.5 py-1.5 text-xs` (36px escape hatch)
- Base CVA: added `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- JSDoc updated: `xs=36px, sm=44px, default=44px`

## Decisions Made

1. **min-h-11 on sm variants** -- prevents flex containers from collapsing the 44px height
2. **focus-visible ring on Input** -- CSS ring layers on top of Framer Motion animated glow; both systems coexist without conflict
3. **xs variant sizing** -- button xs gets smaller padding (px-3 py-1.5) and text-xs; input xs gets px-2.5 py-1.5 text-xs

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `pnpm typecheck`: PASSED (zero errors)
- `pnpm lint`: PASSED (zero violations)
- `pnpm build`: SKIPPED (worktree lacks .env.local; preexisting environment issue, not caused by CSS changes)
- grep confirms: h-11 in both sm variants, h-9 in both xs variants, focus-visible:ring-2 in input base

## Known Stubs

None.
