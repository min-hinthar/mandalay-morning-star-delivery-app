# V5: Production-Grade Launch MVP

> **Target:** Battle-tested, revenue-ready Saturday delivery platform
> **Duration:** 12 weeks | **Start:** March 2026
> **Context:** V4 hardening complete → V5 fills ALL remaining gaps for real-money operations
> **Scale:** 50–150 orders/Sat | 3–6 drivers | Solo admin operator

---

## Deep-Dive Audit Findings

### Codebase Snapshot

| Metric        | Value        |
| ------------- | ------------ |
| Source files  | 1,018 TS/TSX |
| Total LOC     | 131,668      |
| UI components | 454          |
| API routes    | 97           |
| Custom hooks  | 54           |
| DB migrations | 35           |
| Unit tests    | 23           |
| E2E specs     | 20           |
| Design tokens | 62+          |

### Severity Summary

| Severity | Count | Key Areas                                                                                               |
| -------- | ----- | ------------------------------------------------------------------------------------------------------- |
| CRITICAL | 5     | Payment idempotency, race conditions, modifier validation, cutoff precision, cleanup rollback           |
| HIGH     | 9     | N+1 queries, type safety, auth gaps, modifier price drift, delivery gate staleness, missing validations |
| MEDIUM   | 14    | Hardcoded timezone, missing indexes, cart persistence, delivery windows, error format inconsistency     |
| LOW      | 11    | JSDoc gaps, logging gaps, generic audit reasons, pagination                                             |
| UX       | 18    | Search discoverability, checkout friction, mobile issues, accessibility gaps, missing features          |

---

## Critical Bug Fixes (Carry-Forward from V4 Audit)

### CRIT-01: Payment Idempotency Key Defeats Purpose

**File:** `src/app/api/orders/[id]/retry-payment/route.ts:205`

**Bug:** Idempotency key includes `Date.now()` — each retry generates a NEW unique key, allowing duplicate Stripe sessions. User can accidentally pay twice.

**Fix:** Use constant key: `` `retry_${order.id}` `` (Stripe returns same session on retry).

### CRIT-02: Cart Store Race Condition

**File:** `src/lib/stores/cart-store.ts:51-73`

**Bug:** `shouldDebounce()` reads/writes a shared global `recentAdditions` Map outside Zustand's atomic `set()` transaction. Two concurrent `addItem()` calls both pass the debounce check.

**Fix:** Move debounce tracking inside `set()` callback, or use React-level `useDebounce` on form submission.

### CRIT-03: Modifier Quantity Constraints Ignored at Checkout

**File:** `src/lib/utils/order.ts:185-206`

**Bug:** Server validates modifier existence and active status but IGNORES `min_select`/`max_select` constraints from `modifier_groups`. Customer can select 3 toppings when max is 2, or skip required selections.

**Fix:** Join with `modifier_groups` table; validate count per group against constraints.

### CRIT-04: Cutoff Time Off-by-Seconds

**File:** `src/app/api/checkout/session/route.ts:57`

**Bug:** Millisecond-precision comparison allows orders submitted at cutoff_hour:59:59 to pass server validation, but by the time DB insert completes, actual cutoff has passed.

**Fix:** Add 10-second safety buffer: `now.getTime() > cutoff.getTime() - 10000`

### CRIT-05: Checkout Cleanup Doesn't Rollback on Failure

**File:** `src/app/api/checkout/session/route.ts:301-346`

**Bug:** If item re-validation fails post-RPC, sequential delete calls have no error handling. If any delete fails, subsequent deletes skip — leaving orphan order data.

**Fix:** Wrap in RPC transaction, or try/catch each delete with logging.

---

## Phase 0 — Zero-Tolerance Bug Kill (Week 1)

**Goal:** Every critical and high-severity bug fixed + tested.

