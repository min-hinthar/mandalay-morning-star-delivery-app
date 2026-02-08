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
| Boilerplate, tests, docs, lint fixes | Sonnet (not Haiku) |
| Subagents (Explore, Plan, Research) | Inherit parent model (see global CLAUDE.md) |

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

## File Organization

Files must stay under 400 lines (ESLint `max-lines` warning). When splitting:

| File Type | Pattern | Entry File |
|-----------|---------|------------|
| UI Component | Subfolder with barrel | `ComponentName/index.tsx` |
| Lib/Utility | Subfolder with barrel | `lib-file/index.ts` |
| Admin Page | Co-located siblings | `page.tsx` + `SiblingComponent.tsx` |
| API Route | Co-located siblings | `route.ts` + `types.ts` + `schemas.ts` |

**Component subfolder:**
```
ComponentName/
  index.tsx          # Barrel re-exports
  SubComponent.tsx   # PascalCase
  useHook.ts         # camelCase
  helpers.ts         # camelCase
```

**Lib subfolder:**
```
lib-file/
  index.ts           # Barrel re-exports everything
  concern-a.ts       # By domain
  concern-b.ts
```

- Every extracted file using hooks/events needs `'use client'`
- Barrel `index.tsx` must re-export ALL original exports
- Import paths don't change (subfolder index resolves automatically)
- Exempt from 400-line rule: `src/types/**`, test files, Storybook stories

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
Run before completing: `pnpm lint && pnpm lint:css && pnpm typecheck && pnpm test && pnpm build`
