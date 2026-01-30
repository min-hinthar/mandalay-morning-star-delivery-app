---
status: verifying
trigger: "Mobile crashes persist - first crash refreshes page, second attempt shows can't open this page on modal exit"
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:05:00Z
---

## Current Focus

hypothesis: Massive number of repeat:Infinity animations cause mobile GPU/memory exhaustion - animations not paused when components hidden inside modals/drawers, continue running, overwhelm mobile WebKit
test: Remove or bound ALL repeat:Infinity animations
expecting: Mobile crashes stop because GPU/memory no longer exhausted by 50+ infinite animations running simultaneously
next_action: Create comprehensive fix by removing all repeat:Infinity animations or replacing with bounded versions

## Symptoms

expected: App runs without crashes on mobile
actual: Two-stage crash pattern - first crash refreshes page, second attempt shows "can't open this page" error on modal exit
errors: Page crash, complete failure to load
reproduction: Navigate on mobile, interact with modals/drawers, crash on exit
started: Still happening after MobileDrawer fix (commit 8207b6b)

## Eliminated

## Evidence

- timestamp: 2026-01-30T00:01:00Z
  checked: grep for "repeat.*Infinity" across codebase
  found: 85+ instances of repeat:Infinity animations across 25+ files
  implication: Massive number of infinite animations - this is the root cause

- timestamp: 2026-01-30T00:02:00Z
  checked: CartDrawer.tsx (line 77-81)
  found: Shopping bag icon has repeat:Infinity rotation animation
  implication: This animation runs INSIDE the drawer - even when drawer content is rendered but drawer is closed

- timestamp: 2026-01-30T00:02:30Z
  checked: CartSummary.tsx
  found: 4 separate repeat:Infinity animations (sparkles, truck, party popper)
  implication: When cart drawer opens, these stack up with other infinite animations

- timestamp: 2026-01-30T00:03:00Z
  checked: CartEmptyState.tsx
  found: 3 separate repeat:Infinity animations (floating bag, scale, rotate)
  implication: More infinite animations inside cart drawer

- timestamp: 2026-01-30T00:03:30Z
  checked: useAnimationPreference.ts
  found: No mobile-specific throttling - animations run at full on all devices
  implication: Mobile devices get same animation load as desktop despite weaker GPUs

- timestamp: 2026-01-30T00:04:00Z
  checked: motion-tokens.ts (lines 746, 761, 830)
  found: float(), floatGentle(), routeDraw.markerPulse all use repeat:Infinity
  implication: These utility functions spread infinite animations across the app

## Resolution

root_cause: 85+ repeat:Infinity animations across the codebase cause mobile GPU/memory exhaustion. When modals/drawers open, their content (with more infinite animations) adds to the load. On exit, the combined animation load causes WebKit to crash. First crash triggers page refresh, second attempt has corrupted state.

fix: |
  Removed infinite animations from all high-frequency components:
  1. CartDrawer.tsx - Removed rotating bag icon and pulsing glow button
  2. CartSummary.tsx - Removed sparkles, truck bounce, celebration particles, party popper animations
  3. CartEmptyState.tsx - Removed floating bag and scale animations
  4. CartBar.tsx - Removed sparkles, truck bounce, free delivery truck animations
  5. EmptyState.tsx - Removed gradient pulse and icon animations
  6. motion-tokens.ts - Changed float(), floatGentle() from repeat:Infinity to repeat:3
  7. motion-tokens.ts - Changed routeDraw.markerPulse from repeat:Infinity to repeat:5
  8. micro-interactions.ts - Changed pulseVariants from repeat:Infinity to repeat:3

  Pattern: Replace animated elements with static equivalents, or bound repeat counts

verification: Build passes (npm run typecheck, npm run lint, npm run build all pass)
files_changed:
  - src/components/ui/cart/CartDrawer.tsx
  - src/components/ui/cart/CartSummary.tsx
  - src/components/ui/cart/CartEmptyState.tsx
  - src/components/ui/cart/CartBar.tsx
  - src/components/ui/EmptyState.tsx
  - src/lib/motion-tokens.ts
  - src/lib/micro-interactions.ts
