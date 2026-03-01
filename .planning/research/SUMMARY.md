# Project Research Summary

**Project:** Mandalay Morning Star Delivery App — v1.9 Launch-Ready MVP
**Domain:** Small-scale Saturday-only meal delivery ops tooling (20-50 orders, solo operator, family/friend drivers)
**Researched:** 2026-03-01
**Confidence:** HIGH

## Executive Summary

v1.9 is fundamentally a build-on-existing-infrastructure milestone, not a greenfield feature build. Every major capability — order status management, route creation, settings CRUD, email sending with retry, driver dashboards — already exists as working API routes and database tables. The work is (a) fixing three production-blocking bugs, (b) building admin UI surfaces that connect existing APIs, (c) migrating hardcoded constants to database-driven settings, and (d) simplifying the driver experience for non-technical family members. Zero new npm packages are required; the entire milestone ships using installed dependencies.

The recommended phase order is dictated by dependency chains, not feature priority. Bug fixes unblock everything. Configurable business rules must precede the ops dashboard because countdown timers consume settings data. The ops dashboard must precede route assignment because the unassigned orders panel feeds from the same data layer. Email reliability and driver simplification are fully independent and can run in parallel after Phase 2 ships. The architecture favors single-batch API endpoints over client-side loops, server-side driver preferences over localStorage, and Supabase RPC functions over manual multi-step rollbacks.

The dominant risk category is data integrity during bulk and multi-step operations. Three of the five critical pitfalls involve non-atomic operations: bulk status changes without a transaction, route creation with a fragile manual rollback, and email retry without idempotency. The mitigation pattern is consistent — use PostgreSQL RPC functions for operations touching multiple tables, and invalidate React Query caches from `onSettled` rather than applying optimistic patches to bulk operations.

---

## Key Findings

### Recommended Stack

No new dependencies are required. All v1.9 features build on packages already installed: `@supabase/supabase-js` for Realtime subscriptions (existing `useTrackingSubscription` pattern), `@tanstack/react-query` for data fetching and polling, `resend` SDK (v6.9.1+) which bundles `webhooks.verify()` internally eliminating any need for the separate `svix` package, `zustand` with `persist` middleware for driver preferences, `recharts` for ops dashboard status charts, Radix UI primitives for checkboxes/selects/dialogs, and `date-fns` for all time calculations.

Two explicitly rejected alternatives: `@dnd-kit` for drag-and-drop route ordering (overkill at 2-4 drivers and 5-10 stops — click-to-assign buttons are faster and avoid touch device complexity), and Supabase Realtime for the ops dashboard (React Query polling at 5-second intervals is indistinguishable from real-time at 20-50 orders and avoids the need for a new admin RLS policy on the `orders` table).

**Core technologies:**
- `@supabase/supabase-js`: database + real-time — extend existing `useTrackingSubscription` pattern to ops dashboard
- `@tanstack/react-query`: data fetching with 5-second polling — replaces need for WebSocket infra at current scale
- `resend` (^6.9.1): email + webhook verification — `webhooks.verify()` bundled, no additional svix package needed
- `zustand` + `persist`: driver simple mode preference — localStorage scoped, same pattern as cart
- `recharts`: status count visualization — PieChart for order distribution, already installed
- `react-hook-form` + `zod`: settings forms and API validation — extend existing `deliverySettingsSchema`
- `idb-keyval`: offline route caching for driver simple mode — already used for cart persistence

### Expected Features

**Must have (table stakes) — v1.9 launch blockers:**
- Bug fixes (TOCTOU checkout cleanup, `isPastCutoff()` full datetime comparison, cart debounce dedup) — production blockers; nothing else ships first
- Ops status overview with counts by status (pending/confirmed/preparing/out/delivered)
- Bulk status transitions — 40 individual order clicks is not a viable Saturday morning workflow
- Order-to-route assignment with visual panel — without this, operator texts drivers manually
- Configurable cutoff time and delivery fee — must be changeable without a code deploy
- Customer order cutoff enforcement — must block orders past cutoff with next-available-date messaging
- Email delivery status per order — operator self-diagnoses "did customer get confirmation?"
- Failed email retry — self-service recovery without developer involvement
- Driver confirmation dialog before marking delivered — prevents mis-delivery by family members

