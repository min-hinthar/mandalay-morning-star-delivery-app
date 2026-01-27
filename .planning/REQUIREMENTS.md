# Requirements: Morning Star v1.3 Full Codebase Consolidation

**Defined:** 2026-01-27
**Core Value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.

## v1.3 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Token Enforcement - Colors

- [ ] **TOKN-01**: All `text-white` replaced with semantic tokens (`text-text-inverse`, `text-hero-text`, etc.)
- [ ] **TOKN-02**: All `text-black` replaced with semantic tokens (`text-text-primary`, etc.)
- [ ] **TOKN-03**: All `bg-white` replaced with semantic tokens (`bg-surface-primary`, etc.)
- [ ] **TOKN-04**: All `bg-black` replaced with semantic tokens (`bg-surface-inverse`, etc.)
- [ ] **TOKN-05**: All hardcoded hex colors use token equivalents
- [ ] **TOKN-06**: All gradient definitions use theme-aware CSS variables

### Token Enforcement - Spacing & Layout

- [ ] **TOKN-07**: All hardcoded pixel values for spacing use Tailwind spacing scale
- [ ] **TOKN-08**: All hardcoded margin/padding use design system spacing tokens
- [ ] **TOKN-09**: Consistent border-radius using design system tokens

### Token Enforcement - Typography

- [ ] **TOKN-10**: All font-size uses Tailwind typography scale (no hardcoded px)
- [ ] **TOKN-11**: All font-weight uses semantic tokens (font-normal, font-medium, font-bold)
- [ ] **TOKN-12**: All line-height uses design system tokens

### Token Enforcement - Effects & Shadows

- [ ] **TOKN-13**: All box-shadow uses design system shadow tokens
- [ ] **TOKN-14**: All backdrop-blur uses consistent values via tokens
- [ ] **TOKN-15**: All transition/animation durations use motion tokens

### Token Enforcement - Infrastructure

- [ ] **TOKN-16**: ESLint rules extended to catch all hardcoded style violations
- [ ] **TOKN-17**: Automated audit script detects design token regressions
- [ ] **TOKN-18**: Token documentation with visual examples for each category

### Component Consolidation

- [ ] **COMP-01**: V7 naming remnants cleaned up (v7Palettes renamed to palettes, etc.)
- [ ] **COMP-02**: `ui-v8/` components merged into `ui/` directory
- [ ] **COMP-03**: All imports updated to use unified `ui/` path
- [ ] **COMP-04**: Duplicate overlay components removed (single Modal, BottomSheet, Drawer)
- [ ] **COMP-05**: Tooltip component unified (single implementation)
- [ ] **COMP-06**: Toast component unified (single implementation)

### Mobile Stability

- [ ] **MOBL-01**: 3D tilt disabled on touch devices via CSS media query `(hover: hover) and (pointer: fine)`
- [ ] **MOBL-02**: CSS backface-visibility fixes applied for Safari (`-webkit-backface-visibility: hidden`)
- [ ] **MOBL-03**: `translate3d(0,0,0)` applied to tilt elements for proper compositing

### Hero Redesign

- [ ] **HERO-01**: Hero section visible without cutoff on page load (mascot fully visible)
- [ ] **HERO-02**: Floating food emojis with staggered CSS animations
- [ ] **HERO-03**: Multi-layer parallax scroll effect using existing parallaxPresets
- [ ] **HERO-04**: Hero works correctly in both light and dark themes
- [ ] **HERO-05**: Mascot properly positioned and visible
- [ ] **HERO-06**: Gradient background animates on scroll
- [ ] **HERO-07**: Legacy gradient code removed, uses semantic tokens only

### Quality Assurance

- [ ] **QUAL-01**: All components tested in both light and dark modes
- [ ] **QUAL-02**: No hardcoded z-index values (ESLint rule enforced)
- [ ] **QUAL-03**: Visual regression tests pass for consolidated components

## Future Requirements

Deferred to v1.4+.

### Performance

- **PERF-01**: Bundle size analysis and optimization
- **PERF-02**: Core Web Vitals improvements (LCP, CLS, INP)

### Documentation

- **DOCS-01**: Component library storybook
- **DOCS-02**: Design token reference site

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| React Three Fiber / 3D hero | Performance concerns, complexity; 2D parallax sufficient |
| Particle.js for hero effects | Unnecessary bundle weight; CSS animations sufficient |
| Heavy post-processing effects | GPU intensive, mobile unfriendly |
| Admin/Driver UX redesign | Focus v1.3 on consolidation; redesign in future milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOKN-01 | Phase 27 | Pending |
| TOKN-02 | Phase 27 | Pending |
| TOKN-03 | Phase 27 | Pending |
| TOKN-04 | Phase 27 | Pending |
| TOKN-05 | Phase 27 | Pending |
| TOKN-06 | Phase 27 | Pending |
| TOKN-07 | Phase 28 | Pending |
| TOKN-08 | Phase 28 | Pending |
| TOKN-09 | Phase 28 | Pending |
| TOKN-10 | Phase 28 | Pending |
| TOKN-11 | Phase 28 | Pending |
| TOKN-12 | Phase 28 | Pending |
| TOKN-13 | Phase 29 | Pending |
| TOKN-14 | Phase 29 | Pending |
| TOKN-15 | Phase 29 | Pending |
| TOKN-16 | Phase 25 | Pending |
| TOKN-17 | Phase 25 | Pending |
| TOKN-18 | Phase 32 | Pending |
| COMP-01 | Phase 26 | Pending |
| COMP-02 | Phase 26 | Pending |
| COMP-03 | Phase 26 | Pending |
| COMP-04 | Phase 26 | Pending |
| COMP-05 | Phase 26 | Pending |
| COMP-06 | Phase 26 | Pending |
| MOBL-01 | Phase 30 | Pending |
| MOBL-02 | Phase 30 | Pending |
| MOBL-03 | Phase 30 | Pending |
| HERO-01 | Phase 31 | Pending |
| HERO-02 | Phase 31 | Pending |
| HERO-03 | Phase 31 | Pending |
| HERO-04 | Phase 31 | Pending |
| HERO-05 | Phase 31 | Pending |
| HERO-06 | Phase 31 | Pending |
| HERO-07 | Phase 31 | Pending |
| QUAL-01 | Phase 32 | Pending |
| QUAL-02 | Phase 32 | Pending |
| QUAL-03 | Phase 32 | Pending |

**Coverage:**
- v1.3 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-01-27*
*Last updated: 2026-01-27 after roadmap creation*
