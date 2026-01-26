---
phase: 21
plan: 02
subsystem: ui-interactions
tags: [theme-toggle, animation, web-audio, view-transitions]
dependency_graph:
  requires: [21-01]
  provides: [animated-theme-toggle, circular-reveal, theme-sounds]
  affects: [header, navigation, user-preferences]
tech_stack:
  added: []
  patterns: [view-transitions-api, web-audio-synthesis, svg-morph-animation]
file_tracking:
  created:
    - src/lib/theme-sounds.ts
    - src/lib/hooks/useThemeTransition.ts
  modified:
    - src/components/ui/theme-toggle.tsx
    - src/app/globals.css
decisions:
  - Binary light/dark toggle replaces 3-way cycle (system mode accessed via system settings)
  - View Transitions API with graceful fallback for unsupported browsers
  - Web Audio synthesis for sounds (no external audio files)
  - Spring physics for icon morph (stiffness 500, damping 25, mass 0.8)
metrics:
  duration: 8min
  completed: 2026-01-26
---

# Phase 21 Plan 02: Animated Theme Toggle Summary

Animated theme toggle with sun/moon SVG morph, circular reveal transition via View Transitions API, and Web Audio synthesized sounds.

## One-liner

Theme toggle with spring-animated SVG morph, circular reveal from click origin, and nature-inspired audio feedback (chime for light, tone for dark).

## What Was Built

### Theme Sounds (`src/lib/theme-sounds.ts`)
- `playLightChime()`: Bright A5/E6 harmonic - morning bird chirp
- `playDarkTone()`: Low A3 tone - evening owl hoot
- Respects `soundEnabled` localStorage preference
- Browser autoplay policy handling via user interaction tracking

### Theme Transition Hook (`src/lib/hooks/useThemeTransition.ts`)
- Circular reveal expanding from click coordinates
- View Transitions API with native TypeScript types
- Spring easing with overshoot: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- 300ms debounce prevents rapid toggle spam
- Graceful fallback for unsupported browsers (Safari without flag)
- Respects `prefers-reduced-motion`

### Enhanced Theme Toggle (`src/components/ui/theme-toggle.tsx`)
- SVG sun/moon icons with AnimatePresence morph
- Spring physics: scale/rotate animation (stiffness 500, damping 25)
- Integrates useThemeTransition for circular reveal
- Plays sounds on toggle
- Theme-dependent styling:
  - Light mode: border, primary-colored sun icon
  - Dark mode: primary glow shadow, accent-colored moon icon

### View Transition CSS (`src/app/globals.css`)
- `::view-transition-old/new(root)` styling
- z-index layering for smooth reveal
- `prefers-reduced-motion` disables all view transitions

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Binary toggle (not 3-way) | System mode via OS settings; simpler UX |
| Native View Transitions types | TypeScript already includes them; no custom declarations needed |
| Separate sound functions | Independent of useSoundEffect hook; theme sounds are module-level |
| SVG components (not paths) | Better readability and React component composition |
| 300ms debounce | Prevents rapid toggles from queuing multiple view transitions |

## Commits

| Hash | Description |
|------|-------------|
| e9fc808 | feat(21-02): add theme-sounds.ts with Web Audio synthesis |
| e0112d9 | feat(21-02): add useThemeTransition hook for circular reveal |
| c4bf31a | feat(21-02): enhance theme-toggle with SVG morph and circular reveal |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `pnpm typecheck`: Pass
- `pnpm lint`: Pass
- `pnpm build`: Pass
- Theme toggle: Icon morphs with spring animation
- Circular reveal: Expands from toggle button location (Chrome/Edge)
- Sounds: Play on toggle when enabled
- Reduced motion: Instant theme switch, no animation

## Dependencies

**Requires:**
- Phase 21-01 (dark mode token foundation)
- next-themes for theme state management
- framer-motion for SVG animations

**Provides:**
- Delightful theme toggle experience (THEME-03, THEME-04)
- useThemeTransition hook for any View Transitions API usage
- Theme sounds for audio feedback

## Next Phase Readiness

Ready for Phase 21-03 (Page Transitions) or Phase 22 (State Transitions):
- View Transition CSS established
- Hook pattern established for view transitions
- No blockers identified
