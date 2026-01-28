# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-27)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** Phase 27 in progress - Token enforcement for colors

## Current Position

Phase: 27 (Token Enforcement - Colors)
Plan: 3 of N in current phase
Status: In progress
Last activity: 2026-01-28 - Completed 27-03-PLAN.md

Progress: [████████████████████████████████████████░] v1.3 + Token Enforcement | 31/38+ plans

## Milestones Completed

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 1-8 | 32 | 2026-01-23 |
| v1.1 Tech Debt | 9-14 | 21 | 2026-01-23 |
| v1.2 Playful UI Overhaul | 15-24 | 29 | 2026-01-27 |

**Total completed:** 24 phases, 82 plans
**v1.3 scope:** 10 phases (25-34), 25+ plans estimated
**v1.3 progress:** 26 plans complete
**Phase 27 progress:** 3 plans complete

## Performance Metrics

**Velocity:**
- Total plans completed: 96 (v1.0 + v1.1 + v1.2 + v1.3)
- Average duration: 10min (Phase 15-24)
- v1.3 plans completed: 26

**By Phase (v1.3):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 25 | 1/1 | 8min | 8min |
| 26 | 8/8 | 136min | 17min |
| 33 | 11/11 | 123min | 11.2min |
| 34 | 8/8 | 40min | 5min |
| 27 | 3/? | 48min | 16min |

## Accumulated Context

### Key Research Findings

From `.planning/research/SUMMARY.md`:
- 221 hardcoded color violations across 70+ files
- 6 overlapping components between ui/ and ui-v8/
- Mobile 3D tilt bug: missing Safari compositing fixes
- Hero parallax can use existing parallaxPresets from motion-tokens.ts
- Token system is comprehensive (62 tokens) but not being used

### Component Consolidation Complete (26-08)

**Phase 26 outcomes:**
- ui-v8/ directory completely removed (11 files)
- All components consolidated into @/components/ui/
- Subdirectory organization: cart/, menu/, navigation/, scroll/, transitions/
- ESLint guard prevents ui-v8 import recreation
- Dead code cleaned (PageTransition.tsx, search-input.tsx)

**Final structure:**
- Main barrel (ui/index.ts) re-exports all subdirectories
- No V7/V8 suffixes in public APIs
- Single implementations: Modal, Drawer (with BottomSheet alias), Tooltip, Toast

### Design Decisions

| Decision | Phase | Rationale |
|----------|-------|-----------|
| Animation tokens single source | 24 | All imports from @/lib/motion-tokens |
| 2D hero is permanent standard | 24 | gradient + floating animation |
| ESLint z-index rule at error severity | 24 | prevents regression |
| ESLint color rules at error level | 25-01 | visibility during migration |
| Baseline auto-updates only on decrease | 25-01 | regression protection |
| BottomSheet merged into Drawer | 26-02 | position="bottom" prop |
| Keep V5 Modal (more feature-complete) | 26-02 | has useModal, ConfirmModal, subcomponents |
| Toast declarative only | 26-03 | No imperative toast() function |
| Dropdown and DropdownMenu coexist | 26-03 | Different use cases (simpler vs feature-rich) |
| Drawer uses position prop | 26-06 | position="left|right|bottom" instead of side |
| PageTransition renamed | 26-06 | V8 suffix removed in ui/transitions |
| Cart components V8 suffix removed | 26-04 | CartBarV8 -> CartBar, etc. |
| CartDrawer uses Drawer position="bottom" | 26-04 | BottomSheet replaced per 26-02 |
| Menu components V8 suffix removed | 26-05 | CategoryTabsV8 -> CategoryTabs, etc. |
| SearchInput canonical in ui/menu | 26-07 | Menu version has autocomplete |
| CartEmptyState canonical in ui/cart | 26-07 | Cart version has animations |
| ESLint guard for ui-v8 imports | 26-08 | no-restricted-imports prevents recreation |
| Framer Motion + GSAP scroll coexist | 33-02 | Both animation approaches in ui/scroll/ |
| CategoryTabs supports controlled mode | 33-03 | activeCategory prop disables scrollspy |
| QuantitySelector excluded from menu barrel | 33-03 | Avoids conflict with cart/QuantitySelector |
| Theme providers in ui/theme/ | 33-06 | Consolidated all theme components |
| WebVitalsReporter in lib/ | 33-06 | Non-UI concern moved to lib/web-vitals.tsx |
| Tracking in orders/tracking/ subdirectory | 33-08 | Keeps order components organized |
| OnboardingTour in ui/auth/ | 33-08 | Part of auth flow per CONTEXT.md |
| BrandMascot in ui/brand/ | 33-08 | Room for future brand components |
| Theme re-exported from ui/ barrel | 33-09 | Consistency with other subdirectories |
| ESLint guards for all removed directories | 33-10 | 14 no-restricted-imports rules prevent recreation |
| Alphabetical subdirectory exports | 33-11 | Organized barrel exports A-Z |
| ESLint guard for @/design-system imports | 34-03 | Prevents re-use of deprecated path |
| text-text-inverse for button text | 27-01 | Theme-aware inverse text on colored backgrounds |
| bg-overlay tokens for overlays | 27-01 | Replaced bg-black/N and bg-white/N with semantic tokens |
| ring-surface-primary for badge rings | 27-02 | Theme-aware badge rings instead of ring-white |
| bg-overlay-heavy for sold-out overlays | 27-02 | Theme-aware overlay for sold-out states |
| ESLint disable for PhotoCapture camera UI | 27-03 | Intentionally dark for camera viewfinder |
| ESLint disable for DriverLayout high-contrast | 27-03 | WCAG accessibility for drivers in sunlight |

