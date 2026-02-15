---
phase: 63-branding-compliance
plan: 02
subsystem: ui
tags: [footer, legal-links, privacy, terms, framer-motion, next-link]

# Dependency graph
requires:
  - phase: 63-branding-compliance
    provides: BRND-01 requirements for privacy/terms links
provides:
  - Shared SiteFooter component on all public pages
  - Privacy Policy and Terms of Service links in footer
  - Login page agreement text for OAuth compliance
  - Business listings (Yelp, Google Maps, Uber Eats, DoorDash, GrubHub)
affects: [64-documentation, 65-performance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared footer via route group layout (public pages only)"
    - "CTA section split from footer (homepage-only vs shared)"

key-files:
  created:
    - src/components/ui/homepage/SiteFooter.tsx
  modified:
    - src/components/ui/homepage/FooterCTA.tsx
    - src/app/(public)/layout.tsx
    - src/app/(auth)/login/LoginPageClient.tsx

key-decisions:
  - "SiteFooter in (public)/layout.tsx ensures all public pages get footer without per-page imports"
  - "FooterCTA changed from <footer> to <section> to avoid duplicate footer semantics"
  - "Agreement text added below all auth methods in LoginPageClient (MagicLinkForm already has its own)"
  - "Business listing URLs use generic search/homepage links with TODO comments for specific pages"

patterns-established:
  - "Route group layout for shared page elements: components in layout.tsx, not repeated in each page"

# Metrics
duration: 13min
completed: 2026-02-15
---

# Phase 63 Plan 02: Footer Split and Legal Links Summary

**Shared SiteFooter with 4-column grid (contact, hours, business listings, legal) on all public pages, plus login agreement text**

## Performance

- **Duration:** 13 min
- **Started:** 2026-02-15T03:14:53Z
- **Completed:** 2026-02-15T03:28:12Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Split FooterCTA into CTA-only section (94 lines) and shared SiteFooter (232 lines)
- SiteFooter renders on all public pages (/, /menu, /privacy, /terms) via layout
- Footer contains: privacy/terms links, contact info, delivery hours, business listings, copyright, attribution
- Login page shows terms/privacy agreement text covering all auth methods (magic link, Google, Apple)

## Task Commits

Each task was committed atomically:

1. **Task 1: Split FooterCTA and create SiteFooter component** - `bfb6c62` (feat)
2. **Task 2: Integrate SiteFooter into public layout** - `d40bb3e` (feat)
3. **Task 3: Add privacy/terms agreement text to login page** - `9a9537e` (feat)

## Files Created/Modified

- `src/components/ui/homepage/SiteFooter.tsx` - Shared footer: 4-column grid with contact, hours, listings, legal + copyright/attribution
- `src/components/ui/homepage/FooterCTA.tsx` - Trimmed to CTA-only section, changed `<footer>` to `<section>`
- `src/app/(public)/layout.tsx` - Added SiteFooter import and render before CartOverlays
- `src/app/(auth)/login/LoginPageClient.tsx` - Added agreement text with links to /terms and /privacy

## Decisions Made

- SiteFooter placed in (public)/layout.tsx before CartOverlays -- footer is content, cart overlays are modals
- FooterCTA wrapper changed from `<footer>` to `<section>` to avoid duplicate footer semantics on homepage
- Business listing URLs use search/generic links with TODO comments until specific restaurant pages are confirmed
- Copyright text uses full name "Mandalay Morning Star Burmese Kitchen" (vs abbreviated "Mandalay Morning Star" in old footer)
- Attribution tagline uses HTML entities for emojis to ensure consistent rendering across platforms

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Build command (`pnpm build`) fails intermittently with Turbopack ENOENT on OneDrive-synced directory -- pre-existing issue documented in STATE.md, not related to these changes. Typecheck and lint pass cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- BRND-01 satisfied: homepage links to privacy/terms via SiteFooter
- All 4 public pages (/, /menu, /privacy, /terms) display shared footer
- Login page shows agreement text for OAuth compliance
- Business listing URLs need real restaurant page URLs when available (TODO comments in SiteFooter)

---
*Phase: 63-branding-compliance*
*Completed: 2026-02-15*