| ID    | Task                                            | Severity | File(s)                                           |
| ----- | ----------------------------------------------- | -------- | ------------------------------------------------- |
| BF-01 | Fix payment retry idempotency key               | CRITICAL | `api/orders/[id]/retry-payment/route.ts`          |
| BF-02 | Fix cart store debounce race condition          | CRITICAL | `stores/cart-store.ts`                            |
| BF-03 | Add modifier min/max validation at checkout     | CRITICAL | `utils/order.ts`, `api/checkout/session/route.ts` |
| BF-04 | Add cutoff time safety buffer (10s)             | CRITICAL | `api/checkout/session/route.ts`                   |
| BF-05 | Fix checkout cleanup with RPC transaction       | CRITICAL | `api/checkout/session/route.ts`                   |
| BF-06 | Fix N+1 query in admin orders list              | HIGH     | `api/admin/orders/route.ts`                       |
| BF-07 | Fix type assertion null crash on RPC result     | HIGH     | `api/checkout/session/route.ts:283`               |
| BF-08 | Add modifier price drift check at checkout      | HIGH     | `utils/order.ts`                                  |
| BF-09 | Add rate limit to address creation endpoint     | HIGH     | `api/addresses/route.ts`                          |
| BF-10 | Reduce delivery gate poll to 10s near cutoff    | HIGH     | `hooks/useDeliveryGate.ts`                        |
| BF-11 | Add refund amount ceiling (total_cents)         | MEDIUM   | `api/admin/orders/[id]/refund/route.ts`           |
| BF-12 | Add composite DB index (status, placed_at DESC) | MEDIUM   | New migration                                     |

**Acceptance:** All unit tests pass. 50-order load test under 500ms. Payment retry creates exactly 1 Stripe session. Cart debounce prevents duplicate adds within 300ms.

**Tests to Write:**

- Concurrent cart add race condition (2 simultaneous calls)
- Modifier constraint violations (min/max)
- Cutoff boundary: 1s before, at, 1s after
- Stripe idempotency: same retry = same session ID
- Cleanup rollback: simulate RPC success + validation failure

---

## Phase 1 — Menu Sync & Photo Pipeline (Weeks 2–3)

**Goal:** App menu matches live DoorDash/UberEats within 24 hours. Every item has a photo.

### Platform Landscape (Audited March 2026)

| Platform     | URL                                                      | Type                       | Pricing                 | Status                                 |
| ------------ | -------------------------------------------------------- | -------------------------- | ----------------------- | -------------------------------------- |
| order.online | order.online/store/mandalay-morning-star-covina-28733114 | DoorDash Commerce (direct) | Restaurant-set prices   | **404 — deactivated** (as of Mar 2026) |
| DoorDash     | doordash.com/store/mandalay-morning-star-covina-28733114 | Marketplace                | ~30% markup over direct | Active                                 |
| UberEats     | ubereats.com/store/mandalay-morning-star-burmese-kitchen | Marketplace                | ~30% markup over direct | Active                                 |
| order.store  | order.store/store/mandalay-morning-star                  | UberEats whitelabel        | Same as UberEats        | Active                                 |
| dine.online  | dine.online/mandalay-morning-star-burmese-kitchen-covina | Unknown                    | N/A                     | 404 — not active                       |

### Current Menu State (Updated March 3 2026)

| Metric                           | Count                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Items in seed YAML               | **53** (was 49; +4 added from platforms)                                                                            |
| Categories in app                | 8                                                                                                                   |
| Categories on platforms          | 7 (Noodles, Salads, Curries, Seafood Curries, Carbs, Soups, Drinks)                                                 |
| Modifier groups                  | 7                                                                                                                   |
| Items on platforms NOT in app    | ~~4~~ **0** — all added ✅                                                                                          |
| Items in app NOT on platforms    | 5 (Shan Noodles, Tom-Yum Fried Rice/Noodles, Balachaung, Acacia with Shrimp Curry, Hilsa Fish) — kept intentionally |
| Price mismatches (app vs direct) | ~~5~~ **0** — all resolved ✅                                                                                       |
| Menu photos downloaded           | **31** (28 UberEats + 3 DoorDash)                                                                                   |
| Items still missing photos       | **22** — need professional photography or admin upload                                                              |
| UberEats avg markup over direct  | 30.1%                                                                                                               |

### Price Discrepancies: App YAML vs order.online (Direct) — RESOLVED

