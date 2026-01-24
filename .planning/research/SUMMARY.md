# Project Research Summary

**Project:** Morning Star Delivery App - v1.2 Playful UI Overhaul
**Domain:** Food Delivery App with 3D Hero + Enhanced Micro-interactions
**Researched:** 2026-01-23
**Confidence:** HIGH

## Executive Summary

The v1.2 milestone adds 3D interactive hero with Three.js/React Three Fiber to an existing Next.js 15/React 19/TailwindCSS 4 food delivery app with mature animation infrastructure (GSAP 3.14.2, Framer Motion 12.26.1). Research identifies three technical additions: React Three Fiber 9.5.0 for WebGL rendering, TailwindCSS 4 CSS-first z-index configuration fix, and architectural patterns for 3D/2D animation coexistence.

The recommended approach uses a fixed background Canvas with scrollable DOM content overlaid, coordinated through shared Zustand state. GSAP ScrollTrigger drives 3D camera movement via useFrame sync pattern, while Framer Motion handles 2D component interactions. Critical to success: SSR-safe dynamic imports with mounted checks, WebGL context cleanup on unmount, and numeric-only TailwindCSS z-index classes.

Key risks center on TailwindCSS 4's breaking change (custom zIndex config no longer generates utilities) and React 19/R3F compatibility (requires @react-three/fiber@9.x, not 8.x). Both are documented, preventable with verification steps before implementation. Performance mitigation uses GPU tier detection, lazy loading, and single Canvas pattern to avoid context exhaustion.

## Key Findings

### Recommended Stack

Three.js ecosystem integrates cleanly with existing stack. No conflicts with GSAP/Framer Motion — libraries serve complementary roles (3D vs 2D, timeline vs springs).

**Core technologies:**
- **React Three Fiber 9.5.0**: React renderer for Three.js with React 19 compatibility (v8.x incompatible)
- **@react-three/drei 10.7.7**: Helper components (Stage, Environment, useGLTF, OrbitControls) reducing boilerplate
- **three 0.182.0**: Core WebGL library (~600KB gzipped, lazy-loaded to avoid LCP impact)
- **TailwindCSS 4 @theme z-index**: CSS-first `--z-index-*` namespace required for custom z-index utilities

**Version compatibility verified:**
- React 19.2.3 within R3F peer dependency range `>=19 <19.3`
- GSAP integration pattern established (timeline + useFrame seek, not react-spring)
- No new theme dependencies (existing next-themes + CSS tokens sufficient)

### Expected Features

Research identifies table stakes (3D rendering, user interaction, mobile fallback), competitive differentiators (physics-based drag, auto-rotate), and explicit anti-features (full 3D environments, VR/AR, 3D menu browsing).

**Must have (table stakes):**
- 3D food model rendering with GLTF/GLB loader
- Rotate on drag/touch with OrbitControls (Y-axis constrained)
- Lighting setup (3-point or Stage component for appetizing food appearance)
- Loading state for 3D assets (Suspense + skeleton)
- Mobile performance fallback (GPU tier detection, 2D alternative for Tier 0/1 devices)
- Reduced motion support (disable auto-rotate, simplify interactions)
- Button press compression, input focus glow, toggle switch bounce (apply existing motion tokens consistently)
- Animated theme toggle (upgrade from basic icon swap)

**Should have (competitive):**
- Auto-rotate idle animation (slow 0.5 deg/frame showcase)
- Physics-based interaction (drag with momentum, spring back)
- Theme transition effect (smooth fade vs jarring snap)
- 3D tilt on menu cards (CSS perspective + mouse track)
- Branded loading spinner (bowl/chopsticks/star, not generic)

**Defer (v2+):**
- Multiple food model carousel (3-4 dishes swipeable)
- Depth of field / postprocessing (performance risk, GPU intensive)
- Circular reveal theme transition (Telegram-style, complex)
- Environment reflections (polish if time permits)
- Particle effects on 3D interaction (celebration burst)

