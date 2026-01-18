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
| Path | Purpose |
|------|---------|
| `src/app/` | Next.js app router pages |
| `src/components/` | React components |
| `src/components/layouts/` | Layout primitives (Container, Stack, Grid, SafeArea) |
| `src/lib/` | Utilities, Supabase client |
| `src/lib/hooks/` | Custom hooks (useMediaQuery, useLuminance, useScrollDirection) |
| `src/lib/animations/` | Framer Motion utilities (cart.ts, tabs.ts, variants.ts) |
| `src/lib/micro-interactions.ts` | Reusable hover/tap/toggle variants |
| `src/lib/motion-tokens.ts` | Framer Motion presets |
| `src/lib/utils/cn.ts` | Class name utility (NOT `@/lib/utils`) |
| `src/styles/` | CSS files (tokens.css, responsive.css, high-contrast.css) |
| `src/types/` | Shared TypeScript types (checkout.ts, layout.ts) |
| `supabase/migrations/` | DB migrations |
| `docs/V{n}/` | Version docs (PRD.md, UX-Specs/, build-tasks/) |

## V5 Design Tokens
| Category | Pattern | Example |
|----------|---------|---------|
| Surface | `var(--color-surface-*)` | `--color-surface-primary`, `--color-surface-tertiary` |
| Text | `var(--color-text-*)` | `--color-text-primary`, `--color-text-secondary` |
| Status | `var(--color-status-*)` | `--color-status-error`, `--color-status-success-bg` |
| Interactive | `var(--color-interactive-*)` | `--color-interactive-primary` |
| Border | `var(--color-border-*)` | `--color-border-default` |
| Z-index | `var(--z-*)` | `--z-sticky`, `--z-modal`, `--z-toast` |
| Elevation | `var(--elevation-N)` | `--elevation-1` through `--elevation-6` |
| Motion | `var(--duration-*)`, `var(--ease-*)` | `--duration-fast`, `--ease-out` |

## Common Error Patterns
Check before debugging:
- **Import paths:** Use `@/lib/utils/cn` not `@/lib/utils`
- **Dynamic routes:** Consistent param names (`[id]` not mixed `[id]`/`[orderId]`)
- **Sentry serverless:** Add `await Sentry.flush(2000)` before response
- **Webhooks:** Use `createServiceClient()` to bypass RLS
- **Stripe metadata:** Create order first, then pass `order.id` to session
- **UI components:** Check if shadcn/ui component exists before importing

## Test Environment
Mocks required in `src/test/setup.ts`:
- `ResizeObserver` - jsdom lacks
- `window.matchMedia` - jsdom lacks
- `IntersectionObserver` - for scroll-spy/visibility detection

## Theme System
- Provider: `ThemeProvider` with `attribute="class"`
- Root layout: `suppressHydrationWarning` on `<html>`
- Avoid hard-coded: `bg-white` → `bg-background`, `text-charcoal` → `text-foreground`
- Animated gradients: Add `bg-black/15` overlay for text contrast

## Verification
Run before completing: `pnpm typecheck && pnpm test`

## MCP Tools
| Tool | Trigger | Action |
|------|---------|--------|
| Sentry | Bug fix, error report | Fetch trace first; `/seer` for AI root-cause |
| Playwright | UI change, E2E | Visual validation before commit |
| Supabase | DB issue, migration | Query logs, check schema |
| GitHub | PR, issue ref | Pull context, link commits |

## Session Learning
- **Errors:** `.claude/ERROR_HISTORY.md` - past bugs and fixes
- **Learnings:** `.claude/LEARNINGS.md` - patterns and conventions
- **Trigger:** `/retro` manually or auto on clean session exit

## Error Protocol
- **History:** Check `.claude/ERROR_HISTORY.md` before debugging
- **When to Log:**
  - Same error type 2+ times in session
  - Error spans >2 files
  - Non-obvious root cause
  - Skip: typos, simple one-offs
- **Diagnostics:** Use `sentry.get_issue` + `sentry.analyze_issue_with_seer`
- **Logging:** Use `Sentry.logger` with `{ userId, flowId }`
- **Verification:** `pnpm typecheck && pnpm test`
