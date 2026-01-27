# Roadmap: Morning Star v1.3 Full Codebase Consolidation

## Milestones

- ✅ **v1.0 MVP** - Phases 1-8 (shipped 2026-01-23)
- ✅ **v1.1 Tech Debt** - Phases 9-14 (shipped 2026-01-23)
- ✅ **v1.2 Playful UI Overhaul** - Phases 15-24 (shipped 2026-01-27)
- 🚧 **v1.3 Full Codebase Consolidation** - Phases 25-33 (in progress)

## Overview

Systematic consolidation of the codebase: merge overlapping component systems, enforce design tokens across all 70+ files with hardcoded values, fix mobile 3D tilt bugs, and redesign the hero section with floating emojis and parallax. Research identified 221 hardcoded color violations and 6 duplicate components. This milestone makes the codebase maintainable and the hero memorable.

## Phases

**Phase Numbering:**
- Continues from v1.2 (Phase 24 complete)
- v1.3 starts at Phase 25

- [x] **Phase 25: Audit Infrastructure** - Establish baseline metrics and automated detection
- [x] **Phase 26: Component Consolidation** - Merge ui-v8 into ui, clean V7 remnants
- [ ] **Phase 27: Token Enforcement - Colors** - Replace all hardcoded colors with semantic tokens
- [ ] **Phase 28: Token Enforcement - Layout** - Standardize spacing, typography, border-radius
- [ ] **Phase 29: Token Enforcement - Effects** - Standardize shadows, blur, motion durations
- [ ] **Phase 30: Mobile Stability** - Fix 3D tilt on touch devices
- [ ] **Phase 31: Hero Redesign** - Floating emojis, parallax, theme-aware gradients
- [ ] **Phase 32: Quality Assurance** - Documentation, testing, regression prevention
- [ ] **Phase 33: Full Components Consolidation** - Merge all component subdirectories, eliminate duplicates

## Phase Details

### Phase 25: Audit Infrastructure
**Goal**: Complete violation inventory and automated detection tooling in place
**Depends on**: Nothing (first phase of v1.3)
**Requirements**: TOKN-16, TOKN-17
**Success Criteria** (what must be TRUE):
  1. Audit script outputs complete list of hardcoded color violations with file:line locations
  2. ESLint rules catch `text-white`, `text-black`, `bg-white`, `bg-black` violations
  3. Baseline violation count documented (target: reduce from 221 to 0)
  4. Script detects regression if new violations introduced
**Plans**: 1 plan

Plans:
- [x] 25-01-PLAN.md — Comprehensive audit script + ESLint rules + baseline report

### Phase 26: Component Consolidation
**Goal**: Single unified component library with clean public API
**Depends on**: Phase 25
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06
**Success Criteria** (what must be TRUE):
  1. All components import from `@/components/ui/` (no ui-v8 paths)
  2. V7 naming removed from public APIs (palettes, not v7Palettes)
  3. Single Modal, BottomSheet, Drawer implementation (no duplicates)
  4. Single Tooltip and Toast implementation
  5. No broken imports after consolidation
**Plans**: 8 plans in 4 waves

Plans:
- [x] 26-01-PLAN.md — V7 naming cleanup (palettes rename)
- [x] 26-02-PLAN.md — Migrate overlay components (Portal, Backdrop, Modal, Drawer)
- [x] 26-03-PLAN.md — Migrate Toast, Tooltip, Dropdown
- [x] 26-04-PLAN.md — Migrate cart components
- [x] 26-05-PLAN.md — Migrate menu components
- [x] 26-06-PLAN.md — Migrate navigation, scroll, transitions
- [x] 26-07-PLAN.md — Update consumer imports and barrel export
- [x] 26-08-PLAN.md — Delete ui-v8, add ESLint guard, final verification

### Phase 27: Token Enforcement - Colors
**Goal**: All color values use semantic design tokens
**Depends on**: Phase 26
**Requirements**: TOKN-01, TOKN-02, TOKN-03, TOKN-04, TOKN-05, TOKN-06
**Success Criteria** (what must be TRUE):
  1. Zero `text-white` or `text-black` in component files
  2. Zero `bg-white` or `bg-black` in component files
  3. Zero hardcoded hex colors in TSX files
  4. All gradients use theme-aware CSS variables
  5. Both light and dark themes render correctly on all pages
**Plans**: TBD

Plans:
- [ ] 27-01: High-traffic page color fixes (homepage, menu, checkout)
- [ ] 27-02: Component library color fixes
- [ ] 27-03: Admin and driver page color fixes
- [ ] 27-04: Gradient theme-awareness

### Phase 28: Token Enforcement - Layout
**Goal**: Consistent spacing, typography, and border-radius via design tokens
**Depends on**: Phase 27
**Requirements**: TOKN-07, TOKN-08, TOKN-09, TOKN-10, TOKN-11, TOKN-12
**Success Criteria** (what must be TRUE):
  1. No hardcoded pixel values for margin/padding outside Tailwind scale
  2. All font-size uses Tailwind typography scale (no px values)
  3. All font-weight uses semantic tokens (font-normal, font-medium, font-bold)
  4. Consistent border-radius using design system tokens (rounded-*)
**Plans**: TBD

Plans:
- [ ] 28-01: Spacing token enforcement
- [ ] 28-02: Typography token enforcement

### Phase 29: Token Enforcement - Effects
**Goal**: Standardized shadows, blur effects, and animation timings
**Depends on**: Phase 28
**Requirements**: TOKN-13, TOKN-14, TOKN-15
**Success Criteria** (what must be TRUE):
  1. All box-shadow uses design system shadow tokens
  2. All backdrop-blur uses consistent values via tokens
  3. All transition/animation durations reference motion tokens
