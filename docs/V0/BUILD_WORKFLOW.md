# Build Workflow Plan — Mandalay Morning Star

> How we execute implementation with minimal human review.

---

## Workflow A: Single Feature Development

**Use when**: Building one feature at a time, linear progression.

### Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FEATURE DEVELOPMENT                         │
└─────────────────────────────────────────────────────────────────────┘

Step 1: PLAN (Claude)
┌─────────────────────────────────────────────────────────────────────┐
│  • Read PROJECT_SPEC.md + relevant docs                             │
│  • Create docs/features/<feature>.md with full spec                 │
│  • Define acceptance criteria + test plan                           │
│  • Identify dependencies + blockers                                 │
│  • Human reviews spec → approve or revise                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Step 2: IMPLEMENT (Codex)
┌─────────────────────────────────────────────────────────────────────┐
│  • Create branch: feat/<area>-<short>                               │
│  • Follow spec exactly (no drive-by changes)                        │
│  • Write code + tests in same PR                                    │
│  • Run local checks: lint, typecheck, test, build                   │
│  • Push and create PR with description from spec                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Step 3: VERIFY (CI)
┌─────────────────────────────────────────────────────────────────────┐
│  • GitHub Actions runs automatically:                               │
│    - pnpm lint                                                      │
│    - pnpm typecheck                                                 │
│    - pnpm test                                                      │
│    - pnpm build                                                     │
│  • Vercel deploys preview environment                               │
│  • All checks must pass before merge                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Step 4: REVIEW (Claude)
┌─────────────────────────────────────────────────────────────────────┐
│  • Compare implementation to spec                                   │
│  • Score against review rubric (see below)                          │
│  • Check security: RLS, webhooks, input validation                  │
│  • Verify UI on preview URL (mobile + desktop)                      │
│  • Request changes or approve                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Step 5: MERGE + UPDATE
┌─────────────────────────────────────────────────────────────────────┐
│  • Squash merge to main                                             │
│  • Update docs/project_status.md                                    │
│  • Update docs/change_log.md                                        │
│  • Move to next feature                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Review Rubric (Score 1-10)

| Category | Weight | 10 = Excellent | 1 = Block |
|----------|--------|----------------|-----------|
| **Correctness** | 30% | Matches spec exactly | Missing core functionality |
| **Security** | 25% | RLS tested, webhooks verified | No RLS, client-trusted prices |
| **UX Quality** | 20% | Mobile-first, smooth animations | Broken on mobile |
| **Test Coverage** | 15% | Happy path + edge cases | No tests |
| **Maintainability** | 10% | Clean code, no tech debt | Spaghetti |

**Thresholds**:
- Average ≥ 7: Approve
- Average 5-6: Request minor changes
- Average < 5: Block merge

---

## Workflow B: Issue-Based Development

**Use when**: Multiple features in backlog, tracking via GitHub Issues.

### Issue Template

```markdown
<!-- .github/ISSUE_TEMPLATE/feature.md -->
---
name: Feature Request
about: Propose a new feature
labels: feature
---

## Summary
<!-- One sentence description -->

## User Story
As a [persona], I want to [action] so that [benefit].

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Priority
<!-- P0 (blocking) / P1 (milestone) / P2 (nice-to-have) -->

## Milestone
<!-- V0 / V1 / V2 -->

## Dependencies
<!-- Link to blocking issues -->
```

### Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ISSUE-BASED WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────┘

                     GitHub Issues (Source of Truth)
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌───────────┐      ┌───────────┐      ┌───────────┐
    │  Issue #1 │      │  Issue #2 │      │  Issue #3 │
    │  P0 - V0  │      │  P1 - V0  │      │  P1 - V1  │
    └─────┬─────┘      └───────────┘      └───────────┘
          │
          ▼
    ┌───────────────────────────────────────────────────┐
    │  1. Assign issue to Codex                         │
    │  2. Codex creates branch linked to issue          │
    │  3. PR references issue: "Closes #1"              │
    │  4. CI runs + preview deploys                     │
    │  5. Claude reviews against issue criteria         │
    │  6. Merge → issue auto-closes                     │
    │  7. Pick next highest priority issue              │
    └───────────────────────────────────────────────────┘
```

### Issue Prioritization

| Priority | Definition | SLA |
|----------|------------|-----|
| **P0** | Blocking milestone | Same day |
| **P1** | Required for milestone | This sprint |
| **P2** | Nice to have | Backlog |
| **P3** | Future consideration | Icebox |

### Labels

| Label | Meaning |
|-------|---------|
| `feature` | New functionality |
| `bug` | Something broken |
| `docs` | Documentation only |
| `chore` | Maintenance/refactor |
| `blocked` | Waiting on dependency |
| `needs-spec` | Requires feature spec |
| `ready-for-codex` | Spec complete, ready to implement |

---

## Workflow C: Multi-Agent Development ("Multi-Clauding")

**Use when**: Parallelizing work across multiple Claude/Codex instances.

### Coordination Rules

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MULTI-AGENT COORDINATION                         │
└─────────────────────────────────────────────────────────────────────┘

                         ┌───────────────┐
                         │  COORDINATOR  │
                         │   (Claude)    │
                         └───────┬───────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
       ┌────────────┐     ┌────────────┐     ┌────────────┐
       │  Agent A   │     │  Agent B   │     │  Agent C   │
       │ (Feature X)│     │ (Feature Y)│     │ (Feature Z)│
       └────────────┘     └────────────┘     └────────────┘
              │                  │                  │
              ▼                  ▼                  ▼
       ┌────────────┐     ┌────────────┐     ┌────────────┐
       │  Branch X  │     │  Branch Y  │     │  Branch Z  │
       └────────────┘     └────────────┘     └────────────┘
```

