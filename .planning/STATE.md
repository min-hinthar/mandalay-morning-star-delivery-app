# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-27)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** Phase 29 complete - ready for Phase 30 Mobile Stability

## Current Position

Phase: 29 (Token Enforcement - Effects) - COMPLETE
Plan: 6 of 6 in current phase
Status: Phase complete
Last activity: 2026-01-28 - Completed 29-06 (CSS transition tokenization + FM documentation)

Progress: [█████████████████████████████████████████] v1.3 + Token Enforcement | 43/43+ plans

## Milestones Completed

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 1-8 | 32 | 2026-01-23 |
| v1.1 Tech Debt | 9-14 | 21 | 2026-01-23 |
| v1.2 Playful UI Overhaul | 15-24 | 29 | 2026-01-27 |

**Total completed:** 24 phases, 82 plans
**v1.3 scope:** 10 phases (25-34), 25+ plans estimated
**v1.3 progress:** 38 plans complete
**Phase 29 progress:** 6 plans complete (PHASE COMPLETE)

## Performance Metrics

**Velocity:**
- Total plans completed: 107 (v1.0 + v1.1 + v1.2 + v1.3)
- Average duration: 10min (Phase 15-24)
- v1.3 plans completed: 38

**By Phase (v1.3):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 25 | 1/1 | 8min | 8min |
| 26 | 8/8 | 136min | 17min |
| 33 | 11/11 | 123min | 11.2min |
| 34 | 8/8 | 40min | 5min |
| 27 | 6/6+ | 73min | 12.2min |
| 28 | 3/3 | 18min | 6min |
| 29 | 6/6 | 48min | 8min |

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
| Gradient utility classes in globals.css | 27-04 | Reusable theme-aware gradient patterns |
| CSS variable inline styles for unique gradients | 27-04 | Theme-awareness without utility proliferation |
| bg-gradient-avatar for user avatars | 27-04 | Unified avatar fallback look across components |
| bg-surface-primary/N for opacity surfaces | 27-06 | Theme-aware semi-transparent surfaces |
| bg-overlay-light for input backgrounds | 27-06 | Light overlay for glassmorphism inputs |
| bg-gradient-progress for progress bars | 27-06 | CSS utility instead of from-saffron to-jade |
| text-2xs token for 10px font size | 28-01 | Semantic alternative to text-[10px] |
| ESLint rules for arbitrary px values | 28-01 | Enforce semantic tokens over hardcoded pixels |
| 11px font sizes round to text-xs | 28-02 | 1px difference imperceptible for badges |
| --tabs-offset for sticky positioning | 28-03 | Single source of truth for header + tabs offset |
| var(--radius-*) for chart borderRadius | 28-03 | Consistent design tokens in Recharts components |
| MorphingMenu numeric borderRadius preserved | 28-03 | Framer Motion animation interpolation requirement |
| shadow-xs uses subtle primary tint | 29-01 | Brand consistency with existing shadow tokens |
| blur tokens same values in light/dark | 29-01 | Blur not theme-dependent |
| ESLint boxShadow notes Framer exception | 29-01 | Animation interpolation requires numeric values |
| Header dynamic blur uses numeric values | 29-03 | Scroll-linked animation requires interpolation |
| Modal uses Tailwind backdrop-blur-sm | 29-03 | Already tokenized via Tailwind utility |
| shadow-glow-amber distinct from warning | 29-02 | Amber-500 specific for cart progress bar |
| shadow-hint-sm/md for compound shadows | 29-02 | Brand-tinted gradient shadows for hints/dropdowns |
| Framer Motion boxShadow kept numeric | 29-02 | Animation interpolation requires numeric values |
| inputFocus uses CSS variable tokens | 29-02 | Discrete state changes work with CSS vars |
| duration-[Nms] severity upgraded to warning | 29-05 | Enforce motion tokens during Phase 29 |
| Framer Motion spring physics allowed | 29-05 | Numeric durations needed for spring calculations |
| AppHeader uses blur(var(--blur-2xl)) | 29-05 | Consistent with CommandPalette glass pattern |
| CSS transitions use --duration-slow --ease-out | 29-06 | 0.3s mapped to closest token (350ms) |
| FM durations documented not changed | 29-06 | Spring physics requires numeric values |

