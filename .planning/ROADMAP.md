# Roadmap: Morning Star Delivery App

## Milestones

- v1.0 MVP - Phases 1-8 (shipped 2026-01-23)
- v1.1 Tech Debt - Phases 9-14 (shipped 2026-01-23)
- v1.2 Playful UI Overhaul - Phases 15-24 (shipped 2026-01-27)
- v1.3 Full Codebase Consolidation - Phases 25-34 (shipped 2026-01-28)
- v1.4 Mobile Excellence - Phases 35-39 (shipped 2026-02-05)
- v1.5 Performance & Repo Health - Phases 40-47 (shipped 2026-02-07)
- v1.6 Production Polish - Phases 48-57 (in progress)

## v1.6 Production Polish

### Overview

Final production-readiness pass before public launch. Ten phases covering safety net infrastructure, branded error/404 pages, data foundation for settings, customer and admin settings UI, cart validation, premium auth experience, transactional email system, search enhancements, driver offline sync hardening, and admin/driver visual polish. Infrastructure and error handling first, feature work in the middle, visual polish last to avoid animation regressions.

### Phases

- [x] **Phase 48: Error Boundaries & Loading States** - Safety net for all route segments
- [x] **Phase 49: Branded 404 & Error Pages** - Premium error UX with mascot and navigation
- [x] **Phase 50: Data Foundation & Admin Settings** - DB migration + admin settings backend/UI
- [x] **Phase 51: Customer Settings** - Settings page with dietary, delivery, notification preferences
- [x] **Phase 52: Cart Validation & Cart Page** - Hydration-aware validation + full cart page
- [ ] **Phase 53: Auth Experience** - Branded auth forms, social login, premium animations
- [ ] **Phase 54: Email System** - Transactional emails via Resend + React Email
- [ ] **Phase 55: Search Enhancement** - Fuzzy matching, categories, thumbnails
- [ ] **Phase 56: Driver Offline Sync** - Queue consolidation with exponential backoff
- [ ] **Phase 57: Admin & Driver Polish** - Premium visual finish across all admin/driver pages

## Phase Details

### Phase 48: Error Boundaries & Loading States
**Goal**: Every route segment has error recovery and loading feedback -- no white screens anywhere
**Depends on**: Nothing (first phase -- safety net before all feature work)
**Requirements**: INFR-01, INFR-02, ERRP-06
**Success Criteria** (what must be TRUE):
  1. Navigating to any route that throws an error shows a styled error page with retry action (not a white screen)
  2. All admin pages show skeleton/shimmer loading states while data fetches
  3. Error boundaries use CSS-only animations (no Framer Motion imports in error.tsx files)
**Plans**: 2 plans
**Notes**: ~25 new/modified files. RouteError refactored to CSS-only, legacy error files migrated, all missing error.tsx and loading.tsx files created.

Plans:
- [x] 48-01-PLAN.md — Refactor RouteError to CSS-only animations + migrate 4 legacy error boundaries
- [x] 48-02-PLAN.md — Create 6 missing error.tsx + 19 missing loading.tsx files

### Phase 49: Branded 404 & Error Pages
**Goal**: Users who hit dead ends see a delightful branded page that guides them back
**Depends on**: Phase 48 (error boundary infrastructure exists)
**Requirements**: ERRP-01, ERRP-02, ERRP-03, ERRP-04, ERRP-05
**Success Criteria** (what must be TRUE):
  1. Visiting any non-existent URL shows branded 404 page with mascot, animated background, and navigation links
  2. Error pages display food-themed contextual messaging (not generic "Something went wrong")
  3. 404 page provides working links to home, menu, and orders pages
  4. Error page mascot shows contextual expression matching the error type
**Plans**: 2 plans
**Notes**: Use /frontend-design skill for component creation. CSS-only animations carry over from Phase 48 constraint.

Plans:
- [x] 49-01-PLAN.md — Create shared error page components (ErrorPageShell, FloatingFoodEmojis, ErrorMascot, NavigationCardGrid) + CSS keyframes
- [x] 49-02-PLAN.md — Assemble branded not-found.tsx pages (root, admin, driver) + upgrade RouteError with food-themed personality

### Phase 50: Data Foundation & Admin Settings
**Goal**: Settings infrastructure exists in the database and admin can manage operational settings through the app
**Depends on**: Phase 48 (error boundaries protect admin routes)
**Requirements**: SETT-07, ADMN-01, ADMN-02, ADMN-03, ADMN-04
**Success Criteria** (what must be TRUE):
  1. Admin can view and edit delivery, operations, and notification settings through the app UI
  2. Admin settings persist to Supabase database (not just localStorage)
  3. Admin settings load from database on page open (reflects last saved values, not hardcoded defaults)
  4. Saving admin settings shows success animation confirming the save
  5. Customer settings table exists in Supabase with RLS policies (ready for Phase 51)
