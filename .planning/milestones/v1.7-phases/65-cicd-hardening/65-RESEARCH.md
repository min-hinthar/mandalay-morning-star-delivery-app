# Phase 65: CI/CD Hardening - Research

**Researched:** 2026-02-15
**Domain:** GitHub Actions CI pipeline, Lighthouse CI, lint gates
**Confidence:** HIGH

## Summary

This phase hardens an existing GitHub Actions CI pipeline by upgrading Lighthouse CI from warn-only to error assertions, adding CSS lint and Prettier gates, and restructuring the workflow for efficiency. The project already has a working `ci.yml` with lint, typecheck, test, build, and Lighthouse jobs. The core work is reconfiguring assertion levels, expanding lint coverage, updating tested routes, and optimizing pipeline structure.

The existing `lighthouserc.js` tests 4 routes (`/`, `/menu`, `/cart`, `/checkout`) with warn-only assertions and old thresholds (LCP 2500ms). The CONTEXT mandates testing 5 public routes (`/`, `/menu`, `/login`, `/privacy`, `/terms`) with error assertions at LCP <4000ms and CLS <0.15. The CI currently uses `treosh/lighthouse-ci-action@v12` with `@lhci/cli@0.15.1`.

**Primary recommendation:** Update `lighthouserc.js` routes and thresholds, switch assertions from `warn` to `error`, add `pnpm lint:css` and `pnpm format:check` jobs, and restructure the workflow to minimize billable minutes while maximizing parallelism.

## Standard Stack

### Core (already installed)

| Library                       | Version | Purpose                  | Why Standard                                    |
| ----------------------------- | ------- | ------------------------ | ----------------------------------------------- |
| `@lhci/cli`                   | 0.15.1  | Lighthouse CI CLI        | Official Google tool for CI performance testing |
| `treosh/lighthouse-ci-action` | v12     | GitHub Action wrapper    | De facto standard, uses Lighthouse v12.6        |
| `stylelint`                   | 17.0.0  | CSS linting              | Already configured with Tailwind v4 rules       |
| `prettier`                    | 3.7.4   | Code formatting          | Already configured with `.prettierrc`           |
| `eslint`                      | 9.x     | JS/TS linting            | Already configured with flat config             |
| `vitest`                      | 4.0.17  | Unit testing             | Already configured, `test:ci` script exists     |
| `pnpm/action-setup`           | v4      | pnpm installer for CI    | Official pnpm action                            |
| `actions/setup-node`          | v4      | Node.js setup with cache | Built-in pnpm store caching                     |
| `actions/upload-artifact`     | v4      | Artifact storage         | Already used for build output                   |

### Supporting (may add)

| Library                  | Version | Purpose                         | When to Use                                  |
| ------------------------ | ------- | ------------------------------- | -------------------------------------------- |
| `dorny/paths-filter`     | v3      | Path-based job skipping         | Skip Lighthouse for docs/config-only changes |
| Lighthouse CI GitHub App | N/A     | PR status checks + report links | Optional: adds status check badges to PR     |

### Alternatives Considered

| Instead of                    | Could Use                         | Tradeoff                                                                                        |
| ----------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `treosh/lighthouse-ci-action` | Raw `@lhci/cli` via `npx`         | Action handles artifacts/storage automatically; raw CLI gives more control but more boilerplate |
| `dorny/paths-filter`          | GitHub's built-in `paths:` filter | Built-in `paths:` only works at workflow level, not job level; paths-filter works per-job       |
| `temporaryPublicStorage`      | Self-hosted LHCI server           | Temporary storage is sufficient for advisory checks; server adds infrastructure overhead        |

**No new installation needed.** All tools are already in `devDependencies`.

## Architecture Patterns

### Current CI Structure (as-is)

```
ci.yml
  lint (parallel)          ~38s
  typecheck (parallel)     ~48s
  test (parallel)          ~39s
  build (needs: lint, typecheck, test)  ~103s
  lighthouse (needs: build, PR only)    ~??? (never run)
```

### Recommended CI Structure (to-be)

