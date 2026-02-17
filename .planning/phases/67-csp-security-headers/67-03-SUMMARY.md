---
phase: 67-csp-security-headers
plan: 03
subsystem: cleanup
tags: [dead-code, eslint, social-links]

requires:
  - phase: none
    provides: n/a
provides:
  - Zero-consumer exports removed from 7 utility/service files
  - Dead useABTest hook and dead barrel file deleted
  - Verified social media and business listing URLs in SiteFooter and BrandFooter
affects: []

tech-stack:
  added: []
  patterns:
    - "grep-before-delete: verify zero consumers before removing exports"

key-files:
  created: []
  modified:
    - src/lib/utils/currency.ts
    - src/lib/utils/delivery-dates.ts
    - src/lib/utils/format.ts
    - src/lib/services/geocoding.ts
    - src/lib/stores/cart-store.ts
    - src/types/cart.ts
    - src/lib/web-vitals.tsx
    - src/lib/hooks/index.ts
    - src/components/ui/homepage/SiteFooter.tsx
    - src/emails/components/BrandFooter.tsx

key-decisions:
  - "Kept createItemSignature function (internal use) but removed its export"
  - "Kept WEB_VITALS_THRESHOLDS constant (internal use) but removed its export"
  - "Updated all business listing URLs (Google Maps, Uber Eats, DoorDash, GrubHub) in addition to social links"

duration: 12min
completed: 2026-02-17
---

# Phase 67 Plan 03: Dead Code Removal & Social Links Summary

**Removed 10+ zero-consumer exports from 7 files, deleted useABTest hook and dead barrel, inserted verified Facebook/Instagram/delivery platform URLs into footers**

## Performance

- **Duration:** 12 min
- **Tasks:** 4
- **Files modified:** 10
- **Files deleted:** 2

## Accomplishments
- Removed dead exports: parsePriceToCents, canEditOrder, formatPriceValue, formatDate, reverseGeocode, getDeliveryFeeMessage, getPerformanceScore
- Removed export keywords for internally-used createItemSignature and WEB_VITALS_THRESHOLDS
- Deleted src/lib/hooks/useABTest.ts and its barrel re-export
- Deleted src/components/ui/admin/orders/OrderDetailExpanded/index.tsx (dead barrel)
- Updated SiteFooter with verified Google Maps, Uber Eats, DoorDash, GrubHub URLs
- Updated BrandFooter with verified Instagram and Facebook URLs

## Task Commits

1. **Task 1: Remove dead exports from utility and service files** - `84ecc3b` (refactor)
2. **Task 2: Delete dead files and barrel** - `0ec5c74` (refactor)
3. **Task 3: Collect social media URLs** - checkpoint (user provided URLs)
4. **Task 4: Insert verified social media URLs into footers** - `3e40a55` (feat)

## Files Created/Modified
- `src/lib/utils/currency.ts` - Removed parsePriceToCents
- `src/lib/utils/delivery-dates.ts` - Removed canEditOrder
- `src/lib/utils/format.ts` - Removed formatPriceValue, formatDate
- `src/lib/services/geocoding.ts` - Removed reverseGeocode
- `src/lib/stores/cart-store.ts` - Removed createItemSignature export (function kept)
- `src/types/cart.ts` - Removed getDeliveryFeeMessage
- `src/lib/web-vitals.tsx` - Removed WEB_VITALS_THRESHOLDS export and getPerformanceScore
- `src/lib/hooks/index.ts` - Removed useABTest re-export
- `src/components/ui/homepage/SiteFooter.tsx` - Verified business listing URLs
- `src/emails/components/BrandFooter.tsx` - Verified Instagram/Facebook URLs

## Decisions Made
- Updated all business listing URLs (Google Maps, Uber Eats, DoorDash, GrubHub) beyond plan scope since user provided verified URLs for all platforms
- Yelp URL kept as TODO — user did not provide verified URL

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated business listing URLs beyond plan scope**
- **Found during:** Task 4 (Insert social URLs)
- **Issue:** Plan only specified Facebook/Instagram, but SiteFooter had TODO placeholders for Uber Eats, DoorDash, GrubHub, and Google Maps
- **Fix:** User provided all 6 URLs; updated all business listings in addition to social links
- **Files modified:** src/components/ui/homepage/SiteFooter.tsx
- **Verification:** Build passes, no placeholder URLs remain except Yelp
- **Committed in:** 3e40a55

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Expanded scope to resolve all available placeholder URLs. No regressions.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dead code removal complete (CLN-01, CLN-02)
- Social links resolved (CLN-03) — Yelp URL still pending
- Ready for Plan 02 (cssText replacement) in Wave 2

---
*Phase: 67-csp-security-headers*
*Completed: 2026-02-17*
