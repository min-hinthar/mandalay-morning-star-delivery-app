# Dead Code Analysis Report

**Generated:** 2026-01-23
**Tool:** knip v5.82.1

## Summary

| Category | Total Identified | Status |
|----------|-----------------|--------|
| Unused Files | 47 | Files with no references |
| Unused Dependencies | 3 | Can be removed from package.json |
| Unused Dev Dependencies | 5 | Can be removed from package.json |
| Unused Exports | 480 | Exports not imported elsewhere |
| Unused Types | 284 | Type definitions not used |

## Unused Files (No References)

These files are not imported or referenced anywhere in the codebase:

| File | Category |
|------|----------|
| src/contexts/HeaderContext.tsx | Context |
| src/contexts/index.ts | Context |
| src/hooks/use-cart.ts | Hook |
| src/stores/cart-store.ts | Store |
| src/lib/ab-testing.ts | Utility |
| src/lib/dynamic-imports.tsx | Utility |
| src/lib/feature-flags.ts | Utility |
| src/types/api.ts | Type |
| src/components/admin/KPICard.tsx | Component |
| src/components/admin/OperationsKPICard.tsx | Component |
| src/components/cart/AddToCart.tsx | Component |
| src/components/cart/CartDrawer.tsx | Component |
| src/components/cart/CartItem.tsx | Component |
| src/components/cart/CartSummary.tsx | Component |
| src/components/cart/CartSummaryCompact.tsx | Component |
| src/components/cart/CartSummarySkeleton.tsx | Component |
| src/components/cart/cart-item.tsx | Component |
| src/components/cart/v7-index.ts | Component |
| src/components/checkout/CheckoutStepper.tsx | Component |
| src/components/checkout/UpsellSection.tsx | Component |
| src/components/checkout/v7-index.ts | Component |
| src/components/driver/DriverHomeContent.tsx | Component |
| src/components/driver/RouteCard.tsx | Component |
| src/components/layout/mobile-menu.tsx | Component |
| src/components/layout/mobile-nav.tsx | Component |
| src/components/homepage/HomepageHero.tsx | Component |
| src/components/homepage/HowItWorksTimeline.tsx | Component |
| src/components/homepage/TestimonialsSection.tsx | Component |
| src/design-system/tokens/colors.ts | Other |
| src/components/ui/Carousel.tsx | Component |
| src/components/ui/ExpandingCard.tsx | Component |
| src/components/ui/FlipCard.tsx | Component |
| src/components/ui/Toggle.tsx | Component |
| src/components/ui/form-field.tsx | Component |
| src/components/ui/scroll-reveal.tsx | Component |
| src/components/ui/v7-index.ts | Component |
| src/lib/animations/tabs.ts | Utility |
| src/lib/hooks/useExperiment.tsx | Hook |
| src/lib/hooks/useFeatureFlag.tsx | Hook |
| src/lib/hooks/useFrameRate.ts | Hook |
| src/lib/sound/audio-manager.ts | Utility |
| src/lib/stripe/client.ts | Utility |
| src/lib/supabase/middleware.ts | Utility |
| src/lib/utils/constants.ts | Utility |
| src/lib/webgl/index.ts | Utility |
| src/test/mocks/index.ts | Test |
| src/test/mocks/supabase.ts | Test |

## Unused Dependencies

These dependencies in `package.json` are not being used:

### dependencies

- `@conform-to/react` (line 34)
- `@conform-to/zod` (line 35)
- `@stripe/stripe-js` (line 49)

### devDependencies

- `@vitest/coverage-v8` (line 94)
- `eslint-config-next` (line 96)
- `eslint-config-prettier` (line 97)
- `husky` (line 99)
- `lint-staged` (line 102)

## Unused Exports by File

Exports that are defined but never imported elsewhere. Reference Count = 0 indicates no usages found.

### src/components/homepage

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/homepage/HomepageMenuSection.tsx | `default` | 314 | 0 |
| src/components/homepage/CoverageSection.tsx | `CoverageSection` | 342 | 0 |
| src/components/homepage/CoverageSection.tsx | `default` | 645 | 0 |
| src/components/homepage/FloatingFood.tsx | `default` | 361 | 0 |
| src/components/homepage/FooterCTA.tsx | `default` | 186 | 0 |
| src/components/homepage/Hero.tsx | `Hero` | 135 | 0 |
| src/components/homepage/Hero.tsx | `default` | 450 | 0 |
| src/components/homepage/v7-index.ts | `HeroV7` | 10 | 0 |
| src/components/homepage/v7-index.ts | `FloatingFood` | 17 | 0 |
| src/components/homepage/v7-index.ts | `defaultFoodItems` | 18 | 0 |
| src/components/homepage/v7-index.ts | `TimelineV7` | 29 | 0 |
| src/components/homepage/v7-index.ts | `CoverageSectionV7` | 41 | 0 |
| src/components/homepage/Timeline.tsx | `Timeline` | 262 | 0 |
| src/components/homepage/Timeline.tsx | `default` | 422 | 0 |

### src/components/cart

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/cart/CartAnimations.tsx | `addToCartVariants` | 48 | 0 |
| src/components/cart/CartAnimations.tsx | `cartItemRemoveVariants` | 81 | 0 |
| src/components/cart/CartAnimations.tsx | `cartDrawerVariants` | 103 | 0 |
| src/components/cart/CartAnimations.tsx | `quantityFlipVariants` | 131 | 0 |
| src/components/cart/CartAnimations.tsx | `badgeBounceVariants` | 155 | 0 |
| src/components/cart/CartAnimations.tsx | `flyToCartVariants` | 174 | 0 |
| src/components/cart/CartAnimations.tsx | `useFlyToCart` | 755 | 0 |

### src/components/ui

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/ui/FormValidation.tsx | `useFormValidationOptional` | 876 | 0 |
| src/components/ui/FormValidation.tsx | `InlineError` | 1011 | 0 |
| src/components/ui/FormValidation.tsx | `combineRules` | 1027 | 0 |
| src/components/ui/skeleton.tsx | `default` | 472 | 0 |
| src/components/ui/overlay-base.tsx | `default` | 500 | 0 |
| src/components/ui/DropdownAction.tsx | `default` | 124 | 0 |
| src/components/ui/toast.tsx | `toastVariants` | 221 | 0 |
| src/components/ui/ErrorBanner.tsx | `OfflineBanner` | 194 | 0 |
| src/components/ui/SkipLink.tsx | `SkipLinks` | 103 | 0 |
| src/components/ui/SkipLink.tsx | `MainContent` | 139 | 0 |
| src/components/ui/SkipLink.tsx | `useFocusOnNavigation` | 163 | 0 |
| src/components/ui/SkipLink.tsx | `VisuallyHidden` | 178 | 0 |
| src/components/ui/SkipLink.tsx | `LiveRegion` | 200 | 0 |
| src/components/ui/Confetti.tsx | `SuccessAnimation` | 262 | 0 |
| src/components/ui/PriceTicker.tsx | `PriceChangeBadge` | 258 | 0 |
| src/components/ui/PriceTicker.tsx | `CounterTicker` | 328 | 0 |
| src/components/ui/PriceTicker.tsx | `default` | 385 | 0 |
| src/components/ui/AnimatedLink.tsx | `AnimatedLink` | 71 | 0 |
| src/components/ui/AnimatedLink.tsx | `NavLink` | 241 | 0 |
| src/components/ui/AnimatedLink.tsx | `BreadcrumbLink` | 334 | 0 |
| src/components/ui/AnimatedLink.tsx | `default` | 362 | 0 |
| src/components/ui/MorphingMenu.tsx | `MorphingMenuWithLabel` | 251 | 0 |
| src/components/ui/MorphingMenu.tsx | `MorphingCloseButton` | 326 | 0 |
| src/components/ui/MorphingMenu.tsx | `default` | 425 | 0 |
| src/components/ui/success-checkmark.tsx | `SuccessOverlay` | 205 | 0 |
| src/components/ui/success-checkmark.tsx | `default` | 271 | 0 |

### src/lib/utils

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/lib/utils/currency.ts | `parsePriceToCents` | 10 | 0 |
| src/lib/utils/delivery-dates.ts | `canEditOrder` | 208 | 0 |
| src/lib/utils/format.ts | `formatPriceValue` | 8 | 0 |
| src/lib/utils/format.ts | `formatDate` | 12 | 0 |
| src/lib/utils/rate-limit.ts | `cleanupExpiredEntries` | 74 | 0 |
| src/lib/utils/image-optimization.ts | `IMAGE_SIZES` | 15 | 0 |
| src/lib/utils/image-optimization.ts | `getAspectRatioPadding` | 92 | 0 |
| src/lib/utils/image-optimization.ts | `ASPECT_RATIOS` | 99 | 0 |
| src/lib/utils/image-optimization.ts | `shouldPriorityLoad` | 110 | 0 |
| src/lib/utils/image-optimization.ts | `generateSrcSet` | 117 | 0 |

