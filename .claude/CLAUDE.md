# Project Instructions

## Output Style

- Terse, imperative language; no filler or explanations
- Bullets over prose; tables over lists when structured
- State facts, skip justifications

## Stack

Next.js 16 (App Router) | React 19 | TypeScript 5 (strict) | Tailwind CSS v4 + shadcn/ui + Radix UI | Zustand + TanStack React Query | React Hook Form + Zod | Supabase (Auth + Postgres + RLS + Storage) | Stripe | Resend + React Email | Serwist (PWA) | Sentry | Vitest + Playwright | Storybook

## Commands

```bash
pnpm dev               # dev server
pnpm build             # production build
pnpm start             # production server
pnpm test              # unit tests (Vitest)
pnpm test:ci           # CI tests (bail on first)
pnpm test:e2e          # E2E tests (Playwright)
pnpm lint              # ESLint
pnpm lint:css          # Stylelint
pnpm typecheck         # tsc --noEmit
pnpm format:check      # Prettier check
pnpm storybook         # Storybook dev (port 6006)
pnpm analyze           # bundle analysis
pnpm seed:menu         # seed menu from YAML
pnpm rls:test          # test RLS policy isolation
```

## Verification

Run before completing: `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`

## Paths

| Path                    | Purpose                             |
| ----------------------- | ----------------------------------- |
| `src/app/`              | App Router pages (route groups)     |
| `src/app/(admin)/`      | Admin dashboard                     |
| `src/app/(customer)/`   | Customer UX (menu, cart, checkout)  |
| `src/app/(driver)/`     | Driver mobile interface             |
| `src/app/(public)/`     | Homepage, public menu               |
| `src/app/api/`          | API routes                          |
| `src/components/ui/`    | 70+ React components                |
| `src/emails/`           | React Email templates               |
| `src/lib/`              | Utilities, clients, services        |
| `src/lib/hooks/`        | 30+ custom hooks                    |
| `src/lib/stores/`       | Zustand stores                      |
| `src/types/`            | TypeScript definitions              |
| `supabase/migrations/`  | Database migrations                 |
| `data/`                 | Menu seed YAML                      |
| `e2e/`                  | Playwright tests                    |
| `docs/`                 | Architecture guides                 |

## File Organization

Files must stay under 400 lines (ESLint `max-lines` warning). When splitting:

| File Type    | Pattern               | Entry File                             |
| ------------ | --------------------- | -------------------------------------- |
| UI Component | Subfolder with barrel | `ComponentName/index.tsx`              |
| Lib/Utility  | Subfolder with barrel | `lib-file/index.ts`                    |
| Admin Page   | Co-located siblings   | `page.tsx` + `SiblingComponent.tsx`    |
| API Route    | Co-located siblings   | `route.ts` + `types.ts` + `schemas.ts` |

**Component subfolder:**

```
ComponentName/
  index.tsx          # Barrel re-exports
  SubComponent.tsx   # PascalCase
  useHook.ts         # camelCase
  helpers.ts         # camelCase
```

- Every extracted file using hooks/events needs `'use client'`
- Barrel `index.tsx` must re-export ALL original exports
- Exempt from 400-line rule: `src/types/**`, test files, Storybook stories

## Critical Notes

- **React Compiler enabled** — auto-memoizes client components, no manual useMemo
- **Tailwind v4** — `@theme inline` is source of truth; `tailwind.config.ts` content is dead code
- **62+ design tokens** enforced via ESLint (z-index, colors, spacing, shadows, blur)
- **Serwist PWA** — service worker built separately via `scripts/build-sw.mjs`
- **Multi-day delivery** — Mon/Wed/Thu/Sat (configurable via `delivery_days` table), per-day cutoffs, coverage 50mi/90min from Covina CA
- **COD payment flow** — `pending_approval` status, admin approval via `/approve-cod` endpoint

## Learnings

- `.claude/learnings/INDEX.md` - scan first, links all 13 topic files
- `.claude/ERROR_HISTORY.md` - past bugs, root causes, fixes

## Plugins

- **typescript-lsp** — LSP diagnostics for type checking
- **security-guidance** — warns on auth/payment/RLS code changes
- **commit-commands** — `/commit` and `/commit-push-pr` for standardized git workflow

## GSD Phase Hints

- After `/gsd:execute-phase`: run `/simplify` on changed files
- Before `/sync`: run `/retro` to capture learnings
- For new UI work: start with `/frontend-design` or `/prd-ux`

