# Hero & "Anthropic Warm-Paper" Design Language + UI/UX Quality Bar

> The standard for UI/UX design thinking on this codebase. Read this before
> doing any visual/motion work on the homepage hero (and, increasingly, the rest
> of the site). It defines **the aesthetic, the systems, the non-negotiables,
> and the level of craft expected.** Companion to
> [`frontend-design-system.md`](./frontend-design-system.md) (component specs).
>
> Established across PR #136 (the hero overhaul). The type system here
> (Fraunces + Hanken Grotesk) is **global** and supersedes §3 of
> `frontend-design-system.md`.

---

## 0. The bar, in one line

**Every surface layered, every number alive, every interaction responsive —
restrained palette + editorial type, maximal-but-tasteful motion, 60fps,
reduced-motion-safe, bilingual (EN/MY), token-pure.**

If a screen looks like a default Tailwind/AI template, it is not done. If an
animation drops frames or ignores `prefers-reduced-motion`, it is a bug.

## 1. Ethos — the dual mandate

Grounded in Anthropic's brand ethos: **"warm, trustworthy, thoughtfully
restrained"** — editorial, paper-like, human, not techy-cold. Layered gradients
and subtle texture for depth, never flat fills. (Source: Anthropic's official
`brand-guidelines` skill.)

But this product's owner wants the hero to feel **alive, vibrant, tactile, and
richly interactive** — "everything moving, animated, layered." Reconcile the two:

| Restraint (composition)                                       | Maximalism (life)                                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Palette: warm cream + ink + a 3-hue accent triad. No rainbow. | Motion: continuous, layered, on every interactive element.                   |
| Type: one editorial serif + one warm grotesque.               | Texture: dot-grids, grain, aurora, orbs, constellation — layered with masks. |
| Generous negative space; clear hierarchy.                     | Micro-interactions: tilt, magnetic, ripple, burst, odometer, spotlight.      |

Restraint in **what** is on screen; maximalism in **how alive** it feels. Both,
always 60fps + accessible. When in doubt, present **bold, recommendation-led
options** (see §9) rather than playing it safe.

## 2. Color

Authentic Anthropic palette (hexes from their brand-guidelines). Tokens live in
`src/styles/tokens.css`, mapped to Tailwind utilities in `src/app/globals.css`
(`@theme`). **Never hardcode these — use the token utilities.**

| Token                  | Value                         | Utility               | Use                            |
| ---------------------- | ----------------------------- | --------------------- | ------------------------------ |
| `--hero-ink`           | `#141413`                     | `text-hero-ink`       | Primary text on cream surfaces |
| `--hero-ink-muted`     | `rgba(20,20,19,.58)`          | `text-hero-ink-muted` | Secondary text                 |
| `--hero-line`          | `rgba(20,20,19,.10)`          | `border-hero-line`    | Hairline rules / card borders  |
| `--hero-accent`        | `#9a3412` (deep clay)         | `text-hero-accent`    | **Accent TEXT** (AA on cream)  |
| `--hero-accent-strong` | `#7c2d12`                     | gradients             | Depth                          |
| `--hero-clay`          | `#d97757` (book cloth)        | `*-hero-clay`         | Decorative/large accents, CTA  |
| `--hero-clay-2`        | `#cf6a49`                     | CTA gradient          |                                |
| `--hero-blue`          | `#6a9bcc`                     | `*-hero-blue`         | Triad accent (shapes/dots)     |
| `--hero-sage`          | `#788c5d`                     | `*-hero-sage`         | Triad accent (shapes/dots)     |
| `--hero-card-bg`       | cream `rgba(250,249,245,.94)` | `bg-hero-card`        | Paper surface base             |

**Rules**

- **Text:** ink for body, deep clay (`text-hero-accent`) for accent words —
  never the bright `clay`/`blue`/`sage` for small text (fails contrast).
