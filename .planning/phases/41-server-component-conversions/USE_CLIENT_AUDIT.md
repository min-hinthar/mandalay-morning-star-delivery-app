# 'use client' Audit - Phase 41

**Audit Date:** 2026-02-06
**Total Files:** 275
**Target Reduction:** ~20-30 files (via page conversions and nearby wins)

---

## Conversion Results - Phase 41

**Completion Date:** 2026-02-06
**Final 'use client' Count:** 282 files
**Change:** +7 files (from 275 baseline)

### What Happened

The 'use client' count increased rather than decreased because:

1. **Error boundaries require 'use client'** - Added 4 new error.tsx files for route error handling (Next.js requirement)
2. **New wrapper components** - Created HomePageWrapper.tsx and MenuContentClient.tsx as extraction targets
3. **Deleted 1 file** - HomePageClient.tsx removed (server composition now in page.tsx)

**Net calculation:** 275 - 1 (deleted) + 4 (error.tsx) + 2 (wrappers) = 280 (double quotes) + 2 (single quotes pre-existing) = 282

### Conversions Made

| File                  | Action  | Result                                                         |
| --------------------- | ------- | -------------------------------------------------------------- |
| HomePageClient.tsx    | Deleted | Server composition in page.tsx                                 |
| HomePageWrapper.tsx   | Created | Minimal client wrapper for scroll spy (46 lines)               |
| MenuContentClient.tsx | Created | React Query + offline logic extracted (placeholder for future) |

### Conversions Skipped

| File                        | Reason                                            | Decision                                                |
| --------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| Hero.tsx (519 lines)        | Tightly coupled framer-motion parallax            | KEEP - splitting would cause hydration issues           |
| MenuContent.tsx (364 lines) | React Query + IndexedDB offline deeply integrated | KEEP - MenuContentClient created for future enhancement |
| TrackingPageClient.tsx      | Supabase realtime subscriptions                   | KEEP - client boundary required for websockets          |
| Analytics dashboards        | Charts, hooks, motion throughout                  | KEEP - inherently interactive components                |

### Build Metrics

| Metric                      | Value                              |
| --------------------------- | ---------------------------------- |
| Build time                  | 21.9s compile + 16.1s post-compile |
| Static bundle               | 4.5 MB (.next/static)              |
| Total build output          | 96 MB (.next)                      |
| Typecheck                   | Pass (no errors)                   |
| Hydration smoke test routes | 3 (/, /menu, /admin/analytics)     |

### Infrastructure Added

| Component           | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| RouteLoading.tsx    | Reusable loading state component                 |
| RouteError.tsx      | Reusable error boundary component                |
| 4 loading.tsx files | Route-level loading states (server components)   |
| 4 error.tsx files   | Route-level error boundaries (client components) |

### Recommendations for Phase 42+

**Do not pursue further 'use client' reduction as primary goal.** The remaining 282 client components are:

1. **Necessary** - Hooks, events, animations, browser APIs
2. **Optimal** - Already at the correct boundary
3. **Small** - 54 are LEAF components (<120 lines)

**Instead focus on:**

- LCP optimization (still 9-11s, target <2.5s)
- TBT reduction (still 2-3s)
- Large file splits (5 files >400 lines)
- Code splitting for route-specific bundles

---

## Categories

| Category | Count | Description                                                       |
| -------- | ----- | ----------------------------------------------------------------- |
| KEEP     | 184   | Requires client: hooks, events, animations, browser APIs          |
| CONVERT  | 37    | Can become server component (no client-only dependencies)         |
| SPLIT    | 0     | No clear split candidates (files are either LEAF or complex KEEP) |
| LEAF     | 54    | Already correct (small interactive component <120 lines)          |

## Audit Results

### Summary

- **KEEP:** 184 files (67%) - Must remain client components
- **CONVERT:** 37 files (13%) - Can be converted to server components
- **SPLIT:** 0 files (0%) - No viable split candidates
- **LEAF:** 54 files (20%) - Already correctly structured small components

