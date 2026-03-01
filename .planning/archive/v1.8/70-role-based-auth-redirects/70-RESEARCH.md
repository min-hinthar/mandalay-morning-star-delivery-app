# Phase 70: Role-Based Auth Redirects - Research

**Researched:** 2026-02-18
**Domain:** Supabase Auth + Next.js 16 route protection + role-based redirects
**Confidence:** HIGH

## Summary

This phase unifies the existing scattered auth redirect logic (auth callback, login page, layout guards) into a cohesive role-based system with middleware-level protection. The project already has the core building blocks: `getRoleDashboard()` in `/auth/callback/route.ts`, layout-level guards in `(admin)/admin/layout.tsx` and `(driver)/driver/layout.tsx`, and the `requireAdmin()`/`requireDriver()` API route guards. The main gaps are: (1) no Next.js middleware/proxy.ts for pre-render route protection, (2) layout guards redirect to `/?error=unauthorized` instead of the user's role dashboard, (3) the `getRoleDashboard()` function does not handle the driver-with-no-active-record case (new/deactivated drivers), (4) the `LoginSuccessCeremony` always redirects to `/` instead of the role dashboard, (5) no deactivated driver page exists, and (6) the onboarding form still requires a password field.

The existing auth flow is: magic link/OAuth -> `/auth/callback` -> `exchangeCodeForSession()` -> `getRoleDashboard()` -> redirect. For driver invites: invite link -> `/auth/confirm` -> `verifyOtp()` -> redirect to `/driver/onboard`. The login page already handles already-authenticated users with role-based redirect (duplicated `getRoleDashboard` logic inline).

**Primary recommendation:** Create `proxy.ts` + `src/lib/supabase/middleware.ts` for session refresh and lightweight route protection (auth check only, not role checks). Keep role-based redirect logic in the auth callback and layout guards (callback has full session context; proxy cannot do DB queries efficiently). Unify all redirect targets to role-based dashboards. Add deactivated driver detection to the driver layout guard.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Unauthorized users (wrong role) redirect to their own role dashboard -- silent, no error message
- Unify all guards: admin and driver guards both redirect to role dashboard (not `/?error=unauthorized`)
- Driver with role='driver' but no active driver record -> redirect to /driver/onboard
- Expired invites -> blocked with 'invitation expired, contact admin for a new one' message
- After onboarding -> redirect to /driver (checklist widget deferred to Phase 74)
- Customer-to-driver upgrade: same account, role overwritten to 'driver'. Require confirmation dialog first ("You're currently a customer. Accept driver invite?")
- Deactivated drivers (is_active=false) -> specific 'account deactivated' page with admin contact info (pulled from app_settings)
- Passwordless onboarding: remove password from onboard API. Drivers auth via magic link or OAuth
- Onboard form: show invite details (invited by admin name, invite date, expiry date, email). Claude decides minimum form fields
- No invite -> show 'No Invitation Found' state (existing behavior, keep as-is)
- Branded spinner with role-specific text during callback redirect (e.g., "Loading your driver dashboard...")
- Timeout after 5 seconds -> error page with BOTH 'Try again' button AND 'Back to login' link
- Keep login success ceremony (confetti animation) -- plays before redirect
- Auto-create profile with role='customer' if authenticated user has no profile row (self-healing)

