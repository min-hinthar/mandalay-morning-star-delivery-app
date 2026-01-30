# Roadmap: Morning Star V8 UI Rewrite

## Milestones

- v1.0 MVP - Phases 1-8 (shipped 2026-01-23)
- v1.1 Tech Debt Cleanup - Phases 9-14 (shipped 2026-01-23)
- v1.2 Playful UI Overhaul - Phases 15-24 (shipped 2026-01-27)
- v1.3 Full Codebase Consolidation - Phases 25-34 (shipped 2026-01-28)
- **v1.4 Mobile Excellence & Homepage Completion** - Phases 35-39 (in progress)

## Overview

v1.4 delivers mobile stability, performance optimization, and offline resilience. The milestone prioritizes P0 crash prevention and Core Web Vitals before adding service worker caching and animation scaling. Codebase cleanup runs mid-milestone to remove dead code before offline implementation. All 49 requirements map to 5 phases with clear success criteria observable from user perspective.

## Phases

**Phase Numbering:**
- Integer phases (35-39): Planned v1.4 work
- Decimal phases (35.1, 35.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 35: Mobile Crash Prevention** - Zero crashes on mobile devices via systematic cleanup patterns
- [ ] **Phase 36: Image Optimization & LCP** - Sub-2.5s LCP with optimized image loading and CLS prevention
- [ ] **Phase 37: Codebase Cleanup** - Remove dead code and enforce directory structure
- [ ] **Phase 38: Customer Offline Support** - Service worker caching and offline menu browsing
- [ ] **Phase 39: Animation Optimization** - Device-adaptive animations and conflict resolution

## Phase Details

### Phase 35: Mobile Crash Prevention
**Goal**: Zero crashes on mobile devices through systematic cleanup of memory leaks and race conditions
**Depends on**: Phase 34 (v1.3 complete)
**Requirements**: CRASH-01, CRASH-02, CRASH-03, CRASH-04, CRASH-05, CRASH-06, CRASH-07, CRASH-08, CRASH-09, CRASH-10
**Success Criteria** (what must be TRUE):
  1. User can open/close modals repeatedly without app crash on iOS Safari
  2. User can navigate rapidly between pages without unmounted state update errors
  3. User can scroll homepage with GSAP animations without memory growth
  4. User experiences zero crashes during 10-minute session on iPhone SE
  5. User can trigger/cancel animations without AudioContext exhaustion
**Plans**: TBD

Plans:
- [ ] 35-01: TBD
- [ ] 35-02: TBD
- [ ] 35-03: TBD

### Phase 36: Image Optimization & LCP
**Goal**: Sub-2.5s Largest Contentful Paint on mobile with zero cumulative layout shift from images
**Depends on**: Phase 35
**Requirements**: IMAGE-01, IMAGE-02, IMAGE-03, IMAGE-04, IMAGE-05, IMAGE-06, IMAGE-07, IMAGE-08, IMAGE-09, IMAGE-10
**Success Criteria** (what must be TRUE):
  1. User sees hero image painted within 2.5 seconds on 4G connection
  2. User sees first 6 menu cards load without visible jank or reflow
  3. User experiences no layout shift when images load (CLS < 0.1)
  4. User on slow connection sees optimized images (quality 70, responsive sizes)
  5. Lighthouse mobile audit scores LCP < 2.5s and CLS < 0.1
**Plans**: TBD

Plans:
- [ ] 36-01: TBD
- [ ] 36-02: TBD

### Phase 37: Codebase Cleanup
**Goal**: Remove dead code and establish directory structure enforcement
**Depends on**: Phase 35 (can run parallel with Phase 36)
**Requirements**: REFACTOR-01, REFACTOR-02, REFACTOR-03, REFACTOR-04, REFACTOR-05, REFACTOR-06, REFACTOR-07, REFACTOR-08
**Success Criteria** (what must be TRUE):
  1. Build succeeds with no imports from deleted files
  2. All component files are under 400 lines
  3. No circular dependencies detected in import graph
  4. ESLint fails if deleted directories are recreated
  5. Barrel exports match existing files (no dangling exports)
**Plans**: TBD

Plans:
- [ ] 37-01: TBD
- [ ] 37-02: TBD

### Phase 38: Customer Offline Support
**Goal**: Customers can browse menu and see cached content when offline
**Depends on**: Phase 36, Phase 37
**Requirements**: OFFLINE-01, OFFLINE-02, OFFLINE-03, OFFLINE-04, OFFLINE-05, OFFLINE-06, OFFLINE-07, OFFLINE-08, OFFLINE-09, OFFLINE-10, OFFLINE-11, OFFLINE-12
**Success Criteria** (what must be TRUE):
  1. User sees OfflineIndicator banner when network disconnected
  2. User can browse cached menu data when offline
  3. User sees "stale" indicator on cached content
  4. User is prompted to refresh when new service worker available
  5. User's images load from cache without network request after first visit
**Plans**: TBD

Plans:
- [ ] 38-01: TBD
- [ ] 38-02: TBD
- [ ] 38-03: TBD

### Phase 39: Animation Optimization
**Goal**: Device-adaptive animations that scale based on hardware capability
**Depends on**: Phase 38
**Requirements**: ANIM-01, ANIM-02, ANIM-03, ANIM-04, ANIM-05, ANIM-06, ANIM-07, ANIM-08, ANIM-09
**Success Criteria** (what must be TRUE):
  1. User on low-power device sees simplified animations (no parallax, no stagger)
  2. User on high-power device sees full animation experience
  3. User adding item to cart sees immediate feedback (optimistic UI)
  4. User experiences no stutter from GSAP/Framer Motion conflicts
  5. All AnimatePresence components have direct keyed children (no Fragments)
**Plans**: TBD

Plans:
- [ ] 39-01: TBD
- [ ] 39-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 35 -> 35.1 -> 36 -> 37 -> 38 -> 39

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 35. Mobile Crash Prevention | v1.4 | 0/3 | Not started | - |
| 36. Image Optimization & LCP | v1.4 | 0/2 | Not started | - |
| 37. Codebase Cleanup | v1.4 | 0/2 | Not started | - |
| 38. Customer Offline Support | v1.4 | 0/3 | Not started | - |
| 39. Animation Optimization | v1.4 | 0/2 | Not started | - |

---

<details>
<summary>v1.3 Full Codebase Consolidation (Phases 25-34) - SHIPPED 2026-01-28</summary>

### Phase 25: Foundation & Research
**Goal**: Research phase domain and establish foundation
**Plans**: 1 plan - Complete

### Phase 26: Design Token Migration
**Goal**: Migrate all hardcoded colors to semantic tokens
**Plans**: 8 plans - Complete

### Phase 27: Component Consolidation
**Goal**: Merge ui-v8/ into ui/, eliminate duplicates
**Plans**: 6 plans - Complete

### Phase 28: Hero Redesign
**Goal**: Floating emojis, parallax, theme-aware gradients
**Plans**: 3 plans - Complete

### Phase 29: Mobile Stability
**Goal**: Touch-only devices use fallback animations
**Plans**: 6 plans - Complete

### Phase 30: Directory Consolidation
**Goal**: Delete design-system/ and contexts/ directories
**Plans**: 2 plans - Complete

### Phase 31: Quality Infrastructure
**Goal**: Storybook docs, contrast tests, pre-commit hooks
**Plans**: 5 plans - Complete

### Phase 32: ESLint Guards
**Goal**: Prevent recreation of deleted directories
**Plans**: 3 plans - Complete

### Phase 33: Token Documentation
**Goal**: 7 MDX files documenting design tokens
**Plans**: 11 plans - Complete

### Phase 34: Final Cleanup
**Goal**: Complete token enforcement, ship milestone
**Plans**: 8 plans - Complete

</details>

<details>
<summary>v1.2 Playful UI Overhaul (Phases 15-24) - SHIPPED 2026-01-27</summary>

See MILESTONES.md for details.

</details>

<details>
<summary>v1.1 Tech Debt Cleanup (Phases 9-14) - SHIPPED 2026-01-23</summary>

See MILESTONES.md for details.

</details>

<details>
<summary>v1.0 MVP (Phases 1-8) - SHIPPED 2026-01-23</summary>

See MILESTONES.md for details.

</details>

---

## Coverage Validation

| Category | Requirements | Phase | Count |
|----------|--------------|-------|-------|
| Mobile Crash Prevention | CRASH-01 to CRASH-10 | Phase 35 | 10 |
| Image Optimization & LCP | IMAGE-01 to IMAGE-10 | Phase 36 | 10 |
| Codebase Refactoring | REFACTOR-01 to REFACTOR-08 | Phase 37 | 8 |
| Customer Offline Support | OFFLINE-01 to OFFLINE-12 | Phase 38 | 12 |
| Animation Optimization | ANIM-01 to ANIM-09 | Phase 39 | 9 |
| **Total** | | | **49** |

All 49 v1.4 requirements mapped. No orphans.

---

*Created: 2026-01-30*
*Milestone: v1.4 Mobile Excellence & Homepage Completion*
