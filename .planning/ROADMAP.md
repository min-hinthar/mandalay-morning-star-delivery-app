# Roadmap: Morning Star Delivery App

## Milestones

- v1.0 MVP - Phases 1-8 (shipped 2026-01-23)
- v1.1 Tech Debt - Phases 9-14 (shipped 2026-01-23)
- **v1.2 Playful UI Overhaul** - Phases 15-23 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-8) - SHIPPED 2026-01-23</summary>

See `.planning/milestones/v1-ROADMAP.md` for archived phase details.

</details>

<details>
<summary>v1.1 Tech Debt (Phases 9-14) - SHIPPED 2026-01-23</summary>

See `.planning/milestones/v1.1-ROADMAP.md` for archived phase details.

</details>

### v1.2 Playful UI Overhaul (In Progress)

**Milestone Goal:** Transform customer pages with maximum playfulness - 3D interactive hero, unified menu design, theme refinement, and delightful micro-interactions throughout.

**Overview:** Nine phases delivering the playful UI overhaul. Foundation phase fixes TailwindCSS 4 z-index blocking bug and establishes React Three Fiber. Then 3D hero in two phases (core + advanced). Menu unification creates consistent card design. Homepage redesign integrates everything. Micro-interactions add delight across all components. Theme refinements polish light/dark modes. Customer page polish ensures consistent playfulness everywhere. Header & nav rebuild completes the overhaul with modern navigation.

- [x] **Phase 15: Foundation & R3F Setup** - Fix z-index bug, install React Three Fiber ✓
- [x] **Phase 16: 3D Hero Core** - Basic 3D food model with controls ✓
- [ ] **Phase 17: 3D Hero Advanced** - Auto-rotate, physics, carousel, particles
- [x] **Phase 18: Menu Unification** - Unified MenuItemCard across all surfaces ✓
- [x] **Phase 19: Homepage Redesign** - Video hero, scroll choreography, section redesign ✓
- [ ] **Phase 20: Micro-interactions** - Consistent animations across all components
- [ ] **Phase 21: Theme Refinements** - Light/dark polish, animated toggle
- [ ] **Phase 22: Customer Page Polish** - Enhanced animations on all customer pages
- [ ] **Phase 23: Header & Nav Rebuild** - Complete rebuild of header and navigation

## Phase Details

### Phase 15: Foundation & R3F Setup
**Goal**: Fix TailwindCSS 4 z-index blocking bug and establish React Three Fiber foundation for 3D work
**Depends on**: Nothing (first phase of v1.2)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. All overlay components (modals, dropdowns, tooltips) are clickable - no z-index conflicts
  2. Signout button click registers and logs user out successfully
  3. `import { Canvas } from '@react-three/fiber'` works without SSR errors
  4. Basic 3D scene renders in browser (test page with rotating cube)
**Plans**: 2 plans

Plans:
- [x] 15-01-PLAN.md — Z-index token migration (fix dropdown, migrate overlays) ✓
- [x] 15-02-PLAN.md — R3F installation and SSR-safe Scene wrapper ✓

---

### Phase 16: 3D Hero Core
**Goal**: User can see and interact with 3D food model in hero section
**Depends on**: Phase 15 (R3F foundation)
**Requirements**: HERO3D-01, HERO3D-02, HERO3D-03, HERO3D-04, HERO3D-05, HERO3D-06, HERO3D-07
**Success Criteria** (what must be TRUE):
  1. User sees 3D food model in homepage hero section
  2. User can rotate model by dragging/touch
  3. User can zoom model with pinch/scroll (within limits)
  4. Loading spinner shows while 3D assets load
  5. Low-end mobile devices show 2D fallback image instead of 3D
**Plans**: 4 plans (3 core + 1 gap closure)

Plans:
- [x] 16-01-PLAN.md — Infrastructure: GPU detection hook, branded loader, dependencies ✓
- [x] 16-02-PLAN.md — 3D Scene: Hero3DCanvas with FoodModel, OrbitControls, lighting ✓
- [x] 16-03-PLAN.md — Integration: Hero3DSection (3D/2D switch), Hero.tsx integration ✓
- [x] 16-04-PLAN.md — Gap closure: Source real GLB model and 2D fallback image ✓

---

### Phase 17: 3D Hero Advanced
**Goal**: 3D hero feels alive with auto-rotation, physics, carousel, and particle effects
**Depends on**: Phase 16 (3D Hero Core)
**Requirements**: HERO3D-08, HERO3D-09, HERO3D-10, HERO3D-11
**Success Criteria** (what must be TRUE):
  1. Model auto-rotates slowly when user is not interacting
  2. Drag interaction has momentum and springs back naturally
  3. User can swipe between multiple food models in carousel
  4. Particles emit when user interacts with 3D model
**Plans**: 2 plans

Plans:
- [ ] 17-01-PLAN.md — Auto-rotation and physics-based momentum
- [ ] 17-02-PLAN.md — Food carousel with particles

---

### Phase 18: Menu Unification
**Goal**: Consistent MenuItemCard design used everywhere menu items appear
**Depends on**: Nothing (can run parallel with 3D work)
**Requirements**: MENU-01, MENU-02, MENU-03, MENU-04, MENU-05
**Success Criteria** (what must be TRUE):
  1. New unified MenuItemCard component exists with consistent design
  2. Homepage menu section uses unified card
  3. Menu page uses unified card
  4. Cart items use unified card style
  5. Menu cards have 3D tilt effect on hover
**Plans**: 3 plans

Plans:
- [x] 18-01-PLAN.md — UnifiedMenuItemCard component with glassmorphism, 3D tilt, shine effect ✓
- [x] 18-02-PLAN.md — FeaturedCarousel and homepage integration ✓
- [x] 18-03-PLAN.md — Menu page and cart integration ✓

