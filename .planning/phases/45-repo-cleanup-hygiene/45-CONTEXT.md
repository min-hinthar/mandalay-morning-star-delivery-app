# Phase 45: Repo Cleanup & Hygiene - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Clean the repository by deleting legacy design docs (V0-V7 and all pre-v1.0 artifacts), untracking build artifacts, archiving old planning files, auditing .gitignore, and updating README + creating PERFORMANCE.md to reflect v1.5 achievements. No new features or capabilities.

</domain>

<decisions>
## Implementation Decisions

### Legacy doc archival
- Delete all V0-V7 design docs and pre-v1.0 artifacts via normal commit (no history rewrite)
- No backup needed — files remain in git history if ever needed
- No exceptions — anything pre-v1.0 that isn't actively referenced goes
- Single commit for all legacy deletions
- Scope: legacy design docs only, not other repo clutter

### Documentation updates
- README gets a full refresh: update tech stack, project description, and add performance section
- Performance section is numbers-first: lead with LCP metrics (before/after), bundle size reductions, Core Web Vitals scores
- Create separate PERFORMANCE.md with detailed optimization journey
- PERFORMANCE.md depth: detailed with lessons — each optimization explained with what worked, what didn't, and takeaways (~3-4 pages)

### Planning files cleanup
- Archive v1.0–v1.3 phase directories to .planning/archive/; keep v1.4 and v1.5 accessible
- Archive research directories alongside their phase dirs
- Archive old milestone roadmap files (v1.0-ROADMAP.md through v1.3-ROADMAP.md)
- Trim STATE.md to current milestone (v1.5) only; milestone summary table stays for shipped counts
- Trim ROADMAP.md — collapse old milestone details
- Claude's discretion on archive directory layout (grouped by milestone vs flat structure)

### Build artifact hygiene
- Untrack storybook-static with `git rm --cached` and add to .gitignore
- Full .gitignore audit against common Next.js/pnpm best practices — flag missing entries
- Audit repo for any other tracked build artifacts (Claude investigates)
- Untrack + .gitignore for any discovered artifacts (`git rm --cached` + .gitignore entry)
- Quick scan for accidentally tracked .env files, API keys, or secrets
- Claude's discretion on whether to review .github/workflows for stale/unused workflows

### Claude's Discretion
- Archive directory layout (grouped by milestone vs maintaining phase structure)
- Which CI/CD workflows to flag as stale (if any)
- Specific .gitignore additions beyond storybook-static
- How to trim ROADMAP.md collapsed sections

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 45-repo-cleanup-hygiene*
*Context gathered: 2026-02-06*
