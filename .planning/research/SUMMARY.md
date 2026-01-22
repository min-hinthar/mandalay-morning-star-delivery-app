# Project Research Summary

**Project:** Morning Star Delivery App - Full UI Rewrite
**Domain:** Premium Food Delivery UI/UX (Next.js + React + TailwindCSS)
**Researched:** 2026-01-21
**Confidence:** HIGH

## Executive Summary

This is a comprehensive UI/UX rewrite for a food delivery application with an explicit goal of "over-the-top animated + playful" design. Research reveals that success hinges on solving the existing overlay/z-index chaos (50+ hardcoded values, stacking context traps, route-persisting overlays) while building a dual-animation system (GSAP for scroll choreography + Motion for component interactions). The recommended approach establishes a strict token-based z-index hierarchy and centralized portal system before touching any visual components.

**Critical insight:** GSAP is now 100% free (Webflow acquisition eliminated licensing fees), making premium scroll animations and text-splitting effects accessible without Club GreenSock membership. Combined with Motion's component-level declarative API, this dual-library approach delivers the "playful" requirement while avoiding performance pitfalls on mobile devices.

**Primary risk:** The existing codebase has fundamental overlay infrastructure issues (overlays persisting across routes, stacking context traps from backdrop-filter, Radix dropdown event swallowing). These must be resolved in Phase 1 foundation work, not deferred. Building visual components before fixing the layer architecture will result in rework and continued clickability issues.

## Key Findings

### Recommended Stack

The stack builds on existing Next.js 16 + React 19 + TailwindCSS 4 foundation with strategic additions for animation and layering. Core additions: GSAP + @gsap/react for timeline choreography (now free), CSS custom properties for z-index tokens consumed via TailwindCSS 4 `@theme` directive, and explicit `isolation: isolate` boundaries for stacking context management.

**Core technologies:**
- **GSAP ^3.14 + @gsap/react ^2.1**: Timeline choreography, ScrollTrigger, SplitText, Flip animations — Bypasses React rendering for 60fps, free plugins including formerly premium features
- **Motion ^12.27** (Framer Motion): Component-level interactions, layout animations, gesture support — Declarative API, AnimatePresence for exit animations, already in codebase
- **CSS Custom Properties + isolation: isolate**: Z-index token system with explicit stacking contexts — TailwindCSS 4 native support, cleanest context management without transform side effects
- **TailwindCSS 4 @theme**: Token consumption as first-class utilities — Generates `z-modal`, `z-toast` from CSS variables
- **Radix UI Primitives**: Accessible overlay primitives (Dialog, Dropdown, Tooltip) — Already in codebase, handles a11y and focus management when used correctly

**Critical versions:**
- TailwindCSS 4 required for `@theme` directive native CSS variable support
- GSAP 3.13+ includes free SplitText with accessibility features post-Webflow acquisition

**Anti-patterns identified:**
- GSAP inside useEffect (memory leaks) → Use useGSAP hook with automatic cleanup
- Animating width/height (layout thrash) → Animate scale/clipPath
- Hardcoded z-index numbers → Tokenized var(--z-*) pattern
- Transform on overlay containers → Breaks fixed positioning, use isolation instead
- ScrollSmoother plugin → Heavy, SEO concerns, not needed for this project

### Expected Features

Research identified clear table stakes vs. differentiators for premium food delivery UX.

**Must have (table stakes):**
- Bottom navigation bar (mobile-first, 4-5 items, thumb-friendly) — iOS/Android standard
- Sticky header with cart badge — Persistent cart access expected
- Category tabs with scrollspy — Fast menu browsing, DoorDash/Uber Eats standard
- Skeleton loading screens — 20-30% faster perceived load vs. spinners
- Item detail bottom sheet — Full-screen mobile, swipe-to-dismiss
- Cart drawer with swipe-to-delete — Native mobile feel
- Guest checkout — 24% abandon due to forced account creation (Baymard)
- Touch targets 44x44px minimum — iOS/Android accessibility guidelines
- Color contrast 4.5:1 — WCAG AA baseline

