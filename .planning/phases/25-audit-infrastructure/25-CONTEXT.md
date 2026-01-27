# Phase 25: Audit Infrastructure - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated detection tooling for codebase violations. Build scripts and ESLint rules that identify hardcoded values (colors, spacing, effects) and produce actionable reports. The audit becomes the source of truth for tracking progress toward zero violations.

</domain>

<decisions>
## Implementation Decisions

### Output Format
- Terminal summary + full report to `.planning/audit-report.md`
- Two views in report: by-file AND by-type summaries
- Include suggested fixes (e.g., `text-white` → `text-foreground`)
- Priority ordering: user-facing pages + shared components first
- Progress bar in terminal with counts (visual quick glance)
- Auto-detect TTY for colors: colored output in terminal, plain in pipes/CI

### Detection Scope
- File types: TSX, JSX, CSS files, globals.css, tailwind.config
- Inline styles flagged as violations (`style={{ color: 'white' }}`)
- Color patterns: `text-white`, `bg-black`, opacity variants (`text-white/50`), hex values, rgb()
- Scan entire src/ including tests (exclude node_modules only)
- Comprehensive audit: colors + spacing + effects in single tool
- Spacing violations: arbitrary Tailwind values (`p-[17px]`) AND inline px values
- Effect violations: shadow, blur, z-index, AND transition durations
- Severity levels: Combined (user-facing + colors = critical; internal + effects = info)
- Also detect deprecated patterns (V7 naming, old palette refs)
- Flag duplicate component imports (ui/ and ui-v8/ for same component)
- No false positive exceptions - fix everything

### CI Integration
- Fail CI on critical severity violations only
- Exit codes: 0 = clean, 1 = critical, 2 = warnings, 3 = info only
- ESLint rules separate from audit script, both run in CI
- ESLint for real-time feedback, audit script for comprehensive reports
- Package.json script `pnpm audit:tokens` calling `scripts/audit-tokens.js`

### Baseline Handling
- Baseline stored at bottom of audit-report.md
- Auto-update baseline when violations decrease
- Per-category tracking: separate counts for colors, spacing, effects
- Historical trend: track last 5 runs showing progress
- Fail on ANY regression (count increases from baseline = exit 1)

### Claude's Discretion
- Violation detail level (file:line vs context snippets)
- Exact progress bar implementation
- Internal data structures for tracking
- ESLint rule implementation details

</decisions>

<specifics>
## Specific Ideas

- "Progress toward zero" as the mental model — visible progress bar makes it satisfying
- Comprehensive from day one (all categories) rather than incremental audit phases
- Aggressive regression prevention — no backsliding allowed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 25-audit-infrastructure*
*Context gathered: 2026-01-27*
