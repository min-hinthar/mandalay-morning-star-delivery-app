# Open PRs — live registry

> Shared state for cross-session collaborative review. See
> [collaborative-pr-review.md](./collaborative-pr-review.md) for the process.
> Update this in the same change that alters a PR's state.

_Last reconciled: 2026-06-12._

## In flight

- **#173** — **Security lockdown + orders RLS repair + grocery launch review**
  (`claude/focused-goldberg-ci0h2h`). The grocery-readiness review doc
  (`docs/grocery-launch-review-2026-06.md`) + fixes: auth-bound
  `create_order_with_items` (was anon-forgeable), guarded route/driver-telemetry
  RPCs, private `feedback-attachments` bucket + signed URLs, and the orders RLS
  repair (driver transitions + customer cancel were silently no-opped by the
  admin-only policy — prod audit log confirmed). **Deploy sequencing matters:**
  migration `…120000` safe immediately; `…120001` (revoke `authenticated` on the
  order RPC) only AFTER the Vercel deploy. Local verify green (1180 tests).
  Awaiting owner merge-gate. Follow-ups tracked in the review doc: refund-Stripe
  wiring, percent-off coupon vs tax/tip lines, grocery Phases 1–3.

#160–#165 merged 2026-06-09 (kit → auth → checkout back-port + warm-dark
overhaul → PWA resilience → nav fixes).

> **Next: remaining back-ports** — cart, orders, account (per-surface PRs; finish
> consolidating `.cart-canvas`/`.orders-canvas`/`.account-canvas` onto
> `.after-dark-canvas` the way #163 did for checkout — their dark ramps already match).
> Carry-forward notes: any future test mounting `TierUpCelebration` needs
> `useReducedMotion` in its framer mock (it always renders `<Confetti>`); audit the
> repo's `zClass.*`/JS-config z-index utilities — they DON'T emit in Tailwind v4 (no
> `@config`), see Gotchas. See [`after-dark-levelup-plan.md`](./after-dark-levelup-plan.md).

## Watching

_None active._ All tracked PRs this session are merged; subscriptions ended at
merge/close.

> **CI note (2026-06-08):** GitHub Actions hit its quota mid-session — every
> workflow failed at _startup_ (2s, no logs) across all PRs. #155 was merged via
> the owner's branch-protection bypass after full **local** verification
> (lint · typecheck · lint:css · format · 1180 tests · build) + an adversarial
> pre-merge review. Re-enable required checks once the Actions quota resets.

## Recently closed

- **#165** — **Nav fixes**: profile dropdown opened off-screen left at 640–767px (anchor
  flipped at `sm:` but the header switches at `md:`); hamburger drawer reskinned After
  Dark (warm canvas + ambient, bilingual masthead, Order/You link groups matching the
  profile dropdown, query-aware active state) and "Made with love in Seattle" replaced
  with the real site-footer attribution. Review SHIP-WITH-NITS (spread-order safe-area
  fix + a11y nits folded in). **Merged.**
- **#164** — **PWA version-skew resilience**: homepage ChunkLoadError (Sentry-diagnosed)
  now self-heals via one-shot reload; update banner actually works (proactive
  `registration.update()` heartbeat + visibility/online, updatefound leak fix,
  first-install controllerchange guard, SKIP_WAITING fail-safe) + After Dark reskin.
  Review SHIP-WITH-NITS (spin-slow keyframes existed nowhere — added + emission
  verified; AA contrast on Update-now; SR-safe live region). **Merged** (`4d37bdec`).
- **#163** — **Checkout level-up back-port + warm dark overhaul**: checkout onto the
  canonical `.after-dark-canvas`; GLOBAL dark surfaces lifted off pure black to warm
  espresso (the owner's "too dark" fix — canvas-only lift was invisible since chrome
  sits on the global tokens); dark texture tokens boosted; receipt tilt + GoldLeaf;
  `TierUpCelebration` on confirmation. Review FIX-FIRST → fixed: stale contrast-audit
  fixtures (dark text-muted → `#a8a5a1`, worst pair 4.9:1) + `z-modal-backdrop` no-op
  → `z-50`. **Merged** (`6253ba90`).
