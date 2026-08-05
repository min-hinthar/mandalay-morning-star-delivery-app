# Open PRs — live registry

> Shared state for cross-session collaborative review. See
> [collaborative-pr-review.md](./collaborative-pr-review.md) for the process.
> Update this in the same change that alters a PR's state.

_Last reconciled: 2026-08-05 (post-merge). No PRs open except the registry
reconciliation itself. The D4–D10 fleet is fully merged._

## Recently closed — D4–D10 security backlog fleet (2026-08-05, ALL SIX MERGED on the owner's "Merge")

All six independent off `main`, zero file overlap, merged in one pass once
every head was CI-green and review-clean. The fleet absorbed ~30 auto-review
findings across the day — every one fixed same-round or declined with
file:line evidence, every thread resolved before merge.

| PR   | Squash     | Scope                                                                                                                                                                                                                                                                                                     |
| ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #241 | `9b7b1f94` | **D4+D5 (money):** discount-proportional item refunds + unscaled tax share; shipping once-per-order + cumulative cap (rounding clamp bounded by cumulative refunded units)                                                                                                                                |
| #242 | `58dbbe85` | **D6:** first-order discount can't stack across pending checkouts; reclaim = session-expire→guarded-cancel, every ambiguity fails to no-discount                                                                                                                                                          |
| #243 | `f146ce54` | **D7:** SW privacy boundary, all FOUR halves (NavigationRoute, RSC soft-nav/prefetch, same-origin `/api` JSON, cross-origin supabase-js JSON incl. signed storage) + activation purge; serwist names pinned against the installed package                                                                 |
| #244 | `0355d337` | **D8:** feedback confirmations only to authed users' own email; `feedback-anon` rate tier (3/10m)                                                                                                                                                                                                         |
| #245 | `1080b111` | **D10:** `sendDefaultPii:false` + `scrubUrl` on EVERY egress path (breadcrumbs incl. console, error events incl. exception values, tracing transactions, Replay frames); stale unscrubbed `sentry.client.config.ts` deleted; legacy fonts dropped (incl. the zero-consumer Playfair preload + dependency) |
| #246 | `ae97ba4e` | **D9 (docs):** `unsafe-eval` must stay (Google Maps requires it in both CSP modes; dev-gating already tried + reverted) — rationale pinned in `next.config.ts`; real remainder = nonce migration for `unsafe-inline`                                                                                      |

**⚠️ Post-merge action (owner):** apply
`supabase/migrations/20260805200000_discount_proportional_refunds.sql` to prod
(SQL editor, project `ukuzkhuppqwtrdkjqrkv`; single idempotent
`CREATE OR REPLACE FUNCTION`). Until it applies, the RPC still over-refunds
discounted orders and the merged RefundDialog preview UNDERSTATES the real
refund. Verify with one discounted-order partial refund afterwards.

**Follow-ups recorded (not blocking):** per-tier rate-limit fallback ceilings;
DB-level first-order belt (partial unique index / advisory lock) for the
concurrent-tab race; nonce-based CSP project; `refresh_analytics_views()` cron;
trend-unknown UI.

## Recently closed — audit follow-ups 2026-08-05 (ALL THREE MERGED on the owner's "Merge all")

- **#237 — docs: the phantom-column batch record** (`196aa827`). open-prs.md batch entry +
  five new CLAUDE.md gotchas + testing learnings (incl. the corrected full-suite command).
  Three review rounds each caught successive imprecision in the follow-up POINTERS (a wrong
  line range, "two routes" when there were three, a search string that finds nothing because
  the view is created unqualified) — the one way a docs change can actually mislead.
- **#238 — fleet average treated unrated drivers as 0-star scores** (`8fb08500`). The
  `/admin/drivers` Avg Rating card filtered its denominator on `ratingAvg !== null` while the
  unrated sentinel is 0 — one 4.8 driver plus four unrated rendered "1.0 / 5.0". Plus the JSX
  `{avgRating && <span>/ 5.0</span>}` rendering a literal "0" for an all-unrated fleet
  ("—0"). Extracted to `computeFleetAverageRating` with tests — the direct lesson from #235's
  escaped mutation being inline untested JSX.
