# Phase 70: Role-Based Auth Redirects - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Users land on the correct dashboard for their role after login. Admin and driver routes are protected at layout level — unauthorized users cannot access them even by direct URL. New drivers without active records redirect to /driver/onboard. Deactivated drivers see a specific deactivated message.

Existing infrastructure: `getRoleDashboard()` in auth callback already does basic role routing. Layout-level guards exist for admin and driver routes. Login page already uses magic link + OAuth (no password fields).

</domain>

<decisions>
## Implementation Decisions

### Protection depth
- Unauthorized users (wrong role) redirect to their own role dashboard — silent, no error message
- Unify all guards: admin and driver guards both redirect to role dashboard (not `/?error=unauthorized`)
- Claude's Discretion: whether to add Next.js middleware or keep layout-only guards
- Claude's Discretion: whether middleware also covers API routes or keeps per-route `requireAdmin()`/`requireDriver()` checks
- Claude's Discretion: unauthenticated users hitting /admin or /driver — login with ?next= vs public home
- Claude's Discretion: whether to use proxy.ts or separate middleware.ts for route protection
- Claude's Discretion: access logging (Sentry breadcrumbs vs silent)
- Claude's Discretion: role caching in JWT vs always-query for callback redirect
- Claude's Discretion: honoring ?next= param after auth (with authorization check) vs always role-based

### New driver handling
- Driver with role='driver' but no active driver record → redirect to /driver/onboard
- Expired invites → blocked with 'invitation expired, contact admin for a new one' message
- After onboarding → redirect to /driver (checklist widget deferred to Phase 74)
- Customer-to-driver upgrade: same account, role overwritten to 'driver'. Require confirmation dialog first ("You're currently a customer. Accept driver invite?")
- Deactivated drivers (is_active=false) → specific 'account deactivated' page with admin contact info (pulled from app_settings)
- Passwordless onboarding: remove password from onboard API. Drivers auth via magic link or OAuth
- Onboard form: show invite details (invited by admin name, invite date, expiry date, email). Claude decides minimum form fields
- No invite → show 'No Invitation Found' state (existing behavior, keep as-is)
- Claude's Discretion: onboard form fields (name + vehicle vs name only), auth-first-then-form flow

### Redirect UX
- Branded spinner with role-specific text during callback redirect (e.g., "Loading your driver dashboard...")
- Timeout after 5 seconds → error page with BOTH 'Try again' button AND 'Back to login' link
- Keep login success ceremony (confetti animation) — plays before redirect
- Claude's Discretion: callback URL visible or replaced via replaceState
- Claude's Discretion: spinner scope (callback page only vs global overlay)
- Claude's Discretion: accessibility (aria-live announcement vs standard aria-busy)

### Edge cases
- Auto-create profile with role='customer' if authenticated user has no profile row (self-healing)
- Claude's Discretion: role changes mid-session (next login vs next page load vs realtime)
- Claude's Discretion: token refresh failures (redirect to login vs re-auth modal)
- Claude's Discretion: multi-tab signout behavior (Supabase auth state listener vs fail-on-action)
- Claude's Discretion: deactivated driver on bookmarked /driver/* routes (deactivated page vs generic redirect)
- Claude's Discretion: back button handling (replace history vs standard)
- Claude's Discretion: rate limiting on /auth/callback
- Claude's Discretion: DB-down fallback during role lookup

</decisions>

<specifics>
## Specific Ideas

- Login page is already passwordless (magic link + OAuth) — no changes needed there
- Driver onboard should show all invite metadata: admin name, invite date, expiry, email — builds trust for new hires
- Deactivated driver page should include admin contact info from app_settings so they can reach out
- Customer-to-driver upgrade requires explicit confirmation before role change
- Success ceremony (confetti) is part of the brand — keep it in the login flow

</specifics>

<deferred>
## Deferred Ideas

- **Role picker for dual-role users** (customer-turned-driver choosing between driver dashboard and customer menu) — future phase. For now, driver-role users always land on /driver with /menu accessible via navigation
- **Onboarding checklist widget on driver dashboard** — deferred to Phase 74 (Guided Walkthrough). Items identified: complete profile, check schedule, view test delivery, browse menu. Should be dismissible but return next session until all complete. "Coming soon" badges for unbuilt features (Phases 71-74)
- **Passwordless migration for all users** — not needed, already passwordless. Only onboard API had password logic (being removed)

</deferred>

---

*Phase: 70-role-based-auth-redirects*
*Context gathered: 2026-02-18*