- **Non-text shapes** (icons, dots, live indicators, orbs): **cycle the triad**
  clay → blue → sage (Anthropic's own guideline). See `TRIAD_*` in
  `HeroStatBand.tsx`.
- Rating stars stay **amber** (`text-amber-500`) — gold is iconic, reads on cream.
- The **sunset gradient** (`--hero-bg-*`) is the kept backdrop; warm-paper cards
  float on it. Don't flip the whole hero to cream.
- Contrast is AA-or-better, verified, on the _frosted_ (semi-transparent) card
  background, not an idealized opaque one.

## 3. Typography

Global (supersedes the old Nunito/Inter). Loaded via Google Fonts `@import` in
`globals.css`; tokens in `tokens.css`.

| Role               | Family                        | Token / utility                           | Notes                                                                                                     |
| ------------------ | ----------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Display / headings | **Fraunces** (variable serif) | `--font-display`, `font-display`          | Warm "old-style" editorial serif; **animate its axes** (`wght/opsz/SOFT/WONK`) for the "living headline." |
| Body / UI / sans   | **Hanken Grotesk**            | `--font-body`, `--font-sans`, `font-body` | Warm grotesque, legible 11–96px.                                                                          |
| Burmese            | **Padauk**                    | `--font-burmese`, `font-burmese`          | Always pair EN with MY.                                                                                   |

**Editorial masthead** is the signature headline pattern: kicker (sunburst +
tracked uppercase label) → hairline rule → serif headline in ink on a frosted
panel, with a **clay italic accent word** (draw-on underline swash) → bilingual
MY subhead. See `HeroContent.tsx` + `AnimatedHeadline`.

## 4. Surface system — "warm paper floating on sunset"

Three frosted treatments (utilities in `globals.css`). Show **all three in
context** so the layering reads:

| Surface       | Utility               | Feel                                             | Use on                       |
| ------------- | --------------------- | ------------------------------------------------ | ---------------------------- |
| Frosted glass | `hero-surface-glass`  | translucent, sunset shows through, backdrop-blur | stat tiles, masthead         |
| Tinted vellum | `hero-surface-vellum` | clay→sage wash, semi-transparent                 | delivery card, rewards strip |
| Stacked paper | `hero-surface-paper`  | near-opaque cream, layered shadow                | pills, chips, greeting       |

Every card gets `HeroCardLayers` (reusable): **dot-grid backdrop + paper grain +
editorial corner ticks + triad edge-glow**, clipped to the card radius, accent
cycles the triad. Cards are tactile: pointer **tilt**, hover lift, **tap ripple**,
auto **sheen** (mobile).

## 5. Texture system

- **Dot-grid / line-grid** (`hero-dotgrid`, `hero-linegrid`) are **parameterized**
  via CSS vars (`--dot-color/--dot-gap/--dot-r`, `--line-color/--line-gap`).
  Visibility rule learned the hard way: faint ink dots + `soft-light` are
  invisible on the vivid sunset — use **bright cream/clay dots** at real opacity,
  and **fade them with gradient masks** (radial/linear) so they sit _behind_ text,
  never a uniform full-bleed field.
- **Grain** (`hero-paper-grain`, + `hero-grain-drift*`) — SVG fractal-noise,
  low-opacity `mix-blend-multiply/overlay`, optional slow drift.
- **Aurora** (`hero-aurora`, `hero-aurora-2`) — blurred triad ribbons, `screen`
  blend, slow drift + breathe. Living gradient: `hero-hue-breathe` on the base.
- **Constellation** — twinkling triad dots (`hero-twinkle`) linked by faint
  animated lines. **Vignette** seats the layers.
- Decorative layers are **always** `pointer-events-none` + `aria-hidden`.

## 6. Motion system — the catalogue + the rules

Keyframes/utilities in `globals.css`; hooks in `Hero/interactions.ts`; particle
engine in `Hero/HeroBurst.tsx`; odometer reels in `Hero/RollingDigits.tsx`.

**Catalogue:** cinematic page-load `animate-hero-develop-1..5` (rise + de-blur
cascade) · `hero-font-breathe` (variable-axis headline) · `hero-accent-underline`
(swash draw-on) · **odometer** rolling digits (countdown + stat counts) ·
`animate-hero-sheen` · `animate-hero-ripple` · `useTilt` / `useMagnetic` (3D tilt

- magnetic CTA) · `useHeroParallax` (pointer **+ gyro**, **never scroll**) ·
  cursor **spotlight** (reveals texture beneath) + additive **custom cursor** ·
  `hero-halo-breathe` · floating-emoji drift + steam + sparkles + trail + gather +
  **tap-burst** · `hero-comet` + `motion-safe:animate-spin` orbit cluster ·
  `hero-sparkle` · `ScrollProgress` bar · one-time `HeroConfetti`.

**Non-negotiables (every animation):**

1. **Reduced motion is mandatory.** CSS animations live **inside**
   `@media (prefers-reduced-motion: no-preference)` (or use `motion-safe:`);
   framer/JS effects gate on `useAnimationPreference().shouldAnimate`. Static
   fallbacks must look intentional, not broken.
2. **60fps or it doesn't ship.** Animate `transform`/`opacity` only. No animating
   layout/`width`/`top`. Big `blur()` and `backdrop-filter` are expensive — count
   them, keep them bounded.
3. **No scroll-coupled background translate** — it causes motion sickness. Parallax
   is **pointer + device-orientation** only.
4. **Throttle pointer with rAF**; never `setState` per raw pointer event.
5. **Pause when offscreen** (IntersectionObserver) for continuous loops; clean up
   every listener/timeout in `useEffect`.
6. Easing: prefer `cubic-bezier(0.22,1,0.36,1)` (develop), springs for tactile.

## 7. Mobile

No hover on touch — so effects must **autoplay** (sheens, odometers, steam,
sparkles), respond to **tap** (ripple, emoji burst) and **device-orientation**
(gyro tilt/parallax). Touch targets ≥44px; decorative taps never block scroll or
content. The custom cursor is desktop/fine-pointer only.

## 8. Reusable hero kit (promote to a shared `anthropic` kit)

These are built generic on purpose; reuse them on homepage/menu rather than
re-inventing:

`interactions.ts` (`useTilt`, `useMagnetic`, `useHeroParallax`, `useRipple`) ·
`HeroBurst` (`useBurst`, `Bursts`) · `RollingDigits` (`RollingNumber`,
`RollingDigit`) · `HeroCardLayers` · `HeroSunburst` · `AnimatedText`
(scroll-reveal + accent words) · surface/texture/motion CSS utilities.

## 9. Design-thinking process & quality bar (what's expected of Claude)

This is **how** to work on UI here, not just what to build:

- **Lead with a bold aesthetic POV.** Commit to a direction; never ship timid,
  evenly-distributed, generic design. Pull in the `frontend-design` skill for net-new UI.
- **Options for consequential/irreversible choices.** For global or
  hard-to-reverse decisions (fonts, palette direction, big layout forks), present
  **2–4 recommendation-led options** (recommended first, with rationale +
  evidence — bundle size, contrast, community), via `AskUserQuestion`. Research
  first (this is a thorough-evaluator owner). For reversible polish, just build it.
- **Detail is the job, not a follow-up.** Sweat animation timing/easing, spacing,
  contrast, layered depth, hierarchy, and a **micro-interaction on every
  interactive element**. Bilingual EN/MY everywhere.
- **Performance + accessibility are part of "done"** — not a later pass. Reduced
  motion, contrast, focus states, `aria-hidden` on decoration, offscreen pausing.
- **Honesty over flash.** Never fabricate data to look impressive (e.g., no fake
  "+1 orders" ticks) — animate **real** values only.
- **Verify, always.** Run the full suite (`lint · lint:css · format:check ·
typecheck · test · build`) before every PR. After adding CSS utilities/keyframes,
  **confirm they emit in the built CSS** (`grep` `.next/**/*.css`) — unknown
  Tailwind classes silently no-op.
- **Token purity (ESLint-enforced):** no raw `white`/`black`/`z-index`/`blur`/hex
  in JSX — add a CSS var + `@theme` mapping and use the utility. Inline `z-index`
  only with the documented eslint-disable for local stacking contexts.
- **Calibrate.** Maximalism risks overload + battery cost. After a big add, do a
  balance/perf pass: dedupe competing layers, tune densities/opacities, check
  mobile FPS, confirm reduced-motion. Adversarial self-review (subagent /
  `code-review`) for any non-trivial change.

## 10. Pointers

- Hero code: `src/components/ui/homepage/Hero/` (+ `../FloatingEmoji.tsx`).
- Tokens: `src/styles/tokens.css` → mapped in `src/app/globals.css` `@theme`.
- Motion utilities/keyframes: `src/app/globals.css` (search `hero-`).
- Loyalty model (for the rewards strip): `src/lib/loyalty/` (`LOYALTY_TIERS`).
- Component specs (buttons/cards/etc.): [`frontend-design-system.md`](./frontend-design-system.md).
- Deep-dive learnings: `.claude/learnings/{animation,design-tokens,mobile-ux,performance}.md`.
