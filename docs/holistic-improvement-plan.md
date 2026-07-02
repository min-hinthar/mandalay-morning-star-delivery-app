# Holistic Improvement Plan — Delivery side (2026-07-02)

Delivery-repo companion to the cross-repo plan. The **full ranked plan + the shared Morning Star brand
core** live in the QR repo at `docs/HOLISTIC_IMPROVEMENT_PLAN.md`; this file is the delivery-specific view +
the `open-prs.md` linkage.

**Method.** Multi-agent adversarial audit of both live codebases (not docs), each high finding passed to an
independent verifier told to refute it. Delivery findings below are the survivors.

## Security — fixing this session (🔧)

| #   | Sev      | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                  | Fix                                                                                                                                                            |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **high** | **Stored XSS → admin-session compromise.** `admin/orders/OrderDetailPage/ManualEmailDialog.tsx` interpolates a customer-controlled `orderSummary` (built from raw `order.address.street/city` in `OrderDetailClient`) unescaped into `footerHtml`, rendered via `dangerouslySetInnerHTML` on Preview. A saved address of `<img src=x onerror=…>` runs script in the admin's session (CSP `script-src 'unsafe-inline'` doesn't block it). | `escapeHtml(orderSummary)` (+ `orderNumber`) before interpolation.                                                                                             |
| D2  | **high** | **`orders/[id]/retry-payment` under-collects tax + tip.** The retry rebuilt Stripe line items as items + delivery only (no tax/tip line), yet marks the order `confirmed` against the full `total_cents`. Every failed-then-retried order under-collected CA sales tax + the whole tip; on discounted orders it also omitted the discount.                                                                                               | Add Sales Tax + Tip lines (mirrors `createStripeLineItems`) and re-apply `discount_cents` as a one-off `amount_off` coupon so the charge equals `total_cents`. |
| D3  | med      | **Customer share-token generation silently broken by the orders RLS lockdown.** `share-token/route.ts` updated `orders.share_token` on the user client, but `orders_update_customer_cancel` only permits status→cancelled → 0-row no-op; the token never persists, so `/orders/[token]/share` + tracking `?token` never resolve.                                                                                                         | Persist via `createServiceClient()` (ownership already verified) scoped to `user_id`, with `.select("id")` row-count check.                                    |

## Security — follow-up (📋, ranked)

1. **Money (dedicated PR + unit tests).**
   - **D4 (high)** `apply_item_refunds` refunds the item's **pre-discount** line total — on any discounted
     order a partial refund over-returns card money (the tracked "discount-proportional refund"; deferral is
     **unsafe** — welcome/referral discounts + partial refunds are routine). Scale each item's refund by the
     order's effective discount ratio (+ proportional tax).
   - **D5 (med)** Shipping refund counted twice across separate partial refunds (no once-per-order guard) —
     card caps at charge (returns tax/tip that shouldn't be); COD is an uncapped cash over-payment. Track
     `refunded_shipping_cents`.
2. **D6 (med)** First-order discount stacking — the eligibility gate counts COMPLETED orders only and the
   coupon has no per-customer `max_redemptions`; several unpaid checkouts each qualify. Count pending too, or
   an atomic per-user first-order-used flag.
3. **D7 (med)** SW caches authenticated HTML (`/admin`, `/driver`, `/account`) into Cache Storage → last
   admin's PII persists after logout on shared devices + widens XSS blast radius. Denylist authed prefixes in
   the NavigationRoute.
4. **D8 (med)** Unauthenticated `/api/feedback` emails arbitrary addresses via the brand's verified domain.
   Only confirm to authenticated users' own email; tighten the anon limit.
5. **D9 (med)** CSP `script-src 'unsafe-inline' 'unsafe-eval'` negates XSS defense-in-depth (what makes D1
   land). Move to nonce/hash; re-evaluate `unsafe-eval`.
6. **D10 (low)** Sentry `sendDefaultPii: true` + fetch/URL breadcrumbs capture IP + tokenized tracking URLs.
   `sendDefaultPii: false` + scrub `token`/PII in `beforeBreadcrumb`.

## UI/UX

The After Dark back-port (#150–#171) is complete. A fresh UX audit was re-queued (the first run hit a session
cap); its findings append here. Priority carry-forwards to verify against the current tree:

- `Tabs.tsx` + `CommandPalette/SearchCategoryTabs.tsx` still use the **measured-indicator** pattern
  (dark-on-dark active-label risk on the dark rail) — the documented gotcha.
- `text-secondary` yellow-on-light melds; `--sheet-max-h` vs `vh` on bottom sheets; 16px input font on mobile.
- **Driver + admin surfaces that missed the After Dark pass** — assess whether they now read off-brand next
  to the enriched customer surfaces (coherence, not necessarily a full reskin).

## Brand — the Morning Star shared core (delivery mapping)

Type is already converged (Fraunces + Hanken + Padauk). Shared anchors (canonical set = the email theme
`src/emails/components/theme.ts`): paper `#faf9f5`, ink `#141413`, **star crimson `#a41034` — mark only**,
gold `#eaa92f`, deep-clay accent `#9a3412`. Delivery keeps its sunset gradient + espresso After Dark + triad
lineage. Delivery-side work is **hygiene + iconography**:

1. `tokens.css`: no core hex changes — add a "MMS brand core anchor" comment marking
   `--hero-gold/--hero-star/--hero-ink/--hero-card-bg/--hero-accent` canonical.
2. Swap loyalty lucide `<Star>` → four-point ✦ in `--hero-gold`; tokenize rating `text-amber-500` →
   `--color-rating-star`.
3. Tier display via the safe display-rename path (change `name/english/emoji` only; sync the **two** accent
   maps `RewardsTab/tierStyle.ts` + `admin/referrals/TierDistribution.tsx`; refresh `TierBadge.test` +
   `loyalty-reward.test` fixtures).
4. **Font hygiene:** delete the legacy Nunito + Playfair/Inter `@import`s; repoint `--font-mono` off
   `--font-inter`; drop the Inter/Playfair localFont loads; optionally migrate to `next/font`.
5. Fix `layout.tsx` `themeColor` `#8B1A1A` → media-pair.

**Risks:** `contrast-audit.test.ts` hardcodes fixtures — refresh + recompute on any token edit. Do **not**
unify the legacy `--color-primary #a41034` derivatives into the star semantic (scope creep in a 955-line
file). Icon/manifest changes touch the Serwist precache (new SW build; long-lived PWAs see it via the update
heartbeat).

## Gate

Every slice: local verify (`lint · lint:css · format:check · typecheck · test · build`) → adversarial
subagent review (money/RLS/migrations especially) → PR on `claude/<slug>` → owner's per-PR go → merge →
migrations applied to prod + advisor-clean → update `open-prs.md`.
