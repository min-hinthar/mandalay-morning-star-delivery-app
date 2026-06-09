# After Dark — "Level-up" living-FX kit + Auth (#5)

> Owner greenlit (2026-06-09) **all four level-up tracks**, built as a **shared kit
> alongside Auth (#5)** so auth ships fully maximal, then back-ported to the shipped
> surfaces. This doc is the architecture + guardrails + sequence. Standard:
> [`hero-design-language.md`](./hero-design-language.md); rollout context:
> [`customer-surfaces-after-dark.md`](./customer-surfaces-after-dark.md).

## Goal

The shipped surfaces (checkout #154, cart #157, orders #158, account #159) speak the
warm-paper **language** but are calmer than the homepage **hero**, which has the living
system (ambient depth, pointer/gyro reactivity, spotlight, develop-cascade, FX-budget
tiering). Level-up = **port the hero's liveness into the customer flow** + **two new
texture/moment systems** — all inside the iOS GPU budget.

## Prereq

**Merge #159 (account) first**, then branch the kit off the updated `main` so the
back-port includes account. (Cart/orders are already on `main`; account is not.)

## The four tracks → concrete build

### 1. Living ambient + tactile depth

- **`AfterDarkAmbient`** (`components/ui/AfterDarkAmbient.tsx`): one shared backdrop
  consolidating the per-surface canvases (`.checkout-canvas`/`.cart-canvas`/
  `.orders-canvas`/`.account-canvas` → a single `.after-dark-canvas` token set + this
  component). Layers: warm sunset gradient + masked dot/line grids (`hero-dotgrid`/
  `hero-linegrid`) + grain + soft aurora ribbons (radial-gradient, **no `blur()`**).
  Heavy layers gated `md:`; device-tier via `useHeroFx`. Reduced-motion-static.
- **Tactile cards**: wire `useTilt` (pointer) + gyro and a `.specular-sheen` sweep to
  the marquee cards only — loyalty passport, checkout receipt, the journey rails.
  Desktop **cursor spotlight** (reuse/extract the hero's) revealing the dot-grid under
  the cursor. Tilt OFF on cards whose body holds the primary CTA (menu-card gotcha).

### 2. Micro-interaction pass

- **`MagneticButton`** (`components/ui/MagneticButton.tsx`): promote checkout's
  `CtaMagnet` (magnetic pull + `useRipple`) to a shared primitive; use for every
  primary CTA (cart checkout, account save, orders reorder, auth submit).
- **`useTapBurst`** + `HeroBurst`: a small triad-particle burst on celebratory taps
  (add-to-cart, reward unlock, profile save, sign-in success).
- **Haptics**: `triggerHaptic` on toggles, tab/pill switches, qty steppers (extend
  beyond cart).
- **Pill sheen-on-activate**: a one-shot gold sweep when a `.menu-tab-active` pill
  becomes active (CSS keyframe, motion-gated).

### 3. Motion choreography & flow continuity

- **`useScrollReveal`** (IntersectionObserver): stagger sections into view on the long
  pages (orders detail, account tabs) instead of all-on-mount.
- **Develop cascade**: a one-time page-load rise/de-blur (hero-style) on each surface
  shell.
- **Shared-element transitions**: cart total → checkout receipt → confirmation
  wax-seal read as one object. Use the **View Transitions API** (Next 16 app-router
  `unstable_ViewTransition` / CSS `view-transition-name`) with a framer-layout fallback;
  reduced-motion disables. **Do not** add a nested `LazyMotion` that `CheckoutClient.test`
  mocks don't stub.

### 4. Gold-leaf texture + loyalty moments

- **Gold-leaf/lacquer**: new `HeroCardLayers` accent `"goldleaf"` — sparse gold-leaf
  flecks (`background-image` radial dots in `--hero-gold`) + a lacquer sheen; opt-in per
  card (passport, receipt header). Token in `tokens.css` + `@theme`.
- **`TierUpCelebration`**: when a customer crosses a tier (detect via `useRewards`
  tier-change), fire confetti + a wax-seal stamp + a Stars count-up burst. Reused on
  account passport + order confirmation. Real data only; once per crossing (ack like
  the rewards unlock).

## Auth (#5) — apply the kit

Explore `(auth)/*` (login/signup; already has `DomMaxProvider`). Build: `.after-dark-canvas`
ambient + a bilingual **"Morning Star" auth hero** (sunburst + EN/MY) + warm-paper form
card + `MagneticButton` submit + tap-burst on success. iOS-input ≥16px; reduced-motion;
bilingual.

## Guardrails (hard)

- **iOS GPU budget**: NO mobile `backdrop-filter`/large `blur()`; radial-gradient glows
  only; gate heavy decorative layers `md:`; **cap animation COUNT** per surface; pause
  CSS loops + detach pointer/gyro listeners offscreen (IntersectionObserver);
  device-tier via `useHeroFx`/`useDeviceTier`; **no scroll-coupled bg parallax** (pointer/
  gyro only).
- **Theme-safety**: constant hero ink/jewel only on constant-cream surfaces; theme-aware
  tokens on the canvas (no dark-mode meld).
- **a11y**: reduced-motion path on every signature animation; `sr-only` real values
  behind rolling/odometer digits; ≥44px targets; focus traps; `lang="my"`.
- **Token purity**: no raw white/black/hex/z-index/blur in JSX; add token + `@theme` +
  utility.
- **Tests**: don't break framer mocks (`CheckoutClient.test`); keep files <400 lines
  (extract siblings); verify full suite before every PR.

## Build sequence (one reviewable PR each, off the post-#159 `main`)

1. **Kit foundation** — `AfterDarkAmbient` + `.after-dark-canvas` tokens, `MagneticButton`,
   `useTapBurst`, `useScrollReveal`, `goldleaf` layer + `TierUpCelebration`. Storybook
   stories; no surface wired yet (pure additive). Verify + adversarial review.
2. **Auth (#5)** — the auth surface built ON the kit (ships maximal).
3. **Back-port** — apply ambient/tilt/spotlight/magnetic/celebrations to checkout, cart,
   orders, account (per-surface PRs; consolidate the 4 canvases into `.after-dark-canvas`).

> Iterate on Vercel previews each push; adversarial review just before merge; never
> self-merge (owner's per-PR go). CI Actions may still be quota-paused — verify locally
> and merge via branch-protection bypass if so.
