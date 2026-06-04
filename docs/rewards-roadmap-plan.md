# Rewards & Loyalty — Roadmap Execution Plan

> Status: PLAN (no code changes yet). Scope locked with product decisions:
> **tier perks = status + bigger coupons only**, **conservative margin** (delivery-fee
> path untouched). Grounded in three code audits (UI/UX, security, DB-types/CI).

## Guiding principles

- **Security is server-side or it doesn't count.** Every reward/tier decision is
  computed from the authenticated user's real data; the client is never trusted.
- **Foolproof = every state handled.** Loading, error (with retry), empty, success,
  offline — no silent failures, no vanishing UI.
- **World-class = accessible + bilingual + polished.** WCAG AA, full English/Burmese
  parity, reduced-motion honored, token-only styling.
- **No regressions.** Each phase ships behind full verification; phases are
  independent PRs so any can land or revert alone.

---

## Phase 1 — Customer rewards UI/UX: world-class, foolproof, secure

**Goal:** the `/account?tab=rewards` hub, header pill, confirmation teaser, and
referral card are accessible, bilingual, error-resilient, and visually polished.

### 1A. Accessibility (WCAG AA) — _blocking_

- `aria-label` on every icon-only / ambiguous control: wallet **Copy** + **Use →**,
  referral **More/WhatsApp/Viber**, header tier star.