### src/components/admin

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/admin/v7-index.ts | `AdminDashboardV7` | 9 | 0 |
| src/components/admin/v7-index.ts | `Charts` | 12 | 0 |
| src/components/admin/v7-index.ts | `ChartsV7` | 12 | 0 |
| src/components/admin/v7-index.ts | `Sparkline` | 12 | 0 |
| src/components/admin/v7-index.ts | `SparklineV7` | 12 | 0 |
| src/components/admin/v7-index.ts | `OrderManagement` | 21 | 0 |
| src/components/admin/v7-index.ts | `OrderManagementV7` | 21 | 0 |
| src/components/admin/v7-index.ts | `RouteOptimization` | 29 | 0 |
| src/components/admin/v7-index.ts | `RouteOptimizationV7` | 29 | 0 |
| src/components/admin/v7-index.ts | `StatusCelebration` | 40 | 0 |
| src/components/admin/v7-index.ts | `InlineCelebrationV7` | 41 | 0 |
| src/components/admin/v7-index.ts | `InlineCelebration` | 42 | 0 |
| src/components/admin/v7-index.ts | `useCelebration` | 43 | 0 |
| src/components/admin/AdminDashboard.tsx | `AdminDashboard` | 390 | 0 |
| src/components/admin/AdminDashboard.tsx | `default` | 532 | 0 |
| src/components/admin/OrderManagement.tsx | `OrderManagement` | 608 | 0 |
| src/components/admin/OrderManagement.tsx | `default` | 725 | 0 |
| src/components/admin/RouteOptimization.tsx | `RouteOptimization` | 534 | 0 |
| src/components/admin/RouteOptimization.tsx | `default` | 732 | 0 |
| src/components/admin/StatusCelebration.tsx | `StatusCelebration` | 291 | 0 |
| src/components/admin/StatusCelebration.tsx | `InlineCelebrationV7` | 435 | 0 |
| src/components/admin/StatusCelebration.tsx | `useCelebration` | 514 | 0 |
| src/components/admin/StatusCelebration.tsx | `default` | 540 | 0 |
| src/components/admin/analytics/Charts.tsx | `Charts` | 280 | 0 |
| src/components/admin/analytics/Charts.tsx | `Sparkline` | 539 | 0 |
| src/components/admin/analytics/Charts.tsx | `default` | 597 | 0 |

### src/lib/hooks

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/lib/hooks/useAnimationPreference.ts | `shouldAnimate` | 203 | 0 |
| src/lib/hooks/useAnimationPreference.ts | `isFullMotion` | 210 | 0 |
| src/lib/hooks/useAnimationPreference.ts | `motionDataAttribute` | 222 | 0 |
| src/lib/hooks/useAnimationPreference.ts | `motionSelectors` | 227 | 0 |
| src/lib/hooks/useToastV8.ts | `toast` | 123 | 0 |
| src/lib/hooks/useAddresses.ts | `useAddress` | 26 | 0 |
| src/lib/hooks/useAddresses.ts | `useSetDefaultAddress` | 111 | 0 |
| src/lib/hooks/index.ts | `useIsMobile` | 11 | 0 |
| src/lib/hooks/index.ts | `useIsTablet` | 12 | 0 |
| src/lib/hooks/index.ts | `useIsDesktop` | 13 | 0 |
| src/lib/hooks/index.ts | `useBreakpoint` | 14 | 0 |
| src/lib/hooks/index.ts | `useBreakpointDown` | 15 | 0 |
| src/lib/hooks/index.ts | `useBreakpointBetween` | 16 | 0 |
| src/lib/hooks/index.ts | `useCurrentBreakpoint` | 17 | 0 |
| src/lib/hooks/index.ts | `useIsTouchDevice` | 18 | 0 |
| src/lib/hooks/index.ts | `useCanHover` | 19 | 0 |
| src/lib/hooks/index.ts | `breakpoints` | 20 | 0 |
| src/lib/hooks/index.ts | `useAnimationPreference` | 29 | 0 |
| src/lib/hooks/index.ts | `useReducedMotion` | 31 | 0 |
| src/lib/hooks/index.ts | `useSystemReducedMotion` | 32 | 0 |
| src/lib/hooks/index.ts | `useMotionVariants` | 33 | 0 |
| src/lib/hooks/index.ts | `useMotionTransition` | 34 | 0 |
| src/lib/hooks/index.ts | `useLuminance` | 41 | 0 |
| src/lib/hooks/index.ts | `useScrollDirection` | 42 | 0 |
| src/lib/hooks/index.ts | `useActiveCategory` | 43 | 0 |
| src/lib/hooks/index.ts | `useScrollSpy` | 44 | 0 |
| src/lib/hooks/index.ts | `useDebounce` | 45 | 0 |
| src/lib/hooks/index.ts | `useCart` | 51 | 0 |
| src/lib/hooks/index.ts | `useCartDrawer` | 52 | 0 |
| src/lib/hooks/index.ts | `useMenu` | 58 | 0 |
| src/lib/hooks/index.ts | `useAddresses` | 59 | 0 |
| src/lib/hooks/index.ts | `useTimeSlot` | 60 | 0 |
| src/lib/hooks/index.ts | `useCoverageCheck` | 61 | 0 |
| src/lib/hooks/index.ts | `useAuth` | 67 | 0 |
| src/lib/hooks/index.ts | `useLocationTracking` | 73 | 0 |
| src/lib/hooks/index.ts | `useTrackingSubscription` | 74 | 0 |
| src/lib/hooks/index.ts | `useOfflineSync` | 80 | 0 |
| src/lib/hooks/index.ts | `useServiceWorker` | 81 | 0 |
| src/lib/hooks/index.ts | `useToast` | 87 | 0 |
| src/lib/hooks/index.ts | `toast` | 87 | 0 |
| src/lib/hooks/index.ts | `useToastV8` | 88 | 0 |
| src/lib/hooks/index.ts | `toastV8` | 88 | 0 |
| src/lib/hooks/index.ts | `useABTest` | 95 | 0 |
| src/lib/hooks/useScrollDirection.ts | `default` | 131 | 0 |
| src/lib/hooks/useFavorites.ts | `useFavoritesStore` | 12 | 0 |
| src/lib/hooks/useReducedMotion.ts | `useSystemReducedMotion` | 42 | 0 |
| src/lib/hooks/useReducedMotion.ts | `useMotionVariants` | 54 | 0 |
| src/lib/hooks/useReducedMotion.ts | `useMotionTransition` | 120 | 0 |
| src/lib/hooks/useResponsive.ts | `breakpoints` | 18 | 0 |
| src/lib/hooks/useResponsive.ts | `useIsMobile` | 32 | 0 |
| src/lib/hooks/useResponsive.ts | `useIsTablet` | 40 | 0 |
| src/lib/hooks/useResponsive.ts | `useIsDesktop` | 50 | 0 |
| src/lib/hooks/useResponsive.ts | `useBreakpoint` | 58 | 0 |
| src/lib/hooks/useResponsive.ts | `useBreakpointDown` | 66 | 0 |
| src/lib/hooks/useResponsive.ts | `useBreakpointBetween` | 75 | 0 |
| src/lib/hooks/useResponsive.ts | `useCurrentBreakpoint` | 88 | 0 |
| src/lib/hooks/useResponsive.ts | `useIsTouchDevice` | 107 | 0 |
| src/lib/hooks/useResponsive.ts | `useCanHover` | 115 | 0 |
| src/lib/hooks/useLuminance.ts | `getTextColorForBackground` | 158 | 0 |
| src/lib/hooks/useLuminance.ts | `getTextColorForGradient` | 169 | 0 |
| src/lib/hooks/useLuminance.ts | `useLuminance` | 177 | 0 |
| src/lib/hooks/useLuminance.ts | `useGradientLuminance` | 184 | 0 |
| src/lib/hooks/useLuminance.ts | `useDynamicLuminance` | 197 | 0 |
| src/lib/hooks/useLuminance.ts | `getContrastTextClasses` | 250 | 0 |
| src/lib/hooks/useLuminance.ts | `default` | 278 | 0 |
| src/lib/hooks/useActiveCategory.ts | `default` | 191 | 0 |
| src/lib/hooks/useScrollSpy.ts | `useScrollSpy` | 7 | 0 |
| src/lib/hooks/useABTest.ts | `useABTest` | 54 | 0 |
| src/lib/hooks/useABTest.ts | `getStoredVariant` | 154 | 0 |
| src/lib/hooks/useABTest.ts | `clearAllABTests` | 170 | 0 |
| src/lib/hooks/useABTest.ts | `listABTestAssignments` | 184 | 0 |
| src/lib/hooks/useABTest.ts | `HERO_VARIANTS` | 205 | 0 |
| src/lib/hooks/useABTest.ts | `useHeroABTest` | 214 | 0 |

