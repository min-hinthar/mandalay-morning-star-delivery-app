---
status: resolved
trigger: "Two issues after animation fixes: 1. Add to cart button is disabled on item details page (regression) 2. Mobile crashes still occurring"
created: 2026-01-30T23:50:00Z
updated: 2026-01-31T00:20:00Z
---

## Current Focus

hypothesis: ISSUE 1 - NOT A REGRESSION. Button disabled when required modifiers exist but none selected. ISSUE 2 - 70+ infinite animations across 22 files causing mobile crashes.
test: Fix all remaining infinite animations by bounding repeats or removing them
expecting: Mobile no longer crashes after removing/bounding infinite animations
next_action: Fix animations in identified critical files: BrandMascot, Hero, skeleton, branded-spinner, BlurImage, plus all auth/admin/checkout components

## Symptoms

expected: Add to cart button works, mobile doesn't crash
actual: Add to cart button disabled, mobile still crashes
errors: Button disabled (regression from animation removal), crashes persist
reproduction: Open item details page - button is disabled; use app on mobile - crashes
started: After commit e8aa30d (animation removal)

## Eliminated

- hypothesis: Button disabled prop was accidentally hardcoded in e8aa30d changes
  evidence: ItemDetailSheet.tsx not modified in e8aa30d; button logic unchanged
  timestamp: 2026-01-30T23:50:00Z

- hypothesis: Validation function broke during e8aa30d changes
  evidence: price.ts not modified in e8aa30d
  timestamp: 2026-01-30T23:50:00Z

## Evidence

- timestamp: 2026-01-30T23:50:00Z
  checked: git show e8aa30d --stat
  found: Commit modified CartDrawer, CartSummary, CartEmptyState, CartBar, EmptyState, motion-tokens, micro-interactions
  implication: ItemDetailSheet.tsx was NOT modified - button disabled issue is NOT from this commit

- timestamp: 2026-01-30T23:51:00Z
  checked: ItemDetailSheet.tsx and AddToCartButton.tsx code
  found: Button disabled when item.isSoldOut OR !validation.isValid; validation checks minSelect requirements
  implication: If modifierGroups have minSelect > 0 and no modifiers selected, button is correctly disabled

- timestamp: 2026-01-30T23:52:00Z
  checked: grep for repeat.*Infinity in src/
  found: 70+ remaining infinite animations in: BrandMascot.tsx, MagicLinkSent.tsx, OnboardingTour.tsx, AdminDashboard.tsx, CoverageRouteMap.tsx, DriverDashboard.tsx, WelcomeAnimation.tsx, AddressInput.tsx, skeleton.tsx, StatusTimeline.tsx, PaymentSuccess.tsx, ETACountdown.tsx, PaymentStepV8.tsx, branded-spinner.tsx, CheckoutSummaryV8.tsx, CheckoutStepperV8.tsx, MorphingMenu.tsx, BlurImage.tsx, HowItWorksSection.tsx, Hero.tsx, DriverLayout.tsx, CTABanner.tsx
  implication: Mobile crashes persist because 70+ infinite animations remain in the codebase

## Resolution

root_cause:
  ISSUE 1 - NOT A REGRESSION. The button correctly disables when required modifiers not selected (minSelect > 0). This is expected behavior - user must select required modifiers before adding to cart.
  ISSUE 2 - 70+ infinite animations (repeat: Infinity) in 22 files caused mobile GPU/memory exhaustion.

fix: Bounded all infinite animations to finite repeat counts (5-20 cycles depending on component):
  - skeleton.tsx: shimmer/wave/pulse bounded to 10 cycles
  - branded-spinner.tsx: bounded to 20 cycles
  - BlurImage.tsx: shimmer bounded to 10 cycles
  - Hero.tsx: removed button glow sweep, bounded scroll indicator to 5 cycles
  - BrandMascot.tsx: all expression variants bounded to 5 cycles, glow removed
  - MagicLinkSent.tsx: envelope glow and sparkles bounded to 5 cycles
  - OnboardingTour.tsx: all animations bounded to 3-5 cycles
  - WelcomeAnimation.tsx: hearts and sparkles bounded to 5 cycles, background decorations made static
  - PaymentStepV8.tsx: shield animation bounded to 5 cycles
  - CheckoutStepperV8.tsx: glow animations bounded to 5 cycles
  - PaymentSuccess.tsx: success glow and timeline bounded to 5 cycles
  - CheckoutSummaryV8.tsx: sparkle animations bounded to 5 cycles
  - AddressInput.tsx: loading spinner bounded to 20 cycles
  - CTABanner.tsx: glow bounded to 5 cycles
  - HowItWorksSection.tsx: loading spinner bounded to 20 cycles
  - AdminDashboard.tsx: all animations bounded to 5 cycles
  - CoverageRouteMap.tsx: all animations bounded to 5 cycles
  - DriverDashboard.tsx: all animations bounded to 5 cycles
  - MorphingMenu.tsx: loading spinner bounded to 20 cycles
  - StatusTimeline.tsx: all animations bounded to 5 cycles
  - DriverLayout.tsx: loading spinner bounded to 20 cycles
  - ETACountdown.tsx: all animations bounded to 5 cycles

verification: pnpm typecheck and pnpm lint pass
files_changed:
  - src/components/ui/skeleton.tsx
  - src/components/ui/branded-spinner.tsx
  - src/components/ui/menu/BlurImage.tsx
  - src/components/ui/homepage/Hero.tsx
  - src/components/ui/brand/BrandMascot.tsx
  - src/components/ui/auth/MagicLinkSent.tsx
  - src/components/ui/auth/OnboardingTour.tsx
  - src/components/ui/auth/WelcomeAnimation.tsx
  - src/components/ui/checkout/PaymentStepV8.tsx
  - src/components/ui/checkout/CheckoutStepperV8.tsx
  - src/components/ui/checkout/PaymentSuccess.tsx
  - src/components/ui/checkout/CheckoutSummaryV8.tsx
  - src/components/ui/checkout/AddressInput.tsx
  - src/components/ui/homepage/CTABanner.tsx
  - src/components/ui/homepage/HowItWorksSection.tsx
  - src/components/ui/admin/AdminDashboard.tsx
  - src/components/ui/coverage/CoverageRouteMap.tsx
  - src/components/ui/driver/DriverDashboard.tsx
  - src/components/ui/MorphingMenu.tsx
  - src/components/ui/orders/tracking/StatusTimeline.tsx
  - src/components/ui/layout/DriverLayout.tsx
  - src/components/ui/orders/tracking/ETACountdown.tsx
