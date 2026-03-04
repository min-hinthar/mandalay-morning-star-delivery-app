# Roadmap: Morning Star Delivery App

## Milestones

- ✅ **v1.0 MVP** — Phases 1-8 (shipped 2026-01-23)
- ✅ **v1.1 Tech Debt** — Phases 9-14 (shipped 2026-01-23)
- ✅ **v1.2 Playful UI Overhaul** — Phases 15-24 (shipped 2026-01-27)
- ✅ **v1.3 Full Codebase Consolidation** — Phases 25-34 (shipped 2026-01-28)
- ✅ **v1.4 Mobile Excellence** — Phases 35-39 (shipped 2026-02-05)
- ✅ **v1.5 Performance & Repo Health** — Phases 40-47 (shipped 2026-02-07)
- ✅ **v1.6 Production Polish** — Phases 48-57 (shipped 2026-02-13)
- ✅ **v1.7 Production Deployment & Readiness** — Phases 58-66 (shipped 2026-02-16)
- ✅ **v1.8 Post-Launch Hardening & Driver Experience** — Phases 67-76 (shipped 2026-02-26)
- ✅ **v1.9 Launch-Ready MVP** — Phases 77-88 (shipped 2026-03-03)
- **v2.0 Production-Grade Launch MVP** — Phases 89-97 (in progress)

## Phases

<details>
<summary>✅ v1.7 Production Deployment & Readiness (Phases 58-66) — SHIPPED 2026-02-16</summary>

- [x] Phase 58: Deployment Verification (2/2 plans) — completed 2026-02-14
- [x] Phase 59: Monitoring & Error Tracking (2/2 plans) — completed 2026-02-14
- [x] Phase 60: LCP Optimization (3/3 plans) — completed 2026-02-14
- [x] Phase 61: Admin Pages (5/5 plans) — completed 2026-02-14
- [x] Phase 62: Production Operations (4/4 plans) — completed 2026-02-14
- [x] Phase 63: Branding & Compliance (3/3 plans) — completed 2026-02-15
- [x] Phase 64: Service Worker Hardening (5/5 plans) — completed 2026-02-15
- [x] Phase 65: CI/CD Hardening (1/1 plan) — completed 2026-02-15
- [x] Phase 66: Backlog Cleanup (7/7 plans) — completed 2026-02-15

</details>

<details>
<summary>✅ v1.8 Post-Launch Hardening & Driver Experience (Phases 67-76) — SHIPPED 2026-02-26</summary>

- [x] Phase 67: CSP & Security Headers (3/3 plans) — completed 2026-02-17
- [x] Phase 68: RLS Audit & Hardening (3/3 plans) — completed 2026-02-17
- [x] Phase 69: Distributed Rate Limiting (3/3 plans) — completed 2026-02-18
- [x] Phase 70: Role-Based Auth Redirects (3/3 plans) — completed 2026-02-19
- [x] Phase 71: Driver Profile Setup (2/2 plans) — completed 2026-02-19
- [x] Phase 72: Driver Earnings Dashboard (3/3 plans) — completed 2026-02-19
- [x] Phase 73: Driver Availability & Route Visibility (3/3 plans) — completed 2026-02-19
- [x] Phase 74: Guided Walkthrough & Driver UI Polish (3/3 plans) — completed 2026-02-19
- [x] Phase 75: Fix Security & Navigation Wiring (1/1 plan) — completed 2026-02-26
- [x] Phase 76: Surface Hidden Components & Dead Code Cleanup (1/1 plan) — completed 2026-02-26

</details>

<details>
<summary>✅ v1.9 Launch-Ready MVP (Phases 77-88) — SHIPPED 2026-03-03</summary>

- [x] Phase 77: Critical Bug Fixes (5/5 plans) — completed 2026-03-01
- [x] Phase 78: Configurable Business Rules (4/4 plans) — completed 2026-03-01
- [x] Phase 79: Saturday Ops Dashboard (3/3 plans) — completed 2026-03-01
- [x] Phase 80: Route & Driver Assignment (4/4 plans) — completed 2026-03-02
- [x] Phase 81: Customer Pre-Checkout Gate (3/3 plans) — completed 2026-03-02
- [x] Phase 82: Email Reliability (4/4 plans) — completed 2026-03-02
- [x] Phase 83: Driver Simplification (4/4 plans) — completed 2026-03-02
- [x] Phase 84: Production Hardening (4/4 plans) — completed 2026-03-02
- [x] Phase 85: Phase 77 Verification & Bug Traceability (2/2 plans) — completed 2026-03-02
- [x] Phase 86: Deferred Integration & Tech Debt Cleanup (2/2 plans) — completed 2026-03-02
- [x] Phase 87: Fix Code Gaps (1/1 plan) — completed 2026-03-03
- [x] Phase 88: Phase 83 & 84 Verification (2/2 plans) — completed 2026-03-03