### src/lib/motion-tokens.ts

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/lib/motion-tokens.ts | `tap` | 295 | 0 |
| src/lib/motion-tokens.ts | `overlay` | 325 | 0 |
| src/lib/motion-tokens.ts | `flipCard` | 384 | 0 |
| src/lib/motion-tokens.ts | `expandingCard` | 417 | 0 |
| src/lib/motion-tokens.ts | `staggerItemRotate` | 482 | 0 |
| src/lib/motion-tokens.ts | `staggerDelay` | 491 | 0 |
| src/lib/motion-tokens.ts | `scrollReveal` | 503 | 0 |
| src/lib/motion-tokens.ts | `parallaxLayer` | 541 | 0 |
| src/lib/motion-tokens.ts | `float` | 624 | 0 |
| src/lib/motion-tokens.ts | `floatGentle` | 640 | 0 |
| src/lib/motion-tokens.ts | `morph` | 660 | 0 |
| src/lib/motion-tokens.ts | `priceTicker` | 682 | 0 |
| src/lib/motion-tokens.ts | `viewport` | 728 | 0 |

### src/components/driver

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/driver/v7-index.ts | `DriverDashboardV7` | 8 | 0 |
| src/components/driver/v7-index.ts | `Leaderboard` | 11 | 0 |
| src/components/driver/v7-index.ts | `LeaderboardV7` | 11 | 0 |
| src/components/driver/v7-index.ts | `DeliverySuccess` | 14 | 0 |
| src/components/driver/v7-index.ts | `DeliverySuccessV7` | 14 | 0 |
| src/components/driver/DeliverySuccess.tsx | `DeliverySuccess` | 267 | 0 |
| src/components/driver/DeliverySuccess.tsx | `default` | 516 | 0 |
| src/components/driver/DriverDashboard.tsx | `DriverDashboard` | 467 | 0 |
| src/components/driver/DriverDashboard.tsx | `default` | 585 | 0 |
| src/components/driver/Leaderboard.tsx | `Leaderboard` | 329 | 0 |
| src/components/driver/Leaderboard.tsx | `default` | 433 | 0 |

### src/lib/services

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/lib/services/geocoding.ts | `reverseGeocode` | 83 | 0 |
| src/lib/services/offline-store.ts | `routeCache` | 180 | 0 |

### src/test/mocks

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/test/mocks/google-routes.ts | `createGoogleRoutesFetchMock` | 102 | 0 |
| src/test/mocks/stripe.ts | `mockCheckoutSessionResponse` | 11 | 0 |
| src/test/mocks/stripe.ts | `createMockStripeClient` | 21 | 0 |

### src/types/cart.ts

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/types/cart.ts | `getDeliveryFeeMessage` | 40 | 0 |

### src/lib/validations

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/lib/validations/analytics.ts | `deliveryExceptionTypeSchema` | 29 | 0 |
| src/lib/validations/analytics.ts | `driverStatsSchema` | 159 | 0 |
| src/lib/validations/analytics.ts | `deliveryMetricsSchema` | 193 | 0 |
| src/lib/validations/driver-api.ts | `getNextStopStatus` | 70 | 0 |
| src/lib/validations/driver.ts | `vehicleTypeSchema` | 4 | 0 |
| src/lib/validations/route.ts | `routeStatusSchema` | 4 | 0 |
| src/lib/validations/route.ts | `routeStopStatusSchema` | 7 | 0 |
| src/lib/validations/tracking.ts | `orderStatusSchema` | 12 | 0 |
| src/lib/validations/tracking.ts | `routeStopStatusSchema` | 25 | 0 |
| src/lib/validations/tracking.ts | `vehicleTypeSchema` | 37 | 0 |
| src/lib/validations/tracking.ts | `trackingAddressSchema` | 49 | 0 |
| src/lib/validations/tracking.ts | `trackingOrderItemSchema` | 63 | 0 |
| src/lib/validations/tracking.ts | `trackingDriverInfoSchema` | 109 | 0 |
| src/lib/validations/tracking.ts | `trackingApiResponseSchema` | 158 | 0 |
| src/lib/validations/tracking.ts | `realtimeOrderUpdateSchema` | 166 | 0 |
| src/lib/validations/tracking.ts | `realtimeRouteStopUpdateSchema` | 173 | 0 |
| src/lib/validations/tracking.ts | `realtimeLocationUpdateSchema` | 183 | 0 |

### src/types/delivery.ts

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/types/delivery.ts | `CUTOFF_DAY` | 32 | 0 |

### src/test/factories

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/test/factories/index.ts | `createMockAddress` | 59 | 0 |
| src/test/factories/index.ts | `createMockOrder` | 85 | 0 |
| src/test/factories/index.ts | `createCheckoutItemInput` | 136 | 0 |

### src/components/auth

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/auth/AuthModal.tsx | `default` | 434 | 0 |
| src/components/auth/MagicLinkSent.tsx | `default` | 419 | 0 |
| src/components/auth/WelcomeAnimation.tsx | `default` | 455 | 0 |

### src/components/checkout

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/checkout/CheckoutSummaryV8.tsx | `default` | 295 | 0 |
| src/components/checkout/PaymentStepV8.tsx | `default` | 343 | 0 |
| src/components/checkout/CheckoutWizard.tsx | `CheckoutSummary` | 502 | 0 |
| src/components/checkout/CheckoutWizard.tsx | `default` | 526 | 0 |
| src/components/checkout/AddressInput.tsx | `default` | 663 | 0 |
| src/components/checkout/TimeSlotPicker.tsx | `default` | 447 | 0 |
| src/components/checkout/PaymentSuccess.tsx | `default` | 496 | 0 |
| src/components/checkout/TimeSlotPickerLegacy.tsx | `default` | 99 | 0 |

### src/components/mascot

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/mascot/BrandMascot.tsx | `default` | 607 | 0 |

### src/components/layouts

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/layouts/CustomerLayout.tsx | `default` | 222 | 0 |
| src/components/layouts/CheckoutLayout.tsx | `default` | 278 | 0 |
| src/components/layouts/DriverLayout.tsx | `default` | 305 | 0 |
| src/components/layouts/AdminLayout.tsx | `default` | 314 | 0 |
| src/components/layouts/PageTransition.tsx | `default` | 526 | 0 |
| src/components/layouts/v7-index.ts | `PageTransition` | 11 | 0 |
| src/components/layouts/v7-index.ts | `PageTransitionV7` | 12 | 0 |
| src/components/layouts/v7-index.ts | `FadeTransition` | 13 | 0 |
| src/components/layouts/v7-index.ts | `FadeTransitionV7` | 14 | 0 |
| src/components/layouts/v7-index.ts | `SlideTransition` | 15 | 0 |
| src/components/layouts/v7-index.ts | `SlideTransitionV7` | 16 | 0 |
| src/components/layouts/v7-index.ts | `ScaleTransition` | 17 | 0 |
| src/components/layouts/v7-index.ts | `ScaleTransitionV7` | 18 | 0 |
| src/components/layouts/v7-index.ts | `MorphBlurTransition` | 19 | 0 |
| src/components/layouts/v7-index.ts | `MorphBlurTransitionV7` | 20 | 0 |
| src/components/layouts/v7-index.ts | `StaggerChild` | 21 | 0 |
| src/components/layouts/v7-index.ts | `ParallaxImage` | 44 | 0 |
| src/components/layouts/v7-index.ts | `ParallaxText` | 45 | 0 |
| src/components/layouts/v7-index.ts | `SimpleParallax` | 47 | 0 |
| src/components/layouts/v7-index.ts | `ScrollOpacity` | 48 | 0 |
| src/components/layouts/v7-index.ts | `ScrollScale` | 49 | 0 |
| src/components/layouts/ParallaxContainer.tsx | `ParallaxImage` | 239 | 0 |
| src/components/layouts/ParallaxContainer.tsx | `ParallaxText` | 292 | 0 |
| src/components/layouts/ParallaxContainer.tsx | `SimpleParallax` | 370 | 0 |
| src/components/layouts/ParallaxContainer.tsx | `ScrollOpacity` | 435 | 0 |
| src/components/layouts/ParallaxContainer.tsx | `ScrollScale` | 484 | 0 |
| src/components/layouts/ParallaxContainer.tsx | `default` | 512 | 0 |

### src/components/onboarding

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/onboarding/OnboardingTour.tsx | `default` | 445 | 0 |

### src/components/tracking

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/tracking/StatusTimeline.tsx | `default` | 407 | 0 |
| src/components/tracking/ETACountdown.tsx | `ETACountdown` | 185 | 0 |
| src/components/tracking/ETACountdown.tsx | `ETACountdownCompact` | 338 | 0 |
| src/components/tracking/ETACountdown.tsx | `default` | 370 | 0 |
| src/components/tracking/PushToast.tsx | `useToast` | 57 | 0 |
| src/components/tracking/PushToast.tsx | `ToastProvider` | 307 | 0 |
| src/components/tracking/PushToast.tsx | `createOrderUpdateToast` | 341 | 0 |
| src/components/tracking/PushToast.tsx | `PushToast` | 383 | 0 |
| src/components/tracking/PushToast.tsx | `default` | 409 | 0 |
| src/components/tracking/TrackingMap.tsx | `TrackingMap` | 405 | 0 |
| src/components/tracking/TrackingMap.tsx | `default` | 583 | 0 |
| src/components/tracking/v7-index.ts | `TrackingMap` | 8 | 0 |
| src/components/tracking/v7-index.ts | `TrackingMapV7` | 8 | 0 |
| src/components/tracking/v7-index.ts | `StatusTimelineV7` | 11 | 0 |
| src/components/tracking/v7-index.ts | `ETACountdownV7` | 14 | 0 |
| src/components/tracking/v7-index.ts | `ETACountdownCompact` | 14 | 0 |
| src/components/tracking/v7-index.ts | `ETACountdownCompactV7` | 14 | 0 |
| src/components/tracking/v7-index.ts | `ToastProvider` | 18 | 0 |
| src/components/tracking/v7-index.ts | `ToastProviderV7` | 19 | 0 |
| src/components/tracking/v7-index.ts | `PushToast` | 20 | 0 |
| src/components/tracking/v7-index.ts | `PushToastV7` | 21 | 0 |
| src/components/tracking/v7-index.ts | `useToast` | 22 | 0 |
| src/components/tracking/v7-index.ts | `useToastV7` | 23 | 0 |
| src/components/tracking/v7-index.ts | `createOrderUpdateToast` | 24 | 0 |

