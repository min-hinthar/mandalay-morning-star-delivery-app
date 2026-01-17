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
