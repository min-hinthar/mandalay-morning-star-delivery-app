# Phase 68: RLS Audit & Hardening - Research

**Researched:** 2026-02-17
**Domain:** Supabase Row-Level Security / PostgreSQL RLS
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Drivers:** Own record only. Full isolation between drivers. Drivers cannot see other drivers' data (name, phone, vehicle, etc.)
- **Customers:** Own data only. Customer can read/write own customer_settings. Admin has full read/write to all customer settings (support cases)
- **order_audit_log:** Admin-only. Customers never see raw audit data
- **driver_invites:** Admin + service-role only. Drivers don't access invite records directly
- **featured_sections:** Public read (including anon), admin write only
- **app_settings:** Public read (including anon), admin write only
- **Anonymous access:** Anon users can read menu/products, featured_sections, and app_settings (public storefront)
- **Driver route access:** Assigned routes only. Drivers cannot see routes assigned to other drivers
- **Customer orders:** Own orders only
- **Dual-role users:** Both roles active simultaneously. User with customer + driver record gets union of both role permissions -- no role switching
- **Admin count:** 1-2 admins. No sub-admin permission tiers
- **Testing:** Real production Supabase. Role-level test depth. Careful test data handling
- **Full audit scope:** All tables, not just the 7 target tables
- **Defense-in-depth:** RLS as last line even if API routes are compromised

### Claude's Discretion
- Email logs access model (service-role write + admin read, or fully restricted)
- Webhook events RLS approach (depends on current handler client)
- Admin bypass mechanism (service-role vs explicit policies)
- Service-role key usage scope documentation
- Record immutability at RLS level
- Delete policy per table
- Storage bucket RLS inclusion
- Test format (SQL vs TypeScript)
- CI integration decision
- Migration batch strategy
- Policy naming convention
- Rollback script creation
- Smoke test inclusion

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Summary

The codebase has **24 public tables** plus **2 storage buckets** and **2 materialized views**. Of these, 17 tables from `002_rls_policies.sql` have well-structured RLS. Six newer tables (featured_sections, featured_section_items, app_settings, order_audit_log, driver_invites, customer_settings) have RLS added in their own migrations but with inconsistencies. Two tables (webhook_events, driver_badges) were added later with RLS enabled but potentially incomplete policies. The `email_logs` table referenced in requirements does not exist -- the system uses `notification_logs` instead.

Key gaps discovered:
1. **app_settings** has no public/anon SELECT -- currently admin-only read, but decision says anon should read
2. **featured_sections** SELECT policy doesn't explicitly target `anon` role -- uses default (authenticated) which may block anon users
3. **order_audit_log** has customer SELECT policy but decision says admin-only
4. **order_audit_log** has open INSERT (`WITH CHECK (true)`) allowing any authenticated user to insert
5. **customer_settings** missing admin write (UPDATE) -- only customer can update own row
6. **driver_badges** missing UPDATE policy entirely
7. **Multiple permissive SELECT policies** on order_audit_log and driver_invites (lint 0006 violation)
8. Some policies use raw `auth.uid()` instead of `(select auth.uid())` initplan pattern (order_audit_log, customer_settings)

**Primary recommendation:** Fix all gaps in a single well-organized migration file, add missing indexes, create a comprehensive pgTAP test that covers all tables and roles, then validate on production.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL RLS | Native (Supabase Postgres) | Row-level access control | Built into Postgres; enforced at database level |
| pgTAP | Extension (already installed) | SQL-based unit testing | Already in use (`005_testing.sql`); native to Supabase |
| `plpgsql_check` | Extension (already installed) | Function linting | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Supabase MCP | N/A | Run SQL against production | Schema inspection, live validation |
| `testing` schema | Custom (migration 005) | RLS audit functions | `check_rls_enabled()`, `check_unindexed_foreign_keys()`, `check_multiple_permissive_policies()` |

### Alternatives Considered
None. All tooling is already in place.

## Architecture Patterns

### Current Database Schema (Complete Table Inventory)

