---
phase: 62-production-operations
plan: 01
subsystem: infra
tags: [seo, sitemap, robots, google-search-console, metadata]

# Dependency graph
requires:
  - phase: 60-monitoring-observability
    provides: Health check types with google_oauth and search_console services
provides:
  - Programmatic sitemap.xml with 5 public routes
  - Programmatic robots.txt with auth-gated route disallows
  - Google Search Console verification metadata via env var
affects: [62-04 (env var setup), 65-lighthouse-ci (SEO audit)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Next.js MetadataRoute.Sitemap for programmatic sitemap generation"
    - "Next.js MetadataRoute.Robots for programmatic robots.txt"
    - "Env-var-driven verification metadata (graceful when undefined)"

key-files:
  created:
    - src/app/sitemap.ts
    - src/app/robots.ts
  modified:
    - src/app/layout.tsx
    - src/app/api/health/route.ts

key-decisions:
  - "Verification code from env var GOOGLE_SITE_VERIFICATION (not hardcoded)"
  - "Only 5 public routes in sitemap (/, /menu, /login, /privacy, /terms)"

patterns-established:
  - "MetadataRoute pattern: export default function returning typed route metadata"

# Metrics
duration: 19min
completed: 2026-02-14
---

# Phase 62 Plan 01: SEO Foundation Summary

**Programmatic sitemap with 5 public routes, robots.txt disallowing auth-gated paths, and env-var-driven Google Search Console verification metadata**

## Performance

- **Duration:** 19 min
- **Started:** 2026-02-14T23:43:17Z
- **Completed:** 2026-02-15T00:02:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Sitemap.xml with 5 public routes at correct priorities (1.0 for homepage, 0.9 for menu, etc.)
- Robots.txt disallowing 9 auth-gated route prefixes (/admin/, /driver/, /api/, /auth/, /cart, /checkout, /account, /orders, /debug/)
- Google Search Console verification metadata reading from GOOGLE_SITE_VERIFICATION env var
- Fixed pre-existing health route TS error (missing google_oauth and search_console in config-only path)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sitemap.ts and robots.ts** - `05aec89` (feat)
2. **Task 2: Add Google Search Console verification metadata** - `a675ee0` (feat)

## Files Created/Modified

- `src/app/sitemap.ts` - Programmatic sitemap with 5 public routes and priorities
- `src/app/robots.ts` - Programmatic robots.txt with auth-gated route disallows
- `src/app/layout.tsx` - Added verification.google metadata from env var
- `src/app/api/health/route.ts` - Added google_oauth and search_console to config-only service checks

## Decisions Made

- Verification code from env var (not hardcoded) so it can differ between environments and be set during Plan 04
- When env var undefined, Next.js omits the meta tag entirely -- no build errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed health route missing google_oauth and search_console in config-only path**

- **Found during:** Task 1 (typecheck verification)
- **Issue:** HealthResponse["services"] type requires google_oauth and search_console but config-only path in route.ts only provided supabase, stripe, resend -- causing TS2739 error
- **Fix:** Added googleOAuthConfigured and searchConsoleConfigured checks, included both services in config-only services object, added both to allStatuses array
- **Files modified:** src/app/api/health/route.ts
- **Verification:** pnpm typecheck passes, pnpm build succeeds
- **Committed in:** 05aec89 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix necessary for typecheck to pass. No scope creep.

## Issues Encountered

- OneDrive ENOTEMPTY build error on .next/diagnostics (known issue) -- resolved by rm -rf .next before build
- TypeScript cache showed stale errors after editing health route -- resolved by clearing tsconfig.tsbuildinfo

## User Setup Required

None - GOOGLE_SITE_VERIFICATION env var will be configured in Plan 04.

## Next Phase Readiness

- SEO files ready for search engine indexing
- Google Search Console verification pending env var configuration (Plan 04)
- Sitemap and robots.txt both render as static routes in Next.js build output

---

_Phase: 62-production-operations_
_Completed: 2026-02-14_