**Should have (competitive differentiators):**
- Page transitions — App-like navigation feel, AnimatePresence + shared layout
- Scroll choreography — Parallax headers, staggered reveals (GSAP ScrollTrigger)
- Add-to-cart celebration — Item "flies" to cart, confetti burst, haptic feedback
- Staggered list animations — 50-100ms delay per item, content feels alive
- Haptic feedback patterns — Add-to-cart, pull-to-refresh, success states (iOS/Android native)
- Quick-add from list — Bypass modal for items without required customizations
- Menu item hover/tap states — Scale 1.02-1.05, shadow elevation

**Defer (v2+):**
- One-tap reorder from favorites — Requires order history backend integration
- Real-time delivery estimates — Backend dependency, complex kitchen load calculation
- Custom animated icons (Lottie) — Polish, not critical path
- Full dark mode — Time-intensive, needs custom dark palette not just color inversion
- Advanced scroll effects (ScrollSmoother) — Performance/SEO concerns

**Anti-features (explicitly avoid):**
- Aggressive "Install App" prompts → 25% abandonment (Baymard)
- Hidden fees until checkout → Destroys trust, show delivery fees in cart
- Hamburger menu as primary mobile nav → 150% longer task time, use bottom nav
- Auto-playing video backgrounds → Performance hit, accessibility issue
- Parallax on mobile (heavy) → Motion sickness, respect prefers-reduced-motion
- Required customization on every item → Slows repeat users, allow quick-add

### Architecture Approach

The recommended architecture uses portal-first overlay system with strict z-index token enforcement and component isolation boundaries. Addresses core PRD problems: 50+ hardcoded z-index values, overlay state persisting across routes, stacking context traps from backdrop-filter, no centralized portal strategy.

**Major components:**

1. **Token System (foundation)** — Single source of truth for z-index (base:0 → dropdown:10 → sticky:20 → fixed:30 → modalBackdrop:40 → modal:50 → popover:60 → tooltip:70 → toast:80 → max:100), motion tokens (spring presets, duration scale), GSAP presets for timeline choreography
2. **OverlayProvider (centralized state)** — Single portal root at document.body level, auto-closes overlays on route change via pathname effect, proper stacking order management, focus trap coordination
3. **Portal/Overlay Infrastructure** — OverlayPortalRoot renders in z-index order, no transform/filter on portal container (escapes stacking contexts), all overlay components register with provider instead of managing own state
4. **Isolation Boundaries** — Explicit `isolation: isolate` on headers/fixed elements, backdrop-blur elements portal overlays OUT instead of containing them, GPU promotion (`will-change: transform`) used sparingly and removed after animation
5. **Dual Animation System** — GSAP for timeline choreography/scroll-driven animations (hero reveals, parallax), Motion for component interactions/presence (hover, modal enter/exit, layout shifts), shared duration values for consistency

**Component boundaries:**
- Tokens → import nothing
- Primitives (Portal, FocusTrap, ScrollLock) → import tokens only
- Atoms (Button, Input, Badge) → import tokens + primitives
- Organisms (Dialog, Drawer, Header) → import atoms + primitives, use OverlayProvider
- Layouts (AppShell, CustomerLayout) → compose organisms

**Build order rationale:**
1. Tokens + Primitives + Providers (no dependencies)
2. Atoms (depend on tokens)
3. Overlay Organisms (depend on Phase 1 + Phase 2, solve critical issues first)
4. Non-Overlay Organisms (Header, BottomNav — depend on atoms)
5. Layouts (compose everything)

### Critical Pitfalls

Research identified 5 critical pitfalls that cause rewrites or major failures if not addressed.

1. **Stacking Context Traps from CSS Properties** — `backdrop-filter`, `transform`, `opacity < 1`, `will-change: transform` create new stacking contexts that trap z-index. Prevention: Audit all fixed/sticky elements, use single portal root, test z-index by setting fixed elements to pointer-events-none. Phase 1 (Foundation).

