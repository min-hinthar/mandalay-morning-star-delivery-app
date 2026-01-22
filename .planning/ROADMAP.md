# Roadmap: Morning Star V8 UI Rewrite

## Overview

A complete frontend rewrite transforming the Morning Star delivery app from a z-index chaos (50+ hardcoded values, overlays blocking clicks, state persisting across routes) into a delightfully animated, reliably clickable customer experience. The journey establishes a tokenized foundation, builds portal-based overlays, composes navigation and layouts, then delivers the complete menu-to-checkout flow with "over-the-top" animation throughout.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, ...): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Token System** - Z-index tokens, GSAP setup, stacking rules, lint enforcement
- [ ] **Phase 2: Overlay Infrastructure** - Portal-based modals, sheets, drawers, dropdowns, tooltips, toasts with route-aware cleanup
- [ ] **Phase 3: Navigation & Layout** - Sticky header, bottom nav, page containers, mobile menu, scroll effects, page transitions
- [ ] **Phase 4: Cart Experience** - Cart drawer/sheet, item controls, quantity animations, add-to-cart celebrations
- [ ] **Phase 5: Menu Browsing** - Category tabs, item cards, search, item detail modal, loading states, list animations
- [ ] **Phase 6: Checkout Flow** - Multi-step form, address management, Stripe UI, order confirmation, progress animations
- [ ] **Phase 7: Quality & Testing** - E2E tests for clickability, overlay behavior, visual regression snapshots

## Phase Details

### Phase 1: Foundation & Token System
**Goal**: Establish the infrastructure that prevents z-index chaos and enables consistent animation timing
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-05, FOUND-07
**Deferred to later phases**: FOUND-03 (color tokens), FOUND-04 (motion tokens), FOUND-06 (scroll choreography), FOUND-08 (creative layouts)
**Success Criteria** (what must be TRUE):
  1. Z-index values are defined as CSS custom properties and consumed via TailwindCSS utilities (no hardcoded z-50, z-100, etc.)
  2. ESLint/Stylelint fails the build when hardcoded z-index values are detected
  3. GSAP plugins (ScrollTrigger, SplitText) can be used in components with proper cleanup via useGSAP
  4. Stacking context rules are documented and isolation boundaries are established
**Plans**: 5 plans (3 original + 2 gap closure)

Plans:
- [x] 01-01-PLAN.md — Z-index token system with TailwindCSS @theme integration and TypeScript constants
- [x] 01-02-PLAN.md — GSAP plugin registration (gsap, @gsap/react) and animation presets
- [x] 01-03-PLAN.md — ESLint/Stylelint z-index enforcement and stacking context documentation
- [x] 01-04-PLAN.md — Fix zIndexVar CSS variable names (gap closure)
- [x] 01-05-PLAN.md — Legacy z-index migration plan and build fix (gap closure)

### Phase 2: Overlay Infrastructure
**Goal**: Build portal-based overlay components that never block clicks and reset on route changes
**Depends on**: Phase 1 (tokens, isolation boundaries)
**Requirements**: OVER-01, OVER-02, OVER-03, OVER-04, OVER-05, OVER-06, OVER-07, OVER-08, OVER-09, FOUND-03, FOUND-04
**Success Criteria** (what must be TRUE):
  1. Modal dialog opens centered with backdrop, closes on escape/outside click, does not block content behind when closed
  2. Bottom sheet slides up on mobile with swipe-to-dismiss gesture and spring physics
  3. Side drawer slides in from edge with smooth animation and proper focus trapping
  4. Dropdown menu opens below trigger without swallowing click events or preventing form submissions
  5. All overlays automatically close when user navigates to a different route
  6. Color tokens with light/dark mode support are available for overlay theming
  7. Motion tokens (springs, durations) are available as CSS variables and JS constants
**Plans**: TBD

Plans:
- [ ] 02-01: OverlayProvider and portal infrastructure
- [ ] 02-02: Modal dialog and bottom sheet components
- [ ] 02-03: Side drawer and dropdown components
- [ ] 02-04: Tooltip and toast notification system

### Phase 3: Navigation & Layout
**Goal**: Create the app shell with sticky header, bottom nav, and page containers that are always clickable
**Depends on**: Phase 2 (overlays for header dropdowns, mobile menu)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, NAV-07, FOUND-06, FOUND-08
**Success Criteria** (what must be TRUE):
  1. Header is sticky at top of viewport and all buttons (cart, profile, menu) are clickable on every page
  2. Mobile bottom navigation shows on small screens with active state indicators
  3. Mobile menu closes automatically when user taps a navigation link
  4. Header shrinks and blurs subtly when user scrolls down
  5. Page transitions animate smoothly between routes without layout shift
  6. GSAP scroll choreography patterns are available for scroll-triggered animations
  7. Creative page layouts with reveal effects are implemented
**Plans**: TBD

