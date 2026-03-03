---
phase: 94-admin-driver-enhancements
plan: 02
subsystem: ui
tags: [react, driver, sms, navigation, photo-capture, offline-sync]

requires:
  - phase: 90-menu-photo-pipeline
    provides: Driver stop views, NavigationButton, DeliveryActions, PhotoCapture components
provides:
  - SMS contact button via native sms: URI in both driver modes
  - Address-only navigation fallback when no geocoded coordinates
  - Photo proof enforcement gating Mark Delivered in normal and simple modes
  - SimpleRouteDone extracted component
affects: [driver-workflow, delivery-verification]

tech-stack:
  added: []
  patterns: [sms-uri-contact, photo-gated-delivery, address-fallback-navigation]

key-files:
  created:
    - src/components/ui/driver/SimpleRouteDone.tsx
  modified:
    - src/components/ui/driver/StopDetail.tsx
    - src/components/ui/driver/SimpleStopView.tsx
    - src/components/ui/driver/NavigationButton.tsx
    - src/components/ui/driver/DeliveryActions.tsx
    - src/components/ui/driver/StopDetailView.tsx

key-decisions:
  - "Native sms: URI only -- no backend SMS service needed for MVP"
  - "NavigationButton lat/lng made optional; falls back to encodeURIComponent(address)"
  - "Photo enforcement is client-side only -- no server-side gate on PATCH endpoint (offline sync safety)"
  - "Offline-queued photo sets hasPhoto=true immediately (driver not blocked by connectivity)"
  - "Extracted SimpleRouteDone to keep SimpleStopView under 400 lines"

patterns-established:
  - "Photo-gated delivery: photoRequired prop on DeliveryActions controls button state"
  - "SMS button: sms: URI with encodeURIComponent body for cross-platform support"

requirements-completed: [DRV-01, DRV-02, DRV-03]

duration: 15min
completed: 2026-03-03
---

# Plan 94-02: Driver Enhancements Summary

**SMS contact, address-only navigation fallback, and photo proof enforcement for driver stop views**

## Performance

- **Duration:** 15 min
- **Tasks:** 2
- **Files modified:** 6 (5 modified + 1 created)

## Accomplishments
- Call + SMS buttons side-by-side in StopDetail; SMS button in SimpleStopView
- NavigationButton works with address-only fallback when no coordinates
- Photo proof required before Mark Delivered in both normal and simple modes
- Offline-queued photos count as captured (no connectivity block)
- SimpleRouteDone extracted to maintain file size limits

## Task Commits

1. **Task 1: SMS contact + navigation fallback** - `6aad8173` (feat)
2. **Task 2: Photo proof enforcement** - `94f3a47a` (feat)

## Files Created/Modified
- `src/components/ui/driver/NavigationButton.tsx` - lat/lng optional, address-only fallback (80 lines)
- `src/components/ui/driver/StopDetail.tsx` - Call + SMS buttons, always-visible NavigationButton, photoRequired passthrough (332 lines)
- `src/components/ui/driver/SimpleStopView.tsx` - SMS button, photo-gated Mark Delivered, PhotoCapture integration (399 lines)
- `src/components/ui/driver/SimpleRouteDone.tsx` - Extracted "All Done" screen (41 lines)
- `src/components/ui/driver/DeliveryActions.tsx` - photoRequired/onPhotoPrompt props, "Take Photo to Deliver" state (284 lines)
- `src/components/ui/driver/StopDetailView.tsx` - photoRequired wiring, "Take Delivery Photo" button text (378 lines)

## Decisions Made
- Used native `sms:` URI (not backend SMS) -- simple, works cross-platform, no cost
- `encodeURIComponent` on SMS body to handle special characters
- StopDetail call button changed from `m.button` with `onClick` to `<a href="tel:">` for proper link semantics
- Photo enforcement is purely client-side to avoid offline sync conflicts
- SimpleStopView photo state resets per stop via `useEffect`

## Deviations from Plan
- Combined Task 1 and Task 2 DeliveryActions/StopDetailView changes into a single commit since they were interdependent (typecheck required both)

## Issues Encountered
- Initial typecheck failed because StopDetail passed photoRequired/onPhotoPrompt to DeliveryActions before those props existed -- resolved by adding the props to DeliveryActions interface in the same commit

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Driver workflow complete with contact, navigation, and photo enforcement
- Photo upload API endpoint already exists at `/api/driver/routes/[routeId]/stops/[stopId]/photo`

---
*Phase: 94-admin-driver-enhancements*
*Completed: 2026-03-03*