</details>

### v2.0 Production-Grade Launch MVP (Phases 89-97)

**Milestone Goal:** Battle-tested, revenue-ready Saturday delivery platform for real-money operations at 50-150 orders/Sat with 3-6 drivers and solo admin operator.

- [x] **Phase 89: Critical Bug Fixes** - Fix payment idempotency, modifier validation, cleanup rollback, type crash, refund ceiling, cart race condition, cutoff safety buffer
- [x] **Phase 90: Menu & Photo Pipeline** - Admin photo upload, bulk upload, auto-processing, freshness tracking, allergen dedup, inactive items, photo management grid, seed fallback photos
- [x] **Phase 91: Checkout & Payment Hardening** - Server-side pricing, price conflict auto-refresh, modifier bounds, prep time buffer, duplicate order prevention, promos, tips, delivery instructions, guest cart, checkout logging (completed 2026-03-03)
- [x] **Phase 92: Customer UX - Discovery & Shopping** - Persistent search, dietary filters, sold-out sorting, modifier scroll indicator, Saturday hero, min order warning, sticky checkout footer, auto-select delivery date, cart sync status, offline banner, dynamic gate polling (completed 2026-03-03)
- [x] **Phase 93: Customer UX - Engagement & Accessibility** - One-tap reorder, rating prompt, order sharing, focus rings, keyboard cart delete, drawer aria-labels, form error linking, icon+color status, 3D tilt keyboard fix (completed 2026-03-03)
- [x] **Phase 94: Admin & Driver Enhancements** - Ops time-window grouping, driver one-tap contact, turn-by-turn nav, photo proof on delivery (completed 2026-03-03)
- [ ] **Phase 95: Observability, Performance & Testing** - Standardized errors, webhook logging, health alerting, DB backups, image preload, bundle audit, timezone from env, race condition tests, webhook tests, RLS edge cases, DST cutoff tests, refund rounding tests, Saturday dry run, load test, pre-launch checklist
- [ ] **Phase 96: Integration Wiring & Dead Code Resolution** - Order detail page tip/promo/delivery_instructions display, reorder slug fix, price drift dead code removal (gap closure from audit)
- [ ] **Phase 97: Phase 89/90 Verification & Traceability Cleanup** - Verify Phase 89 & 90 against requirements, update REQUIREMENTS.md checkboxes, fix ROADMAP inconsistencies (gap closure from audit)

## Phase Details

### Phase 89: Critical Bug Fixes
**Goal**: All known payment, checkout, and cart bugs are eliminated before building new features on top
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, BUG-07
**Success Criteria** (what must be TRUE):
  1. Payment retries reuse a deterministic idempotency key derived from order ID, not timestamp
  2. Checkout rejects modifier selections that violate min_select/max_select group constraints
  3. Failed checkout cleanup rolls back each resource independently with try/catch (no silent partial state)
  4. RPC checkout result handles null/error without type assertion crash
  5. Refund endpoint rejects any amount exceeding order total_cents
  6. Concurrent cart addItem() calls cannot bypass debounce check (race condition eliminated)
  7. Orders submitted within 10 seconds of cutoff are rejected (safety buffer prevents DB-latency edge case)
**Plans**: 4/4 complete
  - Plan 01 (Wave 1): BUG-01, BUG-03, BUG-04 - Payment retry + RPC null-safe + cleanup rollback
  - Plan 02 (Wave 2): BUG-02 - Modifier group constraint validation
  - Plan 03 (Wave 1): BUG-05, BUG-06 - Refund ceiling + cart debounce race condition
  - Plan 04 (Wave 1): BUG-07 - 10-second cutoff safety buffer
  - Completed: 2026-03-03

