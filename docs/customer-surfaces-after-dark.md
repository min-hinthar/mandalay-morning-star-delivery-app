# Customer Surfaces — "After Dark" Anthropic rollout

> Goal: extend the Anthropic **warm-paper "After Dark"** design language —
> already shipped on the **hero/homepage** (#143–#145) and the **menu** (#150–#152)
> — to the remaining **customer-facing** surfaces, checkout first.
>
> Standard: [`hero-design-language.md`](./hero-design-language.md) (read first).
> Component specs: [`frontend-design-system.md`](./frontend-design-system.md).
> This doc is the **sequencing + guardrails** for the rollout, owner-driven the
> same way the menu epic was (build → push → share preview → refine → adversarial
> review once satisfied → owner merges).

## The bar (unchanged)

Every surface layered, every number alive, every interaction responsive —
restrained cream/ink + clay/blue/sage triad on the kept sunset gradient,
editorial type (Fraunces + Hanken Grotesk + Padauk), maximal-but-tasteful
motion, 60fps, reduced-motion-safe, bilingual EN/MY, token-pure. Default
Tailwind/AI-template looks = not done.

## Sequence (one reviewable PR per surface, checkout first)

| #   | Surface                                   | Files (entry)                                                                                 | Why first / notes                                                                                             |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | **Checkout**                              | `(customer)/checkout/CheckoutClient` + steps (address / payment / review), `usePaymentSubmit` | Highest-intent surface; money + COD/Stripe. **Touch presentation only — never the payment/validation logic.** |
| 2   | **Cart drawer**                           | `components/ui/cart/CartOverlays`, `CartDrawer`, `cart` cards                                 | Already a bottom sheet on mobile (uses the shared `Drawer`); reskin to warm-paper + live totals.              |
| 3   | **Order confirmation / tracking**         | `(customer)/orders/[id]` (already >400 lines — split as you touch)                            | Anticipation is the product (scheduled delivery). Make the wait feel alive (countdown, route ritual).         |
| 4   | **Account** (settings / rewards / orders) | `(customer)/account/*`, `RewardsTab`                                                          | Rewards already has constellation language from #145 — extend the rest to match.                              |
| 5   | **Auth** (login / signup)                 | `(auth)/*` (already has `DomMaxProvider`)                                                     | Lower traffic; do last.                                                                                       |

> Prefer **independent PRs off `main`** (CI only runs on `branches:[main]`).
> One logical change each; verify locally before opening.

## Reuse the kit (don't reinvent — most of it shipped this session)

- **Surfaces:** `hero-surface-{glass,vellum,paper}` + `HeroCardLayers`
  (dots/grain/ticks/glow); **warm-paper cards** via `UnifiedMenuItemCard`'s
  `menu-paper` scope / the `warmPaper` prop.
- **Pinned toolbar (NEW, #155):** `MenuRail` is the reference pattern for a
  single de-duplicated sticky toolbar that **pins below the global `AppHeader`
  and slides in sync** with it (`useHeaderVisibility` + `getHeaderTransition`,
  publishing its measured height as a CSS var for downstream `scroll-mt`). Lean
  on the global header for cart + ⌘K search; don't duplicate them per-surface.
- **Pills/chips (NEW, #155):** active = **self-contained** `.menu-tab-active`
  (lit gold→clay gradient + dot-texture as _background layers_ + dark-ink label,
  all on ONE element); inactive = **vellum ghost** `.menu-tab-ghost`. Active
  filter chip = `.menu-cta-lit` / `.menu-chip-active`. Reuse; don't reinvent.
- **Full-page photo backdrop (NEW, #155):** `MenuPageAmbient` (viewport-`fixed`
  photo + 85% surface overlay + `MenuTextureBackdrop`) behind a **transparent,
  non-isolating** `<main>` so it sits behind ALL content incl. the footer.
- **Bottom-sheet filters (NEW, #155):** `MenuFiltersSheet` (shared `Drawer`
  `position="bottom"` + a visible bilingual heading + own `px` — `Drawer`
  renders `title` aria-only and adds no body padding).
- **Tokens (source of truth `tokens.css` → `@theme` in `globals.css`):** hero
  palette (`--hero-ink`, cream `--hero-card-bg`, `--hero-clay/-blue/-sage`,
  `--hero-accent`), menu accents (`--menu-clay`, `--menu-gold`), the active-pill
  tokens (`--menu-tab-active-from/-to/-ink/-ring/-glow`) + ghost-pill tokens
  (`--menu-tab-ghost-bg/-border/-sheen/-ink/-dot`), textures
  (`--menu-texture-dot/-line`). **Never hardcode** white/black/hex/z-index/blur —
  ESLint bans them; add a token + `@theme` map + utility. **Caution:**
  `--color-secondary` is bright **yellow** (`#ebcd00`) — never use `text-secondary`
  as body text on a light/cream/faint-yellow surface (it melds); it's only safe
  as a decorative icon on adequate contrast, or as a fill behind dark ink.
- **Motion:** signature springs from `motion-tokens`; hooks in
  `Hero/interactions.ts` (`useTilt`/`useMagnetic`/`useHeroParallax`/`useRipple`);
  `RollingDigits`/`RollingNumber` for **live numbers** (totals, counts — animate
  REAL values only); `HeroBurst` particles. Honor `useAnimationPreference`.
- **Bottom sheets:** the shared `Modal` (desktop centered / mobile bottom-sheet)
  - `Drawer` (`position="bottom"`). Both already clear the iOS status bar via
    `--sheet-max-h`. Swipe-to-close works on public surfaces now (`DomMaxProvider`
    is on `PublicShell`).

## Guardrails (hard-won this session — bake into every surface)

- **Mobile bottom sheets:** size with `--sheet-max-h`
  (`calc(100dvh - env(safe-area-inset-top) - 1rem)`), **not `vh`** — iOS `vh`
  counts behind the toolbar/notch and clips the sheet top. Floating close buttons
  go OUTSIDE any `overflow-hidden` clip.
- **iOS GPU/memory budget (caused a prod OOM):** NO mobile `backdrop-filter` /
  large `blur()`; gate heavy decorative layers `md:`+; radial-gradient glows over
  `blur()`. A **live WebGL Google map is desktop-only** (`tier === "desktop"`, not
  "high" — a high-core iPhone still OOMs). Mind animation COUNT.
- **iOS input auto-zoom:** any `<input>`/`<textarea>` the user focuses needs
  **≥16px** font on mobile (`text-base sm:text-sm`) or iOS zooms in and won't zoom
  back out. Checkout has many fields — audit them all.
- **`drag`/`layout`/`popLayout` need `domMax`.** Public + customer/auth shells now
  have `DomMaxProvider`. Still don't add a nested `LazyMotion` that framer-motion
  test mocks (e.g. `CheckoutClient.test`) don't stub — it breaks those tests.
- **Never trade correctness for polish on money paths.** Checkout's `notes`
  cap is `z.string().max(500)`; anything that composes onto user text must clamp
  (see `vegan-request.composeNotes`). Don't touch payment/validation logic while
  reskinning.
- **a11y is "done":** focus traps, `aria-pressed`/labels, live regions for
  changing totals (rolling digits are `aria-hidden` → keep an `sr-only` real
  value), ≥44px tap targets, reduced-motion paths on every signature animation.
- **Never fabricate data to look alive** — animate real values; no invented
  dietary/allergen/price claims.
- **`.menu-paper` (and any token-inverting scope) flips a subtree's TOKENS
  opposite to the theme** (`--color-surface-*`, `--color-text-*`,
  `--color-text-inverse`, `--color-primary*`). Content that _should_ invert with
  the card (price, name, qty stepper) keeps those tokens; **chrome floating over
  a photo** (favorite, close X, checkmark) must opt OUT — use tokens the scope
  does NOT remap and that key off the REAL theme: `bg-surface-elevated`, and
  icons `text-hero-ink dark:text-hero-card-strong` (both constant). Else it melds
  dark-on-dark in light mode. (#155 root-cause; same trap applies to any future
  inverted surface.)
- **Selected/active state must be SELF-CONTAINED** — put the contrast background
  AND the text on the SAME element (e.g. `.menu-tab-active` = gradient bg +
  dark-ink label). Never rely on a _separately-measured/positioned_ indicator div
  (placed via `offsetLeft`) to supply the background behind selected text: a
  measurement race / null state leaves the dark label on the bare surface —
  readable on a light rail, INVISIBLE on a dark one. (This was the recurring
  "active tab dark-on-dark in dark mode" bug; #155 fixed it architecturally.
  `Tabs.tsx` + `CommandPalette/SearchCategoryTabs.tsx` still use the measured
  pattern — audit if they ever show the symptom.)

## Process

Build → push → share the **clickable Vercel preview link** every reply →
refine on the owner's feedback → run the adversarial self-review (or
`security-review` for checkout) **only once the owner is satisfied, just before
merge** → triage the **auto-review after every push** → **never self-merge**
(owner's explicit per-PR go). Mobile-first on a narrow viewport for every change.
