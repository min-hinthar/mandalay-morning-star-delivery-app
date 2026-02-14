# Morning Star Delivery App — V8 UI Rewrite

## What This Is

A full frontend rewrite of the Morning Star Weekly Delivery meal subscription app. Fresh V8 component library with portal-based overlays, tokenized z-index system, and animation-first design using GSAP and Framer Motion. Seven milestones shipped (v1.0-v1.6): customer flows, tech debt cleanup, playful UI overhaul, codebase consolidation, mobile excellence, performance infrastructure, and production polish. V1.6 completed the production-readiness pass: error boundaries on all routes, branded 404 pages, premium passwordless auth (magic link + Google/Apple OAuth), transactional email system via Resend, fuzzy search with Burmese dish name tolerance, cart validation with stale item detection, customer/admin settings with DB persistence, driver offline sync with consolidated IndexedDB queue, and premium admin/driver visual polish with card-based tables, skeleton crossfade, and animated status badges.

## Core Value

**Every UI element is reliably clickable and the app feels delightfully alive with motion.** If overlays block clicks or animations feel janky, we've failed.

## Requirements

### Validated

- ✓ Customer order flow (menu → cart → checkout → Stripe) — existing
- ✓ Supabase auth with role-based access (customer/admin/driver) — existing
- ✓ Stripe subscription and checkout integration — existing
- ✓ Cart state persistence via Zustand + localStorage — existing
- ✓ Server-side rendering with React Query caching — existing
- ✓ Google Maps integration for delivery tracking — existing
- ✓ Admin analytics dashboards — existing
- ✓ Driver delivery management — existing
- ✓ Z-index token system with semantic names — v1
- ✓ ESLint/Stylelint rules enforcing tokenized z-index — v1
- ✓ Color token system with light/dark mode support — v1
- ✓ Motion token system (springs, durations, easings) — v1
- ✓ GSAP plugin registration and useGSAP patterns — v1
- ✓ GSAP scroll choreography patterns library — v1
- ✓ Stacking context isolation rules documented — v1
- ✓ Creative page layouts and effects system — v1
- ✓ Modal dialog component (portal-based, correct z-index) — v1
- ✓ Bottom sheet component (mobile, swipe-to-dismiss) — v1
- ✓ Side drawer component (desktop, animated) — v1
- ✓ Dropdown component (correct stacking, no event swallowing) — v1
- ✓ Tooltip component (proper z-index, pointer-events) — v1
- ✓ Toast notification system (stacked, dismissible) — v1
- ✓ All overlays reset state on route change — v1
- ✓ Spring physics animations on overlay open/close — v1
- ✓ Backdrop blur effects with proper isolation — v1
- ✓ Sticky header with cart badge (always clickable) — v1
- ✓ Bottom navigation for mobile — v1
- ✓ Page container components with consistent spacing — v1
- ✓ Mobile menu with automatic close on route change — v1
- ✓ Header scroll effects (shrink/blur on scroll) — v1
- ✓ Page transition animations (AnimatePresence) — v1
- ✓ App shell layout composing header, nav, and content areas — v1
- ✓ Cart drawer/sheet (mobile bottom sheet, desktop side drawer) — v1
- ✓ Cart item rows with quantity controls — v1
- ✓ Subtotal and order summary display — v1
- ✓ Clear cart action with confirmation — v1
- ✓ Add-to-cart celebration animations — v1
- ✓ Swipe-to-delete items gesture — v1
- ✓ Quantity change animations (number morph) — v1
- ✓ Animated "$ more for free delivery" indicator — v1
- ✓ Category tabs with scrollspy behavior — v1
- ✓ Menu item cards with effects and motion physics — v1
- ✓ Item detail modal/sheet with full information — v1
- ✓ Search with autocomplete suggestions — v1
- ✓ Skeleton loading states for all menu content — v1
- ✓ Staggered list reveal animations — v1
- ✓ Image lazy loading with blur-up placeholder effect — v1
- ✓ Animated favorites (heart animation on toggle) — v1
- ✓ Placeholder emoji icons for items without images — v1
- ✓ Multi-step checkout form — v1
- ✓ Address selection/management — v1
- ✓ Stripe payment integration with new UI — v1
- ✓ Order confirmation page — v1
- ✓ Loading states throughout checkout — v1
- ✓ Animated step progress indicator — v1
- ✓ Form field micro-interactions (focus, validation, error) — v1
- ✓ Success celebration animation on order completion — v1
- ✓ E2E test: header clickability on all routes — v1
- ✓ E2E test: cart drawer open/close/opacity — v1
- ✓ E2E test: dropdown/tooltip visibility and dismissal — v1
- ✓ E2E test: overlay does not block background when closed — v1
- ✓ Visual regression snapshots for shells and overlays — v1
- ✓ Zero z-index ESLint violations (64 → 0) — v1.1
- ✓ All z-index uses semantic tokens (z-dropdown, z-sticky, z-fixed, z-modal) — v1.1
- ✓ ESLint z-index rule at error severity (build fails on hardcoded z-index) — v1.1
- ✓ TimeStepV8 component with V8 animation patterns — v1.1
- ✓ Dead code analysis via knip (480 exports analyzed) — v1.1
- ✓ All zero-reference exports removed (44 files deleted) — v1.1
- ✓ All v7-index.ts barrel files removed (10 files) — v1.1
- ✓ TypeScript strict flags enabled (noUnusedLocals, noUnusedParameters) — v1.1
- ✓ Admin dashboard migrated to V8 components — v1.1
- ✓ Driver dashboard migrated to V8 components — v1.1
- ✓ Visual regression tests for Admin flow (3 tests) — v1.1
- ✓ Visual regression tests for Driver flow (5 tests) — v1.1
- ✓ Color token migration (header, FlipCard, charts use semantic tokens) — v1.1
- ✓ TailwindCSS 4 z-index tokens generate utility classes correctly — v1.2
- ✓ Signout button click registers properly (z-index/stacking fix) — v1.2
- ✓ UnifiedMenuItemCard with glassmorphism, 3D tilt, shine effect — v1.2
- ✓ Menu page uses unified card design — v1.2
- ✓ Homepage menu section uses unified card design — v1.2
- ✓ Cart items use unified card style — v1.2
- ✓ Video hero component with gradient fallback — v1.2
- ✓ How It Works section with enhanced animations — v1.2
- ✓ Testimonials carousel with auto-rotation — v1.2
- ✓ CTA Banner with scroll animations — v1.2
- ✓ All buttons have consistent press compression animation — v1.2
- ✓ All inputs have focus glow/pulse animation — v1.2
- ✓ Toggle switches have bouncy animation — v1.2
- ✓ Branded loading spinner (8-pointed star themed) — v1.2
- ✓ Success states have checkmark draw animation — v1.2
- ✓ Error states have shake animation — v1.2
- ✓ Skeleton loading has premium shimmer effect — v1.2
- ✓ Quantity selector has rubbery spring overshoot — v1.2
- ✓ Image reveals have blur-to-sharp + scale effect — v1.2
- ✓ Swipe gestures respond to velocity — v1.2
- ✓ Price changes animate digit-by-digit — v1.2
- ✓ Favorite heart toggle has particle burst — v1.2
- ✓ OLED-friendly dark mode (pure black surfaces) — v1.2
- ✓ Theme toggle has animated sun/moon morph — v1.2
- ✓ Theme switch has circular reveal transition — v1.2
- ✓ All color tokens reviewed for proper contrast — v1.2
- ✓ Menu page has enhanced entry animations — v1.2
- ✓ Checkout pages have enhanced animations — v1.2
- ✓ Order history page has enhanced animations — v1.2
- ✓ AppHeader with velocity-aware hide/show — v1.2
- ✓ MobileDrawer with swipe-to-close gesture — v1.2
- ✓ CommandPalette with Cmd/Ctrl+K shortcut — v1.2
- ✓ CartIndicator with badge bounce animation — v1.2
- ✓ AccountIndicator with avatar dropdown — v1.2
- ✓ Animation tokens consolidated to single source — v1.2
- ✓ 33 files deleted in codebase cleanup — v1.2
- ✓ 6 packages removed (~650KB bundle reduction) — v1.2
- ✓ All text-white/text-black replaced with semantic tokens (text-text-inverse, text-text-primary) — v1.3
- ✓ All bg-white/bg-black replaced with semantic tokens (bg-surface-primary, bg-overlay) — v1.3
- ✓ All hardcoded hex colors use token equivalents — v1.3
- ✓ All gradients use theme-aware CSS variables — v1.3
- ✓ Tailwind spacing scale enforced (no arbitrary m-[Npx], p-[Npx]) — v1.3
- ✓ Typography scale enforced (text-2xs token added for 10px) — v1.3
- ✓ All box-shadow uses design system shadow tokens (16 tokens) — v1.3
- ✓ All backdrop-blur uses consistent tokens (7 blur levels) — v1.3
- ✓ All CSS transition durations use motion tokens — v1.3
- ✓ ESLint rules for all token categories at error level — v1.3
- ✓ Automated audit script detects design token regressions — v1.3
- ✓ Token documentation with visual examples (7 MDX files in Storybook) — v1.3
- ✓ ui-v8/ merged into ui/ directory — v1.3
- ✓ All imports use unified @/components/ui/* paths — v1.3
- ✓ Single Modal, Drawer (with BottomSheet), Tooltip, Toast implementations — v1.3
- ✓ 3D tilt disabled on touch devices via CSS media query — v1.3
- ✓ Safari backface-visibility fixes applied — v1.3
- ✓ translate3d compositing for tilt elements — v1.3
- ✓ Hero section visible without cutoff on page load — v1.3
- ✓ 13 floating food emojis with staggered CSS animations — v1.3
- ✓ 4-layer parallax scroll effect — v1.3
- ✓ Hero works correctly in both light and dark themes — v1.3
- ✓ Gradient background animates with shimmer on scroll — v1.3
- ✓ Legacy gradient code removed, uses semantic tokens only — v1.3
- ✓ All components tested in both light and dark modes (38 WCAG AAA tests) — v1.3
- ✓ ESLint z-index rule enforced at error level — v1.3
- ✓ Husky pre-commit hooks with lint-staged — v1.3
- ✓ Hero visual regression tests with baselines — v1.3
- ✓ design-system/ and contexts/ directories consolidated — v1.3
- ✓ ESLint guards prevent recreation of removed directories (14 rules) — v1.3
- ✓ Zero mobile crashes (300 files audited, utility hooks created) — v1.4
- ✓ CLS: 0 (perfect), quality 70 default, shimmer placeholders — v1.4
- ✓ Service worker with CacheFirst/NetworkFirst caching strategies — v1.4
- ✓ IndexedDB menu cache with offline indicator and stale badges — v1.4
- ✓ Device capability detection with low/high tier animations — v1.4
- ✓ GSAP/Framer Motion conflict detector (dev-mode warnings) — v1.4
- ✓ Enhanced fly-to-cart with sound, haptics, checkmark feedback — v1.4
- ✓ Supabase Storage for admin photo uploads (menu-photos bucket) — v1.4
- ✓ Dynamic featured sections with admin management — v1.4
- ✓ Driver detail and route detail pages with Google Maps — v1.4
- ✓ Settings page with tabbed interface — v1.4
- ✓ Customer account page with profile, orders, addresses — v1.4
- ✓ Driver invite system with email-based magic links — v1.4
- ✓ Route optimization modal with before/after comparison — v1.4
- ✓ Zero circular dependencies (9 cycles fixed) — v1.4
- ✓ 12 dead code files deleted with ESLint guards — v1.4
- ✓ LCP 45% improvement (19.9s → 10.9s) via image optimization, Server Components, dynamic imports — v1.5
- ✓ React Compiler enabled globally (282 client components auto-memoized) — v1.5
- ✓ LazyMotion domMax with strict mode (174 files migrated motion.* → m.*) — v1.5
- ✓ Code-splitting: Recharts, Google Maps, cart components lazy-loaded — v1.5
- ✓ Cart scoped to customer/public routes (~60KB savings on admin/driver/auth) — v1.5
- ✓ Server Component conversions: menu, home, analytics, tracking pages — v1.5
- ✓ Lighthouse CI on every PR (4 customer routes, warn-only) — v1.5
- ✓ E2E cart tests (19 tests) integrated in CI pipeline — v1.5
- ✓ 47 files >400 lines refactored into 129+ sub-modules with barrel re-exports — v1.5
- ✓ ESLint max-lines rule enforcing 400-line warning on all src files — v1.5
- ✓ Legacy docs V0-V7 deleted (94 files), storybook-static untracked (89 files) — v1.5
- ✓ PERFORMANCE.md documenting optimization journey and bottleneck analysis — v1.5
- ✓ File organization patterns documented in CLAUDE.md (4 patterns) — v1.5
- ✓ Desktop Lighthouse profile available via LIGHTHOUSE_PROFILE env var — v1.5
- ✓ Error boundaries (error.tsx) on all routes — v1.6
- ✓ Loading states (loading.tsx) on all admin pages — v1.6
- ✓ Branded 404 pages with food-themed mascot and navigation — v1.6
- ✓ Admin settings fully managed in app UI with DB persistence — v1.6
- ✓ Customer settings page (dietary, notifications, theme, delivery instructions) — v1.6
- ✓ Cart validation on mount (hydration-aware, stale item detection) — v1.6
- ✓ Full cart page (two-column layout, category grouping, attention section) — v1.6
- ✓ Passwordless auth (magic link + Google/Apple OAuth) with premium animations — v1.6
- ✓ Login success ceremony with logo morph animation — v1.6
- ✓ Transactional emails (confirmation, cancellation, refund, reminder) via Resend — v1.6
- ✓ Stripe webhook idempotency preventing duplicate emails — v1.6
- ✓ Fuzzy search with Fuse.js, category tabs, thumbnails, order history — v1.6
- ✓ Driver offline sync with consolidated IndexedDB queue and exponential backoff — v1.6
- ✓ Admin/driver premium polish (card tables, skeleton crossfade, status badges, empty states) — v1.6
- ✓ Driver history shows real on-time percentage (computed from data) — v1.6

### Active

## Current Milestone: v1.7 Production Deployment & Readiness

**Goal:** Deploy to production at delivery.mandalaymorningstar.com with full ops config, monitoring, performance optimization, and backlog cleanup.

**Target features:**
- Vercel deployment with custom subdomain (delivery.mandalaymorningstar.com)
- Social login ops config (Google OAuth + Apple Sign-in)
- Resend domain verification (SPF/DKIM/DMARC)
- Sentry error monitoring (client + server)
- CI/CD hardening (Lighthouse CI blocking, preview deploys)
- LCP optimization (8-11s → <4s)
- Lighthouse score improvement (30-45 → 70+)
- Admin order detail page (/admin/orders/[id])
- Admin profile page (/admin/profile)
- SETT-04 language preference
- CartPage modifier editor wiring
- Tracking page route_id extraction
- UnifiedMenuItemCard refactoring (<400 lines)
- Visual regression baselines generation
- Dead code removal (old send-order-confirmation Edge Function)

### Out of Scope
- Backend/schema changes — Supabase + Stripe contracts stay stable
- Multi-restaurant marketplace — not part of Morning Star scope
- Real-time subscriptions — current REST pattern sufficient for launch

## Context

**Current state (v1.6 shipped):**
- 7 milestones complete: v1.0-v1.6 (57 phases, 255 plans, 309+ requirements)
- Full design token system: 62+ semantic tokens enforced via ESLint
- Single unified component library: @/components/ui/ with barrel exports
- Error boundaries + loading states on every route (14 error.tsx, 23 loading.tsx)
- Branded 404 pages with food-themed mascot across customer/admin/driver portals
- Premium passwordless auth: magic link + Google/Apple OAuth with login ceremony
- Transactional email system: 4 templates, Stripe webhook idempotency, admin UI
- Fuzzy search: Fuse.js with Burmese dish name tolerance, category tabs, thumbnails
- Cart validation: hydration-aware stale detection, full cart page
- Customer settings: dietary prefs, notifications, theme, delivery instructions
- Admin settings: delivery, operations, notifications with DB persistence
- Driver offline sync: consolidated IndexedDB queue, exponential backoff, idempotency
- Admin/driver premium polish: card-based tables, skeleton crossfade, animated badges
- React Compiler enabled globally (282 client components)
- LazyMotion domMax (174 files use m.* instead of motion.*)
- Code-splitting: Recharts, Google Maps, cart all dynamically imported
- Lighthouse CI running on every PR (4 routes, warn-only)
- Pre-commit hooks: Husky + lint-staged blocking ESLint violations
- 844 source files, ~53,394 lines TypeScript

**Tech stack:**
- Next.js 16.1.2 + React 19.2.3 + TailwindCSS 4
- Framer Motion 12.26.1 (LazyMotion domMax) + GSAP 3.14.2 (useGSAP + ScrollTrigger)
- React Compiler (babel-plugin-react-compiler)
- Zustand for state management
- Supabase auth + Stripe checkout
- Serwist for service worker
- Resend + React Email for transactional emails
- Fuse.js for fuzzy search
- ~53,394 lines TypeScript total

**Remaining tech debt:**
- LCP: 8-11s (JS execution bottleneck — needs SSR streaming, edge rendering, or JS payload reduction)
- Lighthouse performance score: 30-45 (target 90+)
- UnifiedMenuItemCard: 540 lines (documented exception — tightly coupled state)
- Lighthouse CI: warn-only (PRs not blocked on LCP regression)
- Social login requires Google Cloud Console + Apple Developer Portal ops config
- Resend domain verification needed for production email delivery

**Design direction:**
- Animation-first: GSAP for timelines/scroll, Framer Motion for components
- Reference apps: DoorDash, Uber Eats, Pepper template
- V8 colors: amber-500 primary accent, warm dark mode undertones
- Admin accent: teal for admin/driver pages (distinct from customer amber)

## Constraints

- **Tech stack**: Next.js App Router, TailwindCSS, Supabase, Stripe — keep existing
- **Backend contracts**: API routes and Supabase schema stay stable
- **Approach**: Fresh components in new directories, parallel development, swap when ready
- **Skill usage**: Use `@.claude/skills/UI-UX-Color-Designs` for design system work

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full frontend rewrite (not incremental fixes) | V7 has systemic layering issues; patching won't solve root cause | ✓ Good — delivered clean codebase |
| Fresh components (parallel development) | Allows building new system without breaking existing | ✓ Good — swapped seamlessly |
| Customer flows only for V1 | Admin/Driver work; focus on broken customer experience | ✓ Good — focused scope |
| Animation everywhere (not selective) | User wants "over-the-top animated" experience | ✓ Good — distinctive feel |
| Import GSAP from @/lib/gsap | Ensures plugins registered | ✓ Good — consistent setup |
| ESLint z-index rules at warn severity | Legacy code awareness without blocking build | ✓ Good — phased migration |
| overlayMotion spring/duration pattern | Natural entrance, snappy exit | ✓ Good — feels responsive |
| Backdrop uses AnimatePresence | Fully removes from DOM when closed | ✓ Good — click-blocking fixed |
| No stopPropagation on dropdown | Events bubble for form compatibility | ✓ Good — V7 bug fixed |
| knip for dead code analysis | ESM-native, Next.js compatible, comprehensive output | ✓ Good — found 47 files, 480 exports |
| TimeStepV8 uses enhanced TimeSlotPicker | Consistent V8 patterns (motion, tokens, types) | ✓ Good — checkout unified |
| Semantic z-index tokens (z-dropdown, z-sticky, z-fixed) | Clear intent vs arbitrary numbers | ✓ Good — self-documenting |
| Footer dark gradient as intentional | Custom dark theme colors documented, not tokens | ✓ Good — design preserved |
| Chart colors use CSS variables | Theme consistency via var(--color-*) | ✓ Good — theme-aware |
| ESLint z-index upgrade to error | Prevents regression; local stacking contexts exempt | ✓ Good — enforced |
| Local stacking uses inline zIndex 1-4 | Components with isolate class exempt from token rule | ✓ Good — clean pattern |
| mockFonts helper for visual tests | Prevents Google Fonts TLS failures in sandboxed CI | ✓ Good — network independence |
| Visual regression baselines deferred | Network access needed; infrastructure ready | — Pending |
| UnifiedMenuItemCard 3D tilt | 18-degree max, spring physics (stiffness 150, damping 15) | ✓ Good — premium feel |
| Glassmorphism 30px blur | Upgraded from 20px for stronger glass effect | ✓ Good — distinctive cards |
| 80ms stagger standard | STAGGER_GAP = 0.08, capped at 500ms max delay | ✓ Good — consistent reveals |
| 25% viewport trigger | VIEWPORT_AMOUNT = 0.25 for scroll animations | ✓ Good — timely reveals |
| OLED dark mode (pure black) | #000000 surfaces for OLED displays | ✓ Good — battery friendly |
| View Transitions API circular reveal | Spring easing (0.34, 1.56, 0.64, 1) for theme switch | ✓ Good — delightful |
| Velocity-aware scroll hide | 300px/s threshold for header show/hide | ✓ Good — natural feel |
| MobileDrawer swipe 100px threshold | Left swipe to close, body scroll lock | ✓ Good — intuitive gesture |
| Animation tokens single source | All imports from @/lib/motion-tokens exclusively | ✓ Good — maintainable |
| 2D hero permanent (not fallback) | Gradient + floating animation, removed 3D | ✓ Good — performance |
| 3D hero removed in cleanup | ~650KB reduction, simplified codebase | ✓ Good — faster loads |
| Semantic color tokens (text-text-inverse, bg-overlay) | Theme-aware without hardcoded values | ✓ Good — v1.3 |
| ESLint guards for removed directories | Prevents re-creation of deleted paths | ✓ Good — v1.3 |
| BottomSheet merged into Drawer | position="bottom" prop instead of separate component | ✓ Good — v1.3 |
| Touch detection via CSS media query | (hover: hover) and (pointer: fine) | ✓ Good — v1.3 |
| Floating emojis replace mascot | 13 emojis with drift/spiral/bob animations | ✓ Good — v1.3 |
| 4-layer parallax structure | orbs-far, orbs-mid, emojis, content with preset speeds | ✓ Good — v1.3 |
| Husky pre-commit with --max-warnings=0 | All ESLint errors block commits | ✓ Good — v1.3 |
| WCAG AAA for dark mode primary | #FF6B6B gives 6.33:1 contrast ratio | ✓ Good — v1.3 |

| Low-power threshold <=4GB OR <=4 cores | Device tier detection for animation scaling | ✓ Good — v1.4 |
| Safari fallback via user agent | Mobile Safari = low-power, desktop = high-power | ✓ Good — v1.4 |
| Parallax only disabled on low-power | All other animations remain enabled | ✓ Good — v1.4 |
| Custom SW build script for Turbopack | @serwist/next doesn't support Turbopack | ✓ Good — v1.4 |
| CacheFirst for images 30-day | Offline image availability | ✓ Good — v1.4 |
| NetworkFirst for menu API 5-min | Fresh data preferred, stale fallback | ✓ Good — v1.4 |
| flyingCount replaces isAnimating | Allows multiple concurrent fly animations | ✓ Good — v1.4 |
| cartPop sound 1200Hz→800Hz | Descending sine, 60ms for satisfying pop | ✓ Good — v1.4 |
| CardImage to Next.js Image | 2.6s resource load delay is main LCP bottleneck | ✓ Good — 43-46% LCP reduction — v1.5 |
| HomePageWrapper thin client pattern | Minimal client wrapper for scroll spy; sections at server level | ✓ Good — v1.5 |
| importWithRetry for dynamic imports | Resilient loading with retry logic for code-split chunks | ✓ Good — v1.5 |
| Viewport-triggered maps (IntersectionObserver) | Defers Google Maps (~120KB) until scrolled into view | ✓ Good — v1.5 |
| CartOverlays wrapper for route-group scoping | DRY Fragment rendering CartBar + CartDrawer + FlyToCart | ✓ Good — v1.5 |
| React Compiler enabled globally, no opt-outs | All 282 client components compile cleanly | ✓ Good — v1.5 |
| LazyMotion domMax + strict at root | drag + layoutId require domMax; strict prevents motion.* regression | ✓ Good — v1.5 |
| motion.* → m.* migration (174 files) | Per-component ~34KB to ~4.6KB; features loaded once at root | ✓ Good — v1.5 |
| Lighthouse CI warn-only, PR-only | Regression gate without blocking PRs | ✓ Good — v1.5 |
| ESLint max-lines at 400 warning | Prevents file growth regression; exempts types/tests/stories | ✓ Good — v1.5 |
| 4 file-splitting patterns in CLAUDE.md | Component subfolder, lib subfolder, admin sibling, API route sibling | ✓ Good — v1.5 |
| LCP target revised from <2.5s to <4s | Original target unrealistic without architecture changes | ⚠️ Revisit — v1.7 |
| CSS-only error boundary animations | Framer Motion in error.tsx causes crash loops | ✓ Good — v1.6 |
| Passwordless auth (no password pages) | Magic link + OAuth more secure; simpler UX | ✓ Good — v1.6 |
| Fire-and-forget email sending | Email failure never blocks API responses | ✓ Good — v1.6 |
| Webhook idempotency via UNIQUE constraint | Atomic check-then-claim for duplicate prevention | ✓ Good — v1.6 |
| Fuse.js threshold 0.4 for Burmese names | Typo tolerance without false positives | ✓ Good — v1.6 |
| IndexedDB single queue (removed Zustand) | Eliminated dual-queue sync conflicts | ✓ Good — v1.6 |
| Teal accent for admin pages | Visual distinction from customer amber | ✓ Good — v1.6 |
| dangerouslySetInnerHTML for header styles | Prevents styled-jsx hydration mismatch | ✓ Good — v1.6 |

---
*Last updated: 2026-02-13 after v1.7 milestone start*