- **#162** — **Auth "After Dark"** (customer-rollout surface #5). Editorial-split
  `/login` + `/auth/expired` on the level-up kit: `.after-dark-canvas` +
  `AfterDarkAmbient`, a desktop brand panel carrying the appetizing menu photo
  (`menu-section-bg.webp`, masked + warm scrim) with a bilingual "Mandalay Morning
  Star" wordmark, a mobile masked photo band, a warm-paper `AuthCard` (+ bilingual
  mobile masthead), `MagneticButton` submit, and the kit `TapBurst` on sign-in
  success. Reskin only — magic-link/OTP/OAuth state machine, role redirects, rate
  limits, driver-invite all untouched. Also removed the dead `auth-gradient`/
  `auth-steam-drift` CSS and fixed several latent iOS `blur()` layers. **Merged**
  (`<sha>`) — pre-merge adversarial review **SHIP** (no High/Med; logic-unchanged,
  theme-safe, blur-free); local verify green (lint · lint:css · format · typecheck ·
  1180 tests · build); landed via branch-protection bypass during the Actions quota pause.
- **#161** — Cart + Account **"After Dark" fixes** (owner feedback). Cart: mode-aware
  drawer layout (desktop pins footer + scrolls items; mobile sheet single-scrolls,
  `height` auto) so the cream receipt no longer overlaps/squeezes items. Account:
  reimagined tab + Settings sub-tab trays, `MenuTextureBackdrop` layering, opaque
  bases on previously-transparent reward cards, enriched dark canvas (full triad +
  3-stop ramp), conditional bottom clearance so the fixed `CartBar` + floating save
  bar never overlap content while staying tight when idle. **Merged** (`e1a4393`) —
  adversarial review SHIP-WITH-NITS (the one actionable nit, floating-bar clearance,
  fixed); local verify green.
- **#160** — After Dark **level-up kit** (PR ① of the epic). Six pure-additive
  shared living-FX primitives: `MagneticButton` (checkout `CtaMagnet` delegates),
  `AfterDarkAmbient` + the canonical `.after-dark-canvas`, `GoldLeaf`, `TapBurst` +
  `useTapBurst`, `ScrollReveal` + `useScrollReveal`, `TierUpCelebration` + a Storybook
  story. Not yet wired to surfaces. **Merged** (`c5150f8`) — adversarial review
  SHIP-WITH-NITS (the `ScrollReveal` reduced-motion gate fixed at source); iOS-GPU-safe,
  framer-mock-safe, local verify green (1180 tests).
- **#159** — Account **"After Dark"** (customer-rollout surface #4). Loyalty passport
  hero (`AccountHero`: tier crest + rolling Stars + reward-cycle progress + spend-climb +
  bilingual greeting on real `useRewards`/profile data), self-contained pill tab rail
  (removes the measured-indicator dark-on-dark risk), warm-paper Profile/Orders/Addresses/
  Feedback tabs + warm Settings sub-rail (Rewards left as-is). Presentation-only,
  theme-safe. **Merged** (`f5819a6`) — pre-merge adversarial review SHIP (FeedbackTab
  badge meld fixed); landed via branch-protection bypass during the Actions quota pause.
- **#158** — Orders **"After Dark"** (customer-rollout surface #3). The **Living
  delivery ritual** on tracking (Morning-Star journey rail + rolling-digit ETA hero +
  warm-paper driver/living-receipt cards + warm `.orders-canvas`), the order-detail
  page reskin (split into `OrderDetailView`, resolving its >400-line warning;
  `OrderTimeline` → hero tokens), and confirmation polish (warm-paper summary/delivery
  cards). Presentation only (totals + lifecycle untouched), theme-safe, bilingual.
  **Merged** — pre-merge adversarial review **SHIP** (no High/Med; one Low fixed —
  reduced-motion guard on the "Almost here" badge); local verify green (lint · lint:css
  · format · typecheck · **1180 tests** · build); landed via branch-protection bypass
  during the Actions quota pause.