### src/components/ui-v8

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/ui-v8/menu/CategoryTabsV8.tsx | `default` | 227 | 0 |
| src/components/ui-v8/menu/MenuSectionV8.tsx | `default` | 76 | 0 |
| src/components/ui-v8/cart/CartButtonV8.tsx | `default` | 155 | 0 |
| src/components/ui-v8/cart/CartItemV8.tsx | `default` | 406 | 0 |
| src/components/ui-v8/cart/QuantitySelector.tsx | `default` | 193 | 0 |
| src/components/ui-v8/cart/CartDrawerV8.tsx | `default` | 339 | 0 |
| src/components/ui-v8/cart/CartSummary.tsx | `default` | 332 | 0 |
| src/components/ui-v8/cart/CartEmptyState.tsx | `default` | 161 | 0 |
| src/components/ui-v8/cart/FlyToCart.tsx | `default` | 225 | 0 |
| src/components/ui-v8/cart/AddToCartButton.tsx | `default` | 234 | 0 |
| src/components/ui-v8/cart/ClearCartConfirmation.tsx | `default` | 230 | 0 |
| src/components/ui-v8/navigation/Header.tsx | `default` | 239 | 0 |
| src/components/ui-v8/menu/MenuItemCardV8.tsx | `MenuItemCardV8Skeleton` | 286 | 0 |
| src/components/ui-v8/menu/MenuItemCardV8.tsx | `default` | 350 | 0 |
| src/components/ui-v8/menu/MenuGridV8.tsx | `default` | 115 | 0 |
| src/components/ui-v8/menu/BlurImage.tsx | `default` | 182 | 0 |
| src/components/ui-v8/menu/FavoriteButton.tsx | `default` | 269 | 0 |
| src/components/ui-v8/menu/EmojiPlaceholder.tsx | `default` | 252 | 0 |
| src/components/ui-v8/menu/SearchInputV8.tsx | `default` | 296 | 0 |
| src/components/ui-v8/menu/SearchAutocomplete.tsx | `default` | 251 | 0 |
| src/components/ui-v8/menu/ItemDetailSheetV8.tsx | `default` | 379 | 0 |
| src/components/ui-v8/menu/MenuSkeletonV8.tsx | `default` | 193 | 0 |
| src/components/ui-v8/menu/MenuContentV8.tsx | `default` | 240 | 0 |
| src/components/ui-v8/scroll/ScrollChoreographer.tsx | `ScrollTrigger` | 103 | 0 |
| src/components/ui-v8/scroll/ScrollChoreographer.tsx | `default` | 105 | 0 |
| src/components/ui-v8/scroll/RevealOnScroll.tsx | `default` | 121 | 0 |
| src/components/ui-v8/scroll/ParallaxLayer.tsx | `default` | 107 | 0 |
| src/components/ui-v8/transitions/PageTransitionV8.tsx | `default` | 209 | 0 |

### src/components/theme

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/theme/DynamicThemeProvider.tsx | `themeVariables` | 416 | 0 |

### src/lib/web-vitals.ts

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/lib/web-vitals.ts | `WEB_VITALS_THRESHOLDS` | 18 | 0 |
| src/lib/web-vitals.ts | `initWebVitals` | 112 | 0 |
| src/lib/web-vitals.ts | `getPerformanceScore` | 154 | 0 |

### src/lib/animations

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/lib/animations/variants.ts | `fadeInUp` | 20 | 0 |
| src/lib/animations/variants.ts | `fadeInDown` | 29 | 0 |
| src/lib/animations/variants.ts | `fadeInLeft` | 38 | 0 |
| src/lib/animations/variants.ts | `fadeInRight` | 47 | 0 |
| src/lib/animations/variants.ts | `scaleIn` | 57 | 0 |
| src/lib/animations/variants.ts | `scaleInBounce` | 66 | 0 |
| src/lib/animations/variants.ts | `staggerContainer` | 76 | 0 |
| src/lib/animations/variants.ts | `staggerContainerFast` | 87 | 0 |
| src/lib/animations/variants.ts | `staggerContainerSlow` | 98 | 0 |
| src/lib/animations/variants.ts | `cardHover` | 110 | 0 |
| src/lib/animations/variants.ts | `buttonTap` | 130 | 0 |
| src/lib/animations/variants.ts | `buttonHover` | 135 | 0 |
| src/lib/animations/variants.ts | `heroContainer` | 141 | 0 |
| src/lib/animations/variants.ts | `heroItem` | 152 | 0 |
| src/lib/animations/variants.ts | `timelineContainer` | 165 | 0 |
| src/lib/animations/variants.ts | `timelineStep` | 176 | 0 |
| src/lib/animations/variants.ts | `timelineLine` | 188 | 0 |
| src/lib/animations/variants.ts | `markerPop` | 201 | 0 |
| src/lib/animations/variants.ts | `coverageCircle` | 211 | 0 |
| src/lib/animations/variants.ts | `routeDraw` | 224 | 0 |
| src/lib/animations/variants.ts | `modalOverlay` | 237 | 0 |
| src/lib/animations/variants.ts | `modalContent` | 249 | 0 |
| src/lib/animations/variants.ts | `drawerSlide` | 266 | 0 |
| src/lib/animations/variants.ts | `floatingElement` | 279 | 0 |
| src/lib/animations/variants.ts | `pulse` | 291 | 0 |
| src/lib/animations/variants.ts | `shimmer` | 303 | 0 |
| src/lib/animations/variants.ts | `listItem` | 315 | 0 |
| src/lib/animations/variants.ts | `tabIndicator` | 330 | 0 |
| src/lib/animations/variants.ts | `scrollReveal` | 336 | 0 |
| src/lib/animations/variants.ts | `viewportSettings` | 352 | 0 |
| src/lib/animations/variants.ts | `getMotionProps` | 359 | 0 |
| src/lib/animations/cart.ts | `addToCartSuccess` | 22 | 0 |
| src/lib/animations/cart.ts | `addToCartLoading` | 35 | 0 |
| src/lib/animations/cart.ts | `addToCartButton` | 43 | 0 |
| src/lib/animations/cart.ts | `cartBarBounce` | 69 | 0 |
| src/lib/animations/cart.ts | `cartBarSlideUp` | 81 | 0 |
| src/lib/animations/cart.ts | `badgePop` | 105 | 0 |
| src/lib/animations/cart.ts | `cartItemEnter` | 148 | 0 |
| src/lib/animations/cart.ts | `cartItemExit` | 165 | 0 |
| src/lib/animations/cart.ts | `cartItem` | 182 | 0 |
| src/lib/animations/cart.ts | `quantityFlip` | 208 | 0 |
| src/lib/animations/cart.ts | `priceCounter` | 228 | 0 |
| src/lib/animations/cart.ts | `cartDrawerExpand` | 240 | 0 |
| src/lib/animations/cart.ts | `cartDrawerBackdrop` | 268 | 0 |
| src/lib/animations/cart.ts | `calculateFlyToCartPath` | 288 | 0 |
| src/lib/animations/cart.ts | `flyToCart` | 311 | 0 |
| src/lib/animations/cart.ts | `getCartAnimationProps` | 336 | 0 |

### src/lib/animations.ts

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/lib/animations.ts | `duration` | 20 | 0 |
| src/lib/animations.ts | `durationMs` | 36 | 0 |
| src/lib/animations.ts | `easing` | 49 | 0 |
| src/lib/animations.ts | `easingCss` | 65 | 0 |
| src/lib/animations.ts | `transition` | 95 | 0 |
| src/lib/animations.ts | `slideUp` | 115 | 0 |
| src/lib/animations.ts | `slideDown` | 122 | 0 |
| src/lib/animations.ts | `slideLeft` | 129 | 0 |
| src/lib/animations.ts | `slideRight` | 136 | 0 |
| src/lib/animations.ts | `scaleIn` | 143 | 0 |
| src/lib/animations.ts | `popIn` | 150 | 0 |
| src/lib/animations.ts | `stagger` | 165 | 0 |
| src/lib/animations.ts | `staggerFast` | 175 | 0 |
| src/lib/animations.ts | `staggerSlow` | 185 | 0 |
| src/lib/animations.ts | `overlay` | 199 | 0 |
| src/lib/animations.ts | `modal` | 206 | 0 |
| src/lib/animations.ts | `drawer` | 213 | 0 |
| src/lib/animations.ts | `bottomSheet` | 220 | 0 |
| src/lib/animations.ts | `float` | 227 | 0 |
| src/lib/animations.ts | `pulse` | 239 | 0 |
| src/lib/animations.ts | `confetti` | 251 | 0 |
| src/lib/animations.ts | `prefersReducedMotion` | 269 | 0 |
| src/lib/animations.ts | `getMotionProps` | 278 | 0 |
| src/lib/animations.ts | `safeAnimate` | 299 | 0 |
| src/lib/animations.ts | `viewport` | 322 | 0 |
| src/lib/animations.ts | `layoutIds` | 337 | 0 |

