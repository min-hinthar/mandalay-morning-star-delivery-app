# Grocery-Retail Launch Review — Code · Security · UI/UX

> 2026-06-12. Whole-app review in preparation for packaged-food / Burmese grocery
> retail + delivery. Sources: four parallel adversarial review passes (security,
> code correctness, UI/UX, grocery gap analysis), live Supabase security/performance
> advisors, Sentry production state, and the owner's uploaded price lists
> (377 SKUs, Apr 2022) + inventory-list photos.

## The catalog being onboarded

- **377 SKUs** (367 unique codes; 9 duplicated codes need a merge/suffix decision),
  ~115 brands (Sein Hinthar 103, Grandma 61, Times Mon 26, Morning Star 14),
  39 raw categories (messy: `fried` vs `Fried`, `…Fruid` typo, 8 can-format variants).
- Bilingual EN/MY names, net weight (30 rows malformed), pcs/pack, case +
  retail + wholesale prices. Retail mostly $0.75–$12, median ~$3.80.
- **No product photography exists** — the uploaded "product photos" are pictures of a
  printed inventory list. Launch design must assume imageless SKUs.
- Non-food lines: beauty/personal care (19), traditional herbal (18), household (6),
  footwear (4), betel products (5), plus a separate "InStockMedicines" sheet.
- Owner decisions (2026-06-12): **all SKUs in scope** (incl. herbal/medicines —
  see Regulatory below), **full inventory management**, catalog architecture decided
  after this report, **criticals fixed now**.

---

## 1. Security findings

### Live-verified (Supabase advisors + code)

| Sev          | Finding                                                                                                                                                                                                                                                                                                                                                                                                                    | Evidence                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Critical** | `create_order_with_items` RPC: SECURITY DEFINER, granted to `anon`+`authenticated`, no `auth.uid()` check, inserts caller-supplied `user_id` + all money fields. Anyone with the public anon key can forge orders for any user at arbitrary prices via `/rest/v1/rpc/…`, bypassing the validated checkout route and the `orders_insert` RLS policy. COD path (`pending_approval`) flows to staff for approval/fulfillment. | `baseline.sql:931-1028`, grants `:1786-1788`; called from `api/checkout/session/route.ts:291`, `lib/services/cod-order.ts:52` |
| **High**     | Route-management RPCs `merge_routes`, `split_route`, `promote_next_stop`, `reindex_route_stops`, `batch_update_stop_indices`: SECURITY DEFINER, no internal authz, granted to `anon`. With a route UUID, an unauthenticated caller can reassign/merge routes or advance delivery state. (`refresh_analytics_views` and `get_driver_performance` model the correct internal guard.)                                         | `baseline.sql:1395-1574`, grants `:1839-1862`                                                                                 |
| **High**     | Driver telemetry exposed: `get_driver_latest_location(driver_id)` has **no access check** — anyone can poll any driver's real-time GPS. `calculate_driver_streak`/`_weekly_deliveries`, `get_delivery_metrics_admin`, `get_driver_stats_admin` similarly unguarded for `anon`.                                                                                                                                             | `baseline.sql:1118-1137` vs guarded `:1139-1150`                                                                              |
| **High**     | Admin item-refund endpoint never calls Stripe — it marks the DB refunded and emails the customer "refund processed… 3-5 business days" while no money moves. (Externally-initiated Stripe refunds are handled by the `charge.refunded` webhook; the two paths can also double-handle.)                                                                                                                                     | `api/admin/orders/[id]/refund/route.ts:30-34,163-183`                                                                         |
| **High**     | `feedback-attachments` bucket: public-read + public-write (anon), no path scoping, raw client filename as key. Customer screenshots (PII) world-readable; bucket is an anonymous file host. `driver-photos` + `menu-photos` also allow listing (lower risk).                                                                                                                                                               | `baseline.sql:2418-2422`; `api/feedback/route.ts:141-152`                                                                     |
| Med          | `orders_update` RLS: `USING (is_admin())` with **no `WITH CHECK`** — admin sessions can rewrite `user_id`/money columns unconstrained.                                                                                                                                                                                                                                                                                     | `baseline.sql:2322-2323`                                                                                                      |
| Med          | Stored-XSS into admin: email-compose footer interpolates customer-controlled address/item strings into HTML unescaped; admin preview renders via `dangerouslySetInnerHTML` under a CSP with `unsafe-inline`/`unsafe-eval`.                                                                                                                                                                                                 | `api/admin/emails/compose/route.ts:106-132`, `ManualEmailDialog.tsx:~208`, `next.config.ts:51`                                |
| Med          | Order share tokens never expire, no revoke; leaked link = permanent tracking access.                                                                                                                                                                                                                                                                                                                                       | `api/orders/[id]/share-token/route.ts`                                                                                        |
| Low          | `customer_feedback_insert` policy is always-true (spam vector; actual inserts go via service client). IP-keyed rate limits on a few authed endpoints; admin feedback routes have no rate limit. Leaked-password protection (HIBP) disabled in Supabase Auth.                                                                                                                                                               | advisors; `baseline.sql:2061`                                                                                                 |