- **#239 — admin analytics read materialized views nothing grants access to** (`0af7480f`).
  FIVE call sites across TWO views (the follow-up entry said three across one): the delivery
  page 500'd, the driver panels were silently empty. Rerouted to the existing
  `get_driver_stats_admin()` / `get_delivery_metrics_admin()` wrappers (SECURITY DEFINER,
  self-gating, granted to `authenticated`) — no migration, no service client. Ten review
  rounds, nine real findings, **five of them defects in guards written in the same PR**, all
  one shape: green for a reason other than the one claimed (unbounded `$function$` slice,
  absorbed `SetofOptions` keys, nested embeds resolved as functions, name-only grant check,
  `.rpc()`-blind column guard). Every guard was falsified both directions before merge.
  Post-deploy check: click `/admin/analytics/{drivers,delivery}` once — the SECURITY DEFINER
  round-trip is the one thing not exercisable from the container.

## Recently closed — phantom-column sweep 2026-08-04 (ALL FOUR MERGED on the owner's "Merge all four when ready")

Fallout from #231's repo-wide `.returns<T>()` cast scan. **All four independent off
`main@2602a2fd` with ZERO file overlap between any pair**, so merge order was free.

**Pre-merge discipline that paid for itself:** before merging, all four were merged into a
local `integration-check` branch off `main` and the FULL suite run against the combined
state (each PR's own CI had only ever seen it alone against `main`). A 5-lens adversarial
audit ran over that merged tree — 13 candidate findings, 2 survived refutation, both
**pre-existing** and neither attributable to these PRs (see Follow-ups below). The most
plausible cross-PR break was checked directly and was clean: #236 revokes
`get_driver_performance` / `calculate_route_stats` / `is_driver`, all of which have **zero**
`.rpc()` callers in `src/`, while #233's driver stats UI uses `calculate_driver_streak` /
`calculate_driver_weekly_deliveries`, which #236 does not touch.

- **#233 — `drivers.rating_avg` is nullable** (`f03ed8d7`). `numeric(3,2) DEFAULT 0` with no
  `NOT NULL` (baseline:211), but seven hand-written interfaces declared it `number` and
  `.returns<T>()` cast that straight past `tsc`, so `.toFixed(1)` on a null threw inside
  render and took three screens down. Widened ~20 files + fixed 9 render sites; unrated shows
  an em dash, never an animated `0.0`.
- **#234 — the deactivated page leaked admin contact** (`89a82cde`). It gated on "is anyone
  logged in", so ANY signed-in customer who guessed `/driver/deactivated` was shown the
  admin's email and phone. `middleware.ts` deliberately exempts the route (a deactivated
  driver must reach it without passing the driver-layout guard), which is exactly why the
  page itself must check. Now defers to `getRoleDashboard` and renders only when it returns
  this page's own path. Verified it **fails closed**: on a DB error the catch returns
  `/login?error=role_lookup_failed`, and the driver lookup discards its `error` so a blip
  yields `no_record` → `/driver/onboard` — a deactivated driver is locked out (annoying)
  rather than a customer let in (a leak).
- **#235 — cancellation reason was structurally dead** (`6983e094`). See its own section
  below; it took four review rounds and seven real defects.