| Item                    | App Price | Direct Price | Delta  | Decision                            |
| ----------------------- | --------- | ------------ | ------ | ----------------------------------- |
| Fish Paste Tomato Curry | $14.00    | $18.50       | +$4.50 | **KEPT at $14.00** — owner decision |
| Goat Bone Marrow Soup   | $12.00    | $19.00       | +$7.00 | ✅ **Updated to $19.00**            |
| Snakehead Innards Curry | $14.00    | $19.00       | +$5.00 | ✅ **Updated to $19.00**            |
| Fried Catfish Curry     | $19.00    | $14.00       | -$5.00 | ✅ **Updated to $14.00**            |
| Burmese Fried Rice      | $19.00    | $13.00       | -$6.00 | ✅ **Updated to $13.00**            |

### Missing Items: On Platforms but NOT in App — RESOLVED

| Item                                     | Direct Price | UberEats Price | Action                                         |
| ---------------------------------------- | ------------ | -------------- | ---------------------------------------------- |
| Chicken Gourd Curry (ကြက်ဗူးသီး)         | $14.00       | $18.50         | ✅ **ADDED** to seed YAML — curries-a-la-carte |
| Pinto Beans (ပဲရေပွကြော်)                | $14.00       | $18.50         | ✅ **ADDED** to seed YAML — vegetables         |
| Mixed Veggie & Shrimp Stir Fry Over Rice | $20.00       | $20.00         | ✅ **ADDED** to seed YAML — rice-noodles-soups |
| Coffee (ကော်ဖီ)                          | $6.50        | $6.50          | ✅ **ADDED** to seed YAML — drinks             |

### Missing Items: In App but NOT on Any Platform

| Item                         | App Price | Action                                                     |
| ---------------------------- | --------- | ---------------------------------------------------------- |
| Shan Noodles                 | $13.00    | VERIFY with owner — still offered?                         |
| Tom-Yum Fried Rice / Noodles | $16.00    | VERIFY — seasonal/discontinued?                            |
| Balachaung (condiment)       | $3.00     | VERIFY — side condiment not listed separately on platforms |
| Acacia with Shrimp Curry     | $14.00    | VERIFY — possibly seasonal                                 |
| Hilsa Fish                   | $24.00    | VERIFY — seasonal availability                             |

### Modifier vs Separate Item Discrepancies

Platforms list these as **separate items**; app uses **modifiers** on parent items:

| Platform Listing         | App Item                | App Modifier                         | Platform Price | Issue                                   |
| ------------------------ | ----------------------- | ------------------------------------ | -------------- | --------------------------------------- |
| Kyay-O SiChat            | Kyay-O / Si-Chat        | kyay_o_style → Si-Chat               | $24.00 (UE)    | OK — app handles correctly via modifier |
| Chicken Masala Curry     | Chicken Curry           | chicken_curry_style → Masala         | $18.50 (UE)    | OK — modifier approach is cleaner       |
| Beef Braised Curry       | Beef Curry              | beef_curry_style → Non-spicy braised | $24.50 (UE)    | OK                                      |
| Goat Offal Curry         | Goat Curry              | goat_curry_cut → Offal               | $40.50 (UE)    | OK                                      |
| Beef Pounded Fried Curry | Beef Pounded Deep Fried | (separate item)                      | $24.50 (UE)    | OK — already separate in app            |

### Category Mapping Differences

| App Category           | Platform Category | Notes                                       |
| ---------------------- | ----------------- | ------------------------------------------- |
| All-Day Breakfast      | Noodles           | Platforms don't use "breakfast" framing     |
| Rice / Noodles / Soups | Carbs + Soups     | Platforms split rice/carb dishes from soups |
| Sides                  | (within Carbs)    | Platforms fold sides into Carbs             |
| Curries (A la Carte)   | Curries           | Direct match                                |
| Vegetables             | Curries           | Platforms put veggie dishes under Curries   |
| Seafood Curries        | Seafood Curries   | Direct match                                |
| Appetizers / Salads    | Salads            | Platforms simplify to just "Salads"         |
| Drinks                 | Drinks            | Direct match                                |

### Tasks

