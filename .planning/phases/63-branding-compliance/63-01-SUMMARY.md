---
phase: 63-branding-compliance
plan: 01
subsystem: ui
tags: [legal, privacy-policy, terms-of-service, gdpr, oauth, google-verification]

# Dependency graph
requires:
  - phase: 62-production-operations
    provides: Live production app with all 5 data processors configured
provides:
  - Comprehensive privacy policy naming all 5 data processors
  - Comprehensive terms of service with food safety disclaimer
  - Google OAuth data disclosure for brand verification
affects: [64-favicon-metadata, 65-lighthouse-ci, 66-launch-checklist]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Legal page pattern: server component, article wrapper, max-w-3xl, font-display headings, font-body text"

key-files:
  created: []
  modified:
    - src/app/(public)/privacy/page.tsx
    - src/app/(public)/terms/page.tsx

key-decisions:
  - "Hardcoded admin email string instead of importing from email constants (server component, constant in client-side lib)"
  - "Professional + warm tone per user decision (blend of credibility and family-run charm)"
  - "California governing law with LA County jurisdiction per user decision"
  - "Food allergen liability disclaimer with 'order at your own risk' language per user decision"

patterns-established:
  - "Legal page layout: article max-w-3xl, h2 sections with mt-8, cross-links in border-t footer"

# Metrics
duration: 10min
completed: 2026-02-15
---

# Phase 63 Plan 01: Branding Compliance Legal Pages Summary

**Comprehensive privacy policy (272 lines) and terms of service (232 lines) replacing 22-line stubs, naming all 5 data processors with Sentry session replay disclosure for Google OAuth brand verification**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-15T03:15:24Z
- **Completed:** 2026-02-15T03:26:24Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Privacy policy with 12 sections naming Google, Sentry, Stripe, Resend, and Vercel with specific data collected by each
- Sentry session replay disclosure with maskAllText/maskAllInputs/blockAllMedia masking details and error-only capture rates
- Terms of service with 13 sections covering food allergen disclaimer, Saturday delivery, Friday 3 PM cutoff, California governing law
- Both pages styled with app design system (font-display, font-body, bg-background, text-primary) and cross-linked

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite privacy policy page** - `a261b0f` (feat)
2. **Task 2: Rewrite terms of service page** - `387f510` (feat)

## Files Created/Modified
- `src/app/(public)/privacy/page.tsx` - 272-line comprehensive privacy policy with 12 sections, 5 data processor disclosures
- `src/app/(public)/terms/page.tsx` - 232-line comprehensive terms of service with 13 sections, food safety/allergen disclaimer

## Decisions Made
- Hardcoded `admin@mandalaymorningstar.com` email string rather than importing `EMAIL_REPLY_TO` from `@/lib/email/constants.ts` (that file uses `process.env` which is fine on server, but keeping it self-contained avoids coupling legal pages to email lib)
- Used `KITCHEN_LOCATION` from `@/types/address` for physical address (shared constant, no env dependency)
- Professional + warm tone matching "blend of credibility and family-run charm" per user decision
- California governing law with disputes in LA County courts per user decision
- Food allergen liability disclaimer with explicit "order at your own risk" language per user decision
- California residents section is a brief acknowledgment only (does not claim CCPA compliance)
- Cookie section is informational disclosure only (does not claim consent mechanism exists)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Build lock file conflict (stale `.next/lock` from prior build) - cleared and rebuilt successfully
- Turbopack ENOENT on OneDrive-synced directory on first build attempt (pre-existing, documented in STATE.md) - resolved by clearing `.next` cache

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both legal pages ready for Google OAuth brand verification review
- Pages are prerendered as static content (optimal for Lighthouse)
- Cross-links between privacy and terms pages functional
- Ready for Phase 64 (favicon/metadata) and Phase 66 (launch checklist)

---
*Phase: 63-branding-compliance*
*Completed: 2026-02-15*
