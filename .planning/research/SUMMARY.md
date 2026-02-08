# Project Research Summary

**Project:** Mandalay Morning Star Delivery App -- v1.6 Production Polish
**Domain:** Meal delivery PWA -- production polish before public launch
**Researched:** 2026-02-07
**Confidence:** HIGH

## Executive Summary

v1.6 is a production polish milestone for an existing, functionally complete meal delivery PWA built on Next.js 16, React 19, Supabase, Stripe, and Framer Motion. The app already works -- orders flow end-to-end, drivers deliver, admins manage. What is missing is the professional finish: branded auth pages, order confirmation emails, cart validation UX, customer settings, error/loading coverage, a proper 404 page, and driver offline sync robustness. The existing stack covers ~97% of what is needed; only 3 new server-side packages are required (resend, @react-email/components, @react-email/render) with zero client bundle impact.

The recommended approach is infrastructure-first, polish-last. Error boundaries and loading states should be added before any feature work to prevent regressions from masking behind white screens. The customer settings DB migration must precede email notification work since email preferences depend on it. Cart validation and auth form animations are independent and can be parallelized. Driver offline sync enhancement is the highest-risk item due to dual-queue architecture (Zustand localStorage + IndexedDB) and should come late when the codebase is stable. Visual polish (skeleton shimmer, micro-interactions, number counters) should be the final phase -- the error history shows animation refactoring has caused production regressions before (mobile crashes from timer cleanup, 2026-01-29/30).

The top risks are: (1) Zustand hydration race conditions breaking cart validation on fresh page loads, (2) Stripe webhook duplicate processing when adding new email notifications, (3) animation additions breaking focus management in auth forms, and (4) dual offline sync queues causing duplicate driver status updates. All four have documented prevention strategies in PITFALLS.md. The project's existing patterns (RouteError component, Zustand persist, Framer Motion AnimatePresence) provide strong templates to follow -- the key is following them consistently rather than inventing new patterns.

## Key Findings

### Recommended Stack

The existing stack is nearly complete. Three new server-only packages are needed for email templating. Everything else -- auth animations, settings page, cart validation, 404 page, command palette enhancements, driver sync retry -- uses libraries already installed.

**New dependencies (install):**
- `resend` (^6.9.1): Email sending from Next.js API routes -- SDK for already-used Resend API
- `@react-email/components` (^1.0.7): React-based email templates -- replaces raw HTML in Edge Functions
- `@react-email/render` (^2.0.4): Server-side React-to-HTML rendering for email

**Existing stack (no installs):**
- `framer-motion` (12.26.1): Auth animations, 404 page, error transitions -- already used in 174 files
- `zustand` (5.0.10): Customer preferences store, cart validation state -- already used for cart/driver
- `cmdk` (1.1.1): Command palette enhancements -- already integrated
- `serwist` (9.5.4): Driver offline sync retry via built-in BackgroundSyncQueue -- already installed
- `react-hook-form` + `zod`: Settings form validation -- already wired

**What NOT to add:** nodemailer (no delivery tracking), lottie-react (45KB for one page), react-i18next (premature), web-push (no push system exists), idb (custom IndexedDB already works).

**Client bundle impact: 0KB.** All new packages are server-only.

### Expected Features

**Must have (table stakes):**
- Branded auth pages with logo/mascot -- current plain text looks like a prototype
- Order confirmation email -- highest-opened transactional email type (>70% open rate)
- Cart validation UX -- backend validates but user sees cryptic errors
- Branded 404/error pages -- current 404 is 3 lines of text
- Social login (Google + Apple) -- 60%+ users prefer it; Supabase supports natively
- Error boundaries and loading states for all route segments -- 4 route groups have gaps

