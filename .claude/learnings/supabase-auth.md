# Supabase Auth Learnings

## `generateLink` vs `inviteUserByEmail`

`inviteUserByEmail` only works for NEW users. Use `generateLink({ type: "magiclink" })` for both new and existing.

---

## RLS Cannot Query auth.users

Use `auth.jwt() ->> 'email'` instead of `SELECT email FROM auth.users`. Regular users lack permission on auth.users.

---

## User Metadata May Be Stale After Admin Update

`updateUserById` sets metadata server-side but client session has old data. Fallback: query by email.

---

## NEVER Use `action_link` — Use `hashed_token` + `verifyOtp()`

`action_link` uses implicit flow (hash fragments). Server Route Handlers can't read them. `redirectTo` with multiple params gets split by GoTrue.

**Fix:** Extract `hashed_token` from `generateLink()`, build custom URL, call `verifyOtp()` server-side.

---

## Idempotent RLS Migrations

Every `CREATE POLICY "new_name"` must have `DROP POLICY IF EXISTS "new_name"` — not just the old name being replaced.

---

## RLS Initplan Wrapper — `(select func())`

Bare function calls re-evaluate per row. `(select public.is_admin())` triggers initplan optimization — evaluates once per query. All RLS in this project uses this pattern.

---

## Storage Policies Require Management API

`storage.objects` owned by `supabase_storage_admin`. Use MCP `apply_migration` or `supabase db push`, never Dashboard SQL Editor.

---

## Service Client `auth.getUser()` Returns Null — Use `admin.getUserById()`

**Context:** `getRoleDashboard` self-healing tried to create missing profiles using `supabase.auth.getUser()` on a service role client. Always returned `null` because service clients have no session context. Profile insert silently failed → Google OAuth users had no profile → FK violations on addresses/orders.

**Learning:** Service role Supabase clients have NO session. `auth.getUser()` returns `{ data: { user: null } }`. For server-side user lookup, use `auth.admin.getUserById(userId)` instead.

**Fix pattern — `ensureProfile()`:**
- Accept `userId` + optional `email` params
- Upsert profile row with `onConflict: 'id'`
- If email not provided, fall back to `auth.admin.getUserById()` to get it
- Call before any FK-dependent operation (address insert, order creation)
- Belt-and-suspenders: call in auth callback AND in API routes

**Apply when:** Any server-side code that needs user data from a service role client. Never use `auth.getUser()` — use `auth.admin.getUserById()`.
