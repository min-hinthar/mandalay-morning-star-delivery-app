# Phase 46: Large File Refactoring - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Split all 35 source files exceeding 400 lines into logical sub-modules for maintainability. Type definition files and test files are excluded. Add ESLint enforcement to prevent future regression.

</domain>

<decisions>
## Implementation Decisions

### Prioritization criteria
- Claude's discretion on ordering — balanced approach considering size, change frequency, and complexity
- **All 35 files** over 400 lines will be split (not just top 10)
- **Type files excluded:** database.ts (808 lines) and driver.ts (478 lines) stay as-is — they serve as reference docs
- **Test files excluded:** analytics-helpers.test.ts (620 lines) and route.test.ts (577 lines) stay as-is

### Splitting strategy
- **Components:** Extract both sub-components AND hooks/helpers — main file becomes a thin orchestrator
- **Lib files:** Claude analyzes export graph and picks cleanest split per file
- **Barrel exports:** Claude decides per file based on tree-shaking impact and import count
- **Tightly coupled files:** Leave as-is if splitting requires major restructuring — don't break what works

### File size threshold & enforcement
- ESLint `max-lines` rule at **400 lines** (matches CLAUDE.md guideline)
- **Warning only** — nudges developers but doesn't block builds or CI
- **Exempt:** Type definition files (types/) and test files (.test.ts, .test.tsx)
- **No function-level rule** — file-level only, keep it simple

### Naming & organization conventions
- **Subfolder pattern** for all splits (components and lib files alike)
  - `ComponentName/index.tsx` + `ComponentName/SubComponent.tsx` + `ComponentName/useHook.ts`
  - `lib-file/index.ts` + `lib-file/concern-a.ts` + `lib-file/concern-b.ts`
- Entry file is always **index.tsx** (or index.ts for non-component files)
- **PascalCase** for component files: `OrderHeader.tsx`, `OrderTimeline.tsx`
- **camelCase** for hooks and utilities: `useOrderActions.ts`, `orderHelpers.ts`

### Claude's Discretion
- Prioritization order for the 35 files
- How to split each lib file (by domain, by usage pattern, etc.)
- Whether to use barrel re-exports or direct imports per file
- Skipping files where splitting would require major interface changes

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Key constraint: don't break tightly coupled files just to meet the line count.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 46-large-file-refactoring*
*Context gathered: 2026-02-06*
