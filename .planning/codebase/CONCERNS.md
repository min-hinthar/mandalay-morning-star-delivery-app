# Codebase Concerns

**Analysis Date:** 2026-01-21

## Tech Debt

**Version Consolidation Overhead:**
- Issue: V4/V5/V6/V7 token versioning creates maintenance burden across 1000+ lines of tokens.css
- Files: `src/styles/tokens.css`, `tailwind.config.ts`, 38+ component files with V7 suffix
- Impact: Token migration required repeatedly; inconsistent naming increases bugs; migration-validator hook needed
- Fix approach: Continue consolidation to single version namespace. Deprecate versioned variants in new sprints.

**Component Duplication (cards, items):**
- Issue: ItemCard and MenuItemCard with different aspect ratios (4:3 vs 16:9) create duplicate logic
- Files: `src/components/menu/ItemCard.tsx`, `src/components/menu/MenuItemCard.tsx`
- Impact: Bug fixes must be applied to both; diverging behaviors cause user confusion
- Fix approach: Merge into single ItemCard with `variant` prop; apply in next component audit sprint

**Large Component Files (>600 lines):**
- Files exceeding single-responsibility:
  - `src/components/ui/FormValidation.tsx` (1031 lines) - Form state + validation + rendering
  - `src/components/cart/CartAnimations.tsx` (919 lines) - Cart logic + animation variants + state
  - `src/components/ui/TabSwitcher.tsx` (790 lines) - Tab navigation + swipe + animations
  - `src/components/ui/Modal.tsx` (733 lines) - Modal + overlay + animations
  - `src/components/admin/RouteOptimization.tsx` (732 lines) - Route logic + UI + maps
- Impact: Hard to test; cognitive overload during reviews; refactoring risky
- Fix approach: Split into domain-focused modules (e.g., CartState + CartUI + CartAnimations)

**Missing A/B Testing Infrastructure (half-implemented):**
- Issue: A/B test system in `src/lib/ab-testing.ts` hardcoded to sessionStorage/localStorage; no experiment tracking backend
- Files: `src/lib/ab-testing.ts`, debug console.log statements left in
- Impact: Experiments forced manually for debugging; no analytics pipeline; can't run production tests
- Fix approach: Connect to analytics service (Segment/Mixpanel) for experiment tracking; remove debug logs

---

## Known Bugs

**Tracking Route ID Missing:**
- Symptoms: Real-time driver location updates don't filter by route; all route updates are received
- Files: `src/components/tracking/TrackingPageClient.tsx` (line 50 TODO comment)
- Trigger: Open any order tracking page; location updates come from wrong routes
- Workaround: Still works but inefficient; extra server round trips
- Fix: Extract `route_id` from initial `routeStop` data; pass to `useTrackingSubscription`

**Mobile Menu State Persistence Across Routes:**
- Symptoms: Mobile menu remains open when navigating between pages; backdrop blocks clicks
- Files: `src/components/layout/HeaderClient.tsx` (header state), `src/app/(public)/page.tsx` (homepage context)
- Trigger: Open mobile menu, navigate to `/menu`, try to click items
- Workaround: Close menu manually or refresh page
- Fix: Add `useEffect` to reset `isMobileMenuOpen` when `pathname` changes

**PriceTicker Cent-to-Dollar Display Bug:**
- Symptoms: Cart and checkout display prices as $1299 instead of $12.99
- Files: `src/components/cart/CartDrawer.tsx` (line 233), `src/components/cart/CartItem.tsx` (line 375)
- Trigger: Add items to cart; view cart drawer
- Workaround: None visible to user; prices appear wrong
- Fix: Add `inCents={true}` prop to PriceTicker components using cent-denominated values

**DropdownAction preventDefault() Blocks Redirects:**
- Symptoms: Signout button in user dropdown shows loading but doesn't redirect
- Files: `src/components/ui/DropdownAction.tsx` (onSelect handler)
- Trigger: Click signout in header dropdown menu
- Workaround: Log out via API directly or refresh page
- Fix: Remove `event.preventDefault()` from onSelect handler; let menu close naturally and redirect

**Form Autocomplete Glass Background (PlacesAutocomplete):**
- Symptoms: Autocomplete dropdown has transparent glass background; text hard to read on light backgrounds
- Files: `src/components/checkout/AddressInput.tsx` (dropdown className)
- Trigger: Type in address field on checkout page
- Workaround: Can still see results if contrast is sufficient
- Fix: Replace `glass` class with solid background: `bg-[var(--color-surface-primary)] border border-border`

**Favorites State Not Persisting:**
- Symptoms: Heart icon clicked on menu items; favorites lost on page refresh
- Files: `src/components/homepage/HomepageMenuSection.tsx` (local useState), `src/components/menu/menu-content.tsx` (no favorite wiring)
- Trigger: Add favorite, refresh page
- Workaround: None
- Fix: Create `useFavoritesStore` with Zustand + localStorage persistence; wire to both components

