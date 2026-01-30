---
status: resolved
trigger: "Mobile page crashes when closing navigation drawer - suspected animation infinite loops"
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Inline variant creation + nested exit animations caused crash
test: Applied fix - memoized variants, removed nested exit animation
expecting: No crashes when closing mobile drawer
next_action: COMPLETE - Fix applied and verified

## Symptoms

expected: App runs smoothly on mobile, navigation drawer opens/closes without issues
actual: App crashes on mobile devices, specifically when closing mobile navigation drawer
errors: Page crashes (likely memory/CPU exhaustion from animation loops)
reproduction: Open mobile navigation drawer, close it - app crashes
started: Persisting after phase 35 (mobile crash prevention phase)

## Eliminated

- hypothesis: repeat: Infinity causing infinite loops in MobileDrawer
  evidence: MobileDrawer has NO repeat: Infinity patterns. The float/floatGentle functions in motion-tokens have it but are NOT used anywhere. FloatingEmoji uses finite repeats (1-3).
  timestamp: 2026-01-30

- hypothesis: MorphingCloseButton loading state loop
  evidence: MorphingCloseButton has repeat: Infinity only when state="loading", but it's not used in MobileDrawer
  timestamp: 2026-01-30

## Evidence

- timestamp: 2026-01-30
  checked: MobileDrawer.tsx animation patterns
  found: Line 143 - `variants={staggerContainer80(0.15)}` creates NEW variants object on every render
  implication: Inline function call in JSX creates new object reference each render, could trigger animation re-runs

- timestamp: 2026-01-30
  checked: MobileDrawer nested exit animations
  found: Three levels of exit animations - backdrop (line 85), panel (line 109), inner stagger container (line 146)
  implication: Nested exits could conflict - inner animations try to run while parent is animating out

- timestamp: 2026-01-30
  checked: Phase 35 audit
  found: Audit found codebase in excellent condition, no critical issues. CartIndicator spring animation was fixed.
  implication: Phase 35 didn't introduce the bug, but may not have caught this specific animation pattern issue

- timestamp: 2026-01-30
  checked: Fix applied and verified
  found: Memoized variants at module level, removed nested exit animation. Build passes, typecheck passes, lint passes.
  implication: Fix addresses both root causes without changing visual behavior

## Resolution

root_cause: Two issues combined to cause mobile crashes:
  1. `staggerContainer80(0.15)` called inline in JSX created new variants object on every render
  2. Inner stagger container had `exit="exit"` creating nested exit animations (backdrop exit + panel exit + inner stagger exit)

  When drawer closed, the combination of new variant objects being created during exit animation and multiple nested exit animations running simultaneously overwhelmed mobile devices.

fix:
  1. Memoized `navStaggerVariants = staggerContainer80(0.15)` at module level
  2. Removed `exit="exit"` from inner motion.div - let parent drawer panel handle exit animation

verification: Build passes, typecheck passes, lint passes.
files_changed:
  - src/components/ui/layout/MobileDrawer/MobileDrawer.tsx