### src/lib/swipe-gestures.ts

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/lib/swipe-gestures.ts | `SWIPE_THRESHOLDS` | 29 | 0 |
| src/lib/swipe-gestures.ts | `VELOCITY_THRESHOLDS` | 50 | 0 |
| src/lib/swipe-gestures.ts | `isTouchDevice` | 561 | 0 |
| src/lib/swipe-gestures.ts | `prefersReducedMotion` | 569 | 0 |
| src/lib/swipe-gestures.ts | `preventScrollDuringSwipe` | 583 | 0 |
| src/lib/swipe-gestures.ts | `usePreventScroll` | 610 | 0 |
| src/lib/swipe-gestures.ts | `getResistanceFactor` | 627 | 0 |
| src/lib/swipe-gestures.ts | `getVelocitySpring` | 642 | 0 |
| src/lib/swipe-gestures.ts | `clamp` | 655 | 0 |
| src/lib/swipe-gestures.ts | `lerp` | 662 | 0 |

### src/lib/micro-interactions.ts

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/lib/micro-interactions.ts | `timing` | 14 | 0 |
| src/lib/micro-interactions.ts | `easing` | 26 | 0 |
| src/lib/micro-interactions.ts | `buttonHover` | 39 | 0 |
| src/lib/micro-interactions.ts | `buttonTap` | 44 | 0 |
| src/lib/micro-interactions.ts | `buttonVariants` | 49 | 0 |
| src/lib/micro-interactions.ts | `primaryButtonVariants` | 55 | 0 |
| src/lib/micro-interactions.ts | `cardHover` | 76 | 0 |
| src/lib/micro-interactions.ts | `cardTap` | 83 | 0 |
| src/lib/micro-interactions.ts | `cardVariants` | 89 | 0 |
| src/lib/micro-interactions.ts | `toggleKnobVariants` | 103 | 0 |
| src/lib/micro-interactions.ts | `toggleTrackVariants` | 114 | 0 |
| src/lib/micro-interactions.ts | `checkboxVariants` | 129 | 0 |
| src/lib/micro-interactions.ts | `checkmarkVariants` | 144 | 0 |
| src/lib/micro-interactions.ts | `heartVariants` | 160 | 0 |
| src/lib/micro-interactions.ts | `heartTap` | 182 | 0 |
| src/lib/micro-interactions.ts | `quantityFlipVariants` | 191 | 0 |
| src/lib/micro-interactions.ts | `stepperButtonVariants` | 209 | 0 |
| src/lib/micro-interactions.ts | `iconButtonVariants` | 225 | 0 |
| src/lib/micro-interactions.ts | `rotatingIconVariants` | 237 | 0 |
| src/lib/micro-interactions.ts | `badgePopVariants` | 249 | 0 |
| src/lib/micro-interactions.ts | `rippleVariants` | 270 | 0 |
| src/lib/micro-interactions.ts | `shakeVariants` | 283 | 0 |
| src/lib/micro-interactions.ts | `pulseVariants` | 295 | 0 |
| src/lib/micro-interactions.ts | `bouncySpring` | 335 | 0 |
| src/lib/micro-interactions.ts | `variableStagger` | 366 | 0 |
| src/lib/micro-interactions.ts | `createVariableStaggerContainer` | 391 | 0 |
| src/lib/micro-interactions.ts | `staggerChildren` | 411 | 0 |
| src/lib/micro-interactions.ts | `listItemVariants` | 424 | 0 |
| src/lib/micro-interactions.ts | `staggerContainerVariants` | 441 | 0 |
| src/lib/micro-interactions.ts | `triggerHaptic` | 453 | 0 |

### src/lib/motion.ts

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/lib/motion.ts | `v6SpringGentle` | 31 | 0 |
| src/lib/motion.ts | `v6Duration` | 48 | 0 |
| src/lib/motion.ts | `v6Easing` | 56 | 0 |
| src/lib/motion.ts | `v6FadeInUp` | 68 | 0 |
| src/lib/motion.ts | `v6ScaleIn` | 75 | 0 |
| src/lib/motion.ts | `v6SlideInRight` | 82 | 0 |
| src/lib/motion.ts | `v6SlideInBottom` | 90 | 0 |
| src/lib/motion.ts | `v6HoverLift` | 102 | 0 |
| src/lib/motion.ts | `v6HoverScale` | 109 | 0 |
| src/lib/motion.ts | `v6ImageZoom` | 116 | 0 |
| src/lib/motion.ts | `v6TabIndicator` | 157 | 0 |
| src/lib/motion.ts | `v6SuccessScale` | 167 | 0 |
| src/lib/motion.ts | `v6PulseRing` | 177 | 0 |
| src/lib/motion.ts | `v6FloatIngredient` | 195 | 0 |
| src/lib/motion.ts | `v6ReducedMotion` | 213 | 0 |
| src/lib/motion.ts | `prefersReducedMotion` | 223 | 0 |
| src/lib/motion.ts | `v6StaggerDelay` | 238 | 0 |
| src/lib/motion.ts | `v6WithReducedMotion` | 251 | 0 |

### src/components/layout

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/layout/v7-index.ts | `HeaderV7` | 12 | 0 |
| src/components/layout/v7-index.ts | `MobileNav` | 23 | 0 |
| src/components/layout/v7-index.ts | `MobileNavV7` | 24 | 0 |
| src/components/layout/v7-index.ts | `Footer` | 35 | 0 |
| src/components/layout/v7-index.ts | `FooterV7` | 36 | 0 |
| src/components/layout/MobileNav.tsx | `default` | 475 | 0 |
| src/components/layout/nav-links.tsx | `NavLinks` | 30 | 0 |
| src/components/layout/footer.tsx | `Footer` | 368 | 0 |
| src/components/layout/footer.tsx | `default` | 567 | 0 |
| src/components/layout/header.tsx | `Header` | 284 | 0 |
| src/components/layout/header.tsx | `default` | 471 | 0 |

### src/components/map

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/map/PlacesAutocomplete.tsx | `default` | 328 | 0 |
| src/components/map/CoverageMap.tsx | `default` | 374 | 0 |

### src/lib/webgl

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/lib/webgl/grain.ts | `cssGrainStyles` | 255 | 0 |
| src/lib/webgl/grain.ts | `tailwindGrainConfig` | 294 | 0 |
| src/lib/webgl/gradients.ts | `AnimatedGradient` | 127 | 0 |
| src/lib/webgl/gradients.ts | `useAnimatedGradient` | 288 | 0 |
| src/lib/webgl/gradients.ts | `generateMeshGradient` | 337 | 0 |
| src/lib/webgl/gradients.ts | `v7GradientPresets` | 358 | 0 |
| src/lib/webgl/gradients.ts | `setCSSGradient` | 385 | 0 |
| src/lib/webgl/gradients.ts | `getCSSGradient` | 389 | 0 |

### src/components/menu

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/components/menu/CategoryCarousel.tsx | `default` | 288 | 0 |
| src/components/menu/ModifierToggle.tsx | `default` | 359 | 0 |
| src/components/menu/VisualPreview.tsx | `default` | 283 | 0 |
| src/components/menu/MenuItemCard.tsx | `default` | 475 | 0 |
| src/components/menu/ItemDetail.tsx | `default` | 547 | 0 |
| src/components/menu/MenuLayout.tsx | `MenuLayout` | 284 | 0 |
| src/components/menu/MenuLayout.tsx | `default` | 552 | 0 |
| src/components/menu/v7-index.ts | `CategoryCarousel` | 3 | 0 |
| src/components/menu/v7-index.ts | `CategoryCarouselV7` | 3 | 0 |
| src/components/menu/v7-index.ts | `MenuItemCardV7` | 6 | 0 |
| src/components/menu/v7-index.ts | `ModifierToggle` | 9 | 0 |
| src/components/menu/v7-index.ts | `ModifierToggleV7` | 9 | 0 |
| src/components/menu/v7-index.ts | `VisualPreview` | 12 | 0 |
| src/components/menu/v7-index.ts | `ItemDetail` | 15 | 0 |
| src/components/menu/v7-index.ts | `ItemDetailV7` | 15 | 0 |
| src/components/menu/v7-index.ts | `MenuLayout` | 18 | 0 |
| src/components/menu/v7-index.ts | `MenuLayoutV7` | 18 | 0 |

### src/design-system/tokens

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/design-system/tokens/z-index.ts | `zIndexVar` | 31 | 0 |
| src/design-system/tokens/motion.ts | `overlayCSSVars` | 74 | 0 |

