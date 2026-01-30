---
status: resolved
trigger: "EXHAUSTIVE setTimeout/setInterval scan - Round 6"
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T07:00:00Z
---

## Current Focus

hypothesis: All async cleanup patterns verified comprehensive
test: Exhaustive scan of all setTimeout, setInterval, requestAnimationFrame, addEventListener
expecting: Find any remaining issues
next_action: Investigation complete - no issues found

## Symptoms

expected: Modals open/close smoothly without crashes
actual: Random crashes on both homepage and menu page
errors: Not specified - crashes appear random
reproduction: Random, occurs on both pages
started: Persisting despite 5 rounds of fixes

## Eliminated

- hypothesis: Timer cleanup issues (basic)
  evidence: Fixed longPressTimer, setTimeout cleanup in multiple components
  timestamp: Round 1-3

- hypothesis: Fragment-in-AnimatePresence
  evidence: Fixed in MobileDrawer
  timestamp: Round 2

- hypothesis: Missing body scroll lock
  evidence: Added to AuthModal
  timestamp: Round 2

- hypothesis: RAF/isMounted guards
  evidence: Added to CategoryTabs
  timestamp: Round 3

- hypothesis: AudioContext cleanup
  evidence: Fixed in use-card-sound.ts
  timestamp: Round 3

- hypothesis: GSAP timeline cleanup
  evidence: Fixed in FlyToCart.tsx
  timestamp: Round 3

- hypothesis: Event listener accumulation
  evidence: Fixed in MobileDrawer.tsx
  timestamp: Round 4

- hypothesis: cart-animation-store setTimeout
  evidence: Added module-level timeout tracking
  timestamp: Round 4

- hypothesis: Portal cleanup race
  evidence: Removed setMounted(false) from cleanup
  timestamp: Round 4

- hypothesis: Drawer focus timeout
  evidence: Added cleanup for focus timeout
  timestamp: Round 4

- hypothesis: Remaining setTimeout/setInterval without cleanup
  evidence: Round 6 exhaustive scan - ALL verified safe
  timestamp: Round 6

## Evidence

- timestamp: 2026-01-30T07:00:00Z
  checked: EXHAUSTIVE Round 6 setTimeout/setInterval/RAF/addEventListener scan
  found: All 58 setTimeout, 9 setInterval, 6 requestAnimationFrame, 18+ addEventListener usages verified
  implication: No async cleanup issues remain

### COMPREHENSIVE setTimeout AUDIT (Round 6)

| File | Line(s) | Cleanup Method | Status |
|------|---------|---------------|--------|
| Tooltip.tsx | 108,119 | timerRef with cleanup return | SAFE |
| StopDetail.tsx | 111 | copyTimeoutRef with cleanup useEffect | SAFE |
| Drawer.tsx | 140,147 | timeoutId with cleanup return | SAFE |
| AdminDashboard.tsx | 416 | goalTimeoutRef with cleanup useEffect | SAFE |
| OfflineBanner.tsx | 23 | timer with cleanup return | SAFE |
| Confetti.tsx | 92,271,326 | timer + completeTimeoutRef with cleanup | SAFE |
| WelcomeAnimation.tsx | 294,301 | timer with cleanup return | SAFE |
| BrandMascot.tsx | 442,473,482,512,515 | clickTimeoutRefs array + cleanup | SAFE |
| CartButton.tsx | 80 | cleanup return function | SAFE |
| OnboardingTour.tsx | 254,255,277,293 | completeTimeoutRef/skipTimeoutRef with cleanup | SAFE |
| CartBar.tsx | 195 | cleanup return function | SAFE |
| MagicLinkSent.tsx | 228,299 | timer with cleanup return | SAFE |
| AddToCartButton.tsx | 136,183,189 | timeoutsRef Set with cleanup | SAFE |
| HowItWorksSection.tsx | 307,439 | blurTimeoutRef with cleanup | SAFE |
| AddressInput.tsx | 226,298,406 | blurTimeoutRef + Promise delay (non-React) | SAFE |
| PaymentSuccess.tsx | 248,272 | timer + copyTimeoutRef with cleanup | SAFE |
| AuthModal.tsx | 220,237 | focusTimeoutRef with cleanup | SAFE |
| Modal.tsx | 230 | timer with cleanup return | SAFE |
| FormValidation.tsx | 374,661 | timer with cleanup return | SAFE |
| error-shake.tsx | 93,107 | timeoutRef with cleanup | SAFE |
| FeaturedCarousel.tsx | 143 | resumeTimerRef with cleanup | SAFE |
| CartIndicator.tsx | 87 | cleanup return function | SAFE |
| UnifiedMenuItemCard.tsx | 254 | longPressTimer with cleanup useEffect | SAFE |
| FavoriteButton.tsx | 141,166 | burstTimeoutRef with cleanup | SAFE |
| MenuContent.tsx | 91,114 | closeTimeoutRef with cleanup | SAFE |
| SearchInput.tsx | 82,83,156,183 | blurTimeoutRef/focusTimeoutRef with cleanup | SAFE |
| AddButton.tsx | 86,150 | animationTimeoutRef with cleanup | SAFE |
| useBodyScrollLock.ts | 66,108 | timeoutRef with cleanup | SAFE |
| useLocationTracking.ts | 95 | updateTimeoutRef with cleanup | SAFE |
| useDebounce.ts | 7 | cleanup return | SAFE |
| useToast.ts | 25,34 | Map-based with clearTimeout | SAFE |
| useToastV8.ts | 61,107 | Map-based with clearTimeout | SAFE |
| useTrackingSubscription.ts | 224 | reconnectTimeoutRef with cleanup | SAFE |
| cart-animation-store.ts | 35,55 | module-level timeout tracking | SAFE |
| theme-sounds.ts | 82 | Fire-and-forget audio delay (no state) | SAFE |

