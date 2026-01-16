# docs/change_log.md — Project Change Log

> **Format**: Keep entries reverse-chronological (newest first)
> **Convention**: `[TYPE] Description — @author (if applicable)`

---

## [Unreleased]

### Added
- None yet

### Changed
- [REFACTOR] Complete database migration reorganization — @Claude
  - Consolidated 11 migrations into 6 with 3-digit numbering (000-005)
  - New structure:
    - `000_initial_schema.sql` — Tables, enums, indexes
    - `001_functions_triggers.sql` — Helper functions, triggers
    - `002_rls_policies.sql` — All RLS policies (optimized)
    - `003_analytics.sql` — Materialized views
    - `004_storage.sql` — Storage buckets/policies
    - `005_testing.sql` — pgTAP and linting utilities
  - **BREAKING**: Existing databases require fresh migration

### Fixed
- [CI] Fixed Stripe build error — @Claude
  - `src/lib/stripe/server.ts`: Changed to lazy initialization via Proxy
  - Env var check now happens at runtime, not build time
  - CI build no longer requires `STRIPE_SECRET_KEY` during build phase

- [PERF] Fixed Supabase linter issue 0001: Unindexed foreign keys — @Claude
  - Added indexes for:
    - `orders.address_id`
    - `order_items.menu_item_id`
    - `order_item_modifiers.modifier_option_id`
    - `delivery_exceptions.resolved_by`
    - `driver_ratings.route_stop_id`
    - `item_modifier_groups.group_id`

- [PERF] Fixed Supabase linter issue 0003: Auth RLS initplan — @Claude
  - Changed all `auth.uid()` → `(select auth.uid())` in RLS policies
  - Prevents function re-evaluation per row (significant performance boost)

- [SECURITY] Fixed Supabase linter issue 0006: Multiple permissive policies — @Claude
  - Consolidated overlapping SELECT policies using OR conditions
  - Prevents unexpected policy interactions
  - Example: `user_id = (select auth.uid()) OR public.is_admin()`

- [MIGRATION] Migrated `middleware.ts` to `proxy.ts` for Next.js 16 compatibility — @Claude
  - Renamed `src/middleware.ts` → `src/proxy.ts`
  - Changed export function `middleware` → `proxy`
  - Resolves deprecation warning: "The middleware file convention is deprecated. Please use proxy instead."
  - No config changes needed (no middleware-related options in next.config.ts)

### Fixed
- [BUILD] Fixed Next.js 16.1.2 deprecation warning for middleware file convention

- [SECURITY] Fixed profiles RLS policy infinite recursion (42P17) — @Claude
  - Created `public.is_admin()` and `public.is_driver()` SECURITY DEFINER functions
  - Replaced all admin policy subqueries with secure function calls
  - Migration: `20260122000001_security_fixes.sql`

- [SECURITY] Fixed function search_path mutable vulnerability — @Claude
  - Added `SET search_path = public` to all SECURITY DEFINER functions:
    - `update_updated_at_column()`, `test_rls_isolation()`
    - `get_driver_latest_location()`, `calculate_route_stats()`
    - `refresh_analytics_views()`, `get_driver_performance()`
    - `update_driver_rating_avg()`, `update_driver_deliveries_count()`

- [SECURITY] Fixed materialized views accessible via public API — @Claude
  - Revoked SELECT on `driver_stats_mv` and `delivery_metrics_mv` from authenticated
  - Created admin-only wrapper functions: `get_driver_stats_admin()`, `get_delivery_metrics_admin()`
  - Created `refresh_analytics_views_admin()` with admin check

### Added (Infrastructure)
- [INFRA] Added Supabase database linting with plpgsql_check — @Claude
  - Extension enabled in `20260122000002_enable_testing_extensions.sql`
  - Helper functions: `testing.lint_all_functions()`, `testing.lint_function()`
  - `testing.check_function_search_paths()` for security audits

- [INFRA] Added pgTAP database unit testing framework — @Claude
  - Test files in `supabase/tests/`:
    - `00_rls_policies.test.sql` - RLS enablement tests (20 tests)
    - `01_function_security.test.sql` - Function security tests (15 tests)
    - `02_materialized_views.test.sql` - Access control tests (8 tests)
  - Helper: `testing.check_rls_enabled()` for RLS audit