- **#236 — `get_driver_performance` failed OPEN** (`792f9cf0`). The guard was
  `IF NOT is_admin() AND p_driver_id != get_my_driver_id()`; `get_my_driver_id()` returns
  NULL for a non-driver, so `p_driver_id != NULL` is NULL, `TRUE AND NULL` is NULL, the IF is
  not taken, and any authenticated customer read any driver's stats. It only ever fired for a
  caller who WAS a driver asking about a different driver. Fixed with the NULL-safe
  `IS DISTINCT FROM` (the same shape #173 applied to three sibling RPCs) + 7 REVOKEs.
  `db-drift` passed: the `RETURNS TABLE` signature is byte-identical to the baseline's, so
  `CREATE OR REPLACE` cannot move the generated Functions block.

### #235 in detail — seven real defects across four review rounds

Worth recording because **four of the seven were introduced by the fixes for the earlier
three**, each one a new way for the display to disagree with reality:

1. **Only one of two admin cancel paths was read.** `PATCH /admin/orders/[id]/status` also
   reaches `cancelled`, takes the same free-text `reason`, and emails the same template — but
   writes `action:'status_change'`. Scoping to `action='cancel'` left it dead.
2. **The widened read then reached too far back.** A 10-row scan for the newest _cancellation_
   skipped the un-cancel row. `cancelled -> pending` is permitted, and **five** paths re-cancel
   writing no audit row (account self-serve x2, pending-order route, Stripe `charge-refunded`
   and `checkout-session-expired`) — so it attributed a superseded reason, with a stale
   timestamp, to an unrelated cancellation. Fixed by _removing_ code: `.in()` leaves only
   decisive row types, so the newest row alone decides → back to `limit(1)`.
3. **The API half was computed and discarded.** `CancelledOverlay`'s visibility follows the
   LIVE status but it read its reason from the SSR snapshot, which predates any cancellation
   that lands while the page is open.
4. **The `??` fallback reintroduced (2) client-side** — an authoritative live null fell back
   to the snapshot. Now `cancellationSynced` + `resolveCancellationReason`, never `??`.
5. **The refetch could beat the audit row.** Both admin routes commit the `orders` UPDATE
   _before_ the audit insert, and `SUBSCRIBED` calls `stopPolling()`, so one empty answer
   would stand until reload. Bounded retry probing on `cancelledAt` (non-null even when the
   reason is deliberately withheld, so an opt-out settles on attempt one).
6. **The retry's abandon flag latched forever.** Set in cleanup, never re-armed — and cleanup
   runs on every dep change and twice on mount under Strict Mode, so the retry was silently
   dead in dev. (Remounting would NOT catch it: a fresh hook gets a fresh ref.)
7. **A failed lookup passed as an authoritative null.** `getOrderCancellation` swallows a
   failed audit-log read while the API still answers 200, so a transient failure overwrote a
   real reason with nothing _and_ marked it authoritative. Now `{ ok, cancellation }` →
   `order.cancellationKnown` → the hook adopts the fields only on a successful read.

Plus a frozen `cancelledAt` reactivating a previously-dead `||` branch in `StatusStepper`
(`currentStatus === "cancelled" || !!cancelledAt`), which kept the rail cancelled after
`cancelled -> pending`; the prop is simply no longer passed. **20 mutations falsified.**

**Lesson:** the one mutation an earlier pass failed to catch was reverting an inline ternary
in JSX — because that wiring had no test. Extracting the decision into
`resolveCancellationReason` was not tidying; it was the only way to pin it.

## Follow-ups from the 2026-08-04 audit — RESOLVED 2026-08-05

Both defects this section recorded are now fixed on `main`:

- **Fleet average 0-vs-null sentinel** → fixed by **#238** (`8fb08500`);
  `computeFleetAverageRating` + tests, JSX renders-0 guard included.
- **Analytics reads of ungranted materialized views** → fixed by **#239** (`0af7480f`);
  all five call sites (both views) rerouted to the granted wrappers, plus the repo-wide
  `materialized-view-access.test.ts` guard so a direct read cannot come back.

Still open, deliberately deferred (small, non-urgent):

- **`refresh_analytics_views()` runs `REFRESH MATERIALIZED VIEW CONCURRENTLY` on BOTH views
  synchronously on every analytics request.** The code comment already says "in production,
  this would be scheduled". Move it to a cron; non-fatal today (failures degrade to stale
  data with a `logger.warn`).
- **Trend deltas show `0%` for "couldn't read the previous period" as well as "genuinely
  flat".** The delivery route now LOGS the failed previous-period read (#239) so it reaches
  Sentry, but the UI cannot distinguish the two — needs a distinct unknown state in
  `calculateMetricsSummary` + dashboard. Dashboard-semantics change, deliberately kept out
  of #239.
- **Nit:** concurrent `syncCancellationDetails` invocations share one timer/resolver slot.
  Self-healing; worst case a duplicate fetch on a once-per-order transition.

## Recently closed — route-creation debug 2026-08-01 (ALL THREE MERGED on the owner's "Merge, go thoughtfully")