```
ci.yml
  changes (path filter)              ~5s
  lint (parallel, always)            ~40s  -- pnpm lint + pnpm lint:css + pnpm format:check
  typecheck (parallel, always)       ~50s
  test (parallel, always)            ~40s
  build (needs: lint,typecheck,test) ~105s
  lighthouse (needs: build, PR only, if: src changed)  ~3-5min
```

**Key changes:**

1. Merge CSS lint and Prettier check into the existing `lint` job (no new job = fewer billable minutes)
2. Add path filtering so Lighthouse only runs when source code changes (not for README, .planning, etc.)
3. Keep build + Lighthouse sequential (Lighthouse needs the build artifact)
4. Keep lint/typecheck/test parallel (each gets its own runner ~40-50s)

### Pattern 1: Consolidated Lint Job

**What:** Run ESLint, Stylelint, and Prettier in a single job with `&&` chaining
**When to use:** When all lint tools share the same Node.js/pnpm setup
**Example:**

```yaml
lint:
  name: Lint & Format
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 10
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - run: pnpm lint --max-warnings 0
    - run: pnpm lint:css
    - run: pnpm format:check
```

### Pattern 2: Path-Filtered Lighthouse

**What:** Skip Lighthouse when only docs/config files change
**When to use:** Save CI minutes on non-code PRs
**Example:**

```yaml
changes:
  runs-on: ubuntu-latest
  outputs:
    src: ${{ steps.filter.outputs.src }}
  steps:
    - uses: actions/checkout@v4
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          src:
            - 'src/**'
            - 'public/**'
            - 'package.json'
            - 'pnpm-lock.yaml'
            - 'next.config.ts'
            - 'lighthouserc.js'

lighthouse:
  needs: [build, changes]
  if: github.event_name == 'pull_request' && needs.changes.outputs.src == 'true'
```

### Pattern 3: Build Artifact Reuse

**What:** Build once, download artifact for Lighthouse (already in place)
**When to use:** Always -- avoids double-building

### Anti-Patterns to Avoid

- **Separate jobs for each lint tool:** Each job has ~30s setup overhead (checkout, pnpm, node). Combine lint tools into one job.
- **Running Lighthouse on push to main:** Wastes minutes. Only run on PRs where results are actionable.
- **Matrix strategy for Node versions:** This is a single-app project, not a library. Test one Node version.
- **Caching node_modules:** pnpm uses symlinked `node_modules`; caching it can break symlinks. Cache the pnpm store instead (handled by `setup-node` with `cache: pnpm`).

## Don't Hand-Roll

| Problem                         | Don't Build                            | Use Instead                                                         | Why                                                                |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Lighthouse report links on PRs  | Custom PR comment action               | `temporaryPublicStorage: true` in treosh action                     | Auto-generates report links, 7-day retention                       |
| Path filtering                  | Bash script to diff files              | `dorny/paths-filter@v3`                                             | Battle-tested, handles all edge cases (new branches, force pushes) |
| pnpm caching                    | Manual `actions/cache` with store path | `actions/setup-node@v4` with `cache: pnpm`                          | Built-in, fewer lines, same result                                 |
| Lighthouse server startup       | Custom wait scripts                    | `startServerCommand` + `startServerReadyPattern` in lighthouserc.js | LHCI manages process lifecycle automatically                       |
| PR status checks for Lighthouse | Custom GitHub API calls                | Lighthouse CI GitHub App (optional)                                 | Installs once, posts status checks automatically                   |

## Common Pitfalls

### Pitfall 1: Lighthouse Variance on CI Runners

**What goes wrong:** Lighthouse scores fluctuate between runs on shared CI runners
**Why it happens:** GitHub-hosted runners have variable CPU/network performance
**How to avoid:**

- Use `numberOfRuns: 3` (median smooths variance)
- Use absolute thresholds not regression-from-baseline
- Set thresholds with margin (LCP 4000ms not 3800ms)
- Use `aggregationMethod: 'optimistic'` if too noisy (but `'median'` preferred)
  **Warning signs:** Flaky Lighthouse failures on unchanged code

