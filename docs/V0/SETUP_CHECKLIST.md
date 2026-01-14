# Setup Checklist — Mandalay Morning Star

> Complete these 7 steps to prepare for implementation.

---

## Step 1: GitHub Repository + Branch Strategy

### 1.1 Create Repository
```bash
# Create new repo on GitHub
Repository name: mandalay-morning-star
Visibility: Private
Initialize with: README.md, .gitignore (Node)

# Clone locally
git clone git@github.com:YOUR_ORG/mandalay-morning-star.git
cd mandalay-morning-star
```

### 1.2 Branch Protection Rules
Navigate to Settings → Branches → Add rule for `main`:

| Rule | Setting |
|------|---------|
| Require PR before merging | ✅ Enabled |
| Require status checks | ✅ lint, typecheck, test, build |
| Require review | ✅ 1 approval (or 0 for solo dev) |
| Dismiss stale reviews | ✅ Enabled |
| Include administrators | ✅ Enabled |

### 1.3 Branch Naming Convention
```
feat/<area>-<short>     # New features
fix/<area>-<short>      # Bug fixes
docs/<area>-<short>     # Documentation only
chore/<area>-<short>    # Maintenance

Examples:
feat/auth-signup
feat/menu-browse
fix/checkout-fee-calc
docs/api-endpoints
```

### 1.4 PR Template
Create `.github/PULL_REQUEST_TEMPLATE.md`:
```markdown
## What Changed
<!-- Brief description of changes -->

## Why
<!-- Link to issue or explain motivation -->

## Screenshots/GIF
<!-- Required for UI changes -->

## Test Evidence
<!-- How did you verify this works? -->

## Checklist
- [ ] TypeScript strict mode passes
- [ ] Lint passes
- [ ] Unit tests added/updated
- [ ] RLS policies tested (if applicable)
- [ ] Migrations are idempotent
- [ ] Mobile responsive (if UI)
```

---

## Step 2: Environment Variables Plan

### 2.1 Create `.env.example`
```bash
# ===========================================
# Mandalay Morning Star - Environment Variables
# ===========================================
# Copy to .env.local and fill in values

# ----- Supabase -----
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-only!

# ----- Stripe -----
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ----- Google Maps -----
GOOGLE_MAPS_API_KEY=AIza...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...  # Client-side (restricted)

# ----- App Config -----
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_KITCHEN_LAT=34.0874
NEXT_PUBLIC_KITCHEN_LNG=-117.8894
NEXT_PUBLIC_MAX_DISTANCE_MILES=50
NEXT_PUBLIC_MAX_DURATION_MINUTES=90
NEXT_PUBLIC_DELIVERY_FEE_CENTS=1500
NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD_CENTS=10000
```

### 2.2 Environment Variables Reference

| Variable | Client? | Purpose |
|----------|---------|---------|
| SUPABASE_URL | ✅ | Database + Auth endpoint |
| SUPABASE_ANON_KEY | ✅ | Public API key (RLS protects) |
| SUPABASE_SERVICE_ROLE_KEY | ❌ | Admin operations (webhooks) |
| STRIPE_PUBLISHABLE_KEY | ✅ | Client-side Stripe |
| STRIPE_SECRET_KEY | ❌ | Server-side Stripe |
| STRIPE_WEBHOOK_SECRET | ❌ | Verify webhook signatures |
| GOOGLE_MAPS_API_KEY | ❌ | Server-side geocoding |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | ✅ | Client map display |

---

## Step 3: CLAUDE.md Project Memory

Already created at `/CLAUDE.md`. Keep this file:
- Under 100 lines
- Updated when major decisions change
- Linked to detailed docs (not duplicating them)

**Review checklist**:
- [ ] Core business rules accurate
- [ ] Tech stack correct
- [ ] Current milestone updated
- [ ] Open decisions listed

---

## Step 4: Documentation Structure

### 4.1 Required Documents
Create these files in `/docs/`:

| File | Purpose | Status |
|------|---------|--------|
| `PROJECT_SPEC.md` | Full requirements + design | ✅ Created |
| `architecture.md` | System diagrams | ✅ Created |
| `change_log.md` | Version history | ✅ Created |
| `project_status.md` | Progress tracking | ✅ Created |
| `api-reference.md` | API endpoints | ⏳ Create during V1 |
| `deployment.md` | Deployment procedures | ⏳ Create during V1 |
| `testing.md` | Test strategy details | ⏳ Create during V1 |

