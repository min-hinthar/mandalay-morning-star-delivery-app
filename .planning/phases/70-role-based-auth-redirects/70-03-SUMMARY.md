---
phase: 70-role-based-auth-redirects
plan: 03
subsystem: auth
tags: [login-ceremony, callback-spinner, role-redirect, deep-linking, accessibility]
dependency-graph:
  requires:
    - "70-01 (getRoleDashboard, role-redirect.ts)"
  provides:
    - "Role-aware login success ceremony with configurable redirect"
    - "CallbackSpinner component with branded timeout fallback"
    - "Client-side role resolution from user_metadata"
    - "Authorization-checked ?next= deep linking in login flow"
  affects:
    - "70-04 (onboarding flow may use CallbackSpinner)"
tech-stack:
  added: []
  patterns:
    - "Client-side role resolution from Supabase user_metadata for redirect hint"
    - "isSafeRedirect utility for open redirect prevention"
    - "CallbackSpinner with timeout state pattern (loading -> error with retry)"
key-files:
  created:
    - src/components/ui/auth/CallbackSpinner.tsx
  modified:
    - src/components/ui/auth/LoginSuccessCeremony.tsx
    - src/components/ui/auth/index.ts
    - src/app/(auth)/login/LoginPageClient.tsx
decisions:
  - id: "client-side-role-from-metadata"
    decision: "Use user_metadata.role for client-side redirect hint instead of DB query"
    rationale: "Avoids client-side DB query; metadata is available from session. Server-side layout guards provide the real protection."
  - id: "menu-default-redirect"
    decision: "Default redirect changed from '/' to '/menu' for customer role"
    rationale: "Customers should land on menu (the main content page), not the root which just redirects anyway"
  - id: "isafe-redirect-duplicated"
    decision: "isSafeRedirect duplicated locally in LoginPageClient (same as callback/route.ts)"
    rationale: "Client component cannot import from Route Handler; utility is 1 line so duplication is acceptable"
metrics:
  duration: "~9 min"
  completed: "2026-02-19"
---

# Phase 70 Plan 03: Role-Aware Login Ceremony + CallbackSpinner Summary

**One-liner:** Role-specific login ceremony messages with configurable redirect targets and branded CallbackSpinner with 5-second timeout fallback

## What Was Built

### Task 1: Role-aware LoginSuccessCeremony + CallbackSpinner component
- Extended `LoginSuccessCeremonyProps` with `redirectTo` and `roleMessage` optional props
- Changed default redirect from `/` to `/menu` (customer default)
- Subtitle shows `roleMessage` if provided, otherwise "Taking you to your dashboard..."
- All existing animation logic (sparkle ring, golden glow, logo morph) preserved unchanged
- Created `CallbackSpinner.tsx` client component:
  - Normal state: `AuthBackground` wrapping centered `Loader2` spinner with message
  - `aria-busy="true"` on spinner container, `aria-live="polite"` on message paragraph
  - Timeout state (default 5s): error text + "Try again" button (primary) + "Back to login" link (muted)
  - Both retry and back-to-login present in timeout state (locked decision)
- Added `CallbackSpinner` export to auth barrel (`index.ts`)

### Task 2: LoginPageClient role resolution with deep link support
- Extended `SuccessProfile` interface with `redirectTo` and `roleMessage` fields
- Added `isSafeRedirect()` local utility (matches callback/route.ts logic: starts with `/`, not `//`, no `://`)
- Updated `AuthSessionListener` to resolve role from `user_metadata`:
  - `role === "admin"` -> `/admin` + "Loading your admin dashboard..."
  - `role === "driver"` -> `/driver` + "Loading your driver dashboard..."
  - Default (customer/no role) -> `/menu` + "Taking you to the menu..."
- Added `?next=` deep link handling with authorization check:
  - Admin deep links (e.g., `/admin/drivers`) honored only for admin role
  - Driver deep links honored only for driver role
  - Non-protected deep links honored for any role
  - Unauthorized deep links silently fall back to role dashboard
- `AuthSessionListener` receives `nextParam` prop from `LoginPageClient`
- `AuthCardContent` passes `redirectTo` and `roleMessage` to `LoginSuccessCeremony`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added redirectTo to useEffect dependency array**
- **Found during:** Task 1
- **Issue:** `redirectTo` was used inside the `useEffect` callback of `LoginSuccessCeremony` but not listed in the dependency array
- **Fix:** Added `redirectTo` to `[router, shouldAnimate, redirectTo]` dependency array
- **Files modified:** `src/components/ui/auth/LoginSuccessCeremony.tsx`

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |
| `pnpm build` | Pass |
| LoginSuccessCeremony no longer hardcodes `router.replace("/")` | Confirmed — uses `redirectTo ?? "/menu"` |
| CallbackSpinner has both "Try again" and "Back to login" | Confirmed |
| CallbackSpinner has `aria-busy` and `aria-live` | Confirmed |
| AuthSessionListener resolves role from user_metadata | Confirmed |
| `?next=` honored with authorization check | Confirmed |
| CallbackSpinner exported from auth barrel | Confirmed |

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | `7c258c69` | feat(70-03): role-aware LoginSuccessCeremony + CallbackSpinner component |
| 2 | `ab7b2b6f` | feat(70-03): role-aware login flow with deep link support in LoginPageClient |

## Next Phase Readiness

- **Phase 70 complete:** All 3 plans done — middleware, layout guards, deactivated/onboard pages, login ceremony
- **Ready for Phase 71:** Driver profile setup can proceed; all auth redirects and role resolution are in place
- **No blockers identified**