2. **Z-Index Token Collision and Hardcoding** — 50+ instances found in codebase, unpredictable layer ordering. Prevention: Tokenized system with ESLint enforcement, no `z-50` allowed, use `z-[var(--z-modal)]`. Component layer assignment table. Phase 1 (Foundation).

3. **Overlay State Persisting Across Route Changes** — Mobile menu/drawer state not cleaned up on navigation, invisible backdrop blocks entire page. Prevention: `usePathname()` effect in all overlay components or centralized in OverlayProvider. Phase 2 (Navigation/Overlays).

4. **Radix Dropdown Event Swallowing** — Form submissions inside DropdownMenuItem fail, Next.js redirect() thrown errors caught in try/catch blocks. Prevention: Never use `<form action={...}>` inside dropdown items, create DropdownAction component, re-throw NEXT_REDIRECT errors. Phase 2 (Navigation/Overlays).

5. **AnimatePresence Mounting/Unmounting Race Conditions** — Exit animations don't play when AnimatePresence placed inside conditional rendering. Prevention: AnimatePresence always mounted, wraps conditional content with keys. Phase 3 (Animation System).

**Moderate pitfalls:**
- Portal z-index inheritance (use Radix consistently)
- Body scroll lock conflicts (centralized manager counting active locks)
- Motion performance on low-end devices (animate transform/opacity only, reduce spring stiffness)
- Inconsistent animation timing (motion token system already exists in codebase)
- Glass/blur effects breaking text contrast (explicit text color, 0.85+ opacity for text containers)

## Implications for Roadmap

Based on research, strict dependency order required. Foundation must solve overlay/z-index chaos before visual components.

### Phase 1: Foundation & Token System
**Rationale:** All subsequent work depends on token infrastructure and overlay architecture. Existing codebase has 50+ z-index issues and overlay state persistence problems. Must establish correct patterns before building on broken foundation.

**Delivers:**
- Z-index token system (CSS custom properties + TailwindCSS 4 @theme)
- Motion token system (spring presets, durations, GSAP presets)
- OverlayProvider with route-aware cleanup
- Portal infrastructure (OverlayPortalRoot)
- Primitives (Portal, FocusTrap, ScrollLock, DismissableLayer)
- IsolationBoundary component
- GSAP plugin registration and setup
- ESLint rules for z-index enforcement

**Addresses features:**
- Foundation for all overlay components (modals, drawers, tooltips, toasts)
- Motion tokens enable consistent animation timing

**Avoids pitfalls:**
- Pitfall 1 (stacking context traps) via explicit isolation boundaries
- Pitfall 2 (z-index collision) via token system + lint enforcement
- Pitfall 9 (inconsistent animation) via motion token system

**Research needs:** None — well-documented patterns, existing motion-tokens.ts to build on

### Phase 2: Core Overlay Components
**Rationale:** These are the problem components causing current clickability issues. Build with correct portal/z-index behavior from start using Phase 1 infrastructure. Required for all other UI work (every page needs dialogs, tooltips, dropdowns).

**Delivers:**
- Dialog component (uses OverlayProvider, tokenized z-index)
- Drawer component (mobile cart, filters)
- BottomSheet component (item customization, mobile-first)
- Dropdown component (fixes Radix event swallowing)
- Tooltip component (proper z-index stacking)
- Toast system (notifications)

**Uses stack:**
- Radix UI primitives (Dialog, Dropdown, Tooltip)
- Motion for enter/exit animations
- OverlayProvider from Phase 1
- Z-index tokens from Phase 1

**Implements architecture:**
- Centralized portal strategy
- Controlled overlay state pattern
- Route-aware cleanup

**Avoids pitfalls:**
- Pitfall 3 (overlay persistence) via pathname effect in OverlayProvider
- Pitfall 4 (Radix dropdown events) via DropdownAction component pattern
- Pitfall 6 (portal z-index) via consistent Radix usage + token application