- [CI] Added database testing job to CI pipeline — @Claude
  - New `db-test` job in `.github/workflows/ci.yml`
  - Runs `supabase db lint` for plpgsql_check
  - Runs `supabase test db` for pgTAP tests
  - Build now depends on database tests passing

### Removed
- None yet

---

## [V1] — 2026-01-15 (Complete)

### Added — Sprint 1: Menu Browse
- [FEATURE] Menu data layer (V1-S1-001) — Types, API routes, React Query hooks
- [FEATURE] Category tabs (V1-S1-002) — Sticky, horizontal scroll, scroll-spy
- [FEATURE] Item card (V1-S1-003) — Responsive card with image + price
- [FEATURE] Menu grid (V1-S1-004) — Responsive grid layout
- [FEATURE] Menu search (V1-S1-005) — Debounced, fuzzy match
- [FEATURE] Item detail modal (V1-S1-006) — Modifiers, qty, notes

### Added — Sprint 2: Cart + Checkout
- [FEATURE] Cart state (V1-S2-001) — Zustand store: add/update/remove/clear
- [FEATURE] Cart drawer (V1-S2-002) — Slide-over, mobile-first
- [FEATURE] Cart summary (V1-S2-003) — Subtotal + fee display
- [FEATURE] Address management (V1-S2-004) — CRUD + geocoding + validation
- [FEATURE] Coverage checker (V1-S2-005) — Google Maps Routes API + UI status
- [FEATURE] Time slot picker (V1-S2-006) — Saturday hourly windows + cutoff logic
- [FEATURE] Checkout stepper (V1-S2-007) — Address → Time → Pay stepper UI

### Added — Sprint 3: Payment + Confirmation
- [FEATURE] Stripe integration (V1-S3-001) — Checkout Sessions API + order creation
- [FEATURE] Webhook handler (V1-S3-002) — Signature verification + status updates
- [FEATURE] Order creation flow (V1-S3-003) — Server-side totals + DB insertion
- [FEATURE] Confirmation page (V1-S3-004) — Order details + cart clear
- [FEATURE] Order status page (V1-S3-005) — Timeline component + order details
- [FEATURE] Order history page (V1-S3-006) — Customer's orders list with cards
- [FEATURE] Email notifications (V1-S3-007) — Supabase Edge Function + Resend

### Added — Sprint 4: Admin Basics
- [FEATURE] Admin layout + nav (V1-S4-001) — Role-gated shell + collapsible nav
- [FEATURE] Menu item CRUD (V1-S4-002) — List, toggle active/sold-out, delete
- [FEATURE] Category management (V1-S4-003) — Reorder, activate, add/delete
- [FEATURE] Orders list view (V1-S4-004) — Filter, sort, status update
- [FEATURE] Basic analytics (V1-S4-005) — Stats cards, revenue chart, popular items

### Added — Test Coverage (V1 Completion)
- [TEST] Test mock utilities — `src/test/mocks/` (google-routes, stripe, supabase)
- [TEST] Test factories — `src/test/factories/index.ts` (menu items, modifiers, addresses, orders)
- [TEST] Order calculation tests — `src/lib/utils/__tests__/order.test.ts` (35 tests)
- [TEST] Coverage validation tests — `src/lib/services/__tests__/coverage.test.ts` (17 tests)
- [TEST] Checkout session tests — `src/app/api/checkout/session/__tests__/route.test.ts` (27 tests)
- [TEST] Webhook handler tests — `src/app/api/webhooks/stripe/__tests__/route.test.ts` (23 tests)
- [TEST] E2E happy path tests — `e2e/happy-path.spec.ts` (Playwright)
- [TEST] E2E error state tests — `e2e/error-states.spec.ts` (Playwright)
- [CONFIG] Playwright setup — `playwright.config.ts` + package.json scripts

### Technical Decisions
- [DECISION] Vitest for unit/integration tests — Fast, ESM-first, excellent mocking
- [DECISION] Playwright for E2E tests — Cross-browser, mobile testing, reliable
- [DECISION] Focus on business logic testing — Validate order calculations, coverage, webhooks
- [DECISION] Separate E2E from unit tests — vitest.config.ts excludes e2e/ directory