**Anti-features (do NOT build):**
- Full 3D scene/environment (performance killer)
- 3D menu browsing (gimmicky, slower than 2D grid)
- VR/AR integration (scope creep, minimal user value)
- Heavy post-processing (bloom, SSAO — GPU intensive)
- Auto-playing 3D on mobile (battery drain, data usage)

### Architecture Approach

Portal-first overlay system with strict z-index token enforcement prevents the 50+ hardcoded z-index conflicts documented in ERROR_HISTORY.md. 3D integrates via fixed background Canvas with DOM content layered above using `z-0` base vs `-z-10` 3D positioning.

**Major components:**
1. **OverlayProvider** — Centralized portal root, auto-closes overlays on route change, sorts by z-index
2. **Token System** — Single source z-index scale (base:0, dropdown:10, sticky:20, fixed:30, modal:50, tooltip:70, toast:80, max:100), motion presets (Framer springs + GSAP timelines), theme variables
3. **3D Canvas Layer** — Fixed background (-z-10), dynamic import with ssr:false, GPU tier detection + 2D fallback, single Canvas to avoid WebGL context exhaustion
4. **Animation Coordination** — GSAP ScrollTrigger drives 3D via Zustand store → useFrame sync, Framer Motion for 2D UI interactions, separation of concerns (no Framer layout on Canvas container)

**Dependency boundaries:**
- Tokens import nothing
- Primitives import tokens only
- 3D components use tokens + shared state (Zustand), avoid direct Organism imports
- SSR-safe pattern: dynamic import + mounted state check (matches existing Portal.tsx)

### Critical Pitfalls

1. **TailwindCSS 4 z-index Config Ignored** — Custom `zIndex` values in `tailwind.config.ts` do NOT generate utility classes. Classes like `z-modal`, `z-fixed` silently fail (no CSS, no warnings). Use numeric classes (`z-30`, `z-50`) or `@theme { --z-index-modal: 50 }` with unquoted numbers. Verified in ERROR_HISTORY.md 2026-01-23/24.

2. **React 19 + R3F Version Mismatch** — @react-three/fiber@8.x throws `Cannot read properties of undefined (reading 'ReactCurrentOwner')` with React 19. Requires @react-three/fiber@9.x for React 19 internals (`__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`). Verify before starting 3D work.

3. **SSR/Hydration Errors** — Three.js requires browser APIs (window, WebGL). Next.js SSR crashes with `ReferenceError: window is not defined` unless using `dynamic(() => import(), { ssr: false })` + mounted state check. No module-level Three.js imports in Server Components.

4. **WebGL Context Exhaustion** — Browser limit of ~8-16 concurrent WebGL contexts. Multiple Canvas components or missing cleanup causes "WebGL context lost" after navigation. Use single Canvas pattern, dispose geometry/materials on unmount, force context loss on cleanup.

5. **CSS 3D Transforms Break Z-Index** — `transform-style: preserve-3d` or `perspective` creates separate stacking context where z-index doesn't work across 3D/2D boundaries. Dropdowns/modals trapped behind 3D elements. Solution: portal overlays to body level (escape 3D context), use `translateZ()` for 3D stacking instead of z-index.

6. **Radix Dropdown Event Swallowing** — Forms inside DropdownMenuItem, `event.preventDefault()` in onSelect, or caught NEXT_REDIRECT errors cause signout/delete actions to fail silently. Use existing DropdownAction component pattern (documented in ERROR_HISTORY.md 2026-01-18).

## Implications for Roadmap

Based on research, suggested 3-phase structure prioritizing foundation (z-index fix, R3F setup) before features (3D hero, micro-interactions) before polish (theme, performance).

### Phase 1: Foundation & Z-Index Fix
**Rationale:** TailwindCSS 4 z-index bug blocks all overlay work. R3F setup required before any 3D components. Both are prerequisites with no feature dependencies.

**Delivers:**
- TailwindCSS 4 z-index tokens via CSS `@theme` directive
- zClass helper returning numeric Tailwind classes
- React Three Fiber 9.5.0 + drei installed, verified compatible with React 19
- SSR-safe dynamic import pattern established
- Basic Scene.tsx wrapper with mounted check

