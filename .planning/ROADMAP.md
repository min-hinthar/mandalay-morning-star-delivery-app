# Roadmap: Morning Star V8 UI Rewrite

## Overview

A complete frontend rewrite transforming the Morning Star delivery app from a z-index chaos (50+ hardcoded values, overlays blocking clicks, state persisting across routes) into a delightfully animated, reliably clickable customer experience. The journey establishes a tokenized foundation, builds portal-based overlays, composes navigation and layouts, then delivers the complete menu-to-checkout flow with "over-the-top" animation throughout.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, ...): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Token System** - Z-index tokens, GSAP setup, stacking rules, lint enforcement
- [x] **Phase 2: Overlay Infrastructure** - Portal-based modals, sheets, drawers, dropdowns, tooltips, toasts with route-aware cleanup
- [x] **Phase 3: Navigation & Layout** - Sticky header, bottom nav, page containers, mobile menu, scroll effects, page transitions
- [x] **Phase 4: Cart Experience** - Cart drawer/sheet, item controls, quantity animations, add-to-cart celebrations
- [x] **Phase 5: Menu Browsing** - Category tabs, item cards, search, item detail modal, loading states, list animations
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
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — Portal, Backdrop primitives, motion tokens, color tokens, useRouteChangeClose and useBodyScrollLock hooks
- [x] 02-02-PLAN.md — Modal dialog (responsive desktop/mobile) and BottomSheet with swipe-to-dismiss
- [x] 02-03-PLAN.md — Side drawer with focus trap and Dropdown without event swallowing
- [x] 02-04-PLAN.md — Tooltip with hover delay and Toast notification system with stacking

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
  6. GSAP scroll choreography tools are available for scroll-triggered animations
  7. Creative page layout tools (reveal effects, parallax) are available for use in feature pages
**Plans**: 5 plans

Plans:
- [x] 03-01-PLAN.md — AppShell layout wrapper and PageContainer spacing component
- [x] 03-02-PLAN.md — Sticky header with scroll-aware shrink/blur effects
- [x] 03-03-PLAN.md — Bottom navigation and mobile menu with auto-close
- [x] 03-04-PLAN.md — GSAP scroll choreography and enhanced page transitions
- [x] 03-05-PLAN.md — Wire Header, BottomNav, and MobileMenu into AppShell

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
**Plans**: 5 plans (4 original + 1 gap closure)

Plans:
- [x] 04-01-PLAN.md — Cart button V8 with animated badge and header integration
- [x] 04-02-PLAN.md — Cart item V8 with swipe-to-delete and quantity animations
- [x] 04-03-PLAN.md — Cart drawer V8 composing BottomSheet/Drawer with order summary
- [x] 04-04-PLAN.md — Fly-to-cart celebration and clear cart confirmation
- [x] 04-05-PLAN.md — Integrate V8 cart components into app (gap closure)

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
**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — Category tabs V8 with scrollspy using useActiveCategory hook
- [x] 05-02-PLAN.md — Menu item card V8 with hover/tap effects, blur image, favorites, emoji placeholder
- [x] 05-03-PLAN.md — Item detail sheet V8 using Phase 2 Modal/BottomSheet overlays
- [x] 05-04-PLAN.md — Search input V8 with debounced autocomplete suggestions
- [x] 05-05-PLAN.md — Menu integration with GSAP stagger, skeletons, and full composition

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
**Plans**: 5 plans

Plans:
- [ ] 06-01-PLAN.md — Checkout page step transitions with AnimatePresence and CheckoutStepperV8
- [ ] 06-02-PLAN.md — Form field micro-interactions with AnimatedFormField and AddressFormV8
- [ ] 06-03-PLAN.md — Address step V8 with animated cards and responsive overlays (Modal/BottomSheet)
- [ ] 06-04-PLAN.md — Checkout summary V8 with animated free delivery progress and PaymentStepV8
- [ ] 06-05-PLAN.md — Order confirmation V8 with confetti burst and animated success celebration

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
| 2. Overlay Infrastructure | 4/4 | ✓ Complete | 2026-01-22 |
| 3. Navigation & Layout | 5/5 | ✓ Complete | 2026-01-22 |
| 4. Cart Experience | 5/5 | ✓ Complete | 2026-01-22 |
| 5. Menu Browsing | 5/5 | ✓ Complete | 2026-01-23 |
| 6. Checkout Flow | 0/5 | Planned | - |
| 7. Quality & Testing | 0/3 | Not started | - |

---
*Roadmap created: 2026-01-21*
*Phase 1 planned: 2026-01-22*
*Phase 1 revised: 2026-01-22 (scope reduced - deferred FOUND-03,04,06,08 to later phases)*
*Phase 1 gap closure: 2026-01-22 (added 01-04, 01-05 to fix verification gaps)*
*Phase 2 planned: 2026-01-22*
*Phase 2 complete: 2026-01-22*
*Phase 3 planned: 2026-01-22*
*Phase 3 revised: 2026-01-22 (added 03-05 integration plan, clarified success criteria #7)*
*Phase 3 complete: 2026-01-22*
*Phase 4 planned: 2026-01-22*
*Phase 4 gap closure: 2026-01-22 (added 04-05 to integrate V8 components)*
*Phase 4 complete: 2026-01-22*
*Phase 5 planned: 2026-01-22*
*Phase 5 complete: 2026-01-23*
*Phase 6 planned: 2026-01-23*
*Depth: comprehensive (8-12 phases, 5-10 plans each)*
*Total requirements: 55 | Mapped: 55 | Coverage: 100%*
