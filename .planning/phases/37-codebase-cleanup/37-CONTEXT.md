# Phase 37: Codebase Cleanup - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove dead code, establish directory structure enforcement, eliminate circular dependencies, and consolidate duplicates. Pure maintenance/refactoring phase — no new features.

</domain>

<decisions>
## Implementation Decisions

### Dead code detection
- Remove unused exports AND unreachable code paths (dead branches)
- Deprecated code that's still imported: remove now and fix all imports
- Test files and Storybook stories: delete with their component
- Create `.planning/CLEANUP_LOG.md` with all removed items
- Analyze dynamic imports — only remove if truly unreachable
- Same rules for API routes and UI components (no special treatment)
- No exclusions — everything is fair game if unused

### File splitting rules
- 400-line limit for component files (warning only, not build failure)
- No line limit for page files (route segments)
- Split approach: Claude decides based on file structure (by sub-component or by concern)
- Split files stay in same directory
- Auto-update all imports (no barrel re-exports)
- Types stay inline unless shared across multiple files
- Sub-component naming: Claude decides based on reusability
- Hooks stay colocated unless reusable across components

### Directory enforcement
- Protect only directories that were deleted in past milestones
- Enforcement via ESLint rule (error severity — fails build)
- Documentation approach: Claude decides
- Loose import constraints: prevent circular and upward imports, allow otherwise
- Check for remnants of ui-v8/ consolidation (imports, references)
- Remove all .bak, .old, .copy backup files
- Minor consolidation allowed if something is obviously misplaced

### Circular dependency handling
- Zero tolerance — eliminate ALL circular dependencies
- Resolution approach: extract shared code to third file
- Enforce via ESLint import/no-cycle rule
- Detection tool: Claude decides
- Type-only imports: treat same as regular (still fix cycles)
- Significant refactoring allowed to fix cycles properly
- Include barrel exports (index.ts) in cycle detection
- Priority order: Claude decides based on severity

### Duplicate detection and consolidation
- Find both exact duplicates AND functional duplicates (same purpose)
- Merge approach: Claude decides (keep better one vs merge best parts)
- Duplicate API routes: consolidate to canonical route
- Similarity threshold: Claude uses judgment based on file type
- Include duplicate styles (Tailwind patterns, utility functions)
- Naming conflicts: Claude decides based on clarity and convention
- Include custom hooks in duplicate scan
- Scan everything equally (no specific focus areas)
- Log merged items in CLEANUP_LOG.md
- Centralize all constants/config to central files
- Identify and abstract copy-pasted logic patterns
- Abstraction threshold: Claude decides based on complexity and likelihood of reuse
- Enforce no-duplicate rules via ESLint going forward
- Consolidate duplicate type definitions into types/ directory
- Consolidate similar utility functions into canonical versions
- Preserve git history using git mv where possible
- Include test files in duplicate detection

### Claude's Discretion
- Detection tooling choice (ts-prune, knip, madge, dpdm, etc.)
- Split naming conventions
- Documentation format (README per dir vs central STRUCTURE.md)
- Cycle fix priority order
- Duplicate similarity thresholds
- Abstraction decisions for repeated patterns

</decisions>

<specifics>
## Specific Ideas

- Create `.planning/CLEANUP_LOG.md` as audit trail for all removals and consolidations
- Use git mv to preserve history when merging duplicates
- ESLint rules for enforcement: max-lines (warning), no-cycle (error), no-restricted-paths (error)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 37-codebase-cleanup*
*Context gathered: 2026-02-04*