**Should have (differentiators):**
- Saturday ops command center — single screen answering "what needs attention NOW?" in under 3 seconds
- One-click route builder with unassigned/available-driver split panel
- Driver simple mode toggle — strips UI to name, address, phone, and large "Mark Delivered" button
- Email failure badge on ops dashboard — "3 emails failed" must be impossible to miss during Saturday triage
- Mini-map preview during route assignment — visual geographic grouping without an optimization algorithm
- Offline route data caching with explicit IndexedDB prefetch for family drivers in low-signal areas

**Defer (v2+):**
- Real-time GPS tracking — text-based status sufficient; WebSocket infra is overkill at this scale
- Route optimization algorithm — manual assignment scales to ~100 orders; costs money and gets it wrong
- Push notifications — transactional email covers it
- Multi-admin RBAC — solo operator only; adds schema complexity with no current benefit
- Customer loyalty/referral — get 50 regulars first
- Advanced analytics — 7-day KPIs already built are sufficient

### Architecture Approach

The architecture is extension-first: every new feature plugs into existing route groups (`(admin)/admin/`, `(driver)/driver/`), existing tables (`orders`, `routes`, `route_stops`, `app_settings`, `notification_logs`), and existing API patterns (`requireAdmin()`, `checkRateLimit()`). No new database tables are required. Three new API endpoints are needed (bulk status change, ops summary, route creation with orders), four new components subdirectories, and one new service utility (`src/lib/services/app-settings.ts`). The existing admin dashboard page becomes the ops center on Saturdays via conditional rendering — no new nav item.

**Major components:**
1. **Ops Dashboard** (`/admin` page, Saturday-conditional) — aggregates order counts, bulk actions, countdown timers; reads from new `GET /api/admin/ops/summary` endpoint
2. **Route Assignment Panel** (`/admin/routes`) — split-panel unassigned orders + available drivers; writes via new `POST /api/admin/routes` with batch stop creation inside an RPC transaction
3. **App Settings Service** (`src/lib/services/app-settings.ts`) — centralized typed settings reader with hardcoded fallbacks; consumed by every API route needing business rules
4. **Email Status Indicator** (`/admin/orders/[id]`) — queries existing `notification_logs` table; surfaces per-order send/deliver/bounce status
5. **Driver Simple Mode** (driver route pages) — server-side preference on `drivers.simple_mode` column, hydrated to Zustand store; conditional rendering hides everything except stop essentials

### Critical Pitfalls

1. **Bulk status change without atomic transaction** — looping individual PATCH calls from the client creates partial failure states and 20-second blocking operations. Build a dedicated `POST /api/admin/orders/bulk-status` endpoint using Supabase `.in()` batch update with a single transaction. Return `{ succeeded, failed }` per order. Queue emails asynchronously after the transaction, never inside it.

2. **Route creation with fragile manual rollback** — the current code does a manual `DELETE` on route after `route_stops` insert fails; if the delete also fails, an empty route orphan persists. Follow the existing `create_order_with_items` RPC pattern: wrap route + stops creation in a single PostgreSQL transaction function. Orphaned routes become impossible.

3. **Optimistic UI corruption on bulk operations** — optimistic updates work for single-item actions but are dangerous for 40-item bulk ops. On partial failure, the cache shows phantom-confirmed orders that don't exist in the DB, leading to drivers being assigned non-existent orders. Use a pending/loading overlay on affected rows instead of optimistic state, then hard-invalidate via `queryClient.invalidateQueries` in `onSettled`.

4. **Stale business rules after cutoff change** — client components importing `CUTOFF_HOUR` from `src/types/delivery.ts` never see admin changes. Every consumer of cutoff/fee constants must be audited and switched to `getAppSettings()` API reads. Use `revalidateTag('business-rules')` in the settings PATCH handler to bust Next.js cache immediately. Verify with: `grep -r "CUTOFF_HOUR\|DELIVERY_FEE_CENTS" src/` should return 0 results after migration.

5. **Email retry creates duplicates via unstable idempotency keys** — current code uses `Date.now()` in idempotency keys, defeating the purpose. Before any retry, check `notification_logs` status. If Resend webhook already confirmed delivery/open, disable the retry button. Fix idempotency key to `orderId + emailType + attemptNumber`. Cap combined retries (automatic + manual) at 3 total via `retry_count` column.

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 0: Critical Bug Fixes
**Rationale:** Three confirmed production blockers exist today. No feature work ships until they are resolved; they affect checkout integrity and core delivery logic used by every subsequent phase.
**Delivers:** Stable checkout (TOCTOU cleanup fixed with `.in()` batch), correct cutoff enforcement (full datetime comparison, not hour-only), deduplicated cart updates (Zustand timestamp dedup).
**Addresses:** CQ-01 (TOCTOU), BL-01 (cutoff logic), SC-03 (driver ownership checks flagged for audit)
**Avoids:** Any regression to checkout — run all 335 existing unit tests after each fix; add targeted test per bug.
**Research flag:** Standard patterns. No research phase needed. Fixes are line-level changes in identified files.

