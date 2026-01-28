# Phase 34: Full src/ Consolidation - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Consolidate all src/ subdirectories (contexts, design-system, lib, styles, types, app) — eliminate duplicate exports, conflicting code, and unused files. Only latest updated code should exist after this phase.

</domain>

<decisions>
## Implementation Decisions

### Duplicate Detection
- Use knip for unused exports + TypeScript analysis for type conflicts/duplicate declarations
- Identify duplicates by same export name AND same functionality (aggressive detection)
- Flag types that overlap in purpose even if structures differ
- Merge similar contexts that manage similar state
- lib/ wins over design-system/ for utility conflicts — move design-system utils to lib/
- Full audit first before any changes (complete report of all duplicates/unused)
- Delete unused code immediately — git history preserves if ever needed

### Merge Strategy
- Most recent version (by git commit date) wins when duplicates exist
- Port any useful features from older version to newer before deleting old
- Newer type definition is canonical — update consumers accordingly
- Update all imports immediately AND add ESLint guard to block old paths
- Brief one-line comment noting merge origin for complex merges
- Remove bad exports and fix all consumers to use better alternatives
- Commit in logical groupings (all type merges, all util merges, etc.)
- Update barrel exports (index.ts) incrementally after each merge

### Directory Structure
**Final structure:**
```
src/
├── app/           # Routes + contexts (moved here)
├── components/    # UI components (already consolidated)
├── lib/           # All utilities, organized by type
│   ├── utils/
│   ├── hooks/
│   ├── api/
│   ├── design-system/  # Merged from design-system/
│   └── stores/
├── styles/        # Global CSS, Tailwind config (stays)
├── types/         # Global types (stays separate)
├── stories/       # Storybook stories (stays)
└── test/          # Test utilities (stays)
```

- design-system/ merges into lib/design-system/
- contexts/ moves to app/ (co-locate with app router)
- lib/ uses subdirectory organization by type
- types/, styles/, stories/, test/ stay as separate top-level directories

### app/ Route Cleanup
- Identify unused routes via link analysis + traffic data (if available)
- Consolidate duplicate layout.tsx logic to root app/layout.tsx
- Keep empty/placeholder pages but add clear TODO comments
- Reorganize route groups — Claude decides optimal grouping based on analysis
- Full cleanup of API routes (app/api/) included
- Consolidate loading.tsx and error.tsx to shared components
- Inline simple page.tsx files that only re-export one component
- Verify dynamic route params ([id]) are actually used in page
- Standardize metadata exports across all pages

### Claude's Discretion
- Exact clustering for context merge decisions
- Final route group organization (analyze current routes, propose optimal)
- How to handle edge cases in type merging

</decisions>

<specifics>
## Specific Ideas

- Follow same pattern as Phase 33 components consolidation — worked well
- ESLint guards for all removed/deprecated paths (proven pattern from 33-10)
- Atomic commits per logical grouping for easy rollback
- Build verification after each major merge step

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 34-full-src-consolidation*
*Context gathered: 2026-01-27*
