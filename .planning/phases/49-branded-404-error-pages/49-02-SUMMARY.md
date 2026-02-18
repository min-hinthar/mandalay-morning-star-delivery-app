---
phase: 49-branded-404-error-pages
plan: 02
subsystem: error-ui
tags: [404-pages, food-puns, emoji-mascot, portal-navigation, server-components]
depends_on:
  requires: [49-01]
  provides: [branded-404-pages, food-themed-route-errors]
  affects: []
tech-stack:
  added: []
  patterns: [portal-specific-not-found, food-themed-error-copy]
key-files:
  created:
    - src/app/(admin)/admin/not-found.tsx
    - src/app/(driver)/driver/not-found.tsx
  modified:
    - src/app/not-found.tsx
    - src/components/ui/RouteError.tsx
decisions: []
metrics:
  duration: ~10m
  completed: 2026-02-08
---

# Phase 49 Plan 02: Branded 404 Error Pages Summary

Three portal-specific branded not-found pages with food pun copy, emoji mascots, sunset gradient, and navigation cards; RouteError upgraded with food-themed personality replacing AlertTriangle icon.

## Completed Tasks

| #   | Task                                            | Commit  | Key Files                           |
| --- | ----------------------------------------------- | ------- | ----------------------------------- |
| 1   | Create branded not-found pages for all portals  | 3e12d08 | not-found.tsx (root, admin, driver) |
| 2   | Upgrade RouteError with food-themed personality | e5c2012 | RouteError.tsx                      |

## What Was Built

- **Root not-found.tsx**: Full-screen branded 404 with ErrorPageShell (sunset gradient + floating food emojis), ErrorMascot (sad face emoji), food pun headline ("This dish got lost in delivery!"), and customer NavigationCardGrid (Home, Menu, Orders)
- **Admin not-found.tsx**: Same branded 404 with admin NavigationCardGrid (Dashboard, Orders, Drivers)
- **Driver not-found.tsx**: Same branded 404 with driver NavigationCardGrid (Dashboard, Routes, History)
- **RouteError upgrade**: Replaced AlertTriangle icon with ErrorMascot (mind-blown emoji), updated heading to "Kitchen meltdown!", updated body copy to food metaphors ("fell off the tray" / "boiled over in the kitchen"); all existing functionality preserved (Sentry, retry counter, go-home emphasis, Button components, dev stack trace)

All three not-found pages are server components with zero Framer Motion. Same copy across portals per locked decision -- only navigation links differ.

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

None -- all decisions were locked in research phase.

## Verification

- All 3 not-found.tsx files exist with correct portal-specific NavigationCardGrid
- Zero Framer Motion imports in not-found pages
- Zero `'use client'` directives in not-found pages (all server components)
- RouteError preserves: `'use client'`, Sentry, handleRetry, showHomeEmphasis, Button components
- RouteError uses ErrorMascot instead of AlertTriangle
- `pnpm lint`, `pnpm lint:css`, `pnpm typecheck`, `pnpm test` (343 tests), `pnpm build` all pass

## Next Phase Readiness

Phase 49 is complete. All error UI components and pages are built and verified.
