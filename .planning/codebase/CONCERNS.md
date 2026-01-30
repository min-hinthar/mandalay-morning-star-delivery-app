# Codebase Concerns

**Analysis Date:** 2026-01-30

## Tech Debt

**Sentry Integration Disabled in Development:**
- Issue: Sentry client-side instrumentation causes "Maximum update depth exceeded" infinite loop blocking navigation
- Files: `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Impact: No error tracking in development mode, can't debug client-side errors locally, production-only monitoring
- Fix approach: Wait for @sentry/nextjs compatibility fix for Next.js 16 / React 19, monitor Sentry release notes

**In-Memory Rate Limiting Not Production-Ready:**
- Issue: Rate limiter uses Map-based in-memory store, won't work across multiple server instances
- Files: `src/lib/utils/rate-limit.ts`
- Impact: Rate limits reset on server restart, can be bypassed with multiple requests to different instances, memory accumulation over time
- Fix approach: Replace with Redis or Upstash for distributed state, add IP-based fallback, implement proper cleanup

**Large Component Files:**
- Issue: Multiple components exceed 500+ lines, some exceed 1000 lines
- Files: `src/components/ui/FormValidation.tsx` (1031 lines), `src/lib/motion-tokens.ts` (927 lines), `src/components/ui/homepage/HowItWorksSection.tsx` (873 lines), `src/components/ui/Modal.tsx` (719 lines), `src/lib/swipe-gestures.ts` (687 lines)
- Impact: Harder to maintain, test, and reason about; increases cognitive load; violates project convention of <400 lines
- Fix approach: Split into smaller modules using composition patterns (extract sub-components, hooks, utilities)

**setTimeout/setInterval Cleanup Pattern Not Enforced:**
- Issue: Many files recently fixed for missing timeout cleanup, but pattern not enforced at lint/build time
- Files: Recent fixes in 15+ components (see ERROR_HISTORY.md entries from 2026-01-29 to 2026-01-30)
- Impact: New code may introduce same mobile crash bugs, no automated detection
- Fix approach: Create ESLint rule to detect setTimeout/setInterval without cleanup, add to CI pipeline

**TypeScript `any` Usage:**
- Issue: 29 instances of `any` type across 21 files
- Files: `src/app/(customer)/checkout/page.tsx`, `src/app/(admin)/admin/menu/page.tsx`, `src/lib/webgl/gradients.ts`, `src/lib/hooks/useCart.ts`, and 17 others
- Impact: Type safety bypassed, potential runtime errors not caught at compile time
- Fix approach: Audit each usage, replace with proper types or `unknown` with type guards

**Console Logs in Production Code:**
- Issue: 30 console.log/warn/error statements across 19 files
- Files: `src/lib/web-vitals.tsx`, `src/lib/services/route-optimization.ts`, `src/lib/services/geocoding.ts`, `src/lib/stores/cart-store.ts`, and 15 others
- Impact: Some survive next.config.ts removeConsole filter (errors/warns excluded), leak internal state to production console
- Fix approach: Replace with proper logger utility (`src/lib/utils/logger.ts` exists), enforce via ESLint rule

**Missing Google Maps Map ID:**
- Issue: AdvancedMarkerElement requires Map ID but not configured in all environments
- Files: `src/components/ui/orders/tracking/DeliveryMap.tsx`, `src/components/ui/homepage/HowItWorksSection.tsx`, `src/components/ui/coverage/CoverageRouteMap.tsx`
- Impact: Falls back to legacy Marker API, can't use vector maps or custom HTML markers, console warnings in production
- Fix approach: Add NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID to .env.example, document in setup guide, add validation check

## Known Bugs

**Route ID Extraction Missing:**
- Symptoms: Tracking page can't extract route_id from routeStop
- Files: `src/components/ui/orders/tracking/TrackingPageClient.tsx:51`
- Trigger: Order tracking when routeStop doesn't contain route_id field
- Workaround: TODO comment indicates feature not implemented yet

**Dropdown Close on Item Click (Fixed but Fragile):**
- Symptoms: Clicking dropdown items closes menu before action fires
- Files: `src/components/ui/dropdown-menu.tsx`
- Trigger: Fast click on menu items
- Workaround: Fixed with mousedown handler and click-outside ref wrapping entire dropdown, but pattern could regress

**Mobile Scroll Lock Still Has Edge Cases:**
- Symptoms: Occasional crash/reload when rapidly opening/closing nested overlays
- Files: `src/lib/hooks/useBodyScrollLock.ts`, multiple modal/drawer components
- Trigger: Rapidly toggle nested modals (modal inside drawer, item detail inside cart)
- Workaround: useBodyScrollLock now tracks global lock count and defers restore, but timing-sensitive

## Security Considerations

**Service Role Key Exposure Risk:**
- Risk: SUPABASE_SERVICE_ROLE_KEY bypasses Row Level Security, could expose all data
- Files: `.env.example`, server-side API routes
- Current mitigation: Only used server-side, never in NEXT_PUBLIC_ vars, documented in .env.example
- Recommendations: Audit all usages, ensure never sent to client, consider rotating periodically

**Secrets in Environment Files:**
- Risk: .env.local contains actual secrets, could be committed accidentally
- Files: `.env`, `.env.local` (git-ignored but present on disk)
- Current mitigation: .gitignore excludes .env.local, .env.example shows template
- Recommendations: Add pre-commit hook to scan for secrets, use encrypted secrets manager for team sharing

**Google Maps API Key:**
- Risk: GOOGLE_MAPS_API_KEY is public (exposed to client), could be scraped and abused
- Files: `.env.example`, Google Maps components
- Current mitigation: Should have domain restrictions in Google Cloud Console
- Recommendations: Document API key restrictions setup, add HTTP referrer restrictions, monitor usage quotas

**Stripe Webhook Secret:**
- Risk: If STRIPE_WEBHOOK_SECRET leaked, attacker could forge payment events
- Files: `.env.example`, webhook handler
- Current mitigation: Not exposed to client, only server-side
- Recommendations: Rotate on any suspected compromise, use Stripe CLI secret for local dev only

**Dangerously Allow SVG:**
- Risk: next.config.ts enables dangerouslyAllowSVG which could allow XSS via SVG files
- Files: `next.config.ts:37`
- Current mitigation: CSP sandbox policy applied, content-disposition attachment
- Recommendations: Validate SVG sources, consider disabling if not needed, keep CSP strict

## Performance Bottlenecks

**Large Bundle Size from Heavy Components:**
- Problem: HowItWorksSection includes Google Maps (369KB), loads synchronously even when below fold
- Files: `src/components/ui/homepage/HowItWorksSection.tsx` (873 lines), Google Maps integration
- Cause: No lazy loading for below-fold heavy components
- Improvement path: Already wrapped in React.lazy() per LEARNINGS.md, verify it's applied consistently, consider IntersectionObserver for maps

**Framer Motion willChange Always Applied:**
- Problem: Multiple menu cards with `willChange: "transform"` create GPU memory pressure
- Files: `src/components/ui/menu/UnifiedMenuItemCard/*.tsx`, GSAP-animated components
- Cause: Static willChange creates compositor layers even when not animating
- Improvement path: Apply willChange conditionally on hover/interaction only (pattern in LEARNINGS.md)

**setInterval Animations Run Off-Screen:**
- Problem: Animation intervals continue when elements not visible (CPU/battery waste)
- Files: `src/components/ui/homepage/HowItWorksSection.tsx`, pulsing animations in maps
- Cause: No visibility detection for repeating animations
- Improvement path: Add IntersectionObserver to pause animations when off-screen (pattern in LEARNINGS.md 2026-01-29)

**Multiple Overlay Implementations:**
- Problem: 6 separate drawer/modal implementations (Drawer, MobileDrawer, Modal, AuthModal, ExceptionModal, Dialog)
- Files: `src/components/ui/Drawer.tsx`, `src/components/ui/layout/MobileDrawer/MobileDrawer.tsx`, `src/components/ui/Modal.tsx`, `src/components/ui/auth/AuthModal.tsx`, driver exception modal, Radix Dialog
- Cause: Intentional architecture per LEARNINGS.md - each serves specific use case
- Improvement path: NOT a concern - this is correct architecture. Shared hooks (useBodyScrollLock, useSwipeToClose) prevent duplication

**WebGL Fallback Code:**
- Problem: WebGL gradient system has fallback CSS with potential hardcoded values
- Files: `src/lib/webgl/gradients.ts`
- Cause: Fallback path for unsupported browsers may not use design tokens
- Improvement path: Audit fallback inline styles for token violations, ensure theme-aware

## Fragile Areas

**AnimatePresence + Scroll Lock Cleanup Timing:**
- Files: `src/lib/hooks/useBodyScrollLock.ts`, all modal/drawer components using exit animations
- Why fragile: Scroll operations during exit animation cause iOS Safari crashes; requires precise timing with onExitComplete
- Safe modification: Always use deferRestore option, test on actual iOS devices (not Chrome emulator), never call scrollTo during animation
- Test coverage: No automated E2E tests for scroll lock cleanup timing

**Event Listener Accumulation Pattern:**
- Files: `src/components/ui/layout/MobileDrawer/MobileDrawer.tsx`, any component with isOpen in useCallback dependencies
- Why fragile: useCallback with state dependencies changes function reference, listeners accumulate if not defined inside useEffect
- Safe modification: Define handlers inside useEffect with guard clause, never use useCallback for addEventListener handlers with state deps
- Test coverage: Requires manual testing with multiple open/close cycles

**Framer Motion + 3D Transform Conflicts:**
- Files: `src/components/ui/menu/UnifiedMenuItemCard/*.tsx`, components with preserve-3d tilt effects
- Why fragile: whileHover scale + 3D transforms create stacking context conflicts causing flicker
- Safe modification: Disable scale when using 3D tilt, or disable tilt on low-end devices
- Test coverage: Visual regression tests exist but may not catch flicker on all devices

**Portal-Rendered Dropdowns:**
- Files: `src/components/ui/menu/SearchAutocomplete.tsx`, components using createPortal for escape hatches
- Why fragile: Position tracking requires manual getBoundingClientRect and scroll offset calculation
- Safe modification: Use inline styles with CSS variables for guaranteed application, track position in useEffect
- Test coverage: E2E tests for basic functionality, but edge cases (parent transform, iframe) not covered

**Route Optimization Algorithm:**
- Files: `src/lib/services/route-optimization.ts`
- Why fragile: Complex traveling salesman approximation, could have edge cases with overlapping coordinates
- Safe modification: Add extensive logging, test with real-world address sets, validate output manually
- Test coverage: Limited unit tests, needs property-based testing

## Scaling Limits

**In-Memory Cart Store:**
- Current capacity: Single browser session, lost on refresh
- Limit: Can't sync across devices, doesn't persist
- Scaling path: Add Supabase persistence with sync, implement optimistic updates

**Rate Limiter Map-Based Store:**
- Current capacity: Single server instance, unbounded growth
- Limit: Memory leak potential, resets on server restart, 5-minute cleanup interval may be too slow under load
- Scaling path: Replace with Redis or Upstash, implement sliding window algorithm, add monitoring

**Google Maps API Usage:**
- Current capacity: Unknown quota, no monitoring
- Limit: Could hit daily request limits with traffic growth
- Scaling path: Add usage tracking, implement client-side caching, batch geocoding requests

**Supabase Connection Pool:**
- Current capacity: Default Supabase project limits
- Limit: May exhaust connections under high concurrent load
- Scaling path: Monitor connection metrics, implement connection pooling with PgBouncer, upgrade plan

## Dependencies at Risk

**@sentry/nextjs Compatibility:**
- Risk: Currently disabled in dev due to Next.js 16 / React 19 incompatibility causing infinite loops
- Impact: No error tracking in development, can't test Sentry integration locally
- Migration plan: Monitor Sentry releases for Next.js 16 compatibility, re-enable when fixed, test thoroughly

**Framer Motion on React 19:**
- Risk: Framer Motion heavily used (200+ files), React 19 may introduce breaking changes
- Impact: Animation system could break, core UX affected
- Migration plan: Pin Framer Motion version, monitor release notes, test animations thoroughly on major FM updates

**Google Maps API Deprecations:**
- Risk: Using legacy Marker API as fallback when Map ID not provided
- Impact: Legacy API could be deprecated, maps would break
- Migration plan: Complete migration to AdvancedMarkerElement by adding Map IDs to all environments

**TailwindCSS v4 Still New:**
- Risk: v4 has different behavior than v3 (z-index, content scanning, @theme inline), may have undiscovered issues
- Impact: Already encountered multiple issues (see ERROR_HISTORY.md z-index entries)
- Migration plan: Monitor Tailwind issues, document workarounds, consider staying on v4 LTS when available

## Missing Critical Features

**No Offline Support for Menu:**
- Problem: Menu data requires network, unavailable offline
- Blocks: Can't browse menu without connection, poor mobile experience in weak signal
- Priority: Medium - affects UX but not core checkout

**No PWA Installation:**
- Problem: No manifest.json or service worker for installable app
- Blocks: Can't install to home screen, no offline capabilities
- Priority: Medium - nice-to-have for mobile-first experience

**No Real-Time Order Updates Client-Side:**
- Problem: Order tracking requires manual refresh
- Blocks: Customer doesn't see live driver location updates
- Priority: High - core feature for delivery tracking UX

**No Automated Accessibility Testing:**
- Problem: No axe or other a11y tests in CI
- Blocks: Accessibility regressions could ship unnoticed
- Priority: Medium - have manual a11y testing but not automated

**No Error Boundary Fallbacks:**
- Problem: Limited error boundaries, crashes could show blank page
- Blocks: Poor UX when components throw errors
- Priority: High - affects recovery from runtime errors

## Test Coverage Gaps

**Mobile Crash Scenarios:**
- What's not tested: Rapid open/close of overlays, setTimeout cleanup, event listener cleanup
- Files: `src/lib/hooks/useBodyScrollLock.ts`, `src/components/ui/layout/MobileDrawer/MobileDrawer.tsx`, all modal/drawer components
- Risk: Recent wave of mobile crash fixes (2026-01-29 to 2026-01-30) indicates fragile patterns
- Priority: High - affects core mobile UX

**Animation Exit Timing:**
- What's not tested: AnimatePresence onExitComplete callbacks, scroll restore timing, iOS Safari specific behavior
- Files: All components using AnimatePresence with scroll lock
- Risk: Timing-sensitive code prone to regression
- Priority: High - crashes are user-facing

**Rate Limiting:**
- What's not tested: Rate limiter cleanup, memory growth over time, expired entry cleanup
- Files: `src/lib/utils/rate-limit.ts`
- Risk: Memory leak potential in production
- Priority: Medium - only 18 test files total in codebase

**Server Actions with redirect():**
- What's not tested: Server actions that call redirect() with various error handling patterns
- Files: Components using server actions (signout, form submissions)
- Risk: NEXT_REDIRECT swallowing documented in ERROR_HISTORY.md, could regress
- Priority: Medium - affects auth flows

**WebGL Fallback Paths:**
- What's not tested: WebGL gradient system fallback code, token compliance in fallback CSS
- Files: `src/lib/webgl/gradients.ts`
- Risk: Fallback code may have hardcoded values that break theming
- Priority: Low - affects unsupported browsers only

**Portal Positioning Edge Cases:**
- What's not tested: Dropdown positioning when parent has transforms, inside iframes, with page scroll
- Files: `src/components/ui/menu/SearchAutocomplete.tsx`, portal-rendered components
- Risk: Dropdowns could be mispositioned in edge cases
- Priority: Low - basic positioning works

---

*Concerns audit: 2026-01-30*
