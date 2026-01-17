# Mandalay Morning Star

## Output Style
- Terse, imperative language; no filler or explanations
- Bullets over prose; tables over lists when structured
- State facts, skip justifications

## Stack
Next.js 16 | React 19 | Supabase | Stripe | TailwindCSS | Zustand

## Commands
```
pnpm dev          # dev server
pnpm build        # production build
pnpm test         # vitest
pnpm test:e2e     # playwright
pnpm typecheck    # tsc --noEmit
```

## Plan Mode Rules
- Enter plan mode (Shift+Tab x2) for tasks affecting >2 files
- No code/agents until plan approved
- Use Explore agent for discovery, Plan agent for design
- Max 3 parallel agents; prefer 1 when scope is clear

## Model Tiers
| Task | Model |
|------|-------|
| Architecture, refactors, multi-file logic | Opus 4.5 |
| Boilerplate, tests, docs, lint fixes | Haiku 4.5 |

## Context Management
- `/compact` at 50% context
- `/clear` between unrelated tasks
- Read only @-mentioned files or direct dependencies
- Keep files <400 lines

## Paths
- `src/app/` - Next.js app router pages
- `src/components/` - React components
- `src/lib/` - Utilities, Supabase client
- `supabase/migrations/` - DB migrations

## Verification
Run before completing: `pnpm typecheck && pnpm test`

## MCP Tools
| Tool | Trigger | Action |
|------|---------|--------|
| Sentry | Bug fix, error report | Fetch trace first; `/seer` for AI root-cause |
| Playwright | UI change, E2E | Visual validation before commit |
| Supabase | DB issue, migration | Query logs, check schema |
| GitHub | PR, issue ref | Pull context, link commits |

## Error Protocol
- **History:** If a bug recurs, consult `.claude/ERROR_HISTORY.md` for known patterns. Do not @-mention the file unless relevant.
- **Diagnostics:** Use `sentry.get_issue` + `sentry.invoke_seer` to pull AI-analyzed root causes.
- **Plan Mode:** Propose a fix in Plan Mode before implementation. Use `/mod opus-4.5` for complex logic and `/mod haiku-4.5` for execution.
- **Logging:** Use `Sentry.logger` with `{ userId, flowId }`. Never use `console.log` in production.
- **Verification:** 
  1. Switch to `/mod haiku-4.5` for pre-commit.
  2. Run `pnpm typecheck && pnpm test`.
  3. For UI fixes, use Playwright MCP to verify visual diffs and contrast.
- **Finalize:** Append the fix summary to `ERROR_HISTORY.md`, then run `/clear` to reset context.
