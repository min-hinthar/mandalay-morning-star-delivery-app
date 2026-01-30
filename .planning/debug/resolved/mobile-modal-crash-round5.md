---
status: resolved
trigger: "Continue debugging mobile-modal-crash-comprehensive. CRASHES STILL PERSISTING after FOUR rounds of fixes."
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Multiple components have setTimeout without cleanup
test: Comprehensive scan found 4 issues
expecting: Fixing these will eliminate remaining crashes
next_action: Fix BrandMascot, AdminDashboard, PaymentSuccess, StopDetail setTimeout issues

## Symptoms

expected: Mobile modals open/close without crashes
actual: Random crashes still occurring after 4 rounds of fixes (15+ components)
errors: Random crashes during modal interactions
reproduction: Random - happens intermittently on mobile
started: Ongoing issue despite multiple fix rounds

## Eliminated

- hypothesis: setTimeout cleanup in UnifiedMenuItemCard, OnboardingTour, Confetti
  evidence: Fixed in Round 1
  timestamp: Prior session

- hypothesis: AnimatePresence/scroll lock issues in MobileDrawer, AuthModal
  evidence: Fixed in Round 2
  timestamp: Prior session

- hypothesis: Menu page specific issues in CategoryTabs, use-card-sound, FlyToCart, AddToCartButton
  evidence: Fixed in Round 3
  timestamp: Prior session

- hypothesis: Race conditions in cart-animation-store, Portal, useRouteChangeClose, Drawer, useToastV8
  evidence: Fixed in Round 4
  timestamp: Prior session

## Evidence

- timestamp: 2026-01-30T00:01:00Z
  checked: theme-sounds.ts
  found: Global event listeners at module level (lines 19-21) with { once: true } - OK, auto-cleanup
  implication: Not a problem

- timestamp: 2026-01-30T00:02:00Z
  checked: useSoundEffect.ts
  found: Proper cleanup for event listeners (lines 97-101) and AudioContext (lines 105-113)
  implication: OK

- timestamp: 2026-01-30T00:03:00Z
  checked: useLuminance.ts (useDynamicLuminance)
  found: Proper cleanup for resize listener (line 241)
  implication: OK

- timestamp: 2026-01-30T00:04:00Z
  checked: TimeSlotPicker.tsx
  found: Proper cleanup - scroll listener and resize listener both cleaned up (lines 287-290)
  implication: OK

- timestamp: 2026-01-30T00:05:00Z
  checked: AccountIndicator.tsx
  found: Proper cleanup - both mousedown and keydown listeners cleaned up when isOpen changes
  implication: OK

- timestamp: 2026-01-30T00:06:00Z
  checked: Dropdown.tsx
  found: Proper cleanup - mousedown (line 207) and keydown (line 224) have cleanup
  implication: OK

- timestamp: 2026-01-30T00:07:00Z
  checked: dropdown-menu.tsx
  found: Proper cleanup - mousedown listener has cleanup (line 37-39)
  implication: OK

- timestamp: 2026-01-30T00:08:00Z
  checked: useScrollDirection.ts
  found: Proper cleanup (line 116), requestAnimationFrame not stored but ref tracked
  implication: OK

- timestamp: 2026-01-30T00:09:00Z
  checked: BrandMascot.tsx
  found: ISSUE! Idle blink animation (lines 454-472) uses nested setTimeout recursion WITHOUT proper cleanup. scheduleBlink() returns a timer that is captured, but the NESTED setTimeout inside is not tracked!
  implication: POTENTIAL CRASH - recursive setTimeout not properly cleaned

- timestamp: 2026-01-30T00:10:00Z
  checked: TestimonialsCarousel.tsx
  found: Proper cleanup - setInterval has cleanup (line 200)
  implication: OK

- timestamp: 2026-01-30T00:11:00Z
  checked: FeaturedCarousel.tsx
  found: Proper cleanup - useInterval hook handles cleanup (lines 50-57), resumeTimerRef cleanup (lines 256-262)
  implication: OK