**Plans**: 4 plans
**Notes**: customer_settings DB migration is a dependency for email notification preferences (Phase 54). Admin settings follow existing API route patterns.

Plans:
- [x] 50-01-PLAN.md — DB migration 019 (customer_settings table + admin settings expansion) + types/schemas
- [x] 50-02-PLAN.md — Shared save UX components (SaveButton, FloatingUnsavedBar, ToggleSwitch, dialogs)
- [x] 50-03-PLAN.md — Admin settings form expansion + SettingsClient upgrade with premium save UX
- [x] 50-04-PLAN.md — Customer nudge banner on home page + preference counter on admin dashboard

### Phase 51: Customer Settings
**Goal**: Customers can personalize their delivery experience with dietary, notification, and display preferences
**Depends on**: Phase 50 (customer_settings table + SETT-07 sync infrastructure)
**Requirements**: SETT-01, SETT-02, SETT-03, SETT-04, SETT-05, SETT-06
**Success Criteria** (what must be TRUE):
  1. Customer can access settings page from their account (dedicated tab or route)
  2. Customer can set dietary restrictions (vegetarian, gluten-free, nut allergy) and see them reflected on next visit
  3. Customer can set default delivery instructions that persist across orders
  4. Customer can toggle email notification preferences per type (order updates, promotions, reminders)
  5. Customer's theme preference persists across sessions and devices
**Plans**: 5 plans
**Notes**: Use /frontend-design skill. Settings UI follows existing ProfileTab pattern (useState + fetch, not Zustand). SETT-04 (language preference) deferred to future phase.

Plans:
- [x] 51-01-PLAN.md — API route + Zod schemas + settings types
- [x] 51-02-PLAN.md — AccountClient restructure (3 tabs) + SettingsTab container + useCustomerSettings hook
- [x] 51-03-PLAN.md — Preferences section (dietary chips + custom allergies) + Notifications section (expandable cards)
- [x] 51-04-PLAN.md — Display section (theme selector + font size + animation/sound toggles) + localStorage hooks
- [x] 51-05-PLAN.md — Checkout dietary summary card + SettingsNudgeBanner deep-link + full verification

### Phase 52: Cart Validation & Cart Page
**Goal**: Cart reflects reality -- stale items are flagged, prices are current, and the cart page is fully functional
**Depends on**: Phase 48 (error boundaries for checkout route)
**Requirements**: CART-01, CART-02, CART-03, CART-04, CART-05
**Success Criteria** (what must be TRUE):
  1. Opening the cart after a menu change shows visual indicators on sold-out items (badge, gray-out)
  2. Items with changed prices show stale price warning with the updated price
  3. Unavailable items show inline error with remove or replace action
  4. Cart page at /cart is fully implemented with complete cart UI (not a stub)
  5. Cart validation does not fire before Zustand hydration completes (no false positives on fresh page load)
**Plans**: 5 plans
**Notes**: Use /frontend-design skill. Validation gates on Zustand v5 persist.hasHydrated(). No new npm dependencies. Cart page recomposes existing cart drawer components into two-column layout with category grouping and attention section.

Plans:
- [x] 52-01-PLAN.md — Validation infrastructure: types, cart store updateItemPrice, useCartHydrated + useCartValidation hooks
- [x] 52-02-PLAN.md — Validation UI components: ValidationOverlay, PriceChangeBadge, SuggestionRow, AttentionSection
- [x] 52-03-PLAN.md — Full cart page: CartPageContent, CartPageHeader, CartItemGroup, CartPageSummary, CheckoutGate, page.tsx
- [x] 52-04-PLAN.md — Cart drawer validation integration + CartItem validation props + barrel exports
- [x] 52-05-PLAN.md — Animation polish, edge cases, and full phase verification

### Phase 53: Auth Experience
**Goal**: Auth pages feel premium and trustworthy -- branded design, social login, and delightful animations
**Depends on**: Phase 48 (error boundaries for auth routes)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10
**Success Criteria** (what must be TRUE):
  1. Login and signup pages show brand logo, mascot, and animated floating food background
  2. User can sign in with Google OAuth and Apple OAuth via Supabase
  3. Auth form fields animate on focus, step transitions are smooth, and submit shows loading state
  4. Magic link confirmation shows animated envelope; successful login triggers logo morph transition
  5. Forgot password and reset password pages match the premium auth styling
**Plans**: TBD
**Notes**: Use /frontend-design skill. Social login requires Google Cloud Console + Apple Developer Portal config (ops gap noted in research). AnimatePresence must use onExitComplete for focus management -- do not mount/unmount inputs, animate opacity instead. Signup page includes social proof counter.

Plans:
- [ ] 53-01: TBD
- [ ] 53-02: TBD
- [ ] 53-03: TBD

