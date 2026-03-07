---
status: awaiting_human_verify
trigger: "Google OAuth login succeeds (session created) but no profile row is inserted in the profiles table. Address save at checkout fails."
created: 2026-03-04T00:00:00Z
updated: 2026-03-04T01:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - Multiple compounding silent-failure paths in ensureProfile and service client configuration prevented profile creation. Previous fix addressed the wrong layer (code logic was correct but service client config and error handling were broken).
test: Applied multi-layered fix addressing service client auth config, error propagation, fallback mechanisms, and RLS policy gap
expecting: Profile reliably created regardless of service client issues via 4-layer defense
next_action: Awaiting human verification of Google OAuth flow and address save

## Symptoms

expected: Profile row should be created automatically in profiles table after Google OAuth sign-in
actual: User is logged in (session exists) but no row in profiles table. Address save at checkout fails because there's no profile row to update.
errors: Address save fails -- likely a DB error when trying to INSERT address with FK to non-existent profile
reproduction: Sign in with Google OAuth, then try to save an address at checkout
started: Never worked -- Google OAuth profile creation was never reliable

## Eliminated

- hypothesis: getRoleDashboard self-healing calls auth.getUser() on sessionless service client
  evidence: Previous fix already addressed this by adding ensureProfile() with admin.getUserById() fallback and passing email from callers
  timestamp: 2026-03-04T00:30:00Z

- hypothesis: Auth callback doesn't pass email to getRoleDashboard
  evidence: Previous fix already updated all callers to pass sessionData.session.user.email
  timestamp: 2026-03-04T00:30:00Z

- hypothesis: Previous fix code logic was wrong
  evidence: Code trace confirmed upsert logic is correct in principle. The issue is runtime behavior, not logic.
  timestamp: 2026-03-04T01:00:00Z

## Evidence

- timestamp: 2026-03-04T00:10:00Z
  checked: DB trigger handle_new_user() in 002_functions.sql
  found: Trigger exists - fires AFTER INSERT ON auth.users, inserts into profiles. Only fires for NEW users, not returning OAuth users.
  implication: For returning Google OAuth users (user already in auth.users), trigger never fires again.

- timestamp: 2026-03-04T00:15:00Z
  checked: Previous fix in role-redirect.ts ensureProfile function
  found: Code looks correct -- upsert with service client. BUT errors are logged, not thrown. Callers proceed regardless.
  implication: If upsert fails for ANY reason, the code silently continues and downstream FK violations occur.

- timestamp: 2026-03-04T00:20:00Z
  checked: Auth callback and addresses route both call ensureProfile
  found: Both callers pass email. Both use createServiceClient().
  implication: If service client creation or upsert fails, both paths fail silently.

- timestamp: 2026-03-04T00:25:00Z
  checked: RLS policies on profiles table (003_rls.sql)
  found: NO INSERT policy. Only SELECT and UPDATE. Service client bypasses RLS, but no fallback if service client fails.
  implication: Only service_role can insert profiles. Zero fallback path.

- timestamp: 2026-03-04T01:00:00Z
  checked: createServiceClient() implementation in server.ts
  found: Missing auth config: persistSession, autoRefreshToken, detectSessionInUrl all default to true. Supabase docs REQUIRE these to be false for server-side service clients.
  implication: Service client may be interfering with session management in server context, causing auth.admin calls or PostgREST requests to behave unexpectedly.

- timestamp: 2026-03-04T01:05:00Z
  checked: Global fetch config in createServiceClient
  found: AbortSignal.timeout(5000) on ALL fetches including service client. admin.getUserById + upsert must complete in 5s.
  implication: Under load or cold starts, 5s timeout could cause premature abort. Error would be swallowed by ensureProfile's logger.

- timestamp: 2026-03-04T01:10:00Z
  checked: ensureProfile error handling pattern
  found: Function returns void, logs errors but never throws. No caller checks for success/failure.
  implication: Profile creation is entirely fire-and-forget. Downstream code assumes profile exists but has no verification.

- timestamp: 2026-03-04T01:15:00Z
  checked: Supabase docs on server-side service client configuration
  found: Official docs mandate auth.persistSession=false, auth.autoRefreshToken=false, auth.detectSessionInUrl=false for service role clients in server environments.
  implication: Missing config is a documented misconfiguration that can cause issues.

## Resolution

root_cause: |
  Multiple compounding silent-failure paths prevented profile creation:
  1. createServiceClient() missing required auth config (persistSession/autoRefreshToken/detectSessionInUrl=false) -- Supabase docs mandate these for server-side service clients
  2. ensureProfile swallowed ALL errors (logged but never threw) -- callers never knew profile creation failed
  3. No INSERT RLS policy on profiles table -- zero fallback if service client fails
  4. 5-second fetch timeout could cause premature abort under load
fix: |
  Four-layer defense:
  1. Fixed createServiceClient() auth config: persistSession=false, autoRefreshToken=false, detectSessionInUrl=false. Increased timeout from 5s to 8s.
  2. Rewrote ensureProfile() to THROW on failure instead of silently logging. Added fallback from upsert to plain insert. Added post-insert verification SELECT to confirm profile exists.
  3. Added profiles_insert_own RLS policy (new migration) allowing authenticated users to insert their own profile row -- provides fallback when service client fails.
  4. Updated addresses and checkout routes with dual-strategy: try service client first, fall back to user's own authenticated client if service fails.
  5. Added PROFILE_ERROR code to CheckoutErrorCode for specific user-facing error messaging.
verification: typecheck pass, lint pass, lint:css pass, format:check pass, 519/519 tests pass, production build succeeds
files_changed:
  - src/lib/supabase/server.ts (service client auth config fix + timeout increase)
  - src/lib/auth/role-redirect.ts (ensureProfile error throwing + fallback + verification)
  - src/app/api/addresses/route.ts (dual-strategy profile creation + PROFILE_ERROR response)
  - src/app/api/checkout/session/route.ts (dual-strategy profile creation + PROFILE_ERROR response)
  - src/types/checkout.ts (PROFILE_ERROR added to CheckoutErrorCode)
  - supabase/migrations/20260304_profiles_insert_policy.sql (INSERT RLS policy for profiles)
