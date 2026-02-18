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