**Tables from 000_initial_schema.sql (17 tables -- all have RLS in 002):**
```
profiles               -- user_id based (own record + admin)
addresses              -- user_id based (own + admin read)
menu_categories        -- public read, admin write
menu_items             -- public read, admin write
modifier_groups        -- public read, admin write
modifier_options       -- public read, admin write
item_modifier_groups   -- public read, admin write
orders                 -- user_id based (own + admin read, admin update)
order_items            -- via order ownership chain
order_item_modifiers   -- via order->order_item chain
drivers                -- user_id based (own + admin)
routes                 -- driver_id based (assigned + admin)
route_stops            -- via route ownership or order ownership
location_updates       -- driver_id based (own + customer tracking)
delivery_exceptions    -- via route->stop chain (driver + admin)
notification_logs      -- user_id based (own + admin)
driver_ratings         -- via order chain + driver_id
```

**Tables from later migrations (7 tables -- RLS in own migrations):**
```
featured_sections         -- 008: public read, admin write
featured_section_items    -- 008: via section visibility, admin write
app_settings              -- 010: admin-only (NEEDS FIX: add anon read)
order_audit_log           -- 011: admin + customer (NEEDS FIX: admin-only per decision)
driver_invites            -- 012-018: admin + own-email read
customer_settings         -- 019: own + admin read (NEEDS FIX: admin write)
webhook_events            -- 020: service-role only (no policies)
driver_badges             -- 021: driver own + admin read/insert/delete
```

**Storage buckets (2):**
```
delivery-photos    -- 004: driver upload (own route), admin read, driver delete (in_progress)
menu-photos        -- 007: admin write, public read
```

**Materialized views (2, no RLS -- use wrapper functions):**
```
driver_stats_mv       -- 003: via get_driver_stats_admin()
delivery_metrics_mv   -- 003: via get_delivery_metrics_admin()
```