**Research needs:** Minimal — Radix patterns well-documented, existing codebase has examples to improve upon

### Phase 3: Animation System Integration
**Rationale:** With overlay infrastructure solid, implement "over-the-top animated" requirement. GSAP setup needs testing on real components before widespread use. Motion component patterns established.

**Delivers:**
- GSAP integration (ScrollTrigger, SplitText, Flip, Observer)
- Scroll choreography patterns (parallax, staggered reveals)
- Page transition system (AnimatePresence wrappers)
- Add-to-cart celebration animation (item flies to cart, confetti)
- Staggered list animations (menu items, cart items)
- Haptic feedback integration (iOS/Android)
- useReducedMotion hook and accessibility

**Uses stack:**
- GSAP + @gsap/react for timeline choreography
- Motion for component-level interactions
- Motion tokens from Phase 1

**Implements architecture:**
- Dual-library strategy (GSAP for scroll, Motion for components)
- Shared duration values for consistency

**Avoids pitfalls:**
- Pitfall 5 (AnimatePresence placement) via standard overlay wrapper
- Pitfall 8 (Motion performance) via transform/opacity only, reduced spring stiffness
- Pitfall 9 (timing inconsistency) via motion tokens

**Research needs:** Medium — Performance profiling on real Android device needed, ScrollTrigger patterns need testing with Next.js App Router

### Phase 4: Atoms & Molecules
**Rationale:** Basic building blocks depend on tokens (Phase 1) and may trigger overlays (Phase 2). With animation system proven (Phase 3), can add micro-interactions.

**Delivers:**
- Button component (variants, loading states, micro-interactions)
- Input component (focus animations, validation states)
- Badge component (cart count, category pills)
- Icon component (Lucide integration)
- MenuItem component (food card with image, price, quick-add)
- CartItemRow component (quantity stepper, swipe-to-delete)

**Addresses features:**
- Touch targets 44x44px minimum
- Button loading states
- Menu item hover/tap states (scale, shadow)
- Quick-add from list (bypass modal)

**Avoids pitfalls:**
- Pitfall 10 (glass effects) via explicit text color, high opacity backgrounds
- Pitfall 11 (PriceTicker inCents) via code review

**Research needs:** None — standard component patterns

### Phase 5: Layout & Navigation
**Rationale:** Composes organisms (Phase 2) and atoms (Phase 4) into page structure. Header/BottomNav need explicit isolation boundaries.

**Delivers:**
- AppShell layout (header + main + bottomNav)
- Header component (sticky, cart badge, search, isolation boundary)
- BottomNav component (mobile-first, 4-5 items, active state)
- Category tabs with scrollspy (GSAP ScrollTrigger)
- PageContainer component (safe area, scroll container)

**Addresses features:**
- Bottom navigation bar (table stakes)
- Sticky header with cart icon (table stakes)
- Category tabs with scrollspy (table stakes)
- Back gesture support (platform native)

**Implements architecture:**
- Explicit isolation boundaries on header/sticky elements
- Portal strategy for header dropdowns

**Avoids pitfalls:**
- Pitfall 1 (stacking context traps) via isolation on header

**Research needs:** None — standard layout patterns

### Phase 6: Menu Browsing & Cart
**Rationale:** Core user flow composes all previous phases. Requires scroll choreography (Phase 3), overlays (Phase 2), components (Phase 4), layout (Phase 5).

**Delivers:**
- Menu grid/list view (skeleton loading, staggered animations)
- Item detail bottom sheet (customization, add-to-cart)
- Cart drawer (swipe-to-delete, quantity animations)
- Search with autocomplete (debounced, recent searches)
- Dietary filters (multi-select pills)
- Pull-to-refresh (haptic feedback)