### Phase 27 Progress (Complete)

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

**27-04 outcomes:**
- Created 14 gradient utility classes in globals.css (bg-gradient-hero, bg-gradient-primary, bg-gradient-progress, etc.)
- Cart components migrated: CartBar, CartItem, CartSummary, FlyToCart, CartEmptyState
- Menu/skeleton components migrated: skeleton.tsx, EmptyState.tsx, CardImage.tsx, CheckoutSummaryV8
- Auth components migrated: AuthModal, MagicLinkSent, OnboardingTour, WelcomeAnimation
- Layout components migrated: AccountIndicator, AppHeader, DrawerUserSection
- Admin components migrated: MetricCard, DriverListTable
- Zero hardcoded Tailwind gradient colors remaining in migrated files
- All gradients use CSS variables for automatic light/dark theme adaptation

**27-05 outcomes (gap closure):**
- AddButton migrated: text-white to text-text-inverse on both Add and success checkmark states
- AddButton migrated: bg-green-500 to bg-green semantic token
- UnifiedMenuItemCard sold-out overlay migrated: bg-black/50 to bg-overlay
- DrawerUserSection migrated: text-white to text-text-inverse on avatar and Sign In button
- Zero text-white/bg-black violations in AddButton, UnifiedMenuItemCard, DrawerUserSection

**27-06 outcomes (gap closure):**
- StatusTimeline migrated: text-text-inverse, border-surface-primary, bg-surface-primary
- AuthModal migrated: bg-overlay-light, bg-surface-primary/80 for glassmorphism
- MagicLinkSent migrated: bg-surface-primary for envelope animation
- progress.tsx migrated: bg-gradient-progress CSS utility
- Zero hardcoded white/black colors in all four components

**CommandPalette fix (orchestrator):**
- Mobile close button: bg-white/90 dark:bg-zinc-800/90 → bg-surface-primary/90
- Text color: text-zinc-600 dark:text-zinc-300 → text-text-secondary
- Border: border-white/20 dark:border-white/10 → border-border/20
- Command wrapper: inline rgba(255,255,255,0.85) → var(--color-surface-primary-85)
- Added --color-surface-primary-85 token to tokens.css (light: rgba(255,255,255,0.85), dark: rgba(0,0,0,0.85))
- Phase 27 gap closure complete - all color tokens migrated

### Phase 28 Progress

**28-01 outcomes:**
- Added text-2xs token to tokens.css (0.625rem / 10px with line-height 1.4)
- Mapped text-2xs utility in tailwind.config.ts with CSS variable references
- Added ESLint rules catching arbitrary font sizes (text-[Npx])
- Added ESLint rules catching arbitrary margin/padding/gap values (m-[Npx], p-[Npx], gap-[Npx])
- Added ESLint rules for inline fontSize and fontWeight in style objects
- Infrastructure ready for typography/spacing migration in 28-02 and 28-03

**28-02 outcomes:**
- Zero text-[10px] violations remaining in codebase
- Zero text-[11px] violations remaining in codebase
- 7 component files migrated to text-2xs or text-xs
- Badge, NavDots, DietaryBadges, TimeSlotPicker, CheckoutStepperV8, CheckoutLayout, DrawerFooter updated
- 11px font sizes rounded to text-xs (12px) for badges - visually imperceptible

**28-03 outcomes:**
- Added --tabs-offset: 72px token to tokens.css LAYOUT section
- Migrated CategoryTabs and MenuSkeleton from top-[72px] to top-[var(--tabs-offset)]
- Chart components use var(--radius-md) and var(--radius-xl) for borderRadius
- MorphingMenu numeric borderRadius values preserved for animation interpolation
- Phase 28 complete: Layout token enforcement finished