| ID     | Task                                        | Status                                                                                                                                     | Details                                                                                                                              |
| ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| MS-01  | Fix price mismatches in seed YAML           | ✅ Done                                                                                                                                    | 4 of 5 updated (Goat Marrow→$19, Snakehead→$19, Fried Catfish→$14, Burmese Fried Rice→$13). Fish Paste Tomato kept at $14 per owner. |
| MS-02  | Add 4 missing items to seed YAML            | ✅ Done                                                                                                                                    | Chicken Gourd Curry ($14), Pinto Beans ($14), Mixed Veggie Shrimp Stir Fry Rice ($20), Coffee ($6.50)                                |
| MS-03  | Verify 5 app-only items with owner          | Pending                                                                                                                                    | Shan Noodles, Tom-Yum Fried Rice, Balachaung, Acacia Shrimp Curry, Hilsa Fish — still offered? Mark inactive if not                  |
| MS-04a | Extract menu photos from platforms          | ✅ Done                                                                                                                                    | 28 from UberEats + 3 from DoorDash = 31 photos in `data/menu-photos/`. See `manifest.json` for full inventory.                       |
| MS-04  | Reconcile "Mont Ti" vs "Nan-Gyi Mont Ti"    | Mont Ti ($17.50 on platforms) distinct from Nan-Gyi Mont Ti ($13.00 in app)? Already flagged in YAML `external_reference_items_unverified` |
| MS-05  | Build admin menu photo upload pipeline      | Supabase Storage bucket + image resize (WebP/AVIF) + CDN cache headers                                                                     |
| MS-06  | Admin bulk photo upload UI                  | Drag-drop grid — match photo to item by name/slug                                                                                          |
| MS-07  | Photo quality standards                     | Min 800×600, max 2MB, auto-crop to 4:3, blur placeholder generation                                                                        |
| MS-08  | Add `image_updated_at` column to menu_items | Track photo freshness; admin sees "No photo" / "Photo outdated" badges                                                                     |
| MS-09  | Allergen/tag deduplication cleanup          | `tags` and `allergens` arrays overlap (e.g., `contains_egg` tag + `egg` allergen). Pick one source of truth                                |
| MS-10  | Add Burmese descriptions (`description_my`) | Currently only `name_my` exists; descriptions are English-only                                                                             |
| MS-11  | Menu item "last synced" tracking            | Track when each item was last verified against platforms                                                                                   |
| MS-12  | Price history table                         | Track price changes with effective dates for audit trail                                                                                   |
| MS-13  | Add `external_platform_id` column           | Map app items to DoorDash/UberEats IDs for future automated sync                                                                           |

### Photo Pipeline Status — COMPLETE (53/53)

| Source                     | Photos | Items                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UberEats CDN               | 28     | burmese-fried-rice, burmese-milk-tea, century-egg-salad, chicken-curry, coconut-chicken-and-rice, duck-egg-curry, everything-salad, faluda, fermented-fish-paste-ngapi, goat-curry, goat-marrow-soup, kyay-o, mee-shay, mixed-veggie-shrimp-stir-fry-rice, mohinga, nan-gyi-mont-ti, ngapi-rice-salad, ohno-khao-swe, pickled-tea-salad, pork-curry, pork-horsegram-bean-curry, pork-offals-curry, pork-skewers, rice-with-pickled-tea-salad, river-prawns-curry, roselle-with-shrimp-curry, swai-fish-curry, tomato-salad |
| DoorDash CDN               | 3      | beef-curry, coconut-rice, parata                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Wikimedia Commons (CC)     | 9      | bamboo-shoot-mushroom-soup, coffee, fish-paste-tomato-curry, grilled-aubergine-salad, hilsa-fish, pinto-beans, rice, shan-noodles, tom-yum-fried-rice-or-noodles                                                                                                                                                                                                                                                                                                                                                           |
| AI-generated illustrations | 13     | acacia-with-shrimp-curry, balachaung, bamboo-shoot-with-pork-soup, beef-pounded-deep-fried, boneless-catfish-curry, chicken-giblets-curry, chicken-gourd-curry, crab-masala-curry, fried-catfish-curry, fried-fish-cake-curry, mixed-veggie-soup, snakehead-innards-curry, sweet-shrimps-curry                                                                                                                                                                                                                             |

**All 53 items covered.** Fallback photos in `data/menu-photos/` with `manifest.json`. These are FALLBACK only — admin-uploaded photos via `/admin/photos` always take priority. See `manifest.json` for upload priority hierarchy.

