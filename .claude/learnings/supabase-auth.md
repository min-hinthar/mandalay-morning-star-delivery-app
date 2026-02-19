# Supabase Auth Learnings

## `generateLink` vs `inviteUserByEmail`

`inviteUserByEmail` only works for NEW users. Existing users get "already been registered" error.

```typescript
// Fails for existing users
await supabase.auth.admin.inviteUserByEmail(email, { redirectTo, data });

// Works for BOTH new and existing users
await supabase.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: { redirectTo },
});
```

**Apply when:** Invite flows where users may already have accounts (e.g., customer -> driver upgrade).

---

## RLS Cannot Query auth.users

Policies with `auth.users` subquery fail with "permission denied for table users".

```sql
-- Regular users cannot query auth.users
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Use JWT claims instead
USING (email = (auth.jwt() ->> 'email'));
```

**Apply when:** Writing RLS policies that need to check user email.

---

## User Metadata May Be Stale After Admin Update

When `updateUserById` sets metadata server-side, client's session cookies still have old metadata.

**Fix:** Check by email as fallback:

```typescript
let inviteId = user.user_metadata?.invite_id;
if (!inviteId) {
  const { data } = await serviceSupabase
    .from("driver_invites")
    .select("id")
    .eq("email", user.email)
    .single();
  inviteId = data?.id;
}
```

**Apply when:** Using metadata set by admin API in the same request flow.

---

## NEVER Use `action_link` from `generateLink` — Use `hashed_token` Instead

`generateLink`'s `action_link` uses Supabase's **implicit flow**, which delivers tokens as `#hash` fragments. Server-side Route Handlers cannot read hash fragments — `searchParams.get("code")` returns `null`, so `exchangeCodeForSession()` fails silently.

Additionally, `redirectTo` with multiple query params (e.g., `?next=...&invite_id=...`) gets `&`-split by GoTrue's `/verify` endpoint — only the first param survives.

**Fix:** Use `hashed_token` + a custom `/auth/confirm` route that calls `verifyOtp()`:

```typescript
// API: generate token, construct our own URL
const { data: linkData } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email,
  // Do NOT pass redirectTo — it won't work correctly
});

const confirmUrl = new URL(`${appUrl}/auth/confirm`);
confirmUrl.searchParams.set("token_hash", linkData.properties.hashed_token);
confirmUrl.searchParams.set("type", "magiclink");
confirmUrl.searchParams.set("next", "/driver/onboard");
confirmUrl.searchParams.set("invite_id", inviteId);

// /auth/confirm route: verify token server-side
const { data, error } = await supabase.auth.verifyOtp({
  type,
  token_hash: tokenHash,
});
// Then process invite + redirect to `next`
```

**Apply when:** ANY use of `admin.generateLink()` where you need server-side session establishment or query param preservation.

**Related issues:** supabase/auth-js#767, supabase/auth#1738, supabase/supabase#1915

---

## Idempotent RLS Migrations — DROP Must Match CREATE Name

**Context:** Migration 022 used `DROP POLICY IF EXISTS "old_name"` then `CREATE POLICY "new_name"`. First run succeeded. Re-run via SQL Editor hit `42710 duplicate_object` because the DROP targeted the old name (already gone) while the new name already existed.

**Learning:** Every `CREATE POLICY` must be preceded by `DROP POLICY IF EXISTS` for the **same name** being created, not just the old name being replaced.

```sql
-- BROKEN on re-run: drops old name, new name already exists
DROP POLICY IF EXISTS "Admins can view all audit logs" ON order_audit_log;
CREATE POLICY "order_audit_log_select" ON order_audit_log ...;

-- IDEMPOTENT: drop both old and new names
DROP POLICY IF EXISTS "Admins can view all audit logs" ON order_audit_log;
DROP POLICY IF EXISTS "order_audit_log_select" ON order_audit_log;
CREATE POLICY "order_audit_log_select" ON order_audit_log ...;
```

**Apply when:** Writing any migration that renames RLS policies. Always guard with both old and new names.

---

## RLS Initplan Wrapper Pattern — `(select func())` for Performance

**Context:** Bare function calls like `is_admin()` in RLS policies are re-evaluated per row. Wrapping with `(select ...)` triggers PostgreSQL's initplan optimization — function evaluates once per query.

**Learning:**
```sql
-- SLOW: is_admin() called per-row
USING (is_admin())

-- FAST: evaluated once via initplan
USING ((select public.is_admin()))

-- Same for auth.uid()
USING (user_id = (select auth.uid()))
```

All RLS policies in this project use initplan wrappers. Applies to: `is_admin()`, `auth.uid()`, `get_my_driver_id()`.

**Apply when:** Writing or reviewing any RLS policy that calls a function.

---

## Storage Policy Ownership — `storage.objects` Requires Management API

**Context:** Migration 024 (driver-photos bucket) failed with `42501: must be owner of relation objects` when run through Supabase Dashboard SQL Editor.

**Learning:** `storage.objects` is owned by `supabase_storage_admin`, not `postgres`. The SQL Editor runs as `postgres` and cannot `CREATE POLICY` on tables it doesn't own.

Existing storage policies (delivery-photos, menu-photos) were created via the management API during earlier migrations — same mechanism, elevated privileges.

**Fix:** Use MCP `apply_migration` tool (management API) instead of the Dashboard SQL Editor for any migration that touches `storage.objects` policies.

```
-- These statements require supabase_storage_admin ownership:
CREATE POLICY "..." ON storage.objects ...;
DROP POLICY IF EXISTS "..." ON storage.objects;
COMMENT ON POLICY "..." ON storage.objects ...;

-- This works fine as postgres:
INSERT INTO storage.buckets (...) VALUES (...);
```

**Apply when:** Writing any migration that creates/modifies/drops RLS policies on `storage.objects`. Always apply via MCP `apply_migration` or `supabase db push`, never via Dashboard SQL Editor.
