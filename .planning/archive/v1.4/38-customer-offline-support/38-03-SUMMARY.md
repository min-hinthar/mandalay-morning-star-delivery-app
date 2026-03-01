---
phase: 38-customer-offline-support
plan: 03
subsystem: ui
tags: [offline, pwa, service-worker, react, framer-motion]

# Dependency graph
requires:
  - phase: 38-01
    provides: Service worker with caching strategies
  - phase: 38-02
    provides: IndexedDB menu cache and useCustomerOfflineSync hook
provides:
  - OfflineIndicator banner with amber/green states and animations
  - StaleBadge showing relative timestamp for cached data
  - UpdatePrompt with 5-second countdown for SW updates
  - ServiceWorkerRegistration component for global SW setup
  - Full menu page offline caching integration
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    [CSS variable coordination for fixed banners, local state for hydration-safe online detection]

key-files:
  created:
    - src/components/ui/offline/OfflineIndicator.tsx
    - src/components/ui/offline/StaleBadge.tsx
    - src/components/ui/offline/UpdatePrompt.tsx
    - src/components/ui/offline/ServiceWorkerRegistration.tsx
    - src/components/ui/offline/index.ts
  modified:
    - src/app/layout.tsx
    - src/components/ui/menu/MenuContent.tsx
    - src/components/ui/menu/CategoryTabs.tsx

key-decisions:
  - "Local state for OfflineIndicator - avoids hydration mismatch vs importing hook"
  - "CSS variable --offline-banner-height for header coordination"
  - "Explicit hex colors for banners - CSS variables weren't resolving in fixed context"
  - "z-index 9999 for offline banner - ensures visibility above all content"
  - "Separate ServiceWorkerRegistration component - cleaner separation from UI indicators"

patterns-established:
  - "Fixed banner + CSS variable pattern for content offset coordination"
  - "Hydration-safe online detection with mounted state guard"

# Metrics
duration: 4h (includes bugfixes)
completed: 2026-02-04
---

# Phase 38 Plan 03: Offline UI Components Summary

**Offline indicator banner, stale data badge, and SW update prompt with IndexedDB menu caching integration for customer offline browsing**

## Performance

- **Duration:** ~4h (including follow-up bugfixes for hydration, colors, z-index)
- **Started:** 2026-02-04T18:17:56-08:00
- **Completed:** 2026-02-04T22:05:06-08:00
- **Tasks:** 3 planned + 4 checkpoints
- **Files modified:** 8

## Accomplishments

- OfflineIndicator with amber offline/green reconnection banners (113 lines)
- StaleBadge using date-fns formatDistanceToNow for relative cache timestamps (44 lines)
- UpdatePrompt with 5-second countdown and dismiss functionality (151 lines)
- ServiceWorkerRegistration for global SW setup across all customer pages
- MenuContent caches to IndexedDB and falls back to cache when offline
- CSS variable coordination between banner and header for content offset

## Task Commits

Each task was committed atomically:

1. **Task 1: Create offline UI components** - `2382c77` (feat)
2. **Task 2: Integrate components into root layout** - `3522ad6` (feat)
3. **Task 3: Integrate StaleBadge with menu page** - `0b54b34` (feat)
4. **Fix: Service worker registration** - `7eb67e9` (fix)

**Follow-up fixes (post-checkpoint):**

- `c357a9c` - Image retry logic and hydration fix
- `c419093` - Indicator visibility improvements
- `7e444c7` - Remove invisible overlay
- `3004a30`, `7a9abb4`, `1561e1c` - CardImage loading fixes
- `66795af`, `8c21a84` - Explicit colors for banner
- `3501a71`, `64e3265`, `74a1e65` - Banner coordination fixes
- `b965f73`, `b818f6e`, `a8714c5`, `6908491`, `acea861` - CategoryTabs fixes
- `c581e50`, `1dd5d06`, `e56b788` - Lint/cleanup

## Files Created/Modified

**Created:**