### Phase 27 Progress

**27-01 outcomes:**
- Added overlay, skeleton, disabled, selection tokens to tokens.css
- Both light and dark theme values configured
- Tailwind utilities mapped: overlay, skeleton, disabled, selection
- Homepage components migrated: CTABanner, FooterCTA, HomepageMenuSection, TestimonialsCarousel
- Checkout components migrated: AddressInput, TimeSlotPicker, PaymentSuccess, PaymentStepV8, AddressCardV8, CheckoutWizard
- Zero text-white/text-black/bg-white/bg-black violations in homepage and checkout

**27-02 outcomes:**
- Core UI components migrated: dialog, Dropdown, success-checkmark, toggles
- Cart components migrated: CartBar, CartButton, CartItem, AddToCartButton, ClearCartConfirmation, CartDrawer, CartSummary
- Menu and navigation migrated: MenuContent, ItemDetailSheet, FavoriteButton, AppShell
- Zero text-white/text-black/bg-white/bg-black violations in migrated ui/ components

**27-03 outcomes:**
- Admin components migrated: AdminDashboard, DriverListTable, AddDriverModal, MetricCard, AdminLayout
- Admin pages migrated: routes, menu, drivers, categories, analytics dashboards
- Driver components migrated: ActiveRouteView, DriverDashboard, DeliveryActions, ExceptionModal, OfflineBanner, StopCard, StopDetail
- Driver high-contrast preserved: PhotoCapture (camera UI) and DriverLayout (accessibility) have ESLint disable comments
- Layout components migrated: MobileDrawer, SearchTrigger, CartIndicator, AccountIndicator, CheckoutLayout
- Search migrated: CommandPalette backdrop
- Tracking migrated: DriverCard, SupportActions, TrackingPageClient, OrderSummary
- Auth migrated: AuthModal, WelcomeAnimation, MagicLinkSent, LoginForm, OnboardingTour
- Zero text-white/text-black/bg-white/bg-black violations in admin, driver, layout, tracking, auth components (except documented exemptions)

### Phase 33 Progress

**33-02 outcomes:**
- scroll/ directory merged into ui/scroll/
- AnimatedSection and SectionNavDots now in ui/scroll/
- All scroll imports consolidated to @/components/ui/scroll

**33-03 outcomes:**
- menu/ directory merged into ui/menu/
- 5 duplicates deleted (SearchInput, MenuGrid, category-tabs, menu-section, menu-skeleton)
- 12 unique components moved (FeaturedCarousel, UnifiedMenuItemCard, etc.)
- All menu imports consolidated to @/components/ui/menu
- CategoryTabs supports both scrollspy and controlled modes