### Rules

1. **No Overlapping Files**
   - Each agent owns specific directories/files
   - Define ownership before starting
   - Example:
     ```
     Agent A: src/app/(public)/, src/components/menu/
     Agent B: src/app/(customer)/, src/components/cart/
     Agent C: src/lib/*, src/types/*
     ```

2. **Shared Files Require Coordination**
   - `package.json` → Coordinator merges
   - `tailwind.config.ts` → Coordinator merges
   - Database migrations → Sequential, never parallel
   - Types in `src/types/` → Define interfaces first, implement second

3. **Branch Strategy**
   ```
   main
   ├── feat/auth-signup (Agent A)
   ├── feat/menu-browse (Agent B)
   └── feat/coverage-check (Agent C)
   
   Merge order: dependencies first
   - If B depends on A's types → merge A first
   ```

4. **Communication Protocol**
   ```
   Before starting:
   - Coordinator assigns ownership
   - Agents read CLAUDE.md + relevant docs
   - Agents confirm understanding
   
   During work:
   - Agents don't modify shared files
   - Agents create PR when ready
   - Coordinator reviews + resolves conflicts
   
   After merge:
   - Coordinator updates project_status.md
   - Coordinator assigns next task
   ```

5. **Conflict Resolution**
   - Type conflicts → Coordinator defines canonical type
   - Style conflicts → Follow existing patterns
   - Logic conflicts → Refer to spec; if unclear, ask human

### Example: V0 Parallel Work

```
Coordinator assigns:

Agent A (Auth):
  Own: src/app/(auth)/, src/lib/supabase/auth.ts
  Task: Signup/login flows, profile creation trigger
  Depends: None

Agent B (Menu):
  Own: src/app/(public)/menu/, src/components/menu/
  Task: Menu browse UI, category tabs, item cards
  Depends: Menu types (coordinate with Agent C)

Agent C (Infrastructure):
  Own: src/lib/*, src/types/*, supabase/migrations/
  Task: DB schema, types, Supabase client setup
  Depends: None (others depend on this)

Merge order:
1. Agent C (infrastructure) → main
2. Agent A (auth) → main (uses C's types)
3. Agent B (menu) → main (uses C's types)
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  e2e:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
        env:
          PLAYWRIGHT_TEST_BASE_URL: ${{ secrets.VERCEL_PREVIEW_URL }}
```

---

## Quality Gates

### Pre-Merge Checklist (Automated)

| Check | Tool | Blocking? |
|-------|------|-----------|
| ESLint passes | `pnpm lint` | ✅ Yes |
| TypeScript compiles | `pnpm typecheck` | ✅ Yes |
| Unit tests pass | `pnpm test` | ✅ Yes |
| Build succeeds | `pnpm build` | ✅ Yes |
| E2E tests pass | `pnpm test:e2e` | ✅ Yes (PRs) |

### Pre-Merge Checklist (Manual Review)

| Check | Reviewer | Blocking? |
|-------|----------|-----------|
| Matches spec | Claude | ✅ Yes |
| RLS policies tested | Claude | ✅ Yes |
| Webhook signatures verified | Claude | ✅ Yes |
| Mobile responsive | Claude | ✅ Yes |
| No client-trusted prices | Claude | ✅ Yes |

---

## Definition of Done

A feature is **done** when:

1. ✅ Code merged to `main`
2. ✅ CI pipeline passes
3. ✅ Preview deployed and tested
4. ✅ Acceptance criteria verified
5. ✅ `project_status.md` updated
6. ✅ `change_log.md` updated
7. ✅ No open blockers

---

## Recommended Execution Order (V0)

```
Week 1:
├── Day 1-2: Setup (Steps 1-7 from SETUP_CHECKLIST.md)
├── Day 3: Infrastructure (Codex)
│   ├── Project scaffold (Next.js + Tailwind + shadcn)
│   ├── Supabase setup + base migrations
│   └── CI pipeline
├── Day 4-5: Auth (Codex)
│   ├── Supabase Auth integration
│   ├── Profile creation trigger
│   └── RLS policies

Week 2:
├── Day 1-2: Coverage (Codex)
│   ├── Google Maps integration
│   ├── Coverage check endpoint
│   └── Coverage UI component
├── Day 3-5: Menu (Codex)
│   ├── Menu data model + seed import
│   ├── Menu browse page
│   ├── Category tabs + sticky header
│   └── Item cards grid
├── Day 5: V0 Review (Claude)
│   ├── Full review against acceptance criteria
│   └── Sign-off or revision requests
```

---

*This workflow ensures consistent quality while enabling autonomous implementation.*
