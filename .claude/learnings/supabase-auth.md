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

## Server-Side Callback for Magic Link Context

Pass context through redirect URL instead of relying on hash tokens:

```typescript
const { data } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: {
    redirectTo: `${BASE_URL}/auth/callback?next=/driver/onboard&invite_id=${inviteId}`,
  },
});

// In callback route - extract from searchParams
const inviteId = searchParams.get("invite_id");
```

**Apply when:** Passing context through auth flow. Simpler than client-side hash parsing.