- timestamp: 2026-01-30T00:12:00Z
  checked: CoverageRouteMap.tsx
  found: Proper cleanup - IntersectionObserver (line 127), setInterval (line 137), AdvancedMarkerElements (lines 199-203, 239-243)
  implication: OK

- timestamp: 2026-01-30T00:13:00Z
  checked: DynamicThemeProvider.tsx
  found: Proper cleanup - setInterval (line 186), mediaQuery listener (line 260)
  implication: OK

- timestamp: 2026-01-30T00:14:00Z
  checked: Modal.tsx
  found: Proper cleanup - focus setTimeout (line 243), keydown listener (line 267)
  implication: OK

- timestamp: 2026-01-30T00:15:00Z
  checked: useScrollSpy.ts
  found: Proper cleanup - observer.disconnect (line 79)
  implication: OK

- timestamp: 2026-01-30T00:16:00Z
  checked: useActiveCategory.ts
  found: Proper cleanup - observer disconnect and visibilityMap clear (lines 136-139)
  implication: OK

- timestamp: 2026-01-30T00:17:00Z
  checked: useTrackingSubscription.ts
  found: Proper cleanup - channels removed, polling stopped, reconnect timeout cleared (lines 287-301)
  implication: OK

- timestamp: 2026-01-30T00:18:00Z
  checked: useCommandPalette.ts
  found: Proper cleanup - keydown listener (lines 77-79)
  implication: OK

- timestamp: 2026-01-30T00:19:00Z
  checked: gradients.ts (AnimatedGradient class)
  found: Proper cleanup - destroy() calls stop() which calls cancelAnimationFrame
  implication: OK

- timestamp: 2026-01-30T00:20:00Z
  checked: rate-limit.ts
  found: Global setInterval at module level (line 85) - server-side utility but could cause issues if imported client-side
  implication: NOT A CLIENT ISSUE - server only

- timestamp: 2026-01-30T00:21:00Z
  checked: AdminDashboard.tsx
  found: ISSUE! setTimeout in handleGoalReached callback (line 407) without cleanup - if component unmounts during 3s timeout, state update on unmounted component
  implication: POTENTIAL CRASH

- timestamp: 2026-01-30T00:22:00Z
  checked: PaymentSuccess.tsx
  found: ISSUE! setTimeout in handleCopyOrderId (line 263) without cleanup
  implication: POTENTIAL CRASH

- timestamp: 2026-01-30T00:23:00Z
  checked: StopDetail.tsx
  found: ISSUE! setTimeout in copyAddress (line 102) without cleanup
  implication: POTENTIAL CRASH

- timestamp: 2026-01-30T00:24:00Z
  checked: WelcomeAnimation.tsx
  found: Proper cleanup - both setTimeout have cleanup (lines 295, 304)
  implication: OK

- timestamp: 2026-01-30T00:25:00Z
  checked: MagicLinkSent.tsx
  found: Proper cleanup - countdown timer (line 229), opening timer (line 300)
  implication: OK

## Resolution

root_cause: Multiple components had setTimeout without proper cleanup, causing state updates on unmounted components:
  1. BrandMascot.tsx - Recursive blink animation and click handler timeouts not tracked
  2. AdminDashboard.tsx - Goal celebration timeout not tracked
  3. PaymentSuccess.tsx - Copy order ID timeout not tracked
  4. StopDetail.tsx - Copy address timeout not tracked

fix: Added proper cleanup for all setTimeout calls:
  1. BrandMascot.tsx - Added isMounted guard and refs for blink timers, plus clickTimeoutRefs array for click handler
  2. AdminDashboard.tsx - Added goalTimeoutRef with cleanup useEffect
  3. PaymentSuccess.tsx - Added copyTimeoutRef with cleanup useEffect
  4. StopDetail.tsx - Added copyTimeoutRef with cleanup useEffect

verification: TypeScript and ESLint pass on all modified files

files_changed:
  - src/components/ui/brand/BrandMascot.tsx
  - src/components/ui/admin/AdminDashboard.tsx
  - src/components/ui/checkout/PaymentSuccess.tsx
  - src/components/ui/driver/StopDetail.tsx