**33-04 outcomes:**
- layout/ primitives merged into ui/
- CommandPalette moved to ui/search/
- AppHeader components in ui/layout/

**33-05 outcomes:**
- layout/ directory deleted (CommandPalette was duplicated in ui/search/)
- layouts/ directory deleted (only had re-exports)
- All layout imports now use canonical @/components/ui paths

**33-06 outcomes:**
- ThemeProvider and DynamicThemeProvider moved to ui/theme/
- WebVitalsReporter merged into lib/web-vitals.tsx
- No loose .tsx files at components root

**33-07 outcomes:**
- admin/, checkout/, driver/, homepage/, orders/ moved to ui/
- All consumer imports updated to @/components/ui/{feature}
- Complete barrel exports for all moved directories
- components/ root now only has ui/ and legacy (auth/, mascot/, onboarding/)

**33-08 outcomes:**
- tracking/ merged into ui/orders/tracking/
- auth/ moved to ui/auth/
- onboarding/ merged into ui/auth/ (OnboardingTour)
- mascot/ moved to ui/brand/
- All old directories removed from components root

**33-09 outcomes:**
- Verified theme/ already merged to ui/theme/ (done in 33-06)
- Added theme re-export to ui/index.ts barrel
- All theme imports use @/components/ui/theme

**33-10 outcomes:**
- ESLint guards for all 14 removed directories
- Each guard includes migration message with correct import path
- Future imports to old paths blocked at lint time

**33-11 outcomes:**
- Added admin, checkout, driver, homepage exports to ui/index.ts
- Verified knip.json configuration already correct
- Final counts: 26 directories, 201 component files
- Phase 33 complete: components/ contains only ui/

### Roadmap Evolution

- Phase 33 added: Full Components Consolidation (merge all component subdirectories, eliminate duplicates)
- Phase 34 added: Full src/ Consolidation (consolidate contexts, design-system, lib, styles, types directories)

### Blockers/Concerns

None.

### Phase 34 Progress

**34-01 outcomes:**
- Created src/lib/design-system/tokens/ directory structure
- Copied z-index.ts and motion.ts token files
- Originals preserved for import migration in 34-02

**34-02 outcomes:**
- Migrated 21 files from @/design-system/tokens/z-index to @/lib/design-system/tokens/z-index
- Migrated 5 files from @/design-system/tokens/motion to @/lib/design-system/tokens/motion
- Zero remaining @/design-system/tokens/ imports
- Build and typecheck verified passing

**34-03 outcomes:**
- Deleted src/design-system/ directory (z-index.ts and motion.ts)
- Added ESLint guard blocking @/design-system/* imports
- Updated zIndex error message to reference @/lib/design-system/
- Design-system migration complete with guard preventing re-creation

**34-04 outcomes:**
- Created src/app/contexts/ directory for context co-location
- Copied DriverContrastContext.tsx (111 lines) to app/contexts/
- Original preserved in contexts/ for import migration

**34-05 outcomes:**
- Updated HighContrastToggle.tsx to import from @/app/contexts/
- Updated DriverShell.tsx to import from @/app/contexts/
- Build and typecheck verified with new import paths

**34-06 outcomes:**
- Deleted src/contexts/ directory (DriverContrastContext.tsx removed)
- Added ESLint guard for @/contexts/* imports
- Contexts migration complete with guard preventing re-creation

**34-07 outcomes:**
- Created src/lib/design-system/index.ts barrel export
- Added lib/**/index.ts to knip entry points
- Verified knip has no false positives for design-system exports

**34-08 outcomes:**
- Verified all 7 Phase 34 success criteria met
- Confirmed design-system/ and contexts/ directories deleted
- Validated styles/ (4 files) and types/ (11 files) organization
- ESLint guards verified for @/design-system and @/contexts
- Build and typecheck pass (lint has pre-existing color violations)

## Session Continuity

Last session: 2026-01-28
Stopped at: Phase 27 Plan 03 complete - admin, driver, layout, tracking, auth migrated
Resume file: None
Next action: Continue Phase 27 (Plan 04 if needed for remaining component migrations)

---

*Updated: 2026-01-28 - Phase 27 Plan 03 complete (admin, driver, layout, tracking, auth migrated)*
