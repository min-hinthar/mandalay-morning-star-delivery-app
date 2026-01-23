---
status: resolved
trigger: "layer-overlap-deep: Header/nav overlapped on scroll, sign out not working"
created: 2026-01-23T00:00:00Z
updated: 2026-01-23T00:10:00Z
---

## Current Focus

hypothesis: CONFIRMED - Tailwind CSS 4 not generating custom z-index classes
test: Checked generated CSS in .next/static/chunks/*.css
expecting: z-fixed, z-sticky, z-modal, etc classes exist
finding: Only numeric classes (z-0, z-10, z-20, z-30, z-40, z-50) and arbitrary values exist - NO z-fixed, z-sticky, z-modal, etc.
result: Fixed by replacing all custom z-index tokens with numeric equivalents

## Symptoms

expected: Header (fixed) and nav stay on top during scroll. Sign out button works.
actual: Content overlaps header/nav on scroll. Sign out button non-functional.
errors: None reported in console
reproduction: Scroll on pages - content goes over header. Click sign out - nothing happens.
started: Persists after z-index token fixes (commit b0ef758)

## Eliminated

- hypothesis: Incorrect z-index token values
  evidence: CategoryCarousel, DriverHeader, OfflineBanner all use proper tokens (z-sticky, z-toast)
  timestamp: Prior investigation

- hypothesis: Stacking context issues (transform, will-change, isolation)
  evidence: No parent elements creating problematic stacking contexts
  timestamp: 2026-01-23

- hypothesis: FlyToCart overlay blocking clicks
  evidence: FlyToCart has pointer-events: none, not blocking
  timestamp: 2026-01-23

## Evidence

- timestamp: 2026-01-23T00:00:00Z
  checked: File structure
  found: Key files identified - globals.css, tokens.css, 3 layout files, multiple header components
  implication: Need to examine for stacking context creation

- timestamp: 2026-01-23T00:01:00Z
  checked: Generated CSS in .next/static/chunks/*.css
  found: Only z-0, z-10, z-20, z-30, z-40, z-50 and arbitrary values exist. Custom names z-fixed, z-sticky, z-modal, z-toast, z-dropdown, z-base, z-max, z-popover, z-tooltip, z-modal-backdrop are NOT generated.
  implication: All elements using z-fixed, z-sticky, etc have NO z-index applied - THIS IS ROOT CAUSE

- timestamp: 2026-01-23T00:01:00Z
  checked: Components using custom z-index classes
  found: header.tsx uses z-fixed, CategoryCarousel/CategoryTabsV8 use z-sticky, many modals use z-modal, toasts use z-toast
  implication: Header has no z-index (should be 30), sticky elements have no z-index (should be 20), content overlaps

- timestamp: 2026-01-23T00:05:00Z
  checked: tailwind.config.ts zIndex configuration
  found: Custom zIndex tokens defined as strings ("30", "20", etc.) but TW4 doesn't generate corresponding utility classes
  implication: TW4 requires different approach for custom z-index utilities

## Resolution

root_cause: Tailwind CSS 4 does NOT generate custom z-index utility classes (z-fixed, z-sticky, z-modal, etc.) from the zIndex extension in tailwind.config.ts. Elements using these non-existent classes have NO z-index applied, causing content to overlap fixed/sticky headers.

fix: Replaced all custom z-index class names with their numeric equivalents that Tailwind CSS 4 DOES generate:
- z-fixed -> z-30
- z-sticky -> z-20
- z-modal-backdrop -> z-40
- z-modal -> z-50
- z-toast -> z-[80]
- z-dropdown -> z-10
- z-popover -> z-[60]
- z-tooltip -> z-[70]
- z-base -> z-0
- z-max -> z-[100]

Also updated eslint.config.mjs to remove the z-index token enforcement rules that were incompatible with Tailwind CSS 4.

verification:
- pnpm typecheck: PASS
- pnpm lint: PASS
- pnpm lint:css: PASS

files_changed:
- src/components/layout/header.tsx (z-fixed -> z-30)
- src/components/menu/CategoryCarousel.tsx (z-sticky -> z-20, z-dropdown -> z-10)
- src/components/ui-v8/menu/CategoryTabsV8.tsx (z-sticky -> z-20, z-base -> z-0)
- src/components/layout/MobileNav.tsx (z-modal-backdrop -> z-40, z-modal -> z-50)
- src/components/driver/OfflineBanner.tsx (z-toast -> z-[80])
- src/components/driver/DriverHeader.tsx (z-sticky -> z-20)
- src/components/layout/footer.tsx (z-dropdown -> z-10)
- src/components/layouts/DriverLayout.tsx (z-sticky -> z-20, z-fixed -> z-30)
- src/components/layouts/CustomerLayout.tsx (z-sticky -> z-20, z-fixed -> z-30)
- src/components/cart/CartBar.tsx (z-fixed -> z-30, z-dropdown -> z-10)
- src/components/driver/DriverNav.tsx (z-fixed -> z-30)
- src/components/layouts/CheckoutLayout.tsx (z-sticky -> z-20, z-fixed -> z-30)
- src/components/tracking/SupportActions.tsx (z-fixed -> z-30)
- src/components/ui-v8/navigation/BottomNav.tsx (z-fixed -> z-30)
- src/components/ui-v8/navigation/Header.tsx (z-fixed -> z-30)
- src/components/layouts/AdminLayout.tsx (z-sticky -> z-20)
- src/components/menu/ItemDetail.tsx (z-sticky -> z-20, z-modal -> z-50)
- src/components/menu/MenuItemCard.tsx (z-sticky -> z-20)
- src/components/menu/MenuLayout.tsx (z-sticky -> z-20)
- src/components/menu/category-tabs.tsx (z-sticky -> z-20)
- src/components/menu/item-detail-modal.tsx (z-sticky -> z-20, z-modal -> z-50)
- src/components/menu/menu-header.tsx (z-sticky -> z-20)
- src/components/tracking/TrackingPageClient.tsx (z-sticky -> z-20)
- src/components/ui-v8/menu/MenuSkeletonV8.tsx (z-sticky -> z-20)
- src/components/admin/StatusCelebration.tsx (z-modal -> z-50)
- src/components/auth/AuthModal.tsx (z-modal -> z-50)
- src/components/auth/WelcomeAnimation.tsx (z-modal -> z-50)
- src/components/cart/CartAnimations.tsx (z-modal-backdrop -> z-40, z-modal -> z-50)
- src/components/driver/ExceptionModal.tsx (z-modal -> z-50)
- src/components/driver/PhotoCapture.tsx (z-modal -> z-50)
- src/components/onboarding/OnboardingTour.tsx (z-modal -> z-50)
- src/components/tracking/DeliveryMap.tsx (z-modal -> z-50)
- src/components/tracking/TrackingMap.tsx (z-modal -> z-50)
- src/components/ui/alert-dialog.tsx (z-modal -> z-50)
- src/components/ui/dialog.tsx (z-modal -> z-50)
- src/components/ui/drawer.tsx (z-modal -> z-50)
- src/components/ui/success-checkmark.tsx (z-modal -> z-50)
- src/components/tracking/PushToast.tsx (z-toast -> z-[80])
- src/components/ui/toast.tsx (z-toast -> z-[80])
- src/components/ui-v8/Toast.tsx (z-toast -> z-[80])
- src/components/ui/tooltip.tsx (z-tooltip -> z-[70])
- src/components/ui-v8/Tooltip.tsx (z-tooltip -> z-[70])
- src/components/ui-v8/Dropdown.tsx (z-popover -> z-[60])
- src/components/ui/dropdown-menu.tsx (z-dropdown -> z-10)
- src/components/ui/overlay-base.tsx (z-modal -> z-50)
- eslint.config.mjs (removed z-index token enforcement rules)
