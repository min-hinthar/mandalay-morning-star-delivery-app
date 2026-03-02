---
phase: 83-driver-simplification
plan: "02"
subsystem: driver-simple-mode
tags: [components, driver-ux, profile, toggle]
dependency_graph:
  requires:
    - src/components/ui/driver/SimpleModeProvider.tsx
  provides:
    - src/components/ui/driver/SimpleHome.tsx
    - src/components/ui/driver/SimpleModeToggle.tsx
  affects:
    - src/app/(driver)/driver/profile/ProfilePageClient.tsx
    - src/components/ui/driver/index.ts
tech_stack:
  added: []
  patterns:
    - Accessible toggle switch with role="switch" and aria-checked
    - First-name extraction from full name string
key_files:
  created:
    - src/components/ui/driver/SimpleHome.tsx
    - src/components/ui/driver/SimpleModeToggle.tsx
  modified:
    - src/app/(driver)/driver/profile/ProfilePageClient.tsx
    - src/components/ui/driver/index.ts
decisions:
  - "SimpleHome shows greeting with first name only for personal touch"
  - "Three states: Start Route (planned), Continue Route (in_progress), No Route"
  - "72px min-height buttons for non-technical users"
metrics:
  completed: "2026-03-02"
  tasks_completed: 2
  files_created: 2
  files_modified: 2
---

# Phase 83 Plan 02: SimpleHome + SimpleModeToggle

**One-liner:** Minimal home screen with greeting + route CTA, and accessible toggle switch on profile page.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | SimpleHome component | 56122683 | 2 files (1 new, 1 modified) |
| 2 | SimpleModeToggle + profile integration | 56122683 | 2 files (1 new, 1 modified) |

## What Was Built

**`src/components/ui/driver/SimpleHome.tsx`** — Greeting ("Hello, {firstName}!"), date display, and large route CTA. Start Route fires POST to start API then navigates. Continue Route shows progress bar and navigates directly. No Route shows Package icon with message.

**`src/components/ui/driver/SimpleModeToggle.tsx`** — Card with Smartphone icon, explanation text, and animated toggle switch. Uses `useSimpleMode()` context for optimistic state management.

**`src/app/(driver)/driver/profile/ProfilePageClient.tsx`** — Added SimpleModeToggle below save button with staggered animation.

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm build` | PASS |

## Deviations from Plan

None.