From "failed to create Delivery route or automatically assign to available driver". Root
cause was already fixed and merged as **#223** (`e909ccc`): `POST /api/admin/routes` wrote
`status:'planned'` with a `driver_id`, violating `chk_planned_unassigned` (`planned` means
UNASSIGNED) — every driver-assigned route creation 500'd. These three are the rest of what
that debug turned up. **Independent** — no shared files, each sits directly on `main`.

- **#224 — admin driver writes were silent no-ops** (branch `claude/fix-admin-driver-writes`).
  RLS asymmetry: `drivers_update`/`profiles_update` grant only `user_id/id = auth.uid()`
  with NO `is_admin()` clause, unlike the matching select/insert/delete policies. So every
  admin write through the caller-scoped client matched ZERO rows — and since `.update()`
  returns no row count and none of these chained `.select()`, a zero-row update carried no
  error. Field edits, DELETE, and archive all returned 200 while changing nothing, and the
  profile promotion in driver-create silently failed, leaving accounts that appear in the
  driver picker but can't sign in to the driver app. Fix: authenticate with the user client,
  write with the SERVICE client after the admin gate (the pattern `GET /admin/routes` and the
  driver-invite route already use), and verify affected rows via `.select("id")` → 404 on
  zero. Plus an idempotent **heal** path (re-adding a stranded driver repairs the role
  instead of 409ing — those accounts already exist in prod) and an **orphan rollback** if the
  promotion fails after the drivers insert. Chose the service client over widening RLS: no
  migration, tighter blast radius, existing precedent. Auto-review findings fixed: the
  service client made an **admin→driver demotion** newly reachable (`profiles.role` is a
  single enum, so "promote" is also "strip admin") — now 409s in both create paths; and the
  heal path claimed "repaired" while dropping the submitted vehicle fields.
- **#225 — route builder offered orders POST would reject** (branch
  `claude/fix-route-builder-order-set`). The picker hid any order with ANY `route_stops` row,
  including stops on COMPLETED routes, so an order skipped on a finished run could never be
  re-added for redelivery — while POST only blocks non-completed routes (the file's own
  comment already claimed the correct rule). It also applied no payment filter, though POST
  400s the WHOLE batch over one unpaid/fully-refunded card order. Both queries now share one
  `isOfferable` predicate and one `OFFERABLE_COLUMNS` select fragment, so the picker and the
  "N orders on other dates" badge can't drift (the badge mismatch was an auto-review catch).
  `RouteBuilderClient` also names the offending orders instead of a bare "Failed to create
  route".
- **#226 — driver availability honesty + server-side driver validation** (branch
  `claude/fix-driver-availability-picker`). `availability_json` defaults to empty and only
  the driver's own `/driver/schedule` screen fills it in, so a freshly-onboarded driver was
  reported as "Not available on Saturdays" — a refusal they never made. Now "Schedule not
  set". Picker cards are real buttons with aria-labels; **only `isActive` is a hard block**
  (blocking on an unset schedule would lock the admin out of assigning anyone — the same
  over-block failure mode as the legacy checkout cutoff gate). `POST /api/admin/routes` now
  verifies `driverId` resolves to a real active driver, mirroring
  `PATCH /api/admin/orders/[id]/driver`; the FK can't tell "deactivated" from "gone".

> **Owner decision still open:** the `auto_assign_enabled` admin toggle is DEAD — nothing
> reads it. Building real auto-assignment needs a definition of "available", and drivers
> carry no day or zone affiliation today. Build it, or hide the control?

Merged #224 (`235eebc`) → #225 (`6747e46`) → #226. **#224 and #226 both touch
`src/app/api/admin/drivers/route.ts`** (POST rewrite vs. the GET `?active=` filter), so the
three-way merge was verified before any of them landed: a scratch worktree merging all three
onto `main` ran typecheck + lint + every admin suite green (155 tests), and #226 was then
updated onto the post-#224 `main` so its blocking CI validated the real post-merge state
rather than a stale base. #225 was disjoint from both.

Local full-suite runs OOM this container, so verification is targeted suites + the blocking
CI `verify` job. Every new test in all three was **falsified** (fix reverted, confirmed red,
restored) before pushing.