### Phase 1: Configurable Business Rules
**Rationale:** Must precede the ops dashboard. Countdown timers, delivery fee display, and cutoff enforcement all read from `app_settings`. Building ops dashboard first means hardcoding values and immediately retrofitting — a research-confirmed anti-pattern.
**Delivers:** `src/lib/services/app-settings.ts` typed utility with hardcoded fallbacks; new setting keys seeded in `app_settings` (`cutoff_day`, `cutoff_hour`, `delivery_fee_cents`, `free_delivery_threshold_cents`, `delivery_start_hour`, `delivery_end_hour`); admin settings form extended with new fields; all hardcoded constant consumers migrated.
**Uses:** Existing `GET/PATCH /api/admin/settings`, existing Zod schemas, existing `SettingsClient` component.
**Avoids:** Stale cutoff pitfall — implement `revalidateTag('business-rules')` cache busting in the PATCH handler from day one; add validation bounds (`cutoff_hour: z.number().min(0).max(23)`) to prevent bad data entry.
**Research flag:** Standard patterns. Well-documented Supabase + Next.js cache invalidation. Skip research phase.

### Phase 2: Saturday Ops Dashboard
**Rationale:** Core operator workflow for Saturday. Bulk status transitions are the highest-leverage feature — confirming 40 orders individually is not operationally viable. Ops dashboard also establishes the unassigned orders count that feeds route assignment in Phase 3.
**Delivers:** Saturday-conditional `/admin` home page with status count cards, bulk confirm/prepare/dispatch actions, cutoff and delivery-start countdown timers, unassigned orders badge, driver availability widget.
**Uses:** New `GET /api/admin/ops/summary`, new `POST /api/admin/orders/bulk-status` (RPC-backed transaction), React Query 5-second polling, Recharts PieChart, Radix Checkbox for bulk selection.
**Implements:** Ops Dashboard component tree (`OpsCenter/`, `StatusCountCards.tsx`, `CountdownTimer.tsx`, `UnassignedBadge.tsx`, `DriverAvailabilityWidget.tsx`).
**Avoids:** Bulk operation non-atomicity — use server-side `.in()` batch update, not client-side loops. Avoid optimistic UI for bulk ops; use pending overlay + hard refetch on `onSettled`.
**Research flag:** The bulk-status RPC function may benefit from one focused spike on Supabase RPC transaction patterns if the team hasn't authored one before. Reference: existing `create_order_with_items` in `checkout/session/route.ts`.

### Phase 3: Route and Driver Assignment
**Rationale:** Depends on ops dashboard for the unassigned orders count and data layer. Building assignment UI without the ops context would require rework. At 2-4 drivers and 5-10 stops, click-to-assign is the correct pattern — no drag-and-drop library needed.
**Delivers:** `/admin/routes` page with `UnassignedOrdersPanel`, `AvailableDriversPanel`, `RouteBuilder` (click-to-assign), mini-map pin preview, route summary cards. New `POST /api/admin/routes` RPC-backed transaction creating route + stops atomically. `GET /api/admin/orders?unassigned=true&deliveryDate=` filter.
**Uses:** Existing `routes`, `route_stops`, `orders.assigned_driver_id` schema. Google Maps existing integration for pin preview. Radix Select for driver dropdown.
**Avoids:** Orphaned route records — wrap route + stops creation in a `create_route_with_stops` RPC function following the `create_order_with_items` precedent. No manual rollback.
**Research flag:** Standard patterns. The RPC function follows an already-established project precedent. Skip research phase.

### Phase 4: Customer Pre-Checkout Gate
**Rationale:** Depends on Phase 1 (configurable rules) for the dynamic cutoff time displayed in messaging. Building the gate before configurable rules means hardcoded values in customer-facing UI — immediate tech debt.
**Delivers:** Saturday-only messaging on hero, menu page banner, cart drawer countdown, and checkout cutoff modal. Modal shows specific next available Saturday date using existing `getDeliveryDate()`. `isPastCutoff()` reads from `app_settings` instead of constant.
**Uses:** Existing `getDeliveryDate()`, `getTimeUntilCutoff()`, `getCutoffForSaturday()` (refactored to use `getAppSettings()`).
**Avoids:** Client-side constants leaking into customer UI — all cutoff data must flow from API/server-render, never imported client-side constants.
**Research flag:** Standard patterns. Skip research phase.

