---
phase: 46
plan: 01
subsystem: ui-components
tags: [refactoring, file-splitting, subfolder-pattern, barrel-exports]

dependency-graph:
  requires: []
  provides:
    - "10 leaf components split into subfolder pattern"
    - "All split files under 400 lines"
    - "Barrel index.tsx preserves import paths"
  affects:
    - "46-02 through 46-07 (same pattern for remaining files)"

tech-stack:
  added: []
  patterns:
    - "Subfolder pattern: ComponentName/index.tsx + split files"
    - "Barrel re-export via index.tsx for backward-compatible imports"
    - "'use client' directive on every extracted file using hooks/events/browser APIs"

key-files:
  created:
    - "src/components/ui/admin/orders/OrderDetailExpanded/index.tsx"
    - "src/components/ui/admin/orders/OrderDetailExpanded/types.ts"
    - "src/components/ui/admin/orders/OrderDetailExpanded/config.ts"
    - "src/components/ui/admin/orders/OrderDetailExpanded/CancelModal.tsx"
    - "src/components/ui/admin/orders/OrderDetailExpanded/RefundModal.tsx"
    - "src/components/ui/admin/orders/OrderDetailExpanded/OrderItemsSection.tsx"
    - "src/components/ui/admin/orders/OrderDetailExpanded/AuditLogSection.tsx"
    - "src/components/ui/admin/orders/OrderDetailExpanded/OrderDetailExpanded.tsx"
    - "src/components/ui/homepage/HowItWorksSection/index.tsx"
    - "src/components/ui/homepage/HowItWorksSection/variants.ts"
    - "src/components/ui/homepage/HowItWorksSection/StepIcon.tsx"
    - "src/components/ui/homepage/HowItWorksSection/Connector.tsx"
    - "src/components/ui/homepage/HowItWorksSection/InteractiveCoverageChecker.tsx"
    - "src/components/ui/homepage/HowItWorksSection/CoverageResult.tsx"
    - "src/components/ui/homepage/HowItWorksSection/GlassCard.tsx"
    - "src/components/ui/homepage/HowItWorksSection/StepCard.tsx"
    - "src/components/ui/homepage/HowItWorksSection/HowItWorksSection.tsx"
    - "src/components/ui/account/AddressesTab/index.tsx"
    - "src/components/ui/account/AddressesTab/types.ts"
    - "src/components/ui/account/AddressesTab/AddressCardSkeleton.tsx"
    - "src/components/ui/account/AddressesTab/AddressFormDialog.tsx"
    - "src/components/ui/account/AddressesTab/DeleteAddressDialog.tsx"
    - "src/components/ui/account/AddressesTab/AddressesTab.tsx"
    - "src/components/ui/brand/BrandMascot/index.tsx"
    - "src/components/ui/brand/BrandMascot/types.ts"
    - "src/components/ui/brand/BrandMascot/Eyes.tsx"
    - "src/components/ui/brand/BrandMascot/Mouth.tsx"
    - "src/components/ui/brand/BrandMascot/Accessories.tsx"
    - "src/components/ui/brand/BrandMascot/BrandMascot.tsx"
    - "src/components/ui/driver/DriverDashboard/index.tsx"
    - "src/components/ui/driver/DriverDashboard/types.ts"
    - "src/components/ui/driver/DriverDashboard/StatCard.tsx"
    - "src/components/ui/driver/DriverDashboard/StreakDisplay.tsx"
    - "src/components/ui/driver/DriverDashboard/RouteCard.tsx"
    - "src/components/ui/driver/DriverDashboard/BadgesDisplay.tsx"
    - "src/components/ui/driver/DriverDashboard/DriverDashboard.tsx"
    - "src/components/ui/admin/drivers/PendingInvitesTab/index.tsx"
    - "src/components/ui/admin/drivers/PendingInvitesTab/types.ts"
    - "src/components/ui/admin/drivers/PendingInvitesTab/InviteDesktopTable.tsx"
    - "src/components/ui/admin/drivers/PendingInvitesTab/InviteDialogs.tsx"
    - "src/components/ui/admin/drivers/PendingInvitesTab/PendingInvitesTab.tsx"
    - "src/components/ui/checkout/PaymentSuccess/index.tsx"
    - "src/components/ui/checkout/PaymentSuccess/ConfettiParticle.tsx"
    - "src/components/ui/checkout/PaymentSuccess/AnimatedCheckmark.tsx"
    - "src/components/ui/checkout/PaymentSuccess/TimelineStep.tsx"
    - "src/components/ui/checkout/PaymentSuccess/PaymentSuccess.tsx"
    - "src/components/ui/account/ProfileTab/index.tsx"
    - "src/components/ui/account/ProfileTab/types.ts"
    - "src/components/ui/account/ProfileTab/ProfileSkeleton.tsx"
    - "src/components/ui/account/ProfileTab/ProfileTab.tsx"
    - "src/components/ui/MorphingMenu/index.tsx"
    - "src/components/ui/MorphingMenu/createVariants.ts"
    - "src/components/ui/MorphingMenu/MorphingMenu.tsx"
    - "src/components/ui/MorphingMenu/MorphingMenuWithLabel.tsx"
    - "src/components/ui/MorphingMenu/MorphingCloseButton.tsx"
    - "src/components/ui/cart/CartItem/index.tsx"
    - "src/components/ui/cart/CartItem/helpers.ts"
    - "src/components/ui/cart/CartItem/SwipeDeleteIndicator.tsx"
    - "src/components/ui/cart/CartItem/CartItem.tsx"
  modified: []
  deleted:
    - "src/components/ui/admin/orders/OrderDetailExpanded.tsx"
    - "src/components/ui/homepage/HowItWorksSection.tsx"
    - "src/components/ui/account/AddressesTab.tsx"
    - "src/components/ui/brand/BrandMascot.tsx"
    - "src/components/ui/driver/DriverDashboard.tsx"
    - "src/components/ui/admin/drivers/PendingInvitesTab.tsx"
    - "src/components/ui/checkout/PaymentSuccess.tsx"
    - "src/components/ui/account/ProfileTab.tsx"
    - "src/components/ui/MorphingMenu.tsx"
    - "src/components/ui/cart/CartItem.tsx"