### src/lib/gsap

| File | Export | Line | Reference Count |
|------|--------|------|------------------|
| src/lib/gsap/index.ts | `SplitText` | 38 | 0 |
| src/lib/gsap/index.ts | `Flip` | 38 | 0 |
| src/lib/gsap/index.ts | `Observer` | 38 | 0 |
| src/lib/gsap/presets.ts | `scrollTriggerPresets` | 122 | 0 |
| src/lib/gsap/presets.ts | `staggerDelay` | 155 | 0 |
| src/lib/gsap/presets.ts | `timelineLabels` | 166 | 0 |

## Unused Types by File

Type exports that are defined but never used:

### src/components/ui

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/components/ui/FormValidation.tsx | `ValidatedTextareaProps` | 583 | 0 |
| src/components/ui/FormValidation.tsx | `ValidatedFormProps` | 955 | 0 |
| src/components/ui/FormValidation.tsx | `InlineErrorProps` | 1002 | 0 |
| src/components/ui/ErrorBanner.tsx | `ErrorBannerVariant` | 19 | 0 |
| src/components/ui/SkipLink.tsx | `SkipLinkProps` | 17 | 0 |
| src/components/ui/SkipLink.tsx | `SkipLinksProps` | 26 | 0 |
| src/components/ui/SkipLink.tsx | `MainContentProps` | 130 | 0 |
| src/components/ui/SkipLink.tsx | `LiveRegionProps` | 192 | 0 |
| src/components/ui/Confetti.tsx | `SuccessAnimationProps` | 253 | 0 |
| src/components/ui/PriceTicker.tsx | `PriceTickerProps` | 13 | 0 |
| src/components/ui/PriceTicker.tsx | `PriceChangeBadgeProps` | 250 | 0 |
| src/components/ui/PriceTicker.tsx | `CounterTickerProps` | 314 | 0 |
| src/components/ui/AnimatedLink.tsx | `AnimatedLinkProps` | 14 | 0 |
| src/components/ui/AnimatedLink.tsx | `NavLinkProps` | 234 | 0 |
| src/components/ui/AnimatedLink.tsx | `FooterLinkProps` | 299 | 0 |
| src/components/ui/AnimatedLink.tsx | `BreadcrumbLinkProps` | 329 | 0 |
| src/components/ui/MorphingMenu.tsx | `MorphingMenuProps` | 13 | 0 |
| src/components/ui/MorphingMenu.tsx | `MorphingMenuWithLabelProps` | 242 | 0 |
| src/components/ui/MorphingMenu.tsx | `MorphingCloseButtonProps` | 313 | 0 |
| src/components/ui/input.tsx | `InputProps` | 65 | 0 |
| src/components/ui/search-input.tsx | `SearchInputProps` | 14 | 0 |
| src/components/ui/textarea.tsx | `TextareaProps` | 5 | 0 |

### src/components/admin

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/components/admin/v7-index.ts | `AdminDashboardProps` | 10 | 0 |
| src/components/admin/v7-index.ts | `AdminDashboardV7Props` | 10 | 0 |
| src/components/admin/v7-index.ts | `ChartsProps` | 14 | 0 |
| src/components/admin/v7-index.ts | `ChartsV7Props` | 15 | 0 |
| src/components/admin/v7-index.ts | `SparklineProps` | 16 | 0 |
| src/components/admin/v7-index.ts | `SparklineV7Props` | 17 | 0 |
| src/components/admin/v7-index.ts | `ChartDataPoint` | 18 | 0 |
| src/components/admin/v7-index.ts | `OrderManagementProps` | 23 | 0 |
| src/components/admin/v7-index.ts | `OrderManagementV7Props` | 24 | 0 |
| src/components/admin/v7-index.ts | `OrderItem` | 25 | 0 |
| src/components/admin/v7-index.ts | `OrderItemV7` | 26 | 0 |
| src/components/admin/v7-index.ts | `RouteOptimizationProps` | 31 | 0 |
| src/components/admin/v7-index.ts | `RouteOptimizationV7Props` | 32 | 0 |
| src/components/admin/v7-index.ts | `Route` | 33 | 0 |
| src/components/admin/v7-index.ts | `RouteV7` | 34 | 0 |
| src/components/admin/v7-index.ts | `RouteStop` | 35 | 0 |
| src/components/admin/v7-index.ts | `RouteStopV7` | 36 | 0 |
| src/components/admin/v7-index.ts | `StatusCelebrationProps` | 46 | 0 |
| src/components/admin/v7-index.ts | `InlineCelebrationV7Props` | 47 | 0 |
| src/components/admin/v7-index.ts | `InlineCelebrationProps` | 48 | 0 |
| src/components/admin/v7-index.ts | `CelebrationConfig` | 49 | 0 |
| src/components/admin/v7-index.ts | `CelebrationType` | 50 | 0 |
| src/components/admin/AdminDashboard.tsx | `AdminDashboardProps` | 50 | 0 |
| src/components/admin/OrderManagement.tsx | `OrderItem` | 42 | 0 |
| src/components/admin/OrderManagement.tsx | `OrderManagementProps` | 56 | 0 |
| src/components/admin/RouteOptimization.tsx | `RouteStop` | 42 | 0 |
| src/components/admin/RouteOptimization.tsx | `Route` | 56 | 0 |
| src/components/admin/RouteOptimization.tsx | `RouteOptimizationProps` | 70 | 0 |
| src/components/admin/StatusCelebration.tsx | `CelebrationType` | 33 | 0 |
| src/components/admin/StatusCelebration.tsx | `CelebrationConfig` | 40 | 0 |
| src/components/admin/StatusCelebration.tsx | `StatusCelebrationProps` | 49 | 0 |
| src/components/admin/StatusCelebration.tsx | `InlineCelebrationV7Props` | 424 | 0 |
| src/components/admin/analytics/Charts.tsx | `ChartDataPoint` | 42 | 0 |
| src/components/admin/analytics/Charts.tsx | `ChartsProps` | 49 | 0 |
| src/components/admin/analytics/Charts.tsx | `SparklineProps` | 530 | 0 |

### src/components/driver

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/components/driver/v7-index.ts | `DriverDashboardProps` | 9 | 0 |
| src/components/driver/v7-index.ts | `DriverDashboardV7Props` | 9 | 0 |
| src/components/driver/v7-index.ts | `LeaderboardProps` | 12 | 0 |
| src/components/driver/v7-index.ts | `LeaderboardV7Props` | 12 | 0 |
| src/components/driver/v7-index.ts | `LeaderboardEntry` | 12 | 0 |
| src/components/driver/v7-index.ts | `DeliverySuccessProps` | 15 | 0 |
| src/components/driver/v7-index.ts | `DeliverySuccessV7Props` | 15 | 0 |
| src/components/driver/DeliverySuccess.tsx | `DeliverySuccessProps` | 33 | 0 |
| src/components/driver/DriverDashboard.tsx | `DriverDashboardProps` | 36 | 0 |
| src/components/driver/Leaderboard.tsx | `LeaderboardEntry` | 31 | 0 |
| src/components/driver/Leaderboard.tsx | `LeaderboardProps` | 44 | 0 |

### src/lib/validations

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/lib/validations/analytics.ts | `NotificationType` | 213 | 0 |
| src/lib/validations/analytics.ts | `NotificationStatus` | 214 | 0 |
| src/lib/validations/analytics.ts | `MetricsPeriod` | 215 | 0 |
| src/lib/validations/analytics.ts | `SubmitRatingInput` | 216 | 0 |
| src/lib/validations/analytics.ts | `DriverAnalyticsQuery` | 217 | 0 |
| src/lib/validations/analytics.ts | `DeliveryMetricsQuery` | 218 | 0 |
| src/lib/validations/analytics.ts | `HeatmapQuery` | 219 | 0 |
| src/lib/validations/analytics.ts | `SendNotificationInput` | 220 | 0 |
| src/lib/validations/analytics.ts | `NotificationLogInsert` | 221 | 0 |
| src/lib/validations/driver-api.ts | `UpdateStopStatusInput` | 42 | 0 |
| src/lib/validations/driver-api.ts | `LocationUpdateInput` | 43 | 0 |
| src/lib/validations/driver-api.ts | `ReportExceptionInput` | 44 | 0 |
| src/lib/validations/driver-api.ts | `CompleteRouteInput` | 45 | 0 |
| src/lib/validations/driver.ts | `CreateDriverInput` | 30 | 0 |
| src/lib/validations/driver.ts | `UpdateDriverInput` | 31 | 0 |
| src/lib/validations/driver.ts | `ToggleDriverActiveInput` | 32 | 0 |
| src/lib/validations/route.ts | `CreateRouteInput` | 55 | 0 |
| src/lib/validations/route.ts | `UpdateRouteInput` | 56 | 0 |
| src/lib/validations/route.ts | `AddStopsInput` | 57 | 0 |
| src/lib/validations/route.ts | `ReorderStopsInput` | 58 | 0 |
| src/lib/validations/route.ts | `UpdateStopStatusInput` | 59 | 0 |
| src/lib/validations/route.ts | `OptimizeRouteInput` | 60 | 0 |
| src/lib/validations/tracking.ts | `OrderStatus` | 204 | 0 |
| src/lib/validations/tracking.ts | `RouteStopStatus` | 205 | 0 |
| src/lib/validations/tracking.ts | `TrackingData` | 206 | 0 |
| src/lib/validations/tracking.ts | `TrackingOrderInfo` | 207 | 0 |
| src/lib/validations/tracking.ts | `TrackingRouteStopInfo` | 208 | 0 |
| src/lib/validations/tracking.ts | `TrackingDriverDetails` | 209 | 0 |
| src/lib/validations/tracking.ts | `DriverLocation` | 210 | 0 |
| src/lib/validations/tracking.ts | `EtaInfo` | 211 | 0 |
| src/lib/validations/checkout.ts | `CreateCheckoutSessionInput` | 23 | 0 |

