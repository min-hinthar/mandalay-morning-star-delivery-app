---
status: awaiting_human_verify
trigger: "Broad audit of all routes and client-server-database interactions"
created: 2026-03-04T00:00:00Z
updated: 2026-03-04T02:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - Two concrete bugs found: missing FK hints on orders->profiles joins
test: Systematic audit of all 90+ API routes, auth flows, layouts, and data paths
expecting: Fixes verified via typecheck. Need human verification that admin dashboard and cron endpoint work.
next_action: Awaiting human verification

## Symptoms

expected: All API routes correctly handle requests, auth sessions work, profile loads, payments process, data flows correctly between client -> API -> Supabase
actual: Profile and payments seem affected. Unclear full scope.
errors: Unknown — need to discover
reproduction: Check all routes systematically
started: Likely after recent v2.0 commits (tech debt fixes, phase 98 signed URLs changes)

## Eliminated

- hypothesis: Auth flow (callback/confirm) is broken
  evidence: Both routes correctly use createClient() for session exchange, createServiceClient() for role lookup, pass email to getRoleDashboard. All FK hints present.
  timestamp: 2026-03-04T01:30:00Z

- hypothesis: Supabase server client misconfigured
  evidence: createClient() has correct cookie handling. createServiceClient() has correct auth config (persistSession=false, autoRefreshToken=false, detectSessionInUrl=false). Already fixed in prior debug session.
  timestamp: 2026-03-04T01:30:00Z

- hypothesis: Profile creation is broken
  evidence: ensureProfile() correctly throws on failure, has upsert + insert fallback + verification SELECT. Callers in addresses/checkout have dual-strategy (service client then user client). profiles_insert_own RLS policy exists.
  timestamp: 2026-03-04T01:30:00Z

- hypothesis: Checkout/payment flow has bugs
  evidence: checkout/session correctly validates cart, creates order via RPC, handles Stripe session creation. Webhook handlers correctly process completed/expired/failed/refund events with idempotency guards and FK hints. No issues found.
  timestamp: 2026-03-04T01:50:00Z

- hypothesis: Admin/driver layouts have auth issues
  evidence: Both layouts correctly use createClient() for auth, query profile role, redirect unauthorized users via getRoleDashboard with service client. No issues.
  timestamp: 2026-03-04T01:35:00Z

- hypothesis: drivers->profiles joins need FK hints
  evidence: drivers table has only one FK to profiles (user_id), so no disambiguation needed. These joins are unambiguous and correct.
  timestamp: 2026-03-04T01:40:00Z

- hypothesis: Account routes (profile, addresses, settings) have issues
  evidence: All correctly use createClient() for auth, query user data with proper user_id filters, handle errors. No profile-related issues.
  timestamp: 2026-03-04T01:50:00Z

- hypothesis: Order tracking, cancel, reorder routes have issues
  evidence: All correctly handle auth, data queries, ownership checks, error cases. No new bugs found.
  timestamp: 2026-03-04T01:55:00Z

## Evidence

- timestamp: 2026-03-04T01:30:00Z
  checked: All 10 recently modified files from git status
  found: Auth flows, supabase clients, role-redirect, checkout, addresses, layouts all look correct. Previous debug session fixes are properly applied.
  implication: Recent changes did not introduce new bugs in the modified files.

- timestamp: 2026-03-04T01:35:00Z
  checked: Auth helper functions (requireAdmin, requireDriver)
  found: Both correctly use createClient() -> getUser() -> role check. requireAdmin checks JWT claims first then DB. requireDriver checks drivers table with is_active filter.
  implication: Auth guards are correct.

- timestamp: 2026-03-04T01:40:00Z
  checked: All orders->profiles joins across all API routes and pages
  found: Two files had `profiles (` or `profiles!inner (` WITHOUT FK hint in orders->profiles context:
    1. src/app/api/cron/delivery-reminders/route.ts line 65: `profiles!inner (`
    2. src/app/(admin)/admin/page.tsx line 165: `profiles (`
  Both will fail with ambiguous FK error since orders has two FKs to profiles (user_id + contacted_by).
  implication: Delivery reminder cron fails every run. Admin dashboard recent orders fails to load.

- timestamp: 2026-03-04T01:45:00Z
  checked: Stripe webhook handlers, order management routes
  found: All correctly handle auth, data queries, and error cases. FK hints present where needed.
  implication: Payment and order management flows are correct.

- timestamp: 2026-03-04T01:50:00Z
  checked: All drivers->profiles joins
  found: All originate from drivers table which has only one FK to profiles. No hint needed. Correct as-is.
  implication: No false positives in driver-related queries.

- timestamp: 2026-03-04T02:00:00Z
  checked: Typecheck after applying both fixes
  found: Clean pass (zero errors)
  implication: Fixes are type-safe.

## Resolution

root_cause: |
  Two missing PostgREST FK hints on orders->profiles joins:
  1. src/app/api/cron/delivery-reminders/route.ts: `profiles!inner (` should be `profiles!orders_user_id_fkey!inner (`
  2. src/app/(admin)/admin/page.tsx: `profiles (` should be `profiles!orders_user_id_fkey (`

  The orders table has two FKs to profiles (user_id from original schema, contacted_by from migration 030_email_reliability.sql). Without the FK hint, PostgREST cannot disambiguate and returns an error.

  Impact:
  - Delivery reminder cron job fails on every run -> no reminder emails sent to customers
  - Admin dashboard "recent orders" section fails to load customer names

  All other routes (90+ total), auth flows, payment flows, and data paths are correct.
fix: |
  Added FK hints to both files:
  1. delivery-reminders: `profiles!inner (` -> `profiles!orders_user_id_fkey!inner (`
  2. admin page: `profiles (` -> `profiles!orders_user_id_fkey (`
verification: typecheck passes cleanly
files_changed:
  - src/app/api/cron/delivery-reminders/route.ts
  - src/app/(admin)/admin/page.tsx