decisions:
  - id: subfolder-pattern
    choice: "Component/index.tsx barrel with named sub-files"
    rationale: "Preserves import paths for consumers; matches UnifiedMenuItemCard reference"
  - id: extraction-strategy
    choice: "Extract sub-components, types, config, helpers into separate files"
    rationale: "Natural code boundaries; each file has single responsibility"
  - id: use-client-propagation
    choice: "Every extracted file using hooks/events/browser APIs gets 'use client'"
    rationale: "Required by Next.js App Router; prevents runtime errors"

metrics:
  duration: "~15 minutes"
  completed: "2026-02-06"
---

# Phase 46 Plan 01: Split 10 Leaf Components Summary

Split 10 leaf UI components (0-2 importers each) from monolithic files into subfolder pattern with barrel index files, reducing all files below the 400-line threshold.

## Results

| Component | Original | Files | Max Lines | Importers |
|-----------|----------|-------|-----------|-----------|
| OrderDetailExpanded | 984 | 8 | 396 | 1 |
| HowItWorksSection | 876 | 9 | 272 | 1 |
| AddressesTab | 802 | 6 | 242 | 1 |
| BrandMascot | 635 | 6 | 215 | 1 |
| DriverDashboard | 585 | 7 | 153 | 2 |
| PendingInvitesTab | 524 | 5 | 187 | 1 |
| PaymentSuccess | 511 | 5 | 183 | 1 |
| ProfileTab | 431 | 4 | 187 | 1 |
| MorphingMenu | 425 | 5 | 150 | 1 |
| CartItem | 401 | 4 | 174 | 1 |

**Total:** 10 monolithic files replaced by 59 focused files across 10 subfolders.

## Extraction Patterns Used

- **Types/interfaces** -> `types.ts`
- **Config constants/maps** -> `config.ts` or `variants.ts`
- **Sub-components** -> `PascalCase.tsx` (with `'use client'`)
- **Hooks** -> `camelCase.ts`
- **Helper functions** -> `helpers.ts`
- **Main component** -> `ComponentName.tsx` (orchestrator)
- **Barrel export** -> `index.tsx`

## Verification

- `pnpm typecheck`: Zero errors
- `pnpm lint`: Zero new errors (4 pre-existing warnings from other files)
- `pnpm build`: Google Fonts network error in sandbox only (not code-related)
- All 10 barrel index files resolve consumer imports without changes

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Description |
|------|-------------|
| `0acfddd` | Split 5 largest leaf components (OrderDetailExpanded, HowItWorksSection, AddressesTab, BrandMascot, DriverDashboard) |
| `d0ae117` | Split 5 smaller leaf components (PendingInvitesTab, PaymentSuccess, ProfileTab, MorphingMenu, CartItem) |

## Next Phase Readiness

Plan 46-02 through 46-07 can proceed with the same subfolder pattern on remaining files. The reference pattern is now well-established across 10 components.