- Progress ring: `role="img"` + `aria-label` ("12 Stars — 3 more orders to your $8
  reward"); mark decorative dots `aria-hidden`.
- Live regions: `role="status" aria-live="polite"` for the celebration banner and
  for copy-success ("Code copied"). Confetti stays `aria-hidden` but the banner
  announces.
- Focus management: focus the celebration banner on unlock; verify the account
  dropdown traps focus and restores it on close.
- Contrast pass on `text-border-strong` dots and amber expiry text against tokens.

### 1B. Bilingual parity (English + Burmese, `lang="my"`) — _blocking_

Add Burmese to every customer-facing string currently English-only: wallet expiry
("နောက် X ရက်"), empty-wallet onboarding, "Use at checkout $50+", referral headline +
stats, confirmation teaser, header tier name, and **all error messages**. Wrap
Burmese in `lang="my"` for correct font/screen-reader handling.

### 1C. Error & edge states — _blocking (foolproof)_

- `useRewardsSummary`: surface an `error` state (today `null` conflates loading/error);
  drop `staleTime` 5m → **60s** so post-order Stars don't lag; `refetchOnWindowFocus`.
- `ReferAFriendCard`: stop swallowing fetch errors / vanishing — show a compact
  retry. Migrate its raw `fetch` to the shared query hook pattern.
- `RewardsTab`: add a **Retry** button to the error card; `AbortController` on fetch;
  keep the once-only celebration (already correct via `acknowledged` ref + POST).
- Clipboard: on `writeFException` failure, show inline "Press to select" fallback
  (don't falsely show "Copied").
- Defensive: validate `shareUrl` before render; guard empty wallet vs. error.

### 1D. Visual polish — _high_

- Confetti: use motion-token easing (not hardcoded `easeIn`); tighten duration
  spread so it has a clear end; cap pieces on low-power devices.
- `ReferAFriendCard`: entry animation to match `OrderRewardsTeaser`; replace
  hardcoded `text-purple-600` (Viber) with a token.
- Ring responsiveness at <320px; consistent card spacing/radius with the rest of
  the account tabs.

### 1E. Tests + stories — _high (locks "foolproof")_

- Unit (Vitest + RTL): `RewardsTab` (loading/error/empty/success/celebrate-once),
  `CouponWallet` (copy success + clipboard-fail fallback, expiry flag, empty),
  `StarsProgress` (ring math, tier color, dots), `ReferAFriendCard` (self-fetch,
  error retry, share URLs), header pill.
- One Playwright E2E: earn → unlock (celebration) → wallet → "Use →" pre-fills
  checkout promo.
- Storybook stories per component (states as args) — aligns with the design-system
  convention the audit cited.

**Risk:** low — additive, no API/schema changes. **Verify:** full suite + manual a11y
pass (keyboard + SR) + reduced-motion.

---

## Phase 2 — Reward-integrity hardening (security)

**Goal:** defense-in-depth so a leaked `KYAYZU-` code can't be used by another
account, with a friendly pre-payment error.

**Finding (audit):** Stripe `max_redemptions:1` already blocks _double-spend_, but
`validatePromoCode` doesn't check **ownership** — B entering A's code sees "valid"
until Stripe rejects at session creation (confusing UX), and there's no app-level
binding.

**Change (one insertion point, no schema change — `loyalty_rewards` already has
`user_id` + `reward_code`, indexed):**

- In `resolveCheckoutDiscount` (`checkout/session/discount.ts`), after
  `validatePromoCode` succeeds and the code is `KYAYZU-*`: look up the row by
  `reward_code` (service role), and reject if `reward.user_id !== userId` with
  "This reward is linked to a different account." Referral codes stay unbound by
  design (intended to be shareable/one-time).
- Mirror the check in `/api/checkout/validate-promo` so the error surfaces _before_
  checkout (the route is currently unauthenticated + rate-limited; add an optional
  auth-aware ownership check when a session exists, else defer to session creation).
- Keep `markLoyaltyRedeemed` as the post-confirmation truth stamp.

**Tests:** unit for the ownership branch (own code ✓, other's code ✗, referral
unaffected, non-loyalty unaffected). **Risk:** medium (touches checkout) — gated by
the existing discount tests + a new ownership test; behavior is purely _more_
restrictive on loyalty codes.

---

## Phase 3 — Tier perks: status + bigger coupons (conservative)

**Goal:** make tiers _feel_ rewarding without touching the fee/margin path.
(Bigger milestone coupons already scale $5→$8→$10→$12 server-side — that's the
monetary perk, already shipped & secure.) This phase adds **status**.

- **Tier badge everywhere** (read-only, derived server-side from order count —
  never client-set): profile header, account dropdown (already has it), order
  confirmation, and reward emails. Consistent gem treatment via existing
  `tierAccent`/`LOYALTY_TIERS`.
- **"Early access" flag** as a pure, server-computed boolean (`tier >= ruby`)
  exposed on `/api/rewards/summary` — a capability flag the UI can gate future
  specials on. No fee logic, no new privileges beyond visibility.
- **Tier perks explainer** in the rewards hub: a small "What you get" list per tier
  (Stars, bigger Kyay-Zu-Par!, badge, early access) so the ladder is legible.
- **Email tier badge** already exists on milestone emails — extend to anniversary +
  thank-you for consistency.

**Explicitly NOT doing (per your call):** free delivery / lower thresholds — these
touch `calculateDeliveryFee` and carry open-ended margin risk. Documented in the
roadmap as deferred; the audit confirmed it's feasible server-side if you revisit.

**Security:** every tier value is `tierForOrders(realOrderCount)` server-side;
the client only ever _displays_ it. **Risk:** low — status/display only.

---

## Phase 4 — Generated DB types + CI drift guard (logical & secure)

**Goal:** end the schema-drift class of bug (the missing `notification_prefs`
column that broke two crons) by making types verifiable against the real schema.

**Findings that reshape this:**

- `database.ts` is **2,625 lines, hand-maintained**, with **78 custom exports**
  (union types like `OrderStatus`, row aliases) that naive `supabase gen types`
  would **destroy** — imported across **117 files**.
- **No `.github/` / CI exists at all**, and the **Supabase CLI isn't a dependency**
  (only JS client libs). So this is "build the guardrail from scratch," not "add a
  step."

**Plan (safe, phased — does NOT rip out the hand file in one shot):**

1. **Split custom types out**: move the 78 hand-authored aliases/unions into
   `src/types/database-custom.ts`; keep `database.ts` as the (eventually generated)
   table/enum/function shapes. Re-export both from a barrel so the 117 import sites
   don't change. _Pure refactor, fully type-checked._
2. **Add Supabase CLI** to devDependencies + `pnpm gen:types` script
   (`supabase gen types typescript`).
3. **Introduce CI** (`.github/workflows/ci.yml`) running the existing gates
   (lint, lint:css, format, typecheck, test, build) — valuable on its own, since
   there's none today.
4. **Add a drift-check job**: regenerate types and `git diff --exit-code` the
   generated file; fail the PR if the committed types don't match the schema.
   - **Option A (recommended): local-migrations spin-up** — `supabase start` in CI,
     apply `supabase/migrations/`, gen from local. **No production secrets in CI**,
     and it also proves the migrations actually apply cleanly. Slower (~30–60s).
   - Option B (live introspection) needs a `SUPABASE_ACCESS_TOKEN` secret — faster
     but puts a prod credential in CI. **Rejected** for security unless you prefer it.
5. **Document** the schema-change workflow (migration → `pnpm gen:types` → commit).

**Security rationale:** Option A keeps CI credential-free and catches _both_
directions of drift (types vs. migrations). The split keeps app-level unions
(which are intentionally a _superset_ of DB enums, e.g. `OrderStatus`) from being
clobbered. **Risk:** medium (broad refactor) but mechanical and compiler-verified;
landed as its own PR ahead of any regeneration.

---

## Sequencing & rationale

| Order | Phase               | Why this order                                           | Risk | Touches                  |
| ----- | ------------------- | -------------------------------------------------------- | ---- | ------------------------ |
| 1     | **1 — UI/UX**       | Highest user-visible value; fully additive               | Low  | UI only                  |
| 2     | **2 — Integrity**   | Security; small, isolated to checkout discount           | Med  | checkout                 |
| 3     | **3 — Tier status** | Builds on 1's components; display-only                   | Low  | UI + summary API         |
| 4     | **4 — Types/CI**    | Foundational but biggest refactor; do deliberately, last | Med  | repo-wide types + new CI |

Each phase = one PR, each behind `lint && lint:css && format:check && typecheck &&
test && build` + security-review for Phases 2 & 4. Phase 4's CI, once in, gates the
rest going forward.

## Decisions locked

- **This run:** Phase 1 (UI/UX) + Phase 2 (integrity). Phases 3 & 4 queued.
- **Phase 4 type-gen:** Option A — local migration spin-up in CI, **no prod secrets**.
- **Phase 3 tier badge reach:** all surfaces — rewards hub + dropdown, order
  confirmation, reward emails (anniversary + thank-you), and signed-in homepage
  greeting. (Display-only, server-derived from real order count.)