### V1 Acceptance Criteria (All Met)
- ✅ Customer can browse full menu by category
- ✅ Customer can search menu items
- ✅ Customer can view item details + modifiers
- ✅ Customer can add items to cart with modifiers
- ✅ Customer can manage cart (update qty, remove)
- ✅ Customer can save/select delivery address
- ✅ Coverage validation blocks out-of-range addresses
- ✅ Customer can select Saturday time window
- ✅ Cutoff logic prevents late orders for current Saturday
- ✅ Stripe Checkout completes payment
- ✅ Webhook updates order to paid/confirmed
- ✅ Order confirmation displays correctly
- ✅ Customer can view order history
- ✅ Admin can CRUD menu items
- ✅ Admin can manage categories (reorder, activate)
- ✅ Admin can view/manage orders
- ✅ Admin has analytics dashboard
- ✅ Mobile-responsive across all flows
- ✅ E2E test covers happy path

---

## [V1-S1] — 2026-01-14

### Added
- [FEATURE] Menu data layer (V1-S1-001) — @Codex
  - `src/types/menu.ts`: Menu type definitions (MenuItem, MenuCategory, ModifierGroup, etc.)
  - `src/app/api/menu/route.ts`: Full menu API with categories and modifiers
  - `src/app/api/menu/search/route.ts`: Search API with Zod validation
  - `src/lib/hooks/useMenu.ts`: React Query hooks (useMenu, useMenuSearch)
  - `src/lib/providers/query-provider.tsx`: QueryClient configuration
  - 5-minute stale time caching for menu data

- [FEATURE] Category tabs component (V1-S1-002) — @Codex
  - `src/components/menu/category-tabs.tsx`: Enhanced tab navigation
  - `src/lib/hooks/useScrollSpy.ts`: Scroll-spy hook for active section detection
  - `src/components/menu/menu-content.tsx`: Integration component
  - "All" pseudo-tab for showing all items
  - Sticky positioning with backdrop blur
  - Framer Motion shared layout animation
  - Touch targets ≥ 44px, keyboard accessible
  - Respects `prefers-reduced-motion`

### Technical Decisions
- [DECISION] React Query for server state — Caching with 5-min stale time, automatic refetch
- [DECISION] Intersection Observer pattern for scroll-spy — Better performance than scroll events

---

## [V0] — 2026-01-13

### Added
- Initial project scaffold (Next.js 15 + TypeScript)
- Tailwind CSS + shadcn/ui configuration
- Supabase project connection
- Core database schema (all tables from docs/04-data-model.md)
- RLS policies baseline
- Supabase Auth integration (email + profiles trigger)
- Menu seed YAML (data/menu.seed.yaml)
- Menu seed validation rules (docs/menu-seed-validation.md)
- Core documentation:
  - docs/00-context-pack.md — Business rules
  - docs/04-data-model.md — Database schema
  - docs/05-menu.md — Menu system
  - docs/06-stripe.md — Payment integration
  - Codex.md — Implementation workflow
  - Claude.md — Planning operating system

### Technical Decisions
- [DECISION] Stripe Checkout Sessions over custom payment forms — Lower PCI scope
- [DECISION] Zustand for client cart state — Lightweight, simple API
- [DECISION] React Query for server state — Caching, optimistic updates
- [DECISION] Saturday-only delivery — Simplify scheduling in V1
- [DECISION] Single kitchen origin — No multi-location complexity in V1

---

## Template for Future Entries

```markdown
## [Version] — YYYY-MM-DD

### Added
- [FEATURE] Description — @owner
- [DOC] Added new documentation for X

### Changed
- [REFACTOR] Improved X for better Y
- [PERF] Optimized Z

### Fixed
- [BUG] Fixed issue where X caused Y
- [SECURITY] Patched vulnerability in Z

### Removed
- [DEPRECATION] Removed legacy X

### Technical Decisions
- [DECISION] Chose X over Y — Rationale

### Known Issues
- [ISSUE] Description — Workaround if any
```

---

## Version Naming Convention

- **V0**: Foundation (scaffold, auth, schema)
- **V1**: Core ordering flow (menu, cart, checkout, orders)
- **V2**: Delivery operations (drivers, routes, tracking)
- **V3+**: Scale and polish (analytics, loyalty, optimization)

Minor versions (V1.1, V1.2) for bug fixes and small features within a major version.