**Should have (differentiators):**
- Customer settings tab (dietary restrictions, delivery defaults, notification preferences)
- Admin/driver skeleton shimmer (replace basic `animate-pulse`)
- Search fuzzy matching (current `.includes()` misses typos on Burmese dish names)
- Premium auth animations (floating food illustrations, mascot, animated transitions)
- Cancellation/refund notification emails

**Defer (v2+):**
- Full i18n framework -- menu is already bilingual, UI chrome in English is fine for LA market
- Real-time cart sync via WebSocket -- weekly menu model means prices rarely change mid-week
- Push notifications -- no infrastructure exists; email covers v1.6
- Chat support widget -- 200KB+ JS, hurts LCP; support email suffices
- Password-based auth -- magic link + social is more secure and lower support burden

### Architecture Approach

All 7 features integrate with the existing architecture without structural changes. The app uses route groups ((public), (auth), (customer), (admin), (driver)) for bundle isolation, Zustand stores with localStorage/IndexedDB for client persistence, and Supabase Edge Functions for server-side email. New features follow established patterns: settings tab follows `ProfileTab` (useState + fetch, not Zustand), cart validation is a single mount-only hook, email preferences are checked inside Edge Functions, and error/loading files use existing `RouteError`/`RouteLoading` components.

**Major components:**
1. **Customer Settings** -- new `customer_settings` table + API route + SettingsTab component (follows ProfileTab pattern exactly)
2. **Email Notifications** -- extend existing Edge Functions with preference checks; new React Email templates for refund/cancel
3. **Cart Validation** -- new `useCartValidation` hook comparing persisted cart against live menu on page mount
4. **Driver Offline Sync** -- add exponential backoff (1s/2s/4s, max 3 retries) + 30s periodic retry to existing sync.ts
5. **Error/Loading Coverage** -- ~13 new trivial files (3-6 lines each) using existing RouteError/RouteLoading
6. **Auth Form Upgrade** -- animation additions to existing LoginForm/SignupForm (no structural changes)
7. **404 Page** -- single file redesign with branded layout, navigation links

**Total new files: ~20. Modified files: ~10.**

### Critical Pitfalls

1. **Cart validation race condition on Zustand hydration** -- Validation fires before persist middleware finishes loading from localStorage, sees empty cart. **Avoid:** Add `_hydrated` flag via `onRehydrateStorage` callback; gate validation behind it.

2. **Stripe webhook duplicate processing** -- Stripe retries on timeout, Edge Function cold starts cause 1-3s delays, duplicate emails sent. **Avoid:** Store processed `event.id` in a table with UNIQUE constraint before processing; skip if already exists.

3. **Auth animation breaking focus management** -- Framer Motion `AnimatePresence` removes DOM elements during exit, focus gets lost, autofill popups misaligned. **Avoid:** Use `onExitComplete` for focus management; keep inputs in DOM (animate opacity, not mount/unmount); test with `prefers-reduced-motion`.

4. **Driver offline sync duplicate status updates** -- Two separate queues (Zustand localStorage + IndexedDB) can fire simultaneously, both replaying the same actions. **Avoid:** Consolidate to one queue; add idempotency keys; mark items "syncing" before sending; process sequentially.

5. **Error boundaries not catching layout errors** -- `error.tsx` wraps `page.tsx` but layout wraps the error boundary. Layout errors go uncaught. **Avoid:** Place error boundaries at parent level of layouts to protect; never rely solely on error boundaries for event handler errors.

6. **Polish pass regressions** -- Restructuring animated components breaks GSAP cleanup, React Compiler optimizations, and AnimatePresence hierarchies. **Avoid:** Playwright visual snapshots before touching any animated component; run typecheck after every change; polish phase comes LAST.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Safety Net (Error Boundaries + Loading States + 404)

**Rationale:** These are zero-risk, zero-dependency additions that prevent white screens during all subsequent development. Adding error boundaries first means any bug introduced in later phases surfaces as a styled error page, not a blank screen. Approximately 13 files, each 3-6 lines.
**Delivers:** Complete error/loading coverage for all route segments; branded 404 page
**Addresses:** Error boundary coverage gaps (FEATURES P1), branded 404 (FEATURES P1)
**Avoids:** Pitfall 4 (error boundaries not catching layout errors) -- place boundaries at correct hierarchy levels