---

## Security Considerations

**Supabase RLS Bypasses in Webhooks:**
- Risk: Stripe webhook updates orders using `createClient()` (anon key) would fail; mitigated by using `createServiceClient()`
- Files: `src/app/api/webhooks/stripe/route.ts`, `src/lib/supabase/server.ts`
- Current mitigation: Service role client used for webhook handler (correct)
- Recommendations: Audit all webhook handlers for service client usage; ensure no anon key usage in webhooks

**Window Location Redirects Without Validation:**
- Risk: Direct `window.location.href` assignments to URLs from API responses (Stripe)
- Files: `src/components/checkout/PaymentStep.tsx` (line with Stripe URL), `src/components/orders/PendingOrderActions.tsx`
- Current mitigation: Only used for known safe URLs (Stripe checkout, tel: links)
- Recommendations: Create safe redirect utility that validates URL origin; use Next.js `router.push()` for internal navigation

**Console Logs in Production:**
- Risk: Debug info exposed (A/B test assignments, order reordering, location selections)
- Files: `src/lib/ab-testing.ts`, `src/components/admin/OrderManagement.tsx`, `src/components/checkout/AddressInput.tsx`, `src/components/menu/ItemDetail.tsx`
- Current mitigation: Only in development environments locally
- Recommendations: Remove all console.log statements; use proper logging service (Sentry) for errors only

**localStorage Direct Access for Sensitive State:**
- Risk: High-contrast mode and A/B test overrides stored in localStorage unencrypted
- Files: `src/components/layouts/DriverLayout.tsx`, `src/contexts/DriverContrastContext.tsx`, `src/lib/ab-testing.ts`
- Current mitigation: Non-sensitive preferences; not user auth data
- Recommendations: For A/B overrides, move to server-side session; high-contrast can remain client-side

---

## Performance Bottlenecks

**Cart Animations Rendering Inefficiency:**
- Problem: 919-line CartAnimations.tsx combines all animation variants; every cart change re-renders all animation logic
- Files: `src/components/cart/CartAnimations.tsx`, `src/components/cart/CartItem.tsx`
- Cause: Single component manages add-to-cart, swipe, and quantity animations; no fine-grained memoization
- Improvement path: Split animations into separate hooks; wrap CartItem in memo() with animation props only

**Large Form Validation Component:**
- Problem: 1031-line FormValidation.tsx re-validates entire form on every keystroke
- Files: `src/components/ui/FormValidation.tsx`
- Cause: All validation rules in single component; no debouncing or lazy validation
- Improvement path: Extract validation logic to hook; debounce in input handlers; lazy-validate on blur only

**Admin Dashboard Analytics Queries:**
- Problem: DeliveryMetricsDashboard and DriverAnalyticsDashboard make 3-4 sequential API calls on page load
- Files: `src/app/(admin)/admin/analytics/delivery/DeliveryMetricsDashboard.tsx`, `src/app/(admin)/admin/analytics/drivers/DriverAnalyticsDashboard.tsx`
- Cause: No query batching; parallel requests but slow network = waterfall
- Improvement path: Create batch API endpoint for analytics; use React Query or SWR for caching

**Real-Time Tracking Subscription Overhead:**
- Problem: Tracking page subscribes to both order and route stop channels; location updates can come separately
- Files: `src/components/tracking/TrackingPageClient.tsx`, `src/lib/hooks/useTrackingSubscription.ts`
- Cause: Route ID not tracked; all route location updates received even for other deliveries
- Improvement path: Extract route_id from routeStop; filter subscriptions by route_id; use single update channel

---

## Fragile Areas

**Checkout Flow Type Inconsistencies:**
- Files: `src/components/layouts/CheckoutLayout.tsx`, `src/lib/stores/checkout-store.ts`, `src/types/checkout.ts`
- Why fragile: Step counts and step names differ between layout (4) and store (3); adds confusion during refactors
- Safe modification: Export canonical CheckoutStep type from types/checkout.ts; import everywhere; run typecheck after changes
- Test coverage: Checkout flow tests limited; manual E2E required after step changes

**Dynamic Route Slug Names:**
- Files: `src/app/api/orders/[id]/`, `src/app/api/orders/[id]/rating/`
- Why fragile: Next.js enforces single slug naming across sibling directories; mismatch causes build failures
- Safe modification: Ensure all dynamic routes use consistent parameter names (e.g., `[id]` not `[orderId]`); test build after adds
- Test coverage: Build-time check only; no runtime tests

