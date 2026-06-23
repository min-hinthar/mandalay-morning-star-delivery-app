# Loyalty milestone reward — self-healing issuance

> Fixes audit finding **M-3** (`docs/adversarial-audit-2026-06.md`). Money-issuance
> change — reviewed in its own PR.

## The bug

`maybeIssueMilestoneReward` (`src/lib/loyalty/reward.ts`, called after every paid /
COD-approved order) issued a milestone coupon in two steps:

1. **Claim** the milestone — insert a `loyalty_rewards` row, guarded by the UNIQUE
   `(user_id, milestone)` constraint so concurrent webhooks can't double-issue.
2. **Mint** a Stripe promo code and write it back onto the row (`reward_code`,
   `expires_at`), then push + email the customer.

If step 2 threw **after** step 1 committed — a Stripe blip, an email render error, a
network drop — the function's `catch` logged and returned. The row persisted with
`reward_code = NULL`, and because the milestone now read as "already claimed", the next
run's claim-insert was a no-op and **the code was never minted**. The customer silently
lost an earned reward; recovery required a manual DB/Stripe fix.

This was a deliberate trade-off in the original code ("don't retry, to avoid duplicate
coupons"), but it traded a duplicate-coupon risk for a **silent lost-reward** risk.

## The fix — drive minting off "rows that still need a code"

Minting is no longer driven only off the rows claimed in _this_ call. After claiming,
the function selects **every** `kind='milestone'` row for the user where
`reward_code IS NULL` — which is the union of (a) rows just claimed and (b) any orphan
from a prior failed run — and fills each one. So an orphan gets its code (and the
customer their push + email) on that customer's **next paid order**, with no manual
intervention.

Key properties:

- **No duplicate milestone.** The milestone row is already claimed; we only ever
  back-fill its missing `reward_code`. The UNIQUE constraint still prevents a second
  milestone row.
- **Orphans keep their earned amount.** Each row is minted at its own stored
  `reward_cents`, so a coupon earned at the New Friend tier ($5) isn't back-filled at a
  later Gold-tier amount ($12).
- **Concurrency-safe.** The code-fill `UPDATE` is guarded `.is("reward_code", null)`.
  If two runners race, only the first write lands; the loser's freshly-minted Stripe
  code is simply wasted — it's one-time and TTL-expiring, never saved to the wallet, so
  there's no double-redemption and no customer-visible effect.
- **One notification.** Only the highest filled milestone sends a push + email, as
  before — back-filling several at once doesn't spam the customer.

The residual cost is the inverse of the old bug: a rare wasted (unused, auto-expiring)
Stripe promo code on a true mint-after-update partial failure, instead of a silently
lost customer reward. That's the right side of the trade.

## Verification

- `src/lib/loyalty/__tests__/reward.test.ts` — fresh issuance; **orphan recovery with no
  new milestone** (the core fix); idempotent no-op re-run; concurrent-fill guard (no
  email when the row was lost); orphan minted at its own stored amount.
- Full suite: `lint · lint:css · format:check · typecheck · test · build`.