**Replace with real photos when available:** AI-generated (13) and approximate Wikimedia matches (9) should be upgraded via admin dashboard.

**Acceptance:** ~~All 5 price mismatches fixed.~~ ✅ 4 prices corrected, 1 kept per owner. ~~4 missing items added.~~ ✅ Done. Owner-verified 5 app-only items. ~~Every item has a real photo.~~ ✅ 53/53 have fallback photos (31 platform + 9 CC + 13 AI-generated). Admin-uploaded photos take priority. Allergens come from ONE source.

---

## Phase 2 — Checkout & Payment Hardening (Weeks 4–5)

**Goal:** Zero payment-related bugs. Customer never pays twice or gets charged wrong amount.

| ID    | Task                                                | Details                                                                        |
| ----- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| CP-01 | Remove `basePriceCents` from client checkout schema | Server calculates all prices; client only sends item IDs + modifier selections |
| CP-02 | Auto-refresh cart on 409 PRICE_CHANGED              | Instead of showing error, silently update prices and re-render                 |
| CP-03 | Validate modifier `item_index` bounds before RPC    | Ensure all modifier references valid                                           |
| CP-04 | Add delivery prep time buffer to time windows       | Configurable `prep_time_minutes` in app_settings                               |
| CP-05 | Prevent duplicate Saturday orders per user          | DB constraint or checkout validation                                           |
| CP-06 | Add promo code field + discount logic               | Stripe coupon integration; admin creates codes                                 |
| CP-07 | Add tip selector (15%/20%/25%/custom)               | Store in order; pass to Stripe as metadata                                     |
| CP-08 | Add delivery instructions field                     | "Leave at door", "Ring bell", etc. — stored on order                           |
| CP-09 | Guest checkout flow                                 | Anonymous cart → sign in at payment step only                                  |
| CP-10 | Checkout success logging                            | Log successful checkouts for debugging "paid but no confirmation" cases        |

**Acceptance:** Customer can't submit invalid prices. Tips flow through to Stripe. Guest browsing works. Duplicate Saturday orders blocked.

---

## Phase 3 — Customer UX Overhaul (Weeks 6–7)

**Goal:** First-time visitor understands Saturday-only model in 3 seconds. Repeat customer reorders in 10 seconds.

### Navigation & Discovery

| ID    | Task                                  | Details                                                                           |
| ----- | ------------------------------------- | --------------------------------------------------------------------------------- |
| UX-01 | Persistent mobile search bar          | Search collapses to icon on mobile — make it always visible with placeholder text |
| UX-02 | Dietary filter chips                  | Vegan, Gluten-Free, Spicy toggle filters above menu grid                          |
| UX-03 | Sold-out items pushed to bottom       | Search results and grid sort active items first                                   |
| UX-04 | Item scroll indicator on detail sheet | Visual "more below" hint when modifiers overflow viewport                         |
| UX-05 | Saturday schedule hero banner         | Dynamic: "Order for this Saturday" / "Next delivery: Saturday Mar 14"             |
| UX-06 | Cutoff countdown in cart drawer       | "Order by Friday 3 PM (2h 14m left)"                                              |

### Cart & Checkout UX

| ID    | Task                                      | Details                                                  |
| ----- | ----------------------------------------- | -------------------------------------------------------- |
| UX-07 | Minimum order warning in cart             | Show inline when below threshold, not just at checkout   |
| UX-08 | Sticky checkout footer on mobile          | Total + "Checkout" button always visible                 |
| UX-09 | Auto-select first available delivery date | Don't require user to manually pick obvious choice       |
| UX-10 | Cart sync status indicator                | "Saved" / "Saving..." badge                              |
| UX-11 | Network offline banner                    | Prominent "Offline Mode" badge when browsing cached menu |

### Post-Order UX

| ID    | Task                        | Details                                                                  |
| ----- | --------------------------- | ------------------------------------------------------------------------ |
| UX-12 | One-tap reorder button      | Order history → "Reorder" populates cart with previous items + modifiers |
| UX-13 | Post-delivery rating prompt | Push rating modal 2 minutes after delivery confirmation                  |
| UX-14 | Order share link            | "Share your order" for social proof                                      |

