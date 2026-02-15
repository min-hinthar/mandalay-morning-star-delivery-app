# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** Phase 64 - Service Worker Hardening (complete)

## Current Position

Phase: 64 of 66 (Service Worker Hardening)
Plan: 5 of 5 in current phase
Status: Phase complete
Last activity: 2026-02-15 -- Completed 64-05-PLAN.md

Progress: [###############################.....] 97% (64/66 phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 268 (across v1.0-v1.7)
- Average duration: ~15 min
- Total execution time: ~65 hours

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 | 8 | 32 | 2 days |
| v1.1 | 6 | 21 | 1 day |
| v1.2 | 9 | 29 | 4 days |
| v1.3 | 10 | 53 | 2 days |
| v1.4 | 8 | 39 | 6 days |
| v1.5 | 8 | 34 | 3 days |
| v1.6 | 10 | 47 | 6 days |

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table.
Recent decisions affecting v1.7:

- DEPL-01 already complete (app live at delivery.mandalaymorningstar.com)
- LCP target revised from <2.5s to <4s (original unrealistic without architecture changes)
- Lighthouse CI warn-only until LCP baseline improves (Phase 65 enables blocking)
- Health checks use dynamic imports to avoid build-time crashes when env vars missing
- Promise.allSettled for parallel deep checks with graceful fallback
- 30-second in-memory cache prevents repeated deep checks on rapid requests
- CORS for /api/health via next.config.ts headers() (wildcard origin for monitoring dashboards)
- Config-only health check assumes healthy if env vars present (fast default path)
- Sentry captures ALL errors (ignoreErrors removed entirely per user decision)
- Error-only session replay (replaysSessionSampleRate: 0) with full privacy masking
- 20% production tracing, 100% dev tracing across all Sentry configs
- Sentry environment from NEXT_PUBLIC_VERCEL_ENV with NODE_ENV fallback
- Speed Insights at 50% sample rate to balance Hobby plan quota with statistical significance
- Removed manual window.Sentry global access and dead sendBeacon endpoint from web-vitals.tsx
- Async domAnimation instead of sync domMax removes ~25kb from critical path
- CSS fade-in-up at opacity 0.85 start (near-visible before animation) for LCP-critical content
- Pre-existing layoutId->CSS migration completed (Tabs, BottomNav, callers)
- All 7 layoutId indicator components migrated to CSS transitions (CategoryTabs, NavDots, SearchCategoryTabs, TestimonialsCarousel dots, CarouselControls dots)
- Removed layoutId prop from Tabs and NavDots interfaces entirely (TS errors guide consumers)
- CSS indicator pattern: single positioned div + tabRefs Map + ResizeObserver
- Nested LazyMotion: inner domMax overrides outer domAnimation per-route
- Toast drag removed (non-signature); X button and auto-timer dismiss with domAnimation
- Header app-logo layoutId removed (cross-route animation never fires in App Router)
- DomMaxProvider wraps customer/admin/driver/auth route layouts for drag/layoutId/useAnimate
- Admin profile auth provider from user.identities[0].provider; member-since from user.created_at
- Admin stats count audit log by actor_id (per-admin, not team total)
- Notification prefs reuse customer_settings table with upsert pattern
- discountCents hardcoded to 0 (no discount_cents column in orders table)
- Status email only fires for confirmed/cancelled transitions (no templates for out_for_delivery/delivered yet)
- priority_change added to OrderAuditAction for audit log consistency
- Admin mutation pattern: requireAdmin -> validate -> mutate -> audit log -> optional email -> response
- Notification prefs card has independent save (separate API endpoint from profile PATCH)
- Admin permissions hardcoded by role (no dynamic permission system)
- Reused SaveButton and ThemeSelector from existing components for admin profile
- Used Modal (not ConfirmDialog) for StatusChangeDialog since ConfirmDialog only supports description string
- Payment status derived from order status (no Stripe API call): delivered=Paid, cancelled=Refunded, else Pending
- Order list navigation kept as drawer pattern with "View Full Order Page" link to detail page
- Resend client used directly for manual compose emails (bypasses React email templates)
- Tiptap v3.19.0 compatible with React 19 out of the box
- CollapsibleCard action prop for header-level buttons (e.g., Compose button in EmailHistoryCard)
- Email sender name: "Mandalay Morning Star Burmese Kitchen (Los Angeles)" per user decision
- OAuth error toast shows generic user-friendly message; raw errors logged server-side only
- Google OAuth health check validates Supabase URL/anon key (OAuth through Supabase Auth, not direct Google API)
- GOOGLE_SITE_VERIFICATION in importantVars (not critical) -- app works without Search Console
- SEO verification code from env var GOOGLE_SITE_VERIFICATION (not hardcoded), graceful when undefined
- Only 5 public routes in sitemap (/, /menu, /login, /privacy, /terms)
- Privacy policy: professional + warm tone, all 5 data processors named, Sentry session replay disclosed
- Terms of service: food allergen "order at your own risk" disclaimer, California governing law, LA County jurisdiction
- Legal pages hardcode admin email string (avoid coupling to email lib constants)
- SiteFooter in (public)/layout.tsx ensures all public pages get footer without per-page imports
- FooterCTA changed from <footer> to <section> to avoid duplicate footer semantics on homepage
- Business listing URLs use generic search/homepage links with TODO for specific restaurant pages
- Copyright uses full name "Mandalay Morning Star Burmese Kitchen" in SiteFooter
- OAuth scopes confirmed non-sensitive (openid, email, profile) -- no demo video needed for Google verification
- Production deployment required before Google OAuth verification submission (Plans 01+02 code not yet deployed)
- @serwist/build added as explicit dev dependency (not transitive from @serwist/next)
- Content-hash precache via getManifest(); git short SHA for dynamic page revisions
- NavigationRoute denylist: /auth/, /monitoring, /api/ excluded from SW navigation
- Offline fallback page at /offline (force-static) served when network + cache fail
- Menu API cache TTL bumped from 5 to 15 minutes
- NEXT_PUBLIC_APP_VERSION exposed from package.json in next.config.ts
- Update banner uses info color (bg-info) distinct from offline warning (bg-primary)
- sessionStorage for dismiss count (resets per session, appropriate for update prompts)
- CSS transition width for progress bar (simpler than Radix Progress for linear countdown)
- Passive event listeners for interaction detection (no scroll jank)
- Cart persistence moved from localStorage to IndexedDB via idb-keyval adapter
- Transparent one-time localStorage-to-IndexedDB migration on first load
- pendingSync flag on CartItem for offline-added items (optional boolean, not separate queue)
- Online event listener clears pendingSync + shows "Cart synced!" toast on reconnect
- _hasHydrated flag for async hydration tracking (UI should check before rendering cart count)
- fake-indexeddb/auto added to test setup for IndexedDB mock in jsdom
- Offline banner text: "You're offline -- showing cached content" (not just "You're offline")
- Manual refresh button on reconnection banner (user chooses when to refresh)
- Custom event "offline-state-change" for banner priority coordination (offline wins over update)
- document.documentElement.dataset.offline for disabling non-queueable actions
- OfflinePage as self-contained 'use client' component (no ErrorPageShell dependency for offline weight)
- getRegistration('/') replaces register('/sw.js', {scope: '/driver'}) to reuse root SW registration
- Sentry breadcrumbs (not custom metrics) for cache observability -- lightweight, no pipeline overhead
- invalidateMenuCache opens 'menu-api-cache-v1' directly via Cache API (matches sw.ts cache name)

### Pending Todos

None yet.

### Blockers/Concerns

- LCP 8-11s: Optimization complete (async domAnimation root + CSS animations + layoutId migration + per-route domMax). Lighthouse manual verification pending.
- OAuth redirect URLs: Google configured and verified; Apple deferred
- Resend domain: Verified; SPF/DKIM/DMARC confirmed passing
- Service worker scope: RESOLVED -- consolidated to root `/` scope (64-05)
- Build environment: Turbopack ENOENT on OneDrive-synced directory (pre-existing, not blocking deploys)

## Session Continuity

Last session: 2026-02-15
Stopped at: Completed 64-05-PLAN.md (Phase 64 complete)
Resume file: None
