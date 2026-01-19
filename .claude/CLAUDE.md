# Project Instructions

## Output Style
- Terse, imperative language; no filler or explanations
- Bullets over prose; tables over lists when structured
- State facts, skip justifications

## Stack
<!-- Fill in your project's stack -->
<!-- Example: Next.js 16 | React 19 | Supabase | Stripe | TailwindCSS | Zustand -->

## Commands
```
# Fill in your project's commands
# pnpm dev          # dev server
# pnpm build        # production build
# pnpm test         # unit tests
# pnpm test:e2e     # e2e tests
# pnpm typecheck    # type checking
```

## Agent Strategy
| Scope | Approach |
|-------|----------|
| Multi-file changes (>2 files) | Plan mode first |
| Single file | Direct implementation |
| Unknown scope | Explore agent for discovery |
| Design decisions | Plan agent for architecture |

## Model Selection
| Task | Model |
|------|-------|
| Architecture, refactors, multi-file logic | Most capable (Opus) |
| Boilerplate, tests, docs, lint fixes | Fast model (Haiku) |

## Context Hygiene
- `/compact` at 50% context usage
- `/clear` between unrelated tasks
- Read only @-mentioned files or direct dependencies
- Keep files <400 lines; split when larger

## Paths
<!-- Fill in your project's key paths -->
| Path | Purpose |
|------|---------|
| `src/app/` | App router pages |
| `src/components/` | React components |
| `src/lib/` | Utilities, clients |

## Session Memory
- `.claude/ERROR_HISTORY.md` - past bugs, root causes, fixes
- `.claude/LEARNINGS.md` - codebase patterns, conventions
- `/retro` - capture insights manually or on session exit

## Error Protocol
1. **Check history first:** Read `.claude/ERROR_HISTORY.md` before debugging
2. **When to log:**
   - Same error type 2+ times in session
   - Error spans >2 files
   - Non-obvious root cause
   - Skip: typos, simple one-offs
3. **Format:** date, type, severity, files, error, root cause, fix

## MCP Tools
| Tool | Trigger | Action |
|------|---------|--------|
| Sentry | Bug fix, error report | Fetch trace first; use AI root-cause |
| Playwright | UI change, E2E | Visual validation before commit |
| Supabase | DB issue, migration | Query logs, check schema |
| GitHub | PR, issue ref | Pull context, link commits |

## Verification
<!-- Fill in your verification command -->
Run before completing: `pnpm typecheck && pnpm test`