### Pitfall 2: Next.js Build Requires NEXT*PUBLIC* Env Vars

**What goes wrong:** Build fails or produces broken pages without env vars
**Why it happens:** `NEXT_PUBLIC_*` vars are inlined at build time
**How to avoid:** The current build already succeeds without env vars (verified on recent CI runs). The app uses `!` non-null assertions on env vars which only fail at runtime, not build time. For Lighthouse testing, the pages that need Supabase will fail to load data but the public routes (`/`, `/menu`, `/login`, `/privacy`, `/terms`) should render shells.
**Warning signs:** Lighthouse reports showing blank pages or 500 errors

### Pitfall 3: Cart/Checkout Routes Need State

**What goes wrong:** Lighthouse audits `/cart` and `/checkout` but they're empty/redirect without session
**Why it happens:** These routes require authentication and cart state
**How to avoid:** Only test public routes that render meaningful content without auth: `/`, `/menu`, `/login`, `/privacy`, `/terms`
**Warning signs:** Very low LCP scores or zero content on cart/checkout audits

### Pitfall 4: `pnpm lint` vs `pnpm lint --max-warnings 0`

**What goes wrong:** ESLint passes CI despite hundreds of warnings
**Why it happens:** Default ESLint exits 0 for warnings, only errors cause non-zero exit
**How to avoid:** Use `--max-warnings 0` to treat warnings as errors in CI. The local lint-staged config already uses `--max-warnings=0`.
**Warning signs:** CI passes but local lint-staged hooks catch issues

### Pitfall 5: pnpm Action Order Matters

**What goes wrong:** `setup-node` cache fails to find pnpm store
**Why it happens:** `pnpm/action-setup` must run BEFORE `actions/setup-node` so setup-node can detect the pnpm store location
**How to avoid:** Always order: checkout -> pnpm/action-setup -> actions/setup-node (with cache: pnpm) -> pnpm install
**Warning signs:** Cache miss every run, slow installs

### Pitfall 6: Lighthouse startServerReadyPattern for Next.js 16

**What goes wrong:** LHCI times out waiting for server
**Why it happens:** Next.js 16 server ready message format may differ from older versions. Current config uses `"Starting"` as the pattern.
**How to avoid:** Verify the exact ready message from `pnpm start` output. Next.js typically prints something like "Ready in Xs" or "started server on". Current config's `"Starting"` pattern should work but may need verification.
**Warning signs:** Lighthouse job times out at `startServerReadyTimeout`

### Pitfall 7: GitHub Actions Free Tier Budget

**What goes wrong:** Exceeding 2000 min/month on free tier
**Why it happens:** Each push + PR triggers parallel runners. Lighthouse adds 3-5 min per PR.
**How to avoid:**

- Current usage: ~2.5 min per push (4 parallel jobs at ~40s each = ~2.5 billable minutes)
- With Lighthouse: ~5.5 min per PR (add ~3 min for Lighthouse)
- Path filtering saves minutes on docs-only PRs
- Only run Lighthouse on PRs, not pushes
  **Warning signs:** GitHub billing alerts

## Code Examples

### lighthouserc.js -- Updated Configuration

```javascript
// Source: existing lighthouserc.js + CONTEXT decisions
module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm start",
      startServerReadyPattern: "Starting",
      startServerReadyTimeout: 30000,

      // 5 public routes per CONTEXT decision
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/menu",
        "http://localhost:3000/login",
        "http://localhost:3000/privacy",
        "http://localhost:3000/terms",
      ],

      // 3 runs for statistical accuracy (median smooths CI variance)
      numberOfRuns: 3,

      settings: {
        chromeFlags: "--no-sandbox --headless --disable-gpu",
        // Mobile-first: this is a delivery app (primarily mobile users)
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
        emulatedFormFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
        },
      },
    },

    assert: {
      assertions: {
        // Core Web Vitals - ERROR (blocks check, advisory on PR)
        "largest-contentful-paint": ["error", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.15 }],

        // Supporting metrics - WARN (informational)
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],

        // Category scores - ERROR for floors
        "categories:performance": ["error", { minScore: 0.6 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
      },
    },

    upload: {
      target: "temporary-public-storage",
    },
  },
};
```

