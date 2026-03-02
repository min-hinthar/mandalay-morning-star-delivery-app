---
phase: 83-driver-simplification
plan: "01"
subsystem: driver-simple-mode
tags: [db, migration, context, navigation, driver-ux]
dependency_graph:
  requires:
    - supabase/migrations/030_email_reliability.sql
    - src/app/(driver)/driver/layout.tsx
    - src/components/ui/driver/DriverNav.tsx
    - src/app/api/driver/profile/route.ts
  provides:
    - supabase/migrations/031_driver_simple_mode.sql
    - src/components/ui/driver/SimpleModeProvider.tsx
  affects:
    - src/types/driver.ts
    - src/app/(driver)/driver/layout.tsx
    - src/components/ui/driver/DriverNav.tsx
    - src/app/api/driver/profile/route.ts
tech_stack:
  added: []
  patterns:
    - React context with optimistic toggle + API PATCH rollback
    - "as unknown as Record<string, unknown>" cast for migration columns not in generated types
    - Set-based conditional filtering for nav item visibility
key_files:
  created:
    - supabase/migrations/031_driver_simple_mode.sql
    - src/components/ui/driver/SimpleModeProvider.tsx
  modified:
    - src/types/driver.ts
    - src/app/(driver)/driver/layout.tsx
    - src/components/ui/driver/DriverNav.tsx
    - src/app/api/driver/profile/route.ts
    - src/components/ui/driver/index.ts
decisions:
  - "simple_mode default true — new drivers start in simple mode"
  - "Server-side DB column over localStorage — persists across devices"
  - "Optimistic toggle with API rollback pattern"
  - "SIMPLE_MODE_KEYS Set for O(1) nav item filtering"
metrics:
  completed: "2026-03-02"
  tasks_completed: 2
  files_created: 2
  files_modified: 5
---

# Phase 83 Plan 01: DB Migration + SimpleModeProvider + Nav Wiring

**One-liner:** Database column `simple_mode`, React context provider with optimistic toggle, and conditional 2-tab vs 5-tab navigation.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | DB migration + types + SimpleModeProvider | 3b8daab3 | 3 files (2 new, 1 modified) |
| 2 | Layout integration + nav filtering + profile API | c622f7ca | 4 files (all modified) |

## What Was Built

### Task 1: Database + Provider

**`supabase/migrations/031_driver_simple_mode.sql`** — Adds `simple_mode boolean NOT NULL DEFAULT true` to drivers table with comment.

**`src/types/driver.ts`** — Added `simple_mode: boolean` to DriversRow, optional on Insert/Update.

**`src/components/ui/driver/SimpleModeProvider.tsx`** — React context with `isSimpleMode` boolean and `toggleSimpleMode()`. Optimistic state flip with PATCH to `/api/driver/profile` and rollback on failure.

### Task 2: Integration

**`src/app/(driver)/driver/layout.tsx`** — Wraps with SimpleModeProvider, fetches `simple_mode` column.

**`src/components/ui/driver/DriverNav.tsx`** — Filters to Home+Route tabs when `isSimpleMode`.

**`src/app/api/driver/profile/route.ts`** — Accepts `simpleMode` boolean in PATCH body.

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (432 tests) |
| `pnpm build` | PASS |

## Deviations from Plan

None.