### Phase 2: Data Foundation (Customer Settings Migration + API)

**Rationale:** The `customer_settings` table is a dependency for email notification preferences (Phase 4). Must exist before email work begins. DB migration + API route + validation schema -- no UI yet.
**Delivers:** `customer_settings` table with RLS, GET/PATCH API route, Zod schema
**Addresses:** Settings infrastructure (FEATURES P2 dependency)
**Avoids:** Pitfall: settings without RLS (security mistake from PITFALLS.md)

### Phase 3: Core UX Features (Cart Validation + Settings UI + Auth Forms)

**Rationale:** These three features are independent of each other and can be built in parallel. Cart validation is pure frontend (backend already validates). Settings UI builds on Phase 2 migration. Auth form upgrade is visual-only (no functional changes to auth flow). Grouping these maximizes parallelism.
**Delivers:** Inline cart validation on mount, customer settings tab, branded auth experience
**Addresses:** Cart validation UX (FEATURES P1), customer settings (FEATURES P2), branded auth (FEATURES P1)
**Avoids:** Pitfall 1 (auth focus management -- test with reduced motion), Pitfall 2 (cart hydration race -- use `_hydrated` flag)

### Phase 4: Email System (React Email Templates + Notification Preferences)

**Rationale:** Requires Phase 2 (customer_settings table for preference checks). Install 3 new packages, build email templates in `src/emails/`, integrate preference checks into existing Edge Functions. Order confirmation email is P1; cancellation/refund emails are P3.
**Delivers:** Order confirmation email (React Email), refund/cancel emails, notification preference checks
**Uses:** resend, @react-email/components, @react-email/render (from STACK.md)
**Avoids:** Pitfall 3 (webhook idempotency -- add event ID table with UNIQUE constraint)

### Phase 5: Driver Offline Sync Enhancement

**Rationale:** Highest-risk feature. Dual-queue architecture (Zustand + IndexedDB) creates duplication risk. Should come late when codebase is stable. Enhancement is ~50 lines of code but touches critical driver delivery flow.
**Delivers:** Exponential backoff retry, 30s periodic retry, sync status badge in driver UI
**Addresses:** Driver offline retry robustness
**Avoids:** Pitfall 5 (duplicate status updates -- consolidate queues, add idempotency keys, sequential processing)

### Phase 6: Visual Polish Pass

**Rationale:** Must come LAST per PITFALLS research. Animation refactoring has caused production regressions before. Visual polish should only happen after all functional features are stable and tested. Includes: admin skeleton shimmer, search fuzzy matching, premium auth animations, dashboard number counters.
**Delivers:** Premium visual finish across admin, driver, and customer-facing pages
**Addresses:** Admin shimmer (FEATURES P2), search fuzzy matching (FEATURES P2), auth animations (FEATURES P2)
**Avoids:** Pitfall 6 (polish regressions -- Playwright visual snapshots before/after every change)

### Phase Ordering Rationale

- **Dependency chain:** Phase 2 (settings table) blocks Phase 4 (email preferences). Everything else is independent.
- **Risk ordering:** Low-risk infrastructure first (Phase 1), high-risk sync last (Phase 5), visual polish after stability (Phase 6).
- **Architecture alignment:** Phases follow the component dependency map from ARCHITECTURE.md -- independent features in parallel, dependent features sequential.
- **Pitfall avoidance:** The phase where each pitfall applies is annotated. Highest-risk pitfalls (cart hydration, webhook idempotency, sync duplicates) are addressed in their respective phases with specific prevention strategies.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Email System):** Stripe webhook idempotency implementation details; Resend domain verification flow; React Email + Tailwind 4 compatibility in production
- **Phase 5 (Driver Offline Sync):** Queue consolidation strategy (which queue to keep); Background Sync API browser support matrix; idempotency key propagation through API layer

