---
phase: 114-loading-states-offline
plan: 02
subsystem: ui
tags: [skeleton-crossfade, loading-timeout, documentation, refactor]

requires:
  - phase: 114-loading-states-offline
    plan: 01
    provides: Content-shaped skeletons for orders, order detail, account pages
provides:
  - SkeletonCrossfade at shared ui/ path (importable by any route group)
  - LoadingWithTimeout wrapping on all 3 customer loading.tsx files
  - Loading hierarchy documentation
affects:
  - src/components/ui/SkeletonCrossfade.tsx
  - src/components/ui/admin/SkeletonCrossfade.tsx
  - src/app/(admin)/admin/drivers/page.tsx
  - src/app/(admin)/admin/orders/page.tsx
  - src/app/(admin)/admin/routes/page.tsx
  - src/components/ui/admin/drivers/DriverDetailClient/DriverDetailClient.tsx
  - src/components/ui/admin/routes/RouteBuilder/RouteBuilderClient.tsx
  - src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx
  - src/app/(customer)/orders/loading.tsx
  - src/app/(customer)/orders/[id]/loading.tsx
  - src/app/(customer)/account/loading.tsx
  - docs/loading-hierarchy.md

tech-stack:
  added: []
  patterns: [re-export-barrel, loading-hierarchy-enforcement]

key-files:
  created:
    - src/components/ui/SkeletonCrossfade.tsx
    - docs/loading-hierarchy.md
  modified:
    - src/components/ui/admin/SkeletonCrossfade.tsx
    - src/app/(admin)/admin/drivers/page.tsx
    - src/app/(admin)/admin/orders/page.tsx
    - src/app/(admin)/admin/routes/page.tsx
    - src/components/ui/admin/drivers/DriverDetailClient/DriverDetailClient.tsx
    - src/components/ui/admin/routes/RouteBuilder/RouteBuilderClient.tsx
    - src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx
    - src/app/(customer)/orders/loading.tsx
    - src/app/(customer)/orders/[id]/loading.tsx
    - src/app/(customer)/account/loading.tsx

decisions:
  - D-09: SkeletonCrossfade promoted from admin/ to shared ui/ (zero admin-specific imports confirmed)
  - D-10: Customer loading.tsx files wrapped with LoadingWithTimeout at timeoutMs=15000
  - D-11: Loading hierarchy documented in docs/loading-hierarchy.md
  - D-12: Existing animation cycle limits preserved (10 cycles skeleton = 15s, 20 cycles spinner = 30s)

metrics:
  duration: 6min
  completed: "2026-04-10T07:33:00Z"
  tasks: 2
  files: 12
---

# Phase 114 Plan 02: SkeletonCrossfade Promotion + Loading Hierarchy Summary

SkeletonCrossfade promoted to shared `src/components/ui/` with re-export barrel at admin/ path; all 3 customer loading.tsx files wrapped with LoadingWithTimeout at 15s timeout; loading hierarchy pattern documented.

## Task Results

### Task 1: Promote SkeletonCrossfade to shared ui/

- Copied 78-line component to `src/components/ui/SkeletonCrossfade.tsx` (unchanged code, zero admin-specific imports)
- Converted `src/components/ui/admin/SkeletonCrossfade.tsx` to 3-line re-export barrel
- Updated all 6 admin consumers to import from shared `@/components/ui/SkeletonCrossfade` path
- **Commit:** `100f17ae`

### Task 2: Wrap customer loading.tsx with LoadingWithTimeout + document hierarchy

- Wrapped `orders/loading.tsx`, `orders/[id]/loading.tsx`, `account/loading.tsx` with `<LoadingWithTimeout skeleton={...} timeoutMs={15000} />`
- Created `docs/loading-hierarchy.md` documenting 3-tier pattern: Skeleton (0-15s) > Timeout message (15s+) > Page reload (user-triggered)
- **Commit:** `4043a757`

## Verification

- `pnpm lint` -- pass
- `pnpm lint:css` -- pass
- `pnpm format:check` -- pass
- `pnpm typecheck` -- pass
- `pnpm test` -- 67 files, 1029 tests pass
- `pnpm build` -- success

## Deviations from Plan

None -- plan executed exactly as written.

## Self-Check: PASSED
