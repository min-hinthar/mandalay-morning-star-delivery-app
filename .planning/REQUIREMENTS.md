# Requirements: Morning Star V8 — v1.1 Tech Debt Cleanup

**Defined:** 2026-01-23
**Core Value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.

## v1.1 Requirements

Complete V8 adoption: eliminate all legacy patterns, migrate admin/driver flows, clean dead code.

### Z-Index Cleanup

- [ ] **ZIDX-01**: Migrate all homepage components to z-index tokens (6 files)
- [ ] **ZIDX-02**: Migrate all menu components to z-index tokens (9 files)
- [ ] **ZIDX-03**: Migrate all tracking components to z-index tokens (3 files)
- [ ] **ZIDX-04**: Migrate all UI components to z-index tokens (6 files)
- [ ] **ZIDX-05**: Migrate remaining components to z-index tokens (6 files)
- [ ] **ZIDX-06**: Upgrade ESLint z-index rule from warn to error

### V7 Component Migration

- [ ] **V7MG-01**: Migrate admin dashboard to V8 components
- [ ] **V7MG-02**: Migrate driver dashboard to V8 components
- [ ] **V7MG-03**: Migrate homepage Hero to V8 layout components
- [ ] **V7MG-04**: Migrate tracking page to V8 components
- [ ] **V7MG-05**: Remove all v7-index.ts barrel files (10 files)

### Color Token Cleanup

- [ ] **COLR-01**: Tokenize footer gradient colors
- [ ] **COLR-02**: Tokenize header gradient colors
- [ ] **COLR-03**: Tokenize FlipCard gradient colors
- [ ] **COLR-04**: Tokenize analytics dashboard chart colors

### Export Cleanup

- [ ] **EXPT-01**: Remove dead exports from ui/index.ts
- [ ] **EXPT-02**: Remove legacy checkout exports (15 items)
- [ ] **EXPT-03**: Consolidate admin/index.ts with v7-index functionality
- [ ] **EXPT-04**: Remove skeleton variant dead exports

### Component Completion

- [ ] **COMP-01**: Create TimeStepV8 component (checkout uses legacy TimeStep)
- [ ] **COMP-02**: Replace legacy TimeStep imports with V8 version

### Visual Regression Testing

- [ ] **TEST-01**: Generate visual regression baseline snapshots (11 pending)
- [ ] **TEST-02**: Add visual regression tests for admin flow
- [ ] **TEST-03**: Add visual regression tests for driver flow

### Code Quality

- [ ] **QUAL-01**: Run dead code analysis on 865 exports
- [ ] **QUAL-02**: Remove all zero-reference exports
- [ ] **QUAL-03**: Enable stricter TypeScript (noUnusedLocals, noUnusedParameters)

### Documentation

- [ ] **DOCS-01**: Update Z-INDEX-MIGRATION.md to reflect completion
- [ ] **DOCS-02**: Remove v7-index references from component docs

## Future Requirements

Deferred to v1.2+:

- Reduced motion automatic detection (prefers-reduced-motion)
- Dark mode palette refinement
- Performance budget enforcement

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend/schema changes | Supabase + Stripe contracts stay stable |
| Multi-restaurant marketplace | Not part of Morning Star scope |
| New user-facing features | This milestone is cleanup only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ZIDX-01 | TBD | Pending |
| ZIDX-02 | TBD | Pending |
| ZIDX-03 | TBD | Pending |
| ZIDX-04 | TBD | Pending |
| ZIDX-05 | TBD | Pending |
| ZIDX-06 | TBD | Pending |
| V7MG-01 | TBD | Pending |
| V7MG-02 | TBD | Pending |
| V7MG-03 | TBD | Pending |
| V7MG-04 | TBD | Pending |
| V7MG-05 | TBD | Pending |
| COLR-01 | TBD | Pending |
| COLR-02 | TBD | Pending |
| COLR-03 | TBD | Pending |
| COLR-04 | TBD | Pending |
| EXPT-01 | TBD | Pending |
| EXPT-02 | TBD | Pending |
| EXPT-03 | TBD | Pending |
| EXPT-04 | TBD | Pending |
| COMP-01 | TBD | Pending |
| COMP-02 | TBD | Pending |
| TEST-01 | TBD | Pending |
| TEST-02 | TBD | Pending |
| TEST-03 | TBD | Pending |
| QUAL-01 | TBD | Pending |
| QUAL-02 | TBD | Pending |
| QUAL-03 | TBD | Pending |
| DOCS-01 | TBD | Pending |
| DOCS-02 | TBD | Pending |

**Coverage:**
- v1.1 requirements: 29 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 29

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-23 after initial definition*
