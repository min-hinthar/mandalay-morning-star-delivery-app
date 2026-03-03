---
status: awaiting_human_verify
trigger: "Admin /admin/orders page shows 'Failed to load orders. Please try again.' Also audit ALL other admin routes for similar issues (wrong FK hints, wrong column names, broken queries)."
created: 2026-03-02T00:00:00Z
updated: 2026-03-02T00:01:00Z
---

## Current Focus

hypothesis: CONFIRMED — migration 030_email_reliability.sql added `orders.contacted_by UUID REFERENCES profiles(id)`, creating a SECOND FK from orders to profiles (alongside orders.user_id -> profiles). Any query selecting `profiles` from `orders` without FK hint fails due to ambiguity.
test: Verified in migration files — two FKs on orders table pointing to profiles: orders_user_id_fkey and orders_contacted_by_fkey
expecting: Fix all queries selecting `profiles` from `orders` to use `profiles!orders_user_id_fkey`
next_action: Apply fixes to all 5 affected admin API routes

## Symptoms

expected: Admin orders page loads and displays a list of orders
actual: Shows "Failed to load orders. Please try again." error message
errors: "Failed to load orders. Please try again." — Supabase query error caught by try/catch
reproduction: Navigate to /admin/orders on deployed site
started: Since migration 030_email_reliability.sql was applied (added contacted_by FK to profiles)

## Eliminated

- hypothesis: Wrong column names (line1 instead of line_1)
  evidence: admin/orders/route.ts and admin/orders/[id]/details/route.ts already use correct column names (line_1, line_2, postal_code)
  timestamp: 2026-03-02T00:01:00Z

- hypothesis: Wrong FK hint names (orders_customer_id_fkey)
  evidence: The issue is missing FK hints entirely — not wrong ones. Two FKs now exist on orders->profiles
  timestamp: 2026-03-02T00:01:00Z

## Evidence

- timestamp: 2026-03-02T00:00:00Z
  checked: Previous driver route fixes (commits 91e52462, 848f5441)
  found: Driver routes used orders_customer_id_fkey instead of orders_user_id_fkey; used line1 instead of line_1
  implication: Admin routes likely have identical issues

- timestamp: 2026-03-02T00:01:00Z
  checked: migration 030_email_reliability.sql
  found: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS contacted_by UUID REFERENCES profiles(id);"
  implication: orders table now has TWO FKs to profiles: orders_user_id_fkey and orders_contacted_by_fkey. All queries joining orders->profiles without FK hint fail with ambiguity error.

- timestamp: 2026-03-02T00:01:00Z
  checked: src/app/api/admin/orders/route.ts lines 58-61
  found: Selects `profiles (full_name, email)` from orders without FK hint
  implication: This is the root cause of "Failed to load orders." error

- timestamp: 2026-03-02T00:01:00Z
  checked: All admin API routes for orders->profiles joins without FK hints
  found: 5 affected files:
    1. src/app/api/admin/orders/route.ts (line 58)
    2. src/app/api/admin/ops/orders/route.ts (line 60)
    3. src/app/api/admin/routes/builder-orders/route.ts (line 65)
    4. src/app/api/admin/routes/[id]/route.ts (line 109) — inside orders inside route_stops
    5. src/app/api/admin/drivers/[id]/ratings/route.ts (line 103) — inside orders inside driver_ratings
  implication: All 5 must have profiles!orders_user_id_fkey FK hint added

## Resolution

root_cause: Migration 030_email_reliability.sql added a second FK from orders to profiles (orders.contacted_by -> profiles.id), making all un-hinted `profiles` joins from orders ambiguous. Supabase cannot resolve which FK to use and returns an error.
fix: Add `!orders_user_id_fkey` FK hint to all `profiles` selects from within `orders` queries across 5 admin API routes.
verification: pnpm typecheck — zero errors. pnpm lint — zero errors. Human verification of /admin/orders page pending.
files_changed:
  - src/app/api/admin/orders/route.ts
  - src/app/api/admin/ops/orders/route.ts
  - src/app/api/admin/routes/builder-orders/route.ts
  - src/app/api/admin/routes/[id]/route.ts
  - src/app/api/admin/drivers/[id]/ratings/route.ts
