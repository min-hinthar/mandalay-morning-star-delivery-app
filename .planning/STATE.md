# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** v1.2 Playful UI Overhaul - Phase 24 Codebase Cleanup

## Current Position

Phase: 24 of 24 (Codebase Cleanup)
Plan: 2 of ? (24-02 complete)
Status: In progress
Last activity: 2026-01-27 - Completed 24-02-PLAN.md (Remove Legacy Files)

Progress: [####################] v1.0-v1.1 complete | [##########################] v1.2 100%

## Milestones Completed

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 1-8 | 32 | 2026-01-23 |
| v1.1 Tech Debt | 9-14 | 21 | 2026-01-23 |

**Total completed:** 24 phases, 84 plans
**v1.2 scope:** 9 phases (15-23), 26 plans, 48+ requirements
**v1.2 progress:** 9 phases complete, 26 plans done
**Phase 24:** 2 plans complete (cleanup in progress)

## Performance Metrics

**Velocity:**
- Total plans completed: 84 (v1.0 + v1.1 + v1.2 + cleanup)
- v1.2 plans completed: 26
- Average duration: 10min (Phase 15-24)

**By Phase (v1.2):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 15 | 2/2 | 24min | 12min |
| 16 | 4/4 | 29min | 7.3min |
| 18 | 3/3 | 53min | 18min |
| 19 | 4/4 | 27min | 6.8min |
| 20 | 4/4 | ~35min | 8.8min |
| 21 | 3/3 | ~25min | 8.3min |
| 22 | 3/3 | ~22min | 7.3min |
| 23 | 5/5 | 40min | 8min |
| 24 | 2/? | ~12min | 6min |

*Updated after each plan completion*

## Accumulated Context

### Key Issues to Address

- ~~TailwindCSS 4 custom zIndex theme extensions not generating utility classes (INFRA-01)~~ RESOLVED in 15-01
- ~~Signout button click not registering (z-index/stacking context) (INFRA-02)~~ RESOLVED in 15-01
- ~~Pre-existing TypeScript errors in layout components (polymorphic types)~~ RESOLVED in 15-01

### Design Decisions

- 3D hero: Interactive food showcase with Three.js/React Three Fiber
- Menu items: New unified design across homepage, menu page, cart
- Theme: Light/dark refinement (footer text visibility, contrast)
- R3F 9.5.0 required for React 19 compatibility (v8.x fails)
- SSR-safe pattern: useState(false) + useEffect mounted check
- Dynamic imports with ssr: false for all R3F components
- GPU tier 2+ threshold for 3D rendering (30+ fps capable)
- Optimistic default to 3D while GPU detection loads
- Indeterminate spinner for 3D loading (percentage unreliable for single GLB)
- 2D fallback is designed experience for low-end devices, not failure state
- show3D prop defaults to true, allows conditional disabling for A/B testing
- **UnifiedMenuItemCard 3D tilt:** 18-degree max angle, spring-smoothed (stiffness: 150, damping: 15)
- **Glassmorphism:** 75% opacity, 30px blur via .glass-menu-card (upgraded from 20px in 22-01)
- **AddButton state machine:** idle -> adding (300ms) -> quantity for cart flow
- **useScrollSpy returns index:** Simpler for SectionNavDots integration than returning id string
- **AnimatedSection always replays:** viewport.once: false for engaging scroll experience
- **SectionNavDots mobile hidden:** Side dots clutter small screens; hidden md:flex pattern
- **Video 30% visibility threshold:** Balance between responsiveness and avoiding flicker
- **Video fallback strategy (19-04):** fetch HEAD to check video existence, gradient fallback if missing
- **Scroll snap desktop-only (19-04):** md:snap-y md:snap-mandatory on container, mobile uses natural scroll
- **snappyButton spring (20-01):** stiffness 500, damping 30, mass 0.8 - quick press feedback
- **bouncyToggle spring (20-01):** stiffness 400, damping 12, mass 0.9 - playful overshoot
- **Button depth effect (20-01):** hover y:-1/scale 1.02, tap y:+1/scale 0.97 with shadow reduction
- **Input focus glow (20-01):** amber default, red error, green success (3px spread)
- **ErrorShake local variants (20-02):** Define shakeVariants and pulseVariants locally for encapsulation
- **Rubbery spring for checkbox (20-02):** spring.rubbery gives satisfying bounce on check
- **8-pointed star spinner (20-02):** Morning Star brand as stylized star
- **Rubbery spring for quantity selector (20-03):** spring.rubbery (damping: 8) for satisfying overshoot
- **AnimatedImage blur-scale (20-03):** blur 20px + scale 1.1 -> clear + scale 1 on load
- **Web Audio synthesis (20-03):** OscillatorType + GainNode for programmatic sounds
- **BrandedSpinner size mapping (20-04):** sm for sm/md buttons, md for lg/xl buttons
- **Button loading integration (20-04):** Use isLoading prop, BrandedSpinner is automatic
- **ErrorShake form integration (20-04):** Wrap error with ErrorShake, trigger on validation fail
- **Binary theme toggle (21-02):** Light/dark only; system mode via OS settings
- **View Transitions circular reveal (21-02):** cubic-bezier(0.34, 1.56, 0.64, 1) spring easing
- **Theme sounds (21-02):** Web Audio synthesis - A5/E6 chime (light), A3 tone (dark)
- **3D lighting lerp factor (21-03):** delta * 4 for ~500ms smooth transitions
- **3D theme colors (21-03):** Warm yellow (#fef3c7) light mode, cool blue-gray (#4a5568) dark mode
- **80ms stagger standard (22-01):** STAGGER_GAP = 0.08, capped at 500ms max delay
- **25% viewport trigger (22-01):** VIEWPORT_AMOUNT = 0.25 for scroll animations
- **glow-gradient utility (22-01):** Primary/gold gradient glow on hover
- **Order card stagger (22-03):** 80ms with 500ms cap using staggerDelay function
- **Empty state animations (22-03):** Variant-specific icon patterns (cart floats, heart beats)
- **Cart checkout glow (22-03):** Pulsing opacity + scale for premium CTA
- **Velocity threshold 300px/s (23-01):** Distinguishes fast vs slow scroll for animation timing
- **Overlay pinning (23-01):** Header stays visible and isCollapsed=false when overlay open
- **Cmd/Ctrl+K capture phase (23-01):** Keyboard shortcut uses { capture: true } to fire before browser
- **MobileDrawer swipe threshold (23-03):** 100px threshold for left swipe to close
- **Drawer nav stagger (23-03):** staggerContainer80(0.15) for 80ms gap with 150ms initial delay
- **ThemeToggle in drawer header (23-03):** Placed next to close button per iOS Settings pattern
- **Keep gradients.ts (24-02):** webgl/gradients.ts still used by DynamicThemeProvider

### Research Findings

From `.planning/research/SUMMARY.md`:
- React Three Fiber 9.5.0 required for React 19 compatibility (v8.x fails)
- TailwindCSS 4 z-index fix: use `@theme { --z-index-* }` with unquoted numbers
- SSR-safe pattern: `dynamic(() => import(), { ssr: false })` + mounted check
- Single Canvas pattern to avoid WebGL context exhaustion

### Patterns Established (Phase 15-24)

- **zClass token system:** Use `zClass.popover` for dropdowns escaping parent stacking context, `zClass.modalBackdrop` for backdrop layers
- **Intra-component z-index:** Keep z-10 for elements that layer within their container (close buttons in modals)
- **Scene wrapper:** Always use `src/components/3d/Scene.tsx` for Canvas
- **Dynamic import 3D:** `dynamic(() => import('@/components/3d'), { ssr: false })`
- **useFrame animation:** delta-based rotation for frame-rate independence
- **Polymorphic component types:** Use `as = "div"` with `const Component = as as "div"` pattern for TypeScript compatibility
- **GPU tier detection:** useGPUTier hook returns shouldRender3D boolean (tier >= 2)
- **3D loader:** drei Html for DOM inside Canvas with branded spinner
- **FoodModel pattern:** GLTF + spring entrance + shouldAnimate prop
- **Hero3DCanvas pattern:** Canvas with touchAction: none, OrbitControls constraints, Environment + ContactShadows
- **OrbitControls constraints:** polar 45-82deg, azimuth +-60deg keeps food viewable from appetizing angles
- **Hero3DSection pattern:** Conditional wrapper with GPU detection and loading state
- **2D fallback pattern:** Subtle motion (float + rotate) with gradient and glow
- **3D layer integration:** ParallaxLayer speed=mid for depth effect
- **3D tilt pattern (18-01):** useMotionValue + useSpring + useTransform for physics-based mouse-tracking rotation
- **State machine button (18-01):** Type union for states, AnimatePresence for transitions, setTimeout for state progression
- **Web Audio sound effects (18-01):** Lazy-load AudioContext, track user interaction, try/catch for autoplay safety
- **Staggered scroll-reveal (18-03):** Framer Motion whileInView with 80ms delay per card, capped at 640ms
- **Cart glassmorphism (18-03):** glass-menu-card + rounded-2xl, NO 3D tilt (checkout focus)
- **FeaturedCarousel (18-02):** scroll-snap-type: x mandatory, IntersectionObserver for index, auto-scroll with permanent disable on user scroll
- **IntersectionObserver scroll spy (19-01):** rootMargin -50% 0px -50% 0px for viewport center detection
- **Scroll section wrapper (19-01):** AnimatedSection with itemVariants export for children
- **Video pause-on-exit (19-01):** useInView(ref, { amount: 0.3 }) + play()/pause() in useEffect
- **Continuous icon float (19-02):** animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }} with 4+ second duration
- **Drawing connector (19-02):** scaleX: 0 -> 1 with transformOrigin: left on whileInView
- **Carousel auto-rotation (19-02):** setInterval with isPaused state toggle on mouseEnter/Leave and focus/blur
- **Video existence check (19-04):** fetch HEAD request in useEffect, fallback to gradient if 404
- **Homepage section composition (19-04):** Hero + HowItWorks + Menu + Testimonials + CTA + Footer with scroll snap
- **motion.button pattern (20-01):** whileHover/whileTap with snappyButton spring
- **motion.input pattern (20-01):** animate boxShadow based on focus + variant state
- **AnimatedToggle pattern (20-01):** spring.bouncyToggle for knob translation
- **Framer Motion type fix (20-01):** Omit onDrag/onDragEnd/onDragStart/onAnimationStart from HTML props
- **SVG pathLength animation (20-02):** animate pathLength 0->1 for drawing effect
- **Error feedback wrapper (20-02):** component wraps children, applies shake + pulse overlay
- **useErrorShake hook (20-02):** auto-reset state pattern with setTimeout
- **QuantitySelector dual-spring (20-03):** snappy for buttons, rubbery for number display
- **AnimatedImage variants (20-03):** blur, fade, scale, blur-scale with configurable blur amount
- **LazyAnimatedImage (20-03):** next/image placeholder + animated reveal combo
- **Web Audio init pattern (20-03):** lazy AudioContext on first click/touch/keydown
- **useSoundEffect hook (20-03):** play, toggle, enable, disable with localStorage persistence
- **AnimatedImage in CardImage (20-04):** Replace next/image for blur-scale reveal on menu cards
- **AnimatedToggle replaces button (20-04):** Proper switch UX with spring physics
- **useThemeTransition hook (21-02):** View Transitions API with 300ms debounce, reduced motion fallback
- **SVG icon morph (21-02):** AnimatePresence mode="wait" with spring transition (stiffness 500, damping 25)
- **Theme toggle styling (21-02):** Border in light mode, primary glow shadow in dark mode
- **ThemeAwareLighting (21-03):** useFrame lerping for smooth 3D theme transitions
- **ContactShadows adaptive (21-03):** opacity/blur/color based on theme
- **staggerDelay function (22-01):** Uses Math.min(index * 0.08, 0.5) for consistent capping
- **OrderListAnimated (22-03):** Client wrapper for scroll-reveal on Server Component pages
- **Empty state gradient blobs (22-03):** blur-xl gradient behind icon for visual interest
- **Pulsing CTA glow (22-03):** opacity [0.4, 0.7, 0.4] + scale [1, 1.02, 1] for premium effect
- **Velocity-aware scroll (23-01):** useVelocity(scrollY) from framer-motion for physics-based velocity detection
- **getHeaderTransition helper (23-01):** isFastScroll ? { duration: 0.1 } : spring.snappy for velocity-based timing
- **MobileDrawer pattern (23-03):** useSwipeToClose with direction: "left", body scroll lock, escape key, safe area
- **HeaderNavLink multi-layer hover (23-02):** bg highlight + y:-2 lift + icon wiggle + 60% underline
- **AppHeader overlay pinning (23-02):** overlayOpen prop passed to useHeaderVisibility for menu/cart/modal states
- **Glassmorphism header (23-02):** rgba(255,255,255,0.75), blur(30px), gradient shadow with dark mode CSS override
- **CommandPalette spring (23-04):** stiffness 500, damping 30 for Linear-like entrance animation
- **Recent searches storage (23-04):** localStorage key "mms-recent-searches", max 5 items, SSR-safe hydration
- **Desktop icon order (23-05):** Theme, Search, Cart, Account (left to right)
- **Integrated header state (23-05):** All overlays (mobile menu, command palette, cart drawer) managed centrally in AppHeader
- **Avatar initials gradient (23-05):** Hash user email to pick from gradient palette for consistent avatar background
- **AppHeader/ replaces legacy header (24-02):** header.tsx, HeaderClient.tsx, HeaderServer.tsx removed
- **MobileDrawer/ replaces MobileNav (24-02):** MobileNav.tsx, NavLinks.tsx removed

### Roadmap Evolution

- Phase 23 added: Header & Nav Rebuild (2026-01-24)
- Phase 17 cancelled: 3D Hero Advanced - decision to remove 3D hero entirely (2026-01-27)
- Phase 24 added: Codebase Cleanup - remove 3D, consolidate imports, remove legacy (2026-01-27)

### Blockers/Concerns

None - all blocking issues from Phase 15 resolved.

## Session Continuity

Last session: 2026-01-27
Stopped at: Completed 24-02-PLAN.md (Remove Legacy Files)
Resume file: None
Next action: Continue Phase 24 cleanup (if more plans) or finalize v1.2

---

*Updated: 2026-01-27 - Completed 24-02-PLAN.md*
