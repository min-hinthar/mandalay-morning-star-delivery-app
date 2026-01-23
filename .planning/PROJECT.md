# Morning Star Delivery App — V8 UI Rewrite

## What This Is

A full frontend rewrite of the Morning Star Weekly Delivery meal subscription app. Fresh V8 component library with portal-based overlays, tokenized z-index system, and animation-first design using GSAP and Framer Motion. V1 delivered customer flows (menu → cart → checkout) with reliable clickability. V1.1 completed tech debt cleanup with zero legacy patterns, strict TypeScript, and enforced design tokens across the entire codebase.

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

### Active

**Next Milestone: v1.2** (not yet defined)

Potential focus areas:
- Reduced motion automatic detection (prefers-reduced-motion)
- Dark mode palette refinement
- Performance budget enforcement

### Out of Scope
- Backend/schema changes — Supabase + Stripe contracts stay stable
- Multi-restaurant marketplace — not part of Morning Star scope
- Reduced motion automatic detection — motion-first by design; manual toggle later

## Context

**Current state (v1.1 shipped):**
- V8 component library complete with full codebase adoption
- 69 requirements validated across 14 phases (v1.0 + v1.1)
- All flows using V8 components: customer, admin, driver
- Zero z-index violations with ESLint enforcement at error severity
- Zero v7-index.ts legacy barrels remaining
- TypeScript strict mode with unused variable checks
- 78 visual regression tests (baselines to generate in network-enabled environment)

**Tech stack:**
- Next.js 16.1.2 + React 19.2.3 + TailwindCSS 4
- Framer Motion 12.26.1 + GSAP 3.14.2
- Zustand for state management
- Supabase auth + Stripe checkout
- 101,118 total TypeScript LOC

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

---
*Last updated: 2026-01-23 after v1.1 milestone complete*