### Phase 5: Email Reliability
**Rationale:** Independent of all other phases. Addresses production safety: forged webhook payloads and duplicate retry emails are live risks with real customer impact. Can run in parallel with Phase 3 or 4.
**Delivers:** Proper `resend.webhooks.verify()` signature verification replacing simple header check. `retry_count` column on `notification_logs`. Email status badge on order detail page. Retry button disabled when Resend confirmed delivery. Idempotency key fixed to stable `orderId + emailType + attemptNumber`. Webhook deduplication via `svix-id` check.
**Uses:** Existing `resend` SDK (v6.9.1 — `webhooks.verify()` already bundled). Existing `notification_logs`, `webhook_events` tables. Existing admin email page and resend endpoint.
**Avoids:** Duplicate email pitfall — check status before retry, fix idempotency key, cap retries at 3 total.
**Research flag:** The svix verification pattern is fully documented in Resend docs. Skip research phase.

### Phase 6: Driver Simplification
**Rationale:** Independent of other phases. Highest family-driver impact — non-technical users completing routes without training. Server-side preference on `drivers.simple_mode` (not localStorage) ensures persistence across devices.
**Delivers:** `drivers.simple_mode BOOLEAN DEFAULT true` column. Preference hydrated from server to Zustand store. Simple mode renders only: customer name, address (tap to open Maps), phone (tap to call), large "Mark Delivered" with confirmation dialog. Complex sections conditionally hidden. Admin can toggle driver mode from driver management page.
**Uses:** Zustand driver store (add `isSimpleMode`). Radix AlertDialog for delivery confirmation. `tel:` / `sms:` native HTML links for one-tap contact. New `SimpleStopCard.tsx`, `SimpleRouteView.tsx`, `DeliveryConfirmDialog.tsx`.
**Avoids:** Mode preference lost on device switch — store in `drivers` table, not localStorage. Test with actual non-technical family member before marking complete; no verbal instructions allowed.
**Research flag:** Standard patterns. Skip research phase.

### Phase 7: Production Hardening
**Rationale:** Runs last because optimal indexes and N+1 fixes benefit from seeing final query patterns established by all preceding phases.
**Delivers:** DB indexes (`orders(delivery_window_start, status)`, `orders(assigned_driver_id) WHERE IS NULL`, `notification_logs(order_id, status)`, `routes(delivery_date)`). N+1 fix on ops dashboard (join addresses and route assignment in single query). Rate limiting on bulk-status endpoint (max 100 orders per call). Settings bounds validation. `settings_audit_log` for tracking who changed what. Full pre-launch checklist: separate Supabase project for production vs. staging, Resend domain verification, Upstash Redis provisioning, Stripe webhook URL update, Sentry DSN, Google Maps billing, cron job scheduling, database backup strategy.
**Avoids:** Production database shared with staging — highest-recovery-cost pitfall in the research (requires point-in-time restore + contamination audit).
**Research flag:** Standard patterns for indexing and rate limiting. The production checklist warrants a structured walkthrough but not a research phase.

### Phase Ordering Rationale

- Phase 0 before everything: three confirmed production blockers that affect downstream phases directly (cutoff logic is used by ops dashboard; TOCTOU affects checkout integrity).
- Phase 1 (settings) before Phase 2 (ops dashboard): countdown timers consume settings data; building in reverse order creates guaranteed rework.
- Phase 2 (ops dashboard) before Phase 3 (route assignment): unassigned orders count and data layer are shared; assignment UI lives within or adjacent to the ops view.
- Phase 4 (customer gate) after Phase 1 (settings): cutoff modal must display the database-driven cutoff time, not a hardcoded constant.
- Phases 5 and 6 are independent: can run concurrently after Phase 2 ships, or sequentially in any order.
- Phase 7 last: indexes are most useful after all query patterns are finalized.

### Research Flags

Phases that may benefit from a deeper research pass during planning:
- **Phase 2 (Ops Dashboard) — bulk-status RPC:** If no team member has authored a Supabase RPC transaction function for this project before, one focused spike on the `create_order_with_items` precedent in `checkout/session/route.ts` is worthwhile before writing the bulk-status RPC.

