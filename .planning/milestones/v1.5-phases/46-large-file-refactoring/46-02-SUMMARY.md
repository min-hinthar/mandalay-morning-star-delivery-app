---
phase: 46
plan: 02
subsystem: admin-account-components
tags: [refactoring, component-splitting, admin, account, barrel-exports]
depends_on:
  requires: []
  provides:
    - "9 admin/account component subfolders with barrel index files"
    - "All admin detail, dashboard, route, settings, coverage, and account components under 400 lines"
  affects:
    - "46-03 through 46-07 (further component splits follow same pattern)"
tech-stack:
  added: []
  patterns:
    - "Subfolder barrel pattern for component organization"
    - "Extract modals, mobile cards, overlays, skeletons into separate files"
key-files:
  created:
    - src/components/ui/admin/drivers/DriverDetailClient/index.tsx
    - src/components/ui/admin/drivers/DriverDetailClient/types.tsx
    - src/components/ui/admin/drivers/DriverDetailClient/EditProfileModal.tsx
    - src/components/ui/admin/drivers/DriverDetailClient/ArchiveConfirmModal.tsx
    - src/components/ui/admin/routes/RouteDetailClient/index.tsx
    - src/components/ui/admin/routes/RouteDetailClient/types.ts
    - src/components/ui/admin/routes/RouteDetailClient/DriverInfoCard.tsx
    - src/components/ui/admin/routes/RouteDetailClient/RouteHeader.tsx
    - src/components/ui/admin/AdminDashboard/index.tsx
    - src/components/ui/admin/AdminDashboard/types.ts
    - src/components/ui/admin/AdminDashboard/AnimatedValue.tsx
    - src/components/ui/admin/AdminDashboard/KPICard.tsx
    - src/components/ui/admin/AdminDashboard/KPISkeleton.tsx
    - src/components/ui/admin/AdminDashboard/QuickStat.tsx
    - src/components/ui/admin/drivers/DriverListTable/index.tsx
    - src/components/ui/admin/drivers/DriverListTable/types.tsx
    - src/components/ui/admin/drivers/DriverListTable/DriverMobileCard.tsx
    - src/components/ui/admin/routes/RouteListTable/index.tsx
    - src/components/ui/admin/routes/RouteListTable/types.tsx
    - src/components/ui/admin/routes/RouteListTable/RouteMobileCard.tsx
    - src/components/ui/admin/routes/CreateRouteModal/index.tsx
    - src/components/ui/admin/routes/CreateRouteModal/types.ts
    - src/components/ui/admin/routes/CreateRouteModal/OrderSelectionList.tsx
    - src/components/ui/admin/settings/SettingsClient/index.tsx
    - src/components/ui/admin/settings/SettingsClient/SettingsSkeleton.tsx
    - src/components/ui/coverage/CoverageRouteMap/index.tsx
    - src/components/ui/coverage/CoverageRouteMap/map-styles.ts
    - src/components/ui/coverage/CoverageRouteMap/MapOverlays.tsx
    - src/components/ui/account/OrdersTab/index.tsx
    - src/components/ui/account/OrdersTab/types.ts
    - src/components/ui/account/OrdersTab/OrderCardSkeleton.tsx
  modified:
    - src/components/ui/admin/drivers/DriverDetailClient/DriverDetailClient.tsx (from original)
    - src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx (from original)
    - src/components/ui/admin/AdminDashboard/AdminDashboard.tsx (from original)
    - src/components/ui/admin/drivers/DriverListTable/DriverListTable.tsx (from original)
    - src/components/ui/admin/routes/RouteListTable/RouteListTable.tsx (from original)
    - src/components/ui/admin/routes/CreateRouteModal/CreateRouteModal.tsx (from original)
    - src/components/ui/admin/settings/SettingsClient/SettingsClient.tsx (from original)
    - src/components/ui/coverage/CoverageRouteMap/CoverageRouteMap.tsx (from original)
    - src/components/ui/account/OrdersTab/OrdersTab.tsx (from original)
decisions:
  - id: "46-02-d1"
    decision: "Extract modals, mobile cards, and map overlays as primary split targets"
    rationale: "Self-contained visual units with clear prop interfaces"
  - id: "46-02-d2"
    decision: "Keep types.tsx for JSX-containing type files (VehicleIcon component)"
    rationale: "VehicleIcon returns JSX so needs .tsx extension even in types file"
metrics:
  completed: "2026-02-06"
  duration: "~10 min"
---

# Phase 46 Plan 02: Admin/Account Component Splits Summary

Split 9 admin and account components (486-597 lines each) into subfolder pattern with barrel index files and extracted sub-components.

## Results

| Component          | Original | Files | Max File |
| ------------------ | -------- | ----- | -------- |
| DriverDetailClient | 597      | 5     | 393      |
| RouteDetailClient  | 576      | 5     | 297      |
| AdminDashboard     | 541      | 7     | 215      |
| DriverListTable    | 523      | 4     | 349      |
| RouteListTable     | 501      | 4     | 342      |
| CreateRouteModal   | 486      | 4     | 343      |
| SettingsClient     | 476      | 3     | 298      |
| CoverageRouteMap   | 550      | 4     | 253      |
| OrdersTab          | 568      | 4     | 354      |

## Extraction Patterns Used

- **Modals** -> separate files (EditProfileModal, ArchiveConfirmModal)
- **Mobile card views** -> separate files (DriverMobileCard, RouteMobileCard)
- **Map overlays** -> separate file (MapOverlays)
- **Skeletons** -> separate files (SettingsSkeleton, KPISkeleton, OrderCardSkeleton)
- **Sub-components** -> separate files (KPICard, AnimatedValue, QuickStat, DriverInfoCard, RouteHeader, OrderSelectionList)
- **Types/constants** -> types.ts or types.tsx
- **Map config** -> map-styles.ts

## Decisions Made

1. Extract modals, mobile cards, and map overlays as primary split targets - self-contained visual units with clear prop interfaces
2. Keep types.tsx for JSX-containing type files (VehicleIcon) since it returns JSX
3. Removed unnecessary eslint-disable max-lines directive from RouteDetailClient (now under limit)

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `pnpm typecheck` - passes (zero errors from split files)
- `pnpm lint` - no new warnings (4 pre-existing from other files)
- `pnpm build` - Google Fonts network error (environment issue, not code)
- All 9 original files replaced by subfolder/index.tsx pattern
- No file in any subfolder exceeds 400 lines
- All consumer imports resolve without changes

## Next Phase Readiness

Plans 03-07 can proceed with the same splitting pattern. No blockers.