### Accessibility Fixes

| ID      | Task                                       | Details                                           |
| ------- | ------------------------------------------ | ------------------------------------------------- |
| A11Y-01 | Focus rings on interactive cards           | `focus-visible:ring-2 focus-visible:ring-primary` |
| A11Y-02 | Keyboard delete for cart items             | Delete key handler with confirmation              |
| A11Y-03 | Drawer handle aria-label                   | `aria-label="Drag to dismiss drawer"`             |
| A11Y-04 | Error messages linked via aria-describedby | Form validation → field association               |
| A11Y-05 | Status indicators beyond color-only        | Add icons/patterns alongside color coding         |
| A11Y-06 | Disable 3D tilt on keyboard focus          | Prevent disorienting parallax for keyboard users  |

**Acceptance:** Lighthouse accessibility score ≥ 95. Mobile search always visible. Reorder in <3 taps. Minimum order shown before checkout.

---

## Phase 4 — Admin Operations Center (Week 8)

**Goal:** Solo admin processes 50+ orders from a single screen.

| ID     | Task                           | Details                                                                   |
| ------ | ------------------------------ | ------------------------------------------------------------------------- |
| OPS-01 | Real-time ops dashboard        | Live order status counts with quick-action buttons                        |
| OPS-02 | Bulk status change             | Checkbox select → "Confirm All" / "Mark Preparing" / "Ready to Ship"      |
| OPS-03 | Time window grouping           | Orders grouped by delivery slot (11am: 12, 1pm: 8)                        |
| OPS-04 | Unassigned orders badge        | Red indicator for orders not on a route                                   |
| OPS-05 | Driver availability widget     | Who's ready, who hasn't arrived                                           |
| OPS-06 | Cutoff countdown timer         | Visible countdown to order close                                          |
| OPS-07 | One-click route creation       | Select orders + driver = route (no SQL)                                   |
| OPS-08 | Auto-suggest route grouping    | Geography + time window clustering                                        |
| OPS-09 | Reassign orders between routes | Drag-drop or modal transfer                                               |
| OPS-10 | Admin settings form            | Edit cutoff_hour, delivery_fee, free_threshold, radius — no deploy needed |
| OPS-11 | Email status dashboard         | Per-order email state (sent/pending/failed) + one-click retry             |
| OPS-12 | Menu photo management          | Grid view with upload, crop, replace per item                             |

**Acceptance:** Bulk confirm 20 orders in one click. Create 5-stop route in <30s. Change cutoff hour from admin UI.

---

## Phase 5 — Driver Experience v2 (Week 9)

**Goal:** Non-technical family member completes 5 stops with zero training.

| ID     | Task                              | Details                                                                |
| ------ | --------------------------------- | ---------------------------------------------------------------------- |
| DRV-01 | Simple mode default               | Customer name, address, phone, `[Mark Delivered]` — that's it          |
| DRV-02 | Confirmation dialogs              | "Mark as delivered at 123 Main St?"                                    |
| DRV-03 | One-tap customer contact          | Phone call / text button on each stop                                  |
| DRV-04 | Offline instructions              | "Route saved. Will sync when reconnected."                             |
| DRV-05 | Hide advanced features by default | Route optimization, exception modals, earnings dashboard behind toggle |
| DRV-06 | Turn-by-turn navigation link      | Open Google Maps/Apple Maps with stop address                          |
| DRV-07 | Delivery photo capture            | Required photo proof on delivery completion                            |

**Acceptance:** Family member completes route without training. No accidental "completed" on wrong stop.

---

## Phase 6 — Configurable Business Rules (Week 10)

**Goal:** All operational parameters editable from admin UI.

| ID     | Task                                           | Details                                   |
| ------ | ---------------------------------------------- | ----------------------------------------- |
| CFG-01 | Move cutoff_hour + cutoff_day to app_settings  | Currently hardcoded                       |
| CFG-02 | Move delivery_fee_cents to app_settings        | Currently in store constant               |
| CFG-03 | Move free_delivery_threshold_cents             | Currently $100 hardcoded                  |
| CFG-04 | Move delivery_start_hour / delivery_end_hour   | Time window boundaries                    |
| CFG-05 | Move max_delivery_radius_miles                 | Coverage area                             |
| CFG-06 | Move timezone to env var                       | Currently hardcoded "America/Los_Angeles" |
| CFG-07 | Server reads app_settings with 5-min TTL cache | Single source of truth                    |
| CFG-08 | Admin Settings page                            | Form to edit all configurable values      |