### 4.2 Feature Spec Template
For each new feature, create `docs/features/<feature-name>.md`:
```markdown
# Feature: <Name>

## Goals
- What problem does this solve?

## Non-Goals
- What are we NOT doing?

## User Stories
- As a [persona], I want to [action] so that [benefit]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|

## API Contract
- Endpoint, request, response, errors

## Data Model Changes
- New tables, columns, migrations

## UI States
- Loading, empty, error, success

## Test Plan
- Unit tests, integration tests, E2E

## Security Notes
- RLS, validation, auth requirements

## Rollout
- Feature flags, gradual rollout plan
```

---

## Step 5: Recommended Tooling

### 5.1 VS Code Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-azuretools.vscode-docker",
    "github.copilot"
  ]
}
```

### 5.2 VS Code Settings
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### 5.3 Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:migrate": "supabase migration up",
    "db:reset": "supabase db reset",
    "db:seed": "tsx scripts/seed-menu.ts",
    "stripe:listen": "stripe listen --forward-to localhost:3000/api/webhooks/stripe"
  }
}
```

### 5.4 Git Hooks (Husky + lint-staged)
```bash
pnpm add -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## Step 6: MCP Integrations (Recommended)

### 6.1 Supabase MCP
For database operations during development:
```json
// Claude Desktop config
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJ..."
      }
    }
  }
}
```

### 6.2 Stripe MCP (Already Connected)
You already have Stripe MCP connected. Use for:
- Creating test customers
- Viewing payment intents
- Testing webhook flows

### 6.3 Sentry MCP (Already Connected)
Use for:
- Error monitoring
- Performance tracking
- Release tracking

### 6.4 Playwright MCP (Optional)
For E2E test debugging:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic/mcp-playwright"]
    }
  }
}
```

---

## Step 7: Custom Commands + Sub-Agents

### 7.1 Recommended /commands

Create these as saved prompts or Claude projects instructions:

#### `/plan <feature>`
```
Read the PROJECT_SPEC.md and create a feature spec for <feature>.
Include: goals, user stories, acceptance criteria, edge cases, API contract,
data model changes, UI states, test plan, security notes.
Output as docs/features/<feature>.md
```

#### `/review <PR description>`
```
Review this PR against the spec. Score 1-10 on:
- Correctness vs spec
- Security/RLS/webhooks
- UX quality + responsiveness
- Test coverage
- Maintainability
Flag any blockers. Be specific about what needs fixing.
```

#### `/test <feature>`
```
Generate test cases for <feature> including:
- Unit tests (Vitest) for business logic
- Integration tests for API endpoints
- E2E tests (Playwright) for user flows
- Edge cases and error scenarios
```

#### `/status`
```
Update docs/project_status.md with current progress.
Mark completed tasks, update percentages, note any blockers.
```

### 7.2 Sub-Agent Patterns

#### Planner Agent
```
Role: Feature planning and spec writing
Input: High-level requirement
Output: Detailed feature spec (docs/features/*.md)
Skills: Reads PROJECT_SPEC.md, understands business rules, writes acceptance criteria
```

#### Reviewer Agent
```
Role: PR review and quality gates
Input: PR diff + description
Output: Review comments + approval/rejection
Skills: Security review, RLS verification, test coverage check
```

#### Tester Agent
```
Role: Test generation and execution
Input: Feature spec or code
Output: Test files + coverage report
Skills: Vitest for unit, Playwright for E2E, mocking strategies
```

#### UI-Polish Agent
```
Role: Visual refinement and accessibility
Input: Component code + screenshot
Output: Improved styling + a11y fixes
Skills: Tailwind patterns, Framer Motion, WCAG compliance
```

---

## Completion Checklist

Before starting implementation, verify:

- [ ] **Step 1**: GitHub repo created with branch protection
- [ ] **Step 2**: `.env.example` committed (no secrets!)
- [ ] **Step 3**: `CLAUDE.md` reviewed and accurate
- [ ] **Step 4**: All docs in `/docs/` present
- [ ] **Step 5**: VS Code config committed
- [ ] **Step 6**: MCP integrations documented
- [ ] **Step 7**: Custom commands saved

### External Services Setup

- [ ] **Supabase**: Project created, connection string saved
- [ ] **Stripe**: Test account created, API keys saved
- [ ] **Google Maps**: API key created, billing enabled
- [ ] **Vercel**: Project linked to GitHub repo

---

*Once all checkboxes are complete, proceed to V0 implementation.*