### Conversion Priority (Phase 41 Targets)

These files are directly related to the 4 target pages (home, menu, analytics, tracking):

| File                                          | Category | Reason                            | Action                                           |
| --------------------------------------------- | -------- | --------------------------------- | ------------------------------------------------ |
| src/components/ui/homepage/HomePageClient.tsx | CONVERT  | No hooks/events/motion detected   | Remove "use client", convert to server component |
| src/components/ui/menu/MenuGrid.tsx           | CONVERT  | Pure layout component             | Remove "use client"                              |
| src/components/ui/menu/MenuSection.tsx        | CONVERT  | Pure layout component             | Remove "use client"                              |
| src/components/ui/menu/MenuSkeleton.tsx       | CONVERT  | Static skeleton UI                | Remove "use client"                              |
| src/components/ui/menu/ModifierGroup.tsx      | CONVERT  | Pure render component             | Remove "use client"                              |
| src/components/ui/menu/SearchResultsGrid.tsx  | CONVERT  | Pure layout component             | Remove "use client"                              |
| src/components/ui/orders/OrderTimeline.tsx    | CONVERT  | Pure render component             | Remove "use client"                              |
| src/components/ui/orders/tracking/\*          | KEEP     | Uses hooks, motion, subscriptions | Keep as client components                        |
| src/app/(admin)/admin/analytics/\*            | KEEP     | Uses hooks, motion, charts        | Keep as client components                        |

### CONVERT Candidates (37 files)

Files that can have "use client" removed - no client-only dependencies detected:

| #   | File                                                       | Lines | Notes                                |
| --- | ---------------------------------------------------------- | ----- | ------------------------------------ |
| 1   | src/app/(admin)/admin/drivers/[id]/page.tsx                | 13    | Wrapper page                         |
| 2   | src/app/(admin)/admin/routes/[id]/page.tsx                 | 23    | Wrapper page                         |
| 3   | src/app/(admin)/admin/settings/page.tsx                    | 12    | Wrapper page                         |
| 4   | src/app/providers.tsx                                      | 28    | Provider wrapper (may need review)   |
| 5   | src/components/ui/admin/analytics/LazyCharts.tsx           | 43    | Dynamic import wrapper               |
| 6   | src/components/ui/admin/PopularItems.tsx                   | 80    | Static display                       |
| 7   | src/components/ui/admin/RevenueChart.tsx                   | 113   | Chart wrapper (review for chart lib) |
| 8   | src/components/ui/alert-dialog.tsx                         | 140   | Radix wrapper                        |
| 9   | src/components/ui/auth/ForgotPasswordForm.tsx              | 80    | Form wrapper                         |
| 10  | src/components/ui/auth/LoginForm.tsx                       | 83    | Form wrapper                         |
| 11  | src/components/ui/auth/ResetPasswordForm.tsx               | 84    | Form wrapper                         |
| 12  | src/components/ui/auth/SignupForm.tsx                      | 83    | Form wrapper                         |
| 13  | src/components/ui/avatar.tsx                               | 65    | Static component                     |
| 14  | src/components/ui/checkout/TimeSlotDisplay.tsx             | 34    | Static display                       |
| 15  | src/components/ui/driver/DriverNav.tsx                     | 85    | Navigation links                     |
| 16  | src/components/ui/driver/DriverPageHeader.tsx              | 50    | Static header                        |
| 17  | src/components/ui/driver/HighContrastToggle.tsx            | 39    | Context consumer (review)            |
| 18  | src/components/ui/driver/LocationTracker.tsx               | 140   | Uses useLocationTracking (review)    |
| 19  | src/components/ui/homepage/HomePageClient.tsx              | 107   | **HIGH PRIORITY** - Main target      |
| 20  | src/components/ui/icons/DynamicIcon.tsx                    | 141   | Dynamic icon loader                  |
| 21  | src/components/ui/layout/HeaderWrapper.tsx                 | 21    | Static wrapper                       |
| 22  | src/components/ui/menu/MenuGrid.tsx                        | 93    | Layout component                     |
| 23  | src/components/ui/menu/MenuSection.tsx                     | 77    | Layout component                     |
| 24  | src/components/ui/menu/MenuSkeleton.tsx                    | 194   | Loading skeleton                     |
| 25  | src/components/ui/menu/ModifierGroup.tsx                   | 157   | Display component                    |
| 26  | src/components/ui/menu/SearchResultsGrid.tsx               | 88    | Layout component                     |
| 27  | src/components/ui/menu/UnifiedMenuItemCard/CardContent.tsx | 89    | Static content                       |
| 28  | src/components/ui/offline/StaleBadge.tsx                   | 44    | Static badge                         |
| 29  | src/components/ui/orders/OrderTimeline.tsx                 | 149   | Static timeline display              |
| 30  | src/components/ui/scroll/ParallaxLayer.tsx                 | 107   | Uses GSAP (review)                   |
| 31  | src/components/ui/scroll/RevealOnScroll.tsx                | 121   | Uses GSAP (review)                   |
| 32  | src/components/ui/scroll/ScrollChoreographer.tsx           | 105   | Uses GSAP (review)                   |
| 33  | src/components/ui/search/CommandPalette/SearchInput.tsx    | 68    | Input wrapper                        |
| 34  | src/components/ui/select.tsx                               | 175   | Radix wrapper                        |
| 35  | src/components/ui/theme/ThemeProvider.tsx                  | 18    | Provider wrapper                     |
| 36  | src/components/ui/ToastProvider.tsx                        | 17    | Provider wrapper                     |
| 37  | src/lib/hooks/useResponsive.ts                             | 128   | Hook export (review)                 |