**Addresses:**
- Pitfall 1 (z-index config ignored)
- Pitfall 2 (R3F version mismatch)
- Pitfall 3 (SSR crashes)
- Existing signout button bug (z-index conflict)

**Critical actions:**
- Add `@theme { --z-index-* }` to globals.css with unquoted numbers
- Audit all z-index usage, replace custom tokens with numeric classes
- Run `pnpm build && grep "z-modal" .next/static/css/*.css` to verify utilities exist
- Install `pnpm add three @react-three/fiber @react-three/drei`
- Verify versions: `pnpm ls react @react-three/fiber` (expect React 19.2.3, R3F 9.5.0)

**Research flag:** Standard patterns, skip research-phase (TailwindCSS docs + codebase ERROR_HISTORY sufficient)

---

### Phase 2: 3D Hero + Micro-interactions
**Rationale:** 3D hero is milestone centerpiece, enables testing of stack integration. Micro-interaction audit applies existing motion tokens consistently. Both use Phase 1 foundation.

**Delivers:**
- Hero3DCanvas component with fixed background positioning
- Single 3D food model (GLTF) with OrbitControls
- Auto-rotate idle animation
- GPU tier detection + 2D fallback for low-end devices
- GSAP ScrollTrigger → 3D camera sync via Zustand
- Consistent button/input/toggle animations using existing motion tokens
- Branded loading spinner (bowl/chopsticks/star)

**Addresses:**
- 3D interactive hero requirement (table stakes)
- Maximum playfulness goal (micro-interaction consistency)
- Mobile performance (GPU tier fallback)

**Uses:**
- React Three Fiber Scene wrapper (Phase 1)
- zClass tokens for Canvas positioning (Phase 1)
- Existing motion-tokens.ts springs
- Existing useAnimationPreference for reduced motion

**Avoids:**
- Pitfall 4 (WebGL context exhaustion) — single Canvas pattern
- Pitfall 7 (performance) — no state in useFrame, useMemo geometries
- Pitfall 9 (asset blocking) — lazy load, Suspense, compress GLTF

**Research flag:** May need research-phase for GLTF model sourcing/creation if no existing assets

---

### Phase 3: Theme Polish + Performance
**Rationale:** Theme refinement and performance optimization depend on 3D/2D integration from Phase 2. Final polish after core features working.

**Delivers:**
- Animated theme toggle (icon morph with Framer Motion)
- Smooth theme transition (fade, not jarring snap)
- Dark mode color token review (light mode footer text visibility)
- 3D scene lighting adapts to theme (warmer in dark mode)
- Asset compression (gltf-transform optimization)
- Loading state polish (progress indicator, skeleton shimmer)
- Performance profiling and mobile testing

**Addresses:**
- Theme refinement requirement
- Light/dark mode polish
- Performance targets (60fps, <2s model load)

**Avoids:**
- Pitfall 8 (light mode text visibility) — explicit theme-aware color tokens
- Pitfall 10 (Framer/R3F conflicts) — clear separation (Framer for UI, R3F for 3D)

**Research flag:** Standard patterns, skip research-phase (existing next-themes + CSS tokens sufficient)

---

### Phase Ordering Rationale

- **Phase 1 first:** TailwindCSS 4 bug affects all components (modals, dropdowns, header). R3F version mismatch crashes app. Both are showstoppers requiring immediate resolution.
- **Phase 2 second:** 3D hero is milestone deliverable. Micro-interactions use Phase 1 tokens. Testing phase verifies stack integration, uncovers edge cases before polish phase.
- **Phase 3 last:** Theme polish and performance optimization require working 3D/2D integration. Asset compression depends on final model selection. Performance profiling needs real usage patterns.

**Dependency flow:**
```
Phase 1 (Foundation)
    |
    +-- z-index tokens → Phase 2 (Canvas positioning) → Phase 3 (Modal/overlay layering)
    +-- R3F setup → Phase 2 (Hero3D) → Phase 3 (Performance tuning)
    +-- SSR pattern → Phase 2 (Scene.tsx) → Phase 3 (Asset loading)

Phase 2 (Features)
    |
    +-- 3D hero → Phase 3 (Theme-aware lighting, compression)
    +-- Motion tokens → Phase 3 (Theme toggle animation)
```

