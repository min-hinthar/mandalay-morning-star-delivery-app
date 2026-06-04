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

CI (`.github/workflows/ci.yml`) gates every PR with two **blocking** jobs:

- **verify** — lint, lint:css, format:check, typecheck, test:ci, build.
- **db-drift** — `supabase db start` (applies the single baseline) → `pnpm gen:types:check`. Fails if a migration changed the schema without a matching `pnpm gen:types`. Needs Docker; runs in CI.

## Workflow (standard — applies to every session)

This repo is built collaboratively across Claude sessions. Treat each unit of
work as a reviewed PR, not a direct push. **Pick this up at the start of every
session.**

1. **Branch + PR per task.** Develop on `claude/<slug>`; never push to `main`.
   Open a PR; merge only when CI is green. One logical change per PR.
2. **Verify before every PR.** Run the full verification suite locally
   (lint · lint:css · format:check · typecheck · test · build). Don't open a PR
   on red.
3. **Adversarial self-review = quality bar.** For any non-trivial change —
   especially auth / payments / RLS / money / migrations — spawn a **subagent to
   review the diff** (or run the `security-review` / `code-review` skill) and a
   parallel **subagent audit** of the area before building. Treat findings
   seriously; fix or justify each. This caught real bugs (cross-account coupon
   use, schema drift, COD loophole) before merge — keep doing it.
4. **Cross-session handoff.** When a task needs an external unblock (a connector,
   a secret, a fresh session for an MCP re-handshake) or spans sessions:
   - Write the plan + guardrails to `docs/<task>-plan.md` and commit it.
   - Leave the branch + an open PR; another session continues from the doc.
   - **Review the other session's PR**: pull CI logs, diagnose failures, and
     post a precise root-cause + fix as a PR comment (`mcp__github__add_issue_comment`).
     If you can finish it (e.g. Docker is available), do so and push.
   - Don't push competing commits to a branch another session owns mid-iteration
     unless you're taking it over with intent.
5. **CI failures are the task, not noise.** Kick → diagnose from the job logs
   (`mcp__github__get_job_logs`) → re-kick. Don't merge around a red blocking job.
6. **Schema changes.** Add a migration (`<timestamp>_name.sql` — the CLI skips
   other names), then `pnpm gen:types` and commit `database.generated.ts`, or
   the blocking `db-drift` job fails. Custom app-level types live in
   `src/types/database-custom.ts` (never edit `database.generated.ts` by hand).
7. **Capture learnings.** When a non-obvious bug or gotcha is fixed, add it to
   the Gotchas list below (or `.claude/learnings/`) so the next session inherits it.
8. **Connectors drop silently.** Supabase/GitHub MCPs can de-register mid-session;
   a re-enabled connector isn't re-injected — start a fresh session to re-handshake,
   or fall back to a session secret (`SUPABASE_DB_URL`) for DB access.

## Paths

| Path                    | Purpose                             |
| ----------------------- | ----------------------------------- |
| `src/app/`              | App Router pages (route groups)     |
| `src/app/(admin)/`      | Admin dashboard                     |
| `src/app/(customer)/`   | Customer UX (menu, cart, checkout)  |
| `src/app/(driver)/`     | Driver mobile interface             |
| `src/app/(public)/`     | Homepage, public menu               |
| `src/app/api/`          | API routes                          |
| `src/components/ui/`    | 500+ React components               |
| `src/emails/`           | 18 React Email templates            |
| `src/lib/`              | Utilities, clients, services        |
| `src/lib/loyalty/`      | Loyalty: Stars, tiers, rewards      |
| `src/lib/hooks/`        | 79 custom hooks                     |
| `src/lib/stores/`       | Zustand stores                      |
| `src/types/`            | TS defs (`database.generated.ts` + `database-custom.ts`) |
| `supabase/migrations/`  | Single squashed baseline (legacy in `migrations_archive/`) |
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
- **Multi-day delivery** — Mon/Wed/Thu/Sat (configurable via `delivery_days` table), per-day cutoffs, direction-based routing (East/West/South/All), coverage 50mi/90min from Covina CA
- **Distance-tiered fees** — >25mi: flat $20 (no free delivery); ≤25mi: $15 or free if subtotal ≥$100. Zone bearings in `delivery_zones` table, fee settings in `app_settings`
- **COD payment flow** — `pending_approval` status, admin approval via `/approve-cod` endpoint

## Gotchas (from learnings)

- `void asyncFn()` killed on Vercel — use `await` or `after()` for fire-and-forget
- Service client `auth.getUser()` returns null — use `auth.admin.getUserById()`
- `!value` falsy check on numbers treats 0 as missing — use `value == null`
- `getUTCDay()` wrong in LA timezone — use `getZonedDayOfWeek()` helper
- `@react-google-maps/api` crashes SSR — always `ssr: false` dynamic import
- `google.maps.*` in useMemo runs before API loads — guard with `if (!isLoaded) return null`
- PostgREST FK hints: adding a 2nd FK to same table (e.g. `declined_by` on `routes→drivers`) breaks ALL existing unqualified `drivers (` joins with PGRST201 — must add `!fk_name` hint to every query
- `DO NOTHING` / `ignoreDuplicates` won't fill NULL cols — use `DO UPDATE WHERE col IS NULL`
- `.update()` returns no row count — chain `.select("id")` to verify affected rows
- Webhook handlers: return 500 on DB errors for retry; never swallow into 200
- `loading="lazy"` + animated containers (opacity 0) = images never load
- Nested `overflow-y-auto` without explicit height — wheel events blocked
- `useRef` on conditional render targets breaks observers — use stable wrapper element
- Event listeners belong inside `useEffect`, not via `useCallback` with state deps
- `process.env.KEY` inlined at build — can't validate dynamically at runtime
- Marketing opt-in lives in `customer_settings.notification_prefs`, NOT `profiles` — reader fns/crons that used `profiles.notification_prefs` silently 500'd
- Migration filenames MUST be `<timestamp>_name.sql` — the Supabase CLI silently SKIPS others (e.g. a trailing `b`), so they never apply
- pgtap/plpgsql_check in `public` leak ~15 test fns into generated types and never byte-match local-vs-prod — keep test extensions in the `extensions` schema
- `gen types` from prod ≠ from local (`PostgrestVersion`, extension internals) — the committed `database.generated.ts` must be the LOCAL-stack output the drift guard checks
- Tiers = lifetime NET spend (subtotal − discount − refunds); coupons = per-order milestones. `pending_approval` (unpaid COD) excluded from loyalty

## Learnings

- Top gotchas inlined above — covers most recurring bugs
- Deep dives: `.claude/learnings/{topic}.md` (13 topic files)
- `.claude/learnings/INDEX.md` for full topic index

## Plugins

- **typescript-lsp** — LSP diagnostics for type checking
- **security-guidance** — warns on auth/payment/RLS code changes
- **commit-commands** — `/commit` and `/commit-push-pr` for standardized git workflow

## GSD Phase Hints

- After `/gsd:execute-phase`: run `/simplify` on changed files
- Before `/sync`: run `/retro` to capture learnings
- For new UI work: start with `/frontend-design` or `/prd-ux`

