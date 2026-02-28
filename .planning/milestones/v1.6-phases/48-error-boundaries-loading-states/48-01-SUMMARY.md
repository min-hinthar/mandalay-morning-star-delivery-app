---
phase: 48-error-boundaries-loading-states
plan: 01
subsystem: ui-error-handling
tags: [error-boundary, css-animation, route-error, delegation-pattern]
dependency-graph:
  requires: []
  provides: [css-only-route-error, error-boundary-delegation]
  affects: [48-02]
tech-stack:
  added: []
  patterns: [css-only-animation, error-delegation, retry-counter]
key-files:
  created: []
  modified:
    - src/components/ui/RouteError.tsx
    - src/app/error.tsx
    - src/app/(admin)/admin/error.tsx
    - src/app/(customer)/orders/error.tsx
    - src/app/(driver)/driver/error.tsx
decisions:
  - id: ERRP-06-CSS
    description: "CSS-only animate-fade-in-up replaces framer-motion m.div in error boundaries"
  - id: ERRP-06-RETRY
    description: "Retry counter uses useRef (survives re-renders); promotes go-home after 2+ failures"
  - id: ERRP-06-TOKENS
    description: "Semantic tokens bg-status-error-bg, text-status-error, text-text-primary, text-text-secondary replace ghost tokens"
metrics:
  duration: 8m32s
  completed: 2026-02-08
---

# Phase 48 Plan 01: CSS-Only RouteError & Legacy Migration Summary

**CSS-only RouteError with retry counter, Morning Star branding, and 4 legacy error boundaries migrated to delegation pattern**

## What Was Done

### Task 1: Refactor RouteError to CSS-only with enhanced UX

- Removed all framer-motion imports (`m` from `framer-motion`)
- Applied `animate-fade-in-up` CSS class from `src/styles/animations.css`
- Added retry counter with `useRef(0)` -- promotes go-home button after 2+ retries
- Added Morning Star logo via `next/image` (`/logo.png`, 48x48)
- Replaced ghost tokens: `bg-brand-red/10` -> `bg-status-error-bg`, `text-brand-red` -> `text-status-error`, `text-charcoal` -> `text-text-primary`, `text-muted-foreground` -> `text-text-secondary`
- Enhanced dev error details: added `error.stack` visibility alongside `error.message`
- Friendly messaging: "Oops, we hit a bump!" + "Give it another shot!"
- Container changed from `min-h-screen` to `min-h-[60vh]` (preserves app shell)
- Added `console.error(error)` as dev fallback alongside Sentry

### Task 2: Migrate legacy error boundaries to RouteError delegation

- Replaced 4 hand-crafted error.tsx files (50-65 lines each) with 13-line delegation pattern
- Root: `context="page"`
- Admin: `context="admin dashboard"`
- Orders: `context="orders"`
- Driver: `context="driver dashboard"`
- Removed direct imports of Sentry, lucide-react, Card/CardContent/CardHeader/CardTitle from all error files
- Net reduction: ~190 lines of duplicated error UI code

## Commits

| Hash    | Message                                                                   |
| ------- | ------------------------------------------------------------------------- |
| 9394531 | feat(48-01): refactor RouteError to CSS-only with enhanced UX             |
| 571e570 | refactor(48-01): migrate legacy error boundaries to RouteError delegation |

## Decisions Made

| ID             | Decision                                        | Rationale                                                                                 |
| -------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ERRP-06-CSS    | CSS-only animation via animate-fade-in-up       | Prevents crash loop if framer-motion itself errors                                        |
| ERRP-06-RETRY  | useRef retry counter with button hierarchy flip | Guides users to go-home after repeated failures                                           |
| ERRP-06-TOKENS | Semantic design system tokens                   | Replaces ghost tokens (brand-red, charcoal, muted-foreground) with proper semantic tokens |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- No framer-motion imports in RouteError.tsx or any error.tsx
- animate-fade-in-up class applied in RouteError
- error.stack visibility in dev mode
- Sentry captureException retained
- useRef retry counter implemented
- Morning Star logo branding present
- `pnpm lint` -- pass
- `pnpm typecheck` -- pass
- `pnpm build` -- pass (65 routes, all static/dynamic pages generated)

## Next Phase Readiness

Plan 48-02 can proceed. RouteError is now CSS-only and all error boundaries delegate to it. The loading state work in 48-02 has no blockers from this plan.
