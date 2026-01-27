---
phase: 33
plan: 04
subsystem: components
tags: [layout, refactor, consolidation]
requires:
  - 33-01
provides:
  - ui/layout/ directory with app shells
  - ui/search/ directory with CommandPalette
  - Layout primitives at ui/ root
affects:
  - 33-05 (final cleanup)
tech-stack:
  added: []
  patterns:
    - Layout primitives at ui/ root
    - App shells in ui/layout/
    - Search components in ui/search/
key-files:
  created:
    - src/components/ui/Stack.tsx
    - src/components/ui/Grid.tsx
    - src/components/ui/Container.tsx
    - src/components/ui/Cluster.tsx
    - src/components/ui/SafeArea.tsx
    - src/components/ui/layout/index.ts
    - src/components/ui/search/index.ts
  modified:
    - src/components/ui/index.ts
    - src/components/layouts/index.ts
    - src/app/layout.tsx
decisions:
  - Layout primitives at ui/ root per CONTEXT.md
  - App layouts in ui/layout/ for consistency
  - CommandPalette to ui/search/ for semantic grouping
metrics:
  duration: 21min
  completed: 2026-01-27
---

# Phase 33 Plan 04: Layout and Search Consolidation Summary

Merged layout/ and layouts/ directories into ui/layout/, moved layout primitives to ui/ root, created ui/search/ for CommandPalette.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Move layout primitives to ui/ root | 8693b08 | Stack, Grid, Container, Cluster, SafeArea |
| 2 | Create ui/layout/ and move app layouts | 189cc6e | AdminLayout, CheckoutLayout, DriverLayout, AppHeader, MobileDrawer |
| 3 | Create ui/search/ with CommandPalette | 80ae9ae | CommandPalette directory |

## What Changed

### Task 1: Layout Primitives to ui/ Root
- Moved 5 layout primitives from layouts/ to ui/
- Stack, Grid, Container, Cluster, SafeArea now at ui/ root
- Moved 3 story files for Stack, Grid, Container
- Updated layouts/index.ts to re-export from ui/
- Added exports to ui/index.ts

### Task 2: App Layouts to ui/layout/
- Created ui/layout/ directory
- Moved AdminLayout, CheckoutLayout, DriverLayout from layouts/
- Moved AppHeader/ directory from layout/
- Moved HeaderWrapper.tsx from layout/
- Moved MobileDrawer/ directory from layout/
- Updated app/layout.tsx to use new HeaderWrapper path
- Created ui/layout/index.ts with all exports

### Task 3: CommandPalette to ui/search/
- Created ui/search/ directory
- Moved CommandPalette/ from layout/ to ui/search/
- Created ui/search/index.ts
- Updated AppHeader import to use new path
- Renamed SearchEmptyState export to avoid conflict

## Import Path Changes

| Old Path | New Path |
|----------|----------|
| @/components/layouts/Stack | @/components/ui/Stack |
| @/components/layouts/Grid | @/components/ui/Grid |
| @/components/layouts/Container | @/components/ui/Container |
| @/components/layouts/AdminLayout | @/components/ui/layout/AdminLayout |
| @/components/layout/HeaderWrapper | @/components/ui/layout/HeaderWrapper |
| @/components/layout/CommandPalette | @/components/ui/search |

## Backwards Compatibility

- layouts/index.ts re-exports all primitives from ui/
- layouts/index.ts re-exports all app shells from ui/layout
- Existing consumers of @/components/layouts will continue to work

## Directory Structure After

```
src/components/
├── layouts/           # Re-export only (backwards compat)
│   └── index.ts
├── ui/
│   ├── Stack.tsx      # Layout primitive
│   ├── Grid.tsx       # Layout primitive
│   ├── Container.tsx  # Layout primitive
│   ├── Cluster.tsx    # Layout primitive
│   ├── SafeArea.tsx   # Layout primitive
│   ├── layout/        # App shells and headers
│   │   ├── index.ts
│   │   ├── AdminLayout.tsx
│   │   ├── CheckoutLayout.tsx
│   │   ├── DriverLayout.tsx
│   │   ├── HeaderWrapper.tsx
│   │   ├── AppHeader/
│   │   └── MobileDrawer/
│   └── search/        # Search components
│       ├── index.ts
│       └── CommandPalette/
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Export conflict resolution**
- **Found during:** Task 3
- **Issue:** SearchInput and SearchEmptyState exported from both menu/ and search/
- **Fix:** Renamed exports in search/index.ts to avoid conflicts
- **Files modified:** src/components/ui/search/index.ts
- **Commit:** 80ae9ae

## Next Phase Readiness

- [ ] layout/ directory now empty (can be deleted in 33-05)
- [ ] layouts/ directory only has index.ts (can be deleted in 33-05)
- [x] All imports updated and typecheck passes