**Threshold rationale:**

- LCP 4000ms: Per CONTEXT decision (revised from 2500ms in Phase 60)
- CLS 0.15: Per CONTEXT decision
- Performance score 0.6: Conservative floor for mobile throttling on CI runners
- Accessibility score 0.9: High bar since a11y issues are deterministic (no variance)
- FCP/TBT: Warn-only informational (not gated)

### CI Workflow -- Lint Job with CSS and Prettier

```yaml
lint:
  name: Lint & Format
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 10
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - name: ESLint
      run: pnpm lint --max-warnings 0
    - name: CSS Lint (Stylelint)
      run: pnpm lint:css
    - name: Prettier Format Check
      run: pnpm format:check
```

### CI Workflow -- Path Filter Job

```yaml
changes:
  name: Detect Changes
  runs-on: ubuntu-latest
  outputs:
    src: ${{ steps.filter.outputs.src }}
  steps:
    - uses: actions/checkout@v4
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          src:
            - 'src/**'
            - 'public/**'
            - 'package.json'
            - 'pnpm-lock.yaml'
            - 'next.config.ts'
            - 'lighthouserc.js'
            - 'postcss.config.*'
            - 'tailwind.config.*'
```

## State of the Art

| Old Approach                      | Current Approach        | When Changed | Impact                                                |
| --------------------------------- | ----------------------- | ------------ | ----------------------------------------------------- |
| `actions/setup-node@v3`           | `actions/setup-node@v4` | 2024         | Better caching, Node 22 support                       |
| `pnpm/action-setup@v2`            | `pnpm/action-setup@v4`  | 2024         | Automatic version detection from packageManager field |
| Node 18/20                        | Node 22 LTS             | 2024-10      | Current LTS, used by Vercel                           |
| `treosh/lighthouse-ci-action@v11` | `@v12`                  | 2024         | Uses Lighthouse v12.6                                 |
| Lighthouse `emulatedFormFactor`   | Still valid             | N/A          | No breaking changes                                   |

**Current versions in CI vs local:**

- CI: Node 20, pnpm 10
- Local: Node 25.2.1, pnpm 10.28.0
- Recommendation: Upgrade CI to Node 22 (current LTS). Node 20 EOL April 2026. Node 25 is current/unstable. Node 22 matches Vercel's runtime.

**Not changing:**

- `@lhci/cli@0.15.1` -- current latest, no new version needed
- `treosh/lighthouse-ci-action@v12` -- already on latest major

## Decisions Summary (Claude's Discretion)

Based on research, these are my recommendations for the discretion areas:

| Decision                  | Recommendation                                                            | Rationale                                                                                   |
| ------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Authenticated routes      | **Skip**                                                                  | Admin/driver routes require auth; testing them adds complexity with no proportional value   |
| Mobile vs desktop         | **Mobile only**                                                           | Delivery app is mobile-first; mobile throttling is stricter and catches more issues         |
| Number of runs            | **3**                                                                     | Standard for CI; balances variance smoothing vs time (3 runs x 5 URLs = 15 Lighthouse runs) |
| CI serving strategy       | **Local build+start**                                                     | Already working; Vercel preview URLs would add complexity and deployment dependency         |
| Tool choice               | **treosh/lighthouse-ci-action**                                           | Already configured; handles artifacts and storage automatically                             |
| Results reporting         | **temporaryPublicStorage + artifacts**                                    | Already configured; gives clickable report links                                            |
| Bypass mechanism          | **Path filtering** via dorny/paths-filter                                 | Skips Lighthouse for docs/config-only changes                                               |
| ESLint warnings           | **--max-warnings 0**                                                      | Matches local lint-staged config; prevents warning accumulation                             |
| Lint scope                | **Full codebase**                                                         | Consistent with local `pnpm lint`; changed-files-only adds complexity                       |
| Unit tests                | **Keep**                                                                  | Already in pipeline; ~39s, catches regressions                                              |
| Build step                | **Keep**                                                                  | Already in pipeline; required for Lighthouse; catches build errors                          |
| Trigger scope             | **PRs + push to main**                                                    | Push to main validates merged code; Lighthouse only on PRs                                  |
| Job parallelization       | **lint/typecheck/test parallel, build sequential, lighthouse sequential** | Current pattern is correct                                                                  |
| pnpm caching              | **setup-node cache: pnpm**                                                | Already in place, working                                                                   |
| Node.js version           | **22 (single, not matrix)**                                               | Current LTS, matches Vercel                                                                 |
| pnpm version              | **10**                                                                    | Already pinned in workflow                                                                  |
| Workflow file             | **Single ci.yml**                                                         | One workflow is simpler; not enough jobs to justify splitting                               |
| Performance score floor   | **0.6**                                                                   | Conservative for mobile throttling on shared runners                                        |
| Accessibility score floor | **0.9**                                                                   | A11y audits are deterministic; high bar is appropriate                                      |
| Bundle size check         | **Skip**                                                                  | Vercel already reports bundle size on deployments; no additional value                      |
| PR summary comments       | **Skip for now**                                                          | temporaryPublicStorage already provides report links via treosh action                      |
| Lighthouse CI GitHub App  | **Optional enhancement**                                                  | Adds status check badges; requires one-time setup; not blocking                             |