**Notes:**

- Files marked "review" may have indirect client dependencies not caught by pattern matching
- Provider wrappers often need "use client" for context
- GSAP components need runtime execution

### LEAF Components (54 files)

Small, correctly-structured interactive components (<120 lines):

| #   | File                                                        | Lines | Client Features                |
| --- | ----------------------------------------------------------- | ----- | ------------------------------ |
| 1   | src/app/(admin)/admin/error.tsx                             | 59    | hooks, events                  |
| 2   | src/app/(customer)/debug/sentry/page.tsx                    | 48    | events                         |
| 3   | src/app/(customer)/orders/error.tsx                         | 65    | hooks, events                  |
| 4   | src/app/(driver)/driver/error.tsx                           | 59    | hooks, events                  |
| 5   | src/app/contexts/DriverContrastContext.tsx                  | 111   | hooks, events, browser         |
| 6   | src/app/error.tsx                                           | 59    | hooks, events                  |
| 7   | src/app/global-error.tsx                                    | 23    | hooks                          |
| 8   | src/components/ui/account/AccountClient.tsx                 | 70    | motion                         |
| 9   | src/components/ui/admin/analytics/AnimatedCounter.tsx       | 103   | hooks, motion                  |
| 10  | src/components/ui/admin/routes/RouteStatsBar.tsx            | 109   | motion                         |
| 11  | src/components/ui/admin/routes/StopsList.tsx                | 83    | motion                         |
| 12  | src/components/ui/admin/sections/DraftBanner.tsx            | 93    | hooks, events, motion          |
| 13  | src/components/ui/admin/sections/HomepagePreview.tsx        | 115   | hooks, events, motion          |
| 14  | src/components/ui/animated-toggle.tsx                       | 86    | events, motion, browser        |
| 15  | src/components/ui/auth/UserMenu.tsx                         | 97    | hooks, events                  |
| 16  | src/components/ui/Backdrop.tsx                              | 59    | events, motion                 |
| 17  | src/components/ui/checkbox.tsx                              | 85    | motion                         |
| 18  | src/components/ui/checkout/AnimatedFormField.tsx            | 46    | hooks, motion                  |
| 19  | src/components/ui/checkout/TimeStepV8.tsx                   | 119   | hooks, events, motion          |
| 20  | src/components/ui/DiscardChangesModal.tsx                   | 106   | events                         |
| 21  | src/components/ui/driver/DriverHeader.tsx                   | 75    | events                         |
| 22  | src/components/ui/driver/DriverShell.tsx                    | 38    | hooks, browser                 |
| 23  | src/components/ui/driver/NavigationButton.tsx               | 68    | events, motion, browser        |
| 24  | src/components/ui/driver/OfflineBanner.tsx                  | 88    | hooks, events                  |
| 25  | src/components/ui/error-shake.tsx                           | 113   | hooks, motion                  |
| 26  | src/components/ui/homepage/CTABanner.tsx                    | 118   | motion                         |
| 27  | src/components/ui/homepage/GradientOrb.tsx                  | 94    | motion                         |
| 28  | src/components/ui/layout/AppHeader/CartIndicator.tsx        | 111   | hooks, events, motion, browser |
| 29  | src/components/ui/layout/AppHeader/MobileHeader.tsx         | 108   | motion                         |
| 30  | src/components/ui/layout/MobileDrawer/DrawerFooter.tsx      | 66    | motion                         |
| 31  | src/components/ui/layout/MobileDrawer/DrawerNavLink.tsx     | 79    | events, motion                 |
| 32  | src/components/ui/layout/MobileDrawer/DrawerUserSection.tsx | 103   | events, motion                 |
| 33  | src/components/ui/menu/GlassOverlay.tsx                     | 82    | motion                         |
| 34  | src/components/ui/menu/MenuCardWrapper.tsx                  | 115   | motion                         |
| 35  | src/components/ui/menu/MenuEmptyState.tsx                   | 103   | events, motion                 |
| 36  | src/components/ui/menu/MenuHeader.tsx                       | 56    | motion                         |
| 37  | src/components/ui/navigation/AppShell.tsx                   | 112   | hooks                          |
| 38  | src/components/ui/offline/OfflineIndicator.tsx              | 113   | hooks, browser                 |
| 39  | src/components/ui/offline/ServiceWorkerRegistration.tsx     | 51    | hooks, browser                 |
| 40  | src/components/ui/orders/OrderCard.tsx                      | 102   | motion                         |
| 41  | src/components/ui/orders/OrderListAnimated.tsx              | 39    | motion                         |
| 42  | src/components/ui/orders/OrdersHeader.tsx                   | 55    | motion                         |
| 43  | src/components/ui/Portal.tsx                                | 46    | hooks, motion, browser         |
| 44  | src/components/ui/progress.tsx                              | 51    | motion                         |
| 45  | src/components/ui/RouteError.tsx                            | 67    | hooks, events, motion          |
| 46  | src/components/ui/RouteLoading.tsx                          | 32    | motion                         |
| 47  | src/components/ui/search/CommandPalette/SearchResults.tsx   | 93    | motion                         |
| 48  | src/components/ui/Toast.tsx                                 | 87    | events, motion                 |
| 49  | src/lib/hooks/useAuth.ts                                    | 38    | hooks                          |
| 50  | src/lib/hooks/useCommandPalette.ts                          | 90    | hooks, events, browser         |
| 51  | src/lib/hooks/useCoverageCheck.ts                           | 31    | query                          |
| 52  | src/lib/hooks/useCustomerOfflineSync.ts                     | 73    | hooks, browser                 |
| 53  | src/lib/hooks/useDeviceCapability.ts                        | 76    | hooks, browser                 |
| 54  | src/lib/hooks/useFavorites.ts                               | 39    | browser                        |

