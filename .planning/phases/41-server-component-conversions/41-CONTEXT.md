# Phase 41: Server Component Conversions - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Reduce client bundle by ~150KB by converting data-fetching wrappers to Server Components and pushing "use client" boundaries to leaf components. Targets: home page, menu page, analytics page, order tracking page, plus nearby wins discovered during work. Full audit of all 275 "use client" files with documented results.

</domain>

<decisions>
## Implementation Decisions

### Conversion priority

- Convert 4 pages: home page, menu page, analytics page, order tracking page
- Also convert nearby easy wins discovered during the process
- Home page and menu page are highest LCP priority
- Claude decides conversion order (balance safety vs impact)
- Claude discovers nearby wins during audit

### Conversion policy

- Moderate approach: remove "use client" where possible, refactor small cases (extract tiny client component to keep wrapper server-side)
- If a conversion introduces unexpected issues (client-only library, etc.): revert and skip — don't fight it
- Invest time fixing hydration issues rather than reverting prematurely

### Loading states

- Branded spinner (polish existing spinner component, not create new)
- Generic loading component reused across routes (not content-aware per page)
- Route-specific context text (e.g., "Loading menu...")
- Centered in viewport
- Animated transitions (fade/slide, consistent with existing playful UI from v1.4)
- 200-300ms minimum display time to prevent flicker
- Also create branded error.tsx alongside loading.tsx

### Hydration safety

- Claude decides rollout strategy (incremental vs batch)
- Both build checks AND automated tests for hydration error detection
- Single parameterized test file covering all converted routes
- Enable React strict mode for hydration mismatch detection
- Per-page smoke test checklist documented in the plan
- Final hydration health check pass across whole app after all conversions

### 'use client' audit

- Full audit of all 275 files — no sampling
- Documented audit artifact in `.planning/phases/41-server-component-conversions/`
- Cleanup happens alongside page conversions (not as separate sweep)
- Claude decides: categorization depth, target reduction number, and whether to track future split candidates

### Claude's Discretion

- Conversion order across pages (safety vs impact balance)
- Whether to split components with single hook/event handler (judged per case)
- Audit categorization depth (binary vs reason-tagged)
- Target number of 'use client' files to reduce to
- Whether to track "could split later" files for future work
- Rollout strategy (incremental vs batched)

</decisions>

<specifics>
## Specific Ideas

- Home page added as conversion target (not in original roadmap requirements, but user wants it for LCP)
- Existing spinner component should be polished, not replaced
- Loading states should feel consistent with the playful UI established in v1.4
- Smoke test checklists per page should be part of the plan documentation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 41-server-component-conversions_
_Context gathered: 2026-02-05_