**Tests Coupled to CSS Classes:**
- Files: `src/components/menu/menu-content.test.tsx` (uses `.closest("[class*='opacity-60']")`)
- Why fragile: Test fails when styling refactored (e.g., opacity-60 → opacity-70); class-based selectors unmaintainable
- Safe modification: Use data-testid attributes instead of class selectors; test behavior not implementation
- Test coverage: Re-evaluate test strategy after refactoring; add data attributes for state testing

**V7 Component Barrel Export Chain:**
- Files: `src/components/ui/v7-index.ts`, `src/components/layouts/v7-index.ts`, individual component files
- Why fragile: 38 components renamed; barrel exports reference both old and new names; missed updates break imports
- Safe modification: After bulk renames, verify all barrel exports with `pnpm typecheck`; search for old export names before deleting files
- Test coverage: Typecheck runs at build time; no ESLint rule catches unused exports

**Zustand Store Initialization in Components:**
- Files: `src/lib/hooks/useCart.ts`, other store-based hooks
- Why fragile: Store initialized lazily on first hook call; SSR/hydration mismatches possible if stores accessed differently
- Safe modification: Initialize all stores at app root in providers.tsx; test SSR rendering with stores
- Test coverage: SSR hydration tests missing; manual Vercel deployment testing only

---

## Scaling Limits

**Supabase Real-Time Subscriptions (Current):**
- Current capacity: 100+ concurrent users each subscribing to order + route + location channels = 300+ channels
- Limit: Supabase free tier supports ~100 concurrent connections; beyond that = connection drops
- Scaling path: Migrate to Supabase Pro ($25/mo) or implement local state polling for non-critical updates

**Admin Dashboard Analytics Data Size:**
- Current capacity: 10,000 orders/month displays instantly
- Limit: 100,000+ orders/month = multi-second query times; browser memory issues with large result sets
- Scaling path: Implement server-side pagination; aggregate old data into daily summaries; use time-range filters

**A/B Testing localStorage:**
- Current capacity: ~50 KB of JSON in localStorage (experiment configs + overrides)
- Limit: Browser localStorage limit ~5-10 MB; other apps/extensions also use storage
- Scaling path: Move experiment config to CDN or server-side; keep only assignment in localStorage

---

## Dependencies at Risk

**@conform-to/react Form Validation (v1.x):**
- Risk: Conform uses older React patterns; latest Next.js 16 has subtle hook incompatibilities
- Impact: Form submission may fail silently during major Next.js upgrades
- Migration plan: Monitor React Hook Form as lighter alternative; maintain form validation tests for easy swap

**Framer Motion v11+ (Type Safety):**
- Risk: Motion value typing changed in v11; `useTransform` returns complex union types that don't match `MotionValue<T>`
- Impact: Type errors when passing motion values as props; casting required
- Migration plan: Use `MotionValue<number>` from framer-motion package for prop types; avoid TypeScript inference

**Supabase Client (JWT Expiration):**
- Risk: Client JWT refreshes automatically but can fail silently in offline scenarios
- Impact: Users see "unauthorized" after ~1 hour of inactivity; no clear error message
- Migration plan: Implement JWT refresh error handling; show login prompt; test offline scenarios

**Next.js 16 Middleware Streaming:**
- Risk: Middleware streaming requests can cause timeout on slow networks
- Impact: Slow clients timeout before response completes
- Migration plan: Set appropriate timeout headers; test on 3G networks; consider disabling streaming for critical paths

---

## Missing Critical Features

**Route ID Tracking for Real-Time Updates:**
- Problem: Driver location updates come from all active routes; no filtering by current order's route
- Blocks: Efficient real-time tracking; accurate ETA calculations; multi-delivery order batching
- Priority: **Medium** - Works but inefficient; affects driver app performance under load

**Batch Analytics API:**
- Problem: Admin dashboard makes 3-4 sequential API calls for metrics; no cache reuse
- Blocks: Loading times acceptable for admin but problematic as metrics scale; can't pre-aggregate
- Priority: **Medium** - Admin features; doesn't block customer usage

**Experiment Assignment Backend:**
- Problem: A/B testing fully client-side; no server to track assignments persistently
- Blocks: Multi-device consistent experiment experience; analytics pipeline integration; audit trails
- Priority: **Low** - Current system works for MVP; needed for production scale

**Image Optimization (Menu Items):**
- Problem: Menu item images fetched from API without resizing; large photos loaded for small thumbnails
- Blocks: Performance on slow networks; high bandwidth costs; can't show different sizes per device
- Priority: **Medium** - Noticeable on mobile; implement Next.js Image component with srcSet

**Offline Support:**
- Problem: App requires internet; cart lost on disconnect
- Blocks: Service worker caching; PWA features; limited connectivity scenarios
- Priority: **Low** - Not required for MVP; consider for future roadmap

---

## Test Coverage Gaps

