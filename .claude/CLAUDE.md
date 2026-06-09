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
   **You own the PRs your session opens end-to-end** — audit, verify, fix review
   findings, merge, and close them yourself. Don't rely on another session's
   review to catch your bugs; audit your own diff before handoff (this session's
   driver-completion gap and admin summary-data bug both nearly shipped on the
   assumption a reviewer would catch them).
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
     unless you're taking it over with intent (and say so in a PR comment).
   - **Default to review/comment-only on another session's PRs.** The owning
     session lands and closes its own work; don't force-push someone else's
     branch (incl. rebases) unless you've explicitly taken it over. Pushing a
     rebase to a branch another session is iterating on is the top cross-session
     confusion source.
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
9. **Track every open PR (cross-session).** PRs are the shared brain across
   sessions, not any one session's memory. **At session start**, reconcile
   in-flight work: read [`docs/open-prs.md`](../docs/open-prs.md), check each open
   PR's CI (`get_check_runs`) + unresolved threads (`get_review_comments`), and
   `subscribe_pr_activity` to any you'll watch. **Review** another session's PR
   adversarially against its *real* base (PRs stack — base is often another
   `claude/*` branch), post findings as a non-blocking `COMMENT` review tagged
   High/Med/Low with a clear verdict, and **update `open-prs.md`**. Subscriptions
   miss CI-success / new-pushes / merge-conflicts — re-check on a timer (or a
   `git ls-remote` `Monitor`); a watch ends only at merge/close. Full protocol:
   [`docs/collaborative-pr-review.md`](../docs/collaborative-pr-review.md).
10. **Prefer independent PRs off `main`; stack only for true dependencies —
    and stacks merge bottom-up, with squash breaking them.** CI is
    `pull_request: branches:[main]`, so a stacked PR's blocking jobs (`verify`,
    `db-drift`) **don't run until its base is `main`**. Merge the lowest PR first.
    Squash-merging a stacked **parent** makes the **child** go `dirty`: the
    parent's commits are no longer ancestors of `main`. Fix by rebasing the child
    onto `main`, replaying **only its own commits**:
    `git rebase --onto main <old-parent-tip> <child-branch>` → re-verify →
    `git push --force-with-lease`. **Never naive-retarget** a stacked child's base
    to `main` (it re-introduces the parent's already-squashed changes and can
    revert later fixes). Verify locally meanwhile, since the child has no CI until
    it sits on `main`.

## Collaborative iteration & merge protocol (this owner's workflow)

How visual/UX work is actually driven here — learned across the hero sessions:

- **Iterate on previews, don't gate every tweak behind a review.** Build → push →
  share the **clickable Vercel preview link** (every reply that ships a change
  includes the preview URL + PR link). Refine against the owner's feedback. Run
  the **adversarial review only once the owner is satisfied, just before merge** —
  not on every push (it wastes cycles mid-iteration).
- **Read the Claude auto-review after EVERY push, not just before merge.** The
  repo runs an automated Claude PR review on every push
  (`.github/workflows/claude-pr-review.yml`) — its findings are computed for free,
  so triage them continuously as a discipline: fetch the comments a minute or two
  after each push (`pull_request_read` → `get_comments` / `get_reviews` /
  `get_review_comments`) and **fix or explicitly justify every finding promptly**,
  rather than letting them pile up to a pre-merge batch. (This differs from the
  *self-spawned* adversarial subagent review, which stays a once-just-before-merge
  step to avoid wasting cycles mid-iteration.) The auto-review has caught real
  bugs: domMax/bundle gaps, a localStorage-migration bug, an allergen
  free-from-from-absent-data safety hole, and a notes-length checkout reject.
- **Never self-merge. Merge only on the owner's explicit, per-PR "go".** Open the
  PR, get CI green, surface the auto-review verdict, and ask. Approval of one PR
  is not approval of the next.
- **Mobile-first, always.** Check ratios, spacing, centering, and ≥44px tap
  targets on a narrow viewport for **every** UI change — not just desktop. Avoid
  layout twitch (no height-collapse gaps / scale-pops on collapse↔expand).