**Plans**: TBD

Plans:
- [ ] 29-01: Shadow and blur standardization
- [ ] 29-02: Motion timing standardization

### Phase 30: Mobile Stability
**Goal**: 3D tilt effects work reliably on touch devices
**Depends on**: Phase 29
**Requirements**: MOBL-01, MOBL-02, MOBL-03
**Success Criteria** (what must be TRUE):
  1. 3D tilt disabled on touch devices (via CSS `hover: hover` and `pointer: fine`)
  2. No content clipping or disappearing on iOS Safari
  3. Card content remains visible during and after tilt interactions
**Plans**: TBD

Plans:
- [ ] 30-01: Touch device detection and tilt disable
- [ ] 30-02: Safari compositing fixes

### Phase 31: Hero Redesign
**Goal**: Memorable hero with floating emojis, parallax depth, and theme consistency
**Depends on**: Phase 30
**Requirements**: HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06, HERO-07
**Success Criteria** (what must be TRUE):
  1. Hero section fully visible on page load (no mascot cutoff)
  2. Floating food emojis animate with staggered CSS keyframes
  3. Multi-layer parallax responds to scroll (using parallaxPresets)
  4. Hero looks correct in both light and dark themes
  5. Gradient background animates on scroll
**Plans**: TBD

Plans:
- [ ] 31-01: Hero layout and visibility fixes
- [ ] 31-02: Floating emoji system
- [ ] 31-03: Parallax scroll implementation
- [ ] 31-04: Theme-aware gradient animation

### Phase 32: Quality Assurance
**Goal**: Documentation complete and regression tests prevent future violations
**Depends on**: Phase 31
**Requirements**: TOKN-18, QUAL-01, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. Token documentation with visual examples exists for each category
  2. All consolidated components tested in both light and dark modes
  3. ESLint z-index rule enforced at error level (no hardcoded values)
  4. Visual regression tests pass for hero and consolidated components
**Plans**: TBD

Plans:
- [ ] 32-01: Token documentation with examples
- [ ] 32-02: Theme mode testing
- [ ] 32-03: Visual regression test updates

### Phase 33: Full Components Consolidation
**Goal**: Single organized component structure with no duplicates across all subdirectories
**Depends on**: Phase 32
**Requirements**: COMP-07
**Success Criteria** (what must be TRUE):
  1. No duplicate components between directories (menu/ vs ui/menu/, scroll/ vs ui/scroll/)
  2. layout/ and layouts/ merged into single coherent structure
  3. All loose files at components root moved to appropriate directories
  4. All consumer imports updated to canonical locations
  5. ESLint guards prevent recreation of removed directories
  6. No broken imports after consolidation
**Plans**: 11 plans in 6 waves

Plans:
- [ ] 33-01-PLAN.md — Delete knip-detected unused files (6 files)
- [ ] 33-02-PLAN.md — Merge scroll/ into ui/scroll/
- [ ] 33-03-PLAN.md — Merge menu/ into ui/menu/ (resolve duplicates)
- [ ] 33-04-PLAN.md — Merge layout/ + layouts/ into ui/layout/, create ui/search/
- [ ] 33-05-PLAN.md — Update layout consumer imports, delete old directories
- [ ] 33-06-PLAN.md — Move loose files (ThemeProvider, WebVitalsReporter)
- [ ] 33-07-PLAN.md — Move page folders (admin, checkout, driver, homepage, orders)
- [ ] 33-08-PLAN.md — Merge tracking into orders, onboarding into auth, create brand
- [ ] 33-09-PLAN.md — Merge theme/ into ui/theme/
- [ ] 33-10-PLAN.md — Add ESLint guards for all removed directories
- [ ] 33-11-PLAN.md — Update knip config, finalize barrel exports

## Progress

**Execution Order:**
Phases execute in numeric order: 25 -> 26 -> 27 -> 28 -> 29 -> 30 -> 31 -> 32 -> 33

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 25. Audit Infrastructure | v1.3 | 1/1 | Complete | 2026-01-27 |
| 26. Component Consolidation | v1.3 | 8/8 | Complete | 2026-01-27 |
| 27. Token Enforcement - Colors | v1.3 | 0/4 | Not started | - |
| 28. Token Enforcement - Layout | v1.3 | 0/2 | Not started | - |
| 29. Token Enforcement - Effects | v1.3 | 0/2 | Not started | - |
| 30. Mobile Stability | v1.3 | 0/2 | Not started | - |
| 31. Hero Redesign | v1.3 | 0/4 | Not started | - |
| 32. Quality Assurance | v1.3 | 0/3 | Not started | - |
| 33. Full Components Consolidation | v1.3 | 0/11 | Not started | - |

**v1.3 Summary:**
- Total phases: 9
- Total plans: 23+ (estimated)
- Requirements coverage: 38/38

---

<details>
<summary>✅ v1.0 MVP (Phases 1-8) - SHIPPED 2026-01-23</summary>

See archived roadmap for v1.0 details. 32 plans completed across 8 phases.

</details>

<details>
<summary>✅ v1.1 Tech Debt (Phases 9-14) - SHIPPED 2026-01-23</summary>

See archived roadmap for v1.1 details. 21 plans completed across 6 phases.

</details>

<details>
<summary>✅ v1.2 Playful UI Overhaul (Phases 15-24) - SHIPPED 2026-01-27</summary>

See archived roadmap for v1.2 details. 29 plans completed across 10 phases (Phase 17 cancelled).

</details>

---
*Roadmap created: 2026-01-27*
*Depth: comprehensive (8 phases)*