Phases with standard patterns (skip research-phase):
- **Phase 1 (Safety Net):** Trivial file additions using existing components; fully documented in ARCHITECTURE.md
- **Phase 2 (Data Foundation):** Follows existing migration + API route patterns exactly (010_app_settings.sql, api/account/profile/route.ts)
- **Phase 3 (Core UX):** Cart validation is a simple hook; settings UI follows ProfileTab; auth animations follow CommandPalette patterns
- **Phase 6 (Visual Polish):** CSS-only changes (shimmer) + existing Framer Motion patterns; well-documented in codebase

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Only 3 new packages, all server-side, all verified against React 19 + Next.js 16. Zero client impact. |
| Features | HIGH | Competitive analysis against DoorDash/Uber Eats/Deliveroo validates priority ordering. Codebase audit confirms current state. |
| Architecture | HIGH | All patterns verified by direct codebase examination. Component dependency map tested against actual imports. |
| Pitfalls | HIGH | 6 critical pitfalls identified from official docs, project error history, and codebase audit. Each has specific prevention strategy. |

**Overall confidence:** HIGH

### Gaps to Address

- **Social login (Google + Apple):** Listed as FEATURES P1 but requires external provider setup (Google Cloud Console, Apple Developer Portal). Credentials and OAuth callback URLs need to be configured before development. Not a code gap -- an ops/config gap.
- **Resend domain verification:** Email sending requires verified sender domain in Resend dashboard. Must be done before any email feature works in production.
- **Email Edge Function current state:** FEATURES.md notes the existing `send-order-confirmation` Edge Function may be a stub. Verify whether it actually sends emails or is placeholder code before deciding whether to extend or replace.
- **Dual offline queue resolution:** PITFALLS.md identifies two sync queues (Zustand + IndexedDB) but does not prescribe which to keep. Phase 5 planning must decide: keep IndexedDB (more robust for large payloads) or Zustand (simpler, already integrated with driver UI state).
- **React Email + Tailwind v4 compatibility:** React Email 5.0 claims Tailwind 4 support, but this codebase uses Tailwind v4 with `@theme inline` (non-standard config). Email templates may need separate styling approach. Validate during Phase 4 planning.

## Sources

### Primary (HIGH confidence)
- Existing codebase examination -- all file references verified by direct reads
- Project `ERROR_HISTORY.md` -- mobile crash patterns, NEXT_REDIRECT issues, cleanup audit
- [Next.js Official: Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)
- [Supabase Social Login Docs](https://supabase.com/docs/guides/auth/social-login)
- [Supabase + Resend Auth Email Hook](https://supabase.com/docs/guides/functions/examples/auth-send-email-hook-react-email-resend)
- [Zustand Docs: Persisting Store Data](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)
- [Stripe Webhook Best Practices](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks)
- [Framer Motion: Accessibility Guide](https://framer.com/motion/guide-accessibility)

### Secondary (MEDIUM confidence)
- [Baymard Food Delivery UX Research](https://baymard.com/blog/food-delivery-takeout-launch)
- [Order Confirmation Email Best Practices - Klaviyo](https://www.klaviyo.com/blog/order-confirmation-email-tips-examples)
- [Offline-First Frontend Apps 2025 (LogRocket)](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- DoorDash / Uber Eats / Deliveroo competitive analysis (feature comparison)

### Tertiary (LOW confidence)
- [Food Delivery App UX Design 2025 (Medium)](https://medium.com/@prajapatisuketu/food-delivery-app-ui-ux-design-in-2025-trends-principles-best-practices-4eddc91ebaee) -- general trends, needs validation against specific use case

---
*Research completed: 2026-02-07*
*Ready for roadmap: yes*