## Open Questions

1. **Next.js 16 server ready pattern**
   - What we know: Current config uses `"Starting"` as `startServerReadyPattern`
   - What's unclear: Whether Next.js 16.1.2 outputs this exact string on `pnpm start`
   - Recommendation: Verify during implementation by running `pnpm build && pnpm start` and checking stdout. If different, update pattern.

2. **Lighthouse on public routes without Supabase env vars**
   - What we know: Build succeeds without env vars. `NEXT_PUBLIC_SUPABASE_URL` uses `!` assertion.
   - What's unclear: Whether `/menu` renders meaningful content without Supabase (menu data comes from Supabase)
   - Recommendation: Test locally. If `/menu` shows an empty shell, LCP/CLS should still be measurable (it tests the page shell, not data). Worst case, set dummy env vars in CI.

3. **dorny/paths-filter licensing and maintenance**
   - What we know: Widely used (40k+ stars), MIT licensed
   - What's unclear: Long-term maintenance status
   - Recommendation: Use it; if abandoned, built-in `paths:` filter at workflow level is the fallback (but less granular).

## Sources

### Primary (HIGH confidence)

- Existing `ci.yml` -- direct inspection of current pipeline
- Existing `lighthouserc.js` -- direct inspection of current config
- Existing `package.json` -- versions of all tools verified
- Recent CI run #22031911461 -- confirmed build works, job timings measured
- `@lhci/cli@0.15.1` lockfile entry -- confirmed installed version

### Secondary (MEDIUM confidence)

- [treosh/lighthouse-ci-action README](https://github.com/treosh/lighthouse-ci-action/blob/main/README.md) -- inputs/outputs for v12
- [Lighthouse CI configuration docs](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md) -- assert levels, aggregation methods
- [Lighthouse CI getting started](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md) -- GitHub App setup
- [pnpm/action-setup](https://github.com/pnpm/action-setup) -- pnpm CI setup
- [actions/setup-node caching](https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md) -- pnpm cache configuration
- [dorny/paths-filter](https://github.com/dorny/paths-filter) -- path-based job filtering
- [GitHub Actions pricing 2026](https://resources.github.com/actions/2026-pricing-changes-for-github-actions/) -- free tier 2000 min/month unchanged

### Tertiary (LOW confidence)

- Node.js 22 as "current Vercel runtime" -- based on general knowledge, not verified for this specific project's Vercel config

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all tools already installed and verified in lockfile
- Architecture: HIGH -- existing CI workflow analyzed, timing data from real runs
- Pitfalls: HIGH -- based on actual project inspection (env vars, route structure, lint config)
- Threshold values: MEDIUM -- performance/accessibility score floors are recommendations based on mobile throttling behavior, may need tuning

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (stable domain; tools unlikely to have breaking changes in 30 days)
