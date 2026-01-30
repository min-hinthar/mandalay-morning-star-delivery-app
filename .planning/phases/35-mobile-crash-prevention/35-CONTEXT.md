# Phase 35: Mobile Crash Prevention - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Zero crashes on mobile devices through systematic cleanup of memory leaks and race conditions. Audit all components and hooks for cleanup patterns (setTimeout, event listeners, GSAP, observers), apply fixes with shared utility hooks, and verify with stress testing on low-power devices.

</domain>

<decisions>
## Implementation Decisions

### Audit Scope
- Audit ALL components in src/components/ — comprehensive, systematic approach
- Audit ALL hooks and utilities in src/lib/ — catch issues in shared code
- Include driver/admin components — all dashboards need stability
- Skip Storybook files and test files — focus on production code only
- Priority order: Crashes first (setTimeout/setInterval → event listeners → GSAP → observers)
- Create AUDIT.md report documenting all findings before fixing
- Severity levels: Critical (crashes), High (memory leaks), Medium (best practice)
- Track progress with checklist in plan — each file/pattern gets a task

### Fix Strategy
- Create shared utility hooks in dedicated file: src/lib/hooks/useSafeEffects.ts
  - useSafeTimeout, useSafeAsync, etc. for reusable cleanup patterns
- Proactive fixes: Refactor adjacent code for consistency while fixing
- Allow minor improvements: Simplify/clarify code if obvious improvement
- Refactor inline: Fix properly even if significant changes needed
- Strengthen TypeScript while fixing — prevent future issues
- Add ESLint rules to enforce cleanup patterns (exhaustive-deps)
- Atomic commits: One commit per file or pattern — easy to revert if issues

### Testing Approach
- Test on real devices: iPhone SE + Android mid-range (low-power where crashes most likely)
- Use Chrome DevTools Memory tab to verify no leaks after fixes
- Stress tests: Rapid modal open/close, fast navigation, repeated interactions
- 10-minute stress test sessions per scenario
- Add unit tests for utility hooks with React Testing Library
- Create TESTING.md checklist with specific scenarios to run
- Run build/typecheck/lint after each file — catch issues immediately
- Acceptance criteria: Pass 10-min stress test on iPhone SE AND Android mid-range with zero crashes

### Documentation
- Comprehensive update to .claude/ERROR_HISTORY.md with all patterns found
- Create .claude/CLEANUP-PATTERNS.md guide with code examples for future reference
- Comprehensive JSDoc comments on all utility hooks (params, returns, usage examples)

### Claude's Discretion
- Exact utility hook API design
- ESLint rule configuration details
- Order of files within each pattern category
- Specific refactoring approach per component

</decisions>

<specifics>
## Specific Ideas

- "Zero crashes" means passing 10-minute stress test on both iPhone SE and Android mid-range
- Utility hooks should be self-documenting with good TypeScript types
- AUDIT.md should be created BEFORE any fixes begin — full visibility of scope
- Each fix should be atomic and revertible

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 35-mobile-crash-prevention*
*Context gathered: 2026-01-30*