**Tracking Subscription Reliability:**
- What's not tested: Edge cases in `useTrackingSubscription` - connection drops, reconnects, stale data
- Files: `src/lib/hooks/useTrackingSubscription.ts`
- Risk: Real-time tracking silently stops updating; user doesn't know driver location is stale
- Priority: **High** - Critical user flow

**Checkout Flow Step Progression:**
- What's not tested: Valid step transitions; prevention of skipping steps; backward navigation
- Files: `src/components/layouts/CheckoutLayout.tsx`, `src/lib/stores/checkout-store.ts`
- Risk: Users stuck on payment step; bypass security validation
- Priority: **High** - Money flow critical

**Form Validation Edge Cases:**
- What's not tested: Complex modifier groups; optional vs required; quantity limits
- Files: `src/components/ui/FormValidation.tsx`
- Risk: Invalid orders submitted; incorrect charges
- Priority: **High** - Data integrity

**Mobile Gesture Handling:**
- What's not tested: Swipe-to-delete on slow devices; multiple rapid swipes; landscape orientation changes
- Files: `src/lib/swipe-gestures.ts`, `src/components/cart/CartItem.tsx`
- Risk: Accidental deletions; gesture lag; loss of undo
- Priority: **Medium** - UX but not critical

**Admin Route Optimization:**
- What's not tested: Algorithm correctness; edge cases (1 order, 100+ orders, no-route scenarios)
- Files: `src/app/api/admin/routes/optimize/route.ts`, `src/components/admin/RouteOptimization.tsx`
- Risk: Routes inefficient or impossible to execute; drivers overloaded
- Priority: **High** - Operations dependent

**Analytics Query Performance:**
- What's not tested: Large data sets (100K orders); slow network conditions; cancellation
- Files: `src/app/(admin)/admin/analytics/*/`, API endpoints
- Risk: Admin dashboards timeout; no error recovery
- Priority: **Medium** - Admin experience

**Error Recovery Paths:**
- What's not tested: Network failures during checkout; Stripe webhook failures; Supabase outages
- Files: `src/app/api/checkout/session/route.ts`, `src/app/api/webhooks/stripe/route.ts`
- Risk: Orders stuck in pending; payment issues unresolved; silent failures
- Priority: **Critical** - Money flow depends on this

---

## Lint & Type Issues

**Unused Imports (213+ warnings):**
- Issue: V7 components have unused Lucide icons, React utilities, and Framer Motion imports
- Files: 38+ component files, primarily V7-suffix components
- Root cause: Features planned but not implemented (Sparkles, PartyPopper for celebrations; Share2, Download)
- Impact: Noise in typecheck; indicators of incomplete UX
- Fix: Remove unused imports OR implement intended features; treat as feature gap checklist

**No-Unused-Vars ESLint Configuration:**
- Issue: Underscore convention (`_unused`) not recognized by ESLint no-unused-vars rule
- Files: `eslint.config.mjs`
- Fix: Add `argsIgnorePattern: "^_"` to rule configuration

**Hardcoded Colors & Z-Index Values:**
- Issue: 50+ instances of arbitrary Tailwind classes like `z-[60]`, `bg-[#FF5733]`
- Files: Component files across all domains
- Root cause: Design token system incomplete; easier to hardcode than look up tokens
- Impact: Cannot enforce design consistency; difficult to theme changes
- Fix: ESLint `no-restricted-syntax` rule with regex patterns catches new violations; audit and fix existing

**Type Safety with Any/Unknown:**
- Issue: 20+ uses of `Record<string, unknown>` and `any` in admin routes
- Files: `src/app/api/admin/drivers/[id]/route.ts`, analytics routes
- Root cause: Dynamic object updates; flexible but unsafe
- Impact: Type errors missed at build time; runtime failures possible
- Fix: Create strict types for each update payload; validate with Zod or similar

---

## Deployment & CI/CD Issues

**Vitest 4 Worker Hangs on CI:**
- Issue: Tests pass but process never exits; CI timeout after 5 minutes
- Files: `package.json` test:ci script, GitHub Actions workflow
- Root cause: Vitest 4 worker threads don't clean up after completion
- Workaround: Use timeout wrapper; accept exit code 124 as success
- Fix: Upgrade to Vitest 5+ when available; or use `--no-file-parallelism` flag

**ESLint Flat Config Ignores Missing:**
- Issue: `.eslintignore` file deprecated; ESLint shows warnings
- Files: `.eslintignore`, `eslint.config.mjs`
- Fix: Move ignores to flat config; delete `.eslintignore`

**Next.js 16 Instrumentation Setup:**
- Issue: Sentry requires `instrumentation-client.ts` for Next.js 16; old config doesn't work
- Files: `src/instrumentation-client.ts`, `sentry.server.config.ts`
- Status: Fixed but ensure on production deployment

---

*Concerns audit: 2026-01-21*
