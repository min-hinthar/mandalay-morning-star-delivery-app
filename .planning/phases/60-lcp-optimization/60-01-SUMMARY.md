---
phase: 60-lcp-optimization
plan: 01
subsystem: ui
tags: [framer-motion, lcp, performance, css-animations, lazy-loading]

# Dependency graph
requires:
  - phase: 31-hero
    provides: Hero component with framer-motion animations
  - phase: 59-monitoring
    provides: Speed Insights + Web Vitals tracking for measuring LCP improvement
provides:
  - Async domAnimation root provider (removes ~25kb synchronous domMax from critical path)
  - Server-visible hero content with CSS entrance animations
  - CSS @keyframes fade-in-up/fade-in with staggered delay classes
  - prefers-reduced-motion support for all new animation classes
affects: [60-02-layoutId-migration, 60-03-domMax-per-route, lighthouse-ci]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Async LazyMotion feature loading via dynamic import"
    - "CSS entrance animations replacing JS opacity:0 initial states for LCP"
    - "CSS transition pill indicators replacing framer-motion layoutId"

key-files:
  created: []
  modified:
    - src/app/providers.tsx
    - src/components/ui/homepage/Hero/HeroSubComponents.tsx
    - src/components/ui/homepage/Hero/HeroContent.tsx
    - src/app/globals.css
    - src/components/ui/Tabs.tsx
    - src/components/ui/navigation/BottomNav.tsx
    - src/components/ui/account/AccountClient.tsx
    - src/components/ui/account/SettingsTab/SettingsTab.tsx
    - src/components/ui/admin/settings/SettingsClient/SettingsClient.tsx

key-decisions:
  - "Async domAnimation instead of sync domMax removes ~25kb from critical path"
  - "CSS fade-in-up starts at opacity 0.85 (not 0) so content is near-visible even before animation"
  - "Scroll indicator keeps m.div with opacity:0 initial (below fold, not LCP-critical)"
  - "StatItem simplified to plain div (parent CSS handles staggered entrance)"
  - "Pre-existing layoutId migration completed as bug fix (Tabs, BottomNav, callers)"

patterns-established:
  - "CSS entrance animations for LCP-critical above-fold content"
  - "Staggered CSS animation delays via utility classes (animate-fade-in-up-delay-N)"
  - "Async feature loading for LazyMotion providers"

# Metrics
duration: 28min
completed: 2026-02-14
---

# Phase 60 Plan 01: LCP Root Cause Fix Summary

**Async domAnimation root provider + server-visible hero with CSS entrance animations replacing JS opacity:0 blocking**

## Performance

- **Duration:** 28 min
- **Started:** 2026-02-14T09:19:50Z
- **Completed:** 2026-02-14T09:48:11Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Root LazyMotion switched from synchronous domMax (~25kb) to async domAnimation loader
- Hero h1 heading renders as visible plain HTML at server time (no opacity:0 blocking LCP)
- All hero text content (greeting badge, tagline, subheadline, CTA, stats) server-visible with CSS animation enhancement
- CSS @keyframes fade-in-up and fade-in with staggered delay utilities added
- prefers-reduced-motion support for all new animation classes
- Pre-existing layoutId migration bug fixed (Tabs.tsx, BottomNav.tsx, 3 callers)

## Task Commits

Each task was committed atomically:

1. **Task 1: Switch root LazyMotion to async domAnimation** - `99b0685` (feat)
2. **Task 2: Make hero content server-visible with CSS entrance animations** - `14bfe92` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `src/app/providers.tsx` - Async domAnimation loader replacing synchronous domMax import
- `src/components/ui/homepage/Hero/HeroSubComponents.tsx` - Plain h1 AnimatedHeadline with CSS class, plain div StatItem
- `src/components/ui/homepage/Hero/HeroContent.tsx` - Server-visible hero elements with CSS animation classes
- `src/app/globals.css` - CSS @keyframes fade-in-up/fade-in + staggered delay classes + reduced-motion
- `src/components/ui/Tabs.tsx` - Pre-existing: CSS transition pill indicator (was partially migrated)
- `src/components/ui/navigation/BottomNav.tsx` - Pre-existing: CSS transition active indicator
- `src/components/ui/account/AccountClient.tsx` - Removed stale layoutId prop
- `src/components/ui/account/SettingsTab/SettingsTab.tsx` - Removed stale layoutId prop
- `src/components/ui/admin/settings/SettingsClient/SettingsClient.tsx` - Removed stale layoutId prop

## Decisions Made

- Used CSS `opacity: 0.85` as animation start (not 0) so content is near-visible even before animation plays -- avoids flash of invisible content on slow connections
- Kept scroll indicator `m.div` with `initial: { opacity: 0 }` since it's below-fold and not LCP-critical
- Simplified StatItem to plain `div` since parent container handles entrance animation via CSS class
- Removed `delay` prop from StatItem (no longer needed with CSS stagger on parent)
- Fixed pre-existing incomplete layoutId->CSS migration in Task 1 commit (Tabs, BottomNav, callers)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Completed pre-existing layoutId migration**

- **Found during:** Task 1 (typecheck verification)
- **Issue:** Tabs.tsx had been partially migrated from framer-motion layoutId to CSS transitions (m import removed, layoutId prop removed from interface) but 3 callers (AccountClient, SettingsTab, SettingsClient) still passed layoutId prop. BottomNav.tsx had similar incomplete migration.
- **Fix:** Removed stale layoutId prop from all 3 callers. Included pre-existing BottomNav.tsx CSS transition migration.
- **Files modified:** AccountClient.tsx, SettingsTab.tsx, SettingsClient.tsx, Tabs.tsx, BottomNav.tsx
- **Verification:** `pnpm typecheck` passes, `pnpm lint` passes
- **Committed in:** 99b0685 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Bug fix was necessary for typecheck to pass. No scope creep -- these files were already partially migrated in the working tree.

## Issues Encountered

- `pnpm build` fails with ENOENT on build-manifest.json -- pre-existing Turbopack/Windows/OneDrive environment issue, also fails on unmodified code. Compilation step succeeds; failure is in post-compilation file system operations. Not caused by code changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Async domAnimation provider in place; hero content server-visible
- Plan 02 can proceed with layoutId -> CSS migration for remaining components
- Plan 03 can add domMax back per-route where needed (admin pages with drag/layout)
- LCP improvement measurable via Speed Insights (deployed in Phase 59)
- Build environment issue (Turbopack/OneDrive) is pre-existing and unrelated

---

_Phase: 60-lcp-optimization_
_Completed: 2026-02-14_