### src/components/checkout

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/components/checkout/AddressInput.tsx | `AddressAutocompleteResult` | 44 | 0 |

### src/components/tracking

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/components/tracking/StatusTimeline.tsx | `StatusTimelineProps` | 31 | 0 |
| src/components/tracking/ETACountdown.tsx | `ETACountdownProps` | 22 | 0 |
| src/components/tracking/PushToast.tsx | `ToastType` | 29 | 0 |
| src/components/tracking/PushToast.tsx | `Toast` | 31 | 0 |
| src/components/tracking/PushToast.tsx | `PushToastProps` | 378 | 0 |
| src/components/tracking/TrackingMap.tsx | `TrackingMapProps` | 27 | 0 |
| src/components/tracking/v7-index.ts | `TrackingMapProps` | 9 | 0 |
| src/components/tracking/v7-index.ts | `TrackingMapV7Props` | 9 | 0 |
| src/components/tracking/v7-index.ts | `StatusTimelineProps` | 12 | 0 |
| src/components/tracking/v7-index.ts | `StatusTimelineV7Props` | 12 | 0 |
| src/components/tracking/v7-index.ts | `ETACountdownProps` | 15 | 0 |
| src/components/tracking/v7-index.ts | `ETACountdownV7Props` | 15 | 0 |
| src/components/tracking/v7-index.ts | `Toast` | 26 | 0 |
| src/components/tracking/v7-index.ts | `ToastV7` | 26 | 0 |
| src/components/tracking/v7-index.ts | `ToastType` | 26 | 0 |
| src/components/tracking/v7-index.ts | `PushToastProps` | 26 | 0 |
| src/components/tracking/v7-index.ts | `PushToastV7Props` | 26 | 0 |

### src/components/layouts

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/components/layouts/PageTransition.tsx | `PageTransitionVariant` | 14 | 0 |
| src/components/layouts/PageTransition.tsx | `SlideDirection` | 391 | 0 |
| src/components/layouts/v7-index.ts | `PageTransitionProps` | 22 | 0 |
| src/components/layouts/v7-index.ts | `PageTransitionV7Props` | 23 | 0 |
| src/components/layouts/v7-index.ts | `PageTransitionVariant` | 24 | 0 |
| src/components/layouts/v7-index.ts | `FadeTransitionProps` | 25 | 0 |
| src/components/layouts/v7-index.ts | `FadeTransitionV7Props` | 26 | 0 |
| src/components/layouts/v7-index.ts | `SlideTransitionProps` | 27 | 0 |
| src/components/layouts/v7-index.ts | `SlideTransitionV7Props` | 28 | 0 |
| src/components/layouts/v7-index.ts | `ScaleTransitionProps` | 29 | 0 |
| src/components/layouts/v7-index.ts | `ScaleTransitionV7Props` | 30 | 0 |
| src/components/layouts/v7-index.ts | `MorphBlurTransitionProps` | 31 | 0 |
| src/components/layouts/v7-index.ts | `MorphBlurTransitionV7Props` | 32 | 0 |
| src/components/layouts/v7-index.ts | `SlideDirection` | 33 | 0 |
| src/components/layouts/v7-index.ts | `StaggerChildProps` | 34 | 0 |
| src/components/layouts/v7-index.ts | `ParallaxContainerProps` | 50 | 0 |
| src/components/layouts/v7-index.ts | `ParallaxLayerProps` | 51 | 0 |
| src/components/layouts/v7-index.ts | `ParallaxImageProps` | 52 | 0 |
| src/components/layouts/v7-index.ts | `ParallaxTextProps` | 53 | 0 |
| src/components/layouts/v7-index.ts | `ParallaxGradientProps` | 54 | 0 |
| src/components/layouts/v7-index.ts | `SimpleParallaxProps` | 55 | 0 |
| src/components/layouts/v7-index.ts | `ScrollOpacityProps` | 56 | 0 |
| src/components/layouts/v7-index.ts | `ScrollScaleProps` | 57 | 0 |
| src/components/layouts/v7-index.ts | `ParallaxSpeed` | 58 | 0 |
| src/components/layouts/ParallaxContainer.tsx | `ParallaxSpeed` | 21 | 0 |
| src/components/layouts/ParallaxContainer.tsx | `ParallaxImageProps` | 59 | 0 |
| src/components/layouts/ParallaxContainer.tsx | `ParallaxTextProps` | 72 | 0 |
| src/components/layouts/ParallaxContainer.tsx | `SimpleParallaxProps` | 358 | 0 |
| src/components/layouts/ParallaxContainer.tsx | `ScrollOpacityProps` | 423 | 0 |
| src/components/layouts/ParallaxContainer.tsx | `ScrollScaleProps` | 474 | 0 |

### src/components/theme

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/components/theme/DynamicThemeProvider.tsx | `DynamicThemeState` | 33 | 0 |

### src/lib/animations.ts

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/lib/animations.ts | `DurationKey` | 347 | 0 |
| src/lib/animations.ts | `EasingKey` | 348 | 0 |
| src/lib/animations.ts | `SpringKey` | 349 | 0 |
| src/lib/animations.ts | `TransitionKey` | 350 | 0 |
| src/lib/animations.ts | `ViewportKey` | 351 | 0 |

### src/lib/hooks

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/lib/hooks/index.ts | `Breakpoint` | 22 | 0 |
| src/lib/hooks/index.ts | `ToastV8` | 89 | 0 |
| src/lib/hooks/index.ts | `ToastTypeV8` | 89 | 0 |
| src/lib/hooks/useResponsive.ts | `Breakpoint` | 26 | 0 |
| src/lib/hooks/useABTest.ts | `ABTestOptions` | 26 | 0 |
| src/lib/hooks/useABTest.ts | `ABTestResult` | 35 | 0 |
| src/lib/hooks/useABTest.ts | `HeroVariant` | 204 | 0 |
| src/lib/hooks/useToast.ts | `Toast` | 8 | 0 |

### src/components/layout

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/components/layout/v7-index.ts | `HeaderProps` | 14 | 0 |
| src/components/layout/v7-index.ts | `HeaderV7Props` | 15 | 0 |
| src/components/layout/v7-index.ts | `MobileNavProps` | 25 | 0 |
| src/components/layout/v7-index.ts | `MobileNavV7Props` | 26 | 0 |
| src/components/layout/v7-index.ts | `NavItemConfig` | 27 | 0 |
| src/components/layout/v7-index.ts | `FooterProps` | 37 | 0 |
| src/components/layout/v7-index.ts | `FooterV7Props` | 38 | 0 |
| src/components/layout/MobileNav.tsx | `NavItemConfig` | 22 | 0 |
| src/components/layout/footer.tsx | `FooterProps` | 19 | 0 |
| src/components/layout/header.tsx | `HeaderProps` | 19 | 0 |

### src/components/homepage

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/components/homepage/CoverageSection.tsx | `CoverageSectionProps` | 57 | 0 |
| src/components/homepage/FloatingFood.tsx | `FoodItem` | 14 | 0 |
| src/components/homepage/Hero.tsx | `HeroProps` | 25 | 0 |
| src/components/homepage/v7-index.ts | `HeroProps` | 10 | 0 |
| src/components/homepage/v7-index.ts | `HeroV7Props` | 10 | 0 |
| src/components/homepage/v7-index.ts | `FloatingFoodProps` | 19 | 0 |
| src/components/homepage/v7-index.ts | `FoodItem` | 20 | 0 |
| src/components/homepage/v7-index.ts | `TimelineProps` | 30 | 0 |
| src/components/homepage/v7-index.ts | `TimelineV7Props` | 31 | 0 |
| src/components/homepage/v7-index.ts | `TimelineStep` | 32 | 0 |
| src/components/homepage/v7-index.ts | `CoverageSectionProps` | 42 | 0 |
| src/components/homepage/v7-index.ts | `CoverageSectionV7Props` | 43 | 0 |
| src/components/homepage/Timeline.tsx | `TimelineStep` | 26 | 0 |
| src/components/homepage/Timeline.tsx | `TimelineProps` | 36 | 0 |

