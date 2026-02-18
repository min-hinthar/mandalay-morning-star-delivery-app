---
phase: 51-customer-settings
plan: 04
subsystem: ui
tags: [react, display-settings, theme, font-size, localStorage, next-themes, toggles]

# Dependency graph
requires:
  - phase: 51-customer-settings
    provides: "SettingsTab container with sub-tab navigation, useCustomerSettings hook"
provides:
  - "DisplaySection with theme selector, font size selector, animation and sound toggles"
  - "useFontSize hook with CSS custom property --font-size-base"
  - "useSoundPreference hook sharing localStorage key with useSoundEffect"
  - "ThemeSelector with Light/Dark/System options and color swatches"
  - "FontSizeSelector with segmented Aa buttons"
affects: [51-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS custom property font sizing via useFontSize hook"
    - "Hydration-safe localStorage hooks (useEffect mount reads, not useState initializer)"
    - "Theme DB sync via fire-and-forget PATCH (no loading state, already visually applied)"
    - "Shared localStorage key between useSoundPreference and useSoundEffect for sync"

key-files:
  created:
    - src/lib/hooks/useFontSize.ts
    - src/lib/hooks/useSoundPreference.ts
    - src/components/ui/account/SettingsTab/ThemeSelector.tsx
    - src/components/ui/account/SettingsTab/FontSizeSelector.tsx
    - src/components/ui/account/SettingsTab/DisplaySection.tsx
  modified:
    - src/components/ui/account/SettingsTab/SettingsTab.tsx
    - src/components/ui/account/SettingsTab/index.tsx

key-decisions:
  - "CUST-04-FONTCSS: Font size applied via CSS custom property --font-size-base for instant WYSIWYG"
  - "CUST-04-SOUNDSYNC: useSoundPreference shares localStorage key with useSoundEffect (no AudioContext overhead)"
  - "CUST-04-THEMEFIRE: Theme DB sync is fire-and-forget PATCH (no loading state, visually applied already)"

patterns-established:
  - "Display preferences persist to localStorage only (except theme which also syncs to DB)"
  - "Segmented selector pattern for discrete choice options"

# Metrics
duration: 8min
completed: 2026-02-08
---

# Phase 51 Plan 04: Display Preferences Section Summary

**Display sub-tab with theme selector (Light/Dark/System + color swatches), font size segmented Aa buttons, reduce-animations toggle, and sound-effects toggle -- all instant-apply with localStorage persistence**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-08T15:57:00Z
- **Completed:** 2026-02-08T16:05:28Z
- **Tasks:** 2
- **Files created:** 5
- **Files modified:** 2

## Accomplishments

- Created `useFontSize` hook that manages base font size via CSS custom property `--font-size-base` with localStorage persistence and hydration safety
- Created `useSoundPreference` hook as lightweight toggle sharing the same `soundEffectsEnabled` localStorage key as `useSoundEffect` (no AudioContext)
- Built `ThemeSelector` with Light/Dark/System options, color preview swatches, hydration-safe mounting, and instant apply via `next-themes`
- Built `FontSizeSelector` with segmented Aa buttons at 13/16/19px display sizes, instant WYSIWYG apply
- Built `DisplaySection` composing all four sections: theme, font size, animations (via `useAnimationPreference`), and sound effects
- Wired `DisplaySection` into `SettingsTab` with `handleThemeDbSync` fire-and-forget PATCH for DB persistence

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useFontSize and useSoundPreference hooks** - `7748323` (feat)
2. **Task 2: Create ThemeSelector, FontSizeSelector, DisplaySection, and wire to SettingsTab** - `a6c782d` (feat)

## Files Created/Modified

- `src/lib/hooks/useFontSize.ts` - Font size hook with FONT_SIZES const, CSS custom property, localStorage persistence
- `src/lib/hooks/useSoundPreference.ts` - Sound preference toggle sharing localStorage key with useSoundEffect
- `src/components/ui/account/SettingsTab/ThemeSelector.tsx` - Light/Dark/System selector with color swatches and next-themes integration
- `src/components/ui/account/SettingsTab/FontSizeSelector.tsx` - Segmented Aa buttons with instant font size application
- `src/components/ui/account/SettingsTab/DisplaySection.tsx` - Display preferences section composing theme, font, animations, sound toggles
- `src/components/ui/account/SettingsTab/SettingsTab.tsx` - Added DisplaySection import/render and handleThemeDbSync
- `src/components/ui/account/SettingsTab/index.tsx` - Added barrel exports for DisplaySection, ThemeSelector, FontSizeSelector

## Decisions Made

- **CUST-04-FONTCSS:** Font size applied via CSS custom property `--font-size-base` on `document.documentElement` for instant WYSIWYG preview without re-render. Three presets: small (14px), medium (16px), large (18px).
- **CUST-04-SOUNDSYNC:** Created separate `useSoundPreference` hook that shares the same `soundEffectsEnabled` localStorage key as `useSoundEffect`. This avoids AudioContext overhead in the settings UI while keeping preferences in sync.
- **CUST-04-THEMEFIRE:** Theme DB sync uses fire-and-forget PATCH to `/api/account/settings` -- no loading state needed since theme is already visually applied via next-themes. Theme does NOT trigger the FloatingUnsavedBar.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

- Display sub-tab complete with all four sections functional
- Plan 05 (Integration & Polish) can wire up dietary summary card and settings nudge banner
- All localStorage hooks (font size, sound preference, animation preference) are app-wide ready
- Theme syncs to both localStorage (next-themes) and database (immediate PATCH)

---

_Phase: 51-customer-settings_
_Completed: 2026-02-08_
