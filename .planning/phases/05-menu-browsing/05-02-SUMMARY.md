---
phase: 05-menu-browsing
plan: 02
subsystem: ui
tags: [framer-motion, next-image, blur-placeholder, favorites, menu-cards]

# Dependency graph
requires:
  - phase: 02-overlay-infrastructure
    provides: motion-tokens, useAnimationPreference hook
  - phase: 04-cart-experience
    provides: cart patterns, haptic feedback utilities
provides:
  - BlurImage component with blur-up placeholder effect
  - EmojiPlaceholder with 40+ category emoji mappings
  - FavoriteButton with bouncy heart animation
  - MenuItemCardV8 with hover lift and tap scale effects
  - MenuItemCardV8Skeleton for loading states
  - MenuItemGrid helper for responsive layouts
affects: [05-menu-browsing, 06-ordering-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Blur-up image loading with getPlaceholderBlur
    - Category-to-emoji mapping for fallback images
    - spring.ultraBouncy for favorite toggle animation
    - data-menu-card attribute for GSAP targeting

key-files:
  created:
    - src/components/ui-v8/menu/BlurImage.tsx
    - src/components/ui-v8/menu/EmojiPlaceholder.tsx
    - src/components/ui-v8/menu/FavoriteButton.tsx
    - src/components/ui-v8/menu/MenuItemCardV8.tsx
  modified: []

key-decisions:
  - "CATEGORY_EMOJI_MAP covers 40+ Myanmar cuisine categories"
  - "FavoriteButton uses burst ring + particles for celebration effect"
  - "MenuItemCardV8 uses whileHover y:-6 scale:1.02 matching hover.lift"

patterns-established:
  - "Blur-up loading: BlurImage wraps next/image with shimmer effect"
  - "Emoji fallback: EmojiPlaceholder uses getCategoryEmoji helper"
  - "Favorite animation: spring.ultraBouncy with haptic feedback"

# Metrics
duration: 8min
completed: 2026-01-23
---

# Phase 5 Plan 2: Menu Item Cards Summary

**V8 menu item cards with blur-up images, bouncy favorite hearts, and category emoji placeholders**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-23T00:23:31Z
- **Completed:** 2026-01-23T00:31:43Z
- **Tasks:** 3
- **Files created:** 4

## Accomplishments

- BlurImage component with Next.js Image blur-up placeholder using getPlaceholderBlur
- EmojiPlaceholder with CATEGORY_EMOJI_MAP covering 40+ Myanmar cuisine categories
- FavoriteButton with spring.ultraBouncy heart animation, burst effects, haptic feedback
- MenuItemCardV8 with hover lift (y:-6, scale:1.02) and tap scale (0.97) effects
- data-menu-card attribute on cards for GSAP scroll targeting

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BlurImage and EmojiPlaceholder** - `459da43` (feat)
2. **Task 2: Create FavoriteButton with heart animation** - `a5d62da` (feat)
3. **Task 3: Create MenuItemCardV8 with motion effects** - Pre-existing (file already committed in 05-04)

## Files Created

- `src/components/ui-v8/menu/BlurImage.tsx` - Next.js Image wrapper with blur placeholder, shimmer loading
- `src/components/ui-v8/menu/EmojiPlaceholder.tsx` - Category emoji fallback with getCategoryEmoji helper
- `src/components/ui-v8/menu/FavoriteButton.tsx` - Animated heart toggle with burst particles
- `src/components/ui-v8/menu/MenuItemCardV8.tsx` - Menu card with hover/tap effects, skeleton, grid helper

## Decisions Made

- **CATEGORY_EMOJI_MAP:** Comprehensive mapping of 40+ Myanmar cuisine categories to appropriate emojis
- **Burst animation:** FavoriteButton shows ring burst + 6 particle bursts on favorite toggle
- **Card motion:** Uses hover.lift pattern (y:-6, scale:1.02) for consistent lift feel
- **Three card variants:** default (16:9), compact (1:1), featured (4:3) aspect ratios

## Deviations from Plan

None - plan executed as written. Task 3 file existed from a parallel plan execution but content matches specification.

## Issues Encountered

- MenuItemCardV8 file already existed from a previous plan execution (05-04) - content was identical to plan specification, no changes needed

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Menu item cards ready for grid/list layouts
- BlurImage available for other image components
- FavoriteButton can be reused in other contexts (search results, etc.)
- Components integrate with existing useFavorites hook from src/lib/hooks

---
*Phase: 05-menu-browsing*
*Completed: 2026-01-23*