### Verified-safe (not padding — each checked)

Stripe webhook signature + atomic idempotency (`webhook_events` upsert); checkout
amounts computed fully server-side from DB prices (client sends only IDs+qty);
negative-total clamp; tip cap; coupon owner-binding (KYAYZU) + first-order-discount
gating incl. `pending_approval`; COD approve admin-gated with optimistic-lock 409;
open-redirect guards on auth callbacks; role authority from `app_metadata`/DB (not
client-writable `user_metadata`); cron routes fail closed on missing secret; strong
header set (HSTS preload, frame-deny, nosniff, scoped CORS); all 33 tables have RLS
enabled; no raw SQL; customer/driver IDOR paths user-scoped. Sentry: only 2
low-volume unresolved issues (one `hero_render`, one route-boundary catch).

### Fixes shipped in this PR

1. **Caller-identity guards inside every exposed SECURITY DEFINER function**
   (the `get_driver_performance` pattern): `create_order_with_items` binds
   `p_order.user_id` to `auth.uid()` (service-role exempt); route/stop RPCs require
   admin or the assigned driver; driver-stats/location RPCs require admin or the
   driver themself; admin metrics RPCs require admin.
2. **`REVOKE EXECUTE FROM anon`** on all of the above; trigger-only functions
   (`handle_new_user`, `update_driver_*`, etc.) revoked from `anon`+`authenticated`
   (trigger firing doesn't need caller EXECUTE). `is_admin`/`is_driver`/
   `get_my_driver_id` keep grants (referenced by RLS policies).
3. **Checkout switched to the service client for the order RPC**, enabling a
   follow-up revoke of `authenticated` on `create_order_with_items` (second
   migration, applied after deploy) — closing self-price-tampering by logged-in users.
4. **`feedback-attachments` made private**: public read/upload policies dropped,
   server-generated storage keys, admin UI served via short-lived signed URLs.
5. **`orders_update` gains `WITH CHECK (is_admin())`**; always-true
   `customer_feedback_insert` policy dropped.

### Deferred (need owner decision — see Decisions)

- **Refund-Stripe wiring** (real money movement; design: `stripe.refunds.create`
  inside/after `apply_item_refunds`, idempotent, email only on success).
- **Percent-off coupon bug** (below) — separate PR.
- Share-token expiry; email-HTML sanitization; HIBP toggle (Supabase dashboard).

---

## 2. Code correctness

| Sev      | Finding                                                                                                                                                                                                                                                                                                                                   | Evidence                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **High** | **Percent-off promo codes under-charge tax + tip**: Stripe applies the coupon to ALL line items including the "Sales Tax" and "Tip" lines, but stored `discount_cents` is computed on subtotal only → Stripe charges less than stored `total_cents`; driver tip silently shaved; tax remitted short. Fixed `amount_off` coupons are fine. | `order.ts:226-253`, `session/route.ts:366-403`, `discount.ts:71-74`                                     |
| Med      | `revalidateItemAvailability` re-checks only `is_active`, **not `is_sold_out`** (nor price) right before Stripe session creation — a sold-out flip mid-checkout still charges. Routine once grocery stock depletes.                                                                                                                        | `session/validation.ts:109-133`                                                                         |
| Med      | Menu fetch = one unbounded query returning every active item with nested modifiers, re-polled whole every 3 min while cart non-empty; rendered without virtualization. Fine at ~60 items; at ~440 it's a payload + DOM + battery problem on a codebase with a documented iOS OOM history.                                                 | `api/menu/route.ts:79-117`, `useMenu.ts:11-47`, `MenuContent.tsx:366-388`                               |
| Med      | Two divergent order-status state machines (admin vs customer cancel paths); DB enforces no transition constraint. Fragile when grocery fulfillment becomes a third writer.                                                                                                                                                                | `admin/orders/[id]/status/route.ts:59-67` vs `account/orders/[id]/cancel:17` vs `orders/[id]/cancel:57` |
| Low      | Cart IDB persistence has **no `version`/`migrate`** — must be added BEFORE `CartItem` gains grocery fields (sku/weight/taxability), or old carts rehydrate broken.                                                                                                                                                                        | `cart-store.ts:348-357`                                                                                 |
| Low      | RPC results flow through `as unknown as` casts (money/status fields untyped); modifier↔item association not validated (price still server-sourced); fee config duplicated client/DB (display-only drift).                                                                                                                                 | `session/route.ts:318-323` etc.                                                                         |

**Money math otherwise sound:** integer cents throughout; tax = flat 10.5%
(`COVINA_TAX_RATE`, `order.ts:11`) computed server-side, charged as a Stripe line
item; loyalty net-spend refund-aware and idempotent; `apply_item_refunds` locks
`FOR UPDATE` and rejects over-refund; webhook/driver/route idempotency all match the
documented gotchas. Well-tested: order math, checkout validation, cart store/sync,
driver lifecycle, loyalty. **Untested:** percent-coupon vs Stripe total; sold-out
flip mid-checkout; refund-without-Stripe; RPC forge paths.

---

## 3. Tax — load-bearing gap for grocery

- Today: flat **10.5% on the entire pre-discount subtotal**, unconditionally
  (`order.ts:100-102,157`), mirrored in 3 display components + emails.
- CA reality: most packaged food **exempt**; hot/prepared food taxable; carbonated
  drinks + dietary supplements taxable; the ~47 non-food SKUs (soap, household,
  footwear) and herbal products **taxable**.
- Selling exempt groceries at 10.5% **over-collects tax** — a compliance problem,
  not polish. **Launch blocker for grocery.**
- Required: `is_taxable` per item (+ `is_taxable_snapshot` on `order_items` so
  refunds return tax proportionally — today tax is never refunded), tax summed over
  taxable lines only, Stripe line-item + email updates. COD bypasses Stripe, so a
  DIY flag is required regardless of any future Stripe Tax adoption.

---

## 4. Inventory — missing, with good insertion points

- Only `is_sold_out`/`is_active` booleans exist; nothing decrements anything.
  Two concurrent checkouts can each buy the last unit.
- Owner chose **full inventory management**: `stock_qty` + atomic decrement inside
  `create_order_with_items` (`UPDATE … SET stock_qty = stock_qty - q WHERE … AND
stock_qty >= q` + rowcount check → whole order rolls back; row-lock
  concurrency-safe), `restock_order_items(order_id)` RPC wired into all **5**
  cancel/expire paths (customer cancel ×2, admin cancel, `checkout-session-expired`,
  `payment-failed`), plus a receiving/adjustment ledger table (`inventory_moves`:
  delta, reason, actor, order_id) for audit + case conversions from the wholesale list.
- Convention: `stock_qty NULL` = untracked (restaurant dishes unchanged); `0` = sold
  out. Map availability reads (11 sites catalogued) to `stock_qty == 0 OR is_sold_out`.
- Client staleness already handled (`useCartValidation` 3-min poll blocks checkout).

## 5. Catalog architecture — recommendation

**Extend `menu_items`** (vs a separate `products` table):

- `menu_items` has **27 call sites** + FKs from `order_items` (SET NULL),
  `featured_section_items` (CASCADE), `item_modifier_groups` (CASCADE); carts are
  jsonb snapshots; favorites localStorage. All ride along with NULL-able new columns.
- A separate table forks cart validation, the order RPC, search, featured sections,
  reorder, and all admin CRUD — ~3× the surface for no benefit (groceries simply
  have zero modifier rows).
- Proposed: `item_kind text CHECK ('dish','grocery') DEFAULT 'dish'`, `sku text
UNIQUE`, `brand text`, `net_weight_g numeric`, `pcs_per_pack int`,
  `wholesale_price_cents int`, `is_taxable boolean DEFAULT true`, `stock_qty int
CHECK (>= 0)`, `is_restricted boolean DEFAULT false` (regulatory hold — lets the
  full list import while counsel reviews MD\*/betel items), `search_terms text[]`
  (romanized aliases: "ngapi", "laphet", "balachaung").

## 6. UI/UX

**Ready as-is (preserve):** quick-add → inline stepper state machine (a grocery
interaction already); MenuRail pinned toolbar; Drawer/sheet primitive (focus trap,
swipe, dvh-safe); cart validation system (sold-out/price-change/substitution);
cart-page category grouping; free-delivery + cutoff messaging; COD clarity;
bilingual + reduced-motion discipline.

**Blockers / majors for grocery:**

| Sev         | Finding                                                                                                                                                                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Blocker** | 39 categories in one flat pill strip (`CategoryTabs`): a ~3-screen swipe gauntlet with scroll-spy churn. Needs the 39→~8 department taxonomy + two-tier nav.                                                                                                                                                      |
| **Blocker** | No virtualization/pagination; every SKU mounts a heavy motion card (`m.article` + parallax + observers). 440 cards on 1-col mobile = likely iOS tab-killer (repo has prod OOM history). Budget: `once:true` reveals, `content-visibility:auto`, per-section "Show all N →" expanders.                             |
| **Major**   | Imageless cards render a giant cuisine emoji in a 4:3 photo band — all 377 SKUs would look like placeholders. Design: square "shelf-tag plate" (`hero-surface-paper` + dot-grid + triad brand-monogram coin), photo swaps in later without layout change.                                                         |
| **Major**   | Filters are dietary/allergen-only; no brand facet (115 brands), no price sort, no in-stock toggle. Rail search is substring-only (fuzzy Fuse exists only in ⌘K) and there's no brand/romanized-Burmese bridging.                                                                                                  |
| **Major**   | Detail sheet is dish-shaped: modifier groups, "Make it vegan", kitchen-notes textarea — and no fields for brand/weight/pack/ingredients/origin. Needs a grocery mode (facts ledger, reuse the receipt `LedgerRow` aesthetic).                                                                                     |
| **Major**   | Quantity caps disagree: UI advertises 99, store clamps 50, server rejects >50; 50-line cart cap reachable by a family stock-up. Stepping +1 is the only entry method (24 cans = 24 taps).                                                                                                                         |
| **Major**   | Repeat-purchase loop missing: favorites are a localStorage heart with **no listing surface**; reorder always replaces the cart. Grocery = highest repeat category; needs "Buy again" rail + server-synced favorites + reorder-append.                                                                             |
| **Major**   | `line-clamp-1` on EN+MY names hides the trailing disambiguator ("…350g", brand prefixes) — grocery names need a 2-line budget + weight pulled into a badge.                                                                                                                                                       |
| Minor       | Stepper buttons 24–32px (<44px rule); `lang="my"` missing on card/sheet Burmese; `role="tablist"` without roving tabindex (40 tab stops); restaurant copy baked in ("Search dishes…", "made to order", metadata); no order-level delivery note (per-item kitchen notes only); cutoff chip hidden on mobile `<sm`. |

**Recommended browse model ("The Pantry / ကုန်စုံ"):** separate `/market` route
sharing `MenuPageAmbient`/`MenuTextureBackdrop`/`MenuRail`; ~8 department pills +
sub-category chips or category-index sheet; grocery card variant in
`UnifiedMenuItemCard.variantConfig` (brand kicker → 2-line EN/MY names → weight/pack
badge → shelf-tag price → same AddButton); rail search promoted to client-side Fuse
over the fetched catalog with brand + `search_terms` weighting.

## 7. Ops / delivery model

- Delivery fee is distance-tiered only — **weight-blind**. A $100 canned-goods order
  (free delivery, ≤25mi) can weigh 40+ lbs; ETA assumes 5 min/stop. Options: grocery
  counts 50% toward the $100 threshold, or weight cap + heavy surcharge; sum
  `net_weight_g × qty` onto orders for route planning either way.
- One hot-food string: `preparing` renders "Preparing Your Food" → composition-aware
  "Packing Your Order". Cutoffs/delivery-days need no change (shelf-stable).
- Loyalty: per-order Stars mean cheap grocery orders earn like $80 dinners and
  lifetime-spend tiers inflate — acceptable to start (self-limited by the $50
  redemption minimum); revisit if milestone farming appears. Exclude future B2B.

## 8. Regulatory flags (owner chose "everything" — ship with eyes open)

- **18 `MD*` SKUs carry explicit drug claims** ("Blood Stimulant medi", "Dermatitis
  Med", blood-pressure medicine) — FDA _drug_ territory, not supplements. **Strong
  recommendation: keep `is_restricted=true` (hidden) until counsel clears each.**
- **Betel (5 SKUs)**: areca nut sits under FDA import alert/detention; recommend the
  same restricted hold.
- Imported-food labeling (English ingredient/origin/nutrition) is the retailer's
  problem at point of sale; packaged-goods allergens come from the label — the app's
  fail-safe unknown-allergen model already handles absent data correctly (copy tweak:
  the "confirm with us" disclaimer assumes a kitchen).
- Non-food lines are fine to sell but **taxable** — per-item tax must land first.

## 9. Live infrastructure notes

- Supabase advisors: 58 security lints (headline items fixed in this PR; pgtap/
  plpgsql_check in `public` + materialized views in API + HIBP toggle remain);
  performance lints are minor (RLS initplan on 3 tables, unindexed/unused FK indexes).
- New filter/browse dimensions (brand, kind, stock, sku) need indexes when they land;
  search at 440 rows should move off `ilike` scans.

---

## Phased build plan (sized)

**Phase 0 — this PR (S):** security lockdown migration + feedback bucket privatization

- checkout service-client switch + this report.

**Phase 1 — sellable catalog (M):** schema migration (§5 columns + indexes +
`gen:types`); `scripts/import-grocery.ts` (CSV → upsert keyed on `sku`, category
canonicalization 39→~8, dedupe report, weight normalization, `--restricted` defaults
for MD\*/betel); grocery card variant + shelf-tag plate + detail-sheet facts ledger;
department taxonomy in rail; "Packing Your Order" label; admin menu pagination
(API already caps at 100 — the page would silently show 100 of ~520).

**Phase 2 — inventory + tax (M–L):** `stock_qty` + atomic decrement in the order RPC

- `restock_order_items` in 5 paths + `inventory_moves` ledger + admin stock UI +
  low-stock section in the existing daily-digest cron; per-item `is_taxable` end-to-end
  (server math, 3 client summaries, Stripe line, emails, proportional tax refund);
  `is_sold_out` re-check in `revalidateItemAvailability`; cart-persist versioning;
  percent-coupon fix.

**Phase 3 — scale (L):** menu payload pagination/virtualization + Fuse rail search +
brand/price facets; Buy-again rail + server favorites + reorder-append; bulk admin
(CSV round-trip, multi-select); weight-aware fees/routing; B2B wholesale channel
(`wholesale_price_cents` + `pcs_per_pack` already imported).

## Open decisions for the owner

1. **Merge gate** — this security PR (after CI + adversarial review).
2. **Apply the DB lockdown to prod now** (migration 1 is deployed-app-compatible;
   migration 2 — `REVOKE authenticated` on the order RPC — applies after deploy).
3. **Refund-Stripe wiring** — ship as the next PR? (Real money movement.)
4. **Percent-off coupon fix approach** — restrict coupons to product lines vs
   tax/tip via `payment_intent_data` vs amount_off-only.
5. **Catalog architecture** — confirm "extend `menu_items`" (recommended, §5).
6. **MD\*/betel hold** — confirm `is_restricted` import default despite "everything"
   scope (recommended), or import visible.
