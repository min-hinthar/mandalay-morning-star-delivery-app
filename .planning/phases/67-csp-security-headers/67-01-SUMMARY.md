---
phase: 67-csp-security-headers
plan: 01
subsystem: infra
tags: [csp, security-headers, sentry, eslint]

requires:
  - phase: none
    provides: n/a
provides:
  - Enforcing Content-Security-Policy header on all responses
  - Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
  - CSP violation reporting to Sentry /security/ endpoint
  - ESLint cssText prevention rule
affects: [68-rate-limiting]

tech-stack:
  added: []
  patterns:
    - "CSP directives built from array with .filter(Boolean).join('; ')"
    - "Sentry DSN parsed at build time for CSP report-uri endpoint"
    - "no-restricted-properties ESLint rule for cssText prevention"

key-files:
  created: []
  modified:
    - next.config.ts
    - eslint.config.mjs

key-decisions:
  - "Used no-restricted-properties instead of no-restricted-syntax for cssText rule to avoid ESLint flat config merge conflict"
  - "CSP validated in Report-Only mode then upgraded to enforcing after CI pass"
  - "unsafe-eval gated to development only (React Fast Refresh)"
  - "upgrade-insecure-requests excluded in development to avoid localhost breakage"

duration: 15min
completed: 2026-02-17
---

# Phase 67 Plan 01: CSP & Security Headers Summary

**Enforcing Content-Security-Policy with 8 whitelisted external domains, Sentry violation reporting, 5 security headers, and ESLint cssText guard**

## Performance

- **Duration:** 15 min
- **Tasks:** 4
- **Files modified:** 2

## Accomplishments

- CSP header with directives for Google Maps, Supabase, Sentry, Google Fonts, Google Drive
- Sentry CSP violation reporting via report-uri and Report-To headers
- 5 security headers: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- ESLint no-restricted-properties rule warns on cssText usage
- CSP validated in Report-Only, then upgraded to enforcing mode

## Task Commits

1. **Task 1: Add CSP Report-Only and security headers** - `e53b0fe` (feat)
2. **Task 2: Add ESLint cssText prevention rule** - `9887541` (feat)
3. **Task 3: Validate CSP in production** - checkpoint (user approved after CI pass)
4. **Task 4: Upgrade CSP to enforcing mode** - `c5f9d2d` (feat)

## Files Created/Modified

- `next.config.ts` - CSP header, security headers, Sentry DSN parsing, Report-To/Reporting-Endpoints
- `eslint.config.mjs` - no-restricted-properties rule for cssText at warn level

## Decisions Made

- Used `no-restricted-properties` instead of `no-restricted-syntax` — flat config merges rules by name, and the existing design token `no-restricted-syntax` error block would override the warn-level cssText rule for overlapping file globs
- CSP validated via CI deployment before upgrading from Report-Only to enforcing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used no-restricted-properties instead of no-restricted-syntax**

- **Found during:** Task 2 (ESLint cssText rule)
- **Issue:** ESLint flat config merges same-named rules — design token block's error-level `no-restricted-syntax` would override warn-level cssText rule for `src/components/**/*.tsx`
- **Fix:** Used `no-restricted-properties` (separate rule name) which coexists with existing config
- **Files modified:** eslint.config.mjs
- **Verification:** `pnpm lint` shows 6 cssText warnings across FlyToCart.tsx and CustomMarkers.tsx
- **Committed in:** 9887541

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for ESLint rule coexistence. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CSP enforcing mode active (SEC-02 satisfied)
- ESLint cssText warnings active — Plan 02 will resolve all 6 warnings
- Ready for Wave 2 (Plan 02: cssText replacement)

---

_Phase: 67-csp-security-headers_
_Completed: 2026-02-17_