### src/components/menu

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/components/menu/ModifierToggle.tsx | `ModifierOptionProps` | 29 | 0 |
| src/components/menu/MenuLayout.tsx | `MenuLayoutProps` | 18 | 0 |
| src/components/menu/v7-index.ts | `CategoryCarouselProps` | 4 | 0 |
| src/components/menu/v7-index.ts | `CategoryCarouselV7Props` | 4 | 0 |
| src/components/menu/v7-index.ts | `MenuItemCardProps` | 7 | 0 |
| src/components/menu/v7-index.ts | `MenuItemCardV7Props` | 7 | 0 |
| src/components/menu/v7-index.ts | `ModifierToggleProps` | 10 | 0 |
| src/components/menu/v7-index.ts | `ModifierToggleV7Props` | 10 | 0 |
| src/components/menu/v7-index.ts | `ModifierOptionProps` | 10 | 0 |
| src/components/menu/v7-index.ts | `ModifierOptionV7Props` | 10 | 0 |
| src/components/menu/v7-index.ts | `VisualPreviewProps` | 13 | 0 |
| src/components/menu/v7-index.ts | `ItemDetailProps` | 16 | 0 |
| src/components/menu/v7-index.ts | `ItemDetailV7Props` | 16 | 0 |
| src/components/menu/v7-index.ts | `MenuLayoutProps` | 19 | 0 |
| src/components/menu/v7-index.ts | `MenuLayoutV7Props` | 19 | 0 |

### src/lib/webgl

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/lib/webgl/gradients.ts | `GradientColor` | 18 | 0 |
| src/lib/webgl/gradients.ts | `GradientStop` | 24 | 0 |
| src/lib/webgl/gradients.ts | `AnimatedGradientConfig` | 29 | 0 |
| src/lib/webgl/gradients.ts | `MeshGradientConfig` | 332 | 0 |
| src/lib/webgl/particles.ts | `Particle` | 18 | 0 |
| src/lib/webgl/particles.ts | `ParticleType` | 33 | 0 |

### src/design-system/tokens

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/design-system/tokens/z-index.ts | `ZIndexToken` | 23 | 0 |
| src/design-system/tokens/z-index.ts | `ZIndexValue` | 24 | 0 |
| src/design-system/tokens/motion.ts | `OverlayMotionToken` | 68 | 0 |
| src/design-system/tokens/motion.ts | `OverlayCSSVarToken` | 83 | 0 |

### src/lib/utils

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/lib/utils/rate-limit.ts | `RateLimitConfig` | 13 | 0 |

### src/types/database.ts

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/types/database.ts | `Json` | 1 | 0 |
| src/types/database.ts | `ModifierSelectionType` | 19 | 0 |
| src/types/database.ts | `GenericRelationship` | 21 | 0 |

### src/stories/Button.tsx

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/stories/Button.tsx | `ButtonProps` | 3 | 0 |

### src/stories/Header.tsx

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/stories/Header.tsx | `HeaderProps` | 8 | 0 |

### src/types/checkout.ts

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/types/checkout.ts | `CreateCheckoutSessionRequest` | 16 | 0 |
| src/types/checkout.ts | `CreateCheckoutSessionResponse` | 30 | 0 |

### src/types/driver.ts

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/types/driver.ts | `DriversInsert` | 50 | 0 |
| src/types/driver.ts | `DriversUpdate` | 65 | 0 |
| src/types/driver.ts | `DriverWithProfile` | 81 | 0 |
| src/types/driver.ts | `RoutesInsert` | 112 | 0 |
| src/types/driver.ts | `RoutesUpdate` | 125 | 0 |
| src/types/driver.ts | `RouteWithDetails` | 139 | 0 |
| src/types/driver.ts | `RouteStopsInsert` | 163 | 0 |
| src/types/driver.ts | `RouteStopsUpdate` | 178 | 0 |
| src/types/driver.ts | `RouteStopWithOrder` | 194 | 0 |
| src/types/driver.ts | `OrderWithAddress` | 199 | 0 |
| src/types/driver.ts | `LocationUpdatesRow` | 221 | 0 |
| src/types/driver.ts | `LocationUpdatesInsert` | 235 | 0 |
| src/types/driver.ts | `LocationUpdatesUpdate` | 249 | 0 |
| src/types/driver.ts | `DeliveryExceptionsRow` | 276 | 0 |
| src/types/driver.ts | `DeliveryExceptionsInsert` | 288 | 0 |
| src/types/driver.ts | `DeliveryExceptionsUpdate` | 300 | 0 |
| src/types/driver.ts | `DeliveryExceptionWithDetails` | 313 | 0 |
| src/types/driver.ts | `DriverListItem` | 323 | 0 |
| src/types/driver.ts | `RouteListItem` | 340 | 0 |
| src/types/driver.ts | `RouteDetail` | 356 | 0 |
| src/types/driver.ts | `StopDetail` | 369 | 0 |
| src/types/driver.ts | `TrackingInfo` | 413 | 0 |
| src/types/driver.ts | `TrackingTimelineEvent` | 423 | 0 |
| src/types/driver.ts | `OptimizationRequest` | 454 | 0 |
| src/types/driver.ts | `OptimizationResult` | 467 | 0 |

### src/types/tracking.ts

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/types/tracking.ts | `TrackingDriverDetails` | 89 | 0 |
| src/types/tracking.ts | `StatusTimelineProps` | 184 | 0 |
| src/types/tracking.ts | `ETADisplayProps` | 195 | 0 |
| src/types/tracking.ts | `DeliveryMapProps` | 205 | 0 |
| src/types/tracking.ts | `DriverCardProps` | 223 | 0 |
| src/types/tracking.ts | `OrderSummaryProps` | 240 | 0 |
| src/types/tracking.ts | `SupportActionsProps` | 256 | 0 |
| src/types/tracking.ts | `TrackingPageClientProps` | 265 | 0 |
| src/types/tracking.ts | `StopInfo` | 282 | 0 |
| src/types/tracking.ts | `VehicleType` | 286 | 0 |

### src/types/address.ts

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/types/address.ts | `AddressLabel` | 66 | 0 |

### src/types/analytics.ts

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/types/analytics.ts | `NotificationType` | 13 | 0 |
| src/types/analytics.ts | `NotificationStatus` | 20 | 0 |
| src/types/analytics.ts | `NotificationChannel` | 27 | 0 |
| src/types/analytics.ts | `NotificationLogRow` | 29 | 0 |
| src/types/analytics.ts | `NotificationLogInsert` | 45 | 0 |
| src/types/analytics.ts | `NotificationMetadata` | 61 | 0 |
| src/types/analytics.ts | `DriverRatingRow` | 77 | 0 |
| src/types/analytics.ts | `DriverRatingInsert` | 88 | 0 |
| src/types/analytics.ts | `TimeSeriesData` | 279 | 0 |
| src/types/analytics.ts | `TimeSeriesDataset` | 284 | 0 |
| src/types/analytics.ts | `HeatmapCell` | 291 | 0 |
| src/types/analytics.ts | `DriverAnalyticsQuery` | 314 | 0 |
| src/types/analytics.ts | `DeliveryMetricsQuery` | 319 | 0 |
| src/types/analytics.ts | `SubmitRatingRequest` | 325 | 0 |
| src/types/analytics.ts | `CoverageHeatmapResponse` | 376 | 0 |
| src/types/analytics.ts | `SendNotificationPayload` | 463 | 0 |
| src/types/analytics.ts | `NotificationResult` | 469 | 0 |

### src/lib/auth

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/lib/auth/index.ts | `AdminAuthResult` | 2 | 0 |
| src/lib/auth/index.ts | `AdminAuthSuccess` | 2 | 0 |
| src/lib/auth/index.ts | `AdminAuthFailure` | 2 | 0 |
| src/lib/auth/index.ts | `DriverAuthResult` | 5 | 0 |
| src/lib/auth/index.ts | `DriverAuthSuccess` | 5 | 0 |
| src/lib/auth/index.ts | `DriverAuthFailure` | 5 | 0 |
| src/lib/auth/admin.ts | `AdminAuthSuccess` | 9 | 0 |
| src/lib/auth/admin.ts | `AdminAuthFailure` | 15 | 0 |
| src/lib/auth/driver.ts | `DriverAuthSuccess` | 9 | 0 |
| src/lib/auth/driver.ts | `DriverAuthFailure` | 16 | 0 |

### src/lib/validators

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/lib/validators/coverage.ts | `CoverageCheckRequest` | 13 | 0 |

### src/components/ui-v8

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/components/ui-v8/navigation/AppShell.tsx | `AppShellNavItem` | 26 | 0 |

### src/lib/constants

| File | Type | Line | Reference Count |
|------|------|------|------------------|
| src/lib/constants/allergens.ts | `AllergenInfo` | 11 | 0 |

## Priority Recommendations

### High Priority (Remove immediately)
1. **Unused dependencies** - Remove from package.json to reduce bundle size
2. **Unused files** - Consider removing or adding to proper entry points

### Medium Priority (Review before removing)
1. **Unused exports** - May be internal APIs or planned features
2. **Unused types** - May be needed for type inference

### Low Priority (Document decision)
1. Files with 0 references that are dynamically imported
2. Exports used by external tooling (e.g., Storybook, tests)

---
*Report generated for v1.1 Tech Debt Cleanup - Phase 9*