Plans:
- [ ] 03-01: App shell layout and page containers
- [ ] 03-02: Sticky header with scroll effects
- [ ] 03-03: Bottom navigation and mobile menu
- [ ] 03-04: Page transition animations

### Phase 4: Cart Experience
**Goal**: Deliver a delightful cart drawer with smooth animations and intuitive item management
**Depends on**: Phase 2 (drawer component), Phase 3 (header cart badge)
**Requirements**: CART-01, CART-02, CART-03, CART-04, CART-05, CART-06, CART-07, CART-08
**Success Criteria** (what must be TRUE):
  1. Cart drawer opens as bottom sheet on mobile and side drawer on desktop with correct opacity/backdrop
  2. User can adjust item quantities with animated number transitions
  3. User can swipe an item to reveal delete action on mobile
  4. Add-to-cart triggers a celebration animation (item flies to cart badge, badge pulses)
  5. Cart shows subtotal and "$ more for free delivery" indicator with animated progress
**Plans**: TBD

Plans:
- [ ] 04-01: Cart drawer/sheet responsive layout
- [ ] 04-02: Cart item rows with quantity controls
- [ ] 04-03: Add-to-cart celebration and swipe-to-delete
- [ ] 04-04: Order summary with animated indicators

### Phase 5: Menu Browsing
**Goal**: Enable users to discover, search, and select menu items with engaging animations
**Depends on**: Phase 2 (item detail modal), Phase 4 (add-to-cart flow)
**Requirements**: MENU-01, MENU-02, MENU-03, MENU-04, MENU-05, MENU-06, MENU-07, MENU-08, MENU-09
**Success Criteria** (what must be TRUE):
  1. Category tabs scroll horizontally and highlight based on scroll position (scrollspy)
  2. Menu item cards have hover/tap effects and open detail modal/sheet on click
  3. Search input shows autocomplete suggestions as user types
  4. Menu content shows skeleton loading states before data loads
  5. Menu items animate in with staggered reveal when scrolling into view
**Plans**: TBD

Plans:
- [ ] 05-01: Category tabs with scrollspy
- [ ] 05-02: Menu item cards with motion effects
- [ ] 05-03: Item detail modal/sheet
- [ ] 05-04: Search with autocomplete
- [ ] 05-05: Loading states and list animations

### Phase 6: Checkout Flow
**Goal**: Guide users through a polished multi-step checkout with clear progress and celebration on completion
**Depends on**: Phase 4 (cart data), Phase 3 (page layout)
**Requirements**: CHKT-01, CHKT-02, CHKT-03, CHKT-04, CHKT-05, CHKT-06, CHKT-07, CHKT-08, CHKT-09
**Success Criteria** (what must be TRUE):
  1. Checkout displays multi-step progress indicator showing current step and completed steps
  2. User can select or add a delivery address before proceeding to payment
  3. Stripe payment form renders correctly and processes payment (using existing integration)
  4. Order confirmation page displays success celebration animation
  5. Form fields show micro-interactions on focus, validation feedback, and animated error states
**Plans**: TBD

Plans:
- [ ] 06-01: Multi-step checkout structure
- [ ] 06-02: Address selection and management
- [ ] 06-03: Stripe payment UI integration
- [ ] 06-04: Order confirmation and success celebration
- [ ] 06-05: Form field micro-interactions

### Phase 7: Quality & Testing
**Goal**: Ensure clickability and overlay behavior are verified through automated tests
**Depends on**: Phase 3 (header), Phase 2 (overlays), Phase 4 (cart)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. E2E test verifies header buttons are clickable on menu page, home page, and checkout page
  2. E2E test verifies cart drawer opens with visible content and closes completely
  3. E2E test verifies dropdowns appear above page content and dismiss on outside click
  4. E2E test verifies closed overlays do not intercept clicks on background content
  5. Visual regression snapshots exist for header, overlays, and cart drawer
**Plans**: TBD

Plans:
- [ ] 07-01: E2E tests for header and navigation clickability
- [ ] 07-02: E2E tests for overlay behavior
- [ ] 07-03: Visual regression snapshots

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Token System | 5/5 | ✓ Complete | 2026-01-22 |
| 2. Overlay Infrastructure | 0/4 | Not started | - |
| 3. Navigation & Layout | 0/4 | Not started | - |
| 4. Cart Experience | 0/4 | Not started | - |
| 5. Menu Browsing | 0/5 | Not started | - |
| 6. Checkout Flow | 0/5 | Not started | - |
| 7. Quality & Testing | 0/3 | Not started | - |

---
*Roadmap created: 2026-01-21*
*Phase 1 planned: 2026-01-22*
*Phase 1 revised: 2026-01-22 (scope reduced - deferred FOUND-03,04,06,08 to later phases)*
*Phase 1 gap closure: 2026-01-22 (added 01-04, 01-05 to fix verification gaps)*
*Depth: comprehensive (8-12 phases, 5-10 plans each)*
*Total requirements: 55 | Mapped: 55 | Coverage: 100%*
