---
phase: 70-role-based-auth-redirects
plan: 02
subsystem: driver-onboarding
tags: [auth, onboarding, passwordless, driver, upgrade-flow]
dependency_graph:
  requires: []
  provides:
    - "Deactivated driver page at /driver/deactivated"
    - "Passwordless driver onboarding (form + API)"
    - "Customer-to-driver upgrade confirmation dialog"
    - "Invite metadata display (admin name, dates, email)"
    - "Expired invite detection and blocking"
  affects:
    - "Phase 70 plan 03+ (auth callback redirect routing)"
tech_stack:
  added: []
  patterns:
    - "Server/client hybrid page with OnboardWrapper"
    - "app_settings table for admin contact info"
key_files:
  created:
    - src/app/(public)/driver/deactivated/page.tsx
    - src/app/(public)/driver/onboard/OnboardWrapper.tsx
    - src/components/ui/driver/UpgradeConfirmation.tsx
  modified:
    - src/app/(public)/driver/onboard/page.tsx
    - src/components/ui/driver/OnboardingForm.tsx
    - src/app/api/driver/onboard/route.ts
    - src/components/ui/driver/index.ts
decisions:
  - id: passwordless-onboard
    choice: "Remove password entirely from onboarding flow"
    reason: "Magic link auth only; no password needed"
  - id: upgrade-confirmation
    choice: "Client wrapper component for upgrade flow"
    reason: "Server fetches data, client wrapper handles upgrade confirmation state before revealing form"
metrics:
  duration: "~17 min"
  completed: "2026-02-19"
---

# Phase 70 Plan 02: Deactivated Page, Passwordless Onboarding, Upgrade Confirmation Summary

**One-liner:** Deactivated driver page with admin contact from app_settings, passwordless onboarding with invite metadata display, and customer-to-driver upgrade confirmation dialog.

## What Was Built

### Task 1: Deactivated page + upgrade confirmation + onboard page updates
- Created `/driver/deactivated` server page that checks auth, fetches `admin_contact_info` from `app_settings`, and renders error card with email/phone links
- Created `UpgradeConfirmation` client component with cancel/accept buttons for customer-to-driver role change
- Created `OnboardWrapper` client component that shows UpgradeConfirmation first when user has customer role, then reveals form on accept
- Updated onboard page to fetch full invite metadata (`created_at`, `expires_at`, `invited_by`) and admin name from profiles
- Added expired invite detection — blocks form with "Invitation Expired" error card
- Checks user's current profile role for customer-to-driver upgrade flow
- Exported `UpgradeConfirmation` from driver barrel index

### Task 2: Remove password from form and API
- Removed `password` and `confirmPassword` from OnboardingForm Zod schema (removed `.refine()`)
- Removed password fields from form state, JSX, and fetch body
- Added invite metadata display section above form fields (invited by, invite date, expiry, email) with subdued styling
- Removed `password` from API route Zod schema and destructured data
- Removed entire `supabase.auth.updateUser({ password })` block from API
- Renumbered remaining API steps: profile upsert (1), driver record (2), invite acceptance (3)

## Verification Results

- `pnpm typecheck` -- pass
- `pnpm lint` -- pass
- `pnpm build` -- pass (both routes render as dynamic)
- No `password` references in OnboardingForm.tsx or route.ts
- No `updateUser({ password })` in route.ts
- Deactivated page queries `admin_contact_info` from app_settings
- Expired invite check blocks form display
- UpgradeConfirmation exists with confirm/cancel buttons

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| e740d3ea | feat(70-02): create deactivated driver page, upgrade confirmation, and update onboard page |
| 30ec4a07 | feat(70-02): remove password from driver onboarding and add invite metadata display |