Phases with standard, well-documented patterns (skip `/gsd:research-phase`):
- **Phase 0:** Line-level bug fixes in identified files.
- **Phase 1:** Existing settings infrastructure; standard Next.js cache invalidation.
- **Phase 3:** Follows the `create_order_with_items` RPC precedent already in the codebase.
- **Phase 4:** Uses existing delivery date utilities refactored to read from settings.
- **Phase 5:** Resend SDK docs fully cover `webhooks.verify()`.
- **Phase 6:** Zustand + server-side preference — established project patterns.
- **Phase 7:** Standard DB indexing and Vercel production checklist.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new packages — all findings based on installed dependency analysis and official SDK docs. No speculation. |
| Features | HIGH | Derived from direct codebase audit of existing API routes, tables, and UI. Competitor analysis corroborates prioritization. |
| Architecture | HIGH | Based on direct codebase analysis of existing patterns, tables, and route groups. Serverless caching constraints are well-documented Vercel platform behavior. |
| Pitfalls | HIGH | Sourced from codebase audit of actual bug-prone code paths (line-level references to the manual rollback in `admin/routes/route.ts`), project ERROR_HISTORY.md, and official Resend/Svix docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **Supabase `app_settings` and `notification_logs` types:** Both tables are currently untyped (used with manual casts). Adding them to `database.ts` is a prerequisite for type-safe settings and email utilities. Flag for Phase 1 setup.
- **Timezone display for customer gate:** PITFALLS.md flags that cutoff messaging should use Myanmar time (`Asia/Yangon`), but the existing `TIMEZONE` constant uses `America/Los_Angeles`. Verify which timezone is correct for the customer base before Phase 4 implementation.
- **Admin RLS policy on `orders` for Realtime:** If Supabase Realtime is chosen over polling for the ops dashboard post-launch (at 100+ orders), an admin SELECT RLS policy must be added. Not needed for v1.9 with polling approach, but document for future.
- **Saturday dry run validation:** Research identifies a full lifecycle test as a "looks done but isn't" risk. Plan an explicit pre-launch dry run: 10 orders through place → confirm → assign route → driver start → deliver → complete route → emails received. This is a process gap, not a code gap.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis — `src/app/api/admin/orders/`, `src/app/api/admin/routes/`, `src/app/api/admin/settings/`, `src/app/api/admin/emails/`, `src/app/api/webhooks/resend/`, `src/lib/email/send.ts`, `src/lib/utils/delivery-dates.ts`, `src/types/delivery.ts`, `src/lib/validations/settings.ts`
- [Resend Webhook Verification](https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests) — `webhooks.verify()` availability in SDK v6.9+
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) — subscription patterns
- [Supabase Query Optimization](https://supabase.com/docs/guides/database/query-optimization) — join performance, partial indexes
- [Svix Verification Guide](https://docs.svix.com/receiving/verifying-payloads/how) — HMAC-SHA256 signature verification, replay attack prevention
- [Next.js Caching Guide](https://nextjs.org/docs/app/guides/caching) — `revalidateTag`, `revalidatePath` patterns
- [Vercel Production Checklist](https://vercel.com/docs/production-checklist) — DNS, environment variables, monitoring
- Project ERROR_HISTORY.md — driver avatar cache bug, NEXT_REDIRECT handling, storage migration permissions
- V4_MILESTONE_MVP.md — existing 8-phase milestone plan with acceptance criteria

### Secondary (MEDIUM confidence)
- [Food Delivery App Architecture (Enatega)](https://enatega.com/food-delivery-app-architecture/) — dispatch service patterns
- [Redesigning A Delivery Driver App](https://amillionadventures.medium.com/redesigning-a-delivery-driver-app-part-3-ui-design-1b54d68eb6a7) — driver UX simplification patterns
- [DispatchTrack Mobile App UX Refresh](https://www.dispatchtrack.com/company/news/mobile-app-ui-ux) — simplified driver interface patterns
- [Webhook Security Best Practices 2025](https://dev.to/digital_trubador/webhook-security-best-practices-for-production-2025-2026-384n) — idempotency, retry storm prevention

### Tertiary (LOW confidence)
- [Supabase Stale Data Troubleshooting](https://supabase.com/docs/guides/troubleshooting/nextjs-1314-stale-data-when-changing-rls-or-table-data-85b8oQ) — Next.js cache + Supabase race conditions; validate during Phase 1 implementation

---
*Research completed: 2026-03-01*
*Ready for roadmap: yes*