### Claude's Discretion
- Whether to add Next.js middleware or keep layout-only guards
- Whether middleware also covers API routes or keeps per-route `requireAdmin()`/`requireDriver()` checks
- Unauthenticated users hitting /admin or /driver -- login with ?next= vs public home
- Whether to use proxy.ts or separate middleware.ts for route protection
- Access logging (Sentry breadcrumbs vs silent)
- Role caching in JWT vs always-query for callback redirect
- Honoring ?next= param after auth (with authorization check) vs always role-based
- Onboard form fields (name + vehicle vs name only), auth-first-then-form flow
- Callback URL visible or replaced via replaceState
- Spinner scope (callback page only vs global overlay)
- Accessibility (aria-live announcement vs standard aria-busy)
- Role changes mid-session (next login vs next page load vs realtime)
- Token refresh failures (redirect to login vs re-auth modal)
- Multi-tab signout behavior (Supabase auth state listener vs fail-on-action)
- Deactivated driver on bookmarked /driver/* routes (deactivated page vs generic redirect)
- Back button handling (replace history vs standard)
- Rate limiting on /auth/callback
- DB-down fallback during role lookup

### Deferred Ideas (OUT OF SCOPE)
- Role picker for dual-role users (customer-turned-driver choosing between dashboards) -- future phase
- Onboarding checklist widget on driver dashboard -- Phase 74
- Passwordless migration for all users -- already passwordless
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Admin users redirect to /admin dashboard after login | `getRoleDashboard()` already returns `/admin` for admin role. Needs: callback redirect page with branded spinner, success ceremony integration, proxy.ts for session refresh |
| AUTH-02 | Driver users redirect to /driver dashboard after login | `getRoleDashboard()` returns `/driver` for active drivers. Needs: same callback UX improvements, deactivated driver detection |
| AUTH-03 | Customer users redirect to /menu after login | `getRoleDashboard()` currently returns `/` for customers. Must change to `/menu`. Self-healing profile creation needed for edge case |
| AUTH-04 | Driver onboarding lifecycle -- new drivers redirect to /driver/onboard | Partially implemented: callback sets driver metadata, onboard page exists at `(public)/driver/onboard`. Needs: password removal from onboard API/form, invite detail display, expired invite blocking, customer-to-driver upgrade confirmation, deactivated driver page |
| AUTH-05 | Admin and driver routes protected at proxy/middleware level before page render | No middleware exists. Must create `proxy.ts` + `updateSession()` utility. Layout guards exist but fire after page render starts. Middleware catches requests before any rendering |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | ^0.8.0 | Server-side Supabase client for middleware/server components | Official Supabase SSR package; handles cookie-based session management |
| `@supabase/supabase-js` | ^2.90.1 | Supabase client (auth, DB queries) | Core Supabase client |
| `next` | 16.1.2 | Framework routing, middleware, server components | Next.js 16 with App Router |
| `framer-motion` | (installed) | Success ceremony animation, spinners | Already used for login animations |
| `zod` | (installed) | Schema validation for onboard API | Already used for all API validation |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | (installed) | Icons for deactivated page, spinner states | Loading states, error indicators |
| `@upstash/ratelimit` | (installed) | Rate limiting for auth callback | Already integrated via `checkRateLimit()` |

### No New Dependencies Needed
All required functionality is covered by existing dependencies.

## Architecture Patterns

### Recommended File Structure
```
src/
  proxy.ts                              # Next.js middleware (project root)
  lib/supabase/
    middleware.ts                        # NEW: updateSession() for proxy.ts
    server.ts                           # Existing: createClient, createServiceClient
    client.ts                           # Existing: browser client
    actions.ts                          # Existing: signInWithMagicLink, signOut, etc.
  lib/auth/
    index.ts                            # Existing: exports requireAdmin, requireDriver
    admin.ts                            # Existing: requireAdmin()
    driver.ts                           # Existing: requireDriver()
    role-redirect.ts                    # NEW: shared getRoleDashboard(), centralized
  app/
    auth/
      callback/
        route.ts                        # MODIFY: use shared getRoleDashboard, add ?next= honoring
        CallbackPage.tsx                # NEW: client-side branded spinner page (not a route handler)
      confirm/
        route.ts                        # MODIFY: role-based redirect after verifyOtp
    (driver)/driver/
      layout.tsx                        # MODIFY: detect deactivated drivers, redirect to deactivated page
    (admin)/admin/
      layout.tsx                        # MODIFY: redirect to role dashboard instead of /?error=
    (public)/driver/
      onboard/
        page.tsx                        # MODIFY: show invite details, remove password
      deactivated/
        page.tsx                        # NEW: deactivated driver page with admin contact
    (auth)/login/
      LoginPageClient.tsx               # MODIFY: success ceremony redirects to role dashboard
    api/driver/onboard/
      route.ts                          # MODIFY: remove password field
  components/ui/
    auth/
      LoginSuccessCeremony.tsx          # MODIFY: accept redirect target, role-specific message
      CallbackSpinner.tsx               # NEW: branded redirect spinner with timeout
    driver/
      OnboardingForm.tsx                # MODIFY: remove password fields, add invite detail display
      UpgradeConfirmation.tsx           # NEW: customer-to-driver upgrade dialog
```

### Pattern 1: Middleware Session Refresh (proxy.ts)
**What:** Next.js middleware that refreshes Supabase auth tokens on every request and provides lightweight route protection
**When to use:** Every page navigation -- ensures cookies stay fresh, prevents random logouts
**Example:**
```typescript
// src/proxy.ts
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
```

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // CRITICAL: Do not put code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /admin and /driver routes for unauthenticated users
  const path = request.nextUrl.pathname;
  if (!user && (path.startsWith("/admin") || path.startsWith("/driver"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

### Pattern 2: Centralized getRoleDashboard
**What:** Single source of truth for role -> dashboard path mapping
**When to use:** Auth callback, login page, layout guards, success ceremony
**Example:**
```typescript
// src/lib/auth/role-redirect.ts
import type { SupabaseClient } from "@supabase/supabase-js";

interface ProfileRow { role: string; }
interface DriverRow { id: string; is_active: boolean; }

export type RoleRedirectResult = {
  path: string;
  role: string;
  driverStatus?: "active" | "inactive" | "no_record";
};

export async function getRoleDashboard(
  supabase: SupabaseClient,
  userId: string
): Promise<RoleRedirectResult> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const role = (profile as ProfileRow | null)?.role ?? "customer";

  // Auto-create profile if missing (self-healing)
  if (!profile) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").insert({
      id: userId,
      email: user?.email,
      role: "customer",
    });
    return { path: "/menu", role: "customer" };
  }

  if (role === "admin") return { path: "/admin", role: "admin" };

  if (role === "driver") {
    const { data: driver } = await supabase
      .from("drivers")
      .select("id, is_active")
      .eq("user_id", userId)
      .single();

    if (!driver) return { path: "/driver/onboard", role: "driver", driverStatus: "no_record" };
    if (!driver.is_active) return { path: "/driver/deactivated", role: "driver", driverStatus: "inactive" };
    return { path: "/driver", role: "driver", driverStatus: "active" };
  }

  return { path: "/menu", role: "customer" };
}
```

### Pattern 3: Client-Side Callback Page with Branded Spinner
**What:** Instead of instant server-side redirect, the callback route handler redirects to a client-side page that shows a branded spinner, plays the success ceremony, then navigates to the role dashboard
**When to use:** Post-login redirect flow
**Key insight:** The current `/auth/callback` is a Route Handler (server-side only) that returns `NextResponse.redirect()`. To show a spinner + success ceremony, the callback needs to: (1) exchange the code server-side, (2) redirect to a client page like `/auth/redirect?to=/admin&role=admin`, (3) that page shows spinner -> ceremony -> navigate.

**Alternative (simpler):** Keep the Route Handler redirect approach but enhance the `LoginSuccessCeremony` component to accept a `redirectTo` prop and show role-specific text. The success ceremony already fires on the login page via `AuthSessionListener` (onAuthStateChange SIGNED_IN event). After the ceremony animation, redirect to the role dashboard instead of `/`.

```typescript
// LoginSuccessCeremony.tsx modification
interface LoginSuccessCeremonyProps {
  userName?: string | null;
  avatarUrl?: string | null;
  redirectTo?: string;       // NEW: role-based redirect target
  roleMessage?: string;      // NEW: "Loading your driver dashboard..."
}

export function LoginSuccessCeremony({ userName, avatarUrl, redirectTo = "/", roleMessage }: LoginSuccessCeremonyProps) {
  const router = useRouter();
  // ...
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace(redirectTo);
    }, duration);
    return () => clearTimeout(timeout);
  }, [router, shouldAnimate, redirectTo]);
  // ...
}
```

### Pattern 4: Driver Layout Guard with Deactivated Detection
**What:** Enhanced driver layout that distinguishes between "no driver record" and "deactivated" states
**When to use:** Every navigation to /driver/* routes
```typescript
// (driver)/driver/layout.tsx -- modified guard section
const { data: driver } = await supabase
  .from("drivers")
  .select("id, user_id, is_active, vehicle_type, rating_avg, deliveries_count")
  .eq("user_id", user.id)
  .single();  // Remove .eq("is_active", true) to catch deactivated drivers

if (!driver) {
  // No driver record at all -- check role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "driver") {
    redirect("/driver/onboard");  // Has role but no record
  }
  // Wrong role -- silent redirect to their dashboard
  const result = await getRoleDashboard(supabase, user.id);
  redirect(result.path);
}

if (!driver.is_active) {
  redirect("/driver/deactivated");
}
```

### Anti-Patterns to Avoid
- **Role checks in middleware:** Middleware runs on every request including static assets. DB queries in middleware add latency to every navigation. Keep role checks in layout guards (server components) where they only run for that route group.
- **Duplicating getRoleDashboard logic:** Currently duplicated in callback route and login page. Must centralize to one shared function.
- **Using getSession() instead of getUser():** `getSession()` reads from the JWT without server validation. `getUser()` makes a network request to Supabase Auth to validate the token. For security-sensitive checks (route protection), always use `getUser()`.
- **Putting code between createServerClient and getUser() in middleware:** The Supabase SSR docs explicitly warn against this. The cookie read/write must happen atomically with the session refresh.

## Discretion Recommendations

### Middleware vs Layout-Only Guards
**Recommendation: Use middleware (proxy.ts) for session refresh + lightweight auth check. Keep layout guards for role checks.**

Rationale:
- Without middleware, the Supabase session cookies are never refreshed during SSR. Users get randomly logged out when their access token expires (the SSR design doc explicitly states middleware is mandatory for session refresh).
- Middleware only checks "is user authenticated?" -- no DB queries, no role lookups. This is fast (<5ms overhead).
- Layout guards do the role-specific checks (admin vs driver vs customer) because they have full access to server-side DB queries and the cost is only paid for that specific route group.
- The `proxy.ts` filename is what Next.js 16 uses (previously `middleware.ts` in Next.js 15). Both work; this project should use `proxy.ts` since it's the v16 convention per the official docs.

### API Route Protection
**Recommendation: Keep per-route `requireAdmin()`/`requireDriver()` checks for API routes.**

Rationale:
- Middleware already ensures the session is refreshed for API routes.
- API routes need granular permission checks beyond just "authenticated" (e.g., admin-only endpoints, driver-specific endpoints).
- The existing `requireAdmin()` and `requireDriver()` functions are clean, well-typed, and work well. No benefit to moving this logic to middleware.

### Unauthenticated Users on /admin or /driver
**Recommendation: Redirect to `/login?next=/admin` (or `/driver`). Honor `?next=` after successful auth with authorization check.**

Rationale:
- If an admin bookmarks `/admin/drivers` and their session expires, they expect to return to that page after re-login.
- The `?next=` param is already used by the login page and forwarded through to the auth callback.
- After auth, the callback should verify the user actually has permission for the `?next=` target. If not, fall back to their role dashboard.

### Onboard Form Fields
**Recommendation: Keep name + phone + vehicle type + license plate. Remove password + confirm password fields.**

Rationale:
- The existing form collects `fullName`, `phone`, `vehicleType`, `licensePlate`, `password`, `confirmPassword`.
- Password must be removed (decision: passwordless onboarding). This removes 2 fields.
- Vehicle type and license plate are needed immediately for the driver record (the `drivers` table requires them).
- Removing vehicle info would mean a second form step later, adding complexity.
- Add invite metadata display (admin name, invite date, expiry) as read-only info above the form -- builds trust per user decision.

### Spinner Scope
**Recommendation: Callback page only (not global overlay).**

The spinner shows during the brief period between auth code exchange and redirect completion. This only happens on the `/auth/callback` flow. A global overlay would need to be wired into every navigation, adding unnecessary complexity.

Implementation: Convert the auth callback from a pure Route Handler redirect to a two-step flow:
1. Route Handler exchanges code, determines role dashboard path
2. Redirects to a client-side `/auth/redirect` page that shows spinner + ceremony + navigates

### Accessibility
**Recommendation: Use both `aria-busy="true"` on the spinner container and `aria-live="polite"` for status text changes.**

The spinner text changes (e.g., "Loading your driver dashboard..." -> "Welcome!") should be announced to screen readers. Using `aria-live="polite"` ensures changes are announced without interrupting current speech. `aria-busy` signals that the region is still loading.

### Role Changes Mid-Session
**Recommendation: Next page load (via layout guard re-check).**

Rationale:
- Realtime subscription for role changes adds complexity and a persistent WebSocket connection for a rare event.
- Layout guards already re-check on every server component render (page navigation).
- If an admin changes a user's role, the user will see the change on their next navigation. Acceptable UX for a rare operation.

### Token Refresh Failures
**Recommendation: Redirect to /login.**

Rationale:
- Token refresh failure means the session is truly expired (refresh token revoked or expired).
- A re-auth modal would need to be wired into every page, adding complexity.
- Redirecting to /login is the standard pattern. The `?next=` param preserves the user's intended destination.
- This already happens naturally: middleware calls `getUser()`, which attempts token refresh. If it fails, `user` is null, and the middleware redirects to `/login`.

### Multi-Tab Signout
**Recommendation: Supabase auth state listener (already implemented in `useAuth.ts`).**

The existing `onAuthStateChange` listener in `useAuth.ts` already handles this. When one tab signs out, the Supabase client in other tabs receives the `SIGNED_OUT` event and clears the user state. No additional work needed.

### Deactivated Driver on Bookmarked Routes
**Recommendation: Redirect to `/driver/deactivated` page (specific deactivated page).**

The driver layout guard will catch this. A deactivated driver hitting any `/driver/*` route gets redirected to the deactivated page with admin contact info. This is more helpful than a generic redirect because it explains WHY they can't access the page.

### Back Button Handling
**Recommendation: Use `router.replace()` for auth redirects to avoid redirect loops in browser history.**

The current `LoginSuccessCeremony` already uses `router.replace("/")`. Extend this pattern to all auth redirects. The callback route already uses `NextResponse.redirect()` with status 302, which is correct for server-side redirects.

### Rate Limiting on /auth/callback
**Recommendation: Add rate limiting using the existing `authSignInLimiter`.**

The callback receives the auth code from Supabase. While the code is single-use, rate limiting prevents abuse (e.g., scanning for valid codes). Use IP-based limiting since the user may not be authenticated yet. The existing `getClientIp()` utility handles extraction from `x-forwarded-for`.

### DB-Down Fallback During Role Lookup
**Recommendation: Redirect to `/` (home) as safe fallback. Log error to Sentry.**

If the profiles query fails during role lookup in the callback, the safest option is redirecting to the home page. The user is authenticated but we can't determine their role. On next navigation, the layout guard will try again. This avoids blocking users when the DB has a transient issue.

### Access Logging
**Recommendation: Silent (no Sentry breadcrumbs for normal redirects).**

Auth redirects are normal flow, not errors. Logging every redirect would create noise in Sentry. Only log actual errors (failed code exchange, failed profile lookup, unexpected states). The existing `console.error`/`console.warn` logging in the callback is sufficient for debugging.

### Role Caching in JWT
**Recommendation: Always query for callback redirect. Layout guards already query fresh.**

The callback happens once per login. The DB query cost is negligible for a one-time operation. Caching role in JWT creates staleness problems (documented in `supabase-auth.md` learnings: "User Metadata May Be Stale After Admin Update"). Layout guards already query the profiles table on every render, which is the correct pattern for freshness.

### Honoring ?next= After Auth
**Recommendation: Honor ?next= with authorization check. Fall back to role dashboard if unauthorized.**

Flow:
1. User visits `/admin/drivers` while unauthenticated
2. Middleware redirects to `/login?next=/admin/drivers`
3. User logs in, callback receives `?next=/admin/drivers`
4. Callback checks: user has admin role? Yes -> redirect to `/admin/drivers`. No -> redirect to their role dashboard.

This preserves deep links while preventing unauthorized access.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session refresh in middleware | Custom token refresh logic | `@supabase/ssr` createServerClient with `getUser()` | Handles refresh token rotation, cookie sync, race conditions |
| Rate limiting | In-memory counters | `@upstash/ratelimit` (already in project) | Distributed, Vercel-compatible, already integrated |
| Open redirect prevention | Custom URL parsing | Existing `isSafeRedirect()` function | Already handles protocol injection, double-slash attacks |
| Auth state sync across tabs | Custom BroadcastChannel | Supabase `onAuthStateChange` (already in `useAuth.ts`) | Built-in, handles all auth events including token refresh |

**Key insight:** The project already has excellent auth infrastructure. This phase is about unifying and extending it, not rebuilding it.

## Common Pitfalls

### Pitfall 1: Code Between createServerClient and getUser in Middleware
**What goes wrong:** Random user logouts, session desync between browser and server
**Why it happens:** The Supabase SSR library needs to atomically read cookies -> check token -> refresh if needed -> write new cookies. Any code between client creation and getUser() can interfere with this flow.
**How to avoid:** In middleware.ts, put the `getUser()` call immediately after `createServerClient()` with no intervening logic.
**Warning signs:** Users report being logged out randomly, especially after being away from the tab.

### Pitfall 2: Middleware DB Queries for Role Checks
**What goes wrong:** Every page load (including static assets) incurs a DB query, adding 50-200ms latency
**Why it happens:** Middleware runs on every matched request. If it queries profiles/drivers tables for role, that query runs on every navigation.
**How to avoid:** Middleware only checks authentication (user exists?). Role checks happen in layout guards (only for that route group's requests).
**Warning signs:** Slow TTFB on all pages, increased Supabase query volume.

### Pitfall 3: Forgetting to Remove eq("is_active", true) in Driver Layout
**What goes wrong:** Deactivated drivers get redirected to `/?error=not_driver` instead of `/driver/deactivated`
**Why it happens:** Current query filters `is_active = true`. A deactivated driver's query returns no row, making them indistinguishable from a non-driver.
**How to avoid:** Query without the `is_active` filter, then check `is_active` separately in application code.
**Warning signs:** Deactivated drivers see the generic error page instead of the deactivated page.

### Pitfall 4: Auth Callback Redirect Loop
**What goes wrong:** User gets stuck in a loop between /login and /auth/callback
**Why it happens:** If the callback fails to set the session cookie properly, the next request to the protected page fails auth check and redirects back to /login. The login page detects an authenticated user (from the Supabase client state) and redirects to the callback.
**How to avoid:** Ensure the callback's `exchangeCodeForSession()` result is propagated through cookies. The middleware's `updateSession()` handles this by using `setAll()` on both request and response.
**Warning signs:** Browser shows "too many redirects" error.

### Pitfall 5: User Metadata Staleness After Role Change
**What goes wrong:** Callback reads stale metadata, routes user to wrong dashboard
**Why it happens:** Admin updates user metadata via `updateUserById()`, but the user's session cookie still has old metadata.
**How to avoid:** Always query the profiles table for role, never rely on `user.user_metadata.role`. The current `getRoleDashboard()` correctly queries profiles.
**Warning signs:** User sees wrong dashboard after admin changes their role (documented in `supabase-auth.md`).

### Pitfall 6: Password Field in Onboard API After Removal
**What goes wrong:** Frontend sends no password, but Zod schema still requires it -> 400 error
**Why it happens:** Forgot to update both the API schema AND the frontend form.
**How to avoid:** Remove `password` from both `onboardSchema` (API route) and `onboardingSchema` (client form) in the same plan step.
**Warning signs:** Onboarding form submission returns "Validation failed" with password error.

### Pitfall 7: proxy.ts Matcher Too Broad
**What goes wrong:** Middleware runs on Sentry monitoring route, static assets, or API routes causing performance issues
**Why it happens:** Default matcher catches too many routes.
**How to avoid:** Exclude `_next/static`, `_next/image`, `favicon.ico`, `monitoring` (Sentry tunnel), and common static file extensions. Keep API routes IN the matcher (they need session refresh).
**Warning signs:** Increased latency on static asset requests, Sentry tunnel route breaks.

## Code Examples

### Driver Deactivated Page
```tsx
// src/app/(public)/driver/deactivated/page.tsx
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

interface SettingRow { value: unknown; }

export default async function DriverDeactivatedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch admin contact info from app_settings (public SELECT policy)
  const serviceSupabase = createServiceClient();
  const { data: contactSetting } = await serviceSupabase
    .from("app_settings")
    .select("value")
    .eq("key", "admin_contact_info")
    .returns<SettingRow[]>()
    .single();

  const contact = contactSetting?.value as { email?: string; phone?: string } | null;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card variant="alert" alertAccent="error">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-status-error shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-text-primary mb-2">Account Deactivated</h2>
                <p className="text-sm text-text-secondary mb-4">
                  Your driver account has been deactivated. If you believe this is an error,
                  please contact the admin.
                </p>
                {contact?.email && (
                  <p className="text-sm text-text-secondary">
                    Email: <a href={`mailto:${contact.email}`} className="text-primary underline">{contact.email}</a>
                  </p>
                )}
                {contact?.phone && (
                  <p className="text-sm text-text-secondary">
                    Phone: <a href={`tel:${contact.phone}`} className="text-primary underline">{contact.phone}</a>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            Go to home page
          </Link>
        </div>
      </div>
    </main>
  );
}
```

### Customer-to-Driver Upgrade Confirmation
```tsx
// Inline in onboard page or separate component
// Shows when user has role='customer' and is accessing onboard with valid invite
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface UpgradeConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function UpgradeConfirmation({ onConfirm, onCancel }: UpgradeConfirmationProps) {
  return (
    <div className="space-y-4 text-center">
      <h2 className="font-semibold text-text-primary">Switch to Driver Account?</h2>
      <p className="text-sm text-text-secondary">
        You currently have a customer account. Accepting this driver invitation
        will change your account to a driver account. You can still access the
        menu from your driver dashboard.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" className="flex-1" onClick={onConfirm}>
          Accept & Continue
        </Button>
      </div>
    </div>
  );
}
```

### Branded Callback Spinner
```tsx
// src/components/ui/auth/CallbackSpinner.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthBackground } from "@/components/ui/auth";

interface CallbackSpinnerProps {
  message: string;          // "Loading your driver dashboard..."
  redirectTo: string;       // "/driver"
  timeoutMs?: number;       // default 5000
}

export function CallbackSpinner({ message, redirectTo, timeoutMs = 5000 }: CallbackSpinnerProps) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [timeoutMs]);

  if (timedOut) {
    return (
      <AuthBackground>
        <div className="text-center space-y-4 p-8">
          <p className="text-sm text-status-error">Something took too long.</p>
          <button
            onClick={() => router.replace(redirectTo)}
            className="text-primary underline text-sm"
          >
            Try again
          </button>
          <br />
          <a href="/login" className="text-sm text-muted-foreground hover:underline">
            Back to login
          </a>
        </div>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <div className="text-center space-y-4 p-8" aria-busy="true" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </AuthBackground>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16 | File renamed; both still work but `proxy.ts` is the v16 convention |
| `getSession()` for auth checks | `getUser()` for auth checks | Supabase SSR docs update 2025 | `getUser()` validates with the server; `getSession()` only reads JWT locally |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | auth-helpers deprecated; ssr package is the replacement |
| `supabase.auth.getClaims()` | `supabase.auth.getUser()` | Recent Supabase update | `getClaims()` is the newer/preferred approach per latest docs, but `getUser()` still works and is more widely documented |

**Note on getClaims():** The latest Supabase SSR docs reference `getClaims()` as the preferred method in middleware for token refresh. However, this project uses `@supabase/supabase-js` v2.90.1 which may not have `getClaims()` yet. Verify availability before using. If unavailable, `getUser()` is the correct fallback and works identically for session refresh purposes. **Confidence: MEDIUM** -- need to check if getClaims() exists in the installed version.

## Open Questions

1. **admin_contact_info setting does not exist in app_settings**
   - What we know: The `app_settings` table exists with categories: delivery, operations, notifications. No "contact" or "support" category exists.
   - What's unclear: Whether to add a new category or a new setting key.
   - Recommendation: Add `admin_contact_info` key with category `operations` and value `{"email": "admin@morningstar.com", "phone": ""}`. Create a migration. Also add it to the admin settings UI (or defer UI to another phase -- just seed the data).

2. **proxy.ts vs middleware.ts naming**
   - What we know: Next.js 16 official docs reference `proxy.ts`. However, `middleware.ts` still works (aliased).
   - What's unclear: Whether the project should follow the new naming or stay with the established convention.
   - Recommendation: Use `proxy.ts` per the v16 convention. The roadmap already references "proxy.ts".

3. **getClaims() availability**
   - What we know: The latest Supabase docs show `getClaims()` as the preferred method for middleware session refresh.
   - What's unclear: Whether `@supabase/supabase-js` v2.90.1 includes this method.
   - Recommendation: Check at implementation time. Use `getUser()` as the safe default -- it works correctly and is well-tested.

4. **Auth callback flow architecture for branded spinner**
   - What we know: Current callback is a Route Handler that returns `NextResponse.redirect()`. Showing a branded spinner requires client-side rendering.
   - What's unclear: Best architecture for combining server-side code exchange with client-side spinner.
   - Recommendation: Two options:
     - **Option A (simpler):** Keep Route Handler redirect. The `LoginSuccessCeremony` on the login page already fires via `onAuthStateChange`. Modify it to detect role and show role-specific text before redirecting. This means the spinner shows on the LOGIN page, not a separate page.
     - **Option B (dedicated page):** Create `/auth/redirect` client page. Callback Route Handler sets session cookies then redirects to `/auth/redirect?to=/admin&role=admin`. That page shows spinner -> ceremony -> navigates. More control but more moving parts.
     - **Recommendation: Option A** for simplicity. The login page already has the session listener and success ceremony. The only change is making the ceremony role-aware and redirecting to the correct dashboard.

## Sources

### Primary (HIGH confidence)
- Codebase exploration: `src/app/auth/callback/route.ts`, `src/app/auth/confirm/route.ts`, `src/lib/auth/*.ts`, `src/app/(admin)/admin/layout.tsx`, `src/app/(driver)/driver/layout.tsx`, `src/app/(public)/driver/onboard/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/login/LoginPageClient.tsx`, `src/components/ui/auth/*.tsx`, `src/lib/supabase/*.ts`, `src/app/api/driver/onboard/route.ts`
- Context7 `/supabase/ssr` - createServerClient, middleware session refresh pattern, cookie handling
- Context7 `/vercel/next.js/v16.1.5` - middleware/proxy.ts route protection, forbidden() function, role-based access control patterns
- Context7 `/websites/supabase` - Supabase SSR middleware pattern with updateSession(), getClaims() reference

### Secondary (MEDIUM confidence)
- `.claude/learnings/supabase-auth.md` - hashed_token pattern, metadata staleness, RLS initplan wrappers
- `.claude/learnings/nextjs.md` - route group URL behavior, NEXT_REDIRECT handling

### Tertiary (LOW confidence)
- getClaims() availability in supabase-js v2.90.1 - referenced in latest docs but version compatibility unverified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, well-documented patterns
- Architecture: HIGH - based on actual codebase exploration + official Supabase SSR docs + Next.js 16 docs
- Pitfalls: HIGH - drawn from codebase learnings and official Supabase warnings
- Discretion recommendations: MEDIUM-HIGH - reasoned from project patterns and official docs, some choices are judgment calls

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable domain, established patterns)
