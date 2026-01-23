# Roadmap: Morning Star V8 UI Rewrite

## Milestones

- [x] **v1.0 MVP** - Phases 1-8 (shipped 2026-01-23)
- [ ] **v1.1 Tech Debt Cleanup** - Phases 9-14 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-8) - SHIPPED 2026-01-23</summary>

Phases 1-8 completed customer-facing V8 rewrite. See git history for details.

</details>

### v1.1 Tech Debt Cleanup (In Progress)

**Milestone Goal:** Eliminate all legacy code patterns and migrate admin/driver flows to V8 components.

- [ ] **Phase 9: Analysis & Component Creation** - Establish baseline, create missing components
- [ ] **Phase 10: Token Migration** - Migrate all z-index and color hardcodes to design tokens
- [ ] **Phase 11: V8 Component Migration** - Migrate admin/driver/hero/tracking to V8
- [ ] **Phase 12: Dead Code & Export Cleanup** - Remove all dead exports
- [ ] **Phase 13: Legacy Removal & Stricter Rules** - Remove v7 files, enforce rules
- [ ] **Phase 14: Testing & Documentation** - Complete visual regression coverage, update docs

## Phase Details

### Phase 9: Analysis & Component Creation
**Goal**: Establish baseline state and create missing V8 components
**Depends on**: Phase 8 (v1.0 complete)
**Requirements**: QUAL-01, COMP-01, TEST-01
**Success Criteria** (what must be TRUE):
  1. Dead code analysis report exists with reference counts for all 865 exports
  2. TimeStepV8 component exists and matches V8 patterns (motion, tokens, types)
  3. Visual regression baseline snapshots exist for all 11 pending pages
**Plans**: TBD

Plans:
- [ ] 09-01: Dead code analysis and TimeStepV8 creation
- [ ] 09-02: Visual regression baseline generation

### Phase 10: Token Migration
**Goal**: All hardcoded z-index and color values use design tokens
**Depends on**: Phase 9
**Requirements**: ZIDX-01, ZIDX-02, ZIDX-03, ZIDX-04, ZIDX-05, COLR-01, COLR-02, COLR-03, COLR-04
**Success Criteria** (what must be TRUE):
  1. All 30 files use z-index tokens (no hardcoded z-index values remain)
  2. Footer, header, FlipCard, and analytics chart gradients use color tokens
  3. ESLint z-index rule at warn severity passes with zero warnings
**Plans**: TBD

Plans:
- [ ] 10-01: Homepage z-index token migration (6 files)
- [ ] 10-02: Menu z-index token migration (9 files)
- [ ] 10-03: Tracking and UI z-index token migration (9 files)
- [ ] 10-04: Remaining z-index and color token migration (6 + 4 files)

### Phase 11: V8 Component Migration
**Goal**: Admin, driver, hero, and tracking use V8 component patterns
**Depends on**: Phase 10
**Requirements**: V7MG-01, V7MG-02, V7MG-03, V7MG-04, COMP-02
**Success Criteria** (what must be TRUE):
  1. Admin dashboard renders using V8 components (no V7 imports)
  2. Driver dashboard renders using V8 components (no V7 imports)
  3. Homepage Hero uses V8 layout components
  4. Tracking page uses V8 components
  5. All TimeStep usages replaced with TimeStepV8
**Plans**: TBD

Plans:
- [ ] 11-01: Admin dashboard V8 migration
- [ ] 11-02: Driver dashboard V8 migration
- [ ] 11-03: Hero and tracking V8 migration
- [ ] 11-04: TimeStep replacement sweep

### Phase 12: Dead Code & Export Cleanup
**Goal**: No dead code remains in exports
**Depends on**: Phase 11
**Requirements**: QUAL-02, EXPT-01, EXPT-02, EXPT-03, EXPT-04
**Success Criteria** (what must be TRUE):
  1. All zero-reference exports removed from codebase
  2. ui/index.ts contains only actively-used exports
  3. Legacy checkout exports (15 items) removed
  4. admin/index.ts consolidated with v7-index functionality
  5. Skeleton variant dead exports removed
**Plans**: TBD

Plans:
- [ ] 12-01: Zero-reference export removal
- [ ] 12-02: UI and checkout export cleanup
- [ ] 12-03: Admin consolidation and skeleton cleanup

### Phase 13: Legacy Removal & Stricter Rules
**Goal**: Prevent regression with enforced rules and removed legacy files
**Depends on**: Phase 12
**Requirements**: V7MG-05, ZIDX-06, QUAL-03
**Success Criteria** (what must be TRUE):
  1. All 10 v7-index.ts barrel files deleted
  2. No imports reference v7-index paths
  3. ESLint z-index rule set to error (build fails on hardcoded z-index)
  4. TypeScript strict flags enabled (noUnusedLocals, noUnusedParameters)
  5. Build passes with all new strictness
**Plans**: TBD

Plans:
- [ ] 13-01: V7 barrel file removal
- [ ] 13-02: ESLint and TypeScript strictness upgrade

### Phase 14: Testing & Documentation
**Goal**: Complete visual regression coverage and accurate documentation
**Depends on**: Phase 13
**Requirements**: TEST-02, TEST-03, DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):
  1. Visual regression tests exist and pass for admin flow
  2. Visual regression tests exist and pass for driver flow
  3. Z-INDEX-MIGRATION.md reflects completed migration status
  4. All component docs reference V8 patterns (no v7-index mentions)
**Plans**: TBD

Plans:
- [ ] 14-01: Admin and driver visual regression tests
- [ ] 14-02: Documentation updates

## Progress

**Execution Order:** Phases 9 -> 10 -> 11 -> 12 -> 13 -> 14

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-8 | v1.0 | 32/32 | Complete | 2026-01-23 |
| 9. Analysis & Component Creation | v1.1 | 0/2 | Not started | - |
| 10. Token Migration | v1.1 | 0/4 | Not started | - |
| 11. V8 Component Migration | v1.1 | 0/4 | Not started | - |
| 12. Dead Code & Export Cleanup | v1.1 | 0/3 | Not started | - |
| 13. Legacy Removal & Stricter Rules | v1.1 | 0/2 | Not started | - |
| 14. Testing & Documentation | v1.1 | 0/2 | Not started | - |

---
*Roadmap created: 2026-01-23*
*Last updated: 2026-01-23*