**Addresses features:**
- High-quality food photography (16:9, lazy loading)
- Item cards with name/price/description (table stakes)
- Full-screen item modal/sheet (table stakes)
- Cart drawer with inline editing (table stakes)
- Skeleton loading screens (table stakes)
- Add-to-cart celebration (differentiator)

**Avoids pitfalls:**
- Pitfall 7 (scroll lock conflicts) via centralized manager
- Pitfall 8 (Motion performance) via transform-only animations

**Research needs:** Low — May need food photography optimization research (WebP, AVIF)

### Phase 7: Checkout & Polish
**Rationale:** Final user flow, least dependency-heavy, can be refined post-MVP.

**Delivers:**
- Checkout flow (delivery address, payment, order summary)
- Guest checkout option (email-only)
- Order confirmation (success animation, haptic)
- Favorites/heart animation (confetti micro-burst)
- Dark mode (full custom palette)
- Accessibility audit (contrast, focus, reduced motion)

**Addresses features:**
- Guest checkout option (table stakes)
- Multiple payment methods (table stakes)
- Progress indicator (table stakes)
- Error states with recovery (table stakes)

**Avoids pitfalls:**
- Pitfall 13 (useMediaQuery SSR) via mounted state check

**Research needs:** None for MVP — Dark mode may need color palette research

### Phase Ordering Rationale

- **Foundation first (Phase 1):** Token system and overlay infrastructure prevent all 5 critical pitfalls. Building visual components before fixing layer architecture = rework.
- **Overlays before atoms (Phase 2 → Phase 4):** Dialog/Drawer/Toast are infrastructure that atoms use (Button triggers Dialog, MenuItem uses Tooltip). Solving clickability issues unblocks all other work.
- **Animation after overlays (Phase 3):** GSAP ScrollTrigger needs stable layout, AnimatePresence needs overlay patterns established. Testing scroll choreography on real components before widespread use.
- **Layout after components (Phase 5):** Header composes atoms, uses overlays. Bottom navigation composes atoms. AppShell requires Header + BottomNav finished.
- **Features after infrastructure (Phases 6-7):** Menu/Cart/Checkout compose everything. Clean deferred to post-infrastructure.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Animation):** Performance profiling on real Android device needed, ScrollTrigger + Next.js App Router interaction patterns sparse in documentation
- **Phase 6 (Menu Browsing):** Food photography optimization (WebP vs AVIF, lazy loading strategies, LCP impact)

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Z-index token patterns well-documented (Microsoft Atlas, USWDS), existing motion-tokens.ts to build on
- **Phase 2 (Overlays):** Radix documentation comprehensive, existing codebase has examples to improve
- **Phase 4 (Atoms):** Standard component patterns, CVA for variants already in use
- **Phase 5 (Layout):** Standard sticky header, bottom nav patterns
- **Phase 7 (Checkout):** Standard form flow, Stripe integration documented

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | GSAP pricing verified via official blog/npm, Motion/Framer rename verified via changelog, TailwindCSS 4 @theme verified via official docs, isolation property verified via MDN |
| Features | HIGH | Table stakes verified via Baymard Institute research (24% abandon forced signup, 25% abandon install prompts), NN/g guidelines for skeleton screens/bottom sheets/cart feedback, platform guidelines for touch targets/haptics |
| Architecture | HIGH | Portal-first approach verified via Radix documentation, stacking context behavior verified via Josh Comeau/MDN/web.dev, existing codebase provides evidence of current issues (50+ z-index instances, backdrop-filter on header) |
| Pitfalls | HIGH | All 5 critical pitfalls verified in existing codebase (LEARNINGS.md entries, PRD_V8.md issues), AnimatePresence patterns verified via Framer Motion docs, Radix event handling verified via official docs |

**Overall confidence:** HIGH

### Gaps to Address

**GSAP + Next.js App Router performance:**
- ScrollTrigger behavior with Next.js prefetching not fully documented
- Need to test scroll position restoration on browser back
- Handle during Phase 3 via real device testing, implement scroll position save if needed