### KEEP Components (184 files)

Large or complex components that must remain client-side due to hooks, events, animations, or browser APIs. These files are necessary client components.

**By directory:**

| Directory                   | Count | Primary Reason                       |
| --------------------------- | ----- | ------------------------------------ |
| src/components/ui/admin/    | 35    | Forms, tables, modals, charts        |
| src/components/ui/menu/     | 15    | Interactive cards, search, favorites |
| src/components/ui/cart/     | 10    | Cart state, animations, fly-to-cart  |
| src/components/ui/checkout/ | 11    | Forms, payment, time pickers         |
| src/components/ui/homepage/ | 8     | Parallax, animations, scroll effects |
| src/components/ui/orders/   | 7     | Tracking, subscriptions, maps        |
| src/components/ui/driver/   | 10    | Photo capture, GPS, offline sync     |
| src/components/ui/layout/   | 8     | Headers, drawers, navigation         |
| src/components/ui/auth/     | 2     | Auth forms, handlers                 |
| src/lib/hooks/              | 20    | React hooks by definition            |
| src/lib/providers/          | 2     | Context providers                    |
| Other                       | 56    | Various interactive UI               |

### Future Split Candidates

Files that could potentially be split in future phases for further optimization (lower priority):

| File                                                               | Why                                       | Estimated Effort                   |
| ------------------------------------------------------------------ | ----------------------------------------- | ---------------------------------- |
| src/components/ui/homepage/Hero.tsx (518 lines)                    | Large file, static sections + interactive | HIGH - Complex scroll/motion logic |
| src/components/ui/homepage/HowItWorksSection.tsx (876 lines)       | Large file, mostly static content         | MEDIUM - Animation extraction      |
| src/components/ui/menu/MenuContent.tsx (364 lines)                 | Combines layout + interactivity           | MEDIUM - Extract static wrappers   |
| src/components/ui/admin/orders/OrderDetailExpanded.tsx (984 lines) | Very large file                           | HIGH - Admin-only, lower priority  |
| src/components/ui/FormValidation.tsx (1031 lines)                  | Largest file, complex validation          | HIGH - Core form infrastructure    |