- **#157** — Cart **"After Dark"** (customer-rollout surface #2). Warm cart canvas,
  photo-forward tactile line cards (bilingual, triad ledger-spine, swipe-to-remove),
  the **Morning-Star free-delivery journey** (replaced the truck/PartyPopper), a cream
  living-receipt summary mirroring `CheckoutSummaryV8`, + dish-sheet polish. Presentation
  only (totals untouched), theme-safe. **Merged** (`4dc3f4e`) — pre-merge adversarial
  review SHIP (one Low fixed: bilingual `lang` tag); landed via branch-protection bypass
  during the Actions quota pause.
- **#154** — Checkout **"After Dark"** (customer-rollout surface #1). Living
  **thermal-print receipt** (presentation-only totals), layered sheet-stack form +
  ledger spine, magnetic/ripple CTAs, maximal **rewards card** (Star-arc gauge +
  wax-seal coin + tier ladder on REAL `useRewardsSummary` data), referral offer
  below-fold + in-page share modal, bilingual wax-seal order-confirmation stamp,
  and the shared **`PhotoBandBackdrop`** (melded menu photo) reused on checkout /
  menu / homepage. **Merged** (`0706e7f`) — local-verified + adversarial review SHIP;
  landed via branch-protection bypass during the Actions quota pause.
- **#155** — Menu **top-region redesign** ("After Dark" v2, owner-driven, one
  branch): the stacked header+banners+tabs chrome collapses into a single pinned
  **`MenuRail`** toolbar (expand-on-tap search + scroll-spy `CategoryTabs` + live
  `RailCutoffChip` + Filters→`MenuFiltersSheet` bottom sheet); editorial
  scroll-away **masthead**; full-page **fixed photo backdrop** (`MenuPageAmbient`,
  transparent non-isolating `<main>` so it sits behind all content incl. the
  footer). **De-duplicated** against the global `AppHeader` (cart + ⌘K search
  live there — no more two-carts/two-searches). Rail pins below the header and
  slides in sync via `useHeaderVisibility`; scroll offset is rail-aware.
  **Pills:** active = **self-contained** `.menu-tab-active` gold→clay pill (bg +
  label on ONE element — root-fixes the recurring dark-on-dark active-tab bug the
  separately-measured indicator caused); inactive = **vellum ghost** pills.
  **Token audit:** `.menu-paper` over-photo chrome (favorite heart, modal close,
  add check) now uses theme-true non-remapped tokens; homepage/checkout
  **yellow-on-light** (`text-secondary` = `#ebcd00`) melds fixed. Cards: softened
  shadow, tilt disabled on desktop. **Merged** (bypassing the paused-Actions CI
  gate — locally green + passed an adversarial pre-merge review).
- **#150** — Menu & homepage **"After Dark"** epic (one branch, owner-driven):
  warm-paper theming + micro-interactions; photo-first **layered dish-sheet
  modal** (un-clipped close, single-scroll layered modifiers, live rolling
  total); **working dietary filters** (allergen-derived **fail-safe** +
  confirm-with-us disclaimer); owner-confirmed veg/vegan tags + **"Vegan on
  request"** toggle with a bilingual kitchen note; hero carousel opens the
  detail modal with warm-paper cards. **iOS hardening:** live WebGL map →
  desktop-only (fixes menu→homepage OOM); Modal/Drawer bottom sheets clear the
  status bar via `--sheet-max-h` (dvh + safe-area); swipe-to-close on public
  pages (`DomMaxProvider` on `PublicShell`); textarea no longer triggers iOS
  auto-zoom; rolling digits sit on the baseline. **Merged.** All pre-merge
  auto-review findings fixed (allergen safety, 500-char checkout-notes cap,
  CTA a11y).
