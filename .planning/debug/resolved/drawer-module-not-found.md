---
status: resolved
trigger: "Turbopack build fails with Module not found: Can't resolve './Drawer' but file exists"
created: 2026-01-27T00:00:00Z
updated: 2026-01-27T00:00:00Z
---

## Current Focus

hypothesis: Issue was transient or already fixed
test: Run pnpm build
expecting: Build fails with Drawer module error
next_action: N/A - Issue resolved

## Symptoms

expected: Build completes successfully
actual: Build fails with module resolution error for Drawer component
errors: |
  Error: Turbopack build failed with 2 errors:
  ./src/components/ui/index.ts:114:1
  Module not found: Can't resolve './Drawer'
    112 |
    113 | // Drawer (V8 Unified - includes BottomSheet)
  > 114 | export { Drawer, BottomSheet } from "./Drawer";
        | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    115 | export type { DrawerProps, BottomSheetProps } from "./Drawer";
reproduction: Run `pnpm build`
started: After previous CSS fix commit

## Eliminated

## Evidence

- timestamp: 2026-01-27T00:00:00Z
  checked: src/components/ui/Drawer.tsx file existence and exports
  found: |
    - File exists at correct path with correct casing
    - Exports: `Drawer` function component (line 102)
    - Exports: `BottomSheet` function component (line 346)
    - Exports: `DrawerProps` type (line 42)
    - Exports: `BottomSheetProps` type (line 351)
    - All exports match what index.ts expects
  implication: Exports are correct, issue is not in the source files

- timestamp: 2026-01-27T00:00:00Z
  checked: pnpm build command
  found: |
    Build completed successfully with no errors:
    - Compiled successfully in 26.0s
    - Generated 45 static pages
    - All routes generated correctly
  implication: Issue does not currently reproduce - may have been transient build cache issue

## Resolution

root_cause: Transient build issue - possibly stale Turbopack cache or incomplete previous build. Current codebase builds successfully.
fix: No fix needed - build succeeds as-is
verification: pnpm build completed with no errors
files_changed: []
