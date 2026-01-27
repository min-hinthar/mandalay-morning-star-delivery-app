# Morning Star Delivery App — V8 UI Rewrite

## What This Is

A full frontend rewrite of the Morning Star Weekly Delivery meal subscription app. Fresh V8 component library with portal-based overlays, tokenized z-index system, and animation-first design using GSAP and Framer Motion. V1 delivered customer flows (menu → cart → checkout) with reliable clickability. V1.1 completed tech debt cleanup with zero legacy patterns, strict TypeScript, and enforced design tokens. V1.2 delivered maximum playfulness with unified menu cards, rebuilt header/navigation, 12 micro-interactions, OLED dark mode, and comprehensive codebase cleanup.

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

### Active

**Current Milestone: v1.3 Full Codebase Consolidation**

**Goal:** Systematic consolidation of component systems, providers, and token enforcement — then hero redesign.

**Target features:**
- V7 component removal — single V8 component system
- Provider hierarchy cleanup — eliminate duplicate theme/state providers
- Token enforcement — all colors and z-index through semantic tokens (zero hardcoded)
- Full codebase audit — fix light/dark inconsistencies across ALL components
- Mobile 3D tilt fix — disable on touch devices
- Hero section redesign — layout, background, mascot, parallax with floating food emojis

### Out of Scope
- Backend/schema changes — Supabase + Stripe contracts stay stable
- Multi-restaurant marketplace — not part of Morning Star scope
- Admin/Driver dashboard changes — v1.2 focuses on customer pages only

## Context

**Current state (v1.2 shipped):**
- V8 component library complete with maximum playfulness
- 127 requirements validated across 24 phases (v1.0 + v1.1 + v1.2)
- All flows using V8 components: customer, admin, driver
- Zero z-index violations with ESLint enforcement at error severity
- Animation tokens consolidated to single source (motion-tokens.ts)
- TypeScript strict mode with unused variable checks
- 12 micro-interactions implemented across all interactive elements
- OLED-friendly dark mode with circular reveal transition
- Complete header/nav rebuild: AppHeader, MobileDrawer, CommandPalette
- 33 files deleted, 6 packages removed (~650KB bundle reduction)

**Tech stack:**
- Next.js 16.1.2 + React 19.2.3 + TailwindCSS 4
- Framer Motion 12.26.1 + GSAP 3.14.2
- Zustand for state management
- Supabase auth + Stripe checkout
- 92,952 total TypeScript LOC

**Remaining tech debt:**
- Visual regression baselines need generation (78 tests ready, run in network-enabled environment)

**Design direction:**
- Animation-first: GSAP for timelines/scroll, Framer Motion for components
- Reference apps: DoorDash, Uber Eats, Pepper template
- V8 colors: amber-500 primary accent, warm dark mode undertones

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

---
*Last updated: 2026-01-27 after v1.3 milestone started*
