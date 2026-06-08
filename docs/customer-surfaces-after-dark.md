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
  `menu-paper` scope / the `warmPaper`/`onPaper` props pattern.
- **Tokens (source of truth `tokens.css` → `@theme` in `globals.css`):** hero
  palette (`--hero-ink`, cream `--hero-card-bg`, `--hero-clay/-blue/-sage`,
  `--hero-accent`), menu accents (`--menu-clay/-gold/-amber`), textures
  (`--menu-texture-dot/-line`). **Never hardcode** white/black/hex/z-index/blur —
  ESLint bans them; add a token + `@theme` map + utility.
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

## Process

Build → push → share the **clickable Vercel preview link** every reply →
refine on the owner's feedback → run the adversarial self-review (or
`security-review` for checkout) **only once the owner is satisfied, just before
merge** → triage the **auto-review after every push** → **never self-merge**
(owner's explicit per-PR go). Mobile-first on a narrow viewport for every change.

## Progress (2026-06-08)

- **Surface #1 Checkout — built, in PR #154 (awaiting owner merge go).** Shipped:
  the **"living receipt"** with a **thermal-print** reveal (print-head sweep,
  tear-off settle; presentation-only — totals math untouched); layered
  sheet-stack form + ledger spine; living/rolling numbers + draw-on rules;
  magnetic + ripple CTAs; editorial section headers; opaque selected states +
  morning-star-red outlines; cohesive light/dark token system.
- **Rewards nudge (sidebar):** tier-tinted **Star-arc gauge** + wax-seal **reward
  coin** (tooltip-explained) + Burmese-gem **tier ladder**, all on REAL
  `useRewardsSummary` data (`spendCents` added to the route; next-tier derived via
  pure loyalty helpers). Idle gem breath-glows; reduced-motion-safe.
- **Referral:** offer banner moved **below the fold**; "Share & earn" opens an
  **in-page share modal** (no checkout exit; guest → sign-in prompt).
- **Order confirmation:** bilingual **wax-seal thank-you stamp**, tinted by the
  customer's loyalty tier.
- **Background:** menu-section photo **melded** into the sunset canvas
  (`CheckoutBackdrop` — zoomed-out masked photo band + `soft-light` + the menu's
  editorial dot/line-grid + triad-glow texture; mobile-GPU-safe, no blur).
- **Pre-merge adversarial review: SHIP** (no High/money/auth/GPU findings; the one
  Medium — dead `rewardReady` state — fixed). Verified green locally; CI blocked
  only by the Actions billing/runner issue.

## Future work / backlog

- **Surfaces #2–#5 still to do:** cart drawer → order confirmation/tracking →
  account → auth (per the sequence table above). One reviewable PR each.
- **Zoom-out the shared menu photo on OTHER surfaces** for consistency — owner
  liked the checkout's bounded, less-cropped photo band; `HomepageMenuSection`
  (and anywhere else using `/images/menu-section-bg.webp`) still uses a full-bleed
  `object-cover`. Consider extracting the `CheckoutBackdrop` band treatment into a
  shared component. _Separate PR (touches homepage)._
- **Mobile Stars chip above the fold** (checkout): the rewards card stacks below
  the form on mobile; a slim Stars chip near the masthead was deferred.
- **Post-submit wax-seal CTA** (declined for now — would delay/friction the
  payment path; the confirmation wax-seal already pays off the "seal" narrative).
  Revisit only as a post-submit flourish baked into the existing loading→success
  transition, never delaying the Stripe/COD request.
- **`.rewards-pulse`** CSS idle loop isn't offscreen-paused (negligible — 2 tiny
  gems in a normally-in-view sidebar). Optional IO gate.
- **`(customer)/orders/[id]/page.tsx`** is over the 400-line `max-lines` cap
  (pre-existing warning) — split when next touched (confirmation/tracking is
  surface #3).
