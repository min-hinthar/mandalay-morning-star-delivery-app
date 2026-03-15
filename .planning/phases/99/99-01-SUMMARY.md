---
phase: 99-foundation-fixes
plan: 01
subsystem: auth
tags: [supabase, auth, redirect, role-based, oauth]

requires: []
provides:
  - "Fixed auth redirect: error catch returns /login?error= instead of /"
  - "Unknown role guard in auth callback prevents silent / redirect"
  - "Unit tests for getRoleDashboard (7 scenarios)"
  - "E2E tests for auth callback redirect flows"
affects: [auth, login, driver-flow, admin-flow]

tech-stack:
  added: []
  patterns:
    - "Error-indicating redirect paths instead of silent fallback to /"

key-files:
  created:
    - src/lib/auth/__tests__/role-redirect.test.ts
    - e2e/auth-redirect.spec.ts
  modified:
    - src/lib/auth/role-redirect.ts
    - src/app/auth/callback/route.ts

key-decisions:
  - "Error catch returns /login?error=role_lookup_failed instead of bare /"
  - "Unknown role guard exits early before deep-link authorization checks"

patterns-established:
  - "Auth error paths always include error query param for user feedback"

requirements-completed: [FOUND-01]

duration: 14min
completed: 2026-03-15
---

# Phase 99 Plan 01: Auth Redirect Fix Summary

**Fixed auth redirect catch block to return /login?error=role_lookup_failed instead of silently redirecting to /, with unknown-role guard in callback and 7 unit tests**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-15T02:09:37Z
- **Completed:** 2026-03-15T02:23:22Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- getRoleDashboard catch block now returns error-indicating path instead of bare /
- Auth callback route guards unknown role, always uses error path before deep-link checks
- 7 unit tests covering admin, driver (active/inactive/no_record), customer, no-profile, and error scenarios
- E2E tests validate callback structure, error handling, no silent / redirect

## Task Commits

Each task was committed atomically:

1. **Task 1: Write unit and E2E auth redirect tests** - `fe9ec831` (test)
2. **Task 2: Fix auth redirect bug** - `a9a21d51` (fix)
3. **Formatting fix** - `bae7b35c` (style)

## Files Created/Modified
- `src/lib/auth/__tests__/role-redirect.test.ts` - Unit tests for getRoleDashboard (7 scenarios)
- `e2e/auth-redirect.spec.ts` - E2E tests for auth callback redirect flows
- `src/lib/auth/role-redirect.ts` - Changed catch block from `path: "/"` to `path: "/login?error=role_lookup_failed"`
- `src/app/auth/callback/route.ts` - Added early return guard for `result.role === "unknown"`

## Decisions Made
- Error catch returns `/login?error=role_lookup_failed` instead of bare `/` -- ensures users see an error message rather than silently landing on homepage
- Unknown role guard added before deep-link authorization checks -- prevents unknown role from falling through to `isStandardLogin` logic

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed E2E test TypeScript errors**
- **Found during:** Task 2 (verification)
- **Issue:** Unused variables `response` and `oauthUrl` caused TS6133 errors
- **Fix:** Removed unused variable, simplified OAuth button test
- **Files modified:** e2e/auth-redirect.spec.ts
- **Committed in:** a9a21d51

**2. [Rule 1 - Bug] Fixed Prettier formatting on changed files**
- **Found during:** Task 2 (verification)
- **Issue:** Files not formatted per project Prettier config
- **Fix:** Ran prettier --write on all 4 changed files
- **Files modified:** all 4 changed files
- **Committed in:** bae7b35c

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for lint/format compliance. No scope creep.

## Issues Encountered
- Pre-existing ESLint error in `RouteStopCard.test.tsx` (display name) -- out of scope, not caused by our changes
- Build cache corruption required `.next` directory cleanup -- pre-existing issue

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth redirect fix is complete and verified
- Ready for Phase 99 Plan 02 (next foundation fix)

## Self-Check: PASSED

All 4 files verified on disk. All 3 commits (fe9ec831, a9a21d51, bae7b35c) verified in git log.

---
*Phase: 99-foundation-fixes*
*Completed: 2026-03-15*
