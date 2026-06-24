# Loyalty milestone orphan back-fill (ops)

> Operational follow-up to **M-3** (`docs/loyalty-milestone-self-heal.md`, PR #188). The
> in-app self-heal recovers an orphaned milestone reward **lazily** — on the customer's
> next paid order. This one-time script sweeps every existing orphan at once, for
> customers who may not reorder soon.

## What an "orphan" is

A `loyalty_rewards` row with `kind='milestone'` and `reward_code IS NULL`: the milestone
was claimed (the `UNIQUE(user_id, milestone)` row exists) but the Stripe code was never
minted — because a prior run threw after the claim but before/while minting (a Stripe
blip, an email render error, a network drop). Before M-3 these were stranded forever.

## The script

`scripts/fill-orphaned-loyalty-codes.ts` (run via `pnpm backfill:loyalty`):

```bash
pnpm backfill:loyalty --dry-run   # report orphans per user + $ at risk, NO writes
pnpm backfill:loyalty             # mint + fill (writes to Stripe + Supabase)
```

- **Reuses the exact in-app fill logic** — `fillOrphanedMilestoneCodes`
  (`src/lib/loyalty/fill-orphaned.ts`), which `maybeIssueMilestoneReward` now also calls
  — so the batch path and the request path can't drift. Same per-row `reward_cents`,
  same `.is("reward_code", null)`-guarded write (so it's safe to re-run and can't
  double-fill).
- **Silent** — no push/email. The reward simply appears in the customer's wallet; a
  retroactive notification flood for old rewards is avoided by design. (If you ever want
  to notify, that's a separate decision — the helper is notification-free on purpose.)
- **Safe to re-run / idempotent** — only fills rows that still have `reward_code IS
NULL`; a row already filled (or filled by a concurrent in-app self-heal) is skipped.
- **Standalone client** — builds its own service-role `createClient(URL, KEY)` like the
  other ops scripts (`scripts/migrate-drive-photos.ts`), not the Next-only
  `createServiceClient`. Prints the detected **Stripe key mode** (LIVE/test) before
  writing so you confirm you're hitting the right environment.
- **Paginated scan** — the orphan sweep pages through the full set (1000 per page) until a
  short page arrives, rather than a single select. A bare select is capped by PostgREST's
  `max-rows` (commonly 1000), which would silently truncate the scan at a large backlog —
  undercounting users and **understating the dry-run "$ at risk" total** the operator uses
  to decide whether to proceed. Pagination keeps that figure honest at any size. It uses
  **keyset** seeking (`.gt("id", lastId)` on the stable `id`), not offset `.range()`: an
  offset window over a live table skips/duplicates rows if the set shrinks mid-scan (a
  concurrent in-app self-heal fills a row), whereas seeking past the last id can't skip an
  unfilled orphan and a healed row simply drops out of the `reward_code IS NULL` filter.

### Env

`NEXT_PUBLIC_SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` · `STRIPE_SECRET_KEY` (live key
for prod). Always run `--dry-run` first and confirm the count + key mode.

## The refactor it carries

`maybeIssueMilestoneReward`'s inline "needs-code select + guarded fill" block is extracted
to `fillOrphanedMilestoneCodes` (returns the filled `{milestone, code, rewardCents}[]`
ascending; the in-app path then notifies on the highest). Behavior is unchanged — the
existing `reward.test.ts` suite stays green — and the helper has its own unit tests.

## Verification

- `src/lib/loyalty/__tests__/fill-orphaned.test.ts` — empty → `[]`; mints each orphan at
  its own `reward_cents`, returns ascending; excludes a row that lost the guarded-fill
  race.
- `src/lib/loyalty/__tests__/reward.test.ts` — unchanged, confirms the extraction is
  behavior-preserving.
- Script smoke: `pnpm backfill:loyalty --dry-run` loads the full import chain and the env
  guard fires when secrets are absent.
- Full suite: `lint · lint:css · format:check · typecheck · test · build`.
