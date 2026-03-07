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

---

## `listUsers()` Loads ALL Users — Use Profiles Table Lookup

**Context:** Driver invite route called `supabase.auth.admin.listUsers()` to find one user by email. Loads entire auth.users table into memory — O(n) on user count.

**Learning:** Never use `listUsers()` to find a single user. Query the `profiles` table by email (indexed), then `getUserById()` for auth metadata if needed.

```typescript
// BAD: loads ALL users
const { data } = await supabase.auth.admin.listUsers();
const user = data?.users?.find(u => u.email === email);

// GOOD: indexed lookup
const { data: profile } = await supabase
  .from("profiles").select("id").eq("email", email).single();
const user = profile
  ? (await supabase.auth.admin.getUserById(profile.id)).data.user
  : null;
```

**Apply when:** Looking up a single user by email or other attribute in admin/service contexts.

---

## `ON CONFLICT DO NOTHING` / `ignoreDuplicates` Won't Fill NULLs

**Context:** `handle_new_user()` trigger and `ensureProfile()` both used "do nothing on conflict" — returning OAuth users had profile rows with NULL email forever. Three layers failed to sync email.

**Learning:** `DO NOTHING` and `ignoreDuplicates: true` mean literally nothing happens on conflict — not even filling NULL columns. If a column might be NULL on first insert (e.g., email unavailable at signup), use `DO UPDATE SET col = EXCLUDED.col WHERE table.col IS NULL` to backfill without overwriting valid data.

**Fix pattern — defense in depth:**
```sql
-- DB trigger: fill NULL email on conflict
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
  WHERE profiles.email IS NULL;
```
```typescript
// App code: targeted update after upsert
await supabase.from("profiles")
  .update({ email }).eq("id", userId).is("email", null);
```

**Apply when:** Any upsert where columns may be NULL on first insert but become available later (OAuth email, display name, etc).