**Six rounds of auto-review on #224 earned their keep** — every finding was a hazard the fix
itself created by making previously-inert writes actually land: admin demotion (single-enum
role), phone/license-plate wipes from omitted optional fields, a silent un-archive, and three
separate cases of a 200 claiming something the write hadn't done. The recurring lesson: an
honest API response is worthless if the caller discards it — both `DriverDetailClient` and
`handleAddDriver` had to be wired to render it.

## Recently closed — route-day UX sweep 2026-08-01 (BOTH MERGED on the owner's "pre-merge go and merge when ready")

From the 6-agent survey (47 gaps → a 6-PR plan); these were PRs A and B. Both were
independent off `main` — the only shared file was `(customer)/layout.tsx`, in
non-overlapping hunks, and the two-branch merge was verified clean before merging
(`git merge-tree`, plus a scratch merged worktree that ran typecheck + lint + the full
affected suite green). Merged #220 (`83ba560`) first, then updated #221 onto the new
`main` so its blocking CI validated the real post-merge state.

- **#220 — checkout day integrity** (`83ba560`). Address-aware CutoffModal gate +
  reschedule; selected-date cutoff chip/watcher (payment-step scoped); date revalidation
  on address change (bilingual notice); no-serve empty state (unfiltered fallback
  REMOVED); order-minimum gate on Place Order + cart-drawer caption + receipt shortfall
  row; middleware `?next=` for /checkout·/cart·/orders·/account.
- **#221 — pre-checkout route-day truth** (`33138bf`). New
  `useCustomerDeliveryDays` (verified-default-address → `addressServesDay` filter,
  fail-open); menu banner leads with the route-day headline (invite-email landing
  continuity); RailCutoffChip surfaces on mobile at warning/critical; cart drawer runs on
  the personalized days (zones synced into cart store); cart/menu coverage-ceiling parity.

**The pre-merge adversarial pass earned its keep — it caught three real defects that ~12
rounds of auto-review had missed, two of them over-corrections from EARLIER review rounds:**