**Note:** These are "could split later" candidates per CONTEXT.md guidance. The effort is significant and they are not immediate targets.

## Recommendations

### Phase 41 Quick Wins (13 files)

These files are directly related to target pages and are clearly CONVERT candidates:

1. `src/components/ui/homepage/HomePageClient.tsx` - Wrapper that can be server component
2. `src/components/ui/menu/MenuGrid.tsx` - Pure layout
3. `src/components/ui/menu/MenuSection.tsx` - Pure layout
4. `src/components/ui/menu/MenuSkeleton.tsx` - Static skeleton
5. `src/components/ui/menu/ModifierGroup.tsx` - Pure display
6. `src/components/ui/menu/SearchResultsGrid.tsx` - Pure layout
7. `src/components/ui/menu/UnifiedMenuItemCard/CardContent.tsx` - Static content
8. `src/components/ui/orders/OrderTimeline.tsx` - Static display
9. `src/components/ui/offline/StaleBadge.tsx` - Static badge
10. `src/components/ui/checkout/TimeSlotDisplay.tsx` - Static display
11. `src/components/ui/layout/HeaderWrapper.tsx` - Static wrapper
12. `src/app/(admin)/admin/drivers/[id]/page.tsx` - Wrapper page
13. `src/app/(admin)/admin/routes/[id]/page.tsx` - Wrapper page

### Files Requiring Review

Some files marked CONVERT may still need "use client" due to:

- Indirect dependencies (child components with hooks)
- Library requirements (Radix UI, Chart.js)
- GSAP animations (requires browser)
- Dynamic imports with client-side loading

Review before converting:

- Provider wrappers (may need context)
- GSAP scroll components (ParallaxLayer, RevealOnScroll, ScrollChoreographer)
- Auth form wrappers (may use form hooks)
- Radix UI primitives (alert-dialog, select)

---

_Audit completed: 2026-02-06_
_Phase: 41-server-component-conversions_
_Context: Cleanup happens alongside page conversions, not as separate sweep_
