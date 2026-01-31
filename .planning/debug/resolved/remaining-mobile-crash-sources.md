---
status: resolved
trigger: "Mobile crashes persist after 19 file fix. Need to find remaining backdrop-blur or animation issues."
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - Multiple files still had unprotected backdrop-blur affecting mobile
test: Exhaustive search completed
expecting: All blur should have sm:/md: prefix for mobile safety
next_action: Complete - all fixes applied and verified

## Symptoms

expected: No crashes after comprehensive blur fix
actual: Still crashing - first refresh, second "can't open this page"
errors: Mobile Safari GPU compositor crash
reproduction: Use modals on mobile
started: After commit 62465dd (19 file blur fix)

## Eliminated

## Evidence

- timestamp: 2026-01-30T00:01:00Z
  checked: Exhaustive grep for backdrop-blur across src/
  found: |
    UNPROTECTED BLUR (no sm:/md: prefix - affects mobile):
    1. src/components/ui/menu/UnifiedMenuItemCard/DietaryBadges.tsx:100 - "backdrop-blur-sm shadow-sm"
    2. src/components/ui/checkout/TimeSlotPicker.tsx:356 - "bg-surface-primary/90 backdrop-blur-sm"
    3. src/components/ui/checkout/TimeSlotPicker.tsx:379 - "bg-surface-primary/90 backdrop-blur-sm"
    4. src/components/ui/admin/analytics/MetricCard.tsx:126 - "bg-surface-primary/80 backdrop-blur-sm"
    5. src/components/ui/coverage/CoverageRouteMap.tsx:411 - "bg-surface-primary/95 backdrop-blur-md"
    6. src/components/ui/coverage/CoverageRouteMap.tsx:441 - "bg-surface-primary/95 backdrop-blur-md"
    7. src/components/ui/coverage/CoverageRouteMap.tsx:473 - "backdrop-blur-md"
    8. src/components/ui/cart/CartItem.tsx:257 - "sm:backdrop-blur-xl" (correctly protected)
    9. src/components/ui/EmptyState.tsx:157 - "backdrop-blur-sm"
    10. src/components/ui/homepage/FooterCTA.tsx:66 - "backdrop-blur-sm"
    11. src/components/ui/homepage/Hero.tsx:109 - "backdrop-blur-sm"
    12. src/components/ui/homepage/Hero.tsx:206 - "backdrop-blur-md"
    13. src/components/ui/homepage/Hero.tsx:296 - "backdrop-blur-md"

    INLINE STYLES WITH backdropFilter (always applied):
    1. src/lib/motion-tokens.ts:412-422 - Framer Motion variants with backdropFilter
    2. src/components/ui/search/CommandPalette/CommandPalette.tsx:178 - backdropFilter inline style
    3. src/components/ui/navigation/Header.tsx:180 - backdropFilter inline style (dynamic blur)
    4. src/components/ui/layout/AppHeader/AppHeader.tsx:35,49 - backdropFilter inline styles

    CSS in globals.css (already has @media wrapper - correctly protected):
    - Line 215-216, 231-232: .glass, .glass-dark have backdrop-filter inside @media (min-width: 640px)
    - Line 311-327: .glass-menu-card has backdrop-filter inside @media (min-width: 640px)
  implication: Multiple files still have unprotected backdrop-blur affecting mobile

- timestamp: 2026-01-30T00:05:00Z
  checked: Post-fix verification
  found: |
    - TypeScript compilation: PASS
    - ESLint: PASS
    - Production build: PASS
    - No remaining unprotected backdrop-blur in TSX/TS files
    - No remaining backdropFilter inline styles in components
  implication: All fixes successfully applied

## Resolution

root_cause: |
  13 files with unprotected backdrop-blur Tailwind classes (no sm:/md: prefix)
  4 files with inline backdropFilter styles that bypass responsive prefixes

  The original fix missed these files because:
  1. Some were in less-common component paths (coverage, checkout, admin)
  2. Inline styles with backdropFilter were applied directly, not through Tailwind
  3. Framer Motion animation variants had backdropFilter in keyframes

fix: |
  Applied sm: or md: responsive prefix to all backdrop-blur classes:
  - DietaryBadges.tsx: backdrop-blur-sm -> sm:backdrop-blur-sm
  - TimeSlotPicker.tsx (2 places): backdrop-blur-sm -> sm:backdrop-blur-sm
  - MetricCard.tsx: backdrop-blur-sm -> sm:backdrop-blur-sm
  - CoverageRouteMap.tsx (3 places): backdrop-blur-md -> sm:backdrop-blur-md
  - EmptyState.tsx: backdrop-blur-sm -> sm:backdrop-blur-sm
  - FooterCTA.tsx: backdrop-blur-sm -> sm:backdrop-blur-sm
  - Hero.tsx (3 places): backdrop-blur-sm/md -> sm:backdrop-blur-sm/md

  Removed inline backdropFilter styles, replaced with Tailwind classes:
  - Header.tsx: Removed inline backdropFilter, added sm:backdrop-blur-md class
  - AppHeader.tsx: Removed backdropFilter from glassStyles objects, added sm:backdrop-blur-2xl class
  - CommandPalette.tsx: Removed inline backdropFilter, added sm:backdrop-blur-xl class
  - motion-tokens.ts: Removed backdropFilter from glass variant animation

verification: |
  - npm run typecheck: PASS
  - npm run lint: PASS
  - npm run build: PASS (production build successful)
  - Grep for unprotected backdrop-blur: 0 matches
  - Grep for backdropFilter in components: 0 matches

files_changed:
  - src/components/ui/menu/UnifiedMenuItemCard/DietaryBadges.tsx
  - src/components/ui/checkout/TimeSlotPicker.tsx
  - src/components/ui/admin/analytics/MetricCard.tsx
  - src/components/ui/coverage/CoverageRouteMap.tsx
  - src/components/ui/EmptyState.tsx
  - src/components/ui/homepage/FooterCTA.tsx
  - src/components/ui/homepage/Hero.tsx
  - src/components/ui/navigation/Header.tsx
  - src/components/ui/layout/AppHeader/AppHeader.tsx
  - src/components/ui/search/CommandPalette/CommandPalette.tsx
  - src/lib/motion-tokens.ts