1. **Legacy-config over-block** (introduced by #220's own response to a Codex P2). The
   legacy gate's `isOpen` means "THIS Saturday's cutoff passed", not "ordering is
   impossible" — verified by execution: at Fri 4pm PT `computeDeliveryGate(5,15).isOpen`
   is `false` while `getAvailableDeliveryDates` still returns the next two Saturdays with
   `cutoffPassed:false`, and the server accepts them. A bare `!gate.isOpen` in the submit
   gate killed checkout for that whole window with no reschedule escape. Now gates on the
   SELECTED date vs the gate's own next-orderable date.
2. **`reset()` clearing the cart's `addressDistanceMiles`** (also from an earlier P2).
   CheckoutClient resets on every non-Stripe unmount — i.e. navigating /checkout → /menu —
   so a far-address customer dropped to LOCAL pricing for the rest of the session: the
   free-delivery meter promised FREE while the server would still charge the extended fee,
   and the new drawer minimum gate re-enabled the very cart checkout had just blocked.
   Retaining the last known distance over-quotes rather than baits, and self-corrects.
3. **`isSafeRedirect` open redirect.** All four copy-pasted predicates accepted
   `/\evil.com` and `/<TAB>/evil.com`, both of which the WHATWG parser resolves off-site
   (backslash aliases to `/` for special schemes; tab/LF/CR are stripped pre-parse) — on
   the path #220 makes the standard customer flow. Replaced by one hardened shared guard
   in `src/lib/utils/safe-redirect.ts` that also resolves the candidate and demands the
   origin back.

Out of scope / on the record: the `delivery_days` **1:1 weekday→run assumption** (engine-wide,
marked in-code); the cart's local-band fee using the first active day's fee rather than the
SCHEDULED day's (pre-existing, already documented at `cart-store.ts:307`); `hasFreeDelivery`
ignoring the out-of-range tier (pre-existing, neither diff); the `route-day-invite` cron's
lack of a per-customer frequency cap (shipped in #219, not in either diff).

### Follow-ups this pair leaves behind

- **`useCustomerRouteAddress` extraction** — dedupe the menu + drawer auth/address
  round-trip (the module cache dedupes the paint, not the fetch), share `isSameAwareness`,
  rename the `maxRadiusMiles` param.
- **Derive `addressDistanceMiles` from the resolved default address** instead of treating it
  as a checkout-session artifact. `useCustomerDeliveryDays` already resolves that distance;
  feeding it into the cart store closes BOTH the first-session gap (never-visited-checkout
  customers see local pricing) and the inverse staleness that #220's `reset()` clear was
  reaching for.
- **Checkout store address vs auth identity** — the checkout address persists in
  (per-tab) sessionStorage across sign-out, so a second user in the same tab can briefly see
  the first user's route on /checkout. Display-only: `/api/checkout/session` scopes the
  address read with `.eq("id", addressId).eq("user_id", user.id)`, so it can never produce an
  order for the wrong user. Clear it on auth change to close the window.
- **Owner spot-check:** the mobile rail-chip pop-in at warning/critical urgency on a narrow
  (~360px) viewport — statically verified nowrap, never eyeballed.

## Recently closed — issue-backlog sweep 2026-07-31 (ALL FIVE MERGED on the owner's "Merge all thoughtfully")

Merged in dependency-safe order — #214 (`3c454a3`), #215 (`43537b6`), #213 (`6cbcb11`),
then the email trio's remaining two with a main-merge + full local re-verify + green CI
between each: #216 (`808ff55`), #217 (`d1a699c`). The trio shares `send.ts`/`types.ts`/the
cron; both branch updates auto-merged cleanly and the combined suite passed at every step
(final: 1470 tests). Owner decisions captured: **#210 nearby sees every day**; **#209 keep
opt-out + one-click unsubscribe**. Extended floor stays **$100**. Every auto-review finding
across the five was fixed or explicitly justified in-PR (~15 findings over the sweep,
including two real saves: the #217 GET-prefetch scanner hole and #214's fourth
`[]`-direction consumer).

> **Both owner actions DONE (2026-07-31):** the `notification_type` enum migration is
> applied to prod and `UNSUBSCRIBE_TOKEN_SECRET` is set in Vercel. The route-day cron is
> now **SCHEDULED** in `vercel.json` at `30 16 * * *` (09:30 PDT / 08:30 PST — 5.5h/6.5h
> before a same-day 15:00 PT cutoff, inside the 2–20h notice window on both sides of DST;
> offset from loyalty-anniversary's 16:00 slot so one customer never gets two sends in the
> same minute). Verify the audience anytime without sending:
> `curl -H "Authorization: Bearer $CRON_SECRET" "https://mandalaymorningstar.com/api/cron/route-day-invite?dryRun=1"`

- **#213 — route_day_invite notification_type enum** (closes #208, branch
  `claude/route-day-invite-notification-type`). Migration + local `gen:types` (drift guard
  green); type moves into `CustomerEmailType`; both `notification_logs` inserts null a
  non-uuid synthetic `order_id` (verified vs local DB: the enum move alone would 22P02
  every marketing row). Deliberately did NOT widen `MAX_HOURS_BEFORE_CUTOFF` — a log row
  is an audit trail, not a dedupe guard; needs a pre-send read first. **Apply the migration
  at/before deploy** or audit rows silently drop (send still succeeds).
- **#214 — nearby customers order every delivery day** (closes #210, branch
  `claude/nearby-all-delivery-days`). One shared predicate `addressServesDay` behind ALL
  direction gates (picker + checkout gate + date engine + homepage coverage checker —
  the 4th consumer was an auto-review catch). `[]` = nearby = every direction; missing
  `direction` still drops (config gap); unplaced (`undefined`) still quotes `all`-runs only.
- **#215 — settings PATCH validation actually enforces** (closes #207, branch
  `claude/settings-validation-enforce`). camelCase-vs-snake_case made every bound inert;
  one `toSnakeCaseKeys` normalizer inside the schema so validated keys == stored keys.
  Errors name fields in the toast string. NOTE: whole-category saves mean a pre-existing
  out-of-bounds stored value would 400 that tab's save — local rows verified in-bounds,
  prod spot-check is cheap if a save 400s post-merge.
