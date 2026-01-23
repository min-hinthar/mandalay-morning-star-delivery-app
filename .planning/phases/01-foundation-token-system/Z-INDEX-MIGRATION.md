# Z-Index Migration Tracking

## Status

**Total violations:** 64
**Files affected:** 28
**Rule severity:** warn (downgraded from error in 01-05-PLAN.md)
**Target:** Upgrade back to error after Phase 4 component rebuilds

## Migration Strategy

1. **Phase 1 (Complete):** Token system, linting rules at warn
2. **Phase 2-4:** Components rebuilt with proper z-index tokens
3. **Post-Phase 4:** Upgrade rules to error, clean up any remaining violations

## Files with Violations

| File | Violations | Migration Phase |
|------|------------|-----------------|
| src/components/auth/WelcomeAnimation.tsx | 1 | Phase 3 (Auth) |
| src/components/cart/CartAnimations.tsx | 1 | Phase 4 (Cart) |
| src/components/checkout/TimeSlotPicker.tsx | 2 | Phase 4 (Checkout) |
| src/components/driver/PhotoCapture.tsx | 1 | Post-V1 (Driver) |
| src/components/homepage/CoverageSection.tsx | 2 | Phase 2 (Homepage) |
| src/components/homepage/FloatingFood.tsx | 6 | Phase 2 (Homepage) |
| src/components/homepage/Hero.tsx | 5 | Phase 2 (Homepage) |
| src/components/homepage/HomepageHero.tsx | 2 | Phase 2 (Homepage) |
| src/components/homepage/HomepageMenuSection.tsx | 1 | Phase 2 (Homepage) |
| src/components/homepage/HowItWorksTimeline.tsx | 2 | Phase 2 (Homepage) |
| src/components/homepage/TestimonialsSection.tsx | 1 | Phase 2 (Homepage) |
| src/components/homepage/Timeline.tsx | 1 | Phase 2 (Homepage) |
| src/components/layout/footer.tsx | 2 | Phase 2 (Layout) |
| src/components/menu/CategoryCarousel.tsx | 4 | Phase 3 (Menu) |
| src/components/menu/ItemDetail.tsx | 1 | Phase 3 (Menu) |
| src/components/menu/MenuItemCard.tsx | 4 | Phase 3 (Menu) |
| src/components/menu/MenuLayout.tsx | 1 | Phase 3 (Menu) |
| src/components/menu/category-tabs.tsx | 3 | Phase 3 (Menu) |
| src/components/menu/item-detail-modal.tsx | 2 | Phase 3 (Menu) |
| src/components/menu/menu-item-card.tsx | 3 | Phase 3 (Menu) |
| src/components/menu/menu-skeleton.tsx | 1 | Phase 3 (Menu) |
| src/components/tracking/DeliveryMap.tsx | 4 | Phase 5 (Tracking) |
| src/components/tracking/TrackingMap.tsx | 3 | Phase 5 (Tracking) |
| src/components/tracking/TrackingPageClient.tsx | 1 | Phase 5 (Tracking) |
| src/components/ui/Carousel.tsx | 1 | Phase 2 (UI) |
| src/components/ui/Modal.tsx | 1 | Phase 2 (UI) |
| src/components/ui/TabSwitcher.tsx | 7 | Phase 2 (UI) |
| src/components/ui/overlay-base.tsx | 1 | Phase 2 (UI) |

## Violation Types

| Type | Count | Pattern |
|------|-------|---------|
| Tailwind z-* classes (z-10, z-20, etc.) | 57 | Use z-modal, z-dropdown, etc. |
| Inline zIndex in style objects | 7 | Use zIndex.modal from tokens |
| Total | 64 | |

## Phase Breakdown

| Phase | Files | Violations |
|-------|-------|------------|
| Phase 2 (Homepage/UI) | 12 | 31 |
| Phase 3 (Menu/Auth) | 8 | 20 |
| Phase 4 (Cart/Checkout) | 2 | 3 |
| Phase 5 (Tracking) | 3 | 8 |
| Post-V1 (Driver) | 1 | 1 |
| **Total** | **28** | **64** |

## Notes

- FloatingFood.tsx has 6 violations (all inline zIndex) - high priority
- TabSwitcher.tsx has 7 violations - complex component, may need careful refactor
- Driver components excluded from V1 scope
- Reference: docs/STACKING-CONTEXT.md for token mapping
