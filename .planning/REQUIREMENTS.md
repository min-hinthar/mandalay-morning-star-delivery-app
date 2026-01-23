# Requirements: Morning Star V8 UI Rewrite

**Defined:** 2026-01-21
**Core Value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.

## v1 Requirements

Requirements for the UI rewrite. Each maps to roadmap phases.

### Foundation / Design System

- [ ] **FOUND-01**: Z-index token system with semantic names (dropdown, sticky, fixed, modal-backdrop, modal, popover, tooltip, toast, max)
- [ ] **FOUND-02**: ESLint/Stylelint rules enforcing tokenized z-index only (no hardcoded values)
- [ ] **FOUND-03**: Color token system with light/dark mode support
- [ ] **FOUND-04**: Motion token system (springs, durations, easings as CSS/JS tokens)
- [ ] **FOUND-05**: GSAP plugin registration and useGSAP patterns established
- [ ] **FOUND-06**: GSAP scroll choreography patterns library
- [ ] **FOUND-07**: Stacking context isolation rules documented and enforced
- [ ] **FOUND-08**: Creative page layouts and effects system

### Overlays / Modals

- [ ] **OVER-01**: Modal dialog component (portal-based, correct z-index)
- [ ] **OVER-02**: Bottom sheet component (mobile, swipe-to-dismiss)
- [ ] **OVER-03**: Side drawer component (desktop, animated)
- [ ] **OVER-04**: Dropdown component (correct stacking, no event swallowing)
- [ ] **OVER-05**: Tooltip component (proper z-index, pointer-events)
- [ ] **OVER-06**: Toast notification system (stacked, dismissible)
- [ ] **OVER-07**: All overlays reset state on route change
- [ ] **OVER-08**: Spring physics animations on overlay open/close
- [ ] **OVER-09**: Backdrop blur effects with proper isolation (no click blocking)

### Navigation / Layout

- [ ] **NAV-01**: Sticky header with cart badge (always clickable)
- [ ] **NAV-02**: Bottom navigation for mobile
- [ ] **NAV-03**: Page container components with consistent spacing
- [ ] **NAV-04**: Mobile menu with automatic close on route change
- [ ] **NAV-05**: Header scroll effects (shrink/blur on scroll)
- [ ] **NAV-06**: Page transition animations (AnimatePresence)
- [ ] **NAV-07**: App shell layout composing header, nav, and content areas

### Cart Experience

- [ ] **CART-01**: Cart drawer/sheet (mobile bottom sheet, desktop side drawer)
- [ ] **CART-02**: Cart item rows with quantity controls
- [ ] **CART-03**: Subtotal and order summary display
- [ ] **CART-04**: Clear cart action with confirmation
- [ ] **CART-05**: Add-to-cart celebration animations
- [ ] **CART-06**: Swipe-to-delete items gesture
- [ ] **CART-07**: Quantity change animations (number morph)
- [ ] **CART-08**: Animated "$ more for free delivery" indicator

### Menu Browsing

- [ ] **MENU-01**: Category tabs with scrollspy behavior
- [ ] **MENU-02**: Menu item cards with effects and motion physics
- [ ] **MENU-03**: Item detail modal/sheet with full information
- [ ] **MENU-04**: Search with autocomplete suggestions
- [ ] **MENU-05**: Skeleton loading states for all menu content
- [ ] **MENU-06**: Staggered list reveal animations
- [ ] **MENU-07**: Image lazy loading with blur-up placeholder effect
- [ ] **MENU-08**: Animated favorites (heart animation on toggle)
- [ ] **MENU-09**: Placeholder emoji icons for items without images

### Checkout Flow

- [ ] **CHKT-01**: Multi-step checkout form
- [ ] **CHKT-02**: Address selection/management
- [ ] **CHKT-03**: Stripe payment integration (existing, with new UI)
- [ ] **CHKT-04**: Order confirmation page
- [ ] **CHKT-05**: Loading states throughout checkout
- [ ] **CHKT-06**: Animated step progress indicator
- [ ] **CHKT-07**: Form field micro-interactions (focus, validation, error)
- [ ] **CHKT-08**: Success celebration animation on order completion
- [ ] **CHKT-09**: Animated "$ more for free delivery" in checkout summary

### Quality / Testing

- [ ] **TEST-01**: E2E test: header clickability on all routes
- [ ] **TEST-02**: E2E test: cart drawer open/close/opacity
- [ ] **TEST-03**: E2E test: dropdown/tooltip visibility and dismissal
- [ ] **TEST-04**: E2E test: overlay does not block background when closed
- [ ] **TEST-05**: Visual regression snapshots for shells and overlays

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

Which phases cover which requirements. Updated during roadmap creation.

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
| CHKT-01 | Phase 6 | Pending |
| CHKT-02 | Phase 6 | Pending |
| CHKT-03 | Phase 6 | Pending |
| CHKT-04 | Phase 6 | Pending |
| CHKT-05 | Phase 6 | Pending |
| CHKT-06 | Phase 6 | Pending |
| CHKT-07 | Phase 6 | Pending |
| CHKT-08 | Phase 6 | Pending |
| CHKT-09 | Phase 6 | Pending |
| TEST-01 | Phase 7 | Pending |
| TEST-02 | Phase 7 | Pending |
| TEST-03 | Phase 7 | Pending |
| TEST-04 | Phase 7 | Pending |
| TEST-05 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0

---
*Requirements defined: 2026-01-21*
*Last updated: 2026-01-23 after Phase 5 completion*