- **#216 — per-attempt Resend timeout** (closes #211, branch `claude/send-attempt-timeout`).
  AbortController per attempt (owned timer — Resend swallows aborts); timeout = retryable,
  same key → `invalid_idempotent_request` = delivered; cron reserve now counts request time
  (3s ceiling, key-gated at the TYPE level: `attemptTimeoutMs` requires `idempotencyKey`).
  `resend` pinned `~6.9.x` — the signal rides an UNDECLARED options-spread; a bump must
  re-verify `post()` still spreads or the timeout silently no-ops.
- **#217 — one-click unsubscribe, RFC 8058** (closes #209, branch
  `claude/one-click-unsubscribe`). HMAC token `userId.prefKey.sig`, no expiry, allow-listed
  keys, off-only. **GET NEVER MUTATES** (auto-review Major: Safe Links/Proofpoint GET-prefetch
  every email URL with the real token — GET renders a confirm form that POSTs). Mandatory
  types + admin compose deliberately stay on the plain settings link. **Owner: set
  `UNSUBSCRIBE_TOKEN_SECRET` in Vercel before the first marketing send** (unset = dormant,
  fails closed; rotation kills outstanding links).

## In flight (older) — CLEARED 2026-08-05

Nothing is in flight. The two items this section carried were verified against `main` and
both shipped long since; the entries had simply never been reconciled:

- **#194 — holistic-audit security fixes** (stored-XSS in admin email preview,
  `retry-payment` tax/tip under-collection, share-token silent RLS no-op) **MERGED** as
  `de59c5e9`. Ranked follow-ups D4–D10 live in
  [`holistic-improvement-plan.md`](./holistic-improvement-plan.md).
- **money-correctness-fixes** (percent-off coupons discounting tax/tip; admin item refunds
  never reaching Stripe) **MERGED** as **#174** (`e112224b`) — the PR the dropped-connector
  note said was pending. Follow-ups recorded there: per-line tax/discount-proportional
  refund math, RPC shipping double-refund guard.

