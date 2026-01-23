# Requirements Archive: v1 V8 UI Rewrite

**Archived:** 2026-01-23
**Status:** SHIPPED

This is the archived requirements specification for v1 V8 UI Rewrite.
For current requirements, see `.planning/REQUIREMENTS.md` (created for next milestone).

---

# Requirements: Morning Star V8 UI Rewrite

**Defined:** 2026-01-21
**Core Value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.

## v1 Requirements

Requirements for the UI rewrite. Each maps to roadmap phases.

### Foundation / Design System

- [x] **FOUND-01**: Z-index token system with semantic names (dropdown, sticky, fixed, modal-backdrop, modal, popover, tooltip, toast, max)
- [x] **FOUND-02**: ESLint/Stylelint rules enforcing tokenized z-index only (no hardcoded values)
- [x] **FOUND-03**: Color token system with light/dark mode support
- [x] **FOUND-04**: Motion token system (springs, durations, easings as CSS/JS tokens)
- [x] **FOUND-05**: GSAP plugin registration and useGSAP patterns established
- [x] **FOUND-06**: GSAP scroll choreography patterns library
- [x] **FOUND-07**: Stacking context isolation rules documented and enforced
- [x] **FOUND-08**: Creative page layouts and effects system

### Overlays / Modals

- [x] **OVER-01**: Modal dialog component (portal-based, correct z-index)
- [x] **OVER-02**: Bottom sheet component (mobile, swipe-to-dismiss)
- [x] **OVER-03**: Side drawer component (desktop, animated)
- [x] **OVER-04**: Dropdown component (correct stacking, no event swallowing)
- [x] **OVER-05**: Tooltip component (proper z-index, pointer-events)
- [x] **OVER-06**: Toast notification system (stacked, dismissible)
- [x] **OVER-07**: All overlays reset state on route change
- [x] **OVER-08**: Spring physics animations on overlay open/close
- [x] **OVER-09**: Backdrop blur effects with proper isolation (no click blocking)

### Navigation / Layout

- [x] **NAV-01**: Sticky header with cart badge (always clickable)
- [x] **NAV-02**: Bottom navigation for mobile
- [x] **NAV-03**: Page container components with consistent spacing
- [x] **NAV-04**: Mobile menu with automatic close on route change
- [x] **NAV-05**: Header scroll effects (shrink/blur on scroll)
- [x] **NAV-06**: Page transition animations (AnimatePresence)
- [x] **NAV-07**: App shell layout composing header, nav, and content areas

### Cart Experience

- [x] **CART-01**: Cart drawer/sheet (mobile bottom sheet, desktop side drawer)
- [x] **CART-02**: Cart item rows with quantity controls
- [x] **CART-03**: Subtotal and order summary display
- [x] **CART-04**: Clear cart action with confirmation
- [x] **CART-05**: Add-to-cart celebration animations
- [x] **CART-06**: Swipe-to-delete items gesture
- [x] **CART-07**: Quantity change animations (number morph)
- [x] **CART-08**: Animated "$ more for free delivery" indicator

### Menu Browsing

- [x] **MENU-01**: Category tabs with scrollspy behavior
- [x] **MENU-02**: Menu item cards with effects and motion physics
- [x] **MENU-03**: Item detail modal/sheet with full information
- [x] **MENU-04**: Search with autocomplete suggestions
- [x] **MENU-05**: Skeleton loading states for all menu content
- [x] **MENU-06**: Staggered list reveal animations
- [x] **MENU-07**: Image lazy loading with blur-up placeholder effect
- [x] **MENU-08**: Animated favorites (heart animation on toggle)
- [x] **MENU-09**: Placeholder emoji icons for items without images

### Checkout Flow

- [x] **CHKT-01**: Multi-step checkout form
- [x] **CHKT-02**: Address selection/management
- [x] **CHKT-03**: Stripe payment integration (existing, with new UI)
- [x] **CHKT-04**: Order confirmation page
- [x] **CHKT-05**: Loading states throughout checkout
- [x] **CHKT-06**: Animated step progress indicator
- [x] **CHKT-07**: Form field micro-interactions (focus, validation, error)
- [x] **CHKT-08**: Success celebration animation on order completion
- [x] **CHKT-09**: Animated "$ more for free delivery" in checkout summary

### Quality / Testing