### Phase 33 Progress (Complete)

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

### Phase 34 Progress (Complete)

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

### Phase 29 Progress

**29-01 outcomes:**
- Added 16 shadow tokens (xs, none, inner-sm/md, primary/success/warning/error, nav-top, focus/focus-success/focus-error, text-shadow-sm/md)
- Added 7 blur tokens (none, sm, md, lg, xl, 2xl, 3xl)
- Mapped all new tokens to Tailwind utilities (shadow-xs, backdrop-blur-lg, etc.)
- Added ESLint rules for boxShadow, backdropFilter, filter enforcement
- Enhanced audit-tokens.js with inline shadow/blur detection (40+ shadow-[...] patterns detected)
- Infrastructure ready for shadow/blur migration in 29-02

**29-02 outcomes:**
- Migrated all arbitrary Tailwind shadow values to semantic tokens
- CartSummary: shadow-[amber glow] -> shadow-glow-amber
- CartBar: shadow-[nav-top] -> shadow-nav-top (theme-aware)
- theme-toggle: dark:shadow-[primary glow] -> dark:shadow-glow-primary
- DrawerNavLink: shadow-[primary glow] -> shadow-glow-primary
- SearchTrigger hint: compound gradient -> shadow-hint-sm
- AccountIndicator dropdown: compound gradient -> shadow-hint-md
- Added shadow-glow-amber, shadow-hint-sm, shadow-hint-md tokens (light + dark)
- inputFocus now uses CSS variable tokens (var(--shadow-focus), etc.)
- Animated boxShadow values documented with token equivalents

**29-03 outcomes:**
- Migrated 9 hardcoded blur values in globals.css to CSS variable tokens
- CommandPalette backdrop blur now uses var(--blur-xl)
- Header.tsx dynamic blur documented with token equivalents (8px = --blur-md, 16px = --blur-lg + 4px)
- Modal.tsx verified - already uses Tailwind backdrop-blur-sm utility
- Zero hardcoded blur(Npx) values in globals.css
- All glassmorphism effects use blur tokens

**29-04 outcomes:**
- Zero shadow-[...] arbitrary values remaining in component files
- All static boxShadow styles use CSS variables or Tailwind utilities
- All Framer Motion animated shadows have comments documenting token equivalents
- useLuminance.ts documents dynamic shadow generation with ESLint disable
- Checkout components: documented animated shadows (~--shadow-glow-success, ~--shadow-glow-primary)
- AddressInput: use var(--shadow-focus) for focus state (discrete, not interpolated)
- RevenueChart/PerformanceChart: use var(--shadow-card) and var(--shadow-md) for tooltips
- Layout files converted from shadow-[var(...)] to proper Tailwind utilities

**29-05 outcomes:**
- Fixed AppHeader blur inconsistency: blur(30px) -> blur(var(--blur-2xl))
- Added 4 ESLint rules for motion timing enforcement (transitionDuration, transition, duration-[Nms], delay-[Nms])
- Enhanced audit-tokens.js with 6 new motion timing patterns
- duration-[Nms] upgraded from info to warning severity
- Framer Motion spring physics explicitly allowed in ESLint messages

**29-06 outcomes:**
- CSS transitions tokenized: glass-menu-card and glow-gradient use var(--duration-slow) var(--ease-out)
- Zero hardcoded transition durations remaining in globals.css
- motion-tokens.ts has comprehensive header documenting FM-to-CSS token mapping
- All 6 duration constants have inline CSS equivalent comments
- ROADMAP.md updated: Phase 29 marked complete (6/6 plans)
- Phase 29 complete: All shadows, blur, and motion timing use design system tokens

## Session Continuity

Last session: 2026-01-28
Stopped at: Completed 29-06 (Phase 29 complete)
Resume file: None
Next action: Execute Phase 30 (Mobile Stability) when ready

---

*Updated: 2026-01-28 - Completed Phase 29 (Token Enforcement - Effects)*