The After Dark level-up back-port remains COMPLETE (#160–#171 all merged).

## Watching

_None active._ Zero PRs open as of 2026-08-05.

> **Historical CI note (resolved):** GitHub Actions quota was exhausted 2026-06-07→~06-12
> (all workflows failed ~2s at startup; #155/#175 merged via owner bypass after full local
> verification). Actions have run normally on every PR since — the CLAUDE.md gotcha stays
> as the diagnostic for if it ever recurs.

## Recently closed

- **Adversarial audit 2026-06 + reconciliation fixes (#187–#191).** Full-codebase
  adversarial review (`docs/adversarial-audit-2026-06.md`): security/correctness core
  verified solid (anon order forgery, driver-GPS leak, percent-coupon-tip, admin refunds
  all already remediated); several agent "Highs" disproved (verify-the-verifier). Live
  fixes shipped:
  - **#187** — audit doc + tip-in-admin-status-emails fix (hardcoded `tipCents:0` →
    real `tip_cents`), inline admin-auth → `requireAdmin()`, hero `repeat:Infinity`
    motion-loop offscreen gating. **Merged** (`4131a83`).
  - **#188** — **M-3** loyalty self-heal: a milestone reward orphaned by a failed
    mint/email (claimed row, null `reward_code`) now heals on the customer's next paid
    order (drives minting off the `reward_code IS NULL` query, not just rows claimed this
    call). **Merged** (`4fb3d40`).
  - **#189** — **L-10** email discount row so coupon-order receipts reconcile to the
    stored total. **Merged** (`0ad1800`).
  - **#190** — on-page counterpart of L-10: Tip + clamped Discount rows on
    `OrderConfirmationV8` + tracking `OrderSummary`; clamp extracted to the shared,
    unit-tested `receiptDisplayDiscountCents` (all four receipt surfaces); `tip_cents`/
    `discount_cents` threaded through the tracking pipeline + synced into the zod
    `trackingOrderInfoSchema`. Presentation-only. **Merged** (`2fc50f73`).
  - **#191** — operational follow-up to M-3: `pnpm backfill:loyalty` one-time script +
    shared `fillOrphanedMilestoneCodes` helper sweeps every existing orphan at once
    (silent, `--dry-run`, idempotent, keyset-paginated, read-errors surfaced).
    **Merged** (`c2dc3c03`). Owner runs `--dry-run` then real against prod.

  All five locally verified (lint · lint:css · format · typecheck · 1231 tests · build)
  and merged on the owner's explicit per-PR go. The Claude auto-review
  (`claude-pr-review.yml`) posted a clean "Safe to merge" verdict on each with all
  findings fixed; the blocking `verify`/`db-drift` jobs didn't run (Actions quota), so
  local verify substituted and each landed via branch-protection bypass.

- **#173** — **Security lockdown + orders RLS repair + grocery launch review.**
  Review doc `docs/grocery-launch-review-2026-06.md`; auth-bound order RPC,
  guarded route/driver-telemetry RPCs, PUBLIC/anon execute revokes (prod ACLs
  carried `=X` — migration `…120002`), orders RLS repair (driver transitions +
  customer cancel were silent no-ops; recursion-safe via
  `app_private.order_on_my_route()`), private feedback bucket + signed URLs.
  Adversarial review FIX-FIRST → fixed → SHIP; verified on scratch PG16 + live
  prod smoke tests. **Merged** (`a967949`) via bypass (Actions quota still out);
  all three migrations applied to prod + live-verified (anon locked out, forged
  orders raise 42501, order RPC service-role-only).

- **#171** — **Orders "Twilight Procession" + View-Transitions seal** (back-port 3/4).
  `.orders-canvas` → canonical `.after-dark-canvas`; OrderDetailView split
  (`OrderReceiptCard`); ScrollReveal cascades; tracking journey comet + arrival-glow
  (real status, `useInView`-gated); tilt/GoldLeaf cards; **manual `document.startViewTransition`**
  wax-seal + order-total morph (isolated, feature-detected, reduced-motion-safe, 1.8s
  cap; theme-toggle root VT CSS scoped under `html.vt-theme`). Review SHIP-WITH-NITS →
  fixed (Track Order anchor semantics; DriverCard ±3° tilt). **Merged** (`609b16ba`).
- **#170** — **Account "Constellation Shrine" → restrained passport** (back-port 4/4).
  Canvas consolidation + warm-paper passport (GoldLeaf + tilt + editorial crest +
  rolling Stars + real cycle progress) + TierUpCelebration + TapBurst-on-save + pill
  sheen. **Owner pulled it back from maximal**: removed the orbiting star ring + aurora
  (read cosmic, not Anthropic); `ConstellationOrbit.tsx` deleted. Review SHIP. **Merged** (`f045bdc2`).
- **#169** — `/cart` page summary warm-paper parity with the drawer receipt (review LOW
  follow-up). Review SHIP. **Merged** (`566c68f9`).
- **#168** — **iOS homepage OOM crash fix**: 6 hero `repeat:Infinity` loops gated only by
  `shouldAnimate` ticked offscreen → memory growth on scroll → tab crash (no Sentry).
  Gated all with `useInView`; moved two mobile blur halos to `md:`. Pre-existing since
  #136; not the cart PR. **Merged** (`0a8a6977`).
- **#167** — **z-index scale heal**: Tailwind v4 never loads `tailwind.config.ts`, so
  named z utilities were silent no-ops; healed with one `@utility` block (all 10 emit).
  Only 3 literal-class victims (`zClass.*` was already numeric). **Merged** (`eac9e2c4`).
- **#166** — Cart back-port (2/4): canonical canvas + new `AfterDarkSpotlight` kit
  primitive + **truck-led** free-delivery journey (owner pref over the star-convoy) +
  ticket perforation + tilt/GoldLeaf receipt + TapBurst-on-qty. **Merged** (`77cdd34d`).
- **#163** — Checkout back-port (1/4) + **warm dark overhaul** (global dark surfaces
  espresso, not pure black — the visible "too dark" fix; honest contrast-audit fixtures,
  dark muted `#a8a5a1`). **Merged** (`6253ba90`).
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