- [x] **TEST-01**: E2E test: header clickability on all routes
- [x] **TEST-02**: E2E test: cart drawer open/close/opacity
- [x] **TEST-03**: E2E test: dropdown/tooltip visibility and dismissal
- [x] **TEST-04**: E2E test: overlay does not block background when closed
- [x] **TEST-05**: Visual regression snapshots for shells and overlays

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Admin Flow Rewrite

- **ADMIN-01**: Admin dashboard with new design system
- **ADMIN-02**: Order management with animations
- **ADMIN-03**: Menu management interface

### Driver Flow Rewrite

- **DRIVER-01**: Driver dashboard with new design system
- **DRIVER-02**: Route management interface
- **DRIVER-03**: Delivery tracking animations

### Advanced Features

- **ADV-01**: Haptic feedback on key interactions
- **ADV-02**: Pull-to-refresh on menu
- **ADV-03**: Reduced motion toggle (manual opt-out)
- **ADV-04**: PWA offline support

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Backend/schema changes | Supabase + Stripe contracts stay stable |
| Multi-restaurant marketplace | Not part of Morning Star scope |
| Auto-detect reduced motion | Motion-first by design; manual toggle in v2 |
| Real-time chat | Not core to delivery experience |
| Video content | Storage/bandwidth costs, not needed for meals |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 2 | Complete |
| FOUND-04 | Phase 2 | Complete |
| FOUND-05 | Phase 1 | Complete |
| FOUND-06 | Phase 3 | Complete |
| FOUND-07 | Phase 1 | Complete |
| FOUND-08 | Phase 3 | Complete |
| OVER-01 | Phase 2 | Complete |
| OVER-02 | Phase 2 | Complete |
| OVER-03 | Phase 2 | Complete |
| OVER-04 | Phase 2 | Complete |
| OVER-05 | Phase 2 | Complete |
| OVER-06 | Phase 2 | Complete |
| OVER-07 | Phase 2 | Complete |
| OVER-08 | Phase 2 | Complete |
| OVER-09 | Phase 2 | Complete |
| NAV-01 | Phase 3 | Complete |
| NAV-02 | Phase 3 | Complete |
| NAV-03 | Phase 3 | Complete |
| NAV-04 | Phase 3 | Complete |
| NAV-05 | Phase 3 | Complete |
| NAV-06 | Phase 3 | Complete |
| NAV-07 | Phase 3 | Complete |
| CART-01 | Phase 4 | Complete |
| CART-02 | Phase 4 | Complete |
| CART-03 | Phase 4 | Complete |
| CART-04 | Phase 4 | Complete |
| CART-05 | Phase 4 | Complete |
| CART-06 | Phase 4 | Complete |
| CART-07 | Phase 4 | Complete |
| CART-08 | Phase 4 | Complete |
| MENU-01 | Phase 5 | Complete |
| MENU-02 | Phase 5 | Complete |
| MENU-03 | Phase 5 | Complete |
| MENU-04 | Phase 5 | Complete |
| MENU-05 | Phase 5 | Complete |
| MENU-06 | Phase 5 | Complete |
| MENU-07 | Phase 5 | Complete |
| MENU-08 | Phase 5 | Complete |
| MENU-09 | Phase 5 | Complete |
| CHKT-01 | Phase 6 | Complete |
| CHKT-02 | Phase 6 | Complete |
| CHKT-03 | Phase 6 | Complete |
| CHKT-04 | Phase 6 | Complete |
| CHKT-05 | Phase 6 | Complete |
| CHKT-06 | Phase 6 | Complete |
| CHKT-07 | Phase 6 | Complete |
| CHKT-08 | Phase 6 | Complete |
| CHKT-09 | Phase 6 | Complete |
| TEST-01 | Phase 7 | Complete |
| TEST-02 | Phase 7 | Complete |
| TEST-03 | Phase 7 | Complete |
| TEST-04 | Phase 7 | Complete |
| TEST-05 | Phase 7 | Complete |

**Coverage:**
- v1 requirements: 55 total
- Mapped to phases: 55
- Shipped: 55
- Unmapped: 0

---

## Milestone Summary

**Shipped:** 55 of 55 v1 requirements

**Adjusted:** None — all requirements delivered as planned

**Dropped:** None

---
*Archived: 2026-01-23 as part of v1 milestone completion*