### Phase 54: Email System
**Goal**: Customers receive branded transactional emails for every order lifecycle event
**Depends on**: Phase 50 (customer_settings table for notification preference checks)
**Requirements**: MAIL-01, MAIL-02, MAIL-03, MAIL-04, MAIL-05
**Success Criteria** (what must be TRUE):
  1. Completing an order sends a branded confirmation email with items, totals, delivery window, address, and order number
  2. Cancelling an order sends a cancellation confirmation email
  3. Processing a refund sends a refund notification email
  4. Stripe webhook idempotency table prevents duplicate emails on webhook retries
  5. Email sending respects customer notification preferences from settings
**Plans**: TBD
**Notes**: Install 3 new server-only packages: resend, @react-email/components, @react-email/render. Zero client bundle impact. Verify existing send-order-confirmation Edge Function state (may be stub). Delivery reminder email (MAIL-04) sends day before scheduled delivery. React Email + Tailwind v4 compatibility needs validation during planning.

Plans:
- [ ] 54-01: TBD
- [ ] 54-02: TBD
- [ ] 54-03: TBD

### Phase 55: Search Enhancement
**Goal**: Search finds what customers want even with typos on Burmese dish names
**Depends on**: Nothing (independent feature)
**Requirements**: SRCH-01, SRCH-02, SRCH-03
**Success Criteria** (what must be TRUE):
  1. Searching "mohiga" finds "Mohinga" (fuzzy matching with typo tolerance)
  2. Search results are grouped by category (Soups, Rice, Snacks, etc.)
  3. Search results display food image thumbnails alongside item names
**Plans**: TBD
**Notes**: Use /frontend-design skill. Current search uses `.includes()` which misses typos. Enhance existing CommandPalette/search component.

Plans:
- [ ] 55-01: TBD

### Phase 56: Driver Offline Sync
**Goal**: Driver status updates never get lost -- pending actions retry automatically when connectivity returns
**Depends on**: Phase 48 (error boundaries for driver routes)
**Requirements**: INFR-03, INFR-04
**Success Criteria** (what must be TRUE):
  1. Driver going offline then back online sees pending actions automatically retry with exponential backoff
  2. Offline sync uses a single consolidated queue (not dual Zustand + IndexedDB)
  3. Duplicate status updates do not occur during sync retry (idempotency keys prevent duplicates)
**Plans**: TBD
**Notes**: Highest-risk feature in milestone. Dual-queue architecture (Zustand localStorage + IndexedDB) must be consolidated to one. Planning phase must decide which queue to keep. ~50 lines of code but touches critical driver delivery flow. Schedule late when codebase is stable.

Plans:
- [ ] 56-01: TBD
- [ ] 56-02: TBD

### Phase 57: Admin & Driver Polish
**Goal**: Admin and driver dashboards feel as premium as the customer experience
**Depends on**: Phase 50 (admin settings exist), Phase 56 (driver sync stable)
**Requirements**: POLH-01, POLH-02, POLH-03, POLH-04, POLH-05, POLH-06, POLH-07, POLH-08, POLH-09, POLH-10, POLH-11, POLH-12
**Success Criteria** (what must be TRUE):
  1. All admin loading states use skeleton shimmer (no animate-pulse patterns remaining)
  2. Admin tables (orders, drivers, routes) have premium styling with hover micro-interactions, animated status badges, and card-based layouts
  3. Empty states across admin pages show branded illustrations with helpful messaging
  4. Driver history shows real on-time percentage (computed from data, not hardcoded)
  5. Driver stop detail, admin driver detail, and route detail pages have premium animations matching dashboard quality
**Plans**: TBD
**Notes**: Use /frontend-design skill. Must come LAST -- animation refactoring has caused production regressions before (mobile crashes from timer cleanup, 2026-01-29/30). Take Playwright visual snapshots before/after every change.

Plans:
- [ ] 57-01: TBD
- [ ] 57-02: TBD
- [ ] 57-03: TBD
- [ ] 57-04: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 48 -> 49 -> 50 -> 51 -> 52 -> 53 -> 54 -> 55 -> 56 -> 57

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 48. Error Boundaries & Loading States | v1.6 | 2/2 | Complete | 2026-02-08 |
| 49. Branded 404 & Error Pages | v1.6 | 2/2 | Complete | 2026-02-08 |
| 50. Data Foundation & Admin Settings | v1.6 | 4/4 | Complete | 2026-02-08 |
| 51. Customer Settings | v1.6 | 5/5 | Complete | 2026-02-08 |
| 52. Cart Validation & Cart Page | v1.6 | 5/5 | Complete | 2026-02-08 |
| 53. Auth Experience | v1.6 | 0/3 | Not started | - |
| 54. Email System | v1.6 | 0/3 | Not started | - |
| 55. Search Enhancement | v1.6 | 0/1 | Not started | - |
| 56. Driver Offline Sync | v1.6 | 0/2 | Not started | - |
| 57. Admin & Driver Polish | v1.6 | 0/4 | Not started | - |

---
*Created: 2026-02-07*
*Milestone: v1.6 Production Polish*
*Coverage: 56/56 requirements mapped*