### Research Flags

**Needs research:**
- **Phase 2 (conditional):** If no GLTF food models exist, need `/gsd:research-phase` for 3D asset sourcing (marketplace vs custom modeling, Blender pipeline, optimization)

**Standard patterns (skip research):**
- **Phase 1:** TailwindCSS 4 z-index solution documented in STACK.md + ERROR_HISTORY.md
- **Phase 2:** R3F integration patterns documented in ARCHITECTURE.md, existing GSAP/Framer patterns reusable
- **Phase 3:** Theme system (next-themes + CSS tokens) already established, performance profiling standard tools (Chrome DevTools, Lighthouse)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm info confirms React 19.2.3 compatibility with R3F 9.5.0. TailwindCSS 4 z-index fix verified in GitHub discussion #18031 + codebase ERROR_HISTORY.md. |
| Features | HIGH | Feature expectations derived from authoritative sources (Motion.dev, R3F docs, Codrops). Table stakes vs differentiators validated against food delivery UX patterns. |
| Architecture | HIGH | Portal/overlay pattern verified against codebase (Portal.tsx exists). 3D integration pattern sourced from pmndrs/react-three-next starter + Motion.dev R3F docs. |
| Pitfalls | HIGH | Critical pitfalls 1, 4, 6 documented in codebase ERROR_HISTORY.md. Pitfalls 2, 3, 5 verified in official issue trackers (Next.js #71836, TailwindCSS #18031, MDN stacking context). |

**Overall confidence:** HIGH

### Gaps to Address

**3D asset pipeline:** Research does not specify GLTF model source (marketplace vs custom). Address during Phase 2 planning:
- Check if design team provides models
- If not, evaluate marketplace (Sketchfab, TurboSquid) vs Blender custom modeling
- Establish optimization workflow (gltf-transform, Draco compression)

**Performance targets:** Research suggests targets (60fps, <2s load) but lacks device-specific benchmarks. Validate during Phase 3:
- Profile on target devices (iPhone 12, Galaxy A series, low-end Android)
- Establish fallback trigger thresholds (GPU tier, FPS regression)

**Theme transition complexity:** Circular reveal (Telegram-style) deferred to post-v1.2 but fade transition not fully specified. Clarify during Phase 3:
- View Transitions API browser support check
- Fallback strategy for unsupported browsers
- Animation duration and easing preferences

## Sources

### Primary (HIGH confidence)
- [React Three Fiber Installation](https://r3f.docs.pmnd.rs/getting-started/installation) — React 19 compatibility, peer dependencies
- [TailwindCSS 4 z-index Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/18031) — `--z-index-*` namespace requirement
- [Motion.dev React Three Fiber Docs](https://motion.dev/docs/react-three-fiber) — Framer Motion 3D integration
- Codebase ERROR_HISTORY.md (2026-01-18, 2026-01-23, 2026-01-24) — z-index bug, Radix dropdown issue, verification
- Codebase LEARNINGS.md (2026-01-23) — TailwindCSS 4 patterns

### Secondary (MEDIUM confidence)
- [R3F Performance Pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls) — useFrame state updates, object creation
- [Next.js 15 + R3F Issue #71836](https://github.com/vercel/next.js/issues/71836) — React 19 internals compatibility
- [Codrops: Cinematic 3D Scroll with GSAP](https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/) — ScrollTrigger + Three.js patterns
- [drei GitHub Releases](https://github.com/pmndrs/drei/releases) — React 19 compatibility timeline
- [pmndrs/react-three-next Starter](https://github.com/pmndrs/react-three-next) — Next.js SSR patterns

### Tertiary (LOW confidence)
- [Web Design Trends 2026](https://www.index.dev/blog/web-design-trends) — 3D hero trend validation (directional, not prescriptive)
- [Food Delivery UX 2025](https://medium.com/@prajapatisuketu/food-delivery-app-ui-ux-design-in-2025-trends-principles-best-practices-4eddc91ebaee) — Micro-interaction patterns (community opinion)

---
*Research completed: 2026-01-23*
*Ready for roadmap: yes*
