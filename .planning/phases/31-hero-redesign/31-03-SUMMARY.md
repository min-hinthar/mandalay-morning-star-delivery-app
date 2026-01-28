---
phase: 31-hero-redesign
plan: 03
subsystem: ui
tags: [framer-motion, parallax, animation, css-variables, emojis]

# Dependency graph
requires:
  - phase: 31-02
    provides: Hero layout restructure with layer containers and parallax transforms
  - phase: 31-01
    provides: Hero gradient and emoji depth tokens in tokens.css
provides:
  - FloatingEmoji component with depth effects and organic animations
  - GradientOrb component with theme-aware glow
  - Hero integration with mouse repel effect
affects: [31-04, 31-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Deterministic emoji positions to avoid hydration mismatch
    - CSS variable references for depth effects (blur, opacity, shadow)
    - Mouse tracking with useCanHover for desktop-only interactions

key-files:
  created:
    - src/components/ui/homepage/FloatingEmoji.tsx
    - src/components/ui/homepage/GradientOrb.tsx
  modified:
    - src/components/ui/homepage/Hero.tsx

key-decisions:
  - "EMOJI_CONFIG uses hardcoded positions (no Math.random) for SSR/CSR consistency"
  - "Three animation types (drift, spiral, bob) for organic mixed movement"
  - "Mouse repel effect max 20px offset, desktop only via useCanHover"
  - "Edge fade mask on emoji layer for smooth edge blending"

patterns-established:
  - "Deterministic config arrays for SSR-safe decorative elements"
  - "CSS variable depth effects: --hero-emoji-blur-far/mid, --hero-emoji-opacity-far/mid"
  - "useCanHover for desktop-only hover interactions"

# Metrics
duration: 13min
completed: 2026-01-28
---

# Phase 31 Plan 03: Floating Emojis & Gradient Orbs Summary

**13 floating food emojis with depth-based blur/opacity, 6 gradient orbs with theme-aware glow, and mouse repel effect on desktop**

## Performance

- **Duration:** 13 min
- **Started:** 2026-01-28T13:36:15Z
- **Completed:** 2026-01-28T13:48:57Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- FloatingEmoji component with drift/spiral/bob animations and CSS variable depth effects
- GradientOrb component using radial gradients with theme-aware blur tokens
- Hero integration with parallax layers, mouse tracking, and edge fade masks

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FloatingEmoji component** - `19bc0aa` (feat)
2. **Task 2: Create GradientOrb component** - `db9710a` (feat)
3. **Task 3: Integrate emojis and orbs into Hero** - `f498f27` (feat)

## Files Created/Modified
- `src/components/ui/homepage/FloatingEmoji.tsx` - Emoji component with 3 animation types and depth effects (198 lines)
- `src/components/ui/homepage/GradientOrb.tsx` - Gradient orb with theme-aware blur (94 lines)
- `src/components/ui/homepage/Hero.tsx` - Integration with mouse tracking and layer rendering

## Decisions Made
- EMOJI_CONFIG: 13 emojis (4 far, 5 mid, 4 near) using hardcoded positions to avoid hydration mismatch
- Animation variety: drift (horizontal float), spiral (rotating rise), bob (vertical bounce)
- Mouse repel: calculated from center offset, max 20px, only on canHover devices
- Edge fade: linear-gradient mask fading top 8% and bottom 8% of emoji layer

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Hero visual layers complete with emojis and orbs
- Ready for 31-04 (shimmer effects and polish) and 31-05 (final verification)
- All depth tokens from 31-01 are being consumed
- Parallax transforms from 31-02 are wired to layer components

---
*Phase: 31-hero-redesign*
*Completed: 2026-01-28*