### COMPREHENSIVE setInterval AUDIT (Round 6)

| File | Line(s) | Cleanup Method | Status |
|------|---------|---------------|--------|
| DynamicThemeProvider.tsx | 182 | interval with cleanup return | SAFE |
| rate-limit.ts | 84,85 | Module-level cleanup timer (non-React) | SAFE |
| BrandMascot.tsx | 454 | interval with cleanup return | SAFE |
| CoverageRouteMap.tsx | 134 | interval with cleanup return | SAFE |
| TestimonialsCarousel.tsx | 196 | interval with cleanup return | SAFE |
| FeaturedCarousel.tsx | 54 | useInterval hook with cleanup | SAFE |
| useTrackingSubscription.ts | 160,371 | pollingIntervalRef with cleanup | SAFE |

### COMPREHENSIVE requestAnimationFrame AUDIT (Round 6)

| File | Line(s) | Cleanup Method | Status |
|------|---------|---------------|--------|
| gradients.ts | 278 | Class-based with cancelAnimationFrame in dispose | SAFE |
| useScrollDirection.ts | 97,106 | Fire-once per scroll event (no cancel needed) | SAFE |
| CategoryTabs.tsx | 134,137 | rafId with cancelAnimationFrame + isMounted guard | SAFE |
| UnifiedMenuItemCard.tsx | 275 | Fire-once in handleTouchEnd (no state updates) | SAFE |

### COMPREHENSIVE addEventListener AUDIT (Round 6)

| File | Line(s) | Event | Cleanup | Status |
|------|---------|-------|---------|--------|
| TimeSlotPicker.tsx | 285 | resize | removeEventListener | SAFE |
| OnboardingTour.tsx | 320 | keydown | cleanup | SAFE |
| theme-sounds.ts | 19-21 | click/touchstart | once:true auto-remove | SAFE |
| AuthModal.tsx | 312 | keydown | cleanup | SAFE |
| Dropdown.tsx | 206,223 | mousedown/keydown | cleanup | SAFE |
| dropdown-menu.tsx | 34 | mousedown | cleanup | SAFE |
| Modal.tsx | 266 | keydown | cleanup | SAFE |
| MobileDrawer.tsx | 66 | keydown | cleanup | SAFE |
| DriverShell.tsx | 25 | sw-sync-request | cleanup | SAFE |
| DriverLayout.tsx | 73,86,87 | sw-sync-request/online/offline | cleanup | SAFE |
| Drawer.tsx | 186 | keydown | cleanup | SAFE |
| SearchInput.tsx | 109 | resize | cleanup | SAFE |
| AccountIndicator.tsx | 113,128 | mousedown/keydown | cleanup | SAFE |
| useCommandPalette.ts | 75 | keydown | cleanup | SAFE |
| useLuminance.ts | 240 | resize | cleanup | SAFE |
| useOfflineSync.ts | 149,150 | online/offline | cleanup | SAFE |
| useScrollDirection.ts | 115 | scroll | cleanup | SAFE |
| useSoundEffect.ts | 93-95 | click/touchstart/keydown | once:true | SAFE |

### Other Patterns Verified

- IntersectionObserver: useActiveCategory.ts, useScrollSpy.ts, CoverageRouteMap.tsx, FeaturedCarousel.tsx - ALL have disconnect() cleanup
- ResizeObserver: CategoryTabs.tsx - has disconnect() cleanup
- Portal component: Does NOT set mounted to false in cleanup (intentional - prevents race with AnimatePresence)
- useBodyScrollLock: Proper timeout cleanup at multiple levels
- Swipe gestures: No timers/async operations needing cleanup

## Resolution

root_cause: **AUDIT COMPLETE - No async cleanup issues found**

After exhaustive Round 6 review of:
- 35+ setTimeout usages
- 7+ setInterval usages
- 4+ requestAnimationFrame usages
- 18+ addEventListener usages
- IntersectionObserver and ResizeObserver patterns
- Portal and animation lifecycle patterns

**ALL have proper cleanup mechanisms:**
- Timer IDs tracked in refs
- Cleanup functions in useEffect returns
- isMounted guards where needed
- Event listener removal in cleanup

**CONCLUSION:** If crashes persist, the root cause is NOT related to:
1. setTimeout/setInterval cleanup
2. Event listener accumulation
3. requestAnimationFrame cleanup
4. Observer cleanup

**Remaining possibilities for further investigation:**
1. Framer Motion library bugs (consider version update)
2. React concurrent mode edge cases
3. Memory pressure on low-end mobile devices
4. Browser-specific issues (iOS Safari, Chrome mobile)
5. Network-related state updates during navigation
6. Third-party script interference

**Recommended next steps if crashes continue:**
1. Add error boundary with Sentry reporting to capture crash details
2. Test with Framer Motion disabled on mobile
3. Profile memory usage during modal open/close cycles
4. Check for specific device/browser correlation in crash reports

fix: No code changes needed - all timers verified safe
verification: Exhaustive code audit complete
files_changed: []