### Phase 90: Menu & Photo Pipeline
**Goal**: Admin can manage all menu item photos from the dashboard, photos are production-quality, and all items have at least a fallback photo
**Depends on**: Phase 89
**Requirements**: MENU-01, MENU-02, MENU-03, MENU-04, MENU-05, MENU-06, MENU-07, ADMIN-02
**Success Criteria** (what must be TRUE):
  1. Admin can upload a photo for any menu item and see it reflected on the customer menu
  2. Admin can drag-drop multiple photos and have them auto-matched to items by slug
  3. Uploaded photos are auto-converted to WebP/AVIF at 4:3 crop with size/dimension validation
  4. Admin can mark menu items as inactive so they disappear from the customer-facing menu
  5. Each menu item has a single authoritative allergen source (no tag/allergen overlap)
  6. All 53 items have at least a fallback photo seeded from `data/menu-photos/` into Supabase Storage
**Plans**: 4/4 complete
  - Plan 01 (Wave 1): MENU-03, MENU-04 - Server-side sharp WebP processing + image_updated_at tracking
  - Plan 02 (Wave 1): MENU-05, MENU-06 - Allergen dedup + inactive item filtering verification
  - Plan 03 (Wave 1): MENU-07 - Photo seed script with slug-based matching
  - Plan 04 (Wave 2): MENU-01, MENU-02, ADMIN-02 - BulkUploadMatcher + admin photo management
  - Completed: 2026-03-03

### Phase 91: Checkout & Payment Hardening
**Goal**: Checkout is airtight -- server-authoritative pricing, graceful conflict resolution, and revenue features (tips, promos) ready for launch
**Depends on**: Phase 89
**Requirements**: CHKT-01, CHKT-02, CHKT-03, CHKT-04, CHKT-05, CHKT-06, CHKT-07, CHKT-08, CHKT-09, CHKT-10
**Success Criteria** (what must be TRUE):
  1. Client sends only item IDs and modifier selections -- server resolves all prices (no client-sent amounts)
  2. When a menu price changes between cart-add and checkout, cart auto-refreshes with new prices instead of showing an error
  3. User can add a tip (15%/20%/25%/custom) and apply a promo code, both reflected in the Stripe charge
  4. User can browse menu and build cart without signing in, prompted to authenticate only at payment
  5. Each user can place at most one order per Saturday delivery window; duplicate attempts are blocked with a clear message
**Plans**: 4 plans
  - [ ] 91-01-PLAN.md — DB migrations, types, Zod schema, order utilities (Wave 1)
  - [ ] 91-02-PLAN.md — Checkout API hardening: server pricing, tips, promos, duplicate check, logging (Wave 2)
  - [ ] 91-03-PLAN.md — Checkout UI: tip selector, promo input, delivery instructions, summary updates (Wave 2)
  - [ ] 91-04-PLAN.md — Cart price refresh, guest flow wiring, duplicate order early warning (Wave 3)

### Phase 92: Customer UX - Discovery & Shopping
**Goal**: Customers can efficiently find, filter, and purchase items with a polished mobile shopping experience
**Depends on**: Phase 90 (needs photo pipeline for menu display), Phase 91 (checkout features used in cart/checkout UI)
**Requirements**: CUX-01, CUX-02, CUX-03, CUX-04, CUX-05, CUX-06, CUX-07, CUX-08, CUX-09, CUX-10, CUX-20
**Audit notes**: CUX-05 and CUX-10 may overlap with v1.9/v1.6 implementations — audit existing code before building, enhance rather than rebuild.
**Success Criteria** (what must be TRUE):
  1. Search bar is always visible on mobile (not collapsed behind an icon) and dietary filter chips appear above the menu grid
  2. Sold-out items are sorted to the bottom of all menu views and search results
  3. Saturday schedule hero banner displays the next delivery date, and the first available delivery date is auto-selected in checkout
  4. Cart shows minimum order warning inline, sync status indicator ("Saved"/"Saving..."), and a prominent offline banner when browsing cached menu
  5. Sticky checkout footer on mobile keeps total and checkout button always visible during scrolling
  6. Delivery gate polls at 10s (not 60s) during the final 30 minutes before cutoff
**Plans**: 4 plans
Plans:
- [ ] 92-01-PLAN.md — Search + dietary filters + sold-out sorting on menu page (Wave 1)
- [ ] 92-02-PLAN.md — Hero banner enhancement + delivery date auto-select + dynamic gate polling (Wave 1)
- [ ] 92-03-PLAN.md — Cart min-order warning + sync status + offline banner (Wave 1)
- [ ] 92-04-PLAN.md — Modifier scroll overflow indicator (Wave 1)