**Mobile device performance baseline:**
- No specific performance budget established for animations
- Need to profile on representative Android device (mid-tier, not flagship)
- Handle during Phase 3 via Chrome DevTools throttling + real device testing, establish FPS baseline

**Food photography optimization:**
- WebP vs AVIF adoption, image CDN requirements unclear
- Handle during Phase 6 via image optimization research if LCP suffers

**Dark mode palette:**
- Research deferred dark mode to Phase 7, full palette design needed
- Not just inverted colors, requires custom color tokens
- Handle during Phase 7 via design token research if prioritized

## Sources

### Primary (HIGH confidence)

**Stack:**
- [GSAP 3.13 Release Blog](https://gsap.com/blog/3-13/) — Plugin availability, pricing post-Webflow acquisition
- [GSAP React Documentation](https://gsap.com/resources/React/) — useGSAP hook patterns
- [Motion Upgrade Guide](https://motion.dev/docs/react-upgrade-guide) — Package rename details
- [TailwindCSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4) — @theme directive, CSS-first config
- [MDN - CSS isolation property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/isolation) — Official documentation

**Features:**
- [Baymard Institute - Food Delivery & Takeout UX Research](https://baymard.com/research/online-food-delivery) — Table stakes, abandonment rates
- [NN/g - Cart Feedback Guidelines](https://www.nngroup.com/articles/cart-feedback/) — Confirmation patterns
- [NN/g - Bottom Sheet Guidelines](https://www.nngroup.com/articles/bottom-sheet/) — Mobile overlay patterns
- [NN/g - Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/) — Loading state best practices
- [Android Developers - Haptics Design Principles](https://developer.android.com/develop/ui/views/haptics/haptics-principles) — Platform guidelines

**Architecture:**
- [Josh Comeau - Stacking Contexts](https://www.joshwcomeau.com/css/stacking-contexts/) — Stacking context fundamentals
- [Radix UI - Portal Documentation](https://www.radix-ui.com/primitives/docs/utilities/portal) — Portal z-index handling
- [Microsoft Atlas - Z-Index Tokens](https://design.learn.microsoft.com/tokens/z-index.html) — Enterprise token pattern

**Pitfalls:**
- Existing codebase LEARNINGS.md (2026-01-18 through 2026-01-21) — Verified issues
- [Radix Dialog Documentation](https://www.radix-ui.com/primitives/docs/components/dialog) — Accessibility patterns
- [Backdrop-Filter Positioning Issues](https://medium.com/@aqib-2/why-backdrop-filter-fails-with-positioned-child-elements-0b82b504f440) — Stacking context traps
- [Transform Z-Index Trap in React](https://dev.to/minoosh/today-i-learned-layouts-and-the-z-index-trap-in-react-366f) — React-specific issues

### Secondary (MEDIUM confidence)

- [Smashing Magazine - Sticky Menu UX Guidelines](https://www.smashingmagazine.com/2023/05/sticky-menus-ux-guidelines/) — Layout patterns
- [Mobbin - Bottom Sheet UI Patterns](https://mobbin.com/glossary/bottom-sheet) — Design examples
- [BrixLabs - Micro Animation Examples 2025](https://bricxlabs.com/blogs/micro-interactions-2025-examples) — Animation inspiration
- [Cieden - Fixing 9 Common UX Mistakes in Food Delivery Apps](https://cieden.com/fixing-9-common-ux-mistakes-in-food-delivery-app-ux-upgrade) — Anti-patterns

### Tertiary (LOW confidence)

- [Medium - Food Delivery App UI UX Design 2025](https://medium.com/@prajapatisuketu/food-delivery-app-ui-ux-design-in-2025-trends-principles-best-practices-4eddc91ebaee) — General trends
- [Netguru - Top 10 Food App Design Tips 2025](https://www.netguru.com/blog/food-app-design-tips) — Design recommendations

---

*Research completed: 2026-01-21*
*Ready for roadmap: yes*