**Acceptance:** Change cutoff from 3PM to 5PM. Takes effect immediately. No deploy.

---

## Phase 7 — Production Hardening (Weeks 11–12)

**Goal:** Secure, monitored, performant for real traffic.

### Security

| ID     | Task                                             | Details                                          |
| ------ | ------------------------------------------------ | ------------------------------------------------ |
| SEC-01 | Endpoint-specific rate limits                    | 5 req/min for auth, 20 for menu, 10 for checkout |
| SEC-02 | Fix in-memory rate limit memory leak             | Use LRU cache (10K max entries)                  |
| SEC-03 | Driver ownership check on all driver API queries | Prevent cross-driver data access                 |
| SEC-04 | Webhook audit logging (body hash + signature)    | Stripe + Resend verification                     |
| SEC-05 | CSP review                                       | Ensure all third-party scripts whitelisted       |

### Performance

| ID      | Task                                 | Details                                                    |
| ------- | ------------------------------------ | ---------------------------------------------------------- |
| PERF-01 | Fix N+1 query in admin orders        | Use computed column or app-tier calculation                |
| PERF-02 | Composite indexes                    | (status, placed_at DESC), (user_id, delivery_window_start) |
| PERF-03 | Admin pagination with total counts   | "Showing X of Y"                                           |
| PERF-04 | Preload first 4 menu item images     | Remove lazy loading from above-fold items                  |
| PERF-05 | Bundle analysis + tree-shaking audit | Target <200KB first-load JS                                |

### Error Handling & Observability

| ID     | Task                              | Details                                              |
| ------ | --------------------------------- | ---------------------------------------------------- |
| OBS-01 | Standardize error response format | All routes: `{ error: { code, message, details? } }` |
| OBS-02 | Add success logging for checkout  | Order ID, total, user ID                             |
| OBS-03 | Sentry integration review         | All critical paths instrumented                      |
| OBS-04 | Uptime monitoring                 | Health check endpoint + alerting                     |
| OBS-05 | Database backup automation        | Daily Supabase backup + verification                 |

### Testing

| ID     | Task                           | Details                                   |
| ------ | ------------------------------ | ----------------------------------------- |
| TST-01 | Concurrent cart addition tests | Race condition scenarios                  |
| TST-02 | Stripe webhook failure tests   | Payment intent transitions                |
| TST-03 | RLS policy edge case tests     | Multi-user permission scenarios           |
| TST-04 | Cutoff boundary tests          | DST transitions, 1s before/after          |
| TST-05 | Refund calculation tests       | Rounding errors, ceiling checks           |
| TST-06 | Full Saturday dry run          | 20 test orders through complete lifecycle |
| TST-07 | Load test                      | 50 concurrent checkout submissions        |

**Acceptance:** Load test passes (50 concurrent orders, all APIs <500ms). Zero security warnings. 100% critical path test coverage. Sentry capturing in production.

---

## Pre-Launch Checklist

### Infrastructure

- [ ] Supabase production instance (separate from staging)
- [ ] Production env vars set (Stripe live keys, Resend domain, Sentry DSN)
- [ ] Vercel production deployment configured
- [ ] DNS + custom domain pointed
- [ ] Google Maps API billing enabled (with budget cap)
- [ ] Upstash Redis provisioned
- [ ] Database backup strategy verified
- [ ] SSL certificate valid

### Verification

- [ ] All Phase 0 bugs fixed + regression tests
- [ ] Stripe webhook tested with real test payments (then switch to live)
- [ ] Email delivery confirmed — all templates (confirmation, reminder, tracking, feedback)
- [ ] Resend domain verified + SPF/DKIM
- [ ] Full Saturday dry run: 20 orders through complete lifecycle
- [ ] Mobile testing: iOS Safari, Android Chrome, PWA install
- [ ] Performance: Lighthouse ≥ 90 across all pages
- [ ] Accessibility: axe-core zero violations
- [ ] SEO: meta tags, OG images, structured data