- **#151** — `allergen-reviewed` tag (restores genuinely-plain dishes like Rice
  to free-from without claiming safety from absent data) + warm-paper-card
  favorite polish (`onPaper`) + **13 unit tests** on the allergen fail-safe
  path. **Merged.**
- **#152** — Full **allergen audit** from dish descriptions + owner kitchen
  corrections (DB + seed; 3 DB-only items reconciled into the seed). **Merged.**

- **#143** — Delivery map: device-tier gate (low/mid → animated static coverage
  map, desktop/high → live WebGL) to dodge the iOS WebGL OOM; warm-paper status
  bar + upper-center info chip. **Merged.**
- **#144** — Rewards offer banner: collapse-don't-vanish to a re-expandable pill
  (centered opacity crossfade; dropped `layout`/`popLayout` since public pages
  lack `domMax`). **Merged.**
- **#145** — Hero "Morning Star Rewards" → emoji-in-disc star **constellation**
  (arc + comet, magnetic nodes, tap-burst, reward/unlock-$ count-up, height-locked
  perk panel) + loyalty `jade`→**Diamond** display rename (id unchanged) unifying
  tier emojis to ⭐💎♦️👑 across hero/account/admin/emails; token-pure jewels
  (`--hero-ruby`/`--hero-gold`); JS loops pause offscreen via `useInView`.
  **Merged.** Six adversarial-review passes + a final subagent audit (verdict
  SHIP); all findings folded in (Diamond color in account+admin maps, focus
  announce, token purity, offscreen pause).
- **#146** — Claude auto-review on every PR push: `claude-pr-review.yml` workflow
  plus the review-calibration prompt. **Merged.**
- **#147** — Prettier-format the review prompt md (unblocked repo-wide
  `format:check`). **Merged.**
- **#148** — Collaborative iteration & merge protocol in `.claude/CLAUDE.md`
  (iterate on previews; adversarial review only just before merge; never
  self-merge; always read auto-review; mobile-first; framer-by-route). **Merged.**
- **#149** — `ensure-preview` CI safety net: forces a Vercel preview via the API
  when the GitHub→Vercel webhook drops a PR commit (non-blocking; needs
  `VERCEL_TOKEN`). **Merged.**

- **#127** — Migration-history squash _plan_ (docs). **Closed (superseded)** —
  the squash already shipped in the merged #126 baseline; the plan served its
  purpose.
- **#129** — Driver correctness fixes (route-start idempotency, stop-promotion
  fallback, idempotent re-submission, admin exception-resolve). **Merged.**
  Included the Resolve-dialog a11y fix (announced validation + char counter +
  de-duped SR heading).
- **#130** — Route-complete close-out + simple-mode completion fix (server-
  confirmed celebration, `RouteFinishingCard` hold, 409 premature-completion
  guard). **Merged** (rebased onto `main` past a squash-stack conflict).
- **#131** — Admin Delivery Day hub: single-screen command center + live fleet
  map (`/api/admin/ops/driver-locations`, date-aware ops infra, LA-tz helpers).
  **Merged** (rebased onto `main`; all review findings + the colorblind-marker
  Low folded in).
- **#132** — Customer world-class signature UX components (`CutoffCountdown`,
  `RewardRail`, `StarsBalance`) + countdown util/tests + Storybook, plus the
  cross-session PR-review workflow docs. **Merged.** Strategy: reusable
  component library — wire each piece only where it beats what's shipped
  (`StarsBalance`/`RewardRail` intentionally not wired; rewards hub + cart
  already cover them).
- **#133** — "Locked in" delivery ritual on order confirmation (`CutoffCountdown`
  `forceLocked`), with an LA-tz weekday fix on the existing card. **Merged.**
- **#134** — Workflow-discipline docs (own-session PR stewardship + stacked-PR
  merge mechanics). **Merged.**