- **Consequential visual forks → recommendation-led options** via
  `AskUserQuestion` (the owner is a thorough-evaluator + design-conscious). For
  reversible polish, just build it and show the preview.
- **Framer features by route:** the root provider loads only `domAnimation`.
  `layout`/`popLayout`/drag need `domMax` — present on customer/admin/driver/auth
  shells AND now **`PublicShell`** (all via `DomMaxProvider`), since public pages
  host swipe-to-close drawers (cart, dish sheet). So drag works everywhere now;
  still keep heavy `layout`/`popLayout` off public surfaces for bundle/perf, and
  don't add a nested `LazyMotion` that framer-motion test mocks (e.g.
  `CheckoutClient.test`) don't stub — it breaks those tests.

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

## Design Language (UI/UX)

**Standard: [`docs/hero-design-language.md`](../docs/hero-design-language.md)** — read before ANY visual/motion work. Component specs: [`docs/frontend-design-system.md`](../docs/frontend-design-system.md). The bar: _every surface layered, every number alive, every interaction responsive — restrained palette + editorial type, maximal-but-tasteful motion, 60fps, reduced-motion-safe, bilingual, token-pure._ Default Tailwind/AI-template looks = not done.

- **Aesthetic** — Anthropic "warm paper": cream surfaces + ink + a clay/blue/sage accent triad, floating on the kept sunset gradient. Restraint in palette/type/composition; maximalism in motion/texture/depth.
- **Type (global)** — Fraunces (display serif, `font-display`) + Hanken Grotesk (body/UI, `font-body`/`font-sans`) + Padauk (`font-burmese`). Always bilingual EN/MY.
- **Tokens** — hero palette in `tokens.css` (`--hero-ink #141413`, cream `--hero-card-bg`, `--hero-clay #d97757`, `--hero-blue`, `--hero-sage`, `--hero-accent` = deep clay for accent TEXT), mapped in `globals.css @theme`. Triad cycles on non-text shapes; deep clay for accent text; amber for stars. Never hardcode — ESLint bans raw white/black/z-index/blur/hex; add a token + `@theme` map + use the utility.
- **Reuse (don't reinvent)** — surfaces `hero-surface-{glass,vellum,paper}` + `HeroCardLayers` (dots/grain/ticks/glow); textures `hero-dotgrid`/`hero-linegrid` (gradient-masked, never uniform full-bleed), grain, aurora; motion hooks in `Hero/interactions.ts` (`useTilt`/`useMagnetic`/`useHeroParallax`/`useRipple`), particles `HeroBurst`, odometer reels `RollingDigits`, `HeroSunburst`.
- **Non-negotiables** — reduced-motion honored (CSS via `@media (prefers-reduced-motion)`/`motion-safe:`; JS via `useAnimationPreference().shouldAnimate`); 60fps (animate transform/opacity only); rAF-throttle pointer; **pause CSS loops + detach window listeners offscreen** (IntersectionObserver); **no scroll-coupled background parallax** (motion sickness — pointer/gyro only); decorative layers `pointer-events-none` + `aria-hidden`; mobile = autoplay + tap + gyro (no hover). Mind animation COUNT (overload/battery) — dedupe competing layers.
- **Mobile GPU/memory budget (HARD limit — caused a prod iOS crash)** — NO `backdrop-filter` and NO large/full-screen `blur()` layers on mobile; stacking them allocates huge GPU buffers and **OOM-crashes the iOS WebKit tab** ("Can't open page" / endless reload). Mobile rules: opaque surfaces (backdrop-blur only `md:`+), gate heavy decorative layers behind `md:` (`hidden md:block`), use a `radial-gradient` transparent falloff instead of `blur()` for glows, cap floating-element/filter counts. The hero is **in view on load**, so offscreen-pause doesn't cut peak load — budget the *initial* composite.
- **Process** — bold POV; for consequential/irreversible choices (fonts, palette, big forks) present recommendation-led **options** via `AskUserQuestion`, research-backed (bundle/contrast/evidence). Detail is the job (timing/easing, spacing, contrast, layered depth, a micro-interaction on every interactive element). a11y + perf are part of "done". Never fabricate data to look alive — animate REAL values only. After adding CSS utilities, confirm they emit in built CSS. Calibrate + adversarial self-review after big visual adds.

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
- iOS WebKit OOM crash ("Can't open page"/reload, no Sentry error since the tab dies pre-report): stacked `backdrop-filter` + large `blur()` layers blow the mobile tab memory. Keep them `md:`-only; opaque surfaces + radial-gradient glows on mobile. (See Design Language § mobile budget.)
- A **live WebGL Google map** (`@react-google-maps/api`) is another iOS OOM source on low-end retina phones (WebGL context + tiles + animated markers) — gate it by `useDeviceTier()` (low/mid → static map image, desktop/high → live), and put `useJsApiLoader` inside a conditionally-_rendered_ child so the Maps SDK never loads on low-end (a parent that always mounts would load it regardless). `useDeviceTier` is SSR-safe (`low` first paint) so the swap can't cause a hydration mismatch. (See Design Language §7.3.)
- Nested `overflow-y-auto` without explicit height — wheel events blocked
- `useRef` on conditional render targets breaks observers — use stable wrapper element
- Event listeners belong inside `useEffect`, not via `useCallback` with state deps
- `process.env.KEY` inlined at build — can't validate dynamically at runtime
- Marketing opt-in lives in `customer_settings.notification_prefs`, NOT `profiles` — reader fns/crons that used `profiles.notification_prefs` silently 500'd
- Migration filenames MUST be `<timestamp>_name.sql` — the Supabase CLI silently SKIPS others (e.g. a trailing `b`), so they never apply
- pgtap/plpgsql_check in `public` leak ~15 test fns into generated types and never byte-match local-vs-prod — keep test extensions in the `extensions` schema
- `gen types` from prod ≠ from local (`PostgrestVersion`, extension internals) — the committed `database.generated.ts` must be the LOCAL-stack output the drift guard checks
- Tiers = lifetime NET spend (subtotal − discount − refunds); coupons = per-order milestones. `pending_approval` (unpaid COD) excluded from loyalty
- Offline at-least-once queue + terminal-state writes: a driver stop PATCH whose response is lost (network blip, or a 500 raised AFTER the row committed) gets re-queued. If the handler returns 400 on same-status re-submission (`delivered→delivered` is an invalid transition), the queue marks a SUCCESSFUL delivery as a permanent failure + error toast. Same-status re-submits must short-circuit to idempotent 200. Corollary: never 500 a request for a secondary side-effect (stop promotion) after the primary write committed — log + return 200, client refetches
- Route `start` must be idempotent: do the order→`out_for_delivery` transition as part of a retryable start (allow re-entry when already `in_progress`, guard first-stop enroute to `status=pending`) and surface order-transition failure as 500. Otherwise orders strand in `preparing` while the route runs, and the delivered-stop optimistic lock (`.eq("status","out_for_delivery")`) blocks them from ever reaching `delivered`
- Vercel's GitHub→preview webhook intermittently DROPS a commit pushed from the cloud/CI env → no Preview deployment for that SHA: the branch alias keeps serving the PREVIOUS commit (stale preview) and the `review` job loops on "No GitHub Deployment yet". Safety net = `.github/workflows/ensure-preview.yml` (#149): forces a preview via the Vercel API when none exists for the PR head (needs `VERCEL_TOKEN`). Manual fallback: re-push (even an empty commit re-fires the webhook)
- bash `$UID` is a READONLY builtin (the real user id) — never `UID=$(...)` in a CI `run:` step (GitHub's shell is `bash -e`, so it aborts with "readonly variable"). Use any other name
- **GitHub Actions quota/billing exhausted = ALL workflows fail at STARTUP, ~2s, no logs (job-log fetch 404s), across every separate workflow at once.** This is NOT a code failure and re-kicking (empty commit) does NOT help — the runner can't start. Private-repo CI draws account Actions minutes; a long push-heavy day can hit the cap mid-session. Don't burn cycles diagnosing the diff — verify LOCALLY (`lint · lint:css · format:check · typecheck · test · build`) and, with the owner's OK, merge via branch-protection bypass (a `mergeable_state:"clean"` PR merges even with the checks red/absent). Re-enable required checks once quota resets. (Distinguish from a transient single-job flake, which a re-kick fixes.)
- **stylelint `selector-class-pattern` enforces kebab-case — it REJECTS BEM `--` modifiers.** Name state variants `menu-rail-chip-warn`, not `menu-rail-chip--warn`. (Also recurring: `comment-empty-line-before` — put a blank line before every CSS comment inside a rule/block.)
- **3D tilt on cards (`useTiltEffect`, was 18°) hurts more than it helps on the menu grid:** under `transform-style: preserve-3d`, a card's `backdrop-filter`/`box-shadow` renders a hard SQUARE color-shadow artifact, and the swing moves the Add button out from under the cursor (primary CTA hard to click on desktop). `menu`-variant cards now set `enableTilt: false` and fall back to the clean scale-up + clay-glow hover. Don't re-enable tilt on a card whose body holds the main CTA.
- **Card elevation over a photo:** a tight contact shadow (low blur + negative spread, e.g. `0 2px 7px -3px`) reads as a hard square frame against a busy photo backdrop — use a soft two-tier diffuse shadow (tight ambient + wide diffuse) so the card reads as a gently-lifted rounded panel.
- Loyalty tier display-rename WITHOUT a migration: keep `LoyaltyTier.id` stable (internal key for coupons/tiers/early-access/DB), change only `name`/`english`/`emoji` — it auto-propagates to emails + account + admin (all read `LOYALTY_TIERS`). Watch-fors: (a) tier ACCENT color lives in TWO maps that must agree — `RewardsTab/tierStyle.ts` (account) AND `admin/referrals/TierDistribution.tsx` (admin); (b) read the emoji from `LOYALTY_TIERS[].emoji`, don't fork it in components; (c) grep `TIER_PERKS` for the old name (a renamed tier still advertising the old badge); (d) self-contained test fixtures (`TierBadge.test`, `loyalty-reward.test`) hardcode the old name and silently still pass — refresh them
- `.hero-anim-paused` pauses CSS animations ONLY; framer-motion JS loops (`repeat: Infinity` — comet, glow pulse) keep ticking offscreen. Gate them with `useInView(ref)`: `const loop = shouldAnimate && inView`, then render/animate the loop only when `loop`
- Mobile bottom sheets (`Modal` mobile variant + `Drawer position="bottom"`) must size with the `--sheet-max-h` token (`calc(100dvh - env(safe-area-inset-top) - 1rem)`), NOT `vh` — iOS `vh` uses the LARGE viewport (behind the toolbar/notch), so a `90vh`/`95vh` sheet's top hides under the status bar (clipped close button / checkout header). Floating close buttons go OUTSIDE any `overflow-hidden` image clip
- A high-core iPhone reports `useDeviceTier()` = **"high"**, but a high core count does NOT lift WebKit's per-TAB memory ceiling — so the live WebGL Google map must be **`tier === "desktop"` only** (`liteMap = tier !== "desktop"`), or it OOM-reloads the tab on the menu→homepage path (cumulative image memory + WebGL). All mobile gets the static coverage map
- iOS Safari **auto-zooms** on focusing any `<input>`/`<textarea>` with font-size <16px and never zooms back out. Shared `Textarea`/inputs use `text-base sm:text-sm` (16px on mobile). Audit every customer form (checkout) for this
- Swipe-to-close (`useSwipeToClose`) is built on framer `drag` → needs `domMax`. Public pages were `domAnimation`-only so the dish/cart drawer swipe was inert there; `PublicShell` now wraps `DomMaxProvider` (lazy domMax). Still never add a nested `LazyMotion` that `CheckoutClient.test`-style mocks don't stub
- `RollingDigit` (odometer reels) must sit on the text baseline via an invisible baseline anchor + `leading-none` — `items-center` vertical-centering makes digits ride HIGH vs adjacent text (visible on hero cards + the dish total). Rolling digits are `aria-hidden` → keep an `sr-only` real value so the CTA accessible name keeps the amount
- **Dietary/allergen model** (`lib/menu/dietary-filters.ts`): free-from filters are FAIL-SAFE — an item with no declared `allergens` is _unknown_ → excluded, UNLESS tagged `allergen-reviewed` (audited; empty = genuinely none). Never assert a free-from claim from absent data; the filter row shows a "based on declared ingredients — confirm with us" disclaimer when a free-from chip is active. `vegan` matches `vegan`+`vegan-optional`; `vegetarian` matches `vegetarian`+`vegan`. **"Vegan on request"** (`lib/menu/vegan-request.ts`): a `vegan-optional` dish shows a "Make it vegan" toggle that prepends a bilingual kitchen note to the order line — `composeNotes` clamps to the 500-char checkout cap (`checkout.ts notes.max(500)`), `splitVeganNote` round-trips on the STABLE English prefix (Burmese/IDB-persisted carts may differ). Menu allergen/dietary data lives in the DB (live) + mirrored to `data/menul.seed.yaml` (the seed is stale of several DB-only items — reconcile the item you touch)
- **`.menu-paper` inverts a subtree's TOKENS — over-photo chrome must opt out.** The "After Dark" card/modal class remaps `--color-surface-{primary,secondary,tertiary}`, `--color-border-default`, `--color-text-{primary,secondary,muted}`, `--color-primary(-hover)`, and **`--color-text-inverse`** to the inverted card palette (espresso in light / cream in dark). So any control INSIDE a card/sheet that uses those tokens flips with the card, not the theme. Chrome that floats over the **photo** (favorite heart, modal close X, the add-to-cart checkmark) must NOT inherit that — it melded dark-on-dark in light mode (`bg-surface-primary`→espresso, `text-text-inverse`→dark ink). Fix = use tokens `.menu-paper` does NOT remap and that key off the REAL theme: surfaces `bg-surface-elevated` (theme-true white/dark), and icons `text-hero-ink dark:text-hero-card-strong` (both are CONSTANT, defined once in `:root` — hero-ink always #141413, hero-card-strong always cream). Content that SHOULD invert (price, name, qty stepper) correctly keeps the remapped tokens. Drawer (`Drawer.tsx`) renders `title` as **aria-only** + has **no body padding** — bottom-sheet callers must add their own visible heading + `px`
- **Menu category pill system** (`globals.css` `.menu-tab-*` + `tokens.css` `--menu-tab-*`): active = lit **gold→clay** cap (`.menu-tab-active` — gradient + faint dot-texture as **background-image layers** + dark-ink label color + glow/ring/sheen, all on the SAME button element); inactive = **vellum ghost** pills (`.menu-tab-ghost`: warm translucent fill + gold-leaf hairline + sheen + whisper dots, muted ink, clay-tint hover). **SELF-CONTAINED active-state rule (root-caused a recurring "active tab text dark-on-dark in dark mode" bug):** never rely on a SEPARATELY-MEASURED/positioned element (an absolute "indicator" div placed via `offsetLeft`) to supply the contrast background behind selected text — a measurement race / null state leaves the dark label on the bare rail (fine on the light rail, INVISIBLE on the dark rail). Put the bg + text on one element. (`src/components/ui/Tabs.tsx` and `CommandPalette/SearchCategoryTabs.tsx` still use the measured-indicator pattern — audit them if their active label ever goes dark-on-dark.) Tabs live in `CategoryTabs` (pure scroller) composed by **`MenuRail`** (the sole pinned toolbar: search + tabs + `RailCutoffChip` + Filters→`MenuFiltersSheet`); cart + ⌘K search are the global `AppHeader`'s (don't re-add them to the rail). Rail pins at `top: offline + --header-height` and animates `y` in sync with `useHeaderVisibility` so it never overlaps the retracting header. The page scroll-spy/offset (`useActiveCategory.getDynamicOffset`) must add `--menu-rail-height` too, or tab-click scrolls land the heading UNDER the pinned rail
- **`next/image` `fill` forces inline `position:absolute`** — you CANNOT override to `fixed`/static via className (inline style wins). For a zoom/viewport-controlled photo background, wrap `<Image fill>` in a BOUNDED, masked container (a top band `h-[Nvh]` + `mask-image: linear-gradient(to bottom, #000 N%, transparent)` fade), not a full-bleed cover. A landscape photo under `object-cover` over a very TALL scroll column (checkout) center-crops into a heavy zoom (worst on narrow mobile); the bounded band shows more of the photo and dissolves into the surface below. `mix-blend-soft-light` at low opacity MELDS a photo INTO an existing gradient bg (vs. an opaque overlay that covers it). See `CheckoutBackdrop`
- **The custom `Tooltip` (`components/ui/Tooltip`) is INLINE-positioned** (`absolute left-1/2 -translate-x-1/2 bottom-full`), NOT portaled — a parent with `overflow-hidden` clips the popover, and a near-edge trigger overflows horizontally. Fix = drop `overflow-hidden` on the card (or move the trigger inboard); keep tooltip copy short + a `max-w`
- **Loyalty milestone math: `ordersToNextMilestone(stars)` is NEVER ≤ 0** (`nextMilestone` is STRICTLY above — at stars=5 it returns 5, not 0). So never build a "reward ready" UI state off `ordersToNext <= 0` — it's dead for live data (milestone rewards are issued server-side as coupons; the checkout card only ever shows *progress*). Cycle progress = `stars % step` (= `step − ordersToNext`); the arc resets to empty right after a reward is earned (correct)
- **`useRewardsSummary(enabled)` takes a REQUIRED bool, but `useQuery` runs regardless of `enabled`** → it still needs a `QueryClientProvider`. Any component using it (e.g. `CheckoutRewardsCard`) that renders in a test WITHOUT a provider (`CheckoutClient.test`) must be **stubbed** (`vi.mock`). Same for `Modal`-owning children whose framer `useReducedMotion` the test's framer mock doesn't export (`OfferBanner`, `CheckoutBackdrop`) — stub them in suites that don't wrap providers
- **`.checkout-sheet-stack`** (two offset cream sheets behind a card) reads as "stacked paper" — REMOVE it from a surface you want read as self-contained (the thermal-print **receipt** dropped it). **Thermal-print receipt reveal** (`CheckoutSummaryV8`): the moving print-head light must be a SIBLING OUTSIDE the `clipPath`-revealed element (else it's clipped); sync its `top` 0→100% to the clip duration. Totals stay **presentation-only** — never change the tip/tax/discount/total math while reskinning
- **`--menu-*` texture/color vars are GLOBAL** (`:root` + `.dark` in `tokens.css`), so `MenuTextureBackdrop` (gradient-masked dot/line grids + triad glow blooms) is reusable on ANY surface — checkout reuses it via `CheckoutBackdrop`. The shared "menu background" photo is `/images/menu-section-bg.webp` (also behind `HomepageMenuSection`)
- **400-line `max-lines` cap is enforced at COMMIT** (lint-staged runs `eslint --max-warnings=0` on staged files, so a changed file over the *counted* limit blocks the commit even though `pnpm lint` only warns). When a reskin pushes a file over, extract co-located siblings (`CheckoutSummaryRows`; the `RewardsStarArc`/`RewardCoin`/`RewardsTierLadder` family) and dedupe repeated motion props into ONE spread object (`stepMotion` shared by the three checkout step panes) — keep the `m.div` as `AnimatePresence`'s keyed child so transitions are unchanged
- **`--color-secondary` is BRIGHT YELLOW (`#ebcd00` light / `#ffe066` dark)** — so the Tailwind class `text-secondary` (the yellow brand color, NOT `text-text-secondary` the muted-grey TEXT token) is UNREADABLE as body text on white/cream/light or faint-yellow (`bg-secondary/10–30`) surfaces — it melds. Yellow *icons* are usually fine. For readable accent text on light, use the theme-aware `text-primary` (crimson→pink) or `text-text-primary`; `text-hero-accent` is CONSTANT deep-clay (`#9a3412`) so it melds on dark surfaces. (Swept homepage/checkout for this in #155: CTABanner free-delivery pill, the "Our Menu"/"What LA Says" kicker chips, the checkout "Default" badge, the menu "Featured" badge.)
- **Full-page fixed photo backdrop** (`MenuPageAmbient`): a viewport-`fixed -z-10` decorative layer must sit behind a **transparent, non-isolating** `<main>` (no `bg-*`, no `isolate`/transform/filter) so the negative-z layer escapes to the root stacking context and paints behind ALL content incl. the trailing footer. If `<main>` is `isolate` + opaque-bg, a `fixed` child paints OVER the sibling footer (hidden footer) — and switching it to `absolute` instead crops the photo to the full tall page (zoomed). `object-cover` + `fixed` keeps the looser viewport framing
- **Tailwind v4 NEVER loads `tailwind.config.ts` (no `@config` in globals.css) — JS-config utilities are SILENT no-ops.** `z-modal-backdrop` (and any `zClass.*`-style class from the JS config) emits NOTHING in built CSS; the element gets `z-index: auto` and stacking falls back to DOM order (TierUpCelebration painted under the wax seal; `TrackingPageClient` has the same latent bug). Same class of bug as `animate-spin-slow`, which was used in 2 components but defined NOWHERE. Before relying on any non-default utility, grep the BUILT CSS (`grep -rl <class> .next/static/css/`) — "build green" doesn't mean the class exists. Fix = plain `@layer utilities` class / `@theme` token / standard `z-50`.
- **A spread that carries its own `style` (e.g. `useSwipeToClose().motionProps`) REPLACES an earlier `style={{...}}` prop wholesale** — the drawer's `{...motionProps}` after `style` silently killed `paddingTop: env(safe-area-inset-top)`. Spread hooks' props FIRST, then your explicit props.
- **Breakpoint-coupled positioning must use the SAME breakpoint as the layout it depends on.** The mobile↔desktop `AppHeader` switches at `md:`, but the profile dropdown flipped its anchor at `sm:` → at 640–767px it right-aligned to a left-edge avatar and opened off-screen. When an overlay's anchor depends on where its trigger sits, tie both to one breakpoint constant.
- **`contrast-audit.test.ts` hardcodes token hex values as fixtures** — changing dark/light surface or text tokens in `tokens.css` does NOT fail the suite until you refresh the fixtures (the dark lift was "1180 green" while 4 combos silently fell below AA). Treat that test as part of any token change: update fixtures, recompute, fix real failures (dark `--color-text-muted` is `#a8a5a1` for this reason).
- **Serwist update flow:** browsers only re-fetch `sw.js` on hard navigations (~daily) — a long-lived tab/PWA NEVER sees a deploy unless you call `registration.update()` on a heartbeat + visibility/online wake. And guard `controllerchange` against the FIRST install (`clientsClaim: true` fires it for brand-new visitors → surprise mid-browse reload racing chunk loads). Chunk-load failures need a one-shot `location.reload()` (cooldown-guarded) in the route error boundary — `reset()` just re-requests the dead chunk URL.

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

## PR Review Automation

- **Active:** `.github/workflows/claude-pr-review.yml` runs Claude on every PR push
  (`opened`/`synchronize`/`reopened`) and posts severity-tagged inline + summary comments.
  Open the repo in an active session and the comments are already there — no need to re-prompt
  "review this".
- **Review calibration lives in** `.github/claude-review-prompt.md` (severity weights: security /
  payments / order-lifecycle = heavy; bugs / perf = medium; taste / style = light). Edit that file
  to tune the review — no YAML changes needed; the workflow just points Claude at it.
- **Test a prompt change before merging:** push to a branch, open a PR, watch the run in the Actions
  tab; iterate on `.github/claude-review-prompt.md` and push again.
- **Auth:** `CLAUDE_CODE_OAUTH_TOKEN` (Max-covered, `claude setup-token`) or `ANTHROPIC_API_KEY`,
  set as a repo Actions secret. Model override via repo variable `CLAUDE_REVIEW_MODEL`.