### Operations

- [ ] Admin knows how to use ops dashboard
- [ ] Driver(s) have completed test deliveries
- [ ] Customer support flow defined (email? phone?)
- [ ] Refund process documented
- [ ] Emergency procedures (site down, payment issues, order cancellation)

---

## What NOT to Build Yet

At 50–150 orders/Saturday with family drivers, these are premature:

- **Real-time GPS map for customers** — text status updates suffice
- **Push notifications via service worker** — email + SMS covers it
- **Customer loyalty / referral system** — get first 100 regulars first
- **Multi-admin role system** — solo operator for now
- **Multi-location support** — single Covina kitchen
- **Subscription/recurring orders** — not enough volume
- **Live chat support** — email response adequate at this scale
- **Advanced analytics** — simple counts + revenue enough
- **Multi-language full translation** — Burmese names exist; full i18n later
- **Social media integration** — manual sharing sufficient

Revisit when orders exceed 200/week or driver pool exceeds 6.

---

## Timeline

| Week  | Phase                       | Deliverables                                                                       |
| ----- | --------------------------- | ---------------------------------------------------------------------------------- |
| 1     | Phase 0: Bug Kill           | 12 critical/high bugs fixed, regression tests                                      |
| 2–3   | Phase 1: Menu Sync          | 5 price fixes, 4 item additions, 5 verifications, photo pipeline, allergen cleanup |
| 4–5   | Phase 2: Checkout Hardening | Payment safety, tips, promo codes, guest checkout                                  |
| 6–7   | Phase 3: Customer UX        | Search, filters, reorder, accessibility, mobile fixes                              |
| 8     | Phase 4: Admin Ops          | Bulk ops, route creation, settings, email dashboard                                |
| 9     | Phase 5: Driver v2          | Simple mode, photo proof, offline                                                  |
| 10    | Phase 6: Config Rules       | All business rules admin-editable                                                  |
| 11–12 | Phase 7: Hardening          | Security, perf, testing, dry run, launch prep                                      |

**Total Tasks:** 100
**Estimated LOC Change:** ~8,000–12,000 (net new + modifications)
**Menu Data Changes:** 4 price corrections applied (1 kept per owner), 4 new items added (53 total), 31 photos extracted from platforms, 22 items need professional photos, 5 items pending owner verification

---

## Risk Register

| Risk                                  | Likelihood | Impact   | Mitigation                                                                                      |
| ------------------------------------- | ---------- | -------- | ----------------------------------------------------------------------------------------------- |
| Stripe webhook failures lose orders   | Medium     | Critical | Webhook retry + manual reconciliation dashboard                                                 |
| Menu photos not available from owner  | High       | Medium   | Use DoorDash/UberEats photos as reference; take new photos                                      |
| Driver app offline during delivery    | Medium     | High     | IndexedDB queue already built; test thoroughly                                                  |
| Cutoff time confusion for customers   | High       | Medium   | Phase 3 hero banner + countdown + post-cutoff modal                                             |
| Google Maps API quota exceeded        | Low        | High     | Budget caps + fallback to Leaflet                                                               |
| Supabase free tier limits hit         | Medium     | Critical | Monitor usage; upgrade to Pro before launch                                                     |
| App prices out of sync with platforms | High       | High     | 5 mismatches found; platforms update without notification. Build periodic sync check            |
| Pricing strategy unclear              | Medium     | Medium   | Direct (order.online) = base price; UberEats/DoorDash add ~30%. App should match direct pricing |

---

## Success Metrics (4 weeks post-launch)

| Metric                                          | Target      |
| ----------------------------------------------- | ----------- |
| Orders per Saturday                             | 30+         |
| Checkout completion rate                        | >70%        |
| Average order value                             | >$40        |
| Order accuracy (no wrong items)                 | >98%        |
| Delivery on-time rate                           | >90%        |
| Customer return rate (2nd order within 4 weeks) | >25%        |
| Admin time per Saturday (order processing)      | <30 minutes |
| Zero payment double-charges                     | 100%        |
| Email delivery rate                             | >95%        |
| Page load time (LCP)                            | <2.5s       |