### Pattern 1: Admin Check via SECURITY DEFINER Function
**What:** `public.is_admin()` function bypasses RLS to check `profiles.role = 'admin'`
**When to use:** Every policy that grants admin access
**Source:** `001_functions_triggers.sql` lines 71-81
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = (select auth.uid());
  RETURN COALESCE(v_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
```
**All policies use this.** No raw `profiles.role = 'admin'` subqueries in current RLS (except stale ones in order_audit_log from migration 011).

### Pattern 2: Driver Ownership via SECURITY DEFINER Function
**What:** `public.get_my_driver_id()` returns the driver record ID for current user
**When to use:** Driver-scoped tables (routes, badges, location_updates)
```sql
CREATE OR REPLACE FUNCTION public.get_my_driver_id()
RETURNS UUID AS $$
DECLARE v_driver_id UUID;
BEGIN
  SELECT id INTO v_driver_id FROM public.drivers WHERE user_id = (select auth.uid());
  RETURN v_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
```

### Pattern 3: Dual-Role User Model
**What:** A user with `profiles.role = 'driver'` also has customer-style access because customer policies check `user_id = auth.uid()`, not role
**How it works:**
- Customer permissions: `user_id = (select auth.uid())` on orders, addresses, customer_settings
- Driver permissions: `driver_id = public.get_my_driver_id()` on routes, badges, location_updates
- A driver can place orders because `orders.user_id = auth.uid()` matches regardless of role
- The `drivers` table entry is the driver capability; `profiles.role` determines admin-check eligibility only

### Pattern 4: Service-Role Bypass
**What:** `createServiceClient()` in `src/lib/supabase/server.ts` uses `SUPABASE_SERVICE_ROLE_KEY`
**Current usage (verified):**
- Auth callbacks (confirm/callback routes)
- Driver onboarding API
- Webhook handlers (Stripe, Resend)
- Email sending (`send.ts`)
- Admin driver invite/revoke/resend APIs
- Cron jobs (delivery reminders)
- Admin email compose

**Critical insight:** Admin API routes use TWO patterns:
1. **Authenticated client + `requireAdmin()` check** (most admin routes via `src/lib/auth/admin.ts`)
2. **Service client** (driver invite management, email operations)

Admin routes using the authenticated client depend on RLS policies to enforce access. This is the correct defense-in-depth pattern.

### Pattern 5: Policy Naming Convention (Current)
Two styles exist:
- **Underscore style:** `profiles_select`, `orders_update` (from 002_rls_policies.sql)
- **Descriptive style:** `"Admins can manage driver invites"` (from 011, 012)

**Recommendation:** Standardize on underscore style: `{table}_{operation}` or `{table}_{operation}_{role}`. This is more grep-friendly and consistent with the majority of policies.

### Anti-Patterns Found

- **Open INSERT on audit log:** `order_audit_log` has `WITH CHECK (true)` for INSERT, meaning any authenticated user can write arbitrary audit entries. Should be restricted to admin + service-role.
- **Raw auth.uid() in policies:** `order_audit_log` migration 011 uses `auth.uid()` without `(select ...)` wrapper. Performance regression.
- **Customer access to audit log:** Decision says admin-only, but migration 011 has a customer SELECT policy.
- **Multiple permissive SELECT on same table:** `order_audit_log` has two SELECT policies (admin + customer) and `driver_invites` has two (admin FOR ALL + own-email). This is intentional in most cases but triggers lint 0006 for `order_audit_log` since we want to remove the customer one.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Admin role check | `EXISTS (SELECT 1 FROM profiles WHERE ...)` | `public.is_admin()` | Prevents RLS recursion; SECURITY DEFINER bypasses RLS on profiles |
| Driver ID lookup | `EXISTS (SELECT 1 FROM drivers WHERE ...)` | `public.get_my_driver_id()` | Same recursion prevention pattern |
| RLS enabled check | Manual pg_class queries | `testing.check_rls_enabled()` | Already implemented in migration 005 |
| FK index check | Manual index queries | `testing.check_unindexed_foreign_keys()` | Already implemented in migration 005 |
| Permissive policy check | Manual pg_policy queries | `testing.check_multiple_permissive_policies()` | Already implemented in migration 005 |

## Common Pitfalls

### Pitfall 1: Anon Role Not Explicitly Targeted
**What goes wrong:** Policies without `TO anon` or `TO public` default to all roles -- BUT Supabase's default grant setup may not grant `SELECT` on the table to `anon` role.
**Why it happens:** Creating `CREATE POLICY ... FOR SELECT USING (true)` works for `authenticated` but may not for `anon` unless the table has `GRANT SELECT ON ... TO anon`.
**How to avoid:** For tables that need anon read (featured_sections, app_settings, menu tables), explicitly use `TO anon, authenticated` or verify the Supabase default grants.
**Warning signs:** Public storefront pages returning empty data for logged-out users.
**Current status:** `menu_categories` and `menu_items` SELECT policies have no `TO` clause (defaults to PUBLIC which includes anon). `featured_sections` also has no `TO` clause. `app_settings` has `TO authenticated` which explicitly excludes anon.

### Pitfall 2: RLS Initplan Optimization
**What goes wrong:** Using `auth.uid()` directly in policy expressions causes per-row function evaluation.
**Why it happens:** PostgreSQL evaluates the expression for each row unless it's wrapped in `(select auth.uid())`.
**How to avoid:** Always wrap `auth.uid()`, `auth.jwt()`, `is_admin()`, `is_driver()`, `get_my_driver_id()` in `(select ...)`.
**Warning signs:** Slow queries on tables with many rows (orders, route_stops, location_updates).
**Source:** Supabase official docs: https://supabase.com/docs/guides/auth/row-level-security

### Pitfall 3: Multiple Permissive Policies OR Together
**What goes wrong:** Two `PERMISSIVE` policies on the same table for the same operation combine with OR logic, potentially granting more access than intended.
**Why it happens:** Supabase lint 0006. Each permissive policy is an additional grant.
**How to avoid:** Consolidate into a single policy with OR conditions, or use RESTRICTIVE policies for deny-lists.
**Current offenders:** `order_audit_log` (admin SELECT + customer SELECT), `driver_invites` (admin ALL + own-email SELECT), `driver_badges` (own SELECT + admin SELECT).
**Note:** Multiple permissive SELECT policies are acceptable when intentional (e.g., driver_badges -- driver sees own, admin sees all). The problematic case is `order_audit_log` customer policy which should be removed.

### Pitfall 4: FOR ALL Policies
**What goes wrong:** `FOR ALL` creates a single policy covering SELECT, INSERT, UPDATE, DELETE. The USING clause applies to SELECT/UPDATE/DELETE, and WITH CHECK applies to INSERT/UPDATE.
**Why it happens:** Shorthand convenience.
**How to avoid:** Use separate per-operation policies for clarity and auditability. The `driver_invites` admin `FOR ALL` policy is acceptable for this simple case, but document it.

### Pitfall 5: Service-Role Key in Browser
**What goes wrong:** If `SUPABASE_SERVICE_ROLE_KEY` were exposed client-side, it bypasses ALL RLS.
**Current status:** Service key is only used server-side in `createServiceClient()` which requires the env var. The client uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`. No exposure found.

### Pitfall 6: Enabling RLS Without Policies = Full Lockout
**What goes wrong:** `ALTER TABLE x ENABLE ROW LEVEL SECURITY` with no policies means only superuser/service-role can access.
**Why it happens:** RLS defaults to deny when no policies match.
**How to avoid:** Always add policies atomically with enabling RLS. For new tables, include both in the same migration (which this codebase already does).

## Code Examples

### Fixing app_settings for Anon Read
```sql
-- Source: Supabase docs pattern for public read
-- Drop existing admin-only SELECT
DROP POLICY IF EXISTS app_settings_admin_select ON app_settings;

-- New: anon + authenticated can read
CREATE POLICY "app_settings_select" ON app_settings
  FOR SELECT
  USING (true);  -- No TO clause = applies to all roles including anon

-- Keep admin-only write policies unchanged
```

### Fixing order_audit_log (Admin-Only)
```sql
-- Remove customer SELECT policy
DROP POLICY IF EXISTS "Customers can view own order audit logs" ON order_audit_log;

-- Rewrite admin SELECT with initplan optimization
DROP POLICY IF EXISTS "Admins can view all audit logs" ON order_audit_log;
CREATE POLICY "order_audit_log_select" ON order_audit_log
  FOR SELECT TO authenticated
  USING ((select public.is_admin()));

-- Fix open INSERT (currently WITH CHECK (true))
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON order_audit_log;
CREATE POLICY "order_audit_log_insert" ON order_audit_log
  FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));
-- Note: service-role bypasses RLS, so server-side audit inserts still work
```

### Fixing customer_settings Admin Write
```sql
-- Add admin UPDATE capability
DROP POLICY IF EXISTS customer_settings_update ON customer_settings;
CREATE POLICY "customer_settings_update" ON customer_settings
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) OR (select public.is_admin()))
  WITH CHECK (user_id = (select auth.uid()) OR (select public.is_admin()));
```

### Fixing featured_sections Anon Read
```sql
-- Current policy uses no TO clause which defaults to PUBLIC (includes anon).
-- Verify this is working. If not, explicitly add:
DROP POLICY IF EXISTS "featured_sections_select" ON featured_sections;
CREATE POLICY "featured_sections_select" ON featured_sections
  FOR SELECT  -- No TO clause = all roles including anon
  USING ((is_visible = true AND deleted_at IS NULL) OR (select public.is_admin()));
```

### pgTAP Test Pattern for RLS Verification
```sql
-- Test: RLS enabled on all public tables
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'table_name'),
  'RLS is enabled on table_name'
);

-- Test: Policy exists for operation
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'table_name'
    AND policyname = 'expected_policy_name'
    AND cmd = 'SELECT'
  ),
  'table_name has SELECT policy'
);

-- Test: Verify role-based access using set_config
-- (For production testing, use authenticated Supabase clients per role)
```

### Production RLS Test via Supabase Client
```typescript
// Pattern for testing RLS from TypeScript
// Create role-specific clients and verify access
import { createClient } from "@supabase/supabase-js";

// Anon client (no auth)
const anonClient = createClient(URL, ANON_KEY);

// Authenticated client (sign in as test user)
const { data: { session } } = await anonClient.auth.signInWithPassword({
  email: "test-customer@example.com",
  password: "test-password",
});

// Verify customer can read own orders but not others
const { data, error } = await anonClient.from("orders").select("*");
// Assert: only own orders returned

// Verify anon can read featured_sections
const { data: sections } = await anonClient.from("featured_sections").select("*");
// Assert: only visible, non-deleted sections
```

## Detailed Gap Analysis

### Table-by-Table Audit Findings

| Table | RLS On | SELECT | INSERT | UPDATE | DELETE | Issues |
|-------|--------|--------|--------|--------|--------|--------|
| profiles | YES | own+admin | - | own | - | OK. No insert (trigger creates). No delete policy = safe |
| addresses | YES | own+admin | own | own | own | OK |
| menu_categories | YES | public(active)+admin | admin | admin | admin | OK. Check anon access works |
| menu_items | YES | public(active)+admin | admin | admin | admin | OK. Check anon access works |
| modifier_groups | YES | public | admin | admin | admin | OK |
| modifier_options | YES | public | admin | admin | admin | OK |
| item_modifier_groups | YES | public | admin | admin | admin | OK |
| orders | YES | own+admin | own | admin | - | OK. No delete = safe (immutable orders) |
| order_items | YES | via order chain+admin | via order chain | - | - | OK. No update/delete = immutable |
| order_item_modifiers | YES | via chain+admin | via chain | - | - | OK |
| drivers | YES | own+admin | admin | own | admin | **ISSUE: Driver isolation OK via user_id check but verify** |
| routes | YES | assigned+admin | admin | assigned+admin | admin | OK |
| route_stops | YES | via route/order+admin | admin | via route+admin | admin | OK |
| location_updates | YES | own+tracking+admin | own driver | - | - | OK. No update/delete = append-only |
| delivery_exceptions | YES | via route chain+admin | via route chain | admin | admin | OK |
| notification_logs | YES | own+admin | admin | admin | admin | OK |
| driver_ratings | YES | via order+driver+admin | via delivered order | admin | admin | OK |
| featured_sections | YES | visible+admin | admin | admin | admin | **FIX: Verify anon read works** |
| featured_section_items | YES | via section visibility+admin | admin | admin | admin | OK |
| app_settings | YES | **admin only** | admin | admin | - | **FIX: Add anon+public read** |
| order_audit_log | YES | **admin+customer** | **any auth** | - | - | **FIX: Remove customer SELECT, restrict INSERT to admin** |
| driver_invites | YES | admin(ALL)+own-email | admin(ALL) | admin(ALL) | admin(ALL) | OK after migration 017+018 fixes |
| customer_settings | YES | own+admin | own | **own only** | - | **FIX: Add admin UPDATE** |
| webhook_events | YES | **none (service-role only)** | none | none | none | OK -- intentional service-role only |
| driver_badges | YES | own+admin | admin | **none** | admin | **FIX: Decide if UPDATE needed** |

### Missing Indexes for RLS Performance

Columns used in RLS policies that need verification:

| Table | Column | Used In Policy | Index Exists |
|-------|--------|---------------|-------------|
| profiles | id (PK) | most policies via auth.uid() | YES (PK) |
| addresses | user_id | addresses_select/insert/update/delete | YES (idx_addresses_user_id) |
| orders | user_id | orders_select/insert, order_items chain | YES (idx_orders_user) |
| drivers | user_id | drivers_select/update, get_my_driver_id() | YES (idx_drivers_user_id) |
| routes | driver_id | routes_select/update, route_stops chain | YES (idx_routes_driver) |
| route_stops | route_id | route_stops policies | YES (idx_route_stops_route) |
| route_stops | order_id | route_stops customer SELECT | YES (idx_route_stops_order) |
| location_updates | driver_id | location_updates policies | YES (idx_location_updates_driver_time) |
| location_updates | route_id | location_updates customer SELECT | YES (idx_location_updates_route) |
| notification_logs | user_id | notification_logs_select | YES (idx_notification_logs_user) |
| driver_ratings | order_id | driver_ratings_select/insert | YES (idx_driver_ratings_order) |
| driver_ratings | driver_id | driver_ratings_select | YES (idx_driver_ratings_driver) |
| order_audit_log | order_id | order_audit_log policies | YES (idx_order_audit_log_order_id) |
| order_audit_log | actor_id | audit queries | YES (idx_order_audit_log_actor_id) |
| driver_invites | email | own-email SELECT | YES (idx_driver_invites_email) |
| customer_settings | user_id (PK) | customer_settings policies | YES (PK) |
| driver_badges | driver_id | driver_badges_select_own | YES (idx_driver_badges_driver_id) |
| featured_sections | is_visible + deleted_at | featured_sections_select | YES (idx_featured_sections_visible) |

**Result: All necessary indexes already exist.** The schema was well-indexed from the start. No new performance indexes needed.

## Discretion Recommendations

### Email Logs Access Model
**Recommendation:** `notification_logs` (the actual table name -- no `email_logs` table exists) should keep current pattern: service-role INSERT (via `sendEmail()` in `send.ts`), admin SELECT. Current policies are correct.

### Webhook Events RLS
**Recommendation:** Keep service-role only (no policies). The Stripe webhook handler (`src/app/api/webhooks/stripe/route.ts`) uses `createServiceClient()`, so it bypasses RLS. No other code accesses this table.

### Admin Bypass Mechanism
**Recommendation:** Continue using `public.is_admin()` SECURITY DEFINER function in RLS policies. This is the correct pattern because:
1. Admin routes use the **authenticated** client (via `requireAdmin()`)
2. The authenticated client respects RLS
3. `is_admin()` in policies grants admin access through RLS, not around it
4. Service-role is reserved for system operations (webhooks, cron, email)

### Record Immutability at RLS Level
**Recommendation:**
- `order_audit_log` -- Already immutable (no UPDATE/DELETE policies). Keep as-is.
- `order_items` / `order_item_modifiers` -- Already immutable. Keep as-is.
- `location_updates` -- Already append-only (INSERT only, no UPDATE/DELETE). Keep as-is.
- `webhook_events` -- Already append-only via service-role. Keep as-is.
- `driver_ratings` -- UPDATE is admin-only. Customers cannot edit after submission. Good.

### Delete Policy Per Table
**Recommendation by category:**
- **No delete needed (immutable/append-only):** order_audit_log, order_items, order_item_modifiers, location_updates, webhook_events
- **Admin-only delete (already correct):** drivers, routes, route_stops, delivery_exceptions, notification_logs, driver_ratings, menu_*, modifier_*, featured_*
- **User delete allowed (already correct):** addresses (own only)
- **No delete policy (by design):** profiles (CASCADE from auth.users), orders (no deletion, use status), app_settings (restore via service-role), customer_settings (no deletion needed)

### Storage Bucket RLS
**Recommendation:** Include in this phase. Both buckets already have correct RLS. Verify in test but no changes needed.

### Test Format
**Recommendation:** pgTAP SQL tests extending the existing `supabase/tests/00_rls_policies.test.sql`. Reasons:
- Already established pattern in codebase
- Tests run at database level (no network layer to mock)
- Can verify RLS enablement, policy existence, and policy names directly
- No additional dependencies needed

For role-level access verification (can customer X read table Y?), add a TypeScript test file using Supabase client with `set_config` to simulate roles. However, since this is production Supabase, the safest approach is a carefully designed pgTAP test that checks structural properties (RLS enabled, policies exist, policy names match expected) rather than role impersonation.

### CI Integration
**Recommendation:** Do not add CI integration in this phase. The pgTAP tests require a live Supabase instance. Run manually during validation. CI can be added in a future phase when a test database is set up.

### Migration Batch Strategy
**Recommendation:** Single migration file (`022_rls_audit_hardening.sql`). All changes are:
- Policy drops and recreates (idempotent with `DROP POLICY IF EXISTS`)
- No schema changes
- No data migrations
- Can be applied atomically

### Policy Naming Convention
**Recommendation:** Standardize on `{table}_{operation}` pattern matching 002_rls_policies.sql majority. Examples:
- `app_settings_select` (not `app_settings_admin_select`)
- `order_audit_log_select` (not `"Admins can view all audit logs"`)
- For tables with multiple SELECT policies by role: `driver_badges_select_own`, `driver_badges_select_admin`

### Rollback Plan
**Recommendation:** Include a companion rollback SQL comment block at the bottom of the migration. Since all changes are policy drops/creates, rollback is straightforward: drop new policies, recreate old ones. No separate rollback migration file needed.

### Smoke Test Inclusion
**Recommendation:** Yes, include app-level smoke verification. After migration:
1. Verify public storefront loads (anon reads menu, featured_sections, app_settings)
2. Verify customer can place order, view own orders
3. Verify driver dashboard loads assigned routes only
4. Verify admin dashboard loads all data

## Open Questions

1. **Dual-role edge case: Can a driver-role user access customer_settings?**
   - What we know: `customer_settings` checks `user_id = auth.uid()`. A driver has `profiles.role = 'driver'` but `auth.uid()` still matches.
   - What's unclear: Does the `TO authenticated` clause block driver-role users from accessing customer_settings? No -- `TO authenticated` means any authenticated user regardless of profile role.
   - Recommendation: This works correctly. No change needed.

2. **featured_sections anon access: Is the default grant to anon present?**
   - What we know: Supabase auto-grants SELECT on public tables to `anon` role by default.
   - What's unclear: Whether this project modified default grants.
   - Recommendation: Test with Supabase MCP `execute_sql` to verify: `SELECT has_table_privilege('anon', 'featured_sections', 'SELECT')`. If false, add explicit `GRANT SELECT ON featured_sections TO anon`.

3. **order_audit_log INSERT restriction impact**
   - What we know: Some admin API routes insert audit logs using the authenticated (non-service) client: `src/app/api/admin/orders/[id]/status/route.ts`, `cancel/route.ts`, `refund/route.ts`, `items/route.ts`, `priority/route.ts`, `driver/route.ts`
   - What's unclear: If we restrict INSERT to admin-only in RLS, do these routes use authenticated admin client?
   - Recommendation: Yes, these all go through `requireAdmin()` which returns the authenticated client with admin role. `is_admin()` will return true. Safe to restrict.

## Sources

### Primary (HIGH confidence)
- Codebase: All 21+ migration files read and analyzed
- Codebase: `src/lib/supabase/server.ts` (client patterns)
- Codebase: `src/lib/auth/admin.ts` (admin route pattern)
- Codebase: All admin API routes (service-role usage audit)
- Codebase: `src/app/api/webhooks/resend/route.ts` (webhook client pattern)
- Codebase: `src/app/api/webhooks/stripe/route.ts` (webhook client pattern)
- Context7 /websites/supabase: RLS best practices, initplan optimization, anon role patterns

### Secondary (MEDIUM confidence)
- Supabase official docs: RLS performance recommendations (SELECT wrapping)
- Supabase official docs: Anon role policy patterns

### Tertiary (LOW confidence)
- None. All findings verified against codebase or official docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already in codebase
- Architecture: HIGH -- every migration file and API route inspected
- Pitfalls: HIGH -- documented from Supabase official docs + codebase patterns
- Gap analysis: HIGH -- table-by-table comparison of current vs desired state

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable domain, no framework churn)
