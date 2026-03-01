# Phase 65: CI/CD Hardening - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

PRs are blocked by performance regressions and code quality violations. GitHub Actions CI pipeline runs Lighthouse CI, linting, type checking, and CSS lint on every PR. Checks are advisory (not merge-blocking via branch protection) — results visible but merge still allowed.

**Scope change from roadmap:** Chromatic visual regression is deferred to a future phase (requires Storybook stories to exist first). Success criteria #2 (Chromatic) and #4 (branch protection requiring checks) are removed.

</domain>

<decisions>
## Implementation Decisions

### Lighthouse CI — Routes & Configuration

- Test all 5 public routes: /, /menu, /login, /privacy, /terms
- Authenticated routes (admin, driver): Claude's discretion based on complexity vs value
- Mobile and desktop testing: Claude's discretion based on app's user profiles

### Lighthouse CI — Thresholds & Metrics

- Gate on: LCP (<4s), CLS (<0.15), performance score floor, accessibility score
- Claude picks appropriate threshold values for score floors
- Absolute thresholds (not regression-from-baseline) — Claude decides if baseline comparison adds value vs maintenance overhead

### Lighthouse CI — Execution

- Number of runs per URL: Claude's discretion (balance speed vs variance)
- Warn vs block behavior: Claude's discretion based on baseline maturity
- CI serving strategy: Claude's discretion (local build+start vs Vercel preview)
- Bypass mechanism: Claude's discretion (pragmatic approach)
- Trigger conditions: Claude's discretion (skip for docs-only changes, etc.)
- Bundle size check: Claude's discretion on whether explicit gating adds value
- Tool choice: Claude's discretion (@lhci/cli vs GitHub Action wrapper)
- Results reporting: Claude's discretion (PR comment, artifacts, or both)

### Lint Gates

- CSS lint (pnpm lint:css) is a CI gate — required
- TypeScript type checking (pnpm typecheck) is a CI gate — required
- ESLint + Prettier formatting check: Claude's discretion on severity and scope
- Lint scope (full codebase vs changed files): Claude's discretion
- Warning treatment (--max-warnings 0 vs allow warnings): Claude's discretion

### CI Gate Additions

- Unit tests (pnpm test): Claude's discretion on whether to include
- Build step (pnpm build): Claude's discretion — Vercel already builds on PR

### Branch Protection

- Checks are advisory only — do NOT require checks to pass for merge
- CI results should be visible on PRs but not block merging

### CI Pipeline Structure

- Job parallelization strategy: Claude's discretion
- pnpm store caching: Claude's discretion
- Node.js version strategy: Claude's discretion (single vs matrix)
- pnpm version pinning: Claude's discretion
- PR summary comments: Claude's discretion
- CI trigger scope (PRs only vs PRs + main): Claude's discretion
- PR type differentiation (e.g., lighter for deps): Claude's discretion
- Workflow file organization: Claude's discretion (single vs modular)
- Environment variables/secrets: Claude determines what's needed

### Claude's Discretion

- All Lighthouse CI execution details (runs, tool, serving, reporting, bypass)
- Lighthouse threshold exact values beyond LCP/CLS
- Lint warning treatment and scope
- Unit tests and build step inclusion
- Full pipeline architecture and caching strategy
- Node.js/pnpm version management
- PR comment formatting

</decisions>

<specifics>
## Specific Ideas

- No Dependabot or Renovate currently configured (not in scope, but relevant context for CI)
- Project is on Vercel Hobby plan — be mindful of GitHub Actions free tier (2000 min/month)
- Current verification command from CLAUDE.md: `pnpm lint && pnpm lint:css && pnpm typecheck && pnpm test && pnpm build`
- LCP target is <4s (revised from <2.5s in Phase 60)
- Tailwind v4 + Turbopack architecture means CSS lint is especially valuable (token registration issues)

</specifics>

<deferred>
## Deferred Ideas

- **Chromatic visual regression** — Requires Storybook stories (none exist). Should be its own phase: set up Storybook, write stories for key components, then enable Chromatic CI.
- **Branch protection enforcement** — Currently advisory. Can be tightened to blocking once CI baselines are stable and team is comfortable with the gates.
- **Dependabot/Renovate** — No automated dependency updates configured. Consider as a future improvement.

</deferred>

---

_Phase: 65-cicd-hardening_
_Context gathered: 2026-02-15_