### Phase 93: Customer UX - Engagement & Accessibility
**Goal**: Post-purchase engagement features work and all interactive elements meet accessibility standards
**Depends on**: Phase 92 (builds on customer UX foundation)
**Requirements**: CUX-11, CUX-12, CUX-13, CUX-14, CUX-15, CUX-16, CUX-17, CUX-18, CUX-19
**Backend needed**: CUX-12 requires `ratings` table migration, POST /api/ratings route, admin ratings view.
**Success Criteria** (what must be TRUE):
  1. User can one-tap reorder from order history, repopulating cart with previous items
  2. Rating prompt appears after delivery confirmation, user can submit rating, ratings stored in DB and visible to admin
  3. All interactive cards have visible focus rings, drawer handles have descriptive aria-labels, and form errors are linked to fields via aria-describedby
  4. Cart items can be deleted via keyboard with confirmation, and 3D tilt effect is disabled during keyboard navigation
  5. Status indicators use icons alongside color (not color-only) for colorblind accessibility
**Plans**: 3 plans
Plans:
- [ ] 93-01-PLAN.md — DB migration (rating_dismissed + share_token), share token API, public share page, admin ratings page (Wave 1)
- [ ] 93-02-PLAN.md — Accessibility: StatusBadge icons, focus rings, keyboard cart delete, drawer aria-labels, form error audit, tilt keyboard fix (Wave 1)
- [ ] 93-03-PLAN.md — Engagement UI: reorder button + rating banner + share button on OrderCard and order detail page (Wave 2)

### Phase 94: Admin & Driver Enhancements
**Goal**: Admin has time-window order grouping and drivers can contact customers, navigate, and capture photo proof
**Depends on**: Phase 89 (bug fixes), Phase 90 (photo storage infrastructure reused for DRV-03 delivery photos)
**Requirements**: ADMIN-01, DRV-01, DRV-02, DRV-03
**Success Criteria** (what must be TRUE):
  1. Ops dashboard groups orders by delivery time window for batch processing
  2. Driver can tap to call or text a customer directly from the stop view
  3. Driver can open turn-by-turn navigation to any stop address in their preferred maps app
  4. Driver must capture a photo before marking a delivery as complete (enforced, not optional)
**Plans**: 2 plans
  - [ ] 94-01-PLAN.md — ADMIN-01: Collapsible time-window groups with per-window select-all (Wave 1)
  - [ ] 94-02-PLAN.md — DRV-01, DRV-02, DRV-03: SMS contact, address-only nav fallback, photo proof enforcement (Wave 1)

### Phase 95: Observability, Performance, Testing & Launch Prep
**Goal**: Production infrastructure is monitored, performant, validated by comprehensive tests, and all pre-launch infrastructure is provisioned
**Depends on**: All prior phases (tests validate the complete system)
**Requirements**: OBS-01, OBS-02, OBS-03, OBS-04, OBS-05, OBS-06, OBS-07, TST-01, TST-02, TST-03, TST-04, TST-05, TST-06, TST-07, LAUNCH-01 to LAUNCH-11
**Success Criteria** (what must be TRUE):
  1. All API routes return errors in standardized format `{error: {code, message, details?}}` and webhook events are logged with body hash + signature
  2. Health check has external alerting (email/SMS on downtime) and database is backed up daily with automated verification
  3. First 4 menu images are preloaded (not lazy) above the fold and first-load JS bundle is under 200KB
  4. Timezone is read from env var (not hardcoded) and all cutoff boundary tests pass including DST transitions
  5. Full Saturday dry run completes successfully (20 test orders through entire lifecycle) and load test handles 50 concurrent checkout submissions
  6. All pre-launch infrastructure provisioned: production Supabase, Stripe live keys, Resend domain, Redis, DNS/SSL verified
  7. Admin trained on ops dashboard and driver(s) completed test deliveries
**Plans**: 8 plans
Plans:
- [ ] 95-01-PLAN.md — Timezone env var, image preload verify, webhook logging audit (Wave 1)
- [ ] 95-02-PLAN.md — API error standardization: apiError utility + admin/orders routes (Wave 1)
- [ ] 95-03-PLAN.md — API error standardization: admin/sections + webhooks + remaining routes (Wave 1)
- [ ] 95-04-PLAN.md — Frontend error consumers update for new error format (Wave 2)
- [ ] 95-05-PLAN.md — Cart race condition, DST cutoff boundary, refund rounding tests (Wave 1)
- [ ] 95-06-PLAN.md — Stripe webhook failure tests, RLS multi-user edge case tests (Wave 1)
- [ ] 95-07-PLAN.md — Saturday dry run script, k6 load test script (Wave 1)
- [ ] 95-08-PLAN.md — Launch checklist, validation script, bundle audit (Wave 2)

