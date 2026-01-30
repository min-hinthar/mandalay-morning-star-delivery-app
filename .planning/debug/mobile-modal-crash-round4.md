---
status: investigating
trigger: "CRASHES STILL PERSISTING after THREE rounds of fixes on both homepage and menu page"
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:00:00Z
---

## Current Focus

hypothesis: Subtle race conditions, stale closures, or Zustand subscriptions causing crashes during component unmount
test: Systematic audit of ALL shared components between homepage and menu page
expecting: Find useEffects without cleanup, Zustand selectors during unmount, or animation callbacks with stale closures
next_action: List all shared components and audit every useEffect/subscription

## Symptoms

expected: Modals open/close smoothly without crashes
actual: Random crashes on both homepage and menu page
errors: Not specified - crashes appear random
reproduction: Random, occurs on both pages
started: Persisting despite 3 rounds of fixes

## Eliminated

- hypothesis: Timer cleanup issues
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
  timestamp: Earlier

## Evidence

- timestamp: 2026-01-30T00:00:00Z
  checked: Prior fix history
  found: 15+ components already fixed across 3 rounds
  implication: Bug is in SUBTLE patterns - not obvious cleanup issues

## Resolution

root_cause:
fix:
verification:
files_changed: []