---

### Phase 19: Homepage Redesign
**Goal**: Homepage showcases video hero and has enhanced scroll animations in all sections
**Depends on**: Phase 16 (3D Hero Core), Phase 18 (Menu Unification)
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, HOME-06
**Success Criteria** (what must be TRUE):
  1. Hero section displays video hero with dark cinematic mood
  2. How It Works section integrates Coverage as step 1, has step animations
  3. Menu section uses unified MenuItemCard design
  4. Testimonials section has auto-rotating carousel
  5. All sections have consistent scroll choreography (parallax + stagger)
  6. Section navigation dots show on desktop with click-to-jump
**Plans**: 4 plans

Plans:
- [x] 19-01-PLAN.md — Video hero component + scroll choreography infrastructure ✓
- [x] 19-02-PLAN.md — How It Works section (merged Coverage) + Testimonials carousel ✓
- [x] 19-03-PLAN.md — CTA Banner + Footer animations ✓
- [x] 19-04-PLAN.md — Homepage integration + section nav dots + scroll snap ✓

---

### Phase 20: Micro-interactions
**Goal**: Every interactive element has delightful, consistent micro-animations
**Depends on**: Phase 15 (uses motion tokens from foundation)
**Requirements**: MICRO-01, MICRO-02, MICRO-03, MICRO-04, MICRO-05, MICRO-06, MICRO-07, MICRO-08, MICRO-09, MICRO-10, MICRO-11, MICRO-12
**Success Criteria** (what must be TRUE):
  1. All buttons compress on press with consistent animation
  2. All inputs glow/pulse on focus
  3. Toggle switches bounce on change
  4. Branded loading spinner (bowl/chopsticks/star) replaces generic spinners
  5. Success checkmarks draw in, error states shake
  6. Skeleton loading has premium shimmer effect
  7. Quantity selectors have rubbery spring overshoot
  8. Favorite heart toggle has particle burst effect
**Plans**: 4 plans (3 core + 1 gap closure)

Plans:
- [x] 20-01-PLAN.md — Button/input/toggle animations with motion token extensions ✓
- [x] 20-02-PLAN.md — Branded spinner, error shake, checkbox animations ✓
- [x] 20-03-PLAN.md — Quantity selector rubbery spring, animated image, sound effects ✓
- [ ] 20-04-PLAN.md — Gap closure: Wire orphaned components (BrandedSpinner, AnimatedToggle, ErrorShake, AnimatedImage)

---

### Phase 21: Theme Refinements
**Goal**: Light and dark modes are polished with smooth transitions
**Depends on**: Phase 16 (3D scene lighting adapts to theme)
**Requirements**: THEME-01, THEME-02, THEME-03, THEME-04, THEME-05, THEME-06
**Success Criteria** (what must be TRUE):
  1. Footer text is readable in light mode (not white on light)
  2. Dark mode surfaces have refined colors (not just inverted)
  3. Theme toggle animates sun/moon icon morph
  4. Theme switch has smooth circular reveal transition
  5. 3D scene lighting adapts to light/dark theme
**Plans**: TBD

Plans:
- [ ] 21-01: TBD (color token fixes)
- [ ] 21-02: TBD (animated theme toggle and transition)

---

### Phase 22: Customer Page Polish
**Goal**: All customer pages feel consistently playful with enhanced animations
**Depends on**: Phase 20 (micro-interactions applied), Phase 21 (theme consistent)
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05
**Success Criteria** (what must be TRUE):
  1. Menu page has engaging entry animations for items
  2. Checkout pages have smooth step transitions and form animations
  3. Order history page has list reveal animations
  4. Account page has section animations
  5. All customer pages feel cohesively playful (consistent timing, easing)
**Plans**: TBD

Plans:
- [ ] 22-01: TBD (menu and checkout animations)
- [ ] 22-02: TBD (account and order history animations)

---

### Phase 23: Header & Nav Rebuild
**Goal**: Complete rebuild of header and navigation with modern design and interactions
**Depends on**: Phase 20 (micro-interactions), Phase 21 (theme refinements)
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. Header has new modern design matching playful UI aesthetic
  2. Navigation is rebuilt with improved UX
  3. Mobile nav drawer has smooth animations
  4. All nav interactions feel consistent with micro-interaction patterns
  5. Theme toggle integrated seamlessly
**Plans**: TBD

Plans:
- [ ] 23-01: TBD (run /gsd:plan-phase 23 to break down)

---

## Progress

**Execution Order:**
Phases execute in numeric order: 15 -> 16 -> 17 -> 18 -> 19 -> 20 -> 21 -> 22 -> 23
Note: Phase 18 can run parallel with Phases 16-17 (no dependencies)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 15. Foundation & R3F Setup | v1.2 | 2/2 | Complete | 2026-01-23 |
| 16. 3D Hero Core | v1.2 | 4/4 | Complete | 2026-01-24 |
| 17. 3D Hero Advanced | v1.2 | 0/2 | Not started | - |
| 18. Menu Unification | v1.2 | 3/3 | Complete | 2026-01-24 |
| 19. Homepage Redesign | v1.2 | 4/4 | Complete | 2026-01-25 |
| 20. Micro-interactions | v1.2 | 3/4 | In progress | - |
| 21. Theme Refinements | v1.2 | 0/2 | Not started | - |
| 22. Customer Page Polish | v1.2 | 0/2 | Not started | - |
| 23. Header & Nav Rebuild | v1.2 | 0/1 | Not started | - |

**v1.2 Totals:** 9 phases, ~24 plans, 48+ requirements

---
*Roadmap created: 2026-01-23*
*Last updated: 2026-01-26 - Phase 20 gap closure plan added (20-04)*