### Phase 96: Integration Wiring & Dead Code Resolution
**Goal:** All checkout data (tip, promo, delivery instructions) visible on order detail page, reorder uses correct slug, and price drift dead code is cleaned up
**Depends on**: Phase 91, Phase 93
**Requirements**: CHKT-02, CHKT-06, CHKT-07, CHKT-08, CUX-11
**Gap Closure:** Closes 3 integration gaps and 3 broken flows from v2.0 audit
**Success Criteria** (what must be TRUE):
  1. Order detail page displays tip_cents, discount_cents, promo_code, and delivery_instructions
  2. useReorder.ts passes actual menu item slug (not UUID) for slug-based lookups
  3. Dead updatePricesFromServer code removed from cart-store.ts and 409 handler removed from PaymentStepV8.tsx
  4. CHKT-02 requirement downscoped — server-authoritative pricing (CHKT-01) handles price correctness; client-side auto-refresh deferred

### Phase 97: Phase 89/90 Verification & Traceability Cleanup
**Goal:** Phase 89 and 90 formally verified against requirements, REQUIREMENTS.md and ROADMAP.md accurately reflect completion status
**Depends on**: Phase 89, Phase 90
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, BUG-07, MENU-01, MENU-02, MENU-03, MENU-04, MENU-05, MENU-06, MENU-07, ADMIN-02
**Gap Closure:** Closes 15 partial requirements (missing verification) from v2.0 audit
**Success Criteria** (what must be TRUE):
  1. VERIFICATION.md exists for Phase 89 with per-requirement evidence
  2. VERIFICATION.md exists for Phase 90 with per-requirement evidence
  3. REQUIREMENTS.md checkboxes updated for all 15 requirements (BUG-01..07, MENU-01..07, ADMIN-02)
  4. ROADMAP.md accurately reflects all phase completion statuses

## Progress

| Milestone              | Phases | Plans | Shipped    |
| ---------------------- | ------ | ----- | ---------- |
| v1.0 MVP               | 1-8    | 32    | 2026-01-23 |
| v1.1 Tech Debt         | 9-14   | 21    | 2026-01-23 |
| v1.2 Playful UI        | 15-24  | 29    | 2026-01-27 |
| v1.3 Consolidation     | 25-34  | 53    | 2026-01-28 |
| v1.4 Mobile            | 35-39  | 39    | 2026-02-05 |
| v1.5 Performance       | 40-47  | 34    | 2026-02-07 |
| v1.6 Polish            | 48-57  | 47    | 2026-02-13 |
| v1.7 Deployment        | 58-66  | 32    | 2026-02-16 |
| v1.8 Hardening         | 67-76  | 25    | 2026-02-26 |
| v1.9 Launch-Ready MVP  | 77-88  | 38    | 2026-03-03 |
| **Total shipped**      | **88** | **350** |            |

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 89. Critical Bug Fixes | v2.0 | 4/4 | Complete | 2026-03-03 |
| 90. Menu & Photo Pipeline | v2.0 | 4/4 | Complete | 2026-03-03 |
| 91. Checkout & Payment Hardening | 4/4 | Complete    | 2026-03-03 | - |
| 92. Customer UX - Discovery & Shopping | 4/4 | Complete    | 2026-03-03 | - |
| 93. Customer UX - Engagement & Accessibility | 3/3 | Complete    | 2026-03-03 | - |
| 94. Admin & Driver Enhancements | 2/2 | Complete    | 2026-03-03 | - |
| 95. Observability, Performance & Testing | 4/8 | In Progress|  | - |
| 96. Integration Wiring & Dead Code Resolution | v2.0 | 0/TBD | Not started | - |
| 97. Phase 89/90 Verification & Traceability | v2.0 | 0/TBD | Not started | - |

---

_v1.6 details archived to: .planning/milestones/v1.6-ROADMAP.md_
_v1.7 details archived to: .planning/milestones/v1.7-ROADMAP.md_
_v1.8 details archived to: .planning/milestones/v1.8-ROADMAP.md_
_v1.9 details archived to: .planning/milestones/v1.9-ROADMAP.md_