- `src/components/ui/offline/OfflineIndicator.tsx` - Amber/green banner with 3s reconnection window
- `src/components/ui/offline/StaleBadge.tsx` - Badge showing "Cached X ago"
- `src/components/ui/offline/UpdatePrompt.tsx` - Bottom banner with 5s countdown
- `src/components/ui/offline/ServiceWorkerRegistration.tsx` - Global SW registration
- `src/components/ui/offline/index.ts` - Barrel exports

**Modified:**

- `src/app/layout.tsx` - Integrated OfflineIndicator, UpdatePrompt, ServiceWorkerRegistration
- `src/components/ui/menu/MenuContent.tsx` - Added StaleBadge and IndexedDB caching
- `src/components/ui/menu/CategoryTabs.tsx` - Account for offline banner height offset

## Decisions Made

1. **Local state vs hook import:** OfflineIndicator uses local online/offline state instead of importing useCustomerOfflineSync to avoid hydration mismatch on initial render.

2. **Explicit hex colors:** Changed from CSS variables (`bg-orange`, `bg-green`) to explicit hex colors (`#E87D1E`, `#52A52E`) for banners because CSS variables weren't resolving correctly in the fixed positioning context.

3. **CSS variable coordination:** Created `--offline-banner-height` CSS variable that OfflineIndicator sets and CategoryTabs reads to offset sticky position, avoiding header overlap.

4. **Separate registration component:** ServiceWorkerRegistration handles SW setup separately from OfflineIndicator for cleaner separation of concerns.

5. **z-index 9999:** Used very high z-index for offline banner to ensure it appears above all content including modals and toast notifications.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Hydration mismatch on navigator.onLine**

- **Found during:** Task 1 (OfflineIndicator implementation)
- **Issue:** Initial useState(navigator.onLine) caused hydration mismatch since server has no navigator
- **Fix:** Use useState(true) default, then setIsOnline(navigator.onLine) in useEffect after mount
- **Files modified:** src/components/ui/offline/OfflineIndicator.tsx
- **Committed in:** c357a9c

**2. [Rule 1 - Bug] CSS variables not resolving for banner colors**

- **Found during:** Checkpoint verification
- **Issue:** Tailwind CSS variables like `bg-orange` weren't rendering visible colors
- **Fix:** Switched to explicit inline styles with hex colors
- **Files modified:** src/components/ui/offline/OfflineIndicator.tsx
- **Committed in:** 8c21a84

**3. [Rule 1 - Bug] Banner overlapping header**

- **Found during:** Checkpoint verification
- **Issue:** Fixed banner was overlapping sticky header, causing content shift issues
- **Fix:** Added CSS variable coordination between OfflineIndicator and CategoryTabs
- **Files modified:** OfflineIndicator.tsx, CategoryTabs.tsx
- **Committed in:** 74a1e65, b965f73

**4. [Rule 2 - Missing Critical] Service worker not registering on customer pages**

- **Found during:** Task 2 verification
- **Issue:** SW only registered on driver pages; customer pages had no SW
- **Fix:** Added ServiceWorkerRegistration component to root layout
- **Files modified:** layout.tsx, ServiceWorkerRegistration.tsx
- **Committed in:** 7eb67e9

---

**Total deviations:** 4 auto-fixed (3 bugs, 1 missing critical)
**Impact on plan:** All fixes necessary for correct offline UX. No scope creep - same outcome with proper hydration and styling.

## Issues Encountered

- CSS variable resolution in fixed positioning context required workaround with explicit colors
- CategoryTabs scroll behavior needed multiple iterations to work correctly with offline banner offset
- Turbopack dev server sometimes cached old styles requiring manual refresh

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 38 (Customer Offline Support) complete
- Full offline browsing experience: menu caching, offline indicator, stale badges, update prompts
- Service worker caches images, API responses, and static assets
- Ready for Phase 39 (Mobile Testing & Launch)

---

_Phase: 38-customer-offline-support_
_Plan: 03_
_Completed: 2026-02-04_
